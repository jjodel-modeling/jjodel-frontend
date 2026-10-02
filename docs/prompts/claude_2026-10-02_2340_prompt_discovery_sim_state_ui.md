# Prompt: discovery, the simulator's state UI (σ and node, State page, Watch, inspector, navigable trace, canvas tags)

Prompt-ID: P-2026-10-02-2340
Chat: C-2026-10-02-2340
Lane: discovery (read-only; the simulation panel, the roles and data dialogs, the run state, the canvas overlay). Tier: heavy.
Status: eseguito 2026-10-02 · lane discovery sim-state-disc · report docs/discovery/discovery_2026-10-02_sim_state_ui.md, measured on 60b60c31d · hard-stop, one decision for Alfonso (the MODELS demo) and seven questions with Recommended in §0, three Phase 2 lanes in §8

Worktree: `~/jjodel-w-simstate`, branch `sim-state-disc` (cut by the chat from `alfonso-frontend-jjtl` at `872d0abe8`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simstate`, branch `sim-state-disc`, `git log -1` is the docs commit that added this prompt and the rows R-SIM-102..109; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso accepted on 2026-10-02 a redesign of how the simulator shows its state, then delegated the rest to this chat («procedi tu, decidi tu»). The rows are **R-SIM-102..109** in `docs/decisions.md` on this branch; the proposal they come from is `docs/ratifiche/claude_ratifiche_2026-10-02_sim_state_ui.md`. This discovery covers R-SIM-102..107 and R-SIM-109; R-SIM-108 (`node.[x]` read by the viewpoints, it amends R-SIM-4) has its own discovery, P-2026-10-02-2345, in parallel: do not study the IR interpreter.

In one paragraph: σ (semantic) and `node` (presentation) are always shown apart, σ solid slate, `node` in the viewpoint pink, kinds named `VAR`/`DEFINE`/`IVAR`; the roles dialog's «Data» page becomes «State» with two columns, «Written by»/«Read by» on the selected row, E-NODE flagged before Apply, an optional read-only `.smv` preview; the compact M1 panel replaces the marking and Output lines with Watch (pins), Marking chips and Events, the buttons never moving; an inspector shows the whole σ, the concrete state and a navigable trace backed by kept configurations; the canvas σ card becomes opt-in tags plus an optional globals card; an «Inspect node.[x]» switch names presentation values on the canvas.

Goal: the facts and a Phase 2 plan of at most three lanes on disjoint file sets, so the chat can run them in parallel. Questions to answer, each with evidence and a `Recommended:` line:

1. Where the inspector docks: an rc-dock tab beside the editor, the right rail, or a wider floating panel. Measure what each costs (mount points, the dock's stacking context, the panel's anchoring rules in `simulation-panel.scss`).
2. Whether the `.smv` Export preview stays (R-SIM-103): what it would read, whether it duplicates code the deferred exporter will need. Recommend keep or drop.
3. «Written by» and «Read by»: can they be computed from what the compiler and `derivedEvaluator.ts` already collect, or does a new walk over guards, actions and equations need writing? Its cost on the panel's render path.
4. Keeping configurations (R-SIM-106): the memory cost on the four demo scenes and a long Play (k = 1000); where the cap and the replay live; how the canvas overlay reads a past configuration.
5. The viewer preferences (pins, tags, globals card, Inspect switch): one module beside the run policy, its shape, its reset rules (model switch, reload), and proof it never moves `runSignature`.
6. Where the label «Data» lives (roles dialog page, model button, hints such as «Declare in Data…», the demo script) and what renaming it to «State» touches.
7. The demo: which of the four demo scenes (DemoPEST, DemoPetri, DemoESM, DemoFlowB) change on screen with each lane, so the chat can tell Alfonso what a merge would change in his MODELS demo.

## DOVE (read-only)

- `frontend/src/components/editor-v2/sim/`: `SimulationPanel.tsx`, `simulation-panel.scss`, `SimRolesModal.tsx`/`.scss` (the `Declarations` table), `SimDataModal.tsx`, `simRunState.ts`, `simBridge.ts` (`markingLine`, `outputLine`, `undeclaredGlobals`), `simCanvasState.ts`, `SimNodeRunState.tsx`, `simNodeRunState.scss`, `simRoleStatus.ts`.
- `frontend/src/model/simulation/`: `stateAttributesCodec.ts`, `derivedEvaluator.ts`, `actionEvaluator.ts`, `netCompile.ts`, `netStep.ts`, `netTypes.ts` (what σ, `presentation`, `derived` hold, and the trace and seed of R-SIM-100).
- The mount of the panel in `EditorV2.tsx` and the dock (`DockManagerStyles.scss`), for Question 1 only.
- `docs/demo/models_2026_simulator_demo.md`, for Questions 6 and 7.
- Report: `docs/discovery/discovery_2026-10-02_sim_state_ui.md`, opening with `## 0. Answer in brief`, at most 40 lines (answer, recommendation, decisions awaiting Alfonso, questions with `Recommended:`); plus this prompt's Status and a log entry in `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (§6 discovery rules, critical zone, naming, Bootstrap Icons only, no new dependency, design tokens only), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-25, RC-26, RC-33, and R-SIM-3, R-SIM-6, R-SIM-18, R-SIM-34, R-SIM-65, R-SIM-66, R-SIM-82, R-SIM-92, R-SIM-94, R-SIM-100, R-SIM-101, R-SIM-102..109.
2. Answer with [M]/[R] evidence and file:line. Grep before proposing any new identifier (CSS class, export, event) and list the names you checked.
3. Measure with gitignored `_tmp_*` scripts under `npx tsx`; a lane probe only if Question 1 or 4 needs it (`lane-run probe`, port 3060, never 3001; setup from `~/.jjodel-lanes/probe-kit/simgate/`, scenes from `~/jjodel-demo-exports/`).
4. `Recommended:` the Phase 2 lanes, at most three, each with its exact file list, disjoint from the others, its order, its tests (written first), its R- rows, and the demo-script lines it changes. Name every critical-zone file (none is expected) and every point that is Alfonso's (RC-26).
5. One docs commit. Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code.

## RIFERIMENTI

- `docs/ratifiche/claude_ratifiche_2026-10-02_sim_state_ui.md` and R-SIM-102..109.
- The design canvas «Simulator UI and state data» (Claude Design): six artboards on an invented Turnstile model. Not in the repo; the rows carry everything normative.
- P-2026-10-02-2345 (parallel discovery on `node.[x]` in the IR interpreter): stay out of its perimeter.
