# log-inbox — lane «symbol-editor»

Entries written by the Symbol Editor lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-21 — feat: Symbol Editor S6, underline row and corner radius rules table (P-2026-09-21-1455)
**Prompt**: `P-2026-09-21-1455`, two-phase. Phase 1 report `660b61042` (`docs/discovery/discovery_2026-09-21_symbol_editor_s6_underline_corner_rules.md`), GO with three answers: hide the Underline row at the Symbol-text mount through an optional prop; add an Underline segment to the trigger summary; radius as option Y. D-S6-1, D-S6-3 and D-S6-4 as written. One code commit, then this docs commit.
**Files touched**: code `94eb92a21`, 7 files: `authoring/TextStyleEditor.tsx`, `TextStyleField.tsx`, `VertexAuthoringPanel.tsx`, `previewInstances.ts`, `SymbolEditorModal.tsx`, `authoring/__tests__/textStyleEditor.test.ts` (new), `previewInstances.test.ts`. Docs, this commit: this entry, `docs/decisions.md` (closure line under R-IRN-35), the prompt file (Status), the Phase 2 addendum of the discovery report.
**Outcome**: ✅ completed — the visual check (a) to (d) is Alfonso's, not run here.
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates on the code commit: `npm run typecheck` exit 2, **14** errors, the baseline set, **0** in the touched files; `npx vitest run` **3981 passed, 0 failed** (3962 + 19 new), the same 9 files red at import; `npm run build` exit 0. The panel change (scalar stepper inside `ConditionalEditor`, Reset, glyphs), the modal wiring and the summary segment have no executable test, so "scalar case unchanged" rests on the visual check.
**Out-of-scope changes**: yes — `TextStyleField.tsx` was outside the prompt's DOVE and joined it by the GO (answers 1 and 2); 7 code files, above the P6 five, all named by the GO and by the report §9b. Nothing else outside the list.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — hard stop before Alfonso's visual check: (a) scalar radius edits and Reset as before, key removed on Reset; (b) one radius rule makes the thumbnails differ; (c) label underline On/Off and the trigger reads `Underline`, not `Custom`; (d) no Underline row on Symbol text.
**Notes**: D-S6-2 as written is superseded: the radius is a peer rules axis (ConditionalEditor + rulesTable in Shape, like form, fill, marker), not a fourth entry of the Border OVERRIDES read-back; borderOverrides.ts untouched. Test gap: VertexAuthoringPanel, SymbolEditorModal and the trigger summary have no executable test (window at import, or outside the GO). The prompt's R-IRN-3, addendum §7 and formAuthoring.test.ts references were dropped; the ignored-axis warning is R-IRN-31.
**Prompt document name**: 2026-09-21 14:55
**Ticket** (opened, not implemented here). The renderer applies a text style on the box root (`IRNodeContent.tsx:427`, `Object.assign(inlineStyle, resolveTextStyle(compiled.text, ...))`), so a Symbol-level `underline` is a `text-decoration` that reaches every in-flow text of the symbol and no label can override it (measured on pixels, discovery report §4.2: a child `text-decoration: none` still paints the ancestor's line; absolutely positioned badges are not reached). Fixing it means applying the underline on the text nodes instead of the root. When that is done, remove `hideUnderline` from the Symbol-text mount (`VertexAuthoringPanel.tsx`) so the row shows there. Mutation bench of the new tests (12 of 12 killed) is in the commit message of `94eb92a21`.
