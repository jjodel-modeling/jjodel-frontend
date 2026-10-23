# log-inbox — lane «codegen»

Entries written by the code generation pilot lane on `codegen-pilot` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---


## 2026-10-23 — discovery: codegen text mode, generation limits, JjEL prototype reads, worker CSP (P-2026-10-23-2010)
**Prompt**: Read-only discovery for 3.2 after S2: template bodies in text mode with an additive `mode` field, recursion/time/output limits of generation, JjEL prototype reads, CSP for the runner's worker; slices alongside S3/S4 and provisional rows
**Files touched**: docs/discovery/discovery_2026-10-23_codegen_textmode_safety.md (new), docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_2010_prompt_codegen_textmode_safety_discovery.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Probe reproduced the reads and found natives callable via `xs.map(x.toString)` and `replace` (no write, no path to Function). Depth 64 exists; fan-out is unbounded and holes swallow throws, so limits must be sticky. Rows R-GEN-25..30 provisional in the report only. A temporary probe test was written and deleted (not committed). Nothing awaits Alfonso from RC-26.
**Prompt document name**: 2026-10-23 20:10

## 2026-10-23 — feat(codegen): Template Editor dock tab, jjel-template language, markers, Save in one step (P-2026-10-23-1945)
**Prompt**: Slice S2: a dock tab codegen_tpl_<metamodelId> per metamodel (R-GEN-20), list and Monaco with the jjel-template language (R-GEN-24) and parse markers, Save only on button or Ctrl/Cmd+S in one undo step with dirty drafts (R-GEN-22), refused for consumers (R-GEN-23), «Open editor» in the Code panel
**Files touched**: frontend/src/codegen/ui/templateLanguage.ts (new), frontend/src/codegen/ui/templateMarkers.ts (new), frontend/src/codegen/ui/__tests__/templateMarkers.test.ts (new), frontend/src/codegen/ui/templateDrafts.ts (new), frontend/src/codegen/ui/__tests__/templateDrafts.test.ts (new), frontend/src/codegen/ui/TemplateEditorTab.tsx (new), frontend/src/codegen/ui/TemplateEditorTab.scss (new), frontend/src/codegen/ui/openTemplateEditor.ts (new), frontend/src/codegen/ui/CodePanel.tsx, docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_1945_prompt_codegen_s2_template_editor.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: templateDrafts.ts is outside DOVE (pure draft rules, so they are testable without Monaco): ratified as recommended, unattended. Save writes every draft at once; New and Delete write at once, as the panel. The tab is closable: false, its title has the close button that asks (rc-dock close cannot be vetoed). Five mutants killed, benches in 12f7bf5db and 540fa488a. Lazy gate on green; off not run (ticket). No browser here: checks are the chat's (RC-23).
**Prompt document name**: 2026-10-23 19:45

## 2026-10-23 — ticket: the lazy gate's off mode is red since .env.production carries VITE_CODEGEN
**Ticket**: `npm run check:codegen-lazy` fails off clauses 0, 1 and 3 on any tree: the off build runs in production mode, and `.env.production` sets `VITE_CODEGEN = true` since 2046c17a3, so the build resolves the flag on whatever the process env says. Measured on the tip 478e5bc73 with `--off` (same three FAILs). The on mode stays green. Fix belongs to the gate or the env files, not to a codegen slice.
**Priority**: medium
**Found in**: P-2026-10-23-1910

## 2026-10-23 — feat(codegen): Code panel on M2, model chooser, no pill for consumers (P-2026-10-23-1910)
**Prompt**: Slice S1: the Code pill on an M2 canvas under the M1 rule (R-GEN-19), the panel on a metamodel with a chooser of conforming project models and an empty state, no pill in consumer mode (R-GEN-23), R-GEN-21 if time left
**Files touched**: frontend/src/codegen/setting.ts, frontend/src/codegen/__tests__/setting.test.ts, frontend/src/components/editor-v2/EditorV2.tsx, frontend/src/codegen/ui/CodePanel.tsx, frontend/src/codegen/ui/CodePanel.scss, frontend/src/codegen/ui/conformingModels.ts (new), frontend/src/codegen/ui/__tests__/conformingModels.test.ts (new), docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_1910_prompt_codegen_s1_code_on_m2.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Inverts the committed «M1 only» pill row on purpose. R-GEN-21 done. SELECT_NODE keeps the editor id, not the target model (the report said otherwise; EditorV2 filters on its own id). Four mutants killed, bench in c192a4f5e. Lazy gate: on green, off red as on the tip (ticket above). No browser in this lane: DOM checks and crops are the chat's (RC-23), so Regressions stays unknown.
**Prompt document name**: 2026-10-23 19:10

## 2026-10-23 — discovery: code generation authoring, Code on M2 and a Template Editor (P-2026-10-23-1840)
**Prompt**: Phase 1 read-only: how to open the Code panel on M2, a full Template Editor modelled on the JjTL one, two to four slices for Saturday to Monday, risks, provisional R-GEN rows; hard stop after the report
**Files touched**: docs/discovery/discovery_2026-10-23_codegen_authoring.md (new), docs/prompts/claude_2026-10-23_1840_prompt_template_editor_discovery.md (Status), docs/log-inbox/codegen.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Code on M2 touches setting.ts, EditorV2 (CodegenSlot), CodePanel, no critical-zone file; JjEL has no Monaco language (jjtl is the only one, its completion provider is never registered). Four slices: S1 M2, S2 editor tab, S3 preview, S4 completion; cut S4 then S3. Provisional R-GEN-19..24 in the report, not in decisions.md. Nothing built or run in this lane.
**Prompt document name**: 2026-10-23 18:40

## 2026-10-23 — feat(codegen): template bodies in text mode, mode toggle and converter (P-2026-10-23-2030)
**Prompt**: S5: `parseTemplateText` (lexer option `textBody`), record field `mode?: 'text' | 'expression'` absent read as expression, new templates text, mode toggle and converter in both editors, text-mode Monaco language and markers, check the S2 Revert and stray-quote findings, tests T1 to T5
**Files touched**: c90c22d0f jjel/lexer/lexer.ts, jjel/parser/parser.ts, jjel/index.ts, jjel/__tests__/templateText.test.ts (new); 3b89efd49 codegen/engine/templates.ts, templateCodec.ts, origin.ts, engine/__tests__/textMode.test.ts (new); 6024127a4 codegen/ui/CodePanel.tsx, TemplateEditor.tsx, TemplateEditorTab.tsx, templateDrafts.ts, templateLanguage.ts, templateMarkers.ts, templateMode.ts (new), ui/__tests__/templateDrafts.test.ts, templateMarkers.test.ts, templateMode.test.ts (new); docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_2030_prompt_codegen_s5_text_mode.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Above five files, all in the prompt's DOVE (rule 19). Golden code of both examples hashed on 26a267f18 before any change, asserted after (T2). Revert finding not reproduced by reading (effect after paint); stray quote fixed by text default plus `autoClosingOvertype: 'always'`. Not one string: 4 of 13 and 5 of 12, not 3. Toggle is a Mode select (no SCSS in DOVE). Gates: typecheck, build, vitest jjel+codegen 2540, lazy on green.
**Prompt document name**: 2026-10-23 20:30
