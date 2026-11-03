# Layer Impact Report: JjTL B2, the app's write-back for called, lazy and fresh targets (P-2026-11-02-2338)

**Prompt-ID**: P-2026-11-02-2338. **Chat**: C-2026-11-02-1541. **Tree**: `~/jjodel-w-jjtlcalled`, branch
`jjtl-called-rules`, HEAD `e02dbbe10` at the start.
**Evidence base**: SPEC §5.3.3 "Left for B2", `lir_2026-11-02_jjtl_containment_writeback.md`, `ProjectEditor.tsx`
STEP 6/6c/8/8b and `nestedMaterialization.ts` at this HEAD.

Written before any edit. No file of `CLAUDE.md` §3.1 is touched. STEP 6's `DObject.new`, STEP 6b's `DVertex.new`,
STEP 6c's `addObject` and the TRANSACTION around STEP 6 do not change.

## Where the one-target-per-source assumption sits

The prompt cites `ProjectEditor.tsx:1809`; at this HEAD that line is the name-dedupe loop. The map is declared at
`:1701` (`sourceIdToObjectName`), filled at `:1821`, read at `:2227` (STEP 8b `resolveTargetId`). A second copy
of the assumption is in the executor: `wrapIfTargetReference` (`executor.ts:3657-3666`) drops every target of a
pointer array whose `__sourceId` was already seen.

## What changes

| Item | Where | Change |
|---|---|---|
| 1 | STEP 6, STEP 8b | Each root target is indexed by identity (executor object -> D-layer name). A pointer resolves by identity first; the source-id path stays as a fallback only when that source id names exactly one root, and an ambiguous one is skipped with a warning, never guessed |
| 1 | `executor.ts` `wrapIfTargetReference` | A pointer array is deduplicated by identity, not by `__sourceId`: the same pointer twice still collapses (it resolves to the same target object), two fresh targets of one source both survive |
| 1 | `nestedMaterialization.ts` | The identity index is a pure helper there, so it is tested without the joiner barrel |
| 2 | `nestedMaterialization.ts`, its test | `isPlacedIn` (deps field, `IsPlacedIn` type, the parameter of `nestedFeaturesOf`/`countSubtree`) removed; the two tests that passed it are rewritten without it |
| 3 | none | The legacy `trace` Map is read only by `useJjtlExecutor.ts:121,251`, as a fallback when `traceModel.links` is empty. Every applied rule adds a trace link (`applyRule`, `executor.ts:3383`), so the trace view already lists called, lazy and fresh targets. Left as is |
| 4 | `executor.ts` `pass2BindAttributes` | A non-abort error of a delegating matched rule in pass 2 becomes one error for that element, with the application stack at the throw, and pass 2 goes on; the depth-limit abort still ends the run |

## LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)       which DObject a pointer written in STEP 8b points at
  [ ] L-layer (computed proxies)     read only: $feature slots, fromPointer, objects
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)   not touched: same roots, same DVertex
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)  not touched
  [ ] Persistence (VersionFixer / jsxString)  not touched

D-layer
  - What changes: the pointer target of a reference whose value is a called, lazy or fresh
    root target: by identity, so two targets of one source element are two DObjects, each
    pointed at by the pointers that hold it. A root target with no __sourceId and no name
    (a called rule over a non-source argument) now resolves too.
  - What does NOT change: which objects STEP 6 creates, their names, the STEP 6 TRANSACTION,
    DVertex.new outside it, addObject top-level, the poll and the 3 s cap; placed targets
    keep resolving by the id the walk returns; a matched target, one per source id, resolves
    to the same DObject as before (identity and source id agree).
  - Cross-layer interaction: the executor result is read, not written. The executor change is
    the dedupe key of a pointer array and the pass 2 catch; no new field on the result.
  - Side-effect safety: a run with matched rules only builds the same pointers; the fallback
    differs only when one source id names two roots, which was a silent overwrite before.

Smoke-test scenarios potentially affected (measured in the app, see the lane's log entry):
  - Bind(Add(Var x, Const 1), [x := Var a]) gives Add(Ref a, Const 1)
  - the template per Op; one expression placed twice; a pointer to a fresh target
  - unique lazy created once; unreached lazy nodes create nothing
  - a second implicit claim and a depth-limit recursion fail visibly, nothing written
  - save, reopen: same tree; P-2026-11-02-2108 and P-2026-11-02-1838 probes unchanged
```

Uncertain about propagation: none found.
