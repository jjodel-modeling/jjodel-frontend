# Discovery — JjEL M1 Navigation Surface

**Date**: 2026-06-11
**Type**: discovery — READ-ONLY (no code changed, no commit)
**Branch**: alfonso-frontend-jjtl
**Scope**: static analysis with file:line evidence. No dev server run.

---

## Executive summary

The central hypothesis is **confirmed, and is stronger than stated**.

`t.name` works on `Class.instances[i]` **only** because `shallowObjectToJjelValue` writes
`result.name = obj.name` as an explicit line (`eval.ts:395`). The user-feature-first
resolution that makes `data`/`self` rich (`wrapSelectedElement`) is **not** active on
extent-produced handles. As a consequence:

- **Attribute slots** (e.g. `State.instances[0].isInitial`) do **not** resolve on extent handles. Not just references — *user attributes too*.
- **Reference slots** (`t.nextState`) do not resolve on any JjEL surface.
- **Bare M1 instance names** (`Idle`) do not resolve.
- **`parent`** is not exposed in JjEL (it exists only in the JjTL source-model build + JjTL executor).

The root cause is a **three-wrapper divergence**: three different functions convert a JjOM
M1 element into a JjEL/plain value, each with a different key surface. The extent wrapper
(`shallowObjectToJjelValue`) is the poorest of the three; the JjTL source builder is the
richest (it already materializes reference slots and `_containerId`).

The mechanical reason the extent wrapper extracts nothing: `extractAttributeValues`
Strategy 1 scans `$`-prefixed **own keys**, but the L-proxy `ownKeys` trap
(`proxy.ts:524` → `mergedObject`) never exposes dynamic `$slot` keys; and Strategy 2
needs a `features` array on the target record, which `shallowObjectToJjelValue` never sets.
`wrapSelectedElement` escapes this only because it copies the raw D-object's `features`
own-key first, which re-enables Strategy 2.

---

## Q1 — Instance handle construction

**Code path.** Elements of both `instances` and `Class.instances` are produced by
`shallowObjectToJjelValue` in `frontend/src/jjscript/executor/commands/eval.ts:386-409`,
called from `buildEvalContext`:

- `eval.ts:127-128` — `instances` (bare collection):
  ```ts
  const allInstancesJjel = rawM1Objects.map((o) => shallowObjectToJjelValue(o, classByName));
  variables['instances'] = allInstancesJjel;
  ```
- `eval.ts:145-162` — per-class `instances` / `allInstances` reuse the **same** shared
  plain objects (`allInstancesJjel[j]`), so identity holds across both surfaces.

`rawM1Objects` (`eval.ts:105-110`) come from `metamodel.instances` (the M1 `DModel`s) →
`m.allSubObjects || m.objects`. These are **L-proxies** (`LObject`); `get_allSubObjects`
and `get_objects` return `LPointerTargetable`-wrapped objects.

**Keys materialized** (`shallowObjectToJjelValue`, `eval.ts:391-408`):

| Key | Source | Line |
|---|---|---|
| `id` | `obj.id` | 392 |
| `__type` | literal `'Object'` | 393 |
| `name` | `obj.name` (explicit) | 395 |
| `instanceOf` | shared plain class object from `classByName`, or `null` | 403 |
| `instanceof` | same reference as `instanceOf` (deprecated alias) | 404 |
| *(attr values)* | `extractAttributeValues(obj, result)` — **adds nothing**, see below | 407 |

The inspector's "**+1 internal**" is `__type` (it starts with `_`, and is not in the
technical-hidden set `{__jjelFunction,__raw,__proxy}` — `JjelValueInspector.tsx:24,49`).
`id` shows in the headline because it is neither reserved, internal, nor technical
(`JjelValueInspector.tsx:153-160`). `instanceof` (lowercase alias) is dropped from the UI
entirely (reserved at line 19, but excluded from the Properties section at line 163).
So the observed surface — `instanceOf`, `name`, `id`, `+1 internal` — is **exactly** the
five keys above with the alias hidden.

**Eager shallow copy, not a lazy proxy.** `shallowObjectToJjelValue` returns a fresh plain
object built at context-construction time; there are no getters and no Proxy. The whole
`buildEvalContext` is eager: all classes, attributes, references, packages, enums and the
full instance pool are materialized on every evaluation (`eval.ts:117-218`).

**Why `extractAttributeValues` adds nothing here** (`modelContext.ts:23-83`):

- *Strategy 1* (`modelContext.ts:41-60`) iterates `Reflect.ownKeys(proxy)` and keeps keys
  starting with `$`. But `proxy` is an `LObject` whose `ownKeys` trap
  (`proxy.ts:524-528`) returns `mergedObject` = `{...target}` (raw `DObject` own fields:
  `id, name, initialName, instanceof, features, father, parent` — `DObject` at
  `LModelElement.tsx:5711-5752`) **plus** non-`get_`/`set_` keys of the L-prototype
  (`proxy.ts:517-523`). Dynamic `$name`/`$nextState` slots are resolved by the
  `_defaultGetter`, are **not** own keys, and therefore never appear. Strategy 1 finds
  zero `$` keys.
- *Strategy 2* (`modelContext.ts:62-82`) needs `context.features` to be an array. The
  `result` passed in has only `{id, __type, name, instanceOf, instanceof}` — no `features`.
  Skipped.

Hence only the explicit `name` survives.

---

## Q2 — Feature resolution on instances (central hypothesis)

**The user-feature-first resolution** lives in `extractAttributeValues`
(`frontend/src/jjel/evaluator/modelContext.ts`). It reads `$attrName.value` slots off an
L-proxy and writes them as unprefixed top-level keys, **overriding** built-ins
(`modelContext.ts:19-21`). It is the only mechanism that surfaces metamodel feature values.

**It is invoked by two wrappers** but is effective in only one:

- `wrapSelectedElement` (`eval.ts:446`) — **effective**. Before calling it, the function
  copies every `Reflect.ownKeys(me)` value onto `result` (`eval.ts:427-442`). Because the
  raw `DObject` has `features` as an own field (`DObject.features`,
  `LModelElement.tsx:5726`), `result.features` is set to the LValue array, which re-arms
  Strategy 2. Strategy 2 then reads `me['$'+fname].value` for each feature
  (`modelContext.ts:62-82`). This is why `data.age` / `self.<attr>` work.
- `shallowObjectToJjelValue` (`eval.ts:407`) — **inert**, for the reasons in Q1.

**Verdict on the hypothesis.** Confirmed. `t.name` resolves on extent handles purely
because of the hard-coded `result.name = obj.name` at `eval.ts:395`, **not** because
feature resolution is active. A non-built-in user attribute such as
`State.instances[0].isInitial` would **not** resolve today: it is never materialized onto
the plain object (both extraction strategies fail), so `getProperty` finds
`'isInitial' in obj === false` and returns `null` with a `property-not-found` warning
(`evaluator.ts:489-516`). The resolution path for `data`/`self` and the path that wraps
`Class.instances` elements are indeed **two different wrappers with different surfaces**.

---

## Q3 — Reference slots

**Storage.** An M1 slot is a `DValue` (`LModelElement.tsx:6338` `DValue`,
`6393` `LValue`); a `DObject` owns one `DValue` per feature via
`features: Pointer<DValue>[]` (`LModelElement.tsx:5726`). A `DValue` carries both attribute
values and reference values; its `instanceof` points at the `DAttribute` **or** `DReference`
that types it (`LModelElement.tsx:3673`). The L-layer reads slot values through
`LValue.get_values` / `get_value` (`LModelElement.tsx:7073`, `7059`), and the
`$featureName` shortcut resolves through the proxy `_defaultGetter` chain
(`LValue._defaultGetter` `LModelElement.tsx:6477-6498`; for an `LObject`, `$childName`
matches sub-objects/values).

**Is any existing path exposing a reference slot on a JjEL instance handle? No.**
`shallowObjectToJjelValue` never enumerates `obj.features`. The only feature-bearing
mechanism (`extractAttributeValues`) is inert on extent handles (Q1/Q2). On `data`/`self`,
Strategy 2 *does* iterate **all** features — attributes and references alike — so a
reference slot is a *candidate* for surfacing via `me['$ref'].value`; whether the resolved
value is navigable depends on `LValue.get_value` for references and was not run here. Treat
"`data.nextState` may partially surface" as a code-path inference, not a verified fact.

**Natural insertion point.** `shallowObjectToJjelValue` (`eval.ts:386-409`) is the single
place to enumerate slots: iterate `obj.features` (the `DValue` list), split attribute vs
reference by the slot's `instanceof` metaclass, resolve reference targets to the **shared**
instance plain objects in `allInstancesJjel` (keyed by target id) so equality/identity hold
(Q5), and write them under the feature name.

**Cross-MM safety of target resolution.** The L-layer resolves a slot's type via
`LValue.get_type` (`LModelElement.tsx:1373-1403`). Its **primary** path is
`LPointerTargetable.from(c.data.type)` — a global, id-keyed `idlookup` resolution, which is
**cross-MM safe** (pointers are project-global ids). The **fallback** path, taken only when
`type` is an unresolved *string*, uses `model.getClassByName(rawType)` or
`Selectors.getByName(DClass, rawType, false, true)` (`LModelElement.tsx:1388,1394-1395`) —
a **name-based** lookup that is the known cross-MM blind spot (sessions 2026-05-30,
2026-06-05). **Recommendation for any slot-enumeration design: resolve targets by pointer /
`get_type`, never by re-matching class names against `idlookup`.** Note that the *current*
extent pool itself is already built with a name-based class filter — `instType === cName`
on `obj.instanceof.name` (`eval.ts:149-156`) — which is mono-metamodel-blind if two
metamodels share a class name; a reference-resolution design should not inherit that.

---

## Q4 — Identifier resolution chain

The evaluator's bare-IDENT resolution is **flat** (`evaluateIdentifier`,
`evaluator.ts:211-242`):

1. **Builtins** — `ctx.hasBuiltin(name)` → `getBuiltin` (`evaluator.ts:213-215`).
   Registered set: date constructors `now/today/date/datetime/parseDate`, and type
   converters `String/Number/Boolean/Array` (`evaluator.ts:83-115`).
2. **Context variables** — `ctx.has(name)` → `ctx.get(name)` (`evaluator.ts:218-220`).
3. **Otherwise** → `null`, plus a deduplicated `undefined-identifier` warning with a
   Levenshtein suggestion when a diagnostics sink is active (`evaluator.ts:226-241`). This
   is where `Unknown identifier Idle` originates.

All the richness (`classes`, `instances`, `attributes`, `references`, `packages`,
`enumerations`, `metamodel`, `project`, `data`, `node`, and each `<ClassName>`) is **not**
a separate namespace tier — every one is just a key written into `variables` by
`buildEvalContext` (`eval.ts:119,128,172,182,186,189,193,201,213-218,229,233`) and seeded
into the `EvaluationContext`. The class-name bindings explicitly **skip on collision** with
existing keys (`eval.ts:216` `if (name in variables) continue;`), so built-ins win.

**Where instance-by-name would go.** Add a fourth resolution tier *inside*
`buildEvalContext`: register each M1 instance under its `name` (analogous to the per-class
loop at `eval.ts:213-218`), guarded against collisions with class names and built-ins. The
data is **already reachable** at that point — `allInstancesJjel` (`eval.ts:127`) is the
materialized pool; no new threading is needed. The ambiguity hazard (two instances sharing
a name) must be designed for (see Q9). This is a context-build change, **not** an evaluator
change — `evaluateIdentifier` needs no edit.

---

## Q5 — Equality semantics

`==`/`!=` route through `isEqual` (`evaluator.ts:300-304`, impl `983-1002`):

1. `a === b` — JS reference/primitive equality (`evaluator.ts:984`).
2. `null` handling: `a===null || b===null` → `a===b` (`985`).
3. type-mismatch → `false` (`987`).
4. arrays → element-wise recursive `isEqual` (`989-992`).
5. **objects → structural deep compare**: same key count, every key recursively equal
   (`994-999`). **Not** reference-only, **not** id-based.

For two extent handles built per Q1: if they are the *same* shared pool object,
`a === b` short-circuits to `true` (step 1) — and the design shares references across
`instances`/`Class.instances`, so identity is intentional and reliable there
(`eval.ts:151`). If they are distinct objects, the structural compare on
`{id,__type,name,instanceOf,instanceof}` would still return `true` only when those match
(notably equal `id`), which is acceptable. So **`t.nextState == Idle` would compare
correctly *if both sides were real handles*** — either by shared-reference identity or by
matching `id`.

The observed bug is upstream of equality: `t.nextState` → `null` (Q3) and `Idle` → `null`
(Q4 unknown identifier), so `null == null` hits step 2 → `true`, producing the
silent-null cascade that returns all transition names.

---

## Q6 — allInstances

**Implemented, in two independent places:**

- **Context build (the one users hit):** `eval.ts:138-162`. For each class it builds a
  `subclassNames` set from `cls.allSubclasses` (`eval.ts:140-143`), then pushes a shared
  instance into `instances` when `instanceof.name === cName` and into `allInstances` when
  `instanceof.name` is in the subclass set (`eval.ts:147-160`). So it **does** traverse the
  subclass hierarchy — via the precomputed `allSubclasses` name set, matched by
  `instanceof.name`.
- **L-layer (not used by JjEL build):** `LClass.get_allInstances`
  (`LModelElement.tsx:3173-3176`) = `get_allSubClasses(true).flatMap(c => c.instances)`,
  where `get_instances` reads the `DClass.instances` pointer list
  (`LModelElement.tsx:3178-3182`). `buildEvalContext` deliberately bypasses this because the
  pointer list "is unreliable here" (comment `eval.ts:101-104`).

Both are name/subclass-hierarchy aware; the context-build version is authoritative for JjEL.

---

## Q7 — Extent scope

`instances` and `Class.instances` are scoped to the **target metamodel**, not the "current
model" and not (directly) the whole project:

- `m1models = (metamodel as any).instances` (`eval.ts:105`) — the `DModel`s that are M1
  instances *of the target metamodel*.
- `metamodel` = `getTargetMetamodel(context, project)` (`eval.ts:98`), which resolves to:
  explicit `targetMetamodelId` → else the active/selected metamodel (if in project) → else
  `metamodels[0]` (`utils.ts:287-306`).
- The pool is the union of **all** those models' `allSubObjects` (`eval.ts:106-110`), and
  `Class.instances` filters by **class name** (`instType === cName`, `eval.ts:149-156`).

So the boundary is "every M1 model conforming to the active metamodel," pooled and
name-filtered. In a single-metamodel project that is effectively project-wide, which
explains the 2026-04-30 observation that `Attribute.instances` returned instances across the
whole project: with one metamodel and multiple M1 models, all matching-named objects are
unioned, and there is no per-model boundary applied at the `instances`/`Class.instances`
level. There is **no** filtering down to a single "active model" anywhere on this path.

---

## Q8 — parent / eContainer (status of the 2026-04-17 decision)

**Partially implemented — JjTL only, not JjEL, and not a D-layer field.**

- **D-layer:** there is **no** `_containerId` field on `DObject` (`DObject`,
  `LModelElement.tsx:5711-5752` — fields are `id, name, initialName, instanceof, features,
  partial, father, parent`). The container is recoverable structurally by the 2-hop
  `child.father (DValue) → DValue.father (owning DObject)` (documented in
  `XMIService.ts:728,827`).
- **JjTL source-model build (synthetic stamp):** `ProjectEditor.tsx:1411-1422` computes
  `_containerId` while building the deep-copyable source records: it reads
  `obj.__raw.father`, and if that father is a `DValue`, sets
  `result._containerId = String(fatherData.father)` (the owning DObject); root objects
  (father = DModel) get no `_containerId`. The same builder also materializes every
  `feature.name` (attributes **and** references, the latter as `{__ref: PointerId}` via
  `wrapIfRef`) reading raw `DValue.values` with dedup (`ProjectEditor.tsx:1376-1408`).
- **JjTL executor (consumer):** `executor.ts:1957-1985` implements the `parent` keyword:
  (1) a user feature named `parent` wins; (2) else `_containerId` → look up the container in
  `sourceModel`; (3) else fall back to `.father / .eContainer / .owner`.
- **JjEL:** **not reachable.** `shallowObjectToJjelValue` does not stamp `_containerId` or
  `parent`, and the evaluator has no `parent`/`eContainer` accessor. (The proxy `set`/`get`
  alias `parent → father` at `proxy.ts:389,467` is L-proxy-internal and never reaches the
  plain JjEL handle.) Hence `t.parent` → `property-not-found` (matches the runtime probe).

Summary: the `_containerId`/parent machinery exists end-to-end **for JjTL transformations**
but was never wired into the JjEL instance handle.

---

## Q9 — Diagnostics infrastructure

**Two warning kinds, one channel.**

- `property-not-found` — raised in `getProperty` when `property in obj === false` on a
  navigable object, only if `ctx.diagnostics` is set (`evaluator.ts:500-514`). Dedup by
  identifier; Levenshtein suggestion over `Object.keys(obj)` minus `__`-prefixed
  (`evaluator.ts:506-507`).
- `undefined-identifier` — raised in `evaluateIdentifier` for an unbound bare IDENT, same
  gating and dedup (`evaluator.ts:226-240`).

**Channel structure.** `evaluateWithDiagnostics` (`evaluator.ts:129-143`) allocates a fresh
`JjelWarning[]`, assigns it to `evalCtx.diagnostics`, runs `evaluate`, and restores the
previous sink in `finally`. Child contexts thread the same sink (so warnings raised inside
`forall`/lambda scopes bubble up). The public entry is `jjelEvalWithDiagnostics`
(`jjel/index`), consumed by Jodie code mode (`jodieJjelContext.ts:67`) and rendered by
`ChatMessages.tsx:203-204` ("Property X not found on object." / "Unknown identifier X.").
When no sink is active (template/viewpoint/JjScript paths) behavior is silent-null,
preserving existing semantics (`evaluator.ts:498-499`, comment).

**Where future pedagogical errors attach:**
- (a) *collection property access* — **already exists**: `getProperty` on an array throws
  `Cannot access property 'X' on a collection. Use 'forall x in collection : x.X'`
  (`evaluator.ts:412-416`). So `classes.name` already redirects to `forall`. A non-throwing
  warning variant would also slot here.
- (b) *ambiguous instance name* — would attach to the new instance-by-name tier in
  `buildEvalContext` (Q4); a warning kind like `ambiguous-instance` should be pushed to the
  same diagnostics sink when a name maps to >1 instance.
- (c) *unknown identifier inside an equality comparison* (the silent-null cascade) — the
  `undefined-identifier` warning already fires for `Idle` (`evaluator.ts:226-240`); the gap
  is that `==` does not consult diagnostics. A `==`-aware check in `applyBinaryOperator`
  (`evaluator.ts:300-304`) could escalate "comparison where one operand is an
  unknown-identifier null" into a dedicated warning so `t.nextState == Idle` is flagged
  rather than silently truthy.

The existing pattern (push to `ctx.diagnostics` when present, stay silent otherwise) is the
template for all three.

---

## Q10 — instanceOf on extent handles

On extent handles `instanceOf` holds a **navigable class object**, not a string. In
`shallowObjectToJjelValue` it is set to the shared plain class object from `classByName`
(`eval.ts:402-404`): `result.instanceOf = classObj` (and `instanceof` = same reference).
That `classObj` is a full `shallowClassToJjelValue` shell with `name`, `attributes`,
`references`, `instances`, etc. So `p.instanceOf.name` works as the book specifies, and
`obj.instanceOf == Person` resolves by reference identity (the shared shell).

The `instanceOf: "Transition"` **string** in the inspector is a **display collapse**:
`JjelValueInspector.tsx:143-150` reads `value.instanceOf.name` and shows the name string in
the headline. The underlying value remains the class object. (If `classByName` lacked the
type — e.g. cross-MM name miss — `instanceOf` would be `null`, `eval.ts:402`.)

---

## Surface map

| Capability | Status | Code location |
|---|---|---|
| Attribute slot read (extent handle) | **absent** | `eval.ts:407` extractAttributeValues inert (Q1/Q2) |
| Attribute slot read (`data`/`self`) | **present** | `eval.ts:446` + `modelContext.ts:62-82` Strategy 2 |
| Reference slot read (any JjEL handle) | **absent** | no `obj.features` enumeration in `eval.ts:386-409` |
| Reference slot read (JjTL source / `data`?) | partial | JjTL: `ProjectEditor.tsx:1376-1408`; `data` via `$ref.value` unverified |
| Enum value collapsing | n/a here | enums wrapped as class-side only (`eval.ts:363-374`); no M1 enum-slot read |
| `instanceOf` navigability (extent) | **present** | `eval.ts:402-404` (shared class object) |
| `parent` / eContainer (JjEL) | **absent** | not stamped; evaluator has no accessor (Q8) |
| `parent` / eContainer (JjTL) | **present** | `ProjectEditor.tsx:1411-1422` + `executor.ts:1957-1985` |
| Instance-by-name resolution | **absent** | no per-instance binding in `buildEvalContext` (Q4) |
| `allInstances` (subclass-aware) | **present** | `eval.ts:138-162` |
| Handle equality (`==`) | present (structural + shared-ref) | `evaluator.ts:983-1002` |
| Extent model-scoping | metamodel-scoped (not per-model) | `eval.ts:98-110`, `utils.ts:287-306` |
| Cross-MM-safe target resolution | partial | pointer path safe (`LModelElement.tsx:1374`); string + name-filter paths blind (`1388-1395`, `eval.ts:149`) |

---

## Wrapper inventory

Every function that converts a JjOM element into a JjEL/plain value.

**Class-side wrappers** (all in `eval.ts`):

| Wrapper | Line | Keys exposed |
|---|---|---|
| `shallowClassToJjelValue` | 251-305 | `name, className('DClass'), isAbstract, isInterface, allowCrossExtend, isFinal, isSingleton, isRootable, isPartial, attributes[], references[], operations[], superTypes[], instances[]*, allInstances[]*, attributeCount, referenceCount, operationCount, instanceCount, __type:'Class'` (*filled in post-pass 159-161) |
| `shallowAttributeToJjelValue` | 310-321 | `name, type, className, isDerived, isId, multiValued, defaultValue, __type:'Attribute'` |
| `shallowReferenceToJjelValue` | 326-339 | `name, type, containment, multiplicity, upperBound, lowerBound, opposite, className, __type:'Reference'` |
| `shallowPackageToJjelValue` | 344-358 | `name, uri, prefix, classes[{name,isAbstract,isInterface}], classCount, __type:'Package'` |
| `shallowEnumToJjelValue` | 363-374 | `name, literals[{name,value}], literalCount, __type:'Enumeration'` |
| `metamodel` literal | 193-197 | `name, isMetamodel:true, classes[]` |
| `project.metamodels[*]` literal | 201-208 | `name, metamodels[{name,isMetamodel,classes[shallowClass]}]` |

**M1-instance wrappers — the three that diverge:**

| Wrapper | Location | Keys exposed | Refs? | Container? |
|---|---|---|---|---|
| `shallowObjectToJjelValue` (JjEL extent: `instances`, `Class.instances`) | `eval.ts:386-409` | `id, __type:'Object', name(explicit), instanceOf, instanceof` + (inert attr extraction) | **no** | no |
| `wrapSelectedElement` (JjEL `data`/`self`/`node`) | `eval.ts:421-491` | all raw D own-keys copied (`id,name,instanceof,features,father,parent,...`) + attr values via Strategy 2; `className` stripped; `instanceOf`/`instanceof` overridden to shared class obj; if element is a metaclass, hydrated with class structural props (`isAbstract,instances,attributes,...`) | refs are *candidates* via `$ref.value` (unverified) | no |
| JjTL source-instance builder | `ProjectEditor.tsx:1370-1424` | `id, name, className, __type:className`, every `feature.name` (attrs + refs as `{__ref}`), `_containerId` | **yes** (`{__ref:PointerId}`) | **yes** (`_containerId`) |
| `shallowToJjelValue` (JjTL executor internal, for `parent`/alias binds) | `executor.ts` (used at 1954,1971,1982) | shallow copy of a JjTL source record | inherits from builder | inherits |

The unification target is clear: the JjTL builder already proves references + container can
be materialized cheaply from raw `DValue.values`; the JjEL extent wrapper is the one that
needs to be brought up to that surface (ideally resolving refs to shared instance handles
for identity, per Q5, and via pointer/`get_type` for cross-MM safety, per Q3).

---

## Risks and constraints (for a lazy-proxy redesign of instance handles)

1. **Inspector serializes keys eagerly.** `JjelValueInspector.tsx` calls `Object.keys(value)`
   (`safeKeys`, line 45) and reads every key (`groupProperties`, `renderValue`). A lazy
   Proxy with getters would (a) be invoked for every key during inspection, including
   expensive ref-target resolution, and (b) must implement an `ownKeys`/`getOwnPropertyDescriptor`
   trap or `Object.keys` returns nothing. The current plain-object design is what makes the
   inspector cheap and total.
2. **Equality is structural** (`evaluator.ts:994-999`). A Proxy whose `ownKeys` differs from
   a plain object's, or whose getters have side effects, would make `==` non-deterministic or
   order-dependent. Any redesign must preserve "same instance ⇒ shared reference" (`a===b`
   fast path) and avoid making two handles to the same DObject structurally unequal.
3. **`with...do` enumerates keys.** `evaluateWithDo` (`evaluator.ts:925-929`) does
   `Object.entries(ctxObj)` to bind every non-`__` key into scope. A lazy handle would force
   resolution of all slots on `with obj do ...`, and a Proxy must support enumeration.
4. **`extractAttributeValues` already iterates `Reflect.ownKeys`** (`modelContext.ts:26`).
   If instance handles become proxies, this contract (own-keys reflect slots) interacts with
   the existing L-proxy `ownKeys` trap — the very mismatch that breaks Strategy 1 today
   (Q1). A redesign should fix the surface at the *wrapper* layer (materialize slots onto a
   plain object), not by exposing the L-proxy directly to the evaluator.
5. **Redux immutability / circular back-refs.** `ProjectEditor.tsx:1379-1388` explicitly
   reads raw `DValue.values` instead of L-getters precisely because L proxies have circular
   back-refs (`LClass.attributes[0].owner`) that "freeze the thread during deep copy."
   Any eager ref-materialization in `shallowObjectToJjelValue` must resolve to the shared
   instance pool (ids), never embed live L-proxies, or it risks the same cycle / infinite
   inspection.
6. **Eager whole-context cost is already O(all M1 objects).** `buildEvalContext` materializes
   the full instance pool on every evaluation (`eval.ts:127`, `145-162`). Adding per-instance
   slot materialization multiplies that by feature count; for large M1 models this is the
   main performance consideration. A lazy slot getter would help here but conflicts with
   risks 1–3. The tension (lazy for cost vs eager for inspector/equality/with-do) is the
   central design trade-off.
7. **Name-based class filter in the pool** (`eval.ts:149` `instType === cName`) is
   mono-metamodel-blind. A redesign that adds reference navigation should switch identity to
   pointer/`get_type` and avoid widening the existing name-collision exposure.

---

## Hard stop honored

Read-only. No files modified except this report and the log entry. No design or
implementation performed.

---

# Stage 1 debug 2026-06-11

**Symptom**: after `npm start` restart + hard refresh, Jodie Console (code mode)
probes show the PRE-Stage-1 surface — `State.instances[0]` exposes only
`instanceOf, name, id, __type`; `State.instances[0].isInitial` → null +
`Property isInitial not found`. The fill writes zero keys.

**Verdict**: The Stage-1 implementation is **correct and on the executed path**;
the Q3-hypothesised "pointer-string" deref bug is **absent**. By elimination, the
executed bytecode at probe time **did not contain the slot-fill pass** → the most
likely cause is a **stale dev bundle** (Stage-1 not loaded). A clean rebuild is
the first action; a single fallback hypothesis (runtime-empty `obj.features`) and
its fix are given below.

## Q1 — Console routing (ANSWER: correct, no duplicate builder on this path)

Jodie code mode routes through the edited `buildEvalContext`:
`Jodie.tsx:307` (`evaluateJjelInJodie(input)`) → `jodieJjelContext.ts:64`
`evaluateJjelInJodie` → `:37` `buildJodieJjelVariables` → `:39`
`buildEvalContext(ctx)`, imported at `jodieJjelContext.ts:11` from the barrel
`../../jjscript`, which re-exports it at `jjscript/index.ts:57` from
`./executor/commands/eval` — the exact file modified in Stage 1. Not a duplicate.

The full set of `buildEvalContext` consumers (grep): `eval.ts:29` (JjScript `eval`),
`forall.ts:32`, `let.ts:125`, and `jodieJjelContext.ts:39`. **Decisive**: the handle
key signature `{id, __type, name, instanceOf, instanceof}` is produced **only** by
`shallowObjectToJjelValue` (`eval.ts:386`), which exists only in `eval.ts` and is
called only from `buildEvalContext`. So the probed handle came from
`buildEvalContext` → the probes ran in Jodie (as the prompt states), on the edited
code path.

**Separate finding (not this probe's path, but real):** there is a *second* JjEL
console — `components/editors/Console.tsx:690` `jjelEval(code, jjelContext)` — that
builds its own context from `this._context` (a view/template `evalContext`,
`graphElement.tsx:677`) + `flattenProxyContext(data)` + `extractAttributeValues`
(`Console.tsx:679-688`). It does **not** call `buildEvalContext`, does **not** use
`shallowObjectToJjelValue`, and exposes no `instances`/`<ClassName>` bindings. It
cannot be where these probes ran (it could not produce the observed handle), but it
is a third instance-wrapping surface that Stage 1 does **not** reach — relevant to
the future `wrapSelectedElement` unification, and the cause if a probe is ever run
there by mistake.

## Q2 — Fill invocation (ANSWER: unconditional, on the executed path)

The only early returns in `buildEvalContext` are `if (!project) return` and
`if (!metamodel) return` (`eval.ts:96-99`), **before** the instance pool is built.
The pool (`eval.ts:127`), the id index (`:135-139`) and the slot-fill worklist
(`:147-155`) are straight-line code with no guard between them and the productive
return. Since the probe resolved `State.instances[0]` (a populated handle), the pool
was built → execution necessarily passed the fill loop. There is **no**
`targetMetamodelId`-style condition gating the fill.

## Q3 — Feature reading shape (ANSWER: the hypothesised bug is NOT present)

The Stage-1 code reads `rawObj.features` (`eval.ts` `fillInstanceSlots`), **not**
`rawObj.__raw.features`. `rawObj` is a genuine `LObject` L-proxy — proven two ways:
(1) pass-1 resolved `obj.instanceof?.name` to a real class name (a raw D-object's
`instanceof` is a pointer *string*, so `.name` would be `undefined` and `instanceOf`
would not display — but it does); (2) line `LModelElement.tsx:5097` reads
`o.__raw.instanceof` over the same `get_allSubObjects` result, i.e. those elements
are L-proxies.

On an `LObject`, `obj.features` routes through the proxy get-trap
(`proxy.ts:399-401`: `'features' in this.d` is true, and `'get_features' in lg` is
true) to `LObject.get_features` (`LModelElement.tsx`, "`return this.get_children`")
→ `get_children` (`:5871-5893`) which returns **conformant `LValue` proxies**
(`LValue.fromArr(pointers)` filtered by the class's `allChildren`). Each `LValue`
then yields:
- `feature.name` → the **M2 feature name** via `LValue.get_name` (`:7020`,
  `instanceof ? get_fromlfeature(instanceof,"name") : data.name`) → `"isInitial"`.
- `feature.instanceof.className` → `'DAttribute'` / `'DReference'`.
- `feature.value` / `feature.values` → coerced primitive / enum literal
  (`LValue.get_values` pipeline, `:7073-7315`).
- `feature.__raw.values` → raw primitives / pointer-id strings.

So the code **receives L-proxy `LValue` objects**, not pointer strings; the
"reads `.values`/`.instanceof` on pointer strings → undefined" failure mode does
**not** occur. The same accessors are used — and work — by the JjTL builder
(`ProjectEditor.tsx:1318, 1335-1346, 1385-1388`) over the same object kind.

## Root-cause analysis (by elimination)

1. Probes ran in Jodie → edited `buildEvalContext` (Q1).
2. `buildEvalContext` completed **without throwing**: `evaluateJjelInJodie` wraps it
   in `try/catch` (`jodieJjelContext.ts:64-76`) that converts any throw into an error
   string — but the probe returned a *handle*, not an error. And `instances`
   resolved, so the pool built.
3. The fill loop is straight-line after the pool and before the return (Q2) → it was
   reached.
4. Operating on L-proxies, the fill writes attribute/reference keys (Q3); a throw
   inside it would propagate to the catch in (2) and yield an error, not a handle.
5. Observed: a handle with **only** the 4 pass-1 keys, no error.

The only state consistent with (1)-(5) is that **the executed code did not run the
fill body**. Since the source is verified correct, the running bundle did not
include it → **stale / unloaded dev build** (primary, high confidence).

The single alternative consistent with (1)-(5) is that the new code *did* run but
`obj.features` returned an **empty list** for the pooled objects (then: no throw, no
keys). Static analysis makes this unlikely — `get_children`'s conformance filter
keeps `isInitial` (its `DValue.instanceof` is in `State.allChildren`), and the same
getter works in `ProjectEditor` — but it cannot be excluded without running.

## Fix proposal (NOT implemented)

**Step 1 — rule out staleness (no code change).** Stop `npm start`; remove the Vite
caches (`rm -rf node_modules/.vite frontend/node_modules/.vite`); restart; hard
refresh with DevTools "Disable cache" on (and confirm no service worker is serving a
cached bundle). Re-run the four acceptance probes. Expectation: they pass — the code
is correct. If they pass, root cause was staleness; close.

**Step 2 — only if Step 1 still shows the pre-fix surface.** Then the runtime feeds
the fill an empty `obj.features` for pooled objects. Targeted fix in
`eval.ts → fillInstanceSlots`: change the feature source from the (conformance-
filtered) getter to a **raw-pointer dereference**, matching the prompt's
"dereference before reading" guidance:
- replace `features = rawObj.features` with: read `rawObj.__raw?.features`
  (the `Pointer<DValue>[]` array, `DObject.features`, `LModelElement.tsx:5726`) and
  map each pointer through `LPointerTargetable.from(ptr)` to obtain the `LValue`
  proxy, dropping falsy results.
- everything downstream is unchanged (`feature.name`, `feature.instanceof`,
  `feature.value`/`values`, `feature.__raw.values`), because those operate on the
  dereferenced `LValue` proxies exactly as today.

This is strictly more robust than `rawObj.features`: it bypasses `get_children`'s
conformance filter/sort and any context quirk, while still yielding `LValue` proxies
(so the hybrid attribute-coercion + by-pointer reference resolution are preserved).
If the real cause was staleness, the change is a behaviour-preserving no-op; if it
was empty-features, it is the fix. It is **not** applied here — go-ahead first.

## Test note

No unit test was added. `buildEvalContext` requires the live Redux store + L-layer,
which fail to load under the vitest node env (`window is not defined` — the 9
env-blocked suites), and `fillInstanceSlots` is not exported (testing it would need a
`src/` change, disallowed by this prompt). Disambiguation is cheaper via Step 1
(clean restart) or a temporary `console.log` at the fill site, which Alfonso can run.

## Hard stop honored (debug)

Read-only on `src/`. No `src/` modifications, no commit, no push. Only this discovery
doc and the log were written.
