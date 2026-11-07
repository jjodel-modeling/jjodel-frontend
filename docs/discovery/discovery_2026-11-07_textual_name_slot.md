# Discovery: the empty raw `name` slot of an object created from text

- Prompt-ID: P-2026-11-07-0253 (`docs/prompts/claude_2026-11-07_0253_prompt_textual_name_slot_discovery.md`)
- Chat: C-2026-11-03-1037 · Front: codegen · Lane: full (discovery, read only)
- Session: 67bd0065-810e-4ab4-bddd-2a7acec6d063
- Tree: `~/jjodel-w-textns`, branch `textual-name-slot`, HEAD `e47437874` (the prompt's commit, on `04b782a5b`)
- Executor model: claude-opus-5-5
- Depends: P-2026-11-07-0157 (D3b found the symptom: `~/.jjodel-lanes/P-2026-11-07-0157/probe.out.txt`, crop
  `d3b-3-conformance-warning.png`)

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the
real files.

## 1. Objective

A model created from the Text tab shows `Module cpu` everywhere (labels, tree, text) while its raw identity slot reads
`[]`, and conformance warns that a named Module lacks its required `name`. Find the root cause before any fix: reproduce
it on the port corpus with controls, trace the write, place the cause in a layer, and plan the fix lane.

## 2. Hypotheses under test

- H1. The textual apply writes the name somewhere other than the identity slot (a `name` property, not the `name`
  attribute's value). **Holds, partly**: the textual layer writes nothing at all for these objects; the name comes from
  the JjScript `create instance of C "h"` handle, which reaches `DObject.name` and `initialName` but not the slot (§4).
- H2. The name is visible because a reader falls back from the empty slot to a derived name. **Holds**: `get_name`
  yields to `data.name` and `get_values` to `initialName` over a never-written slot (§4.4).
- H3. The cause is in the core (LModel / DObject / the apply transaction). **Falsified**: each core piece behaves as its
  own comments declare; the defect is the textual layer's assumption that the creation handle names the object, which
  the JjScript executor does not honour for the slot (§5).
- H4. Only the Module is affected. **Falsified**: every object whose handle equals its name has an empty slot (`cpu`,
  the Port `result`, the Ref `ready`); only `Module.name [1..1]` makes conformance say so. The XMI export drops all three
  names (§3, E).

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/textApply.ts` (whole, 99 lines)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/textDiff.ts` (lines 440-599, `diffLines`)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/modelLines.ts` (lines 1-20 and 136-144)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/ui/TextualTab.tsx` (grep hits only: 125, 180-189, 306-330,
  368, 1314-1330)
- `/Users/alfonso/jjodel-w-textns/frontend/src/jjscript/executor/commands/instance.ts` (lines 573-740,
  `executeCreateInstance`; grep hits of the set path at 947-950, 1101-1102)
- `/Users/alfonso/jjodel-w-textns/frontend/src/model/logicWrapper/LModelElement.tsx` (lines 6090-6124 `DObject.new` /
  `new3`, 6190-6225 `LObject.get_name`, 7780-7810 `get_values` identity fallback)
- `/Users/alfonso/jjodel-w-textns/frontend/src/model/conformance/ConformanceValidator.ts` (lines 27-40, 130-210, CHECK 2)
- `/Users/alfonso/jjodel-w-textns/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (lines 1495-1538,
  `syncCreateObject`)
- `/Users/alfonso/jjodel-w-textns/frontend/src/components/editor-v2/hooks/createAdapter.ts` (lines 25-60, 486-500,
  565-580)
- `/Users/alfonso/jjodel-w-textns/frontend/src/services/export/XMIService.ts` (lines 288-327, `serializeFeatures`)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/__tests__/{textDiff,nestedDiff,modelLines,textualEdit}.test.ts`
  (grep hits of `create instance of` with two lines of context)
- `~/.jjodel-lanes/P-2026-11-07-0157/probe.mjs` (whole) and `probe.out.txt` (whole)
- Decisions R-TXT-44, R-TXT-45, R-TXT-46, RC-17, RC-51 as injected in the prompt.

## 4. Reproduction (measured)

Probe `~/.jjodel-lanes/P-2026-11-07-0253/probe.mjs`, its setup copied from D3b (a new offline project, the port
metamodel `portprobe` imported with `Module.name [1..1]` and `Port.name [0..1]`, the D3b record, `createModelFromText`
with an empty script, the Text tab opened), run on HEAD `e47437874` through vite on port 3558 from this worktree. Logs:
`.agent-logs/probe-0253-20261107-025636.log` (A-D), `probe-0253d-20261107-030434.log` (E),
`probe-0253e-20261107-030626.log` (B3), all `DONE`, `page errors []`. Each step that is not a keystroke is a direct
call, marked. Per object the probe reads `d` = `DObject.name`, `init` = `initialName`, `raw` = the D value of the `name`
slot (`values`), `l` = the L proxy's `name`, `slot` = `$name.value`; conformance is `validateConformance(m1, mm)`.

**A. The model from text** (the D3b text typed into the buffer by `executeEdits`, direct; the tab applied it,
`Applied`). The script the apply ran, captured from `JjScriptEvents.EXECUTION_START`:

```
create instance of Module "cpu"
create instance of Port "Port_1" in cpu.inputs
set Port_1.name = "instr"
create instance of Word "Word_1" in Port_1.type
create instance of Port "Port_2" in cpu.inputs
set Port_2.name = ""
create instance of Bool "Bool_1" in Port_2.type
create instance of Port "result" in cpu.outputs
create instance of Word "Word_2" in result.type
create instance of Conj "Conj_1" in result.driver
create instance of Ref "Ref_1" in Conj_1.ops
set Ref_1.name = "instr"
create instance of Ref "ready" in Conj_1.ops
set Word_1.width = 32
set Word_2.width = 8
set result.peer = Port_1
```

| object | handle | `d` | `init` | `raw` | `l` | `slot` |
|---|---|---|---|---|---|---|
| Module cpu | `cpu` | cpu | cpu | `[]` | cpu | cpu |
| Port instr | `Port_1` | instr | Port_1 | `["instr"]` | instr | instr |
| Port (nameless) | `Port_2` | `""` | Port_2 | `[""]` | `""` | `""` |
| Port result | `result` | result | result | `[]` | result | result |

Conformance: `missing_required_attr: Object "cpu" is missing required attribute "name"`, the only violation.

The rule the table shows: **a name set by a `set h.name` line reaches the slot; a name carried only by the creation
handle does not.** `result` and `ready` have the same empty slot as `cpu`; their class makes the name optional, so no
check reports it.

**B. The executor alone** (direct: `applyTextEdit(m1, { lines, handles: new Map() })` with hand-written plans, the same
`applyAsOneStep` path).

| step | lines | `d` | `init` | `raw` | conformance |
|---|---|---|---|---|---|
| B1 | `create instance of Module "alu"` | alu | alu | `[]` | missing `name` |
| B2 | `create instance of Module "Module_77"`, `set Module_77.name = "fpu"` | fpu | Module_77 | `["fpu"]` | clean |
| B3 | `create instance of Module "zz"`, `set zz.name = "zz"` | zz | zz | `["zz"]` | clean |

B1 is the textual symptom without the textual layer: any JjScript run (the script console included) that names an
object by its creation handle leaves the slot empty. B3 is the candidate fix's shape: a `set` on a handle equal to the
name writes the slot and clears the violation.

**C. The canvas and form paths** (direct calls).

| step | call | `d` | `init` | `raw` | conformance |
|---|---|---|---|---|---|
| C1 | `DObject.new(Module, m1, DModel, undefined, true)`, what `canvasToJjom.syncCreateObject` does before the vertex | Module_0 | Module_0 | `[]` | missing `name` |
| C2 | `createAdapter.createInstance(m1, 'Module', null, null, { name: 'gpu' })` | gpu | Module_1 | `["gpu"]` | clean |

C1 is a control, not a reproduction of the reported bug: an object dropped on the v2 canvas carries only its auto-name
and conformance flags it the same way. That is the R-TXT-45 reading of a never-written slot (it reads the auto-name),
and it predates the textual layer. It is reported in §7 as a separate question, not as part of this cause.

**D. A rename from the text** (`Module cpu` to `Module core` on line 1 by `executeEdits`, direct; `Applied`). The apply
ran `set cpu.name = "core"`; the Module reads `d` core, `init` cpu, `raw ["core"]`, and its violation is gone. The
renamed object heals; the others (`alu`, `Module_0`) keep theirs.

**E. The XMI export** (direct: `XMIService.exportToXML(m1)` after D). The instance lines:

```
<Module xmi:id="…_USER_33" name="core">
<inputs xsi:type="Port" xmi:id="…_USER_39" name="instr">
<inputs xsi:type="Port" xmi:id="…_USER_49" name="">
<outputs xsi:type="Port" xmi:id="…_USER_61" peer="…_USER_39">
<ops xsi:type="Ref" xmi:id="…_USER_82" name="instr"/>
<ops xsi:type="Ref" xmi:id="…_USER_87"/>
<Module xmi:id="…_USER_93"/>
<Module xmi:id="…_USER_99" name="fpu"/>
<Module xmi:id="…_USER_105"/>
<Module xmi:id="…_USER_109" name="gpu"/>
```

The Port `result`, the Ref `ready` and the Module `alu` are exported **without a name**: the defect is data loss on
export, not only a conformance false positive. (In probe run e the B3 Module `zz` is exported `name="zz"`.)

## 5. The write, traced (read, on HEAD `e47437874`)

### 5.1 The textual apply

`textApply.ts:74-99` `applyTextEdit` joins `plan.lines` into one script, registers the plan's handles, and runs
`applyAsOneStep` (PreviewBar). It writes no name of its own. The lines come from `textDiff.ts` `diffLines`; a create is
emitted at `textDiff.ts:543-550`:

```ts
lines.push(`create instance of ${o.cls} ${jjscriptString(h)}${into}`);
…
const name = identityOf(g, o);
if (name !== null && name !== h) lines.push(`set ${h}.name = ${jjscriptString(name)}`);
if (name === null && g.objects[o.cls]?.named) lines.push(`set ${h}.name = ""`);
```

and the handle is the object's own name whenever that name is a unique identifier free of class names
(`textDiff.ts:466-467`, `h = name`). So for `cpu`, `result`, `ready` the condition `name !== h` is false and **no line
writes the name**: the textual layer counts on `create instance of Module "cpu"` to name the object.

«New model from text» with a non-empty script uses the sibling generator, with the same skip, `modelLines.ts:141`:

```ts
if (o.slots[f.name] !== h) lines.push(`set ${h}.name = ${jjscriptString(o.slots[f.name] as string)}`);
```

(read; the probe exercised `textDiff` only, since its `createModelFromText` ran an empty script, as D3b's did).

### 5.2 The JjScript create

`jjscript/executor/commands/instance.ts:686-703` `executeCreateInstance`:

```ts
const dObject = (DObject as any).new(metaclass.id, container ? container.slot.id : targetModel.id,
    container ? DValue : DModel, instanceName, true);
…
if (explicitInstanceName && dObject) {
    (dObject as any).initialName = explicitInstanceName;
}
```

The handle reaches `DObject.name` (the `name` argument of `DObject.new`) and `initialName` (the direct write), never the
identity slot. The executor's own message treats handle and name as two things, `instance.ts:677`: «the 'name'
attribute can still be set to any (even duplicate) value afterwards».

### 5.3 The core create

`model/logicWrapper/LModelElement.tsx:6104-6113` `DObject.new`:

```ts
if (!name) name = computedDefaultName;
let ret = new Constructors(new DObject('dwc'), father, persist, fatherType).DPointerTargetable().DModelElement()
    .DNamedElement(name).DObject(instanceoff).end((d) => DObject.listInModel(d, fatherType));
// initialName: always the auto-generated default, regardless of the explicit `name` parameter.
ret.initialName = computedDefaultName;
```

`DObject.new` writes `data.name` only. Seeding the slot is the job of the callers that bind it: `LValue.addObject` on a
`setTimeout` and `createAdapter.createInstance`, whose comment says so (`createAdapter.ts`, the block «The values arrive
with the create»: «`name`, passed bare so that the same string reaches `DObject.name` … AND the identity slot»). C2 of §4
measures that binding.

The `set` path that does write the slot, `instance.ts:1087-1101`: inside `TRANSACTION('JjScript: Set instance
attribute')`, `featureProxy.value = primitive` on `lObject['$name']`, which is the slot write, with slot to name
propagated by `setValueAtPosition` (model/CLAUDE.md §3.12). B2, B3 and D of §4 measure it.

### 5.4 Where the name becomes visible without the slot

- `LModelElement.tsx:6219` (`LObject.get_name`): `if (Array.isArray(rawValues) && rawValues.length === 0 &&
  context.data.name) return context.data.name;` — the L name, the tree, labels.
- `LModelElement.tsx:7806-7808` (`get_values`, identity slot): `const fallback = o && (writtenEmpty ? o.name :
  (o.initialName || o.name)); if (fallback) ret[0] = fallback;` — `$name.value`, and with it the eval context the
  Text tab prints from. Since `instance.ts:702` made `initialName` the handle, the slot reads `cpu`.

The readers that see the raw slot, and so see the absence:

- `model/conformance/ConformanceValidator.ts:180-187` (CHECK 2): `const rawVals = (f as any).__raw?.values; … return
  vals.some((v: any) => v !== null && v !== undefined && v !== '');`, with the comment at :172-179 that «the name slot
  gets no special fallback».
- `services/export/XMIService.ts:309-310`: `const rawValues: any[] = (feature.__raw?.values || []) as any[]; if
  (rawValues.length === 0) continue;` — the export of E.

## 6. Where the cause is

Not in the core. Each core piece does what its comment declares: `DObject.new` names `data.name` and leaves the slot to
the binders (§5.3); `get_name` and `get_values` read a never-written slot through `data.name` / `initialName` by design
(UNQ1, R-TXT-45 D1, §5.4); conformance and export judge on the raw slot by design (§5.4). The apply transaction
(`applyAsOneStep`) runs the lines it is given and is not involved: B3 through the same path writes the slot.

The defect is a contract mismatch between two non-core layers:

1. **Textual layer** (`textDiff.ts:549`, `modelLines.ts:141`): it assumes that a creation handle equal to the name
   names the object, and omits the `set h.name`. This is the cause of the reported symptom.
2. **JjScript executor** (`instance.ts:686-703`): `create instance of C "h"` gives the object the handle as its displayed
   name and its `initialName` without binding the identity slot. This is the cause of B1 (scripts and the console),
   and the reason the textual assumption looks true on screen.

Fixing (1) alone fixes every object created from text, by the path B3 measures; fixing (2) alone would fix both, but
touches the executor's create (§7, N1).

### 6.1 Files a fix would touch, against CLAUDE.md §3.1 and §3.2

| file | §3.1 table | §3.2 trigger | note |
|---|---|---|---|
| `frontend/src/codegen/textual/textDiff.ts` | no | no | emits JjScript text; the write runs through the existing `set` path |
| `frontend/src/codegen/textual/modelLines.ts` | no | no | same |
| `frontend/src/codegen/textual/__tests__/textDiff.test.ts` | no | no | test |
| `frontend/src/codegen/textual/__tests__/modelLines.test.ts` | no | no | test |
| `frontend/src/jjscript/executor/commands/instance.ts` (N1 option B only) | no | **yes**, read as RC-15 reads it: a creator (`DObject.new`) in a non-test source under `frontend/src`, and a new slot write next to it | Layer Impact Report draft below |

Option A (textual) needs no Layer Impact Report. For option B, a draft:

```
LAYER IMPACT REPORT (draft, option B: the create writes the identity slot)

Layers touched:
  [x] D-layer (Redux raw data): the identity DValue of each object created by `create instance of C "h"`
  [x] L-layer (computed proxies): read only; get_name / get_values unchanged
  [ ] JjOM
  [x] Canvas v2-flow: indirectly, the label reads the same name
  [ ] Canvas classic
  [ ] Sync layer
  [ ] Persistence (VersionFixer / jsxString)

D-layer — what changes: after DObject.new, the slot gets [handle] (deferred until the object's features
  exist, §9.1/§9.2 of model/CLAUDE.md, or by the executor's own wait); what does NOT change: DObject.new,
  initialName, data.name; cross-layer: slot→name propagation fires a SetFieldAction on 'name' with the same
  value (terminal, §3.12); side-effect safety: the write must land inside the run's undo step, or one Undo
  leaves a named-but-slotless object behind.

Smoke-test scenarios potentially affected:
  - console `create instance of C "x"`: slot ["x"], conformance clean, XMI exports name="x"
  - a script creating 50 objects: timing of the run (one deferred write per object)
  - undo of a script run: one step removes the objects and their slot writes
  - Text tab apply: no duplicate write once option A is also in (an idempotent same-value set)
```
