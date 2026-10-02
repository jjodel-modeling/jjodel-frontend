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
