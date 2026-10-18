# Lane board: the Kind column as a badge, with an explanation on hover and on click

Prompt-ID: P-2026-10-18-1428
Chat: C-2026-10-18-1428
Front: harness
Lane: fast (one module of the lane board and its test, no critical zone, no exported interface)
Status: da eseguire
Depends: none
Corregge: —
Request: none (Alfonso, 2026-10-18 14:28, in chat: highlight the kind of every lane and explain its details in a tooltip or overlay on hover or click; asked after reading why merge lanes show n/a tokens)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply, the context below is the discovery (measured by the chat on 2026-10-18 14:20 in `~/.jjodel-lanes`).

Worktree: `~/jjodel-w-kindbadge`, branch `lane-board-kind`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` match; otherwise stop with `Outcome: blocked`.
Model and tier: as `lane-run start` assigns; no critical zone, no visual bug.

## Lane discipline
Every reply opens with `[P-2026-10-18-1428 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes (RC-20).

## Context (do not redo the analysis)
On the Lanes tab the Kind cell is plain text (`lane-board.mjs`, function `table`, the `kind` cell built from `r.kind` and `r.tier`). Kind comes from `kindOf(laneLine, file)`: `merge`, `fast`, `discovery`, `phase2`, or empty. Measured: the folders of `lane-run merge --direct` lanes (P-2026-10-18-1226, -1255, -1305) hold `direct.json`, `gate-*.log`, `vitest-*.json`, `result.json`, sometimes `resolved.txt`, and no `session.txt` and no `architect.json`; their `log.jsonl` carries synthetic `assistant` messages written by the script, without `message.usage`. So In, Out, Total and Ctx max are n/a by construction, and Arch is n/a because the chat writes `architect.json` only for the session lanes it launches. Session lanes (P-2026-10-18-1205) hold `session.txt`, `tier.txt`, `stdin.md`, `architect.json`. Nothing on the board says any of this, so a reader sees n/a as missing data.

## COSA
1. The Kind cell becomes a badge: one fixed-width pill per kind (`merge`, `fast`, `discovery`, `phase2`, and a neutral `unknown` for an empty kind), each with its own colour from the page's existing tokens, the tier kept as a suffix inside the cell. A direct merge is marked as such (for example `merge · direct`), from the presence of `direct.json`. Column widths stay as in `COL_W`; no row changes height between states.
2. Hover or keyboard focus on the badge shows an overlay; a click pins it until Esc, a click outside, or a click on another badge. One overlay at a time, positioned inside the viewport. Reuse the `data-tip` mechanism of `insights.js` if it is generic enough; otherwise a small one in the page, without new dependencies.
3. Overlay content, built server side into the row by a pure exported function (name it after a global search, for example `kindDetails(row)`), plain text lines:
   a. what the kind means, one line, and how it was derived: the prompt's `Lane:` line verbatim;
   b. how it ran: for a direct merge, "scripted: git merge and gates, no model session", then branch into trunk and the gate results from `result.json`, and the text of `resolved.txt` when present; for a session lane, tier, model and effort as recorded by `lane-run` (the `runs.jsonl` of B3a, P-2026-10-18-1205, when present), and the session id;
   c. what the token columns mean for this row: for a direct merge, "In, Out, Total, Ctx max: n/a, no model ran" and, if no `architect.json`, "Arch: n/a, the chat records it only for session lanes"; for a session lane with no usage, say which file is missing instead of leaving n/a unexplained.
4. Test, through the existing lane-board tests: `kindDetails` on a direct merge folder, a resolved direct merge, a session lane with `runs.jsonl`, a session lane without it, and an empty kind; one negative: a session lane never gets the "no model ran" line.
5. README of the lane board: one short paragraph on the badge and the overlay.

## HARD STOP
After the code commit and the gates (`npm run typecheck:scripts` or the board's own gate, its tests, `check:docs`): start the board from the worktree on port 4701 (`node frontend/scripts/lane-board/lane-board.mjs --port 4701`), leave it running, write the log entry and the Status flip uncommitted (RC-17), and exit with `Outcome: hard-stop (visual check due)`. The chat runs the visual checklist (RC-23): every Kind cell is a badge; Kind column width 124 px on every row; hovering the P-2026-10-18-1305 badge shows the "no model ran" line; the P-2026-10-18-1205 badge shows tier and model; click pins, Esc closes; console clean.

## NON FARE
No change to `kindOf` or to how kinds are counted in Insights; no new column; no change to `lane-run.mjs`, to `architect.json` or to any lane folder; nothing under `frontend/src`.

## RIFERIMENTI
`frontend/scripts/lane-board/lane-board.mjs` (`kindOf`, `table`, `COL_W`, `tokens`), `frontend/scripts/lane-board/insights.js` (`data-tip`), `frontend/scripts/lane-board/README.md`, RC-17, RC-20, RC-23, RC-26.
