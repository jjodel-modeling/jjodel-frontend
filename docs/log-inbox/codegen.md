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

## 2026-10-23 — feat(jjel): member guard, no prototype reads (P-2026-10-23-2105)
**Prompt**: S6: the JjEL member guard of the discovery §3.3 (R-GEN-29) on every member path: `__proto__` and inherited Object.prototype names read as missing, no member read yields a native function, method tables own keys only, literal `__proto__` an own key; tests with a mutation bench; regression over the evaluator's users
**Files touched**: bf9bde96b jjel/evaluator/evaluator.ts, evaluator/builtins/collections.ts, strings.ts, numbers.ts, dates.ts, jjel/__tests__/memberGuard.test.ts (new); docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_2105_prompt_codegen_s6_jjel_guard.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Six code files, all in DOVE (rule 19). 44 tests; bench 13/13 killed (G1 and G2 on dot, index, callMethod; the `__proto__` line; G4; G3 in five tables). The number table owns a real `toString`: kept, tested. No existing expectation changed. Gates: typecheck, build, vitest jjel+codegen+simulation+editor-v2 7195 green, whole suite 11705 with the 9 known window files only, lazy on green. Visual check owed by the chat (RC-23).
**Prompt document name**: 2026-10-23 21:05

## 2026-10-23 — feat(codegen): generation budget, worker lockdown (P-2026-10-23-2145)
**Prompt**: S7: a sticky generation budget (R-GEN-28), 2000 ms and 1,000,000 output characters, checked at template calls, holes, interpolate, concat, join; one error and no code when it trips; runner worker also removes Worker, SharedWorker, caches and navigator.storage (R-GEN-30); tests; no CSP change
**Files touched**: b588a2e28 codegen/engine/generate.ts, templates.ts, origin.ts, text.ts, runner/runner.worker.ts, engine/__tests__/budget.test.ts (new), runner/__tests__/runner.test.ts; docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_2145_prompt_codegen_s7_limits_worker.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Seven code files, all in DOVE (rule 19). 17 tests; bench 8/8 killed. New names in a list of their own, `ESCAPE_GLOBALS`: `NETWORK_GLOBALS` is pinned at eight by an existing test. Turnstile and Petri code+map+errors sha256 identical before and after. No existing expectation changed. Gates: typecheck, build, vitest jjel+codegen+simulation+editor-v2 7212 green, lazy on green. Visual check owed by the chat (RC-23).
**Prompt document name**: 2026-10-23 21:45

**Ticket** (R-GEN-30, hosting, not in this tree): `import()` inside the runner worker still reaches any URL; only a CSP on the response of `assets/runner.worker-*.js` stops it (`default-src 'none'; script-src 'self' blob:; worker-src 'none'`, discovery 2026-10-23 §4.3), and no nginx config in the repo sends one.

## 2026-10-23 — feat(codegen): Template Editor live preview (P-2026-10-23-2225)
**Prompt**: S3: right pane of the Template Editor, model and entry selects, generated text in the panel's pre-with-gutter form via a new codeLines.ts (linesOf moved from CodePanel), refresh 400 ms after the last edit over stored list plus drafts, edited template's generation errors as `codegen-gen` markers, refresh cost measured
**Files touched**: 917ca4106 codegen/ui/TemplateEditorTab.tsx, TemplateEditorTab.scss, CodePanel.tsx (import), codeLines.ts (new), templatePreview.ts (new), __tests__/codeLines.test.ts (new), __tests__/templatePreview.test.ts (new); docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_2225_prompt_codegen_s3_live_preview.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Seven code files, all in DOVE (rule 19). Refresh on Petri, dev server, in page: buildEvalContext 11.3 + generate 1.7 ms, median 13.1, max 15.3, first 28.1; turnstile 8.2. Under 100 ms, debounce stays 400. 21 tests, bench 12/12 killed. No existing expectation changed. Gates: typecheck, build, vitest codegen+editor-v2 5997 green, lazy on green. Visual check owed by the chat (RC-23).
**Prompt document name**: 2026-10-23 22:25

## 2026-10-23 — feat(codegen): Template Editor completion (P-2026-10-23-2300)
**Prompt**: S4: completion in the Template Editor, a pure context builder over the metamodel (classes, inherited features, templates with params, stc and target members) and one provider for jjel-template and jjel-template-text over a context the open tab sets and clears; text mode offers only inside a hole, after `.` only for a receiver of known class
**Files touched**: 666740aa0 codegen/ui/templateCompletion.ts (new), __tests__/templateCompletion.test.ts (new), templateLanguage.ts, TemplateEditorTab.tsx; docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-23_2300_prompt_codegen_s4_completion.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Unattended: a param's class comes only from its call sites (forall over C.instances, fixpoint), never its name; `self` is unbound in a template, so `self.` offers nothing; a class name two classes share is left out. 23 tests, bench 12/12 killed. No existing expectation changed. Gates: typecheck, build, vitest codegen+editor-v2 6020 green, lazy on green. Visual check owed by the chat (RC-23).
**Prompt document name**: 2026-10-23 23:00

## 2026-10-24 — docs(decisions): R-GEN-19..43 to the register (P-2026-10-24-0000)
**Prompt**: Port the R-GEN rows of 2026-10-23 into docs/decisions.md: 19..24 (authoring) and 25..30 (text mode) as provisional, unattended; 31..38 (generator viewpoint) as ratified «si su tutto», with 37 and 38 marked superseded; five new rows 39..43 (release boundary, generator tab, two-way provenance, left-bar GENERATORS section, slice order).
**Files touched**: docs/decisions.md, docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-24_0000_prompt_codegen_decisions_port.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Rule texts copied from the reports, first sentence set in bold as the rule. No numbering collision: R-GEN-24 is the authoring report's, the text-mode report starts at 25. Rows 19..30 carry evidence read, verified none, reversible branch (the reports gave no values).
**Prompt document name**: 2026-10-24 00:00

## 2026-10-24 — feat(codegen): generator codec, genGenerators beside genTemplates (P-2026-10-24-0001)
**Prompt**: G1 of 3.3: a pure codec for several generators per metamodel. `genTemplates` stays the default's list; `genGenerators` holds the others and the default's metadata. Readers, a one-delta Save patch, list helpers, tests with a mutation bench; the pill rule also reads `genGenerators`.
**Files touched**: frontend/src/codegen/engine/generatorCodec.ts (new), frontend/src/codegen/engine/__tests__/generatorCodec.test.ts (new), frontend/src/codegen/setting.ts, frontend/src/codegen/__tests__/setting.test.ts, docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-24_0001_prompt_codegen_g1_generator_codec.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Feat f41de8b23, bench 6/6. Decided unattended: decoded records carry resolved metadata (root, files, target), written once genGenerators is first saved; the patch compares with the decoded keys, so bytes with defects or unknown fields survive an unchanged part; default name «Default»; addGenerator's file is `<name>.txt` with entry `main`; ids `g1`, `g2`.
**Prompt document name**: 2026-10-24 00:01

## 2026-10-24 — feat(codegen): generation per file with the generator's target (P-2026-10-24-0002)
**Prompt**: G2 of 3.3: `generateGenerator` runs `generate` once per declared file of a generator, with that file's entry and the generator's target (`js` or none), the generator id on the result; the template name on every clickable fragment origin (R-GEN-41); tests with a mutation bench.
**Files touched**: feat 8bdead3c5: frontend/src/codegen/engine/generateFiles.ts (new), frontend/src/codegen/engine/__tests__/generateFiles.test.ts (new), frontend/src/codegen/engine/generate.ts, frontend/src/codegen/engine/origin.ts, frontend/src/codegen/engine/text.ts, frontend/src/codegen/engine/__tests__/origin.test.ts, frontend/src/codegen/engine/__tests__/generate.test.ts; docs: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-24_0002_prompt_codegen_g2_generate_files.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 5/5. Out of DOVE: origin.test.ts and generate.test.ts, whose exact-shape origin expectations gained `template` (34 reds otherwise); nine files in all. Decided unattended: `template?` on ModelOrigin and OpaqueOrigin (text.ts:47-49), filled at origin.ts attribute/modelOrigin from the hole's position, absent when unknown; `generate` gains an optional last `target`, default `js`.
**Prompt document name**: 2026-10-24 00:02

**Ticket** (G4 input): opaque fragments built outside a hole (a `join` separator, a `+` operand, origin.ts `toText`/`opaque(', ')`) carry no template; a hole-level stamp would credit a called template's separators to its caller, so the right place is the template-call return in templates.ts, outside this lane's DOVE.
