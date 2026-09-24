# Prompt: merge simulation-engine into the trunk (sim panel faces)

Prompt-ID: P-2026-09-24-1605
Chat: C-2026-09-24-1005
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop and say so; never work by absolute path on another worktree.

Single phase, with hard stops. This is a merge, not a feature: no source file is edited by hand.

## COSA

Bring `P-2026-09-24-1005` (simulation panel, one face per active editor) into the trunk with one merge commit, `--no-ff`, in the shape of the previous one, `3092e5aa8` (read its body first and mirror it).

Merge the explicit sha `6cdba58cf`, not the branch name. `simulation-engine` has a lane running on it (`P-2026-09-24-1520`, step 2, in `~/jjodel-sim`) that may add commits at any time; anything after `6cdba58cf` comes in with the next merge. `6cdba58cf` carries: the 1005 prompt `ff2c624a1`, its Phase 1 report `bd7a2e6b0`, code `a8071f907`, docs `7cb1a716b`, and the 1520 prompt file `6cdba58cf` (docs only).

## DOVE

Only the merge commit on `alfonso-frontend-jjtl` in `~/jjodel-release`. Do not touch `~/jjodel-sim` or `~/jjodel`: `~/jjodel-sim` has a lane in flight.

## COME

1. Preconditions, each a hard stop if false: `git status` in `~/jjodel-release` is empty; `P-2026-09-24-1455` is closed (its Status line reads `eseguito`); `git worktree list` shows `simulation-engine` checked out only in `~/jjodel-sim`; `6cdba58cf` is an ancestor of `simulation-engine`.
2. List what the trunk gained since the merge base with `6cdba58cf` and what `6cdba58cf` brings, file by file. Expected: disjoint (trunk: `irDefaults.ts`, `ir.test.ts`, `VersionFixer.tsx`, docs; branch: `EditorV2.tsx`, `sim/*`, docs). If any file is touched on both sides, stop and report before merging.
3. `git merge --no-ff 6cdba58cf` with a message in the shape of `3092e5aa8`: subject `merge: simulation panel faces (P-2026-09-24-1005)`, body naming the shas above and what the trunk gained since the base, `Model:` trailer, `Co-Authored-By` trailer. Any conflict: `git merge --abort`, stop, report.
4. Gates on the merge commit: typecheck (14 errors, the known set), vitest (expected: the trunk count after 1455 plus the 12 tests of 1005; report the exact number and the files red at import, expected the same 9), build, `npm run check:docs`, `npm run check:agents`. The gates need `frontend/node_modules`: use the temporary symlink of P14 if it is absent, and leave the tree as you found it.
5. No visual check: the 1005 behaviour was checked on 3002 and is unchanged by a text-only merge. Say so in the closing report.
6. No log entry for the merge itself (the precedent has none); the merge body is the record. Then stop: no push, no further commits.

Never: `git add .`, `git stash`, `git reset --hard`, merging the branch name instead of the sha, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P14 (worktrees; reintegration of a branch).
- Merge precedent `3092e5aa8`.
- `docs/prompts/claude_2026-09-24_1005_prompt_sim_panel_faces.md` on `simulation-engine`.
