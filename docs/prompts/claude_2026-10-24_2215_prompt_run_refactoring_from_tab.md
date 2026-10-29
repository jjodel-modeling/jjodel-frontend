# Refactoring: «Run refactoring…» from the menu of the active tab's artifact

Prompt-ID: P-2026-10-24-2215
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation, code, gates and probe)
Depends: P-2026-10-24-2200
Status: eseguito 2026-10-24 · lane jjodie-ui-rf2 · code 6c92fc029 · gates green · probe 15/15 · done
Corregge: none
Request: Alfonso, 2026-10-24 20:05 (idea: a script invoked from a menu on the artifact of the active tab), 20:33 (R-JJD-14) and 21:50 («ok procedi con /lane auto»), in the project chat
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-rf2`, branch `jjp-rf2`, cut from `alfonso-frontend-jjtl` at `aceb142a7` (Refactoring artifacts
merged) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short`
(only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-2215 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files (CLAUDE.md §3.2) are not authorised: if one is needed, stop.
Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool
call. Context discipline: never `cat` a whole large file or log; `DockManager.tsx`, `TabDataMaker.tsx` and `EditorV2.tsx`
only by grep-found ranges; test, build and probe output through `tail` or `grep`. If the context passes about 150k, commit
what is green, write a handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000,
3001 or 3003; stop it at the end. Light theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the body,
`Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-rf2.md`, with the Layer Impact Report written before the diff.
Nothing merges anywhere: the chat merges.

## Read first, and only this

Rows R-JJD-2, R-JJD-6, R-JJD-14. `docs/log-inbox/jjodie-ui-rf1.md` (target field `level`/`metamodelId`, compatibility
filter in `projectScripts.ts`), `docs/log-inbox/jjodie-ui-s4b.md` (preview store, `SCRIPT_PREVIEW_REQUEST`),
`docs/log-inbox/jjodie-ui-s4c.md` (Apply as one undo).

## COSA

1. The tab of an open model or metamodel gets «Run refactoring…» in its menu (the tab's context or overflow menu,
   whichever the code already has for model tabs; grep first, and add no new menu system). It lists only the project's
   Refactorings compatible with that artifact: level M2 for a metamodel, level M1 with the same metamodel for a model,
   and the entries without a target («any level»). With none, the item shows disabled with the tooltip «No refactoring
   for this artifact».
2. Choosing one runs it on the whole artifact (not the selection) through the ghost preview: it fires
   `SCRIPT_PREVIEW_REQUEST` with the Refactoring's text and the artifact's model id; Apply stays on the canvas bar and
   is one undo (R-JJD-6). If the artifact is not the one on the canvas, the tab is activated first. Nothing runs without
   the preview.
3. The Refactoring's own tab keeps its `Run on <model>`; the two paths share the same request code (one function, used
   by both).
4. Tests for the compatibility listing used by the menu; a probe under `frontend/scripts/probe/`: a project with an M2
   Refactoring and an M1 one, open the metamodel tab → the menu lists only the M2 one; open a model tab → only the M1
   one; choose it → the preview bar shows the planned count; Apply → one Cmd+Z undoes it; a model of another metamodel
   → the item is disabled. One crop under `~/.jjodel-lanes/P-2026-10-24-2215/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` once (a first-load
timeout on a fresh server is the known machine issue: re-run once). Commit (`feat(project): run a refactoring from the
artifact tab`), then the docs commit.

## HARD STOP

None unless a stop condition fires: `Outcome: done` with the probe measures.

## NON FARE

No selection scope (later). No co-evolution of conforming models. No critical-zone file, no `reducer.ts`. No merge, no push.
