# Textual syntax T4a-1, closure (continues P-2026-11-02-0955 after the context ceiling)

Prompt-ID: P-2026-11-02-1016
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-02 · commit 5467088b7 · verifica visiva non applicabile
Lane: fast (closure of work already written and mostly tested)
Depends: P-2026-11-02-0955 (hard-stop at the ceiling, RC-51; uncommitted work in the tree, handoff in its lane folder)
Worktree: ~/jjodel-w-textt4, branch textual-t4 (the same tree)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · RC-51

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textt4` on `textual-t4` with 0955's changes in place (five modified files in `frontend/src/codegen/textual/`,
the untracked scratch `__tests__/_tmp_accept.test.ts`) plus this prompt, stop with `Outcome: blocked`. Every reply opens
with `[P-2026-11-02-1016 · session <id>]`. No subagents, no background tasks.

## COSA

Read `~/.jjodel-lanes/P-2026-11-02-0955/handoff.md` («Left to do») and `git diff`; nothing else. Apply the pending fix
(group values in the subset's literal order, ties in model order), rerun the acceptance on the 16 Briefs, run the
mutation bench, delete the scratch test `_tmp_accept.test.ts` (never stage it; record the acceptance result in the log
entry instead), run the gates, then the commits. R-TXT-27 is in `docs/decisions.md` on the trunk (this branch predates
it): do not add it here. Scope and decisions are those of 0955 and its handoff; do not extend them.

## Lane discipline

`git add <specific files>` only. Commit `feat(codegen): textual syntax annotations, grammar part (P-2026-11-02-0846)`.
Gates: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`,
`npm run check:codegen-lazy` (both modes). Visual check not applicable. Log entry in `docs/log-inbox/codegen.md` and the
`Status:` flips of 0846 (`eseguito 2026-11-02 · design 0846, implemented by 0955 and 1016`), 0955 and this prompt, in
one docs-only commit. Keep context low. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting
Alfonso», `Outcome: done | hard-stop | question | blocked`.
