# Discovery — code generation authoring for 3.2: Code on M2 and a Template Editor

Prompt-ID: P-2026-10-23-1840 · prompt `docs/prompts/claude_2026-10-23_1840_prompt_template_editor_discovery.md`
Session: b18c1a08-f287-4093-9d68-ddaa417df13a · tree `~/jjodel-w-tpleditor`, branch `tpl-editor`, HEAD `769acd16c`
Executor: Claude Opus 5.5 (`claude-opus-5-5`) · Phase 1, read-only

This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream re-reads the real
files. Every claim is **read** (the file at HEAD `769acd16c`) unless tagged **measured**; nothing was built or run.

## 0. Answer in brief

1. **Code on M2 is a small change, outside the critical zone.** The pill is hidden on M2 by one line,
   `if (!enabled || !isModelMode) return false;` (`codegen/setting.ts:74`), pinned by a test that says so
   (`setting.test.ts:171`). The panel derives the metamodel from `idlookup[modelid].instanceof`
   (`CodePanel.tsx:196-199`) and uses `modelid` as the generation target in four places (generate, oracle,
   scenarios, `SELECT_NODE`). On M2 the panel gets the metamodel id, a project-scoped list of conforming models
   (the `metamodelModels` scan, `sim/simStateUsage.ts:159`, filtered to the project) and a selected target model;
   no conforming model gives an explained empty state on Output. Files: `setting.ts`, `setting.test.ts`,
   `EditorV2.tsx` (two sites), `CodePanel.tsx`, `CodePanel.scss`. None is in the §3.1 table; no Layer Impact Report.
2. **The Transformation Editor is a dock tab, not a modal.** `DockManager.openTransformation`
   (`DockManager.tsx:345`) builds a `JjtlDevelopmentEnv` element and `dockMove`s it into the models group with the
   id `jjtl_<id>`; `JjtlEditor` creates Monaco directly from the `joiner` barrel's `monaco`, registers the `jjtl`
   Monarch language once, and sets parse markers on every change (`JjtlEditor.tsx:29-37, 51-81, 112-118`).
3. **Monaco support for JjEL today: none.** `jjtl` is the only custom language registered in the frontend
   (`jjtlLanguage.ts:127`); its completion provider exists but is never registered (`registerJjtlCompletions` has
   no caller). The template editor needs its own language, `jjel-template`, and its own completion provider.
4. **The engine already gives what the editor needs.** `parseTemplate` is model-free (`jjel/parser/parser.ts:1060`)
   and its errors carry 1-based line and column in the body (`templates.ts:103-106`); generation errors carry
   `(template, line, column)` (`generate.ts:38-40, 96-108`). Markers at the right line need no engine change.
5. **Recommended: four slices, Saturday to Monday.** S1 Code on M2 (Sat morning); S2 the Template Editor tab with
   list, Monaco, markers and Save (Sat afternoon to Sun morning); S3 live preview (Sun afternoon); S4 completion
   (Mon morning), Monday afternoon as buffer. Cuts, in order: the tree entry, then S4, then S3. S1 and S2 are the
   3.2 floor.
6. **Risks:** the lazy gate stays green if every new module is reached only from `CodePanel`'s chunk (the gate
   checks the static closure, clause 1); unsaved drafts in a dock tab (the JjTL tab lost edits the same way,
   `DockManager.tsx:378-387`); undo of a Save while the editor is open; consumer mode, where the M1 editor (and so
   today's pill) is open while the M2 editor is refused (`DockManager.tsx:146-151`).
7. **Decisions:** R-GEN-19..R-GEN-24 below, provisional, unattended (RC-25). Awaiting Alfonso: none of the RC-26
   list, except the push.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | Code on M2 needs no critical-zone file. | **Holds.** `setting.ts`, `EditorV2.tsx`, `CodePanel.tsx`; none in CLAUDE.md §3.1. |
| H2 | The panel can run Generate, Run and Check on a model other than the editor's. | **Holds.** Everything reads a `modelid` string; nothing reads the canvas but origin navigation (§2.3). |
| H3 | The Transformation Editor offers a reusable Monaco setup for JjEL. | **Partly.** The pattern (dock tab, `monaco.editor.create`, register once, markers) is reusable; the language is JjTL, and no JjEL language exists. |
| H4 | Parse errors already carry positions a Monaco marker can use. | **Holds.** §3.3. |
| H5 | The template editor can live in the lazy chunk with no gate change. | **Holds, by reading the gate.** §5.1. Not measured in this phase. |

## 2. Code on M2

### 2.1 How the pill is decided

`frontend/src/codegen/setting.ts:71-80`:
```
export function codePillVisible(
    enabled: boolean, advanced: boolean, lookup: Readonly<Record<string, any>>, modelid: string, isModelMode: boolean,
): boolean {
    if (!enabled || !isModelMode) return false;
    if (advanced) return true;
    const metamodelId = lookup[modelid]?.instanceof;
```
EditorV2 calls it per dispatch (`EditorV2.tsx:622-623`) and mounts the slot only when it is true:
`{CODEGEN_BUILD && modelid && codePill && <CodegenSlot modelid={modelid} />}` (`EditorV2.tsx:5052`). On an M2
canvas `isModelMode` is false (`useEditorMode.ts:128`, `mode: 'metamodel'`; `EditorV2.tsx:617`), so the pill is
never there. The test pins it: `it('is hidden on a metamodel editor (kills: M2 accepted)'` (`setting.test.ts:171-173`).

**Change (S1).** On M2, `modelid` is the metamodel: `const metamodelId = isModelMode ? lookup[modelid]?.instanceof : modelid;`
then the same Advanced / `genTemplates` rule. The signature is unchanged. The test at `:171` flips to «shows on
a metamodel editor in Advanced mode, and in Basic mode when that metamodel holds genTemplates»; that inverts a
committed behaviour on purpose (the request of 2026-10-23), and the log entry says so.

### 2.2 How the panel resolves its model

`CodePanel.tsx:60-65` — the props: `modelid`, `left`, `onClose`. `CodePanel.tsx:196-199`:
```
const metamodelId = useSelector((state: any) => {
    const mm = state.idlookup?.[modelid]?.instanceof;
```
`modelid` is then the target of: `evalGlobals(lookup, modelid)` and `generate(globals, lookup, modelid, …)`
(`:260-261`), `runOracle({ lookup, modelId: modelid, … })` (`:302`), `storedScenariosRaw(state.idlookup ?? {}, modelid)`
(`:206`), and the `SELECT_NODE` detail `{ nodeId, modelId: modelid }` (`:320, :327`). Templates are read and
written on `metamodelId` only (`:200-203, :235-240`).

**Change (S1).** `CodePanelProps` gains one optional field, `isMetamodel?: boolean` (rule 11: optional only).
Inside: `metamodelId = isMetamodel ? modelid : instanceof`; `targetId = isMetamodel ? chosen : modelid`, where
`chosen` is local state over `models = conforming(lookup, project, metamodelId)`, first preselected and following
the list as `scenario` already does (`:232`). Every one of the four uses above reads `targetId`. On M2 the panel
opens on Templates (already the default, `:209`); Output shows a «Model» select before «Entry», and with no
model the hint «No model conforms to <name>: create one to generate, run and check.» with Generate, Run and Check
disabled. `CodegenSlot` passes `isMetamodel={!isModelMode}` (`EditorV2.tsx:432, :460`).

Which models: `metamodelModels(lookup, metamodelId)` (`sim/simStateUsage.ts:159-166`) scans the whole lookup in
key order; the Configurator filters the project's model ids instead (`joiner/environmentConfig.ts:133-135`,
`(modelIds ?? []).filter((id) => idlookup[id]?.className === 'DModel' && idlookup[id].instanceof === mm)`).
Recommended: the project filter, through the user's project as the panel already reads it (`projectIdOfUser`,
`CodePanel.tsx:74-80`), with a one-function helper in `codegen/ui/`. Whether the lookup ever holds models of
another project is not measured here; the filter makes the question moot.

### 2.3 What does not carry over to M2

Origin navigation searches the canvas for the element's vertex (`CodePanel.tsx:317`); on M2 the canvas holds
classes, so a click on an M1 value ends in the existing notice «… is not on the canvas.» (`:331`). Harmless.
A better M2 behaviour, cheap and optional in S1: select the element's metaclass, `lookup[elementId].instanceof`,
whose vertex is on the canvas; and on `CANVAS_ELEMENT_SELECTED` link the spans whose element is an instance of
the selected class. Recommended as R-GEN-21, cut first if S1 runs long.

### 2.4 Critical zone

None of `setting.ts`, `EditorV2.tsx`, `CodePanel.tsx`, `CodePanel.scss` is in the CLAUDE.md §3.1 table, and no
D-layer write path changes: the one write remains the `state` assignment of `CodePanel.tsx:239`, a SetFieldAction.

## 3. Template Editor

### 3.1 The Transformation Editor (the model)

- **Dock tab.** `DockManager.openTransformation` (`DockManager.tsx:345`): tab id `jjtl_${transformation.id}`
  (`:376`), content `React.createElement(JjtlDevelopmentEnv, {...})` (`:405-419`), an existing tab refreshed with
  `updateTab` (`:423-427`), a new one `dockMove`d into `layout.dockbox.children[0]`, group `'models'` (`:441-452`).
- **Edits mirrored on keystroke.** `:378-387`: «JjtlDevelopmentEnv keeps typed code in its own internal state and
  only calls onSave when the user clicks the editor toolbar's Save button. If the user instead triggers Save
  Project … on reload the user would see the template instead of their edits.» Hence a 300 ms debounced sync.
- **Layout.** `JjtlDevelopmentEnv.tsx` (907 lines): left side panel, editor, right panel and bottom panel, each
  resizable (`:89-123`), with Problems, Trace and Output tabs (`:56`).
- **Monaco.** `JjtlEditor.tsx:7` `import {Monaco, monaco} from "../../joiner";`; register once
  (`:29-37`, `let registered = false; function ensureRegistered()`); `monaco.editor.create(containerRef.current,
  { ...jjtlEditorOptions, value, language: JJTL_LANGUAGE_ID, theme: JJTL_THEME_ID, readOnly })` (`:112-118`), options
  from `components/editors/monacoConfig.ts` (`largeMonacoOptions`, `mergeMonacoOptions`, `:13`); on each change,
  lex and parse and `monaco.editor.setModelMarkers(model, 'jjtl', markers)` (`:51-81`), marker width one column.
  It also logs the full token stream on every keystroke (`:54`), not to be copied.
- **Language.** `jjtlLanguage.ts:126-129`: `monaco.languages.register({ id: JJTL_LANGUAGE_ID })`,
  `setMonarchTokensProvider`, `setLanguageConfiguration`.

### 3.2 Monaco support for JjEL, measured by search

- `command grep -rn -E "languages\.register\(" frontend/src` → one hit, `jjtl/editor/jjtlLanguage.ts:127`. The hit
  is the positive control of the same search: no other custom language, JjEL included.
- `command grep -rn -E "registerJjtlCompletions|setCompletionContext|jjtlCompletionProvider" frontend/src`
  (tests excluded) → definitions and re-exports only (`jjtlCompletions.ts:184, 377, 384`; `editor/index.ts:4`;
  `jjtl/index.ts:35`). The JjTL completion provider is dead code; its shape (a module-level context set by the
  open editor, `setCompletionContext`, and a `CompletionItemProvider` with trigger characters) is the precedent.
- `monaco` comes from the `joiner` barrel, which every editor already loads eagerly, so Monaco itself adds
  nothing to the codegen chunk.

### 3.3 What the engine gives the editor

- `parseTemplate(source)` (`jjel/parser/parser.ts:1060`) is model-free: per keystroke, markers need no model.
- `templates.ts:103-106`: `const parsed = parseTemplate(record.body); … for (const e of parsed.errors)
  problems.push({ ...positionIn(record.body, name, e.line, e.column), message: e.message });` Positions inside holes
  and across lines are pinned by `codegen/engine/__tests__/origin.test.ts:128` («the literal text of a string
  nested in a hole has its own absolute position») and `jjel/__tests__/templateInterpolation.test.ts:179`.
- `with … do` is refused with a position (`templates.ts:110-118`): a second marker source, after a full
  registration. Generation errors (`generate.ts:96-108`) carry `template` too, so the preview marks the edited
  template's runtime errors (navigation on null, `origin.test.ts:136`) at their hole.
- Lexing: only `"…"` interpolates, under the option (`jjel/lexer/lexer.ts:232-238`); `'…'` never does (`:241-242`).
  The Monarch grammar mirrors that: a `"` string state with a nested `${` expression state, a plain `'` string.

### 3.4 Target design

A dock tab `codegen_tpl_<metamodelId>`, opened by `openTemplateEditor(metamodelId)` in `codegen/ui/`, which uses
`DockManager.dock` as `openTransformation` does (DockManager is eager already; importing it from the lazy chunk
adds nothing to the entry). `cached: true` on the tab: rc-dock keeps the component and its drafts while the tab
is hidden (`node_modules/rc-dock/lib/DockData.d.ts:175-180`, «content will always reuse the react component thus
allows the component to keep its internal state»); `openTransformation` does not set it.

- **Left:** the metamodel's templates, add, rename, delete, a dirty dot per template with an unsaved draft.
- **Centre:** name and parameters fields over Monaco, language `jjel-template`; markers from `parseTemplate` on
  each change (owner `codegen-parse`) and from the preview's generation errors of this template (owner
  `codegen-gen`); Save button and Ctrl/Cmd+S.
- **Right:** model select (the S1 helper), entry select (`main` if present, else the edited template), the
  generated text in the panel's `<pre>`-with-gutter form, refreshed 400 ms after the last edit, over the stored
  list with the drafts merged in. No Run, no Check: those stay in the panel.
- **Save** goes through `templatesPatch(raw, next)` and the `state` setter, as `CodePanel.save` does
  (`CodePanel.tsx:235-240`): one SetFieldAction, one undo step, no write when unchanged.
- **Entry points:** «Open editor» in the panel's Templates tab (M1 and M2); «from the metamodel» is the M2 pill
  of S1 followed by that button. A tree or context-menu entry needs eager code with a dynamic import; it is the
  first cut.
- **Consumer mode:** `openTemplateEditor` refuses, as `DockManager.open2` refuses an M2 (`DockManager.tsx:146-151`).

`linesOf` and the span rendering are private to `CodePanel.tsx` (`:132-153`); S3 moves `linesOf` to
`codegen/ui/codeLines.ts` so preview and panel share it.

## 4. Slices

All under `frontend/src/codegen/` unless named. Gates for every slice: `node scripts/run-quiet.mjs tc -- npm run typecheck`,
`… build -- npm run build`, `… test -- npx vitest run src/codegen`, `npm run check:codegen-lazy` in both modes.

| Slice | When | DOVE | Probe | Visual check |
|-------|------|------|-------|--------------|
| **S1 Code on M2** | Sat morning | `setting.ts`, `__tests__/setting.test.ts`, `components/editor-v2/EditorV2.tsx` (`CodegenSlot`, `:432-460`, and `:5052` gains `!isConsumerMode()` per R-GEN-23), `ui/CodePanel.tsx`, `ui/CodePanel.scss`, new `ui/conformingModels.ts` + test | `codePillVisible` rows for M2 (kills: M2 branch dropped; M2 reading `instanceof` of the metamodel); `conformingModels` rows (kills: another project's model listed; another metamodel's model listed) | Turnstile example, setting on: pill on M2, Templates first, Output lists its models with the first selected, Generate and Check as on M1; a metamodel with no model shows the empty state |
| **S2 Template Editor tab** | Sat afternoon to Sun morning | new `ui/TemplateEditorTab.tsx`, `ui/TemplateEditorTab.scss`, `ui/openTemplateEditor.ts`, `ui/templateLanguage.ts`, `ui/templateMarkers.ts` + test; `ui/CodePanel.tsx` (the button) | `templateMarkers` maps parse errors to marker ranges (kills: line off by one; column of the hole, not the body) | Open from the panel; a broken hole is marked at its line; Save, then Undo restores the stored body and the editor follows; switching tabs keeps a draft |
| **S3 Live preview** | Sun afternoon | `ui/TemplateEditorTab.tsx`, new `ui/codeLines.ts` + test (moved from `CodePanel.tsx`), `ui/CodePanel.tsx` (import) | `linesOf` rows moved with it; a draft-merge helper (kills: stored body used instead of the draft) | Typing updates the right pane after the pause; a navigation on null is marked at its hole |
| **S4 Completion** | Mon morning | new `ui/templateCompletion.ts` + test, `ui/templateLanguage.ts` | the context builder over a fixture lookup lists classes, features of a class after `.`, templates with params, `stc.` and `target.` members (kills: inherited features missing) | `self.`/`x.` offers features; a template name inserts its call |

Monday afternoon: buffer, CHANGELOG line, the smoke of all four on the dev server. Freeze Tuesday 2026-10-27.

**Cut order if time runs short:** (1) a tree or context-menu entry (never planned in the four), (2) S4 completion,
(3) S3 preview, (4) in S1, the metaclass navigation of §2.3. S1 and S2 are the floor for 3.2. Left for 3.2.x
whatever is cut, plus: Run and Check inside the editor, a template-level outline of calls, rename that rewrites
callers, the JjTL completion revival.

Completion's metamodel side: classes from the metamodel (the L-proxy `classes` getter, `LModelElement.tsx:1981`),
features with inheritance (`get_allFeatures`, `:3162`); the S4 lane verifies which public names reach them.
`stc` members are fixed by `generate.ts:54-66` (`profile, nodes, transitions, initial, events, net, trigger,
source, target, guard, actions`); `target` members by R-GEN-16 and R-GEN-17.

## 5. Risks

1. **Bundle.** `check-codegen-lazy.ts:49` allows one eager module, `src/codegen/setting.ts`; clause 1 is red when
   the entry's static closure reaches any other `src/codegen/` module (`:11-13`). New modules reached only from
   `CodePanel` stay green; a tree entry must use `import()`. `setting.ts` must not import `consumerMode`
   (R-GEN-23 keeps that test in EditorV2). Both modes run for every slice.
2. **Persistence and undo.** One key, one SetFieldAction per Save (R-GEN-12). An Undo while the editor is open
   changes the stored list under the drafts: a clean draft follows the store, a dirty one stays and is marked
   «changed outside the editor». The panel's in-place `TemplateEditor` keeps its own draft keyed by name
   (`CodePanel.tsx:460-462`) and does not follow outside writes today; with both open, the last Save wins.
3. **Unsaved drafts.** Not written per keystroke (R-GEN-22): a Save Project, a closed tab or a reload loses
   them. The JjTL tab answered this with a debounced write (`DockManager.tsx:388-398`); here every write is an
   undo step on the metamodel. The dirty dots are the mitigation.
4. **The Experimental gate.** All entry points live behind the pill (setting and build flag); with the setting
   off nothing new is reachable. An open template tab when the setting is switched off stays open until closed;
   it is not re-checked.
5. **Configurator role profiles.** In consumer mode (`?profile=`) the M1 editor is open and the M2 one refused
   (`DockManager.tsx:146-151`), while `codePillVisible` ignores the mode: today a consumer with the setting on
   could edit the metamodel's templates from an M1. Not a 3.2 regression, but the new editor would widen it.
   R-GEN-23 closes both.
6. **Preview cost.** Each refresh rebuilds `buildEvalContext` over the model (`CodePanel.tsx:83-85`); on a large
   model at 400 ms this may stutter. Not measured; S3 measures it on the largest example and raises the
   debounce if needed.

Absence claims and their searches: §3.2 (Monaco languages, completion callers, both with in-search controls).
`DockManager.tsx` has no `saveLayout` or `localStorage` (`command grep -n -E "loadTab|saveLayout|getLayout\(\)|localStorage"`,
control: the `getLayout()` hits at `:225, :449`), so a template tab is not restored after a reload; `Dock.tsx` was
not read for this, so the claim covers `DockManager.tsx` only.

## 6. Decisions taken (unattended)

Marker on every row: `provisional, unattended` (RC-25). Not written into `docs/decisions.md` (the prompt's rule).

- **R-GEN-19.** The Code panel opens on an M2 canvas under the same rule as on M1, read on that metamodel:
  setting on, and Advanced mode or `genTemplates` stored. On M2 it opens on Templates; Output, Run and Check act
  on a model chosen among the project's models conforming to the metamodel, the first preselected, the choice
  local to the panel and not persisted; with none, an explained empty state.
- **R-GEN-20.** The Template Editor is a dock tab `codegen_tpl_<metamodelId>`, `cached: true`, opened from the
  lazy chunk through `DockManager.dock`, one tab per metamodel; not a modal, and not a change to `DockManager`.
- **R-GEN-21.** On M2, a click on a model value selects its metaclass on the canvas, and a selected class links
  the spans of its instances. Cut first if S1 runs long.
- **R-GEN-22.** The editor writes on Save only (button, Ctrl/Cmd+S), through `templatesPatch` and the `state`
  setter, one undo step; drafts live in the tab, marked dirty, and a clean draft follows outside writes.
- **R-GEN-23.** No Code pill and no Template Editor in consumer mode (`isConsumerMode()`), decided in EditorV2
  and in `openTemplateEditor`, so `setting.ts` keeps its zero imports.
- **R-GEN-24.** The template language is a Monaco language of its own, `jjel-template`, defined under
  `src/codegen/ui/` (lazy), with markers from `parseTemplate` and a completion provider over a context the open
  editor sets (the `setCompletionContext` precedent); no JjEL language is added to `src/jjel/`.

## 7. Decisions awaiting Alfonso

None from the RC-26 list: no critical-zone edit, no exported interface broken (one optional prop), no ratified
row amended (R-GEN-2's «off by default» and R-GEN-18 hold), no deletion, no change to the MODELS demo. The push
stays his.

## 8. Files read

`frontend/src/codegen/ui/CodePanel.tsx` (whole), `frontend/src/codegen/ui/TemplateEditor.tsx` (whole),
`frontend/src/codegen/setting.ts` (whole), `frontend/src/codegen/__tests__/setting.test.ts:158-187`,
`frontend/src/codegen/engine/templates.ts` (whole), `frontend/src/codegen/engine/generate.ts` (whole),
`frontend/src/codegen/stcAccess.ts:1-40`, `frontend/src/components/editor-v2/EditorV2.tsx:410-470, 600-630, 5040-5060`,
`frontend/src/jjtl/editor/JjtlEditor.tsx` (whole), `frontend/src/components/abstract/DockManager.tsx:330-460` and the
`isConsumerMode` sites, `frontend/src/jjel/lexer/lexer.ts:226-255`, `frontend/src/components/editor-v2/sim/simStateUsage.ts:150-170`,
`frontend/src/components/editor-v2/sim/modelMarkings.ts:45-70`, `frontend/src/joiner/environmentConfig.ts:125-138`,
`frontend/scripts/gates/check-codegen-lazy.ts:1-60` (by grep), `node_modules/rc-dock/lib/DockData.d.ts:170-181`,
`docs/decisions.md:5986-6073` and `:5955-5975`; export and grep surveys of `jjtlLanguage.ts`, `jjtlCompletions.ts`,
`JjtlDevelopmentEnv.tsx`, `useEditorMode.ts`, `LModelElement.tsx`, `consumerMode.ts`.
