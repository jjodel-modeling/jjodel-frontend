# Lane board: what the harness-req-tab branch still adds to the trunk board (discovery)

Prompt-ID: P-2026-10-10-1806
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: full (discovery, read-only; Phase 2 is a later prompt)
Depends: none
Status: eseguito 2026-10-10, lane P-2026-10-10-1806 (board-req-port-disc, report 0d8180ebc); discovery, no visual check

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-reqport`, branch `board-req-port-disc`, cut from the trunk tip `45ad56bd6`; the docs commit
adding this prompt is the first commit on the branch (the trunk was busy with another chat's merge),
`frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -2` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1806 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
Branch `harness-req-tab` (chat C-2026-10-05-1648, lane P-2026-10-05-1720, which already absorbed lane
P-2026-10-05-1705 with the merge `786107cfb`) holds 10 commits outside the trunk, tip `35240a582`, merge base
`57ff86f5d`, never merged. It carries the status strip, the Requirements tab, `frontend/scripts/req-trace.mjs`
(618 lines), the lane progress milestones of 1705 and a resolved outcome, but on a parallel board:
`frontend/scripts/lane-board.mjs` (908 lines) plus `frontend/scripts/board/requirements.js` and
`frontend/scripts/board/timeline.js`. The trunk board lives in `frontend/scripts/lane-board/` and has since gained
the Request header and `request.md` (RC-43), Started/Ended, working time and Span, the Insights tab, newest-first
ordering and the timeline cache. Two more board changes are verified and waiting to merge: branch
`lane-board-columns` (fixed column widths, `lane-board.mjs`) and branch `timeline-newest-first` (`timeline.js`).
The branch also changes `frontend/scripts/lane-run.mjs` (+53/-4) and adds tests and fixtures under
`frontend/scripts/hooks/__tests__/` (`laneBoard.test.ts`, `laneBoardStrip.test.ts`, `reqTrace.test.ts`,
`fixtures/lane-board/*.jsonl`, 70 lines in `laneRun.test.ts`).
Alfonso's direction: the trunk board is the base, only the features it still lacks are ported onto it, then the
branch is retired. Lane 1705 is not to be resumed: it is superseded.

## WHAT (read-only)
1. Inventory every feature of `harness-req-tab` against the trunk board, reading with `git show
   harness-req-tab:<path>` and `git diff 57ff86f5d harness-req-tab`, never by checking the branch out. Do not touch
   `~/jjodel-w-reqtab` or `~/jjodel-w-boardprog`. For each feature: what it does, where it lives on the branch,
   whether the trunk has it (yes / partly / no, with the trunk file and line), and what it would collide with on
   the trunk side (the features listed above, including the two pending branches).
2. The `lane-run.mjs` diff: what each hunk does, whether the trunk already covers it (the trunk lane-run has moved a
   lot since `57ff86f5d`), and whether it is still wanted.
3. The tests and fixtures: which still describe behaviour the trunk should have, which are tied to the parallel
   board and die with it, and how they would run against `frontend/scripts/lane-board/`.
4. `req-trace.mjs`: its inputs, outputs and callers; whether it depends on the parallel board; what the
   Requirements tab needs from the server side.
5. A port plan onto the trunk board: ordered slices, each with its file set (disjoint where possible, so slices
   can run as parallel lanes under RC-22), the tests that come with it, a size estimate, and the order relative to
   the two pending branches. Then how to retire the branch (an `archive/` tag on `35240a582` is the
   recommendation to state; deleting the branch and the two worktrees waits for Alfonso, RC-26).
6. Save the report as `docs/discovery/discovery_2026-10-10_board_req_tab_port.md`, with the sections: goal, files
   read (full paths), inventory table, lane-run hunks, tests, req-trace, port plan, risks, decisions taken
   (unattended), decisions awaiting Alfonso. Commit it with an explicit pathspec,
   `docs(discovery): what harness-req-tab still adds to the trunk board (P-2026-10-10-1806)`, then stop with
   `Outcome: hard-stop`. No code change, no merge.

## DO NOT
- Edit any file other than the report; no checkout or merge of `harness-req-tab`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-22, RC-26, RC-42, RC-43.
