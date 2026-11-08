# DCN L4.5: start a DCN run from the bound roles, DCN panel texts, a drone run in the app

Prompt-ID: P-2026-11-08-0248
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (slice 4 closure: wiring of the DCN nucleus into startRun and the panel; `editor-v2/sim/` and `model/simulation/dcn/`)
Depends: P-2026-11-07 L4.1..L4.4 (dcnNucleus, compileDcn, dcnHandles, Interleave/Sync, halts, on the trunk), P-2026-11-08-0011/0057 (dcn-drone-objects.jjodel with the dcn roles bound), P-2026-11-08-0010 (conformance in DCN mode)
Worktree: ~/jjodel-w-dcn-l45, branch dcn-l45, at the commit that adds this prompt on top of the trunk
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md §3.1/§3.2 critical-zone file (if `simBridge.ts` or any file below is listed there, stop with Outcome: question before editing it). No core outside DOVE, no new dependency. No subagents, no background tasks. Every reply opens with [P-2026-11-08-0248 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; grep only failing test names. Before each browser probe run check uptime: wait while the 1-minute load is above 20.

## COSA

(0) **Discovery, read-only, report first.** Read `simBridge.ts` around `startRun` (≈ line 725), `candidateLabel`, `markingLine`, the Marking chips, `defectsLine`, `lastStepText`, `haltMessage`; `simNucleus.ts` (`nucleusOf`, `petriNucleus`); `simRunState.ts` (the `nucleus` field); `model/simulation/dcn/` (`dcnStcFromRoles`, `compileDcn`, `dcnNucleus`, `dcnHandles`, `DCN_TICK_EVENT`, `DCN_SYNC_SELECTOR`); the callers of `candidateLabel` and `markingLine` in `SimulationPanel.tsx`, `SimInspector.tsx`, `simBoard.ts`, `simScenarios.ts`. Save the report to `docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md` (objective, files read with paths, findings, the exact insertion points, risks, open questions). The report is mandatory before any edit. Then continue without stopping unless an open question falls outside DOVE.

(1) **startRun picks the nucleus by the bound roles (R-SIM-47).** When the metamodel's bag binds the «Dynamic classification» profile roles (`dcnStcFromRoles` returns an STC), `startRun` compiles with `compileDcn` from the object diagram (R-DCN-1, R-DCN-8, R-DCN-11) and sets `nucleus: dcnNucleus`; otherwise it keeps the Petri path unchanged. A metamodel that binds both profiles: Petri wins and the run records nothing new (say so in the report; no new halt). Tests first, red then green: a DCN bag gives a run whose `nucleusOf(run)` is the DCN nucleus; a Petri bag is unchanged; a bag with an incomplete DCN binding falls back to Petri.

(2) **DCN panel texts in a new `frontend/src/model/simulation/dcn/dcnPanelText.ts`, with `__tests__/dcnPanelText.test.ts`.** Pure functions, twins of the Petri ones, chosen in `simBridge.ts` by the run's nucleus:
- `dcnCandidateLabel`: an invocation reads `<instance>.<operation>(<args>)`, with the active redefinitions in parentheses as their viewpoint names (`dji.takeOff() (Mode)`); a tick contribution reads `tick: <Viewpoint>::<DynamicClass> monitor` (R-DCN-22: one invocation is one step; Interleave orders only tick contributions and distinct invocations).
- `dcnClassificationLine` (twin of `markingLine`, same `{ line, title }` shape): one segment per instance and viewpoint, `dji: Mode = Ready, Alert = Nominal`; an empty classification reads `unclassified`, a multiple one under a non-overlapping viewpoint lists the classes joined with ` + `. The title lists the slot values, dormant slots marked `(dormant)`.
- `dcnLastStepText`: as `lastStepText`, with the DCN label and the halt words of `haltMessage` for `unclassified` and `ambiguous`.
- `dcnDefectsLine`: the compile defects of `compileDcn` in the words of `defectsLine`; null when there are none.
The Marking chips: if the panel renders chips from the Petri marking, give the DCN run the classification segments as chips in the same component, or none, whichever needs no new component (say which in the report).

(3) **Wiring.** `simBridge.ts` calls the DCN twins when `nucleusOf(run)` is the DCN nucleus. `SimulationPanel.tsx` is touched only if a row must be added or renamed (for example «Marking» reading «Classification» for a DCN run); `SimInspector.tsx`, `simBoard.ts`, `simScenarios.ts` only if a call site there shows a Petri text for a DCN run, one line each. If more than those lines are needed, stop with Outcome: question.

(4) **Gates.** typecheck, typecheck:scripts, full vitest (baseline: the 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on dcnPanelText.ts and the startRun branch (at least 8 mutants; report killed/survived).

(5) **Visual check in the app.** Port free (not 3001), import `~/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel`, open the Simulation panel on the object diagram, Reset with Choices Random and a fixed seed. Crops of the panel, light theme, deviceScaleFactor 2, into `~/.jjodel-lanes/P-2026-11-08-0248/crops/`: `1-reset` (classification line after Reset), `2-ready` (after the ticks that bring `dji` to Mode = Ready; up to 20 ticks via the Clock or the tick candidate), `3-takeoff` (after invoking `takeOff` on `dji`), `4-flying` (after three more ticks in Flying). Say for each crop what the panel shows. If the drone never reaches Ready in 20 ticks, report the classification line at each tick (MEAS lines) and stop with Outcome: question. Known from the L2.5 screenshot: in the export `dji.power`, `dji.vmax` and every sensor slot (value, unit, status, speed, relative, intensity, presence) have no value; only distance, speed, battery, WAU and chargeRate are set. If Reset halts or a viewpoint is unclassified because of an empty slot, say which slot and which invariant, and stop with Outcome: question (Recommended in one line: seed defaults in the probe, or treat an empty slot as the attribute default at Reset); do not edit the export or the fixture.

(6) **Docs.** One log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes under 500 characters; Corregge and Causa the dash; Layer Impact Report not-required unless the hook asks; Smoke visivo: crops read by the lane, chat to read them). Status flip of this prompt. Commits: code with tests (`feat(dcn): start DCN runs from the bound roles; DCN panel texts (P-2026-11-08-0248)`), then docs. `git add` only named files. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simBridge.ts and its tests in `sim/__tests__/simBridge.test.ts`; new frontend/src/model/simulation/dcn/dcnPanelText.ts and `dcn/__tests__/dcnPanelText.test.ts`; SimulationPanel.tsx, SimInspector.tsx, simBoard.ts, simScenarios.ts only under (3); a probe script under frontend/scripts/probe/ for (5); docs/discovery/, docs/log-inbox/dcn.md, this prompt. Nothing in model/simulation/dcn/ other than the new file; the nucleus, compiler and handles are not touched. Nothing else; ask first.

## RIFERIMENTI

docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §6, §7, §8; docs/decisions.md R-DCN-8, R-DCN-11, R-DCN-22, R-DCN-23, R-SIM-47; docs/discovery/discovery_2026-11-06_dcn_foundations.md §6 (L4.5); the L4.1..L4.4 entries in docs/log-inbox/dcn.md.
