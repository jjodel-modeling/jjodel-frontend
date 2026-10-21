# Ontological instantiation, S3a Phase 2: slot problems in the registry, «Sync slots»

Prompt-ID: P-2026-10-21-1600
Chat: C-2026-10-21-1405
Front: instance-of
Lane: full (problems/ is in the critical-zone table of CLAUDE.md 3.1; Layer Impact Report in the discovery; visual check owed)
Status: da eseguire
Request: none (the chat has no shareable URL; Alfonso's words are kept with --request)
Depends: P-2026-10-21-1405
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3a`, branch `oi-s3a` at `78d91320b`, clean. Check `pwd`, the branch, `git log -1` and a clean
`git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1600 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **No subagent, no task in background.** Gates, probes and the dev server in the foreground (P16).
- **Commit the code as soon as typecheck and unit tests are green**, before the probe and the mutation bench; then
  commit each further step as soon as its gate is green. Never hold green work uncommitted.
- **One probe run per tool call**; never loop a probe inside one call.
- **Context economy**: grep, never read `EditorV2.tsx`, `reducer.ts`, `instantiate.ts` or `LModelElement.tsx` whole;
  short tool output; never a whole diff.
- No push, no merge, no trunk merged into the branch. Do not touch `Status`. No CLAUDE.md 3.2 file; if one becomes
  necessary, stop with `Outcome: question`.
- When you record a timing, record the load average (`uptime`) beside it.

## Decisions (the chat adopts the report's recommendations, unattended, RC-25; R-OI-13 and R-OI-14 on the trunk)

The plan is `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`: its Layer Impact Report, Phase 2 plan
and oracle. Its four questions are answered as recommended:

1. The ten-item file list of the Phase 2 plan is accepted (rule 19 pause waived for this lane).
2. Removing orphan slots is not in S3a; it is a later slice, with a confirmation.
3. A cycle in the generalization is an error on every classifier of the cycle.
4. No model-wide «Sync slots».

The report's decisions D1..D7 stand (one kind `instantiation`; severities as the fixture's rules; `bindingReader.ts`
untouched; only `object` records judged; the producer defers while an instantiation or a sync is in flight;
«Sync slots» grows the box, never shrinks it; new slots appended).

## COSA

1. **R1 first, before any product code.** With a throwaway browser script on the UML library (not committed): delete
   the Property `isbn` of Book in the class diagram and check whether dune's `isbn` slot is still in `idlookup`.
   If the delete cascades into the slot, stop with `Outcome: question` and the evidence (`file:line` of the cascade):
   R-OI-3 would be broken by the core and the slice changes.
2. Restate the Layer Impact Report of the discovery in your first reply, amended if step 1 changed anything.
3. Implement the Phase 2 plan, files 1-8 of the report's table: the `instantiation` kind and the optional
   `run` on `NodeProblemAction`; the `run` branch in `NodeProblemOverlay.tsx`; the pure `instantiationToProblems.ts`;
   the producer `InstantiationProblemSync.tsx` (signature, 300 ms debounce, in-flight deferral, dual anchors, revoke by
   owner, unmount clear); the mount and the node-menu entry in `EditorV2.tsx`; `syncSlotsPlan` and `syncSlots` in
   `instantiate.ts` with the slot loop shared with `synthesize` (S2's output unchanged); the unit tests of the oracle.
   Gates: typecheck 0, the touched vitest files green, `npm run build` 0. Commit.
4. Mutation bench M1..M3 on the unit tests (each red, then reverted); the counts go in the next commit message.
5. The probe `frontend/scripts/probe/onto-s3a-slot-problems.ts` (new), checks S3-0..S3-7 of the oracle, M4 on it.
   Commit as `chore(probe)` (P13).
6. Regression: `undo-inline-edit.ts` 33/33 as at `53834b0b2`, `onto-s2-instantiate.ts` all checks pass, unchanged.
7. Visual assets for the chat's check, in `docs/discovery/assets/onto-s3a/`: dune's node with the problem badge after
   S3-2; the overlay open on the missing-slot problem with its «Sync slots» button; dune's node with five rows after the
   sync. Element crops, not full screens.
8. Closing entry in `docs/log-inbox/instance-of.md`: files, shas, gates, probe results with load average, bench
   counts, any defect found and not fixed as a proposed ticket. One `docs:` commit.

## DOVE

Only the ten items of the report's Phase 2 table. Any other file: stop with `Outcome: question`.

## HARD STOP

After the docs commit of step 8, with `Outcome: done`. Earlier, with `Outcome: question`, at step 1 if the slot is
gone, or if «Sync slots» splits into two undo entries, or if S2's probe changes.

## NON FARE

No change to `reducer.ts`, `bindingReader.ts`, `bindingCodec.ts`, `bindingCheck.ts`, `createAdapter.ts`, or to the six
existing problem kinds and their producers. No orphan removal. No edit to `docs/decisions.md` or `CLAUDE.md`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`; `docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md`;
`docs/discovery/discovery_2026-10-20_ontological_instantiation.md` §8; `docs/decisions.md` R-OI-3, R-OI-9, R-OI-11,
R-OI-13, R-OI-14, R-VAL-4; `docs/log-inbox/instance-of.md`.
