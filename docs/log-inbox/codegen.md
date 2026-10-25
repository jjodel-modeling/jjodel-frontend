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
