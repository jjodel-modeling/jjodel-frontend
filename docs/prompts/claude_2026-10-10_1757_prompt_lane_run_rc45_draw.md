# lane-run draws the tier of eligible lanes (RC-45)

Prompt-ID: P-2026-10-10-1757
Chat: C-2026-10-10-1512
Request: https://claude.ai/code/session_015Px4yAHrpWDZQo31DjapvA
Lane: full (lane-run tier selection, a shared tool every chat uses; Phase 1 and 2 in cascade)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-rc45draw`, branch `lane-run-rc45-draw`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1757 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: Alfonso is away; a question with one recommendation inside this lane's perimeter is answered as
recommended (RC-21). Phase 1 and Phase 2 run in cascade: write the Phase 1 report, commit it, and go on to Phase 2
unless the report raises a question outside this perimeter, in which case stop with `Outcome: question`.

## Context
RC-45 (`docs/decisions.md`, amended 2026-10-10 17:55) randomises the tier of eligible lanes so that the lane board
Insights tab can compare models without the chat's selection bias. Alfonso asked to start it now and to automate it
as far as possible: the draw must not depend on every chat remembering the rule. Today `chooseTier`
(`frontend/scripts/lane-run.mjs:548`) applies `tierRule` (`:526`) or an explicit `--tier`; 23 of the 24 light lanes
so far came from an explicit `--tier light`. The chat has already drawn one lane by hand and recorded it in the ledger
`~/.jjodel-lanes/rc45-draws.jsonl` (one JSON object per line: `promptId`, `tier`, `at`, `by`, `n`); its prompt carries
`tier drawn (RC-45): light` in the `Lane:` line (P-2026-10-10-1756).

## WHAT
### Phase 1 (read-only)
Read `chooseTier`, `tierRule`, every caller (`start`, `chain`, `merge --launch`, the auto-intake path with `--auto`)
and how `tier.txt` is written; how `laneRun.test.ts` (`frontend/scripts/hooks/__tests__/`) exercises tier choice; how
`lane-board.mjs` and `insights.js` detect a drawn lane today. Write
`docs/discovery/discovery_2026-10-10_lane_run_rc45_draw.md` (goal, files read with paths, findings with `file:line`,
the design below adjusted to what you found, risks, questions with `Recommended:`), commit it alone.

### Phase 2
DOVE: `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/__tests__/laneRun.test.ts`,
`frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/insights.js`,
`frontend/scripts/lane-board/README.md`, the lane's entry in `docs/log-inbox/harness.md`. Ask first for any other
file. `docs/PROTOCOL.md` and `docs/decisions.md` are the chat's.

1. **Eligibility.** A lane is eligible when `tierRule` does not force heavy, its `Lane:` word is `fast`, its DOVE
   writes at least one path outside `docs/`, it has no `--critical-zone-goahead`, and the draw window is open: fewer
   than 40 draws in the ledger and the local date not after 2026-11-08.
2. **Draw.** For an eligible lane with no draw yet, `start` and `chain` draw heavy or light with
   `crypto.randomInt(2)`, append the ledger entry (`by: "lane-run"`, `n` = ledger count after the append), and write
   `tier.txt` as `<tier> (<model>): drawn (RC-45), <n>/40`. The draw happens once per Prompt-ID: if the ledger already
   holds the Prompt-ID, or the `Lane:` line carries `tier drawn (RC-45): heavy|light`, use that tier and do not draw
   again (a header that disagrees with the ledger is refused, naming both). Resume is unchanged (the session keeps
   its model).
3. **No silent bypass.** On an eligible lane, `--tier` is refused with a message that names RC-45 and the way out:
   `--no-draw "<reason>"`, which skips the draw, records `not drawn (RC-45): <reason>` in `tier.txt`, and then applies
   the rule or `--tier` as today. If you need a hook for tests, it must be an environment variable that tests set, and
   any lane it touches must say so in `tier.txt` and in the ledger; say which design you chose.
4. **No light model set.** If the draw gives light and no light model is configured, refuse the start (do not fall
   back to heavy silently).
5. **Board.** `lane-board.mjs` marks a lane as drawn from `tier.txt` (`drawn (RC-45)`) or from the ledger, as well as
   from the `Lane:` line; `/api/insights` keeps `drawn: "heavy"|"light"|null`. The Insights drawn toggle then counts
   P-2026-10-10-1756.
6. **Tests** in `laneRun.test.ts`, red first where the behaviour is new: eligible lane draws and writes ledger and
   `tier.txt`; both outcomes reachable; non-eligible lanes (full, merge, discovery, docs-only fast, critical zone,
   window closed by count and by date) are not drawn; `--tier` refused on an eligible lane; `--no-draw` recorded; a
   second start of the same Prompt-ID reuses the draw; header and ledger disagreeing is refused; header draw honoured
   without a new ledger draw.
7. **Docs.** The header comment of `lane-run.mjs` (tier section), the board README, and the log-inbox entry
   (`Corregge: none`).
8. **Checks.** `node --check` on the three scripts; `npm run check:scripts`; the hook tests; `npm run check:docs`.
   Then, without launching a session, show what `start` would write in `tier.txt` for: P-2026-10-10-1756 (header
   draw), a synthetic eligible fast prompt in `/tmp/p1757/` with a ledger copy in `/tmp/p1757/` (never the real
   ledger), a docs-only fast prompt, and a `Lane: full` prompt. Use a dry path if lane-run has one, otherwise an
   environment variable pointing the ledger to `/tmp/p1757/`; say which.
9. **Commits.** Code and tests in one commit (pathspec, `Model:` trailer), docs in a docs commit (P9).

## HARD STOP
After the Phase 2 commits: `Outcome: hard-stop`, with the eligibility table from the dry runs, the test names, the
gate results and the shas. The chat merges; the merge changes a tool every chat uses, so it waits for no running lane
of other chats to be mid-start (the chat checks).

## DO NOT
Do not write to `~/.jjodel-lanes/rc45-draws.jsonl` from tests or dry runs. Do not launch a session. No change to
`docs/PROTOCOL.md`, `docs/decisions.md`, `CLAUDE.md`. No `git stash`, no `git add .`. No board on port 4700.

## REFERENCES
- `docs/decisions.md` RC-16, RC-32, RC-45; `docs/PROTOCOL.md` P4, P9, P13, P14, P16.
- `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md` §6.3, §6.5.
