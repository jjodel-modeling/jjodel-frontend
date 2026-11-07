# Ontological instantiation, S3b: ghost rows and orphan rows (Phase 1, Layer Impact Report)

Prompt-ID: P-2026-10-21-1910
Chat: C-2026-10-21-1405
Front: instance-of
Lane: full (viewpoint/ir/ is in the critical-zone table of CLAUDE.md 3.1; Phase 1 read-only, hard stop on the report)
Status: eseguito 2026-10-21 · lane oi-s3b · report d6fa8ba7f · questions 1, 3, 4 as recommended; question 2 decided against option (d), unattended (R-OI-15, R-OI-16) · Phase 2 P-2026-10-21-1955 and P-2026-10-21-1956
Request: none (the chat has no shareable URL; Alfonso's words are kept with --request)
Depends: P-2026-10-21-1636
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`, cut from `oi-s3a` at `329bda77e`, `frontend/node_modules` symlinked
(P14). Check `pwd`, the branch, `git log -1` at `329bda77e` and a clean `git status`; otherwise stop with
`Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1910 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **No subagent, no task in background.** Probes and the dev server in the foreground (P16).
- **Commit the report as soon as it is written**; do not hold it for polishing.
- **One probe run per tool call.** Record the load average (`uptime`) beside every measure.
- **Context economy**: grep, never read `EditorV2.tsx`, `irCompile.ts`, `IRNodeContent.tsx`, `instantiate.ts` or
  `LModelElement.tsx` whole; read windows only; short tool output; never a whole diff; probe output: summary lines only.
- No push, no merge, no trunk merged into the branch. Do not touch `Status`.
- **Phase 1 only: no product code is edited.** Throwaway scripts are allowed and not committed.

## Context (do not redo)

Front `instance-of`, decisions R-OI-1..14 (R-OI-13 and R-OI-14 are on the trunk only: they say one problem kind
`instantiation`, «Sync slots» per instance, orphan removal in a later slice with a confirmation). Plan:
`docs/discovery/discovery_2026-10-20_ontological_instantiation.md` §8, S3b block. On this branch: S1 reader
(`model/ontological/bindingReader.ts`, `slotDiff` gives missing and orphans), S2 creation and slot synthesis, S2u undo
groups (`beginUndoGroup` / `endUndoGroup`), S3a problems and «Sync slots»
(`docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`, closing entry in `docs/log-inbox/instance-of.md`).

Facts measured in S3a that bind this slice:

- Deleting a Property does not delete the slots that point at it: their `definingFeature` becomes `[]` and the slot
  stays (R1 of S3a). The orphan row today reads ` = 978-0441013593`: no feature name, no marker.
- The class diagram has no «Add attribute» gesture; probes add a Property through `createInstance`.
- `addObject` seeds `definingFeature` about 990 ms after the call.

Decisions that bind this slice: R-OI-3 (a feature without a slot is a ghost row that materializes on its first value;
nothing is deleted silently), R-OI-9, R-VAL-4 (never block an edit).

## COSA

Answer, with `file:line` evidence and a number where one exists:

1. **Where rows come from today.** How the IR compiles an instance node's rows (`irTypes.ts`, `irCompile.ts`,
   `IRNodeContent.tsx`, `IRRow.tsx`): what a row is bound to, how a slot becomes `name = value`, and where the inline
   edit of a row writes. Which viewpoints draw the object diagram's instance node through the IR.
2. **Ghost rows.** The narrowest way to add a row for each `slotDiff(...).missing` feature with no Slot in the store:
   where the IR reads the binding, the cost per instance (measure on the library and on about 200 instances), and how
   the row is visually distinct (tokens only, rule 28).
3. **Materialization.** Typing a value into a ghost row creates one Slot and one value object and the row turns real,
   in one S2u undo group (one entry, one Cmd+Z, exact `idlookup` restore). Whether the S2 slot loop shared with
   «Sync slots» (`createSlots`, `plannedSlot`) can be reused for one feature, and how the late `definingFeature` seeding
   is handled so the row does not flicker between ghost and real.
4. **Orphan rows.** How an orphan row is drawn and marked. Whether the lost feature's name can be shown (for example a
   name held on the slot, or the last value of `definingFeature` before the delete), or only a generic marker.
   Recommend one.
5. **Relation with S3a.** Whether the missing-slot problem stays when its ghost row is drawn, or the ghost row replaces
   it. Recommend one, against R-OI-3 and R-OI-13.
6. **Layer Impact Report** for `viewpoint/ir/` and any mount: layers touched, callers, invariants, risk. Confirm that no
   CLAUDE.md 3.2 file is touched.
7. **Oracle for Phase 2.** Unit tests on the pure parts; a probe (new `frontend/scripts/probe/onto-s3b-ghost-rows.ts`)
   checking the acceptance below from the DOM and the store; two or three mutation-bench candidates.

Phase 2 acceptance to plan against (from §8, refine if the findings require it):

- after adding `pages` to Book, dune shows a `pages =` ghost row with no Slot object in the store;
- typing 300 into it creates one Slot and one value object, the row turns real, one Cmd+Z removes both;
- an orphan row is drawn and marked;
- `undo-inline-edit.ts`, `onto-s2-instantiate.ts` and `onto-s3a-slot-problems.ts` unchanged.

## DOVE

Write only `docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md`: objective, hypotheses under test with
verdicts, files read with full paths, findings per question, the Layer Impact Report, a Phase 2 plan with the file list
(more than five files: list them for confirmation, rule 19) split into two lanes (code and gates, then probe and
closure), the oracle, «Decisions taken (unattended)» and «Decisions awaiting Alfonso». One `docs:` commit, then hard stop.

## HARD STOP

At the end of the report commit. Also stop with `Outcome: question` if ghost rows need a change to a CLAUDE.md 3.2 file,
to `reducer.ts`, or to the S1 reader's exported interface.

## NON FARE

No product code, no test file committed, no edit to `docs/decisions.md`, `CLAUDE.md` or the log inbox in Phase 1.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-20_ontological_instantiation.md` (§3, §5, §8); `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`;
`docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md`; `docs/log-inbox/instance-of.md`; `docs/decisions.md` R-OI.
