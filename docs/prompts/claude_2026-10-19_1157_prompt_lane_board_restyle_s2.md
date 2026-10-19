# Lane board restyle, slice 2 of 2: Timeline, Insights and Requirements in the agreed design

Prompt-ID: P-2026-10-19-1157
Chat: C-2026-10-18-2225
Front: harness
Lane: phase2 (slice 2 of 2; the board page only; no change to data, routes or `/api*` shapes; no critical zone)
Status: da eseguire
Depends: P-2026-10-19-1130
Corregge: —
Request: Alfonso, 2026-10-19 11:25, in chat C-2026-10-18-2225: the board must use the Linear-like design agreed on 2026-10-18 on the canvas «Lane Monitor Desktop». Slice 1 (P-2026-10-19-1130, commits `c40dee260` and `21a629b9f`) gave the shell and the Lanes tab; this slice does the other three tabs.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the design is given; read slice 1's handoff instead of re-measuring). P8 is the visual check below, run by the chat in the built-in browser.

Worktree: `~/jjodel-w-boardstyle`, branch `board-restyle`, at the docs commit that added this prompt (on top of `21a629b9f`), `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, `git status` match; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-1157 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 90 minutes. Use node from `~/.local/bin` (v26) first in PATH. Tests through `run-quiet.mjs`; read `lane-board.mjs` with Read and `offset`/`limit`, never whole. Context ceiling RC-51.

## Context (do not redo the analysis)
Start from `~/.jjodel-lanes/P-2026-10-19-1130/handoff.md` and `handoff.diff`: they say where slice 1 put the tokens, the `data-theme` attribute and its boot script, the theme control, the sidebar and the `compact()` table. The tokens and principles are the ones in P-2026-10-19-1130 (same file, `docs/prompts/claude_2026-10-19_1130_prompt_lane_board_restyle_s1.md`); reuse slice 1's CSS variables, do not define a second set.

The design reference for this slice is `~/.jjodel-lanes/board/scratch/menubar/design/{Timeline,Insights,Requirements}.dc.html` (read markup and inline styles as the spec; `{{…}}` holes and `renderVals()` show the bindings; illustrative values in them never replace the board's real data). Slice 1 left two known gaps: Timeline and Insights follow the system `prefers-color-scheme` instead of the theme chosen in the board, and Timeline draws the `question` state in purple where the design uses amber (waiting).

## COSA
1. **Theme everywhere.** `timeline.js`, `insights.js` and `requirements.js` read the board's theme (the `data-theme` attribute and slice 1's variables), not `prefers-color-scheme`; switching Light, Dark or System in the sidebar repaints all three tabs without a reload, canvas or SVG charts included.
2. **Timeline** as in `Timeline.dc.html`: header with the existing range and filter controls, lanes as rows of bars on a quiet time axis, state colours from the tokens (running indigo, done green, waiting and `question` amber, blocked red, hard-stop dashed grey), the now line in the accent, tooltips and click-through to `#lane=<id>` kept.
3. **Insights** as in `Insights.dc.html`: KPI cells with their windows stated, charts with 1 px grids, mono tabular figures, one accent, state colours only for state; every chart and number it shows today stays, with its tooltip.
4. **Requirements** as in `Requirements.dc.html`: the list or table restyled to the compact table of slice 1 (id and title stacked, status as dot and word, mono tags), filters and counts kept.
5. **Keep the contract.** No change to data, routes, `/api*` JSON, element ids or `data-*` attributes other code or tests read. Where a test asserts on markup, keep the markup shape or update the test in the same commit with the reason; never weaken an assertion. Fix nothing else: the `laneTracking.test.ts` failure is ticketed and out of scope.
6. Checks: the `laneBoard*` tests and the `scripts/hooks` suite at their count (935/936 with the ticketed failure); `typecheck:scripts` 0; `check:scripts` PASS. Start a board from this worktree on 4714 (`LANE_BOARD_CACHE` under `/tmp/boardstyle/`, never touch 4700) and leave it running for the chat's check in the built-in browser (RC-23) on all four tabs, both themes, at 1440 and 800 px: `Outcome: hard-stop`. After the GO: commits, stop the 4714 board, `Outcome: done`.

## DOVE
`frontend/scripts/lane-board/{lane-board.mjs,timeline.js,insights.js,requirements.js,README.md}`, `frontend/scripts/hooks/__tests__/laneBoard*.test.ts` only where markup assertions must follow, `docs/log-inbox/harness.md`, this prompt's Status line. Anything else: stop and ask.

## Commits (P13, RC-17), explicit pathspecs, no push
Code: `feat(lane-board): Timeline, Insights and Requirements in the design (P-2026-10-19-1157)` (72 characters at most, the hook enforces it). Docs: Status flip and the P9 entry. Trailer `Model:` (P6).

## NON FARE
No change to the menu bar app (`~/jjodel-w-menubar2`, lane P-2026-10-19-1148). No restart of the board on 4700 (the chat does it after the merge). No webfont, no new dependency, no copy of Linear's logo, icons or proprietary layout details.
