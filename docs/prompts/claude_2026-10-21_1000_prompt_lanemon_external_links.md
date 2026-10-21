# Lane Monitor app: external links in the «Lane board» window open in the browser

Prompt-ID: P-2026-10-21-1000
Chat: C-2026-10-19-1748
Front: harness
Lane: fast (bug fix in the menu bar app, allowed on the frozen board by R-TACK-2; launched by the tack chat at Alfonso's request)
Status: eseguito 2026-10-21 · lane lanemon-links · c63d12669
Corregge: none
Request: Alfonso, 2026-10-21 08:54 («nella finestra che si apre cliccando sull'icona nella topbar, il link alla chat non funziona») and 09:48 («se non hai risolto procedi in /lane auto»)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 reduced: the chat found the cause (Context); confirm it in the log entry, no separate report. P8 replaced: the chat checks the app after exit.

Worktree: `~/jjodel-w-lanemon-links`, branch `lanemon-links`, created by the chat from `alfonso-frontend-jjtl` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1000 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. PATH must include `~/.cargo/bin`. Read only the lines you change.

## Context
Clicking the tray icon, then opening the board, shows the 4700 board in a Tauri webview window «Lane board» (`tools/lane-monitor-app/src-tauri/src/main.rs`, `open_monitor_window`, about lines 255-280, `WebviewWindowBuilder::new(app, MONITOR, WebviewUrl::External(url))`). The board renders the chat link as `<a href="https://claude.ai/..." target="_blank" rel="noopener">` (`frontend/scripts/lane-board/lane-board.mjs:2058`). The app registers no opener plugin and no navigation or new-window handler, so in WKWebView the click is dropped: nothing opens. Every external link in that window has the same defect. `tauri` is pinned at 2.12.4 in `src-tauri/Cargo.lock`.

## COSA
1. A pure function in `src-tauri/src/links.rs`, for example `fn route(board: &Url, target: &Url) -> Route { Inside, Browser, Refuse }`: same scheme, host and port as the board → Inside; any other `http` or `https` → Browser; anything else (file, javascript, data, custom schemes other than `jjodel-lanes`) → Refuse. Unit tests next to the existing ones in `links.rs`, including a claude.ai chat URL, the board's own `/#lane=` URL, a different localhost port, and a `javascript:` URL.
2. In `open_monitor_window`: `.on_navigation(...)` allows Inside, and for Browser runs `open <url>` (`std::process::Command::new("open").arg(url.as_str())`, the app is macOS only) and returns false; Refuse returns false. Also handle new-window requests from `target="_blank"`: use the builder's new-window hook if tauri 2.12.4 has one (check the crate source under `~/.cargo/registry`, cite the file and line in the log entry), routing through the same function and never creating a window; if it has none, say so and inject nothing in the board (R-TACK-2: the board itself is not changed).
3. No new dependency. No change to `frontend/scripts/lane-board/` or to the board's HTML.
4. `cargo test` in `src-tauri` green; `cargo tauri build --bundles app` green. Install: quit the running app (`osascript -e 'quit app "Lane Monitor"'`), copy the new bundle over `~/Applications/Lane Monitor.app` (`ditto`), relaunch it with `open`. Report the bundle size and that the tray is back.
5. One `fix(lane-monitor-app)` commit, one docs commit with the log entry (in `docs/log-inbox/harness.md`) and this prompt's `Status:` line.

## DOVE
`tools/lane-monitor-app/src-tauri/src/links.rs`, `tools/lane-monitor-app/src-tauri/src/main.rs`, `docs/log-inbox/harness.md`, this prompt file. Nothing else.

## NON FARE
No change to the board, to `lane-run.mjs`, to `Cargo.toml` dependencies. No push, no merge.
