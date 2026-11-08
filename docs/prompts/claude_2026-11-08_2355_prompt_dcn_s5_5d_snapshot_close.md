# DCN slice 5, lane 5d: exact vertex match, edge check, closure of the snapshot write

Prompt-ID: P-2026-11-08-2355
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full, critical (snapshot writer; launched with `--critical-zone-goahead P-2026-11-08-2355`)
Go-ahead: Alfonso 2026-11-08 18:21 «Go su tutto» on R-DCN-30
Corregge: 2026-11-08 23:50 (P-2026-11-08-2320 stopped at the context ceiling: writer and probe 23/23 committed, SN-24 not run, closure owed)
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt on top of 31db26323
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the uncommitted changes are exactly `frontend/scripts/probe/dcn-snapshot.ts` and the Status lines of the 2157 and 2216 prompts (plus the gitignored node_modules link); otherwise stop with Outcome: blocked. Do not discard them. No subagents, no background tasks. Every reply opens with [P-2026-11-08-2355 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: read only ~/.jjodel-lanes/P-2026-11-08-2320/handoff.md and the lines you change (about 30 each); never cat a test, build or probe log; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; before a probe run wait while the 1-minute load is above 20 (if it stays above 20 for 30 minutes, stop with Outcome: blocked after committing what is green). Commit after each green item.

## COSA

(1) **Exact match** (the chat's answer to 2320's question): `SnapshotCreate` in `sim/simSnapshot.ts` gains an optional `sourceId`, set by `planSnapshot` for every object copied from the source; `simSnapshotWrite.ts` matches source vertices by `sourceId` when present and falls back to owner, class and name only when absent. Tests: two siblings with the same class and name keep their own vertices. Commit.

(2) **Probe** with SN-24 (edges on open): the snapshot's object diagram shows the same edges as the source's object diagram (count and endpoints by name), measured on both; the source's object view may draw none, and then the snapshot must draw none too. Run once; commit the probe with the 2320 edits.

(3) **Gates**: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs; core-file diff against 0a519ffc3 empty.

(4) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill covering 2157, 2216, 2320 and this lane (Notes at most 480 characters by `wc -m`; Layer Impact Report: docs/discovery/lir_2026-11-08_dcn_snapshot_write.md with addendum; Smoke visivo: crop of P-2026-11-08-2320 read by the chat 23:53, dji's seven rows visible; tickets: the row template shows values[0] of a multi-valued slot, low). Status flips of the four prompts. Remove the node_modules link. `git add` only named files. No push, no merge. Final message: files and commits, gate table, SN-24 MEAS, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simSnapshot.ts, sim/simSnapshotWrite.ts, their tests; frontend/scripts/probe/dcn-snapshot.ts; docs/log-inbox/dcn.md; the four prompts. Core files read-only. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-2320/handoff.md; docs/discovery/lir_2026-11-08_dcn_snapshot_write.md; docs/decisions.md R-DCN-30.
