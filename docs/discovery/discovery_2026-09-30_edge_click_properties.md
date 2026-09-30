# Discovery: clicking an edge, and what the Properties panel shows

- Prompt-ID: `P-2026-09-30-1940`, prompt `docs/prompts/claude_2026-09-30_1940_prompt_edge_click_properties.md`, Phase 1 (read-only).
- Session `eea07ce8-9be8-4ba1-ad06-b8e9203f4a8d`, tree `~/jjodel-w-edgesel`, branch `edge-click-properties`, HEAD `25b44b2ce`
  (under `frontend/src` identical to the trunk `45ff6c290`: the one commit between them adds the prompt file).
- Executor: Anthropic Claude Opus 5.5.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the files.
- **[M]** measured in this phase by `lane-run probe` on port 3097 (headless Chromium, light, 1600×1000, DPR 2), fixtures of
  the demo builder; **[R]** read in the file named. Probe: `frontend/scripts/smoke/_tmp_edgesel_probe.ts` (19/19, 0 page
  errors) and `_tmp_edgesel_slot.ts` (6/6), logs in `~/.jjodel-lanes/P-2026-09-30-1940/`, crops in
  `frontend/scripts/smoke/_tmp_edgesel_crops/` (gitignored, `.gitignore:68`).

## 0. Answer in brief

The chat's hypothesis holds for two kinds out of three, and is falsified for the third:

| Edge kind | RF edge id | What the click writes today [M] | Properties today [M] |
|---|---|---|---|
| M2 reference, M2 composition | the `DEdge` id | `modelElement` = the `DReference` | the reference, correct |
| M1 reference, M1 composition | the `DEdge` id | `modelElement` = the **M2** `DReference` (`DEdge.model`) | the metamodel's reference editor, **wrong element** |
| object-as-edge (M1 only) | `irobj_<objectId>`, synthetic | nothing: `_lastSelected` untouched | the previous selection, **wrong** |
| inheritance | the `DEdge` id | `modelElement` = `''` (`DEdge.model` is null) | «No element selected» |

The panel can already show all three targets: a `DReference`, a `DValue` slot (header `nextState` / `VALUE`, the value
select) and a `DObject` [M, §4]. No Properties-side file is needed.

**Recommendation.** One pure resolver, `resolveEdgeSelectionTarget(edgeId, idlookup)`, reading the D-layer from the edge
id (the mirrored path passes `{ id }` only, so edge `data` cannot be relied on): M2 reference → its `DReference`; M1
reference or composition → the `DValue` of the source object whose `instanceof` is the edge's `DReference`; `irobj_<id>`
→ the `DObject`; anything else → `null`, today's path exactly. `useJjomSelection` uses it for every edge click; the two
`irobj_` branches of `EditorV2.tsx` (native and mirrored) gain one call each to a new hook handler. The clicked edge keeps
the canvas selection. Highlight mode unchanged, node and pane click unchanged.

**Phase 2 files** (4 source files, under the limit of 5, none excluded by the prompt, no critical-zone file):
`utils/edgeSelectionTarget.ts` (new), `utils/__tests__/edgeSelectionTarget.test.ts` (new), `hooks/useJjomSelection.ts`
(240 lines), `EditorV2.tsx` (2 lines in 4447). Docs: `docs/decisions.md` (series R-ESEL), `docs/log-inbox/views.md`,
the prompt's Status. Layer Impact Report: not required (§6).

**Decisions taken (unattended, RC-25, `provisional, unattended`):**
1. R-ESEL-1: one pure resolver reading the D-layer from the edge id; unknown kinds return `null` and keep today's path.
2. R-ESEL-2: an M1 reference edge shows the reference **slot** (`DValue`), not the feature: the panel has a slot view, it
   names the owner object and edits the value; the feature lives in the metamodel and is one click away (tree).
3. R-ESEL-3: the clicked edge stays the canvas selection; an object-as-edge selects no D-element and writes `node: ''`.
4. R-ESEL-4: native and mirrored edge clicks call the same hook handlers, the `irobj_` branches included.
5. R-ESEL-5: highlight mode unchanged; an object-as-edge in highlight mode neither assigns nor selects, as today.
6. Inheritance edges and IR-lifted edges (`<id>__irlift`) stay `null` in this lane (today's behaviour); ticketed.

**Decisions awaiting Alfonso:** none (no RC-26 item: no critical-zone edit, no exported interface changed, no deletion).

**Questions:** none without a single recommendation; the cascade to Phase 2 applies.

---

## 1. Hypotheses under test

- **H1** «For at least one edge kind the React Flow edge id is not a D-object id.» **Holds** for object-as-edge
  (`irobj_<objectId>`, `LPointerTargetable.fromPointer` returns `undefined` [M]) and for IR-lifted edges (`<id>__irlift`
  [R]). Falsified for every native kind: the RF id is the `DEdge` id [R, M].
- **H2** «For at least one kind `fromPointer(edge.id).model` is not the represented element.» **Holds** for M1 reference
  and M1 composition edges: `.model` is the M2 `DReference` [M]. Holds trivially for inheritance (`.model` undefined [M]).
  Falsified for M2 references: `.model` is the `DReference` shown [M].
- **H3** «The Properties panel shows nothing, the model, or the wrong element.» **Holds**: M1 edges show the metamodel's
  reference, object-as-edges leave the previous selection (the model after a pane click), inheritance shows the empty
  state [M, §3].
- **H4** «The panel may be unable to show a `DReference`, a `DValue` or a `DObject`.» **Falsified**: it renders all three [M, §4].
- **H5** «Object-as-edge exists on M2 too (a class drawn as an edge).» **Falsified** [R]: the synthesis candidates come
  from `objectNode` vertices only.

## 2. How edge ids are built (read)

**Native edges: the RF id is the D-edge id.** `frontend/src/components/editor-v2/utils/jjomTransformers.ts:562`
`export function jjomEdgeToRFEdge(edge: any): Edge | null {`, every branch returns `id: edge.id`:
- M1 (source vertex's element is a `DObject`), `:583` `if (sourceClassName === 'DObject') {`, `:588`
  `const refId = refModel?.id ?? edge.id;`, then `type: 'composition'` (`:597`) or `type: 'instanceRef'` (`:612`) with
  `data: { referenceName: refName, referenceId: refId }`.
- M2 reference, `:623` `if (edge.isReference) {`, `type: 'reference'`, `data: { reference: { id: refModel?.id ?? edge.id,
  name, kind, ... }, jjomRefId: refModel?.id }`.
- Inheritance, `:677` `if (edge.isExtend) {`, `type: 'inheritance'` (`:685`), `data: {}`.
- Fallback generic reference, `:690` `// Fallback: treat as a generic reference edge`.

**What `DEdge.model` holds.** M2 reference: the `DReference`
(`frontend/src/components/editor-v2/hooks/useJjomSync.ts:928` `refId, graphId, graphId, undefined,`). M1 reference or
composition: the **M2** `DReference` the slot instantiates, `dFeat.instanceof`
(`useJjomSync.ts:1036` `metaId, graphId, graphId, undefined,` and `hooks/useM1ReferenceEdges.ts:169` `refMetaId,`).
Inheritance: none (`useJjomSync.ts:838` `undefined, graphId, graphId, undefined,`).

**Object-as-edge: a synthetic id.** `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts:245`
`` id: `irobj_${objectId}`, ``, `data: { irObjectAsEdge: true, irObjectId: objectId, irSourceFeature, irTargetFeature }`
(`:251`). M1 only: `viewpoint/ir/irContainment.ts:206` `if (n.type !== 'objectNode') continue;` fills `objByVertex`, the
seed of every candidate. No M2 class-as-edge exists (H5).

**IR-lifted edges: a derived id.** `viewpoint/ir/irContainment.ts:318` `` id: `${e.id}__irlift`, `` (an endpoint hidden in a
collapsed container, remapped to its ancestor; lifted pairs deduplicated). Not measured: it needs a collapse gesture.

## 3. What a click does today (measured)

**Two click routes.** A click on the visible line bubbles to React Flow's `<g>` and runs `EditorV2.onEdgeClick`
(`EditorV2.tsx:4171` `onEdgeClick={onEdgeClick}`); a click beside the line hits the 20 px transparent path whose handler
stops propagation and runs `EditorV2.selectEdge` (`edges/UnifiedEdge.tsx:896`
`onClick={(e) => { e.stopPropagation(); selectEdge?.(id); }}`). The probe drives both (`line`, `hit`); for native edges
both end in `jjomSelection.onEdgeClick`, the mirrored one with `{ id: edgeId } as unknown as Edge` (`EditorV2.tsx:2845`),
**no `data`**. Both `irobj_` branches return before it: `EditorV2.tsx:2812` `if (edge.id.startsWith('irobj_')) {` and
`:2835` `if (edgeId.startsWith('irobj_')) {`.

**The write.** `hooks/useJjomSelection.ts:107-112`:
`const modelElement = lElement.model;` then `SetRootFieldAction.new('_lastSelected' as any, { node: elementId, view: '',
modelElement: modelElement?.id ?? modelElement?.__raw?.id ?? '', });`, with `lElement = LPointerTargetable.fromPointer(elementId)`
and `if (!lElement) return;` (`:81-82`).

Per kind, both routes identical unless stated [M, `es_before_results.json`, crops `es_before_<case>_<route>_props_600.png`]:

| Case | `fromPointer(id).model` | `_lastSelected` after | RF selection | Properties header |
|---|---|---|---|---|
| DemoPEST `nextState` (M2) | `DReference nextState` | node = edge, me = `DReference nextState` | the edge | `nextState` / `Reference`, `DemoPEST›Transition` |
| DemoPEST `transitions` (M2, composition) | `DReference transitions` | the same | the edge | `transitions` / `Reference` |
| DemoFlowB `target` (M2) | `DReference target` | the same | the edge | `target` / `Reference` |
| DemoPEST `Terminal→State`, DemoFlowB `Fork→ActivityNode` (inheritance) | `undefined` | node = edge, me = `''` | the edge | «No element selected» |
| demoSM `t1 -nextState-> unlocked` (M1) | M2 `DReference nextState` | me = the M2 `DReference` | the edge | `nextState` / `Reference`, `DemoPEST›Transition` |
| demoSM `locked -transitions-> t1` (M1 composition) | M2 `DReference transitions` | me = the M2 `DReference` | the edge | `transitions` / `Reference` |
| demoFlowB `f2 -source-> work` (M1) | M2 `DReference source` | me = the M2 `DReference` | the edge | `source` / `Reference`, `DemoFlowB›ControlFlow` |
| demoFlowB derived, `irobj_<f2>` | `fromPointer` → `undefined` | untouched (the model) | the edge | `demoFlowB` / `Model` |
| demoSM derived, `irobj_<t1>` (container end) | `undefined` | untouched (the model) | the edge | `demoSM` / `Model` |

So an M1 edge opens, inside the model editor, the metamodel's reference editor (name, type, multiplicity, flags): the
user can rename a metamodel feature from a model tab. Some paths had no clickable point: DemoFlowB `source` lies exactly
under `target` (both `ControlFlow→ActivityNode`), grouped inheritance edges share a trunk; the probe took the sibling on top.

**Regression references** [M]: node click `State` (M2) → `node` = its vertex, `me` = `DClass State`, header `State` /
`Class`; node click `work`, `f2` (M1) → `DObject`, header `work` / `Object`, `f2` / `Object`; pane click → the model,
`node: ''`. Highlight on an M1 edge: `_lastSelected` unchanged, the edge id enters `jjodel.highlight.<m1>` with colour
1; on `irobj_<f2>`: `_lastSelected` and the map unchanged.

## 4. How the Properties panel resolves `_lastSelected` (read, then measured)

`frontend/src/components/editors/Info.tsx:1841-1847`: `nodeID`, `viewID`, `dataID` from `state._lastSelected`, then
`if (dataID) ret.data = LModelElement.fromPointer(dataID);`. The render switch has `case 'DReference':` (`:1639`),
`case 'DObject':` (`:1647`), `case 'DValue':` (`:1649`). `node` is destructured and not read in the render. A non-empty
`view` takes precedence (`:1591` `if (tab && selectedView && (selectedViewClass === DViewPoint.cname || ...`), so the
resolver must not write a view id into `_lastSelected.view`: the `viewId` of the prompt's example signature is dropped.

Measured by writing the triple exactly as `selectElement` does (`_tmp_edgesel_slot.ts`, 6/6): slot `t1.nextState` →
header `nextState` / `VALUE`, breadcrumb `transitions›t1`, the value select on `unlocked`
(`es_slot_slot_t1_nextState_props_600.png`); slot `locked.transitions` → `transitions` / `VALUE`, three rows `t1 t3 t5`;
object `t1` → `t1` / `Object`; control, the M2 `DReference nextState` → `nextState` / `Reference`.

## 5. Other readings

- `CANVAS_ELEMENT_SELECTED`, dispatched by `notifyElementSelected` (`useJjomSelection.ts:71`), has no listener: `command
  grep -rn "CANVAS_ELEMENT_SELECTED\|canvas-element-selected" frontend/src` returns the dispatch and the registry line
  (`events/registry.ts:23`) only, which are also the positive control. Left unchanged.
- `_lastSelected.node` readers: `StatusBar.tsx:194` (resolves the node's `.model` and checks it belongs to the model),
  `jjscript/executor/commands/eval.ts:328`, `MetaData.tsx:37`, `Console.tsx:1047`. An M1 edge keeps `node` = the edge
  id, as today; an object-as-edge writes `''`.
- The identifiers `resolveEdgeSelectionTarget`, `edgeSelectionTarget`, `EdgeSelectionTarget`, `onObjectAsEdgeClick`,
  `selectEdgeTarget` and the series `R-ESEL` are unused: `command grep -rn` over `frontend/src`, `frontend/scripts/*.mjs`, `frontend/scripts/gates` and
  `docs/decisions.md` exits 1; positive control `resolveEdgeView` in the same invocation found two files.
- The four demo scenes (SM, Petri, ESM, Flow B), M1 and M2 tabs, idle panes: shot in the `before` run
  (`es_before_scene_<k>_<m1|mm>.png`), the reference for the 0 px gate of Phase 2.

## 6. Critical zone and layers

No file of `CLAUDE.md` §3.1 is touched, so no Layer Impact Report is due. `useJjomSelection.ts` imports
`markCanvasUpdatedBatch` from `sync/syncState.ts` and keeps using it unchanged. The selection `TRANSACTION`
(`useJjomSelection.ts:91`) holds `select`/`deselect` and one `SetRootFieldAction`, no creator (Rule 12 safe), and no
new `TRANSACTION` is added. Layers: the root field `_lastSelected` (transient, `reducer.ts` `isOnlyTransientTopLevelChange`
per R-UNDO-7) and the `isSelected` flags, exactly the writes of today; no L-layer, JjOM, sync or persistence change.

## 7. Phase 2 plan

1. `frontend/src/components/editor-v2/utils/edgeSelectionTarget.ts` (new, ~60 lines): the pure resolver, structural
   input, no imports (the pattern of `sync/m1EdgeGate.ts` and `utils/connectionValidity.ts`: `EditorV2.tsx` and the joiner
   barrel do not import under vitest).
2. `utils/__tests__/edgeSelectionTarget.test.ts` (new): fixtures mirroring §2-§3 (M2 reference, M2 composition,
   inheritance, M1 reference, M1 composition, `irobj_`, unknown and lifted ids, near misses); written first; mutation bench.
3. `hooks/useJjomSelection.ts`: `selectElement(elementId, modelid, modelElementId?)`, an internal `selectEdgeTarget`,
   `onEdgeClick` through it, a new `onObjectAsEdgeClick(edgeId)` in the (non-exported) result interface.
4. `EditorV2.tsx`: one call to `jjomSelection.onObjectAsEdgeClick` in each `irobj_` branch (`:2812`, `:2835`).
5. Gates: typecheck (baseline 14, the §17 set, measured on this tree before any change), vitest, build, `check:docs`,
   `check:addonly`; probe `after` with the acceptance checks and the 0 px scenes.

## 8. Risks

- An M1 edge is pair-keyed in `useM1ReferenceEdges` (one edge per vertex pair): when two references of one object reach
  the same target, the edge carries the first `DReference` and the panel shows that slot. Accepted, noted.
- The mirrored route passes no `data`; a resolver reading `edge.data` would split the two routes. Hence the D-layer read.
- Ticket candidates (not in this lane): inheritance edge → the subclass; lifted edge → the slot of its original source.

## Addendum 2026-09-30, Phase 2 (after `bb0fd90c9`)

Measured by the same probe with `ES_TAG=after` on 3097 (light), 50/51, 0 page errors
(`~/.jjodel-lanes/P-2026-09-30-1940/probe-_tmp_edgesel_probe.log`, crops `es_after_<case>_<route>_props_600.png`):

| Case | `_lastSelected` after, both routes | RF selection | Properties header |
|---|---|---|---|
| DemoPEST `nextState`, `transitions`, DemoFlowB `target` (M2) | node = edge, me = the `DReference` | the edge | unchanged from §3 |
| demoSM `t1 -nextState->` (M1) | node = edge, me = `DValue nextState`, father `t1`, values `[unlocked]` | the edge | `nextState` / `VALUE`, `transitions›t1` |
| demoSM `locked -transitions-> t1` (M1 composition) | me = `DValue transitions`, father `locked`, values `[t1, t3, t5]` | the edge | `transitions` / `VALUE` |
| demoFlowB `f2 -source->` (M1) | me = `DValue source`, father `f2`, values `[work]` | the edge | `source` / `VALUE` |
| derived demoFlowB `irobj_<f2>` | node = `''`, me = `DObject f2` | the edge only | `f2` / `Object`, text identical to the node click of `f2` |
| derived demoSM `irobj_<t1>` (hit route) | node = `''`, me = `DObject t1` | the edge only | `t1` / `Object`, `locked›transitions` |
| DemoFlowB `Fork→ActivityNode` (inheritance) | node = edge, me = `''` | the edge | «No element selected», as before |

The one red: `oae_sm_t1 line`, no point where t1's visible line is on top (a sibling's 20 px hit path covers it for its
whole length), exactly as in the `before` run; the native route of an object-as-edge is covered by f2. Unchanged, by
the same measures: node click `State`, `work`, `f2` and pane click on M2 and M1 (Properties text identical to the
`before` run); highlight on an M1 edge assigns colour 1 and leaves `_lastSelected`; highlight on `irobj_<f2>` changes
neither. The four demo scenes, M1 and M2 tabs: 8/8 idle panes 0 px from the `before` run.
