# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-01 — docs: ELK auto-layout quality, measured per notation (P-2026-10-01-2215)
**Prompt**: `claude_2026-10-01_2215_prompt_elk_layout_discovery.md`, Phase 1 only, heavy, on `~/jjodel-w-elklayout` branch `elk-layout-disc`. Verify by measurement why the toolbar auto-layout falls short of commercial-grade drawings: points 1-7 on `elkLayout.ts` and `handleAutoLayout`, variants V0..V5 on real graphs, per-notation profile draft.
**Files touched**: `e83a16d41`: `docs/discovery/discovery_2026-10-01_elk_layout_quality.md` (new). This commit: this entry, one ticket, the prompt's Status line. Nothing under `frontend/src`; probes and crops gitignored (`frontend/scripts/smoke/_tmp_elk_*`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only on `frontend/src` (`git status` clean but for ignored `_tmp_` files); no gate run, no code changed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (Phase 1; prospective reports for F4 and F5 in the report §6)
**Smoke visivo**: non applicabile
**Notes**: Probe via `lane-run probe` on 3216: 87/87, EXIT=0, no page error; node elkjs reproduces the in-app call at 0 px (7/7). ELK's own geometry reaches 0 on every hard metric in 7/7 scenes; fixing ELK's input alone with our router worsens label collisions (Activity 2 → 7 → 5). Fixed-side ports never helped. Seven questions, each with a Recommended line (report §10); decisions D-A..D-C await Alfonso.
**Prompt document name**: 2026-10-01 22:15

## 2026-10-01 — ticket: hidden object-as-edge vertices reach ELK as 180x120 boxes
**Ticket**: `computeElkLayout` (`elkLayout.ts:67`) sends every React Flow node to ELK, including the vertices `irEdgeViews.ts:289` marks `hidden` because their object is drawn as an edge (ControlFlow, Arc, Transition). Measured: 9, 9, 6 and 5 phantom 180x120 children in Flowchart, Activity (UML), Petri net (classic) and Statechart (UML); disconnected, so ELK packs them as components (Statechart's visible drawing changed, 640x568 vs 430x432). Contained children hidden by `irContainment.ts:281` take the same path (not measured). Filter `hidden` nodes in the layout input.
**Priority**: medium
**Found in**: P-2026-10-01-2215
**Detail**: docs/discovery/discovery_2026-10-01_elk_layout_quality.md

## 2026-10-02 — feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)
**Prompt**: `claude_2026-10-01_2215_fase2_elk_layout.md`, Phase 2, heavy, no critical-zone go-ahead. ELK input (real sizes, hidden nodes out, labels, model order off, per-notation profile), ELK routes drawn in session, 8 px snap, Activity bars across the flow (Q7); Alfonso ratified Q1, D-B, Q7, the chat adopted Q2-Q6.
**Files touched**: merge `5c9aadb1c` (trunk `c3a9c9ffd`); docs `ccba4b030`; code `803b84e3a`: `utils/elkLayout.ts`, `utils/__tests__/elkLayout.test.ts` (new), `EditorV2.tsx`, `edges/UnifiedEdge.tsx`, `viewpoint/derive/notations.ts`, `viewpointDerivation.ts`, `__tests__/activityUml.test.ts`, `__tests__/erChen.test.ts`, `nodes/__tests__/nodeSizing.test.ts`. This commit: `docs/decisions.md` (R-VP-37..47), the report's §12, this entry, a ticket, the Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: unknown — typecheck 14, the §17 set; vitest 6487 passed, the 9 known import reds; build exit 0; rest probe 0 px on 7 scenes outside Jodie's animated avatar (same noise baseline against baseline); bench 38/38 plus the renderer mutant. Gestures after a layout other than a drag (reconnect, label edit, segment drag) not exercised.
**Out-of-scope changes**: yes — 9 files (RC-11): the three pinned tests outside the DOVE (`activityUml`, `erChen`, `nodeSizing`: the bar and the `_state` they pin) and the toolbar prop line outside `handleAutoLayout`.
**Layer Impact Report**: not-required (no §3.2 file touched; D-B deferred)
**Smoke visivo**: passato — probe, unattended: 6 of 7 scenes at 0 overlaps, 0 edge-node, 0 label collisions, 0 crossings after a toolbar layout; Petri 2 label-edge; Alfonso's GO pending (RC-23)
**Notes**: Causa (c): Phase 1's V4 placed outside node names across the flow, which the Petri renderer does not; its transition names stay crossed by their arc (report §12.1 Q1). Closes the ticket on hidden object-as-edge vertices (`a2b4e8168`) and, for the toolbar layout, the DemoFlowB guard-label ticket. Merge `5c9aadb1c` inherits `check:addonly` findings of the trunk's `d2eb5fb83` (196 of its 199).
**Prompt document name**: 2026-10-01 22:15

## 2026-10-02 — ticket: Petri net (classic) transition names are crossed by their outgoing arc after the toolbar layout
**Ticket**: Under the left-to-right profile of Petri net (classic) the transition name is painted right of the upright bar and the outgoing arc leaves the bar's right side through it: `t1` and `t2` on DemoPetri after a toolbar auto-layout (2 label-edge collisions, against 3 place names at V0). The label position is the notation's (R-VP-24); moving it above the bar, or the outgoing port off the centre, removes it. The second needs the handle alignment of D-B (critical zone).
**Priority**: medium
**Found in**: P-2026-10-01-2215
**Detail**: docs/discovery/discovery_2026-10-01_elk_layout_quality.md
