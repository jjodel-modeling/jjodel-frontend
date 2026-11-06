# log-inbox — lane «jjodie-ui-s5»

Entries written by the Jjodie S5 lane (front jjodie-ui, branch `jjp-s5`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: jjodie S5, edit the generated script with a live preview
**Prompt**: P-2026-10-24-0350, slice S5 under R-JJD-2: Edit script on the card opens an editor of the script in the panel (back button Chat), green bar on edited lines, Undo, Compare with generated, Revert, Ask Jjodie to review, Save as file, a debounced preview and a planner status line; Edit script and Open as file enabled on the card; probe and two crops.
**Files touched**: frontend/src/components/Jodie/ScriptEditorView.tsx (new), ScriptEditorView.scss (new), scriptEditorModel.ts (new), __tests__/scriptEditorModel.test.ts (new), ScriptCard.tsx, JodieWindow.tsx, frontend/scripts/probe/jjodie-s5-script-editor.ts (new) (065a03a8a); docs/log-inbox/jjodie-ui-s5.md, docs/prompts/claude_2026-10-24_0350_prompt_jjodie_s5_script_editor.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Out of scope: JodieWindow.tsx (it renders ChatMessages/ChatInput; Jodie.tsx untouched) and scriptEditorModel.ts with its test (pure, for the bench). 7 files, rule 19 adopted unattended. Probe on 3015: 21/21 twice, after three fixes it found (DiffEditor dispose error, Revert merged into the typing undo group, bar under the text). Not exercised: Ask Jjodie to review (calls the LLM). Bench 4 mutants, 3 killed, 1 equivalent. Gates: typecheck 0; vitest 11883 + 9 known; build ok.
**Prompt document name**: 2026-10-24 03:50

**Ticket** (unattended decisions, `ratified as recommended, unattended`, RC-21/RC-25, for the digest): (1) the view switch is in JodieWindow.tsx, not Jodie.tsx as the Q7 row said: the conversation (ChatMessages + ChatInput) is wrapped, hidden with `display: none` and kept mounted, its scroll read by a store listener in the click handler and restored on Chat; (2) the card opens the editor through a module store in scriptEditorModel.ts, not a prop threaded through ChatMessages; (3) the edited text is kept per card for the session: reopening shows it, and the card counts it as its own for the preview chips and the applied status (Apply of an edited preview turns the card applied); (4) Ask Jjodie to review sends `reviewRequest(edited)` through the card's `onFollowUp` (the Fix warnings path) and returns to the chat; (5) Compare is an inline diff (panel width), with the editor kept mounted under it so its undo history survives; (6) Revert is its own undo step; (7) the status line keeps the last plan while typing, reads Valid with warnings and no error, `Empty script · nothing to preview` when empty; (8) the edited-line bar is pinned at 23px because editors/skeleton.scss forces every Monaco margin to 30px with `!important`, so Monaco's own decorations offset (39px) lands under the text. Measures: bar rgb(34, 197, 94), 3x20 px, on line 5 only, topmost at its centre; one preview request 362 ms after the last key, none within 200 ms; bar `+4 objects` and 4 ghosts (N=3 +1); status `Valid · preview follows your edits` rgb(22, 163, 74); chat scrollTop 440 before and after; tabs `S5 probe script.jjs` (edited) and `S5 probe script (1).jjs` (generated); page errors 0. Crops: `~/.jjodel-lanes/P-2026-10-24-0350/s5-editor-edited.png`, `s5-compare.png`.

## 2026-10-24 — ticket: editors/skeleton.scss forces every Monaco margin app-wide
**Ticket**: `frontend/src/components/editors/skeleton.scss:90-104` sets `.margin { width: 30px !important }`, `.line-numbers { width: 20px !important }` and `.monaco-scrollable-element { left: 30px !important }` unscoped, so every Monaco instance in the app ignores its own layout: glyph margin, folding and line decorations are placed by Monaco at offsets (39px for the S5 editor) that now sit under the text. S5 works around it for its own class; any other decoration in the margin is hit the same way.
**Priority**: low
**Found in**: P-2026-10-24-0350
