# Layer Impact Report: A3 back, handles of an ELK-routed edge on its drawn ends (P-2026-10-10-0915)

- Prompt-ID: `P-2026-10-10-0915` (chat `C-2026-10-03-1610`), lane full, tier heavy (RC-32)
- Tree: `~/jjodel-w-elkhandles`, branch `elk-handles-a3`, cut from `alfonso-frontend-jjtl` at `c14082de9` (the prompt's
  docs commit on top of the trunk tip of 2026-10-10)
- Go-ahead: RC-30, given by the chat at launch (`--critical-zone-goahead P-2026-10-10-0915`) on Alfonso's yes of
  2026-10-10. This report is committed before any code change, as RC-30 asks.
- Source: A3 of P-2026-10-03-1920 (`6756eddd2`, R-VP-60), withdrawn by P-2026-10-04-0010 (`04c13e039`); the report
  `docs/discovery/discovery_2026-10-03_petri_ink_ports.md` §3.3 and §10; its LIR `docs/lir/lir_2026-10-03_petri_ink_ports.md`
  (item 3). The change is `git revert 04c13e039`: the code A3 was measured with, no new code.

## 1. Files

| File | Critical zone | Change (the inverse of `04c13e039`) |
|---|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | yes (`viewpoint/ir/`) | `synthesizeObjectAsEdges` takes an optional 11th `routeOf` (default `getElkRoute`); a synthetic edge whose ELK route is valid takes the route's sides and writes `irSourcePin` / `irTargetPin` (0 to 1 along the side) on its data, only for an end on the node's drawn border, never a diamond end; a user anchor override drops both. Every A2 hunk stays. |
| `frontend/src/components/editor-v2/utils/handlePosition.ts` | yes (§3.1 cross-reference) | `SideEndpoint.pin?` (optional, Rule 11); `computeSideEndpoints` reads the pin of its role from `data`; `computeSidePositions` puts a pinned endpoint at its pin, every other at its slot |
| `frontend/src/components/editor-v2/components/DynamicHandles.tsx` | read with §3.1's pipeline | `pinsKey(e)` appended to `edgeKey` (so `ownEdgesEqual` sees a pin change) and to `edgeTopologyKey` (so the positions memo and the re-measure key move with a pin) |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irElkPorts.test.ts` | test | restored (10 tests) |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irLabelAnchors.test.ts` | test | line 77: the 11th argument `() => undefined` back |

Not touched: `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `DV.tsx`, `VersionFixer.tsx`,
`portDistribution.ts`, `edgeUtils.ts`, `UnifiedEdge.tsx`, `EditorV2.tsx`, `elkLayout.ts`, `editor-v2/sim/`.

Since `04c13e039` the trunk changed one file A3 reads around: `UnifiedEdge.tsx` (`8d0021987`, P-2026-10-04-0935): route
avoidance and arc obstacles keep a node the run hides (`occupiesCanvas`). It does not read the pins, and A3 does not
read `hidden`: the run sets `hidden` on the arrays EditorV2 hands to React Flow, after `useIRContainment` (where the
pins are written), so a hidden edge keeps its data and its pins; `edgeKey` does not contain `hidden`, so hiding does
not re-render `DynamicHandles`. Measured by the lane's probe, not assumed.

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): sides and handle positions of a synthetic edge with a valid ELK
      route; two session keys on its data (irSourcePin, irTargetPin)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

Canvas v2-flow:
  - What changes: after a toolbar Auto layout, a synthetic (object-as-edge) edge whose ELK route is valid takes the
    route's sides, and each end on its node's drawn border carries a pin; DynamicHandles draws that end's handle
    at the pin. The pins live on React Flow edge data, written by the decoration pass (useIRContainment ->
    synthesizeObjectAsEdges), and vanish with the route (a move or a resize invalidates it).
  - What does NOT change: every edge without a valid route (at rest, after a drag, after the first-open layout);
    classic (non-synthetic) edges; diamond ends (endSideFor); Activity junction members; user anchor overrides;
    handle ids and the role-keyed buckets (§3.10); MAX_HANDLES_PER_SIDE; the drawn paths (UnifiedEdge reads the
    route as before); A1 (R-VP-58) and A2 (R-VP-59); the default viewpoint (no synthetic edge).
  - Cross-layer interaction: irEdgeViews reads the session route store of elkLayout.ts (getElkRoute,
    isElkRouteValid on the rects it already holds); nothing is written to Redux, JjOM or a saved document.
  - Side-effect safety: the risk named by the prompt is the «Maximum update depth» cascade of 2026-10-01
    (P-2026-10-01-1655 §3.4, root cause still open), where EditorV2's edges moved on every nested render and
    DynamicHandles' keys were part of the re-render path. A3 widens those keys with the pins. A pin is a pure
    function of the route and the two node rects, so it moves only when they move; it is written on a new edge
    object only where the pass rebuilds the edge anyway. Measured, not argued: the loop probe of this lane
    (60 gestures per derived viewpoint after one Auto layout, fresh pages, React's nested update count per
    gesture, DynamicHandles renders per gesture) runs before and after the revert.

Persistence: none. No key, no irVersion bump, no migration, no jsxString.

Smoke-test scenarios potentially affected:
  - The four demo scenes, default viewpoint: byte-identical to the trunk (the probe's default-pane dump).
  - Each derived notation after Auto layout: handles more than 1 px off the drawn end 34 of 68 -> 2 (work->d1,
    the diamond refit), handles on another side 5 -> 0, bends drawn over ELK's 0 -> 0.
  - A1 contrast and A2 label distances: unchanged from the trunk.
  - Drag a node and select edges on the four derived viewpoints after Auto layout: 0 «Maximum update depth»,
    0 CanvasErrorBoundary fallbacks, nested render depth at most 3.
  - DemoESM simulation, the demo's ten presses with the run's events hidden: 0 page errors, panel lines as on
    the trunk, the pinned handles of the visible nodes unmoved by the run.
  - Import Families.ecore and open a project: no synthetic edge, no route at rest, untouched.
```

## 3. Addendum 2026-10-21: A3 on the trunk (P-2026-10-21-1925)

- Tree: `~/jjodel-w-a3trunk`, branch `a3-on-trunk`, cut from the trunk at `7ecaa5c45`; merge `7ae59d306`
  (`git merge --no-ff elk-handles-a3`, tip `5c578ba53`, merge base `32ff5bf34`, 1417 trunk commits since). R-VP-60
  ratified by Alfonso 2026-10-21.
- Conflicts: one, `docs/log-inbox/views.md`. The trunk had folded the inbox into the log and its archive; resolved as
  the trunk's preamble plus the branch's two entries (P-2026-10-10-0915 and its Petri loop ticket), the folded base
  entries not carried back. No code conflict: the trunk did not change `irEdgeViews.ts`, `handlePosition.ts`,
  `DynamicHandles.tsx`, `irLabelAnchors.test.ts` or `petri-ink-ports.ts` since the base, so they come in as measured
  on the branch (for `petri-ink-ports.ts` the trunk's file plus the A3 assertions and the light-only default of
  `a57bd4d53`). `petri-drag-loop.ts` is the trunk's, unchanged: the branch never had it, nothing to re-apply.
  `docs/decisions.md` auto-merged (the branch's one R-VP-60 line).
- Gates on `7ae59d306`: `npm run typecheck` exit 0, no `error TS`; vitest on `viewpoint/ir`, `editor-v2/components`,
  `editor-v2/utils` and `edges/__tests__/bundleSpread.test.ts` (every test importing the three code files) 77 files,
  1673 tests, exit 0; `npm run build` built, 0 error lines (the chunk-size warning only); `npm run smoke` GREEN,
  12 passed, 3 skipped (declared gaps).
- Probes, same pages, trunk `7ecaa5c45` on 3085 and tip `7ae59d306` on 3084, light, the probe files of the tip
  (logs and JSON in `~/.jjodel-lanes/P-2026-10-21-1925/`):

| Measure | trunk | tip (A3) | 0915 lane (trunk -> branch) |
|---|---|---|---|
| petri-ink-ports | 63/73 (the 10 A3 checks red, control) | 73/73 | 63/73 -> 73/73 |
| Non-junction ends after Auto layout, handle over 1 px off along the side | 33 of 68 | 2 of 68 (work->d1, 6 px, the diamond leg) | 33 -> 2 |
| Handle on another side than the drawn end, off the diamonds | 5 | 0 | 5 -> 0 |
| Bends drawn over ELK's | 0 | 0 | 0 -> 0 |
| Default viewpoint panes identical | 4/4 | | 4/4 |
| petri-drag-loop, Petri classic, 10 fresh pages x 3 drags, at rest / after Auto layout with an edge selected | 0 / 0 crashes, depth 3 | 0 / 0 crashes, depth 3 | (not run: the probe is of P-2026-10-10-1020) |
| elk-handles-loop, 60 drags + 20 selections per viewpoint (Petri classic, Flowchart, Activity, Statechart) | 0 crashes, depth <= 3, 33/33 | 0 crashes, depth <= 3, 33/33 | Petri classic 5/5 pages crashed both sides; others 0 |
| DynamicHandles renders per drag (Petri classic, Flowchart, Activity, Statechart) | 7.4, 8.3, 4.3, 8.1 | 7.4, 8.5, 5.2, 8.3 | |
| Edges pinned after Auto layout (Petri classic, Flowchart, Activity, Statechart) | 0, 0, 0, 0 | 6, 9, 8, 3 | |
| DemoESM ten presses, default and derived Statechart: pins and kept handles unmoved, no page error | PASS | PASS | PASS |

- The Petri classic loop of 2026-10-10 is gone on both sides with Fix A (`a69fef5d9`): the ticket of the 0915 entry
  closes on the trunk's code, A3 included. Over 1 px across the side, the tip keeps the circle outline inset of the
  0915 lane (Petri `lock` ends 1.1 to 2.7 px), not gated.
- Crops: `~/.jjodel-lanes/P-2026-10-21-1925/crops/sbs_*_trunk_vs_tip.png` (Petri classic, Statechart PEST and ESM,
  Flowchart, Activity, after Auto layout). The drawn routes are the trunk's; on Petri classic the `lock` label sits
  below the place on the tip, as in the 0915 lane's crop (A2's outside label avoids the moved handle).
- The merge commit `7ae59d306` carries no `Model:` trailer (the hook exempts a merge; amending it was refused by the
  pathspec rule): the model is Anthropic Claude Opus 5.5.
