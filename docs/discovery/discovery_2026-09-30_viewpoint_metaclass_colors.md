# Discovery: viewpoint option «Color by metaclass» (fill palette, text contrast, border on/off)
Prompt-ID P-2026-09-30-1815 · `docs/prompts/claude_2026-09-30_1815_prompt_viewpoint_metaclass_colors.md` · Chat C-2026-09-30-1815 · session `c93328ae-fc1c-4e59-917b-463e7f87f071` · tree `~/jjodel-w-vpcolor`, branch `viewpoint-metaclass-colors`, HEAD `0c2348f39` (code = `c1e0376dc`) · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference. [M] measured in this phase, [R] read.

## 0. Answer in brief
- **Feasible with six source files, one of them in the critical zone and none of the excluded ones.** The two paths that paint an M1 object node are both inside `ObjectNode.tsx`: the IR branch, which mounts `IRNodeContent` (`ObjectNode.tsx:901`), and the native branch (rectangle `:1222`, singleton pill `:1168`). The native branch is what the prompt calls «native JSX views»: models render through editor-v2 only, and `ObjectNode` reads no `jsxString` (§2.1) [R].
- **One resolver, applied at two render points.** A pure function reads `state.viewpoint`, the active viewpoint's `metaclassColoring`, and the class's position in its metamodel. It returns `{fill, text, stroke, border}` or `null`. `ObjectNode` calls it once through `useSelector(..., shallowEqual)`.
  - Native nodes: it becomes inline `--color-inode-*` overrides on the wrapper, which already carries inline tokens at `:1228-1232`.
  - IR nodes: it becomes a new optional prop `colorOverride` on `IRNodeContent`, applied where fill, border and text are resolved (`IRNodeContent.tsx:255`, `:438-443`, `:476`).
  - No change to `irTypes.ts`, `irValidate.ts`, `irCompile.ts` or any edge file (§2.2) [R].
- **Persistence: one optional top-level field** on `DViewElement`, next to `formTheme?`/`formPalette?` (`view.tsx:223-276`): `metaclassColoring?: { enabled; baseColor; border }`. Absent means off. Serialization is generic, so no VersionFixer migration is needed. It is written through the L proxy's default setter as `Name` is: one TRANSACTION, one undo step (§3) [R].
- **Selection, hover and error styles stay untouched.**
  - Native selection overrides `border-color` with its own class rule; an inline token loses to it by construction.
  - IR selection is `outline` plus `box-shadow` (`irStyle.ts:149`).
  - Border off paints the border `transparent` and keeps its width: 0 px layout shift by construction, to be measured (§2.3).
- **Critical zone:** `IRNodeContent.tsx` (`viewpoint/ir/`, CLAUDE.md §3.1). Layer Impact Report in §6. No §3.2 file, no creator, no sync file (RC-30 go-ahead held).

**Phase 2 file list** (6 source files plus 1 test file, under the limit of 8; none excluded; §5 has sizes): new `frontend/src/view/viewPoint/metaclassPalette.ts` and its test; `view/viewElement/view.tsx` (field declaration only); `ViewpointProperties.tsx`; `properties.scss`; `editor-v2/nodes/ObjectNode.tsx`; `editor-v2/viewpoint/ir/IRNodeContent.tsx`.

**Decisions taken (unattended, R-VP rows provisional)**
1. The palette's clamps apply to colours 1..n-1; colour 0 is the base exactly (the default `#0ea5e9` has S 89%, above the clamp).
2. Every class of the metamodel takes an index, abstract classes included. The order is a depth-first walk: `DModel.packages`, then each package's `classes`, then its `subpackages`.
3. Border on/off changes the border COLOUR only (a darker shade, or transparent). The view's width and style are kept, so a derived terminal box keeps its 3 px double border. Markers are drawn in the text colour.
4. Outside labels (`position 'outside'`, on the canvas and not on the fill) keep their colour. Row views dispatched to `IRRow` that author their own colour keep it; the derivation on this trunk emits none.
5. Orphan and not-rendered nodes are not coloured. The singleton pill is coloured.
6. The native selected header keeps its selection background (`#e0f7fa` in light). A node whose fill takes white text shows its name white on that header while selected. The prompt forbids touching selection styles, so this is measured and reported, not changed.

**Decisions awaiting Alfonso** (RC-26 list): none. Item 6 is a perceptual judgement for the visual GO.

**Questions**: none without a single recommendation. The cascade to Phase 2 proceeds.

## 1. Hypotheses under test
| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | A viewpoint-level override reaches the IR node path without `irTypes/irValidate/irCompile` or an edge file | holds [R] | `IRNodeContent` resolves fill, border and text inline from compiled accessors (§2.2). A prop added to `IRNodeContentProps` (`:151-194`) needs no compile change. `irValidate` is not on the render path. |
| H2 | The native path has one smallest point | holds [R] | The wrapper's inline style (`ObjectNode.tsx:1228-1232`), where tokens inherit to every text surface. Plus the pill wrapper (`:1171`), which has no `style` today. |
| H3 | «Native JSX views» paint M1 nodes through `jsxString`/`DV.tsx` | falsified [R] | `ModelTab.tsx:39-44`: the classic canvas is no longer mounted. `ObjectNode` reads no `jsxString`; only `ClassNode.tsx:424-437` (M2) uses `ViewpointRenderer`. |
| H4 | The viewpoint's fields persist generically, with no whitelist | holds [R] | `formTheme` precedent (`view.tsx:228-233`). The save serializer and `VersionFixer.update` strip nothing (§3). A second agent checks this under RC-27 (§3.5). |
| H5 | A node knows its metaclass and the metaclass's order | holds [R] | `data.instanceOfClassId` (`jjomTransformers.ts:304-310`), then `DClass.father` → `DPackage` (`LModelElement.tsx:2721`), `DPackage.classes`/`subpackages` (`:1819`, `:1823`), `DModel.packages` (`:5003`). |
| H6 | The active viewpoint of a model view is per model | falsified [R] | It is the global root `state.viewpoint` (`lastViewpoint.ts:70`, `irResolveCore.ts:127-128`). «Models shown under this viewpoint» therefore means every M1 canvas while it is active. |
| H7 | The change needs a critical-zone file | holds, partly [R] | `IRNodeContent.tsx` is §3.1 (`viewpoint/ir/`). No §3.2 file: the hook's six files (`scripts/hooks/critical-zone.mjs:37-44`) are untouched. |

## 2. Where the node is painted
### 2.1 Which branch paints an M1 object [R]
- `EditorV2.tsx:122-127` registers `objectNode: ObjectNode`, «M1: instance of a metaclass». M2 nodes are `ClassNode`, which this lane does not touch.
- `ObjectNode.tsx:109` `const irResolution = useIRView(id, data.instanceOfClassId);`, `:120` `const irDelegated = irResolution !== null && isMigratedDefaultView(irResolution.compiled);`, `:749` `const notRendered = irViewpointActive && !irResolution && !isOrphan;`, `:756` `const isPill = instanceShape === 'pill' && !isOrphan && !notRendered;`.
- The branches:
  - `:901` `if (irResolution && !irDelegated) {` is the IR path (wrapper `:928`, `<IRNodeContent` `:943`).
  - `:1168` `if (isPill) {` is the native pill.
  - `:1222` onwards is the native rectangle, also used by the orphan and not-rendered variants.
- A viewpoint with no IR views, or with migrated default views only, paints natively. That is the native scenario of the visual check: a plain viewpoint made active on DemoESM.

### 2.2 Fill, border and text, IR path (`viewpoint/ir/IRNodeContent.tsx`) [R]
- Fill:
  - `:255` `const fill = collapsedFill || (compiled.fill ? compiled.fill(readCtx, objectId) : '');`
  - `:429` `if (fill && !svgPainter) inlineStyle.background = fill;`
  - The CSS default is `irStyle.ts:73` `.ir-node-content { ... background: var(--node-bg); border: 1px solid var(--border-default); ...`
- Border:
  - `:438-440` resolve the three axes.
  - `:442-443` `if (hasAuthoredBorder && !svgPainter) { inlineStyle.border = \`${borderWidthV ?? 1}px ${borderStyleV ?? 'solid'} ${borderColorV || 'var(--border-default)'}\`;`
  - The separator reuses the colour (`:466`), and so does the marker (`:501` `const markerColor = borderColorV || 'var(--border-default)';`).
- SVG forms (diamond, hexagon, parallelogram, cylinder, cloud) take `:481-482` `const svgFill = fill || 'var(--node-bg)'; const svgStroke = borderColorV || 'var(--border-default)';`. Circle, ellipse and bar are CSS-painted (`shapeRegistry.ts:349,354,434`).
- Text:
  - `:476` `Object.assign(inlineStyle, resolveTextStyle(compiled.text, readCtx, objectId));` sets the node root, and every surface inherits it.
  - Labels override the root with their own `resolveTextStyle(l.style, …)`: `:603` for the editing input, `:617` for the span. The derivation writes label colours (`viewpointDerivation.ts:313` `INVERSE_TEXT`, `:318` `NAME_INK`).
  - Compartments do the same at `:643` and `:658`.
  - Values are drawn by `RowValue` with their own classes: `.mm-object__scalar { color: var(--color-inode-name)` (`instanceNode.scss:219`). They follow the `--color-inode-*` tokens and not an inherited `color`.
- The bar's label halo is `irStyle.ts:215` `text-shadow: 0 0 2px var(--color-inode-surface), …`. With the tokens set on the root, the halo takes the fill.
- Selection, never touched:
  - `irStyle.ts:149` `.mm-node.selected > .ir-node-content { outline: 2px solid var(--node-selection-stroke); … box-shadow: 0 0 0 3px var(--node-selection-halo), …`
  - SVG rings `ir-sel-ring` and `ir-sel-band` (`:519-524`, class-coloured).
  - The wrapper neutralizer at `irStyle.ts:65`.
- `compiled` is cached and shared across instances (`irCompile.ts:345-350`), so the override goes in as a prop, never as a mutation.

### 2.3 Fill, border and text, native path [R]
- `instanceNode.scss:22-31`: `.mm-node.mm-object { … background: var(--color-inode-surface); border: 1px solid var(--color-inode-border); …`. The header rule is `:76` `border-bottom: 1px solid var(--color-inode-border);`, and the pill surface is `:717-718`.
- Text is set per element and only through four tokens:
  - `--color-inode-name`: `.mm-object__name` `:103`, `__scalar` `:219`, `__bool` `:292`, `__number` `:319`, …
  - `--color-inode-label`: `__slot-label` `:171`, …
  - `--color-inode-quiet`: `__cardinality` `:186`, `__dash` `:215`.
  - `--color-inode-footer`: `__unit` `:327`, …
  - The separator and class name inherit from `.mm-object__name` (`ObjectNode.tsx:1302-1303`).
  - Chips and ref pills sit on their own background (`--color-inode-chip-*`, `--color-inode-ref-*`) and are not overridden.
- The inline tokens already exist at `ObjectNode.tsx:1228-1232`: `['--inode-accent' as string]: chrome.accentColor ?? 'transparent', ['--inode-badge-bg' as string]: chrome.badgeBg, ['--inode-badge-fg' as string]: chrome.badgeFg,`
- Selection, which wins over a token by construction:
  - `instanceNode.scss:670-680` `&.selected { outline: none; border-color: var(--color-inode-selected-border); … .mm-object__header { background: var(--color-inode-selected-header-bg);`
  - The light token is `_colors-light.scss:487` `--color-inode-selected-header-bg: #e0f7fa;`, so decision 6 applies.
  - The dark token is `_colors-dark.scss:376` `rgba(6, 182, 212, 0.2)`, which is translucent over the fill.
- Border off becomes `--color-inode-border: transparent`. The 1 px geometry stays, which is the no-shift principle of `irStyle.ts:57-64`, and the header rule goes too.

### 2.4 The active viewpoint and the metaclass order [R]
- `lastViewpoint.ts:70` `SetRootFieldAction.new('viewpoint', viewpointId || null, '', true);`, and readers go through `state.viewpoint`, as in `irResolveCore.ts:127-128` `const vp = viewpointId ?? state.viewpoint;`.
- In the default scenes it reads `""` [M, probe on 3091: `MEAS default viewpoint (state.viewpoint) ""`], so no viewpoint's setting applies there.
- `data.instanceOfClassId` comes from `lObject.instanceof.id` (`jjomTransformers.ts:308-309`).
- Order: `DClass.father!: Pointer<DPackage, 1, 1, LPackage>` (`LModelElement.tsx:2721`), `DPackage.classes: Pointer<DClass>[] = []` (`:1819`), `subpackages` (`:1823`), `DModel.packages` (`:5003`).
- These arrays persist in order, so the index survives reloads and renames. Deleting a class moves the later indices, which is accepted by the prompt's choice.

## 3. Persistence [R]
1. **Declaration.** `view.tsx:223` `viewpointType?: ViewpointType;`, `:250` `formTheme?: FormThemeName;`, `:276` `formPalette?: FormPaletteName;`.
   - `:228-233` states: «ABSENT IS A VALUE … That is why no VersionFixer migration accompanies it».
   - `:235-240` states: «Declared HERE and not on `DViewPoint` … `DViewPoint` carries no own data field at all».
   - `Constructors.DViewElement` (`classes.ts:1161-1279`) sets none of these, so they are absent on a fresh viewpoint.
2. **Write.** The panel writes `viewpoint.name = e.target.value` (`ViewpointProperties.tsx:28`). A key with no `set_<key>` falls to `_defaultSetter` (`proxy.ts:494-497`), which emits `SetFieldAction.new(c.data, k, v, '', isPointer)` inside one TRANSACTION (`classes.ts:2503-2507`).
   - Modifier `''` replaces the value (`reducer.ts:386-387`). The panel therefore writes the whole object, `{...current, …}`.
   - Changes within 450 ms merge into one undo step (`reducer.ts:1155`, `U.UpdatingTimer*1.5`), so a drag on the colour input is one step. That merge was read, not measured.
   - Dispatch is asynchronous (`action.ts:349` `setTimeout(…, 0)`).
3. **Save and load.** `U.compressedState` → `JSON.stringify(state, proxyToIdReplacer)` (`U.tsx:429-445`, `model/unproxy.ts:84-88`), with no whitelist. `SaveManager.load` → `JSON.parse` → `VersionFixer.update` (`SaveManager.ts:56`) → `LOAD` takes the state as is (`reducer.ts:519-535`).
   - `updateDefaultView` rebuilds only `Pointer_ViewPointDefault` that was never edited (`view.tsx:1990-2019`).
   - `VersionFixer.tsx` is imported by no test of this lane and edited by none.
4. **Duplicate.** `get_duplicate` copies every key not on its skip list (`view.tsx:1912-1966`), so the field follows a duplicated viewpoint. The name holds no `RECOMPILE` (`:1957`).
5. **RC-27.** The choice of one object field over three flat fields or `_state` keys is between data models, so a second agent checks it. Its `Verified:` line goes into the R-VP row. `_state` was rejected: it is open to user code and `clearState`, and a `'-='` removal is not undone (`docs/log-inbox/simulation.md`, cited by the persistence reader).
6. **Test.** `Constructors` does not import under vitest (`joiner` reaches monaco: `window is not defined`, CLAUDE.md §5), so «absent on a fresh viewpoint» is tested on a fixture shaped as `Constructors.DViewElement` leaves it. The round trip uses the real save serializer (`proxyToIdReplacer`), JSON-parsed as the load does. The gap goes in the log entry, per CLAUDE.md §5.

## 4. Controls on the absences claimed
- New names unused: `metaclassPalette`, `metaclassColoring`, `contrastText`, `colorByMetaclass`, `colorOverride`, `metaclassColoringVars`, `resolveMetaclassColoring`, `MetaclassColorOverride`, `readMetaclassColoring`, `metaclassOrder` and `borderShade` each give 0 over `frontend/src frontend/scripts` (`command grep -rn`) [M]. The same command gives 1 for `wp-switch` and 1 for `wp-field__hint`, the positive controls. `properties.scss` has no `&__color` (read whole, 330 lines).
- `.wp-toggle` and `.wp-switch` (`properties.scss:111-163`) are styled but used by no `.tsx` [M: the grep outside `.scss` returns empty, with `wp-switch` found in the `.scss`]. The toggle reuses them.
- The derivation on this trunk emits no row views [M]: `command grep -c "kind: 'row'"` gives 0 over `viewpointDerivation.ts`. The same file shows `kind: 'vertex'` (`:322`) and `kind: 'edge'` (`:281`) in the same search.
- The cited report `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` is not on this branch. It is on `viewpoint-notations` (`ee7206d0c`) and was read with `git show`. Nothing in this lane depends on it beyond context.

## 5. Phase 2 list, sizes, tests
| File | Change | Size |
|---|---|---|
| `frontend/src/view/viewPoint/metaclassPalette.ts` (new) | pure: `metaclassPalette`, `contrastText`, `borderShade`, `readMetaclassColoring`, `metaclassOrder`, `resolveMetaclassColoring`, `metaclassColoringVars`; no React, DOM or `joiner` | ~+170 |
| `frontend/src/view/viewPoint/__tests__/metaclassPalette.test.ts` (new) | palette, contrast, settings, order, resolver, round trip | ~+220 |
| `frontend/src/view/viewElement/view.tsx` | `metaclassColoring?:` on `DViewElement` + a type-only import | ~+12 |
| `components/editors/viewpoint/properties/ViewpointProperties.tsx` | toggle (`.wp-toggle` + `.wp-switch`), Base color, Border | ~+60 |
| `components/editors/viewpoint/properties/properties.scss` | `.wp-field__color-row`, `__color`, `__color-hex` (11 px) | ~+25 |
| `components/editor-v2/nodes/ObjectNode.tsx` | one `useSelector`; tokens on the rectangle and pill wrappers; prop to `IRNodeContent` | ~+15 |
| `components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | optional `colorOverride` prop at fill, border, text, labels and compartments | ~+30 |

Mutation bench on the palette, contrast and resolver, by a gitignored script. The node paths (`ObjectNode` and `IRNodeContent`, which do not import under vitest) are measured by the lane probe on 3091.

## 6. Layer Impact Report
```
LAYER IMPACT REPORT
Layers touched:
  [x] D-layer (Redux raw data): one optional field declared on DViewElement; written by the default setter
  [ ] L-layer (computed proxies): no L declaration, no setter (default setter, as viewpointType/formTheme)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): ObjectNode (render only), IRNodeContent (render only)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString): the new field rides the generic serializer; no migration, no jsxString
D-layer — what changes: a SetFieldAction on the viewpoint's own id, key metaclassColoring, from the panel.
  What does NOT change: no creator (DVertex.new / DVoidEdge.new2/new3), no TRANSACTION nesting, nothing near sync/.
  Cross-layer: read-only by a selector; no write back from render. Safety: absent = off, so every existing state reads as today.
Canvas — what changes: with an override, inline tokens and inline fill/border/colour on the M1 node only.
  What does NOT change: node size (border colour only, width kept), handles, edges, selection/hover/problem classes,
  the compiled IR (not mutated), M2 ClassNode. With no override the markup is byte-identical (no prop, no key).
  Cross-layer: none; the ReactFlow node data is not touched, so the sync hooks never see it.
Persistence — what changes: one more key in saved viewpoints that used the toggle. What does NOT change: old projects.
Smoke-test scenarios potentially affected:
  - the four demo scenes in the default viewpoint: 0 px against c1e0376dc (probe, before run done on 3091)
  - DemoFlowB under its derived viewpoint (IR): toggle off 0 px; on: fill/text/stroke per node, boxes 0 px
  - DemoESM under a plain viewpoint (native): same readings; the pill if present
  - panel: toggle off/on, values kept across off/on, save/load round trip of the field
```

## 7. Files read (under `/Users/alfonso/jjodel-w-vpcolor/`)
- **Governance.** `CLAUDE.md` (§3.1, §3.2, §5, §6, §17), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (P1-P16), `docs/decisions.md` (RC-20..RC-34, R-VP-1..18), `docs/log-inbox/views.md` (headings, last eight entries), the report cited in RIFERIMENTI (by `git show ee7206d0c`).
- **Read by me, whole:** `ViewpointProperties.tsx`, `properties.scss`, `view/viewPoint/viewpoint.ts`, `__tests__/viewpointThemeHint.test.ts`, `editor-v2/utils/derivePalette.ts`, `ui/ColorPicker/ColorPicker.tsx`.
- **Read by me, windows:**
  - `ObjectNode.tsx:1-60, 92-140, 612-625, 745-760, 895-960, 1160-1250`
  - `IRNodeContent.tsx:130-262, 420-700`
  - `IRRow.tsx:20-40`
  - `instanceNode.scss:15-150, 655-690, 715-719`
  - `EditorV2.scss:2270-2320`
  - `irStyle.ts:65,73,149,212-216`
  - `view.tsx:218-292`
  - `lastViewpoint.ts:36-80`
  - `Info.tsx:1560-1625`
  - `viewpointDerivation.ts:82-86, 271-322`
  - `LModelElement.tsx:1819-1824, 2718-2722, 5003`
  - `_colors-light.scss:440-491`
  - `_colors-dark.scss:341,376`
  - `scripts/hooks/critical-zone.mjs:25-60`
  - `redux/__tests__/versionfixer_old_states.test.ts:20-70`
- **Read by three read-only Explore agents** (native path, IR path, persistence). Every citation above was re-read, except `classes.ts`, `proxy.ts`, `reducer.ts`, `U.tsx` and `SaveManager.ts` in §3, which are the persistence agent's and are marked [R] through it.
