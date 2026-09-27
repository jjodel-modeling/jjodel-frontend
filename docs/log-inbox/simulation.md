# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---

## 2026-09-27 — feat: declared state attributes and action keys, lane C1 (P-2026-09-26-2340)
**Prompt**: `claude_2026-09-26_2340_fase2_sim_state_declarations_c1.md`, Phase 2 of lane C1 on `simulation-engine` in `~/jjodel-sim`, full lane, bound by R-SIM-67..72 (`320d4afcf`); Phase 1 report `06d911dd9`. Declarations in `simStateAttributes` (codec, per-record defects), the three action keys in `NetStc` and the step through a table built at Reset, declaration and action defects at Reset with the transition still a candidate, the Data group of the panel with the declarations table.
**Files touched**: code `3ec3405d5`: `frontend/src/model/simulation/stateAttributesCodec.ts` (new), `roleCatalog.ts`, `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `actionEvaluator.ts`, `simProfiles.ts`, `components/editor-v2/sim/simBridge.ts`, tests `stateAttributesCodec.test.ts` (new), `netCompile.test.ts`, `netStep.test.ts`, `actionEvaluator.test.ts`, `roleCatalog.test.ts`, `simProfiles.test.ts`, `sim/__tests__/simBridge.test.ts`; code `f507d166d`: `simRoleStatus.ts`, `SimulationPanel.tsx`, `simulation-panel.scss`; code `b62141aba`: `simulation-panel.scss`. Docs, this commit: this entry, the Status of the two prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `b62141aba`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4926 passed (4884 + 42, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: 30 tests and the codec file at collection. Mutation bench 12/12 killed.
**Out-of-scope changes**: yes — 18 code paths, above the Rule 19 five, listed before the first edit. Outside DOVE: `roleCatalog.test.ts` (the assertions that pinned the unwired keys, R-SIM-52, declared) and `simProfiles.ts` with `simProfiles.test.ts` (Flowchart / Activity row + `stateAttributes`, ratified at the question stop as an R-SIM-68 amendment of the R-SIM-54 table); `b62141aba` is a third code commit.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 6/6 + Alfonso
**Notes**: Baseline vitest 4884, not 4837: the trunk merge 17a3d308c added tests. Question stop: R-SIM-68 made Flowchart / Activity fail validateProfile; answer A ratified. b62141aba fixes the table's 36px text cells (global input rule), found in the session's run. Step 3 needs the entry blank and the second action blanked: a shorter array does not truncate the slot. set_state to undefined via the panel select removed the key: no ticket. Halt lines drop the action text for action-defect too.
**Prompt document name**: 2026-09-26 23:40
**Ticket** (priority low, opened here). The console error `failed to get project {project: null}` at load is still there, one per run on 3002 (noted by the B2 entry and report §7.5). Not investigated.
**Ticket** (priority medium, opened here). The checker gap of report risk 5 stays open: `node.[x]` in a guard is reported only at Reset (`compileDefects`), never in the problems registry, and actions get no contextual check there either.
**Ticket** (priority low, found by the chat's run of the checklist). Keyboard select-all inside the declarations table appends instead of replacing the text of the cell. Not reproduced by the session.

## 2026-09-27 — feat: derived state attributes, eager DEFINE, lane C2 (P-2026-09-27-0200)
**Prompt**: `claude_2026-09-27_0200_fase2_sim_derived_attributes.md`, Phase 2 of lane C2 on `sim-derived` in `~/jjodel-icons`, full lane, bound by R-SIM-73..76 (`0a8ad4270`); Phase 1 report `655706bab`. Derived attributes as `equation` records, evaluated eagerly into `SimState.derived` at Reset and after every fired step by an optional `DerivedOracle`; the declarations table offers «stored | derived».
**Files touched**: code `5060657c5`: `frontend/src/model/simulation/stateAttributesCodec.ts`, `netTypes.ts`, `derivedEvaluator.ts` (new), `netCompile.ts`, `netStep.ts`, `components/editor-v2/sim/simBridge.ts`, `simRunState.ts`, tests `stateAttributesCodec.test.ts`, `netCompile.test.ts`, `netStep.test.ts`, `derivedEvaluator.test.ts` (new), `actionEvaluator.test.ts`, `sim/__tests__/simBridge.test.ts`; code `53c24b1fc`: `SimulationPanel.tsx`, `simulation-panel.scss`. Docs, this commit: this entry, the Status of the two prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `53c24b1fc`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4971 passed (4931 + 40, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: 24 tests and the evaluator file at collection. Mutation bench 11/11 killed.
**Out-of-scope changes**: yes — 15 code paths, above the Rule 19 five, listed before the first edit. Outside DOVE: `actionEvaluator.test.ts`, one line of `handNet` skipping a declaration with no initial, ratified at the question stop (RC-21).
**Layer Impact Report**: not-required
**Smoke visivo**: passato 2026-09-27 (chat, unattended: probe re-run on 3005, 5/5; Alfonso in the morning digest)
**Notes**: Probe (4): `cnet.[total] := 5` does not resolve (a model name is no JjEL root): no defect at Reset, then an action-defect halt; `model.[total] := 5` gives read-only. Out of domain at Reset keeps the value (report decision 5, where R-SIM-73 reads «valore assente»). A presentation failure after a step leaves the value out and is shown nowhere. Rows of three lines, 88px, stored and derived alike (R-SIM-76, RC-26 digest).
**Prompt document name**: 2026-09-27 02:00
**Ticket** (priority low, opened here, R-SIM-74). The dependency graph is by name, so a well-founded recursion on containment (`total := own + sum(children.[total])`) is a self-loop and a cycle defect; nuXmv would accept it. Refinement by (metaclass, name) or by element deferred.
**Ticket** (priority medium, opened here, R-SIM-76). `simStateOutput` and `simTransitionOutput` still have no reader: the outputs lane after C2.
**Ticket** (priority low, opened here, report risk 5). A derived attribute that failed at Reset is absent, and a reader says «'total' is not a state attribute of cnet»: true of the value, misleading about the declaration. Not done in this lane.
**Ticket** (priority low, seen in this lane's dark screenshots). Every select of the declarations table shows a doubled chevron with `data-theme="dark"`, the C1 selects as the new one. Not investigated.
**Ticket** (priority medium, ruled at the GO). R-SIM-73 wording (value absent at Reset on out-of-domain) differs from the implementation (value kept, defect shown): align the row text; RC-26 for Alfonso.
**Ticket** (priority low, ruled at the GO). A failed presentation equation is not surfaced; consider a line in «Last step» title.

## 2026-09-27 — feat: simulation profiles in the panel, M3 (P-2026-09-27-0225)
**Prompt**: `claude_2026-09-27_0225_fase2_sim_profiles_panel_m3.md`, Phase 2 of the profiles panel lane on `sim-profiles` in `~/jjodel-gate`, full lane, bound by R-SIM-77..79 (`5a9727e01`); Phase 1 report `1dddb15ae`. Option M3: a pure binder over a metamodel sketch, the summary and the Apply patch, then the Profile row with its four presets, Apply, «Configure…» folding the groups, and a `max-height` with scroll on the panel body.
**Files touched**: code `48ab676df`: `frontend/src/model/simulation/profileBinder.ts` (new), `components/editor-v2/sim/metamodelSketch.ts` (new), `sim/simRoleStatus.ts`, tests `profileBinder.test.ts` (new), `metamodelSketch.test.ts` (new), `simRoleStatus.test.ts`; code `d1d1bba2b`: `sim/SimulationPanel.tsx`, `sim/simulation-panel.scss`; docs (this closure): `docs/log-inbox/simulation.md`, the Status lines of `claude_2026-09-27_0225_fase2_sim_profiles_panel_m3.md` and `claude_2026-09-27_0150_prompt_sim_profiles_panel_discovery.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. At `927648820`: `npm run typecheck` exit 2, the 14 of §17; `npx vitest run` 4931 passed, the 9 known files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. On `48ab676df` and on `d1d1bba2b`: the same 14; 4970 passed (4931 + 39, stated before the run), the same 9 files; build exit 0, 51 lines; 4/4; PASS. Red first: the two new modules at collection, 15 simRoleStatus tests. Mutation bench 6/6 killed.
**Out-of-scope changes**: no — eight files, all in DOVE, above the Rule 19 five, listed before the first edit; no critical-zone file.
**Layer Impact Report**: not-required
**Smoke visivo**: passato 2026-09-27 (chat, unattended: probe re-run on 3006, items 1-8; Alfonso in the morning digest)
**Notes**: Probe on 3006 (this tree): M1 Step top 879 and 854.5 after Reset, identical before and after; M2 all groups open, top -55 before, 67 after at 1000 and at 900 high, the body scrolls; folded after Apply, top 793.5. Apply of State machine on the turnstile: 6 keys plus simProfile, undoable 0 to 1, one Control+z empties the bag. Console errors 13, the baseline kinds. The mutant table is in the body of 48ab676df; the probes stay as frontend/scripts/smoke/_tmp_p0225_*.
**Prompt document name**: 2026-09-27 02:25

**Decisions taken in the lane** (accepted at the GO of 2026-09-27, listed for the digest):
- two primitive props, `profileBagSig` and `sketchSig`, instead of the report's `profileRaw`: the role signature does not carry `simActivityFinal` and the other provisional keys;
- the sketch records aggregations, so the binder's plain references are the panel's reference list;
- a class role binds only a concrete class, the selects list no other; an abstract match is `none` with its reason;
- Terminal never matches a class named like «ActivityFinal», which is its own role;
- among Petri place, transition and arc candidates the most general wins, a subclass is not a rival;
- the default fold of the groups follows the stored profile's verdict on the current bag, not the Apply preview;
- the Profile label is 48 px in its row, so «Extended state machine» fits beside Apply.

**Ticket** (priority medium, opened here). The modal lane, after MODELS (report §4 «What the modal lane adds»): the modal shell with «Configure…» pointed at it; the compatibility check that produces `BindingVerdict`, and so «with warnings»; binding dropdowns with compatible candidates only; user profiles, «Save as…» and the modified state; the Step 1 cards of the design input; the inert SMV placeholder; the resolver that makes the bridge skip `off` keys (D4).
**Ticket** (priority medium, owed to the modal lane). `validateProfile` passes a user profile with Initial `off` and Initial marking derived from Initial, which is then not checkable on a complete bag (report §6.2). Unreachable with system presets only; fixed with a new `ProfileDefectCode` literal (Rule 11, additive) in the lane that brings user profiles.
**Ticket** (priority low, deferred by R-SIM-78). «Clear bindings» is not built: `set_state` with `undefined` leaves the key in the raw bag (`06d911dd9` §7.6), so the action needs that first.
**Ticket** (priority low, opened here). Undo after Apply was measured with Control+z in headless Chromium only; Cmd+Z on the Mac is untested.
**Ticket** (priority low, opened here). A Flowchart Apply can write `simActivityFinal` (a subclass of Node named like ActivityFinal), which has no select in the groups (R-SIM-52): the user cannot change or clear it in the panel, and nothing reads it yet.
**Ticket** (priority low, opened here). With a set key kept, e.g. «Kept: Node (TOther).», the other proposals come from the binder's own Node, not the kept one: the summary names the kept key but does not reconcile the two.
**Ticket** (priority high, for Alfonso, RC-26, report §8). A1: M3 is built (inline row, summary, «Configure…» folding the groups; the modal waits for its lane). A2: the select lists four presets, DFA, NFA, Moore and Mealy hidden until R-SIM-50/51. A3: R-SIM-54 not amended, so the demo net shows «Set but off: Guard.» under Petri net. A4: the demo metamodels need Initial and Final as classes; a boolean flag is `none` with its reason.

## 2026-09-27 — fix: Guard is edit in the Petri preset, R-SIM-54 and R-SIM-73 amended (P-2026-09-27-0935)
**Prompt**: `claude_2026-09-27_0935_prompt_ratifications_petri_guard.md`, lane fast on `alfonso-frontend-jjtl` in `~/jjodel-release`. Alfonso's morning ratifications of the night digest: point 3 (A3), Guard `edit` in the Petri preset; point 7, R-SIM-73 text aligned to the implementation; the digest's hand-written section.
**Files touched**: code `7455d0075`: `frontend/src/model/simulation/simProfiles.ts` (the petri row gains `'guard'`), tests `simProfiles.test.ts`, `profileBinder.test.ts`, `components/editor-v2/sim/__tests__/simRoleStatus.test.ts`. Docs, this commit: `docs/decisions.md` (one **Emendata** sentence in R-SIM-54 and in R-SIM-73), `docs/digest/2026-09-27.md`, this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 18:05 (`claude_2026-09-25_1805_prompt_sim_role_catalog_profiles.md`: its Petri row followed R-SIM-54, Guard off, amended today)
**Causa**: (f)
**Regressions**: no. On `7455d0075`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest `src/model/simulation src/components/editor-v2/sim` 502 passed (501 + 1), 18 files; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: 2 in `simProfiles.test.ts`. Mutation bench 2/2 killed (Guard dropped from the row: 6 tests; the edit filter of `proposalsOf`: 1).
**Out-of-scope changes**: yes — eight files, above the Rule 19 five, all named by the prompt. Outside the named assertions: `simRoleStatus.test.ts` «writes only edit roles» (Guard replaced by Action, still off in Petri), `profileBinder.test.ts` Petri 3b (guard `-`, none 2) and C1 (seven bound, Guard `PTrans.guard`): all three pinned the pre-amendment preset and went red.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Second Corregge: R-SIM-73 text vs `5060657c5`, prompt 2026-09-27 02:00, cause (a). The digest header reads `93e62abbb plus uncommitted edits` and the line refs of the 2026-09-27 rows move by one or two: the generator names the register's last commit, which cannot be the commit that carries the register edit (`registerSource`, docs-digest.ts). One docs commit, not the inbox alone, as the prompt's DOVE asks.
**Prompt document name**: 2026-09-27 09:35

## 2026-09-27 — fix: event labels fall back to the instance name, R1 (P-2026-09-27-1105)
**Prompt**: `claude_2026-09-27_1105_prompt_sim_r1_event_labels.md`, lane fast on `sim-r1-labels` in `~/jjodel-icons`, bound by R-SIM-80 (G1 of `discovery_2026-09-27_sim_demo_readiness.md`, decision A). `objectLabel` falls back to `lookup[id].name`, trimmed, before `shortId`, so the SM demo's event buttons and «Last step» read `coin`, not `…_136`.
**Files touched**: code `cda1fdb4e`: `frontend/src/model/simulation/objectSlots.ts`, tests `frontend/src/model/simulation/__tests__/events.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `cda1fdb4e`: `npm run typecheck` exit 2, the 14 of §17, set identical to the baseline; `npx vitest run src/model/simulation src/components/editor-v2/sim` 503 passed (502 + 1, stated before the run), 18 files; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: `expected '…_136' to be 'coin'`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: probe SM re-run, events read by name; no visual change beyond the labels
**Notes**: Probe on 3008, copies `_tmp_r1_*` of the ~/jjodel-sim `_tmp_demo_*` files, kept gitignored: M1 open `"events":["coin(off)","push(off)","stop(off)"]`, ten presses by label, Terminated {off: 1}, Step top 798.5, one known console error. Also changed: a blank `name` slot now falls to the instance name, not the short id. Full vitest 5100 passed, the 9 known files red at import. Mutation bench 3/3 killed.
**Prompt document name**: 2026-09-27 11:05

## 2026-09-27 — feat: Apply completes the natural shapes, lane R2 (P-2026-09-27-1110)
**Prompt**: `claude_2026-09-27_1110_prompt_sim_r2_apply_natural_shapes.md`, lane R2 on `sim-r2-apply` in `~/jjodel-gate`, fast lane, bound by R-SIM-81 (decisions B and C of the demo readiness report). Apply proposes `simBound` from the largest initial marking on the M1 models (G2); Node and Transition bind an abstract class in control flow (G5); a summary line with an «Add attribute» button when an action role is bound and nothing is declared (G9).
**Files touched**: code `86401f845`: `frontend/src/model/simulation/profileBinder.ts`, `components/editor-v2/sim/modelMarkings.ts` (new), `sim/simRoleStatus.ts`, `sim/SimulationPanel.tsx`, `sim/simulation-panel.scss`, tests `profileBinder.test.ts`, `sim/__tests__/modelMarkings.test.ts` (new), `sim/__tests__/simRoleStatus.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `39af28387`: vitest sim dirs 502 passed, 18 files; typecheck 14. On `86401f845`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest sim dirs 522 passed (502 + 20), 19 files; full vitest 5119 passed, the 9 known files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: 2 binder tests, 2 files at collection. Mutation bench 9/9 killed.
**Out-of-scope changes**: no — eight code files, all in DOVE, above the Rule 19 five, listed before the first edit; no engine file, no critical-zone file.
**Layer Impact Report**: not-required
**Smoke visivo**: probes re-run, three readings as above (on 3009, readings in the body of `86401f845`)
**Notes**: flowB builds ActivityNode concrete, so the abstract reading was taken on flowA (report §4.2 A): «Checkable» where it read «Missing: Node.»; flowB stays Checkable and Terminated. The ESM probe copy gained one step, the hint button in place of Configure…. Under k = 2 the Petri run halts unsafe at step 2 (p2 would hold 4): the proposal clears the Reset defect, the demo net still wants k = 4. concrete()'s refusing branch has no caller now. Port 3009, 3007 left to R1.
**Prompt document name**: 2026-09-27 11:10
**Ticket** (priority medium, opened here, RC-26 digest). The Bound proposal is the largest initial marking, a lower bound: on the demo net the ×2 arc puts 4 tokens on `p2`, so with k = 2 run A halts `unsafe` at step 2. The demo script sets Bound 4 by hand after Apply, or the proposal needs a reachability bound (after MODELS).
**Ticket** (priority low, opened here). The declarations hint also shows when `simStateAttributes` is present but unreadable (no rows); the table's own «not readable» line is then the one that says why.

## 2026-09-27 — feat: the M1 face for the audience, lane R3 (P-2026-09-27-1145)
**Prompt**: `claude_2026-09-27_1145_prompt_sim_r3_m1_face.md`, lane R3 on `sim-r3-face` in `~/jjodel-gate`, full lane, bound by R-SIM-82 (decisions D and F of the demo readiness report). The marking and σ line of the M1 face for the run's lifetime (G3), the choice list above the buttons (G8), no `JjelEvaluationError:` in an action-defect halt (G10), `∅` for an empty side of a transition (G11).
**Files touched**: code `766b9643c`: `frontend/src/components/editor-v2/sim/simBridge.ts` (`markingLine` new, `haltSource`, `arcsText`), `sim/SimulationPanel.tsx`, `sim/simulation-panel.scss`, tests `sim/__tests__/simBridge.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `b9528c991`: vitest sim dirs 523 passed, 19 files; typecheck 14. On `766b9643c`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest sim dirs 531 passed (523 + 8), 19 files; full vitest 5163 passed, the 9 known files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: 8 tests. Mutation bench 6/6 killed.
**Out-of-scope changes**: no — six files, all in DOVE, above the Rule 19 five, listed before the first edit; no engine file, no critical-zone file.
**Layer Impact Report**: not-required
**Smoke visivo**: probes re-run, four readings as above (on 3010, readings in the body of `766b9643c`); visual GO by the chat pending
**Notes**: A global sorts first (no element name in the line). The prompt's exact string holds two globals, so the element attribute has its own test. `derivedText` is not reused: it lists presentation and names the model, and no other function was to be touched. Title = line. The derived case keeps its inline replace: it does not read `haltSource`. Probes `_tmp_r3_*` kept gitignored; shots in `~/.jjodel-lanes/shots_r3/`.
**Prompt document name**: 2026-09-27 11:45
**Ticket** (priority low, seen in this lane's screenshot `petri_r3_choice_open_2.png`). The choice list title is uppercased by `text-transform`, so «Choose a transition (ε)» reads «CHOOSE A TRANSITION (Ε)», a capital epsilon that looks like E. Before R3 too; not changed here.
