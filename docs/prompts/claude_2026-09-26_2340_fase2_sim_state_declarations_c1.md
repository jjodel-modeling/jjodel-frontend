# Prompt: Phase 2, lane C1 of the simulator: stored state attributes and the action keys wired into the step

Prompt-ID: P-2026-09-26-2340
Chat: C-2026-09-26-1702
Lane: full (more than 5 files, two changed exported interfaces, visual check)
Status: eseguito 2026-09-27 · lane simulation · 3ec3405d5, f507d166d, b62141aba · verifica visiva passata 2026-09-27 (chat, 6/6, e Alfonso)

Worktree: `~/jjodel-sim`, branch `simulation-engine`, a fresh session started by `lane-run` (RC-20; the Phase 1 report `06d911dd9` is read from the repo). Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file (subject `docs: add Phase 2 of lane C1, state declarations and action keys (P-2026-09-26-2340)`), its parent is `17a3d308c` (the merge of the trunk with the bypass gates into `simulation-engine`, P-2026-09-26-2245), below which sit `320d4afcf` (R-SIM-67..72) and `06d911dd9`; `.claude/settings.json` pins `claude-opus-5-5`; `git status` empty apart from the untracked, gitignored `frontend/scripts/smoke/_tmp_*` files. Otherwise stop with `Outcome: blocked`.

## COSA

Implement lane C1 of the report `docs/discovery/discovery_2026-09-26_sim_state_declarations.md` as decided in R-SIM-67..72 (read them whole in `docs/decisions.md`; they answer the eighteen questions of report §9, the ones not restated there are adopted as recommended, and R-SIM-72 overrides question 17). After this lane: the M2 bag carries the declared state attributes under `simStateAttributes` (R-SIM-67, R-SIM-68); `simAction`, `simEntry`, `simExit` reach `NetStc` and the step through a table built at Reset (R-SIM-69); declaration and action defects appear in the defects line at Reset and the transition stays a candidate (R-SIM-70); the Data group of the panel edits the three action roles and the declarations, `simGuard` moves there (R-SIM-71). Derived attributes (`equation`) are C2: not here, and the codec must ignore an `equation` field rather than reject it (R-SIM-68).

## DOVE

Code commit 1, pure core and bridge:

- `frontend/src/model/simulation/stateAttributesCodec.ts` (new; name check first): `encodeStateAttributes(decls): string` with fixed field order and `{ "v": 1, "attrs": [...] }`; `decodeStateAttributes(raw: string | undefined): { decls: StateAttributeDecl[]; defects: DeclarationDefect[] }`, per record, unknown fields ignored, a non-JSON string or a missing `v`/`attrs` is one defect on the key, `undefined` is the empty set.
- `frontend/src/model/simulation/roleCatalog.ts`: `stateAttributes.key = 'simStateAttributes'`; `dependsOn: ['stateAttributes']` on `action`, `entry`, `exit` (R-SIM-68).
- `frontend/src/model/simulation/netTypes.ts`: `NetStc.action?`, `entry?`, `exit?`; `HaltReason` gains the kind for an undeclared target with `element` and `attr` (R-SIM-70); the widened `CompileDefect` literals if they live here (they live in `simBridge.ts` today: keep them where they are).
- `frontend/src/model/simulation/netCompile.ts`: the three pairs in `ROLE_KEYS`; declaration defects of R-SIM-71 (initial outside the domain or of the wrong type, semantic without domain, `min > max` or non-integer bounds, reserved name from `stateReserved.ts`, unknown metaclass, the same name in two spaces on one element, the same name twice on one element through a subclass); first-wins stays the effect after the defect.
- `frontend/src/model/simulation/netStep.ts`: the undeclared-target halt uses the new `HaltReason` kind (element and attribute, no id in `detail`).
- `frontend/src/model/simulation/actionEvaluator.ts`: static folding of a target that depends on neither σ nor `event` (report H4), reported to the caller; `E-NODE` on the right-hand side of a semantic assignment through `checkGuardSubset` (report §7.7).
- `frontend/src/components/editor-v2/sim/simBridge.ts`: decode of the key at Reset with `decls` passed to `compileNet`; the action table by site (`objectSlotValues` by role, in order, blanks skipped) and its oracle, `NO_SIM_ACTIONS` kept when no action role is bound (R-SIM-69); `compileDefects` gains declaration and action defects, `CompileDefect.role` and `reason` widened (R-SIM-70, Rule 11 authorized); `defectsLine`/`defectsTitle` wording true for all three sources; `haltMessage` for the new kind names the element (`candidateLabel`-style name, never the pointer), the action source only in the title; `lastStepText` unchanged except the title of «Last step», which lists the assignments of the step (R-SIM-71).
- Tests: `frontend/src/model/simulation/__tests__/stateAttributesCodec.test.ts` (new), `netCompile.test.ts`, `netStep.test.ts`, `actionEvaluator.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` (the assertion of `:428-429` rewritten).

Code commit 2, panel:

- `frontend/src/components/editor-v2/sim/simRoleStatus.ts`: the three action keys in `ROLE_SPECS` and the declarations key.
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the Data group as the fifth inline group (Guard moved from General; Action, Entry, Exit as feature pointers with the option lists filtered by type, `Expression`/EString for Guard and `Action`/EString for the other three; the declarations table: name, metaclass or global, space, domain kind with its fields, initial as a JjEL literal; commit on blur or Enter, one write of the whole string, `'[]'` for the empty set, never `undefined`); the raw string as its own prop from `mapStateToProps`, parsed in a `useMemo` on that string (report risk 1).
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: the table, fixed row height, no layout shift; existing class names unchanged, new ones after a name check.

Twelve files and more: Rule 19 applies, list them with their change before touching the first. Out of scope: `guardContext.ts` (C2), `simProfiles.ts`, `profileCodec.ts` (the modal is its own lane), `VersionFixer.tsx`, `DV.tsx`, the IR view side of R-SIM-18, `EcoreService.ts`, the trace, the `.smv` exporter, the `set_state`-to-`undefined` observation (ticket only).

## COME

### Rulings for this lane

- **Formats (R-SIM-67, R-SIM-68).** The stored string is `{"v":1,"attrs":[...]}`; each record `{name, metaclass, space, domain, initial}` in that order, `domain` as `netTypes.ts` defines it or `null`, `initial` as the JjEL literal text; the decoder accepts and drops an `equation` field. A malformed record is a `declaration` defect carrying the record index and the name if readable.
- **Sites (R-SIM-69).** The action table is keyed by `actionSiteKey`; control flow: exit of the source, the edge, entry of the target (a fused fork/join: its edges); Petri: exit of the preset, the transition, entry of the postset; arcs are never sites.
- **Defects at Reset (R-SIM-70).** Sources `guard`, `declaration`, `action`; reasons extended with the ones the report §4.5 lists; the transition stays a candidate and halts if fired; wording like `3 defects: t1 action (undeclared 'count' on p1); visits (initial 7 outside 0..3); key (not JSON)`. Static detection only for targets that fold without σ and `event`; the run-time halts stay (report H4).
- **Texts.** Halt line `Halted: the transition action of t1 failed: 'count' is not declared on p1.`, the source in the `title` (R-SIM-62); «Last step» title `assignments: p2.visits = 1, M.f = true` after the label. One line, clamped, no height change (R-SIM-63, R-SIM-66).
- **Panel.** No Basic/Advanced mode. The group order: General, Control flow, Petri net, Events, Data, Output when present. The table commits one string per edit; no write per keystroke.

### Steps

1. Baseline on this commit: `npm run typecheck` (exit 2, the §17 set, 14 at the last closure), `npx vitest run` (4837 passed at the last merge gate, 0 failed, the same red-at-import files), `npm run build` (exit 0), `check:docs` 4/4, `check:scripts` as the baseline. State the expected numbers, then record the measured ones.
2. Tests first, red where the feature is missing: codec round-trip with fixed field order, per-record defects, key defect, `equation` ignored, `undefined` as empty; the seven declaration defects of R-SIM-71 on `compileNet`, first-wins kept; `NetStc` from a bag with the three keys; the bridge table from `startRun` on a b2net-shaped fixture with `Action [0..*]` slots (order, blanks, the Petri sites); the step outcomes of report §6 through `startRun` (undeclared with the element name in the line, double target across sites, domain, locality, declared-only fired with the assignments in the title); a compile-time action defect keeps the transition a candidate; `NO_SIM_ACTIONS` still installed when no action role is bound; `E-NODE` on a semantic right-hand side at Reset.
3. Implement commit 1: codec, catalog, types, compiler, step, evaluator, bridge. Minimal diffs; no refactor of adjacent code; no rename.
4. Mutation bench on commit 1, table in the commit body, a survivor is a stop:
   1. The decoder returns `[]` on a non-JSON string.
   2. The decoder rejects a record with an unknown field.
   3. Field order in the encoder depends on the input object.
   4. An action defect at Reset removes the transition from the candidates.
   5. The undeclared halt prints the pointer id.
   6. `compileNet` accepts `initial` 7 in `0..3`.
   7. The same name semantic on the places and presentation on the transition compiles without a defect.
   8. The action table reads the slot's first value only.
   9. Arcs become action sites in Petri.
   10. `NO_SIM_ACTIONS` is replaced even when no action role is bound.
   11. A semantic assignment reading `node.[x]` compiles without a defect.
   12. `runSignature` ignores `simStateAttributes`.
5. Gates on commit 1: typecheck as the baseline, vitest the baseline plus the new tests (state the delta first), 0 failed; build exit 0; `check:docs` 4/4; `check:scripts` as the baseline. `git diff --stat` outside DOVE empty. Commit, pathspec after `--`, subject `feat(sim): declared state attributes and action keys in the step (P-2026-09-26-2340)` (within §6.2 without the suffix), body with baseline, gates, mutant table, `Model:` trailer.
6. Implement commit 2: `simRoleStatus.ts`, panel, SCSS. Gates as in step 5. Subject `feat(sim): Data group, action roles and state declarations in the panel (P-2026-09-26-2340)`.
7. **Visual check, hard stop (RC-23).** Dev server on 3002 from this tree (port free first; your scratch Vite config is allowed, not committed). Build the fixture with `_tmp_c_scenario.js` (the two `Action [0..*]` features, `cnet`). Steps, each with a DOM or console reading: (1) metamodel: the Data group shows Guard, Action, Entry, Exit and the declarations table; bind `PTrans.actions` to Action and `Place.entry` to Entry; declare `visits` (Place, semantic, `0..3`, `0`) and `color` (PTrans, presentation, `'grey'`); the raw bag holds `simStateAttributes` as a string with `"v":1`; (2) model `cnet`, Reset with `t1.actions = [p2.[visits] := p2.[visits] + 1, p1.[count] := 1]`: the defects line names `count` on `p1`, Step is still enabled, pressing it halts with the element's name and no pointer in the line; (3) remove the second action, Reset, Step: fired, the «Last step» title lists `p2.visits = 1`; (4) `p2.entry = p2.[visits] := 1` kept: Reset, Step halts with `visits of p2 is assigned twice in one step`; (5) declare `visits` with initial `7`: the defects line says it at Reset; (6) the panel's height does not change between (2), (3) and (4): measure the Step button's `getBoundingClientRect().top` in each. Take screenshots in light and dark. Then stop with `Outcome: hard-stop`: the chat runs the checklist in the built-in browser and Alfonso confirms (until 2026-10-03, RC-23).
8. After the GO, one closure commit (P13, RC-17): the entry in `docs/log-inbox/simulation.md` (Layer Impact Report: not required, no D/L or sync layer; `Smoke visivo:` as recorded), the Status of this file and of the Phase 1 file `claude_2026-09-26_1705_prompt_sim_state_declarations_discovery.md` flipped (`eseguito 2026-09-26 · lane simulation · <sha1>, <sha2>`, the Phase 1 one with `06d911dd9`). Tickets in the entry: the `set_state`-to-`undefined` observation of report §7.6, verified once through the panel's select before writing it; the `failed to get project {project: null}` console error if it is still there; the checker gap of report risk 5 (`node.[x]` in a guard not in the problems registry) if not closed here.
9. Closing report opening with `[P-2026-09-26-2340 · session <id>]`: the three shas, gates, mutants, deviations, then `Outcome: done`. Stop the dev server. The merge toward the trunk gets its own prompt from chat.

Stop and ask (`Outcome: question`, with a `Recommended:` line) if: a ruling needs `guardContext.ts`; the declarations table cannot keep a fixed height; `HaltReason` cannot gain the kind without touching a reader outside DOVE; the option lists cannot be filtered by type without changing `options.attributes` for the other groups.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of the `node_modules` symlink, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-09-26_sim_state_declarations.md` (`06d911dd9`), §2, §4, §5.2, §6, §7, §8.
- R-SIM-67..72 (this lane), R-SIM-17..19, R-SIM-39, R-SIM-52, R-SIM-57..66 in `docs/decisions.md`.
- Lane B2 (`81373fab0`), lane 1315 (`fa56c14de`), lane 1535 (`b76d75cc9`, `f58456c63`) for the bridge and panel shapes.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-23, RC-25..28.
