# Ontological instantiation, undo groups L4: rebuild oi-s3b on the new oi-s3a

Prompt-ID: P-2026-11-07-0110
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (merge of the core lane's branches; no core file is edited here)
Status: eseguito
Request: none (Alfonso: «ok», 2026-11-06 21:45, to option (c) and its lane plan)
Depends: P-2026-11-07-0040
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b` at `f6bf690b7` plus this prompt's `docs:` commit, clean. Check `pwd`,
the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort
`xhigh`. A dev server for Alfonso runs from this worktree on port 3005: do not stop or reuse it; probe ports outside
3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-07-0110 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- **No subagent, no task in background.** One test or probe run per call; `uptime` beside each probe; before a probe
  wait for the 1-minute load under 20 (one `uptime` per call, never a sleep over 60 s).
- Short tool output; grep and windows of at most 80 lines; never a whole diff, never `reducer.ts` or `EditorV2.tsx` whole.
- **Commit the merge as soon as typecheck, the tests below and the build are green.** Subjects at most 72 characters,
  `Model:` trailer.
- No push, no merge into the trunk. No edit to `reducer.ts`, `EditorV2.tsx` or a CLAUDE.md 3.2 file; if one becomes
  necessary, stop with `Outcome: question`.

## Background

`oi-s3a` now carries the trunk and option (c) (`oi-s2u`, closed at `84350015a`), the S3a merge (`6b52b905d`, «Sync
slots» on the id-less groups, in the instantiation queue with the same deadline), the probe setup fix (`ccb3abd2b`) and
the overlay click fix (`72ad1753d`, report `f7d46e0c9`). A dry `git merge-tree oi-s3b oi-s3a` conflicts in
`instantiate.ts`, `__tests__/instantiate.test.ts` and `docs/log-inbox/instance-of.md`. On `oi-s3b` the ghost-row
materialization opens its own group with an id (`instantiate.ts` about `:762-768` and `:836-845`,
`const group = history.beginUndoGroup()` / `endUndoGroup(group)`).

## COSA

1. `git merge --no-ff oi-s3a`. Resolve as L3 did (`~/.jjodel-lanes/P-2026-11-06-2340/closing.md`): keep both sides'
   content; port both materialization call sites to the id-less API (the typecheck finds any left, TS2554); the
   materialization joins the same queue and uses the same deadline as instantiation and «Sync slots», so a typed ghost
   value and an instantiation never share one undo entry; the log inbox keeps both sides' entries, newest day first.
2. Gates: typecheck 0; `instantiate.test.ts`, `undoGroup.test.ts`, the reducer tests and
   `problems/__tests__/NodeProblemOverlay.test.ts` green; `npm run build` 0. Commit the merge.
3. Probes, one per call: `onto-s3b-ghost-rows.ts` on `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`
   (6/6; one Cmd+Z removes the materialized slot and value with exact `idlookup` restore);
   `onto-s3a-slot-problems.ts` on the default export (8/8); `onto-s2-instantiate.ts` (21/21). Assets under `/tmp`, never
   in the repo.
4. Mutant: the materialization bypasses the queue, a test red, reverted. To `~/.jjodel-lanes/P-2026-11-07-0110/bench.txt`.
5. No log entry here (L5 writes it); probe lines and loads to `~/.jjodel-lanes/P-2026-11-07-0110/closing.md`.

## DOVE

`frontend/src/components/editor-v2/hooks/instantiate.ts`, `frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts`,
`docs/log-inbox/instance-of.md` (conflict resolution only), plus whatever the merge brings from `oi-s3a` unchanged.

## HARD STOP

After step 5 with `Outcome: done` and a clean tree. Earlier with `Outcome: question` if a probe check fails that is not
a measure, with the check name and the evidence.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md` (branch `oi-undo-discovery`, §5);
`docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md`; `docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md`
(on `oi-s3a`); `~/.jjodel-lanes/P-2026-11-06-2340/closing.md`; `docs/decisions.md` R-OI-15, R-OI-16.
