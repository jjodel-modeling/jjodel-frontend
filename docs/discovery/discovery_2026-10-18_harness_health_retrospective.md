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

## 2. Data inventory

(written after the freeze)

## 3. Signals and backtest

(written after the freeze)

## 4. Proposed catalogue

(written after the freeze)

## 5. What the signals cannot see

(written after the freeze)

## 6. Phase 2 proposal

(written after the freeze)

## 7. Dependencies, risks, open questions
