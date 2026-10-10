# Dark theme removal: Phase 1 discovery

Prompt-ID: P-2026-10-10-0910
Chat: C-2026-10-10-0910
Lane: full (deletion across more than three files; RC-26 deletion approved by Alfonso, see Context)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-nodark`, branch `dark-theme-removal`, created from the trunk commit that adds this
file, `frontend/node_modules` symlinked (P14). Before anything else: `pwd` is the worktree, the branch is
`dark-theme-removal`, `git status` is clean, and `git log -1 --format=%H` equals
`git log -1 --format=%H -- docs/prompts/claude_2026-10-10_0910_prompt_dark_theme_removal.md`.
Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0910 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the project chat flips it.

## Context (do not redo the analysis)

Jjodel has no dark theme. **D-UI-15** (`docs/decisions.md`, 2026-10-04) made it final and superseded
R-RAIL-44; the docs were aligned in `18a861da7`. The code still carries the theme, and the Dark radio of
Settings is still selectable. On 2026-10-04 Alfonso decided to remove the code after Málaga; on 2026-10-10
he confirmed («si»). The deletion is therefore pre-approved for this lane (RC-26 satisfied for deletions
inside the perimeter below). Known entry points, measured on 2026-10-04 with grep, not exhaustive:

- `frontend/src/services/ThemeService.ts`; `frontend/src/pages/settings/AppearanceSettings.tsx` (Dark radio,
  moon icon), mounted by `components/GlobalDrawer/SettingsDrawerContent.tsx` and the `/settings` route;
- `frontend/src/styles/tokens/_colors-dark.scss` and every `[data-theme="dark"]` / `html[data-theme="dark"]`
  / `:root[data-theme="dark"]` block in SCSS and CSS; `.editor-v2.theme-dark`;
- `theme === 'dark'` branches in `components/editor-v2/EditorV2.tsx` (MiniMap colours, about :4403-4435) and
  `data-theme` reads in `components/abstract/tabs/DocumentationTab.tsx` (Monaco `vs-dark`),
  `InstanceManagerTab.tsx`, `editor-v2/Toolbar.tsx`, `jjform/palettes.ts`, `pages/TokenPreview.tsx`;
- the `editor-v2-theme` localStorage key and `localStorage.theme`;
- tests that assert dark values (`irInkOutside.test.ts`, `irSelectionRing.test.ts`, `instanceManager10j.test.ts`).

Not the app theme, out of scope unless the discovery proves otherwise: `Btn theme={'dark'}` (a button
style), `components/envgen/types.ts` `'dark'` option (generated environments), the lamp label `'dark'` in
`simBoardDevices.tsx`, the word «darker» in palette code.

## WHAT (Phase 1, read-only)

**A. Inventory.** Every place where the app theme is chosen, stored, read or styled: TS/TSX, SCSS/CSS,
HTML (`index.html` boot scripts), tests, fixtures, harness probes under `frontend/scripts/` (several set
`localStorage.theme`). For each: `file:line`, verbatim quote, and the planned action (delete, collapse to
the light branch, keep with reason). Separate app theme from homonyms. Count the dark SCSS blocks.

**B. Persisted state.** What a returning user with `localStorage.theme = 'dark'` or
`editor-v2-theme = 'dark'` gets after removal: the page must open in light with no flash and no error.
Say whether any project data (Redux state, saved projects, viewpoints, `jsxString`) stores a theme value;
if so, whether a VersionFixer step would be needed (VersionFixer is critical zone: no go-ahead here, park
it as a question).

**C. Tokens.** Which `--color-*` names `_colors-dark.scss` declares that `_colors-light.scss` does not
(they would become undefined); for each, its live uses. The light values must not change.

**D. Exported interfaces.** Any exported symbol (types, functions, props, context keys) that disappears
or changes signature, with its importers. Interfaces breaking outside the perimeter are an RC-26 item:
list them, do not decide.

**E. Phase 2 plan.** Slices with file sets, order, tests first (what a test asserts: no `data-theme="dark"`
can be set by the app; Settings shows no theme choice; a stored `'dark'` opens light; the light computed
colours of the four demo scenes unchanged), the gates, and the visual checklist for the chat (RC-23,
light only): Settings without the Dark radio; the four demo exports in `~/jjodel-demo-exports/`
byte-identical in light against the trunk; MiniMap colours; Documentation tab Monaco in `vs`. Close with
«Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26).

## Report

Path and name, mandatory: `docs/discovery/discovery_2026-10-10_dark_theme_removal.md`. Content per P4: the
hypothesis being falsified (the theme can be removed by deleting the dark sources and collapsing every
branch to light, with no visible change in light and no data migration), the objective, the files read
with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions.
The hard stop is not reached until the file is written.

Write the log entry with the `log-entry` skill into `docs/log-inbox/dark-theme.md`. Commit the report and
the inbox entry together, docs only, with an explicit pathspec, subject
`docs(discovery): dark theme removal`, and the `Model:` trailer (P6).

## HARD STOP

After the docs commit, stop and exit with `Outcome: hard-stop`. Phase 2 comes as a new message in this
same session after the chat has read the report.

## NON FARE

- No edit to any source file, test, style, `docs/decisions.md` or `CLAUDE.md` in Phase 1.
- No assertion of absence without the search that supports it and a positive control in the same
  invocation, with quoted globs (R-RAIL-28, R-RAIL-31).
- No dark screenshots, crops or contrast figures (D-UI-15).
- No `git stash`, no `git add .`, no push. Scratch files inside the worktree (gitignored `_tmp_*`), never `/tmp`.
- Do not touch the `Status` line of this prompt.

## RIFERIMENTI

- D-UI-15 and R-RAIL-44 (superseded) in `docs/decisions.md`; D-UI-10, D-UI-13 for the token layers.
- `frontend/src/styles/CLAUDE.md` §7.2 (token system); `docs/DESIGN-SYSTEM.md` header note.
- `CLAUDE.md` §3 (critical zone), §21 (log entry); `docs/PROTOCOL.md` P4, P8, P13, P16.
