# Prompt: «Semantic Type Class» section with a Simulation toggle replaces the Semantic type select

Prompt-ID: P-2026-09-29-1225
Chat: C-2026-09-28-1936
Lane: full (amends R-SIM-97 just merged; Properties field, gate predicate, tests, demo script). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-simtoggle`, branch `sim-toggle` (cut by the chat from `alfonso-frontend-jjtl` at `12ac29f74`, which contains R-SIM-97; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simtoggle`, branch `sim-toggle`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

R-SIM-97 (merge of `sim-gate`, P-2026-09-29-1106) put a «Semantic type» select (None + eight presets, writing `simProfile`) in the metamodel's Properties, and gated the Simulation pill on Advanced mode + `simProfile`. Alfonso, 2026-09-29, revised it (his words): «nella property panel del metamodello farei una sezione chiamata Semantic type Class e sotto metterei un toggle con Simulation, se il toggle è on allora la pill simulation è visibile, i modelli di simulazione sono nella configurazione».

So:

1. In the metamodel's Properties, a **section** titled «Semantic Type Class» (same section pattern as the panel's other sections; grep, do not invent a class), shown for a metamodel in Advanced mode, containing one **toggle** «Simulation» (the panel's existing toggle component; grep).
2. The toggle writes a boolean in the metamodel's state bag. Key name: `simEnabled` (grep it is free; the chat chose it on the delegation; it is new persisted vocabulary, record it in the row). One `set_state`, one undo step. Off removes the key (or writes false: say which and why, given the undo ticket of R-SIM-97 on removed keys; prefer writing `false` so that undo works).
3. The gate becomes: Advanced mode **and** `simEnabled` true on the metamodel (M2 itself, or the `instanceof` of an M1). `simProfile` no longer gates the pill.
4. The simulation models (the eight presets, the role binding) are chosen in the configuration as before R-SIM-97: the pill's panel Profile select and the roles dialog, including the first-open picker (`KINDS`, `isFirstOpen`), which becomes reachable again. Remove the Semantic type select from Properties; keep `simProfile` semantics unchanged.
5. Compatibility: a metamodel saved by R-SIM-97 with `simProfile` set and no `simEnabled`: decide and state it; recommended: treat as enabled (read `simEnabled ?? !!simProfile`), so today's saved projects keep their pill.
6. The demo script (`docs/demo/models_2026_simulator_demo.md`): replace the Semantic type steps with «Advanced, click the metamodel canvas, Properties → Semantic Type Class → Simulation on», then the pill and the picker as before R-SIM-97; re-measure clicks per scene and the §2.1 Undo reading. Another lane (`sim-nondet-label`) edits the Petri «choose a transition» lines of the same script: do not touch those lines.

Record a row **R-SIM-99** in `docs/decisions.md` after the last R-SIM row (grep; R-SIM-98 may be on the trunk or on the other lane: take the next free number on this branch and say so), header exactly: `- **R-SIM-99** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: measured, verified: none, reversible: branch).` Body: his words, what it amends in R-SIM-97, the key and the compatibility rule.

## DOVE

- `frontend/src/components/editors/Info.tsx`, `frontend/src/components/editor-v2/sim/simRoleStatus.ts` (+ test), `frontend/src/components/editor-v2/EditorV2.tsx` (the gate call only), and any file R-SIM-97 touched that the change requires (list before the first edit); `docs/decisions.md` (the row, add-only); the demo script (the setup and first-steps lines only).
- Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

Not touched: `editor-v2/problems/`, the critical zone, `netStep.ts`, `netCompile.ts`, the choice list heading (other lane), `JodieWindow.css` and the placement (unchanged).

## COME

1. Read `CLAUDE.md` (Rule 9, Rule 11, §21.2, SCSS and naming, progressive disclosure), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, RC-34, R-SIM-97 and its discovery `docs/discovery/discovery_2026-09-29_sim_gate_and_placement.md`, and the `sim-gate` commits.
2. Tests first (red, then green): the predicate (Basic → hidden; Advanced + toggle off/absent → hidden; Advanced + on → visible on M2 and on an M1; legacy `simProfile` without `simEnabled` → per the compatibility rule); the toggle write is one undo step and undo restores the previous state; the first-open picker reachable when the metamodel has no `simProfile`. Mutation bench.
3. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only, `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
4. A lane probe on port 3052 (`lane-run probe`, never 3001), light theme, 1600×1000: start from `~/.jjodel-lanes/probe-kit/simgate/` (copy into `scripts/smoke/`, gitignored), adapt the setup to the toggle; the 8 gate cases; the four demo scenes end to end with the picker path, final readings compared to `~/.jjodel-lanes/probe-kit/trunk_readings_2026-09-29c.txt`; clicks per scene; crops of the Properties section and the toggle at `sips -Z 600` under `docs/discovery/harness/_tmp_simtoggle_*.png` (gitignored). Save the adapted probe as `_tmp_simtoggle_*` and say its path.
5. Commits one per layer, then one docs commit (row, demo script, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the measurements and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency.

## RIFERIMENTI

- R-SIM-97 and its discovery; the demo script; the `sim-gate` merge `P-2026-09-29-1200`.
