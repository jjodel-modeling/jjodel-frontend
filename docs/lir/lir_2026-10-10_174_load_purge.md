# Layer Impact Report: the load purge of graph elements that represent nothing (rework of P-2026-10-07-0950)

- Prompt-ID: `P-2026-10-07-0950` (chat `C-2026-10-07-0948`), rework after the failed visual check, decision R-NEST-8
- Tree: `/Users/juridirocco/development/jjodel-174`, branch `fix/174-nesting-forms`, HEAD `bff8ce497` at the start
  (the detach of R-NEST-7)
- Go-ahead: Juri's answer of 2026-10-10 in this session, «Go-ahead RC-30 su `frontend/src/redux/VersionFixer.tsx`»;
  `goahead.txt` in the lane folder, `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-10-07-0950`
- Evidence: `docs/discovery/discovery_2026-10-07_174_nesting_forms.md`, addendum A.5 (SG: a saved ghost is painted
  after a load) and A.7 (the records the detach leaves)

Committed before the first code edit, as RC-30 asks.

## 1. Files

| File | Change |
|---|---|
| `frontend/src/redux/VersionFixer.tsx` | a new `public static purgeDeadGraphElements(s: DState): DState`, called by `update()` after the version loop, at every load; not a version step (`setup()` reads prototype methods only, a static is not an adapter), `version` untouched |
| `frontend/src/redux/__tests__/versionfixer_load_purge.test.ts` | new: the real class with the joiner barrel mocked, as `versionfixer_2230_migration.test.ts` |

## 2. The rule

Pure on `s.idlookup` and on the root graph lists. Class names considered, exactly:

- **vertices**: `DVertex`.
- **edges**: `DVoidEdge`, `DEdge`, `DExtEdge`, `DRefEdge`.
- **descendants** (removed only below a removed record, never on their own): `DGraphElement`, `DVertex`,
  `DVoidVertex`, `DGraphVertex`, `DEdgePoint` and the four edge classes.
- Never considered: `DGraph`; and `DVoidVertex`, `DGraphVertex`, `DEdgePoint`, `DGraphElement` as a starting
  point (an unlisted or model-less one is left: doubt, R-NEST-8 point 2).

A record is removed when:

1. **ghost**: a `DVertex` whose `model` is a non-empty string that is not a key of `idlookup`. A vertex with no
   `model` (`undefined`, `null`, `''`) is not a ghost.
2. **unlisted**: a `DVertex` or an edge that no remaining record lists, in `subElements` or in `midnodes`, at any
   level (every record of `idlookup` that has such an array counts as a container, whatever its class).
3. **dead end**: an edge whose `start` or `end` is a non-empty string that does not resolve, or resolves to a
   removed record. An edge with no `start` or no `end` at all is left.
4. **descendant**: a record of the descendant classes listed (`subElements` / `midnodes`) by a removed record and by
   no kept one (the fields of a ghost vertex, the points of a removed edge).

Rules 2 to 4 are repeated until nothing changes. Then, for the removed ids:

- the records leave `idlookup`;
- every kept record loses them from `subElements`, `midnodes`, `edgesIn`, `edgesOut`;
- every kept record, of any class, loses the `pointedBy` entries whose `source` is `idlookup.<removed id>.…`
  (a model element pointed by a removed vertex's `model`, a vertex pointed by a removed edge's `start`/`end`, a
  graph pointed by `father`/`graph`);
- the root lists `vertexs`, `edges`, `graphelements`, `graphvertexs`, `voidvertexs`, `edgepoints` lose them.

Nothing else is written. With nothing to remove the state object is returned untouched (no field assigned). A
console line with the counts is printed only when something is removed.

Measured before the diff, on the two real states of the version tests taken through the whole chain
(exploration test, not committed): `first.ts` has 10 `DVertex`, 9 `DEdge`, 17 `DGraphElement`, none unlisted, no
dead model, no dead end; `statechartplus.ts` has 53 `DVertex`, 44 `DEdge`, 4 `DEdgePoint`, 112 `DGraphElement`,
none unlisted, no dead end, and one `DVertex` whose `model` does not resolve (a real saved ghost) with 2
dead-model `DGraphElement` below it. Every vertex, edge, edge point and field record there is listed by its
father's `subElements`. The test reports the exact records removed.

## 3. Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data): graph-element records, at load only
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)              (no model element is removed or edited, except its pointedBy entries
                                          that name a removed vertex)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   (by data: a saved ghost is no longer in subElements, so not painted)
  [x] Canvas classic                     (by data: a classic DVertex with a dead model is removed too)
  [x] Sync layer (useJjomSync hooks)     (by data, no code change: vertexIdByModelId and the edge keys are built
                                          from subElements, which lose only dead entries)
  [x] Persistence (VersionFixer / jsxString): a state normalisation at every load, no jsxString, no version step

D-layer / Persistence
  - What changes: at every load, after the version steps, the ghost vertices, the unlisted vertex and edge
    records, the edges with a dead end and what only they list are deleted, with every reference to them
    (subElements, midnodes, edgesIn, edgesOut, pointedBy, the root graph lists).
  - What does NOT change: any model element (classes, objects, values, references), any graph, any vertex with a
    resolving model or with no model, any listed edge with two live ends, `version`, views, jsxString.
  - Cross-layer: the canvas of a loaded project never holds a vertex for an element that does not exist.
  - Side-effect safety: pure and idempotent; runs before LoadAction, where no undo history exists, so the
    history merge of reducer.ts:1216 is not involved; a coherent state is returned untouched.

Canvas v2-flow / Sync (by data)
  - What changes: a ghost saved before R-NEST-7, and the records R-NEST-7 detaches, are gone after a reload.
  - What does NOT change: Step 2bis still gives a vertex to an instance that has none; edges of live elements.

Smoke-test scenarios potentially affected:
  - open a project saved with a ghost vertex → not in the store, not painted (probe SG)
  - delete on the canvas, save, reload → the detached records are gone; a gesture and its Ctrl+Z work
  - open the saved examples (first.ts, statechartplus.ts through the chain) → only the one real ghost of
    statechartplus and what it lists are removed (unit test)
  - XMI import, the 2.230 migration arms (MIG, MIGC) → unchanged
  - a large state → purge time reported in ms

Uncertain about propagation? → one point, declared: a record of a class left out as a starting point
(DVoidVertex, DGraphVertex, DEdgePoint, DGraphElement) that no container lists is not removed.
```
