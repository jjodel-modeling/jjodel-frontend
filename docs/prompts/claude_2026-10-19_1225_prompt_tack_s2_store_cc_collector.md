# Tack slice 2: event store and Claude Code collector

Prompt-ID: P-2026-10-19-1225
Chat: C-2026-10-19-0001
Front: tack
Lane: full (new code that reads private transcripts: the metadata-only rule must hold; discovery done in P-2026-10-19-1100)
Status: eseguito 2026-10-19 · lane tack-s2 · code commit 2c0d567f3, docs commit carrying this line
Depends: P-2026-10-19-1200
Corregge: none
Request: https://claude.ai/chat/1b373b77-3e1f-4c66-b75e-9eec8a5ba215 (Alfonso, 2026-10-19 12:21, in the project chat: «OK» to `node:sqlite` with Node >= 24)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate phase (the discovery is `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.1, §4, §6, §7, §11); no Phase 1 hard stop. P8 does not apply (no UI).

Worktree: `~/jjodel-w-tack-s2`, branch `tack-s2`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1225 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Node

Decided by Alfonso on 2026-10-19: the store uses `node:sqlite` and Tack requires **Node >= 24** (no flag, no dependency). On this Mac the default `node` in PATH may be 23.3 (no `node:sqlite`) or 22 (flagged). Use `~/.local/bin/node` (v26.8.1, `node:sqlite` works unflagged, measured by the chat at 12:23) for every Tack command and test; write the path you used in the entry. Set `engines.node` to `">=24"` and make `bin/tack.mjs` exit 2 with a one-line message on Node < 24.

## Context

Tack lives in `tack/` of this repository, self-contained (P-2026-10-19-1200). Slice 1 shipped the skeleton, contract v1 and `tack check`; tests run with `node --test` from `tack/` (the form `node --test test/` fails on Node 23). Decisions not to reopen: no dependency; the store keeps **metadata only, never message text** (report §9.7, §11.4); a session's project key is the exact `cwd` recorded in the transcript, never the lossy directory name (report §4.2); cost is the max `cost-state.totalCostUSD` per session (§4.2); API calls are deduplicated by `message.id`, main thread only (§4.2, as `lane-usage.mjs` does).

## COSA

1. **Store** in `tack/src/store/`: `schema.sql` and `open.mjs`. One database per user at `~/.tack/store.db` (override with `--store <path>` or `TACK_STORE`), so that no file is ever written in a scanned repository. Tables at least: `sessions` (id, cwd, first_ts, last_ts, model(s), cli_version, cost_usd, cost_known), `calls` (session_id, message_id unique, ts, model, input, output, cache_read, cache_creation, context = input + cache_read + cache_creation), `ingest` (file path, size, mtime, byte offset reached). A `schema_version` pragma or table.
2. **Claude Code collector** in `tack/src/collectors/claude-code/`: reads `~/.claude/projects/*/*.jsonl` (override with `--root`), parses line by line, tolerates unknown record types and malformed lines (counted, reported, skipped), and stores only ids, timestamps, model ids, versions, token counts and cost. Ingestion is incremental: a file is read from its stored byte offset; a file whose size shrank or whose mtime moved backwards is re-read from 0 and its rows replaced. Sidechain (subagent) calls are stored but flagged and excluded from main-thread counts.
3. **CLI**: `tack scan` (ingest, print files read, records seen, records skipped by type, rows added) and `tack sessions [--cwd <prefix>] [--json]` (one row per session: cwd, day, calls, cost, context peak, span in minutes, models).
4. **Privacy test**, the gate that matters most: a synthetic transcript fixture containing a unique marker string in user text, assistant text, tool input and tool result; after `tack scan` on it, the marker must not occur anywhere in the bytes of the store file (and its `-wal`/`-shm` if present). Also assert that no table has a column fed from message content.
5. **Tests** with synthetic fixtures only under `tack/test/fixtures/claude-code/`: dedupe by `message.id`, sidechain exclusion, cost max per session, incremental scan (a second scan adds 0 rows; appending lines adds only those), truncated file re-read, malformed line skipped and counted, unknown record type ignored.
6. **Reproduction on this Mac** (the slice-2 acceptance criterion of report §6.3): run `tack scan` on the real `~/.claude/projects` with a store under `/tmp`, then `tack sessions --cwd` for tracer-scaffold, the eight `/private/tmp/sprotty-*` directories and harness-book, and compare with the table of report §4.2 (sessions, sessions per day, cost, context peak, main-thread API calls, span, models). Put the side-by-side table, numbers only, in the entry. Every difference gets a cause. **Retention warning:** the tracer-scaffold transcript dates from 2026-09-17 and may already have been deleted by Claude Code's ~30-day cleanup; a missing transcript is reported as missing, not as a failure, and the comparison is made on what remains. Run `tack scan` twice and show that the second adds 0 rows.

## DOVE

`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else. The real-data store lives under `/tmp` and is not committed.

## Gates

`cd tack && ~/.local/bin/node --test` green, privacy test included; `check:docs` after the commits (from `frontend/`, as the other lanes run it).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): event store and Claude Code collector (P-2026-10-19-1225)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 2 (P-2026-10-19-1225)` with the entry (the §4.2 comparison table in it) and the Status line.

## NON FARE

No dependency, no `npm install`, no `package-lock.json`. No file written outside `tack/`, the two docs, `/tmp` and `~/.tack/`. No message text, prompt text, tool input or tool output in the store, in fixtures copied from real transcripts, in the entry or in the commit: synthetic fixtures only, names and numbers only. No change to `~/.claude/settings.json` or to any Claude Code file. No git collector (slice 3), no metrics module beyond what `tack sessions` prints (slice 4), no board (slice 5). No push.

## HARD STOP

None planned: close with `Outcome: done`. `Outcome: question` if the transcript format makes the metadata-only rule impossible to keep for some field, or if `node:sqlite` is unusable on `~/.local/bin/node`.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §2.1, §4.2 (numbers to reproduce), §6.1, §6.3, §7 (risks 1, 2, 3, 6), §11
- `frontend/scripts/lane-usage.mjs` (`apiCalls` dedupe by `message.id`, context series): copy and adapt, do not import
- `tack/README.md`, `tack/contract/v1/README.md` (slice 1)
