# Discovery: the two code generation lecture examples as importable projects

- Prompt-ID: P-2026-10-11-1415 (`docs/prompts/claude_2026-10-11_1415_prompt_codegen_s8_importable_examples.md`), Phase 1
- Session: d334af2f-7922-42fc-b82a-a8bdf1c565c6
- Tree: `~/jjodel-w-codegen-examples`, branch `codegen-examples`, HEAD `2a6eef070` (descends from merge `f735959f6`)
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the files.

## Objective

Find the project export format and the import path a user takes, and whether the `_state` keys the two lecture
examples need (`genTemplates`, the simulation roles, the data declarations, `runScenarios`) survive an export and an
import; how ids are remapped on import; whether a second import gets a suffixed name. Then decide how Phase 2 builds
the two files.

## Hypotheses under test

1. H1. `ExportImportMenu.tsx` and `ImportDropZone.tsx` are the project export and import path (the prompt's context).
   **Falsified** (read). Both handle `.ecore` and `.xmi` only, and neither is mounted anywhere.
2. H2. The project export writes a `.json` file. **Falsified** (read, measured). It writes `<project name>.jjodel`.
3. H3. `_state` keys survive an export and an import. **Holds** (read; measured in Phase 2 by the round trip). The
   export carries the whole store, `_state` objects included.
4. H4. Ids are remapped on import, so a second import does not collide with the first. **Holds** (read). Every import
   is a duplicate with every pointer id renewed.
5. H5. A project imported twice gets a suffixed name. **Holds** (read): ` copy`, then ` copy2`.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/components/common/ExportImportMenu.tsx` (whole, 132 lines)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/components/common/ImportDropZone.tsx` (whole, 170 lines)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/api/persistance/projects.ts` (lines 1-340, 430-434)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/model/megamodelPersistence.ts` (lines 60-200)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/pages/components/Project.tsx` (lines 139-201)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/common/U.tsx` (lines 426-445, 1353-1371, 1500-1525, 2982-2996)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/pages/components/Navbar.tsx` (lines 1375-1402)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/pages/components/LeftBar.tsx` (lines 185-200)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/pages/components/catalog/Catalog.tsx` (lines 335-352)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/pages/components/Dashboard.tsx` (lines 285-330)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/components/project/ProjectEditor.tsx` (lines 555-585)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/codegen/oracle/storedScenarios.ts` (whole)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/codegen/setting.ts` (lines 1-40)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/pages/settings/AdvancedSettings.tsx` (lines 80-105)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/joiner/classes.ts` (lines 596-598)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/scripts/probe/codegen-check.ts` (whole)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/scripts/lane-run.mjs` (lines 1199-1340)
- `/Users/alfonso/jjodel-w-codegen-examples/frontend/src/codegen/examples/{turnstile,petri-producer-consumer}/README.md` (whole)
- `docs/log-inbox/codegen-{oracle,names,check}.md`, `docs/decisions.md` R-GEN-11 to R-GEN-17

## Findings

### F1. The prompt's two components are not the project path (read)

`ExportImportMenu.tsx:28-29`: `const fileExtension = type === 'metamodel' ? '.ecore' : '.xmi';`. `ImportDropZone.tsx:78`
and `:91` branch on `extension === 'ecore'` and `extension === 'xmi'`; anything else is `Unsupported file type`.
Neither is used: `command grep -rln "ImportDropZone\|ExportImportMenu" src` lists only the two components and their
`.scss` files (the components themselves are the positive control of that search).

### F2. The export: `.jjodel`, the raw project plus its compressed store (read, measured)

The menu entry a user takes in the editor is Navbar's «Download Project», `Navbar.tsx:1394-1397`:

```
isDashboard ? null : {name: 'Download Project', function: async()=> {
        if (project) {
            let dproject = await ProjectsApi.save(project);
            U.download(`${project.name}.jjodel`, JSON.stringify(buildProjectExportJson(dproject as unknown as Record<string, unknown>, getRuntimeMegamodel(project.id))));
```

`LeftBar.tsx:192-196` and `Catalog.tsx:345-347` call the same `buildProjectExportJson`. `megamodelPersistence.ts:97-106`
spreads the raw project and adds `megamodel`. The project's `state` comes from `ProjectsApi.save`, which calls
`U.compressedState` (`U.tsx:429-445`): the whole store, every `idlookup` entry except other projects, as JSON,
compressed with `async-lz-string`'s `compressToUTF16`:

```
for (const [pointer, object] of Object.entries(state.idlookup) as [Pointer, DPointerTargetable][]) {
    ...
    if (object.className === DProject.name && pointer !== id) continue;
    idlookup[pointer] = object;
}
```

So a metamodel's and a model's `_state` travel inside `state`, as part of their D-objects. Measured on the two probe
scenes with a gitignored node script (`frontend/scripts/smoke/_tmp_s8_inspect.mjs`): `scene_3_DemoESM.jjodel` is
65072 bytes, top-level keys `className,id,...,state,version,...,megamodel`, `state` 22158 UTF-16 characters, 103
`idlookup` entries, models `DemoESM` (M2) and `demoESM` (M1), user `Pointer_OfflineUser`. `scene_2_DemoPetri.jjodel`:
66402 bytes, 107 entries, models `DemoPetri` (M2) and `demoNet` (M1).

A second, different format exists: `ProjectEditor.tsx:561-573` wraps the project as
`{format_version: '1.0', metadata, project}`, also named `.jjodel`. `importFromText` reads `json.id` and `json.state` at
the top level, so that wrapper is not what the import reads. Phase 2 uses Navbar's entry.

**The natural extension is `.jjodel`, not `.jjodel.json`.** It also matters for the import: the dashboard drop accepts
only `.jjodel` (`Dashboard.tsx:294`, `if (file && file.name.endsWith('.jjodel'))`) and the menu's file input is
created with `['.jjodel']` (`projects.ts:313`). The files are therefore `turnstile.jjodel` and
`petri-producer-consumer.jjodel` under `frontend/public/examples/codegen/`.

### F3. The import: two user paths, one function (read)

- Navbar «Import Project», shown off a project (`Navbar.tsx:1382`, `isProject ? null : {name: 'Import Project',
  function: ProjectsApi.import, ...}`): `ProjectsApi.import` (`projects.ts:302-317`) opens a file input
  (`U.fileRead`, `U.tsx:1363-1371`, `myFileReader` at `:2982`) with `extensions = ['.jjodel']` and passes the text to
  `importFromText`.
- The dashboard drop zone (`Dashboard.tsx:290-305`, mounted on `.dashboard-container` at `:320-325`): a `.jjodel` file
  is read and passed to `ProjectsApi.importFromText`.

`importFromText` (`projects.ts:257-299`) never asks: `let dialogDuplicate: boolean = false;` (`:276`) and
`let response: string = resp_dup;` (`:273`), so every import goes through `duplicateProject` (`:284-287`), then
`Offline.import` (`:430-434`, appended to localStorage `projects`) and `CreateElementAction.new(project)`.

### F4. Ids are renewed on every import, by text replacement (read)

`Project.tsx:139-183`, `duplicateProject`: a new project id, then the decompressed state is stringified and every
pointer id is replaced:

```
let renewAllIDs = true;
if (renewAllIDs) {
    for (let id in state.idlookup){
        if (id === project.id || !Pointers.isPointer(id) || Defaults.check(id)) continue;
        str = U.replaceAll(str, id, Constructors.makeID());
    }
}
```

The replacement is textual over the whole serialized store, so ids inside `_state` strings are renewed too: the role
values (class ids), and the event and transition ids inside the encoded `runScenarios` string. `genTemplates` holds no
id (the templates read roles, R-GEN-7). A second import of the same file draws new ids again from `makeID`
(`classes.ts:596-598`, `"Pointer" + new Date().getTime() + "_" + ... + "_" + (DPointerTargetable.maxID++)`), so two
imports share no element id.

### F5. Names: ` copy`, then a number (read)

`Project.tsx:144`: `if (project.name.indexOf('copy') === -1) project.name += ' copy';`, then
`U.increaseEndingNumber(project.name, false, false, (str)=> !!projectNames[str])` (`:157`). `U.tsx:1500-1525`: with no
trailing number the next candidate is `prefix + 2`. A project named `Turnstile` imports as `Turnstile copy`, and again
as `Turnstile copy2`.

### F6. Where the examples' keys live (read)

- Metamodel `_state`: the simulation roles (`simNode`, `simTransition`, ...), `simProfile`, `simEnabled`,
  `genTemplates` (fixture `lookup.MM._state`).
- Model `_state`: `simStateAttributes` (turnstile's data declarations); `runScenarios`, read by the Code panel's
  «Check» through `storedScenarios.ts:18-21`, `lookup[modelId]?._state?.[RUN_SCENARIOS_KEY]`.

All are D-object fields, carried by F2's `state`. `VersionFixer.tsx` mentions `_state` at `:1230` and `:1249` only, the
second creating a new class with `_state: {}`; no line drops an existing key (read, not run).

### F7. The setting and the app's serving of `public/` (read)

The Code panel setting is the checkbox «Code generation» in the «Experimental» group of `AdvancedSettings.tsx:85-99`,
stored as localStorage `jjodel.experimental.codegen` (`setting.ts:18`). `vite.config.ts` sets neither `publicDir`
nor a `root` (`command grep -n "root\|public\|build:" vite.config.ts` hits only a comment at `:54` and `esbuild` at
`:108`), so Vite's default applies: `frontend/public/` is served at `/` and copied to `dist/`. `ls public/examples`
fails with `No such file or directory`, and the same `ls public` lists 30 other entries (control).

## Plan for Phase 2 (follows from F2 to F5)

- The build probe follows the S7b probe's steps: import the scene, for the Petri net a new model built by the README's
  JjScript, the fixture's bags written with the `state` setter, ids mapped by name; then the fixture's scenario stored
  under its name, the project and the new model renamed, and Navbar's «Download Project» clicked; the browser's
  download is the committed file.
- The round trip imports through Navbar's «Import Project» file input, in a fresh context.
- A node test reads the committed files: `async-lz-string` decompresses `state` in node, the joiner is not needed.
  `importFromText` and `duplicateProject` are not callable in node (`Project.tsx` and `projects.ts` import the joiner,
  which fails at import with `window is not defined`, CLAUDE.md §17), so the import half of the round trip is the
  probe's.

## Risks

1. R1. The id renewal is a textual `replaceAll` per id (F4). If one id of a file were a prefix of another followed by a
   digit (`..._USER_1` and `..._USER_10` with the same timestamp), the second would be corrupted on import. The node
   test checks that no id of the two files is such a prefix.
2. R2. The file carries the whole scene, not the example alone: the Petri project keeps the scene's `demoNet` next to
   the new model. The README names the model to open.
3. R3. `state` is an LZ UTF-16 string: the committed files do not diff readably. The regeneration script is the way to
   change them.
4. R4. The file is served as a static asset with Vite's MIME guess for `.jjodel` (likely `application/octet-stream`):
   a browser downloads it, which is the intended use.

## Open questions

1. Q1. The prompt names `.jjodel.json`; the export's own extension is `.jjodel`, and the drop zone refuses any other.
   Used `.jjodel` (the prompt allows it).
2. Q2. Project names: the files are exported as `Turnstile` and `Producer-consumer`, imported as `... copy`. Kept the
   app's suffix (no change to import code).
