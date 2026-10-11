# Layer Impact Report: migration `2.229 -> 2.230`, every instance listed by its model (step 4 of P-2026-10-07-0950)

- Prompt-ID: `P-2026-10-07-0950` (chat `C-2026-10-07-0948`), Phase 2, step 4, the lane's only critical-zone edit
- Tree: `/Users/juridirocco/development/jjodel-174`, branch `fix/174-nesting-forms`, HEAD `0aff0d6df` at the start
  (steps 1-3: `b9291259f`, `5995167ba`, `0aff0d6df`)
- Go-ahead: the GO of 2026-10-07 in this session, «Go-ahead RC-30 su `frontend/src/redux/VersionFixer.tsx` soltanto,
  nel passo 4»; `goahead.txt` in the lane folder, `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-10-07-0950` in the session
- Decision: R-NEST-6 (`docs/decisions.md`), memo `docs/ratifiche/claude_2026-10-07_memo_174_nesting_forms.md`;
  evidence `docs/discovery/discovery_2026-10-07_174_nesting_forms.md` §8 (point 2 of that section, the aggregation
  re-father, is NOT taken: R-NEST-2)

Committed before the first code edit, as RC-30 asks.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/redux/VersionFixer.tsx` | a new step `private ['2.229 -> 2.230'](s: DState): DState`; `highestVersion` follows from the method name (`redux/CLAUDE.md` §3.9) |
| `frontend/src/redux/__tests__/versionfixer_2230_migration.test.ts` | new: the real class with the joiner barrel mocked, as `versionfixer_2229_migration.test.ts` does |

## 2. The step

Pure `DState -> DState` on `s.idlookup`, in the style of `2.228 -> 2.229`:

1. For every `DObject`, walk `father` (DObject -> DValue -> DObject -> … -> DModel, at most 64 hops). A chain that
   does not end at a `DModel` (a father deleted with its container before #174, D1/D2 of the Phase 1 report) is
   counted and left untouched.
2. If that model's `objects` does not list the object, append its id, and add to the object's `pointedBy` the entry an
   `objects '+='` writes, `{source: 'idlookup.<modelId>.objects'}` (`PointedBy.fromID`, `joiner/classes.ts:1948`),
   unless it is there already.
3. Deduplicate every `DModel.objects`, keeping the first entry (as FASE B of `2.226 -> 2.227`).

Not done: no `father` changes (an aggregation keeps its re-father, R-NEST-2); no deletion; nothing outside `objects`
and `pointedBy` of the listed objects. A metamodel holds no `DObject` and is untouched by construction.

## 3. Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data): DModel.objects and DObject.pointedBy of saved projects
  [ ] L-layer (computed proxies)        (no code change; LModel.objects reads the completed list)
  [x] JjOM (model entities)             (indirect: «instance of the model» = listed by objects)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   (indirect, no code change)
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)    (indirect, no code change)
  [x] Persistence (VersionFixer / jsxString): a state migration, no jsxString

D-layer / Persistence
  - What changes: at load, a saved state below 2.230 gets every nested instance of every model in that model's
    objects (with its pointedBy entry), and every objects list deduplicated.
  - What does NOT change: father of any element, slot values, ids, graphs and vertices, views, jsxString, any
    element whose father chain does not reach a model.
  - Cross-layer: every reader of DModel.objects sees the nested instances of saved projects, as it already sees the
    ones created after step 2 (report §5 census, R-NEST-1).
  - Side-effect safety: idempotent (a second run finds every object listed and no duplicate); a no-op on a coherent
    state; no creator, no TRANSACTION (the migration runs on the plain state object before LoadAction).

Canvas v2-flow / Sync (by data, no code change)
  - What changes: opening the canvas of a migrated project, useJjomSync Step 2bis gives a vertex to every nested
    instance that had none (the «Add» and `create … in` children of projects saved before #174); Step 4,
    useM1ReferenceEdges and m1EdgeSweep read them as sources, so their outgoing reference edges are created and kept.
  - What does NOT change: vertices and edges already persisted; XMI-imported or `set`-form projects (already listed).

JjOM / conformance
  - What changes: the validator visits the nested instances of migrated projects (R-NEST-3): new violations may
    appear in their Problems panel.

Smoke-test scenarios potentially affected:
  - open a project saved before the lane with «Add» children → same tree; the children are listed; on the canvas
    they become nodes (MIG arm of the probe, then the visual checklist)
  - save → reopen → identical state (S1 arm)
  - import Families.ecore / an M1 XMI → unchanged (C2 and the XMI canvas arm)

Uncertain about propagation? → no: the step writes two fields, measured by the unit test and by the MIG probe arm.
```
