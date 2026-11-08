# Multi-tab, lane L6: a second tab on one model, «Open in new tab ▸» and «Open beside ▸»

Prompt-ID: P-2026-11-08-0808
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-08 · lane multi-tab-l6 · 89fa42c59 · verifica visiva da fare (crops in ~/.jjodel-lanes/P-2026-11-08-1003/)
Lane: full (no critical zone; makes §3.7 and §4.2 of the discovery reachable by a gesture, so it lands after L4 and L4b)
Depends: L4 on the trunk (one populate owner per model, R-MT-17), L4b, L2, L3, L5 on the trunk; docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §2.1, §2.2, §7 row L6; R-MT-4, R-MT-9, R-MT-10, R-MT-24
Worktree: ~/jjodel-w-mtl6, branch multi-tab-l6, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (Alfonso 2026-11-07 18:25 «leggi R-MT-24 prima di scrivere il prompt di L6», 18:33 «via»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. No dev server and no app probe in this lane: the app check (two tabs from the gesture, Open beside, closing, deleting the model) is a continuation lane on the same branch. Every reply opens with [P-2026-11-08-0808 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or gate log; stop only processes you started, by PID. Context discipline: this front's lanes hit the ceiling; read only the line ranges you need, one commit per numbered item; if the context runs short, commit and stop with a handoff. Before introducing a new identifier (CSS class, exported name, event, menu id), grep the codebase for it.

## Contesto (non rifare l'analisi)

Discovery §2.1: a model tab's id is the model id (`components/abstract/tabs/TabDataMaker.tsx`), so a second tab on one model cannot exist today. §2.2 lists every site that equates tab id and model id: `abstract/Dock.tsx:375-390` (`idlookup[activeId]` resolves the model and fires `EDITOR_TYPE_CHANGE { modelId: activeId }`: activating a second tab would fire nothing), `abstract/Dock.tsx:360` (only `dockbox.children[0]` drives the side panels: a known limit, unchanged by this lane), `abstract/DockManager.tsx:67-75` (`closeTabsForEntity` closes only the bare id), `abstract/DockManager.tsx:222-229` (`openBeside` finds `modelId`), `pages/components/Navbar.tsx:718-724` (`jjodel.showSingletons.${tab.id}`), `codegen/ui/canvasSelection.ts:46`, `:98`, `:132-136` (finds the first tab only: acceptable). R-MT-9: the second tab opens from «Open in new tab ▸ <viewpoint>» on the model row (Tree View, model rail); no drag gesture. R-MT-24: the same menu also offers «Open beside ▸ <viewpoint>», which opens the second tab in a panel to the right through `DockManager.openBeside` (`abstract/DockManager.tsx:204`, today called only by `ScriptTab.tsx:239`) with its preconditions (horizontal dockbox, nothing maximized, no consumer-mode metamodel). The tab's viewpoint is React state of the tab via `EditorContext.viewpointId` (R-MT-5, L2). R-MT-4: two tabs on the same (model, viewpoint) are allowed and share the layout. Line numbers are from `8168b608f`: verify them on this commit.

## COSA

(1) Discovery note first, committed alone, short: `docs/discovery/discovery_2026-11-08_l6_second_tab.md` (path `docs/discovery/`, naming `discovery_<data>_<descrizione>.md`). It verifies the §2.2 sites on this commit, names the menu sites of R-MT-9 (Tree View and model rail context menus, file and line), says how a tab carries its viewpoint at creation (the L2 path), and answers the two open points of R-MT-24: how `openBeside` addresses the second tab (by tab id, `ScriptTab` unchanged) and what happens when `openBeside` returns false. For the second point give one `Recommended:` line (fall back to a new tab, or show the item disabled when the preconditions are known false at menu time) and adopt it unless it needs a file outside the list below.

(2) Tests first, red, committed: the tab-id helper (first tab `<modelId>`, later tabs a suffix, decoded in one place, round trip and no collision with existing ids); `closeTabsForEntity` closes every tab of the entity; activating a second tab fires `EDITOR_TYPE_CHANGE` with the decoded model id; `openBeside` with a second tab's id; the fallback chosen in (1); one tab per model, every result equals today's.

(3) The change: the helper in `components/abstract/tabs/TabDataMaker.tsx` (or beside it, one module), its decoding in `components/abstract/Dock.tsx` (the `EDITOR_TYPE_CHANGE` site) and `pages/components/Navbar.tsx` (the singleton toggle key), `closeTabsForEntity` and `openBeside` in `components/abstract/DockManager.tsx`, and the two menu items «Open in new tab ▸ <viewpoint>» and «Open beside ▸ <viewpoint>» at the menu sites named in (1), listing the model's syntax viewpoints plus abstract syntax. Labels in English, Bootstrap Icons only. Tests green.

(4) Gates at the baselines of `CLAUDE.md` §17: typecheck (print its exit status), vitest (timing tests `languageService`, `outline`, `tolerant`, `laneBoard`, `irCollapsedRender`, `irSelectionRing`, `traceMonitor`, `jjelIslands` and the Chromium close-hook files rerun alone if red, report both), build, check:docs. Log entry in `docs/log-inbox/multi-tab.md` (P9) and the Status flip, both uncommitted (RC-17): the app check is the continuation lane.

## HARD STOP

After (4). Any file outside `TabDataMaker.tsx` (and one new helper module beside it), `Dock.tsx`, `DockManager.tsx`, `Navbar.tsx`, the two menu-site files named in (1), their tests, the discovery note, the inbox and this prompt is a stop with Outcome: question, with the smallest option as `Recommended:`. No file of the critical zone (`useJjomSync.ts`, `portDistribution.ts`). `ScriptTab.tsx` keeps its behaviour. Test mocks in existing test files may be extended without changing assertions; list them. Remove the node_modules symlink before exiting. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §2.1, §2.2, §2.3, §7 row L6, §8; docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md; the L4 LIR `docs/discovery/lir_2026-11-07_l4_populate_owner.md`; docs/decisions.md R-MT-1..24 (R-MT-4, R-MT-5, R-MT-9, R-MT-10, R-MT-24 above all).
