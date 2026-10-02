# log-inbox — lane «symbol-editor»

Entries written by the Symbol Editor lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

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
