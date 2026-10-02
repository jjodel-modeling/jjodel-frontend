# Prompt: Phase 2, Lane B `sim-state-dialog`: the «State» page of the roles dialog and the model's «State» dialog

Prompt-ID: P-2026-10-03-0041
Chat: C-2026-10-02-2340
Lane: full (Phase 2, simulation dialogs, tests first, visual check by the chat). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-simdialog`, branch `sim-state-dialog`, cut by the chat from `sim-state-disc` at `fece79bc3` (the discovery branch, merging into the trunk as P-2026-10-03-0032), `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simdialog`, branch `sim-state-dialog`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Build §8.2 of `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (P-2026-10-02-2340), as adopted in the R-SIM-109 entry of `docs/decisions.md`: R-SIM-103, and R-SIM-102 in the dialogs.

1. The «State» page of the roles dialog (the «Data» page today): abstract column (globals `model`, then one group per metaclass) and concrete column (one group per metaclass), with the arrow «σ is read one way» between them.
2. Per row: name, a kind chip (`VAR`/`DEFINE`/`IVAR`, from `declarationForm` in `simInputs.ts`, unchanged), domain, initial or equation, access path (`model.[x]`, `self.[x]`, `node.[x]`); E-NODE flagged on its row before Apply (`compileDerived` on the draft).
3. On row selection only, «Written by» and «Read by», from `simStateUsage.ts` (new): the bound features' texts over `modelsOf`, the compilers' targets and reads, one exported StateAccess walk, matched by name with the root qualifying it.
4. The model's dialog (`SimDataModal.tsx`): the same table, metaclass fixed to Global, title «State of …».
5. «Data» renamed «State» in its visible strings only (§6 of the report); identifiers and classes unchanged; no Export preview (dropped by R-SIM-109).
6. The dialog is 640 px wide (`SimRolesModal.scss:38`): two columns need a wider modifier; measure it; no layout shift between pages.

## DOVE

Exactly these seven files: `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `…/sim/SimRolesModal.scss`, `…/sim/SimDataModal.tsx`, `…/sim/simRoleStatus.ts`, `…/sim/simStateUsage.ts` (new), `…/sim/__tests__/simRoleStatus.test.ts`, `…/sim/__tests__/simStateUsage.test.ts` (new). The «Data…» button on the M1 face lives in `SimulationPanel.tsx`, a Lane C file: leave it. Plus the closure docs: this prompt's Status, `docs/log-inbox/simulation.md`, and the demo-script lines §8.2 names in `docs/demo/models_2026_simulator_demo.md`.

## COME

1. Read `CLAUDE.md` (design tokens only, Bootstrap Icons only, BEM, grep before naming), P16, RC-17, RC-21, RC-23, RC-25, RC-33, R-SIM-18, R-SIM-71, R-SIM-81, R-SIM-94, R-SIM-102..109 and §3, §6, §8.2, §9 of the report. `sim-roles-modal__kind` is taken: do not use it for the chip.
2. Tests first: the usage table of §3 as fixtures; mutants (root ignored, action value not walked, equation reads dropped) must each fail a test.
3. Gates in the foreground: `npm run typecheck`, the sim suites, `npm run build`. Lane probe at 1600×1000, light theme (`lane-run probe`, port 3064, never 3001; kit `~/.jjodel-lanes/probe-kit/simgate/`, scenes `~/jjodel-demo-exports/`): crops of the State page on ESM and Flow B with a row selected, and of the model's dialog, saved as gitignored `docs/discovery/harness/_tmp_simdialog_*.png`.
4. Commits: code and tests, then the demo-script lines, then the closure docs commit. Stop with `Outcome: hard-stop` for the chat's visual check, with the shas and the crops' paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-02_sim_state_ui.md` §0, §3, §6, §8.2, §9; R-SIM-102..109. Parallel lane: P-2026-10-03-0040 (`sim-state-model`), disjoint files.
