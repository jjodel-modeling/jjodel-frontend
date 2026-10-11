# Goal model: macro goals, new softgoals, softgoal correlations and a pass for hurts

Prompt-ID: P-2026-10-11-1650
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Front: harness
Lane: full (data and docs only: docs/goals/ files, the goals README, one discovery report)
Depends: P-2026-10-11-1510
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-goaltree`, branch `goal-tree`, cut from the trunk tip that carries the docs commit adding this
prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1650 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
`docs/goals/` holds the softgoal level of a goal model over the R- rows of `docs/decisions.md` (R-GOAL-1, first
draft P-2026-10-05-1725, method in `docs/discovery/discovery_2026-10-05_goal_model.md`; contract in
`docs/goals/README.md`). Seven softgoals SG-1..SG-7, 451 contributions over 304 rows, 11 declared conflicts. The
contributions lean one way: some+ 266, help 149, some- 36, and no hurt, make or break; 414 are `verified: none`.
Only SG-7 is balanced. A model where 92% of the links are positive cannot show what hurts what, and that is what
Alfonso asked for in chat: the relations that say which choices help and which damage each aspect of the project,
under a few macro goals (cognitive load, usability, scalability, expressiveness). Actors are out of scope.

Alfonso approved this tree in chat (C-2026-10-10-0840). New softgoals are numbered from SG-8 in this order:
- **MG-1 Usability:** SG-1 Low cognitive load, SG-2 No layout shift, new SG-8 Learnability.
- **MG-2 Expressiveness:** SG-6 Fidelity to the formalism, new SG-9 Expressive power of the languages and notations.
- **MG-3 Scalability:** new SG-10 Performance on large models, new SG-11 Maintainability of the code base (growth of
  the code: duplication, coupling, size of the critical zone).
- **MG-4 Dependability:** SG-4 Reversibility, SG-5 Determinism of the simulation engine, new SG-12 Integrity of saved
  projects (no loss or corruption on save, load, import, migration).
- **MG-5 Delivery:** SG-3 Demo readiness, SG-7 Cost of the harness.

The Requirements tab of the lane board reads `softgoals.json`, `contributions.json` and `conflicts.json` through
`frontend/scripts/req-trace.mjs` (`joinGoals`); new softgoal ids appear in its filter and its pair groups with no code
change.

## WHAT
1. **New softgoals.** Append SG-8..SG-12 to `softgoals.json` in the existing format: a description that cites the
   texts stating the principle (CLAUDE.md, `docs/DESIGN-SYSTEM.md`, rows of `docs/decisions.md`), what serves it and
   what hurts it, and its scope, with the boundary against its neighbours stated in one sentence (SG-12 against SG-4,
   SG-9 against SG-6 and SG-1, SG-11 against SG-7, SG-8 against SG-1). Keep a new softgoal only if at least 5 R- rows
   contribute to it in either direction after step 3; otherwise leave it out of every file, keep its number unused, and
   say why in the report. Do not edit SG-1..SG-7.
2. **The tree.** New file `docs/goals/goal-tree.json`: `[{ "id": "MG-n", "name", "description", "softgoals": ["SG-…"] }]`,
   every softgoal in exactly one macro goal, descriptions of two or three sentences saying what the macro goal means
   for Jjodel. Macro goals carry no contributions of their own: they are read through their softgoals.
3. **Contributions for the new softgoals.** Read every R- row (RC rows are not judged, as today) and add the entries
   for SG-8..SG-12 in both directions, with the README's scale, `evidence` and a `why` that quotes or cites the row.
4. **The pass for hurts.** For every row that already has a positive contribution, ask what it costs and which
   softgoal pays: a control or mode added (SG-1, SG-8), a notation or language feature removed or restricted (SG-9), a
   runtime cost (SG-10), code or coupling added (SG-11), a step or wait added (SG-7), a saved form left unmigrated
   (SG-6, SG-12). Add the negative entries the row supports. There is no quota and no target ratio: an empty row is
   better than an invented link (README). Use `hurt` or `break` only when the row states or measures the damage;
   otherwise `some-`. Add to `conflicts.json` only a trade-off that a row, its ratification memo or its discovery names.
5. **Correlations.** New file `docs/goals/correlations.json`: side effects between softgoals, as i* correlation links,
   `[{ "from": "SG-…", "to": "SG-…", "kind", "witnesses": ["R-…"], "evidence", "verified", "why" }]`. A link exists
   when at least 3 rows that help `from` hurt `to` (or help both, for a positive link), or when one row or one declared
   conflict names the trade-off (`evidence: read`). `witnesses` lists the rows; `kind` uses the same scale; direction
   matters, and a symmetric trade-off gets two entries only if both directions have witnesses. Compute the candidate
   pairs from the contributions with a script in `/tmp` (not committed), then read the witnesses before writing a
   link. Also give the macro-goal view in the report: for each ordered pair of macro goals, the links between their
   softgoals.
6. **Independent check (RC-27).** Fresh-context subagents, in batches, read only the row text and the entry, for
   every entry this lane adds (contributions, conflicts, correlations), and confirm, regrade or reject it. Apply the
   result: confirmed entries get `verified: agent`, regraded ones are changed and marked `agent`, rejected ones are
   removed. Then a sample of 40 existing `verified: none` entries, drawn with a fixed seed across softgoals, goes through
   the same check, to estimate the precision of the first draft; apply the result to those 40 only. Report every
   count: checked, confirmed, regraded, rejected, by file and by softgoal.
7. **README.** `docs/goals/README.md`: rows for `goal-tree.json` and `correlations.json` in the Files table, the twelve
   softgoals in "The softgoals", a short section on the tree and on correlations (what a link means, the witness rule).
8. **Discovery report.** `docs/discovery/discovery_2026-10-11_goal_tree_hurts.md`: method, the distribution of kinds
   per softgoal before and after (table), the softgoals kept or dropped in step 1 and why, the correlation links with
   their witnesses, the macro-goal view, the RC-27 counts, the precision estimate of the first draft, and open
   questions for Alfonso. Write it as you go: if the session nears its time limit, finish the step in hand, write the
   report with what is done and what is left, commit, and stop with `Outcome: hard-stop (partial, resume due)`.
9. **Gates.** With `node -e` from the worktree root: every file parses; every `req` is an R- row of
   `docs/decisions.md`; every `softgoal`, `from`, `to` and tree member exists in `softgoals.json`; every softgoal is in
   exactly one macro goal; no duplicate (req, softgoal) entry; no em dash in any text this lane writes. Run
   `node frontend/scripts/req-trace.mjs --no-cache` and report `goalModel` counts before and after (contributions,
   conflicts, opposing pairs, pairs per softgoal). From `frontend/`: the `reqTrace` and `laneBoardRequirements` suites
   and `npm run check:docs`. Start this tree's board on port 4702 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`,
   leave it running and report its PID; the chat runs the RC-23 check of the Requirements tab and stops it.
10. **Commit.** One docs commit with an explicit pathspec (the four JSON files you changed or created, the README, the
    discovery report), subject within 72 characters:
    `docs(goals): goal tree, correlations, hurts (P-2026-10-11-1650)`. Then the log entry in
    `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (review due)`. No merge.

## DO NOT
- Touch `docs/decisions.md`, `cluster-descriptions.json`, any code, any test.
- Change the ids, names or descriptions of SG-1..SG-7, or the existing entries other than the 40 of the sample.
- Write `verified: alfonso`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/goals/README.md`; `docs/discovery/discovery_2026-10-05_goal_model.md`; `frontend/scripts/req-trace.mjs`
  `joinGoals`.
- CLAUDE.md §8.8; `docs/DESIGN-SYSTEM.md` §4.2, §4.3.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23, RC-26, RC-27.
