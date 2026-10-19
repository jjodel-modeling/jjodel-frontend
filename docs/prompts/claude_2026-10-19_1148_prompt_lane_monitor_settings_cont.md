# Lane monitor app settings and theme, continuation after the context ceiling: Quit, checks, closure, reinstall

Prompt-ID: P-2026-10-19-1148
Chat: C-2026-10-18-2225
Front: harness
Lane: phase2 (continuation of P-2026-10-19-1125 under RC-51; same worktree, uncommitted diff in place; menu bar app only)
Status: da eseguire
Depends: P-2026-10-19-1125
Corregge: —
Request: Alfonso, 2026-10-19 11:22 (rounded popover, settings, light and dark) and 11:29 («aggiungi una voce per uscire»), «procediamo» at 11:46. P-2026-10-19-1125 reached the context ceiling at 11:46 with its handoff written.
Approved: as in P-2026-10-19-1125 (Tauri 2 features already in use; no new crate).

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply. P8 is the chat's check of the captures.

Worktree: `~/jjodel-w-menubar2`, branch `menubar-settings`, with the uncommitted diff of P-2026-10-19-1125 in place (do not reset it). Before anything else: `pwd`, branch, `git log -1`, and `git status` showing that diff; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-1148 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 60 minutes. Node from `~/.local/bin` first in PATH. Context ceiling RC-51: keep reads short.

## Context (do not redo the analysis)
Read first `~/.jjodel-lanes/P-2026-10-19-1125/handoff.md` (the remaining checks in order, click coordinates, the steps after the GO) and, only where needed, `handoff.diff`. Already accepted by the chat at 11:42: rounded corners, settings view, board URL error, light contrast, decisions 1-5 of 1125. Implemented but unverified at the ceiling: the Quit button and Cmd+Q, 8 px more space above «Theme», the mono config path truncated at the start with the full path as tooltip.

## COSA
1. Read the background rebuild result (`/tmp/menubar/settings/build2.log`); rebuild if it failed.
2. Start a board from this worktree's trunk copy on 4712 with a private cache under `/tmp/menubar/settings/`, run the built app with the scratch `HOME` used by 1125 (never Alfonso's config), capture: popover footer dark and light with Quit, settings view dark and light. Test Quit by its button and Cmd+Q with the helper that targets only the test app's process (from the handoff); record both.
3. README: Quit, Cmd+Q and the settings view; the log inbox entry for 1125 and this lane.
4. `Outcome: hard-stop` for the chat's check. After the GO: the code commit (`feat(lane-monitor-app): rounded popover, settings view, light and dark theme, Quit (P-2026-10-19-1125, P-2026-10-19-1148)`), the docs commit (Status flips of both prompts, entries), then rebuild and replace `~/Applications/Lane Monitor.app` per the handoff (quit the running one, relaunch; Alfonso's `config.json` and Start at login untouched) and `Outcome: done`.

## DOVE
The files of P-2026-10-19-1125's DOVE, its prompt's Status line and this one's. Anything else: stop and ask.

## NON FARE
No change to the board, `frontend/`, the board's plist or 4700. No edit of Alfonso's `config.json` or the app's LaunchAgent. No new crate. No push.
