# DCN foundations: dormant slots on the R-OI instance level, a second simulation nucleus, `self.in`

- Prompt-ID: P-2026-11-06-2240, prompt `docs/prompts/claude_2026-11-06_2240_prompt_dcn_foundations_discovery.md`
- Chat: C-2026-11-06-2159, front `dcn`
- Session: `0000f3fd-9301-4a2c-a738-023b5ce46ae5`
- Tree: `~/jjodel-dcn`, branch `dcn`, HEAD `895669463` (the prompt's commit); other refs read with `git show`
  or from their worktrees, read only: `oi-s2u` `809d85ce1`, `oi-s3b` `f6bf690b7`, `uml-fixture` `3cc526e5e`
  (an ancestor of HEAD: the fixture is on the trunk).
- Executor: Opus 5.5 (`claude-opus-5-5`).
- Spec under measure: `docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md` (R-DCN-1..8). Its decisions
  are not reopened here.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads
the real files. Tags: **read** (a file read in this phase), **measured** (a run in this phase).

## 0. Answer in brief

Written by the continuation P-2026-11-06-2250 (session `89586af2-04c8-4b5b-9be8-c14b035b6e64`) on top of §1..§5,
which it does not rewrite. The next section keeps its old number 0; the questions are in §7, not §6 as §1.3 says.

**H1, partly falsified.** A dynamic-class feature is orphan today on every R-OI surface, but no consumer decides it:
all read `featureClosure`/`slotDiff` of `model/ontological/bindingReader.ts`, which is S1 and already on the trunk.
The R-DCN-3 amendment is one optional binding role `featureSources` plus `dormantOwner`, five pure files (§1.4).

**H2, half holds.** `Expression` and `Action` are core attribute types with a syntactic check in conformance.
No `Range` data type exists; two integer bounds on `Property`, type `Integer`, fit S2/S3a unchanged (§2.2).

**H3, falsified for state, codecs and watches; holds for compiler, step and panel text.** σ, trace, scenarios,
watches and policy are nucleus-neutral; the coupling is `SimRun.net` and one replay call (`simRunState.ts:331`).
A guarded command is a placeless transition on the existing `step` (§3.2, Q3). Slot reads on R-OI need σ-backed
handles: `self.battery` does not resolve on an `InstanceSpecification` (§3.4).

**H4, falsified.** `::` has no meaning in JjEL; `self.in(...)` already parses as a member call, only `V::D` is new.
The precedent is `StateAccessExpr` with a caller-bound accessor (§4).

**H5, falsified.** `boundExploration.ts` reads markings only; W5 is a new pure module over the product of finite
domains, reusing its shape and cap (§5). There is no `.smv` exporter; `bvToSmv.ts` is its expression printer.

**Plan** (§6): 20 lanes, slice 2 first with the binding amendment on the trunk now; every lane on an object
diagram waits for `oi-s2u`/`oi-s3b` on the trunk after 3.2.0. **Decisions awaiting Alfonso** (§7):

- Q1 base: `Recommended: L2.1 on the trunk now; object-level lanes wait for the R-OI merge after 3.2.0.`
- Q2 classifier: `Recommended: DynamicClass extends NamedElement with its own Property list, feature source only.`
- Q3 nucleus form: `Recommended: a DCN compiler emitting a placeless CompiledNet on the shared step.`
- Q4 slot syntax: `Recommended: reads self.battery via σ handles, writes in a DCN action mode, fixed in L3.1.`
- Q5 range: `Recommended: two optional integer bounds on Property, type Integer, W-checked.`
- Q6 ids: `Recommended: nucleus-owned opaque ids per (instance, operation) and (viewpoint, contribution).`
- Q7 arguments: `Recommended: R-SIM-88 inputs asked at the press.`
- Q8 blank invariant, isSingleton: `Recommended: both W-check errors in L2.4.`
- Q9 inherited viewpoints: `Recommended: yes, sources applied at every level of the generalization.`
- Q10 exporter: `Recommended: TypeScript over bvToSmv, sharing the compiled guards with W5.`
- Q11 fixture: `Recommended: frontend/scripts/probe/dcn-drone-fixture.ts; importable example after slice 4.`
- Q12 amendment: `Recommended: this front writes the code on the trunk; the R-OI front ACKs a decisions row.`
- Q13 order: `Recommended: run L3.2 (parse of self.in) before the W1..W4 lane L2.4.`

## 0. Hypotheses under test

- **H1** The R-OI instance level computes the features of an instance from the classifier and its superclasses
  only, so a slot of a dynamic-class feature is reported orphan today, and the fix sits in the problem producer
  on `oi-s3b`. **Partly falsified**: the first half holds; the fix does not sit in the producer but in one pure
  function on the trunk (§1).
- **H2** The core types `Expression` and `Action` can type the attributes of the DCN classes today, and
  `Range[lo..hi]` exists as a data type. (§2)
- **H3** The run state, panel and codecs of the simulator are Petri-shaped through and through, so a second
  nucleus needs a parallel panel. (§3)
- **H4** `::` already has a meaning in JjEL. (§4)
- **H5** `boundExploration.ts` can decide W5 by enumeration as it is. (§5)

## 1. R-OI instance level and dormant slots

### 1.1 Where the binding is declared

**Read.** One bag key on the metamodel, a JSON string of named records of M2 ids:

- `frontend/src/model/ontological/bindingCodec.ts:21` `export const ONTO_BINDINGS_KEY = 'ontoBindings';`
- `bindingCodec.ts:39-57`, `interface OntoBinding`: `typeReference`, `featureContainer?`, `generalization?`,
  `slotContainer?`, `definingFeature?`, `valueHolder?`, `abstractFlag?`, `featureType?`, `defaultValue?`,
  `valueKinds?`, plus `[unknown: string]: unknown`.
- `bindingCodec.ts:12-14`: «A root or a record that has a key this version does not know keeps it, and `encode`
  writes it back; an unknown `v` is refused, never guessed at. No VersionFixer step».
- The records are written by the probes, not by a UI: `oi-s3b:frontend/scripts/probe/onto-s3b-ghost-rows.ts:199-212`
  builds `object` with `featureContainer: F('Class', 'ownedAttributes')`,
  `generalization: { via: F('Classifier', 'generalizations'), general: F('Generalization', 'general') }`,
  `featureType: F('TypedElement', 'type')`, `defaultValue: F('Property', 'defaultValue')` and four value kinds, and
  `link` with `featureContainer: F('Association', 'memberEnds')`.

**Measured** (`git diff --quiet HEAD <ref> -- frontend/src/model/ontological`, exit 0 on both): the three files of
`model/ontological/` are byte-identical on HEAD, `oi-s2u` and `oi-s3b`. The binding layer is S1 and is already on
the trunk; S2 (`instantiate.ts`), S3a (`problems/instantiation*`) and S3b (ghost rows in `IRNodeContent.tsx`) are
not.

### 1.2 How the closure is computed, and who reads it

**Read.** `frontend/src/model/ontological/bindingReader.ts:122-152`, `featureClosure`: breadth first from the
classifier, at each level

```
131            if (binding.featureContainer !== undefined) {
132                for (const f of view.referenceTargets(id, binding.featureContainer)) {
...
138            for (const general of generalsOf(view, binding, id)) {
```

so features come from `featureContainer` of the classifier and of its generals (`generalsOf`, `:113-119`) and
from nothing else. The orphan is decided one function below, `slotDiff`, `bindingReader.ts:164-168`:

```
164    for (const slot of view.referenceTargets(instanceId, binding.slotContainer)) {
165        const feature = view.referenceTargets(slot, binding.definingFeature)[0] ?? null;
166        if (feature !== null && inClosure.has(feature)) covered.add(feature);
167        else orphans.push({ slot, feature });
```

Every R-OI consumer goes through these two functions (read on `oi-s3b`, worktree `~/jjodel-w-oi-s3b`):

| Consumer | Call | Effect of a dynamic feature outside the closure |
|---|---|---|
| Slot synthesis, `instantiate.ts:272-299` `synthesisPlan` | `:293` `featureClosure(view, binding, classifierId)` | no slot is created for it |
| «Sync slots», `instantiate.ts:342-352` `syncSlotsPlan` | `:348` `slotDiff(...).missing` | never offered |
| Ghost and orphan rows, `instantiate.ts:394-425` `instanceRows` | `:404` `slotDiff`, `:412` `featureClosure` | a hand-made slot is drawn orphan, `:420` «`${name(feature)} is not a feature of ${name(classifier)}`» |
| Problems, `problems/instantiationToProblems.ts:84-169` | `:119` `slotDiff`, `:99` `featureClosure(...).cycles` | `:127-132` an `orphan` error, «Orphan slot» |
| Materialize a ghost, `instantiate.ts:449-460` | `:460` `slotDiff(...).missing` | refused |

On `oi-s2u` only the synthesis reads the closure (`oi-s2u:.../hooks/instantiate.ts:282`); there is no Sync slots,
ghost row or problem there (S3a and S3b are on `oi-s3b` only, whose base is the older `oi-s2u`).

H1 first half holds: a slot whose `definingFeature` is an attribute of a dynamic class is an orphan today, on every
surface. Second half falsified: no consumer decides «orphan» by itself; they all read `slotDiff`. The R-OI-13
amendment of R-DCN-3 is therefore one change to the closure, on the trunk, and the four consumers inherit it with
no edit: synthesis creates the dormant slots (R-DCN-3: «slots for every feature»), Sync slots offers the missing
ones, ghost rows draw them, and no orphan or problem is raised for them. A missing dormant slot is still a
`missing` warning, which is what R-DCN-3 asks for.

### 1.3 Can the binding name a second feature source today

**Read.** No. The closure reads one reference id per level (`featureContainer`); a dynamic class is reached from
the classifier by containment two hops away (`StaticClass.viewpoints` then `Viewpoint.classes`, spec §3 lines
44, 50), not by generalization, and its features may sit under a third reference. The codec would keep an extra
key byte for byte (`bindingCodec.ts:131` `return { ...out, ...extrasOf(item, KNOWN_KEYS) };`) but neither
`bindingReader` nor `bindingCheck` would read it. The binding must be extended with one optional role. Adding an
optional property to the exported `OntoBinding` and `FeatureClosure` is within Rule 11.

Smallest shape that fits both the spec and a metamodel other than DCN (spec §8: «Another metamodel with viewpoints
and invariants can use the same profile»): an optional list of reference paths, each applied from every classifier
of the generalization closure, the last hop yielding features.

```
featureSources?: { path: string[] }[]     // e.g. [[StaticClass.viewpoints, Viewpoint.classes, <dyn-class features>]]
```

and, additively on `FeatureClosure`, the owner of each feature reached through a source
(`dormantOwner?: Record<featureId, dynamicClassId>`), which the canvas needs to grey dormant slots (spec §7) and
W1 needs to know whose a slot is. `features` keeps its order (own, then inherited) with the source features after
them, each once.

Whether the last hop is a reference of its own depends on Q2 (§6): if `DynamicClass` specializes the fixture's
`Class`, it inherits `Class.ownedAttributes` (`frontend/scripts/probe/uml-class-object-fixture.ts:87`
`['Class', 'ownedAttributes', 'Property', true, true, 0, -1],`) and the path is `[viewpoints, classes]` followed by
the existing `featureContainer`; but then `instantiableClassifiers` (`bindingReader.ts:100-110`, conformance to
the container's owner) offers every dynamic class in the creation menu (`oi-s2u:.../hooks/instantiate.ts:136`,
`EditorV2.tsx:3219`), against spec §4 «The classifier of an instance is always a `StaticClass`».

The slot side needs no change: `Slot.definingFeature` is typed `Property`
(`uml-class-object-fixture.ts:100` `['Slot', 'definingFeature', 'Property', false, false, 1, 1],`), so a dynamic
class's attribute must be a `Property`; then `featureType` (`TypedElement.type`) and the O5 value-kind check
(`instantiationToProblems.ts:153-166`) apply to dormant slots unchanged.

### 1.4 Files the amendment touches

| File | Change | Critical zone |
|---|---|---|
| `frontend/src/model/ontological/bindingCodec.ts` | decode and type `featureSources` (today it would survive as an unknown key) | no (not in §3.1, not a §3.2 trigger) |
| `frontend/src/model/ontological/bindingReader.ts` | `featureClosure` walks the sources at every level; `dormantOwner`; `slotDiff` unchanged | no |
| `frontend/src/model/ontological/bindingCheck.ts` | each hop is a reference; hop i's type owns hop i+1 | no |
| `frontend/src/model/ontological/__tests__/bindingReader.test.ts`, `bindingCodec.test.ts` | closure with a source; parity without | no |

Five files, all on the trunk, none in `editor-v2/problems/` (which §3.1 lists) and none a §3.2 trigger; pure
modules with no store import (`bindingReader.ts:5-7`), so the mutation bench runs in vitest. Not touched:
`instantiate.ts`, `instantiationToProblems.ts`, `InstantiationProblemSync.tsx`, `IRNodeContent.tsx`. Two
consequences to carry:

- `InstantiationProblemSync.tsx:46` (oi-s3b) re-runs detection on the bag string
  (`String(get(get(modelid)?.instanceof)?._state?.ontoBindings ?? '')`), so a record gaining `featureSources` is
  picked up with no edit. **Read**, not run.
- The memo of `instanceRows` (`instantiate.ts:376-386`) keys on the bag value too.

Out of R-OI scope but owed to DCN: `isCreation` (spec §3 line 55, «supplies defaults at instance creation») has no
R-OI counterpart. Synthesis takes a slot's value from the feature's `defaultValue`
(`instantiate.ts:244-251` `plannedValue`); a creation class overriding the defaults of the static class needs a
synthesis rule of its own, in `instantiate.ts`, which is S2 code.

## 2. The DCN metamodel as a Jjodel metamodel

### 2.1 `Expression` and `Action` as attribute types

**Read.** H2 holds for `Expression` and `Action`:

- They are core primitives: `frontend/src/common/U.tsx:3338-3342` «Jjodel's own (R-SIM-17, R-SIM-44) ...
  `Expression = 'Expression', Action = 'Action',`», with the pointers `Pointer_EXPRESSION` / `Pointer_ACTION`
  (`model/conformance/ConformanceValidator.ts:20-21`).
- A persisted metamodel already types attributes with them: `frontend/src/codegen/examples/turnstile/turnstile.json:109`
  `"type": "Pointer_EXPRESSION",`.
- Validation is syntactic, in conformance, keyed on the pointer id: `ConformanceValidator.ts:240-260`
  (`parseExpressionStrict(text)` for an Expression, `parseAction(text)` for an Action; «Blank is absent, like ''
  above (an absent guard is `true`)»; a failure is a `type_mismatch` warning, `:265-271`).
- Ecore: written as `EString` with a `jjodel`/`type` annotation and restored on import (`api/data.ts:266-269`,
  `:697-704`).
- The contextual check (boolean result, roots, admitted targets) is the STC's, not the type's (R-SIM-17). Today it
  is `simBridge.startRun`'s compile defects, published by `problems/simCheckToProblems.ts` (header `:1-36`). DCN
  needs its own contextual producer for W1..W4; it cannot reuse `startRun`, which compiles a Petri net.

Consequences for spec §3: `DynamicClass.invariant`, `Operation.pre`, `CoherenceConstraint.pointwise`,
`BoundedPersistence.condition` and `BoundedResponse.trigger/response` are `Expression` attributes; `Operation.body`
and `Monitor.body` are `Action [0..*]`, the same shape as the arc actions of R-SIM-17. A blank invariant reads as
absent, hence `true` (the class is always active): W-level check to decide (Q8).

### 2.2 `Range[lo..hi]`

**Read.** No `Range` data type exists in the metamodel layer. A range exists only as a σ domain of the simulator's
state attributes (`model/simulation/netTypes.ts:28-31`
`| { readonly kind: 'range'; readonly min: number; readonly max: number }`, decoded in
`stateAttributesCodec.ts:61-70`), i.e. for `.[x]` declarations, not for M2 attributes or M1 slots.

Two ways to model it, measured against the R-OI code:

1. **A `RangeType` metaclass under `DataType`, with two `EInt` bounds**, an M1 type that many attributes share. It
   does not fit S2/S3a as they are: the value kind of a slot is chosen by the **name** of the feature's type,
   `oi-s3b:.../hooks/instantiate.ts:230-233`
   ``const primitive = kinds.find(k => k.when === `primitive:${typeName}`);``, then falls to the `instance` kind
   (`:240`). A range type named `Battery` would get an `InstanceValue` default, and the O5 check
   (`instantiationToProblems.ts:72-76`) would report every `LiteralInteger` in such a slot as a wrong value type.
   Making it fit means a value-kind selector by the type's metaclass, a codec and S2/S3a change on the R-OI
   branches.
2. **Two optional integer bounds on the attribute (`Property`), the type staying `Integer`**. Fits every R-OI
   surface unchanged: the type is the fixture's `Integer` primitive, value kind `primitive:Integer`, O5 passes;
   the nucleus reads the bounds to halt out of range (spec §6) and the exporter maps `min..max` (spec §9). The
   names must not collide with the multiplicity `lower`/`upper` of `MultiplicityElement`
   (`scripts/probe/uml-class-object-fixture.ts:114`).

Recommendation (Q5): option 2, with a W-check that a bound pair is complete and ordered and that only `Integer`
attributes carry it. An `Integer` attribute without bounds is the unbounded case of R-DCN-6.

### 2.3 Spec §3 on the UML fixture

**Read**, not built: the fixture is built in the browser (`uml-class-object-fixture.ts:133`, `ev(page, ...)`), the
worktree has no `node_modules`, and a throwaway metamodel would measure nothing the table below does not read
from the fixture's declarations (`:68-102`, `:111-120`).

| Spec §3 | On the fixture | Fit |
|---|---|---|
| `StaticClass extends Classifier` with attributes, operations | `Class` already owns `ownedAttributes`, `ownedOperations` (`:87-88`) | `StaticClass extends Class`, adds `viewpoints`, `isSingleton`; the `object` record's `featureContainer` (`Class.ownedAttributes`) accepts it by conformance (`bindingReader.ts:73-78`) |
| `isAbstract` | `Classifier.isAbstract` (`:113`), already the `abstractFlag` | fits |
| `isSingleton` | nothing | no R-OI rule refuses a second instance: a W-check or a creation-menu filter (Q8) |
| `Viewpoint`, `isOverlapping`, `isComplete`, `classes` | `NamedElement` exists | new metaclass, fits |
| `DynamicClass` | see Q2 | `extends NamedElement` needs its own features reference and the §1.3 path of three hops; `extends Class` reuses `ownedAttributes` but enters the creation menu |
| `Attribute` | `Property` (`:72`), required by `Slot.definingFeature : Property` (`:100`) | dynamic-class attributes must be `Property` |
| `Attribute.defaultValue : Expression[0..1]` | `Property.defaultValue : EString [0..1]` (`:116`), typed at synthesis by `typedDefault` (`instantiate.ts:174-186`) | keep `EString`: retyping changes the S2 path for no gain (a literal default parses either way) |
| `Attribute.type` Boolean, Enumeration, Integer, String | `PrimitiveType`, `Enumeration` (`:69`) | fits |
| `Range[lo..hi]` | none | §2.2 |
| `Operation` with `pre`, `body`, `redefines`, `parameters` | `Operation extends NamedElement` (`:72`), `Parameter` exists (`:440`) | additive features, fits |
| `Monitor`, `CoherenceConstraint`, `TrajectoryPattern` and its two subclasses | none | new metaclasses, fit |
| Associations, links | R-OI associations, `link` record | links wait for S4 (R-OI-13: «links wait for S4»); a DCN guard reading `self.ref.x` across a link waits with them |

## 3. A second simulation nucleus

### 3.1 What is Petri-specific, what is nucleus-neutral

**Read**, on HEAD. H3 is falsified for the run state, the codecs and the watches, and holds for the compiler, the
step and part of the panel's text.

| Piece | Where | Verdict |
|---|---|---|
| σ | `model/simulation/netTypes.ts:107-117` `SimState { marking; attrs; presentation; derived? }` | neutral except `marking`; `attrs` is «Element id (the model id for a global) → attribute → value» (`:109`) |
| STC | `netTypes.ts:138-190` `NetStc`, «The STC of the Petri core», `shape: 'control-flow' \| 'petri'` | Petri |
| Compiled form | `netTypes.ts:252` `CompiledNet` (places, transitions with preset/postset arcs `:199-240`) | Petri |
| Candidates | `netStep.ts:192-221`: `presetEnabled`, inhibitors, `else`, `unsafe` | Petri |
| Termination | `netStep.ts:77-95` `terminated`: activity final and final places over the marking | Petri |
| Step and halts | `netStep.ts:274` `step`; `HaltReason` `netTypes.ts:354-364` | `unsafe` is Petri; `domain`, `double-assignment`, `action-defect`, `undeclared`, `derived`, `read-only` are neutral |
| Outcome and status | `netTypes.ts:370-377`: `fired \| discard \| quiescence \| halted \| inadmissible`; `NetRunStatus = 'Not started' \| 'Running' \| 'Terminated' \| 'Deadlock' \| 'Halted'` | neutral (the five run states) |
| Oracles | `netTypes.ts:289-318` `GuardOracle(site, event, state)`, `ActionOracle(site, event, state)` returning `SimAssignment { element; attr; value }` | neutral in shape; `ActionSite` names Petri sites |
| Run record | `components/editor-v2/sim/simRunState.ts:81-117` `SimRun { net: CompiledNet; config: NetConfiguration; ... trace?; keptConfigs?; snapshot? }` | coupled through `net` |
| Trace step | `simRunState.ts:70` `SimTraceStep { event; selector; kind; ... }` | neutral |
| Policy: «Choices: Ask \| Random», k | `simRunState.ts:123-126` `SimPolicy { choices; k }` | neutral |
| Step back, slider | `simRunState.ts:320-335` `configAt` replays with `step(run.net, ...)` (`:331`); `simStepBack` `:406`, `simSetView` `:431` | neutral except the one call at `:331` |
| Scenarios | `model/simulation/scenarioCodec.ts:5-13`: per step `event`, `selector`, `kind`, `inputs` (element id, attribute name, value), `expect` a JjEL text | neutral, no Petri field |
| Watches | `model/simulation/watchEvaluator.ts:29-31` `evaluateWatch(watch, snapshot, net: Pick<CompiledNet, 'modelId' \| 'places'>, state: SimState)` | neutral: a nucleus with no places passes an empty set |
| I/O board and Clock | `simBoardClock.ts`; R-SIM-136 `clockEnables` through `panelInputs(runStatus(run), structuralInputs(...))`, `netStep.ts:368` `structuralInputs(net, state)` | the device side is neutral; the «enabled» test is Petri |
| Panel text | `simBridge.ts:947` `candidateLabel(net, ...)`, `:973` `markingLine`, `:1095` `markingChips`, `:1485` `lastStepText` | Petri (names a transition, a marking) |
| Reset | `simBridge.ts:724-754` `startRun`: `netStcFromRoles(bag)` (`:732`), `compileNet(...)` (`:743`) | the single entry: Petri only |

### 3.2 Where a second nucleus registers

**Read.** The profile does not choose the engine, by decision: R-SIM-47 «Motore ed esportatore leggono i ruoli
risolti, mai il profilo». `ProfileShape` is `'controlFlow' | 'petri'` (`simProfiles.ts:19`) and the role catalog is
one list (`roleCatalog.ts:24-31`, groups `general | controlFlow | petri | events | data | output`, `:35`). So the
DCN profile of spec §8 is a new system profile row plus a new role group `dcn` with the roles of spec §8 (Viewpoint,
dynamic classifier, Invariant, Operation, Redefinition, Monitor, Instance-of), and the nucleus is chosen at
`startRun` by which role set is bound: `netStcFromRoles(bag)` today returns `null` without the Petri roles
(`simBridge.ts:733` «The simulation roles are incomplete.»); a `dcnStcFromRoles(bag)` beside it, tried first or
second by a fixed rule, picks the nucleus. That keeps R-SIM-47 (no engine reads the profile id) and needs a new
`ProfileShape` value only if the profile editor's closure of roles per shape (`simProfiles.ts:72-95`,
`OTHER_SHAPE_GROUP`, `closureRoles`) must hide the Petri groups under DCN, which it must for the dialog to make sense.

The coupling to cut is the run record: `SimRun.net: CompiledNet` and the replay call at `simRunState.ts:331`. The
smallest cut is a nucleus field on the run, `{ initial; step(cfg, selector, oracles); structuralInputs(state);
terminated(state) }`, set by `startRun`, with the Petri nucleus as the default implementation over `net`; `configAt`,
`simStepBack`, the clock's enabling test and Play call the field. Every reader of `run.net` that is Petri text
(`candidateLabel`, `markingLine`, `markingChips`, `lastStepText`, `defectsLine`) needs a DCN twin or a nucleus
method; there are about a dozen such readers in `simBridge.ts` (window `:908-1184`, by the export list).

**Measured as a reading, not run:** a guarded command is a Petri transition with an empty preset and postset.
With no places, `presetEnabled` is vacuously true, `terminated` is false (`netStep.ts:85` `if (final === null)
return false;`), the guard decides, and the actions assign `attrs` with the `domain` and `double-assignment` halts
of the core. An invocation is the event of R-SIM-16 and a tick is a clock-bound event (R-SIM-122). So the DCN
compiler could emit a `CompiledNet` with no places and run on the existing `step`, and every piece of the table
above would work unchanged. R-DCN-8 says the nucleus is «next to the Petri nucleus and not inside it»; whether a
separate compiler emitting the shared compiled form is «inside» is Q3, not reopened here.

### 3.3 σ as slot values in the snapshot, step back and scenario codecs

**Read.** It fits as it is. A slot value is `attrs.get(instanceId).get(featureKey)`, `marking` is the empty map; the
kept configurations hold `NetConfiguration` (`simRunState.ts:111` `keptConfigs?: readonly NetConfiguration[]`),
which is σ plus the event; a scenario step names inputs by (element id, attribute name) (`scenarioCodec.ts:12-13`).
Two encodings to fix, both strings in the existing types: the event of an invocation `op(o, Op, args)` (a
`(instance, operation)` pair, while `SimTraceStep.event` is an event instance id) and the selector of a contribution
(a `(viewpoint, operation or monitor)` pair under Interleave). Neither needs a codec change if the nucleus owns an
id per pair; both change the scenario text if the ids are composite strings, so they are decided before the first
scenario is saved (Q6).

Arguments: spec §6 «Parameters are event attributes (`event.a`, R-SIM-144)». R-SIM-144 reads the attributes of an
event **instance** frozen in M; R-SIM-16 «gli eventi con parametri liberi sono fuori scope». An invocation with
free arguments is therefore either an event instance per argument tuple (one button each) or an input of R-SIM-88
asked at the press (`netTypes.ts:96-104` `InputRead`). Q7.

### 3.4 How actions assign today, and what a slot write needs

**Read.** An action assigns σ, never M, and only through the state operator:

- `jjel/types/ast.ts:395-403`: «An action: `<target> := <expression>` ... the target is a state access whose
  attribute is never `marked` or `tokens`», `target: StateAccessExpr;`, i.e. `expr.[attr]` (`ast.ts:318-327`).
- `jjel/lexer/lexer.ts:117` refuses `:=` outside action mode: «An action is written
  '<target>.[attribute] := <expression>'».
- `model/simulation/actionEvaluator.ts:18-26`: the oracle returns assignments; «The core applies them together and
  halts on a double assignment, an undeclared target or a value outside its domain (`netStep.ts`)». An assignable
  target is a declared state attribute: `StateAttributeDecl` (`netTypes.ts:48-61`) whose `metaclass` is «DClass id:
  every instance that is a kind of it carries the attribute».
- Reads of model slots go to the frozen M: `model/simulation/guardContext.ts:4-9` «`freezeSnapshot` runs once per
  run over the model M ... deep-frozen», with `self` a pool handle from `handleById` (`guardContext.ts:52`).

Two gaps for DCN, the second not anticipated by the prompt:

1. **Slot writes.** `self.battery := e` does not parse (the target is not a state access). Either DCN writes
   `self.[battery]` and the nucleus declares one state attribute per slot from the R-OI closure, keyed by the
   instance and the feature rather than by an M2 metaclass (the declarations have no M1-classifier key today), or
   the action grammar admits a member target in a DCN mode. The first needs no grammar change; the second reads as
   the chapter writes it.
2. **Slot reads on R-OI do not resolve as `self.battery` at all.** On the R-OI level an instance is an
   `InstanceSpecification` whose linguistic features are `classifier` and `slots`
   (`scripts/probe/uml-class-object-fixture.ts:98-99`); the value of `battery` is the `value` of the literal held by
   the `Slot` whose `definingFeature` is the `battery` property. The JjEL pool handle exposes the linguistic
   features, so `self.battery` is an absent identifier, and the R-OI front has no ontological JjEL accessor (R-OI-11:
   «a JjEL `closure` operator is its own lane, not part of this front»). Whatever the write form, the DCN nucleus
   must bind `self` (and every instance reachable by name) to a handle built from σ, one member per slot of the
   closure, at each evaluation; the frozen pool cannot serve, since σ changes per step and the snapshot refuses
   caller-bound functions (`guardContext.ts:31-32`). Watches over slots (coherence φ, spec §7) need the same handle
   in `evaluateOutput`.

Recommendation (Q4): reads `self.battery` through σ-backed handles of the DCN nucleus, writes `self.battery := e`
in a DCN action mode, decided in the languages concern together with `self.in(V::D)`, in slice 3.

## 4. `self.in(V::D)`

**Read**, on HEAD. No implementation.

- **`::` has no meaning in JjEL** (H4 falsified). `frontend/src/jjel/lexer/lexer.ts:111-121`: a `:` not followed by
  `=` is `JjelTokenType.COLON`, so `V::D` lexes as `IDENTIFIER COLON COLON IDENTIFIER` and fails in the argument
  list. Search: `grep -rn "'::'\|COLON_COLON\|DOUBLE_COLON\|DoubleColon"` over `jjel jjscript jjtl` without tests
  returns hits in `jjscript/parser/lexer.ts:111` (`this.createToken('OPERATOR', '::')`) and
  `jjscript/parser/parser.ts:1471` (`enumLiteral`) and none under `jjel/`: the JjScript hits are the positive
  control of the same command. The only `::` near JjEL is nuXmv output: `model/simulation/bvToSmv.ts:180` prints
  word concatenation as ``(${parts.map(toUnsigned).join(' :: ')})``, text emitted, never parsed.
- **`self.in` already parses as a member.** `in` is a keyword (`jjel/types/tokens.ts:121` `'in': JjelTokenType.IN,`,
  used by `forall x in ...`, `parser.ts:861`), but a member name after `.` admits every non-literal keyword:
  `parser.ts:66-69` `MEMBER_NAME_TYPES = ... IDENTIFIER, ...Object.values(JJEL_KEYWORDS).filter(...)`, consumed at
  `:432` by `consumeMemberName`. So `self.in(x)` is a method call today; only the `V::D` argument is new syntax.
- **The precedent to follow is the state operator.** `.[x]` is a dedicated AST node (`jjel/types/ast.ts:318-327`
  `StateAccessExpr`), evaluated through an accessor the caller puts on the context
  (`jjel/evaluator/context.ts:270` `export interface JjelStateAccess`, `:378` `stateAccess?: JjelStateAccess;`,
  inherited by child scopes `:475`; dispatched at `evaluator.ts:357` `case 'StateAccess':`). The marking is read the
  same way (`X.[marked]`, `jjel/stateReserved.ts:22` `readOnlyAttributes: ['marked', 'tokens']`). The analogue: a
  `ClassificationTest { object; viewpoint; dynamicClass }` node, produced by the parser for a member call `in` whose
  single argument is a qualified name, and a `classification?` accessor on `EvaluationContext` that the DCN nucleus
  binds (σ-backed, §3.4) and that is absent elsewhere.
- **Placement, file by file**: `jjel/lexer/lexer.ts` (one token `::`, the `:` case), `jjel/types/tokens.ts` (the
  token type), `jjel/types/ast.ts` (the node), `jjel/parser/parser.ts` (the call form at the member-call site near
  `:432`), `jjel/evaluator/evaluator.ts` and `context.ts` (the dispatch and the accessor); `model/simulation/guardContext.ts`
  only to thread the accessor into `buildGuardContext`; `model/jjelTriState.ts` unchanged: an expression evaluated
  without the accessor throws, which is the existing `exception` entrance (`jjelTriState.ts:22`
  `'exception' | 'non-boolean' | 'absent-identifier'`). Six to seven files: two lanes (lexer, parser and AST;
  evaluator and context) under Rule 19.
- **What `docs/spec/concern_languages.md` must say first.** Its identity rules (`:51-56`) say «Non OCL-compatible
  ... no `oclIsTypeOf`»; `self.in(V::D)` is close to OCL's `oclIsInState` and must be justified against that line.
  It must also fix: (a) `::` is a JjEL token with one use, the qualified name `V::D` as the argument of `in`, not
  JjScript's `Enum::Lit` (`jjscript/parser/parser.ts:1471`); (b) what `self.in` means outside a DCN run
  (validation, the Console): absent accessor and an `exception` verdict, or a derivation from M's slot values
  through the invariants (R-DCN-2 makes the classification derived, so it is computable on M too); (c) W1 (spec §5)
  is the only access control on dormant slots, so `self.in` is a test, not a guard on reads (R-DCN-3); (d) whether
  `in` with a non-qualified argument stays a plain method call; and the slot syntax of §3.4 (reads `self.battery`,
  writes `self.battery := e` in a DCN action mode), since it changes the action grammar of R-SIM-40.

## 5. Exporter

**Read**, on HEAD. There is no `.smv` exporter to extend.

- `frontend/src/model/simulation/bvToSmv.ts:13-14`: «There is no `.smv` exporter: this is what its lane consumes.»
  It translates a bit-vector JjEL expression into nuXmv text with its type (`:244` `export function bvToSmv(e:
  JjelExpression, leaves: SmvLeaves): SmvText`), booleans and integer literals included (`:249-250`). Reusable for
  spec §9 as the expression printer of `DEFINE`, `INVARSPEC`, guards and `next(...)` right-hand sides, with the
  `leaves` callback mapping a slot read of instance `o` to its `VAR` name. Enumeration literals and ranges beyond
  its switch are for the exporter lane to measure.
- **The `.smv` preview of the Simulation roles modal does not exist.** `grep -c smv
  frontend/src/components/editor-v2/sim/SimRolesModal.tsx` is 0, while the same search finds `bvToSmv.ts` (positive
  control). It was dropped on 2026-10-03: `docs/decisions.md:2563` «the `.smv` Export preview of R-SIM-103 is
  dropped».
- **A template generator for `.smv` exists in codegen**: `frontend/src/codegen/engine/__tests__/fixtures/generator-smv.json`
  (`"generator": "smv"`, metamodel `SyncRTL`, JjEL templates), a test fixture of the code generator. A DCN `.smv`
  could be a codegen generator over the DCN metamodel instead of TypeScript. Q10.
- **W5 by enumeration cannot reuse `boundExploration.ts` as it is** (H5 falsified). `boundExploration.ts:5-8`: a
  breadth-first search «over the firing rule of the step with guards and triggers left out»; it reads markings only
  (`:26-28` «reads only the compiled net ... no JjEL»). W5 is a property of the invariants over the product of the
  finite domains they read, with no step and no reachability: per tuple, count the invariants of the viewpoint that
  hold (≥ 2 on a non-overlapping viewpoint, 0 on a complete one). What carries over is the shape: a pure module, a
  cap (`BOUND_EXPLORATION_CAP = 2000`, `:36`), a closed / cap verdict. The evaluation is the invariant's compiled
  guard over a σ built per tuple, i.e. the DCN nucleus's oracle; ranges like the drone's distance and speed make
  the product large, so «not decided» at the cap, as R-DCN-6 does for `Integer`.

## 6. Lane plan

Slices 2 to 6 of spec §10, each lane at five files or fewer (Rule 19). Paths are relative to `frontend/src/` unless
they start with `frontend/` or `docs/`; a path marked *new* does not exist. Columns: **Vis** a visual verification is
owed (P8); **CZ** the lane touches a §3.1 file, and **LIR** whether a Layer Impact Report is owed (§3.2 trigger, or
the R-OI-12 precedent of opening `problems/` lanes with one); **R-OI** whether the lane needs `oi-s2u`/`oi-s3b` on
the trunk, i.e. after the 3.2.0 tag (R-OI-12). Neither branch is an ancestor of `master` or of `dcn` today
(**measured**, `git merge-base --is-ancestor`, exit 1 on all four pairs); `master` is an ancestor of `dcn`.

| Lane | Slice | Content | Files | Vis | CZ / LIR | R-OI |
|---|---|---|---|---|---|---|
| L2.1 | 2 | R-DCN-3 amendment: binding role `featureSources`, `dormantOwner` on `FeatureClosure` (§1.3, §1.4) | `model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`, `__tests__/bindingReader.test.ts`, `__tests__/bindingCodec.test.ts` | no | no / no | no |
| L2.2 | 2 | DCN metamodel of the chapter (Fig. 1, Fig. 3) as M2 on the UML fixture, drone M2, `ontoBindings` record with sources, `bindingCheck` run on it | `frontend/scripts/probe/dcn-drone-fixture.ts` *new* (Q11) | no | no / no | no |
| L2.3 | 2 | Roles group `dcn` (Viewpoint, dynamic classifier, Invariant, Operation, Redefinition, Monitor, Instance-of), system profile «Dynamic classification», `ProfileShape` value, `dcnStcFromRoles` | `model/simulation/roleCatalog.ts`, `simProfiles.ts`, `model/simulation/dcn/dcnRoles.ts` *new*, its test *new*, `components/editor-v2/sim/SimRolesModal.tsx` (only if the shape closure needs it) | yes (roles dialog) | no / no | no |
| L3.1 | 3 | Languages concern first: `::`, `self.in(V::D)` against «no `oclIsTypeOf`», meaning outside a run, slot reads and writes (§4 items a..d, Q4) | `docs/spec/concern_languages.md` | no | no / no | no |
| L3.2 | 3 | Parse: token `::`, node `ClassificationTest`, member call `in` with a qualified argument | `jjel/lexer/lexer.ts`, `jjel/types/tokens.ts`, `jjel/types/ast.ts`, `jjel/parser/parser.ts`, one test | no | no / no | no |
| L2.4 | 2 | W1..W4 over the resolved `dcn` roles, plus the range-bound (Q5), blank-invariant and `isSingleton` checks (Q8); one problem kind | `model/dcn/dcnWellFormedness.ts` *new*, its test *new*, `components/editor-v2/problems/dcnToProblems.ts` *new*, `problems/DcnProblemSync.tsx` *new*, `problems/registry.ts` (one `NodeProblemKind` member, the way `simulation` and `containment` were added, `registry.ts:55`) | yes (node problems) | yes / yes (R-OI-12 precedent) | no |
| L3.3 | 3 | Evaluate: `classification?` accessor on `EvaluationContext`, dispatch, threaded into `buildGuardContext` | `jjel/evaluator/evaluator.ts`, `jjel/evaluator/context.ts`, `model/simulation/guardContext.ts`, one test | no | no / no | no |
| L3.4 | 3 | Slot writes `self.battery := e` in a DCN action mode, only if Q4 is taken as recommended | `jjel/lexer/lexer.ts`, `jjel/types/ast.ts`, `jjel/parser/parser.ts`, `model/simulation/actionEvaluator.ts`, one test | no | no / no | no |
| L4.1 | 4 | Run-state cut: a nucleus field on `SimRun`, the Petri nucleus as its default over `net`; `configAt`, step back, slider, clock enabling and Play call the field; behaviour-preserving | `components/editor-v2/sim/simRunState.ts`, `simBridge.ts` (`startRun`), `simBoardClock.ts`, one test | yes (Petri smoke: turnstile, producer-consumer, step back, slider, Clock) | no / no | no |
| L4.2 | 4 | DCN compile from resolved roles, M and the closure: per Q3 a placeless `CompiledNet` (one transition per invocation and per contribution), σ seeded from the slots, `range` σ domains from the bounds | `model/simulation/dcn/dcnCompile.ts` *new*, its test *new*, `model/simulation/netTypes.ts` (optional instance key on `StateAttributeDecl`, Rule 11) | no | no / no | no (synthetic view in vitest) |
| L4.3 | 4 | σ-backed handles for `self` and named instances, the classification accessor bound, watches reading the same handles | `model/simulation/dcn/dcnHandles.ts` *new*, `model/simulation/guardContext.ts`, `model/simulation/boardOutputs.ts` (`evaluateOutput`), one test | no | no / no | no |
| L4.4 | 4 | Interleave and Sync, redefinition expansion, ticks running monitors, classification after each step, the halts of spec §6 in order (range, completeness, exclusivity), coherence as a watch hit | `model/simulation/dcn/dcnStep.ts` *new*, its test *new*, `model/simulation/netTypes.ts` (`HaltReason` members, Rule 11: ask in the prompt) | no | no / no | no |
| L2.5 | 2 | Drone object diagram: instances through S2 synthesis, dormant slots created and not orphan, no `instantiation` problem on them (the acceptance of L2.1 on the real surfaces) | `frontend/scripts/probe/dcn-drone-fixture.ts` | no (probe measures) | no / no | yes |
| L4.5 | 4 | Wiring: `startRun` picks the nucleus by the bound role set (R-SIM-47); DCN twins of `candidateLabel`, `lastStepText`, `markingLine` (a classification line), `defectsLine` | `components/editor-v2/sim/simBridge.ts`, `model/simulation/dcn/dcnPanelText.ts` *new*, one test, `sim/SimulationPanel.tsx` if a row is added | yes (a drone run) | no / no | yes (end to end) |
| L5.1 | 5 | Canvas during a run: one compartment per viewpoint, active class highlighted, monitor icon, dormant slots greyed (`dormantOwner`) | `components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (S3b rows live there, `oi-s3b`), `sim/SimNodeRunState.tsx`, `sim/simCanvasState.ts`, one SCSS file | yes | yes (`viewpoint/ir/`, §2.5 hot area) / yes | yes |
| L5.2 | 5 | «Save snapshot as object diagram»: materializes σ as new instances, one undo step (S2u) | `components/editor-v2/hooks/instantiate.ts` (`oi-s2u`), `sim/simBridge.ts`, `sim/SimulationPanel.tsx`, one test | yes | yes / yes (§3.2: a creator in a D-layer write path; Rule 12) | yes (S2u after 3.2.0) |
| L5.3 | 5 | Coherence watches: φ as a state invariant, ψ as a counter automaton per instance (R-SIM-137) | `model/simulation/watchCodec.ts`, `watchEvaluator.ts`, `components/editor-v2/sim/SimWatchesModal.tsx`, one test | yes | no / no | no for the pure part, yes end to end |
| L5.4 | 5 | γ batch: N runs under Random, the fraction of admissible traces in the panel | `components/editor-v2/sim/simBridge.ts`, `sim/SimulationPanel.tsx`, one test | yes | no / no | yes (end to end) |
| L6.1 | 6 | W5 by enumeration over the product of finite domains, cap and «not decided» (§5) | `model/dcn/dcnExhaustive.ts` *new*, its test *new*, `components/editor-v2/problems/dcnToProblems.ts` | yes (node problems) | yes / yes | no |
| L6.2 | 6 | Exporter of spec §9 over `bvToSmv` leaves (Q10); `Integer` attribute as a problem (R-DCN-6) | `model/simulation/dcn/dcnToSmv.ts` *new*, its test *new*, `model/simulation/bvToSmv.ts` (enumeration literals if missing), the export menu entry (file to discover) | yes (menu) | no / no | no for the pure part |

Order of execution is the table's order, not the slice numbers: L3.1 and L3.2 come before L2.4 because W1's guard
`self.in(D')` and W2's dependency edge must parse (Q13). L4.1 is independent of DCN and can land at any point; it
makes Q3 reversible, since both answers plug into the same field. Everything up to L4.4 runs on the trunk with no
R-OI branch; L2.5, L4.5, L5.1, L5.2, L5.4 and the end-to-end probes of L5.3 and L6.2 wait for the R-OI merge after
the 3.2.0 tag. Twenty lanes; the file lists are the expected ones, and each lane's discovery confirms them (P3).

Two Rule 11 points are carried in the lanes' prompts, not decided here: the optional instance key on
`StateAttributeDecl` (L4.2) is an optional property and admitted; new `HaltReason` members (L4.4) and a member
target on the action node (L3.4) widen exported unions and need the prompt to authorize them.
