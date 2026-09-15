# Lane F: worktree and cherry-pick rule in `CLAUDE.md`

Date: 2026-09-14 16:33
Type: docs (single file, single commit)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: medium

## Parallel-lane discipline

Other Claude Code sessions are working in the same tree (lanes B, C, D and the simulation engine). Their uncommitted files are expected; never touch them. Assert `git rev-parse --abbrev-ref HEAD` prints `validation-skeleton` before writing. Stage only `CLAUDE.md` and the log. `docs/claude-code-log.md`: write your entry only at the end, immediately before the docs commit, and stage it only if `git diff docs/claude-code-log.md` shows your entry alone.

## COSA

Record in `CLAUDE.md` the rule learned on 2026-09-14, when `git worktree add` refused because `alfonso-frontend-jjtl` was already checked out in `/Users/alfonso/jjodel-release` and the cherry-pick loop started in the wrong tree (aborted, no damage).

## DOVE

`CLAUDE.md`, in the section that already covers cherry-picks between `validation-skeleton` and `alfonso-frontend-jjtl` (or the git/branch section, if there is no cherry-pick section; read the file to find the right place). Do not restructure the file. Do not touch other rules.

## COME

Add one subsection, in English, in the style of the surrounding text (imperative, no filler, no em dashes). Content to convey, rephrased to fit the file:

- Before any cherry-pick, run `git worktree list`.
- If the target branch is checked out in a clean tree, run the cherry-pick in that tree. If that tree is not the current lane's, ask Alfonso for authorization first.
- If the target branch is checked out in a dirty tree, hard stop: report and wait.
- Use a temporary worktree only when the target branch is not checked out anywhere; remove it (`git worktree remove`, `git worktree prune`) when done.
- Never move a ref (`update-ref`, `branch -f`) under a worktree that has it checked out.
- Never chain a `cd` that can fail in front of a destructive loop; assert the branch (`git rev-parse --abbrev-ref HEAD`) before the first pick.
- Trees without `node_modules` (such as `jjodel-release`) can run the gates through a temporary symlink to `~/jjodel/frontend/node_modules`, removed afterwards; `git status` must be empty before and after.
- Positive controls in verify entries must be chosen at the time of the entry: a file that differed between the two branches earlier may no longer differ (on 2026-09-14 `model/validation/eval.ts` had stopped differing).

Commits: `docs: worktree and cherry-pick rule in CLAUDE.md`, then `docs: log entry for lane F`.

## RIFERIMENTI

- `docs/claude-code-log.md`: entries of 2026-09-14 (lane A verify entry, cherry-pick note)
- `docs/sessioni/sessione_2026-09-14.md`, decision of 2026-09-14 on cherry-pick and worktrees
