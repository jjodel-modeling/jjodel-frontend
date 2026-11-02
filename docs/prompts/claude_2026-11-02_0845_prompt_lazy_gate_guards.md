# Codegen: guard the two static codegen imports so `check:codegen-lazy --off` is green (R-TXT-25 (10))

Prompt-ID: P-2026-11-02-0845
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-02 · lane lazy-gate-guards · 3f84dfbd1
Lane: fast
Depends: P-2026-11-02-0653 (gate off mode made independent of `.env.production`; red on two imports)
Worktree: ~/jjodel-w-lazyguard, branch lazy-gate-guards (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · R-TXT-25 (10); 0653's single Recommended, adopted by the chat (RC-21)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-lazyguard` on
`lazy-gate-guards`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0845 · session <id>]`.
No subagents, no background tasks. Keep context low.

## COSA

Add the `CODEGEN_BUILD` guard (the constant `Toolbar.tsx` and `LeftBar.tsx` already use for T2) to the two imports
0653 found, `frontend/src/pages/ProjectEditor.tsx` (about `:70`) and `frontend/src/pages/components/LeftBar.tsx`
(about `:385`), so that with the flag off no module of `src/codegen/` is in the static closure of the entry. Behaviour
with the flag on is unchanged. If the fix needs more than these two files, stop with `Outcome: question`.

## Lane discipline

`git add <specific files>` only. Commit `fix(codegen): guard codegen imports for the lazy gate (P-2026-11-02-0845)`.
Gates: `npx tsc --noEmit`, vitest on `src/pages` and `src/codegen`, `npm run build`, `npm run check:docs`,
`npm run check:codegen-lazy` in both modes, both green. Visual check: with the flag on, one crop of the left bar with
the GENERATORS section and the «New model from text» action still present, under the lane folder. Log entry in
`docs/log-inbox/codegen.md` and the `Status:` flip (edit the line) in one docs-only commit. No push, no merge. End with
«Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
