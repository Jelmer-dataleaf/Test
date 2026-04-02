"use strict";

const { execSync } = require("child_process");

/**
 * Runs a git command and returns trimmed stdout.
 * Throws a descriptive error if git is not available or the repo has no commits.
 */
function git(args) {
  return execSync(`git ${args}`, { encoding: "utf-8" }).trim();
}

/**
 * Returns true when the repository has at least two commits so that a
 * HEAD~1..HEAD diff is always valid.
 */
function hasEnoughCommits() {
  try {
    git("rev-parse HEAD~1");
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves metadata and the full diff of the last commit.
 *
 * @returns {{
 *   hash: string,
 *   shortHash: string,
 *   message: string,
 *   author: string,
 *   date: string,
 *   diff: string,
 *   changedFiles: string[],
 *   addedLines: string[],
 *   hasNewCode: boolean
 * }}
 */
function getLastCommitDiff() {
  if (!hasEnoughCommits()) {
    throw new Error(
      "Repository has only one commit. At least two commits are required to compute a diff.",
    );
  }

  const hash = git("log -1 --format=%H");
  const shortHash = git("log -1 --format=%h");
  const message = git("log -1 --format=%s");
  const author = git("log -1 --format=%an");
  const date = git("log -1 --format=%ai");
  const diff = git("diff HEAD~1 HEAD");
  const changedFiles = git("diff --name-only HEAD~1 HEAD")
    .split("\n")
    .filter(Boolean);

  // Lines that were added (start with '+' but not the '+++' file header)
  const addedLines = diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));

  return {
    hash,
    shortHash,
    message,
    author,
    date,
    diff,
    changedFiles,
    addedLines,
    hasNewCode: addedLines.length > 0,
  };
}

module.exports = { getLastCommitDiff };
