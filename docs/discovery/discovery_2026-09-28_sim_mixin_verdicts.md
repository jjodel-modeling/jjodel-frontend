# Discovery — R-SIM-89 verdict table, before/after, the four MODELS demo metamodels

- **Prompt-ID**: P-2026-09-28-2230
- **Prompt file**: `docs/prompts/claude_2026-09-28_2230_prompt_sim_mixin_owner.md`
- **Chat**: C-2026-09-28-1936
- **Tree**: `/Users/alfonso/jjodel-w-mixin`, branch `sim-mixin-owner`, HEAD `8296abeb1` at the start of this lane
  (docs commit that added R-SIM-89 and this prompt)
- **Executor model**: Sonnet 5 (`claude-sonnet-5`, per the session banner)

This report is a set of hypotheses with evidence, not a definitive reference. A reader acting on it
rereads the cited files.

## Objective

Before touching `judge()`'s owner-context branch in `frontend/src/model/simulation/bindingCompat.ts`
(R-SIM-89: a feature owned by a class unrelated to the role's context class, but with a common
concrete subclass — a mixin — warns instead of being incompatible), build the verdict table the
ratification's condition requires: the verdicts of every candidate of every role, on all four
MODELS demo metamodels, identical before and after the change.

## Hypotheses

1. **H1 — the demo exports under `/Users/alfonso/jjodel-demo-exports/` can be turned into a
   `MetamodelSketch` with existing code (`sketchOfMetamodel`).** Falsified — see Finding 1.
2. **H2 — the R-SIM-89 fix leaves the binding verdicts of the four demo metamodels unchanged, for
   every edit role and every candidate.** Holds — see Finding 2.

## Files read

- `docs/demo/models_2026_simulator_demo.md` §2.1–§2.4 (read) — the builder spec for `DemoPEST`,
  `DemoPetri`, `DemoESM`, `DemoFlowB`: classes, `extends`, every attribute and reference, with its
  type, composition and upper bound.
- `frontend/src/components/editor-v2/sim/metamodelSketch.ts` (read) — `sketchOfMetamodel(lookup,
  modelId)`, the only existing builder of a `MetamodelSketch`; its input is `lookup: Record<string,
  any>`, a raw D-layer idlookup keyed by pointer id, walked through `container.classes`,
  `dClass.attributes`, `dClass.references` (`metamodelSketch.ts:22-58`).
- `frontend/src/model/simulation/bindingCompat.ts` (read, then edited) — `judge()`'s owner-context
  branch, `Index.isKind`/`Index.related`.
- `/Users/alfonso/jjodel-demo-exports/scene_1_DemoPEST.json` (read only, not written) — inspected
  with a throwaway Python one-liner, not modified.

## Finding 1 — the exports are a `DProject` record, not an idlookup (H1 falsified)

**Measured** on `scene_1_DemoPEST.json`, this session:

```
className: DProject
type: private
name: DemoPEST
metamodels: ['Pointer1790585292886_USER_10']
```

36 top-level keys total, all fields of the one `DProject` object (`className`, `id`, `pointedBy`,
`_state`, `name`, `type`, `author`, `collaborators`, `onlineUsers`, `metamodels`, `models`,
`graphs`, `viewpoints`, `activeViewpoint`, `favorite`, `description`, `creation`, `lastModified`,
`viewpointsNumber`, `metamodelsNumber`). The referenced metamodel pointer
`Pointer1790585292886_USER_10` is **not** a sibling key of this file — checked directly
(`'Pointer1790585292886_USER_10' in d` → `False`).

`sketchOfMetamodel` needs `lookup[modelId]` to already carry `.classes` / `.packages` with the
classes' own records reachable as sibling entries of the same `lookup` (`metamodelSketch.ts:31-57`,
e.g. `const container = lookup[containerId]`). A single `DProject` record with an external pointer
is not that shape: turning this export into a usable `lookup` needs the app's import/parse pipeline
(the JjOM loader, `VersionFixer`), which does not run as a standalone function under the node test
bench and is out of scope for this lane (DOVE names `bindingCompat.ts` and its tests, one engine
test, the smoke script and closure — not the import pipeline).

**Consequence, per the prompt's own escape hatch** ("If the exports cannot be turned into a sketch
with existing code, use the preset fixtures of the existing tests for the same four presets and say
so"): the four `MetamodelSketch` fixtures used below are built by hand from
`docs/demo/models_2026_simulator_demo.md` §2.1–§2.4 — the documented builder spec the real
`DemoPEST`/`DemoPetri`/`DemoESM`/`DemoFlowB` metamodels were constructed from — rather than from a
reconstruction inside an existing test file (`PEST_SM_RECONSTRUCTED` in `profileBinder.test.ts`
covers only `DemoPEST`, explicitly flagged there as "not the real metamodel"; no equivalent exists
for the other three scenes). This is a declared deviation from the prompt's first-choice method,
not from its intent: the fixtures are read off the same spec document the real metamodels follow,
class for class, feature for feature.

## Finding 2 — the verdict table is identical before and after (H2 holds)

**Method** (this session): wrote `frontend/scripts/smoke/_tmp_mixin_verdicts.ts` (gitignored
`_tmp_*`, not committed) — the four sketches above, one role-bag per scene matching the context
classes `docs/demo/models_2026_simulator_demo.md` §2.1–§2.4 report the dialog binding (`simNode`,
`simTransition`, `simArc` where relevant, `simTrigger` for the event context on PEST/ESM), and a
dump of `bindingVerdicts()` for every edit role, every candidate, `role\tid\tverdict\twhy` one line
each, sorted by role name for determinism.

Run against `judge()` with the `else if (ix.hasCommonConcreteSubclass(...))` branch removed
(**before**) and with it in place (**after**, the committed state): `diff` of the two runs' stdout
is empty but for the node process PID in an unrelated harness warning line (`ExperimentalWarning:
... require()`):

```
1c1
< (node:32227) ExperimentalWarning: ...
---
> (node:32204) ExperimentalWarning: ...
```

197 lines of verdict table per run (4 scenes together), all 197 identical. A representative slice
(`scene_1_DemoPEST`, `stateMachine` profile), unchanged on both sides:

```
initial	State	warn	every State would be Initial: choose a subclass of State
initial	Initial	ok	
initial	Terminal	ok	
initial	Transition	incompatible	Transition is not a kind of State
initial	Event	incompatible	Event is not a kind of State
nextState	State.transitions	incompatible	State.transitions is not a feature of Transition; State.transitions is a containment, not a plain reference; State.transitions does not lead to State
nextState	Transition.nextState	ok	
nextState	Transition.event	incompatible	Transition.event does not lead to State
```

**Why the table cannot move**: `hasCommonConcreteSubclass(a, b)` only changes a verdict when `a`
and `b` are unrelated (neither `isKind`) **and** some concrete class is a kind of both. None of the
four demo metamodels declares a class with more than one `supers` entry — checked by construction,
every `C(...)` call in the four sketches above passes at most a one-element `supers` array, read
straight off `docs/demo/models_2026_simulator_demo.md` §2.1–§2.4 which names no multi-parent class
in any of the four builders. With no multi-inheritance in any of the four sketches, no class can be
a concrete common subclass of two otherwise-unrelated owners, so the new branch is dead code on
every one of the 197 lines — confirmed by the diff, not assumed from reading `judge()`.

The mixin scenario itself (`ActionElement`/`ProcessNode`) is covered separately in
`frontend/src/model/simulation/__tests__/bindingCompat.test.ts` (`describe('owner roles: a mixin
owner (R-SIM-89)')`) and at the engine level in
`frontend/src/model/simulation/__tests__/actionEvaluator.test.ts` (`describe('Ex3: Entry bound to a
mixin owner\'s feature ...')`), not repeated here.

## Open questions

None blocking. The chat runs the four scene probes on the real projects per the prompt's step 7;
this report's table is the static (`bindingVerdicts`) half of that check, not a substitute for it.
