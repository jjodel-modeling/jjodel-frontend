# log-inbox — lane «symbol-editor»

Entries written by the Symbol Editor lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-02 — fix(editor-v2): «editable inline» toggle of a value segment reads the effective value (P-2026-10-02-1646)
**Prompt**: `claude_2026-10-02_1646_prompt_segment_editable_toggle.md`, `Lane: fast`, Phase 1 then Phase 2 in cascade, on `~/jjodel-w-segedit` branch `segment-editable-toggle`. The toggle of a `value` segment drew `editable === true` while the runtime reads `editable !== false` (`IRNodeContent.tsx:706`), so a seeded segment read OFF while its row edited inline and ON changed nothing; the sibling of the R-IRN-38 label fix, filed as a ticket by P-2026-10-01-2349. Phase 1 report `76d2d72cc`; both questions adopted with their Recommended (RC-21): inline expression, toggle never disabled.
**Files touched**: report `76d2d72cc`: `docs/discovery/discovery_2026-10-02_segment_editable_toggle.md` (addendum §8 in the closure commit). Code `d8f2e61c3`, under `frontend/src/components/editor-v2/viewpoint/authoring/`: `FieldSegmentEditor.tsx` (the read, the exported `applyValueEditable`), `__tests__/fieldSegmentEditor.test.ts` (new). Closure commit: this entry, the R-IRN-40 row in `docs/decisions.md`, the report's addendum, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `d8f2e61c3`: `npm run typecheck` exit 2, 14 errors, the baseline set by file and code; `npm run build` exit 0; full vitest 6508 of 6508 tests passed, 9 failed files, exactly the nine at-import files of CLAUDE.md §17; `check:docs` and `check:addonly` green; probe 22 of 22 on the real app, four demo scenes 0 px from the base run.
**Out-of-scope changes**: no — 2 files in the fix commit, both in the Phase 2 list of the prompt; `IRNodeContent.tsx` and `irLabelEdit.ts` untouched.
**Layer Impact Report**: produced (in chat before the diff: `authoring/` is a §3.1 row, but no §3.2 trigger file, no D-layer write and no VersionFixer is touched)
**Smoke visivo**: chat, pending: crops in `frontend/scripts/smoke/_tmp_segedit_crops/` (gitignored): `se_before_structure_rest_600.png` (the base, toggle OFF at rest) and `se_after_structure_rest_600.png` (the fix, ON), plus `se_after_structure_off_600.png` and `se_after_structure_on_again_600.png`. The lane probe passed the ON-at-rest, OFF, ON-again and edit-lands scenarios.
**Notes**: Mutation bench 18/18 killed, none void (commit body). The base probe, 7/7, reproduces the bug on the real app. Full fix runs at load 100+ died on esbuild «service was stopped» while another lane's probe ran; a run at load 29 passed. Closes this inbox's ticket «FieldSegmentEditor toggle has the same inverted default». Report §8 holds the measures.
**Prompt document name**: 2026-10-02 16:46

## 2026-10-02 — fix(editor-v2): Editable toggle of a Symbol label reads the effective value (P-2026-10-01-2349)
**Prompt**: `claude_2026-10-01_2349_prompt_label_editable_toggle.md`, `Lane: fast`, Phase 1 then Phase 2 in cascade, on `~/jjodel-w-labeledit` branch `label-editable-toggle`. The Editable toggle of a Symbol label drew `editable === true` while the compile and the runtime treat an absent key as editable, so every seeded label read OFF while double-click renamed, and on a literal, path or metaclassName label it was live and inert. Phase 1 report `450eb13c8`; both questions adopted with their Recommended (RC-21).
**Files touched**: report `450eb13c8`: `docs/discovery/discovery_2026-10-01_label_editable_toggle.md` (addendum §9 in this commit). Code `20c843f14`, under `frontend/src/components/editor-v2/viewpoint/`: `ir/irLabelEdit.ts` (new), `ir/irCompile.ts` (one import and the `editsName` expression), `authoring/LabelEntryEditor.tsx`; tests `ir/__tests__/irLabelEdit.test.ts` (new), `authoring/__tests__/labelEntryEditor.test.ts`. This commit: this entry and three tickets, the R-IRN-38 row in `docs/decisions.md`, the report's addendum, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `20c843f14`: `npm run typecheck` exit 2, 14 errors, the baseline set by file and code; `npm run build` exit 0; full vitest 6450 of 6450 tests passed, 9 failed files, exactly the nine at-import files of CLAUDE.md §17; probe 23 of 23 on the real app; four demo scenes 0 px from the base run.
**Out-of-scope changes**: no — 5 files in the fix commit, all in the Phase 2 list of the report; the one import line in `irCompile.ts` is inherent to calling the predicate.
**Layer Impact Report**: not-required (no §3.1 file touched, no D-layer write, no VersionFixer: ON removes a key whose absence already reads editable; `irCompile.ts` is the IR/Execution hot area, not a critical-zone file)
**Smoke visivo**: chat, pending: crops in `frontend/scripts/smoke/_tmp_labeledit_crops/` (gitignored): the Text section at rest with the toggle ON (`labeledit_text_rest_toggle_600.png`), the disabled toggle with its hint on a literal label (`labeledit_disabled_hint_600.png`). The lane probe passed the OFF, ON, rename and literal scenarios.
**Notes**: Mutation bench 17/17 killed, none void (commit body). Probe 23/23; demo scenes petri, flowB, sm, esm 0 px from the base run. A first full vitest under load 87 also failed two lane-run test files on timeouts; at low load they pass (108) and the final run has the 9 known import reds only. One stray write to /tmp/x (typecheck output), against the prompt, removed at once. Report §9 holds the measures.
**Prompt document name**: 2026-10-01 23:49

## 2026-10-02 — ticket: IR name label stays stale after an inline rename when the class has no name attribute
**Ticket**: `useIRView`'s selector (`irResolve.ts:49-72`) snapshots the viewpoint signature, the object's id, class and DValue slots, and the cross deps, not `dObject.name`. After a double-click rename of an object whose class has no `name` attribute the store holds the new name (`DObject.name` and the L-proxy) but the IR node keeps drawing the old label: still stale after 5 s and after a tab round trip. With a `name` attribute (identity slot) the rename changes a DValue and the label refreshes. Measured identical with the base `irCompile.ts`, so it predates P-2026-10-01-2349. A one-line widening of the signature is the likely fix; Phase 1 first, IR/Execution hot area.
**Priority**: medium
**Found in**: P-2026-10-01-2349
**Detail**: `docs/discovery/discovery_2026-10-01_label_editable_toggle.md` §9

## 2026-10-02 — ticket: FieldSegmentEditor toggle has the same inverted default as the label one
**Ticket**: `FieldSegmentEditor.tsx:57` draws `checked={valueEditable === true}` for the `value` segment, while the runtime reads `(seg as any).editable !== false` (`IRNodeContent.tsx:706`) and the row value is editable only for attributes (`row.editableValue`, kind A). A value segment with `editable` absent reads OFF while its row value edits on double-click. The fix is the same shape as R-IRN-38: effective value, ON removes the key, and a disabled state where the row cannot edit.
**Priority**: low
**Found in**: P-2026-10-01-2349

## 2026-10-02 — ticket: a single-attribute path label cannot be edited on the canvas
**Ticket**: a label whose source is a `path` to one attribute has `editsName` false, so double-click does nothing and the Editable toggle is disabled (R-IRN-38). Making it editable reuses the row value editing of `IRNodeContent.tsx:342-350`: a compiled field on `CompiledLabel` (the feature name of a one-feature path), a second editing state and commit in `IRNodeContent.tsx` through `syncUpdateFeatureValue`, a widening of the predicate, and the two compiled-label key lists pinned in `ir.test.ts:2002` and `:2129`; about four source files plus tests, a prompt of its own.
**Priority**: low
**Found in**: P-2026-10-01-2349
**Detail**: `docs/discovery/discovery_2026-10-01_label_editable_toggle.md` §0

## 2026-10-02 — merge: label-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1548)
**Prompt**: `claude_2026-10-02_1548_prompt_merge_label-editable-toggle.md`, a merge in a session (Lane: full, a union hunk edits a base section of `docs/log-inbox/symbol-editor.md`): `label-editable-toggle` at `aa0396dd5` into `alfonso-frontend-jjtl`, merge base `4b9bc5836`, 5 commits on the branch side.
**Files touched**: merge `a8870fa63`: 9 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-01_label_editable_toggle.md`, `docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-10-01_2349_prompt_label_editable_toggle.md`, `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/labelEntryEditor.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irLabelEdit.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irLabelEdit.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `a8870fa63`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6496 in 261 files (the trunk tip's 6457 in 260 plus the branch's 39: `labelEntryEditor.test.ts` 10 to 21, `irLabelEdit.test.ts` new with 28), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 9 files, all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended (C-2026-10-01-2349): 3001 answers 200; vite serves `irLabelEdit.ts` with `labelEditsName` and `LabelEntryEditor.tsx` with the hint «Only a name label can be renamed on the canvas.», so the merged code compiles on the running server; the behaviour was measured by the branch probe (23/23)
**Notes**: Union in `docs/log-inbox/symbol-editor.md`: the trunk's preamble, then the branch's entry P-2026-10-01-2349 and its three tickets; the base's 13 entries, folded by `d2eb5fb83`, not carried back. `docs/decisions.md` merged clean, R-IRN-38 appended. No rollback tag, pre-merge tip `c10f0fd90`. Gates ran on `~/.hermes/node/bin` v26.8.1 (session PATH had nvm v18 first). check:docs printed 5 non-blocking warnings.
**Prompt document name**: 2026-10-02 15:48

## 2026-10-02 — merge: segment-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1810)
**Prompt**: `claude_2026-10-02_1810_prompt_merge_segment-editable-toggle.md`, a merge in a session (Lane: full, zero conflicts measured): `segment-editable-toggle` at `013a4dc9c` into `alfonso-frontend-jjtl`, merge base `adb5d9731`, 5 commits on the branch side.
**Files touched**: merge `bc8989cdb`: 6 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-02_segment_editable_toggle.md`, `docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-10-02_1646_prompt_segment_editable_toggle.md`, `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/fieldSegmentEditor.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `bc8989cdb`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6589 in 265 files (the trunk tip's 6577 in 264 plus the branch's 12, `fieldSegmentEditor.test.ts` new), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 6 files, all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended (C-2026-10-01-2349): 3001 answers 200; vite serves `FieldSegmentEditor.tsx` with `applyValueEditable`, so the merged code compiles on the running server; the behaviour was measured by the branch probe (22/22)
**Notes**: The session slept at about 18:25 before step 4 and resumed at 20:52; the 18:11 trunk vitest ran under load (4 timeouts, 1 failed assertion, 3 workers never started) and was taken again: 6577 in 264, 0 failed. `docs/decisions.md` merged clean, R-IRN-40 appended; no union. Rollback tag `pre-segment-editable-toggle` on `9e6adf714` (RC-31), set by lane-run. check:docs printed 5 non-blocking warnings.
**Prompt document name**: 2026-10-02 18:10

## 2026-10-02 — feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)
**Prompt**: `claude_2026-10-02_1647_prompt_path_label_edit.md`, `Lane: full`, Phase 1 then Phase 2 in cascade, on `~/jjodel-w-pathlabel` branch `path-label-edit`. A `path` label whose expression is one step to a single-valued string attribute of its object edits on double-click when the IR opts in with `editable`; the toggle shows it and says why when it cannot. Report `ddb7a8c16`; its six questions adopted with their Recommended (RC-21); decision R-IRN-41.
**Files touched**: report `ddb7a8c16`: `docs/discovery/discovery_2026-10-02_path_label_edit.md` (addendum §8 in this commit). Code `aa04b92fb`, under `frontend/src/components/editor-v2/viewpoint/`: `ir/irLabelEdit.ts`, `ir/irCompile.ts`, `ir/irTypes.ts` (`CompiledLabel.editsFeature?`), `ir/IRNodeContent.tsx`, `authoring/LabelEntryEditor.tsx`; tests `ir/__tests__/irLabelEdit.test.ts`, `authoring/__tests__/labelEntryEditor.test.ts`. This commit: this entry and a ticket, the R-IRN-41 row in `docs/decisions.md`, the addendum, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no — typecheck exit 2, the 14 of §17; build exit 0; vitest: the 9 known import reds only, after the load-hit files passed alone (`laneRun*` 108/108 at load 16); probe: the four demo scenes and DemoFlowB's derived viewpoint 0 px from `adb5d9731`, no new editable label.
**Out-of-scope changes**: no — the seven files of the prompt's DOVE; `canvasToJjom.ts` is called, not edited.
**Layer Impact Report**: not-required (no §3.2 file edited; the write reuses `syncUpdateFeatureValue`)
**Smoke visivo**: chat, pending: lane probe 35/36 on 3093; the failing item is undo, see the ticket below. Crops in `frontend/scripts/smoke/_tmp_pathlabel_crops/` (gitignored), `pathlabel_*_600.png`.
**Notes**: Mutation bench 28/28, none void (commit body). Undo of the written attribute fails, and the same run shows the trunk's row value edit failing the same way: the prompt's «with its undo snapshot» assumed a working undo that Phase 1 read but did not run (Causa c). One 18:14 probe abort on `unparse_test.js` (`module is not defined`) did not recur. The Mac's sleep killed the session once; resumed at `aa04b92fb`, clean. Report §8 holds the measures.
**Prompt document name**: 2026-10-02 16:47

## 2026-10-02 — ticket: one undo does not restore a slot value written by syncUpdateFeatureValue
**Ticket**: an attribute written through `syncUpdateFeatureValue` (the IR row value edit, the R-IRN-41 path label, a direct call) pushes an undo entry whose only key is `action_title`, no `idlookup` delta; one Cmd+Z pops it (depth 11 to 10) and the value stays. Measured on `aa04b92fb` with the row edit of the trunk path as control. The value change is either merged into another entry or missed by `Uobj.objectDelta` (`reducer.ts:1203-1265`); the fix is in the reducer or in `canvasToJjom.ts` (critical zone, Layer Impact Report), a Phase 1 of its own.
**Priority**: medium
**Found in**: P-2026-10-02-1647
**Detail**: `docs/discovery/discovery_2026-10-02_path_label_edit.md` §8

## 2026-10-02 — merge: path-label-edit takes alfonso-frontend-jjtl, the path label on the trunk before its own merge (P-2026-10-02-2132)
**Prompt**: `claude_2026-10-02_2132_prompt_path-label-edit_take_trunk.md`, rendered by `lane-run merge --trunk-into`, full lane on `~/jjodel-w-pathlabel` branch `path-label-edit`: the trunk `alfonso-frontend-jjtl` at `936a1b947` into the branch with one `--no-ff` merge, merge base `adb5d9731`, before the branch's own merge into the trunk (RC-14).
**Files touched**: merge `1dff977e4`: 43 files from the trunk side (`docs/decisions.md`, six discovery reports, eleven prompts, `docs/log-inbox/{symbol-editor,views}.md`, and 23 code and test files under `editor-v2/edges/`, `editor-v2/utils/`, `editor-v2/viewpoint/{authoring,ir}/`, `editors/viewpoint/properties/`, `view/`), `decisions.md` and `symbol-editor.md` resolved by union. This commit: this entry and the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `1dff977e4`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6663/6663 in 266 files, 0 failed, the 9 known files red at import (expected: the trunk tip's 6600 in 266 plus the branch's 63); hooks 344/344; build exit 0; check:docs 4/4; check:scripts and check:addonly PASS.
**Out-of-scope changes**: no — 43 files, above five (RC-11), all from the trunk side, the merge being the prompt's scope; the hand resolutions are the two unions of COME 4.
**Layer Impact Report**: not-required (no §3.2 file; `irCompile.ts` and `irTypes.ts`, under `viewpoint/ir/`, auto-merged, no hand edit)
**Smoke visivo**: passato — chat GO, unattended, on a re-run of the P-2026-10-02-1647 probe on `1dff977e4`: `lane-run probe` on 3093, light, 35 of 36, the one failure the known undo of an inline write (ticketed), the 36 verdicts identical to the branch's run; four demo scenes and DemoFlowB's derived viewpoint 0 px from `adb5d9731`; Alfonso in the morning digest.
**Notes**: Union in `decisions.md` (the trunk's R-IRN-40 and R-IRN-39, then the branch's R-IRN-41) and in this inbox (the trunk's 76 lines, then the branch's two entries), verbatim; `irCompile.ts` and `irTypes.ts` auto-merged, read whole. No rollback tag, pre-merge tip `641fc9a57`. Gates on `~/.hermes/node/bin` v26.8.1. The branch's crops copied to `_tmp_pathlabel_crops_branch/` before the re-run. check:docs printed 5 non-blocking warnings.
**Prompt document name**: 2026-10-02 21:32

**Ticket** (low, lane-run template): step 7 of `frontend/scripts/lane-templates/trunk-into-branch.md` renders the `check:addonly` fallback as `git reset --hard {{branchTip}}`, «this branch's own pre-merge tip»; `{{branchTip}}` is the tip lane-run measured before the prompt commit landed, so here it read `c0dfec656` while the merge sat on `641fc9a57`, and the reset would have dropped the prompt's own commit. Not triggered (check:addonly PASS). Fix: render the reset as the merge's first parent, `git reset --hard HEAD^1`.

## 2026-10-02 — merge: path-label-edit into alfonso-frontend-jjtl (P-2026-10-02-2157)
**Prompt**: `claude_2026-10-02_2157_prompt_merge_path-label-edit.md`, a merge in a session (Lane: full, zero conflicts measured): `path-label-edit` at `3aa9dd34f` into `alfonso-frontend-jjtl`, merge base `936a1b947`, 8 commits on the branch side, 0 on the trunk side but this merge's prompt.
**Files touched**: merge `949e0c75d`: 12 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-02_path_label_edit.md`, `docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-10-02_1647_prompt_path_label_edit.md`, `docs/prompts/claude_2026-10-02_2132_prompt_path-label-edit_take_trunk.md`, and under `frontend/src/components/editor-v2/viewpoint/`: `authoring/LabelEntryEditor.tsx`, `authoring/__tests__/labelEntryEditor.test.ts`, `ir/IRNodeContent.tsx`, `ir/__tests__/irLabelEdit.test.ts`, `ir/irCompile.ts`, `ir/irLabelEdit.ts`, `ir/irTypes.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `949e0c75d`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6663 in 266 files (the trunk tip's 6600 plus the branch's 63: `labelEntryEditor.test.ts` 21 to 33, `irLabelEdit.test.ts` 28 to 79, no new file), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 12 files, all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended (C-2026-10-01-2349): 3001 answers 200; vite serves the merged `irLabelEdit.ts`, so the merged code compiles on the running server; the behaviour was measured by the probe on the synced branch (35/36, the one failure the known undo ticket); Alfonso in the morning digest.
**Notes**: Clean merge, no union resolution: the committed tree is the merge-tree result `abb42b858`. Probes 4/4 once each (R-IRN-41, the three headings in this inbox), control R-IRN-42 absent. Rollback tag `pre-path-label-edit` on `936a1b947` (RC-31), set by lane-run. check:docs printed 5 non-blocking warnings.
**Prompt document name**: 2026-10-02 21:57

## 2026-10-03 — fix(redux): undo restores a slot written inline, copy-on-write never writes into the previous state (P-2026-10-03-1632)
**Prompt**: `claude_2026-10-03_1632_prompt_undo_inline_edit.md`, full lane (critical-zone go-ahead, RC-30) on `~/jjodel-w-undoinline` branch `undo-inline-edit`: the ticket «one undo does not restore a slot value written by syncUpdateFeatureValue» (P-2026-10-02-1647, above in this inbox). Phase 1 discovery, Phase 2 after the chat's GO adopting fix (A) (RC-21, unattended).
**Files touched**: probe `d073925e7` (`frontend/scripts/probe/undo-inline-edit.ts`, `frontend/scripts/probe/fixtures/scene_2_DemoPetri.jjodel`); report and LIR `389519169`, LIR amended `0eac2931b` (`docs/discovery/discovery_2026-10-03_undo_inline_edit.md`, `docs/lir/lir_2026-10-03_undo_inline_edit.md`); trunk taken `e2154ebaf` (49957d340); fix `ac64b213b` (`frontend/src/redux/reducer/reducer.ts`, new `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts`). This commit: this entry, the prompt's Status, row R-UNDO-8 in `docs/decisions.md`, report addendum §7.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — typecheck exit 2, the 14 of §17; vitest 6990 passed, 4 red in `criticalZone.test.ts` only with this session's go-ahead variable set (70/70 without it), the 9 known import reds; build exit 0; probe 33/33; four scenes 0 px from the d2a1866b6 reducer. Every slot write path changes, and only the probe's eight and the suite exercise it.
**Out-of-scope changes**: yes — nine files over the lane (RC-11, listed above); `docs/decisions.md` (R-UNDO-8, the RC-21 record of the adoption) is not in DOVE. The trunk merge is step 8 of the prompt.
**Layer Impact Report**: produced
**Smoke visivo**: chat, pending: lane probe 33/33 on 3077 (light), 8 cases restore on Cmd+Z and reapply on Cmd+Shift+Z, canvas text follows; crops in `~/.jjodel-lanes/P-2026-10-03-1632/crops/` (32), scenes in `.../scenes/`.
**Notes**: Cause and measures: report §0 and §7. A slot write's no-op `isMirage` made `values.N` copy-on-write into the previous state; `prevAction` is now the last action that changed it. Mutation bench 6/6 killed (commit body). Scenes: DemoFlowB differs run to run on the same code (881 px before vs before), 0 px in the second pair. Inbox entry at the end of the file, below the ticket's batch, as the fold requires. Typo in `ac64b213b`'s body («the 17 baseline set»).
**Prompt document name**: 2026-10-03 16:32

**Ticket** (low, harness): `frontend/scripts/hooks/__tests__/criticalZone.test.ts` reads the process environment, so a lane started with `--critical-zone-goahead` (RC-30) sees 4 tests red in the full suite («kills "bypass not read"…», «kills "deny limited to the six files"…»): measured here, 70/70 with `env -u JJODEL_CRITICAL_ZONE_GOAHEAD`. Fix: clear the variable in the test's `beforeEach`, or pass the env to the hook explicitly.

## 2026-10-03 — merge: undo-inline-edit takes alfonso-frontend-jjtl at 26b62ea01, second take (P-2026-10-03-1632)
**Prompt**: step 8 of `claude_2026-10-03_1632_prompt_undo_inline_edit.md` (RC-14): the trunk moved after the closure commit `bb7a3f985`, 5 commits (sim-polish: `editor-v2/sim/` code and tests, docs), taken into the lane branch before the hard stop.
**Files touched**: merge `22a3b33b4`: 11 files from the trunk side (`frontend/src/components/editor-v2/sim/` six code files and two tests, `docs/log-inbox/simulation.md`, two prompts). This commit: this entry, the prompt's Status, report addendum §7.1.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `22a3b33b4`: typecheck exit 2, the 14 of §17; vitest 7007 passed, 4 red in `criticalZone.test.ts` only with the go-ahead variable (70/70 without), the 9 known import reds; build exit 0; probe 33/33; four scenes opened clean.
**Out-of-scope changes**: no — 11 files, above five (RC-11), all from the trunk side; the take is the prompt's step 8.
**Layer Impact Report**: not-required (no file of the LIR changed on the trunk side)
**Smoke visivo**: chat, pending: probe 33/33 on 3077 (light) on the merged tree; crops in `~/.jjodel-lanes/P-2026-10-03-1632/crops/` regenerated there.
**Notes**: Clean merge, no hand resolution. Scenes: three 0 px; DemoFlowB renders in run-to-run variants (870 to 891 px between two runs of the same reverted code), and the fixed shots are byte-identical to reverted ones (`m-after2` = `before`, `after2` = `before2`). Report §7.1.
**Prompt document name**: 2026-10-03 16:32

## 2026-10-03 — merge: undo-inline-edit into alfonso-frontend-jjtl (P-2026-10-03-1750)
**Prompt**: `claude_2026-10-03_1750_prompt_merge_undo-inline-edit.md`, a direct merge by `lane-run merge --direct`, no session: `undo-inline-edit` at `14adb5da5` into `alfonso-frontend-jjtl`, merge base `b4c59c572`, 10 commits on the branch side.
**Files touched**: merge `3d62a8f13`: 9 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-03_undo_inline_edit.md`, `docs/lir/lir_2026-10-03_undo_inline_edit.md`, `docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-10-03_1632_prompt_undo_inline_edit.md`, `frontend/scripts/probe/fixtures/scene_2_DemoPetri.jjodel`, `frontend/scripts/probe/undo-inline-edit.ts`, `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `3d62a8f13` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7011 tests in 279 files, 9 red at import, hooks 352; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on the lane crops: IR row 2 to 7, Cmd+Z 2, Cmd+Shift+Z 7; path label beta, Cmd+Z alpha; lane probe 33/33; four scenes 0 px (DemoFlowB run-to-run variance only); eight gates of the direct worker green (vitest 7011)
**Notes**: Rollback tag `pre-undo-inline-edit` on `c41c63a7a` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1750/result.json`.
**Prompt document name**: 2026-10-03 17:50
