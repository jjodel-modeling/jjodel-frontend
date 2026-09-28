# Prompt: harness fixes, the six known vitest reds and the known-repairs list of check:addonly

Prompt-ID: P-2026-09-28-2332
Chat: C-2026-09-28-1936
Lane: fast (scripts only: gates, lane-run tests; no discovery). Tier: light.
Status: da eseguire

Worktree: `~/jjodel-w-harness2`, branch `harness-reds-repairs` (cut by the chat from `alfonso-frontend-jjtl` at `fb044365b`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-harness2`, branch `harness-reds-repairs`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Every merge worker on the trunk now stops on six vitest reds that no branch introduced, and the chat closes the merges by hand. Measured by P-2026-09-28-2305:

- 2 in `scripts/gates/__tests__/traceIndex.test.ts`, 2 in `traceMonitor.test.ts`, 1 in `scripts/hooks/__tests__/laneRun.test.ts` (the monitor): they fail under the node on PATH (`~/.nvm/versions/node/v23.3.0`) and pass under `~/.local/bin/node` (v26).
- `checkRange` (from the `log-addonly-gate` merge, P-2026-09-28-2001/2211): it counts the first-parent history of the current branch, so it fails on any branch whose history differs from the trunk's.

And `npm run check:addonly -- --range 65eb5475b..HEAD` refuses `e2448cf61`, the hand repair of `447e4239b`, made before the `Log-Repair:` trailer existed.

Goal: the full vitest green on the trunk under the node the merge worker uses, and the range check clean, without weakening any test's meaning.

## DOVE

- The five node-dependent tests and the code under test (`scripts/gates/trace-index.ts`, `trace-monitor.ts`, `lane-run.mjs` monitor path): find which node feature or behaviour differs between v23 and v26 and make code or test independent of it; or, if the tests must run on node ≥ 26, make the merge worker's gate use that node explicitly (`lane-run.mjs`, where it spawns vitest) and say so. Prefer the first.
- `scripts/gates/__tests__/checkAddonly.test.ts` (or wherever `checkRange` lives): the test must not depend on which branch is checked out; build its own repository or pin its range to fixed commits.
- `scripts/gates/check-addonly.ts`: a known-repairs list, one entry: `e2448cf61` repairs `447e4239b`, with a one-line reason; a commit in the list is exempt exactly as if it carried `Log-Repair:`; the report names it.
- Tests for all of the above; closure: `docs/log-inbox/harness.md` and this prompt's Status.

No file under `frontend/src`. No change to `docs/PROTOCOL.md` or `CLAUDE.md`.

## COME

1. Read `CLAUDE.md` (§6, §21.2), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, RC-34, and the three test files and their targets.
2. Measure first: the six reds under v23 and under v26, with the failing assertion and its message.
3. Tests first where a behaviour changes; for the known-repairs list: `e2448cf61` exempt and named, a commit not in the list still refused.
4. Gates: `typecheck:scripts` exit 0; the full vitest under the v23 node on PATH (the worker's) with 0 failed besides the 9 files red at import (name them); `check:scripts`; `check:docs`; `npm run check:addonly -- --range 65eb5475b..HEAD` clean with `e2448cf61` reported exempt. A mutation bench on the new code.
5. Commits: one `fix(harness): ...` per cause (node dependency, checkRange, known repairs), then one docs commit with the log entry and this prompt's Status.
6. Do not merge. Stop with `Outcome: hard-stop`, the shas, the counts before and after, and the cause of the five node-dependent reds in one sentence.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file.

## RIFERIMENTI

- RC-34; the closing reports of P-2026-09-28-2001, 2211, 2305 in `~/.jjodel-lanes/`.
