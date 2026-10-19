# Tack slice 8, fix: the Lanes page never renders in a browser

Prompt-ID: P-2026-10-20-0015
Chat: C-2026-10-19-1748
Front: tack
Lane: fast (one-line fix with a regression test, on the slice 8 branch before its merge)
Status: da eseguire
Depends: P-2026-10-19-2330
Corregge: P-2026-10-19-2330
Request: Alfonso, 2026-10-19 23:43, in the project chat: «gestisci il tuo in automatico» (R-TACK-4: continuation lanes of approved work are decided by the chat)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the chat found the cause, see Context). P8 replaced: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-s8`, branch `tack-s8`, HEAD at the chat's log-entry commit on top of `5d2146df9`, clean tree. Before anything else: `pwd`, branch, `git log -3 --oneline`, `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-20-0015 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 30 minutes. Node: `~/.local/bin/node`. Read only the lines you change. Tests with `--test-reporter=dot` piped through `grep -E 'not ok|# (tests|pass|fail)'`.

## Context
On the board (http://localhost:4710, `#lanes`) the page stays on «Loading the lanes…». The browser console shows `Uncaught TypeError: Illegal invocation at Object.start (lanes.js:96:37)`. In `tack/src/board/lanes.js`, `poller` defaults `timers = { setInterval }` and calls `timers.setInterval(tick, every)`: in a browser, `setInterval` called as a method of another object throws. The throw happens before `root.TackViews.lanes` is assigned, so the view is never registered. Node accepts the call, which is why the 208 tests passed. `/api/lanes` itself answers 200 with correct data.

## COSA
1. Fix the default so `setInterval` is called unbound (for example `timers = { setInterval: (fn, ms) => setInterval(fn, ms) }`), with no other change to `poller`.
2. Register `root.TackViews.lanes` before starting the poller, so a failure in the poller can never leave the view unregistered.
3. Regression test in the existing lanes view test: the default timers are invoked with no receiver (a stub `setInterval` that throws when `this` is an object other than `globalThis` or `undefined`), and the view is registered even when `start()` throws.
4. Full suite green (≥ 208). Restart the board on 4710 from this worktree as P-2026-10-19-2330 did (PID in `/tmp/tack-s8/board.pid`, `TACK_NOTIFY=off`, store `/tmp/tack-s8/real.db`).
5. One commit `fix(tack): lanes view registers and polls in a browser (P-2026-10-20-0015)`; one log entry in `docs/log-inbox/tack.md`; this prompt's `Status:` line, copied onto the branch from the trunk in the same docs commit.

## DOVE
`tack/src/board/lanes.js`, its test file, `docs/log-inbox/tack.md`, this prompt file. Nothing else.

## NON FARE
No other change. No push, no merge.

## RIFERIMENTI
- `tack/src/board/lanes.js` lines 90-122
