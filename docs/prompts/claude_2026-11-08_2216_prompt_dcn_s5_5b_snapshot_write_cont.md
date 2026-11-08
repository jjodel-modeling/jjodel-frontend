# DCN slice 5, lane 5 continuation: snapshot writer, tests, probe, closure

Prompt-ID: P-2026-11-08-2216
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full, critical (continuation of P-2026-11-08-2157, stopped at the context ceiling after the LIR; launched with `--critical-zone-goahead P-2026-11-08-2216`)
Go-ahead: Alfonso 2026-11-08 18:21 «Go su tutto» on R-DCN-30
Corregge: 2026-11-08 22:12 (P-2026-11-08-2157 stopped at the ceiling with only the LIR committed)
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt on top of 795940ae1
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No subagents, no background tasks. Every reply opens with [P-2026-11-08-2216 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline is the point of this lane: read only ~/.jjodel-lanes/P-2026-11-08-2157/handoff.md (whole) and the draft it names; do not reread the LIR, the discovery or any core file except the exact lines you call (about 30 lines each); never cat a test, build or probe log; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. Commit after each green item.

## Contesto (non rifare l'analisi)

The LIR (795940ae1) and the handoff's decisions stand: `sim/simSnapshotWrite.ts` with `writeSnapshot(plan, metamodelId, host?)` and `saveRunSnapshot(modelId, step, host?)`; objects created as roots with `DObject.new`, then re-parented by the containment write; no DVertex created (Step 2bis lays the snapshot out on open); undo group closed after a 700 ms quiet store, deadline 60 s. No change to `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `LModelElement.tsx`, `reducer.ts`, `ProjectEditor.tsx`.

## COSA

(1) Put the writer draft into the repo, typecheck it, commit (`feat(dcn): write a run snapshot as a new model in one undo (P-2026-11-08-2157)`). If the rule-trigger hook refuses the Write, read its message and follow the rule it names.

(2) Tests for the pure parts and the undo bracketing with a fake host; commit.

(3) Probe `frontend/scripts/probe/dcn-snapshot.ts` as in item (3) of the 2157 prompt: new model `drone (snapshot step 24)`; same instances and links by name and classifier; dji σ values; source model byte-equal; `runSignature` unchanged; one undo removes the new model and nothing else; the reopened snapshot classifies `dji` as Flying at Reset. MEAS lines; crop `1-snapshot-open` into `~/.jjodel-lanes/P-2026-11-08-2216/crops/`; say whether dji's rows clip at 200x120 (ticket if they do, do not fix). Run the LIR smoke scenarios that the probe can reach and say which. Commit the probe.

(4) Gates: typecheck, typecheck:scripts, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs; `git diff --stat 0a519ffc3 HEAD -- '*useJjomSync.ts' '*portDistribution.ts' '*canvasToJjom.ts' '*LModelElement.tsx' '*reducer.ts' '*ProjectEditor.tsx'` must be empty.

(5) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill covering 2157 and this lane (Notes at most 480 characters by `wc -m`; Layer Impact Report: docs/discovery/lir_2026-11-08_dcn_snapshot_write.md; Smoke visivo: crop read by the lane, chat to read it); Status flip of both prompts. Remove the temporary node_modules link. `git add` only named files. No push, no merge. Final message: files and commits, gate table, probe MEAS, crop description, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simSnapshotWrite.ts (new) and its test; sim/simSnapshot.ts only for a plan defect, reported; frontend/scripts/probe/dcn-snapshot.ts (new); docs/log-inbox/dcn.md; the two prompts. Core files read-only. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-2157/handoff.md, handoff.diff; docs/prompts/claude_2026-11-08_2157_prompt_dcn_s5_5_snapshot_write.md (COSA (3)); docs/decisions.md R-DCN-30.
