# Textual syntax T2b, second session: finish the textual entry and the read-only Text tab (continues P-2026-11-02-0040)

Prompt-ID: P-2026-11-02-0057
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-02
Lane: full, Phase 2 (closure of a slice already designed and mostly written)
Depends: P-2026-11-02-0040 (hard-stop at the context ceiling, RC-51; uncommitted work in the tree)
Worktree: ~/jjodel-w-textt2, branch textual-t2 (the same tree; its uncommitted changes are 0040's work)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · RC-51: a session stopped at the ceiling continues as a new lane

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textt2` on `textual-t2` with 0040's changes in place (`Toolbar.tsx`, `dataManagerOption.ts` modified;
`frontend/src/codegen/textual/ui/`, `textualTab.test.ts`, `textualPicker.test.ts` new) plus this prompt, stop with
`Outcome: blocked`. Every reply opens with `[P-2026-11-02-0057 · session <id>]`. No subagents, no background tasks.

## COSA

Read `~/.jjodel-lanes/P-2026-11-02-0040/handoff.md` (start from «Remaining checks») and `git diff`; do not re-read the
codebase. Do what the handoff lists as remaining: finish the `Toolbar.tsx` part, then the gates, then the visual check,
then the commits. The scope and the decisions are those of 0040's prompt
(`docs/prompts/claude_2026-11-02_0040_prompt_textual_t2b_entry_tab.md`) and of its handoff; do not extend them. The
app-bar branch for the `txt_` tab id (`syncTabs` in `Navbar.tsx`) is not in this lane: it goes to T2c, which already
touches `Navbar.tsx`.

## Lane discipline

`git add <specific files>` only. Commit `feat(ui): textual entry and read-only Text tab (P-2026-11-02-0040)`. Gates:
`npx tsc --noEmit` (baseline), `npx vitest run src/codegen src/components/editor-v2`, `npm run build`,
`npm run check:docs`, `npm run check:codegen-lazy` (its «off» mode is red on every tree because of `.env.production`,
an open ticket: report it, do not fix it). Visual check on a probe port (30xx, not 3000/3001/3003) with
`VITE_CODEGEN=true` and localStorage `jjodel.experimental.codegen='true'`: crops of the picker with the textual entry,
of the tab with a model's text, and of the EBNF view, saved under `~/.jjodel-lanes/P-2026-11-02-0057/`. Log entry in
`docs/log-inbox/codegen.md` and the `Status:` flips of 0040 (`eseguito 2026-11-02 · hard-stop, closed by
P-2026-11-02-0057`) and of this prompt, in one docs-only commit. Keep context low: print only what a step needs. No
push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop |
question | blocked`.
