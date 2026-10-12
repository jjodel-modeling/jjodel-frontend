# Discovery: RQ tables, RC-26 review sheet and replication package for the CAIN 2027 full paper

- Prompt-ID: P-2026-10-11-1725 · prompt `docs/prompts/claude_2026-10-11_1725_prompt_cain_full_paper_rq_tables_package.md` · chat
  C-2026-10-10-1145 · Request session `01FWUFsDDVN1SMB4MGco19GJ` · lane full, unattended (local session
  `cef43d71-83c4-421b-9e01-1215164a3e4d`).
- Tree: `~/jjodel-w-cainrq`, branch `cain-rq`, HEAD `6093cfbd3` at the start. Executor: Claude Opus 5.5
  (`claude-opus-5-5`).
- Base: the 1630 dataset (`discovery_2026-10-11_governance_dataset.md`, `data/*.csv`, `scripts/`), not redone. Every
  git read is pinned to its ref `154311f55`; every series ends before the ratification merge `c6804f3d3`
  (2026-10-11 16:01:27), and 2026-10-11 is reported as the intervention.
- Read-only on the code and on `docs/decisions.md`; writes only under `docs/research/cain-2027/`, plus the archive
  and the key outside the repo. This report is a set of hypotheses with evidence, not a reference.

## 0. Answer in brief

1. **RQ1: a check that runs on the path holds the rule; the ordering contrasts the two ends, it is not a ladder.**
   `Model:` trailer 0.037 with the hook in tree (n 991), 0.547 for the chat (411), 0.875 without the hook (32);
   subject 0.019 against 0.236. The hook is a filter: 52 refusals in lane transcripts, 51 re-committed in a median
   9 to 13 s. Blocking at launch: `Front:` 0 of 17 launched without it; a warning: `Request:` 28 of 64. Not monotone
   between warning, report and no check: habitual lines (`Chat:` 0 of 182, `Depends:` 0.12) beat warned ones
   (`Request:` 0.45, `Lane:` 0.22); the lane runner's template keeps the trailer (0.037) and breaks the subject
   rule (0.573) with no check. The check nobody runs (row grammar) sits at 0.29. (§3)
2. **Item 5:** from 2026-09-26 the hook-vs-chat gap grows (`Model:` 0.51 to 0.55, subject 0.22 to 0.24); only the
   no-hook-in-tree contrast vanishes (32 commits become 1). (§4)
3. **RQ2: judgment rules drift, and the drift is seen at the time but not acted on.** RC-26: 34 of 71 rows did not
   wait by marker, 24 without header-cited delegations, **13 with neither a delegation nor an act of Alfonso before
   the trunk**; 22 of the 34 were flagged at or before their first commit. RC-25: 77 of 105 late, 38 of them seen
   within hours, then 7 to 9 days to acknowledgement. RC-18: over on 10-10, never measured as written. No notice
   came from a mechanism that runs unasked. (§5)
4. **RQ3: silent failure, then one batch.** The digest generator failed daily from 09-30, unmentioned for 11.5 days;
   the research line first named 62 of 67 grammar failures, 39 of 77 late rows, 7 of the 13 hard-core crossings,
   both RC-18 days. **133 of 138 repairs land in one merge (`c6804f3d3`).** While chats wrote «the row parses in
   docs:digest» into prompts, failures were caught in hours; the chat that dropped it started the drift. (§7)
5. Review sheet: 98 rows, empty `verdict`, 15 flagged; the apply script reports «0 reviewed» (§6). Replication:
   12 CSVs, HMAC shas, `check_anonymity.ts` **0 hits** after a positive control (§9). Archive: 562182651 bytes,
   sha256 `38945206…b61d8a`, 10602 files (§10). Three 1630 data issues corrected in the new tables only (§5.3).

Decisions awaiting Alfonso (RC-26 list): none. Decisions taken (unattended): §11.

Questions (§13):
1. Add "who writes the line" to the RQ1 table? Recommended: yes, measured for the lane runner, inferred for the chat.
2. Send the 40 rejected regex candidates to Alfonso? Recommended: no before 2026-10-20.
3. Keep prompt and chat ids in the artifact? Recommended: check the repository's visibility first; remap if public.
4. Read hook denials from local transcripts too? Recommended: no; state the lane-runner scope.
5. Keep the 2-day RC-25 window as the measure? Recommended: no; latency is the measure, the window a sensitivity.
6. Which RC-26 count carries the claim? Recommended: the 13 with no prior act, 34 and 24 as upper readings.
7. Fix the two 1630 artefacts in `governance-dataset.ts`? Recommended: yes, in a later lane, before camera-ready.

## 1. Goal and hypotheses under test

The paper's spine (1630 §0, settled): a mechanical check holds a rule only on the path where it runs; rules whose
compliance needs a judgment, and checkable rules whose check nobody runs, drift until a human-triggered batch
repairs them. The three RQs partition the rules by their nature.

| # | Hypothesis | Verdict | Where |
|---|---|---|---|
| H1 (RQ1) | for a checkable rule, the violation rate falls monotonically with the strength of the check position | **partly**: holds between the ends (hook vs everything else); not monotone across warning, report and no check | §3 |
| H1b (item 5) | the RQ1 gradient survives restricting the window to the judgment rules' period | **holds**: the gap is unchanged or wider on the common window | §4 |
| H2 (RQ2) | judgment rules drift over the series, and their crossings are noticed late or never, by a human | **partly**: they drift (34 / 24 / 13 crossings; 77 of 105 late; RC-18 over), but most crossings are noticed at the time, by lanes and the chat; late is the action, not the notice | §5 |
| H3 (RQ3) | drift is detected late and repaired in batches, not one by one | **holds**: 133 of 138 repairs in one merge; 11.5 days of silent failure | §7 |

## 2. Sources and method

### 2.1 Files read (full paths)

- `/Users/alfonso/jjodel-w-cainrq/CLAUDE.md` (session context); `/Users/alfonso/jjodel-w-cainrq/docs/PROTOCOL.md`
  lines 32-64 (P4, P6), 103-145 (P9), 319-330 (P14), 394-462 (P16);
  `/Users/alfonso/jjodel-w-cainrq/docs/decisions.md` lines 110-220 (RC-16..RC-28);
  `/Users/alfonso/jjodel-w-cainrq/docs/log-inbox/harness.md` lines 1-60 and 893-917;
  `/Users/alfonso/jjodel-w-cainrq/docs/claude-code-log.md` headings.
- `/Users/alfonso/jjodel-w-cainrq/docs/research/cain-2027/discovery_2026-10-11_governance_dataset.md` whole;
  `anonymization.md` whole; `scripts/governance-dataset.ts` whole (1093 lines); `scripts/rules-enforcement.csv`
  (rows RC-13, RC-17, RC-18, RC-25, RC-26, RC-33, RC-42..44, P6, CLAUDE-6.2, grammar); `scripts/rc26-hand-check.json`
  whole (by script); every CSV of `data/` (by script).
- `/Users/alfonso/jjodel-w-cainrq/frontend/scripts/gates/docs-digest.ts` lines 1-120 and its exports;
  `frontend/scripts/hooks/bash-guard.mjs` at `154311f55`, lines 1-40 and 190-360 (the denial messages).
- `~/.jjodel-lanes/P-*/` (473 folders, read only): `log.jsonl` (hook denials and the commits after them),
  `started.txt` and `input-1.md` (the prompt as launched).
- git at `154311f55`: commits since 2026-08-25, prompts as first committed and every later version of a prompt
  that missed a header line, the register at each row's introducing commit.
- One read-only helper agent searched the repository for the detection evidence of RQ2 and RQ3; its output
  (`/tmp/p1725/agent_detection/`) was checked by hand and curated into `scripts/detection-evidence.json` (§5.4).

### 2.2 Scripts (all new ones in `scripts/`, none wired into `package.json` or a gate)

| Script | Writes | Reuse of the 1630 work |
|---|---|---|
| `rq_common.ts` | — | the 1630 commit facts (origin, hook in tree, trailer, subject, docs/code) re-applied, cited by line |
| `rq1_check_position.ts` | `data/rq1_check_position.csv` | reads `decisions.csv`, `conformance_failures.csv`; **parity check**: its per-commit and per-prompt facts, summed over the 1630 windows, equal `comparison.csv` on all 17 series (text-only and checked n and violations, and repairs at ref), or it exits 1 |
| `rq2_rq3_tables.ts` | `data/rq2_judgment.csv`, `data/rq3_detection_repair.csv` | reads `decisions.csv`, `conformance_daily.csv`, `conformance_failures.csv`, `rc18_daily.csv`, `rc26-hand-check.json`, and the curated `detection-evidence.json` (§5.4) |
| `rc26_review_sheet.ts` | `review/rc26_review.md` | reads `decisions.csv`, `rc26-hand-check.json`; checks that the header it extracts at each row's first commit equals `header_at_intro` (98 of 98); refuses to overwrite a sheet that carries a verdict |
| `rc26_apply_review.ts` | `data/rc26_reviewed.csv` | reads the sheet, `decisions.csv`, `rc26-hand-check.json`, `detection-evidence.json` (`first_act`) |
| `detection-evidence.json` | (input) | the curated detection record of RQ2 and RQ3; also corrects three 1630 repair commits (§5.3), read by `rq1_check_position.ts` |
| `anon_common.ts`, `build_replication.ts`, `check_anonymity.ts` | `replication/*.csv` | follow `anonymization.md` §2-3 |

`governance-dataset.ts` exports nothing and writes its CSVs when imported, so the new scripts neither import nor
fork it: they read its CSVs, and re-apply its commit definitions under the parity check above. It was called once,
with `--out /tmp/p1725/regen`, and regenerated 7 of its 8 CSVs byte for byte; `autonomy_weekly.csv`
differs in the week of 10-05 (93 session lanes against 91, 30 asks against 29), because the lane folder grew by
the lanes started after the 1630 run. The committed 1630 CSVs are untouched.

Run order, from the repository root, each with `node --experimental-strip-types`: `rq1_check_position.ts`,
`rq2_rq3_tables.ts`, `rc26_review_sheet.ts`, `rc26_apply_review.ts`, `build_replication.ts`,
`check_anonymity.ts`.

## 3. RQ1: checkable rules by check position (`data/rq1_check_position.csv`)

Unit and window. Commit rules: non-merge commits reachable from `154311f55`, committed from 2026-09-22 (first full
day of the hook, `1172230c9`) to the cut. Prompt header lines: non-merge prompts as first committed, Prompt-ID from
the rule's start (Front 10-11, Request 10-10, Lane 09-28, Chat 09-28 23:00, Depends 10-06), committed before the
cut. Grammar: the 226 register rows dated from 2026-09-26, judged by `docs-digest.ts` at the row's first commit.
Path is the origin of the commit (1630 §2.3): lane = `lane-or-local`, chat, lane-run = its own templated commits.

| Rule | Check position | Path | n | Viol. | Rate | Blocked by the hook (then committed, median) | Repaired before the cut (median) / at the cut | Open at ref | Launched with the line missing |
|---|---|---|---|---|---|---|---|---|---|
| `Model:` trailer (P6) | hook on the commit | lane, hook in tree | 991 | 37 | **0.037** | 17 (17, 10 s) | — | 37 | — |
| | no check | lane, no hook in tree | 32 | 28 | **0.875** | — | — | 28 | — |
| | no check | chat | 411 | 225 | **0.547** | — | — | 225 | — |
| | no check, template | lane-run | 377 | 14 | 0.037 | — | — | 14 | — |
| subject ≤ 72 (CLAUDE.md 6.2) | hook on the commit | lane, hook in tree | 991 | 19 | **0.019** | 30 (29, 9 s) | — | 19 | — |
| | no check | lane, no hook in tree | 32 | 3 | 0.094 | — | — | 3 | — |
| | no check | chat | 411 | 97 | 0.236 | — | — | 97 | — |
| | no check, template | lane-run | 377 | 216 | **0.573** | — | — | 216 | — |
| docs and code apart (P13) | hook on the commit | lane, hook in tree | 991 | 5 | 0.005 | 5 (5, 13 s) | — | 5 | — |
| | no check | lane, no hook / chat / lane-run | 32 / 411 / 377 | 0 / 2 / 0 | 0 / 0.005 / 0 | — | — | 2 | — |
| `Front:` (RC-44) | blocking at launch | chat | 17 | 2 | 0.118 | — | 2 (30 s) / 0 | **0** | **0 of 17** |
| `Request:` (RC-43) | warning only (at launch) | chat | 65 | 29 | **0.446** | — | 1 (23 s) / 0 | 28 | 28 of 64 |
| `Lane:` (RC-17) | warning only (on request) | chat / lane | 181 / 12 | 39 / 0 | 0.215 / 0 | — | 0 / 0 | 39 | 36 of 172 / 0 of 12 |
| `Chat:` (RC-33) | report only (trace index) | chat / lane | 171 / 11 | 0 / 0 | **0** | — | — | 0 | 0 of 180 |
| `Depends:` (RC-42) | no check | chat / lane | 67 / 1 | 8 / 1 | 0.119 / 1 | — | 1 (23 s) / 0 | 8 | 3 of 67 |
| row-header grammar (RC-25..27) | check exists, nobody runs it (`docs-digest.ts`) | chat | 33 | 10 | 0.303 | — | 0 / 8 | 2 | — |
| | | lane | 193 | 56 | 0.290 | — | 5 (3.4 h) / 51 | 1 | — |

Findings:

- **Within a rule, the hook path is the low one.** `Model:` 0.037 on the hook path against 0.875 and 0.547 on the two
  paths without a check; subject 0.019 against 0.094, 0.236 and 0.573. The hook is a filter, not a teacher: in the
  lane transcripts it refused 17 commits without the trailer, 30 over-long subjects and 5 mixed pathspecs, and in
  51 of the 52 the same session committed again, in a median 9 to 13 s (`log.jsonl` tool results starting `PreToolUse:Bash hook
  error: bash-guard:`; denials are visible from 2026-09-27, when lane transcripts begin to carry commits).
- **The hook path's own misses are mostly not lane commits.** 920 of the 991 hook-path commits carry a lane id;
  23 of the 37 `Model:` misses do, so 14 of 37 come from commits with no lane id (local interactive sessions, most
  likely). On lane-attributed commits the rate is 0.025.
- **A blocking launch check repairs before launch; a warning does not.** `Front:` was missing on 2 of 17 prompts at
  commit, both repaired within 23 and 36 s (`385058377`, `e47e456b1`), and no lane was launched without it (0 of 17
  `input-1.md`). `Request:` was missing on 29 of 65, 1 repaired, and 28 of the 64 launched prompts reached their
  lane without it.
- **The grammar drifts like a judgment rule.** 66 of 226 rows (0.29) were outside the grammar at their first
  commit, on both paths; 5 were repaired before the cut (median 3.4 h), 59 at it.

**Is the ordering monotone?** By position rank (hook 1, blocking at launch 2, warning 3, report 4, no check 5, check
not run 6):

- *Within each commit rule across paths*: monotone for `Model:` and subject, hook < no check, **except where a
  template writes the text**: the lane runner's own commits carry the trailer at 0.037, as low as the hook path,
  and break the subject rule at 0.573, the worst of all. Same position (no check), opposite outcomes, decided by
  what the template writes. Docs/code is not broken anywhere (≤ 0.005), so it orders nothing.
- *Across prompt header lines* (all on the chat path), at commit: blocking 0.118 < warning 0.446 and 0.215, but
  report-only `Chat:` 0 and no-check `Depends:` 0.119 are **at or below** the warned lines. At launch: blocking 0 <
  warning 0.44 and 0.21, and again report-only 0 and no-check 0.04 are below warning. **The ordering breaks between
  positions 3 and 4-5**, on lines the chat writes into every prompt by habit (`Chat:`) or often (`Depends:`) and does
  not for `Request:`, which needs a URL the chat must look up. That is inferred from the prompts, not measured on a
  template: the chat's prompt template is not in the repository.
- *The check that nobody runs* (rank 6) sits at 0.29-0.30, above every hook row and every report or no-check
  prompt line, below `Request:`: with rank 5 it is the high end, as the claim expects, but no number separates
  "check exists, not run" from "no check".

So the monotone reading holds as a contrast between the two ends (a check that runs on the path vs everything
else), not as a ladder. What a template or habit writes is a second treatment that the check position does not
capture (threat C8).

## 4. Period confound (item 5)

The hook arrived 2026-09-21; the judgment rules 2026-09-26. The same RQ1 rows, restricted to commits and prompts on
or after 2026-09-26 (`window = from-2026-09-26-to-cut`):

| Rule, path | From 09-22 (prompt rules: from rule start) | From 09-26 |
|---|---|---|
| `Model:`, hook path | 37 / 991 = 0.037 | 36 / 920 = 0.039 |
| `Model:`, chat | 225 / 411 = 0.547 | 213 / 359 = 0.593 |
| `Model:`, lane without the hook in tree | 28 / 32 = 0.875 | 1 / 1 |
| `Model:`, lane-run | 14 / 377 = 0.037 | 13 / 374 = 0.035 |
| subject, hook path | 19 / 991 = 0.019 | 19 / 920 = 0.021 |
| subject, chat | 97 / 411 = 0.236 | 93 / 359 = 0.259 |
| subject, lane-run | 216 / 377 = 0.573 | 216 / 374 = 0.578 |
| docs/code, hook path / chat | 0.005 / 0.005 | 0.005 / 0.003 |
| prompt header lines, grammar | as in §3 | unchanged (every prompt and row is already from 09-26 on) |

**On the common window the RQ1 gradient is unchanged or slightly steeper**: the hook-vs-chat gap grows from 0.51 to
0.55 for `Model:` and from 0.22 to 0.24 for subjects; the only contrast it removes is hook-in-tree vs no-hook lane
commits, whose no-hook side shrinks from 32 commits to 1.

## 5. RQ2: judgment rules (`data/rq2_judgment.csv`)

Series up to 2026-10-10, the intervention day 2026-10-11 apart. `record = day` rows give the daily series,
`record = crossing` rows one crossing each with how and when it was noticed (§5.4 for the evidence).

### 5.1 Violations per day

| Rule | Unit | Series (09-26 to 10-10) | Peak | Intervention day (10-11) |
|---|---|---|---|---|
| RC-26 waits for Alfonso | rows in an RC-26 class (agent) introduced that day; crossing = did not wait (marker) | **34 of 71** (0.48) | 09-30: 11 of 14 | 0 of 0 |
| RC-25 acknowledged within 2 days | provisional rows written that day | **77 of 105** (0.73); 0 late on 09-27 (17 rows), every row late from 09-30 to 10-02 | 09-30: 21 of 21 | 0 of 1 (acknowledged only by the merge) |
| RC-25 outstanding (snapshot) | provisional rows older than 2 days, over rows since 09-26 | 0 on 09-27, 22 of 109 on 10-02, **75 of 209** on 10-10 | 10-07 to 10-09: 75 of 188 (0.40) | 75 of 226 before `c6804f3d3`, **1 of 226** after |
| RC-18 harness budget | harness-only share of code lanes, 7-day window | within on 15 of 16 days; **over on 10-10** (16 of 49, 0.327) | 10-10 | over (21 of 53, 0.396) |

Daily RC-26 crossings (positives): 09-26 0/3, 09-27 7/8, 09-28 2/3, 09-29 2/10, 09-30 11/14, 10-01 1/2, 10-02 5/10,
10-03 3/13, 10-04 2/2, 10-05..10-09 none in the class, 10-10 1/6. RC-25 late rows by day: 09-26 1/6, 09-27 0/17,
09-28 1/3, 09-30 21/21, 10-01 6/6, 10-02 12/12, 10-03 13/15, 10-04 19/20, 10-05 4/4, 10-10 0/1.

### 5.2 Who noticed, and when

| Rule | Crossings | First noticed by | Notice relative to the row's first commit | Research line first |
|---|---|---|---|---|
| RC-26 | 34 | lane report 13, digest 9 (generated digest of 09-27: 2; the 1430 digest: 7), chat 6, Alfonso 6, never 0 | 22 at or before the row's first commit (the report that proposed the decision flagged it, or Alfonso's word preceded it); the 9 digest notices 0.3 days (09-27) or 7.8 to 9.6 days (1430) later | 7 |
| RC-25 late | 77 | 1430 digest 39, Alfonso 20, chat 12, lane report 6 | 38 at writing or within 2 days (median 0.0 days); 39 a median 8.9 days later (6.9 to 10.7) | 39 |
| RC-18 over | 2 days | the 1150 report (19 of 49, a proxy), 2026-10-11 12:12 | 12 h after the 10-10 window closed; nothing measured RC-18 before 10-10 | 2 |

- **Noticed early, acted on late.** The RC-25 rows noticed within hours by Alfonso, the chat or a lane report were
  acknowledged a median 9.0, 7.0 and 7.2 days later, all in the batch at `c6804f3d3`; the 39 that only the 1430
  digest noticed were acknowledged 1.3 h after it. Detection was not the bottleneck for half the late rows: no step
  turned a notice into the acknowledgement marker until the batch.
- **RC-26 crossings were mostly noticed by the process that made them.** 17 were flagged as needing Alfonso
  (`noticed_as = rc26`), most of them in the «Decisions awaiting Alfonso» section of the very report whose
  recommendation the chat then adopted; 7 were taken under a delegation; 6 were seen only as provisional rows; 4
  Alfonso acted on without the class being put to him.
- **The marker understates waiting.** For 15 of the 34, an act of Alfonso (GO, acceptance, ratification) is recorded
  before or at the row's trunk arrival; for 4 only after; for 15 none. Three are probably not crossings at all
  (R-SIM-80..82: the section intro records his ratification in chat before the rows, in an order the 1630 status
  reader does not match), and one is an id reused across branches (R-SIM-87). Classified by first act
  (`first_act`): 12 none, 11 under delegation (10 cited in the header, plus R-SIM-88), 6 Alfonso's word before the
  trunk, 3 ratified by section, 1 partial delegation (RC-30: the quoted go-ahead covers one lane, the row makes it
  a rule), 1 id reuse.
- **The hard core: 13 crossings with neither a delegation nor an act of Alfonso before the trunk**
  (`crossings_no_prior_act` in `data/rc26_reviewed.csv`): RC-30, R-EDGE-2, R-SIM-76, R-SIM-79, R-B17, R-JS-7,
  R-JS-10, R-UNDO-8, R-SIM-120, R-IRN-38..41. Four were flagged as RC-26 items by the lane report at the time and
  went ahead (R-SIM-76, R-SIM-79, R-B17, R-JS-10); two were listed by the generated digest of 09-27 (RC-30,
  R-EDGE-2); **seven were first noticed by the research line's 1430 digest, 7.8 to 9.6 days later**.
- **RC-18 was never measured as written.** RC-18 asks the chat to measure the share weekly in its checkpoint; no
  checkpoint does (`git grep 'RC-18' 154311f55 -- docs/sessioni/`: 1 line, about saving a lane; control `RC-25`: 8
  lines). On 10-10 a report named RC-18 as a risk of its own two lanes without measuring it
  (`6ec3c3f8e`, `discovery_2026-10-10_lane_tracking_github_projects.md:490`); the first measure is the 1150 report's
  proxy on 10-11 (`d97744795`, `discovery_2026-10-11_insights_more_cards.md:40`), and the chat's own 33 of 69 is
  recorded only in the 1630 research prompt (`154311f55`, prompt line 37).
- **Who notices: lanes and the chat, not a check.** No RC-26, RC-25 or RC-18 notice came from a mechanism that runs
  unasked. The two digests that noticed rows were generated on request: `docs:digest --write` on 09-27 (the only
  two commits ever under `docs/digest/`), and the 1430 digest, commissioned by the research line.

Numbers that wait for Alfonso's review (§6): the RC-26 positives (71), the crossings (34 by marker, 24 without the
10 header-cited delegations, 13 with no prior act) and the share that did not wait (0.48) are the agent's; after
the review they come from `data/rc26_reviewed.csv`, `reviewed` and `combined` columns.

### 5.3 Data issues of the 1630 dataset found here (the 1630 CSVs are unchanged)

- R-SIM-80..82 read `unmarked`: the 1630 section reader matches «ratificat… da/by Alfonso», not «Alfonso ha
  ratificato» (`54999f9ae`, `docs/decisions.md:2111`). They count as crossings in `decisions.csv`.
- R-SIM-87 and R-SIM-88 join two different rows under one key (`title_vs_intro = changed`): the provisional first
  appearance is an outputs row on another branch (`bdd11814c`), later renumbered.
- `fixed_commit` of R-VP-58..60 is `1bd0b33c0`, an unrelated merge: `governance-dataset.ts:358-362` `continue`s at
  the trunk-arrival commit before the fixed check at `:369`, so a header repaired on a branch is dated at the next
  trunk commit touching the register. The RQ tables use the trunk arrival `544fbd19f` (2026-10-04 00:45) through
  `detection-evidence.json`; only these three rows are affected in the window.

### 5.4 Evidence

`scripts/detection-evidence.json` holds one record per crossing and per batch: noticer, date, evidence (commit and
`file:line`), research-line flag, first act, and a note in English. It was curated from a read-only helper agent's
search (`/tmp/p1725/agent_detection/detection.json`, 97 evidence commits, all ancestors of `154311f55`) and checked
by hand on six claims, all confirmed: the R-SIM-80..82 section intro (`54999f9ae`, `docs/decisions.md:2105-2111`),
the 1430 digest's R-UNDO-8 entry (`b646a9a04`, line 48), the silent window (one commit adds `docs:digest` between
2026-09-29 20:00 and 2026-10-11 14:30, a log rotation, `d2eb5fb83`, against 31 between 09-27 and 09-29 20:00), the
R-SIM-85 repair (`ce3531f99`), the 1150 proxy (`d97744795`, line 40), and RC-30 in the generated digest
(`cf58f1d98`, `docs/digest/2026-09-27.md:11`); plus R-VP-28 (`728291b21`, report line 180) and R-EE-1 (`dc013e8ba`,
prompt line 11). The agent's uncertain calls (RC-30, R-EDGE-2, R-VP-28/31, R-EE-1/3, R-VP-33, R-SIM-94, R-SIM-108,
the 1150 classification) are in its `notes.md`; none moves the hard core except RC-30, which a reading of its quote
as a delegation would remove (12).

## 6. RC-26 review sheet (`review/rc26_review.md`)

- 98 rows, ordered by header date: the 71 positives of the 1630 hand check (68 rule candidates the agent confirmed,
  3 sampled negatives it found positive) and the 30 sampled negatives (the 3 counted in both). Columns: id, date,
  set, header as first written, the row's own title as its one-line summary (bold opening or first sentence, not a
  paraphrase: a paraphrase would be the lane's judgment), class the agent assigned, regex classes matched (or "no
  regex"), waited (yes/no with the status marker at introduction), delegation cited (quoted from the row), the
  agent's note, and an empty `verdict` column. The three-line instruction is at the top.
- The 10 rows that cite a delegation are exactly the 10 the 1630 report named (RC-40, RC-45, R-SIM-94, R-SIM-95,
  R-SIM-108, R-VP-19..23). The header extracted from the register at each row's first commit equals `decisions.csv`
  `header_at_intro` on 98 of 98 rows.
- `scripts/rc26_apply_review.ts` on the empty sheet: «0 reviewed of 98 rows (0 positives, 0 sampled negatives)»,
  exit 0; `data/rc26_reviewed.csv` then carries the agent's numbers (71 RC-26 rows, 34 crossings, 0.479; 24 and
  0.393 when the 10 delegated rows are set apart; regex precision 0.630) and empty `reviewed` cells. Checked on two
  temporary copies: four verdicts recompute by hand (combined crossings 33 of 71, agent precision 0.667 on 3
  reviewed positives), and a verdict «maybe» exits 1 naming the row. The real sheet was not written to.
- The 40 rule candidates the agent rejected are not in the sheet, as the prompt asks; regex precision therefore keeps
  the agent's verdict on them (§13, question 2).

## 7. RQ3: detection and repair (`data/rq3_detection_repair.csv`)

324 episodes: every header of `conformance_failures.csv` (245: 67 rows dated from 2026-09-26, 178 older rows that the
grammar never bound), every provisional row acknowledged late or never (77), every RC-18 day over budget (2).

| Family | Episodes | First detected by | Introduced → detected (median) | Detected → repaired (median) | Repaired by REF | In a batch (> 10 in one commit) |
|---|---|---|---|---|---|---|
| grammar, rows from 09-26 | 67 | the chat of the research line 62 (1430 prompt, 10-11 14:33), lane report 2, never 3 | 7.0 days for the 62 (0.1 to 11.5); 0.12 and 0.02 days for the 2 | 0.06 days (1.5 h) for the 62; 0.08 and 0.01 days for the 2 | 64 (3 open) | **59**, all in `c6804f3d3` |
| RC-25 late | 77 | 1430 digest 39, Alfonso 20, chat 12, lane report 6 | 8.9 days (digest); about 0 (the others) | 0.05 days (digest); 9.0, 7.0, 7.2 days (Alfonso, chat, lane report) | 74 (3 never) | **74**, all in `c6804f3d3` |
| RC-18 over budget | 2 days | the 1150 report (research line) | 0.5 days after the 10-10 window | — | 0 | — |
| grammar, rows before 09-26 | 178 | never (outside the generator's opener by design) | — | — | 0 | — |

- **Silent failure, then one batch.** From 2026-09-30 the generator exited 2 on every day of the series (13 of the
  16 days, 1630 §5). Between 2026-09-29 20:00 and 2026-10-11 14:30 one commit adds the string `docs:digest`, a log
  rotation moving old text (`d2eb5fb83`), against 31 in the two and a half days before; `HeaderParseError`: 0. The
  62 failures of that stretch were first named by the research line's 1430 prompt (`4de76fb74`, line 29), a median
  7.0 days after each was written, and 59 were repaired 1.5 h later in one merge, which also acknowledged 74 RC-25
  rows: **133 of the 138 repairs in the window land in `c6804f3d3`**; no other commit repairs more than 3. From the
  first failure that lasted (R-VP-19, 2026-09-30 01:44) to that first notice (2026-10-11 14:33): 11.5 days.
- **When the check travelled with the prompt, drift was caught in hours.** The two early failures were detected by
  a lane that ran `docs:digest` (R-SIM-85: ticket the same night, `e87df1ff6`, `docs/log-inbox/views.md:89`; R-SIM-88:
  the trace monitor lane, `58d168441`, `docs/log-inbox/harness.md:216`) and repaired knowingly within 2 h and 8
  min (`ce3531f99` merged by `43113104b`; `0913b4c3f`). Three chats wrote «the row parses in docs:digest» into
  their prompts (26 prompts mention `docs:digest`); the last did so on 2026-09-29 19:43
  (`claude_2026-09-29_1943_prompt_sim_random_l2.md`). The chat that wrote the first lasting failure on 09-30
  (C-2026-09-29-2230) did not carry the check, and neither did any later chat until the research line. The check
  existed in the repository throughout; what moved was who remembered to run it.
- **Three repairs were incidental.** R-VP-58..60 parsed again because their rows were ratified or withdrawn on the
  branch (`a24c5d5b5`); no artifact says anyone saw the header fail. Three never parse: RC-38 (free text, left by
  the 1540 lane with a question for Alfonso), D-UI-15 and D-UI-16 (ids outside `ROW_ID`).
- **RC-25: half the late rows were seen at once, and still waited for the batch** (§5.2). The acknowledgement step
  had no owner: no row was ever marked `ratified by digest` (0 of 97; 1630 §3).
- **RC-18 was not repaired** by the ref: the window ending 10-11 is still over budget (0.396).

Per episode, `rq3_detection_repair.csv` carries the introducing commit and chat, the detection evidence, the repair
commit, both latencies, `repaired_by_intervention` and the batch size; `detected_by_research_line` separates the
detections this research produced from those the harness produced.

## 8. Threats (`threats.md`)

`threats.md` expands 1630 §9 into construct (C1-C10), internal (I1-I7), external (E1-E3) and conclusion (K1-K5)
threats, each with the number it moves and what the paper can do. New in this lane: C2 (the hook measured as a
filter: landed vs attempted), C5 (detection means detection in a committed artifact), C7 (position assigned by a
curated map), C8 (who writes the text), C9 (the status marker is not the practice), C10 (two 1630 artefacts), I1
(the period confound, measured in §4), I2 extended (the research line produced most first notices), K2 (commits
cluster by lane), and a measured window sensitivity for RC-25 (C4: 1 to 5 days give 0.73 to 0.78).

## 9. Replication package (`replication/`)

- `build_replication.ts` follows `anonymization.md` §3: 12 CSVs (the 8 of the 1630 dataset, `rq1`, `rq2`, `rq3`,
  `rc26_reviewed`), every commit id replaced by HMAC-SHA256 of the full id, first 12 hex characters, the same
  value in every file (2879 occurrences, 370 distinct commits); authors as pseudonyms (M, C1, D1..D5, agent);
  identifying strings rewritten with the covers of `anonymization.md` §2 (`anon_common.ts` `COVERS`), document
  paths reduced to type and date (`discovery-report-2026-10-04`, `prompt-P-…`); register sections as `S01`..;
  the 4 row keys with an Italian qualifier as `<token>~n`; dropped: `header_at_intro`, `header_now`,
  `rc26_hand_note` (`decisions.csv`), `evidence` (`rules.csv`). Column headers that named the maintainer renamed.
- The key: `~/.jjodel-cain-key`, absent at the start, created by the script with 32 random bytes (mode 600,
  17:51); never printed, logged or committed. The README says it is released at camera-ready.
- `replication/README.md` (English, written by hand): vocabulary, the pseudonymous ids, every file and column, how
  the report's numbers derive from the files, what was removed and why.
- `check_anonymity.ts`: a positive control on `data/` first (it must see the maintainer's name, product tokens,
  commit ids and Italian, or it exits 2), then the scan of `replication/`. Output of the final run:

  ```
  control on data/: 12 files, 5381 hits; kinds seen: alfonso yes, jj yes, commit id yes, italian yes
  scanned docs/research/cain-2027/replication: 13 files, 2295 lines, 2879 hex tokens tested against 6036 commits
  0 hits
  ```

  Exit 0. A planted file (a product token inside a URL, a home path, a full and a 7-hex real commit id, the
  affiliation, «MODELS demo», and the English «models» as a negative) gave 7 hits and exit 1, with the English
  word not flagged. `MODELS` is matched case-sensitively as a word, plus `models demo` / `models 2026` in any
  case: the lowercase word is ordinary English in the column definitions.
- What it cannot see: identifiers not in the map (the Docker Hub account), the domain fingerprint (R3), and the
  ids kept on purpose (prompt and chat ids, decision ids).

## 10. Archive of the lane folders

- `tar czf ~/jjodel-cain-archive/lanes_2026-10-11.tar.gz -C ~ .jjodel-lanes`, run 2026-10-11 17:27, exit 0
  (`/tmp/p1725/tar.out`). `~/jjodel-cain-archive/` was created; `~/.jjodel-lanes/` was only read.
- Path `/Users/alfonso/jjodel-cain-archive/lanes_2026-10-11.tar.gz`; size 562182651 bytes (536 MiB); sha256
  `38945206f6abd910eaadc8ea86324296d0868e3b880ff4eb5e70ba38dfb61d8a`.
- Content (`tar tvzf`, exit 0): 11341 entries, 10602 regular files, 33 symbolic links, 706 directories; 473 lane
  folders `P-*`, each with a `log.jsonl`. It holds the whole folder, the board cache, pending prompts and helper
  files included, and this lane's own folder as it was at 17:27 (13 entries, mid-run).
- It stays outside the repository: the transcripts embed home paths, session ids and e-mail addresses
  (`anonymization.md` §4 R4). `autonomy_weekly.csv` regenerates from it with `--lanes <extracted>/.jjodel-lanes`;
  the hook denials and launch-time header checks of RQ1 read the same folders.

## 11. Decisions taken (unattended) and decisions awaiting Alfonso

Taken in this report, as method choices; none written to `docs/decisions.md`:

- the series end at the committer time of `c6804f3d3` (2026-10-11 16:01:27), exclusive; 2026-10-11 is the
  intervention day, reported as its own period in RQ2 and as `repaired_by_intervention` in RQ3;
- RQ1 commit rules start on 2026-09-22 (the 1630 checked period), prompt rules at each rule's Prompt-ID start, the
  grammar at rows dated 2026-09-26; the restricted window of item 5 starts every series on 2026-09-26;
- a path is the 1630 commit origin of the commit that carries the violation (for a prompt, the commit that added
  it; for a register row, its first commit);
- check positions are ranked hook on the commit (1), blocking at launch (2), warning only (3), report only (4), no
  check (5), check exists but nobody runs it (6); the `Lane:` warning counts as warning-only although it runs on
  request (`lane-run status`, trace index);
- a hook denial is a `tool_result` that starts `PreToolUse:Bash hook error: bash-guard:` in a lane transcript; it is
  "then committed" when the same transcript later shows a successful `git commit` (bracketed `[branch sha]` output,
  or `sha subject` under `-q`);
- "launched with the line missing" reads the header of `input-1.md`, the prompt as the lane received it;
- a repair of a prompt line is the first later commit whose header carries the line; a repair of a row header is
  the 1630 `fixed_commit`; latencies are measured on commit times, not on the minute-rounded CSV times;
- RC-25 lateness keeps the 1630 two-day window, counted on the row's acknowledgement date (marker date, else the
  ratifying commit, else, for a row ratified on its branch, the marker of the row at its trunk arrival);
- a batch is a repairing commit or merge that repairs more than 10 episodes, counted across families;
- the review sheet's summary column is the row's own title, not a paraphrase;
- the replication package drops the free-text header columns (their keyed fields stay), the agent notes, the
  `file:line` quotes of `rules.csv` and the section headings (kept as `S01`..), and rewrites the 4 row keys that
  carry an Italian qualifier as `<token>~n`.

Awaiting Alfonso (RC-26 list): none. This lane changed no code, no register row, no exported interface, deleted
nothing and did not push. The RC-26 verdicts are his, on the sheet; the lane wrote none.

## 12. Dependencies and risks

- **The pin.** Every number depends on `154311f55` and on the cut `c6804f3d3`. The scripts take no `--ref`; a later
  ref is a new dataset, not a rerun.
- **Live lane folder.** `rq1_check_position.ts` reads `~/.jjodel-lanes/` live (70 s on 709 MB of transcripts). Its
  windows end at the cut, so a new lane does not move the numbers, but an edited old transcript would; the
  archive of §10 is the reference copy.
- **Curated detection evidence.** RQ2 and RQ3's "who noticed, when" comes from a helper agent's search, checked by
  hand and kept as `scripts/detection-evidence.json`; a notice that left no committed artifact is invisible (threat
  C5).
- **The HMAC key.** `~/.jjodel-cain-key` (32 random bytes, mode 600) was created by this lane at 17:51 on
  2026-10-11; it exists in one copy, outside every repository, and was never printed. If it is lost the pseudonyms
  can no longer be verified against the repository, and a rebuild with a new key changes every pseudonym.
- **What the anonymity check cannot see.** It checks the strings of `anonymization.md` §1 and shapes; the Docker Hub
  account, the domain fingerprint (R3) and identifiers not in the map are outside it. Prompt and chat ids are kept,
  as `anonymization.md` §2 allows: they are search keys if the repository is public (R1), and its visibility is
  still not determined.
- **`/tmp/p1725/`** holds the probes, the regenerated 1630 CSVs, the tar log, the anonymity bench and the helper
  agent's work files; none is needed to regenerate the committed files.

## 13. Open questions

1. Should the paper's RQ1 table carry "who writes the line" (template, chat habit, agent) beside the check position?
   Recommended: yes, as one column, marked measured for the lane runner's template and inferred for the chat's prompts.
2. Should the 40 rule candidates the agent rejected also go to Alfonso, so the regex precision is human-judged?
   Recommended: no before 2026-10-20; regex precision is a method detail, the 71 + 30 rows carry the paper's numbers.
3. Should the public artifact keep prompt and chat ids while the repository's visibility is unknown?
   Recommended: check the visibility before submission; if public, remap ids and shift timestamps (`anonymization.md` R1) with one more pass of `build_replication.ts`.
4. Should hook denials also be read from the local interactive transcripts, outside the lane folders?
   Recommended: no; state the scope (lane-runner sessions from 2026-09-27) and report attempts on that window only.
5. Should the 2-day RC-25 window stay the paper's operationalisation?
   Recommended: no; report the acknowledgement latency as the measure and the window only with its sensitivity line (`threats.md` C4).
6. Which RC-26 count does the paper's claim rest on: 34 by marker, 24 without header-cited delegations, or 13 with no prior act?
   Recommended: the 13 (neither delegation nor any act of Alfonso before the trunk), with 34 and 24 as the upper readings, after his review.
7. Should the two 1630 artefacts (§5.3) be fixed in `governance-dataset.ts`?
   Recommended: yes, in a later research lane before the camera-ready dataset; until then `detection-evidence.json` carries the correction.

## 14. Gate 2026-10-20

Today, 2026-10-11, at ref `154311f55`:

- **RQ1: answered quantitatively.** `Model:` 0.037 (n 991) on the hook path against 0.547 (411) for the chat and
  0.875 (32) without the hook in tree; subject 0.019 against 0.236; `Front:` 0 of 17 launched without it against
  `Request:` 28 of 64; the gradient holds from 09-26 (0.51 → 0.55). Missing: intervals clustered by lane (K2) and
  the "who writes the line" column (question 1); neither needs new data.
- **RQ2: answered for RC-25 and RC-18, pending for RC-26.** Final: 77 of 105 provisional rows late (0.73; 0.73 to
  0.78 for 1 to 5 days), 75 of 209 outstanding on 10-10, RC-18 over on 10-10 and never measured as written, 38 of
  77 late rows seen within hours. **Waiting for Alfonso's review of `review/rc26_review.md`:** the RC-26 positives
  (71), the crossings (34 by marker, 24 without delegation, 13 with no prior act), the share that did not wait
  (0.48; 0.39 strict) and the agent's precision; `rc26_apply_review.ts` recomputes them into
  `data/rc26_reviewed.csv`. The 22 of 34 noticed at the time depends on the curated evidence, not on his review.
- **RQ3: answered quantitatively.** 133 of 138 repairs in one merge; detection a median 7.0 days after the failure
  (62 grammar failures) and 8.9 days (39 late rows) when only the research line noticed, against hours when the
  check travelled with the prompt (2 failures); 11.5 days with no mention of the failing generator. Missing: one
  sentence on the observer effect (I2), since the research line produced most first notices.

If Alfonso's review lands before 2026-10-20, all three RQs have their numbers and the full paper holds; if not, RQ2
rests on RC-25 and RC-18 with the RC-26 agent numbers as a stated lower-confidence reading.
