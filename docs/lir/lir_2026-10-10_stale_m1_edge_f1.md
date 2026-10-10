# Layer Impact Report: the reconcile of `useM1ReferenceEdges` scrubs `graph.subElements` (fix F1)

- Prompt-ID: `P-2026-10-10-1600` (chat `C-2026-10-10-0057`), Phase 2. Session `12ad7934-ca96-4c81-82d4-b47d947d5641`.
- Tree: `~/jjodel-w-staleedge`, branch `stale-m1-edge`, HEAD `9e1b0b7b8` (the Phase 1 report). Executor: Anthropic Claude Opus 5.5.
- Base: the draft of `docs/discovery/discovery_2026-10-10_stale_m1_reference_edge.md` §7.4, accepted with the GO.
- GO (2026-10-10): F1 only; critical-zone go-ahead granted by Alfonso at 17:16 (RC-30), carried in the resumed text
  (P16). Questions 1-4 of the report answered as recommended: no F3, no `edgesIn`/`edgesOut` scrub, no migration.
- Written before any diff (CLAUDE.md §3.2). Every claim is read in code at `9e1b0b7b8` unless marked measured; the
  measures are the report's §4 (trunk code, three probe runs).

## 0. Verdict

**One §3.2 file changes, `hooks/useM1ReferenceEdges.ts`, and no other has to.** The fix is a SetField-only write inside
an existing delete-only TRANSACTION. The removal it enables is already implemented in `useJjomSync.ts:1315-1319`, which
is read and not edited. Measured in the Phase 1 control C1: the same write, fired from the page, drops the stale React
Flow edges through that unchanged path within 1 s. `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
`VersionFixer.tsx`, `m1EdgeGate.ts` and `m1EdgeSweep.ts` stay untouched. No reason to stop with a question was found.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` | the joiner import gains `SetFieldAction`; in the delete loop of the reconcile TRANSACTION (`:190-196`), after `DeleteElementAction.new(raw)`, `SetFieldAction.new(graphId as any, 'subElements' as any, e.id, '-=', true)`; the comment above the TRANSACTION (`:185-189`), which states the falsified premise, says what the write is for |
| `frontend/src/components/editor-v2/hooks/__tests__/useM1ReferenceEdges.test.ts` (new) | the real hook body under a faked joiner barrel and mocked `react` / `react-redux`, red first on the scrub |
| `frontend/scripts/probe/stale-m1-edge.ts` | MEAS lines turned into acceptance checks (separate `chore(probe)` commit) |

## 2. Report

```
LAYER IMPACT REPORT — P-2026-10-10-1600, fix F1

Layers touched:
  [x] D-layer (Redux raw data)       graph.subElements loses the id of each M1 reference edge the reconcile deletes
  [ ] L-layer (computed proxies)     unchanged
  [ ] JjOM (model entities)          unchanged: no slot is written by the fix
  [x] Canvas v2-flow (ReactFlow)     the stale RF edge leaves through the existing incremental removal
  [ ] Canvas classic                 unchanged, except no dangling id left in subElements (its getters filter them)
  [x] Sync layer (useJjomSync hooks) useM1ReferenceEdges.ts edited (one write in its delete TRANSACTION);
                                     useJjomSync.ts, syncState.ts, m1EdgeGate.ts, m1EdgeSweep.ts read only
  [ ] Persistence (VersionFixer)     no migration; saves stop accumulating dangling ids
```

**D-layer**
- **What changes:** one `SetFieldAction(graphId, 'subElements', id, '-=', true)` per edge the reconcile deletes, in
  the TRANSACTION that already holds its `DeleteElementAction` (one composite action, one undo step, as today).
- **What does NOT change:**
  - the creation path: `DVoidEdge.new2` bare, outside any TRANSACTION (`:167-178`, Rule 12);
  - the pair key and its guard (`:146-148`, `markCanvasEdgePair`, `clearCanvasEdgePair`, Rule 13);
  - which edges are managed (`isManagedM1RefEdge`, `:44-55`);
  - which are stale (`validPairs`, `:158`).
- **Cross-layer:** `subElements` shrinks. That wakes `useJjomSync`'s `graphInfo` selector (`useJjomSync.ts:283-303`),
  and through it the incremental removal (the fix) and the populate effect (`:1059`, dependency
  `subElementIds.length`). The populate effect re-runs and finds nothing missing: the pair has no live tuple, so
  `collectMissingM1Edges` does not list it. An edge creation already re-runs it today.
- **Side-effect safety:**
  - pure actions only (editor-v2 CLAUDE.md §3.3 «SAFE»);
  - `-=` by value takes the reducer's remove-by-value branch, idempotent (`reducer.ts:298-330`);
  - order inside the TRANSACTION is free, because the reducer sorts `DeleteElementAction` last (`reducer.ts:496-499`);
  - `graphId` is the graph whose `subElements` listed the edge, by construction (`:98`, `:109-119`).

**Canvas v2-flow**
- **What changes:** after a reference-slot removal, the pair's RF edge leaves EditorV2's edges state at the next rAF
  flush (`useJjomSync.ts:1504-1506`). A stale edge no longer holds a handle slot, so the live edge of a re-added
  value keeps its handle.
- **What does NOT change:** live edges, the handles of other pairs, object-as-edge synthesis, M2 and inheritance
  edges (not managed by the hook).
- **Cross-layer:** one more edge patch through `useJjomSync`'s flush per reference removal, of the same kind as the
  addition patch a re-add already pushes (`:1525-1527`). The interaction with the S3 replay ticket is not measurable
  on the trunk (report §6); the merge that first joins F1 and `ir-graphvertex` runs `bpmn-lanes-fixture.ts`.

**Sync layer**
- **What changes:** one write in `useM1ReferenceEdges.ts`.
- **What does NOT change:** `useJjomSync` Step 3 and Step 4 and their dependencies (§3.5), `m1EdgeGate`,
  `m1EdgeSweep`, `syncState`, and `deleteM1Link` (which already scrubs on its own path).

**Undo** [read, measured in the control]
- **Today:** a slot removal is two composite actions, the slot write and the reconcile's delete. One Cmd+Z undoes
  the delete.
- **With F1:** that undo restores the `subElements` id together with the edge, so the RF edge comes back, consistent
  with the D-layer. Today the RF edge never left, so the screen reads the same.
- **Pre-existing and unchanged:** the reconcile does not re-run after that undo, because the signature is the same.
  The reference-delete lane measured the rail × this way («edge back, slot empty»). The control re-measures it.

## 3. Smoke scenarios potentially affected

- **Acceptance:** `frontend/scripts/probe/stale-m1-edge.ts` (StateMachine, R1 A1 R2 A2 R3). After each removal, 0
  pair edges at 1 s and 5 s in RF state, prop, store and DOM, and 0 dangling ids. After each add, 1 pair edge, and
  the live edge on the handle it had at baseline. Pane totals 17 / 18. The C1 control finds nothing to scrub.
- **Control:** the M1 matrix of the reference-delete lane (`_tmp_refdelete_m1.ts`, P-2026-09-30-1542), expected
  24/25 with the rail's undo the known failure, before and after the fix.
- **Unchanged by construction, covered by the suites:**
  - import Families.ecore (M2 edges, not managed by the hook);
  - open an existing project;
  - save, then reopen.

## 4. Deviations measured while building

Added after the diff (`ad08a8519`). No §3.2 file other than the hook changed, and the write is the one §2 describes.

1. **The acceptance «live edge on its baseline handles» did not hold on the target side, and that side is not
   F1's.**
   - After F1 the re-added edge enters `stop` on `right-0`; the edge at open sat on `bottom-0`.
   - The run on the unfixed code shows the same `right-0` on the first re-add.
   - The handle a stale edge takes is the source's: `top-0`, as at baseline, after F1; `top-1` then `top-2` before
     it.
   - The probe checks that handle and the stability of both handles across re-adds, and measures the target side.
     Measures in the report's Phase 2 addendum.
2. **The control's baseline is 25/25, not the 24/25 the reference-delete lane recorded.** The rail's undo now
   restores the link on the trunk before F1 too. Identical verdicts before and after F1.
