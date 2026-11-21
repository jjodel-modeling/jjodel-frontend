# Discovery: notation and colors persisted per tab (P-2026-11-21-0100)

- Prompt-ID: P-2026-11-21-0100, prompt `docs/prompts/claude_2026-11-21_0100_prompt_per_tab_notation_colors.md`
- Chat: C-2026-11-20-2310; lane full, discovery then Phase 2 in cascade (RC-21, RC-25)
- Tree: `~/jjodel-w-tabprefs`, branch `per-tab-view-prefs`, HEAD `621d54d61` (trunk `alfonso-frontend-jjtl` at `bacae8815` is its ancestor)
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## 0. Answer in brief

The per-tab viewpoint is not a store of its own: it is a field of each tab in the editor groups record
(`jjodel.editorGroups.<userId|anon>.<projectId>`, R-MT-33), fed by an in-memory map `tabId → viewpointId` in
`groupPersistence.ts`. Notation and colors can ride on the same record as two optional fields of the saved tab, fed by
a second map of the same shape: same key, same project scoping, same debounce and flush, and a closed tab leaves the
record with its layout entry. Every user choice (chip, View › Syntax, View › Colors, Palette submenu, palette manager,
new palette) reaches EditorV2 through the two Toolbar props `onNotationChange` and `onColorSchemeChange`, so the double
write needs one site, in `EditorV2.tsx`. No critical-zone file is on the path. `canvasViewChoices.ts` and
`ColorSchemeSelector.tsx` need no change. `DockManager.tsx` does: it hosts the record's restore (`loadTab`) and save
(`noteGroupsChanged`), which is "the per-tab viewpoint persistence" of DOVE.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | Notation and colors are read from and written to one global key each, at canvas open and on every change | Holds, read: §3.1 |
| H2 | The per-tab viewpoint has a store that can take two more fields | Holds, read: it is the editor groups record, §3.2 |
| H3 | Every write path of a choice goes through EditorV2's two setters | Holds, read: §3.3 |
| H4 | Something outside the canvas reads the two global keys (export, print, dashboard, tests, scripts) | Falsified, read: §3.4 |
| H5 | The persistence is wired through a critical-zone file | Falsified, read: §3.2, §3.3 |
| H6 | A saved tab's fields can reach the canvas before it mounts | Holds, read: rc-dock calls `loadTab` synchronously inside `loadLayout`, §3.2 |

## 2. Files read (full paths under `frontend/`)

- `src/components/editor-v2/EditorV2.tsx` (windows 1170-1260, 5537-5580)
- `src/components/abstract/tabs/groupPersistence.ts` (whole, 286 lines)
- `src/components/abstract/tabs/__tests__/groupPersistence.test.ts` (1-70, 205-223)
- `src/components/abstract/DockManager.tsx` (380-475)
- `src/components/abstract/tabs/EditorSwitch.tsx` (140-303)
- `src/components/abstract/Dock.tsx` (352-372, 462-468)
- `src/components/abstract/tabs/modelTabId.ts` (27-37)
- `src/components/editor-v2/Toolbar.tsx` (512-547, 918-925)
- `src/components/editor-v2/canvasViewChoices.ts` (120-190)
- `src/components/editor-v2/components/ColorSchemeSelector.tsx` (203-208, plus the search in §3.4)
- `node_modules/rc-dock/lib/DockLayout.js` (515-521)
- `docs/discovery/discovery_2026-11-20_canvas_toolbar_rationalization.md` §5 (storage scopes)

## 3. Findings

### 3.1 The two global keys (read, HEAD 621d54d61)

`EditorV2.tsx:1183-1190`:
```
const [notation, setNotation] = useState<NotationMode>(() => {
    const saved = localStorage.getItem('editor-v2-notation');
    return VALID_NOTATIONS.includes(saved as NotationMode) ? (saved as NotationMode) : 'uml';
});
useEffect(() => {
    localStorage.setItem('editor-v2-notation', notation);
}, [notation]);
```
`EditorV2.tsx:1211-1221`: the same for `'editor-v2-color-scheme'`, default `'default'`, a saved value valid when built-in
(`VALID_SCHEMES`, :1210) or a custom palette of `customPalettes` (`jjodel.customPalettes`, :1194-1204).

The write is an effect on the value, so it also runs at mount. With per-tab reads this would write each restored tab's
own value into the global key at reload, and the key would end up holding the last tab to mount, not the last choice.
The global write has to move from the effect to the choice.

Other state changes of the color: `handleCreateCustomPalette` (:1224-1231, `setColorScheme(id)`, a choice) and
`handleDeleteCustomPalette` (:1240-1243, `setColorScheme(prev => (prev === id ? 'default' : prev))`, a fallback, not a
choice). Notation has no setter call other than the Toolbar prop (:5562).

The canvas class reads both: `EditorV2.tsx:5537` `` className={`editor-v2 theme-light notation-${notation}${colorScheme !== 'default' ? ` scheme-${colorScheme}` : ''}...`} ``.

### 3.2 The per-tab viewpoint persistence (read)

- Record: `groupPersistence.ts:24` `export interface SavedGroupTab { id: string; modelId?: string; viewpointId?: string | null }`;
  key `:30-31` `` `${KEY_PREFIX}${userId || 'anon'}.${projectId}` `` with `KEY_PREFIX = 'jjodel.editorGroups.'` (:19).
- Live channel: `:37` `const tabViewpoints = new Map<string, string | null>();`, `noteTabViewpoint` (:41-47) calls the
  change listener once per change, `tabViewpointOf` (:50-52). EditorSwitch notes at mount and on change:
  `EditorSwitch.tsx:167` `useEffect(() => { noteTabViewpoint(ownTabId, tabViewpointId); }, [ownTabId, tabViewpointId]);`
- Save: `buildGroupsRecord` (:91-126) keeps only artifact tabs of the models groups, `:101`
  `tabs.push({ id, modelId: modelOfTabId(id), viewpointId: ctx.viewpointOf(id) ?? null });`. Called from
  `DockManager.noteGroupsChanged` (`DockManager.tsx:443-454`), itself called at every layout change
  (`Dock.tsx:467` `DockManager.noteGroupsChanged?.(newLayout);`) and by the map's listener
  (`DockManager.tsx:787` `setGroupsChangeListener(() => DockManager.noteGroupsChanged());`). Written 400 ms after the
  changes stop (`DockManager.tsx:386`), flushed at unload and project close (`Dock.tsx:367-371`).
- Validation: `okTab` (`groupPersistence.ts:140-146`) refuses the whole record on a defect; unknown keys of a tab are not checked.
- Restore: `pruneGroupsRecord` rebuilds each tab as `{ id, modelId, viewpointId: vp }` (:196-197), so any other field is
  dropped today. `DockManager.loadTab` (`DockManager.tsx:393-402`) turns a saved tab into a live one; rc-dock calls it
  synchronously inside `loadLayout`: `DockLayout.js:516` `this.setLayout(DockLayout.loadLayoutData(savedLayout, ...))`,
  `:521` `Serializer.loadLayoutData(savedLayout, defaultLayout, loadTab, afterPanelLoaded)`. A value seeded in
  `loadTab` is therefore in the map before the tab's EditorV2 renders, including the tabs behind each group's active one.
- Cleanup on close: a closed tab leaves the layout, so the next record has no entry for it. The in-memory map keeps it.
  For the viewpoint this is inert (a new tab passes its viewpoint explicitly). For notation and colors it is not: a
  further tab reuses a free id (`nextModelTabId`, `DockManager.tsx:468`), and a stale entry would beat the global
  fallback. The map has to drop the ids no longer in the layout; `layoutTabIds` (`modelTabId.ts:27-37`) walks every box
  (dock, float, window, max), so a maximized tab keeps its entry.

### 3.3 The write paths of a choice (read)

- Chip: `Toolbar.tsx:922-923` `const handleSelect = useCallback((id: NotationMode) => { onNotationChange(id);`
- View › Syntax and View › Colors: the canvas publishes its actions under its tab id (`Toolbar.tsx:521-524`
  `setNotation: onNotationChange, ... setColorScheme: onColorSchemeChange,`, `:544` `publishCanvasView(tabId, canvasView);`);
  the menu runs them (`canvasViewChoices.ts:147` `run: () => actions.setColorScheme(id as ActiveColorScheme),`). The
  Palette submenu entries are built by the same `scheme(...)` (:149-150), so they take the same path.
- Palette manager: `ColorSchemeSelector.tsx:206-207` `const handleSelect = useCallback((id: ActiveColorScheme) => { onColorSchemeChange(id);`
- New palette: `EditorV2.tsx:1230` `setColorScheme(id);` inside `handleCreateCustomPalette`.
- EditorV2 binds both props to its setters: `EditorV2.tsx:5562` `onNotationChange={setNotation}`, `:5564` `onColorSchemeChange={setColorScheme}`.

So the registry needs no tab id (EditorV2 knows its own, `tabId` prop, :518) and ColorSchemeSelector needs no change.
EditorV2 is mounted only by EditorSwitch, always with `tabId={ownTabId}` (`EditorSwitch.tsx:265-272`, `:290-297`;
search `command grep -rnE "<EditorV2($| )" src`, 2 hits, both there).

### 3.4 Readers of the two global keys (read)

`command grep -rn -e "editor-v2-notation" -e "editor-v2-color-scheme" frontend/src frontend/scripts frontend/e2e frontend/tests`,
exit 0: 4 hits, all `EditorV2.tsx` (:1184, :1189, :1212, :1220), which is also the positive control (the search reaches
the subject). No export, print, dashboard, test or smoke script reads them. Docs mention them only in past discovery
reports and the log archive.

## 4. Proposed design (Phase 2)

`groupPersistence.ts` (the store, bench-importable):
- `SavedGroupTab` gains `notation?: string; colorScheme?: string` (optional properties only, rule 11).
- A second map `tabId → { notation?, colorScheme? }`: `noteTabViewPref(tabId, pref, value)` (listener once per change),
  `tabViewPrefsOf`, `resetTabViewPrefs`, `retainTabViewPrefs(ids)`.
- `openingViewPref(tabId, pref, isValid, fallback, storage)`: the tab's value; else the global key; else the default.
  An invalid value (a deleted custom palette) counts as absent.
- `chooseViewPref(tabId, pref, value, storage)`: notes the tab's value and writes the global key; never throws.
- `buildGroupsRecord` writes the two fields when the context's optional `viewPrefsOf` has them; `validateGroupsRecord`
  accepts them when absent or strings; `pruneGroupsRecord` carries them into the layout and the plan.
- The global key names stay `'editor-v2-notation'` and `'editor-v2-color-scheme'`, as constants of this module.

`EditorV2.tsx`: initialisers through `openingViewPref`; an effect notes the tab's value at mount and on change (as
EditorSwitch notes the viewpoint); `chooseNotation` / `chooseColorScheme` set the state and call `chooseViewPref`, bound
to the two Toolbar props and used by `handleCreateCustomPalette`; the two write effects on the global keys go.
`handleDeleteCustomPalette` keeps calling the raw setter: a fallback is not a choice, and a global key left on the
deleted id is refused at the next open, so a new tab still opens on Default as today.

`DockManager.tsx`: `loadTab` seeds the map from the saved tab's fields; `noteGroupsChanged` passes `viewPrefsOf` to
`buildGroupsRecord` and calls `retainTabViewPrefs(layoutTabIds(layout))` after the key check.

Tests in `groupPersistence.test.ts`: reading order (tab, global, default, invalid tab value), the double write, the
round trip through the record, the prune carrying the fields, retain dropping a closed tab's entry.

Files: 4 (`groupPersistence.ts`, its test, `EditorV2.tsx`, `DockManager.tsx`), under rule 19's five.

## 5. Lane overlaps (measured, `git diff --name-only alfonso-frontend-jjtl...<branch>`, filtered on the files above)

- `ui-vsplit` (splitter lane, in flight): no overlap.
- `shell-rail-toggle` (`~/jjodel-w-railtoggle`): no overlap.
- `multi-tab-split-n` (last commit 2026-11-19 02:08, not merged into the trunk): touches `DockManager.tsx`,
  `EditorSwitch.tsx`, `EditorV2.tsx`, `Toolbar.tsx` (EditorV2 +41/-10, DockManager +37). A stale branch of the R-MT-28
  in-canvas split, not named by the prompt; recorded, not acted on.

## 6. Risks

1. The global write moves from an effect to the choice. A state change that is not a choice (the palette-delete
   fallback) no longer writes the global key; effect measured on the visible outcome only by reading (§4): a new tab
   still opens on Default.
2. Re-choosing the value a tab already shows now writes the global key (it did not: an unchanged state ran no effect).
   This is what point 3 asks: the global key is the last value chosen anywhere.
3. A record written by this lane and read by an older build: the extra fields are ignored by the older `okTab` and
   dropped by its prune, so the older build opens as it does today. A record of an older build has no fields: every tab
   falls back to the global key, i.e. what users see today (point 2's migration).
4. StrictMode double effects: the note effect is idempotent (the map ignores an unchanged value), and no effect writes
   the global key, so a double mount cannot move it.

## Decisions taken (unattended)

1. Store: the two fields ride on the editor groups record's tab, no second store. Recommended: as proposed (prompt point 1, "no second store").
2. The tab's value is noted at mount too, not only on a choice, so a tab that inherited the global value keeps it after another tab changes the global key. Recommended: note at mount, as EditorSwitch does for the viewpoint.
3. `DockManager.tsx` is in scope as part of "the per-tab viewpoint persistence it already uses". Recommended: yes; it is where the record is restored and saved.
4. An in-memory entry of a tab no longer in the layout is dropped at the next layout change, so a reused tab id opens on the global value. Recommended: yes (prompt point 1, "same cleanup when a tab is closed").
5. R-MT-39 says «Storage unchanged: notation and colors keep their global keys»; this lane changes that sentence's subject. The change itself is Alfonso's (open question 2 of the checkpoint, «ok alle raccomandazioni» 2026-11-21 00:59), so it is not an RC-26 item; it is recorded as a new row that amends R-MT-39, R-MT-39's text untouched (add-only). Recommended: a new row R-MT-40 in R-MT-39's header shape.

## Decisions awaiting Alfonso

None from the RC-26 list: no critical-zone file, no exported interface broken (optional properties only), no ratified
row rewritten, no file or persisted data deleted, the MODELS demo unchanged.
