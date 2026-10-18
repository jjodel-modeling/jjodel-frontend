# Lane monitor menu bar app, slice S2: the Tauri 2 shell (tray title, popover, polling)

Prompt-ID: P-2026-10-19-0000
Chat: C-2026-10-18-2225
Front: harness
Lane: phase2 (slice S2 of 5 of the plan in the P-2026-10-18-2255 report; one slice per session, RC-52; new tree `tools/lane-monitor-app/`, outside `frontend/`; no critical zone)
Status: eseguito 2026-10-19 · lane menubar-disc · c5eadb816 · verifica visiva passata 2026-10-19 (chat, captures at 00:27: tray 1 on 4712, 6! on a blocked fixture, dash when unreachable; popover per the agreed design)
Depends: P-2026-10-18-2320
Corregge: —
Request: Alfonso, 2026-10-18 23:00: «Tauri va bene», «procedi nella maniera più automatica possibile con /lane auto e non ti fermare, procedi con l'implementazione».
Approved: Tauri 2 with its official plugins, and the install of `tauri-cli` 2 with `cargo install tauri-cli --version "^2" --locked`, under NON-NEGOTIABLE rule 4 (Alfonso, 2026-10-18 23:00, recorded in the header of P-2026-10-18-2255; `tauri-cli` approved again explicitly by Alfonso, 2026-10-18 23:23, «approvo `tauri-cli`»). The crates of this slice are the S2 rows of the report's dependency table; any crate outside that table: stop and ask.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the discovery is the committed report). P8 is the visual check below, run by the chat.

Worktree: `~/jjodel-w-menubar`, branch `menubar-disc`, at the S1 closure commit or later commits of this chat. Before anything else: `pwd`, branch, `git log -1`, `git status` clean; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-0000 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 90 minutes; a cold `cargo build` takes minutes: run it in the background with output to `/tmp/menubar/build-s2.log` and read the tail, never stream it. Context ceiling RC-51.

## Context (do not redo the analysis)
Specification: the P-2026-10-18-2255 report, §Q4 (tray with `icon_as_template(true)` and `set_title`, the popover as a borderless always-on-top 400 px webview window hidden on blur and placed from the tray click `rect`, `ActivationPolicy::Accessory`, polling from Rust over `std::net::TcpStream`, no HTTP crate, no npm, static `ui/` with `frontendDist: "../ui"`, ad-hoc signing `"signingIdentity": "-"`), §Q6 (layout of `tools/lane-monitor-app/`, the two `.gitignore` lines, `Cargo.lock` committed), §Q7 row S2. The client reads `GET /api/attention` from S1 (shape in the report §Q2 and in `frontend/scripts/lane-board/README.md`). Board URL from `LANE_MONITOR_BOARD`, default `http://127.0.0.1:4700`; until the release tree is updated, 4700 answers 404 on `/api/attention` and the popover says «board too old: update the release tree».

Design, agreed with Alfonso (canvas «Lane Monitor Desktop», artboard «Menu bar, notification, deep link»): dark surface `#121317`, borders `#1F2126`/`#2A2C33`, text `#EDEEF0`, secondary `#A1A4AB`, muted `#7E828B`; waiting amber `#F2B04C`, blocked red `#FF6B63`, running indigo `#8A93FF`, ok green `#4CC38A`; system font stack (no webfont, no network). Tray: monochrome template icon (three horizontal strokes of decreasing length, drawn as a 16/32 px PNG pair) and the `waiting` count as title, `–` when the board is unreachable; when `blocked > 0` the title is the count followed by `!` (a template icon cannot carry a coloured dot). Popover top to bottom: header «Lanes», board status dot and «synced HH:MM»; three counts (waiting for you, blocked, running); «Waiting for you, oldest first» with rows (id in mono, kind of decision, first line, age), at most 4 then «N more in the monitor»; one collapsed line «N stale, oldest D d» when `staleCount > 0`; «Running» with id, lane kind, phase, time left; footer «Open monitor» (opens the board in an app window, 1280×860) and a disabled «Restart board» placeholder (S5). No emoji, real `<button>`s, text contrast 4.5:1.

## COSA
1. `cargo install tauri-cli --version "^2" --locked`; record the version in the README.
2. Tests first: `cargo test` on the HTTP response parse (status line, headers, chunked and content-length bodies, a 404, a refused connection) and on the title formatter, with fixtures.
3. The app: files as listed in DOVE.
4. Build: `cargo tauri build --bundles app`; record `du -sh` of the bundle and that `xattr -p com.apple.quarantine` reports no attribute.
5. Run the built app against a board from this worktree on 4712 (`LANE_BOARD_CACHE=/tmp/menubar/board/timeline-cache.json`, never 4700) with `LANE_MONITOR_BOARD=http://127.0.0.1:4712`; take `screencapture -x` of the screen with the popover open (open it through the tray click if the session can, else through a debug env var `LANE_MONITOR_OPEN_POPOVER=1` that shows it at launch, documented in the README) and of the menu bar, under `/tmp/menubar/s2/`; then stop the 4712 board and capture the unreachable state. Leave the app and the 4712 board running for the chat's check (RC-23): `Outcome: hard-stop` with the capture paths. After the GO (a resume): commits, then `Outcome: done`.

## DOVE
`.gitignore` (the two lines of §Q6), `tools/lane-monitor-app/README.md`, `tools/lane-monitor-app/src-tauri/{Cargo.toml, Cargo.lock, build.rs, tauri.conf.json, capabilities/default.json, src/main.rs, src/poll.rs, icons/*}`, `tools/lane-monitor-app/ui/{popover.html, popover.css, popover.js}`, `docs/log-inbox/harness.md`, this prompt's Status line. More than 5 files is expected and approved here (rule 19). Anything else: stop and ask.

## Commits (P13, RC-17), explicit pathspecs, no push
Code commit: `feat(lane-monitor-app): Tauri 2 menu bar shell with tray count and popover (P-2026-10-19-0000)`. Docs commit: Status flip and the P9 entry in `docs/log-inbox/harness.md`. Trailer `Model:` (P6). Never commit `target/` or `gen/`.

## NON FARE
No notifications, deep link, global shortcut or login item (S3..S5). No npm package, no HTTP crate, no plugin outside the S2 rows. No change to the board or to `frontend/`. No touch of 4700, its plist or cache. No copy of the app to `~/Applications` yet (S4).

## RIFERIMENTI
The P-2026-10-18-2255 report (§Q4, §Q6, §Q7); `frontend/scripts/lane-board/README.md` (`/api/attention`).
