# DCN slice 5, lane 8: coherence constraints in the drone

Prompt-ID: P-2026-11-09-0237
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-09 · lane full · b139d21b6
Lane: full (probe fixture and exports only; no frontend/src)
Depends: lane 7 P-2026-11-09-0124 (roles `coherence`, `coherenceContext`, `coherencePointwise`, `coherencePattern`, `persistenceCondition`, `persistenceBound`, `responseTrigger`, `responseResponse`, `responseBound`; reader `dcnCoherenceFromRoles`, d6e051d6c) on dcn-s5
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No edit under frontend/src. No subagents, no background tasks. Every reply opens with [P-2026-11-09-0237 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: never read the fixture whole (grep, about 60 lines around); summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log, grep only MEAS, FAIL and DONE; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. Commit after each green item.

## COSA

(1) **Objects.** In `frontend/scripts/probe/dcn-drone-fixture.ts` (the metamodel already has `CoherenceConstraint`, `BoundedPersistence`, `BoundedResponse`, about lines 100-161) create three `CoherenceConstraint` instances in the class level, context `Drone`:
- `speedLimit`: pointwise φ `self.speed <= self.vmax`, no pattern;
- `lowBatteryPersistence`: pattern `BoundedPersistence`, condition `self.battery < 20`, k 10;
- `lowBatteryResponse`: pattern `BoundedResponse`, trigger `self.battery < 20`, response `self.speed == 0`, k 15.
Write the expressions with the same parse form the fixture stores for the invariants (it measures the forms; reuse the stored one).

(2) **Binding.** Bind the nine coherence roles in the metamodel's bag the way the fixture binds the other dcn roles (`CoherenceConstraint`, `CoherenceConstraint.context`, `.pointwise`, `.pattern`, `BoundedPersistence.condition`, `.k`, `BoundedResponse.trigger`, `.response`, `.k`).

(3) **Checks** added to the fixture: `dcnCoherenceFromRoles` on the built project returns the three constraints with the right kinds, texts and k and no defects (call it through the page as the fixture already calls the dcn readers; grep how); dcn problems still zero; instantiation problems zero; conformance clean. Regenerate both exports in `~/jjodel-demo-exports/dcn/` (previous ones saved under `~/.jjodel-lanes/P-2026-11-09-0237/prev/`) and `docs/discovery/assets/dcn-drone/dcn-drone.json`. The `dcn-drone-run.ts` probe stays green on the new export (one run).

(4) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: non applicabile, fixture and exports). Status flip. `git add` only named files. Remove any temporary node_modules link. No push, no merge. Final message: the stored expressions, MEAS, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/scripts/probe/dcn-drone-fixture.ts; frontend/scripts/probe/dcn-drone-run.ts only if a selector breaks; docs/discovery/assets/dcn-drone/; docs/log-inbox/dcn.md; this prompt; the exports in ~/jjodel-demo-exports/dcn/. Nothing in frontend/src. Nothing else; ask first.

## RIFERIMENTI

docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3; lane 7's entry in docs/log-inbox/dcn.md; docs/decisions.md R-DCN-28, R-DCN-31.
