# Discovery (read-only) — Option B integration seam (derived reference-edge in the classic editor)

**Date**: 2026-06-15
**Type**: docs/discovery
**Branch**: alfonso-frontend-jjtl
**Mode**: READ ONLY. No source edited. Report only.

Locates the integration surface for a self-contained `DerivedReferenceEdge` in the **classic editor**:
where it plugs in, what feeds it, how it renders the native head standalone, and where its anchors
live. Does NOT re-tread the edge-mechanism internals settled by the two prior discoveries
(`2026-06-13_native-edge-mechanism-coupling.md`, `2026-06-15_isedge_adapter_contract.md`).

Every claim cited `path:line` against the working tree on `alfonso-frontend-jjtl`. Sub-agent sweeps
marked **[swept]** (almost none here — read line-by-line). Unestablishable facts flagged.

> **One material correction to the brief up front:** the Association (reference) edge head is **12×12**,
> NOT 20×20. The 20×20 is the *class-level default* (`joiner/classes.ts:1195`); the registered
> Association view overrides it to `size1 = GraphPoint(12,12)` (`store.tsx:486, 510`). See §3 + §5.

---

## 1. Emission + gating seam

### 1.1 The template and where it is registered
The classic editor's graph/model body is the jsxString returned by **`DefaultView.model()`**
(`common/DV.tsx:1213` class `DefaultView`, method at `:1217`), wrapped by `DV.modelView()`
(`DV.tsx:555` — `beautify(DefaultView.model())`), and registered as the **'Model' view**:
```
redux/defaults/views.ts:43  static model(vp): DViewElement
:45   DViewElement.new2('Model', DSL.parser(DV.modelView()), vp, (d)=>{
:46     d.appliableTo = 'Graph';
:47     d.appliableToClasses = [DModel.cname];
```
So this template renders a `DModel` as a `Graph`. It serves the **classic editor**; the v2-flow
(`components/editor-v2/`) is a separate ReactFlow pipeline (§2).

### 1.2 What feeds the edge emission (the 'Model' view usageDeclarations)
```
views.ts:102  let suggestedEdges = data?.suggestedEdges || {};
views.ts:109  ret.m1Objects   = data && !data.isMetamodel ? data.allSubObjects : []
views.ts:110  ret.refEdges    = (suggestedEdges.reference || []).filter(e => !e.vertexOverlaps && e.sameGraph)
views.ts:111  ret.extendEdges = (suggestedEdges.extend    || []).filter(e => !e.vertexOverlaps && e.sameGraph)
```
`refEdges` is `data.suggestedEdges.reference` (§2) filtered to **same-graph, non-overlapping**. `level`
comes from `udLevelG` (`views.ts:112`).

### 1.3 The emission itself + exact props passed to `<Edge>` today
Inside `DefaultView.model()`'s `<div className={'edges'}>` block (`DV.tsx:1227-1276`), references are
emitted in **two** blocks differing only by detail level / label:

```
DV.tsx:1228  {level > 1 && [
DV.tsx:1229    refEdges.map(se => <Edge
DV.tsx:1230      data={se.start}
DV.tsx:1231      start={se.startVertex}
DV.tsx:1232      end={se.endVertex}
DV.tsx:1233      anchorStart={0}
DV.tsx:1234      anchorEnd={0}
DV.tsx:1235      key={se.id + '_with_label'}
DV.tsx:1236      id={se.id + '_with_label'}
DV.tsx:1237      isReference={true}
DV.tsx:1238      view={'Edge' + (se.start.composition ? 'Composition' : (se.start.aggregation ? 'Aggregation' : 'Association'))}
DV.tsx:1239      label={se.start.name}
DV.tsx:1240      elabel={se.start.lowerBound === se.start.upperBound ? se.start.lowerBound : se.start.upperBound === -1 ? se.start.lowerBound + '..*' : se.start.lowerBound + '..' + se.start.upperBound}
DV.tsx:1241      slabel={''} />),
DV.tsx:1243    extendEdges.map(se => <Edge ... view={'EdgeInheritance'} isExtend={true} />)
DV.tsx:1252  {level === 1 && [
DV.tsx:1253    refEdges.map(se => <Edge ...  id={se.id + '_without_label'}  label={''} ... />),
DV.tsx:1267    extendEdges.map(se => <Edge ... view={'EdgeInheritance'} isExtend={true} />)
```
`<Edge>` is the native minting factory (per prior discovery: a synthetic `id` not in idlookup → mints a
`DEdge` via `graphElement.tsx:321`). **These two `refEdges.map(<Edge>)` sites are the minting path B
replaces.**

### 1.4 The native-vs-ghostTarget-vs-fallback determination — where "both endpoints resolve" is computed
**In the classic editor there is no ghostTarget branch** (`grep ghostTarget` hits only
`components/editor-v2/*` and `ProjectEditor.tsx` — v2-flow). The both-endpoints-resolve guarantee is
enforced **upstream**, before `refEdges` is even built, in two stages:

1. **Enumeration** (`LModelElement.tsx:5191-5198`): an `EdgeStarter` is created only if the source
   value's node `snode = lval.notEdge` has `.html` (`:5191-5192`) AND the target's node
   `enode = ltarget.notEdge` has `.html` (`:5197-5198`). `.html` means "rendered". The `EdgeStarter`
   constructor then resolves `startVertex = sn.vertex` / `endVertex = en.vertex`
   (`LModelElement.tsx:4775-4776`) and `sameGraph = endGraph.id === startGraph.id`
   (`:4777-4779`).
2. **View filter** (`views.ts:110`): `.filter(e => !e.vertexOverlaps && e.sameGraph)`.

So **`refEdges` already contains ONLY both-endpoints-resolve, same-graph references** — exactly the
case B handles. Cross-MM / unresolved references are dropped here (they never enter `refEdges`); the
`EdgeFallbackCard` path is a **separate** mechanism (the `v.isEdge === true` view branch at
`graphElement.tsx:1408-1411`, `srcL && tgtL ? null : <EdgeFallbackCard/>`), independent of
`refEdges.map`. Keeping that fallback is therefore automatic — B touches only `refEdges.map`.

### 1.5 The single concrete injection point + inputs in scope
**Injection point: `DV.tsx:1229` and `DV.tsx:1253`** — replace `<Edge .../>` with
`<DerivedReferenceEdge .../>` in both `refEdges.map` blocks (level>1 and level===1). `extendEdges`
(`:1243/:1267`) is out of scope (inheritance, not references).

Inputs in scope at the injection point (all off the `EdgeStarter` `se`, struct at
`LModelElement.tsx:4740-4799`):
| Input | source | type |
|---|---|---|
| reference/M1 data | `se.start` | `LModelElement` — an **`LValue`** for M1 (`EdgeStarter(lval, …)` `:5200`); `LReference` for M2 |
| resolved start endpoint | `se.startVertex` | `LVoidVertex` (= `startNode.vertex`, `:4775`) — real vertex in idlookup |
| resolved end endpoint | `se.endVertex` | `LVoidVertex` (`:4776`) |
| **derived-store key (M1 ref id)** | `se.id` | string `start.id + '_' + m1refindex + '-' + end.id + type` (`:4798`) |
| labels | `se.start.name`, multiplicity expr | `DV.tsx:1239-1240` |
| view name | `'Edge'+(composition?…:aggregation?…:Association)` | `DV.tsx:1238` |
| detail level | `level` | number |

The endpoints are **already-resolved real-vertex L-proxies** — no adaptation needed (consistent with
the prior contract: only the edge itself is off-idlookup).

---

## 2. Reference enumeration

### 2.1 Definition
`get_suggestedEdges` (`LModelElement.tsx:5165`) branches on `context.data.isMetamodel`:
- M1 (model): `impl_get_suggestedEdgesM1` (`:5173`)
- M2 (metamodel): `impl_get_suggestedEdgesM2` (`:5206`)

Return type (`:4871`):
`{ extend: EdgeStarter[], reference: EdgeStarter[], packageDependencies: EdgeStarter[] }`.

**M1 reference enumeration** (`:5173-5205`): iterate `allSubValues` (`LValue[]`, `:5178`); for each
`DValue.values[]` entry that is a pointer (`:5190`) to a `DObject` (`:5196`), with both source node
`lval.notEdge` (`:5191`) and target node `ltarget.notEdge` (`:5197`) rendered (`.html`), push
`new EdgeStarter(lval, ltarget, snode, enode, [], valindex, 'values')` (`:5200`). Result keyed/flattened
to `ret.reference` (`:5203`).

### 2.2 Who consumes it — classic vs v2-flow
- **Classic editor**: via the 'Model' view UD `data?.suggestedEdges` → `refEdges`
  (`views.ts:102, 110`), rendered by `DefaultView.model()` (§1). This is the path B reuses.
- **v2-flow**: a *different* path — `useM1ReferenceEdges(modelid, graphId)`
  (`components/editor-v2/EditorV2.tsx:357`, hook def `components/editor-v2/hooks/useM1ReferenceEdges.ts:30`),
  which **mints `DVoidEdge`s** (`useM1ReferenceEdges.ts:117` "creating … DVoidEdge(s)") as a Step-4
  supplement to `useJjomSync`. It does **not** serve the classic editor.

### 2.3 Conclusion
**B reuses the existing classic enumeration** `data.suggestedEdges.reference`
(`LModelElement.tsx:5165/5173`) — no re-derivation. Each `EdgeStarter` already provides the two
resolved endpoint vertices and the stable M1 reference `id`. `useM1ReferenceEdges` is v2-flow-only and
irrelevant to B.

---

## 3. Standalone native head

### 3.1 How the head is built today (and why `svgHeadTail` is not directly reusable)
`svgHeadTail(head, type)` (`DV.tsx:602-660`) returns a **jsxString fragment** (two `<path>` strings),
not a React element:
```
DV.tsx:605-606  style transform: translate(${segments.head.x}px, ${segments.head.y}px) rotate(${segments.head.rad}rad);
                transformOrigin: ${segments.head.w/2}px ${segments.head.h/2}px
DV.tsx:607-608  className "head <type> preview" / "head <type> clickable content"
DV.tsx:655      ret = `<path ${attrs} /><path ${hoverAttrs} />`   // NB: NO d= attribute
```
The **shape `d` is not in the fragment** — it is applied by CSS `path.head { d: path(var(--head)); }`,
where `--head` is the palette token built in `edgeView`:
```
DV.tsx:693  'head': {type:'path', value: headPath, options: EdgeHead.predefinedPaths, x:'view.edgeHeadSize.x', y:'view.edgeHeadSize.y'}
```
and `headPath = EdgeHead.Head_reference` for Association (`DV.tsx:675`). The path string itself:
```
DV.tsx:1140  static Head_reference = "M11.354 5.646a.5.5 90 010 .708l-6.035 6.089a.5.5 90 01-.156-.116L11.375 5.999l-6.406-6.211a.5.5 90 01.208-.115z";
```
`EdgeHead` is an exported class (`DV.tsx:1122`), so `Head_reference` is importable.

So `svgHeadTail` is coupled to three things a standalone React component does not have: (a) the
jsxString compiler, (b) the view palette → CSS-variable `--head` for the shape, (c) the `segments.head`
template binding. **It is NOT reusable as-is**; the head fragment must be rendered directly.

### 3.2 What B needs to render the head
The head **position/orientation/size already comes from the pure routing**: `computeRouting`
(`segments.ts:20`) returns `.head` and `.tail` (`segments.ts:138-139`) via `computeHeadPosition`
(`markers.ts:11`), which reads the size from `view.edgeHeadSize` (`markers.ts:19`) and the position from
the last/first segment. `HeadPosition` = `GraphSize & {rad}` → `{x, y, w, h, rad}`.

Therefore B renders its own `<path>`:
- `d = EdgeHead.Head_reference` (`DV.tsx:1140`) — imported directly
- transform mirroring `DV.tsx:605-606`: `translate(head.x px, head.y px) rotate(head.rad rad)`,
  `transformOrigin: head.w/2 px head.h/2 px`, with `head = computeRouting(input).head`
- size = `view.edgeHeadSize` — read from the resolved **Association** `DViewElement`, **not hardcoded**

No separate `computeHeadPosition` call is needed if B already calls `computeRouting` for the path.

### 3.3 Size — the 12×12 correction
The Association view is registered with `headSize = size1`:
```
store.tsx:486  let size0 = new GraphPoint(12,12), size1 = new GraphPoint(12,12), size2 = new GraphPoint(18,12);
store.tsx:505  let ev = DV.edgeView(type, headSize || size0, tailSize || size0, …);
store.tsx:510  makeEdgeView("Association", EdgeHead.reference, size1, undefined, false);
DV.tsx:1059    v.edgeHeadSize = headSize;   // edgeView writes the passed size onto the view
```
So `view.edgeHeadSize = (12,12)` for Association — overriding the class default
`new GraphPoint(20,20)` (`joiner/classes.ts:1195`). **B must read `view.edgeHeadSize` (12×12 today),
not hardcode 20×20.** Feeding the Association `DViewElement` into `RoutingInput.view` makes head size +
position correct automatically.

---

## 4. Derived store (anchorStart / anchorEnd keyed by M1 reference id)

### 4.1 IRView / ir-1.0 is NOT a fit
`ai/viewpointIR/types.ts` (schema `ir-1.0`) is a **view-DEFINITION IR** for AI-generated viewpoints
(`types.ts:1-4`): `ViewIR` describes graph/vertex/edge view *rules* and is "lowered into a persisted
DViewElement" (`types.ts:3-4`). `EdgeSpec` (`types.ts:99-106`) describes edge *rendering rules*
(source/target path, line, terminations, routing, labels) — **not** per-instance anchor overrides.
`IRView.tsx` is a runtime React **interpreter** that reads the IR off `view.__raw.ir`
(`IRView.tsx:28-32`), not a store. There is **no `viewpointIR` Redux slice** (`grep` of `redux/`
empty). So IRView carries no per-element override data keyed by an M1 id.

### 4.2 DState root has no per-instance override store
`DState` (`redux/store.tsx:91-227`) holds `idlookup` (`:124`) and per-class pointer arrays
(`edges` `:133`, `objects` `:153`, `values` `:154`, etc.), `_lastSelected` (`:157`), and a few
id-keyed dictionaries — `ClassNameChanged: Dictionary<Pointer<DModelElement>, …>` (`:213`),
`topics: Dictionary<string, unknown>` (`:218`). **None** is a per-instance UI/geometry override store.
`ViewPointState` (`store.tsx:547-549`) is just `{name}`; `ModelStore` (`:552`) is marked "to delete?".

Today, per-edge anchors live on the **DVoidEdge** in idlookup:
`anchorStart?/anchorEnd?: string | {x,y}` (`GraphDataElements.tsx:1859-1860`) — unavailable to a
derived edge that, by decision, has no D-object and no idlookup entry.

### 4.3 The gap (report only)
Nothing comparable exists. A derived store would be **new**, keyed by the `EdgeStarter.id`
(`LModelElement.tsx:4798`, the stable M1 reference id already used as the `<Edge>`'s synthetic id at
`DV.tsx:1236/1260`), holding only `{ anchorStart?, anchorEnd? }` (mirroring the field shape at
`GraphDataElements.tsx:1859-1860`). The natural precedents for an id-keyed root dictionary are
`ClassNameChanged` / `topics` (`store.tsx:213/218`). If persisted on `DState`, the project-state
persistence rules apply (a `VersionFixer` migration per `CLAUDE.md §3.9`); whether it must persist at
all depends on whether anchor drags survive reload — a design decision, not reported here. No slice
designed.

---

## 5. Open items / flags

1. **Head size 12×12, not 20×20** (§3.3). The brief and the prior discovery's Q4 said 20×20 (the class
   default `classes.ts:1195`); the registered Association view uses `size1 = (12,12)`
   (`store.tsx:486/510`). B must read `view.edgeHeadSize`. **High-impact — flag before implementation.**
2. **`se.start` is an `LValue` for M1, not an `LReference`** (`LModelElement.tsx:5200`). The emission
   template reads `se.start.composition` / `se.start.aggregation` (`DV.tsx:1238`), `se.start.name`
   (`:1239`), `se.start.lowerBound`/`upperBound` (`:1240`). Whether these resolve meaningfully on an
   `LValue` (vs an `LReference`) — i.e. whether an M1 reference edge picks the right view variant,
   label, and multiplicity — was **not verified by reading**; the template is written generically.
   (Matches prior contract §8-3 "labels source for an M1 reference edge".) Flag — confirm at runtime
   which `view` name and labels an M1 `LValue` yields.
3. **Two emission blocks** (`DV.tsx:1229` level>1, `:1253` level===1) differ only by label
   presence; B replaces **both**. The `extendEdges` blocks (`:1243/:1267`) are inheritance, out of scope.
4. **`anchorStart={0}` / `anchorEnd={0}`** are passed today (`DV.tsx:1233-1234/1257-1258`) — i.e. the
   current default is anchor index 0, not a center offset. B's derived store starts empty (no override);
   the routing default (view `edgeStartOffset`, prior discovery §3) applies until the user drags.
5. **Persistence path** for the new store (VersionFixer vs ephemeral) not designed (§4.3).

---

**HARD STOP.** Report only. No source edited, no component/store scaffolded, no implementation started.
The single injection point (`DV.tsx:1229` + `:1253`) and the store gap (§4.3) are named; nothing beyond
that is designed.
