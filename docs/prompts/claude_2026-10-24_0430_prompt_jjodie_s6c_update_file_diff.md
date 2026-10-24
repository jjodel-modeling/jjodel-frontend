# Jjodie S6c: Jjodie changes to a saved script arrive as a diff on the file

Prompt-ID: P-2026-10-24-0430
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S6c, code, gates and probe)
Depends: P-2026-10-24-0350, P-2026-10-24-0355
Status: eseguito 2026-10-24 · lane jjodie-ui-s6c · code ae904fd5b · gates green · probe 18/18 · done
Corregge: none
Request: Alfonso, 2026-10-24 00:40 and 01:14, in the project chat (unattended run; S6 approved)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`).

Worktree: `~/jjodel-w-jjp-s6c`, branch `jjp-s6c`, cut from `jjodie-panel` at `3e7dfcfa8` (every slice merged) plus
the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0430 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 80 minutes. No subagents, no
background tasks. Commit as soon as the gates are green. One probe run per tool call. Context discipline: never `cat`
a whole large file or log; read by grep-found ranges; test, build and probe output through `tail` or `grep`. If the
context passes about 150k before the probe, commit what is green, write a handoff and stop. Dev server only on a free
port in 3010..3019 (check with `lsof`; another lane may hold one), never 3000, 3001 or 3003; stop it at the end. Light
theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in
`docs/log-inbox/jjodie-ui-s6c.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

The S6 paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md` («Later Jjodie changes to
that script arrive as a diff on the file»). Log entries `docs/log-inbox/jjodie-ui-s5.md` (line-diff helper in
`scriptEditorModel.ts`, Compare view), `docs/log-inbox/jjodie-ui-s6a.md`, `docs/log-inbox/jjodie-ui-s6b.md` (its two
known gaps). `frontend/src/components/scripts/scriptFiles.ts`.

## COSA

1. Link a card to its file: when a script is opened or saved as a file from a card (S5 `Save as file`, card
   `Open as file`), remember the file id on that card's script (in the conversation state, not in the persisted
   project). A later Jjodie message in the same conversation whose script targets that file (the same first-comment
   name, or the user's follow-up on that card through Fix warnings or Ask Jjodie to review) shows on its card an
   `Update file` action next to the others.
2. `Update file` opens a diff view (reuse the S5 Compare view and line-diff helper) between the file's current text and
   the new script, with `Accept` (writes the new text to the file through the S6a functions; an open tab of that file
   refreshes) and `Reject` (closes, nothing changes). A file edited by the user since the link shows their text on
   the left, never the old generated text.
3. Close the two gaps of S6b: a rename from the megamodel shows the stored `.jjs` name at once; an open script tab
   updates its title after a rename from the tree or the megamodel.
4. Tests for the linking and for the diff input selection; a probe under `frontend/scripts/probe/` that saves a card
   as a file, edits the file, injects a second Jjodie message with a changed script of the same name, checks
   `Update file`, the diff rows (added, removed counts), Accept updating the file and its open tab, Reject leaving it,
   and the two rename fixes. One crop under `~/.jjodel-lanes/P-2026-10-24-0430/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjodie): update a script file from a later Jjodie answer`).

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`, with the probe measures.

## NON FARE

No edit to `reducer.ts`, `EditorV2.tsx`, the preview code, the AI provider layer or system prompts, `VersionFixer.tsx`
or any critical-zone file. No new persisted field. No merge, no push.
