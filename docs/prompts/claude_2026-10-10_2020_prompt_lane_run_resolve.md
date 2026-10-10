# lane-run: `resolve` and the `resolved` outcome, ported from harness-req-tab, with card projection

Prompt-ID: P-2026-10-10-2020
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: full (five files: two scripts, two test files, one doc)
Depends: P-2026-10-10-1806
Status: eseguito 2026-10-10, lane P-2026-10-10-2020 (lane-run-resolve, a335abd21 + docs 5dc52f23f); no visual check (CLI only)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-resolve`, branch `lane-run-resolve`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-2020 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).
Two lanes run beside this one (P-2026-10-10-2021 on the board, P-2026-10-10-2022 on req-trace); their files are
disjoint from yours (RC-22).

## Context (measured, do not redo the analysis)
Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` (lane P-2026-10-10-1806) inventoried what the
unmerged branch `harness-req-tab` still adds to the trunk. Alfonso approved its port plan in chat. This lane is slice
**S1** (§7): the `lane-run` side of the `resolved` outcome. Read §3 row F11, §4 (hunks h1 to h7 and the test hunk) and
§8 R4 and R7 before writing code. The branch tip is preserved by the tag `archive/harness-req-tab-2026-10-10`
(`35240a582`); the branch's base for these hunks is `57ff86f5d`. Get the hunks with
`git diff 57ff86f5d 35240a582 -- frontend/scripts/lane-run.mjs frontend/scripts/hooks/__tests__/laneRun.test.ts`.
The port is a fresh edit of the trunk files, not a merge or cherry-pick (§9 D2).

R4 is decided: adopt the discovery's recommendation. Today the RC-44 card projection reads the raw outcome
(`observeLane`, `lane-run.mjs:2278` at discovery time; `projectLane`, `lane-tracking.mjs:184-188`), so a resolved
lane's card would stay `In progress` + `blocked`. A resolved lane is projected like a done lane, and `resolve` re-projects
the card.

## WHAT
1. **Port h1 to h7** into the trunk `frontend/scripts/lane-run.mjs`:
   - h1, the usage comment at the top: `outcome: resolved` with its `recorded:`/`resolved:` lines in `status <id>`,
     the `resolved` word in `status --all`, and the `resolve` subcommand;
   - h2, `laneFiles()`: add `resolved: join(dir, 'resolved.txt')` and keep the trunk's `request:` line (the one
     textual conflict of the trial merge);
   - h3, `laneState()`: returns `resolved` (the line of `resolved.txt`, or `null`) only when the parsed outcome is
     `blocked`; the raw `outcome` field stays unchanged;
   - h4, `status <id>`: prints `outcome: resolved`, `recorded: <raw line>`, `resolved: <line>`; leave the trunk's
     `trackCard` call, the P16 brief and the flip warning as they are;
   - h5, `statusAll()`: `resolved` in the outcome column;
   - h6, `resolve_()`: writes one line `YYYY-MM-DD HH:MM · <who> · <why>` once, only on an exited `blocked` lane,
     refuses otherwise (running lane, other outcome, already resolved, missing why), honours `LANE_RUN_NOW`; reuse the
     trunk's `clock`, `stamp`, `pad2`, `option`, `refuse`;
   - h7, the dispatch entry and the `usage:` string.
2. **R4, card projection.** In `frontend/scripts/lane-tracking.mjs`, a resolved lane projects like `done`: Status
   flipped gives `Done`, otherwise `In review` with label `closure-owed`. Make `observeLane` hand the projection what
   it needs (for example the `resolved` field of `laneState()`); pick the smallest change and state it. After writing
   `resolved.txt`, `resolve` calls `trackCard(id)` and prints its `card:` line; tracking stays fail-open (RC-15): a
   tracking error never undoes or fails the resolve.
3. **Tests.** Port the four branch tests into `frontend/scripts/hooks/__tests__/laneRun.test.ts` (between the
   `status --all` describe and `const ID2`, as on the branch). Add to
   `frontend/scripts/hooks/__tests__/laneTracking.test.ts`: a resolved lane with Status flipped projects to `Done`;
   unflipped, to `In review` + `closure-owed`; `resolve` with a fake `gh` (`LANE_TRACK_GH`) and the tracking config in a
   throwaway HOME re-projects the card. Run every new case on the base commit first and record that it fails.
4. **Mutation check.** Apply at least 8 single-point mutations to the ported and new code, one at a time and reverted
   (the branch recorded 7 of 8 killed, 1 equivalent). Report each with killed or survived, and why a survivor is
   equivalent.
5. **Gates.** `node --check` on `lane-run.mjs` and `lane-tracking.mjs`; the `laneRun`, `laneRunDirect` and
   `laneTracking` suites; `npm run check:scripts` from `frontend/`. All tests run in a throwaway HOME. Never run
   `resolve` or `status <id>` against the real `~/.jjodel-lanes/`: which of the 15 blocked lanes get resolved is
   Alfonso's call after this lane merges.
6. **Commits.** One code commit with an explicit pathspec, `feat(harness): lane-run resolve marks a blocked lane
   resolved and re-projects its card`. Then one docs commit for `docs/HARNESS-DOCS.md`: a `lane-run resolve` bullet
   beside the `lane-run track` bullet (`:482`), in the register and width of its neighbours, with the outcome
   `resolved` as `status` prints it and the projection rule. Then the log entry in `docs/log-inbox/harness.md`,
   uncommitted (RC-17), and stop with `Outcome: done`. No merge.

## DO NOT
- Touch the lane board (`frontend/scripts/lane-board/`), `req-trace.mjs`, `docs/PROTOCOL.md` or `docs/decisions.md`.
- Write `resolved.txt` in any real lane folder, or touch other lanes' folders beyond reading them.
- Delete or move the branches `harness-req-tab`, `harness-board-progress` or their worktrees (RC-26).
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` §3 F11, §4, §7 S1, §8 R4 R7, §9 D2.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-15, RC-17, RC-21, RC-22, RC-44.
