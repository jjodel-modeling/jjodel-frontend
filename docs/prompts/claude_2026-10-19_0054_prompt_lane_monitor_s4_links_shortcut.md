# Lane monitor menu bar app, slice S4: deep link `jjodel-lanes://` and the global shortcut

Prompt-ID: P-2026-10-19-0054
Chat: C-2026-10-18-2225
Front: harness
Status: eseguito 2026-10-19 · lane menubar-disc · e76383e8d · verifica visiva passata 2026-10-19 (chat, 01:10 and 01:21: lsregister lists jjodel-lanes, cold and warm links open the monitor on the lane, refusals logged, shortcut toggles the popover, footer error, /l/ fallback after 1.5 s; window opener off the main thread)
Lane: phase2 (slice S4 of 5 of the plan in the P-2026-10-18-2255 report; one slice per session, RC-52)
Depends: P-2026-10-19-0033
Corregge: —
Request: Alfonso, 2026-10-18 23:00: «Tauri va bene», «procedi nella maniera più automatica possibile con /lane auto e non ti fermare, procedi con l'implementazione».
Approved: Tauri 2 with its official plugins, under NON-NEGOTIABLE rule 4 (Alfonso, 2026-10-18 23:00, header of P-2026-10-18-2255; `tauri-cli` explicitly 2026-10-18 23:23). The crates of this slice are its rows in the dependency table of the P-2026-10-18-2255 report §Q4; any other crate: stop and ask.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the discovery is the committed report). P8 is the check below, run by the chat.

Worktree: `~/jjodel-w-menubar`, branch `menubar-disc`, at the closure commit of the previous slice or later commits of this chat. Before anything else: `pwd`, branch, `git log -1`, `git status` clean; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-0054 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 75 minutes; cargo builds in the background with output to a log under `/tmp/menubar/`, read by tail. Context ceiling RC-51. Read `tools/lane-monitor-app/README.md` and the S2 entry in `docs/log-inbox/harness.md` first: they describe what exists.

## Context (do not redo the analysis)
Report §Q4 «Custom URL scheme» and «Global shortcut», §Q5 (⌃⌥⌘L, fallback ⌃⌥⌘J, configurable), §Q7 row S4. `/l/<id>` on the board (S1) already hands off to `jjodel-lanes://<id>` and falls back to `/#lane=<id>` after 1.5 s. The scheme is registered by LaunchServices only for a bundled `.app` opened from `~/Applications`.

## COSA
1. Tests first: `cargo test` on the deep-link parser (`jjodel-lanes://P-YYYY-MM-DD-HHmm` accepted, anything else rejected with a log line, never opened) and on the shortcut config parse (default, override, invalid).
2. `tauri-plugin-deep-link` with `schemes: ["jjodel-lanes"]`: a valid link opens the app window on `<board>/#lane=<id>`. `tauri-plugin-global-shortcut`: ⌃⌥⌘L toggles the popover; the chord comes from the app config; a registration failure is shown in the popover footer.
3. Build `cargo tauri build --bundles app`, copy the bundle to `~/Applications/Lane Monitor.app` (replace a previous copy of this same app only), open it once, check `lsregister -dump | grep -c jjodel-lanes` ≥ 1, then `open 'jjodel-lanes://P-2026-10-18-2255'` and read the app's log line; with the app against a board from this worktree on 4712 (`LANE_MONITOR_BOARD` honoured by the bundled app through its config file, document how). Shortcut: record whether registration succeeded; pressing it needs a human or an accessibility-enabled process, so if the session cannot synthesise the key press, say so and leave the press test to Alfonso, listing the five apps from §Q5.
4. Stop with `Outcome: hard-stop` for the chat's check (the chat opens `http://localhost:4712/l/P-2026-10-18-2255` in the built-in browser to see the hand-off and fallback); after the GO, commits and `Outcome: done`.

## DOVE
`tools/lane-monitor-app/src-tauri/src/main.rs`, `src-tauri/src/links.rs` (new, parser and shortcut config), `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `tools/lane-monitor-app/README.md`, `docs/log-inbox/harness.md`, this prompt's Status line. Outside the repo: `~/Applications/Lane Monitor.app` only. Anything else: stop and ask.

## Commits (P13, RC-17), explicit pathspecs, no push
Code: `feat(lane-monitor-app): jjodel-lanes:// links and the global shortcut (P-2026-10-19-0054)`. Docs: Status flip and the P9 entry. Trailer `Model:` (P6).

## NON FARE
No login item (S5). No change to the board or `frontend/`. No touch of 4700, its plist or Edge settings.
