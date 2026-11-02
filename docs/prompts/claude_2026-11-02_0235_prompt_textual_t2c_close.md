# Textual syntax T2c, second session: finish «New model from text» (continues P-2026-11-02-0045)

Prompt-ID: P-2026-11-02-0235
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full, Phase 2 (closure of a slice already designed and partly written)
Depends: P-2026-11-02-0045 (hard-stop at the context ceiling, RC-51; uncommitted work in the tree)
Worktree: ~/jjodel-w-textt2, branch textual-t2 (the same tree; its uncommitted changes are 0045's work)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · RC-51: a session stopped at the ceiling continues as a new lane

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textt2` on `textual-t2` with 0045's changes in place (`Navbar.tsx` modified; `modelLines.ts` and
`modelLines.test.ts` new) plus this prompt, stop with `Outcome: blocked`. Every reply opens with
`[P-2026-11-02-0235 · session <id>]`. No subagents, no background tasks.

## COSA

Read `~/.jjodel-lanes/P-2026-11-02-0045/handoff.md` from «Remaining checks» and `git diff`; do not re-read the codebase.
Do the remaining steps in the handoff's order (opener: `openNewModelTab`, `createModelFromText`, `appBarTitle`;
`NewTextualTab` in `TextualTab.tsx`; the LeftBar action), then the gates, the probe and the commits. Scope and
decisions are those of 0045's prompt (`docs/prompts/claude_2026-11-02_0045_prompt_textual_t2c_new_model.md`) and its
handoff; do not extend them. **Check the open risk first in the probe:** one undo after «Create model» must remove the
whole model. If opening the canvas after `endUndoGroup()` leaves a second undo step, open it inside the group instead
and report the deviation; that is the only deviation allowed.

## Lane discipline

`git add <specific files>` only. Commit `feat(ui): New model from text (P-2026-11-02-0045)`. Gates: `npx tsc --noEmit`
(baseline), `npx vitest run src/codegen src/components/editor-v2` plus the tests of every touched folder,
`npm run build`, `npm run check:docs`, `npm run check:codegen-lazy` (its «off» mode is red on every tree because of
`.env.production`, an open ticket: report it). Visual check on a probe port (30xx, not 3000/3001/3003) with
`VITE_CODEGEN=true` and localStorage `jjodel.experimental.codegen='true'`, «What's new» popup suppressed: crops of the
LeftBar action, a broken text with its markers, the diagram of a model created from text, and the app bar with the
Text tab; then undo once and report what the canvas shows. Crops under `~/.jjodel-lanes/P-2026-11-02-0235/`. Log entry
in `docs/log-inbox/codegen.md` and the `Status:` flips of 0045 (`eseguito 2026-11-02 · hard-stop, closed by
P-2026-11-02-0235`), of 2355 (`eseguito 2026-11-02 · in slices: 0024, 0040/0057, 0045/0235`) and of this prompt, in one
docs-only commit. Keep context low: print only what a step needs. No push, no merge. End with «Decisions taken
(unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
