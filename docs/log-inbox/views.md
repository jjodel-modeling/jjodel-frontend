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
