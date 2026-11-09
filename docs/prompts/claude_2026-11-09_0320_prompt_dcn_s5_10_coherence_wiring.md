# DCN slice 5, lane 10: coherence constraints in a run, as watch hits

Prompt-ID: P-2026-11-09-0320
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-09 · lane full · 31744a717 · verifica visiva passata 2026-11-09
Lane: full (wiring in simBridge.ts; probe and crop)
Depends: lanes 7 (`dcnCoherenceFromRoles`), 8 (drone constraints), 9 (`dcnCoherence.ts`: compile and `coherenceHits`) on dcn-s5; R-DCN-28, R-DCN-31; discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §C (Plug-in)
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file. No subagents, no background tasks. Every reply opens with [P-2026-11-09-0320 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: never read `simBridge.ts` whole; the symbols are `startDcnRun` (about 848), `runWatchesOf` (about 1788), `watchResults` (about 1803), `keptHits` (about 1810), `watchHitLine` (about 1843): grep, read about 60 lines around each. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. One item per commit.

## COSA

(1) **Compile at Reset.** In `startDcnRun`, read the constraints with `dcnCoherenceFromRoles` and compile them with lane 9's compile step; keep the compiled set on the DCN run record (the `simDcnRuns.ts` registry, lane 2). Coherence defects join the run's compile defects (the panel's defects line shows them, as the discovery says: shown, never a run error).

(2) **Hits as watch results.** `watchResults` (and the per-configuration `keptHits` path the Play loop uses) appends, for a DCN run, the coherence hits of the configurations up to the asked one, as `WatchResult`s of kind `invariant` named `<constraint>@<instance>` (instance by name), hit when `coherenceHits` reports one at that step. Play stops on a coherence hit like on a watch hit; the hit line names the constraint and the instance; step back and the slider show the hits of the shown step (they are a fold over configurations, lane 9). Petri runs unchanged. The fold needs the whole trajectory from σ0, while the run keeps only the last `SIM_KEEP_CONFIGS` configurations (lane 9, decision 5): for a longer run rebuild the missing prefix by replay (`configAt`, as step back does) or keep the coherence fold state per kept configuration so the oldest kept one carries the counters; say which, and test a run longer than `SIM_KEEP_CONFIGS` with a persistence that spans the cut. Lane 9 reports one hit (`pointwise`) when φ and ψ of the same constraint fail at the same step on the same instance; keep that, and say it in the log entry.

(3) **Tests** in `sim/__tests__/simBridge.test.ts`, red first: a DCN run with a φ that fails after a press reports a hit at that step and Play stops there; a persistence with k = 1 hits at the second consecutive step; a bad expression appears in the defects, not as a hit; a Petri run has no coherence results.

(4) **Probe**: extend `frontend/scripts/probe/dcn-drone-run.ts` (free port, not 3001): after takeOff, press `rampUp` until `speed` exceeds `vmax` (15): the hit line names `speedLimit@dji` at that step and Play (if pressed) stops on it; step back below that step and the hit is gone from the shown step. MEAS the step. Crop `1-hit` into `~/.jjodel-lanes/P-2026-11-09-0320/crops/` (the panel with the hit line). Say what it shows.

(5) **Gates**: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on the wiring (at least 6 mutants).

(6) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: crop read by the lane, chat to read it). Status flip. `git add` only named files. Remove any temporary node_modules link. No push, no merge. Final message: files and commits, gate table, mutants, probe MEAS, crop description, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simBridge.ts, sim/simDcnRuns.ts, their tests; sim/SimulationPanel.tsx only if the hit line needs a change to show a DCN name (then a few lines); frontend/scripts/probe/dcn-drone-run.ts; docs/log-inbox/dcn.md; this prompt. Read-only: `dcnCoherence.ts`, `dcnRoles.ts`, `watchEvaluator.ts`. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §C; lane 9's entry in docs/log-inbox/dcn.md (API); docs/decisions.md R-DCN-28, R-DCN-31, R-SIM-137, R-SIM-106.
