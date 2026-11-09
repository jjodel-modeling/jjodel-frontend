# Discovery: duplicate graphs after an Undo below a tab open (#682 residue)

- Prompt-ID: P-2026-11-08-1719. Prompt: `docs/prompts/claude_2026-11-08_1719_prompt_discovery_undo_tab_open_graphs.md`.
- Session: 880a17c2-b553-4179-8c1f-a28aabb516ba. Chat: C-2026-11-03-1037.
- Tree: `~/jjodel-w-disc682b`, branch `disc-682b-tab-graphs`, HEAD `a6e01bcf2` (`frontend/` identical to trunk `2df3c9a32`:
  `git diff --stat 2df3c9a32 HEAD -- frontend` empty). Comparison tree: tag `pre-undo-682-create-entry` (`445cb8f42`).
- Executor: Anthropic Claude Opus 5.5.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files.
- Read-only lane: no source file changed. The Option B trial patches the reducer as served to the browser, the tree is untouched.

## 1. Objective

Measure what an Undo below a tab open does to the graphs of a model, on the trunk and before #682; say why a tab open writes through the
undo stack at all; give fix options with cost and a Recommended line.

## 2. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The defect predates #682 | **Holds** | §5.1: M2 and M1 cases, same dispatches and same counts on the tag and on the trunk |
| H2 | A tab open's graph creation goes through the undo stack | **Holds** | §5.1 dispatch lines, §4.1 |
| H3 | Undo below a tab open leaves duplicate graphs | **Holds, sharper than reported** | Root `graphs` reverts, the `idlookup` records stay as orphans, the tab rebuilds under new ids (§5.1, §4.2) |
| H4 | The Undo of the entry returns the state from before the tab open | **Falsified** | The rebuild merges into the next entry down, so each further descent adds 2 more `DGraph` (§5.2) |
| H5 | Two tabs on one model make it worse | **Holds** | 2 live classic graphs where one tab makes 1: the guard is dead (§5.3, §4.4) |
| H6 | Keeping a graph-adding delta out of the stack removes the defect | **Holds on the 4 cases run** | §5.5. Not run on the transformation path |

## 3. Files read

All under `frontend/src/` unless absolute. Windows only, not whole files, except where noted.

- `redux/reducer/reducer.ts` 1135-1404, 1425-1446
- `redux/action/action.ts` 298-308
- `redux/store.tsx` 81-82, 110-122 (grep)
- `common/U.tsx` 178, 212, 896-906
- `components/abstract/tabs/ModelTab.tsx` 1-80
- `components/abstract/tabs/MetamodelTab.tsx` 135-206
- `components/abstract/DockManager.tsx` 150-165, 262-294
- `components/editor-v2/hooks/useJjomSync.ts` 340-391, 536-557, 790-839
- `components/editor-v2/sync/syncState.ts` 213-215
- `components/editor-v2/sync/canvasToJjom.ts` 68-83
- `components/editor-v2/EditorV2.tsx` 622-661, and the grep lines 1264, 1272, 3037, 4135, 4355
- `components/editor-v2/utils/autoLayoutOnOpen.ts` 1-28
- `components/project/ProjectEditor.tsx` 1755-1786
- `joiner/classes.ts` 1345-1360, 1443 and grep lines
- `model/dataStructure/GraphDataElements.tsx` 1055-1079
- `utils/lastViewpoint.ts` 48-64
- `pages/components/Navbar.tsx:110`, `codegen/textual/ui/openTextualTab.tsx` 177-214
- `api/persistance/projects.ts` 336-355
- `docs/discovery/lir_2026-11-08_canvas_create_undo_682.md` (whole), `~/.jjodel-lanes/P-2026-11-08-1202/handoff.md` (whole), its `probe.mjs`
  (1-165, 296-361), `docs/PROTOCOL.md` P4 and P6, R-UNDO-5 (from the prompt)

## 4. Findings, read

**4.1 Why a tab open writes through the stack.** Two creators run on an ordinary render or effect, with ordinary actions; nothing marks them.

- `components/abstract/tabs/ModelTab.tsx:32-35` (the same in `MetamodelTab.tsx:152-155`), during render:
  `if (!graph) {` … `const graphid = Constructors.DGraph_makeID(model.id);` … `const dGraph = DGraph.new(0, model.id);`
- `components/editor-v2/hooks/useJjomSync.ts:810-816`, the second graph of the model, the v2-flow one:
  `if (needsNewGraph) {` `const dGraph = DGraph.new(0, modelid);` … `SetFieldAction.new(graphId, 'graphStyle', 'v2-flow', '', false);`
- Each model has two: the tab's filter is `(graph as any).graphStyle !== 'v2-flow'` (`ModelTab.tsx:67`, `MetamodelTab.tsx:200`), the sync's is
  `(g as any).graphStyle === 'v2-flow'` (`useJjomSync.ts:370`).
- The only exit for a non-edit is `redux/reducer/reducer.ts:1279`: `if (action.noUndo || (action.className === 'CompositeAction' && …`. Its one writer is
  `utils/lastViewpoint.ts:58,62`, the tab focus write (search in §5.6).

**4.2 The merge path it takes.** A delta carrying `graphs` is forced into a merge, and the merge is the legacy one.

- `reducer.ts:1300-1301`: `const touchesGraph = (atGroupTail || !UNDO_MODEL_ROOTS.some((k) => (delta as GObject)[k])) && (delta.vertexs || … || delta.graphs);`
  `if (!shouldMerge && touchesGraph) shouldMerge = true;`
- `reducer.ts:1317`: `else if (shouldMerge && allowMerge && pastDelta === undoCreateEntry && !delta.graphs) {`. #682 deliberately leaves a delta carrying `graphs` out of the compose branch.
- `reducer.ts:1354`: `U.objectMergeInPlace(pastDelta, delta);`, which is `common/U.tsx:903`: `out[key] ?? (out[key] = o[key]);`. First wins per top-level key.

So when the entry on top already holds `idlookup` (any edit does), the graph's `idlookup` is dropped whole, while `graphs` and `vertexs`, absent from the
entry, are adopted. The entry then reverts the root arrays and cannot remove the records. That is the orphan. The merge also keeps the entry's old
`timestamp`, which is why the next write, 299 ms later, is outside the 450 ms window (read; `U.UpdatingTimer` 300 at `common/U.tsx:178`, ×1.5).

**4.3 How the tab rebuilds a missing graph under a new id.** With the root reverted, `mapStateToProps` finds no graph and the render of §4.1 runs again.
The id is a counter: `joiner/classes.ts:1352`: `return modelid + '_graph' + Constructors.DGraph_maxID++;`. The rebuild is itself a graph-touching
delta, so it merges into the entry below (§5.1, `t1>1`, `merge 4` and `5`), and the next descent reverts it again.

**4.4 The rebuild guard is dead.** `ModelTab.tsx:33-34`: `const graphid = Constructors.DGraph_makeID(model.id);` `if (!DPointerTargetable.pendingCreation[graphid]) {`. Each call
makes a fresh id, so the test is always true and two mounted tabs create two graphs. Measured in §5.3.

**4.5 Redo is not cleared by a new write.** `redoable` is only popped and pushed in `doUndoRedo`/`undo` (`reducer.ts:1208-1210`, `:1440-1441`; comment at `EditorV2.tsx:1272`:
`never touches redoable`). So the rebuild's writes coexist with a Redo that restores the old root (§5.1, step 6).

**4.6 `noUndo` is per dispatched action.** `redux/action/action.ts:301-303`: `// … Read on the dispatched action only, so it has no effect on an action batched inside a TRANSACTION.`
The reducer accepts a batch only if every action is flagged (`reducer.ts:1279`). The populate batch of a tab open was 19 actions on M2, with vertices (`useJjomSync.ts:835`).

**4.7 Side observations, not diagnosed.**

- A clean tab open leaves root `graphs` as `[g4, g5, g5]`: the v2-flow id twice. `useJjomSync.ts:815` adds it with `SetRootFieldAction.new('graphs', graphId, '+=', true);` after `DGraph.new`
  (measured root `4>6` with one `DGraph` added; same on the tag). No consumer checked.
- An M2 tab open also adds an entry of its own: 2 `SetField … layoutByViewpoint` at +299 ms (`C2` below). Consistent with the open-time ELK pass of `EditorV2.tsx:635-636`
  (`await autoLayoutRef.current();`); the chain through `handleAutoLayout` (`:4135`) was not traced. An M1 tab with no vertices has none, which is why M2 needs one more Undo.

## 5. Measures

Real app, real reducer, headless Chromium. Probe `~/.jjodel-lanes/P-2026-11-08-1719/probe.mjs` (setup, recorder and Undo calls copied from P-2026-11-08-1202), summariser `sum.mjs`, logs in
`~/.jjodel-lanes/P-2026-11-08-1719/logs/`. All runs exit 0, `DONE`, no page errors. Ports 3719 (trunk) and 3720 (tag, detached worktree with cloned `node_modules`, since removed).

**To rerun** (from `frontend/`, a clean Vite on the port, restarted after any edit):
`PROBE_URL=http://localhost:3719 CASE=m2 node scripts/run-quiet.mjs p1719-trunk-m2 -- node ~/.jjodel-lanes/P-2026-11-08-1719/probe.mjs`. `CASE` is `m2`, `m1`, `m1two` or `m2first`; `DEEP=n` adds n Undos below the tab open; `PATCH=B` is the trial of §5.4.
The tag: `git worktree add --detach <dir> pre-undo-682-create-entry`, then clone `node_modules` and serve it.

Sequence: an edit E0, the tab open on a model with no graph (`DockManager.open2`, or `openModelTabBeside` for the second tab), an edit E1, Undo until E0 is reverted, then Redo twice. Notation: `gN:c` classic, `gN:v` v2-flow; `!` is a record not in root `graphs`.

### 5.1 Single tab, trunk and tag

Same dispatches and same counts on both trees (`p1719-trunk-m2-*`, `p1719-pre-m2-*`, `p1719-trunk-m1-*`, `p1719-pre-m1-*`), so **the defect predates #682**.

Dispatches of the M2 tab open: `[C4 graphs:3>4 +DGraph1, merged into the top entry] [C19 graphs:4>6, vertexs:1>3 +DGraph1, DVertex2, merged] [C2 layout, new entry]`. The M1 tab: `C4`, `C7`, both merged, no entry of its own.

| Step (M2, undo depth) | Root `graphs` of the model | `idlookup` `DGraph` total, orphans | Total `DVertex` |
|---|---|---|---|
| After the tab open, u4 | `g4,g5,g5` | 4, 0 | 3 |
| Undo 1 (E1), Undo 2 (layout entry), u3 | `g4,g5,g5` | 4, 0 | 3 |
| Undo 3 (E0 and the merged roots) | `g7,g8,g8` | **6, 2** (`g4:c!`, `g5:v!`) | 5 |
| One more Redo | `g4,g5,g5` | 6, **2** (`g7:c!`, `g8:v!`) | 5 |
| Second Redo | `g4,g5,g5` | 6, 2 | 5 |

M1: same shape with 2 Undos (`g4,g5` to `g7,g8`, 6 `DGraph`, 2 orphans; no vertices). Undo 3 on M2 also changed the depth by 0 net: 3>2, then the rebuild's `C2` 2>3.

### 5.2 Going further down, trunk

`CASE=m2 DEEP=3` (`p1719-trunk-m2deep-*`): each Undo that crosses a rebuild repeats it.

| After | Root of the model | `DGraph` total, orphans | `DVertex` total |
|---|---|---|---|
| Undo 3 | `g7,g8,g8` | 6, 2 | 5 |
| Undo 5 (the anchor's creation) | `g10,g11,g11` | **8, 4** | 7 |

`CASE=m1 DEEP=3` (`p1719-trunk-m1deep-*`): undoing the creation of the model too leaves 6 `DGraph` with no root array entry and no model (`root 0`, `alive false`); Redo restores root and 8 `DGraph`, 4 orphans.

### 5.3 Two tabs on one model, trunk

`CASE=m1two` (`p1719-trunk-m1two-*`). The second tab writes no graph. The Undo below the first tab open does: `[Undo graphs:6>3] [C8 graphs:3>5 +DGraph2] [C8 graphs:5>7 +DGraph1]`.

| Step | Root of the model | `DGraph` total, orphans |
|---|---|---|
| Two tabs open | `g4,g5,g5` | 4, 0 |
| Undo below | `g7,g9,g10,g10` (**two live classic graphs**) | 7, 2 |
| One more Redo | `g4,g5,g5` | 7, 3 |

Not run on the tag: L6 is the point of this case and the prompt asked for it on the trunk.

### 5.4 Empty stack, trunk

`CASE=m2first` (`p1719-trunk-m2first-*`; history emptied by the probe, standing in for a tab open as the first act of a session). With no entry below, `C4` pushes its own entry and `C19` merges into it, so the `idlookup` of `C19` is dropped. Undo 3: `g4` is deleted, `g5` stays orphaned, the tab rebuilds `g7,g8`, 5 `DGraph`, 1 orphan. One Redo puts `g4` back: 6, 2.

### 5.5 Option B trial, served reducer

`PATCH=B` inserts one guard before `reducer.ts:1282`, in the module served by Vite (Playwright route, `patched: 2`, one per navigation):
`if (ret.graphs?.length > oldState.graphs?.length && !['objects','classs','enumerators','packages','models','m1models','m2models'].some((k) => ret[k]?.length > oldState[k]?.length)) return ret;`

| Case | Result (`DGraph` total, orphans, at every step below the tab open and after Redo) |
|---|---|
| M2 (`p1719-trunk-m2-B-*`) | 4, 0. Root stays `g4,g5,g5`, no rebuild dispatch, E0 reverted and restored |
| Two tabs (`p1719-trunk-m1two-B-*`) | 4, 0. Root `g4,g5,g5`, no second classic graph |
| Empty stack (`p1719-trunk-m2first-B-*`) | 4, 0. `C4`/`C19` write no entry (`d0>0`); the `C2` layout entry remains |
| M1, Undo below the model's creation (`p1719-trunk-m1deep-B-*`) | 4, 0. The model goes (`alive false`), its graphs stay in root with no model; Redo restores the model and it finds them again |

The same instrument reads 6, 2 on the unpatched trunk, so the counts discriminate (P12). The M2 layout entry `C2` is still there and still costs one Undo.

### 5.6 Searches (absence claims)

`noUndo`: `command grep -rn 'noUndo' . --include='*.ts' --include='*.tsx' --exclude-dir=__tests__` from `frontend/src/`, 5 lines: `utils/lastViewpoint.ts` (3), `reducer.ts:1279`, `action.ts:303`. So no graph creator sets it. Graph creators: `command grep -rnE 'DGraph\.new\(|new DGraph\('`, same flags: `MetamodelTab`, `ModelTab`, `useJjomSync`, `ProjectEditor`, the constructor. Both were piped into `head -n 14`, under the limit, so the exit status read was `head`'s; the control for each search is its known hit (`reducer.ts:1279`, `ModelTab.tsx:35`).

### 5.7 Not measured

- The Option B guard on the transformation path (`ProjectEditor.tsx:1765-1785`, model and graph in one `TRANSACTION`): read only, the guard's `models` key is what is meant to keep that entry.
- Vertex-only populate on an existing graph (§7, R1). The canvas positions after Undo of the `C2` entry. Whether saved projects hold the orphans (§7, R5).
- `m1two` on the tag, `m2first` on the tag.

## 6. Options

| Option | Touches | Cost | Covers | Against |
|---|---|---|---|---|
| **B. Reducer: a delta that lengthens root `graphs` and no model root writes no entry** | `redux/reducer/reducer.ts` (core, rule 5), `__tests__/undoGroup.test.ts` | One guard, about 4 tests | All creators at once; M2, M1, two tabs, empty stack, Undo below the model's creation (trial, §5.5) | A rule by shape, so a user edit in the same dispatch would lose its entry (R2) |
| A. Mark the tab-open writes `noUndo` | `ModelTab`, `MetamodelTab`, `useJjomSync` (critical), plus an ambient flag on creators or `Constructors` | Medium to high: `noUndo` is per dispatched action, the batch needs every action flagged, and `DVertex.new` has an internal `TRANSACTION` (rule 12) | Same | Plumbing through creators; a missed action silently restores the old merge |
| C. Undo stops at an entry that holds `graphs` | `reducer.ts`, Undo button state | Small | Stops the orphans | Blocks E0 and everything below it, for good, after any first tab open. **Discarded** |
| D. Strip `graphs` from the delta at the legacy merge | `reducer.ts:1354` | Small | Non-empty stack only | Empty-stack path still pushes an entry (§5.4); the rule sits in a branch vertices also take |
| E. Idempotent rebuild: guard keyed by model, or a deterministic id | `ModelTab`, `MetamodelTab`, `classes.ts` | Small to medium; ids change across saves | The two-tab doubling only (§4.4) | Leaves the orphan and the rebuild loop. Separate ticket if still reachable after B |

**Tests for B.** In `undoGroup.test.ts`, on the reducer: a delta adding a graph writes no entry and leaves the top entry unchanged, on a non-empty and on an empty stack; a batch adding a graph and a model root keeps its entry; `objects` likewise. Mutation bench: guard removed, each exclusion removed. App: this probe, `CASE=m2`, `m1`, `m1two`, `m2first`, and `m1 DEEP=3`.

**Recommended: Option B, in `reducer.ts`, with the M2 layout entry (§4.7) left to its own ticket.**

## 7. Risks

- **R1.** A populate adding vertices to an existing graph still takes the legacy merge (`delta.vertexs`, no `graphs`), so an Undo could revert root `vertexs` and the sync re-create them. Read, not measured. B does not cover it.
- **R2.** B judges a whole dispatch. A user edit batched in the same dispatch as a graph creation would lose its entry. The batches measured held only sync writes.
- **R3.** Under B a graph has no undo at all: Undo of the model's creation leaves its graphs (§5.5, last row). It is inert and Redo reuses it; on the trunk today the same Undo also leaves 6 records (§5.2).
- **R4.** R-UNDO-5's general rule stands: B removes a class of merges, it does not change `objectMergeInPlace`.
- **R5.** Saved projects: the state blob holds `idlookup` (`api/persistance/projects.ts:347-348`, read on the clone path), so orphans probably persist. No migration is proposed here; `idlookup` growth is the only effect measured.
- **R6.** `SetField … graphs` on the model record is in `C4`. Under the legacy merge it is dropped with `idlookup` too, so the model's own list may hold stale ids; not measured.

## 8. Layer Impact Report, draft for Option B

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
  - What changes: a delta that lengthens root `graphs` and lengthens none of objects, classs, enumerators, packages,
    models, m1models, m2models adds no entry and merges into none.
  - What does NOT change: the state each action produces; the create entry of #682 and its compose branch; the group
    route; the merge of a vertex-only delta; noUndo; the transient fast path; R-UNDO-2 gating.
  - Cross-layer interaction: useJjomSync and the tabs no longer see `graphs` reverted, so they do not rebuild. Neither
    is edited. The M2 open-time layout keeps its own entry.
  - Side-effect safety: rule 12 untouched, no TRANSACTION added. No migration: history is not persisted.

Smoke-test scenarios potentially affected:
  - open a model tab, edit, Undo below the open: graph count unchanged, canvas unchanged, Redo unchanged
  - same with two tabs on one model
  - a tab open as the first act of a session
  - Undo below a model's creation, then Redo: tab closes, model and graphs return
  - transformation creating a target model with its graph: one Undo removes it
  - canvas create, undo (#682 cases A to M of the P-2026-11-08-1202 probe)
  - open existing project: no new entry before the first click
```

Uncertain about propagation: R1 and the transformation path, to measure in Phase 2 before the diff.

## 9. Open questions for Alfonso

1. Go for Option B in the core reducer (rule 5)?
2. Does the M2 open-time layout entry (one Undo that only reverts a layout) get its own ticket, or go in the same lane?
3. Should the vertex-only populate (R1) be measured in the same lane, or as a ticket?
4. Is a graph left behind after the Undo of its model's creation (R3) acceptable, given that Redo reuses it?
5. Should already saved projects be cleaned of orphan graphs, or left as inert data?
6. Tickets for the dead guard (§4.4) and for the v2-flow id written twice in root `graphs` (§4.7)?
