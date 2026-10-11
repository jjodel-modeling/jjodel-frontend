# Threats to validity: material for the authors (CAIN 2027 full paper)

Prompt-ID: P-2026-10-11-1725 · written 2026-10-11 · expands §9 (T1..T9) of
`discovery_2026-10-11_governance_dataset.md`. Material, not paper prose. Each threat says what it does to which
number, and what the paper can do about it. Numbers come from `data/` and from
`discovery_2026-10-11_rq_tables.md` (the RQ report of this lane); the 1630 ids T1..T9 are kept in brackets.

## Construct validity (do the measures measure the rules?)

- **C1. Commit origin is a heuristic [T5].** `lane-or-local` mixes lane sessions with local interactive sessions;
  `chat` is a subject or trailer pattern. *Affects:* every RQ1 commit row, the gradient hook vs chat. On the hook
  path, 920 of 991 commits carry a lane id, and 23 of the 37 `Model:` misses (the other 14 have none, so they are
  likely local sessions): the lane-attributed rate is 0.025 against 0.037. *Paper:* report both rates; state the
  three origin rules in one sentence each; say that the chat class is defined by artifacts the chat writes.
- **C2. A landed violation is not an attempted one.** RQ1 counts violations that reached the history. The hook
  blocks before landing: 17 `Model:`, 30 subject and 5 docs/code denials in lane transcripts, followed by a
  committed retry in a median 8.7 to 13 s. Lane transcripts exist only for lanes started by the lane runner
  (first denial seen 2026-09-27), so interactive sessions' denials are invisible. *Affects:* the hook row looks
  better than the behaviour of the agent: the agent breaks the rule, the hook holds it. *Paper:* report attempts
  (landed + blocked) beside landed, on the lane-runner window only, and say that the hook is measured as a filter,
  not as a teacher.
- **C3. RC-26 classes are read from text [T2, T5].** Seven regexes (precision 0.63 on 108 candidates), then an
  agent's row-by-row check; a human has not yet judged. 3 of 30 sampled negatives were positives, so 34 crossings
  is a lower bound (2 to 31 more among 118 negatives, Clopper-Pearson 95%). *Affects:* RQ2 RC-26 counts and the
  share that did not wait (0.479; 0.393 when the 10 delegated rows are set apart). *Paper:* use the reviewed numbers
  of `data/rc26_reviewed.csv` once Alfonso has filled `review/rc26_review.md`; keep the agent's as a sensitivity.
- **C4. "Acknowledged within 2 days" is the lane's window, not RC-25's.** RC-25 says a digest «at the close of
  every lane»; the 2-day window is a choice of the 1630 lane. *Affects:* the RC-25 daily rate. The latency
  distribution (median 8 days, p25 6, p75 10) is window-free. Measured on the 105 provisional rows written up to
  2026-10-10: late with a 1-day window 82 (0.78), with 2 to 5 days 77 (0.73), with 7 days 54 (0.51, but 25 of
  those windows close only after the cut). *Paper:* report the latency, and the window only as an illustration
  with this sensitivity line.
- **C5. "Detected" means detected in a committed artifact.** RQ2 and RQ3 find a notice only when it was written into
  the repository (digest, report, checkpoint, ratification marker, commit). A remark in the chat that left no file
  is invisible. *Affects:* `never` is "not recorded", and every detection latency is an upper bound. *Paper:* say
  so in the definition; the claim "nothing noticed" becomes "nothing recorded a notice".
- **C6. The grammar is today's parser [§12 of 1630].** Conformance uses `docs-digest.ts` as it is at the ref, imported.
  A header written before a later grammar change is judged by the later grammar. *Affects:* RQ1 grammar row (66 of
  226 non-conforming at their first commit), RQ3 grammar episodes. *Paper:* pin the parser commit in the artifact;
  report the 5 kinds of failure, so a reader sees that most are not grammar edge cases (free text, multi-line
  headers, separators).
- **C7. Check position is assigned per rule, by a curated map.** `scripts/rules-enforcement.csv` was drafted by a
  helper agent and curated by the 1630 lane. A rule whose check runs in two places (`Front:` in `lane-run start`
  and in `check:docs`) is placed by the earliest one that blocks. *Affects:* the RQ1 ordering. *Paper:* publish the
  map with its `file:line` evidence (paraphrased in the artifact) and the rule for choosing the position.
- **C8. Who writes the text is a second treatment.** Lines a template writes hold without a check (`Chat:` 0 of
  182; the lane runner's `Model:` trailer 14 of 377); lines a template does not write drift under a warning
  (`Request:` 29 of 65). *Affects:* the RQ1 monotonicity, which fails exactly on template-written lines.
  *Paper:* add "written by a template" as a column of the RQ1 table and discuss it as the reason the ordering is
  not monotone, not as noise.

- **C9. The status marker is not the practice.** RC-26 "waited" is read from the row's marker. For 15 of the 34
  crossings an act of Alfonso (GO, acceptance, ratification) is recorded before or at the row's trunk arrival;
  three rows (R-SIM-80..82) carry his ratification in the section intro, in a word order the 1630 reader does not
  match; one (R-SIM-87) is an id reused across branches. *Affects:* RC-26 crossings, 34 by marker against 13 with
  neither a delegation nor a prior act (`data/rc26_reviewed.csv`, `crossings_no_prior_act`). *Paper:* report the
  three readings (marker, without delegation, without prior act) and say which one the claim rests on; the
  review sheet flags the 15 rows for Alfonso.
- **C10. Two artefacts of the 1630 script.** Section-level ratification in Italian is missed (C9), and a header
  repaired on a branch is dated at the next trunk commit touching the register (`governance-dataset.ts:358-362`,
  three rows, corrected in the RQ tables through `scripts/detection-evidence.json`). *Affects:* RC-26 counts (3
  rows) and three grammar repair latencies (by 9 h). *Paper:* fix both in the 1630 script before the camera-ready
  dataset, or keep the correction file and say so.

## Internal validity (is the difference caused by the check?)

- **I1. Period confound.** The hook arrived 2026-09-21, the judgment rules 2026-09-26. Restricting RQ1 to
  2026-09-26 on moves the hook row from 0.037 to 0.039 and the chat row from 0.547 to 0.593 (`Model:`), and leaves
  the prompt and grammar rows unchanged. The no-hook-in-tree lane row falls from n = 32 to n = 1, so that contrast
  exists only before 09-26. *Paper:* report the restricted window as the main one for the RQ1 vs RQ2 comparison.
- **I2. The intervention was triggered by the research line [T4].** The 1430 digest that led to the 2026-10-11
  ratification wave was commissioned by this research line, and so was the 1150 report that first measured RC-18
  and first said that no row had been acknowledged by digest: all three carry the same chat and Request session
  as the 1630 and 1725 lanes. The first notice of 7 of the 13 hard-core RC-26 crossings, of 39 of 77 late RC-25
  rows, of both RC-18 days and of 62 of 67 grammar failures belongs to the research line. *Affects:* every RQ3 detection dated 2026-10-11, and
  the repair counts at `c6804f3d3` (59 headers, 76 rows). The observer effect is the finding's mirror image: without
  the research line, the record shows no detection at all for those items before the ref. *Paper:* end the series before `c6804f3d3`, report the
  wave as a treatment, and flag the detections that belong to the research line (`detected_by_research_line`).
- **I3. The governed agents write the evidence [T2, T3].** Row text, section intros, status markers and log
  fields are written by the agents the rules govern; the register stores only the last marker. *Affects:*
  text-based measures (RC-26, RC-25 status, autonomy classes) are lower bounds; git-based ones are not affected.
  *Paper:* say which numbers are text-based.
- **I4. Hook reach is per tree [T8].** A hook acts only in a tree whose branch carries it. *Affects:* a calendar
  cut understates the hook's effect; RQ1 splits by ancestry instead. *Paper:* use the ancestry split.
- **I5. Enforcement is confounded with form [T6].** 16 of 18 auto-blocking rules check a form; no judgment rule
  has a check. *Affects:* RQ1 vs RQ2 cannot separate "no check" from "needs judgment". The grammar row is the
  closest natural control: checkable, check exists, nobody runs it, and it drifts like a judgment rule (0.29 of
  rows non-conforming at their first commit, repaired in one batch). *Paper:* make the grammar the pivot of the
  argument, and say that a judgment rule given a check would be the experiment.
- **I6. Concurrency and clocks.** Lanes run in parallel; commit times are committer times on one machine's clock;
  days are local calendar days. *Affects:* day buckets near midnight, and latencies of minutes. *Paper:* report
  latencies in days for the register, seconds only where the event is within one session.
- **I7. Lane transcripts are incomplete and growing.** The lane folder grew during the analysis (the autonomy
  table gained 2 lanes between the 1630 and the 1725 runs); some lanes have no log. Frozen in
  `~/jjodel-cain-archive/lanes_2026-10-11.tar.gz`. *Affects:* denial counts, launch-time header checks,
  autonomy. *Paper:* cite the archive's sha256 in the artifact description.

## External validity (does it generalise?)

- **E1. One project, one decider [T1].** One harness, one maintainer whose answers are the "waiting" side of
  RC-26 and RC-25. *Paper:* a case study; claim mechanisms, not rates.
- **E2. One agent family.** Lanes ran Claude Opus 5 and 5.5, Sonnet 5.5 on the light tier, and Fable 5.1 in some
  chats. Compliance with a text rule may depend on the model. *Affects:* the text-only rows. *Paper:* name the
  models; per-model rates are possible from the `Model:` trailers, but the trailer is itself the measured rule.
- **E3. A harness that changes daily.** 33 rules, 21 of them with a check within a day of the rule; rules RC-42..45
  have 1 to 6 days of data [T7]. *Paper:* treat the period as non-stationary; avoid rates pooled across rule
  changes.

## Conclusion validity (are the numbers strong enough?)

- **K1. Small cells.** `Front:` 17 prompts, 2 violations; no-hook lane commits 32 (1 after 09-26); RC-18 2 days
  over budget; 5 grammar repairs before the wave. *Paper:* give n beside every rate; no rate on n < 20 in the
  abstract.
- **K2. Commits are clustered.** Commits of one lane share a session, a prompt and a model; a per-commit binomial
  interval is too narrow. *Paper:* if intervals are given, bootstrap by lane (Prompt-ID); the lane id is in the
  CSVs for the lane-attributed share.
- **K3. Definitions chosen after seeing the data.** The origin heuristic, the RC-26 regexes, the 2-day window and
  the RQ1 positions were fixed by the two research lanes with the data in view. *Paper:* report the sensitivity
  rows (lane id, window, attribution route, restricted period) and state that no definition was tuned on the
  outcome of the RQ comparison; the parity checks of the scripts make the definitions auditable.
- **K4. Monotonicity on point estimates.** The RQ1 ordering is read on rates, without intervals. *Paper:* say
  "ordered" only where the gap is large against n (hook 0.037 vs chat 0.547 at n = 991 and 411); call the rest
  "not distinguishable".
- **K5. Repairs depend on the cut.** 59 of 64 header repairs and 76 of 97 ratifications fall in the intervention.
  *Paper:* report repairs before the cut separately (5 headers, 21 ratifications) and the wave as a single event.
