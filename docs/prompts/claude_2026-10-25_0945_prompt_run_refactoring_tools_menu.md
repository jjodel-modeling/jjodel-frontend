# Refactoring: «Run refactoring on <name>…» under Tools in the main menu

Prompt-ID: P-2026-10-25-0945
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation, code, gates and probe)
Depends: P-2026-10-24-2215
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-25 09:42 and 09:43, in the project chat («e se fosse sotto Tools, nel menu principale che si attiva solo quando applicabile?», «confermo .. vai in /lane auto»)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-tools`, branch `jjp-tools`, cut from `alfonso-frontend-jjtl` at `8aaece11e` plus the commit that
adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-0945 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 60 minutes. No subagents, no
background tasks. Commit as soon as the gates are green. One probe run per tool call. Context discipline: never `cat` a
whole large file or log; `Navbar.tsx` only by grep-found ranges (the Tools menu is near line 1598); test, build and probe
output through `tail` or `grep`. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or
3003; stop it at the end. Light theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:`
trailer. Log entry in `docs/log-inbox/jjodie-ui-tools.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

Row R-JJD-17 (and R-JJD-14) in `docs/decisions.md`. `docs/log-inbox/jjodie-ui-rf2.md` (the right-click menu,
`RunRefactoringMenu.tsx`, `runScriptOnModel`, the compatibility listing in `projectScripts.ts`).

## COSA

1. Under Tools in the main menu (Navbar, Advanced mode, as Tools is today), add «Run refactoring on <name>…», where
   <name> is the active tab's model or metamodel. Choosing it lists the Refactorings compatible with that artifact (the
   same listing and the same run function as the right-click menu; one code path, no copy). Choosing one runs it through
   the ghost preview; Apply stays on the canvas bar (one undo).
2. When the active tab is not a model or metamodel: «Run refactoring…» disabled, tooltip «Open a model or metamodel».
   When no Refactoring is compatible: «Run refactoring on <name>…» disabled, tooltip «No refactoring for this
   metamodel» (or «for this model»). Follow the pattern of the existing disabled entries of that menu (for example
   «No metamodel tools»).
3. The right-click menu on the tab stays as it is. Tools stays Advanced-only; no Basic-mode entry.
4. Tests for the label and enabled state (pure function of the active artifact and the compatible list); a probe under
   `frontend/scripts/probe/`: open a model tab → Tools shows «Run refactoring on <model>…» enabled, its list matches the
   right-click list, choosing one shows the preview bar; open a metamodel with no M2 Refactoring → disabled with the
   tooltip; dashboard → no Tools menu as today. One crop under `~/.jjodel-lanes/P-2026-10-25-0945/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(project): run a refactoring from the Tools menu`), then the docs commit.

## HARD STOP

None: `Outcome: done` with the probe measures.

## NON FARE

No «⋯» icon, no Basic-mode change, no critical-zone file. No merge, no push.
