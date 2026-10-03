# Section: chat of the derived notations polish (Cowork, lanes 1300, 1302, 1304, lane auto)

Written 2026-10-03 about 19:30 (Rome). It is this chat's section only; the shared `sessione_CORRENTE.md` in the Project Knowledge was not rewritten here because the file holds the sections of six other chats. Whoever folds sections next should paste this one in.

## State

Everything below is on the trunk `alfonso-frontend-jjtl`, not pushed. Nothing of this chat is left on a branch. No lane of this chat is running. Deadline for the MODELS demo: merge on the trunk by 2026-10-07 (met for these items).

## Landed on the trunk

- P-2026-10-03-1300 `derived-notations-polish`: merge `5408f4a69`, closed `764e00502`. Name row, State machine drawn as Statechart and hidden from the picker, Petri bars 56x12 with the name outside, Initial 20 / Terminal 24, mono guards, fork/join ink bar.
- P-2026-10-03-1302 `viewpoint-panel-naming`: merge `7e856190d`, closed `9ff95bede`. Derived viewpoint name `<metamodel> / <notation label>`; `ui/Checkbox` for Border.
- P-2026-10-03-1304 `derived-notations-edges`: merged by P-2026-10-03-1901 (`843b2fa6b`, direct, gates green: typecheck the known 14, vitest 7160, build 0, check:docs 4/4), closed `106aae181`. Rollback tag `pre-derived-notations-edges` on `67fa607de`. Branch tip before merge `30b4acc4c`. Smoke on 3001: `barOrientation.ts` served with the merged identifiers. Two earlier merge attempts stopped at `Outcome: blocked` (1838: the branch prompt was still `da eseguire`; 1853: another chat had uncommitted RC-41 files in the trunk); both prompts are now `non eseguito · superseded by P-2026-10-03-1901`.

## What 1304 delivered

Q8 (i) ELK input fixes, Q5/Q8 (iii) arc geometry, Q9b open entry arrowhead, Q9a empty rows hidden (`structure.emptyBehavior`), Q2 + Q4 end sides and diamond ends, Q7 `VertexViewIR.visible`, Q1 classic Petri arcs on ORTHOGONAL, Q6 label `event [guard]`, Q3 bar orientation (option B: square box, bar drawn inside, orientation from the dominant axis of the vectors to the neighbours, 20 percent hysteresis, recomputed on open, after Auto layout and at drag release, nothing stored on the node, `shape.barThickness`). Decision rows R-VP-54 to R-VP-57 in `docs/decisions.md`.

## Decision of Alfonso (2026-10-03, «2 e 3»)

The Q3 turn showed a regression without a layout (the router does not avoid nodes; the square box grows from the saved position): DemoFlowB Activity went from 7 to 11 crossings and one arc ran 447 px through nodes. Chosen: Activity and Flowchart fork/join stay out of the turn (back to the pre-Q3 numbers, verified at 0.01 px on DemoFlowB), both Petri notations keep the turn, and the router becomes its own item. Alfonso then gave the visual OK on the crops.

## Open

1. Router that avoids nodes (item 11.2 of the 1304 report addendum, priority medium). Cause of the no-layout crossings on all three panes. Not a lane yet.
2. Classic Petri without a layout is worse than before Q3 (1 crossing, 114 px through a node, 5 crossed labels). For the demo, show it after Auto layout.
3. Flowchart without a layout opens on the positions Activity's Auto layout left, so its wider boxes overlap `left` and `right`; positions are shared between viewpoints, not a Q3 effect. No pre-Q3 measurement exists for the Flowchart pane.
4. `ui/Checkbox` dark-theme contrast and label weight: optional lane.
5. Which notation Alfonso's pastel fork/join and large Initial/Terminal screenshot used (Generic notation is not covered by 1300): unconfirmed.
6. `frontend/scripts/auto-intake.config.json` is modified in the trunk by another session (mode live, RC-41); not this chat's, not committed.
7. Parked from earlier: `selected` flag on edges after the demo, T9 fix A, handle-slot lane, DemoFlowB lanes ticket. Viewpoints already derived keep the old look until re-derived (R-B9).

## Prompts of this chat

P-2026-10-03-1300 ✅ merged; 1302 ✅ merged; 1304 ✅ merged (via 1901); 1405, 1421 (merge, closed); 1838 ⚠️ blocked, superseded; 1853 ⚠️ blocked, superseded; 1901 ✅ closed.
