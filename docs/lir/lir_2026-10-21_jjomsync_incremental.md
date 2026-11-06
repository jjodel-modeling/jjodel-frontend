# Layer Impact Report 2026-10-21: useJjomSync incremental sync without the forced refresh

- Prompt-ID: P-2026-10-21-0155 (continuation of P-2026-10-21-0035, RC-51). Chat: C-2026-10-20-0839. Session `14888539`.
- Tree: `~/jjodel-w-jjomsync`, branch `jjomsync-incremental`, HEAD `8d3722248`.
- Critical-zone go-ahead: Alfonso, 2026-10-21 00:13, «Ok» to the chat's question on fix 1; GO for Phase 2 by the chat on
  `docs/discovery/discovery_2026-10-21_jjomsync_incremental.md` (`d525d3ae8`) (RC-30).
- Written before any code diff (CLAUDE.md §3.2, RC-30). Claims are read in code at that HEAD unless marked measured;
  measured ones cite the discovery report.

## 0. Verdict

**Two layers: the sync hook and the v2-flow canvas nodes it patches.** `useJjomSync.ts` loses the two #67 workarounds
(`prevModel = {}` at `:1331-1334`, `Date.now()` in the deps at `:1533-1534`), its per-vertex hash moves to a new pure
module `sync/vertexSnapshot.ts` and grows to cover every transformer read, and the incremental effect schedules one
re-run after the anti-bounce window when it skipped an id whose entries changed. No D-layer write, no reducer code, no
L-layer, JjOM, persistence or edge-path change. One regression row is added to the reducer's tests, no reducer code.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)          read only, by the selector (raw idlookup reads)
  [ ] L-layer (computed proxies)        not touched; the hash reads no proxy
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   which nodes get re-transformed and patched
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

## 1. Facts the design rests on

1. **The cause of #67 is gone from the reducer.** `reducer.ts:505-510`, `:547` (`ac64b213b`, 2026-10-03): the copy
   path is reused only from the last action that changed the state, so a no-op before a write no longer makes the write
   land in the previous state. Measured in the report §3.1 (temporary test, red on the old line, green today). Hence
   `prevElements.get('model:'+id)` is again the previous D-object, and reference comparison is sound.
2. **`Date.now()` makes the effect run once per host render.** Measured, report §3.3: 16 runs in one drag with one
   store dispatch; without it, one run.
3. **The hash covers less than the transformers read.** Report §3.5 (read): the metaclass name, the reference targets'
   names, the slot feature's name, bounds, `derived`, type and annotations, the type names of attributes, references and
   parameters, `defaultValueLiteral`, the opposite's name, enum literal `value`, the ghost parents' and targets'
   names, metamodel and fullname. With the forced refresh these refreshed at the next host render; without it they
   refresh only when the vertex's own entries change. The hash is extended to all of them (§2.2).
4. **`LObject.name` is not `data.name` alone.** `LModelElement.tsx:6193-6214`: the populated `name` slot wins, then
   `data.name`, then the metaclass name. A reference target's name is therefore hashed from all three raw sources.
5. **Enum literal `value` is positional.** `LEnumLiteral.get_value` (`:4739-4743`) is the index in `father.ordinals`,
   built from the literals' order and their raw `value` (`:4928-4960`): order and raw `value` are hashed.
6. **`fullname` and `model` walk `father`.** `get_containers` (`:558-567`) and `get_until_parent`: the ghost decision
   and labels depend on every ancestor's name and on the owning model's id, so the hash walks the raw `father` chain.
7. **Anti-bounce marks come from canvas gestures.** `markCanvasUpdated*` callers: drag, resize, size reset
   (`canvasToJjom.ts:87-165`), selection (`useJjomSelection.ts:93`, `:142`), edge gestures. A skipped id keeps its old
   entries in `prevElements` (`useJjomSync.ts:1411-1424`) and, with the forced refresh, was compared again at the next
   render. Window 300 ms, `syncState.ts:78`, not exported.

## 2. What changes

### 2.1 Sync layer, `useJjomSync.ts`
- What changes: the two removals; the selector's inline hash is replaced by one call to `vertexChildrenHash(idlookup,
  modelElem)`; a local tick state and a timer ref; the property loop records whether a skipped id has changed entries,
  and if so the effect schedules one tick after the window (350 ms: window plus margin), cleared on unmount.
- What does NOT change: the init effect, Step 3 and Step 4 (edge creation, M2 composite keys, M1 pair guards), the
  addition and removal loops, the patch builders, `mergeSyncedEdge`, `deduplicateInheritanceEdges`, the
  `isCanvasUpdated` skip itself and the preservation of skipped entries in `prevElements`.
- Cross-layer interaction: the selector still reads raw `state.idlookup` only; no action is dispatched by the new code.
- Side-effect safety: no TRANSACTION, no creator, no `SetFieldAction` is added (Rule 12 untouched). The tick re-run
  dispatches nothing; it is the same effect body on the same snapshot, bounded by the window (a mark older than 300 ms
  is purged), so it cannot loop.

### 2.2 New module `sync/vertexSnapshot.ts`
- Pure: `idlookup` and a model element D-object in, a 32-bit number out. Imports nothing from `joiner`, so vitest loads
  it in the node environment. Keeps every term of today's hash (children `name`, `type` id, bounds, `abstract`,
  `composition`, `values`; enum literal names of the metaclass's attributes) and adds the reads of §1.3. Its JSDoc
  states that a node type or a transformer read added later must extend the hash.

### 2.3 Canvas v2-flow
- What changes: fewer vertices are re-transformed per run (only those whose vertex, model element or hash changed), and
  the effect runs per snapshot change instead of per render. Patching rules are unchanged: a node whose recomputed data
  is equal is not patched (`shallowDataEqual` / `samePlainData`).
- What does NOT change: positions and sizes follow the same comparison against `rfNodeCache`; edges keep their
  reference comparison (`jjomEdgeToRFEdge` path unchanged); R-GV containment is a presentation pass downstream of the
  nodes, not read by the hash.

### 2.4 Redux tests (granted by the prompt)
- `reducerCopyOnWrite.test.ts` gains one row: a composite `final` no-op then `isSingleton` on a DClass leaves the
  previous state untouched. Test only; `reducer.ts` is not edited.

## 3. Risks and how they are checked

| Risk | Check |
|---|---|
| A transformer read missing from the hash leaves a node stale | unit test per term (mutation bench: drop each term, one test dies); probe `audit`, 0 stale at rest and after the reference-target rename |
| A viewpoint switch needs a run the snapshot does not trigger | report §6: the vp step refreshed with no run (2038 reads); probe `vp` step re-measured |
| A skipped id is never refreshed without per-render runs | anti-bounce re-run; mutation bench says which instrument catches its removal |
| The larger hash costs on every dispatch and render | probe drag and click long tasks against the report's baseline |
| graphVertex containers lose nesting or edges | open «Harness / Lane process (BPMN)»: 42 edges, 48 nodes (R-GV-18) |
| Another in-place write into the previous state brings H1 back | out of scope; the #67 row pins the reducer shape |

## 4. Smoke scenarios potentially affected

- drag a node: one effect run, position kept after the anti-bounce window;
- rename a reference target, a metaclass, an M2 attribute: the referencing nodes refresh;
- toggle Final then Singleton on a class (#67): the node shows Singleton;
- open a project, switch viewpoint: nodes render with the viewpoint's layout;
- BPMN viewpoint with containers: 48 nodes, 42 edges.
