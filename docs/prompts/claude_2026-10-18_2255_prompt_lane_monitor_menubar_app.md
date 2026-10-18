# Lane monitor as a menu bar app: badge, login start, global shortcut, deep links (discovery)

Prompt-ID: P-2026-10-18-2255
Chat: C-2026-10-18-2225
Front: harness
Lane: full (discovery, read-only on product, board and governance; Phase 2 written by the chat after the report)
Status: da eseguire
Depends: —
Corregge: —
Request: Alfonso, 2026-10-18 22:24-22:55, in the design chat of the lane monitor: the board should feel like a professional standalone tool; of the options discussed he wants four: a menu bar badge with the number of pending decisions, start at login, a global shortcut that opens the decision queue, deep links such as `jjodel-lanes://P-2026-10-18-2215` clickable from the chats; «scrivi il prompt» at 22:55
Approved: Alfonso, 2026-10-18 23:00, in the same chat: «Tauri va bene», then «procedi nella maniera più automatica possibile con /lane auto e non ti fermare, procedi con l'implementazione». The Tauri 2 stack with its official plugins is approved under NON-NEGOTIABLE rule 4; the chat writes and launches Phase 2 as soon as the report is in the repo (RC-26), without waiting for him.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply in Phase 1 (no UI is built). No product code, no board code is written in this phase.

Worktree: `~/jjodel-w-menubar`, branch `menubar-disc`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: heavy, as pinned (RC-16), effort `high`.

## Lane discipline
Every reply opens with `[P-2026-10-18-2255 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes (RC-20). Context ceiling RC-51 applies. Output discipline (CLAUDE.md §0.1): `frontend/scripts/lane-board/lane-board.mjs` is 1864 lines, read it with Read and `offset`/`limit`, never whole; the same for `lane-run.mjs`. If time or context runs short, priority is: Q1, then Q2, then Q4, then the rest; anything not reached is named in §Open questions of the report.

This is Phase 1 only. It ends with a hard stop: `Outcome: hard-stop`.

## Context (do not redo the analysis)
The board is `frontend/scripts/lane-board/lane-board.mjs` (Node, no dependencies), served on `127.0.0.1:4700` by the launchd agent `io.jjodel.lane-board` with `RunAtLoad` and `KeepAlive` (README «launchd agent», `:343-368`). So the **server already starts at login**: the app must not own it, embed Node or replace the agent. The app is a thin client of the board: if it quits or crashes, the board stays up. Its own login start is a separate matter (login item), and «restart the board» is `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`.

Routes today (`lane-board.mjs:1813-1864`): `/`, `/api`, `/api/timeline`, `/api/insights`, `/api/requirements`, the three `.js` assets and the two exports. Several match on `req.url ===`, so a query string breaks them; a new route must use `url.pathname`.

The header pills are counted in the page from the `/api` rows by `stripKey` (`:1528-1543`): `question`, `hard-stop` and `blocked` are counted **over all time**, `done` only over 24 h. On 2026-10-18 at 22:24 the strip read 10 question, 174 hard-stop, 1 blocked. A badge that shows «10» must mean «10 decisions you owe now»; nobody has checked that the 10 are that and not stale lanes later superseded by a continuation or resumed under another id. The 174 hard-stops are certainly mostly closed: a Phase 1 hard-stop is followed by a Phase 2 lane.

Design agreed with Alfonso in the chat (canvas «Lane Monitor Desktop», artboard «Menu bar, notification, deep link»): a monochrome template icon in the menu bar with the pending count beside it and a small red dot when at least one lane is blocked; clicking it opens a 400 px popover with three counts (waiting for you, blocked, running), the pending lanes oldest first (id, kind of decision, first line, age), the running lanes with phase and time left, and two actions (Open monitor, Restart board); a system notification **only on the transition** of a lane into question or blocked, never on every poll; the main window is the existing board page. For deep links the design does not rely on the custom scheme being clickable inside claude.ai: chats would carry `http://localhost:4700/l/<Prompt-ID>`, which is clickable everywhere, and the board answers with a page that hands off to `jjodel-lanes://<Prompt-ID>` when the app is installed and otherwise shows the lane in the web board. Whether claude.ai renders a `jjodel-lanes://` link as clickable is unverified; the chat checks it in the built-in browser (RC-23), not the lane. The stack the chat proposed is Tauri 2 (Rust is installed on the Mac: `~/.cargo`, `~/.rustup`), against Electron (about 150 MB, worth it only to embed Node, which is excluded above) and a native Swift `MenuBarExtra`.

## COSA
Answer each question with measurements on this machine and `file:line`, not from memory (CLAUDE.md §5, absence requires a positive control).

1. **Q1, what «pending» means.** For every row that `stripKey` counts as `question`, `hard-stop` or `blocked` today, decide whether it is pending, with the evidence: a later lane that continues it (`Depends:`, `Corregge:`, a continuation prompt, a `resolved` outcome), an `input-k.md` after its last `result`, its Status line, its age. Give the table with counts. Then propose one rule, computable from what the board already reads, for «waiting for you» and for its age (from the end of the last turn, the same rule as the Insights wait histogram), and state how many of today's 10 / 174 / 1 it keeps. A rule that would keep more than a handful of hard-stops is wrong by construction: say why it keeps them.
2. **Q2, the board side.** Specify, without writing it, `GET /api/attention`: `{ now, waiting: n, blocked: n, running: n, items: [{ id, kind: 'question'|'blocked'|'hard-stop', title, chat, firstLine, since }] }` or a better shape, with where each field comes from in `lane-board.mjs` and its cost per call (it is polled every 30 s by the app). Specify `GET /l/<Prompt-ID>`: validation of the id (`P-YYYY-MM-DD-HHmm` only, anything else 404), what the page does with the app present and absent, and how the web board opens on that lane (today there is no per-lane URL in the page: say what anchoring exists). Name the tests in `frontend/scripts/hooks/__tests__/` that Phase 2 adds, and confirm the `req.url ===` routes keep working.
3. **Q3, the first line of a question.** Where the text of the question a lane asked can be read (last `result` of `log.jsonl`, the final message before `Outcome: question`), how long it is in practice (median and p90 over the last 30 question exits) and a rule to cut a first line that reads well in 60 characters.
4. **Q4, the app stack.** Measure what is installed: `rustc --version`, `cargo --version`, whether `cargo tauri` / `create-tauri-app` is present, Xcode or only the Command Line Tools (`xcode-select -p`, `swift --version`). **Do not install anything**; a missing tool is a finding. Then compare Tauri 2, Swift `MenuBarExtra` and Electron on: tray item with a text title next to a template icon; global shortcut registration and failure when taken; custom URL scheme on macOS (registered only by a bundled `.app` in `/Applications` or `~/Applications`, not in dev mode: say how Phase 2 tests it); login item (`SMAppService` vs a second LaunchAgent); notifications for an unsigned or ad-hoc-signed local app (bundle id, permission prompt, Gatekeeper on first launch); bundle size; who maintains the build. Every new crate, npm or Swift package is a new dependency (NON-NEGOTIABLE rule 4): list them by name and version for the stack you recommend, with the official plugin where one exists. Tauri 2 is the approved stack: the comparison stays short (one paragraph on the alternatives), and the answer that matters is whether anything measured here makes Tauri 2 unworkable on this Mac, in which case stop with `Outcome: question` and `Recommended:`.
5. **Q5, the shortcut.** The chat proposed ⌥⌘L. In Chromium browsers on macOS ⌥⌘L opens Downloads, and Alfonso's default browser is Microsoft Edge: a global shortcut would take it away everywhere. Check that clash and the other candidates against the system shortcuts and the apps Alfonso uses daily (Edge, Claude desktop, VS Code, IntelliJ, Mail), and propose one with the reason.
6. **Q6, where the app lives.** It has to be in the repo (versioned, reproducible), in English (README, comments, messages). `frontend/scripts/` is checked by `check:scripts` and `typecheck:scripts`, which would read a Rust or Swift tree as noise. Propose a path (for example a new top-level `tools/lane-monitor-app/`) and what it needs in `.gitignore`, and say whether the `harness` front and the log inbox cover it.
7. **Q7, Phase 2 plan.** Slices, each mergeable alone and each with its check: S1 the board side (`/api/attention`, `/l/<id>`, tests, README); S2 the app shell with tray, popover and polling; S3 notifications on transitions; S4 deep link and global shortcut; S5 login item and the «Restart board» action. Files per slice (rule 19 applies to the whole Phase 2), how each is verified on this Mac without touching the shared board on 4700 (a second board on 4712 with `LANE_BOARD_CACHE` under `/tmp/menubar/`), and what Alfonso has to click once (notification permission, login item approval, first-launch Gatekeeper).

## DOVE
`docs/discovery/discovery_2026-10-18_lane_monitor_menubar_app.md` (new), `docs/log-inbox/harness.md`, this prompt's Status line. Throwaway probes only under `/tmp/menubar/`, never committed. Nothing else: no change to `lane-board.mjs`, its README or tests, `lane-run.mjs`, hooks, `CLAUDE.md`, `PROTOCOL.md`, `decisions.md`, the plist or the running agent.

## Gates
`check:docs` after each docs commit.

## Commits (P13, RC-17), explicit pathspecs, no push
Commit 1: the full report, ending with «Decisions taken (unattended)» (the pending rule, the endpoint shape, the shortcut, the path) and «Decisions awaiting Alfonso» (anything on the RC-26 list; the crate list is recorded, its approval is in the header), the P9 entry in `docs/log-inbox/harness.md`, the Status flip. Trailer `Model:` (P6).

## NON FARE
No install of toolchains, CLIs, crates or packages. No scaffold of the app in the repo. No edit to the board, its plist, or the running agent; no restart of the board on 4700. No reading of whole logs or whole `lane-board.mjs` into context.

## HARD STOP
At the end of Phase 1, always: `Outcome: hard-stop`. Earlier with `Outcome: question` only if Q1 shows that the board cannot tell a pending decision from a closed one with what it reads today (then: what it would need to read, with `Recommended:`).

## RIFERIMENTI
`frontend/scripts/lane-board/README.md` («launchd agent», the Lanes and Insights sections); `frontend/scripts/lane-board/lane-board.mjs:1528-1543` (`STRIP`, `stripKey`), `:1813-1864` (routes); `docs/decisions.md` RC-16, RC-20, RC-21, RC-23, RC-25, RC-26, RC-51; `docs/prompts/claude_2026-10-18_1750_prompt_lane_board_cost.md` (board on a second port with a private cache).
