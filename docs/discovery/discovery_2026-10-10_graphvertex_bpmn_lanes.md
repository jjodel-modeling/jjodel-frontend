# Discovery 2026-10-10: graphVertex for OMG-faithful BPMN pools and lanes

- Prompt-ID: P-2026-10-10-0105, prompt file `docs/prompts/claude_2026-10-10_0105_prompt_graphvertex_bpmn_lanes_discovery.md`
- Chat: C-2026-10-10-0057. Session: `fc127b41-c8e0-4127-a82c-4722eb5bcfed`.
- Tree: `~/jjodel-w-graphvertex`, branch `ir-graphvertex`, HEAD `09f8545cb` (the commit that adds the prompt; checked equal before reading).
- Executor: Anthropic Claude Opus 5.5 (session banner).
- Phase 1, read-only. Nothing was run against a dev server: every claim below is **[R] read** in code or docs at HEAD `09f8545cb`; there is no **[M] measured** claim in this report. Where a behaviour is inferred from code and not observed, it says so.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

## 0. Summary

The working hypothesis is **reshaped**, not confirmed. Four capabilities are needed, but they are not the whole set and one of the hypothesis's claims about the critical zone is false on the letter of `CLAUDE.md` §3.1.

1. **graphVertex today is a hull, not a container.** Children stay top-level React Flow nodes at absolute coordinates; the container node is sized by its own content; an overlay box (`IRContainmentHulls`) is drawn around container plus children. No RF `parentId`, no `layout` field in code (the spec has one), no arrangement, no gesture moves children with their container. [R]
2. **Children channel = composition slots only**, filtered by `childFilter`. A node reachable from no container is a free top-level node; a second container gets the child in `childrenOf` but not in `parentOf` ("first containment wins"). [R]
3. **Missed by the hypothesis, blocking for OMG-faithful models:** objects nested by containment with `father = DValue` (XMI import, JjScript `create ... in`) get **no DVertex**, because the sync gives vertices to `DModel.objects` only. An imported BPMN Process would draw no flow node at all. [R]
4. **Missed:** every M1 reference value between two drawn objects becomes an edge (`useM1ReferenceEdges`); `Lane.flowNodeRefs` would be drawn as lane-to-task arrows on top of the lanes, and edge views can restyle a reference edge but cannot hide it. The children channel needs **edge suppression**, the edge counterpart of row-dispatch node suppression. [R]
5. **Missed:** PathExpr navigation hops are single-valued; a fan-out path (`laneSets.lanes`) dead-ends. The pool's channel is expressible today only as `values[0]` (first LaneSet). [R]
6. **Missed:** creation placement. A drop into a lane must create the Task in `Process.flowElements` (the model owner) **and** append it to `Lane.flowNodeRefs` (the visual container); the connect gesture creates SequenceFlows at the root, outside `Process.flowElements`. [R]
7. **Critical zone.** The read-only rendering needs no edit to the six files of `CLAUDE.md` §3.2, but every IR render file is in the §3.1 zone (`viewpoint/ir/`), and the previous graphVertex lane treated it so. Membership edit by reference can be written without editing the six files, yet it drives `useM1ReferenceEdges`' create/delete reconcile; membership by containment of a nested object needs a `father` move for which no primitive exists. [R]

## 1. Hypotheses under test and verdicts

| # | Hypothesis (from the prompt) | Verdict | Evidence |
|---|---|---|---|
| H1 | A children channel given by an arbitrary PathExpr, containment or not, with a single-visual-parent rule | **Reshaped** | Today composition only (§B1). A PathExpr channel is expressible, but hops cannot fan out (§B5), the channel's own reference edges must be suppressed (§B6), and children without a DVertex cannot be drawn by any channel (§B7). |
| H2 | An arrangement beyond free placement (partitions filling the container, side label) | **Confirmed, with a strategy fork** | No arrangement in code (§C1); `LabelSpec` cannot rotate (§C4); ELK is flat (§C2). Fork: RF reparenting vs computed placement in absolute coordinates (§H). |
| H3 | A declared membership-edit semantics | **Confirmed, reshaped** | Today a drag never edits the model (§D1). Needs a creation-owner rule too (§D3), and the reference variant interacts with the M1 edge reconcile (§D4). |
| H4 | A container size rule composing with `contentRect` and `isResized` | **Confirmed** | The container's box ignores its children; the hull is an unsized overlay (§E1). `isResized` and `layoutByViewpoint` already carry per-partition sizes (§E2). |
| H5 | "Read-only rendering of (1) and (2) needs no change in the critical zone; (3) does" | **Partly falsified** | (1)/(2) touch no §3.2 file but are inside the §3.1 zone (`viewpoint/ir/`, `CLAUDE.md:172`). (3) by reference needs no edit of §3.2 files but runs through them; (3) by containment needs a D-layer move with no existing primitive (§D). |

## 2. Objective

Establish what `graphVertex` can and cannot express today, write by hand the IR an OMG-faithful BPMN pool/lane notation needs, and turn the gap into ordered Phase 2 slices with the decisions they require.

## 3. Files read (full paths)

Code, `frontend/src/`:
- `components/editor-v2/viewpoint/ir/irTypes.ts` (1-275, 520-830), `irCompile.ts` (100-160, 425-600), `irContainment.ts` (whole), `useIRContainment.ts` (whole), `IRContainmentHulls.tsx` (whole), `irValidate.ts` (1-60, 120-135, 190-215, 296-330), `irInteraction.ts` (1-90, 150-200), `irEdgeViews.ts` (1-130, 195-400), `irCreationSeed.ts` (28-34), `irKindConvert.ts` (25-30), `IRNodeContent.tsx` (343-360), `useContentSize.ts` (1-140), `shapeRegistry.ts` (605-680), `pathExpr.ts` (20-30), `notationCatalog.ts` (70-91), `markerRegistry.ts` (48-66)
- `components/editor-v2/viewpoint/authoring/irTabs.tsx` (27-32, 168-176)
- `components/editor-v2/viewpoint/layout/vertexLayout.ts` (30-48), `vertexLayoutAdapter.ts` (exports)
- `components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `notations.ts` (88-115, grep)
- `components/editor-v2/EditorV2.tsx` (1540-1665, 1920-1945, 2003-2050, 2075-2300, 2405-2432, 2950-3010, 4014-4252, 4422-4428)
- `components/editor-v2/nodes/ObjectNode.tsx` (122-135, 905-985)
- `components/editor-v2/sync/canvasToJjom.ts` (80-208, 612-640, 1440-1520, 1645-1790), `sync/syncState.ts` (exports)
- `components/editor-v2/hooks/useJjomSync.ts` (630-652, 732-764, 994-1010), `useM1ReferenceEdges.ts` (whole), `useAutoAnchor.ts` (20-35), `useAlignment.ts` (10-20), `createAdapter.ts` (20-40, 405-472)
- `components/editor-v2/utils/elkLayout.ts` (160-200, 330-440), `edgeUtils.ts` (8-20, 545-575), `components/DynamicHandles.tsx` (240-250)
- `model/dataStructure/GraphDataElements.tsx` (1696, 1702), `services/export/XMIService.ts` (1060-1070), `jjscript/executor/commands/instance.ts` (500-525)
- `frontend/scripts/hooks/critical-zone.mjs` (36-46)

Docs: `CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (P4, P6, P12), `docs/decisions.md` (RC-20..RC-30, R-B13..R-B16, R-IRN-4, R-IRN-37, R-J1..R-J7, R-LAY-1..R-LAY-19, R-VP-49), `docs/spec/spec_2026-06-08_ir_schema_v1_1.md` (§5.5, §7.4), `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (§6-§8), `docs/spec/claude_spec_2026-07-25_ir_row_dispatch_addendum.md` (§6), `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (grep), `docs/discovery/discovery_2026-10-01_elk_layout_quality.md` (§4.5), `docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md` and `discovery_2026-09-29_collapsed_render_layer_impact.md` (grep), `docs/ratifiche/claude_2026-08-14_memo_ratifica_jjel_linguaggio_ir.md` (1-40), `docs/sessioni/claude_sessione_2026-08-04_3.md` (grep).

Not read: the size-contract memo `docs/ratifiche/claude_2026-08-15_memo_contratto_contentrect_nel_registry.md` and `discovery_2026-08-15_cablaggio_taglia_da_contenuto.md` beyond what `useContentSize.ts:1-27` cites from them; `portDistribution.ts` beyond its node-position reads. Four helper agents launched for C, D, F and G stalled or failed with no output; every finding below was read in this session.

## A. State of graphVertex today

**A1. The type.** `irTypes.ts:576-583`:
> ` * graphVertex view (spec v1.2 sez. 8): shape + containment.`
> ` * Fase 2b renders containment as a hull (container drawn as a bounding box`
> ` * around its children, absolute coordinates unchanged); true RF reparenting is`
> ` * deferred because it changes the coordinate semantics of the canvas→JjOM`
> ` * write-back (critical zone).`

Capabilities (`irTypes.ts:584-623`): `metaclasses`, `authoringMetaclassPins`, `generated`, `predicate`, `priority`, `exclusive`, `label`, `shape: ShapeSpec`, `fieldCompartments?`, `form?: FormSpec`, `table?: TableSpec`, and `containment` (required):
> `611        containment: {`
> `613            childFilter?: Predicate;`
> `614            collapsible?: boolean;`
> `615            collapsed?: {`
> `617                form?: Conditional<ShapeForm>;`
> `618                fill?: Conditional<string>;`
> `620                badge?: BadgeSpec;`

There is **no `layout` field**, so no `layout.mode`: the chat's «`layout.mode: 'horizontal'` only best effort» describes the spec, not the code. Search `command grep -n -E "layout\??:|LayoutSpec|mode\?: '(free|horizontal)" irTypes.ts`: exit 1, 0 lines; control `childFilter\?:` on the same file: exit 0, `613` and `1025`. The spec has it: `spec_2026-06-08_ir_schema_v1_1.md:262-271` (`layout: LayoutSpec;` ... `mode: 'free' | 'vertical' | 'horizontal' | 'grid';` with «'vertical'|'horizontal'|'grid' = SCSS generato best-effort, fallback su 'free'»), repeated required in `claude_spec_2026-07-18_ir_schema_v1_2.md:160`.

graphVertex lacks four keys `VertexViewIR` has: `resizable` (`:542`), `defaultSize` (`:548`), `visible` (`:555`), `structure` (`:560`). `irCompile.ts:433` compiles `visible` for vertex only: `const declaredVisible = ir.kind === 'vertex' ? ir.visible : undefined;`. The resize gate reads the key through a cast, `ObjectNode.tsx:928` `const resolvedResizable = (irResolution.compiled.ir as VertexViewIR).resizable;`, so a persisted key would act while the type refuses it.

**A2. Compile.** `irCompile.ts:542-556`: `collapsible: c.collapsible !== false,` (default true), `childFilter: compilePredicate(c.childFilter, deps)` (always callable), collapsed fields null when absent.

**A3. Containment model and children.** `irContainment.ts:4-9`:
> ` * Containment-by-hull decision (spec v1.2 sez. 8, engineering note): children`
> ` * keep absolute canvas coordinates and top-level RF nodes; the container is`
> ` * visualized as a hull drawn around its children (IRContainmentHulls). True RF`
> ` * reparenting (parentId + relative coordinates) is deferred`

Containers are object nodes whose resolved view is a graphVertex, `irContainment.ts:223` `if (!cv || cv.kind !== 'graphVertex' || !cv.containment) continue;`. No React Flow nesting anywhere in editor-v2: `command grep -rn -E "parentId:|extent: *'parent'|expandParent"` over `frontend/src/components/editor-v2` returns 3 lines, all function parameters named `parentId` (`ClassNode.tsx:167`, `:198`, `createAdapter.ts:420`), none an RF node field; control `hidden: shouldHide` on the same tree: `irContainment.ts:302`.

**A4. Rendering.** `useIRContainment.ts:142` builds the model; `:162-171` hides collapsed subtrees and lifts edges. The hull, `IRContainmentHulls.tsx:18-19` `const HULL_PADDING = 24;` `const HULL_HEADER = 22;`, bbox of container plus visible children `:53-60`, drawn `pointerEvents: 'none'`, `zIndex: -1` (`:85-86`); no hull when no visible child (`:51` `if (children.length === 0) continue;`). Mounted at `EditorV2.tsx:4425`. The expand/collapse chip `ObjectNode.tsx:972-975`, shown when `irChildCount > 0`, where `irChildCount` counts composition children **without** `childFilter` (`ObjectNode.tsx:126-129`): a container whose children are all filtered out still shows a chip. Collapse persists on the container's DVertex, `canvasToJjom.ts:194-198` `SetFieldAction.new(vertexId as any, 'irCollapsed' as any, collapsed, undefined, false);`.

**A5. Authoring, seed, validation, tests.**
- No panel: `irTabs.tsx:29-30` `/** The three IR kinds that have an authoring panel (graphVertex is out of scope). */`; `irKindConvert.ts:27` `graphVertex is not authorable (R-6)`.
- No seed: `irCreationSeed.ts:31` `/** I tre kind autorabili. \`graphVertex\` resta fuori (R-6, 2026-08-04). */`; R-IRN-4 (`docs/decisions.md:996-1002`) «graph e graphVertex non sono kind autorabili, R-6 2026-08-04». Origin, `docs/sessioni/claude_sessione_2026-08-04_3.md:20`: «`graphVertex` in `showIRTab` **non** entra da solo: senza la sezione containment aprirebbe un tab che non sa autorare niente».
- `irValidate`: graphVertex shares the vertex rules (`irValidate.ts:195`, `:302`) and its `childFilter` is reached by the generic predicate scan (`:126`). No rule on `containment.collapsible/collapsed`: `command grep -n -E "collapsed|collapsible|badge" irValidate.ts` exit 1; control `command grep -c padding` same file: 7.
- Tests: `ir.test.ts:791-835` (`describe('irContainment (Fase 2b)'`: model, `computeHidden`, `liftEndpoint`, decorate), `:1132` drop containers, `:1220-1260` droppable classes; `irValidate.test.ts:211`, `:283`, `:413`; `nodes/__tests__/irCollapsedRender.test.ts` (16 mentions).

**A6. What landed after the 2026-08-14 simulation.** `git log --format='%h %ad %s' --date=short -S graphVertex --since=2026-08-14` lists 46 commits; the graphVertex-relevant code ones: `65b979ede` 2026-08-17 container endpoint (R-B13/R-B14), `7092b30dd` 2026-08-18 mark channel in containment, `ca73c564a` 2026-08-16 mutable IR kind, `04acac227`/`61a45540e` 2026-09-29 collapsed form/fill/badge (R-IRN-37), `1127b2903` 2026-10-03 `VertexViewIR.visible` (vertex only), `2d967f267` 2026-10-03 bar orientation. The rest are docs or incidental mentions (table views, cornerRadius, outside labels). Nothing added a children channel, a layout, a seed or a panel.

**A7. Derived viewpoints emit no graphVertex.** `command grep -rn graphVertex` over `viewpoint/derive` and `utils/deriveViewpoint.ts`: exit 1; control `command grep -rln "kind: 'vertex'"` on `viewpoint/derive`: 2 files. Composite states are vertices: `viewpointDerivation.ts:18` «A class that is itself a kind of an endpoint is / a node (Person.father, a composite State)»; contained classes become rows (`:632` `id: 'children', source: { from: 'children', filter },`).

## B. Children channel

**B1. Composition only.** `irContainment.ts:64` `if (!feat || feat.className !== 'DReference' || !feat.composition) continue;`, then `childFilter` (`:224-227`). `childFilter` selects among composition children; it cannot add a non-composition child.

**B2. Two containers.** `irContainment.ts:229-233`: `model.childrenOf.set(objectId, children);` for every container, `if (!model.parentOf.has(c)) model.parentOf.set(c, objectId);` («first containment wins»). The hull reads `childrenOf` (`IRContainmentHulls.tsx:46`), so a node claimed twice stretches **both** hulls; collapse and lift read `parentOf`, so only the first container owns it there. Unreachable today with a composition channel on a well-formed model; reachable as soon as the channel is a non-containment reference (`flowNodeRefs` of two lanes).

**B3. No container.** Stays a free top-level node; nothing marks it.

**B4. A child is always also a top-level node.** It is never suppressed while expanded: decoration hides only collapsed subtrees, row children and `visible: false` objects (`useIRContainment.ts:153-168`). The row-dispatch precedent: `claude_spec_2026-07-25_ir_row_dispatch_addendum.md:74` «`hidden:true` nel pass di presentazione (`useIRContainment`), a valle del sync. **Mai removal** dall'array nodi: edge lifting, hull sizing e persistenza posizione (`portDistribution`/`canvasToJjom`) indicizzano per id.»

**B5. PathExpr cannot fan out.** `irCompile.ts:146-148`: «`take` on hops mirrors the accessor above (only 'value' and / values[N] navigate; a whole-array 'values' hop dead-ends». Grammar `pathExpr.ts:26-27` `/** One step: $feature | value | values | values[N] */`. R-J1 (JjEL as IR language) is ratified but not wired: `command grep -rln -E "jjelEvalWithDiagnostics|getParent\("` on `viewpoint/ir`: exit 1; control `parsePathExpr` in `irCompile.ts`: found. The R-J2 profile excludes `ForAll`, `MethodCall` (`docs/decisions.md:2707-2721`), and R-J7 makes the profile the only extension point. Consequence: Lane → `$flowNodeRefs.values` and Lane → `$childLaneSet.value.$lanes.values` are expressible; Participant → lanes only as `$processRef.value.$laneSets.values[0].$lanes.values` (first LaneSet).

**B6. Channel edges are drawn.** `irContainment.ts:325` `if (!srcHidden && !tgtHidden) { out.push(e); continue; }`: an edge between an expanded container and its visible child passes through untouched; `irEdgeViews.ts:349` suppresses only the edges of edge-objects. So today a graphVertex draws its composition edges to its children inside the hull [R, inferred; not observed]. Every M1 reference value between two drawn objects becomes a DVoidEdge, `useM1ReferenceEdges.ts:131-150` (`for (const objId of (rawModel.objects ?? []))` ... `if (meta?.className !== 'DReference') continue;`), composition or not. An `EdgeViewIR` has no `visible` key (`irTypes.ts:687-771`): it can restyle, not hide.

**B7. Nested objects have no vertex.** `useJjomSync.ts:736-743` Step 2bis: «This / step ensures every DObject in the model is represented in the graph.» then `for (const objId of (rawModel.objects ?? [])) {`; Step 4 and `useM1ReferenceEdges` iterate the same list. Objects nested with `father = DValue` are not in `DModel.objects` (`irContainment.ts:78-83`: «the nested form (`father = DValue`), whose objects are absent from DModel.objects and / have no DVertex»). Producers of the nested form: XMI import `XMIService.ts:1067` `const child: DObject = DObject.new(childClass.id, containmentDValue.id, DValue, undefined, true);`; JjScript `instance.ts:517` `container ? DValue : DModel,`. The Data Manager path gives its nested child a vertex explicitly (`createAdapter.ts:465` `createVertexForObject(graphId, childId, x, y);`). The canvas makes roots: `canvasToJjom.ts:1515` `DModel,                 // fatherType — MUST be DModel`. Consequence: an OMG-faithful BPMN model imported from XMI draws Definitions only; its Tasks never reach the canvas, whatever the IR says.

**B8. D-c is unsettled, and the code renders both channels.** `command grep -rln -E "\bD-a\b|\bD-b\b|\bD-c\b" docs` returns only this lane's prompt (positive control by construction: the prompt contains all three). The comment `irContainment.ts:164` says «Only vertex views host row compartments (graphVertex uses hulls)», and the hide pass enforces it, `:181` `if (!cv || cv.kind !== 'vertex') continue;`; but the type allows `fieldCompartments` on graphVertex (`irTypes.ts:597`) and `IRNodeContent.tsx:351-355` renders children rows for any compiled view. A graphVertex declaring a `children` compartment therefore draws each such child twice, as a row and as a node inside the hull [R, inferred].

## C. Arrangement

**C1. Layout modes.** None in code (§A1). `interaction.containmentDrop` and `InteractionSpec` of spec v1.2 §6 (`claude_spec_2026-07-18_ir_schema_v1_2.md:110-112`) are not implemented: `command grep -rn -E "containmentDrop\b|InteractionSpec"` on `frontend/src`: exit 1; control `dropContainers`: 3 files.

**C2. ELK is flat.** `command grep -rn -E "hierarchyHandling|INCLUDE_CHILDREN|partitioning"` on `frontend/src`: exit 1; control `'elk.direction'`: `elkLayout.ts:124`, `:414`. `buildElkGraph` maps every visible node to a root child, `elkLayout.ts:334-338` `const visible = nodes.filter(n => !n.hidden);` ... `const children: ElkNode[] = visible.map(n => {`, `:438` `return { id: 'root', layoutOptions, children, edges: elkEdges };`. The ELK report says the same (`discovery_2026-10-01_elk_layout_quality.md:90`, «no nested `children`, no `elk.hierarchyHandling`. Not measured: none of the seven scenes has a graphVertex nesting»); its claim that the IR hides containment children holds only for collapsed containers. Consequence: Auto layout can place a child anywhere, and the hull stretches to follow. The profile (`elkLayout.ts:181-196`) has no hierarchy key. ELK is not misconfigured for flat graphs; it has never been given a nested one.

**C3. Per-viewpoint layout.** Position and size per exclusive viewpoint, `GraphDataElements.tsx:1702` `layoutByViewpoint?: { [viewpointId: string]: { x: number; y: number; w: number; h: number; isResized: boolean } };` (R-LAY-14), through `readVertexLayout`/`resolveVertexLayoutWrite` (`vertexLayout.ts:66`, `:119`). Nested positions are **absolute** like every other: the drag write `canvasToJjom.ts:87-95` writes RF `position` as is, and RF position is absolute for a node without `parentId`.

**C4. Labels.** `irTypes.ts:60` `export type LabelPosition = 'top' | 'center' | 'inside' | 'bottom' | 'outside';`, `:63` `export type LabelAnchor = 'n' | 'e' | 's' | 'w';` (anchor honoured for `outside` only, `:127-128`). No rotation anywhere: `command grep -rn -E "writing-mode|writingMode|rotate\(|vertical-rl"` over `viewpoint/ir` and `nodes`: exit 1; control `'outside'` in `irStyle.ts`: `:216`. An `outside` label anchored `w` is horizontal and outside the box, not a rotated header band inside the pool.

## D. Membership edit

**D1. Dragging an existing node never edits the model.** `EditorV2.tsx:4034-4036` detects drag end; `:4137-4161` writes positions only (`syncPositionBatchToJjom(` / `syncPositionToJjom(c.id, c.position.x, c.position.y);`). Into, out of or across a hull, the node moves and the hulls recompute; dragging a container moves only the container node: `childrenOf` has two consumers, the hull and `computeHidden` (search `command grep -rn -E "childrenOf|parentOf|containerOf"` over `frontend/src`, outside tests: `irContainment.ts`, `useIRContainment.ts`, `IRContainmentHulls.tsx`, `irEdgeViews.ts`, and an unrelated `polymetric/polymetricLayouts.ts`). Dragging the child out of a hull grows the hull rather than releasing the child.

**D2. Creating into a container exists, for palette drops only.** Hit test on the container node's own box, not the hull, `EditorV2.tsx:2086-2089` «Hulls are pointer-transparent and drawn only when children / exist (discovery 2026-07-20 B1): the reliable target is the container / node's bbox. Collapsed containers are not targets in v1»; compatible composition references `compositionCompat.ts:31`; upper bound `guardLink` (`EditorV2.tsx:2953`); `createCompositionChild` creates a **root** object and appends it to the composition slot plus a composition DEdge, `canvasToJjom.ts:1723-1749`, where `DVoidEdge.new2` sits inside `TRANSACTION('EditorV2 create composition link', ...)`: an existing nesting of a creator in an outer TRANSACTION, against the letter of Rule 12 / §3.3 (not touched here, to be borne in mind by any lane that reuses it).

**D3. Creation owner differs from visual container in BPMN.** A drop into a Lane must put the Task in `Process.flowElements` (containment) and in `Lane.flowNodeRefs` (reference). The IR drop path writes only the container's own composition reference. The connect gesture of an object-as-edge view creates the edge-object as a root, `EditorV2.tsx:2022` `const vertexId = syncCreateObject(graphId, match.edgeClass.id, midX, midY);`, then writes its endpoint slots: a SequenceFlow drawn on the canvas is never in `Process.flowElements`.

**D4. Write primitives available.** Reference edit: `syncSetReferenceValue(objectVertexId, featureName, targetObjectId, mode: 'replace' | 'append')`, `canvasToJjom.ts:1645-1683`, a SetField-only TRANSACTION (`:1665`); it cannot remove one value from a list. The reconnect gesture writes a slot through the L proxy directly in `EditorV2.tsx` (`slot.value = newObjId;`). Containment move: none; `command grep -rln -i -E "\b(moveTo|reparent|changeContainer|setContainer|moveObject)\s*\("` over `model joiner jjscript components/editor-v2`: exit 1; control `\baddObject\(` over `model joiner`: 2 files. Any slot change re-fires `useM1ReferenceEdges` (signature `:63-84`), which creates missing pair edges with `DVoidEdge.new2` outside any TRANSACTION and `markCanvasEdgePair` (`:166-178`), and deletes stale ones in a delete-only TRANSACTION (`:187-197`).

**D5. Files per semantics.**

| Semantics | Model write | Files (§3.2 six in bold) |
|---|---|---|
| (i) reparent through containment | remove from old composition slot, append to new; for a nested object (`father = DValue`) also move `father`, no primitive | `EditorV2.tsx` (drop target on drag end), `irContainment.ts`/`irInteraction.ts` (target resolution), a new move helper in **`canvasToJjom.ts`** or the L-layer (`model/`), `useJjomSync.ts` only if nested objects get vertices (§B7) |
| (ii) edit a non-containment reference | remove from old container's list, append to new, one SetField-only TRANSACTION | `EditorV2.tsx`, a pure helper in `viewpoint/ir/`; optionally a remove-capable sibling of `syncSetReferenceValue` in **`canvasToJjom.ts`**; reads through **`useM1ReferenceEdges.ts`** and **`syncState.ts`** unchanged, provided channel edges are suppressed in the presentation pass (§B6) |
| (iii) forbid | snap back to the pre-drag position: write the old position, or skip the write | `EditorV2.tsx` only (and `viewpoint/ir/` for the rule) |

**D6. Draft Layer Impact Report (read-only assessment, no edit).**

```
LAYER IMPACT REPORT — draft, P-2026-10-10-0105 Phase 1, for the membership slice

Layers touched:
  [x] D-layer (Redux raw data)       (ii) DValue.values of two reference slots; (i) composition slots, and father for nested objects
  [ ] L-layer (computed proxies)     read only (L-proxy slot writes as in handleReconnect)
  [x] JjOM (model entities)          membership of Task in Lane.flowNodeRefs / Process.flowElements
  [x] Canvas v2-flow                 drag-end handling in EditorV2.handleNodesChange; snap-back for (iii)
  [ ] Canvas classic                 untouched
  [x] Sync layer                     read path: useM1ReferenceEdges reconcile fires on the slot change
  [ ] Persistence                    no new persisted field; IR views carry no VersionFixer (R-B9)

D-layer
  - What changes: (ii) two SetFieldAction on DValue.values, in one TRANSACTION, no creator inside
    (§3.3 "SAFE — pure-action TRANSACTION"). (i) the same on composition slots; for a father=DValue
    object, a father rewrite with no existing primitive (§D4).
  - What does NOT change: DVertex x/y/w/h and layoutByViewpoint (the drag write stays as today,
    canvasToJjom.ts:87-113); DModel.objects.
  - Cross-layer: the new slot values change m1RefValuesSig (useM1ReferenceEdges.ts:63-84).
  - Side-effect safety: the TRANSACTION must not contain DVertex.new / DVoidEdge.new2/new3 (Rule 12).
Sync layer
  - What changes: nothing in code. useM1ReferenceEdges creates the new Lane→Task pair edge
    (DVoidEdge.new2, bare, markCanvasEdgePair) and deletes the old one (delete-only TRANSACTION,
    clearCanvasEdgePair). M1 pair key src→tgt (Rule 13) — correct here: one membership per pair.
  - What does NOT change: useJjomSync Step 3/4 deps (§3.5: do not add M1 value counters).
  - Cross-layer: the created/deleted edges reach React Flow and must be hidden by the channel-edge
    suppression of the presentation pass, else a Lane→Task arrow appears after every drag.
  - Side-effect safety: hasCanvasEdgePair suppresses a re-create inside its window; a quick drag
    A→B→A could meet a pair still marked (clearCanvasEdgePair runs on delete, :194). To measure.
Canvas v2-flow
  - What changes: on drag end, resolve the container under the node (partition hit test in absolute
    coordinates) and dispatch the semantics of its view; (iii) restores the position.
  - What does NOT change: coordinate semantics (absolute), handle ids, portDistribution buckets.

Smoke-test scenarios potentially affected:
  - drag a Task from lane A to lane B → A.flowNodeRefs loses it, B gains it, one undo restores both,
    no Lane→Task edge drawn, the SequenceFlows of the Task re-route
  - same drag under a non-IR viewpoint → position only, model untouched (today's behaviour)
  - existing graphVertex views without the new keys → identical (hull, no model write)
  - import Families.ecore → 8 Family↔Member edges (M2 composite keys untouched)
  - save → reopen → identical lanes and memberships

Uncertain about propagation: the hasCanvasEdgePair window on rapid back-and-forth drags; the father
move for nested objects. Both are Phase 2 measurements, not assumptions.
```

## E. Container size

**E1. The container's box ignores its children.** The container is an ordinary IR node: content-hug for box forms, `useContentSize` for shapes with a supplement (`useContentSize.ts:5-8` «It applies to shapes that carry a / supplement (ellipse, circle, diamond); the shapes whose outline fills its box / keep the CSS content-hug»; `shapeRegistry.ts:615-617` `hasSizeSupplement`). The hull is a separate overlay with no size of its own, recomputed each render from the children (`IRContainmentHulls.tsx:52-70`), never persisted, never resizable, pointer-transparent except its header. `contentRect`, `useContentSize` and `isResized` see the container node only.

**E2. What a lane needs, and what already carries it.** Pool width = max of its own `isResized` width and header band plus the widest lane's content; each lane spans the pool's inner width; lanes stack along the axis, each lane's height its own `isResized` height or its content height; the pool's height is their sum; resizing the border between two lanes changes the two heights and keeps the sum. Every number fits the existing per-vertex record `{x, y, w, h, isResized}` of each lane and the pool (R-LAY-14); derived sizes stay in session (R-LAY-4, `useContentSize.ts` writes «Nothing reaches the / D-layer»). The new part is the **rule**: partition geometry computed from the container, a pure function to be benched, and a resize gesture that writes two lane heights in one SetField-only TRANSACTION (`syncSizeBatchToJjom`, `canvasToJjom.ts:153`, already exists).

## F. Edges across boundaries

**F1. Lift-to-ancestor fires only on hidden endpoints.** `irContainment.ts:315` `if (hidden.size === 0) return edges;`, `:325` the pass-through, `:260-261` `export function liftEndpoint(...)` / `if (!hidden.has(objectId)) return objectId;`. Hidden = collapsed subtree ∪ row children ∪ `visible:false` (`useIRContainment.ts:166-168`). So it fires on a collapsed container, and also on an object hidden by `visible: false` or row dispatch; it never fires between two expanded containers. A hidden endpoint with no rendered ancestor suppresses the edge (`:329`). Confirmed with that widening.

**F2. Frames.** No node has a parent, so every frame is absolute today and handles are consistent. The reads are mixed and would diverge under RF reparenting: absolute-aware `edgeUtils.ts:552` `const pos = node.internals?.positionAbsolute ?? node.positionAbsolute ?? node.position;`, `DynamicHandles.tsx:246` `const pos = n.internals?.positionAbsolute ?? n.position;`; relative-only `useAutoAnchor.ts:23` `const x = node.position.x;` (the side choice on drag end, `EditorV2.tsx:47` imports this one), `useAlignment.ts:14`, `IRContainmentHulls.tsx:56-59`, `irEdgeViews.ts` `centreOf` (bar orientation), and 13 `.position.x` reads in `EditorV2.tsx` (count from `command grep -rn -E "\.position\.x"` over editor-v2, outside tests). `portDistribution.ts` consumes centres handed to it. R-VP-49 keeps `portDistribution.ts` and `handlePosition.ts` untouched until a critical-zone lane.

**F3. Object-as-edge across pools and lanes.** SequenceFlow and MessageFlow are the Transition pattern: `edge.source`/`edge.target` PathExprs, endpoints resolved to vertices (`irEdgeViews.ts:315-322`), the object's node hidden. They work across hulls as long as both endpoint objects have vertices (§B7). The edge-object itself may be vertex-less (R-B14), so a nested SequenceFlow is drawable. A MessageFlow to a Pool targets the Participant's node: fine; to a Task in another pool: fine.

## G. The hand-written IR

**G0. No BPMN metamodel in the repo.** `command grep -rIl -E "flowNodeRefs|LaneSet|processRef|MessageFlow" --exclude-dir=node_modules --exclude-dir=.git .` returns only this lane's prompt (which contains all four names, so the search reaches docs). What exists: BPMN **symbol presets** (`notationCatalog.ts:72-91`, e.g. `{ id: 'bpmn-exclusive-gateway', ... values: { form: 'diamond', marker: 'x' } }`) and markers (`markerRegistry.ts:51-62`).

**G1. Metamodel fragment (OMG BPMN 2.0, minimal).** `Definitions` is added because in OMG `Collaboration` and `Process` are root elements contained in `Definitions.rootElements`. `incoming`/`outgoing` of FlowNode are omitted: OMG derives them from `sourceRef`/`targetRef`, and in Jjodel each would be drawn as a second set of reference edges. Multiplicities as in the OMG spec.

| Metaclass | Supertypes | Feature | Type | Mult. | Containment |
|---|---|---|---|---|---|
| Definitions | — | `name` | EString | 1 | — |
|  |  | `rootElements` | RootElement | 0..* | **yes** |
| RootElement (abstract) | — | `name` | EString | 0..1 | — |
| Collaboration | RootElement | `participants` | Participant | 0..* | **yes** |
|  |  | `messageFlows` | MessageFlow | 0..* | **yes** |
| InteractionNode (abstract) | — | — | — | — | — |
| Participant | InteractionNode | `name` | EString | 0..1 | — |
|  |  | `processRef` | Process | 0..1 | no |
| MessageFlow | — | `name` | EString | 0..1 | — |
|  |  | `sourceRef` | InteractionNode | 1 | no |
|  |  | `targetRef` | InteractionNode | 1 | no |
| Process | RootElement | `flowElements` | FlowElement | 0..* | **yes** |
|  |  | `laneSets` | LaneSet | 0..* | **yes** |
| LaneSet | — | `name` | EString | 0..1 | — |
|  |  | `lanes` | Lane | 0..* | **yes** |
| Lane | — | `name` | EString | 0..1 | — |
|  |  | `flowNodeRefs` | FlowNode | 0..* | no |
|  |  | `childLaneSet` | LaneSet | 0..1 | **yes** |
| FlowElement (abstract) | — | `name` | EString | 0..1 | — |
| FlowNode (abstract) | FlowElement | — | — | — | — |
| Task | FlowNode, InteractionNode | — | — | — | — |
| StartEvent | FlowNode, InteractionNode | — | — | — | — |
| EndEvent | FlowNode, InteractionNode | — | — | — | — |
| ExclusiveGateway | FlowNode | `default` | SequenceFlow | 0..1 | no |
| SequenceFlow | FlowElement | `sourceRef` | FlowNode | 1 | no |
|  |  | `targetRef` | FlowNode | 1 | no |

OMG has `Activity` between FlowNode and Task, and `Event`/`CatchEvent`/`ThrowEvent` and `Gateway` levels; they carry no feature this fragment needs and are collapsed. `ExclusiveGateway.default` is a non-containment reference and would be drawn as a gateway→SequenceFlow-object edge; since the SequenceFlow has no node (object-as-edge), the edge has no target vertex and is not drawn (`useM1ReferenceEdges.ts:145` `if (!tgtV) continue;`).

**G2. The IR, as the authoring panel would write it.** Keys marked ★ do not exist in today's schema; §G3 defines them. Everything else is valid today. Hidden structural objects use `visible: false`, which exists on `vertex` only (`irTypes.ts:555`): hiding Definitions, Collaboration, Process and LaneSet also suppresses their composition edges, because a hidden endpoint with no rendered ancestor suppresses the edge (§F1).

Structural objects, not drawn (one view each; four views, same shape):
```json
{ "irVersion": "ir-1.2", "kind": "vertex", "metaclasses": ["Process"], "exclusive": true, "label": "Process (not drawn)",
  "visible": false, "shape": { "form": "rect" } }
```
(the same for `Definitions`, `Collaboration`, `LaneSet`).

Pool, two views by D-b (§I.4): with lanes, and without.
```json
{ "irVersion": "ir-1.2", "kind": "graphVertex", "metaclasses": ["Participant"], "exclusive": true, "label": "Pool with lanes",
  "priority": 1,
  "predicate": { "op": "not", "arg": { "op": "empty", "path": "$processRef.value.$laneSets.values" } },
  "shape": {
    "form": "rect", "fill": "#ffffff", "border": { "width": 1.5 },
    "labels": [ { "position": "header", "orientation": "vertical", "source": { "from": "intrinsic", "prop": "name" } } ]
  },
  "containment": {
    "children": "$processRef.value.$laneSets.values[0].$lanes.values",
    "childFilter": { "op": "isKind", "class": "Lane" },
    "layout": { "mode": "partitions", "axis": "vertical", "header": { "side": "w", "size": 30 } },
    "membership": { "mode": "forbid" },
    "edges": "hide",
    "collapsible": false
  }
}
```
★ `labels[].position: "header"`, `labels[].orientation`, `containment.children`, `containment.layout`, `containment.membership`, `containment.edges`.

```json
{ "irVersion": "ir-1.2", "kind": "graphVertex", "metaclasses": ["Participant"], "exclusive": true, "label": "Pool without lanes",
  "shape": {
    "form": "rect", "fill": "#ffffff", "border": { "width": 1.5 },
    "labels": [ { "position": "header", "orientation": "vertical", "source": { "from": "intrinsic", "prop": "name" } } ]
  },
  "containment": {
    "children": "$processRef.value.$flowElements.values",
    "childFilter": { "op": "isKind", "class": "FlowNode" },
    "layout": { "mode": "free", "header": { "side": "w", "size": 30 } },
    "membership": { "mode": "reference", "owner": "self", "feature": "flowElements" },
    "edges": "hide",
    "collapsible": true
  }
}
```
Lower priority than the lanes view (absent = 0), so the lanes view wins when its predicate holds. `membership.owner: "self"` with `feature: "flowElements"` reads "the channel's terminal list is the containment slot of the process": a drop moves the node between processes by containment, i.e. semantics (i) on the process. A pool without `processRef` (a black-box pool) has no children and draws as a plain box.

Lane, two views by D-b: leaf lane, and lane with sub-lanes.
```json
{ "irVersion": "ir-1.2", "kind": "graphVertex", "metaclasses": ["Lane"], "exclusive": true, "label": "Lane",
  "shape": {
    "form": "rect", "fill": "#ffffff", "border": { "width": 1 },
    "labels": [ { "position": "header", "orientation": "vertical", "source": { "from": "intrinsic", "prop": "name" } } ]
  },
  "containment": {
    "children": "$flowNodeRefs.values",
    "layout": { "mode": "free", "header": { "side": "w", "size": 30 } },
    "membership": { "mode": "reference", "create": { "ownerKind": "Process", "feature": "flowElements" } },
    "edges": "hide",
    "collapsible": false
  }
}
```
```json
{ "irVersion": "ir-1.2", "kind": "graphVertex", "metaclasses": ["Lane"], "exclusive": true, "label": "Lane with sub-lanes",
  "priority": 1,
  "predicate": { "op": "exists", "path": "$childLaneSet.value" },
  "shape": {
    "form": "rect", "fill": "#ffffff", "border": { "width": 1 },
    "labels": [ { "position": "header", "orientation": "vertical", "source": { "from": "intrinsic", "prop": "name" } } ]
  },
  "containment": {
    "children": "$childLaneSet.value.$lanes.values",
    "childFilter": { "op": "isKind", "class": "Lane" },
    "layout": { "mode": "partitions", "axis": "vertical", "header": { "side": "w", "size": 30 } },
    "membership": { "mode": "forbid" },
    "edges": "hide",
    "collapsible": false
  }
}
```
A Task referenced by both a parent lane and its sub-lane (OMG allows the parent's `flowNodeRefs` to repeat the children's) is claimed twice; the single-visual-parent rule (§G3, `children` row) gives it to the innermost claimant.

Task, StartEvent, ExclusiveGateway (today's schema suffices; presets from `notationCatalog.ts`):
```json
{ "irVersion": "ir-1.2", "kind": "vertex", "metaclasses": ["Task"], "exclusive": true, "label": "Task",
  "shape": { "form": "rounded", "labels": [ { "position": "center", "source": { "from": "intrinsic", "prop": "name" } } ] } }
```
```json
{ "irVersion": "ir-1.2", "kind": "vertex", "metaclasses": ["StartEvent"], "exclusive": true, "label": "Start event",
  "defaultSize": { "width": 36, "height": 36 },
  "shape": { "form": "circle", "border": { "width": 1.5 },
    "labels": [ { "position": "outside", "anchor": "s", "source": { "from": "intrinsic", "prop": "name" } } ] } }
```
```json
{ "irVersion": "ir-1.2", "kind": "vertex", "metaclasses": ["ExclusiveGateway"], "exclusive": true, "label": "Exclusive gateway",
  "defaultSize": { "width": 50, "height": 50 },
  "shape": { "form": "diamond", "marker": "x",
    "labels": [ { "position": "outside", "anchor": "n", "source": { "from": "intrinsic", "prop": "name" } } ] } }
```
EndEvent as StartEvent with `"border": { "width": 3 }` (the `bpmn-end-event` preset).

SequenceFlow and MessageFlow (object-as-edge; today's schema suffices):
```json
{ "irVersion": "ir-1.2", "kind": "edge", "metaclasses": ["SequenceFlow"], "exclusive": true, "label": "Sequence flow",
  "edge": {
    "source": "$sourceRef.value", "target": "$targetRef.value",
    "line": { "style": "solid", "width": 1.5 },
    "terminations": { "targetEnd": "closedArrow" },
    "routing": "orthogonal",
    "labels": { "center": { "from": "intrinsic", "prop": "name" } }
  } }
```
```json
{ "irVersion": "ir-1.2", "kind": "edge", "metaclasses": ["MessageFlow"], "exclusive": true, "label": "Message flow",
  "edge": {
    "source": "$sourceRef.value", "target": "$targetRef.value",
    "line": { "style": "dashed", "width": 1 },
    "terminations": { "sourceEnd": "hollowCircle", "targetEnd": "openArrow" },
    "routing": "orthogonal",
    "labels": { "center": { "from": "intrinsic", "prop": "name" } }
  } }
```

**G3. Proposed additive extensions.** All optional; absent keeps today's behaviour exactly. Precedent for "no `irVersion` bump, no VersionFixer": every additive key of the last two months (`irTypes.ts:545-546`, `:553`, `:571`, and R-B9 as cited in R-B13, «R-B9: nessun VersionFixer per le view IR», `docs/decisions.md:474`). The chat's expectation is **confirmed**: no bump, no migration. One caveat: spec v1.2 §8 declares `layout` required and children «relative al contenitore (sistema RF parentNode)» (`claude_spec_2026-07-18_ir_schema_v1_2.md:160`, `:173`); adopting these keys under the computed-placement strategy is a **spec amendment** of §8, not a data migration.

| Key | Type | Absent = | `irValidate` checks | Bump / migration |
|---|---|---|---|---|
| `containment.children` | `PathExpr` | the composition children (today) | compiles as PathExpr (throws today on bad grammar); `container` token illegal (R-B13); terminal step `values` or `value` | none |
| single-visual-parent rule | interpreter-fixed, no key (like lift-to-ancestor, spec v1.2 §7) | — | a node claimed by two containers: innermost wins (deepest in the claim chain), then first in canvas order; the losers do not draw it; reported in `problems/` | none |
| `containment.layout` | `{ mode: 'free' \| 'partitions'; axis?: 'vertical' \| 'horizontal'; header?: { side: 'w' \| 'n'; size: number }; padding?: number }` | `mode: 'free'` without header: the hull of today | closed vocabulary (R-B9-bis style); `size` > 0; `axis` only with `partitions` | none; spec §8 amended (name kept from the spec, `vertical/horizontal/grid` of v1.1 withdrawn as never implemented) |
| `LabelSpec.position: 'header'` | widening of `LabelPosition` | — | only on a graphVertex whose `layout.header` is declared | none (widening; R-B9 persisted spelling) |
| `LabelSpec.orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | only with `position: 'header'` | none |
| `containment.membership` | `{ mode: 'none' \| 'forbid' \| 'reference' \| 'reparent'; owner?: 'self'; feature?: string; create?: { ownerKind: string; feature: string } }` | `mode: 'none'`: drag moves the node, model untouched (today) | `reference` requires a declared `children` whose last hop is `$f.values`; `reparent` requires a composition channel; the metamodel check (is `f` containment?) belongs to the panel, which has the metamodel, not to `irValidate` | none |
| `containment.edges` | `'show' \| 'hide'` | `'show'` (today: channel edges drawn) | closed vocabulary | none |
| `GraphVertexViewIR.visible`, `.resizable`, `.defaultSize` | as on `VertexViewIR` | as today | the vertex rules, extended to the kind | none (Rule 11: optional properties added to an exported interface) |

## H. The four capabilities against the evidence

1. **Children channel: reshaped.** Needed, and a PathExpr suffices for BPMN (with `values[0]` on the pool), but it comes with three companions the hypothesis did not name: channel-edge suppression (§B6), the single-visual-parent rule written down in the interpreter, not per view (§B2), and the precondition that children have vertices (§B7). Fan-out (`laneSets.lanes` across several LaneSets) is a JjEL profile question (R-J2, R-J7), not needed for v1.
2. **Arrangement: confirmed, with a strategy decision.** Two ways: (α) RF reparenting, `parentId` plus relative coordinates, as spec §8 says; it changes the write-back's coordinate contract (`canvasToJjom.ts:87-113`), the per-viewpoint records, ELK input, and every `node.position` read of §F2. (β) Computed placement: keep every node absolute and top-level (today's contract), compute the partitions' boxes in the presentation pass from the container's box, and move descendants with their container on drag end through the existing `syncPositionBatchToJjom`. (β) touches none of the §3.2 six files for rendering, reuses the hull architecture and R-LAY as they are, and is reversible; it needs a drag rule for the pool (move descendants) that (α) gets from React Flow. Recommendation (β).
3. **Membership edit: confirmed, reshaped.** Plus the creation-owner rule (§D3): drop into a lane creates in `Process.flowElements` and appends to `flowNodeRefs`; connect creates the SequenceFlow in its Process. The reference variant can be done without editing the six files; the reparent variant for nested objects cannot be done with existing primitives.
4. **Container size: confirmed.** Composes with `isResized` per lane as is; the new piece is a pure geometry rule and a paired-border resize.

**Missed by the hypothesis:**
5. Vertices for nested objects (§B7): without it, OMG-faithful imported models draw nothing inside the pools.
6. Channel-edge suppression (§B6).
7. graphVertex parity keys (`visible`, `resizable`, `defaultSize`) (§A1).
8. D-c is live in code: a graphVertex with a `children` compartment draws the child twice (§B8).
9. ELK is flat: after Auto layout the partitions' children are scattered unless ELK either receives the containers as compound nodes (`elk.hierarchyHandling: INCLUDE_CHILDREN`) or lays out each partition separately (§C2).

Boundary events stay out of scope: a bordered-node capability, not a kind.

## I. Phase 2 plan

Fixture first (all visual slices): a console script that builds the §G1 metamodel and a two-pool model on the canvas (root form: objects in `DModel.objects`, appended to the containment slots), plus the §G2 viewpoint. One pool `Customer` (no lanes, 2 tasks), one pool `Shop` with lanes `Sales` (StartEvent, Task `Check order`, ExclusiveGateway) and `Warehouse` (Task `Ship`, EndEvent), 4 SequenceFlows, 1 MessageFlow.

| # | Slice | Files | Zone | Visual | Depends | Parallel with |
|---|---|---|---|---|---|---|
| S0 | Spec addendum: §G3 keys, §8 amendment (absolute coordinates, `layout` optional), single-visual-parent rule | `docs/spec/` new addendum | no | no | — | S1, S5 |
| S1 | Schema + compile + validate + pure geometry: §G3 keys in `irTypes.ts`, `irCompile.ts`, `irValidate.ts`; channel resolution and parent rule in `irContainment.ts`; new pure `irPartitions.ts`; tests with a mutation bench | `viewpoint/ir/` (5 files + tests) | §3.1 yes (`viewpoint/ir/`), §3.2 no | no (textual oracles) | S0 text | S0, S5 |
| S2 | Render: partitions, header band with vertical label, channel-edge suppression, D-c rows-win, graphVertex `visible` | `useIRContainment.ts`, `IRContainmentHulls.tsx` (or a sibling `IRPartitions.tsx`), `IRNodeContent.tsx`, `irStyle.ts`, `ObjectNode.tsx` | §3.1 yes | **yes** | S1 | S4 |
| S3 | Gestures: membership on drag end (forbid/reference/reparent-on-composition), container drag moves descendants, paired lane resize, creation owner for drop and connect | `EditorV2.tsx`, `irInteraction.ts`, possibly `canvasToJjom.ts` (a remove-capable reference write) | **§3.2 yes if `canvasToJjom.ts`**; LIR §D6 | **yes** | S1, S2 | — |
| S4 | Authoring: graphVertex panel (containment section) and seed | `viewpoint/authoring/` (new panel, `irTabs.tsx`), `irCreationSeed.ts`, `irKindConvert.ts` | §3.1 yes | **yes** | S1; R-6 / R-IRN-4 amendment | S2 |
| S5 | Vertices for nested objects (Step 2bis over the composition walk) | `useJjomSync.ts`, `sync/m1EdgeGate.ts`, tests | **§3.2 yes** | yes | Alfonso's decision | S0, S1 |
| S6 | ELK for nested partitions | `utils/elkLayout.ts` | no | yes | S2 | — |

RC-22: S1 and S5 have disjoint files; S2 and S4 have disjoint files (S4 touches `irCreationSeed.ts`/`irKindConvert.ts`, S2 the render files); one visual lane at a time per RC-22's shape.

Visual criteria (template-task-visivi), all on the fixture, all [R] for "now":

- **S2.** Now: the two lanes are two independent boxes at their own positions, each drawn as its content-hug node (no `resizable` on graphVertex), the pool's node a separate box; `Shop` draws no hull, because a Participant has no composition children (`processRef` is not containment) and a hull needs one (`IRContainmentHulls.tsx:51`); a Lane draws no hull either (its only composition feature is `childLaneSet`), so the Tasks sit outside every box; one Lane→Task reference edge per membership, and a Participant→Process edge suppressed only if the Process view is `visible: false`. A hull, when drawn, is the bbox of container and children plus 24 px padding and a 22 px header (`IRContainmentHulls.tsx:18-19`). Must become: `Sales` and `Warehouse` stacked inside `Shop`, each as wide as `Shop`'s inner width, `Shop`'s name in a 30 px left band, vertical; each lane's name in its own left band; each Task inside its lane's box; no Lane→Task edge. Criterion: for every lane L of `Shop`, `L.x == Shop.x + 30`, `L.w == Shop.w - 30` (±1 px), consecutive lanes share a border (`L1.y + L1.h == L2.y`, ±1 px), every Task's box is inside its lane's box, and `document.querySelectorAll` finds 0 RF edges whose source is a Lane vertex.
- **S3.** Now: dragging `Ship` from `Warehouse` to `Sales` writes its x/y and nothing else (`EditorV2.tsx:4137-4161`); `Warehouse.flowNodeRefs` still holds it. Must become: `Sales.flowNodeRefs` gains it, `Warehouse.flowNodeRefs` loses it, one undo restores both; dragging `Sales` out of `Shop` snaps it back; dragging `Shop` moves its lanes and their nodes by the same delta. Criterion: after the drag, `flowNodeRefs` of the two lanes read from Redux equal the expected id lists, and after the pool drag every descendant's `x` changed by exactly the pool's Δx.
- **S4.** Now: no panel for a graphVertex (`irTabs.tsx:29-30`), the kind is not offered at creation (`irCreationSeed.ts:31`). Must become: creating a view on `Lane` offers graphVertex; the panel writes `containment.children`, `layout`, `membership`, `edges`. Criterion: the IR written by the panel for the leaf Lane is deep-equal to the §G2 JSON.

### Decisions taken (unattended)

1. **D-a, seed shape**: a new graphVertex view seeds `form: 'rect'`, a `top` intrinsic-name label, `containment: {}` (composition channel, free layout, collapsible). Recommended: the spec's own package example (`spec_2026-06-08_ir_schema_v1_1.md:477-490`) minus `layout`, so a seeded view renders exactly as today's hull. Conditional on decision 4 below.
2. **D-b, one adaptive view or two**: two views of the same metaclass dispatched by `predicate` and `priority`. Recommended: the resolver already does it (spec v1.2 §2), the authoring panel edits one view at a time, and an adaptive view would need `Conditional<layout>`, a new axis type.
3. **D-c, disjunction**: when a view's `children` compartment and its containment channel claim the same child, the row wins and the child leaves the containment channel (hidden as node, as row dispatch does); `irValidate` warns when one view declares both over the same feature. Recommended: matches the declared intent at `irContainment.ts:164` and the row-dispatch rule; ends the double drawing of §B8.
4. **Single visual parent**: interpreter-fixed, innermost claimant wins, then canvas order; losers do not draw the child; multiply-claimed and unclaimed flow nodes listed in `problems/`. Recommended: same status as lift-to-ancestor (fixed, not per view), deterministic, and it gives the OMG parent/sub-lane overlap the right picture.
5. **Pool channel uses `laneSets.values[0]`**: no JjEL profile extension in v1. Recommended: OMG processes almost always carry one LaneSet; R-J2/R-J7 stay untouched.
6. **Keep the spec's name `layout`** for the arrangement key, optional, `mode: 'free' | 'partitions'`. Recommended: one name in spec and code; the v1.1 values never existed in code.
7. **v1 scope is the canvas-created (root) form** of the model; imported nested models wait for S5. Recommended: S1-S4 need no sync change.
8. **`containment.edges` defaults to `show`** and the seed writes `hide` for non-composition channels. Recommended: existing graphVertex views keep their exact rendering.

### Decisions awaiting Alfonso

1. **Critical-zone go-ahead** (RC-26, RC-30) for S1, S2, S4 (`viewpoint/ir/`, `viewpoint/authoring/`, §3.1) and S3 (`canvasToJjom.ts` if the remove-capable write lands there, §3.2), with the LIR of §D6 as the starting draft. Recommended: go-ahead per slice, S3 with its own LIR in `docs/lir/`.
2. **Arrangement strategy (β) computed placement in absolute coordinates over (α) RF reparenting**, amending spec v1.2 §8's «Coordinate dei figli: relative al contenitore (sistema RF parentNode)». Recommended: (β); it keeps the write-back's coordinate contract and R-LAY-14 untouched.
3. **graphVertex becomes authorable**: amends R-6 (2026-08-04) and R-IRN-4 (`docs/decisions.md:996-1002`, ratified rows). Recommended: yes, once S1 lands the containment keys the 2026-08-04 session was waiting for.
4. **S5, vertices for nested objects** in `useJjomSync.ts` Step 2bis: changes what every M1 canvas with nested objects shows (they appear), which may change what the MODELS demo shows. Recommended: a discovery of its own before any code, measuring the demos.

## Dependencies and risks

- `canvasToJjom.ts:1723-1749` already nests `DVoidEdge.new2` inside a TRANSACTION; S3 must not reuse that function as a template for a membership write.
- `hasCanvasEdgePair` window under rapid back-and-forth drags (§D6), to be measured in S3.
- Hull and partitions both read absolute positions; any later move to RF reparenting invalidates S2's geometry module.
- R-B16 ties `container`-endpoint reactivity to the two sync hashes; a children-channel dependency on a non-containment slot needs the same reactivity: `flowNodeRefs` is a slot of the container, read through `m1RefValuesSig`-like invalidation that `useIRContainment` does not have today (it memoizes on `nodes`, `edges`, `irSig`, collapse, `oaeSlotsSig`, `useIRContainment.ts:212`). S1/S2 must add the channel's slots to the memo's signature, or a membership edit will not re-render.
- No measurement in this phase: every "now" in §I is read from code.

## Open questions

1. Does Alfonso want MessageFlow endpoints restricted to `InteractionNode` (structural, as in §G1) or validated (OMG allows Participant, Task and Events only)?
2. Should a pool without `processRef` (black-box pool) be drawable as a thin band like BPMN tools do, or as a plain box?
3. Is the `irCollapsed` per-vertex persistence (shared across viewpoints, spec v1.2 §8) still wanted for lanes, which are `collapsible: false` in §G2?
