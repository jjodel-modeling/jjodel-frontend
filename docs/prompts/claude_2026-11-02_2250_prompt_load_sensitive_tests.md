# Tests that fail under load: codegen generation budget and traceMonitor

Prompt-ID: P-2026-11-02-2250
Chat: C-2026-11-02-1319
Front: maintenance
Status: eseguito 2026-11-02 · lane fast · ac2ee82f8 · verifica visiva non applicabile
Lane: fast (tests only unless the cause says otherwise)
Depends: none
Worktree: ~/jjodel-w-cgbudget, branch codegen-tests-budget (from the trunk tip)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · Alfonso, 2026-11-02 22:48, see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-cgbudget` on
`codegen-tests-budget`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2250 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

Today direct merges ended blocked on tests that pass alone: `src/codegen/engine/__tests__/defaultText.test.ts` and
`src/codegen/textual/__tests__/textual.test.ts` (`expect(out.errors).toEqual([])`, `spec.ts:76`), and twice on two tests of
`scripts/gates/__tests__/traceMonitor.test.ts` (`expected null to be 2`). Evidence in `docs/log-inbox/maintenance.md`,
P-2026-11-02-2045 and 2222. A red gate that means nothing hides a real regression.

The causes are hypotheses until measured: the 2000 ms generation budget (R-GEN-28), and `spawnSync` killed by a timeout.

1. Measure. Reproduce under load (run the files with CPU hogs alongside, or the full vitest set) and capture the text of the
   error in `out.errors` and the `error`/`signal` of the `spawnSync`. No fix before the text is in the report. If the cause is
   not time, it may be a real defect: stop with `Outcome: question` and a `Recommended:` line.
2. If time: in the tests only, pass a generous time budget through the existing `limits` of the generation, and a longer
   timeout to `spawnSync`. Search the test tree for other tests with the same exposure and treat those of the same shape; list
   them. The production budget of 2000 ms does not change. A test that asserts the budget itself keeps its limit.
3. Verify: the same load run that reproduced the failure, now green, at least three times.

## DOVE

The two codegen test files and their `spec.ts`, `scripts/gates/__tests__/traceMonitor.test.ts`, other test files of the same
shape. Out of scope: `src/codegen/engine/text.ts` and any production file.

## Lane discipline

`git add <specific files>` only. Conventional commit in English, one line, suffix `(P-2026-11-02-2250)`. Gates from `frontend/`
through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npm run typecheck:scripts`, `npx vitest run src/codegen
scripts/gates`, `npm run check:docs`. Verifica visiva non applicabile. Log entry in `docs/log-inbox/maintenance.md`, Status
flip in the same docs-only commit. No push, no merge. Report closes with «Decisions taken (unattended)» and «Decisions awaiting
Alfonso», then `Outcome: done | hard-stop | question | blocked`.
