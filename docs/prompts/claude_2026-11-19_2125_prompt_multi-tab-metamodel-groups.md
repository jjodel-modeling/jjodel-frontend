# Multi-tab: metamodels in editor groups (open in the active group, Split Right, second tab)

Prompt-ID: P-2026-11-19-2125
Chat: C-2026-11-18-2337
Front: multi-tab
Status: eseguito 2026-11-19 · lane full · c7e6d5661, eed0b25e2 · verifica visiva passata 2026-11-19 22:06
Lane: full (implementation, no critical-zone file)
Depends: P-2026-11-19-1600/1745 (lane 2a) and P-2026-11-19-1820/1915 (lane 2b), both merged into the trunk; R-MT-29 (L4c, registries keyed by model)
Worktree: ~/jjodel-w-mtgmm, branch multi-tab-groups-mm, created from the trunk after the 2b merge, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (Alfonso 2026-11-19 21:13 and 21:18; words in `~/.jjodel-lanes/P-2026-11-19-2125/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3790, 4700), left running at the hard stop with port and pid. Every reply opens with [P-2026-11-19-2125 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: every lane of this front has been near it. Read R-MT-25, R-MT-26, R-MT-30 and §2.2, §3.1 of `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md` only; read code by regions; commit each green step; write the handoff first if near the ceiling.

## COSA

Alfonso, 21:18: «any model or metamodel that is opened must open where the bar is active, regardless of how many artifacts are already open». Today a metamodel always opens in the left group, whatever group is active, because metamodels have no second tab (R-MT-25: «a second tab on a metamodel is a known limit, a later lane if wanted»; `DockManager.tsx:315` and `:342`: «No second tab on a metamodel: it owns no tab viewpoint»). Alfonso, 21:13, also asked why the metamodel editor has no Split Right. This lane lifts the limit:

1. Opening rule, the same for models and metamodels (G3 made uniform): the artifact opens as a tab in the active group. If the active group already has a tab of it, that tab is focused. If it is open only in other groups, a new tab of it opens in the active group (a second tab, `<id>~tab<N>`), as 2a does for M1 models. Nothing is moved out of the other groups.
2. Split Right on metamodel tabs, as on model tabs: the copy opens in a new group to the right, on the same viewpoint.
3. A metamodel's second tab owns its tab viewpoint, as a model's does: the picker offers Abstract syntax and the metamodel's syntax viewpoints; same model id, shared selection by element (G5), titles `<metamodel> · <viewpoint>` when it shows in more than one tab.
4. Record R-MT-31 in `docs/decisions.md`, superseding the metamodel limit of R-MT-25 and the «not now» of R-MT-26; write it in the register grammar (no free text in the header) and run `scripts/gates/__tests__/decisionsQuery.test.ts` and `docsDigest.test.ts` before committing.

First, a short read (in the reply, no report file needed unless it grows past a page): every place that refuses or special-cases a metamodel's second tab (grep `second tab`, `isMetamodel`, `~tab` in `DockManager.tsx`, `dockGroups.ts`, `EditorSwitch.tsx`, `Toolbar.tsx`, `EditorV2.tsx`, `Navbar.tsx`), and what a metamodel tab needs to own a tab viewpoint. Then implement. Files approved: those six, their tests, `docs/decisions.md`. Anything else needs a question.

## COME

Tests first for the opening rule (pure where possible). Gates: typecheck at baseline, vitest green (three known import failures excepted), build ok, `npm run check:docs`. Mouse probe at 1600 and 1280: open a model, Split Right, make group 2 active, open its metamodel from the Tree View (it lands in group 2); make group 1 active and open the same metamodel (a second tab in group 1); Split Right on a metamodel tab (a third group or the copy to the right, same viewpoint); change the viewpoint of one metamodel tab, the other keeps its own; edit a class in one metamodel tab, both canvases show it; close tabs down to one; no console errors. Crops in the lane folder. Commit code and docs separately, pathspec only.

HARD STOP for Alfonso's visual check, dev server running.
