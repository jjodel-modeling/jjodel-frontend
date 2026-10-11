# Requirements tab: a written description for each requirement cluster

Prompt-ID: P-2026-10-11-1510
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Front: harness
Lane: full (six files: req-trace, the tab, two test files, a new goals file, the goals README)
Depends: P-2026-10-11-0008
Status: eseguito 2026-10-11, lane P-2026-10-11-1510 (cluster-descriptions, 16ebdfca5 + e1c750a8a); visual check passed (chat, built-in browser on 4702, RC-23); descriptions approved by Alfonso

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-clusterdesc`, branch `cluster-descriptions`, cut from the trunk tip, with this prompt as its first
commit, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1510 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
The Requirements tab of the lane board (P-2026-10-11-0008) groups the R- rows of `docs/decisions.md` into 17
clusters, computed by `frontend/scripts/req-trace.mjs` with Louvain on the co-citation graph of `docs/prompts/`. A
cluster's key is its smallest member id; its name is `docs/goals/cluster-names.json[key]` when present (the file does
not exist today), else the automatic name: dominant families and the three most frequent title words, for example
"R-SIM · chiavi, compilazione, forma" (key R-EDGE-1, 66 rows). Alfonso asked in chat that each cluster also carry a
description of what it contains. A useful description has to be written by someone who reads the rows: counts and
frequent words say no more than the automatic name. Louvain groups rows that prompts cite together, not rows on one
subject, so a cluster can hold two or three themes; the description must say so rather than invent a unity.

## WHAT
1. **Write the descriptions.** For each of today's clusters, read its member rows in `docs/decisions.md` (title,
   body, status) and write 2 to 4 sentences in English: what the cluster is about, its main sub-themes when it has
   more than one, and what is realized versus still open (use req-trace's `realized` field). Concrete nouns from the
   rows, no filler, no em dash, no marketing tone; follow the writing rules of CLAUDE.md. No description for the
   "unclustered" group. Store them in a new file `docs/goals/cluster-descriptions.json`:
   `{ "<key>": { "description": "...", "members": ["R-…", ...], "written": "YYYY-MM-DD", "by": "P-2026-10-11-1510" } }`,
   with `members` the cluster's member ids at writing time, sorted as req-trace sorts them.
2. **Independent check.** Have a subagent with a fresh context read, for each cluster, only the member rows and the
   description, and report any claim the rows do not support and any major theme the description misses. Fix what it
   finds; report the findings and the fixes (RC-27 spirit: the writer does not grade itself).
3. **req-trace.** Read `docs/goals/cluster-descriptions.json` beside `cluster-names.json` (absent file: no
   descriptions, no error). Each cluster gains `description` (string or null) and `descriptionDrift`: null when there
   is no description, else `{ written, by, added: [...], removed: [...] }`, the member ids gained and lost since the
   description was written. A description whose key no longer exists is not attached anywhere; list such orphan keys
   in a top-level `orphanDescriptions` array. Update the header comment of the script. Keep the output deterministic.
4. **Tab.** In `frontend/scripts/lane-board/requirements.js`, show the description under the cluster title in the
   cluster's summary row: one line, truncated with an ellipsis, full text in `title`. Inside the opened group, the full
   description, and when the drift is not empty one muted line such as "Written 2026-10-11 for 66 rows; since then 5
   added, 1 removed." Fixed heights in the summary row: no layout shift between clusters with and without a
   description. No em dash in anything the tab renders.
5. **Docs.** `docs/goals/README.md`: a row for `cluster-descriptions.json` in the Files table and a short paragraph on
   how descriptions age (drift) and how to refresh them (a lane rewrites the drifted ones and updates `members`).
6. **Tests.** In `frontend/scripts/hooks/__tests__/reqTrace.test.ts`: description attached by key, drift added and
   removed, orphan keys, absent file. In `frontend/scripts/hooks/__tests__/laneBoardRequirements.test.ts`: the summary
   line and its `title`, the drift line shown only when drift is not empty, equal summary-row height with and without a
   description. Run the new cases on the base commit and record that they fail. At least 6 single-point mutations over
   the attach, drift and render code, one at a time on a `/tmp` copy; report each.
7. **Gates and live check.** `node --check` on both scripts; the `reqTrace`, `laneBoard`, `laneBoardStrip`,
   `laneBoardRequirements` and `laneBoardInsights` suites; `npm run check:scripts` and `npm run check:docs` from
   `frontend/`. Start this tree's board on port 4702 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`,
   leave it running and report its PID; the chat runs the RC-23 visual check and stops it. Paste three of the
   descriptions in the report.
8. **Commits.** One code commit (req-trace, the tab, the two test files) and one docs commit (the new JSON file and the
   README), explicit pathspecs, subjects within 72 characters, e.g.
   `feat(harness): clusters carry a written description (P-2026-10-11-1510)` and
   `docs(goals): requirement cluster descriptions (P-2026-10-11-1510)`. Then the log entry in
   `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Change the clustering, the cluster keys, the automatic names, or create `cluster-names.json`.
- Touch `softgoals.json`, `contributions.json`, `conflicts.json` or `docs/decisions.md`.
- Touch `lane-board.mjs`, `timeline.js`, `insights.js` or `lane-run.mjs`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/goals/README.md`; `frontend/scripts/req-trace.mjs` header and `clusterRows` (about `:460-475`).
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23, RC-27.
