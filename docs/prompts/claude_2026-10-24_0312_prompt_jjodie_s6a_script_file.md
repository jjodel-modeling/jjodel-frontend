# Jjodie S6a: script as a project file (persistence and tab)

Prompt-ID: P-2026-10-24-0312
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S6a, core field authorised by R-JJD-5)
Depends: P-2026-10-24-0115
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 01:14, in the project chat («S6 ok»: optional DProject.scripts, no migration)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`, Q6 and A1). CLAUDE.md rule 5 (no
core change without approval) is satisfied for the optional field on `DProject` in `joiner/classes.ts` by R-JJD-5,
ratified by Alfonso at 01:14. `VersionFixer.tsx` and the other critical-zone files of CLAUDE.md §3.2 are not
authorised: if persistence needs a migration, stop with `Outcome: question`.

Worktree: `~/jjodel-w-jjp-s6a`, branch `jjp-s6a`, cut from `jjodie-panel` at `26cc36a8c` plus the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0312 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 80 minutes. No subagents, no background tasks. Commit as soon as the
gates are green. One probe run per tool call. Context discipline: never `cat` a whole large file or log;
`joiner/classes.ts`, `LeftBar.tsx`, `DockManager.tsx` and `TabDataMaker.tsx` only by grep-found ranges (follow how
`transformations` is declared, saved, loaded and listed: `classes.ts:3101`, `:3192`); test, build and probe output
through `tail` or `grep`. If the context passes about 150k, commit what is green, write a handoff and stop. Dev server
only on a free port in 3010..3019, never 3000, 3001 or 3003; stop it at the end. Light theme only. Subject lines without
`(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s6a.md`, with the Layer
Impact Report field filled (core field). Nothing merges anywhere: the chat merges.

## Read first, and only this

The report: Q6, Q7 (row S6, split S6a/S6b), A1. Row R-JJD-5. The S6 paragraph of
`docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`.

## COSA

Slice S6a under R-JJD-5:

1. An optional `scripts` field on `DProject` (and its L-side accessor if `transformations` has one), each entry
   `{ id, name, text, modelId?, generatedText?, updatedAt }`, read with `|| []` everywhere like `transformations`,
   saved and loaded with the project exactly as `transformations` is, with no VersionFixer migration. A project saved
   before this change loads unchanged and gets an empty list; a project with scripts round-trips (save, reload) with
   the entries intact. Tests for both.
2. A small module of pure functions to add, rename, update and remove a script entry (names end in `.jjs`; duplicates
   get the project's `(1)`, `(2)` suffix rule), with tests.
3. A script editor tab (`DockManager.openScript` or the naming the code already uses; `TabDataMaker.tsx` entry; new
   tab component): Monaco on the script text, `Save` (writes the entry), and `Run on <model>` (runs through the same
   path as the S4b preview: it fires `SCRIPT_PREVIEW_REQUEST` for the chosen model so the user sees the ghost and
   applies from the canvas bar). The model chooser lists the project's M1 models.
4. A public function `openScriptAsFile(text, suggestedName, modelId?)` that creates the entry and opens the tab, for
   S2's `Open as file` and S5's `Save as file` to call later (do not wire those buttons here).
5. Listing under SCRIPTS in the tree and the megamodel view is S6b, not here.
6. Probe: create a script entry through `openScriptAsFile`, edit, Save, reload the project, check the entry and the tab
   reopen, `Run on <model>` shows the preview bar. One crop under `~/.jjodel-lanes/P-2026-10-24-0312/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` once. Commit
(`feat(project): scripts as project files with an editor tab`).

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`, with the probe result.

## NON FARE

No edit to `VersionFixer.tsx` or any critical-zone file, to Jjodie components, to `reducer.ts`, to the preview code,
or to the tree and megamodel views. No merge, no push.
