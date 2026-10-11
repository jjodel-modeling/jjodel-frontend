# Discovery: governance drift of the agentic harness, a dataset and first numbers for CAIN 2027

- Prompt-ID: P-2026-10-11-1630 · prompt `docs/prompts/claude_2026-10-11_1630_prompt_cain_governance_dataset_discovery.md`
- Session: `01FWUFsDDVN1SMB4MGco19GJ` (the session of the prompt's `Request:` line) · chat C-2026-10-10-1145 · lane auto
- Tree: `~/jjodel-w-caindata`, branch `cain-data`, HEAD `154311f55` (the trunk tip at the cut; the trunk had not moved
  when the data were taken). Executor: Claude Opus 5.5 (`claude-opus-5-5`).
- Every number below comes from `docs/research/cain-2027/scripts/governance-dataset.ts` run at `--ref 154311f55`,
  unless the line names another source. Read-only on the code: nothing under `frontend/` or `docs/decisions.md`
  changed.
- This report is a set of hypotheses with evidence, not a reference. Whoever builds on it rereads the real files.

## 0. Answer in brief

1. **The central claim holds only in a narrower form.** A blocking check keeps a rule near zero violations *on the
   path it runs on*, and the same rule drifts just outside it. The `Model:` trailer (P6) is missing on 3.7% of lane
   and local commits whose tree carries the hook, on 87.5% of those whose tree does not, and on 52.5% of the project
   chat's commits, which no hook sees (68.4% in the last 7 days). Subjects over 72 characters: 2.2% against 25.7%,
   and 57.3% for the commits `lane-run` writes itself.
2. **"Text only" is not the right cut.** A text-only header line written by a template holds (`Chat:` 0 of 183
   prompts missing). A warned one does not (`Request:` 29 of 66 missing, 1 repaired), while the blocking `Front:`
   misses were repaired within 36 s (2 of 2). What drifts are the rules that ask for a
   *judgment*: which class a decision is in (RC-26), whether it has been seen (RC-25), whether the week is over
   budget (RC-18). None of these has a check. Enforcement and "checks the form, not the content" coincide in 16 of
   the 18 auto-blocking rules, so the data cannot separate the two (§9, threat T6).
3. **The decision register drifted silently, then was repaired in one batch.** Since the grammar (2026-09-26), 67
   row headers were written outside it, 66 of them wrong from their first commit, by 12 chats. The digest generator
   failed on the register on 13 of 16 days, and nothing noticed, because no gate runs it. 59 of the 64 repairs landed
   in one merge (`c6804f3d3`, 2026-10-11).
4. **RC-25 never worked as written.** Of 106 rows written `provisional` since 2026-09-26, 97 were ratified later:
   20 on 2026-09-28, 76 on 2026-10-11, 1 in between. The median latency is 8 days. None was ratified "by digest",
   the mechanism RC-25 names.
5. **RC-26.** **71 of the 226 rows written since 2026-09-26 are in an RC-26 class. 34 of them (48%) did not wait
   for Alfonso:** 17 of 27 in the critical-zone class and 17 of 44 in the other classes. 10 of the 34 were taken
   under an explicit delegation from him. The regex alone is 0.63 precise, and 3 of 30 sampled negatives were
   positives, so 34 is a lower bound.
6. **RC-18 was within budget until 2026-10-09 and over it on 2026-10-10 and 2026-10-11** (0.327 and 0.396 against
   0.25). The verdict depends on how a commit is tied to a lane: 0.319 with the subject suffix alone. The chat's
   0.48 used a different window and source.
7. **Autonomy:** 0.31 to 0.41 asks per lane each week. When an ask is answered by a resume, the share Alfonso
   answered rose from 0.19 to 0.33 between the weeks of 09-28 and 10-05, on n = 31 and 21.

Decisions awaiting Alfonso (RC-26 list): none. Decisions taken (unattended): §10.

Questions (§11):
1. Is the paper's claim the narrow one of item 1? Recommended: yes, "a check holds a rule on the path it runs on; outside it, and for judgment rules, drift".
2. Should the 2026-10-11 ratification wave close the series? Recommended: yes, end the series at the snapshot before `c6804f3d3` and report 10-11 as the intervention.
3. Should the public artifact ship CSVs only? Recommended: yes, HMAC the shas and paraphrase every quote (`anonymization.md` §3).
4. Should RC-26 positives be judged by a second human? Recommended: yes, Alfonso reads the 71 positives before submission.
5. Should the lane folders be frozen? Recommended: yes, a tarball of the 2026-10-11 lane folders outside the repo.

## 1. Hypothesis under test and goal

- **H0 (the paper's claim):** drift concentrates in rules without mechanical enforcement.
- **H1:** the register's own rules (RC-25 grammar and acknowledgement, RC-26 waiting) drift over time, and the
  drift can be dated, attributed to a chat and counted per day.
- **H2:** RC-18's share can be computed daily from git alone.
- **H3:** the 1150 autonomy method gives a weekly series.
- Goal: the items of the prompt as CSVs with a method that regenerates them, plus the numbers for the paper.

| # | Hypothesis | Verdict | Where |
|---|---|---|---|
| H0 | drift concentrates in rules without enforcement | **partly**: holds by scope and for judgment rules; falsified as "text-only drifts" for template-written format rules | §8 |
| H1 | the register's rules drift, dated and attributable | **holds** | §3, §4, §5 |
| H2 | RC-18 daily from git | **holds**, with a sensitivity on lane attribution | §6 |
| H3 | autonomy weekly | **holds** for three weeks; the first is not pairable | §7 |

## 2. Sources and method

### 2.1 What was read

- `/Users/alfonso/jjodel-w-caindata/CLAUDE.md` (session context); `/Users/alfonso/jjodel-w-caindata/docs/PROTOCOL.md`
  whole; `/Users/alfonso/jjodel-w-caindata/docs/claude-code-log.md` lines 1–120;
  `/Users/alfonso/jjodel-w-caindata/docs/log-inbox/harness.md` lines 1–60.
- `/Users/alfonso/jjodel-w-caindata/docs/decisions.md` lines 1–292 by eye, and whole by the script, at every one of
  the 458 commits in the ancestry of `154311f55` that touch it (228 of them on the trunk's first-parent line).
- `/Users/alfonso/jjodel-w-caindata/frontend/scripts/gates/docs-digest.ts` whole (430 lines);
  `/Users/alfonso/jjodel-w-caindata/docs/digest/README.md` and `docs/digest/2026-09-27.md` whole.
- `/Users/alfonso/jjodel-w-caindata/docs/ratifiche/claude_ratifiche_2026-10-11_provisional_digest.md` whole (the 1430
  report); `/Users/alfonso/jjodel-w-caindata/docs/discovery/discovery_2026-10-11_insights_more_cards.md` lines
  1–420 and 520–636 (the 1150 report); `/Users/alfonso/jjodel-w-caindata/docs/discovery/discovery_2026-10-10_lane_board_model_insights.md`
  lines 113–142 and 334–360 (the 1520 report).
- `frontend/scripts/hooks/bash-guard.mjs` lines 175–178 and 200–250; `frontend/scripts/lane-tracking.mjs:46`;
  `frontend/scripts/lane-run.mjs` by search (lines 10–37, 544–550, 863–882); `.claude/settings.json` whole;
  `frontend/package.json` lines 96–109.
- The 1150 probes `/tmp/p1150/qa.mjs`, `pairs.mjs`, `classify.mjs`, `autonomy.mjs` (method reused, reimplemented).
- `~/.jjodel-lanes/P-*/` (469 folders, read only): `log.jsonl` result events, `input-<k>.md`, `direct.json`.
- Every prompt under `docs/prompts/` at the commit that added it (695 files, 237 of them merge prompts).
- Three helper agents of this lane, read-only, whose outputs were reviewed and are cited where used: the rule-to-check
  map (`/tmp/p1630/rules_draft.csv`, `rules_notes.md`, now `scripts/rules-enforcement.csv`), the identifying-string
  inventory (`/tmp/p1630/anon_draft.md`, now `anonymization.md`), and the RC-26 row-by-row check
  (`/tmp/p1630/rc26_hand.json`, now `scripts/rc26-hand-check.json`).

### 2.2 The script and how to regenerate

`node --experimental-strip-types docs/research/cain-2027/scripts/governance-dataset.ts` from the repository root
(5 s). It imports `parseRows`, `nearMisses` and `HeaderParseError` from `frontend/scripts/gates/docs-digest.ts` and
copies no parser code. It reads git at `--ref` (default `154311f55`) with `git cat-file --batch`, and the lane
folders at `--lanes` (default `~/.jjodel-lanes`). It writes eight CSVs into `data/`. The lane folders are not
versioned: `autonomy_weekly.csv` regenerates only on a copy of that folder taken on 2026-10-11. It is not wired into
`package.json` or any gate.

Inputs kept beside it: `scripts/rules-enforcement.csv` (the rule-to-check map, curated from the helper agent's draft)
and `scripts/rc26-hand-check.json` (one verdict per RC-26 candidate and sampled negative).

### 2.3 Definitions

- **Row.** A line at column 0, `- **<X>** (YYYY-MM-DD…` or the same without `- `, whose first token is a
  decision id (`RC-n`, `R-…`, `D-…`, `D<n>`): 582 at `154311f55`. Question rows (`Q1`…), «Deroga», «Residuo» and
  similar bold labels are left out. The row key is the whole bold text, unique in the register. It is not the
  generator's definition: its `ROW_START` (`docs-digest.ts:85`) needs the leading `- ` and an `R…` id. The gap
  between the two is what §5 counts as "invisible".
- **Introduction.** The oldest commit, by committer time, in the ancestry of the ref whose register holds the row;
  **trunk arrival**, the oldest first-parent commit that holds it.
- **Status at introduction.** From the header parenthesis, read with balanced parentheses across lines:
  `provisional` (with `-awaiting` when it says «awaiting Alfonso»), `ratified-alfonso` («ratified / decided /
  requested / approved by Alfonso», «ratified in principle by Alfonso»), `ratified-as-recommended`, `ratified-digest`,
  `chat-decided` («decided / adopted by the chat», «delegation»). A header with only a date takes its section's
  word: `ratified-section` when the heading or its intro says the section was ratified, `chat-section` when it says
  the chat adopted it, else `unmarked`.
- **Ratification.** The first trunk commit where the status turns ratified after a non-ratified one. Latency in days:
  from the header date to the date in the marker (`ratified by Alfonso 2026-10-11`), else to the commit date.
- **Adopting chat.** The first `C-YYYY-MM-DD-HHmm` in the row as first written, else in its section heading and
  intro, else on the `Chat:` line of the prompt named in the introducing commit's subject.
- **Code commit, lane, harness-only** (RC-18): §6.
- **Commit origin** (§8): `lane-run-script` when the subject is one of `lane-run`'s two templates (`docs: add prompt
  P-…, merge …`, `docs: Status flip and log entry for the … merge`); `chat` when the body carries a `Claude-Session:`
  trailer or the subject adds prompts, checkpoints or Status flips (`docs(prompts)`, `docs: add prompt`,
  `docs(sessioni)`); `lane-or-local` otherwise. Heuristic: the third class mixes lane sessions with local
  interactive ones.

## 3. The decision register over time (item 1, `data/decisions.csv`)

582 rows; no row key ever present in the ancestry is missing today (a renumbered id keeps its key, so a reused number
shows as `title_vs_intro = changed`). 226 rows are dated on or after 2026-09-26.

Status at introduction of those 226, by week of the header date:

| Week | provisional | provisional, awaiting | ratified by Alfonso | ratified by section | chat-decided | as recommended | unmarked | total |
|---|---|---|---|---|---|---|---|---|
| 09-21 (09-26, 09-27) | 23 | 0 | 2 | 19 | 0 | 0 | 3 | 47 |
| 09-28 | 73 | 4 | 44 | 2 | 9 | 0 | 0 | 132 |
| 10-05 | 6 | 0 | 36 | 0 | 1 | 4 | 0 | 47 |
| **total** | **102** | **4** | **82** | **21** | **10** | **4** | **3** | **226** |

- **Ratification.** Of the 106 provisional rows, 97 turned ratified on the trunk later. That happened on three days:
  2026-09-28 (20: RC-29, RC-30, R-EDGE-1..3 and 15 R-SIM rows of 09-26 to 09-28), 2026-10-04 (1, R-B17) and
  2026-10-11 (76, merge `c6804f3d3` of P-2026-10-11-1540; the 1540 lane's commit `d7a251297` says «ratify 76 rows»).
  Latency from the header date: median 8 days, p25 6, p75 10, max 15. Positive control: the 76 matches the count the
  1540 lane wrote in its own subject.
- **No row was ratified by digest.** No header reads `ratified by digest` at any trunk commit. That is the marker
  RC-25 defines: «the marker becomes `ratified by digest <date>` when Alfonso acknowledges» (`docs/decisions.md:196-197`).
  Alfonso's reply to the 1430 digest became `ratified by Alfonso 2026-10-11`.
- **Evidence fields as first written,** for the 106 provisional rows: evidence `measured` 68, `read` 14,
  `inferred` 2, none 22; verified `agent` 13, `none` 67, none 26; reversible `branch` 79, `trunk` 5, none 22. The
  1430 report found every `branch` row already on the trunk when it was read (24 of 24 cited commits). `reversible:
  branch` is true when the row is written and false within days, and no row updates it.
- **Who adopted.** Git authorship cannot tell: the author of all 226 introducing commits is the maintainer's
  identity, because every agent commits under it. The chat id comes from the row (33), the section (94) or the
  prompt (82); 17 rows have none.
- **Text amendments.** The register stores the current state of a row, not its path. The CSV carries the trunk commits
  where a row's text changed (`amendment_commits`) and the path of its status (`status_path_on_trunk`), e.g. R-UNDO-8
  `2026-10-03:provisional > 2026-10-11:ratified-alfonso`. RC-25 and RC-26 were never edited after 2026-09-26. RC-45
  was edited twice on its first day (`6ca224b68`, `6abb5ea11`).

## 4. RC-26 crossings (item 2, columns `rc26_*`, `waited` of `decisions.csv`)

- **Rule.** Seven regexes, one per RC-26 class (`RC26_RULES` in the script), run on the row's first text and on its
  current text. The amendment class also requires a cited target whose status, on the trunk just before the row
  appeared, was ratified (`statusBefore`).
- **Window.** Rows dated on or after 2026-09-26: 226. 108 are rule-positive and 118 rule-negative. Earlier rows are
  the baseline; the CSV classifies them by rule only (`rc26_window = no`).
- **Hand check.** A second agent of this lane read every positive and 30 negatives against RC-26's text, one row at
  a time. The negatives were drawn deterministically, the first 30 by an FNV hash of the id. Where a row names no
  file, the agent read the files of the commit it cites. The verdicts and notes are in `scripts/rc26-hand-check.json`,
  and the agent's uncertain calls (18) in its notes. The lane re-judged 8 positives blind and agrees on 7. The one
  disagreement (R-SIM-109, demo) is a row Alfonso ratified, so no crossing moves.
- **Waited.** The status at introduction is ratified by Alfonso, ratified by its section, or provisional «awaiting
  Alfonso». **Not waited:** provisional, chat-decided (including «on Alfonso's delegation»), ratified as recommended,
  unmarked.

| Regex class | Hits | Confirmed | Precision |
|---|---|---|---|
| amends a ratified row | 32 | 29 | 0.91 |
| critical zone | 39 | 17 | 0.44 |
| demo | 56 | 22 | 0.39 |
| model, effort, cost | 13 | 5 | 0.38 |
| exported interface | 4 | 0 | 0 |
| deletion | 3 | 0 | 0 |
| push | 5 | 0 | 0 |
| **rows** | **108** | **68** | **0.63** |

Sampled negatives: 27 of 30 true negatives. The 3 misses: R-B17 (critical zone; its commit `5557a714b` edits
`canvasToJjom.ts`, the row names no file), R-SIM-120 (it reinterprets ratified R-SIM-110) and R-SIM-146 (it amends
R-SIM-140). Most demo false positives are a negation or a deferral beside the keyword («the four demo scenes … 0
px», «after the MODELS demo»). 9 confirmed rows were flagged only for a class that proved wrong: the regex sees the
word, not the decision.

Results (`decisions.csv`, `rc26_hand`, `waited`, `rc26_crossing`):

- **71 positives** (68 candidates and 3 sampled misses): **37 waited, 34 did not (48%).**
- **Crossings by class** (a row can be in two): critical zone 17, amends a ratified row 15, demo 8, model/effort/cost
  2. None in exported interface, deletion or push.
- **By status at introduction:** provisional 21; chat-decided 10, all under an explicit delegation (RC-40, RC-45,
  R-SIM-94, R-SIM-95, R-SIM-108, R-VP-19..23); unmarked 3 (R-SIM-80..82).
- **By week of the row:** 7 of 11 (09-26 and 09-27), 26 of 54 (week of 09-28), 1 of 6 (week of 10-05).
- **Lower bound.** 3 of 30 sampled negatives were positives, which projects to between 2 and 31 more among the 118
  negatives (Clopper-Pearson 95% on 3/30). R-VP-42 and R-VP-46, which the 1430 digest flagged, are two of them. Their
  text does not name the demo; 1430 tied them to it through R-VP-50.
- **Against the 1430 list of 8.** The rule catches 5 (R-JS-7, R-JS-10, R-VP-31, R-UNDO-8, RC-38). R-SIM-120 is a
  sampled miss, and R-VP-42 and R-VP-46 are unsampled misses. RC-38 counts as waited here, because its header says
  «awaiting Alfonso». 1430 flagged it because the configuration went live in `53aed9baa` with no row, and a
  row-based measure cannot see a decision that has no row.
- **The critical-zone class and its hook.** The hook guards six files (`critical-zone.mjs:37-44`: `useJjomSync.ts`,
  `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`). That is the
  §3.2 trigger RC-15 (2) chose over the wider §3.1 table. Most rows of the class change `viewpoint/ir/` (R-IRN-38..41,
  R-EE-1, R-EE-3, R-VP-20..23 among them), which is in §3.1 and outside the hook. The rows inside it passed with the
  go-ahead flag the chat sets at launch (RC-30). The mechanical check sees part of the class, and the authority it
  consults is the chat.

## 5. Grammar conformance over time (item 3, `data/conformance_daily.csv`, `data/conformance_failures.csv`)

The parser of `docs-digest.ts` runs on the register at the last trunk commit of each day since 2026-09-26, plus one
snapshot just before the ratification merge (`2a10e9f36`). **Rows parsed** is `parseRows` on the register with the
failing header lines blanked. **Failing** is `HeaderParseError.failures`. **Invisible** is a row of §2.3 that
`parseRows` does not return: without the leading `- `, or with an id outside `ROW_ID`. Each header line is judged by
calling `parseRows` on that line alone. Positive control: on `2a10e9f36` the script counts 49 failing headers and 77
provisional rows, the two numbers the 1430 report measured on the same register text (`276a69ac7`, unchanged until
the merge).

| Date | Rows | Parsed | Failing | Invisible (no `- ` / non-R id) | Rows since 09-26 | of which failing or invisible | Provisional | `docs:digest` exit |
|---|---|---|---|---|---|---|---|---|
| 09-26 | 375 | 197 | 0 | 127 / 51 | 19 | 0 | 0 | 0 |
| 09-27 | 400 | 221 | 1 | 127 / 51 | 44 | 1 | 20 | 2 |
| 09-28 | 411 | 233 | 0 | 127 / 51 | 55 | 0 | 1 | 0 |
| 09-30 | 446 | 263 | 5 | 127 / 51 | 90 | 5 | 15 | 2 |
| 10-02 | 465 | 272 | 9 | 133 / 51 | 109 | 15 | 32 | 2 |
| 10-04 | 535 | 315 | 29 | 138 / 53 | 179 | 42 | 71 | 2 |
| 10-10 | 565 | 328 | 46 | 138 / 53 | 209 | 59 | 76 | 2 |
| 10-11, before `c6804f3d3` | 582 | 342 | 49 | 138 / 53 | 226 | 62 | 77 | 2 |
| 10-11, end of day | 582 | 401 | 1 | 127 / 53 | 226 | 3 | 1 | 2 |

(Every day is in the CSV; 10-05 to 10-09 equal 10-04 plus one failing header.)

- **The generator could not run on 13 of the 16 days** (exit 2 from 2026-09-30 on, and on 2026-09-27): a single bad
  header makes `parseRows` throw, and `main` exits 2 before writing any digest (`docs-digest.ts:387`, «process.exit(2);»). Nothing
  noticed, because nothing runs it unasked. The helper agent found three things: no hook, gate or merge step calls it;
  CI runs only `npm run build`; and `trace-index.ts` «turns a `HeaderParseError` into a miss (`:187-191`) and exits
  0» (`/tmp/p1630/rules_notes.md:196`, measured exit 0, «misses 390»). Searches with positive controls are in that
  file at line 222 and after.
- **At its worst, 62 of the 226 rows written under the grammar (27%) were outside what the generator reads.** Of
  the provisional rows, 11 were invisible (R-UNDO-8, R-JS-2..11), so the digest RC-25 relies on would have
  skipped them without a word even had it run.
- **Who introduced the failures** (`conformance_failures.csv`, 67 headers first non-conforming on or after
  2026-09-26). 66 were wrong in the row's first commit: they never parsed. 46 were first on a lane branch, 21 on
  the trunk. They came from 12 chats; the top three are C-2026-10-10-0046 (17, the R-GEN series), C-2026-10-04-1126
  (15, R-SIM-123..136) and C-2026-10-01-1725 (10, R-JS). By kind: free text in a provisional header 23, a header
  running onto a second line 12, `;` instead of `,` 12, no leading `- ` 11, only some of the three keys 5, a value
  outside the vocabulary 2 (`verified: probe`), an id outside `ROW_ID` 2.
- **Repair.** 64 of the 67 parse today, a median 7.0 days after they first failed (max 11.6). 59 of the 64 were
  fixed through the merge `c6804f3d3`, which ratified the rows and rewrote their headers in one pass. Three still do
  not parse: RC-38 (free text, deliberately left by 1540), and D-UI-15 and D-UI-16, whose `D-` ids are outside
  `ROW_ID` (`R[A-Z]*-?[A-Z]*-?\d+`, `docs-digest.ts:83`).

## 6. RC-18 over time (item 4, `data/rc18_daily.csv`)

- **Definition, from the row** (`docs/decisions.md:126-131`): «al più una corsia su quattro i cui commit di codice
  toccano solo `frontend/scripts/`, `.claude/` o `docs/`». A **code commit** is a non-merge commit, reachable from
  `154311f55`, that touches at least one path outside `docs/`. A **lane** is the set of code commits that carry the
  same Prompt-ID. A lane is **harness-only** when every one of its code commits touches only those three
  directories. Its day is the date in its Prompt-ID. The window is the 7 days ending on the row's date, and the
  share is harness-only lanes over code lanes. A variant also counts `CLAUDE.md` and `AGENTS.md` as harness: it
  changes the share on 9 of the 17 days, never the verdict.
- **How a lane id reaches a commit.** By the subject suffix `(P-YYYY-MM-DD-HHmm)` (CLAUDE.md §6.2), else by a
  `Prompt-ID:` trailer in the body. The 1520 report (§3) measured the suffix as the primary route (368 of 379 lanes)
  and the trailer as marginal. The trailer still matters here: 6 harness-only lanes of the last window link only
  through it (for example `226fce084 feat(harness): lane board links each lane to its chat`, trailer
  `P-2026-10-10-1816`). **Code commits without any lane id:** 25 of 63 (40%) in the window ending 2026-09-25, and 6
  of 106 (5.7%) in the window ending 2026-10-11. Among them are the chat's direct harness commits (the 1520 report
  names `73af7bbac` and `79c0307dc`) and issue-branch work.

| Window ending | Code lanes | Harness-only | Share | Budget 0.25 |
|---|---|---|---|---|
| 09-25 | 21 | 1 | 0.048 | within |
| 09-28 | 68 | 9 | 0.132 | within |
| 10-01 | 112 | 9 | 0.080 | within |
| 10-04 | 101 | 7 | 0.069 | within |
| 10-07 | 55 | 7 | 0.127 | within |
| 10-09 | 40 | 7 | 0.175 | within |
| 10-10 | 49 | 16 | **0.327** | **over** |
| 10-11 | 53 | 21 | **0.396** | **over** |

- **Sensitivity.** With the subject suffix alone, the last window is 15 of 47 (0.319). The 1150 report's proxy was 19
  of 49 (0.39). The chat measured 33 of 69 (0.48). Every variant is over 0.25 on 10-10 and 10-11, and every variant is
  within it before 10-10. RC-18 also says «la chat lo misura una volta a settimana… e lo riporta nel checkpoint».
  No script computes it (helper agent: `command grep` for `RC-18` over `frontend/scripts` returns 0, against a
  control of 45 for `RC-45`). It went over budget on the day the board and harness lanes clustered (16 harness-only
  lanes in the window ending 10-10, against 7 the day before).

## 7. Autonomy over time (item 5, `data/autonomy_weekly.csv`)

The 1150 method (§3.2 there), reimplemented: an **ask** is a run whose result ends with `Outcome: question` or
carries a `Recommended:` line. Its **answer** is the input of the next resume (`input-<i+2>.md`). Answers can be
paired only from P-2026-09-28-1545 on, when inputs started to be kept per run. The **class** comes from the same five
text rules: overturned, alfonso, adopted, bare GO, other. The hand check of 1150 found 17 of 20 right, all three
errors in the bare-GO class. Direct merges are excluded.

| Week | Session lanes | Asking lanes | Asks | Asks per lane | Pairable | Answered | Adopted by chat | Alfonso | Overturned | Bare GO | Other | Not resumed | Alfonso / answered |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 09-21 (09-26, 09-27) | 82 | 24 | 25 | 0.30 | 0 | – | – | – | – | – | – | 25 | – |
| 09-28 | 155 | 54 | 63 | 0.41 | 57 | 31 | 20 | 6 | 0 | 4 | 1 | 32 | 0.19 |
| 10-05 | 90 | 24 | 29 | 0.32 | 29 | 21 | 8 | 7 | 1 | 4 | 1 | 8 | 0.33 |

- Reproduction check: the week of 09-28 matches 1150's table cell for cell. The week of 10-05 has 4 more asks (25 to
  29) and 4 more answers (17 to 21), from the lanes of 2026-10-11 afternoon. The method is stable, and the
  data grew.
- Weeks are of the Prompt-ID date, so the last week is right-censored: asks of 2026-10-11 still waiting count as
  not resumed.
- One overturned answer in 52 classified. 65 of the 117 asks have no resume after them, 25 of them in the first week,
  which cannot be paired. 1150 §3.3 traced 33 of the 65 unresumed asks it saw to a later prompt that carries the
  answer, a channel the series does not see.

## 8. Rule timeline and the central comparison (items 6 and 7, `data/rules.csv`, `data/comparison.csv`, `data/violations_daily.csv`)

### 8.1 Which rules have a check (`rules.csv`)

33 rules, each with the rule's date and commit (from the register history for RC rows), its amendments, the
check's file, mode, wiring and first commit, and the evidence with `file:line`. Categories, by the strongest
mechanism that runs without anyone choosing to run it:

| Category | n | Rules |
|---|---|---|
| block-auto | 18 | RC-7, RC-13, RC-15, RC-19, RC-20, RC-26 (critical zone and push only), RC-29, RC-30, RC-31, RC-34, RC-44, RC-45(1), RC-45(2) (form only), P6 `Model:`, CLAUDE.md 6.2, P9 format (2 of 12 fields), P13 Status at merge, `check:scripts` |
| block-manual | 4 | RC-38, RC-39, RC-40 (`auto-intake.mjs`), the decision-row grammar (`docs-digest.ts`) |
| warn | 2 | RC-17 (`lane-run status`, trace-index), RC-43 (`lane-run start`) |
| report | 5 | RC-22, RC-25, RC-27, RC-28, RC-33 |
| none | 4 | RC-18, RC-21, RC-23, RC-42 |

- **Scope of the hooks.** Hooks run only inside a Claude Code session started in a tree with the project's
  `.claude/settings.json`. There is no git pre-commit hook (`git config core.hooksPath` is unset, exit 1), and CI
  runs only the build (`/tmp/p1630/rules_notes.md:17-20`). So commits made by the project chat, and by `lane-run`'s
  own `git commit` calls, skip bash-guard. `lane-run.mjs:1773` builds subjects of up to 89 characters itself.
- **Lag from rule to check.** 29 rules have some check. For 21 of them the check came 0 or 1 day after the rule
  (RC-29, RC-30, RC-34 and RC-44 shipped with theirs). For 3 the check came first and the row codified it: RC-13 (the
  deny list of 2026-05-29), RC-26 (the hooks of 2026-09-21) and RC-45(2) (Check B of 2026-08-02). Longer lags: P6
  `Model:` 3 days (rule `97a41475e` 2026-09-18, hook `1172230c9` 2026-09-21), RC-17 3, P13 Status 6, RC-22 9, and
  CLAUDE.md 6.2 122 days.
- **Judgment versus form.** 16 of the 18 auto-blocking rules check a form (a line, a trailer, a byte-identical file).
  The two that touch content, RC-26's critical-zone class and RC-30, are opened by a flag that the chat passes at
  launch (`--critical-zone-goahead`).

### 8.2 Violations over time, by mechanism (`comparison.csv`)

`violations_daily.csv` carries, for each rule and day, the opportunities (commits, prompts, register rows or days),
the violations and the period: `before` the rule, `text-only` (rule in force, no check yet) or `checked`.
Snapshot rules count row-days, so their rate is the mean daily share.

| Rule (unit) | Mechanism | Text-only period | Checked period | Last 7 days |
|---|---|---|---|---|
| P6 `Model:` trailer, lane-or-local commits | block-auto (hook, 09-22) | 53/116 = 0.457 | 65/1023 = **0.064** | 11/214 = 0.051 |
| … of which the tree carries the hook (from 09-22) | block-auto | – | 37/991 = **0.037** | 11/214 = 0.051 |
| … of which the tree lacks the hook (from 09-22) | none (outside the hook) | 28/32 = **0.875** | – | 0/0 |
| P6 `Model:` trailer, chat commits | none (outside the hook) | 230/438 = **0.525** | – | 93/136 = **0.684** |
| P6 `Model:` trailer, lane-run commits | none (outside the hook; the template writes it) | 14/379 = 0.037 | – | 1/130 = 0.008 |
| Subject ≤ 72, lane-or-local | block-auto (hook, 09-22) | 62/300 = 0.207 | 22/1023 = **0.022** | 4/214 = 0.019 |
| … tree carries the hook / lacks it (from 09-22) | block-auto / none | 3/32 = 0.094 (lacks) | 19/991 = 0.019 (carries) | 4/214 = 0.019 |
| Subject ≤ 72, chat | none (outside the hook) | 182/708 = **0.257** | – | 34/136 = 0.250 |
| Subject ≤ 72, lane-run | none (its own template) | 217/379 = **0.573** | – | 70/130 = 0.538 |
| RC-13 docs and code apart, lane-or-local | block-auto (hook, 09-22) | 12/300 = 0.040 | 5/1023 = 0.005 | 3/214 = 0.014 |
| RC-13 docs and code apart, chat | none | 16/708 = 0.023 | – | 0/136 = 0 |
| RC-44 `Front:` line, prompts | block-auto (start, merge) | – | 2/18 = 0.111 | 2/18 = 0.111 |
| RC-43 `Request:` line, prompts | warn (start) | – | 29/66 = **0.439** | 29/66 = 0.439 |
| RC-42 `Depends:` line, prompts | none | 9/69 = 0.130 | – | 9/69 = 0.130 |
| RC-33 `Chat:` line, prompts | report | – | 0/183 = **0** | 0/78 = 0 |
| RC-17 `Lane:` line, prompts | warn (09-28) | 5/70 = 0.071 | 39/194 = 0.201 | 1/78 = 0.013 |
| Header grammar, rows since 09-26 | block-manual (parser, not wired) | 371/2187 = 0.170 | – | 277/1373 = **0.202** |
| RC-25 provisional acknowledged within 2 days | report | 518/2187 = 0.237 | – | 424/1373 = **0.309** |
| RC-26 waits, critical-zone class (rows) | block-auto, partial (hook guards 6 files; go-ahead set by the chat) | – | 17/27 = **0.630** | 0/2 |
| RC-26 waits, other classes (rows) | none | 17/44 = **0.386** | – | 1/4 |
| RC-18 budget (days over, 7-day window) | none | 2/17 = 0.118 | – | 2/7 = 0.286 |

Read against H0:

- **Supported where the check runs.** The same three commit rules go from 0.457, 0.207 and 0.040 to 0.064, 0.022
  and 0.005 when the hook starts on the commits it sees. In the same period, lane-or-local commits whose tree
  carries the hook miss the trailer in 37 of 991 (0.037), and those whose tree does not in 28 of 32 (0.875). On
  the commits it does not see, the rates stay at, or drift to, 0.525 to 0.684 (chat `Model:`) and 0.257 (chat
  subjects). The trend outside the hook is upward. The chat's
  `Model:` misses were 0 of 10, 3 of 13, 0 of 1 and 0 of 5 on 09-19 to 09-23, then 46 of 88 on 10-10 and 39 of 40 on
  10-11 (`violations_daily.csv`).
- **The commits the harness writes itself break the rule it enforces on others.** 57% of `lane-run`'s own commits
  have a subject over 72 characters, against the 2.2% the hook allows lanes.
- **A blocking check also brings repair.** Two prompts were committed without `Front:` after Check E existed. Each was
  repaired before its launch by a commit named «docs(prompts): Front line for P-…»: `385058377`, 23 s after the
  prompt `34581f960`, and `e47e456b1`, 36 s after `3e2a0ac34`. `lane-run start` refuses a prompt without the line
  (`lane-tracking.mjs:111`). Of the lines missing when a prompt was committed, the file at `154311f55` carries 2 of 2
  for `Front:` (blocking), 1 of 29 for `Request:` (warned), 1 of 9 for `Depends:` (no check) and 0 of 44 for `Lane:`
  (warned) (`comparison.csv`, `violations_repaired_at_ref`).
- **Not supported as "text-only drifts".** `Chat:` has only a report and is never missing. Presumably the chat
  writes it into every prompt it drafts; that is inferred, not measured. `Request:` is warned at start and is missing on 44%. `Lane:`'s violations rose after its
  warning (0.071 to 0.201) and fell to 0.013 later, with no change in its check. A template, not a check, explains
  the header lines.
- **Supported for judgment rules.** The three rules that ask a classification or a measure have no check, and their
  violation rates are the highest in the table and rise over time: RC-26 (§4), RC-25's acknowledgement (0.237, then
  0.309 in the last 7 days, until the wave of 10-11) and RC-18 (2 of the last 7 days over). The grammar, which a
  parser can check but nothing runs, drifts like a judgment rule (0.170 to 0.202), and was repaired in one batch.
- **The counter-case is RC-26's critical-zone class.** It has a hook, and it has the highest crossing rate (17 of 27).
  The hook guards 6 of the §3.1 entries, and the go-ahead it asks for is set by the chat (§4). The check covers the
  file, not the waiting.
- **Proposed claim for the paper:** a mechanical check holds a rule only on the path where it runs. Rules whose
  compliance needs a judgment, and checkable rules whose check nobody runs, drift until a human-triggered batch
  repairs them.

### 8.3 The figure (one small plot)

From `violations_daily.csv`, filter `rule` to four series and plot `rate` (y, 0 to 1) against `date` (x, 2026-09-11
to 2026-10-11), one line per series:

- P6 `Model:` (lane-or-local);
- P6 `Model:` (chat);
- header grammar (rows since 09-26);
- RC-25 acknowledged within 2 days.

Shade `period = checked` for the first series. Mark three vertical lines: 2026-09-21 (hook `1172230c9`), 2026-09-26
(RC-25..28) and 2026-10-11 (ratification merge `c6804f3d3`). The picture: one series falls at the hook and stays
low; the chat's rises; the two register series climb from 0 to about 0.3 and collapse on 10-11.

## 9. Threats to validity (item 9)

- **T1. One project, one human decider.** Every rate is one harness under one maintainer, whose own GOs and
  ratifications are the "waiting" side of RC-26. It is a case study: no rate generalises, and "waiting for Alfonso"
  is unreplicated across deciders. Effect: n = 1 on the governance side; the per-rule n (hundreds of commits, 226
  rows) is within one regime.
- **T2. The agents write the descriptions.** Row text, section intros, `Corregge`/`Causa` and Prompt-ID suffixes are
  all written by the agents the rules govern. A row that hides its class («changes nothing in the demo») reads as
  a negative for RC-26. Effect: crossings and violations are lower bounds for the text-based measures (RC-26,
  autonomy classes). For git-based ones (trailers, subjects, files) the effect is none.
- **T3. The register is edited by the agents it governs.** The 1540 lane rewrote 59 headers in one merge, and
  statuses carry only the last marker. A row's history exists only as git history, which the script reads; a
  rewrite that changes a row's id would break the join (the script flags `title_vs_intro = changed`). Effect:
  `status_at_intro` is reliable, while `status_now` reflects the latest rewrite.
- **T4. The 2026-10-11 wave is an intervention.** It ratified 76 rows and fixed 59 headers, prompted by the 1430
  digest that this research line commissioned. Effect: every register series drops to near 0 on 10-11. Close the
  series at the `2a10e9f36` snapshot (§5 table) and report 10-11 as a treatment, not as drift recovery.
- **T5. Heuristics.** The commit origin is a subject and trailer heuristic. The RC-26 classes come from regexes
  checked row by row by an agent, not by a human (§4). The autonomy classes are text rules at 17 of 20 (1150). Lane
  attribution misses 5.7% to 40% of code commits (§6).
- **T6. Enforcement is confounded with form.** 16 of the 18 auto-blocking rules check a form; the judgment rules
  have no check. The data cannot say whether judgment rules drift because they lack a check or because judgment is
  harder. Only a judgment rule given a check would separate the two, and none exists.
- **T7. Right-censoring and short series.** Rules of 10-06 to 10-11 (RC-42..45) have 1 to 6 days of data. The
  `Front:` rate (2 of 18) is one day.
- **T8. Hook reach is per tree.** A hook acts only in a tree whose branch carries it. All 23 `Model:` misses of
  2026-09-23 in the lane-or-local class are commits whose parent does not descend from `1172230c9` (`git
  merge-base --is-ancestor`, 23 of 23). §8.2 therefore also splits that class by whether the commit descends from
  the hook commit. A calendar cut at 09-22 understates the hook's effect.
- **T9. Generator definition versus row definition.** The 582 rows of §2.3 are this lane's; the 1430 report counted
  165 rows without `- ` by a looser opener, against 138 here (Q rows and labels excluded).

## 10. Decisions taken (unattended) and decisions awaiting Alfonso

Taken in this report, as method choices, none written to `docs/decisions.md`:

- a row is a dated bold decision id at column 0, with or without `- ` (§2.3);
- the introduction is the oldest commit in the ancestry, and the trunk arrival is a separate column;
- the status at introduction is read from the header, and from the section only for a header that holds a bare date;
- RC-18 attaches commits to lanes by suffix or trailer, and dates a lane by its Prompt-ID;
- the commit origin follows the three-way heuristic of §2.3;
- RC-26 positives were judged by a second agent, then spot-checked by the lane (§4);
- the RC-25 acknowledgement window is 2 days, a choice. RC-25 itself says «at the close of every lane».

Awaiting Alfonso (RC-26 list): none. This lane changed no code, no register row and no exported interface,
deleted nothing, and did not push.

## 11. Open questions

1. Is the paper's claim the narrow one?
   Recommended: yes. Claim: «a check holds a rule on the path it runs on; outside it, and for judgment rules, drift»; §8.2 is the evidence.
2. Where does the series end?
   Recommended: at `2a10e9f36` (2026-10-11, before the ratification merge); 10-11 enters the paper as an intervention.
3. What does the public artifact contain?
   Recommended: the CSVs and the script, with shas HMAC-ed and quotes paraphrased, per `anonymization.md` §3. Check first whether `jjodel-modeling/jjodel-frontend` is public.
4. Who judges RC-26?
   Recommended: Alfonso reads the 71 positives in `scripts/rc26-hand-check.json` before submission; the agent's verdicts are the fallback.
5. Should the lane folders be frozen?
   Recommended: yes, a tarball of `~/.jjodel-lanes/P-*/{log.jsonl,input-*.md,direct.json}` as of 2026-10-11, kept outside the repo, so `autonomy_weekly.csv` regenerates.

## 12. Dependencies and risks

- The numbers depend on `154311f55`. A later ref adds rows and commits, and the lane folder grows. The defaults pin
  the ref, not the folder.
- `/tmp/p1630/` is shared by name with other lanes stamped 1630 (files from 2026-10-10 were already there). The
  lane's probes are `now.ts`, `viol.mjs`, `nm.txt`, `nm2.txt` and `rc26_*`, plus the helper agents' outputs. None of
  them is needed to regenerate the CSVs.
- `docs-digest.ts` is imported, not copied. A change to its grammar changes `conformance_*.csv` retroactively. That
  is intended, because the paper measures the rows against the grammar of today. Pin the script's commit
  (`7b7ad1123` plus later edits, last `git log -1 -- frontend/scripts/gates/docs-digest.ts`) in the artifact.

## 13. Numbers for the paper

1. 3.7% vs 87.5%: commits missing the required `Model:` trailer after 2026-09-22, when the committing tree carries the hook (991) vs when it does not (32); `comparison.csv`.
2. 52.5%, rising to 68.4% in the last 7 days: the project chat's commits missing the same trailer, which no hook sees (438 commits; 3 of 29 on 2026-09-19 to 09-23); `comparison.csv`, `violations_daily.csv`.
3. 57.3%: `lane-run`'s own commits whose subject exceeds the 72-character limit its hook enforces on lanes (2.2%); `comparison.csv`.
4. 106: decision rows written provisional under RC-25 since 2026-09-26; 0 ratified by digest; 97 ratified later, median 8 days; `decisions.csv`.
5. 76 of 97: ratifications that landed in a single batch on 2026-10-11; `decisions.csv` (`ratification_time`).
6. 62 of 226 (27%): rows written under the header grammar that its own parser could not read, at the peak (2026-10-11, before the repair); `conformance_daily.csv`.
7. 13 of 16: days on which the digest generator exited 2 on the register, with no gate noticing; `conformance_daily.csv` (`docs_digest_exit`).
8. 66 of 67: non-conforming headers that were wrong from the row's first commit, written by 12 chats; `conformance_failures.csv`.
9. 34 of 71 (48%): rows written since 2026-09-26 in a class RC-26 reserves for Alfonso that did not wait for him (10 under his explicit delegation); a lower bound; `decisions.csv` (`rc26_crossing`).
10. 0.396: RC-18 harness-only share of code lanes on 2026-10-11 (budget 0.25), within budget on every day before 2026-10-10; `rc18_daily.csv`.
11. 2 of 2 vs 1 of 29 vs 1 of 9: prompt header lines missing at commit and repaired later, under a blocking launch check (`Front:`, within 36 s) vs a warning (`Request:`) vs no check (`Depends:`); `comparison.csv`.
12. 0.19 to 0.33: share of resumed answers that came from Alfonso, weeks of 2026-09-28 and 2026-10-05 (n = 31, 21); `autonomy_weekly.csv`.
