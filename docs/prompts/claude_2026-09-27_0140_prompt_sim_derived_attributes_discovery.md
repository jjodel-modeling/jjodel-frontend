# Prompt: discovery, lane C2 of the simulator: derived state attributes (nuXmv DEFINE)

Prompt-ID: P-2026-09-27-0140
Chat: C-2026-09-26-1702
Lane: full (Phase 1 discovery, read-only)
Status: da eseguire

Worktree: `~/jjodel-icons`, branch `sim-derived` (from `simulation-engine` at `8b5871f29`, the closure of lane C1), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-derived`, `git log -1` is the commit that adds this file (subject `docs: add prompt P-2026-09-27-0140, derived attributes discovery`), its parent is `8b5871f29`, `git status` empty. `frontend/node_modules` is the P14 symlink to `~/jjodel/frontend/node_modules`, created by the chat. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0140 · session <id>]` and ends with an `Outcome:` line (P16).

**Phase 1 only: read-only.** No source file is edited, no dependency installed, no commit except the report (step 6). A dev server from this tree on a free port is allowed for measurements (3001, 3002 and 3003 belong to other trees: never touch them; check with `lsof` and pick a free one); probe scripts under `frontend/scripts/smoke/_tmp_c2_*` (gitignored), named in the report; stop the server at the end.

## COSA

Lane C1 (`3ec3405d5`, `f507d166d`, `b62141aba`) gave the STC stored state attributes (declared in `simStateAttributes`, assigned by actions, `VAR` in nuXmv). R-SIM-19 also asks for derived attributes: defined by a JjEL equation, read-only, never assigned (`DEFINE`), with a circularity check on their dependencies; R-SIM-72 fixed the record shape (exactly one of `initial` and `equation`, `initial` becomes optional in `StateAttributeDecl` with this lane) and R-SIM-51 makes the Moore and Mealy outputs derived attributes. Map what C1 left in place for them, where the equation is evaluated, and what it costs, so that the chat can ratify one design for Phase 2 without a second discovery.

## DOVE (read)

- `frontend/src/model/simulation/`: `stateAttributesCodec.ts` (the record, the `equation` field it already ignores per R-SIM-68), `netTypes.ts` (`StateAttributeDecl`, `SimState`, `SimStateAccess`, `CompiledNet.declared`, `HaltReason`), `netCompile.ts` (declaration defects of C1, the `declared` map, the initial σ), `netStep.ts` (where σ is read and written in a step, `inDomain`, the parallel write), `guardContext.ts` (`toJjelStateAccess`, the accessor's `read`, `marked`, `tokens`), `guardEvaluator.ts` and `actionEvaluator.ts` (compile of an expression, `checkGuardSubset`, `E-NODE`), `subsetChecker.ts`, `roleCatalog.ts` (`simStateOutput`, `simTransitionOutput`), and their tests.
- `frontend/src/components/editor-v2/sim/`: `simBridge.ts` (Reset: decode, `compileNet`, the action table; `compileDefects`; `lastStepText` and the assignments in the title), `SimulationPanel.tsx` (the declarations table: columns, the space and domain selects, the initial cell), `simulation-panel.scss`.
- `frontend/src/jjel/`: the parser entry points used by C1 (`parseExpressionStrict`), the AST node `StateAccess`, `stateReserved.ts`.
- `docs/decisions.md` R-SIM-17..19, R-SIM-39..46, R-SIM-51, R-SIM-67..72; `docs/spec/claude_spec_2026-09-13_computational_model.md` (state, actions, export); `docs/discovery/discovery_2026-09-26_sim_state_declarations.md` §5.1 (the C2 cost estimate); `docs/log-inbox/simulation.md` (the C1 entry and its tickets).

## COME

1. **What exists [R].** With file and line: how a stored attribute's value reaches a guard and an action (the accessor chain from `toJjelStateAccess` to `state.attrs`); where σ is materialised per step and whether anything is memoised per configuration; what the codec does with `equation` today; what the panel's table would need for an equation cell; how `simStateOutput`/`simTransitionOutput` are read today (R-SIM-51 says they are derived: say whether they go through the same path or a separate one).
2. **Two evaluation strategies, costed.** E1, eager: after each step (and at Reset) every derived attribute is evaluated once, in dependency order, on the new σ, and stored beside `attrs` in a read-only `derived` map of `SimState`; a guard reads it like a stored one. E2, lazy: evaluated on read through the accessor, memoised per σ. For each: files touched, exported interfaces changed (`SimState`, `SimStateAccess`, `StateAttributeDecl.initial` optional), what happens on a cycle, on a runtime error of an equation (a defect: at Reset when it folds, otherwise a halt like `action-defect`, or a defect value?), on a derived value outside its domain, and the cost per step for n derived attributes over m elements. Say which one matches nuXmv's `DEFINE` semantics exactly (a DEFINE is a pure function of the current state, never of the previous one) and recommend one.
3. **Dependency graph and cycles.** How the dependencies of an equation are read from its AST (`StateAccess` nodes: attribute names, and whether the element path can be resolved statically or only the name is safe); the graph keyed by attribute name (conservative) versus by (metaclass, name); the cycle defect at Reset; `self`, `model`, `event` in an equation (`event` makes a DEFINE depend on the input: say whether to forbid it, as nuXmv would need it as a separate input variable); `node` forbidden in a semantic equation (`E-NODE`), allowed in a presentation one.
4. **Record and panel.** The record with `equation` and `initial` exclusive (R-SIM-72): validation in the codec (a record with both, or neither, is a defect of that record); `StateAttributeDecl.initial` optional (Rule 11: name every reader that assumes it present); the table: an equation cell, and how the row shows which it is (a select «stored | derived», or the presence of the cell); an action assigning a derived attribute is a compile defect at Reset (`t1 action (assigns derived 'total')`) and a halt if it fires.
5. **Measure [M].** On the pure core with a probe: (a) a derived attribute over two stored ones on `b2net` (for example `total := p1.[visits] + p2.[visits]` on the model, or per place `busy := self.[visits] > 0`), evaluated by hand with the existing evaluator on σ after a step, to show the accessor chain works for a read-only value; (b) an equation with a cycle (`a := b + 1`, `b := a`) detected on the AST; (c) an equation that throws at runtime (`p9.[visits]` on a missing element) and what the evaluator returns. On the dev server: whether the C1 table survives a record carrying `equation` (it should, R-SIM-68) and what the row shows.
6. **Report, mandatory.** Save it as `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md` (objective, files read with full paths, findings [R]/[M], the two strategies, the graph, the record, risks, and the two RC-26 sections «Decisions taken (unattended)» with a recommendation per point and «Decisions awaiting Alfonso», items of the RC-26 list only). Commit it alone, pathspec after `--`, subject `docs: discovery of the derived state attributes (P-2026-09-27-0140)`, `Model:` trailer. No log entry and no Status flip in Phase 1 (P13).
7. **Hard stop.** Closing report opening with `[P-2026-09-27-0140 · session <id>]`: the report sha, the recommended strategy in two lines, the exported interfaces that change. Stop the dev server. Then `Outcome: hard-stop`.

Never: an edit to a source file, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- Lane C1: prompt `claude_2026-09-26_2340_fase2_sim_state_declarations_c1.md`, discovery `06d911dd9`, closure `8b5871f29`.
- R-SIM-19 (DEFINE, frame condition), R-SIM-51 (outputs as derived), R-SIM-72 (record shape).
- `docs/PROTOCOL.md` P13, P16; RC-25..30.
