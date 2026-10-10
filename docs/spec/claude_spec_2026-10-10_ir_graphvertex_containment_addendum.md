# IR spec addendum — graphVertex containment: channel, layout, membership (ir-1.2, additive)

**Date**: 2026-10-10
**Status**: **ratified** (Alfonso, 2026-10-10 08:27, «ratifico tutto», chat C-2026-10-10-0057). Registered as the R-GV series in `docs/decisions.md`.
**Extends**: `claude_spec_2026-07-18_ir_schema_v1_2.md` §8 (graphVertex and collapse), amended in §3 below. Lives beside the row-dispatch addendum (`claude_spec_2026-07-25_ir_row_dispatch_addendum.md`) and the FormSpec addendum (`claude_spec_2026-08-28_ir_formspec_addendum.md`).
**Based on**: `docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md` (P-2026-10-10-0105 Phase 1), benchmark OMG BPMN 2.0 pools and lanes (§G of that report).
**Schema version**: no `irVersion` bump, no VersionFixer, no backfill. Every key is optional; a view without them behaves exactly as before (the R-B9 precedent: IR views carry no VersionFixer).

## 1. Scope

A `graphVertex` today draws a hull: the container node and its children stay top-level React Flow nodes in absolute coordinates, and an overlay box is drawn around them (`IRContainmentHulls.tsx`). Children are the composition children of the container, filtered by `childFilter`. This addendum adds what an OMG-faithful notation needs on top of that:

- a **children channel** that may follow a non-containment reference (§2.1);
- a **single visual parent** rule for a node more than one container claims (§4);
- an **arrangement**: free, or partitions that fill the container, with a header band (§2.2, §7);
- a **header label**, drawn in the band, optionally vertical (§2.3);
- a declared **membership edit**: what a drop across a container boundary does to the model, and where a new child is created (§6);
- **channel-edge suppression** (§5);
- parity keys the `vertex` kind already has (§2.6).

Out of scope: boundary events (a bordered-node capability, not a kind), nested-object vertices (a separate discovery, P-2026-10-10-0830), the authoring panel (slice S4).

## 2. Keys

All keys below live on `GraphVertexViewIR` and are optional. "Validation" is authoring-time (`validateIR`), by the R-B9-bis criterion: the render stays permissive towards what is persisted and reads an out-of-vocabulary value as absent, the authoring surface refuses it.

### 2.1 `containment.children?: PathExpr`

The children channel.

- **Absent**: the composition children of the container (every value of every composition reference slot), as today.
- **Present**: the objects the path reaches from the container. Hops follow the existing navigation contract (`irReadCtx.navigateRefHop`): a hop takes `value` (first) or `values[N]`; the terminal step takes `value`, `values[N]` or `values` (the whole list). Values that are not element ids are ignored. The path may be containment or not.
- `childFilter` applies to the channel's objects in both cases. The container itself and repeated ids are dropped.
- The channel's features enter the view's dependency set; a multi-hop channel registers its cross paths (spec v1.2 §9) like any other multi-hop PathExpr.
- **Validation**: a non-empty string that parses as a PathExpr; no non-terminal hop may read a whole array (`values` without an index), because such a hop can never navigate; the reserved `container` token is illegal here (R-B13: it is an edge endpoint token only); a presentation read `node.[x]` is illegal (not a PathExpr).
- **v1 limit**: a hop cannot fan out over a list. A channel that needs it (a pool's lanes across several LaneSets) reads `values[0]`; the JjEL profile (R-J2, R-J7) is not extended.

### 2.2 `containment.layout?: ContainmentLayout`

```typescript
type ContainmentLayoutMode = 'free' | 'partitions';
type PartitionAxis = 'vertical' | 'horizontal';
type HeaderSide = 'w' | 'n';

interface ContainmentLayout {
    mode: ContainmentLayoutMode;
    axis?: PartitionAxis;                       // partitions only; absent = 'vertical'
    header?: { side: HeaderSide; size: number }; // absent = no band
    padding?: number;                           // px, >= 0; absent = 0
}
```

- **Absent**: `mode: 'free'`, no band, the hull of today.
- `free`: children keep the positions they have; the header band, when declared, is drawn and the children may not enter it (enforced by the gesture slice, S3).
- `partitions`: the children are stacked along `axis` and fill the container's inner area (geometry in §7). `vertical` stacks top to bottom (BPMN lanes of a horizontal pool); `horizontal` stacks left to right.
- `header.side`: `w` is a band on the left, `n` a band on top. `size` is its thickness in px.
- **Validation**: an object; `mode` required, in the vocabulary; `axis` only with `partitions`, in the vocabulary; `header` an object with `side` in the vocabulary and `size` a finite number > 0; `padding` a finite number >= 0.
- **Render permissive**: an unknown `mode` reads `free`; an unknown `axis` reads `vertical`; a malformed `header` reads as no band; a malformed `padding` reads 0.

The name `layout` is the one spec v1.1 §5.5 and v1.2 §8 already used. Its v1.1 values `vertical | horizontal | grid` («SCSS generato best-effort») never reached the code and are **withdrawn** (§3).

### 2.3 Header label: `LabelSpec.position: 'header'`, `LabelSpec.orientation?`

- `LabelPosition` widens with `'header'`: the label is drawn inside the header band of `containment.layout.header`.
- `orientation?: 'horizontal' | 'vertical'`: the text direction in the band. Absent = `horizontal`. `vertical` reads bottom to top (BPMN pool and lane names).
- **Validation**: `position: 'header'` is legal only on a `graphVertex` whose `containment.layout.header` is declared; `orientation` is in the vocabulary and legal only with `position: 'header'`.
- **Render permissive**: a `header` label on a view without a band is drawn as `top`; `orientation` elsewhere is ignored.

### 2.4 `containment.membership?: ContainmentMembership`

```typescript
type MembershipMode = 'none' | 'forbid' | 'reference' | 'reparent';

interface ContainmentMembership {
    mode: MembershipMode;
    create?: { ownerKind: string; feature: string };   // `reference` only
}
```

Semantics in §6. **Validation**: an object; `mode` in the vocabulary; `reference` requires a declared `containment.children`; `create` only with `reference`, with `ownerKind` a non-empty metaclass name and `feature` a feature name (`[A-Za-z_][A-Za-z0-9_]*`). Whether the channel's terminal feature is containment (`reparent`) or not (`reference`) is a metamodel fact: the authoring panel checks it, `validateIR` (which has no metamodel) does not. **Render permissive**: an unknown `mode` reads `none`.

### 2.5 `containment.edges?: 'show' | 'hide'`

Channel-edge suppression (§5). Absent = `show` (today: the edges between a container and its children are drawn). **Validation**: in the vocabulary. The seed of the authoring panel writes `hide` on a non-composition channel (R-GV-4).

### 2.6 Parity keys: `visible`, `resizable`, `defaultSize`

The `vertex` kind's three keys, with the same types, defaults and validation: `visible?: Conditional<boolean>` (absent = drawn; `false` hides the node through the existing presentation pass), `resizable?: boolean` (absent = the per-form default), `defaultSize?: { width?: number; height?: number }` (absent = size from content). `resizable`, when present, must be a boolean.

## 3. Amendment of spec v1.2 §8

Spec v1.2 §8 (`claude_spec_2026-07-18_ir_schema_v1_2.md:157-173`) is amended in three points. The collapse fields of §8, already amended by R-IRN-37, are not touched.

1. `layout: LayoutSpec` is **optional**, of type `ContainmentLayout` (§2.2). Absent = `free`.
2. The sentence «Coordinate dei figli: relative al contenitore (sistema RF parentNode)» is replaced by: **children keep absolute canvas coordinates and stay top-level React Flow nodes; the interpreter computes the partitions' boxes from the container's box (computed placement, strategy (β)) and moves descendants with their container on the gesture.** The canvas-to-JjOM write-back keeps its coordinate contract, and the per-viewpoint layout records (R-LAY-14) keep their meaning. React Flow reparenting (`parentId`, relative coordinates) is not used.
3. The v1.1 values `vertical | horizontal | grid` of `LayoutSpec.mode` are withdrawn as never implemented; `partitions` is a different thing (children fill the container), not a flow layout.

## 4. Single visual parent

A node is drawn inside at most one container. The rule is fixed by the interpreter, like lift-to-ancestor (spec v1.2 §7), not configurable per view.

- **Claims**: a container claims the objects its channel yields after `childFilter` (§2.1). A claimant is any container on the canvas whose resolved view is a `graphVertex`.
- **Depth**: the claim graph (container → claimed object) is walked breadth-first from the containers no one claims, depth 0. A container's depth is the length of the shortest claim path from such a root. A container reachable from no root (it sits on a claim cycle) has depth −1.
- **Winner**: among an object's claimants, the deepest wins ("innermost"); ties go to the first claimant in canvas order (the order of the nodes on the canvas). Losers do not draw the object.
- **Cycles**: a parent link that would close a cycle is not set; the object it would have parented is then drawn by no container in that cycle. The resulting parent map is always a forest.
- **Exposed sets**: the containment model exposes `multiClaimed` (object → every claimant, canvas order, only for two or more) and `unclaimed` (§4.1), for the problems overlay (`editor-v2/problems/`, slice S2).
- Composition channels in a well-formed model never produce two claimants: the model already keeps one container per object (`LValue.setValueAtPosition` auto-moves a value written into a second containment slot, discovery `docs/discovery/discovery_2026-07-27_containment_single_container_guard.md`). For them the rule reproduces today's result.

### 4.1 Unclaimed

An object is **unclaimed** when it sits in the same composition slot as an object claimed through a declared `containment.children` channel, has a node on the canvas, passes the `childFilter` of that claimant, and is claimed by no container. BPMN: a Task in `Process.flowElements` that no lane lists in `flowNodeRefs`. Default (composition) channels contribute no unclaimed objects.

### 4.2 Reactivity

A declared channel reads slots of objects other than the nodes it hides or draws. The containment model exposes `channelSlots`, the DValue ids read by every declared channel (each hop's slot and the terminal slot), so that the presentation pass can add them to its invalidation signature (slice S2; R-B16 is the precedent for the `container` endpoint).

## 5. Channel-edge suppression

With `containment.edges: 'hide'`, while the container is expanded, an edge between the container's node and the node of an object the container won (§4) is suppressed when it is the drawing of the channel itself: for a declared single-hop channel, a reference edge whose reference is the channel's terminal feature; for the default composition channel, a composition edge. A multi-hop channel has no direct container-to-child edge to suppress; the intermediate objects are governed by their own views (typically `visible: false`, whose edges the existing pass already suppresses when no rendered ancestor exists). Suppression is applied in the presentation pass, by `hidden`, never by removal, like row dispatch (row-dispatch addendum §6). Implemented in slice S2.

## 6. Membership edit

What a drop does when a node is released over a different container than the one that draws it. "Source" is the container that draws the node before the drag, "target" the container under the node's centre at release.

| Mode | Drop into another container of a view in the same mode | Drop on empty canvas |
|---|---|---|
| `none` (absent) | position only; the model is untouched (today) | position only |
| `forbid` | the node snaps back to its position before the drag | snaps back |
| `reference` | the node's id is removed from the source's terminal channel slot and appended to the target's, one undo step, one TRANSACTION of `SetFieldAction` only (§3.3 of the editor-v2 rules: no creator inside) | removed from the source's terminal slot; the node becomes unclaimed |
| `reparent` | the node's id is appended to the target's terminal channel slot (containment); the model's single-container auto-move removes it from the source (`LValue.setValueAtPosition`) | snaps back (an object stays contained) |

- When source and target resolve views in different modes, `forbid` on either side wins; otherwise the source's mode governs the removal and the target's the append.
- A drop inside the same container moves the node only.
- Dragging a container moves its descendants (the containers it won and, recursively, theirs) by the same delta, written with the existing batch position write. Under `partitions` the partitions are not dragged independently: their position is computed (§7).

### 6.1 Creation owner

Where a **new** object goes when it is created into a container: by a palette drop on the container, or by the connect gesture of an object-as-edge view between two nodes of the container.

- `reparent` and `none`: as today, the container's own composition reference (palette drop), or the root (connect).
- `reference` with `create: { ownerKind, feature }`: the object is created in the `feature` slot of the nearest composition ancestor of the container whose metaclass is `ownerKind` or a subclass (found through the complete composition walk, `ContainmentModel.containerOf`), and its id is appended to the container's terminal channel slot. BPMN: a Task dropped on a Lane is created in `Process.flowElements` and appended to `Lane.flowNodeRefs`; a SequenceFlow connected between two nodes of a lane is created in the same `Process.flowElements`.
- `reference` without `create`: palette drops onto the container are refused (the container's own composition reference is not the channel), and the connect gesture creates at the root as today.

The gestures are slice S3; this section is their contract.

## 7. Partition geometry

Applies when `containment.layout.mode` is `partitions`. Implemented as the pure module `viewpoint/ir/irPartitions.ts` (slice S1), wired in slice S2.

Notation: the **main** axis is the stacking axis (y for `vertical`, x for `horizontal`), the **cross** axis the other one. A header band on `w` consumes width, on `n` height; it is on the main axis when it consumes the main dimension, on the cross axis otherwise.

1. **Partition extent** along the main axis: its stored size on that axis when the partition's vertex `isResized` under the active layout key (R-LAY-4, R-LAY-14), otherwise the larger of its content extent and the minimum (`MIN_PARTITION_EXTENT`, 24 px).
2. **Container size**: main = the larger of (sum of the extents + 2 × padding + the band if on the main axis), the container's stored main size when it `isResized`, and the container's own content; cross = the larger of (the widest partition content on the cross axis + 2 × padding + the band if on the cross axis), the stored cross size when `isResized`, and the container's own content.
3. **Slack**: when the container is larger on the main axis than the sum requires, the difference goes to the last partition.
4. **Boxes**: the band sits at the container's `w` or `n` edge, full length; the partitions' region is the container minus the band, inset by the padding; partition *i* starts where *i − 1* ends and spans the full cross extent of the region.
5. **Paired-border resize**: moving the border between partitions *i* and *i + 1* by *d* adds *d* to *i* and subtracts it from *i + 1*, both clamped to the minimum; the sum is unchanged; both extents are then written as manual sizes (`isResized`).
6. Positions are computed in absolute coordinates on every render (§3); nothing new is persisted. A partition's manual size is the existing per-vertex record.

## 8. D-c: rows win

When a view's `children`-source field compartment (row dispatch) and its containment channel claim the same object, the **row wins**: the object is drawn as a row of the container and leaves the channel, hidden as a node by the row-dispatch pass. `validateIR` warns (it does not refuse) when a `graphVertex` declares a `children`-source compartment and no `containment.children`, because both then read the same composition children. The interpreter side (row hiding for `graphVertex`, exclusion from the channel) is slice S2; the warning is slice S1.

## 9. Two views for one metaclass (D-b)

A metaclass whose drawing changes with its structure (a lane with or without sub-lanes, a pool with or without lanes) is authored as **two views** of the same metaclass, told apart by `predicate` and `priority` (spec v1.2 §2), not as one adaptive view: the resolver already chooses among them, the authoring panel edits one view at a time, and an adaptive view would need a Conditional over `layout`, a new kind of axis.

## 10. Worked example

The OMG BPMN 2.0 views of the discovery report, §G2, with the membership of the pool without lanes written `{ "mode": "reparent" }` (its channel ends on `Process.flowElements`, a containment slot) and the leaf lane's channel filtered to `FlowNode`. They are the fixture `BPMN_VIEWS` of `viewpoint/ir/__tests__/ir.test.ts`, which asserts that they compile and validate clean.
