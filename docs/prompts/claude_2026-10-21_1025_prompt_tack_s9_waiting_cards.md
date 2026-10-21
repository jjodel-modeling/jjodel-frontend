# Tack slice 9: waiting lanes as cards, and /api/attention

Prompt-ID: P-2026-10-21-1025
Chat: C-2026-10-19-1748
Front: tack
Lane: full (one discovery pass inside the lane, then implementation; no hard stop)
Status: eseguito 2026-10-21 · lane tack-s9 · completed by P-2026-10-21-1117 (first session stopped at the context ceiling, nothing committed) · 5b7c02c12 · visual check by the chat on 4710 (RC-23) pending
Depends: P-2026-10-21-1015
Corregge: none
Request: Alfonso, 2026-10-21 10:12, in the project chat: «Esegui in /lane auto» on the relayed requirement 3 from chat C-2026-10-20 (09:54): waiting lanes shown as cards with what is needed to answer without opening the lane; and the chat's plan of the same morning: a Tack `/api/attention` with the shape of the 4700 one, so the menu bar app can point to Tack later

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 reduced to item 1, written into the log entry; no hard stop. P8 replaced: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-s9`, branch `tack-s9`, created by the chat from `alfonso-frontend-jjtl` after the merge of `tack-stops` (P-2026-10-21-1015). Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1025 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`. Never read a whole file over 300 lines. Tests with `--test-reporter=dot` piped through `grep -E 'not ok|# (tests|pass|fail)'`. Handoff at 120k.

## Context
The Lanes page lists waiting lanes as rows under «Needs attention». After P-2026-10-21-1015 every waiting lane has a `stop_kind` (breakpoint, ceiling, hard-stop) or is a `question`, and an `auto` count (R-TACK-6). Tack never stores message text (privacy test of slice 2).

## COSA
1. Measure (log entry): over the waiting lanes of the last 14 days, how often the last result text has a `Recommended:` line, a question, a named planned stop; how the 4700 board extracts `firstLine` and `recommended` for `/api/attention` (`frontend/scripts/lane-board/lane-board.mjs`, read by range only, no change).
2. **Waiting cards**, above the running cards, one per waiting lane, ordered by waiting time (longest first): Prompt-ID and title; the kind of wait as a pill (`GO` for a breakpoint, `answer` for a question, `ACK` for a ceiling whose continuation needs a go, `hard-stop` for an unplanned stop); the reason: for a question its text, for a stop the first sentence of the closing message that names it (at most 300 characters, ellipsis); the `Recommended:` line when present, set apart; waiting since (relative and absolute time); the chat that must answer, linked to its URL (Request: header, else the `Claude-Session:` trailer of the prompt's commit, as the 4700 board does) and shown as plain text when no URL resolves. **The text is read from the lane's `log.jsonl` when the page asks for it and is never written to the store** (extend the privacy test to prove it).
3. The banner «N lanes waiting» scrolls to the cards; when exactly one lane waits, the banner itself shows that card.
4. **`/api/attention`** in Tack with the shape documented in `frontend/scripts/lane-board/README.md` («The menu bar app's routes»): `v`, `now`, `stale`, `board`, `waiting`, `blocked`, `running`, `staleCount`, `staleOldest`, `items[]`, `runningItems[]`, under 2 KB, no CORS header. A test checks the shape against a fixture shaped like the 4700 answer.
5. Tests for the cards (each wait kind, Recommended present and absent, chat linked and plain), the single-card banner, and `/api/attention`. Full suite green.
6. Restart the board on 4710 from this worktree as the previous slices did (`TACK_NOTIFY=off`, store copy). Report the waiting count and one card's fields from the API.
6b. **Follow-ups reported by P-2026-10-21-1015** (same slice, before item 7): (a) a prompt with no `## HARD STOP` section counts as breakpoint when the closing text names a planned stop (Phase 1, visual check, report committed): 4 of 10 sampled hard-stops were such; (b) the swatches of breakpoint, ceiling, hard-stop and the other outcomes reach 3:1 between each other on the light and the dark page (today 1.7 to 2.2:1), measured in a test; (c) the notifier fires distinct events for breakpoint, ceiling and hard-stop instead of «Lane in hard-stop» for all three, with the catalogue and the settings page updated.
7. Code commits (one per item 2-4 is fine), one docs commit with the log entry and this prompt's `Status:` line.

## DOVE
`tack/**`, `docs/log-inbox/tack.md`, this prompt file. Nothing else.

## NON FARE
No change to the 4700 board (R-TACK-2), to `lane-run.mjs` or to governance files. No message text in the store. No push, no merge.
