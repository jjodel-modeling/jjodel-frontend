# Discovery: harness health signals, catalogue and retrospective backtest

Prompt-ID: P-2026-10-18-2220
Chat: C-2026-10-18-2220
Session: ef8b1efd-8d14-4898-968b-02c352db940e
Prompt: `docs/prompts/claude_2026-10-18_2220_prompt_harness_health_retrospective.md`
Script: `docs/discovery/harness/harness-health-retro.mjs`
Data: `docs/discovery/harness/harness-health-retro/`

## 1. Incidents, frozen before any signal was computed

Frozen at 2026-10-18 on branch `health-disc`, in a commit that holds this section only; the git order is the proof
that no signal was computed when the list was written. This section is not edited afterwards: corrections go in a
dated addendum below it. The script reads the table below from that commit (`--incidents-ref`).

Before the freeze, two aggregate counts were taken for the data inventory only, with no weekly series and no
threshold: 1950 log headings (148 tickets), 191 task entries with `Corregge` filled, 276 with a `Causa` letter. No
signal value was looked at.

Sources: two read-only explorer passes over `docs/sessioni/`, `docs/archivio/triage_kb_*.md`, `docs/decisions.md`,
`docs/ratifiche/`, `docs/discovery/`, the log, its archive and the inboxes, git history, and the lane folders. Dates
are author dates, +0200. `Started` is the first datable moment of the defect, `Noticed` the first source that
reports it. Classes: execution, harness weight, governance hygiene, coordination, cost. Rows marked *seed* come from
the prompt; the others were found while dating the seeds.

| Id | What | Started | Noticed | Class | Sources |
|---|---|---|---|---|---|
| I01 | *seed* Log rotation threshold of 20 entries, written 2026-05-22, never applied: the first rotation found 660 entries | 2026-05-22 | 2026-07-31 | governance hygiene | `afffa9142` (threshold in CLAUDE.md §21), `b05e50364` (copied to P9), `7cf864839` (first rotation, 660 to 20) |
| I02 | *seed* Rotation stalled again against the same threshold (25 entries on 08-04, 32 on 08-14), until it was raised to 40 | 2026-08-04 | 2026-08-14 | governance hygiene | `docs/sessioni/claude_sessione_2026-08-04.md:56`, `docs/sessioni/claude_sessione_2026-08-14_2.md:117`, `docs/sessioni/claude_sessione_2026-08-14_3.md:124`; fix `461dba3e6` (2026-08-18) |
| I03 | Task 1.2 issued twice by two chats eleven minutes apart | 2026-08-05 | 2026-08-05 | coordination | `docs/ratifiche/claude_ratifiche_2026-08-05_2_emendamento_strada_B.md:85` |
| I04 | *seed* CLAUDE.md §17 typecheck baseline 33 against 14 real errors (19 casing errors of one macOS checkout); first reported 08-10, corrected in CLAUDE.md only on 09-24 | 2026-08-07 | 2026-08-10 | governance hygiene | `a6058b805` (33 written), `docs/sessioni/claude_sessione_2026-08-10.md:84`, `docs/discovery/discovery_2026-09-24_harness_gate.md:22`, fix `81fd7eda5` |
| I05 | *seed* Knowledge base at 339 documents (from about 280 on 08-09), 257 of them already archived; retrieval returned stale generations of the same decision | 2026-08-09 | 2026-08-14 | harness weight | `docs/archivio/triage_kb_2026-08-09.md:3`, `docs/archivio/triage_kb_2026-08-15.md:5,14,29`, `e14c2b17d`, `c2d00cba6`, P10 |
| I06 | Rotation rule read by file position while a concurrent session had appended the newest entry at the bottom; it would have archived the newest entry silently | 2026-08-13 | 2026-08-13 | governance hygiene | `docs/decisions.md:962` (R-RAIL-45), `193a1a96b` |
| I07 | A merge re-imported 450 rotated log entries into the active log | 2026-08-24 | 2026-08-28 | governance hygiene | `70e920492` (merge), `ced6a21ba` (drop) |
| I08 | A Phase 2 GO pasted into the wrong session, with an unwritten scope change | 2026-09-17 | 2026-09-18 | coordination | `docs/sessioni/sessione_2026-09-18.md:15` |
| I09 | *seed* Phase 2 file of P-2026-09-18-2219 never saved to `docs/prompts/` (executed from chat text, commits `400095370`..`20ddf067e`) | 2026-09-18 | 2026-09-21 | execution | `docs/sessioni/sessione_2026-09-21.md:91-93,296,329`, `docs/sessioni/sessione_2026-09-21_2.md:161` |
| I10 | *seed* Two chats wrote prompts for the same gate (1745 against 1735, 1730, 1740); `e9e536ace` overwrote 1740, `8b3a21b13` restored it | 2026-09-19 | 2026-09-19 | coordination | `7bdf5f638`, `e9e536ace`, `8b3a21b13`, `docs/sessioni/sessione_2026-09-21.md:228-241` |
| I11 | Prompt 1835 of 2026-09-19 never saved, rewritten | 2026-09-19 | 2026-09-23 | execution | `docs/sessioni/sessione_2026-09-23.md:160-161` |
| I12 | Prompt P-2026-09-22-2105 written without a `Status` line, first P13 violation since 2026-09-21 | 2026-09-22 | 2026-09-23 | governance hygiene | `docs/sessioni/sessione_2026-09-23.md:199-201`, fix `9d560a73d` |
| I13 | *seed* False visual ACK of P-2026-09-22-2105: checks 1, 2 and 4 reported passing on a «fatto tutto ok» that referred to the procedure; they had not run | 2026-09-23 | 2026-09-24 | execution | `b15a16201` (claim), `162bc4c5b`, `fe8a957f3`, `docs/discovery/discovery_2026-09-25_cost_per_feature.md:70`; RC-17 followed |
| I14 | Model pin said Opus 5 while sessions ran Opus 5.5 by `/model` since 2026-09-23 16:05 | 2026-09-23 | 2026-09-24 | governance hygiene | `docs/decisions.md:110-117` (RC-16), `docs/sessioni/sessione_2026-09-24.md:166` |
| I15 | A prompt pasted into the wrong session (stopped by the Prompt-ID guard) and sessions born in the wrong worktree | 2026-09-24 | 2026-09-24 | coordination | `docs/sessioni/sessione_2026-09-24.md:163-165` |
| I16 | A test harness printed ALL GREEN over failures (`failures += await run()`); the 1850 harness hid failures | 2026-09-24 | 2026-09-24 | execution | `docs/sessioni/sessione_2026-09-24.md:152`, `CLAUDE.md` §17 (`check:scripts`) |
| I17 | Two chats wrote the merge of the same lane (prompts 1340 and 1550) | 2026-09-26 | 2026-09-26 | coordination | `docs/sessioni/sessione_2026-09-26.md:29` |
| I18 | A second project chat adopted the id `C-2026-09-27-1428`; `lane-run` guards Prompt-IDs and worktrees, not chats | 2026-09-27 | 2026-09-27 | coordination | `docs/sessioni/sessione_2026-09-27_4.md:15,73` |
| I19 | No log entry since 2026-10-05 filled `Corregge`, so rework was invisible to the board | 2026-10-05 | 2026-10-10 | governance hygiene | `docs/decisions.md` RC-45 (2) |
| I20 | *seed* Petri discovery P-2026-10-10-1020 ran 116 min 11 s against the 90-minute limit of RC-20; no source flagged it before this prompt (the 10-11 board listed it as hard-stop with no duration) | 2026-10-10 | 2026-10-18 | execution | lane folder `~/.jjodel-lanes/P-2026-10-10-1020/` (`input-1.md` 10:20:17, `exit.txt` 12:16:28), `docs/discovery/discovery_2026-10-11_insights_more_cards.md:319` |
| I21 | Architect chat `C-2026-10-17-1757` at 641k tokens of context per call, 55M input tokens against 3M to 8M per executor lane | 2026-10-17 | 2026-10-18 | cost | `docs/decisions.md` RC-50 (`cfab9b74b`) |
| I22 | *seed* Two chats on the harness front: `C-2026-10-18-2125` still acting at 22:07 (merge `fe8cc637d`) when `C-2026-10-18-2220` emitted P-2026-10-18-2220 | 2026-10-18 | 2026-10-18 | coordination | `docs/prompts/claude_2026-10-18_2125_prompt_b8c_context_rules.md:4-5` (`1904076ef`), `docs/prompts/claude_2026-10-18_2220_prompt_harness_health_retrospective.md:4-5` (`e49ec777e`) |

Notes on the seeds, from the sources:
- I01 and I02 split the seed «rotation threshold never matching practice»: the defect was noticed once at the first
  rotation and again when the rotation stalled; the threshold was raised to 40 by `461dba3e6` on 2026-08-18, and
  HARNESS-DOCS still said 20 afterwards (`docs/sessioni/claude_sessione_2026-08-18_2.md:78`).
- I05: the start is the first source with a count (about 280 on 2026-08-09); the growth is not datable more finely.
- I10: the «one chat per front» rule of 2026-09-19 is a lesson in the 09-21 checkpoint, not a decision row; the
  formal rule is RC-33 (2026-09-28) and the `Chat:` line.
- I13: the seed dated it 2026-09-22/24; the prompt is of 09-22, the claim of 09-23, the detection of 09-24.
- I20: the only seed whose `Noticed` is not datable from an earlier source; 2026-10-18 is the date of this prompt,
  so any lead time on I20 is an upper bound.
- Seven of the eight seeds are dated from the sources; the hard stop for undatable seeds does not apply.

### 1.1 Addendum, 2026-10-18, after the signals ran (not ground truth)

The signals surfaced four events that §1 does not list. They are recorded here so they are not lost. They were
found by the signals, so they are **not** used to score them: the backtest of §3 runs on I01 to I22 only.

| Id | What | Date | Found by | Source |
|---|---|---|---|---|
| A1 | Chats `C-2026-10-10-0840` and `C-2026-10-10-1145` alternated on the harness front, eight interleavings within 2026-10-11 (gaps 0.03 to 1.95 h) | 2026-10-11 | S5 | `harness-health-retro/s5_front_switches.csv` rows of 2026-10-11 |
| A2 | Seven-day plan utilization at 0.99 to 1.0 on 2026-09-28/29 and 2026-10-14/16; no lane spend on 10-07..10-09 and 10-13 | 2026-09-29, 2026-10-14 | S6u | `daily.csv`, columns `spendUsd`, `sevenDayUtilMax` |
| A3 | Nine lanes with a turn over the 90-minute limit of RC-20 between 09-27 and 10-11, seven of them discoveries; I20 is one of the nine, and none of the others is reported anywhere | 2026-09-27..10-11 | S2t | `lanes.csv`, `overTime` = 1 |
| A4 | Six prompts still `da eseguire` at `e49ec777e` more than a day after their lane closed: P-2026-10-10-0830, P-2026-10-11-1830, P-2026-10-11-2235, P-2026-10-12-0120, P-2026-10-14-1955, P-2026-10-15-1710 | 2026-10-11..10-18 | S4d | `docs/prompts/` at `e49ec777e` |

A4 is measured on the trunk at `e49ec777e`. A flip committed on a lane branch that was never merged counts as
stale here, which is how the trunk sees it.

## 0. Hypothesis, objective, method

**Hypothesis under test.** Every signal of the prompt (S1 to S6) is checked the same way. Recomputed on the
history, it should have fired at least once inside the 21 days before a known incident of its class was
noticed. It should also not fire all the time in quiet weeks.

**Objective.** Build a catalogue of signals with thresholds for Phase 2. Each signal is kept, kept as diagnosis
only, or dropped. Instantaneous health is the worst signal; the trend is per signal over a rolling 4-week window.
There is no composite index.

**Method.** The script `docs/discovery/harness/harness-health-retro.mjs` reads three sources:
- the git objects at `e49ec777e`;
- the lane folders that closed before 2026-10-18 22:20:12;
- the incident table of §1 at the freeze commit `10ac68007`.

It writes eleven CSV files to `docs/discovery/harness/harness-health-retro/` (98,136 bytes, so no
`~/.jjodel-lanes/health/`). Two runs give identical bytes. So does a run from a clean temporary checkout of
`e1bc1ace7`, which left the tree clean. The combined sha256 is
`cee3fd3d449f9ebe05e1109ff95289b3bd8af3f5c37bf41b4e623f7e9a1cbe89`. Command, from the repo root:

    node docs/discovery/harness/harness-health-retro.mjs [--ref e49ec777e] [--cutoff 2026-10-18T22:20:12+02:00]

**Backtest rules.** All of them are coded in the script.
- **Weeks.** The series is weekly, ISO weeks W31 (2026-07-27) to W42 (2026-10-18). Rolling 4-week values are
  ratios of sums over the weeks that are defined. An undefined week adds nothing and is never imputed.
- **When a signal fires.** A signal fires at the end of a week whose value is above its threshold.
- **Caught.** A fire catches an incident when the fire date falls in [noticed − 21 d, noticed]. The lead time
  runs from the first such fire to the date the incident was noticed.
- **Target classes.** Each signal has target classes. Its quiet weeks are the weeks that do not overlap
  [noticed − 21 d, noticed + 7 d] of any incident of those classes.
- **Thresholds.** Where a ratified rule fixes a threshold, the rule is used and never tuned: RC-20, RC-33,
  RC-51, P9 and P13. Otherwise the threshold is the maximum over the quiet weeks of 2026-08-01..09-30. If there
  is no quiet tuning week, it falls back to the 75th percentile of the tuning weeks, with at least three of them.
  October never sets a threshold.
- **Precision.** Precision is the share of fire weeks followed by a target incident within 21 days. It is
  compared with the base rate, the share of all defined weeks that are followed by one.

## 2. Data inventory

| Source | From | Gives | Cannot give |
|---|---|---|---|
| git history at `e49ec777e` | 2026-03 (log); `docs/decisions.md` from `061be4b5c` | Daily snapshots, last first-parent commit of each day: active log entry count and bytes (780 commits touching the log), `decisions.md` row ids and markers (345 commits), add dates and Status flips of 1017 prompt files | Branches and worktrees over time (only today's list); what happened in chat; side-branch commits are seen only once merged |
| Log `Corregge`/`Causa` | 2026-08-02 (CLAUDE.md §21.3); before that, only the outcome emoji | 1949 unique headings across the active log, the archive (4.9 MB, parsed by the script, never read) and 50 inboxes; 1801 task entries; `Causa` letters a to g | Whether an empty `Corregge` means "checked" or "not filled" before RC-45's sentinel (2026-10-10) |
| Prompt headers | `Chat:` on 625 prompts, `Lane:` on 613, `Front:` only from 2026-10-10 (78 prompts), `Corregge:` on 22 | Kind (merge, discovery, fast, full), front, chat, add date, flip date | Front before 2026-10-10, so S5 is undefined in the whole tuning period |
| Lane folders `~/.jjodel-lanes/P-*` | 2026-09-26 (RC-20), wk39 | 545 folders: 375 with model calls and closed before the cutoff (166 direct merges have none, 3 were running, 1 closed after the cutoff). Per-call context, first call split into `cache_read` and `cache_creation + input`, peak, per-turn `duration_ms`, `Outcome:` lines, `total_cost_usd` (cumulative over resumes, so taken as deltas), seven-day utilization readings, resume inputs classified with the lane-board rules | Anything before 2026-09-26. Architect cost, which is in only 20 `architect.json` files. Interactive sessions. A lane resumed after the cutoff would change its log |
| `lane-usage.mjs` | wk39 | Same per-call reading (`frontend/scripts/lane-usage.mjs:78-88`); the script re-reads the logs with the same dedupe by `message.id` | — |
| KB counts | 2026-08-09, 2026-08-14 (two triage files) | Two points (about 280, then 339) | A series; the KB lives outside git, so S4 has no KB term |

The tuning period has lane data for one week only (W39, 2026-09-26/27). Every lane-based signal (S1b, S2, S3,
S6) is therefore undefined, or defined on a single point, where thresholds would be tuned. This is the main
limit of the backtest, and it follows from HARNESS-DOCS §9: no back-filling.

**Regime changes on the axis.**
- **Log format.**
  - 2026-08-02: `Corregge`/`Causa` fields.
  - 2026-08-18: rotation threshold 20 → 40, and the Notes cap.
  - 2026-09-24: the ticket entry type.
  - 2026-10-10/11: RC-45 sentinel and the rule that `Corregge` is always filled.
- **Model.**
  - 2026-09-21: RC-15 pin, Opus 5.
  - 2026-09-23 16:05: Opus 5.5 in Claude Code sessions; pinned by RC-16 on 09-25.
  - 2026-09-28: RC-32 light tier, Sonnet 5 and then Sonnet 5.5.
  - 2026-10-10: RC-45 draws.
- **Orchestration.**
  - 2026-09-26: RC-20, the first lane folders.
  - 2026-10-10: the `Front:` header.
- **AM batches.**
  - 2026-10-16: RC-49 approval.
  - 2026-10-18: B7 registers `context-ceiling`; RC-50, RC-51 and RC-52.
- **Batch ratification.**
  - 2026-10-11: `c6804f3d3`, merge ratify-provisional.

## 3. Signals and backtest

Weekly values are in `signal_series.csv`, and the stratified tables in `weekly.csv` and
`lanes_by_week_kind_model.csv`. A star marks a fire.

| Signal | W32 | W33 | W34 | W35 | W36 | W37 | W38 | W39 | W40 | W41 | W42 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1a log rework share (4w) | .19 | .19 | .19 | .21 | .22* | .21* | .20 | .20 | .16 | .15 | .14 |
| S1b lanes with corrective resume (4w) | – | – | – | – | – | – | – | 0 | .03 | .04 | .04 |
| S2 unplanned stops / lanes (4w) | – | – | – | – | – | – | – | .13 | .09 | .08 | .07 |
| S2t lanes over 90 min (4w count) | – | – | – | – | – | – | – | 2* | 6* | 9* | 9* |
| S2c ceiling stops / lanes (4w) | – | – | – | – | – | – | – | 0 | 0 | 0 | .003 |
| S3a median first-call context | – | – | – | – | – | – | – | 46.1k | 46.3k | 47.9k | 49.0k |
| S3b non-merge lanes with peak ≥ 200k | – | – | – | – | – | – | – | 30* | 98* | 63* | 14* |
| S4a active log entries (max) | 42* | 49* | 58* | 559* | 44* | 42* | 44* | 40 | 42* | 40 | 40 |
| S4b RC cited, not registered (max) | 0 | 5 | 8* | 5 | 5 | 5 | 5 | 6* | 6* | 6* | 7* |
| S4c provisional rows waiting (max) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 20* | 59* | 60* | 0 |
| S4d stale prompts (max) | – | – | – | – | – | – | – | 0 | 0 | 1* | 6* |
| S5 front interleavings (4w) | – | – | – | – | – | – | – | – | – | 8* | 8* |
| S5b short front switches (4w) | – | – | – | – | – | – | – | – | – | 4 | 5 |
| S6 lane spend USD (4w) | – | – | – | – | – | – | – | 382 | 1819 | 2827 | 3028 |
| S6u seven-day utilization (max) | – | – | – | – | – | – | – | .85 | 1.0 | .90 | 1.0 |

W31 is left out of the table: S4a = 653 there, which is I01.

**Backtest.** The "Tuning" and "Evaluation" columns count target incidents caught out of target incidents
defined; the lead time of each catch is in brackets. The base rate in the last column is the share of weeks
followed by a target incident; its period comes first.

| Signal | Threshold (source) | Tuning 08-01..09-30 | Evaluation 10-01..10-18 | Fire weeks / defined | Base rate |
|---|---|---|---|---|---|
| S1a | 0.214 (p75 of tuning weeks; no quiet week) | 6/10 (I09 15 d, I11 17, I12 17, I13 18, I14 18, I16 18) | 0/2 (I19, I20 missed) | 2/11 | tune .875, eval 1.0 |
| S1b | none (one tuning week) | – | 0/1 | 0/4 | – |
| S2 | none | – | 0/2 | 0/4 | – |
| S2t | 0 (RC-20) | – | 2/2 (I20, I21; first fire 09-27, 21 d) | 4/4 | eval 1.0 |
| S2c | none | – | 0/1 | 0/4 | – |
| S3a | none | – | 0/1 | 0/4 | – |
| S3b | 0 (RC-51 soft) | – | 1/1 (I21, 21 d) | 4/4 | eval 1.0 |
| S4a | 20, then 40 from 08-18 (P9) | 7/7 (lead 8 to 19 d) | 1/1 (I19, 20 d) | 9/12 | tune .889, eval .333 |
| S4b | 5 (p75) | 1/6 (I07, 5 d) | 1/1 (I19, 13 d) | 5/12 | tune .889, eval .333 |
| S4c | 0 (p75; all tuning weeks 0 but W39) | 0/6 | 1/1 (I19, 13 d) | 3/11 | tune .875, eval .333 |
| S4d | 0 (P13 / RC-17) | – | 1/2 (I20, 7 d) | 2/4 | eval 1.0 |
| S5 | 0 (RC-33) | undefined (no `Front:`) | 1/1 (I22, 7 d) | 2/2 | eval 1.0 |
| S5b | none (window 0.65 h, see below) | undefined | 0/1 | 0/2 | – |
| S6, S6u | none | – | 0/1 (I21) | 0/4 | – |

No signal had a quiet week in the tuning period. Governance-hygiene incidents were noticed roughly weekly from
07-31 to 09-24 (I01, I02, I04, I06, I07, I12, I14). Execution incidents cluster on 09-21..09-24. The lane signals
start on 09-26, when the windows of I18 and then I19 to I22 already cover every week. The "false alarms in quiet
weeks" figure therefore cannot be measured for any signal, in either period. The only usable discrimination is
precision against the base rate, and in the evaluation it exists only for the governance signals, where the
base rate is .333.

**Per signal**
- **S1 rework.**
  - **S1a.** Fired on W36 and W37, 15 to 18 days ahead of the 09-21..09-24 cluster: six catches, with precision
    1.0 against a base rate of .875. In October it fell from .20 to .14 and caught nothing. Part of that fall is
    I19 itself: from 10-05 the `Corregge` field went unfilled, so the share drops when the field stops being
    filled. It works only on the tuning period and is not proposed. Causes by letter (`weekly.csv`): (a) and (c)
    dominate every week, (d) peaks in W35 and W40, (f) in W35.
  - **S1b.** The fix requests among resumes stay at 0 to 4% of non-merge lanes, out of 0, 5, 4 and 1 lanes.
- **S2 stops.**
  - **Breakdown.** Over the 375 lanes: 336 planned, 10 questions, 1 ceiling and 28 unplanned. The 28 split into
    9 with a turn over the time limit, whatever their closing line. The other 19 are: 9 with no parsable
    `Outcome:` line (1 of them with a non-zero exit), 5 closing `blocked`, and 5 closing `done` or `hard-stop`
    after a `blocked` turn.
  - **S2.** The unplanned share fell from 13% to 7%.
  - **S2t.** Its threshold is the rule itself, and it fired every week (2, 4, 3 and 0 lanes per week, rolling 2,
    6, 9, 9). It "catches" I20 only because it was already red from other breaches. It saw I20's own breach in
    W41 (week end 10-11), 7 days before anyone noticed it.
  - **S2c.** Defined from 10-18 only: the hook was registered that day.
- **S3 context.**
  - **First call.** About 46 to 49k tokens, rising 6% over four weeks. It splits into about 11.8k `cache_read`
    and 34 to 37k `cache_creation + input`. The cached part is the shared system prefix; CLAUDE.md, rules and the
    prompt arrive as creation.
  - **Prompt size.** The prompt bytes (`input1Bytes`, AM-5 injection included) are per lane in `lanes.csv`.
    Splitting the creation part into rules versus prompt needs a token count of the prompt that the logs do not
    carry. That split is left open, not estimated.
  - **Peak.** The median peak was 283k, 335k, 275k and 191k in W39 to W42. Before the RC-51 hook, most lanes
    passed 200k every week, so S3b fires continuously and only says that RC-51 was needed.
  - **Strata.** Medians by kind and model are in `lanes_by_week_kind_model.csv`. Sonnet appears from W40: 21 lanes
    in W40, 7 in W41 and 5 in W42. Most RC-45 draws fall in W41 and W42, so model and week are confounded.
- **S4 governance hygiene.**
  - **S4a.** Under the threshold in force it fired in 9 of 12 weeks: continuously until 08-18, which is I01 and
    I02 themselves, then on W35 (559 entries, I07, a week end after the notice) and W40 (42). It is the invariant
    behind `check:docs` D, not a forecast.
  - **S4b.** The constant 5 are RC-1, RC-2, RC-4, RC-5 and RC-6, which are cited from 2026-08-10 and were never
    written as rows. Registration lag elsewhere is 0 to 5 days (RC-35, RC-43 and RC-48 at 5 days, RC-49 at 3), in
    `rc_registration_lag.csv`. Its precision in the evaluation equals the base rate.
  - **S4c.** Provisional rows built up to 20 on 09-27, then 59 on 10-04 and 60 on 10-10. The batch ratification
    `c6804f3d3` (10-11) brought them to 0. It is a real RC-25 backlog measure; its only "catch" (I19) has no
    causal link.
  - **S4d.** 1 stale prompt on 10-11 and 6 on 10-18 (A4).
- **S5 coordination.**
  - **Data.** There are 33 front switches since 2026-10-10.
  - **S5.** Under RC-33 it is red on 10-11 (A1). It does not see I22: I22 is a new chat starting while the old
    one is still active, not an interleaving.
  - **Window, proposed from the data.** The median gap between two prompts of the same chat on the same front is
    0.65 h. I22's gap is 0.87 h, outside that window, so S5b misses it too. 10 of the 33 switches fall within
    0.65 h: 9 on 10-11 (harness and maintenance) and 1 on 10-18.
  - **Wider windows.** The two coordination incidents datable on prompts (I10 at minutes, I22 at 52 min) suggest
    a window of a few hours. With such a window, 10-18 alone holds seven switches on the harness front, most of
    them legitimate handovers under RC-50. A switch is ambiguous from prompts alone.
- **S6 cost.**
  - **Spend.** Lane spend peaked on 10-10/11 (488 and 398 USD at list price, a relative weight under RC-49 (1)).
  - **S6u.** Seven-day utilization hit 1.0 twice (A2), each time 2 to 3 days after a reading of 0.85 or more:
    09-27 then 09-29, and 10-11 then 10-14.
  - **I21.** The architect's cost cannot be seen in the lane logs, so neither signal can see I21.

## 4. Proposed catalogue

No signal passes the full criterion, which asks for a fire before an incident and silence in quiet weeks,
because no quiet weeks exist on this history. The proposal below says what each one is fit for.

**Kept as invariant breaks.** These turn red when the event happens. They are detection, not forecast, but they
detected earlier than people did.

| Signal | Red when | Evidence |
|---|---|---|
| S2t | any lane turn over its limit in the current week (RC-20) | 9 breaches, 1 of them noticed (I20, 8 days after) |
| S4a | active log above 40 entries (P9) | I01, I02 and I07 at the time they happened |
| S4d | a prompt `da eseguire` more than one day after its lane closed (P13 / RC-17) | A4 |
| S5 | an interleaving on a front (RC-33) | A1; no human report |

The instantaneous state is red if any of these is red, and yellow if a diagnosis signal crossed its line. At
2026-10-18 22:20 it would read **red, set by S4d**: six stale prompts. S5 and S2t are at 0 in W42 itself and red
only on the rolling window.

**Kept as diagnosis only.** These are trend lines, with no alarm.
- **S1a and S1b.** Rework share, by cause letter. A falling S1a needs a completeness check on `Corregge` first,
  because of I19.
- **S2.** Unplanned share, with the three stop values: planned, ceiling, unplanned.
- **S3a and S3b.** First-call context and peak, by kind and model. S3b becomes meaningful only after the RC-51
  hook (10-18).
- **S4b.** RC registration lag, with the five legacy ids excluded.
- **S4c.** Provisional rows waiting.
- **S6 and S6u.** Spend and plan utilization. S6u ≥ 0.85 is a candidate yellow line. It comes from A2, which was
  found after the freeze, so it is unvalidated.

**Dropped as alarms.**
- **S1a.** Its threshold works only on tuning.
- **S3b.** It fires continuously before RC-51.
- **S5b.** It has no tunable window and missed I22.

## 5. What the signals cannot see

- **Decisions that were wrong but well executed.** I04: 33 errors stood in CLAUDE.md for 48 days with every gate
  green. I14: the pin said Opus 5 while Opus 5.5 ran, and nothing broke. No count or ratio moves when a rule
  states a false fact.
- **Defects that pass every gate.** I13, the false visual ACK, and I16, the harness that printed ALL GREEN over
  failures, are failures of the gates themselves. A signal computed from the gates' outputs inherits their
  blindness.
- **Rules inconsistent with each other.**
  - I01: CLAUDE.md said 20 and practice held 660.
  - I02: HARNESS-DOCS still said 20 after `461dba3e6` set 40.
  - I06: a rule written by position contradicted the add-only order.
  None of these is an invariant any signal measures. S4a measures one rule against the data, not two rules
  against each other.
- **Chat-side events.** I08 and I15 (wrong session), I09 and I11 (prompts never saved) and I22 (concurrency) live
  in chats. Only their traces reach git.
- **Harness weight outside git.** The KB (I05) and the architect context (I21): neither has a series in the
  repository.

## 6. Phase 2 proposal

No Phase 2 code here.

1. **Governance first.** These rows are for the project chat to write under RC-25.
   - **Lane closing fields.** `Stop: planned | ceiling | unplanned`, and the declared time limit, in the lane
     closing (inbox entry or `result.json`), so S2 stops guessing from `Outcome:` and `duration_ms`.
   - **Front, chat and architect usage.** `Front:` and `Chat:` are required on every prompt, already partly
     enforced by `check:docs` E. Every chat writes `architect.json`, so S6 and I21-class cost are visible.
   - **Corregge completeness.** S1 is reported only when `Corregge` is filled on at least 95% of entries in the
     window, so I19 cannot read as health.
   - **Reading the health state.** «A chat opening a front reads the health state first and names the red
     signal in its first prompt.»
   - **S5 boundary.** Define a handover as "the previous chat wrote its checkpoint", so a switch is classifiable.
2. **`frontend/scripts/harness-health.mjs` on top of `lane-usage.mjs`.**
   - **Inputs.** The same readers as this script, which is the reference implementation, plus `laneUsage` for the
     per-call series.
   - **Signals.** The four invariant breaks of §4 and the diagnosis series.
   - **Output.** JSON with the worst state and the signal that set it, with no composite.
   - **Baseline.** Recompute this backtest every week with the thresholds frozen here, so October becomes the
     first true out-of-sample month.
3. **A Health tab and a banner on the lane board.** The banner shows the worst state and its signal. The tab
   shows one sparkline per signal over the rolling 4 weeks, with the §2 regime changes marked on the axis.

## 7. Files read, dependencies, risks, open questions

**Files read** (paths from the repo root unless absolute):
- **Code and data.**
  - `frontend/scripts/lane-usage.mjs` (whole).
  - `frontend/scripts/lane-board/lane-board.mjs:880-969`.
  - `/Users/alfonso/.jjodel-lanes/board/scratch/drift-2026-10-18.py` (whole, for method).
  - `/Users/alfonso/.jjodel-lanes/P-*/` (file inventory; logs parsed by the script).
- **Docs.**
  - `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` (headings).
  - `docs/decisions.md`, through `rg` and line windows only.
  - The log, the archive, `docs/log-inbox/*.md`, `docs/prompts/` and `docs/ratifiche/`, through the script and
    `rg` only.
- **Through the two explorer passes.**
  - `docs/sessioni/claude_sessione_2026-08-04.md`, `_08-10.md`, `_08-14_2.md`, `_08-14_3.md`, `_08-18_2.md`.
  - `docs/sessioni/sessione_2026-09-18.md`, `_09-21.md`, `_09-21_2.md`, `_09-23.md`, `_09-24.md`, `_09-26.md`,
    `_09-27_4.md`.
  - `docs/archivio/triage_kb_2026-08-09.md`, `triage_kb_2026-08-15.md`.
  - `docs/ratifiche/claude_ratifiche_2026-08-05_2_emendamento_strada_B.md`.
  - `docs/discovery/discovery_2026-09-24_harness_gate.md`, `discovery_2026-09-25_cost_per_feature.md`,
    `discovery_2026-10-11_insights_more_cards.md`.

**Dependencies.**
- The lane folders are outside git, so reproducing this needs `~/.jjodel-lanes` as it was at the cutoff.
- The classifier rules are copied from `lane-board.mjs:891`; if they change there, the two drift.

**Risks.**
- **Weekly granularity.** It makes lead times conservative by up to 6 days.
- **Margins.** The 21-day margin and the class assignment of each incident are choices; both are coded and
  stated.
- **Kind classification.** Kind comes from the `Lane:` line of the prompt whose `Prompt-ID:` matches the lane. 11
  lanes are `unknown` because no such prompt, or no `Lane:` line, is found at `e49ec777e`; P-2026-10-10-1020 is
  one of them.
- **Time limits.** Only the default 90 minutes is checked; a prompt that declares another limit would be
  misread.
- **Stale prompts.** A4 counts flips that are not yet merged as stale.

**Open questions.**
- **Prefix split (S3).** Separating rules from prompt inside `cache_creation` needs a per-lane token count of
  the prompt, not taken here.
- **Out-of-sample checks.** None of the thresholds has been checked out of sample. October is the evaluation
  period, but every signal of interest was red throughout it.
- **The 10-11 interleaving (A1).** Was it two chats by design, or a breach? The sources do not say.

**Decisions taken (unattended).**
- **Windows.** The 21-day lead and pre-incident margin, the 7-day post-notice margin and the 4-week rolling
  window.
- **Thresholds.** Rule thresholds over tuned ones wherever a ratified rule exists (RC-20, RC-33, RC-51, P9, P13).
  The fallback is the 75th percentile of the tuning weeks. The S5b window is the median same-chat cadence,
  0.65 h.
- **Incident list.** I01 and I02 split from one seed. I20's noticed date is set to the date of the prompt. A1 to
  A4 are kept out of the scoring.

**Decisions awaiting Alfonso.**
- None from the RC-26 list. The governance rows of §6.1 are proposals for the chat under RC-25.
