# Layer Impact Report: JjTL write-back without silent loss (P-2026-11-03-1033)

**Prompt-ID**: P-2026-11-03-1033. **Prompt**: `docs/prompts/claude_2026-11-03_1033_prompt_*` (the commit `5c998f059` adds it).
**Chat**: C-2026-11-03-1020. **Tree**: `~/jjodel-w-jjtlflush`, branch `jjtl-writeback-flush`, HEAD `5c998f059` at the start.
**Ticket**: #482 (`docs/log-inbox/hw-notation.md`, 2026-11-03). **Evidence base**: `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md` §0, §5, §6.

Written before any edit. Line numbers are those of `5c998f059`. None of the files of `CLAUDE.md` §3.1 is edited; the report
is owed because the timing of what `useJjomSync` receives changes (prompt, DOVE).

## What changes, read on the code

The race, read: every `LValue.addObject` of the walk runs `TRANSACTION(...)` (`LModelElement.tsx:7413`), which nests inside
the app's always-open block (depth 1, `action.ts:103-140`), so its actions wait in `pendingActions` for the interval's
`COMMIT(undefined, false)` every `U.UpdatingTimer` = 300 ms (`reducer.ts:1513`), whose dispatch is itself a
`setTimeout(0)` (`action.ts:349`). The nested-attribute writer starts on a fixed `setTimeout(1000)` after the walk
(`ProjectEditor.tsx:2282-2289`). When long tasks hold the thread past both due times, the interval runs first, queues its
dispatch behind the writer's already-due timer, and the writer reads the last level before the store holds it.

The `addObject` seeding timer (`U.UpdatingTimer * 2`, `LModelElement.tsx:7432-7467`) iterates the json it was given; the walk
always gives `{}` (`nestedMaterialization.ts:170-172`), so that timer writes nothing the writer depends on. To be confirmed
by the probe (prompt item 2), not assumed: the writer is gated on the slots answering, not on that timer.

1. **Flush, then wait for the slots** (`ProjectEditor.tsx` STEP 8, `nestedMaterialization.ts`): the writer no longer starts
   on a fixed timer. It yields one macrotask (so every `TRANSACTION` continuation of the last level has run its `END`),
   makes the interval's own call `COMMIT(undefined, false)` now, yields one more macrotask (the dispatch is a
   `setTimeout(0)`), then polls, every 50 ms and for a bounded time, until every queued object resolves and every attribute
   it carries has its `$slot`. It then writes, and counts what it could not write.
2. **Report** (`ProjectEditor.tsx`, `nestedMaterialization.ts`): objects and attribute values not written are sent with the
   existing `SystemEvents.JJTL_NESTED_MATERIALIZED` event, in a new optional field of `NestedMaterializationReport`.
3. **Per level, optional** (`nestedMaterialization.ts`, an optional `flush` in `NestedDeps`): the walk may make the same
   flush before polling each level, instead of waiting up to 300 ms for the interval. Kept only if the probe on `c60` shows
   it removes the floor without worsening the longest task; otherwise left out and named.

## LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)          (timing only: the same CompositeAction the interval would dispatch, sooner)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)  (indirect: useJjomSync receives the last level sooner)
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)    (indirect, not edited: the timing of its input)
  [ ] Persistence (VersionFixer / jsxString)
```

### D-layer
- What changes: when the pending block is dispatched. `COMMIT(undefined, false)` is the interval's own call
  (`reducer.ts:1513`), with the same `deep = false`; the same precedent runs in JjScript (`settlePendingWrites`,
  `jjscript/executor/commands/instance.ts:410-414`). Attribute values are written by the same `writeAttribute`, through the
  same `$slot.value` / `setValueAtPosition` forms, sooner and only once their slot answers.
- What does NOT change: no action type, no reducer, no new field in the store, no `TRANSACTION` around a creator (NN-12):
  the flush wraps nothing and is called outside any `TRANSACTION`. If the depth is above 1 at the call (a `TRANSACTION`
  mid-flight), `COMMIT(undefined, false)` is a net no-op (`END` then `BEGIN`) and the poll falls back to the interval.
- Cross-layer interaction: none new; the order of creation then attribute then pointer writes is kept (pointers still
  after attributes).
- Side-effect safety: the flush can dispatch actions queued by something else in the same block (a `DVertex.new` of
  `useJjomSync`, a user edit); the interval would dispatch them at most 300 ms later in the same composite, so their order
  is unchanged.

### Canvas v2-flow and sync layer
- What changes: `useJjomSync` receives the last level's objects up to 300 ms sooner (item 1), and, with item 3, each level
  up to 300 ms sooner; the attribute writes arrive about 1 s sooner. The number of level commits stays one per level.
- What does NOT change: `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
  `useM1ReferenceEdges.ts`, `DynamicHandles.tsx` are not edited; the tab still opens on the 2,000 ms timer (STEP 7, next lane).
- Risk: removing the idle gaps between levels (item 3) can join React work that was spread over gaps into longer tasks.
  Measured before and after (longest task, page quiet); a figure that worsens is reported.

Smoke-test scenarios potentially affected:
  - b11_9 (5,119 objects), tab open: 2,560 of 2,560 `Const` keep `num`, three runs of three
  - b10_8 (2,559) under heavy load: every `num` written
  - a forced failure of the wait: the output panel names the objects and attributes not written
  - b7_7, b10_8, b11_9, c60: click to attributes written, longest task, page quiet, before and after
  - the nested-materialization unit tests stay green

Uncertain about propagation? No STOP: the only cross-layer effect is timing, and it is measured.
