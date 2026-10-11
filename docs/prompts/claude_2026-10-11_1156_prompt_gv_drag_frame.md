# graphVertex containers: the frame follows a dragged child on all four sides; the pool record keeps its position

Prompt-ID: P-2026-10-11-1156
Chat: C-2026-10-10-0057
Request: Alfonso, 2026-10-11 11:42 and 11:54: «qualsiasi vertex dentro un container se spostato verso destra e verso il basso fa crescere il container, se spostato verso sinistra e verso l'alto può uscire dal container. È corretto?»; then «ok procedi in lane auto» on the rule the chat proposed.
Front: graphvertex
Lane: full (no Phase 1; one probe-first Phase 2; `viewpoint/ir/`, `utils/elkContainers.ts`, the drag-end and Auto layout call sites of `EditorV2.tsx`; no §3.2 file), unattended (RC-21)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gvdrag`, branch `gv-drag-frame`, created from the trunk commit that adds this file, `frontend/node_modules` symlinked (P14). Before anything else check `pwd`, the branch and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-11-1156 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`; a question with one recommendation inside this perimeter is answered as recommended and recorded (unattended). Do not touch the `Status` line.

## What is wrong now

1. **Asymmetric frame.** A child dragged right or down inside a framing container (a partition of a `partitions` container, a `frame: 'self'` container) makes the frame grow; dragged left or up it leaves the frame, because the frame keeps its top-left corner and only recomputes width and height. P-2026-10-11-0040 (`aea222c46`, `irContainment.ts` `specOf`/`crossFromOf`) fixed the right margin at rest only.
2. **Sized by hand acts as a ceiling.** 0040 leaves `isResized` containers untouched, but R-GV-16 (`docs/decisions.md`) makes a pool or orthogonal state «sized by hand» after Auto layout and says that size is its **minimum**. So after one Auto layout the margin is no longer kept, even at rest.
3. **Pool record position after Auto layout** (ticket, high, `docs/log-inbox/gv-right-margin.md`, found in P-2026-10-11-0040): when the S6 Auto layout writes a pool's grown size, the pool's record keeps its pre-layout position (BPMN fixture: Shop's record stays at 100,100 while its lanes put it near 48,568). After save and reload the pool is drawn at its record and Sales sits 484 px above its own flow nodes. The write is at the S6 call site in `EditorV2.tsx` (P-2026-10-10-0105, `65dc0fe7e`, `utils/elkContainers.ts`).

## The rule (decided by the chat on Alfonso's ok, RC-25)

- **Pointer inside the container: the frame follows the child on all four sides.** It keeps at least `PARTITION_CONTENT_MARGIN` (16 px) between every child box and every border. Growing left or up moves the container's origin; the other children do not move (absolute positions unchanged), so the frame grows, not the content shifts. Live during the drag (presentation) and written at drag end (record position and size, one TRANSACTION, SetField only, no creator inside).
- **A size set by hand is a minimum, never a ceiling.** The frame never shrinks below a hand-set size; it grows past it when a child needs it. This applies to `isResized` partitions, frames and pools (R-GV-16).
- **Pointer outside the container: the gesture is «move out»**, governed by the view's `containment.membership` exactly as S3 built it (`none` leaves, `forbid` snaps back, `reference`/`reparent` change container). The frame does not chase a child the pointer has taken out.
- **Lanes of a pool:** growth across the pool's width goes to the pool (lanes span it); growth along the stack goes to the lane and pushes the following lanes down. Moving the pool's origin left or up moves its header band with it.
- **Auto layout writes position and size together** for every container it resizes, so a reload draws the same picture.

## COSA

1. **Probe first.** Extend the two fixtures (`frontend/scripts/probe/bpmn-lanes-fixture.ts`, `statechart-fixture.ts`) with a scene `drag4` measured from the DOM and the records: for a free-frame child (statechart `Running`'s substate), a partition child (BPMN `Check` in `Sales`, statechart `Waiting` in `Active`'s first region) and a pool lane child, drag by (−40,0), (0,−40), (+40,0), (0,+40) staying inside, and once with the pointer outside. Assert: every gap ≥ 16 px on all four sides after each drag, at drag end and after save and reload; other children's absolute positions unchanged; the outside drag follows `membership`. Add a scene `relayout-reload`: Auto layout, save, reload, every pool and lane record matches what was drawn before the reload (±1 px), Sales contains its flow nodes. Run them on the trunk code first and record which fail.
2. **Fix** in the smallest places: the frame geometry (`irContainment.ts` / `irPartitions.ts` / `irFrame` as found), the drag-end write in `EditorV2.tsx` (existing `syncPositionBatchToJjom` / `syncSizeBatchToJjom` calls only), and the S6 write (`utils/elkContainers.ts` and its call site). If a correct fix needs a CLAUDE.md §3.2 file (`canvasToJjom.ts`, `useJjomSync.ts`, …), write the exact change in a LIR under `docs/lir/` and stop with `Outcome: question`.
3. **Unit tests first, red on the current code**, on the pure frame function: left and top growth with origin move, hand-set size as minimum, children not moved.
4. **Spec and registry.** One dated paragraph in the graphVertex addendum (`docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md`, new section) and one row R-GV-17 in `docs/decisions.md` stating the rule above; reference R-GV-16 and P-2026-10-11-0040.

## COME

- Controls: all S2, S2b, S3, S6 checks of both fixtures pass; the S1 hull scenes are byte-identical; a graph with no graphVertex view is unchanged.
- Gates: `npx tsc --noEmit` (14-error baseline), `viewpoint/ir`, `nodes`, editor-v2 suites, full suite (only the 9 known import failures), `npm run build`, `check:docs`. Mutation bench on the frame function and the drag-end write.
- Measurements (JSON, screenshots, light theme) under `docs/discovery/assets/graphvertex-drag4/`.
- Commits with explicit pathspec and the `Model:` trailer; one inbox entry in `docs/log-inbox/ir-graphvertex.md`; close the ticket of point 3 with `lane-run ticket` if that subcommand is on the trunk, else say so in the entry. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## NON FARE

- No §3.2 file (stop and ask instead). No new dependency. No change to `membership` semantics, to the authoring panel, to `viewpoint/derive/`.
- Do not touch the collapse chip, the bottom-margin ticket of stacked partitions beyond what the four-side rule implies, or the label overhang.
- No `irVersion` bump, no VersionFixer. No `git stash`, no `git add .`, no push.

## HARD STOP

After the commits, with green gates and the measurements saved, stop with `Outcome: hard-stop`. The chat verifies, and Alfonso gives the visual GO before the merge.
