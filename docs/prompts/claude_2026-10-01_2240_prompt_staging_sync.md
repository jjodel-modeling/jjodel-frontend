# Prompt: Phase 1 and 2 in cascade, reintegrate origin/staging (Juri's #157, #158, #147) on a branch off the trunk

Prompt-ID: P-2026-10-01-2240
Chat: C-2026-10-01-2220
Lane: Phase 1 then Phase 2 in cascade, a merge with semantic conflicts resolved on the branch (RC-14), outside the critical zone. Tier: heavy. Time limit: 120 min.
Status: da eseguire
Worktree: `~/jjodel-w-staging`, branch `staging-sync`, created from the trunk `alfonso-frontend-jjtl` at `ac3890b7e`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-staging`, branch `staging-sync`, `git log -1` is the docs commit that added this prompt, `git rev-parse origin/staging` is `98ebb132e...`; if any differs, stop with `Outcome: blocked`.

## COSA

`origin/staging` carries 39 commits by Juri Di Rocco that the trunk does not have (head `98ebb132e`, 2026-10-01 18:43): #157 Configurator and role environments (PR #161, #162, the R2..R6 follow-ups of @tmaog's tests), #158 Data Manager UX (PR #163: drill-in Back, collapsible and resizable side panes, reference sections, key fields of referenced elements, the shared `InstanceDetail`), #147 custom provider model (PR #164). Release 3.1.0 needs them on the trunk before the merge freeze of 2026-10-07. Alfonso's go, 2026-10-01 about 22:35, to «lancio la lane di merge di staging stanotte?» (verbatim): «si procedi».

Measured by the chat at 22:35 with `git merge-tree --write-tree --name-only alfonso-frontend-jjtl origin/staging`: two textual conflicts, `docs/claude-code-log.md` and `frontend/src/pages/components/LeftBar.tsx`. The real risk is semantic: `InstanceManagerTab.tsx` (about 700 lines changed on staging), `instanceTable.ts`, `jjform/nav.ts`, `events/registry.ts`, `Navbar.tsx`, `Dashboard.tsx` against the trunk's own Data Manager, form and simulation work since the merge base (R-DMV, R-SKIN, R-SIM-94 data on the model tab, the scenes). `git merge-tree` does not see a duplicate that an auto-merge produces without a marker; the typecheck does.

The goal is a branch that is the trunk plus staging, with both sides' intent kept, gates at the known baselines, and the demo unchanged in the default viewpoint.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-10-01_staging_sync.md`, opening with `## 0. Answer in brief` (at most 40 lines). Contents: the merge base; the files changed on both sides since the base (`comm -12` of the two `git diff --name-only` lists), each with its risk; the history of `LeftBar.tsx` on each side (`git log -p <base>..<side> -- <file>`) and the resolution you will apply, hunk by hunk, keeping both intents; whether staging changes a governance file (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `.claude/`), an IR property, a persisted field or a `VersionFixer` step; questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, or staging changes a governance file, a persisted format or the critical zone (`useJjomSync.ts`, `portDistribution.ts` and the rest of `CLAUDE.md` §3.2): then stop with `Outcome: question`.

Phase 2, in this worktree only:
1. `git merge --no-ff origin/staging`, the message from a file you write under `frontend/scripts/smoke/_tmp_staging_merge_msg.txt` (gitignored, removed after; `git merge -F -` does not work). Subject `merge: origin/staging into staging-sync (P-2026-10-01-2240)`, a body listing the staging side by PR, the conflicts and how each was resolved, and the trailers of P6.
2. `docs/claude-code-log.md`: the union rule (both sides' entries verbatim, ordered by date, nothing edited), then `check:addonly`.
3. `LeftBar.tsx`: the resolution of the report. Every other file: as the auto-merge left it, unless the typecheck or the tests show a semantic conflict; then a separate `fix:` commit after the merge, the smallest change that keeps both intents, named in the report.
4. Docs: the report's Phase 2 addendum, a log entry in `docs/log-inbox/merge-gate.md`, this prompt's Status. Anything else: stop and ask.

## COME

1. Read `CLAUDE.md` (§3, §5, §6, §17), `docs/PROTOCOL.md` P6, P9, P13, P14, P16, RC-13, RC-14, RC-17, RC-22, RC-26, RC-34.
2. Phase 1 report, committed.
3. Merge and resolve as in DOVE.
4. Gates, each in the foreground: typecheck (the known 14; any new error is the merge's and is fixed on the branch), full vitest (the known 9 red at import; staging's new tests `instanceTable.test.ts`, `nav.test.ts`, `environmentConfig.test.ts` green), build exit 0, `check:docs`, `check:addonly --range ac3890b7e..HEAD`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme only. (a) The four demo scenes in the default viewpoint, 0 px from `ac3890b7e`. (b) The Data Manager on DemoESM and DemoFlowB: rows, a drill-in and Back, side panes collapse and resize, the selected row's neighbourhood closes. (c) The Configurator on a project with an environment: types listed, «Create model» keeps it open, New only on root-creatable types. (d) The left bar shows both sides' entries. (e) R-SIM-94: the model's Data on the model tab still declares and shows a global. Console errors counted per page. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_staging_crops/` (gitignored), one per check.
6. Commits by explicit path: the merge commit, any `fix:` after it, `docs:` for report, log entry, Status. Stop with `Outcome: hard-stop`, the shas, the gate numbers, the probe results, the questions adopted. The chat merges `staging-sync` into the trunk after its visual check.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `--force`, push, a rebase or a squash, a commit on `staging` or any branch but `staging-sync`, edits to Juri's files beyond the conflict resolution and the declared `fix:`, writes outside this worktree (no `/tmp` either), a call to an AI model.

## RIFERIMENTI

The previous staging merge `447e4239b` (2026-09-28) and its repair `e2448cf61` (two log entries spliced: check the union by entry count on both sides); `sessione_CORRENTE.md` of 2026-09-30 («Release 3.1.0: blockers and plan», point 1); staging's own reports under `docs/discovery/discovery_2026-09-2*_157_*`, `discovery_2026-09-28_158_data_manager_ux.md`, `discovery_2026-10-01_157_*`.
