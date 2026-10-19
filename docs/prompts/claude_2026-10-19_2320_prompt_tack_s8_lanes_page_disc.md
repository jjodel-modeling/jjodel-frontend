# Tack slice 8: the Lanes page

Prompt-ID: P-2026-10-19-2320
Chat: C-2026-10-19-1748
Front: tack
Lane: full (discovery first; new board page on the existing store, one collector extension at most)
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-19 22:43 («non capisco, questa è la pagina sessions su 4710 nella quale non vedo lanes») and 23:15 («decidi tu» on the chat's proposal, ratified as R-TACK-2 and R-TACK-3)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced as in the earlier Tack slices: the chat checks the board after exit (RC-23). Phase 2 runs as a **new lane** that takes the discovery report as input, not as a GO on this session: slice 7 lost two sessions to the context ceiling by carrying the discovery into Phase 2.

Worktree: `~/jjodel-w-tack-s8`, branch `tack-s8`, created by the chat from `alfonso-frontend-jjtl` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1` and `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-2320 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`.

**Context budget, strict.** Never read a whole file. `frontend/scripts/lane-board/lane-board.mjs` is 2,332 lines: locate with `grep -n` and read ranges only. Read Tack modules by function. Write a handoff at 120k.

## Context
Tack (`tack/`, slices 1-7 on trunk, last merge `f694c9ac4`, 185 tests) shows sessions, timeline, insights and settings. It has no view of lanes as such: lanes appear only as units in the Sessions table. The view Alfonso uses most is the Lanes page of the 4700 board (`frontend/scripts/lane-board/`), which R-TACK-2 freezes. Slice 7 already stores what a live lane view needs: per lane the outcome of the last turn, liveness, log mtime, critical-zone flag, front and chat from the prompt header, merge state (schema 5). The notifier polls lanes every 20 s.

What the 4700 Lanes page shows (from Alfonso's screenshot, 2026-10-19 22:43): tiles Running, Waiting, Blocked (now), Done and Resolved (last 24 h), Spend today; a banner «N lanes are waiting for a GO, ACK or answer» with a button to show them; Running cards (Prompt-ID, kind and tier, elapsed against the median, title, phase progress bar «4/5 · Commit» with the next phase, started, tokens in, context peak, worktree, launched by chat); a Last 24 hours table (lane and title, outcome, kind, window, work and span, tokens, context and arch, cost, worktree, launched by); a left list by state (running, question, hard-stop, blocked, resolved, done 24 h) and Needs attention (waiting, blocked, stale).

## COSA

### Phase 1 (read-only, then hard stop)
Write `docs/discovery/discovery_2026-10-19_tack_lanes_page.md`, opening with `## 0. Answer in brief` (five lines at most). With `file:line` evidence, it must answer:
1. For each element listed in Context: the 4700 source (function in `lane-board.mjs`), the Tack source (store table and column), and the gap if any. In particular: phase progress (where the 4700 board reads phases and the median), «resolved», «stale», «work / span», «arch» context, and the kind labels (fast, phase2, merge, direct).
2. Which gaps close with a small change to the lane-run collector of Tack, and which cannot in this slice (they become disabled elements with the reason, not invented numbers).
3. Unattended decisions: where the RC-21 and RC-25 adoptions appear in the lane logs, whether they can be parsed reliably, and the shape of a read-only panel listing them per lane (input to `tack/ROADMAP.md`, autonomy policy).
4. Project-agnostic behaviour: on a repository without lane folders the page must say so and show nothing invented; how the page decides that (the slice 4 adoption metrics).
5. Live refresh: reuse of the slice 7 poll, or a separate interval, and the cost measured on the real store copy.
6. A plan for Phase 2 in at most three commits, with the tests, and the open questions, each with `Recommended:`.

Commit the report alone, then stop with `Outcome: hard-stop`.

### Phase 2
Not in this lane. The chat writes a new prompt from the report after Alfonso's GO.

## DOVE
The discovery report and this prompt's `Status:` line. Nothing else.

## NON FARE
No code change. No change to `frontend/scripts/lane-board/` (frozen, R-TACK-2) or to `lane-run.mjs`. No push.

## HARD STOP
End of Phase 1 (report committed).

## RIFERIMENTI
- `tack/README.md`, `tack/ROADMAP.md`
- `docs/discovery/discovery_2026-10-19_tack_settings_notifications.md` (§0 only)
- `docs/decisions.md`, section R-TACK
