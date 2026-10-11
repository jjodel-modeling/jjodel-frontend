# Replication package: governance drift in an agentic coding harness

This folder holds the data behind the paper's tables, as CSV files. It describes one software project, built
over several weeks by AI coding agents run by a harness (a lane runner, tool hooks, launch checks, document
gates) under one human maintainer, with the rules written in a decision register and a protocol. The data were
taken from the project's git history and from the transcripts of the agent sessions. They are anonymized:
see "What was removed and why" at the end.

All times are local wall-clock times on one machine, the same clock as the prompt ids `P-YYYY-MM-DD-HHmm` and chat
ids `C-YYYY-MM-DD-HHmm`. A "day" is a local calendar day. Commit ids are pseudonymous (see below).

## Vocabulary

- **Lane**: one agent session (or a sequence of resumed sessions) executing one prompt, identified by its
  Prompt-ID `P-…`, usually on its own branch and worktree.
- **Chat**: the project chat, a long-running assistant conversation that drafts prompts, launches lanes, merges
  them and writes checkpoints, identified by `C-…`.
- **Lane runner**: the script that launches lanes and merges them; it also writes commits itself, from templates.
- **Register**: the decision register, one row per decision, `RC-n` (harness rules), `R-<SERIES>-n` (product
  decisions), `D-…` (older series). A row header is `- **<id>** (<date>, <fields>): <text>`.
- **Origin of a commit** (heuristic): `lane-runner` when the subject is one of the lane runner's two templates;
  `chat` when the body carries the chat's session trailer or the subject adds prompts, checkpoints or status flips;
  `lane-or-local` otherwise (lane sessions and local interactive sessions together).
- **Hook in tree**: the commit's tree carries the tool hook that blocks commits without the `Model:` trailer, with a
  subject over 72 characters, or mixing docs and code (the commit descends from the commit that added the hook).
- **The cut**: the merge that ratified 76 register rows and repaired 59 row headers in one pass, 2026-10-11 16:01.
  Every series ends just before it; the cut is reported as an intervention. Its pseudonymous id is the
  `repaired_commit` of the 59 grammar episodes with `repaired_by_intervention = yes` in `rq3_detection_repair.csv`.
- **The maintainer** (M): the one human decider. Rules RC-21, RC-25 and RC-26 name the decisions that wait for the maintainer.

## Commit ids

Every commit id is `HMAC-SHA256(key, <full 40-hex id>)`, first 12 hex characters. The same commit has the same
pseudonym in every file, so joins across files work. The key is private and will be released at camera-ready;
with it and the repository, every pseudonym can be checked.

## Files

### Dataset of the first analysis (rule timeline, register, series)

**`decisions.csv`**: one row per register row (582) at the dataset ref.
`id`, `id_token`, `series`: the decision id, its first token, its series prefix. `line`: line in the register.
`section_id`: the register section (`S01`.. in order of appearance; headings removed). `leading_dash`: the row opens
with `- ` (the digest generator reads only those). `header_date`: date in the header. `intro_commit`, `intro_time`:
the oldest commit holding the row; `intro_prompt_id`: the Prompt-ID of that commit. `trunk_commit`, `trunk_time`:
the oldest trunk (first-parent) commit holding it. `intro_author`: pseudonym of the commit author (M for all rows:
every agent commits under the maintainer's identity). `adopting_chat`, `chat_source` (`row`, `section`, `prompt`):
the chat that adopted the row, and where its id was found. `adopter_by_marker`: who adopted, by the status marker.
`status_at_intro`: `provisional`, `provisional-awaiting` (says it awaits the maintainer), `ratified-maintainer`,
`ratified-section` (bare date in a section ratified by the maintainer), `ratified-as-recommended`, `chat-decided`
(including decisions under the maintainer's delegation), `unmarked`, `other`. `evidence_at_intro`,
`verified_at_intro`, `reversible_at_intro`: the three keyed header fields, as first written. `status_now`: the status
at the ref. `ratification_commit`, `ratification_time`: first trunk commit where the status turned ratified after a
non-ratified one; `ratification_marker_date`: the date in the marker; `latency_days`: header date to ratification.
`status_path_on_trunk`: `date:status > …`. `text_amendments`, `amendment_commits`: trunk commits where the row's
text changed. `title_vs_intro`: the row's title changed since introduction. `parser_now`, `parser_first_failure`:
the digest generator's verdict on the header today and at its first failure (`parsed`, `invisible-dash`,
`invisible-id`, `free-text-in-provisional`, `multiline-header`, `separator`, `keys-partial`, `outside-vocabulary`).
`rc26_rule_classes`: RC-26 classes matched by the regexes. `rc26_hand`: the agent's verdict (`tp`, `fp` for regex
candidates; `tn`, `fn` for the 30 sampled negatives). `rc26_window`: row dated 2026-09-26 or later. `waited`: the
status at introduction is one that waited for the maintainer. `rc26_crossing`: in an RC-26 class (agent), in the
window, and did not wait.

**`conformance_daily.csv`**: the register parsed by the digest generator at the last trunk commit of each day from
2026-09-26, plus one snapshot just before the cut (`snapshot`). Counts of rows (`rows_lenient`, `rows_parsed`,
`rows_failing`, `fail_<kind>`, `invisible_*`), provisional rows, `docs_digest_exit` (0 parses, 2 fails), the rows
written since 2026-09-26 and how many of them parse, fail or are invisible, and `provisional_older_than_2d`.

**`conformance_failures.csv`**: one row per row header that was ever non-conforming (245): `kind`, `first_commit`,
`first_time`, `first_on` (`trunk` or `branch`), `prompt_id`, `chat`, `author` (pseudonym), `at_row_intro` (wrong from
the row's first commit), `row_header_date`, `fixed_commit`, `fixed_time` (first trunk commit where it parses),
`state_now`.

**`rc18_daily.csv`**: RC-18 (at most one lane in four may be harness-only) over a 7-day window ending each day:
`code_lanes`, `harness_only_lanes`, `share`, the variant counting the governance files as harness, the verdict
against 0.25, and code commits that carry no lane id.

**`autonomy_weekly.csv`**: per week of the Prompt-ID, lanes, asks (a run ending with a question or carrying a
`Recommended:` line), how they were answered when resumed (`adopted_by_chat`, `maintainer`, `overturned`,
`bare_go`, `other`), `not_resumed`, and `maintainer_share_of_answered`.

**`rules.csv`**: 33 rules with their check: `category` (`block-auto`, `block-manual`, `warn`, `report`, `none`),
`checks` (`form` or content), `check_scope`, `enforced_by` (harness path, covered), `enforcement_mode`,
`wired_into`, rule and check dates and commits, `check_lag_days`, the series that measure it and their rates,
and `violation_measure` (how a violation is counted). The evidence column (file:line quotes) was removed.

**`violations_daily.csv`** and **`comparison.csv`**: per rule series and day, `opportunities`, `violations`,
`rate`, and `period` (`before` the rule, `text-only` while it had no check, `checked`); and the per-series summary
over the text-only period, the checked period, the last 7 days and the peak day, with
`violations_repaired_at_ref` for prompt header lines.

### RQ tables

**`rq1_check_position.csv`** (RQ1, checkable rules): one row per rule, check position, commit path and window.
`rule`, `rule_ref`; `check_position` and `position_rank` (1 `hook-on-commit`, 2 `blocking-at-launch`,
3 `warning-only`, 4 `report-only`, 5 `no-check`, 6 `check-exists-not-run`); `enforced_by` (harness path or
`none`); `path` (`lane`, `chat`, `lane-runner`) and `path_detail`; `unit`; `window` (`to-cut`: from the first full
day of the hook, 2026-09-22, or the rule's start, to the cut; `from-2026-09-26-to-cut`: the same from the day the
judgment rules started) with `window_from`, `window_to`; `n`, `violations`, `rate`; for lane rows the same counts
on commits that carry a lane id (`n_with_lane_id`, `violations_with_lane_id`); for the hook rows, the denials of
the hook found in lane transcripts (`blocked_at_check`), how many were followed by a successful commit in the same
session, and the median seconds to it; `repaired_before_cut` and `repaired_median_latency_s` (seconds; a later commit
added the missing line, or the header came to parse), `repaired_at_or_after_cut`, `open_at_ref`; for prompts,
`launched_while_violating` (`k/m`: m prompts of the row were launched before the cut, k of them with the line still
missing in the text the lane received); `note`. Commit messages cannot be repaired once committed.

**`rq2_judgment.csv`** (RQ2, judgment rules RC-26, RC-25, RC-18): `record = day` rows give, per rule and day,
`opportunities`, `violations`, `rate` (and `verdict` for RC-18), with `period` `series` (up to 2026-10-10) or
`intervention` (2026-10-11). `record = crossing` rows give one RC-26 crossing, one RC-25 row acknowledged late or
never, or one RC-18 day over budget: `item`, `status_at_intro`, `delegation_cited`, `noticed_by` (`digest`,
`lane-report`, `chat`, `maintainer`, `never`), `noticed_as` (`rc26`: flagged as a decision that needed the
maintainer; `provisional`: seen as a provisional row in a ratification; `delegation`; `budget`; `none`),
`noticed_date`, `notice_latency_days` (from the row's first commit, or the end of the day over budget),
`research_line` (`yes` when the noticing artifact was produced by this research), `evidence` (pseudonymous commit
and register or document location, paraphrased), `note`.

**`rq3_detection_repair.csv`** (RQ3, detection and repair): one row per drift episode: every non-conforming row
header (`family = grammar`; `in_grammar_window = no` for rows written before the grammar existed), every
provisional row acknowledged late or never (`rc25-late`), every RC-18 day over budget (`rc18-over`).
`introduced_date`, `introduced_commit`, `introduced_chat`, `introduced_on`; `detected_date`, `detected_by`,
`detected_by_research_line`, `detection_evidence`; `repaired_date`, `repaired_commit`, `repaired_by_intervention`;
`latency_intro_to_detect_days`, `latency_detect_to_repair_days`; `repair_batch` (`yes` when the repairing commit
or merge repaired more than 10 episodes) and `repairs_in_that_commit`; `state_at_ref`; `note`.

**`rc26_reviewed.csv`**: the RC-26 numbers recomputed from the maintainer's review of the 71 positives and 30
sampled negatives: per metric, the agent's estimate, the reviewed rows only, and the combination (the
maintainer's verdict where given, the agent's elsewhere). Until the review is done, `reviewed` is empty and
`combined` equals `agent`.

## How the paper's numbers derive from the files

Every number below is a sum or a ratio over rows of one file, with the filter shown.

**RQ1** (`rq1_check_position.csv`, `window = to-cut` unless stated):
- `Model:` trailer missing: `rule = Model: trailer`; hook path (`check_position = hook-on-commit`) 37 of 991
  (0.037); `path = chat` 225 of 411 (0.547); `path = lane`, `path_detail = tree lacks the hook` 28 of 32 (0.875);
  `path = lane-runner` 14 of 377. On lane-attributed commits: `violations_with_lane_id / n_with_lane_id` = 23 / 920.
- Subject over 72: same filters on `rule = subject <= 72 characters`: 19 of 991, 97 of 411, 3 of 32, 216 of 377.
- Hook refusals: `blocked_at_check` 17 (`Model:`), 30 (subject), 5 (docs and code), with
  `blocked_then_committed` and `blocked_to_commit_median_s`.
- Launch checks: `launched_while_violating` 0/17 for the `Front:` line, 28/64 for `Request:`.
- Period confound: the same rows with `window = from-2026-09-26-to-cut` (e.g. `Model:`, chat 213 of 359).
- Row grammar: `rule = decision-row header grammar`, `violations` summed over paths: 66 of 226;
  `repaired_before_cut` 5, `repaired_at_or_after_cut` 59.

**RQ2** (`rq2_judgment.csv`):
- RC-26: `record = day`, `rule = RC-26 waits for the maintainer`, `period = series`: sum of `violations` 34, of
  `opportunities` 71. `record = crossing` rows of the same rule: 34; with `delegation_cited = no`: 24; with
  `first_act` `none` or `delegation-partial`: 13; with `notice_latency_days <= 0`: 22; by `noticed_by` and
  `research_line`.
- RC-25: `record = day`, `rule = RC-25 provisional row acknowledged within 2 days`, `period = series`: 77 of 105;
  the snapshot rule gives 75 of 209 on 2026-10-10 and 75 of 226 / 1 of 226 on the intervention day.
- RC-18: `record = day`, `rule = RC-18 harness budget`: `verdict = over` on 2026-10-10 (0.327) and 2026-10-11.

**RQ3** (`rq3_detection_repair.csv`):
- Grammar failures since the grammar: `family = grammar`, `in_grammar_window = yes`: 67; `detected_by_research_line
  = yes`: 62; `repaired_by_intervention = yes`: 59; medians of `latency_intro_to_detect_days` (7.0) and
  `latency_detect_to_repair_days` over those 62.
- Late acknowledgements: `family = rc25-late`: 77, of which 74 with `repaired_by_intervention = yes`.
- Batch: among rows with a `repaired_commit` (excluding `in_grammar_window = no`), 138 repairs; the commit with
  `repairs_in_that_commit = 133` is the cut.

**RC-26 after review** (`rc26_reviewed.csv`): `metric = crossings_with_delegated` (34), `crossings_strict` (24),
`crossings_no_prior_act` (13), the shares and precisions, in the `agent`, `reviewed` and `combined` columns.

**The first analysis** (`comparison.csv`, `violations_daily.csv`, `decisions.csv`, `conformance_*.csv`,
`rc18_daily.csv`, `autonomy_weekly.csv`): the rates per rule and period are the `*_n`, `*_violations` and `*_rate`
columns of `comparison.csv`; ratifications and their latency come from `decisions.csv` (`ratification_commit`,
`latency_days`); the grammar series from `conformance_daily.csv` (`since_grammar_failing`,
`since_grammar_invisible`, `docs_digest_exit`).

## What was removed and why

- **Commit ids** are replaced by keyed pseudonyms (above): an id is a search key into the project's repository.
- **Names of people** (the maintainer, the co-maintainer, other commit authors, external testers) are replaced by
  pseudonyms (`M`, `C1`, `D1`..) or by "the maintainer"; e-mail addresses are dropped.
- **Names of the project, its languages and its assistant**, the conference whose demo several rules protect, the
  hosting organisation and every local path or branch name that contains them are replaced by neutral covers
  (`MTool`, `EL`, `TL`, `SL`, `OM`, the assistant, `<CONF>`, `<org>`, `<MAIN>`, `<WT>`, `<LANES>`, `trunk`).
  Harness file paths are rewritten under `harness/`, `rules/`, `log/`.
- **Free text** that quoted the register or the maintainer verbatim is dropped: the row headers as written
  (their keyed fields are kept as columns), the agent's notes on RC-26 rows, the register's section headings (kept
  as `S01`..), and the `file:line` code quotes of `rules.csv`. Most of the register is in one natural language;
  a verbatim quote is a full-text search key and a language signal.
- **Session identifiers** of the chat and of agent sessions are dropped; prompt and chat ids are kept: they are
  timestamps, not accounts.
- **Lane transcripts** are not shipped: they embed paths, session ids and e-mail addresses. The quantities derived
  from them (hook denials, prompts as launched, autonomy) are in the CSVs.

A check script scanned this folder for every identifying string of the authors' anonymization map (names,
product tokens, organisation, affiliation domains, paths, branches, session and e-mail shapes, words of the
register's language) and for every hexadecimal token that matches a real commit of the repository: it reported
zero hits.
