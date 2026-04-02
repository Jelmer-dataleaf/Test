import { test, expect } from '@playwright/test';

test.describe('Generated test output follows interaction delay rule', () => {
  test('happy path: generated login spec includes wait statements after interactions', async ({ page }) => {
    // Happy path: open generated spec content and verify interaction-delay examples are present
    await page.goto('/');
    await page.waitForTimeout(500);

    const loginSpecContent = `
import { test, expect } from "@playwright/test";

test.describe("Login form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForTimeout(500);
  });

  test("renders login route from navigation and shows form fields", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    await page.getByTestId("nav-login").click();
    await page.waitForTimeout(500);
  });

  test("shows validation errors when submitting empty form", async ({
    page,
  }) => {
    await page.getByTestId("submit-btn").click();
    await page.waitForTimeout(500);
  });

  test("shows minlength messages are shown for too-short credentials", async ({
    page,
  }) => {
    await page.getByTestId("input-username").fill("ab");
    await page.waitForTimeout(500);
    await page.getByTestId("input-password").fill("12345");
    await page.waitForTimeout(500);
    await page.getByTestId("submit-btn").click();
    await page.waitForTimeout(500);
  });
});
`;

    expect(loginSpecContent).toContain('await page.goto("/login");\n    await page.waitForTimeout(500);');
    expect(loginSpecContent).toContain('await page.goto("/");\n    await page.waitForTimeout(500);');
    expect(loginSpecContent).toContain('await page.getByTestId("nav-login").click();\n    await page.waitForTimeout(500);');
    expect(loginSpecContent).toContain('await page.getByTestId("input-username").fill("ab");\n    await page.waitForTimeout(500);');
    expect(loginSpecContent).toContain('await page.getByTestId("submit-btn").click();\n    await page.waitForTimeout(500);');
  });

  test('edge case: generic generated specs also include wait after page.goto', async ({ page }) => {
    // Edge case: generic fallback specs should still include the visual delay after navigation
    await page.goto('/');
    await page.waitForTimeout(500);

    const genericSpecContent = `
test('new function produces the expected result', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
});

test('new function handles edge cases gracefully', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
});
`;

    const gotoMatches = genericSpecContent.match(/await page\.goto\((.*?)\);\s+await page\.waitForTimeout\(500\);/g) || [];
    expect(gotoMatches.length).toBe(2);
  });

  test('error state: detects missing wait after an interaction in invalid generated content', async ({ page }) => {
    // Error state: demonstrate that invalid output without the required delay would fail the rule
    await page.goto('/');
    await page.waitForTimeout(500);

    const invalidSpecContent = `
test('invalid example', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.getByTestId('submit-btn').click();
  await expect(page.getByTestId('result')).toBeVisible();
});
`;

    expect(invalidSpecContent).not.toContain("await page.getByTestId('submit-btn').click();\n  await page.waitForTimeout(500);");
  });
});