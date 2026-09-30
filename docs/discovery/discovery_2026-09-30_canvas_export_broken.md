# Discovery: canvas export broken in all four options (P-2026-09-30-2035, Phase 1)

**Prompt-ID**: P-2026-09-30-2035. **Prompt**: `docs/prompts/claude_2026-09-30_2035_prompt_canvas_export_fix.md`.
**Chat**: C-2026-09-30-2035. **Session**: `7c2c40b0-d222-4d0c-898d-8cebc8ef1a75`. **Tree**: `~/jjodel-w-canvasexport`,
branch `canvas-export-fix`, HEAD `db5bd645b` (trunk `31999a630` plus the prompt). **Model**: Claude Opus 5.5.

A set of hypotheses with evidence, not a reference. Line numbers are those of `db5bd645b`. **measured** = a run of this
phase on the lane's own vite (port 3141, light theme, DPR 2, headless Chromium, the probe-kit scenario `esm`/`sm`
copied from `~/jjodel-w-vpcolor`), probes `frontend/scripts/smoke/_tmp_canvasexport_{repro,dom,edges,proto}.ts`
(gitignored), logs `~/.jjodel-lanes/P-2026-09-30-2035/probe-{repro,proto}.log`, images under
`frontend/scripts/smoke/_tmp_canvas_export/phase1/`; **read** = a file read.

## 0. Answer in brief

- **Nothing happens on any option, M2 or M1** (measured): the menu dispatches one `jjodel:export-canvas` per click,
  then no download, no toast, no console error, and the clipboard keeps the text sentinel written before the click.
- **Root cause A, M2, all four**: `MetamodelTab.tsx:36` declares `canvasRef` and no element carries it. The
  `<div ref={canvasRef}>` went away with the classic subtree in `197b6c3d0` (classic shutdown, 2026-07-18), so the
  guard `if (!canvasRef.current || !model) return;` (`:41`) returns in silence. Measured through the fiber: `null`.
- **Root cause B, M1, all four**: the only listener is the per-instance `useEffect` of `MetamodelTab` (`:70`);
  `ModelTab.tsx` has none. Measured: one listener per mounted M2 tab (2 with two metamodels open, 0 once both M2
  tabs are closed with the M1 tab open). With the ref alone restored, every mounted M2 tab, hidden ones included,
  would export its own canvas on each click, and an M1 canvas never.
- **Root cause C, JPEG and SVG**: since `260e1a0ce` the handler calls `CanvasExportService.export(canvasRef.current)`
  with no options (`:57`): the format and the `filename` computed at `:44` never reach the service, so the file is
  always `metamodel_<date>.png` (read; latent behind A).
- **Root cause D, the image**: `.Graph` no longer exists (0 in the pane, measured), so the service renders the whole
  `.editor-v2__canvas` box as seen: cropped to the view (panned: 1 of 5 nodes in view, same 699x438 image), the
  canvas background `rgb(241, 245, 249)` and the minimap in the picture (97.6 % non-white pixels), half resolution
  (`pixelRatio: 0.5`, `CanvasExportService.ts:30`: 699x438 from a 1398x876 box).
- **Root cause E, edge lines missing**: html-to-image 1.11.13 deep-clones an `<svg>` and never visits its children
  (`node_modules/html-to-image/es/clone-node.js:49,55-57`), so only the root `<svg>` gets inline computed styles.
  The edge paths take their stroke from CSS classes (`.reference-edge`): in the image only labels and arrowheads.
- **Fix, prototyped in the page (no src change) and measured**: render `.react-flow__viewport` fitted to the diagram
  bounds (nodes, edges, edge labels, viewport portal) at zoom 1, pixelRatio 2, white background, with the computed
  paint of the SVG descendants inlined for the render and removed after. DemoESM M2 2056x944, 6.7 % non-white, 5/5
  nodes painted, edge points dark (0 of 4 without the inlining); M1 2230x2216, 10/10 nodes, 12/12 edge points dark;
  a zoomed-out and panned view gives the identical image size and measures.
- **Smallest fix per cause**: A+B one app-wide listener, installed when `MetamodelTab.tsx` loads, resolving the
  active canvas from the dock; C a pure routing `format -> call` passing `type` and `filename`; D and E in the
  service, taken when the element holds a React Flow viewport; the legacy element path stays as it is.
- **Not on the path** (measured by search): `ExportImageMenu` is mounted nowhere, `useCanvasExport` is imported only
  by it, and `Navbar.tsx:1401-1405` sends the right payload. None of the three changes.
- **Decisions awaiting Alfonso**: none (no RC-26 item). Taken unattended: §6.

Questions (each adopted as recommended by the cascade, RC-21):
1. Where does the single listener live? Recommended: installed at module load of `MetamodelTab.tsx` (loaded at startup by `TabDataMaker.tsx:3`), logic in the service; an always-mounted component would be outside DOVE.
2. What does the image show? Recommended: the whole diagram at zoom 1, pixelRatio 2, 24 px margin, white, independent of pan and zoom.
3. Edge lines: pin html-to-image 1.11.11 or inline the SVG paint? Recommended: inline, no dependency change.
4. Safari refuses a clipboard write made after a 1-3 s render. Recommended: a clear alert now, a ticket for a Promise-valued `ClipboardItem`.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The format chosen in the menu is lost before the service | holds (latent) | read: `MetamodelTab.tsx:57` calls `export(canvasRef.current)` with no options since `260e1a0ce` |
| H2 | `transform: 'none'` on the pan/zoom container breaks the image | falsified as a cause today | measured: the target is `.editor-v2__canvas`, computed `transform: none` already; the reset touches nothing |
| H3 | `.Graph` is an empty or zero-size container | partly | measured: there is no `.Graph` at all (0), the service falls back to the element passed |
| H4 | The pixel ratio degrades the image | holds | measured: 699x438 for a 1398x876 box (`pixelRatio: 0.5`) |
| H5 | Fonts or cross-origin CSS make html-to-image throw | falsified | measured: 4 `console.error` per render from the Google Fonts sheet (`SecurityError` on `cssRules`), caught inside the library; the render succeeds |
| H6 | `ClipboardItem` is missing or the permission is refused | falsified in Chromium | measured: with an element, `copyToClipboard` returns `true` and the clipboard holds `image/png` (Safari: §5) |
| H7 | `dae519413` or `260e1a0ce` broke the working version | partly | read: `260e1a0ce` dropped the options (H1); the silence of every option comes from `197b6c3d0` (§3.1) |
| H8 | `ExportImageMenu` / `useCanvasExport` are a live entry point | falsified | read by search: no importer of `ExportImageMenu` (§2.3) |

## 2. The event path, verbatim

### 2.1 Dispatcher (read)

`frontend/src/pages/components/Navbar.tsx:1398-1407`, File > Export Canvas, disabled when there is no metamodel:

```
isDashboard ? null : {name: 'Export Canvas', icon: <i className="bi bi-image" />,
    disabled: metamodels.length === 0,
    subItems: [
        {name: 'Export as PNG', function: () => window.dispatchEvent(new CustomEvent(JjodelEvents.EXPORT_CANVAS, { detail: { format: 'png' } })), ...
        {name: 'Export as JPEG', ... { detail: { format: 'jpeg' } })), ...
        {name: 'Export as SVG', ... { detail: { format: 'svg' } })), ...
        {name: 'divisor'},
        {name: 'Copy to Clipboard', ... { detail: { format: 'clipboard' } })), ...
```

The item is an `<li onClick={()=>i.function?.()}>` (`Navbar.tsx:394`); the parent `Export Canvas` has no function, so a
click dispatches once (measured: `eventsDispatched: 1` per option). `JjodelEvents.EXPORT_CANVAS` is
`'jjodel:export-canvas'` (`src/events/registry.ts:73`), the only occurrence of the literal in `src` (search
`command grep -rn "export-canvas" src`: 1 line).

### 2.2 Listener (read)

`frontend/src/components/abstract/tabs/MetamodelTab.tsx`:

```
36    const canvasRef = useRef<HTMLDivElement>(null);
39    useEffect(() => {
40        const handleExportCanvas = async (e: CustomEvent<{ format: string }>) => {
41            if (!canvasRef.current || !model) return;
43            const { format } = e.detail;
44            const filename = model.name || 'metamodel';
47                if (format === 'clipboard') {
48                    const success = await CanvasExportService.copyToClipboard(canvasRef.current, {
49                        backgroundColor: '#ffffff',
50                    });
56                } else {
57                    const result = await CanvasExportService.export(canvasRef.current);
70        window.addEventListener(JjodelEvents.EXPORT_CANVAS, handleExportCanvas as any);
74    }, [model]);
```

The render (`:183-199`) is a `<div className={'w-100 h-100'}>` with `ContextMenu`, the pending-edge banner and
`<EditorSwitch modelid={model.id} isMetamodel />`: no `ref=` in the file (search `command grep -n "ref=" MetamodelTab.tsx`:
exit 1; control `grep -c canvasRef`: 6). `ModelTab.tsx` has no `addEventListener` and no `EXPORT` (exit 1; control: 5
`import` lines found in the same file).

### 2.3 Service and the second entry point (read)

`frontend/src/services/CanvasExportService.ts`: `DEFAULT_OPTIONS` `:26-32` (`type: 'image/png'`, `quality: 0.95`,
`backgroundColor: '#ffffff'`, `pixelRatio: 0.5`, `style: {padding: '5px' }`); `export` `:43-73` renders
`canvasElement.querySelector('.Graph') as HTMLElement || canvasElement` (`:51`); `exportAsBlob` `:78-103` the same
element through `toBlob`; `copyToClipboard` `:108-128` awaits the blob, then `navigator.clipboard.write([new
ClipboardItem({ 'image/png': blob })])`; `generateDataUrl` `:165-188` switches on `options.type` (`'jpeg'`,
`'image/jpeg'`, `'svg'`, `'image/svg'`, default png) and forces `transform: 'none'`; `generateFilename` `:193-204`
builds `${base}_${timestamp}.${extension}`, the extension the last segment of `type`.

`frontend/src/hooks/useCanvasExport.ts:46-50` passes `type: format` correctly, but its only importer is
`ExportImageMenu.tsx:7`, and `ExportImageMenu` has no importer (`command grep -rln ExportImageMenu src`: its own file
only; `hooks/index.ts` does not re-export the hook). Dead code, not on the broken path.

## 3. History (read)

### 3.1 The three commits

- `dae519413` (2026-01-30, "canvas export"): creates the service, the hook, the menu and the listener; the listener
  passes `{ format, filename, backgroundColor, scale: 2 }`, and `ref={canvasRef}` sits on the classic
  `div.GraphContainer` that held `.Graph`.
- `260e1a0ce` (2026-02-04, "uniform ai services attempt"): swaps the service's own `ExportOptions` for html-to-image's
  (`format` -> `type`, `scale: 2` -> `pixelRatio: 0.5`, adds `style: {padding}`), and reduces the listener's call to
  `export(canvasRef.current)`. From here JPEG and SVG are PNG.
- `197b6c3d0` (2026-07-18, "classic shutdown"): deletes the classic subtree of `MetamodelTab`, and the `div` carrying
  `ref={canvasRef}` with it (`git log -S 'ref={canvasRef}'`: these two commits only). From here every option is
  silent. The metamodel canvas had been editor-v2 already (the comment at `MetamodelTab.tsx:195-197` says the M2
  classic slot "was already dead"), so the export had been rendering an unmounted slot since before that.

## 4. Reproduction (measured, `probe-repro.log`)

DemoESM M2 (5 classes, 5 edges) and demoESM M1 (10 objects, 12 edges), each canvas 1398x876, viewport
`translate(0px, 0px) scale(1)`. Per option: File hovered, Export Canvas hovered, the item clicked, 6 s waited.

| Canvas | Option | Event | Download | Toast | Console error | Clipboard |
|---|---|---|---|---|---|---|
| M2 | PNG | 1 | none | none | none | n/a |
| M2 | JPEG | 1 | none | none | none | n/a |
| M2 | SVG | 1 | none | none | none | n/a |
| M2 | Copy to clipboard | 1 | none | none | none | `text/plain` "SENTINEL-m2-clipboard" (unchanged) |
| M1 | PNG, JPEG, SVG | 1 each | none | none | none | n/a |
| M1 | Copy to clipboard | 1 | none | none | none | the sentinel, unchanged |

Listeners on `window` for the event (counted by an init script wrapping `addEventListener`): 1 with one M2 tab, 2 with
two, 0 after closing both M2 tabs with the M1 tab still open (`probe-proto.log`). Fiber of the mounted
`MetamodelTabComponent`: first hook `{ current: null }`.

### 4.1 The service in isolation (measured)

What the listener would get with an element, called from the page on the active M2 pane:

| Call | Element | Output | Size | Non-white | Note |
|---|---|---|---|---|---|
| `export(el)` | `.editor-v2__canvas` | `metamodel_2026-09-30.png` | 699x438, 26162 B | 97.6 % | canvas grey, minimap, no edge lines |
| `export(el, {type:'jpeg'})` | same | `.jpeg`, JPEG | 699x438, 27966 B | 97.6 % | |
| `export(el, {type:'svg'})` | same | `.svg`, `image/svg+xml` | 1398x876, 5461019 B | 97.7 % | fonts embedded |
| `exportAsBlob(el)` | same | `image/png` blob | 699x438 | 97.6 % | |
| `copyToClipboard(el)` | same | `true`, clipboard `image/png` | 699x438 | 97.6 % | Chromium |
| `export(el)` panned -700 px | same | PNG | 699x438 | 98.8 % | 1 of 5 nodes in view |
| `export(pane)` | `.dock-tabpane-active` | PNG | 799x458 | 82.7 % | |

Image: `phase1/iso_canvas_default__metamodel_2026-09-30.png` shows the class boxes, the labels and the arrowheads,
no edge line, the minimap at the bottom right, on the canvas grey.

## 5. Root causes and the smallest fix per cause

| Cause | Options | Where | Smallest fix |
|---|---|---|---|
| A dead `canvasRef` | all, M2 | `MetamodelTab.tsx:36,41` | drop the per-tab listener; one app-wide listener resolves the canvas (B) |
| B no M1 listener, one per M2 tab | all, M1 (and duplicates on M2) | `MetamodelTab.tsx:39-74`, `ModelTab.tsx` (none) | `installCanvasExportListener(window, deps)` in the service, called once at module load of `MetamodelTab.tsx`; it finds the visible `.dock-tabpane-active .editor-v2__canvas` and names the file from the pane's model id |
| C format and filename dropped | JPEG, SVG | `MetamodelTab.tsx:57` | `routeCanvasExport(format)`: `png`/`jpeg`/`svg` -> `export(el, {type, filename})`, `clipboard` -> `copyToClipboard(el)` |
| D wrong element, crop, grey, low-res | all | `CanvasExportService.ts:30,51,85` | with a `.react-flow__viewport` inside, render it fitted to `diagramBounds` of the nodes, edges, edge labels and portal at `translate(-x,-y) scale(1)`, width and height set; default `pixelRatio` 2 |
| E edge lines lost | all | html-to-image `clone-node.js:49,55-57` | `inlineSvgPaint(viewport)` sets the computed paint properties the SVG descendants do not already carry inline, and removes them after the render |

Prototype of D+E (`probe-proto.log`, `_tmp_canvasexport_proto.ts`, html-to-image called from the page, no src
change): M2 bounds `x 26 y -18 w 1028 h 472` (flow units, margin 24), image 2056x944, 6.7 % non-white, nodes
non-white shares `0.558 0.751 0.751 0.442 0.556`, the 25 % point of each edge dark on 3 of 4 measurable edges with
the inlining and 0 of 4 without; the same after a zoom to 0.5 and a pan (`translate(-250.5px, 354.5px) scale(0.5)`):
identical bounds, size and shares. M1: 2230x2216, 4.0 % non-white, every node above 3.4 %, 12 of 12 edge points dark.
517 (M2) and 1584 (M1) inline properties set and all removed after (0 left). Images `phase1/proto_*.png`.

The one M2 edge whose 25 % point read 0 is a sampling miss of the prototype, not a missing line: the image shows all
five M2 edges drawn. Phase 2's probe samples several points per edge, away from nodes and labels.

## 6. Decisions taken (unattended)

1. One listener for the app, installed when `MetamodelTab.tsx` loads, replacing the per-tab `useEffect`. The logic
   (routing, active canvas, calls, alerts through an injected `notify`) lives in the service so the bench can import
   it; `MetamodelTab.tsx` supplies `U.alert` and the model name. HMR-safe: the handler is kept under
   `Symbol.for('jjodel.canvasExportListener')` on the target and replaced, never doubled.
2. The image is the whole diagram at zoom 1 (flow unit = CSS px), pixelRatio 2, 24 px margin, white, whatever the
   pan and zoom on screen.
3. Filename `<model name>_<YYYY-MM-DD>.<png|jpeg|svg>`, `metamodel` when there is no name: the pattern of
   `generateFilename` kept, the base the one `:44` already computed.
4. Edge lines by inlining the SVG paint for the render, not by pinning html-to-image to 1.11.11 (a dependency change).
5. Copy to clipboard keeps await-then-write, which works in Chromium (measured). When `ClipboardItem` or
   `clipboard.write` is missing, or the write is refused, the alert says so and points to Export as PNG.
6. No active canvas (a dashboard, a docs tab): an error alert instead of the silence.
7. `useCanvasExport.ts`, `ExportImageMenu.tsx`, `Navbar.tsx`: not touched (§2.3, §2.1).

New identifiers, each searched in `src` and `scripts` (tracked files) before use, 0 hits each, control
`CanvasExportService` 14: `routeCanvasExport`, `CanvasExportRoute`, `installCanvasExportListener`,
`CanvasExportDeps`, `findActiveCanvas`, `diagramBounds`, `inlineSvgPaint`, `SVG_PAINT_PROPERTIES`,
`FLOW_EXPORT_MARGIN`, `canvasExportListener`.

## 7. Dependencies and risks

- The listener is installed at module scope: it relies on `TabDataMaker.tsx:3` importing `MetamodelTab` statically at
  startup. Phase 2 measures the listener count at startup, with two M2 tabs and with every M2 tab closed.
- The inline paint is written on the live DOM for the length of a render (1-3 s): values equal to the computed
  ones, so nothing moves on screen; a property React already sets inline is skipped and never removed.
- The SVG file is html-to-image's HTML-in-`foreignObject` with the fonts embedded (5.4 MB measured on a small M2):
  it opens in a browser, not as editable vectors in Inkscape or Illustrator. A vector export is a new format, out of
  scope.
- Every render logs 4 `console.error` from the cross-origin Google Fonts sheet (`SecurityError` on `cssRules`),
  caught by the library. Not a failure; a ticket.
- Safari: `navigator.clipboard.write` after the render is outside the user gesture, so Safari refuses it; the alert
  covers it (question 4).
- Dark theme: the nodes keep their dark fills on the white background; the visual check runs in light as the prompt
  asks.
