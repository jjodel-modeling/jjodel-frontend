# Goal model: mixed rows, unparsed ids, and the SG-3 «scenes unchanged» recheck

Prompt-ID: P-2026-10-11-2025
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Front: harness
Lane: full (req-trace, two test files, the goals README, contributions.json, one discovery report)
Depends: P-2026-10-11-1650, P-2026-10-11-1735
Status: eseguito

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-gmfix`, branch `goal-model-fixes`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-2025 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
P-2026-10-11-1650 (report `docs/discovery/discovery_2026-10-11_goal_tree_hurts.md`) left three open points that
Alfonso asked the chat to settle; the chat decided all three go in this lane:
- **Q2, mixed rows.** The contract allows one entry per (row, softgoal), so 27 negatives that the drafters found on
  rows already helping the same softgoal were not recorded (report §4, the `blocked` list). A decision can buy and cost
  the same softgoal at once (i* allows a positive and a negative link from one element to one softgoal); hiding the
  cost biases the model toward help, which is the bias 1650 set out to correct. Decision: allow **at most two entries
  per (row, softgoal), one positive and one negative**, never two of the same sign.
- **Q3, SG-3 «scenes unchanged».** The 40-entry sample found its 3 rejections all of one kind: first-draft SG-3
  entries that read «the demo scenes are unchanged» (a non-regression note) as a contribution to demo readiness.
- **The parser ticket.** `parseRegister` in `frontend/scripts/req-trace.mjs` (about `:157`, `ROW_START`) does not
  parse R-D, R-2/3.6 and R-B12, which the goal-model parser and the contract check accept, so 7 entries of
  `contributions.json` never reach the Requirements tab (998 in the file, 991 on rows).

## WHAT
1. **Parser.** Find why `ROW_START` misses those three heads (`docs/decisions.md:367` R-D, `:390` R-2/3.6, `:471`
   R-B12) and widen it to accept them without accepting anything the register does not mean as a row: run the new
   parser over the whole register and report the row count before and after and every id that appears or disappears.
   Only these three should appear; any other change is a stop and a question.
2. **Mixed rows, contract.** `docs/goals/README.md`: a (row, softgoal) pair carries one entry, or two of opposite
   sign; say what the second entry means (the same decision buys and costs the softgoal) and that each needs its own
   `why`. req-trace: `joinGoals` and `balance` already count a row in `help` and in `hurt` independently; make sure a
   mixed row appears in both lists of `balance` and in `opposing` against itself never (no self-pair). Any reader that
   assumed one entry per pair (grep `contributions` across `frontend/scripts/`) is fixed or reported.
3. **Mixed rows, data.** Recover the 27 blocked negatives from the 1650 report §4 (and from `/tmp/gt1650/` if still
   there; otherwise re-derive them from the report's list). Add each as a second entry only if the row text supports
   it; `why` quotes the row. Then a fresh-context check (RC-27) of every added entry, as 1650 did: confirmed or
   regraded get `verified: agent`, rejected are removed. Report the counts.
4. **SG-3 recheck.** Every SG-3 entry with `verified: none`: a fresh-context checker with the 1650 rubric, told
   explicitly that a statement that the demo scenes still pass is a non-regression note, not a contribution, unless
   the row changes what a scene shows or protects it by a gate. Apply confirm, regrade, reject as above. Report counts
   and the rejected ids.
5. **Discovery report.** `docs/discovery/discovery_2026-10-11_goal_model_fixes.md`: the parser change and its
   before/after, the contract change, the mixed entries (added, rejected, by softgoal), the SG-3 recheck, the
   `goalModel` counts before and after (contributions on rows, opposing pairs, help and hurt per softgoal).
6. **Tests.** `reqTrace.test.ts`: the three heads parse, a near miss does not; a mixed row is in both `balance`
   lists and never paired with itself; two entries of the same sign on one pair are refused or reported (choose and
   say which). `laneBoardRequirements.test.ts`: a mixed row shows on both sides of its softgoal's bar. Run the new
   cases on the base commit and record that they fail. At least 6 single-point mutations, one at a time on a `/tmp`
   copy; report each.
7. **Gates and live check.** `node --check` on req-trace; the `reqTrace`, `laneBoard`, `laneBoardStrip`,
   `laneBoardRequirements` and `laneBoardInsights` suites; `npm run check:scripts` and `npm run check:docs` from
   `frontend/`; the data gate of 1650 step 9 rerun with the new pair rule. Start this tree's board on port 4702 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`,
   leave it running and report its PID; the chat runs the RC-23 check and stops it.
8. **Commits.** One code commit (req-trace, the two test files), subject
   `fix(harness): req-trace heads, mixed goal entries (P-2026-10-11-2025)`, and one docs commit
   (contributions.json, README, report), subject `docs(goals): mixed entries and SG-3 recheck (P-2026-10-11-2025)`,
   explicit pathspecs. Then the log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch `docs/decisions.md`, `softgoals.json`, `goal-tree.json`, `correlations.json`, `requirements.js`.
- Change entries other than the added mixed ones and the SG-3 `verified: none` ones; write `verified: alfonso`.
- Touch `lane-board.mjs`, `lane-run.mjs`, the launchd service `io.jjodel.lane-board`, port 4700 or
  `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/discovery/discovery_2026-10-11_goal_tree_hurts.md` §4, §8, §10; `docs/goals/README.md`.
- `frontend/scripts/req-trace.mjs` `parseRegister`, `ROW_START`, `joinGoals`.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23, RC-27.
