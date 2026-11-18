# DCN slice 5, lane 5c: the snapshot keeps the source layout; probe and closure

Prompt-ID: P-2026-11-08-2320
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-08 · lane full · 50fe1ccbc
Lane: full, critical (DVertex creation for the snapshot's views; launched with `--critical-zone-goahead P-2026-11-08-2320`)
Go-ahead: Alfonso 2026-11-08 18:21 «Go su tutto» on R-DCN-30 (snapshot write lane with its Layer Impact Report); the layout copy is decided by the chat at 23:20, unattended, because the Step 2bis grid hides dji's rows (crop of P-2026-11-08-2216)
Corregge: 2026-11-08 23:15 (P-2026-11-08-2216 stopped at the ceiling: probe 20/20, uncommitted; the opened snapshot overlaps temp on dji)
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt on top of f26b6faa6
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the only uncommitted change is the untracked `frontend/scripts/probe/dcn-snapshot.ts` (plus the gitignored `frontend/node_modules` link); otherwise stop with Outcome: blocked. No subagents, no background tasks. Every reply opens with [P-2026-11-08-2320 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: read only ~/.jjodel-lanes/P-2026-11-08-2216/handoff.md and the exact lines you change or call (about 30 each); never cat a test, build or probe log; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. Commit after each green item.

## COSA

(0) Commit the probe as it stands: `test(dcn): snapshot probe, 20 checks (P-2026-11-08-2216)`.

(1) **LIR addendum** appended to `docs/discovery/lir_2026-11-08_dcn_snapshot_write.md` (a dated section, committed alone before code): the writer now creates DVertex records for the snapshot's objects in the views the source model has vertices in, copying position and size from the source vertex of the same object (mapped through the plan's keys); no change to the source, to `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`; creation through the existing `DVertex.new` path the sync uses, no TRANSACTION around it (Rule 12); objects without a source vertex keep the Step 2bis grid. If copying needs a change in a core or §3.1 file, stop with Outcome: question.

(2) **Writer** (`sim/simSnapshotWrite.ts`): implement (1) inside the same undo group; one undo still removes the model and its vertices. Unit test for the position mapping (pure part). Commit.

(3) **Probe** run 3 with the measure the handoff describes (which rows of dji are covered and by which node) plus: every snapshot instance's vertex has the source's position and size; no node overlaps dji; source byte-equal; one undo removes all (vertices included); reopened Reset gives Flying. Crop `1-snapshot-open` into `~/.jjodel-lanes/P-2026-11-08-2320/crops/`, dji's rows all visible. Commit the probe change.

(4) Gates: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs; core-file diff against 0a519ffc3 empty (`useJjomSync`, `portDistribution`, `canvasToJjom`, `LModelElement`, `reducer`, `ProjectEditor`).

(5) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill covering 2157, 2216 and this lane (Notes at most 480 characters by `wc -m`; Layer Impact Report: the LIR path with its addendum; Smoke visivo: crop read by the lane, chat to read it); Status flips of the three prompts. Remove the node_modules link. `git add` only named files. No push, no merge. Final message: files and commits, gate table, probe MEAS, crop description, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simSnapshotWrite.ts and its test; frontend/scripts/probe/dcn-snapshot.ts; docs/discovery/lir_2026-11-08_dcn_snapshot_write.md; docs/log-inbox/dcn.md; the three prompts. Core files read-only. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-2216/handoff.md; docs/discovery/lir_2026-11-08_dcn_snapshot_write.md; docs/decisions.md R-DCN-30; CLAUDE.md §3.2, Rule 12.
