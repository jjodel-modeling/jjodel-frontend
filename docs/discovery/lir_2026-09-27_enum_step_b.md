# Layer Impact Report: enum step B, Phase 2 (P-2026-09-27-1806)

**Prompt-ID**: P-2026-09-27-1806. **Prompt**: `docs/prompts/claude_2026-09-27_1806_prompt_enum_step_b_phase2.md`.
**Chat**: C-2026-09-27-1437. **Tree**: `~/jjodel-gate`, branch `enum-step-b`, HEAD `fb6b945a1` at the start.
**Go-ahead**: RC-30, `lane-run --critical-zone-goahead P-2026-09-27-1806` (Alfonso, 2026-09-27 00:58).
**Evidence base**: `docs/discovery/discovery_2026-09-27_enum_step_b.md` (`f1ea18733`), §4 B1-B5, §5 producer, §8.

Written before any edit to a file of `CLAUDE.md` §3.1 or to a D-layer write path of §3.2. Line numbers are those of
`fb6b945a1`.

## Slices and files

| Slice | Report item | Files | Critical zone |
|---|---|---|---|
| 1 | B1, B2, B3: the model refuses a non-class type or supertype; data types refuse `extends` additions, allow removals | `frontend/src/model/classifierKindRules.ts` (new, pure), its test (new), `frontend/src/model/logicWrapper/LModelElement.tsx` | D-L write paths (`SetFieldAction` on `type` / `extends`) |
| 2 | B5: `Constructors.DStructuralFeature` skips a non-class in `extendedBy` | `frontend/src/joiner/classes.ts` | JjOM constructor, not §3.1 |
| 3 | Risk 1: `syncInheritanceEdge` / `syncReferenceEdge` refuse before any write when an end is not a class | `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | §3.1 |
| 4 | S24 producer: a pure detector over `idlookup`, published by the M2 producer already mounted | `classifierKindRules.ts`, `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` | §3.1 (`problems/`) |

Not touched: `VersionFixer.tsx` (G chose the producer, so no `2.229 -> 2.230` migration; risk 2 of the report, dangling
`end` cleanup in «Check integrity», is a deletion of persisted data and waits under RC-26), `joiner/proxy.ts` (the set
trap already resolves a `set_extends` on the data-type prototype: `proxy.ts:476`, `this.s + propKey in this.lg`),
`useJjomSync.ts`, `syncState.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`. B4 lives in `api/data.ts`, outside
this lane's ownership map: not done here.

## LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)          (slice 1: which SetFieldActions are issued; no new field)
  [x] L-layer (computed proxies)        (slice 1: set_type, LClass.set_extends/_canExtend, new LDataType.set_extends)
  [x] JjOM (model entities)             (slice 2: Constructors.DStructuralFeature)
  [x] Canvas v2-flow (ReactFlow nodes/edges)  (slice 3: no D-edge created for a refused gesture; slice 4: registry entries)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

### D-layer

- What changes: a `SetFieldAction` on `DReference.type` is no longer issued when the new pointer resolves to an existing
  D object that is not a `DClass`. A `SetFieldAction` on `DClass.extends` no longer carries a non-class pointer (B2, and
  the `list.filter` of `set_extends`, `LModelElement.tsx:3522`, which compared pointers with reason objects and so never
  filtered: it now filters with `invalidPtrs`, the array the method already builds). A data type's `extends` is written
  only when the write removes pointers and adds none.
- What does NOT change: the shape of any D object; the pointer flag of every write (`true`, as `_defaultSetter` passed
  for an array of pointers, `joiner/classes.ts:2441-2446`), so `pointedBy` back-links move exactly as before; every
  write path the discovery measured on load, undo/redo, VersionFixer replay, «Check integrity» and Ecore import (0
  calls to the guarded setters, report §3.2-3.5). Undo and redo apply raw deltas and never reach a setter (§3.3).
- Cross-layer interaction: the refusals are logged (`Log.ee` for a refused type, as the composition-loop refusal of
  `set_type` at `:1528`; `Log.ww` for extends, as `set_extends` already does). The proxy discards the return value
  (`proxy.ts:478`), so the log is the caller's signal.
- Side-effect safety: an unresolved name keeps passing (`:1524`, set-by-name by design); `get_type`'s autocorrect hands
  `set_type` class pointers only (report §2.4). `Dummy.dclass` (`common/Dummy.ts:295-308`) and the canvas unlink
  (`canvasToJjom.ts:425`, `:574`) write shrinking `extends` on a data type: allowed (mode `on-b`, §3.6).

### L-layer

- What changes: `LTypedElement.set_type` gains one refusal before the composition-loop check; `LClass._canExtend`
  refuses a non-`DClass` superclass before reading `superclass.superclasses` (`:3560`, which today dies on `.map`);
  `LDataType` gains `set_extends`, inherited by `LEnumerator`.
- What does NOT change: `get_type`, `get_extends`, `get_extendedBy`, the name resolution of `set_type`, every other
  `_canExtend` rule, the `_fixExtendInstances` call of `LClass.set_extends`.
- Cross-layer interaction: the rules live in `model/classifierKindRules.ts`, a module with no import (the
  `nameLookup.ts` pattern), so the bench executes them; `LModelElement.tsx` does not import under vitest.
- Side-effect safety: the three setters are reached only by user writes and the two cascades above (report §2.5).

### JjOM

- What changes: the superclass walk of `Constructors.DStructuralFeature` (`joiner/classes.ts:731-741`) skips an
  `extendedBy` entry that is not a class. Today a saved S5b (`DEnumerator.extends = [Person]`) makes
  `Person.addAttribute` / `addReference` throw `ltarget.extendedBy is not iterable` (report §3.7).
- What does NOT change: the walk over class subclasses, the `DValue` creation for their instances.
- Side-effect safety: an enum has no instances and no features to propagate; skipping it changes nothing for a model
  without S5b.

### Canvas v2-flow

- What changes: `syncInheritanceEdge` and `syncReferenceEdge` return `null` before any model write and before
  `markCanvasEdgePair` / `DVoidEdge.new2` when an end's model element is not a `DClass`. Their caller
  (`EditorV2.tsx:1747-1760`) already handles `null` (warn, clear the pending connection).
- What does NOT change: the TRANSACTION structure (§3.3: no creator is moved into or out of a TRANSACTION), the
  edge-pair guards (§3.4), deletion paths.
- Cross-layer interaction: C1 (`isMetamodelConnectionValid`, `5dc09a4ce`) already stops the drag; this is the second
  line, so a refused model write can no longer leave a D-edge behind (report risk 1).
- The producer (slice 4) writes registry entries only: session-local, not persisted, immune to undo (registry header).

Smoke-test scenarios potentially affected:
  - import Families.ecore: expect 8 edges Family<->Member (Ecore import runs no guarded setter, §3.5)
  - open an existing project: views render, 0 refusals logged (§3.2)
  - save, reopen: identical state
  - canvas: class->class inheritance and reference still create model change + edge
  - saved S5b: `Person.addAttribute` works (B5); unlink S5b from the canvas works (removal allowed)
  - delete the «supertype» of a saved S5b: `NewEnum.extends` shrinks to [] (no dangling pointer)
  - console: `ref.type = <enum>`, `cls.extends = [<enum>]`, `enum.extends = [<class>]` refused with a log

Uncertain about propagation: none found. The discovery's recorder is the oracle for the load paths (§3.1-3.6).
