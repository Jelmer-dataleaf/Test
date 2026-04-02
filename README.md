# Auto Playwright Test Generator

Automatically generates Playwright `.spec.ts` tests from every git commit using AI (Azure OpenAI or standard OpenAI) or a smart template fallback — and commits them back to your branch via a GitHub Actions workflow.

---

## How it works

```
Push code
  └─► GitHub Actions triggers
        ├─ Step 1: Read last commit diff  (gitChecker.js)
        ├─ Step 2: Analyse what changed   (changeAnalyzer.js)
        ├─ Step 3: Generate .spec.ts      (testGenerator.js)
        │           ├─ Azure OpenAI  ◄── preferred (uses your deployment)
        │           ├─ OpenAI        ◄── fallback if no Azure key
        │           └─ Template      ◄── zero-config fallback
        └─ Step 4: Commit spec back to branch [skip ci]
```

Generated files land in `tests/generated/` named `commit-<hash>-<timestamp>.spec.ts`.

---

## Repository structure

```
├── src/
│   ├── index.js             # Orchestrator (Steps 1-3)
│   ├── gitChecker.js        # Reads last commit diff via git CLI
│   ├── changeAnalyzer.js    # Detects patterns (forms, components, API routes…)
│   └── testGenerator.js     # Generates tests (AI or template)
├── tests/
│   └── generated/           # Auto-generated Playwright specs (committed by CI)
├── demo-app/                # Angular demo application used by the generated tests
│   └── src/app/
│       ├── components/
│       │   ├── task-list/
│       │   ├── task-detail/
│       │   ├── task-search/
│       │   ├── contact-form/
│       │   ├── register-form/
│       │   ├── feedback-form/
│       │   ├── newsletter-form/
│       │   ├── login-form/
│       │   └── meme-page/
│       └── services/
│           └── task.service.ts
├── .github/
│   ├── workflows/
│   │   └── auto-test-generator.yml
│   └── instructions/        # Copilot instruction files for each module
├── playwright.config.js
└── package.json
```

---

## Demo app pages

The Angular demo app (served on `http://localhost:4200`) contains these routes:

| Route          | Description                                      |
| -------------- | ------------------------------------------------ |
| `/tasks`       | Task list with add/complete/delete               |
| `/tasks/:id`   | Task detail view                                 |
| `/search`      | Search tasks by keyword                          |
| `/contact`     | Contact form (name, email, message)              |
| `/register`    | Registration form with password match validation |
| `/feedback`    | Feedback form with category, rating, character counter |
| `/newsletter`  | Newsletter subscription (email + first name)     |
| `/login`       | Login form with show/hide password toggle        |
| `/meme`        | Random meme page (fetches from meme-api.com)     |

---

## Getting started

### Prerequisites

- Node.js 22+
- Git

### Install

```bash
npm install
npx playwright install chromium   # install browser binaries
```

### Configure AI generation (optional)

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Azure OpenAI (recommended):**

```env
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-10-21
```

**Standard OpenAI (fallback):**

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

If neither key is set, the generator falls back to the built-in template strategy.

### Run locally

Start the Angular dev server first:

```bash
cd demo-app
npm install
npm start          # serves on http://localhost:4200
```

Then in a separate terminal, generate a test from the last commit:

```bash
npm run generate
```

Run all generated tests:

```bash
npm run test:generated
# or for a single browser:
npx playwright test --project=chromium
```

---

## GitHub Actions setup

The workflow (`.github/workflows/auto-test-generator.yml`) runs on every push.

Add these to your repository **Secrets** (Settings → Secrets and variables → Actions):

| Secret                  | Description                      |
| ----------------------- | -------------------------------- |
| `AZURE_OPENAI_API_KEY`  | Your Azure OpenAI API key        |

Add these as **Variables** (same page → Variables tab):

| Variable                   | Default                                              |
| -------------------------- | ---------------------------------------------------- |
| `AZURE_OPENAI_ENDPOINT`    | `https://dataleaf-openai-intern.openai.azure.com/`   |
| `AZURE_OPENAI_DEPLOYMENT`  | `gpt-5.4`                                            |
| `AZURE_OPENAI_API_VERSION` | `2024-10-21`                                         |
| `BASE_URL`                 | `http://localhost:4200`                              |

> **Never commit API keys.** The `.env` file is in `.gitignore`.

---

## Template fallback

When no AI key is configured the generator inspects the changed files and produces targeted tests automatically:

| Detected pattern      | Generated tests                                                  |
| --------------------- | ---------------------------------------------------------------- |
| Angular/React form    | Renders form · empty-submit errors · per-field required checks · successful submit |
| Angular component     | Renders without errors · responds to interaction                 |
| API routes            | GET 200 · POST invalid data 4xx                                  |
| Page routes           | Loads page · displays heading                                    |
| Functions / exports   | Expected result · edge case                                      |

Form detection reads `data-testid` attributes directly from the HTML template so selectors are always accurate.

---

## Scripts

| Command                    | Description                                  |
| -------------------------- | -------------------------------------------- |
| `npm run generate`         | Generate a test from the last git commit     |
| `npm test`                 | Run all Playwright tests (all browsers)      |
| `npm run test:generated`   | Run only the auto-generated specs            |
