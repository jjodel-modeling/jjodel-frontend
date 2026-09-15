# Discovery — 4 inverse reference edges missing in ReactFlow

**Branch:** `alfonso-frontend-jjtl`
**Date:** 2026-05-19
**Scope:** Read-only mapping of D-layer → ReactFlow edge path, looking for a per-direction (pair-based) filter that would explain why only Family→Member edges (IDs 207-210) render while Member→Family edges (IDs 211-214) do not.

**TL;DR — null result.** No pair-based filter exists in the D→RF pipeline for M2 reference edges (`type === 'reference'`). The only pair-based dedup in `useJjomSync.ts` and `jjomTransformers.ts` is gated to `type === 'inheritance'`. The user's hypothesis ("filter is downstream of D-layer") cannot be confirmed against the current code. The likely root cause moves upstream — see the alternative hypothesis at the bottom.

---

## A.1 — `jjomEdgeToRFEdge` (jjomTransformers.ts:379-521)

Full function reviewed. Behavior:

- Early return `null` only when `!edge` OR `!startVertex?.id || !endVertex?.id`. No filter based on the existence of sibling edges with the same pair.
- For each branch (M1 composition/instanceRef, M2 reference, inheritance, fallback) it returns a fresh `Edge` object with `id: edge.id` (the DEdge id, which is unique per the user's idlookup verification).
- Output is **always keyed by the DEdge id**, never by `${source}→${target}`.

The function itself cannot drop sibling edges sharing a direction. Same DEdge id means the same RF edge id, but each of the 8 DEdges has a unique id.

## A.2 — Aggregation in the caller (`useJjomSync.ts` initialization)

`useJjomSync.ts:855-893` — the init effect:

```typescript
const lGraph: any = LGraph.fromPointer(graphInfo!.graphId);
const vertices: any[] = lGraph.nodes ?? [];
const edges: any[] = lGraph.edges ?? [];

const nodeCache = new Map<string, Node>();
const edgeCache = new Map<string, Edge>();

for (const v of vertices) {
    if (isSingletonSuppressed(v.id)) continue;
    const rfNode = jjomVertexToRFNode(v);
    if (rfNode) nodeCache.set(rfNode.id, rfNode);
}
for (const e of edges) {
    const rfEdge = jjomEdgeToRFEdge(e);
    // Skip orphan edges (source/target vertex not in graph)
    if (rfEdge && nodeCache.has(rfEdge.source) && nodeCache.has(rfEdge.target)) {
        edgeCache.set(rfEdge.id, rfEdge);
    }
}
// ...
setEdges(deduplicateInheritanceEdges(Array.from(edgeCache.values())));
```

- `edgeCache` is keyed by `rfEdge.id` (= DEdge id, unique).
- The only filter applied per-edge is the **orphan guard** (`nodeCache.has(source) && nodeCache.has(target)`). For Member→Family edges, source = Member vertex id, target = Family vertex id. Both vertices exist in `nodeCache` (user confirmed 2 vertices with `model` defined). The orphan guard does NOT drop these.
- `setEdges` is called with the full `edgeCache.values()` array. **No per-direction collapse.**

`lGraph.edges` resolves via `LGraph.get_edges` (`GraphDataElements.tsx:763`) which returns `subElements.filter(c.className.indexOf('Edge') >= 0)`. If the graph's `subElements` array contains all 8 DEdge ids, the iteration sees all 8.

## A.3 — Incremental add-path (`useJjomSync.ts:925-996`)

Post-fix block reviewed (the dedup near "Step 4" that the user said was fixed):

```typescript
// Lines 973-995
if (rfEdge && currentIds.has(rfEdge.source) && currentIds.has(rfEdge.target)) {
    // Deduplicate: skip if an RF edge with the same source→target and type
    // already exists in the cache.
    let isDuplicate = false;
    if (rfEdge.type === 'inheritance') {           // ← GATED to inheritance only
        for (const [, existing] of rfEdgeCache.current) {
            if (existing.source === rfEdge.source &&
                existing.target === rfEdge.target &&
                existing.type === 'inheritance') {
                isDuplicate = true;
                break;
            }
        }
    }
    if (isDuplicate) continue;

    rfEdgeCache.current.set(rfEdge.id, rfEdge);
    if (!isDropCreated) addedEdges.push(rfEdge);
}
```

The pair-based dedup is gated to `rfEdge.type === 'inheritance'`. For M2 reference edges (type 'reference'), the loop body is skipped — every new reference edge gets stored under its own `rfEdge.id`.

## A.4 — All pair-based `${src}→${tgt}` patterns in useJjomSync.ts

Exhaustive grep of arrow keys. Each one annotated with what it gates:

| Line | Key shape | What it gates | Affects RF edges? |
|------|-----------|---------------|-------------------|
| 200/203 | `inh:${e.source}→${e.target}` | `deduplicateInheritanceEdges` — only edges with `type === 'inheritance'` | No (references pass through) |
| 404-408 | composite `${refIdPtr}:${se.start}→${se.end}` (with pair-only fallback when no model) | Builds `existingEdgeKeys` for missing-count + creation guard. Pair-only fallback only when DEdge has no `model` (i.e. inheritance) | No (refs use composite) |
| 430-433 | composite when `refId && type !== 'inheritance'`, else pair-only | Same `existingEdgeKeys` set, fed from rfEdgeCache | No (refs use composite) |
| 446 | via `edgeKeyForD` (composite/pair) | Race-window safety net — adds to `existingEdgeKeys` | No (refs use composite) |
| 461-462 | pair-only `${s}→${t}` + `hasCanvasEdgePair(ek)` | Inheritance missing-count only | No |
| 474-475 | composite `${refId}:${s}→${t}` | Reference missing-count | No |
| 505-506 | composite `${metaId}:${srcV}→${tgtV}` | M1 missing-count | No |
| 614 | via `edgeKeyForD` | Refresh `existingEdgeKeys` after Step 2 | No |
| 629-630 | pair-only `${srcVertex}→${tgtVertex}` + `hasCanvasEdgePair` | Inheritance creation guard | No |
| 659-660 | composite `${refId}:${srcVertex}→${tgtVertex}` | Reference creation guard | No |
| 691 | via `edgeKeyForD` | Refresh before Step 4 | No |
| 716-717 | composite `${metaId}:${srcVertex}→${tgtVertex}` | M1 creation guard | No |
| 979-988 | runtime compare `existing.source/target/type === 'inheritance'` | Incremental add dedup, inheritance only | No |

**No residual pair-based filter applies to M2 reference edges anywhere in `useJjomSync.ts` or `jjomTransformers.ts`.** The composite-key migration this morning is complete on every code path I can find.

External pair-based stores (out of file but checked for completeness):
- `syncState.ts:129` `canvasEdgePairs` Set — read by `useJjomSync.ts:462,630` (inheritance only) and `useM1ReferenceEdges.ts:106` (M1 only, DObject — not our case).
- `useM1ReferenceEdges.ts:81,105` — pair-only key, but applies only to DObject features. Family/Member are DClass, so this hook does not run.

## A.5 — Final push to ReactFlow

Two sinks land edges in RF state:

1. **Init** — `useJjomSync.ts:893` `setEdges(deduplicateInheritanceEdges(Array.from(edgeCache.values())))`.
2. **Incremental** — `useJjomSync.ts:1147-1184`, the patcher applies `_removedEdgeIds`, `_patchedEdges` (keyed by id), `_addedEdges` (push), then `return deduplicateInheritanceEdges(result)` at line 1183.

`deduplicateInheritanceEdges` (lines 199-208):

```typescript
function deduplicateInheritanceEdges(edges: Edge[]): Edge[] {
    const seen = new Set<string>();
    return edges.filter(e => {
        if (e.type !== 'inheritance') return true;   // ← refs pass through
        const key = `inh:${e.source}→${e.target}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
```

Reference edges return `true` immediately — never deduped by pair.

`setEdges` itself is wrapped in `EditorV2.tsx:283-291`, where `deduplicateEdges` (267-280) dedupes by `edge.id` only.

---

## Summary

**Expectation from the prompt:** find a Map/Set keyed by `${src}→${tgt}` that drops sibling reference edges. **Result:** no such structure exists in the D→RF path for M2 references. Every dedup is either:
- Keyed by `edge.id` (unique per DEdge), or
- Gated to `type === 'inheritance'`, or
- Composite (`${refId}:${src}→${tgt}`).

## Alternative hypothesis — likely root cause is upstream of D→RF

The user's ground-truth check verifies `idlookup` has 8 DEdges. It does **not** verify that all 8 are linked into `graph.subElements`. `lGraph.edges` (`GraphDataElements.tsx:763`) returns:

```typescript
get_edges(c) { return this.get_subElements(c).filter(c => c.className.indexOf('Edge') >= 0); }
```

If only 4 of the 8 DEdges are present in `graph.subElements`, `lGraph.edges` returns 4, `edgeCache` holds 4, RF renders 4. The other 4 are orphan DEdges in the idlookup, never reaching RF.

This matches the per-direction pattern: a creation race in `DVoidEdge.new2` (each has its own internal TRANSACTION — see `useJjomSync.ts:528-530` warning about nesting) could plausibly drop the second batch of edges (Member→Family) from `subElements` while still persisting them in `idlookup`.

## Verification needed before STEP B

Before any code change, in DevTools:

```javascript
const state = store.getState();
const graphId = /* the v2-flow graph id for this model */;
const graph = state.idlookup[graphId];
const edgeIdsInSubElements = (graph.subElements ?? [])
    .filter(id => state.idlookup[id]?.className?.includes('Edge'));
console.log('subElements edge count:', edgeIdsInSubElements.length);
console.log('subElements edge ids:', edgeIdsInSubElements);
// Compare against the 8 from idlookup:
const allDEdgeIds = Object.values(state.idlookup)
    .filter(e => e?.className === 'DEdge')
    .map(e => e.id);
console.log('all DEdge ids:', allDEdgeIds);
console.log('orphans (in idlookup, not in subElements):',
    allDEdgeIds.filter(id => !edgeIdsInSubElements.includes(id)));
```

- If the orphans list is empty → my analysis is wrong, the filter is elsewhere (RF internals, or something I missed). HARD STOP, reconsider.
- If the orphans list contains exactly the 4 Member→Family edges → the bug is in edge persistence (DVoidEdge.new2 / Constructors / TRANSACTION timing), NOT in the D→RF transform. STEP B as currently scoped (touching only `useJjomSync.ts` / `jjomTransformers.ts`) would not fix it.

## STEP B status

Cannot proceed as scoped. The premise of STEP B ("substitute a pair-based key with composite") does not match the code — no such pair-based key exists for references. Need user input on:

1. Run the DevTools snippet above. Report `subElements edge count` and `orphans`.
2. If orphans confirm the hypothesis, STEP B needs a re-scope: investigate `DVoidEdge.new2` / `Constructors.persist()` / TRANSACTION timing, or add a safety net in `useJjomSync.ts` that links orphan DEdges into `subElements`. This may exceed the "max 2 files" constraint.
3. If no orphans, hard-stop and look at v2-flow rendering layer (which the prompt forbids touching — EdgeOverlay, DV.tsx).
