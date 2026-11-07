# Multi-tab, lane L2: per-tab viewpoint plumbing, no behaviour change on its own (plus R-MT-18)

Prompt-ID: P-2026-11-07-0440
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · a99ea2482 · app check done by P-2026-11-07-0457 (LIR addendum) · non fuso: visual check due
Lane: full (five files, `viewpoint/` subtree LIR trigger; not critical zone)
Depends: L1 (merged 04b782a5b), R-MT-1..18, R-LAY-19, docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §7 row L2, §9 Q2 and Q7
Worktree: ~/jjodel-w-mtl2, branch multi-tab-l2, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: none (lane L2 of the discovery's plan, launched under /lane auto)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. No dev server and no app probe in this lane: the app check is a continuation lane on the same branch. Every reply opens with [P-2026-11-07-0440 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or gate log. Context discipline: this front's lanes hit the ceiling; read only the line ranges you need, one commit per numbered item.

A parallel lane (P-2026-11-07-0430, branch multi-tab-layout-key) changes `useJjomSync.ts` and `vertexSnapshot.ts`: do not touch them.

## Contesto (non rifare l'analisi)

Discovery §7, row L2, and §9 Q2/Q7 (both adopted as recommended, R-MT): each canvas gets its own viewpoint id; nothing visible changes while every tab still starts from the root and one tab per model exists (multi-tab becomes visible with L6). R-LAY-19 forbids new readers of `state.viewpoint` in editor-v2 render and write paths.

## COSA

(1) Layer Impact Report, committed alone: `docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md`, covering the five files below, the readers R3 and R7 of the discovery's table, and what stays on `state.viewpoint` until L3 and L5.

(2) Tests first, red, committed: `getLayoutKeyFor(state, vpId)` returns the same key as `getLayoutKeyOf(state)` when `vpId === state.viewpoint`, and the key of `vpId` otherwise; the tab state of `EditorSwitch` initialises from the root; R-MT-18: a saved `''` restores abstract syntax (`activateViewpoint(null)`), distinct from no saved preference.

(3) The plumbing:
- `components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts`: add `getLayoutKeyFor(state, vpId)` beside `getLayoutKeyOf`, which becomes `getLayoutKeyFor(state, state.viewpoint)`. No caller changes here (L3 does them).
- `components/editor-v2/contexts/EditorContext.tsx`: optional `viewpointId` (Rule 11: additive, optional).
- `components/abstract/tabs/EditorSwitch.tsx`: tab state initialised from the root, passed to `EditorV2`; R-MT-18 in the restore at mount.
- `components/editor-v2/EditorV2.tsx`: the prop, provided by context; viewport key from it (`:587`, `:3896`, `:3902`, verify the lines); R3 (`:4041`) reads it.
- `components/editor-v2/Toolbar.tsx`: the picker reads and writes the tab's value and calls `activateViewpoint` (Q2); the tab writes `activateViewpoint` when it gains focus (Q7).

(4) Gates at the baselines of `CLAUDE.md` §17: `npm run typecheck`, `npx vitest run` (if `languageService`, `outline` or `tolerant` timing tests fail, rerun them alone and report both), `npm run build`, `npm run check:docs`. Log entry in `docs/log-inbox/multi-tab.md` (P9) and the Status flip, both uncommitted (RC-17).

## HARD STOP

After (4). Any other file is a stop with Outcome: question. Remove the node_modules symlink before exiting. No push, no merge.

## NON FARE

No change to `useJjomSync.ts`, `vertexSnapshot.ts`, `jjomTransformers.ts`, `canvasToJjom.ts`, `useContentSize.ts`, IR resolution hooks (lanes L3 and L5). No new reader of `state.viewpoint`.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3, §7, §9; docs/decisions.md R-MT-1..18, R-LAY-19; docs/prompts/claude_2026-11-07_0105_prompt_multi_tab_l1_editorswitch_crosswrites.md (scene 3b).
