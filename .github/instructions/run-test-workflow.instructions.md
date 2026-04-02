---
applyTo: "src/index.js"
---

# Skill: Run Test Workflow

## Purpose

Controls the overall orchestration: what runs, in what order, and how failures are handled.

---

## Default Workflow (3 steps)

```
Step 1 → getLastCommitDiff()    [gitChecker.js]
            ↓ hasNewCode?
           NO → exit 0 (nothing to test)
           YES ↓
Step 2 → analyzeChanges()       [changeAnalyzer.js]
            ↓
Step 3 → generateTest()         [testGenerator.js]
            ↓
         Write .spec.ts to tests/generated/
         Print run command
```

---

## Customisation Options

### 1. Run Playwright immediately after generation

Add an `execSync` call at the end of `main()` to auto-execute the generated test:

```js
const { execSync } = require("child_process");

// At the end of main(), after testPath is known:
console.log("\nRunning generated test…");
try {
  execSync(`npx playwright test "${testPath}" --reporter=list`, {
    stdio: "inherit",
  });
} catch {
  // Playwright exits non-zero on test failure — that is expected
}
```

### 2. Gate on a minimum number of added lines

Skip generation if the commit only added trivial changes (e.g. comment-only edits):

```js
const MIN_ADDED_LINES = parseInt(process.env.MIN_ADDED_LINES || "3", 10);

if (commitInfo.addedLines.length < MIN_ADDED_LINES) {
  console.log(
    `[AutoTestGen] Only ${commitInfo.addedLines.length} line(s) added — below threshold, skipping.`,
  );
  process.exit(0);
}
```

Set `MIN_ADDED_LINES=10` in `.env` to activate.

### 3. Open the generated test file in VS Code automatically

```js
const { execSync } = require("child_process");
execSync(`code "${testPath}"`);
```

### 4. Post a GitHub PR comment with the generated test path

Useful in CI pipelines:

```js
// Requires GITHUB_TOKEN, GITHUB_REPOSITORY, and PR_NUMBER env vars
const { execSync } = require("child_process");

if (process.env.GITHUB_TOKEN && process.env.PR_NUMBER) {
  const body = `Auto-generated Playwright test: \`${testPath}\``;
  execSync(`gh pr comment ${process.env.PR_NUMBER} --body "${body}"`, {
    env: { ...process.env },
  });
}
```

### 5. Watch mode: re-run on every new commit

Wrap `main()` in a polling loop:

```js
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "5000", 10);
let lastHash = "";

async function watch() {
  while (true) {
    const commitInfo = getLastCommitDiff();
    if (commitInfo.hash !== lastHash) {
      lastHash = commitInfo.hash;
      await main();
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}
watch();
```

---

## Environment Variables Summary

| Variable           | Default                 | Description                                   |
| ------------------ | ----------------------- | --------------------------------------------- |
| `OPENAI_API_KEY`   | _(empty)_               | Enables AI test generation when set           |
| `OPENAI_MODEL`     | `gpt-4o`                | OpenAI model to use                           |
| `OPENAI_BASE_URL`  | _(OpenAI default)_      | Override for Azure / Ollama / other providers |
| `BASE_URL`         | `http://localhost:3000` | Playwright `baseURL` — must point to your app |
| `GIT_COMMIT_RANGE` | `HEAD~1 HEAD`           | Override the diff range                       |
| `MIN_ADDED_LINES`  | `1`                     | Skip generation below this threshold          |
| `POLL_INTERVAL_MS` | `5000`                  | Polling interval in watch mode                |

All variables can be set in `.env` (copy from `.env.example`).

---

## Error Handling

| Situation              | Behaviour                            |
| ---------------------- | ------------------------------------ |
| Not in a git repo      | `bail()` → exit 1 with message       |
| Only one commit exists | `bail()` → exit 1 with guidance      |
| No new code in diff    | `process.exit(0)` — not an error     |
| OpenAI API error       | `bail()` → exit 1 with error message |
| File write error       | `bail()` → exit 1 with error message |
