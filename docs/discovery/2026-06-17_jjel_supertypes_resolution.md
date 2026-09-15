# Discovery — JjEL supertype resolution, `allSuperclasses`, and Ecore supertype import

**Date**: 2026-06-17 18:45
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery (read-only) — zero code changes
**Trigger**: On a UML2 metamodel loaded as M2, class supertypes are present in the D-layer but do not resolve through JjEL: `Class.superTypes` shows 2 unresolved entries, `Class.superTypes.first.name → null`, and `Class.allSuperclasses → []`.

---

## TL;DR / Verdict

**This is a JjEL evaluator/adapter bug, not an importer bug.** The Ecore importer resolves the two UML2 supertypes correctly — that is *proven at runtime* by the fact that `Class.superTypes` survives with **2** entries (see §3/§4). The breakage lives entirely on the JjEL side:

1. The JjEL class adapter `shallowClassToJjelValue` (`eval.ts:339`) flattens supertype linkage into a single field **`superTypes: string[]`** — an array of supertype **names** — and carries **no** `extends` / `father` / `extendedBy` / class-reference field.
2. The evaluator's `allSuperclasses` / `allSubclasses` handlers traverse exactly those absent fields (`obj.extends ?? obj.father ?? obj.extendedBy`, `evaluator.ts:548` / `:576`). They find nothing → return `[]`.
3. `Class.superTypes.first.name → null` is a **category error in the probe**, not evidence of dangling data: `superTypes` is `string[]`, so `.first` is a string and a string has no `.name`.

Single highest-confidence root cause: **the adapter and the closure disagree on the field that carries supertype linkage** (`superTypes` names vs `extends` objects). Minimal fix surface is two files: `jjscript/executor/commands/eval.ts` (the adapter) and `jjel/evaluator/evaluator.ts` (the closure). The importer (`api/data.ts`) is healthy for this case.

---

## 1. Accessor wiring table

The object the evaluator sees for a class is **not** an L-proxy. It is a plain shell built by `shallowClassToJjelValue` (`frontend/src/jjscript/executor/commands/eval.ts:339-392`), from `metamodel.classes` L-proxies (`eval.ts:118-119`). The evaluator's class-object branch fires because the shell sets `className: 'DClass'` (`eval.ts:368`; gate at `evaluator.ts:470`).

| Property | Handled? | Returns | Resolving file:line |
|----------|----------|---------|---------------------|
| `superTypes` | yes (plain field on the shell) | **resolved-then-downgraded to `string[]` of supertype names** — *not* raw `Pointer<DClass>`, *not* L-proxies | built `eval.ts:354-362`, `:381`; read via fall-through `evaluator.ts:508-509` |
| `extends` | **no — not wired** | `null` + "Property `extends` not found on object" diagnostic | not in class switch (`evaluator.ts:471-504`); not a shell field (`eval.ts:364-392`); diagnostic at `evaluator.ts:519-535` |
| `isAbstract` | yes | boolean | shell `eval.ts:369`; read `evaluator.ts:508-509` |
| `isInterface` | yes | boolean | shell `eval.ts:370` |
| `isFinal` | yes | boolean | shell `eval.ts:374` |
| `isSingleton` | yes | boolean | shell `eval.ts:375` |
| `isRootable` | yes | boolean | shell `eval.ts:376` |
| `isPartial` | yes | boolean | shell `eval.ts:377` |
| `allowCrossExtend` | yes | boolean | shell `eval.ts:373` (mapped from L-layer `allowCrossReference`) |

How `superTypes` is built (`eval.ts:354-362`):

```js
const superTypes: string[] = [];
try {
    const supers = cls.extends || cls.extend || cls.superClasses || [];   // cls is an LClass proxy
    for (const s of supers) {
        if (typeof s === 'string') superTypes.push(s);   // s is a proxy object, not a string
        else if (s?.name) superTypes.push(s.name);       // pushes the NAME, only if truthy
    }
} catch { /* proxy access can fail */ }
```

`cls.extends` invokes the L-layer getter `get_extends` (`LModelElement.tsx:3337-3341`), which maps each D-layer pointer through `LPointerTargetable.from(pointer)` → an `LClass` proxy. The adapter then takes `s.name`, so `superTypes` ends up as an array of **name strings**. The 7 flags are stored as plain booleans, which is why the console returns booleans for them.

**Why `Class.extends` errors but `Class.superTypes` does not**: the shell has a `superTypes` field but no `extends` field, and the evaluator's class switch has no `extends` case. So `extends` misses `property in obj` (`evaluator.ts:508`) and emits the property-not-found diagnostic. This is also the doc/impl drift flagged in RIFERIMENTI: the paper's `State.extends` accessor is unimplemented; the implementation exposes `superTypes` instead.

---

## 2. `allSuperclasses` / `allSubclasses` — why the closure is empty

There are **two** implementations; the working one is bypassed.

**(A) L-layer (correct, but never reached on the JjEL path)** — `LClass.allSuperclasses` / `allSubclasses` are aliases that delegate to `get_superclasses` / `get_subclasses`:

- `LModelElement.tsx:3611-3612` — `get_allSubclasses → get_subclasses(c, true)`, `get_allSuperclasses → get_superclasses(c, true, …)`.
- `get_superclasses` (`LModelElement.tsx:3630-3648`) seeds its queue from `get_extends(c)` (resolved `LClass[]`), filters falsy entries, and walks `elem.extends` transitively. This **works** on the D-layer `extends` ids.

This path is dead on the JjEL path because `buildEvalContext` converts every L-proxy class into a plain shell *before* evaluation (`eval.ts:119`), so the evaluator never holds the L-proxy.

**(B) JjEL evaluator (the one that actually runs, and is broken)** — `evaluator.ts:484-503`:

```js
case 'allSuperclasses': { return this.getAllSuperclasses(obj); }   // :484-486
case 'allSubclasses':   { return this.getAllSubclasses(obj);   }   // :500-502
```

`getAllSuperclasses` (`evaluator.ts:544-567`):

```js
const directParents = cls.extends ?? cls.father ?? cls.extendedBy;   // :548
if (!directParents) return result;                                   // → [] : none exist on the shell
```

`getAllSubclasses` (`evaluator.ts:572-590`) is symmetric: `cls.subclasses ?? cls.children ?? cls.extendedBy` (`:576`).

**Source slot vs `superTypes` (the discrepancy)**: the closure reads `extends` / `father` / `extendedBy` / `subclasses` / `children`. The shell exposes **none** of these — its only supertype field is `superTypes` (`eval.ts:381`), and it has no inverse (subclass) field at all. So:

- `directParents` is `undefined` → `getAllSuperclasses` returns `[]`. That is exactly the observed `Class.allSuperclasses → []`, even though `Class.superTypes` is populated.
- `allSubclasses → []` for the same reason, *plus* the shell never carries any subclass linkage, so it could not work even if the field names were aligned.

They read a **different field** than `superTypes`. And even if the closure read `superTypes`, the entries are **name strings**, so the recursion's `isJjelObject(parent)` guard (`evaluator.ts:554`) would reject them — a second, independent reason the closure cannot traverse.

---

## 3. Pointer resolution path — (a) vs (b)

How a `Pointer<DClass>` is meant to resolve to an `LClass`: the L-layer getter `get_extends` (`LModelElement.tsx:3337-3341`) maps each `context.data.extends` pointer through `LPointerTargetable.from`. A valid pointer yields a named `LClass`; a dangling pointer yields an empty proxy whose `name` is falsy. `DClass.extends: Pointer<DClass,0,'N',LClass>[]` is the D field (`LModelElement.tsx:2647`); `LClass.extends!: LClass[]` is the resolved view (`:2726`).

Neither offered option is exactly right:

- **(a) "evaluator returns raw `Pointer<DClass>` without resolving"** — **No.** `cls` in the adapter is an `LClass` proxy, so `cls.extends` already runs `get_extends` and returns resolved proxies; the adapter then maps to `s.name`. The evaluator never sees raw pointers for this field.
- **(b) "data: pointers are dangling"** — **No.** The adapter only pushes a supertype when `s?.name` is truthy (`eval.ts:360`). The console shows **2** surviving entries in `superTypes`, which is only possible if both proxies resolved to named classes. Dangling proxies (null name) would be filtered out, leaving `superTypes` empty.

**Actual mechanism (call it (a′))**: the adapter **resolves the pointers and then downgrades them to name strings**. `superTypes` is therefore `string[]`. The probe `Class.superTypes.first.name` returns `null` because `.first` is the string `"EncapsulatedClassifier"`, and a string has no `.name`. The inspector's `[?, ? (2)]` is the JjEL value-inspector's placeholder for primitive (string) array elements, not a sign of dangling references.

(Corollary: the console note "Class is not shadowed, so feature inheritance across supertypes is not effective — consistent with unresolved pointers" is a red herring. The pointers are resolved; the JjEL closure simply cannot see them because the linkage field it needs is absent.)

---

## 4. Import space-split output (Q4) — importer is healthy here

Trace for UML2 `Class`, whose `eSuperTypes` is `"#//EncapsulatedClassifier #//BehavioredClassifier"`:

1. **Parse** (`api/data.ts:774,780`):
   ```js
   let tmps = this.read(json, ECoreClass.eSuperTypes, '');   // "#//EncapsulatedClassifier #//BehavioredClassifier"
   dObject.extends = tmps ? tmps.split(' ') : [];            // ["#//EncapsulatedClassifier", "#//BehavioredClassifier"]
   ```
   The leading `#//` is **not stripped** — the `prereplace = name.replaceAll("#//","")` helper is commented out (`data.ts:282`).

2. **Name→id resolution** (`LinkAllNamesToIDs`, `data.ts:231-347`), with `typeprefix = "#//"` (`:247`) and `replaceRules` including `"extends"` (`:283`):
   - `nameMap` is keyed **with** the prefix: `nameMap["#//" + __fullname] = dobj` (`:298`).
   - Root package is transparent: `parsePackageBody` sets the package `__fullname = ''` (`:694`) and calls `parseDClass(dObject, child, generated, '')` (`:707`), so a root-level class's `__fullname` is its **bare name** (`parseDClass:755`, prefix `''`). Thus `EncapsulatedClassifier` is keyed `nameMap["#//EncapsulatedClassifier"]`.
   - Lookup: `target = replacePrimitiveMap[value] || nameMap[value]` (`:318-319`) with `value = "#//EncapsulatedClassifier"` → **matches** the nameMap key → `dobj.extends.push(target.id)` (`:343`).

   So the space-split token `#//EncapsulatedClassifier` matches the pool key directly **because the pool is also keyed with the `#//` prefix**. The prompt's hypothesis — that the pool indexes by bare name while the value keeps `#//` — is **false**; both sides carry `#//`.

3. Both root-level supertypes of `Class` (`EncapsulatedClassifier`, `BehavioredClassifier`) resolve, so `DClass.extends` ends up with 2 valid ids — matching the 2 entries seen at runtime.

**Latent (not the cause here)**: the `extends` branch silently drops any unmatched supertype — `if (replacekey === "extends") { if (!target) continue; }` (`data.ts:337-338`) — *before* the generic `Log.ex(!target, …)` guard at `:342`. So a supertype that is cross-document (`href`, e.g. `Ecore.ecore#//EObject`) or in a subpackage whose `#//Pkg/Class` fullname does not reconstruct identically would be dropped with no error. That can starve `superTypes` in other models, but it is not what breaks `Class` in this UML2 case (its 2 supers resolve, as the runtime confirms).

**Cross-reference corroboration**: `useJjomSync.ts` builds inheritance edges from `entry.raw.extends` (`:539`, `:717`). Because those ids are valid, the canvas inheritance edges for UML2 `Class` would render — corroborating that the data side is healthy and pointing the failure at the evaluator, exactly as predicted in the prompt's DOVE note ("present edges would point at the evaluator side"). (Not re-verified at runtime; read-only session.)

---

## 5. Verdict

**Evaluator/adapter bug. The single highest-confidence root cause** is the representation mismatch between the JjEL class adapter and the evaluator's inheritance closure:

- `shallowClassToJjelValue` (`eval.ts:339-392`) exposes supertype linkage **only** as `superTypes: string[]` (names) and provides no `extends` / `father` / `extendedBy` field and no inverse subclass field.
- `getAllSuperclasses` / `getAllSubclasses` (`evaluator.ts:544-590`, dispatched at `:484` / `:500`) traverse `obj.extends` / `obj.father` / `obj.extendedBy` / `obj.subclasses` / `obj.children`, none of which the shell carries → the transitive closure is always `[]`.
- `Class.superTypes.first.name → null` is an artifact of `superTypes` being `string[]`, not evidence of dangling data.

The Ecore importer (`api/data.ts`) correctly resolves the two UML2 supertypes; the `#//` form matches because `nameMap` is keyed with the `#//` prefix and the root package is transparent.

**Minimal fix surface (2 files):**
1. `frontend/src/jjscript/executor/commands/eval.ts` — in `shallowClassToJjelValue`, in addition to (or instead of) the `superTypes` name list, populate a linkage field with references to the **shared** class shells (resolve `cls.extends` ids against the `classByName` map already built at `eval.ts:122-126`) so the closure can recurse over JjEL objects; populate the inverse (subclass) linkage symmetrically for `allSubclasses`.
2. `frontend/src/jjel/evaluator/evaluator.ts` — align `getAllSuperclasses` / `getAllSubclasses` (and the class switch) to read whatever field the adapter populates (the new linkage field, or `superTypes` resolved via the class map). Both ends must agree on one representation.

Secondary (separate, lower priority): the doc/impl drift — paper's `extends` accessor vs implemented `superTypes` (decide alias vs paper correction); and the importer's silent `extends` drop at `data.ts:337-338` (harmless here, but should log to avoid masking subpackage/href supertype losses in other metamodels).

---

## Evidence index (file:line)

- Adapter / shell: `frontend/src/jjscript/executor/commands/eval.ts:339-392` (build), `:354-362` (superTypes from `cls.extends` → name), `:369-377` (7 flags), `:368` (`className:'DClass'`), `:118-119` (`classes = metamodel.classes`, mapped to shells), `:122-126` (`classByName`).
- Evaluator: `evaluator.ts:468-505` (class-object switch), `:484-486`/`:500-502` (allSuperclasses/allSubclasses dispatch), `:508-509` (fall-through `property in obj`), `:519-535` (property-not-found diagnostic), `:544-567` (getAllSuperclasses reads `extends/father/extendedBy`), `:572-590` (getAllSubclasses reads `subclasses/children/extendedBy`).
- L-layer: `LModelElement.tsx:3337-3341` (`get_extends` → `LPointerTargetable.from`), `:3630-3648` (`get_superclasses`, the working closure that is bypassed), `:3611-3612` (allSubclasses/allSuperclasses aliases), `:2647` (`DClass.extends`), `:2726` (`LClass.extends!: LClass[]`).
- Importer: `api/data.ts:774,780` (eSuperTypes split, no `#//` strip), `:282` (commented `prereplace`), `:283` (`replaceRules` incl. `extends`), `:247` (`typeprefix="#//"`), `:298` (`nameMap["#//"+__fullname]`), `:318-319` (target lookup), `:337-344` (extends branch: silent drop on miss, else push id), `:694` (root `__fullname=''`), `:707` (`parseDClass(...,'')`), `:755` (class `__fullname = prefix + name`).
- Cross-ref: `useJjomSync.ts:539`, `:717` (inheritance edges from `entry.raw.extends`).
</content>
</invoke>
