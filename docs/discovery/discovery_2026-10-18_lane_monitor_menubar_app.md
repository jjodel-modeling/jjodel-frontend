# Discovery 2026-10-18 — lane monitor as a menu bar app (Phase 1)

- Prompt-ID: P-2026-10-18-2255
- Prompt: `docs/prompts/claude_2026-10-18_2255_prompt_lane_monitor_menubar_app.md`
- Session: `7ceebc40-f95d-4a28-afed-7b6926b06716` (`claude -p`, unattended)
- Tree: `~/jjodel-w-menubar`, branch `menubar-disc`, HEAD `1c2f8efa4` (equal to the tip of `alfonso-frontend-jjtl` at 23:03)
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), effort high
- Measured on 2026-10-18 between 23:03 and 23:20, against the board on 4700 (`/api` fetched once by GET into `/tmp/menubar/api.json`, 546 rows, `stale: false`) and the lane folders under `~/.jjodel-lanes` (710 entries). The board on 4700 runs from `~/jjodel-release` (plist below), not from this tree; its `stripKey` was imported from this tree, which is the same code at `1c2f8efa4`.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the real files. Probes lived under `/tmp/menubar/` and are not committed.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The strip's 10 question / 174 hard-stop / 1 blocked are decisions owed now | **Falsified.** Measured: 0 of 10 questions, 0 of 1 blocked, 1 of 175 hard-stops are open and younger than 72 h (§Q1). |
| H2 | The board can tell a pending decision from a closed one with what it reads today | **Holds, partly.** Every signal the rule needs is already within the board's reach (`trunkPrompt` reads trunk prompts via git, `laneTimeline` parses `Depends:`, `lanesSince` reads git log), but no code combines them; `Corregge:` is not parsed today. No `Outcome: question` hard stop is needed. |
| H3 | Nothing on this Mac makes Tauri 2 unworkable | **Holds.** Rust 1.94.1 aarch64, full Xcode 26.6, cargo cache already holding `tauri 2.10.3` and five of the plugins. Missing: `tauri-cli` (a finding, not a blocker) and any code-signing identity (ad-hoc only). |
| H4 | ⌥⌘L is a safe global shortcut | **Falsified.** It is Edge's Downloads and IntelliJ's Reformat Code (measured in IntelliJ's keymap, §Q5). |
| H5 | The app can sit under `frontend/scripts/` | **Falsified** by the gates' scope; a top-level `tools/` is proposed (§Q6). |

## Files read

- `frontend/scripts/lane-board/lane-board.mjs` windows: 1-280 (constants, `header`, `kindOf`, `kindFacts`, `phaseOf`, `estimate`), 501-679 (`snapshot`, `runStatus`, `collect`, `apiStatus`, timeline cache), 800-970 (`results`, `logFacts`, `inputClass`, `decisionText`, `laneTimeline`), 1007, 1108-1137 (`REPO`, `TRUNK`, `trunkPrompt`), 1528-1547 (`STRIP`, `stripKey`), 1640-1680, 1720-1760, 1799-1864 (page script, routes). Never read whole.
- `frontend/scripts/lane-board/insights.js:55-70`, `:124-138` (wait histogram).
- `frontend/scripts/lane-board/README.md` by grep only (`:248`, `:336`, `:343-368`).
- `frontend/scripts/lane-run.mjs` by grep only (`:399`).
- `frontend/scripts/hooks/__tests__/laneBoardStrip.test.ts` by grep (`:23`, `:38`, `:76-78`, `:121`).
- `~/Library/LaunchAgents/io.jjodel.lane-board.plist` (`plutil -p`).
- `docs/prompts/*.md` Status lines (all 1019 files, scanned by probe), `docs/log-inbox/*.md` and `docs/claude-code-log.md` (scanned for Prompt-IDs), `docs/harness/fronts.json`.
- `/Applications/IntelliJ IDEA.app/Contents/lib/app-client.jar` → `keymaps/$default.xml`, `keymaps/Mac OS X.xml`, `keymaps/Mac OS X 10.5+.xml`; `~/Library/Preferences/com.apple.symbolichotkeys.plist`.

## Q1 — what «pending» means

### What the strip counts (read)

`lane-board.mjs:1536-1543`:

```js
export function stripKey(r) {
    if (r.chain) return r.state === 'running' ? 'running' : r.state === 'done' && r.recent ? 'done' : null;
    if (r.state === 'running') return 'running';
    if (r.state === 'blocked') return 'blocked';
    const o = String(r.outcome || '').split(' ')[0];
    if (o === 'done') return r.recent ? 'done' : null;
    return o === 'question' || o === 'hard-stop' || o === 'blocked' || o === 'resolved' ? o : null;
}
```

Only `done` is windowed (`r.recent`, 24 h, `:539`); the other three are all-time. `resolved` is an overlay on `blocked` when `resolved.txt` exists (`:550`).

### Measured counts at 23:04

`stripKey` over the 546 `/api` rows: running 2, question 10, hard-stop 175 (174 at 22:24 plus one lane exited since), blocked 1, resolved 18, done 34. The 175 hard-stops by kind: phase2 94, discovery 36, fast 28, merge 15, unknown 2.

### Evidence per row (measured, probe `q1.mjs` + `q1b.mjs`)

For each of the 186 rows four closure signals were checked, in this order:

- **(a) trunk Status flipped**: the `Status:` line of the lane's prompt file in `docs/prompts/` at `1c2f8efa4` (= trunk) exists and does not start with `da eseguire`. Values found: `eseguito` 161, `da eseguire` 13, no prompt file with that Prompt-ID 9, `abbandonato` 1, `chiuso` 1, `superseded` 1.
- **(b) a later lane declares it**: a lane with a higher Prompt-ID names it in the `Depends:` or `Corregge:` line of its header (lane `input-1.md` or prompt file).
- **(c) a trunk commit mentions it after its end**: subject or body of a commit on `alfonso-frontend-jjtl` since 2026-09-25 names the id, `docs: add prompt …` commits excluded, commit time later than the lane's last turn end.
- **age**: from the end of the last turn (`row.end`, the same end as the Insights wait histogram, `insights.js:65`: `const w = Math.max(0, t.s - l.turns[i - 1].e)`).

| Strip key | Rows | closed by (a) | by (b) | by (c) | open, ≤ 72 h | open, > 72 h |
|---|---|---|---|---|---|---|
| question | 10 | 8 | 0 | 0 | 0 | 2 |
| blocked | 1 | 1 | 0 | 0 | 0 | 0 |
| hard-stop | 175 | 155 | 3 | 6 | **1** | 10 |

The ten questions in detail (all exited; `inputs` = count of `input-k.md`):

| Lane | Kind | Trunk Status | Verdict |
|---|---|---|---|
| P-2026-10-18-0105 | fast | `abbandonato 2026-10-18 · no code: the cost figures were sums` | closed (a) |
| P-2026-10-15-1725 | phase2 | `eseguito 2026-10-16 · lane harness · 0dd7ed3b5 · hard-stop, …`; also `Depends:` of P-2026-10-17-1945 | closed (a), (b) |
| P-2026-10-05-2350 | phase2 | `eseguito 2026-10-06 · lane sim-timeline · 6a771cfee …` | closed (a) |
| P-2026-10-05-1705 | phase2 | no prompt file in trunk (its file was `~/jjodel-w-boardprog/docs/prompts/claude_2026-10-05_1705_prompt_harness_board_progress.md`) | open, 317 h: stale |
| P-2026-10-03-0250 | merge | `superseded 2026-10-03 · stopped on a question …` | closed (a) |
| P-2026-09-29-0239 | discovery | `eseguito 2026-09-29 …` | closed (a) |
| P-2026-09-29-0011 | discovery | no prompt file in trunk (`~/jjodel-w-datalevel/docs/prompts/claude_2026-09-29_0011_prompt_discovery_sim_data_level.md`) | open, 479 h: stale |
| P-2026-09-27-0150 | discovery | `eseguito 2026-09-27 · lane sim-profiles · 1dddb15ae` | closed (a) |
| P-2026-09-26-2350 | fast | `eseguito 2026-09-26 · lane harness · c5a669c2e` | closed (a) |
| P-2026-09-26-2340 | phase2 | `eseguito 2026-09-27 · lane simulation · 3ec3405d5, f507d166d` | closed (a) |

The blocked row P-2026-10-11-1156 (phase2): `eseguito 2026-10-11 · lane gv-drag-frame · 2d2f75846, 18569b…`: closed (a), with no `resolved.txt`, which is why the strip still counts it.

The 20 hard-stops that (a) leaves open: closed by (b) P-2026-10-18-2150 (Depends of 2300), P-2026-10-18-2130 (of 2215), P-2026-10-15-1710 (of 2026-10-16-1000); closed by (c) P-2026-10-11-2235, -1826, -1750, -1728, P-2026-10-10-1237, -0830 (merge commits of later lanes name them); open and > 72 h: P-2026-10-12-0136, -0135, -0120, P-2026-10-11-1830, -1001, P-2026-10-10-1020, -0915, P-2026-10-03-1846, -1607, P-2026-10-02-2345 (165 h to 383 h; five have commits on side branches and none on trunk besides the prompt, so they are unmerged or abandoned work, not decisions owed tonight); open and ≤ 72 h: **P-2026-10-18-2220** (discovery, exited 0.5 h before the probe, Status `da eseguire` in trunk because its branch is not merged).

### The rule (decision taken)

A row is **attention-relevant** when `stripKey(r)` is `question`, `blocked` or `hard-stop` (so a live lane over its limit, `state === 'blocked'`, counts as blocked, and `resolved` never counts). It is **closed** when any of (a), (b), (c) holds. An open one is **waiting** when `now - since ≤ 72 h`, else **stale**. `since` is the end of the last turn (`laneSpan(id, now).end`, `:974`, which the row already carries as `end`); for a live blocked lane it is the time the limit was crossed, approximated by `start + 90 min` or the prompt's declared limit.

Today it keeps **0 of 10** questions, **0 of 1** blocked, **1 of 175** hard-stops as waiting, and 12 as stale. The badge shows `waiting` only; stale is one collapsed line in the popover («12 stale, oldest 20 d»), never in the badge.

Why it keeps the one hard-stop: P-2026-10-18-2220 is a Phase 1 that just stopped; under RC-26 the chat, not Alfonso, writes its Phase 2. The board cannot tell «owed by the chat» from «owed by Alfonso» (both are «the operator»), and the item's `kind: 'hard-stop'` plus the lane kind `discovery` let the popover label it «Phase 1 done, Phase 2 to write». A rule that dropped all hard-stops would hide a visual GO owed by Alfonso on a critical-zone lane (RC-23), so they stay, filtered.

Why 72 h: the median wait for a decision on the Insights tab is in minutes to hours; every open hard-stop older than 72 h measured here is 165 h or more, so the threshold sits in an empty gap (nothing between 0.5 h and 165 h today). It is a constant in the board, `ATTENTION_STALE_H = 72`.

Not used, and why: «`input-k.md` after the last `result`» identifies a resumed lane, which `lane-run status` already reports as `running`, so it never reaches the candidate set; the log inbox mention (probe column `inLog`) is not a closure, as entries are written at Phase 1 closure too.

## Q2 — the board side

### `GET /api/attention` (specified, not written)

```json
{
  "v": 1,
  "now": 1792300000000,
  "stale": false,
  "board": "ok | refreshing | error: <one line>",
  "waiting": 1,
  "blocked": 0,
  "running": 2,
  "staleCount": 12,
  "staleOldest": 1790960000000,
  "items": [
    { "id": "P-2026-10-18-2220", "kind": "hard-stop", "laneKind": "discovery",
      "title": "Harness health signals: catalogue and retrospective backtest",
      "chat": "C-2026-10-18-2225", "chatUrl": "https://claude.ai/…",
      "firstLine": "…", "since": 1792298000000 }
  ],
  "runningItems": [
    { "id": "P-2026-10-18-2300", "laneKind": "phase2", "title": "…", "phase": "…", "left": "about 20 min", "since": 1792299000000 }
  ]
}
```

`waiting` = `items.length`; `blocked` = items with `kind: 'blocked'` (so the red dot is `blocked > 0`); `items` sorted by `since` ascending (oldest first, as the design asks). Field sources:

| Field | Source in `lane-board.mjs` |
|---|---|
| `now`, `stale`, rows | the `/api` snapshot through `apiStatus()` (`:656-660`): no second `lane-run status` run, the same `CACHE_MS = 10_000` (`:41`) |
| `kind` | `stripKey(r)` (`:1536`) |
| `laneKind`, `title`, `chat`, `chatUrl` | row fields `kind`, `title`, `chat`, `chatUrl` (`:540-546`, `:564`, `:602-605`) |
| `phase`, `left` (running) | row fields from `phaseOf` and `estimate` (`:552`, `:560`) |
| `since` | row `end` (`laneSpan`, `:568`); running: row `start` |
| closure (a) | `trunkPrompt(id, file)` (`:1129-1137`), which already resolves the trunk prompt by name or Prompt-ID stamp and reads it with `git show TRUNK:<path>`; take its `^Status:` line |
| closure (b) | the `Depends:` parse of `laneTimeline` (`:963-964`); `Corregge:` is not parsed today and is added beside it; the inverse map (id → later lanes naming it) is built once per snapshot from `header()` memo (`:70-85`, extended with the two lines) |
| closure (c) | one `git log TRUNK --since=<oldest open candidate end> --format=%x1e%ct%x1f%s%x1f%b`, memoised 60 s, the same style as `lanesSince`'s `gitAsync` call (`:1174`) |
| `firstLine` | §Q3, from the lane's `log.jsonl` tail via `tail()` (`:51-65`) |

Cost per call (polled every 30 s): the snapshot is shared with `/api` (measured `/api` from cache: 10-14 ms, 863 KB; `/api/attention` would be under 2 KB, which is the reason the app must not poll `/api`). A closed verdict is memoised for the process lifetime (a closed lane does not reopen; a veto opens a new lane), so steady state re-checks only the open candidates (13 today): one `git cat-file --batch` for their trunk prompts (measured 107 ms for 200 prompt files, so a few ms for 13), one `git log` per 60 s (measured about 0.5 s for 30 days and 2625 commits; a 72 h window is far smaller, and `--since` uses the oldest open candidate, so the 10 stale ones are excluded from (c) after their first verdict: stale is memoised per snapshot day). `firstLine` is read once per lane and memoised by `log.jsonl` size.

Placement: before the `req.url === '/api'` branch (`:1854`), matched on `url.pathname === '/api/attention'` (`:1811`), never `req.url`. The early branch at `:1810` matches `^\/(api\/timeline|export\/)` and does not catch `/api/attention`; `/api/attention` awaits `apiStatus()` like `/api` does. The existing `req.url ===` routes (`/timeline.js` `:1826`, `/api/requirements` `:1834`, `/api/timeline` `:1841`, `/api/insights` `:1847`, `/api` `:1854`) are untouched and keep working: an exact-match route added on `pathname` changes none of them.

Board-side choice: no CORS header. The app polls from Rust (§Q4), not from a webview `fetch`, so the board stays same-origin only.

### `GET /l/<Prompt-ID>` (specified)

- Match `url.pathname` against `^/l/(P-\d{4}-\d{2}-\d{2}-\d{4})$`. Anything else under `/l/` → `404`, `text/plain`. Paths outside `/l/` keep today's fallback (`:1861-1862` serves `PAGE` with 200 for any unknown path), so nothing else changes.
- A valid id that is not on the board still gets the page: a chat may post the link before `lane-run start`; the page says so.
- The page (static, a few lines, no external asset): sets `location.href = 'jjodel-lanes://<id>'`; listens for `blur`/`visibilitychange` (the OS handed off to the app); after 1500 ms without either, replaces itself with `/#lane=<id>`. With the app installed, Edge shows its «Open Lane Monitor?» prompt once, with «Always allow on localhost:4700», which Alfonso ticks once; without the app Edge does nothing and the timer lands on the board.
- Per-lane anchoring in the board today: **none.** Measured: `grep -E 'location\.(hash|search)|URLSearchParams|scrollIntoView'` over `lane-board.mjs`, `timeline.js`, `insights.js` returns nothing; positive control in the same grep: `tab0` hits `:1799` (`let tab0='table';try{tab0=localStorage.getItem('laneBoardTab')…`). The tab comes from `localStorage`, the filter from the strip (`setFilter`, `:1675`), and a row's `<tr>` carries no id (`:1758-1759`: `'<tr>'+id+…`); only the Kind button has `data-id` (`:1746`). S1 adds: `data-id` on each lane `<tr>`; on load and on `hashchange`, `#lane=<id>` selects the Lanes tab, clears the filter, scrolls the row into view and marks it (a CSS class, colour from the existing outcome palette), and clears the mark on the next click.

### Tests Phase 2 adds (in `frontend/scripts/hooks/__tests__/`)

New file `laneBoardAttention.test.ts`, the pattern of `laneBoardStrip.test.ts` (board spawned on a free port with `JJODEL_LANES` a fixture root, a fake `LANE_RUN`, `JJODEL_REPO` a fixture git repo, `LANE_BOARD_CACHE` in the fixture: `:76-78`, `:121`):

1. a question lane whose trunk prompt says `da eseguire` is waiting; the same with `eseguito …` is not (closure a);
2. a hard-stop lane named in a later lane's `Depends:`, and one named in `Corregge:`, is not waiting (closure b);
3. a hard-stop lane named by a trunk commit after its end is not; one named only by `docs: add prompt` is (closure c);
4. an open lane older than 72 h moves from `items` to `staleCount`;
5. `resolved` and `done` never appear; a live `state: blocked` row is `kind: 'blocked'`;
6. `items` are ordered oldest first; `waiting`/`blocked`/`running` equal the lists' lengths;
7. `/api/attention?x=1` answers the same JSON (pathname routing), and `/api`, `/api/timeline`, `/api/insights` still answer 200 JSON (regression on the `req.url ===` routes);
8. `/l/P-2026-10-18-2215` → 200 HTML containing `jjodel-lanes://P-2026-10-18-2215` and `/#lane=P-2026-10-18-2215`; `/l/P-2026-10-18-221`, `/l/x`, `/l/P-2026-10-18-2215/extra`, `/l/%3Cscript%3E` → 404;
9. a pure unit test of the exported rule function (`attentionOf(rows, facts, now)`) with no server, so the rule is executed on input, not grepped (CLAUDE.md §5).

## Q3 — the first line of a question

Where (read): the `result` event of the turn that ended with `Outcome: question`, field `result` (`lane-board.mjs:821-825`: `const m = [...String(e.result || '').matchAll(/Outcome:\s*`?([a-z][a-z-]*)/gi)]`). That is the session's final message. It is reached through `tail(log.jsonl)` (`:51`), the last `"type":"result"` line.

Measured (probe `q3.mjs`, all lane logs): 44 question exits in total; over the last 30, the result text is median 3494 characters, p90 4832, min 803, max 5451. 29 of 30 carry a `Recommended:` line (median 142 chars, p90 351); 20 of 30 open with the `[P-… · session …]` tag; 5 of 30 carry a `**Decision for you:**` line (median 184).

First sentences of the first paragraph after the tag: median 59, p90 105 characters. Several end on a colon and say nothing alone («The lane stops here:», «I stopped before editing anything:»).

Rule (decision taken):

1. Drop the leading `[P-… · session …]` tag.
2. If a line starts with `**Decision for you:**` or `**Question for you:**` (any of `Decision|Question`, `you|Alfonso`), take its text.
3. Else take the first line of the first paragraph that is not `Outcome:`/`Recommended:`; strip `**`, backticks and markdown links; take its first sentence (up to `.`, `?`, `!` or `:` followed by space or end). If that sentence ends with `:`, take the clause after the colon on the same line instead (it carries the reason).
4. Cut to 60 characters at the last space after character 30, trim trailing punctuation, append `…`.
5. The last `Recommended:` line, cut the same way, is a second field `recommended` in the item (the popover shows it on hover, the notification shows it as body).

A blocked lane has no question text: `firstLine` is `over its limit since <hh:mm>` for a live `state: blocked`, else the first line of its final message by the same rule. A hard-stop uses the same rule on its final message.

Applied to the last 12 (probe output, before step 3's colon clause): «approve the plan, the Phase 2 file list (report §5.5) and…», «ratify the AM-8 thresholds and the AM-8/AM-9 texts.», «The slice works, but I can't commit it yet.», «I stopped at step 2 without merging.».

## Q4 — the app stack

### Measured on this Mac (2026-10-18 23:12)

| Tool | Result |
|---|---|
| `rustc --version` | `rustc 1.94.1 (e408947bf 2026-03-25)` (via `~/.cargo/bin`) |
| `cargo --version` | `cargo 1.94.1 (29ea6fb6a 2026-03-24)` |
| rustup targets | `aarch64-apple-darwin` only |
| `cargo tauri --version` | `error: no such command: \`tauri\`` (control: `cargo --version` in the same shell answers) |
| `cargo install --list` | empty |
| `create-tauri-app`, `tauri` on PATH, global npm `tauri` | not found |
| `xcode-select -p` | `/Applications/Xcode.app/Contents/Developer` (full Xcode, not only the CLT) |
| `xcodebuild -version` | `Xcode 26.6`, build `17F113` |
| `swift --version` | `Apple Swift version 6.3.3`, target `arm64-apple-macosx26.0` |
| macOS | 26.2 (25C56), arm64 |
| node / npm | v23.3.0 / 11.6.1 |
| `security find-identity -p codesigning -v` | `0 valid identities found` |
| cargo registry cache | holds `tauri-2.10.3`, `tauri-build-2.5.6`, `tauri-runtime-wry-2.10.1`, `tao-0.34.8`, `muda-0.17.2`, `tauri-plugin-notification-2.3.3`, `tauri-plugin-deep-link-2.4.8`, `tauri-plugin-opener-2.5.3`, `tauri-plugin-store-2.4.2` and others (18 `tauri*` crates): a Tauri 2 project has already compiled on this Mac. Not cached: `tauri-plugin-global-shortcut`, `tauri-plugin-autostart`. |
| `~/.cargo`, `~/.rustup` | 257 MB, 1.2 GB |
| Default browser for https | `com.microsoft.edgemac` (LaunchServices) |

Nothing measured makes Tauri 2 unworkable. Two findings for Phase 2: `tauri-cli` must be installed (`cargo install tauri-cli --version "^2" --locked`, a tool install, done in S2 with its version in the README), and signing is ad-hoc (`"signingIdentity": "-"`), which is enough for a local app.

### Tauri 2 against the five needs (read: Tauri 2 docs and plugin sources as known at the model's cutoff; to be confirmed by the S2-S5 checks)

- **Tray with a text title beside a template icon.** `TrayIconBuilder::icon_as_template(true)` and `TrayIcon::set_title(Some("3"))` (macOS only), from the `tray-icon` feature of `tauri`. The popover is not a native `NSPopover`: it is a borderless, always-on-top, hidden-on-blur 400 px webview window placed under the icon from the `rect` of `TrayIconEvent::Click`. `ActivationPolicy::Accessory` keeps the app out of the Dock. No plugin needed (the positioner plugin is skipped: the rect is enough).
- **Global shortcut.** `tauri-plugin-global-shortcut` (official), built on `global-hotkey` (Carbon `RegisterEventHotKey`). `register` returns an error when another process holds the same hot key through the same API; a combination that another app binds only as a menu key equivalent (Edge's ⌥⌘L) is **not** reported: the global hot key silently wins everywhere. The app shows a registration failure in the popover footer and takes the shortcut from its config file.
- **Custom URL scheme.** `tauri-plugin-deep-link` (official) with `plugins.deep-link.desktop.schemes: ["jjodel-lanes"]`; on macOS the scheme goes into `CFBundleURLTypes` of the bundled `Info.plist` and is registered by LaunchServices when the `.app` is opened from `/Applications` or `~/Applications`; runtime registration (dev mode) does not exist on macOS. On macOS the URL reaches the running instance as an Apple event, so `tauri-plugin-single-instance` is not needed. Phase 2 test: `cargo tauri build --bundles app`, copy to `~/Applications/Lane Monitor.app`, open it once, then `lsregister -dump | grep -c jjodel-lanes` (path `/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister`) ≥ 1, then `open 'jjodel-lanes://P-…'` and read the app's log line.
- **Login item.** `tauri-plugin-autostart` (official) with `MacosLauncher::LaunchAgent`: it writes `~/Library/LaunchAgents/<bundle id>.plist`, a second agent distinct from `io.jjodel.lane-board`; macOS 13+ shows «Background item added» and lists it under Login Items. `SMAppService.mainApp` would be the modern API but needs `objc2` bindings (more crates) and a signed app to behave well; the LaunchAgent route is the one the official plugin ships. The board's own agent stays as it is.
- **Notifications.** `tauri-plugin-notification` (official). On desktop macOS it goes through `notify-rust` / `mac-notification-sys`; inside a bundle with an identifier the notification is attributed to the app (in `tauri dev` to the terminal). The permission prompt appears on first use. Whether an ad-hoc-signed bundle gets a stable permission entry across rebuilds is **not measured**: S3 checks it (rebuild, reopen, notification still delivered without a new prompt). Gatekeeper: an app built locally carries no `com.apple.quarantine` attribute, so no first-launch Gatekeeper dialog is expected; S2 checks `xattr -p com.apple.quarantine` is absent on the bundle.
- **Bundle size.** Tauri uses the system WKWebView: a few MB (read). Measured in S2 with `du -sh`.
- **Who maintains the build.** Rust + `tauri-cli`; a cold `cargo build` downloads and compiles a few hundred crates (minutes), a warm one seconds. The README carries the three commands.

Alternatives, one paragraph: a Swift `MenuBarExtra` app would need no new dependency at all (SwiftUI, `UserNotifications`, `SMAppService`, Carbon hot keys, `CFBundleURLTypes` all in the SDK, Xcode 26.6 present) and would be about 1-2 MB, with a real popover; it costs a second language and an Xcode project in the repo. Electron (~150 MB) only pays off when embedding Node, which the prompt excludes. Tauri 2 stays the approved stack: it is workable here, and its cost against Swift is the crate list below.

### New dependencies for the recommended stack (rule 4; approval is in the prompt header)

All in `tools/lane-monitor-app/src-tauri/Cargo.toml`, versions to be pinned by `Cargo.lock` at S2; the version in brackets is the one already in the local cargo cache, used when compatible:

| Crate | Role | Slice |
|---|---|---|
| `tauri` 2.x (2.10.3), feature `tray-icon` | runtime, tray, windows | S2 |
| `tauri-build` 2.x (2.5.6), build-dependency | build script | S2 |
| `serde` 1, `serde_json` 1 | parse `/api/attention`; already in tauri's tree, declared directly | S2 |
| `tauri-plugin-notification` 2.x (2.3.3) | transition notifications | S3 |
| `tauri-plugin-deep-link` 2.x (2.4.8) | `jjodel-lanes://` | S4 |
| `tauri-plugin-global-shortcut` 2.x (not cached) | shortcut | S4 |
| `tauri-plugin-autostart` 2.x (not cached) | login item | S5 |
| `tauri-cli` 2.x | build tool, installed with `cargo install`, not a crate of the app | S2 |

Not added: no HTTP client crate (the poll is a plain HTTP/1.0 GET to `127.0.0.1` over `std::net::TcpStream`, about 30 lines, testable with `cargo test`), no npm package (the popover is static HTML/CSS/JS served from `ui/`, `frontendDist: "../ui"`), no `opener`, `positioner`, `single-instance` or `store` plugin.

## Q5 — the shortcut

Measured:

- System (`com.apple.symbolichotkeys.plist`, enabled entries on the keys L, J, K, M, N, P, O, U, I, H, Space): only `⌘Space` (id 64) and `⌥⌘Space` (id 65). No user key equivalents (`NSUserKeyEquivalents`) for Edge, Claude, VS Code, IntelliJ, Mail or global (`defaults read`, all empty); no `~/Library/Application Support/Code/User/keybindings.json`.
- IntelliJ IDEA (`app-client.jar`, `keymaps/$default.xml`; the macOS keymaps derive from `$default` with control mapped to ⌘): `ReformatCode` is `control alt L` → **⌥⌘L**; `control shift alt L` → **⇧⌥⌘L** (Show Reformat File Dialog); bindings on L, J, K across the three files: `control L`, `control shift L`, `control alt L`, `control shift alt L`, `meta L`, `control J`, `alt J`, `control alt J`, `control shift J`, `alt shift J`, `control alt shift J`, `control K`. None maps to ⌃⌥⌘L.
- Edge: ⌥⌘L is Downloads in Chromium on macOS (read, not measured in the binary).

Decision taken: **⌃⌥⌘L** (Control-Option-Command-L). L for lanes; the three-modifier chord is the convention for global utilities; it is free in the system table and in IntelliJ's keymaps as measured; not a Chromium, VS Code, Mail or Claude desktop default to the model's knowledge (not measured in those binaries). ⌥⌘L is rejected (Edge Downloads, IntelliJ Reformat), ⇧⌥⌘L too (IntelliJ). Fallback ⌃⌥⌘J, in the app config, if S4's check finds a clash. S4 checks it in each of the five apps by pressing it with the app frontmost and the monitor running and not running.

## Q6 — where the app lives

Decision taken: **`tools/lane-monitor-app/`** at the repo root (today the root holds `cloudflare-worker/`, `docs/`, `frontend/`, `scripts/`). Layout: `README.md`, `ui/` (popover HTML/CSS/JS), `src-tauri/` (`Cargo.toml`, `Cargo.lock`, `build.rs`, `tauri.conf.json`, `capabilities/default.json`, `src/*.rs`, `icons/`). English throughout. `Cargo.lock` is committed (an application, reproducible build).

Why not `frontend/scripts/`: `typecheck:scripts` is `tsc --noEmit -p scripts/tsconfig.json` and `check:scripts` runs `scripts/gates/check-scripts.ts` (`frontend/package.json:99`, `:106`), both rooted at `frontend/scripts`; a Rust tree with a 1+ GB `target/` there is noise for both and for the `lane-board` README.

`.gitignore` (root, 95 lines, no `target` entry today: `grep -c -E 'target|tools|\.app' .gitignore` prints 0, exit 1; positive control through the same `grep -c`: `node_modules` prints 9): add `/tools/lane-monitor-app/src-tauri/target/` and `/tools/lane-monitor-app/src-tauri/gen/`.

Coverage: the `harness` front (`docs/harness/fronts.json`: `"title":"Lane harness: lane-run, gates, board, GitHub tracking","exit":"none: a permanent front"`) covers it; the log inbox is `docs/log-inbox/harness.md`. No new front, no new inbox.

## Q7 — Phase 2 plan

Rule 19 applies to Phase 2 as a whole (more than 5 files): the Phase 2 prompt lists every file per slice. One slice per session (RC-52). Every slice is verified without touching 4700: a second board started from the lane's worktree, `node frontend/scripts/lane-board/lane-board.mjs --port 4712` with `LANE_BOARD_CACHE=/tmp/menubar/board/timeline-cache.json` (the usage cache lands beside it), and, where the state must be controlled, `JJODEL_LANES=/tmp/menubar/lanes` with `LANE_RUN=/tmp/menubar/fake-lane-run.mjs` printing a status table (the test pattern of `laneBoardStrip.test.ts:121`; `lane-run` itself always reads `~/.jjodel-lanes`, `lane-run.mjs:399`: `const lanesRoot = () => join(homedir(), '.jjodel-lanes');`). The app reads its board URL from `LANE_MONITOR_BOARD` (default `http://127.0.0.1:4700`), set to 4712 in every check.

Note: the board on 4700 runs `/Users/alfonso/jjodel-release/frontend/scripts/lane-board/lane-board.mjs` (plist `ProgramArguments`), so S1 reaches 4700 only after its merge and the release tree update plus `launchctl kickstart`, which is the chat's step, not a lane's. Until then the app reads 404 on `/api/attention` and shows «board too old: update the release tree».

| Slice | Files | Check |
|---|---|---|
| **S1** board side | `frontend/scripts/lane-board/lane-board.mjs` (`attentionOf`, `firstLineOf`, `/api/attention`, `/l/<id>`, `#lane=` anchoring, `data-id` on `<tr>`, `Corregge:` in `header()`), `frontend/scripts/hooks/__tests__/laneBoardAttention.test.ts` (new), `frontend/scripts/lane-board/README.md` (routes, rule) | the 9 tests of §Q2; `laneBoard*.test.ts` green; `typecheck:scripts`, `check:scripts`; board on 4712 against the real lanes: `curl /api/attention` gives `waiting` equal to the probe's count at that time; `/l/<id>` in the built-in browser lands on the highlighted row (RC-23) |
| **S2** app shell | `.gitignore`, `tools/lane-monitor-app/README.md`, `src-tauri/{Cargo.toml, Cargo.lock, build.rs, tauri.conf.json, capabilities/default.json, src/main.rs, src/poll.rs, icons/*}`, `ui/{popover.html, popover.css, popover.js}` | `cargo test` (HTTP parse and title formatting on fixtures); `cargo tauri build --bundles app`; bundle size by `du -sh`; no quarantine attribute; run against 4712: title shows the count, popover lists items oldest first, «Open monitor» opens the board page in an app window; board stopped → title `–` and «board unreachable» |
| **S3** notifications | `src-tauri/src/notify.rs` (new), `src/main.rs`, `Cargo.toml`, `capabilities/default.json`, README | `cargo test` on the transition function (first poll seeds without notifying; an id entering `question` or `blocked` notifies once; staying, or re-entering after closing, rules stated in the test); live: fake `LANE_RUN` flips a fixture lane to question on 4712 → exactly one notification; rebuild and reopen → still delivered without a second prompt |
| **S4** deep link and shortcut | `src/main.rs`, `Cargo.toml`, `tauri.conf.json` (scheme, shortcut default), `capabilities/default.json`, README | bundle in `~/Applications`, `lsregister -dump` lists `jjodel-lanes`; `open jjodel-lanes://P-…` opens the main window on `/#lane=<id>` of 4712; `/l/<id>` in Edge hands off with the app running and falls back to the board with it quit; ⌃⌥⌘L opens the popover from each of Edge, Claude, VS Code, IntelliJ, Mail; registration failure shown when the chord is taken (test by registering it twice) |
| **S5** login item and restart | `src/main.rs`, `Cargo.toml`, `ui/popover.js`, README | toggle in the popover writes and removes `~/Library/LaunchAgents/<bundle id>.plist` (`plutil -p`), the board's plist untouched (`shasum` before and after); «Restart board» runs `launchctl kickstart -k gui/<uid>/io.jjodel.lane-board` only when the board URL is 4700, and in a 4712 run is shown disabled with the reason; the command string is unit-tested, never executed in a check |

What Alfonso clicks once, after S5 is installed: the notification permission prompt (S3), «Allow in the background» / the Login Items entry (S5), Edge's «Always allow localhost:4700 to open Lane Monitor» (S4). No Gatekeeper dialog is expected for a locally built app; if one appears, right-click → Open once.

## Dependencies and risks

- The rule reads the trunk (`TRUNK`, default `alfonso-frontend-jjtl`, `:1108`): a lane whose Status flip sits on an unmerged branch reads open until the merge or a later `Depends:` closes it. That is the intended meaning («the operator still owes the merge or Phase 2»).
- Closure (c) can close a lane on a mere mention in a commit body; the measured cases (6) were all merges of later lanes. A false close hides a lane from the badge, not from the board.
- Ad-hoc signing and notification permission persistence across rebuilds: not measured (S3).
- The release tree lag: S1 is invisible on 4700 until the chat updates `~/jjodel-release` (memory: never remove its `node_modules` symlink after gates).
- Rule 4: two plugins are not in the local cargo cache; their first build needs crates.io.

## Open questions

1. Does claude.ai render a `jjodel-lanes://` link as clickable? Left to the chat in the built-in browser (RC-23), as the prompt says; the design does not depend on it.
2. Should the 12 stale lanes be closed by hand (Status `abbandonato`) so the stale line reads 0? A governance edit outside this lane.

## Decisions taken (unattended)

1. Pending rule: candidate = `stripKey` in {question, blocked, hard-stop}; closed by trunk Status flipped, a later `Depends:`/`Corregge:`, or a later trunk commit naming it; waiting when open and ≤ 72 h since the end of the last turn, stale otherwise. Today: 1 waiting, 12 stale, 173 closed.
2. Endpoint shape: `GET /api/attention` as in §Q2 (`waiting`, `blocked`, `running`, `staleCount`, `items` oldest first, `runningItems`), pathname-routed, no CORS; `GET /l/<Prompt-ID>` strict id, 404 otherwise, hand-off with a 1.5 s fallback to `/#lane=<id>`.
3. First-line rule of §Q3, 60 characters, with `recommended` as a second field.
4. Shortcut ⌃⌥⌘L, fallback ⌃⌥⌘J, configurable.
5. Path `tools/lane-monitor-app/`, two `.gitignore` lines, `harness` front and inbox.
6. App polls from Rust over `std::net`, no HTTP crate, no npm; login item through `tauri-plugin-autostart` with a LaunchAgent; no positioner, opener, store or single-instance plugin.

## Decisions awaiting Alfonso

None from the RC-26 list. The crate list of §Q4 is recorded; its approval is in the prompt header (Tauri 2 with official plugins, 2026-10-18 23:00). The install of `tauri-cli` in S2 falls under that approval.
