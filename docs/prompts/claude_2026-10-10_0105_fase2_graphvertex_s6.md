[P-2026-10-10-0105] Phase 2 GO: slice S6 (Auto layout for containers). Visual. Hard stop after S6.

Prompt-ID: P-2026-10-10-0105
Chat: C-2026-10-10-0057
Lane: full (§3.1 zone `viewpoint/ir/`, go-ahead granted 2026-10-10; `utils/elkLayout.ts` is not a §3.2 file)
Depends: S2b of this lane, and the merge of `ir-graphvertex-s4` into `ir-graphvertex` (P-2026-10-10-1716)

## Accepted from S2b

Commits `d2f169781`, `7b0aa3a46`, `3858e8cf2` and `0ead2cb30` are accepted, with your six unattended decisions. Alfonso ratified on 2026-10-10 at 17:16:

- the scope expansion to `irContainment.ts`;
- decision 3 (selection lift) also closes S3's open point about a selected pool covering its lanes;
- resizing a self-framed container from its top or left handle snaps back to its children's frame, accepted for v1.

Two of your items go to a later small lane, not here: the collapse chip under the edges (it will move into the header band), and the two IR gaps (an edge view hiding a reference edge, a predicate reaching an object's owner). Leave the `Region.state` workaround in the fixture.

## Branch state

`ir-graphvertex-s4` (the authoring panel, S4) has been merged into this branch. Run `git log -5` first and confirm the merge commit. The addendum §5 now carries two amendments from the chat (`30a73a67c` on the S4 side): the S2 claim rule and the narrowing of R-GV-4 you proposed in S3. Read them, do not edit them.

## Why

ELK is flat (report §C2): `buildElkGraph` turns every visible node into a root child. After the toolbar's Auto layout, a pool's flow nodes leave their lanes and a composite state's substates leave its frame. The next membership pass then reads the moved nodes as dropped elsewhere, or not at all. S6 makes Auto layout respect containment.

## COSA

The geometry of partitions and frames stays where S2 and S2b put it (`irPartitions.ts`, the frame pass). ELK only decides the order and the coordinates of what is free to move. The chat decided the strategy (RC-25):

1. **Bottom-up by container.** Lay out each container's content before the level above, innermost first, then treat each laid-out container as a fixed-size block at its parent's level. Top-level nodes and containers are laid out together at the root, as today.
2. **Self-framed and free containers** (`frame: 'self'`, or `layout.mode: 'free'`): one ELK run on the container's visible children and the edges among them, with the same options as today's root run. Place the result inside the container's content box (below the header band, inside the padding). The frame pass then sizes the container.
3. **Partitions containers** (`layout.mode: 'partitions'`): one layered ELK run on the flow nodes of **all** its partitions together, with the direction across the partitions (stacked partitions, axis `y`: `RIGHT`; side-by-side, axis `x`: `DOWN`). Keep the ELK coordinate along the flow, so a flow that crosses partitions still reads in one direction. Across the flow, place each node inside its own partition's band, keeping ELK's relative order within the band. Grow a partition across the flow when its nodes need it (write its size), and never shrink it below its stored size.
4. **Edges that cross a container boundary** take part in the run of their lowest common container (or the root). Edges hidden by channel suppression (§5) take no part.
5. **No change for views without containment.** A graph with no graphVertex view, and the S1 hull scenes, must get exactly today's positions.
6. **Collapsed containers** are laid out as a single node at their collapsed size. Their hidden content is not touched.

Write the positions back through the path Auto layout uses today, under the active layout key (R-LAY-14). The open-time auto-layout gate (`utils/autoLayoutOnOpen.ts`) is not touched: it decides whether layout runs, S6 decides how.

## COME

- **Acceptance criteria**, measured from Redux and the DOM on a port of your own (not 3000), in the light theme, after one click on the toolbar's Auto layout:
  - **BPMN fixture:** every flow node lies inside its lane's band and stays in its lane's `flowNodeRefs`; no two flow nodes overlap; every sequence flow that is not a back edge goes left to right (source x < target x); the pool contains its lanes; a second Auto layout gives the same positions (idempotent within 1 px).
  - **Statechart fixture:** every substate lies inside its frame, and `Active`'s two regions stay inside `Active`, each with its own states; no overlaps; idempotent.
  - **Controls:** a graph with no graphVertex view gets byte-identical positions before and after S6, and so do the S1 hull scenes. Every S2, S2b and S3 check still passes.
- **Measurements:** JSON and screenshots under `docs/discovery/assets/graphvertex-s6/`.
- **Gates:** `npx tsc --noEmit` (baseline only), the `viewpoint/ir`, `nodes` and editor-v2 suites, the full suite, `npm run build`. Then a mutation bench on the container ordering and the band placement.
- **Commits:** explicit pathspec and the `Model:` trailer. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## DOVE

`utils/elkLayout.ts`, a new pure helper beside it if the bottom-up pass needs one (search the name first), `viewpoint/ir/irPartitions.ts` or the frame helper only to reuse their geometry, the Auto layout call site in `EditorV2.tsx` only if its input must change, the two fixtures, tests, the assets and the inbox entry.

## NON FARE

- No §3.2 file. If one becomes necessary, stop with `Outcome: question`.
- No change to ELK's options for the flat case, nor to `utils/autoLayoutOnOpen.ts` or the open-time layout region.
- No React Flow `parentId` (strategy β stands).
- No change to the authoring panel, `viewpoint/derive/`, or the simulator.
- No `irVersion` bump, no VersionFixer. Do not touch the `Status` line.

## HARD STOP

After the commits, with green gates and the measurements saved, stop with `Outcome: hard-stop`. The chat then prepares Alfonso's visual check and the merge of `ir-graphvertex` into the trunk.
