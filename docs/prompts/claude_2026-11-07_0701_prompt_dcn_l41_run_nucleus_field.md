# DCN L4.1: a nucleus field on the simulator run, Petri as its default (behaviour-preserving)

Prompt-ID: P-2026-11-07-0701
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-07 · lane dcn · 8de3f6ae8 · bench 12/12 killed · verifica visiva passata 2026-11-07 (chat, browser parity with base on DemoESM, P-2026-11-07-0750)
Lane: full (changes an exported interface of the run state; behaviour-preserving refactor of the simulator)
Depends: R-DCN-8, R-DCN-11, R-SIM-29, R-SIM-122, R-SIM-137..141; discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.1, §3.2
Worktree: ~/jjodel-w-dcn-l41, branch dcn-l41, from dcn at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 06:51 «Via»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done (the discovery above); this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit as soon as gates are green. Every reply opens with [P-2026-11-07-0701 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log. Before a browser probe check `uptime`: wait while the 1-minute load is above 20. Rule 11: this prompt authorizes one new required-or-optional field on `SimRun` and one new exported interface.

## Contesto (non rifare l'analisi)

Read the discovery §3.1 and §3.2 only. The run record `SimRun` (`components/editor-v2/sim/simRunState.ts:81-117`) carries `net: CompiledNet`; replay for step back and the slider calls `step(run.net, ...)` (`simRunState.ts:328-331`); the Clock's enabling test goes through `structuralInputs(net, state)` (`model/simulation/netStep.ts:368`, `simBoardClock.ts`); `startRun` (`simBridge.ts:724-754`) is the single entry and builds the Petri run. R-DCN-11 chose a DCN compiler emitting a placeless `CompiledNet` on the shared step; this lane makes that choice reversible by putting the step behind a field, without any DCN code.

## COSA

(1) An exported interface `SimNucleus` in a new file beside `simRunState.ts` (name checked free by grep): `initial: SimState`; `step(cfg, selector, guards, actions, derived)` with the signature and result of today's `step(run.net, ...)`; `structuralInputs(state)`; `terminated(state)`. A factory `petriNucleus(net)` that delegates to the existing `netStep.ts` functions, byte-for-byte the current behaviour.
(2) `SimRun` gains `nucleus: SimNucleus`; `net` stays (the Petri text readers in `simBridge.ts`, `simCoverage.ts`, `SimCanvasLayer.tsx` and the others keep reading it, unchanged in this lane). `startRun` sets `nucleus: petriNucleus(net)`.
(3) Callers switched to the field, and only these: `configAt` replay and `simStepBack`/`simSetView` in `simRunState.ts`, the Clock enabling test in `simBoardClock.ts`, Play and single step in `simBridge.ts` where they call `step` or `structuralInputs` or `terminated` on `run.net` directly. List every call site you switch in the commit body, and every `run.net` reader you leave, with its file.
(4) Tests first: a parity test that runs the existing turnstile and producer-consumer fixtures (or the ones `simBridge.test.ts`, `simBoardClock.test.ts` already use) through the field and through the old path and compares traces, states and run statuses step by step, including a step back and a Clock tick that enables nothing (R-SIM-122 amendment: not counted as a step). The existing sim suites pass unchanged. Mutation bench on the switched call sites (P5).
(5) Gates: typecheck at the baseline of CLAUDE.md §17, the sim suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`; then one existing sim browser probe (`frontend/scripts/probe/sim-event-attrs-browser.ts` or the one whose fixture covers step back and the Clock; say which) on a free port in 3080..3099, compared with the same probe on the base commit: same PASS lines. One code commit. Then hard stop with the log entry in `docs/log-inbox/dcn.md` and the Status flip left uncommitted (RC-17): the chat runs the visual smoke (a Petri run with step back, slider and Clock on the probe's server) before the GO.

## HARD STOP

A switched call site whose behaviour differs on any fixture, or a need to touch a file outside the five of DOVE: stop with Outcome: question.

## NON FARE

No DCN code, no change to `netStep.ts`, `netCompile.ts`, `netTypes.ts` or any panel text, no removal of `run.net`, no push, no merge. Public repo: name no partner company.

## DOVE

`frontend/src/components/editor-v2/sim/simRunState.ts`, `simBridge.ts`, `simBoardClock.ts`, the new nucleus file beside them, one new test file under `sim/__tests__/`.

## RIFERIMENTI

docs/decisions.md R-DCN-8, R-DCN-11, R-SIM-29, R-SIM-122; docs/discovery/discovery_2026-11-06_dcn_foundations.md §3.
