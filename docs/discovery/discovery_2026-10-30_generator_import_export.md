# Discovery 2026-10-30: generator import and export as JSON (Phase 1)

- Prompt-ID: P-2026-10-30-1430
- Prompt file: `docs/prompts/claude_2026-10-30_1430_prompt_generator_import_export.md`
- Session: b59ba036-9f2a-4385-b697-e62240ceaae1
- Tree: `~/jjodel-w-genio`, branch `gen-io`, HEAD 4a5921479 (= `cg-generators` 87cbac5b7 + the prompt commit)
- Executor: Opus 5.5 (claude-opus-5-5)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

- The base (`gen-io`, from `cg-generators`) stores several generators per metamodel (`genTemplates` for the default one,
  `genGenerators` for the others, `engine/generatorCodec.ts`), not one template list: H1 is falsified on the base.
- The Code panel and the preview use the generator's declared files and root, not a template named `main` (H2 falsified);
  the name check, the call walkers and the download/upload helpers exist but were private or unexported (H3, H4 partly; H5 holds).
- The two acceptance generators (SMV, Verilog) were not reachable from this machine (H7 falsified); the type name `GeneratorFile` was taken.
- Phase 2 (P-2026-10-30-1515, 7fbedcc78, 03db53f3f, 9d844eca3) built the file format, decode, validate and plan (`generatorFile.ts`),
  Import/Export in the Templates tab, and a lazy GENERATORS dashboard section; it shipped on unit and fixture tests.
- Open: visual check, byte comparison against the hand-entered generators, and the SyncRTL model export, which holds no Expr objects.

## Objective

Establish, before any code, the storage shape the lane builds on, the entry convention, the reusable name check,
call walker, download/upload helpers and dashboard section pattern, the location of the acceptance generators, and
that the new identifiers are free (prompt §COME Phase 1, items 1-8).

## Pre-check (prompt header)

- `P-2026-10-30-1430` exists in `~/.jjodel-lanes/` and `docs/prompts/` only as this run's own artifacts: the lane
  folder was created 14:31 with one `start` record in `runs.jsonl` (`"at":"2026-10-30T14:31:22+0100"`), and the
  prompt file was committed by 4a5921479 at 14:31:05. Measured. Not a prior run, so not a collision.
- `git log --all -n 10 -- 'docs/prompts/*2026-10-29_1650*'`: empty, exit 0. Positive control, same command form on
  `*2026-10-30_1430*`: returns 4a5921479. Measured.

## Hypotheses under test

| # | Hypothesis (from the prompt) | Verdict |
|---|---|---|
| H1 | The storage the lane builds on is one template list per metamodel | **Falsified on the base** (`gen-io`/`cg-generators`); holds on the local trunk |
| H2 | The Code panel and the preview look for a template named `main` | **Falsified**: they use the generator's declared files and root |
| H3 | `templates.ts` has a name check that can be reused, possibly without keywords | Partly: the check covers keywords already, but it is private |
| H4 | An existing walker of a parsed body for call nodes is reusable | Partly: three exist, none exported |
| H5 | Download and upload helpers exist to reuse | Holds |
| H6 | `ProjectEditor` builds sections with `SectionHeader` and `EmptyState`; `LeftBar` may link them | Holds; LeftBar already has GENERATORS (3.3) |
| H7 | The two acceptance generators are reachable from this machine | **Falsified**: not found |
| H8 | The planned identifiers are free | Holds, except the type name `GeneratorFile`, taken |

## Files read (full paths)

- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/engine/generatorCodec.ts` (whole, 258 lines)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/engine/templateCodec.ts` (whole, 126)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/engine/templates.ts` (whole, 177)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/engine/generate.ts` (whole, 126)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/engine/generateFiles.ts` (whole, 53)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/ui/templatePreview.ts` (whole, 40)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/ui/TemplateEditorTab.tsx` (lines 1-215, 330-507, 596-830 of 831)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/ui/openTemplateEditor.ts` (lines 1-60 of 129)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/ui/generatorTabs.ts` (lines 99-117, grep)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/ui/templateCompletion.ts` (lines 175-219)
- `/Users/alfonso/jjodel-w-genio/frontend/src/codegen/setting.ts` (whole, 126)
- `/Users/alfonso/jjodel-w-genio/frontend/src/jjel/types/tokens.ts` (lines 100-149)
- `/Users/alfonso/jjodel-w-genio/frontend/src/jjel/types/ast.ts` (lines 20-55, 140-189)
- `/Users/alfonso/jjodel-w-genio/frontend/src/jjel/lexer/lexer.ts` (lines 620-649)
- `/Users/alfonso/jjodel-w-genio/frontend/src/jjel/evaluator/context.ts` (lines 330-504)
- `/Users/alfonso/jjodel-w-genio/frontend/src/jjel/evaluator/evaluator.ts` (lines 105-184)
- `/Users/alfonso/jjodel-w-genio/frontend/src/model/simulation/subsetChecker.ts` (lines 190-225)
- `/Users/alfonso/jjodel-w-genio/frontend/src/model/simulation/stcChecks.ts` (lines 80-109)
- `/Users/alfonso/jjodel-w-genio/frontend/src/components/project/ProjectEditor.tsx` (lines 100-204, 995-1074, 2850-2969, 3150-3206 of 3206)
- `/Users/alfonso/jjodel-w-genio/frontend/src/pages/components/LeftBar.tsx` (lines 320-379 of 682)
- `/Users/alfonso/jjodel-w-genio/frontend/src/common/U.tsx` (lines 882-887, 1770-1797)
- `/Users/alfonso/jjodel-w-genio/frontend/src/components/ConfirmDialog/ConfirmDialog.tsx` (lines 4-30)
- `/Users/alfonso/jjodel-w-genio/frontend/scripts/gates/check-codegen-lazy.ts` (grep, lines 7-49)
- `/Users/alfonso/jjodel-w-genio/docs/log-inbox/codegen.md` (lines 134-335 of 335)
- `docs/decisions.md` through `npm run decisions` for R-GEN-2, 3, 12, 23, 25, 31, 32, 33, 34, 36, 42

## Findings

### 1. Storage (H1 falsified on the base)

Measured with `git ls-tree --name-only <branch> frontend/src/codegen/engine/`:

- local trunk `alfonso-frontend-jjtl` 37956343a and `origin/alfonso-frontend-jjtl` 3addb64cf: `generate.ts indent.ts
  origin.ts templateCodec.ts templates.ts text.ts`, no `generatorCodec.ts`: one flat list per metamodel, as the
  prompt expected;
- `cg-generators` 87cbac5b7, the base of `gen-io`: adds `generateFiles.ts generatorCodec.ts`. `cg-generators` is 55
  commits ahead of the trunk, and the trunk has moved past its fork point (`merge-base --is-ancestor` false).

The lane builds on `cg-generators` (prompt §Base branch), and there a metamodel stores **several generators**
(G1 of 3.3, P-2026-10-24-0001, R-GEN-31, R-GEN-32 ratified). Read, gen-io:

- `frontend/src/codegen/engine/generatorCodec.ts:6-10`: «The template list of the default generator is
  `genTemplates`, unmoved [...] Every other generator, and the default's metadata, live in one key `genGenerators`, a
  JSON string `{"v":1,"generators":[generator...]}`, a generator being `id`, `name`, `root` when it has one, `files`,
  `target`, and `templates` for a generator other than the default».
- `generatorCodec.ts:56-64`, the decoded shape: `id`, `name`, `root?`, `files: readonly GeneratorFile[]`
  (`{path, entry}`, :50-53), `target: GeneratorTarget` (`'js' | 'none'`, :47), `templates`.
- `generatorCodec.ts:40-44`: `DEFAULT_GENERATOR_ID = 'default'`, `DEFAULT_GENERATOR_NAME = 'Default'`.
- `generatorCodec.ts:14-18`: absent metadata reads «`root` the template `main`, else the first [...] `files` one file
  whose entry is the root, `main.js` for the default and named after the generator otherwise [...] `target` `js` for
  the default and `none` for the others».
- The one-write path already exists and is the one «Save» uses: `generatorsPatch(rawTemplates, rawGenerators, next)`
  (`generatorCodec.ts:202-217`), «one `state` assignment holding `genTemplates` only when the default's templates
  change, and `genGenerators` only when a generator's metadata or a non-default list changes; `null` when nothing
  changes». Save goes through `saveGeneratorTemplates` (`ui/generatorTabs.ts:99-108`) then
  `LPointerTargetable.fromPointer(metamodelId).state = patch` (`ui/TemplateEditorTab.tsx:393-399`). New/Rename/Delete
  of a generator write one `generatorsPatch` each (`TemplateEditorTab.tsx:112-125, 409-420`).
- Names: two generators of one metamodel may hold a template of the same name (`generatorCodec.ts:12`); the codec does
  not require generator names to be unique (it checks ids only, :173), but the UI makes fresh ones
  (`TemplateEditorTab.tsx:100-105`, `generator<n>`).

Consequence: the prompt's own rule applies — «If the trunk already stores several generators per metamodel: stop at
the hard stop and report the storage shape; the collision rule becomes Replace / Import under a new name / Cancel».
`templatesPatch` alone (the prompt's write path) is correct only for the default generator; for any other it is
`generatorsPatch` (or `saveGeneratorTemplates`), still one `state` set and one undo step.

### 2. Entry template (H2 falsified)

- Generator pane (Preview, Run, Check): `ui/GeneratorPane.tsx:189` `generateGenerator(evalGlobals(lookup, targetId),
  lookup, targetId, generator)`, which runs one `generate` per declared file with `f.entry`
  (`engine/generateFiles.ts:47-50`). The entry is the file's, resolved from `root` (`generatorCodec.ts:89-92, 104-106`).
- `ui/GeneratorPane.tsx:67` `const RUN_ENTRY = 'main';` is the JavaScript function the worker calls on a `js` target
  (:232 `calls: [{ fn: RUN_ENTRY, args: [] }]`), not a template name.
- `ui/templatePreview.ts:26-31` `previewEntry` (chosen, else `main`, else edited, else first) has no consumer outside
  tests: `grep -rn previewEntry frontend/src | grep -v __tests__` returns its definition only; the header of
  `TemplateEditorTab.tsx:38` says «the entry select gave way to the generator's declared files». Measured.

So the file's `entry` maps to the generator's `root`; refusing `entry != main` would refuse valid generators. The
format also needs `files` and the generator `target` (`js`/`none`) to round-trip a 3.3 generator: the prompt's shape
has neither, and the per-template `target` (`"smv"`, a free text on `TemplateRecord`, `templates.ts:43-50`) is a
different field from the generator's `target`.

### 3. Name check and keywords (H3 partly)

- `engine/templates.ts:78-81`, private: `const isIdentifier = (name) => { const { tokens, errors } = tokenize(name);
  return errors.length === 0 && tokens.length === 2 && tokens[0].type === JjelTokenType.IDENTIFIER &&
  tokens[0].value === name; }`.
- `templates.ts:117-124`: `if (!isIdentifier(name)) ... 'is not an identifier'`; `if (root.hasBuiltin(name)) ... 'is
  a JjEL builtin'`.
- Keywords are already covered: `jjel/lexer/lexer.ts:632-646` lowercases and looks up `JJEL_KEYWORDS_OWN`, emitting the
  keyword's token (or `BOOLEAN`/`NULL`) instead of `IDENTIFIER`, so `not`, `implies`, `Not`, `true`, `null` all fail
  `isIdentifier`. `JJEL_KEYWORDS` is exported from `jjel/types/tokens.ts:108-127` (18 keywords) and re-exported by
  `jjel/index.ts:28` (`export * from './types'`). No keyword list needs copying. Read.
- Builtins: `new JjelEvaluator(ctx)` registers the global builtins on its context (`jjel/evaluator/evaluator.ts:131-180`:
  `now today date datetime parseDate String Number Boolean Array bits sbits`); `EvaluationContext.hasBuiltin`
  (`jjel/evaluator/context.ts:500-502`). A pure validator can build `new JjelEvaluator(new EvaluationContext())` and
  ask the context. Read.
- Whole-engine reuse is possible without exporting anything: `registerTemplates(records, ctx, evaluator, host,
  sources)` (`templates.ts:98-177`) returns `problems` with positions for duplicates, non-identifiers, builtins, parse
  errors (line, column) and `with … do` (:132-140, a refusal the prompt did not list). It needs an `OriginHost` and
  `TemplateSources` (`engine/origin.ts`), engine-only.

### 4. Call walker (H4 partly)

- Call node: `jjel/types/ast.ts:173-177` `interface FunctionCallExpr { type: 'FunctionCall'; name: string; args }`;
  method calls are `MethodCall`/`NullSafeMethodCall` (:147-164), not template calls.
- Walkers exist, all module-private: `model/simulation/subsetChecker.ts:193` `function children(e)` (exhaustive switch
  with the names each child binds); `codegen/ui/templateCompletion.ts:183` `function walk(...)`, which already calls
  `onCall` at each `FunctionCall` (:205) and tracks Lambda/ForAll/Exists binders (:189-204); `stcChecks.ts:86`
  `function walk(...)`. Exporting one touches a file outside DOVE (`subsetChecker.ts` is in the simulation module;
  `templateCompletion.ts` imports `Monaco` types from the joiner, :29, so the engine cannot import it).

### 5. Download and upload (H5 holds)

- `common/U.tsx:1784-1797` `static download(filename, text, mimeType = 'text/plain')`: Blob, hidden anchor, click,
  revoke; `U.toFileName` (:882-887) replaces `\ / : * ? < > " |`. Used by the project exports
  (`ProjectEditor.tsx:592` `U.download(filename, jsonString)`). Note: the Blob is built with `endings: 'native'`
  (:1788); bodies are inside JSON strings, so their `\n` are escaped and unaffected.
- Upload: hidden `<input type="file">` with a ref (`ProjectEditor.tsx:3195-3201`), opened by `ref.current?.click()`
  (`handleImportXmi`, :1014-1017), read with `await file.text()` (:912), the input reset after (:1070-1072).

### 6. Dashboard section and left bar (H6 holds)

- `ProjectEditor.tsx:141-178` `SectionHeader({ title, count, primaryAction, secondaryAction, children })`: `children`
  render before the two actions, so a header can carry three buttons. TRANSFORMATIONS (:2857-2881) is
  `SectionHeader` + `EmptyState` (`icon`, `title`, `description`, `action`) + a list; VIEWPOINTS (:2883-2961) rows are
  `list-card__item` with `list-card__icon`, `list-card__content` (`__name`, `__type`) and `list-card__actions` of
  `icon-btn`. Section ids `section-transformations`, `section-viewpoints`.
- `ProjectEditor.tsx` imports nothing from `src/codegen/` (grep `codegen` in the file: no hit; positive control
  `EmptyState` import at :48). It is eager code: the lazy gate (`scripts/gates/check-codegen-lazy.ts:49`
  `EAGER_ALLOWED = 'src/codegen/setting.ts'`) turns red if any other codegen module enters the entry's closure
  (R-GEN-2). The left bar's precedent (`LeftBar.tsx:325-342`): rows from `setting.ts` `generatorEntries` (id and name
  only, `setting.ts:102-126`), shown only when `useCodegenEnabled() && !isConsumerMode()` (R-GEN-42, R-GEN-23), the
  tab reached through `import('../../codegen/ui/openTemplateEditor')`.
- `generatorEntries` gives no template count; a count needs the codec (lazy) or a lightweight read added to
  `setting.ts` (outside DOVE).
- LeftBar: its sections list items (Metamodels, Models, Transforms, Viewpoints, Generators), they are not links to
  dashboard sections. The GENERATORS entry of 3.3 already exists (`LeftBar.tsx:491-496`). No LeftBar change needed.
- `ConfirmDialog` (`components/ConfirmDialog/ConfirmDialog.tsx:4-13`): two buttons, `message: string`. A three-way
  collision (Replace / Import under a new name / Cancel) and a problems list with «Import anyway» do not fit it as is.

### 7. Acceptance generators (H7 falsified)

Searched, all measured:
- repo history: `git log --all -S 'smvModule'` returns 4a5921479 only (this prompt);
- tree: `grep -rli 'nuxmv\|smvModule'` over `frontend/src frontend/scripts docs`: simulator and printer files only,
  no generator fixture; `codegen/examples/` holds `turnstile` and `petri-producer-consumer` only;
- `~/Downloads`: no `.jjodel` modified in the last 30 days contains `genTemplates` or `genGenerators` (exit 0;
  positive control, same `find | xargs grep -l` on `metamodels`: three hits). `VerilogMM.jjodel` (2026-10-21) has
  neither key. `Verifica con nuXmv requisiti.docx` (2026-10-03) mentions nuXmv 28 times and no template.

The two generators were probably entered in a browser project (local storage of a dev server), which this phase
cannot read. Whether they belong to the same metamodel is unknown. On the base storage that no longer matters for
acceptance: one metamodel can hold both as two generators.

### 8. Identifiers (H8 holds, one exception)

`grep -rl` over `frontend/src frontend/scripts`, no hit for: `generatorFile`, `encodeGeneratorFile`,
`decodeGeneratorFile`, `validateGenerator`, `generatorTransfer`, `generators-section`, `jjodel-generator`,
`GENERATOR_FILE_FORMAT`, `exportGenerators`, `importGenerators`, `GeneratorsSection`. Positive control
`templatesPatch`: three files. **`GeneratorFile` is taken** (`generatorCodec.ts:50`, an output file `{path, entry}`):
the file-format types need another name (e.g. `GeneratorDocument`). Measured.

## Dependencies and risks

1. Building the prompt's single-list rules on `gen-io` would write the default's `genTemplates` only, and would
   collide with the existing generator records (names, ids, `files`, `target`) the codec and the tab read.
2. A file without `files` and generator `target` re-imports a non-default generator as target `none` with one file
   `<name>.txt` (`generatorCodec.ts:95-98, 104`): a `js` generator would lose Run and Check (R-GEN-35).
3. The dashboard section is eager code: any static import from `codegen/` but `setting.ts` breaks the lazy gate.
4. Byte identity of a round trip holds per key: `generatorsPatch` compares decoded keys, so an import that equals the
   stored generators writes nothing; a replace of a non-default generator rewrites `genGenerators` canonically.
5. Out of DOVE, likely needed: `templates.ts` (export the name check) or none if `registerTemplates` is reused; an
   exported walker (`subsetChecker.ts`) or a local one in the new module; `ConfirmDialog.tsx` (optional third button)
   or a dialog of our own in `generatorTransfer.ts`; possibly `setting.ts` for counts.

## Questions for Alfonso

1. Storage: the base stores several generators per metamodel. Proceed with the multi-generator rules (Replace /
   Import under a new name / Cancel, write through `generatorsPatch`)?
2. Format: add the generator's `files` (`[{path, entry}]`) and `targetProfile` (`js`/`none`) to the file, written
   always and optional on import (absent read as the codec reads absent metadata), with `entry` mapped to `root`?
3. Collision key: a generator collides when the target metamodel has a generator of the same name (the default
   matching `Default` or its stored name); «Import under a new name» picks `<name> 2`, `<name> 3`, ...?
4. Importing into the default generator: allowed (Replace writes `genTemplates` and its metadata), or a file always
   imports as a new non-default generator unless the user chooses Replace?
5. Name validation: reuse `registerTemplates`' own problems (which also refuse `with … do`), so no edit to
   `templates.ts`?
6. Call walker: a local walker in `generatorFile.ts` (calls under Lambda/ForAll/Exists binders excluded), rather than
   exporting `subsetChecker.ts`'s `children`?
7. Dialogs: a small dialog component in `codegen/ui/` for the problems list and the three-way collision, leaving
   `ConfirmDialog.tsx` untouched?
8. Dashboard: the GENERATORS section shown only with the setting on and not in consumer mode (R-GEN-42, R-GEN-23), its
   body a lazy component in `codegen/ui/` (new file) so counts come from the codec and the lazy gate stays green?
9. Templates tab: Import and Export as icons in the generator's actions (`codegen-tpl__generator-actions`, beside
   New/Rename/Delete), rather than beside «Save» in the template row?
10. Acceptance: send the two hand-entered generators (or the project files holding them); until then Phase 2 ships on
    the unit tests?
