# log-inbox — lane «codegen»

Entries written by the code generation pilot lane on `codegen-pilot` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---


## 2026-10-30 — feat(codegen): generator import and export as JSON, Templates tab and dashboard (P-2026-10-30-1430, P-2026-10-30-1515)
**Prompt**: Import and export of a generator as a JSON file, from the Templates tab and from a new GENERATORS dashboard section, on the multi-generator storage of cg-generators. 1430 = discovery (Phase 1); 1515 = code (Phase 2) after the context ceiling; 1540 = this docs closure.
**Files touched**: discovery 26d27c5e9: docs/discovery/discovery_2026-10-30_generator_import_export.md; 8a66dcde9: docs/prompts (acceptance fixtures); 7fbedcc78: frontend/src/codegen/engine/generatorFile.ts, engine/__tests__/generatorFile.test.ts; 03db53f3f: codegen/ui/generatorTransfer.ts, ui/GeneratorImportDialog.tsx + .scss, ui/TemplateEditorTab.tsx, ui/__tests__/generatorTransfer.test.ts; 9d844eca3: codegen/ui/GeneratorsSection.tsx, frontend/src/components/project/ProjectEditor.tsx; closure: this inbox, the discovery report, three prompt files
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (not run: the tab icons, the dialog and the dashboard section await Alfonso's visual check)
**Notes**: Gates after 9d844eca3 all green: tsc 0, vitest src/codegen 2286 tests, build, check:codegen-lazy --on. 15 mutants killed. Open: visual check; byte comparison of generated SMV and Verilog with the hand-entered generators; ArbiterSpec_to_SyncRTL.json holds no Expr objects (ticket candidate). Entry in the inbox per P13.
**Prompt document name**: 2026-10-30 15:40

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

## 2026-10-24 — ticket: codegen-panel.ts probe drives the removed floating panel
**Ticket**: `frontend/scripts/probe/codegen-panel.ts` still drives the 3.2 floating Code panel, which G3 turned into a launcher (R-GEN-40): its phase on fails from «the pill opens the panel» onward. Port it to the generator tab, keeping the same assertions: templates written through the tab's list, Monaco and Save; Output becomes Preview; span-to-canvas and canvas-to-span links with the tab and the model's editor in separate dock tabs; Run modes; the scroll and gutter metrics of the code view re-measured on the pane. Phase off (`CGP_PHASE=base`) does not touch the panel and still applies. The checks that `codegen-check.ts` covered were ported by P-2026-10-24-0045; the new `codegen-generator-tab.ts` covers the tab.
**Priority**: medium
**Found in**: P-2026-10-24-0045

## 2026-10-24 — feat(codegen): generator tab, panel as launcher, two-way provenance (P-2026-10-24-0003, P-2026-10-24-0045)
**Prompt**: G3 of 3.3 (0003, cut at the context limit, work uncommitted) completed by 0045: lazy-split check and commit of the G3 work; Run enabled only on target `js` (R-GEN-35) with its test; mutation bench on generatorTabs.test.ts; probe of the generator tab; old probes ported or ticketed; the seven crops.
**Files touched**: feat e4be12d09: frontend/src/codegen/ui/ CodePanel.tsx, CodePanel.scss, GeneratorPane.tsx (new), TemplateEditorTab.tsx, TemplateEditorTab.scss, openTemplateEditor.ts, canvasSelection.ts (new), codeOrigins.ts (new), generatorTabs.ts (new), __tests__/generatorTabs.test.ts (new); fix 1c74ff6fd: generatorTabs.ts, GeneratorPane.tsx, generatorTabs.test.ts; fix 5a4cbed0c: GeneratorPane.tsx; test 52f4a6e0c: frontend/scripts/probe/codegen-generator-tab.ts (new); test 8e598441f: frontend/scripts/probe/codegen-check.ts; docs: docs/log-inbox/codegen.md, the Status lines of the 0003 and 0045 prompts
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 00:03
**Causa**: (g)
**Regressions**: yes
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 7/7. Probes on 3131: generator-tab 22/22, codegen-check 43/43; crops in the 0045 lane folder, visual check by the chat (RC-23). Regression: G3's scrollIntoView scrolled .dock-top 1321px when the tab went behind; fixed in 5a4cbed0c, the probe guards it. Unattended: that fix (a G3 bug, no feature); the 0003 handoff's decisions 1-9. Cleanup candidate: TemplateEditor.tsx, no importer. Not fixed: «g1 (gone)» flashes on a new generator's first render. 15 files, all in DOVE.
**Prompt document name**: 2026-10-24 00:45

## 2026-10-24 — feat(codegen): GENERATORS section in the project left bar (P-2026-10-24-0004)
**Prompt**: G4 of 3.3 (R-GEN-42): a GENERATORS section after TRANSFORMS in the project left bar, setting on only, none in consumer mode; rows open the generator tab, «+ New generator» creates one; both by dynamic import, so the lazy gate stays green. generatorEntries in setting.ts with tests, probe, crops.
**Files touched**: feat 51620011c: frontend/src/codegen/setting.ts, __tests__/setting.test.ts, ui/TemplateEditorTab.tsx, ui/openTemplateEditor.ts; frontend/src/pages/components/LeftBar.tsx, pages/dashboard.scss; frontend/scripts/probe/codegen-leftbar.ts (new); docs: docs/log-inbox/codegen.md, the prompt's Status line
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 10/10 on generatorEntries. Probe on 3132: 21/21; crops in the lane folder, visual check by the chat (RC-23). Lazy gate --on green, only setting.ts eager. Out of DOVE, unattended (RC-21): the tab's «New generator» lifted into an exported createGenerator in TemplateEditorTab.tsx, re-exported by openTemplateEditor.ts; the creation had no entry outside the component. 7 files (>5). Not covered: the multi-metamodel group header and metamodel picker (no fixture with two metamodels).
**Prompt document name**: 2026-10-24 00:04

## 2026-10-24 — fix(codegen): empty state for a generator with no templates (P-2026-10-24-0318)
**Prompt**: 3.3 fix: a generator with no templates shows a neutral empty state in Preview, Run and Check instead of the red "No template named 'main'"; a missing root over a non-empty list stays an error. Tests with named kills, probe extended with the empty generator and the go-to-template range reveal, crops.
**Files touched**: fix eae105d89: frontend/src/codegen/ui/GeneratorPane.tsx, ui/generatorTabs.ts, ui/__tests__/generatorTabs.test.ts; frontend/scripts/probe/codegen-generator-tab.ts; docs: docs/log-inbox/codegen.md, the prompt's Status line
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 00:03 (P-2026-10-24-0003)
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 4/4. Probe on 3131: 26/26, crops in the lane folder for the chat (RC-23). Out of DOVE, unattended (RC-21): noTemplates and paneGeneration added to generatorTabs.ts, because GeneratorPane.tsx does not import in vitest. Reveal: the map gives no range for a model fragment (ModelOrigin has no template position), so TemplateEditorTab.tsx is unchanged. On a literal fragment the range is selected and revealed (goto_range.png).
**Prompt document name**: 2026-10-24 03:18

## 2026-10-24 — fix(codegen): generator tab beside the canvas, resizable columns (P-2026-10-24-1515, P-2026-10-24-1630)
**Prompt**: 1630 completes 1515, stopped at the context ceiling with its work uncommitted. Alfonso's visual check of 15:08: a fragment click hid the code behind the canvas (one dock panel for both); he asked to resize the template and generated columns. The tab docks right of the canvas panel (45 %), joins the metamodel's other generator tabs, is moved beside on a fragment click; the Properties/Tree rail anchors to the canvas dock panel (scope extended by the chat, RC-25); splitter 200 px minimums, reset 0.55, ratio in localStorage.
**Files touched**: fix 826a0f6bc (1515): frontend/src/codegen/ui/openTemplateEditor.ts, canvasSelection.ts, GeneratorPane.tsx, TemplateEditorTab.tsx, TemplateEditorTab.scss, splitter.tsx (new), __tests__/splitter.test.ts, __tests__/openTemplateEditor.test.ts (new); frontend/src/components/editors/PropertiesWithTreeView.tsx; frontend/scripts/probe/codegen-generator-tab.ts. fix 81ed10a75: ui/splitter.tsx, ui/TemplateEditorTab.tsx, ui/__tests__/splitter.test.ts. test f0c8c77f7: the probe. docs: docs/log-inbox/codegen.md, the Status lines of 1515 and 1630
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 15:15 (P-2026-10-24-1515)
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 8/8 (handoff's 7 + end minimum). Probe on 3133 ALL GREEN, 39 PASS; crops in ~/.jjodel-lanes/P-2026-10-24-1630/crops, rail_beside.png new. Rail, one dock panel, 1600x1000, model and metamodel: before = after, x 1200 w 400, insets 408/400 px. RC-21 rule in TemplateEditorTab.scss: shows the generator dock panel, no 710px cap, that panel only. Layer Impact: the rail holds the active editor's Tree pane and inspector; the canvas reads its insets. Also (c). Detail: 1515 handoff.md.
**Prompt document name**: 2026-10-24 16:30

**Ticket** (P-2026-10-24-1630): not done, optional item 5: collapsing the Properties rail, its translateX(100%) slides over the generator tab for 250 ms before unmount (cosmetic). Splitter fixed in this lane: the columns' paddings sat outside the flex share, a 50 px drag moved 45 px and the clamp stopped at 204 px; the probe's keyboard check focused the hidden second tab's splitter. Over five files (RC-11): the ten of 826a0f6bc above; PropertiesWithTreeView.tsx was outside 1515's DOVE, authorised by the chat. Unattended (RC-21): the prompt's fix subject is 85 characters, over the 72 of 6.2; 1515's own subject was used.

## 2026-10-25 — feat(codegen): syntax colouring of the generated text (P-2026-10-24-1516)
**Prompt**: Alfonso's visual check of 2026-10-24 asked for syntax highlighting of the generated code. Monaco's tokenizer on the shown file, language from the extension among registered ids; the linesOf pieces cut at token boundaries keeping their provenance (ui/codeTokens.ts colourLines); seven classes coloured from the Template Editor's theme; plain text and texts over the 1,000,000-character budget uncoloured.
**Files touched**: feat 4cc4da0b6: frontend/src/codegen/ui/codeTokens.ts (new), ui/__tests__/codeTokens.test.ts (new), ui/GeneratorPane.tsx, ui/TemplateEditorTab.scss, frontend/scripts/probe/codegen-generator-tab.ts. docs: docs/log-inbox/codegen.md, the Status line of 1516
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 8/8. Probe on 3134 43 PASS 0 FAIL; crops preview_coloured.png, preview_hovered.png in ~/.jjodel-lanes/P-2026-10-24-1516/crops. Unattended (RC-21): colours inline from jjtlTheme, not SCSS rules (rule 28 forbids defining CSS variables, a fixed palette drifts); the pane's hover is one band, the per-piece outline boxed every token; probe on 3134, 3133 held by 1630's vite (left running). codeLines.ts unchanged.
**Prompt document name**: 2026-10-24 15:16

## 2026-10-25 — fix(codegen): Properties collapses beside a generator tab (P-2026-10-25-0925)
**Prompt**: On a 1600 px viewport the 400 px Properties/Tree rail covered most of the canvas beside a generator tab. An opening of a generator tab collapses the rail (the topbar's own toggleRail) once a generator tab is beside the canvas panel; the last one closed or moved into the canvas panel restores the zones; a manual reopen is kept until the next opening; nothing persisted.
**Files touched**: fix dd1b87b96: frontend/src/codegen/ui/generatorTabs.ts, ui/TemplateEditorTab.tsx, ui/openTemplateEditor.ts, ui/__tests__/generatorTabs.test.ts, ui/__tests__/openTemplateEditor.test.ts, frontend/scripts/probe/codegen-generator-tab.ts (6 files, all in DOVE). docs: docs/log-inbox/codegen.md, the Status line of 0925
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 15:15
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Bench 9/9. Probe on 3134 (3133 held by 1630's vite) 50 PASS 0 FAIL; crops beside_selection.png, layout_closed.png in ~/.jjodel-lanes/P-2026-10-25-0925/crops. Layer Impact: PropertiesWithTreeView.tsx and TreeViewPanelContext untouched, the rail driven through the context's toggleRail/show/showInspector. Unattended (RC-21): pagehide restore under flushSync keeps the collapse out of localStorage; subject shortened to 72.
**Prompt document name**: 2026-10-25 09:25

**Ticket** (P-2026-10-25-0925): a fragment click that moves a generator tab stacked on the canvas back beside it (canvasSelection.ts keepBeside) is not an opening: the rail, restored when the tab was stacked alone, stays open. Arming there touches GeneratorPane.tsx or canvasSelection.ts, outside this DOVE. The 250 ms slide of the 1630 ticket now plays on every auto-collapse.

## 2026-10-25 · fix: generator tab with its header, scoped fragment highlight (P-2026-10-25-1045)
**Prompt**: Alfonso's visual check of 10:41: «the generator has no tab, and selecting a fragment selects everything». Diagnosis (measured on 3133): the generator tab sat in dock group `models`, whose rc-dock bar `navbar.scss:2111` hides, and the app bar lists only ids of the first dock panel, so the tab had no header anywhere; with no canvas docked it stacked over `project_summary`; `body[data-editor-type=summary]` (abstract/style.scss:1118 and four sibling modes) zeroed every panel right of the first. The JS runtime `${target.runtime}` is one opaque fragment of 342 lines (23..364), another of 138 (428..565).
**Files touched**: fix 21cbf99e6: frontend/src/codegen/ui/openTemplateEditor.ts, ui/generatorTabs.ts, ui/GeneratorPane.tsx, ui/TemplateEditorTab.scss, ui/__tests__/generatorTabs.test.ts, ui/__tests__/openTemplateEditor.test.ts, frontend/scripts/probe/codegen-generator-tab.ts (all in DOVE). docs: this entry and the Status line of 1045.
**Outcome**: ✅ completed (the lane stopped at the context ceiling after its gates, probe and bench; the chat committed the tree as one fix commit instead of the two the prompt asked)
**Corregge**: 2026-10-24 15:15, 2026-10-24 15:16
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: crops header_beside.png, header_leftbar.png, runtime_hover.png checked by the chat (RC-23); Alfonso's re-check pending
**Notes**: Gates: typecheck 0, build 0, vitest src/codegen 2240 passed, check:codegen-lazy --on all green; probe 58 PASS 0 FAIL; bench 8/8. Unattended (RC-25, provisional): (1) generator tabs in their own dock group `codegen` with rc-dock's title and close; (2) with no canvas docked the tab opens in a right split of the project page (45 %), not as an app-bar tab beside the project and model tabs: the app bar needs Navbar.tsx, outside DOVE, a deviation from the prompt flagged for Alfonso; (3) beside-target order: model asked > metamodel > a docked conforming model > the first panel's tab; (4) CSS lift in TemplateEditorTab.scss for the five body modes; (5) FRAGMENT_WHOLE_LINES = 3, a longer fragment highlights the hovered line plus a gutter extent bar, a click selects no text.
**Prompt document name**: 2026-10-25 10:45

## 2026-10-25 — fix(codegen): generator tab in the app bar when no canvas is docked (P-2026-10-25-1200)
**Prompt**: With no canvas docked the generator opened right of the narrow project page. It now joins the first dock panel, listed in the app bar beside the project and model tabs (bi-code-slash, «<generator> · <metamodel>», active state, close), full width when selected; with a canvas docked it stays beside it (1515/1045, rail 0925); moves between the two placements leave no ghost or duplicate
**Files touched**: fix 93cbd14fd: frontend/src/codegen/ui/generatorTabs.ts, ui/openTemplateEditor.ts, ui/TemplateEditorTab.tsx, ui/__tests__/generatorTabs.test.ts, ui/__tests__/openTemplateEditor.test.ts, frontend/src/pages/components/Navbar.tsx, navbar.scss; test 115cdbddd: frontend/scripts/probe/codegen-generator-tab.ts; docs: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-25_1200_prompt_codegen_generator_in_app_bar.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-25 10:45
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: crops appbar_generator.png, appbar_project.png, beside_unchanged.png in ~/.jjodel-lanes/P-2026-10-25-1200/crops for the chat (RC-23)
**Notes**: Gates: typecheck 0, build 0, vitest src/codegen 2245 passed, codegen-lazy --on green, check:scripts pass; probe 68/68 on 3133; bench 7/7 (6 unit, 1 probe). Layer Impact on Navbar.tsx: view only, syncTabs learns codegen_tpl_ ids from the tab's appBarTitle/requestClose, no import. Unattended (RC-25, provisional): hooks on the TabData; a canvas the first panel shows counts as docked; slate badge.
**Prompt document name**: 2026-10-25 12:00

**Ticket** (P-2026-10-25-1200): after a reload the dock restores the model tab but no generator tab (probe MEAS «the dock after the reload»: generators []), not fixed here (COSA 3). The app-bar title truncates to «Default · Demo…» under the strip's tab width, a perceptual item for Alfonso.

## 2026-10-25 — fix(codegen): from a canvas the generator tab moves beside it (P-2026-10-25-1310)
**Prompt**: Opened from GENERATORS with no canvas (app-bar tab), then the model canvas and its Code pill, the generator tab was only activated over the canvas. One placement rule: asked for while a canvas is shown, an open tab sharing the canvas's panel moves beside it (siblings' panel or right split, 45 %), the canvas active; one already beside is only activated; with no canvas shown it goes back to the first panel; a fragment click from the app bar ends side by side
**Files touched**: fix 007c4e106: frontend/src/codegen/ui/canvasSelection.ts, ui/openTemplateEditor.ts, ui/__tests__/openTemplateEditor.test.ts; test ddff3f6fc: frontend/scripts/probe/codegen-generator-tab.ts; docs: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-25_1310_prompt_codegen_pill_moves_tab_beside.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-25 12:00
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: crops finding_pill_beside.png, finding_fragment_beside.png in ~/.jjodel-lanes/P-2026-10-25-1310/crops for the chat (RC-23)
**Notes**: Gates: typecheck 0, build 0, vitest src/codegen 2249 passed, codegen-lazy --on green, check:scripts pass; probe 76/76 on 3133; bench 7/7 (unit). Unattended (RC-25, provisional): a canvas counts only while its panel shows a canvas, for new tabs too (GENERATORS with a canvas hidden behind the project page now joins the app bar); a new generator from a shown canvas never joins a sibling in the canvas's panel; the fragment move retries until the canvas is docked.
**Prompt document name**: 2026-10-25 13:10

## 2026-10-25 — fix(codegen): divider grab area, SELECT_NODE reveal beside a generator tab (P-2026-10-25-1355, P-2026-10-25-1441)
**Prompt**: 1355: a resizable boundary between the canvas and the generator tab beside it, a fragment click that selects its node and brings it into view, a measured diagnosis. 1355 closed items 0-1 and stopped on item 2 (codegen cannot reach React Flow's instance); 1441, the chat's answer (RC-25), fixed item 2 in EditorV2.tsx's SELECT_NODE handler: React Flow's own pane, same zoom, no move when the node is fully inside.
**Files touched**: 1355: f141bb614 frontend/src/codegen/ui/TemplateEditorTab.scss; d88d939bd frontend/scripts/probe/codegen-generator-tab.ts. 1441: 10abb57b3 frontend/src/components/editor-v2/EditorV2.tsx (SELECT_NODE handler and one import), editor-v2/utils/revealNode.ts (new), editor-v2/utils/__tests__/revealNode.test.ts (new); 6a34b2104 frontend/scripts/probe/codegen-generator-tab.ts; docs: docs/log-inbox/codegen.md, the Status lines of docs/prompts/claude_2026-10-25_1355_prompt_codegen_divider_and_reveal.md and claude_2026-10-25_1441_prompt_codegen_select_node_reveal.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-25 13:10
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: crops reveal_narrow.png, reveal_fullwidth.png in ~/.jjodel-lanes/P-2026-10-25-1441/crops, divider_before.png, divider_after.png in ~/.jjodel-lanes/P-2026-10-25-1355/crops, for the chat (RC-23)
**Notes**: 1441 gates: typecheck 0, build 0, vitest codegen + editor-v2 6118 passed, codegen-lazy --on green, check:scripts pass, probe 86/86 on 3133. Bench 8/8, temporary detached worktree: unit 5/5 (window-based centre, move on every select, fitView used, inset ignored, no fit shift), probe 3/3 (the handler of 6ca598d5f, move on every select, zoom 1). Probe mutant P0 started with the 1-minute load at 24.75, above 20. 1355 gates on f141bb614: probe 79/79, bench 2/2. 7 files, all in DOVE (RC-11).
**Prompt document name**: 2026-10-25 14:41

**Ticket** (P-2026-10-25-1355, item 0 diagnosis): (a) the divider beside the tab was shown, 1px wide (abstract/style.scss:580), ew-resize, and a drag on its exact pixel worked (generator 720 -> 869 px): the defect was a 1px hit target, reproduced by a drag 2px off the line (width stays 720). With the project page closed rule 322 hides the divider, but PinnableDock hides the canvas panel too. (b) Every fragment click (EVENTS coin, TRANSITIONS tc, $v0 tp, model tab closed and reopened by the click) selected its node, never in view on a canvas narrowed to 528 px (React Flow 201..729, node 627..842): EditorV2.tsx:1140 centred at (window.innerWidth - rightInset)/3 from React Flow's left and moved the canvas on every click. Decisions (unattended, RC-25 provisional): 1355-1 rule 322 not overridden (it matches only when the canvas panel is hidden too); 1355-2 a 7px grab area for the divider of a box holding a generator panel, 1px line in the middle; 1355-3 bench in a temporary detached worktree; 1441-1 the one-third placement (F3) kept, on React Flow's pane less the right inset, shifted so a node that fits ends wholly inside; 1441-2 a pane with no size leaves the viewport alone; 1441-3 the commit subject shortened to 71 characters (§6.2), «stays if visible» for «no move when visible».

**Ticket** (P-2026-10-25-1441, Layer Impact): view only (canvas v2-flow); no D-layer, L-layer, JjOM, sync or persistence write: the handler reads React Flow's store width/height and calls setViewport. Every SELECT_NODE emitter changes alike: codegen/ui/canvasSelection.ts:180, editor-v2/problems/ValidationResultsModal.tsx:87, editor-v2/hooks/neighborhoodAdapter.ts:79, TreeViewSidebar/TreeViewContent.tsx:1221; no emitter writes the string 'jjodel:selectNode' (grep). Full width, measured on the probe's layout (React Flow 201..1599 x 91..967, inset 408, window 1600x1000), a vertex panned off the left edge then a SELECT_NODE from elsewhere: centre (598.3, 424.3) with the handler of 6ca598d5f (bench P0), (531, 383) with the fix. Same rule, one third into the visible canvas, measured on the canvas instead of the window: the shift is (window - canvas)/3, here the 200 px left bar and 124 px of top chrome; 0 only when React Flow spans the window (unit test «on a full-width pane ...»). A pixel match with today would need the window size back, so it is not one: Alfonso's veto applies (RC-25).

## 2026-10-25 — fix(codegen): beside the canvas the generator tab is in the app bar (P-2026-10-25-1510)
**Prompt**: One tab bar, the app bar's. Beside a canvas the generator panel shows content only (no rc-dock tab bar, no maximize), the divider resizing content against the canvas; the app bar lists the generator tab next to the canvas tab, both active; its click keeps the layout and focuses the generator, its close removes the split (canvas full width, rail back); no ghost or duplicate entries between placements
**Files touched**: fix 214e5484e: frontend/src/pages/components/Navbar.tsx, frontend/src/codegen/ui/TemplateEditorTab.tsx, ui/TemplateEditorTab.scss, ui/generatorTabs.ts (comment), ui/openTemplateEditor.ts (comment); fix 8e474b79a: ui/TemplateEditorTab.scss; test 8cf2bc758: frontend/scripts/probe/codegen-generator-tab.ts; docs: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-25_1510_prompt_codegen_beside_tab_in_app_bar.md
**Outcome**: ✅ completed
**Corregge**: 2026-10-25 13:10
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: crops beside_two_tabs.png, appbar_close_full_width.png in ~/.jjodel-lanes/P-2026-10-25-1510/crops for the chat (RC-23)
**Notes**: Gates: typecheck 0, build 0, vitest src/codegen 2249 passed, codegen-lazy --on green, check:scripts pass, probe 92/92 on 3133. Bench 5/5 in a temporary detached worktree, probe only: bar shown, ghost filter for beside, close removes only the entry, duplicate (first panel walked twice), no focus. 8 files, all in DOVE (RC-11). Beside style: the same appbar-tab--active as the canvas tab, plus a marker class appbar-tab--beside with no style of its own.
**Prompt document name**: 2026-10-25 15:10

**Ticket** (P-2026-10-25-1510): it also corrects 2026-10-25 10:45 (the panel tab bar beside the canvas). Decisions (unattended, RC-25 provisional): 1510-1 the beside entry takes the canvas tab's active style, two active tabs on screen at once; 1510-2 «focus» is DOM focus on the generator root (tabIndex -1, no outline), so its keyboard shortcuts apply; 1510-3 the bar is hidden by `.not-strip .dock-panel.dock-style-codegen .dock-bar` (rc-dock 3.3.2 nests it in `.dock`, the first direct-child selector matched nothing, fixed in 8e474b79a); 1510-4 the four named kills are probe checks, not units: Navbar.tsx is not importable in the bench (window) and the bar is CSS. Lost with the panel bar: the title's unsaved dot; the template list keeps its per-template dots, the app-bar entry shows none. The probe's first start after an SCSS HMR on 3133 twice failed to open the model's pane; a fresh server ran green.

**Visual GO** (2026-10-25 16:05): Alfonso, «ok» on localhost:3131 after reloading cg-generators at 1b8135c1a, covering P-2026-10-24-1515/1516/1630, P-2026-10-25-0925/1045/1200/1310/1355/1441/1510.

## 2026-10-30 — merge: cg-generators takes alfonso-frontend-jjtl (P-2026-10-30-1510)
**Prompt**: RC-14: bring the trunk at 9606c352a into cg-generators with one --no-ff merge commit before the trunk takes the branch; union for decisions.md and the inboxes, step-4 probes, step-5 reading, gates, visual probes, GO.
**Files touched**: merge 574429a0f (253 trunk files; by hand, authorized in C-2026-10-30-1430: frontend/src/components/editor-v2/EditorV2.tsx, frontend/src/pages/components/LeftBar.tsx, frontend/src/pages/components/Navbar.tsx, frontend/src/pages/dashboard.scss); fix b38dccdac: LeftBar.tsx; fix 213b368a8: frontend/src/codegen/ui/TemplateEditorTab.scss; docs: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-30_1510_prompt_cg-generators_take_trunk.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: 4 code conflicts stopped the lane (question); 5 hunks then resolved by union, trunk first. Alfonso put GENERATORS above SCRIPTS (b38dccdac). The merge broke the divider drag beside a generator tab: the trunk's :not(:has()) raised the split cap to (0,7,1) over the lift (0,6,0); 213b368a8 (0,8,0). Gates green; vitest 455 files, 12186 passed, same 9 red. Probes: leftbar 19/19, generator-tab 92/92 on 3151/3152; crops in ~/.jjodel-lanes/P-2026-10-30-1510/crops.
**Prompt document name**: 2026-10-30 15:10

## 2026-10-30 — merge: cg-generators into alfonso-frontend-jjtl (P-2026-10-30-2200)
**Prompt**: `claude_2026-10-30_2200_prompt_merge_cg-generators.md`, a direct merge by `lane-run merge --direct`, no session: `cg-generators` at `5fdf3dc7a` into `alfonso-frontend-jjtl`, merge base `9606c352a`, 60 commits on the branch side.
**Files touched**: merge `52ff81621`: 57 files from the branch side (`docs/decisions.md`, `docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-10-24_0000_prompt_codegen_decisions_port.md`, `docs/prompts/claude_2026-10-24_0001_prompt_codegen_g1_generator_codec.md`, `docs/prompts/claude_2026-10-24_0002_prompt_codegen_g2_generate_files.md`, `docs/prompts/claude_2026-10-24_0003_prompt_codegen_g3_generator_tab.md`, `docs/prompts/claude_2026-10-24_0004_prompt_codegen_g4_leftbar_generators.md`, `docs/prompts/claude_2026-10-24_0045_prompt_codegen_g3_completion.md`, and 49 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `52ff81621` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12247 tests in 456 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: 3001 answers 200; branch probes on the same tree (cg-generators 5fdf3dc7a): codegen-leftbar ALL GREEN (GENERATORS above SCRIPTS), codegen-generator-tab ALL GREEN after 213b368a8; trunk merge clean, all gates green
**Notes**: Rollback tag `pre-cg-generators` on `ab864b9b8` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-30-2200/result.json`.
**Prompt document name**: 2026-10-30 22:00

## 2026-10-30 — merge: gen-io takes alfonso-frontend-jjtl (P-2026-10-30-2209)
**Prompt**: RC-14: bring the trunk at 5e81e8933 into gen-io with one --no-ff merge commit before the trunk takes the branch; union for decisions.md and the inboxes, step-4 probes, step-5 reading, gates, visual probes, GO.
**Files touched**: merge 358f48f5f (295 trunk files; by hand, authorized in C-2026-10-30-1430: frontend/src/components/project/ProjectEditor.tsx, the import hunk); docs: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-30_2209_prompt_gen-io_take_trunk.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: 1 code conflict stopped the lane (question); the import hunk resolved by union, branch first. Gates green: vitest 458 files, 12284 passed, same 9 red; hooks 967. generator-tab red twice on 3140, a vite started before the merge; fresh servers: this tree 92/92 on 3160, trunk tip 92/92 on 3161. Import/export by a gitignored probe: 14/14. Crops in ~/.jjodel-lanes/P-2026-10-30-2209/crops, crops-gentab, crops-io.
**Prompt document name**: 2026-10-30 22:09

## 2026-10-30 — merge: gen-io into alfonso-frontend-jjtl (P-2026-10-30-2300)
**Prompt**: `claude_2026-10-30_2300_prompt_merge_gen-io.md`, a direct merge by `lane-run merge --direct`, no session: `gen-io` at `d0fc59c7a` into `alfonso-frontend-jjtl`, merge base `5e81e8933`, 11 commits on the branch side.
**Files touched**: merge `1ed207097`: 17 files from the branch side (`docs/discovery/discovery_2026-10-30_generator_import_export.md`, `docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-10-30_1430_prompt_generator_import_export.md`, `docs/prompts/claude_2026-10-30_1515_prompt_generator_import_export_phase2.md`, `docs/prompts/claude_2026-10-30_1540_prompt_generator_import_export_closure.md`, `docs/prompts/claude_2026-10-30_2209_prompt_gen-io_take_trunk.md`, `frontend/src/codegen/engine/__tests__/fixtures/generator-smv.json`, `frontend/src/codegen/engine/__tests__/fixtures/generator-verilog.json`, and 9 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `1ed207097` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12284 tests in 458 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: generator-tab probe 92/92 and import/export probe 14/14 green on gen-io d0fc59c7a (P-2026-10-30-2209), same tree as the merge; gates green
**Notes**: Rollback tag `pre-gen-io` on `5e81e8933` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-30-2300/result.json`.
**Prompt document name**: 2026-10-30 23:00

## 2026-10-31 — feat(codegen): model origins for member reads inside + and join (P-2026-10-31-1341)
**Prompt**: Rule 1 of origin.ts per operand: in `"logic " + r.name + ";"` and in `list.map(r => r.name).join(", ")` each member read gets its model origin, as `${r.name}` does; values unchanged, no text host unchanged. Discovery report first, then code.
**Files touched**: 4b6bc1f81: docs/discovery/discovery_2026-10-31_codegen_origins_through_concat.md; eccd6ca1d: frontend/src/codegen/engine/origin.ts, engine/templates.ts, frontend/src/jjel/evaluator/context.ts, jjel/evaluator/evaluator.ts, engine/__tests__/origin.test.ts, engine/__tests__/originOperands.test.ts (new); this commit: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-31_1341_prompt_codegen_origins_through_concat.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Out of scope: templates.ts (body sink) and context.ts (4 optional JjelTextHost members); 6 code files. origin.test.ts rows 108-109 amended: a + in a hole is now one model fragment per operand, as the prompt's rule demands. Gates: tsc 0, vitest codegen 2304, jjel 491, build 0; examples code sha-identical. Bench 9/10 killed, M10 declared intent. jjel/SPEC.md:702 not updated.
**Prompt document name**: 2026-10-31 13:41

## 2026-10-31 — merge: cg-origin-concat into alfonso-frontend-jjtl (P-2026-10-31-1539)
**Prompt**: Bring `cg-origin-concat` at `fe8bb988e` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit a9b0c8f62 (9 files from the branch: `frontend/src/codegen/engine/origin.ts`, `frontend/src/codegen/engine/templates.ts`, `frontend/src/jjel/evaluator/context.ts`, `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/codegen/engine/__tests__/origin.test.ts`, `frontend/src/codegen/engine/__tests__/originOperands.test.ts`, the 1341 discovery report, prompt and this inbox file); `docs/prompts/claude_2026-10-31_1539_prompt_merge_cg-origin-concat.md` Status line; `docs/log-inbox/codegen.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (codegen engine only, no visual surface; GO from chat on the gates)
**Notes**: Merge-tree measured again: zero conflicts (tree df66f240e), no file on both sides, no governance file; no union resolution; 3 probes once each. Gates on a9b0c8f62: typecheck 0 and typecheck:scripts 0 (no error TS); vitest 12321 passed, 460 files, 9 known red at import, as expected (trunk 12303/459 + branch 18/1); hooks 967; build 0; check:docs 5/5 (prompt said 4/4, gate E added since); check:agents, check:scripts, check:addonly PASS.
**Prompt document name**: 2026-10-31 15:39

## 2026-10-31 — feat(codegen): templates dispatched on the metaclass of their first argument (P-2026-10-31-1410)
**Prompt**: Templates sharing a name and differing by `paramType`, the metaclass of their first parameter; a call runs the most specific match, else the untyped fallback, else an error naming the class. Ambiguity and arity are validation errors; the Templates tab gains a Type select and a warning row for uncovered concrete classes; the file format carries `paramType`. Discovery report first.
**Files touched**: ed032103b: docs/discovery/discovery_2026-10-31_codegen_metaclass_dispatch.md; 49aa0cc56: frontend/src/codegen/engine/dispatch.ts (new), engine/templates.ts, engine/generate.ts, engine/templateCodec.ts, engine/generatorFile.ts, ui/templateDrafts.ts, ui/TemplateEditorTab.tsx, engine/__tests__/dispatch.test.ts (new), ui/__tests__/templateDispatch.test.ts (new); this commit: docs/log-inbox/codegen.md, docs/prompts/claude_2026-10-31_1410_prompt_codegen_metaclass_dispatch.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 9 code files, over 5 (RC-11). Not named in DOVE: templateCodec.ts (stores paramType, key uniqueness), templateDrafts.ts (drafts keyed by templateKey), dispatch.ts (new). Gates: tsc 0, vitest codegen 2329 (2304+25), build 0, codegen-lazy on green. Bench 10/10 killed. Version 1.1 only for typed files; a 1.0 reader still accepts 1.x. Visual check of the tab pending (chat).
**Prompt document name**: 2026-10-31 14:10

## 2026-10-31 — merge: cg-dispatch into alfonso-frontend-jjtl (P-2026-10-31-1605)
**Prompt**: Bring `cg-dispatch` at `7dc35c8ec` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), union on the codegen inbox, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 7d298c2dc (12 files from the branch: `frontend/src/codegen/engine/dispatch.ts`, `generate.ts`, `generatorFile.ts`, `templateCodec.ts`, `templates.ts`, `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `templateDrafts.ts`, two new test files, the 1410 discovery report, prompt and this inbox file); `docs/prompts/claude_2026-10-31_1605_prompt_merge_cg-dispatch.md` Status line; `docs/log-inbox/codegen.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Templates tab checked by the chat on the branch, vite :3020: Type select, list labels, warning row for an uncovered class)
**Notes**: Merge-tree: 1 conflict, docs/log-inbox/codegen.md, union trunk first then branch, both 13-line appends, 439 lines; no code file on both sides, no governance file; 4 probes once each. Gates on 7d298c2dc: typecheck 0, typecheck:scripts 0; vitest 12346 passed, 462 files, 9 known red at import, as expected (trunk 12321/460 + branch 25/2); hooks 967; build 0; check:docs 5/5 (prompt said 4/4, gate E added since); check:agents, check:scripts, check:addonly PASS.
**Prompt document name**: 2026-10-31 16:05

## 2026-10-31 — fix(codegen): generator root follows templates, names without gaps (P-2026-10-31-1342)
**Prompt**: `claude_2026-10-31_1342_prompt_generators_export_and_import_anomalies.md`, two-phase: Phase 1 discovery of six anomalies, Phase 2 lane A only (codegen points 1, 2, 4 and the Export confirmation); XMI (point 5) to its own lane, Ecore nsURI (point 6) held for Alfonso.
**Files touched**: `038934225`: `docs/discovery/discovery_2026-10-31_generators_export_and_import_anomalies.md`; `092c33b68`: `frontend/src/codegen/ui/generatorTabs.ts`, `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `frontend/src/codegen/ui/__tests__/generatorAnomalies.test.ts` (new); this commit: this entry, a ticket, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 00:03 — the generator tab of slice G3 (New template, Save, Delete, right pane), whose writes froze a fallback root and named templates with gaps
**Causa**: (c)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Six files across the lane, all listed above. Gates on 092c33b68: typecheck exit 0; vitest src/codegen 2303 tests in 40 files; build exit 0. Mutation bench M1..M14 all killed (commit body). The tab's wiring does not import in the bench (monaco): untested; manual app check owed to the chat. Unattended: a file entry naming a deleted template moves to the root, also in multi-file generators (listed for Alfonso). check:codegen-lazy red in off mode: ticket below.
**Prompt document name**: 2026-10-31 13:42

## 2026-10-31 — ticket: check:codegen-lazy cannot pass its off mode while every .env sets VITE_CODEGEN on
**Ticket**: `npm run check:codegen-lazy` exits 1 with mode `off` FAILED (`off 0. the build resolved VITE_CODEGEN as anything but "true" — resolved "true"`, then off 1 and off 3 follow from it), mode `on` green. The committed `frontend/.env.development`, `.env.production` and `.env.staging` all set `VITE_CODEGEN = true` since `2046c17a3` (2026-10-23), so the off build is never off. Measured on `092c33b68`; not caused by P-2026-10-31-1342. The gate needs a way to force the flag off for its off mode, or the off mode retired by decision.
**Priority**: medium
**Found in**: P-2026-10-31-1342

## 2026-10-31 — merge: alfonso-frontend-jjtl into gen-anomalies, key-aware (P-2026-10-31-1640)
**Prompt**: `claude_2026-10-31_1640_prompt_gen-anomalies_key_aware_merge.md`: merge `de897d1a4` (cg-dispatch in the trunk) into `gen-anomalies`, resolving TemplateEditorTab.tsx by meaning: retarget and savedNames on template keys, freshTemplateName over names and keys, preview with both guards, log inbox union.
**Files touched**: merge commit c9f9828ad (resolved: `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `frontend/src/codegen/ui/generatorTabs.ts`, `frontend/src/codegen/ui/__tests__/generatorAnomalies.test.ts`, `docs/log-inbox/codegen.md`); docs: `docs/prompts/claude_2026-10-31_1640_prompt_gen-anomalies_key_aware_merge.md`, `docs/log-inbox/codegen.md`
**Outcome**: ✅ completed
**Corregge**: 2026-10-31 16:31 — the trunk merge that stopped on the conflict of meaning in TemplateEditorTab.tsx
**Causa**: (f)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Root and file entries stay names (stored form unchanged); a name follows a rename only once no template of it keeps it. Mutation bench M1-M5 in the merge commit body, each killed. Gates: tsc exit 0; vitest src/codegen 43 files 2349 tests; build exit 0; check:docs exit 0. No push.
**Prompt document name**: 2026-10-31 16:40

## 2026-10-31 — merge: gen-anomalies into alfonso-frontend-jjtl (P-2026-10-31-1702)
**Prompt**: Bring `gen-anomalies` at `7c3da13e1` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 2249bfef5 (8 files from the branch: `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `generatorTabs.ts`, `__tests__/generatorAnomalies.test.ts` (new), the 1342 discovery report, prompts 1342, 1631, 1640 and this inbox file); `docs/prompts/claude_2026-10-31_1702_prompt_merge_gen-anomalies.md` Status line; `docs/log-inbox/codegen.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Templates tab checked by the chat on the branch, vite :3021: gapless template3 after two expr, expr (e: Ref) and expr (e: Const), warning row for Conj, gone-metamodel preview disabled)
**Notes**: Merge-tree: zero conflicts, tree ecc606d51 equal to the merge commit's; 8 files branch side, 6 trunk side, none on both, no governance file; 5 probes once each; no union. Gates on 2249bfef5: typecheck 0, typecheck:scripts 0; vitest 12373 passed, 455 files, 9 known red at import, as expected (trunk 12353 + branch 20); hooks 967 (967 + 0); build 0; check:docs 5/5 (prompt said 4/4); check:agents, check:scripts, check:addonly PASS. Lane board untouched.
**Prompt document name**: 2026-10-31 17:02

## 2026-10-31 — fix(codegen): stale-draft note only while the metamodel exists, SPEC on origins through + and join (P-2026-10-31-1712)
**Prompt**: `claude_2026-10-31_1712_prompt_codegen_spec_and_draft_note.md`: update jjel/SPEC.md §9.4 for model origins of member reads inside `+` and `map(...).join(...)` (P-2026-10-31-1341); hide the «changed outside the editor» note once the metamodel is gone, with a test.
**Files touched**: 90123e307: `frontend/src/codegen/ui/templateDrafts.ts`, `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `frontend/src/codegen/ui/__tests__/generatorAnomalies.test.ts`; a8499d9d0: `frontend/src/jjel/SPEC.md`; this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-10-31 13:42 — the gone-metamodel state of the Templates tab still showed the stale-draft note
**Causa**: (c)
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Out of scope: templateDrafts.ts, new pure helper outsideNoteShown, since the tab does not import in the bench (monaco). Bench: M1 exists dropped, M2 always false, both killed. Gates: tsc 0; vitest src/codegen 2350 in 43 files; build 0; check:docs 0. The tab's wiring itself is untested and not checked in the app: Regressions unknown.
**Prompt document name**: 2026-10-31 17:12

## 2026-10-31 — merge: cg-spec-note into alfonso-frontend-jjtl (P-2026-10-31-1751)
**Prompt**: Bring `cg-spec-note` at `16bcd3432` into the trunk with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 2a41d7507 (6 files from the branch: `frontend/src/codegen/ui/TemplateEditorTab.tsx`, `templateDrafts.ts`, `__tests__/generatorAnomalies.test.ts`, `frontend/src/jjel/SPEC.md`, prompt 1712 and this inbox file); `docs/prompts/claude_2026-10-31_1751_prompt_merge_cg-spec-note.md` Status line; `docs/log-inbox/codegen.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (GO from the chat on the gates and the unit test of the condition; browser pane hidden, no visual re-check)
**Notes**: Stopped once while the jjel-range merge ran; restarted on e190e7158, base e94541c13 unchanged. Merge-tree: zero conflicts, tree 19dae0e30 equal to the merge's index; jjel/SPEC.md on both sides, markdown, disjoint hunks (7.3 vs 9.4), auto-merged; no code file on both sides, no governance file; probe once; no union. Gates on 2a41d7507: typecheck 0, typecheck:scripts 0; vitest 12402 (12401 + 1), 466 files, 9 known red at import; hooks 967; build 0; check:docs 5/5; agents, scripts, addonly PASS.
**Prompt document name**: 2026-10-31 17:51

## 2026-11-01 — docs(codegen): discovery of a default textual notation (P-2026-11-01-1709)
**Prompt**: read-only discovery: can a default textual notation (rules D1-D7) be derived by reflection from the metamodel; answer 1.1-1.6 by generator runs in the dock tab, propose built-in, overrides and EBNF, review the rules
**Files touched**: docs/discovery/discovery_2026-11-01_default_textual_notation.md (new), docs/log-inbox/codegen.md, docs/prompts/claude_2026-11-01_1709_prompt_default_textual_notation_discovery.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Probe _tmp_default_text.ts (gitignored, not committed), port 3171, own fixture TextProbe.ecore/xmi in ~/.jjodel-lanes; 2 runs exit 0, run 2 no generation error. 1.2 holds (06-11 finding obsolete), index reads carry no origin; enum literal is a string; eIsSet only for optional no-default attrs; no Text emptiness test; names not unique. Side: Ecore import drops defaultValueLiteral and literal values. Session hit the context ceiling once; finished on GO.
**Prompt document name**: 2026-11-01 17:09

## 2026-11-01 — merge: default-textual-notation into alfonso-frontend-jjtl (P-2026-11-01-1743)
**Prompt**: Bring `default-textual-notation` at `f910decbc` into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-default-textual-notation on 8b25b1a11).
**Files touched**: merge commit 5b069a615 (3 files from the branch: `docs/discovery/discovery_2026-11-01_default_textual_notation.md`, `docs/log-inbox/codegen.md`, the branch prompt); `docs/prompts/claude_2026-11-01_1743_prompt_merge_default-textual-notation.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs-only)
**Prompt document name**: 2026-11-01 17:43

## 2026-11-01 — ticket: Ecore import drops defaultValueLiteral, literal values and DClass.features
**Ticket**: Found by the discovery P-2026-11-01-1709 (report docs/discovery/discovery_2026-11-01_default_textual_notation.md, section 1.1 and side finding), decision R-TXT-10.

Importing an Ecore metamodel drops defaultValueLiteral on attributes and the value of enumeration literals, and leaves DClass.features empty afterwards. A reflective generator (R-TXT-7) then prints mandatory defaults it cannot see and cannot rely on features for D6 ordering.

Expected: the import keeps defaultValueLiteral and literal values, and DClass.features is populated as for a metamodel built in the editor.
**Priority**: medium
**Found in**: P-2026-11-01-1709

## 2026-11-01 — feat(jjel): trace index reads with a string key (P-2026-11-01-1945)
**Prompt**: R-TXT-6: `o["f"]` with a string key notifies `ctx.readObserver` as the member read `o.f` does; numeric index, non-string key and missing key unchanged; tests first, red before the change
**Files touched**: frontend/src/jjel/evaluator/evaluator.ts, frontend/src/jjel/__tests__/templateInterpolation.test.ts, frontend/src/codegen/engine/__tests__/origin.test.ts (edcbad03e); docs/log-inbox/codegen.md, docs/prompts/claude_2026-11-01_1945_prompt_jjel_index_read_origin.md (Status)
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Observer part done, guards on a mutation bench. Not met: test (1) "same origin span through a template". origin.ts rule 1 (readName, :199) names member reads only, so s["title"] is an opaque fragment with the read in `reads`, and GeneratorPane.tsx:594 sets data-origin-id on model origins only: no Alt+click yet. That step is origin.ts, outside the declared scope; awaiting Alfonso. Gates: tsc 0, vitest jjel+codegen 2868/2868, build 0.
**Prompt document name**: 2026-11-01 19:45

## 2026-11-01 — merge: index-read-origin into alfonso-frontend-jjtl (P-2026-11-01-1952)
**Prompt**: Bring `index-read-origin` at `8a17f3b84` into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-index-read-origin on cb072e61a).
**Files touched**: merge commit 9e19ecbab (`frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/jjel/__tests__/templateInterpolation.test.ts`, `frontend/src/codegen/engine/__tests__/origin.test.ts`, the branch prompt, this inbox); `docs/prompts/claude_2026-11-01_1952_prompt_merge_index-read-origin.md` Status line; this entry
**Outcome**: ✅ completed (the branch itself is partial: an index hole still has no model origin, see P-2026-11-01-1945)
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-01 19:52

## 2026-11-01 — feat(codegen): default textual notation generator (P-2026-11-01-1946)
**Prompt**: a shipped JjEL generator printing any model in the default textual notation of R-TXT-1..9, untyped obj/feature/value/ref and an entry, overridable per class through the metaclass dispatch (R-TXT-8); tests on a fixture built in code; acceptance on CoreSpec and ArbiterSpec
**Files touched**: c29dde42a frontend/public/examples/codegen/default-text.generator.json (new), frontend/src/codegen/engine/__tests__/defaultText.test.ts (new); docs/log-inbox/codegen.md, docs/prompts/claude_2026-11-01_1946_prompt_default_text_generator.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: 16 templates, no engine change. Measured: JjEL `and`/`or` evaluate both sides, so guards are `if`; a template returns a Text, so lists are rebuilt inline ([x].map(...).first as a let). Ref signature is ref(o, r, t), not ref(o, t): R-TXT-4 needs the reference's type. No codegen user docs exist (none created). Probe _tmp_default_text_gen.ts port 3046, exit 0, 3/3 no generation or page error; crops and outputs in ~/.jjodel-lanes/P-2026-11-01-1946.
**Prompt document name**: 2026-11-01 19:46

Inline discovery. (1) No shipped generator existed: the SyncRTL acceptance files are test fixtures (`frontend/src/codegen/engine/__tests__/fixtures/generator-{smv,verilog}.json`), the shipped examples are `.jjodel` projects in `frontend/public/examples/codegen/`; the generator goes beside them. (2) `GeneratorImportDialog` reads a picked JSON through `decodeGeneratorFile`; with `metamodel` absent the Templates tab's Import lands it on the tab's metamodel and opens it (measured). (3) Tests run a generator with `generate(globals, lookup, modelId, templates, entry)` over globals shaped like `buildEvalContext` (`dispatch.test.ts`); the new test does the same, reading the shipped file through `decodeGeneratorFile` (no problem). (4) Containment path: `parts[1]` segments joined by `.` from the root; with several roots it opens with `[k]`, the root's index; a lone root referenced is `[0]`. (5) Order: ancestors sorted by their own `allSuperclasses.size` (an ancestor has fewer), stable, then the class.

Acceptance (read-only, nothing copied into the repo). CoreSpec + `core_mc4.xmi`:
```
Core core_mc4 {
  xlen 4
  nregs 4
  microarch MULTICYCLE
  instructions {
    Instruction {
      mnemonic ADD
    }
    ... (SUB, AND, OR, XOR, ADDI, LW, SW, BEQ, BNE, same shape)
  }
  requirements {
    Requirement isa_conformance {
      kind ISA_CONFORMANCE
    }
    Requirement no_hazard {
      kind NO_HAZARD
    }
    Requirement in_order_retire {
      kind IN_ORDER_RETIRE
    }
  }
}
```
ArbiterSpec + `arbiter3.xmi` (`Requirement priority`: a feature name unquoted in a name position, R-TXT-9):
```
Arbiter arb3 {
  policy FIXED
  requesters {
    Requester cpu {
      priority 0
    }
    Requester dma {
      priority 1
    }
    Requester io {
      priority 2
    }
  }
  requirements {
    Requirement mutex {
      kind MUTEX
    }
    Requirement no_spurious_grant {
      kind NO_SPURIOUS_GRANT
    }
    Requirement priority {
      kind PRIORITY
    }
  }
}
```

## 2026-11-01 — merge: default-text-generator into alfonso-frontend-jjtl (P-2026-11-01-2002)
**Prompt**: Bring `default-text-generator` at `281cf10a3` into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-default-text-generator on a763bbb91).
**Files touched**: merge commit 0e5d9152d (`frontend/public/examples/codegen/default-text.generator.json`, `frontend/src/codegen/engine/__tests__/defaultText.test.ts`, the branch prompt, this inbox); `docs/prompts/claude_2026-11-01_2002_prompt_merge_default-text-generator.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crops of the lane, unattended; a new example file, nothing in the demo changes)
**Prompt document name**: 2026-11-01 20:02

## 2026-11-01 — feat(codegen): index holes take the origin of their last read (P-2026-11-01-2015)
**Prompt**: R-TXT-13: a hole whose expression is an index read gets the model origin of its last read when that read's value equals the hole's value; origin.ts only, tests first, red before the change
**Files touched**: frontend/src/codegen/engine/origin.ts, frontend/src/codegen/engine/__tests__/origin.test.ts (56092ebf5); docs/log-inbox/codegen.md, docs/prompts/claude_2026-11-01_2015_prompt_index_hole_origin.md (Status)
**Outcome**: ⚠️ partial
**Corregge**: 2026-11-01 19:45 (`claude_2026-11-01_1945_prompt_jjel_index_read_origin.md`: its test (1) was left open, the origin of o["f"])
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (see Notes)
**Notes**: Engine part done, two mutants on a bench. Not met: test (4) and the visual check: the default generator passes values as template arguments (`value(a, o[a.name])`), so the index read runs outside the hole that prints `"" + v`; "0" stays opaque. Needs reads carried through call arguments, outside origin.ts; awaiting Alfonso. Gates: tsc 0, vitest 2883/2883, build 0.
**Prompt document name**: 2026-11-01 20:15

## 2026-11-01 — merge: index-hole-origin into alfonso-frontend-jjtl (P-2026-11-01-2026)
**Prompt**: Bring `index-hole-origin` at `5a66efa50` into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-index-hole-origin on 7e009a33a).
**Files touched**: merge commit 0bf0f91cc (`frontend/src/codegen/engine/origin.ts`, `frontend/src/codegen/engine/__tests__/origin.test.ts`, the branch prompt, this inbox); `docs/prompts/claude_2026-11-01_2026_prompt_merge_index-hole-origin.md` Status line; this entry; the generator path in the entry of P-2026-11-01-2002 corrected to `frontend/public/examples/codegen/default-text.generator.json` (the chat had written the wrong one)
**Outcome**: ✅ completed (R-TXT-13 holds for index holes; origins through template-call arguments still missing, open question)
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crop of the lane, unattended)
**Prompt document name**: 2026-11-01 20:26

## 2026-11-01 — probe(codegen): default text generator on real reads, R-TXT-5 and R-TXT-12 hold (P-2026-11-01-2016)
**Prompt**: check R-TXT-5 (unset/mandatory/defaulted reads) and R-TXT-12 (non-diamond multiple inheritance order) on real JjEL handles in the app; fix the generator and its test mock only if either fails
**Files touched**: none in code; docs/log-inbox/codegen.md, docs/prompts/claude_2026-11-01_2016_prompt_default_text_real_reads.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Both rules hold, no code. The prompt cites frontend/src/examples/codegen/, which does not exist: the generator is frontend/public/examples/codegen/default-text.generator.json (the 2002 merge entry carries the same wrong path). Declared default set after the import via LAttribute.defaultValue = 7 (import drops it). Probe _tmp_default_text_reads.ts, port 3048, exit 0, no generation or page error; fixture, log, crop in ~/.jjodel-lanes/P-2026-11-01-2016.
**Prompt document name**: 2026-11-01 20:16

Probe fixture `ReadsProbe.ecore`: A{a: EInt [1]}, B1 extends A {b1: EInt [1]}, B2 {b2: EInt [1]}, C extends B1, B2 {opt: EString, count: EInt [1], flag: EBoolean, must: EBoolean [1], level: EInt default 7, tags: EString [*]}; one C, nothing set in the XMI.

JjEL hole, measured: `a=I:0 b1=I:0 b2=I:0 opt=null count=I:0 flag=null must=B:false level=I:7 tags=A[]`; `C supers=[B1,B2] all=[B1,A,B2]` (depth-first preorder), `sortBy(allSuperclasses.size) + [C]` = `A,B2,B1,C`, which is R-TXT-12 (depth 0: A before B2 by depth-first declaration order; then B1; then C).

Default text output (crop `output-readsprobe.png`):
```
C {
  a 0
  b2 0
  b1 0
  count 0
  must false
  level 7
}
```
`opt`, `flag` (optional, no default) and `tags` (empty) do not print; mandatory and defaulted attributes print (R-TXT-5).

**Ticket** (side finding, low): the XMI import writes `["false"]` into the D-layer slot of the unset mandatory boolean `must` (the other unset slots, `count` included, hold `[]`), so for a mandatory EBoolean the D-layer cannot tell unset from set-to-false; class shells read `lowerBound` as `null` for every attribute, so a generator cannot see mandatoriness through `a.lowerBound`.

## 2026-11-01 — merge: default-text-real-reads into alfonso-frontend-jjtl (P-2026-11-01-2034)
**Prompt**: Bring `default-text-real-reads` at `228a531bf` into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-default-text-real-reads on a86478e21); union resolution of this inbox.
**Files touched**: merge commit 2d6bf281d (the branch prompt, this inbox); `docs/prompts/claude_2026-11-01_2034_prompt_merge_default-text-real-reads.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs-only)
**Prompt document name**: 2026-11-01 20:34

## 2026-11-01 — docs(codegen): discovery of a textual viewpoint (P-2026-11-01-2017)
**Prompt**: read-only discovery for R-TXT-14: what a declarative textual notation (a textual viewpoint) should be in Jjodel, where it lives, what is data and what needs JjEL, how printer, EBNF and parser derive from it; a proposal with CoreSpec and ArbiterSpec as overrides
**Files touched**: docs/discovery/discovery_2026-11-01_textual_viewpoint.md (new), docs/log-inbox/codegen.md, docs/prompts/claude_2026-11-01_2017_prompt_textual_viewpoint_discovery.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: All read, no app run. Proposal: a txtNotation record on the metamodel _state (as generators), no JjEL in v1; all four prototype overrides are data (RISC-V grouping is a finite literal table). Printer in TS, JjEL generator as oracle. Side finding: nearley and ohm-js are already dependencies, used by the legacy DState.languages t2m feature whose Languages tab is no longer mounted (Dock.tsx:309, 347-354). Ten questions in report §4.
**Prompt document name**: 2026-11-01 20:17

## 2026-11-01 — merge: textual-viewpoint-discovery into alfonso-frontend-jjtl (P-2026-11-01-2042)
**Prompt**: Bring `textual-viewpoint-discovery` (report of P-2026-11-01-2017) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-textual-viewpoint-discovery on 26977c7ff); union resolution of this inbox.
**Files touched**: merge commit 29a790243 (`docs/discovery/discovery_2026-11-01_textual_viewpoint.md`, the branch prompt, this inbox); `docs/prompts/claude_2026-11-01_2042_prompt_merge_textual-viewpoint-discovery.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs-only)
**Prompt document name**: 2026-11-01 20:42

## 2026-11-01 — ticket: XMI import stores ["false"] in an unset mandatory boolean; lowerBound reads null on feature shells
**Ticket**: Found by P-2026-11-01-2016 (log entry in docs/log-inbox/codegen.md, probe in ~/.jjodel-lanes/P-2026-11-01-2016/).

Two defects seen while reading a model imported from XMI: (1) the import writes ["false"] into the empty slot of a mandatory boolean attribute, while every other unset slot is []; (2) the class shells read lowerBound as null for every attribute.

Neither breaks the default text generator today, but the base grammar of R-TXT-16 needs the lower bound to tell optional from mandatory features, and a spurious stored value makes an unset attribute look set.

Expected: unset slots are [] whatever the type; lowerBound is exposed on attribute and reference shells.
**Priority**: medium
**Found in**: P-2026-11-01-2016

## 2026-11-01 — docs(codegen): textual syntax addendum (P-2026-11-01-2210, P-2026-11-01-2232)
**Prompt**: Discovery of the textual syntax derived from the metamodel (R-TXT-16..20): base grammar, styles, annotations, printer/parser compared, identity and application, comments, plan. 2210 measured and hard-stopped at the context ceiling (RC-51); 2232 continued from its handoff and wrote the addendum.
**Files touched**: docs/discovery/discovery_2026-11-01_textual_viewpoint.md (addendum; «JjEL generator» → «JjGen generator», 7 places); docs/prompts/claude_2026-11-01_2210_prompt_textual_syntax_design_discovery.md, docs/prompts/claude_2026-11-01_2232_prompt_textual_syntax_discovery_part2.md (Status); this inbox
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs-only; Monaco probe headless outside src/)
**Notes**: Probes in ~/.jjodel-lanes/P-2026-11-01-2232/probe/ (not committed). Measured: C-like = JjGen generator byte for byte; 16/16 Briefs; nearley 1 parse on 19 samples; ohm fixed (#() skips no leading space; kw<k> rule) 19/19; 1,001 objects hand 15 ms, nearley 11 ms, ohm 107 ms (1.6 ms incremental); recovery loses a root on a missing }; Monaco decorations not restored by undo.
**Prompt document name**: 2026-11-01 22:32

## 2026-11-01 — merge: textual-syntax-discovery into alfonso-frontend-jjtl (P-2026-11-01-2311)
**Prompt**: Bring `textual-syntax-discovery` at `4a90cc085` (addendum of P-2026-11-01-2210/2232) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-textual-syntax-discovery on eaaeb624a); union resolution of this inbox.
**Files touched**: merge commit ddf1088d9 (`docs/discovery/discovery_2026-11-01_textual_viewpoint.md`, the 2210 and 2232 prompts, this inbox); `docs/prompts/claude_2026-11-01_2311_prompt_merge_textual-syntax-discovery.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs-only)
**Prompt document name**: 2026-11-01 23:11

## 2026-11-01 — fix(import): keep default values and literal values on Ecore import (P-2026-11-01-2300, P-2026-11-01-2325)
**Prompt**: Ticket #395 / R-TXT-10: the Ecore import keeps (1) EAttribute defaultValueLiteral, (2) EEnumLiteral value, (3) DClass.features. 2300 = fix and tests, hard-stop at the context ceiling (handoff ~/.jjodel-lanes/P-2026-11-01-2300/handoff.md); 2325 = gates and commits (RC-51).
**Files touched**: b320f849f: frontend/src/api/data.ts (EcoreParser.parseDAttribute, parseDEnumLiteral), frontend/src/services/export/ecoreFeatureReads.ts (new), frontend/src/services/export/__tests__/ecore-import-losses.test.ts (new); closure: this inbox, the Status lines of the 2300 and 2325 prompts
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (the properties panel shows no default or literal value, Info.tsx; the visual probe failed on page.goto, vite EPIPE, not diagnosed)
**Notes**: 5 unit tests red on the pre-fix parser (2 failed), green after. Gates on b320f849f: tsc 0, vitest export+codegen 49 files/2458 passed, build ok. Browser probe on 3072 ALL PASS (defaults 7/true/hello world/Mid, literals 0/5/9, no pageErrors); on HEAD data.ts 6 FAILs. Export round trip keeps literal values, drops defaults (EcoreService.ts:316-318). Item 3 undone: the editor leaves DClass.features empty too. No LIR: parser, not a 3.2 path. Open points: ticket below.
**Prompt document name**: 2026-11-01 23:25

## 2026-11-01 — ticket: Ecore round trip still loses defaults, literal labels and serializable; DClass.features undecided
**Ticket**: Four open points left by P-2026-11-01-2300 for Alfonso.

(1) #395 item 3: the premise is false, no code writes DClass.features for M2 features (Constructors.DAttribute/DReference push to attributes/references only, classes.ts:767-778). Drop it (recommended: the base grammar reads attributes then references) or open a core lane that maintains features in the editor and the import alike (Rule 5).

(2) The Ecore export of defaultValueLiteral is commented out (EcoreService.ts:316-318): an import then export drops every default. Re-enable it in its own lane.

(3) Same key bug as the literal value: `ECoreLiteral.literal` and `ECoreEnum.serializable` carry no '-' prefix, so the literal label and serializable are never read on import.

(4) JjEL shells read `defaultValue`, which nothing fills; R-TXT generators will not see defaults until eval.ts reads defaultValueLiteral (jjscript lane).
**Priority**: medium
**Found in**: P-2026-11-01-2300
**Detail**: ~/.jjodel-lanes/P-2026-11-01-2300/handoff.md

## 2026-11-01 — merge: ecore-import-losses into alfonso-frontend-jjtl (P-2026-11-01-2340)
**Prompt**: Bring `ecore-import-losses` at `9d0d2450c` (fix b320f849f) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-ecore-import-losses on 44a713c1e); union resolution of this inbox.
**Files touched**: merge commit 44c6794f2 (`frontend/src/api/data.ts`, `frontend/src/services/export/ecoreFeatureReads.ts`, `frontend/src/services/export/__tests__/ecore-import-losses.test.ts`, the 2300 and 2325 prompts, this inbox); `docs/prompts/claude_2026-11-01_2340_prompt_merge_ecore-import-losses.md` Status line; this entry
**Outcome**: ✅ completed (#395 closed for items 1 and 2; item 3 dropped, R-TXT-23)
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-01 23:40

## 2026-11-01 — ticket: JjGen: origins through template-call arguments
**Ticket**: Found by P-2026-11-01-2015 (decision R-TXT-13, R-TXT-23).

An index hole now takes the origin of its last read, but a value passed through a template-call argument (value(a, o[a.name]) in the default text generator) loses it, so Alt+click does not reach the model on text printed through helper templates. Fix: carry reads through template-call arguments in the JjGen engine (origin.ts and the call path). Low priority since R-TXT-16: the textual notation is printed by a TypeScript printer; this serves JjGen generators in general.
**Priority**: low
**Found in**: P-2026-11-01-2015

## 2026-11-01 — feat(codegen): textual base grammar, C-like style and printer (P-2026-11-01-2320)
**Prompt**: Step T1 of R-TXT-16: base grammar derived from the metamodel, style record with C-like as first value, concrete grammar and EBNF text, printer with object spans; differential test against the shipped JjGen default-text generator (R-TXT-14) on the 1709 fixture and a corpus; mutation check.
**Files touched**: 34c138640, new folder `frontend/src/codegen/textual/`: `metamodel.ts`, `baseGrammar.ts`, `style.ts`, `concreteGrammar.ts`, `printer.ts`, `__tests__/spec.ts`, `__tests__/textual.test.ts`; the prompt's Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (7 new files in the declared folder, above the five of rule 19; no existing file changed)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI)
**Notes**: Gates: tsc 0 errors; vitest src/codegen 45 files, 2383 tests; build exit 0. Mutation bench 12/12 killed (script in ~/.jjodel-lanes/P-2026-11-01-2320/). Departures from the probe/addendum: ancestors by number of ancestors (R-TXT-12, as JjGen; the probe sorted by depth); single containment printed as a block of one (as JjGen); Model rule over all concrete classes, not R-TXT-21 (3) roots.
**Prompt document name**: 2026-11-01 23:20

**Ticket** (P-2026-11-01-2320): R-TXT-21 (3) derives the roots as classes never contained, but the printer (like JjGen) prints every uncontained object at the top; a Model rule restricted to those classes would not accept the printed text of a model with an orphan Part. T1 keeps the addendum's Model rule over all concrete classes; to settle before T2.

## 2026-11-01 — merge: textual-t1 into alfonso-frontend-jjtl (P-2026-11-01-2349)
**Prompt**: Bring `textual-t1` at `21a9fd84c` (feat 34c138640) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-textual-t1 on 069d2a81c); union resolution of this inbox.
**Files touched**: merge commit 3166319dd (seven new files in `frontend/src/codegen/textual/`, the T1 prompt, this inbox); `docs/prompts/claude_2026-11-01_2349_prompt_merge_textual-t1.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI)
**Prompt document name**: 2026-11-01 23:49

## 2026-11-01 — fix(ecore): export defaults; import literal labels and serializable (P-2026-11-01-2351)
**Prompt**: Open points 2 and 3 of P-2026-11-01-2300: re-enable the Ecore export of defaultValueLiteral, and read a literal's label and an enum's serializable flag through the '-' prefix on import.
**Files touched**: ed6df7b6d: frontend/src/services/export/EcoreService.ts, frontend/src/services/export/ecoreFeatureReads.ts, frontend/src/api/data.ts, frontend/src/services/export/__tests__/ecore-export-defaults.test.ts (new); closure: this inbox, the Status line of the 2351 prompt
**Outcome**: ✅ completed
**Corregge**: 2026-11-01 23:00
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The line was dead for a second reason: the L proxy has no defaultValueLiteral getter (LModelElement.tsx:2326-2331 commented out), so the export now reads attr.__raw. No reason for the 2026-02-04 comment-out in the commit (260e1a0ce). Legacy unprefixed 'serializable' and 'literal' keys still read. 5 of 6 tests red before, green after; tsc 0, vitest export+codegen 50 files/2464, build ok. Browser round trip not run.
**Prompt document name**: 2026-11-01 23:51

## 2026-11-02 — merge: ecore-export-defaults into alfonso-frontend-jjtl (P-2026-11-01-2358)
**Prompt**: Bring `ecore-export-defaults` at `f1a4a25d7` (fix ed6df7b6d) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-ecore-export-defaults on bda991ccf); union resolution of this inbox.
**Files touched**: merge commit 6b2bfeb36 (`frontend/src/services/export/EcoreService.ts`, `frontend/src/services/export/ecoreFeatureReads.ts`, `frontend/src/api/data.ts`, `frontend/src/services/export/__tests__/ecore-export-defaults.test.ts`, the 2351 prompt, this inbox); `docs/prompts/claude_2026-11-01_2358_prompt_merge_ecore-export-defaults.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-01 23:58

## 2026-11-01 — fix(jjel): unset attributes read their declared default literal (P-2026-11-01-2350)
**Prompt**: R-TXT-5: JjEL's unset read takes the declared default from `defaultValueLiteral` (the field the editor and, since 44c6794f2, the Ecore import fill) when `defaultValue` is absent, coerced to the attribute's type; unparsable reads as no default.
**Files touched**: 59fb7c389: frontend/src/jjscript/executor/commands/eval.ts, frontend/src/jjscript/executor/__tests__/unsetDefaultLiteral.test.ts (new); closure: this inbox, the Status line of the 2350 prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI)
**Notes**: Real buildEvalContext under a joiner Proxy stub and a mocked ../utils: 6 of 8 red before, 9/9 after (EInt 7, EBoolean false/true, EString, EDouble 2.5, enum Mid, "abc" -> 0/null, Ecore fixture, default text prints `level 7`, shell defaultValue). 3 mutants killed. Gates: tsc 0, vitest jjscript+jjel+codegen 3725 passed (context-binding.test.ts known window red), build 0, check:docs 0. Literal parsed strictly: "2.5" on EInt reads 2.5, as defaultValue does.
**Prompt document name**: 2026-11-01 23:50

## 2026-11-02 — merge: jjel-default-literal into alfonso-frontend-jjtl (P-2026-11-02-0007)
**Prompt**: Bring `jjel-default-literal` at `1e5a8ff90` (fix 59fb7c389) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-jjel-default-literal on eef5351e7); union resolution of this inbox.
**Files touched**: merge commit 4383c2572 (`frontend/src/jjscript/executor/commands/eval.ts`, `frontend/src/jjscript/executor/__tests__/unsetDefaultLiteral.test.ts`, the 2350 prompt, this inbox); `docs/prompts/claude_2026-11-02_0007_prompt_merge_jjel-default-literal.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-02 00:07

## 2026-11-02 — feat(codegen): textual style checks (P-2026-11-01-2356)
**Prompt**: Step T3 of R-TXT-16: a check that a style applied to a metamodel's base grammar gives an unambiguous concrete grammar: addendum §A.2 (i) and (ii), case injectivity with the R-TXT-21 (10) fallback as a notice, findings not a boolean; nearley as the test oracle (exactly one parse) on samples generated from the concrete grammar (R-TXT-21 (1)).
**Files touched**: 7731968ab, new: `frontend/src/codegen/textual/styleCheck.ts`, `__tests__/oracle.ts`, `__tests__/styleCheck.test.ts`; the prompt's Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI)
**Notes**: Gates: tsc 0 errors; vitest src/codegen 46 files, 2420 tests; build exit 0. Mutation bench 19/19 killed (~/.jjodel-lanes/P-2026-11-01-2356/bench.py). Rules beyond (i), (ii) and case: reserved-words, block-delimiters, list-tokens, terminator. Separator = terminator is not a CFG ambiguity with bracketed lists; it is an error as the recovery's sync point. T1's corpus metamodels copied into the test (textual.test.ts exports nothing).
**Prompt document name**: 2026-11-01 23:56

**Ticket** (P-2026-11-01-2356): T1's case fallback covers merges inside the class keywords and inside one enumeration, not a class keyword folded onto a style word (`End` to `end` under `begin`/`end` blocks); the check reports it as an error. Whether the derivation should fall back for it too is open.

## 2026-11-02 — merge: textual-t3 into alfonso-frontend-jjtl (P-2026-11-02-0027)
**Prompt**: Bring `textual-t3` at `3b87b4ecd` (feat 7731968ab) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-textual-t3 on 6eed25e95); union resolution of this inbox.
**Files touched**: merge commit 3008d69b5 (`frontend/src/codegen/textual/styleCheck.ts`, `frontend/src/codegen/textual/__tests__/styleCheck.test.ts`, `frontend/src/codegen/textual/__tests__/oracle.ts`, the T3 prompt, this inbox); `docs/prompts/claude_2026-11-02_0027_prompt_merge_textual-t3.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI)
**Prompt document name**: 2026-11-02 00:27

## 2026-11-02 — feat(codegen): textual parser with recovery (P-2026-11-02-0024)
**Prompt**: Slice T2a of T2 (RC-51, RC-52, after P-2026-11-01-2355 stopped at the ceiling): hand-written interpreter of T1's concrete grammar, C-like, with recovery; output in the printer's shape; errors with line and column; recovered objects never applicable; `parseText(text, grammar)`.
**Files touched**: 45c883e92: `frontend/src/codegen/textual/parser.ts`, `frontend/src/codegen/textual/__tests__/parser.test.ts` (both new); closure: this inbox, the Status lines of the 0024 and 2355 prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI)
**Notes**: Gates: tsc 0; vitest src/codegen 46 files, 2409 tests; build 0; check:codegen-lazy on green, off red as in the open ticket on .env.production (no textual module in any chunk). Mutation bench 9/10 killed, the survivor a progress guard (commit message). Features must follow grammar order: out of order is an error. Corpus of textual.test.ts copied into parser.test.ts (it exports nothing).
**Prompt document name**: 2026-11-02 00:24

**Ticket** (P-2026-11-02-0024): the printer can print one text for two targets. A bare single-containment path segment (`inner`) and an object name `inner` that is unique among the reference's targets both print as `inner`. The parser reads the name first (handoff of 2355), so such a model does not round trip. Not in T1's corpus; to settle in the printer or with R-TXT-4.

## 2026-11-02 — feat(ui): textual entry and read-only Text tab (P-2026-11-02-0057)
**Prompt**: Close slice T2b (P-2026-11-02-0040 stopped at the ceiling, RC-51): finish the Toolbar part from 0040's handoff, gates, visual check, commits. Picker entry `@textual` (metamodel name as label, behind the codegen setting and build flag) opening a read-only Text tab: T1 printer in Monaco, toggle to the concrete EBNF, opener by dynamic import only.
**Files touched**: 7bd41e3cf: `frontend/src/components/editor-v2/Toolbar.tsx`, `frontend/src/components/editor-v2/dataManagerOption.ts`, `frontend/src/codegen/textual/ui/TextualTab.tsx`, `frontend/src/codegen/textual/ui/TextualTab.scss`, `frontend/src/codegen/textual/ui/openTextualTab.tsx`, `frontend/src/codegen/textual/__tests__/textualTab.test.ts`, `frontend/src/components/editor-v2/__tests__/textualPicker.test.ts`; closure: this inbox, the Status lines of the 0040 and 0057 prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Seven code files, above five, listed in 0040's first message; `textualTab.test.ts` was added beyond that list. Gates: tsc 0; vitest src/codegen + editor-v2 223 files, 6356 tests; build 0; codegen-lazy on green, off red (open ticket). Mutation bench 7/7 killed (commit body). Probe on 3057, DemoESM: entries Abstract syntax, DemoESM, Data manager; text 31 lines; EBNF 6 rules; typing changes nothing. Crops in ~/.jjodel-lanes/P-2026-11-02-0057/.
**Prompt document name**: 2026-11-02 00:57

## 2026-11-02 — ticket: the Text tab is missing from the app bar
**Ticket**: Navbar.tsx `syncTabs` lists a first-panel tab only when its id resolves to a model or matches a known prefix, so the `txt_<modelId>` Text tab of T2b is dropped as a ghost and the `models` panel's own tab bar is hidden; the tab carries its own header (title, Read-only, Text/EBNF, close) meanwhile. Fix: one `txt_` branch in `syncTabs`, as for the manager, in T2c, which already touches Navbar.tsx; also decide whether to hide the floating rail on it (Dock.tsx).
**Priority**: medium
**Found in**: P-2026-11-02-0040
**Detail**: ~/.jjodel-lanes/P-2026-11-02-0040/handoff.md

## 2026-11-02 — feat(ui): New model from text (P-2026-11-02-0235)
**Prompt**: Close slice T2c (P-2026-11-02-0045 stopped at the ceiling, RC-51): from 0045's handoff, the opener (`openNewModelTab`, `createModelFromText`, `appBarTitle`), `NewTextualTab`, the LeftBar action on metamodel rows; gates, probe, commits. One undo after «Create model» must remove the whole model.
**Files touched**: edf047bf3: `frontend/src/codegen/textual/modelLines.ts`, `frontend/src/codegen/textual/__tests__/modelLines.test.ts`, `frontend/src/codegen/textual/ui/TextualTab.tsx`, `frontend/src/codegen/textual/ui/TextualTab.scss`, `frontend/src/codegen/textual/ui/openTextualTab.tsx`, `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/pages/components/Navbar.tsx`; closure: this inbox, the Status lines of the 2355, 0045 and 0235 prompts
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Deviation: canvas opened inside the undo group (after it: 2 entries, undo left the model). Probe on 3235 also found 14/21 lines failing when the script started before the model was in `project.models`; the opener now waits for it. Gates: tsc 0; vitest 225 files, 6377 tests; build 0; codegen-lazy on green, off red (open ticket). Bench 4/4 killed. Closes the app-bar ticket. Crops in ~/.jjodel-lanes/P-2026-11-02-0235/.
**Prompt document name**: 2026-11-02 02:35

## 2026-11-02 — merge: textual-t2 into alfonso-frontend-jjtl (P-2026-11-02-0637)
**Prompt**: Bring `textual-t2` (T2a parser 45c883e92, T2b entry and tab 7bd41e3cf, T2c New model from text edf047bf3) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-textual-t2 on a29347b82); union resolution of this inbox.
**Files touched**: merge commit aa68ad049 (`frontend/src/codegen/textual/parser.ts`, `modelLines.ts`, `ui/TextualTab.tsx`, `ui/TextualTab.scss`, `ui/openTextualTab.tsx` and their tests, `frontend/src/components/editor-v2/Toolbar.tsx`, `dataManagerOption.ts`, `frontend/src/pages/components/LeftBar.tsx`, `Navbar.tsx`, the slice prompts, this inbox); `docs/prompts/claude_2026-11-02_0637_prompt_merge_textual-t2.md` Status line; this entry
**Outcome**: ✅ completed (styleCheck.ts, the JjEL default fix and its test kept from the trunk)
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crops, unattended; after undo of Create model the canvas tab shows a bare «closed tab» text, open question)
**Prompt document name**: 2026-11-02 06:37

## 2026-11-02 — feat(codegen): unambiguous paths, fold fallback, shared corpus (P-2026-11-02-0652)
**Prompt**: R-TXT-25 (5, 6, 7, 11): paths `Class[k].f[i]` that never equal a name, in printer, parser and the JjGen generator; a case folding onto a style word falls back to the declared case with a notice; one shared textual test corpus.
**Files touched**: `frontend/src/codegen/textual/printer.ts`, `parser.ts`, `concreteGrammar.ts`, `style.ts`; `__tests__/corpus.ts` (new), `textual.test.ts`, `parser.test.ts`, `styleCheck.test.ts`, `modelLines.test.ts`, `oracle.ts`; `frontend/public/examples/codegen/default-text.generator.json`; `frontend/src/codegen/engine/__tests__/defaultText.test.ts`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Out of `textual/`: `engine/__tests__/defaultText.test.ts` pins the generator's paths, updated with it; `modelLines.test.ts`, a fourth corpus copy, also moved to `corpus.ts`. Paths always open with the root (`Class[k]`), single root included. Closes T2a's `inner` ticket (INNER corpus case). Gates: tsc 0; vitest src/codegen 49 files, 2479 tests; build 0; codegen-lazy on green, off red (open ticket, R-TXT-25 (10)). Bench 5/5 killed.
**Prompt document name**: 2026-11-02 06:52

## 2026-11-02 — merge: textual-paths into alfonso-frontend-jjtl (P-2026-11-02-0821)
**Prompt**: Bring `textual-paths` at `f91c95e22` (feat 40b70401d) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-textual-paths on a54aad3cc).
**Files touched**: merge commit b7c0adfc2 (printer, parser, style, concreteGrammar, shared test corpus, the JjGen default generator and its test, the 0652 prompt, this inbox); `docs/prompts/claude_2026-11-02_0821_prompt_merge_textual-paths.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-02 08:21

## 2026-11-02 — fix(ui): close the tab of an undone model; badge for Text tabs (P-2026-11-02-0650)
**Prompt**: R-TXT-25 (1) and (4): after an undone «Create model» the canvas tab shows a bare «closed tab»; probe whether any undone model creation does it, then close a tab whose model is gone. Text tabs get an app-bar badge.
**Files touched**: fdb70a1e8: `frontend/src/components/abstract/tabs/ModelTab.tsx`, `frontend/src/components/abstract/tabs/MetamodelTab.tsx`, `frontend/src/pages/components/Navbar.tsx`; closure: this inbox, the Status line of the 0650 prompt
**Outcome**: ✅ completed
**Corregge**: 2026-11-02 02:35
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Discovery: «closed tab» is ModelTab.tsx:27 / MetamodelTab.tsx:148 for a missing model; undo never touches the dock, and the app bar hides the tab as a ghost, so it stays active. General: one undo of Navbar createM1 or createM2 does the same. Fix: both tabs call closeTabsForEntity, as a delete. Probe 3065, before/after in the commit body. Gates: tsc 0; vitest 20 files, 533 tests; build 0. Crops in ~/.jjodel-lanes/P-2026-11-02-0650/.
**Prompt document name**: 2026-11-02 06:50

## 2026-11-02 — merge: undo-tab-badge into alfonso-frontend-jjtl (P-2026-11-02-0833)
**Prompt**: Bring `undo-tab-badge` at `d114178d6` (fix fdb70a1e8) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-undo-tab-badge on 015d2a27e); union resolution of this inbox.
**Files touched**: merge commit 41c7c0d8a (`frontend/src/components/abstract/tabs/ModelTab.tsx`, `MetamodelTab.tsx`, `frontend/src/pages/components/Navbar.tsx`, the 0650 prompt, this inbox); `docs/prompts/claude_2026-11-02_0833_prompt_merge_undo-tab-badge.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crops of the lane)
**Prompt document name**: 2026-11-02 08:33

## 2026-11-02 — fix(model): defaultValueLiteral accessors, integer defaults, lazy gate off mode (P-2026-11-02-0653)
**Prompt**: R-TXT-25 (8), (9), (10): restore the L-layer get_/set_defaultValueLiteral and make the Ecore export read them; reject a decimal default literal on an integer attribute with a notice; make the off mode of check:codegen-lazy independent of `.env.production`.
**Files touched**: ffcb21052: frontend/src/model/logicWrapper/LModelElement.tsx, frontend/src/services/export/EcoreService.ts, frontend/src/services/export/__tests__/ecore-export-defaults.test.ts, frontend/src/jjscript/executor/commands/eval.ts, frontend/src/jjscript/executor/__tests__/unsetDefaultLiteral.test.ts, frontend/scripts/gates/check-codegen-lazy.ts; closure: this inbox, the Status line of the 0653 prompt
**Outcome**: ⚠️ partial
**Corregge**: 2026-11-01 23:50
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI)
**Notes**: Lazy off: clause 0 now resolves "false", clauses 1 and 3 stay red (43 generator modules via two unguarded imports, ticket below): the 10-23 ticket is re-scoped, not closed. No notice sink reaches the default read: console.warn, once per attribute and literal. L accessor not executed by a test (joiner does not import in the bench). Bench 3/3 killed. Gates: tsc 0, vitest 3409 (known window red), build 0, check:scripts 0, lazy on green.
**Prompt document name**: 2026-11-02 06:53

## 2026-11-02 — ticket: the lazy gate's off build ships generator modules through unguarded dynamic imports
**Ticket**: With VITE_CODEGEN=false resolved (P-2026-11-02-0653), check:codegen-lazy --off still fails clauses 1 and 3: 43 modules under src/codegen/ land in lazy chunks and a chunk names runner.worker. Two dynamic imports lack the CODEGEN_BUILD guard their neighbours have: `ProjectEditor.tsx:70` (React.lazy GeneratorsSection) and `LeftBar.tsx:385` (import of openTemplateEditor). The env-file cause of the 2026-10-23 ticket is gone; this is what remains.
**Priority**: medium
**Found in**: P-2026-11-02-0653

## 2026-11-02 — merge: defaults-layer-gate into alfonso-frontend-jjtl (P-2026-11-02-0841)
**Prompt**: Bring `defaults-layer-gate` at `85da82fc8` (fix ffcb21052) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-defaults-layer-gate on 5b62357a5); union resolution of this inbox.
**Files touched**: merge commit 247007a7b (`LModelElement.tsx` accessors, `EcoreService.ts`, `eval.ts`, the lazy gate script, tests, the 0653 prompt, this inbox); `docs/prompts/claude_2026-11-02_0841_prompt_merge_defaults-layer-gate.md` Status line; this entry
**Outcome**: ✅ completed (gate off mode still red on two imports: P-2026-11-02-0845)
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-02 08:41

## 2026-11-02 — feat(jjscript): set lists and enum literals (P-2026-11-02-0651)
**Prompt**: R-TXT-25 (2): M1 `set` takes a list on a many-valued attribute (error on a single one) and an enumeration literal on an enum-typed one (unknown literal names the enumeration); planner mirrors; `modelLines.ts` writes lists and bare literals, its many-valued block removed.
**Files touched**: 36a5387f6: `jjscript/parser/parser.ts`, `executor/commands/instance.ts`, `executor/commands/set.ts`, `executor/effectsPlanner.ts`, `executor/planWorld.ts`, tests `m1SetLists.test.ts` (new), `effectsPlanner.test.ts`, `planWorld.test.ts`; 084eb0902: `codegen/textual/modelLines.ts`, `__tests__/modelLines.test.ts`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 10 files, approved at 8-9 by the GO; `set.ts` is the expansion: a list at M2 is refused (LIST_NOT_SUPPORTED), as it was a parse error before the parser read lists. Enum values stored by name; a string on an enum attribute is still written as given. Undo is measured in the bench as one write inside one TRANSACTION, not on the real store (joiner does not import). Gates: tsc 0, vitest jjscript+codegen 3333 passed (context-binding: known window import), build 0.
**Prompt document name**: 2026-11-02 06:51

## 2026-11-02 — merge: jjscript-set-lists takes alfonso-frontend-jjtl (P-2026-11-02-0855)
**Prompt**: RC-14: bring the trunk `alfonso-frontend-jjtl` at `47c975ec2` into `jjscript-set-lists` with one `--no-ff` merge commit, before the trunk takes the branch; union resolution of this inbox.
**Files touched**: merge commit fb57b19f1 (the trunk's 31 commits since `c03585ae8`; resolution only in this inbox, +13 lines over the trunk's file); `docs/prompts/claude_2026-11-02_0855_prompt_jjscript-set-lists_take_trunk.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, unattended)
**Notes**: Both sides only appended to this inbox: trunk file whole, then the branch's 0651 entry. modelLines.test.ts auto-merged, read whole, its corpus imports resolve. Gates: tsc 0, typecheck:scripts 0; vitest 12787 = trunk 12765 + branch 22, 0 failed, 9 known window-red (trunk run had one autoIntake 15s timeout, green on the merge); hooks 967 = 967; build 0; check:docs 5/5 (check E is new, prompt said 4/4); check:scripts PASS; check:addonly PASS.
**Prompt document name**: 2026-11-02 08:55

## 2026-11-02 — merge: jjscript-set-lists into alfonso-frontend-jjtl (P-2026-11-02-0931)
**Prompt**: Bring `jjscript-set-lists` at `c4f1048a2` (feats 36a5387f6, 084eb0902; trunk taken by P-2026-11-02-0855) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-jjscript-set-lists on 47c975ec2).
**Files touched**: merge commit a53423995 (JjScript parser, set/instance commands, effects planner, planWorld, modelLines and tests, the 0651 and 0855 prompts, this inbox); `docs/prompts/claude_2026-11-02_0931_prompt_merge_jjscript-set-lists.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-02 09:31

## 2026-11-02 — fix(codegen): guard codegen imports for the lazy gate (P-2026-11-02-0845)
**Prompt**: R-TXT-25 (10), the ticket of P-2026-11-02-0653: put the two unguarded codegen dynamic imports under CODEGEN_BUILD so check:codegen-lazy --off is green, behaviour with the flag on unchanged.
**Files touched**: 3f84dfbd1: frontend/src/components/project/ProjectEditor.tsx, frontend/src/pages/components/LeftBar.tsx; closure: this inbox, the Status line of the 0845 prompt
**Outcome**: ✅ completed
**Corregge**: 2026-11-02 06:53
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: The prompt cited src/pages/ProjectEditor.tsx, absent; the only ProjectEditor.tsx is src/components/project/, whose :70 is the ticket's React.lazy: edited there (marked yes, honesty rule). GeneratorsSection is null without the flag; LeftBar guards both openTemplateEditor imports (:385, :389). Gates: tsc 0; vitest 50 files, 2482 tests; build 0; lazy gate ALL GREEN, off: only setting.ts. Probe 3133 flag on all PASS; crops in ~/.jjodel-lanes/P-2026-11-02-0845/crops/.
**Prompt document name**: 2026-11-02 08:45

## 2026-11-02 — merge: lazy-gate-guards into alfonso-frontend-jjtl (P-2026-11-02-0943)
**Prompt**: Bring `lazy-gate-guards` at `70e93a9cc` (fix 3f84dfbd1) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-lazy-gate-guards on 39e5014bc); union resolution of this inbox.
**Files touched**: merge commit e684fef6c (`frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/pages/components/LeftBar.tsx`, the 0845 prompt, this inbox); `docs/prompts/claude_2026-11-02_0943_prompt_merge_lazy-gate-guards.md` Status line; this entry
**Outcome**: ✅ completed (check:codegen-lazy green in both modes)
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-02 09:43

## 2026-11-02 — feat(codegen): textual syntax annotations, grammar part (P-2026-11-02-0955, P-2026-11-02-1016)
**Prompt**: T4a-1 of the 0846 design: syntax annotations as data, applied in derivation, printer and parser, LL(1) check in the style check, R-TXT-27 refusal. 0955 wrote it and hard-stopped at the context ceiling (RC-51); 1016 applied the pending subset-order fix, ran acceptance, mutation bench and gates, and committed.
**Files touched**: 5467088b7: frontend/src/codegen/textual/annotations.ts, __tests__/annotations.test.ts, concreteGrammar.ts, parser.ts, printer.ts, style.ts, styleCheck.ts; closure: this inbox, the Status lines of the 0846, 0955 and 1016 prompts
**Outcome**: ✅ completed (check:codegen-lazy off mode red, pre-existing: same 43 modules on the tip, ticket of P-2026-11-02-0653)
**Corregge**: 2026-11-02 08:46
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Corregge 0846 for one point only: its handoff put instructions in model order within a group; the prototype's brief-text.md:66 and 8 briefs want the subset's literal order, ties in model order. Acceptance on the 16 micron briefs, scratch deleted: 16/16 print equal, parse clean, reprint equal, one nearley parse. Bench: 8/8 mutations killed (commit message). Gates: tsc 0, vitest src/codegen 2504/2504, build 0, check:docs 0, lazy on PASS. Fixtures: Requester.name, Instruction.mnemonic [1..1].
**Prompt document name**: 2026-11-02 10:16

## 2026-11-02 — merge: textual-t4 into alfonso-frontend-jjtl (P-2026-11-02-1027)
**Prompt**: Bring `textual-t4` at `3cf861948` (feat 5467088b7, T4a-1 designed by 0846, implemented by 0955 and 1016) into the trunk `alfonso-frontend-jjtl` with lane-run merge --direct (tag pre-textual-t4 on 7dc62b88f); union resolution of this inbox.
**Files touched**: merge commit c41033a9a (`frontend/src/codegen/textual/annotations.ts`, `concreteGrammar.ts`, `parser.ts`, `printer.ts`, `style.ts`, `styleCheck.ts`, `__tests__/annotations.test.ts`, the 0846/0955/1016 prompts, this inbox); `docs/prompts/claude_2026-11-02_1027_prompt_merge_textual-t4.md` Status line; this entry
**Outcome**: ✅ completed (R-TXT-27 and the 0845 guards kept from the trunk)
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Prompt document name**: 2026-11-02 10:27

## 2026-11-02 — feat(codegen): textual syntax annotations stored, language name shown (P-2026-11-02-1830, P-2026-11-02-1930)
**Prompt**: T4a-2 (1830, hard-stop at the context ceiling, RC-51) closed by 1930: syntax annotations in the metamodel's `_state` under `textSyntax`, `ElementIds` with lower bounds, one grammar path for Text tab, EBNF and «New model from text», issues strip, picker/tab/app-bar labelled with `language`; gates, commit, in-app check.
**Files touched**: bb620d93c: `frontend/src/codegen/textual/syntaxRecord.ts` (new), `__tests__/syntaxRecord.test.ts` (new), `concreteGrammar.ts`, `ui/TextualTab.tsx`, `ui/TextualTab.scss`, `ui/openTextualTab.tsx`, `frontend/src/components/editor-v2/Toolbar.tsx`, `dataManagerOption.ts`, `__tests__/textualPicker.test.ts`; Status lines of the 1830 and 1930 prompts; this entry
**Outcome**: ✅ completed
**Corregge**: 2026-11-02 10:16 (T4a-1 grouping: block-layout objects of a subset chained on one line, 8-line fix in concreteGrammar.ts)
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no (9 code files, above five, all in 1830's DOVE and listed above)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe agente 24/24; verifica visiva passata 2026-11-02, chat RC-23, unattended)
**Notes**: Tests followed the code, contrary to 1830 COME; bench 11/11 mutants killed (commit body). Discovery: key textSyntax free; Toolbar cannot import src/codegen (lazy gate), so the key lives in dataManagerOption.ts; ElementIds from the D-layer lookup, legacy classifiers too; no issues UI existed, strip added. Commit subject cut to 72 (hook). Probe DemoESM 24/24: one undo clears the record (2 history entries), reload equal, malformed record shows its error. Detail: lane handoff.md, probe-run1.log.
**Prompt document name**: 2026-11-02 19:30

**Ticket** (P-2026-11-02-1930): the app-bar tab ellipsises the title to `demoESM · Stat…` at default width.

## 2026-11-02 — merge: textual-t4a2 into alfonso-frontend-jjtl (P-2026-11-02-1954)
**Prompt**: `claude_2026-11-02_1954_prompt_merge_textual-t4a2.md`, a direct merge by `lane-run merge --direct`, no session: `textual-t4a2` at `718c11374` into `alfonso-frontend-jjtl`, merge base `e5ad232c4`, 3 commits on the branch side.
**Files touched**: merge `4233db8e5`: 12 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-02_1830_prompt_textual_t4a2_storage_label.md`, `docs/prompts/claude_2026-11-02_1930_prompt_textual_t4a2_close.md`, `frontend/src/codegen/textual/__tests__/syntaxRecord.test.ts`, `frontend/src/codegen/textual/concreteGrammar.ts`, `frontend/src/codegen/textual/syntaxRecord.ts`, `frontend/src/codegen/textual/ui/TextualTab.scss`, `frontend/src/codegen/textual/ui/TextualTab.tsx`, and 4 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `4233db8e5` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12937 tests in 491 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: visual check passed on the branch, crops of P-2026-11-02-1930 checked by the chat, unattended
**Notes**: Rollback tag `pre-textual-t4a2` on `e415cb932` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-1954/result.json`.
**Prompt document name**: 2026-11-02 19:54

## 2026-11-02 — feat(codegen): text paths follow the class keyword (P-2026-11-02-2003)
**Prompt**: R-TXT-28: a path's first segment is the class's printed keyword (class name when dropped), in printer and parser, keyword read from the concrete grammar; tests first on the library fixture; measure feature segments; gates, commit, bench.
**Files touched**: e141ed7b1: `frontend/src/codegen/textual/printer.ts`, `parser.ts`, `__tests__/syntaxRecord.test.ts`; Status line of the 2003 prompt; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tests written first, 4 red before the fix. Bench 4/4 mutants killed (commit body). printer.ts exports pathKeyword (head kw of the object rule); parser resolves among the top-level classes only; shared keyword gives an error naming both. styleCheck.ts untouched: distinct-classes and LL(1) already refuse both clashes. No record: byte-identical, 2535 codegen tests green.
**Prompt document name**: 2026-11-02 20:03

**Ticket** (P-2026-11-02-2003): feature segments keep the feature name: with `members` printed as `patrons`, the path reads `shelf[0].members[1]`, and `shelf[0].patrons[1]` is refused with `Library has no containment "patrons"`. Same mismatch as R-TXT-28 fixed for classes; outside that row.

## 2026-11-02 — merge: textual-path-keyword into alfonso-frontend-jjtl (P-2026-11-02-2019)
**Prompt**: `claude_2026-11-02_2019_prompt_merge_textual-path-keyword.md`, a direct merge by `lane-run merge --direct`, no session: `textual-path-keyword` at `3ebbb3f92` into `alfonso-frontend-jjtl`, merge base `42e4065c6`, 2 commits on the branch side.
**Files touched**: merge `45b02a390`: 5 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-02_2003_prompt_textual_path_keyword.md`, `frontend/src/codegen/textual/__tests__/syntaxRecord.test.ts`, `frontend/src/codegen/textual/parser.ts`, `frontend/src/codegen/textual/printer.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `45b02a390` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12943 tests in 491 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no UI change, visual check not applicable
**Notes**: Rollback tag `pre-textual-path-keyword` on `5467e2328` (RC-31). Union: `docs/log-inbox/codegen.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-2019/result.json`.
**Prompt document name**: 2026-11-02 20:19

## 2026-11-02 — feat(codegen): text paths follow feature keywords (P-2026-11-02-2029)
**Prompt**: R-TXT-29: a later path segment is the containment's printed keyword (feature name when dropped or inline), in printer and parser, read from the concrete grammar; tests first on the library fixture; clash refused; grouped index measured; gates, commit, bench.
**Files touched**: fb25f816a: `frontend/src/codegen/textual/printer.ts`, `parser.ts`, `styleCheck.ts`, `__tests__/syntaxRecord.test.ts`; Status line of the 2029 prompt; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 6 tests red first. Grouped index measured broken (books[3] reparsed as cosmos): printer now indexes in printed order. Path-keyword clash passed the style check silently: now refused (distinct-features) and a parse error naming both. Bench 6 mutants, all killed (commit body); inline mutant in its non-equivalent form. Closes the 2003 ticket. No record: byte-identical, 2543 codegen tests green.
**Prompt document name**: 2026-11-02 20:29

## 2026-11-02 — merge: textual-path-feature into alfonso-frontend-jjtl (P-2026-11-02-2057)
**Prompt**: `claude_2026-11-02_2057_prompt_merge_textual-path-feature.md`, a direct merge by `lane-run merge --direct`, no session: `textual-path-feature` at `5edc759e0` into `alfonso-frontend-jjtl`, merge base `4d1d32b8b`, 2 commits on the branch side.
**Files touched**: merge `1a5e905b0`: 6 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-02_2029_prompt_textual_path_feature_keyword.md`, `frontend/src/codegen/textual/__tests__/syntaxRecord.test.ts`, `frontend/src/codegen/textual/parser.ts`, `frontend/src/codegen/textual/printer.ts`, `frontend/src/codegen/textual/styleCheck.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `1a5e905b0` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12974 tests in 492 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no UI change, visual check not applicable
**Notes**: Rollback tag `pre-textual-path-feature` on `43350d3cd` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-2057/result.json`.
**Prompt document name**: 2026-11-02 20:57

## 2026-11-02 — feat(codegen): report objects the text does not print (P-2026-11-02-2113)
**Prompt**: R-TXT-30, first half: printTextModel returns the objects a grouped containment does not print (owner, feature, class, attribute, unset or outside, objects inside); the Text tab lists one warning per class and reason; hasUnprinted() for step T6; tests first, mutation bench, in-app check.
**Files touched**: 09cfca60d: `frontend/src/codegen/textual/printer.ts`, `ui/TextualTab.tsx`, `ui/TextualTab.scss`, `__tests__/syntaxRecord.test.ts`; Status line of the 2113 prompt; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato con riserva: probe in the lane folder, Shelf metamodel, light theme, warning for 1 then 2 books, gone once set; browser served eval.ts without the mandatory-enum fill, repo untouched; crop checked by the chat
**Notes**: 6 tests red first; bench 3 mutants killed. vitest src/codegen at load 7: 51 files, 2549 passed; the 4 red generator tests at load 134 were the 2000 ms limit. Measured: a mandatory enum left empty reads as its first literal, so the warning does not fire on an unset attribute in the app. Closed by the chat after the context ceiling.
**Prompt document name**: 2026-11-02 21:13

## 2026-11-02 — ticket: R-TXT-30 warning rarely reachable for an enum grouping (P-2026-11-02-2113)
**Ticket**: a mandatory enum left empty reads as its first literal (`emptyAttributeDefault`, `jjscript/executor/commands/eval.ts`), so the text prints that object under the first literal's group and the warning stays silent. From reading the code, one path remains: a declared default that is no literal is returned as is, and falls outside every subset (not measured). Step T6 must state how it compares a read default with a stored empty value, so that applying a text does not write the default unasked.
**Priority**: low
**Found in**: P-2026-11-02-2113
**Detail**: ~/.jjodel-lanes/P-2026-11-02-2113/probe-probe.log

## 2026-11-02 — merge: textual-unprinted into alfonso-frontend-jjtl (P-2026-11-02-2317)
**Prompt**: `claude_2026-11-02_2317_prompt_merge_textual-unprinted.md`, a direct merge by `lane-run merge --direct`, no session: `textual-unprinted` at `ea1aad134` into `alfonso-frontend-jjtl`, merge base `02586b29b`, 2 commits on the branch side.
**Files touched**: merge `2951a72a6`: 6 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-02_2113_prompt_textual_unprinted_objects.md`, `frontend/src/codegen/textual/__tests__/syntaxRecord.test.ts`, `frontend/src/codegen/textual/printer.ts`, `frontend/src/codegen/textual/ui/TextualTab.scss`, `frontend/src/codegen/textual/ui/TextualTab.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2951a72a6` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13060 tests in 496 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: visual check passed with reservation on the branch, crop checked by the chat
**Notes**: Rollback tag `pre-textual-unprinted` on `7d66c7420` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-2317/result.json`.
**Prompt document name**: 2026-11-02 23:17

## 2026-11-03 — feat(codegen): diff an edited text against its model (P-2026-11-02-2327, P-2026-11-02-2355)
**Prompt**: T6a of the textual notation, no UI: match parsed objects to model objects (spans, then the R-TXT-18 cascade), minimal diff, refusals (R-TXT-26, R-TXT-30), a default read is no change, lines by registered handles, run as one undo step. 2327 stopped at the context ceiling (RC-51); 2355 closed it from its handoff: test fixes, gates, commit, bench, apply and undo on a real project state.
**Files touched**: be4a90587: `frontend/src/codegen/textual/textMatch.ts`, `textDiff.ts`, `textApply.ts` (new), `__tests__/textDiff.test.ts` (new), `modelLines.ts`; Status lines of the 2327 and 2355 prompts; this entry and the ticket below
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI; apply and one undo checked in the app by a probe)
**Notes**: 7 red tests of the handoff fixed, one expectation changed with its reason in the commit body (nameless Links are homonyms). Gates: tsc 0, vitest src/codegen 52 files 2606 passed, build, check:docs, check:codegen-lazy off and on. Bench: 6 mutants, all killed (docs commit body). Probe on demoESM: 4 lines applied, reprint equals the edit, one undo restores text and the 36-element subtree; `~/.jjodel-lanes/P-2026-11-02-2355/probe.out`.
**Prompt document name**: 2026-11-02 23:27, 2026-11-02 23:55

## 2026-11-03 — ticket: a text edit of a model with a single-valued reference outside the text is always refused
**Ticket**: the printer writes a single-valued reference keyword with no value when the target is not among the printed objects (the defect of the P-2026-11-02-1942 ticket in `docs/log-inbox/hw-notation.md`), so the text does not parse and `planTextEdit` refuses every edit of that model with `parse`; the model is not touched. Pinned as an expected refusal by `textDiff.test.ts` ('a single-valued target the text cannot name is an expected refusal'). A many-valued target outside the text is preserved. The fix is the printer's (`printer.ts`), outside T6a.
**Priority**: medium
**Found in**: P-2026-11-02-2327
**Detail**: docs/log-inbox/hw-notation.md (ticket of P-2026-11-02-1942)

## 2026-11-03 — merge: textual-t6a into alfonso-frontend-jjtl (P-2026-11-03-0011)
**Prompt**: `claude_2026-11-03_0011_prompt_merge_textual-t6a.md`, a direct merge by `lane-run merge --direct`, no session: `textual-t6a` at `dfc34e2b1` into `alfonso-frontend-jjtl`, merge base `52e49d05c`, 3 commits on the branch side.
**Files touched**: merge `b0bfeb221`: 8 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-02_2327_prompt_textual_t6a_diff.md`, `docs/prompts/claude_2026-11-02_2355_prompt_textual_t6a_close.md`, `frontend/src/codegen/textual/__tests__/textDiff.test.ts`, `frontend/src/codegen/textual/modelLines.ts`, `frontend/src/codegen/textual/textApply.ts`, `frontend/src/codegen/textual/textDiff.ts`, `frontend/src/codegen/textual/textMatch.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `b0bfeb221` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13124 tests in 497 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no UI change, visual check not applicable
**Notes**: Rollback tag `pre-textual-t6a` on `d52bb1c58` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-0011/result.json`.
**Prompt document name**: 2026-11-03 00:11

## 2026-11-03 — feat(codegen): edit an existing model from its text (P-2026-11-03-0021, P-2026-11-03-0049)
**Prompt**: T6b of the textual notation: the Text tab edits an existing model through the T6a engine (R-TXT-22, R-TXT-26, R-TXT-30): apply after a pause as one undo step, refusals in the bar, a confirm panel for uncertain or referenced deletions, a stale block when the model changes under a pending edit. 0021 stopped at the context ceiling (RC-51); 0049 closed it from its handoff: gates, commit, this entry.
**Files touched**: a5a9bb281: `frontend/src/codegen/textual/textDiff.ts`, `ui/TextualTab.tsx`, `ui/TextualTab.scss`, `ui/TextConfirmPanel.tsx` (new), `__tests__/textualEdit.test.ts` (new); Status lines of the 0021 and 0049 prompts; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato 2026-11-03 (chat, unattended, RC-23) on the crops `2-attribute-applied`, `7-broken`, `9-stale`, `10-panel` of 0021: status in the bar, markers, nothing shifted, panel with Confirm, Reprint line. In-app probe of 0021: 34 PASS, crops in `~/.jjodel-lanes/P-2026-11-03-0021/`. The probe's diagram edit was a direct write to the model (`SetFieldAction` on a DValue), not a canvas click. Deleting a cross-model target, unprinted objects and a move refusal are covered by unit tests only.
**Notes**: Gates: tsc 0; vitest src/codegen + textualPicker 54 files 2643 passed; build 0; check:docs 5/5; check:codegen-lazy ALL GREEN (off, on). Bench 12/12 killed + probe mutant "two undo steps" killed (commit body). Process: 0021 started a dev server (port 3076) for its probe, against the no-background-tasks rule of its prompt; it is stopped. Open decision: a stale text is never applied (handoff decision 1).
**Prompt document name**: 2026-11-03 00:21, 2026-11-03 00:49

## 2026-11-03 — merge: textual-t6b into alfonso-frontend-jjtl (P-2026-11-03-0543)
**Prompt**: `claude_2026-11-03_0543_prompt_merge_textual-t6b.md`, a direct merge by `lane-run merge --direct`, no session: `textual-t6b` at `d4b7775bf` into `alfonso-frontend-jjtl`, merge base `e1b35c188`, 3 commits on the branch side.
**Files touched**: merge `8814e3c4a`: 8 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-03_0021_prompt_textual_t6b_edit.md`, `docs/prompts/claude_2026-11-03_0049_prompt_textual_t6b_close.md`, `frontend/src/codegen/textual/__tests__/textualEdit.test.ts`, `frontend/src/codegen/textual/textDiff.ts`, `frontend/src/codegen/textual/ui/TextConfirmPanel.tsx`, `frontend/src/codegen/textual/ui/TextualTab.scss`, `frontend/src/codegen/textual/ui/TextualTab.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `8814e3c4a` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13215 tests in 501 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: visual check passed on the branch, crops of P-2026-11-03-0021 checked by the chat, unattended
**Notes**: Rollback tag `pre-textual-t6b` on `b3c82f86d` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-0543/result.json`.
**Prompt document name**: 2026-11-03 05:43

## 2026-11-03 — test(codegen): in-app acceptance of references outside the text (P-2026-11-03-1141)
**Prompt**: P-2026-11-03-1141, continuation of P-2026-11-03-1045 after the context ceiling (RC-51): rerun tsc and check:docs on 5a9ce5ec4; accept `@"<id>"` in the app (print, parse, attribute edit, reference intact, one Undo); measure open questions 1 and 3; Briefs read-only; crops; log and Status flips left uncommitted (RC-17).
**Files touched**: this inbox; the `Status:` lines of the 1045 and 1141 prompts. No code: the code is 5a9ce5ec4 (P-2026-11-03-1045). Probes and crops in `~/.jjodel-lanes/P-2026-11-03-1141/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passed 2026-11-03 (chat, RC-23) — probe ALL PASS (port 3141, light theme, scale 1); crops 1 to 6 in the lane folder await Alfonso's visual check
**Notes**: tsc exit 0, check:docs 5/5. Setup is a direct model write, not a canvas gesture: State.listens (Event, many) added via the L-layer, outer values via `$f.values`; the second model through «New model from text» typed in the app. Q3: deleting `@"near"` from the list unlinks it, one Undo restores. Q1: deleting the target clears the referring slots, so no dangling id reaches the text and no missing-target warning exists to fire. Briefs: print parses, 0 errors, print-parse-print identical.
**Prompt document name**: 2026-11-03 11:41

## 2026-11-03 — merge: textual-refs-outside into alfonso-frontend-jjtl (P-2026-11-03-1207)
**Prompt**: `claude_2026-11-03_1207_prompt_merge_textual-refs-outside.md`, a direct merge by `lane-run merge --direct`, no session: `textual-refs-outside` at `b8712daa6` into `alfonso-frontend-jjtl`, merge base `fa9e886cb`, 5 commits on the branch side.
**Files touched**: merge `336f39188`: 13 files from the branch side (`docs/discovery/discovery_2026-11-03_textual_refs_outside_text.md`, `docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-03_1045_prompt_textual_refs_outside.md`, `docs/prompts/claude_2026-11-03_1141_prompt_textual_refs_acceptance.md`, `frontend/src/codegen/textual/__tests__/parser.test.ts`, `frontend/src/codegen/textual/__tests__/styleCheck.test.ts`, `frontend/src/codegen/textual/__tests__/textDiff.test.ts`, `frontend/src/codegen/textual/metamodel.ts`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `336f39188` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13249 tests in 503 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs and code merge of textual-refs-outside; gates green on the merge; in-app acceptance and crops checked before the merge (P-2026-11-03-1141, RC-23); no new visual check
**Notes**: Rollback tag `pre-textual-refs-outside` on `7690502cb` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1207/result.json`.
**Prompt document name**: 2026-11-03 12:07

## 2026-11-03 — feat(codegen): text edits move objects and reorder ordered features (P-2026-11-03-1225, P-2026-11-03-1251, P-2026-11-03-1321)
**Prompt**: Textual T7 in three lanes: 1225 discovery and the JjScript M1 move plan; 1251 moves and reorders in the diff and the Text tab; 1321 in-app acceptance, stopped at the context ceiling (RC-51) after item (6), closed by P-2026-11-03-1356.
**Files touched**: 10 code files (ee2f4ccc6, 2f16d3f39, ff2c371fd, b2e9bae4d, 1b4064899, 0395e708b, d2125a90f): `codegen/textual/{textDiff.ts, metamodel.ts, ui/TextualTab.tsx}`, `jjscript/executor/{effectsPlanner.ts, planWorld.ts}` and their 5 tests; docs: T7 discovery, this inbox, 4 prompt Status lines.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no — above five files (RC-11), listed in Files touched; the planner files were in 1225's declared reach.
**Layer Impact Report**: not-required
**Smoke visivo**: in attesa del GO di Alfonso — probe ALL PASS, 19 checks (run 3 on d2125a90f); crops 1 to 9 in ~/.jjodel-lanes/P-2026-11-03-1321/
**Notes**: Gates on d2125a90f: tsc exit 0; vitest 13272 passed, 9 red at import (baseline); build exit 0; check:codegen-lazy green. R1 fixed in the text layer: `-=` out of the old slot before `+=` (a `+=` alone left a hole, measured in the app). Evidence: ~/.jjodel-lanes/P-2026-11-03-1321/handoff.md.
**Prompt document name**: 2026-11-03 13:21

## 2026-11-03 — test(codegen): positional paths after a move or reorder (P-2026-11-03-1356)
**Prompt**: P-2026-11-03-1356: measure, with no fix, what an untouched path reference does after a reorder, a cut of an earlier sibling, a deletion, an insertion, and a move of the target; it.fails tests, discovery with a recommended rule; then step (7) of the 1321 handoff.
**Files touched**: `frontend/src/codegen/textual/__tests__/textDiff.test.ts` (d23d39e7f); `docs/discovery/discovery_2026-11-03_textual_positional_paths.md` (8277287b8); this inbox; the Status lines of the 1225, 1251, 1321 and 1356 prompts.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: All five edits retarget the reference silently (parser.ts:652 resolves the path in the edited text); the old index gone is refused by the parse. Five it.fails tests, bench in the commit body; 74 passed, 5 expected fail; tsc exit 0. Recommended: an untouched reference token keeps its target (amends R-TXT-4), awaiting Alfonso.
**Prompt document name**: 2026-11-03 13:56

## 2026-11-03 — feat(codegen): an untouched reference token keeps its target (P-2026-11-03-1425, P-2026-11-03-1451)
**Prompt**: P-2026-11-03-1425: R-TXT-35, a reference token the user did not retype keeps the target the print wrote it for; stopped at the ceiling after the code. P-2026-11-03-1451: its Text tab tests, mutation bench, gates, in-app check of five edits, the reprint measured, Briefs, crops.
**Files touched**: `printer.ts`, `parser.ts`, `textDiff.ts`, `ui/TextualTab.tsx`, `__tests__/textDiff.test.ts` (74b0703d5); `__tests__/textualEdit.test.ts`, `__tests__/textDiff.test.ts` (4b34517b0); this inbox; the Status lines of 1425 and 1451.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: in attesa del GO di Alfonso — probe 30 of 31 PASS (the failure is the cleanup of a direct write); crops 1 to 7 in ~/.jjodel-lanes/P-2026-11-03-1451/
**Notes**: Gates on 4b34517b0: tsc exit 0; vitest 13292 passed, 9 red at import (baseline); build exit 0; check:docs 5/5; check:codegen-lazy ALL GREEN (off, on). Bench: 11 mutants, all killed; M5 (owner) and M7 (gone target) survived until two new tests. After an application the text stays as typed until a model change from elsewhere, an Undo, or a reopen. Evidence: ~/.jjodel-lanes/P-2026-11-03-1451/.
**Prompt document name**: 2026-11-03 14:51

## 2026-11-03 — merge: textual-t7 into alfonso-frontend-jjtl (P-2026-11-03-1517)
**Prompt**: `claude_2026-11-03_1517_prompt_merge_textual-t7.md`, a direct merge by `lane-run merge --direct`, no session: `textual-t7` at `d1aea42a1` into `alfonso-frontend-jjtl`, merge base `faa85e8ac`, 21 commits on the branch side.
**Files touched**: merge `ec570ca11`: 21 files from the branch side (`docs/discovery/discovery_2026-11-03_textual_positional_paths.md`, `docs/discovery/discovery_2026-11-03_textual_t7_moves.md`, `docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-03_1225_prompt_textual_t7.md`, `docs/prompts/claude_2026-11-03_1251_prompt_textual_t7_continuation.md`, `docs/prompts/claude_2026-11-03_1321_prompt_textual_t7_acceptance.md`, `docs/prompts/claude_2026-11-03_1356_prompt_textual_t7_paths.md`, `docs/prompts/claude_2026-11-03_1425_prompt_textual_t7_keep_refs.md`, and 13 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ec570ca11` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13389 tests in 505 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: merge of textual-t7, gates green on the merge; crops of P-2026-11-03-1321 and P-2026-11-03-1451 checked by the chat before the merge (RC-23); the as-typed path after an application goes to P-2026-11-03-1530
**Notes**: Rollback tag `pre-textual-t7` on `ed6367578` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1517/result.json`.
**Prompt document name**: 2026-11-03 15:17

## 2026-11-03 — feat(codegen): after an application the text shows the current paths (P-2026-11-03-1535)
**Prompt**: R-TXT-35: after an application, rewrite only the reference tokens whose print changed (not the one under the caret, which waits); one Undo per application in model and text; measure the failed cleanup of P-2026-11-03-1451.
**Files touched**: `ui/TextualTab.tsx`, `__tests__/textualEdit.test.ts` (2c68de01b); `ui/TextualTab.tsx` (4656b4ac6); this inbox; the Status of 1535.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: in attesa del GO di Alfonso — probe 36/36 PASS: five edits of 1451 by keystrokes, current path after Applied, caret kept, one Undo restores; caret-on-token held, rewritten on ArrowDown; crops in ~/.jjodel-lanes/P-2026-11-03-1535/
**Notes**: Gates on 4656b4ac6: tsc exit 0; vitest 13396 passed, 3 red at import (baseline count of 1517); build exit 0; check:docs exit 0; check:codegen-lazy ALL GREEN (off, on). Bench: 11 mutants, all killed. (3): the 1451 cleanup fails without a prior mouse click: the direct write joins the text application's undo step, whose undo reverts the reorder only (stack 1, 1, 0); with a click, 1, 2, 1, 0 and t0. Core reducer history, not the Text tab.
**Prompt document name**: 2026-11-03 15:35

## 2026-11-03 — merge: textual-applied-paths into alfonso-frontend-jjtl (P-2026-11-03-1558)
**Prompt**: `claude_2026-11-03_1558_prompt_merge_textual-applied-paths.md`, a direct merge by `lane-run merge --direct`, no session: `textual-applied-paths` at `69c1f6390` into `alfonso-frontend-jjtl`, merge base `968e7a44e`, 4 commits on the branch side.
**Files touched**: merge `153ac0fb1`: 4 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-03_1535_prompt_textual_applied_paths.md`, `frontend/src/codegen/textual/__tests__/textualEdit.test.ts`, `frontend/src/codegen/textual/ui/TextualTab.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `153ac0fb1` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13414 tests in 506 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: merge of textual-applied-paths, gates green on the merge; crops of P-2026-11-03-1535 checked by the chat before the merge (RC-23)
**Notes**: Rollback tag `pre-textual-applied-paths` on `8f3482ab3` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1558/result.json`.
**Prompt document name**: 2026-11-03 15:58

## 2026-11-03 — discovery(codegen): tolerant parser, textual step A phase 1 (P-2026-11-03-1415)
**Prompt**: `claude_2026-11-03_1415_prompt_textual_a_discovery.md`: measure `parser.ts` on incomplete text (truncation at every token, deletion of every token) on non-hardware metamodels in their annotated forms; read spans, identity and comments against a CST; recommend one design; stop with a question. No production code.
**Files touched**: `ecb912167`: `docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md`, `docs/discovery/harness/probe_2026-11-03_textual_tolerant_parser.test.ts`; this commit: this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Docs and a harness probe only; no gate run (no code changed).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 1,214 mutants, 0 throws. Deleting a root's `{` or keyword loses the whole root (sync skips balanced blocks). Reference errors precede the syntax error in the list. Parse quadratic in references (1.1 s at 24k objects, 48 ms without). No trivia, spans per object only. Recommended: lossless CST with trivia on tokens, built by parser and printer. Seven decisions await Alfonso, in the report.
**Prompt document name**: 2026-11-03 14:15

## 2026-11-03 — feat(codegen): tolerant parser, lossless tree and recovery, textual step A parser half (P-2026-11-03-2120, P-2026-11-03-2152)
**Prompt**: `claude_2026-11-03_2120_prompt_textual_a_parser.md` and its continuation `claude_2026-11-03_2152_prompt_textual_a_parser_cont.md` (RC-51): tokens keep their trivia, a lossless tree, recovery by insertion, deletion and descent, reference errors after a syntax error as warnings, linear name resolution, a display-only match of a broken parse; bench, Briefs, gates, in-app check.
**Files touched**: `parser.ts` (722eb3cee, 93ec1bd92, ce29856c2, 231113e79, beb512f58); `__tests__/tolerant.test.ts`, `__tests__/tolerantCorpus.ts` (93ec1bd92 onward, b35e18146); `textMatch.ts`, `ui/TextualTab.tsx` (bfa1a18ee); harness probe `docs/discovery/harness/probe_2026-11-03_2120_tolerant_recovery.test.ts`; this inbox; the Status of 1415, 2120, 2152 (P-2026-11-03-2220 item 1).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (9 files over the two lanes, above five: listed above, RC-11; all inside the declared scope)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 4/4: brace deleted, keyword deleted, truncation, comment kept on apply; crops of P-2026-11-03-2152 checked by the chat (RC-23)
**Notes**: Gates on b35e18146: tsc 0; vitest 13465 passed, 3 red at import (baseline); build 0; check:codegen-lazy ALL GREEN (off, on). Deletion probe: kept-after 83.4 -> 100% (library), stopped 20/542 -> 1/542; 6,001 objects 102.5 -> 27.2 ms. Bench: every mutant killed but isApplicableParse on errors only (equivalent). Findings (a) collapsed spans after paste-back, (b) live delete of a commented-out object: ~/.jjodel-lanes/P-2026-11-03-2152/handoff.md.
**Prompt document name**: 2026-11-03 21:20

## 2026-11-03 — feat(codegen): the printer builds the parser's tree, textual step A printer half (P-2026-11-03-2220)
**Prompt**: `claude_2026-11-03_2220_prompt_textual_a_printer.md`: the printer builds the same lossless tree as the parser, with an equality test over the corpus that closes step A; linear name resolution in the printer; the parser half closed (probe committed, log entry and Status of 1415, 2120, 2152).
**Files touched**: `printer.ts` (8c6734ffe, c79d05b4c); `__tests__/printerTree.test.ts` and the equality tests (8c6734ffe, 5dd458ddb); `docs/discovery/harness/probe_2026-11-03_2120_tolerant_recovery.test.ts` (920e17804); docs (98898d626).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (24 prints byte-identical to the pre-lane printer: text, spans, refs, unprinted)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — nothing changes on screen; in-app check by the lane on demoESM (port 3453, 4/4): text byte-identical, tree leaves equal the text, an edit applies, one Undo restores model and text.
**Notes**: Gates on 5dd458ddb green (tsc, vitest 13476 with the 3 baseline files, build, check:docs, codegen-lazy both modes). Equality 7/7 corpus cases, red before. Printer 1,001 objects 3.8 ms, 6,001 21.7 ms, linear. Bench 20/21 killed, survivor equivalent. Briefs: 0 errors, trees equal. Open: a quadratic step for grouped containments (printer.ts:159); a Canceled console error after Meta+z, older than this lane. Entry and Status by the chat; details in the 2220 handoff.
**Prompt document name**: 2026-11-03 22:20

## 2026-11-03 — merge: textual-a-tolerant-parser into alfonso-frontend-jjtl (P-2026-11-03-2245)
**Prompt**: `claude_2026-11-03_2245_prompt_merge_textual-a-tolerant-parser.md`, a direct merge by `lane-run merge --direct`, no session: `textual-a-tolerant-parser` at `deb4416f9` into `alfonso-frontend-jjtl`, merge base `6fb7d2841`, 18 commits on the branch (step A of the textual IDE plan: tolerant parser, lossless tree, printer tree, R-TXT-36).
**Files touched**: merge `2daef6982`, the branch side (`frontend/src/codegen/textual/parser.ts`, `printer.ts`, `textMatch.ts`, `ui/TextualTab.tsx`, their tests, `docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md`, `docs/discovery/harness/`, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2daef6982` in the worker: typecheck 0 errors; typecheck:scripts exit 0; vitest green with the 3 baseline files red at import; build exit 0; check:agents, check:scripts, check:addonly exit 0; check:docs red (see Notes), green on `607ec2ead`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: crops of P-2026-11-03-2152 checked before the merge (RC-23); the printer half changes nothing on screen.
**Notes**: Blocked on check:docs by a 711-char Notes field the chat wrote for P-2026-11-03-2220; shortened in `607ec2ead`, check:docs 5/5, lane resolved (`resolved.txt`). Rollback tag `pre-textual-a-tolerant-parser` on `00e4bcea4` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-2245/result.json`.
**Prompt document name**: 2026-11-03 22:45

## 2026-11-03 — fix(codegen): a pasted-back text gets its agreed spans back (P-2026-11-03-2326)
**Prompt**: `claude_2026-11-03_2326_prompt_textual_paste_back_spans.md`, fast lane: the defect of F7 in `discovery_2026-11-03_textual_language_service.md`. The agreement keeps its spans and reference tokens, and they are put back whenever the editor's text equals it again; red test first, mutation bench, gates, in-app keystrokes.
**Files touched**: `frontend/src/codegen/textual/ui/TextualTab.tsx`, `frontend/src/codegen/textual/__tests__/textualEdit.test.ts` (`b57178053`); this entry and the Status line of the prompt (uncommitted, RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. tsc 0 errors; vitest 13479/13480, the 3 baseline files red at import, plus a timing test of the printer (`tolerant.test.ts` (viii), ratio 13.5 over 12 under full-suite load) green alone at 53/53; build exit 0; check:docs 5/5; check:codegen-lazy off and on green.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3461 (demoESM): Cmd+A, Backspace, Cmd+V and the 168-to-end block, then a comment: «No change», no panel, model untouched, 5/5 each; the chat's GO pending (RC-23).
**Notes**: Red first: 4 of 4 new cases failed on a stub that restored nothing. Bench on `agreedEvidence`: null 4 die, tokens dropped 1, text not compared 3, guard dropped 1. The wiring in the component is not reachable from the bench; the probe covers it, and its control on HEAD reproduces F7 («confirm below», two unnamed Transitions). One Undo after the comment is Monaco's own, one word. Probe, logs, crops: `~/.jjodel-lanes/P-2026-11-03-2326/`.
**Prompt document name**: 2026-11-03 23:26

**Ticket** (not filed as an entry): with the whole text deleted and a wait of more than 800 ms before the paste, the pause applies the empty text (every object deleted, «Applied») and the paste recreates the objects under new ids. Measured in run 1 of the probe (`probe-all-run1-settled.log`). The D-5 clip holds only a cut, not a select-and-delete.

## 2026-11-04 — feat(codegen): Text tab language service checked in the app, step B1 closure (P-2026-11-04-0046)
**Prompt**: `claude_2026-11-04_0046_prompt_textual_b1_closure.md`, continuation of P-2026-11-04-0020 after the context ceiling (RC-51): cyan-600 for names and references, check:docs, keystroke check in the app on demoESM and sample-Library, docs hover, crops, RISC-V Briefs read-only, log and Status flips of 2350, 0020 and 0046.
**Files touched**: `frontend/src/codegen/textual/ui/textualMonaco.ts` (`87743a3ba`); this entry, the ticket below and the Status lines of three prompts (uncommitted, RC-17)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. tsc exit 0; vitest src/codegen/textual 402/402; build exit 0; probes on 3464 20/20 (demoESM), 19/19 (sample-Library), 9/9 (docprobe)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato by the lane (crops in ~/.jjodel-lanes/P-2026-11-04-0046/crops); the chat's GO pending
**Notes**: Keystrokes: clicks, typing, Cmd+Alt+[ ], F12, Shift+F12, Cmd+Z, hovers. Direct: project import, openTextualTab, docprobe import, createModelFromText, insertText. Folding widens the decorations lane 10 to 26 px (contentLeft 30 to 46). The JjScript editor opened in front of the tab, not beside: colours compared under the textual theme set by call, 19/19 spans equal. Briefs: 0 errors, refs resolve, hovers answer, analysis under 1 ms.
**Prompt document name**: 2026-11-04 00:46

## 2026-11-04 — ticket: the Text tab hover clips its last characters
**Ticket**: in the app the hover box of the Text tab is narrower than its content: `.monaco-hover` 189 px wide, scrollWidth 217, overflow hidden, so «ordered» reads «orde» (sample-Library, docprobe). The inline code spans take the global Bootstrap `code` rule (rgb(214, 51, 132), 0.875em, padding 0 4.55px). Not diagnosed (CLAUDE.md §5). Also measured, older than B1 (font since 7bd41e3cf): on a long line Monaco's offset-to-pixel point sits about 15 px right of the rendered glyph in headless Chromium.
**Priority**: medium
**Found in**: P-2026-11-04-0046
**Detail**: ~/.jjodel-lanes/P-2026-11-04-0046/crops/library-4-hover-reference.png

## 2026-11-04 — discovery(codegen): textual step B2, outline groups, unnamed labels, hover card (P-2026-11-04-0005, P-2026-11-04-0021)
**Prompt**: `claude_2026-11-04_0005_prompt_textual_b2_discovery.md`, full lane, read-only: outline group nodes, a label rule for unnamed objects, how far Monaco 0.52.2 allows a hover card that stays open; stopped at the context ceiling with the measurements done. `claude_2026-11-04_0021_prompt_textual_b2_report.md`, fast lane (RC-51): the report written from the handoff, no new measurement.
**Files touched**: `docs/discovery/discovery_2026-11-04_textual_b2_outline_hover.md`, `docs/discovery/harness/probe_2026-11-04_textual_b2_outline.test.ts`, `docs/discovery/harness/probe_2026-11-04_textual_b2_app/` (11 files) (`10133057a`); this entry and the Status lines of both prompts (closure commit).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Docs only; probes ran on a vite server on 3470 (stopped). Group node = item holding a keyword token; label rule C4' gives `Transition coin`, 0 changes on reprint over the corpus. Monaco's own hover cannot stay open (`_sticky = false` is a constant); trusted command links plus a pinned content-widget card work. Shift+F12 with one use shows nothing. R-TXT-36..39 are on trunk only. Crops in `~/.jjodel-lanes/P-2026-11-04-0005/`.
**Prompt document name**: 2026-11-04 00:05
## 2026-11-04 — feat(codegen): Text tab outline, breadcrumb, hover links, hover box and folding margin, step B2 (P-2026-11-04-0125, P-2026-11-04-0146)
**Prompt**: `claude_2026-11-04_0125_prompt_textual_b2_outline.md`, full lane: outline, breadcrumb, trusted hover links, hover box, folding margin; stopped at the context ceiling after item (4). `claude_2026-11-04_0146_prompt_textual_b2_closure.md`, full lane (RC-51): items (5) and (6), gates, in-app check by keystrokes, crops.
**Files touched**: `frontend/src/codegen/textual/languageService.ts`, `__tests__/outline.test.ts` (`fc5e898b6`); `ui/TextualTab.tsx`, `ui/TextualTab.scss` (`f7b094494`); `ui/textualMonaco.ts` (`e482a33d7`); `ui/TextualTab.scss` (`8cfd25833`); `ui/TextualTab.tsx`, `__tests__/textualTab.test.ts` (`e64b95c02`); this entry and both Status lines (uncommitted, RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: The hover clip came from skeleton.scss `.monaco-scrollable-element { left: 30px !important }`, undone inside the tab. The same rules paint text at 30 px, so the text never started later with folding; Monaco laid it at 46, chevrons hid under it and first-char clicks hit the gutter. Fix: no glyph margin, decorations 14, contentLeft 30. Gates green bar a timing test in tolerant.test.ts, red once under full-suite load, green alone. App: 24/25 PASS (the FAIL a wrong probe assertion). GO pending.
**Prompt document name**: 2026-11-04 01:25

## 2026-11-04 — merge: textual-b-navigation into alfonso-frontend-jjtl (P-2026-11-04-0250)
**Prompt**: `claude_2026-11-04_0250_prompt_merge_textual-b-navigation.md`, a direct merge by `lane-run merge --direct`, no session: `textual-b-navigation` at `689fd6db2` into `alfonso-frontend-jjtl`, merge base `2daef6982`, 29 commits on the branch (step B of the textual IDE plan: language service, Monaco providers, EBNF highlighting, theme, outline, breadcrumb, hover links; R-TXT-38, R-TXT-39). Alfonso's GO on the crops 2026-11-04 02:49.
**Files touched**: merge `2f35ce2c5`, the branch side (`frontend/src/codegen/textual/languageService.ts`, `metamodel.ts`, `textDiff.ts`, `ui/textualMonaco.ts`, `ui/TextualTab.tsx`, `ui/TextualTab.scss`, their tests, two discovery reports, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2f35ce2c5` in the worker: typecheck 0 errors; typecheck:scripts exit 0; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 13568 tests, 3 red at import (baseline), 1 failed: the timing bound of `tolerant.test.ts` (viii), ratio 13.3 against 12 under load 36 (#205); run alone on the merge commit at load 16: 53/53.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — crops of P-2026-11-04-0046 and P-2026-11-04-0146 checked by the chat (RC-23) and by Alfonso («Go», 02:49).
**Notes**: Blocked only by the flaky timing test (#205), resolved with the evidence above (`resolved.txt`); the bound is replaced by an operation count in a lane of its own. Rollback tag `pre-textual-b-navigation` on `65056eb51` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0250/result.json`.
**Prompt document name**: 2026-11-04 02:50

## 2026-11-04 — test(codegen): linearity of name resolution counted, not timed, #205 (P-2026-11-04-0302)
**Prompt**: `claude_2026-11-04_0302_prompt_textual_fix_205.md`: replace the wall-clock ratio of `tolerant.test.ts` (viii), 13.3 to 14.2 against 12 under load, with a load-independent count of the printer's name lookups (at most c·n, below the quadratic figure), a one-second time guard kept; the same for the parser's test (v); red first on the old quadratic code. Closes #205.
**Files touched**: `43057efc5`: `frontend/src/codegen/textual/printer.ts` (test-only `printerNameLookups`), `frontend/src/codegen/textual/parser.ts` (test-only `parserNameLookups`), `frontend/src/codegen/textual/__tests__/tolerant.test.ts`; this inbox and the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-11-03 22:20
**Causa**: (g)
**Regressions**: no. Gates on the tree of `43057efc5`: `npx tsc --noEmit` exit 0; textual suite 12 files, 428 tests green; full vitest 13568 passed, 3 files red at import (baseline); `npm run build` exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Count: objects examined per reference (by name; parser also a path's head). Linear: printer 267 at 1,001, 1,600 at 6,001; parser 3,200 at 12,001. c is the first count per object plus 1% (n counts the library root, the references do not). Red first: the scans of `c79d05b4c~` and `231113e79` put back with the same counter, then restored: printer 9,601,600 vs bound 1,618,290, parser 38,403,200 vs 6,460,498. Not guarded: the printer's contained-list copy. 50 ms budget tests kept.
**Prompt document name**: 2026-11-04 03:02

## 2026-11-04 — merge: textual-fix-205 into alfonso-frontend-jjtl (P-2026-11-04-0328)
**Prompt**: `claude_2026-11-04_0328_prompt_merge_textual-fix-205.md`, a direct merge by `lane-run merge --direct`, no session: `textual-fix-205` at `91f61f7d7` into `alfonso-frontend-jjtl`, merge base `1f58fece6`, 3 commits on the branch side.
**Files touched**: merge `7953ec4f8`: 5 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-04_0302_prompt_textual_fix_205.md`, `frontend/src/codegen/textual/__tests__/tolerant.test.ts`, `frontend/src/codegen/textual/parser.ts`, `frontend/src/codegen/textual/printer.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7953ec4f8` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13575 tests in 511 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: merge of textual-fix-205, gates green on the merge; a test change, nothing on screen
**Notes**: Rollback tag `pre-textual-fix-205` on `a5dee44d4` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0328/result.json`.
**Prompt document name**: 2026-11-04 03:28

## 2026-11-04 — discovery(codegen): textual step C, expression notation, T4b form, T5 styles (P-2026-11-04-0303, P-2026-11-04-0330)
**Prompt**: `claude_2026-11-04_0303_prompt_textual_c_discovery.md` (probe run, stopped at the context soft ceiling) continued by `claude_2026-11-04_0330_prompt_textual_c_report.md` from its handoff: write the step C report, one design per part, lanes, decisions.
**Files touched**: `docs/discovery/harness/probe_2026-11-04_textual_c_notation.test.ts` and `.out.txt` (`d5e38cb8b`); `docs/discovery/discovery_2026-11-04_textual_step_c.md` (`8906621a1`); Status of the two prompts and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Flat n-ary keeps 312/312 SyncRTL roots, left-fold 269. Paren node, not trivia. Amends R-TXT-16 (3) and, if D3 (a), R-TXT-27 (2). Indentation: a truncation applies deletions (arb3 178/281). Pascal fails on a newline in a string. Section 1d unmeasured (needles not found), moved to C1c. Decisions D1-D6 in the report.
**Prompt document name**: 2026-11-04 03:30

## 2026-11-04 — feat(codegen): Pascal/Ada style and the style picker, textual step C lane C3a (P-2026-11-04-0345, P-2026-11-04-0412)
**Prompt**: `claude_2026-11-04_0345_prompt_textual_c3a_pascal.md` and its continuation `claude_2026-11-04_0412_prompt_textual_c3a_cont.md` (RC-51): Pascal/Ada in the style catalog, the style named in the syntax record, a newline in a string as `'a'#10'b'` (R-TXT-40 D4), byte-identical round trips per style on the corpus, a style switch that leaves the model unchanged, a style picker in the Text tab writing the record in one undo step (first caller of `writeTextualSyntax`); the step C probe reads the prototype folder from `PROTO`.
**Files touched**: `style.ts`, `annotations.ts`, `syntaxRecord.ts`, `printer.ts`, `parser.ts`, `concreteGrammar.ts`, `ui/TextualTab.tsx`, `ui/openTextualTab.tsx`, their tests (0f6f7fa8b, b4e6eae69, 0349387ef, 794041be3, 076b38d18, c6d22de51, 7852e462b); `docs/discovery/harness/probe_2026-11-04_textual_c3a_app/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on 7852e462b: tsc 0; vitest 13689 passed, 3 red at import (baseline), the timing test of tolerant.test.ts over its ratio once under load (fixed on the trunk by #205, not yet on this branch); build 0; check:codegen-lazy ALL GREEN; check:docs 5/5 (chat).
**Out-of-scope changes**: no (eight files, above five: all named by the prompts, RC-11)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane probe on 3471 (demoESM 17/17, library 18/18): switch to Pascal, text and EBNF follow, an edit applies, one Undo, switch back byte for byte; a typed line break stored and shown as `'…'#10'x'`; crops `~/.jjodel-lanes/P-2026-11-04-0345/c3a-*.png` checked by the chat (RC-23); Alfonso's GO on the picker pending for the merge.
**Notes**: Mutation benches 2/2, 6/6, 8/8, 11/11 and 8/9 killed (the survivor leaves an unread `base`). Open: switching back to C-like leaves `{"v":1}` stored instead of removing the key (prints the same); lanes C1a..C1d wait for Alfonso's D1 and D3. Docs written by the chat: the lane stopped at the ceiling. Two defects fixed on the way, both new to the Pascal style: a keyword-less feature printed `:=` (concreteGrammar.ts:331,336); an unnamed object with an empty body read as named `begin` (parser.ts).
**Prompt document name**: 2026-11-04 03:45

## 2026-11-04 — merge: textual-c-notation takes alfonso-frontend-jjtl (P-2026-11-04-0653)
**Prompt**: `claude_2026-11-04_0653_prompt_textual-c-notation_take_trunk.md`, full lane (RC-14): the trunk `alfonso-frontend-jjtl` at `26a0b21fa` into `textual-c-notation` at `ba24f6dcb`, one `--no-ff` merge commit, merge base `1f58fece6`; 20 trunk commits, 17 branch commits.
**Files touched**: merge `df01f813c`: union of `docs/log-inbox/codegen.md` (the one conflict), the rest auto-merged from the trunk side; this commit: this entry and the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `df01f813c`: typecheck exit 0, 0 `error TS`; typecheck:scripts exit 0; vitest 13696 passed in 513 files, 3 red at import (baseline), expectation 13568 + 7 trunk + 121 branch; hooks 967; build exit 0; check:docs 5/5; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: the trunk side adds only test counters (#205) to the textual code, the branch crops of P-2026-11-04-0345 stand (Alfonso's GO 06:52); no new visual check.
**Notes**: Union: trunk entries (#205, textual-fix-205 merge) then branch entries (step C discovery, C3a), +26 lines against each parent; probes R-TXT-40..43 once, R-TXT-44 none, 8 headings once. Step 5: parser.ts and printer.ts coherent, counters declared once. Trunk count 13575 had `irCollapsedRender.test.ts` red once (Chromium hook timeout under parallel typecheck load), green on the merge run.
**Prompt document name**: 2026-11-04 06:53

## 2026-11-04 — merge: textual-c-notation into alfonso-frontend-jjtl (P-2026-11-04-0712)
**Prompt**: `claude_2026-11-04_0712_prompt_merge_textual-c-notation.md`, a direct merge by `lane-run merge --direct`, no session: `textual-c-notation` at `7a0ae847b` into `alfonso-frontend-jjtl`, merge base `26a0b21fa` (the branch had taken the trunk in P-2026-11-04-0653, RC-14). Step C lane C3a: Pascal/Ada style, style in the record, newline in strings, style picker; the step C discovery report. Alfonso's GO on the picker crops 06:52.
**Files touched**: merge `4325ec678`, the branch side (`frontend/src/codegen/textual/style.ts`, `annotations.ts`, `syntaxRecord.ts`, `concreteGrammar.ts`, `parser.ts`, `printer.ts`, `ui/TextualTab.tsx`, `ui/openTextualTab.tsx`, their tests, `docs/discovery/discovery_2026-11-04_textual_step_c.md`, harness probes, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `4325ec678` in the worker: typecheck 0 errors; typecheck:scripts exit 0; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0; vitest red on one harness test only, `scripts/hooks/__tests__/laneRun.test.ts` (port 54310 in use, environmental); run alone on the merge commit twice: 145/145 both times.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — crops c3a-* of P-2026-11-04-0345 checked by the chat (RC-23) and by Alfonso («go», 06:52).
**Notes**: Blocked only by the environmental port clash, resolved with the evidence above (`resolved.txt`). Rollback tag `pre-textual-c-notation` on `26a0b21fa` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-0712/result.json`.
**Prompt document name**: 2026-11-04 07:12

## 2026-11-04 — feat(codegen): operators in the grammar and the style check, textual step C lane C1a (P-2026-11-04-0732, P-2026-11-04-0910)
**Prompt**: `claude_2026-11-04_0732_prompt_textual_c1a_operators.md` and its continuation `claude_2026-11-04_0910_prompt_textual_c1a_cont.md` (RC-51): the operator annotation applied to the grammar per R-TXT-41 (fixity read off the class's features, n-ary flat chains, the call word), the `expr` grammar node with its EBNF, five style rules, a BOOL expression corpus in both styles, the Briefs under `PROTO`.
**Files touched**: `annotations.ts`, `concreteGrammar.ts`, `styleCheck.ts`, `parser.ts` (two approved lines), `oracle.ts`, `__tests__/boolCorpus.ts` and tests (d9a893f4b, 7f64ce6a6, 54ab3aa09, 18e6c8454, d6cee1805).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on d6cee1805: tsc 0; vitest 13714 passed, 3 red at import (baseline); build 0; check:docs 5/5; check:codegen-lazy ALL GREEN (off, on).
**Out-of-scope changes**: no (parser.ts two lines and oracle.ts, approved by the chat)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — grammar and check only; the EBNF of an expression metamodel is shown with the crops of C1b, when the text prints expressions.
**Notes**: Tests red first (6, 3, 8). Nearley oracle: one parse per BOOL sample in both styles. Briefs 71/71 under PROTO. Mutation bench 16/16 killed. New rules operator-fixity, operator-symbols, operator-tokens, operator-follow, call-words. Open for C1b: operators of equal precedence as one level; a symbol both prefix and infix (unary minus). Open for C1d: the Pascal terminator after a primary. Docs written by the chat: the lane stopped at the ceiling.
**Prompt document name**: 2026-11-04 07:32

## 2026-11-04 — test(codegen): C1b closure, call form under Pascal, "+" in the oracle samples, in-app check (P-2026-11-04-1045)
**Prompt**: `claude_2026-11-04_1045_prompt_textual_c1b_closure.md` (RC-51, continues `claude_2026-11-04_1005_prompt_textual_c1b_cont.md` and `claude_2026-11-04_0938_prompt_textual_c1b_parser_printer.md`): the chat's answers to the 1005 handoff (an and/or under two operands never loses the object; `+` samples in the generator), the three probe fixes, one probe run with crops, the gates, the log entry.
**Files touched**: `__tests__/expressions.test.ts`, `__tests__/oracle.ts` (fdc328a72, 8c376d5f0).
**Outcome**: ✅ completed
**Corregge**: 2026-11-04 10:05
**Causa**: (c)
**Regressions**: unknown. Gates on 8c376d5f0: tsc 0; vitest 13740 passed, 2 skipped, 3 red at import (baseline); build 0; check:codegen-lazy ALL GREEN (off, on). The failing edit below is a path C1b opens; whether the executor fails the same way outside expressions was not measured.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: fallito (dettaglio) — Text tab is the model's print (`a & (b | c)`, `-x`), EBNF shows `Expr_` with its operators and call forms, one Undo restores text and model; the edit ` | a` leaves a Use without its var (ticket below).
**Notes**: The 1005 premise for the call form did not reproduce: the grammar defaults the word (concreteGrammar.ts:260), Pascal prints `And()`, `Or(is_sw;)` and reads them back to the same model; tests pin it, killed by dropping the default (2 of 23). The generator gap was a form counter shared by every occurrence: the first expression of a sample now takes its round's form, red first. The EBNF crop kept the donation banner (it came back after a close); `c1b-ebnf-top.png` is cut from the same PNG.
**Prompt document name**: 2026-11-04 10:45

## 2026-11-04 — ticket: a Text tab edit adding an operand runs a set that cannot resolve the new Use
**Ticket**: In the Text tab, typing ` | a` into `a & (b | c)` runs two JjScript lines: `create instance of Use "Use_1" in Or_1.ops` (success) and `set Use_1.var = a`, which fails with "Cannot resolve metaclass for instance 'Use_1'" (jjscript/executor/commands/instance.ts:1031-1039: the resolved object has no `instanceof`). The bar reads "Applied, 1 line failed", the tab keeps `a & (b | c | a)`, the model prints `a & (b | c |)`. Use has no name feature. Measured by the 1045 probe, one run.
**Priority**: medium
**Found in**: P-2026-11-04-1045

## 2026-11-04 — feat(codegen): C1c, slot matching of expression objects, handle names, slot ordering (P-2026-11-04-1115, P-2026-11-04-1158, P-2026-11-04-1241)
**Prompt**: `claude_2026-11-04_1241_prompt_textual_c1c_closure.md` (RC-51, continues `claude_2026-11-04_1158_prompt_textual_c1c_cont.md` and `claude_2026-11-04_1115_prompt_textual_c1c_diff.md`, both stopped at the context ceiling): the nestedDiff bench, created handles that avoid every instance name, line order around a create into a slot, slot matching of nameless expression objects; closure: mutation bench, before and after table, gates, one probe run, log entry.
**Files touched**: `__tests__/nestedDiff.test.ts` (5bb033df0, 4ffbc1ba7, 725f30249), `textDiff.ts` (157d91a45, d43e420c4), `textMatch.ts` (4ffbc1ba7), `ui/TextualTab.tsx` (157d91a45), all under `frontend/src/codegen/textual/`.
**Outcome**: ✅ completed
**Corregge**: 2026-11-04 10:45
**Causa**: (c)
**Regressions**: no. Gates on 725f30249: tsc 0; vitest 13817 passed, 2 skipped, 3 red at import (baseline, `window is not defined`); build 0; check:docs 5/5; check:codegen-lazy ALL GREEN (off, on). Typed ops of the 13 bench edits unchanged against the 1115 measurement.
**Out-of-scope changes**: yes — `ui/TextualTab.tsx` (instanceNames for the diff), approved by the chat in the 1158 prompt.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe on 725f30249, 7 rows ALL PASS: add, remove, reorder, operator, wrap, add first applied whole with one Undo; wrap whole refused with its reason, model untouched. Crops `c1c-0-base.png` .. `c1c-7-add-first.png`, light theme, scale 1, no banner. GO of Alfonso pending.
**Notes**: Bench on 2b: drop equal subtrees (13 red), position pass (14), expr exclusions in step 2 (15) die; options[0] without the same-index preference survived, killed by (4b) in 725f30249 (2 red). Table `before-after.md` in the lane folder: uncertain refusals 5 to 0 pasted, 13 to 0 re-imported, every re-import plans as typed but unwrap (inner Not kept, one op fewer). 157d91a45 closes the 1045 ticket (Use_1 reused).
**Prompt document name**: 2026-11-04 12:41

**Ticket** (executor, medium, found in P-2026-11-04-1158): two gaps of the JjScript executor that the diff works around; C1c does not change the executor. (1) `applyCollectionUpdate` (jjscript/executor/commands/instance.ts:1314) reads the committed values only, so a list update right after `create ... in X.ops` drops the new object; the diff orders the lines and refuses another update of that slot until a line addresses the created object. (2) A removed single-valued value (`set r3.when -= And_3` succeeds) is not seen by a create into that slot in the same run, which still counts it full; so wrapping a whole single-valued expression (`-(a & (b | c))`) stays refused with "wrapping the value of r3.when in a new object is not applied yet" until this lands.

## 2026-11-04 — feat(codegen): C1d, the port line, item keyword, call layout, optional head name (P-2026-11-04-1312, P-2026-11-04-1355, P-2026-11-04-1447)
**Prompt**: `claude_2026-11-04_1447_prompt_textual_c1d_closure.md` (RC-51, continues `claude_2026-11-04_1355_prompt_textual_c1d_cont.md`, stopped at the context ceiling, which continued `claude_2026-11-04_1312_prompt_textual_c1d_port_line.md`): per-item and punctuation keywords, inline containment, call layout, D3 optional head name, Pascal terminator, Briefs record, mutation bench; closure: app check of the port line in C-like and Pascal/Ada, EBNF mode, outline, crops.
**Files touched**: `annotations.ts`, `concreteGrammar.ts`, `parser.ts`, `printer.ts`, `styleCheck.ts`, `__tests__/{annotations,portLine,expressions,styleCheck}.test.ts`, `__tests__/portCorpus.ts` (9d5d474be, ac7a5b4b7, e80eaa872, cc7235435), all under `frontend/src/codegen/textual/`; 1447 no code.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no. Gates on cc7235435 (P-2026-11-04-1355): tsc 0; vitest 13842 passed, 3 red at import (baseline); build 0; check:docs 0; check:codegen-lazy PASS off and on. Bench 27 mutations, 0 survivors.
**Out-of-scope changes**: no — 10 files, above five, all inside the 1312 DOVE (the four modules, the tests, the Briefs record).
**Layer Impact Report**: not-required
**Smoke visivo**: fallito (dettaglio) — probe on cc7235435, app on 3471: width, rename, add a port line (C-like) and width (Pascal) applied whole, one Undo each; removing a port name gives `No change` in both styles, model keeps `result`; nameless Port and Ref get app names (Port_2, Ref_2). EBNF shows the four shapes. Crops `c1d-*.png`, `stuck-c1d-*.png` in the lane folder, light theme, scale 1, no banner.
**Notes**: Decisions of 1355, unattended: D3 stricter than the 1312 handoff, an optional head name refused also when every part after it is optional; Briefs record with `roots: 'uncontained'` and Port.driver keyword `driver` (`=` is the Eq symbol); Pascal: a block element whose rule is an expression takes the terminator after. Open point: the per-item keyword gives one `input` group per port in the outline (`c1d-5-outline.png`), fix in languageService.ts `textOutline`. Probe: lane folder of 1447.
**Prompt document name**: 2026-11-04 14:47

**Ticket** (textual tab, high, found in P-2026-11-04-1447): (1) a nameless Port or Ref, applied from the text, gets an instance name from the app (Port_2, Ref_2, CLAUDE.md model §3.12); the tab says Applied and keeps the nameless text, the model's print differs, and every later edit is refused whole with `an update of Conj_3.ops after an object is created in it is not applied yet` (run2-stuck.log, stuck-c1d-*.png); writing the model's print back asks to confirm 3 Ref matches (`c1d-0-base-clike.png`). (2) Removing the name of a port (`output result :` to `output :`) settles `No change`, no line runs, the model keeps the name: neither applied nor refused with a reason (`c1d-4-unname.png`, `c1d-8-unname-pascal.png`). Not half applied, so no code change in this lane.

## 2026-11-04 — merge: textual-c1-operators into alfonso-frontend-jjtl (P-2026-11-04-1542)

**Prompt**: `claude_2026-11-04_1542_prompt_merge_textual-c1-operators.md`, a direct merge by `lane-run merge --direct`, no session: `textual-c1-operators` at `dcc4231e4` into `alfonso-frontend-jjtl`, merge base `2809ad8ca`. Step C lane C1 (a to d): operators in the grammar, parser and printer of expressions, slot matching of nameless expression objects, the port line. Alfonso's GO on the crops 15:41.
**Files touched**: merge `fe6eed263`, the branch side (`frontend/src/codegen/textual/annotations.ts`, `concreteGrammar.ts`, `styleCheck.ts`, `parser.ts`, `printer.ts`, `textMatch.ts`, `textDiff.ts`, `oracle.ts`, `ui/TextualTab.tsx`, their tests and corpora, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `fe6eed263` in the worker: typecheck 0 errors; typecheck:scripts exit 0; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 13902 tests, 3 red at import (baseline), one failure in `scripts/hooks/__tests__/laneBoard.test.ts` (board import listens, environmental under load); run alone on the merge commit twice: 95/95 both times.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — crops c1b-*, c1c-*, c1d-* checked by the chat (RC-23) and by Alfonso («GO», 15:41); the two app findings of P-2026-11-04-1447 stay ticketed.
**Notes**: Blocked only by the environmental board test, resolved with the evidence above. Rollback tag `pre-textual-c1-operators` on `d4d2495f0` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-1542/result.json`.
**Prompt document name**: 2026-11-04 15:42

## 2026-11-04 — fix(codegen): C1e, names the app gives, removing a name, outline groups (P-2026-11-04-1605, P-2026-11-04-1627)
**Prompt**: `claude_2026-11-04_1627_prompt_textual_c1e_closure.md` (RC-51, continues `claude_2026-11-04_1605_prompt_textual_c1e_names_outline.md`, stopped at the context ceiling): R-TXT-44 (1)-(3), the nameless object the app names, removing a name from the text, one outline group per per-item keyword feature; closure: gates and docs.
**Files touched**: `textDiff.ts`, `languageService.ts`, `ui/TextualTab.tsx`, `__tests__/outline.test.ts`, `__tests__/textualEdit.test.ts`, all under `frontend/src/codegen/textual/` (5fc137c02, f74e401c0, c7f6249be); 1627 no code.
**Outcome**: ✅ completed
**Corregge**: 2026-11-04 14:47
**Causa**: (c)
**Regressions**: no. Gates on c7f6249be (P-2026-11-04-1627): tsc 0; vitest 13909 passed, 2 skipped, 3 red at import (baseline); build 0; check:docs 5/5; check:codegen-lazy ALL GREEN (off, on).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app check of P-2026-11-04-1605 (`app.mjs`, `.agent-logs/app1-20261104-160904.log`): 13 checks ALL PASS, first application with the reprint, width, add line, unname in C-like and Pascal/Ada, outline groups input 2 / output 1, one Undo each, tab text equal to the model print. Crops `c1e-*.png` in the 1605 lane folder.
**Notes**: Measure (`names-measure.md`): `set X.name = ""` stores "" but the core reads initialName back, so R-TXT-44 (1) runs its fallback: `TextEditPlan.named` lists the handles the app names, the tab reprints once, status `Applied · the app named N object(s) the text leaves nameless`. Outline: consecutive item groups of one feature and keyword merge. One surviving mutant, the refusal guard of `named`, dropped as inert. Benches in the commit bodies; handoff in the 1605 lane folder.
**Prompt document name**: 2026-11-04 16:27

**Ticket** (textual tab, medium, found in P-2026-11-04-1605): removing a name whose initialName is that same name (an `output result` created from the text with it) brings the name back in the print, because the core's identity read falls back to initialName for an empty slot (`LModelElement.tsx:7786-7800`); only the status line says why. Keeping it nameless needs a core change or a textual reader that reads an explicit "" slot as nameless; neither done here, decision owed to Alfonso.

## 2026-11-04 — merge: textual-c1e-names into alfonso-frontend-jjtl (P-2026-11-04-2113)

**Prompt**: `claude_2026-11-04_2113_prompt_merge_textual-c1e-names.md`, a direct merge by `lane-run merge --direct`, no session: `textual-c1e-names` at `77a4dd682` into `alfonso-frontend-jjtl`, merge base `e38500ec9`. Step C lane C1e (R-TXT-44): the tab reprints the names the app gives to nameless objects, removing a name applies, one outline group per per-item keyword feature.
**Files touched**: merge `ddbf72645`, the branch side (`frontend/src/codegen/textual/textDiff.ts`, `languageService.ts`, `ui/TextualTab.tsx`, `__tests__/outline.test.ts`, `__tests__/textualEdit.test.ts`, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ddbf72645` in the worker: typecheck 0 errors; typecheck:scripts exit 0; vitest 13918 tests, 3 red at import (baseline), hooks 967; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app check of P-2026-11-04-1605, 13 checks ALL PASS, crops c1e-* checked by the chat (RC-23).
**Notes**: Rollback tag `pre-textual-c1e-names` on `d6fc11ebf` (RC-31). Union: none. The removed-name reprint is closed by the core lane of R-TXT-45 and R-TXT-46. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-2113/result.json`.
**Prompt document name**: 2026-11-04 21:13

## 2026-11-04 — merge: core-nameless-identity takes alfonso-frontend-jjtl (P-2026-11-04-2128)

**Prompt**: `claude_2026-11-04_2128_prompt_core-nameless-identity_take_trunk.md`, a direct merge by `lane-run merge --trunk-into`, no session: `alfonso-frontend-jjtl` at `addb481f0` (the C1e merge and R-TXT-46) into `core-nameless-identity`, merge base `604273359`, so the core lane of R-TXT-45 runs on C1e (R-TXT-46 D7).
**Files touched**: merge `fa8f17a5a`, the trunk side (`frontend/src/codegen/textual/`, `docs/decisions.md`, `docs/log-inbox/codegen.md`, prompts); the branch side is docs only.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `fa8f17a5a`: typecheck 0 errors; typecheck:scripts, build, check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 48 failures in 16 files under load average 200, all timeouts or timing bounds; the 16 files rerun alone: 704/704.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — no code on the branch side.
**Notes**: Resolved with the rerun evidence above. Worker and gates: `~/.jjodel-lanes/P-2026-11-04-2128/result.json`.
**Prompt document name**: 2026-11-04 21:28

## 2026-11-04 — discovery: core nameless identity, variant B and its Layer Impact Report (P-2026-11-04-1632)
**Prompt**: `claude_2026-11-04_1632_prompt_core_nameless_discovery.md`: discovery for R-TXT-45, an object can be nameless in the model; the core's identity read, the consumers of the empty name, the Layer Impact Report of CLAUDE.md §3.2, the decisions D1-D10 for Alfonso.
**Files touched**: `docs/discovery/discovery_2026-11-04_core_nameless_identity.md` (6cd4a8b27); no code.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Stopped at the context ceiling (RC-51) right after the report was committed; the log entry was left to this continuation. D1-D10 answered by R-TXT-46, each as recommended.
**Prompt document name**: 2026-11-04 16:32

## 2026-11-04 — fix(model): an object can be nameless, variant B (P-2026-11-04-2206, P-2026-11-04-2255)
**Prompt**: `claude_2026-11-04_2206_prompt_core_nameless_impl.md` (R-TXT-45, R-TXT-46 D1-D10), stopped at the context ceiling after items 1-8, continued by `claude_2026-11-04_2255_prompt_core_nameless_cont.md`: the textual create path, smoke run 2, gates, docs.
**Files touched**: 2206: `LModelElement.tsx`, `nameUniqueness.ts`, `ConformanceValidator.ts`, `jjomTransformers.ts`, `IRFormField.tsx`, `TextualTab.tsx` and their tests (fa9d17491, 412df810e, 2b7a62fe0, 9ec6c4320, 0a8ed2db2, 8bd59bf94); 2255: `codegen/textual/textDiff.ts`, `__tests__/textualEdit.test.ts` (c317c90ef, b091ed0fa).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on b091ed0fa: typecheck 0; vitest 516 files, 13942 passed, 2 skipped, 3 red at import (baseline); build 0, chunk warning only; check:docs pass; check:codegen-lazy ALL GREEN (off, on).
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato — smoke run 2 (`.agent-logs/probe2g-20261104-230543.log`): two nameless siblings created from the text hold `[""]` and print as typed; name removal by keystroke, Undo, Redo; peer to a nameless port, 0 broken on v2-flow; JjEL `self.name == ''`; controls `[]` and D9. Crops in the 2255 lane folder.
**Notes**: Report §5 holds the LIR, kept as the 2206 final message says. The create clears its handle name in the same lines; created objects leave `named`, measured: a layout-only difference reprinted with a false status. Open for Alfonso: a removal still lists `named`, same false status; a reference to a nameless object shows `—` on v2-flow. Classic canvas shut down in this build (`EditorSwitch.tsx:123-129`).
**Prompt document name**: 2026-11-04 22:06

## 2026-11-04 — merge: core-nameless-identity into alfonso-frontend-jjtl (P-2026-11-04-2321)

**Prompt**: `claude_2026-11-04_2321_prompt_merge_core-nameless-identity.md`, a direct merge by `lane-run merge --direct`, no session: `core-nameless-identity` at `945c74aeb` into `alfonso-frontend-jjtl`, merge base `addb481f0`. R-TXT-45 and R-TXT-46: a written empty identity slot reads nameless (variant B), uniqueness and CHECK 12 accept it, v2-flow references to it resolve, the Text tab keeps objects created without a name nameless. Alfonso's «go» 23:06.
**Files touched**: merge `c7cd7e479`, the branch side (`frontend/src/model/logicWrapper/LModelElement.tsx`, `nameUniqueness.ts`, `ConformanceValidator.ts`, `editor-v2` `jjomTransformers.ts` and `IRFormField.tsx`, `codegen/textual/ui/TextualTab.tsx`, `codegen/textual/textDiff.ts`, their tests, the discovery report, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c7cd7e479` in the worker: typecheck 0 errors; typecheck:scripts exit 0; vitest 14062 tests in 527 files, 3 red at import (baseline), hooks 967; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: produced (discovery report §5), held: L-layer and JjOM reads, one write through the existing set_name path.
**Smoke visivo**: passato — smoke run 2 of P-2026-11-04-2255, 8 checks pass; crops s8a, s8b, sD4 checked by the chat (RC-23). Classic canvas not smoked: shut down in this build.
**Notes**: Rollback tag `pre-core-nameless-identity` on `f001f2fbd` (RC-31). Union: none. Open, cosmetic: a false «the app named» after removing a name when the text differs from the print only in layout; a v2-flow reference to a nameless target shows —. Worker: `~/.jjodel-lanes/P-2026-11-04-2321/result.json`.
**Prompt document name**: 2026-11-04 23:21

## 2026-11-05 — fix(codegen): C2c and C2a, the false «named», the empty record, the Syntax form module (P-2026-11-05-0010, P-2026-11-05-0036)
**Prompt**: `claude_2026-11-05_0010_prompt_textual_c2c_c2a.md`: (1) C2c, the app names only what the model names; (2) C2a, `{"v":1}` is no record in `syntaxPatch`; (3) the pure module `syntaxForm.ts` (report `discovery_2026-11-05_textual_c2_syntax_form.md` §2.2, D1-D3, D7, D9). Stopped at the context ceiling mid item 3, continued by `claude_2026-11-05_0036_prompt_textual_c2a_cont.md` (RC-51) for items 3 to 6.
**Files touched**: 90720f022: `frontend/src/codegen/textual/ui/TextualTab.tsx`, `textDiff.ts` (comment), `__tests__/textualEdit.test.ts`; 6c1a22241: `syntaxRecord.ts`, `__tests__/syntaxRecord.test.ts`; cdeed0c35: `syntaxForm.ts` (new), `__tests__/syntaxForm.test.ts` (new). Docs: this entry, the two Status lines.
**Outcome**: ✅ completed
**Corregge**: 2026-11-04 22:55
**Causa**: (c)
**Regressions**: no. Gates on cdeed0c35: typecheck 0; vitest 528 files, 14091 passed, 2 skipped, 3 red at import (baseline); build 0; check:docs 0; check:codegen-lazy ALL GREEN (off, on).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (app probe, 4 checks, `~/.jjodel-lanes/P-2026-11-05-0036/probe.out.txt`): a name removed by keystroke on a typed text ending in a newline reads «Applied», no «named» sentence; one Undo restores. Crops `c2c-1-typed.png`, `c2c-2-name-removed.png` await the chat's check (RC-23).
**Notes**: syntaxForm bench 11/11 killed; c2c 3/3, c2a 1/1 (commit bodies). The loose «two faults at one field» test is replaced by a probe case on the library corpus, plus «one message at two fields» for the key's fields mutant, which survived first. Preview at 1,000 objects, median of 15: readDraft 0.20 ms, draftPreview 5.4 ms. The probe's 2255 keys miss the 3.1.1 What's new modal: `jjodel_welcome_3_1_1_seen` added.
**Prompt document name**: 2026-11-05 00:10

## 2026-11-05 — ticket: a name-keyword collision is located only at the feature's keyword in the Syntax form
**Ticket**: `checkStyle` distinct-features lists only real features after the colon (styleCheck.ts:103), so Library's name keyword "books" colliding with the containment keyword "books" gives «starts 2 features: Library.books», and `syntaxForm.ts` `locate` puts the fault only at the keyword of books; the name keyword field of Library carries no fault. Fix in `locate` (or in the message) before C2b shows the fault at its fields.
**Priority**: low
**Found in**: P-2026-11-05-0036
**Detail**: ~/.jjodel-lanes/P-2026-11-05-0010/probe/form.out.txt

## 2026-11-05 — merge: textual-c2-syntax-form into alfonso-frontend-jjtl (P-2026-11-05-0103)

**Prompt**: `claude_2026-11-05_0103_prompt_merge_textual-c2-syntax-form.md`, a direct merge by `lane-run merge --direct`, no session: `textual-c2-syntax-form` at `793b170df` into `alfonso-frontend-jjtl`, merge base `c09e8f22f`. Step C: the C2 discovery report, C2c (the app named only what the model names), C2a (the empty syntax record is no record; `syntaxForm.ts`, the pure module of the Syntax form, no UI yet). Unattended run (R-TXT-47 provisional).
**Files touched**: merge `a0817b92e`, the branch side (`frontend/src/codegen/textual/textDiff.ts`, `ui/TextualTab.tsx`, `syntaxRecord.ts`, `syntaxForm.ts`, their tests, the discovery report, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `a0817b92e` in the worker: typecheck 0 errors; typecheck:scripts exit 0; vitest 14093 tests in 528 files, 3 red at import (baseline), hooks 967; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe of P-2026-11-05-0036, 4 checks; crops c2c-1, c2c-2 checked by the chat (RC-23).
**Notes**: Rollback tag `pre-textual-c2-syntax-form` on `6a0a5fdfd` (RC-31). Union: none. Worker: `~/.jjodel-lanes/P-2026-11-05-0103/result.json`.
**Prompt document name**: 2026-11-05 01:03

## 2026-11-05 — feat(codegen): C2b, the Syntax mode of the Text tab and its form (P-2026-11-05-0118, P-2026-11-05-0145)
**Prompt**: `claude_2026-11-05_0118_prompt_textual_c2b_syntax_form_ui.md`: (1) the name-keyword ticket of P-2026-11-05-0036; (2) the Syntax mode; (3) the form, Basic and Advanced (D2); (4) Save as one undo step and D9; (5) gates; (6) app check; (7) log and Status. Stopped at the context ceiling after items 1-4 and 6, closed by `claude_2026-11-05_0145_prompt_textual_c2b_closure.md` (RC-51) for items 5 and 7.
**Files touched**: 0d49db028: `frontend/src/codegen/textual/syntaxForm.ts`, `__tests__/syntaxForm.test.ts`; f243a8152: `syntaxForm.ts`, `ui/SyntaxForm.tsx` (new), `ui/SyntaxForm.scss` (new), `ui/TextualTab.tsx`, `ui/openTextualTab.tsx` (comment), `__tests__/syntaxForm.test.ts`, `__tests__/textualTab.test.ts`. Docs: this entry, the two Status lines.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on f243a8152: typecheck 0; vitest 528 files, 14097 passed, 2 skipped, 3 red at import (baseline), 2 Chromium harness files timed out under load and passed alone (18/18); build 0; check:docs 0; check:codegen-lazy ALL GREEN (off, on).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (app probe, 19 checks, `~/.jjodel-lanes/P-2026-11-05-0118/probe.out.txt`): Syntax mode, Basic keyword edit and preview, Advanced via Profile, a keyword fault disables Save at its fields, Save, Cmd+Z, Discard. Crops c2b-0..10 in the lane folder, GO di Alfonso in attesa.
**Notes**: Ticket closed in `locate` (0d49db028, red first). Unattended, for Alfonso to ratify: the global Basic/Advanced is Redux `advanced` (ModeToggle and useInterfaceMode are dead code); the D9 line under the tab bar pushes the body down; `ModelReading.input` optional. Benches: `nameKeywordAt` and readModel's `input` killed. Crops regenerated after the input-size fix, not re-inspected. Handoff: `~/.jjodel-lanes/P-2026-11-05-0118/handoff.md`.
**Prompt document name**: 2026-11-05 01:18

## 2026-11-05 — merge: textual-c2-syntax-form into alfonso-frontend-jjtl (P-2026-11-05-0724)

**Prompt**: `claude_2026-11-05_0724_prompt_merge_textual-c2-syntax-form.md`, a direct merge by `lane-run merge --direct`, no session: `textual-c2-syntax-form` at `7c63bdd99` into `alfonso-frontend-jjtl`, merge base `04ada9f61`. Step C lane C2b: the Syntax mode of the Text tab (SyntaxForm.tsx, its stylesheet, Save through writeTextualSyntax, the de-duplicated checkStyle errors in the bar), and the name-keyword collision located at both fields. Alfonso's «Go» 07:24.
**Files touched**: merge `c3a469c71`, the branch side (`frontend/src/codegen/textual/ui/SyntaxForm.tsx`, `ui/SyntaxForm.scss`, `ui/TextualTab.tsx`, `ui/openTextualTab.tsx`, `syntaxForm.ts`, their tests, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c3a469c71`: typecheck 0 errors; typecheck:scripts, build, check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 14099 tests, 3 red at import (baseline), one failure in `src/codegen/engine/__tests__/generateFiles.test.ts`, outside the branch, 8/8 alone twice (order-dependent in the full run).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe of P-2026-11-05-0118, 19 checks; crops c2b-0..10 checked by the chat (RC-23) and by Alfonso («Go», 07:24).
**Notes**: Rollback tag `pre-textual-c2-syntax-form-P-2026-11-05-0724` on `04ada9f61` (RC-31). Union: none. The generateFiles order dependence deserves a ticket of its own front. Worker: `~/.jjodel-lanes/P-2026-11-05-0724/result.json`.
**Prompt document name**: 2026-11-05 07:24

## 2026-11-05 — fix(editor-v2): C2d, a nameless reference target is labelled `: <Class>` on the v2-flow default view (P-2026-11-05-0148)
**Prompt**: `claude_2026-11-05_0148_prompt_v2flow_nameless_ref_label.md`, R-TXT-47 D5, C2 report §3.3: confirm R4, then an optional `label` on the reference target, `: <metaclass>`, painted by RowValue; `name` stays ''.
**Files touched**: `fe26dc850`: `frontend/src/components/editor-v2/utils/jjomTransformers.ts`, `types.ts`, `nodes/RowValue.tsx`, `utils/__tests__/namelessRefTarget.test.ts`; this entry and the prompt's Status, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: 2026-11-04 22:55
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe 8/8 on port 3497, crops c2d-* in ~/.jjodel-lanes/P-2026-11-05-0148/; Alfonso's GO pending (R-TXT-47)
**Notes**: R4 held, evidence in the commit body. Tests red first (6), 8/8 mutations killed. Gates: typecheck 0; vitest 14100 pass, 3 baseline import reds plus 2 Chromium hook timeouts that pass alone; build 0; check:docs 5/5. L `.delete()` of a contained Port now scrubs the inbound pointer (dash, no broken); the broken path was smoked on a pointer written back by SetFieldAction, and its chip reads the transient app name `Port_1`.
**Prompt document name**: 2026-11-05 01:48

## 2026-11-05 — merge: v2flow-nameless-ref-label into alfonso-frontend-jjtl (P-2026-11-05-0734)

**Prompt**: `claude_2026-11-05_0734_prompt_merge_v2flow-nameless-ref-label.md`, a direct merge by `lane-run merge --direct`, no session: `v2flow-nameless-ref-label` at `f5549d33d` into `alfonso-frontend-jjtl`, merge base `04ada9f61`. Step C lane C2d (R-TXT-47 D5): a reference to a nameless target shows a `: <Class>` chip on the v2-flow default view. Alfonso's «Go» 07:24.
**Files touched**: merge `f1bef5364`, the branch side (`frontend/src/components/editor-v2/utils/jjomTransformers.ts`, `types.ts`, `nodes/RowValue.tsx`, `utils/__tests__/namelessRefTarget.test.ts`, `docs/log-inbox/codegen.md`, prompt).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f1bef5364`: typecheck 0 errors; typecheck:scripts, build, check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 14108 tests, 3 red at import (baseline), hooks 967.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe of P-2026-11-05-0148, 8 checks; crops c2d-* checked by the chat (RC-23) and by Alfonso («Go», 07:24).
**Notes**: Rollback tag `pre-v2flow-nameless-ref-label` on `6f34411de` (RC-31). Union: docs/log-inbox/codegen.md. Worker: `~/.jjodel-lanes/P-2026-11-05-0734/result.json`.
**Prompt document name**: 2026-11-05 07:34

## 2026-11-05 — feat(codegen): L1a, the origin of each EBNF literal and its record field (P-2026-11-05-0841)

**Prompt**: `claude_2026-11-05_0841_prompt_textual_ebnf_literals_l1a.md`, lane L1a of R-TXT-48 under R-TXT-49 D1, D4, D5, D8, D11 (provisional): an optional `src` on the `kw` and `p` grammar nodes, `concreteGrammarEbnfSpans`, and the mapping of a literal to its `FieldRef` with default, D4 and well-formedness in `syntaxForm.ts`. Pure, no UI.
**Files touched**: `frontend/src/codegen/textual/concreteGrammar.ts` and `__tests__/ebnfLiterals.test.ts` (new) in `251e4e565`; `frontend/src/codegen/textual/syntaxForm.ts` and the same test in `210c61ee1`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Red first 27/27 and 28/28; 55 tests on the probe's six grammars (191 literals, counts per origin as measured). Mutation bench: 6/6 and 14/14 killed, counts in the commit bodies. Gates: typecheck 0; vitest 14161 pass, 3 baseline import reds; build 0; check:docs 0; check:codegen-lazy ALL GREEN (off, on). EBNF text byte for byte unchanged.
**Prompt document name**: 2026-11-05 08:41

## 2026-11-05 — merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-0906)

**Prompt**: `claude_2026-11-05_0906_prompt_merge_textual-ebnf-literals.md`, a direct merge by `lane-run merge --direct`, no session: `textual-ebnf-literals` at `2c0cec54b` into `alfonso-frontend-jjtl`, merge base `1cf342a50`. R-TXT-48 and R-TXT-49: the EBNF literals discovery report and lane L1a (each quoted literal carries its origin, `concreteGrammarEbnfSpans`, origin to field, D4 and D5), no UI. Lane auto (Alfonso 07:38).
**Files touched**: merge `4b858ee65`, the branch side (`frontend/src/codegen/textual/concreteGrammar.ts`, `syntaxForm.ts`, `__tests__/ebnfLiterals.test.ts`, the discovery report, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `4b858ee65`: typecheck 0 errors; typecheck:scripts, build, check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 14163 tests, 3 red at import (baseline), hooks 967.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — no UI change; the EBNF text is byte for byte the same.
**Notes**: Rollback tag `pre-textual-ebnf-literals` on `1cf342a50` (RC-31). Union: none. Worker: `~/.jjodel-lanes/P-2026-11-05-0906/result.json`.
**Prompt document name**: 2026-11-05 09:06

## 2026-11-05 — feat(codegen): C3b, the deletion guard, the Indentation style, Indentation in the picker and the form (P-2026-11-05-0748, P-2026-11-05-0816, P-2026-11-05-0843)

**Prompt**: `claude_2026-11-05_0748_prompt_textual_c3b_indent.md`, continued after two context-ceiling stops by `claude_2026-11-05_0816_prompt_textual_c3b_cont.md` and `claude_2026-11-05_0843_prompt_textual_c3b_cont2.md` (RC-51): (1) the deletion guard of the Text tab; (2) the style `indent`; (3) Indentation in the picker and the Syntax form; (4) mutation bench and gates; (5) app check; (6) this entry.
**Files touched**: `72389e089` (guard: `ui/TextualTab.tsx`, `TextualTab.scss`, `__tests__/deletionGuard.test.ts`); `7c004674a` (indent: `style.ts`, `concreteGrammar.ts`, `parser.ts`, `printer.ts`, `styleCheck.ts`, `__tests__/{indent,styles,styleCheck}.test.ts`, `__tests__/oracle.ts`); `283b5dbd6` (`syntaxForm.ts`, `annotations.ts`, `__tests__/{syntaxForm,syntaxRecord,textualTab}.test.ts`); `506837dc1` (`__tests__/deletionGuard.test.ts`); all under `frontend/src/codegen/textual/`.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no. Gates on `506837dc1`: typecheck exit 0; vitest 14175 passed, 3 red at import (baseline); build exit 0; check:docs 5/5; check:codegen-lazy off and on all PASS.
**Out-of-scope changes**: yes — `syntaxForm.ts:281` and `annotations.ts:239`, one line each plus the import, approved by the chat (lane auto); more than five files across the lane, listed above.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe `~/.jjodel-lanes/P-2026-11-05-0843/probe.mjs`, 15/15, crops c3b-*; GO of Alfonso pending.
**Notes**: Partial: the Syntax form cannot save Indentation on any annotated record: the style check's LL(1) has no line rule (ticket below). The picker writes it, the bar lists the errors, the text applies. Guard bench 7 mutants, 5 killed after two vacuous tests were fixed; G4 and G7, the wiring in readEdit, survive: no render harness, covered by the app check. One `pageerror: Canceled` in the probe, absent in 0118. Detail: probe.out.txt in the lane folder.
**Prompt document name**: 2026-11-05 08:43

## 2026-11-05 — ticket: under Indentation the style check reports false LL(1) conflicts on every annotated grammar
**Ticket**: `ll1Conflicts` (styleCheck.ts, run only when the grammar is annotated, i.e. any saved record) computes FOLLOW without the parser's line rule, so under `indent` an optional part that starts with ID and is followed by an ID-starting item is "not LL(1)" though the parser reads it. Measured on the tolerant corpus: 5 of 5 annotated cases have 1 to 4 such errors under indent, 0 under C-like and Pascal (turnstile annotated: 3 in every style). In the app the Syntax form refuses to save Indentation (Save disabled) for the port fixture and even for `{v:1, style:{base:'indent'}}`; the Text tab picker stores it and the bar lists the errors. `indent.test.ts:131` checks an unannotated grammar, so it never runs this step.
**Priority**: high
**Found in**: P-2026-11-05-0843
**Detail**: ~/.jjodel-lanes/P-2026-11-05-0843/probe.out.txt

## 2026-11-05 — fix(codegen): C3b, a line-aware LL(1) check under Indentation, the picker refuses a refused style (P-2026-11-05-0910)
**Prompt**: `claude_2026-11-05_0910_prompt_textual_c3b_ll1_lines.md`: (1) the style check's LL(1) reads the parser's line rule under Indentation; (2) the Text tab's picker refuses a style `checkStyle` refuses, as Save does (R-TXT-47 D1); (3) gates; (4) app check, the `pageerror: Canceled` traced; (5) this entry.
**Files touched**: `e84d1c814` (`styleCheck.ts`, `__tests__/indent.test.ts`); `53f8481f0` (`__tests__/indent.test.ts`, a type fix); `559b61194` (`syntaxForm.ts`, `ui/TextualTab.tsx`, `__tests__/syntaxForm.test.ts`); all under `frontend/src/codegen/textual/`.
**Outcome**: ✅ completed
**Corregge**: 2026-11-05 08:43
**Causa**: (c)
**Regressions**: no. Gates on `559b61194`: typecheck exit 0; vitest 14187 passed, 3 red at import (baseline); build exit 0; check:docs exit 0; check:codegen-lazy ALL GREEN (off, on).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe `~/.jjodel-lanes/P-2026-11-05-0910/probe.mjs`, 9/9, crops ll1-*; GO of Alfonso pending.
**Notes**: Benches: LL(1) 8/8 killed, picker gate 4/4; the picker's wiring has no render harness, covered by the probe. Port record under Indentation: the picker refuses, 2 errors, the Ref only; the default record passes and the form saves it. `Canceled`: Monaco's word highlighter cancels its Delayer when `reprint` restores the view state after Undo; unhandled, harmless. Detail: probe.out.txt, canceled-trace.out.txt in the lane folder.
**Prompt document name**: 2026-11-05 09:10

## 2026-11-05 — merge: textual-c3b-indent takes alfonso-frontend-jjtl (P-2026-11-05-0943)

**Prompt**: `claude_2026-11-05_0943_prompt_textual-c3b-indent_take_trunk.md`, a session merge by `lane-run merge --trunk-into --launch` (RC-14: concreteGrammar.ts and syntaxForm.ts changed on both sides since the base, by L1a on the trunk): the trunk at `5fd33809e` into `textual-c3b-indent`.
**Files touched**: merge `38a49d347` on the branch.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: —
**Regressions**: unknown on the branch: the session died in the bridge outage (10:06 to 13:55) after the merge commit, before its gates; the gates run on the trunk merge that follows.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — a merge of the trunk into the branch; the C3b crops c3b-* and ll1-* were checked by the chat before it.
**Notes**: Lane folder `~/.jjodel-lanes/P-2026-11-05-0943/` (outcome died, 222 min).
**Prompt document name**: 2026-11-05 09:43

## 2026-11-05 — merge: textual-c3b-indent into alfonso-frontend-jjtl (P-2026-11-05-1413)

**Prompt**: `claude_2026-11-05_1413_prompt_merge_textual-c3b-indent.md`, a direct merge by `lane-run merge --direct`, no session: `textual-c3b-indent` at `e04259214` into `alfonso-frontend-jjtl` (the branch took the trunk in P-2026-11-05-0943). Step C lane C3b: the deletion guard of the Text tab (R-TXT-41 D2, R-TXT-43), the indentation style, Indentation in the picker and the Syntax form, the line-aware LL(1) check and the picker refusing a refused style (R-TXT-50). Lane auto.
**Files touched**: merge `45fcd7233`, the branch side (`frontend/src/codegen/textual/parser.ts`, `concreteGrammar.ts`, `style.ts`, `printer.ts`, `styleCheck.ts`, `syntaxForm.ts`, `annotations.ts`, `ui/TextualTab.tsx`, their tests incl. `indent.test.ts` and `deletionGuard.test.ts`, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `45fcd7233`: typecheck 0 errors; typecheck:scripts, build, check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 14244 tests, 3 red at import (baseline), hooks 967.
**Out-of-scope changes**: yes — syntaxForm.ts:281 and annotations.ts:239, one line each, approved by the chat (P-2026-11-05-0843).
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probes of P-2026-11-05-0843 (15 checks) and P-2026-11-05-0910 (9 checks); crops c3b-* and ll1-* checked by the chat (RC-23).
**Notes**: Rollback tag `pre-textual-c3b-indent` (RC-31). Union: none. Worker: `~/.jjodel-lanes/P-2026-11-05-1413/result.json`.
**Prompt document name**: 2026-11-05 14:13

## 2026-11-05 — feat(codegen): L1b, the editable literals of the EBNF mode over the shared syntax draft (P-2026-11-05-0921, P-2026-11-05-0945, P-2026-11-05-1415)

**Prompt**: `claude_2026-11-05_0921_prompt_textual_ebnf_literals_l1b.md`, lane L1b of R-TXT-49: (1) the syntax draft lifted into `useSyntaxDraft`, shared by the Syntax form and the EBNF mode; (2) the EBNF mode's element literals as islands edited in place, Save and Discard, findings at the literal. 0921 stopped at the context ceiling (handoff); 0945 died in the bridge outage after its probe; 1415 closed probe, gates and commit.
**Files touched**: `a44ff8319` (`frontend/src/codegen/textual/ui/useSyntaxDraft.ts` new, `ui/SyntaxForm.tsx`, `__tests__/syntaxDraft.test.ts` new); `c637ebf5f` (`ui/TextualTab.tsx`, `ui/TextualTab.scss`, `ui/SyntaxForm.tsx`, `__tests__/ebnfIslands.test.ts` new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no. Six files over the two commits, all declared in the DOVE of 0921 (RC-11).
**Layer Impact Report**: not-required
**Smoke visivo**: passato — app probe ALL PASS, 23 checks, crops l1b-1..11 in `~/.jjodel-lanes/P-2026-11-05-1415/`; the GO visivo of the chat is pending.
**Notes**: 1415 fix: a read-only Monaco neither paints nor hovers markers (`renderValidationDecorations: 'editable'`), so the finding rides on the island's hover; 0945's l1b-6b showed the edit hint alone. Gates on the tree of c637ebf5f: typecheck 0; vitest 14171 passed, 3 baseline import reds; build 0; check:docs 5/5; check:codegen-lazy ALL GREEN (off, on). Red first and mutation bench in the commit bodies.
**Prompt document name**: 2026-11-05 09:21

## 2026-11-05 — merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)

**Prompt**: `claude_2026-11-05_1455_prompt_textual_ebnf_literals_take_trunk.md`: the trunk into the branch, `--no-ff`; two conflicts, `docs/log-inbox/codegen.md` by union, `ui/TextualTab.tsx` keeping C3b, C2b and L1b whole.
**Files touched**: merge `62fc7d950` on the branch (trunk at `d95d5b9ca`, not the measured `8565e3e84`: 4 docs files later, no code); resolved by hand `docs/log-inbox/codegen.md` (union, trunk first) and `frontend/src/codegen/textual/ui/TextualTab.tsx` (the `../syntaxForm` import, union).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merged tree: typecheck 0; vitest 3 baseline import reds, plus 32 in `bashGuard.test.ts` from the open merge (MERGE_HEAD exemption, `bash-guard.mjs:167`), 160/160 rerun alone after the commit; build 0; check:docs 5/5; check:codegen-lazy ALL GREEN (off, on).
**Out-of-scope changes**: no. The merge carries 28 trunk files; the hand edits are the two declared.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probes in `~/.jjodel-lanes/P-2026-11-05-1455/`: L1b 23/23, picker refusal 9/9, guard 15/15 in a variant (Notes); crops l1b-*, ll1-*, c3b-*; GO visivo of the chat pending.
**Notes**: The 0843 probe as written fails its step 1 identically on the trunk tip: since 0910 the picker refuses Indentation on its record. Variant `probe-guard-direct.mjs` writes Indentation directly, as the pre-0910 picker did: 15/15 on the trunk tip (`trunk-control/`) and 15/15 merged. The picker keeps the trunk's `onStyle`; the branch never changed it.
**Prompt document name**: 2026-11-05 14:55

**Ticket** (low): `~/.jjodel-lanes/P-2026-11-05-0843/probe.mjs` cannot pass its step 1 on any tree carrying the 0910 picker refusal (`559b61194`); the 1413 entry's «0843 (15 checks)» predates that. `probe-guard-direct.mjs` here is the working copy.

## 2026-11-05 — merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-1522)

**Prompt**: `claude_2026-11-05_1522_prompt_merge_textual-ebnf-literals.md`, a direct merge by `lane-run merge --direct`, no session: `textual-ebnf-literals` at `df8678701` into `alfonso-frontend-jjtl` (the branch took the trunk in P-2026-11-05-1455, TextualTab.tsx resolved by hand). R-TXT-48 step 1, lane L1b: the syntax draft shared by the Syntax form and the EBNF mode (`useSyntaxDraft`), editable literal islands with a content widget, linked occurrences, findings in the island's hover, Discard and Save. Lane auto.
**Files touched**: merge `eddaf1e6d`, the branch side (`frontend/src/codegen/textual/ui/useSyntaxDraft.ts`, `ui/SyntaxForm.tsx`, `ui/TextualTab.tsx`, `ui/TextualTab.scss`, `__tests__/ebnfIslands.test.ts`, `docs/log-inbox/codegen.md`, prompts).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `eddaf1e6d`: typecheck 0 errors; typecheck:scripts, build, check:docs, check:agents, check:scripts, check:addonly exit 0; vitest 14257 tests, 3 red at import (baseline), hooks 967.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probes on the merged tree of P-2026-11-05-1455 (L1b 23/23, picker 9/9, guard 15/15 with the direct-write variant); crops checked by the chat (RC-23).
**Notes**: Rollback tag `pre-textual-ebnf-literals-P-2026-11-05-1522` on `f4751483b` (RC-31). Ticket, low: the 0843 guard probe picks Indentation through the picker, refused since 0910 on its corpus; use the direct-write variant of P-2026-11-05-1455. Worker: `~/.jjodel-lanes/P-2026-11-05-1522/result.json`.
**Prompt document name**: 2026-11-05 15:22

## 2026-11-05 — feat(codegen): L2a, the style tokens as overrides on the base, a form field per token (P-2026-11-05-1430, P-2026-11-05-1457)

**Prompt**: `claude_2026-11-05_1430_prompt_textual_ebnf_literals_l2a.md`, continued after the context ceiling (RC-51) by `claude_2026-11-05_1457_prompt_textual_ebnf_literals_l2a_cont.md`: lane L2a of the EBNF literals report §4/§5.1. Style token overrides resolved and applied (1), dropped on a base switch and written in a fixed order (2), the `style-tokens` rule (3), a form field per style parameter with the style EBNF literals editable (4), round trips under overrides (5), gates (6), log (7). Lane auto.
**Files touched**: `frontend/src/codegen/textual/annotations.ts` (`1794d0dd0`), `syntaxRecord.ts` (`e34070b3b`), `styleCheck.ts` (`612626c76`), `syntaxForm.ts` (`eb73f7b49`), `__tests__/styleTokens.test.ts` (new; `1794d0dd0`..`f87481236`), `__tests__/ebnfLiterals.test.ts` (`eb73f7b49`), `docs/log-inbox/codegen.md`, the two prompts' Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 0 errors; vitest 14291 passed, 3 red at import (baseline); build exit 0; check:codegen-lazy ALL GREEN (off, on); check:docs below.
**Out-of-scope changes**: yes — `__tests__/ebnfLiterals.test.ts`, two L1a assertions pinning style tokens as read only narrowed to the enumeration literal and the fixed token (D-L2a-6, decided by the chat in P-2026-11-05-1457).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — no app probe run; the EBNF mode's style literals become editable through `setLiteral`, reachable in the Text tab and not verified in the app.
**Notes**: Decisions D-L2a-1..7 in `~/.jjodel-lanes/P-2026-11-05-1430/handoff.md` and the commit bodies. `( )` block over the call layout measured: the LL(1) check reports it on PORT via the expression parentheses; without the operator it round-trips, so no new check. Benches in each commit body, every mutant killed.
**Prompt document name**: 2026-11-05 14:30

## 2026-11-05 — merge: textual-ebnf-literals-step2 takes alfonso-frontend-jjtl (P-2026-11-05-1537)

**Prompt**: `claude_2026-11-05_1537_prompt_textual-ebnf-literals-step2_take_trunk.md`, a direct merge by `lane-run merge --trunk-into` (L1b merged on the trunk); `claude_2026-11-05_1538_prompt_textual-ebnf-literals-step2_take_trunk.md` is a duplicate launch of the same merge during the bridge outage, superseded.
**Files touched**: merge `2f6c8111d` on the branch.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: —
**Regressions**: yes. vitest after the merge: 46 failures in 18 files under load 49 to 57; rerun alone 973/974. The one that stays red is genuine: `ebnfIslands.test.ts` (L1b) pins style tokens as read only, and L2a now maps them to fields, so the EBNF mode shows them as islands. R-TXT-48 step 2 wants exactly that; the assertion is narrowed in P-2026-11-05-2220 (B0) with an app check of a style-token island.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — merge of the trunk into the branch.
**Notes**: Lane folders `~/.jjodel-lanes/P-2026-11-05-1537/` and `-1538/`; rerun output /tmp/rerun1537.out on the Mac.
**Prompt document name**: 2026-11-05 15:37

## 2026-11-05 — fix(codegen): B0, a tokens input for the style token rows, style-token islands after L2a (P-2026-11-05-2220)
**Prompt**: `claude_2026-11-05_2220_prompt_textual_ebnf_literals_b0.md`: F5 of the block-tokens report (a `tokens` input kind for the array token fields) and the merge's genuine red in `ebnfIslands.test.ts` (R-TXT-48 step 2).
**Files touched**: `syntaxForm.ts`, `ui/SyntaxForm.tsx`, `__tests__/styleTokens.test.ts` (f28661bdd); `__tests__/ebnfIslands.test.ts` (e12db26dc).
**Outcome**: ✅ completed
**Corregge**: 2026-11-05 14:57
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes, the ebnfIslands assertion, declared in the prompt.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe 13/13 PASS, crops in `~/.jjodel-lanes/P-2026-11-05-2220/`, light, scale 1.
**Notes**: L2a had labelled the token fields but given them no rows: `styleTokenFields` adds them in Advanced, `fieldsOf` unchanged. List tokens stay text (strings). Gates: typecheck 0; build 0; check:docs 0; lazy off 4 and on 5 PASS; vitest 3 baseline import reds, `tolerant` 56/56 alone, two IR Chromium files 18/18 tests alone but `afterAll` browser close timed out at load 59 (harness). 6 mutants killed.
**Prompt document name**: 2026-11-05 22:20

## 2026-11-05 — merge: textual-ebnf-literals-step2 into alfonso-frontend-jjtl (P-2026-11-05-2247)
**Prompt**: `claude_2026-11-05_2247_prompt_merge_textual-ebnf-literals-step2.md`, a direct merge by `lane-run merge --direct`, no session: `textual-ebnf-literals-step2` at `abbdf419d` into `alfonso-frontend-jjtl`, merge base `95359d75e`, 16 commits on the branch side.
**Files touched**: merge `6f1530d9c`: 14 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-05_1430_prompt_textual_ebnf_literals_l2a.md`, `docs/prompts/claude_2026-11-05_1457_prompt_textual_ebnf_literals_l2a_cont.md`, `docs/prompts/claude_2026-11-05_1537_prompt_textual-ebnf-literals-step2_take_trunk.md`, `docs/prompts/claude_2026-11-05_1538_prompt_textual-ebnf-literals-step2_take_trunk.md`, `docs/prompts/claude_2026-11-05_2220_prompt_textual_ebnf_literals_b0.md`, `frontend/src/codegen/textual/__tests__/ebnfIslands.test.ts`, `frontend/src/codegen/textual/__tests__/ebnfLiterals.test.ts`, and 6 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6f1530d9c` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 14336 tests in 535 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: B0 crops checked by the chat on the branch tip abbdf419d: token rows in Advanced, style-token island { to begin linked across rules, Save prints begin, one Undo restores
**Notes**: Rollback tag `pre-textual-ebnf-literals-step2` on `1b70ba7f3` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-05-2247/result.json`.
**Prompt document name**: 2026-11-05 22:47

## 2026-11-05 — feat(codegen): B1, per-block tokens in the core (P-2026-11-05-1541, P-2026-11-05-2212)
**Prompt**: `claude_2026-11-05_1541_prompt_textual_block_tokens_b1.md`, continued by `claude_2026-11-05_2212_prompt_textual_block_tokens_b1_cont.md`: B1 of the block-tokens report (R-TXT-51, R-TXT-52), per-block tokens resolved, derived, tokenized and style-checked.
**Files touched**: `annotations.ts`, `concreteGrammar.ts`, `parser.ts`, `styleCheck.ts`, `syntaxForm.ts`, `__tests__/blockTokens.test.ts` (1ba637cef, 98df231ae, 938a4109d, 0a1d50ca6).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes, syntaxForm.ts: two LITERAL_NAME entries the exhaustive Record needs for the new kinds.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — core only, no UI; the form and EBNF edit come in B2.
**Notes**: 1541 stopped at the soft ceiling, 2212 at the next one; the chat ran the closing gates. Gates: typecheck 0; laneBoard alone green (harness red in the full run); build 0; check:codegen-lazy 0; check:docs 0. blockTokens 24 tests, 27 mutants killed. R2 (unclosed `is` taking `end program`) pinned, not changed.
**Prompt document name**: 2026-11-05 15:41

## 2026-11-05 — merge: textual-block-tokens takes alfonso-frontend-jjtl (P-2026-11-05-2346)
**Prompt**: `claude_2026-11-05_2346_prompt_textual-block-tokens_take_trunk.md`: the trunk `alfonso-frontend-jjtl` at `0832088dc` into `textual-block-tokens` at `65d58157a`, one merge commit, `--no-ff` (RC-14), merge base `2c15d1761`, 49 trunk commits, 13 branch commits.
**Files touched**: merge `d335bdb2a`: 39 files from the trunk side, `docs/log-inbox/codegen.md` resolved by union (the trunk's entries, then the branch's B1 entry); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d335bdb2a`: typecheck 0 errors; typecheck:scripts exit 0; vitest 14358 passed, 2 skipped (14360) in 536 files, 3 red at import, as expected (trunk 14336 plus 24 in `blockTokens.test.ts`); hooks 967 (trunk 967); build exit 0; check:scripts PASS; check:addonly PASS; check:docs 4/5, B red on a trunk entry (Notes).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — B1 is core only; GO given by the chat.
**Notes**: Union: 73 trunk and 12 branch lines since the base, 0 missing; 21 probes once each, control R-XMI-2 none. `syntaxForm.ts` auto-merged and read: the branch's `LITERAL_NAME` kinds and the trunk's B0 token rows are disjoint. check:docs B: the trunk's `hw-notation.md` closure entry of `892ac50b2` lacked `Corregge` and `Causa`, fixed on the trunk in `27e38755c`.
**Prompt document name**: 2026-11-05 23:46

## 2026-11-06 — merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0030)
**Prompt**: `claude_2026-11-06_0030_prompt_merge_textual-block-tokens.md`, a direct merge by `lane-run merge --direct`, no session: `textual-block-tokens` at `f6bb939a9` into `alfonso-frontend-jjtl`, merge base `0832088dc`, 16 commits on the branch side.
**Files touched**: merge `5dfa13429`: 12 files from the branch side (`docs/discovery/discovery_2026-11-05_textual_block_tokens.md`, `docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-05_1525_prompt_textual_block_tokens_discovery.md`, `docs/prompts/claude_2026-11-05_1541_prompt_textual_block_tokens_b1.md`, `docs/prompts/claude_2026-11-05_2212_prompt_textual_block_tokens_b1_cont.md`, `docs/prompts/claude_2026-11-05_2346_prompt_textual-block-tokens_take_trunk.md`, `frontend/src/codegen/textual/__tests__/blockTokens.test.ts`, `frontend/src/codegen/textual/annotations.ts`, and 4 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `5dfa13429` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 14360 tests in 536 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: non applicabile: B1 core only, no UI
**Notes**: Rollback tag `pre-textual-block-tokens` on `27e38755c` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-06-0030/result.json`.
**Prompt document name**: 2026-11-06 00:30

## 2026-11-06 — feat(codegen): B2 and L2b, per-block and style tokens editable from the Syntax form and the EBNF mode (P-2026-11-05-2350, P-2026-11-06-0100)
**Prompt**: `claude_2026-11-05_2350_prompt_textual_block_tokens_b2_l2b.md` items (1)-(7), continued after the soft context ceiling by `claude_2026-11-06_0100_prompt_textual_block_tokens_b2_l2b_cont.md` from the 2350 handoff: B2 form fields and EBNF edit of the per-block tokens, L2b `<base> (custom)` picker and a Reset on every token row.
**Files touched**: `frontend/src/codegen/textual/syntaxForm.ts`, `ui/SyntaxForm.tsx`, `ui/TextualTab.tsx`, `__tests__/blockTokens.test.ts`, `__tests__/styleTokens.test.ts`; commits `acd8e599b` (1), `73e84d110` (2), `941fc26fb` (3), `f47568f91` (4); this entry and the two Status lines, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f47568f91`: typecheck exit 0; vitest 14381 passed, 2 skipped, 3 red at import (baseline) and `laneRun.test.ts` red in the full run, 145/145 rerun alone; build exit 0; check:codegen-lazy 9/9 in both modes; check:docs red only on Check B, the trunk's `hw-notation.md:1307` entry (no Corregge, Causa), not this lane's.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe 10/10 on port 3536, light, scale 1, crops `l2b-1..2`, `b2-1..5` in `~/.jjodel-lanes/P-2026-11-06-0100/`; GO visivo in attesa.
**Notes**: Benches: (1) 26 mutants, 25 killed, survivor removed; (2) 14, 12 then 14 after a punctuation-acceptance test; (3) 6/6 plus the island guard; (4) 8/8. D9 crop: the side written to the store by a direct call, since the form offers the row on a class with no block only while the record sets one (handoff decision 2). Reset layout inline (SyntaxForm.scss out of scope); `Field` exported for the test.
**Prompt document name**: 2026-11-06 01:00

## 2026-11-06 — merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0124)
**Prompt**: `claude_2026-11-06_0124_prompt_merge_textual-block-tokens.md`, a direct merge by `lane-run merge --direct`, no session: `textual-block-tokens` at `7993d0580` into `alfonso-frontend-jjtl`, merge base `f6bb939a9`, 7 commits on the branch side.
**Files touched**: merge `79f4d6ed3`: 8 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-05_2350_prompt_textual_block_tokens_b2_l2b.md`, `docs/prompts/claude_2026-11-06_0100_prompt_textual_block_tokens_b2_l2b_cont.md`, `frontend/src/codegen/textual/__tests__/blockTokens.test.ts`, `frontend/src/codegen/textual/__tests__/styleTokens.test.ts`, `frontend/src/codegen/textual/syntaxForm.ts`, `frontend/src/codegen/textual/ui/SyntaxForm.tsx`, `frontend/src/codegen/textual/ui/TextualTab.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `79f4d6ed3` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 14384 tests in 536 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: B2+L2b crops b2-1..5, l2b-1..2 in ~/.jjodel-lanes/P-2026-11-06-0100/ checked by the chat: R-TXT-51 target from the form alone, picker custom, Reset without shift, EBNF own vs inherited
**Notes**: Rollback tag `pre-textual-block-tokens-P-2026-11-06-0124` on `f9220d03b` (RC-31). Union: `docs/log-inbox/codegen.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-06-0124/result.json`.
**Prompt document name**: 2026-11-06 01:24

## 2026-11-06 — feat(codegen): B3a, the head prefix of a class, core (P-2026-11-06-0147, P-2026-11-06-0215)
**Prompt**: `claude_2026-11-06_0147_prompt_textual_block_tokens_b3a.md` items (1)-(6), continued after the soft context ceiling by `claude_2026-11-06_0215_prompt_textual_block_tokens_b3a_cont.md` from the 0147 handoff: a `prefix` on a class annotation, the prefix in the derivation, the style check reading the class keyword by origin, D8 reconsidered for a prefixed head.
**Files touched**: `frontend/src/codegen/textual/annotations.ts`, `concreteGrammar.ts`, `styleCheck.ts`, `syntaxForm.ts` (one line), `__tests__/blockTokens.test.ts`; commits `2caec7308` (1), `571675a7a` (2), `c3e06275c` (3), `961f43a3f` (4); this entry and the two Status lines, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `961f43a3f`: typecheck exit 0; vitest 14399 passed, 2 skipped, 3 red at import (baseline); build exit 0; check:codegen-lazy ALL GREEN (off, on); check:docs red only on Check B, the trunk's `hw-notation.md:1307` entry (no Corregge, Causa), not this lane's.
**Out-of-scope changes**: yes — `syntaxForm.ts`, the LITERAL_NAME line `classPrefix` the exhaustive Record forced, declared by the prompt.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Benches: (1) 4/4; (2) 10/10 after a C-like `{` case; (3) 4/4; (4) 9 mutants, 8 killed, the `prefixed` argument of ownOf equivalent (the D8 loop refuses with the same message). D8 rule in the body of `961f43a3f`: an empty open applies only with an applied prefix, a mandatory head name becomes required, an optional one refuses it. Gap for B3b: parser.ts:523 FIRST of an open-less block, :1100 message, head read by position in printer, parser :705, syntaxForm :382.
**Prompt document name**: 2026-11-06 02:15

## 2026-11-06 — feat(codegen): B3b, the head prefix in the readers and the Syntax form (P-2026-11-06-0242, P-2026-11-06-0310)
**Prompt**: `claude_2026-11-06_0242_prompt_textual_block_tokens_b3b.md` items (1)-(5), continued after the soft context ceiling by `claude_2026-11-06_0310_prompt_textual_block_tokens_b3b_cont.md` from the 0242 handoff: the class keyword by origin in parser, printer and syntax form; a `class.prefix` field in the Syntax form and the `classPrefix` island in the EBNF mode; gates; app check.
**Files touched**: `frontend/src/codegen/textual/parser.ts`, `printer.ts`, `syntaxForm.ts`, `ui/SyntaxForm.tsx` (one line), `__tests__/blockTokens.test.ts`; commits `ca03ff90d` (1), `65a842fe2` (2); this entry and the two Status lines, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `65a842fe2`: typecheck exit 0; vitest 14413 passed, 2 skipped, 3 red at import (baseline); build exit 0; check:codegen-lazy ALL GREEN (off, on); check:docs red only on Check B, the trunk's `hw-notation.md:1307` entry, not this lane's.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Benches: (1) 5/5 killed; (2) 15/15 killed. App check port 3542, probe and crops b3b-1..5 in ~/.jjodel-lanes/P-2026-11-06-0242/: Head prefix row in Advanced, preview `begin program cpu { ... end program`, EBNF island begin edited to start then discarded, a prefix shared by the roots Module and Bool refused once at both fields ("also at the head prefix of"), Save blocked. Decisions 1-5 in the commit bodies and the 0242 handoff.
**Prompt document name**: 2026-11-06 03:10

## 2026-11-06 — merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0336)
**Prompt**: `claude_2026-11-06_0336_prompt_merge_textual-block-tokens.md`, a direct merge by `lane-run merge --direct`, no session: `textual-block-tokens` at `60b8a78e4` into `alfonso-frontend-jjtl`, merge base `7993d0580`, 12 commits on the branch side.
**Files touched**: merge `339928e84`: 13 files from the branch side (`docs/log-inbox/codegen.md`, `docs/prompts/claude_2026-11-06_0147_prompt_textual_block_tokens_b3a.md`, `docs/prompts/claude_2026-11-06_0215_prompt_textual_block_tokens_b3a_cont.md`, `docs/prompts/claude_2026-11-06_0242_prompt_textual_block_tokens_b3b.md`, `docs/prompts/claude_2026-11-06_0310_prompt_textual_block_tokens_b3b_cont.md`, `frontend/src/codegen/textual/__tests__/blockTokens.test.ts`, `frontend/src/codegen/textual/annotations.ts`, `frontend/src/codegen/textual/concreteGrammar.ts`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `339928e84` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 14415 tests in 536 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: B3a core; B3b crops b3b-1..5 in ~/.jjodel-lanes/P-2026-11-06-0242/ checked by the chat
**Notes**: Rollback tag `pre-textual-block-tokens-P-2026-11-06-0336` on `fa59c8f84` (RC-31). Union: `docs/log-inbox/codegen.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-06-0336/result.json`.
**Prompt document name**: 2026-11-06 03:36

## 2026-11-06 — docs: step C of the textual IDE plan closed
**Prompt**: Alfonso 2026-11-05 15:33, «chiudi C in /lane auto»: close step C of docs/sessioni/sessione_2026-11-03_textual_ide_plan.md, stop before D.
**Files touched**: `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` (section «Status after step C»), this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — docs only; every visual lane of C had its crops checked by the chat before its merge.
**Notes**: Last merge `339928e84` (B3a, B3b). C2e (IR chip, critical zone) not started, waits for Alfonso. Next is D. Chat C-2026-11-03-1037.
**Prompt document name**: 2026-11-05 15:33

## 2026-11-06 — feat(codegen): D2a, the expected set at a cursor (P-2026-11-06-2118)
**Prompt**: Step D lane D2a (report §3.3 C1, §8; D2, D10): optional `ParseOptions.cursor`, `TextParseResult.expected` of `ExpectedItem`s, tests on the probe's cursors, a no-cursor identity test on the corpus.
**Files touched**: `frontend/src/codegen/textual/parser.ts` (`c4a545aa3`), `frontend/src/codegen/textual/__tests__/completion.test.ts` new (`c4a545aa3`, `e23c3870c`), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — parser only, no UI.
**Notes**: Red first 17/18. Gates: typecheck 0; vitest 534 files passed, 3 baseline import reds; build, check:docs, check:codegen-lazy 0. Identity test killed 4/4 mutants (bench in `e23c3870c`). Readings: block tokens are kind `block` (D2b maps them to keywords); a cursor before a token the parse reads gives what was tested up to it; after an output, `input` is out of order and not offered; free layout offers `=` on the next line.
**Prompt document name**: 2026-11-06 21:18
