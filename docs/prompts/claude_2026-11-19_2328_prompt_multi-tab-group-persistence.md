# Multi-tab lane 3: editor groups persist per user and project (G7)

Prompt-ID: P-2026-11-19-2328
Chat: C-2026-11-18-2337
Front: multi-tab
Status: da eseguire
Lane: full (implementation, no critical-zone file)
Depends: lanes 2a, 2b, metamodels in groups (R-MT-31) and active group (R-MT-32), all merged into the trunk
Worktree: ~/jjodel-w-mtpers, branch multi-tab-persistence, created from the trunk after the active-group merge, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (Alfonso 2026-11-19 15:28 «via fino alla fine», 23:21 «prosegui fino a chiusura»; Q5..Q11 of the discovery approved)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3081, 3087, 3095, 3790, 4700), left running at the hard stop with port and pid. Every reply opens with [P-2026-11-19-2328 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: every lane of this front has come near it. Read only §5, §8.1, §8.2 (row 3) and §10 (Q5..Q11 with their answers) of `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md`, and R-MT-30..R-MT-32 from `docs/decisions.md`; read code by regions; commit each green step; write the handoff first if near the ceiling.

## COSA

G7: when Alfonso reopens a project, its editor groups come back as he left them: the groups and their order, the tabs of each group in order (second tabs `<id>~tab<N>` included, models and metamodels), the active tab of each group, the group widths, the active group, and the viewpoint each tab shows. The design is §5 of the discovery and is approved as written:

- rc-dock `saveLayout`/`loadLayout` with `saveTab`/`loadTab` carrying `{ id, modelId, viewpointId }`, rebuilt through `TabDataMaker` (model and metamodel) with `initialViewpointId`; `viewpointId` is opaque (G9 will store `'@textual'` without a change of the record);
- a module map `tabId → viewpointId` written by `EditorSwitch` when a tab's viewpoint changes;
- key `jjodel.editorGroups.<userId|anon>.<projectId>`, value `{ v: 1, layout, activeGroup }`, in `localStorage` only, never in the project file or in `DUser`/`LProject`; a write that never throws; a validation that refuses the whole record on any structural defect;
- restore once at project open, after `idlookup` holds the project's models, with the pruning of §5.3 (tab of a missing model dropped, empty panel dropped, active group clamped, unknown viewpoint to abstract syntax, summary tab back in group 1, invalid record ignored and the project opens as today);
- non-model tabs (doc_, jjtl_, jjs_, txt_new_, generator tabs) are not persisted in v1;
- the active group restored must agree with R-MT-32: only artifact tabs count.

When to write: on every layout change and every tab viewpoint change, debounced, and at project close. If the debounce needs a timer helper that does not exist, keep it local to `groupPersistence.ts`.

Files approved (§8.2 row 3): new `components/abstract/tabs/groupPersistence.ts` and its test, `Dock.tsx` (restore at open), `DockManager.tsx` (`saveTab`/`loadTab`, the persister), `EditorSwitch.tsx` (viewpoint per tab map), `docs/decisions.md`. Anything else needs a question. Grep before naming the new module's exports.

Record the rule as the next free R-MT row in `docs/decisions.md`, in the register grammar (no free text in the header), and run `scripts/gates/__tests__/decisionsQuery.test.ts` and `docsDigest.test.ts` before committing.

## COME

Tests first, pure, in the new test file: save/restore round trip of two groups with second tabs and different viewpoints; pruning of a missing model, an empty panel, an unknown viewpoint, a missing summary tab; an invalid record ignored; the key per user and project; a write under a throwing `localStorage` does not throw. Gates: typecheck at baseline, vitest green (the three known import failures excepted), build ok, `npm run check:docs`. Mouse probe at 1600, real clicks: open model A and metamodel M, Split Right, open B in group 2, set a different viewpoint on A's second tab, resize the groups, make group 2 active; reload the page and reopen the project: everything as left, the active group included; delete B from the project, reload: B's tab gone, its group kept if it holds other tabs, dropped if empty; open a second project: its own layout, not the first's; clear the key: the project opens as today. No console errors. Crops in the lane folder. Commit code and docs separately, pathspec only, with the trailers Model: claude-opus-5-5, Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>, Claude-Session: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP.

HARD STOP for Alfonso's visual check, dev server running.
