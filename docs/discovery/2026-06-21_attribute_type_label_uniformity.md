# Discovery — Attribute type label uniformity (EBool vs EBoolean)

**Date**: 2026-06-21
**Type**: discovery (READ-ONLY, hard stop)
**Branch**: `alfonso-frontend-jjtl`
**Prompt doc**: 2026-06-21 — discovery_attribute_type_label_uniformity
**Scope**: no source modified; this report is the only file written.

---

## TL;DR

The reported divergence is **internal to the Editor v2 (React Flow) class card**, not the
classic editor and not a persisted `jsxString`.

- **Dropdown label** `EBool` comes from a hardcoded array `E_DATA_TYPES` in
  `frontend/src/components/editor-v2/types.ts:37-39`. It is **NOT** `ShortAttribETypes`.
- **Static label** `EBoolean` comes from the JjOM model at runtime:
  `frontend/src/components/editor-v2/utils/jjomTransformers.ts:53` →
  `type: attr.type?.name ?? 'EString'`, rendered by
  `frontend/src/components/editor-v2/nodes/ClassNode.tsx:762` as `{attr.type}`.
- The two paths share **no code**. There is in fact a **third** primitive-label source,
  `validTargetOptions` (label = canonical `object.name` = `EBoolean`), used by the classic
  `Info.tsx` dropdown and by the Editor-v2 write-back mapper `syncUpdateAttribute`.
- **No `VersionFixer` migration is needed** for a display-label fix: the `EBoolean` string
  is computed at runtime in a pure transformer + React component, never baked into a
  persisted template.
- **Export is safe**: `EcoreService` reads the type from the JjOM L-proxy
  (`attr.type` → `type.name` / `Pointer_E*`), never from any display label.
- **Divergence surface today = exactly one entry**: `EBool` vs `EBoolean`. The other 7
  `E_DATA_TYPES` entries already match their canonical primitive name verbatim.

---

## Q1 — Dropdown label source

**The attribute-type dropdown in Editor v2 is `InlineTypeSelect`, and its option labels come
from `E_DATA_TYPES`, NOT from `ShortAttribETypes`.**

`frontend/src/components/editor-v2/types.ts:26-39`:
```ts
// === Tipi primitivi Ecore ===
export type EDataType =
    | 'EString'
    | 'EInt'
    | 'EFloat'
    | 'EBool'
    | 'EDate'
    | 'EChar'
    | 'ELong'
    | 'EDouble';

export const E_DATA_TYPES: EDataType[] = [
    'EString', 'EInt', 'EFloat', 'EBool', 'EDate', 'EChar', 'ELong', 'EDouble'
];
```

Rendered verbatim as the option text in `InlineTypeSelect.tsx:29-32` and `:118-127`:
```tsx
const options = [
    ...E_DATA_TYPES,
    ...enums,           // enum names from current metamodel nodes
];
...
{E_DATA_TYPES.map((type, idx) => (
    <div key={type} ... onClick={() => handleSelect(type)} ...>
        {type}                                        // ← shows literal 'EBool'
    </div>
))}
```

Mounted by `ClassNode.tsx:734-755` (attribute type) and `:811-832` (operation return type).

### Full keys → values mapping for the dropdown

`E_DATA_TYPES` is a flat array (no key→value map). Each entry is the label shown **and** the
string handed to `onChange`. What each resolves to downstream is determined by the write path
(`syncUpdateAttribute` → `LObject.set_type`, see Q5/notes). Resolution table:

| Dropdown label shown | Resolves to (pointer, via `set_type` switch) | Canonical primitive `.name` | Label == canonical? |
|----------------------|----------------------------------------------|-----------------------------|---------------------|
| `EString`            | `Pointer_ESTRING`  (`case 'estring'`)        | `EString`                   | ✅ yes |
| `EInt`               | `Pointer_EINT`     (`case 'eint'`)           | `EInt`                      | ✅ yes |
| `EFloat`             | `Pointer_EFLOAT`   (`case 'efloat'`)         | `EFloat`                    | ✅ yes |
| **`EBool`**          | **`Pointer_EBOOLEAN`** (`case 'ebool'`)      | **`EBoolean`**              | ❌ **NO** |
| `EDate`              | `Pointer_EDATE`    (`case 'edate'`)          | `EDate`                     | ✅ yes |
| `EChar`              | `Pointer_ECHAR`    (`case 'echar'`)          | `EChar`                     | ✅ yes |
| `ELong`              | `Pointer_ELONG`    (`case 'elong'`)          | `ELong`                     | ✅ yes |
| `EDouble`            | `Pointer_EDOUBLE`  (`case 'edouble'`)        | `EDouble`                   | ✅ yes |

(Pointer mapping from `LModelElement.tsx:1424-1438`, see Q5/notes.)

### Note on `ShortAttribETypes` (the prompt's lead — verified, and it is NOT the source)

`ShortAttribETypes` exists at `frontend/src/common/U.tsx:3322-3348`. Its values are
**`EBoolean`, `EByte`, …** — i.e. they are the *canonical* Ecore names ("short" only relative
to the full ecore-URI `AttribETypes` enum at `U.tsx:3616-3626`). It does **not** contain
`EBool`, and the Editor-v2 dropdown does **not** import it:
```ts
// U.tsx:3322-3333
export enum ShortAttribETypes {
    EVoid = 'EVoid', EChar = 'EChar', EString = 'EString', EDate = 'EDate',
    EBoolean = 'EBoolean', EByte = 'EByte', EShort = 'EShort', EInt = 'EInt',
    ELong = 'ELong', EFloat = 'EFloat', EDouble = 'EDouble',
}
```
`ShortAttribETypes` is consumed by value-coercion / display helpers elsewhere
(`joiner/classes.ts:2351-2362`, `forEndUser/GenericInput.tsx:158-189`, `common/U.tsx:369-379`
`solveEcoreType`, `common/DV.tsx:1107-1109` `valuecolormap`) — **none of which is the
attribute-type dropdown**.

---

## Q2 — Static visualization label source

The `: EBoolean` text on the class card is rendered by the **Editor-v2 runtime React
component `ClassNode.tsx`**, reading a string computed at runtime from JjOM. It is **NOT** a
persisted `jsxString` and **NOT** resolved via `windoww[name]`.

Render site — `frontend/src/components/editor-v2/nodes/ClassNode.tsx:757-764`:
```tsx
<span
    className="mm-field__type"
    onDoubleClick={() => startEditField(attr.id, 'type', attr.type, 'attr')}
    onClick={() => { if (selected) startEditField(attr.id, 'type', attr.type, 'attr'); }}
>
    {attr.type}                                        // ← shows 'EBoolean'
    <i className="bi bi-chevron-down mm-field__type-chevron" />
</span>
```

Value origin — `frontend/src/components/editor-v2/utils/jjomTransformers.ts:47-58`
(`classVertexToRFNode`, "JjOM → React Flow" pure transformer):
```ts
const lAttributes = lClass?.attributes ?? [];
for (const attr of lAttributes) {
    attrs.push({
        id: attr.id ?? `attr_${attrs.length}`,
        name: attr.name ?? 'unnamed',
        type: attr.type?.name ?? 'EString',           // ← canonical primitive name => 'EBoolean'
        defaultValue: attr.defaultValueLiteral || undefined,
        lowerBound: attr.lowerBound ?? 0,
        upperBound: attr.upperBound ?? 1,
    });
}
```

`attr.type?.name` is the L-proxy of the seeded primitive `DClass`/datatype; its `.name` is the
canonical Ecore name `EBoolean`. (Same pattern for operations/parameters at
`jjomTransformers.ts:93`, and in the parallel `useEditorMode.ts:348`.)

**Classification: (b)-like.** It is a **registered runtime component** (a React Flow custom
node), reading a value computed at runtime — but it is **not** resolved via `windoww[name]`;
that mechanism belongs to the classic view system, not Editor v2. It is explicitly **not (a)**
(no persisted `jsxString`) and **not (c)** (does not share a helper with the dropdown).

The exact expression producing `EBoolean` is **`attr.type?.name`** at
`jjomTransformers.ts:53`.

---

## Q3 — Shared code?

**No.** The dropdown and the static display share nothing. There are in fact **three**
independent primitive-label sources in the codebase:

1. **Dropdown (Editor v2)** — `E_DATA_TYPES` hardcoded array (`editor-v2/types.ts:37`).
   Boolean label = **`EBool`**.
2. **Static display (Editor v2)** — `attr.type?.name` from JjOM (`jjomTransformers.ts:53`),
   rendered by `ClassNode.tsx:762`. Boolean label = **`EBoolean`**.
3. **`validTargetOptions` (classic `Info.tsx` dropdown + Editor-v2 write-back map)** —
   `LModelElement.tsx:1305-1332`, where the primitive option is built by `map2`:
   ```ts
   let map2 = (object: LNamedElement): MultiSelectOption => {
       let name = object.name;                       // canonical primitive name
       return {value: object.id, label: name, title: name}
   };
   ...
   if (out && validPrimitives.length)
       out.push({label: 'Primitives', options: validPrimitives.map(map2).sort(sort)});
   ```
   Boolean label = **`EBoolean`**. Consumed by the classic property panel
   (`Info.tsx:172`, `Input.tsx:45`) and by `syncUpdateAttribute` (`canvasToJjom.ts:422-433`).

Consequence of the split: the Editor-v2 dropdown (`EBool`) even fails to highlight the
currently-set type. `InlineTypeSelect.tsx:35-37` does `options.indexOf(value)` where `value`
is the current `attr.type` = `EBoolean`; since `options` only contains `EBool`, the lookup
returns `-1` and the active option is not pre-selected.

---

## Q4 — VersionFixer dependency (LOAD-BEARING) → NO migration needed

**The `EBoolean` string is computed at runtime, OUTSIDE any persisted template.** A
display-label change would be live everywhere immediately and would **not** require a
`VersionFixer` bump or `updateDefaultView` migration.

Evidence:
- The label flows `JjOM → jjomTransformers.ts:53 (pure fn) → ClassNodeData → ClassNode.tsx:762
  ({attr.type})`. All three are TS/TSX runtime code; nothing is serialized into project state.
- The persisted default-view template `DEFAULT_VIEW_JSX_STRING`
  (`utils/defaultViewTemplate.ts:82-95`) renders only the element name and the **metaclass**
  name (`{data.instanceof.name}`) — it does **not** render attribute *type* labels:
  ```tsx
  <span className={'jjodel-default-view__type'}>{data.instanceof.name}</span>
  ```
- The classic M1 templates (`defaultViewTemplate.ts:119+`) render attribute *slots* (values),
  not type labels.
- The `{{type.name}}` occurrences in `DV.tsx` (`:78, :132, :134, :136-137, :147, :150`) belong
  to the **Emfatic / textual serializers** (handlebars/JS engines for text export), not to the
  graphical class card, and resolve to canonical names anyway.

So the only place that renders the attribute-type label on the card is the Editor-v2
`ClassNode`, and it is not persisted. **Q4 answer: runtime, no migration.**

(If a future fix were instead applied to a default-view `jsxString` — it is not, for this bug —
then §3.9 migration discipline would apply. Flagged only for completeness; not the case here.)

---

## Q5 — Export safety → confirmed safe

Ecore export reads the type from the **JjOM L-proxy**, never from a display label.

`EcoreService.exportAttribute` — `services/export/EcoreService.ts:274-282`:
```ts
private static exportAttribute(attr: LAttribute, indent: string): string {
    const parts: string[] = [ `xsi:type="ecore:EAttribute"`, `name="${this.escapeXml(attr.name)}"` ];
    // Type mapping
    const ecoreType = this.mapToEcoreType(attr.type);     // ← attr.type is the JjOM L-proxy
    parts.push(`eType="${ecoreType}"`);
```

`mapToEcoreType` — `EcoreService.ts:676-712`:
```ts
const isString = typeof type === 'string';
const typeName = isString ? type : (type.name || 'EString');                  // proxy .name
const isCanonical = isString || (typeof type.id === 'string' && type.id.startsWith('Pointer_E'));
const typeMap = { ... 'EBoolean': 'ecore:EDataType ...#//EBoolean', 'Boolean': ..., 'boolean': ..., ... };
if (isCanonical && typeMap[typeName]) return typeMap[typeName];
return `#//${typeName}`;
```

For the boolean primitive the L-proxy carries `name === 'EBoolean'` and
`id === 'Pointer_EBOOLEAN'` (`startsWith('Pointer_E')` ⇒ `isCanonical`), so it maps to the
canonical `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean`. The Editor-v2
display string (`ClassNodeData.attributes[].type`, plain React state) is never passed to
`EcoreService`. **Changing the display label cannot affect export.**

---

## Q6 — Full divergence surface

**Only one entry diverges today: `EBool` (dropdown) vs `EBoolean` (canonical/static).**

Comparing every `E_DATA_TYPES` label to the canonical primitive `.name`:

| `E_DATA_TYPES` label | Canonical `.name` | Diverges? |
|----------------------|-------------------|-----------|
| `EString`            | `EString`         | no |
| `EInt`               | `EInt`            | no |
| `EFloat`             | `EFloat`          | no |
| **`EBool`**          | **`EBoolean`**    | **YES** |
| `EDate`              | `EDate`           | no |
| `EChar`              | `EChar`           | no |
| `ELong`              | `ELong`           | no |
| `EDouble`            | `EDouble`         | no |

So the static-vs-dropdown divergence for the *same* label set is the single Boolean case.

Two related observations a "single source of truth" fix should account for (not extra
divergences in the strict sense, but relevant to scope):
1. **Dropdown coverage gap**: `E_DATA_TYPES` omits `EVoid`, `EByte`, `EShort` (present in
   `ShortAttribETypes` / seeded primitives). These canonical types are simply not offered by
   the Editor-v2 inline dropdown; the classic `validTargetOptions` dropdown does offer them
   (under their canonical names).
2. **Dropdown-vs-dropdown divergence**: the Editor-v2 dropdown (`EBool`) and the classic
   `Info.tsx` dropdown (`validTargetOptions` → `EBoolean`) already disagree on the Boolean
   label. A shared source of truth would unify all three (two dropdowns + static).

---

## Mechanism recap (how the bug manifests end-to-end)

1. User opens the inline type editor on an attribute. `startEditField(..., attr.type, ...)`
   seeds `editValue = 'EBoolean'` (`ClassNode.tsx:759-760`).
2. Dropdown lists `E_DATA_TYPES` → user sees/picks **`EBool`** (`InlineTypeSelect.tsx:118-127`).
   The already-set `EBoolean` is not highlighted (Q3).
3. `onChange('EBool')` optimistically sets `ClassNodeData.attributes[].type = 'EBool'`
   (`ClassNode.tsx:736-750`) and calls `syncUpdateAttribute(attrId, 'type', 'EBool', id)`.
4. `syncUpdateAttribute` (`canvasToJjom.ts:421-433`) looks up `'EBool'` in
   `lAttr.validTargetOptions` (whose labels are canonical, e.g. `EBoolean`) → **no match** →
   falls through to `lAttr.type = pointerId || value` ⇒ assigns the raw string `'EBool'`.
5. The `LObject.set_type` setter (`LModelElement.tsx:1409-1471`) lowercases to `'ebool'`,
   matches `case 'ebool': ptr = Defaults.Pointer_EBOOLEAN` (`:1426`), and writes the
   **EBoolean primitive pointer** to `DAttribute.type` via `SetFieldAction` (`:1469`).
6. Next sync, `jjomTransformers.ts:53` reads `attr.type?.name === 'EBoolean'` → the card
   reverts to displaying **`EBoolean`**.

Net: the write resolves correctly to the EBoolean primitive (no data corruption), but the
*label shown statically* (`EBoolean`) never equals the *label offered in the dropdown*
(`EBool`).

---

## Files inspected (read-only)

- `frontend/src/components/editor-v2/types.ts` (`EDataType`, `E_DATA_TYPES`)
- `frontend/src/components/editor-v2/components/InlineTypeSelect.tsx`
- `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (`:734-765`, `:811-839`)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`:40-100`)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`syncUpdateAttribute :411-440`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`get_validTargetOptions/get_validTargets :1282-1336`, `set_type :1409-1472`)
- `frontend/src/services/export/EcoreService.ts` (`exportAttribute :274-282`, `mapToEcoreType :676-713`)
- `frontend/src/common/U.tsx` (`ShortAttribETypes :3322-3370`, `solveEcoreType :366-382`)
- `frontend/src/common/DV.tsx` (Emfatic serializers `:65-155` — confirmed not the card)
- `frontend/src/utils/defaultViewTemplate.ts` (`DEFAULT_VIEW_JSX_STRING :82-95` — confirmed no attr-type label)

---

## HARD STOP

Discovery complete. No fix proposed or applied, per the prompt. Awaiting go-ahead.
