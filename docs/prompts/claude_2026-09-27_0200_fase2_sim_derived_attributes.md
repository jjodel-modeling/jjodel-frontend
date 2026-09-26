# Prompt: Phase 2, lane C2 of the simulator: derived state attributes, eager (nuXmv DEFINE)

Prompt-ID: P-2026-09-27-0200
Chat: C-2026-09-26-1702
Lane: full (more than 5 files, additive exported interfaces, visual check; no critical zone)
Status: da eseguire

Worktree: `~/jjodel-icons`, branch `sim-derived`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-derived`, `git log -1` is the commit that adds this file (subject `docs: add Phase 2 of lane C2, derived state attributes (P-2026-09-27-0200)`), below it the R-SIM-73..76 rows commit, the merge of the trunk `ca9880700` and the discovery `655706bab`; `.claude/settings.json` has no `Bash(git commit*)` in `permissions.ask`; `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0200 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task: a background wait does not survive the end of a turn.

## COSA

Implement the derived state attributes as decided in R-SIM-73..76 (read them whole in `docs/decisions.md`; they adopt the eleven decisions of report §10 with three constraints from the RC-27 review: the graph forbids semantic → presentation edges, a presentation failure does not halt the semantics, and every σ built from outside recomputes `derived`). After this lane: a record may carry `equation` instead of `initial`; at Reset and after every fired step an optional `DerivedOracle` fills `SimState.derived` on the new σ in dependency order; guards and actions read a derived attribute like a stored one; a failing or out-of-domain equation is a declaration defect at Reset and a halt after a step; an action targeting a derived attribute is a `read-only` defect and halt; cycles, `event`, `node` in a semantic equation are declaration defects; the panel's table offers «stored | derived» per row with an equation cell, and no edit of the table drops `equation` any more.

## DOVE

Code commit 1, pure core and bridge:

- `frontend/src/model/simulation/stateAttributesCodec.ts`: `equation?` on the record, exclusivity with `initial` as a record defect, round-trip keeps `equation` (report §4.5 data loss closed).
- `frontend/src/model/simulation/netTypes.ts`: `StateAttributeDecl.initial?`, `equation?`; `SimState.derived?`; `HaltReason` kinds `derived` and `read-only`; `DeclarationDefectCode` new codes (parse, subset, event, cycle, exclusivity); `DerivedOracle` type; `step` gains the optional oracle parameter.
- `frontend/src/model/simulation/derivedEvaluator.ts` (new; name check first): compile of the equations (strict parse, subset check with `E-NODE` on semantic ones, `event` forbidden), the dependency graph by name with the semantic → presentation edge forbidden, the cycle check naming the cycle, the topological order, and `evaluateDerived(state, ...)` returning the fresh `derived` map or the failure (element, attribute, detail; a non-`SimValue` result is a failure).
- `frontend/src/model/simulation/netCompile.ts`: declaration defects of R-SIM-75 for derived records; `declared` marks a derived attribute read-only; the initial σ gets `derived` from the oracle at Reset (values absent on failure, with the defect).
- `frontend/src/model/simulation/netStep.ts`: `stateAccess.read` falls back to `derived`; after the parallel write, the oracle builds `derived` on σ′, never copied forward; halts `derived`, `domain`, `read-only` with σ unchanged; an assignment to a derived target refused (`read-only`) before the write.
- `frontend/src/components/editor-v2/sim/simBridge.ts`: the oracle installed at Reset when at least one derived attribute is declared (absent otherwise, as `NO_SIM_ACTIONS`); `compileDefects` gains the derived codes and `read-only` for actions; `haltMessage` for the two kinds; the derived values of the last step in the title of «Last step» after the assignments (`derived: cnet.total = 2`), R-SIM-62 wording.
- `frontend/src/components/editor-v2/sim/simRunState.ts` only if `SimRun` must carry `derived` for the panel (report §8 says it does).
- Tests: `stateAttributesCodec.test.ts`, `netCompile.test.ts`, `netStep.test.ts`, `derivedEvaluator.test.ts` (new), `simBridge.test.ts`.

Code commit 2, panel:

- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the per-row «stored | derived» select; for a derived row the equation cell replaces the initial cell (the domain stays for semantic ones); commit on blur or Enter, one string per edit; the row height fixed (no layout shift).
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: the equation cell; existing class names unchanged, new ones after a name check.

Ten files or more: Rule 19 applies, list them with their change before touching the first. Out of scope: `guardContext.ts` unless `toJjelStateAccess` must change (report §3 says it does not: stop with `Outcome: question` if it does), the `.smv` exporter, `simStateOutput`/`simTransitionOutput` (R-SIM-76), snapshots and trace, every critical-zone file, the profiles modules.

## COME

### Rulings for this lane

- **Fresh map (R-SIM-73).** `derived` is built on every σ′ from scratch; a test proves that a stale value cannot survive a step (mutant 2).
- **Order and edges (R-SIM-74).** Topological order by attribute name; an equation of a semantic attribute that reads a presentation attribute (stored or derived) is `E-NODE`; a cycle lists its members in the defect text.
- **Roots (R-SIM-75).** `self` the owner, the model root for a global, `model` allowed, `event` a defect, `node` allowed only in a presentation equation.
- **Failure is strict.** A derived attribute nobody reads is still evaluated and its failure halts the run: say so in the halt text (`Halted: derived 'total' of cnet failed: …`).
- **Texts.** Halt lines without the equation source, the source in the `title` (R-SIM-62); one line, clamped (R-SIM-63, R-SIM-66).

### Steps

1. Baseline on this commit: `npm run typecheck` (exit 2, the §17 set), `npx vitest run` (state the expected count from the trunk merge `24d8537fd`: 4931, plus what this branch added since; measure; 0 failed), `npm run build` (exit 0), `check:docs` 4/4, `check:scripts` as the baseline.
2. Tests first, red: codec round-trip with `equation`, exclusivity defects; the evaluator on `b2net` (`total := p1.[visits] + p2.[visits]` global, `busy := self.[visits] > 0` per place; a cycle `a := b + 1`, `b := a`; `event` in an equation; `node` in a semantic one; a semantic equation reading a presentation attribute; division by zero); `netStep` with the oracle: derived recomputed after a fired step, guard reading a derived value, action on a derived target halting `read-only`, out-of-domain derived halting `domain`, run with no derived unchanged (oracle absent); bridge: `compileDefects` texts, the «Last step» title, the halt texts.
3. Implement commit 1. Minimal diffs, no refactor, no rename.
4. Mutation bench, table in the commit body, a survivor is a stop: (1) the oracle runs before the parallel write; (2) `derived` copied forward from the previous σ; (3) the graph ignores one `StateAccess` edge; (4) a semantic → presentation edge allowed; (5) `null` accepted as a value; (6) a cycle reported as a parse error without its members; (7) an action on a derived target writes the value; (8) the oracle installed with no derived declared; (9) `event` accepted in an equation; (10) the accessor reads `derived` before `attrs` for a stored name.
5. Gates on commit 1 as step 1 plus the new tests; `git diff --stat` outside DOVE empty. Commit, pathspec after `--`, subject `feat(sim): derived state attributes, eager DEFINE evaluation (P-2026-09-27-0200)`, body with baseline, gates, mutant table, `Model:` trailer.
6. Implement commit 2, gates as step 5, subject `feat(sim): stored or derived rows in the declarations table (P-2026-09-27-0200)`.
7. **Browser probe, then hard stop (RC-23).** Dev server from this tree on a free port (never 3001, 3002, 3003 or any port another tree holds; check with `lsof`). Fixture: `frontend/scripts/smoke/_tmp_c_scenario.js` shape, then through the panel: declare `visits` (stored, Place, `0..3`, `0`) and `total` (derived, global, `p1.[visits] + p2.[visits]`, domain `0..6`), bind Action to `PTrans.actions` with `p2.[visits] := p2.[visits] + 1`; (1) the bag keeps `equation` after editing another cell; (2) Reset shows no defect, Step fires and the «Last step» title reads `assignments: p2.visits = 1` and `derived: cnet.total = 1`; (3) an equation `a := b + 1` plus `b := a` shows the cycle in the defects line at Reset; (4) an action `cnet.[total] := 5` shows `read-only` at Reset and halts on Step; (5) Step's top does not move across (2), (3), (4). Screenshots light and dark. Stop the server. `Outcome: hard-stop`: the chat runs its checklist and Alfonso's confirmation goes in the morning digest.
8. After the GO (a resume), one closure commit: entry in `docs/log-inbox/simulation.md` (`Smoke visivo:` as recorded), Status of this file and of the Phase 1 file `claude_2026-09-27_0140_prompt_sim_derived_attributes_discovery.md` flipped (`eseguito 2026-09-27 · lane sim-derived · <sha1>, <sha2>`, the Phase 1 one with `655706bab`), tickets: the containment recursion limit of R-SIM-74, the outputs lane of R-SIM-76, the accessor wording of report risk 5 if not done. `Outcome: done`. The merge toward `simulation-engine` and the trunk gets its own prompt.

Stop with `Outcome: question` and a `Recommended:` line if: `toJjelStateAccess` must change; `step`'s new parameter cannot stay optional; the table cannot keep a fixed row height with the equation cell; a reader of `StateAttributeDecl.initial` outside DOVE breaks when it becomes optional.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone edit, push, any tree or server you did not start, a background gate.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md` (`655706bab`): §3, §4, §5 E1, §6, §7, §8, §9.
- R-SIM-19, R-SIM-51, R-SIM-67..76 in `docs/decisions.md`; lane C1 (`3ec3405d5`, `f507d166d`, `b62141aba`) for the shapes.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-23, RC-25..30.
