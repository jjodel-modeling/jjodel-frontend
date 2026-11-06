# Layer Impact Report: JjTL containment write-back, slice A2 (P-2026-11-02-2024)

**Prompt-ID**: P-2026-11-02-2024. **Prompt**: `docs/prompts/claude_2026-11-02_2024_prompt_jjtl_a2_containment_writeback.md`.
**Chat**: C-2026-11-02-1541. **Tree**: `~/jjodel-w-jjtlcontain`, branch `jjtl-containment`, HEAD `897e4fdca` at the start.
**Evidence base**: the write-back list of `~/.jjodel-lanes/P-2026-11-02-1956/handoff.md` (nine items), read against
`ProjectEditor.tsx` STEP 6/6c/8/8b and `nestedMaterialization.ts` at this HEAD.

Written before any edit. No file of `CLAUDE.md` §3.1 is touched. `ProjectEditor.tsx` calls `DObject.new` and
`DVertex.new` in STEP 6/6b; neither call, nor the TRANSACTION around STEP 6, changes.

## What changes

| Item | Where | Change |
|---|---|---|
| 1, 4 | STEP 6 | A target in `targetModel.containment` is not created as a root, gets no DVertex, no name in the source-id map |
| 2, 3 | STEP 6 nested collection, `nestedFeaturesOf` | A feature's children are its `__nested` objects **and** the targets placed in it (`containment` says this object, this feature), in the array's order |
| 3, 6 | `materializeNested` | A placed target goes through the existing walk: `addObject({})` by id, poll and caps unchanged, declared attributes by id (#445 unchanged), its own children level by level |
| 4 | `materializeNested`, STEP 8b | The walk returns executor object → created id. A pointer whose target is a placed target resolves through that map; a root target keeps the `__sourceId` → name path (B's map at `ProjectEditor.tsx:1809`, unchanged) |
| 5 | `nestedMaterialization.ts:207-214` | A `__ref_result` on a nested or placed object is queued by created id instead of dropped |
| 5 (order) | STEP 8b | Two phases: when a nested walk runs, every pointer, the roots' included, is written after the walk ends, so a pointed placed target exists |
| 8 | STEP 8b | Containment is written by `addObject`, never by `setValueAtPosition`; pointer writes stay as they are |

## LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)       which objects STEP 6 creates as roots; addObject calls in STEP 6c
  [ ] L-layer (computed proxies)     read only: $feature slots, fromPointer, objects
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)   indirectly: fewer DVertex (placed targets get none)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)  not touched
  [ ] Persistence (VersionFixer / jsxString)  not touched

D-layer
  - What changes: a placed target becomes a DObject inside its container's containment
    slot (LValue.addObject, its own TRANSACTION, top-level call), not a DObject child of the
    DModel. Pointers to it are written with setValueAtPosition(i, createdId, { isPtr: true }).
  - What does NOT change: the STEP 6 TRANSACTION and what it creates for roots; DVertex.new
    stays outside it; addObject stays top-level, never inside a TRANSACTION (rule 12); the
    poll interval and the 3 s cap; the one-target-per-source-id map.
  - Cross-layer interaction: the JjTL executor result (targetModel.containment) is read,
    not written. No executor change.
  - Side-effect safety: a run with no containment placement has an empty map: STEP 6 and
    the walk behave as today. The only timing change without placement: when a nested walk
    runs, root pointers are written after it instead of before it (same values).

Canvas v2-flow
  - Placed targets get no DVertex, as nested objects today; useJjomSync is not touched.

Smoke-test scenarios potentially affected (measured in the app, see the lane's log entry):
  - tree of depth 3, one rule per class, both rule orders: each element inside its container,
    only the root at root level, no duplicates
  - a collection in order; a nested creation next to a placed target in one containment
  - a contained element pointing at a target outside the tree
  - a second claim: error visible, nothing written
  - save, reopen: same tree; P-2026-11-02-1838 S1-S4 unchanged
```

Uncertain about propagation: none found. `LModel.objects` is captured before the walk, so placed targets never
enter the STEP 8 name pool (SPEC §9.2 design decision unchanged).
