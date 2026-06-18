# Discovery (READ-ONLY) — Instance-name ↔ identity-slot sync verification
**Date**: 2026-06-17
**Branch**: alfonso-frontend-jjtl
**Mode**: read-only. State read = current working tree.
**Scope**: verify the CURRENT state of both sync directions before implementing
bidirectional binding. No code changed; this document is the only output.

> **Path correction up-front**: `LModelElement.tsx` lives at
> `frontend/src/model/logicWrapper/LModelElement.tsx` (NOT `frontend/src/joiner/`).
> The base `set_name` lives in `frontend/src/joiner/classes.ts`.
> All prior-discovery (`2026-05-25_identity_binding.md`) line numbers were re-verified
> and have drifted; the numbers below are the current ones.

---

## ⚠️ Headline finding — the prompt premise is partially out of date

The task brief states "Prompt 2/3 (binding consolidation) and Prompt 3/3 (write-path
verification) were never written or executed." **The working tree contradicts this in
part.** Three artifacts that belong to the Prompt-2 surface are already committed:

| Artifact | Status today | Commit |
|---|---|---|
| `LClass.identityAttribute` helper | **EXISTS** (`LModelElement.tsx:3062`/`:3072`) but has **ZERO consumers** (dead) | `999371939 feat(identity): add LClass.identityAttribute helper…` (2026-05-26) |
| `get_values` fallback changed to `initialName` | **DONE** (`LModelElement.tsx:7291`, `o.initialName \|\| o.name`) | `84d75047f fix` (2026-05-26) |
| `DObject.initialName` foundation + v2-flow naming unified to `defaultname` | **DONE** (Prompt 1) | `729c5ce07 anchorpoint fixes` (2026-05-25) |
| VersionFixer | now at **2.225** (not 2.218) | several later migrations |

What was **NOT** done: the *consolidation refactor* — the five scattered
`name?.toLowerCase() === 'name'` match points were **not** rewired to consult
`identityAttribute`; they all still match inline. So binding "consolidation" exists as a
helper primitive only, unused. Details per point below.

---

## 1. `LPointerTargetable.set_name` — `frontend/src/joiner/classes.ts:2136-2161`

Current setter. After the dedup check (`:2138`) and sibling-name-collision guard
(`:2140-2151`), it performs **two** writes inside one TRANSACTION (`:2153-2159`):

```typescript
TRANSACTION(this.get_name(c)+'.name', ()=>{
    let nameattribute = (c.proxyObject as any).$name;
    if (nameattribute && nameattribute.className === 'LValue') {
        nameattribute.value = val;                       // :2156  → SLOT write (via LValue.set_value)
    }
    SetFieldAction.new(c.data, 'name', name, '', false); // :2158  → DObject.name write (direct)
}, undefined, val)
```

**Which sides does it write?** Exactly two: (a) the **identity slot** via the proxy
assignment `nameattribute.value = val` (routes through `LValue.set_value` →
`setValueAtPosition`, see §2), and (b) **`DObject.name`** via a direct `SetFieldAction`.
It does **NOT** write `initialName`.

**Overrides that exist today** (all same two-write shape, none touch `initialName`):
- `LObject.set_name` — `LModelElement.tsx:6060-6085`. Replaces the inline sibling check
  with `validateNameUniqueness` (`:6065`); writes slot (`:6080`) + `data.name` (`:6082`).
- `LClass.set_name` — `LModelElement.tsx:3055-3060`. `super.set_name` then
  `SetRootFieldAction.new('ClassNameChanged.'+id, …)` (`:3058`). M2.
- `LModel.set_name` — `LModelElement.tsx:5360-5377`. Writes **only** `data.name`
  (`:5370`, no slot — LModel has no `$name`) + DOM tab-title text (`:5374`).
- `LAttribute.set_name` — `LModelElement.tsx:4241-4253`. M2 attribute rename + type
  inference; `super.set_name` (`:4244`). Renames the EAttribute itself, not a DObject.
- `LStructuralFeature` base `LNamedElement.set_name` is `classes.ts:2136` (above).
- `classes.ts:2822` = `LUser.set_name`, `classes.ts:3229` = `LProject.set_name` —
  **not identity-relevant** (user/project names).

**Conclusion §1**: `set_name` writes slot + `data.name` (both sides), never `initialName`.
Unchanged in substance from the prior discovery.

---

## 2. `LValue.setValueAtPosition` — `frontend/src/model/logicWrapper/LModelElement.tsx`

Public stub `:7368`; real impl is the closure returned by `get_setValueAtPosition`
(`:7396-7496`). The slot→`data.name` propagation lives at `:7482-7485`:

```typescript
outactions.set.push(()=>SetFieldAction.new(c.data, 'values.' + index as any, val, '', isPtr)); // :7482 slot
if (index === 0 && lname?.toLowerCase() === 'name' && c.data.father) {
    outactions.set.push(()=> SetFieldAction.new(c.data.father, 'name', val, '', false));        // :7484 → data.name
}
```

**Does it still propagate the slot value onto `data.name`?** **Yes** — for index 0 of a
slot named `name` (case-insensitive). **Exact API: a DIRECT `SetFieldAction` on the
father's `'name'` field (`:7484`).** It does **NOT** route through `set_name`.

**Loop-risk flag (the prompt's hotspot)**: because the propagation is a *direct field
write* (not a `set_name` call), this path is **structurally safe** — it cannot re-enter
`set_name` and therefore cannot re-trigger a slot write. See §10 for the full trace. The
"loop-risk hotspot" labelling from the prior map is, on current code, a false alarm: the
write is terminal.

Note: `lname` defaults to `this.get_name(c)` (`:7475`) = the **DValue's own name** (the
EAttribute name, e.g. `"name"`), via `LValue.get_name` at `:7020` — not the value. So the
match is on the slot/attribute name, correct.

---

## 3. Identity attribute helper + every inline match point

### Helper EXISTS but is DEAD

`LClass.identityAttribute` — declared `LModelElement.tsx:3062`, getter `:3072-3078`:

```typescript
protected get_identityAttribute(context: Context): LAttribute | undefined {
    const attrs = this.get_allAttributes(context) || [];
    for (const attr of attrs) {
        if (attr && attr.name?.toLowerCase() === 'name' && attr.type?.name === 'EString') return attr;
    }
    return undefined;
}
```

Adds the `EString` type check + inheritance walk (`allAttributes`). **Consumers: NONE.**
A codebase-wide grep for `.identityAttribute` returns only the declaration, the getter,
and a *comment* at `:7282` ("mirrors LClass.identityAttribute (Step 1)"). The helper is
defined and never called.

### Every `name?.toLowerCase() === 'name'` (or equivalent identity detection)

| # | file:line | context | wired to helper? |
|---|---|---|---|
| 1 | `LModelElement.tsx:3075` | the helper itself (`attr.name?.toLowerCase() === 'name' && attr.type?.name === 'EString'`) | n/a (is the helper) |
| 2 | `LModelElement.tsx:7279` | `get_values` read fallback — `context.data.name?.toLowerCase() === 'name'` (+ EString + upperBound 1) | **NO** (inline; comment at `:7282` justifies the duplication as a hot-path choice) |
| 3 | `LModelElement.tsx:7483` | `setValueAtPosition` write propagation — `lname?.toLowerCase() === 'name'` | **NO** (inline) |
| 4 | `redux/VersionFixer.tsx:517` | migration `2.205 -> 2.206` — `e.name?.toLowerCase() === 'name' && e.values[0]` | **NO** (inline; D-only) |
| 5 | `redux/selectors/selectors.ts:307` | `Selectors.getName` — `feat.name.toLowerCase() === 'name'` → returns `feat.name` | **NO** (inline; see ⚠ below) |

⚠ `Selectors.getName` (`selectors.ts:299-310`) still returns `feat.name` (the literal
attribute name `"name"`) on match, **not** the slot value `feat.values[0]` — the same
suspected bug flagged in the prior discovery (§8.5). Unchanged.

Other `=== 'name'` hits in the grep are unrelated (ClassNode UI field-edit state at
`ClassNode.tsx:713/790`; `DSL/ohm.ts`, `DSL/flexmiohmtest.ts` parse `attrs.find(a => a.name.raw === 'name')`).

**Conclusion §3**: helper exists, EString-aware, inheritance-aware — but **none of the 4
inline match points consult it**. Detection is still case-insensitive and scattered.

---

## 4. `LValue.get_values` — read-path fallback — `LModelElement.tsx:7073` (fallback `:7278-7293`)

```typescript
if (!ret[0] && (dmeta?.upperBound === 1 || (!dmeta && ret.length <= 1))
    && typestr === ShortAttribETypes.EString && context.data.name?.toLowerCase() === 'name') {
    // Identity slot (name:EString) empty → fall back to the owner's
    // initialName, then data.name as emergency. … (:7280-7289)
    let o = DObject.fromPointer(context.data.father);
    const fallback = o && (o.initialName || o.name);   // :7291
    if (fallback) ret[0] = fallback;                   // :7292
}
```

**Fallback when the slot is empty: `o.initialName || o.name`** (`:7291`) — `initialName`
FIRST, then `data.name` as emergency. This is the Prompt-2-flagged change and it **is
present** (committed `84d75047f`). Differs from the prior-discovery snapshot which had
`ret[0] = o.name`.

Downstream consequence already coded for: JjScript `create` now also stamps
`initialName` with the explicit name (`jjscript/executor/commands/instance.ts:242-244`,
comment `:235-241`) precisely because this fallback surfaces `initialName` before
`data.name` and would otherwise shadow a quoted instance name.

---

## 5. `LObject.get_name` — read preference — `LModelElement.tsx:5799-5801`

```typescript
protected get_name(context: Context): this['name'] {
    return (context.proxyObject as GObject)['$name']?.value || context.data.name || context.proxyObject.instanceof?.name;
}
```

**Read order: (1) `$name?.value` (slot), (2) `data.name`, (3) `instanceof?.name`
(M2 class name).** `initialName` is **NOT** in this getter's chain — it only enters
indirectly when the slot is read via `get_values` (§4) and that read happens to populate
`$name.value` through the fallback. `get_initialName` is a separate getter (`:5803-5805`).

D-layer fields: `DObject.name` `:5721`, `DObject.initialName` `:5722`
("auto-generated at creation, immutable through normal API"). `LObject` redeclares both
(`:5772-5773`).

---

## 6. Every write point to `DObject.name` (or the L `name` proxy)

| Origin | file:line | API |
|---|---|---|
| v2-flow box title double-click (object) | `editor-v2/nodes/ObjectNode.tsx:202` (in `commitName` `:192-205`, from `handleDoubleClick` `:188`) | `syncNodeLabel(id, name)` → `canvasToJjom.ts:361` `model.name = newName` → `LObject.set_name` |
| v2-flow M1 Properties panel name | `editor-v2/panels/M1PropertiesPanel.tsx:34` (in `commitName` `:31-36`) | `syncNodeLabel(selectedNode.id, name)` → `set_name` |
| classic editor Properties panel name | `components/editors/Info.tsx:316` (`builder.named`, `:310`) | `<Input data={data} field={'name'}>` → proxy `set_name` |
| classic editor box title (no `$name`) | `utils/defaultViewTemplate.ts:160` (`CLASSIC_OBJECT_VIEW_JSX`) | `<Input data={data} field={'name'}>` → `set_name` — **only when the object has no `name:EString` slot**; if it has one, the title edits the SLOT instead (see §7) |
| programmatic — XMI import | `services/export/XMIService.ts:629,650,938` | `DObject.new(…, undefined, true)` → `defaultname` → `name = initialName` |
| programmatic — Ecore import | `api/data.ts:588` | `DObject.new(…, json["name"] \|\| "obj_1")` → constructor `name` |
| programmatic — JjTL execution | `components/project/ProjectEditor.tsx:1602` | `DObject.new(targetClass.id, dModel.id, DModel, objectName, true)` |
| programmatic — JjScript create | `jjscript/executor/commands/instance.ts:227-233` | `DObject.new(…, instanceName, true)` (+ stamps `initialName` `:243`) |
| creation (constructor write) | `LModelElement.tsx:5733-5734` (`new`) / `:5744-5746` (`new3`) | `.DNamedElement(name)` — the single creation-time `data.name` write |
| M2 (not DObject, listed for completeness) | `ClassNode.tsx:348`, `PackageNode.tsx:46`, `EnumNode.tsx:53` | `syncNodeLabel` → `LClass/LPackage/LEnum.set_name` |

**v2-flow creation note**: the three EditorV2 instance-creation sites now call
`syncCreateObject` with **no name argument** (`EditorV2.tsx:609, 1679, 2255`; comments
"Pass undefined so DObject.new owns the name → data.name === initialName" at
`:606/1676/2253`). The old `obj_<timestamp>` / `newClass2_uls` pre-generation is gone →
`data.name === initialName` at creation (this is Prompt 1's "unified naming", confirmed
executed). `syncCreateObject` itself: `canvasToJjom.ts:1137-1148`, passes
`objectName || undefined` to `DObject.new`.

**NOT a write point**: TreeViewSidebar rename is `submitRenameView` for `LViewElement`
only (`TreeViewContent.tsx:867/932`); no M1-instance rename path there. There is no tab
rename for a DObject (tabs are LModel — §1, `:5374`).

---

## 7. Every write point to the identity slot value

All slot mutations converge on `LValue.setValueAtPosition` (`:7368` → `get_setValueAtPosition`
`:7396`), **except** the `add` path which writes `DValue.values` directly.

| Origin | file:line | API |
|---|---|---|
| classic Properties panel — value commit | `components/editors/Info.tsx:667` (`changeDValue`, `:649`) | `value.setValueAtPosition(index, inputValue, {isPtr})` inside a manual `TRANSACTION` (`:650`) |
| classic Properties panel — clear "×" | `Info.tsx:646` (`remove`, `:640`) | `value.setValueAtPosition(index, undefined, {isPtr})` |
| classic Properties panel — duplicate-clear (ref) | `Info.tsx:663` | `setValueAtPosition(indexDuplicate, undefined, {isPtr:true})` |
| classic Properties panel — **add (+)** | `Info.tsx:638` (`add`, `:636`) | `SetFieldAction.new(value.id, 'values', U.initializeValue(...), '+=', false)` — **DIRECT, BYPASSES the dispatcher** → no identity propagation to `data.name` |
| classic editor box title (object **with** `name:EString` slot) | `utils/defaultViewTemplate.ts:158-159` (`CLASSIC_OBJECT_VIEW_JSX`) | `<Input data={data.$name} field={'value'}>` → `LValue.set_value` → `setValueAtPosition(0, val)` |
| classic value-node body | `utils/defaultViewTemplate.ts:182` (`CLASSIC_VALUE_VIEW_JSX`) | `<Input data={data} field={'name'}>` (edits the LValue's name when no `instanceofname`) |
| v2-flow box body inline feature edit | `editor-v2/nodes/ObjectNode.tsx:254` (`commitFeatureEdit` `:233`) and `:281` | `syncUpdateFeatureValue(id, featureName, editValue)` → `canvasToJjom.ts` `(lObject)['$'+featureName].value = X` → `set_value` → `setValueAtPosition`. When `featureName === 'name'`, writes the identity slot (+ propagates `data.name` via `:7484`) |
| programmatic — reference assignment (transformation) | `components/project/ProjectEditor.tsx:1813` | `feature.setValueAtPosition(ri, targetRealId, {isPtr:true})` |
| internal — `LValue.set_value` | `LModelElement.tsx:7597` | `get_setValueAtPosition(c)(v?.index \|\| 0, …)` (the path `nameattribute.value = val` from `set_name` lands here) |
| internal — `LValue.set_values` (bulk) | `LModelElement.tsx:7539` | loops `get_setValueAtPosition(c)(i, val[i], …)` |

**Clear behaviour detail**: `remove("×")` → `setValueAtPosition(index, undefined)`. For the
name slot (index 0) this also runs the propagation at `:7484` → writes
`SetFieldAction.new(father, 'name', undefined)`, so a clear **blanks both the slot and
`data.name`**; the empty read then falls back to `initialName` (§4).
`_clearValueAtPosition` (`:7372-7395`) itself only nulls `values.index` (`:7394`) and does
not touch `data.name`.

---

## 8. Prompt 2/3 execution status — per-item

| Item | Done? | Evidence |
|---|---|---|
| `LClass.identityAttribute` helper exists | **YES** | `LModelElement.tsx:3062/3072`; commit `999371939` (2026-05-26), +18 lines, one file |
| Helper is actually **used** (5 match points refactored to consult it) | **NO** | zero call sites; the 4 inline matches (§3 rows 2-5) are untouched; comment `:7282` explicitly keeps the duplication inline |
| `get_values` fallback changed to `initialName` | **YES** | `LModelElement.tsx:7291` `o.initialName \|\| o.name`; commit `84d75047f` (2026-05-26), +12/-1, one file |
| `DObject.initialName` field + always-stamped at creation | **YES** (Prompt 1) | `:5722`, `:5737`, `:5747`; commit `729c5ce07` (2026-05-25) |
| v2-flow naming unified to `defaultname` (no `obj_<ts>`) | **YES** (Prompt 1) | `EditorV2.tsx:609/1679/2255` pass no name; `canvasToJjom.ts:1139-1148` |
| Write-path verification / consolidation (Prompt 3) | **NO** | no central identity-write routine; `Info.tsx:638 add` still bypasses the dispatcher; `Selectors.getName` bug still present |
| `docs/claude-code-log.md` mention of "binding consolidation" applied | **NO** | the log has the 2026-05-25 anchorpoint-fix scope-violation note (§6.4, commit `729c5ce07` bundled identity files) but **no** entry recording a Prompt-2/3 consolidation task |

**Summary**: the *primitives* of Prompt 2 (helper + initialName fallback) were committed
on 2026-05-26, but the *consolidation* (wiring the helper into the scattered points) and
Prompt 3 (write-path verification) were **not** done. The brief's "never written or
executed" is therefore accurate for the refactor, but **inaccurate** for the helper and
the fallback, which already exist.

---

## 9. VersionFixer current state

Migration `2.217 -> 2.218` (the Prompt-1 identity foundation) is present at
`VersionFixer.tsx:807-832`. It populates `DObject.initialName` for existing instances
(Strategy 3a: `initialName = data.name` if non-empty, else `<MetaclassName>_<idSuffix>`),
is idempotent (`:812`), and **explicitly does not touch `data.name` or any slot**
(`:806`).

**Current latest migration is NOT 2.218.** The chain continues:
`2.218→2.219` (`:837`, no-op), `2.219→2.220` (`:842`, no-op), `2.220→2.221` (`:852`),
`2.221→2.222` (`:881`), `2.222→2.223` (`:927`), `2.223→2.224` (`:965`),
**`2.224 -> 2.225` (`:993`, no-op)** — the last method.

**`highestVersion` today = 2.225** (computed automatically from method names, `:79-102`;
`:31` initial 0). A new identity-binding migration would be `'2.225 -> 2.226'`.
The reference template for value→name propagation remains `2.205 -> 2.206` (`:506-522`,
the `DValue(name).values[0] → DObject.name` migration).

---

## 10. Loop-risk trace

The two write engines:
- **`set_name`** (`classes.ts:2153-2159`, `LObject` `LModelElement.tsx:6077-6083`): inside
  one TRANSACTION does (a) `nameattribute.value = val` → `LValue.set_value` (`:7593`) →
  `get_setValueAtPosition(0, val)` (`:7597`), and (b) `SetFieldAction.new(data,'name',…)`
  directly.
- **`setValueAtPosition`** (`:7482-7485`): writes `values.index` and — for the name slot —
  `SetFieldAction.new(father,'name',val)` **directly**.

Trace each candidate cycle:

1. **`set_name` → slot → name → set_name …?**
   `set_name` writes the slot via `nameattribute.value` → `set_value` →
   `setValueAtPosition` → which writes `data.name` with a **direct `SetFieldAction`**
   (`:7484`), NOT via `set_name`. Terminates. `set_name` then also writes `data.name`
   directly (`:2158/:6082`). `data.name` ends up written twice, both terminal. **No cycle.**

2. **slot write → name → set_name → slot …?**
   A Properties-panel / box-body / box-title slot edit calls `setValueAtPosition` →
   `data.name` via direct `SetFieldAction` (`:7484`). A direct `SetFieldAction` on
   `'name'` does **not** invoke `set_name` (the reducer just mutates state; getters are
   pull-based). Nothing re-writes the slot. **No cycle.**

**Verdict: the loop is NOT currently possible.** The propagation graph is acyclic by
construction because the *name-side* write is always a terminal direct `SetFieldAction`,
and only `set_name` (invoked solely by explicit `lobj.name = X` proxy assignment in UI
handlers) ever writes the slot from the name side. `setValueAtPosition` never calls
`set_name`. The guard is structural (write-API asymmetry), not an explicit re-entrancy
flag — so any future change that makes the slot→name propagation route through `set_name`
(instead of the direct `SetFieldAction` at `:7484`) **would introduce the loop** and must
be avoided.

---

## Summary of current sync state

- **Direction A (instance name → identity slot): WORKS today.** Editing `data.name` via
  any `set_name` path also writes `$name.value` (slot) inside the same TRANSACTION
  (`classes.ts:2156`, `LObject` `:6080`). Caveat: `LModel.set_name` doesn't (no slot, by
  design); the `Info.tsx add(+)` slot path is a separate concern (it bypasses the
  dispatcher, but that's slot-side).
- **Direction B (identity slot → instance name): WORKS today** for index-0 `name:EString`
  slots, via the direct propagation in `setValueAtPosition` (`LModelElement.tsx:7484`) and
  the read fallback `initialName || data.name` (`:7291`). **PARTIAL gap**: the
  `Info.tsx:638 add(+)` path writes `DValue.values` directly and **bypasses** the
  propagation; and identity *detection* is still inline/case-insensitive (the
  `identityAttribute` helper is unused). No loop risk on either direction as currently
  wired (§10).
