# Co-evolution audit — M2 changes propagating to M1 (D-layer, L-layer, visual)

**Date/time**: 2026-07-04
**Branch**: `alfonso-frontend-jjtl` (working tree, on top of b944eab)
**Type**: audit + root-cause + fix (working tree only, NOT committed)
**Session**: Cowork autonomous session (Alfonso away), full repo access
**Companion artifacts**: `frontend/coevolution-tests/` (headless suite, 4/4 green after fix), fixes in `Dummy.ts`, `m1EdgeSweep.ts` (new), `canvasToJjom.ts`, `useM1ReferenceEdges.ts`

---

## TL;DR

The unresolved case (delete `r:A->B` at M2 leaves `r:a1->b`, `r:a2->b` alive) is not one bug but a family: every cleanup mechanism keyed on the edge's `model` back-pointer, and edges exist whose `model` is missing or dangling. Those edges were unreachable by ALL cleanup paths. The fix is layered: the core delete cascade now kills edges that point at the deleted element (`case 'model'`), and a new structural sweep reclaims edges by backing-slot structure, independent of `model` hygiene. A headless vitest suite reproduces the scenario end-to-end and is green on the fixed tree: reference deletion now cascades to M1 at D-layer (slots), L-layer (features), and visual level (edges + graph membership), from every entry point.

---

## 1. The failing scenario, mechanically

Scenario: M2 = `A`, `B`, `r:A->B`. M1 = `a1:A`, `a2:A`, `b:B`, links `r:a1->b`, `r:a2->b`. Delete `r` from the M2 canvas.

State involved, per link: the M2 `DReference` r; one `DValue` slot per source object (`instanceof === r.id`, `values = [b.id]`) sitting in `DObject.features`; one persisted `DVoidEdge` per link in the M1 graph (`model` SHOULD point at r); the M2 `DVoidEdge` over r.

The delete path (`syncDeleteEdge`, canvasToJjom.ts) after the 2026-06-25 fix (09f7bf361) does: (a) enumerate every edge in idlookup with `e.model === refId`, (b) `lRef.delete()` (cascade cleans slots via `case 'instanceof'` and the owner's `references[]`), (c) deferred macrotask deletes the enumerated edges and clears pair guards.

## 2. Findings

**F1 — every cleanup was keyed on the `model` back-pointer.** `syncDeleteEdge`'s enumeration filters `e.model === refId`. The core cascade reaches edges only through `pointedBy` entries created by a registered `model` pointer write. `useM1ReferenceEdges.isManagedM1RefEdge` required `lookup[se.model].className === 'DReference'`. An edge with missing or dangling `model` is invisible to all three.

**F2 — `Dummy.get_delete` `case 'model'` was a no-op.** Known since the 2026-06-21 discovery (Q2/Q4): the cascade never removed backing edges, so every NON-canvas entry point (direct `.delete()` from panels, scripts, class cascade `case 'type'`, JjScript) left zombie edges at D-layer and on canvas. Only `syncDeleteEdge`'s manual enumeration compensated, only for the direct canvas path.

**F3 — class deletion leaked M1 edges structurally.** `syncDeleteVertex` deletes edges connected to the deleted vertex IN THE SAME GRAPH. The M1 instance edges live in the M1 graph, unconnected to the M2 vertex. The cascade (owned references via `dclass`, incoming via `case 'type'`) deleted r and the slots but never the M1 edges (F2). With the M1 canvas closed, nothing ever reclaimed them.

**F4 — the reconciler was blind to zombies by design.** `useM1ReferenceEdges`' reconcile pass only managed edges whose `model` still resolves to a `DReference`; after deleting r those edges are precisely NOT manageable. Additionally the effect bailed out when the slot signature was empty (`!m1RefValuesSig`), which is exactly the state right after the last backing slot dies.

**F5 — model-less edges are a real in-app phenomenon, not a corner case.** `syncCreateReferenceLink` resolves the metaclass reference BY NAME (`resolveReferenceIdByName`) and carries a defensive warn for the failure case; `syncEdgeRefKind` contains a repair branch that back-fills a missing `edge.model`. Both exist because edges without `model` occur in practice. Such edges reproduce Alfonso's symptom exactly: the M2 delete works, the M1 arrows stay, and nothing can remove them.

**F6 — deferred cleanup raced the cascade.** The cascade's nested async TRANSACTIONs (per-slot `lObj.delete()`) can settle across later macrotasks. A sweep scheduled at `setTimeout(0)` observed the slots still alive, classified the pairs as valid, and kept the stale edges (verified headless). The sweep now runs at +60ms from the delete paths; mounted canvases are covered reactively by the hook regardless.

**F7 — harness/app divergence to verify in-app (1 minute).** Headless, father-collection arrays are not populated by the constructor chain: `A.references` stays `[]` after `addReference`, `DObject.features` stays `[]`, `graph.subElements` stays `[]`, and `r.pointedBy` shows malformed entries (`{"source":"references"}` without the `idlookup.<id>.` prefix). The app demonstrably maintains these arrays (Step 3 auto-populate iterates `entry.raw.references`; the June-25 in-browser checks counted them), so this is most likely a bootstrap divergence (PendingPointedByPaths resolution) rather than an app bug. The suite compensates with registered `SetFieldAction`s so the D-layer state under test matches real app projects. Console check to confirm on real data:
```js
Object.values(store.getState().idlookup)
  .filter(x => x?.className === 'DClass' && x.name === 'A')[0]?.references
```
Related: bare `lClass.addReference(name, targetId)` does NOT register the `type` pointer in the target's `pointedBy` (verified headless: `B.pointedBy` had no `type` entry, so `case 'type'` could never fire). The canvas path (`syncReferenceEdge`) masks this by re-setting `lRef.type = targetClass.id` explicitly after `addReference`. Any OTHER caller of bare `addReference` (JjScript, importers) inherits the gap.

**F8 — `syncCreateReferenceLink` violates the no-creator-in-TRANSACTION idiom.** It wraps the slot write AND `DVoidEdge.new2` in one TRANSACTION. `syncReferenceEdge` deliberately separates them ("Model changes and edge creation are done in SEPARATE transactions") because nesting a creator drops writes (§3.3, the coordinate-loss family). This is a plausible origin of model-less or value-less M1 links (F5). Not fixed in this session (creation-side, out of minimal scope); backlog B2.

## 3. Fixes implemented (working tree, uncommitted)

**Fix A — core cascade, `frontend/src/common/Dummy.ts` (`case 'model'`).** When the deleted element is pointed at via a `model` field and the dependent is an Edge (`className.includes('Edge')`), the dependent edge is deleted (`lObj.delete()`), same nested-delete pattern as `case 'type'`/`case 'instanceof'`. Vertices and other `model` dependents keep the historical no-op. Effect: any `.delete()` on a DReference (panel, script, class cascade, canvas) now removes its backing M2 and M1 edges at D-layer, and the incremental sync drops the RF edges when `subElements` shrinks.

**Fix B — structural sweep, `frontend/src/components/editor-v2/sync/m1EdgeSweep.ts` (new).** `sweepStaleM1ReferenceEdges(graphId)` deletes every structural M1 reference edge (both endpoints are vertices over DObjects; `model` NOT required to resolve) whose `(srcVertex -> tgtVertex)` pair has no live backing slot tuple. `sweepAllM1ReferenceGraphs()` applies it to every instance-model graph. Includes explicit `subElements -=` cleanup (a raw `DeleteElementAction` does not reliably scrub containment) and per-pair guard clearing. Wired into `syncDeleteEdge` and `syncDeleteVertex` (DClass branch) as a +60ms deferred pass (F6), so cleanup happens even with no M1 canvas mounted.

**Fix B2 — reconciler hardening, `useM1ReferenceEdges.ts`.** `isManagedM1RefEdge` no longer requires a resolvable `DReference`: a missing or dangling `model` keeps the edge managed (structure decides); only a `model` resolving to a NON-reference disqualifies. The effect no longer bails out on an empty slot signature, so the reconcile pass runs exactly when the last backing tuple disappears.

Design rationale: co-evolution invariants must hold at the STORE level, not only inside a mounted editor. Fix A makes the model layer self-cleaning for pointer-reachable edges; Fix B makes the sync layer reclaim structurally-stale edges regardless of pointer hygiene; the hook covers the reactive case. The three overlap deliberately (idempotent deletes, '-=' idempotent) so no single timing or hygiene assumption is load-bearing.

## 4. LAYER IMPACT REPORT (§3.2)

```
Layers touched:
  [x] D-layer (Redux raw data)      — Dummy.get_delete case 'model' now deletes Edge dependents;
                                      m1EdgeSweep dispatches DeleteElementAction + SetFieldAction(subElements -=)
  [ ] L-layer (computed proxies)    — no proxy/getter/setter changed
  [ ] JjOM (model entities)         — no entity shape changed
  [x] Canvas v2-flow                — RF edges disappear via existing incremental sync (subElements removals);
                                      no direct setNodes/setEdges added
  [ ] Canvas classic                — untouched (classic derives M1 edges, never persists them)
  [x] Sync layer                    — canvasToJjom (2 deferred sweep calls), useM1ReferenceEdges (guard + predicate),
                                      new m1EdgeSweep.ts
  [ ] Persistence (VersionFixer)    — no jsxString/schema change; no migration needed (fix removes garbage lazily
                                      on the next delete/sweep; stale edges in old projects are reclaimed the first
                                      time their M1 canvas mounts or any reference/class delete runs)

For each touched layer:
  - What changes: see Fix A/B/B2 above.
  - What does NOT change: creation paths; classic editor; edge rendering; portDistribution;
    VersionFixer; DObject orphaning semantics (C.3) preserved; existing syncDeleteEdge
    enumeration kept (now redundant for model-backed edges, harmless, preservation-first).
  - Cross-layer interaction: D-layer deletions drive the RF canvas through the EXISTING
    incremental sync (useJjomSync removals branch). No new TRANSACTION wraps any creator
    (§3.3 respected: sweep batch is pure-delete).
  - Side-effect safety: '-=' and idempotent deletes make double cleanup safe (cascade +
    enumeration + sweep can all fire on the same edge).

Smoke-test scenarios potentially affected:
  - delete reference edge on M2 canvas with M1 tab open → M1 arrows vanish live
  - same with M1 tab CLOSED → reopen: no arrows, no slots, no zombie edges
  - delete class B (target of incoming r) → r gone, M1 arrows gone, instances orphaned
  - delete an ATTRIBUTE with M1 values → unchanged (OrphanStore capture + cascade)
  - inheritance edge delete → unchanged (no model pointer)
  - import Families.ecore → expect 8 edges Family↔Member (creation paths untouched)
  - undo/redo after a reference delete → unchanged mechanics (deletes are plain actions)
```

## 5. Co-evolution matrix (M2 operation → M1 effect, post-fix)

| M2 operation | D-layer (slots/values) | Visual M1 (edges/nodes) | Status |
|---|---|---|---|
| Delete reference (canvas edge) | slots deleted (cascade `instanceof`) | edges deleted (enumeration + cascade `model` + sweep) | FIXED, T2 |
| Delete reference (panel/script `.delete()`) | slots deleted | model-backed edges deleted (Fix A); model-less swept when hook mounted or on next delete-path sweep | FIXED, T3 |
| Delete class (owner or target) | owned+incoming refs deleted, their slots deleted, instances orphaned (C.3) | M2 connected edges deleted; M1 edges swept (+60ms) | FIXED, T4 |
| Delete attribute | values captured to OrphanStore, slots deleted | attribute rows vanish (reactive) | OK (pre-existing) |
| Rename class/attribute/reference | n/a (names live on meta) | reactive via selectors (ObjectNode live names, edge labels) | OK |
| Retype reference (r.type B→C) | slots keep now-invalid targets; NO revalidation | old M2 edge keeps stale `end` (known bug, log:7162 discovery); M1 edges keep rendering old pairs | GAP — backlog B1 |
| Change multiplicity (upper 1) | extra values NOT trimmed, no validation surfaced | n/a | GAP — backlog B4 (decide policy first) |
| Delete enum literal | raw `DeleteElementAction`, no cascade: M1 values referencing the literal dangle | stale labels | GAP — backlog B3 |
| Delete operation | raw delete, no cascade (operations have no M1 values) | n/a | acceptable; align for hygiene in B3 |
| Delete enum / package (vertex) | raw path in `syncDeleteVertex` (non-DClass): attributes typed by the enum keep dangling `type` (cascade `case 'type'` never runs) | n/a | GAP — backlog B3 |
| Add attribute/reference to class with existing instances | slots materialize lazily (extent handles / placeholders in ObjectNode) | placeholder rows shown | OK by design (lazy co-evolution) |
| Inheritance add/remove | no slot backfill/cleanup for inherited features | rows appear/disappear via allAttributes | PARTIAL — probe in suite later (B4) |

## 6. Headless co-evolution suite

`frontend/coevolution-tests/` — vitest, own config (root `npm run test` and `tsc` are untouched: the folder is outside `src/`, outside the root include globs).

```
cd frontend
npx vitest run --config coevolution-tests/vitest.coevolution.config.ts
```

Infrastructure: monaco/jquery/jqueryui/sweetalert2 stubbed via aliases; minimal DOM shim (`stubs/dom-setup.ts`); `stateInitializer()` + offline user bootstrap; app imports dynamic (ESM hoisting vs window stub). The fixture builds M2+M1 through the REAL v2 canvas write paths and compensates the F7 divergence with registered SetFieldActions. Covers both zombie families (edge with and without `model`).

| Test | Pins |
|---|---|
| T1 | fixture faithfulness: references[], 2 slots registered in `r.pointedBy`, 3 edges |
| T2 | Alfonso's repro via `syncDeleteEdge`: full cascade, both edge families, graph membership |
| T3 | bare `.delete()`: Fix A kills pointer-backed edges; sweep reaps model-less |
| T4 | `syncDeleteVertex(B)`: incoming-reference cascade end-to-end |

Sandbox note: on a non-mac host, `npm run` against mac-installed `node_modules` needs the platform binaries (`@esbuild/linux-*`, `@rollup/rollup-linux-*`) provided via `NODE_PATH`; on Alfonso's machine plain `npx vitest run --config ...` works.

## 7. Verification plan (Alfonso, browser)

1. `npm run typecheck` and `npm run build` (expect baseline 33 / green build). Not run in this session (sandbox constraint); gate before commit.
2. Repro scenario on http://localhost:3001/: build A, B, r:A->B; instantiate a1, a2, b; draw r:a1->b, r:a2->b (M1 canvas). Delete the r edge on M2 with the M1 tab OPEN → arrows must vanish live; Slots panel rows for r must disappear.
3. Same scenario with the M1 tab CLOSED during the delete; reopen → nothing reappears (this was the historical trap: reload used to resurrect edges from surviving slots).
4. Delete class B variant (T4): M1 arrows gone, a1/a2 keep other features, b shows Orphan.
5. Old projects containing zombies: open the M1 canvas once (mounted-hook sweep) or perform any reference/class delete; zombies should disappear. Console probe before/after:
```js
Object.values(store.getState().idlookup).filter(e =>
  typeof e?.className === 'string' && e.className.includes('Edge') &&
  typeof e.model === 'string' && !store.getState().idlookup[e.model]).length
```
6. F7 in-app check (references[] population) with the snippet in F7.

## 8. Backlog (prioritized)

- **B1 — reference retype co-evolution.** M2 side: stale `edge.end` after `r.type` change (4 fix directions already mapped in the 2026-06-2x discovery, log:7162). M1 side: policy + implementation for slots whose targets no longer conform (delete tuple vs orphan-capture like attributes). Suite probe first.
- **B2 — creation hygiene (F8).** Split `syncCreateReferenceLink`'s TRANSACTION (slot write separate from `DVoidEdge.new2`, mirroring `syncReferenceEdge`), and fail loudly or backfill when `resolveReferenceIdByName` misses. Also register `type` inside bare `addReference` (F7 tail) so non-canvas callers are safe.
- **B3 — raw-delete hygiene.** `syncRemoveEnumLiteral`, `syncRemoveOperation`, and `syncDeleteVertex`'s non-DClass branch (enum/package) bypass the cascade: route through `.delete()` like attributes/classes, so enum-typed attributes are retyped (`case 'type'` → EString) and literals' M1 values handled.
- **B4 — suite extensions.** Multiplicity restriction, enum literal delete, inheritance add/remove slot semantics, retype probes; then wire the suite into CI.
- **B5 — consolidation.** Have `useM1ReferenceEdges`' reconcile delegate to `m1EdgeSweep` (single implementation of validPairs/managed predicates); today the logic is mirrored, cross-referenced in comments.
- **B6 — F7 root cause.** If the in-app check ever shows empty `references[]` on real data, the malformed `pointedBy` source (`{"source":"references"}`) is the lead: the path string misses the `idlookup.<id>.` prefix somewhere in Constructors/PendingPointedByPaths.

---

**Hard stop.** Nothing committed. Diff on 4 source files + 1 new source file + the test folder, staged-ready for review after the browser gate (§7).
