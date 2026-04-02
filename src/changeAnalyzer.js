"use strict";

const fs = require("fs");
const path = require("path");

// ─── Pattern detectors ────────────────────────────────────────────────────────

const PATTERNS = [
  {
    name: "functions",
    regex: /^[+].*(?:function\s+\w+|\bconst\s+\w+\s*=\s*(?:async\s*)?\()/m,
  },
  {
    name: "classes",
    regex: /^[+].*\bclass\s+\w+/m,
  },
  {
    name: "exports",
    regex:
      /^[+].*\bexport\s+(?:default\s+)?(?:function|class|const|let|var)\b/m,
  },
  {
    name: "react-components",
    // JSX return or React function component signature
    regex:
      /^[+].*(?:return\s*\(\s*<[A-Z]|React\.FC|React\.Component|defineComponent)/m,
  },
  {
    name: "angular-components",
    regex: /^[+].*@Component\s*\(/m,
  },
  {
    name: "api-routes",
    // Express / Fastify / NestJS route decorators
    regex:
      /^[+].*(?:router\.\s*(?:get|post|put|delete|patch)|app\.\s*(?:get|post|put|delete|patch)|@(?:Get|Post|Put|Delete|Patch)\s*\()/m,
  },
  {
    name: "page-routes",
    // Next.js / Nuxt / SvelteKit page files
    regex: /(?:pages\/|app\/.*page\.|routes\/.*\+page\.|route\.ts$)/,
    matchAgainst: "files", // match against file paths, not diff
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyses the changed files from a commit and returns a structured summary
 * that the test generator can act on.
 *
 * @param {import('./gitChecker').CommitInfo} commitInfo
 * @returns {ChangeAnalysis}
 */
function analyzeChanges(commitInfo) {
  /** @type {ChangeAnalysis} */
  const analysis = {
    changedFiles: commitInfo.changedFiles,
    fileTypes: [],
    detectedPatterns: [],
    filesWithContext: [],
  };

  const fileSet = new Set(commitInfo.changedFiles);
  const extSet = new Set();

  // Detect patterns in the raw diff
  for (const pattern of PATTERNS) {
    const haystack =
      pattern.matchAgainst === "files"
        ? commitInfo.changedFiles.join("\n")
        : commitInfo.diff;

    if (pattern.regex.test(haystack)) {
      analysis.detectedPatterns.push(pattern.name);
    }
  }

  // Collect per-file context
  for (const filePath of fileSet) {
    const ext = path.extname(filePath).toLowerCase();
    extSet.add(ext);

    let content = null;
    if (fs.existsSync(filePath)) {
      try {
        content = fs.readFileSync(filePath, "utf-8");
      } catch {
        // unreadable — leave null
      }
    }

    analysis.filesWithContext.push({ path: filePath, extension: ext, content });
  }

  analysis.fileTypes = Array.from(extSet);

  return analysis;
}

module.exports = { analyzeChanges };

/**
 * @typedef {{
 *   changedFiles:     string[],
 *   fileTypes:        string[],
 *   detectedPatterns: string[],
 *   filesWithContext: Array<{ path: string, extension: string, content: string|null }>
 * }} ChangeAnalysis
 */
