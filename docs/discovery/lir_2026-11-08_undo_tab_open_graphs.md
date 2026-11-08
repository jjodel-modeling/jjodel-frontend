# Layer Impact Report: a graph-only delta writes no undo entry (option B)

- Prompt-ID: P-2026-11-08-1800. Discovery: `docs/discovery/discovery_2026-11-08_undo_tab_open_graphs.md`, §8 finalized here.
- Core change, rule 5, approved by Alfonso on 2026-11-08 17:58 (decisions 1 to 6 of the prompt). File: `frontend/src/redux/reducer/reducer.ts`.
- Line numbers reread on HEAD `00757bfb8`, after #682 Phase 2: `:1279` noUndo, `:1287` group route, `:1292` `pastDelta`, `:1294` `atGroupTail`, `:1295` `createsModelElement`, `:1300` `touchesGraph`, `:1311` tail compose, `:1317` create compose, `:1354` legacy merge.

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
  - What changes: outside an open group and off a group's tail, a delta that lengthens root `graphs` and writes none of
    objects, classs, enumerators, packages, models, m1models, m2models adds no entry and merges into none. The guard
    sits after the group route :1287 and after `atGroupTail` :1294, before `createsModelElement`.
  - What does NOT change: the state each action produces; the group route; the tail compose (a graph delta on a group's
    tail still folds into it); the create entry of #682 and its compose branch; UNDO_MODEL_ROOTS; the merge of a
    vertex-only delta; objectMergeInPlace (R-UNDO-5); noUndo; the transient fast path; R-UNDO-2 gating.
  - Cross-layer interaction: useJjomSync and the tabs no longer see `graphs` reverted, so they do not rebuild. Neither
    is edited. The M2 open-time layout keeps its own entry (decision 2, ticket).
  - Side-effect safety: rule 12 untouched, no TRANSACTION added. No migration: history is not persisted, and saved
    orphan graphs stay as inert data (decision 5).

Smoke-test scenarios potentially affected:
  - open a model tab, edit, Undo below the open: graph count unchanged, canvas unchanged, Redo unchanged
  - same with two tabs on one model
  - a tab open as the first act of a session
  - Undo below a model's creation, then Redo: tab closes, model and graphs return (R3 accepted, decision 4)
  - transformation creating a target model with its graph: one Undo removes it
  - canvas create, undo (#682 tests)
  - open existing project: no new entry before the first click
```

## Choices the §8 draft left open

- **"Writes", not "lengthens", for the model roots.** Decision 1 says a delta that "writes no model root". The test reads `delta[k]`, as `touchesGraph` already does, so a batch that shortens `objects` while adding a graph keeps today's path. The §5.5 trial used lengths.
- **After the group route, off the tail.** The §5.5 trial ran before the delta, so it also swallowed graph writes inside a group. The prompt keeps the group path unchanged, hence the position and `!atGroupTail`. Consequence, accepted and to report: a tab opened with a group's entry still on top composes into that entry, as today.
- **A separate list.** `UNDO_MODEL_ROOTS` drives #682's own entry and is not widened: `models`, `m1models` and `m2models` join only the guard's exclusion.

## Measures on HEAD before the diff

Probe `~/.jjodel-lanes/P-2026-11-08-1800/probe.mjs` (copied from P-2026-11-08-1719, cases added), port 3800, exit 0, `DONE`, no page errors. Logs in `.agent-logs/`.

| Case | Dispatch | Stack | After one Undo |
|---|---|---|---|
| `xform`: the calls of `ProjectEditor.tsx:1752-1793` from the page, group open, `TRANSACTION` with `DModel.new`, `DGraph.new`, `graphStyle` (`p1800-pre-xform`) | writes `models`, `m1models`, `graphs` | 3>4, own entry | model and graph gone, `DGraph` 3>2, 0 orphans; Redo restores them |
| `xformng`: the same without a group (`p1800-pre-xformng`) | same | 3>3, legacy merge into the top entry | root reverts, the model and graph records stay, 1 orphan, and the anchor's older edit goes with it |
| `r1`: both graphs present, tab open populates a vertex only (`p1800-pre-r1`) | `vertexs:1>2`, merged | 3>3, then a layout entry | at the Undo of the entry merged into: `vertexs:2>1`, `DVertex` total stays 2, no rebuild, Redo restores |

So the transformation path goes through the group route and keeps one entry. `xformng` carries `models`, so the guard leaves it on its current path; the real transformation does not take it. R1 is real but different in kind (one record out of root `vertexs`, no rebuild, no growth), and its delta has no `graphs`: option B does not cover it unchanged, so decision 3 makes it a ticket.
