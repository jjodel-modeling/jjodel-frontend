# DCN slice 5, lane 2: the run card's data reachable from the canvas

Prompt-ID: P-2026-11-08-1905
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (run-state plumbing; no UI)
Depends: P-2026-11-08-1829 (dcnCanvasState.ts on dcn-s5); discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A (Gap, Path) and §D lane 2
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file. No subagents, no background tasks. Every reply opens with [P-2026-11-08-1905 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: read only §A and §D of the discovery report and the line ranges it cites; never read `simBridge.ts` or `simRunState.ts` whole (grep the symbol, about 60 lines around); summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## COSA

(1) The registry of DCN runs (`dcnRunOf` and its `WeakMap<CompiledNet, ...>`, private in `simBridge.ts` about 822-827) moves to a small new module under `frontend/src/components/editor-v2/sim/` (grep the name first) that both `simBridge.ts` and `simRunState.ts` import, so `simRunState` does not import `simBridge` (avoid the cycle the report names). `simBridge.ts` behaviour unchanged: its existing tests stay green.

(2) `getSimDcnNode(objectId)` exported where the canvas reads run state today (next to `getSimNodeState`, discovery §A): returns `dcnNodeStateOf(...)` for the shown step of the live run of the object's model (`shown()`, R-SIM-106), null when there is no run, the run is not DCN, or the object is not a DCN instance. Cache per shown record (the per-record cache idiom the report cites in `simCanvasState.ts`), so a re-render without a step does not reclassify. The reset state for `changedStatic` is the run's σ0.

(3) Tests in `sim/__tests__/` (red first): no run gives null; a Petri run gives null; a DCN run at Reset gives Charging data; after steps the shown step drives the result, and step back (slider) returns the earlier data; two calls on the same record return the same object (cache).

(4) Gates: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build. Mutation bench (at least 5 mutants).

(5) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: non applicabile, no UI path). Status flip of this prompt. Commits: code with tests, then docs. `git add` only named files. No push, no merge. Final message: module name, signature, files and commits, gate table, mutants, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simBridge.ts, sim/simRunState.ts, the new registry module, sim/simCanvasState.ts only if `getSimDcnNode` belongs there, their tests; docs/log-inbox/dcn.md; this prompt. Not SimNodeRunState.tsx (lane 3). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A, §D; frontend/src/model/simulation/dcn/dcnCanvasState.ts (lane 1); docs/decisions.md R-DCN-29, R-SIM-106.
