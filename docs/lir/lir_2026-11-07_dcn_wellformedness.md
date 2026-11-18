# Layer Impact Report 2026-11-07: DCN well-formedness W1..W4, W6 in the problems registry

- Prompt-ID: P-2026-11-07-1825. Chat: C-2026-11-06-2159. Front: dcn.
- Tree: `~/jjodel-w-dcn-l24`, branch `dcn-l24`, HEAD `4f3f1b90f`.
- Critical-zone go-ahead: Alfonso, 2026-11-07 18:21 («via» on L2.4). Trigger: `components/editor-v2/problems/`
  (CLAUDE.md §3.1 table, R-OI-12 precedent); none of the six files of §3.2 is touched.
- Written before any code diff (CLAUDE.md §3.2). Every claim is read in code at that HEAD unless marked measured.

## 0. Verdict

**A seventh producer of the problems registry, read-only over the raw lookup.** A pure module computes the DCN
diagnostics from the resolved `dcn` roles (`dcnStcFromRoles`), the R-OI `object` binding (`ontoBindings`) and a read
view of the M1 class-level model; a producer component maps them to node problems of one new kind, `dcn`. No
D-layer write, no L proxy, no JjOM, sync, canvas-mutation or persistence path. The existing six kinds report what
they report today.

## 1. Layers

```
Layers touched:
  [x] D-layer (Redux raw data)          read only
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   read only, through the existing indicator
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

- **D-layer.** What changes: nothing. `DcnProblemSync` reads `idlookup` through a `useSelector` signature and
  `store.getState()` after a debounce, as `SimCheckProblemSync.tsx:48-60` does. The read view is built over raw
  records only (`instanceof`, `features` and their `DValue.values`, `father`, `extends`, `name`), with the readers
  the sim bridge already uses (`objectSlots.ts`, `isKindOf.ts`, `collectModelObjectIds`, `simBridge.ts:141`). What
  does not change: no action is dispatched, no `TRANSACTION`, no creator (Rule 12 not engaged). Cross-layer: none.
- **Canvas v2-flow.** What changes: a node whose `DObject` or resolved `DVertex` (`vertexResolver.ts`) carries a `dcn`
  problem shows the existing `NodeProblemIndicator` dot. What does not change: no node, edge, handle or position is
  written; `EditorV2.tsx` gains one mount line beside `SimCheckProblemSync` (`EditorV2.tsx:5140`) and one import.
- **Problems registry** (`problems/registry.ts`). One union member, `'dcn'`, in `NodeProblemKind` (Rule 11:
  authorized by the prompt). No consumer switches on `kind` exhaustively: the only reads of a specific kind are
  `NodeProblemOverlay.tsx:193` (`'conformance'`) and the producers' own `getProblemIdsOwnedBy` revoke passes, each on
  its own kind; so no existing kind changes what it reports. Lifecycle: entries owned by the model
  (`ownerModelId`), revoked by `markResolved`, cleared on the last unmount through `acquireProducerMount('dcn', …)`.
- **Inert unless bound.** The signature is `''` when the open model has no metamodel, or the metamodel bag resolves
  no `dcn` roles (`dcnStcFromRoles` returns `null`): nothing is computed, and what the model owned is resolved.

Side-effect safety: the producer writes only registry entries of kind `dcn` that it owns; the other producers
revoke by kind and owner (`registry.ts:290`), so neither side can clear the other's entries.

## 2. Smoke-test scenarios potentially affected

- Open a non-DCN M1 (turnstile, Families): no `dcn` entry, the other badges unchanged.
- Open the DCN drone (`~/jjodel-demo-exports/dcn/dcn-drone.jjodel`) with the dcn roles bound: `dcn` dots on the
  class-level objects the diagnostics name, nothing else changes; a simulation-bound Petri model keeps its
  `simulation` dots.
- Two tabs on one model, close one: the other keeps its `dcn` dots (`acquireProducerMount`).
- Save, reopen: nothing persisted (the registry is session-local).

## 3. Open before the code phase (discovery findings, read)

Three premises of the prompt are contradicted by the data it names; the lane stops on them (Outcome: question).

- **F1, W6 on the clean drone.** The static `land` of the drone writes `speed` (`dcnStep.test.ts:132`), which the
  viewpoint Mode writes in `Ready.takeOff` (:139) and `Flying.rampUp` (:141-142). Under R-DCN-23 that is an error,
  so the drone of `dcnStep.test.ts` as it is gives one W6 diagnostic, not zero; and the mutated case «the static
  `land()` writes a property Flying writes» is the unmutated drone.
- **F2, W1 and W4 on the inherited viewpoint Health.** Health belongs to the abstract `Sensor` (:159-164), whose
  closure has no feature; `status` is declared on `TempSensor` and `WindSensor` only (:165-170). With the visible
  features read as the closure of the static class that owns the viewpoint (spec §5 W1), `Faulty` and `Nominal`
  read a feature that is not visible (two W1), and `Sensor.selfTest` (:160) assigns one (one W4).
- **F3, the export.** In `dcn-drone.jjodel` the WAU has no attribute (`scripts/probe/dcn-drone-fixture.ts:240`) and
  `ownedSensors` is an association end owned by the association (:325-331, record `link`, :519). The Alert
  invariants read `self.ownedSensors…`, which is no feature of the WAU's closure: three W1 diagnostics on the
  clean export, consistent with `dcnHandles.ts`, whose links come from the closure only (:176-182). The probe's
  «clean model» crop would not be clean.
