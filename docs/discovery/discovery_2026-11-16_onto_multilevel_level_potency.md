# Discovery — multilevel instantiation in the instantiation STC: level and potency roles

- Prompt-ID: P-2026-11-16-0205 (`docs/prompts/claude_2026-11-16_0205_prompt_onto_multilevel_discovery.md`)
- Chat: C-2026-10-25-2159 · Front: instance-of · Lane: discovery, read-only
- Session: 71207766-e630-42b3-b0c7-26c1d23e4f21
- Tree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, HEAD `c04ffd964` (parent `0efb75552`, trunk)
- Executor: Claude Opus 5.5 (`claude-opus-5-5`), effort xhigh
- This report is a set of hypotheses with evidence, not a reference. A downstream lane re-reads the real files.

Tags: **[measured]** = run in this phase on HEAD `c04ffd964`; **[read]** = read in a file of that tree.

---

## 0. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | The existing roles suffice for a clabject metamodel where `typeReference` goes from a Clabject to a Clabject | **Partly.** `recordsFor`, `recordFor` and `featureClosure` work with the same metaclass on both ends, and a root is no instance. A slot more than one level below its field cannot be expressed: that needs a potency | §3.1, probe B1–B5 |
| H2 | Adding roles to the codec changes the bytes of today's UML and DCN bags | **Falsified** for both placements tested. Only the placement after `featureSources` also keeps an older build's re-encode of a new bag byte-equal | §4 A |
| H3 | Consumers assume "class above, object below" | **Holds in four places**: slot synthesis, ghost-row order, creation options, link options. Missing, orphan and «Sync slots» go through `slotDiff` and inherit the fix | §3.2 |
| H4 | The five R-OI-20 gating points (seven level readers) must change for integer levels | **Falsified.** All seven read `=== 'class'` / `!== 'class'`. That can keep meaning "the level set is {0}"; only the option lists need a level filter | §3.3 |
| H5 | The change needs `reducer.ts`, a VersionFixer step or an exported-interface change beyond optional properties | **Falsified** [read] | §3.5 |
| H6 | The DCN front is unaffected | **Holds**, provided `featureClosure` is kept as is and the new rule is a new function (DCN calls `featureClosure` directly) | §3.2 |

## 1. Objective

Answer the prompt's six questions: which roles a clabject metamodel needs (`level`, `potency`), what in the consumers is two-level-bound, how the viewpoint's level becomes an integer, which fixture to ship, what touches the critical zone and the core, and the lane plan. Keep today's UML and DCN bags byte-equal. Keep the instantiation STC (`_state.ontoBindings`) separate from the simulator's (Alfonso 2026-11-16 01:51).

## 2. Files read (full paths; windows given where the read was partial)

- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/model/ontological/bindingCodec.ts` (whole, 188 lines)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/model/ontological/bindingReader.ts` (whole, 230 lines)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/model/ontological/bindingCheck.ts` (whole, 136 lines)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/model/ontological/bindingDetect.ts` (lines 1–40)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/model/ontological/classRail.ts` (lines 1–30)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/components/editor-v2/hooks/instantiate.ts` (lines 55–208, 441–604, 606–682; declarations list over the whole file)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/components/editor-v2/problems/instantiationToProblems.ts` (lines 1–30 by grep, 53–169)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/components/editor-v2/EditorV2.tsx` (greps for `ontoLevel`, `ontoClassLevel`; windows 2046–2055, 3340–3349, 3423–3432, 3744–3753)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` (grep, lines 30–40)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (lines 385–412)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (lines 166–190)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/src/utils/deriveViewpoint.ts` (lines 1–28)
- `/Users/alfonso/jjodel-w-oi-ml/frontend/scripts/probe/onto-s2-instantiate.ts` (lines 312–332), `/Users/alfonso/jjodel-w-oi-ml/frontend/scripts/probe/dcn-drone-fixture.ts` (lines 798–820)
- `/Users/alfonso/jjodel-w-oi-ml/docs/decisions.md` (lines 6580–6738, R-OI-1..24)
- Importers of the reader, codec and check: grep over `frontend/src` (21 lines, listed in §3.2)

## 3. Findings

### 3.1 Roles (question 1)

**The codec already foresees the third level as data.** `bindingCodec.ts:7-8` [read]: «A second application of the relation (links, a third level) is a second record; the first is not touched.» Unknown keys of a record survive decode and encode, `bindingCodec.ts:154`: `return { ...out, ...extrasOf(item, KNOWN_KEYS) };`. So a bag written by a multilevel build is safe in today's build (§4 A, measured).

**The existing roles work with a Clabject on both ends** [measured, probe B1–B2]. `recordsFor` accepts an instance when its metaclass conforms to the owner of `typeReference` and its classifier's metaclass conforms to the owner of `featureContainer`, `bindingReader.ts:84`: `return containerOwner !== undefined && classifierMeta !== undefined && view.conformsTo(classifierMeta, containerOwner);`. With `Clabject.type → Clabject` and `Clabject.fields`, a root clabject has no classifier (`bindingReader.ts:70-71`), so `recordFor(root)` is `null`: a root is no instance, and it raises no slot problem. A middle clabject (`Book`) is an instance of `ProductType` and a classifier of `mobyDick` at once. Nothing in `bindingCheck.ts` forbids `typeReference` targeting its own owner. Its rules are on sorts and owners, `bindingCheck.ts:85`: `if (typeRef && slotContainer && typeRef.owner !== slotContainer.owner)`, which a Clabject owning both satisfies.

**What is missing is depth.** Every slot computation reads one closure, the closure of the classifier one level up: `bindingReader.ts:220` `const { features, cycles } = featureClosure(view, binding, classifier);`, and `instantiate.ts:504` `const { features, cycles } = featureClosure(view, binding, classifierId);`. A field declared two levels up (`ProductType.price`, due on `mobyDick`) is never reached [measured, B5: today's closure of `Book` gives `["isbn"]` only].

**Proposed roles** (two new single-id roles, both optional):

| Role | Sort | Owner | Meaning |
|------|------|-------|---------|
| `featurePotency` | attribute (integer) | the feature metaclass (target of `featureContainer`), e.g. `Field.potency` | how many levels below its owner the field becomes a slot; unset value reads **1** |
| `potency` | attribute (integer) | the instance metaclass (owner of `typeReference`), e.g. `Clabject.potency` | how many levels of instances a clabject still admits; unset value reads `potency(type) - 1`; a root with no value is unbounded |

**`level` is derived, not declared.** level(x) = length of the type chain of x: a root is 0, its instances 1, and so on, numbered from the top (Melanee's O0). It needs no write and cannot drift. UML's two levels fall out as class 0 and instance 1 [measured, B11]. The prompt's alternative was level(x) = level(type(x)) - 1 with roots declared. It needs a write on every root and can disagree with the chain, so it is left out of lane 1 (question 2).

**Deep instantiation rule proposed: exact level (DeepJava).** A field of potency p, owned by the type t_p (p hops up from x), is a slot of x, and only of x's level. Formally, with chain(x) = t1, t2, … (t1 = the classifier of x, t_{k+1} = the classifier of t_k, stopped at a root or at a repeat):

```
due(x) = for k = 1 .. |chain(x)|, in order:
           every f in featureClosure(t_k).features with featurePotency(f) = k, each once
```

Without a `featurePotency` role the rule returns `featureClosure(t1).features` by construction (no walk), so UML and DCN are today's [measured, B10]. The rejected alternative is Melanee's durability: a slot at every level down to p. It makes `Book` hold a value for a field its own instances also hold, which is deep defaults, a different semantics. It can come later as a `durability` role.

**Instantiability**: `instantiableClassifiers` filters by metaclass and the abstract flag only, `bindingReader.ts:113-114`: `if (meta === undefined || !view.conformsTo(meta, owner)) return false; return !(abstractFlag !== undefined && isTrue(view.attributeValue(id, abstractFlag)));`. With a `potency` role it also needs potency ≥ 1, so `mobyDick` (derived potency 0) leaves the menus [measured, B7].

**Codec change**: two keys, validated as ids like `ID_ROLES` (`bindingCodec.ts:80`, `136-138`). They are written **after `featureSources`**, not appended to `ID_ROLES`. That keeps an older build's re-encode of a new bag byte-equal (§4 A). **Check change**: `potency` is an attribute owned or inherited by the owner of `typeReference`. `featurePotency` is an attribute owned or inherited by the target of `featureContainer`. When `featurePotency` is present, the owner of `featureContainer` must conform to the owner of `typeReference`. Otherwise the chain stops at t1, and every field of potency ≥ 2 is silently never due. **Reader change**: new exported `typeChain`, `dueFeatures`, `ontoLevel` (derived level) and `clabjectPotency`. `slotDiff` reads `dueFeatures`; `instantiableClassifiers` gates on potency. `featureClosure` is unchanged.

### 3.2 Consumers with three levels (question 2)

| Consumer | file:line | Two-level assumption | Smallest change |
|---|---|---|---|
| slot synthesis | `instantiate.ts:504` | `featureClosure(view, binding, classifierId)` | `dueFeatures(view, binding, classifierId)` |
| «Sync slots» | `instantiate.ts:599` `const { missing } = slotDiff(view, binding, instanceId);` | via `slotDiff` | none: inherits from the reader |
| ghost rows | `instantiate.ts:663` `? featureClosure(view, record, classifier).features.filter(f => f === writing.feature \|\| diff.missing.includes(f))` | ghost order from t1's closure | `dueFeatures` |
| defaults | `instantiate.ts:455-480` | per feature, level-free | none |
| creation options | `instantiate.ts:178` `options: instantiableClassifiers(view, record, ids)` and `:145` | every classifier of every level | potency gate (reader), then a level filter by viewpoint (§3.3) |
| link options (S4) | `instantiate.ts:531` `if (!link \|\| !object \|\| !instanceObjectRecord(get, modelId, sourceId) \|\| !instanceObjectRecord(get, modelId, targetId)) return [];` | no level | also `ontoLevel(source) === ontoLevel(target)`; always true on UML (both 1) |
| missing / orphan | `instantiationToProblems.ts:119` `const diff = slotDiff(view, record, id);` | via `slotDiff` | none; the orphan text at `:130` (``${nameOf(feature)} is not a feature of ${nameOf(classifier)}``) gets a variant «… is due N levels below» when the feature is in the chain at another level |
| generalization cycle | `instantiationToProblems.ts:93-111` | per classifier | none |
| type-chain cycle | none today | — | new kind `type-cycle`, one error per cycle, anchored on its members [measured, B9: `A → B → A` terminates as data] |
| potency | none today | — | new kind `potency` (warning): a field whose potency is < 1 or above its owner's clabject potency is never due |
| O3 duplicate, O5 value type | `instantiationToProblems.ts:135-166` | per slot, level-free | none |
| DCN | `model/simulation/dcn/dcnCompile.ts:43`, `model/dcn/dcnWellFormedness.ts:36` import `featureClosure` | — | none: `featureClosure` is kept |

`InstantiationFindingKind` (`instantiationToProblems.ts:26`) gains two members. Its one consumer outside the file compares `f.kind === 'missing'` (`InstantiationProblemSync.tsx:84`) [measured, grep: 3 lines, the declaration among them, so the search reached the file].

**S4 across levels**: a link's two ends are at the same level, and its association is one level above them (the association's instances are links). The minimal fixture carries no `link` record (question 11). The rule is pinned in vitest.

**Node rendering**: ghost rows go after the first `children` compartment, `IRNodeContent.tsx:386` `() => compiled.fieldCompartments.find(fc => fc.source === 'children'),`. A clabject node has two children compartments (slots and fields). If the fields compartment came first, the ghosts would land under the fields. The fixture authors the slots compartment first (question 9).

**Class rail at level 0** [read, `classRail.ts:4-8`]: classifiers are the concrete conformers of the target of `typeReference` (Clabject), properties are those of the target of `featureContainer` (Field). The Generalizations group reads `generalization.via` only, so a `direct` generalization gives no group. Fine for the fixture.

### 3.3 Viewpoint level (question 3)

Today: `instantiate.ts:200` `return level === 'class' || level === 'instance' ? level : 'both';`. Seven readers, all boolean on `class`:

- `EditorV2.tsx:697` `const ontoClassLevel = useSelector((state: any) => ontoLevelOf((id: string) => state.idlookup?.[id], viewpointId) === 'class');` drives the rail sections and the class rail (`:699-706`) and the Property gate (`:1734`);
- `:2051` S4 link drag, `:3344` pane menu, `:3427` drop and click, `:3747` node menu «New instance» (`!== 'class'`).

**Proposal** (H4 falsified, the readers stay):

- `_state.ontoLevel` stays a **string**: `class`, `instance`, `both`, an integer `'2'`, or a comma list `'1,2'`. The write path is unchanged, `ViewpointProperties.tsx:128` `(viewpoint as any).state = { [ONTO_LEVEL_KEY]: level };`.
- New `ontoLevelsOf(get, vp)` gives the set: absent or `both` = all levels; `class` = {0}; `instance` = every level ≥ 1; `'n'` = {n}; `'n,m'` = {n, m}. With two levels, `instance` = {1} = the bottom, so R-OI-19/20 read the same.
- `ontoLevelOf` keeps its type (`OntoLevel` unchanged) and returns `'class'` exactly when the set is {0}. The seven `=== 'class'` readers then need no edit: `'0'` behaves as `class`.
- The instance surfaces (rail «Instances of», pane «New instance of ▸», node «New instance», drop) list only the classifiers c with `ontoLevel(c) + 1` in the set. The drop re-checks it (R-OI-20 «one guard read at the drop»).
- At a level ≥ 1, a clabject is also a classifier when the record's instance metaclass conforms to the owner of `featureContainer`. There, the rail's Attributes group (R-OI-21) shows for the selected clabject. On UML that condition is false at level 1 (`InstanceSpecification` is no `Class`), so UML is unchanged (question 6).
- The select (`ViewpointProperties.tsx:35-39`) keeps its three options. It adds «Level 0» to «Level 4» only when the binding declares `potency` or `featurePotency` (question 8).

### 3.4 The clabject fixture (question 4)

Metamodel `MLM`, minimal (Atkinson–Kühne, DeepJava style):

- `Element` (abstract) { `name: EString` }
- `Clabject` ▸ Element { `potency: EInt`; `isAbstract: EBoolean`; `type: Clabject [0..1]`; `supers: Clabject [0..*]`; `fields: Field [0..*]` (composition); `slots: Slot [0..*]` (composition) }
- `Field` ▸ Element { `potency: EInt`; `type: DataType [1]`; `default: EString` }
- `Slot` { `field: Field [1]`; `value: Value [0..1]` (composition) }
- `Value` (abstract); `StringValue` ▸ Value { `value: EString` }; `IntValue` ▸ Value { `value: EInt` }
- `DataType` ▸ Element

Binding, one `object` record: `typeReference Clabject.type`, `featureContainer Clabject.fields`, `generalization { direct: Clabject.supers }`, `slotContainer Clabject.slots`, `definingFeature Slot.field`, `valueHolder Slot.value`, `abstractFlag Clabject.isAbstract`, `featureType Field.type`, `defaultValue Field.default`, `valueKinds` [`primitive:String` → StringValue.value, `primitive:Integer` → IntValue.value], `featureSources` absent, `potency Clabject.potency`, `featurePotency Field.potency`. Value kinds are always objects (`instantiate.ts:470-479`), hence the two literal metaclasses. A feature typed by a Clabject gets no default (`instantiate.ts:450`), so the fixture keeps to primitive fields.

Model: `String`, `Integer` (DataType); `ProductType` (potency 2) { `taxRate¹ : Integer`, `price² : Integer` }; `Book : ProductType` { `isbn¹ : String` } with `taxRate = 7`; `DVD : ProductType`; `mobyDick : Book` with `isbn`, `price = 10`. Expected values, all **measured** on the probe's in-memory copy: due(instance of ProductType) = `[taxRate]`, due(instance of Book) = `[isbn, price]`, levels 0/1/2, potencies 2/1/0.

Viewpoints: the default (`both`) plus «MLM / level 0», «level 1» and «level 2» (`ontoLevel` `'0'`, `'1'`, `'2'`). «Derive viewpoint» gives the starting views, one IR view per concrete class (`deriveViewpoint.ts:5-8`: «Creates a NEW viewpoint named `<metamodel> / <notation label>` with one IR view per concrete class»). The probe then authors the Clabject node: label `name : type.name`, slots compartment first (`field.name = value`), then fields (`name^potency : type`). The UML views draw `InstanceSpecification`, which this metamodel has none of, so they do not apply.

Built by a probe on the pattern of `dcn-drone-fixture.ts` (`scripts/probe/mlm-clabject-fixture.ts`, lane 4) and exported to `~/jjodel-demo-exports/mlm-clabject/`. The demo fixtures could not be searched for an existing bag: a positive control (`InstanceSpecification` in the UML export, `StaticClass` in the DCN one) returned 0 through both `grep -o` and Python, and the files read as 119 k characters out of 347 k bytes, so they are not plain text. The absence of a bag there is **read** only, `onto-s2-instantiate.ts:6`: «The fixture does not declare the bindings».

### 3.5 Critical zone and core (question 5)

- §3.1 table: `editor-v2/problems/` (`instantiationToProblems.ts`, lane 2) is in it, and so is `editor-v2/viewpoint/ir/` (`IRNodeContent.tsx`, only if the ghost anchor is changed, which question 9 defers). Lane 2 opens with a Layer Impact Report. `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts` and `VersionFixer.tsx` are not touched.
- `reducer.ts`: not touched. No new action. The level is a string in `_state`, written by the existing set path.
- VersionFixer: no step. Unknown bag keys survive (R-OI-6), and `ontoLevel` values stay strings. Rule 14 is not triggered (no `DV.tsx`, no `defaultViewTemplate.ts`).
- Exported interfaces: `OntoBinding` gains two optional properties (rule 11 allows that). `InstantiationFindingKind` is a type alias that gains two members, with one consumer (§3.2). `OntoLevel` is unchanged; the rest are new exports.
- Rule 12: no new creator path. Instantiation keeps `instantiate.ts`'s queue and undo group (R-OI-14).

## 4. Measures

All on HEAD `c04ffd964`. The probe is throwaway, under `/tmp/mlm-probe-0205/`, never committed: copies of `bindingCodec.ts` and `bindingReader.ts`, plus two patched codecs, run with `node --experimental-strip-types`, Node 23.3.0.

- **Existing tests** [measured]: `npx vitest run src/model/ontological` plus `instantiate.test.ts`, `linkInstance.test.ts`, `classElement.test.ts`, `instantiationToProblems.test.ts` and `dcnToProblems.test.ts`, through `run-quiet`: exit 0, **10 files, 207 tests passed**. Log: `.agent-logs/onto-tests-20261116-020804.log`.
- **A — round trip** [measured], 19 PASS (31 PASS and 0 FAIL in all, A and B; a first run had 3 FAIL, all probe defects: a «canonical» input built without decode, and a compat check comparing the wrong pair; fixed before the run quoted here). The UML bag (object and link records, shaped as `onto-s2-instantiate.ts:319-332` writes them, 946 B canonical), the DCN bag (object with `featureSources`, shaped as `dcn-drone-fixture.ts:803-816`, 1047 B) and a DCN bag with foreign root and record keys (1071 B) were tried with the current codec and two patched ones. Patched = the two roles appended to `ID_ROLES`; patched2 = the two roles written after `featureSources`. Both patched codecs give bytes equal to the current codec on every bag. The canonical form is a fixed point, and a canonical input comes back byte-equal. On a multilevel bag (569 B), today's codec keeps the two roles as unknown keys, and its re-encode reads back as the same record under both patched codecs. Only with **patched2** is today's re-encode byte-equal to the new canonical form (patched: `false`). A non-id `potency` is a shape defect (`bindings[0].potency: not an id.`).
- **B — rule prototype** [measured], 12 PASS: the results quoted in §3.1 and §3.4; a type cycle terminates as data; on UML `dueFeatures(Student)` equals `featureClosure(Student)` (`["sid","pname"]`) and potency is unbounded. Cost: 200 level-2 instances under 10 types take **0.24 ms per pass** on the in-memory view, against S3a's 3.9 ms at 200 instances on the store (R-OI-13). The store's view costs more per read; lane 2 re-measures it.

## 5. Dependencies and risks

- **Unset integers**: `attributeValue` reads `values[0]` (`instantiate.ts:80`), so an unset potency reads `undefined`, which means "derive". If Jjodel writes `0` into a new EInt slot, every new clabject would read potency 0, and every field potency 0, and never be due. Not measured here. Lane 4's probe measures it first, and if it holds, the fixture writes the potencies explicitly.
- **Rule 19**: lane 1 touches six files (three sources, three tests), so its prompt lists them for the confirmation.
- **Ghost anchor** (§3.2): a view that puts fields before slots draws the ghosts under the fields. This is authoring discipline until a ticketed fix lands.
- **Store cost**: `dueFeatures` walks the chain once per instance on every dispatch (`instanceRows` runs per node). `memoBindings` (`instantiate.ts:629-637`) memoizes the bag, not the chain. Lane 2 measures it at 200 instances.
- **R-DCN-3**: a dormant slot is not orphan. `dueFeatures` with no `featurePotency` returns `featureClosure` including `featureSources`, so DCN dormancy is unchanged. A DCN metamodel that also declares `featurePotency` has no meaning yet. Lane 1's check reports `featurePotency` together with `featureSources` as a defect until a front asks for it.

## 6. Lane plan (question 6)

1. **L1 — codec, reader, check** (`model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`, and their three tests). Roles after `featureSources`; `typeChain`, `dueFeatures`, `ontoLevel`, `clabjectPotency`; `slotDiff` on `dueFeatures`; potency gate in `instantiableClassifiers`; the check rules of §3.1. Tests: pin the UML and DCN bags' bytes, the old-build compat, and probe B as vitest. Mutation bench: `p === k` → `p <= k`, default 1 → 0, and dropping the no-role guard must each kill a test. No browser probe (pure code). Gates: typecheck, the ontological tests, check:docs.
2. **L2 — consumers** (`hooks/instantiate.ts`, `problems/instantiationToProblems.ts`, their tests; Layer Impact Report). `synthesisPlan` and `instanceRows` use `dueFeatures`; `linkOptions` requires the same level; new kinds `type-cycle` and `potency`; orphan wording. Probe regression on UML: S2 57/57, S4 14/14, s3a 8/8, s3b 6/6, unchanged. Cost at 200 instances on the store.
3. **L3 — viewpoint level and rails** (`hooks/instantiate.ts`, `EditorV2.tsx` option lists and drop guard only, `ViewpointProperties.tsx`, `panels/PalettePanel.tsx` if the section groups by level). `ontoLevelsOf`, the level filter, the Attributes group at a level ≥ 1 for a clabject, the select's levels. Probes: the binding editor 10/10, split-pane 28/28, the UML level probe unchanged. Crops: the select, and the rail at levels 0, 1 and 2.
4. **L4 — fixture and probe** (`scripts/probe/mlm-clabject-fixture.ts`, a new `scripts/probe/onto-mlm.ts`; export under `~/jjodel-demo-exports/mlm-clabject/`, not committed). Checks: unset EInt reads `undefined`; at level 1, «Instances of ▸ ProductType» creates `Book` with one slot (`taxRate`); at level 2, `mobyDick` gets `isbn` and `price`; `mobyDick` is absent from every menu; ghost rows; a hand-made slot two levels off is an orphan; the type cycle; one undo per instantiation. Crops: the three level viewpoints.

**Decision rows to write** (R-OI-25 onward, `docs/decisions.md`):

- **R-OI-1 amendment** (Alfonso 2026-11-16 01:53–02:00): the third level and beyond are in scope, through the `level` and `potency` roles of the instantiation STC. That STC stays separate from the simulator's, with no shared catalog.
- R-OI-25: the roles `potency` and `featurePotency`, written after `featureSources`; level derived.
- R-OI-26: the exact-level rule (DeepJava); the default potency 1 reproduces R-OI-3.
- R-OI-27: level = depth of the type chain, from 0 at the top; the type cycle is an error.
- R-OI-28: clabject potency derived from its type, a root unbounded without a value, potency 0 not instantiable.
- R-OI-29: `ontoLevel` as a string of aliases or integers; the level filter of the instance surfaces; `ontoLevelOf` unchanged on the aliases.
- R-OI-30: a link's ends at one level.
- R-OI-31: the clabject fixture and its viewpoints.

## 7. Open questions (the chat adopts each `Recommended` unattended)

1. Deep instantiation rule: exact level (DeepJava) or durability (Melanee)? Recommended: exact level; durability later as its own role.
2. Level: derived depth from the top, or declared with roots (level(x) = level(type(x)) - 1)? Recommended: derived from the top, no `level` role now.
3. Role shape: two flat ids, or one `potency: { clabject, feature }` record? Recommended: two flat ids, `potency` and `featurePotency`, written after `featureSources`.
4. Alias `instance`: the bottom level, or every level below the top? Recommended: every level below the top. It is stable as the model grows, and equal to the bottom on two levels.
5. Storage of integer levels in `_state.ontoLevel`: number, array or string? Recommended: a string (`'2'`, `'1,2'`), on the existing write path.
6. Where a field is added to a clabject at a level ≥ 1? Recommended: the rail's Attributes group, when the instance metaclass is also the classifier metaclass; UML unchanged.
7. A field of potency < 1, or above its owner's potency? Recommended: never due, plus a `potency` warning.
8. The select's level list? Recommended: the three aliases, plus «Level 0» to «Level 4» only when the binding declares a potency role.
9. Ghost rows on a node with two children compartments? Recommended: the fixture authors slots first; a ticket for anchoring on the compartment that holds the slot metaclass.
10. Rule 19 for L1 (six files)? Recommended: one lane, with its file list confirmed in the prompt.
11. Links in the fixture? Recommended: none in the minimal fixture; the same-level rule tested in vitest only.
12. `featurePotency` together with `featureSources` (DCN)? Recommended: a check defect until a front needs both.
