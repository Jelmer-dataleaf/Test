"use strict";

require("dotenv").config();

const { getLastCommitDiff } = require("./gitChecker");
const { analyzeChanges } = require("./changeAnalyzer");
const { generateTest } = require("./testGenerator");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(step, message) {
  console.log(`[Step ${step}] ${message}`);
}

function bail(message, exitCode = 1) {
  console.error(`\n[ERROR] ${message}`);
  process.exit(exitCode);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  Auto Playwright Test Generator          ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // ── Step 1: Check the last git commit ─────────────────────────────────────
  log(1, "Reading last git commit…");

  let commitInfo;
  try {
    commitInfo = getLastCommitDiff();
  } catch (err) {
    bail(
      `Could not read git history: ${err.message}\n` +
        "Ensure you are inside a git repository with at least two commits.",
    );
  }

  console.log(`       Hash    : ${commitInfo.hash}`);
  console.log(`       Message : ${commitInfo.message}`);
  console.log(`       Author  : ${commitInfo.author}`);
  console.log(`       Files   : ${commitInfo.changedFiles.length} changed`);
  console.log(`       Added   : ${commitInfo.addedLines.length} line(s)\n`);

  if (!commitInfo.hasNewCode) {
    console.log(
      "[AutoTestGen] No new lines detected in the last commit — nothing to test.",
    );
    process.exit(0);
  }

  // ── Step 2: Analyse what changed ──────────────────────────────────────────
  log(2, "Analysing code changes…");

  const analysis = analyzeChanges(commitInfo);

  console.log(
    `       File types : ${analysis.fileTypes.join(", ") || "(none detected)"}`,
  );
  console.log(
    `       Patterns   : ${analysis.detectedPatterns.join(", ") || "generic (no specific pattern matched)"}\n`,
  );

  // ── Step 3: Generate Playwright test ──────────────────────────────────────
  const mode =
    process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT
      ? "AI (Azure OpenAI)"
      : process.env.OPENAI_API_KEY
        ? "AI (OpenAI)"
        : "template-based";
  log(3, `Generating Playwright test using ${mode} strategy…`);

  let testPath;
  try {
    testPath = await generateTest(commitInfo, analysis);
  } catch (err) {
    bail(`Test generation failed: ${err.message}`);
  }

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  Done!                                   ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\nTest file : ${testPath}`);
  console.log(`Run with  : npx playwright test "${testPath}"\n`);
}

main();
