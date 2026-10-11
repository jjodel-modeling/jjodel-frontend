# Layer Impact Report: appending to a composition slot moves the element into it (#182)

- Prompt-ID: `P-2026-10-10-1230` (chat `C-2026-10-10-1223`), decision R-NEST-9
- Tree: `/Users/juridirocco/development/jjodel-182`, branch `fix/182-append-composition`, HEAD `2aa9430ac` at the start
- Go-ahead: Juri, 2026-10-10, «risolvi issue 182». The file sits under `viewpoint/ir/`, a row of the CLAUDE.md §3.1
  table and none of the six files of §3.2: no hook go-ahead (RC-30) is needed and none is passed; the report is owed
  on file before the diff, and this is it.
- Evidence: `docs/discovery/discovery_2026-10-10_182_append_composition.md` (BEFORE column of the probe)

Committed before the first code edit.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts` | `appendSlotValue`: a composition branch that writes through `setValueAtPosition`; its docblock and the module-header sentence at lines 4-6 |

No caller, no core file (`LModelElement.tsx`, the reducer), no migration, no export or signature change.

## 2. The rule

In `appendSlotValue(slot, value, isPtr)`, with `const fresh = slot.r ?? slot`:

- **composition branch**, when `isPtr` is true and `fresh.instanceof?.composition === true`:
  - a value the slot already lists (`rawValues(fresh)` includes it) returns `writeUnchanged()` and writes nothing;
  - otherwise, inside the existing `TRANSACTION`, `verdict = fresh.setValueAtPosition(rawValues(fresh).length, value, { isPtr: true })`
    and the function returns `fromCore(verdict)`; `U.isProjectModified = true` only when the result is `ok && changed`;
  - a refusal of the core (a containment loop) travels verbatim as `{ok: false, reason}`.
- **every other case** (plain reference, aggregation, shapeless slot, primitive): the existing
  `SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr)` and the existing unconditional dirty mark, byte for byte.

The `TRANSACTION` of `appendSlotValue` contains no creator (`DVertex.new`, `DVoidEdge.new2`, `DVoidEdge.new3`), so rule 12
of CLAUDE.md does not apply; `setValueAtPosition` writes `SetFieldAction`s only.

## 3. Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)           (the target's father, the old container's values, the slot's values: written
                                          by the core's own SetFieldActions, as for a set)
  [x] L-layer (computed proxies)         (calls LValue.setValueAtPosition; no proxy code changes)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)   (by data only, see below; no canvas code or hook is touched)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)     (no code change; reads father and slot values as it does after any set)
  [ ] Persistence (VersionFixer / jsxString)   (no migration: a project saved with the old append keeps its
                                          inconsistent father; this lane does not repair it)

D-layer / L-layer
  - What changes: a pointer appended to a COMPOSITION slot through formWrite.appendSlotValue is written by the core's
    setValueAtPosition: the target is re-fathered to the slot, evicted from its old container (a model root, or
    another composition slot), and the loop check runs. A value already listed is not written twice.
  - What does NOT change: the append on a plain reference, on an aggregation (R-NEST-2: it shares), on a shapeless
    slot and on a primitive; formWrite.setSlotValue, clearSlotValue, addSlotValue; every caller; the core.
  - Cross-layer interaction: the target stops being a root of the model for the tree and the export, and the
    container's form and the slot-based cascade (R-NEST-5) keep agreeing with it.
  - Side-effect safety vs other layers: one TRANSACTION, no creator, the same core call the form's set already
    makes. Undo of the move is the one gap (#177): reported by arm U1, not fixed here.

Canvas / sync (by data, no code)
  - What changes: the data the sync reads (father, slot values) is now coherent after the append, as after a set or a
    JjScript `set`. Whether the node of a moved element is repainted under its new container is NOT measured by the
    probe (no canvas hook is mounted in the harness, arm V1 reports D-layer counts): it is on Juri's visual list.
  - What does NOT change: edge creation guards (M1 pair keys, M2 composite keys), vertex creation, Step 2bis.

Smoke-test scenarios potentially affected:
  - append a fresh root and a settled root to a composition slot (C1, C2) → father is the slot, listed once, not a root
  - append an element contained elsewhere (C3) → moves, the old slot no longer lists it
  - append the same element twice (C4) → second is `changed: false`, no duplicate
  - append that would close a containment loop (C5) → refused with the core's reason, nothing written
  - append on an aggregation and on a plain reference (G2, R1) → unchanged, controls
  - delete the container (D1) → the appended children go with it, nothing dangling
  - two appends in one tick (C6) → same index, reported not fixed
  - undo after the append (U1) → reported, #177
  - open an existing project → views render (no persistence change)

Uncertain about propagation? → one point, declared: the repaint of a moved node on the canvas, not measurable by
this harness (V1); and the index collision of C6, accepted and written in the docblock.
```
