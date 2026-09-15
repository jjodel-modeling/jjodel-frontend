## 2026-09-16 — feat: edit conditional axes as a rules table, add formatPredicate
**Prompt**: `docs/prompts/2026-09-15_1830_slice-1_rules-editor.md`, with the answers of
`docs/prompts/2026-09-16_ack-slice-1_rules-editor.md` (Q1 opt-in on Fill and Marker only, Q1b the
`TextStyleEditor.flip` bug, Q2 up/down buttons, Q3 `{rules: [], default}`, Q4 explicit Otherwise,
Q5 absence as the canonical none, Q6 per-axis middle label, Q7 `subjectName` and chips out of
scope, Q8 what `formatPredicate` prints, Q10 the stale help text, Q11 panel ownership).
**Files touched**: code, commit `aeb0c9134`: `ui/ConditionalEditor/conditional.ts` (`RulesForm`,
`toRules`, `fromRules`, `formatPredicate`), `ui/ConditionalEditor/ConditionalEditor.tsx` (optional
`rulesTable` prop + `RulesModeEditor`), `ui/ConditionalEditor/ConditionalEditor.module.css`, new
`ui/ConditionalEditor/__tests__/conditional.test.ts` (46 tests), `authoring/VertexAuthoringPanel.tsx`
(3 lines: Fill, Marker, the Basic-mode help text), `authoring/TextStyleEditor.tsx` (`flip` reads
through `toRules`). Docs in their own commits: this entry and the TECH-DEBT ticket for the
suggestion chips. Phase 1 report: `discovery_2026-09-16_rules_editor_format_predicate.md`
(`b9ff7f36a`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** `error TS` on full output (the §17
baseline), same set line-stripped as the pre-edit run (`diff` exit 0), **0** in the six touched
files; positive control `Measurable` → 6. `npx vitest run src/components/ui
src/components/editor-v2/viewpoint/ir src/components/editor-v2/viewpoint/authoring`: 34 files,
**792 passed, 0 failed** (26 files / 586 before this slice, on ui + ir alone). `npm run build`
exit 0, only the pre-existing chunk-size warning. Mutation bench on `conditional.ts`: **10/10
killed**, source restored (`cmp` exit 0). The tenth needed a test that reaches the guard (a
self-referencing predicate): the try/catch survived every malformed input already covered.
**Out-of-scope changes**: yes, both granted by the ACK: `TextStyleEditor.flip` (Q1b — on a `rules`
value `.then` is `undefined` and the ƒx button unset the axis) and the help text at
`VertexAuthoringPanel.tsx:423` (Q10). Six files, over rule 19's threshold, every one named by the
prompt or the ACK; declared here as RC-11 requires.
**Layer Impact Report**: not-required — no critical-zone file (§3.1); no TRANSACTION, no D-layer
write, no persistence change (the IR keeps the shapes `irCompile` already compiles).
**Smoke visivo**: passato — Playwright probe `scripts/smoke/_tmp_rules_editor_verify.ts`
(gitignored) on the live server: **30 PASS, 0 FAIL, 0 page errors**, over a real M2/M1 fixture with
the IR demo viewpoint active. It measures the IR after each gesture, the canvas colour per instance
(reorder flips Idle from green to red live), the popover on top at its own pixel
(`elementFromPoint`), Esc closing the popover and not the modal, and the three write rules. Plus the
2b and 2i screenshots read by eye. `npm run smoke` came back **VOID** twice, not failed: slice 3 was
editing `irValidate.ts`, `notationCatalog.ts` and `shapeRegistry.ts` under the run (8 boots of
`empty-project`). Reported with its cause as P8 asks.
**Notes**: Reorder is up/down buttons (ACK Q2), not the mockup's ⋮⋮ handle: no drag library exists in the repo. Measured at 1600px the Properties rail paints over the modal's right column and intercepts every click on Fill and Marker — a pre-existing layer, not this slice; the probe runs at 2400. This entry sits in `docs/log-inbox/` and not in the log itself: parallel lanes (P9), as slice 3 did.
**Prompt document name**: 2026-09-15 18:30
