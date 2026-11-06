# Discovery — Generators panel export anomalies and three import behaviours

- Prompt-ID: P-2026-10-31-1342 (`docs/prompts/claude_2026-10-31_1342_prompt_generators_export_and_import_anomalies.md`)
- Chat: C-2026-10-31-1328 · session f0341402-77ec-4e7c-8dfd-908173238042
- Tree: `~/jjodel-w-genanom`, branch `gen-anomalies`, HEAD `62537f5cb`
- Executor: Opus 5.5 (`claude-opus-5-5`)
- Phase 1, read-only. This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## Objective

For each of the six observations: reproduce it (node probe or code reading, stated per point), give the root cause with
`file:line`, propose the Phase 2 split and the decisions that need Alfonso.

## Method

- **measured**: a throwaway vitest probe, `frontend/src/codegen/engine/__tests__/_tmp_genanom.test.ts`, run once through
  `scripts/run-quiet.mjs` on HEAD `62537f5cb` (exit 0; log `.agent-logs/genanom-probe-20261031-133717.log`, output in
  `/tmp/genanom-probe.txt`), then deleted. It drives the pure functions the generator tab calls, in the tab's order:
  `addGenerator` + `generatorsPatch` (as `createGenerator`), `freshName` copied verbatim from
  `TemplateEditorTab.tsx:233`, `saveGeneratorTemplates` (as `addTemplate`/`write`), `editDraft` (typing), `applyDrafts`
  (Save), `generatorDocument` (Export), `decodeGeneratorFile` (re-import). The React component itself is not run.
- **read**: everything else. No app run, no browser.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/engine/generatorFile.ts` (whole)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/engine/generatorCodec.ts` (whole)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/generatorTransfer.ts` (whole)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/templateDrafts.ts` (whole)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/CodePanel.tsx` (whole)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/TemplateEditorTab.tsx` (lines 1-295, 330-544, 636-770, 836-846)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/generatorTabs.ts` (lines 85-144)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/GeneratorImportDialog.tsx` (lines 60-104, plus grep)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/GeneratorPane.tsx` (lines 150-200, plus grep)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/templatePreview.ts` (lines 1-30)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/conformingModels.ts` (grep)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/ui/TemplateEditor.tsx` (grep)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/codegen/engine/templateCodec.ts` (grep)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/components/project/ProjectEditor.tsx` (lines 966-1088)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/services/export/XMIService.ts` (lines 30-80, 548-609, 644-680, 940-975, 1020-1160)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/services/export/EcoreService.ts` (lines 585-650)
- `/Users/alfonso/jjodel-w-genanom/frontend/src/api/data.ts` (grep on `EcoreParser.parse`)
- `/Users/alfonso/jjodel-w-genanom/docs/decisions.md` (lines 6120-6230, R-GEN-20..43)

## Hypotheses and verdicts

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | The top-level `entry` is stale: not updated on a template rename, nor tied to `files`. | **Holds** (measured). |
| H2 | An import creates placeholders and fails to fill them. | **Falsified** (read). The placeholders are the panel's own «New template» writes; the names and bodies were unsaved drafts. Reproduced exactly (measured). |
| H3 | The importer or the editor changed `temporal` from expression to text. | **Falsified** as a change (read): a template created in the panel is born `text` (R-GEN-25) and stays so unless the Mode select is used. |
| H4 | After a metamodel delete the generator tab keeps generating. | **Partly** (read): the tab has no reaction to the delete beyond a hint; whether the preview still generates depends on which generator the tab holds. |
| H5 | XMI import instantiates the abstract supertype when `xsi:type` names a missing class. | **Holds** (read). |
| H6 | Ecore import with an nsURI already loaded does not replace the loaded metamodel. | **Holds** (read): it never checks, it always adds a second metamodel. |

## Findings

### 1. Top-level `entry` stale against `files` (measured)

The file's `entry` is the generator's `root` (`generatorFile.ts:112`, `...(g.root !== undefined ? { entry: g.root } : {}),`).
`root` is resolved when absent (`generatorCodec.ts:89-92`, «The root a generator with no declared one reads: `main`, else
the first template, else none»), and once any later write re-encodes the decoded record the resolved value is written
as declared (`generatorCodec.ts:121`, `...(g.root !== undefined ? { root: g.root } : {}),`; header line 18, «Once written,
the resolved metadata is the declared one»).

A new generator is born with a file whose entry is `main` and no root (`generatorCodec.ts:257`,
`files: [{ path: fallbackPath(id, name, 'none'), entry: 'main' }], target: 'none', templates: []`). Its first template is
`template1`, so the fallback root is `template1`, not `main`. Probe output:

```
after create, stored g1 = {"id":"g1","name":"generator1","files":[{"path":"generator1.txt","entry":"main"}],"target":"none","templates":[]}
stored g1 after 2nd New = {"id":"g1","name":"generator1","root":"template1","files":[{"path":"generator1.txt","entry":"main"}],...
```

The second «New template» froze `root: "template1"`. Nothing rewrites `root` or `files[].entry` when Save renames a
template: `applyDrafts` (`templateDrafts.ts:108-125`) rewrites template records only, and `saveGeneratorTemplates`
(`generatorTabs.ts:107`) replaces only `templates`. After Save renames `template1` to `main`:

```
export after Save: entry= template1 files= [{"path":"generator1.txt","entry":"main"}] names= main:text cls:text ...
re-import problems: ["The entry 'template1' is not a template of the generator."]
```

So the observed file with no `template1` and `entry: "template1"` is the same generator after a Save, and **it cannot be
imported back**: `validateGenerator` makes a stale entry an error (`generatorFile.ts:193-195`). This breaks the overall
expectation export → import → export.

The default generator has the same defect (measured): a 3.2 project whose `genTemplates` has no `main` freezes the
default's `root` and `files[0].entry` to its first template the first time `genGenerators` is written (for instance by
«New generator»):

```
default record after first New generator = {"id":"default","name":"Default","root":"a","files":[{"path":"main.js","entry":"a"}],"target":"js"}
default after rename a->main: root= a files= [{"path":"main.js","entry":"a"}]
```

Consumers of `root` (read, grep `\.root\b` over `codegen/` and `components/`, excluding tests): only
`generatorCodec.ts:121,175,180` and `generatorFile.ts:112,193,194,307`. No generation path reads it; generation runs on
`files`. Positive control: the same grep returned the `simStateUsage.ts:226` and `Tooltip.tsx:58` hits outside codegen.
`root` is therefore an exported and validated field that nothing else uses, and it drifts.

The file that round trips (24 templates, three files) was imported from a file with consistent metadata: `resolveImported`
copies `root` and `files` as declared (`generatorFile.ts:303-315`), and nothing renames in between. Points 1 and 3 do
concern only generators edited in the panel, as the prompt suspected.

### 2. Ten empty placeholders template1, template3, ..., template19 (measured)

Every path that creates a template named `template<N>` (grep `template\$\{` and `mode: 'text'` over `src/`, tests
excluded): one, `TemplateEditorTab.tsx:233-237`

```
function freshName(taken: ReadonlySet<string>): string {
    let n = taken.size + 1;
```

called by `addTemplate` (`TemplateEditorTab.tsx:479-484`), which writes the empty record at once:

```
const taken = new Set([...templates.map(t => t.name), ...Object.values(drafts).map(d => d.name.trim()), ...Object.keys(drafts)]);
const name = freshName(taken);
write([...templates, { name, params: [], body: '', mode: 'text' }]);
```

«New template» writes immediately (header line 25, «New template and Delete write at once»); typing a name and body is a
draft (line 22, «Typing writes nothing»). A draft that renames `template1` puts both `template1` (its key) and its new
name into `taken`, so `taken.size` grows by two per template and the next name skips one: 1, 3, 5, ..., 19. Probe, ten
New + type a name and body, no Save, then Export:

```
export with drafts unsaved: entry= template1 files= [{"path":"generator1.txt","entry":"main"}] templates= template1:text:"" template3:text:"" ... template19:text:""
```

This is the observed file byte for byte in shape. Export reads the stored list, never the drafts
(`generatorTransfer.ts:5`, «Export reads the stored generators (never a tab's drafts)»); the only notice is the button's
tooltip (`TemplateEditorTab.tsx:431-435`). Drafts survive outside writes (`templateDrafts.ts:72-84`, `followStore` keeps
a dirty draft), so the sequence is stable. The ten named bodies were entered by hand and never saved (or saved later, see
point 1: the second observed file fits a Save of the same generator).

Can an import create placeholders and stop? No (read). `decodeGeneratorFile` builds every template record before any write
(`generatorFile.ts:274-280`), `planImport` returns no writes when any error exists (`generatorFile.ts:419`), and the
dialog writes only a plan with no error (`GeneratorImportDialog.tsx:67-71`, `generatorTransfer.ts:76-80`). The import never
calls `freshName`. Positive control for the write-site grep: it listed the known sites `generatorTabs.ts:107`,
`TemplateEditorTab.tsx:122,405,419,439,482`, `generatorFile.ts:415`.

Side finding (read): `codegen/ui/TemplateEditor.tsx` is imported by no file (grep `from './TemplateEditor'` and
`ui/TemplateEditor'` over `frontend/src`: no hit; control: the same grep shape finds `./TemplateEditorTab` imports). Left as
is (Rule 9).

### 3. `temporal` stored as `text` (read)

R-GEN-25: «Templates created in the panel and in the Template Editor are `text`». The record is born `mode: 'text'`
(`TemplateEditorTab.tsx:482`); typing an expression body in it changes the body only (`editDraft`, `templateDrafts.ts:65-69`),
and the mode moves only through the Mode select (`switchMode`, `TemplateEditorTab.tsx:493-501`). The importer keeps `text`
and stores everything else with no mode (`generatorFile.ts:278`); the template codec refuses any other mode
(`templateCodec.ts:90`). So no importer or editor changed the mode: the template was created in the panel and its
expression body was typed into a text template. The engine then prints it verbatim, as text mode must. Not a defect of the
code against the decisions; it is a usability gap of R-GEN-25.

### 4. Metamodel deleted, generator tab still alive (read)

The tab reads `exists` and the generator from the store (`TemplateEditorTab.tsx:339-343`):

```
const exists = useSelector((state: any) => !!state.idlookup?.[metamodelId]);
...
const generator = decoded.generators.find(g => g.id === generatorId) ?? null;
```

With the metamodel gone both keys read `undefined`, `decodeGenerators` returns the default alone with no template
(`generatorCodec.ts:152`). Then:

- a non-default generator: `generator` is null, the selector shows `` `${generatorId} (gone)` `` (`TemplateEditorTab.tsx:667`,
  the **id**, not the name), the pane is replaced by an empty section (`TemplateEditorTab.tsx:842-846`);
- the default generator: it is still found, with the drafts merged in (`previewTemplates`, `templatePreview.ts:21-22`),
  so `previewGenerator` is non-null and `GeneratorPane` keeps generating every `PREVIEW_DELAY_MS`
  (`GeneratorPane.tsx:180-197`) over the models whose `instanceof` still names the gone id
  (`conformingModels.ts:16`, `lookup[id].instanceof === metamodelId`).

The only signal is the hint `This metamodel is gone: its templates cannot be saved.` (`TemplateEditorTab.tsx:756`); New,
Rename, Delete, Import, Export and New template are disabled by `exists`, the preview is not. Nothing closes or redirects
a generator tab on a metamodel delete: the only `closeTab` calls in `codegen/` are `TemplateEditorTab.tsx:189,441,518,857`
(close button, generator delete, request close, confirm). The observation («<name> (gone)» and a live preview) mixes the
two cases; which one Alfonso saw is not established without the app. Whether a metamodel delete also deletes its models was
not traced (open question 5).

### 5. XMI `xsi:type` naming a missing class (read)

`processContainment` falls back to the feature's declared type when `xsi:type` resolves nothing
(`XMIService.ts:1049-1054`):

```
let childClass: LClass | null = XMIService.resolveDClass(xsiTypeRaw, ctx.metamodel, fallbackClass, ctx);
if (!childClass) {
    // Resolution failed (unknown prefix or unknown classname). Fall back to the
    // declared feature type rather than dropping the child silently.
    childClass = fallbackClass;
}
```

and instantiates it with no abstract check (`XMIService.ts:1067`, `DObject.new(childClass.id, containmentDValue.id, DValue,
undefined, true)`). `resolveDClass` logs `xsi:type '…' resolves no class in metamodel '…'` and returns null
(`XMIService.ts:1145-1151`). The children are then dropped because the abstract supertype lacks the subclass features:
`Unknown attribute "…" on class "…", skipped` (`XMIService.ts:836`) and `No feature "…" on class "…" — nested element
ignored` (`XMIService.ts:969-975`). Every one is a warning, so the summary is «Success with warnings»
(`ImportSummaryModal.tsx:30`). The root path has no abstract check either (`XMIService.ts:649-657`, `:672`). The guard at
`XMIService.ts:1059-1065` already skips a child with a warning when the class is not a subclass: that is the shape a fix
can follow. No test pins the fallback: the only tests that mention `XMIService` are `services/export/__tests__/ecore-io.test.ts`
and `redux/__tests__/versionfixer_2227_migration.test.ts` (`find src -path '*__tests__*' -name '*.test.ts' | xargs grep -l`,
the first being the positive control), and `importM1FromFile` is not exercised in node by either (not checked line by line).

### 6. Ecore import with an nsURI already loaded (read)

`handleEcoreFileChange` imports and appends unconditionally (`ProjectEditor.tsx:973-985`,
`project.metamodels = [...project.metamodels, result.model];`); `EcoreService.importFromXML` calls
`EcoreParser.parse(json, true, filename || 'imported', true)` (`EcoreService.ts:596`) and returns the new model. No nsURI
comparison exists on this path (grep `nsURI|already|exist|duplicate|replace` over `EcoreService.ts`: hits are export-side
only, lines 41-171 and 537). So today a second metamodel with the same nsURI is added; the old one is untouched, which
matches «did not replace». After that:

- an XMI whose default `xmlns` is that nsURI is refused, `Multiple metamodels with namespace '…' loaded … Please remove
  duplicates before importing.` (`XMIService.ts:575-582`);
- a **prefixed** `xsi:type` on that nsURI resolves `ambiguous`, so `model: null` (`XMIService.ts:40-44`), warning `does not
  match any loaded metamodel` and fallback to the declared type (`XMIService.ts:1136-1140`, then point 5). Points 5 and 6
  can be one session; not established.

Replacing on a collision is a behaviour change: models whose `instanceof` is the old metamodel would lose classes and
features they instantiate (dangling `DObject.instanceof`, values without a metafeature), and the generators, views and STC
stored on the old metamodel's `_state` would have to move or be lost. It needs Alfonso.

## Risks and dependencies

- Point 1 touches R-GEN-33 (ratified): «absent metadata reads as root `main` else the first template, one file». Changing what
  `root` is, or deriving it from `files`, amends a ratified row.
- A fix that keeps `root` must also handle Delete of the entry template and the default generator (`genTemplates` path).
- Relaxing the import's entry check (error to warning) would make existing stale files importable; tightening the export
  instead leaves files already exported unimportable.
- Point 5 changes what an import produces (fewer objects, more warnings): behaviour change of a committed importer
  (Rule 3), outside `codegen/`, under `services/export/CLAUDE.md`.
- Point 6 replacement path reaches the D-layer (deleting a metamodel's classes) and the project link: Rule 20 applies.

## Proposed Phase 2 split

- **Lane A, Generators panel (codegen only, `TemplateEditorTab.tsx`, `generatorCodec.ts`/`generatorTabs.ts`, maybe
  `generatorFile.ts`, tests)**: points 1, 2, 4, and 3 if a hint is wanted. Point 1: on Save, follow a rename into `root`
  and `files[].entry` (`savedNames`, `templateDrafts.ts:128-130`, already gives key → new name); make a new generator's
  root consistent with its file. Point 2: a placeholder name that does not count drafts twice, and an Export that warns
  about unsaved drafts. Point 4: no preview while `!exists`.
- **Lane B, XMI importer (`XMIService.ts`, a new test with an abstract supertype fixture)**: point 5 alone.
- **Lane C, Ecore importer**: point 6, only after Alfonso's decision; separate from B because it changes a different
  importer and possibly the D-layer.
- Identifiers grepped as free (0 files each over `frontend/src`, control `freshName` 5 files): `freshTemplateName`,
  `renameTemplateRefs`, `retargetGenerator`, `consistentRoot`, `skippedAbstract`, `abstractSkipped`, `ecoreCollision`,
  `findMetamodelsByNsURI`.

## Open questions

1. `root`/`entry`: keep it and make rename and delete follow it, or derive it from `files[0].entry` and stop storing it (amends R-GEN-33)?
2. Import of a file whose `entry` names no template: keep it an error, or make it a warning and drop the entry?
3. Export with unsaved drafts in the tab: export the stored list after a confirm, include the drafts, or refuse until Save?
4. Text-mode template whose body looks like an expression: leave as is (R-GEN-25), or show a hint suggesting Mode?
5. Metamodel deleted under an open generator tab: disable the preview, close the tab, or switch it to a live metamodel?
6. XMI `xsi:type` naming a missing class, or a declared type that is abstract: skip and count the objects in a warning, or fail the import?
7. Ecore import with an nsURI already loaded: refuse, warn and keep both, or offer Replace (with the loss of instantiated classes)?
