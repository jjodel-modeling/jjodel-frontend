# Multi-tab, lane L3: the three canvas doors take the tab's layout key

Prompt-ID: P-2026-11-07-1249
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (critical zone: useJjomSync.ts; standing go-ahead of Alfonso 2026-11-07 04:23 for L3, launched with --critical-zone-goahead P-2026-11-07-1249)
Depends: L2 on the trunk (P-2026-11-07-1210: `getLayoutKeyFor`, `viewpointId` on `EditorContext`), the layout-key fix on the trunk (da2af3bf7, 8328662df), docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.3, §3.5, §7 row L3
Worktree: ~/jjodel-w-mtl3, branch multi-tab-l3, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: Alfonso 2026-11-07 04:23 «Si a tutto» (L3 go-ahead) and 09:29 «Ok alle raccomandazioni»

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. No dev server and no app probe in this lane: the app check is a continuation lane on the same branch. Every reply opens with [P-2026-11-07-1249 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or gate log. Context discipline: this front's lanes hit the ceiling; read only the line ranges you need, one commit per numbered item; if the context runs short, commit and stop with a handoff.

## Contesto (non rifare l'analisi)

Discovery §3.3: the layout key enters the canvas through three doors, all reading the global key today: the transformer (`utils/jjomTransformers.ts` `effectiveLayoutOf`, `getActiveLayoutKey()`), the write-back (`sync/canvasToJjom.ts`, five `getActiveLayoutKey()` writes), and the content-size hook (`viewpoint/ir/useContentSize.ts`, `getLayoutKeyOf(s)`). `portDistribution.ts` and `handlePosition.ts` need no change. §3.5: `useContentSize`'s `cascadeWrites` cap is a module-level map keyed by vertex; two tabs share it. L2 put `viewpointId` on `EditorContext` and `getLayoutKeyFor(state, vpId)` beside `getLayoutKeyOf`. The layout-key fix already makes the key an input of the incremental sync (`vertexSnapshot.ts`: `elementSnapshotsOf(..., layoutKey)`, `rekeyedNode`, `layoutKeyOnlyChange`); L3 feeds it the tab's key instead of the global one. Line numbers in the discovery are from `6fcf5d5df`: verify them on this commit.

## COSA

(1) Layer Impact Report first, committed alone: `docs/discovery/lir_2026-11-07_l3_tab_layout_key.md`. Scope: the three doors, the incremental sync and its snapshot, the write-back of positions and sizes per key, the content-size cap per (instance, vertex), what stays global after L3 (L4 and L5 territory), and the single-tab case, which must behave exactly as today.

(2) Tests first, red, committed: with two keys in play, the transformer reads the key it is given; the write-back writes under the key it is given and leaves the other key's record untouched; `useJjomSync`'s snapshot uses the tab's key; the cascade cap counts per (instance, vertex), so two instances on the same vertex do not consume each other's budget; with one tab and the tab key equal to the root, every result equals today's.

(3) The change, by parameter, with the global read as the default when no tab key is given: `effectiveLayoutOf` and its callers in `jjomTransformers.ts`; the five writes of `canvasToJjom.ts`; `useJjomSync.ts` reads the tab key from `EditorContext` (`getLayoutKeyFor`) and passes it to the snapshot and the transformer; `useContentSize.ts` reads the context key and keys `cascadeWrites` by (instance, vertex). No new reader of `state.viewpoint` (R-LAY-19). Tests green.

(4) Gates at the baselines of `CLAUDE.md` §17: typecheck, vitest (timing tests `languageService`, `outline`, `tolerant`, `laneBoard`, `irCollapsedRender`, `irSelectionRing`, `traceMonitor` rerun alone if red, report both), build, check:docs. Log entry in `docs/log-inbox/multi-tab.md` (P9) and the Status flip, both uncommitted (RC-17): the app check is the continuation lane.

## HARD STOP

After (4). Any file outside `jjomTransformers.ts`, `canvasToJjom.ts`, `useJjomSync.ts`, `vertexSnapshot.ts`, `useContentSize.ts`, their tests, the LIR, the inbox and this prompt is a stop with Outcome: question. `portDistribution.ts` is not touched. Remove the node_modules symlink before exiting. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.3, §3.5, §3.6, §7; docs/discovery/lir_2026-11-07_layout_key_resync.md; docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md; docs/decisions.md R-MT-1..23, R-LAY-18, R-LAY-19; CLAUDE.md §3.
