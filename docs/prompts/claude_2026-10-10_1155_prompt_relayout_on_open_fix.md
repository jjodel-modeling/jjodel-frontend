# Whole-graph re-layout on open: root cause and fix

Prompt-ID: P-2026-10-10-1155
Chat: C-2026-10-10-0057
Lane: full (bug fix in `EditorV2.tsx`; regression gate on users' saved layouts)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-relayout`, branch `relayout-on-open`, created from the trunk commit that adds this file.
Before anything else, check four things. `pwd` is the worktree. The branch is `relayout-on-open`. `git status` is clean. `git log -1 --format=%H` equals
`git log -1 --format=%H -- docs/prompts/claude_2026-10-10_1155_prompt_relayout_on_open_fix.md`. Otherwise stop.

## Lane discipline
Every reply opens with `[P-2026-10-10-1155 · session <id>]`. Every final message ends with
`Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`.
Do not touch the `Status` line.

## Context (measured, do not redo)

The nested-vertices probe (P-2026-10-10-0830, branch `nested-vertices`) measured the defect. The probe is
`frontend/scripts/probe/nested-vertices.ts` at commit `d5b28a6b7`. The results are in the addendum of
`docs/discovery/discovery_2026-10-10_nested_object_vertices.md` at commit `0cea4fd7a`. In scenario E3b, a reopen that
creates one vertex re-ran the auto-layout over the whole graph. That moved a node the user had placed by hand,
from 781,1010 back to 141,530. It also overwrote that node's saved layout record. The new vertex landed on the default grid.

The report reads the mechanism as follows (read, not yet measured):

- `useJjomSync.ts:696` sets `justCreatedGraphRef` whenever a populate run creates anything.
- `EditorV2.tsx:515-517` and `:3808-3816` then run ELK over all nodes and write all positions back under the
  active layout key.

The defect is independent of nested objects. Any open that creates a vertex triggers it, for example a root
created by JjScript while the canvas was closed. Users lose hand-made layouts today.

## COSA

**A. Root cause** (read-only, short). Write `docs/discovery/discovery_2026-10-10_relayout_on_open.md` (P4).

- Confirm or refute the mechanism with `file:line` and verbatim quotes.
- List every reader and writer of `justCreatedGraphRef`.
- State the intended purpose of the open-time auto-layout: what case it was added for. Use `git log -S` and the
  R-LAY rows in `docs/decisions.md`.
- Say whether any ratified decision requires a whole-graph layout on open.

**B. Fix.** Rule: the open-time auto-layout runs only when the graph had **no** persisted position before the
populate run (a fresh graph, e.g. a first import). When at least one vertex already had a position, no
pre-existing vertex moves and no layout record of a pre-existing vertex is written. Vertices created in that
run are placed by the existing default placement. Placing nested objects next to their container is a later
slice of the nested-vertices front, not this lane.

- Extract the decision into a pure, tested predicate. Name it after a search plus a positive control, for
  example `shouldAutoLayoutOnOpen`.
- Prefer a fix in `EditorV2.tsx`. If the correct fix needs `useJjomSync.ts` or another CLAUDE.md §3.2 file,
  write the Layer Impact Report first and stop with `Outcome: question`.

## DOVE

`frontend/src/components/editor-v2/EditorV2.tsx`, a new pure helper beside it (or in `editor-v2/utils/`) with
its test, `frontend/scripts/probe/nested-vertices.ts`, the discovery report and its assets, and
`docs/log-inbox/relayout-on-open.md`.

Bring the probe over with `git checkout d5b28a6b7 -- frontend/scripts/probe/nested-vertices.ts`. It is this lane's
oracle, so commit it unchanged unless E3b needs a parameter.

## COME

Acceptance criteria, measured with the probe on a dev server port of your own (not 3000; check `lane-run` ports):

- **E3b.** The hand-moved node stays at its stored position, and its layout record is byte-identical before and after
  the reopen. The newly created vertex exists.
- **E3a control.** Unchanged.
- **Fresh graph.** A first XMI import (E1) still gets the auto-layout: its 10 nodes are not all on the default grid.

Record before/after positions as JSON under `docs/discovery/assets/relayout-on-open/`.

Gates: `npx tsc --noEmit` (no new error beyond the 14 of the baseline), the predicate's tests, the editor-v2 suite,
the full suite, `npm run build`. Run a mutation bench on the predicate.

Commits: one `fix(editor-v2)` for the code and the predicate test, one `chore(probe)` if the probe is committed,
and one `docs` for the report, assets and inbox entry (`log-entry` skill). Every commit uses an explicit pathspec and
carries the `Model:` trailer. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## NON FARE

- No edit to `useJjomSync.ts` or any other §3.2 file (stop and ask instead).
- No change to ELK options, and no placement-next-to-container logic.
- Do not touch the drag-end (`:4014-4252`) or drop (`:2075-2300`) regions of `EditorV2.tsx`. The graphVertex S3 lane
  will work there next.
- No `git stash`, no `git add .`, no push. Do not touch the `Status` line.

## HARD STOP

After the commits, with green gates and the measurements saved, stop with `Outcome: hard-stop`. The chat verifies
and merges.

## RIFERIMENTI

`CLAUDE.md` §3 and §21. `docs/PROTOCOL.md` P4, P13, P16. `docs/decisions.md` R-LAY series. The nested-vertices
report at `0cea4fd7a` (§D, addendum E3a/E3b).
