# Parked work

Code and prompts that were partially implemented but parked for redesign.
Files here are NOT part of the build. Do not import from them.

## manhattanRouting.ts.parked

Prompt: `2026-05-02_manhattan-routing-fase-B.md`
Status: implementato, ma non funzionante.
Reasons:
- get_segments_impl is invoked ~4× per edge with transient node positions;
  rendering uses cached edge.d that doesn't match last computation.
- Injection point (post-get_points, pre-EdgeSegment construction) is wrong:
  it operates on data that is still being recomputed elsewhere.
- Multi-edge index, source/target side, L vs Z choice all worked individually
  but composed incorrectly with the reactive pipeline.

What to keep from this work:
- Discovery report: docs/discovery-edge-routing-2026-05-02.md
- Geometry helpers (getOutgoingSide, computeSideAnchor, projectionsOverlap,
  computeManhattanPath) are correct in isolation.
- Self-edge handling, multi-edge distribution: usable as-is.

Likely correct injection point for future work:
- Wrap LVoidEdge.get_d(c) AFTER segments are stable (post-snap, post-labels).
  Take the final SVG path as input and apply Manhattan transformation
  to the existing path, similar to roundManhattanPath in editor-v2/utils/edgeUtils.ts:512.
- Alternative: inject at LViewElement.viewpoint.applyView level so routing
  decisions are made by the viewpoint, not by the edge L-class.

DO NOT delete this file without first checking with Alfonso.
