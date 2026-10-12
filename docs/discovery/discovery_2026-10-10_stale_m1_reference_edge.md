# Discovery 2026-10-10: the canvas keeps the edge of a deleted M1 reference edge

- Prompt-ID: P-2026-10-10-1600, prompt file `docs/prompts/claude_2026-10-10_1600_prompt_stale_m1_edge_discovery.md`
- Chat: C-2026-10-10-0057. Session: `12ad7934-ca96-4c81-82d4-b47d947d5641`.
- Tree: `~/jjodel-w-staleedge`, branch `stale-m1-edge`, HEAD `7a271476c` (checked equal to the commit that adds the prompt before reading).
- Executor: Anthropic Claude Opus 5.5 (session banner).
- Phase 1, read-only on sources. Tags: **[M]** measured in this phase by `frontend/scripts/probe/stale-m1-edge.ts` (three runs, port 3123, trunk code at `7a271476c`, headless Chromium 1440×900, light, fresh project); **[R]** read in code at `7a271476c`; **[R-doc]** quoted from an earlier report that measured it (named).
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

**Reproduced on the trunk, 3 runs of 3, on a plain M1 canvas. Root cause: the reconcile's delete leaves the edge id in `graph.subElements`.**

1. [M] Fixture: StateMachine import, pair Running --outgoing--> stop. A removal through the Slots panel's primitive works, and ~100 ms later `useM1ReferenceEdges` deletes the DVoidEdge from `idlookup`. Its id **stays in `graph.subElements`**, dangling. The React Flow edge stays in EditorV2's state, in React Flow's store and in the DOM, **drawn**, at 1 s and at 5 s.
2. [M] Each round trip adds one stale edge: 1, 2, 3 after R1, R2, R3. The pane draws 20 edges where 17 are right. The stale edges hold `top-0` and `top-1`, which pushes the live edge to `top-2→right-1`.
3. The ticket's premise is wrong in one word: the edge leaves `idlookup`, not `subElements`. The S3 probe's count filtered dangling ids out (`.filter((d) => d && …)`), so it could not see the difference.
4. [R+M] `useM1ReferenceEdges.ts:190-196` deletes with a bare `DeleteElementAction`, which removes the `idlookup` key only (`reducer.ts:386`). `useJjomSync` removes an RF edge only when its id leaves `subElements` (`useJjomSync.ts:1315-1319`); the property pass skips a dangling id (`:1342`). None of the prompt's three candidates is the cause: the cache key is right (RF id = D id), timing is not involved (5 s), and `m1EdgeGate.ts` only governs creation.
5. [M] Control C1: the write `m1EdgeSweep.ts:114` already makes, `SetFieldAction.new(graphId, 'subElements', id, '-=', true)`, drops all three stale RF edges within 1 s through the unchanged incremental removal (20 → 17).
6. [R] Nothing else covers this path:
   - `m1EdgeSweep` is meant for unmounted canvases (`m1EdgeSweep.ts:21`). It could not reclaim these edges anyway: it skips ids missing from `idlookup` (`:66-67`).
   - `deleteM1Link` (`canvasToJjom.ts:600-604`) and the object-as-edge delete (`:702-708`) already scrub `subElements`.
   - The hook has lacked the scrub since `125fd48f6` (2026-06-20). The sweep gained it on 2026-07-04 (`2d6ade081`); the hook did not.

**Recommendation: fix F1.** Add one line in `hooks/useM1ReferenceEdges.ts`, inside the existing delete-only TRANSACTION: `SetFieldAction.new(graphId, 'subElements', e.id, '-=', true)`, plus its import.
- Critical zone (§3.1, §3.2): full lane, LIR, go-ahead.
- Pinned by a new fake-barrel test of the hook with a mutation bench.
- Also pinned by this probe turned into acceptance checks, measured red on the trunk today.

**Sequencing.** Land F1 in its own lane before nested-vertices S2/S3. It is one line in a block that nested S3 does not rewrite, and S3 inherits it. Without F1, every edge that S3's wider reconcile deletes leaves a drawn ghost.

**Decisions awaiting Alfonso:** D1, add the general net F3 in `useJjomSync` or not. D2, clean the dangling ids already saved in projects or leave them.

**Questions**
1. F1 alone, in its own lane, before nested S2? Recommended: yes.
2. F3 (the sync drops an RF edge whose D edge left `idlookup`) as well? Recommended: not in this fix; fold it into nested S2 if D1 says yes.
3. Should F1 also scrub `edgesIn`/`edgesOut`? Recommended: no; editor-v2 does not read them and the sibling deletes do not scrub them; a ticket.
4. Clean the dangling ids in saved projects? Recommended: no migration, they are inert on reload (`GraphDataElements.tsx:762`).

## 1. Hypotheses under test and verdicts

| # | Hypothesis (from the ticket in `f4756a94b:docs/log-inbox/ir-graphvertex.md` and the prompt) | Verdict | Evidence |
|---|---|---|---|
| H1 | The defect exists on the trunk, outside graphVertex | **Holds** [M], on a plain M1 canvas with the default view | §4 |
| H2 | The reconcile's delete takes the edge out of `graph.subElements` | **Falsified** [M]: out of `idlookup`, still in `subElements` | §4, §5.1 |
| H3 | `useJjomSync` misses it because of the `rfEdgeCache` key | **Falsified** [R+M]: RF id = D id; the removal works once the id leaves `subElements` (C1) | §5.2, §4.3 |
| H4 | It misses it by timing against the delete-only TRANSACTION | **Falsified** [M]: still there 5 s later; a later, separate TRANSACTION (C1) is picked up in under 1 s | §4.3 |
| H5 | The gate in `sync/m1EdgeGate.ts` is on the path | **Falsified** [R]: it counts missing edges for Step 4 creation only | §5.3 |
| H6 | `m1EdgeSweep.ts` was meant to cover it | **Falsified** [R]: it serves unmounted canvases and skips ids absent from `idlookup` | §5.4 |
| H7 | Each round trip adds one stale edge | **Holds** [M]: 1, 2, 3 | §4.2 |
| H8 | Stale edges cost handle slots (ticket) | **Holds** [M], and on a plain canvas they are also **drawn**, not only counted | §4.2 |

## 2. Objective

Reproduce the stale RF edge on the trunk, name the line that lets it survive, check what earlier lanes did on this path, propose the smallest fix with a draft Layer Impact Report, and place it against the nested-vertices slices.

## 3. Files read (frontend/src/ unless said)

- `components/editor-v2/hooks/useJjomSync.ts`: 1-330, 330-700, 790-830, 885-915, 965-1150, 1150-1552 (whole incremental sync).
- `components/editor-v2/hooks/useM1ReferenceEdges.ts`: whole.
- `components/editor-v2/sync/m1EdgeGate.ts`, `sync/m1EdgeSweep.ts`: whole.
- `components/editor-v2/sync/canvasToJjom.ts`: 556-612, 690-712.
- `components/editor-v2/utils/jjomTransformers.ts`: 562-640 (`jjomEdgeToRFEdge` ids).
- `components/editor-v2/EditorV2.tsx`: 405-450 (edges state), 511, 539; the `<ReactFlow edges=` site (4370-4372).
- `components/editor-v2/CLAUDE.md`: whole.
- `components/editors/Info.tsx`: 925-985 (the Slots panel's `remove` and `changeDValue`).
- `model/logicWrapper/LModelElement.tsx`: 7868-7965 (`setValueAtPosition`), 7990-8030 (`set_values`).
- `model/dataStructure/GraphDataElements.tsx`: 102-103, 334-358, 758-766.
- `redux/action/action.ts`: 759-770 (`DeleteElementAction`).
- `redux/reducer/reducer.ts`: 240-420 (path writer), 480-550.
- `common/Dummy.ts`: 50-140, 195-230 (`get_delete` and its subcollection case).
- Docs: `docs/PROTOCOL.md`; `docs/discovery/discovery_2026-09-30_reference_delete.md` (§0, §1, §5, §6); `docs/discovery/discovery_2026-10-01_update_depth_loop.md` (§0, sync mentions); `nested-vertices:docs/discovery/discovery_2026-10-10_nested_object_vertices.md` (§0, §B3-B4, §G, addendum, ratification); `aa6d4b670:docs/lir/lir_2026-10-10_graphvertex_s3.md` (whole); `f4756a94b:docs/log-inbox/ir-graphvertex.md` (whole).
- Probes read: `frontend/scripts/probe/nested-vertices.ts` (whole, the base of this probe); `ir-graphvertex:frontend/scripts/probe/bpmn-lanes-fixture.ts` (edge reads, 338-345, 596-633).

## 4. Reproduction (COSA 1)

### 4.1 Method

The probe is `frontend/scripts/probe/stale-m1-edge.ts`, run with `lane-run probe … --port 3123 --id P-2026-10-10-1600`. It creates a fresh project and imports `StateMachine.ecore` and `sample-StateMachine.xmi` through the project page's file inputs. The importer lists nested objects in `DModel.objects` ([R-doc] nested report §0.1, measured there in S0), so every State and Transition gets a vertex and the M1 reference edges are drawn.

The subject is the first object whose `outgoing` slot holds two values, Running, and the first of those values, `stop`. No other tuple backs the (Running vertex → stop vertex) pair.

- **Remove**: `LValue.setValueAtPosition(index, undefined, { isPtr: true })`, which is the Slots panel's `remove` (`Info.tsx:950-956`, `let result = value.setValueAtPosition(index, undefined, {isPtr: isPointer});`).
- **Add back**: a TRANSACTION around `setValueAtPosition(index, target, { isPtr: true })`, the shape of `changeDValue` (`Info.tsx:959-977`).
- **Each snapshot reads, for the pair:**
  - the D edges listed in `subElements`, and the dangling ids there;
  - for every D edge id seen so far: its membership in `idlookup`, in `subElements`, in the source vertex's `edgesOut` and in the target vertex's `edgesIn`;
  - an `idlookup` scan;
  - EditorV2's `useEdgesState` state, read from the fiber of `EditorV2Inner` (hook index 2, located at baseline);
  - the `edges` prop of `<ReactFlow>` and React Flow's store;
  - the pane's `.react-flow__edge` elements, matched by their `aria-label`.

Steps: baseline, R1 remove, A1 add back, R2 remove, A2 add back, R3 remove, and the control C1 (§4.3), each read at t = 0, 1 and 5 s. The prompt asked for R1, A1 and R2. A2, R3 and C1 were added for the accumulation and for a control that discriminates (P12).

### 4.2 Results (run 3, `docs/discovery/assets/stale-m1-edge/probe-run3.log`; runs 1 and 2 identical in every count)

| Step, t = 5 s (C1 at 1 s) | slot `outgoing` | pair D edges live in `subElements` | dangling ids in `subElements` | pair edges: RF state / prop / store / DOM | edges in the pane |
|---|---|---|---|---|---|
| baseline | stop, fault | 1 | 0 | 1 / 1 / 1 / 1 | 18 |
| R1 remove | –, fault | 0 | 1 | **1 / 1 / 1 / 1** | 18 |
| A1 add back | stop, fault | 1 | 1 | **2 / 2 / 2 / 2** | 19 |
| R2 remove | –, fault | 0 | 2 | **2 / 2 / 2 / 2** | 19 |
| A2 add back | stop, fault | 1 | 2 | **3 / 3 / 3 / 3** | 20 |
| R3 remove | –, fault | 0 | 3 | **3 / 3 / 3 / 3** | 20 |
| C1 scrub | –, fault | 0 | 0 | **0 / 0 / 0 / 0** | 17 |

- **Every deleted id stays listed in three places**: `subElements`, the source vertex's `edgesOut` and the target vertex's `edgesIn` (`out=1 in=1` on every known id, through C1 as well, which scrubs `subElements` only).
- **The hook logged its work** (`window.__m1RefEdgesDebug`): `removing 1 stale DVoidEdge(s)` about 100 ms after each removal, and `creating 1 DVoidEdge(s)` after each add. So the reconcile does run; what it fails to do is scrub the id.
- **Handles of Running after A2**: `out:top-0 [D gone]`, `out:top-1 [D gone]`, `out:top-2`. The two stale edges keep `top-0` and `top-1`, and the live edge was given `top-2→right-1`, where at baseline it had `top-0→bottom-0`.
- **None of the edges is `hidden`.**
- **Crops are a record, not evidence** (P8): `crop_baseline.png`, `crop_after_R2.png`, `crop_after_A2.png` (extra paths into `stop`'s right side) and `crop_after_C1.png`.
- **Errors:** one console error, `init_dash`, from the dashboard before the project opens, unrelated. No page error.

### 4.3 Controls

- **The RF reads have signal.** At baseline all four RF reads give 1 for the pair and 18 in total, matching the D-layer. At C1 all four drop to 0 together. A broken fiber read would have read 0 at baseline, or would have stayed at 3 after C1.
- **t = 0 is read before the commit.** Jjodel dispatches through `setTimeout(fn, 0)` (`useJjomSync.ts:238`, «The Jjodel action system dispatches via setTimeout(fn, 0) (action.ts:349)»). Every t = 0 snapshot therefore shows the slot unchanged, which is the plausible-but-early reading P12 warns about. The verdicts rest on the 1 s and 5 s reads.
- **C1 is the discriminating control.** After R3, the probe removes the three dangling ids from `subElements` with the write `m1EdgeSweep.ts:114` makes, in one TRANSACTION, from the page, with no source edit. All three RF edges leave at 1 s and the pane count returns to 17. This holds the D-layer state as the only variable: the incremental removal of `useJjomSync`, unchanged, does its job as soon as the id leaves `subElements`.

## 5. Root cause (COSA 2)

### 5.1 The delete leaves the id in `subElements`

`hooks/useM1ReferenceEdges.ts:185-196` [R]:

> `// leaving graph.subElements drives the incremental sync to drop the RF`
> `// edge live (useJjomSync.ts:1193-1198 / 1336-1346).`
> `TRANSACTION('useM1ReferenceEdges: remove stale M1 reference edges', () => {`
> `    for (const e of toDelete) {`
> `        const raw = lookup[e.id];`
> `        if (raw) DeleteElementAction.new(raw);`
> `        clearCanvasEdgePair(e.start, e.end);`

The comment states the premise this report falsifies: nothing in the block takes the id out of `subElements`.

- `DeleteElementAction` is a `SetFieldAction` with an empty field and no value (`redux/action/action.ts:766-767`, «super(Pointers.from(me), '', undefined, undefined);»). The path writer deletes the key (`redux/reducer/reducer.ts:386`, «if ((newVal === undefined) || false && action.type === DeleteElementAction.type) delete current[key];»). [R; M: `lookup=0 subs=1` on every deleted id.]
- The removal of an id from the collections that list it rides on `Dummy.get_delete`, the `.delete()` path of an L proxy (`common/Dummy.ts:205`, «case 'subElements':», then «SetFieldAction.new(dObj.id, field, deletedID, '-=', true);»). A bare `DeleteElementAction` does not go through it.
- The reference-delete lane measured the same state on another path ([R-doc] `docs/discovery/discovery_2026-09-30_reference_delete.md` §5.1): «the 5 M1 DEdge ids are absent from `idlookup` and still listed in the M1 graph's `subElements`».

### 5.2 Why `useJjomSync` does not drop the RF edge

- **The only path that removes an RF edge needs the id to leave `subElements`.** It is `useJjomSync.ts:1315-1319` [R]: «for (const id of prevIds) { if (!currentIds.has(id)) { … if (rfEdgeCache.current.delete(id)) removedEdgeIds.add(id);». A dangling id is in `currentIds` and in `prevIds` alike, so the loop never reaches it.
- **The property pass skips a dangling id.**
  - The snapshot selector leaves out an id whose element is missing (`:1069-1070`, «const elem = state.idlookup[id]; if (elem) {»).
  - So `prevD !== dElement` and the pass enters the `try`.
  - There the proxy does not resolve and the loop moves on (`:1341-1342`, «const lProxy: any = LPointerTargetable.fromPointer(id); if (!lProxy) continue;»).
- **The cache key is not the cause.** `jjomEdgeToRFEdge` sets `id: edge.id` on both of its branches (`utils/jjomTransformers.ts:591-592`, `:606-607`). The cache is keyed on that id (`useJjomSync.ts:1304`, «rfEdgeCache.current.set(rfEdge.id, rfEdge);»). The keys match, and C1 shows the removal works with them.
- **The other two delete sites in this file knew the symptom, and worked around it.** Both drop the RF edge themselves. The cross-metamodel site says so (`:902-907`): «The D-layer delete alone does not refresh live: the incremental sync does not observe the subElements change in time, so the self-loop would linger until a full rebuild (reopen).» The diagnosis «in time» is wrong for the same reason as here: `subElements` never changes.
- **A remount clears the RF edge, not the D-layer.** On remount the stale RF edge is gone: `LGraph.edges` filters out unresolved entries (`model/dataStructure/GraphDataElements.tsx:762`, «return this.get_subElements(c).filter(c => c && c.className.indexOf('Edge') >= 0)»). The dangling id stays in `subElements` and is saved with the project. [R, not measured]

### 5.3 `sync/m1EdgeGate.ts`

The gate is not on this path. `collectMissingM1Edges` (`m1EdgeGate.ts:107-145`) counts tuples without an edge, for `missingM1EdgeCount`, which gates Step 4 creation (`useJjomSync.ts:650-656`, `:685-689`, `:1000`). Nothing in the module removes or marks for removal. [R]

### 5.4 `sync/m1EdgeSweep.ts`

The sweep was not meant to cover this, and could not.
- **Not meant to.** Its header assigns the mounted case to the hook (`m1EdgeSweep.ts:18-21`): «Called from: canvasToJjom.syncDeleteEdge / syncDeleteVertex (deferred macrotask), so cleanup happens even when no M1 canvas is mounted; useM1ReferenceEdges' reconcile pass covers the reactive (mounted) case». Its callers are the two deferred calls in `canvasToJjom.ts:462` and `:560`. [R]
- **It does carry the missing write**, with the reason (`:110-114`): «a raw DeleteElementAction does not reliably scrub the graph's subElements array (the cascade's subcollection case does it for .delete() paths only). '-=' is idempotent», then `SetFieldAction.new(graphId as any, 'subElements' as any, e.id, '-=', true);`.
- **It could not reclaim these edges.** Once the hook has deleted them it skips them as candidates, because it reads the graph through `idlookup` (`:66-67`, «const se = lookup[seId]; if (!se) continue;»).
- **History** [R, `git blame`]: the hook's delete block is from `125fd48f6` (2026-06-20, «reconcile and delete stale M1 reference edges»). The sweep and its scrub are from `2d6ade081` (2026-07-04, a commit whose message, «fix user dropdown menu», does not describe it). That commit relaxed the hook's `isManagedM1RefEdge` but did not give it the scrub.

## 6. Prior work (COSA 3)

- **Reference-delete lane (P-2026-09-30-1542, `~/jjodel-w-refdelete`, fix `c820dbb51`, in the trunk).** It did not touch this path: it changed `syncDeleteEdge`, the canvas delete of an M1 link (`canvasToJjom.ts`), and added `sync/__tests__/syncDeleteEdge.test.ts`. It did meet the same failure class and named it «ghost edges (DEdge gone, RF edge left)» (report §0, §5.1). Its fix `deleteM1Link` scrubs `subElements` itself, «the cascade's pointedBy may not list it on a loaded project» (`canvasToJjom.ts:574-575`, `:600-604`). It left Q4 open for Alfonso: the ghosts after an M2 reference delete on a loaded project, with a core net in `Dummy.get_delete` recommended. F1 follows its idiom. F3 (§7.2) would also clear Q4's canvas symptom without the core change.
- **Update-depth lane (P-2026-10-01-1655, `~/jjodel-w-updatedepth`, merged `a952056bb`).** It did not touch this path: `EditorV2.tsx`, `viewpoint/ir/useContentSize.ts`, a test. It read `useJjomSync.ts` 230-262 and excluded the sync's rAF flush as a writer in its cascade ([R-doc] its §0, «none of the reachable ones is excluded by measurement except the content-size hook and the sync's rAF flush»). Its test idiom, mocked `react` and `react-redux` around a real hook body (`viewpoint/ir/__tests__/useContentSizeLoop.test.ts:36`, `:69`), is the one F1's test reuses.
- **The S3 replay loop (second ticket in `ir-graphvertex.md`).** The trigger it names is a pending lower-priority update in the edges queue (useJjomSync's patch, flushed in a frame) while later updaters build new arrays.
  - **What F1 changes there:** a reference removal now makes `useJjomSync` push one edge patch, the removal filter at `useJjomSync.ts:1504-1506`. Today it pushes none, because nothing changes in `subElements`.
  - **What the S3 gesture already queues:** the lane-to-lane drop already creates the new pair edge in the same reconcile, so it already queues an addition patch through the same flush. That patch is `:1525-1527`, `result = [...result, ..._addedEdges]`, a new array per call.
  - **Verdict:** F1 adds one more updater of a kind already present in that gesture; it does not add a new kind. Not measured: the S3 fixture is on `ir-graphvertex`, which is not in the trunk (`git merge-base --is-ancestor f4756a94b HEAD` false). §8 says where to measure it.
- **The S3 workaround (LIR §4.3, on `ir-graphvertex`).** `suppressChannelEdges` drops, for declared channels, an edge to an object the slot no longer holds, and keeps one edge per pair. After F1 this cause produces no such edge, so the drop becomes a no-op for it. It stays harmless, and it does not conflict with F1, which touches a different file.

## 7. Fix proposal (COSA 4)

### 7.1 F1, recommended: scrub `subElements` in the hook's delete TRANSACTION

`frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts`, one file:

```ts
// :26, the joiner import gains SetFieldAction
import { DState, DVoidEdge, DEdge, DeleteElementAction, SetFieldAction, TRANSACTION } from '../../../joiner';

// :185-196, the delete batch
TRANSACTION('useM1ReferenceEdges: remove stale M1 reference edges', () => {
    for (const e of toDelete) {
        const raw = lookup[e.id];
        if (raw) DeleteElementAction.new(raw);
        // A bare DeleteElementAction removes the idlookup key only; the id has to
        // leave graph.subElements for useJjomSync's removal pass to drop the RF edge
        // (same write as m1EdgeSweep.ts and canvasToJjom.deleteM1Link).
        SetFieldAction.new(graphId as any, 'subElements' as any, e.id, '-=', true);
        clearCanvasEdgePair(e.start, e.end);
    }
});
```

- **The wrong comment goes.** The four comment lines at `:185-189` state the falsified premise and are rewritten in the same block.
- **`graphId` is the right graph by construction.** `managedM1Edges` is collected from `lookup[graphId].subElements` (`:98`, `:109-119`).
- **Order inside the TRANSACTION is free.** The reducer sorts `DeleteElementAction` last (`reducer.ts:496-499`).
- **`-=` by value is the remove-by-value branch.** It is idempotent (`reducer.ts:298-330`), and C1 measured this exact write.
- **Rule 12 is untouched.** No creator is added to the TRANSACTION, and `DVoidEdge.new2` stays bare (`:167-178`).

**Callers and consumers affected** [R]:
- **The one caller.** `EditorV2.tsx:539` `useM1ReferenceEdges(modelid, graphId);`.
- **Subscribers to `subElements`:**
  - `useJjomSync`'s `graphInfo` selector (`:283-303`) re-renders, and the incremental pass drops the RF edge (the desired effect);
  - the populate effect re-runs on `subElementIds.length` (`:1059`) and creates nothing, since the pair has no tuple; adding an edge already re-runs it today;
  - `elementSnapshots` (`:1065`).
- **Not affected:**
  - M2 reference and inheritance edges: `isManagedM1RefEdge` requires DObject endpoints (`:44-55`);
  - `m1EdgeSweep` and `deleteM1Link`, unchanged;
  - the saved shape, which simply stops accumulating dangling ids.

### 7.2 Alternatives

- **F2, delegate to `sweepStaleM1ReferenceEdges(graphId)`. Rejected.** It has the scrub, but its candidates are structural (`m1EdgeSweep.ts:39-46`, no `model` check), so it would also delete edges whose `model` resolves to a non-DReference. The hook leaves those alone (`:47-50`), so this changes behaviour. Nested S3 also rewrites both files.
- **F3, a net in `useJjomSync`. A decision for Alfonso (D1).**
  - **The change:** in the incremental pass, an id in `currentIds` whose element is missing from `elementSnapshots`, and which `rfEdgeCache` holds, counts as removed. That is about six lines next to `:1315-1319`.
  - **What it would cover:** every bare-delete path, including the reference-delete Q4 ghosts on loaded projects.
  - **What it would not do:** clean the D-layer; dangling ids would still be saved.
  - **Cost:** it sits in `useJjomSync.ts`, reserved by nested S2, and runs on every render, because the effect depends on `Date.now()` (`:1533`).
  - Not recommended for this ticket.

### 7.3 Tests that would pin it

- **`hooks/__tests__/useM1ReferenceEdges.test.ts` (new).**
  - **Setup:**
    - the joiner barrel faked as in `sync/__tests__/syncDeleteEdge.test.ts:28-39`: store, TRANSACTION with a depth counter, `SetFieldAction`, `DeleteElementAction` and `DVoidEdge.new2` as spies;
    - `react` mocked so `useEffect` runs its body at once, and `react-redux` `useSelector` reading the fake state (`useContentSizeLoop.test.ts:36`, `:69`);
    - the real `sync/syncState.ts`.
  - **Cases:**
    - a stale pair: one TRANSACTION holds `SetFieldAction(graphId, 'subElements', edgeId, '-=', true)` and `DeleteElementAction(raw)` at depth 1, and the pair guard is cleared;
    - a live pair: no write;
    - a missing pair: `DVoidEdge.new2` at depth 0 (Rule 12) and the pair marked;
    - two stale edges: two scrubs in one TRANSACTION.
  - **Mutation bench, each mutant red:** scrub dropped; scrub outside the TRANSACTION; `e.start` scrubbed instead of `e.id`; `modelid` instead of `graphId`; `+=` for `-=`; `DeleteElementAction` dropped; `new2` moved inside the TRANSACTION.
- **The probe as the acceptance gate.** Its MEAS lines become checks:
  - after each removal, at 1 s: 0 pair edges in RF state, prop, store and DOM, and 0 dangling ids;
  - after each add: 1 of each;
  - pane totals 17 / 18 / 17 / 18 / 17;
  - C1 finds nothing to scrub.

  Red on the trunk today [M: R1 at 1 s reads 1, not 0].
- **The S3 fixture probe** (`bpmn-lanes-fixture.ts`) on whichever tree first holds both F1 and `ir-graphvertex` (§8).

### 7.4 Draft Layer Impact Report (read-only, no edit)

```
LAYER IMPACT REPORT — draft, P-2026-10-10-1600 Phase 1, fix F1

Layers touched:
  [x] D-layer (Redux raw data)       graph.subElements loses the id of each M1 reference edge the reconcile deletes
  [ ] L-layer (computed proxies)     unchanged
  [ ] JjOM (model entities)          unchanged: slots are not written by the fix
  [x] Canvas v2-flow (ReactFlow)     the stale RF edge leaves through the existing incremental removal
  [ ] Canvas classic                 unchanged, except no dangling id in subElements (its getters filter them)
  [x] Sync layer (useJjomSync hooks) useM1ReferenceEdges.ts edited (one write in its delete TRANSACTION);
                                     useJjomSync.ts, syncState.ts, m1EdgeGate.ts, m1EdgeSweep.ts read only
  [ ] Persistence (VersionFixer)     no migration; saves stop accumulating dangling ids
```

**D-layer**
- **Changes:** one `SetFieldAction(graphId, 'subElements', id, '-=', true)` per deleted edge, inside the existing delete-only TRANSACTION.
- **Unchanged:** the creation path (bare `new2`, Rule 12) and the pair key (Rule 13).
- **Cross-layer:** the `subElements` change wakes `useJjomSync`'s incremental pass (the fix) and its populate effect (a no-op re-run).
- **Safety:** pure actions only (§3.3 SAFE); `-=` by value is idempotent.

**Canvas v2-flow**
- **Changes:** the pair's RF edge leaves the state within one rAF flush, so a stale edge no longer holds a handle slot.
- **Unchanged:** live edges, handles of other pairs, and object-as-edge.

**Sync layer**
- **Changes:** one write in `useM1ReferenceEdges.ts`.
- **Unchanged:** Step 3 and Step 4, their dependencies (§3.5), `m1EdgeGate`, and `m1EdgeSweep`.

**Undo** [R, not measured]
- **Today:** a slot removal is two composite actions, the slot write and the reconcile's delete. One Cmd+Z undoes the delete.
- **With F1:** that undo restores the `subElements` id with the edge, so the RF edge comes back, consistent with the D-layer. Today the RF edge never leaves, so the screen looks the same.
- **Unchanged, pre-existing:** the reconcile does not re-run after that undo, because the signature is unchanged. To be measured in Phase 2.

**Smoke scenarios potentially affected:**
- this probe (StateMachine, R/A round trips);
- import Families.ecore, 8 M2 edges (M2 edges are not managed by the hook, so unchanged by construction);
- open an existing project, then save → reopen → identical state;
- undo after a slot removal;
- the BPMN fixture of S3, lane-to-lane move and back-and-forth.

## 8. Sequencing (COSA 5)

The nested-vertices front reserves files for its slices:
- S2: `useJjomSync.ts` and `m1EdgeGate.ts`;
- S3: `useM1ReferenceEdges.ts` and `m1EdgeSweep.ts` (plus `syncState.ts` if the pending mark is chosen).

Its report (§G row S3) lists `hooks/useM1ReferenceEdges.ts`. The nested branch has S0 and the ratification only, no code yet (`git log HEAD..nested-vertices`: 4 docs commits).

**Recommendation: F1 lands before nested S2 and S3, in its own short critical-zone lane.**
- **It is orthogonal to S3's change.** S3 rewrites the hook's sources (`:69`, `:131`) and its reconcile filter (`:158`) onto the walk. F1 adds one line in the delete loop (`:191-195`). Textual conflict is unlikely, and S3 inherits the scrub.
- **It keeps S3's measures clean.** S3's acceptance counts edges («an edge drawn from a nested node survives … a slot write elsewhere», nested §G). With the bug, every edge its wider reconcile deletes leaves a drawn ghost, and the count would mix two causes.
- **It fixes a visible defect today** on every M1 canvas: the stale edges are drawn, [M] §4.2.
- **Folding it into nested S3 is the alternative.** It would delay the fix behind S2, which is larger and gated by its own LIR, and would put two causes in one acceptance.

**Where to measure the S3 replay interaction (§6).**
- If `ir-graphvertex` merges first, the F1 lane runs `bpmn-lanes-fixture.ts` after its change.
- If F1 merges first, the `ir-graphvertex` merge runs it.

F3, if Alfonso wants it (D1), belongs in nested S2's lane, since it is that slice's file.

## 9. Dependencies and risks

- **R1. More edge patches in the edges queue.** A removal now produces one (§6). This is the same kind as the additions already there; not measured on the S3 fixture.
- **R2. Undo after a slot removal.** The RF edge now follows the D-layer back; the reconcile does not re-run (§7.4). Pre-existing, now visible as a restored stale edge until the next slot change.
- **R3. Dangling ids already saved** in projects edited since 2026-06-20 stay in `subElements`. They are inert on reload (`GraphDataElements.tsx:762`). Two things count them:
  - `subElementIds.length` (Step 4's dependency);
  - the incremental pass's loops.

  D2.
- **R4. `edgesIn`/`edgesOut` keep the deleted ids** [M, `out=1 in=1`]. No reader was found in editor-v2:
  - the search: `command grep -rn 'edgesIn\|edgesOut'` over `components/editor-v2` without tests, 13 lines, every one a comment or one of the two retarget writes (`useJjomSync.ts:980-981`); 9 lines are in `useJjomSync.ts`, 4 in `utils/refEdgeReconcile.ts`;
  - the positive control: the same command over `frontend/src` returns 58 lines.

  Two comments claim the opposite, that DeleteElementAction maintains the reciprocals «via pointedBy» (`useJjomSync.ts:796`, `:894-896`). That is measured false on this path only. A ticket, Question 3.

## 10. Open questions

1. F1 alone, its own lane, before nested S2? Recommended: yes.
2. F3 as well? Recommended: not here; in nested S2 if D1 says yes.
3. Scrub `edgesIn`/`edgesOut` in F1? Recommended: no, a ticket for every bare edge delete.
4. Clean the dangling ids already saved? Recommended: no migration.
5. Correct the S3 ticket's «gone from the graph's subElements»? Recommended: the log is add-only (R-RAIL-45); this report and the inbox entry carry the correction.

## Decisions taken (unattended)

- **Subject.** StateMachine import, Running --outgoing--> stop, on the default M1 canvas, no IR view. It is the smallest committed fixture that draws M1 reference edges; no fixture was built by hand.
- **The two writes are the panel's own primitives:**
  - the removal is `setValueAtPosition(index, undefined, { isPtr: true })`, the Slots panel's `remove`;
  - the add-back is a TRANSACTION around `setValueAtPosition(index, target, …)`, as `changeDValue` does.
- **The probe goes beyond the prompt's R1-A1-R2.** It adds A2 and R3 for the accumulation, and the in-page control C1. C1 is a runtime write in the throwaway profile, not a source edit.
- **The RF state is read from the React fiber** (EditorV2Inner, hook 2). It agreed with the React Flow prop, store and DOM at every one of the 19 snapshots of each run.
- **Report, assets and inbox entry go in one docs commit**, as the prompt's COME asks; the `discovery-report` skill says the report alone. The probe is in its own `chore(probe)` commit.

## Decisions awaiting Alfonso

- **D1. F3, the general net in `useJjomSync`.** It would close the canvas symptom of every bare edge delete, the reference-delete Q4 ghosts included. It hides rather than cleans the D-layer, and it lives in nested S2's file. Recommended: decide with nested S2; not in the F1 lane.
- **D2. Dangling ids in saved projects.** Leave them, or clean them on load (a VersionFixer step or a load-time scrub). Recommended: leave them; they are inert on reload.

## Assets

`docs/discovery/assets/stale-m1-edge/`:
- `probe-run1.log`, `probe-run2.log` and `probe-run3.log`: run 1 is without the `edgesOut`/`edgesIn` read, run 2 without crops;
- `probe-run3.json`;
- `crop_baseline.png`, `crop_after_R2.png`, `crop_after_A2.png` and `crop_after_C1.png`.

The probe is `frontend/scripts/probe/stale-m1-edge.ts`. The lane folder `~/.jjodel-lanes/P-2026-10-10-1600/` keeps the vite log.

## Addendum 2026-10-10, Phase 2 (fix F1, code `ad08a8519`)

GO of 2026-10-10: F1 only, questions 1-4 answered as recommended. Alfonso's critical-zone go-ahead was given at 17:16
and recorded for the session (`goahead.txt`) at 17:40, after the first resume stopped on the hook (`Outcome:
question`). The GO's prompt file named in that message, `docs/prompts/claude_2026-10-10_1600_fase2_stale_m1_edge_f1.md`,
is not in this tree; its text is the GO message itself.

**Commits.**
- `df7904064`: the LIR, `docs/lir/lir_2026-10-10_stale_m1_edge_f1.md`.
- `ad08a8519`: the fix and its test.
- `82b4b71c6`: the probe's acceptance checks.
- This commit: measurements, this addendum, LIR §4 and the inbox entry.

**Fix.** It is §7.1 as written: `SetFieldAction` imported, and one write after `DeleteElementAction.new(raw)` inside the
delete-only TRANSACTION. The comment above the TRANSACTION now says what the write is for. Nothing else in the file
changed; the header's «Add-only by design» paragraph is stale since `125fd48f6` and was left alone (rule 8).

**Test and bench** [M]. `hooks/__tests__/useM1ReferenceEdges.test.ts`, 7 tests:
- red first (4 failed, the 3 unchanged-path tests passed), 7/7 on the fix;
- mutation bench, 10 of 10 killed, each mutant written and the fixed text restored in one process, file hash identical
  after. The mutants:
  - scrub dropped;
  - scrub outside the TRANSACTION;
  - `e.start` for `e.id`;
  - `modelid` for `graphId`;
  - `+=` for `-=`;
  - `isPointer` false;
  - the first stale id for every edge;
  - `DeleteElementAction` dropped;
  - pair guard kept;
  - `new2` inside a TRANSACTION.

  None of the mutants failed at import: every bench run reported 1 to 4 failures out of 7.

**Gates** [M]:
- typecheck: exit 2, 14 errors, the §17 baseline set;
- hooks 175/175 and editor-v2 3455/3455;
- full suite: 7735 passed, the 9 known files red at import (`window is not defined`). It ran with
  `JJODEL_CRITICAL_ZONE_GOAHEAD` unset, because of the known leak into `criticalZone.test.ts`;
- `npm run build`: exit 0;
- `check:scripts`: exit 0.

**Acceptance** [M] (`frontend/scripts/probe/stale-m1-edge.ts`, port 3123, 3 runs in this phase: the two below and the strict-handles run discussed after them):

| Run | Code | Result |
|---|---|---|
| `probe-run4-before.log` | trunk before F1 | 31 checks failed: 1, 2, 3 stale pair edges, the dangling ids, 18 → 20 drawn |
| `probe-run4-after.log`, `probe-run4-after.json` | `ad08a8519` | **50/50**: after every removal 0 pair edges in state, prop, store and DOM at 1 s and 5 s, 0 dangling ids, 17 drawn; after every add 1 pair edge and 18 drawn; C1 has nothing to scrub |

- **A deviation from the GO's wording, declared.** The GO asked that «the live edge keeps its handle».
  - A first after-run (`probe-run4-after-strict-handles.log`) checked both baseline handles. It failed only on the
    target side: the re-added edge enters `stop` on `right-0`, the edge at open on `bottom-0`.
  - The unfixed run shows `right-0` on its first re-add as well (`top-1->right-0`), so that side is chosen when the
    edge is created and does not depend on staleness.
  - The check now holds the handle a stale edge takes, Running's source handle. After F1 it is `top-0` at every
    re-add, as at baseline. Before F1 it was `top-1`, then `top-2`.
  - It also checks the two handles are the same at every re-add (`top-0->right-0`, both runs).
  - The target side against baseline is a MEAS line.
- **Crops** (record): `crop_baseline-after.png`, `crop_after_R2-after.png`, `crop_after_A2-after.png` and
  `crop_after_C1-after.png`. After A2 one edge enters `stop`; before F1 there were three.

**Control** [M]. The reference-delete lane's M1 matrix (`_tmp_refdelete_m1.ts` of P-2026-09-30-1542, copied as a
gitignored `_tmp_` file into this tree and run unchanged):
- **25/25 before F1 and 25/25 after**, every verdict identical (`control-refdelete-m1-before.log`,
  `control-refdelete-m1-after.log`). That lane recorded 24/25 on 2026-09-30, its one failure the rail's undo. On
  today's trunk the rail's undo restores the link too, before F1 as well, so a later lane changed it, not this one.
- **Limit of that probe.** Its `rf` count reads only the DOM edges whose id is still in `idlookup`, so it cannot see a
  stale RF edge. This is the same blind spot as the S3 count (§0.3). Its «link gone from canvas» on the rail path
  passed before F1 while the stale edge was drawn.

**Not measured.**
- The S3 fixture (`bpmn-lanes-fixture.ts`) after F1: `ir-graphvertex` is not on the trunk. The merge that first joins
  F1 and that branch runs it (LIR §2).
- Undo of a slot removal through the acceptance probe: the control's rail path covers the panel's primitive and its
  undo.
