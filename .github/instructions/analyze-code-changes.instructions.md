---
applyTo: "src/changeAnalyzer.js"
---

# Skill: Analyse Code Changes

## Purpose

Controls how the agent inspects the raw git diff to classify _what kind_ of code was added, so the test generator can choose the right test strategy.

---

## Default Behaviour

`src/changeAnalyzer.js` runs a set of **regex pattern detectors** against the diff text and the changed file paths.  
Each pattern that matches is added to `analysis.detectedPatterns[]`.

| Pattern name         | What it detects                                                    |
| -------------------- | ------------------------------------------------------------------ |
| `functions`          | New `function` declarations or arrow functions assigned to `const` |
| `classes`            | New `class` declarations                                           |
| `exports`            | Exported functions / classes / variables                           |
| `react-components`   | JSX returns or `React.FC` / `defineComponent` signatures           |
| `angular-components` | `@Component(…)` decorator                                          |
| `api-routes`         | Express/Fastify/NestJS route registrations or decorators           |
| `page-routes`        | File paths matching Next.js / Nuxt / SvelteKit page conventions    |

For each **changed file**, the analyser also reads its current content from disk  
(up to the first `MAX_FILE_CHARS` characters) to give the test generator  
the full context it needs.

---

## Customisation Options

### 1. Add a new pattern detector

Append an entry to the `PATTERNS` array in `changeAnalyzer.js`:

```js
{
  name: 'graphql-resolvers',
  regex: /^[+].*@(?:Query|Mutation|Resolver)\s*\(/m,
},
```

Use `matchAgainst: 'files'` to match against the list of changed file paths  
instead of the diff text:

```js
{
  name: 'sql-migrations',
  regex: /migrations\/.*\.sql$/,
  matchAgainst: 'files',
},
```

### 2. Adjust the maximum file content read

In `testGenerator.js`, `MAX_FILE_CHARS` caps how much of each file is forwarded  
to the AI (default: `1500` chars). Increase this for richer context or decrease  
it to keep prompts short:

```js
const MAX_FILE_CHARS = 3000; // read more of each file
```

### 3. Exclude test files from analysis

If you don't want existing test files to influence pattern detection, filter them  
before the loop:

```js
// inside analyzeChanges(), replace the fileSet build with:
const fileSet = new Set(
  commitInfo.changedFiles.filter((f) => !/\.spec\.|\.test\./.test(f)),
);
```

### 4. Add framework-specific metadata

You can enrich the analysis object with any extra field the test generator  
can key on:

```js
analysis.isNextJs = commitInfo.changedFiles.some(
  (f) => f.includes("pages/") || f.includes("app/"),
);
analysis.isExpress = analysis.detectedPatterns.includes("api-routes");
```

---

## Return Object Shape

```ts
{
  changedFiles:     string[];       // all files touched in the commit
  fileTypes:        string[];       // unique extensions, e.g. ['.ts', '.tsx']
  detectedPatterns: string[];       // matched pattern names (see table above)
  filesWithContext: Array<{
    path:      string;
    extension: string;
    content:   string | null;       // null if file is unreadable / deleted
  }>;
}
```
