# Discovery: lane board Insights, rework causes, decision autonomy, lead time, work left behind

- Prompt-ID: P-2026-10-11-1150 · prompt `docs/prompts/claude_2026-10-11_1150_prompt_insights_more_cards_discovery.md`
- Session: `d827f164-4f13-4d2c-942b-3d233d57d35b` · chat C-2026-10-10-1145 · lane auto (unattended)
- Tree: `~/jjodel-w-insightsmore`, branch `insights-more`, HEAD `cbbc1a204` (the trunk tip at the cut)
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- Measured 2026-10-11 between 11:50 and 12:15, load average 25 to 45, on the 453 lane folders of
  `~/.jjodel-lanes/` and on `git log --all` of the shared repository. The trunk moved during the run, from
  `cbbc1a204` to `66ee3830d` (§8): log entries were parsed at `cbbc1a204`, `/api/insights` was read at `bc5b997c1`.
  Throwaway probes in `/tmp/p1150/` (listed in §9), none in the repo.
- Reuses `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md` (the 1520 report) and does not
  remeasure what it covers: model attribution (§2 there), lane-to-commit linking (§3), first-shot (§4.3), cost
  presence (§2.4 and its addendum).
- This report is a set of hypotheses with evidence, not a reference. Whoever builds on it rereads the real files.

## 0. Answer in brief

1. **Rework causes read well where `Corregge` is filled.** `Causa` is present in 220 of 225 entries where due (98%,
   since 2026-08-02). `Corregge`: 27 to 38 a week until 2026-10-04, then 5 of 116. Lane era: (a) 20, (c) 14, (f) 8, (d) 4.
2. **Chains are short.** 87 roots: depth 2 in 72, 3 in 9, 4 in 5, 5 in 1 (lane era: 22 and 3). A corrector costs a
   median 0.49 of the lane it corrects.
3. **The board misresolves `Corregge`** in 2 of 164: an annotation's Prompt-ID wins over the timestamp prefix
   (`lane-board.mjs:968`). Fix in S1.
4. **Decisions.** 113 runs asked (39 `question` exits, 74 stops with `Recommended:`). 48 answered by a resume: 26
   adopted by the chat, 12 Alfonso, 1 changed, 8 GOs without a marker, 1 other. Text classifier **17/20** on a hand
   sample. 65 asks never resumed. Chat vs Alfonso shows only in the answer text; no lane folder predates RC-25.
5. **No R- row was ever acknowledged by digest**: 60 stay `provisional, unattended`.
6. **Lead time** (n=218): prompt commit = start; span median 0.55 h (p90 2.0); end to trunk 0.39 h (p90 8.7, max
   46); prompt to trunk 1.26 h (p90 15.4). Request time is not metadata (`request.md` mtime = start in 27/28), but
   19/28 state it in the text: request to trunk median 48 min (n=17).
7. **Left behind.** 13 branches off the trunk: 7 in flight, 1 superseded, 2 by design, 3 left behind
   (`sim-node-disc` 8.5 d, `validation-skeleton` 10.6 d, `sim-data-level` 12.5 d). §4.4 flags `harness-req-tab` from
   2026-10-07. `ahead-behind` 0.6 s + content diff 1.9 s; `git cherry` 29 s, unusable.
8. **Secondary.** `Smoke visivo` is written before the GO; resumes show 7 of 95 visual checks sent a lane back.
   Cost present from the first lane. Concurrency: computable, confounded, no card.
9. **RC-22, partly falsified.** The four named worktrees touch nothing under `lane-board/`; but 1138 merged into
   `insights.js` during this run and 1205 holds `lane-board.mjs`, `README.md`, `laneBoard.test.ts`. Slices queue.
10. **Slices** (§7): S1 rework causes and chains; S2 lead time and left behind; S3 decisions; S4 optional, lane-run.

Decisions awaiting Alfonso (RC-26): one. RC-18's harness budget looks exceeded (proxy: 19 of 49 code lanes in 7
days harness-only); launching S1–S3 anyway departs from a ratified row (§10).

Questions (§12), each with its line:
1. Card order? Recommended: S1, S2, S3 by value over cost, all after 1205 merges.
2. Fix the Corregge resolution in S1? Recommended: yes, timestamp prefix first, as `check:docs` reads it.
3. Answer class from text or data? Recommended: text classifier in S3, `lane-run --answer` in S4.
4. Request time? Recommended: an `At: YYYY-MM-DD HH:MM` first line in `request.md`, warned on by `lane-run` (S4).
5. Left-behind threshold? Recommended: 48 h since the last commit or lane exit; `auto/*`, `backup/*` apart.
6. RC-18? Recommended: the chat measures it first; over budget, S1 waits unless Alfonso waives it.
7. The 60 provisional rows? Recommended: one digest to Alfonso, ordered by consequence.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `Causa` is filled reliably enough to chart rework causes | **partly** | present in 220/225 entries where due; the due set depends on `Corregge`, which fell to 5/116 in the week of 2026-10-05 (§2.1) |
| H2 | `Corregge` chains resolve and their depth reads | **holds** | 127 correcting edges, 87 roots, depth 2–5 (§2.2); the board's resolution order is wrong in 2/164 (§2.3) |
| H3 | A lane folder maps to its log entry | **holds** for 378/453 | the subject suffix of the heading, else `Prompt document name` (§2.4) |
| H4 | Questions and answers can be read from the lane folders | **partly** | asks 113/113; answers aligned only from P-2026-09-28-1545 on, 48 resumed, 17/20 on the hand sample, 65 asks never resumed (§3) |
| H5 | A signal tells a chat answer from an Alfonso answer, before RC-25 too | **partly** for the first half, **falsified** for the second | answer text only, no metadata; no lane folder predates RC-25 (§3.4) |
| H6 | The request time is recorded | **falsified as metadata**, **partly as text** | `request.md` mtime = lane start in 27/28; a date and time in the text of 19/28 (§4.1) |
| H7 | Prompt, start, end and trunk times give a lead time per lane | **holds** | 218 non-merge lanes, with the run window of 1520 §3 (§4.2) |
| H8 | Branches left out of the trunk are cheap to detect | **holds** with `ahead-behind` and content diff, **falsified** with `git cherry` | 0.6 s + 1.9 s against 29 s (§4.3) |
| H9 | No other running lane touches `frontend/scripts/lane-board/` (RC-22) | **holds** for the four named worktrees, **falsified** for the board | 1138 merged into `insights.js`, 1205 holds three of the slice files (§8) |
| H10 | The secondary data exist | visual: **partly**; cost: **holds**; concurrency: **holds**, confounded | §5 |

## 2. Rework causes (WHAT 1)

### 2.1 Coverage of `Causa` and `Corregge` by week (measured, `logs.mjs`, `coverage.mjs`)

Source: every P9 entry on the trunk ref at `cbbc1a204`, read with `git show alfonso-frontend-jjtl:<path>`:
`docs/claude-code-log.md`, `docs/claude-code-log-archive.md` and the 31 `docs/log-inbox/*.md`. 1769 entries,
99 tickets. Task entries dated on or after 2026-08-02 (`LINT_FROM_DATE`, `frontend/scripts/gates/log-tools.ts:10`):
1001, of which 30 in the active log, 764 in the archive and 207 in the inboxes.

"Due" follows `CLAUDE.md` §21.3: outcome ⚠️ or ❌, or `Corregge` filled. Weeks start on Monday, by the entry's date.

| Week | Tasks | Corregge filled | Causa letter | ⚠️/❌ | Due | Due with Causa | Causa letters |
|---|---|---|---|---|---|---|---|
| 07-27 (only 08-02) | 7 | 2 | 2 | 0 | 2 | 2 | a 1, f 1 |
| 08-03 | 60 | 11 | 18 | 6 | 16 | 15 | a 9, c 7, e 1, g 1 |
| 08-10 | 75 | 14 | 17 | 3 | 16 | 14 | a 7, c 7, b 1, f 1, g 1 |
| 08-17 | 45 | 9 | 11 | 5 | 12 | 11 | a 5, c 5, e 1 |
| 08-24 | 157 | 38 | 59 | 14 | 48 | 48 | c 21, a 16, f 10, d 5, g 4, e 3 |
| 08-31 | 94 | 21 | 31 | 6 | 25 | 24 | a 14, c 11, e 3, f 2, g 1 |
| 09-07 | 34 | 3 | 6 | 3 | 6 | 6 | c 4, a 1, b 1 |
| 09-14 | 73 | 9 | 19 | 9 | 18 | 18 | c 8, a 6, g 3, f 2 |
| 09-21 | 96 | 27 | 28 | 2 | 28 | 28 | a 9, c 8, f 5, d 3, g 3 |
| 09-28 | 244 | 31 | 46 | 17 | 46 | 46 | a 19, c 15, d 4, g 4, f 3, e 1 |
| 10-05 | 116 | **5** | 8 | 3 | 8 | 8 | a 4, c 2, d 1, f 1 |
| Total | 1001 | 170 | 245 | 68 | 225 | 220 | a 91, c 88, f 25, g 17, d 13, e 9, b 2 |

("Causa letter" counts `(x)` and the bare `x` alike: 234 and 11. `check:docs` accepts only `(x)` or `—`,
`log-tools.ts:35-36`, and ignores the archive.)

- Measured: **Causa is given in 220 of 225 entries where it is due.** The five misses are archive entries of
  2026-08-08 to 2026-09-06. No entry gives a Causa without its trigger since 2026-09-26 (0 of 417).
- Read: `check:docs` does not tie the two fields. It checks each one alone: «if (!fields.has('Causa')) {»
  (`log-tools.ts:348`) with the allowed values `—` or `(a)`…`(g)`. A missing Causa on a correcting entry would
  pass.
- Measured: **the due set collapsed in the week of 2026-10-05**, 5 `Corregge` in 116 entries against 27 and 31
  in the two weeks before. The 1520 report saw 0 in 39 entries (§4.1 c there). RC-45 (2) now requires the field on
  every rework prompt from 2026-10-11. Two entries of 2026-10-11 fill it so far (P-2026-10-11-1105,
  P-2026-10-11-0040). A cause chart over the last 7 days today shows little rework because little was declared.
- Lane era (since 2026-09-26, 417 tasks): the 49 correcting entries give a 20, c 14, f 8, d 4, g 2, e 1. The 19
  entries ending ⚠️/❌ without `Corregge` give a 9, c 6, g 3, d 1. Merge entries: 168, of which 2 fill `Corregge`.

### 2.2 Chain depth (measured, `chains.mjs`)

Edges: an entry with its own Prompt-ID whose `Corregge` resolves to another Prompt-ID. Resolution: the timestamp
prefix first (`TIMESTAMP_PREFIX`, `log-tools.ts:44`), then a Prompt-ID in the text, then a prompt file name.
127 edges, 18 self-corrections (an entry naming its own lane), 17 filled `Corregge` on entries without a Prompt-ID
of their own (archive entries with no `Prompt document name`), 6 filled values with no resolvable target
(free text of 2026-08-14 and 2026-08-26, e.g. «2026-08-26 (istruzione in chat)»).

A chain is the root lane and every lane that corrects it, directly or through another corrector. Depth counts
lanes along the longest path, root included.

| Depth | All roots (87) | Roots before 2026-09-26 | Lane-era roots |
|---|---|---|---|
| 2 | 72 | 50 | 22 |
| 3 | 9 | 6 | 3 |
| 4 | 5 | 5 | 0 |
| 5 | 1 | 1 | 0 |

Deepest: P-2026-08-27-1010 → 1115 + 1225 → 1120 → 1130 → 1155 (depth 5, 6 lanes); lane era:
P-2026-09-30-1552 → 1720 + 1935 → P-2026-10-01-2230 and P-2026-09-27-1430 → 1540 + 1738 → 2105 (depth 3).
76 of the 87 roots have an entry of their own. Cost (from `/api/insights`, list price): for the 26 corrected lanes
whose corrector has a folder, the corrector costs a median 0.49 of the corrected lane.

### 2.3 The board resolves `Corregge` in the wrong order (measured, `cpid.mjs`; read)

`lane-board.mjs:968`: «cPid: filled ? (/P-\d{4}-\d{2}-\d{2}-\d{4}/.exec(c) || [])[0] || filePid(c) || stampPid(c) : '',».
A Prompt-ID inside the annotation wins over the prefix. Of the 164 filled values with a canonical prefix, 2
resolve elsewhere:

- `docs/log-inbox/codegen-ready.md:13`: «**Corregge**: 2026-10-10 20:29 (`claude_2026-10-10_2029_prompt_codegen_s6_oracle.md`:
  its fixture predates S5b's `ready`; red at the merge P-2026-10-11-1056)». The board marks the merge
  P-2026-10-11-1056 corrected and leaves P-2026-10-10-2029 first-shot.
- P-2026-09-24-1455: prefix 2026-09-18 22:19, the board takes P-2026-09-22-2105 from the annotation.

### 2.4 Lane folder → log entry (measured)

The heading suffix `(P-…)` carries the Prompt-ID in 406 of the 417 lane-era entries; the rest resolve through
`Prompt document name` (408/417 with a Prompt-ID). This is `logEntries()` (`lane-board.mjs:947-975`) already.
Of 453 lane folders, 378 have an entry of their own on the trunk; 128 of the 135 direct merges have one. The 75
without: 34 of 2026-09-27, most of them merge sessions before P16 required a merge entry («a merge session writes
the P9 entry of the merge in it, from 2026-09-28», `docs/PROTOCOL.md:434`), and the 19 lanes of 2026-10-10/11
whose inbox entry sits on a branch not yet merged (the 1520 report's risk 5). 18 folders have more than one entry.

## 3. Decision autonomy (WHAT 2)

### 3.1 Where questions and answers live (read; measured)

- **The question** is the `result` text of a run: an `Outcome: question` exit, or a hard stop whose text carries
  `Recommended:` lines (discovery reports, P16 §0 «the questions with their `Recommended:` lines»). `exit.txt`
  holds only the exit code (`0`). Measured over 317 session lanes with a log, 524 runs: 39 `question`, 289
  `hard-stop`, 168 `done`, 10 `blocked`, 17 without a parsable line. **113 asking runs**: 39 question exits (37
  with a `Recommended:` line), 71 hard stops and 3 blocked runs with one; 220 `Recommended:` lines in all.
- **The answer** is the next resume's input. `lane-run` keeps it verbatim: «writeFileSync(join(f.dir, 'input-' + (n
  + 1) + '.md'), readFileSync(input));» (`lane-run.mjs:452`), with nothing beside it: no sender, no class. Before
  P-2026-09-28-1545 the resume text is in `msg-k.md`, not aligned to runs (`lane-board.mjs:677`), so pairing a
  question with its answer works from that lane on: 82 asking runs, **48 answered by a resume**.
- **The decision digest of RC-25/RC-28 is not a file.** The memo set the artifact aside: «A digest artifact with
  its own page: set aside, the digest lives in the chat» (`docs/ratifiche/claude_ratifiche_2026-09-26_ratification_by_invariants.md:30`).
  Search: `find ~/.jjodel-lanes -maxdepth 3 -iname '*digest*'` lists six `auto/night-*/digest.md`, the RC-40
  nightly intake digests (control: the search finds files), none a decision digest. No checkpoint in
  `docs/sessioni/` reports the RC-28 numbers: `grep -i "median wait\|veto"` returns two lines, neither a measure.
- **The R- rows** are the durable trace: `decisions.md` writes the marker in the row head (§3.3).

### 3.2 Classifier and hand check (measured, `classify.mjs`)

Rules, in order, on the first 2500 characters of the answer:

1. `overturned` (changed): «with one change», «not as recommended», «instead of the recommendation», «do not
   adopt», «rather than your recommendation»…
2. `alfonso`: «Alfonso decided|ratified|approved|granted|…», «decision by Alfonso», «GO from Alfonso», «Alfonso's
   answer|decision|GO|go-ahead».
3. `adopted`: «adopted as recommended», «as recommended», «Recommended answer adopted», «your Recommended», «as you
   recommend», «your recommendation»…
4. `go-silent`: a first line that is a GO or an ACK with none of the above.
5. `other`.

Tally over the 48: adopted 26, alfonso 12, go-silent 8, overturned 1, other 1.

**Hand check on 20.** Rows ⌊i × 48/20⌋, i = 0…19, each labelled by hand from the question's `Recommended:` lines
and up to 900 characters of the answer:

| # | Lane, run | Hand | Auto | Note |
|---|---|---|---|---|
| 1 | P-2026-09-29-1230, 0 | adopted | adopted | «implement option (b) … as your report recommends» |
| 2 | P-2026-09-29-1826, 0 | adopted | adopted | Q1 adopted; Q2 parked for Alfonso (RC-26) |
| 3 | P-2026-09-29-2122, 0 | adopted | adopted | «yes, adopt your Recommended» |
| 4 | P-2026-10-01-2136, 0 | **changed** | go-silent ✗ | the GO adds T8 first, before the two recommended fixes |
| 5 | P-2026-10-01-2336, 0 | adopted | adopted | |
| 6 | P-2026-10-02-1718, 0 | adopted | adopted | |
| 7 | P-2026-10-03-0304, 1 | adopted | adopted | |
| 8 | P-2026-10-03-1302, 0 | adopted | adopted | «Inbox lane: views, as you recommend» |
| 9 | P-2026-10-03-1304, 4 | **Alfonso (deferred)** | go-silent ✗ | «it is Alfonso decision (RC-26), not mine: it stays parked» |
| 10 | P-2026-10-03-1304, 7 | alfonso | alfonso | «decision by Alfonso: option 2 plus 3», as recommended |
| 11 | P-2026-10-03-1632, 0 | adopted | adopted | |
| 12 | P-2026-10-03-1845, 0 | adopted | adopted | |
| 13 | P-2026-10-04-0946, 0 | adopted | adopted | |
| 14 | P-2026-10-05-1110, 0 | alfonso | alfonso | «GO from Alfonso. Extend scope» |
| 15 | P-2026-10-10-0045, 0 | **adopted** | go-silent ✗ | «Decisions taken by the chat (RC-25, unattended)», all four as recommended |
| 16 | P-2026-10-10-0105, 4 | alfonso | alfonso | «Alfonso ratified on 2026-10-10 at 17:16» |
| 17 | P-2026-10-10-0830, 0 | adopted | adopted | two answers adopted; D1 and D2 «are with Alfonso» |
| 18 | P-2026-10-10-0945, 0 | adopted | adopted | «Ratified as recommended (RC-21)» |
| 19 | P-2026-10-10-1600, 1 | alfonso | alfonso | critical-zone go-ahead |
| 20 | P-2026-10-10-2029, 0 | changed | overturned | «Approved by the chat, with one change … Bind the value as `target`, not `js`» |

**17/20.** The three errors are all in `go-silent`: a GO whose body carries the decision without a marker the rules
know. Two rules would fix two of them («Decisions taken by the chat» → adopted; «Alfonso decision (RC-26)», «stays
parked», «are with Alfonso» → deferred to Alfonso), but they were written after reading these rows, so a fix would
not be an independent check (the same caution as 1520 §4.2). Row 4 cannot be caught from text: the GO reorders and
extends the recommendation without saying so. Rows 2 and 17 show that one answer often carries several decisions
of different classes. The 1520 resume classifier has a related blind spot: P-2026-10-11-0008 input 2 begins «GO,
correction inside this lane before the merge» and is classed `go`, not `corrective` (`lane-board.mjs:614`).

### 3.3 Weekly trend (measured, `autonomy.mjs`, `rrows.mjs`)

| Week | Asks | Question exits | Hard stops with Recommended | Answered by resume | Adopted | Alfonso | Changed | GO no marker | Not resumed |
|---|---|---|---|---|---|---|---|---|---|
| 09-21 (09-26/27) | 25 | 12 | 13 | not paired (`msg-k.md`) | | | | | 25 |
| 09-28 | 63 | 20 | 43 | 31 | 20 | 6 | 0 | 4 | 32 |
| 10-05 | 25 | 7 | 18 | 17 | 6 | 6 | 1 | 4 | 8 |

Of the 65 asks without a resume, 33 are cited by a later non-merge prompt on the trunk; the cited paragraph states
its answer in a form the rules read in 3 (all `alfonso`) and in none of the other 30. 32 are cited by no later
prompt. Among them is P-2026-09-29-0011, whose lane ended `question` 12 days ago on `sim-data-level` (§4.3).

Of the 12 Alfonso answers, 8 name the critical zone or a go-ahead and 1 the MODELS demo. These are RC-26 classes,
so in this sample Alfonso decides where the list sends the decision; the keyword match is approximate.

R- rows of `docs/decisions.md` by the marker in their head (427 rows parsed, 261 dated from 2026-09-21):

| Week of the row | provisional, unattended | ratified as recommended, unattended | ratified/decided by Alfonso | decided/adopted by chat (delegated) | awaiting Alfonso | unmarked |
|---|---|---|---|---|---|---|
| 09-21 | 1 | | 24 | | | 78 |
| 09-28 | 58 | | 45 | 1 | 1 | 7 |
| 10-05 | 1 | 4 | 39 | 2 | | |

- **No row was ever acknowledged by digest.** `grep -n "ratified by digest" docs/decisions.md` returns one line,
  `:197`, the RC-25 definition itself: «the marker becomes `ratified by digest <date>` when Alfonso acknowledges».
  Control: the same grep for `ratified by Alfonso` returns 109 matches. The 60 `provisional, unattended` rows are
  dated 2026-09-26 (1), 09-30 (21), 10-02 (12), 10-03 (10), 10-04 (15) and 10-10 (1).
- 98 rows carry a dated ratification; the lag from the row date is 0 days in 73, 1 in 19, 2 in 5 (one row reads −1).
  A day is the finest grain the markers give, so the RC-28 «median wait» cannot be read from them.
- The register stores the current state of a row, not its path: a provisional row later ratified shows only the
  last marker (5 rows carry both words).

### 3.4 Which signal tells the chat from Alfonso (WHAT 2, second half)

Measured: only the answer text. `lane-run` writes the input verbatim (`lane-run.mjs:445-452`) and records no sender.
In the 48 answers the chat names itself («Chat decision», «adopted by chat C-…», «(RC-21, unattended)») and names
Alfonso when he decided («Alfonso decided on 2026-10-03», «GO from Alfonso»). There is no signal before RC-25,
because no lane folder predates it: the first folder is P-2026-09-26-2340, after the RC-25 ratification «procedi»
in chat C-2026-09-26-1702 on 2026-09-26 (`docs/decisions.md:187-190`). Earlier answers were Alfonso's pastes into
interactive sessions, outside `~/.jjodel-lanes/`.

## 4. Lead time and work left behind (WHAT 3)

### 4.1 Request time (measured, `reqtime.mjs`)

- `Request:` header line: 31 of the 182 lanes whose `input-1.md` exists (RC-43, from 2026-10-10). `request.md`: 28
  folders. This lane has the header and no `request.md`: `lane-run` only warns when `--request` is absent
  (`lane-run.mjs:920`).
- **`request.md`'s mtime is the start, not the request.** It equals `input-1.md`'s mtime in 27 of 28 folders. The
  exception, P-2026-10-10-0840, was written three hours after its lane, and says so: «recorded after the fact on
  2026-10-10 by the same chat».
- **The text often holds the time.** The chat writes the request with a stamp in free form: «Chat:
  https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN, 2026-10-10 12:50» (P-2026-10-10-1253), «Alfonso,
  2026-10-11 11:33: ho testato graphvertex…» (P-2026-10-11-1135). A `YYYY-MM-DD HH:MM` parses in 19 of 28; none in 9
  (P-2026-10-10-1500, 1532, 1612, 2020–2022, 2103, P-2026-10-11-0008, 1138).
- On the 17 finished lanes with a parsed time: request → prompt commit, median 4 min (n=16); request → trunk,
  median 48 min (10 to 118 min).
- The `Chat: C-…` line (181 of 182 lanes with `input-1.md`) gives the chat's start, a lower bound only: chat start →
  prompt commit is a median 5.7 h because one chat hosts many requests.

### 4.2 Segments per lane (measured, `lead.mjs`)

Routes:

- **Prompt commit:** the commit that added the prompt file (`git log --all --diff-filter=A -- docs/prompts/`, the
  board's `promptCommits()`, `lane-board.mjs:727`), author date. 237 of 242 non-merge lanes.
- **Start, end:** `/api/insights` `start` and `end` (the turns of `laneTimeline()`).
- **On the trunk:** the committer date of the first-parent trunk commit that brings the **last** of the lane's
  commits authored inside its window [start − 1 min, end + 2 min]. The window matters: without it the chat's
  closure commits on the trunk carry the lane's suffix and push the time past the merge. Positive control:
  P-2026-10-10-1520 reads 17:15:23 without the window (the chat's addendum `744beefbb`) and 17:09:44 with it, the
  merge `549409422`. 221 lanes have every windowed commit on the trunk; 9 do not (§4.3).

| Segment (non-merge lanes) | n | p25 | median | p75 | p90 | max |
|---|---|---|---|---|---|---|
| prompt commit → lane start | 237 | 0.00 h | 0.00 h | 0.00 h | 0.01 h | 3.2 h |
| lane start → lane end (span) | 242 | 0.25 h | 0.55 h | 0.99 h | 2.04 h | 289.7 h |
| lane end → on the trunk | 221 | 0.14 h | 0.39 h | 1.89 h | 8.70 h | 46.0 h |
| prompt commit → on the trunk | 218 | 0.59 h | 1.26 h | 4.20 h | 15.40 h | 47.0 h |

- The chat commits and launches in one step, so the prompt segment carries no information. 19 lanes of 2026-09-27/28
  start "before" their prompt commit by 0.1 to 34 min. Their start is the Prompt-ID's stamp
  (`lane-board.mjs:1047`), not a measure: clamp at 0.
- 11 lanes end after their trunk time (a resume after the merge); clamp at 0.
- Running lanes have no end; the window stays open and catches the chat's prompt commit (P-2026-10-11-1135 shows
  2 min to the trunk). Leave running lanes out.

### 4.3 Branches with commits not in the trunk (measured, `branches.mjs`)

197 local heads; 13 carry commits not reachable from `alfonso-frontend-jjtl`. "Differ" counts the branch's files
whose content still differs from the trunk (`git diff --name-only <trunk> <b> -- <files of trunk...b>`).

| Branch | Ahead | Last commit | Worktree | Last lane, outcome | Merge/take-trunk prompt | Differ | State (rule §4.4) |
|---|---|---|---|---|---|---|---|
| codegen-check | 1 | 0 d | ~/jjodel-w-codegen-check | P-2026-10-11-1053, running | none | 1/1 | in flight |
| codegen-names | 1 | 0 d | ~/jjodel-w-codegen-names | P-2026-10-11-1052, question | none | 1/1 | in flight |
| edge-label-edit | 4 | 0 d | ~/jjodel-w-edgelabel | P-2026-10-11-1001, hard-stop | none | 10/10 | in flight |
| fix-subclass-edge-gesture | 2 | 0 d | ~/jjodel-w-subclassedge | P-2026-10-11-1025, running | none | 1/1 | in flight |
| nested-vertices | 4 | 0.9 d | ~/jjodel-w-nestedvtx | P-2026-10-10-0830, hard-stop | none | 7/7 | in flight |
| petri-loop-disc | 4 | 1.0 d | ~/jjodel-w-petriloop | P-2026-10-10-1020, hard-stop | none | 4/4 | in flight |
| elk-handles-a3 | 5 | 1.1 d | ~/jjodel-w-elkhandles | P-2026-10-10-0915, hard-stop | none | 11/11 | in flight |
| codegen-pilot | 1 | 1.1 d | ~/jjodel-w-codegen | P-2026-10-10-0815, hard-stop | none | **0/2** | superseded |
| auto/65-feature-enhancement-… | 1 | 7.7 d | ~/jjodel-a-65 | P-2026-10-03-1846, hard-stop | none | 1/1 | by design (RC-37) |
| sim-node-disc | 2 | 8.5 d | ~/jjodel-w-simnode | P-2026-10-02-2345, hard-stop | none | 3/3 | **left behind** |
| validation-skeleton | 6 | 10.6 d | ~/jjodel | none | none | 12/12 | **left behind** |
| sim-data-level | 2 | 12.5 d | ~/jjodel-w-datalevel | P-2026-09-29-0011, **question** | none | 3/3 | **left behind** |
| backup/spike-locale-2026-07-18 | 5 | 85.5 d | none | none | none | 15/17 | by design (backup) |

- "Merge/take-trunk prompt": none of the 13 is named by a `_prompt_merge_<b>.md` or `_prompt_<b>_take_trunk` on
  the trunk or in `~/.jjodel-lanes/pending/`. Control: `pending/` holds 37 such prompts for other branches.
- The same 9 lanes appear from the lane side (`lead.mjs`): P-2026-09-29-0011, P-2026-10-02-2345, P-2026-10-03-1846,
  P-2026-10-05-1705 and 1720 (`harness-req-tab`, ported), P-2026-10-10-0815 (2/3 on the trunk, by cherry-pick),
  0830, 0915, P-2026-10-11-1001.
- `sim-node-disc` is named on the trunk only to say it is out: «node.[x] discovery report is on sim-node-disc at
  8bd04b0c4, not merged» (a merge body, read with `git log --format=%B`). `validation-skeleton` was reintegrated
  on 2026-09-21 (`4d397ac02`); its 6 later commits are docs, the last «docs: update MDE Intelligence 2026 paper and
  metrics snapshot» (2026-09-30).
- **`harness-req-tab` is no longer a branch.** It is the tag `refs/tags/archive/harness-req-tab-2026-10-10` (the
  repository keeps four `archive/<branch>-<date>` tags). Its tip `35240a582` is dated 2026-10-05; the trunk's port
  names it: «ported by P-2026-10-11-0008 from branch harness-req-tab 35240a582» (`lane-board.mjs:1194-1195`).
- A free-text search of trunk messages for «port|supersed|replac» near a branch name gave three false positives
  (`nested-vertices` in a probe subject, `sim-node-disc` in the «not merged» line, `validation-skeleton` in its
  reintegration). Text is not a superseded signal; content is.

Cost (load average 25 to 31):

| Operation | Time |
|---|---|
| `git for-each-ref refs/heads --format='… %(ahead-behind:alfonso-frontend-jjtl)'`, 197 heads | 0.63 s |
| `git rev-list --count <trunk>..<b>` per head, 197 heads | 19.5 s |
| `git cherry <trunk> <b>`, 13 branches | 29.3 s |
| `git diff --name-only <trunk>...<b>`, then `git diff --name-only <trunk> <b> -- <files>`, 13 branches | 1.9 s |
| `git log <trunk> --since=2026-09-20 --format='%H %P %ct'` (2050 commits, for the trunk arrival) | 0.72 s |

`for-each-ref` needs the `%1f` escape, not `git log`'s `%x1f`: the first run of the probe split nothing and
reported 0 branches. The `ahead-behind` atom exists in git 2.50.1 here.

### 4.4 Proposed rule: in flight, superseded, left behind

For a local branch `b` with `ahead > 0` against the trunk:

1. **Superseded** when no file it changed differs from the trunk (differ = 0), or a tag `archive/<b>-*` exists.
   Today: `codegen-pilot`.
2. **By design** when `b` matches `auto/*` (RC-37: «the automation never merges») or `backup/*`. Shown greyed, not
   counted.
3. **In flight** when a live lane runs in the worktree that holds `b`, or the latest of (its last commit ahead, the
   last exit of a lane in that worktree) is under 48 hours old.
4. **Left behind** otherwise. Age = now minus that latest activity. A last lane that ended `question` is named, since
   it means an unanswered question (`sim-data-level`).

Replayed on `harness-req-tab`: last commit and lane exit on 2026-10-05, so in flight until 2026-10-07, then left
behind, then superseded from 2026-10-10 (the tag). The board would have shown it three days before the chat found
it.

## 5. Secondary (WHAT 4)

**4. The RC-23 visual check.** Present partly; it cannot be read from the log field.
- The `Smoke visivo` field is written by the lane before the chat's check: «passato (lane probe 29/29 on 3089; …
  the visual GO of the chat is pending)» (P-2026-10-10-2029). Of the 249 non-merge lane-era entries, 39 read
  pending and 19 "passed, Alfonso pending"; none is updated after the GO, by design (RC-17: one closure commit).
- The resumes carry the outcome. 95 of the 184 resume inputs name a visual check; **7 send the lane back**
  (`corrective`): 3 before 2026-10-04 (P-2026-10-03-0041, 0120, 1420), 4 after (P-2026-10-04-1625,
  P-2026-10-10-1253, 1520, 1757). The 1520 classifier misses an eighth, P-2026-10-11-0008 («GO, correction inside
  this lane before the merge»). Causa (d) on correcting entries since 2026-09-26: 5.
- Sampling: resumes that name a visual check and Alfonso, 24 of 62 before 2026-10-04, 7 of 33 after. The direction
  holds; whether the sampled GO misses defects cannot be told, since a missed defect would appear as a later
  Corregge (d), and `Corregge` was barely filled in that week (§2.1).
- Since: the lane folders, 2026-09-26.

**5. Cost.** Present from the first lane, P-2026-09-26-2340: 311 of 318 session lanes have a `total_cost_usd`;
direct merges have none. `/api/insights` already serves `costUSD` (the last cumulative value, 1520 addendum),
`tier` and `model`. Medians: heavy Opus 5.5 $7.19 (n=194), no tier Opus 5.5 $3.04 (96, before lane-run v3),
light Sonnet 5.5 $2.31 (22), light Sonnet 5 $6.21 (6). By kind and first-shot: phase2 $10.27 first-shot (85) and
$12.03 not (31); fast $2.54 and $3.60; discovery $9.88 and $10.39. The 1520 report already shows median cost by
model and size band; no new card is needed. Chain cost goes into card B.

**6. Concurrency against first-shot: feasible, not worth a card now.** `/api/timeline` already carries every
turn, so the mean number of other lanes working during a lane is computable with no new data (`conc.mjs`, one-minute
samples). Measured: first-shot 72% at about 0 other lanes (n=60), 77% at 1 (86), 83% at 2 (81), 80% at 3 (70),
93% at 4 or more (15). No harm shows, but the chat parallelizes lanes whose DOVE lists are disjoint (RC-22), which
are the easier ones, and the eras of 1520 §6.2 overlap. A chart would show selection, as the model chart did before
RC-45.

## 6. Contract per card (WHAT 5)

All new server data ride `/api/insights` (`insights()`, `lane-board.mjs:1065`), built in the same flight as
today: entries and R- rows re-read when the trunk moves (`:913`), git facts when the `for-each-ref` hash moves
(`:886`), per-lane log facts in the per-lane cache. New git calls use `gitAsync` (`:865`), never `spawnSync`:
lane P-2026-10-11-1205 measured that a synchronous child blocks every route. Aggregation stays client-side by
range, as today. Counts are always shown; a rate or a median is hidden below `MIN_RATE` (5) and greyed below
`MIN_READ` (10), `insights.js:203`. Names checked unused with `grep -rn` over `frontend/scripts/lane-board/` and
the three board tests: `logCauses`, `correctionChains`, `rowMarkers`, `answerCls`, `branches`, `promptAt`,
`trunkAt`, `requestAt` (0 hits each); `asked` appears once, in README prose. Not `rework` (a per-lane boolean
today, `:1038`) and not `chains` (the `lane-run chain` reader, `:702`).

### A. Why work is redone (slice S1)

- **Source:** the P9 entries of the trunk, `logEntries()`.
- **Server:** `logEntries()` resolves `cPid` from the timestamp prefix first (§2.3), and each entry gains `date`
  (its heading) and `trigger`. New top-level `logCauses: [{ date, pid, cPid, causa, outcome, trigger }]`, one row
  per task entry since 2026-08-02 whose `Corregge` is filled (`trigger: 'corregge'`) or whose outcome is ⚠️/❌
  (`'outcome'`). New `logWeeks: [{ week, tasks, corregge, due, dueWithCausa }]`, the discipline of §2.1. Per lane,
  `signals.visualSendBack: true` when a corrective resume names a visual check (§5).
- **Formula:** per week (Monday), a bar stacked by Causa letter, the two triggers side by side; beside it the
  in-lane sendbacks at the visual check (from `ins.lanes`), labelled d (in lane). Note: «Corregge filled in X of Y
  task entries in this range; Causa given in A of B where due.»
- **Title / subtitle:** «Why work is redone» / «Causa (CLAUDE.md §21.3) of the log entries that correct an earlier
  lane or end ⚠️/❌, by week of the entry; d (in lane) is a lane sent back at its visual check.»
- **Cost:** none per refresh; entries are cached on the trunk sha.
- **Test that fails before:** in `laneBoard.test.ts`, the fixture repo gets a branch `alfonso-frontend-jjtl` holding
  `docs/claude-code-log.md` with an entry for P-2026-10-05-0900 whose `**Corregge**: 2026-10-05 08:00 (… red at the
  merge P-2026-10-05-1000)` and `**Causa**: (c)`. `/api/insights` must list P-2026-10-05-0900 in
  `correctedBy` of P-2026-10-05-0800 and in no list of P-2026-10-05-1000. Today it marks 1000. It must also return
  `logCauses[0].causa === 'c'`, absent today. In `laneBoardInsights.test.ts` (the node:vm harness of
  P-2026-10-11-1138), a fixture `logCauses` must draw a `(c)` segment with its tooltip.

### B. How many lanes to close a request (slice S1)

- **Source:** the edges of A (corrector → corrected, self-corrections dropped), `costUSD` of each lane.
- **Server:** `correctionChains: [{ root, lanes, depth, causa, costUSD, from, to }]`, the root first, `lanes` by
  depth, `causa` the letters along the chain.
- **Formula:** depth counts (2, 3, 4+) of the chains whose root is in range, beside the number of lanes in range
  never corrected; the five deepest with their Causa sequence and summed cost; the median corrector cost against
  the lane it corrects (0.49 today).
- **Title / subtitle:** «How many lanes it takes to close a request» / «A chain is a lane and every later lane whose
  Corregge names it, directly or through another corrector; cost is list price, the last total_cost_usd of each
  session.»
- **Cost:** none (in memory, from A).
- **Test that fails before:** entries A, B correcting A, C correcting B: one chain, depth 3, `lanes` [A, B, C],
  `causa` in order.

### C. Who takes the decisions (slice S3)

- **Source:** per run, the `result` text (`results()`, `lane-board.mjs:529`); per resume, `input-k.md`; the R- rows
  of `decisions.md` (`rcRows()`, `:978`, today RC-20 on only).
- **Server:** per lane `asked: [runIndex, …]` (a `question` exit or `Recommended:` lines in the result) and
  `answerCls: [{ run, cls }]`, `cls` ∈ adopted | alfonso | deferred | changed | go-unmarked | other, from the §3.2
  rules plus the two fixes of the hand check, declared not independent. Both ride the per-lane cache, so its key
  goes from `'v6'` to `'v7'` (`:647`); a one-time full pass costs about 1.5 s (1520 §7.2). Top-level
  `rowMarkers: [{ id, date, marker }]` for every R- row.
- **Formula:** per week, asks, answered by resume, by class, not resumed; adoption rate = adopted / answered,
  hidden below 5. A second table: R- rows by marker and week, and «provisional, unattended, never acknowledged: n».
- **Title / subtitle:** «Who takes the decisions» / «Questions a lane asked (an Outcome: question, or a hard stop
  with Recommended: lines) and the resume that answered: as recommended by the chat, by Alfonso, changed, or a GO
  without a marker. Read from the answer's text: 17 of 20 right on a hand-checked sample.»
- **Cost:** none for exited lanes after the v7 rebuild; `decisions.md` is read when the trunk moves, as today.
- **Test that fails before:** a lane whose run 1 result ends «Recommended: yes» and «Outcome: question», with
  input-2.md «Answer: adopted as recommended (RC-21, unattended)», gets `asked: [0]` and
  `answerCls: [{ run: 0, cls: 'adopted' }]`; a second lane with «Alfonso decided on 2026-10-05: option B» gets
  `alfonso`. A `decisions.md` row «(2026-10-05, provisional, unattended, …)» gives `rowMarkers` with that marker.

### D. From prompt to trunk (slice S2)

- **Source:** `promptCommits()` (`:727`, 5-minute memo), the turns, one `git log <trunk> --since=<first lane − 2 d>
  --format='%H %P %ct'` walked in JS (first parent: the commit's own time; a merge: its time for every commit it
  brings), `request.md` text.
- **Server:** per lane `promptAt`, `trunkAt` (null while any windowed commit is off the trunk, and for running
  lanes), `offTrunk` (count), `requestAt` (the first `YYYY-MM-DD HH:MM` of `request.md`, else null).
- **Formula:** per kind and per week, the median and p90 of span (start → end), merge wait (end → trunk) and prompt
  → trunk, each clamped at 0; request → trunk where `requestAt` exists, with its n; the ten slowest prompt → trunk.
- **Title / subtitle:** «From prompt to trunk» / «Prompt commit, lane start and end, and the trunk commit that brings
  the lane's last commit; the request time where request.md states one. Running lanes are left out.»
- **Cost:** 0.72 s of git at load 25 when the trunk moves, asynchronous; in memory otherwise.
- **Test that fails before:** fixture repo: the prompt `docs/prompts/claude_2026-10-05_0800_prompt_x.md` added on
  the trunk; on branch `b` a commit «feat: x (P-2026-10-05-0800)» inside the lane window; `git merge --no-ff b` into
  the trunk at a known committer date; then a trunk commit «docs: Status flip (P-2026-10-05-0800)» outside the
  window. `trunkAt` must equal the merge's committer date and `promptAt` the add commit's author date. Mutation
  bench: drop the window and the test turns red on the Status commit.

### E. Work left behind (slice S2)

- **Source:** `git for-each-ref refs/heads --format='%(refname:short)%1f%(objectname)%1f%(ahead-behind:<trunk>)'`;
  for the heads ahead, `git log -1 --format=%ct <trunk>..<b>` and the two-step content diff of §4.3; `git worktree
  list --porcelain`; the lane folders' `worktree.txt`, `pid.txt` and `exit.txt`; the `refs/tags/archive/*` names.
- **Server:** `branches: [{ name, ahead, behind, lastAt, worktree, lanes, lastLane, lastOutcome, differ, state }]`,
  `state` by the rule of §4.4. Per head, the result is cached by (branch sha, trunk sha); a rescan touches only the
  pairs that moved, in the same flight as the `for-each-ref` hash check. A trunk move rescans every head ahead
  (2.5 s today).
- **Formula:** left behind first, by age; then superseded (candidates for an `archive/` tag); in flight below,
  collapsed; by design greyed. No rate.
- **Title / subtitle:** «Work left behind» / «Local branches with commits the trunk does not have: in flight while a
  lane runs on them or they moved in the last 48 hours, superseded when the trunk already has their content.»
- **Cost:** 0.6 s per ref move, plus about 0.15 s per moved branch ahead.
- **Test that fails before:** fixture repo with three branches: `old` (a commit dated 5 days ago, content not on
  the trunk) → `left-behind`; `same` (a change the trunk also has) → `superseded`; `fresh` (a commit now) →
  `in-flight`. `branches` is absent today.

## 7. Slices (WHAT 6)

Each is one lane. They share files with each other and with P-2026-10-11-1205 (`board-loading`: `lane-board.mjs`,
`README.md`, `laneBoard.test.ts`), so RC-22's first check fails: **they run one after another, after 1205
merges**. Each touches five files, so each is `Lane: full (more than 3 files)` under RC-3. None is in the critical
zone, none changes what the MODELS demo shows, none is drawn under RC-45 (full lanes).

| Order | Slice | Cards | Files | Value | Cost |
|---|---|---|---|---|---|
| 1 | **S1 Rework causes** | A, B; `cPid` fix; visual sendbacks | `frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoard.test.ts`, `frontend/scripts/hooks/__tests__/laneBoardInsights.test.ts` | high: the first request, plus a wrong attribution today | low: the entries are already parsed and cached |
| 2 | **S2 Lead time and work left behind** | D, E | same five | high: catches the `harness-req-tab` class while it is open | medium: two new git reads, a per-pair cache |
| 3 | **S3 Decision autonomy** | C | same five | medium: feeds the RC-26/RC-28 review; error 3/20 | medium: cache v7, classifier, the `decisions.md` parse |
| 4 (optional) | **S4 Request time and answer class as data** | inputs of C and D | `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`, the prompt template's request lines | medium: turns two heuristics into data | low |

The order departs from the chat's 1-2-3 by putting lead time before decision autonomy: S2 is cheaper and its card
is operational; S3's numbers are the least certain.

S4, in detail: `lane-run start` warns when `request.md` has no first line `At: YYYY-MM-DD HH:MM` (the chat writes
the time Alfonso asked, as it already does in 19 of 28 files in free form); `lane-run resume` and `go` take
`--answer adopted|alfonso|deferred|changed` and write `answer-<k>.txt` beside `input-<k>.md`. The board reads both
first and falls back to the text.

## 8. RC-22 and the trunk during this run

- Measured on the four worktrees the chat named. `git diff --stat alfonso-frontend-jjtl...<branch> --
  frontend/scripts/lane-board/` prints nothing, exit 0, for `codegen-names`, `codegen-check`,
  `new-model-instantiate` and `do-tickets`. `git status --porcelain -- frontend/scripts/lane-board` is empty in each.
  Control: the same diff without the path lists 1 file for `codegen-names` and `codegen-check`.
  `new-model-instantiate` and `do-tickets` are 0 commits ahead, so their committed side is empty by construction.
- **But the board was not quiet.** During this run the trunk took `3f5e33827` «feat(harness): first-shot squares on
  the time axis (P-2026-10-11-1138)» through the merge `899d5aa07` (P-2026-10-11-1152): `insights.js` +24/−13 in
  `timeCard`, and a new `frontend/scripts/hooks/__tests__/laneBoardInsights.test.ts` (186 lines, insights.js in
  node:vm with a stub DOM). And `1ec75cd32` added P-2026-10-11-1205, «Lane board: a loading indicator…», on worktree
  `~/jjodel-w-boardload`, branch `board-loading`, whose DOVE is «`frontend/scripts/lane-board/lane-board.mjs`,
  `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoard.test.ts`». Slices S1–S3 start
  from a trunk tip after 1205.
- Trunk tips seen: `cbbc1a204` (cut, 11:50), `bc5b997c1` (11:56, when `/api/insights` was read), `66ee3830d`
  (12:05). The commits between `cbbc1a204` and `bc5b997c1` changed no log entry used in §2, only prompts and
  `docs/log-inbox/harness.md` (+26, two entries of 1138/1152, not in §2's counts).

## 9. Files read and probes

Read:

- `/Users/alfonso/jjodel-w-insightsmore/CLAUDE.md` (session context); `docs/PROTOCOL.md` whole;
  `docs/decisions.md` lines 9–20 and 118–291, plus a full parse of row heads (`rrows.mjs`);
  `docs/ratifiche/claude_ratifiche_2026-09-26_ratification_by_invariants.md` lines 10–40.
- `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md` whole.
- `frontend/scripts/lane-board/README.md` whole (259 lines), `insights.js` whole (431 lines at `cbbc1a204`),
  `lane-board.mjs` lines 26–100, 420–1110 and 1194–1198 (of 1476), `timeline.js` not read (no claim depends on it).
- `frontend/scripts/hooks/__tests__/laneBoard.test.ts` lines 585–741;
  `frontend/scripts/hooks/__tests__/laneBoardInsights.test.ts` lines 1–70 at the trunk tip (`git show`).
- `frontend/scripts/gates/check-docs.ts` lines 1–40 and 255–330; `frontend/scripts/gates/log-tools.ts` lines 1–80,
  225–260, 320–360.
- `frontend/scripts/lane-run.mjs` lines 28–48, 440–456, 905–925.
- The trunk's `docs/prompts/claude_2026-10-11_1205_prompt_lane_board_loading_stale.md` lines 1–60 (`git show`).
- Log sources at `cbbc1a204`: `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`, 31
  `docs/log-inbox/*.md`, parsed whole.
- `~/.jjodel-lanes/P-*/` (453 folders): `log.jsonl` (result events), `input-*.md`, `msg-*.md`, `request.md`,
  `exit.txt`, `started.txt`, `worktree.txt`, `prompt.txt`, `tier.txt`, `auto.json` of this lane;
  `~/.jjodel-lanes/pending/` and `auto/night-2026-10-11/digest.md` (listing and head).
- `git for-each-ref`, `git worktree list --porcelain`, `git log --all`, `git log --first-parent` of the trunk.
- `/api/insights` and `/api/timeline` from a throwaway board on port 4791, started from this tree with
  `LANE_BOARD_CACHE=/tmp/p1150/board-cache.json` and stopped after two requests. The launchd board, port 4700 and
  `~/.jjodel-lanes/board/` were not touched: `timeline-cache.json` there kept its 11:46 mtime.

Probes, in `/tmp/p1150/`, not in the repo:

| Probe | What it measures |
|---|---|
| `logs.mjs`, `coverage.mjs`, `recent.mjs`, `cpid.mjs` | §2.1, §2.3 |
| `chains.mjs` | §2.2, §2.4 |
| `qa.mjs`, `pairs.mjs`, `classify.mjs`, `autonomy.mjs`, `nextprompt.mjs`, `rrows.mjs` | §3 |
| `lead.mjs`, `reqtime.mjs`, `branches.mjs` | §4 |
| `smoke.mjs`, `visual.mjs`, `cost.mjs`, `conc.mjs` | §5 |

## 10. Dependencies and risks

1. **RC-18, the harness budget.** Proxy over the last seven days (non-merge lanes from P-2026-10-04-1200 on, from
   `/api/insights`): 19 of the 49 lanes with code touch only the harness area, 39%. RC-18 allows «al più una corsia
   su quattro» and, over it, «solo corsie di harness che riparano un enforcement che si è mostrato non tenere»
   (`docs/decisions.md:126-131`). S1–S3 are new views, not repairs. The chat measures RC-18 with its own script; if
   it confirms, launching them departs from a ratified row (RC-26) and is Alfonso's call.
2. **Corregge drift and right-censoring.** Card A over the last 7 days shows little rework because the field was
   barely filled (§2.1), and recent lanes have had little time to be corrected. Carry `logWeeks` and `ageDays` and
   say so on the card.
3. **The answer classifier is text.** 17/20, errors concentrated in one class; one answer often holds several
   decisions. Card C must print its error and n.
4. **`request.md` times are the chat's statement**, at minute precision, in free form; 9 of 28 have none.
5. **Trunk-tip logs only** (1520 risk 5): entries of unmerged branches are invisible, so lanes of the last day lack
   their entries and their Causa.
6. **The trunk arrival depends on the run window.** A lane resumed after its merge (11 lanes) or a cherry-picked
   commit (P-2026-10-10-0815, 2 of 3 on the trunk) reads off; clamp and count them.
7. **Branch states depend on the clock.** "In flight" for 48 h is a choice; a lane waiting a visual GO for longer
   (`elk-handles-a3`, A3 resumed after Malaga) will read left behind, which is the point.
8. **Load.** Every time in §4.3 was taken at load 25–31; the 1205 lane reports a load of 45 and a blocked event loop.
9. **Shared files.** Every slice edits the same five files as its neighbours; the queue of §7 is not optional.

## 11. Decisions taken (unattended) and decisions awaiting Alfonso

Taken in this report, as methodological choices for the slices to adopt or reject (none written to
`docs/decisions.md`):

- `Corregge` resolves by its timestamp prefix first;
- a chain's depth counts lanes along the longest path, self-corrections dropped;
- an ask is a `question` exit or a result with `Recommended:` lines; its answer is the next resume;
- the trunk arrival is that of the last commit inside [start − 1 min, end + 2 min];
- the four branch states of §4.4, with 48 hours for in flight;
- no concurrency card.

Awaiting Alfonso (RC-26 list): **one**. Whether S1–S3 launch while RC-18's harness budget is over (§10.1), which
departs from a ratified row. Nothing here touches the critical zone, an exported interface, the MODELS demo, model,
effort or cost of sessions, a deletion or the push.

## 12. Open questions

1. Card order?
   Recommended: S1, then S2, then S3, one at a time after P-2026-10-11-1205 merges; S4 when the chat next touches lane-run.
2. Fix the `Corregge` resolution order in S1?
   Recommended: yes, the timestamp prefix first, then a Prompt-ID, then a file name, as `check:docs` reads the field.
3. Where does the answer class come from?
   Recommended: the text classifier with its measured error in S3, and `lane-run resume|go --answer <class>` in S4 to replace it.
4. Request time?
   Recommended: a first line `At: YYYY-MM-DD HH:MM` in `request.md`, which `lane-run start` warns about when missing (S4); the board parses the first stamp meanwhile.
5. Left-behind threshold?
   Recommended: 48 hours since the last commit or lane exit; `auto/*` and `backup/*` shown apart as by design.
6. RC-18?
   Recommended: the chat measures the budget with its own script before S1; over budget, S1 waits unless Alfonso waives it in the digest.
7. Should the 60 never-acknowledged `provisional, unattended` rows be put to Alfonso in one digest?
   Recommended: yes, as a list ordered by consequence; card C shows the count either way.
