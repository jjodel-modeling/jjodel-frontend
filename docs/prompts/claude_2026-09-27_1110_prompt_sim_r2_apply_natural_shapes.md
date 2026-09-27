# Prompt: R2, Apply completes the natural shapes: Bound from the models, abstract Node, the declarations hint (G2, G5, G9)

Prompt-ID: P-2026-09-27-1110
Chat: C-2026-09-26-1702
Lane: fast (binder, summary, panel; no engine file, no critical zone; probe re-runs replace the visual check)
Status: da eseguire

Worktree: `~/jjodel-gate`, branch `sim-r2-apply` (cut by the chat from `simulation-engine` at `54999f9ae`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `sim-r2-apply`, `git log -1` is the commit that adds this file (its parent `54999f9ae`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1110 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

R-SIM-81 (ratified 2026-09-27, decisions B and C of `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §10, read it whole in `docs/decisions.md`). Three completions of the Apply of M3, all measured in the report:

1. **Bound (G2).** With the Petri preset and `simBound` unset, Apply proposes `simBound` = the largest initial marking found on the M1 models of the metamodel, when it is above 1; a pure helper on the raw lookup (like `metamodelSketch.ts` reads the metamodel, this one reads the models: the slot of the attribute bound to Initial marking on every instance of the Place class). The proposal is listed before Apply like the others (R-SIM-77) and written by the same single assignment (R-SIM-78). With no model, or all markings at or below 1, nothing is proposed and the default 1 stays.
2. **Abstract Node and Transition (G5).** In the control-flow shape, Node and Transition may bind to an abstract class: `profileBinder.ts` accepts it (today `return b.status === 'bound' && ix.isAbstract(b.value)` at lines 203-204 turns it into `none`) and the Node and Transition selects of the panel list abstract classes too (`SimulationPanel.tsx:125` `if (!dClass.abstract)`), only for those two roles; every other class role keeps «concrete only». The engine already runs with an abstract Node (report §4.2, flowB).
3. **Declarations hint (G9).** When Action, Entry or Exit is bound and `simStateAttributes` is empty or absent, the summary shows one line, «Declare the state attributes the actions write: Add attribute», where «Add attribute» is a button that unfolds the Data group and focuses the table's add control, so the presenter does not hunt for it behind Configure….

## DOVE

- `frontend/src/model/simulation/profileBinder.ts`: the abstract allowance for `node` and `transition` in control-flow profiles (the shape is known from the profile), a reason text when an abstract class is chosen.
- `frontend/src/components/editor-v2/sim/metamodelSketch.ts` or a new sibling `modelMarkings.ts` (name check first): the pure marking reader; `simRoleStatus.ts`: `profileSummary` gains the Bound proposal and the declarations hint; the Apply patch builder writes `simBound` when proposed.
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the two selects list abstract classes for Node and Transition; the hint line with its button; `simulation-panel.scss` only if the line needs a rule (name check).
- Tests: `profileBinder.test.ts` (an abstract node bound in control flow; still `none` for Initial/Terminal abstract; Petri shape unchanged), `simRoleStatus.test.ts` (Bound proposed from markings 2 and 3 → 3; not proposed when all are 1; hint present with Action bound and no declarations, absent otherwise), the sketch/markings reader test (a fake lookup with two models).
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: every engine file, `simProfiles.ts`, `roleCatalog.ts`, `simBridge.ts`, the M1 face (R3), `docs/decisions.md`.

## COME

1. Baseline from `frontend/`: vitest on `src/model/simulation src/components/editor-v2/sim` count, 0 failed; typecheck 14.
2. Tests first, red, then the three pieces, minimal diffs, no rename. Rule 19: list the files and the change per file before the first edit.
3. Mutation bench, table in the commit body, a survivor is a stop: (1) Bound proposed when all markings are 1; (2) an abstract class accepted for Initial; (3) the hint shown with no action role bound; (4) `simBound` written although set by the user (overlap check skipped).
4. Re-run the readiness probes the report left in `~/jjodel-sim/frontend/scripts/smoke/` (`_tmp_demo_petri.ts`, `_tmp_demo_flow.ts` with `FLOW=flowB`, `_tmp_demo_esm.ts`, plus their common file; report §3 and §12): copy them read-only into this tree as `_tmp_r2_*`, adapt only the port and paths, dev server from this tree on a free port at or above 3007 (never 3001-3006), and read: Petri Apply proposes and writes `simBound` = 2 and Reset shows no `initial-over-bound` defect (report §4.1 read `1 defect: p1 (initial marking 2 …)`); flowB's abstract `ActivityNode` gives «Checkable» instead of «Missing: Node.»; ESM without declarations shows the hint line and the button unfolds Data with «Add attribute» in view (`inView: true` where the report read `false`). Stop the server.
5. Gates: typecheck 14; vitest green with the new count; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
6. Two commits, pathspec after `--`: code, subject `feat(sim): Apply proposes Bound, allows abstract Node, hints declarations (P-2026-09-27-1110)` or, if over 72 once the Prompt-ID is dropped, `feat(sim): Apply completes the natural shapes (P-2026-09-27-1110)`, body with G2/G5/G9, R-SIM-81, the mutant table, the probe readings, `Model:` trailer; docs, the inbox entry (`Smoke visivo: probes re-run, three readings as above`) and the Status flip `eseguito 2026-09-27 · lane sim-r2-apply · <code sha>`, subject `docs: close R2, Apply completes the natural shapes (P-2026-09-27-1110)`.
7. `Outcome: done`, shas on the line above. R3 follows on this branch or after its merge (both touch the panel).

Stop with `Outcome: question` and a `Recommended:` line if the marking reader needs an engine file, if the Apply cannot stay one assignment, or if the hint button cannot reach the add control without a panel refactor.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, an engine file, push, any other tree except the read-only copy of the `_tmp_demo_*` probes from `~/jjodel-sim`.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §4.1, §4.2, §4.4, §5 G2/G5/G9, §8 R2, §10 B/C; `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md` §3 (binder), §7 D1..D10.
- `docs/decisions.md` R-SIM-77, R-SIM-78, R-SIM-79, R-SIM-81; lane M3 (`48ab676df`, `d1d1bba2b`) for the shapes.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-25..30.
