# Lane Monitor app: the tray shows waiting and running counts

Prompt-ID: P-2026-10-21-1020
Chat: C-2026-10-19-1748
Front: harness
Lane: fast (tray title format in the menu bar app; the 4700 board is not touched, R-TACK-2)
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-21 10:12, in the project chat: «Esegui in /lane auto» on the relayed requirement 1 from chat C-2026-10-20 (09:54): the tray title shows both counts, waiting first, then running

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the change is fully specified). P8 replaced: the chat checks the tray after exit.

Worktree: `~/jjodel-w-lanemon-tray`, branch `lanemon-tray`, created by the chat from `alfonso-frontend-jjtl` after the merge of `lanemon-links` (P-2026-10-21-1008). Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1020 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. PATH includes `~/.cargo/bin`. Read only the lines you change.

## Context
The tray title is the `waiting` count, followed by `!` when a lane is blocked (`tools/lane-monitor-app/src-tauri/src/poll.rs`, the title function near line 303, and `main.rs:3`). On 2026-10-20, with 2 lanes running and 0 waiting, it showed «0», read as «0 running». `/api/attention` already returns `waiting`, `blocked` and `running`.

## COSA
1. Title: waiting first, then running, each with its sign: `⏸<n>` and `▶<n>`, separated by one space; a zero count is not shown; with both zero the title is empty and only the icon remains. Keep the blocked mark: `!` right after the waiting count when `blocked > 0` (for example `⏸1! ▶2`). A stale or unreachable board keeps today's behaviour.
2. Tooltip in full words: «1 lane waiting for you, 2 lanes running» (singular and plural right; «No lanes waiting or running» at rest; the blocked count named when > 0).
3. Tests on the pure title and tooltip functions: 2 running and 0 waiting → `▶2`; 1 waiting and 2 running → `⏸1 ▶2`; 0 and 0 → empty title; 1 waiting 1 blocked 0 running → `⏸1!`; the tooltip strings for the same cases. `cargo test` green.
4. `cargo tauri build --bundles app`; quit the running app, `ditto` the bundle over `~/Applications/Lane Monitor.app`, relaunch; report the bundle size and the title it shows now.
5. One `feat(lane-monitor-app)` commit, one docs commit with the log entry in `docs/log-inbox/harness.md` and this prompt's `Status:` line.

## DOVE
`tools/lane-monitor-app/src-tauri/src/poll.rs`, `tools/lane-monitor-app/src-tauri/src/main.rs` (only if the tooltip is set there), `docs/log-inbox/harness.md`, this prompt file.

## NON FARE
No change to the board or to `lane-run.mjs`; no new dependency. No push, no merge.
