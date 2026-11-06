# Discovery: the generator as a viewpoint (codegen, Phase 1)

- Prompt-ID: P-2026-10-23-2255 · prompt `docs/prompts/claude_2026-10-23_2255_prompt_codegen_generator_viewpoint_discovery.md`
- Session: cgvp · tree `~/jjodel-w-cgvp`, branch `cg-viewpoint`, HEAD `6d7d56d4f` · executor Opus 5.5 (`claude-opus-5-5`)
- Read-only. This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.
- Tags: **read** = read in a file in this phase on HEAD `6d7d56d4f`; **measured** = a command run in this phase.

## 0. Answer in brief

1. The working model's frame holds (a generator is a concern of its own, several per metamodel, selectable,
   independent), but its **container** is falsified on two counts. The R-VAL precedent it cites is **not** a
   `DViewPoint`: validation viewpoints were built as a parallel type `DValidationViewpoint extends
   DPointerTargetable` (§3.4). And a `DViewPoint` **is** a `DViewElement` (`viewpoint.ts:115`), so a generation
   viewpoint stored as one would have the type of a view, which point 2 (R-VAL-6) forbids.
2. Viewpoints in Jjodel are **project-scoped and bound to no metamodel** (§3.2); a generator is per metamodel.
   Today's storage (the metamodel's `_state`) already gives binding, round trip with the setting off, and
   travel with the metamodel for free.
3. Recommended storage (option (c), §4): **the generator is a record of the metamodel's `_state`.** The existing
   `genTemplates` **is** the default generator, unmoved; further generators and the default's metadata (root,
   files, target) go in one new key `genGenerators`. Zero core classes, zero exclusion sites, no migration at
   all, the lazy gate unchanged, one undo step per Save kept.
4. Point 7 (migrate `genTemplates`) is **unnecessary** under (c), and under (a)/(b) it would **amend R-GEN-3**
   («no VersionFixer migration», ratified by Alfonso), an RC-26 item. Under (c), deferring generators to 3.3
   costs nothing: every 3.2 project already is a one-generator project in the 3.3 shape (§7).
5. Point 5 (bind the STC on the generator) is falsified as stated: there is one STC per metamodel and nothing
   to choose (§1.4). What a generator must declare is its **target profile** (`jsTarget` is hard-wired today).
6. Five slices G1..G5, none in the critical zone, no exported interface of the core changed (§8). Rows
   R-GEN-31..R-GEN-38 provisional (§9); awaiting Alfonso: the release boundary and the push (§10).

## Hypotheses under test (the prompt's working model)

| # | Hypothesis | Verdict | Where |
|---|---|---|---|
| 1 | A generator is a viewpoint of its own kind, on the precedent of R-VAL-1/2 | **partly**: a concern of its own, several, selectable: holds. «On the precedent of R-VAL» as a `DViewPoint`: falsified, R-VAL is a parallel D-type | §3.4 |
| 2 | Placement of a view, not its type; never in dispatch nor a syntax candidate | **holds** for (a) in `_state`, (b) parallel type, (c); **falsified** for any design whose container is a `DViewPoint` (it is a `DViewElement`) | §3.3, §4 |
| 3 | The generation viewpoint declares root template and output file map | **holds**, both new: today the root is a UI fallback and the output is one text | §1.3, §1.5 |
| 4 | Generators independent, no inheritance | **holds**, free: `registerTemplates` builds one set per call | §1.6 |
| 5 | The STC binding is declared on the generation viewpoint | **falsified as stated**: one STC per metamodel, nothing to bind; the target profile is what to declare | §1.4 |
| 6 | Setting off: inert data, round trip, absent from the picker, no generator module loaded | **holds for free under (c)** (already tested for `genTemplates`); under a `DViewPoint` container it needs exclusion code in at least 6 eager files | §3.5, §4 |
| 7 | `genTemplates` migrates into one default generation viewpoint | **unnecessary under (c)**; under (a)/(b) it amends R-GEN-3 (RC-26) | §5 |

Objective: answer the prompt's eight questions with `file:line` evidence, choose a storage on measured cost,
and give a slice plan.

## 1. Persistence today (question 1)

### 1.1 Readers and writers of `genTemplates` (measured: `command grep -rn genTemplates frontend/src`)

Writers, two, both through the metamodel's `state` setter with `templatesPatch`:
- `frontend/src/codegen/ui/CodePanel.tsx:260-265`: `const patch = templatesPatch(raw, next); if (!patch) return;
  (LPointerTargetable.fromPointer(metamodelId as any) as any).state = patch;`
- `frontend/src/codegen/ui/TemplateEditorTab.tsx:161-163`, the same three lines.

Readers:
- codec `frontend/src/codegen/engine/templateCodec.ts:33` `export const GEN_TEMPLATES_KEY = 'genTemplates';`,
  `:117-120` `readTemplates`, `:123-126` `readModelTemplates` (M1 → `instanceof` → metamodel);
- `CodePanel.tsx:225-228` and `TemplateEditorTab.tsx:132` (selectors on `_state[GEN_TEMPLATES_KEY]`);
- `frontend/src/codegen/setting.ts:79` (eager, never decodes): `const stored = lookup[metamodelId]?._state?.genTemplates;`;
- tests: `codegen/__tests__/setting.test.ts:160-196`, `engine/__tests__/templateCodec.test.ts:64-149`,
  `engine/__tests__/textMode.test.ts`, `ui/__tests__/templateMode.test.ts`,
  `examples/__tests__/importable.test.ts:78` `expect(mm._state.genTemplates).toBe(ex.lookup.MM._state.genTemplates);`;
- fixtures `codegen/examples/turnstile/turnstile.json:27`, `petri-producer-consumer/petri-producer-consumer.json:27`;
- outside `src/`: `scripts/examples/build-codegen-examples.ts`, probes `scripts/probe/codegen-{oracle,check,panel,examples}.ts`.

Shipped project files carrying the key (measured, decompressing `state` with `async-lz-string` as
`importable.test.ts:39-42` does): `public/library/gallery/turnstile/1.jjodel` «genTemplates on 1; viewpoints
Default,Turnstile statechart», `public/library/gallery/petri-producer-consumer/1.jjodel` «genTemplates on 1;
viewpoints Default,Petri net», `public/examples/codegen/turnstile.jjodel` «genTemplates on 1; viewpoints Default»
(and, by the importable test, `petri-producer-consumer.jjodel`). Four files.

### 1.2 What a template carries (read)

`engine/templates.ts:44-50`: `name`, `params`, `body`, `mode?`, `target?`. **No id**: identity is the name,
unique per list (`templateCodec.ts:87` «the name is taken by an earlier one»). Format `templateCodec.ts:7-8`:
`{"v":1,"templates":[template...]}`. `target` is stored and compared (`ui/templateDrafts.ts:52`) but read by no
generation path (measured: `grep -n "\.target\b\|target?"` over engine/templates.ts, CodePanel, TemplateEditorTab,
templateDrafts returns only the declaration and the draft comparison).

### 1.3 How the root is chosen today (read)

Not stored. A panel-local state with a fallback, `CodePanel.tsx:253-255`:
`const entryName = entry !== null && templates.some(t => t.name === entry) ? entry : (templates.find(t => t.name === 'main') ?? templates[0])?.name ?? null;`
Run calls the generated module's `main`: `CodePanel.tsx:83` `const RUN_ENTRY = 'main';`, `:311`
`runInWorker({ code, calls: [{ fn: RUN_ENTRY, args: [] }], timeoutMs })`. Two different «mains»: the template
named `main` (entry) and the JS function `main()` the program exports.

### 1.4 The STC binding (read)

`codegen/stcAccess.ts:153-158`: `const metamodelId = lookup[modelId]?.instanceof; const raw = ... lookup[metamodelId]?._state; ... const { profile, custom } = storedProfile(raw); const stc = netStcFromRoles(runBag(raw, lookup, profile));`.
One profile per metamodel bag, so one STC per metamodel: there is nothing for a generator to choose. The target
is hard-wired: `engine/generate.ts:93` `target: view ? jsTarget(globals, lookup, modelId) : null`. A Verilog or
documentation generator needs `target` to be a declared profile (or none), not the STC.

### 1.5 Output files today (read)

One text. `generate(globals, lookup, modelId, templates, entry, ...)` returns one `GenerateResult`
(`generate.ts:46-52`, `code: string`). No download, copy or file naming in the panel (measured:
`grep -n "RUN_ENTRY\|copy\|clipboard\|Blob" ui/CodePanel.tsx` returns the four `RUN_ENTRY` lines only, the
pattern's own positive control).

### 1.6 Independence (read)

`generate.ts:100` `const set = registerTemplates(templates, ctx, evaluator, host, sources, budget);` — the set is
built per call from the list passed in; two lists never share a registry. Point 4 costs nothing.

## 2. Provenance (question 2)

The third element of the triple is the **string function applied to the model value**, not the generator:
`engine/text.ts:25-29` «What was applied to a model value: `identity`, or a named builtin with its literal
arguments», `engine/origin.ts:50` `const IDENTITY: Transformation = { name: 'identity' };`, the sets at
`origin.ts:41-43` (`toUpper`, `trim`, `camelCase`, ...). With several generators its meaning does not change.
What becomes ambiguous is the **template name** in `LiteralOrigin`/`ErrorOrigin` (`text.ts:46,49`, `template:
string`): names are unique within one list only. Inside one `GenerateResult` there is no ambiguity (one
generation, one list); it surfaces where a position leaves the result: the error click that opens the Template
Editor, `CodePanel.tsx:496` `openTemplateEditor(metamodelId, elementName(lookupNow, metamodelId), current?.name ?? null)`,
and the tab key `TemplateEditorTab.tsx:38` `` `codegen_tpl_${metamodelId}` ``. Those need the generator id;
the triple does not. Recommended: keep `Transformation` as is; carry the generator id on the result, not on
each fragment (R-GEN-36).

## 3. Viewpoint machinery (question 3)

### 3.1 Typing

`view/viewPoint/viewpoint.ts:14` `export type ViewpointType = 'syntax' | 'decoration' | 'validation' | 'semantics' | 'editor_behavior' | 'dataManager';`
and `:17-22` derive it from `viewpointType`, then `isValidation`, then `isExclusiveView`. The field lives on
`DViewElement` (`view/viewElement/view.tsx:224` `viewpointType?: ViewpointType;`) because `DViewPoint` «carries
no own data field at all» (`view.tsx:236-241`). The «only syntax» rule: R-DMV-2 «I viewpoint diagrammatici sono
solo sintassi concreta» and R-IRN-10 (the selector is the syntax control). The creation dialog offers
validation/semantics/editor_behavior disabled (`components/project/NewViewpointDialog.tsx:9-11`, `enabled: false`).

### 3.2 Binding to a metamodel: none

Viewpoints belong to the project: `joiner/classes.ts:1286` `this.setExternalPtr(project.id, 'viewpoints', '+=');`,
`LProject.get_viewpoints` `classes.ts:3483-3500`. No field or resolver ties a viewpoint to a metamodel (measured:
`command grep -rn "function viewpointsOf\|function viewpointsFor\|viewpointsForMetamodel\|metamodelOf(vp\|vp.*\.metamodel\b"`
over `frontend/src` returns no line; the same tool finds `type: 'conformsTo'` at `model/megamodelInference.ts:93`,
whose edge types are model/metamodel/transformation only, `:86-208`). The gallery binds by convention: «a template
opens on its hand-written viewpoint (R-LIB-9: the first one, named after its metamodel)»
(`scripts/probe/library-gallery-clone.ts:12`).

### 3.3 Persistence and dispatch

The reducer files every new D object under a root folder named after its class, `redux/reducer/reducer.ts:467-469`:
`let statefoldername = elem.className.substring(1).toLowerCase() + 's'; ... SetRootFieldAction.create(statefoldername, elem.id,'[]', true)`.
So a `DViewPoint` lands in `state.viewpoints`, not `state.viewelements`; the dispatch reads views only:
`redux/selectors/selectors.ts:92` `Object.values((state).viewelements)`, then per view `:556-559` matches its
viewpoint (`VP_Explicit`, `VP_Default`, `VP_Decorative` when `!dvp.isExclusiveView`, else `VP_MISMATCH`). A
viewpoint with no sub-views never enters dispatch; a non-exclusive one pours its views as decorative, which is
why the DM singleton keeps `isExclusiveView` true (`viewpoint.ts:44-49`). Save serializes the whole `idlookup`
(«`U.compressedState` serializza l'intero `idlookup`», `model/validation/validationTypes.ts:37-39`), so any D
object round-trips.

`_state` is on every D object: `joiner/classes.ts:1436` `export class DPointerTargetable`, `:1477`
`_state: GObject = {};`; the setter merges a delta in one TRANSACTION, `classes.ts:2398-2401`
`TRANSACTION(this.get_name(c)+'.state', ()=>{ if (Object.keys(newState)) SetFieldAction.new(c.data, "_state", newState, '+=', false); ...`.
Two keys written in one assignment are one `+=` action, one undo step.

### 3.4 R-DMV and R-VAL: what exists

- R-DMV: a `DViewPoint` with a fixed id `viewpoint.ts:55` `'Pointer_ViewPointDataManager'`, born at first write
  (`:103-112`), excluded by id or type in each listing (§3.5).
- **R-VAL is implemented** (the prompt says not): `frontend/src/model/validation/` holds `validationTypes.ts`,
  `validationAuthoring.ts`, `validationContext.ts`, `validationEvaluator.ts`, `validationRuleSets.ts`; commits
  `9f16e7703` «feat(validation): il modello dello scheletro, due tipi paralleli (R-VAL)» and `a02459f59`
  (2026-09-08). Its viewpoint is **not** a `DViewPoint`: `validationTypes.ts:122-123`
  `@RuntimeAccessible('DValidationViewpoint') export class DValidationViewpoint extends DPointerTargetable`,
  rules a child D-type `:162-163` `DValidationRule extends DPointerTargetable`, by R-VAL-6-bis (`docs/decisions.md:5449`)
  «La regola nasce come tipo parallelo, senza supertipo comune». It is still a skeleton of one: `:116`
  `VALIDATION_VIEWPOINT_ID = 'Pointer_ValidationViewpointDefault'`, «QUESTA E' UNA SCORCIATOIA DELLO SCHELETRO»
  (`:92`), and «cancellare un viewpoint di validazione lascia le sue regole orfane in `idlookup`» (`:62-64`,
  `childKeys` not extended, a core change left unauthorised, `:58-70`). Consumers (measured, `grep -rln
  "DValidationViewpoint\|VALIDATION_VIEWPOINT_ID"`): `joiner/index.ts`, `TreeViewSidebar/TreeViewContent.tsx`,
  `concernCounts.ts`, `components/validation/ValidationRulesModal.tsx`, `problems/validationFreshness.ts`, and the
  three model files. No import or export path is among them, so R-VAL-10 («follows the metamodel in the import»)
  is not implemented beyond the whole-project file.

### 3.5 Listing, picker, export

Every listing excludes the DM singleton by hand (measured, `grep -rn "isDataManagerViewpoint\b\|isDataManagerViewpointId"`):
`components/editor-v2/Toolbar.tsx:281` and `:291` (the picker), `components/megamodel/MegamodelView.tsx:157`,
`components/TreeViewSidebar/TreeViewContent.tsx:2493` (`partitionByConcern`), `components/project/ProjectEditor.tsx:214`,
`:1203`, `:1208`, `pages/components/Dashboard.tsx:481`, `components/editors/Info.tsx:1511`. A generator stored as a
`DViewPoint` would need the same exclusion in each of those six files, all eager, plus the type rail
(`components/editors/viewpoint/properties/ViewpointProperties.tsx:29-31`) and the dialog. Export: the whole-project
file only; the `.ecore` export drops `_state` (`templateCodec.ts:23`).

## 4. Where templates would live (question 4)

| | (a) list in a `DViewPoint`'s `_state` | (b) parallel D-types `DGenerator` + `DGenTemplate` (R-VAL shape) | (c) records in the metamodel's `_state` (recommended) |
|---|---|---|---|
| Core classes touched | `ViewpointType` union (`viewpoint.ts:14`, exported, joiner); the creation switch `ProjectEditor.tsx:1212-1229` | two new `@RuntimeAccessible` classes exported from `joiner/index.ts` (must load at startup, `validationTypes.ts:42-44`); `childKeys` for cascade delete (core, `validationTypes.ts:58-70`) | none |
| Exported interfaces | union widened (additive) | new exports; none changed | none; `TemplateRecord` unchanged |
| Metamodel binding | new: a pointer in `_state` or a field | new field `metamodel` | free: it lives on the metamodel |
| Exclusion sites | ≥6 eager files (§3.5) | none (not in `state.viewpoints`), tree listing by className scan (`TreeViewContent.tsx:3307` precedent) | none |
| Lazy gate (R-GEN-2) | unchanged if only strings are checked | the class files load eagerly: outside `src/codegen/` they pass `check-codegen-lazy.ts:49` (`EAGER_ALLOWED = 'src/codegen/setting.ts'`) mechanically, inside they fail it; either way a reading of R-GEN-2 | unchanged |
| Undo per Save | one `set_state` (as today) | creators open their own TRANSACTION and cannot be nested (`validationTypes.ts:198-204`): a Save that adds and deletes is several undo steps; edits alone are one | one `set_state`, one or two keys, one step (§3.3) |
| Dispatch / interpreter | never: not in `viewelements` — but the object **is** a `DViewElement` (falsifies point 2) | never | never |
| Setting off, round trip | free (idlookup) | free, if the classes are registered | free, already tested (`templateCodec.test.ts:149` «the D-layer save and load keep genTemplates intact») |
| Migration of 3.2 data | needed: create a viewpoint and move the list (amends R-GEN-3) | needed, same | none |
| `codePillVisible` (`setting.ts:72-81`, eager) | scan of `idlookup` per render | scan | two key reads |

Option (c) in detail: `genTemplates` stays the template list of the **default generator**, byte for byte;
`genGenerators` = `{"v":1,"generators":[{id, name, root, files:[{path, entry}], target, templates?}]}` where the
entry with `id: "default"` carries only metadata (its templates are `genTemplates`) and every other entry carries
its own `templates` in today's record shape. Absent `genGenerators` reads as one default generator with
`root` = today's fallback (`main`, else the first) and one file. Same tolerant decoding, same `templatesPatch`
contract (nothing written when nothing changes, an emptied list written `[]`, never a removed key,
`templateCodec.ts:13-14`).

What (c) does not give: a node in the megamodel tree or the picker. The tree can still list generators by
reading the key (a later slice, G5), the way it lists `DValidationViewpoint`s by scan.

## 5. Migration (question 5)

Under (c) there is none. A project saved by 3.2 has `genTemplates` and no `genGenerators`: it reads as one
default generator, and nothing writes until the user saves a generator (the R-DMV-6 «born at first write»
precedent, `viewpoint.ts:86-91`). Reopened by a build with the setting off: inert, as today (no codegen module
reads it). A 3.3 project reopened by the 3.2 build: 3.2 reads `genTemplates` and sees the default generator's
templates; the other generators survive as an unknown key (unknown keys survive save and load,
`templateCodec.ts:21-22`). The four shipped `.jjodel` files and their tests need no rebuild.

Under (a) or (b), a lazy migration when the codegen chunk first loads on a metamodel is possible without
`VersionFixer.tsx` and without loading the generator with the setting off, but it is a write on open (an undo
entry and a dirty project from merely opening the panel), and it moves persisted data: it amends R-GEN-3 (ratified
by Alfonso, «no VersionFixer migration» and «additive») and, if `genTemplates` were removed after the move,
deletes persisted data. Both are RC-26 items. The gallery and example files would need a rebuild
(`scripts/examples/build-codegen-examples.ts`) or keep relying on the migration.

## 6. UI consequences (question 6)

- **Code panel (M1 and M2)**: a generator chooser in the header (default first; local choice, not persisted,
  following the list as `chosenModel` does at `CodePanel.tsx:221-224`); «New generator», rename, delete (delete
  is a user gesture writing one patch, not an RC-26 deletion). Output: one tab per declared file, each its
  entry's text and map. Run: the file whose generator target is `js`, calling its `main()` as today. Check: only
  when the generator's target is `js` (the oracle needs `initial`/`step`/`observe`); today `canCheck`
  (`CodePanel.tsx:302`) has no such condition, harmless with one JS generator.
- **Template Editor**: one tab per (metamodel, generator) or one per metamodel with a generator selector. The
  first amends R-GEN-20 (provisional, `codegen_tpl_<metamodelId>`); recommended: per generator, id
  `codegen_tpl_<metamodelId>` kept for the default so open tabs and the opener keep working.
  `openTemplateEditor` and `selectInTemplateTab` gain an optional generator id (lazy chunk, no core).
- **Pill rule**: `setting.ts:79` also reads `genGenerators` (a key read; the module keeps zero generator imports).

## 7. Release boundary (question 7, measured, not decided)

Freeze Tuesday 2026-10-27 per `docs/discovery/discovery_2026-10-23_codegen_authoring.md:196` «Freeze Tuesday
2026-10-27.». The «release-3-2 discovery §4» the prompt cites is not in this tree (measured: `grep -rl
"2026-10-27" docs/discovery docs/prompts` finds the authoring report and three prompts only, the positive
control being the authoring hit).

- **Ship 3.2 with `genTemplates`, generators in 3.3.** Under (c): migration cost zero, file rebuild zero, test
  change zero; every 3.2 project is a valid 3.3 project. The only debt is UI. Under (a)/(b): a migration owed by
  3.3 over every 3.2 project and the four shipped files, plus the R-GEN-3 amendment.
- **Change persistence before the tag.** Under (c): G1 (codec, about 2 files + test) is small and inert without
  G2..G4; shipping G1 alone gives users nothing. G1..G4 is four lanes touching `CodePanel.tsx` (726 lines) and
  `TemplateEditorTab.tsx` (450 lines), the two files the 3.2 smoke covers, inside two working days. Under (a)/(b):
  a core change (rule 5) and the RC-26 amendment before a freeze.

The measured asymmetry: under (c) waiting costs nothing in data, so the before-the-tag option buys only the
feature, at the risk of the two hottest codegen files the week of the freeze.

## 8. Slices (question 8)

None touches the critical zone (§3.1 list) or an exported core interface. Gates every slice: `npm run typecheck`
exit 0, `npm run build`, vitest `src/codegen src/jjel`, `check:codegen-lazy` on and off, `importable.test.ts`
unchanged.

- **G1 codec** — DOVE `codegen/engine/generatorCodec.ts` (new), its test. `readGenerators(lookup, mmId)` (default
  from `genTemplates` + `genGenerators`), `generatorsPatch(rawTemplates, rawGenerators, next)` returning one
  `state` delta. Probes, each with the mutation it kills: a 3.2 string reads as the default generator with its
  templates in order (mutant: default ignored when `genGenerators` absent); saving a non-default generator leaves
  `genTemplates` byte-identical (mutant: the default rewritten); two generators with a template of the same name
  decode independently (mutant: one name set across generators); an unchanged list writes nothing (mutant: patch
  always returned); a bad generator is one defect and the others decode (mutant: whole key unreadable).
- **G2 generate per file** — DOVE `engine/generate.ts` or a sibling `generateFiles.ts`, test. One result per
  declared file, a generator id on the result, `target` from the generator (`js` or none) instead of
  `generate.ts:93`'s constant. Probe: the default generator of turnstile and petri produces code, map and errors
  sha256-identical to today (mutant: the root fallback changed); a generator with target none has `target` null
  (mutant: `jsTarget` always built).
- **G3 Code panel** — DOVE `ui/CodePanel.tsx`, `setting.ts`, tests. Chooser, new/rename/delete, file tabs, Run and
  Check by target. Probes: `codePillVisible` true with only `genGenerators` (mutant: key not read); Check disabled
  on a non-js generator (mutant: condition dropped); `probe/codegen-panel.ts` extended, visual check owed (RC-23).
- **G4 Template Editor** — DOVE `ui/TemplateEditorTab.tsx`, `ui/openTemplateEditor.ts`, `ui/templateDrafts.ts`.
  Per-generator tab, default keeps `codegen_tpl_<metamodelId>`. Probe: Save in generator B leaves A's key bytes
  (mutant: save writes the list of the tab's first generator).
- **G5 tree (optional)** — DOVE `TreeViewSidebar/TreeViewContent.tsx`, `concernCounts.ts` (hot area, §2.5):
  a «Generation» concern under VIEWPOINTS, setting on only, by key read. Out of the codegen tree: its own lane.

Rule 19: G3 may reach 5 files with its tests; declare them in the prompt.

## 9. Dependencies and risks

- (c) diverges from the letter of Alfonso's direction («lives in a viewpoint»): it keeps the concept (a concern,
  several, selectable) and drops the D-type. The veto restores (b), at the costs of §4 and §5.
- Two «main»s (template `main`, JS `main()`, §1.3) become two declarations (root, Run function); a generator
  whose root is not `main` keeps working.
- Undo of a `genGenerators` key added for the first time: a removed bag key's undo does not restore it
  (R-SIM-99, `templateCodec.ts:14`); the codec never removes, as today.
- Unprobed under (b): how the loader treats an `idlookup` object whose `className` has no registered class (the
  case of a lazy-registered `DGenerator` with the setting off). Not needed under (c).
- R-VAL's orphan-rules debt (`validationTypes.ts:62-70`) is what (b) would inherit for templates.

## 9.1 Decisions taken (unattended)

Marker on every row: `provisional, unattended` (RC-25). Numbered after the highest R-GEN id found, R-GEN-30
(measured: `grep -oh "R-GEN-[0-9]\+"` over `docs/decisions.md`, the 2026-10-23 codegen reports, `docs/log-inbox/codegen.md`,
the 2026-10-23 prompts and `frontend/src/codegen`; R-GEN-24 is taken by the authoring report §6). Not written
into `docs/decisions.md`. Most consequential first.

- **R-GEN-31.** A generator is a concern of its own, several per metamodel, selectable and independent, stored as
  a record of the metamodel's `_state`, not as a `DViewPoint` nor a new D-type. Evidence §3.2, §3.4, §4.
- **R-GEN-32.** `genTemplates` is the template list of the default generator, unmoved; no migration, R-GEN-3 and
  R-GEN-12 hold as written. Other generators and the default's metadata live in one key `genGenerators`
  `{"v":1,"generators":[...]}`, written through the `state` setter, one undo step per Save. Evidence §5.
- **R-GEN-33.** A generator declares `name`, `root` (an entry template), `files` (path → entry template) and
  `target` (`js` or none); absent metadata reads as root `main` else the first template, one file. Evidence §1.3, §1.5.
- **R-GEN-34.** The STC is the metamodel's and is not declared per generator; `target` is (amends working-model
  point 5). Evidence §1.4.
- **R-GEN-35.** Check runs only on a generator whose target is `js`; Run calls `main()` of its `js` file. Evidence §6.
- **R-GEN-36.** The provenance triple is unchanged; the generator id is carried by the generation result and by
  the Template Editor's tab and opener, not by each fragment. Evidence §2.
- **R-GEN-37.** One Template Editor tab per (metamodel, generator); the default keeps `codegen_tpl_<metamodelId>`.
  Amends provisional R-GEN-20. Evidence §6.
- **R-GEN-38.** Slice order G1..G4, G5 in a lane of its own; G1 alone ships nothing visible. Evidence §8.

## 10. Decisions awaiting Alfonso

1. The release boundary (RC-26, what ships): 3.2 with `genTemplates` as is and generators in 3.3, or G1..G4 before
   the 2026-10-27 freeze. Measured cost in §7. Recommended: ship 3.2 as is; under R-GEN-32 deferring costs no
   migration.
2. The push of this branch (RC-26).

## 11. Files read

`frontend/src/codegen/engine/templateCodec.ts`, `engine/generate.ts`, `engine/templates.ts:44-58`, `engine/text.ts:1-60`,
`engine/origin.ts:36-60`, `setting.ts`, `stcAccess.ts:153-165`, `ui/CodePanel.tsx:205-274` (and greps),
`ui/TemplateEditorTab.tsx` (greps), `examples/__tests__/importable.test.ts:1-80`;
`frontend/src/view/viewPoint/viewpoint.ts`, `frontend/src/view/viewElement/view.tsx:194-263` (and greps),
`frontend/src/joiner/classes.ts:2356-2402`, `:3483-3500` (and greps), `frontend/src/redux/selectors/selectors.ts:89-95`, `:530-569`,
`frontend/src/redux/reducer/reducer.ts:460-472`, `frontend/src/components/editor-v2/Toolbar.tsx:268-307`,
`frontend/src/components/megamodel/MegamodelView.tsx:140-180`, `frontend/src/components/project/ProjectEditor.tsx:1195-1235`,
`frontend/src/components/TreeViewSidebar/concernCounts.ts:40-60`, `frontend/src/model/validation/validationTypes.ts:1-209`,
`frontend/scripts/gates/check-codegen-lazy.ts` (greps); `docs/decisions.md` (R-IRN-10, R-DMV-1..7, R-VAL-6-bis, R-VAL-19),
`docs/spec/claude_spec_2026-10-10_code_generation_pilot.md:55-66`, `:100-112`,
`docs/spec/claude_spec_2026-09-08_user_defined_validation.md` (viewpoint greps),
`docs/discovery/discovery_2026-10-23_codegen_authoring.md` §6, `:196`; the four `.jjodel` files named in §1.1 (decompressed).
