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
