---
applyTo: "src/testGenerator.js"
---

# Skill: Generate Playwright Test

## Purpose

Controls how the agent turns a commit analysis into a runnable Playwright `.spec.ts` file.  
Two strategies are available: **AI-powered** (requires `OPENAI_API_KEY`) and **template-based** (zero config).

---

## Strategy Selection

| Condition                         | Strategy used                     |
| --------------------------------- | --------------------------------- |
| `OPENAI_API_KEY` is set in `.env` | AI generation via OpenAI Chat API |
| No API key present                | Deterministic template generation |

---

## AI Strategy (`generateWithAI`)

### Model

Default: `gpt-4o`. Override with `OPENAI_MODEL` in `.env`:

```
OPENAI_MODEL=gpt-4-turbo
```

### System prompt

The system prompt instructs the model to output **only** TypeScript test code  
with no markdown fences. To change its behaviour, edit the `content` array inside  
`generateWithAI()`:

```js
messages: [
  {
    role: 'system',
    content: [
      'You are an expert Playwright test engineer.',
      // ← add or remove instruction lines here
      'Always use the Page Object Model pattern.',
      'Organise tests in describe blocks by feature, not by file.',
    ].join('\n'),
  },
  ...
]
```

### Diff / file truncation

| Constant         | Default | Purpose                                  |
| ---------------- | ------- | ---------------------------------------- |
| `MAX_DIFF_CHARS` | `6000`  | Max characters of diff sent to the model |
| `MAX_FILE_CHARS` | `1500`  | Max characters per file sent as context  |

Increase these for richer context; decrease to reduce token cost.

### Temperature

Default: `0.2` (deterministic). Set higher (e.g. `0.7`) for more varied tests:

```js
temperature: 0.7,
```

---

## Template Strategy (`generateFromTemplate`)

The template strategy maps each detected pattern to a pre-built test block:

| Pattern                                  | Template block                                        |
| ---------------------------------------- | ----------------------------------------------------- |
| `react-components`, `angular-components` | `componentBlock` — renders component, clicks button   |
| `api-routes`                             | `apiBlock` — GET 200 and POST invalid-data 4xx        |
| `page-routes`                            | `pageRouteBlock` — navigates to route, checks heading |
| `functions`, `exports`                   | `functionBlock` — page load + edge case               |
| _(none / fallback)_                      | `genericBlock` — basic page load                      |

### Adding a new template block

1. Create a function that returns a `string` containing a `test.describe(…)` block.
2. Register it in `buildTestBlocks()`:

```js
if (patterns.includes("your-pattern-name")) {
  blocks.push(yourNewBlock(analysis));
}
```

Example:

```js
function graphqlBlock(analysis) {
  return `test.describe('GraphQL resolvers', () => {
  test('query returns expected data', async ({ request }) => {
    const response = await request.post('/graphql', {
      data: { query: '{ yourQuery { id } }' },
    });
    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.yourQuery).toBeDefined();
  });
});`;
}
```

---

## Output Location

Generated files land in `tests/generated/` with the naming convention:

```
commit-<shortHash>-<YYYY-MM-DDTHH-MM-SS>.spec.ts
```

To change the output directory, update `OUTPUT_DIR` at the top of `testGenerator.js`:

```js
const OUTPUT_DIR = path.join(process.cwd(), "tests", "auto");
```

---

## Using a Different AI Provider

Replace the OpenAI client with any OpenAI-compatible endpoint by setting  
`OPENAI_BASE_URL` in `.env` (works with Azure OpenAI, Ollama, etc.):

```
OPENAI_BASE_URL=https://your-azure-resource.openai.azure.com/
OPENAI_API_KEY=your-azure-key
OPENAI_MODEL=gpt-4o
```

The `openai` npm package supports `baseURL` natively.
