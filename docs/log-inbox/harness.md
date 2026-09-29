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

## 2026-09-27 — feat: lane-run v2, five additions for the chat side (P-2026-09-27-1035)
**Prompt**: `claude_2026-09-27_1035_prompt_lane_run_v2.md`, full lane (one script and its tests, one template folder, one protocol paragraph), launched by `lane-run` on the trunk in `~/jjodel-release` at `c9c810ffc`, tip moved to `6c69783cf` by a docs-only commit of C-2026-09-27-1030. Gives `lane-run` the five pieces ratified in chat 2026-09-27 10:30: merge prompts rendered from templates and launched, inline resume and `go`, `probe`, two fixes with `status --all`, `wait`.
**Files touched**: `d6f619ce7`: `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/lane-templates/merge-into-trunk.md` and `trunk-into-branch.md` (new). `58de29980`: `lane-run.mjs`, `laneRun.test.ts`. This commit: `docs/PROTOCOL.md` (P16, the lane-run v2 bullet), `docs/log-inbox/harness.md` (this entry), the prompt's Status line. Outside every tree: the mutation bench under `~/.jjodel-lanes/P-2026-09-27-1035/bench/`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-26 16:40 (`claude_2026-09-26_1640_prompt_harness_orchestrated_lanes.md`: its `start` refused a prompt path relative to the caller, its Outcome parser read `Outcome: done · <shas>` as none)
**Causa**: (a)
**Regressions**: no. From `frontend/`: hook tests 255 before, 274 after `d6f619ce7`, 290 after `58de29980`, the 255 old ones green throughout; `typecheck:scripts` exit 0 and `check:scripts` PASS 29 files before and after; `check:docs` 4/4, 5 warnings, before and after. Mutation bench 33/33 and 28/28 killed. Real tree: `merge sim-profiles --into alfonso-frontend-jjtl --at 088473a5c` gives base `cdb46a7ee`, zero conflicts, 14 branch files, 11 commits; `status --all` 24 lanes, 0405 done, 1015 exited; a real probe on 3097: `/` and `profileBinder.ts` 200, EXIT=0, port freed, 3001 untouched. No build: no `src/` file.
**Out-of-scope changes**: no. Seven files, above five (rule 19), all in DOVE; the dry-run prompts and the probe's `_tmp_lane_vite_3097.config.ts` were written in the tree and removed.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Deviations: `merge --at <rev>` added, the only way to reproduce 03:40 now that the trunk holds sim-profiles (launch from it refused); `start` records `prompt.txt` for `go --step` and prints `prompt: <path>`; into the trunk `--launch` is also refused on code changed on both sides and on a branch prompt not flipped; probe sets PROBE_URL, PROBE_PORT. Two code commits: script diff above 400 lines. At start, an untracked prompt of C-2026-09-27-1030, committed by it as `6c69783cf`. Session 894945c0.
**Prompt document name**: 2026-09-27 10:35

**Ticket** (lane-run, left by P-2026-09-27-1035, to be found on their own): (1) `merge --into` does not refuse `--launch` when the branch has no commit the trunk lacks: measured on the dry run at the tip, where `sim-profiles` is already merged (base `939adb668`, 0 branch commits, launch not refused). (2) The merge-into-trunk template has no `simulation-engine` fast-forward step (0300 and 0345 had one): for a `sim-*` branch the chat adds it before `--launch`. (3) `npx tsx` resolves from the npx cache (`~/.npm/_npx/fd45a72a545557e9/`), not from a frontend dependency; on a machine without that cache npx would fetch it.

## 2026-09-27 — fix: lane-run hides the Outcome of a running lane, wait exits 0 at the deadline (P-2026-09-27-1225)
**Prompt**: `claude_2026-09-27_1225_prompt_harness_lanerun_wait_and_outcome.md`, fast lane, launched by `lane-run` in `~/jjodel-icons` on `harness-lanerun-wait` at `5e37e6027` (parent `097696d88`). Two tickets from the first use of lane-run v2: `status` showed the `Outcome:` of an earlier turn while a resumed lane ran (R2, P-2026-09-27-1110), and `wait` exited 3 at the deadline, so osascript dropped its output.
**Files touched**: `e3c95ce23`: `frontend/scripts/lane-run.mjs` (`laneState`, `waitLanes`, usage header), `frontend/scripts/hooks/__tests__/laneRun.test.ts`. This commit: `docs/PROTOCOL.md` (P16, the `wait` bullet), `docs/log-inbox/harness.md` (this entry), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 10:35 (`claude_2026-09-27_1035_prompt_lane_run_v2.md`: its `status` read the Outcome of any turn, its `wait` exited 3 at the deadline)
**Causa**: (a)
**Regressions**: no. From `frontend/`: `laneRun.test.ts` 54 green before, 3 red of 56 with the tests alone, 56/56 after; `check:scripts` PASS 39 files before and after; `typecheck:scripts` exit 0; `check:docs` 4/4 at this commit. Mutation bench 3/3 killed (table in `e3c95ce23`). No build: no `src/` file.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The single-lane tests sit in `lane-run status, the Outcome line`, beside `fakeLane`; the dead-process case removes `exit.txt` by hand, no new helper. The header's exit-code list also drops `3 wait timed out`. `/lane` and the chat's lane skill do not read exit 3. Bench copies left in `/tmp/lanerun-bench-D9kd` (`rm -rf` denied). Inbox, P16 and Status flip in one docs commit, as the prompt asks. Session `8c06b07f`.
**Prompt document name**: 2026-09-27 12:25

## 2026-09-27 — fix: lane-run merge renders to pending, --governance-goahead (P-2026-09-27-1440)
**Prompt**: `claude_2026-09-27_1440_prompt_harness_merge_pending_and_governance_goahead.md`, fast lane, launched by `lane-run` in `~/jjodel-gate` on `harness-merge-pending` at `b96195cc5` (parent `86520a8f3`). Two tickets of the afternoon: the unlaunched merge prompt left untracked in `docs/prompts/` blocked the next merge lane (P-2026-09-27-1409 on the prompt of P-2026-09-27-1242), and a governance change on the branch needed a launch by hand after Alfonso's yes (P-2026-09-27-1428).
**Files touched**: `41e85a32e`: `frontend/scripts/lane-run.mjs` (`merge`, `parseMerge`, `mergeFindings`, `mergeValues`, usage header), `frontend/scripts/hooks/__tests__/laneRun.test.ts`. This commit: `docs/log-inbox/harness.md` (this entry), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 10:35 (`claude_2026-09-27_1035_prompt_lane_run_v2.md`: `merge` rendered into `docs/prompts/` before knowing whether it would launch)
**Causa**: (a)
**Regressions**: no. From `frontend/`: `laneRun.test.ts` 56/56 before, 12 red of 64 with the tests alone, 64/64 after; `check:scripts` PASS 62 files before and after; `typecheck:scripts` exit 0; `check:docs` 4/4 at this commit. Mutation bench 4/4 killed, each by the test that names it (table in `41e85a32e`). No build: no `src/` file.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Readings of the prompt, stated: the by-hand commit also carries `-m <Model trailer>`, so it is the commit --launch makes (P6); with the flag and no --launch the Findings stay as measured and the go-ahead reaches only the by-hand commit; the minute check reads pending/ too, or a parked prompt no longer refused its Prompt-ID. `lane-run` in the by-hand line is the chat's name, not on the PATH, as the prompt's shape. Bench copies in `/tmp/lanerun-mut-1440`.
**Prompt document name**: 2026-09-27 14:40

## 2026-09-27 — docs: P16 describes the pending render and --governance-goahead (P-2026-09-27-1620)
**Prompt**: `claude_2026-09-27_1620_prompt_harness_p16_merge_rules.md`, fast lane, launched by `lane-run` in `~/jjodel-gate` on `harness-p16-merge-rules` at `03c2ebb3b` (cut from `alfonso-frontend-jjtl` at `2b1b346da`). P16 gains the two `lane-run merge` rules merged in `964597641` (lane P-2026-09-27-1440, code `41e85a32e`): the prompt rendered into `~/.jjodel-lanes/pending/`, and `--governance-goahead`.
**Files touched**: this commit: `docs/PROTOCOL.md` (P16, one bullet after the lane-run v2 block), `docs/log-inbox/harness.md` (this entry), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Docs only. From `frontend/`: `check:docs` 4/4, 5 warnings (inboxes waiting to be folded), exit 0; `check:agents` PASS, exit 0; `check:scripts` PASS 62 files, exit 0. No em dash in the added lines: 0, positive control 36 on the whole file.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Text read from the code, two points where it is narrower than the prompt: a launch moves the prompt into `docs/prompts/` (copy, then the pending copy removed), not just copies it; `--governance-goahead` without `--launch` lifts nothing and reaches only the commit of the `by hand:` line. The v2 `merge` line is left as it is: still true. Alfonso's yes (16:15, in chat) is the go-ahead of this governance change.
**Prompt document name**: 2026-09-27 16:20

## 2026-09-28 — fix: bordr line, probe theme helper, R-SIM-85 header (P-2026-09-28-0055)
**Prompt**: `claude_2026-09-28_0055_prompt_small_cleanups.md`, fast lane, launched by `lane-run` in `~/jjodel-w-cleanups` on `small-cleanups` at `ba74632df` (cut from `alfonso-frontend-jjtl` at `b452d9e5c`). Three tickets of 2026-09-27: the `bordr` build warning (P-2026-09-27-2248), probes whose dark crops keep canvas and tree light (P-2026-09-27-1647, 1806, 2324, P-2026-09-28-0023), `docs:digest` exit 2 on the R-SIM-85 header.
**Files touched**: `ce3531f99`: `docs/decisions.md` (R-SIM-85 header, two lines reflowed). `935d054f0`: `frontend/scripts/smoke/states.ts` (`setTheme`, `ThemeResult`). `dbcc9f2e9`: `frontend/src/components/editors/properties-with-tree-view.scss` (one line removed). This commit: `docs/log-inbox/harness.md` (this entry), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 20:49 (merge lane of `sim-modal`: it wrote the R-SIM-85 header wrapped, item 3 only)
**Causa**: (c)
**Regressions**: no. From `frontend/`: `typecheck` exit 2, 14 errors, the baseline set; `build` exit 0, esbuild warnings 1 to 0 (`bordr`), Sass deprecations 43 and rollup notices 5 unchanged; `typecheck:scripts` exit 0; `check:scripts` PASS 31 files (29 before the gitignored probe and the scratch vite config existed); `docs:digest` exit 2 to 0, the reflow empty under a whitespace-normalised diff. Probe `_tmp_p0055_theme.ts` on 3032: 16/16, zero page errors (numbers in `935d054f0`). No vitest: no test covers the touched files.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no human visual check in the prompt); probe crops light, attribute-only dark and `setTheme` dark in `~/.jjodel-lanes/P-2026-09-28-0055/shots_theme/`
**Notes**: One stop with `Outcome: question` on `bordr`: renaming it to `border` would arm a red debug border on `.tree-node__header`, which no TSX emits; the chat adopted the Recommended answer (RC-21) and the line is deleted. `setTheme` calls `ThemeService.set` in the page; on this tree Settings > Appearance still writes the attribute only (`813a73ff5` is on `demo-polish`).
**Prompt document name**: 2026-09-28 00:55

**Ticket** (priority low, opened here). In the `setTheme` dark crop (`A3_dark_app.png`) the status bar stays light: `.app-statusbar` hard-codes `background: #f8fafc` (`frontend/src/components/StatusBar.scss:17`) with no dark rule, so no way of switching reaches it. The Name input of the properties panel paints white in the same crop. Neither changed here, the second not investigated.

## 2026-09-28 — feat: lane-run direct merges, one closure commit, chains, model tier, report briefs (P-2026-09-27-2330)
**Prompt**: `claude_2026-09-27_2330_prompt_harness_lane_efficiency.md`, full lane (governance: P16) on `harness-lane-efficiency` in `~/jjodel-w-harness-eff`, launched by `lane-run`. Phase 1 report `d81a14423` (29 merge lanes of 2026-09-27 measured, 23 would have gone direct); the GO adopted its eleven `Recommended` answers and set the light model id to `claude-sonnet-5` (RC-32).
**Files touched**: `00c414397` merge --direct: `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts` (new). `3a11565df` go closes a direct merge: `lane-run.mjs`, `lane-templates/merge-into-trunk.md`, `lane-templates/trunk-into-branch.md`, `laneRunDirect.test.ts`. `1986cdf46` chain: `lane-run.mjs`, `laneRunDirect.test.ts`. `142b3eddf` model tier: `lane-run.mjs`, `laneRun.test.ts`, `laneRunDirect.test.ts`. `c9b506d9f` brief warning: `lane-run.mjs`, `laneRun.test.ts`. `0bdfa1f94`: `docs/PROTOCOL.md` P16, `docs/HARNESS-DOCS.md` §4.1, §7 and version 1.7, `docs/decisions.md` RC-32. This commit: this entry and four tickets, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. At every code commit: hook tests 300 in 4 files at the baseline, 310, 314, 322, 330, 333 in 5 files, 0 failed; check:docs 4/4 with 5 warnings (baseline 5); check:agents PASS; check:scripts PASS; typecheck:scripts exit 0. Mutation bench: 30, 16, 18 and 24 mutants on slices 1 to 4, 6 more on slice 5, all killed.
**Out-of-scope changes**: no. Eleven paths, above five (rule 19), all in DOVE and declared in the report's section 9; `laneRunDirect.test.ts` is the new test file DOVE allows, its fixtures carrying a second worktree and a fake npm.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Deviation: the union rule adds its blank line only before a branch heading (the report said before any non-blank line); both reproduce 15 of the 16 measured files. The GO says the project instructions name Sonnet 5 as an accepted deroga: not found in CLAUDE.md, decisions.md, PROTOCOL.md or settings.json, where Sonnet 5 appears only as a past executor; RC-32 records the id as the owner chat's. Session `536c46ab`.
**Prompt document name**: 2026-09-27 23:30

## 2026-09-28 — ticket: HARNESS-DOCS §4.2 and the discovery-report skill do not state the brief rule
**Ticket**: P16 and HARNESS-DOCS §4.1 (`0bdfa1f94`) say a discovery report opens with `## 0. Answer in brief`, at most 40 lines, and `lane-run status` warns otherwise (`c9b506d9f`). The card of the discovery report, HARNESS-DOCS §4.2, and `.claude/skills/discovery-report/SKILL.md` (rules 1 to 7) still describe the report without it, so a session that follows the skill writes no brief. Both were outside the DOVE of P-2026-09-27-2330.
**Priority**: medium
**Found in**: P-2026-09-27-2330
**Detail**: docs/discovery/discovery_2026-09-27_lane_efficiency.md (section 8)

## 2026-09-28 — ticket: the log-entry skill commits the inbox alone, against the one closure commit
**Ticket**: `.claude/skills/log-entry/SKILL.md:21` (rule 6) says "Commit the inbox alone", while P13 and RC-17 put the entry, the Status flip and the visual line in one closure commit, and `status-flip` (its line 19) already says the flip rides in that commit. It is one source of the two-commit closures measured on 2026-09-26/27.
**Priority**: medium
**Found in**: P-2026-09-27-2330
**Detail**: docs/discovery/discovery_2026-09-27_lane_efficiency.md (section 5)

## 2026-09-28 — ticket: docs:digest stops on the wrapped header of R-SIM-85
**Ticket**: `npm run docs:digest` exits on `docs/decisions.md`: the header of R-SIM-85 (added by `22aa888de`, on the trunk too) wraps before its closing parenthesis, "the parenthesis does not close on the header line". No digest is written until that header is on one line.
**Priority**: medium
**Found in**: P-2026-09-27-2330

## 2026-09-28 — ticket: a prose condition in a branch prompt is invisible to merge --direct
**Ticket**: `merge --direct` checks what git and the prompt headers say. The session of P-2026-09-27-2049 stopped on "the branch is not merged on the trunk before 2026-10-04", written in the body of a branch prompt, with every mechanical precondition holding, so `--direct` would have merged it. RC-31 lifted that embargo, not the class. A header line a script can read (for example `Merge: not before <date>`) would let `--direct` refuse it.
**Priority**: low
**Found in**: P-2026-09-27-2330
**Detail**: docs/discovery/discovery_2026-09-27_lane_efficiency.md (section 3)

## 2026-09-28 — merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1324)
**Prompt**: `claude_2026-09-28_1324_prompt_merge_harness-trace.md`, a direct merge by `lane-run merge --direct`, no session: `harness-trace` at `5038c7cd2` into `alfonso-frontend-jjtl`, merge base `6c69783cf`, 2 commits on the branch side.
**Files touched**: merge `c4bb0e0af`: 2 files from the branch side (`docs/discovery/discovery_2026-09-27_trace_monitor.md`, `docs/prompts/claude_2026-09-27_1030_prompt_trace_monitor_discovery.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c4bb0e0af` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5436 tests in 221 files, 9 red at import, hooks 333; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs-only merge, no UI change; gates green
**Notes**: Rollback tag `pre-harness-trace` on `3e141466d` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1324/result.json`.
**Prompt document name**: 2026-09-28 13:24

## 2026-09-28 — feat(harness): trace index and lane monitor, stage 1 (P-2026-09-27-1030)
**Prompt**: `claude_2026-09-27_1030_prompt_trace_monitor_discovery.md`, Phase 2 (stage 1), full lane, GO of 2026-09-28 in the resumed session on the answers of `docs/ratifiche/claude_ratifiche_2026-09-28_open_lanes_answers.md` point 4 (Q1-Q4, T1 with the RC-27 change). Branch fast-forwarded to `e54999b0b` first.
**Files touched**: `ee84361f3`: `frontend/scripts/lane-run.mjs` (`keepInput` in `launch()`), `frontend/scripts/hooks/__tests__/laneRun.test.ts` (+2). `7d2c53599`: `frontend/scripts/gates/trace-index.ts`, `trace-monitor.ts`, `__tests__/traceIndex.test.ts`, `__tests__/traceMonitor.test.ts` (new), `lane-run.mjs` (`monitor`), `laneRun.test.ts` (+2), `frontend/package.json` (`trace:index`). This commit: this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. vitest scripts/gates and scripts/hooks 569 at `e54999b0b`, 602 at `7d2c53599`; typecheck:scripts exit 0; check:scripts PASS (34 files); check:docs 4/4; no build (no `src/` file). Mutation bench: Q3 4 of 5 killed, stage 1 16 of 17 (survivors in the commit bodies). Real run: `lane-run monitor --no-open` on 3008, `/health` 200, foreign Host 403, live `lanes` events, a second start refused; 0.9 s CPU per 20 s, RSS 206 MB.
**Out-of-scope changes**: no — nine files over two code commits, all named by the GO (steps 2 and 3).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — no app UI; the monitor page was served (200, 7881 bytes) and not looked at
**Notes**: `trace:index` on the trunk tree (`e54999b0b`) and `~/.jjodel-lanes`, 2.1 s, two runs byte-identical. Nodes 2694: chat 24, check 88, commit 758, decision 225, lane 102, logEntry 1344, prompt 153. Edges 1474: cites 601, citesDecision 148, closedBy 129, corrects 22, decidedIn 104, foundIn 27, measures 88, openedBy 143, reports 114, runs 98. Misses 267: commit 152, decision 29, lane 4, logEntry 39, prompt 43. No P16 line: `docs/PROTOCOL.md` is a governance file and would stop `merge --direct`.
**Prompt document name**: 2026-09-27 10:30

**Ticket** (recurrence of «docs:digest stops on the wrapped header of R-SIM-85»): at `e54999b0b` `npm run docs:digest` exits 2 again, now on R-SIM-88 (`docs/decisions.md:2296`, the parenthesis does not close on the header line). `trace:index` reports it as a decision miss and reads the other rows. The class wants a gate on the register, not a fix per row.

## 2026-09-28 — merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1543)
**Prompt**: `claude_2026-09-28_1543_prompt_merge_harness-trace.md`, a direct merge by `lane-run merge --direct`, no session: `harness-trace` at `58d168441` into `alfonso-frontend-jjtl`, merge base `e54999b0b`, 3 commits on the branch side.
**Files touched**: merge `19f8ae493`: 9 files from the branch side (`docs/log-inbox/harness.md`, `docs/prompts/claude_2026-09-27_1030_prompt_trace_monitor_discovery.md`, `frontend/package.json`, `frontend/scripts/gates/__tests__/traceIndex.test.ts`, `frontend/scripts/gates/__tests__/traceMonitor.test.ts`, `frontend/scripts/gates/trace-index.ts`, `frontend/scripts/gates/trace-monitor.ts`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `19f8ae493` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5483 tests in 223 files, 9 red at import, hooks 337; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: scripts-only merge, no UI change; gates green on the merge
**Notes**: Rollback tag `pre-harness-trace-P-2026-09-28-1543` on `2e401d51c` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1543/result.json`.
**Prompt document name**: 2026-09-28 15:43

## 2026-09-28 — feat(harness): lane-run appends the RC-20 closing line to every input (P-2026-09-28-1545)
**Prompt**: `claude_2026-09-28_1545_prompt_lane_outcome_reminder.md`, fast lane, no discovery. Three lane sessions closed on 2026-09-28 without a valid RC-20 Outcome line; the rule stated in CLAUDE.md 21.2 has to travel with every input, not wait to be read.
**Files touched**: `c24a91000`: `frontend/scripts/lane-run.mjs` (`CLOSE_REMINDER`, `withCloseReminder`, `closingInput`, used in `launch()`), `frontend/scripts/hooks/__tests__/laneRun.test.ts` (+6 tests, 3 assertions of the existing "keeps a copy of every input" test updated for the new input-N.md shape). This commit: this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. typecheck:scripts exit 0; vitest scripts/hooks + scripts/gates 602 before, 608 after (11 files), all green; check:docs 4/4; check:scripts PASS (34 files). Mutation bench, four mutants of `lane-run.mjs` against a full `scripts/` tree copy (`LANE_RUN` env): dropping the append entirely killed by 6 tests, dropping the idempotency guard by 1, copying the pre-reminder text into input-N.md by 4, feeding claude's real stdin the pre-reminder file by 5.
**Out-of-scope changes**: no — the two files named in DOVE.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — harness/CLI change, no app UI
**Notes**: The reminder is appended once, inside `launch()`, the single point every real claude invocation passes through (start, resume, go, chain); never written into the worktree's prompt file or the chat's message file — a scratch `stdin.md` in the lane folder carries it.
**Prompt document name**: 2026-09-28 15:45

## 2026-09-28 — merge: lane-outcome-reminder into alfonso-frontend-jjtl (P-2026-09-28-1826)
**Prompt**: `claude_2026-09-28_1826_prompt_merge_lane-outcome-reminder.md`, a direct merge by `lane-run merge --direct`, no session: `lane-outcome-reminder` at `ca1862b1f` into `alfonso-frontend-jjtl`, merge base `df0487f94`, 3 commits on the branch side.
**Files touched**: merge `ef8356005`: 4 files from the branch side (`docs/log-inbox/harness.md`, `docs/prompts/claude_2026-09-28_1545_prompt_lane_outcome_reminder.md`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/lane-run.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ef8356005` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5489 tests in 223 files, 9 red at import, hooks 343; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: scripts-only merge, no UI change; gates green on the merge
**Notes**: Rollback tag `pre-lane-outcome-reminder` on `df0487f94` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1826/result.json`.
**Prompt document name**: 2026-09-28 18:26

## 2026-09-28 — feat(harness): check:addonly refuses add-only log rewrites (P-2026-09-28-2001)
**Prompt**: `claude_2026-09-28_2001_prompt_log_addonly_gate.md`, fast lane, light tier. A gate comparing a commit's `docs/claude-code-log.md` / its archive / `docs/log-inbox/*.md` against its first parent, refusing a rewritten or removed line except a legitimate same-file move, rotation (active→archive) or batch closure (inbox→active), each verified against the same commit's new content.
**Files touched**: code `65b8763a7`: `frontend/scripts/gates/check-addonly.ts` (new), `frontend/scripts/gates/__tests__/check-addonly.test.ts` (new), `frontend/package.json`, `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts`, `frontend/scripts/lane-templates/merge-into-trunk.md`, `frontend/scripts/lane-templates/trunk-into-branch.md`. This commit: `docs/log-inbox/harness.md` (this entry and the ticket below), the prompt's Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no. `npm run typecheck:scripts` exit 0. `npx vitest run scripts/hooks scripts/gates`: baseline (HEAD, WIP set aside per §6.1's cp/git-show pattern — `git stash` refused by the settings deny list) 608 tests, 603 passed, 5 pre-existing failures (`traceIndex.test.ts`/`traceMonitor.test.ts`/lane-run monitor, files this task never touched); after, 631 tests, 626 passed, same 5, 0 new failures. `check:docs` 4/4. `check:scripts` PASS (36 files). `check:agents` PASS (no `CLAUDE.md` touched). `check:addonly -- --range 65eb5475b..HEAD`: 33/33 clean, 8 real merges included.
**Out-of-scope changes**: yes — the two `lane-templates` files, not in the prompt's DOVE list: a one-line addition each to their existing "Gates on the merge commit" step, declared in the commit body (`65b8763a7`).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Mutation bench, 3 mutations each reverted after and diffed byte-identical: disabling the rotation-exception match killed 4 tests; removing `splitLines('')`'s empty-string case killed 3; disabling the `lane-run.mjs` reset-on-violation killed the new `laneRunDirect.test.ts` test. 447e4239b, the incident that motivated this gate, is NOT refused by it — ticket below.
**Prompt document name**: 2026-09-28 20:01

## 2026-09-28 — ticket: check:addonly cannot refuse 447e4239b, the incident that motivated it
**Ticket**: A first-parent-only, per-file line-multiset comparison (COME step 3 of P-2026-09-28-2001: "a line that moves within the same file counts as unchanged", needed so R-RAIL-45 reordering and fold/rotate relocation are not refused) cannot tell the 447e4239b splice from a legitimate repair. Proven with git plumbing before writing any code: relative to its first parent `888ea9a9d`, `docs/claude-code-log.md` at `447e4239b` gained 195 lines and lost none. The P-2026-09-26-2350 entry's 10-line tail, present in the first parent, was dropped from its rightful place and reattached, byte for byte, under the newly-introduced `2026-09-18` entry (which only the second parent had; that entry's own correct tail is what actually vanished, and it never existed in the first parent to be missed). That is structurally the same operation the repair commit `e2448cf61` depends on to legitimately pass. Comparing against the second parent instead is not a fix: it produced 628 false-positive line-occurrences on this same commit, mostly staging's own entries never meant to carry over — the two branches keep independently-divergent logs by design (`CLAUDE.md` P15). Catching this class needs entry-provenance tracking or a real three-way (both-parents) comparison, a different and larger algorithm than this prompt specified.
**Priority**: high
**Found in**: P-2026-09-28-2001
**Detail**: `frontend/scripts/gates/__tests__/check-addonly.test.ts` (the `documents "447e4239b"` test), commit `65b8763a7` body

## 2026-09-28 — feat(harness): check:addonly compares whole entries, not lines (P-2026-09-28-2001)
**Prompt**: GO stage 2 of P-2026-09-28-2001 — replace the per-line comparison with an entry-level one (whole `## ` entries, byte-identical and contiguous, entry order free to change); 447e4239b must now be refused; a `Log-Repair: <value>` commit trailer exempts a deliberate hand repair, tested with a synthetic commit since e2448cf61's real message cannot carry a trailer it was never written with.
**Files touched**: code `160b00d2a`: `frontend/scripts/gates/check-addonly.ts` (rewritten: entry-level comparison via `log-tools.ts` `splitLog`/`entryStartLines`, `entryKey()` trailing-blank-line normalization, the `Log-Repair` exemption), `frontend/scripts/gates/__tests__/check-addonly.test.ts` (rewritten, 20 tests). This commit: `docs/log-inbox/harness.md` (this entry, the ticket below), the prompt's Status line (re-pointed to `160b00d2a`).
**Outcome**: ⚠️ partial
**Corregge**: 2026-09-28 20:01
**Causa**: (a)
**Regressions**: no. `npm run typecheck:scripts` exit 0. `npx vitest run scripts/hooks scripts/gates`: before this stage's two-file diff (stage-1 committed state restored via `git checkout HEAD --`, cp/restore, no `git stash`) 631 tests, 626 passed, 5 pre-existing failures (unrelated, untouched); after, 629 tests, 624 passed, same 5, 0 new — the net −2 is the test file's restructure (20 tests vs 22), not lost coverage. `check:docs` 4/4. `check:scripts` PASS. `check:agents` PASS.
**Out-of-scope changes**: no — exactly the two files this stage's GO named.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: `check:addonly --range 65eb5475b..HEAD` now finds exactly one real commit, `e2448cf61`, on this branch's own ancestry: the actual repair of 447e4239b, made before the `Log-Repair` trailer existed, so it cannot carry one retroactively. This is the explicit, accepted design tradeoff (GO stage 2's own words: "e2448cf61 passes only through that exemption"), not a new defect — see the ticket below for the decision this leaves open.
**Prompt document name**: 2026-09-28 20:01

## 2026-09-28 — ticket: e2448cf61 permanently fails check:addonly --range, by design, unresolved
**Ticket**: `e2448cf61` (the real repair of the 447e4239b splice) is a legitimate ancestor of `alfonso-frontend-jjtl` at `65eb5475b..HEAD`, and now permanently fails `check:addonly` (2 entries named), because it carries no `Log-Repair` trailer — the mechanism did not exist when it was made, and a real commit's message cannot be amended after the fact without rewriting history (forbidden, P14/P15). `npm run check:addonly -- --range 65eb5475b..HEAD` will therefore never again return exit 0 on this branch's full range, only on ranges that exclude `e2448cf61`. Options, undecided: (a) accept permanently, document the one historical exception in `docs/PROTOCOL.md` or `CLAUDE.md` next to the gate's own rule, so a future reader of a red range scan does not treat it as a live regression; (b) narrow the default `--range` gate command future prompts cite to start after `e2448cf61` (`559eb82c5..HEAD` or later); (c) something else. Needs Alfonso's call, not a lane's.
**Priority**: medium
**Found in**: P-2026-09-28-2001
**Detail**: `frontend/scripts/gates/__tests__/check-addonly.test.ts` (the `checkRange` tests), commit `160b00d2a` body

## 2026-09-28 — merge: log-addonly-gate into alfonso-frontend-jjtl (P-2026-09-28-2211)
**Prompt**: `claude_2026-09-28_2211_prompt_merge_log-addonly-gate.md`, a lane-run merge session: `log-addonly-gate` at `fdb1e4390` into `alfonso-frontend-jjtl`, `--no-ff`, merge base `247a93549`, 5 commits on the branch side (check:addonly, P-2026-09-28-2001).
**Files touched**: merge `d3dbacb36`: 9 files from the branch side (`frontend/scripts/gates/check-addonly.ts`, `frontend/scripts/gates/__tests__/check-addonly.test.ts`, `frontend/package.json`, `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRunDirect.test.ts`, `frontend/scripts/lane-templates/merge-into-trunk.md`, `frontend/scripts/lane-templates/trunk-into-branch.md`, `docs/log-inbox/harness.md`, `docs/prompts/claude_2026-09-28_2001_prompt_log_addonly_gate.md`); this commit: this entry and the Status flip.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: yes — the trunk's full vitest run, 0 failed at `7f2a76413`, is 1 failed at `d3dbacb36`: the branch's new `checkRange` test times out at the 5000 ms default under full-suite load (3 of 3 runs: once on `fdb1e4390`, twice on the merge) and passes alone in 3.5 s. No test that passed on the trunk fails. Other gates on `d3dbacb36`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 5548 tests in 225 files as expected (5527 + 21), 9 red at import; hooks 344 (343 + 1); build exit 0; check:docs 4/4; check:agents PASS; check:scripts PASS; check:addonly HEAD clean.
**Out-of-scope changes**: no — the 9 files are the branch's, listed above; the rollback tag `pre-log-addonly-gate` on `ca43d6326`, not named by the prompt, follows RC-31.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — scripts-only merge, no UI change; the chat waived the four demo scenes (energy saving rule for scripts-only merges).
**Notes**: Adopted by chat C-2026-09-28-1936: the prompt carries `Chat: —`, its launcher unidentified. The chat accepted the red `checkRange` test at the GO (ticket below). Zero conflicts, tree `3020f7f03` as measured, probes 1 each, no union. The merge body reads "22:1x" for 22:12: bash-guard refused the amend. 3001 up from this tree, not restarted.
**Prompt document name**: 2026-09-28 22:11

**Ticket** (priority medium, opened here for a follow-up harness lane, accepted by chat C-2026-09-28-1936 at the GO). (1) The `checkRange` test in `frontend/scripts/gates/__tests__/check-addonly.test.ts:201` has no timeout of its own: 3.4 to 3.7 s alone, over the 5000 ms default under full-suite load in 3 of 3 runs, so `npm run test` on the trunk reads 1 failed until it carries an explicit timeout. (2) `e2448cf61` in the range check: the chat's resolution of the open ticket of P-2026-09-28-2001 is a known-repairs list mapping `e2448cf61` -> `447e4239b`.

## 2026-09-28 — fix: the six known vitest reds and the known-repairs list of check:addonly (P-2026-09-28-2332)
**Prompt**: `claude_2026-09-28_2332_prompt_harness_reds_and_repairs.md`, fast lane, light tier, launched by `lane-run` in `~/jjodel-w-harness2` on `harness-reds-repairs` at `68399c96e`. The six vitest reds every merge worker stopped on (five node-dependent, `checkRange`), and `e2448cf61` refused by `check:addonly --range`: a known-repairs list, RC-34's open ticket.
**Files touched**: `c2e861e31`: `frontend/scripts/lane-run.mjs` (monitor spawn), `frontend/scripts/gates/__tests__/traceIndex.test.ts`, `traceMonitor.test.ts`. `3c22f4521`: `frontend/scripts/gates/__tests__/check-addonly.test.ts`. `6f43d630b`: `frontend/scripts/gates/check-addonly.ts`, the same test file. This commit: this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-28 20:01
**Causa**: (c)
**Regressions**: no. Before, the four files under v23.3.0 on PATH: 133 tests, 6 failed (5 `ERR_UNKNOWN_FILE_EXTENSION ".ts"`, `checkRange` over 5000 ms); under v26.8.1: 1 failed (`checkRange`, 7.0 s). After, full `npx vitest run` under v23.3.0: 5555 tests, 5555 passed, 0 failed, 9 files red at import (the §17 set, `window is not defined`); `scripts/` under v26.8.1 632/632. `typecheck:scripts` exit 0; `check:scripts` PASS 36 files; `check:docs` 4/4; `check:addonly -- --range 65eb5475b..HEAD` exit 0, 47 commits, 1 exempt: `e2448cf61`, known repair of `447e4239b`.
**Out-of-scope changes**: no. Seven files, above five (rule 19), all in DOVE.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Cause of the five: node 23.3.0 strips no TS types without `--experimental-strip-types` (unflagged from 23.6), and the tests and `lane-run monitor` spawned `.ts` bare. Second cause `(g)`, for the trace tests of P-2026-09-27-1030. `checkRange` read HEAD's first-parent history: pinned to `65eb5475b..3e141466d`. `b7b708d46` amended to `3c22f4521` (a count in its body), nothing built on it. Benches in the commit bodies: 3/3 and 6/6, one equivalent survivor. Session `170177ff`.
**Prompt document name**: 2026-09-28 23:32

**Ticket** (flaky, low, left by P-2026-09-28-2332): once under v26.8.1, with `traceIndex`, `traceMonitor` and `laneRun` run together, the three `--governance-goahead` tests of `laneRun.test.ts > lane-run merge` failed; not reproduced alone nor in three later runs (the same three files and all of `scripts/` under v26.8.1, the full suite under v23.3.0). The failure text was not captured; cause unknown.

## 2026-09-29 — fix: light tier runs claude-sonnet-5-5, RC-32 (P-2026-09-28-2332)
**Prompt**: GO step of P-2026-09-28-2332 before the merge: Alfonso chose `claude-sonnet-5-5` as the light model of RC-32 (verified on the Mac: `claude -p --model claude-sonnet-5-5` answers, `claude-sonnet-5.5` is refused); `LIGHT_MODEL` and every test or message naming `claude-sonnet-5` change, grep first.
**Files touched**: `d5d2b7d49`: `frontend/scripts/lane-run.mjs` (`LIGHT_MODEL`), `frontend/scripts/hooks/__tests__/laneRun.test.ts` (the tier test that pins it). This commit: this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. The pinned test red on the old constant, green after. Full `npx vitest run` under v23.3.0: 5555 passed, 0 failed, the 9 §17 files red at import. `typecheck:scripts` exit 0; `check:scripts` PASS 36 files; `check:docs` 4/4.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: `git grep claude-sonnet-5` hit three lines of code, all changed; `git grep "claude-sonnet-5'" -- frontend/scripts` exit 1 after. The docs hits (decisions.md RC-32, discovery reports, sessions) record history and stay. The id regex of `chooseTier` already accepts the new id. Subject: the GO's `(RC-32, P-...)` is 74 characters to bash-guard, which strips only a bare ` (P-...)` suffix, so RC-32 moved before it. Session `170177ff`.
**Prompt document name**: 2026-09-28 23:32

## 2026-09-29 — merge: harness-reds-repairs into alfonso-frontend-jjtl (P-2026-09-29-0029)
**Prompt**: `claude_2026-09-29_0029_prompt_merge_harness-reds-repairs.md`, a direct merge by `lane-run merge --direct`, no session: `harness-reds-repairs` at `2ed46699c` into `alfonso-frontend-jjtl`, merge base `fb044365b`, 7 commits on the branch side.
**Files touched**: merge `27f3f7c25`: 8 files from the branch side (`docs/log-inbox/harness.md`, `docs/prompts/claude_2026-09-28_2332_prompt_harness_reds_and_repairs.md`, `frontend/scripts/gates/__tests__/check-addonly.test.ts`, `frontend/scripts/gates/__tests__/traceIndex.test.ts`, `frontend/scripts/gates/__tests__/traceMonitor.test.ts`, `frontend/scripts/gates/check-addonly.ts`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `frontend/scripts/lane-run.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `27f3f7c25` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5566 tests in 225 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat: scripts-only merge, no UI change; the six known vitest reds are gone
**Notes**: Rollback tag `pre-harness-reds-repairs` on `024d95345` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0029/result.json`.
**Prompt document name**: 2026-09-29 00:29

## 2026-09-29 — discovery: trace monitor stage 2, REQ files and the T6 rules (P-2026-09-29-0404)
**Prompt**: `claude_2026-09-29_0404_prompt_discovery_trace_monitor_stage2.md`, read-only discovery launched by `lane-run` in `~/jjodel-w-trace2` (branch `trace-stage2-disc`, trunk `1430054fe` plus the prompt): the REQ file format, the `Requirement:` header, the four T6 changes as rules with tests, the effect on the gates, a Phase 2 plan.
**Files touched**: this commit: `docs/discovery/discovery_2026-09-29_trace_monitor_stage2.md` (new), `docs/log-inbox/harness.md` (this entry), the prompt's Status line. Probe `frontend/scripts/smoke/_tmp_trace_stage2_probe.ts`, gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only on code; stage 1 tests `traceIndex` and `traceMonitor` 29 passed; `check:docs` run on this commit's tree.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Indexer on the trunk: 2991 nodes, 1839 edges, 284 misses. Freshness must exclude docs-only commits (20 of 28 checks stale otherwise, 7 of 25 without); every probe run names an untracked script. Phase 2: seven files, `head=`/`dirty=` in the probe log first. Awaiting Alfonso: A1, which requirements exist and who writes them. Detail in the report §0.
**Prompt document name**: 2026-09-29 04:04

## 2026-09-29 — merge: trace-stage2-disc into alfonso-frontend-jjtl (P-2026-09-29-0438)
**Prompt**: `claude_2026-09-29_0438_prompt_merge_trace-stage2-disc.md`, a direct merge by `lane-run merge --direct`, no session: `trace-stage2-disc` at `9691486a6` into `alfonso-frontend-jjtl`, merge base `1430054fe`, 2 commits on the branch side.
**Files touched**: merge `d7dfdbee0`: 3 files from the branch side (`docs/discovery/discovery_2026-09-29_trace_monitor_stage2.md`, `docs/log-inbox/harness.md`, `docs/prompts/claude_2026-09-29_0404_prompt_discovery_trace_monitor_stage2.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d7dfdbee0` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5695 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only, the trace monitor stage 2 discovery; Phase 2 parked after MODELS (A1 Alfonso, Q1, Q2)
**Notes**: Rollback tag `pre-trace-stage2-disc` on `08a67ed28` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0438/result.json`.
**Prompt document name**: 2026-09-29 04:38
