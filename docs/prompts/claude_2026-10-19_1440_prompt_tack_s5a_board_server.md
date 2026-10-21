# Tack slice 5a: board server, page shell and Sessions view

Prompt-ID: P-2026-10-19-1440
Chat: C-2026-10-19-0001
Front: tack
Lane: full (first UI of Tack: local HTTP server and page; discovery done in P-2026-10-19-1100)
Status: eseguito 2026-10-19 · lane tack-s5a · db39b5880 · verifica visiva della chat dopo l’uscita (RC-23)
Depends: P-2026-10-19-1405
Corregge: none
Request: https://claude.ai/chat/1b373b77-3e1f-4c66-b75e-9eec8a5ba215 (Alfonso, 2026-10-19 14:35, in the project chat: «Procedi» (slice 5, split in two lanes))

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (the discovery is `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.3, §6.2, §6.3); no Phase 1 hard stop. P8 is replaced: the page is not part of Jjodel, so the visual check is done by the chat in the built-in browser after the lane exits (RC-23), on the port given below; the lane does not wait for it.

Worktree: `~/jjodel-w-tack-s5a`, branch `tack-s5a`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1440 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Read every file above 500 lines with `offset`/`limit` or `rg`, never whole; `frontend/scripts/lane-board/lane-board.mjs` is about 2,000 lines: read only the HTTP server, the page skeleton and the Lanes table. Context ceiling (RC-51): if you approach it, write the handoff early. Node: `~/.local/bin/node` for every Tack command and test.

## Context

Tack lives in `tack/`, self-contained, no dependency, Node >= 24. Slices 1-4 shipped contract v1 and `tack check`; the metadata-only store at `~/.tack/store.db` (schema 3) with the Claude Code and git collectors, repository identity and worktree inference; the layer-1 metrics module with `tack metrics`, each metric declaring its layer, layer-2/3 metrics as `not-adopted` or `adopted, not implemented`. Slice 5 is split: **5a** (this lane) is the server, the page shell and the Sessions view; **5b** adds Timeline and Insights.

The slice-5 criterion of report §6.3: `npx tack board` from a repository root opens the board **with no file written in the repository and no flag**; layer-2/3 panels render as «not adopted» rather than empty charts.

## COSA

1. **`tack board [--port <n>] [--no-open] [--store <path>]`** in `tack/src/board/server.mjs`, `node:http` only. Default port **4710** (Jjodel's board owns 4700). On start it runs an incremental `tack scan` (collectors of slices 2-3), then serves; a `POST /api/rescan` repeats it. Bind to `127.0.0.1` only. `--no-open` skips opening the browser; otherwise open with the platform command (`open` on macOS, `xdg-open` on Linux), never a dependency.
2. **Selection by repository**: started inside a git work tree, the board preselects that repository (identity of slice 3, so a linked worktree selects its main repository); started elsewhere it shows all repositories with a selector. The selection lives in the URL (`?repo=<key>`), not in a file.
3. **JSON API** under `/api/`: `repos`, `sessions?repo=&since=`, `metrics?repo=&since=` (the slice-4 module, with each metric's layer and state), `health` (store path, schema version, last scan time and counts). No endpoint returns message text, commit subjects, author names or file paths beyond the repository toplevel.
4. **Page shell** `tack/src/board/page.html` + `board.css` + `board.js`, served from memory, no build step, no CDN, no web font: header with the repository selector, the last scan time and a rescan button; tab bar with **Sessions**, **Timeline**, **Insights** (the last two render a placeholder «arrives in slice 5b»); light and dark through `prefers-color-scheme`. Copy and adapt the structure and visual language of Jjodel's current board (`frontend/scripts/lane-board/`, restyled on 2026-10-19 by P-2026-10-19-1130/1331), removing every Jjodel concept (lanes, fronts, chats, critical zone, RC markers, draws, requirements).
5. **Sessions view**: one row per session, newest first: day and start time, repository, branch only if layer 2 is absent (otherwise the unit id), link method, duration, main-thread calls, context peak (with a mark at ≥ 200k), cost (unknown shown as «?» never as 0), models, commit within the hour (yes / no / unknown). Filters: date range, repository, «only ≥ 200k», «only unknown cost». A summary strip above the table: sessions, cost (known and count of unknown), median and max context peak, share with a commit within the hour. Fixed column widths, no layout shift when data arrive (Jjodel UI rule, reused here).
6. **Tests**: API tests against a store built from the synthetic fixtures of slices 2-3 (`node:test`, server on an ephemeral port): every endpoint's shape, the repository preselection inside a fixture work tree, the `not-adopted` states, `POST /api/rescan` idempotent. **Privacy test extended**: the marker strings of the fixtures must not occur in any API response body. A test that `tack board --no-open` writes nothing inside the current work tree (compare `git status --porcelain` before and after).
7. **Run it on this Mac** with a store under `/tmp`: `tack board --no-open --port 4710 --store /tmp/tack-s5a/real.db` from `~/jjodel-release`, check the four endpoints with `curl`, and **leave it running** when you exit so that the chat can look at it (write its PID to `/tmp/tack-s5a/board.pid`). Put the endpoint sizes and the summary numbers for Jjodel in the entry.

## DOVE

`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else.

## Gates

`cd tack && ~/.local/bin/node --test` green, privacy tests included; `check:docs` after the commits (from `frontend/`).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): board server, page shell and Sessions view (P-2026-10-19-1440)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 5a (P-2026-10-19-1440)` with the entry and the Status line.

## NON FARE

No dependency, no bundler, no CDN, no external font or icon set. No change to `frontend/scripts/lane-board/` or anything outside `tack/` and the two docs. No Timeline or Insights implementation (5b). No layer-2/3 metric implementation (slice 6). Nothing written in a scanned repository. No message text, subject, author or path in API responses, the entry or the commit. No push.

## HARD STOP

None planned: close with `Outcome: done`. `Outcome: question` if `tack board` cannot avoid writing in the repository for some platform reason.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.3 (views of today's board), §6.2 (`lane-board.mjs`, `timeline.js`, `insights.js` dispositions), §6.3 (slice 5 criterion)
- `frontend/scripts/lane-board/` (structure and visual language to copy and adapt, not import)
- `tack/README.md`, `tack/src/metrics/`, `tack/src/store/` (slices 2-4)
