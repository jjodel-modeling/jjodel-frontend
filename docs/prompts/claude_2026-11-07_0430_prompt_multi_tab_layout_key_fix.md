# Multi-tab, layout-key fix (R-MT-19): the incremental sync re-transforms every vertex when the layout key changes

Prompt-ID: P-2026-11-07-0430
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · 03a093081, cheap path 8328662df (P-2026-11-07-0555) · app probes pass on 8328662df (P-2026-11-07-0628); verifica visiva in attesa del GO (crops in ~/.jjodel-lanes/P-2026-11-07-0555/crops-0628/)
Lane: full (critical zone: useJjomSync.ts; standing go-ahead of Alfonso 2026-11-07 04:23, R-MT-19, launched with --critical-zone-goahead P-2026-11-07-0430)
Depends: R-MT-19, R-LAY-14, R-LAY-18, docs/discovery/discovery_2026-11-07_layout_switch_after_242a82bcd.md §5, §6
Worktree: ~/jjodel-w-mtlk, branch multi-tab-layout-key, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: Alfonso 2026-11-07 04:23 «Si a tutto» (fix ratified, critical-zone go-ahead)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. No dev server and no app probe in this lane: the app check is lane P-2026-11-07-0431, launched after this one on the same branch. Every reply opens with [P-2026-11-07-0430 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or gate log. Context discipline: this front's lanes hit the ceiling; read only the ranges you need, one commit per numbered item.

## Contesto (non rifare l'analisi)

L0b measured it (report above, §2-§5): since `242a82bcd` switching between two exclusive viewpoints leaves the nodes at the previous key's positions (0/3 on the trunk, 3/3 on `242a82bcd~1`); a reload repairs it. Cause: nothing in the incremental sync of `frontend/src/components/editor-v2/hooks/useJjomSync.ts` depends on `getLayoutKeyOf(state)`, so `unchanged` skips every vertex.

## COSA

(1) Layer Impact Report first, committed alone: `docs/discovery/lir_2026-11-07_layout_key_resync.md`, covering exactly the scope of §5 of the L0b report: sync layer and v2-flow canvas (positions, sizes, `measured`, handles through the ResizeObserver, the anti-bounce interplay with `isCanvasUpdated`); edges, which are not re-patched; `useIRContainment` / `applyContainerLayout`, which reads the key itself; `fitView` and the viewport per key; the D-layer, which receives no writes. Plus the cost on the 407-instance harness model (§6), as an estimate from the code, to be measured in lane 0431.

(2) Tests first, red on this commit: a unit test (next to the existing `useJjomSync` / `vertexSnapshot` tests) where the layout key changes and nothing else does, asserting that every vertex is re-transformed once and takes the position of `layoutByViewpoint[newKey]`, and that a second run with the same key re-transforms nothing (the incremental path of `d9ea6a486` stays intact). Commit the red tests.

(3) The fix, in `useJjomSync.ts` only (plus `vertexSnapshot.ts` if the snapshot must carry the key): a dependency on `getLayoutKeyOf(state)`; when it differs from the last run, bypass `unchanged` for that run (or clear `prevElementsRef`), keeping the existing patch path with position plus the `patchedNodeSizes` / `measured` removal. No change to edges, D-layer, `portDistribution.ts`, or the per-tab key (that is lane L3, which builds on this). Tests green.

(4) Gates at the baselines of `CLAUDE.md` §17: `npm run typecheck`, `npx vitest run` (if `languageService`, `outline` or `tolerant` timing tests fail, rerun them alone and report both), `npm run build`, `npm run check:docs`. Log entry in `docs/log-inbox/multi-tab.md` (P9) and the Status flip of this prompt, both uncommitted (RC-17): the visual check is lane 0431.

## HARD STOP

After (4). Any file outside `useJjomSync.ts`, `vertexSnapshot.ts`, their tests, the LIR, the inbox and this prompt is a stop with Outcome: question. Remove the node_modules symlink before exiting. No push, no merge.

## NON FARE

No change to `portDistribution.ts`, `jjomTransformers.ts`, `useIRContainment`, the edge pipeline, the reducer. No refactor of the incremental sync beyond the key check.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_layout_switch_after_242a82bcd.md; docs/discovery/discovery_2026-10-21_jjomsync_incremental.md; docs/discovery/lir_2026-10-21_jjomsync_incremental.md; docs/decisions.md R-MT-19, R-LAY-14, R-LAY-18; commits 242a82bcd, d9ea6a486; CLAUDE.md §3.
