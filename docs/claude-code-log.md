# Claude Code Session Log

Newest-first per day (R-RAIL-45, docs/HARNESS-DOCS.md): a new entry goes right under this line. Never append at the bottom.

**Incidenti — sanatoria batch L1–L4 (2026-09-02).** Tre commit del batch portano un
contenuto che il loro messaggio non descrive. Nessun rewrite di history: e' stato un
rewrite su albero condiviso a causare il secondo incidente. Formato «SHA -> contenuto reale».

- `50de03252` — messaggio: «la entry SAVE1-bis, il timer che non sopravvive all'errore».
  Contenuto reale: la sola entry **DIRTY1**.
- `f278cf4fb` — messaggio: «la entry DIRTY1, scritta dalla corsia L4». Contenuto reale:
  le entry **SAVE1-bis + DIRTY1**, entrambe.
- `ed5c80daa` — referto UNQ1 C5 che cita l'hash del codice sbagliato (`46a38022`, tolto dal
  ramo dal `reset` di un'altra corsia). Corretto in `ca0adaf95`, che lo riporta a `4bde4359`.

**Incidente — discovery parallele del 2026-09-13.** Due sessioni sullo stesso albero, entry
scritte nello stesso file prima di committare.

- `46f4f584d` — messaggio: «the simulation engine state discovery and its log entry».
  Contenuto reale: il report del motore e **due** entry, la sua e quella della discovery JjEL
  (`claude_2026-09-13_0100_...`), gia' su disco al momento del commit.
- `2d420c64f` — il solo report JjEL; la sua entry era gia' in `46f4f584d`.
  Lezione: due corsie parallele committano il log una alla volta, ciascuna dopo aver riletto la
  testa; lo stesso file non si mette in due commit sovrapposti.

**Incidente — log committato da un'altra corsia, 2026-09-16.** `9f0843325`, messaggio «log entry for
the Create View gate fix»: contenuto reale **due** entry, la sua e quella della discovery
rail/modale, gia' in albero e non in stage al momento del commit. Stesso schema del 2026-09-13.
Nessun rewrite: la entry resta dov'e', il suo commit non la nomina.

## 2026-10-12 — merge: Alfonso's trunk into staging, his branch aligned by fast-forward (C-2026-10-12-1927)
**Prompt**: Juri in chat, no prompt file: «Fai pull di tutti i branch e: 1) mergia alfonso-frontend-jjtl su staging e 2) staging su alfonso-frontend-jjtl». Run in the main tree on `staging`. No hard stop between the report and the merge: the request was the merge itself (P4 derogated, flagged here).
**Files touched**: `2b61eeeb3`: `docs/discovery/discovery_2026-10-12_sync_alfonso_trunk.md`. `c2cf77016` (merge, 744 files of the other side; by hand: `docs/decisions.md`, `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/constants/defaultPrompts.ts`, `frontend/src/components/Jodie/__tests__/reservedIdentifierGate.test.ts`). This commit: this inbox. Refs, local only: `alfonso-frontend-jjtl`, `dotnet-backend-integration` and `master` fast-forwarded to their remotes before the merge; tag `pre-alfonso-frontend-jjtl-2026-10-12` on `2b61eeeb3`; `alfonso-frontend-jjtl` fast-forwarded to the tip of `staging` after this commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on the resolved trial tree `269dc1145`, equal to the tree of `c2cf77016` but for the report (`git diff-tree`): typecheck 14, the §17 list; vitest 360 files and 9005 tests green, red the 9 baseline files and `bashGuard.test.ts` (32, `MERGE_HEAD` present); build exit 0; check:docs 5/5; check:agents, check:scripts, check:addonly, check:codegen-lazy, typecheck:scripts exit 0. On `c2cf77016`: `bashGuard.test.ts` and `reservedIdentifierGate.test.ts` 180/180, check:addonly exit 0. The merged app was not opened in a browser.
**Out-of-scope changes**: yes — `reservedIdentifierGate.test.ts` is not a conflicted file: it pinned chat prompt version 6 and now expects 7. Six files by hand over three commits, above five (RC-11, rule 19): the report, the three conflicted files, that test, this inbox.
**Layer Impact Report**: not-required (no sync or D-L file edited by hand; the other side's commits carry their own)
**Smoke visivo**: non eseguito (build only)
**Notes**: Three conflicts: `decisions.md` by union, one import each side in `Jodie.tsx`, and two chat prompts v6, joined as v7 on the #178 precedent (`851dec87f`). That numbering was taken by the executor and is not ratified: question 1 of the report. Nothing pushed: `staging` and `alfonso-frontend-jjtl` wait for Juri's word. The inboxes of both lines are unfolded; the fold is a lane of its own at this alignment point.
**Prompt document name**: 2026-10-12 19:27
## 2026-10-12 — merge: feat/172-references-once into staging (P-2026-10-12-1639)
**Prompt**: `claude_2026-10-12_1639_prompt_merge_feat-172-references-once.md`, a direct merge by `lane-run merge --direct`, no session: `feat/172-references-once` at `6bad24e94` into `staging`, merge base `094c82bab`, 8 commits on the branch side.
**Files touched**: merge `26c795f80`: 14 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-10_172_references_once.md`, `docs/lir/lir_2026-10-10_172_fields_leave_form.md`, `docs/log-inbox/data-manager-ux.md`, `docs/prompts/claude_2026-10-10_1545_prompt_172_references_once.md`, `docs/ratifiche/claude_2026-10-12_memo_172_references_once.md`, `frontend/src/components/abstract/tabs/InstanceDetail.tsx`, `frontend/src/components/abstract/tabs/__tests__/instanceManager10c.test.ts`, and 6 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `26c795f80` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7992 tests in 322 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: the chat's independent probe (172_independent.mts) rerun on the merged tree on port 3173, 18/18, no page error: 0 form fields and 1 section per reference, the row menu by kind of slot, Remove leaves a hole, Link existing, the upper bound, the inline child; Juri's visual GO of 2026-10-12 was given on the lane tree, 9/9
**Notes**: Rollback tag `pre-feat/172-references-once` on `094c82bab` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-12-1639/result.json`.
**Prompt document name**: 2026-10-12 16:39
## 2026-10-12 — ticket: under a profile, «Link existing <Type>» opens an empty picker when the profile filters every candidate
**Ticket**: in the instance detail the foot of a reference section offers «Link existing <Type>» whenever the slot may take a link, without asking whether a candidate is left. Measured under the profile «Edu» (Badge `read`) on the stand-alone page, on `Session_0.badges`, an aggregation holding `B1` while a second Badge `B2` is free: the control is there and its picker prints «No Badge matches», no candidate. Controls of the same run: with no profile the picker offers `B2`; on the plain reference `learners` (target type `read`) the profile filters nothing and the four Learners are offered. The filter is `offerForProfile` (`formPermissions.ts:101-109`: into a slot that re-fathers, only free elements of an `edit` class). Where the measure is: arms B1, B2, B3 of the lane's probe `_tmp_172_probe.ts` (`ONLY=badges MODE=after`, gitignored), run 17 of `~/.jjodel-lanes/P-2026-10-10-1545/probe-_tmp_172_probe.log`. Read, not measured: before #172 the form field's picker took its candidates through the same filter (`IRForm.tsx`, its `offer`), so it would have opened empty too; the BEFORE fixture had no aggregation. Not changed here.
**Priority**: low
**Found in**: P-2026-10-10-1545

## 2026-10-12 — ticket: the chip picker of a multi-valued reference offers a target the slot already holds
**Ticket**: the picker `IRFormField` mounts for the chip input takes the candidates unfiltered (`IRFormField.tsx:505`, `options={getOptions()}`), while `ListWidget` filters them with `assignableOptions` (`ListWidget.tsx:74`): picking a target that is already linked appends it a second time (probe arm L6 of the BEFORE run, `[L1, HOLE, L3, L4, L1]`). #172 takes the reference fields out of the instance detail, and its «Link existing» does not offer a held target, so no mount of the form reaches the chip picker for a reference today. The widget path is not fixed.
**Priority**: low
**Found in**: P-2026-10-10-1545
**Detail**: docs/discovery/discovery_2026-10-10_172_references_once.md

## 2026-10-12 — ticket: form field, a 0..1 reference ends with two targets after an unset and a «New … & link»
**Ticket**: `IRFormField` reads and writes position 0 of a single-valued reference (`IRFormField.tsx:168`, `:403`), and the hosts' `createAndLink` appends (`ConfiguratorTab.tsx:315`, `InstanceManagerTab.tsx:2319`). After an unset the slot is `[HOLE]`; «New … & link» makes it `[HOLE, X]`; the field then shows «(empty)» and a pick writes `[Y, X]`: two targets in a 0..1 slot with three plain gestures (probe arms C3-C5 of the BEFORE run). #172 takes the reference fields out of the instance detail, whose section writes at the row's raw index, so no mount of the form reaches this today. Not fixed at the source: the field's position 0, and `createAndLink` appending after a hole.
**Priority**: low
**Found in**: P-2026-10-10-1545
**Detail**: docs/discovery/discovery_2026-10-10_172_references_once.md

## 2026-10-12 — feat(#172): a reference appears once in the instance detail, as its section
**Prompt**: `claude_2026-10-10_1545_prompt_172_references_once.md`, full lane, director Juri (chat `C-2026-10-10-1540`): Phase 1 (report, then addendum A on the row's menu), Juri's decisions of 2026-10-12, Phase 2 in three steps (the pure rule, the section takes the gestures, the fields leave the form).
**Files touched**: Phase 1 `b9a9be322`, `372da459a`: `docs/discovery/discovery_2026-10-10_172_references_once.md`. Step 1 `3a7543c1e`: `frontend/src/jjform/refSlot.ts`, `jjform/index.ts`, `jjform/__tests__/refSlot.test.ts`. Step 2 `7fb4c2fb5`: `components/abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/instanceManagerTab.scss`. `eddc5b2ad`: `docs/lir/lir_2026-10-10_172_fields_leave_form.md`. Step 3 `6cc99ca73`: `components/editor-v2/viewpoint/ir/IRForm.tsx`, `InstanceDetail.tsx`, `abstract/tabs/__tests__/instanceManager10c.test.ts`, `instanceManagerOutline.test.ts`. Docs: this inbox, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-09-18 17:35 (#142: the reference sections were added beside the form's reference fields)
**Causa**: (a)
**Regressions**: unknown — measured clean: probe `MODE=after STEP=3` 92/92 twice, identical, no page error (both hosts, subject and inline child, a profile, an authored view; the 25 gestures of the BEFORE oracle leave the same raw arrays); `tsc` 14, the baseline set; vitest 7992 green, the nine known files red; build exit 0. Not measured: a host refusal under a heading and a broken-pointer row (neither was produced in the browser), the canvas edges after a write from the section (the same `formWrite` calls as the field's).
**Out-of-scope changes**: no — eight code files, above five: the eight of the report's §11.1, confirmed by Juri (rule 19): `refSlot.ts`, `jjform/index.ts`, `refSlot.test.ts`, `InstanceDetail.tsx`, `instanceManagerTab.scss`, `IRForm.tsx`, `instanceManager10c.test.ts`, `instanceManagerOutline.test.ts`. No host file, no widget.
**Layer Impact Report**: produced (`docs/lir/lir_2026-10-10_172_fields_leave_form.md`, `eddc5b2ad`, before the diff of `IRForm.tsx`; go-ahead by Juri, R-REF-2)
**Smoke visivo**: passato — probe `_tmp_172_probe.ts` on this tree's dev server (port 3172) 92/92 twice, read from the DOM; `scripts/smoke/run.ts` on the same server GREEN (12 passed, 0 failed, 3 skipped). Juri ran the nine items of the checklist in his own browser on this tree's server on 2026-10-12 (Data Manager, Configurator, the stand-alone link of profile «Edu»): 9/9, GO in chat `C-2026-10-10-1540`; before it the chat's independent probe, 18/18, no page error.
**Notes**: Decisions R-REF-1..6 (memo claude_2026-10-12_memo_172_references_once.md). Two declared differences from the field's oracle: a held target is not offered (L6); a 0..1 slot never gets a second target (C5). Found by the probe, fixed in step 2: the menu's scroll listener starts one frame late. No unit test of the section (it does not import under node): the probe is its measure. Reported, true: in Basic a form whose only Basic feature was a required reference prints «No fields in Basic».
**Prompt document name**: 2026-10-10 15:45

## 2026-10-11 — merge: fix-subclass-edge-gesture into alfonso-frontend-jjtl (P-2026-10-11-1421)
**Prompt**: `claude_2026-10-11_1421_prompt_merge_fix-subclass-edge-gesture.md`, a merge in a lane-run session: `fix-subclass-edge-gesture` at `f6d2eacf4` into `alfonso-frontend-jjtl`, `--no-ff` of the explicit sha, merge base `cbbc1a204`, 8 commits on the branch side.
**Files touched**: merge `91be061fc`: 6 files from the branch side (`docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md`, `docs/log-inbox/subclass-edge-gesture.md`, `docs/prompts/claude_2026-10-11_1025_prompt_m1_edge_gesture_subclass_instances.md`, `frontend/scripts/probe/subclass-edge-gesture.ts`, `frontend/src/components/editor-v2/hooks/__tests__/useEditorMode.test.ts`, `frontend/src/components/editor-v2/hooks/useEditorMode.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `91be061fc` in the session: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8612 tests in 356 files (trunk tip 8604 in 355, plus the branch's 8 new in `useEditorMode.test.ts`, a new file, measured on `f6d2eacf4`), 0 failed, the same 9 red at import; hooks 654 in 12 files; build exit 0; check:docs 5/5; check:agents green; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso verified the fix visually on localhost:3110 at 14:21, reported by the chat in the GO; 14:21 precedes the merge commit, 14:26, so it checks the fix, not the merged tree on 3001)
**Notes**: Tip moved after the merge, docs-only, another chat: `4de76fb74` (P-2026-10-11-1430, one prompt file), accepted as trunk; this commit sits on it and leaves its file alone. Union: none; index tree = merge-tree `4d3b997e3`, probes 13/13. check:docs 5/5, not the prompt's 4/4 (Check E). No `pre-*` tag (not asked). Step 6 names `ec1a12ab0` as the pre-merge tip; the real one was `2da0ee1df` (template defect, not exercised).
**Prompt document name**: 2026-10-11 14:21
## 2026-10-11 — fix(editor-v2): superclass ids in the M2 signature, M1 gesture on subclass instances (P-2026-10-11-1025)
**Prompt**: `claude_2026-10-11_1025_prompt_m1_edge_gesture_subclass_instances.md`, full lane on `~/jjodel-w-subclassedge` (branch `fix-subclass-edge-gesture`): Phase 1 read-only, reproduce the inert M1 connect gesture on instances of a subclass added while the model tab is mounted, name the derived value; Phase 2 GO for fix F1 in the same session: test first, the fix, gates, the probe as acceptance, three tickets written here as text.
**Files touched**: `a9a66c4b6`: `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` (new). `3207576ca`, `3f2a3e81f`: `frontend/src/components/editor-v2/hooks/__tests__/useEditorMode.test.ts` (new). `2e16e257d`: `frontend/src/components/editor-v2/hooks/useEditorMode.ts`. `233f0b46b`: `frontend/scripts/probe/subclass-edge-gesture.ts` (new). This commit: this inbox file (new), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (six files over six commits, above five (rule 19), each named by the prompt or the GO; no critical-zone file)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe 45/0 on 3141; npm run smoke on 3141: run 1 red, empty-project not reached on a cold-server goto timeout, run 2 after a 77 s warm-up green 12/0/3; the chat's visual check is pending)
**Notes**: Cause: useEditorMode's memo key lacked `extends`; F1 adds the superclass ids. Test red 5/7, green 7/7, then 8/8; bench 5/5 killed (count-for-ids survived 7 tests, killed by 3f2a3e81f). tsc 14 = baseline; vitest: the 9 known import failures + laneBoard.test.ts (child status null under load; alone 66/66); build 0. 3f2a3e81f's subject is 76 chars, over 72, not rewritten. Commit types chosen by the session (none named).
**Prompt document name**: 2026-10-11 10:25

**Ticket** (medium; proposed title «M1 canvas: the modeInfo signature misses reference type, containment, bounds and `interface`»): `metamodelClassSignature` in `frontend/src/components/editor-v2/hooks/useEditorMode.ts` keys `modeInfo` on, per class, id, name, abstract, singleton, own reference and attribute names and (from F1) superclass ids. A reference retyped under the same name, a composition or aggregation toggle, a bounds change, the `interface` flag or an attribute's type, written while the model tab is mounted, leaves `modeInfo` on the old value, which the M1 connect gesture, the palette and the drop gates read. Same mechanism as this lane, read and not measured. Detail: report §5.2.

**Ticket** (low; proposed title «M1 canvas: xyflow refuses Transition→State over `target` after reopen»): measured in 4 of 4 probe runs (three before F1, one after), gesture B0t of `frontend/scripts/probe/subclass-edge-gesture.ts`: from a Transition's ghost source handle `left-0` to a State's `right-0` (type source), xyflow's connection reads `isValid: false`, so onConnect never fires and nothing is written; A0t (`left-1` → `right-0`) and B4 (`left-0` → `right-0`) are valid. No subclass involved, cause not investigated. Detail: report §5.3.

**Ticket** (low; proposed title «leftover `[BUG-DIAG-GUARD]` console.log in ConformanceGuard.ts»): `frontend/src/model/conformance/ConformanceGuard.ts:70` logs `[BUG-DIAG-GUARD] checkLinkCreation` on every M1 link creation, with its marker comment at `:47`; `CLAUDE.md` §2 removes instrumentation in a dedicated cleanup commit. Seen in the console of every probe run. Detail: report §5.5.

## 2026-10-11 — fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)
**Prompt**: GO of the chat for Phase 2 of `claude_2026-10-11_1135_prompt_new_model_instantiate.md`, scope F1 only: the key of `useEditorMode`'s memo carries containment and the other fields `resolveM1Info` reads, in a pure module with a unit test and a mutation bench; F2 and F3 out; gates; the probe rerun; hard stop for Alfonso's visual GO, no merge.
**Files touched**: `b08c92322`: `frontend/src/components/editor-v2/hooks/metamodelSignature.ts` (new), `hooks/useEditorMode.ts`, `hooks/__tests__/metamodelSignature.test.ts` (new). `c2666b3b2`: the report's addendum §8 and 3 assets. This commit: this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes — the report addendum and its assets are not named by the GO; the entry goes to this inbox, not to `docs/claude-code-log.md` (P9, parallel lanes); 8 files over three commits, above five (rule 19, RC-11); code is the three declared files
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe, unattended, 5 scenarios: uncontain 0/5 to 5/5, canvas Add on the first right-click 5/5, other rows unchanged; Alfonso's visual GO pending
**Notes**: Gates: new test 22/22; editor-v2/hooks 10 files 197 tests; tsc 14 = baseline; build 0; check:scripts PASS. Bench 11 mutants, 11 killed (composition, aggregation, type, bounds, interface, supertypes, all reference shapes, object pointers, subpackages, pointedBy). modeInfo reaches EditorV2 only; useJjomSync and useM1ReferenceEdges do not receive it. Not driven: containment set from the M2 properties panel (the probe uses the L-API).
**Prompt document name**: 2026-10-11 11:35
## 2026-10-11 — ticket: after a page load every user view and viewpoint reads as a system default
**Ticket**: A project opened by a page load has no `Pointer_ViewPointDefault` in `idlookup` (the record lives only in the boot seed, `store.tsx:247`). The guard at `reducer.ts:1110` then never closes and copies every DViewElement and DViewPoint into the `Defaults` maps: `Defaults.check` answers true, `ViewData.tsx:58` makes the views read-only, `view.tsx:655` refuses to delete them. This is the S4 finding «every view reads read-only in a new project», measured with its trigger. The fix is in the reducer (core, rule 5).
**Priority**: high
**Found in**: P-2026-10-11-1135
**Detail**: `docs/discovery/discovery_2026-10-11_new_model_instantiate.md` §3.2, §4 F2

## 2026-10-11 — docs(discovery): new model instantiate, not reproduced; stale canvas memo (P-2026-10-11-1135)
**Prompt**: `claude_2026-10-11_1135_prompt_new_model_instantiate.md`, full lane, Phase 1 on `~/jjodel-w-newinst` (branch `new-model-instantiate`): reproduce «a new project's model cannot instantiate its metaclasses» with a probe over every user path, check trunk / `pre-ir-graphvertex` / `pre-relayout-on-open`, root cause, fix proposal, hard stop.
**Files touched**: `309245922`: `frontend/scripts/probe/new-model-instantiate.ts` (new). `60e51a4a3`: `docs/discovery/discovery_2026-10-11_new_model_instantiate.md` (new), `docs/discovery/assets/new-model-instantiate/` (6 files: the probe log, four run JSONs, one screenshot). This commit: this inbox file (new).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: yes — the assets folder and this inbox are not named by the prompt; 9 files over three commits, above five (rule 19, RC-11); no file under `frontend/src/`
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Not reproduced: on a fresh project every path creates, 5 of 5 scenarios, on be556435b, 294a29084 and aa9fd6701 (3080); palette click is drag-only by design. Found F1: useEditorMode's signature lacks composition, so a containment switched off under an open model keeps its class out of palette and drop (0 of 5, since 2026-03-10). Read-only views after a page load confirmed, not blocking (ticket below). Partial: Alfonso's own steps unknown.
**Prompt document name**: 2026-10-11 11:35

## 2026-10-11 — ticket: leftover `[BUG-DIAG-GUARD]` console.log in ConformanceGuard.ts
**Ticket**: `frontend/src/model/conformance/ConformanceGuard.ts:70` logs `[BUG-DIAG-GUARD] checkLinkCreation` on every M1 link creation (marker comment at `:47`). Seen in the console of every probe run of P-2026-10-11-1025.

Already listed on 2026-07-26 in `docs/discovery/discovery_2026-07-26_debug_console_logs.md` (row `[BUG-DIAG-GUARD]`, option (c), left out of scope on purpose: outside editor-v2, possibly entangled with the `featureTrace` array built upstream). It was never removed nor tracked since. `CLAUDE.md` §2: instrumentation is removed in a dedicated cleanup commit; check whether `featureTrace` goes with it.
**Priority**: low
**Found in**: P-2026-10-11-1025
## 2026-10-11 — ticket: M1 canvas: xyflow refuses Transition→State over `target` after reopen
**Ticket**: Measured in 4 of 4 runs of `frontend/scripts/probe/subclass-edge-gesture.ts` (gesture B0t, three runs before the P-2026-10-11-1025 fix and one after): after reopening the model tab, dragging from a Transition's ghost source handle `left-0` to a State's `right-0` gives `isValid: false` in xyflow's connection state, so `onConnect` never fires and nothing is written. A0t (`left-1` to `right-0`) and B4 (`left-0` to `right-0`) are valid. No subclass is involved.

Seen only in the probe, not yet reproduced by hand; cause not investigated. First step: reproduce manually on the trunk.

Detail: `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` §5.3.
**Priority**: low
**Found in**: P-2026-10-11-1025

## 2026-10-11 — ticket: M1 canvas: the modeInfo signature misses reference type, containment, bounds and `interface`
**Ticket**: `metamodelClassSignature` in `frontend/src/components/editor-v2/hooks/useEditorMode.ts` keys the memoised `modeInfo` on, per class: id, name, abstract, singleton, own reference and attribute names, and (since P-2026-10-11-1025) superclass ids. It ignores a reference's type, containment (composition/aggregation), bounds, the `interface` flag and attribute types.

Editing any of these in the metamodel tab while the model tab stays mounted should leave `modeInfo` on the old value, which the M1 connect gesture, the palette and the drop gates read: same mechanism as the subclass bug fixed by P-2026-10-11-1025, which Alfonso reproduced by hand. This one is read from the code, not measured.

Detail: `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` §5.2.
**Priority**: medium
**Found in**: P-2026-10-11-1025

## 2026-10-11 — merge: do-tickets into alfonso-frontend-jjtl (P-2026-10-11-1300)
**Prompt**: `claude_2026-10-11_1300_prompt_merge_do-tickets.md`, a merge in a lane-run session: `do-tickets` at `3955f9f2b` into `alfonso-frontend-jjtl`, `--no-ff` of the explicit sha, merge base `e47e456b1`, 3 commits on the branch side.
**Files touched**: merge `75479afc6`: 3 files from the branch side (`docs/log-inbox/jjscript.md`, `frontend/src/jjscript/__tests__/parserTermination.test.ts`, `frontend/src/jjscript/parser/parser.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `75479afc6` in the session: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8604 tests in 355 files (trunk tip 8582 in 355, plus the branch's 22 new in `parserTermination.test.ts`, 22 to 44, measured on `3955f9f2b`), 0 failed, the same 9 red at import; hooks 654 in 12 files; build exit 0; check:docs 5/5; check:agents green; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (parser-only change, no rendering change; GO by the chat, unattended, lane auto: the gates are the check)
**Notes**: Tip moved twice, docs-only, other chats: `2e3927bdd` (codegen-check closure) before the merge, accepted as trunk, merge-tree re-measured on it (tree `343620292`, zero conflicts, probes 6/6); `6181c9fef` before this commit. Union: none. check:docs 5/5, not the prompt's 4/4 (Check E). P-2026-10-11-1145 still reads `Status: da eseguire`: the branch adds no prompt, its lane leaves the flip to the chat.
**Prompt document name**: 2026-10-11 13:00
## 2026-10-11 — fix(jjscript): block eval stops at end, a bare do fails a strict parse (P-2026-10-11-1145)
**Prompt**: `claude_2026-10-11_1145_prompt_jjscript_do_block_followups.md`, fast lane on `~/jjodel-w-dotickets`, branch `do-tickets`, unattended. The two tickets of P-2026-10-10-0810: `do eval x.name end` swallowed the block's `end`, a `let … in <non-command> end` error named `do`, a bare `do` parsed clean under strict. Tests first, fix in `parser.ts` only.
**Files touched**: `5ef4f9ebf`, `0641494c5`: `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/__tests__/parserTermination.test.ts`. This commit: `docs/log-inbox/jjscript.md`.
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 08:10 (`claude_2026-10-10_0810_prompt_jjscript_do_block_freeze.md`: its no-progress error named `do` for every block)
**Causa**: (a)
**Regressions**: unknown. typecheck 14, the §17 set; test file 44 of 44; jjscript vitest 595 passed in 23 of 24 files (context-binding red at import, known); build exit 0; the two AST snapshots unchanged; `validateScriptIntegrity` on multi-line do, forall and let scripts valid as on the base. Jodie's routing was not run in the app.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no rendering change; the detect path is the strict parse the tests run)
**Notes**: Deviation, the chat's answer (a), RC-21: a bare `do` fails only under strict. In both modes `validateScriptIntegrity` rejected every multi-line `do … end` script at line 1, since it parses line by line (measured). Side effect: under strict, `do create class A` without `end` is no longer a script. Base red: 16 of 44 on `e47e456b1`, 4 on `5ef4f9ebf`. Benches 4/5 (dropping `blockDepth--` equivalent), 3/3. Both tickets of P-2026-10-10-0810 closed.
**Prompt document name**: 2026-10-11 11:45

**Ticket** (low, observed, not changed): `parseEvalCommand` rebuilds the expression by joining token values with spaces, so `eval "a end b"` reaches JjEL as `a end b`, without its quotes, and `eval $x` as `$ x`. Pre-existing, at top level and in blocks alike; not measured whether JjEL evaluates either as meant.

## 2026-10-11 — merge: do-freeze into alfonso-frontend-jjtl (P-2026-10-11-0034)
**Prompt**: `claude_2026-10-11_0034_prompt_merge_do-freeze.md`, a merge in a lane-run session: `do-freeze` at `592b12e9e` into `alfonso-frontend-jjtl`, `--no-ff`, merge base `3099fb53c`, 2 commits on the branch side.
**Files touched**: merge `294a29084`: 3 files from the branch side (`docs/log-inbox/jjscript.md`, `frontend/src/jjscript/__tests__/parserTermination.test.ts`, `frontend/src/jjscript/parser/parser.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `294a29084` in the session: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8232 tests in 337 files (trunk tip 8210 in 336, plus the branch's 22 in 1 new file measured on `592b12e9e`), the same 9 red at import; hooks 603 in 10 files; build exit 0; check:docs 5/5; check:agents green; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, smoke on 3001, 2026-10-11
**Notes**: merge-tree zero conflicts, tree `6804b284d` equal to the merge's index tree. Union: none. Probes: 21 decision rows once, control R-GEN-17 absent at the merge; 80 headings once. check:docs counted 5/5, not the prompt's 4/4 (Check E). The lane's prompt P-2026-10-10-0810 still reads `Status: da eseguire`: the Status precondition was read on the prompts the branch adds (none), as in `72762297b`. Not flipped here.
**Prompt document name**: 2026-10-11 00:34

## 2026-10-11 — merge: jjodie-reserved into alfonso-frontend-jjtl (P-2026-10-11-0023)
**Prompt**: `claude_2026-10-11_0023_prompt_merge_jjodie-reserved.md`, a merge in a lane-run session: `jjodie-reserved` at `e5d95a99c` into `alfonso-frontend-jjtl`, `--no-ff`, merge base `571392718`, 6 commits on the branch side.
**Files touched**: merge `72762297b`: 11 files from the branch side (`docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md`, `docs/log-inbox/jjodie-reserved.md`, `frontend/src/components/Jodie/Jodie.tsx`, `Jodie/__tests__/reservedIdentifierGate.test.ts`, `Jodie/reservedIdentifierGate.ts`, `frontend/src/constants/defaultPrompts.ts`, `frontend/src/jjscript/__tests__/reservedIdentifiers.test.ts`, `jjscript/components/ScriptBlock.tsx`, `jjscript/parser/lexer.ts`, `jjscript/reservedIdentifiers.ts`, `jjscript/types.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `72762297b` in the session: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8210 tests in 336 files (trunk tip 8180 in 334, plus the branch's 30 in 2 new files measured on `e5d95a99c`), the same 9 red at import; hooks 603 in 10 files; build exit 0; check:docs 5/5; check:agents green; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, smoke on 3001, 2026-10-11
**Notes**: merge-tree zero conflicts, tree `a4074da24` equal to the merge's index tree. Union: none. Probes: 21 decision rows once, control R-GEN-17 absent at the merge; 79 headings once. check:docs counted 5/5, not the prompt's 4/4 (Check E). No rollback tag (not asked). The lane's prompt P-2026-10-10-0045 still reads `Status: da eseguire`; not flipped here.
**Prompt document name**: 2026-10-11 00:23

**Ticket** (low, lane-run template): step 6 of `frontend/scripts/lane-templates/merge-into-trunk.md` renders the `check:addonly` fallback as `git reset --hard {{trunkTip}}`, «the pre-merge tip»; `{{trunkTip}}` is the parent of the prompt's own commit, so the reset would also drop the prompt. Here `dfdef69f1` against a real pre-merge tip `7b670fc45`. Not exercised: check:addonly passed.
## 2026-10-11 — fix(ir): a frame follows its child while the pointer is in a band (P-2026-10-11-1156)
**Prompt**: correction of P-2026-10-11-1156 after Alfonso's visual check (15:58): a dragged child grew the frame a few pixels, then left it. The follow test reads the cursor against the container's box at rest grown by a 32 px band; band and leave cases in the unit tests and in drag4; reruns, gates, R-GV-17 and spec §12 amended, hard stop for the visual GO.
**Files touched**: `efb97f948`: `viewpoint/ir/irContainment.ts`, `EditorV2.tsx`, test irContainerLayout. `dda304dbb`: that test. `76f741e2a`: `frontend/scripts/probe/bpmn-lanes-fixture.ts`. `23f78e4c8`: spec addendum §12, `docs/decisions.md` R-GV-17, `docs/discovery/assets/graphvertex-drag4/`. This commit: R-GV-17 rewrapped, this inbox entry.
**Outcome**: ⚠️ partial
**Corregge**: 2026-10-11 11:56 (`claude_2026-10-11_1156_prompt_gv_drag_frame.md`, the frame's follow test)
**Causa**: (d)
**Regressions**: unknown. tsc 14 = the §17 set; full suite 8570, 9 known import failures; build 0; check:docs 5/5; check:scripts 82. Probes (tag band): BPMN 104/106 with S2, S3, S6 and carry; statechart 77/82 with S2b 7/7 and S6 3/3; hull shots byte-identical, S6 flat and hull as the base. Unmeasured: derived viewpoints.
**Out-of-scope changes**: yes (`EditorV2.tsx`: the GO named `irContainment.ts` only, and the cursor reaches the pass only from React Flow's `onNodeDrag`)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probes on 3123-3124, light theme, `docs/discovery/assets/graphvertex-drag4/` (tag band); Alfonso's visual GO pending (RC-23)
**Notes**: Unit: 5 of the 7 band tests red on the previous module, 2 controls; bench 4/4. Reds: BPMN Ship dragged up into Sales and the 4 statechart ones, all the open tight-packing ticket; a relayout red was a fixture flake (rerun 7/7). The drop target is still read on the node's centre (S3): a press far from it, past the band, keeps the child where its centre stays in the box at rest.
**Prompt document name**: 2026-10-11 11:56
## 2026-10-11 — ticket: a child dragged out of a none container is framed again after the drop
**Ticket**: with membership `none` (the statechart fixture), the frame stops following a child once the pointer leaves the box it had at rest, so the drag shows the child leaving; the drop is a plain move and the model is untouched, so the child is still a member and the frame, derived from its members, takes it back in at rest (Fetch dropped below Active: Running grows down to it). Measured by SC-fetch-out and SC-waiting-out of drag4.
**Priority**: low
**Found in**: P-2026-10-11-1156
**Detail**: docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md

## 2026-10-11 — ticket: regions packed edge to edge cannot grow across their shared border
**Ticket**: R-GV-17 grows a partition against the stack by moving the border with its neighbour, and the neighbour cannot give room its own children need. In the statechart fixture A1 and A2 meet with exactly 16 + 16 px between Waiting and Running's frame, so Fetch dragged 40 px up in Running, or Waiting 40 px down in A1, leaves A2's top gap at −24 and −16 px (4 reds of drag4). The earlier partition keeps its children by rule; whether a pushed partition should carry its children instead is open.
**Priority**: medium
**Found in**: P-2026-10-11-1156
**Detail**: docs/discovery/assets/graphvertex-drag4/statechart-drag4-relayout-statechart-s6-after.json

## 2026-10-11 — fix(ir): graphVertex frame follows a dragged child on four sides (P-2026-10-11-1156)
**Prompt**: `claude_2026-10-11_1156_prompt_gv_drag_frame.md`, full lane on `~/jjodel-w-gvdrag` (`gv-drag-frame`): probe first (drag4, relayout), the four-side frame, a size set by hand as a floor, the pool record after Auto layout; LIR and question on `canvasToJjom.ts`, go-ahead by Alfonso 14:23 (one function), resumed by hand after the RC-19 hook; spec §12, R-GV-17, hard stop for the visual GO.
**Files touched**: `2d2f75846`: `viewpoint/ir/` irPartitions, irContainment, tests irPartitions, irContainerLayout. `18569bcc3`, `d7b6914a4`: `EditorV2.tsx`, `sync/canvasToJjom.ts`, test syncPositionBatch (new). `7b23cfa74`: that test. `6fdf5be0d`: probes bpmn-lanes-fixture, statechart-fixture. `74ce6c94f`, `879276a2a`: LIR (new), `docs/discovery/assets/graphvertex-drag4/`, spec addendum §12, `docs/decisions.md` R-GV-17. This commit: this inbox file.
**Outcome**: ⚠️ partial
**Corregge**: 2026-10-10 01:05 (`claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`, slices S2 and S6)
**Causa**: (c)
**Regressions**: unknown. tsc 14 = the §17 set; full suite 8563, 9 known import failures; build 0; check:docs 5/5; check:scripts 82. Probes base→after: BPMN drag4+relayout+carry 36/55→55/55, statechart 41/52→48/52; S2, S3, S6 (rerun 6/6), S2b 7/7 green; S1 hull shots byte-identical; S6 flat as base. Unmeasured: derived viewpoints.
**Out-of-scope changes**: yes (`canvasToJjom.ts`, granted mid-lane; two temporary worktrees at the base, removed; 13 files and the assets folder over 8 commits, above five)
**Layer Impact Report**: produced
**Smoke visivo**: passato — lane probes on 3121-3124, light theme, `docs/discovery/assets/graphvertex-drag4/`; Alfonso's visual GO pending (RC-23)
**Notes**: Partial: 4 statechart reds are the open ticket below, (a) second. Closes the ticket «Auto layout writes a grown pool's size with its old position» (P-2026-10-11-0040): relayout 4/4. `lane-run ticket` closes only through `--backfill --plan`, which syncs every block to GitHub: not run. Bench: 20/20 on the frame; batch 4/5, B3 not re-run (shell edit of canvasToJjom.ts denied). Detail: `docs/lir/lir_2026-10-11_gv_drag_frame_box_write.md`.
**Prompt document name**: 2026-10-11 11:56

## 2026-10-11 — merge: ir-graphvertex into alfonso-frontend-jjtl (P-2026-10-11-0059)
**Prompt**: `claude_2026-10-11_0059_prompt_merge_ir-graphvertex.md`, a direct merge by `lane-run merge --direct`, no session: `ir-graphvertex` at `aa9fd6701` into `alfonso-frontend-jjtl`, merge base `dfdef69f1`, 41 commits on the branch side.
**Files touched**: merge `eb5600dbb`: 110 files from the branch side (`docs/decisions.md`, `docs/discovery/assets/graphvertex-s2/bpmn-after-light-clean.png`, `docs/discovery/assets/graphvertex-s2/bpmn-after-light.png`, `docs/discovery/assets/graphvertex-s2/bpmn-before-light-clean.png`, `docs/discovery/assets/graphvertex-s2/bpmn-before-light.png`, `docs/discovery/assets/graphvertex-s2/demos-before.json`, `docs/discovery/assets/graphvertex-s2/hull-collapsed-after-light.png`, `docs/discovery/assets/graphvertex-s2/hull-collapsed-before-light.png`, and 102 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `eb5600dbb` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8438 tests in 347 files, 9 red at import, hooks 603; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Alfonso visual GO 2026-10-11 00:03 on ir-graphvertex; fixtures re-run on 7523373cb (BPMN 31/31, statechart 7/7)
**Notes**: Rollback tag `pre-ir-graphvertex` on `294a29084` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-0059/result.json`.
**Prompt document name**: 2026-10-11 00:59

## 2026-10-11 — merge: ir-graphvertex takes alfonso-frontend-jjtl (P-2026-10-11-0011)
**Prompt**: `claude_2026-10-11_0011_prompt_ir-graphvertex_take_trunk.md`, full lane rendered by `lane-run merge --trunk-into`, a lane-run session in `~/jjodel-w-graphvertex` on `ir-graphvertex`: RC-14, the trunk at the explicit sha `dfdef69f1` into the branch with one `--no-ff` merge, base `f753bf0d9`, 34 trunk commits against 38 on the branch and this prompt on top; hard stop for the visual GO, then this closure.
**Files touched**: merge `7523373cb`: the 45 files of the trunk side; `docs/decisions.md` resolved by union (the one hand-resolved hunk), `frontend/src/components/editor-v2/EditorV2.tsx` auto-merged. This commit: the Status of this prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7523373cb`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 8386 passed in 344 files, 0 failed, the 9 §17 files red at import (expected: trunk tip 8180 in 334 files, measured read-only in `~/jjodel-release`, minus 286 in the 3 test files the branch modifies, plus 492 in the branch's 13 test files); hooks 603 in 10 files (trunk 603, the branch adds none); build exit 0; check:docs 5/5; check:scripts PASS 80 files; check:addonly PASS.
**Out-of-scope changes**: no. The merge carries 45 files, above five (RC-11), all the trunk side's.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — the chat re-ran the fixtures on `7523373cb`: BPMN 31/31 with S3, S6 and the hull/flat controls, statechart 7/7; Alfonso's visual GO of 2026-10-11 00:03 stands, the trunk delta being codegen only
**Notes**: merge-tree: 1 conflict, docs/decisions.md, resolved by union, R-GEN-16 (trunk) then the R-GV section (branch), verbatim: 5933 lines = base 5837 + 9 + 87, nothing deleted; read in its changed region, the rest shown equal to the base. EditorV2.tsx read end to end: branch tip plus the trunk's 59 Code-pill lines. Probes 41 of 41 once, control R-GEN-17 0. check:docs 5/5, not 4/4: Check E is in the base (73af7bbac). No rollback tag.
**Prompt document name**: 2026-10-11 00:11

## 2026-10-11 — ticket: req-trace marks R-JS-7 superseded by a false positive
**Ticket**: `linkKind` (`frontend/scripts/req-trace.mjs:125`) matches `/supersed/` anywhere in the clause before an id, so R-JS-8's «a superseded `set` not retried, at most 3 retry passes, R-JS-7 wait» marks R-JS-7 `superseded` (`:249`), though R-JS-8 cites it as in force; the status reaches the tab and the descriptions. Separately, `parseRegister` cuts some rows at a blank line or a sub-bullet (R-STR-7 loses its «Sciolta» paragraph, R-VP-60 its withdrawal note), so a reader of the rows misses the closing state.
**Priority**: medium
**Found in**: P-2026-10-11-2230
## 2026-10-11 — ticket: a prompt that names cluster keys moves the clusters
**Ticket**: req-trace builds the co-citation graph from every non-merge prompt in `docs/prompts/` citing at most 25 rows, so a harness prompt that lists cluster keys (P-2026-10-11-2230 names 13) adds a clique among them and moves the Louvain partition it asks to describe: R-A split into R-A (27) and R-DEAD-1 (48), R-GV-16, R-IRN-3, R-JS-1..7, R-LAY-19 and R-UNDO-1..7 pulled into R-A. Measured by re-running `clusterRows` with and without that one file. Fix options: exclude prompts of the harness front from co-citation, or have refresh prompts not name row ids.
**Priority**: medium
**Found in**: P-2026-10-11-2230

## 2026-10-11 — docs(goals): refresh drifted cluster descriptions (P-2026-10-11-2230)
**Prompt**: `claude_2026-10-11_2230_prompt_cluster_descriptions_refresh.md`, lane fast, unattended: rewrite the drifted and missing cluster descriptions in `docs/goals/cluster-descriptions.json` from the member rows, fold the orphans, RC-27 check by a fresh-context agent, gates, one docs commit.
**Files touched**: `docs/goals/cluster-descriptions.json` (`53c5e492c`, shortened in `b12def15d`); this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: 2026-10-11 15:10 (`claude_2026-10-11_1510_prompt_cluster_descriptions.md`: its descriptions drifted after P-2026-10-11-2025; R-JS-1's text called R-JS-7 superseded)
**Causa**: (f)
**Regressions**: no. Gates on `b12def15d`: the file parses; req-trace `--no-cache`: 15 clusters, 0 drift, 0 orphans; the 7 descriptions of this lane 461 to 664 chars (cap 700); em and en dash 0 (positive control on `R-A`); check:docs exit 0; only `description` changed in the second commit; 8 undrifted keys byte-identical to the base.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: This prompt's file co-cites 13 cluster keys, so the run differs from its list: R-A splits (+20 −48), new R-DEAD-1, R-GV-16 into R-A, R-LAY-19 orphan; without the file the list is reproduced. The run won. Orphans: R-IRN-3 to R-GEN-1, R-JS-1 and R-LAY-19 to R-A. RC-27: 2 errors, 4 gaps, fixed. On the chat's review the 7 texts (not 8) were cut to 461 to 664 chars; RC-27 recheck: 2 errors, 8 nits, fixed. Second Causa: (c).
**Prompt document name**: 2026-10-11 22:30

## 2026-10-11 — merge: cluster-desc-refresh into alfonso-frontend-jjtl (P-2026-10-11-2328)
**Prompt**: `claude_2026-10-11_2328_prompt_merge_cluster-desc-refresh.md`, a direct merge by `lane-run merge --direct`, no session: `cluster-desc-refresh` at `b12def15d` into `alfonso-frontend-jjtl`, merge base `2f778e9d6`, 2 commits on the branch side.
**Files touched**: merge `56af77b88`: 1 files from the branch side (`docs/goals/cluster-descriptions.json`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `56af77b88` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8711 tests in 359 files, 9 red at import, hooks 681; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs-only merge of cluster-descriptions.json; req-trace no drift, no orphan
**Notes**: Rollback tag `pre-cluster-desc-refresh` on `6ab64e126` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-2328/result.json`.
**Prompt document name**: 2026-10-11 23:28

## 2026-10-11 — fix: req-trace heads, mixed goal entries, SG-3 recheck (P-2026-10-11-2025)
**Prompt**: `claude_2026-10-11_2025_prompt_goal_model_fixes.md`, lane full, unattended: `ROW_START` reads R-D, R-2/3.6, R-B12; a (req, softgoal) pair holds one entry or two of opposite sign; the 27 negatives blocked in P-2026-10-11-1650 recovered and checked; the 57 SG-3 `verified: none` entries rechecked (RC-27); report, tests, bench, board on 4702
**Files touched**: code `c5aa0e0c8`: `frontend/scripts/req-trace.mjs`, `frontend/scripts/hooks/__tests__/reqTrace.test.ts`, `frontend/scripts/hooks/__tests__/laneBoardRequirements.test.ts`; docs `945f17853`: `docs/goals/contributions.json`, `docs/goals/README.md`, `docs/discovery/discovery_2026-10-11_goal_model_fixes.md`; this entry, uncommitted (RC-17)
**Outcome**: ✅ completed
**Corregge**: 2026-10-05 17:25 (`claude_2026-10-05_1725_prompt_goal_model_contributions.md`: one entry per pair, the SG-3 «scenes unchanged» entries)
**Causa**: (c)
**Regressions**: unknown. Gates: node --check exit 0; five suites 145/145; check:scripts, typecheck:scripts, check:docs exit 0; data gate 0 errors, negative control 2/2. Not measured as visual: the cluster partition moved with the three new rows (17 to 16 clusters, R-JS-1's description now orphan, R-LAY-19's attached again), report §2 and §9 Q1.
**Out-of-scope changes**: no. Six files in two commits, above five (RC-11, rule 19): each named in the Lane header and in step 8's pathspecs, taken as the confirmation.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile in this lane (harness and data); the chat RC-23 check on 4702 passed on 2026-10-11 (1005 contributions on rows, equal to the file; 16 mixed realized rows on both sides of their bars; SG-5 shows R-SIM-122; no em dash).
**Notes**: Parser: 520 to 523 rows, only the three appear. Mixed: 25 added (2 of 27 quote a neighbouring bullet), 23 confirmed, 2 regraded; SG-5 gets its first cost. SG-3: 33 confirmed, 6 regraded, 18 removed. 998 to 1005 entries; opposing pairs 6569 to 7173. Same sign: refused and listed in `goalModel.duplicates`. New cases 5 of 6 red on the base; bench 11/11. Second Causa letter: (a). Eight unattended decisions in report §8.
**Prompt document name**: 2026-10-11 20:25

## 2026-10-11 — merge: goal-model-fixes into alfonso-frontend-jjtl (P-2026-10-11-2111)
**Prompt**: `claude_2026-10-11_2111_prompt_merge_goal-model-fixes.md`, a direct merge by `lane-run merge --direct`, no session: `goal-model-fixes` at `945f17853` into `alfonso-frontend-jjtl`, merge base `47539f7fe`, 2 commits on the branch side.
**Files touched**: merge `224af2584`: 6 files from the branch side (`docs/discovery/discovery_2026-10-11_goal_model_fixes.md`, `docs/goals/README.md`, `docs/goals/contributions.json`, `frontend/scripts/hooks/__tests__/laneBoardRequirements.test.ts`, `frontend/scripts/hooks/__tests__/reqTrace.test.ts`, `frontend/scripts/req-trace.mjs`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `224af2584` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8711 tests in 359 files, 9 red at import, hooks 681; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Requirements tab on 4702: 1005 contributions on rows, mixed rows on both sides of their bars
**Notes**: Rollback tag `pre-goal-model-fixes` on `47539f7fe` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-2111/result.json`.
**Prompt document name**: 2026-10-11 21:11

## 2026-10-11 — ticket: laneRun probe test fails when its port is in use, blocking merges
**Ticket**: The direct merge P-2026-10-11-1903 ended blocked on one red test: the laneRun probe case (`frontend/scripts/hooks/__tests__/laneRun.test.ts:1341`, "the probe runs against the served port") failed with `lane-run: port 55980 is in use (lsof): pick another`, expected exit 5, got 2. Rerun alone on the merge commit it passed. The test picks a port that another process (a board, a probe, another lane's vite) can hold at that moment, so any merge can go red by chance and a human has to `resolve` it. Fix: let the test ask the OS for a free port (listen on 0, read the port, close) right before the probe, or retry once on the in-use refusal; then the merge gate stops depending on what else runs on the Mac.
**Priority**: medium
**Found in**: P-2026-10-11-1903

## 2026-10-11 — feat(harness): softgoal balance and cluster matrix (P-2026-10-11-1735)
**Prompt**: `claude_2026-10-11_1735_prompt_softgoal_balance_view.md`, lane full, unattended: req-trace `joinGoals` returns `tree`, `correlations` and `balance`; the Requirements tab replaces the pair tables per softgoal with the softgoal balance bars, the clusters by macro goal matrix and the side effects group; README; tests first with a mutation bench; board on 4702 for the chat's RC-23 check.
**Files touched**: `frontend/scripts/req-trace.mjs`, `frontend/scripts/lane-board/requirements.js`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/reqTrace.test.ts`, `frontend/scripts/hooks/__tests__/laneBoardRequirements.test.ts` (`21c2a3197`); this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Five suites 139/139; check:scripts and check:docs exit 0; node --check on both scripts.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passed, chat RC-23 on 4702 at 1400 px (bars under the five macro goals, one scale, hurt chips, segment click opens the list, matrix and side effects group, no em dash, no page scroll at 1400 px; 135 px of page scroll at 800 px), /api/requirements 0 errors, the tab rendered on a stub DOM: 706 KB, 0 em dashes, 18 ms
**Notes**: Tests first: 17 red on 03111e3ca. Bench 24/24 killed, control 54/54. Unattended (RC-21): the conflicts come last, after the side effects; their note's clause on the rest now points at the balance, so the conflict test's one expected string changed; a row helping and hurting one macro goal counts on both sides of a cell (32 live). Replaced the two per-softgoal pair tests, updated the fixed-widths count. `rm -rf` denied: /tmp/sgb-control and /tmp/sgb-bench-tools remain.
**Prompt document name**: 2026-10-11 17:35

## 2026-10-11 — docs(research): RQ tables, RC-26 review sheet and replication package for CAIN 2027 (P-2026-10-11-1725)
**Prompt**: `claude_2026-10-11_1725_prompt_cain_full_paper_rq_tables_package.md`: on the 1630 dataset, the RQ1 table by check position, the period confound, the RQ2 table of the judgment rules, the RQ3 table of detection and repair, the RC-26 review sheet with its apply script, threats as material, the anonymized replication package with its anonymity check, and the archive of the lane folders.
**Files touched**: 29 files under `docs/research/cain-2027/` (`67f9ecfce`): `discovery_2026-10-11_rq_tables.md`, `threats.md`, `review/rc26_review.md`, `data/rq1_check_position.csv`, `data/rq2_judgment.csv`, `data/rq3_detection_repair.csv`, `data/rc26_reviewed.csv`, `scripts/rq_common.ts`, `scripts/rq1_check_position.ts`, `scripts/rq2_rq3_tables.ts`, `scripts/rc26_review_sheet.ts`, `scripts/rc26_apply_review.ts`, `scripts/anon_common.ts`, `scripts/build_replication.ts`, `scripts/check_anonymity.ts`, `scripts/detection-evidence.json`, `replication/README.md` and 12 CSVs in `replication/`; outside the repo `~/jjodel-cain-archive/lanes_2026-10-11.tar.gz` and `~/.jjodel-cain-key`; this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: RQ1: hook path 0.037 vs chat 0.547 (Model:), ordered at the ends, not monotone between warning, report and no check. RQ2: RC-26 crossings 34 by marker, 24 without delegation, 13 without any prior act of Alfonso; 22 of 34 flagged at the time. RQ3: 133 of 138 repairs in c6804f3d3, 11.5 days of silent generator failure. Replication check 0 hits. Prompt subject (83 chars) shortened to 68. RC-26 numbers wait for the review sheet. Report §0.
**Prompt document name**: 2026-10-11 17:25

**Ticket** (priority medium, seen here, not fixed: out of this lane's scope). `docs/research/cain-2027/scripts/governance-dataset.ts` reads R-SIM-80..82 as `unmarked` (its section rule misses «Alfonso ha ratificato»), joins R-SIM-87/88 across a reused id, and dates a header repaired on a branch at the next trunk commit (`:358-362` before `:369`); the RQ tables correct the last through `scripts/detection-evidence.json`. Detail: `discovery_2026-10-11_rq_tables.md` §5.3.

## 2026-10-11 — merge: cain-rq into alfonso-frontend-jjtl (P-2026-10-11-1846)
**Prompt**: `claude_2026-10-11_1846_prompt_merge_cain-rq.md`, a direct merge by `lane-run merge --direct`, no session: `cain-rq` at `67f9ecfce` into `alfonso-frontend-jjtl`, merge base `6093cfbd3`, 1 commit on the branch side.
**Files touched**: merge `f35e75a07`: 29 files from the branch side (`docs/research/cain-2027/data/rc26_reviewed.csv`, `docs/research/cain-2027/data/rq1_check_position.csv`, `docs/research/cain-2027/data/rq2_judgment.csv`, `docs/research/cain-2027/data/rq3_detection_repair.csv`, `docs/research/cain-2027/discovery_2026-10-11_rq_tables.md`, `docs/research/cain-2027/replication/README.md`, `docs/research/cain-2027/replication/autonomy_weekly.csv`, `docs/research/cain-2027/replication/comparison.csv`, and 21 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f35e75a07` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8692 tests in 359 files, 9 red at import, hooks 662; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs-only merge (research tables), no visual change
**Notes**: Rollback tag `pre-cain-rq` on `f2c27cd5a` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-1846/result.json`.
**Prompt document name**: 2026-10-11 18:46

## 2026-10-11 — docs(discovery): Claude Code mods and the harness (P-2026-10-11-1745)
**Prompt**: `claude_2026-10-11_1745_prompt_claude_code_mods_harness_discovery.md`: Phase 1, read-only: mods version and surfaces, API inventory, order and permissions against the deny list and the `PreToolUse` hooks, throw and hang, a Prompt-ID guard prototype on three scripted sessions, telemetry, mapping of the harness pieces; probes under `/tmp/jjodel-mods-probe/`.
**Files touched**: `docs/discovery/discovery_2026-10-11_claude_code_mods_harness.md` and 19 probe files under `docs/discovery/harness/mods/` (`5bf908b25`); this commit: the Status of the prompt file and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Hard stop of Phase 1. 20 probe sessions and 3 scripted guard sessions on 2.1.296 with the flags lane-run uses. A loaded mod overrides the deny list at tool.check (git stash list ran), skips both PreToolUse hooks by answering a call, and runs host commands via $.process.run; sec-default is not seated here, so its arm was not run. A mod fails open by default, closed with .catch. 20 files in the report commit, above five: DOVE names them (rule 19).
**Prompt document name**: 2026-10-11 17:45

## 2026-10-11 — docs(goals): goal tree, new softgoals, correlations and hurts (P-2026-10-11-1650)
**Prompt**: `claude_2026-10-11_1650_prompt_goal_tree_hurts.md`, lane full (data and docs only), unattended: SG-8..SG-12 under five macro goals in `goal-tree.json`, contributions for the new softgoals, the cost pass for hurts over every positive row, `correlations.json`, RC-27 on every added entry and on a 40-entry sample of the first draft, README, report, board on 4702.
**Files touched**: `041cd2d47`: `docs/goals/softgoals.json`, `docs/goals/contributions.json`, `docs/goals/conflicts.json`, `docs/goals/goal-tree.json` (new), `docs/goals/correlations.json` (new), `docs/goals/README.md`, `docs/discovery/discovery_2026-10-11_goal_tree_hurts.md` (new); this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Step 9 gate exit 0 (negative control exit 1, 5 of 5 faults caught); `req-trace --no-cache` exit 0; reqTrace and laneBoardRequirements 41/41; check:docs 5/5.
**Out-of-scope changes**: no: seven files in one commit, above five (RC-11), each named in the prompt; step 10 says four JSON files, they are five because `conflicts.json` (step 4) changed too.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile in this lane (data and docs); the chat's RC-23 check of the Requirements tab on 4702 passed on 2026-10-11 (12 softgoals in the filter, 13 conflicts, no em dash, render about 130 ms; 2.6 MB of pair tables, addressed by P-2026-10-11-1735).
**Notes**: SG-8..SG-12 all kept (35 to 183 rows). Negative share 8% to 19%, first 12 hurt. RC-27, 677 items: contributions 515/35/21, correlations 25/28/11, conflicts 2/0/0, sample 32/5/3 (80% as written; the 3 rejected are SG-3 «scenes unchanged»). 27 negatives not recordable, one entry per pair (report §4). req-trace opposing pairs 612 to 6569 (Q1). Cache /tmp/lane-board-4702-timeline-cache.json; scratch /tmp/gt1650/.
**Prompt document name**: 2026-10-11 16:50

**Ticket** (P-2026-10-11-1650): `parseRegister` in `req-trace.mjs` does not parse R-D, R-2/3.6 and R-B12, which the goal-model parser and the contract check accept, so 7 entries of `contributions.json` never reach the Requirements tab (998 in the file, 991 on rows).

## 2026-10-11 — merge: goal-tree into alfonso-frontend-jjtl (P-2026-10-11-1808)
**Prompt**: `claude_2026-10-11_1808_prompt_merge_goal-tree.md`, a direct merge by `lane-run merge --direct`, no session: `goal-tree` at `041cd2d47` into `alfonso-frontend-jjtl`, merge base `f6e14efad`, 1 commit on the branch side.
**Files touched**: merge `30e8e2b5e`: 7 files from the branch side (`docs/discovery/discovery_2026-10-11_goal_tree_hurts.md`, `docs/goals/README.md`, `docs/goals/conflicts.json`, `docs/goals/contributions.json`, `docs/goals/correlations.json`, `docs/goals/goal-tree.json`, `docs/goals/softgoals.json`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `30e8e2b5e` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8692 tests in 359 files, 9 red at import, hooks 662; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: data-only merge of docs/goals; Requirements tab checked on 4702 (12 softgoals, 13 conflicts, no em dash)
**Notes**: Rollback tag `pre-goal-tree` on `58a407501` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-1808/result.json`.
**Prompt document name**: 2026-10-11 18:08

## 2026-10-11 — docs(research): governance drift dataset for CAIN 2027 (P-2026-10-11-1630)
**Prompt**: `claude_2026-10-11_1630_prompt_cain_governance_dataset_discovery.md`: read-only discovery, the governance-drift dataset for a CAIN 2027 short paper (register history, RC-26 crossings, grammar conformance, RC-18, autonomy, rule timeline, the enforced vs text-only comparison, anonymization, threats).
**Files touched**: `docs/research/cain-2027/discovery_2026-10-11_governance_dataset.md`, `docs/research/cain-2027/anonymization.md`, `docs/research/cain-2027/scripts/governance-dataset.ts`, `docs/research/cain-2027/scripts/rules-enforcement.csv`, `docs/research/cain-2027/scripts/rc26-hand-check.json`, eight CSVs in `docs/research/cain-2027/data/` (report commit); this entry, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Read-only on code and register. The script imports docs-digest.ts's parser; positive control 49 failing headers and 77 provisional rows on the pre-ratification register, as 1430 measured. H0 holds only narrowly: a hook holds the `Model:` trailer at 3.7% in trees that carry it vs 87.5% in trees that do not, and 52.5% for chat commits it never sees. Three helper agents (rule map, identifying strings, RC-26 rows). Report §0.
**Prompt document name**: 2026-10-11 16:30

## 2026-10-11 — merge: cain-data into alfonso-frontend-jjtl (P-2026-10-11-1719)
**Prompt**: `claude_2026-10-11_1719_prompt_merge_cain-data.md`, a direct merge by `lane-run merge --direct`, no session: `cain-data` at `e34fccc1f` into `alfonso-frontend-jjtl`, merge base `154311f55`, 1 commit on the branch side.
**Files touched**: merge `2dc0982bc`: 13 files from the branch side (`docs/research/cain-2027/anonymization.md`, `docs/research/cain-2027/data/autonomy_weekly.csv`, `docs/research/cain-2027/data/comparison.csv`, `docs/research/cain-2027/data/conformance_daily.csv`, `docs/research/cain-2027/data/conformance_failures.csv`, `docs/research/cain-2027/data/decisions.csv`, `docs/research/cain-2027/data/rc18_daily.csv`, `docs/research/cain-2027/data/rules.csv`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2dc0982bc` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8636 tests in 357 files, 9 red at import, hooks 662; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs-only merge (research dataset), no visual change
**Notes**: Rollback tag `pre-cain-data` on `dfea753d4` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-1719/result.json`.
**Prompt document name**: 2026-10-11 17:19

## 2026-10-11 — docs(decisions): ratify the provisional rows of the digest, amend R-SIM-120 and R-VP-29, fix headers (P-2026-10-11-1540)
**Prompt**: `claude_2026-10-11_1540_prompt_ratify_provisional_rows.md`, lane fast, unattended: apply Alfonso's «ok alle raccomandazioni» to the digest of P-2026-10-11-1430, RC-38 excepted: ratify 74 rows, amend R-SIM-120 and R-VP-29 then ratify them, apply the §7 header rewrites, regenerate `docs/digest/`, write the digest's §10 Outcome.
**Files touched**: `d7a251297`: `docs/decisions.md`, `docs/ratifiche/claude_ratifiche_2026-10-11_provisional_digest.md`; this entry, uncommitted (RC-17).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no. `docs:digest --all` parses 401 of 402 rows, RC-38's header the only failure, as before; check:docs 5/5.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Partial: `--write` exits 2 on RC-38 and writes nothing, so the 34-date backfill of `docs/digest/` waits for RC-38 (adopted unattended, RC-21: the gate is not bypassed). 1 header says provisional (RC-38), 76 say `ratified by Alfonso 2026-10-11`; 39 cited commits on HEAD. Subject shortened to 72 (bash-guard). 1b clauses dropped: the section intros name the chat. Not applied: the R-SIM-70 paragraph (§6), the R-JS intros' «Marker: provisional». Detail: digest §10.
**Prompt document name**: 2026-10-11 15:40

**Ticket** (P-2026-10-11-1540): `docs:digest --write` writes nothing when any header fails to parse, so one row waiting for Alfonso (RC-38) blocks the digest of every date. Writing every date but the failing row's would unblock the backfill; a script change, Alfonso's call.

