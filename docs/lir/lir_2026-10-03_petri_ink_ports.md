# Layer Impact Report: glyph ink, outside label sides, handles on ELK ports (P-2026-10-03-1920)

- Prompt-ID: `P-2026-10-03-1920` (chat `C-2026-10-03-1610`), written at the end of Phase 1 as the prompt's DOVE asks;
  Phase 2 commits it again (or confirms it unchanged) before the first code edit (RC-30)
- Tree: `~/jjodel-w-petriports`, branch `petri-ink-ports`, HEAD `517a7fb4d` at measure (code of the trunk `106aae181`)
- Go-ahead: RC-30, given by the chat at launch (`--critical-zone-goahead P-2026-10-03-1920`)
- Source: `docs/discovery/discovery_2026-10-03_petri_ink_ports.md` §3 and §6; probe `frontend/scripts/probe/petri-ink-ports.ts`

## 1. Files

| File | Item | Critical zone | Change |
|---|---|---|---|
| `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` | 1 | no | a preset that declares a fill (`solid`) draws fill and border in `NAME_INK` |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | 3, 2 | yes (`viewpoint/ir/`) | a routed synthetic edge takes its valid ELK route's sides (a diamond end and a junction member excepted); a pure `outsideAnchorFor(declared, taken)`; `irLabelAnchors` on the node data of a vertex whose outside label moves |
| `frontend/src/components/editor-v2/utils/handlePosition.ts` | 3 | yes (§3.1 cross-reference) | `SideEndpoint.pin?: number` (optional), an optional `pinOf` of `computeSideEndpoints`; `computeSidePositions` puts a pinned endpoint at its fraction |
| `frontend/src/components/editor-v2/components/DynamicHandles.tsx` | 3 | read with §3.1's pipeline | `pinOf` from the session route store while the route is valid; `elkRoutesRevision()` and the node rect in the positions memo's keys |
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | 2 | yes (`viewpoint/ir/`) | optional `labelAnchors` prop: an outside label paints `labelAnchors[l.anchor] ?? l.anchor` |
| `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | 2 | no | passes `data.irLabelAnchors` to `IRNodeContent` |
| `frontend/src/components/editor-v2/utils/elkLayout.ts` | 2 | no | the declared side reserved; one more ELK run when a route end takes a reserved side |
| tests | all | | red first: derive pins of `#334155`, the side and anchor rules, the pin, the second pass |

Not touched: `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `DV.tsx`, `VersionFixer.tsx`,
`portDistribution.ts`, `edgeUtils.ts`, `UnifiedEdge.tsx`, `metaclassPalette.ts`, the token files, `editor-v2/sim/`,
`model/simulation/`.

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): handle sides and positions of routed edges, the outside label's side,
      two session keys on node data
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence, by content only: a derived viewpoint created after the change stores the name ink in its
      documents; no key, no VersionFixer, no jsxString

Canvas v2-flow:
  - What changes: (1) none at render: the IR fill is drawn as before, its value changes in new derivations;
    (2) a vertex's outside label paints on a free side when an edge end holds its declared one (`irLabelAnchors`,
    session data on the React Flow node); ELK reserves the declared side and re-runs once on a taken one;
    (3) after a toolbar Auto layout, a synthetic edge with a valid ELK route takes the route's sides, and every
    routed end's handle sits at the route's end (the fraction along its side), until a move or a resize drops
    the route.
  - What does NOT change: views with no outside label; labels whose declared side is free; edges with no ELK
    route (every edge at rest, after a drag, after the first-open layout); handle ids and their role-keyed
    buckets (§3.10); MAX_HANDLES_PER_SIDE; a diamond end's side (endSideFor); Activity's junction members
    (assignActivityJunctions); user anchor overrides (they still win); the drawn paths (UnifiedEdge reads the
    route as today); the default viewpoint, which has no synthetic edge and no outside label.
  - Cross-layer interaction: irEdgeViews and DynamicHandles read the ELK route store of elkLayout.ts (session,
    never persisted), with isElkRouteValid on the rects they already hold; nothing is written to JjOM.
  - Side-effect safety: the decoration pass writes node data only where a value differs (the irBarOrientation
    pattern), so no render loop; DynamicHandles recomputes once per layout per node, not per drag frame (the
    route is dropped on the first move and the slots fall back to uniform).

Persistence:
  - What changes: the fill and border strings of the Petri transition, Flowchart's initial disc and State
    machine's named Initial in a newly derived viewpoint (`#334155` -> `var(--color-inode-name)`).
  - What does NOT change: irVersion, every saved viewpoint (keeps `#334155` until derived again), every key.

Smoke-test scenarios potentially affected:
  - DemoPetri as Petri net (classic) and Petri net, dark: bars 1.41:1 -> 12.59:1 (light 9.45 -> 16.3).
  - DemoFlowB as Flowchart, dark: initial disc 1.41:1 -> 12.6:1.
  - DemoPetri classic at rest: p2, p3 names 0 px from an arrowhead -> no label within 4 px; with DOWN: 6 labels
    on a line or arrowhead -> 0.
  - Every pane after Auto layout: 34 of 68 handles over 1 px from the drawn end (max 101), 5 on another side
    -> 0 over 1 px (Activity's 4 junction ends excepted), 0 sides.
  - The four default scenes, light and dark, at rest: byte-identical to 106aae181 (the probe's default-pane dump).
  - Import Families.ecore and open a project: no synthetic edge, no route at rest, untouched.
```
