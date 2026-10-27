# Prompt: Phase 2, Lane C `sim-state-face`: the M1 panel, the inspector and the canvas of the simulator's state UI

Prompt-ID: P-2026-10-03-0120
Chat: C-2026-10-02-2340
Lane: full (Phase 2, simulation panel, inspector and canvas overlay, visual check by the chat). Tier: heavy.
Status: eseguito 2026-10-03 · lane sim-state-face · 6eedc4bf3, eb7d54c6b, d7ff4f821, 16539631f, d9e344274 · the M1 face (Watch, Marking chips, Events above the buttons, one status line under them, «State…»), SimInspector (left 584, bottom 16, 400 wide, clamped 16 px clear of the 202 px MiniMap and under the toolbar; σ, node, trace, a step viewed, Back to live), SimCanvasLayer (Inspect node.[x] switch, globals card, both off) and the node tags; after the chat's visual check (RC-23) two fixes in 16539631f: the seed in the status line's title only, amending R-SIM-104 on the seed (R-SIM-100's place), and Watch the globals by default, an instance's attribute only when pinned, four rows at most; the lane's four choices adopted by the chat as recommended; typecheck 14 (the §17 set), sim suites 978/978, build exit 0, lane probe on 3068 (light, 1600×1000, the four demo exports) 138/138: Step's top 873 from Not started to the last step in all four scenes, the script's readings line for line; crops docs/discovery/harness/_tmp_simface_*.png (gitignored) · GO visivo della chat 2026-10-03 (RC-23) sulle crop fresche, dopo due correzioni chieste sulle prime: status line with step and last step, seed in the title only; Watch at most four rows; panel, Marking chips, Events, inspector with the viewed step, trace, canvas tags and Inspect switch as checked at 02:31 · non fuso

Worktree: `~/jjodel-w-simface`, branch `sim-state-face`, cut by the chat from `alfonso-frontend-jjtl` after the merge of `sim-state-model` (P-2026-10-03-0114), `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch, `git log -1` (the docs commit that added this prompt), and `grep -n 'export function getSimView' frontend/src/components/editor-v2/sim/simRunState.ts` hits; if any check fails, stop with `Outcome: blocked`.

## COSA

Build §8.3 of `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (P-2026-10-02-2340), as adopted in the R-SIM-109 entry of `docs/decisions.md`: R-SIM-104, 105, 106 (UI), 107, 109, and R-SIM-102 on the face and the canvas. The logic is Lane A's (`sim-state-model`, P-2026-10-03-0040, merged): the Watch rows, Marking chips, status line, `stateKindOf`, kept configurations, `simSetView`/`getSimView`, `simViewerPrefs.ts`. This lane renders them and adds no logic of its own beyond wiring.

1. The compact M1 panel (`SimulationPanel.tsx`): above the transport row, from the top, «Watch» (pins, globals first by default, domain bar for a range, `DEFINE`/`IVAR` chip, before → after), «Marking» chips (`×n` from two), «Events» (reason in the title when off, an input chip when the press asks one). The marking line and the Output line go (R-SIM-82, R-SIM-92 amended). The transport row and Choices stay where R-SIM-65, R-SIM-66 and R-SIM-101 put them; the panel grows upward; after the first change Step's top never moves. The status block carries the pill, `step n`, the seed and the last step on one line. The «Data…» button reads «State…» (label only).
2. An expand button opens `SimInspector` (new): a floating card mounted by the panel, right of it (left 584 px, bottom 16 px), 400 px wide, clamped clear of the MiniMap and the rail. Whole σ (globals with domain bars, then per metaclass per instance, marked ones flagged), the concrete state in its own section (viewpoint pink, dashed), the trace as clickable steps; choosing one calls `simSetView`, shows «Viewing step n. The run is still at step m» with «Back to live»; an input pressed while viewing returns to live.
3. Canvas (`SimNodeRunState.tsx`): the σ card under every node is replaced by tags for the attributes the viewer turned on, plus the attributes changed by the last step for that step only; `SimCanvasLayer` (new, mounted by the panel) carries the optional globals card and the «Inspect node.[x]» switch (off by default), which shows dashed pink tags of each element's presentation values.
4. Visual key (R-SIM-102): σ solid slate with the glyph `σ`, `node` in the viewpoint pink family with a dashed outline, kinds as `VAR`/`DEFINE`/`IVAR`, a changed value tinted with the run's cyan. Design tokens only; Bootstrap Icons only.

## DOVE

Exactly these seven files: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `…/sim/simulation-panel.scss`, `…/sim/SimInspector.tsx` (new), `…/sim/SimInspector.scss` (new), `…/sim/SimNodeRunState.tsx`, `…/sim/simNodeRunState.scss`, `…/sim/SimCanvasLayer.tsx` (new; its rules in `simNodeRunState.scss` or `simulation-panel.scss`). Plus the closure docs: this prompt's Status, `docs/log-inbox/simulation.md`, and the demo-script lines §8.3 names in `docs/demo/models_2026_simulator_demo.md`. Not the dialogs (Lane B, `sim-state-dialog`, parallel) and not Lane A's files.

## COME

1. Read `CLAUDE.md` (design tokens, Bootstrap Icons, BEM, grep before naming, no source-text tests), P16, RC-17, RC-21, RC-23, RC-25, RC-33, R-SIM-3, R-SIM-6, R-SIM-65, R-SIM-66, R-SIM-82, R-SIM-92, R-SIM-100, R-SIM-101, R-SIM-102..109, and §1, §5, §7, §8.3, §9 of the report. Grep every new class and export again before use (§9 lists them).
2. The UI has no node bench (its logic is tested in Lane A). Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the sim suites, `npm run build`.
3. Lane probe at 1600×1000, light theme (`lane-run probe`, port 3068, never 3001; kit `~/.jjodel-lanes/probe-kit/simgate/`, scenes `~/jjodel-demo-exports/`): on each of the four demo scenes, Step's top constant through the run after its first change; the inspector inside the editor with the rail open and collapsed; a past step viewed (overlay and highlight); tags and the switch; the four scenes' run readings unchanged. Crops as gitignored `docs/discovery/harness/_tmp_simface_*.png`, one per scene for the panel, one for the inspector, one for the canvas tags.
4. Commits: code, then the demo-script lines, then the closure docs commit. Stop with `Outcome: hard-stop` for the chat's visual check, with the shas, the measures and the crops' paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-02_sim_state_ui.md` §1, §5, §7, §8.3, §9; R-SIM-102..109; Lane A P-2026-10-03-0040; the design canvas «Simulator UI and state data» (Claude Design, not in the repo; the rows are normative).
