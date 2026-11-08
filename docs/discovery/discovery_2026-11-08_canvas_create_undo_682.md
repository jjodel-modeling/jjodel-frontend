# Discovery: a canvas create gets no undo step of its own (ticket #682)

- Prompt-ID: P-2026-11-08-0916, `docs/prompts/` prompt of commit `f52ff3db8`
- Session: 7e14a168-62c2-4042-a5fc-0d003393a839
- Tree: `~/jjodel-w-disc682`, branch `disc-682-canvas-undo`, HEAD `f52ff3db8`
- Executor model: claude-opus-5-5
- Phase 1, read-only: no file under `frontend/src` changed. **Hypotheses with evidence, not a reference: whoever uses this
  rereads the real files.**

Tags: **[M]** measured in this phase on HEAD `f52ff3db8`, real app on port 3682; **[M-patch]** the same with the *served*
`reducer.ts` rewritten by a Playwright route (tree untouched); **[R]** read.

## 1. Objective

Read the undo machinery end to end, measure what a canvas create does to the undo stack, propose a fix with options and
cost, for Alfonso to decide. `reducer.ts` is core: nothing is fixed here.

**Correction to the prompt and the ticket.** `frontend/src/redux/reducer.ts` does not exist. The file is
`frontend/src/redux/reducer/reducer.ts`, the only `reducer.ts` in `git ls-files`, and the merge rule quoted verbatim in the
ticket is now at `:1290`, not `:1280`.

## 2. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | A canvas create adds no undo entry (undoDelta 0) | **holds** | §5 A and B [M] |
| H2 | One Undo reverts the previous action and the object stays | **holds, and it is worse** | §5 A, B [M]: the undo also leaves the state half reverted (§6.1) |
| H3 | The cause is the rule at `reducer.ts:1290` | **holds** | §5 A, B [M-patch `objects`]: that one condition gives undoDelta 1 |
| H4 | A vertex move or resize is merged by that rule (prompt, «still merged as intended») | **falsified** | §5 C1, C2 [M]: `roots: []`, each settled move or resize is its own entry. Already read on 2026-08-24, §4.3 |
| H5 | Not merging a delta that creates a DObject is enough (ticket, «Expected») | **partly** | Enough for the canvas create (§5 A, B). A later vertex merged by the time window still leaks (§5 E [M-patch `objects`]) |
| H6 | Multi-step creates stay one step | **holds today, and under option 1** | §5 E [M], [M-patch]; group creates are untouched by read (§7) |

## 3. Files read

Full paths under the worktree. Windows are stated; a window is not a read of the whole file.

- `frontend/src/redux/reducer/reducer.ts` :1125-1444
- `frontend/src/redux/reducer/__tests__/undoGroup.test.ts` :1-110, plus the `it(` index
- `frontend/src/redux/action/action.ts` :92-186
- `frontend/src/redux/store.tsx` :81-82, :122-128, :148 (grep)
- `frontend/src/common/U.tsx` :896-906 (`objectMergeInPlace`)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` :90-104, :408-440, :1445-1579, `syncCreateClass` by grep
- `frontend/src/components/editor-v2/EditorV2.tsx` :984-992, :2305-2312, :2492-2644, :2746-2759 (grep), :3096-3135 (grep),
  :3350, :3370-3378
- `frontend/src/components/editor-v2/hooks/instantiate.ts` :25-40, :558-568, :790-802, :880-915
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` :215-288
- `frontend/src/codegen/textual/ui/openTextualTab.tsx` :200-232
- `frontend/src/components/project/ProjectEditor.tsx` :1720-1730, :1825-1837
- `frontend/src/components/contextMenu/ContextMenu.tsx` :365-398
- `frontend/src/components/topbar/undoredocomponent.tsx` :80-92
- `frontend/src/model/logicWrapper/LModelElement.tsx` :6045, :6104-6138 (grep)
- `docs/decisions.md` R-UNDO-1..8, R-TXT-57; `docs/discovery/discovery_2026-11-07_slot_identity_656.md` §4 S5, §9;
  `docs/discovery/discovery_2026-08-24_undo_editor_v2_layout.md` :127-142; ticket in `docs/log-inbox/codegen.md:2586`

## 4. Findings, read

### 4.1 How an entry is built [R]

`_reducer` computes one delta per dispatch (`reducer.ts:1274`) and picks one of four routes:

1. Open undo group: `:1279` `if (undoGroup && undoGroup.user === action.sender) {` pushes and returns, **before any merge rule**.
2. Merge into the group's entry: `:1300` `if (shouldMerge && allowMerge && undoGroupTail && pastDelta === undoGroupTail) {`, exact, through `composeUndoDeltas`.
3. Legacy merge: `:1306` `else if (shouldMerge && allowMerge) {`, then `:1336` `U.objectMergeInPlace(pastDelta, delta);`.
4. Own entry: `:1344` `else if (isRelevantChange) {`.

`shouldMerge` starts at `:1288` `let shouldMerge = !isRelevantChange;`. `isRelevantChangeCheck` (`:1361-1373`) is false without
`U.userHasInteracted`, within 450 ms of the previous entry (`mergeTolerance`, `U.UpdatingTimer*1.5`), or before
`statehistory.globalcanundostate`. Then the rule under discussion:

```
reducer.ts:1290  if (!shouldMerge && (delta.vertexs || delta.graphvertexs || delta.graphelements || delta.edgepoints || delta.edges || delta.graphs)) shouldMerge = true;
```

### 4.2 Why the merge corrupts [R]

`U.tsx:903` `out[key] ?? (out[key] = o[key]);` is shallow and first-wins. Merging a create into an entry that already holds
`idlookup` drops the create's whole `idlookup` subtree and keeps its *new* top-level keys (`objects`, `vertexs`, `values`).
Already recorded for the rename case by R-UNDO-5; the header of `undoGroup.test.ts:9-11` states the same defect.

### 4.3 Which deltas the rule matches [R, M]

The six keys are root pointer arrays (`store.tsx:122-128`): they change when a graph element is created or deleted, never on
a move. `discovery_2026-08-24_undo_editor_v2_layout.md:134` already says it: «Ma non è quella riga a fondere un drag». A drag
is merged by the 450 ms window (§5 C4).

### 4.4 Why the rule exists: inferred

`git log -S` on the condition gives one commit, `cec370847` (Damiano Di Vincenzo, 2025-01-29, subject `.`, 6 files), with
no explanation. `docs/decisions.md` has no row on it (`command grep -c "delta.vertexs\|graphvertexs"`: 0; control
`R-UNDO-1` through the same tool: 2). The only stated intent is `reducer.ts:1133-1135`, «a later write the legacy path would
merge into it (a graph create of the sync)». **Inferred:** graph elements born from rendering or sync are not user acts and
must not be undo steps. The rule cannot tell those from a user create, whose vertex travels in the same delta.

### 4.5 How a canvas create reaches the store [R, M]

`createFromPalette` (`EditorV2.tsx:2499`, reached by the drop at `:2746` and by click or Enter at `:2757`) calls
`syncCreateObject` (`:2611`; `canvasToJjom.ts:1502`), which runs `DObject.new` (`:1523`) and `createVertexForObject` →
`DVertex.new` (`:1536`, `:1467`), bare by rule 12. [M] The batch timer folds them into **one dispatch**: `CompositeAction`, 18
actions, roots `vertexs`, `objects`, `values` (§5 B). That shared delta is why the rule fires.

### 4.6 Every path that creates a DObject

Search: `command grep -rlE "DObject\.new\(|\.addObject\("` over `frontend/src`, tests excluded, complete list of 19 files. Not
user paths and not inspected: `examples/` (7 files), `debugtools/debug.tsx`, `joiner/classes.ts` (the `addObject`
definition), `LModelElement.tsx`.

| Path | Site | Undo route | Evidence |
|---|---|---|---|
| Palette drop, palette click | `EditorV2.tsx:2611` | **rule fires, merged** | M (B) |
| Drop in a container with a creation owner | `EditorV2.tsx:2553`, append at `:2568` | **rule fires**, then a separate SetField batch | R |
| Singleton create | `EditorV2.tsx:989` | **rule fires** | R, same function |
| Object-as-edge | `EditorV2.tsx:2310` | **rule fires** | R, same function |
| Containment drop | `EditorV2.tsx:3376` | **rule fires** | R, same function |
| Classic context menu | `ContextMenu.tsx:371,381,394` | `addObject`, then `createVertexForObject` | R, route not measured |
| `lModel.addObject` on the canvas | `EditorV2.tsx:2807` | no vertex in the delta; shape of E | R |
| JjScript console `create` | `instance.ts:686` | no vertex in the delta; shape of E | R (E measures `DObject.new` directly) |
| Text tab apply, new model from text | `openTextualTab.tsx:207` | **group, `:1279`** | R |
| Preview Apply | `PreviewBar.tsx:61` | group | R |
| JjTL run | `ProjectEditor.tsx:1725,1833` | group | R |
| Instance Manager, instantiate | `instantiate.ts:797,885`, `createAdapter.ts:465,532,536` | group | R |
| Nested materialization | `nestedMaterialization.ts:292`, group at `:476` | group | R |
| XMI and JSON import | `XMIService.ts:770,1190`, `api/data.ts:614` | import, not a gesture | R, not inspected further |

Paste does not create: `pasteClipboard` (`EditorV2.tsx:3096`) writes React state only (`command grep -nE
"sync|\.new\(|setNodes|setEdges|TRANSACTION"` over `:3096-3135` matches `setNodes`, `setEdges` and their deps, nothing else).

## 5. Measures

Probe: `~/.jjodel-lanes/P-2026-11-08-0916/probe.mjs` (not committed). It wraps `store.dispatch` and records, per dispatch, the
root arrays changed, the ids added or removed, the depth, and the identity of the top entry. Each case: a settled prior edit
(`anchor.name = priorN`), 1.5 s, the action, then one `UndoAction`.

Rerun, from `frontend/`, with a dev server on 3682 (`npx vite --port 3682 --strictPort`):

```
PROBE_URL=http://localhost:3682 P682_PATCH=none node scripts/run-quiet.mjs probe682-head -- node ~/.jjodel-lanes/P-2026-11-08-0916/probe.mjs
```

`P682_PATCH`: `none`, `objects`, `objects+compose`. Logs in `.agent-logs/`: `probe682-head3-20261108-092549.log` (HEAD),
`probe682-objects-20261108-092737.log`, `probe682-compose-20261108-092923.log`. All three end `DONE`, no page errors.

**An invalid first run, kept as a warning.** Run 1 had no real click, so `statehistory.globalcanundostate` stayed false and
every delta merged: one Undo removed everything. It is discarded. Any later measure must click first (`page.mouse.click`); run
2 onward log `globalcanundostate: true`.

| Case | HEAD: undoDelta | HEAD: after ONE Undo | `objects` | `objects+compose` |
|---|---|---|---|---|
| A `syncCreateObject`, direct | **0** | prior edit reverted; object and vertex **stay in `idlookup`**, root `objects` and `vertexs` lose them | 1; only the object goes | 1; only the object goes |
| B palette click, real gesture | **0** | same as A | 1; only the object goes | 1; only the object goes |
| C1 move, settled | +1 | move reverted, prior kept | +1, same | +1, same |
| C2 resize, settled | +1 | resize reverted, prior kept | +1, same | +1, same |
| C3 two moves 150 ms apart | +1 (one batch, 2 actions) | | +1 | +1 |
| C4 two moves 350 ms apart | +1 (second merged, `merge` 5, time window) | | +1 | +1 |
| D `syncDeleteVertex` | +1 (roots `objects`, `values`, no rule key) | object restored | +1, restored | +1, restored |
| E `DObject.new`, sync vertex at +300 ms | +1 | object gone, **vertex stays in `idlookup`** | same leak | 1; object **and vertex** gone |
| F create inside `beginUndoGroup`, from the page | +1 | object and vertex gone, prior kept; a second Undo reverts the prior; two Redo restore all | +1, same on the first Undo | +1, same on the first Undo |
| G `syncCreateClass`, M2 | **0** | prior reverted; class and vertex stay | **0**, same | **0**; one Undo removes the prior edit and the class together |

Limits. A's second dispatch (a second `DVertex` at +302 ms, 2 graphs in the fixture) is not traced; the likely reason is the
direct call on `graphs[0]` when another graph is active. B, on the real gesture, has one dispatch. `inGraph` in B reads
`graphs[0]`, so it says nothing there. M2 was measured for a class only; `syncCreateEnum` and the package create are read.
Deletion with connected edges (`delta.edges`, so the rule would fire) was not measured.

## 6. What this adds to the ticket

### 6.1 The state after that Undo is inconsistent [M, HEAD]

Case B, after one Undo: `{"anchorName":"anchor","obj":true,"vtx":true,"rootObjects":false,"rootVertexs":false,"inModel":true}`.
The object remains in `idlookup` and in `model.objects`, but not in root `state.objects`. This is the mechanism of §4.2 and it
is not only a missing step: any reader of the root arrays disagrees with `idlookup` until reload or until a further write.
Consumers of the root arrays were not inventoried.

### 6.2 Same defect on M2 [M]

Case G: undoDelta 0, one Undo reverts the prior edit, and the class stays. The ticket covers objects only.

### 6.3 An orphan vertex on every bare create [M]

Case E: the sync's vertex arrives inside the 450 ms window and is merged first-wins, so one Undo leaves a `DVertex` in
`idlookup`. This is the time-window route, not `:1290`, and it exists today for the JjScript console shape.

### 6.4 Observation, not a finding on #682 [R]

`reducer.ts:1284` indexes the sender's stack with the length of `all`:
`statehistory[action.sender].undoable[statehistory.all.undoable.length-1]`. Equal in a single-user session (user and all were
equal in every measure); in a shared session the two lengths differ. Outside this ticket.

## 7. Options

### Option 1: the reducer tells a user create from a graph element, and merges those exactly

`reducer.ts:1290` becomes:

```ts
const touchesGraph = !delta.objects && (delta.vertexs || delta.graphvertexs || delta.graphelements || delta.edgepoints || delta.edges || delta.graphs);
if (!shouldMerge && touchesGraph) shouldMerge = true;
```

A new branch between `:1305` and `:1306`, the body of `:1302-1304`:

```ts
else if (shouldMerge && allowMerge && touchesGraph) {
    const composed = composeUndoDeltas(pastDelta, delta);
    for (const k of Object.keys(pastDelta)) delete pastDelta[k];
    Object.assign(pastDelta, composed);
}
```

- Measured as `objects+compose`: A, B, E correct; moves unchanged.
- Cost: one file, about 6 lines, core. No caller changes, so every path in §4.6 marked «rule fires» is covered at once.
- Touches: drag sequences no (no rule key, C1-C4). Multi-step creates: the sync vertex still merges, now exactly (E). Text tab
  apply, T8, E2, Preview, JjTL, Instance Manager: no, they leave at `:1279` before this line, and the tail branch `:1300` comes
  first (read, not rerun). Undo tab (`undoredocomponent.tsx:85`): one more row per create, the intended effect; `EditorV2.tsx:1264`
  observes the depth and queues a silent save after undo, as for any entry.
- Amends nothing in R-UNDO-5: the time-window merge of two non-graph writes keeps `objectMergeInPlace`.
- Limit: a create within 450 ms of the previous entry still takes the legacy merge (`touchesGraph` is false, §8 R1).
- Tests: in the `undoGroup.test.ts` harness, the real `_reducer` in node: a delta with `objects` and `vertexs` at +1000 ms is an
  entry and one undo restores `idlookup` and root arrays; a `vertexs`-only delta at +300 ms merges and one undo removes it; a
  move is an entry; the group path and the tail branch are unchanged. Mutation bench: drop `!delta.objects`; drop the compose
  branch (each must kill a test, §5 of `CLAUDE.md`). Rerun the probe on the real tree.

### Option 1a: only the `:1290` condition, no compose

Measured as `objects`: A, B correct; E keeps its orphan vertex (as today). One line, but it leaves the first-wins loss on the
exact path the rule exists for. Cheaper, not cleaner.

### Option 2: the canvas create opens an undo group

`beginUndoGroup()` before `canvasToJjom.ts:1523`, `endUndoGroup()` after the batch lands, like `instantiate.ts:797`. No reducer
change. Measured from the page as F: correct, undo and redo.

- Cost: `canvasToJjom.ts` (critical zone), and the function is synchronous while the group must outlive the 300 ms batch, so the
  end is deferred by a timer or a landing wait. Between the two, a user action folds into the group; a second group opened in
  that window counts as nested and folds two gestures into one undo.
- Not covered: `ContextMenu.tsx:371` and `syncCreateClass`; each needs its own wrapping. The group closes by a measured wait,
  not by construction.
- Tests: page probe only; the sync path does not import in the bench.

### Option 3: the create marks its action, `noMerge`, beside `noUndo` (`:1271`)

Read `action.actions.some(a => a.noMerge)` at `:1290`. Not measured. It needs the flag set on the actions of `DObject.new`
(`LModelElement.tsx:6104`, `Constructors`) and carried through the batch, for M1 and M2. It touches the D-layer creators to
express what `delta.objects` already says, and alone it does not fix §6.3.

**Recommended: Option 1, with the compose branch**: one file, measured on the real gesture, covers every rule-hit path at once,
and leaves groups, drags and the Text tab on routes it does not touch.

## 8. Risks

- **R1, create within 450 ms of the previous entry.** Time-window merge, first-wins: the corruption of §6.1 in that window. A
  fast double click on the palette or a create right after a move. Not measured.
- **R2, container create.** `EditorV2.tsx:2568` appends to the slots in a later SetField-only batch. Under option 1 it merges
  first-wins by the time window or pushes a second entry. If it merges, one Undo removes the object and leaves the pointer in
  the owner slot; if it pushes, the gesture is two steps. Not measured; needs a case before the fix ships.
- **R3, a late `objects` delta after a group.** With `objects`, the tail branch no longer takes a late create that the rule
  made mergeable; it opens an entry. Groups flush before end by contract (`:1132`), but `instantiate` waits by polling. Test.
- **R4, undo count.** N creates are now N entries against `MAX_HISTORY`. Intended.
- **R5, unmeasured reach.** Delete with edges, classic menu, and the consumers of root arrays (§6.1).

## 9. Layer Impact Report, draft for option 1

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)       state written is unchanged; only undo history is
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Redux reducer, undo history (statehistory): not in the template; core, rule 5

Reducer history:
  - What changes: a delta with root `objects` is no longer forced to merge at reducer.ts:1290; a merge of a delta touching the
    graph root arrays composes exactly instead of first-wins.
  - What does NOT change: the state each action produces; the undo group route :1279 and tail :1300; the 450 ms merge of
    non-graph writes (R-UNDO-5); noUndo; the transient fast path; R-UNDO-2 gating.
  - Cross-layer interaction: undo now actually removes the DObject, DVertex and their records, so canvas sync sees a deletion
    where today it saw a half-reverted state. useJjomSync is not edited; its reaction to that deletion is covered by the probe
    only as far as state, not rendering.
  - Side-effect safety: rule 12 untouched, no TRANSACTION added. No migration: history is not persisted.

Smoke-test scenarios potentially affected:
  - palette click and drop on M1, one Undo removes only the object, Redo restores it
  - drop inside a container with a creation owner (R2)
  - JjScript console create, one Undo removes object and vertex
  - Text tab apply then Undo (T8, E2), unchanged
  - drag and resize, one Undo per gesture, unchanged
  - open existing project: no new undo entry before the first click
```

Whether rendering after that Undo is right was **not** measured: the probe reads the store, not the canvas. Uncertain
propagation stops at this line until a visual smoke exists.

## 10. Open questions for Alfonso

1. Adopt option 1 with the compose branch, as a core change with its Phase 2?
2. Extend the rule to M2 in the same lane (`classs`, and `enumerators` and `packages` once measured), given §6.2?
3. Is a container create (R2) one Undo step? It decides whether the append needs the compose route too.
4. Should a create inside the 450 ms window (R1) also open its own entry, or is that merge accepted?
5. Open a separate ticket for `reducer.ts:1284` (§6.4)?
