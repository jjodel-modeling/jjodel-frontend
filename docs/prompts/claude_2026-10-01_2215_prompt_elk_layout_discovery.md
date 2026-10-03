# Prompt: Phase 1 discovery, why ELK auto-layout falls short of commercial-grade diagrams, measured per notation

Prompt-ID: P-2026-10-01-2215
Chat: C-2026-10-01-2215
Lane: Phase 1 only (discovery, read-only on `frontend/src`; no Phase 2 in cascade: the fixes may touch `portDistribution.ts` / `handlePosition.ts` and what the MODELS demo shows, both on the RC-26 list). Tier: heavy.
Status: eseguito 2026-10-01 · lane elk-layout-disc · e83a16d41 · Phase 1 hard-stop: report docs/discovery/discovery_2026-10-01_elk_layout_quality.md, seven questions with Recommended lines, decisions D-A..D-C await Alfonso (RC-26)

Worktree: `~/jjodel-w-elklayout`, branch `elk-layout-disc`, created from the trunk `alfonso-frontend-jjtl` at `ac3890b7e`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-elklayout`, branch `elk-layout-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso's requirement, stated 2026-10-01: every notation Jjodel renders must look like a commercial product. The chat read `frontend/src/components/editor-v2/utils/elkLayout.ts` and its only caller, `handleAutoLayout` in `EditorV2.tsx` (about line 3635), and believes ELK is badly configured rather than inadequate. Verify every point below by measurement; none is assumed.

1. **Routes discarded.** `computeElkLayout` reads only `layout.children` positions. The edge `sections` (start, bend points, end) that ELK computes to avoid nodes and minimise crossings are thrown away; `handleAutoLayout` then recomputes anchor sides geometrically, clears waypoints and leaves routing to our router, which ignores other nodes.
2. **Fixed node size.** Every node goes to ELK as 180 x 120 regardless of its real geometry (the comment cites parity with the Jjodie path). Petri places, fork/join bars and small decision diamonds get oversized gaps; compartment nodes larger than 180 x 120 can overlap neighbours. The size contract (`shapeRegistry.ts`, `viewpoint/ir/useContentSize.ts`) never reaches ELK.
3. **Edge labels not passed.** Guards, multiplicities and role names are not given to ELK as labels with width and height, so ELK reserves no room for them. Candidate cause of the open ticket on overlapping guard labels in DemoFlowB.
4. **Ports not passed.** No port side constraints, so ELK's layer order and our post-hoc side choice (`computeGeometricAnchorsForAllEdges`) can contradict each other.
5. **No hierarchy.** graphVertex nesting is not passed as compound nodes.
6. **Metamodel-only strategy.** The priority scheme (inheritance reversed, references at priority 0 or 3) is designed for class diagrams. On behavioural models there is no inheritance, every edge gets priority 3 and the direction is always DOWN. No per-notation profile exists: direction (single vertical axis for Activity (UML), as ratified; left to right is the usual Petri reading), layer constraints (initial pseudostate first, finals last), node placement (BRANDES_KOEPF with balanced alignment gives straight spines; today NETWORK_SIMPLEX), edge routing style.
7. **Minor.** No snap to the 8 px grid; `elk.bundled.js` on the main thread (no worker); `considerModelOrder: NODES_AND_EDGES` may constrain crossing minimisation (verify against elkjs 0.11 semantics, do not assume).

Also establish: whether «Derive viewpoint» or any Jjodie path calls a layout at all, where M1 node positions come from when a derived viewpoint is opened, and how waypoints are stored and rendered today (`data.waypoints`, Eroute), so that ELK bend points could map onto them.

### Measurement method

Extract real graphs from rendered canvases with `lane-run probe` (free port, not 3000, 3001, 3003; light theme; isolated profile): measured node rects, edge endpoints, label boxes, edge types. Scenes: DemoFlowB under Flowchart and Activity (UML), DemoPetri under Petri net (classic), DemoPEST under Statechart (UML), an ER-shaped model under ER, and one metamodel under the default class view. Then run elkjs directly in node, outside the app, on those graphs, in cumulative variants:

- V0: today, measured on the real canvas after the toolbar auto-layout (our router included).
- V1: real node sizes.
- V2: V1 plus edge labels with measured sizes.
- V3: V2 plus ELK routes used as the edge geometry.
- V4: V3 plus a per-notation profile (direction, layer constraints, node placement, routing).
- V5: V4 plus ports with fixed sides.

For each scene and variant compute these metrics (they implement the quality bar ratified in chat): node-node overlaps; edge-node intersections (must be 0); edge crossings; label-label and label-geometry overlaps; nodes off the 8 px grid; bend count per edge; drawing area and aspect ratio; layout time in ms. Render V0 and the best variant as SVG crops (`sips -Z 600`) under `frontend/scripts/smoke/_tmp_elk_crops/` (gitignored) so the chat can compare them side by side. Probe and variant scripts stay under gitignored `_tmp_` paths and are never committed.

## DOVE

Phase 1 only. Report `docs/discovery/discovery_2026-10-01_elk_layout_quality.md` with: objective; files read (full paths); answers to points 1 to 7 and to the three questions above, each with file and line; the metrics table (scene x variant); the crop paths; for each correction its perimeter (files), a prospective Layer Impact Report where it touches `portDistribution.ts`, `handlePosition.ts`, `useJjomSync.ts` or `canvasToJjom.ts`, risk, and an estimate of whether it can land before the trunk merge deadline of 2026-10-07; a draft of a per-notation layout profile as an additive, optional key in `notationCatalog.ts` / the viewpoint IR (shape only, no code); questions, each with a single `Recommended:`. Log entry in `docs/log-inbox/views.md`; this prompt's Status line.

No edit under `frontend/src`.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, `elkLayout.ts`, `handleAutoLayout` in `EditorV2.tsx`, `portDistribution.ts`, `handlePosition.ts`, the edge waypoint code, `viewpoint/derive/viewpointDerivation.ts`, `viewpoint/derive/notations.ts`, `viewpoint/ir/notationCatalog.ts`, `viewpoint/ir/irJunctions.ts`, and the elkjs 0.11 option reference shipped in `node_modules/elkjs` (confirm every option name you cite).
2. Extract the graphs, run V0..V5, compute the metrics, render the crops.
3. Write and commit the report (`docs:`), then the log entry and the Status flip in one `docs:` commit; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the headline metrics (V0 vs best variant per scene) and the questions.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, edits under `frontend/src`, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

`elkLayout.ts` (`computeElkLayout`, NODE_W/NODE_H, priority scheme); `EditorV2.tsx` `handleAutoLayout`; R-VP-26 (Activity (UML): single axis, explicit decision/merge diamonds); R-VP-24/25 (open arrowheads); the size contract D8..D13; the open ticket on guard labels overlapping on the DemoFlowB layout; elkjs ^0.11.0 in `frontend/package.json`.
