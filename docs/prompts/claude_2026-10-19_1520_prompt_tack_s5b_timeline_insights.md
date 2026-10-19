# Tack slice 5b: Timeline and Insights views, Sessions fixes

Prompt-ID: P-2026-10-19-1520
Chat: C-2026-10-19-0001
Front: tack
Lane: full (two board views over the metrics module, plus fixes from the chat's visual check of 5a)
Status: eseguito 2026-10-19 · lane tack-s5b · completed by P-2026-10-19-1555 · 90d64d594 · verifica visiva della chat dopo l’uscita (RC-23)
Depends: P-2026-10-19-1440
Corregge: P-2026-10-19-1440 (visual check by the chat, 2026-10-19 15:17, three defects listed in COSA 1)
Request: https://claude.ai/chat/1b373b77-3e1f-4c66-b75e-9eec8a5ba215 (Alfonso, 2026-10-19 14:35, in the project chat: «Procedi» (slice 5, second lane))

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (discovery `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.3, §6.2); no Phase 1 hard stop. P8 is replaced as in 5a: the chat does the visual check in the built-in browser after the lane exits; leave the board running on port 4710 with the real-data store, PID in `/tmp/tack-s5b/board.pid` (stop the 5a board first: its PID is in `/tmp/tack-s5a/board.pid`).

Worktree: `~/jjodel-w-tack-s5b`, branch `tack-s5b`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1520 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Read files above 500 lines with `offset`/`limit` or `rg`, never whole; from Jjodel's board read only `frontend/scripts/lane-board/timeline.js` and `insights.js`, and only the functions you adapt. Context ceiling (RC-51): write the handoff early if you approach it. Node: `~/.local/bin/node`.

## Context

Slice 5a shipped `tack board` (port 4710, `127.0.0.1`, incremental scan at start, `POST /api/rescan`), the JSON API (`repos`, `sessions`, `metrics`, `health`), the page shell with Sessions, Timeline and Insights tabs (the last two are placeholders), and the Sessions view; 97 tests. The chat checked it in the built-in browser at 800 and 1440 px, light and dark: data, summary strip, unknown cost shown as «?», the ≥ 200k mark and both themes are correct.

## COSA

1. **Fix the three defects of 5a's Sessions view:**
   - the Day column is cut («2026-10-…») even at 1440 px: show the date in full or as `Oct 19` with the year only when it differs from the current one, never truncated;
   - at 1440 px the table is 1,246 px wide in a 1,158 px container and scrolls horizontally, so the last column (commit within the hour) is hidden: the full table must fit at 1440 px without horizontal scroll (narrower Repository column, models abbreviated with the full id in a `title`), and at 800 px the summary strip must not cut its secondary lines («2…», «519 of…»): wrap or shorten them;
   - the Branch column is shown for Jjodel although Jjodel has layer 2 (unit ids in commits): when the session's repository has unit ids, show the unit id linked to the session (from the commit within the hour carrying one), and the branch only when there is none. A repository whose display name is a bare hash (one appears in the selector) gets its toplevel folder name, or `(unnamed)` plus the short key.
2. **Timeline view**, copied and adapted from Jjodel's `timeline.js`: one swimlane per repository (or per branch within the selected repository), each session a bar from first to last event, colour by model family, a mark where context crossed 200k, commits within the hour as ticks under the bar. Day / week zoom; local days as in slice 4; hover shows the Sessions row fields; click selects the session in the Sessions tab. No lane, chat, launcher, front or RC concept.
3. **Insights view**, copied and adapted from Jjodel's `insights.js`, drawing only from `/api/metrics`: KPI strip (sessions, cost known and unknown, median and max context peak, share ≥ 200k, commit within the hour); cost per day (stacked by model family, unknown-cost sessions as a separate marker, never as 0); sessions per day; context peak distribution; waits per day; overlap per day; subagent share. Every chart names the layer it needs. Layer 2/3 panels (rework, first-shot rate, causes) render as a card «Not adopted: needs <field>» or «Adopted, not implemented yet (slice 6)», never as an empty chart.
4. **Charts without a dependency**: inline SVG drawn by `board.js` helpers (bars, line, small multiples), with the light and dark palettes of 5a, axis labels, and a text alternative (`<title>` / `aria-label`). No chart library, no canvas.
5. **Tests**: API-shape tests stay green; add unit tests for the SVG helpers (empty series, one point, unknown values) and for the new Sessions rules (unit id vs branch, hash-named repository). Privacy test extended to the HTML served for each tab.
6. **Run it on this Mac** as in 5a (store `/tmp/tack-s5b/real.db`, port 4710, left running). Measure in the entry: table width vs container at 1440 and 800 px (from the DOM), the number of charts rendered per tab, and the time from page load to the Insights tab drawn.

## DOVE

`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else.

## Gates

`cd tack && ~/.local/bin/node --test` green, privacy tests included; `check:docs` after the commits (from `frontend/`).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): Timeline and Insights views, Sessions fixes (P-2026-10-19-1520)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 5b (P-2026-10-19-1520)` with the entry and the Status line.

## NON FARE

No dependency, no chart library, no CDN or web font. No change outside `tack/` and the two docs, and none to Jjodel's board. No layer-2/3 metric implementation (slice 6). No message text, subject, author or path in the page or the API. No push.

## HARD STOP

None planned: close with `Outcome: done`.

## RIFERIMENTI

- `frontend/scripts/lane-board/timeline.js`, `insights.js` (copy and adapt, do not import)
- `tack/src/board/`, `tack/src/metrics/`, `tack/README.md` (slices 4-5a)
- `docs/log-inbox/tack.md` (5a entry)
