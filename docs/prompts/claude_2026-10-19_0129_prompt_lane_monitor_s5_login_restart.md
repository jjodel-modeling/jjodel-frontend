# Lane monitor menu bar app, slice S5: login item and «Restart board»

Prompt-ID: P-2026-10-19-0129
Chat: C-2026-10-18-2225
Front: harness
Status: da eseguire
Lane: phase2 (slice S5 of 5, the last, of the plan in the P-2026-10-18-2255 report; one slice per session, RC-52)
Depends: P-2026-10-19-0054
Corregge: —
Request: Alfonso, 2026-10-18 23:00: «Tauri va bene», «procedi nella maniera più automatica possibile con /lane auto e non ti fermare, procedi con l'implementazione».
Approved: Tauri 2 with its official plugins, under NON-NEGOTIABLE rule 4 (Alfonso, 2026-10-18 23:00, header of P-2026-10-18-2255; `tauri-cli` explicitly 2026-10-18 23:23). The crates of this slice are its rows in the dependency table of the P-2026-10-18-2255 report §Q4; any other crate: stop and ask.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the discovery is the committed report). P8 is the check below, run by the chat.

Worktree: `~/jjodel-w-menubar`, branch `menubar-disc`, at the closure commit of the previous slice or later commits of this chat. Before anything else: `pwd`, branch, `git log -1`, `git status` clean; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-0129 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 75 minutes; cargo builds in the background with output to a log under `/tmp/menubar/`, read by tail. Context ceiling RC-51. Read `tools/lane-monitor-app/README.md` and the S2 entry in `docs/log-inbox/harness.md` first: they describe what exists.

## Context (do not redo the analysis)
Report §Q4 «Login item» (`tauri-plugin-autostart` with `MacosLauncher::LaunchAgent`, a second agent distinct from `io.jjodel.lane-board`) and §Q7 row S5. The board's own agent stays as it is and is never edited. «Restart board» runs `launchctl kickstart -k gui/<uid>/io.jjodel.lane-board` only when the board URL is `http://127.0.0.1:4700`; in any other run it is shown disabled with the reason.

## COSA
1. Tests first: `cargo test` on the restart command builder (uid, label, the 4700-only rule) and on the toggle state mapping; the command is never executed in a test or check.
2. A «Start at login» toggle in the popover footer through `tauri-plugin-autostart`; «Restart board» enabled per the rule.
3. Checks: rebuild the bundle into `~/Applications/Lane Monitor.app`; toggle on writes `~/Library/LaunchAgents/<bundle id>.plist` (`plutil -p`), toggle off removes it; `shasum ~/Library/LaunchAgents/io.jjodel.lane-board.plist` identical before and after; in a 4712 run «Restart board» is disabled with the reason. Leave the toggle **off** at the end: Alfonso turns it on himself.
4. README: a final «Install and first run» section in English: build, copy to `~/Applications`, the three one-time clicks (notification permission, Login Items approval, Edge «Always allow localhost:4700 to open Lane Monitor»), the config file, how to switch the board URL, and that the board on 4700 shows `/api/attention` only after the release tree is updated and the agent restarted.
5. Before stopping, point the installed app back to the real board: set `~/Library/Application Support/io.jjodel.lane-monitor/config.json` to `{"board":"http://127.0.0.1:4700"}` (S4 left it on 4712) and relaunch `~/Applications/Lane Monitor.app`; until the release tree carries S1, the popover says «board too old», which is expected. Record in the README that a second permission alert may appear for the `~/Applications` copy (seen in S4) and that windows opened from the tray menu may stay behind the frontmost app with synthetic clicks (S4), to be confirmed by a real click.
6. Stop with `Outcome: hard-stop` for the chat's check; after the GO, commits and `Outcome: done`.

## DOVE
`tools/lane-monitor-app/src-tauri/src/main.rs`, `src-tauri/src/restart.rs` (new), `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/capabilities/default.json`, `tools/lane-monitor-app/ui/{popover.html, popover.js}`, `tools/lane-monitor-app/README.md`, `docs/log-inbox/harness.md`, this prompt's Status line. Outside the repo: `~/Applications/Lane Monitor.app` and the app's own LaunchAgent plist during the toggle check. Anything else: stop and ask.

## Commits (P13, RC-17), explicit pathspecs, no push
Code: `feat(lane-monitor-app): start at login and restart the board (P-2026-10-19-0129)`. Docs: Status flip and the P9 entry. Trailer `Model:` (P6).

## NON FARE
Never run `launchctl kickstart` on `io.jjodel.lane-board`, never edit its plist. No change to the board or `frontend/`.
