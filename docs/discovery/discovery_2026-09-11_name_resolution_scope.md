# Discovery — name-based element resolution and its scope across the codebase

**Date**: 2026-09-11 (session ran past midnight into 2026-09-12; every measurement below
is from the same run, on `validation-skeleton` at `98f8aa4da`)
**Phase**: READ-ONLY. No source file touched. **HARD STOP** honoured: no implementation,
no refactoring plan beyond the per-site *change needed* column.
**Prompt**: `2026-09-11 11:30`
**Depends on**: `docs/discovery/discovery_2026-09-11_jjscript_target_resolution.md` — read in
full; its §4 (command→kind table) and §5 (consumers of the JjScript resolver) are **not**
redone here, only cross-referenced.

---

## 0. Two things about the prompt itself, before the findings

**`src/ai/` does not exist.** `ls frontend/src/ai` → `No such file or directory`. Positive
control on the same command: `ls frontend/src/jjodie` lists a real directory. The AI surfaces
live in `frontend/src/jjodie/`, `frontend/src/jjodie-integration/`, `frontend/src/components/Jodie/`
and `frontend/src/services/Jjodie*.ts`; those are what §7 below inventories. Declared and
proceeded (RC-10).

**The interactive `grep` was not used for any count in this report.** `type grep` confirms the
wrapper around `ugrep --ignore-files` described in CLAUDE.md §5. Every number below comes from
`command grep` (BSD grep 2.6.0-FreeBSD, verified with `--version`), which honours `--include`.
Positive control run first: `command grep -rn "getByName" frontend/src --include="*.ts" --include="*.tsx" | wc -l`
→ **34**, non-empty, so the searches that came back with small numbers are measurements and not
broken commands.

---

## 1. Objective

Can a project hold two metamodels that each declare a class (or enum, or package) of the same
name, with every tool in the platform behaving correctly?

This report answers the four questions the prompt asks, in this order: where the codebase
resolves an element **by name** rather than by pointer (§3–§8), what **scope** each of those
lookups uses (same), what the **uniqueness rule** is today (§2), and what it would cost to move
to the intended design (§11).

**The one-line answer.** The *uniqueness* half of the intended design is already implemented and
ratified — `checkM2NameUniqueness` makes classifier names unique per **metamodel** and explicitly
legal across metamodels. The *lookup* half is not: **17 of the 56 retained sites resolve a name
over the whole project or the whole Redux store and take the first match**, and only one accessor
in the entire codebase (`resolveMetaclassId`, the IR metaclass pin) disambiguates homonyms at all.

---

## 2. Question 4 first — the uniqueness rule, with the excerpt

`frontend/src/model/logicWrapper/nameUniqueness.ts` holds **both** rules, M1 and M2, and the M2
half is already scoped exactly as the intended design wants. Its own header says so
(`nameUniqueness.ts:326-333`):

```
//   classifier  R-M2U-2  the WHOLE metamodel — two `DupProbe` in two packages of one
//                        metamodel collide; the same name in another metamodel does not.
//   datatype    R-M2U-3  a namespace of its own — a class and a datatype may share a
//                        name. This is intended behaviour, not a hole: see the referto.
//   feature     R-M2U-4  the class's own AND inherited features — no shadowing.
//   package     ─        `father.children`, exactly as today.
//   literal     ─        `father.children`, exactly as today.
//   parameter   ─        `father.children`, exactly as today.
```

The scope is decided in one place, `getM2NamespaceOf` (`nameUniqueness.ts:404-423`):

```typescript
case 'classifier': {
    // The whole metamodel, classes and enumerators together: they already
    // shared `pkg.children`, so keeping them in one namespace preserves the
    // committed class-agnostic behaviour while widening the pool.
    for (const pkg of packagesOfMetamodel(father)) {
        pool = pool.concat(collectionOf(pkg, 'classes'), collectionOf(pkg, 'enumerators'));
        ...
```

and `packagesOfMetamodel` (`:389-394`) walks up to the owning `DModel` and reads its
`allSubPackages`. **The metamodel is the boundary, by construction.**

The verdict itself is **case-sensitive**, and a case-only near-homonym is **accepted with a
warning**, not refused (`nameUniqueness.ts:511-540`):

```typescript
const collidingWith = namespace.filter(e => (e as { name?: string }).name === name);
if (collidingWith.length > 0) { ... return { ok: false, reason: refusalReason(...) }; }

const lowered = typeof name === 'string' ? name.toLowerCase() : '';
const nearby = namespace.find(e => {
    const n = (e as { name?: string }).name;
    return typeof n === 'string' && n !== name && n.toLowerCase() === lowered;
});
if (!nearby) return { ok: true };
return { ok: true, warning: `Name "${name}" differs only by case from "${...}" in the same scope` };
```

**Element kinds covered**: the six namespaces above, mapped from the D-layer className by
`m2KindOf` (`nameUniqueness.ts:349-360`): `DClass`/`DEnumerator` → `classifier`, `DDataType` →
`datatype`, `DAttribute`/`DReference`/`DOperation` → `feature`, `DPackage` → `package`,
`DEnumLiteral` → `literal`, `DParameter` → `parameter`. Anything else (`DModel`, `DObject`,
`DValue`, `DVertex`, …) returns `null`, which every consumer reads as "fall back to the
pre-S1-M2 behaviour".

**Error or warning**: a refusal (`ok: false`) is an **error** — the write does not happen. Four
consumers enforce it: `joiner/classes.ts:2196-2218` (create, with the toast
`Element name "…" is already taken in this scope`), `LModelElement.tsx:139` (`m2CreateRefused`),
`jjscript/executor/commands/rename.ts:126`, and the badge producer
`components/editor-v2/problems/UniquenessProblemSync.tsx:136`. The case-only near-homonym is a
**warning** on an accepted write.

### 2.1 M1, and the one namespace that IS project-wide

The M1 half of the same file scopes to the **siblings under the same father**
(`nameUniqueness.ts:17-21`): whole-model for a rootable `LObject`, the containment for a nested one.

There is exactly one namespace in the codebase that is project-wide by design, and it is not an
element name — it is the **model name**. `LModel.set_name` (`LModelElement.tsx:5623-5631`):

```typescript
protected set_name(val: this['name'], c: Context): boolean {
    if (c.data.name === val) return true;
    const models: LModel[] = LModel.fromPointer(store.getState()['models']);
    if (models.filter((model) => { return model.name === val }).length > 0) {
        toast.error(`Model name "${val}" is already taken`, { ... });
    } else { TRANSACTION(... SetFieldAction.new(c.data, 'name', val, '', false) ...) }
```

Two consequences, both load-bearing for the intended design:

- **Metamodel names are unique across the project**, so a qualified `Metamodel.Element` is a
  well-formed unique key. Metamodels and M1 models share that one namespace (`state.models` holds
  both).
- **The rule is enforced only on rename through the L-proxy.** There are **12** `DModel.new(`
  call sites outside tests, and none consults it — importing the same `.ecore` twice produces two
  metamodels with the same name, and nothing says so. §10 risk R4.

---

## 3. Grep counts — raw, then retained

Every count via `command grep -rn <pattern> frontend/src --include="*.ts" --include="*.tsx"`.

| pattern | raw | retained | what was discarded, and why |
|---|---:|---:|---|
| `getByName` | 34 | 14 | 20 are test files asserting on the source text of `_impl_getByName`/`getByName2` (`model/__tests__/getByNameKey.test.ts`, `joiner/__tests__/dTypedElement.test.ts`) and comment prose |
| `byName` | 45 | 6 | 39 are local variable names for sort comparators and `Map`s keyed by name inside one collection (`SimulationPanel.tsx:139`, `formHosts.ts:68`, `viewParentingOptions.ts:105`, `RowViewSmoke`, test fixtures) — not element resolution |
| `findByName` | 0 | 0 | the identifier does not exist in the tree |
| `.name ===` | 149 | 38 | 9 in `__tests__`; 22 are `typeof x.name === 'string'` type guards; 11 in `examples/`; 3 are `error.name === 'AbortError'`; 1 is an AST node name (`executor.ts:2751`); the rest are UI labels, viewpoint titles and literal comparisons against a constant (`'Default'`, `'__class'`, `'EString'`) |
| `.name.toLowerCase()` | 27 | 11 | 7 are autocomplete ranking (`jjel/autocomplete/providers/*`, `jjscript/autocomplete/providers/keyword.ts`), 5 are free-text search filters (`GrammarTab`, `MetamodelTreeView`, `Catalog`, `ColorSchemeSelector`, `instanceTable`), 4 are tag/id derivation (`indexer.ts:185`, `LModelElement.tsx:3823`) |
| `name.toLowerCase() ===` | 15 | 11 | 4 overlap with the row above |
| `.find(` on a line containing `name` | 48 | 12 | the rest resolve **by id** (`c => c.id === …`), or find inside a list the caller just built |
| `.filter(` on a line containing `name` | 99 | 6 | mostly UI filtering and `filter(Boolean)` on name arrays |
| `nameUniqueness` | 21 | 21 | all retained — §2 |
| `nsURI` | 59 | 5 | 54 are Ecore/XMI serialisation string building; 5 are lookups (§8) |
| `qualifiedName` / `QualifiedName` | 95 / 130 | 4 | 73 of 95 are the JjScript `QualifiedName` **type** threaded through `executor/`; the 4 retained are the producer and the three resolver entry points |
| `fullName` / `fullname` | 9 / ~30 | 1 | `LModelElement.tsx:455` is the only producer; every reader is a tooltip or a `TRANSACTION` label (§9) |

**Total retained, de-duplicated across patterns: 56 sites.** They are the table in §4.

---

## 4. Inventory

Legend for **scope today**: `store` = the whole Redux state (every project artefact in memory),
`project` = the `LProject` flat pools, `metamodel` = one `LModel`, `package`/`class`/`element` =
the container handed in, `import` = the set of elements parsed from one file, `none` = no scope
concept at all. **Match**: `exact`, `ci` (case-insensitive), `exact→ci` (exact first, CI as
fallback). **Change needed** under the intended design: `none`, `scope` (accept and use a scope
argument), `qualify` (accept/produce a qualified name), `ambig` (report ambiguity instead of
taking the first).

### 4.1 Core — Selectors and the L-layer (18 sites)

| file:line | consumer | kinds | scope today | match | on homonyms today | change | risk |
|---|---|---|---|---|---|---|---|
| `redux/selectors/selectors.ts:311` `getByName2` | core, `Constructors.DTypedElement` | any D class | **store** (`idlookup` scan) | ci | first in `idlookup` insertion order, silently | scope + ambig | **high** — the lowest-level name lookup; §5 P1 |
| `redux/selectors/selectors.ts:331` `getByName` | core, `getType`/`set_type`, 3 `getByFullPath` | any D class | **store** (`state.classs`, `state.enumerators`, …) | ci | first in the per-class index | scope + ambig | **high** — §5 P2 |
| `redux/selectors/selectors.ts:336` `getByField` | `getByName` only | any | **store** | ci | `getAll(...)[0]` | scope | high (same defect, one level down) |
| `redux/selectors/selectors.ts:264` `getAll` | 40+ callers | any | **store** | n/a | returns all; the `[0]` is the caller's | none (the pool is correct; the `[0]` is not) | medium |
| `redux/selectors/selectors.ts:293` `getModel` | topbar, import | `DModel` | **store** | ci | first | ambig | medium |
| `redux/selectors/selectors.ts:400` `getViewIdFromName` | views | `DViewElement` | **store** + subView walk | exact | "the oldest matching view is returned" (own comment) | ambig | low |
| `model/logicWrapper/LModelElement.tsx:5869` `_impl_getByName` | `getClassByName`, `getEnumByName` | classifier | **the collection passed in** (metamodel) | exact→ci | `$name` key: last writer wins; and the CI pass **mutates the collection** | none for scope; see R2 | **high** — §5 P3-d |
| `LModelElement.tsx:5863/5866` `getEnumByName` / `getClassByName` | `edgeCandidate.ts:59` (only live caller) | enum / class | **metamodel** | exact→ci | correct by construction | none | low |
| `LModelElement.tsx:5848` `getClassByNameSpace` | `api/data.ts:553` (Ecore M1 parse) | class | **package**, found by `uri` | exact | uri is the key, not the name | none | low |
| `LModelElement.tsx:5827` `getPackageByUri` | the above | package | **metamodel** | exact on uri | first of `filter(...)[0]` | ambig (low) | low |
| `LModelElement.tsx:1441,1448` `get_type` | D→L type resolution | enum, class | **store** | ci | first | scope | **high** — but see R1: the per-model branch is dead **by decision** (R-M2U-5) |
| `LModelElement.tsx:1508,1518` `set_type` | writing a type by name | enum, class | **store** | ci | first | scope | **high**, same |
| `LModelElement.tsx:6629,6631` `LObject.set_instanceof` | M1 instantiation by class name | class | **model**, then `crossClasses` | exact | first | ambig | medium |
| `LModelElement.tsx:5626` `LModel.set_name` | model rename | `DModel` | **project** (all models) | exact | refuses | none — this is the rule (§2.1) | low |
| `LModelElement.tsx:344` `LModelElement.getByFullPath` | public API / console | root `DModel` then path | **store** for the root | exact (`caseSensitive: true`) | first | qualify | medium |
| `view/viewElement/view.tsx:689` `LViewElement.getByFullPath` | views | root `DViewPoint` | **store** | exact | first | qualify | low |
| `model/dataStructure/GraphDataElements.tsx:249` `getByFullPath` | graph | root `DGraph` | **store** | exact | first | qualify | low |
| `joiner/classes.ts:878-884` `Constructors.resolveClassifier` | `DTypedElement` | class, enum, datatype | **store** (via `getByName2`) | ci | first, per kind in order `DClass, DEnumerator, DDataType` | scope | **high** |

Producers, not lookups, but they are what makes the lookups project-wide:

| file:line | what it builds |
|---|---|
| `joiner/classes.ts:3484-3506` | `LProject.classes/attributes/references/operations/parameters/enumerators/literals` — **flat over every metamodel** |
| `model/logicWrapper/LModelElement.tsx:5833` | `LModel.attributes` — flat over every class of one metamodel |
| `common/U.tsx:2081` `toNamedArray` + `LPackage.get_classes:1972` | the `$name` keys; **a plain object property, so two homonyms in one array leave only one reachable** (§5 P3-b) |

### 4.2 Uniqueness (2 sites) — §2

| file:line | scope | change |
|---|---|---|
| `nameUniqueness.ts:501-540` `checkM2NameUniqueness` | per kind; classifier = **metamodel** | **none — already the intended design** |
| `nameUniqueness.ts:~250-310` M1 half | siblings under one father | none |

### 4.3 JjScript (9 sites) — see the previous report for the command→kind detail

| file:line | scope today | match | on homonyms | change | risk |
|---|---|---|---|---|---|
| `jjscript/executor/resolvers.ts:311` `resolveTargetInMetamodel` | **metamodel** | exact→ci, kind-filtered | correct by construction | none | low |
| `resolvers.ts:496` `resolveTargetInProject` | **project** (`PROJECT_COLLECTIONS` starts at `'metamodels'`) | exact→ci, kind-filtered | **first metamodel wins, silently** | ambig | **high** |
| `resolvers.ts:192` `selectTarget` | the pick rule for both | — | `if (exact.length > 0) return { element: exact[0] }` — **an exact-case plurality is never an ambiguity** | ambig (one branch) | **high** — §5 P7 |
| `resolvers.ts:543` `resolveByPath` | project, walks `PROJECT_COLLECTIONS` | ci on intermediates | **`Metamodel::Element` already resolves today** | none | low — §5 P9 |
| `resolvers.ts:580` `resolveByName` | project, recursive | ci | via `selectTarget` | ambig | high |
| `resolvers.ts:670` `resolveMember` | element | ci | first, then `memberName in element` | ambig | medium (flagged in the previous report §7.4) |
| `jjscript/parser/grammar.ts:28` `parseQualifiedName` | — | — | **`.` is member access, `::` is the path** | qualify | **high** — §5 P10, and §11 |
| `jjscript/executor/commands/instance.ts:81` `findMetaclassByName` | **metamodel** | exact | correct | none | low |
| `jjscript/components/ScriptBlock.tsx:206` | **project** (`availableTargets`) | ci | first | ambig | low (model names are project-unique, §2.1) |

Two more that are metamodel-scoped and need nothing: `jjscript/autocomplete/providers/metamodel.ts:113,237`,
`jjscript/recovery/rules.ts:47`.

### 4.4 JjEL (3 sites)

| file:line | scope today | change | note |
|---|---|---|---|
| `jjscript/executor/commands/eval.ts:122` `buildEvalContext` | classes/attributes/references/enums/packages: **one metamodel** (`getTargetMetamodel`); instances: **project**, unless `opts.extentModelId` (R-VAL-16) | none for M2; the M1 extension is already parameterised | the comment at `:93-105` says it in as many words: «Il resto del contesto NON cambia: le classi del metamodello e la risoluzione dei nomi restano di progetto» |
| `eval.ts:369-405` the ambiguous-instance map | project pool | none | **the precedent**: a name shared by 2+ instances is left **unbound** and recorded |
| `jjel/evaluator/evaluator.ts:231-250` | — | none | emits `kind: 'ambiguous-instance'` with `count`, `sampleClass`, `candidates` — the "use the qualified form" copy already exists |

`jjel/evaluator/evaluator.ts:610` `findSimilarProperty` is a typo suggester for error messages,
not a resolver. Discarded.

### 4.5 JjTL (5 sites)

| file:line | scope today | change | note |
|---|---|---|---|
| `jjtl/parser/parser.ts:81,85` `transformation X from A to B` | — | **qualify (already available)** | the two metamodel names are parsed and then used **only as display labels** (`executor.ts:853,1095,1182` → `modelName`). The real source/target come from `sourceMetamodelId`/`targetMetamodelId` (`types/transformation.ts:35-36`), resolved **by id**. The grammar already has the slot the design wants; nothing reads it |
| `jjtl/executor/jjodelConverter.ts:420` `findClassInMetamodel` | **target metamodel**, recursive into packages | exact | none | low |
| `jjtl/services/SimpleMatcher.ts:110-233` | the two element lists handed in | ci | none | low |
| `jjtl/services/AIMatcher.ts:239-268` | same | ci | none | low |
| `jjtl/utils/metamodelConverter.ts:245` | by **id** | — | none | — |

### 4.6 Jjodie / AI (4 sites)

| file:line | scope today | change | risk |
|---|---|---|---|
| `services/JjodieContext.ts:86-113` `resolveMetamodelScope` | **metamodel**, resolved by **id** from the active artefact | none | low |
| `services/JjodieActionExecutor.ts:612` `findClassByName(project, name)` | **project** — `project.classes.find(c => c.name === name)` | scope | **high** — **13 call sites** in that file (`:116,145,178,223,265,266,321,363,397,452,474,513,514,558`). The LLM is shown one metamodel's names (line above) and the write lands on the first class of that name in **any** metamodel |
| `services/JjodieActionParser.ts:321-362` | validates against `existingClasses` (a name list) | scope | medium — the parser and the executor can disagree about which class a name means |
| `jjodie/rag/indexer.ts:185` | tag derivation only | none | — |

Jjodie is also an **indirect** consumer of the JjScript resolvers via
`jjodie-integration/JjodieAPIImpl.ts:8` — established in the previous report §5, not re-derived.

### 4.7 UI / editors / viewpoints (11 sites)

| file:line | scope today | change | note |
|---|---|---|---|
| `components/editor-v2/viewpoint/ir/metaclassPin.ts:75` `resolveMetaclassId` | pin (id) → `appliableToClasses` (ids) → **project, first by name** | ambig (step 3 only) | **the only accessor in the tree that already disambiguates.** Its header names the exact problem: «a project can hold two metamodels that both declare `State`» |
| `components/editor-v2/viewpoint/ir/irResolveCore.ts:46` `pinAccepts` | per-ancestor id comparison | none | the runtime guard: an unpinned view still matches by name across metamodels, declared legacy behaviour |
| `irResolveCore.ts:186-245` | view buckets keyed by **name** | none (guarded by `pinAccepts`) | low |
| `components/editor-v2/viewpoint/authoring/MatchingSection.tsx:55-70` `metaclassChipLabel` | choices list | none | **already renders `Metamodel.Name` when 2+ metamodels declare the name** — the qualified surface form exists in the UI today |
| `MatchingSection.tsx:40-50` `metaclassGroups` | groups the picker **by metamodel** | none | low |
| `VertexAuthoringPanel.tsx:286`, `EdgeAuthoringPanel.tsx:351`, `RowAuthoringPanel.tsx:183` | `info.allClasses`, id first then **first by name** | ambig | medium — three copies of the same fallback |
| `components/editors/views/data/edgeCandidate.ts:57` `resolveClassifierByName` | **loops every metamodel, returns the first hit** | scope + ambig | medium |
| `components/project/ProjectEditor.tsx:1765,2015` | **target metamodel** (`targetMetamodel.classes`) | none | low |
| `ProjectEditor.tsx:1995,2082` | **one M1 model**, and **already reports ambiguity**: `resolveSeeded` warns `Ambiguous name "…" (N instances) — … skipped, nothing written` | none | the second precedent |
| `components/TreeViewSidebar/treeViewScope.ts:76` `collectClassNames` | one metamodel's packages | none | names only, no resolution |
| `components/editor-v2/viewpoint/ir/irInteraction.ts:216` | keys are names; the comment flags the two-metamodel case | none | low |

### 4.8 Import / export (6 sites)

| file:line | scope today | change | note |
|---|---|---|---|
| `api/data.ts:246` `LinkAllNamesToIDs` | **import** — `nameMap` built only over `parsedElements` | none | and it **already warns** on homonyms: `Log.w(!!nameMap[typeprefix + name], "found 2 elements with same name", …)` (`:308`) |
| `api/data.ts:500` | **store** — `Selectors.getAll(DModel).filter(m => m.name === filename)[0]` | ambig | medium: picks a metamodel for an M1 import by file name |
| `api/data.ts:522-524` | **store** — all `DPackage`, `d.uri === ns`, `[0]` | ambig | medium |
| `services/export/XMIService.ts:36-60` `getMetamodelByNsURI` | **store** | none | **already returns `{ model: null, ambiguous: [names] }` when 2+ packages match.** The third precedent, and the closest in shape to what the design asks for |
| `XMIService.ts:723` `findMetaclassByName` | **metamodel**, recursive | none | low |
| `XMIService.ts:742` `findMetafeatureByName` | **class** (`allAttributes`/`allReferences`) | none | low |

`services/export/EcoreService.ts` writes `pkg.__raw.uri` for byte-identical nsURI (CLAUDE.md §3.7)
and performs no name-based lookup on import. Discarded as a lookup site.

---

## 5. Probe — what the accessors actually return

Run under the repo's own runner (vitest 4.1.4) from the session scratchpad, with the frontend's
`node_modules` symlinked. **Nothing in the repo was created, modified or staged**: `git status
--short` before and after shows the same two `ValidationRulesModal.*` files of the other lane
(RC-13), `git diff --stat` the same 2 files / 11 insertions / 9 deletions.

Harness note, itself a measurement: `environment: 'node'` cannot import `redux/selectors/selectors`,
`model/logicWrapper/nameUniqueness` or `model/logicWrapper/LModelElement` — all three fail with
`window is not defined`, consistent with the previous report §8.1. The probe boots them by
stubbing browser globals and aliasing `jquery`/`monaco-editor`/`DSL/nearley` (which is CJS and
cannot be evaluated by the ESM runner at all). **No dependency was installed** (`jsdom` is not
present and was not added). `metaclassPin` and `jjscript/executor/resolvers` import cleanly under
plain `node` — they are the two pure modules in the set.

**27 tests, 27 passed.** Fixture: project `P` = metamodel `A` (class `A.Person`, enum `A.Colour`)
+ metamodel `B` (class `B.Person`, enum `B.Colour`).

| probe | call | measured |
|---|---|---|
| P1-a | `Selectors.getByName2('Person','DClass',false,state)` | **`A.Person`** |
| P1-b | same, `idlookup` built B-first | **`B.Person`** — insertion order is the whole answer |
| P1-c | *positive control*: drop `A.Person`, ask again | **`B.Person`** — the scan does reach B, so P1-a is a choice of the code, not an unvisited entry |
| P1-d | `getByName2('PERSON', …)` | **`A.Person`** — case-insensitive by default |
| P2-a | `Selectors.getAll(DClass, undefined, state, true, false)` | pool = **`A.Person, B.Person`** — `state.classs` is the whole store |
| P2-b | same with the by-name condition | **2 matches**; `getByField` returns `[0]` = `A.Person` |
| P2-c | *control*: a name only A declares | **1 match** |
| P3-a | `_impl_getByName(namedArray([A.Person]), 'Person')` | **`A.Person`** — scoped to one metamodel, correct |
| P3-b | two homonyms in **one** named array | array length 2, `$Person` → **`B.Person`**: the `$name` key is a plain property, **last writer wins and the other is unreachable** |
| P3-c | fresh array, `'Person'` / `'person'` / `'PERSON'` | `A.Person` / `A.person` / `A.Person` — exact first, CI as fallback |
| P3-d | `'person'`, then `'PERSON'`, then `'person'` again | **`A.person` → … → `A.Person`**: the CI fallback writes lowercase aliases **into the collection**, destroying the exact-case entry for every later lookup |
| P4-a | `projectClasses.find(c => c.name === 'Person')` (the Jjodie path) | **`A.Person`** of 2 candidates |
| P5-a | `resolveMetaclassId('Person', {candidates:[A,B]})` | `{id:'A.Person', source:'name'}` |
| P5-b | same **with a pin** on B | `{id:'B.Person', source:'pin'}` — the only accessor that gets it right |
| P6-a | `resolveElementInMetamodel(qn('Person'), mmB)` | **`B.Person`** — correct by construction |
| P6-b | `resolveElement(qn('Person'), project)` | **`A.Person`** |
| P6-c | same **with `kinds: ['class']`** | **`A.Person`** — restricting the kind does not restrict the metamodel |
| P7-a | `resolveTargetInProject(qn('Person'), project, ['class'])` | element `A.Person`, **`ambiguousWith` undefined** |
| P7-b | *control*: two homonyms **inside one metamodel** | element `A.Person`, **`ambiguousWith` undefined** |
| P8-a | two enums `colour`/`Colour`, ask `COLOUR`, `kinds:['enum']` | element **null**, `ambiguousWith = ["colour","Colour"]` |
| P8-b | *control*: ask `Colour` exactly | `e.upper`, no ambiguity |
| P9-a | `resolveElement({segments:['B','Person']}, project, ['class'])` | **`B.Person`** |
| P9-b | *control*: `['A','Person']` | **`A.Person`** |
| P10-a | `parseQualifiedName('B.Person')` | `{segments:['B'], member:'Person'}` |
| P10-b | `parseQualifiedName('B::Person')` | `{segments:['B','Person']}` |
| P10-c | resolve both surface forms | **`B.Person` → null**, **`B::Person` → `B.Person`** |

Three results change the shape of the work:

1. **P7 vs P8.** The ambiguity machinery added by `7bacbd63c` fires **only** on a case-insensitive
   plurality. The code says so in one line (`resolvers.ts:233`): `if (exact.length > 0) return
   { element: exact[0] };`. Two elements spelled *identically* — which is exactly the homonym case
   — never reach the `ambiguousWith` branch. The **surface** (`TargetResolution.ambiguousWith`,
   the message plumbing in `create`/`delete`/`rename`/`list`) already exists; what is missing is
   one branch.
2. **P9.** `PROJECT_COLLECTIONS` (`resolvers.ts:138-142`) begins with `'metamodels'`, so the
   qualified walk `Metamodel → Element` **already works**. No new resolution strategy is needed.
3. **P10.** But the **surface syntax** the design names does not. `parseQualifiedName`
   (`grammar.ts:37-47`) treats the last `.` as *member access*, so `B.Person` parses as «the member
   `Person` of `B`» and resolves to **null** — `resolveMember` searches
   `['attributes','references','operations','parameters','literals']`, never `classes`. The working
   qualifier today is **`::`**.

---

## 6. Existing tests that build two homonymous metamodels

**Two exist.** This is not a gap to open from scratch.

- `frontend/src/model/__tests__/m2NameUniqueness.test.ts` — the fixture comment at `:33` reads
  «due package in un metamodello, piu' un secondo metamodello», `:98` «un secondo metamodello, con
  lo stesso nome di classe», and `:184` is the assertion `cross-METAMODELLO: lecito`, with the
  positive control at `:186` that the same name **does** collide inside one metamodel.
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/metaclassPin.test.ts` — `:11` «two
  metamodels that both declare `State`, where the name alone cannot tell them apart»; `:62` is the
  case the slice exists for, `:103` the `appliableToClasses` fallback, `:156` and `:189` the
  dangling-pointer cases.

No test anywhere exercises a **lookup** over two homonymous metamodels: the two above test the
uniqueness verdict and the pin, not `Selectors.getByName`, `resolveElement`, or
`findClassByName`. That is the hole the probe in §5 fills, and the shape a regression suite would take.

---

## 7. Sites grouped by consumer

| consumer | sites | of which project/store-wide first-match |
|---|---:|---:|
| Core (Selectors + L-layer + producers) | 18 + 3 producers | **11** |
| Uniqueness (`nameUniqueness.ts`) | 2 | 0 |
| JjScript | 9 (+2 already correct) | **4** |
| JjEL | 3 | 0 |
| JjTL | 5 | 0 |
| Jjodie / AI | 4 | **2** |
| UI / editors / viewpoints | 11 | **3** — but one of them (`metaclassPin`) is guarded |
| Import / export | 6 | **3**, two of which already declare ambiguity |
| **total** | **56** | **17** (counting `metaclassPin` step 3, which is guarded downstream) |

---

## 8. Three precedents already in the tree

They matter for §11 because none of them has to be invented.

1. **`XMIService.getMetamodelByNsURI`** (`services/export/XMIService.ts:36-60`) — the closest to
   the intended contract: `if (matchpkg.length > 1) return { model: null, ambiguous: names }`, with
   a named fallback and an `console.info` when the fallback fires.
2. **JjEL's ambiguous-instance map** (`eval.ts:369-405` + `evaluator.ts:231-250`) — an ambiguous
   name is **left unbound** and recorded with `count`, `sampleClass` and `candidates`
   (each `{id, className, path}`), and the evaluator emits a `'ambiguous-instance'` warning
   steering the user to the qualified form. `formatAmbiguousCandidates` (`context.ts:227`) is the
   copy. This is the intended design, implemented, for M1 instance names.
3. **`ProjectEditor.resolveSeeded`** (`ProjectEditor.tsx:2079-2091`) — `{found, ambiguous}` kept
   separate «so each caller keeps its own "not found" copy untouched and only the new case speaks
   with a new voice — a not-found warning on an ambiguous name would be a false statement about a
   name that IS there, twice».

And a fourth, for the **surface** form: `MatchingSection.metaclassChipLabel`
(`MatchingSection.tsx:55-70`) already renders `Metamodel.Name` in the authoring UI, but **only**
when 2+ metamodels declare the name and **only** when a pin says which one was meant.

---

## 9. The qualified-name producer already exists, and nothing parses it

`LModelElement.tsx:453-460`:

```typescript
fullname!:string;
protected get_fullName(context: Context): this["fullname"] { return this.get_fullname(context); }
protected get_fullname(context: Context): this["fullname"] {
    const containers = this.get_containers(context).reverse();
    let fullname: string = containers.slice(0, containers.length).map(c => c.name).join('.');
    return fullname;
}
```

The chain starts at the owning `DModel`, so `fullname` is already `Metamodel.package.Class` — the
exact string the design wants, **dot-separated**. Every reader in the tree is a tooltip
(`ClassNode.tsx:501,513`), a dropdown group label (`LModelElement.tsx:1382,1392,2901`) or a
`TRANSACTION` description (`:1534,3680,4249,5617,6644`). **No resolver consumes it.** Producing the
qualified form is free; parsing it is the work — and §5 P10 says the dot is already taken in
JjScript.

---

## 10. Risks

**R1 — the dead per-model branch in `get_type`/`set_type` is dead *by ratified decision*.**
`LModelElement.tsx:1420-1432` says it verbatim:

```
// STEP 2 IS DEAD, AND STAYS DEAD BY DECISION (R-M2U-5, 2026-08-30).
// `model` is declared here and never assigned ... NOT repaired: assigning `model`
// would narrow the resolution pool from global to per-model, which is a design
// change and not a typo fix ... Whoever revisits this decides the pool first and
// the assignment second.
```

The intended design **is** that revisit. Four `Selectors.getByName` calls (`:1441,1448,1508,1518`)
become correct the moment `model` is assigned — but that is a behaviour change on the D→L type
resolution path, i.e. exactly what R-M2U-5 declined to do in passing. It needs its own decision,
not a line in a wider refactor.

**R2 — `_impl_getByName` mutates its input.** Measured (P3-d): the case-insensitive fallback writes
`collection[key.toLowerCase()] = collection[key]` for **every** key, so one `getClassByName('PERSON')`
permanently rebinds `$person` to `Person` in that array. The arrays are rebuilt per getter call in
the common path, so the blast radius is one call chain — but any caller that holds a collection
across two lookups sees the second answer change. Independent of the scope question; it would be
a silent regression source for any test written against these accessors.

**R3 — `$name` keys cannot represent homonyms at all.** P3-b: two classes of the same name in one
named array leave one reachable. Today `checkM2NameUniqueness` prevents that **within** a
metamodel, but `LModel.crossClasses` / `get_classes(c, s, includeCross = true)`
(`LModelElement.tsx:5710,5711`) unions a metamodel with its **dependencies** — so the moment two
metamodels in a dependency relation both declare `Person`, the named array silently loses one.
Not measured on a live project; the mechanism is measured.

**R4 — metamodel names are not unique on create.** §2.1: the rule lives only in `LModel.set_name`,
and there are 12 `DModel.new(` sites. A qualified `A.Person` is unique only if `A` is. Any design
that leans on qualification needs the create path closed first, or the qualifier is ambiguous too.

**R5 — the `.` is taken.** §5 P10. Adopting `Metamodel.Element` as the JjScript surface form is a
**grammar change**, not a resolver change: it collides with `Parent.member`, which is how `delete
literal X in Mood` and every `rename Person.name` form is parsed (`grammar.ts:37-47`,
`parser.ts:474-484`). `::` already does the job and costs nothing.

**R6 — Jjodie's read scope and write scope disagree today.** `JjodieContext.resolveMetamodelScope`
narrows the context shown to the model to one metamodel; `JjodieActionExecutor.findClassByName`
writes project-wide. 13 call sites. This is a live defect independent of whether the design is
adopted.

**R7 — no file in this inventory is in the critical zone** (CLAUDE.md §3.1). No Layer Impact
Report is due for the discovery. A *fix* touching `LModelElement.tsx` type resolution or
`selectors.ts` would be a different matter: those are D-L proxy write paths and §3.2 applies.

**R8 — `elementWaiter.test.ts` mocks the JjScript resolvers** (`vi.mock('../resolvers')`, lines
34-35, established in the previous report §7.5). A semantic change there is invisible to it.

---

## 11. Cost, in sites per change type

Not time. The unit is "a site that has to be edited", counted from §4.

| change type | sites | which |
|---|---:|---|
| **none** — already scoped as the design wants | **33** | all of JjEL (3), JjTL (5), uniqueness (2), the metamodel-scoped core accessors (5), JjScript's metamodel path (4), the import-local and metamodel-scoped I/O (4), the guarded/correct UI sites (6), producers left alone (3), `LModel.set_name` (1) |
| **pass a scope** — accept and honour a scope argument | **8** | `getByName2`, `getByName`, `getByField`, `get_type`×2, `set_type`×2, `Constructors.resolveClassifier`, `JjodieActionExecutor.findClassByName` (1 signature, **13 call sites**), `JjodieActionParser` validation. Counting the Jjodie call sites individually: **21** |
| **report ambiguity** — refuse and list the qualified names instead of taking `[0]` | **12** | `selectTarget` (1 branch, serves `resolveTargetInProject` + `resolveByName`), `resolveMember`, `getModel`, `getViewIdFromName`, `getPackageByUri`, `LObject.set_instanceof`, `resolveMetaclassId` step 3, the three authoring-panel fallbacks, `edgeCandidate.resolveClassifierByName`, `api/data.ts:500`, `api/data.ts:522` |
| **qualify** — accept or produce a qualified name | **4** | `parseQualifiedName` (grammar decision, R5), the three `getByFullPath` roots |

The single highest-leverage edit is **`selectTarget`** (`resolvers.ts:192-256`): one branch —
`if (exact.length > 1 && kinds?.length) return { element: null, ambiguousWith: … }` — turns the
whole JjScript project-wide path from silent-first-match into a declared ambiguity, reusing the
`ambiguousWith` field, the four command messages and the 31 existing tests. **This is the pattern
from `7bacbd63c` reused as is**, which is what the prompt asks to be told: the shape fits, only
the exact-plurality case was never written.

The second is **`JjodieActionExecutor.findClassByName`**: one signature, 13 call sites, and the
scope it needs is already computed three files away (`JjodieContext.resolveMetamodelScope`).

---

## 12. Open questions for Alfonso

1. **The qualifier.** `::` works today, end to end, with no change (§5 P9/P10). `.` is the design's
   spelling and is already taken by member access in JjScript (R5). Adopt `::` as the platform
   qualifier, change the JjScript grammar, or accept two spellings (`.` in the UI and in `fullname`,
   `::` in JjScript)? The answer decides whether §11's "qualify" column is 0 sites or a grammar lane.
2. **`get_type`/`set_type` and R-M2U-5.** Assigning the `model` variable those four branches already
   ask for is a 2-line edit that narrows the type-resolution pool from store to metamodel. R-M2U-5
   declined it explicitly in August as «a design change and not a typo fix». Does this design
   decision supersede it, and does it belong in this effort or its own?
3. **Metamodel name uniqueness on create** (R4). The rule exists on rename only, and 12 `DModel.new`
   sites bypass it. Close it as part of this, or accept that a qualified name can itself be
   ambiguous and have the ambiguity error say so?
4. **The default scope for the core accessors.** `Selectors.getByName*` has ~10 direct callers and
   is the lowest-level primitive in the tree. Add an optional scope parameter (absent = today's
   behaviour, zero risk to callers not changed — the shape chosen for `kinds` in `7bacbd63c`), or
   make the scope **required** and force every caller to declare one? The first is cheap and leaves
   the defect reachable; the second is the only one that makes «project-wide» impossible to reach
   by accident.
5. **Ambiguity: error or warning?** `checkM2NameUniqueness` refuses a collision outright; JjEL
   leaves an ambiguous instance name **unbound with a warning** and keeps evaluating; ProjectEditor
   **skips the write and warns**. Three different answers already shipped. Which one is the platform
   rule for a project-wide lookup that finds two candidates — refuse, or resolve to nothing and warn?
6. **Scope of the first lane.** §11 says the two highest-leverage edits are `selectTarget` (1 branch)
   and `JjodieActionExecutor` (1 signature, 13 call sites), and together they close 2 of the 3
   consumer groups that are actually project-wide. Is that the first lane, with the core
   `Selectors` question (Q4) deferred, or does the core go first because everything else sits on it?

---

**HARD STOP.** Phase 1 closed. No source modified, nothing staged; the working tree carries only
the two `ValidationRulesModal.*` files of the other lane, unchanged (RC-13). The analysis and the
decision happen in chat.
