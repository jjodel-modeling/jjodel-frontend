# DCN L4.6: polish of the DCN Simulation panel (findings of the L4.5 visual check)

Prompt-ID: P-2026-11-08-1606
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-08 · lane full · 4bf647cf4 · verifica visiva passata 2026-11-08
Lane: full (slice 4 polish; `editor-v2/sim/` and `model/simulation/dcn/`; code and gates, then one probe run)
Depends: P-2026-11-08-0430 (dcn-l45 on the trunk, 617ad7579), findings of P-2026-11-08-0329 (log entry in docs/log-inbox/dcn.md)
Worktree: ~/jjodel-w-dcn-l46, branch dcn-l46, at the commit that adds this prompt on top of the trunk
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 16:04, «via, ok con l'ordine»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1/§3.2 critical-zone file, no core (`LModelElement.tsx`, the L proxy, `guardContext.ts` freeze rule), no new dependency. No subagents, no background tasks. Every reply opens with [P-2026-11-08-1606 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line (the four L4.5 lanes hit the ceiling): never read a whole large file (`simBridge.ts`, `SimulationPanel.tsx`, `simRunState.ts`); grep the symbol, read about 60 lines around it. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; grep only MEAS, FAIL, DONE and failing test names. One numbered item per commit, commit as soon as it is green; if the context gets heavy, stop at a commit boundary with a handoff.

## COSA

Each item: red test first, then the fix, then its commit.

(1) **Tick label.** The Tick input shows the raw event id `dcn-tick` (`DCN_TICK_EVENT`, `dcnCompile.ts:51`). The button and the last-step text read `Tick` instead; the event id stays `dcn-tick` everywhere else (tests, probes, trace).

(2) **Repeated label in the last-step text.** After a press it reads `dji.takeOff() in Mode::Ready: dji.takeOff() in Mode::Ready fired`. It reads `dji.takeOff() in Mode::Ready fired` (input label once, then the outcome), and the same for a tick (`Tick: Mode::Flying drain fired` or equivalent, label once). Petri texts unchanged: check with the existing `lastStepText` tests.

(3) **Inputs enabled only when admissible.** A DCN input button is enabled only when `DcnNucleus.candidates` for the current state contains a candidate for it (owner class active and `pre` true); otherwise disabled, with a title saying why (`not in Mode::Ready`, `precondition false`). `takeOff` is disabled in Charging. The Tick is enabled when at least one monitor of an active class contributes. Reuse the existing disabled styling of the Petri event chips; grep any new class name first.

(4) **Tooltip of the classification chips.** The title lists `wau1: ownedSensors = temp`, one of four values. A multi-valued slot lists all its values (`temp, wind, rain, humidity`). Fix in `dcnPanelText.ts` (`dcnClassificationLine` title).

(5) **Invocation arguments through `withInputs`** (`simRunState.ts:303`, ticket of P-2026-11-08-0315). Measure first with a test: press `dji.charge(rate = 5)` on a DCN run and assert `chargeRate` (or the slot the body writes) becomes 5. If it fails, make `withInputs` pass DCN invocation arguments (declared on the DCN entry's `inputs`, `entries[].inputs`) without changing the Petri path; a Petri test that pins today's behaviour stays green. If the fix needs a file outside DOVE, stop with Outcome: question.

(6) **Gates**: typecheck, typecheck:scripts, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on items 1-5 (at least 10 mutants, report killed/survived).

(7) **Probe**: re-run `frontend/scripts/probe/dcn-drone-run.ts` once (free port, not 3001; temporary node_modules symlink removed at the end; wait while the 1-minute load is above 20). Update only its tick selector to the new label `Tick` (constant), and add two checks: `takeOff` is disabled after Reset (Charging) and enabled in Ready. Crops 1-reset and 3-takeoff into `~/.jjodel-lanes/P-2026-11-08-1606/crops/`; say what each shows.

(8) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters measured with `wc -m` before committing; Corregge: the P-2026-11-08-0329 findings; Causa: one line; Layer Impact Report not-required unless the hook asks; Smoke visivo: crops read by the lane, chat to read them). Status flip of this prompt. `git add` only named files. No push, no merge. Final message: files and commits, gate table, mutants, probe MEAS, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simBridge.ts, sim/simRunState.ts (only `withInputs` and what it calls for DCN arguments), sim/SimulationPanel.tsx, their existing tests; frontend/src/model/simulation/dcn/dcnPanelText.ts, dcnStep.ts (only if `candidates` needs an exported helper), their tests; frontend/scripts/probe/dcn-drone-run.ts; docs/log-inbox/dcn.md, this prompt. Not `dcnCompile.ts` (the event id stays), not the export or the fixture (a separate lane fills the drone's empty slots). Nothing else; ask first.

## RIFERIMENTI

docs/log-inbox/dcn.md (entries of P-2026-11-08-0315 and 0329, ticket paragraphs); docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md; docs/decisions.md R-DCN-22, R-DCN-3; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §6.
