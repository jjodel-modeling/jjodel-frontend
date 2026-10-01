# log-inbox — lane «symbol-editor»

Entries written by the Symbol Editor lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-29 — feat(editor-v2): default width and height of a vertex view (P-2026-09-29-1230)
**Prompt**: `claude_2026-09-29_1230_prompt_symbol_default_size.md`, `Lane: full`, two-phase, on `~/jjodel-w-symsize` branch `symbol-default-size`. Sizing section of the Symbol Editor: Width and Height fields, `defaultSize` on `VertexViewIR`, every instance born at that size. Phase 1 report `6955e5c6d` recommended option (b), derivation at render; the GO (RC-25, unattended) adopted it with the 24 px floor, circle squared, no clamp in `irValidate`, the deactivation clear and the `default` caption.
**Files touched**: report `6955e5c6d`: `docs/discovery/discovery_2026-09-29_symbol_default_size.md`. Code `34c0ac422`, under `frontend/src/components/editor-v2/`: `nodes/nodeSizing.ts` (`usableSizeAxis`, `authoredDefaultSize`, `defaultBoxFor`, `sizeSourceOf`), `viewpoint/ir/irTypes.ts` (one optional field), `viewpoint/ir/irValidate.ts` (numeric rule), `viewpoint/ir/useContentSize.ts` (default box, deactivation clear), `viewpoint/ir/IRNodeContent.tsx` (one argument), `viewpoint/authoring/VertexAuthoringPanel.tsx` (Width and Height row), `viewpoint/authoring/SymbolBoxPreview.tsx` and `SymbolEditorModal.tsx` (`default size` caption); tests `nodes/__tests__/nodeSizing.test.ts` (new), `viewpoint/ir/__tests__/irValidate.test.ts`, `ir.test.ts`, `viewpoint/authoring/__tests__/symbolBoxPreview.test.ts`. This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on `34c0ac422`: `npm run typecheck` exit 2, 14 errors, the same file-and-code set as the baseline taken before the change; `npm run build` exit 0, only the chunk-size warning; vitest on the 4 touched test files plus `shapeRegistry.test.ts` and `irCreationSeed.test.ts`, 6 files, 264 passed. The hook and the panel are not covered by tests; the canvas behaviour waits for the visual check.
**Out-of-scope changes**: no — 12 files (8 source, 4 tests), all in the Phase 2 list of the report and the scope of the GO; above rule 19's 5, declared in the report before the GO (RC-11).
**Layer Impact Report**: not-required (no §3.2 file touched, no D-layer write: the default is a session-only size on the RF node)
**Smoke visivo**: chat, pending: set Width/Height on a rect and an ellipse view, new instance from the palette, a resized instance keeps its size, Reset size returns to the default, clearing both fields returns to content, circle squared, caption `default size`
**Notes**: Under (b) the default also redraws existing instances with no manual size; nothing is rewritten in the D-layer. Mutation bench 6/6 killed, listed in the commit body. The hook and the panel do not import in vitest (`ReferenceError: window is not defined` via `joiner`, measured with a `_tmp_` probe, deleted), so the deactivation clear, the fields row and the caption choice rest on the visual check.
**Prompt document name**: 2026-09-29 12:30

## 2026-09-29 — feat(editor-v2): vertex labels outside the symbol box (P-2026-09-29-1245)
**Prompt**: `claude_2026-09-29_1245_prompt_label_outside_positions.md`, `Lane: full`, two-phase, on `~/jjodel-w-labelout` branch `label-outside-pos`. Four label positions outside the box (above, below, left, right). Phase 1 report `21c0d6ede` corrected the proposed `'outside-*'` values to R-VP-15 (1)'s ratified `'outside'` + `anchor` and recommended strategy A; the GO (RC-25, unattended) adopted it on the base `ca59e317e` (lane 1230 merged in).
**Files touched**: report `21c0d6ede`: `docs/discovery/discovery_2026-09-29_label_outside_positions.md`. Code `9cca484ae`, under `frontend/src/components/editor-v2/viewpoint/`: `ir/irTypes.ts` (`'outside'`, `LabelAnchor`, `LabelSpec.anchor?`, `CompiledLabel.anchor?`), `ir/irCompile.ts` (`LABEL_ANCHORS`, `resolveLabelAnchor`), `ir/irValidate.ts` (`VALID_LABEL_POSITIONS`, label rule), `ir/IRNodeContent.tsx` (anchor class), `ir/irStyle.ts` (appended rules), `authoring/LabelEntryEditor.tsx` (optgroups, mapper), `authoring/SymbolBoxPreview.tsx`, `authoring/SymbolEditorModal.tsx`, `authoring/SymbolEditorModal.scss`; tests `ir/__tests__/irValidate.test.ts`, `ir.test.ts`, `shapeRegistry.test.ts` (bar check bounded, helpers hoisted unchanged), `authoring/__tests__/labelEntryEditor.test.ts` (new), `symbolBoxPreview.test.ts`. This commit: this entry, the report's addendum, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on `9cca484ae`: `npm run typecheck` exit 2, 14 errors, the same file-and-code set as before the change; `npm run build` exit 0, only the chunk-size warning; vitest on the 5 touched test files plus 6 adjacent, 11 files, 380 passed; all of `src/components/editor-v2`, 85 files, 2081 passed. The canvas render waits for the visual check.
**Out-of-scope changes**: no — 14 files (9 source, 5 tests), above rule 19's 5, all in the Phase 2 list of the report and the scope of the GO (RC-11).
**Layer Impact Report**: not-required (no §3.1 file touched, no D-layer write: view IR vocabulary, compile, CSS and authoring UI only)
**Smoke visivo**: chat, pending: the checklist of the closing report (four anchors on rect, circle, bar; old views unchanged; select groups; previews; dark theme)
**Notes**: Mutation bench 14/14 killed, listed in the commit body (one bench mutation was void, `false && A || B`, re-run as a real disable). `IRNodeContent.tsx` does not import in vitest (`ReferenceError: window is not defined`, `_tmp_` probe, deleted): its anchor class rests on the headless probe (report §6) and the visual check.
**Prompt document name**: 2026-09-29 12:45

## 2026-09-29 — ticket: outside label anchors are cardinal only, no diagonals
**Ticket**: `LabelAnchor` is `'n' | 'e' | 's' | 'w'`. R-VP-15 (1) names the Petri Place's label `nw`, which needs `ne/nw/se/sw`: an additive union widening plus four CSS rules, four select options and the vocabulary tests.
**Priority**: low
**Found in**: P-2026-09-29-1245

## 2026-09-29 — ticket: IR selection ring reads clipped by the node wrapper
**Ticket**: in a headless probe with the real `BASE_CSS` and `instanceNode.scss`, the pixel 4px outside a selected IR rect is white under `.mm-node.mm-object { overflow: hidden }` and the ring colour once the wrapper is lifted. Not yet confirmed in the live app. Nodes with an outside label lift the wrapper, so their ring may read fuller than their neighbours'.
**Priority**: low
**Found in**: P-2026-09-29-1245
**Detail**: docs/discovery/discovery_2026-09-29_label_outside_positions.md

## 2026-09-29 — ticket: Symbol Editor previews ignore the inside label positions
**Ticket**: both previews honour only `outside` for the primary label; `top`, `inside` and `bottom` still draw centred, as before this lane. Passing the inside position to the replica is a one-line change, kept out to leave committed preview behaviour untouched.
**Priority**: low
**Found in**: P-2026-09-29-1245

## 2026-09-29 — merge: label-outside-pos into alfonso-frontend-jjtl (P-2026-09-29-1827)
**Prompt**: `claude_2026-09-29_1827_prompt_merge_label-outside-pos.md`, a direct merge by `lane-run merge --direct`, no session: `label-outside-pos` at `e3d96cb9c` into `alfonso-frontend-jjtl`, merge base `12ac29f74`, 9 commits on the branch side.
**Files touched**: merge `7d1b0da4f`: 23 files from the branch side (`docs/discovery/discovery_2026-09-29_label_outside_positions.md`, `docs/discovery/discovery_2026-09-29_symbol_default_size.md`, `docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-09-29_1230_prompt_symbol_default_size.md`, `docs/prompts/claude_2026-09-29_1245_prompt_label_outside_positions.md`, `frontend/src/components/editor-v2/nodes/__tests__/nodeSizing.test.ts`, `frontend/src/components/editor-v2/nodes/nodeSizing.ts`, `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`, and 15 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7d1b0da4f` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5825 tests in 229 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Alfonso asked for the merge without the visual check; gates green on the merge
**Notes**: Rollback tag `pre-label-outside-pos` on `8f972410f` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1827/result.json`.
**Prompt document name**: 2026-09-29 18:27

## 2026-09-29 — ticket: Symbol Editor Border swatch paints black for a CSS-variable colour
**Ticket**: with `shape.border.color` = `var(--color-inode-border)` the modal's Border Color field shows the string in its text box but its native swatch falls back to `#000000` (`ColorPicker.tsx:58`, `FULL_HEX_RE` only). The rail card that painted the resolved colour was retired by P-2026-09-29-1826, so the swatch is now the only colour chip for that axis outside the preview strip.
**Priority**: low
**Found in**: P-2026-09-29-1826
**Detail**: docs/discovery/discovery_2026-09-29_symbol_tab_opens_modal.md

## 2026-09-29 — feat(authoring): the Symbol tab opens the Symbol Editor, Form becomes Layout (P-2026-09-29-1826)
**Prompt**: `claude_2026-09-29_1826_prompt_symbol_tab_opens_modal.md`, `Lane: fast`, on `~/jjodel-w-symbol-tab` branch `symbol-tab-modal`. The Symbol tab becomes a trigger for the Symbol Editor modal (no intermediate pane, previous tab kept, arrows inert, dialog icon), and the Form tab reads Layout with a tooltip. Answers (unattended, RC-25): Q1 ticket, Q2 SymbolCard kept (RC-26), rail tab padding 10px to 8px.
**Files touched**: report `8ca549c5d`: `docs/discovery/discovery_2026-09-29_symbol_tab_opens_modal.md`. Code: `f8bd58ae0` `frontend/src/components/editors/views/ViewData.tsx`; `90e41df6a` `ViewData.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`, `frontend/src/components/editor-v2/nodes/RendererInspector.tsx`; `25d350167` `ViewData.tsx` (icon colour); `6e606fa3d` `frontend/src/components/editors/properties-with-tree-view.scss`. This commit: this entry, the Q1 ticket above it, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes, found by the lane probe and fixed in the lane: the icon painted slate-900 through the global `i.bi` (`25d350167`), and the vertex bar in Advanced overflowed the default 400px rail, Source clipped 9.8px (`6e606fa3d`, now 383/383). Typecheck 14 (baseline), build green, vitest 5825/5825 with the 9 known import reds.
**Out-of-scope changes**: yes: `RendererInspector.tsx` (the «Open the Layout tab» link, declared in Phase 1) and `properties-with-tree-view.scss` (added to the DOVE by the ratified answer).
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Playwright probes on :3002: checks a-e, 4 closers, arrows inert with Enter/Space as control; row, edge and legacy view bars 4px narrower per tab, no label cut; crops in `frontend/scripts/smoke/_tmp_symtab/`, gitignored)
**Notes**: At 360px Advanced the vertex bar still overflows: 381/343, Source hidden 29.8px, against 24.2px before the lane. Edge and legacy bars overflow less than before at every width. The hover-colour FAIL of probe2 is the probe's premise: the rail label does not change colour on hover; icon equals label idle and on hover. No tag, no merge.
**Prompt document name**: 2026-09-29 18:26

## 2026-09-29 — merge: symbol-tab-modal into alfonso-frontend-jjtl (P-2026-09-29-1925)
**Prompt**: `claude_2026-09-29_1925_prompt_merge_symbol-tab-modal.md`, a direct merge by `lane-run merge --direct`, no session: `symbol-tab-modal` at `a4d9c7ab3` into `alfonso-frontend-jjtl`, merge base `7b5c807b8`, 7 commits on the branch side.
**Files touched**: merge `f7c5fd910`: 7 files from the branch side (`docs/discovery/discovery_2026-09-29_symbol_tab_opens_modal.md`, `docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-09-29_1826_prompt_symbol_tab_opens_modal.md`, `frontend/src/components/editor-v2/nodes/RendererInspector.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`, `frontend/src/components/editors/properties-with-tree-view.scss`, `frontend/src/components/editors/views/ViewData.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f7c5fd910` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5825 tests in 229 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Code under frontend/src on the trunk equals the branch tip a4d9c7ab3 (merge conflict only in docs/log-inbox); visual checks a-e and all rail tab bars passed on the branch with Playwright probes on :3002 (P-2026-09-29-1826); gates green on the merge
**Notes**: Rollback tag `pre-symbol-tab-modal` on `70b580af4` (RC-31). Union: `docs/log-inbox/symbol-editor.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1925/result.json`.
**Prompt document name**: 2026-09-29 19:25

## 2026-09-29 — refactor(authoring): remove the dead SymbolCard and its styles (P-2026-09-29-1929)
**Prompt**: `claude_2026-09-29_1929_prompt_remove_symbolcard.md`, `Lane: fast`, on `~/jjodel-w-symcard` branch `symbolcard-cleanup`. Delete `SymbolCard.tsx`, `SymbolCard.scss` and the SymbolCard rules of `railSystem.scss`, dead since P-2026-09-29-1826; discovery first, STOP on any outside user.
**Files touched**: report `959601170`: `docs/discovery/discovery_2026-09-29_remove_symbolcard.md`. Code `89bed3547`: `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.tsx` and `SymbolCard.scss` (deleted), `frontend/src/components/editors/railSystem.scss` (-23 lines). This commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14 (baseline, same files and codes), build exit 0, vitest 5825/5825 with the 9 known import reds (`window is not defined`).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Playwright probe on :3002, before and after the deletion: Symbol tab opens the modal, Structure stays active, Esc closes, no `.symbol-card`; 12 rail tab bars identical before/after and equal to the 1826 measures; crops in `frontend/scripts/smoke/_tmp_symcard/`, gitignored)
**Notes**: The cited block `railSystem.scss:326-354` is 326-348 on this HEAD. Left in place, outside the authorised range: the dead selector `> section.properties-tab.properties-panel.symbol-card` at `:52` (the first selector of the same list covers it) and the SymbolCard mention in the header comment at `:26`. Report §4.3, Q1. No merge.
**Prompt document name**: 2026-09-29 19:29

## 2026-09-29 — merge: symbolcard-cleanup into alfonso-frontend-jjtl (P-2026-09-29-1947)
**Prompt**: `claude_2026-09-29_1947_prompt_merge_symbolcard-cleanup.md`, a direct merge by `lane-run merge --direct`, no session: `symbolcard-cleanup` at `dee8746f7` into `alfonso-frontend-jjtl`, merge base `b256abc36`, 4 commits on the branch side.
**Files touched**: merge `6ada3b757`: 6 files from the branch side (`docs/discovery/discovery_2026-09-29_remove_symbolcard.md`, `docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-09-29_1929_prompt_remove_symbolcard.md`, `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.scss`, `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.tsx`, `frontend/src/components/editors/railSystem.scss`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6ada3b757` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5849 tests in 230 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Merge brings in only the three SymbolCard paths (two deleted files, railSystem.scss); the other frontend/src differences from the branch tip are trunk-side sim files, disjoint. Branch probe P-2026-09-29-1929 on :3002: Symbol tab opens the modal, 12 rail tab bars identical to the 1826 measures; gates green on the merge
**Notes**: Rollback tag `pre-symbolcard-cleanup` on `7c2539ae9` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-1947/result.json`.
**Prompt document name**: 2026-09-29 19:47

## 2026-09-29 — style(editors): drop SymbolCard leftovers in railSystem.scss (P-2026-09-29-2253)
**Prompt**: `claude_2026-09-29_2253_prompt_railsystem_symbolcard_leftovers.md`, `Lane: fast`, on `~/jjodel-w-railleft` branch `railsystem-leftovers`. Remove the two invisible leftovers reported by P-2026-09-29-1929 in `railSystem.scss`: the dead `.symbol-card` selector in the background list and the SymbolCard mention in the header comment. Not merged, as asked.
**Files touched**: code `26b29ae57`: `frontend/src/components/editors/railSystem.scss` (the `.symbol-card` selector and its comma, three lines of the header comment reflowed). Closure commit: this entry and the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-29 19:29 claude_2026-09-29_1929_prompt_remove_symbolcard.md (it reported these two leftovers)
**Causa**: (c)
**Regressions**: no. `npm run build` exit 0, only the chunk-size warning; `npm run typecheck` exit 2 with 14 errors, the baseline count; `npm run check:docs` 4/4 passed. No visual probe, as the prompt states.
**Out-of-scope changes**: no, one source file, the one the prompt lists.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile. Evidence in place of a probe: `command grep -rniE 'symbol-card|SymbolCard' frontend/src` returned exactly the two lines named (26 and 52) before the edit (control on `properties-panel` in the same file found hits) and returned nothing, exit 1, after it. The removed selector matched no element and `> section.properties-tab.properties-panel` already covers the same sections.
**Notes**: Rollback is `git revert 26b29ae57`. The Status flip is a plain edit of the prompt file, made by hand because the `status-flip` skill is user-invoked only.
**Prompt document name**: 2026-09-29 22:53

## 2026-09-29 — merge: railsystem-leftovers into alfonso-frontend-jjtl (P-2026-09-29-2302)
**Prompt**: `claude_2026-09-29_2302_prompt_merge_railsystem-leftovers.md`, a direct merge by `lane-run merge --direct`, no session: `railsystem-leftovers` at `5555a3619` into `alfonso-frontend-jjtl`, merge base `313a84663`, 3 commits on the branch side.
**Files touched**: merge `e42e5d7f5`: 3 files from the branch side (`docs/log-inbox/symbol-editor.md`, `docs/prompts/claude_2026-09-29_2253_prompt_railsystem_symbolcard_leftovers.md`, `frontend/src/components/editors/railSystem.scss`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e42e5d7f5` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5905 tests in 234 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: No visual change by construction: the removed selector targeted .symbol-card, which no element carries (grep of symbol-card/SymbolCard in frontend/src: 0 hits after merge); the remaining selector covers the same section; the other change is a comment. Gates green.
**Notes**: Rollback tag `pre-railsystem-leftovers` on `313a84663` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-09-29-2302/result.json`.
**Prompt document name**: 2026-09-29 23:02

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
