# Discovery: keystroke esistenti nel metamodel/flow editor

Data: 2026-05-03
Branch: `alfonso-frontend-jjtl`
Commit HEAD: `bac5868bb`

## TL;DR

- **Sistema centralizzato parziale**: esistono **due** moduli `SHORTCUTS` paralleli (`utils/keyboardShortcuts.ts` usato da `Navbar.tsx` per gli shortcut globali; `constants/shortcuts.ts` **dead code, zero importazioni**) e un terzo sistema legacy `Keystrokes.register()` jQuery-delegated (`common/U.tsx`) usato da Navbar dropdown e ContextMenu del classic editor. Nessuna libreria di hotkey esterna installata (no `react-hotkeys-hook`, `mousetrap`, `tinykeys`).
- **30+ file diversi montano handler keyboard**: 1 handler globale Navbar (capture phase, ~13 shortcut), 1 handler scoped al wrapper di EditorV2 (`tabIndex=0`, 7 shortcut clipboard/undo), ~10 dialog/modal con `Escape`-to-close, ~10 input field con `Enter`/`Escape`/`Tab`/`Arrow*`, ~5 handler specifici di editor (Console `Cmd+L`, Jodie `Cmd+J`, GlobalSearch `Cmd+K`, Settings `Cmd+,`, DevMode `Ctrl+Shift+D`, JjtlDevEnv `Ctrl+S`/`Ctrl+Enter`/`F11`, ScriptExecution `F5`/`F10`).
- **React Flow built-ins quasi tutti overridden**: `deleteKeyCode={null}` (delete custom in EditorV2), `multiSelectionKeyCode="Shift"`, `zoomActivationKeyCode="Shift"`. Pan via mouse, non keystroke. Niente `selectionKeyCode`/`panActivationKeyCode` espliciti.
- **Cheatsheet utente esistente**: `ShortcutsReference.tsx` (modal aperto via `Cmd+?`) + `pages/settings/ShortcutsSettings.tsx` (display-only, "Custom shortcut configuration coming soon."). Entrambe sono **liste hardcoded** disallineate dal codice reale (es. settings page elenca `Cmd+F` search, `Cmd+D` duplicate, `Cmd+K` palette — gli ultimi due **non esistono**, il primo esiste solo nel ConsoleEntry).
- **Remap utente: assente.** `SettingsModal/UnifiedSettingsModal/sections/` non ha sezione Shortcuts. La settings page `pages/settings/ShortcutsSettings.tsx` mostra una nota "coming soon".

---

## 1. Librerie di keybinding installate

`grep -E '"(react-hotkeys|react-hotkeys-hook|mousetrap|hotkeys-js|tinykeys)"' frontend/package.json` → **zero match**.

Tutta la gestione è basata su listener nativi (`window`/`document.addEventListener('keydown'/'keyup')` o JSX `onKeyDown`). C'è inoltre un wrapper legacy proprietario `Keystrokes.register()` in `frontend/src/common/U.tsx:3439` che usa **jQuery delegated events** (`.on('keydown.<src>', selector, handler)`) su `#root` body.

---

## 2. React Flow keyboard props

`frontend/src/components/editor-v2/EditorV2.tsx:2921-2957`:

```tsx
<ReactFlow
    /* … */
    multiSelectionKeyCode="Shift"      // L2947 — Shift+click per multi-select
    selectionMode={SelectionMode.Partial}
    panOnDrag={[0, 1, 2]}              // mouse buttons left/middle/right (NON keystroke)
    zoomOnScroll={false}
    panOnScroll={false}
    zoomActivationKeyCode="Shift"      // L2953 — Shift+scroll per zoom (zoomOnPinch=true)
    preventScrolling={false}
    zoomOnPinch={true}
    deleteKeyCode={null}               // L2956 — DISABILITATO il delete RF built-in
    /* … */
>
```

| Prop | Valore | Default RF | Effetto |
|------|--------|-----------|---------|
| `multiSelectionKeyCode` | `"Shift"` | `Meta`/`Control` | Sostituisce il modificatore di multi-select. NB: l'app comunque consuma `Shift` per altre azioni nei nodes (vedi `graphElement.tsx`). |
| `zoomActivationKeyCode` | `"Shift"` | `Meta`/`Control` | Shift+scroll attiva zoom. `zoomOnScroll=false` significa che senza Shift lo scroll **non zooma**. |
| `deleteKeyCode` | `null` | `Backspace`/`Delete` | **Built-in disabilitato**. Il delete è custom: `EditorV2.tsx:1895` (`Delete`/`Backspace` → `deleteSelected()`). |
| `panActivationKeyCode` | (omesso) | `Space` | **Default RF: Space + drag pan**. Non sovrascritto. |
| `selectionKeyCode` | (omesso) | `Shift` | Default RF — overlap con `multiSelectionKeyCode`. |
| `disableKeyboardA11y` | (omesso) | `false` | RF mantiene navigazione tastiera nodes (Tab/arrow). |

---

## 3. Inventario keystroke

Ordinato per scope: **Global → Flow editor (M2/M1) → Classic editor → Modal/dialog → Input fields**.

### 3.1 Shortcut globali (window/document, capture phase)

| Tasto | Modificatori | Azione | File:line | Scope | Active editor only? | Note |
|-------|--------------|--------|-----------|-------|---------------------|------|
| `N` | Alt+Cmd | Context-aware NEW (Project / Metamodel / Class) | Navbar.tsx:908 | DASHBOARD/PROJECT/METAMODEL | No, basato su HashRouter+DOM probe | Alt+Cmd evita interceptions Chrome di Cmd+N |
| `N` | Alt+Cmd+Shift | New Model (PROJECT_EDITOR only) | Navbar.tsx:981 | PROJECT_EDITOR | No | |
| `S` | Cmd | Save Project / Save Profile | Navbar.tsx:995 | PROJECT/METAMODEL/PROFILE | No | |
| `W` | Alt+Cmd | Close Project / Profile | Navbar.tsx:1023 | PROJECT/METAMODEL/PROFILE | No | |
| `Q` | Alt+Cmd | Sign Out | Navbar.tsx:1053 | Sempre | No | |
| `M` | Alt+Cmd | New Metamodel (legacy alias di NEW context-aware) | Navbar.tsx:1072 | Sempre se progetto aperto | No | |
| `M` | Cmd+Shift | Toggle Advanced Mode | Navbar.tsx:1084 | Sempre | No | |
| `?` | Cmd+Shift | Open ShortcutsReference modal | Navbar.tsx:1096 | Sempre | No | letteralmente `Shift+/`, evento `?` |
| `Z` | Cmd | Undo (UndoAction) | Navbar.tsx:1107 | METAMODEL/PROJECT_EDITOR | No | |
| `Z` | Cmd+Shift | Redo Mac | Navbar.tsx:1115 | METAMODEL/PROJECT_EDITOR | No | |
| `Y` | Cmd | Redo Win | Navbar.tsx:1115 | METAMODEL/PROJECT_EDITOR | No | |
| `+`/`=` | Cmd | Zoom In (graph) | Navbar.tsx:1128 | METAMODEL/PROJECT_EDITOR | No | `matchesZoomIn` accetta `+` o `=` |
| `-` | Cmd | Zoom Out (graph) | Navbar.tsx:1136 | METAMODEL/PROJECT_EDITOR | No | |
| `0` | Cmd | Reset Zoom (graph) | Navbar.tsx:1144 | METAMODEL/PROJECT_EDITOR | No | |
| `B` | Cmd | Toggle Tree View | Navbar.tsx:1154 | Sempre | No | dispatch `JjodelEvents.TOGGLE_TREE_VIEW` |
| `,` | Cmd | Open Settings modal | SettingsModalContext.tsx:56 | Sempre | No | document listener bubble phase |
| `D` | Ctrl+Shift / Cmd+Shift | Toggle Dev Mode | DevModeContext.tsx:63 | Sempre | No | window listener bubble phase |
| `K` | Cmd/Ctrl | Focus Catalog search | Catalog.tsx:162 | DASHBOARD page | Catalog page only | `Cmd+K` è solo in Catalog, non è una palette globale |
| `J` | Cmd/Ctrl | Toggle Jodie chat ↔ code mode | Jodie.tsx:284 | Sempre | No | apre la finestra Jodie se chiusa |
| `F1` / `Cmd+/` | — / Cmd | Open Help drawer | HelpDrawer.tsx:88 | Sempre | No | window capture phase (Monaco intercept workaround) |
| `Escape` | — | Cancel pending edge (`isEdgePending.source = ''`) | U.tsx:3508 (Keystrokes.register) | Quando pending edge attivo | No | listener jQuery delegato su `#root`, **skippa events da `.Graph`** |

### 3.2 Flow editor (EditorV2 wrapper, `tabIndex=0`, scoped al div con focus)

Handler unico: `EditorV2.tsx:1888-1937`. Guard: skip se `event.target.tagName === 'INPUT' || 'SELECT'`.

| Tasto | Modificatori | Azione | File:line | Note |
|-------|--------------|--------|-----------|------|
| `Delete` | — | `deleteSelected()` (RF nodes/edges selezionati) | EditorV2.tsx:1895 | Sostituisce `deleteKeyCode` RF nullato |
| `Backspace` | — | `deleteSelected()` (alias di Delete) | EditorV2.tsx:1895 | |
| `Z` | Cmd/Ctrl | `handleUndo()` (history hook di EditorV2) | EditorV2.tsx:1900 | **Locale al flow editor**, NON è UndoAction Redux |
| `Z` | Cmd/Ctrl+Shift | `handleRedo()` | EditorV2.tsx:1906 | |
| `Y` | Cmd/Ctrl | `handleRedo()` | EditorV2.tsx:1906 | |
| `C` | Cmd/Ctrl | `copySelected()` (copia su clipboard interno) | EditorV2.tsx:1912 | `useHistory` hook |
| `X` | Cmd/Ctrl | `cutSelected()` | EditorV2.tsx:1918 | |
| `V` | Cmd/Ctrl | `pasteClipboard()` | EditorV2.tsx:1924 | |
| `A` | Cmd/Ctrl | Select all nodes+edges | EditorV2.tsx:1930 | `setNodes(... selected: true)` |

### 3.3 Classic editor (graphElement React tree, focus-within)

Handler: `graph/graphElement/graphElement.tsx:842-918`. Attaccato come `onKeyDown` JSX prop (riga 1441) e si attiva su `:focus-within` del nodo classic. Guard: `e.stopPropagation()` se target è `input`/`textarea`/`contenteditable`. Il selettore jQuery di `Keystrokes.register()` (vedi 3.4) **esclude eventi da `.Graph`**, quindi shortcut globali Navbar e ctxmenu Keystrokes NON si attivano dentro al classic; questo handler React è l'unico canale.

| Tasto | Modificatori | Azione | File:line | Note |
|-------|--------------|--------|-----------|------|
| `Delete` | — | Delete element/edge (con TRANSACTION) | graphElement.tsx:861, 868 | Logica diversa per node/edge/extends/reference/dependency |
| `D` | Shift | Duplicate element | graphElement.tsx:864 | |
| `R` | Shift | Delete (alias di Delete) | graphElement.tsx:865 | |
| `A` | Ctrl | `addChild("auto")` (class su package, literal su enum, ecc.) | graphElement.tsx:908 | **Conflitto con flow editor `Cmd+A` select all** se split mode |
| `R` | Ctrl | `addChild("reference")` | graphElement.tsx:909 | |
| `O` | Ctrl | `addChild("operation")` o `"object"` | graphElement.tsx:910 | |
| `L` | Ctrl | `addChild("literal")` | graphElement.tsx:911 | |
| `P` | Ctrl | `addChild("package")` o `"parameter")` | graphElement.tsx:912 | |
| `C` | Ctrl | `addChild("class")` | graphElement.tsx:913 | **Conflitto con flow editor `Cmd+C` copy** se split mode |
| `E` | Ctrl | `addChild("enumerator")` | graphElement.tsx:914 | |
| `Q` | Ctrl | `addChild("annotation")` | graphElement.tsx:915 | |
| `Escape` | — | Cancel pending edge anchor change | GraphDataElements.tsx:2481 (`LVoidEdge.onKeyDown_pendingEdge`) | Listener su `document.body`, attivato solo durante anchor following |

### 3.4 ContextMenu classic (jQuery delegated, `#root`, skip se target dentro `.Graph`)

Registrato via `Keystrokes.register('#root', 'ctxmenu', ...)` in `ContextMenu.tsx:710`. Implementazione: `U.tsx:3439-3537`. **NON si attiva dentro `.Graph`** (filter loop check `.classList.contains('Graph')` su event.target ancestors), quindi è di fatto attivo solo fuori dal canvas classic — ma **è attivo sopra il flow editor** perché EditorV2 non usa la classe `Graph`.

| Tasto | Modificatori | Azione | File:line | Note |
|-------|--------------|--------|-----------|------|
| `V` | Ctrl+Alt | `addViewKeybind()` (add view su selection) | ContextMenu.tsx:666 | `addViewSelf` o `addViewInstances` per className |
| `B` | Ctrl+Alt | `toggleMetrics` | ContextMenu.tsx:667 | |
| `T` | Ctrl | Toggle `isResized` (resize anchor) | ContextMenu.tsx:670 | |
| `E` | Ctrl | Extend class (set `isEdgePending`) | ContextMenu.tsx:676 | **Conflitto** con `addChild("enumerator")` di graphElement (focus diverso ma sovrapposto) |
| `Backspace` | Ctrl | Delete `modelElement` o `node` | ContextMenu.tsx:683 | |
| `Up` | Ctrl | `lnode.zIndex += 1` | ContextMenu.tsx:691 | |
| `Down` | Ctrl | `lnode.zIndex -= 1` | ContextMenu.tsx:697 | |
| `Escape` | — | Close ctx menu | ContextMenu.tsx:668 | |

### 3.5 ContextMenu flow editor

`EditorV2.tsx:1946-1971` — gestisce `onNodeContextMenu`/`onEdgeContextMenu` (mouse-only); il menu emerge come stato `contextMenu` chiuso da `onPaneClick`. **Nessun listener Escape esplicito sul ctx-menu del flow** (lo chiude il blur/onPaneClick). Vedi sezione 5.

### 3.6 Editor specifici (componenti dock o full-screen)

| Tasto | Modificatori | Azione | File:line | Quando attivo |
|-------|--------------|--------|-----------|---------------|
| `S` | Cmd/Ctrl | `handleSave()` (salva trasformazione JjTL) | JjtlDevelopmentEnv.tsx:539 | JjTL editor montato |
| `Enter` | Cmd/Ctrl | Execute transformation | JjtlDevelopmentEnv.tsx:544 | JjTL editor + valid + !executing |
| `V` | Cmd/Ctrl+Shift | Validate transformation | JjtlDevelopmentEnv.tsx:551 | JjTL editor montato |
| `F11` | — | Toggle fullscreen JjTL | JjtlDevelopmentEnv.tsx:556 | JjTL editor montato |
| `Escape` | — | Exit fullscreen JjTL | JjtlDevelopmentEnv.tsx:561 | `isEditorFullscreen` |
| `F5` / `Cmd+Enter` | — / Meta | Run all (script execution) | ScriptExecutionWindow.tsx:482 | `isOpen && !running` |
| `F10` / `Cmd+Shift+Enter` | — / Meta+Shift | Step (script execution) | ScriptExecutionWindow.tsx:488 | `isOpen && !running` |
| `Escape` | — | Close ScriptExecutionWindow | ScriptExecutionWindow.tsx:479 | `isOpen` |
| `L` | Cmd/Ctrl | Clear console | Console.tsx:831 | Console montata (handler su `document`) |
| `S` | Cmd/Ctrl | Save (in EditorFullscreenModal — Monaco) | EditorFullscreenModal.tsx:62 | Modal aperto |
| `Escape` | — | Close EditorFullscreenModal | EditorFullscreenModal.tsx:59 | Modal aperto |
| `Z` | Cmd/Ctrl | **Locale** undo (InteractivePathCanvas) | InteractivePathCanvas.tsx:234 | Canvas aperto. **Capture phase** → sovrascrive Navbar Cmd+Z |
| `Z` | Cmd/Ctrl+Shift | **Locale** redo | InteractivePathCanvas.tsx:238 | |
| `Y` | Cmd/Ctrl | **Locale** redo | InteractivePathCanvas.tsx:242 | |
| `Delete`/`Backspace` | — | Remove path point (con hover) | InteractivePathCanvas.tsx:155 | Canvas aperto |
| `Escape` | — | Close ctx menu / deselect node | InteractivePathCanvas.tsx:164 | Canvas aperto |
| `Shift` | (keydown/keyup) | Toggle snap mode | InteractivePathCanvas.tsx:139,142 | Canvas aperto |

### 3.7 Editor V2 components / popup (scoped, dispone di dismiss `Escape` e `Arrow*`/`Enter` per option list)

Pattern uniforme: `Escape` → `onClose/onCancel`, `ArrowUp`/`ArrowDown` per navigation, `Enter` per select.

| File | `Escape` | `Arrow*`/`Enter` |
|------|---------|------------------|
| `EdgeTypePopup.tsx:106,137` | sì (window) | sì |
| `InlineTypeSelect.tsx:51,80` | sì (document) | sì |
| `InlineEnumSelect.tsx:51,80` | sì (document) | sì |
| `M1ReferencePopup.tsx:75,104` | sì (document) | sì |
| `ColorSchemeSelector.tsx:70` | sì (document) | — |
| `NodeProblemOverlay.tsx:96` | sì (window capture) | — |
| `editor-v2/Toolbar.tsx:228` | sì (notation dropdown) | — |

### 3.8 Modal / dialog Escape-to-close (pattern uniforme)

Lista non esaustiva — tutti registrano `keydown` e chiudono su `Escape`:

`HelpDrawer.tsx:104` · `UnifiedSettingsModal.tsx:100` · `NotificationCenter.tsx:59` · `ShortcutsReference.tsx:42` · `BottomDrawer.tsx:35` · `GlobalDrawer.tsx:46` · `MegamodelContextMenu.tsx:48` · `MegamodelView.tsx:842` (+ `Enter`/`F2`/`Delete` per node selezionato) · `PolymetricView.tsx:215` · `ConfirmDialog.tsx:40` · `CreateProjectDialog.tsx:47` · `NewViewpointDialog.tsx:49` · `ShareProjectModal.tsx:35` · `AddTagDialog.tsx:47` · `EnvGenWizardModal.tsx:57` · `EdgeMarkerEditorModal.tsx:115` · `SyntaxErrorModal.tsx:42` · `JjtlAlertDialog.tsx:55` · `JjtlConfirmDialog.tsx:31` · `JjtlInputDialog.tsx:86,99,113,138,149` · `JjtlPromptDialog.tsx:106,117` · `NewTransformationDialog.tsx:146` · `ExecuteTransformationDialog.tsx:150` · `GrammarDiagramModal.tsx:71` · `ExecutionErrorDialog.tsx:72` · `ProviderConfigModal.tsx:119` · `ExplainModal.tsx:221` · `AboutDialog.tsx:30` · `TreeViewSidebar.tsx:70` · `TreeViewContent.tsx:123` · `ErrorPortal.tsx:38` · `ExportImportMenu.tsx`. Pattern coerente.

### 3.9 Input/textarea inline (Enter/Escape per commit/cancel)

Pattern ricorrente nei nodes/inputs: `Enter` commit, `Escape` cancel, `Tab` next field.

`ClassNode.tsx:125,127,161,163` · `EnumNode.tsx:57,59,104,106` · `PackageNode.tsx:50,52` · `ObjectNode.tsx:210,212,308-325` (+ `Tab`) · `M1PropertiesPanel.tsx:64` · `ProjectEditor.tsx:562,1792,1820,2006,2024,2164,2182` · `JjScriptInput.tsx:104+` (+ `Arrow*` history, `Tab` autocomplete) · `ConsoleInput.tsx:112-146` (+ `Arrow*` history, `Tab` autocomplete, `Cmd/Ctrl+F` search) · `ConsoleEntry.tsx:113` (`Cmd/Ctrl+F` search-in-result) · `Jodie/CommandPalette.tsx:93+` · `Jodie/ChatInput.tsx:330+` (backtick toggle code/chat su empty) · `Toggle.tsx:126`, `VerticalToggle.tsx:35` · `CollapsibleSection.tsx:65`. Tutti scoped al singolo input.

### 3.10 RightPanel "click+Enter/Space" su card (a11y)

`RightPanel.tsx:77,88,99,110` (Enter/Space → navigate), `ActivityItem.tsx:89`, `GroupedActivityItem.tsx:88`, `StatCard.tsx:20`, `Catalog Project.tsx:418`. Pattern di accessibility, nessun shortcut.

---

## 4. Pattern di guardia ricorrenti

| Pattern | File campione | Coerenza |
|---------|---------------|----------|
| **Skip se input/textarea/contenteditable** | Navbar.tsx:858 (`isInputField`), EditorV2.tsx:1890-1891 (solo INPUT/SELECT — **incoerente**, manca TEXTAREA), graphElement.tsx:846-851 (`stopPropagation`), Jodie.tsx:289 (`closest('input,textarea,[contenteditable],.monaco-editor')`) | ⚠️ Variabile: tre forme distinte (`isContentEditable` vs check `closest`, INPUT/SELECT vs INPUT/TEXTAREA, `tagName` vs `closest`). |
| **Skip se target dentro `.Graph`** | U.tsx:3493-3496, 3514-3517 (Keystrokes.register) | Specifico al sistema Keystrokes legacy. Esclude classic editor da listener delegati. |
| **Capture phase** | Navbar.tsx:1164-1165, HelpDrawer.tsx:97, BottomDrawer.tsx:38, ExplainModal.tsx:223, NodeProblemOverlay.tsx:103, InteractivePathCanvas.tsx:248, EditorFullscreenOverlay.tsx:59 | Usato per anticipare Monaco e altri listener bubble. Documentato nel CLAUDE.md (Monaco F1 workaround). |
| **Bubble phase** | La maggioranza dei modal/dialog | Default. |
| **`event.preventDefault() + stopPropagation()`** | Navbar.tsx:877-879 (anche `stopImmediatePropagation`), JjtlDevelopmentEnv, EditorV2 | Usato selettivamente; Navbar lo applica preemptive su tutto un set di shortcut per bloccare browser defaults. |
| **`isOpen` guard nel useEffect** | Tutti i modal Escape-to-close | Coerente — listener registrato solo quando il modal è aperto. |

**Disallineamenti:**
- `EditorV2.tsx:1890-1891` controlla solo `INPUT` e `SELECT`. Un `<textarea>` dentro al flow non è coperto: scrivere "v" in un textarea con focus dentro al flow editor (raro ma possibile) **NON triggera** paste — perché `tagName === 'INPUT'` è false, ma perché il listener è sul `<div>` wrapper dell'editor e il textarea cattura prima.
- `Navbar.tsx:858` usa `isContentEditable` che è canonico, ma EditorV2 no.
- I check sono duplicati e non centralizzati: nessun helper `isTypingInField(event)`.

---

## 5. Punti di disallineamento / debito

1. **Due `SHORTCUTS` paralleli, uno è dead code.**
   - `frontend/src/utils/keyboardShortcuts.ts:117` — usato attivamente da `Navbar.tsx`.
   - `frontend/src/constants/shortcuts.ts:11` — **zero importazioni nel frontend** (`grep "constants/shortcuts"` → 0 hits, `grep "getShortcut"` → solo definizione + `JjtlToolbar.tsx` ma quello è una funzione locale `getShortcutHint`, non collegata).
   - Entrambi pretendono di essere "single source of truth". Da consolidare/rimuovere.

2. **Tre sistemi paralleli di registrazione handler.**
   - **(a)** Listener globale Navbar (capture phase, `matchesShortcut`/`SHORTCUTS`).
   - **(b)** `Keystrokes.register()` jQuery delegated su `#root` (legacy, usato da `ContextMenu.tsx` + `Navbar.tsx:1478` per i `keystroke:` dei dropdown items).
   - **(c)** `useEffect` ad-hoc in 30+ componenti.

   Risultato: `Cmd+Z` ha **3 implementazioni** sovrapposte: (a) Navbar UndoAction Redux, (b) EditorV2 history hook locale (non Redux), (c) InteractivePathCanvas history locale. Quale vince dipende da focus + capture/bubble + ordine di registrazione.

3. **Conflitti tra flow editor (Cmd+A/Cmd+C) e classic editor (Ctrl+A/Ctrl+C).**
   `EditorV2.tsx:1930` (Cmd+A select all) e `graphElement.tsx:908` (Ctrl+A addChild auto): in modalità split, l'intento dell'utente cambia con focus. Funzionalmente sono isolati (graphElement usa `stopPropagation` e l'EditorV2 listener è scoped al wrapper `tabIndex=0`), ma per l'utente la stessa scorciatoia ha azioni opposte tra i due lati.

4. **`Cmd+E` dual-bound nel classic.**
   `graphElement.tsx:914` → `addChild("enumerator")` (focus su node).
   `ContextMenu.tsx:682` (Keystrokes.register) → "Extend class" su selection.
   Entrambi nello stesso editor classic. Quale vince dipende dalla sorgente dell'evento (target dentro `.Graph` → graphElement; target fuori `.Graph` su `#root` → ctxmenu). Documentazione utente: zero.

5. **Cheatsheet disallineato dal codice.**
   - `pages/settings/ShortcutsSettings.tsx:8` lista `Ctrl+F` "Search" come globale → **non esiste come shortcut globale** (esiste solo in `ConsoleEntry.tsx:113` per search-in-result).
   - `pages/settings/ShortcutsSettings.tsx:16` lista `Ctrl+D` "Duplicate" → **non esiste**. La duplicazione canvas è `Shift+D` su classic (graphElement.tsx:864) e `onDuplicateSelected` toolbar nel flow (no shortcut).
   - `pages/settings/ShortcutsSettings.tsx:20` lista `Cmd+K` "Command palette" → esiste solo in `Catalog.tsx:162` come focus search della catalog page; **non è una palette globale**.
   - `pages/settings/ShortcutsSettings.tsx:13` lista `Scroll` "Zoom in/out" → fuorviante: nel flow editor `zoomOnScroll=false`, serve `Shift+scroll`.
   - `pages/settings/ShortcutsSettings.tsx:12` lista `Space + Drag` "Pan canvas" → effettivamente attivo (RF default `panActivationKeyCode=Space`), non documentato altrove nel codice.
   - `ShortcutsReference.tsx` (modal `Cmd+?`) **non elenca**: `Cmd+J` (Jodie), `Cmd+K` (Catalog), `Cmd+,` (Settings), `Cmd+L` (Console clear), `F1` (Help), `Cmd+B` (Tree view), `Ctrl+Shift+D` (DevMode), `Delete`/`Backspace`/`Cmd+C`/`Cmd+V`/`Cmd+X`/`Cmd+A` del flow editor, classic editor `Shift+D`/`Ctrl+letter`, JjTL `Ctrl+S`/`Ctrl+Enter`/`F11`, ScriptExecution `F5`/`F10`. **Copertura cheatsheet: ~30%.**

6. **`Cmd+Z` history del flow editor è LOCALE, non Redux.**
   `useHistory` hook (`hooks/useHistory.ts`) gestisce snapshot solo dei nodes/edges di RF. L'`UndoAction` Redux di Navbar (riga 1110) usa il sistema `joiner` Redux. Sono **due history paralleli**. Se l'utente sposta un node nel flow + cambia un attributo via Properties panel, premere `Cmd+Z` quando il flow ha focus undo solo lo spostamento. Non c'è una merge-strategy.

7. **EditorV2 guard incompleta su INPUT/TEXTAREA/contenteditable.**
   `EditorV2.tsx:1890-1891` controlla solo `INPUT` e `SELECT`. Mancano `TEXTAREA`, `[contenteditable]`. Nei nodes (es. `ClassNode.tsx`) il commit avviene tipicamente su `<input>`, ma campi multilinea o JSX-RTE potrebbero perdere il delete/copy.

8. **ContextMenu del flow editor non ha listener `Escape`.**
   `EditorV2.tsx:1973` chiude il context menu solo su `onPaneClick`. Per chiudere senza cliccare sul pane, l'utente deve cliccare altrove. UX inconsistente con tutti gli altri ctx menu del codebase.

9. **`Cmd+,` apre Settings ma non è documentato in `ShortcutsReference`.**
   `SettingsModalContext.tsx:56`. Nessuna riga in cheatsheet.

10. **`Ctrl+Shift+D` apre Dev Mode ma non è user-facing.**
    `DevModeContext.tsx:63`. Pattern internamente usato ma non documentato; non è un debt strict, ma è una back-door non scoperta.

11. **`Cmd+Shift+M` ha valore "ADVANCED_MODE" e collide concettualmente con `Cmd+Shift+B` "view.toolbar"** (constants/shortcuts.ts dead code, ma se viene riusato un giorno).

---

## 6. Cheatsheet / documentazione esistente

| File | Tipo | Coverage |
|------|------|----------|
| `frontend/src/components/ShortcutsReference/ShortcutsReference.tsx` | Modal aperto via `Cmd+?` (Navbar.tsx:1099 → `setShowShortcutsReference(true)`). Tabs: All / Dashboard / Project / Metamodel / Profile / Global. | Solo i 13-14 shortcut "globali" definiti in `utils/keyboardShortcuts.ts` e qualche ridondanza. **NON copre** flow editor clipboard/RF, classic editor `Ctrl+letter`, JjTL/JjScript editor, Console, Jodie, Settings, DevMode, HelpDrawer. |
| `frontend/src/pages/settings/ShortcutsSettings.tsx` | Settings page (display-only). | Lista hardcoded di 12 shortcut, **disallineata dal codice** (vedi 5.5). Banner "Custom shortcut configuration coming soon." |
| `frontend/src/components/editors/Console.tsx:554` | Slash command `/shortcuts` nella console. | Stampa testo hardcoded con shortcut della console (Enter/Shift+Enter, Tab, Cmd+L, Esc, ecc.). Self-contained, accurato per la console. |
| `frontend/src/components/editors/Console/CollapsibleShortcuts.tsx` | UI section "Code shortcuts". | **NON sono keyboard shortcut** — sono code snippets JjEL/JS (`data.classes`, `JSON.stringify(...)`). Naming fuorviante. |

Nessun file Markdown in `docs/` o `frontend/docs/` documenta keystroke a livello sistema.

---

## 7. Settings / preferences remap

**Assente.**

- `frontend/src/components/Settings/UnifiedSettingsModal/sections/` ha 7 sezioni (`Appearance`, `Profile`, `Notifications`, `Security`, `Providers`, `Prompts`, `Advanced`). **Nessuna `Shortcuts`.**
- `frontend/src/pages/settings/ShortcutsSettings.tsx:53-57` mostra esplicitamente "Custom shortcut configuration coming soon."
- Nessun localStorage key, redux state, o user preference è collegato a remap di shortcut.

---

## 8. Interazione con il classic editor

Il classic editor (`graph/graphElement/graphElement.tsx`, `common/DV.tsx`, viste basate su jsxString) ha tre canali di keystroke:

1. **`graphElement.onKeyDown` React JSX prop** (riga 1441), attivato da `:focus-within` sul nodo classic. Implementa Delete/Shift+D/Shift+R + Ctrl+letter per addChild ([A,R,O,L,P,C,E,Q]).
2. **`Keystrokes.register('#root', 'ctxmenu', ...)`** in `ContextMenu.tsx:710` con jQuery delegated su `document.body`. **Filtro esplicito skip se target ancestors hanno `.Graph`** (U.tsx:3493-3496). Quindi attiva ctx-menu shortcut (Ctrl+Alt+V/B, Ctrl+T/E/Backspace/Up/Down) solo **fuori** dal canvas classic.
3. **`LVoidEdge.onKeyDown_pendingEdge`** su `document.body` durante anchor-following (ascolta `Escape` per cancel).

Non ci sono keystroke nei jsxString templates di `DV.tsx`/`UX*` (volutamente non investigati). `Control.tsx` (`forEndUser/`) e `MetamodelTab.tsx`/`ModelTab.tsx` non hanno handler keyboard propri.

**Side effect del filtro `.Graph`**: gli shortcut globali Navbar sono registrati su `window`/`document` capture phase, quindi **funzionano** anche su elementi `.Graph`; mentre i ctxmenu shortcut Keystrokes (delegated su `#root`) **non funzionano** dentro `.Graph` per design. Il flow editor non usa la classe `.Graph`, quindi tutti i ctxmenu shortcut (Ctrl+T/E/Backspace/Up/Down/Ctrl+Alt+V/B) sono **attivi** anche sopra il flow — ma il flow ha i suoi handler concorrenti.

---

## 9. Aree non investigate

- **jsxString templates** in `DV.tsx`, `common/UX*.tsx`, view templates di viewpoint custom. Per scope.
- **Monaco editor internals** (Cmd+P/F1/Ctrl+Space/ecc.). Gestiti dalla libreria, non sono shortcut Jjodel.
- **`rc-dock` keystroke** (drag tab, ecc.). Non risultati nel grep `keydown`.
- **react-router-dom** keystroke browser-level (back/forward). Non gestiti nel codebase.
- **PDF viewers, sweetalert, react-select internals** — out of scope.
- **`jjodel-docs`** sito esterno (non nel repo frontend).
- **Eventuali binding via `@xyflow/react` `nodeKeyDown`/`edgeKeyDown` props** — `EditorV2.tsx` non li usa.

---

## Appendice: comandi grep eseguiti e numero risultati

| Comando | Risultati |
|---------|-----------|
| `grep -E '"(react-hotkeys\|react-hotkeys-hook\|mousetrap\|hotkeys-js\|tinykeys)"' frontend/package.json` | 0 |
| `grep -rn -E "addEventListener\(\s*['\"]key(down\|up\|press)['\"]" src/` | 56 hits su 50 file |
| `grep -rn -E "on(KeyDown\|KeyUp\|KeyPress)\s*=" src/` | 64 hits su 38 file |
| `grep -rn -E "\b(deleteKeyCode\|multiSelectionKeyCode\|selectionKeyCode\|panActivationKeyCode\|zoomActivationKeyCode\|disableKeyboardA11y)\b" src/` | 3 (tutti in `EditorV2.tsx`) |
| `grep -rn -E "\.key\s*===\s*['\"][A-Za-z0-9]" src/` | 190 |
| `grep -rn -E "\b(metaKey\|ctrlKey\|shiftKey\|altKey)\b" src/` | 88 |
| `grep -rni -E "(useShortcut\|useHotkey\|useKeyboard\|useKeybind)" src/` | 0 (nessun hook custom) |
| `grep -rn -E "(SHORTCUTS\|matchesShortcut\|matchesZoomReset)" src/` | 41 |
| `grep -rni -E "(shortcut\|hotkey\|cheat[- ]?sheet\|key[- ]?bindings)" src/` | ~70 (inclusi commenti / doc / variabili non-keystroke) |
| `grep -rn "Keystrokes\.register" src/` | 2 (`ContextMenu.tsx:710`, `Navbar.tsx:1478`) |
| `grep -rn "constants/shortcuts" src/` | 0 (file dead code) |
