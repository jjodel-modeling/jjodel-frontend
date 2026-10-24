# Jjodie: plain console entries for JjEL/JjScript, and no Source toggle on replies

Prompt-ID: P-2026-10-24-1610
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: fast (visual simplification, two components and one stylesheet)
Depends: none
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 ~15:55, in the project chat («semplifichiamo la visualizzazione nei due screenshot, nella seconda togli </> Source»), with a screenshot of a JjEL entry (`› self.name` in a bordered field, a `JJEL` pill, the value `"model_1 (1)"` in a bordered chip, the time `15:51` under it, the whole inside a bordered card)
Model: claude-sonnet-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by the measures in the log entry. No core change, no critical-zone file.

Worktree: `~/jjodel-w-jjp-cel`, branch `jjp-cel`, cut from `jjodie-panel` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-1610 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. No subagents, no background tasks. Commit as soon as the gates are green. Outputs through `tail` or `grep`. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-cel.md`. Another lane (jjp-m2) edits `ChatMessages.tsx` around lines 60..64: do not touch that region. Nothing merges anywhere: the chat merges.

## COSA

The console entry (`.jodie-code-entry` in `frontend/src/components/Jodie/ChatMessages.tsx`, around lines 285..345, styles in `frontend/src/components/Jodie/JodieWindow.css`) reads as three nested boxes. Make it a plain console line, in the sober style of the live JjEL result (R-JJD-3, S3):

1. The entry has no border, no background and no card padding; consecutive entries are separated by spacing only (8 px), with a 1 px slate-100 hairline between an entry and the next message.
2. Input row: the `›` prompt stays (cyan); the expression is plain mono 13 px slate-900 text, with no border, background or padding box.
3. The flavor (`JJEL`, `JJSCRIPT`) becomes plain text 11 px slate-400, not uppercase-tracked and without a pill background (`JjEL`, `JjScript`), right-aligned on the input row.
4. Output row: aligned with the start of the expression text (not with the `›`), mono 13 px, no border or chip; a value in slate-900; an error keeps only its red text (no tinted box); a timed-out result stays slate-400. The inspector toggle and the warnings stay where they are, unboxed.
5. The time line under the entry goes away; the time moves to the entry's `title` attribute (tooltip). Other messages keep their meta line.
6. Remove the `</> Source` toggle on assistant replies: in `frontend/src/components/Jodie/MarkdownMessage.tsx` the default of `showSourceToggle` becomes `false`, and `ChatMessages.tsx:214` stops passing it. Leave the toggle code in place (CLAUDE.md rule 9).

Check the class names you add with a global search first (CLAUDE.md, name verification). No CSS variable in component files (rule 28): use the existing tokens.

Measures on the dev server, written in the log: for one JjEL entry and one JjScript entry, computed `border`, `background-color`, `padding` of the entry, of the input and of the output; font size and color of input, flavor and output; the x offset of the output text against the input text (must be 0 ± 1 px); no `.md-toggle-btn` in the DOM after an assistant reply. Two crops (light theme) into `~/.jjodel-lanes/P-2026-10-24-1610/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build.

## DOVE

`frontend/src/components/Jodie/ChatMessages.tsx` (the console entry block and line 214 only), `frontend/src/components/Jodie/JodieWindow.css` (the `.jodie-code-entry` rules), `frontend/src/components/Jodie/MarkdownMessage.tsx` (the default only), `docs/log-inbox/jjodie-ui-cel.md`, Status of this prompt.

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`, with the measures.

## NON FARE

No other Jodie component, no `JjelLiveResult.tsx`, no planner or preview file, no `reducer.ts`. No merge, no push.
