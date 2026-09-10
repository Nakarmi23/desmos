// Sequential Reviewer — pick-then-implement-then-review loop
//
// This template drives a three-phase workflow per issue:
//   Phase 0 (Pick):       A lightweight sonnet agent reads the open-issue backlog (and open
//                         PRs, to skip issues already in flight) and picks exactly one issue,
//                         with no sandbox setup and no repo writes. Its output seeds the
//                         branch/worktree name for the phases below — createSandbox() needs
//                         that name up front, before an issue is known, so picking has to
//                         happen in its own phase ahead of it.
//   Phase 1 (Implement): A sonnet agent implements the picked issue on a dedicated branch
//                        named after it, commits the changes, and signals completion.
//   Phase 2 (Review):    A second sonnet agent reviews the branch diff, either approves it
//                        or makes corrections directly on the branch, then opens a PR.
//
// Phases 1 and 2 share a single sandbox created via createSandbox(), so the implementer and
// reviewer work on the same explicit branch. Phase 0 runs in its own throwaway sandbox since
// no branch name exists yet to anchor a shared one.
//
// The outer loop repeats up to MAX_ITERATIONS times, processing one issue per iteration and
// stopping early once the backlog is exhausted (the pick phase finds nothing actionable, or an
// implement phase produces no commits).
//
// Usage:
//   npx tsx .sandcastle/main.mts
// Or add to package.json:
//   "scripts": { "sandcastle": "npx tsx .sandcastle/main.mts" }

import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Maximum number of pick→implement→review cycles to run before stopping.
// Each cycle works on one issue. Raise this to process more issues per run.
const MAX_ITERATIONS = 10;

// Hooks run inside the sandbox before the agent starts each iteration.
// pnpm install ensures the sandbox always has fresh dependencies. Only the
// implement/review sandbox needs this — the pick phase never touches code.
const hooks = {
  sandbox: { onSandboxReady: [{ command: "pnpm install" }] },
};

// Copy node_modules from the host into the worktree before each sandbox
// starts. Avoids a full npm install from scratch; the hook above handles
// platform-specific binaries and any packages added since the last copy.
const copyToWorktree = ["node_modules"];

// Turns an issue title into a short branch-safe slug, e.g.
// "Fix login redirect loop!" -> "fix-login-redirect-loop".
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
  console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`);

  // ---------------------------------------------------------------------
  // Phase 0: Pick
  //
  // Runs in its own throwaway sandbox — read-only `gh`/`git` inspection,
  // no node_modules, no commits expected. Its structured output seeds the
  // branch name so the worktree the later phases share is named after the
  // issue instead of a bare timestamp.
  // ---------------------------------------------------------------------
  const pick = await sandcastle.run({
    name: "picker",
    maxIterations: 1,
    agent: sandcastle.claudeCode("claude-opus-4-8"),
    sandbox: docker(),
    promptFile: "./.sandcastle/pick-prompt.md",
    output: sandcastle.Output.string({ tag: "issue" }),
  });

  const [rawNumber, ...titleParts] = pick.output.split("|");
  const issueNumber = rawNumber?.trim();
  const issueTitle = titleParts.join("|").trim();

  if (!issueNumber) {
    // Empty <issue></issue> means the backlog is exhausted or everything
    // left is blocked/in-flight — there is nothing left to pick.
    console.log("Pick phase found no actionable issue. Stopping.");
    break;
  }

  const branch = `sandcastle/issue-${issueNumber}-${slugify(issueTitle)}`;

  // Create a single sandbox that both the implementer and reviewer share.
  // This gives both agents a real, named branch that persists across phases.
  const sandbox = await sandcastle.createSandbox({
    branch,
    sandbox: docker(),
    hooks,
    copyToWorktree,
  });

  try {
    // -----------------------------------------------------------------------
    // Phase 1: Implement
    //
    // A sonnet agent implements the issue picked in Phase 0 (passed in via
    // {{ISSUE_NUMBER}} — it does not re-pick from the backlog), writes the
    // implementation (using RGR: Red → Green → Repeat → Refactor), and
    // commits the result.
    //
    // The agent signals completion via <promise>COMPLETE</promise> when done.
    // -----------------------------------------------------------------------
    // One iteration so each outer pass implements the picked issue on its
    // own branch, then hands it to the reviewer. A higher value would let
    // the agent wander onto unrelated work on this one branch, defeating
    // the per-issue review.
    const implement = await sandbox.run({
      name: "implementer",
      maxIterations: 1,
      agent: sandcastle.claudeCode("claude-opus-4-8"),
      promptFile: "./.sandcastle/implement-prompt.md",
      promptArgs: {
        ISSUE_NUMBER: issueNumber,
      },
    });

    if (!implement.commits.length) {
      // No commits means the agent got blocked on this issue — nothing to
      // review or open a PR for, so stop rather than burn further
      // iterations against the same backlog.
      console.log(`Implementation agent made no commits for #${issueNumber}. Stopping.`);
      break;
    }

    console.log(`\nImplementation complete on branch: ${branch}`);
    console.log(`Commits: ${implement.commits.length}`);

    // -----------------------------------------------------------------------
    // Phase 2: Review
    //
    // A second sonnet agent reviews the diff of the branch produced by
    // Phase 1. It uses the {{BRANCH}} prompt argument to inspect the right
    // branch, either approves or makes corrections directly on the branch,
    // then opens a PR (linked to the issue via "Closes #<number>") for a
    // human to merge.
    // -----------------------------------------------------------------------
    await sandbox.run({
      name: "reviewer",
      maxIterations: 1,
      agent: sandcastle.claudeCode("claude-opus-4-8"),
      promptFile: "./.sandcastle/review-prompt.md",
      promptArgs: {
        BRANCH: branch,
      },
    });

    console.log("\nReview complete, and PR created.");
  } finally {
    await sandbox.close();
  }
}

console.log("\nAll done.");
