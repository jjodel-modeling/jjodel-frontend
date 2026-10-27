# Prompt: Phase 2, the Simulation pill behind Advanced mode and the metamodel «Semantic type»; Jjodie smaller and aligned with the pill

Prompt-ID: P-2026-09-29-1106
Chat: C-2026-09-28-1936
Lane: full (Phase 2; six code files plus the demo script; tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane sim-gate · 9f32ed9e0, 381353f75, ea326ef6a · non fuso: hard-stop, lane probe on 3050 (light), four scenes and the gate, crop in docs/discovery/harness/_tmp_simgate_*.png (gitignored), R-SIM-97 nel commit docs, verifica visiva alla chat

Worktree: `~/jjodel-w-simgate2`, branch `sim-gate` (cut by the chat from `alfonso-frontend-jjtl` at `cd2b5fec9`, which contains R-SIM-96; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simgate2`, branch `sim-gate`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement §6 of `docs/discovery/discovery_2026-09-29_sim_gate_and_placement.md` (branch `sim-gate-disc`; read it with `git show sim-gate-disc:docs/discovery/discovery_2026-09-29_sim_gate_and_placement.md`), all of it. Alfonso decided on 2026-09-29, and ratified the report's recommendations («Yes, all»):

- Gate: the Simulation pill is mounted only when Advanced mode is on (Redux `state.advanced`) **and** the metamodel (M2 itself, or the `instanceof` of an M1) has `simProfile` set. One pure predicate `simPillVisible` in `simRoleStatus.ts`, used once at `EditorV2.tsx:4416`.
- «Semantic type» in the metamodel's Properties (GENERAL of `builder.model`, `Info.tsx`), shown for a metamodel in Advanced mode: `None` plus the eight `PANEL_PROFILE_IDS`; writes `simProfile` through `set_state` (one undo step); `None` removes `simProfile` only and keeps the role bag (D3).
- Placement, editor tabs only (D2): Jjodie 48×48, glyph 24 px, left 216, bottom at the editor's bottom edge minus 16; the closed pill on Jjodie's centre line (D1), 16 px to its right; the open panel keeps bottom 16. Out of flow, no layout shift. The dashboard's Jjodie unchanged.
- The Problems producer is not touched (critical zone): write a ticket in the log. The dialog's picker code (`KINDS`, `isFirstOpen`) stays, marked `// TODO: cleanup`.
- Demo (D4): the Semantic type is set live in each scene («I say what kind of model this is»). Update `docs/demo/models_2026_simulator_demo.md` setup and each scene's first steps with the measured clicks, the §2.1 Undo reading and the §2.4 undo stack as the report predicts, re-measured.

Record a row **R-SIM-97** in `docs/decisions.md` after R-SIM-96, header exactly: `- **R-SIM-97** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: measured, verified: none, reversible: branch).` Body: the gate, the Semantic type field, None, the placement (centre line, editor tabs only), the demo choice, the discovery.

## DOVE

- The six code files §6 lists, exactly (list them before the first edit), their tests; `docs/decisions.md` (the row, add-only); `docs/demo/models_2026_simulator_demo.md`. Grep every new identifier and class first.
- Closure: `docs/log-inbox/simulation.md` (entry plus the Problems ticket) and this prompt's Status.

Not touched: `editor-v2/problems/`, the critical zone, `netStep.ts`, `netCompile.ts`, the viewpoint derivation.

## COME

1. Read `CLAUDE.md` (§6, Rule 9, Rule 11, §21.2, SCSS and naming, progressive disclosure), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, RC-34, R-SIM-95, R-SIM-96, and the discovery end to end.
2. Baseline: typecheck count, vitest of the touched folders.
3. Tests first (red, then green): the predicate (Basic → hidden; Advanced without `simProfile` → hidden; Advanced with it, on M2 and on an M1 of it → visible); the Properties write (one undo step, None keeps the bag); the dialog opened on a stored preset proposes the same bindings as today (the 7/10, 9/10, 10/13, 10/13 of the report). Mutation bench.
4. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only, `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
5. A lane probe on port 3050 (`lane-run probe`, never 3001), light theme, at 1600×1000: measure Jjodie's and the pill's boxes (px) and centres against the report's targets; Basic mode: no pill; Advanced without type: no pill; set the type: pill; the four demo scenes run end to end with the new setup, their final readings equal to the reference `~/.jjodel-lanes/probe-kit/trunk_readings_2026-09-29c.txt` except the lines the report predicts (§2.1 Undo, §2.4 stack); count clicks per scene. Crops at `sips -Z 600` under `docs/discovery/harness/_tmp_simgate_*.png` (gitignored).
6. Commits one per layer, then one docs commit (row, demo script, log entry with the ticket, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the measurements and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency.

## RIFERIMENTI

- The discovery (§0, §6); R-SIM-95, R-SIM-96; the demo script.
