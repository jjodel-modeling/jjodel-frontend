# Discovery 2026-11-08 — a DCN run cannot freeze its model: the L proxy at `superTypes[n].isAbstract`

- Prompt-ID: P-2026-11-08-0345 (`docs/prompts/claude_2026-11-08_0345_prompt_dcn_l45e_freeze.md`)
- Session: 00d482da-ecb6-488e-94d5-f84b581e7eff
- Tree: `~/jjodel-w-dcn-l45`, branch `dcn-l45`, HEAD `53606f71c` (the probe commit on top of `d2e80f600`)
- Executor: claude-opus-5-5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## Objective

Find which value of the DCN evaluation context holds a live L proxy, so that Reset of the drone run stops refusing with
«The model cannot be frozen: an L proxy at globals.InstanceValue_3 ... .association.instanceof.superTypes.0.isAbstract»
(P-2026-11-08-0329), and fix it inside the DCN branch.

## Hypotheses under test

1. **H1** — the DCN branch builds its globals differently from the Petri one (a DCN reader puts L proxies in). **Falsified** (read).
2. **H2** — the proxy comes from `dcnReadView`, `dcnInputOf` or the DCN handles. **Falsified** (read): none of them feeds `freezeSnapshot`.
3. **H3** — the proxy comes from the shared context builder `buildEvalContext`, through a flag read on a class shell. **Holds** (read; the mechanism is read, not measured in a run of this phase).

## The path

The full message, from `~/.jjodel-lanes/P-2026-11-08-0329/probe-dcn-drone-run.log` (measured by the 0329 run, on the L4.5 tree before this prompt; not re-run in this phase):

```
an L proxy at globals.InstanceValue_3.parent.parent.classifier.parent.packagedElements.12.ownedEnds.0.instanceof
.ownedSensors.type.instanceof.HumiditySensor.generalizations.0.instanceof.RainSensor_Sensor.parent.ownedOperations.1
.instanceof.rampDown.parent.parent.parent.ownedAttributes.5.association.instanceof.superTypes.0.isAbstract
```

The walk is a LIFO worklist (`frontend/src/model/simulation/guardContext.ts:103-120`), so the path is the first route
it took, not the shortest one. What matters is the last hop: `<class shell>.superTypes.0.isAbstract`, a field of a
class shell (the `instanceof` of an instance is its class shell).

## Findings

1. **Both paths build the same globals** (read). Petri, `frontend/src/components/editor-v2/sim/simBridge.ts:756`:
   `const globals = build(evalContextFor(lookup, modelId, projectId), { extentModelId: modelId });`
   DCN, `simBridge.ts:868`, the same line verbatim; both freeze with
   `snapshot = freezeSnapshot(globals, { id: modelId, name: String(lookup[modelId]?.name ?? '') });` (`:759`, `:871`).
   `dcnInputOf`, `compileDcn`, `readDcnModel` and `readDcnStep` (`:863-876`) do not touch `globals`. So H1 and H2 are
   falsified: (b) of the prompt is answered by «neither: the shared builder», and (c) by «the Petri path builds them
   the same way; it freezes only because no Petri metamodel tested has the collision below».

2. **Why InstanceValue nodes are globals** (read, (a) of the prompt). `buildEvalContext`
   (`frontend/src/jjscript/executor/commands/eval.ts:128`) binds every class shell by name (`:325`
   `variables[name] = classJjelValues[i];`) and every instance whose name is unique by name (`:378`
   `if (!(nm in variables)) variables[nm] = allInstancesJjel[a[0]];`). `InstanceValue_3` is an M1 object of the drone
   model with a unique name, so it is a global; its handle links to its class shell, and the shells link to one another
   through `superTypes`.

3. **The class shell reads its flags through the L proxy** (read), `eval.ts:464`:
   `isAbstract: cls.isAbstract ?? cls.abstract ?? false,` and in the same shell `:465` `isInterface: cls.isInterface ?? cls.interface ?? false,`,
   `:469` `isFinal: cls.isFinal ?? cls.final ?? false,`, `:471` `isRootable: cls.isRootable ?? cls.rootable ?? false,`,
   `:472` `isPartial: cls.isPartial ?? cls.partial ?? false,`. The package shell does the same at `:540-541`.
   `cls` is an LClass proxy.

4. **The D-layer field is `abstract`, not `isAbstract`** (read), `frontend/src/model/logicWrapper/LModelElement.tsx`,
   class `DClass` at `:2709`: `abstract: boolean = false;` (`:2732`), `interface: boolean = false;` (`:2733`). The L
   getter is `get_abstract` (`:3312` `protected get_abstract(context: Context): this["abstract"] { return context.data.abstract; }`).

5. **No getter exists for `isAbstract`, `isInterface`, `isPartial`** (measured, this phase): `command grep -c "get_<k>("`
   over `LModelElement.tsx` and `joiner/classes.ts`, exit 0, gives 0 for `isAbstract`, `isInterface`, `isPartial`, and 1
   for `isFinal`, `isRootable` and `isSingleton` (`get_isSingleton` at `:2969`, the positive control of the same
   command).

6. **An unknown key on an L proxy resolves to a child of that name** (read), `LModelElement.tsx:261-277`:
   `if (typeof k === "string" && k !== "children" && (!(k in c.data) && !(k in this))) {` ...
   `if (n && n.toLowerCase() === pk.toLowerCase()) return lc;`. The proxy reaches it through
   `if (this.lg._defaultGetter) return this.lg._defaultGetter(logicContext, propKey);` (`frontend/src/joiner/proxy.ts`, in `get0`).

7. **The drone metamodel has a class with a child named `isAbstract`** (read),
   `frontend/scripts/probe/dcn-drone-fixture.ts:138`: `['Classifier', 'isAbstract', 'EBoolean', 1, 1, null],`.

**Cause.** For the M2 class `Classifier` of the drone's metamodel, `cls.isAbstract` is not a flag: there is no getter
and no D field of that name, so `_defaultGetter` returns the LAttribute `Classifier.isAbstract`, a live L proxy, and
`??` keeps it. Every class shell that has `Classifier` among its `superTypes` (Association, the classes of the model)
then leads to it, and `freezeSnapshot` rightly refuses it. Any metamodel with a class owning an attribute named
`isAbstract`, `isInterface` or `isPartial` (case-insensitively) does the same, Petri or DCN.

## Fix

The cause is in `frontend/src/jjscript/executor/commands/eval.ts`, `shallowClassToJjelValue` (and
`shallowPackageToJjelValue`), the one builder of JjEL contexts shared by the Petri run, the DCN run, the JjScript
`eval` command and validation. That file is outside DOVE of P-2026-11-08-0345, so the prompt's rule applies: stop with
a question. Not applied.

The fix that sits at the cause (proposed, not written): read the D field first, which a getter always answers, e.g.
`isAbstract: cls.abstract ?? cls.isAbstract ?? false` (same for `interface`, `final`, `rootable`, `partial`), or read
`cls.__raw.abstract`. A red test would need `eval.ts` to import in vitest; it imports the joiner, so it likely fails
with `window is not defined` (not measured): the pure part may have to move out, as `model/nameLookup.ts` did.

Rejected: a DCN-only sanitation of `globals` in `startDcnRun` before the freeze. It would bypass the freeze rule's
intent for one branch and leave the Petri path, `eval` and validation with the same proxy in the class shell.

## Dependencies and risks

- `eval.ts` feeds the JjScript console, validation contexts and both sim engines: a change there is observable in all
  of them (a fix that turns a proxy into `false`/`true` should only make values right, but it is a shared-builder change).
- `cls.abstract` on an M1-shadowing class: `LModelElement.tsx:6588` has a `get_abstract` reading `instanceof.abstract`
  (an LObject override); class shells are built from DClass proxies, so it should not apply (read, not measured).
- After the fix Reset may halt for another reason (empty slots `dji.power`, `dji.vmax`, the sensor slots); not reached.

## Open questions

1. May this lane widen DOVE to `frontend/src/jjscript/executor/commands/eval.ts` (the flag reads of `shallowClassToJjelValue` and `shallowPackageToJjelValue`), with its own test?
2. If yes, may the pure shell-building part move to an importable module so the red test executes instead of grepping source (CLAUDE.md §5)?
