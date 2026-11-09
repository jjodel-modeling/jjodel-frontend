# Prompt: merge notices-discovery into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-09-0930
Chat: C-2026-11-08-2220
Front: maintenance
Request: https://claude.ai/code/session_01DQt9R57EjNuookGRd8rukw (Alfonso, 2026-11-09 09:27: «Go» for the merge of notices-discovery)
Lane: full (merge; zero conflicts measured with `git merge-tree`)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`.
Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release`
on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-0930 · session <id>]`
and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress
(`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `0f4909dd0`), stop and say what
you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk,
and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `notices-discovery` into the trunk with one merge commit, `--no-ff`, of the explicit sha `42debddb3`, in the
shape of `42a62568a` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `6fea9e8e2`.
The branch side, 13 commits, lists them in the body with `git log --oneline 6fea9e8e2..42debddb3`. It carries:
Phase 1 discovery of the notification card (P-2026-11-08-2230), decisions R-NT-1..5, the shared notices store,
the tips card beside the Jjodie button, the announcement banner, the "Show tips" switch, the Help menu tips browser
(P-2026-11-08-2340), the probe fix and the closure (P-2026-11-09-0036). Visual check passed 2026-11-09 (chat crops,
GO Alfonso 09:27).

`git merge-tree --write-tree --name-only` measured no conflict at 09:28. If a conflict appears anyway, stop with
`Outcome: question`, the conflicting paths and a recommendation; do not resolve product code on your own.

## Gates (after the merge commit, on the trunk)

Typecheck (count), build, vitest (record failed files; the three known flaky ones under load are
`languageService.test.ts`, `irCollapsedRender.test.ts`, `irSelectionRing.test.ts`: rerun alone any that fail and say
so), `npm run check:docs` (decisions R-NT must parse), `check:scripts`. A real regression stops the lane with
`Outcome: question` and the evidence; never `git reset` the merge without Alfonso.

## Closure

One docs commit with pathspec: Status flip of this prompt (`eseguito 2026-11-09 · lane merge · <merge sha>`) and its
log entry in `docs/log-inbox/notices.md` (P9). Then `git worktree list` and say whether `~/jjodel-w-notices` can be
removed (do not remove it). No push.

## NON FARE

No push, no rebase, no squash, no `git add .`, no stash, no edits to product code.

## RIFERIMENTI

`docs/PROTOCOL.md` P9, P13, P16; RC-13, RC-14, RC-17; `42a62568a` (shape of the body).
