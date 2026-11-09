# Multi-tab, lane L4: one populate owner per model, registries cleared by the last instance

Prompt-ID: P-2026-11-08-0131
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · LIR f888be09f, tests 634dceabf (red), code 587aed3cf (continued by P-2026-11-08-0150 and P-2026-11-08-0245 after the context ceiling) · gates green (typecheck 0 error TS; vitest: 3 import reds baseline) · log entry in docs/log-inbox/multi-tab.md · hard-stop: visual check due · non fuso
Lane: full (critical zone: useJjomSync.ts; standing go-ahead of Alfonso 2026-11-07 04:23 «Si a tutto» for L4, launched with --critical-zone-goahead P-2026-11-08-0131)
Depends: L3 and L5 on the trunk (P-2026-11-07-1249, P-2026-11-07-1516), L4b on the trunk (P-2026-11-07-0833, `acquireProducerMount`), docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.2, §3.7, §7 row L4; R-MT-17
Worktree: ~/jjodel-w-mtl4, branch multi-tab-l4, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (Alfonso 2026-11-07 18:33 «via», L4 before L6 as the discovery orders them; 2026-11-08 00:03 «puoi procedere tu con i merge»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. No dev server and no app probe in this lane: the app measurement of §3.7 and §3.2, before and after, is a continuation lane on the same branch. Every reply opens with [P-2026-11-08-0131 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or gate log; stop only processes you started, by PID. Context discipline: this front's lanes hit the ceiling; read only the line ranges you need, one commit per numbered item; if the context runs short, commit and stop with a handoff.

## Contesto (non rifare l'analisi)

Discovery §3.7: with two `EditorV2` instances mounted on one model, an element created after both mounted by something other than a canvas gesture (Tree View, Properties, JjScript, JjTL, an import) is seen as missing by both populate effects in the same commit, because actions reach the store one macrotask later (`redux/action/action.ts:349`) and the only re-entry guard, `creatingGraphRef`, is per instance; the M2 `existingEdgeKeys` set reads this instance's `rfEdgeCache` only. Result: two vertices for one element, or two M2 edges for one reference. M1 reference and inheritance edges are covered by the module-level pair guard (`useM1ReferenceEdges.ts:148`, `:177`). §3.2: the unmount of any instance clears every module-level registry of `sync/syncState.ts` (`useJjomSync.ts`, the `clear*` calls of the unmount effect), so closing tab B wipes `edgeRefIds` and `canvasEdgePairs` for tab A. R-MT-17 fixes the shape: the first mounted instance of a model owns the populate and hands it over on unmount, the others render only; the registries clear when the last instance of the model unmounts. Precedents: `preview/scriptPreviewStore.ts:117-139` (ref count, `installed++ === 0`) and L4b's `acquireProducerMount` in `components/editor-v2/problems/registry.ts`. Today a second tab on one model is reachable only by crafting it from the console; L6 adds the gesture. Line numbers in the discovery are from `8168b608f`: verify them on this commit.

## COSA

(1) Layer Impact Report first, committed alone: `docs/discovery/lir_2026-11-07_l4_populate_owner.md`. Scope: the populate run and its creators (vertices, M2 edges), the owner registry per model (acquire at mount, hand-over on unmount, what a non-owner still does: render, incremental sync of positions, M1 pair guard), the unmount clears per model by ref count, the interaction with L3's per-tab layout key (a non-owner on another viewpoint must still get its vertices), and the single-tab case, which must behave exactly as today. Name any registry of §3.2 that must stay global and why.

(2) Tests first, red, committed: two instances on one model, a D-first addition of a class and of an M2 reference after both mounted produce one vertex and one edge; the owner unmounts and the other instance becomes owner and populates the next addition; closing one of two instances leaves `edgeRefIds` and `canvasEdgePairs` intact for the other, closing the last clears them; one instance alone, every result equals today's.

(3) The change: a per-model owner in `components/editor-v2/sync/syncState.ts` (acquire, release, isOwner, on the ref-count pattern), used by `components/editor-v2/hooks/useJjomSync.ts` to gate the populate creators and to clear the registries only on the last release of a model. No new reader of `state.viewpoint` (R-LAY-19). `portDistribution.ts` is not touched. Tests green.

(4) Gates at the baselines of `CLAUDE.md` §17: typecheck (print its exit status), vitest (timing tests `languageService`, `outline`, `tolerant`, `laneBoard`, `irCollapsedRender`, `irSelectionRing`, `traceMonitor` and the Chromium close-hook files rerun alone if red, report both), build, check:docs. Log entry in `docs/log-inbox/multi-tab.md` (P9) and the Status flip, both uncommitted (RC-17): the app measurement is the continuation lane.

## HARD STOP

After (4). Any file outside `useJjomSync.ts`, `syncState.ts`, their tests under `components/editor-v2/sync/__tests__/` and `components/editor-v2/hooks/__tests__/`, the LIR, the inbox and this prompt is a stop with Outcome: question, with the smallest option as `Recommended:`. Test mocks in existing test files may be extended without changing assertions; list them. Remove the node_modules symlink before exiting. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.1, §3.2, §3.7, §7 row L4, §8; docs/discovery/lir_2026-11-07_l3_tab_layout_key.md; docs/decisions.md R-MT-1..24 (R-MT-17 above all), R-LAY-18, R-LAY-19; CLAUDE.md §3; components/editor-v2/CLAUDE.md §3.4.
