# Prompt: Phase 2, Lane A `sim-state-model`: the run model of the simulator's state UI (pure, no visual change)

Prompt-ID: P-2026-10-03-0040
Chat: C-2026-10-02-2340
Lane: full (Phase 2, simulation run state, bridge and stepping core, tests first, mutation bench, no visual check). Tier: heavy.
Status: eseguito 2026-10-03 · lane sim-state-model · 14311a636 · non fuso: done, no visual check (nothing on screen changes), typecheck 14 = baseline, sim and simulation 28 files 978 tests, build exit 0, four demo scenes' readings identical to the base tree, configAt replay equal to kept 30/30, mutation bench 53/56 (3 equivalent), configAt and withInputs in simRunState.ts (import direction)

Worktree: `~/jjodel-w-simmodel`, branch `sim-state-model`, cut by the chat from `sim-state-disc` at `fece79bc3` (the discovery branch, merging into the trunk as P-2026-10-03-0032), `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simmodel`, branch `sim-state-model`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Build §8.1 and §8.4 of `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (P-2026-10-02-2340), as adopted in the R-SIM-109 entry of `docs/decisions.md`, plus the reader of §0 Q5 of `docs/discovery/discovery_2026-10-02_sim_node_presentation.md` (P-2026-10-02-2345). Rows: R-SIM-102 (kinds), 104 (Watch, Marking, status line: the data), 106 (kept configurations, replay, viewed step), 107 and 109 (viewer preferences), 108 (the presentation reader only; the IR side is another lane). Nothing changes on screen: the overlay and the panel render as today.

1. `inputs?` on `SimTraceStep`, recorded by `press` (today the values reach only the title, `simBridge.ts:1424`).
2. Kept configurations in `simCommit`, capped at 1000; `configAt(run, n)` replays from `net.initial` over the recorded selectors and inputs.
3. `simSetView(modelId, n | null)` / `getSimView(modelId)`; the viewed-step setter bumps `'mark'`; `isSimActive`, `getSimActiveIds`, `getSimNodeState` read the shown configuration through one cached viewed record.
4. Pure builders for the face: Watch rows (name, kind, domain, value, before → after), Marking chips, the one status line; `stateKindOf(decl)` → `VAR | DEFINE | IVAR`.
5. `SimNodeState` gains presentation rows, kinds and the last step's changes; `sigma` stays semantic-only.
6. `simViewerPrefs.ts` (new): per model `{ pins | null, tags, globalsCard, inspectNode }`, its own version channel and hook, never `'mark'`; lost on reload, kept across Reset, Stop and a model switch; never read by `runSignature`.
7. A pure `presentationOf(state, element, attr)` in `netStep.ts`, with `stateAccess` delegating to it (stored then derived, `netStep.ts:52-57`), and `getSimPresentation(objectId, attr)` in `simRunState.ts`, reading the shown configuration through the same helper the overlay uses.

## DOVE

Exactly these ten files (rule 19: this list is the confirmation): `frontend/src/components/editor-v2/sim/simRunState.ts`, `…/sim/simViewerPrefs.ts` (new), `…/sim/simBridge.ts`, `…/sim/simCanvasState.ts`, `…/sim/__tests__/simRunState.test.ts`, `…/sim/__tests__/simBridge.test.ts`, `…/sim/__tests__/simCanvasState.test.ts`, `…/sim/__tests__/simViewerPrefs.test.ts` (new), `frontend/src/model/simulation/netStep.ts`, `frontend/src/model/simulation/__tests__/netStep.test.ts`. Plus the closure docs: this prompt's Status and `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md`, P16, RC-17, RC-21, RC-25, RC-33, R-SIM-6, R-SIM-18, R-SIM-34, R-SIM-100, R-SIM-101, R-SIM-102..109, both reports' §0, and §4, §5, §8.1, §8.4 of the first. Grep every new identifier again before use (both reports list them).
2. Tests first, then code. Mutation bench (gitignored `_tmp_*`): cap off by one, replay ignoring inputs, viewed read falling back to live, default pins, prefs bumping `'mark'`, `presentationOf` reading derived before stored; every mutant must fail a test.
3. Gates in the foreground: `npm run typecheck` (no new errors over the baseline of `CLAUDE.md` §17), the sim and simulation test suites, and the four demo scenes' run readings identical to the trunk's (`frontend/scripts/smoke/_tmp_simstate_bench.ts` from the discovery, run on both trees; copy it from `~/jjodel-w-simstate` if absent).
4. Commits: code and tests, then the closure docs commit (Status flip with sha, log entry). Stop with `Outcome: done`, the shas and the gates' results.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file.

## RIFERIMENTI

Both discovery reports; R-SIM-102..109. Parallel lane: P-2026-10-03-0041 (`sim-state-dialog`), disjoint files. After this lane: Lane C (`sim-state-face`) and the interpreter lane of R-SIM-108.
