# Layer Impact Report: a canvas create opens its own undo entry (#682, Phase 2)

- Prompt-ID: P-2026-11-08-1202. Discovery: `docs/discovery/discovery_2026-11-08_canvas_create_undo_682.md`, §9 finalized here.
- Core change, rule 5, approved by Alfonso on 2026-11-08 (decisions 1 to 5 of the prompt). File: `frontend/src/redux/reducer/reducer.ts`.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)       the state each action writes is unchanged; only undo history is
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Redux reducer, undo history (statehistory): not in the template; core, rule 5

Reducer history:
  - What changes:
    (a) A delta that lengthens a model-element root array (objects, classs, enumerators, packages) opens its own
        entry, inside the 450 ms window too (decisions 1, 2, 4). The other two guards of isRelevantChangeCheck stay:
        no entry before the first interaction or before globalcanundostate.
    (b) A delta carrying one of those four roots is no longer forced to merge by the graph-key rule.
    (c) A merge of a delta that touches the graph root arrays, and any merge into an entry opened by a create (the
        container append, a SetField-only batch, decision 3), composes exactly with composeUndoDeltas.
  - What does NOT change: the state each action produces; the undo group route :1279 and the tail branch :1300, so a
    late create on a group's tail still folds into it; the time-window merge of two non-graph writes, objectMergeInPlace
    (R-UNDO-5); noUndo; the transient fast path; R-UNDO-2 gating; a delete inside the window (only a lengthening opens
    an entry).
  - Cross-layer interaction: Undo now really removes the DObject, DVertex and their records, so the canvas sync sees a
    deletion where it saw a half-reverted state. useJjomSync is not edited; the app check measures the store and
    idlookup, and the crops show the canvas.
  - Side-effect safety: rule 12 untouched, no TRANSACTION added. No migration: history is not persisted.

Smoke-test scenarios potentially affected:
  - palette click and drop on M1: one Undo removes only the object and its vertex, Redo restores them
  - drop inside a container with a creation owner, append included: one Undo step (R2, decision 3)
  - a composition child, a container with its children in one gesture: one Undo step
  - a create inside 450 ms of an edit, two creates 300 ms apart: an entry each (R1, decision 4)
  - JjScript console create, sync vertex at +300 ms: one Undo, no orphan DVertex
  - M2 class, enumerator and package: one Undo removes element and vertex
  - Text tab apply then Undo (T8, E2), Preview, JjTL, Instance Manager: unchanged, group route
  - drag and resize: one Undo per gesture, unchanged
  - open existing project: no new undo entry before the first click
```

## Measures on HEAD that fixed the scope

Probe `~/.jjodel-lanes/P-2026-11-08-1202/probe.mjs` on port 3683, log `.agent-logs/probe682-head-20261108-120640.log`, ends `DONE`,
no page errors.

| Case | Roots of the create | undoDelta | After one Undo |
|---|---|---|---|
| G `syncCreateClass` | `classs`, `vertexs` | 0 | an older edit reverted, class and vertex stay in `idlookup` |
| G2 `syncCreateEnum` | `enumerators`, `vertexs` | 0 | same |
| G3 `syncCreatePackage` | `packages`, `vertexs` | 0 | same |
| H create then container append | `objects`, then the append with the sync's `vertexs`, `edges` at +299 ms | 0 | object stays, both slots keep the pointer |
| I composition child | `objects`, `edges` | 0 | same |
| J container with two children, one tick | `objects:4>7`, `edges:0>2` in one batch | 0 | container and children stay |

So `enumerators` and `packages` show the defect of `classs` and are in the rule (decision 2). The append of case H arrives in the
batch of the sync's vertex, and a SetField-only append is possible in the window: both compose into the create's entry.
