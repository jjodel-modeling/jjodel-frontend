# Refactoring artifact: the «+» menu entry and the target level

Prompt-ID: P-2026-10-24-2200
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation, code, gates and probe)
Depends: P-2026-10-24-0312, P-2026-10-24-0355
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 20:33 (R-JJD-14) and 21:50 («ok procedi con /lane auto»), in the project chat
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-rf1`, branch `jjp-rf1`, cut from `alfonso-frontend-jjtl` at `a78d1e219` plus the commit that
adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-2200 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files (CLAUDE.md §3.2, `VersionFixer.tsx` included) are not
authorised: if one is needed, stop. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the
gates are green. One probe run per tool call. Context discipline: never `cat` a whole large file or log; read by
grep-found ranges; test, build and probe output through `tail` or `grep`. If the context passes about 150k, commit what
is green, write a handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or
3003; stop it at the end. Light theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:`
trailer. Log entry in `docs/log-inbox/jjodie-ui-rf1.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

Rows R-JJD-5, R-JJD-14 in `docs/decisions.md`. `docs/log-inbox/jjodie-ui-s6a.md`, `docs/log-inbox/jjodie-ui-s6b.md`.
`frontend/src/components/scripts/scriptFiles.ts`. `frontend/src/constants/documentTypes.ts` (the `refactoring` entry)
and `frontend/src/pages/components/Navbar.tsx` around the `case 'refactoring':` TODO.

## COSA

Under R-JJD-14, a saved script is a Refactoring artifact:

1. The «Refactoring» entry of the «+» artifact menu (today disabled, «coming soon», subtitle «Model refactoring
   rules») becomes enabled. Subtitle: «In-place changes of a metamodel or model». Choosing it asks the target level
   (Metamodel or Model; for Model, which metamodel, from the project's M2 list) in the same small dialog style the
   other entries use, then creates an empty entry in `DProject.scripts` through the S6a functions and opens its tab.
2. An optional field on the `DProject.scripts` entry records the target: `level?: 'M2' | 'M1'` and, for M1,
   `metamodelId?`. Read with defaults exactly as the other optional fields (no VersionFixer migration, R-JJD-5).
   `openScriptAsFile` (Jjodie's `Open as file`, the editor's `Save as file`) fills it from the model the script was
   planned on. Entries without the field stay valid and are treated as «any level».
3. User-facing names follow R-JJD-14: the tree section reads REFACTORINGS (was SCRIPTS), the megamodel view and the tab
   use «Refactoring»; the file suffix `.jjs` stays. The JjScript language name stays where the language is meant
   (the editor's language label, Jjodie's JjScript mode). Do not rename code identifiers (CLAUDE.md: no renames);
   change labels only.
4. The tab of a Refactoring shows its target under the title (for example «Metamodel» or «Model of <metamodel>»), and
   its existing `Run on <model>` lists only models compatible with the target.
5. Tests for the target field (defaults, `openScriptAsFile` filling it, compatibility filter) and a probe under
   `frontend/scripts/probe/`: «+» → Refactoring → Model of a metamodel → tab opens empty with the target line; the tree
   shows it under REFACTORINGS; `Run on` lists only compatible models; an old entry without the field still opens.
   One crop under `~/.jjodel-lanes/P-2026-10-24-2200/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` once (a first-load
timeout on a fresh server is the known machine issue: re-run once). Commit (`feat(project): refactoring artifacts from
the artifact menu`), then the docs commit.

## HARD STOP

None unless a stop condition fires: `Outcome: done` with the probe measures.

## NON FARE

No «Run refactoring…» on the tab menu (next lane). No co-evolution of conforming models (R-JJD-14 direction, not
planned). No critical-zone file, no `reducer.ts`. No merge, no push.
