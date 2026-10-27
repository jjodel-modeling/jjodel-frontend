# Discovery — D-A1, «Add» of a nested instance under a graphVertex container

Prompt-ID: P-2026-10-15-1710 (`docs/prompts/claude_2026-10-15_1710_prompt_da1_graphvertex_add_discovery.md`), chat
C-2026-10-11-1812, front release-3-2. Session `4b7049c1-9358-4c47-8ef7-c08330ec7ac0`. Tree `~/jjodel-w-da1`, branch
`da1-disc`, HEAD `d2c42dcb1`. Executor: Anthropic Claude Opus 5.5. Phase 1, read-only: no source edit.
This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the real files.

## 0. Answer in brief

1. **Structure, not rendering, and no CSS.** After the Add, Sales stops listing its three flow nodes as members.
   `LaneSet_0` gets a React Flow node with `hidden: true`, so React Flow draws no DOM node for it. No node anywhere has
   a `parentId`, because the canvas is flat. Every visible node keeps its z-index, `visibility: visible` and
   opacity 1, and `elementFromPoint` at each flow node's centre returns that same node (measured, §3).
2. **Not a regression.** The defect is the same, number for number, on HEAD `d2c42dcb1`, on the pre-merge trunk
   `07bfa0673` and on the staging merge `d7b24c83b`. The 2.230 step is not involved. It goes back to the first commits
   that derive lane membership from a declared channel (`6e22f4a9b` and `38e7a6006`, 2026-10-10). Before them, at
   `b7d131729`, a lane is not a container at all. No bisect was run (§4).
3. **Mechanism.** The fixture's viewpoint gives Lane two views. «Lane» lists `$flowNodeRefs.values`; «Lane with
   sub-lanes» has priority 1, the predicate `exists $childLaneSet.value`, and the channel
   `$childLaneSet.value.$lanes.values`. The Add puts an **empty** LaneSet into `childLaneSet`, so the predicate holds
   (`irCompile.ts:194-197`). `resolveIRView` then picks the sub-lanes view (`irResolveCore.ts:340`), and Sales lists
   the LaneSet's lanes, which are `[]`.
   - The flow nodes are neither re-parented under the LaneSet nor detached in the store. `flowNodeRefs` and their
     fathers are unchanged. They lose their only claimant, so `parentOf` has no entry for them.
   - `computeUnclaimed` flags all three (`irContainment.ts:430-448`). These are the dots: «In no container» ×3. The
     one on In stock? merges with the Conformance warning it already had into a «2» dot.
   - The multi-hop channel sets `channelFeature = null` (`:405`). `suppressChannelEdges` then stops hiding the
     `flowNodeRefs` edges (`:1010`), which are the three edges from above.
   - In Auto layout the nodes have no owner, so they fall into the root run (`elkContainers.ts:96-121`) (§5).
4. **Smallest fix, viewpoint data only.** In the generator, change the predicate to
   `{ op: 'not', arg: { op: 'empty', path: '$childLaneSet.value.$lanes.values' } }`. That is
   `frontend/scripts/probe/bpmn-lanes-fixture.ts:80`, the form line 60 already uses for «Pool with lanes». Then
   regenerate `gv-bpmn.jjodel` with `GV_SAVE`.
   - Measured in the browser on HEAD with the patched view: Sales keeps its 3 members, `unclaimed` stays `[]`, 5
     edges stay visible, and Auto layout keeps the 3 nodes in Sales, as in the control. With `Lane_0` inside
     `LaneSet_0`, Sales still switches to sub-lanes (§6).
   - No app source changes, no critical zone file, no persisted format, no VersionFixer step.
5. **Verdict for 3.1: not a blocker.** The defect was there before 3.1. It lives in demo viewpoint data that the app
   does not ship. No data is lost (the store is intact). The fix touches no saved project format.

**Decisions awaiting Alfonso** (§8): D1 where the fix lives (recommended: the generator and the demo export, not app
code); D2 the 3.1 verdict (recommended: ship, not a blocker); D3 the LIR R2 A1 risk, which this replay did not reach
(recommended: keep the L1 RC-23 item, reworded).

**Questions** (§9): 1. Fix the generator and re-export the demo, in a fast lane after 3.1? Recommended: yes,
`bpmn-lanes-fixture.ts:80` only. 2. Close D-A1 for 3.1 as «pre-existing, demo viewpoint data»? Recommended: yes.

## 1. Hypotheses under test

| # | hypothesis | verdict | evidence |
|---|---|---|---|
| H1 | No new vertex appears in the DOM because of CSS (z-index, visibility) | **falsified** | `LaneSet_0` is in the RF store with `hidden: true` and has no `.react-flow__node`; every visible node has z as set, `visible`, opacity 1, and is on top at its centre (§3) |
| H2 | L1's reading: after the 2.230 step an «Add»-created nested instance gets a top-level Step 2bis vertex at a grid cell instead of becoming a child of its container | **falsified for this gesture** | the vertex is made by the Add handler at `parent.x + parentW + 80` = (1080, 100), identical before the merge (`07bfa0673`) and after; Step 2bis places at `50 + col*COL_W` (§5.1) |
| H3 | The defect is a regression of the staging merge `d7b24c83b` | **falsified** | pre-merge copy `07bfa0673` shows the same `childrenOf`, `unclaimed`, edges and post-layout positions (§4) |
| H4 | The Add re-derives the three flow nodes as children of the new LaneSet | **falsified** | after the Add `parentOf` has no entry for them, and `LaneSet_0` is not a container (§3) |
| H5 | The Add detaches the flow nodes in the store | **falsified** | `Sales.flowNodeRefs` and each node's `father` (`Shop process.flowElements`) are unchanged (§3) |
| H6 | The view switch of Sales, triggered by an empty `childLaneSet`, is the cause | **holds** | Sales' container goes from `channelFeature: flowNodeRefs, steps 1, layout free` to `channelFeature: null, steps 2, layout partitions`; with the predicate patched, nothing changes after the Add (§3, §6) |

## 2. Method

- Probe `~/.jjodel-lanes/P-2026-10-15-1710/probe/da1.ts` (with `common.ts` and `summarize.py`). It reuses the gestures
  of `c10.ts` and `c10ctl.ts`. It is self-contained: Playwright by absolute path, the smoke `seed` from this tree's
  `frontend/scripts/smoke/states.ts`, and a `globalThis.__name` shim for the `tsx` transform. Chromium 1600×1000,
  light, offline user, Advanced mode.
- The fixture was copied before loading: `/tmp/da1/gv-bpmn.jjodel`, sha1 `c936a771…` (equal to the original).
- The probe loads the fixture with `ProjectsApi.importFromText` and opens `model_1`. It snapshots, right-clicks Sales,
  chooses «Add LaneSet (childLaneSet)», snapshots again, runs Auto layout, and snapshots a third time.
  `MODE=control` skips the Add (P12).
- Each snapshot records:
  - the React Flow store, through the fiber of `.react-flow`: `parentId`, `hidden`, `zIndex`, position and size;
  - the DOM: rect, computed `z-index`, `visibility`, `opacity`, and `elementFromPoint` at the centre;
  - the RF edges;
  - the Jjodel store: `father`, slot, owner, membership of `model.objects`, and the `DVertex` records with their
    graph;
  - the live containment model (`childrenOf`, `parentOf`, `containers`, `unclaimed`), from the `irContainmentRef`
    hook of `EditorV2`;
  - the live problems, from `problems/registry.ts` `getNodeProblemsSnapshot` (a dev-server module import, the same
    module instance the app uses).
- Trees and ports:

  | tree | sha | port |
  |---|---|---|
  | HEAD | `d2c42dcb1` | 3151 |
  | pre-merge | `07bfa0673` | 3152 |
  | staging merge | `d7b24c83b` | 3153 |
  | first graphVertex render | `6e22f4a9b` | 3154 |
  | membership drop | `38e7a6006` | 3155 |
  | before graphVertex channels | `b7d131729` | 3156 |

  Copies are `git archive` extracts under `/tmp/da1-trees/<sha>`, with `frontend/node_modules` symlinked to
  `~/jjodel/frontend/node_modules` (P14). Every server was started from its own copy.
- Raw outputs `*.out` are in `~/.jjodel-lanes/P-2026-10-15-1710/probe/`; crops (37 PNG) are in
  `~/.jjodel-lanes/P-2026-10-15-1710/crops/`.
- Console errors on every run: only `init_dash` (smoke baseline).

## 3. Question 1 — rendering or structure (measured, HEAD `d2c42dcb1`)

**Store before the Add.** Sales: `flowNodeRefs` = [Order received, Check order, In stock?], `childLaneSet` = []. The
fixture's views for Lane, read from the store's `DViewElement.ir`:

- «Lane»: `"containment":{"children":"$flowNodeRefs.values","childFilter":{"op":"isKind","class":"FlowNode"},"layout":{"mode":"free"…`
- «Lane with sub-lanes»: `"priority":1,…"predicate":{"op":"exists","path":"$childLaneSet.value"},…"containment":{"children":"$childLan…`

**React Flow and DOM.** The values are identical before the Add, after it, and in the control.

| node | RF `parentId` | RF `hidden` | RF `zIndex` | DOM rect before → after Add | computed z | visibility | on top at centre |
|---|---|---|---|---|---|---|---|
| Sales | null | false | −1999 | [345,186,826,171] → same | −1999 | visible | itself |
| Order received | null | false | — | [402,255,34,34] → same | 0 | visible | itself |
| Check order | null | false | — | [507,243,133,57] → same | 0 | visible | itself |
| In stock? | null | false | — | [725,248,47,47] → same | 0 | visible | itself |
| LaneSet_0 (new) | null | **true** | — | **no DOM node** | — | — | — |

Positive control for «no DOM node»: the same selector finds 12 `.react-flow__node` before and 12 after. The RF store
goes from 21 to 22 nodes; the new one is `LaneSet_0` at pos (1080, 100), `hidden: true`. React Flow does not mount
hidden nodes.

The `hidden` flag comes from the view, not from CSS. The fixture's «View for LaneSet» is
`"label":"LaneSet (not drawn)","visible":false`, and `computeViewHidden` (`irContainment.ts:493`) adds every object
whose resolved view has `visible` false:
> `if (!shown) out.add(objectId);`

It is called at `useIRContainment.ts:177`.

**Containment model, before → after the Add:**

| | before | after Add |
|---|---|---|
| `containers[Sales]` | `channelFeature: flowNodeRefs, steps 1, layout free` | `channelFeature: null, steps 2, layout partitions` |
| `childrenOf[Sales]` | [Order received, Check order, In stock?] | `[]` |
| `parentOf` of the three | Sales | absent |
| `unclaimed` | `[]` | [Order received, Check order, In stock?] |
| visible RF edges | 5 | 8 (+ Sales→Order received, Sales→Check order, Sales→In stock?, `instanceRef`, label `flowNodeRefs`) |

**Jjodel store, after the Add.** `LaneSet_0` has `father` = DValue `childLaneSet` of Sales, is in `model.objects`, and
has one `DVertex` in the v2-flow graph at (1080, 100, 200, 80). The three flow nodes keep `father` = DValue
`flowElements` of «Shop process». Their `DVertex` records and their graph are unchanged, and `Sales.flowNodeRefs` is
unchanged. Every `DVertex` hangs off the graph: there is no vertex nesting in the D-layer, before or after.

**Problems, live from the registry, after the Add.** Order received has `containment:unclaimed:…`, «In no container»;
Check order has the same. In stock? has `conformance:…` (already there before the Add, and in the control) plus
`containment:unclaimed:…`. The DOM shows three dots: two «In no container», and one «2» on In stock? whose `title`
reads «Conformance». That is why the earlier crops counted only two «In no container» dots: the third merged.

**Answer.** It is structure: the lane's derived membership changes. No part of it is CSS. Crops:
`head_add_1_before.png`, `head_add_2_after_add.png`, `head_add_3_after_layout.png`, `head_control_*`.

## 4. Question 2 — regression or pre-existing (measured)

| tree | Add: `childrenOf[Sales]` after | unclaimed | visible edges | Auto layout after Add (Order received / Check order / In stock?) | control Auto layout |
|---|---|---|---|---|---|
| `d2c42dcb1` HEAD | `[]` | 3 | 5→8 | (1120,672) (1072,1048) (1112,1368), outside Shop | inside Sales: (124,600) (460,584) (876,592) |
| `d7b24c83b` staging merge | `[]` | 3 | 5→8 | (1120,672) (1072,1048) (1112,1368) | not run (bracketed by the other two) |
| `07bfa0673` pre-merge | `[]` | 3 | 5→8 | (1120,672) (1072,1048) (1112,1368) | inside Sales: (124,600) (460,584) (876,592) |
| `38e7a6006` 2026-10-10 15:21 | `[]` | 3 | 5→8 | (1240,584) (1192,888) (1384,1208) | the same positions: no containment-aware Auto layout yet |
| `6e22f4a9b` 2026-10-10 10:09 | not readable (no `irContainmentRef` before `38e7a6006`) | DOM: «In no container» on Order received and Check order, «2» on In stock? | 5→8 | outside | outside, as above |
| `b7d131729` before graphVertex channels | n/a | none | 10→10 (every `flowNodeRefs` edge always drawn) | n/a | n/a |

- **Pre-existing.** The pre-merge copy already shows the defect, so no `git bisect` was run. That is the prompt's
  second branch; no bisect log exists.
- **The add-time defect** (the membership flip, the three edges and the «In no container» dots) is present from
  `6e22f4a9b`, «render graphVertex partitions, header bands, channel edges». That is the first commit where the
  fixture's lanes are containers.
  - Channel compilation came with `c64b9bfaf` (08:52) and was not run here.
  - At `b7d131729`, Sales is a 200×180 box at its D-layer position (1100, 520), and all ten edges are visible: there
    is no membership to lose.
- **The layout half** (Auto layout throws the nodes out after the Add while the control keeps them) can only show from
  `65dc0fe7e` «Auto layout across graphVertex containers, S6» (2026-10-10 19:30). At `38e7a6006` the control also
  throws them out. Dated by `git log -S computeContainedAutoLayout`, not run.
- **Origin of the predicate.** It was designed into the BPMN fixture by the graphVertex lane
  (`discovery_2026-10-10_graphvertex_bpmn_lanes.md:309-317`, `bpmn-lanes-fixture.ts:79-80`, first committed in
  `b7e061436`). The fixture file was exported by `GV_SAVE` on 2026-10-10 20:40.
- All five trees above are ancestors of the trunk (`git merge-base --is-ancestor`).

## 5. Question 3 — mechanism (read, each step confirmed by the measures of §3)

### 5.1 The «Add» path

- The menu label is built at `EditorV2.tsx:3321`: «`label: \`Add ${cls.name} (${ref.name})\``». The handler is
  `createCompositionChild` (`EditorV2.tsx:3109`).
- It places the child at the parent's right: `EditorV2.tsx:3118`:
  > `const childX = atPosition?.x ?? parentNode.position.x + parentW + 80;`

  Sales is at 130 with width 870, so x = 1080, as measured.
- It calls `syncCreateObject` (`:3123`), which creates the object with the model as father (`canvasToJjom.ts:1520`
  `const dObject = (DObject as any).new(`, «`DModel, // fatherType — MUST be DModel`»). It makes the vertex itself
  (`canvasToJjom.ts:1533` `return createVertexForObject(graphId, dObject.id, x, y);`) and pushes an RF node with no
  `parentId` (`EditorV2.tsx:3139`).
- `syncCreateCompositionLink` (`:3140`) then writes the slot (`canvasToJjom.ts:1741`
  `refProxy.values = [...meaningful, childObject.id];`). That re-fathers the object to the `childLaneSet` DValue,
  which is the measured `father`.
- Step 2bis of `useJjomSync` does not run for this object, because a vertex already exists. H2 does not apply to this
  gesture.

### 5.2 The parent of a nested instance is not decided by the Add: it is decided by the container's view

- `buildContainmentModel` resolves each node's view (`irContainment.ts:382`
  `const cv = resolveIRView(objectId, metaclassId, index, readCtx, idlookup);`). A declared channel reads its path
  (`:386-389`). `parentOf` is the innermost claimant (`resolveVisualParents`, comment at `:412-413`: «Single visual
  parent (R-GV-2): the innermost claimant wins, then canvas order»).
- `resolveIRView` takes the first candidate by priority whose predicate holds (`irResolveCore.ts:340`):
  > `if (c.entry.compiled.predicate(readCtx, objectId)) return c.entry.compiled;`
- `exists` is true for any value that is not undefined, null or empty (`irCompile.ts:194-197`):
  > `return (ctx, id) => { const v = acc(ctx, id); return v !== undefined && v !== null && v !== ''; };`

  An empty LaneSet is a pointer, so «Lane with sub-lanes» (priority 1) wins over «Lane».
- Its channel `$childLaneSet.value.$lanes.values` yields `[]`. Sales claims nothing, and the three flow nodes have no
  claimant left.
- No LaneSet view is a graphVertex: «LaneSet (not drawn)» is a hidden `vertex`. So the new LaneSet claims nothing
  either. The nodes are neither re-derived under it (H4) nor touched in the store (H5).

### 5.3 The three edges from above

`irContainment.ts:405` sets `channelFeature` to `null` for a multi-hop channel:
> `if (channel) info.channelFeature = channel.steps.length === 1 ? channel.steps[0].feature : null;`

`suppressChannelEdges` then gives up on Sales (`:1010`):
> `if (src === undefined || tgt === undefined || !info || info.edges !== 'hide' || info.channelFeature === null) return null;`

So the `flowNodeRefs` reference edges, which the «Lane» view hid as channel edges, are drawn again: three `instanceRef`
edges out of Sales, routed above the frame.

### 5.4 The problem dots

`computeUnclaimed` (`irContainment.ts:430-448`) walks the composition slot of each child that a declared channel
claims. Warehouse claims Ship and Shipped, which sit in `Shop process.flowElements`. Every sibling in that slot that
has a vertex, passes Warehouse's `childFilter` (FlowNode) and is claimed by no container is flagged:
> `if (passes) out.add(sib);`

That gives Order received, Check order and In stock?. The overlay entry is `problems/containmentToProblems.ts:40-53`,
id `containment:unclaimed:${nodeId}`, `severity: 'warning'`, `title: 'In no container'`, and description
«`${quote(child)} sits beside objects a container lists, and no container lists it.`».

### 5.5 Auto layout

`planContainedLayout` (`utils/elkContainers.ts:70`) uses three rules:

- `isOwner` (`:86`) needs a shown child, and Sales now has none.
- `runOf` (`:96`) walks `parentOf`, and the three nodes have none, so it returns `undefined`: the root run.
- Sales is a band of Shop (`isBand`, `:79`) and not an owner, so it is skipped (`:121`).

Result: Sales is laid out empty inside Shop, and the three flow nodes go to the root run below and outside Shop.

## 6. The smallest fix, measured

- **Where.** `frontend/scripts/probe/bpmn-lanes-fixture.ts:80` (one line), then re-export
  `~/jjodel-demo-exports/graphvertex/gv-bpmn.jjodel` with `GV_SAVE` (`bpmn-lanes-fixture.ts:25-26`).
  - From: `predicate: { op: 'exists', path: '$childLaneSet.value' },`
  - To: `predicate: { op: 'not', arg: { op: 'empty', path: '$childLaneSet.value.$lanes.values' } },`
  - This is the form the same file uses for «Pool with lanes» at `:60`:
    `predicate: { op: 'not', arg: { op: 'empty', path: '$processRef.value.$laneSets.values' } },`
- **Measured on HEAD**, with the view patched in the browser through the L-proxy (`L.fromPointer(ve).ir = {...}`, as
  the authoring panels write it). The patch was read back from the store after 2 s, which is the P12 control on the
  deferred commit:
  `FIXPATCH {"before":"{\"op\":\"exists\",…}","after":"{\"op\":\"not\",\"arg\":{\"op\":\"empty\",…}}"}`.
  - After the Add: `containers[Sales]` stays `channelFeature: flowNodeRefs, steps 1, layout free`, `childrenOf[Sales]`
    keeps the three nodes, `unclaimed` is `[]`, 5 edges are visible, and there is no «In no container».
  - After Auto layout: Order received (124,600), Check order (460,584) and In stock? (876,592) are inside Sales, the
    same positions as the control.
  - Crops: `head_fixpred_add_*`.
- **Selectivity, measured on HEAD.** After the Add, a Lane `Lane_0` was created into `LaneSet_0.lanes`. This was setup
  only, not the subject: it used the same two sync helpers the Add handler calls, imported from the dev server,
  because `LaneSet_0` is hidden and cannot be right-clicked.
  - With the patch, Sales switches to the sub-lanes view and claims `Lane_0`.
  - Without the patch, the result is the same.
  - The three flow nodes are then unclaimed in both cases. That is the declared design (two views, single visual
    parent; `discovery_2026-10-10_graphvertex_bpmn_lanes.md:326`, `:423-425`): moving them into the sub-lane is the
    modeller's next step.
  - Crops: `head_sublane_predicate_*`, `head_sublane_none_*`.
- **Scope.**
  - No app source changes and no CLAUDE.md §3 critical-zone file. The file is a probe script, not under
    `viewpoint/ir/`.
  - No persisted format, no VersionFixer step.
  - Saved projects that carry the old predicate, only those built from this fixture, keep the behaviour until the
    predicate is edited in the authoring panel. A migration that rewrites a user's viewpoint predicate would be wrong.
  - It can enter 3.1, but it does not need to, since nothing in 3.1 ships this viewpoint.
- **Search for the predicate in shipped code.** `command grep -rln "Lane with sub-lanes\|childLaneSet"` over
  `frontend/src frontend/scripts docs` hits only tests (`ir.test.ts:2491`, `graphVertexAuthoring.test.ts`,
  `containmentSection.test.ts`, `irContainerLayout.test.ts`), the probe script, and docs. The positive control is the
  same command finding `ir.test.ts`.
  - `git ls-files | grep .jjodel$` lists no `gv-bpmn` (the shipped examples are the two codegen ones).
  - The tests assert resolution semantics, and none needs to change.
- **Same pattern elsewhere, read only.** `scripts/probe/statechart-fixture.ts:108` and `:114` use `exists` on
  `$regions.values[0]` and `[1]`. A simple state has no members before the flip, so there is nothing to orphan. Not
  measured.

A code-level alternative was considered and not recommended: changing `exists`, or making «Add» refuse a slot that is
a hop of another view's channel. The first breaks every `exists` predicate (the derived viewpoints use it for guards,
`viewpointDerivation.ts:716`, `:928`, `:1091`). The second is policy for a modelling choice the viewpoint author
already controls.

## 7. Files read

- `frontend/src/components/editor-v2/EditorV2.tsx` (3105-3150, 3321)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (1454-1536, 1701-1750)
- `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` (32-80, 380-455, 493-507, 1003-1035)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (310-345)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (190-200)
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (166-191)
- `frontend/src/components/editor-v2/utils/elkContainers.ts` (70-125)
- `frontend/src/components/editor-v2/problems/containmentToProblems.ts` (36-56)
- `frontend/src/components/editor-v2/problems/registry.ts` (exports)
- `frontend/scripts/probe/bpmn-lanes-fixture.ts` (25-38, 59-83)
- `frontend/scripts/smoke/states.ts` (105-190, 526-560)
- `docs/discovery/discovery_2026-10-12_rel31_version.md` §5
- `docs/discovery/discovery_2026-10-12_rel31_staging_merge.md` (D-A1)
- `docs/discovery/discovery_2026-10-12_rel31_staging_lir.md` §0, §3 R2
- `docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md` (greps)
- `docs/decisions.md` (R-NEST-6)
- `docs/PROTOCOL.md`

A subagent read the same code paths independently and reached the same conclusion. Its citations were re-checked
above.

## 8. Decisions

**Decisions taken (unattended)**
- No `git bisect`. The pre-merge copy shows the defect, so the prompt's second branch applies. The birth was dated on
  four earlier commits instead.
- Three extra copies (`6e22f4a9b`, `38e7a6006`, `b7d131729`) on ports 3154 to 3156, beyond the prompt's 3152 and 3153.
  All are `git archive` copies in `/tmp/da1-trees/`, never `git bisect` in a tree.
- The candidate fix was measured by patching the viewpoint in the probe's browser, not by editing source or the
  fixture.
- The sub-lane in §6 was created through the sync helpers, as setup, because the LaneSet node is hidden.
- The staging-merge copy ran only the Add; its control is bracketed by the identical pre-merge and HEAD controls.

**Decisions awaiting Alfonso**
- **D1** (where the fix lives): change the viewpoint predicate in `bpmn-lanes-fixture.ts:80` and re-export the demo,
  rather than change app code. Recommended: the generator line plus the re-export, in a fast lane after 3.1.
- **D2** (3.1): D-A1 is not a blocker. Recommended: ship 3.1. Close D-A1 as pre-existing and caused by demo viewpoint
  data.
- **D3** (L1's LIR §3 R2 A1): the Step 2bis vertex for nested instances under a graphVertex container is not what
  D-A1 shows. This replay did not exercise it: the Add makes its own vertex. Its other paths, a JjScript
  `create … in` or a Data Manager create and then a reopen, are unmeasured. Recommended: keep L1's RC-23 item,
  reworded to those paths.

## 9. Questions

1. Fix the viewpoint in the generator and re-export the demo, in a fast lane after 3.1? Recommended: yes, `bpmn-lanes-fixture.ts:80` only.
2. Close D-A1 for 3.1 as «pre-existing, demo viewpoint data, not a blocker»? Recommended: yes.

## 10. Verdict for the release

**Not a blocker for 3.1.** The defect predates the 3.1 staging merge: it was born on 2026-10-10 with the
channel-derived lane membership. It comes from the predicate of a demo viewpoint that the app does not ship, not from
3.1 code. It loses no data, and its fix touches neither the critical zone nor the persisted format.
