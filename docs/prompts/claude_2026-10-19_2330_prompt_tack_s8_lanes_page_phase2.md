# Tack slice 8, Phase 2: the Lanes page

Prompt-ID: P-2026-10-19-2330
Chat: C-2026-10-19-1748
Front: tack
Lane: full (implementation of the plan in §6 of the slice 8 discovery report; three commits)
Status: da eseguire
Depends: P-2026-10-19-2320
Corregge: none
Request: Alfonso, 2026-10-19 23:28, in the project chat: «GO» on the slice 8 report and on the chat's acceptance of the five recommendations of its §7

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (discovery done in `fdc30f61b`). P8 replaced as in the earlier Tack slices: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-s8`, branch `tack-s8`, **reused**: HEAD `fdc30f61b` (the discovery report), clean tree. Before anything else: `pwd`, branch, `git log -1` and `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-2330 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

**Context budget, strict.** Read §0, §2, §6 and §7 of `docs/discovery/discovery_2026-10-19_tack_lanes_page.md`, by line range; the other sections only when §6 points there. Never read a whole source file: `grep -n`, then ranges. Do not open `frontend/scripts/lane-board/` except the line ranges the report cites. Tests with `--test-reporter=dot` piped through `grep -E 'not ok|# (tests|pass|fail)'`. Write a handoff at 120k.

## Ratified (do not reopen)
The five recommendations of report §7: Lanes is the first and default tab; a waiting lane closes only on a commit naming its ID, said in the tooltip; launched-by from the `Chat:` header, «—» otherwise; the median measured from the store per kind, last 30 days, n ≥ 5, else absent; `/api/lanes` collects on read, throttled to 20 s, skipped while a fresh notifier lease exists. The five unattended decisions of report §8 stand.

## COSA
1. The three commits of report §6, in order, each with its tests written first, each green before the next: schema 6 and the collector; `/api/lanes` with the throttle; the Lanes page (disabled phase and arch cells with their reasons, empty state, poll paused while hidden).
2. `tack/ROADMAP.md`: one entry «Phase ladder per project» (a ladder of phases defined in `tack.json`, replacing the Jjodel-specific regexes of the 4700 board), source this slice.
3. Full suite: report the counts run, passed, failed; all green, above 185.
4. Board for the visual check: stop the board on 4710 (PID in `/tmp/tack-s7/board.pid`, check it is a `tack` node process), start it from `~/jjodel-w-tack-s8/tack/bin/tack.mjs` on a fresh copy of the real store in `/tmp/tack-s8/real.db`, with `TACK_NOTIFY=off`, and leave it running; PID in `/tmp/tack-s8/board.pid`. Check `/`, `/api/lanes` answer with `curl`, and that `/api/lanes` shows P-2026-10-19-2330 as running.
5. Closure: one entry in `docs/log-inbox/tack.md` (test counts, the board choice, the unattended decisions); `Status:` of P-2026-10-19-2320 and of this prompt; `npm run check:docs` from `frontend/`.

## DOVE
`tack/**`, `docs/log-inbox/tack.md` (one entry), the `Status:` lines of P-2026-10-19-2320 and of this prompt. Nothing else.

## NON FARE
No new dependency. No change to `frontend/scripts/lane-board/` (R-TACK-2) or to `lane-run.mjs`. No real notification. No push, no merge.

## HARD STOP
None planned: close with `Outcome: done`, or `Outcome: question` for an RC-26 item.

## RIFERIMENTI
- `docs/discovery/discovery_2026-10-19_tack_lanes_page.md`
- `tack/README.md`, `tack/ROADMAP.md`
