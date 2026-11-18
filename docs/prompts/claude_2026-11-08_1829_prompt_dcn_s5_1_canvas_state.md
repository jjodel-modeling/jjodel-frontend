# DCN slice 5, lane 1: pure per-instance run state for the run card

Prompt-ID: P-2026-11-08-1829
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-08 · lane full · d614f6dde
Lane: full (one pure module and its test; no UI)
Depends: R-DCN-25, 26, 29 (branch dcn-s5, 1a82626a6); discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A and §D lane 1
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file. No subagents, no background tasks. Every reply opens with [P-2026-11-08-1829 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: read only §A and §D of the discovery report and the exact line ranges it cites (about 60 lines each); never read a whole file over 400 lines; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## COSA

(1) New pure module `frontend/src/model/simulation/dcn/dcnCanvasState.ts` (grep the name first) exporting `dcnNodeStateOf(model, nucleus, state, resetState, instanceId)` (adapt the signature to the types you find; report it) that returns, for one instance, plain data for the run card:
- `viewpoints`: for each viewpoint of the instance's static class, its name and its dynamic classes as `{ name, active }` (from `DcnNucleus.classify` and `model.instances.get(id).viewpoints`, discovery §A);
- `dormant`: the slots whose `dormantOwner` class is inactive, with name and kept σ value (R-DCN-3, R-DCN-26);
- `monitors`: the active dynamic classes that have tick monitors (`compiled.entries` kind `tick` for this instance), with the monitor names;
- `changedStatic`: the static slots whose σ differs from the value at Reset (R-DCN-29), name, reset value, current value;
- null for an id that is not a DCN instance.
Classify only the asked instance if the nucleus allows it; if `classifyState` must evaluate all instances, cache per state object (WeakMap) inside this module and say so.

(2) Test `frontend/src/model/simulation/dcn/__tests__/dcnCanvasState.test.ts`, red first, on a hand-built drone-like model (Mode with Ready, Flying, Charging and `chargeRate` dormant under Charging; Alert; a Flying monitor `drain`; a static `speed` that changes): Charging state, Flying state, a non-instance id, an instance without viewpoints.

(3) Gates: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build. Mutation bench (at least 6 mutants).

(4) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: non applicabile, no UI path). Status flip of this prompt. Commits: code with test, then docs. `git add` only named files. No push, no merge. Final message: signature, files and commits, gate table, mutants, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/model/simulation/dcn/dcnCanvasState.ts (new) and its test; docs/log-inbox/dcn.md; this prompt. Read-only elsewhere. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A, §D; docs/decisions.md R-DCN-3, R-DCN-25, R-DCN-26, R-DCN-29; frontend/src/model/simulation/dcn/dcnStep.ts, dcnHandles.ts, dcnCompile.ts (ranges cited in §A).
