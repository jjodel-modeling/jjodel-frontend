# Discovery 2026-10-01: «Maximum update depth exceeded» on a drag under a derived viewpoint

- Prompt-ID: P-2026-10-01-1655 (`docs/prompts/` prompt of the same id), Phase 1, read-only. Chat C-2026-10-01-1640.
- Tree: `~/jjodel-w-updatedepth`, branch `update-depth-loop`, HEAD `6c1856a62` (trunk `4b018b82b` plus the prompt file).
- Executor: Claude Opus 5.5 (`claude-opus-5-5`). Written under the chat's stop at 120 min: what is measured, what is read, and
  what is still open, said as such. This report is a set of hypotheses with evidence, not a definitive reference.

## 0. Answer in brief

**Reproduced, not on demand.** Hand-made FlowChart fixture (below), «FlowChart (derived)» with the Generic notation, node
`start` dragged 30 steps to the midpoint of an edge and back, as the third drag of a fresh page: the canvas dies with
«Maximum update depth exceeded», the `<Try>` fallback replaces the pane (`.try-message`, `window.tryreport` set), the same
console as Alfonso's (`The above error occurred in the <StoreUpdater> component`). Rate: 2/2 (runs iter2, iter4), then 2/3
(iter12), then 0/3 (iter13) and 0/1 (iter14) with the same sequence; 0/131 on DemoFlowB over four notations; 0/147 in the three
runs where EditorV2's `setEdges` was wrapped by the probe (iter5-7), 0/98 on a sweep of every node onto every edge midpoint.
Always the third drag of the page, never later: a timing window, not a position.

**What the loop is (measured at the crash):** React's own `nestedUpdateCount` reached 51; StoreUpdater pushed a new `nodes`
array 54 times in one task, with **no** `setNodes` from anyone in between (EditorV2, the instance API and the hook all
instrumented); `useContentDrivenSize` wrote **0** times; of `useIRContainment`'s memo dependencies only `edges` moved, on every
nested render. Every update scheduled at nested depth 20..24 (60 of 60 captured) has the same stack:
`updateStoreInstance → forceStoreRerender` inside `flushPassiveEffects` at the end of a sync `commitRoot`, i.e. the
`useSyncExternalStore` consistency check of some subscriber whose snapshot differs after each commit.

**Root cause: not confirmed.** The writer of EditorV2's `edges` inside the cascade, and the subscriber whose snapshot moves, are
not identified yet (§3.4). Candidates are listed with file and line in §3; none of the reachable ones is excluded by
measurement except the content-size hook and the sync's rAF flush.

**Recommendation:** Phase 2 confirms the subscriber with the uSES recorder already in the probe (§4), then fixes it; failing a
confirmation, it closes every unbounded path of §3 (cached snapshots, equality-guarded module stores and effect writers, the
content-size budget that a new target refills), each with a red-first test, plus an error boundary around the canvas inside
EditorV2 so a loop costs the canvas and not the tabs.

**Decisions awaiting Alfonso:** none (RC-26: critical-zone edit under the RC-30 go-ahead of the launch; no persisted data; no
exported interface; no demo content change).

**Questions**
1. Fix without a confirmed root cause? Recommended: yes, the generic guards of §5, each red-first; the demo is on 2026-10-07.
2. The canvas error boundary (COSA 4)? Recommended: yes, small, inside EditorV2.tsx, around `flowCanvas` only.

## 1. Files read

- `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (whole), its two tests (`useContentSizeDrop.test.ts`,
  `useContentSizeUnmount.test.ts`), `IRNodeContent.tsx` (55-110, 180-300, 440-560), `useIRContainment.ts` (whole),
  `irJunctions.ts` (1-60), `irStyle.ts` (ir-sized rules, 80-215)
- `frontend/src/components/editor-v2/EditorV2.tsx` (373-580, 880-905, 1230-1560, 2985-3010, 3380-3420, 3700-4092, 4140-4215)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (90-140, 380-440, 895-1000), `problems/NodeProblemOverlay.tsx`
  (105-170), `problems/useNodeProblems.ts`, `problems/ValidationFreshnessSync.tsx` (40-70), `problems/registry.ts` (120-175),
  `hooks/useJjomSync.ts` (230-262), `edges/UnifiedEdge.tsx` (170-240, 560-600), `edges/SegmentHandles.tsx` (1-60, handlers),
  `utils/edgeLanes.ts` (404-421), `forEndUser/Try.tsx` (1-80, 150-260)
- `node_modules/@xyflow/react` 12.10.2 `dist/esm/index.mjs`: `StoreUpdater` (273-327), `useQueue`/`BatchProvider` (880-990),
  `useReactFlow().setNodes` (1040-1060), `getElementsDiffChanges` (801-820), `useNodeObserver` (2054-2099),
  `updateNodeInternals` (3313-3334); `react-dom` 18 development: `checkForNestedUpdates`, `updateStoreInstance`,
  `checkIfSnapshotChanged`, `forceStoreRerender`
- `docs/discovery/discovery_2026-09-30_derived_size_leak.md`, `docs/PROTOCOL.md` P16, `docs/decisions.md` RC-20..RC-34

## 2. Reproduction

Probe `frontend/scripts/smoke/_tmp_updatedepth_probe.ts` (gitignored, with `_tmp_updatedepth_scenario.js`), run against a Vite
of this tree on 3157 (`_tmp_lane_vite_3157.config.ts`, cacheDir in `/tmp`), headless Chromium, light, 1600x1000, DPR 2,
isolated profile. Positive control that the page runs ResizeObserver and rAF: 25-33 RO callbacks, 1.7k-48k rAF ticks per run.
Instrumentation goes in through Playwright route patches of the served modules; no tracked file was touched for it.

Fixture `fc`: metamodel FlowChart, `FNode` (abstract, `label:EString`, `next:FNode[0..*]`) with Start, End, Process
(`description`), Decision (`condition`), InputOutput; `Flow{source,target:FNode,label}`. Model `model_1`: start, readOrder,
validate, isValid, ship, reject, end; seven Flow objects and the same wiring as `next` references; labels set. The flowchart
bag is applied (binder), the viewpoint derived with `createDerivedViewpoint` (Generic), activated, fitted.

Crashing sequence (iter2, iter4, iter12 runs 1 and 3): on `start` (200x78 at screen 351,180): `fast30` (to +140,+70 and back,
30 steps), `slow40` (to -90,+110 and back, 40 steps of 16 ms), `overEdge` (to the midpoint of the third rendered edge and back,
30 steps). The crash falls inside `overEdge`.

| run | sequence | drags | crashes |
|-----|----------|-------|---------|
| iter1, DemoFlowB, generic/flowchart/ISO/activity | all kinds | 131 | 0 |
| iter2, fc, four notations | all kinds | 3 | 1 (third drag) |
| iter3, fc, generic | overEdge only | 7 | 0 |
| iter4, fc, generic | fast30, slow40, overEdge | 3 | 1 (third drag) |
| iter5-7, fc, generic, `setEdges` wrapped by the probe | same | 147 | 0 |
| iter8-9, 11, fc, generic | same | 147 | 0 |
| iter10, fc, generic | every node onto every edge midpoint | 98 | 0 |
| iter12 (three runs) | same as iter4 | 3+21+3 | 2 |
| iter13 (three runs), iter14 (one) | same | 79 | 0 |

Counters at the crash (iter4): React `nestedUpdateCount` max 51 (over 10: 12001 checks); StoreUpdater `nodes` pushes in one
task 54; `useContentDrivenSize` writes 0, inactive drops 0, unmounts 7 (the teardown); `useIRContainment` deps moved over the
drag: `nodes` 918, `edges` 969; the last 12 nested renders moved `edges` only. The last 50 entries of the setter ring are
StoreUpdater pushes about 20 ms apart, no `setNodes` between them; before the loop, the sync's rAF flush
(`useJjomSync.ts` `scheduleFlush`) and the drag's `onNodesChange` (`EditorV2.tsx` `handleNodesChange`). Console, besides the
fatal error: React's passive warning «Maximum update depth exceeded … useEffect …» attributed to `NodeWrapper`.

## 3. Candidate writers

### 3.1 Confirmed as the mechanism (measured)
- The cascade is a `useSyncExternalStore` consistency loop: 60/60 stacks at depth 20..24 are
  `updateStoreInstance → forceStoreRerender` in passive effects flushed synchronously by `commitRootImpl` (sync lane). A
  subscriber reads a snapshot that is not `Object.is` the one it rendered with, after every commit.
- Each nested render hands EditorV2 a new `edges` state (`EditorV2.tsx:1480` `stableEdges` moves, so a structural field of an
  edge changes), so the `useIRContainment` memo (`EditorV2.tsx:1506`) rebuilds `nodes`, and StoreUpdater pushes them.

### 3.2 Excluded (measured or read)
- `useContentDrivenSize` (`viewpoint/ir/useContentSize.ts`): 0 writes in the crashing drag. Excluded as this loop's writer.
  It still has an unbounded path by reading, closed in Phase 2 (§5.4).
- The sync's flush (`hooks/useJjomSync.ts:254-257`): runs in `requestAnimationFrame`, a task of its own; seen before the loop
  only.
- Instance `setNodes` writers in `ObjectNode.tsx` (337-473, 1017, 1130), `NodeProblemOverlay.tsx:164`, `useAlignment.ts`:
  event handlers (read); none in the ring during the loop.
- `EditorV2.tsx:3398` (context-menu «Reset routing») and `:4044` (`recalculateAnchors`, called by SegmentHandles after a
  segment drag): event paths (read).

### 3.3 Not excluded (read; reachable inside a cascade)
- `EditorV2.tsx:399-417`, the dedup wrapper of `setEdges`: when `selectedEdgeIdRef` holds an id, every call rebuilds every edge
  with `selected` forced (`:410`), whatever the updater returned, so an updater that returns its input unchanged still commits
  a new array. Not a loop alone (`stableEdges` compares fields), but it voids every equality guard written upstream of it.
- `EditorV2.tsx:1310-1428`, the distribution guard: a `useLayoutEffect` that calls `setEdges` (`:1349`); converges by its
  topology key unless another writer moves the handles between two of its runs.
- `EditorV2.tsx:1253`, `applyDistribution` calls `setLaneShifts` (`utils/edgeLanes.ts:404-408`), a module store whose revision
  is bumped on every call, equal or not; read by `UnifiedEdge.tsx:375` as a memo dependency (no subscription). Not
  `portDistribution.ts`: `applyDistribution` lives in EditorV2.tsx and calls `computePortDistribution` from it read-only.
- `EditorV2.tsx:545-576`, a `useEffect` that calls `setEdges` with an equality-guarded updater (voided by the wrapper above).
- Direct `useSyncExternalStore` sites (getSnapshot read): `problems/useNodeProblems.ts:11,19,27` (cached per node in
  `registry.ts:138-163`), `problems/ValidationFreshnessSync.tsx:51` (`getFreshness(modelId)`, caching not verified),
  `sim/simRunState.ts:293,307` (versions), `viewpoint/ir/irEdgeInteraction.ts:128`, `viewpoint/ir/irCollapseState.ts:61`
  (versions). react-redux `useSelector` and xyflow `useStore` memoise per store snapshot, so they loop only if their selector
  reads state outside their store, as `useIRContainment.ts` `oaeSlotsSig` does (`getEdgeObjectKeys`, `crossDepsSignature`,
  published by the memo itself).

### 3.4 Open
Which subscriber's snapshot moves after each commit, and which writer changes `edges` in each nested render. The probe's uSES
recorder (component chain, previous and next snapshot, from depth 12) and the per-field edge diff are in place; the runs that
carried them did not crash (iter13, iter14).

## 4. Dependencies and risks

- React Flow is controlled in EditorV2 (`nodes=`, `edges=`, `onNodesChange=` at `EditorV2.tsx:4157-4159`): every setter reached
  in a layout or passive effect of a sync commit is a nested update.
- The window is timing-bound (third drag of a fresh page, about one run in two); a fix verified by «0 crashes» needs many runs
  and the counters (React's nested depth max per drag), not the crash alone.
- The fallback today is the app-level `<Try>` above `ModelTabComponent`: the rail and the tabs go with the canvas.

## 5. Options for Phase 2

1. Confirm with the recorder of §3.4 (bounded: 20 minutes) and fix the subscriber or writer it names.
2. Failing that, close every unbounded path of §3.3: a getSnapshot returns a cached value when nothing changed; a module store
   does not bump or notify on an equal value; the `setEdges` wrapper keeps the reference when the updater returned its input and
   the selection is already in place; effect writers are equality-guarded.
3. `useContentDrivenSize`: drop the budget reset on a new target (`useContentSize.ts:219`, `if (!sameTarget) unaccepted.current
   = 0`) and cap its writes per vertex within one synchronous cascade (red-first test
   `__tests__/useContentSizeLoop.test.ts`, written, not run yet).
4. A small error boundary around `flowCanvas` in `EditorV2.tsx`, so a loop leaves the rail and the tabs alive.

## 6. Layer Impact Report (options 2-4)

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Canvas v2-flow:
  - What changes: fewer React Flow state writes (a setter that would commit an equal value keeps the
    reference); the content-size hook writes at most its budget per vertex per cascade and never
    refills it on an oscillating target; a loop that still escapes is caught inside the canvas.
  - What does NOT change: derived sizes at rest, isResized precedence, the unmount drop of
    P-2026-09-30-1625, edge handles, selection semantics, the sync.
  - Cross-layer interaction: none written; reads only.
  - Side-effect safety: useJjomSync.ts, canvasToJjom.ts, portDistribution.ts, syncState.ts untouched.

Smoke-test scenarios potentially affected:
  - the crashing sequence of §2, replayed at least 20 times per derived viewpoint: 0 crashes, nested depth well under 50
  - the four demo scenes in the default viewpoint: 0 px from 4b018b82b
  - DemoFlowB derived viewpoints at rest: 0 px
```

## 7. Decisions taken (unattended)

None in Phase 1.

## 8. Decisions awaiting Alfonso

None (RC-26 list checked).
