# Lane Monitor (menu bar app)

A macOS menu bar app over the lane board (`frontend/scripts/lane-board/`). The tray shows how
many lanes wait for the operator; a click opens a popover with the waiting lanes, oldest
first, and the running ones; «Open monitor» opens the board in an app window.

Tauri 2 (system WKWebView), Rust only: no npm package, no HTTP crate. Specification: the
P-2026-10-18-2255 report, `docs/discovery/discovery_2026-10-18_lane_monitor_menubar_app.md`
§Q4, §Q6, §Q7. Slice S2 (this shell) is P-2026-10-19-0000; notifications (S3), the
`jjodel-lanes://` deep link and the global shortcut (S4), the login item and «Restart board»
(S5) come later.

## Build

Toolchain measured on 2026-10-19: `rustc 1.94.1`, `cargo 1.94.1`, `tauri-cli 2.12.3`
(installed with `cargo install tauri-cli --version "^2" --locked`). The app's crates are
pinned by `src-tauri/Cargo.lock` (`tauri` 2.12.4, `tauri-build` 2.7.3).

```bash
cd tools/lane-monitor-app/src-tauri
cargo test                       # HTTP parse, payload, title formatter
cargo tauri build --bundles app  # target/release/bundle/macos/Lane Monitor.app
open "target/release/bundle/macos/Lane Monitor.app"
```

A cold build compiles a few hundred crates (minutes); a warm one takes seconds. `target/` and
`gen/` are gitignored. The bundle is signed ad hoc (`"signingIdentity": "-"`): enough for a
local app, and a locally built bundle carries no `com.apple.quarantine` attribute, so no
Gatekeeper dialog. Measured on the S2 build (2026-10-19): `du -sh` 4.4M (`cargo tauri build` reports
4.43 MiB); `xattr -p com.apple.quarantine` exits 1, «No such xattr» (control: `xattr -l` on the
same bundle lists `com.apple.provenance`); `codesign -dv`: `Signature=adhoc`.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `LANE_MONITOR_BOARD` | `http://127.0.0.1:4700` | Board URL, `http://host:port`, no path. Checks run against a second board on 4712, never 4700. |
| `LANE_MONITOR_OPEN_POPOVER` | unset | `1` opens the popover at launch, under the tray icon, and keeps it open on blur. A debug aid for screen captures; quit from the tray menu. |

To pass them to the bundle, run its binary directly:

```bash
LANE_MONITOR_BOARD=http://127.0.0.1:4712 \
  "target/release/bundle/macos/Lane Monitor.app/Contents/MacOS/lane-monitor" &
```

## What it does

- **Poll.** A Rust thread sends `GET /api/attention` (shape in
  `frontend/scripts/lane-board/README.md`) over `std::net::TcpStream`, every 30 s and at once
  when the popover opens or «Refresh now» is chosen; 2 s to connect, 15 s to answer (a board
  refresh can hold a request for seconds: 3.6 s measured on 4712). The page never polls the
  board itself (the board sends no CORS header).
- **Tray.** A monochrome template icon (three strokes, `icons/tray-16.png` on a 1x display,
  `icons/tray-32.png` on a 2x one) and a title: the `waiting` count, followed by `!` when a
  lane is blocked (a template icon cannot carry a coloured dot), `–` when there is no count
  (board unreachable, too old, or answering an error). The tooltip spells out the counts. A
  right click opens a menu: Open monitor, Refresh now, Quit Lane Monitor. No Dock icon
  (`ActivationPolicy::Accessory`).
- **Popover.** A borderless, always-on-top, 400 px wide webview (`ui/popover.*`), placed under
  the icon from the click's `rect`, hidden on blur or Escape, its height fitted to the content.
  Header with the board status dot and «synced HH:MM»; the three counts; «Waiting for you,
  oldest first», at most 4 rows (id, kind, first line, age; the title and the recommendation
  on hover; a click opens the monitor on `/#lane=<id>`) then «N more in the monitor»; «N stale,
  oldest D d» when `staleCount > 0`; «Running» (id, lane kind, phase, time left); «Open
  monitor» and a disabled «Restart board» (S5).
- **States.** `ok`; `unreachable` (no TCP connection: «Board unreachable»); `too-old` (404 on
  `/api/attention`, the board's tree predates S1: «Board too old: update the release tree»,
  which is what 4700 answers until the release tree is updated); `error` (no answer within 15 s, another
  status, or a body that is not the expected JSON). The tooltip and the popover carry the
  error detail.
- **Monitor window.** The board page in an app window, 1280×860, with no Tauri capability (a
  remote URL); closing it does not quit the app.

## Files

| Path | Role |
|---|---|
| `src-tauri/src/main.rs` | tray, popover window, monitor window, commands, poll thread |
| `src-tauri/src/poll.rs` | HTTP GET and response parse, payload types, snapshot, title formatter, tests |
| `src-tauri/tauri.conf.json` | bundle (ad-hoc signing, icons), `frontendDist: "../ui"`, CSP |
| `src-tauri/capabilities/default.json` | `core:default` for the popover only |
| `src-tauri/icons/` | tray template pair and the app icon set (`cargo tauri icon` from a 1024 px source) |
| `ui/` | the popover: static HTML, CSS and JS, system fonts, no network |
