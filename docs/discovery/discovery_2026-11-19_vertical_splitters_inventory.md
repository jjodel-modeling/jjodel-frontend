# Discovery — vertical splitters: inventory and measurements before one slim contract

- Prompt-ID: P-2026-11-19-2200, Phase 1 (read-only)
- Prompt: `docs/prompts/claude_2026-11-19_2200_prompt_vertical_splitters_unify.md`
- Session: b6925219-016c-4049-8ead-17d5b27c7ee8, continued after a context ceiling (verified handoff)
- Tree: `~/jjodel-w-vsplit`, branch `ui-vsplit`, HEAD `293585654` (all measurements on this HEAD)
- Executor: Opus 5.5 (`claude-opus-5-5`)
- Runtime: dev server on port 3006 started by `lane-run probe`, fresh Chromium context per run, Advanced mode
  (`data-mode="advanced"`), light theme (`data-theme` absent), fixture `scene_3_DemoESM.jjodel`
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## 0. Answer in brief

1. Twelve drawings, not eleven, and only nine are reachable. Site 2 (canvas split, the one Alfonso sees) is a
   6px slate-200 bar with a 4x32 slate-400 grip at rest, sky `#0ea5e9` on hover and drag (measured, crop
   `dock-canvas-split.png`). New site 12: the rc-dock divider beside a generator panel, 7px with a 1px slate-300 line.
2. Dead: site 5 `.editor-split-divider`, site 6 `.editor-split__divider`, site 11 MTM `.separator` (no handler, tab
   orphaned), `.tree-view-panel-resize-handle`, `style_ap.scss`. 0 instances in the final DOM of every run.
3. Two inventory claims are wrong. rc-dock's `scaleX(3)` is never applied: `rc-dock.css` is not imported, the
   plain divider measures 1px wide, `transform: none`, and a drag that starts 1px off the line misses (±1, ±2, ±3 all
   0px). The site 1 hover pill is slate-700 (`--color-accent`), not cyan.
4. An 8px transparent strip straddling the seam (injected for the measure) is grabbable from -3 and +3: both drags
   moved the divider 60px. Narrowing is not an issue at rc-dock; it is a 1px → 8px widening.
5. Rail handle vs dock divider: never adjacent in any measured state (nearest ≥ 597px, or no rail in the box). The
   floating rail sits outside the last panel. Its left-anchored 6px geometry is kept as the documented exception.
6. Drag state is readable by CSS at every reachable site without a DOM change: `.dragging` (ResizeHandle),
   `.dock-hbox.dragging` and `:active` (rc-dock), `:active` under pointer capture (codegen, syntax form, Script tab),
   `.resizing` (JjTL), `.jodie-resizing` (Jjodie). Measured mid-drag.
7. Body cursor during the drag is `col-resize` only where the handler sets it (ResizeHandle, JjTL). rc-dock,
   codegen, syntax form, Script tab and Jjodie leave `auto`; when the pointer outruns the strip the cursor becomes the
   one under it (`default` on the React Flow pane, `auto` on Monaco). CSS can set `body` via `:has()`, not the
   cursor of descendants that declare their own.
8. JjTL handles: 12px, but the half that protrudes over the Monaco editor is covered by it. The side handle cannot be
   grabbed at its centre (0px moved); a drag at `box.x + 2` moves it. An 8px straddling strip would keep only 4px.
9. Four tokens resolve on `html`, `body`, the canvas, the rail and on every measured site: `--color-panel-border`
   `#e2e8f0`, `--color-slate-400` `#94a3b8`, `--color-canvas-accent` `#06b6d4`, `--color-border-focus` `#475569`.
10. No stop-and-ask item is raised by the measurements. Four decisions wait for Alfonso (§9): the JjTL geometry,
    Jjodie's plain-CSS file, the reading of «col-resize on body», and the 3-panel box drawn as a canvas split.

## 1. Objective

Confirm the inventory of vertical pane splitters in the prompt, establish which are rendered and how they are
reached, measure each reachable one at rest, on hover and in a real drag, check rc-dock grabbing with an 8px strip
and no transform, check the four tokens, so that Phase 2 can apply one SCSS contract (8px strip, 1px hairline,
150ms-delayed 2px slate-400 hover line, 2px accent drag line, `col-resize`) without changing a DOM or a drag handler.

## 2. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The eleven sites of the prompt are all the vertical splitters | Partly | Site 12 added (§4); sites 5, 6, 11 dead |
| H2 | rc-dock dividers get a `scaleX(3)` hit area | Falsified | Measured `transform: none`, 1px box, 1px hit (§5.1) |
| H3 | The site 1 pill is cyan | Falsified | Hover `::after` `4px x 80px rgb(51, 65, 85)` (§5.1) |
| H4 | An 8px strip without transform stays grabbable | Holds | Drags from seam -3 and +3 moved 60px (§5.2) |
| H5 | The rail handle and the dock divider steal each other's drag | Falsified in measured states | §5.3 |
| H6 | Every site can show a drag colour without a DOM change | Holds | Mid-drag signals, §5.4 |
| H7 | The four tokens resolve where splitters live | Holds (light theme only) | §6 |
| H8 | The JjTL `ew-resize` is on the strip | Falsified | Strip is `col-resize`; `ew-resize` is on the `<i>` (§4, site 4) |

## 3. Files read (full paths from the repo root)

`frontend/src/components/abstract/style.scss` (570-617, 1080-1131), `frontend/src/components/ResizeHandle/resize-handle.scss`
(grep of 1-191), `frontend/src/components/ResizeHandle/ResizeHandle.tsx` (1-40, 45-79),
`frontend/src/components/editors/properties-with-tree-view.scss` (150-201, 824, 832),
`frontend/src/components/abstract/tabs/instanceManagerTab.scss` (150-170), `frontend/src/jjtl/styles/jjtl.scss` (300-330,
391-400), `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` (652-664, 759-768),
`frontend/src/components/editors/Console/console-tab.scss` (693-713), `frontend/src/components/Jodie/JodieWindow.css`
(154-180), `frontend/src/components/Jodie/Jodie.tsx` (42), `frontend/src/components/abstract/tabs/ScriptTab.scss`
(195-205), `frontend/src/components/abstract/tabs/ScriptTab.tsx` (190-268, 400-421),
`frontend/src/components/scripts/refactoringBeside.ts` (12-18), `frontend/src/components/scripts/scriptFiles.ts` (109-116),
`frontend/src/codegen/textual/ui/SyntaxForm.scss` (112-125, 403-420), `frontend/src/codegen/textual/ui/SyntaxForm.tsx`
(160-205, 246), `frontend/src/codegen/ui/TemplateEditorTab.scss` (22-45, 193-206), `frontend/src/codegen/ui/splitter.tsx`
(15, 60-129), `frontend/src/codegen/ui/TemplateEditorTab.tsx` (382-396, 901), `frontend/src/components/abstract/Dock.tsx`
(336, 375-382), `frontend/src/components/editors/MTM.tsx` (404-407), `frontend/src/components/abstract/tabs/EditorSwitch.tsx`
(263-268), `frontend/src/components/editor-v2/EditorV2.tsx` (5282, 5611), `frontend/src/styles/tokens/_transitions.scss` (14),
`frontend/src/styles/tokens/_colors-light.scss` (75, 93, 205, 253), `frontend/src/styles/tokens.css` (31),
`frontend/src/components/abstract/style_ap.scss` (583), `frontend/node_modules/rc-dock/dist/rc-dock.css` (437).
Windows, not whole files, where a range is given.

Probes (gitignored `_tmp_`, not committed): `frontend/scripts/smoke/_tmp_vsplit-before.ts` (all sites, one context),
`_tmp_vsplit-before2.ts` (gaps; its codegen, syntax and Script readings are layout artefacts, see §7),
`_tmp_vsplit-before3.ts` (fresh context per scenario: generator, syntax form, Script tab),
`_tmp_vsplit-before5.ts` (rc-dock beside a generator, plain divider). JSON next to each; logs in
`~/.jjodel-lanes/P-2026-11-19-2200/probe-_tmp_vsplit-before*.log`. Five runs, exit 0, 0 page errors each.

## 4. Inventory (confirmed), measured at rest

Search: `command grep -rlE 'col-resize|ew-resize'` over `frontend/src` with `--include` for scss, css, tsx, ts: 19
files. Positive control: it lists `components/editors/PropertiesWithTreeView.tsx` (site 3) and
`components/ResizeHandle/resize-handle.scss`. Runtime census: every visible element with computed `col-resize` or
`ew-resize` in eight states; it found no element outside this table.

"Hit" is the count of integer x samples where `elementFromPoint` returns the handle at its vertical centre (a 6px box
at a fractional x can read 7). Colours are computed.

| # | Site | Reached (Advanced) | Rest, measured | Hover, measured | Seam border | Hit (samples) | Crop (`before/`) |
|---|---|---|---|---|---|---|---|
| 2 | Canvas split, `style.scss:1094` | two canvases side by side (`DockManager.splitRight`) | 6px bar `rgb(226,232,240)`, grip `::after` 4x32 `rgb(148,163,184)`, `col-resize` | bar and grip `rgb(14,165,233)` | panels: 1px white each side | 8px (`::before` -1/+1) | `dock-canvas-split.png` |
| 1 | Plain rc-dock divider, `style.scss:578-612` | a canvas with a Script tab beside it; any box without two canvases or a generator | 1px `border-left rgb(226,228,232)`, `ew-resize`, `transform: none`, pill transparent | `::after` 4x80 `rgb(51,65,85)` | panels: 1px white | **1px** | `dock-divider-plain.png`, `-hover.png` |
| 12 | rc-dock beside a generator panel, `TemplateEditorTab.scss:30-42` (new) | M1 canvas, then a generator tab (opens beside) | 7px, 3px transparent borders, 1px line `rgb(203,213,225)`, `ew-resize` | pill 4x80 `rgb(51,65,85)` | panels: 1px white | 8px | `dock-divider-generator-beside.png`, `-hover.png` |
| 3a | Properties rail, `ResizeHandle` + `properties-with-tree-view.scss:169-184` | M1 canvas, rail open | 6px strip inside the rail, `::before` 1px `rgb(226,232,240)` at its left edge | strip `rgb(248,250,252)`, line slate-300, pill 4x48 slate-400 | rail `border-left` 1px slate-200: **doubled 2px seam today** | 7px | `rail.png`, `rail-with-jodie.png` |
| 3b | Instance Manager x2, `instanceManagerTab.scss:158-166` | `DockManager.openManager` | 8px straddling, line transparent at rest | as 3a | yes (the rule says so) | 9px | `im-outline.png`, `im-classes.png` |
| 4 | JjTL side and right, `jjtl.scss:310-330, 391-400` | `DockManager.openTransformation` | 12px, `col-resize`, `bi-grip-vertical` icon `#94a3b8` 20x36 with `ew-resize` | handle nothing; icon `#64748b`, `#f1f5f9` bg, `scaleX(1.1)` | side `border-right` 1px, right `border-left` 1px `rgb(226,228,232)` | side 6-7px away from the icon, 11px at it | `jjtl-side.png`, `jjtl-right.png` |
| 7 | Script tab, `ScriptTab.scss:195-203` | only in the pane layout: window < 1100px, or no model placed beside | 5px, `border-left` 1px `rgb(226,232,240)` | `--color-bg-hover` | the handle's own border | 4px | `script-tab.png` (1060px window) |
| 8 | Syntax form, `SyntaxForm.scss:403-411` | Text tab, «Syntax» mode | 4px, `border-left` 1px `rgb(203,213,225)` | bg `rgb(233,239,246)` | the handle's own border | 4px | `syntax-form.png` |
| 9 | Generator tab, `TemplateEditorTab.scss:195-206` | `openTemplateEditor` | 6px filled `rgb(203,213,225)`, focusable | bg `rgb(71,85,105)` | preview `border-left` 1px slate-300 | 6px | `codegen-tpl.png`, `codegen-tpl-wide.png` |
| 10 | Jjodie docked, `JodieWindow.css:154-180` | M1 canvas, Jjodie docked | 6px at the window's left edge, nothing drawn | `::after` 2px `rgba(71,85,105,0.35)` at the left edge | window `border-left` 1px slate-200 | 7px | `jodie-dock.png` |
| 5 | `.editor-split-divider` | **dead**: needs `classicSlot`, dropped in Fase 5a | — | — | — | — | — |
| 6 | `.editor-split__divider` | **dead**: no TSX renders `editor-split__*` | — | — | — | — | — |
| 11 | MTM `.separator` | **dead / not a splitter**: no handler, Languages tab orphaned | — | — | — | — | — |

Quotes, verbatim:
- Site 1, `style.scss:580-582`: `flex: 0 0 1px;` / `background: trasparent;` / `border-left: 1px solid #e2e4e8;`;
  `:605-607` `background-color: var(--color-accent);` `height: 80px;`; `:611` `cursor: ew-resize;`.
- Site 2, `style.scss:1092-1093`: «The divider of a split of canvases shows itself at rest, with a grip
  (P-2026-11-08-2045). rc-dock's scaleX(3) is every other divider's hit area»; `:1121` `background: #0ea5e9;`.
- Site 12, `TemplateEditorTab.scss:26-27`: «rc-dock's divider, 1px wide in the app (abstract/style.scss), so a drag
  had to start on that exact pixel.»
- Site 3, `resize-handle.scss:56-57`: `&::before { background: var(--color-slate-300); }` /
  `&::after { background: var(--color-slate-400); }` (shared by both orientations); `:67-68` `&:focus-visible {` /
  `outline: 2px solid var(--color-border-focus);`; `:81` `box-shadow: 0 0 0 3px var(--color-canvas-accent-subtle);`;
  `:119-120` `&--vertical {` / `width: 10px;`.
- Site 3a, `properties-with-tree-view.scss:173-174`: `left: 0;     // niente protrusione a sinistra: evita la hit-zone
  del divider` / `width: 6px;  // hit zone verso l'interno del pannello`.
- Site 3b, `instanceManagerTab.scss:165`: `&:not(:hover):not(:focus-visible):not(.dragging)::before { background: transparent; }`.
- Site 4, `jjtl.scss:302` `border-right: 1px solid $color-border;`, `:313-316` `right: -6px;` … `width: 12px;`
  `cursor: col-resize;`; `console-tab.scss:700` `cursor: ew-resize;`; `JjtlDevelopmentEnv.tsx:664`
  `<i className={`bi bi-grip-vertical resize-grip-icon-vertical ${isResizingSidePanel ? 'dragging' : ''}`} />`.
- Site 7, `ScriptTab.scss:196-197` `width: 5px;` / `border-left: 1px solid var(--color-form-border);`;
  `ScriptTab.tsx:414-415` `{!beside && <>` / `<div className="script-tab__handle" role="separator" …`;
  `refactoringBeside.ts:12` `export const BESIDE_MIN_WINDOW = 1100;`.
- Site 8, `SyntaxForm.scss:404-405` `flex: 0 0 4px;` / `border-left: 1px solid var(--color-border-secondary);`;
  `:417-418` `min-width: 240px;` / `max-width: 70%;`.
- Site 9, `TemplateEditorTab.scss:196-198` `flex: 0 0 6px;` `cursor: col-resize;` `background: var(--color-border-secondary);`.
- Site 10, `JodieWindow.css:154` `/* Vertical drag handle on the left edge; 6px hit area, 2px line on hover/drag. */`;
  `Jodie.tsx:42` `import './JodieWindow.css';`.
- Site 5, `EditorSwitch.tsx:267` «classicSlot/editorMode wiring intentionally dropped;»; the class is still written at
  `EditorV2.tsx:5611` `className="editor-split-divider"`.
- Site 11, `MTM.tsx:406` `<div className={'separator'}/>` (no handler); `Dock.tsx:379` «above are still left in place
  (orphaned)»; `mtm.scss:87` `cursor: col-resize;`.

Absence claims, each with its search (BSD grep via `command grep`, exit status recorded) and control:
- No import of `rc-dock.css` in `frontend/src` or `frontend/index.html`: exit 1. Control `from 'rc-dock'` lists
  `codegen/ui/openTemplateEditor.ts` and others. `scaleX(3)` lives only at `node_modules/rc-dock/dist/rc-dock.css:437`
  and `style_ap.scss:583`.
- No importer of `style_ap`: exit 1. No TSX with `tree-view-panel-resize-handle`: exit 1, control
  `properties-panel-resize-handle` finds `PropertiesWithTreeView.tsx`. No TSX with `editor-split__`: exit 1.
- Runtime: `.editor-split-divider`, `.editor-split__divider`, `.MTM-tab`, `.tree-view-panel-resize-handle` and visible
  `.ui-resizable-e/-w` count 0 in the final DOM of pass 1; `.resize-grip-icon-vertical` counts 2 (the JjTL icons).

## 5. Measurements in motion

### 5.1 The plain rc-dock divider today (pass 5, A2)

A real split of two canvases with a hidden `.script-tab--beside` marker appended to the last panel, so that the
site 2 rule (`:not(:has(> .dock-panel .script-tab--beside))`) lets go and only `style.scss:578-612` applies; the same
1px `ew-resize` divider was seen without a marker in pass 1 with a real Script tab beside (census, x=687.3, 1x918).
Box 1x918, `transform: none`, hit from 999 to 999 (n=1). Drag on the line: -60px. Drags starting at +1, -1, +2, -2,
+3, -3 px from the line: 0px each, `:active` false. Hover `::after` `4px x 80px rgb(51, 65, 85)`.

### 5.2 Candidate 8px strip (pass 1, injected style, removed after)

On the site 2 divider: `flex: 0 0 8px; margin: 0 -4px; transform: none`, transparent, pseudo-elements off. Box 8px,
hit 485 to 493 (n=9). Drag from seam -3: +60.42px; from seam +3: -60px. The seam scan of pass 2 shows the same 8px
owned by the divider between two canvases, React Flow pane beyond ±4.

### 5.3 Rail handle vs dock divider (passes 1, 2)

States with a dock divider: split, generator beside (two layouts), JjTL, Script, Jjodie. Nearest rail handle to any
divider: 598 and 597px (split, with and without the candidate strip), no rail visible in the other boxes. Across
each divider seam ±6px the top element is the divider or pane content, never the rail handle. The comment at
`properties-with-tree-view.scss:159-163` describes the 2026-07-06 docked Properties; the rail is now floating and the
last panel gives it room with `margin-right: var(--jj-rail-width)` (`style.scss:1083-1084`). Measured in Advanced mode
only.

### 5.4 Drag state and cursor, mid-drag

| Site | Shift (dx) | Drag signal CSS can read | Body cursor mid-drag |
|---|---|---|---|
| Rail (ResizeHandle) | -60 (-60) | `.resize-handle.dragging`, `:active` | `col-resize` (inline) |
| Instance Manager | +40 (+40) | same | `col-resize` (inline) |
| Canvas split | -80 (-80) | parent `.dock-hbox.dragging`, `:active` | `auto` |
| Beside generator (site 12) | ±40 from seam ±1/±2/±3 | same | `auto`; under the pointer `ew-resize` or `default` |
| Generator tab | -77 (-80), +83 (+80) | `:active` and `:hover` (pointer capture) | `auto` |
| Syntax form | +80 (+80), -80 (-80) | `:active`, `:hover` | `auto` |
| Script tab | +60 (+60), -60 (-60) | `:active`, `:hover` | `auto`; pointer outran the strip onto Monaco: `auto` |
| JjTL right | -59 (-60) | parent `.jjtl-dev-env-inferred-panel.resizing`, `:active` | `col-resize` (inline) |
| JjTL side | +54 (+60) from `box.x + 2`; **0** from the centre | parent `.resizing`; the icon `.dragging` | `col-resize` (inline) |
| Jjodie | -60 (-60) | `.jodie-window.jodie-resizing`, `:active` | `auto` |

JjTL side at its centre: pass 1 found `div.margin-view-overlays` (Monaco) on top at x=968 of a 962.3-974.3 box, hover
false, 0px moved; pass 2 found the right half under the neighbour panel in a cramped layout too. JjTL right at the
icon row: hit starts at 1196 for a box starting at 1191. Each JjTL handle is grabbable only over the half inside its
own panel.

## 6. Tokens

Measured in pass 1 on `html` and `body` of the dashboard, and on `html`, `.editor-v2`, `.properties-tree-overlay` and
each of the eleven measured handles inside the project: `--color-panel-border: #e2e8f0`, `--color-slate-400: #94a3b8`,
`--color-canvas-accent: #06b6d4`, `--color-border-focus: #475569`, the same everywhere. Read: the first three come from
`_colors-light.scss` on `:root, :root[data-theme="light"]` (`:75`, `:93`, `:205`, `:253`), `--color-slate-400` from
`tokens.css:31`. Not measured in a dark theme.

## 7. Notes on the measurement

- Pass 2's generator and syntax drags read 0px: the panes were 475px and 354px wide after earlier steps, below
  `SPLIT_MIN_PX = 200` per side (`splitter.tsx:15`) and at the preview's `max-width: 70%`. Pass 3 repeated both in a
  fresh 2000px context and they moved. Pass 1's 0px drags on both had the same cause. Pass 2's Script handle sat
  off-screen after a viewport shrink; pass 3 opened it in a 1060px context from the start.
- In pass 5 (A1) the drag on the line of the site 12 divider read 0px while `.dock-hbox.dragging` was set: the left
  panel did not shrink below 1289px in any drag, so the drag started and a layout limit held it. The six offset drags
  moved it ±40px.
- A box holding canvas | generator | canvas draws both dividers as site 2 (6px bar and grip), and site 2 beats the
  site 12 rule (pass 2: both 6px). The site 2 selector tests the box, not the divider's neighbours.

## 8. Phase 2 inputs

### 8.1 Geometry exceptions (drawing unified, geometry kept)

1. Properties rail (3a): 6px inside the rail, `left: 0`. Its line goes on the seam, which already has the rail's
   `border-left`, so at rest no hairline (removes today's doubled 2px seam).
2. JjTL side and right (4): see §9 Q1. Measured: a centred 8px strip keeps 4px grabbable, because Monaco covers the
   outer half.
3. Jjodie (10): strip on the window's left edge (`left: 0`, the window's own border is the seam). Inside the window,
   like the rail, because outside it is the canvas.
4. Script tab (7), syntax form (8), generator tab (9): flex items with a width. An 8px flex item would push the panes
   by 2 to 4px; a straddling strip needs a pseudo-element or negative margins. Both are CSS only; the margin variant
   changes what `splitArea()` subtracts (`TemplateEditorTab.tsx:388` reads the bar's width), so for site 9 the hit
   strip is better drawn by a pseudo-element on a 1px item. To be measured in Phase 2.

### 8.2 Sites that could move onto `ResizeHandle` later (not this lane)

`ResizeHandle` takes `onMouseDown` and `isDragging` from its caller (`ResizeHandle.tsx:5-6`); its props interface is not
exported (`:4`).
- JjTL side and right: closest fit. They already use `onMouseDown` and an `isResizing*` state; would need `value`,
  `min`, `max` and `onResizeBy` for the keyboard and readout.
- Script tab, syntax form, generator tab, Jjodie: pointer events with pointer capture (`ScriptTab.tsx:207-220`,
  `SyntaxForm.tsx:182-191`, `splitter.tsx:96-112`, `JodieWindow.tsx:315`). Moving them needs either pointer support in
  `ResizeHandle` or a rewrite to mouse plus window listeners; the generator also has its own keyboard and double-click.
- rc-dock dividers: library DOM, cannot move.

### 8.3 Drawing hooks per site (all CSS)

Drag colour: `.dragging` / `.dock-hbox.dragging > .dock-divider` / `:active` / `.resizing > handle` /
`.jodie-resizing .jodie-dock-handle`. Hover: `:hover` with `transition-delay: 150ms` on the line. Focus: the sites
that are focusable today are the rail, Instance Manager, JjTL (`tabIndex={0}`), generator tab and Jjodie (measured
`tabIndex` 0); rc-dock and syntax form measure -1, the Script tab handle declares none (`ScriptTab.tsx:415-417`). `ResizeHandle`'s base hover (`resize-handle.scss:50-57`) and
focus outline (`:67-68`) are shared with the horizontal handle: Phase 2 overrides them inside `&--vertical` only.

## 9. Questions for Alfonso

1. JjTL handles: keep 12px and draw the line on the seam (geometry exception), or move the strip inside each panel like
   the rail? Recommended: inside the panel, 8px, line on the seam; it removes the half Monaco covers.
2. `JodieWindow.css` is plain CSS and cannot `@include` a mixin. Recommended: emit the `.jodie-dock-handle` rules from
   `abstract/style.scss` (global, in DOVE) through the mixin, and leave `JodieWindow.css` only its geometry.
3. «`col-resize` on `body` during the drag»: read it as the computed cursor of `body` (CSS `body:has(…)` for the five
   sites whose handler does not set it), accepting that Monaco and the React Flow pane keep their own cursor when the
   pointer outruns the strip? Recommended: yes; the alternative is a handler change.
4. A box with canvas | generator | canvas draws both dividers as the canvas split. Should the contract make every rc-dock
   hbox divider identical, which removes the distinction? Recommended: yes, one drawing; the selector question goes away.
5. Dead CSS to delete later (RC-26): sites 5, 6, 11, `.tree-view-panel-resize-handle`, `style_ap.scss`,
   `.resize-grip-icon-vertical` after the JjTL change. Confirm deletion in a separate lane?

## 10. Decisions taken (unattended)

1. Site 11 is not a splitter and stays untouched: no handler, unreachable; a `col-resize` hairline on a static seam would
   promise a drag that does not exist.
2. Sites 5 and 6 are dead: Phase 2 does not restyle them.
3. The 150ms delay stays a literal: `--duration-fast: 150ms` (`_transitions.scss:14`) names a duration, not a delay.
4. `.resize-grip-icon-vertical` has no user besides the two JjTL icons: removable in Phase 2 with them.
5. Site 12 is added to the inventory and to the contract: `TemplateEditorTab.scss` is in DOVE (site 9's file).
6. Site 2 crop is first in the table, as the project chat asked on 2026-11-20.

## 11. Decisions awaiting Alfonso

Q1 to Q5 of §9. Draft row for `docs/decisions.md`, written in Phase 2:

> **D-UI-17** (2026-11-19, provisional, unattended, RC-25): one vertical splitter drawing across the platform, the
> «sash»: an 8px transparent strip straddling the seam, a 1px `--color-panel-border` hairline at rest (none where the
> seam paints its own border), a 2px `--color-slate-400` line after 150ms of hover, a 2px `--color-canvas-accent` line
> for the whole drag, a 2px `--color-border-focus` line on keyboard focus, `col-resize` on the strip and on `body` while
> dragging. Amends the hover-reveal pill of the vertical `ResizeHandle` (2026-08-28) and the at-rest grey bar with grip
> of the canvas split (P-2026-11-08-2045). Source: Alfonso, 2026-11-19 18:20, «make all the vertical resizers slicker,
> slimmer and above all uniform».

## 12. Risks

- The JjTL handles get harder to grab with a centred 8px strip unless Q1 is answered with a geometry exception.
- Flex-item splitters (7, 8, 9) change their panes' widths by a few pixels if the strip is widened in flow.
- Body-cursor rules via `:has()` run style recalculation on `body`; `:active` is per element, so the cost is bounded,
  but it is not measured.
- Dark theme and Basic mode were not measured.

## 13. Addendum, Phase 2 (2026-11-20)

GO by the project chat 2026-11-20 16:45 (C-2026-11-19-2200). Code commits `5d81fd6c6` (partial, `ResizeHandle`, rc-dock,
rail) and `4d9d27a22` (bespoke sites, Jjodie, probe), on `cd279111b`. Executor: Opus 5.5, continued after a context
ceiling (verified handoff); the committed tree was checked line for line against the probe-green working tree.

### 13.1 Answers adopted (RC-25, provisional, unattended)

- Q1: JjTL strips move inside each panel, 8px, line on the seam (side `right: 0`, right panel `left: 0`).
- Q2: Jjodie's drawing is emitted from `abstract/style.scss` through the mixin; `JodieWindow.css` keeps the geometry
  only (6px to 8px, its own `::after`, hover, focus and cursor rules removed).
- Q3: `col-resize` on `body` via `body:has(…)` for rc-dock, codegen, syntax form, Script tab, Jjodie; the rail, Instance
  Manager and JjTL handlers already set it inline.
- Q4: one drawing for every rc-dock hbox divider; the canvas-split rule (P-2026-11-08-2045) and the site 12 rule
  (P-2026-10-25-1355) are replaced by comments.
- Q5: no dead-CSS deletion. Only the two JjTL `<i class="bi bi-grip-vertical">` and `.resize-grip-icon-vertical` went
  (no other user; control `resize-grip-icon-horizontal` found by the same grep). Sites 5, 6, 11,
  `.tree-view-panel-resize-handle`, `style_ap.scss` untouched, waiting for Alfonso (RC-26).

### 13.2 As built

- Partial `frontend/src/styles/components/_vsplit.scss`, used as `@use '…/styles/components/vsplit'`. Literals: `$strip:
  8px`, `$line: 2px`, `$delay: 150ms`, each commented once. Mixins: `sash($seam: center|start|end, $rest: true)` (the
  line is `::before` in every state; states change width and colour only, never position), `sash-drag`, `sash-strip`
  (an 8px transparent centred `::after` for 1px seams). Names checked free: `sash` has no other hit in `frontend/src`;
  `vsplit` occurs only in the class `.tree-view-panel-vsplit`, a horizontal splitter, which keeps its name.
- Geometry as built: rc-dock dividers, codegen splitter, syntax form, Script tab keep a 1px box (the seam) with the 8px
  pseudo strip, so no pane moves and `splitArea()` still subtracts a measured 1px bar. `ResizeHandle` vertical: 8px
  centred. Properties rail: 6px at `left: 0`, no line at rest (the rail's border is the seam). Instance Manager:
  unchanged geometry (already 8px straddling). JjTL side and right, Jjodie: 8px inside the pane, line on the seam, no
  line at rest (the panes paint the seam). `instanceManagerTab.scss` not touched.
- DOM: only the two JjTL `<i>` removed (the divs are now self-closing). No drag handler, no exported interface changed.

### 13.3 Measured (probe `frontend/scripts/probe/vsplit-uniform.ts`, port 3006, lane-run)

185 PASS, 0 FAIL, 0 page errors, exit 0. Log `~/.jjodel-lanes/P-2026-11-19-2200/probe-vsplit-uniform.run4.log`. Every
reached site: rest line 1px `--color-panel-border` (rgb 226,232,240) or transparent as designed; hover still at rest at
1-2ms, 2px rgb(148,163,184) at 200ms; mid-drag 2px rgb(6,182,212) and `body` `col-resize`; the 2px focus line on every
focusable site. Rail strip 516.5-524.5 vs rail handle 1201-1207 in the same box: no overlap.

| Site | Box | Hit samples (of 9) | Drag dx → shift | Pane width before → after |
|---|---|---|---|---|
| dock-canvas-split | 1x918 | 9 | -80 → -79.94 (seam -3 → -39.56, +3 → +40) | 599.5 → 519.56 |
| rail | 6x877 | 7 (of 7) | -60 → -60 | 400 → 460 |
| im-outline / im-classes | 8x882 | 9 / 9 | +40 → +40 / -40 → -40 | |
| jjtl-side | 8x618 | 9 | +60 → +54.52 | 280 → 334.52 |
| jjtl-right | 8 | 9 | -60 → -55 | 400 → 455 |
| jodie-dock | 8x918 | 9 | -60 → -60 | 460 → 520 |
| dock-divider-generator-beside | 1x918 | 8 | +60 → +60 (seam ±3 → ±40) | 1289 → 1349 |
| codegen-tpl-wide | 1x882 | 9 | -80 → -79.5 | 842.41 → 762.91 |
| syntax-form | 1x818 | 8 | +80 → +80 | 1097 → 1177 |
| dock-divider-plain | 1x918 | **5** | -60 → -59.97 (seam +3 → +40.47) | 999.5 → 939.53 |
| script-tab | 1x840 | 8 | +60 → +60 | 600 → 660 |

The two JjTL drags moved 54.52 and 55 of 60: the handle was grabbed and the pane widened by the shift; the residue was
not investigated.

Mutant: hover colour of the mixin set to `--color-slate-500`, `VSPLIT_ONLY=E`: `FAIL script-tab: hover after 200ms, a
2px slate-400 line` (rgb 100,116,139), exit 1; restored, `slate-500` count 0.

### 13.4 Findings and limits

- Site D (`dock-divider-plain`, the marker state of Phase 1 pass 5 A2): the floating Properties rail ends on the seam
  and its body (`section.properties-tab.properties-panel`, x 994-998) covers the strip's left half: 5 of 8 samples hit,
  a drag from -3 moves 0, from +3 moves 40. Not two handles stealing each other's drag, and better than before (Phase
  1: 1 sample of 9 on the same state). Encoded in the probe as `minHit: 5`. Whether a real Script-beside layout puts
  the rail there is unmeasured: `DockManager.openBeside` never splits (`DockManager.tsx:268-277`), so the probe
  reproduces the state with a split and a hidden `.script-tab--beside` marker.
- Generator beside (B): the left panel stops at 1289px (§7), so the probe drags right first.
- Gate side finding: `scripts/hooks/__tests__/contextCeiling.test.ts` ("transcript_path wins over JJODEL_LANE_LOG")
  fails when the lane session's `JJODEL_LANE_LOG_FROM` is in the environment and passes with it unset. No file under
  `frontend/scripts/hooks/` is in this diff.

### 13.5 Visual check (RC-23): before/after pairs

Under `~/.jjodel-lanes/P-2026-11-19-2200/crops/`, same file name in `before/` and `after/`: `dock-canvas-split`,
`rail`, `im-outline`, `im-classes`, `jjtl-side`, `jjtl-right`, `jodie-dock`, `rail-with-jodie`,
`dock-divider-generator-beside` (+ `-hover`), `codegen-tpl-wide`, `syntax-form`, `dock-divider-plain` (+ `-hover`),
`script-tab`. After only: the `-hover` crop of every site and `dock-canvas-split-drag`. Before only:
`dock-divider-generator`, `codegen-tpl` (not re-shot in Phase 2).

## 14. Addendum, rework 2: the floating knob (2026-11-21)

Source: Alfonso's visual checks of Phase 2 and the project chat's spec (2026-11-20, RC-25, provisional, unattended),
then two chat decisions: «su quello di destra, l'handle non è centrato» → every knob centred on its seam (2026-11-20
22:52), and the docked-Jjodie z-order (2026-11-21, option 1 with fallback option 3). Code commit `21644454a`, on
`e40a4e405`. Executor: Opus 5.5, four sessions, continued after context ceilings (verified handoffs).

### 14.1 As built

- The knob, `::after` of every site, from `_vsplit.scss`: a 6x28px capsule, fully rounded, fill `--color-panel-bg`
  (measured white on the canvas and on the panels), 1px `--color-slate-300` border, shadow `0 1px 2px rgba(15, 23, 42,
  0.08)`, `pointer-events: none`, centred on the seam, over the hairline. Held hover (the same 150ms delay): border
  `--color-slate-400`, height 36px (120ms ease-out). Drag: border and fill `--color-canvas-accent`, height stays 36px.
  `:focus-visible`: border `--color-border-focus`. The line keeps its states (1px slate-300 at rest, none where
  `$rest: false`; 2px slate-400 hover; 2px accent drag; 2px focus).
- Alignment: every knob sits on the vertical centre of the editor area below the app bar and the tab strips, not on its
  own box. One parameter, `sash(..., $span: area | dock | rail)`, with the literal `$tab-strip: 34px` commented once:
  rc-dock dividers and Jjodie's handle span the tab strip (`dock`), the Properties rail handle does not (`rail`).
- 1px-seam sites (rc-dock hbox dividers, codegen splitter, syntax form, Script tab): the 8px strip moves to `::before`
  (`sash-strip`, padding 3.5px each side, `background-clip: content-box`, the line its background colour), so `::after`
  is free for the knob. No pane moves; 1px seams keep flex-basis 1px.
- Start/end seams (rail, JjTL side and right, Jjodie): the knob is centred on the seam, so half of it lies outside the
  pane. `knob-room` on the four clipping panes (`.properties-with-tree-view--rail`, `.jjtl-dev-env-side-panel`,
  `.jjtl-dev-env-inferred-panel`, `.jodie-window`): inside `@supports (overflow-clip-margin: 4px)`, `overflow: clip;
  overflow-clip-margin: 4px; min-width: 0; min-height: 0` (min-* keep the zero automatic minimum a scroll container had
  as a flex item). Fallback where `overflow-clip-margin` is unsupported (Safari): the knob stays inside the strip
  (`translateY(-50%)`), so it is not centred there. `JodieWindow.css` is plain CSS and repeats the block with a literal
  4px, pointing to the partial.
- Scroll grep (positive control: hits exist on children): no code scrolls the four panes themselves (`scrollTop`,
  `scrollLeft`, `scrollTo`, `scrollBy`); hits only on children (`JodieWindow.tsx:175,181` `.jodie-messages`,
  `PropertiesWithTreeView.tsx:919-920` the tree body). `clip` also stops `scrollIntoView` from scrolling these panes,
  which `hidden` allowed: benign, none of them is meant to scroll.
- Grab: on start/end sites the pointer takes the drag on the knob's inner half (the outer half is beyond the pane and
  takes no pointer event); on centre sites over the knob's whole width.
- Comments added by this lane are English; the pre-existing Italian lines of the rail comment are restored verbatim.

### 14.2 Docked Jjodie z-order: option 1 measured and rejected, option 3 adopted

With `z-index: auto`, the visible docked window is a stacking context (the resting `translateY(0)` of
`.jodie-window--visible`), so its handle (z 10) is trapped in it, under the floating rail (`.properties-tree-overlay`,
fixed, z 900), which ends on Jjodie's seam: the rail covers the knob's outer half.

- `z-index: 901` on the window (part 4 audit, scenario F): the only regression found is the rail tree's context menu
  `.tree-node__context-menu` (inline `position: fixed; z-index: 9999`, rendered inside the rail, so it paints at 900):
  right-clicked on a class row it spans 1114..1363 x 238..276, and with 901 Jjodie painted over it (14240px of Jjodie's
  box differ, 8437 inside menu ∩ Jjodie). Every other overlay that reaches the column measured 0px of difference.
- Option 1 (the chat's choice): window back to z auto, `transform: none` on the visible docked window, z 901 on the
  handle only. Pixels: 0px of difference in all nine states of scenario F, Jjodie's overflow menu included. Slide:
  open and close move as before. **Pointer: failed.** `document.elementsFromPoint(1145, 257)` returns
  `.jodie-dock-handle` above `.tree-node__context-menu`, and 209 of 228 points of the menu over the handle's strip and
  the knob's outer half hit the handle, against 38 with the trunk's stacking (those 38, at x 1137-1138, hit the
  rail's `.tree-view-panel-body` both ways). Hovering there would paint the handle's line over the menu, and a press would start a Jjodie
  resize instead of choosing the item. Treated as a failure of check (1), whose premise is that the rail's tree menu
  still paints over the window as today. Evidence: `~/.jjodel-lanes/P-2026-11-19-2200/vsplit-F-option1.json`,
  `probe-vsplit-F-option1.log`. A first run had passed only because it sampled 60ms after an inline `transform` change,
  mid-transition, while the window was still a stacking context; the probe now swaps with the transition off.
- **Option 3, adopted** (the chat's fallback, without asking): `.jodie-window--docked` keeps `z-index: auto`, the
  transform and the handle's z are the trunk's. The `jodie-dock` knob shows 4 of its 6px (x 1140..1143; the rail covers
  1138..1139), a measured exception like scenario D: `knobMinW: 4` on the site, no 0.5px centring requirement. Scenario
  F stays in the probe as the guard of the trunk's stacking (window z auto with `matrix(1, 0, 0, 1, 0, 0)`, handle z
  10) and of the tree menu taking the pointer over the handle's strip as today.
- `.jodie-confirm-overlay` (z 3000) is rendered by no component: no file under `frontend/src` other than
  `JodieWindow.css` names it (positive control: the same search finds `.mm-confirm-overlay` in `MegamodelView.tsx`).
  `ClearConfirmationDialog` is imported by no file either. Not opened, so not a check.
- Measured: `container-type: inline-size` on `.dashboard-container` is not a stacking context in this Chromium (an
  element at z max inside it painted over a z 1 sibling outside). Jjodie's context is the app-level fixed `div`.

**Open item (ticket by the chat): option 2.** Portal the rail tree's context menus (`useClassifierContextMenu`
`TreeViewContent.tsx` ~685, `useModelTabContextMenu` ~792) to `document.body`: today their `position: fixed;
z-index: 9999` is stuck at the rail's 900. Once they paint at body level, Jjodie's handle can go to 901 (option 1)
without covering them, and the `jodie-dock` knob would show whole. Out of this lane.

### 14.3 Measured (probe `vsplit-uniform.ts`, port 3007, lane-run, A..F)

435 PASS, 0 FAIL, 0 page errors, exit 0. Log `~/.jjodel-lanes/P-2026-11-19-2200/probe-vsplit-uniform.final.log`, JSON
`vsplit-final.json`.

| Site | Knob x (px) | Width | Centre / seam | Grab columns |
|---|---|---|---|---|
| dock-canvas-split | 597..602 | 6 | 600 / 600 | 6 |
| rail | 1198..1203 | 6 | 1201 / 1201 | 4 |
| im-outline / im-classes | 1128..1133 / 1368..1373 | 6 | 1131 / 1131.39, 1371 / 1371.39 | 6 / 6 |
| jjtl-side / jjtl-right | 971..976 / 1194..1199 | 6 | 974 / 974.48, 1197 / 1197 | 3 / 4 |
| jodie-dock | 1140..1143 | **4** | exception (seam 1141) | 4 |
| rail-with-jodie | 618..623 | 6 | 621 / 621 | 4 |
| dock-divider-generator-beside | 1287..1292 | 6 | 1290 / 1289.5 | 6 |
| codegen-tpl-wide | 1301..1306 | 6 | 1304 / 1303.91 | 6 |
| syntax-form | 1576..1581 | 6 | 1579 / 1578.5 | 6 |
| dock-divider-plain (D) | 999..1002 | **4** | exception (seam 1000) | 4 |
| script-tab | 839..844 | 6 | 842 / 841.5 | 6 |

- Alignment |dy|: canvas split + rail 0, Instance Manager beside a canvas 0, Jjodie docked 0, generator beside a canvas
  0. JjTL beside a canvas 104, noted and not checked: JjTL's panes start below its own toolbar and end above a
  resizable bottom panel, so their editor area is not the canvas's.
- Spill (`room()`, all four edges, 7px bands, against `overflow: hidden` forced): 0px of difference on all 20 edges
  (rail, jjtl-side, jjtl-right, jodie-dock, rail-with-jodie); pane boxes identical with clip and hidden.
- Mutant (part 3, `_vsplit.scss` unchanged since): the resting knob border slate-300 → slate-400, `VSPLIT_ONLY=E`: 4
  FAIL (computed, border pixel, hover-early, back at rest); restored, `cmp` identical.
- Gates: `npm run build` exit 0 (pre-existing warnings only: dynamic import, chunk size, Sass deprecations), `npm run typecheck`
  exit 0, `npm run check:scripts` exit 0, `npx vitest run src/codegen/ui/__tests__/splitter.test.ts` exit 0; the probe
  typechecks through a temporary tsconfig (`typecheck:scripts` does not include `scripts/probe/`).

### 14.4 Visual check (RC-23): before/after pairs

Under `~/.jjodel-lanes/P-2026-11-19-2200/crops/`, same name in `before/` and `after/` (after = this run): `dock-canvas-split`
(Alfonso's state: two canvases split, the rail open), `rail`, `rail-with-jodie`, `jodie-dock` (the 4-of-6px knob),
`im-outline`, `im-classes`, `jjtl-side`, `jjtl-right`, `dock-divider-generator-beside` (+ `-hover`), `codegen-tpl-wide`,
`syntax-form`, `dock-divider-plain` (+ `-hover`), `script-tab`. After only: `-hover` of every site,
`dock-canvas-split-drag`, and the spill crops `rail-edge`, `rail-with-jodie-edge`, `jjtl-side-edge`, `jjtl-right-edge`,
`jodie-dock-edge` (40px x the pane's height).
