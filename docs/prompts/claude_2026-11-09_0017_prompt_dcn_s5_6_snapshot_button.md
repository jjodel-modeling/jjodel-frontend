# DCN slice 5, lane 6: «Save snapshot» in the Simulation panel

Prompt-ID: P-2026-11-09-0017
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-09 · lane full · 55fe8cbb8
Lane: full (UI: SimulationPanel.tsx and its stylesheet; probe and crops)
Depends: lanes 4, 5 (`saveRunSnapshot` in sim/simSnapshotWrite.ts, 220791eb5) on dcn-s5; R-DCN-27, R-DCN-30; discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §B (Gesture)
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file; no change to `simSnapshotWrite.ts` or `simSnapshot.ts` (if one is needed, stop with Outcome: question). No new dependency. No subagents, no background tasks. Every reply opens with [P-2026-11-09-0017 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: never read `SimulationPanel.tsx` whole (grep the transport row and Stop, about 60 lines around); summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. One item per commit.

## COSA

(1) **Button.** In the transport row of `SimulationPanel.tsx` (after Stop, discovery §B cites about line 1362) a button «Save snapshot» with a Bootstrap icon (e.g. `bi-camera`), shown only for a DCN run. It calls `saveRunSnapshot(modelId, shownStep)` where the shown step is the slider's step when the slider is moved, else the trace length (R-SIM-106; the report: `getSimView ?? trace.length`). Disabled while Playing and while a snapshot is in flight; title says why. After the write, a short line in the panel says `Saved as «<new model name>»`, plus `<n> values not written` when the result's `unwritten` is not empty; the line clears at the next step or Reset. Reuse existing panel classes and tokens; grep any new class name first.

(2) **Tests**: none for rendering (R-DCN-32). If the enabling logic is a pure function, test it.

(3) **Probe**: extend `frontend/scripts/probe/dcn-snapshot.ts` (or the run probe, whichever already opens the panel) to press the button instead of calling the writer directly: absent for a Petri run (use any Petri fixture the probes already import, or skip with a MEAS if none is cheap), present and enabled at a DCN step, disabled while Playing, the saved line with `drone (snapshot step N)`, and the new model opens with dji's σ. Crops into `~/.jjodel-lanes/P-2026-11-09-0017/crops/`: `1-button` (the transport row with the button), `2-saved` (the panel line after the save). Say what each shows.

(4) **Gates**: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs.

(5) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: crops read by the lane, chat to read them). Status flip of this prompt. `git add` only named files. Remove any temporary node_modules link. No push, no merge. Final message: files and commits, gate table, probe MEAS, crop descriptions, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/SimulationPanel.tsx and its stylesheet; a pure helper next to it if needed, with test; frontend/scripts/probe/dcn-snapshot.ts or dcn-drone-run.ts; docs/log-inbox/dcn.md; this prompt. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §B; docs/decisions.md R-DCN-27, R-DCN-30, R-DCN-32, R-SIM-106; frontend/src/components/editor-v2/sim/simSnapshotWrite.ts (`saveRunSnapshot`).
