# Layer Impact Report 2026-10-21: `LModel.get_name` without the `$name` scan, `detectDuplicateNames` in O(n)

- Prompt-ID: P-2026-10-21-0030. Chat: C-2026-10-20-0839.
- Tree: `~/jjodel-w-corenames`, branch `core-name-scans`, HEAD `6a4cc3116`.
- Core go-ahead: Alfonso, 2026-10-21 00:13 («Ok»), fixes 4 and 2 of
  `docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md` §5, Phase 1 waived.
- Written before any code diff (CLAUDE.md §3.2). Every claim is read in code at that HEAD unless marked measured.

## 0. Verdict

**Two L-layer reads get cheaper and return what they return today.** `LModel` gains one getter, `get_name`;
`detectDuplicateNames` resolves each sibling set once and groups it by name. No D-layer write, no JjOM, sync, canvas or
persistence file is edited. `proxy.ts`, `classes.ts`, `_defaultGetterM1`, `_defaultGetterM2`, `set_name`, every
interface and every caller are untouched.

## 1. Facts the design rests on

1. **The proxy picks a getter by name.** `proxy.ts:399-401`: a key `k` is served by `lg['get_' + k]` when that member
   exists on the L singleton; otherwise it falls to `_defaultGetter`. A `get_name` on `LModel` therefore serves the
   key `name` only. A `$`-key (`model.$foo`) has no `get_$foo` and still reaches `LModel._defaultGetter`
   (`LModelElement.tsx:5290`), then `_defaultGetterM1` or `_defaultGetterM2`, unchanged. Checked by reading that
   dispatch, and by grep: no class extends `LModel` (`extends LModel\b` matches only the `LtoD`/`LtoW` type aliases in
   `classes.ts`), so the override reaches no other class.
2. **Today's getter always ends at `c.data.name || c.data.className`.** `LModel` has no `get_name` and inherits
   `LPointerTargetable.get_name` (`classes.ts:2220-2227`). It reads `proxyObject.$name` and keeps it only if its
   `className === 'LValue'`. What `$name` can return on a model:
   - M1 (`_defaultGetterM1`, :5313-5363): an `LObject` named «name» (className `DObject`), an M2 item through
     `m2[key]` (`DClass` / `DPackage`), a `Log.ee` string (no metamodel: `.className` undefined), or
     `__defaultGetter(c, '$name')` = `data['$name']`, absent on a `DModel`.
   - M2 (`_defaultGetterM2`, :5295-5312): a package or class whose name is «name» case-insensitively (`DPackage` /
     `DClass`), else the same `__defaultGetter`.
   An L proxy reports the D className (`src/model/CLAUDE.md` §3.13), so none of them is `'LValue'`: the branch is
   dead on both levels and the result is `c.data.name || c.data.className`.
3. **M1 and M2 alike.** `LModel._defaultGetter` dispatches on `isMetamodel`; both branches feed the same dead
   check. The choice is **one override on `LModel`, for both levels**: `get_name(c) { return c.data.name ||
   c.data.className; }`. It also drops the smaller M2 scan (`get_allSubPackages` + `get_classes`).
4. **The one observable difference is an error log.** An M1 model with no metamodel reaches `Log.ee("Could not find
   m1 match for data.$name …")` (:5344) on every `name` read today; `Log.e` does not throw (`Log.ts:123-128`), it logs
   and updates the logger component. With the override that log is no longer emitted. Declared, not preserved: it
   is a side effect of a discarded read.
5. **`set_name` and the identity slot do not use this getter.** `LPointerTargetable.set_name` writes `data.name`
   through `SetFieldAction`; the slot→name path (`src/model/CLAUDE.md` §3.12) is a direct `SetFieldAction` on
   `LValue`. The `TRANSACTION(this.get_name(c) + …)` labels inside `LModel` methods now call the override and get the
   same string.
6. **`detectDuplicateNames` (`nameUniqueness.ts:300-314`).** For each object of `model.allSubObjects` it calls
   `getSiblingNamespace(obj)` = `getNamespaceOf(obj.father, obj.id, {includePending})` and keeps
   `siblings.filter(s => s.name === obj.name)`. The namespace depends on the father only (and on `includePending`,
   fixed per call): the model father gives `allSubObjects` (recursive, so a root object collides with a nested
   homonym, not vice versa), an `LValue` father gives its `DObject` values, a bare `LObject` father its `subObjects`,
   plus the pending children of that father when asked. The comparison is `===`: case-sensitive, and the empty
   string and `undefined` compare like any value.
7. **The new shape, same result.** Per father id, resolve `getNamespaceOf(father, undefined, …)` once and group it
   by name in a `Map` (keeping order and multiplicity); per object, `colliding = group(obj.name)` without the
   entries whose `id === obj.id`. `Map` keys are SameValueZero, `===` on every string and on `undefined`/`null`.
   Two edges, both unreachable today and stated: (a) `getNamespaceOf(…, undefined)` drops a sibling whose `id` is
   `undefined`, which the per-object call kept; every LObject proxy and every pending `DObject` carries an id. (b) A
   father without an id falls back to the per-object call, so it is not cached under a shared key.
8. **The badge consumer is untouched.** `UniquenessProblemSync.tsx:142` calls `detectDuplicateNames(model)` and reads
   the returned `Map<id, LObject[]>`; signature, key set and value lists stay the same, so the 2026-08-31
   missed-notification fix (`UniquenessProblemSync.tsx:24-47`) is not involved.

## 2. Layer Impact Report

```
LAYER IMPACT REPORT — P-2026-10-21-0030

Layers touched:
  [ ] D-layer (Redux raw data)
  [x] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

L-layer
  - What changes: `LModel.name` is served by an own getter returning `data.name || data.className`, M1 and M2;
    `detectDuplicateNames` resolves each sibling namespace once per father and groups it by name.
  - What does NOT change: the value of `model.name` (§1.2); `model.$foo` lookups (§1.1); `set_name`, the identity
    slot binding, `fullname`'s container walk; the returned duplicate map (keys, colliding lists, order).
  - Cross-layer interaction: none written. Readers of `model.name` (Navbar, TreeViewContent, StatusBar, Info,
    ProjectEditor, `fullname`) and of the duplicate map (UniquenessProblemSync → problems registry) receive the
    same values, sooner.
  - Side-effect safety: the only removed side effect is the `Log.ee` of an M1 model without a metamodel (§1.4).
    No dispatch is added or removed.

Smoke-test scenarios potentially affected:
  - Tab titles, tree root and status bar show the model name (named and unnamed model).
  - Rename an object to a sibling's name → duplicate badge on both; rename back → badges gone.
  - Two same-named objects under different containment slots → no badge; root vs nested homonym → badge on the root.
  - Properties → References on the Activity opens without a long task (probe).
```

## 3. Acceptance (from the prompt)

Tests executing the code where vitest can load it (`nameUniqueness.ts` with the `joiner` mock of
`m2NameUniqueness.test.ts`); `LModelElement.tsx` does not load under vitest (`window is not defined`, through the
barrel), so the getter is measured in page by the probe and the gap is recorded (CLAUDE.md §5). Mutation bench m1-m3.
Probe, dev, three runs before and after: `commit` ≤ 0.9 s, References opening without a long task above 200 ms,
`fullname` ≤ 4 name reads, clicks not worse.
