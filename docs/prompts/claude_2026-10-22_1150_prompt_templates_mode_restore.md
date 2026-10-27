# Templates page: the app bar mode falls back to Basic on entry

Prompt-ID: P-2026-10-22-1150
Chat: C-2026-10-22-1050
Front: notation-library
Lane: fast (one defect found in the RC-23 check of the L-B1..L-E lanes; dashboard only, no critical-zone file)
Depends: none
Status: eseguito 2026-10-22 · lane tpl-mode · a8f9b2115 · visual check passed 2026-10-22 12:13 (chat C-2026-10-22-1050, RC-23)
Corregge: 2026-10-19 16:15 (`claude_2026-10-19_1615_prompt_templates_page.md`: the Templates page enters in Basic when the persisted mode is Advanced)
Request: Alfonso, 2026-10-22 11:12, in the project chat: «allora chiudiamo questa voce con /lane auto» on closing the notation-library front

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the defect is reproduced below; the diagnosis is part of the lane). P8 replaced: the chat checks the page after exit (RC-23).

Worktree: `~/jjodel-w-tplmode`, branch `tpl-mode`, created by the chat from `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-22-1150 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. Dev server for your own checks: `npm start -- --port 3110 --strictPort`, stopped before you exit.

## Context
Measured by the chat on the trunk dev server (localhost:3000, `b367ff16c`): with `localStorage['jjodel.interfaceMode'] === 'advanced'`, going from All projects to Templates (sidebar or `#/templates`) shows Basic in the app bar, `document.documentElement.dataset.mode === 'basic'`, and the gallery ids of R-LIB-15 are hidden. Back on All projects the mode reads Advanced again; the localStorage value is never changed. Switching to Advanced while on Templates works until the next entry.

`Templates.tsx:160` reads Redux `s.advanced`. The Navbar restores the persisted mode only once per mount (`Navbar.tsx`, the effect after `selectInterfaceMode`, «Only the positive direction is restored»), so any path that resets the Redux root to `advanced: false` while the Navbar stays mounted leaves the app bar and the page in Basic. The comment at `Templates.tsx:159` («the reset of the open ticket») suggests such a reset happens on this route.

## COSA
1. Find what sets Redux `advanced` to false on the way to Templates (a state reset, a LoadAction, a project close) and say it in the report with file and line.
2. Fix it so that the persisted mode survives the transition. Recommended: make the restore re-apply the persisted Advanced whenever `props.advanced` turns false without an explicit `disableAdvancedMode()` (a ref set by the explicit toggle distinguishes the two), so every reset path is covered, not only this route. If the cause is a reset that should not happen at all on Templates, remove it instead and say why.
3. A unit test on the rule if it is a pure function; otherwise a probe that loads `#/allProjects`, sets Advanced, goes to `#/templates` and asserts `dataset.mode === 'advanced'`, the app bar's active option, and one visible `.tpl-card__id`; then Basic, reload, Templates, asserts Basic (the negative direction must still hold).
4. Gates: typecheck, the touched tests, `check:docs`, `npm run build`.
5. One `fix(templates)` or `fix(navbar)` commit, one docs commit with the log entry in `docs/log-inbox/templates-ui.md` and this prompt's `Status:` line.

## DOVE
`frontend/src/pages/components/Navbar.tsx` (the restore effect and the enable/disable helpers only), `frontend/src/pages/Templates.tsx`, the file that performs the reset if it is found to be the cause, a test or probe under `frontend/src/**/__tests__/` or `frontend/scripts/probe/`, `docs/log-inbox/templates-ui.md`, this prompt file.

## NON FARE
No change to `useInterfaceMode.ts` semantics beyond what the fix needs; no change to the shell tokens or to `_shell.scss`; no critical-zone file. No push, no merge.

## HARD STOP
None planned. Stop with `Outcome: question` if the reset turns out to be in `redux/reducer/reducer.ts` or in `LoadAction`: that is core and waits for a decision.
