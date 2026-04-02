"use strict";

const fs = require("fs");
const path = require("path");

// openai package exposes both OpenAI and AzureOpenAI clients.
let OpenAI, AzureOpenAI;
try {
  ({ OpenAI, AzureOpenAI } = require("openai"));
} catch {
  OpenAI = null;
  AzureOpenAI = null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTPUT_DIR = path.join(process.cwd(), "tests", "generated");
const MAX_DIFF_CHARS = 6000;
const MAX_FILE_CHARS = 1500;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a Playwright `.spec.ts` file for the supplied commit and writes it
 * to `tests/generated/`.  Uses the OpenAI API when `OPENAI_API_KEY` is set;
 * falls back to a structured template otherwise.
 *
 * @param {object} commitInfo  - result from gitChecker.getLastCommitDiff()
 * @param {object} analysis    - result from changeAnalyzer.analyzeChanges()
 * @returns {Promise<string>}  path of the written test file
 */
async function generateTest(commitInfo, analysis) {
  const useAzure =
    process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT;
  const useOpenAI = process.env.OPENAI_API_KEY;

  const testContent =
    useAzure || useOpenAI
      ? await generateWithAI(commitInfo, analysis)
      : generateFromTemplate(commitInfo, analysis);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputPath = path.join(
    OUTPUT_DIR,
    `commit-${commitInfo.shortHash}-${timestamp}.spec.ts`,
  );

  fs.writeFileSync(outputPath, testContent, "utf-8");
  return outputPath;
}

// ─── AI generation ────────────────────────────────────────────────────────────

async function generateWithAI(commitInfo, analysis) {
  if (!OpenAI || !AzureOpenAI) {
    throw new Error(
      "openai package is not installed. Run `npm install` and try again.",
    );
  }

  let client;
  let model;

  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    // Azure OpenAI
    client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-10-21",
    });
    model = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  } else {
    // Standard OpenAI
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    model = process.env.OPENAI_MODEL || "gpt-4o";
  }

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: [
          "You are an expert Playwright test engineer.",
          "Output ONLY valid TypeScript test code — no markdown fences, no explanations.",
          "Use @playwright/test. Add a brief inline comment per test block.",
          "Include happy-path, edge-case, and error-state tests where applicable.",
          "Prefer data-testid selectors; fall back to ARIA roles.",
          "After every user interaction (page.goto, .click(), .fill(), .check(), .selectOption(), .type()), add 'await page.waitForTimeout(500);' on the next line so testers can visually follow the test execution.",
        ].join("\n"),
      },
      {
        role: "user",
        content: buildAIPrompt(commitInfo, analysis),
      },
    ],
  });

  return response.choices[0].message.content ?? "";
}

function buildAIPrompt(commitInfo, analysis) {
  const diffSnippet = commitInfo.diff.slice(0, MAX_DIFF_CHARS);

  const fileContext = analysis.filesWithContext
    .filter((f) => f.content)
    .map((f) => `--- ${f.path} ---\n${f.content.slice(0, MAX_FILE_CHARS)}`)
    .join("\n\n");

  return [
    `Generate Playwright tests (TypeScript) for the following git commit.`,
    ``,
    `Commit : ${commitInfo.hash}`,
    `Message: ${commitInfo.message}`,
    `Files  : ${analysis.changedFiles.join(", ")}`,
    `Patterns detected: ${analysis.detectedPatterns.join(", ") || "generic"}`,
    ``,
    `=== Git diff (new code only) ===`,
    diffSnippet,
    ``,
    `=== Current file contents ===`,
    fileContext,
  ].join("\n");
}

// ─── Template generation ──────────────────────────────────────────────────────

function generateFromTemplate(commitInfo, analysis) {
  const header = buildHeader(commitInfo);
  const blocks = buildTestBlocks(analysis);

  return [header, ...blocks].join("\n\n");
}

function buildHeader(commitInfo) {
  return [
    `// Auto-generated Playwright test`,
    `// Commit : ${commitInfo.hash}`,
    `// Message: ${commitInfo.message}`,
    `// Author : ${commitInfo.author}`,
    `// Date   : ${commitInfo.date}`,
    `// Generated at: ${new Date().toISOString()}`,
    ``,
    `import { test, expect } from '@playwright/test';`,
  ].join("\n");
}

function buildTestBlocks(analysis) {
  const patterns = analysis.detectedPatterns;
  const blocks = [];

  if (
    patterns.includes("react-components") ||
    patterns.includes("angular-components")
  ) {
    const formInfo = detectFormInfo(analysis);
    blocks.push(formInfo ? formBlock(formInfo) : componentBlock(analysis));
  }

  if (patterns.includes("api-routes")) {
    blocks.push(apiBlock());
  }

  if (patterns.includes("page-routes")) {
    blocks.push(pageRouteBlock(analysis));
  }

  if (patterns.includes("functions") || patterns.includes("exports")) {
    blocks.push(functionBlock(analysis));
  }

  if (blocks.length === 0) {
    blocks.push(genericBlock());
  }

  return blocks;
}

// ─── Form detection ──────────────────────────────────────────────────────────

/**
 * If any changed file looks like a reactive form component, return structured
 * info about it so we can generate validation-aware tests.
 */
function detectFormInfo(analysis) {
  const htmlFile = analysis.filesWithContext.find(
    (f) =>
      f.extension === ".html" &&
      f.content &&
      /formControlName|formGroup/.test(f.content),
  );
  if (!htmlFile) return null;

  const tsFile = analysis.filesWithContext.find(
    (f) => f.extension === ".ts" && f.content && /Validators/.test(f.content),
  );

  // Extract all data-testid values from the HTML
  const testIds = [];
  const testIdRegex = /data-testid=["']([^"']+)["']/g;
  let m;
  while ((m = testIdRegex.exec(htmlFile.content)) !== null) {
    testIds.push(m[1]);
  }

  // Detect the page route from the file path (e.g. register-form -> /register)
  const routeMatch = htmlFile.path.match(/components[\\/]([\w-]+)[\\/]/);
  const route = routeMatch
    ? `/${routeMatch[1].replace(/-form$|-page$/, "")}`
    : "/";

  // Collect input testIds and their types
  const inputRegex =
    /<input[^>]*data-testid=["']([^"']+)["'][^>]*type=["']([^"']+)["']|<input[^>]*type=["']([^"']+)["'][^>]*data-testid=["']([^"']+)["']/g;
  const inputs = [];
  while ((m = inputRegex.exec(htmlFile.content)) !== null) {
    inputs.push({ testId: m[1] || m[4], type: m[2] || m[3] });
  }
  // Also pick up textareas
  const taRegex = /<textarea[^>]*data-testid=["']([^"']+)["']/g;
  while ((m = taRegex.exec(htmlFile.content)) !== null) {
    inputs.push({ testId: m[1], type: "textarea" });
  }

  const submitId = testIds.find((id) => /submit/.test(id)) || null;
  const formId =
    testIds.find((id) => /form/.test(id) && !/error/.test(id)) || null;
  const successId = testIds.find((id) => /success|banner/.test(id)) || null;
  const errorIds = testIds.filter((id) => /error/.test(id));

  // Extract required validator hints from TS source
  const requiredFields = tsFile
    ? [...tsFile.content.matchAll(/['"](\w+)['"].*?Validators\.required/g)].map(
        (x) => x[1],
      )
    : [];

  return {
    route,
    testIds,
    inputs,
    submitId,
    formId,
    successId,
    errorIds,
    requiredFields,
  };
}

// ─── Individual template blocks ───────────────────────────────────────────────

function formBlock(info) {
  const {
    route,
    inputs,
    submitId,
    formId,
    successId,
    errorIds,
    requiredFields,
  } = info;

  const fillInputs = inputs
    .filter((i) => i.type !== "checkbox")
    .map((i) => {
      const val =
        i.type === "email"
          ? "test@example.com"
          : i.type === "number"
            ? "25"
            : i.type === "password"
              ? "SecurePass1"
              : "Test Value";
      return `    await page.getByTestId('${i.testId}').fill('${val}');`;
    })
    .join("\n");

  const checkboxInputs = inputs
    .filter((i) => i.type === "checkbox")
    .map((i) => `    await page.getByTestId('${i.testId}').check();`)
    .join("\n");

  const submitLine = submitId
    ? `await page.getByTestId('${submitId}').click();`
    : `await page.getByRole('button', { name: /submit|register|send/i }).click();`;
  const successLine = successId
    ? `await expect(page.getByTestId('${successId}')).toBeVisible();`
    : `await expect(page.getByRole('alert')).toBeVisible();`;
  const formVisible = formId
    ? `await expect(page.getByTestId('${formId}')).toBeVisible();`
    : `await expect(page.getByRole('form')).toBeVisible();`;

  const emptySubmitAsserts = errorIds.length
    ? errorIds
        .map(
          (id) => `    await expect(page.getByTestId('${id}')).toBeVisible();`,
        )
        .join("\n")
    : `    // TODO: assert validation error messages are shown`;

  const requiredAsserts = requiredFields.length
    ? requiredFields
        .map((f) => {
          const inputTestId =
            inputs.find((i) => i.testId.includes(f))?.testId || `input-${f}`;
          const errorTestId =
            errorIds.find((id) => id.includes(f)) || `error-${f}`;
          return `
  test('shows error when ${f} is empty', async ({ page }) => {
    await page.goto('${route}');
    await page.getByTestId('${inputTestId}').focus();
    await page.getByTestId('${inputTestId}').blur();
    await expect(page.getByTestId('${errorTestId}')).toBeVisible();
  });`;
        })
        .join("\n")
    : "";

  return `test.describe('Form — ${route}', () => {
  test('renders the form', async ({ page }) => {
    await page.goto('${route}');
    ${formVisible}
  });

  test('shows validation errors when submitted empty', async ({ page }) => {
    await page.goto('${route}');
    ${submitLine}
${emptySubmitAsserts}
  });
${requiredAsserts}
  test('submits successfully with valid data', async ({ page }) => {
    await page.goto('${route}');
${fillInputs}
${checkboxInputs}
    ${submitLine}
    ${successLine}
  });
});`;
}

function componentBlock(analysis) {
  const label = analysis.changedFiles.join(", ");
  return `test.describe('Component — ${label}', () => {
  test('renders without errors', async ({ page }) => {
    // TODO: replace with the actual URL that mounts this component
    await page.goto('/');
    const component = page.getByTestId('new-component');
    await expect(component).toBeVisible();
  });

  test('responds to user interaction', async ({ page }) => {
    await page.goto('/');
    // TODO: trigger the relevant interaction and assert the outcome
    await page.getByRole('button').first().click();
    await expect(page.getByTestId('new-component')).toBeVisible();
  });
});`;
}

function apiBlock() {
  return `test.describe('API endpoints', () => {
  test('new endpoint returns 200 for valid request', async ({ request }) => {
    // TODO: replace with the real endpoint path
    const response = await request.get('/api/your-new-endpoint');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('new endpoint rejects invalid payloads', async ({ request }) => {
    const response = await request.post('/api/your-new-endpoint', {
      data: { invalid: true },
    });
    // TODO: adjust expected status (400/422/…)
    expect([400, 422]).toContain(response.status());
  });
});`;
}

function pageRouteBlock(analysis) {
  const pages = analysis.changedFiles
    .filter((f) => /page\.|route\.|pages\//.test(f))
    .map((f) =>
      f
        .replace(/^.*pages\//, "/")
        .replace(/\/page\.(tsx?|jsx?)$/, "")
        .replace(/\\/g, "/"),
    );

  const route = pages[0] || "/new-route";

  return `test.describe('Page route — ${route}', () => {
  test('loads the page', async ({ page }) => {
    await page.goto('${route}');
    await expect(page).toHaveURL(new RegExp(${JSON.stringify(route.replace(/^\//, ""))}));
  });

  test('displays expected heading', async ({ page }) => {
    await page.goto('${route}');
    // TODO: replace selector with the real heading on this page
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});`;
}

function functionBlock(analysis) {
  const label = analysis.changedFiles.join(", ");
  return `test.describe('Logic changes — ${label}', () => {
  test('new function produces the expected result', async ({ page }) => {
    // TODO: navigate to the page that exercises the new function
    await page.goto('/');
    // TODO: trigger the code path and assert the visible outcome
    await expect(page).toHaveTitle(/.+/);
  });

  test('new function handles edge cases gracefully', async ({ page }) => {
    await page.goto('/');
    // TODO: simulate an edge-case input and assert no crash / correct output
  });
});`;
}

function genericBlock() {
  return `test.describe('Commit changes', () => {
  test('application still loads after the commit', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });

  // TODO: add targeted assertions once you know which feature was changed
});`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateTest };
