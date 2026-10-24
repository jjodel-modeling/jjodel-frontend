# Jjodie S5: edit the generated script

Prompt-ID: P-2026-10-24-0350
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S5, code, gates and probe)
Depends: P-2026-10-24-0310, P-2026-10-24-0312, P-2026-10-24-0241
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`).

Worktree: `~/jjodel-w-jjp-s5`, branch `jjp-s5`, cut from `jjodie-panel` at `b01d1eac1` (every slice but S5 and S6b
merged) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0350 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 85 minutes. No subagents, no
background tasks. Commit as soon as the gates are green. One probe run per tool call. Context discipline: never `cat`
a whole large file or log; `Jodie.tsx`, `ChatInput.tsx` and `ScriptCard.tsx` only by grep-found ranges; test, build and
probe output through `tail` or `grep`. If the context passes about 150k before the probe, commit what is green, write
a handoff and stop with `Outcome: hard-stop`. Dev server only on a free port in 3010..3019 (check with `lsof`), never
3000, 3001 or 3003; run it as the existing probes do and stop it at the end. Light theme only. Subject lines without
`(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s5.md`. Nothing
merges anywhere: the chat merges.

## Read first, and only this

The S5 paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md` (the spec). Q7 row S5 of
the report. Log entries `docs/log-inbox/jjodie-ui-s2.md` (card, Fix warnings send path, disabled actions),
`docs/log-inbox/jjodie-ui-s6a.md` (`openScriptAsFile` in `components/scripts/scriptFiles.ts`),
`docs/log-inbox/jjodie-ui-s4b.md` (preview store, `SCRIPT_PREVIEW_REQUEST`).

## COSA

Slice S5:

1. `Edit script` on the card switches the panel from the conversation to an editor of that script (new
   `ScriptEditorView.tsx` and stylesheet; grep names first), with a back button `Chat` that returns to the
   conversation at the same scroll position. The conversation state is kept while the editor is open.
2. The editor (Monaco, as the S6a tab uses) shows the script. Edited lines get a green margin bar (compare with the
   generated text, line by line, no new dependency; a small line-diff helper with tests). Actions: Undo (the editor's
   own), `Compare with generated` (a read-only diff view of generated vs edited), `Revert` (back to the generated
   text), `Ask Jjodie to review` (sends a follow-up message with the edited script through the same path Fix warnings
   uses; no provider-layer or system-prompt change), `Save as file` (calls `openScriptAsFile` with the edited text).
3. The ghost preview follows the edits: a debounced (about 400 ms) `SCRIPT_PREVIEW_REQUEST` with the edited text. A
   status line under the editor: `Valid · preview follows your edits`, or the first error with its line from the
   planner. Apply stays on the canvas bar; after an Apply the card's status becomes applied.
4. On the card, enable `Edit script` (S5) and `Open as file` (calls `openScriptAsFile` with the generated text); remove
   the `Coming in this release` tooltip from both.
5. Probe under `frontend/scripts/probe/`: inject a jjscript message (as the S2 probe does), click Edit script, edit one
   line, check the green bar on that line only, the status line, the preview bar N updated after the debounce, Compare
   showing the change, Revert restoring the text and clearing the bar, Save as file opening a `.jjs` tab with the
   edited text, Chat returning to the conversation, Open as file on the card opening a tab, and no console errors. Two
   crops under `~/.jjodel-lanes/P-2026-10-24-0350/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjodie): edit the generated script with a live preview`).

## HARD STOP

`Outcome: hard-stop` after the closing docs commit (log entry and Status), with the crop paths and the measures table.

## NON FARE

No edit to `reducer.ts`, `EditorV2.tsx`, the preview bar, the tree or megamodel views (S6b), the AI provider layer or
system prompts, or any critical-zone file. No merge, no push.
