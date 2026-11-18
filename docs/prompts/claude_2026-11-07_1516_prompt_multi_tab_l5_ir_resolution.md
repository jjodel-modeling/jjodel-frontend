# Multi-tab, lane L5: IR resolution with the tab's viewpoint

Prompt-ID: P-2026-11-07-1516
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · a87146a64 (LIR), 7b3cf6d2a (tests red), f2ddead3d · scope Option A approved (EditorV2.tsx, ObjectNode.tsx, two test mocks) · cut at AM-8, closed by P-2026-11-07-1730 (gates, app check, LIR §7) · hard-stop: visual check due · non fuso
Lane: full (`viewpoint/` subtree LIR trigger; not critical zone)
Depends: L2 and L3 on the trunk (P-2026-11-07-1210, P-2026-11-07-1438), docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §7 row L5 and the readers table (R1..R8)
Worktree: ~/jjodel-w-mtl5, branch multi-tab-l5, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (lane L5 of the plan under /lane auto, Alfonso 2026-11-07 «Ok alle raccomandazioni»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. No dev server and no app probe in this lane: the app check is a continuation lane on the same branch. Every reply opens with [P-2026-11-07-1516 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or gate log; stop only processes you started, by PID. Context discipline: read only the line ranges you need, one commit per numbered item; if the context runs short, commit and stop with a handoff.

## Contesto (non rifare l'analisi)

After L3 a tab's positions follow the tab's viewpoint, but which nodes and views the tab draws still follow the global `state.viewpoint`: the L3 check (P-2026-11-07-1352, LIR addendum §6 of `docs/discovery/lir_2026-11-07_l3_tab_layout_key.md`) measured a tab kept on V drawing 6 nodes while focused and 10 while the other tab, on W, was focused. Discovery §7 row L5: `useIRView`, `useIRViewpointActive`, `useIRRowView` and `useIRContainment` read the context id into `computeIRSignature` / `getIRIndex`; `IRForm` resolves host first, then context; `resolveMetaclassColoring` (R8, `view/viewPoint/metaclassPalette.ts`) takes the id; the Symbol Editor carries its opener's id. The precedent is R-DMV-1. L2 put `viewpointId` on `EditorContext`; with no tab id every reader keeps today's global behaviour. Verify the discovery's line numbers on this commit.

## COSA

(1) Layer Impact Report first, committed alone: `docs/discovery/lir_2026-11-07_l5_ir_resolution_tab_viewpoint.md`. Scope: the IR resolution hooks and their signature and index caches (keyed by viewpoint id, no cross-tab cache pollution), `IRForm`, the metaclass palette, the Symbol Editor opener, the readers of the discovery's table that remain on `state.viewpoint` after L5 and why, and the single-tab case, which must behave exactly as today.

(2) Tests first, red, committed: two viewpoint ids in play, the IR resolution for a vertex returns the views of the id it is given; the signature and index caches do not mix the two ids; `resolveMetaclassColoring` follows the id; with no id given, every result equals today's.

(3) The change, by parameter with the context id, in `components/editor-v2/viewpoint/ir/irResolve.ts`, `components/editor-v2/viewpoint/ir/useIRContainment.ts`, `components/editor-v2/viewpoint/ir/IRForm.tsx`, `view/viewPoint/metaclassPalette.ts`, `components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx`. No new reader of `state.viewpoint` (R-LAY-19). Tests green.

(4) Gates at the baselines of `CLAUDE.md` §17: typecheck (print its exit status), vitest (timing and Chromium close-hook files rerun alone if red), build, check:docs. Log entry in `docs/log-inbox/multi-tab.md` (P9) and the Status flip, both uncommitted (RC-17): the app check is the continuation lane.

## HARD STOP

After (4). Any other source file is a stop with Outcome: question, with the smallest option as `Recommended:`. Test mocks in existing test files may be extended without changing assertions; list them. Remove the node_modules symlink before exiting. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3, §7, readers table; docs/discovery/lir_2026-11-07_l3_tab_layout_key.md §6; docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md; docs/decisions.md R-MT-1..23, R-DMV-1, R-LAY-19.
