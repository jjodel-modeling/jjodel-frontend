# Ontological instantiation, S3b Phase 2, lane A: ghost and orphan rows, code and gates

Prompt-ID: P-2026-10-21-1955
Chat: C-2026-10-21-1405
Front: instance-of
Lane: full (viewpoint/ir/ is in the critical-zone table of CLAUDE.md 3.1; Layer Impact Report in the discovery)
Status: da eseguire
Request: none (the chat has no shareable URL; Alfonso's words are kept with --request)
Depends: P-2026-10-21-1910
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b` at `d6fa8ba7f`, clean. Check `pwd`, the branch, `git log -1` and a clean
`git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1955 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes. **This lane is short on purpose:
the implementation lanes of this front hit the context ceiling; the probe is the next lane's work.**

- **No subagent, no task in background.** Gates in the foreground (P16), through `node scripts/run-quiet.mjs`.
- **Commit the code as soon as typecheck and the unit tests are green**, before the bench.
- **One test run per tool call.**
- **Context economy**: read the report by windows (Q2, Q3, Q4, Layer Impact Report, Phase 2 plan, oracle); grep, never
  read `EditorV2.tsx`, `IRNodeContent.tsx`, `instantiate.ts` or `LModelElement.tsx` whole; short tool output; never a
  whole diff.
- No push, no merge. Do not touch `Status`. No CLAUDE.md 3.2 file, no `reducer.ts`, no `nodeSizing.ts`, no
  `jjomTransformers.ts`; if one becomes necessary, stop with `Outcome: question`.

## Decisions (the chat adopts the report's recommendations except question 2; R-OI-15 and R-OI-16 on the trunk)

The plan is `docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md`. Its decisions D1..D9 stand. Its questions:

1. The file list is accepted, plus one file (item 6 below); rule 19 pause waived for this lane.
2. **Not option (d).** «A manual resize wins» stays as it is. Instead: the UML fixture's instance view authors no
   `defaultSize`, so an instance's box hugs its rows and S2 writes no manual box for it (`instanceBoxSize` returns
   `null`, `instantiate.ts:365-370`); the library's instances in the fixture are laid out without a manual box. For a
   view that does author a fixed size, materialization grows the box grow-only inside its group, as «Sync slots» does
   (D6). Reason: (d) changes the sizing of every resized node in every editor, outside this front.
3. Text that does not parse for the feature's type is written as a String value. Yes.
4. Editing real slot rows on the canvas: a later slice, not S3b.

## COSA

1. Restate the report's Layer Impact Report in your first reply, amended for decision 2.
2. Implement lane A of the report's Phase 2 plan, items 1-5: `instanceRows`, `materializePlan`, `materializeSlot`, the
   `plannedValue` split, the in-flight record and subscribe, the `createSlots` callback (`instantiate.ts`); ghost
   selector, rows, editor, in-flight filter, orphan strings (`IRNodeContent.tsx`); the optional `orphan` prop
   (`IRRow.tsx`); ghost, orphan, marker and materializing rules with tokens only (`irStyle.ts`, rule 28); unit tests 1-8
   of the report's oracle (`instantiate.test.ts`).
3. Item 6, decision 2: in `frontend/scripts/probe/uml-class-object-fixture.ts`, remove the `defaultSize` of the
   InstanceSpecification view (about line 448) and lay the library's instances out without a manual box (about line
   275); the classes keep their boxes. Before committing, one run of `onto-s2-instantiate.ts` and one of
   `onto-s3a-slot-problems.ts` (one per call, check lines only, load average beside each). If a check fails only because
   it asserts a manual box that decision 2 removes, stop with `Outcome: question`, the check name and its assertion;
   do not edit either probe.
4. Gates: typecheck 0; `instantiate.test.ts` and the IR render tests green; `npm run build` 0. Commit the code, paths
   named: `feat(onto): S3b ghost and orphan rows (P-2026-10-21-1955)`.
5. Mutation bench M1, M2, M3 of the report's oracle on the unit tests, one mutant per call, each red, each reverted
   (`git status` clean after). Counts, failing test names and load average to `~/.jjodel-lanes/P-2026-10-21-1955/bench.txt`
   (not committed; the next lane copies them into the log entry).

## DOVE

`frontend/src/components/editor-v2/hooks/instantiate.ts`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`,
`frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`,
`frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts`, `frontend/scripts/probe/uml-class-object-fixture.ts`.
Nothing else.

## HARD STOP

After step 5, with `Outcome: done` and a clean tree. Earlier with `Outcome: question` at step 3 as stated, or if a gate
cannot go green inside the six files.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md`; `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`;
`docs/log-inbox/instance-of.md`.
