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

## 2026-09-27 — chore: public-repo cleanup, PDF, local state, LaTeX builds, EMSE emails (P-2026-09-27-0214)
**Prompt**: `claude_2026-09-27_0214_prompt_public_harness_cleanup.md`, lane harness, launched by `lane-run` on the trunk in `~/jjodel-release` at `283eab4f2`. Two phases; the GO on report `da84b10e5` adopted the nine `Recommended` lines of its §12 unattended (RC-21): `_build/*` plus `!_build/main.pdf`; the exact path `docs/jjtl-jjel-paper.log`; `authors_commitcount.txt` untouched (it holds no email); `noreply@anthropic.com` kept; ids a01..a08 from `commits.csv`, a09 and a10 from the attribution CSV; positive control `|a01|`; the wider negative grep; diff base `283eab4f2`; `paper-outline.md:128` to the ticket below.
**Files touched**: `da84b10e5`: `docs/discovery/discovery_2026-09-27_public_harness_cleanup.md`. `b5eaadead`: `978-3-030-43946-0_9.pdf` removed; `.claude/projects/.../memory/MEMORY.md`, `.../project_header_redesign.md`, `.claude/scheduled_tasks.lock` removed from the index only; `.gitignore`. `723480064`: the fifteen LaTeX build files under `docs/` removed from the index only; `.gitignore`. `869f204eb`: `docs/discovery/emse-dataset/git/commits.csv`, `authors_commits.txt`, `docs/analysis/harness-attribution-commits.csv`, `docs/discovery/emse-dataset/SUMMARY.md`, `docs/analysis/harness-attribution.md`. This commit: this entry, the prompt's Status line. Outside every tree: `~/.jjodel-lanes/emse/author-map.csv` (10 rows, mode 600).
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
