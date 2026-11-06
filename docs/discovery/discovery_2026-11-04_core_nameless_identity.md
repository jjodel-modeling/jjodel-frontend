# Discovery — core: an object can be nameless (R-TXT-45)

- Prompt-ID: P-2026-11-04-1632 (`docs/prompts/claude_2026-11-04_1632_prompt_core_nameless_discovery.md`)
- Chat: C-2026-11-03-1037 · session `36bb6a62-7374-4deb-b9fd-ee386f9bad9f`
- Tree: `~/jjodel-w-nameless`, branch `core-nameless-identity`, HEAD `588cef276` on `604273359` (R-TXT-45), clean at start
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- Read only. No source file changed. Probes in `~/.jjodel-lanes/P-2026-11-04-1632/` only.

This report is a set of hypotheses with evidence, not a reference: who acts on it rereads the files.
Tags: **[measured]** = run in this phase, on HEAD `588cef276`; **[read]** = read in a file, at HEAD;
**[measured 1605]** = measured by P-2026-11-04-1605 in `~/jjodel-w-textc1e` (`names-measure.md`), not
re-run here. `git diff --stat HEAD textual-c1e-names` over `LModelElement.tsx`, `instance.ts`, `reducer.ts`
is empty, so that measurement ran on the same core code.

## 1. Objective and hypotheses

R-TXT-45: the identity-slot read falls back to `initialName` only while the slot has never been written; a slot
written `""` reads nameless everywhere. Measure who reads the identity, how to tell the two states apart, what the
change is, and which tests pin today's fallback.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The fallback lives in one place, `LValue.get_values` (`LModelElement.tsx:7786-7801`) | **Partly.** There is a second one: `LObject.get_name` ends in `\|\| instanceof.name` (`:6219`), so a slot reading `""` makes `obj.name` the class name (`Port`), not `""` (§3.1) |
| H2 | Never written and written-empty are told apart by the raw slot alone, with no new field | **Holds** for `[]` against `[""]` (§3.2). It fails for one writer, the XMI import, which leaves `DObject.name` at the auto-name (§3.2, D5) |
| H3 | Save/reopen and undo keep the difference | **Holds**: JSON round trip [measured], undo delta [measured on the committed functions, synthetic states] (§3.2) |
| H4 | Changing the read is enough for every layer to show a nameless object | **Falsified.** Uniqueness flags nameless siblings as duplicates, CHECK 12 warns, references to a nameless object draw as broken, and the Text tab prints `Port ""` (§3.3) |
| H5 | The JjScript and canvas rename paths keep working on a nameless object | **Falsified for variant A** (no fallback at all): `set_name` and JjScript `rename` never overwrite a `""` slot. **Holds for variant B** (fall back to `data.name` only) (§4) |
| H6 | Tests pin the fallback | **Holds**: four tests go red by design, depending on the decisions (§3.4) |

## 2. Files read (full paths)

Core and persistence, read by the executor:
`/Users/alfonso/jjodel-w-nameless/frontend/src/model/logicWrapper/LModelElement.tsx` (:3229-3252, :6050-6124,
:6190-6224, :6476-6539, :7540-7870, :7876-8125), `/Users/alfonso/jjodel-w-nameless/frontend/src/joiner/classes.ts`
(:2221-2245), `/Users/alfonso/jjodel-w-nameless/frontend/src/model/logicWrapper/nameUniqueness.ts` (:245-336),
`/Users/alfonso/jjodel-w-nameless/frontend/src/model/conformance/ConformanceValidator.ts` (:40-94),
`/Users/alfonso/jjodel-w-nameless/frontend/src/redux/reducer/reducer.ts` (:370-400, :1389-1426),
`/Users/alfonso/jjodel-w-nameless/frontend/src/common/UObj.ts` (:40-228), `/Users/alfonso/jjodel-w-nameless/frontend/src/common/U.tsx`
(:429-445, :3060-3073), `/Users/alfonso/jjodel-w-nameless/frontend/src/model/unproxy.ts` (:84-88),
`/Users/alfonso/jjodel-w-nameless/frontend/src/components/topbar/SaveManager.ts` (:25-60),
`/Users/alfonso/jjodel-w-nameless/frontend/src/api/persistance/projects.ts` (grep),
`/Users/alfonso/jjodel-w-nameless/frontend/src/redux/VersionFixer.tsx` (:594-615, :888-924),
`/Users/alfonso/jjodel-w-nameless/frontend/src/jjscript/executor/commands/instance.ts` (:926-965),
`/Users/alfonso/jjodel-w-nameless/frontend/src/services/export/XMIService.ts` (:264-280, :964-972),
`/Users/alfonso/jjodel-w-nameless/frontend/src/services/export/JsonModelService.ts` (:403-406),
`/Users/alfonso/jjodel-w-nameless/frontend/src/codegen/textual/printer.ts` (:183-190, :284-290),
`/Users/alfonso/jjodel-w-nameless/frontend/src/codegen/textual/ui/TextualTab.tsx` (:174-184),
`/Users/alfonso/jjodel-w-nameless/frontend/src/codegen/textual/textMatch.ts` (:112-118),
`/Users/alfonso/jjodel-w-nameless/frontend/src/components/editor-v2/utils/jjomTransformers.ts` (:362-392, :474-478),
the tests in §3.4, `/Users/alfonso/.jjodel-lanes/P-2026-11-04-1605/names-measure.md`.

Read by three `explorer` subagents of this session, whose `file:line` claims are quoted below as [read, explorer]
and were spot-checked by the executor where marked: `frontend/src/components/editor-v2/**` (sync, utils, ir, problems,
jjform helpers, ObjectNode, IRFormField, IRForm, formWrite, createAdapter), `frontend/src/components/abstract/tabs/`
(instanceTable, instanceManagerModel, InstanceManagerTab), `TreeViewContent.tsx`, `components/editors/Info.tsx`,
`StatusBar.tsx`, `frontend/src/common/DV.tsx`, `frontend/src/utils/defaultViewTemplate.ts`,
`frontend/src/jjscript/executor/commands/{set,instance,rename,eval,forall,undoredo}.ts`, `handleRegistry.ts`,
`effectsPlanner.ts`, `planWorld.ts`, `frontend/src/jjel/` (evaluator, modelContext), `frontend/src/model/nameLookup.ts`,
`frontend/src/services/export/` (XMIService, JsonModelService, EcoreService), `frontend/src/api/data.ts`,
`frontend/src/codegen/textual/` (printer, textDiff, textApply, textMatch, languageService, modelLines, TextualTab),
and branch `textual-c1e-names` (`f74e401c0`, `c7f6249be`) through `git show`.

## 3. Findings

### 3.1 The read path today [read]

`LModelElement.tsx:7783-7800`, `get_values`, case `EString`:

> `mapperfunc = v => v ? v + '' : ''` … `if (!ret[0] && (dmeta?.upperBound === 1 || (!dmeta && ret.length <= 1))`
> `&& typestr === ShortAttribETypes.EString && context.data.name?.toLowerCase() === 'name') {` …
> `const fallback = o && (o.initialName || o.name);` `if (fallback) ret[0] = fallback;`

The test runs after the mapper on `ret`, so `[]`, a hole and `[""]` all reach it as falsy: today they are one case.
`get_value` passes `maxlimit` 1 (`:7563`, `:7637`), so `[]` becomes a one-hole array before the test.

`LModelElement.tsx:6216-6219`, `LObject.get_name`:

> `if (Array.isArray(rawValues) && rawValues.length === 0 && context.data.name) return context.data.name;`
> `return slot?.value || context.data.name || context.proxyObject.instanceof?.name;`

and its own comment, `:6214-6215`: «a slot deliberately holding '' is a different case, not measured, and left as it
was». If `slot.value` reads `""` and `DObject.name` is `""`, the chain lands on `instanceof.name`, the class name. So
H1 is partial: the change has to touch `get_name` too, or every L reader shows `Port` for a nameless `Port`.

Writers of the slot [read]: `setValueAtPosition` writes `values.<i>` and, for index 0 of a feature named `name`, echoes
`SetFieldAction.new(c.data.father, 'name', val, '', false)` (`:8004-8006`), the slot→name direction of §3.12.
`LObject.set_name` writes `data.name`, then in `AFTER_UPDATE` overwrites the slot only
`if (isValueSlot && cur !== undefined && cur !== null && cur !== '')`, or populates an empty `[]` slot only when
`newName !== ''` (`:6524-6528`). JjScript `rename` writes `data.name` and `initialName` by `SetFieldAction` and never
the slot (`instance.ts:947-953`). `identityAttribute` has one reader, `set_name` (`:6511`); search
`command grep -rn identityAttribute` over `frontend/src`, positive control = its definition at `:3246` in the same output.

### 3.2 Never written vs written empty (part 2)

| state | how it arises | raw slot | `DObject.name` | after JSON reload |
|---|---|---|---|---|
| never written | `DObject.new`, text create, XMI without `name` | `[]` | auto-name or handle | `[]` |
| written empty | `set H.name = ""` [measured 1605], slot edit to `""`, `set_name("")` on a populated slot | `[""]` | `""` (echo `:8005`) | `[""]` |
| written empty, by XMI | `name=""` in an imported XMI [read, explorer: `XMIService.ts:970`, spot-checked] | `[""]` | auto-name (no echo) | same |
| cleared to null | `set H.name = null` on a named object [read]: `null`→`undefined` (`:7922`), the reducer `delete current[key]` (`reducer.ts:387`) | one hole | deleted (echo of `undefined`) | `[null]` |
| null on `[]` | `set H.name = null` [measured 1605] | `[]` unchanged ("identical assignment", `:7924`) | unchanged | `[]` |

- **No new field is needed**: the raw first value is `""` only in the written-empty state. Every other empty form
  is `undefined` (none, hole) or `null` (hole after reload). The test is `context.data.values[0] === ''` on the raw
  D-object, never on `ret`, which the mapper has already flattened.
- **Persistence** [read + measured]: the save is `JSON.stringify(state, proxyToIdReplacer)` (`U.tsx:443`), and the
  replacer touches only L-proxies (`unproxy.ts:85`). `node -e` on `{a:[],b:[""],c:<hole>,d:{name:""}}` gives
  `{"a":[],"b":[""],"c":[null],"d":{"name":""}}` [measured]. The load runs `VersionFixer.update` (`SaveManager.ts:56`).
  The only migrations that read the slot or the name are `2.205 -> 2.206`, which copies a truthy `values[0]` onto
  `o.name` (`VersionFixer.tsx:609-611`), and `2.217 -> 2.218`, which fills a missing `initialName`. Both run only on
  older versions, and neither rewrites `[""]`. No `jsxString` and no default view is involved, so rule 14 is not triggered.
- **Undo** [measured]: `~/.jjodel-lanes/P-2026-11-04-1632/undo-probe.mjs` extracts `Uobj.objdiff`, `objectDelta` and
  `applyObjectDelta` from `common/UObj.ts`, strips types with esbuild, and runs them the way the reducer does
  (`delta = objectDelta(new, old)`, `reducer.ts:1264`; applied by `undo`, `:1396`). Four transitions:
  named→`[""]`, `[]`→`[""]`, `[""]`→named, named→hole. All four come back `IDENTICAL` in `name`, `values`, `length`
  and `0 in values`. The probe ran on synthetic D-objects, not on the app store.

### 3.3 Readers of the identity, by layer (part 1)

The verdict is per reader, under the recommended variant B of §4: an object with raw `[""]` and `DObject.name` `""`
reads `""` both from `obj.name` and from `$name.value`.

**D-layer.** No reader changes. The draw ReadCtx `irReadCtx.ts:207-215` returns the raw slot if it is non-empty, else
`d.name ?? d.initialName` [read, explorer]. For a nameless object that is `""` today already, so the planner and the
draws already see nameless today, while the live L reads show `Port_2`. The change aligns them.

**L-layer / JjOM.**
- `LValue.get_values` `:7786` and `LObject.get_name` `:6219`: the two sites of the change.
- `valuestring_impl` `:7842` follows `get_values`.
- `namedPointers` `:7746` gives `"#DObject"` for a nameless target. It is latent: there is no caller outside the file [read, explorer].
- `ecorePointer` `:6785-6793` reads feature names and indexes, never object names [read, explorer].

**Uniqueness (model, used by canvas, sync, JjScript).**
- `checkNameUniqueness` exempts only `undefined`/`null`. Its doc says «The EMPTY STRING is left to compare like any
  other value» (`nameUniqueness.ts:252-255`, :264).
- `detectDuplicateNames` groups `""` like any name (`:303-335`).
- **Breaks**: two nameless siblings are each flagged `duplicate-name` (`UniquenessProblemSync.tsx`). A second
  `set_name("")`, a `set_father` into a scope that holds one, and `formWrite.ts:397` are refused with a toast. This
  contradicts `jjform/create.ts:355-358` («an empty name is NOT a duplicate») [read, explorer]. → D2.
- JjScript `set` never consults it, so the Text tab path is not refused (`instance.ts:677`) [read, explorer].

**Validation.** `ConformanceValidator.ts:74`, CHECK 12: `checkNameShape(objName)`. `'empty'` gives `missing_name` at
`severity: 'warning'`. **Breaks**: today it cannot fire on an object whose class has a name slot, because the fallback
masks it. After the change it fires on every nameless object. CHECK 2 already reads raw `''` as absent (`:172-186`),
and fires only if `name` has lowerBound ≥ 1. → D3.

**Canvas v2-flow** [read, explorer; the first item spot-checked]:
- **Breaks**: a reference to a nameless object draws as broken. `jjomTransformers.ts:367` keeps a target only
  `if (... rv.name)`. A falsy name falls to `lastSeenRefTargetName(id)` and `broken: true` (:388-390), and
  `ObjectNode.tsx:644-652` strikes it through. The same happens in `IRFormField.tsx:280-282`, where the chip label is
  the raw id, so `broken = label === v`. → D4.
- Node header label `jjomTransformers.ts:476` `lObject?.name ?? 'obj'` → empty header (`ObjectNode.tsx:1324`). Not
  broken, but the header is a hard-to-click empty span. → D4.
- Sync layer: every key is an id. Examples are the pair key `${src}→${tgt}` (`syncState.ts:131-147`), `edgeKeyForD`
  (`useJjomSync.ts:525-530`) and node id `vertex.id` (`jjomTransformers.ts:469`). Names enter only as change detection
  (`vertexSnapshot.ts:76-110`, whose `mixStr` separates `""` from `"x"`). Nothing collides.
- `syncCreateObject` turns `""` into `undefined` (`canvasToJjom.ts:1524`), so the canvas cannot create a nameless object.
- Cosmetic, already safe: the jjform label helpers map `''` to `unnamed` (`outline.ts:174`, `nav.ts:189`), and
  `instanceTable.ts:166` (`??`) is not broken. An empty name renders in: the `Info.tsx:481` h1, the `:800` chips,
  `SingletonPill.tsx:98`, the containment hull header (`IRContainmentHulls.tsx:70`), and `TreeViewContent.tsx:2919`,
  where `|| id.slice(0,8)` shows a short id. In `Info.tsx:1617` a nameless ancestor drops the breadcrumb.

**Canvas classic** [read, explorer]: the M1 views are `jsxString`s in `defaultViewTemplate.ts`.
- `:27-28` and `:85-86`: `<Input field='name' placeholder='unnamed'>` shows the placeholder.
- `:198-201` reads `data.$name.value` with placeholder `name`.
- `:235` (singleton) renders `{data.name}` empty.
- `:40-51`: an edge preview shows `'?'`.
- Nothing breaks, and no template has to change.

**JjEL** [read, explorer]: `self.name` on an M1 object is the slot. `wrapSelectedElement` (`eval.ts:1008-1029`) is
overridden by `extractAttributeValues` (`modelContext.ts:50-55`) with `$name.value` when that is not `undefined`.
Member access `raw ?? null` keeps `""` (`evaluator.ts:673-677`). Equality is strict, so `self.name = ''` is true and
`self.name = null` is false. `Class.allInstances` goes by metaclass name, not instance name (`eval.ts:235-251`).
Breaks nothing.

**JjScript** [read, explorer]:
- `findInstanceByName` matches `o?.name === instanceName` (`instance.ts:130-132`). `""` matches every nameless
  object, so a `""` handle is `AMBIGUOUS_INSTANCE`. It is reachable only from a string value or a forall variable,
  because the parser accepts only `IDENTIFIER`/`QUALIFIED_NAME` as a target (`parser.ts:1377`).
- `eval.ts:260-261` and `:370-371` skip `!nm`, so a nameless object is never bound as `Class.Name`.
- The executor has no M1 uniqueness rule beyond `HANDLE_IN_USE` per run (`instance.ts:670`) and `NAME_CONFLICT` in
  rename (`:933`).
- `rename` refuses an empty new name (`:887`).
- `create instance of C ""` still gets the auto-name, because `DObject.new` does `if (!name)` (`:6107`) and the text
  path names by handle (`instance.ts:665-703`). The core change does not make a create nameless. The R-TXT-44 (1)
  sequence create-then-`set H.name = ""` does.

**Export / serialisation** [read, explorer; XMI lines spot-checked]:
- XMI export reads raw `values`: `[]` is omitted (`XMIService.ts:267`) and `[""]` is written `name=""`.
- XMI references go by `xmi:id` (`:292-295`, :318), so a nameless object is not broken. The change has no effect here.
- XMI reimport (`importM1FromXML`, `:712`, :970) creates with the auto-name and writes the slot raw, with no
  slot→name echo. `name=""` therefore gives `[""]` with `DObject.name` = auto-name (→ D5).
- JSON export `if (obj.name) out.name = obj.name` (`JsonModelService.ts:405`) omits `name` for a nameless object.
  References are `{$ref: id}`.

**Text tab** [read, explorer; printer, textInputOf and identityOf spot-checked]:
- `textInputOf` copies `h[f.name]` as is (`TextualTab.tsx:179-180`). The handle's `name` is the slot read through
  `fillInstanceSlots` (`eval.ts:668-714`).
- `isSet = v != null && …` (`printer.ts:186`) counts `""` as set, and `name()` quotes it. **Breaks**: with the core
  change alone, a nameless `Port` prints as `Port ""`, not nameless.
- `identityOf` returns `""` (`textMatch.ts:117`) where the text side has `null`, so model and text stop matching
  (create + delete).
- The mapping `""` → unset belongs in `textInputOf`, on the model side. → D6.
- Outline and hover read the parsed text, not the model (`languageService.ts:194`, :539-546), so they are unaffected.
- `defaultedSlots` (`textApply.ts:22`, :35) treats `''` as empty.
- **The C1e reprint is not on this branch**: it lives on `textual-c1e-names` (`f74e401c0`, `c7f6249be`), not an
  ancestor of HEAD. Its trigger is `plan.named?.length && print !== typed` (`namedReprint`). Once the model prints a
  nameless object nameless, `print === typed` and the reprint stops by itself. That holds only with D6 and the C1e
  branch both present. → D7.

### 3.4 Tests that pin today's fallback (part 4)

The search was `command grep -rln initialName` over `*.test.ts(x)` in `frontend/src` and `frontend/scripts`, exit 0,
5 files. A second search ranked the source-reading tests that read `LModelElement.tsx` by identity references.
Absence control: the first pattern over `m1DuplicateNames.test.ts` (`name: ''`) missed the positional `obj('rE', '', …)`.
It was rerun with `''`, which found it, so the list below comes from the second form.

| test | pins | red by design? |
|---|---|---|
| `model/__tests__/unq1AutoNameShadow.test.ts:178-183` «uno slot che tiene davvero '' … resta come prima»: `rawValues: ['']`, `slotValue: 'Edition_0'`, `dataName: 'Edition_1'` → `'Edition_0'` | the written-empty slot keeps the fallback | **yes**, with the `get_name` change (under B it returns `'Edition_1'`; under A `''`). The injected `slotValue` imitates today's `get_values` and must be updated with it |
| same file `:185-190`, regex on the `get_name` body | `Array.isArray(rawValues) && rawValues.length === 0` present | no, if that line stays |
| `model/__tests__/m1DuplicateNames.test.ts:65-66, :89-92`: `rE: ['rF'], rF: ['rE']` «the empty name compares like any value» | two `''` siblings collide | **yes**, if D2 exempts `""` |
| `model/conformance/__tests__/ConformanceValidator.test.ts` CHECK 12 «flags an object with no name» (`name: ''` → `missing_name`) | an empty name is a warning | **yes**, if D3 drops the warning |
| `ConformanceValidator.test.ts:686-692` «judges the name slot on raw too» (raw `['']`, required → `missing_required_attr`) | CHECK 2 on raw | no |
| `components/editor-v2/viewpoint/ir/__tests__/irObjectSnapshot.test.ts:54-96` | the D-layer `name ?? initialName` of the ReadCtx | no (D-layer, unchanged) |
| `jjscript/executor/__tests__/forallById.test.ts:332, :379` | `rename` writes `name` + `initialName` | no |
| `codegen/textual/__tests__/nestedDiff.test.ts:169-177`, `modelLines.test.ts:131-153` | handle reservation, a text-created object named by its handle | no |
| branch `textual-c1e-names`, `textualEdit.test.ts` describe «the names the app gives (R-TXT-44 (1), (2))» (about :707-745, from a `git show` window) | the model shows `Port_2` after the run, so the tab reprints | **yes**, once that branch meets the core change and D6: the reprint no longer fires |

No test pins the `set_name` AFTER_UPDATE branches. `AFTER_UPDATE` appears only as a mock in `m1EcoreRoots.test.ts:48`.
`LModelElement.tsx` cannot be imported under vitest (`window is not defined`), so the get_values site can only be
pinned the way `unq1AutoNameShadow` does: the method body extracted from the file and executed.

## 4. The proposed change (part 3)

**Variant B, recommended**: a written-empty slot yields only to `data.name`, never to `initialName`.

```diff
 // LModelElement.tsx, LValue.get_values, case EString (~:7786)
                 if (!ret[0] && (dmeta?.upperBound === 1 || (!dmeta && ret.length <= 1))
                     && typestr === ShortAttribETypes.EString && context.data.name?.toLowerCase() === 'name') {
                     let o = DObject.fromPointer(context.data.father);
-                    const fallback = o && (o.initialName || o.name);
+                    // R-TXT-45: a slot written '' (raw [""]) is nameless; it yields only to data.name
+                    // (a rename that wrote data.name alone), never to the auto-name. [] / hole / null: as before.
+                    const writtenEmpty = ddata.values?.[0] === '';
+                    const fallback = o && (writtenEmpty ? o.name : (o.initialName || o.name));
                     if (fallback) ret[0] = fallback;

 // LModelElement.tsx, LObject.get_name (~:6218)
         if (Array.isArray(rawValues) && rawValues.length === 0 && context.data.name) return context.data.name;
+        if (Array.isArray(rawValues) && rawValues[0] === '') return context.data.name || '';
         return slot?.value || context.data.name || context.proxyObject.instanceof?.name;
```

The comment at `:6213-6215` must be updated with it.

Why B rather than A (A: no fallback at all on `[""]`):
- Under A, a nameless object renamed from the canvas (`set_name`, which does not overwrite a `""` slot, `:6524`) or
  by JjScript `rename` (which writes `data.name` only) stays nameless. A therefore needs `set_name` changed too.
- Under B, both renames show the new name, because `data.name` wins over a `""` slot, and `set_name` stays as it is.
- B's one gap: an XMI `name=""` import keeps `DObject.name` = auto-name, so it reads named (D5).
- Both variants keep §3.12: no write path changes, and slot → name is still the direct `SetFieldAction`.

Dependent changes, outside the two lines, each a decision (§8):
- D2: `nameUniqueness.ts` exempts `""`.
- D3: `ConformanceValidator.ts` CHECK 12 on `'empty'`.
- D4: the v2-flow reference resolution (`jjomTransformers.ts:367`, `IRFormField.tsx:147-160`) tests presence, not a
  truthy name.
- D6: `TextualTab.tsx:180` maps `""` to unset for the name.

## 5. Layer Impact Report (CLAUDE.md §3.2)

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)           — no write path changes; the meaning of an existing D state ([""]) changes
  [x] L-layer (computed proxies)         — LValue.get_values (EString identity case), LObject.get_name
  [x] JjOM (model entities)              — LObject.name / $name.value of M1 instances read "" when written empty
  [x] Canvas v2-flow (ReactFlow nodes/edges) — readers only; D4 if the broken-reference read is fixed
  [ ] Canvas classic                     — readers only (placeholder 'unnamed' / '?'); no jsxString change
  [ ] Sync layer (useJjomSync hooks)     — ids only, names only as change detection; unaffected
  [ ] Persistence (VersionFixer / jsxString) — [""] and [] survive JSON and undo; no migration (D8)

For each touched layer:
  L-layer
  - What changes: a raw first value '' on the identity slot no longer reads initialName; it reads data.name or ''.
  - What does NOT change: [] / hole / null keep initialName || data.name; populated slots win; withmetainfo path;
    non-identity EString slots; set_name, setValueAtPosition, rename (no write path touched).
  - Cross-layer interaction: every L reader of obj.name / $name.value (canvas labels, JjEL self.name, the Text tab
    handle, JSON export, uniqueness, CHECK 12).
  - Side-effect safety: §3.12 invariant untouched (no write); no TRANSACTION; no creator.
  JjOM
  - What changes: a nameless instance is observable as name ''.
  - What does NOT change: ids, containment, references, initialName.
  - Cross-layer interaction: nameUniqueness (D2), ConformanceValidator (D3).
  - Side-effect safety: the uniqueness toast would refuse a second nameless sibling until D2.
  Canvas v2-flow
  - What changes (no code): an empty node header; references to a nameless object struck through as broken (D4).
  - What does NOT change: node/edge ids, pair keys, existingEdgeKeys, M1/M2 edge guards (rules 12-13).
  - Cross-layer interaction: jjomTransformers / IRFormField read the L name of reference targets.
  - Side-effect safety: no sync write; vertexSnapshot hashes see "" vs "x" as different, so a clear re-renders.

Smoke-test scenarios potentially affected: §6.

Uncertain about propagation? → yes, see §7 and §8: Outcome question.
```

## 6. Smoke scenarios (for the implementation lane)

1. **Canvas v2-flow.** Clear `Port_2`'s name in the Text tab (`set H.name = ""`) or in the slot field.
   - Expect: `obj.name === ''` and `$name.value === ''` in the console, an empty node header, CHECK 12 as D3 decides.
   - A `Ref` pointing at it is **not** struck through (needs D4).
   - A second nameless sibling is not flagged duplicate (needs D2).
2. **Canvas classic.** The same object: the `name` input shows its placeholder, and the singleton view shows an empty
   name. Nothing throws.
3. **JjEL.** `self.name` on it is `''`, `self.name = ''` is true, `self.name = null` is false, and
   `Port.allInstances` still lists it.
4. **Export.** Export it to XMI: it is written `name=""`. Reimport: under B it reads its new auto-name unless D5 is
   taken, under D5 it reads nameless. Export to JSON: it has no top-level `name`.
5. **Save and reopen.** The raw slot is `[""]`, `DObject.name` is `""`, the object reads nameless, and the state is
   identical (diff the decompressed state).
6. **Undo.** One Undo after the clear restores `["Port_2"]` / `Port_2`; Redo clears it again.
7. **Rename after the clear.** Rename from the canvas (`set_name`) and by JjScript `rename`: the new name shows
   (variant B). Under A it would stay nameless.
8. **Text tab, C-like and Pascal.** On a tree carrying `textual-c1e-names` and D6:
   - a nameless `input : Bool` prints without a name;
   - removing a name from the text applies and prints nameless;
   - the status line no longer says «the app named N object(s)»;
   - `named` may still be filled, but the reprint stays silent because `print === typed`.
9. **Control.** A never-written slot (`[]`) still reads `Port_2` everywhere, and `set H.name = null` on a named
   object reads its auto-name again (D7).

## 7. Risks

- **Existing projects.** Any saved project holding a `[""]` identity slot opens nameless after the change. Such a
  slot comes from a cleared name field or a `set X.name = ""`; today it shows the auto-name. This is R-TXT-45's
  meaning, but it is visible on reopen (D8).
- **Partial landing.** The two core lines without D2/D3/D4/D6 turn a working display (`Port_2`) into four visible
  defects:
  - a duplicate warning;
  - a `missing_name` warning;
  - references struck through as broken;
  - `Port ""` in the Text tab.
  The lane must carry them together or in a fixed order (D1, D7).
- **Rule 19.** The full set touches more than five files: `LModelElement.tsx`, `nameUniqueness.ts`,
  `ConformanceValidator.ts`, `jjomTransformers.ts`, `IRFormField.tsx`, `TextualTab.tsx`, and four tests. It needs
  confirmation of the file list.
- **The hole state** (`set H.name = null` on a named object) is a third empty form. Under the proposal it reads as
  never written. XMI export (`XMIService.ts:272-279`, `map(String).join(' ')`) writes it as `name=""` in the session,
  because `map` skips the hole [measured on the JS expression]. After a reload it is `[null]` and is written
  `name="null"`. Both are pre-existing.
- **A and B disagree** on objects whose `DObject.name` and slot diverge (XMI import; the JjScript `rename` of a
  populated slot). Neither variant fixes that divergence, which predates R-TXT-45.

## 8. Side findings (pre-existing, not part of R-TXT-45)

1. JjScript `rename` on an object whose name slot is populated writes `data.name` + `initialName` only
   (`instance.ts:947-953`). The slot keeps the old value and wins the read (`:6219`), so the rename should not show.
   [read, not measured]
2. XMI import never echoes the identity slot to `DObject.name` (`XMIService.ts:970`), so `DObject.name` stays the
   auto-name for every imported object [read, explorer].
3. XMI export writes a hole slot as `name=""` and a reloaded `[null]` as `name="null"` (§7) [read + JS expression measured].

## 9. Decisions awaiting Alfonso

1. D1: variant B (written empty yields to `data.name` only) rather than A (no fallback at all)? Recommended: B.
2. D2: should `""` never collide in `checkNameUniqueness` and `detectDuplicateNames` (`m1DuplicateNames` turns red)? Recommended: yes.
3. D3: CHECK 12 on a nameless object: drop `missing_name`, keep it as a warning, or make it info? Recommended: drop it.
4. D4: should the v2-flow reference resolution test target presence, not a truthy name, in the same lane? Recommended: yes.
5. D5: should XMI import echo the identity slot (`""` included) to `DObject.name`, as its own lane? Recommended: yes, separate lane.
6. D6: should the `""` → unset mapping in `TextualTab.tsx:180` ride in the core lane or the next textual lane? Recommended: core lane, so the tab never prints `Port ""`.
7. D7: lane order: merge `textual-c1e-names` first, then the core lane on top, so smoke 8 can run? Recommended: yes.
8. D8: no VersionFixer migration for existing `[""]` slots (they open nameless)? Recommended: none.
9. D9: does `set X.name = null` stay "unset" (it reads the auto-name again) while only `""` is nameless? Recommended: yes.
10. D10: should `set_name("")` on a never-written `[]` slot also write `[""]` (`:6527-6533`, today it requires `newName !== ''`), so a canvas clear is nameless too, since under B it reads the auto-name? Recommended: yes, in the core lane.
