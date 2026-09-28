# Prompt: R-SIM-94 Phase 2, the globals of a system are declared in its model

Prompt-ID: P-2026-09-29-0110
Chat: C-2026-09-28-1936
Lane: full (Phase 2, simulation bridge, panel and a new dialog, tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane sim-data-level-p2 · b4fba8a39, 59b020a5c, 6c06503b7, 35d0e19a2, ef24c0a7c, 812b17cab · non fuso: hard-stop, crop in docs/discovery/harness/_tmp_datalevel_*.png (gitignored), §8 della discovery con i passi del tab modello

Worktree: `~/jjodel-w-datalevel2`, branch `sim-data-level-p2` (cut by the chat from `alfonso-frontend-jjtl` at `174f6c58a`, after the R-SIM-90 Phase 2 merge; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-datalevel2`, branch `sim-data-level-p2`, `git log -1` is the docs commit that added this prompt and the R-SIM-94 row; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement R-SIM-94 (this branch's `docs/decisions.md`): a model carries its own `simStateAttributes` key; globals are declared there; the model's record overrides the metamodel's by name; a model record naming a metaclass is a record defect; a global declared in the metamodel stays the default of every model that does not declare its own. The plan is §5 of `docs/discovery/discovery_2026-09-29_sim_data_level.md` (read it with `git show sim-data-level:docs/discovery/discovery_2026-09-29_sim_data_level.md`), all of it:

1. `model/simulation/stateAttributesCodec.ts`: `mergeDeclarations(metamodel, model)`, pure; shadowing by name; the record defect.
2. `components/editor-v2/sim/simBridge.ts`: `startRun` decodes the model's key, drops it when `stateAttributes` is off, merges; `declarationDefectsOf` offsets and labels; `runSignature` covers the model's `sim*` keys.
3. `components/editor-v2/sim/SimulationPanel.tsx`: the model's raw key in `mapStateToProps` on the M1 face, a `Data…` entry, and the undeclared names of the Reset line leading to it.
4. `components/editor-v2/sim/SimDataModal.tsx` (new): the model's data dialog, globals only; Apply writes the model's state once (one undo step). Styles reused from `SimRolesModal.scss`; grep every new class name first.
5. `components/editor-v2/sim/SimRolesModal.tsx`: `Declarations` exported (additive) with a `globalsOnly` prop; the M2 `Global` option labelled as the default for models.
6. `components/editor-v2/sim/simRoleStatus.ts`: the M2 hint says where globals go.

Not touched: `netCompile.ts`, `netStep.ts`, `stcChecks.ts`, `guardContext.ts`, `problems/`, `VersionFixer.tsx`, the critical zone, the `.smv` generation. Exported interfaces: additive only.

The four demo scenes, declaring in the metamodel as today, must reach the same readings: this is the fallback the demo script keeps until the model-tab steps are re-measured.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, SCSS and naming rules), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, R-SIM-5, R-SIM-19, R-SIM-52, R-SIM-67, R-SIM-88, R-SIM-90, R-SIM-94, and the discovery end to end.
2. Baseline: typecheck count, vitest of `src/model/simulation` and `src/components/editor-v2/sim`.
3. Tests first (red before, green after): merge and shadowing, the record defect, a metamodel global as default, the model key read at `startRun`, `runSignature` changing on a model-key edit, the S1/S2/S5 cases of the discovery; the dialog (globals only, one undo, Apply interrupts a run). Mutation bench: drop the M1 read, the shadow, the signature term.
4. Implement in the order above, one commit per layer, each green.
5. Gates: `npm run typecheck` (14, the known set), the two vitest folders green, the full vitest with its known reds unchanged (name them), `npm run build`, `check:docs`, `check:addonly`.
6. A lane probe on port 3040 (`lane-run probe`, never 3001), light theme only: the ESM scene declared on the model tab instead of the metamodel (`coins`, `paid` as in §2.3 of the demo script) reaches the same run table and final reading (10 steps, Halted, coins would be 4); the Flow B scene the same with `count` (6 steps, Terminated). Record interactions and keystrokes of the new declaration steps, as the demo script does. Crops at `sips -Z 600` of the `Data…` entry and the dialog under `docs/discovery/harness/_tmp_datalevel_*.png` (gitignored).
7. Commits as above, then one docs commit with the log entry in `docs/log-inbox/simulation.md`, this prompt's Status, and the measured model-tab steps appended to the discovery report as §8 (do not edit the demo script: a docs lane does that). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the counts, the probe readings and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-94, R-SIM-67; the discovery of P-2026-09-29-0011 (§0, §5, §6); `docs/demo/models_2026_simulator_demo.md` §2.3, §2.4.
