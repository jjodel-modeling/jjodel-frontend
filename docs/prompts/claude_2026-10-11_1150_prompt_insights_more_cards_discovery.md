# Lane board Insights: rework causes, decision autonomy, lead time, discovery

Prompt-ID: P-2026-10-11-1150
Chat: C-2026-10-10-1145
Request: https://claude.ai/code/session_01FWUFsDDVN1SMB4MGco19GJ
Front: harness
Lane: full (discovery; defines the data contract of new Insights cards). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-insightsmore`, branch `insights-more`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1150 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended (lane auto): Alfonso is away; a question with one recommendation inside this lane's perimeter is answered
as recommended (RC-21).

## Context (settled by the chat, do not redo)
Alfonso wants more information in the Insights tab of the lane board (`frontend/scripts/lane-board/insights.js`,
431 lines, served by `lane-board.mjs`). Today the tab shows: when the lanes work (hour heatmap), how long lanes wait
for a decision and the longest waits, lanes per day by outcome, outcome by kind of lane, who launches the lanes,
code areas with rework, model by area and by size, first-shot over time, and the Perfetto export. It describes
rhythm and first-shot quality well. It does not say why work is redone, who takes the decisions, or how long a
request takes to reach the trunk.

The chat proposed, and Alfonso approved, this order:

1. **Rework causes.** Distribution of the `Causa` field (taxonomy a..g of `CLAUDE.md` §21.3) over time, and the
   depth of `Corregge` chains (how many lanes it takes to close one request). Goal: tell apart rework from ambiguous
   prompts (a), insufficient discovery (c) and regressions seen only on screen (d).
2. **Decision autonomy.** Per lane: questions asked (`Outcome: question` exits and mid-run questions), answers that
   adopted the lane's `Recommended:` line, answers decided by Alfonso, answers that overturned the recommendation.
   Weekly trend. Goal: measure how far the RC-26 list could be widened.
3. **Lead time and work left behind.** From the request (`Request:` header and the local `request.md` since
   P-2026-10-10-1150, otherwise the docs commit that added the prompt) to the merge on the trunk, which is not the
   lane's own duration. Next to it, the branches with commits not in the trunk and their age: `harness-req-tab`
   stayed out for five days without the board showing it.

Secondary, only if the data supports them: 4. the outcome of the RC-23 visual check (how often the GO found a defect
that green gates had missed; whether sampling after 2026-10-03 holds); 5. cost per lane by tier and model and cost
of a first-shot lane, if `result` events carry `total_cost_usd`; 6. concurrency against first-shot, feasibility only.

Reuse, do not remeasure: `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md` (lane P-2026-10-10-1520)
already measured model attribution, lane-to-commit linking, `Corregge` resolution and the presence of tokens and
cost. Cite its sections and measure only what it does not cover or what may have changed since.

Other chats have running lanes in `~/jjodel-w-codegen-names`, `~/jjodel-w-codegen-check`, `~/jjodel-w-newinst`
and `~/jjodel-w-dotickets`. None touches `frontend/scripts/lane-board/` as far as the chat measured; confirm with
`git diff` on their branches and say so in the report (RC-22). Do not touch those worktrees.

## WHAT (read-only Phase 1)
Measure, do not assume. Throwaway probe scripts go in `/tmp/p1150/`, never in the repo.

1. **Rework causes.** Coverage of `Causa` and `Corregge` across `docs/claude-code-log.md`, the archive and
   `docs/log-inbox/*.md`, by week since the fields became mandatory (2026-08-02). Share of entries where `Causa` is
   present when it is due (outcome ⚠️/❌ or `Corregge` filled). Chain depth distribution, with the resolution route
   of the 1520 report. Say how a lane folder maps to its log entry.
2. **Decision autonomy.** Where questions and answers live: `exit.txt`, the `result` text, `input-k.md`, the
   decision digests of RC-25/RC-28. A heuristic that classifies each answer as adopted-as-recommended, decided by
   Alfonso, or overturned, with its error on a hand-checked sample of 20. Say which signal tells a chat answer from
   an Alfonso answer, and whether it exists before RC-25.
3. **Lead time.** For each lane: request time (route and coverage), prompt commit time, lane start, lane end, merge
   commit on the trunk (route from the 1520 report). Distribution of each segment. For branches: every local branch
   with commits not in the trunk, its last commit date, whether a worktree still holds it, whether a merge or
   take-trunk prompt names it, and whether it was superseded by a port (as `harness-req-tab`). Propose the rule that
   separates "left behind" from "superseded" and from "in flight".
4. **Secondary.** For 4 and 5: present or not, coverage, since when. For 6: one paragraph on feasibility.
5. **Contract.** For each card worth building: data source, server field in `/api` (or a new route), formula,
   thresholds (reuse `MIN_RATE`/`MIN_READ` where they apply), the card's title and subtitle in the style of the
   existing ones, cost on the server side (the board refreshes every 30 s: say what must be cached), and a test
   that would fail before the change.
6. **Slices.** A plan in slices, each one lane, with the files it touches, ordered by value over cost.

Write the report to `docs/discovery/discovery_2026-10-11_insights_more_cards.md` (P4: hypothesis under test, goal,
files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions
each with `Recommended:`). Commit only the report with an explicit pathspec. Then stop with `Outcome: hard-stop`.
The hard stop is not reached until the report is written and committed.

## HARD STOP
After the report commit. No code, no Phase 2, no merge.

## DO NOT
- Change any file outside `docs/discovery/` (and your log entry in `docs/log-inbox/harness.md`, uncommitted, RC-17).
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.
- Write into `~/.jjodel-lanes/` or into other worktrees.

## REFERENCES
- `docs/PROTOCOL.md` P4, P9, P13, P14, P16; RC-17, RC-20..RC-28; `CLAUDE.md` §21.3.
- `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md`, `frontend/scripts/lane-board/README.md`.
