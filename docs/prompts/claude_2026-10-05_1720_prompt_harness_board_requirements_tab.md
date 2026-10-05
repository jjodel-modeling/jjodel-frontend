# Prompt: the lane board in the repo, a «resolved» outcome, and a Requirements tab

Prompt-ID: P-2026-10-05-1720
Chat: C-2026-10-05-1648
Lane: full (scripts only, no app code; tests first; probe of the board on its own port; no visual check of the app). Tier: heavy (RC-32: a new data model over the register and git). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead: none needed.
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-reqtab`, branch `harness-req-tab` from the trunk `57ff86f5d`, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `57ff86f5d`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-1720 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Time limit: 90 minutes. Unattended (RC-25): decide inside the perimeter, record each decision as `Decisions taken (unattended)` in the report.

## Why

Alfonso, 2026-10-05: (1) lanes that ended `blocked` and were resolved afterwards must stop raising alerts; (2) a tab listing every requirement that has been realized, clustered into macro concerns and placed on milestones, with the goal-model contributions (help/hurt) when they exist. The live board (`~/.jjodel-lanes/board/lane-board.mjs`, `insights.js`, `timeline.js`, served on 4700 by the launchd agent `io.jjodel.lane-board`) lives outside the repo today. The project chat measured on the pushed trunk: 472 rows in `docs/decisions.md`, 436 of them R- rows (36 RC rows are harness rules, not product requirements); 303 cited by a code commit reachable from the trunk; a co-citation graph over the prompts (merge prompts excluded) gives 13 Louvain communities on 365 rows, which do not follow the family prefixes (R-SIM splits in three; R-IRN, R-LAY and R-UNDO fuse).

## COSA

1. **Port the board into the repo**, unchanged in behaviour: copy `lane-board.mjs`, `insights.js`, `timeline.js` from `~/.jjodel-lanes/board/` (read only, never write there) to `frontend/scripts/board/`. Paths that pointed at the board folder now resolve relative to the script; the lane state root stays `~/.jjodel-lanes`. Do not touch the plist or the running agent: repointing it is Alfonso's (parked).
2. **`resolved`**: a lane folder may hold `resolved.txt` (one line: date, who, why). `lane-run status` and `status --all` print the outcome `resolved` for a lane whose recorded outcome is `blocked` and that holds the file; the raw outcome stays readable (`status <id>` shows both). Add `lane-run resolve <Prompt-ID> --why "<text>"`, which writes the file only when the lane has exited `blocked`, and refuses otherwise. The board shows `resolved` in the ok colour in the table, the timeline and the insights, and does not count it among the blocked in the day tallies. Do not run `resolve` on any existing lane: tagging the 14 old ones is parked for Alfonso.
3. **`frontend/scripts/req-trace.mjs`** (Node, no new dependency), read-only over a checkout: emits JSON for every R- row of `docs/decisions.md` (RC rows behind a flag `--with-rc`): id, family, title (the bold head), date, ratified/provisional/superseded, evidence, verified; `realized` (true when a `feat|fix|refactor|perf` commit reachable from the trunk cites the id in subject or body), every such commit (sha, date, subject, Prompt-ID) and the trunk merge that brought the first one in; rows that cite it, split into evolution links (amends, supersedes, refines, renumbered) and the rest. Cache on the trunk sha.
4. **Clusters**: co-citation graph (an edge when one prompt in `docs/prompts/` cites both rows; prompts citing more than 25 rows excluded), Louvain with a fixed seed, written dependency-free. Each cluster gets a stable key (the smallest member id) and an automatic label (dominant families plus the three most frequent title words); `docs/goals/cluster-names.json`, if present, maps key to a human name and wins. Report the modularity and the share of rows left unclustered.
5. **Milestones**: assign each realized row to the first milestone whose date follows its first implementing commit. Milestones come from `docs/goals/milestones.json` if present (`[{id, name, date}]`); otherwise use one built-in: «MODELS freeze 2026-10-07». Do not invent other milestones.
6. **Goal model, read side only**: if `docs/goals/softgoals.json` and `docs/goals/contributions.json` exist (written by lane P-2026-10-05-1725, in parallel), join them: per row its contributions; per cluster the help and hurt totals per softgoal; the pairs of realized rows that pull the same softgoal in opposite directions. The contract, fixed here for both lanes: `softgoals.json` is `[{id: "SG-n", name, description}]`; `contributions.json` is `[{req, softgoal, kind: "make"|"help"|"some+"|"some-"|"hurt"|"break", evidence: "measured"|"read"|"inferred", verified: "none"|"agent"|"alfonso", why}]`; `conflicts.json` is `[{a, b, softgoal, why, evidence}]`. If the files are absent, the tab shows the requirements and clusters and says the goal model is not there yet.
7. **The tab** «Requirements» beside Lanes, Timeline and Insights: grouped by cluster, then milestone; columns id and title, family, status, realized (with the commits on hover and the trunk merge), contributions as small help/hurt marks; filters by family, status, realized/not realized, softgoal; a header line with the counts. Same page style as the other tabs, no external assets.

## DOVE

Write: `frontend/scripts/board/**` (new), `frontend/scripts/req-trace.mjs` (new), `frontend/scripts/lane-run.mjs` (the `resolved` outcome and the `resolve` subcommand only), tests next to the existing script tests, `docs/log-inbox/harness.md` entry, this prompt's Status. Read: `~/.jjodel-lanes/` (never write), `docs/decisions.md`, `docs/prompts/`, `docs/goals/` if present, git. Do not write in `docs/goals/` (the other lane's perimeter). Board probe on port 4701 only, never 4700, 3000, 3001 or 3003.

## Tests and gates

- Tests first: `resolved` (blocked plus file gives resolved; done plus file stays done; `resolve` refused on a non-blocked lane), the register parser (a multi-line row, a row with `-bis`, a renumbered row), `realized` on a fixture git history, Louvain on a tiny graph with a known split, the join with a fixture `contributions.json`.
- `check:scripts`, typecheck baseline (14), vitest (the 9 known suites red at import), build.
- Probe: run the ported board on 4701 against the real `~/.jjodel-lanes`: the Lanes tab equals the 4700 page's rows (same ids, states, outcomes); the Requirements tab lists the realized rows with a count within one of the chat's 303 on the pushed trunk, or explains the gap; crop of the tab at 1400 px (gitignored) for the chat.
- Negative control: delete one row's code commit from the fixture history and show `realized` turns false.

## HARD STOP

After the code commit (`feat(harness): board in the repo, resolved outcome, Requirements tab (P-2026-10-05-1720)`) and the gates: one closure commit of docs (RC-17) with the Status flip and the log entry. Then `Outcome: done`. Do not merge.

## NON FARE

No write in `~/.jjodel-lanes/`, no change to the plist or the launchd agent, no `resolve` on existing lanes, no change to app code under `frontend/src/`, no new npm dependency, no `git stash`, no `git add .`, no push.

## RIFERIMENTI

`CLAUDE.md`; `docs/PROTOCOL.md` P16; RC-17, RC-20..RC-28; the lane skill's `monitor` section (port 4700 is the live board's); P-2026-10-05-1725 (the goal model, parallel).
