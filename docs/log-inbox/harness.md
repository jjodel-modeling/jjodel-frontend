# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-27 — docs: ticket on the probe oracle, first unattended closure (P-2026-09-27-0020)
**Prompt**: `claude_2026-09-27_0020_prompt_harness_probe_oracle_ticket.md`, fast lane (docs only, one commit, no visual check), launched by `lane-run` on the trunk in `~/jjodel-release` at `2b870d5ad`, the first lane expected to reach `Outcome: done` without a human after RC-29 (`620e3d5cd`). Records the ticket the RC-29 memo leaves to the next harness lane: `a fresh git init with a copied settings.json is not an oracle for permission rules`, below this entry.
**Files touched**: this commit: `docs/log-inbox/harness.md` (this entry and the ticket), `docs/prompts/claude_2026-09-27_0020_prompt_harness_probe_oracle_ticket.md` (Status line).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Docs only; `npm run check:docs` from `frontend/`: 4/4 passed, exit 0, 3 warnings (the two unresolved `Corregge` of the active log, this inbox waiting to be folded).
**Out-of-scope changes**: no — the two files of DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: —
**Notes**: `Found in`: the prompt's `RC-29` fails `TICKET_FOUND_IN` (`frontend/scripts/gates/log-tools.ts:53`: a prompt or chat ID first), so the ticket reads `C-2026-09-26-1702 (RC-29)`, the chat that measured RC-29. The inbox held no ticket after the fold `c5a669c2e`: shape from the harness tickets of the active log. Order as the prompt, entry then ticket: the fold puts the ticket on top. Session `89eb97d2`; `permission_denials` not visible from inside it.
**Prompt document name**: 2026-09-27 00:20

## 2026-09-27 — ticket: a fresh git init with a copied settings.json is not an oracle for permission rules
**Ticket**: §7 of the P-2026-09-26-1640 report measured 0 `permission_denials` for `git commit` under `-p` and `bypassPermissions` in a probe repository (a fresh `git init` with a copied `settings.json`, `ask` on `Bash(git commit*)` included), while on the real tree that `ask` held and stopped `P-2026-09-26-2340` and `P-2026-09-26-2350` at their first commit: five probes in the RC-29 memo, 3 and 4 refused by the `ask` (an `allow` does not override it), 5 committed once the rule was removed. The difference between the two setups was not identified. Future permission measurements run on the tree the lanes run in, never in a copy; §7 of that report is to be read with the RC-29 memo beside it.
**Priority**: low
**Found in**: C-2026-09-26-1702 (RC-29)
**Detail**: docs/ratifiche/claude_ratifiche_2026-09-27_commit_ask_under_bypass.md (What was measured, Ticket), read with docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md (§7)

## 2026-09-27 — chore: public-repo cleanup, PDF, local state, LaTeX builds, dataset emails (P-2026-09-27-0214)
Edited 2026-09-27 by P-2026-09-27-0051: references to the study neutralized, content otherwise unchanged.
**Prompt**: `claude_2026-09-27_0214_prompt_public_harness_cleanup.md`, lane harness, launched by `lane-run` on the trunk in `~/jjodel-release` at `283eab4f2`. Two phases; the GO on report `da84b10e5` adopted the nine `Recommended` lines of its §12 unattended (RC-21): `_build/*` plus `!_build/main.pdf`; the exact path `docs/jjtl-jjel-paper.log`; `authors_commitcount.txt` untouched (it holds no email); `noreply@anthropic.com` kept; ids a01..a08 from `commits.csv`, a09 and a10 from the attribution CSV; positive control `|a01|`; the wider negative grep; diff base `283eab4f2`; `paper-outline.md:128` to the ticket below.
**Files touched**: `da84b10e5`: `docs/discovery/discovery_2026-09-27_public_harness_cleanup.md`. `b5eaadead`: `978-3-030-43946-0_9.pdf` removed; `.claude/projects/.../memory/MEMORY.md`, `.../project_header_redesign.md`, `.claude/scheduled_tasks.lock` removed from the index only; `.gitignore`. `723480064`: the fifteen LaTeX build files under `docs/` removed from the index only; `.gitignore`. `869f204eb`: `<local research folder>/dataset/git/commits.csv`, `authors_commits.txt`, `docs/analysis/harness-attribution-commits.csv`, `<local research folder>/dataset/SUMMARY.md`, `docs/analysis/harness-attribution.md`. This commit: this entry, the prompt's Status line. Outside every tree: `<local research folder>/author-map/author-map.csv` (10 rows, mode 600).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `check:docs` 4/4, 3 warnings, before and after (baseline). Every field but the email identical to HEAD in the three CSV/TXT files, line counts 2075/11/1358, CRLF 1358 and quotes 532 kept. `|a01|` 0 then 723; the prompt's grep 3365 lines then none; the wider grep leaves only 69 `noreply@anthropic.com`. `git ls-files | grep -c 978-3-030` 0; `git ls-files .claude` = `settings.json` plus three skills; `_build/main.pdf` still tracked.
**Out-of-scope changes**: no. 26 paths in `283eab4f2..HEAD`, above five files (rule 19), all in DOVE plus the Phase 1 report, declared by the prompt and confirmed by the GO.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Deviation: a pathspec commit re-adds a `git rm --cached` path still on disk (measured in a scratch repo in the lane dir) and bash-guard denies a commit without pathspec, so for commits 1 and 2 (`b5eaadead`, `723480064`) the on-disk copies went to `~/.jjodel-lanes/P-2026-09-27-0214/aside{1,2}` and back, shasum 3/3 and 15/15 OK. Report §4 reads 2073 matching lines for `commits.csv`: not reproduced, 2075 by git grep, BSD grep and Python. Session `916693ee`.
**Prompt document name**: 2026-09-27 02:14

**Ticket** (public repo, left by P-2026-09-27-0214, to be found on their own): (1) `harness_FTG_PM.xmi`, `harness_FTG_PM_generic.xmi`, `harness_FTG_PM_reference.xmi` and `background_spec_driven_development.md` sit at the repository root, added by `1c8647eed` with the removed PDF: are they meant to be public, and there? `docs/mde-intelligence-2026/paper-outline.md:128` still calls the PDF «already in the repo». (2) 95 files under `docs/` cite `localhost:3001`. (3) No entry point for external readers: a `docs/harness/README.md` separating the reusable core of the harness from the Jjodel instance and from the historical archive, a lane of its own, to be discussed in chat first. (4) `frontend/src/todo_others` is tracked and ignored by `.gitignore:59`, the same shape as the `/CLAUDE.md` line removed here.

## 2026-09-27 — chore: research material out of the tree, references to the study neutralized (P-2026-09-27-0051)
**Prompt**: `claude_2026-09-27_0051_prompt_research_material_out_of_tree.md`, lane harness, launched by `lane-run` on the trunk in `~/jjodel-release` at `7b381f70a`. Two phases; the GO on report `0f0e0df6f` adopted the six `Recommended` lines of its §7 unattended (RC-21), as corrections to the prompt text: the clean-tree control `git grep -I -i -w -l '<word>' -- .` with the same command on `7b381f70a` as positive control; the guard `docs/discovery/*-dataset/`; this prompt neutralized too; no commit message, entry or report spells the word; both `ls-files` pathspecs quoted; `<local transcripts folder>`.
**Files touched**: `0f0e0df6f`: `docs/discovery/discovery_2026-09-27_research_material_out_of_tree.md`. `0793a8b6d`: 36 paths removed, the dataset directory under `docs/discovery/` (29 files) and `docs/analysis/harness-attribution.md` with its six `harness-attribution-*.csv`. `e0103160f`: `.gitignore`. `d47f3cbb1`: `docs/HARNESS-DOCS.md`, `docs/discovery/2026-06-12_template-simplification-edge-unification.md`, `docs/prompts/claude_2026-07-16_prompt_sessione_enrich_viewpoints_events.md`, `docs/prompts/claude_2026-09-27_0214_prompt_public_harness_cleanup.md`, `docs/discovery/discovery_2026-09-27_public_harness_cleanup.md`, `docs/log-inbox/harness.md`, this prompt. This commit: this entry, the prompt's Status line. Outside every tree: `<local research folder>` under `~/jjodel-research/`, with `dataset/`, `analysis/` and `author-map/` (moved from `~/.jjodel-lanes/`, sha256 unchanged).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `check:docs` 4/4, 3 warnings, before and after (baseline). Copies verified before `git rm`: `diff -r` exit 0 on 29 files, `cmp` exit 0 ×7, positive controls exit 1. Word control on HEAD: no output, exit 1; on `7b381f70a` 9 files. `git ls-files` of the two quoted pathspecs: empty, exit 0; `git ls-files docs/analysis` = `analysis_2026-06-08_codebase_overview.md` only.
**Out-of-scope changes**: no. 44 paths in `0f0e0df6f..HEAD`, above five files (rule 19), all in DOVE plus this prompt's body (Q3 of the GO), declared in the report and confirmed by the GO.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Deviations: commit 1 split in `0793a8b6d` and `e0103160f`, bash-guard refuses `docs/` and `.gitignore` in one pathspec (P13). The substring control prints 13 files, not the 12 of report F2: this prompt quotes the reflexive pronoun on six lines, left untouched, which F2 missed. The two local copies keep the stale mapping pointer (F8). Session `25771227`.
**Prompt document name**: 2026-09-27 00:51

**Ticket** (history of the public branch, left by P-2026-09-27-0051, a decision reserved to Alfonso by RC-26): the history of `alfonso-frontend-jjtl` still carries the research material removed by `0793a8b6d` (every blob before it), the study's name in the old paths and in the lines rewritten by `d47f3cbb1`, and one commit subject that names it, `869f204eb` (scope written here as `docs(<scope>)`); it is the only commit message of the branch that does, measured with a word-boundary grep over every message. Removing them takes a history rewrite and a force push: not done, not planned by any lane.

## 2026-09-27 — fix: typecheck:scripts skips _tmp_ probes, P16 prompt path and foreground gates (P-2026-09-27-0405)
**Prompt**: `claude_2026-09-27_0405_prompt_harness_night_tickets.md`, fast lane, launched by `lane-run` on the trunk in `~/jjodel-release` at `2a0066f21`. Closes three tickets of the night lanes: `typecheck:scripts` red on gitignored `_tmp_*` probes (`P-2026-09-27-0325`); P16 silent on the relative prompt path of `lane-run start` (chat, 03:01) and on gates run as a background task (`P-2026-09-27-0120`); the `bash-guard.mjs` header still naming the `git commit*` ask that RC-29 removed.
**Files touched**: `fbd9064c9`: `frontend/scripts/tsconfig.json` (`"exclude": ["**/_tmp_*"]`), `frontend/scripts/hooks/bash-guard.mjs` (header comment only). This commit: `docs/PROTOCOL.md` (P16, two bullets after Launch and resume), `docs/log-inbox/harness.md` (this entry), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. From `frontend/`: hook tests 255/255 and `check:scripts` PASS (28 files) before and after the code change; `check:docs` 4/4, 5 warnings, at baseline and before this commit. `typecheck:scripts`: baseline exit 0, 0 errors; with the probe `scripts/smoke/_tmp_p0405_typeerror.ts` exit 2, TS2322, 15 `scripts/` files listed; with the exclude and the probe still present exit 0, the same 14 files as the baseline, equal to the 14 tracked `.ts`. No build: no `src/` file changed.
**Out-of-scope changes**: no — the four files of DOVE plus this prompt's Status line.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The ticket's 25 errors did not reproduce: the chat's `_tmp_*` left in `scripts/smoke/` are `.md` only, so the probe stood in for them, then was removed. The child `exclude` replaces the one inherited from `frontend/tsconfig.json`, whose entries lie outside the child's `include`. Code subject is the prompt's fallback: the first one is 83 characters. Session `c9dbaa08`.
**Prompt document name**: 2026-09-27 04:05

## 2026-09-27 — feat: docs:digest, the decisions digest with a confidence label (P-2026-09-27-0830)
**Prompt**: `claude_2026-09-27_0830_prompt_docs_digest_generator.md`, fast lane, launched by `lane-run` on the trunk in `~/jjodel-release` at `05e89c80a`. A read-only generator renders the rows of one date of `docs/decisions.md` into `docs/digest/<date>.md`, with a confidence label from the RC-25 header fields, the RC-28 counts and a hand-written section kept across regenerations; the first digest, 2026-09-27, committed.
**Files touched**: `7b7ad1123`: `frontend/scripts/gates/docs-digest.ts` (new), `frontend/scripts/gates/__tests__/docsDigest.test.ts` (new, 41 tests), `frontend/package.json` (`docs:digest`). This commit: `docs/digest/README.md` (new), `docs/digest/2026-09-27.md` (generated), this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. From `frontend/`, before and after: `typecheck:scripts` exit 0 both; `check:scripts` PASS 27 then 29 files; `vitest run scripts/gates` 195 then 236 (+41); `check:docs` 4/4, 5 warnings both. Mutation bench 8/8 killed. Dry runs: 2026-09-27 12 rows, 2026-09-26 25, `--all` exit 0, 23 dates, 215 rows = 215 grammar rows by grep. `--write` twice: `unchanged`, same shasum. No build: no `src/` file.
**Out-of-scope changes**: no. Seven files, above five (rule 19), all in DOVE; `docs/decisions.md` read only.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The register over the prompt: R-EDGE-2, R-SIM-75, R-SIM-79 medium and R-SIM-76 low, not high. Deviations, in the `7b7ad1123` body: `at <sha>` is the last commit of the register, not HEAD; ` —` separator and free-text fields of ratified rows read; 11 IDs outside the grammar skipped and named. Status flipped by direct edit, the `status-flip` skill refuses model invocation; one closure commit (P13). Session `07f3b8cd`.
**Prompt document name**: 2026-09-27 08:30
