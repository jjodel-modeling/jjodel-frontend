# Prompt: the halt line reads whole in the halted state

Prompt-ID: P-2026-09-27-2225
Chat: C-2026-09-27-1437
Lane: fast (one visible defect in a demo scene; `SimulationPanel.tsx` and `simulation-panel.scss` only; visual check by the chat on the lane's crops, RC-23)
Status: eseguito 2026-09-27 · lane sim-halt-line · e0e6ee5e4, docs 1ec1e8138, 31851507b and the commit of this line (R-SIM-63 amended, demo script) · verifica visiva OK (chat, RC-23, shots_halt)

Worktree: `~/jjodel-w-haltline`, branch `sim-halt-line` (cut by the chat from `alfonso-frontend-jjtl` at `d88e70e0e`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-haltline`, branch `sim-halt-line`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

In the ESM scene of the MODELS demo, at 1600x1000, the Simulation panel cuts the halt line to «Halted: coins of demoESM would be 4, outside it...» and the last-step line to «Last step: coin: tc (locked → locked) halted the r...» (crop `~/.jjodel-lanes/shots_demo_modal/esm_4_panel_final.png`, lane P-2026-09-27-2105). The cut falls on the sentence the scene exists to show; the full text is only in the hover title.

Alfonso ratified on 2026-09-27 at 22:20 («ok alle raccomandazioni», item 3): in the halted state only, the halt line may wrap onto a second line inside a slot reserved for two lines, so nothing below it moves when the run halts or resets beyond what the halted state already changes. Every other state keeps today's single-line truncation. The last-step line follows the same rule only if the reserved slot fits it without moving the controls; otherwise leave it truncated and say so.

Write the ratification memo `docs/ratifiche/claude_ratifiche_2026-09-27_evening_answers.md` (English) recording Alfonso's four answers of 22:20: (1) the chat drafts provisional R-SIM-50/51/52 rows on the sim-outputs-accepting branch, Alfonso ratifies them before the post-MODELS merge; (2) canvas run state keeps both token numbers and dims the authored row value while a run is active, decided on his 3001 walk after MODELS; (3) this lane; (4) his own 3001 walk of the modal before the freeze.

## DOVE

- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (only if a class or wrapper is needed on the halt line) and `simulation-panel.scss`. Verify any new class name is free with a global grep first.
- `docs/ratifiche/claude_ratifiche_2026-09-27_evening_answers.md` (new), `docs/log-inbox/simulation.md` (one entry), this prompt's Status flip.
- Probe: copy of the 2105 ESM probe (`~/jjodel-w-demo-modal/frontend/scripts/smoke/_tmp_demomodal_*`, read-only) as `_tmp_halt_*` (gitignored), dev server from this tree on port 3025 only. Crops in `~/.jjodel-lanes/shots_halt/`: the ESM final panel at 1600x1000 and 1280x800, light and dark; the Petri deadlock panel and the SM terminated panel at 1600x1000 light (to show those states did not change).

Out of scope: every other file, every critical-zone file, the demo script (the chat updates it if a gesture changes; it should not).

## COME

1. Read `CLAUDE.md`, the two files whole, and the 2105 log entry.
2. Baseline: typecheck (14 known), vitest on the two sim directories.
3. The change, minimal diff. Measure in the probe, before and after: the panel height and the top of the controls in the running, halted and terminated states; nothing but the halt slot may change, and only in the halted state.
4. Gates: typecheck same 14, vitest green, build exit 0, `check:docs`, em dash grep 0 on the memo.
5. Commits: `fix(sim): the halt line reads whole in the halted state (P-2026-09-27-2225)`; then docs: memo, log entry, Status flip.
6. `Outcome: hard-stop` with the shas, the before/after measures, the diff, and the crop paths: the chat runs RC-23 and merges before the freeze.

Stop with `Outcome: question` and a `Recommended:` line if the reserved slot moves the controls in any state other than halted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, ports other than 3025.

## RIFERIMENTI

- `docs/demo/models_2026_simulator_demo.md` (ESM scene); the P-2026-09-27-2105 entry in `docs/log-inbox/simulation.md`; `docs/decisions.md` R-SIM-85.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-23, RC-25.
