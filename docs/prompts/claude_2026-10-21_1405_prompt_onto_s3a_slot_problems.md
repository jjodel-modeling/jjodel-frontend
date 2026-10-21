# Ontological instantiation, S3a: missing and orphan slots as problems, «Sync slots» (Phase 1, Layer Impact Report)

Prompt-ID: P-2026-10-21-1405
Chat: C-2026-10-21-1405
Front: instance-of
Lane: full (problems/ is in the critical-zone table of CLAUDE.md 3.1; Phase 1 read-only, hard stop on the report)
Status: da eseguire
Request: none (the chat has no shareable URL; Alfonso's words are kept with --request)
Depends: P-2026-10-21-1219
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3a`, branch `oi-s3a`, cut from `oi-s2u` at `53834b0b2`, `frontend/node_modules` symlinked
(P14). Check `pwd`, the branch, `git log -1` at `53834b0b2` and a clean `git status`; otherwise stop with
`Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1405 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Time limit 90 minutes.

- **No subagent, no task in background.** Gates, probes and dev server in the foreground (P16).
- **Commit as soon as the report is written**; do not hold it for polishing.
- **One probe run per tool call**; never loop a probe inside one call.
- **Context economy**: grep, never read `EditorV2.tsx`, `reducer.ts` or `instantiate.ts` whole; short tool output;
  never a whole diff.
- No push, no merge, no trunk merged into the branch. Do not touch `Status`.
- **Phase 1 only: no product code is edited.** It ends with a hard stop on the report; the chat reads the Layer Impact
  Report and gives the GO for Phase 2 (R-OI-12).

## Context (do not redo)

Front `instance-of`, decisions R-OI-1..12 in `docs/decisions.md`. Plan: `docs/discovery/discovery_2026-10-20_ontological_instantiation.md`
§8 (S3a block) and §5. On this branch: S1 reader `frontend/src/model/ontological/` (`bindingReader.ts` gives the feature
closure over the generalization, cycles reported), S2 creation (`components/editor-v2/hooks/instantiate.ts`, slot
synthesis with default values), S2u undo groups (`beginUndoGroup` / `endUndoGroup` in `redux/reducer/reducer.ts`, one
entry and an exact `idlookup` restore for writes inside a group; see
`docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md`). Fixture: the UML library of the front (Book, Magazine,
Library, Member; instance dune of Book). The branch has not been merged into the trunk; `problems/` is identical on
both (measured 2026-10-21 14:03).

Decisions that bind this slice: R-OI-3 (reconciliation is never destructive, orphan slot is a problem, a feature
without a slot will be a ghost row in S3b), R-OI-4 and R-VAL-4 (conformance never blocks an edit), R-OI-9 («Sync slots»
only creates the missing slots; removing orphans is a separate action with a confirmation), R-OI-11 (O2..O5 are built-in
live checks from the relation's own closure, through the problems registry), and the R-VAL invariant that rule
defects never enter the registry, which stays the place of model violations.

## COSA

Answer, with `file:line` evidence and a number where one exists:

1. **The registry today.** Problem kinds, record shape, how a problem names its target (object, node, viewpoint), whether a
   record can carry an action (the plan's optional `run`), how `NodeProblemOverlay.tsx` renders and dispatches, who
   writes the registry and when it is cleared. State of `ValidationPill` (unmounted since 2026-08-26) and of the model
   violations dropped at `conformanceToProblems.ts:43`: does S3a depend on either, or can it write beside them?
2. **Detection.** Where missing (a closure feature with no slot), orphan (a slot whose defining feature is absent,
   dangling or outside the closure), O3 (two slots for one feature) and O5 (value of the wrong type for the feature)
   are computed: a pure module fed by the S1 reader plus a mounted sync component, as the plan proposes, or another
   shape. Its dependency set, what triggers a recompute, and the cost: measure it on the library and on a scaled copy
   (about 200 instances, built in a throwaway script), and state a budget.
3. **«Sync slots».** Creates only the missing slots of one instance (R-OI-9), reusing the S2 slot synthesis with its
   defaults, inside one S2u group (one entry, one Cmd+Z, exact `idlookup` restore). Its surfaces: the problem's action
   and the instance node's menu; whether a model-wide variant is worth it now. Removing orphans: say whether it belongs
   in S3a (confirmed action) or a later slice, with a recommendation.
4. **Never blocking.** Confirm that no path refuses the write that makes an O3 or O5 (L-API setters, adapters,
   validators), with evidence.
5. **Layer Impact Report** for `problems/` and for the mount in `EditorV2.tsx`: layers touched, callers, invariants,
   risk. Confirm that no CLAUDE.md 3.2 file is touched.
6. **Oracle for Phase 2.** Unit tests on the pure detection; a probe (a new `frontend/scripts/probe/onto-s3a-slot-problems.ts`
   or an extension of `onto-s2-instantiate.ts`, say which) checking the acceptance below from the DOM and the store;
   two or three mutation-bench candidates that must turn the tests red.

Phase 2 acceptance to plan against (from §8, refine if the findings require it):

- deleting the Property `isbn` leaves dune's slot in place, reported as an orphan problem;
- adding `pages` to Book shows a missing-slot problem on dune;
- «Sync slots» creates the `pages` slot, deletes nothing, and is undone by one Cmd+Z with every created id gone from `idlookup`;
- O3 (a duplicate slot) and O5 (`year` holding a LiteralString) are reported live, and the write that made them is not refused;
- `undo-inline-edit.ts` and `onto-s2-instantiate.ts` unchanged.

## DOVE

Write only `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`: objective, hypotheses under test, files read
with full paths, findings per question, the Layer Impact Report, a Phase 2 plan with the file list (more than five
files: list them for confirmation, rule 19), the oracle, «Decisions taken (unattended)» and «Decisions awaiting
Alfonso». Throwaway scripts and probes are allowed and not committed. One `docs:` commit, then hard stop.

## HARD STOP

At the end of the report commit. Also stop with `Outcome: question` if detection needs a change to the S1 reader's
exported interface, or if «Sync slots» cannot be one undo entry with the S2u group as it is.

## NON FARE

No product code, no test file committed, no edit to `docs/decisions.md`, to `CLAUDE.md` or to the log inbox in Phase 1.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-20_ontological_instantiation.md` (§3, §5, §8); `docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md`
(Q1, Q2, pre-existing defects); `docs/decisions.md` R-OI and R-VAL; `docs/spec/claude_spec_2026-09-08_user_defined_validation.md`;
`docs/log-inbox/instance-of.md`.
