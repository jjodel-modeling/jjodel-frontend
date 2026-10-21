# Discovery 2026-10-21 — hardware demonstrator S-C0: the two JjTL prerequisites of route B

- Prompt-ID: P-2026-10-21-1037 (`docs/prompts/claude_2026-10-21_1037_prompt_hw_sc0_jjtl_prerequisites.md`)
- Session: 7d51638a-79a0-43ad-9165-5ec22903bb7e (§0-§2, §4); continued after the context ceiling by P-2026-10-21-1220,
  session f624758c-c17d-4f0f-831f-00f887d8b084 (§3, §5, closure)
- Tree: `~/jjodel-w-hwjjtl`, branch `hw-jjtl`, HEAD at start `e2c6caa67`; F4 fix committed as `c3f5cb15e`
- Executor model: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- Plan: `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` §4.3, §4.5, §8 D1.2, §10.1 S-C0

This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the files.

## 0. Hypotheses under test

1. **H1** — F4 still holds on HEAD: a binding that reads an attribute through a single-valued source reference
   (`src.name`, `owner.name`) reads null. **Holds** (§1, measured before the fix: 6 of 7 tests red).
2. **H2** — The fix is local to the executor: binding the reference value so that member access reaches the source
   object, without changing how the same value resolves source to target. **Holds** (§2, measured after the fix).
3. **H3** — The `navResolveRev` variant (`resolve(src, PortId).name`, Wire rule first) turns green with the F4 fix.
   **Falsified as written**: it still reads null; it reads a target that pass 2 has not filled yet (§2.3). Read
   through the source instead (`src.name`), the same scenario is green in either rule order.
4. **H4** — The write-back of a containment feature set by `resolve` (`ProjectEditor.tsx:2223`,
   `setValueAtPosition(ri, id, { isPtr: true })`) reparents a root object created by another rule. **Holds**
   (§3, measured on three levels: the fathers move into the slots, `roots` drops to the container).

## 1. Files read

- `frontend/src/jjtl/executor/executor.ts` (windows: 150-170, 805-850, 2196-2300, 2341-2440, 2584-2700, 3282-3315)
- `frontend/src/jjel/evaluator/evaluator.ts` (393-398, 452-600, `isEqual`)
- `frontend/src/jjel/evaluator/context.ts` (41-70, 390-450, 526-562)
- `frontend/src/jjel/evaluator/modelContext.ts` (`extractAttributeValues`)
- `frontend/src/components/project/ProjectEditor.tsx` (1360-1380, 1560-1572, 1755-1790, 2166-2231)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (7913-8002, `get_setValueAtPosition`; 5718-5773, `get_objects`,
  `get_roots`)
- `frontend/src/jjtl/executor/__tests__/contained-sources.test.ts` (1-60, the harness)
- `frontend/scripts/probe/new-model-instantiate.ts` (1-185, 410-434, the in-app harness), `frontend/scripts/lane-run.mjs` (1712-1786)

## 2. F4 — member access through a source `{ __ref }`

### 2.1 Cause [read]

- ProjectEditor wraps every pointer value: `ProjectEditor.tsx:1372` «const wrapIfRef = (val: any): any => {» …
  «return { __ref: val };».
- `executor.ts` `createInstanceContext` bound each feature of the source instance as is; only `parent` was
  dereferenced: «key === 'parent' ? this.derefSourceRef(value) : value» (HEAD `e2c6caa67`, now `executor.ts:2325`).
- JjEL member access: `evaluator.ts:596` «if (property in obj) {» then «const value = obj[property] ?? null;». On
  `{ __ref: 'P2' }`, `name` is not `in` the object: null, and the diagnostic is the only trace.

### 2.2 Reproduction [measured]

New test `frontend/src/jjtl/executor/__tests__/source-ref-member-access.test.ts`, run on `e2c6caa67` with the test
only (`.agent-logs/f4-before-20261021-114258.log`): **6 failed, 1 passed**. Verbatim: `nav` «expected [ null ] to
deeply equal [ 'y' ]»; the read through the source in reverse order «expected [ ' -> ' ] to deeply equal
[ 'y -> d' ]»; `flat` «expected '_' to be 'y_d'». The one green test was the implicit resolution `port := tgt`,
which the fix must not change.

### 2.3 Fix and measurement [measured, `c3f5cb15e`]

- `executor.ts:846` `readThroughSourceRef`: a Proxy over the wrapper. Own keys (`__ref`) come from the wrapper, so
  `resolveValue` (`'__ref' in value`), JjEL `isEqual` (`Object.keys`) and `fromJjelValue` (`Object.entries`) see
  the value they saw before. Other string keys are read (`get`) and tested (`has`) on the source object, found on
  first use by `derefSourceRef`, and read through again. Arrays element-wise. Bound at `executor.ts:2325`.
- Test file 7/7 green; mutation bench, each mutation alone: no wrap 6 killed; no recursive read killed by the chain
  test; arrays unchanged killed by the multi-valued test; own keys read from the source killed by the fail-open and
  flat tests; no `has` trap 6 killed.
- The plan's scratch probe (`.vite-cache/hw-probe/jjtl-refs.probe.test.ts`, gitignored, copied from `hw-demo`),
  rerun on `c3f5cb15e` (`.agent-logs/jjtl-probe-after-*.log`): `flat` `expression` `'y_d'`, no error; `nav`
  `'y'` and `PortId.name` `'alu_a', 'alu_y', 'acc_d'`; `navResolve` `'y'`; **`navResolveRev` still `null`**;
  `navForall`, `navForall2` still «Expected expression» (parse).
- `navResolveRev` is not F4: `resolve(src, PortId)` returns the right target, but pass 2 fills targets in rule
  order, and the Wire rule reads `PortId.name` before the Port rule writes it. With the fix the name is read from
  the source and the order no longer matters (test «does not depend on rule order»).

### 2.4 What the fix does not cover [measured / read]

- **A reference read through a `forall` item** [measured, scratch variant `forallChain`]: `-> items { forall p in
  ports -> PortDeclaration { direction := p.name + "@" + p.owner.name } }` gives `"a@"`, `"y@"`, `"d@"`. The item is
  fully dereferenced (`derefSourceRef`), but its own reference features stay bare wrappers.
- **`self.src.name`, `source.src.name`** [read]: `self`, `source`, `it` stay bound to the raw instance
  (`executor.ts` `createInstanceContext`), so a path through them reads the bare wrapper. Not wrapped on purpose:
  their identity is used by `resolve(self, T)`.
- **A dotted `sourceAttribute`** [read]: `contextToRecord` (`executor.ts:3306` «record[key] =
  shallowToJjelValue(value);») rebuilds the bindings unwrapped for `evaluatePropertyPath`. The dotted source form
  `a.name -> x` does not parse today (`frontend/src/jjtl/CLAUDE.md`, Known limitations), so this path is not reached
  by a binding written with `:=`.
- The seven executor test files red at import (`window is not defined`, CLAUDE.md §17), `executor-llayer` and
  `executor-bridge` among them, do not run: the fix is not checked against them.

## 3. Containment write-back (§4.3)

**H4 holds** [measured, two runs, P-2026-10-21-1220]: `setValueAtPosition(ri, id, { isPtr: true })` on a
containment feature reparents an object created at the root, three levels deep, and the object leaves the model's
roots.

- Probe `frontend/scripts/probe/hw-containment-writeback.ts` (scratch, not committed), run through `lane-run probe
  ... --port 3093` on `d9f5d1ac1` (F4 fix included; the write-back does not touch the executor). It replays the
  write-back's two calls on the real app, not the JjTL UI: four `DObject.new(cls, model, DModel, name, true)` in one
  TRANSACTION named as `ProjectEditor.tsx:1775`'s, then STEP 8b's write verbatim (`ProjectEditor.tsx:2223`).
  Metamodel: `Module.items -> PortDeclaration`, `PortDeclaration.ports -> PortId`, both set to `composition` true
  and `upperBound` -1; `composition` read back true on both (MEAS `metamodel`), `upperBound` not read back.
- Log `~/.jjodel-lanes/P-2026-10-21-1220/probe-hw-containment-writeback.log` (run 2), `.run1.log`, JSON beside it.
  The run of P-2026-10-21-1037 measured nothing on `father` and slots: its snapshot filtered on `d.model`, which
  matched no object; the filter now selects the four objects by name.

| | after create | after the three writes (2.5 s) |
|---|---|---|
| writes | | `alu.items[0]=pd_a`, `alu.items[1]=pd_y`, `pd_a.ports[0]=pid_a`: each `{"success":true}` |
| D `father` | all four `DModel:model_1` | `alu` model; `pd_a`, `pd_y` `DValue:alu.items`; `pid_a` `DValue:pd_a.ports` |
| slots (D `values`) | none | `alu.items=[pd_a,pd_y]`, `pd_a.ports=[pid_a]` |
| L `father` | all four `DModel` | the same as D (`DValue:items`, `DValue:ports`) |
| `lModel.roots` | `alu, pd_a, pd_y, pid_a` | **`alu`** |
| `m.objects`, `lModel.objects` | the four | the four, unchanged |

- `objects` staying at four is by design, not a leftover: «`objects` lists every instance of the model, the nested
  ones too (R-NEST-1): a root is an instance whose father is a model» (`LModelElement.tsx:5765-5769`, `get_roots`
  filters `objects` on `father.className === DModel`). The reparenting itself is `LModelElement.tsx:7972-7974`
  («SetFieldAction.new(val as Pointer<DObject>, "father", c.data.id, undefined, true)»); the detach from an old
  container runs only when the old father is a `DValue` (`:7961-7963`), so a root object needs none.
- Page errors: one console error, `init_dash`, in both runs; no `pageerror`.
- No `ProjectEditor.tsx` fix is needed for this path. Route B can create every `VerilogAst` object with a flat rule
  and set its containment features with `resolve(...)` (plan §4.3).

Not measured here: the JjTL UI Execute end to end (STEP 8b's own ordering and timing, `sourceIdToObjectName`, §4),
and the canvas rendering of the nested objects (screenshot `hw-containment-writeback.png` beside the log, not
examined).

## 4. Dependencies and risks

- S-C1/S-C2 (route B) can write `src.name`, `src.owner.name`, `ports.first.name` in a rule body; not inside a
  `forall` item (§2.4) and not through `self.` (§2.4).
- `ProjectEditor.tsx:1779` keys `sourceIdToObjectName` by `__sourceId` alone [read, plan §4.2]: route B's
  `Port -> PortDeclaration` and `Port -> PortId` give two targets per source `Port`, and STEP 8b
  (`ProjectEditor.tsx:2196-2197`) resolves a reference target by that map. Not measured here (it needs the JjTL UI
  Execute); it is the next thing to measure before route B relies on two rules per source type.

## 5. Open questions

Three findings outside F4, recorded here and not fixed in this slice.

1. **Pass-2 rule order for `resolve(x, T).attr`** (§2.3, measured): a binding that reads an attribute of a target
   created by a later rule reads null. Fix pass 2 in the executor, or document `src.attr` as the form to use?
   Recommended: route B (S-C1) writes `src.attr`, which is green in either rule order; a JjTL ticket for pass 2
   (fill every target's attributes before a binding reads across targets), after the demo minimum.
2. **A reference read through a `forall` item** (`p.owner.name` in a `forall` body, §2.4, measured): reads empty.
   Extend the executor, or have route B avoid it? Recommended: route B avoids it, since it uses flat rules anyway
   (plan §4.3); the fix is the same `readThroughSourceRef` applied to the item's own features, a JjTL lane of its own
   with its executed test, after the demo minimum.
3. **`self.src.name`, `source.src.name`** (§2.4, read, not run): read the bare wrapper. Wrap `self`, or document
   the form? Recommended: document `src.name` (the bound feature) as the form in `frontend/src/jjtl/CLAUDE.md` Known
   limitations, and do not wrap `self`/`source`/`it`, whose identity `resolve(self, T)` relies on; measure the read
   with an executed test before writing the note.
