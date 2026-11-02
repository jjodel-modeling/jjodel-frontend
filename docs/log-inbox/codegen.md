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
