# Lane monitor menu bar app, slice S3: notifications on transitions

Prompt-ID: P-2026-10-19-0033
Chat: C-2026-10-18-2225
Front: harness
Status: eseguito 2026-10-19 · lane menubar-disc · fc08fe4ea · verifica visiva passata 2026-10-19 (chat, 00:48: macOS permission alert for Lane Monitor and tray at 2 with tooltip; one post per entering lane, seed silent, survives rebuilds; permission left pending)
Lane: phase2 (slice S3 of 5 of the plan in the P-2026-10-18-2255 report; one slice per session, RC-52)
Depends: P-2026-10-19-0000
Corregge: —
Request: Alfonso, 2026-10-18 23:00: «Tauri va bene», «procedi nella maniera più automatica possibile con /lane auto e non ti fermare, procedi con l'implementazione».
Approved: Tauri 2 with its official plugins, under NON-NEGOTIABLE rule 4 (Alfonso, 2026-10-18 23:00, header of P-2026-10-18-2255; `tauri-cli` explicitly 2026-10-18 23:23). The crates of this slice are its rows in the dependency table of the P-2026-10-18-2255 report §Q4; any other crate: stop and ask.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the discovery is the committed report). P8 is the check below, run by the chat.

Worktree: `~/jjodel-w-menubar`, branch `menubar-disc`, at the closure commit of the previous slice or later commits of this chat. Before anything else: `pwd`, branch, `git log -1`, `git status` clean; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-0033 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 75 minutes; cargo builds in the background with output to a log under `/tmp/menubar/`, read by tail. Context ceiling RC-51. Read `tools/lane-monitor-app/README.md` and the S2 entry in `docs/log-inbox/harness.md` first: they describe what exists.

## Context (do not redo the analysis)
Report §Q4 «Notifications» and §Q7 row S3. Design: a system notification only when a lane **enters** `question` or `blocked` (or a `hard-stop` that is waiting under the board's rule), never on every poll and never for the stale ones; title «Lane waiting for you» (or «Lane blocked»), body the lane id with the kind of decision and the `firstLine` from `/api/attention`; clicking it opens the board on `/#lane=<id>` in the app window.

## COSA
1. Tests first: `cargo test` on a pure transition function in `src-tauri/src/notify.rs` over two successive `/api/attention` snapshots: the first poll after launch seeds without notifying; an id entering `items` notifies once; staying does not; leaving and re-entering notifies again; a board error between two polls does not reset the seed; stale items never notify.
2. Wire it into the poll loop with `tauri-plugin-notification`; capability entries in `capabilities/default.json`.
3. Live check on a board from this worktree on 4712 with a controlled state: `JJODEL_LANES=/tmp/menubar/lanes` and `LANE_RUN=/tmp/menubar/fake-lane-run.mjs` printing a status table (pattern of `frontend/scripts/hooks/__tests__/laneBoardStrip.test.ts`), flip one fixture lane to `question` and count the notifications delivered (the app logs each one it posts; `log show --last 5m --predicate 'subsystem == "com.apple.usernotifications"'` or the app's own log). The macOS permission prompt may appear and nobody is there to answer it: record what the log says (delivered, or pending permission) and do not treat a pending permission as a failure. Rebuild and reopen once and record whether the permission state survives an ad-hoc-signed rebuild.
4. Stop with `Outcome: hard-stop` for the chat's check; after the GO, commits and `Outcome: done`.

## DOVE
`tools/lane-monitor-app/src-tauri/src/notify.rs` (new), `src-tauri/src/main.rs`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/capabilities/default.json`, `tools/lane-monitor-app/README.md`, `docs/log-inbox/harness.md`, this prompt's Status line. Fixtures for the live check only under `/tmp/menubar/`. Anything else: stop and ask.

## Commits (P13, RC-17), explicit pathspecs, no push
Code: `feat(lane-monitor-app): notify when a lane starts waiting (P-2026-10-19-0033)`. Docs: Status flip and the P9 entry. Trailer `Model:` (P6).

## NON FARE
No deep link, shortcut or login item. No change to the board or `frontend/`. No touch of 4700.
