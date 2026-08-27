# Discovery — l'undo di editor-v2 per i gesti di disposizione

**Data**: 2026-08-24
**Fase**: 1 (read-only), corsia RC-3, effort xhigh
**Prompt**: «undo in editor-v2, fronte proprio. Snapshot a inizio gesto, write-back per resolver,
un solo undo per ⌘Z» (2026-08-24)
**Base di partenza**: `docs/reports/2026-08-24-lir-layout-slice1b.md` §10.4, R-LAY-14..18
**Stato**: hard stop. Nessun file di codice toccato.

---

## 0. Sommario esecutivo — la misura contraddice l'ipotesi del prompt

Il prompt ipotizzava un **doppio undo**: ⌘Z che fa partire insieme la storia di sessione di
editor-v2 e l'`UndoAction` del D-layer, con rimedio `stopPropagation()` nel gestore React.

**La misura dice il contrario, ed è peggio.** Il listener di `Navbar.tsx` non è registrato in
bolla su `document` (`:198` è un'altra cosa: la chiusura su `Escape` del menu Documenti): è
registrato **in cattura su `window` e su `document`** (`Navbar.tsx:1278-1279`), e per ⌘Z chiama
`event.stopImmediatePropagation()` a `Navbar.tsx:962-964`, **prima** di qualunque logica di
contesto. Un `keydown` intercettato in cattura su `window` — il primo gradino del percorso — con
`stopImmediatePropagation` non raggiunge mai `document`, mai il root container di React, mai il
`<div className="editor-v2">`.

Conseguenza: **il gestore React `onKeyDown` di `EditorV2.tsx:2499` non viene mai eseguito per
⌘Z e ⌘⇧Z**. Non c'è nessun doppio undo. C'è una cattura totale: da tastiera, in editor-v2, l'undo
di sessione è **irraggiungibile**, e l'unica cosa che scatta è l'`UndoAction` del D-layer. La
storia di sessione è raggiungibile **solo** dai due pulsanti della toolbar (`:3956-3957`).

E l'`UndoAction` che scatta, in una sessione di editor-v2, non fa quello che sembra — per una
ragione diversa da quella scritta nel prompt (§1.4): `U.userHasInteracted` ha **un solo
scrittore in tutto il repo**, il drop sulla tela classica (`MetamodelTab.tsx:164`), che il
percorso di editor-v2 non attraversa mai. Resta `false`, quindi `isRelevantChangeCheck`
(`reducer.ts:1277`) ritorna sempre `false`, quindi `shouldMerge` è sempre vero e **ogni delta
della sessione si fonde nel primo**. Un ⌘Z riporta il progetto all'inizio della sessione.
Questo, e non lo sfasamento di uno, è ciò che si vede a schermo quando «l'undo non funziona».

I due difetti del §10.4 del LIR restano veri e restano da correggere (§2, §3). Ma il terzo punto
del prompt — «un solo undo per ⌘Z» — **non si può risolvere dentro il perimetro dichiarato**:
`stopPropagation()` in un gestore che non viene mai chiamato è inerte. Serve una decisione di
Alfonso (§7, domanda A).

---

## 1. Il ⌘Z: chi lo prende, in che ordine, e cosa succede al D-layer

### 1.1 Il gestore di editor-v2 — bolla, su un `<div>` sotto il root React

`EditorV2.tsx:3937` monta il pannello con `tabIndex={0} onKeyDown={onKeyDown}`. È un gestore
React sintetico, quindi in bolla, delegato dal root container (React 18 non attacca più su
`document`: attacca sul container passato a `createRoot`, che sta **dentro** `document`).

I due rami interessati:

```
EditorV2.tsx:2511    if (isMod && event.key === 'z' && !event.shiftKey) {
EditorV2.tsx:2512        event.preventDefault();
EditorV2.tsx:2513        handleUndo();
EditorV2.tsx:2517    if (isMod && ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
```

Nessun `stopPropagation()`, come dice il prompt. Ma è irrilevante (§1.2).

**Difetto collaterale misurato, non nel prompt**: al `:2517` il ramo di redo confronta
`event.key === 'z'` **con lo shift premuto**. Su ⌘⇧Z il browser riporta `event.key === 'Z'`
(maiuscola), quindi quel ramo non può mai matchare; su Mac resta solo ⌘Y, che non è la scorciatoia
di redo di sistema. Il redo da tastiera è rotto anche a monte della cattura. Il ramo di undo al
`:2511` non ha il problema (`'z'` minuscola senza shift è corretto).

### 1.2 Il gestore di `Navbar` — cattura su `window` **e** su `document`

```
Navbar.tsx:1278    window.addEventListener('keydown', handleKeyDown, true);   // capture
Navbar.tsx:1279    document.addEventListener('keydown', handleKeyDown, true); // capture
```

Il corpo, ai `:955-965`:

```
Navbar.tsx:956    const isCmdOnlyShortcut = !event.altKey && (key === 'S' || key === 'Z' || key === 'Y' || ...)
Navbar.tsx:961    if (isAltShortcut || isCmdOnlyShortcut || isHelpShortcut) {
Navbar.tsx:962        event.preventDefault();
Navbar.tsx:963        event.stopPropagation();
Navbar.tsx:964        event.stopImmediatePropagation();
```

`key` è `event.key.toUpperCase()` (`:954`), quindi sia ⌘Z sia ⌘⇧Z cadono in `'Z'`. La guardia è
`if (modKey && !isInputField)` (`:951`), con `isInputField` vero solo per `INPUT`, `TEXTAREA` e
`isContentEditable` (`:941`): il `<div className="editor-v2">` non è nessuno dei tre.

`window` è il primo gradino della fase di cattura. `stopImmediatePropagation()` lì ferma anche il
secondo listener della stessa `Navbar` su `document`, e ferma la discesa dell'evento verso il
target. **Il root container di React non riceve nulla.**

Poi, più in basso nello stesso gestore:

```
Navbar.tsx:1189    if (context === 'METAMODEL_EDITOR' || context === 'PROJECT_EDITOR') {
Navbar.tsx:1190        if (matchesShortcut(event, SHORTCUTS.UNDO)) {
Navbar.tsx:1194            UndoAction.new(1, user?.id, false).commit();
```

Esito: **«doppio undo» → no. «Undo di sessione non raggiungibile da tastiera» → sì.**

### 1.3 Il contesto rilevato, e che `Navbar` sia montata

`detectCurrentContext()` (`utils/keyboardShortcuts.ts:31-64`) è puramente DOM+hash:

- `path.includes('/project')` è vero sulla rotta `#/project?id=...`;
- `METAMODEL_EDITOR` richiede `.GraphContainer`, `[data-context="metamodel-editor"]` o `.Graph`
  nel DOM. editor-v2 è montato da `EditorSwitch.tsx:116,134`, **non** da `MetamodelTab`, quindi
  con la sola editor-v2 aperta il selettore non trova nulla e il ritorno è `PROJECT_EDITOR`.

Entrambi i valori entrano nel ramo `:1189`. La distinzione non cambia nulla.

`Navbar` è montata: la rotta `project` (`App.tsx:136`) rende `ProjectPage` →
`ProjectConnected`/`ProjectComponent` (`pages/Project.tsx:80,116`) → `<Dashboard active='Project'>`
→ `Dashboard` (`Dashboard.tsx:651-655`) sceglie `ProjectDashboard`, che rende `<Try><Navbar /></Try>`
a `Dashboard.tsx:631`. Il `<Navbar />` di `App.tsx:196` è dentro un blocco commentato
(`App.tsx:190-206`) e non conta.

### 1.4 Cosa fa oggi un ⌘Z dopo un drag, nel D-layer

Il prompt attribuisce alla riga `reducer.ts:1210` la fusione della geometria. La riga esiste:

```
reducer.ts:1210    if (!shouldMerge && (delta.vertexs || delta.graphvertexs || delta.graphelements
                       || delta.edgepoints || delta.edges || delta.graphs)) shouldMerge = true;
```

`git log -L 1210,1210` la data al **2025-01-29, `cec370847`**, messaggio di commit `.` — nessuna
motivazione registrata.

**Ma non è quella riga a fondere un drag.** `vertexs`, `graphvertexs`, `graphelements`,
`edgepoints`, `edges`, `graphs` sono **array di puntatori di primo livello** dello stato
(`redux/store.tsx:123-125`): cambiano quando un vertice nasce o muore, non quando cambia la sua
`x`. Il delta di un drag vive sotto `idlookup`, quindi `delta.vertexs` è assente e la riga 1210
non scatta. Lo stesso vale per la scrittura a dizionario di R-LAY-14 (`layoutByViewpoint` è un
campo del `DVertex` dentro `idlookup`).

A decidere è `isRelevantChangeCheck` (`reducer.ts:1274-1286`), via `shouldMerge = !isRelevantChange`
(`:1208`):

```
reducer.ts:1277    if (!U.userHasInteracted) return false;
reducer.ts:1278    if (pastDelta && delta.timestamp - pastDelta.timestamp < mergeTolerance) return false;
reducer.ts:1279    if (!statehistory.globalcanundostate) return false;
```

`mergeTolerance = U.UpdatingTimer * 1.5 = 450 ms` (`common/U.tsx:176`).

E qui sta il fatto nuovo. **`U.userHasInteracted` ha un solo scrittore in tutto `frontend/src`**:

```
MetamodelTab.tsx:163    if (!U.isProjectModified) {
MetamodelTab.tsx:164        U.isProjectModified = U.userHasInteracted = true;
```

cioè il gestore di drop della tela **classica**. Dichiarato nel default a `common/U.tsx:210`
(`false`). Controllo positivo del grep: la stessa ricerca su `isProjectModified` restituisce dieci
siti (`ProjectEditor.tsx:486,493`, `SaveManager.ts:34`, `Navbar.tsx:496,519`, …), quindi la
ricerca ha segnale e la singolarità di `userHasInteracted` è un risultato, non un silenzio.

Una sessione di editor-v2 che non passi da un drop sulla tela classica lascia
`U.userHasInteracted === false` per sempre. Quindi `isRelevantChangeCheck` ritorna sempre `false`,
`shouldMerge` è sempre `true`, e **ogni delta si fonde nel delta precedente**: la storia undoable
del D-layer non guadagna mai un passo nuovo dopo il primo. `UndoAction.new(1)` disfa quell'unico
delta accumulato, cioè riporta indietro tutta la sessione in un colpo.

`statehistory.globalcanundostate` invece si alza al primo `mouseup` sul documento
(`reducer.ts:1436-1438`), quindi non è la causa; il suo secondo scrittore (`App.tsx:193`) è dentro
il blocco commentato.

**Nota di metodo (§5 di CLAUDE.md).** §1.1-1.3 e §1.4 sono lettura statica su specifica DOM
deterministica e su codice non ambiguo, non una misura a runtime. La prova a schermo che le
separa è già nel protocollo di verifica del prompt, prova 4: rinomina un attributo, sposta un
nodo, ⌘Z. Se sparisce anche la rinomina — o sparisce mezza sessione — vale quanto scritto qui.
Se si disfa solo lo spostamento, questo report è sbagliato e va rifatto.

**Fuori perimetro, dichiarato**: `reducer.ts:1210`, `isRelevantChangeCheck`, `U.userHasInteracted`
sono core. Questo report li **misura e li dichiara**, non propone di toccarli.

---

## 2. Snapshot a inizio gesto

### 2.1 I call site di `takeSnapshot`

23 chiamate a `takeSnapshot()` in `EditorV2.tsx` (più la destrutturazione al `:933` e le
dipendenze). **Una sola** riguarda i gesti di disposizione:

```
EditorV2.tsx:3489    if (hasDragEnd || hasResize) {
EditorV2.tsx:3490        takeSnapshot();
```

dentro `handleNodesChange` (`:3458`). `hasDragEnd` è `{type:'position', dragging:false}`
(`:3477-3479`), `hasResize` è `{type:'dimensions', resizing !== undefined}` (`:3484-3486`).
Entrambi arrivano a gesto **concluso** o **in corso**, mai prima. Gli altri 22 call site sono
gesti puntuali (creazione, delete, paste, allineamenti, `resetNodeSize`, …) dove lo snapshot
pre-azione è già corretto perché la chiamata precede la mutazione: **non vanno toccati**.

### 2.2 `onNodeDragStart` — libero, e copre la multi-selezione

Controllo positivo eseguito: `command grep -rn "onNodeDragStart" frontend/src` → **exit 1, zero
occorrenze**; lo stesso comando su `getActiveLayoutKey` restituisce i call site noti, quindi la
ricerca ha segnale. `onNodeDragStop` è ugualmente assente: oggi il drag è gestito solo dai
`changes` di `onNodesChange`.

La prop esiste in `@xyflow/react` **12.10.2** (versione confermata da
`node_modules/@xyflow/react/package.json`): dichiarata in `types/component-props.d.ts:63` e
inoltrata allo `StoreUpdater` (`index.js:3606`).

Il punto decisivo per la multi-selezione, in `@xyflow/system`:

```
system/index.js:2187    if (dragItems.size > 0 && (onDragStart || onNodeDragStart || (!nodeId && onSelectionDragStart))) {
system/index.js:2193        onDragStart?.(...)
system/index.js:2194        onNodeDragStart?.(event.sourceEvent, currentNode, currentNodes);
system/index.js:2196        if (!nodeId) onSelectionDragStart?.(event.sourceEvent, currentNodes);
```

`onNodeDragStart` è chiamata **una sola volta per gesto** e **in entrambi i casi**: trascinamento
di un nodo (anche se appartiene a una selezione multipla — `currentNodes` contiene tutta la
selezione) e trascinamento del riquadro di selezione (`nodeId` assente). Non serve registrare
anche `onSelectionDragStart`.

Il `<ReactFlow>` è aperto a `EditorV2.tsx:3815`; `onNodesChange={handleNodesChange}` al `:3818`.

### 2.3 Resize — il primo `resizing: true` per gesto

`NodeResizer` è usato in `nodes/ClassNode.tsx`, `nodes/PackageNode.tsx`, `nodes/EnumNode.tsx`,
`nodes/ObjectNode.tsx` (più citazioni in `jjomTransformers.ts`, `useJjomSync.ts`, `irStyle.ts`,
`IRNodeContent.tsx`). Quattro componenti: agganciare `onResizeStart` significa quattro siti e
quattro percorsi verso `takeSnapshot` attraverso il context — sconsigliato, come dice il prompt.

L'alternativa già disponibile in `handleNodesChange`: il **primo** change
`{type:'dimensions', resizing: true}` di ogni gesto. La distinzione fra resize utente e
auto-misurazione di React Flow è già codificata e commentata ai `:3481-3486` (`resizing !== undefined`
per l'utente, `undefined` per l'auto-misurazione), e i change con `resizing !== undefined` sono
esplicitamente esentati dal dedup e dal rate-limit (`:3660`). La guardia è un `useRef<Set<string>>`
o un `useRef<boolean>` alzato al primo `resizing === true` e azzerato all'arrivo di
`resizing === false`.

Nota: `hasResize` al `:3484` è vero **sia** durante (`true`) **sia** alla fine (`false`) del gesto,
quindi lo snapshot attuale al `:3490` viene preso più volte per gesto di resize — un secondo
sfasamento, che la guardia chiude insieme al primo.

### 2.4 Cosa cambia togliendo il `takeSnapshot()` del `:3490`

È l'unico call site che copre drag e resize. Toglierlo senza sostituirlo lascerebbe i due gesti
fuori dalla storia. Le due sostituzioni di §2.2 e §2.3 lo coprono per intero, prima della
mutazione. Nessun altro consumatore dipende da quella chiamata: `takeSnapshot` è nelle dipendenze
di `handleNodesChange` (`:3695`) e va lasciato lì per il ramo di resize.

---

## 3. Write-back della geometria dopo undo/redo

### 3.1 Cosa fanno oggi `handleUndo` e `handleRedo`

`handleUndo` a `EditorV2.tsx:2359-2391`, `handleRedo` a `:2395`. Entrambi: `setNodes(state.nodes)`,
`setEdges(state.edges)`, `forceUpdate({})`, e — solo in `isJjomMode` — un `setTimeout(50)` con
`reconcileJjomAfterUndoRedo(state.nodes)` (`canvasToJjom.ts:1663`), che riconcilia **soltanto gli
attributi dei `classNode`** (ricrea, cancella, rinomina) e restituisce la mappa dei nuovi id.
Nessuna scrittura di geometria.

Con la ri-trasformazione continua di R-LAY-18 (il `Date.now()` nelle deps a `useJjomSync.ts:1528`
e la guardia `prevModel = {}` a `:1344` ri-trasformano ogni vertice a ogni render, e sia la
posizione sia — dopo `a7d52327a` — la taglia vengono ripropagate dal trasformatore), un ripristino
di sola sessione viene riscritto dal valore persistito nel giro successivo. In modalità JjOM
l'undo di uno spostamento **non può funzionare**, come dice il §10.4.

### 3.2 Le tre funzioni del resolver — già importate, nessuna firma nuova

```
canvasToJjom.ts:99     export function syncPositionBatchToJjom(updates: Array<{id, x, y}>)
canvasToJjom.ts:139    export function syncSizeResetToJjom(vertexId: string)
canvasToJjom.ts:152    export function syncSizeBatchToJjom(sizes: Array<{vertexId, w, h}>)
```

Tutte e tre sono **già importate** in `EditorV2.tsx:72,74,75` e già usate: `:3262` (auto-layout),
`:3590` (drag end), `:1004` (propagate size), `:2341` (`resetNodeSize`). Ognuna legge la chiave in
forza da sé con `getActiveLayoutKey()` (`:100`, `:140`, `:154`) e materializza il record completo
via `resolveLayoutWriteFor` (`canvasToJjom.ts:50-58`). **Nessuna firma nuova, nessun import nuovo.**

Semantica per le taglie: `syncSizeBatchToJjom` scrive `{w, h, isResized: true}`;
`syncSizeResetToJjom` scrive `{isResized: false}` lasciando `w`/`h` dov'erano — che è esattamente
il caso «nello snapshot il nodo non aveva `width`/`height`», perché i trasformatori leggono la
taglia solo quando `isResized` è vero (commento a `canvasToJjom.ts:133-137`).

### 3.3 Cosa confrontare, e quando

`state.nodes` è una copia profonda (`useHistory.ts:31`, `JSON.parse(JSON.stringify(...))`) presa
al momento dello snapshot. Il confronto va fatto **prima** di `setNodes(state.nodes)`, contro
`getNodes()` — lo store RF sempre corrente, non lo `state` React potenzialmente stantio di un
render (stessa ragione documentata al `:3499-3501`).

Tre insiemi, per ogni nodo dello snapshot che esista anche in `getNodes()`:

| condizione | scrittura |
|---|---|
| `position.x/y` diversi | entry per `syncPositionBatchToJjom` |
| snapshot ha `width`&`height`, e sono diversi (o assenti nel corrente) | entry per `syncSizeBatchToJjom` |
| snapshot **non** ha `width`/`height`, il corrente sì | `syncSizeResetToJjom(id)` |

Il nodo assente da uno dei due lati (creazione o cancellazione disfatta) non è geometria: lo
gestisce già il ramo esistente. Solo in `isJjomMode` (`:417`).

**Rischio da coprire, non nel prompt.** `resolveLayoutWriteFor` ha uno short-circuit: se
`store.getState().idlookup[vertexId]` non risolve, ritorna `{target:'scalars'}` e il chiamante
emette `SetFieldAction` su `'x'`/`'y'` di un id inesistente (`canvasToJjom.ts:55-57`, commentato
come «una gesture non deve mai lanciare dentro una TRANSACTION»). Oggi ci passano solo i nodi che
emettono un change di drag; il write-back invece itera lo snapshot, che può contenere nodi non
corrispondenti a un `DVertex`. Rimedio proposto: filtrare gli id su
`store.getState()?.idlookup?.[id]` nel costruttore del diff — `store` è già importato in
`EditorV2.tsx:100`. Costo: una lettura, nessuna firma nuova.

### 3.4 Anti-bounce e `scheduleLayoutSave`

`markCanvasUpdated`/`markCanvasUpdatedBatch` (`syncState.ts:83-89`) marcano l'id con un timestamp;
`isCanvasUpdated` (`:93`) scade a `BOUNCE_WINDOW_MS = 300` (`:78`). Le tre funzioni del resolver
lo chiamano già da sé (`canvasToJjom.ts:87,102,124,140,155`).

L'interazione è benigna, ed è quella descritta dal prompt: il write-back porta il D-layer **sul
valore ripristinato**, quindi la ri-trasformazione successiva concorda con lo stato RF e non c'è
niente da annullare; la finestra di 300 ms serve solo a impedire che un patch calcolato prima
della scrittura vinca sul risultato dell'undo. Nessun conflitto con R-LAY-18: il confronto
trasformatore-contro-cache di `a7d52327a` vedrà il valore nuovo.

`scheduleLayoutSave()` viene da `useLayoutAutosave()` (`EditorV2.tsx:443`,
`hooks/useLayoutAutosave.ts:62`) e va chiamato a valle del write-back, esattamente come ai
`:3605`, `:3640`, `:2342`, perché l'undo sopravviva al reload.

**Ordine proposto**: diff → `syncPositionBatchToJjom` / `syncSizeBatchToJjom` /
`syncSizeResetToJjom` → `setNodes(state.nodes)` / `setEdges(state.edges)` → `forceUpdate` →
`scheduleLayoutSave()` → il `setTimeout(50)` di riconciliazione già presente, invariato.

---

## 4. Storia e chiave di layout

`getLayoutKeyOf(state)` esiste già ed è pensato apposta per i `useSelector`
(`vertexLayoutAdapter.ts:71-83`, con il commento che spiega perché un selettore non deve leggere
`store.getState()`). `EditorV2.tsx` usa già `useSelector` (`:2`, `:469`, `:1257`), quindi:

```ts
const layoutKey = useSelector(getLayoutKeyOf);
```

è una riga, senza dipendenze nuove.

`useHistory` (`hooks/useHistory.ts`) non ha `clear()`. Aggiungerlo costa: un `useCallback` che
svuota i due `useRef` (`past`, `future`), una riga in `UseHistoryReturn`, una nel `return`.
`useHistory` è consumato **solo** da `EditorV2.tsx` (grep su `components/`: due soli hit, entrambi
nel file che lo definisce, `:23` e `:83`), quindi l'aggiunta non propaga.

`clear()` va chiamato da un `useEffect` sul cambio di `layoutKey`, **non al mount**: guardia con un
`useRef` inizializzato al valore corrente, che confronta e aggiorna.

**Politica proposta, da confermare al GO**: la storia si azzera al cambio di chiave; l'undo non
attraversa un cambio di layout. La ragione è quella del prompt e regge: lo snapshot contiene nodi
resi sotto la chiave in forza al momento del gesto, e ripristinarlo sotto un'altra chiave farebbe
scrivere la geometria di `A` nel record di `B` — cioè il write-back del §3 trasformerebbe un undo
innocuo in una corruzione del layout dell'altro viewpoint. Coerente con R-LAY-18, che già mette
l'undo del cambio di layout fuori perimetro («`takeSnapshot` è dei gesti, un cambio di layout non
è un gesto»).

Effetto collaterale accettato: azzerando la storia si perde anche l'undo dei gesti **non**
geometrici (creazione, rinomina, delete) fatti prima del cambio di layout. È il prezzo della
sicurezza; l'alternativa — storia per chiave, cioè una mappa `chiave → {past, future}` — è più
grande e non è chiesta. Da dichiarare, non da risolvere qui.

---

## 5. Redo, pulsanti, modalità non JjOM

- **Redo simmetrico**: `handleRedo` (`:2395`) ha la stessa struttura di `handleUndo` e prende lo
  stesso write-back, sullo stesso diff (snapshot di destinazione contro `getNodes()` corrente).
- **Pulsanti della toolbar** (`:3956-3957`, `onUndo={handleUndo}` / `onRedo={handleRedo}`):
  passano dagli stessi handler, quindi ereditano il write-back senza modifiche. Oggi sono
  **l'unica via** che raggiunge la storia di sessione (§1.2).
  Nota preesistente non nel perimetro: `canUndo`/`canRedo` sono letti dai `useRef` in fase di
  render (`useHistory.ts:76-77`), quindi lo stato abilitato/disabilitato dei due pulsanti è
  stantio di un render. Non toccato.
- **Modalità non JjOM** (`isJjomMode` falso, `:417`): tutto il write-back è dentro
  `if (isJjomMode)`, come i rami esistenti ai `:3579` e `:2340`. Comportamento **invariato**,
  dichiarato.
- **Renderer classico**: non toccato.

---

## 6. Impatto per layer

Nessun file della critical zone §3.1 è nel piano: `useJjomSync.ts` e `canvasToJjom.ts` **non si
toccano**. Il write-back **chiama** funzioni esistenti di `canvasToJjom.ts` senza modificarle.
Il Layer Impact Report formale del §3.2 non è dovuto (nessuno dei file elencati è toccato in
scrittura); si riporta comunque il quadro.

| Layer | Toccato | Cosa cambia / cosa non cambia |
|---|---|---|
| D-layer (Redux raw) | **in scrittura, indiretta** | Undo/redo ora scrivono `layoutByViewpoint` (o gli scalari nel ramo di fallback) tramite le stesse funzioni dei gesti. Nessuna action nuova, nessun campo nuovo, nessuna migrazione. |
| L-layer (proxy) | no | I setter `set_size`/`set_w`/`set_h` restano dov'erano (R-LAY-16(b)). |
| JjOM | no | Nessuna entità creata o distrutta. La riconciliazione degli attributi resta identica. |
| Canvas v2-flow | **sì** | Un `onNodeDragStart`, una guardia di resize, un `useSelector`, un `useEffect`, il diff nei due handler. |
| Canvas classic | no | — |
| Sync layer | **in lettura** | `canvasToJjom.ts` invocato, non modificato. L'anti-bounce si comporta come nei gesti (§3.4). |
| Persistenza | **sì, per `scheduleLayoutSave`** | Nessun `jsxString`, nessun `VersionFixer`, nessun bump di versione. |

**Rischi**

1. **Il ⌘Z resta catturato** (§1.2). Senza la decisione della domanda A, i punti 1, 2 e 5 del
   protocollo di verifica del prompt vanno provati **dai pulsanti della toolbar**, non da tastiera,
   e il punto 4 resterà rosso per costruzione.
2. **Id non risolvibili nel write-back** (§3.3) — coperto dal filtro su `idlookup`.
3. **Ciclo undo → write-back → ri-trasformazione**: escluso perché il write-back porta il D-layer
   sul valore che RF ha già; il giro successivo trova i due lati d'accordo. Da guardare comunque
   nella verifica visiva (oscillazioni sul nodo appena ripristinato).
4. **Il write-back scrive sotto la chiave in forza** — corretto solo se la storia non attraversa
   un cambio di chiave (§4). I due pezzi sono un blocco unico: non ha senso spedirne uno solo.

---

## 7. Domande al GO — nessuna decisa qui

**A. Il punto 3 del prompt («un solo undo per ⌘Z»).** Il rimedio proposto — `stopPropagation()`
nel gestore React — è **inerte**: quel gestore non viene mai eseguito per ⌘Z (§1.2). Le vie
possibili, senza sceglierne una:

- **(A1) Fuori perimetro, ora.** Si spediscono §2, §3 e §4; il ⌘Z resta al D-layer e la storia di
  sessione resta raggiungibile dai soli pulsanti della toolbar. Onesto e piccolo. Non chiude il
  fronte: da tastiera l'undo continua a fare quello che fa oggi, cioè quello descritto al §1.4.
- **(A2) Si tocca `Navbar.tsx`.** Il ramo di undo/redo ai `:1189-1204` cede a editor-v2 quando la
  tela è a fuoco (un `data-*` sul pannello, oppure un flag esposto da editor-v2 che la Navbar
  consulta), e il blocco anti-browser dei `:961-964` lascia passare `Z` in quel caso. Chiude il
  fronte davvero, ma esce dal perimetro dichiarato dal prompt e va autorizzato esplicitamente
  (Regola 1).
- **(A3) Solo il difetto di §1.1.** Correggere il ramo di redo (`event.key === 'Z'` con shift) è
  una riga in `EditorV2.tsx`, dentro perimetro, ma inutile finché vale la cattura. Da fare
  comunque o da lasciare?

Un listener in cattura registrato da editor-v2 **non** è una via d'uscita: `Navbar` monta prima
(è il padre), quindi il suo listener su `window` è registrato prima e il suo
`stopImmediatePropagation` blocca anche i listener su `window` registrati dopo.

**B. La politica di §4** — storia azzerata al cambio di chiave, con la perdita dichiarata
dell'undo dei gesti non geometrici precedenti. Si conferma?

**C. Il filtro su `idlookup` del §3.3** — è una riga in più rispetto al design del prompt.
Si autorizza?

**D. `U.userHasInteracted` (§1.4).** È misurato e dichiarato come vincolo del core. Si vuole una
riga a registro che lo fissi, o resta solo in questo report?

---

## 8. Piano dei diff, file per file

**Due file di codice** (Regola 19 non scatta: soglia a 5).

1. **`frontend/src/components/editor-v2/hooks/useHistory.ts`**
   - `clear()`: `useCallback` che svuota `past.current` e `future.current`.
   - Una proprietà in più su `UseHistoryReturn` e nel `return`. Nessuna firma esistente cambiata
     (Regola 11: solo aggiunta).

2. **`frontend/src/components/editor-v2/EditorV2.tsx`**
   - `onNodeDragStart` sul `<ReactFlow>` (`:3815`) → `takeSnapshot()` una volta per gesto.
   - Guardia `useRef` per il primo `{type:'dimensions', resizing:true}` in `handleNodesChange`,
     azzerata su `resizing === false`.
   - Rimozione del `takeSnapshot()` di `:3490` (resta il resto del ramo `if (hasDragEnd || hasResize)`).
   - Write-back geometrico in `handleUndo` (`:2359`) e `handleRedo` (`:2395`), prima di `setNodes`,
     solo in `isJjomMode`, seguito da `scheduleLayoutSave()`.
   - `useSelector(getLayoutKeyOf)` + `useEffect` che chiama `clear()` al cambio di chiave.
   - **Import nuovo**: `getLayoutKeyOf` da `./viewpoint/layout/vertexLayoutAdapter`. Le tre
     funzioni di sync e `store` sono già importate (`:72,74,75`, `:100`).
   - Dipendenze da aggiornare: `handleUndo`/`handleRedo` guadagnano `getNodes` e
     `scheduleLayoutSave`; `handleNodesChange` conserva `takeSnapshot`.
   - Se il GO sceglie (A3): la correzione del ramo redo al `:2517`.

Se il GO sceglie **(A2)**, si aggiunge `frontend/src/pages/components/Navbar.tsx` — terzo file,
fuori dal perimetro del prompt, da autorizzare.

**Fuori dal diff, dichiarati**: `reducer.ts`, `common/U.tsx`, `MetamodelTab.tsx`,
`canvasToJjom.ts`, `useJjomSync.ts`, `vertexLayoutAdapter.ts`, `vertexLayout.ts`.

---

## 9. Gate previsti

- `npm run typecheck` — baseline **33**, lista byte-identica (`diff` su output completo, exit
  status registrato; non su una coda di 60 righe).
- `npm run test` — 1349 passed, le stesse 9 suite rosse.
- `npm run build` — exit 0, solo il warning di chunk size preesistente.
- `npm run check:docs`.
- **`useHistory.clear()`**: non esiste oggi un test del hook (`hooks/__tests__/` contiene il solo
  `useAutoAnchor.test.ts`, che è puro e senza DOM). `useHistory` usa `useRef`/`useCallback` e
  richiede quindi un renderer di hook: `@testing-library/react` non risulta in `package.json`.
  **Si dichiara non testato**, salvo indicazione contraria al GO.

---

## 10. File letti

`CLAUDE.md`; `docs/decisions.md` (R-LAY-4, 14, 15, 16, 17, 18 come emendate il 2026-08-24);
`docs/claude-code-log.md` (entry del 2026-08-20 → 2026-08-24);
`docs/reports/2026-08-24-lir-layout-slice1b.md` §10.3-10.6;
`frontend/src/components/editor-v2/hooks/useHistory.ts` (intero);
`frontend/src/components/editor-v2/EditorV2.tsx` (`:2325-2410`, `:2490-2570`, `:3456-3700`,
`:3810-3975`, censimento `takeSnapshot`);
`frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`:1-180`, `:1655-1690`);
`frontend/src/components/editor-v2/sync/syncState.ts` (`:70-110`);
`frontend/src/components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts` (intero);
`frontend/src/pages/components/Navbar.tsx` (`:900-1000`, `:1180-1300`);
`frontend/src/utils/keyboardShortcuts.ts` (`:1-200`);
`frontend/src/redux/reducer/reducer.ts` (`:1190-1230`, `:1274-1340`, `:1425-1445`);
`frontend/src/redux/store.tsx` (`:78-130`); `frontend/src/common/U.tsx` (`:170-215`);
`frontend/src/App.tsx` (`:110-210`); `frontend/src/pages/Project.tsx` (`:75-121`);
`frontend/src/pages/components/Dashboard.tsx` (`:300-325`, `:557`, `:620-658`);
`frontend/src/components/abstract/tabs/MetamodelTab.tsx` (`:145-170`);
`frontend/src/components/abstract/tabs/EditorSwitch.tsx` (censimento);
`node_modules/@xyflow/react` 12.10.2 e `@xyflow/system` (tipi e `XYDrag`).

---

## 11. Hard stop

Report chiuso. Nessun file di codice modificato. **Fase 2 solo dopo il GO esplicito di Alfonso**,
che deve rispondere almeno alla domanda **A** — perché da essa dipende se il fronte chiude il
punto 3 del prompt o lo dichiara aperto.

---

## 12. Addendum 2026-08-24 (dopo il GO delle 19:10) — le quattro misure, e una correzione

Il GO ha scartato A1/A2/A3 per **A4**: un solo sistema di undo in modalità JjOM, quello del
D-layer. Snapshot a inizio gesto, write-back per resolver e `clear()` di `useHistory` **decadono**
(§2, §3, §4 restano validi come misura, non come piano). Qui le quattro misure chieste dal GO,
più una correzione a questo stesso report.

### 12.0 Correzione al §1.4 — la causa regge, l'effetto no

Il §1.4 concludeva che un ⌘Z «riporta il progetto all'inizio della sessione». **È sbagliato**, e
la prova 0 di Alfonso (2026-08-24, 19:30 — ⌘Z non fa niente, icona spenta) lo ha mostrato prima
del diff. La catena completa, che il §1.4 aveva letto a metà:

```
reducer.ts:1208    let shouldMerge = !isRelevantChange;      // flag falso → sempre true
reducer.ts:1211    if (!pastDelta) shouldMerge = false;      // stack vuoto → torna false
reducer.ts:1225    if (shouldMerge && allowMerge) { ...fonde... }
reducer.ts:1257    else if (isRelevantChange) { ...spinge... }   // sempre false
```

Con `U.userHasInteracted === false`, `isRelevantChange` è **sempre** falso, quindi il ramo che
spinge non gira mai; e `pastDelta` — letto a `:1207` dallo stack — resta `undefined` perché niente
viene mai spinto, quindi nemmeno il ramo che fonde gira. **Il delta viene scartato**: nessuno dei
due rami lo prende. Lo stack resta vuoto per sempre e `UndoAction` è un no-op.

La causa (`U.userHasInteracted` con un solo scrittore, `MetamodelTab.tsx:164`) resta esatta; la
conseguenza no. Il §1.4 aveva letto la clausola di merge senza la riga `:1211` che la disinnesca
a stack vuoto. Errore di lettura parziale, non di misura.

### 12.1 Misura 1 — dove alzare il flag

**La sede proposta dal GO (il callback di sync iniziale, `:417-438`) non è sicura.** Misurato:
quel callback, nel ramo `justCreatedGraphRef`, **attende `autoLayoutRef.current()`**, cioè
`handleAutoLayout`, che scrive posizioni nel D-layer con `syncPositionBatchToJjom` (`:3262` nel
file pre-diff). E arma `armReLayoutRef` (`:427` → `:3346`), che ri-lancia il layout quando gli
archi M1 si materializzano, **dopo** il callback e senza alcun gesto. Alzando il flag lì, la
disposizione ELK di un grafo appena creato diventerebbe il primo passo di undo: il primo ⌘Z
scombinerebbe il layout. È esattamente il caso che il GO chiedeva di escludere.

**Sede scelta: la prima interazione utente col pannello di editor-v2.** È l'analogo vero di
`MetamodelTab.tsx:164` — lì il flag si alza su un *drop*, cioè su un gesto — e per costruzione
esclude ogni scrittura programmatica di boot, qualunque sia il suo istante. Implementazione:
`onPointerDownCapture` e `onKeyDownCapture` sul `<div className="editor-v2">`, entrambi su
`markUserInteracted`. In cattura perché nessun figlio che fermi la propagazione possa saltarlo.

Conseguenza rispetto alla prova 2 del protocollo («rinomina, poi sposta, poi ⌘Z»): la rinomina
resta undoable, perché per selezionare il nodo da rinominare si clicca sulla tela e il
`pointerdown` alza già il flag. **Dichiarato**: una modifica fatta da un pannello esterno senza
mai toccare la tela, in una sessione appena aperta, non è undoable. Il classico ha lo stesso
limite prima del primo drop.

**Dichiarato**: se il re-layout armato scatta *dopo* che l'utente ha già interagito (archi M1 che
atterrano tardi), la sua scrittura diventa un passo di undo. Non osservato nelle prove; da
riportare se la verifica visiva lo mostra.

### 12.2 Misura 2 — persistenza dopo ⌘Z

**La via proposta dal GO non è praticabile.** `state.action_title` non viene scritto da
`doUndoRedo`: il blocco che assegnerebbe `'undone N steps'` è **commentato**
(`reducer.ts:1139-1146`, dentro `if (steps > 1)`). Non c'è nessun marcatore dell'undo nello stato.

**Via trovata, dentro `EditorV2.tsx`**: si osserva lo **stack**, non lo stato.
`statehistory` (`redux/store.tsx:76`, esportato da `joiner/index.ts:204`) è un singleton di
modulo, quindi non selezionabile in senso proprio; ma il corpo di un `useSelector` gira a **ogni
notifica dello store**, e `UndoAction`/`RedoAction` passano dallo store, quindi leggerlo lì è una
lettura-dopo-dispatch.

Il discriminante è esatto, non euristico:

| evento | `undoable` | `redoable` |
|---|---|---|
| azione ordinaria | `push` (`reducer.ts:1259`), o invariato se fusa | **mai toccato** |
| undo | `pop` (`:1128`) | `push` (`:1335`, `key='redoable'`) |
| redo | `push` (`:1335`, `key='undoable'`) | `pop` (`:1128`) |

Verificato con grep che **nessuna azione ordinaria svuota `redoable`** (unici scrittori:
`:1128`, `:1130`, `:1335-1338`). Il superamento di `MAX_HISTORY` fa `shift` dopo un `push`, quindi
la lunghezza resta uguale ma non cala mai. Quindi «una delle due lunghezze è **diminuita**» scatta
su undo e redo e **su nient'altro**. Su quella transizione si chiama `scheduleLayoutSave()`.

### 12.3 Misura 3 — stack vuoto

`doUndoRedo` (`reducer.ts:1118`) **non lancia** con lo stack vuoto: `pop()` dà `undefined` e la
riga `:1129` fa `if (!delta) continue`. Ritorna `oldState` mutato solo su `VIEWS_RECOMPILE_all`.

Ma `statehistory[forUser]` **non esiste** finché il primo delta non lo crea (`reducer.ts:1207`),
e `:1128` lo indicizza senza guardia: `statehistory[forUser].undoable.pop()` lancia un
`TypeError` su un utente mai visto. **I pulsanti guardano quindi lo stack prima di dispatchare**,
come fa `undoredocomponent.tsx`. Lo stesso vale per `canUndo`/`canRedo`.

**Dichiarato, non risolto**: il percorso da tastiera (`Navbar.tsx:1194`) non ha quella guardia. Un
⌘Z premuto prima di qualunque modifica, su una sessione dove `statehistory[DUser.current]` non è
ancora nato, può lanciare. Preesistente, in `Navbar.tsx`, fuori perimetro; la prova 7 del
protocollo lo tocca.

### 12.4 Misura 4 — il contesto di `Navbar`

La seconda causa concorrente ipotizzata dal GO è **esclusa per lettura**, senza bisogno del
`console.log` temporaneo. `detectCurrentContext()` (`utils/keyboardShortcuts.ts:31-64`) su
`#/project?id=…` dà `path = '/project?id=…'`, che:

- non è `'/allProjects'`, `'/dashboard'`, `'/'`, `''` (confronti di **uguaglianza**, `:37`);
- non contiene `/account`, `/profile`, `/settings` (`:42`);
- contiene `/project` (`:53`, `:58`).

Quindi il ritorno è `METAMODEL_EDITOR` se `.GraphContainer` / `.Graph` /
`[data-context="metamodel-editor"]` è nel DOM, `PROJECT_EDITOR` altrimenti — e **i due valori
entrano nello stesso ramo** a `Navbar.tsx:1189`. Il contesto non può essere la causa: qualunque
dei due sia, l'`UndoAction` parte. Nessuna modifica a `detectCurrentContext`, nessun secondo GO.

L'osservazione «⌘Z non fa niente» è spiegata per intero dal §12.0: l'`UndoAction` parte e trova
lo stack vuoto.

### 12.5 Il diff — un file

`frontend/src/components/editor-v2/EditorV2.tsx`.

1. Import esteso: `U`, `DUser`, `UndoAction`, `RedoAction`, `statehistory` da `'../../joiner'`
   (riga già esistente, nessun import nuovo).
2. `markUserInteracted` + `onPointerDownCapture` / `onKeyDownCapture` sul div radice (§12.1).
3. `dHistorySig` via `useSelector` che campiona `statehistory[DUser.current]`, e l'effetto che
   chiama `scheduleLayoutSave()` quando una delle due lunghezze cala (§12.2).
4. `handleUndo` / `handleRedo`: in `isJjomMode`, guardia sullo stack e
   `UndoAction`/`RedoAction`.new(1, DUser.current, false).commit()`, poi `return`. Il ramo
   esistente resta **intatto** sotto, per la modalità non JjOM.
5. `canUndo`/`canRedo` passati alla `Toolbar`: in JjOM dalle lunghezze del D-layer, altrimenti da
   `useHistory` come prima.

Nessuna riga tolta. I due rami di undo/redo dell'`onKeyDown` (`:2511`, `:2517`) restano morti per
costruzione e vanno nel censimento R-DEAD, non in questo diff. `useHistory.ts` **non è toccato**.

### 12.6 Gate

`tsc` **33**, lista byte-identica alla baseline: confronto su output completo con numeri di riga e
colonna normalizzati, `diff` vuoto tranne il PID in un `ExperimentalWarning` di node. L'unico
errore in `EditorV2.tsx` è quello preesistente (`TS2339 Property 'model' does not exist on type
'never'`), spostato da `:2902` a `:2969` dalle 67 righe aggiunte. `vitest` **1349 passed**, le
stesse **9** suite rosse. `build` **exit 0**, solo il warning di chunk size preesistente.
Nessun test nuovo: il diff è cablaggio di store e toolbar.
