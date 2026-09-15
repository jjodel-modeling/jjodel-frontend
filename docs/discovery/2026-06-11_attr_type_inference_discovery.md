# Discovery — name-based type inference for new/renamed attributes

- **Date**: 2026-06-11
- **Type**: discovery (READ-ONLY — no source modified, report left untracked)
- **Branch**: `alfonso-frontend-jjtl`
- **Scope**: answer Q1–Q6. **No implementation.** Inference table is Phase 2.

All file:line references are against the working tree at discovery time.

---

## TL;DR

- **The rename write path is uniform and DAttribute-isolatable.** Every UI surface
  writes the name through the L-proxy setter `lAttr.name = value`, which resolves to
  the generic `set_name` on **`LPointerTargetable` (`joiner/classes.ts:2136`)** —
  shared by classes, references, enums, operations, etc. **`LAttribute` has no
  `set_name` override.** Adding one (in the `LAttribute` class body,
  `LModelElement.tsx:4178–4294`) that calls `super.set_name(...)` then conditionally
  infers — mirroring the existing `LClass.set_name` super-then-extra-action pattern
  (`LModelElement.tsx:3054–3059`) — branches **only** for DAttribute and leaves every
  other named element untouched.
- **"Type is still default" is a reliable single-pointer comparison.** A fresh
  attribute's type is the canonical singleton `'Pointer_ESTRING'`
  (`Pointers.ESTRING`, `joiner/classes.ts:1564`; `Defaults.Pointer_ESTRING`,
  `common/Defaults.ts:77`). One EString primitive is seeded per project
  (`Defaults.types`, `common/Defaults.ts:32–44`). Read it at rename time via
  `c.data.type` and compare against `'Pointer_ESTRING'`.
- **All target primitives exist and resolve.** `ShortAttribETypes`
  (`common/U.tsx:3322–3348`) declares `EString, EBoolean, EInt, EDouble, EFloat,
  EDate, ELong, EShort, EChar` (and EVoid/EByte). All are seeded in `Defaults.types`,
  so `Selectors.getPrimitiveType(...)` resolves each. **`EDouble` exists** — no need
  to fall back to `EFloat`. Bonus: the inherited `set_type` already accepts short
  names like `'date'`, `'int'`, `'double'`, `'boolean'` (`LModelElement.tsx:1422–1436`).
- **Creation path is safe and confirmed.** The add-attribute seed at
  `LModelElement.tsx:4155` is `getPrimitiveType(ShortAttribETypes.EString)` (the
  EChar→EString fix is in place). Some callers pass a non-default **name** with no
  type (`ContextMenu.tsx:319`, `canvasToJjom.ts:1448`) — these would benefit from
  creation-time inference; one caller passes an **explicit type**
  (`useClassRemoval.ts:145`), which must suppress inference. **Ecore import never
  touches `addAttribute`** — it uses `DAttribute.new` then overwrites `dObject.type`
  (`api/data.ts:879–893`), so it is inference-proof by construction.
- **Sync layer impact: none.** The rename setters are invoked synchronously from UI
  handlers, not from `useJjomSync`. A `SetFieldAction` on `DAttribute.type` changes no
  `useJjomSync` Step-4 dependency and no `useM1ReferenceEdges` trigger. **No
  VersionFixer migration** (this is session idlookup data, not a view `jsxString`).
- **One real hazard to design around (not a blocker):** the new `set_name` override
  must call `super.set_name` and `set_type` **sequentially**, never inside one new
  outer `TRANSACTION`. Both setters already open their own `TRANSACTION`
  (`classes.ts:2153`, `LModelElement.tsx:1465`); nesting them risks the documented
  merge/drop hazard (CLAUDE.md §3.3). The `LClass.set_name` precedent
  (`LModelElement.tsx:3054–3059`) does exactly the safe sequential thing.

---

## Q1 — Rename path for DAttribute

### Generic write path

There is a single logical write path for renaming, reached from every UI surface:
the **L-proxy setter** `lAttr.name = value`. The proxy intercepts the assignment and
dispatches to `set_name(value, context)`.

The generic `set_name` lives on **`LPointerTargetable`** — the universal base — at
**`joiner/classes.ts:2136`** (class declared at `classes.ts:1955`):

- `classes.ts:2138` — early return if unchanged.
- `classes.ts:2139–2151` — name-uniqueness check against siblings; on collision it
  `toast.error`s and returns without writing.
- `classes.ts:2153` — **opens its own `TRANSACTION`** (`'…name'`).
- `classes.ts:2154–2157` — propagates into the `$name` `LValue` when present
  (`nameattribute.value = val`).

This `set_name` is **generic across `DNamedElement`** subtypes. Verified overrides:

| Class | set_name | File:line |
|---|---|---|
| `LPointerTargetable` (base, inherited by DAttribute) | generic body | `joiner/classes.ts:2136` |
| `LUser` | override | `joiner/classes.ts:2822` |
| `LProject` | override | `joiner/classes.ts:3229` |
| `LClass` | override (super + `SetRootFieldAction`) | `LModelElement.tsx:3054` |
| `LModel` | override | `LModelElement.tsx:5318` |
| `LObject` | override | `LModelElement.tsx:6018` |

**`LAttribute` (`LModelElement.tsx:4178–4294`) has NO `set_name` override** — neither
do `LReference`, `LOperation`, `LParameter`, `LEnumerator`, `LEnumLiteral`. They all
resolve to `LPointerTargetable.set_name`.

### How to branch only for DAttribute

Add an `LAttribute.set_name` override inside the `LAttribute` class body
(`LModelElement.tsx:4178–4294`). The canonical precedent is `LClass.set_name`
(`LModelElement.tsx:3054–3059`):

```ts
protected set_name(val, context): boolean {
    if (context.data.name === val) return true;
    super.set_name(val, context);                 // runs its own TRANSACTION, completes synchronously
    SetRootFieldAction.new('ClassNameChanged.'+context.data.id, val, '', false); // sequential, OUTSIDE
    return true;
}
```

An `LAttribute.set_name` would, after `super.set_name(...)` returns, read the current
type and conditionally call `this.set_type(inferred, context)` (sequential, not
nested). This touches DAttribute only; every other element keeps the generic path.

### UI entry points (all converge on the proxy setter)

1. **v2-flow ClassNode inline edit** — `ClassNode.tsx`:
   `commitFieldEdit` (`ClassNode.tsx:272–319`) → `syncUpdateAttribute(attrId, 'name',
   value, classId)` (`ClassNode.tsx:294`) →
   `syncUpdateAttribute` (`canvasToJjom.ts:402–431`) does
   `(lAttr as any)['name'] = value` at `canvasToJjom.ts:426` → `set_name`.
2. **Classic Property Panel (`model/Info.tsx`)** — uses the generic field inputs in
   `components/forEndUser/`, all of which write `data[field] = value` on the bound
   L-proxy: `Input.tsx:188` / `Input.tsx:243`, `MySelect.tsx:42`,
   `Color.tsx:147`, `FunctionComponent.tsx:178`. With `data = lAttr` and
   `field = 'name'` this is `lAttr.name = value` → `set_name`.

Both surfaces funnel through `LPointerTargetable.set_name`. There is no second,
divergent rename code path for attributes. (Note: the v2-flow node `data` is a
ReactFlow mirror; `syncUpdateAttribute` is the bridge that performs the actual model
write — `ClassNode` itself never calls `set_name` directly.)

---

## Q2 — Detecting "type is still the default"

### Reading the current type at rename time

Inside the `LAttribute.set_name` override, the current type pointer is `context.data.type`
(D-layer pointer string), or equivalently `this.get_type(context).id` / `lAttr.type.id`.
For the default check, compare the **pointer string** directly:

```ts
context.data.type === 'Pointer_ESTRING'   // or Pointers.ESTRING / Defaults.Pointer_ESTRING
```

### Reliability — single canonical EString pointer

- The canonical constant is `Pointers.ESTRING = 'Pointer_ESTRING'`
  (`joiner/classes.ts:1564`) and `Defaults.Pointer_ESTRING = 'Pointer_ESTRING'`
  (`common/Defaults.ts:77`).
- Primitive types are seeded **once per project** from `Defaults.types`
  (`common/Defaults.ts:32–44`), which lists exactly one `'Pointer_ESTRING'`. There is
  no per-project duplication of the EString primitive; `getPrimitiveType` resolves by
  the fixed id `"Pointer_"+shorttype` (`selectors.ts:146–150`).
- A freshly created attribute is seeded to that exact pointer:
  - `DAttribute.new` default: `LPointerTargetable.from(Selectors.getPrimitiveType(
    ShortAttribETypes.EString)).id` (`LModelElement.tsx:4155`).
  - D-layer fallback `DTypedElement` for `DAttribute`: `type = Pointers.ESTRING`
    (`joiner/classes.ts:899–901`).

So `c.data.type === 'Pointer_ESTRING'` is a reliable "untouched default" test. (If a
user has explicitly set the type to EString, this check cannot distinguish that from
"never touched" — acceptable per the spec: inference is a default, the user can always
re-set EString and it will simply be re-inferred on the next rename. Flagged in Risks.)

---

## Q3 — Available primitive types

`ShortAttribETypes` enum (`common/U.tsx:3322–3348`):

```
EVoid, EChar, EString, EDate, EBoolean, EByte, EShort, EInt, ELong, EFloat, EDouble
```

`Defaults.types` (`common/Defaults.ts:32–44`) seeds, per project, the matching
pointers: `Pointer_EVOID, _ECHAR, _ESTRING, _EDATE, _EBOOLEAN, _EBYTE, _ESHORT,
_EINT, _ELONG, _EFLOAT, _EDOUBLE, _EOBJECT`.

`Selectors.getPrimitiveType(type)` (`selectors.ts:146–150`) resolves
`state.idlookup["Pointer_"+type.toUpperCase()]`. Every enum member above maps to a
seeded pointer.

| Inference target | enum member | seeded pointer | resolvable? |
|---|---|---|---|
| EString | ✅ `common/U.tsx:3325` | `Defaults.ts:35,77` | ✅ |
| EBoolean | ✅ `:3327` | `:37,79` | ✅ |
| EInt | ✅ `:3330` | `:40,82` | ✅ |
| **EDouble** | ✅ `:3333` | `:43,85` | ✅ (**exists — use EDouble, not EFloat**) |
| EFloat | ✅ `:3332` | `:42,84` | ✅ |
| EDate | ✅ `:3326` | `:36,78` | ✅ |
| ELong | ✅ `:3331` | `:41,83` | ✅ |
| EShort | ✅ `:3329` | `:39,81` | ✅ |
| EChar | ✅ `:3324` | `:34,76` | ✅ |

**`EDouble` and `EDate` both exist and resolve.** The inference table's row 5 can
target `EDouble` directly.

**Bonus (relevant to how Phase 2 applies the inferred type):** the inherited
`set_type` (`LModelElement.tsx:1407–1470`, on `LTypedElement`; `LAttribute` does not
override it) already accepts short type names for non-references
(`LModelElement.tsx:1414–1436`): `boolean/bool→EBOOLEAN`, `char→ECHAR`,
`string→ESTRING`, `date→EDATE`, `byte→EBYTE`, `short→ESHORT`,
`int/integer→EINT`, `long→ELONG`, `float→EFLOAT`, `double/number/real→EDOUBLE`,
`void→EVOID`. So Phase 2 can apply the result via either
`lAttr.type = Defaults['Pointer_'+name]` or `lAttr.type = '<shortname>'` — both
resolve through `set_type`, which performs the actual `SetFieldAction`
(`LModelElement.tsx:1465–1468`).

---

## Q4 — Creation path

### Seed confirmed

`DAttribute.new` (`LModelElement.tsx:4153–4158`):
`if (!type) type = …getPrimitiveType(ShortAttribETypes.EString)…` (`:4155`). The
EChar→EString fix is in place.

`LClass.addAttribute` is `get_addAttribute` (`LModelElement.tsx:3101–3104`):
`(name?, type?) => LPointerTargetable.fromD(DAttribute.new(name, type, classId, true))`.

### Callers and whether they pass a non-default name / explicit type

| Caller | call | name? | type? | inference at creation |
|---|---|---|---|---|
| Context menu "add attribute" | `lClass.addAttribute(suggestedName)` (`ContextMenu.tsx:319`) | yes | no | **would apply — desired** |
| v2-flow "+" via sync | `lClass.addAttribute()` (`canvasToJjom.ts:395`) | no | no | name defaults to `attr_N` → typically no rule match → EString |
| Undo-reconcile re-create | `lClass.addAttribute(rfAttr.name)` (`canvasToJjom.ts:1448`) | yes | **no (type dropped!)** | **would apply — but resurrects with inferred type, not the original (see Risks)** |
| Subclass flatten on removal | `subClass.addAttribute(attr.name, attr.type?.id ?? attr.__raw?.type)` (`useClassRemoval.ts:145`) | yes | **yes (explicit)** | **must be suppressed** |
| Examples (StateMachine M2) | `addAttribute('name','Pointer_ESTRING')` (`examples/StateMachine/M2/index.ts:35,46,64,66`) | yes | yes | suppressed (explicit) |
| Jjodie executor | `addAttribute(attr.name, attr.type)` (`JjodieActionExecutor.ts:110,186`) | yes | type if provided | suppressed when type given |

**Design implication:** creation-time inference should fire **only when the `type`
argument is undefined** (so `useClassRemoval`, examples, and Jjodie-with-type are
suppressed). Placing the creation-time hook in `get_addAttribute`
(`LModelElement.tsx:3102–3104`) — i.e. when `type` is falsy, derive it from `name`
before calling `DAttribute.new` — keeps the logic in one place and **does not touch
`DAttribute.new`**, which is also used by the import path.

### Ecore import is NOT affected — confirmed

The Ecore importer does **not** use `addAttribute`. `EcoreParser.parseDAttribute`
(`api/data.ts:874–902`):

- `:879–883` calls `DAttribute.new(name, undefined, parent.id)` directly.
- `:893` then **overwrites** the type explicitly:
  `dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString)`.

So imported attributes carry their own explicit type, set after construction, and the
import never goes through `addAttribute` or `set_name`. If the creation-time hook is
placed in `get_addAttribute` (recommended), import is untouched by construction; even
if it were placed in `DAttribute.new`, line `:893` would overwrite any inference.
**Either way, import is inference-proof.** (`EcoreService.ts` / `XMIService.ts` are
export-only for attribute type and irrelevant to inference.)

---

## Q5 — Proposed placement for the inference table

### Location

Proposed (not created): **`frontend/src/model/attributeTypeInference.ts`** — a pure
utility exporting:

```ts
export function inferAttributeType(name: string): ShortAttribETypes | null;
```

returning `null` when no rule matches (caller keeps the current/EString type).

### Convention fit (verified)

- `src/model/` top level already contains pure-logic siblings, including a direct
  naming precedent **`model/megamodelInference.ts`** (also `megamodel.ts`,
  `megamodelPersistence.ts`, `megamodelRuntime.ts`). `attributeTypeInference.ts`
  matches the `<domain>Inference.ts` camelCase pattern.
- Tests: **`model/__tests__/`** exists (`model/__tests__/megamodel.test.ts`), so the
  Phase-2 unit test goes at **`frontend/src/model/__tests__/attributeTypeInference.test.ts`**
  (vitest, consistent with the repo's `*.test.ts` convention).
- The utility should import `ShortAttribETypes` from `common/U.tsx` (or via the
  `joiner` barrel — `joiner/types.ts:2` re-exports it).

### No collision (verified)

Global grep for `inferAttributeType`, `attributeTypeInference`, and `inferType`
returns **no hits** anywhere in `frontend/src/`. Both the function name and the file
name are free.

### Purity note

Keep `inferAttributeType` framework-free (string in → enum/null out), so it is unit
testable without Redux. The caller (the `LAttribute.set_name` override and/or
`get_addAttribute`) maps the returned enum to a pointer (`Defaults.Pointer_E*` /
`getPrimitiveType`) or passes the short name to `set_type`.

---

## Q6 — Sync layer impact check

### Is the rename path near `useJjomSync` reactive paths?

**No.** `set_name`/`set_type` are L-proxy setters invoked **synchronously from UI
event handlers** (`commitFieldEdit` → `syncUpdateAttribute`, or the classic
`Input.tsx` `onChange`/`onBlur`). They are not called from inside `useJjomSync.ts` or
any critical-zone hook. The inference would add one `SetFieldAction` on
`DAttribute.type` (via `set_type`, `LModelElement.tsx:1465–1468`).

`useJjomSync` Step 4 deps are
`[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount,
modelObjectCount]` (CLAUDE.md §3.5). A `DAttribute.type` change alters **none** of
these (no class/ref/object count change; `modelRefCount` counts M2 `DReference`s
only). `useM1ReferenceEdges` triggers on M1 `DValue.values` changes, not on attribute
type. **So neither sync hook re-fires.** The attribute's new type re-renders in
`ClassNode` (v2-flow) and `Info` (classic) through the ordinary react-redux
subscription — the same path that already re-renders on a name change.

### Is the rename path inside a TRANSACTION today?

Yes — but its **own**, self-contained one:

- `LPointerTargetable.set_name` opens `TRANSACTION('…name')` at `classes.ts:2153`.
- The inherited `set_type` opens `TRANSACTION('…type')` at `LModelElement.tsx:1465`.

These are independent setter-local transactions, **not** sync-adjacent. CLAUDE.md
§3.3's prohibition targets wrapping `DVertex.new` / `DVoidEdge.new2` in an *outer*
transaction near `useJjomSync`; that does not apply here.

**The one rule Phase 2 must follow:** do not wrap `super.set_name(...)` +
`set_type(...)` in a *single new* `TRANSACTION`. That would nest two inner
transactions and risk the documented merge/drop of one of them. Instead, run them
**sequentially** — `super.set_name(...)` completes its transaction and returns, then
the conditional `set_type(...)` opens and completes its own — exactly as
`LClass.set_name` (`LModelElement.tsx:3054–3059`) runs `super.set_name` then a
separate `SetRootFieldAction` outside it.

### VersionFixer / jsxString

A type-default inference changes a `DAttribute.type` pointer in `idlookup`
(session/model data). It is **not** a default-view source change and rewrites **no**
`jsxString`. **No VersionFixer migration is required** — consistent with the prompt's
expectation. (Existing projects are unaffected; inference only acts on future renames/
creations.)

**Layer Impact (preview for Phase 2):** layers touched = JjOM (DAttribute.type via
`set_type`) + the rendering of the attribute row in Canvas v2-flow / classic. Layers
**not** touched = D-layer write-path for sync (`useJjomSync`), `useM1ReferenceEdges`,
persistence `jsxString`/VersionFixer. A full Layer Impact Report is **not required**
for this discovery (read-only) but **will be** for the Phase-2 implementation since it
writes through a setter (`set_type`) — though no critical-zone file
(`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts` write-back, `portDistribution.ts`,
`useM1ReferenceEdges.ts`, `VersionFixer.tsx`, `DV.tsx`) is modified.

---

## Risks

1. **TRANSACTION nesting (medium, easily avoided).** The override must keep
   `super.set_name` and `set_type` sequential, never inside one new outer
   `TRANSACTION` (CLAUDE.md §3.3 merge/drop hazard). Precedent: `LClass.set_name`
   (`LModelElement.tsx:3054–3059`). Without this discipline, the type `SetFieldAction`
   could be silently dropped.
2. **Undo-reconcile resurrection (low–medium, pre-existing).**
   `canvasToJjom.ts:1448` re-creates a deleted attribute by **name only**
   (`addAttribute(rfAttr.name)`), already losing the original type. If creation-time
   inference is added to `get_addAttribute`, undo would resurrect the attribute with an
   *inferred* type instead of EString — still not the original type. This is a
   latent bug independent of inference; flag it so Phase 2 decides whether to (a) pass
   `rfAttr.type` through here (the real fix) or (b) accept inferred-on-undo.
3. **"Untouched EString" is heuristic (low, by design).** The check
   `c.data.type === 'Pointer_ESTRING'` cannot distinguish "never set" from
   "deliberately set to EString". A user who intentionally chose EString and then
   renames to e.g. `isActive` will have the type flipped to EBoolean. Per spec this is
   acceptable (inference is a default, reversible by re-setting the type). Document it;
   do not try to track a "user touched type" flag.
4. **Creation-time inference must respect explicit `type` (low, design constraint).**
   Fire only when the `type` arg is undefined, or `useClassRemoval.ts:145`,
   examples, and Jjodie-with-type would be overridden. Placing the hook in
   `get_addAttribute` keyed on `!type` satisfies this.
5. **Name-uniqueness early returns (low, awareness).** `set_name` returns early on
   no-op (`classes.ts:2138`) and on collision (`:2144–2151`) **before** writing. An
   `LAttribute.set_name` override that infers should run inference only on the
   *successful* rename branch (i.e. after `super.set_name` actually applied the
   change), otherwise it could infer on a name the model rejected. Reading
   `context.data.name` after `super.set_name` returns, or gating on the changed value,
   handles this.

---

## No blocking ambiguity

All six questions are answered with concrete file:line evidence. The only open
*decisions* (not unknowns) are Phase-2 policy choices: (a) whether to also fix the
undo-reconcile type drop (Risk 2), and (b) whether to place the creation-time hook in
`get_addAttribute` (recommended, import-proof) vs `DAttribute.new`. The rename-time
hook itself is unambiguous and safe: an `LAttribute.set_name` override following the
`LClass.set_name` sequential pattern, with the EString-default guard from Q2.
