# Lane D: `generateUniqueModelName` delegates to `uniqueModelName`

Date: 2026-09-14 16:32
Type: refactor (scoped, single commit)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: high

## Parallel-lane discipline (applies to this whole prompt)

This lane runs concurrently with other Claude Code sessions in the same working tree (simulation engine; lane B under `frontend/src/ai/`; lane C under `frontend/src/jjscript/executor/`; possibly a docs-only lane on `CLAUDE.md`). Their uncommitted files are expected in `git status`. Never touch, stash, checkout or revert them. Never switch branch.

- Before any write, assert `git rev-parse --abbrev-ref HEAD` prints `validation-skeleton`. Otherwise stop and report.
- Read `CLAUDE.md` and `docs/claude-code-log.md` first.
- Stage only the files this prompt names, with `git add <path>`. Never `git add .`, `-A` or `-u`.
- `docs/claude-code-log.md` is shared. Write your entry only at the very end, immediately before your docs commit. Before staging it, `git diff docs/claude-code-log.md` must show only your entry; if another lane's uncommitted entry is present, do not commit the log: report and leave it.
- Gates: `tsc --noEmit` total (baseline 33 at `26d04febc`, other lanes may move it), 0 errors in the touched file, positive control with signal; existing tests of `nameLookup.ts`; build.
- Cherry-pick to `alfonso-frontend-jjtl` is not part of this prompt.

## COSA

Since lane A (A3 `b434a3950`, A4 `dc5f8d3aa`) the naming rule for duplicate model names (`A`, `A (1)`, `A (2)`) lives in `uniqueModelName` in `frontend/src/model/nameLookup.ts`, and `DModel.new` applies it. `generateUniqueModelName` in `ProjectEditor.tsx` (around line 1359) still carries its own copy of the same rule. Make `generateUniqueModelName` delegate to `uniqueModelName` so the rule has one source. The exported name `generateUniqueModelName` and its signature stay as they are.

## DOVE

- `ProjectEditor.tsx` (locate with `grep -rn generateUniqueModelName frontend/src`): the function and its call sites in the same file
- `frontend/src/model/nameLookup.ts`: read only, `uniqueModelName` and its signature

Do not modify `nameLookup.ts`, `LModelElement.tsx`, `joiner/classes.ts`, anything under `frontend/src/ai/` or `frontend/src/jjscript/`.

## COME

Brief read-only discovery first, with a report (mandatory even if short): compare the two implementations on three points: the pool of taken names (`uniqueModelName` uses all `DModel`, as `set_name`; what does `generateUniqueModelName` use: all models, the current project's models, a list passed by the caller?), the suffix format (`(n)` starting from 1, gaps reused or not), and the treatment of a base name that already ends with `(n)`. Save `docs/discovery/discovery_2026-09-14_unique_model_name_delegation.md`.

Then:

- If `uniqueModelName` accepts the pool as a parameter (or the pools are the same by construction), delegate: `generateUniqueModelName` computes nothing itself and returns `uniqueModelName(...)`.
- If the pools differ and `uniqueModelName` derives its pool internally, do not change semantics on either side and do not modify `nameLookup.ts` (an optional pool parameter there is the right fix, but it belongs to a follow-up, not to this lane): stop after the report and ask in chat.
- Minimal diff. No other change in `ProjectEditor.tsx`. Do not rename anything.

Tests: `ProjectEditor.tsx` is not importable in the bench (`window`). Do not add source-text tests. The behavior is covered by the existing `nameLookup.ts` tests; state this in the log entry.

Commits: `refactor: generateUniqueModelName delegates to uniqueModelName` (ProjectEditor.tsx + discovery report), then `docs: log entry for lane D`.

Report in chat: what the pool comparison found, the diff size, gates. Visual verification by Alfonso: create two metamodels from the UI with the same name, expect `A` and `A (1)`; rename `A (1)` to `A`, expect refusal (unchanged behavior of `set_name`).

## RIFERIMENTI

- `frontend/src/model/nameLookup.ts` (A4, `dc5f8d3aa`)
- `docs/claude-code-log.md`: entries A3 `b434a3950` and A3b `6a211f5c3` (pool = all DModel, `set_name` keeps refusing)
- Decision of 2026-09-11: auto-suffix on creation, refusal on explicit rename
- `CLAUDE.md`: minimal diff, no renaming, no opportunistic refactoring
