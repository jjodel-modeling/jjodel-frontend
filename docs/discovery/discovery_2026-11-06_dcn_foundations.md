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
