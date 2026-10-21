# Ontological instantiation, S3a continuation 1: gates, code commit, mutation bench

Prompt-ID: P-2026-10-21-1635
Chat: C-2026-10-21-1405
Front: instance-of
Lane: full (problems/ is in the critical-zone table of CLAUDE.md 3.1; Layer Impact Report in the discovery and restated by P-2026-10-21-1600)
Status: da eseguire
Request: none (the chat has no shareable URL; Alfonso's words are kept with --request)
Depends: P-2026-10-21-1600
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3a`, branch `oi-s3a` at `78d91320b`, **with the uncommitted work of P-2026-10-21-1600 in the
tree, as expected**: `git diff --stat 78d91320b` shows exactly `EditorV2.tsx`, `hooks/__tests__/instantiate.test.ts`,
`hooks/instantiate.ts`, `problems/NodeProblemOverlay.tsx`, `problems/registry.ts` (282 insertions, 54 deletions), and
three untracked files in `problems/` (`InstantiationProblemSync.tsx`, `instantiationToProblems.ts`,
`__tests__/instantiationToProblems.test.ts`), besides gitignored throwaways. Anything else: stop with
`Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1635 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 60 minutes. **This lane is short on purpose: the previous one hit the context ceiling.**

- **No subagent, no task in background.** Gates in the foreground (P16), through `node scripts/run-quiet.mjs`.
- **Commit the code as soon as typecheck and the unit tests are green**, before the bench.
- **One test or probe run per tool call.**
- **Context economy**: read `~/.jjodel-lanes/P-2026-10-21-1600/handoff.md` (short) first; do not read `handoff.diff`
  or any source file whole; grep and read windows only; short tool output; never a whole diff.
- No push, no merge. Do not touch `Status`. No CLAUDE.md 3.2 file.

## COSA

The plan and its decisions are those of P-2026-10-21-1600 (`docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`,
R-OI-13, R-OI-14 on the trunk). R1 is settled: no delete cascade (handoff). Do only items 1 to 3 of the handoff's
«Remaining checks»:

1. Fix the import of `hooks/__tests__/instantiate.test.ts` (`syncSlotsPlan`, `type SlotSyncPlan` from `'../instantiate'`).
2. Gates: typecheck 0; vitest on `problems/__tests__/instantiationToProblems.test.ts` and
   `hooks/__tests__/instantiate.test.ts`; `npm run build` 0. Fix what fails inside the eight files only. Commit the
   code, paths named: `feat(onto): S3a slot problems in the registry and Sync slots (P-2026-10-21-1600)`.
3. Mutation bench M1, M2, M3 of the report's oracle, one mutant per call, each red, each reverted (`git status` clean
   after). Write the counts, the failing test names and the load average to
   `~/.jjodel-lanes/P-2026-10-21-1635/bench.txt` (not committed; the next lane copies them into the log entry).

The deviation of the previous lane stands: `valueKindFor` is not exported.

## DOVE

The eight files listed above. Nothing else.

## HARD STOP

After step 3, with `Outcome: done` and a clean tree. Earlier, with `Outcome: question`, if a gate cannot go green
inside the eight files.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-10-21-1600/handoff.md`; `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md` (oracle).
