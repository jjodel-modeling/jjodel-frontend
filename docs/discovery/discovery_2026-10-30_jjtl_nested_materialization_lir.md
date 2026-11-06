# Layer Impact Report 2026-10-30: recursive materialization of JjTL nested creations (P-2026-10-30-1335, Phase 2 plan)

- Prompt-ID `P-2026-10-30-1335`, written in the continuation `P-2026-10-30-1440`, chat `C-2026-10-30-1253`, front
  `release-3-2`, lane full (D-layer write path of STEP 6c in `handleExecuteTransformation`). Session
  `e3d18de7-3dbf-4779-8780-b936eea0a595`. Executor: Anthropic Claude Opus 5.5.
- Tree `~/jjodel-w-jjtlmat`, branch `jjtl-nested-materialization`, HEAD `77b2af9b8`. Critical-zone go-ahead for the
  STEP 6c write path: Alfonso, 2026-10-30 13:28 (1335 prompt header), valid for Phase 2 after the hard stop is answered.
- Written before any diff (CLAUDE.md §3.2). Evidence: `docs/discovery/discovery_2026-10-30_jjtl_nested_materialization.md`
  (F1-F10 read, X1-X5 measured). Tags: **M** measured by the probe, **R** read in a file.
- This report is a set of hypotheses with evidence; whoever uses it re-reads the real files.

## 0. Answer in brief

The change stays in `ProjectEditor.tsx` (STEP 6c, the collection step it needs, the STEP 8 guard) plus a pure walker
module. It writes the D-layer only through primitives it already uses (`LValue.addObject`, slot writes by id), reads
the L-layer by id, and touches no sync file (`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`,
`useM1ReferenceEdges.ts`, `portDistribution.ts`), no `VersionFixer.tsx`, no default-view source. New: one deferred wait
per tree level (measured need, X1), so the run ends later than today; nothing else changes order.

## 1. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)
  [x] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

**D-layer.**
- What changes: `DObject`s at depth >= 2 are created, by the same call as depth 1 today:
  `slot.addObject(json, childClassName)` (`ProjectEditor.tsx:2016`), which wraps `DObject.new3` in its own TRANSACTION
  (comment 1966-1969). Attribute `DValue`s at every depth are written by id through `writeAttribute`
  (2091-2115: `feature.value = ...`, `setValueAtPosition` for enums), the path depth 1 already uses (2144-2169). If
  question 2 of the report is answered «`{}` for all», `name` moves from the `addObject` json to that deferred write.
- What does NOT change: the roots (`DObject.new` inside the STEP 6 TRANSACTION), root-level name resolution and
  R-S1-5, STEP 8/8b for roots and references, the model creation and naming (1619).
- Cross-layer: none beyond the L-layer reads below.
- Side-effect safety: no creator is nested in a TRANSACTION. Each `addObject` stays a top-level call made from a timer
  callback, as today. No outer TRANSACTION is added around a level (rule 12, §3.3). The deferred attribute pass has no
  creator, so it could be one TRANSACTION, but today it is not; Phase 2 does not change that.

**L-layer.**
- What changes: below depth 1, parents are reached by `LPointerTargetable.fromPointer(id)` with the id `addObject`
  returned (M: the returned id is the store id, X1 `idsInStore`), never by name. The per-level wait reads
  `obj['$' + feature]` until it is a `DValue` proxy with `addObject` (X1, X2, X4).
- What does NOT change: `lModel.objects` stays the name pool of the roots (`frontend/src/jjtl/CLAUDE.md`, «Nested
  children are resolved by the id `LValue.addObject` returns»).
- Cross-layer: the slot appears in the store 90-316 ms after the creation (M); reading it earlier returns `undefined`,
  which is why each level waits.
- Side-effect safety: the reads are getters; the wait does not write.

**Canvas, sync, JjOM, persistence.** Not touched. The output model is opened in a tab as today; the model editor shows
the deeper objects when they land. Nothing in the sync layer reads `__nested`.

## 2. TRANSACTION boundaries

| Step | Today | Phase 2 |
|------|-------|---------|
| STEP 6 roots | one TRANSACTION, `DObject.new` per root | unchanged |
| STEP 6c depth 1 | `addObject` per child, each its own TRANSACTION, inside the STEP 8 timer | unchanged call, json per question 2 |
| depth k >= 2 | not created | `addObject` per child after level k-1's slots answer, each its own TRANSACTION, never wrapped |
| child attributes | one pass, +1000 ms after STEP 6c | one pass, +1000 ms after the last level (X5 measured at +1000 ms) |

`TRANSACTION` is async (`action.ts:210-226`); STEP 6c does not await it today and Phase 2 does not either: the
per-level wait checks the slots, not the transaction.

## 3. Deferred timers

- STEP 8 timer: +1000 ms after the roots (unchanged); its guard gains `pendingNestedCreations.length > 0`
  (report F6, question 3).
- Per level: wait for the created children's slots (report question 1: poll by id every 50 ms, cap 3000 ms). Measured
  worst case 316 ms per level, so a six-level tree adds about 2 s at measured speed and at most 15 s at the cap.
- `addObject`'s own seeding: `U.UpdatingTimer * 2` = 600 ms (comment 2141-2143); the attribute pass at +1000 ms after
  the last level stays past it.
- `isExecutingTransformation` is reset at 2254, before every timer: unchanged. A second Execute meanwhile writes a new
  model (1619) and shares no queue with the first: the queues are locals of the call (1655, 1665).

## 4. Undo grouping

No `beginUndoGroup` in `ProjectEditor.tsx` (`grep -c` 0; control on `reducer.ts`: 2). A run is not one undo entry
today: roots, each `addObject`, each attribute write push their deltas, merged only within `U.UpdatingTimer*1.5`
(`reducer.ts:1219`). Phase 2 adds deltas spread over more seconds, hence more entries. Not measured: the probe's undo
counters read 0 for 12 creations, no signal (P12). Proposed: out of scope, a ticket (report question 7).

## 5. Existing output model on re-run

Every run creates a new model with a unique name (`generateUniqueModelName`, 1619). An existing output model is not
read, not written, not deleted. Unchanged by Phase 2.

## 6. Smoke-test scenarios potentially affected

- Neutral fixture, three and four levels, by the extended probe: every object at its depth, in its slot, with its
  attributes; nothing unplaced (before: depth >= 2 absent).
- An existing JjTL transformation with one nesting level (`frontend/src/jjtl/__tests__/nested-feature-creation.test.ts`
  shape) run in the app: same depth-1 objects and attributes as before; for a nameless class, created instead of
  refused (report R5).
- A transformation with no nesting: no change (STEP 6c skipped as today).
- The chat's confidential case by hand (1335 visual checklist): object-by-object equal to the node output.

## 7. Files read for this report

Those listed in §2 of the discovery report. Sync files were not opened: nothing in them reads the executor's nested
values (M, `command grep -rl` from `frontend/src`): `__nested` occurs in `joiner/proxy.ts` (an unrelated
`GetPathHandler.__nested` flag, 173-209), `ProjectEditor.tsx`, `jjtl/executor/executor.ts`, its test
`nested-creation-into-features.test.ts` and `jjtl/SPEC.md`; `pendingNestedCreations` only in `ProjectEditor.tsx`.
Positive control, same command: `hasCanvasEdgePair` is found in `useJjomSync.ts` and `useM1ReferenceEdges.ts`.
