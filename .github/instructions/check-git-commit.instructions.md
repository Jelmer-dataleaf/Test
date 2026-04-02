---
applyTo: "src/gitChecker.js"
---

# Skill: Check Git Commit

## Purpose

Controls how the agent reads the most-recent git commit to discover new code that needs tests.

---

## Default Behaviour

`src/gitChecker.js` runs the following git commands and exposes a structured result object:

| Command                            | Purpose                         |
| ---------------------------------- | ------------------------------- |
| `git log -1 --format=%H`           | Full commit hash                |
| `git log -1 --format=%h`           | Short hash (used in file names) |
| `git log -1 --format=%s`           | Commit subject / message        |
| `git log -1 --format=%an`          | Author name                     |
| `git log -1 --format=%ai`          | ISO date                        |
| `git diff HEAD~1 HEAD`             | Full unified diff               |
| `git diff --name-only HEAD~1 HEAD` | Changed file paths              |

Lines are considered "new code" when they start with `+` but **not** `+++`  
(the `+++` prefix is a diff file header, not actual code).

---

## Customisation Options

### 1. Change the commit range

By default the diff covers `HEAD~1..HEAD` (last single commit).  
To inspect a different range, edit the `git()` calls in `gitChecker.js`:

```js
// Last 3 commits
const diff = git("diff HEAD~3 HEAD");
const changedFiles = git("diff --name-only HEAD~3 HEAD");
```

Or read from an environment variable so no code change is needed:

```js
const range = process.env.GIT_COMMIT_RANGE || "HEAD~1 HEAD";
const diff = git(`diff ${range}`);
```

Set `GIT_COMMIT_RANGE=HEAD~5 HEAD` in `.env` to activate.

### 2. Filter by file extension

To limit analysis to specific languages, filter `changedFiles` after the git call:

```js
const INCLUDE_EXTS = (process.env.GIT_INCLUDE_EXTENSIONS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

// … inside getLastCommitDiff():
if (INCLUDE_EXTS.length) {
  changedFiles = changedFiles.filter((f) =>
    INCLUDE_EXTS.some((ext) => f.endsWith(ext)),
  );
}
```

### 3. Exclude lock files / generated files

```js
const EXCLUDE_PATTERNS = ["package-lock.json", "yarn.lock", ".min.js", "dist/"];

changedFiles = changedFiles.filter(
  (f) => !EXCLUDE_PATTERNS.some((p) => f.includes(p)),
);
```

### 4. Compare against a branch instead of previous commit

```js
const base = process.env.GIT_BASE_BRANCH || "main";
const diff = git(`diff ${base}...HEAD`);
```

---

## Return Object Shape

```ts
{
  hash:         string;   // full SHA
  shortHash:    string;   // abbreviated SHA (7 chars)
  message:      string;   // commit subject
  author:       string;
  date:         string;   // ISO 8601
  diff:         string;   // full unified diff text
  changedFiles: string[]; // relative file paths
  addedLines:   string[]; // lines beginning with '+'
  hasNewCode:   boolean;  // true when addedLines.length > 0
}
```

---

## Edge Cases Handled

- **Single-commit repo** (`HEAD~1` does not exist): throws a descriptive error  
  before any git command runs — caught in `src/index.js`.
- **Empty diff** (e.g. merge commit with no actual change): `hasNewCode` is `false`  
  and the workflow exits early with a clear message.
