# Layer Impact Report: undo of a slot write (copy-on-write of `CompositeActionReducer`)

- Prompt-ID: `P-2026-10-03-1632` (chat `C-2026-10-03-1610`), written at the end of Phase 1 with the report
  `docs/discovery/discovery_2026-10-03_undo_inline_edit.md`; Phase 2 commits it again first if the GO amends it
- Tree: `~/jjodel-w-undoinline`, branch `undo-inline-edit`, HEAD `4cba26044` at Phase 1; at Phase 2 `e2154ebaf`, the
  trunk `49957d340` taken (lane-run and docs only, no file of this report)
- Phase 2 GO (chat, 2026-10-03): question 1 of the report adopted as recommended (RC-21, unattended): fix (A), every
  slot write undoable accepted; (B) and (C) not done. This report is committed again, amended, before the code edit.
- Go-ahead: `lane-run --critical-zone-goahead P-2026-10-03-1632` (RC-30), `goahead.txt` in the lane folder. The
  file the fix edits, `frontend/src/redux/reducer/reducer.ts`, is not in the §3.1 table. It is the core reducer
  (rule 5), named in the prompt's DOVE. This report is written because the change reaches the D-layer write path
  (§3.2: «D-layer write paths … `SetFieldAction` near sync»).

## 1. Files

| File | Change |
|---|---|
| `frontend/src/redux/reducer/reducer.ts` | `CompositeActionReducer`: the `prevAction` handed to `deepCopyButOnlyFollowingPath` is the last action whose copy changed the state, no longer `actions[i-1]` |
| `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts` (new) | the real `_reducer` under `vi.mock` stubs, red first: the batch of a canvas write (`syncUpdateFeatureValue`, row and path label) and of a non-canvas write (a direct `L(o).x.value =` on a slot that already holds a value) leave the previous state object unmutated, their delta holds the slot, `UndoAction` restores and `RedoAction` reapplies; controls: a single-action batch and a rename unchanged; one element copied once per batch |

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Undo history (statehistory deltas, computed in the reducer)
```

- **D-layer (reducer):**
  - What changes:
    - In a batch, an action whose copy changed nothing no longer counts as «the previous action» for the next
      one's copy-on-write.
    - A batch whose first `idlookup` action is a no-op now copies `idlookup` and the written element like any other
      write. Before, it assigned into the previous state's live objects. Measured on `4cba26044`: the six
      slot-write cases of the probe have `previousStateElementChanged: true` unpatched and `false` patched.
  - What does NOT change:
    - `deepCopyButOnlyFollowingPath` (its body, its no-op rule, `clonedCounter`).
    - The path sort, `PendingPointedByPaths`, `LoadAction`, rollback on an invalid path.
    - A batch with no no-op, or whose no-ops come after a changing action on the same prefix. That is the
      common case and the rename control: its copies are the same objects as today, because the previous action
      that changed is the same one `actions[i-1]` names.
  - Cross-layer interaction:
    - The L-layer reads the state through proxies created on the current state; these see the same values as today
      after the dispatch.
    - Only holders of the *previous* state object (stale snapshots, captured `c.data`) stop seeing the new value.
      That reading was a side effect of the mutation.
  - Side-effect safety:
    - The new state gets new identities for `idlookup` and the written element, as every other write already does.
    - Selectors and `UDComparator` (id + `clonedCounter`) now notice these writes. Today they miss them, and a
      re-render may be added where one was missing.
    - Cost: one shallow copy of `idlookup` per affected batch, the price every changing write already pays.
- **Undo history:**
  - What changes:
    - The delta of an affected batch holds the `idlookup` change, so Cmd+Z restores it and Cmd+Shift+Z reapplies
      it.
    - Before, it held `action_title` (and `action_description`) only. History depth is unchanged: the entry was
      pushed before too, empty.
  - What does NOT change:
    - `isRelevantChangeCheck`, the 450 ms merge (`U.objectMergeInPlace`, first-wins: the open ticket stays open),
      `doUndoRedo`, `undo`, `Uobj`.
  - Cross-layer interaction:
    - Every writer of an existing slot gets a working undo through the same reducer: canvas inline writes
      (`syncUpdateFeatureValue`: IR row, path label, ObjectNode cell, `M1PropertiesPanel`), the panels, JjScript,
      JjTL, any `.value =`.
    - That is wider than the prompt's «inline write on the canvas» (report §0, question 1).
  - Side-effect safety:
    - A write that was not undoable becomes undoable. No write that was undoable changes, as measured on the rename
      and the single-action control.

Smoke-test scenarios potentially affected:
  - probe `undo-inline-edit.ts`: the eight cases restore on Cmd+Z and reapply on Cmd+Shift+Z (patched in flight:
    35/35)
  - the four demo scenes (SM, Petri, ESM, Flow B) open without a console error, default views byte-identical to
    `d2a1866b6`
  - open an existing project → views render; save → reopen → identical state
  - the simulator panel runs a step on DemoPetri (its writes, if any reach the D-layer, become undoable)

Uncertain about propagation: no file outside `reducer.ts` changes. The widening is the subject of question 1, not a
propagation left unmeasured.
