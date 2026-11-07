# Ontological instantiation, undo groups L3: rebuild oi-s3a on the new oi-s2u

Prompt-ID: P-2026-11-06-2340
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (merge of the core lane's branch; no core file is edited here)
Status: da eseguire
Request: none (Alfonso: «ok», 2026-11-06 21:45, to option (c) and its lane plan)
Depends: P-2026-11-06-2257
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3a`, branch `oi-s3a` at `329bda77e` plus this prompt's `docs:` commit, clean. Check `pwd`,
the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort
`xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-06-2340 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- **No subagent, no task in background.** One test or probe run per call, load average beside each probe run; before a
  probe, wait for the 1-minute load to drop under 20 (one `uptime` per call, never a sleep over 60 s).
- Short tool output; grep and windows of at most 80 lines; never a whole diff.
- **Commit the merge as soon as typecheck, the tests below and the build are green.** Subject at most 72 characters,
  `Model:` trailer.
- No push, no merge into the trunk. No edit to `reducer.ts` or to any CLAUDE.md 3.2 file; if one becomes necessary,
  stop with `Outcome: question`.

## Background

`oi-s2u` now carries the trunk and option (c) of `docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md`
(branch `oi-undo-discovery`): the trunk's `beginUndoGroup()` / `endUndoGroup()` with depth nesting and no ids, the exact
merge of late writes after the outermost end (L1, `197ae1fd1`), one deadline per instantiation and a queue in
`instantiate.ts` (L1b, `809d85ce1`, `9baae8d88`), the 3.1.1 welcome key in `scripts/smoke/states.ts` (`19abb1356`), and
the closing entry of L1..L2 (`84350015a`). A dry `git merge-tree oi-s3a oi-s2u` conflicts in three files:
`instantiate.ts`, `__tests__/instantiate.test.ts`, `docs/log-inbox/instance-of.md`. On `oi-s3a`, «Sync slots» opens
its own group: `const group = history.beginUndoGroup()` / `history.endUndoGroup(group)` (about `instantiate.ts:601-642`).

## COSA

1. `git merge --no-ff oi-s2u` in this worktree. Resolve:
   - `instantiate.ts`: keep both sides' content, oi-s2u's deadline and queue plus oi-s3a's «Sync slots» code; port every
     `const group = history.beginUndoGroup()` / `endUndoGroup(group)` to the id-less API (the typecheck finds them,
     TS2554). Decide, and say in the reply, whether «Sync slots» joins the instantiation queue (recommended: yes, so a
     sync and an instantiation never share one undo entry) and whether its waits use the same deadline (recommended:
     yes, the same `INSTANTIATE_DEADLINE_MS`).
   - `instantiate.test.ts`: both sides' tests, the S3a ones on the fake history of oi-s2u if they used group ids.
   - `docs/log-inbox/instance-of.md`: both sides' entries, newest day first (R-RAIL-45), nothing dropped.
2. Gates: typecheck 0; `instantiate.test.ts`, `undoGroup.test.ts` and the reducer tests green; `npm run build` 0.
   Commit the merge.
3. Probe `onto-s3a-slot-problems.ts` once with `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel` and
   `ONTO_OUT` under `/tmp`: 8/8, in particular «Sync slots» is one Cmd+Z with exact `idlookup` restore. Then
   `onto-s2-instantiate.ts` once on this branch (21/21).
4. If step 1 made «Sync slots» join the queue: one mutant (the sync path bypasses the queue), red, reverted. Results to
   `~/.jjodel-lanes/P-2026-11-06-2340/bench.txt`.
5. No log entry in this lane (L5 writes it); copy the probe lines and loads to
   `~/.jjodel-lanes/P-2026-11-06-2340/closing.md`.

## DOVE

`frontend/src/components/editor-v2/hooks/instantiate.ts`, `frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts`,
`docs/log-inbox/instance-of.md` (conflict resolution only), plus whatever the merge brings from `oi-s2u` unchanged.

## HARD STOP

After step 5 with `Outcome: done` and a clean tree. Earlier with `Outcome: question` if a probe check fails that is not
a measure, with the check name and evidence.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md` (branch `oi-undo-discovery`, §5);
`docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`; `docs/decisions.md` R-OI-13, R-OI-14;
`~/.jjodel-lanes/P-2026-11-06-2257/closing.md`.
