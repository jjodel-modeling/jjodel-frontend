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
