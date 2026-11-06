# Discovery 2026-10-24 — the extra undo entry after Apply

- Prompt-ID: P-2026-10-24-0657 (`docs/prompts/claude_2026-10-24_0657_prompt_jjodie_undo_after_apply_discovery.md`, added in `84bafdc5b`), Depends P-2026-10-24-0256, chat C-2026-10-24-0020
- Session: udo · tree `~/jjodel-w-jjp-udo`, branch `jjp-udo`, HEAD `84bafdc5b` · executor: claude-opus-5-5
- Phase 1, read-only on `frontend/src`. The probe `frontend/scripts/probe/jjodie-udo-after-apply.ts` is the only code added.
- This report is a set of hypotheses with evidence, not a reference. Re-read the real files before acting on it.

## Objective

Ticket of `docs/log-inbox/jjodie-ui-s4c.md`: after a script Apply, a click on the canvas pane pushes an undo entry of its
own, titled `Create element`, holding only `pointedBy` of the new DVertex. Find its writer, whether it predates S4c, and
whether it belongs to the Apply group (R-JJD-6, R-JJD-11).

## Verdict in one paragraph

The click does not write it. When `useJjomSync` creates a DVertex, the reducer sorts the batch by path, applies
`idlookup.<graph>.subElements += <vertex>` before the vertex's own `CreateElementAction`, cannot find the vertex, and parks
the `pointedBy` write in the global `PendingPointedByPaths.all`. That queue is drained only at the start of the **next**
composite reduction, whatever it is. After an Apply the next one is the click's `EditorV2 deselect`; its delta then holds
the drained `pointedBy` (and the click's own `_lastSelected` write is a no-op), so it becomes an entry of its own. The title
`Create element` is the previous state's `action_title` restored by that delta, not the click's. It predates S4c: one
creation run outside any undo group shows the same. It is a deferred write of the Apply (of any vertex creation), not a
side effect of the click.

## Hypotheses under test

1. **H1 — the click itself writes `pointedBy` (canvas handler).** Falsified, measured. The click dispatches one action,
   `EditorV2 deselect`, with one sub-action `SetRootFieldAction _lastSelected` (probe rows `C1 click`, `C2 click`,
   `C3 click`). Positive control of the recorder: it does list the `pointedBy` sub-actions of the creation batches
   (`C2 run` rows, `pb` field: `idlookup.Pointer…_USER_33_graph2.pointedBy` from `DVertex2.new … useJjomSync.ts`).
2. **H2 — a deferred write lands on the next reduction.** Holds, measured and read. See F1–F4.
3. **H3 — it predates S4c.** Holds, measured. Case C2 (one `create instance of State "u2M"` through
   `JjScriptService.execute`, no undo group): undo 2 → 3 at the run, 3 → 4 at the click, top entry = DVertex `pointedBy`.
4. **H4 — the writer is the sync layer.** Partly. `useJjomSync` creates the vertex (F5) and is correct; the deferral is in
   the reducer and in `PendingPointedByPaths` (`joiner/classes.ts`), not in a critical-zone file.
5. **H5 — the Apply group misses it because it closes too early.** Partly. Waiting longer would not help: nothing drains
   the queue until another composite action is reduced. `flushPendingCommit` (`PreviewBar.tsx:47-50`) calls
   `COMMIT(undefined, false)`, which fires nothing when no action is pending.

## Findings

All "measured" claims: probe `frontend/scripts/probe/jjodie-udo-after-apply.ts` on `84bafdc5b` plus the probe, dev server
3014, three runs (`.agent-logs/udo-probe-20261024-065602.log`, `udo-probe2-20261024-065914.log`,
`udo-probe3-20261024-070204.log`; the numbers below are from probe3). The probe wraps `store.dispatch` and records, per
action, its sub-actions, `Action.stack`, the user's undo length, `PendingPointedByPaths.all`, and every DVertex's object
identity and `pointedBy`, before and after the reduction.

**F1 (measured) — what the click's reduction changes.** `C1 click`, t=5287, `EditorV2 deselect`, n=1, undo `1->2`.
Between the previous dispatch and the click: no vertex change (`"between":[]`). During the click's reduction each of the
three new DVertex is copied (`"ref":"6->9"`, `"7->10"`, `"8->11"`) and gains one entry:
`"added":["idlookup.Pointer1792818161024_USER_33_graph2.subElements"]`, `"pb":"2->3"`. Top entry after the click:
`"keys":["timestamp","idlookup","action_title","timestampdiff"]`, idlookup = three DVertex with only `pointedBy`
`{"2":"__jjObjDiffEmptyElem","length":2,…}`. No `_lastSelected` key: the deselect wrote the value already there.

**F2 (measured) — the queue.** `PendingPointedByPaths.all` before the click:
`["idlookup.Pointer1792818161024_USER_33_graph2.subElements -> 8514_USER_44", "… -> 8514_USER_46", "… -> 8515_USER_48"]`,
after: `[]`. It was filled by the vertex batch of the Apply (t=490, n=18, `after` lists the three `subElements` holders).
Same in C2 (one holder, drained at the click t=11587) and C3 (two holders, drained at the click t=14886). The object
batch also parks entries (`instances`, `objects`, `features`), drained by the vertex batch that follows it, inside the group.

**F3 (read) — why the vertex is not found.** `frontend/src/redux/reducer/reducer.ts:496-502`:
```
    actions = actions.sort( (a1, a2) => {
        ...
        return U.stringCompare(a1.path, a2.path);
    });
```
IDs embed the creation time (`joiner/classes.ts:597`: `return "Pointer" + new Date().getTime() + "_" + …`), so the
graph's path `idlookup.Pointer1792818161024_USER_33_graph2.subElements` sorts before the vertex's
`idlookup.Pointer1792818168514_USER_44`. The `subElements +=` write comes from the DGraphElement constructor,
`joiner/classes.ts:1153`: `this.setExternalPtr(thiss.father, "subElements", "+=");`, and the reducer adds the
`pointedBy` on the target (`reducer.ts:413-414`, `PointedBy.add`). `joiner/classes.ts:2005-2008`:
```
        let newtarget: DPointerTargetable = state.idlookup[pointed_val];
        if (!newtarget) {
            PendingPointedByPaths.new(action,state,pointed_val, casee).saveForLater();
```

**F4 (read) — when the queue is drained.** Only at the start of a composite reduction, `reducer.ts:436`:
```
    if (PendingPointedByPaths.all.length) newState = PendingPointedByPaths.getSolveableActions2(newState, oldState);
```
Nothing at the end of the batch (`reducer.ts:553-558`, the loop ends and `updateRedundancies_OBSOLETE` returns). The write
itself: `joiner/classes.ts:1885-1894` (`resolveDirectly`, copies the holder and pushes `PointedBy.new(this.action.path, …)`).

**F5 (measured) — the vertex creator.** Sub-action stack of the vertex batch in C2:
`"Constructors2.setPtr (joiner/classes.ts…)", "DVertex2.new (model/dataStructure/GraphDataElements.tsx…)",
"components/editor-v2/hooks/useJjomSync.ts…", "commitHookEffectListMount …"`. The source call is
`useJjomSync.ts:766`: `const dv = DVertex.new(0, objId, graphId, graphId, undefined, size);` (the M1 object loop). Stack
line numbers are of the transformed module; the source line was found by grep.

**F6 (read) — why it becomes an entry of its own.** `reducer.ts:1270-1274` and `1338-1350`: a delta is merged into the
previous entry only within `mergeTolerance` (`U.UpdatingTimer*1.5`, 450 ms) or when it touches `vertexs`, `edges`, ….
The click comes > 1 s after the last Apply delta (C3: last delta t=13688, click t=14886), its delta has `idlookup`, so
`isRelevantChange` is true and it is pushed (`reducer.ts:1322-1327`). Inside an open group it would be pushed and folded
(`reducer.ts:1263-1266`), but the group is closed by then.

**F7 (measured) — the title.** The delta restores the previous state, so its `action_title` is the previous state's,
`Create element` (`classes.ts:659`, `TRANSACTION('Create element', …)` of the vertex batch); the click's own title is
`EditorV2 deselect` (`reducer.ts:1235`, `ret.action_title = desc.path`).

**F8 (measured, side observation, not traced).** Every new DVertex carries `"vertexs"` twice in `pointedBy`
(`"pbAfter":["vertexs","vertexs",…]`). Candidate, read only: `reducer.ts:471-472` pushes into `action.value` in place
(`elem.pointedBy.push(PointedBy.new(statefoldername));`). Not the subject of this lane; a ticket.

**F9 (read, side observation).** `reducer.ts:1268` reads the user's stack at the `all` stack's index:
`statehistory[action.sender].undoable[statehistory.all.undoable.length-1]`. Equal lengths in single-user sessions, so
harmless here; noted only.

## Consequence for the user (read, plus the S4c probe)

Apply, then any click (or any other action) before Cmd+Z: two undos to remove the applied objects, the first one only
removing `pointedBy` entries. Cmd+Z right after Apply works (S4c case A) because `UndoAction` does not go through
`CompositeActionReducer` (`reducer.ts:1216`); the parked entries then point at removed vertices and stay queued
(`canBeResolved`, `classes.ts:1901-1906`) until a redo brings them back, which is why S4c case B saw the entry after redo.

## Fix options

**A — drain the queue at the end of the batch too (core, `reducer.ts`, not in the §3.1 table).** In
`CompositeActionReducer`, after the action loop and before `updateRedundancies_OBSOLETE` (`reducer.ts:556-557`), call
`PendingPointedByPaths.getSolveableActions2(newState, oldState)` again, so a pointer to an element created later in the
same batch is resolved in that batch's delta. Fixes Apply and every hand-made creation (C2). Tests first, in
`frontend/src/redux/reducer/__tests__/`: one batch with `graph.subElements += V` and `CreateElementAction(V)` leaves
`V.pointedBy` with the `subElements` path and the queue empty; the previous state keeps its identity
(`reducerCopyOnWrite.test.ts` style); the next unrelated action yields no `idlookup` in its delta. Mutation bench: drop the
new call, test 1 dies. Risk: every batch pays one more queue scan (empty in the common case); a rollback
(`reducer.ts:547`) still leaves the batch's parked entries queued, as today.

**B — drain inside the group (no core, `PreviewBar.tsx`).** Before `endUndoGroup`, when `PendingPointedByPaths.all` is
not empty, fire one harmless composite so its reduction drains the queue inside the group. Fixes the ticket's case only;
C2 keeps the extra entry, and the action exists only for its side effect.

Neither touches a critical-zone file (`useJjomSync.ts` is the creator but needs no change). A is a core change (rule 5)
in the file R-JJD-6 already opened for this front.

Layer Impact Report sketch, for A: D-layer only (reducer). L-layer, JjOM, canvas, sync layer and persistence unchanged;
`pointedBy` gets the same entries one reduction earlier. Smoke: create a class on M2 and an object on M1, one Cmd+Z each;
import Families.ecore, 8 edges; save, reopen, identical state.

Recommended: option A, with the reducer tests and the bench, written as a provisional R-JJD row extending R-JJD-6's core
authorisation to this second reducer change.

## Decisions taken (unattended)

1. Measured the click 4 s and 0.3 s after Apply plus one creation outside the group; did not measure an M2 class creation
   (same constructor path, `classes.ts:1153`, inferred, not measured).

## Decisions awaiting Alfonso

None from the RC-26 list: no critical-zone file, no exported interface, no ratified row amended. Whether R-JJD-6's
core authorisation covers option A is for the project chat.

## Open questions

1. Open a ticket for F8 (`vertexs` twice in every new vertex's `pointedBy`)?
