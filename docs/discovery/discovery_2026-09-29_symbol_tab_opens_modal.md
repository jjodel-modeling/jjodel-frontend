# Discovery — Symbol tab opens the Symbol Editor directly; "Form" relabelled "Layout"

- Prompt-ID: P-2026-09-29-1826 (`docs/prompts/claude_2026-09-29_1826_prompt_symbol_tab_opens_modal.md`)
- Session: session unknown
- Tree: `~/jjodel-w-symbol-tab`, branch `symbol-tab-modal`, HEAD `d1e435da4`
- Executor: Opus 5.5 (`claude-opus-5-5`)
- Lane: fast. Phase 1, read-only.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it
downstream re-reads the real files. Every claim below is **read** (source at `d1e435da4`) unless
tagged **measured**; no runtime was exercised in this phase.

## 1. Objective

Locate the owner of the view-authoring tab row, the intermediate Symbol pane and the Symbol
Editor opener; check that every control of the pane is reachable in the modal; find every
user-facing "Form" label of the tab; fix the Phase 2 file list.

## 2. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The tab row lives in `VertexAuthoringPanel.tsx` (prompt's expected area) | **Falsified.** The bar lives in `ViewData.tsx`; the panel only renders bodies (§4.1). |
| H2 | The intermediate pane is a separate component | **Holds.** `SymbolCard.tsx`, imported only by `ViewData.tsx` (§4.2). |
| H3 | The modal has one open function reusable from the tab | **Holds.** The `SYMBOL_EDITOR_OPEN` event, modal mounted once in `App.tsx` (§4.3). |
| H4 | Every control of the pane is reachable in the modal | **Holds**, with one display caveat on the Border swatch (§5). |
| H5 | The last active tab is persisted | **Falsified.** Plain `useState`, initial = first tab (§4.4). |
| H6 | Arrow-key roving focus exists on the tab row | **Falsified.** No key handler on the bar (§4.5). |
| H7 | A tooltip already exists on the tab row | **Falsified** (§4.6). |
| H8 | "Form" as the tab's user-facing label appears only in `irTabs.tsx` | **Partly.** Also the canvas inspector's link text "Open the Form tab" (§6). |

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editors/views/ViewData.tsx` (whole, 318 lines)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (whole)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.tsx` (whole)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editor-v2/viewpoint/authoring/SymbolCard.scss` (whole)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (whole, 606 lines)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (windows 500-660, 745-770, and grep hits)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/ui/ColorPicker/ColorPicker.tsx` (lines 10-95)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editors/views/nestedView.scss` (lines 185-245)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editors/properties-with-tree-view.scss` (lines 555-590)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editors/railSystem.scss` (lines 1-60, 310-400)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editor-v2/nodes/RendererInspector.tsx` (lines 140-210)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx` (lines 724-732)
- `/Users/alfonso/jjodel-w-symbol-tab/frontend/src/components/editors/PropertiesWithTreeView.tsx` (grep of the width constants)

## 4. Findings

### 4.1 The tab row is owned by `ViewData.tsx`

`ViewData.tsx:106-113` builds the IR bar from `irTabsForKind` and routes the Symbol tab to the card:

```
    const tabs: TabDescriptor[] = irKind ? irTabsForKind(irKind, props.advanced).map((id) => ({
        id,
        label: IR_TAB_LABELS[id],
        ...
        render: () => id === 'ir-symbol'
            ? <Try><SymbolCard view={view} /></Try>
            : renderIRPanel(id),
```

`ViewData.tsx:250-263` renders the bar; every tab is a `<button role="tab">` whose click activates it:

```
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
```

Labels and the vertex bar order live in `irTabs.tsx:33-41` and `:67`:
`'ir-form': 'Form',` and `: ['ir-applies-to', 'ir-structure', 'ir-symbol', 'ir-form'];`
(Source appended when Advanced, `:68`). Only the vertex bar has `ir-symbol`; row and edge bars do not.

### 4.2 The intermediate pane is `SymbolCard`

`SymbolCard.tsx:41-76` renders: thumbnail (`SymbolPreview` of the first recognized preset, or `bi-shapes`), name (`first.label` or `'Custom symbol'`), sub-line (notations `· also: <tail>`, or `'no catalog preset matches these axes'`), a Border row (swatch + text of `shape.border.color`, default `#334155` at `:25`, a conditional colour shows the default), and the launcher at `:67-75`:

```
                onClick={() => window.dispatchEvent(
                    new CustomEvent(JjodelEvents.SYMBOL_EDITOR_OPEN, { detail: { viewId: view.id } })
                )}
```

Importers of `SymbolCard`: only `ViewData.tsx:30` (**measured**: `command grep -rn "SymbolCard" src` over `.ts/.tsx`, `import` lines; the same search returned `SymbolCard.tsx:18`, its own scss import, as positive control). Its styles: `SymbolCard.scss` and the `.symbol-card*` rules at `railSystem.scss:326-354`.

### 4.3 Modal open state lives in the modal

`SymbolEditorModal.tsx:191` holds `viewId` in local `useState`; `:207-221` listens to `JjodelEvents.SYMBOL_EDITOR_OPEN` and sets `viewId`, resets `navKey` to `'symbol'` (`:212`). Mounted once at `App.tsx:185` (`<Try><SymbolEditorModal/></Try>`). Closing: Esc (`:224-237`), close button (`:495`), backdrop click (`:432`), Done (`:599`). All set `viewId` to null; nothing in `ViewData` is touched by open or close, so the tab row underneath keeps whatever state it had.

### 4.4 Tab state is not persisted

`ViewData.tsx:194`: `const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id);` — `tabs[0]` is `ir-applies-to` for every IR kind. No `localStorage`/`sessionStorage` in the file (**measured**: count 0; positive control `useState` count 2 in the same file). The only programmatic tab switch is the `IR_AUTHORING_TAB` event (`:202-211`), dispatched today with `'ir-form'` (`RendererInspector.tsx:149-151`) and `'ir-structure'` (`FormAuthoringBody.tsx:728-730`); no dispatcher names `'ir-symbol'`. The handler accepts any tab id in the current list, so a future `'ir-symbol'` would activate the Symbol tab: Phase 2 must refuse it (fallback rule of the contract). `:215` already falls back to `tabs[0]` for an id absent from the list.

### 4.5 No roving focus

The bar (`ViewData.tsx:251-263`) has no `onKeyDown`; tabs are native `<button>`s, so Tab moves focus and Enter/Space fire `onClick`. Arrow keys do nothing. Contract item "arrow keys must not open the modal" holds by construction as long as the trigger is `onClick` only.

### 4.6 No tooltip on the tab row

`title=` count in `ViewData.tsx`: 0 (**measured**; control `role=` count 3). No `InfoTooltip` in the bar markup (`:250-264`, read whole).

### 4.7 Tab metrics (for the icon and the relabel)

`nestedView.scss:199-210`: the bar is `display: flex; flex-wrap: nowrap; overflow-x: auto;` with the scrollbar hidden. `:213-223`: tab `flex: 0 0 auto; white-space: nowrap;`. In the rail, `properties-with-tree-view.scss:564-568` sets `font-size: 14px; padding: 12px 10px;`. The bar is a block-level flex child, so its width is its container's, not its content's; its height is the tallest tab.

## 5. Pane controls → where each lives in the modal

| Pane item (`SymbolCard.tsx`) | In the modal | Evidence |
|---|---|---|
| Thumbnail of the recognized preset | Header chip `SymbolPreview` (22px) of the current axes, plus the preview strip | `SymbolEditorModal.tsx:462` `<SymbolPreview preset={previewPreset} width={22} cornerRadius={cornerRadius} />`; strip from `:530` |
| Preset name / "Custom symbol" | Chip name | `:463` `<span className="symbol-editor-modal__chip-name">{titleLabel}</span>`, `titleLabel` at `:338` |
| Notation families + "also:" tail / "no catalog preset matches" | Symbol section recognition line, the nav entry the modal opens on | `VertexAuthoringPanel.tsx:627-634` (`{matches.length > 1 ? \` · also: ...` and `Custom symbol · no catalog preset matches these axes`); the modal resets `navKey` to `'symbol'` on open (`SymbolEditorModal.tsx:212`); notations also in the chip `title` (`:459`) |
| Border colour swatch + value | Border section, Color field (`ConditionalEditor` + `ColorPicker`, text field shows the value) | `VertexAuthoringPanel.tsx:751-759`; nav entry `border` always present (`SymbolEditorModal.tsx:75-76`) |
| "Open symbol editor" button | Replaced by the tab trigger itself | — |

**Caveat on the Border swatch (read, not measured).** When the stored colour is a CSS variable such as `var(--color-inode-border)`, the card painted it through `style={{ background: borderColor }}` (`SymbolCard.tsx:62`) and printed the string. In the modal the `ColorPicker` text field shows the same string (`ColorPicker.tsx:77-80`, `value={text}`), but its native swatch falls back to black: `ColorPicker.tsx:58` `const swatchValue = FULL_HEX_RE.test(value) ? value : '#000000';`. The resolved colour is still visible in the modal's preview strip (tiles receive `borderColor`, `SymbolEditorModal.tsx:537-538`). Value and control are reachable; only the swatch rendering of a non-hex value differs. Pre-existing modal behaviour, out of scope (modal internals). Not a stop condition by the contract's wording ("reachable"); flagged in question 1.

## 6. Occurrences of "Form" as this tab's label (inside `frontend/`)

Search: `command grep -rn "Form tab\|Form</\|'Form'\|\"Form\"" .` from `frontend/`, excluding `node_modules`, `dist`, `build` (**measured**; positive control: the hit at `irTabs.tsx:37`).

User-facing:
- `irTabs.tsx:37` — `'ir-form': 'Form',` (the tab label).
- `RendererInspector.tsx:204` — link text `Open the Form tab` (canvas inspector, jumps to `'ir-form'` via `IR_AUTHORING_TAB`).

Comments only (not relabelled): `RendererInspector.tsx:110,112,258,266`, `rendererInspector.scss:209`, `valueRenderer.ts:278`, `ObjectNode.tsx:770`, `widgetRenderer.ts:114`, `FormAuthoringBody.scss:1`, `FormAuthoringBody.tsx:22`, `VertexAuthoringPanel.tsx:320,590`, `Info.tsx:623`, `ViewData.tsx:196`.
Tests pinning `'Form'`, `Open the Form`, `IR_TAB_LABELS`, `SymbolCard` or `ir-symbol`: none (**measured**, `*.test.ts(x)`; positive control `IR_AUTHORING_TAB` → `formAuthoring.test.ts:514`).

## 7. Dependencies and risks

- **R1, tab row overflow (estimate, not measured).** The icon (~11px + gap) and "Layout" (+2 chars over "Form") widen the vertex bar by roughly 25-30px at 14px. The rail's overlay width ranges 360-640 (`PropertiesWithTreeView.tsx:59-61`), docked 400-700 (`:49-51`). At the minimum overlay width the Advanced bar (with Source) plausibly already overflows today; the overflow is a hidden horizontal scroll, which reads as a clipped last tab. Visual check (e) must measure it; the bar's own `getBoundingClientRect()` does not change with content width (§4.7), so check (d) measures height only in practice.
- **R2, icon height.** A Bootstrap icon glyph is `inline-block; line-height: 1; vertical-align: -.125em`; at 11px inside a 14px label its box should sit inside the label's line box. Phase 2 pins `line-height: 1` on the `<i>`; check (d) confirms.
- **R3, dead code.** After Phase 2 `SymbolCard.tsx`, `SymbolCard.scss` and `railSystem.scss:326-354` have no consumer. Not deleted (prompt: report as dead code; Rule 9).
- No critical-zone file (§3.1) is involved. No IR, D-layer, sync or persistence change. `'ir-form'` / `'ir-symbol'` ids unchanged.

## 8. Phase 2 file list (3 files)

1. `frontend/src/components/editors/views/ViewData.tsx` — Symbol tab becomes a trigger (dispatch `SYMBOL_EDITOR_OPEN`, never `setActiveTab`), `aria-haspopup="dialog"`, trailing `bi-box-arrow-up-right` at 11px; `ir-symbol` refused by the `IR_AUTHORING_TAB` handler and by the active-tab resolution (fallback to the first tab); `SymbolCard` render and import removed; tab `title` from a tooltip map.
2. `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` — `'ir-form': 'Layout'`; new `IR_TAB_TOOLTIPS` with `'ir-form': 'How the element appears in forms'` (**measured**: no collision for `IR_TAB_TOOLTIPS`, count 0).
3. `frontend/src/components/editor-v2/nodes/RendererInspector.tsx` — link text `Open the Form tab` → `Open the Layout tab`.

All controls are reachable and the list is 3 files: per the prompt, Phase 2 continues in this session.

## 9. Open questions

1. The modal's Border swatch paints black for a non-hex value such as `var(--color-inode-border)` (text field correct): open a ticket against the modal/`ColorPicker`, or accept?
2. `SymbolCard.tsx` / `.scss` and the `railSystem.scss` card rules are dead after Phase 2: delete in a cleanup lane?
