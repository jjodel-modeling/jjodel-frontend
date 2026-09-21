# Cherry-pick C, G, B2, D onto alfonso-frontend-jjtl (3.0 payload)

Date: 2026-09-15 11:30
Type: cherry-pick (release payload), no code changes
Target branch: `alfonso-frontend-jjtl`
Effort: high

## Precondition (do not start without it)

Alfonso must have visually verified C, G, B2 and D on localhost first (scenarios in each lane's report; B2 especially: V1 no focus → error, V2 ask with B active then switch to A then Run → writes in B, V3 `Person` only in A with B active → refusal with qualify, escape `A::Person` → writes in A). If that GO has not been given, stop and ask. This prompt only moves already-verified commits.

## Context

The 3.0 payload is lane A (already on `alfonso-frontend-jjtl`) plus these four, decided 2026-09-15. Source commits on `validation-skeleton`:
- C `3e3ab691a` (type resolution kinds)
- G `2a1619653` (qualified type parses in create/returnType)
- B2 `de77f22af` (Jjodie writes into the scope shown)
- D `284576f94` (`generateUniqueModelName` delegates)

Only these code commits are picked, not their report/log commits (those are docs on `validation-skeleton` and stay there). Order matters: C → G → B2 → D. C introduces `resolveTypeTarget` (used by G's tests and reachable by B2's escape hatch); C and B2 both touch `create.ts` on different lines, so C first; G depends semantically on C; D is independent.

## Worktree rule (§6.5)

`git worktree list` first. `alfonso-frontend-jjtl` is checked out in `~/jjodel-release` (not the main tree `~/jjodel`, which is on `validation-skeleton` with another lane's dirty files). Operate in `~/jjodel-release`. Do not touch `~/jjodel`.

## Steps

1. In `~/jjodel-release`: `git rev-parse --abbrev-ref HEAD` must be `alfonso-frontend-jjtl`, `git status --porcelain` empty, HEAD `e82831264` (lane A tip). Otherwise HARD STOP and report.
2. `git cherry-pick -x 3e3ab691a 2a1619653 de77f22af 284576f94`
3. If any pick conflicts, HARD STOP: abort the whole sequence (`git cherry-pick --abort`), leave the tree as it was, and report which commit conflicted and the conflicting files. Do not resolve.
4. Gates in `~/jjodel-release/frontend` (symlink `node_modules` first: `ln -s ~/jjodel/frontend/node_modules ~/jjodel-release/frontend/node_modules`, remove after): `npm run typecheck` (report total and 0 in touched files, with a positive control that has signal), `npm run build`, and `npm run test -- src/jjscript` (or the project's vitest invocation) for the affected suites. Report the numbers.
5. Confirm the four new destination shas and that each `git show <sha> --stat` matches its source on `validation-skeleton` (same files, same insertion/deletion counts).
6. Remove the `node_modules` symlink. `git status --porcelain` in the worktree must be empty before and after.

## Log

Parallel lanes may be active: `docs/claude-code-log.md` is shared, entry at the end only, staged only if `git diff` shows your entry alone. But note: the log lives on which branch? The picks are on `alfonso-frontend-jjtl`; the log entry for this cherry-pick goes where the project keeps cherry-pick notes (follow the lane A precedent in the log). Commit the log entry separately (docs), pathspec explicit.

## Report back

The four destination shas (source → dest table), the gates, and confirmation the worktree is clean. Do NOT push and do NOT run the release lane; those are separate steps Alfonso triggers. After this, the release prompt's frontend/ commit counts must be re-measured and updated before the release lane runs.

## RIFERIMENTI

- Session file (project) and `docs/sessioni/`: lane C/G/B2/D closures and the 3.0 payload decision (2026-09-15)
- `CLAUDE.md` §6.5 (worktree/cherry-pick), the lane A cherry-pick note in `docs/claude-code-log.md`
- Release lane: `docs/prompts/claude_2026-09-14_1250_prompt_release_3_0_version_tag_staging.md` (counts to update after this)
