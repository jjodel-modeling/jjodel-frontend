# Lane Monitor (menu bar app)

A macOS menu bar app over the lane board (`frontend/scripts/lane-board/`). The tray shows how
many lanes wait for the operator; a click opens a popover with the waiting lanes, oldest
first, and the running ones; «Open monitor» opens the board in an app window.

Tauri 2 (system WKWebView), Rust only: no npm package, no HTTP crate. Specification: the
P-2026-10-18-2255 report, `docs/discovery/discovery_2026-10-18_lane_monitor_menubar_app.md`
§Q4, §Q6, §Q7. Slice S2 (the shell) is P-2026-10-19-0000, S3 (notifications) is
P-2026-10-19-0033, the `jjodel-lanes://` deep link and the global shortcut (S4) is
P-2026-10-19-0054, the login item and «Restart board» (S5) is P-2026-10-19-0129, the rounded
popover, the Settings view and the light theme is P-2026-10-19-1125.

## Build

Toolchain measured on 2026-10-19: `rustc 1.94.1`, `cargo 1.94.1`, `tauri-cli 2.12.3`
(installed with `cargo install tauri-cli --version "^2" --locked`). The app's crates are
pinned by `src-tauri/Cargo.lock` (`tauri` 2.12.4, `tauri-build` 2.7.3,
`tauri-plugin-notification` 2.7.0, `tauri-plugin-deep-link` 2.6.2,
`tauri-plugin-global-shortcut` 2.4.1 on `global-hotkey` 0.8.0, `tauri-plugin-autostart` 2.7.0
on `auto-launch` 0.6.0).

```bash
cd tools/lane-monitor-app/src-tauri
cargo test                       # HTTP parse, payload, title formatter, notification transitions,
                                 # deep-link parser, config and shortcut parse, restart command
                                 # and footer controls, settings (board URL rule, patch, round
                                 # trip, atomic write)
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

The bundled app, opened from Finder, the Dock or LaunchServices (a `jjodel-lanes://` link),
gets no shell environment: it reads `~/Library/Application Support/io.jjodel.lane-monitor/config.json`
(the bundle identifier's directory). Every field is optional; an unknown field, or a file that
is not JSON, is reported in the popover footer and the defaults apply. The Settings view
(below) writes it: atomically (a `config.json.tmp` beside it, synced, then renamed over it), with
only the fields that are set.

```json
{
  "board": "http://127.0.0.1:4712",
  "shortcut": "Ctrl+Alt+Cmd+L",
  "theme": "system",
  "notifications": true
}
```

| Field | Default | Meaning |
|---|---|---|
| `board` | `http://127.0.0.1:4700` | Board URL, as `LANE_MONITOR_BOARD` below, which wins over it. |
| `shortcut` | `Ctrl+Alt+Cmd+L` (⌃⌥⌘L) | The global shortcut that toggles the popover, in `global-hotkey` notation: modifiers `Ctrl`, `Alt` (or `Option`), `Shift`, `Cmd` (or `Super`), then a key (`L`, `KeyL`, `J`, `1`, ...). `""` registers none. The fallback of report §Q5 is `Ctrl+Alt+Cmd+J`. Read at launch; saved from Settings, it is re-registered at once. |
| `theme` | `system` | `system` (follows the macOS appearance through `prefers-color-scheme`), `light` or `dark`. Applied on click from Settings. |
| `notifications` | `true` | `false` stops posting lane notifications; the macOS permission is left as it is. |

At launch the app logs `[lane-monitor] board <url> (from LANE_MONITOR_BOARD | config.json | default)`
on stderr. To read stderr of an app launched through LaunchServices:
`open --stderr /tmp/lane-monitor.log ~/Applications/Lane\ Monitor.app`.

| Variable | Default | Meaning |
|---|---|---|
| `LANE_MONITOR_BOARD` | `http://127.0.0.1:4700` | Board URL, `http://host:port`, no path. Checks run against a second board on 4712, never 4700. |
| `LANE_MONITOR_OPEN_POPOVER` | unset | `1` opens the popover at launch, under the tray icon, and keeps it open on blur. A debug aid for screen captures; quit from the tray menu or the popover's «Quit». |

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
  monitor» and «Restart board» (below), and at the right a quiet «Quit» (`aria-label` «Quit Lane
  Monitor»); a gear at the right of the header opens Settings. «Quit», and Cmd+Q while the
  popover has focus, exit the app through the `quit` command, logged as `[lane-monitor] quit
  from the popover`. When the app is active, the default macOS menu's Quit may take Cmd+Q
  first and exit without that line; the app quits either way.
  Rounded corners (radius 12 px, 1 px border) on a transparent window: the page paints only its
  rounded box, so the corners are the desktop. Since Tauri 2.12.1 a transparent window needs no
  `macos-private-api` feature (the crate's docs: «No-op since Tauri 2.12.1»), so none is enabled.
- **Settings.** Theme (System, Light, Dark, applied on click), Board URL and Global shortcut
  (applied on Save), Start at login and Notifications (applied on click), each saved to
  `config.json` at once. The Board URL field accepts `http://127.0.0.1:<port>` or
  `http://localhost:<port>` only (port 1-65535, one trailing `/` dropped); on Save the poller
  switches to it, the notification set is seeded again (the new board's waiting lanes are not
  news) and «Restart board» is re-evaluated. The shortcut is unregistered and the new chord
  registered; if that fails the old chord is registered again and nothing is saved. A field
  that does not pass shows its error under itself and nothing is written. Each show of the
  popover opens on the lanes view. The last line, «Saved in», gives the `config.json` path in
  the mono font, cut in the middle (the last two segments always shown), the full path as its
  tooltip. Logged as `[lane-monitor] settings saved: <json>`,
  `[lane-monitor] board <url> (from settings)`, `[lane-monitor] settings: <error>`.
- **Themes.** CSS variables on the root, picked by `data-theme` (`system` through
  `prefers-color-scheme`). Dark is the canvas palette; light: surface `#FFFFFF`, borders
  `#E5E6EA`, text `#16171B`, secondary `#5D616B`, muted `#80848E`, waiting `#B7791F`, blocked
  `#D64541`, running `#5B63D6`, ok `#2E9E66`. As text on white, muted (3.74:1), waiting (3.64:1)
  and blocked (4.39:1) are below 4.5:1, so text in those hues takes a darker step of the same hue
  (`#6A6E76`, `#966319`, `#C33F3B`) and the given values stay for dots, borders and fills.
  Checked with the WCAG 2 relative-luminance formula over every text colour on every surface it
  sits on (the page and the hover surface `#F3F4F6` / `#1F2126`), both themes: worst 4.66:1.
- **States.** `ok`; `unreachable` (no TCP connection: «Board unreachable»); `too-old` (404 on
  `/api/attention`: «Board too old: update the release tree»); `error` (no answer within 15 s, another
  status, or a body that is not the expected JSON). The tooltip and the popover carry the
  error detail. Measured on 2026-10-19 against 4700: a board whose tree predates S1 answers
  `/api/attention` (any path) with its HTML page and a 200, not a 404, so the app shows
  «Board error: bad JSON: expected value at line 1 column 1», not «too old».
- **Notifications.** A system notification when a lane **enters** the waiting list: a
  `question`, a `blocked`, or a `hard-stop` the board still counts as waiting. Title «Lane
  waiting for you» («Lane blocked» for a blocked lane), body `<id> · <kind>: <firstLine>`;
  a click opens the monitor window on `/#lane=<id>`. Never on every poll: the first good
  answer after launch only seeds the set of waiting ids (the lanes already waiting at launch
  do not notify); a lane that stays does not notify again, one that leaves and comes back
  does; a failed poll (board unreachable, an HTTP error, a 200 whose `board` reads `error:`)
  leaves the set as it was; a lane waiting for more than 72 hours (the board's
  `ATTENTION_STALE_H`) never notifies. Each one posted is logged on stderr as
  `[lane-monitor] notification posted: <id> | <title> | <body>`, a click as
  `[lane-monitor] notification action: tap on Some("<id>")`. The plugin is called from Rust
  only, so the popover's capability does not grow. Measured on 2026-10-19 (unified log,
  `/usr/bin/log`: in zsh, `log` is a builtin): the first notification posted makes macOS show
  its permission alert («Notifiche di "Lane Monitor"») and store the notification in
  Notification Center without a banner until the alert is answered; a rebuilt bundle, with
  the same CDHash or a different one, is not asked again.
- **Deep link.** `jjodel-lanes://P-YYYY-MM-DD-HHmm` (one trailing `/` allowed) opens the
  monitor window on `<board>/#lane=<id>`, whether the app is running or launched by the link;
  anything else (another id form, a path, a query) is refused and logged, never opened:
  `[lane-monitor] deep link: opening <id>` or `[lane-monitor] deep link refused: "<url>": <why>`.
  The board's `/l/<id>` page hands off to this link and falls back to `/#lane=<id>` after 1.5 s.
  The scheme sits in the bundle's `CFBundleURLTypes` (`plugins.deep-link` in
  `tauri.conf.json`); macOS registers it only for a bundle opened once from `/Applications` or
  `~/Applications`, so install with
  `cp -R "target/release/bundle/macos/Lane Monitor.app" ~/Applications/` and open it once.
  Check: `lsregister -dump | grep -c jjodel-lanes` ≥ 1 (`lsregister` is under
  `/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/`).
- **Global shortcut.** The chord of `config.json` (default ⌃⌥⌘L) toggles the popover from
  any app, under the tray icon. Registered at launch through Carbon `RegisterEventHotKey`:
  `[lane-monitor] shortcut ⌃⌥⌘L registered`, or `... not registered: <error>` and the same
  line in red in the popover footer, as is a chord that does not parse. A clash is mostly not
  reported: another app's menu key equivalent loses to the global hot key, and a second
  process registering the same chord succeeds too (measured 2026-10-19, two instances, both
  `registered`). The press was measured with a synthesised key (`osascript`, System Events).
- **Start at login.** A checkbox in Settings (in the popover footer until P-2026-10-19-1125), through `tauri-plugin-autostart` with
  `MacosLauncher::LaunchAgent`, called from Rust only (the capability does not grow). On, it
  writes `~/Library/LaunchAgents/io.jjodel.lane-monitor.plist` (label = the bundle identifier,
  `ProgramArguments` = the running binary, `RunAtLoad`); off, it removes the file; its state is
  whether the file exists, read again each time the popover shows. A second agent, distinct
  from the board's `io.jjodel.lane-board`, which the app never writes. Logged as
  `[lane-monitor] login item on|off`. Measured on 2026-10-19: macOS's background-task manager
  registers the plist as a «legacy agent» and posts its «Background item added» notice, which
  names `lane-monitor` (the executable: the plugin writes no `AssociatedBundleIdentifiers`).
  Turn it on from the copy in `~/Applications`, not from `target/`: the plist names the binary
  that was running.
- **Restart board.** Runs `/bin/launchctl kickstart -k gui/<uid>/io.jjodel.lane-board` and polls
  again 3 s later, only when the board URL is `http://127.0.0.1:4700` (one trailing `/`
  allowed): `localhost`, another port or a path are a check or a second board, never the
  agent's. In any other run the button is disabled and the reason is written under the footer
  (a disabled button shows no tooltip). Logged as `[lane-monitor] restart board: <argv>`.
- **Monitor window.** The board page in an app window, 1280×860, with no Tauri capability (a
  remote URL); closing it does not quit the app.

## Files

| Path | Role |
|---|---|
| `src-tauri/src/main.rs` | tray, popover window, monitor window, commands, poll thread |
| `src-tauri/src/poll.rs` | HTTP GET and response parse, payload types, snapshot, title formatter, tests |
| `src-tauri/src/links.rs` | the `jjodel-lanes://` parser, `config.json`, the shortcut parse and label; tests |
| `src-tauri/src/config.rs` | the Settings view: theme, board URL rule, the patch a save applies, the atomic write; tests |
| `src-tauri/src/restart.rs` | the `launchctl kickstart` argv and the 4700-only rule, the footer controls' state; tests |
| `src-tauri/src/notify.rs` | which lanes just started waiting, between two snapshots; notification text; tests |
| `src-tauri/tauri.conf.json` | bundle (ad-hoc signing, icons), `frontendDist: "../ui"`, CSP, the `jjodel-lanes` scheme |
| `src-tauri/capabilities/default.json` | `core:default` for the popover only |
| `src-tauri/icons/` | tray template pair and the app icon set (`cargo tauri icon` from a 1024 px source) |
| `ui/` | the popover: static HTML, CSS and JS, system fonts, no network |

## Install and first run

1. Build: `cd tools/lane-monitor-app/src-tauri && cargo tauri build --bundles app`.
2. Copy to `~/Applications` (the deep link registers only from there or `/Applications`):
   `ditto "target/release/bundle/macos/Lane Monitor.app" ~/Applications/"Lane Monitor.app"`, then
   open it once from Finder or with `open ~/Applications/"Lane Monitor.app"`.
3. Three one-time clicks:
   - **Notifications.** The first lane that starts waiting makes macOS ask whether Lane Monitor
     may notify: Allow. Until answered, notifications go to Notification Center without a
     banner. A second alert may appear for the `~/Applications` copy even if a build under
     `target/` was already allowed (seen in S4).
   - **Login Items.** Tick «Start at login» in Settings (the gear). macOS posts «Background item
     added» (measured); per report §Q4 the item is then listed in System Settings › General ›
     Login Items & Extensions, under «Allow in the Background», where it must stay allowed.
   - **Edge.** The first `jjodel-lanes://` link opened from the board's `/l/<id>` page asks
     whether `localhost:4700` may open Lane Monitor: tick «Always allow» and Open.
4. Config file: `~/Library/Application Support/io.jjodel.lane-monitor/config.json`, fields in
   «Configuration» above; with no file the app reads the board on `http://127.0.0.1:4700`.
5. To switch the board URL, type it in Settings › Board URL and Save: it applies at once.
   `http://127.0.0.1:4700` is the real board; «Restart board» is enabled only on it. Editing the
   file by hand still works, read at the next launch.
6. The board on 4700 runs from the release tree (`~/jjodel-release`). It answers
   `/api/attention` only after that tree carries S1 (P-2026-10-18-2320) and its agent is
   restarted; until then the popover says «Board error: bad JSON: expected value at line 1
   column 1» (the old board answers the path with its HTML page) and the tray shows `–`. That is
   expected, not a fault of the app.

Known with synthetic clicks only (S4), to be confirmed by a real click: a window opened from
the tray menu may stay behind the frontmost app.
