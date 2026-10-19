# Lane monitor app: rounded popover, a Settings view, light and dark theme

Prompt-ID: P-2026-10-19-1125
Chat: C-2026-10-18-2225
Front: harness
Lane: phase2 (one slice, the menu bar app only; no board change, no critical zone)
Status: da eseguire
Depends: P-2026-10-19-0129
Corregge: —
Request: Alfonso, 2026-10-19 11:22, in chat C-2026-10-18-2225, with a screenshot of the popover: «arrotonda i bordi ed aggiungi una voce settings con i vari settaggi, inoltre consenti la scelta del tema (light, dark)».
Approved: Tauri 2 with its official plugins (header of P-2026-10-18-2255). Enabling a feature of the `tauri` crate already in use (for example `macos-private-api` for a transparent window) is within that approval; any new crate: stop and ask.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (one slice on code written last night; the measurement below is the discovery). P8 is the visual check below, run by the chat.

Worktree: `~/jjodel-w-menubar2`, branch `menubar-settings`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, `git status` match; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-1125 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 90 minutes; cargo builds in the background with output under `/tmp/menubar/settings/`, read by tail. Use node from `~/.local/bin` (v26) first in PATH. Context ceiling RC-51. Read `tools/lane-monitor-app/README.md` first.

## Context (do not redo the analysis)
The app is `tools/lane-monitor-app/` (S2..S5 of P-2026-10-18-2255). The popover is a borderless always-on-top 400 px webview window; today its corners are square because the window is opaque. Its footer holds Open monitor, Restart board and the Start at login checkbox. The config file is `~/Library/Application Support/io.jjodel.lane-monitor/config.json`, with `board` and `shortcut` today (parser in `src-tauri/src/links.rs`; an unknown field is refused). The installed app is `~/Applications/Lane Monitor.app`, running, with Start at login on and `config.json` pointing to `http://127.0.0.1:4700`: Alfonso uses it.

## COSA
1. **Rounded corners.** The popover window gets rounded corners (radius 12 px, as the agreed design) with a real transparent outside, not a square window with a rounded box drawn inside it: transparent window plus CSS radius and a 1 px border, or the native rounded mask, whichever is cleaner on macOS 26. If it needs `macOSPrivateApi` / the `macos-private-api` feature, enable it and say so in the README. No visible square corner or shadow artifact in the captures.
2. **Settings view.** A gear button (inline SVG, `aria-label="Settings"`) at the right of the header opens a Settings view inside the popover, with a Back control to the lanes view. It shows and edits: **Theme** (System, Light, Dark; default System, following macOS appearance live); **Board URL** (validated `http://127.0.0.1:<port>` or `http://localhost:<port>`, applied on save without restarting the app); **Global shortcut** (the chord as text, re-registered on save, the registration error shown inline when it fails); **Start at login** (the existing toggle moves here from the footer); **Notifications** (on or off, default on: off stops posting without touching the macOS permission). Settings persist in `config.json` (new fields `theme`, `notifications`; the parser accepts them, still refuses unknown ones). Writes are atomic (temp file and rename). The footer keeps Open monitor and Restart board.
3. **Light theme.** A light palette for the popover and the settings view, with the same structure as the dark one: surface `#FFFFFF`, borders `#E5E6EA`, text `#16171B`, secondary `#5D616B`, muted `#80848E`, waiting `#B7791F`, blocked `#D64541`, running `#5B63D6`, ok `#2E9E66`. All text at 4.5:1 or better on its background in both themes; say how you checked. Theme via CSS variables on the root, switched by a class or `data-theme`, System through `prefers-color-scheme`.
4. Tests first: `cargo test` on the config parse and write (new fields, defaults, unknown field refused, round trip), and on the board URL validation. The UI logic for theme selection in `popover.js` is small: no JS test framework is added.
5. Build, then check against a board from this worktree on 4712 with a **separate config** (start the built app with `HOME` pointing to a scratch home under `/tmp/menubar/settings/home/` or with `LANE_MONITOR_BOARD`, so Alfonso's `config.json` and his running app are never touched). Captures under `/tmp/menubar/settings/`: popover dark, popover light, settings view in each theme, a board URL error, a shortcut error. Then `Outcome: hard-stop` for the chat's check (RC-23). After the GO: commits; then rebuild and replace `~/Applications/Lane Monitor.app` (quit the running one first, relaunch it, keep Alfonso's config untouched, Start at login stays as it is) and `Outcome: done`.

## DOVE
`tools/lane-monitor-app/ui/{popover.html, popover.css, popover.js}`, `tools/lane-monitor-app/src-tauri/{tauri.conf.json, Cargo.toml, Cargo.lock, capabilities/default.json}`, `tools/lane-monitor-app/src-tauri/src/*.rs` (a new `config.rs` is fine), `tools/lane-monitor-app/README.md`, `docs/log-inbox/harness.md`, this prompt's Status line. More than 5 files is expected and approved here (rule 19). Anything else: stop and ask.

## Commits (P13, RC-17), explicit pathspecs, no push
Code: `feat(lane-monitor-app): rounded popover, settings view, light and dark theme (P-2026-10-19-1125)`. Docs: Status flip and the P9 entry. Trailer `Model:` (P6).

## NON FARE
No change to the board, `frontend/`, the board's plist or the running board on 4700. No edit of Alfonso's `config.json` or of the app's LaunchAgent during the checks. No webfont, no npm package, no new crate.
