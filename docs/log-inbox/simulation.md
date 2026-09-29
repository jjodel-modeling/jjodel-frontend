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

## 2026-09-27 — discovery: demo readiness, second measurement on the trunk with R1-R3 (P-2026-09-27-1235)
**Prompt**: `claude_2026-09-27_1235_prompt_discovery_sim_demo_readiness_2.md`, read-only discovery on `simulation-engine` in `~/jjodel-sim` at `e1cefcfbc`: the first readiness report's probes and scenarios (`567dc25da`), readers extended to R1, R2 and R3, run on the trunk with the three lanes merged; the second readiness report with G1..G11 re-measured.
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` (new), this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_demo2_*` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: no source file changed. Probes on 3011, exit 0 each: petri (2 runs), flowA, flowB, flowC, sm, esm (2 runs), undo2, undo; one known console error per run. `check:docs` 4/4.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — screenshots in `~/.jjodel-lanes/shots_readiness2/` for the chat's and Alfonso's check
**Notes**: Gaps: 9 measured closed (G1, G2, G3 panel side, G4, G5, G8, G9, G10, G11), 2 measured open (G6, G7, after MODELS by decision E), 3 new (G12 Bound a lower bound, G13 header paints U+0395, G14 profile select clips), none demo-critical: no lane needed before the freeze (report §8). Readers `choiceSectionPaint` and `selectFit` added beyond the prompt's list to measure G13 and G14, hence the second Petri and ESM runs (report §9).
**Prompt document name**: 2026-09-27 12:35
**Ticket** (priority low, opened here, G14 of the report). The Profile select clips «Extended state machine» to «Extended state machin» at 1600×1000, on `ee1b7bfc8` as on `e1cefcfbc`; the M3 lane recorded that it fits. A canvas measure says fit (125 against a 137 px content box) because it does not count the native arrow.

## 2026-09-27 — fix: the ε of the choice header, the Profile select fits its options (P-2026-09-27-1310)
**Prompt**: `claude_2026-09-27_1310_prompt_sim_polish_g13_g14.md`, lane fast on `sim-polish-g13-g14` in `~/jjodel-gate`. G13 and G14 of `discovery_2026-09-27_sim_demo_readiness_2.md` §5: the choice header's input in its own span out of the uppercase, and the Profile select wide enough for every option of `PANEL_PROFILES` at 1600×1000 and 1280×800, measured before and after.
**Files touched**: code `5739b950f`: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (the header line), `simulation-panel.scss` (`&__section-input`, the profile label basis). Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 02:25 (`claude_2026-09-27_0225_fase2_sim_profiles_panel_m3.md`: its 48 px label was recorded as fitting «Extended state machine», the pixel says it did not)
**Causa**: (c)
**Regressions**: no. Baseline at `145e916c6`: vitest sim 124 passed, 5 files; full 5163 passed, the 9 known files red at import; typecheck 14. On `5739b950f`: `npm run typecheck` exit 2, 14 errors, set identical; full vitest 5163 passed, the same 9 files; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Probe on 3012: the three shorter options whole before and after, row 262 × 24 unchanged.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: probe readings and two crops for the chat (G13: «CHOOSE A TRANSITION (ε)», U+03B5, 5 of 5 conflicts; G14: 116 of 124 px before, 124 of 124 after, select 147.4 to 159.4 px at both sizes; `g13_header.png`, `g14_profile_row.png`)
**Notes**: Closes G13 (and R3's ε ticket) and G14. G14 room from the label gap only, 48 to 36px («Profile» 33.4px); Apply untouched; 4px spare on the longest option. The readiness canvas reader counted the content box: the menulist paints text from column 10 and the arrow cuts it at 125 of a 147px select. No event conflict in the probe: «(coin)» holds by construction, not read. Probes `_tmp_g13_*`, `_tmp_g14_*` gitignored; shots in `~/.jjodel-lanes/shots_polish/`.
**Prompt document name**: 2026-09-27 13:10

## 2026-09-27 — fix: validateProfile rejects a derived role whose source is off (P-2026-09-27-1437)
**Prompt**: `claude_2026-09-27_1437_prompt_sim_validate_profile_derived_from_off.md`, lane fast on `sim-validate-profile-from` in `~/jjodel-open`. The M3 ticket (medium): `validateProfile` passed Initial `off` with Initial marking derived from Initial. New `ProfileDefectCode` literal `derivedFromOff` (Rule 11), one `if` in the role loop, two tests.
**Files touched**: code `6ade65d90`: `frontend/src/model/simulation/simProfiles.ts`, tests `frontend/src/model/simulation/__tests__/simProfiles.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 18:40 (`claude_2026-09-25_1840_prompt_sim_profiles_genre_fix.md`: it made Initial marking derived from Initial and taught `checkability` the source, not `validateProfile`)
**Causa**: (a)
**Regressions**: no. Baseline at `8c1a499c1`: vitest `src/model/simulation` 407 passed, 14 files; typecheck 14. On `6ade65d90`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest `src/model/simulation` 409 passed (407 + 2), 14 files; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Mutation bench 2/2 killed.
**Out-of-scope changes**: no — the two files of DOVE; the edit of the existing case at `simProfiles.test.ts:194` entered DOVE with the GO of the question stop.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Question stop, answered GO (RC-21): State machine with Trigger off pinned an exact list, and Event is derived from Trigger, so it gained `[derivedFromOff, event, trigger]`, second of three; the check stays unconditional, so Event reports both dependencyOff and derivedFromOff. Second cause of the stop, (a) too: the prompt counted 34 existing cases, the file held 42. Mutants: check dropped, 2 red; inverted to `active(source)`, 12 red.
**Prompt document name**: 2026-09-27 14:37

## 2026-09-27 — docs: MODELS 2026 demo script from the readiness reports (P-2026-09-27-1430)
**Prompt**: `claude_2026-09-27_1430_prompt_sim_demo_script.md`, fast lane, docs only, on `simulation-engine` in `~/jjodel-sim`: the presenter's script for the four presets (PEST SM, Petri, ESM, flowchart B), every panel line quoted from the second readiness report (`a41e63496`) §4, its logs and screenshots, the shapes from the builder `_tmp_demo2_scenario.js`; decision H recorded as the script's rule.
**Files touched**: `6fd1da38f`: `docs/demo/models_2026_simulator_demo.md` (new). This commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Docs only, no source file changed. `check:docs` 4/4 at `6fd1da38f`; `grep -c '—'` on the script 0 (exit 1, control `Marking` 43).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Decision H (Alfonso, 2026-09-27 14:27): Petri Bound = 4 on screen after Apply is the script's rule. G12's script side is closed; the engine side (a reachability bound) stays after MODELS. Report §10 H: decided. No probe re-run: every quoted line is in the report, its logs, or the polish lane (`5739b950f`, header `(ε)`). Five unmeasured paths carry `<!-- not measured -->`. Builder and report §4 agree on all four presets.
**Prompt document name**: 2026-09-27 14:30
**Ticket** (priority medium, seen here, not fixed: out of this lane's scope). The merge `4edc8bed5` committed unresolved conflict markers into this file: `<<<<<<< HEAD`, `=======`, `>>>>>>> alfonso-frontend-jjtl` around the readiness-2 and polish entries. `check:docs` passes with them in; a fold would carry them into the active log. Resolution: delete the three marker lines, keep both entries.

## 2026-09-27 — fix: one chevron on the panel's selects in dark (P-2026-09-27-1501)
**Prompt**: `claude_2026-09-27_1501_prompt_sim_dark_select_chevron.md`, lane fast on `sim-dark-select-chevron` in `~/jjodel-open`. The C1 ticket: with `data-theme="dark"` every select of the declarations table paints a doubled chevron. A short discovery, then one rule in `simulation-panel.scss`, light unchanged by a pixel, probe crops in both themes for the chat.
**Files touched**: code `50c198da5`: `frontend/src/components/editor-v2/sim/simulation-panel.scss` (`& &__select`, `background-image: none`). Docs, this commit: `docs/discovery/discovery_2026-09-27_sim_dark_select_chevron.md` (new), this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `2f42f2704`: `npm run typecheck` exit 2, 14 errors; vitest sim 124 passed, 5 files. On `50c198da5`: typecheck exit 2, 14 errors, set identical; vitest sim 124 passed, 5 files; `npm run build` exit 0, 51 warning lines; `check:scripts` PASS; `check:docs` on this commit. Probe on 3014, `EXIT=0` before and after.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: probe readings and 2x crops for the chat (dark: an SVG `background-image` on the 4 table selects before, `none` on 21 of 21 panel selects after, one chevron; light: `none` before and after, the 4 crops byte-identical by `cmp`; shots in `~/.jjodel-lanes/shots_chevron/`)
**Notes**: Closes C1's doubled-chevron ticket. Not a second chevron but a row: `[data-theme="dark"] select` (`_form-system.scss:760`, 0,1,1) outranks `.sim-panel__select` (0,1,0), and its SVG tiles (the dark shorthand at `:735` resets repeat) beside the native arrow. It hits every panel select since panel v1 (`1b67b65fa`), so the rule covers all 21. Dark background colour unchanged (report §5). Probes `_tmp_chevron_*` gitignored; logs in `~/.jjodel-lanes/P-2026-09-27-1501/`.
**Prompt document name**: 2026-09-27 15:01

## 2026-09-27 — probe: the demo script's Add attribute hint path on the trunk (P-2026-09-27-1500)
**Prompt**: `claude_2026-09-27_1500_prompt_sim_demo_hint_path_probe_trunk.md`, fast probe lane on `sim-hint-path-probe` in `~/jjodel-icons` (trunk code `86520a8f3`). Measure the ESM declarations path of `docs/demo/models_2026_simulator_demo.md` (`6fd1da38f`, lines 194-201) on the trunk: hint click, groups and focus, the two rows as typed, Apply, the marking line; four crops; confirm or amend each step.
**Files touched**: this commit: `docs/discovery/discovery_2026-09-27_sim_demo_hint_path_trunk.md` (new), this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_hint_*` gitignored; no source file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no source file touched; four probe runs on 3013, `EXIT=0` each, port free before and after.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — probe lane; five crops per variant for the chat in `~/.jjodel-lanes/shots_hint/{script,direct,prompt}/`
**Notes**: Step 1 confirmed (focus on the table's add, 926-950 vs 950, R2's numbers); step 4 and the run confirmed. Steps 2 and 3 diverge in gestures only: cells prefilled `x1`/`false`/max `1`, a click leaves the caret after the text; row 1 line 3 at 945-969, second add 954-978, row 2 line 2 at 946-970, all past the 950 fold. Declarations byte-identical to the Configure path. Trunk moved to `2e7f966de` (validateProfile only, no panel caller). Report §6 has the script wording.
**Prompt document name**: 2026-09-27 15:00
**Ticket** (priority low, opened here, report §8 Q2). The table's own `Add attribute` scrolls nothing (`SimulationPanel.tsx:420`; only the hint scrolls, `:474-475`), so each new row starts at the body's bottom edge with its lower lines below the fold, and every new cell is prefilled (`:322`, `:274`) with the caret left after the text on click. After MODELS: scroll the new row into view, select a prefilled cell on focus.

## 2026-09-27 — docs: demo script names the ESM hint path gestures (P-2026-09-27-1540)
**Prompt**: `claude_2026-09-27_1540_prompt_sim_demo_script_hint_gestures.md`, fast lane, docs only, on `sim-demo-script-hint` in `~/jjodel-open`: §6 of `discovery_2026-09-27_sim_demo_hint_path_trunk.md` (`6acdb7080`, branch `sim-hint-path-probe`) applied step by step to §2.3 of the demo script, the three scrolls and the double-clicks named, the R2-only claim of §4 replaced by the trunk measurement.
**Files touched**: this commit: `docs/demo/models_2026_simulator_demo.md` (§2.3 declarations steps 1 to 4 and the count sentence, §4 the summary-button risk), this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 14:30 (`claude_2026-09-27_1430_prompt_sim_demo_script.md`: its §2.3 steps 2 and 3 did not name the scrolls and the prefilled cells the trunk measured)
**Causa**: (c)
**Regressions**: no. Docs only, no source file changed. `grep -c '—'` on the script 0 (exit 1, control `Marking` 43); `check:docs` 4/4.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: No value of §6 contradicts the script: min 0, max 3, initial 0, the 10 interactions (1 hint, 2 add, 7 cells) hold. Measured code `86520a8f3`; since then `frontend/src/components/editor-v2/sim/` differs by `50c198da5` only, a dark-only select rule (light computes `none`): read, not re-run. §2.4 line 274 types into the same prefilled cells and names no double-click; out of scope, left as is. The table-add ticket stays open (chat, RC-25).
**Prompt document name**: 2026-09-27 15:40

## 2026-09-27 — discovery: post-MODELS engine batch, G6, G7, G12 (P-2026-09-27-1545)
**Prompt**: `claude_2026-09-27_1545_prompt_discovery_sim_post_models_engine.md`, read-only discovery on `sim-post-models-engine` in `~/jjodel-icons` at `f18d976d5`: for G6 (the activity final is never read), G7 (`else` in fused transitions) and G12 (the Bound proposal is a lower bound), the code path, the minimal change, the tests, the R- rows and the effect on the four demo presets; two options for G12.
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md` (new), this entry, the Status of the prompt file. Probes in `/tmp/p1545/`, outside every tree, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: no file under `frontend/` written, `git status` empty after every probe; probes exit 0. The G6 and G7 sketch, on `/tmp` copies of three engine files: the existing engine suites 155/155 on the tree and on the sketch; 9 proposed tests red 9/9 on the tree, green 9/9 on the sketch; mutation bench 10/10 killed. `check:docs` 4/4.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: New: `else` on a plain edge whose sibling enters a fork is always true, a silent choice list (G7 mirror). The G7 sketch covers the fork in-edge, the join out-edge and the mirror; `else` into a join becomes `else-position` (B, Alfonso). G12: (a) wrong on a merge (2 for 4) and a chain (3 for 9); (b) exact on the demo net, recommended, amends R-SIM-81 (A, Alfonso). The prompt's `Lane: full` names no RC-3 trigger (RC-17). A /tmp mirror with symlinks was refused, not retried.
**Prompt document name**: 2026-09-27 15:45
**Ticket** (priority medium, opened here, G7 of the report §3.2). An `else` on a plain edge whose sibling enters a fork or a join is always true: the siblings are drawn from the plain edges only (`netCompile.ts:266`), so the decision offers both branches and no defect says why. Measured on `f18d976d5`; lane E1 of the report closes it.

## 2026-09-27 — feat: the engine reads the activity final and resolves else over fused transitions, lane E1 (P-2026-09-27-1610)
**Prompt**: `claude_2026-09-27_1610_prompt_sim_e1_engine_g6_g7.md`, Phase 2 of P-2026-09-27-1545 on `sim-e1-engine` in `~/jjodel-icons`, full lane (more than 3 files), unattended. G6: the engine reads `simActivityFinal`, and a marked activity final terminates the run with other tokens alive (R-SIM-53). G7: `else` resolved over plain and fused transitions with R-SIM-31(1)'s siblings as written; an `else` into a join or out of a fork is the defect `else-position` (Alfonso's B no).
**Files touched**: code `45a796050` (G6): `frontend/src/model/simulation/netTypes.ts`, `netCompile.ts`, `netStep.ts`, `roleCatalog.ts` (header comment), tests `netCompile.test.ts`, `netStep.test.ts`, `roleCatalog.test.ts`; code `bce34aee1` (G7): `netTypes.ts`, `netCompile.ts`, `netStep.ts`, tests `netCompile.test.ts`, `netStep.test.ts`, `components/editor-v2/sim/__tests__/simBridge.test.ts`. Docs, this commit: `docs/decisions.md` (R-SIM-83, R-SIM-84), this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `5260df11f`: `npm run typecheck` exit 2, 14 errors; vitest on `model/simulation` and `editor-v2/sim` 533 passed, 19 files; full `npx vitest run` 5175 passed, the 9 known files red at import. On `bce34aee1`: typecheck exit 2, 14 errors, set identical; sim 543 passed (533 + 10); full 5185 passed, the same 9 files; `npm run build` exit 0, 51 warning lines; `check:scripts` PASS; `check:docs` 4/4. Red first: G6 5 (the 4 new tests and the moved roleCatalog assertion), G7 6. Mutation bench on the ten mutants of report §9: 10/10 killed, each only by the new tests.
**Out-of-scope changes**: no — eight code paths, all in DOVE (`simBridge.test.ts` the optional one), above the Rule 19 five; the list is the prompt's DOVE, not restated in chat before the first edit. No file of E2's DOVE, no critical-zone file.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no visual check in the prompt). The readiness Flow probes replace it, copied read-only as `_tmp_e1_*`, vite on 3015: Flow B trace identical line by line (11 of 11: the M1 reset and STEP 1..10); Flow C `Terminated` at step 6, `Marking: fin · count = 2` (was `Deadlock`); Flow A no defect at Reset, `Terminated` at step 6. Each exit 0, one console error of the known kind.
**Notes**: The Flow B comparison drops one reader key, `choiceSectionPaint` (null): the readiness common file gained it at 13:01, after its Flow B ran at 12:51. The G7 subject is shortened from the prompt's, 74 characters, over the 72 of §6.2. R-SIM-83 and 84 are numbered while E2 runs in parallel; a clash is the later merge's to renumber. The G6 commit message was amended once, pathspec only, before the G7 commit.
**Prompt document name**: 2026-09-27 16:10
**Ticket** (closed here). The G7 mirror ticket of the P-2026-09-27-1545 entry (an `else` on a plain edge whose sibling enters a fork was always true) is closed by `bce34aee1`: the test «mirror» in `netCompile.test.ts` and mutant M7 of the bench.

## 2026-09-27 — feat: binding compatibility verdicts as a pure module, S11a (P-2026-09-27-1646)
**Prompt**: `claude_2026-09-27_1646_prompt_sim_binding_compat.md`, fast lane on `sim-binding-compat` in `~/jjodel-sim`, wave 1 of the backlog report (P-2026-09-27-1625, §4.2 S11a). `bindingVerdicts(profile, bag, sketch)`: for every `edit` role that binds an element, each sketch element of its sort and the bag's value judged `ok`, `warn` or `incompatible`; `currentVerdicts` gives the bag's verdicts to `checkability`. Unwired.
**Files touched**: code `3d44abce0`: `frontend/src/model/simulation/bindingCompat.ts` (new), `frontend/src/model/simulation/__tests__/bindingCompat.test.ts` (new). Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `3d44abce0`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run src/model/simulation` 443 passed in 15 files (418 + 25, the baseline taken before the first edit); `npm run build` exit 0, the chunk-size warning; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: the test file at collection, module absent. Mutation bench 24/24 killed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The rule table (report risk 10) is in the body of `3d44abce0`: sort, concrete (R-SIM-81 exception), proper subclass of Node or Arc, owner lineage, reference type, containment, attribute type (R-SIM-44); the worst failed rule decides. Not judged: multiplicity, and the overlap of the sorts beyond Trigger's type (`overlapVerdict`). `BindingVerdict` sufficed: no question stop, no exported type changed, no R- row.
**Prompt document name**: 2026-09-27 16:46
**Ticket** (priority low, opened here). `MetamodelSketch` carries no upper bound (report §3.1 of the profiles report lists one; `profileBinder.ts` and `metamodelSketch.ts` do not), so the compatibility check cannot judge multiplicity, the third check of the modal lane's «type, owner, multiplicity». An optional bound on `SketchAttribute` and `SketchReference` (Rule 11, additive) and its read in `metamodelSketch.ts` are owed to S11c or the modal lane.

## 2026-09-27 — feat: E2, Bound from a bounded exploration and the activity-final row (P-2026-09-27-1611)
**Prompt**: `claude_2026-09-27_1611_prompt_sim_e2_panel_row_bound.md`, lane E2 on `sim-e2-panel-bound` in `~/jjodel-open`, full lane, Phase 2 of P-2026-09-27-1545. G12(b): Apply proposes `simBound` from the reachable markings of the models, guards aside, inhibitors and termination kept, capped at 2000 (R-SIM-81(1) amended, Alfonso's answer A); the G6 panel row: Activity final in Configure… General.
**Files touched**: code `917b1546b`: `frontend/src/model/simulation/boundExploration.ts` (new), `components/editor-v2/sim/modelMarkings.ts`, `sim/simRoleStatus.ts`, `sim/SimulationPanel.tsx`, tests `boundExploration.test.ts` (new), `sim/__tests__/modelMarkings.test.ts`, `sim/__tests__/simRoleStatus.test.ts`; code `babbc161c`: `sim/simRoleStatus.ts`, `sim/SimulationPanel.tsx`, `model/simulation/stcFromRoles.ts`, tests `simRoleStatus.test.ts`, `events.test.ts`, `roleCatalog.test.ts`. Docs, this commit: `docs/decisions.md` (R-SIM-81 point (1) amended), this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `d685b5738`: typecheck 14; vitest sim dirs 533 passed, 19 files. On `babbc161c`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest sim dirs 559 passed (533 + 26), 20 files; full vitest 5201 passed, the 9 known files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: the new suite at collection and 11 tests, then 2 for the row. Mutation bench 16/16 and 4/4 killed.
**Out-of-scope changes**: yes — `frontend/src/model/simulation/__tests__/roleCatalog.test.ts`, a file of lane E1, taken byte for byte from E1's blob (`9e4a20866`, the same at `45a796050`) at the GO of the question stop (RC-25): the row quotes `simActivityFinal`, which that source-text test pinned as unread. `git merge-tree` with `sim-e1-engine` clean. 13 code paths over two commits, above the Rule 19 five, listed in chat before commit 1, not before the first edit.
**Layer Impact Report**: not-required
**Smoke visivo**: probe readings and crops for the chat on 3016 (`Bound → 4` and its title; the Activity final row after Terminal, set by Apply and cleared; light and dark; `~/.jjodel-lanes/shots_e2/`); visual GO by the chat pending
**Notes**: Five §4.2 nets: 4, 4, 9, 5, loop unbounded (no proposal). Cap 2000, worst measured 41 ms. Preset change to Bound → 4 in the DOM 2.5-3.3 ms, exploration 0.1-0.4 ms in page. Apply click to Checkable 257-428 ms, Flowchart control (no exploration) 242-464 ms: the store write lands 193-415 ms after a 1.5 ms handler. Run under Bound 4: t1 twice, p2 ×4, no unsafe; Deadlock at step 4 as scripted. DOVE had modelMarkings and stcFromRoles dirs swapped.
**Prompt document name**: 2026-09-27 16:11

**Decisions taken in the lane** (unattended, RC-25, for the digest):
- the cap is the report's 2000, kept after measuring its slowest shape (41 ms, once per change of the models);
- one model that does not close sends every model back to the largest initial marking, A read literally, even when the others closed higher;
- the prompt's 100 ms is read as Apply's own cost (handler 1.5 ms; the exploration runs at the preset choice, not at Apply): click to screen is the deferred store write, the same on the Flowchart control;
- the `unbounded` end reads «no bound was found»: with inhibitors or termination a covering marking need not repeat;
- `profileSummary` and `profilePatch` take `number | BoundEstimate | null` (a compatible widening, a number keeps today's reading); `boundProposalBag`, `boundEstimate`, `boundEstimateSignature` and `exploreBound` are new exports;
- the docs commit precedes the visual GO, as the prompt's step 7 and the chat's GO order it, where RC-17 puts it after.

## 2026-09-27 — discovery: the run state on the canvas, S15, G3 canvas side (P-2026-09-27-1647)
**Prompt**: `claude_2026-09-27_1647_prompt_discovery_sim_canvas_state.md`, Phase 1 of S15 (R-SIM-33 3c) on `sim-canvas-state` in `~/jjodel-icons`, full lane, read-only, hard stop at the report. What a run-state channel into the canvas needs: where marking, σ and candidates are read, the render path, at least two channel options with files, R-SIM-4, critical zone, render cost and tests, and the draft Layer Impact Report of Phase 2.
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_canvas_state.md` (new), this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_canvas_*` (gitignored, not committed), vite on 3018 with its cache in `/tmp/canvas1647_scratch`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: no file under `frontend/src` written; the probe exit 0, vite stopped after it (`lsof` on 3018 exit 1), `git status` empty after the run.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Measured on 7b66f879f: all 13 Petri demo nodes paint native, no viewpoint, so an IR channel shows nothing on the demo. G3 reproduced: p1 row `tokens = 2` while the run holds 1. A candidate sweep costs 1.2-8.8 µs. Recommended: option A, a per-node overlay in the R-SIM-3 pattern, 0 critical-zone files, no R-SIM-4 amendment; option B (IR surface) after J2. Four decisions await Alfonso (report §12). A halted run still yields candidates: Phase 2 gates on the status.
**Prompt document name**: 2026-09-27 16:47

## 2026-09-27 — docs: demo script after E1 and E2 (P-2026-09-27-1738)
**Prompt**: `claude_2026-09-27_1738_prompt_sim_demo_script_after_e1_e2.md`, fast lane, docs only, on `sim-demo-script-e1e2` in `~/jjodel-w-script` (cut at `d9e88f792`, E1 and E2 merged): the demo script drops the three constraints E1 and E2 make obsolete (answers memo, item B): the Petri step 3 becomes Apply's own `Bound → 4`, decision E is lifted with what is now allowed, each new value probed on 3022.
**Files touched**: this commit: `docs/demo/models_2026_simulator_demo.md` (§1 the Petri row, §2.2 steps 1 to 3 and the line before Reset, §2.4 a variants paragraph, §3 the Petri and Flowchart bullets and the footnote, §5 three lines), this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_script_*` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 14:30 (`claude_2026-09-27_1430_prompt_sim_demo_script.md`: its decision H step and decision E constraints, made obsolete by E1 and E2)
**Causa**: (f)
**Regressions**: no. Docs only, no source file changed. Four probes through `lane-run probe` on 3022 (petri, flowB, flowBF, flowBE), `EXIT=0` each, one known console error per run, port free after; `grep -c '—'` on the script 0 (exit 1, control `Marking` 44); `check:docs` 4/4.
**Out-of-scope changes**: yes — two places outside DOVE's §2.2, §2.4, §3, §4: §1, the Petri row's live «Bound» (an interaction, COSA item 3), and §5, the G6, G7 and G12 lines (the same three constraints as deferred work). §4 names none of them and is unchanged.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Readings on 3022: (1) Petri `Bound → 4`, title over «the 9 reachable markings», bag 4; the §2.2 run line for line after Apply alone; t1 twice gives `p2 ×4`, no unsafe, Deadlock at step 4. (2) Flow B with `ActivityFinal`: `Activity final → ActivityFinal`, Terminated at step 6. (3) `else` on f4 into the Fork: no guard defect, Terminated at step 6. Flow B itself unchanged. No reading contradicts E1 or E2. One commit for script, entry and Status, as the prompt orders.
**Prompt document name**: 2026-09-27 17:38
**Ticket** (priority medium, opened here). The script's header asks for a re-run of the readiness probes after any trunk commit to `SimulationPanel.tsx`; E2 made two (`917b1546b`, `babbc161c`). This lane re-ran Petri and Flow B only: the SM (§2.1) and ESM (§2.3) scenes are not re-measured on this tree. `sim-readiness-3` (answers memo) covers them.

## 2026-09-27 — discovery: the Simulation roles modal, S11b and S11c, Phase 1 (P-2026-09-27-1740)
**Prompt**: `claude_2026-09-27_1740_prompt_sim_modal.md`, full lane on `sim-modal` in `~/jjodel-w-modal`, Phase 1 read-only: the design README's five «To confirm» points from the code, the modal against today's M2 face field by field, every mockup element mapped to an engine key, Phase 2 cut into slices outside the conflict map (`simBridge.ts`, `net*.ts`).
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_modal.md` (new), this entry. No file under `frontend/`; probe in `/tmp/p1740/`, outside every tree.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: `git status` empty before the commit but for the two docs; the mockup served on 3023 by `python3 -m http.server`, port free before and after; the probe printed its measure, then exit 1 at a screenshot selector (`#4a` is not a valid CSS id), no retry needed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Keys: `simProfile` (system id or user JSON, modes inside), `sim*` per role, `simStateAttributes`. `off` is read by validator, binder and summary, never by the run. Data runs on Petri in the engine; the Petri preset turns on Guard only. The mockups misplace eleven roles (report §4); 4a's third chip ends 39.5 px below its card. Required = `requiredRoles` (R-SIM-48); the dependency set shows as «Needed by» (D1). Slices A (pure), B (shell), C (user profiles, S10), six files.
**Prompt document name**: 2026-09-27 17:40

## 2026-09-27 — feat: the Simulation roles modal, S11b and S11c, Phase 2 (P-2026-09-27-1740)
**Prompt**: `claude_2026-09-27_1740_prompt_sim_modal.md`, Phase 2 on `sim-modal` in `~/jjodel-w-modal`, full lane, after the chat's GO (Required as R-SIM-48, both awaiting items as recommended; the modal enters the MODELS demo, so every demo path through it). Slices A, B, C of `discovery_2026-09-27_sim_modal.md` (`30c28f817`): the pure layer, the dialog with the system presets, user profiles and compatible selects; the 4a overflow fixed; the Bound helper in the engine's words.
**Files touched**: code `645703645` (A): `frontend/src/components/editor-v2/sim/simRolesDraft.ts` (new), `sim/__tests__/simRolesDraft.test.ts` (new); `b582ca7d4` (B): `sim/SimRolesModal.tsx` (new), `sim/SimRolesModal.scss` (new), `sim/SimulationPanel.tsx`, `sim/simulation-panel.scss`; `e34323517` (C): `simRolesDraft.ts`, its test, `SimRolesModal.tsx`, `SimRolesModal.scss`. Docs, this commit: this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_modal_*` gitignored.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `30c28f817`: typecheck 14; vitest sim dirs 594 passed, 21 files. On `e34323517`: `npm run typecheck` exit 2, 14 errors, set identical; vitest sim dirs 623 passed (594 + 29), 22 files; `npm run build` exit 0, 51 warning lines; `check:scripts` PASS; `check:docs` on this commit. Red first: A at collection, C 9 tests. Mutation bench A 15/16 (M14 equivalent), C 13/13.
**Out-of-scope changes**: no — the six files of the report §8, above the Rule 19 five, listed there before the first edit; no conflict-map file, no critical-zone file.
**Layer Impact Report**: not-required
**Smoke visivo**: probe readings and crops for the chat on 3023 (four presets through the dialog and a run each, the hint route, 4e, a named copy, a warning; `~/.jjodel-lanes/shots_modal/1600x1000/` 45 crops, `1280x800/` 43); visual GO by the chat pending
**Notes**: Every Marking and Last step line of the four demo runs as the script, at both sizes; Petri Bound 4 with the engine's reason; one Control+z after Apply empties the bag; folds move neither header nor footer; S11a ok on every bound demo role; one console error, the known kind. The ecore-loop error kind (P-2026-09-27-0225) showed once, 24 console errors, with ESM and Flowchart B in one page, and in none of the nine later runs. Logs in `~/.jjodel-lanes/P-2026-09-27-1740/`.
**Prompt document name**: 2026-09-27 17:40
**Ticket** (priority high, opened here, before the freeze). The demo script (`docs/demo/models_2026_simulator_demo.md`) walks the inline groups: §2.2 step 3 (Bound via Configure…, now proposed as 4 by Apply) and §2.3, §2.4 (the table's gestures) no longer match the panel on this branch. A docs lane re-walks the script through the dialog after the merge, from `probe-walk-final-*.log` and `probe-hint-1600.log`.
**Ticket** (priority medium, opened here). The panel's summary badge still reads `checkability` without the S11a verdicts (`simRoleStatus.ts:364`, D5), the dialog's pill with them: a binding that warns reads «Checkable» on the panel and «Checkable with warnings» in the dialog. None does on the demo metamodels. For the S6-S8 bundle that owns `profileSummary`.
**Ticket** (priority low, opened here). The rules of the inline groups and the old table in `simulation-panel.scss` are marked `TODO: cleanup`, left for the S17-S19 cleanup.

**Decisions taken in the lane** (unattended, RC-25, for the digest):
- turning a role on brings the roles it depends on, and Trigger brings Event derived from it, as the presets do, so no offered switch makes a `dependencyOff`;
- Data offers «Turn on» wherever State attributes is off (the engine runs declarations on every shape, report §3.5), which makes a user copy;
- the validator's defects are listed at the top of the body with their fix, not under the row (a folded row would hide 4e);
- a warn or incompatible option carries «(warning)» or «(incompatible)» in its text (a native option shows no title), the bound value's verdict an icon in a fixed slot;
- declarations are part of the draft, written by the same Apply; a text cell selects its text on focus, so a prefilled cell is replaced by typing (the S12 caret ticket, in the dialog only);
- Apply closes the dialog, Escape and Cancel discard it, a click on the backdrop does nothing;
- the Bound helper reads «Proposed N.» then `boundValue`'s reason verbatim.

## 2026-09-27 — merge: sim-modal into alfonso-frontend-jjtl (P-2026-09-27-2049)
**Prompt**: `claude_2026-09-27_2049_prompt_merge_sim-modal.md`, merge lane on `alfonso-frontend-jjtl` in `~/jjodel-release`: `--no-ff` of `78afc0378` (`sim-modal`, P-2026-09-27-1740), 1 conflict in this file resolved by union. Resumed after the chat relayed Alfonso's reversal of the not-before-2026-10-04 embargo (17:39), with a decision row, gates and this entry.
**Files touched**: merge `5eccdd4d2` (the branch's 25 files; union of `docs/log-inbox/simulation.md`, trunk's file +38 -0); docs, this commit: `docs/decisions.md` (R-SIM-85), the Status of the prompt file, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates green on `5eccdd4d2`: typecheck exit 2, 14 errors, set identical; vitest 5265 passed across 214 files (5236 + 29), the nine known red at import; hooks 300; build exit 0; `typecheck:scripts` exit 0; `check:agents`, `check:scripts` PASS; `check:docs` 4/4. No smoke on 3001 in this lane.
**Out-of-scope changes**: no — the merge's files are the branch's, declared by the prompt; `docs/decisions.md` and this entry were asked by the chat's answer.
**Layer Impact Report**: not-required
**Smoke visivo**: non eseguito in questa corsia: la chat ha chiesto Outcome: done dopo i gate; il suo smoke su 3001 segue (3001 su, PID 61660, non riavviato)
**Notes**: The first run stopped before the commit on P-2026-09-27-1740's not-before-2026-10-04 line (Outcome: question) and ran `git merge --abort`; the resume re-merged to the same tree `2c5a67a2d`. `frontend/` at `5eccdd4d2` equals `78afc0378`'s. The demo script is stale on §2.2 step 3, §2.3 and §2.4 until the chat's re-walk docs lane. Rollback tag `pre-sim-modal` at `d9e88f792`.
**Prompt document name**: 2026-09-27 20:49

## 2026-09-27 — docs: demo script walks the Simulation roles dialog (P-2026-09-27-2105)
**Prompt**: `claude_2026-09-27_2105_prompt_sim_demo_script_modal.md`, fast lane, docs only, on `sim-demo-script-modal` in `~/jjodel-w-demo-modal` (cut at `22aa888de`, the sim-modal merge in): the four scenes of the demo script re-walked through the Simulation roles dialog (R-SIM-85), every gesture and reading measured by a probe on 3024, clicks and keystrokes counted per scene.
**Files touched**: this commit: `docs/demo/models_2026_simulator_demo.md` (§2.1 to §2.4 the Apply and declaration steps, one count line per scene, the ESM clamp lines, a not-measured note on the Flow variants; §3 the Petri bullet; §4 the two declaration risks), this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_demomodal_*` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 17:38 (`claude_2026-09-27_1738_prompt_sim_demo_script_after_e1_e2.md`: its §2 walked the inline groups the dialog replaced)
**Causa**: (f)
**Regressions**: no. Docs only, no source file changed. Probes on 3024, one fresh page per scene, `EXIT=0` each (sm ×3, petri ×3, esm ×3, flowB ×1), one known console error per run, re-runs identical line for line; `grep -c '—'` on the script 0 (exit 1, control `Marking` 44); `check:docs` on this commit.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — crops for the chat (RC-23), light, 1600x1000, in `~/.jjodel-lanes/shots_demo_modal/`
**Notes**: The four 1740 readings hold: SM 7 of 10, Terminated at 10; Petri Bound 4 with the engine's reason, Deadlock · ε: t2 false at 4; ESM coins and paid declared, the halt line at 10; Flow B count declared, Terminated at 6. Counts: configuration 4 clicks each; ESM declarations 9 interactions (was 10), 34 keys, 2 scrolls (was 3), no double-click (was 4); Flow B 6, 10 keys, 1 scroll. Logs in `~/.jjodel-lanes/P-2026-09-27-2105/`.
**Prompt document name**: 2026-09-27 21:05
**Ticket** (priority medium, opened here, outside DOVE). The script's §5 still lists «The modal lane» as out of the demo, which R-SIM-85 reversed; §1 and the header are unchanged and still true. Left for the chat.
**Ticket** (priority medium, opened here). On ESM at 1600x1000 the panel cuts the final halt line (302 px of text in 262) and `Last step:` (264 in 262); the optional Reset's defects and halt lines too (513, 430). The titles hold the whole text; the script says so.
**Ticket** (priority low, opened here). The dialog's Bound cell is a number input with no select-on-focus: a click and `5` over `4` reads `45`, so the §3 fallback needs Cmd+A. The declaration cells select on focus.

## 2026-09-27 — fix: the halt line reads whole in the halted state (P-2026-09-27-2225)
**Prompt**: `claude_2026-09-27_2225_prompt_sim_halt_line.md`, fast lane on `sim-halt-line` in `~/jjodel-w-haltline` (cut at `d88e70e0e`): in the halted state only, the halt line wraps into a slot reserved for two lines, nothing below it moving (Alfonso, 2026-09-27 22:20, item 3); «Last step» follows only if the slot fits it without moving the controls; the memo of the four 22:20 answers.
**Files touched**: code `e0e6ee5e4`: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (the halt line carries `sim-panel__hint--halt`, a free name: grep exit 1, control exit 0), `simulation-panel.scss` (`__hint--halt`: line-clamp 2, a 3em content box). Docs: memo `docs/ratifiche/claude_ratifiche_2026-09-27_evening_answers.md` `1ec1e8138`; this commit: this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_halt_*` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: 2026-09-26 13:15 (`claude_2026-09-26_1315_fase2_sim_guard_outcomes.md`: its one-row rule, R-SIM-63, cut the ESM halt line the demo exists to show)
**Causa**: (f)
**Regressions**: no. `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest on `src/components/editor-v2/sim` and `src/model/simulation` 22 files, 623 passed, as before; `npm run build` exit 0; every non-halted state measured identical before and after (Notes); Petri and SM crops byte-identical (cmp).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — the lane read its crops; the chat's RC-23 check on `~/.jjodel-lanes/shots_halt/` is pending
**Notes**: Halted, 1600x1000: controls at 794.5/858.5/915 before and after; panel 251.5 to 268 (declared halt), 276 to 292.5 (undeclared); halt line 24.5px cut to 41px, two lines, whole, both texts. Running, Terminated, Deadlock, Not started, Reset from Halted: identical. Same at 1280x800, light and dark. «Last step» stays cut: wrapping it lifted the controls 16.5px. Logs in `~/.jjodel-lanes/P-2026-09-27-2225/`.
**Prompt document name**: 2026-09-27 22:25
**Ticket** (priority medium, opened here, outside DOVE, for the chat). Once merged, the demo script goes stale on two readings: §2.3 at lines 196-198 and 238-240 says the halt line is cut and read in its title; it now reads whole on two lines. «Last step» and the defects line are still cut, as the script says.
**Ticket** (priority medium, opened here, outside DOVE, for the chat). Answer 3 narrows R-SIM-63 for the halt line; the row in `docs/decisions.md` is not written.
**Ticket** (priority low, probe artifact). The dark probe's init script throws one `pageerror` (`document.documentElement` is null that early); the theme still applies through `localStorage.theme`.

## 2026-09-27 — discovery: guard and action checks in the problems list, S16 (P-2026-09-27-1726)
**Prompt**: `claude_2026-09-27_1726_prompt_discovery_sim_checker_gap.md`, Phase 1 read-only on `sim-checker-gap` in `~/jjodel-w-checker` at `d1d45b9d3`, wave 1 of the backlog report (S16): map the problems registry, measure which STC guard and action errors are caught today and where, design the producer, its kind and tests, with C2's probe (4) as the reference; draft the Layer Impact Report of Phase 2.
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_checker_gap.md` (new), this entry, the Status of the prompt file. Probes gitignored `frontend/scripts/smoke/_tmp_checker_*`, vite on 3020, logs in `/tmp/checker_scratch/`, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: no file under `frontend/src` written; `git status` empty after every probe; three probes exit 0; the 3020 server stopped by pid, no listener after. `check:docs` 4/4.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (Phase 1 read-only; the draft for Phase 2a is in the report §14)
**Smoke visivo**: non applicabile
**Notes**: 35 cases on the demo presets (report §5.2): the registry sees only parse errors on Expression/Action slots (conformance); 11 classes pass Reset and show only when fired, C2's probe (4) among them. Recommended: P2a a producer over startRun, kind 'simulation' (critical zone), then P2b the new rules in the bridge. startRun median 1.6 ms on demoESM. Probe 1's A9-A12, E1, E2 inherited a leftover slot value and were rerun (probe 2).
**Prompt document name**: 2026-09-27 17:26
**Ticket** (priority medium, opened here, report F6). An `else` guard with no sibling is always true, silently: `tp.guard = else` fires on `push`, `t2.guard = else` compiles with no defect (measured on `d1d45b9d3`). A defect would amend the ratified R-SIM-31(1): decision 1 of the report §12, for Alfonso.
**Ticket** (priority low, opened here, report decision 5). The declarations' compile defects (`role: 'declaration'`) have no M1 element, so a registry producer cannot anchor them; an M2 anchor (the metaclass node, or the metamodel) is a lane of its own.
**Ticket** (priority low, opened here, report risk 7). Building the four demo presets in one page logs 216 `Cannot serialize in ecore, found loop` console errors (with their stacks); one preset per page logs none. Not investigated.

## 2026-09-27 — feat: guard and action checks in the problems registry, P2a (P-2026-09-27-1805)
**Prompt**: `claude_2026-09-27_1805_prompt_sim_checker_gap_phase2.md`, Phase 2 of `P-2026-09-27-1726` on `sim-checker-gap` in `~/jjodel-w-checker`, full lane (critical zone: the problems registry), go-ahead by `lane-run --critical-zone-goahead` (RC-30). Implement the report's slices in order: P2a (a producer of kind `'simulation'` over the bridge's `startRun`), then P2b (`stcChecks.ts`, rules R1-R5).
**Files touched**: docs `4bbe3790a`: `docs/discovery/lir_2026-09-27_sim_checker_gap.md` (new, the Layer Impact Report, before any edit). Code `0412501ef`: `frontend/src/components/editor-v2/problems/registry.ts`, `simCheckToProblems.ts` (new), `SimCheckProblemSync.tsx` (new), `__tests__/simCheckToProblems.test.ts` (new), `components/editor-v2/EditorV2.tsx` (import and mount). This commit: this entry, the LIR's closure section, the Status of the prompt.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no. On `0412501ef`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest `problems/` + `sim/` 214 passed (195 + 19), 11 files; `npm run build` exit 0, the chunk-size warning (10m34s, load ~30). Full suite: 5087 passed; red the 9 known import files and 6 `scripts/` files (30 timeouts and pool-start failures under load, `criticalZone` under this session's go-ahead env); no `scripts/` file changed. Red first: 18 at collection. Mutation bench 22/22 killed.
**Out-of-scope changes**: no: five code paths, the Rule 19 five, listed in the LIR before the first edit; all in the lane's ownership.
**Layer Impact Report**: produced
**Smoke visivo**: fallito (lane probe on 3020, ESM alone: registry, dots, overlay, resolved and TTL as the Reset line, 4/5; the rail item not closable, no `.ir-form` on this preset; chat RC-23 run and Alfonso's GO pending)
**Notes**: P2b not started: its wiring (`simBridge.ts`, its test) and R3 (`actionEvaluator.ts`) belong to `sim-derived-recursion`, whose unmerged `d2a19ccab` changes `simBridge.ts`; question to the chat. `node#edge` anchored on the node, as the defects line names it (report §9 said the edge). Selector cost 9.7 ms at 2000 objects, 30 ms at 5000. The R-SIM row is owed: `decisions.md` is not in the ownership map. Session past 90 minutes (build and full suite under load). Detail: the LIR §3 and §5.
**Prompt document name**: 2026-09-27 18:05
**Ticket** (priority low, opened here). `NodeProblemOverlay` stays light with `data-theme="dark"` on the canvas (crop `3_tp_enode_overlay_dark.png`); not changed here, not investigated.
**Ticket** (priority low, opened here, LIR §5). The producer's selector walks the whole lookup through `runSignature` on every dispatch of a simulation-bound M1: 9.7 ms at 2000 objects, 30 ms at 5000. Above about 2000 objects, the report's fallback applies.

## 2026-09-27 — discovery: well-founded recursion in derived attributes, S3 (P-2026-09-27-1727)
**Prompt**: `claude_2026-09-27_1727_prompt_discovery_sim_derived_recursion.md`, full lane, Phase 1 read-only on `sim-derived-recursion` in `~/jjodel-w-recursion` at `21394e437`, wave 1 of the backlog report (S3, ratification C): where R-SIM-74 refuses a well-founded recursion, the per-(element, attr) graph over frozen M with cycle detection, its cost on the demo presets, the collection form against R-SIM-43, the amendment texts and the Phase 2 lanes.
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_derived_recursion.md` (new), this entry, the Status of the prompt file. Probe `frontend/scripts/smoke/_tmp_recur_probe/recur.test.ts` and its vitest config, gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: no file under `frontend/src` written, `git status` empty after every probe run; probe exit 0, 9 tests, 37 `[RECUR]` lines on the last run. No dev server: port 3021 not opened.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The refusal is the name graph alone: tree size, depth via `parent`, list length pass the parser and the subset checker. The lambda form `self.children.sum(c => c.[size])` evaluates today, so R-SIM-43 needs no amendment; only the literal `children.[x]` is refused. G3 prototype: 5.8 ms at Reset for 1023 nodes, same plan on the ESM demo equation. Amending R-SIM-74 awaits Alfonso (RC-26). One docs commit per the prompt, not the skill's inbox-alone commit.
**Prompt document name**: 2026-09-27 17:27
**Ticket** (priority low, opened here, report §8.5). S2's planned message for a derived attribute with no value, «its equation failed», is wrong for a node absent because it sits on a cycle once G3 lands; `sim-derived-diagnostics` should say «has no value» and leave the cause to the defect line.

## 2026-09-27 — feat: derived attributes ordered per element over frozen M, S3 (P-2026-09-27-1727)
**Prompt**: Phase 2 of `claude_2026-09-27_1727_prompt_discovery_sim_derived_recursion.md`, full lane on `sim-derived-recursion` in `~/jjodel-w-recursion`, GO of 2026-09-27 17:53 in cascade after Phase 1 (report `4868359c9`, Alfonso's answers `8baee76b6`: A yes, B no). The two slices of report §8: the graph per (element, attribute) in `derivedEvaluator.ts`, then the bridge line. Merge after MODELS.
**Files touched**: code `805c8ecdd`: `frontend/src/model/simulation/derivedEvaluator.ts`, `__tests__/derivedEvaluator.test.ts`; code `d2a19ccab`: `frontend/src/components/editor-v2/sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`. Docs, this commit: `docs/decisions.md` (R-SIM-74 amended), this entry, the Status of the prompt file. Probes `_tmp_recur_*`, gitignored.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `8baee76b6`: typecheck exit 2, 14 errors; vitest on `model/simulation` and `editor-v2/sim` 568 passed, 20 files. On `d2a19ccab`: typecheck exit 2, 14, set identical; 581 passed (568 + 13, the existing 16 derived tests and the bridge's cycle test unchanged); `npm run build` exit 0, 51 warning lines; `check:scripts` PASS; `check:docs` 4/4. Red first: 12, then 1. Mutation bench 13/13 killed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no visual checklist in the prompt). Live probe on 3021, vite of this tree, stopped after: Reset shows `Marking: p1 · p1.len = 3, p2.len = 2, p3.len = 1`; a step keeps the values; `next` closed on p1 gives `1 defect: len (equation cycle: p1.len → p2.len → p3.len → p1.len).`; one console error, the known `failed to get project`. Crops light and dark in `~/.jjodel-lanes/shots_derived_recursion/`.
**Notes**: Report questions decided unattended: a fixed cap of 10000 bindings per folded object (Q1); no rewrite hint in the cycle title (Q2); the S2 wording stays the ticket of the Phase 1 entry (Q3). Demo presets untouched by construction: three have no equation, the ESM equation keeps its plan (tested). `CompiledDerived.plan` is an optional field (Rule 11). The branch is not merged before 2026-10-04.
**Prompt document name**: 2026-09-27 17:27

## 2026-09-27 — feat: the checker rules R1-R5 at Reset, P2b (P-2026-09-27-2235)
**Prompt**: `claude_2026-09-27_2235_prompt_sim_checker_rules.md`, full lane on `sim-checker-rules` in `~/jjodel-w-rules`: merge `sim-derived-recursion`, then slice P2b of `discovery_2026-09-27_sim_checker_gap.md` (§8, §9, §14): `stcChecks.ts` with R1-R5 (R6 if cheap), called by `guardDefectsOf` and `actionDefectsOf`, `CompileDefect.reason` plus `'unresolved'` and `'value'`. Merges after MODELS, not before 2026-10-04.
**Files touched**: merge `6d8129aae` (from `sim-derived-recursion` at `e6d25ef5d`: `derivedEvaluator.ts` and its test, `simBridge.ts` and its test, `docs/decisions.md`, the S3 report and prompt, this inbox; the one conflict, this inbox, resolved by union). Code `8beb4b28e`: `frontend/src/model/simulation/stcChecks.ts` (new), `__tests__/stcChecks.test.ts` (new), `actionEvaluator.ts`, `components/editor-v2/sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`. Docs, this commit: `docs/decisions.md` (R-SIM-70 extended), this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `6d8129aae`: typecheck exit 2, 14 errors; vitest on `model/simulation` and `editor-v2/sim` 581 passed, 20 files. On `8beb4b28e`: typecheck 14, set identical; 602 passed, 21 files (+21); full suite 5263 passed, red only the 9 known `window is not defined` files; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: 6 bridge tests and `stcChecks.test.ts` at collection (17). Four bridge assertions changed by design (R1, R5, the H4 fixture). Mutation bench 12/12 killed.
**Out-of-scope changes**: no — five code paths, the Rule 19 five, and three docs, all in DOVE; the merge's files come from `sim-derived-recursion` as the prompt orders.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no visual check, report §14 P2b)
**Notes**: Question stop (a preset gains a defect), answered A in chat: before Data, ESM Reset gains `tp guard (undeclared 'paid')`, Flow B `f3` and `f4 guard (undeclared 'count')`; SM, Petri, ESM and Flow B with Data: none. Node probe `_tmp_p2235_presets`, its before equal to report §5.3. R6 included. The P2b tests are report §9, not the prompt's §10. One docs commit per the prompt, not the skill's inbox-alone one. Bench in the body of 8beb4b28e.
**Prompt document name**: 2026-09-27 22:35
**Ticket** (priority low, for the post-MODELS merge of this branch). The optional «Reset before declaring» lines of `docs/demo/models_2026_simulator_demo.md` §2.3 and §2.4 go stale with the merge: ESM will read `3 defects: tp guard (undeclared 'paid'); tc action (undeclared 'coins' on demoESM); tp action (undeclared 'coins' on demoESM).`, Flow B `3 defects: f3 guard (undeclared 'count'); f4 guard (undeclared 'count'); f2 action (undeclared 'count' on demoFlowB).` (node probe, not a browser). The P2a registry shows the guard entries too (by construction, not measured). Update the script at that merge.
**Ticket** (priority low, opened here, declared gap). R4 is at Reset only: `compileAction` is unchanged, so an action whose right side has `E-EAGER`, `E-NOELSE`, `E-SHADOW` or `E-WITH` is listed as a defect at Reset while the run evaluates it and halts only if the evaluation fails. Making those codes a compile defect of the action touches `compileAction`, outside P2b.
**Ticket** (priority low, opened here, declared gap). R2 is static: a guard read whose object folds is judged even inside a branch the run never evaluates (`if false then t1.[tokens] < 1 else true` is listed while the guard is true). By construction, not measured.

## 2026-09-28 — merge: sim-checker-rules into alfonso-frontend-jjtl (P-2026-09-28-0023)
**Prompt**: `claude_2026-09-28_0023_prompt_merge_sim-checker-rules.md`, merge lane on `alfonso-frontend-jjtl` in `~/jjodel-release`: `--no-ff` of `7a03daa1c` (`sim-checker-rules`: P2a, S3, P2b), zero conflicts. Resumed on the chat's GO with additions: the four demo scenes and the P2a checklist on the merged tree (3029), the demo script's optional Reset lines, this entry with a ticket.
**Files touched**: merge `b452d9e5c` (the branch's 22 files, no union resolution); docs, this commit: `docs/demo/models_2026_simulator_demo.md` (§2.3 and §2.4 optional Reset lines, the G7 variant sentence), the Status of the prompt file, this entry. Probes `frontend/scripts/smoke/_tmp_m0023_*` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `b452d9e5c`: typecheck exit 2, 14 errors, set identical; vitest 5345 passed across 218 files (5292 + 53, stated before the merge), the nine known red at import; hooks 300; build exit 0; `typecheck:scripts` exit 0; `check:agents`, `check:scripts` PASS; `check:docs` 4/4. The four demo scenes on script.
**Out-of-scope changes**: no — the merge's files are the branch's, declared by the prompt; the demo script, the scenes and this entry were asked by the chat's GO.
**Layer Impact Report**: not-required — the merge adds no change of its own; the branch's `problems/registry.ts` change is covered by its report `4bbe3790a`.
**Smoke visivo**: passato — the chat on `~/.jjodel-lanes/shots_m0023/` (RC-23 GO, unattended; Alfonso in the morning digest); the four demo scenes on 3029 through the Simulation roles dialog, on script
**Notes**: Scenes: probe copied read-only from P-2026-09-27-2105, finals equal to P-2026-09-27-2327 line for line; ESM halt line whole. Before Data, Reset gains ESM `tp guard (undeclared 'paid')`, Flow B `f3`, `f4 guard (undeclared 'count')`, G7 variant `f3` only (measured here); the script now quotes them, closing the P-2026-09-27-2235 ticket. P2a checklist 5/5, the rail as a count. Tag `pre-sim-checker-rules` on `e87df1ff6` (RC-31). 3001 not restarted.
**Prompt document name**: 2026-09-28 00:23
**Ticket** (priority medium, opened here). The form rail shows a residue problem only as a count, never as a line. `IRForm` (mounted only in the Data Manager) counts every unresolved problem of the object in its summary chip, but `collectFormDiagnostics` returns `residue`, the problems with no field to attach to (`simulation`, `duplicate-name`), and no renderer reads it (search with a positive control on `byField`). Measured on `tp` with the E-NODE guard: summary `1 error`, no field lit (P2a checklist item 1, crop `p2a_4_tp_enode_rail`).

## 2026-09-27 — feat: the run state on the canvas nodes, slice A1 of S15 (P-2026-09-27-1647)
**Prompt**: GO for Phase 2 of `claude_2026-09-27_1647_prompt_discovery_sim_canvas_state.md` (Alfonso 2026-09-27 17:53, in cascade after Phase 1) on `sim-canvas-state` in `~/jjodel-icons`: slice A1 of option A as ratified (C-2026-09-27-1437), under the ownership map of the parallel Phase 2 lanes; A2 waits for sim-modal. Not merged on the trunk before 2026-10-04 unless the chat says so.
**Files touched**: code `4538d824f`: `frontend/src/components/editor-v2/sim/simCanvasState.ts` (new), `sim/SimNodeRunState.tsx` (new), `sim/simNodeRunState.scss` (new), `sim/__tests__/simCanvasState.test.ts` (new), `sim/simRunState.ts`, `nodes/ObjectNode.tsx`, `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss`. Docs, this commit: this entry, the ticket below, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_canvas_*` (gitignored), 3018.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline before the slice: typecheck exit 2, 14 errors; vitest on `editor-v2/sim` and `editor-v2/nodes` 275 passed, 10 files. On `4538d824f`: typecheck exit 2, 14 errors, set identical; vitest 294 passed, 11 files (+19); `npm run build` exit 0; `check:scripts` PASS. Red first at import (module absent). Mutation bench 13/13 killed. Probe on the four demo presets: 0 mismatches, Stop removes every overlay, node sizes unchanged.
**Out-of-scope changes**: yes: eight files, above the Rule 19 five. Four new files under `sim/` owned by no lane, beyond the ownership map's list (`ObjectNode.tsx`, `simRunState.ts`, `styles/tokens/`): the report's A1 table named three of them, and `simNodeRunState.scss` replaces its `simulation-panel.scss` row, which sim-modal owns. `editor-v2/types.ts` untouched.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (the RC-23 check is the chat's, pending). The lane's probe `_tmp_canvas_a1.ts`: Petri, PEST, ESM, Flow B, 51 nodes all native, badges equal to the marking and rings equal to the candidates computed in the page; crops light and dark in `~/.jjodel-lanes/shots_sim-canvas-state/`.
**Notes**: The overlay is a sibling of the node wrapper inside `.react-flow__node`: the wrapper clips its overflow. The σ crop uses a σ installed through `simReset`, since no demo preset declares a per-element attribute. Node σ leaves the presentation out, as the panel line does. Rows of an IR view are not muted (`IRNodeContent.tsx`, critical zone). The initial-marking pointer is read with `netStcFromRoles`, `simBridge.ts` being owned elsewhere. The first probe runs failed under load 244, cause (g).
**Prompt document name**: 2026-09-27 16:47

## 2026-09-27 — ticket: every Reset serializes the selected model to ecore, and logs a loop on cyclic models
**Ticket**: At Reset, `startRun` (`sim/simBridge.ts`) builds the JjEL context with `buildEvalContext`, which binds `data` to `_lastSelected.modelElement` (`jjscript/executor/commands/eval.ts:326-331`). `wrapSelectedElement` (`:915`) then copies every own key of its L-proxy, reading every getter (`:931-938`); on a selected `LModel` that includes `ecore`, a deep cross serialization (`LModelElement.tsx:541-556`). With the four demo presets in one project each Reset logs `Cannot serialize in ecore, found loop`, 6 error pairs, and 0 with one preset per project. The read is caught per key and the run starts, but the P8 smoke counts these as console errors, and every Reset pays one deep serialization. Stack captured on `4538d824f` (`_tmp_canvas_stack.ts`, 3018): panel Reset, `startRun`, `buildEvalContext`, `wrapSelectedElement`, `LModel.get_ecore`, `generateEcoreJson_impl`; no file of the canvas lane in the chain.
**Priority**: medium
**Found in**: P-2026-09-27-1647

## 2026-09-28 — feat: the pending choice on the canvas, slice A2 of S15 (P-2026-09-27-2324)
**Prompt**: `claude_2026-09-27_2324_prompt_sim_canvas_a2.md`, Phase 2 slice A2 of `discovery_2026-09-27_sim_canvas_state.md` on `sim-canvas-state` in `~/jjodel-icons`, full lane: while the «Choose a transition» list is open, exactly its candidates carry a pending mark on the canvas, through a second counter in `simRunState.ts` (R-SIM-33 3c), published and cleared by `SimulationPanel.tsx`; the choice counter re-renders the overlays only, never `ObjectNode`.
**Files touched**: code `e49b10497`: `frontend/src/components/editor-v2/sim/simRunState.ts`, `sim/simCanvasState.ts`, `sim/SimNodeRunState.tsx`, `sim/simNodeRunState.scss`, `sim/SimulationPanel.tsx`, tests `sim/__tests__/simRunState.test.ts`, `sim/__tests__/simCanvasState.test.ts`. Docs, this commit: this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_canvasa2*` (gitignored), 3028.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `f5b70578d`: typecheck 14; vitest sim dirs 642 passed, 23 files. On `e49b10497`: `npm run typecheck` exit 2, 14 errors, set identical; vitest sim dirs 654 passed (642 + 12), 23 files; full vitest 5296 passed, the 9 known files red at import; `npm run build` exit 0, 51 warning lines; `check:scripts` PASS. Red first: 12 tests. Unit bench 11/11 killed; probe bench 9/9 (one mutant per clear site, one publishing without clearing).
**Out-of-scope changes**: no — seven files, all named by the prompt's DOVE, above the Rule 19 five, not re-listed before the first edit; no critical-zone file, `ObjectNode.tsx` and `edges/UnifiedEdge.tsx` untouched, no new token (`--color-warning`, `--color-warning-muted`).
**Layer Impact Report**: not-required
**Smoke visivo**: passato 2026-09-28 — chat, unattended, RC-23 on `shots_canvas_a2` (`decision_1b_list_open_canvas_light`: Flow_1 and Flow_2 ringed, nothing else); the line read «pending» in `606d9e761`, committed before the GO. Probe `_tmp_canvasa2.ts` on 3028, 14/14: Petri conflict t1, t3; Flow B, six steps, no list, no mark; Alfonso's YES/NO flowchart, Flow_1, Flow_2; 18 crops, light and dark, in `~/.jjodel-lanes/shots_canvas_a2/`.
**Notes**: Sites on f5b70578d: publish :452 (fire, clear when no list); clear :341 interruption, :392 Reset, :434 Stop, :652 Cancel, and the unmount cleanup :294. Render counts, sync commit per action: choice bumps ObjectNode 0, SimNodeRunState 30; control mark bump ObjectNode 30. The mark shows only while the model has a run, so the Stop, interruption and unmount mutants die by the choice version. UnifiedEdge left out: no demo preset draws an IR edge.
**Prompt document name**: 2026-09-27 23:24

## 2026-09-28 — ticket: the pending ring does not reach IR object-as-edge edges
**Ticket**: Slice A2 marks the candidates of an open choice list on the node overlay only (`SimNodeRunState.tsx`). An M1 object drawn as an edge by an IR object-as-edge view (`irEdgeViews.ts:251`, `data.irObjectId`) gets no pending ring, and no enabled ring from A1 either. The optional `edges/UnifiedEdge.tsx` class of the report's A2 row was skipped: no demo preset draws an IR edge, so it could not be verified, and it would add a subscription path to every edge. Open it when an authored notation draws a transition as an edge.
**Priority**: low
**Found in**: P-2026-09-27-2324

## 2026-09-28 — fix: demo polish, the theme switch reaches the open editor; toolbar labels accepted for MODELS (P-2026-09-28-0014)
**Prompt**: `claude_2026-09-28_0014_prompt_demo_polish.md`, full lane on `demo-polish` in `~/jjodel-w-polish` (cut at `e87df1ff6`): the freeze readiness findings (`c6933dded`) F2 (Settings theme switch with a project open), F3 (toolbar labels cut at 1600 and 1280) and a Setup step in the demo script for F1 (Cmd+S, reload, check).
**Files touched**: code `813a73ff5`: `frontend/src/pages/settings/AppearanceSettings.tsx` (a user's choice goes through `ThemeService.set`, whose `THEME_CHANGED` the editor's `useTheme` listens to). Docs, this commit: `docs/demo/models_2026_simulator_demo.md` §1 (one bullet, Save check), this entry, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no. `npm run typecheck` exit 2, 14 errors, set identical to the baseline; vitest on `src/components/editor-v2`, `src/services`, `src/pages` 83 files, 1881 passed, as before; `npm run build` exit 0, 51 warning lines. Theme probe (3030, DemoPEST open, avatar > Settings > Appearance): before 5/6 from light and from dark at 1600 (the editor kept its theme); after 6/6 from light and from dark, at 1600x1000 and 1280x800.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, RC-23, F2 on `shots_polish/1600x1000/theme_after_from_light_1_after_dark.png`: canvas, sidebars and panels all dark
**Notes**: F3 not done, stopped as the prompt asks: whole labels do not fit at 1280 without a redesign. Canvas zone 544 px at 1280, 824 at 1600; whole content 845 (M2) and 958 (M1), 761 and 874 with the icon buttons at their declared 28 px. The 28 px candidate, injected, still cuts `LAYO…` and `Abstract synt…` at 1600 on demoSM (41.1 of 41.8, 80.6 of 81.4: the freeze reader's +1 px tolerance hides it; the crop shows it).
**Prompt document name**: 2026-09-28 00:14
**Ticket** (priority low, opened here, after MODELS). The chat adopted the recommendation (RC-21, ratified as recommended, unattended): the cut labels are accepted for MODELS, no CSS change. Editor toolbar labels: `VIEW` renders 0 px wide at every size on both tabs, even with room (the VIEW group's intrinsic width sums the dropdowns' content widths, 84.8 and 109.7, while their flex basis is 120, so the label, shrink 200, absorbs the difference); icon buttons are 40 px, not the declared 28, from unscoped `.toolbar-btn` rules in `components/editors/Console/console-tab.scss:105` and `pages/components/catalog/catalog.scss:763`; whole labels at 1280 need a redesign of the bar (deficit 301 px on M2, 414 on M1).

## 2026-09-28 — fix: roles that are off are skipped by the run; else with no sibling waits for Alfonso (P-2026-09-28-0100)
**Prompt**: `claude_2026-09-28_0100_prompt_sim_bridge_off_else.md`, full lane on `sim-bridge-off-else` in `~/jjodel-w-bridge`, auto mode: (1) an `off` role read by the run exactly as an unbound one; (2) an `else` with no sibling as a Reset defect in `stcChecks.ts`, only if report `discovery_2026-09-27_sim_checker_gap.md` §12 decision 1 is settled or recommends it, else stop with a question.
**Files touched**: code `22cc00ffd`: `frontend/src/components/editor-v2/sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`. Docs, this commit: `docs/decisions.md` (R-SIM-86), this entry, the Status of the prompt file. The STC builder is `netStcFromRoles` (`netCompile.ts`), unchanged: the bridge resolves the bag before calling it. Probes `frontend/scripts/smoke/_tmp_bridge_*`, gitignored.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no — baseline at `72dc4dca2`: typecheck exit 2, 14 errors; vitest on `model/simulation` and `editor-v2/sim` 657 passed, 23 files. On `22cc00ffd`: typecheck 14, set identical; 663 passed (+6); `editor-v2` and `model/simulation` 2311 passed; full suite 5349 passed, red the 9 known import files and 2 timeouts in `laneRun.test.ts` (64/64 alone); `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` PASS. Red first: 5 tests. Bench 7/7 killed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3033 (DOM readings, not the RC-23 chat checklist): SM 10 steps Terminated; Petri Bound 4, 4 steps, Deadlock · ε: t2 false; ESM 10 steps, the domain halt line; Flow B 6 steps Terminated; Reset lines as P-2026-09-28-0023
**Notes**: Ticket 2 not done: §12 decision 1 is RC-26 (the defect amends R-SIM-31(1), ratified); the only answer recorded is the chat's status quo (report §15), none in `decisions.md` or `docs/ratifiche/`. R-SIM-86 covers «Custom» too; one reading changes (see the row), and the control of the NO_SIM_ACTIONS test now declares the attributes. Logs in `~/.jjodel-lanes/P-2026-09-28-0100/`.
**Prompt document name**: 2026-09-28 01:00
**Ticket** (priority medium, carried from the P-2026-09-27 checker-gap entry, report F6). An `else` guard with no sibling is always true, silently. Question for Alfonso (RC-26). Recommended: amend R-SIM-31(1) so that an `else` with no sibling is a defect listed at Reset, rule R7 in `stcChecks.ts` with one new `CompileDefect.reason` literal (Rule 11), the run unchanged; no demo reading changes, since the only preset `else` (Flow B variant A, `f4`) has the sibling `f3`.
**Ticket** (priority medium, opened here). Outside the run the bag is still read raw: the panel builds its roles from it (`SimulationPanel.tsx` `mapStateToProps`: `eventSigOf`, `missingEngineRoles`, `invalidEngineRoles`), so with Trigger off and set the M1 panel offers event buttons the run has no alphabet for, and a stray `simArc` in a control-flow profile reads as an incomplete Petri net; `modelMarkings.ts` explores the Bound on the raw bag; the P2a producer reads it only to dedup parse errors (harmless). Pass them through `runBag`.
**Ticket** (priority low, opened here). A `derived` role is not resolved by the run either: in the control-flow system profiles Bound is derived (k = 1), yet a stored `simBound` still sets k. R-SIM-86 resolves `off` only.

## 2026-09-28 — task: the four demo projects built headless and exported for Alfonso's own Import (P-2026-09-28-1015)
**Prompt**: `claude_2026-09-28_1015_prompt_demo_prep_3001.md`, `~/jjodel-w-demoprep` on `demo-prep`. Prepare `DemoPEST`/`demoSM`, `DemoPetri`/`demoNet`, `DemoESM`/`demoESM`, `DemoFlowB`/`demoFlowB` (§2.1-2.4 of `docs/demo/models_2026_simulator_demo.md`), each its own project, empty bag; Cmd+S, one reload, the two initial readings; export one JSON per scene. Phase 1 (discovery) found writing into Alfonso's own 3001 browser session impossible (project data lives in `localStorage`, partitioned per browser profile; no CDP debug port already listening) and stopped with a question; RC-21 confirmed the fallback (headless build, JSON export, Alfonso imports).
**Files touched**: Docs, this commit: `docs/discovery/discovery_2026-09-28_demo_prep_3001.md` (§9 addendum), this entry, the Status of the prompt file. Scratch, not committed: driver `~/.jjodel-lanes/P-2026-09-28-1015/build_and_export.ts` and its gitignored copy `frontend/scripts/smoke/_tmp_P20260928_build_and_export.ts`, plus `_tmp_demo2_scenario.js`/`_tmp_sim3b_scenarios.js` copied from `~/jjodel-sim`. Deliverables outside the repo: four exports in `/Users/alfonso/jjodel-demo-exports/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — this lane changed zero files under `frontend/src`; all four builds measured identical, correct readings across four independent headless runs. One pre-existing console anomaly observed and logged as a ticket below, not caused by this lane.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — screenshot of `DemoPEST`'s metamodel canvas matches §2.1's shape (State/Initial/Terminal/Transition/Event, the three references) and the status bar reads "5 classes · 0 attributes · 0 operations · 0 enumerations · 3 references"; both panel readings (M2 `Custom · Not checkable` + `Missing:` line, M1 `Simulation not configured. Missing on <mm>: ...`) measured verbatim-equal to `docs/demo/models_2026_simulator_demo.md` on all four scenes, before and after the Cmd+S + reload round trip.
**Notes**: Built against trunk `447e4239bbc4b044bf42421bd4a0a718f84ed3b8` (`~/jjodel-release`, confirmed unmoved start to end). Exports: `scene_1_DemoPEST.json` md5 `b5c3b586dc4ca34ccc2c8d31af7c172e`, `scene_2_DemoPetri.json` md5 `f7dbc47d194700f0474b47fba8742aa6`, `scene_3_DemoESM.json` md5 `94cb2ef331e5d848b0cc818c37d894dc`, `scene_4_DemoFlowB.json` md5 `b8f38c77acf1fe542e057f42bdcff980`. Full per-scene counts and method notes in the discovery report §9.
**Prompt document name**: 2026-09-28 10:15
**Ticket** (priority low, opened here). Every run's return-to-project-summary navigation (during the headless build, not ordinary app use as far as measured) logged `wrong project setup in navbar {projectid: null, project: undefined}`, 3x, in `Navbar.tsx` per `chunk-RVSELR2N.js:17833`. No functional effect measured (every check after it still passed, all four scenes). Not reproduced through ordinary UI clicks; only through this lane's specific tab-then-list-card sequence. Worth a look if it turns out to reproduce on a normal click path.

## 2026-09-27 — discovery: the simulator backlog cut into parallel lanes (P-2026-09-27-1625)
**Prompt**: `claude_2026-09-27_1625_prompt_discovery_sim_backlog_lanes.md`, read-only discovery on `simulation-engine` in `~/jjodel-sim` at `8479b6242`: every open simulator item with its origin, files verified by reading, tests, size, RC-26 and demo impact, conflicts with E1 (`P-2026-09-27-1610`) and E2 (`P-2026-09-27-1611`); the items grouped into waves of lanes with disjoint file sets.
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (new), this entry, the Status of the prompt file. No source file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: no source file changed, no probe, no dev server. `check:docs` on this commit.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 24 items (S1-S24). Wave 1: `sim-binding-compat` (the only disjoint code lane) and six Phase 1 discoveries. Wave 2 split into 2a (after E1, whose two code commits exist) and 2b (after E2). E2's DOVE swaps two paths: `modelMarkings.ts` is under `sim/`, `stcFromRoles.ts` under `model/simulation/`. E1/E2 read from branch refs with `git show`. One closure commit as the prompt asks, not the inbox alone.
**Prompt document name**: 2026-09-27 16:25

## 2026-09-28 — merge: simulation-engine into alfonso-frontend-jjtl (P-2026-09-28-1300)
**Prompt**: `claude_2026-09-28_1300_prompt_merge_simulation-engine.md`, a direct merge by `lane-run merge --direct`, no session: `simulation-engine` at `f205a80d6` into `alfonso-frontend-jjtl`, merge base `2b1b346da`, 2 commits on the branch side.
**Files touched**: merge `3e141466d`: 3 files from the branch side (`docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-27_1625_prompt_discovery_sim_backlog_lanes.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `3e141466d` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5436 tests in 221 files, 9 red at import, hooks 333; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs-only merge, no UI change; gates green; the union inbox checked verbatim against both parents
**Notes**: Rollback tag `pre-simulation-engine` on `e2448cf61` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1300/result.json`.
**Prompt document name**: 2026-09-28 13:00

## 2026-09-28 — merge: demo-prep into alfonso-frontend-jjtl (P-2026-09-28-1236)
**Prompt**: `claude_2026-09-28_1236_prompt_merge_demo-prep.md`, a direct merge by `lane-run merge --direct`, no session: `demo-prep` at `e913101fb` into `alfonso-frontend-jjtl`, merge base `888ea9a9d`, 3 commits on the branch side.
**Files touched**: merge `63a80f62b`: 3 files from the branch side (`docs/discovery/discovery_2026-09-28_demo_prep_3001.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-28_1015_prompt_demo_prep_3001.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `63a80f62b` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5436 tests in 221 files, 9 red at import, hooks 333; build exit 0; check:docs exit 1; check:agents exit 0; check:scripts exit 0. The check:docs red (B, D) came from `docs/claude-code-log.md`, which the merge does not touch: 55 active entries and one entry spliced by the staging merge `447e4239b`. Fixed on the trunk by `559eb82c5` (rotation) and `e2448cf61` (both entries restored from the parents); check:docs 4/4 after.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: docs-only merge, no UI change
**Notes**: Closed by hand because `lane-run go` refuses a blocked merge. Rollback tag `pre-demo-prep` on `55c24d570` (RC-31). Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1236/result.json`.
**Prompt document name**: 2026-09-28 12:36

## 2026-09-28 — fix: panel badge and dialog pill share one verdict (P-2026-09-28-0140)
**Prompt**: `claude_2026-09-28_0140_prompt_sim_badge_pill.md`, two-phase lane on `sim-badge-pill` in `~/jjodel-w-badge` (cut at `d861cc922`). Phase 1 report `b08201f27`: five disagreeing inputs, two causes, the S11a verdicts and the bindings rule. Phase 2 after the chat's GO, every Recommended answer adopted (RC-21): Option B, the Rule 11 go-ahead, the pill's warning tokens, S6-S8 left out, no R-SIM-79 amendment, the M1 gate unchanged.
**Files touched**: report `b08201f27`: `docs/discovery/discovery_2026-09-28_sim_badge_pill.md` (new). Code `67659beb4`: `frontend/src/components/editor-v2/sim/simRoleStatus.ts` (`profileVerdict`, `VERDICT_LABEL`, `profileBindings`), `sim/simRolesDraft.ts`, `sim/SimulationPanel.tsx`, `sim/SimRolesModal.tsx`, `sim/simulation-panel.scss`, `frontend/src/model/simulation/profileCodec.ts`, tests `sim/__tests__/simRoleStatus.test.ts`, `model/simulation/__tests__/profileCodec.test.ts`. Docs, this commit: this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_badge_*` gitignored.
**Outcome**: ✅ completed
**Corregge**: 2026-09-27 17:40 (`claude_2026-09-27_1740_prompt_sim_modal.md`: its pill read the S11a verdicts and the panel's badge did not; its medium ticket, closed here)
**Causa**: (c)
**Regressions**: no. Baseline at `b08201f27`: typecheck exit 2, 14 errors; vitest on `editor-v2/sim` and `model/simulation` 688 passed, 24 files. On `67659beb4`: typecheck 14, set identical; 697 passed (688 + 9), 24 files; `npm run build` exit 0, 51 warning lines; `check:scripts` PASS; `check:docs` on this commit. Red first: 9 tests. Mutation bench 10/10 killed, in the body of `67659beb4`. Four demo scenes on 3034: 248 of 248 log lines identical to the trunk readings.
**Out-of-scope changes**: no. Eight paths, above the Rule 19 five: the list of report §6.2, approved by the GO and restated in chat before the first edit. No critical-zone file.
**Layer Impact Report**: not-required
**Smoke visivo**: lane probe `_tmp_badge_warn.ts` on 3034, 15/15 after and 3/15 before. Warn and incompatible bindings on DemoESM, light and dark, 1600x1000. Crops in `~/.jjodel-lanes/shots_badge/warn_after/` for the chat. Alfonso's visual GO pending; the branch does not merge before it.
**Notes**: R-SIM-79 not amended: its «mai with warnings» held only until the compatibility check existed, and S11a (`3d44abce0`) is that check. One docs commit, entry and Status, before the visual GO, as the prompt's Phase 2 orders (RC-17 puts it after the GO; the skill asks for the inbox alone). On ESM the warn badge wraps to a second line (report risk 3). One Petri canvas crop differs in bytes, not to the eye; every reading is equal.
**Prompt document name**: 2026-09-28 01:40
**Ticket** (priority low, opened here, Q3 of the report). The panel's «Checkable with warnings» and «Not checkable» share the amber tokens (`simulation-panel.scss` `&__badge`), so only the words tell them apart; the pill paints Not checkable grey. Moving the panel's not-checkable to the pill's grey changes the demo's `Custom · Not checkable`: after MODELS.
**Ticket** (priority low, opened here, Q6). The M1 gate stays presence-only (`missingEngineRoles`, D5). An incompatible binding, or the id of a deleted class, now reads «Not checkable» on the M2 face while the M1 face offers the run.
**Ticket** (priority medium, queued, Q4). S6, S7 and S8 stay in `sim-summary-fixes`, which queues behind this branch on `simRoleStatus.ts` and `SimulationPanel.tsx` (RC-22). Add to its list the S8 twin in the dialog: `SimRolesModal.tsx:408` reads `rows.length === 0` for an unreadable `simStateAttributes` too.
**Ticket** (priority low, opened here, found by the probe). On an incompatible verdict the pill's title still reads «Every required role is bound.» (`SimRolesModal.tsx:594`). That is true of the roles and says nothing of the verdict.
**Ticket** (priority low, opened here, report risk 5). A user profile stored twice under the old codec, in the note-first form, reads pending once more after this commit; Apply again settles it.

## 2026-09-28 — merge: sim-badge-pill into alfonso-frontend-jjtl (P-2026-09-28-1423)
**Prompt**: `claude_2026-09-28_1423_prompt_merge_sim-badge-pill.md`, a direct merge by `lane-run merge --direct`, no session: `sim-badge-pill` at `c111dd403` into `alfonso-frontend-jjtl`, merge base `d861cc922`, 5 commits on the branch side.
**Files touched**: merge `ca2ca7046`: 11 files from the branch side (`docs/discovery/discovery_2026-09-28_sim_badge_pill.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-28_0140_prompt_sim_badge_pill.md`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts`, `frontend/src/components/editor-v2/sim/simRoleStatus.ts`, `frontend/src/components/editor-v2/sim/simRolesDraft.ts`, and 3 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ca2ca7046` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5445 tests in 221 files, 9 red at import, hooks 333; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Alfonso passed the branch crops on 2026-09-28; gates green on the merge; the union inbox checked verbatim against both parents; the four scenes not re-run on 3001 by the chat
**Notes**: Rollback tag `pre-sim-badge-pill` on `cf39cdbcb` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1423/result.json`.
**Prompt document name**: 2026-09-28 14:23

## 2026-09-28 — feat: an else with no sibling is a defect at Reset, R7 (P-2026-09-28-0100)
**Prompt**: the chat's GO for ticket 2 of `claude_2026-09-28_0100_prompt_sim_bridge_off_else.md`, after Alfonso's «sì» (R-SIM-87, `docs/ratifiche/claude_ratifiche_2026-09-28_open_lanes_answers.md` point 2): fast-forward `sim-bridge-off-else` to the trunk tip, then rule R7 in `stcChecks.ts` with one new `CompileDefect.reason` literal, the run unchanged; no merge, stop at hard-stop.
**Files touched**: fast-forward to `e54999b0b` (`git merge --ff-only alfonso-frontend-jjtl`). Code `d1df46ab4`: `frontend/src/model/simulation/stcChecks.ts`, `__tests__/stcChecks.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`. Docs, this commit: this entry, the Status of the prompt file. `docs/decisions.md` untouched (R-SIM-87 is the chat's). Probes `_tmp_bridge_*`, gitignored.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — baseline at `e54999b0b`: typecheck exit 2, 14 errors; vitest on `model/simulation`, `editor-v2/sim`, `editor-v2/problems` 797 passed, 31 files. On `d1df46ab4`: typecheck 14, set identical; 802 passed (+5); `npm run build` exit 0, 50 warning lines; `check:docs` 4/4. Red first: 4, the variant A control green before and after. Bench 5/5 killed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3033 (DOM readings, not the RC-23 chat checklist): the four scenes and their Reset defect lines identical to this lane's first run, itself equal to P-2026-09-28-0023
**Notes**: The defect is a guard defect named by the edge that says `else` (a fused fork names its choice edge, `f4`, not `fk`), so the P2a registry receives it with no change there. `CompileDefect.reason` and `StcDefectReason` gain `'else-alone'` (Rule 11, R-SIM-87). The `?? t.id` fallback is unreachable: declared, not tested. Logs `probe-*-r7.log` in `~/.jjodel-lanes/P-2026-09-28-0100/`.
**Prompt document name**: 2026-09-28 01:00

## 2026-09-28 — merge: sim-bridge-off-else into alfonso-frontend-jjtl (P-2026-09-28-1539)
**Prompt**: `claude_2026-09-28_1539_prompt_merge_sim-bridge-off-else.md`, a direct merge by `lane-run merge --direct`, no session: `sim-bridge-off-else` at `b63c57571` into `alfonso-frontend-jjtl`, merge base `e54999b0b`, 2 commits on the branch side.
**Files touched**: merge `18620166a`: 6 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-28_0100_prompt_sim_bridge_off_else.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/model/simulation/stcChecks.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `18620166a` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5450 tests in 221 files, 9 red at import, hooks 333; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: R7 only adds a Reset defect for an else with no sibling; the lane measured the four scenes identical to the trunk on 3033; gates green on the merge
**Notes**: Rollback tag `pre-sim-bridge-off-else-P-2026-09-28-1539` on `0913b4c3f` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1539/result.json`.
**Prompt document name**: 2026-09-28 15:39

## 2026-09-28 — feat: input variables for the simulator, S1-S4 (P-2026-09-28-0034)
**Prompt**: Phase 2 of `claude_2026-09-28_0034_prompt_sim_input_variables.md` (GO in chat, R-SIM-88: option (a), Q1-Q4 as recommended): merge the trunk in, build S1 core and codec, S2 bridge, S3 UI, S4 docs as the report `discovery_2026-09-28_sim_input_variables.md` §5.5 plans, tests first, the four demo scenes on 3035, crops light and dark; no merge before 2026-10-04.
**Files touched**: merge `417b39053` (trunk `e54999b0b` in, no conflict). S1 `ffcd0d5ae`: `model/simulation/netTypes.ts`, `stateAttributesCodec.ts`, `netCompile.ts`, `netStep.ts`, `derivedEvaluator.ts`, `stcChecks.ts`, five of their tests. S2 `4884a57c3`: `editor-v2/sim/simBridge.ts`, `simRunState.ts`, `__tests__/simBridge.test.ts`. S3 `2033b731d`: `sim/SimInputDialog.tsx`, `SimInputDialog.scss`, `simInputs.ts`, `__tests__/simInputs.test.ts` (new), `SimRolesModal.tsx`, `SimRolesModal.scss`, `SimulationPanel.tsx`. S4 `b15fe4484`: `docs/spec/claude_spec_2026-09-13_computational_model.md`. This commit: this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14 after each slice, the §17 set (sorted diff empty). Sim directories 797 → 810 → 820 → 828; full vitest 5476 in 222 files, the 9 known red at import; build exit 0; check:docs 4/4. Four scenes on 3035, trunk sources (restored from HEAD after) against S3, logs normalized for pointer ids: identical but for ESM step 3, `FORM OPTIONS ["stored","derived"]` → `["stored","derived","input"]`.
**Out-of-scope changes**: yes. 22 files, all under `model/simulation/`, `editor-v2/sim/` and the spec. Outside the report's lists: `simRunState.ts` (the optional `SimRun.inputs`, S2) and `SimRolesModal.scss` (`__decl-void--value`, S3).
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe on 3035, not by hand): `_tmp_input_dialog.ts` light and dark, Step at 854.5 with the dialog open, Escape leaves the run, `false` fires Flow_2, input row height 89 as a stored row's; crops in `~/.jjodel-lanes/shots_input/` await Alfonso
**Notes**: Report §5-§6 lines moved on the merge 417b39053: simBridge.ts pressInput 884-893→907-916, explain 763-778→786-801, read-only 309-312→330-333, title 899-903→922-926; SimRolesModal.tsx form select 272-280→271-279, void cells 301-306→300-305; demo script :11-13→:12-13, :209→:213, :215→:219; the rest unchanged. Bench 35/35 killed, tables in the three code commits.
**Prompt document name**: 2026-09-28 00:34
**Ticket** (priority low, opened here, seen in `light_input_dialog_page.png`). The canvas ring of an enabled element (`simCanvasState.ts` `enabledElements`) reads the run's guards without inputs: at the DecisionNode, Flow_1 and Flow_2 wait for an input and show no ring. A waiting rule like `runStatus`'s, in its own lane.
**Ticket** (priority low, opened here). The form select keeps the aria-label `Stored or derived, state attribute n` while it offers `input`: the demo probes select it by that label. Rename with the probes after the demo.
**Ticket** (priority low, opened here, `dark_form_select_options.png`). In dark the disabled space select of an input row takes the global disabled look (navy); in light it shows no disabled state.
**Ticket** (priority low, opened here). An equation that reads a name some input has is a defect by name (`derivedEvaluator.ts`), as the presentation check: a stored attribute sharing an input's name on another metaclass is refused in equations.

## 2026-09-28 — merge: alfonso-frontend-jjtl into sim-input-variables (P-2026-09-28-1837)
**Prompt**: `claude_2026-09-28_1837_prompt_sim-input-variables_take_trunk.md`, full lane rendered by `lane-run merge --trunk-into` (RC-14): the trunk `alfonso-frontend-jjtl` at `7b3e1cae0` into `sim-input-variables` at `9f25631fa`, one merge `--no-ff`, base `e54999b0b`, 19 trunk commits (R7 R-SIM-87, harness-trace, lane-outcome-reminder); five conflicts, the four code ones resolved here by keeping both sides whole; hard-stop for the chat's visual probes, then this closure.
**Files touched**: merge `e259b94ec`: the trunk side's 22 paths; resolved in the lane: `docs/log-inbox/simulation.md` (union), `frontend/src/model/simulation/stcChecks.ts`, `model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e259b94ec`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 5520 passed in 224 files, as stated before the commit (trunk tip 5489 + 31 of the branch), the 9 known red at import; hook tests 343, the trunk's; build exit 0; check:docs 4/4; check:scripts PASS.
**Out-of-scope changes**: no. Above the five files of Rule 19 only through the merge: 22 paths from the trunk side, the five resolved ones listed above, all in the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat probes on `e259b94ec`, port 3035, light: SM 10 steps Terminated, Petri 4 steps Deadlock (ε: t2 false), ESM 10 steps Halted (coins 4), Flow B 6 steps Terminated, identical to the trunk; the input dialog opens on DecisionNode_0.decision, Escape leaves the run, false fires Flow_2, the run terminates
**Notes**: No hunk had the two sides contradict: each resolved file differs from each parent by exactly the other side's delta (numstat in the body of e259b94ec). stcChecks.ts: checkElse, then the R-SIM-88 functions; the reasons gain 'else-alone' and 'read-only'. Both test files: the trunk's R7 describe, then the branch's R-SIM-88 one. Trunk counts measured read-only in ~/jjodel-release (--no-cache, status identical). The merge carries docs and code, the RC-14 exception.
**Prompt document name**: 2026-09-28 18:37

## 2026-09-28 — merge: sim-input-variables into alfonso-frontend-jjtl (P-2026-09-28-1914)
**Prompt**: `claude_2026-09-28_1914_prompt_merge_sim-input-variables.md`, a direct merge by `lane-run merge --direct`, no session: `sim-input-variables` at `2230df5f1` into `alfonso-frontend-jjtl`, merge base `7b3e1cae0`, 11 commits on the branch side.
**Files touched**: merge `680af3bb2`: 26 files from the branch side (`docs/discovery/discovery_2026-09-28_sim_input_variables.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-28_0034_prompt_sim_input_variables.md`, `docs/prompts/claude_2026-09-28_1837_prompt_sim-input-variables_take_trunk.md`, `docs/spec/claude_spec_2026-09-13_computational_model.md`, `frontend/src/components/editor-v2/sim/SimInputDialog.scss`, `frontend/src/components/editor-v2/sim/SimInputDialog.tsx`, `frontend/src/components/editor-v2/sim/SimRolesModal.scss`, and 18 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `680af3bb2` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5520 tests in 224 files, 9 red at import, hooks 343; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat probes on e259b94ec (the branch tree, identical code to this merge), port 3035, light theme: the four demo scenes identical to the trunk, the input dialog end to end; merged before the freeze by Alfonso (R-SIM-88 amended)
**Notes**: Rollback tag `pre-sim-input-variables` on `016a03e86` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-28-1914/result.json`.
**Prompt document name**: 2026-09-28 19:14

## 2026-09-28 — fix: the M2 summary fixes S6, S7, S8 (P-2026-09-28-2000)
**Prompt**: `claude_2026-09-28_2000_prompt_sim_summary_fixes.md`, fast lane on `sim-summary-fixes` in `~/jjodel-w-summary` (cut from `alfonso-frontend-jjtl` at `247a93549`), no discovery, three defects confirmed still open by `discovery_2026-09-28_sim_badge_pill.md` §5.2: **S6** «Kept: Node» — `bindProfile` derived every dependent role from its own guess even when the bag kept a different Node or Transition, so the dependent proposals disagreed with the kept value; **S7** a stored `simEvent` left over from before R-SIM-38 is ignored (the class is always the Trigger's derived type) with nothing telling the user; **S8** the declarations hint tested `rows.length === 0` without `readable`, so an unreadable `simStateAttributes` value read as an empty, declarable table.
**Files touched**: S6 `83f5f9cca`: `frontend/src/model/simulation/profileBinder.ts` (`bindProfile` gains an optional `bag` parameter, additive), `__tests__/profileBinder.test.ts`, `frontend/src/components/editor-v2/sim/simRoleStatus.ts` (`profileBindings` threads it through), `SimulationPanel.tsx` and `SimRolesModal.tsx` (their `profileBindings` calls pass their own bag), `__tests__/simRoleStatus.test.ts`. S7 `ff9aef558`: `simRoleStatus.ts` (`staleEventWarning`, new export), `SimulationPanel.tsx` (reads the pre-derivation `simEvent` in `mapStateToProps`, renders the warning in `renderSummary()` next to the existing "stored profile is not readable" hint), `__tests__/simRoleStatus.test.ts`. S8 `434ba5a52`: `simRoleStatus.ts` (`declareHint` gains a `stateRows.readable` conjunct), `SimRolesModal.tsx` (twin, `rowsReadable = declRows !== null || storedRows.readable`), `__tests__/simRoleStatus.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, 14 errors, the §17 baseline set, unchanged before this lane and after each of the three commits; `npx vitest run src/model/simulation src/components/editor-v2/sim` 746 passed in 25 files on `434ba5a52` (739 before this lane's 7 new tests, derived from the diff since no other test file changed; 80 then 81 then 82 on the two directly-touched files after S6, S6+S7, S6+S7+S8 respectively); `npm run build` exit 0, the known chunk-size warning only. `check:docs` not yet run (pending the docs commit that carries this entry, see Notes).
**Out-of-scope changes**: no — six files, all in DOVE (`profileBinder.ts` + its tests for S6; `simRoleStatus.ts`, `SimulationPanel.tsx`, `SimRolesModal.tsx` + `simRoleStatus.test.ts` shared by the three), above the Rule 19 five, listed before the first edit; no critical-zone file (`useJjomSync.ts`, `portDistribution.ts` etc. untouched, none of §3.1).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — the prompt forbids this session from starting a dev server or a probe on this branch; the chat runs the four demo-scene probes (State machine, Petri net (P/T), Extended state machine, Flowchart / Activity) before merge. Each fix acts only on a bag the scenes never have: S6 only when a stored Node or Transition differs from the binder's own pick, which none of the four presets' Apply ever leaves (Apply writes the binder's own proposal, so kept-vs-proposed never diverges on a pristine preset); S7 only when the bag carries a leftover `simEvent` alongside a Trigger whose derived class differs, which no demo bag has (R-SIM-38 already stopped writing `simEvent`); S8 only when `simStateAttributes` is present and fails to decode, which none of the four scenes' bags do (empty or absent, or the valid JSON the declarations table writes).
**Notes**: `check:docs` and `check:agents` gates queued for the docs commit that carries this entry and the Status flip; not run standalone before it since this entry did not exist yet to lint.
**Prompt document name**: 2026-09-28 20:00

## 2026-09-28 — merge: sim-summary-fixes into alfonso-frontend-jjtl (P-2026-09-28-2143)
**Prompt**: `claude_2026-09-28_2143_prompt_merge_sim-summary-fixes.md`, a direct merge by `lane-run merge --direct`, no session: `sim-summary-fixes` at `f4528d984` into `alfonso-frontend-jjtl`, merge base `247a93549`, 5 commits on the branch side (S6, S7, S8 of P-2026-09-28-2000).
**Files touched**: merge `e70ee1aaa`: 8 files from the branch side (`frontend/src/model/simulation/profileBinder.ts`, `frontend/src/model/simulation/__tests__/profileBinder.test.ts`, `frontend/src/components/editor-v2/sim/simRoleStatus.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-28_2000_prompt_sim_summary_fixes.md`); this commit: this entry and the Status flip.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e70ee1aaa` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5527 tests in 224 files, 9 red at import, hooks 343, 5 failed; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0. The 5 failed are the same 5 before and after the merge (`vitest-before.json`, `vitest-after.json`): mutation kills in `traceIndex.test.ts` (2), `traceMonitor.test.ts` (2) and `laneRun.test.ts` (1, the monitor), red on the receiving tip `247a93549`, untouched by this branch.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: the four demo scenes probed on the branch in light theme (port 3036), 71 readings identical to the trunk run of the same evening once pointer ids are normalised (SM 10 steps Terminated; Petri 4 steps Deadlock · ε: t2 false; ESM 10 steps Halted, coins would be 4; Flow B 6 steps Terminated). Alfonso's walk on 3001 still due before the freeze.
**Notes**: Closed by hand because the worker stops on the pre-existing vitest red and `lane-run go` refuses a blocked merge. Rollback tag `pre-sim-summary-fixes` on `247a93549` (RC-31). Worker and gates: `~/.jjodel-lanes/P-2026-09-28-2143/result.json`. Chat C-2026-09-28-1936.
**Prompt document name**: 2026-09-28 21:43

## 2026-09-28 — fix: mixin owner is a warning, not incompatible (R-SIM-89) (P-2026-09-28-2230)
**Prompt**: `claude_2026-09-28_2230_prompt_sim_mixin_owner.md`, fast lane, light tier: `ActionElement.action` on a mixin (`ProcessNode extends Node, ActionElement`) never showed in the Entry select because `judge()`'s owner-context branch read an unrelated owner as incompatible even with a common concrete subclass. Implements R-SIM-89.
**Files touched**: discovery `18e63e184`: `docs/discovery/discovery_2026-09-28_sim_mixin_verdicts.md` (new); code `68dbbc1fb`: `frontend/src/model/simulation/bindingCompat.ts` (`judge()`'s owner-context branch, new `Index.hasCommonConcreteSubclass`, header comment), `frontend/src/model/simulation/__tests__/bindingCompat.test.ts` (new `MIXIN` fixture, `describe('owner roles: a mixin owner (R-SIM-89)')`, 3 tests), `frontend/src/model/simulation/__tests__/actionEvaluator.test.ts` (`CLASSES` extended with `C_ActionElement`/`C_ProcessNode`, `describe('Ex3: ...')`, 1 engine test); this commit: this entry, the Status flip.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck`: 14 errors, baseline set, unchanged. `npx vitest run src/model/simulation src/components/editor-v2/sim`: 25 files, 750 passed (746 before the 4 new tests, all green). The verdict table (`bindingVerdicts`) for all four MODELS demo metamodels is byte-identical before and after the fix (discovery report). Red first: the new `bindingCompat.test.ts` case ran against the reverted branch failed with `incompatible` where `warn` was expected, then passed after reapplying.
**Out-of-scope changes**: no — exactly the files DOVE listed.
**Layer Impact Report**: not-required — `bindingCompat.ts` is pure data/functions outside the sync/D-L critical zone (its own header comment); no `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx` or D-layer write path touched.
**Smoke visivo**: non applicabile — no dev server started this lane; the chat runs the four scene probes.
**Notes**: Demo exports under `~/jjodel-demo-exports/` are `DProject` records, not the raw idlookup `sketchOfMetamodel` needs; the verdict-table sketches were built from `docs/demo/models_2026_simulator_demo.md` §2.1-2.4 instead (declared deviation, discovery report §Finding 1). None of the four demo metamodels has multiple inheritance, so the new branch is dead code on all of them by construction, confirmed by the diff.
**Prompt document name**: 2026-09-28 22:30

## 2026-09-28 — merge: sim-mixin-owner into alfonso-frontend-jjtl (P-2026-09-28-2250)
**Prompt**: `claude_2026-09-28_2250_prompt_merge_sim-mixin-owner.md`, a direct merge by `lane-run merge --direct --chat C-2026-09-28-1936`, no session: `sim-mixin-owner` at `427b2090d` into `alfonso-frontend-jjtl`, merge base `d3dbacb36`, 5 commits on the branch side (R-SIM-89 of P-2026-09-28-2230 and the R-SIM-90 row).
**Files touched**: merge `2d73c73d5`: from the branch side `frontend/src/model/simulation/bindingCompat.ts`, its test, `actionEvaluator.test.ts`, `docs/decisions.md` (R-SIM-89, R-SIM-90), the discovery report `docs/discovery/discovery_2026-09-28_sim_mixin_verdicts.md`, `docs/log-inbox/simulation.md`, the lane prompt; this commit: this entry and the Status flip.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2d73c73d5` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5552 tests in 225 files, 9 red at import, hooks 344, 6 failed; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0. The 6 failed are the same 6 before and after the merge: the 5 trace/monitor mutation kills already red on `247a93549` and `checkRange` from the `log-addonly-gate` merge (ticket), none touched by this branch.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: the four demo scenes probed on the branch in light theme (port 3037), 71 readings identical to the trunk run of the evening once pointer ids are normalised. Alfonso's walk on 3001 still due before the freeze.
**Notes**: Closed by hand: the worker stops on the pre-existing vitest reds. Rollback tag `pre-sim-mixin-owner` on `95ff2ae75` (RC-31). Worker and gates: `~/.jjodel-lanes/P-2026-09-28-2250/result.json`. The lane built the verdict tables from the builder spec, not from the demo exports (they are DProject records); the probes cover the four scenes.
**Prompt document name**: 2026-09-28 22:50

## 2026-09-28 — discovery: four demo scenes read identical after the staging merge (P-2026-09-28-1025)
**Prompt**: `claude_2026-09-28_1025_prompt_scenes_after_staging_merge.md`, fast/light lane on `scenes-base` in `~/jjodel-w-scenes` (cut at `447e4239b`), read-only: measure whether the staging merge (ticket #157, 20 files under `frontend/src`) changed any of the four demo scenes against the known-good reading at trunk `888ea9a9d`, and check the Simulation panel still docks on both tabs for all four (the merge touches `Dock.tsx`, `DockManager.tsx`, `MyRcDock.tsx`, `Navbar.tsx`, `LeftBar.tsx`, `joiner/classes.ts`, `joiner/index.ts`).
**Files touched**: docs only, this lane: `docs/discovery/discovery_2026-09-28_scenes_after_staging_merge.md` (`69f7dbea1`), this entry. No `frontend/src` file read or written by this task; the four `_tmp_p1025_*` harness copies under `frontend/scripts/smoke/` are gitignored scratch (P14), not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nothing under `frontend/src` was touched; the four scenes and the docking check read identical to the `888ea9a9d` baseline.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe `_tmp_p1025_walk.ts` on 3029, one run per scene: SM 10 steps Terminated; Petri Bound 4, 4 steps, Deadlock · ε: t2 false; ESM 10 steps, halt line whole on two rows (`haltFit.whole: true`); Flow B 6 steps Terminated, `fin · count = 2`. `openModel()` (throws on a missing tab or chip) completed 16/16 calls across the four runs with no thrown error, so the Simulation panel docked and was readable on both tabs, all four scenes. Console: one `failed to get project {project: null}` per run, the known kind, no `pageerror`.
**Notes**: The prompt's background states 12 feature commits of #157; measured `git log --no-merges 888ea9a9d..447e4239b -- frontend/src` gives 14, all tagged `(#157)`. Does not change the verdict (behavioral, not a commit count) — see discovery report §1. Logs and crops in `~/.jjodel-lanes/shots_scenes_after_staging/`.
**Prompt document name**: 2026-09-28 10:25

## 2026-09-28 — merge: scenes-base into alfonso-frontend-jjtl (P-2026-09-28-2333)
**Prompt**: `claude_2026-09-28_2333_prompt_merge_scenes-base.md`, a direct merge by `lane-run merge --direct --chat C-2026-09-28-1936`, no session: `scenes-base` into `alfonso-frontend-jjtl`, 3 docs commits on the branch side (the report of P-2026-09-28-1025, four demo scenes read identical after the staging merge).
**Files touched**: merge `b0e4b9f15`: `docs/discovery/discovery_2026-09-28_scenes_after_staging_merge.md`, `docs/log-inbox/simulation.md` (union of the add-only inbox), `docs/prompts/claude_2026-09-28_1025_prompt_scenes_after_staging_merge.md`; this commit: this entry and the Status flip.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Docs only. Gates on `b0e4b9f15` in the worker: typecheck 14, the receiving tip's set; typecheck:scripts exit 0; vitest 5552 tests in 225 files, 9 red at import, 6 failed (7 before the merge, the known node and checkRange reds plus one flaky under load); build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: docs-only merge, no UI change
**Notes**: Merged on Alfonso's ok (2026-09-28). Closed by hand: the worker stops on the known vitest reds (ticket P-2026-09-28-2332). Rollback tag `pre-scenes-base` on `fb044365b`. Chat C-2026-09-28-1936.
**Prompt document name**: 2026-09-28 23:33

## 2026-09-27 — discovery: Moore/Mealy outputs and Accepting, S4 (P-2026-09-27-1725)
**Prompt**: `claude_2026-09-27_1725_prompt_discovery_sim_outputs_accepting.md`, read-only discovery on `sim-outputs-accepting` in `~/jjodel-w-outputs` at `6f83971cd`, wave 1 of the backlog report (S4): where R-SIM-50/51 and R-SIM-76 enter the configuration, the step and the marking line; what the four hidden presets need; the engine-first Phase 2 and the face slices; when the presets show (decision H).
**Files touched**: docs, this commit: `docs/discovery/discovery_2026-09-27_sim_outputs_accepting.md` (new), this entry, the Status of the prompt file. Probe `frontend/scripts/smoke/_tmp_outacc_probe.ts` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Read-only: no file under `frontend/src` written, `git status` empty after every probe run; probe `npx tsx`, `EXIT=0`, no dev server, port 3019 unused.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: DFA, NFA, Moore, Mealy run today as state machines, Checkable after Apply; the engine reads none of the three keys. Showing them needs the engine, the M2 rows (DFA without a Final class: Missing: Accepting, no row to set it) and S5 (SM then DFA: the kept Terminal ends the run). Two Phase 2 lanes: sim-outputs-engine (9 files), sim-outputs-faces (6, after S5). One RC-26 item: R-SIM-51 computed outputs. One docs commit, as the prompt asks.
**Prompt document name**: 2026-09-27 17:25
**Ticket** (priority medium, opened here, report §5.4). The `off`-key resolver (S5, `sim-off-resolver`) is a precondition of showing DFA, NFA, Moore and Mealy: `netStcFromRoles` reads every key regardless of the profile, so a metamodel switched from State machine to DFA keeps `simTerminal` live and the run ends `Terminated` on its accepting state, all inputs off (measured on `6f83971cd`).

## 2026-09-27 — feat: the engine reads Accepting and the role-bound outputs, S4 engine slice (P-2026-09-27-1725)
**Prompt**: Phase 2 GO of `claude_2026-09-27_1725_prompt_discovery_sim_outputs_accepting.md` (Alfonso 17:53, cascade after Phase 1), on `sim-outputs-accepting` in `~/jjodel-w-outputs`: the engine slice of the report (§9 lane 1, option E), role-bound outputs only (Alfonso 17:47); the face slice waits for sim-modal's merge; this branch merges after MODELS.
**Files touched**: code `ab4b8de8b`: `frontend/src/model/simulation/netTypes.ts`, `netCompile.ts`, `netStep.ts`, `roleCatalog.ts` (header comment), tests `__tests__/netCompile.test.ts`, `netStep.test.ts`, `roleCatalog.test.ts`. Docs, this commit: this entry, the Status of the prompt file. Probes `frontend/scripts/smoke/_tmp_outacc_*` gitignored.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Baseline at `0b098be01`: typecheck 14; vitest `src/model/simulation` 443 passed, 15 files. On `ab4b8de8b`: typecheck exit 2, 14 errors, set identical; vitest 454 passed (443 + 11), 15 files; `src/components/editor-v2/sim` 125 passed, 5 files; `npm run build` exit 0, 51 warning lines; `check:scripts` PASS; `check:docs` on this commit. Red first: 10 of 11. Mutation bench 18/18 killed.
**Out-of-scope changes**: yes — seven files, above the Rule 19 five: `roleCatalog.ts` (comment) and `roleCatalog.test.ts` (`NEW_KEYS` emptied, count 24 to 27) lie outside the GO's ownership map, approved at the question stop (answer: yes to both).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (engine only, nothing on screen changes); parity instead: the readiness-2 probes copied as `_tmp_outacc_demo_*`, vite on 3019, run lines identical to `/tmp/demo2_scratch`: SM 13/13, Flow B 11/11, Petri 22/22, ESM 12/12, each exit 0, one known console error.
**Notes**: Question stop on roleCatalog.test.ts:134, the source-text pin of «nothing reads the new keys», red by design (report §7 item 8); answered yes. M11 (origin read, fork node included) survived the first bench and was killed once the fixture's fork node carried the transition's attribute, as under a common superclass. The Mac shut down during the stop; the tree was intact at resume. The emptied NEW_KEYS leaves one roleCatalog test iterating nothing, kept as in E1.
**Prompt document name**: 2026-09-27 17:25
**Ticket** (priority medium, owed to the face slice, report §5.1 H8). `simAccepting` is not in the node sort of `ROLE_SORTS` (`stcFromRoles.ts:23-28`), so a class playing Accepting and Transition passes the overlap check; the line is E2's and the file was outside this lane.
**Ticket** (priority medium, for the chat). The R- rows of this slice (R-SIM-50 and R-SIM-51 implemented as written for the role-bound path, the three keys out of R-SIM-52's provisional list) are not written: the chat writes them (answer of the question stop).

## 2026-09-27 — docs: provisional R-SIM-86..88 for the outputs engine slice (P-2026-09-27-1725)
**Prompt**: resume of P-2026-09-27-1725 after Alfonso's «ok alle raccomandazioni» (2026-09-27 22:20): write in `docs/decisions.md` the rows the engine slice owes on R-SIM-50/51/52, provisional, unattended, pending Alfonso's ratification before the post-MODELS merge, with the measured evidence and what stays open. No code.
**Files touched**: docs, this commit: `docs/decisions.md` (section «corsia S4», R-SIM-86, R-SIM-87, R-SIM-88), this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Docs only, no source file changed; `check:docs` 4/4; em dash count on the added lines 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Numbered from 86: R-SIM-85 is on the trunk (sim-modal) and on no branch past it, measured by a grep of every local branch; a clash with a parallel lane is the later merge's to renumber, as for R-SIM-83/84. R-SIM-86 names the open overlap check (simAccepting outside ROLE_SORTS), owed to the face slice.
**Prompt document name**: 2026-09-27 17:25

## 2026-09-28 — merge: alfonso-frontend-jjtl into sim-outputs-accepting (P-2026-09-28-2305)
**Prompt**: `claude_2026-09-28_2305_prompt_sim_outputs_take_trunk.md`, full lane (RC-14, branch side): take the trunk at `fb044365b` into the S4 engine slice (`ab4b8de8b`), every conflict resolved keeping both sides, the three S4 rows ratified by Alfonso 2026-09-28, gates at the trunk's baseline; no merge into the trunk, no dev server, no probe.
**Files touched**: merge `813b1c058` (conflicts resolved: `frontend/src/model/simulation/__tests__/netCompile.test.ts`, `__tests__/netStep.test.ts`, `docs/log-inbox/simulation.md`, `docs/decisions.md`; auto-merged `netCompile.ts`, `netStep.ts`, `netTypes.ts`, each equal to both deltas); docs, this commit: `docs/decisions.md` (R-SIM-91..93 headers), this entry, the Status of `docs/prompts/claude_2026-09-28_2305_prompt_sim_outputs_take_trunk.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `813b1c058`: typecheck 14, the baseline set (14 before too); vitest `src/model/simulation` 17 files 518 tests and `src/components/editor-v2/sim` 8 files 243 tests, all green (the branch before the merge: 15 files, 454 tests); full vitest 5557 passed, 6 failed, 9 files red at import, the trunk's known set; build exit 0; check:addonly on the merge clean; docs:digest exit 0.
**Out-of-scope changes**: yes: in `docs/decisions.md`, beyond the three headers, the merge renumbered the S4 rows R-SIM-86..88 to R-SIM-91..93 (the trunk holds different R-SIM-86..88), with the section heading, two cross-references and a note of the original numbering in the section intro.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — no dev server by the prompt; the chat probes the four scenes after the hard stop.
**Notes**: R-SIM-50/51/52 themselves were ratified on 2026-09-25 and are unchanged: the rows the prompt names are the branch's S4 rows implementing them, provisional since `bdd11814c`. The 6 failed: 5 trace/monitor kills (green under `~/.local/bin/node` v26, red under the PATH node v23.3.0) and `checkRange`, which walks 8 first-parent commits here against 43 on the trunk and turns green once merged into it.
**Prompt document name**: 2026-09-28 23:05

## 2026-09-28 — merge: sim-outputs-accepting into alfonso-frontend-jjtl (P-2026-09-28-2343)
**Prompt**: `claude_2026-09-28_2343_prompt_merge_sim-outputs-accepting.md`, a direct merge by `lane-run merge --direct --chat C-2026-09-28-1936`, no session: `sim-outputs-accepting` at `97082df02` into `alfonso-frontend-jjtl`, after the branch took the trunk (P-2026-09-28-2305). The engine reads Accepting and the role-bound Moore and Mealy outputs (S4 of P-2026-09-27-1725); the branch rows are renumbered R-SIM-91..93 and ratified.
**Files touched**: merge `dfbd1ed3e`: from the branch side `frontend/src/model/simulation/netCompile.ts`, `netStep.ts`, `netTypes.ts`, `roleCatalog.ts` and their tests, `docs/decisions.md` (R-SIM-91..93), the S4 discovery report, `docs/log-inbox/simulation.md` (union of the add-only inbox), the lane prompts; this commit: this entry and the Status flip.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `dfbd1ed3e` in the worker: typecheck 14, the receiving tip's set; typecheck:scripts exit 0; vitest 5563 tests in 225 files, 9 red at import, 6 failed, the same 6 before and after the merge (the node-dependent trace and monitor reds and `checkRange`, ticket P-2026-09-28-2332); build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: the four demo scenes probed on the branch in light theme (port 3038), 71 readings identical to the trunk once pointer ids are normalised. The M2 rows and the faces of the outputs come with the next lane.
**Notes**: Closed by hand: the worker stops on the known vitest reds. Rollback tag `pre-sim-outputs-accepting` on `27badf6c2`. No `.smv` generation (deferred after Malaga). Chat C-2026-09-28-1936.
**Prompt document name**: 2026-09-28 23:43

## 2026-09-29 — feat: Entry, Exit, Action and Guard multi-valued, R-SIM-90 Phase 2 (P-2026-09-29-0010)
**Prompt**: `claude_2026-09-29_0010_prompt_sim_multi_roles_p2.md`, full lane on `sim-multi-roles-p2` in `~/jjodel-w-multi2` (from the trunk at `024d95345`): R-SIM-90 as planned by the discovery of P-2026-09-28-2306, its nine Recommended answers adopted by the chat under RC-21; tests first, one commit per layer (codec and NetStc, engine, verdicts, dialog), crops on a lane probe on 3039; no merge.
**Files touched**: `c6e28f893` `frontend/src/model/simulation/roleCatalog.ts`, `netTypes.ts`, `netCompile.ts` (type only), `__tests__/roleCatalog.test.ts`; `1bb05b781` `netCompile.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `SimulationPanel.tsx`, `__tests__/netCompile.test.ts`, `sim/__tests__/simBridge.test.ts`; `2fbb1fa97` `model/simulation/bindingCompat.ts`, `sim/simRoleStatus.ts`, `__tests__/bindingCompat.test.ts`, `sim/__tests__/simRoleStatus.test.ts`; `9ab66e047` `sim/simRolesDraft.ts`, `SimRolesModal.tsx`, `SimRolesModal.scss`, `sim/__tests__/simRolesDraft.test.ts`; docs, this commit: this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates green: typecheck 14, the known set (14 before); vitest `src/model/simulation` and `src/components/editor-v2/sim` 25 files, 802 tests (761 before), each layer red first; full vitest 5598 passed, 6 failed, 9 files red at import, the known set (checkRange, five trace/monitor node-version reds); build exit 0; 32 mutants killed, 1 equivalent. The four demo scenes' runs are not re-walked here: the chat's.
**Out-of-scope changes**: no. 16 files, above five: the discovery plan's 10 code and 6 test files, listed above and in chat before the first edit (Rule 19); no critical-zone file, `profileBinder.ts` and `simCheckToProblems.ts` unchanged (answers 7, 8).
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3039 (`lane-run probe`, light, RC-23): DemoESM Entry row 40 px, one select, no «+»; DemoMulti (DemoESM plus `State.log`, alone in its page) 13 of 13 DOM checks (tags, «+», keyboard, accessible names, no layout shift, Apply writes the JSON list); crops `docs/discovery/harness/_tmp_multi_*.png` (gitignored). The chat's GO pending.
**Notes**: Unattended choices: the list field is set for every bound multi role, a plain id giving a one-element list (one netCompile expectation updated); one tag shown, the rest +n (value column measured 366 px); the reasons and halt features decode a raw string too; commit type feat. Probe: two metamodels in one page give the known 6 ecore-loop error pairs, DemoMulti alone none. On DemoMulti the binder proposed State.entry (not a choice).
**Prompt document name**: 2026-09-29 00:10

## 2026-09-29 — ticket: the problems dedup reads only the first Guard or Action attribute
**Ticket**: `frontend/src/components/editor-v2/problems/simCheckToProblems.ts` (critical zone) drops a parse error that conformance already reports by the type of the role's first attribute (`featureOf`, `stc.guard`/`stc.action`/`stc.entry`/`stc.exit`). With R-SIM-90 a parse error in a second attribute of another type is dropped (Expression first, EString second) or shown twice (EString first, Expression second). The panel's defects line is unaffected. Left alone before the freeze (answer 8); needs a critical-zone go-ahead. Evidence: the discovery of P-2026-09-28-2306 §11 risk 3 (branch `sim-multi-roles`).
**Priority**: low
**Found in**: P-2026-09-28-2306

## 2026-09-29 — merge: sim-multi-roles-p2 into alfonso-frontend-jjtl (P-2026-09-29-0105)
**Prompt**: `claude_2026-09-29_0105_prompt_merge_sim-multi-roles-p2.md`, a direct merge by `lane-run merge --direct`, no session: `sim-multi-roles-p2` at `aa6b0897c` into `alfonso-frontend-jjtl`, merge base `024d95345`, 6 commits on the branch side.
**Files touched**: merge `8fdb5bf77`: 18 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-29_0010_prompt_sim_multi_roles_p2.md`, `frontend/src/components/editor-v2/sim/SimRolesModal.scss`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRolesDraft.test.ts`, and 10 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `8fdb5bf77` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5607 tests in 225 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat: four demo scenes probed on the branch in light theme (port 3041), 71 readings identical to the trunk after pointer normalisation; lane DOM checks 13/13; crops not viewed by the chat; Alfonso walk on 3001 still due
**Notes**: Rollback tag `pre-sim-multi-roles-p2` on `b6e9d82ef` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0105/result.json`.
**Prompt document name**: 2026-09-29 01:05

## 2026-09-29 — feat: the globals of a system declared in its model, R-SIM-94 Phase 2 (P-2026-09-29-0110)
**Prompt**: `claude_2026-09-29_0110_prompt_sim_data_level_p2.md`, full lane on `sim-data-level-p2` in `~/jjodel-w-datalevel2` (from the trunk at `174f6c58a`): R-SIM-94 as planned by §5 of the discovery of P-2026-09-29-0011; tests first, one commit per layer, a lane probe on 3040 with the ESM and Flow B declarations on the model tab; no merge.
**Files touched**: `b4fba8a39` `frontend/src/model/simulation/stateAttributesCodec.ts`, `__tests__/stateAttributesCodec.test.ts`; `59b020a5c` `frontend/src/components/editor-v2/sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`; `6c06503b7` `sim/SimRolesModal.tsx`; `35d0e19a2` `sim/SimDataModal.tsx` (new), `simBridge.ts`, `simBridge.test.ts`; `ef24c0a7c` `sim/SimulationPanel.tsx`; `812b17cab` `sim/simRoleStatus.ts`, `sim/__tests__/simRoleStatus.test.ts`; docs, this commit: this entry, the prompt's Status, `docs/discovery/discovery_2026-09-29_sim_data_level.md` (carried from `8db7cf475`, §8 appended).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the known set (14 before); vitest `src/model/simulation` and `src/components/editor-v2/sim` 25 files, 822 tests (802 before), each layer red first; full vitest 5627 passed, 9 files red at import, the known set; build exit 0; 16 mutants killed of 16 (codec 5, bridge 7, dialog 3, hint 1). The four demo scenes declared in the metamodel reach the script's readings on this branch (probe on 3040).
**Out-of-scope changes**: yes — the discovery report, which is not on this branch, carried verbatim from `sim-data-level` to hold §8 (an add/add with that branch if both merge); the Data note of the roles dialog (`SimRolesModal.tsx`) takes the hint's new text. 11 files, above five: the plan's list of §5, named in the prompt.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3040 (`lane-run probe`, light): ESM on the model tab 9 interactions, 34 keys, 10 events to Halted, coins would be 4; Flow B from the Reset line 5 and 4, 6 steps to Terminated, count = 2; Apply after a run interrupts it, one undo reverts it. Crops `docs/discovery/harness/_tmp_datalevel_*.png` (gitignored). The chat's GO pending.
**Notes**: Commit order SimRolesModal, SimDataModal, panel, hint (each needs the one before), not the prompt's. Unattended: the model key's defects read `model state attributes`, `model record N`; the Reset line's names become draft rows of the dialog; `Data…` is hidden when the profile turns the declarations off. Perceptual, for the GO: in the Data dialog Add attribute sits after the note, not at the right edge.
**Prompt document name**: 2026-09-29 01:10

## 2026-09-29 — merge: sim-data-level-p2 into alfonso-frontend-jjtl (P-2026-09-29-0214)
**Prompt**: `claude_2026-09-29_0214_prompt_merge_sim-data-level-p2.md`, a direct merge by `lane-run merge --direct`, no session: `sim-data-level-p2` at `08491af8e` into `alfonso-frontend-jjtl`, merge base `174f6c58a`, 8 commits on the branch side.
**Files touched**: merge `7cdf5d0f8`: 13 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-29_sim_data_level.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-29_0110_prompt_sim_data_level_p2.md`, `frontend/src/components/editor-v2/sim/SimDataModal.tsx`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7cdf5d0f8` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5627 tests in 225 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat: four demo scenes probed on the branch, light theme, port 3043: FINAL and RUN readings identical to the trunk; 12 M2 lines differ only by the added R-SIM-94 texts (a model globals go in its Data..., default for models); lane measured the model-tab route (ESM 9/34, Flow B 5/4) and undo in one step; Alfonso walk on 3001 still due
**Notes**: Rollback tag `pre-sim-data-level-p2` on `174f6c58a` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0214/result.json`.
**Prompt document name**: 2026-09-29 02:14

## 2026-09-29 — docs: the demo script declares data on the model tab, metamodel path as fallback (P-2026-09-29-0219)
**Prompt**: `claude_2026-09-29_0219_prompt_demo_script_data_level.md`, fast lane, docs only, on `demo-script-data-level` in `~/jjodel-w-demoscript`, bound by R-SIM-94. §2.3 (ESM) and §2.4 (Flow B) declare on the model tab with the texts and counts of discovery §8 (ESM through `Data…`, 9 interactions, 34 keystrokes, 0 scrolls; Flow B from the Reset line, 5 and 4), tagged P-2026-09-29-0110; the metamodel steps kept verbatim under a Fallback block; §1 one line on `Data…`; §4 the fallback rule.
**Files touched**: `docs/demo/models_2026_simulator_demo.md`, this entry, the Status line of the prompt. One docs commit, this one; the sha is in the closing report of the session.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — docs only; this lane ran no probe. Every new count and reading is quoted from §8, none re-measured. The rehearsal on 3001 is the check.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The M2 hint reads differently in code (`simRoleStatus.ts:495`, «(a model's globals go in its Data…):») than Apply step 2 of both scenes; left verbatim, flagged by a comment, to re-measure. The ESM `Undeclared` line was not walked (§8). Flow B's Reset is now the entry of the route, no longer optional.
**Prompt document name**: 2026-09-29 02:19

## 2026-09-29 — merge: demo-script-data-level into alfonso-frontend-jjtl (P-2026-09-29-0238)
**Prompt**: `claude_2026-09-29_0238_prompt_merge_demo-script-data-level.md`, a direct merge by `lane-run merge --direct`, no session: `demo-script-data-level` at `072c37bc9` into `alfonso-frontend-jjtl`, merge base `04c81327d`, 2 commits on the branch side.
**Files touched**: merge `c2560b69e`: 3 files from the branch side (`docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-29_0219_prompt_demo_script_data_level.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c2560b69e` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5664 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only, the demo script declares on the model tab, metamodel fallback kept; runs unchanged
**Notes**: Rollback tag `pre-demo-script-data-level` on `5aea64657` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0238/result.json`.
**Prompt document name**: 2026-09-29 02:38

## 2026-09-29 — discovery: the faces of Accepting and outputs, their M2 rows, the four hidden presets (P-2026-09-29-0239)
**Prompt**: `claude_2026-09-29_0239_prompt_discovery_sim_outputs_faces.md`, read-only discovery on `sim-outputs-faces-disc` in `~/jjodel-w-faces`: the three M2 rows, the three faces, S5 today, the four hidden presets, what the four demo scenes show differently, and a Phase 2 plan before the freeze of 2026-10-01.
**Files touched**: `docs/discovery/discovery_2026-09-29_sim_outputs_faces.md` (new), this entry, the Status line of the prompt. One docs commit; its sha is in the closing report. Probe `frontend/scripts/smoke/_tmp_faces_probe.ts`, gitignored.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only; no file under `frontend/src` written, `git status` clean before the commit.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The dialog already builds the three rows from the catalog; the four presets are hidden by `PANEL_PROFILE_IDS` and `UNREAD_ROLES`. S5 is covered by R-SIM-86 (measured). Phase 2: one lane, ten files. Two questions and two decisions in §0 of the report.
**Prompt document name**: 2026-09-29 02:39
**Ticket** (priority low, opened here). `simAccepting` is still missing from `ROLE_SORTS` (`stcFromRoles.ts:24-25`): a class playing Accepting and Transition passes the overlap check (R-SIM-91's open item, measured again). Owed to the faces lane.

## 2026-09-29 — feat: DFA, NFA, Moore, Mealy in the selects; the faces of Accepting and outputs (P-2026-09-29-0300)
**Prompt**: `claude_2026-09-29_0300_prompt_sim_outputs_faces_p2.md`, full lane on `sim-outputs-faces` in `~/jjodel-w-faces2` (from `904bab148`): the plan of the discovery of P-2026-09-29-0239, all of it, with its two decisions taken by the chat on Alfonso's delegation (R-SIM-95); tests first, one commit per layer, a lane probe on 3046; no merge.
**Files touched**: `8240715c3` `frontend/src/model/simulation/stcFromRoles.ts`, `__tests__/events.test.ts`; `1e8051c3e` `frontend/src/components/editor-v2/sim/simRoleStatus.ts`, `simRolesDraft.ts`, `sim/__tests__/simRoleStatus.test.ts`, `simRolesDraft.test.ts`; `d89ecce7b` `sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`; `f255d7d0c` `sim/SimulationPanel.tsx`; `c926d803a` `simBridge.ts`, `simBridge.test.ts`; docs, this commit: `docs/decisions.md` (R-SIM-95, add-only), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates green: typecheck 14, the known set (14 before); vitest `src/model/simulation` and `src/components/editor-v2/sim` 25 files, 839 tests (822 before), each layer red first; full vitest 5681 passed, 9 files red at import (`window is not defined`), the §17 set; build exit 0; `check:scripts` PASS. Unit tests pin the four demo presets (no key written, M1 lines unchanged); the scenes' parity re-run in the browser is the chat's.
**Out-of-scope changes**: no. 9 of the discovery's 10 files (`simulation-panel.scss` unchanged: no style needed), above Rule 19's five, listed in chat before the first edit; plus `docs/decisions.md`, named in the prompt. No critical-zone file; `RoleKey` +3 literals, additive.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3046 (`lane-run probe`, light), 34/34 DOM checks: eight presets in both selects; DFA `Running · accepting` on q1, gone on q0; Moore `Output: red`/`green` under Marking; Mealy output painted at 120px of 262; ESM fold `3 derived · 11 not used`; no height change from Reset through the steps. Crops `docs/discovery/harness/_tmp_faces_*.png` (gitignored). The chat's GO pending.
**Notes**: Unattended: Mealy takes the discovery's §3.4 fallback, `coin / unlock: t1 (…) fired`, after the probe measured `, output unlock` cut (304px in 262); Accepting follows Activity final in ROLE_SPECS (the G6 test pins Activity final after Terminal); the accepting mark keeps the status text's colour (the success token is below AA at 11px, light): perceptual, for the GO. Mutants 20/20 killed. The four demo scenes are not re-walked here.
**Prompt document name**: 2026-09-29 03:00
**Ticket** (priority low, opened here). `roleSections(profile, bag)` no longer reads `bag` now that `UNREAD_ROLES` is gone; the parameter stays (exported signature, Rule 9).

## 2026-09-29 — merge: sim-outputs-faces into alfonso-frontend-jjtl (P-2026-09-29-0348)
**Prompt**: `claude_2026-09-29_0348_prompt_merge_sim-outputs-faces.md`, a direct merge by `lane-run merge --direct`, no session: `sim-outputs-faces` at `0a84308a6` into `alfonso-frontend-jjtl`, merge base `c2560b69e`, 9 commits on the branch side.
**Files touched**: merge `42d7a08dd`: 14 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-29_sim_outputs_faces.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-29_0239_prompt_discovery_sim_outputs_faces.md`, `docs/prompts/claude_2026-09-29_0300_prompt_sim_outputs_faces_p2.md`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts`, and 6 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `42d7a08dd` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5685 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: four demo scenes re-run on 42d7a08dd port 3045: 65 run/panel readings identical to the 09-29 reference; dialog not-used folds +3 (Accepting, State output, Transition output) as the discovery predicted
**Notes**: Rollback tag `pre-sim-outputs-faces` on `91257e719` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0348/result.json`.
**Prompt document name**: 2026-09-29 03:48

## 2026-09-29 — fix: the low UI tickets of the simulator, four fixed, one question (P-2026-09-29-0356)
**Prompt**: `claude_2026-09-29_0356_prompt_sim_ui_tickets.md`, full lane on `sim-ui-tickets` in `~/jjodel-w-uitickets` (from the trunk at `42d7a08dd`): five low tickets of 2026-09-27..29, tests first, one commit each; T4 only if a decision or its origin states the wanted behaviour; a lane probe on 3047; no merge.
**Files touched**: T1 `bbfc3b54b` `frontend/src/components/editor-v2/sim/simRolesDraft.ts` (`pillTitle`), `sim/SimRolesModal.tsx`, `sim/__tests__/simRolesDraft.test.ts`; T2 `6bedfe1c2` `sim/simCanvasState.ts`, `sim/__tests__/simCanvasState.test.ts`; T3 `15f4fb1ae` `sim/SimRolesModal.tsx`; T5 `287461f8c` `frontend/src/pages/components/Navbar.tsx`; docs, this commit: this entry, the prompt's Status. Probes `frontend/scripts/smoke/_tmp_uitickets_*`, `_tmp_input_*` gitignored.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the known set (14 before); vitest `src/model/simulation` and `src/components/editor-v2/sim` 25 files, 849 passed (839 before); full vitest 5695 passed, 9 files red at import (`window is not defined`), the §17 set; build exit 0. Red first: T1 5 tests, T2 2 (3 more guard the fix), T3 and T5 in the browser. Mutants: T1 6/6, T2 7/7 killed.
**Out-of-scope changes**: yes. 6 code files, above five, listed in chat before the first edit: `simRolesDraft.ts` and its test are not named by T1's origin (`SimRolesModal.tsx:594`); the pure `pillTitle` lives there so the node bench runs it (P11). No critical-zone file.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3047 (`lane-run probe`, light), 5/5 DOM checks, T3 and T5 red before: pill «Incompatible: Initial (Flow is not a kind of Node).»; Flow_1 and Flow_2 ringed at the DecisionNode; «Form of state attribute n»; 0 navbar messages (6 before). Crop `docs/discovery/harness/_tmp_uitickets_after_ring_waiting.png` (gitignored). The chat's GO pending.
**Notes**: T4 left out, a question: its origin states today's by-name rule (derivedEvaluator.ts:428-462, as the presentation check), no decision row asks another. T5 reproduces on every dashboard load (3 messages), not only the ticket's sequence. Scenes: 36/36 RUN and FINAL lines equal to the chat's trunk_readings_2026-09-29; 11 dialog lines differ only by the 3 roles R-SIM-95 unhid. Logs: ~/.jjodel-lanes/P-2026-09-29-0356/.
**Prompt document name**: 2026-09-29 03:56
**Ticket** (priority low, opened here). The chat's probe kit selects the Data form select by its old name (`~/.jjodel-lanes/probe-kit/_tmp_input_walk.ts:460-461`, `_tmp_input_dialog.ts:58`, `:94`, `:102`); once this branch merges it must use «Form of state attribute n». This lane's copies accept both names.

## 2026-09-29 — merge: sim-ui-tickets into alfonso-frontend-jjtl (P-2026-09-29-0425)
**Prompt**: `claude_2026-09-29_0425_prompt_merge_sim-ui-tickets.md`, a direct merge by `lane-run merge --direct`, no session: `sim-ui-tickets` at `ca0f659f8` into `alfonso-frontend-jjtl`, merge base `42d7a08dd`, 6 commits on the branch side.
**Files touched**: merge `f573ac1e3`: 8 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-29_0356_prompt_sim_ui_tickets.md`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simCanvasState.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRolesDraft.test.ts`, `frontend/src/components/editor-v2/sim/simCanvasState.ts`, `frontend/src/components/editor-v2/sim/simRolesDraft.ts`, `frontend/src/pages/components/Navbar.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f573ac1e3` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5695 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: four demo scenes re-run on f573ac1e3 port 3045 with the probe kit on the new Form label: 73 readings identical to 09-29b; tickets 1,2,3,5 fixed, 4 a question for Alfonso
**Notes**: Rollback tag `pre-sim-ui-tickets` on `1430054fe` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-0425/result.json`.
**Prompt document name**: 2026-09-29 04:25

## 2026-09-29 — discovery: a reported false deadlock on a DemoPetri-like net is the guard (P-2026-09-29-0955)
**Prompt**: `claude_2026-09-29_0948_prompt_discovery_petri_false_deadlock.md`, read-only discovery on `petri-deadlock-disc` in `~/jjodel-w-petridl`: decide with measurements whether the Deadlock at `(0,2,1,0)` after `t1, t1, t3, t2` is a bug or DemoPetri's guard `p3.[tokens] < 1` on `t2`, and check the three candidate causes against the code.
**Files touched**: `docs/discovery/discovery_2026-09-29_petri_false_deadlock.md` (new), this entry, the Status line of the prompt. One docs commit; its sha is in the closing report. Probes `frontend/scripts/smoke/_tmp_petri_deadlock.ts` and `_tmp_petri_demo_read.mjs`, gitignored.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — read-only; no file under `frontend/src` written, `git status` clean before the commit; `netStep.test.ts` and `simBridge.test.ts` 174 passed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Not a bug: 12 bridge runs plus 2 controls reproduce the symptom only with the guard at k = 4; without it t2 fires to (0,0,2,0). Weight check is `>=`, capacity halts and never deadlocks, status is recomputed per press. k < 4 cannot give the reported steps 1-4. One question in §0: add «guard» to the reason text (`ε: t2 guard false`), amending R-SIM-58's example.
**Prompt document name**: 2026-09-29 09:48

## 2026-09-29 — merge: petri-deadlock-disc into alfonso-frontend-jjtl (P-2026-09-29-1030)
**Prompt**: `claude_2026-09-29_1030_prompt_merge_petri-deadlock-disc.md`, a direct merge by `lane-run merge --direct`, no session: `petri-deadlock-disc` at `315ed2377` into `alfonso-frontend-jjtl`, merge base `385807485`, 2 commits on the branch side.
**Files touched**: merge `2cffb33a4`: 3 files from the branch side (`docs/discovery/discovery_2026-09-29_petri_false_deadlock.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-09-29_0948_prompt_discovery_petri_false_deadlock.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2cffb33a4` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5709 tests in 226 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only, the false-deadlock discovery: not a bug, the guard; its prompt file is named _0948_ and carries ID P-2026-09-29-0955
**Notes**: Rollback tag `pre-petri-deadlock-disc` on `694049a1e` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1030/result.json`.
**Prompt document name**: 2026-09-29 10:30

## 2026-09-29 — fix: the deadlock reason names the guard, R-SIM-96 (P-2026-09-29-1022)
**Prompt**: `claude_2026-09-29_1022_prompt_sim_guard_word.md`, fast lane on `sim-guard-word` in `~/jjodel-w-guardword`, Question 1 of the false-deadlock discovery (P-2026-09-29-0955) answered «yes» by Alfonso: a guard-blocked transition reads `<id> guard false` in the line, the title keeps `false` and the source (R-SIM-62).
**Files touched**: code `6964c1511`: `frontend/src/components/editor-v2/sim/simBridge.ts` (`blocked()`, the short form), `sim/__tests__/simBridge.test.ts`. Docs, this commit: `docs/decisions.md` (R-SIM-96), `docs/demo/models_2026_simulator_demo.md` (§2.2 status line, §2.3 steps 1 and 3 and one bullet), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `6964c1511`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; sim folders 851 passed; `npx vitest run` 5711 passed, the 9 known files red at import (`window is not defined`); `npm run build` exit 0. Red first: 5 failed. Mutation bench 3/3 killed, list in the commit body.
**Out-of-scope changes**: no — 6 files, all in the prompt's DOVE, above the Rule 19 five, declared (RC-11). The short form also feeds the discard text (R-SIM-57): ESM steps 1 and 3 now read `push: discarded, tp guard false`, re-measured and written in the script.
**Layer Impact Report**: not-required
**Smoke visivo**: pending — chat, RC-23; lane probe on 3049 (`_tmp_guardword_probe.ts` over `_tmp_guardword_walk.ts`, gitignored), light: Petri FINAL `Deadlock · ε: t2 guard false`, title `ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]`, not clamped (173 px), list `ε: t2 (p2 ×2 → p3) false`, Step 854.5 to 830; SM, ESM, Flow B FINAL identical to P-2026-09-29-0110; 1 console error per scene, the baseline kind
**Notes**: Order when a guard and something else block t2: the preset is checked first (a short preset leaves no entry, `nothing enabled`), then the inhibitor (`inhibited by lock`, the guard not evaluated), then the guard. Unchanged: `defect, ...`, the `else` wording, and the unreachable fallback when no guard site fails (`t2 false`). ESM declared by the metamodel fallback; the model-tab route not re-run. Probe log `~/.jjodel-lanes/P-2026-09-29-1022/`.
**Prompt document name**: 2026-09-29 10:22
