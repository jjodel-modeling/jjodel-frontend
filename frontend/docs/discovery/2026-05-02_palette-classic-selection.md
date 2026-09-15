# Discovery: palette unificata non vede selezione dal classic

## Sintomo

In split mode (flow + classic affiancati), la palette M1 (`PalettePanel.tsx`) ha logica context-aware: quando un nodo M1 è selezionato sul canvas, la palette mostra le sezioni `CHILDREN` (containment refs) e `REFERENCES` (non-containment refs) della sua metaclass.

- **Selezione dal flow**: la palette si popola correttamente.
- **Selezione dal classic**: la palette torna allo stato vuoto ("Select an element to see available operations") nonostante il pannello Properties di destra (Apply to / Template / Style / Events) si aggiorni con il nodo selezionato.

## Risposte alle domande

### Q1 — Sorgente di selezione della palette

**File**: `frontend/src/components/editor-v2/panels/PalettePanel.tsx`

- L69 — la palette riceve la selezione come prop: `selectedNodes?: Node[]` (dove `Node` è importato da `@xyflow/react`).
- L92-101 — `selectedMetaclass` è calcolato così:
  ```ts
  if (selectedNodes.length !== 1) return null;
  const sel = selectedNodes[0];
  if (sel.type !== 'objectNode') return null;
  const data = sel.data as ObjectNodeData | undefined;
  const classId = data?.instanceOfClassId;
  if (!classId) return null;
  return allClasses.find(c => c.id === classId) ?? null;
  ```
- Stato "vuoto" (Image 2) = `selectedMetaclass === null`. Si verifica quando `selectedNodes` è vuoto, ha più di 1 elemento, o l'unico elemento non è di tipo `objectNode` con `instanceOfClassId`.
- L'identificatore su cui si basa è il React Flow `Node` con `data.instanceOfClassId` (DClass id JjOM).

**Conclusione Q1**: la palette legge la selezione **esclusivamente dalla rappresentazione interna React Flow**, non da Redux né da eventi.

### Q2 — Path di selezione del flow

**File**: `frontend/src/components/editor-v2/EditorV2.tsx`

- L913 — `const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);` — `nodes` è lo stato locale di `useNodesState`/React Flow (L262).
- L2979 — `<PalettePanel selectedNodes={selectedNodes} ... />` — l'array filtrato viene passato direttamente.
- L2900 — `<ReactFlow onNodeClick={jjomSelection.onNodeClick} ... />` — il click su nodo è gestito sia da React Flow internamente (che imposta `n.selected = true` via `onNodesChange`) sia dall'hook `useJjomSelection`.

**File**: `frontend/src/components/editor-v2/hooks/useJjomSelection.ts`

- L215-221 — `onNodeClick(_event, node)` chiama `selectElement(node.id, modelid)`.
- L96-137 — `selectElement` esegue una `TRANSACTION` che:
  - L116-122: `lElement.deselect(DUser.current)` su tutti gli altri sub-element + `lElement.select(DUser.current)` sul target → aggiorna `isSelected` sull'L-element.
  - L125-129: `SetRootFieldAction.new('_lastSelected', { node, view, modelElement })` → aggiorna il root field Redux.
- L88-91 — `notifyElementSelected` dispatcha l'evento `JjodelEvents.CANVAS_ELEMENT_SELECTED` per il viewpoint editor panel.

Inoltre, EditorV2.tsx:684-702 ha un listener per `JjodelEvents.SELECT_NODE` (`'jjodel:selectNode'`) emesso dalla TreeView (TreeViewContent.tsx:599) che marca `n.selected = true` programmaticamente:
```ts
setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
```

**Conclusione Q2**: il flow scrive su 3 canali distinti — (a) `n.selected` interno di React Flow (auto, via React Flow), (b) `LElement.isSelected` via `select()`/`deselect()`, (c) `_lastSelected` Redux root field. La palette legge solo (a).

### Q3 — Path di selezione del classic

**File**: `frontend/src/graph/graphElement/graphElement.tsx`

Esistono due punti di scrittura della selezione nel classic:

- L556-574 — metodo `select(forUser?)`:
  ```ts
  TRANSACTION('selection', () => {
      this.props.node?.select(forUser);
      SetRootFieldAction.new('_lastSelected', {
          node: this.props.nodeid,
          view: this.props.view.id,
          modelElement: this.props.data?.id
      }, (this.props.data as any).name);
  });
  ```

- L950-970 — handler mouse (`onMouseDown` chain) per click su elemento:
  ```ts
  TRANSACTION('select', () => {
      this.props.node.toggleSelected(DUser.current);
      if (state._lastSelected?.node !== this.props.nodeid) {
          SetRootFieldAction.new('_lastSelected', {
              node: this.props.nodeid,
              view: this.props.view.id,
              modelElement: this.props.data?.id
          });
      }
      // shift/ctrl handling: deselect tutti gli altri se senza modificatore
      if (!e.shiftKey && !e.ctrlKey) {
          for (let node of this.props.node?.graph.allSubElements) {
              if (node.id === nid) continue;
              node.deselect(DUser.current);
          }
      }
  });
  ```

**Cosa scatta esattamente**:
1. `LGraphElement.toggleSelected(DUser.current)` — flip `isSelected` sull'L-element (mutazione del DGraphElement).
2. `SetRootFieldAction.new('_lastSelected', { node: nodeid, view, modelElement })` — scrive il root field Redux. Qui `nodeid = this.props.nodeid` è l'id del DGraphElement nella **DGraph del classic**, non in quella del flow (`graphStyle: 'v2-flow'`); `modelElement = this.props.data?.id` è il DObject id (condiviso tra le due rappresentazioni).
3. Per click senza modificatori: deselect su tutti gli altri sub-element via `node.deselect(DUser.current)` (L967).

**Cosa NON scatta**:
- Nessun `dispatchEvent` di `JjodelEvents.SELECT_NODE` o di altro evento custom.
- Nessuna chiamata a `setNodes` di React Flow.
- Nessuna notifica all'EditorV2.
- Nessuna scrittura su un canale che la palette possa leggere.

**Conclusione Q3**: il classic pubblica la selezione su due canali — (b) `LElement.isSelected` e (c) `_lastSelected` Redux. **Non scrive** sul canale (a) (React Flow `n.selected`) e non emette eventi che lo facciano.

### Q4 — Selettore unificato esistente?

**Esiste un canale unificato in Redux**: il root field `_lastSelected = { node, view, modelElement }`.

**Writers** (entrambi gli editor + altri):
- `useJjomSelection.ts:125,162,168,208` — flow editor
- `graphElement.tsx:560,953` — classic editor
- `EditorV2.tsx:2829` — selezione di sub-element (attribute/operation/literal) senza cambiare graph selection
- `DockManager.tsx:194` — selezione programmatica di view
- `NodeEditor.tsx:330` — path alternativo dot-syntax (`'_lastSelected.node'`)

**Readers**:
- `Info.tsx:1326-1337` — il pannello Properties classic
- `PropertiesWithTreeView.tsx:42` — solo il flag `viewSelected`
- `StatusBar.tsx:111-191` — fallback per active model
- `jjscript/executor/utils.ts:74,149` e `eval.ts:225-226` — JjScript context resolution

**Quello che manca**: nessun reader in `frontend/src/components/editor-v2/` consuma `_lastSelected` per pilotare l'UI dell'editor moderno. La palette, nel flow editor, è basata interamente su React Flow node state (canale a).

I tipi a livello di stato sono: `_lastSelected.node` = id di un DGraphElement (DVertex/DEdge) in **una qualsiasi** delle DGraph del modello (può essere classic o v2-flow), `_lastSelected.modelElement` = id di un DModelElement (per M1: un DObject) — **questo è l'unico ID condiviso tra classic e flow**.

**Conclusione Q4**: il canale unificato `_lastSelected` esiste, è già il backbone del Properties panel classic e di JjScript, ma **non è cablato nella palette** dell'editor v2.

### Q5 — Sorgente del Properties panel di destra

Il pannello Properties con sub-tabs `Apply to / Template / Style / Events / Options` è renderizzato da:

**File**: `frontend/src/components/editors/Info.tsx`

- L1326-1337 — `mapStateToProps`:
  ```ts
  function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
      const ret: StateProps = {} as FakeStateProps;
      const nodeID = state._lastSelected?.node;
      const viewID = state._lastSelected?.view;
      const dataID = state._lastSelected?.modelElement;
      if (nodeID) ret.node = LGraphElement.fromPointer(nodeID);
      if (viewID) ret.view = LViewElement.fromPointer(viewID);
      if (dataID) ret.data = LModelElement.fromPointer(dataID);
      ret.topics = state.topics;
      ret.advanced = state.advanced;
      return ret;
  }
  ```

`Info` è una component connected via `react-redux`. Riceve `node`, `view`, `data` derivati da `_lastSelected`. Una scrittura del classic in `_lastSelected` triggera la re-render di `Info`.

**Conclusione Q5**: `Info` legge dallo stesso `_lastSelected` che il classic scrive — questo è il ponte che funziona già. Per la palette servirebbe applicare lo stesso pattern.

### Q6 — Impatto del commit "palette unificata" di stamattina

**Commit**: `2b96f36c5` — `feat: unify M1 instance palette across flow and classic editors` (1 maggio 2026, 23:49)

**File toccati**: `PalettePanel.tsx` (+4 linee), `EditorV2.tsx` (+36 linee), `ToolBar.tsx` (-49 linee).

**Cosa è cambiato** (`git show 2b96f36c5`):
- `PalettePanel.tsx` — solo aggiunta in `onDragStart`:
  ```ts
  event.dataTransfer.setData('application/jjodel-classic', metaclassId);
  ```
- `EditorV2.tsx` — aggiunti `onClassicDrop` (L1586-1609) e `onClassicDragOver` (L1612-1617), wirati su `<div className="editor-classic-only">` e `<div className="editor-split-classic">`.
- `ToolBar.tsx` — rimosso il vecchio Root level block.

**Cosa NON è cambiato**:
- Né la prop `selectedNodes` né la sua sorgente (`EditorV2.tsx:913` + L2979).
- Né la logica context-aware in `PalettePanel.tsx` (sezioni CHILDREN/REFERENCES, lookup `instanceOfClassId`).
- Né il routing di selezione tra editor.

**Conclusione Q6**: il bug è **strutturale e pre-esistente**. Il commit ha unificato fisicamente la palette (stesso componente, stesso DnD payload) ma non l'input di selezione. Prima dell'unificazione il bug non poteva manifestarsi perché la palette esisteva solo dentro il flow. La condivisione del componente in split mode ha esposto il gap.

## Root cause

La palette è un componente fisicamente unificato (PalettePanel.tsx) ma il suo input di selezione è ancorato al solo canale (a) — React Flow `n.selected` interno — accessibile solo all'editor flow.

Catena precisa:

1. `PalettePanel.tsx:72,92-101` legge `selectedNodes: Node[]` e filtra `instanceOfClassId` da `Node.data`.
2. `EditorV2.tsx:913` deriva `selectedNodes` da `nodes.filter(n => n.selected)` dove `nodes` è lo stato di `useNodesState` (`EditorV2.tsx:262`), aggiornato esclusivamente da:
   - React Flow internamente, su click su un nodo nel suo canvas (cattura la selezione perché l'evento attraversa i suoi handler);
   - Il listener `JjodelEvents.SELECT_NODE` (`EditorV2.tsx:684-702`) — emesso solo da TreeView (`TreeViewContent.tsx:599`).
3. Click sul classic (`graphElement.tsx:950-970`) scrive su `_lastSelected` Redux + `LElement.isSelected`, **non emette `JjodelEvents.SELECT_NODE`** e **non aggiorna React Flow nodes**.
4. Il listener al punto 2.b non viene mai triggerato dal classic → `n.selected` rimane invariato → `selectedNodes` resta `[]` → `selectedMetaclass` è `null` → la palette mostra "Select an element to see available operations".

Lo scenario osservato è esattamente lo **scenario 2 dell'ipotesi a priori** ("palette legge React Flow direttamente; il classic non passa per React Flow"), con la conferma aggiuntiva che `_lastSelected` esiste già come canale unificato e che la palette dovrebbe leggere da lì (come già fa il Properties panel).

## Opzioni di fix

### Opzione A — Far emettere `JjodelEvents.SELECT_NODE` al classic

**Cosa**: in `graphElement.tsx:950-970` (e `:556-574`), dopo la scrittura di `_lastSelected`, dispatchare:
```ts
window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, {
    detail: { nodeId: <id-React-Flow-corrispondente>, modelId: <model-id> }
}));
```

L'esistente listener `EditorV2.tsx:684-702` poi imposta `n.selected = true` sul nodo React Flow corrispondente, e la palette si popola.

**File toccati**: `graphElement.tsx` (+5-10 linee), eventualmente helper di lookup id.

**Diff stimato**: ~15-25 linee.

**Pro**:
- Riusa un evento esistente già pensato per "selezione esterna → flow".
- Non modifica la palette né il pannello flow.
- Pattern coerente con quanto fa già la TreeView.

**Contro**:
- Bisogna risolvere il **mismatch di ID**: `this.props.nodeid` nel classic è l'id di un DGraphElement nella **DGraph classic** (`graphStyle !== 'v2-flow'`), mentre il listener al L688 confronta `n.id === nodeId` dove `n.id` è la React Flow id, che corrisponde al DVertex della **DGraph v2-flow** (`jjomTransformers.ts:282` — `id: vertex.id`). Sono due DGraph differenti, due DVertex differenti.
- Soluzione: usare `this.props.data?.id` (DObject id, condiviso) come chiave e modificare il listener perché faccia reverse lookup `n.data?.dObjectId === modelElement` (oppure salire al DObject del DVertex).
- L'evento `SELECT_NODE` ha attualmente semantica "centra anche la viewport" (L693-697), che potrebbe essere indesiderato per il classic→flow sync. Andrebbe parametrizzato (`detail.center?: boolean`) o creato un nuovo evento `JjodelEvents.SET_FLOW_SELECTION`.
- Il classic emetterebbe l'evento anche quando il flow non è montato (es. modalità classic-only) — innocuo, ma rumore in console.

**Rischi**: medio. La risoluzione corretta dell'ID è il punto delicato; un mismatch silenzioso lascia il bug invariato. Il viewport-center side effect è un caveat UX.

### Opzione B — Far leggere alla palette il canale unificato `_lastSelected`

**Cosa**: cambiare l'input della palette da `selectedNodes: Node[]` a uno stato derivato da `_lastSelected.modelElement` via `useSelector` (in PalettePanel direttamente o in EditorV2 prima del passaggio prop).

Pseudocodice:
```ts
// In EditorV2.tsx (o in PalettePanel.tsx con useSelector)
const lastSelectedModelElement = useSelector((s: DState) =>
    (s as any)._lastSelected?.modelElement as string | undefined
);
const selectedMetaclassId = useMemo(() => {
    if (!lastSelectedModelElement) return null;
    const lObj = LPointerTargetable.fromPointer(lastSelectedModelElement) as any;
    // se è un DObject (M1), prendi instanceof.id
    return lObj?.instanceof?.id ?? null;
}, [lastSelectedModelElement]);
```

Poi PalettePanel filtra `allClasses.find(c => c.id === selectedMetaclassId)` invece di leggere `selectedNodes[0].data.instanceOfClassId`.

**File toccati**: `EditorV2.tsx` (passaggio prop modificato) + `PalettePanel.tsx` (interfaccia `selectedNodes` → `selectedMetaclassId` o equivalente). In alternativa, PalettePanel internamente con `useSelector`.

**Diff stimato**: ~25-40 linee (incluse rimozioni della prop `selectedNodes` se non più usata altrove — è ancora usata da Toolbar via `selectedCount`, andrebbe mantenuta come prop separata).

**Pro**:
- Allinea palette al **canale canonico** di selezione (`_lastSelected`) già usato da Properties, JjScript, StatusBar.
- Funziona simmetricamente per flow e classic senza event plumbing aggiuntivo (entrambi scrivono in `_lastSelected`).
- Il mapping `DObject → metaclass` è una chiamata diretta a LPointerTargetable + `.instanceof`.
- Niente eventi custom da introdurre.

**Contro**:
- Cambia il contratto della palette (input prop o nuova dipendenza Redux). Componenti consumer della palette in altri contesti (M2, futuri) andrebbero adeguati — al momento c'è un solo consumer (`EditorV2.tsx:2975`).
- La modalità M2 della palette non cambia (non usa `selectedNodes`), ma se in futuro servirà context-aware su M2, sarà necessario mappare anche package/class id.
- Side effect potenziale: `_lastSelected.modelElement` viene mantenuto su deselect (`useJjomSelection.ts:160-172` — punta sempre a un classifier o al model). La palette dovrebbe distinguere "selezione M1 su un DObject" da "stato 'sto puntando al model perché niente è selezionato'" — verificare il tipo via `lObj?.className` o `instanceof DObject`.

**Rischi**: medio. Cambia l'input contract, ma localizzato a 2 file. Il caso "deselect" è il dettaglio da gestire correttamente per non mostrare la palette popolata quando l'utente clicca su pane vuota.

### Opzione C — Reverse-sync: in `EditorV2` osservare `_lastSelected` e replicare su `n.selected`

**Cosa**: aggiungere un effect in `EditorV2.tsx` che, su cambio di `_lastSelected.modelElement`, trovi il React Flow node corrispondente e lo marchi selected:

```ts
const lastSelectedModelElement = useSelector((s: DState) => (s as any)._lastSelected?.modelElement);
useEffect(() => {
    if (!lastSelectedModelElement) return;
    setNodes(nds => nds.map(n => {
        const matches = n.type === 'objectNode' && /* lookup vertex.model.id === lastSelectedModelElement */;
        return { ...n, selected: matches };
    }));
}, [lastSelectedModelElement, setNodes]);
```

**File toccati**: `EditorV2.tsx` (+15-25 linee).

**Diff stimato**: ~20-30 linee.

**Pro**:
- Niente modifiche al classic.
- Niente modifiche alla palette (continua a leggere `selectedNodes`).
- Bridging puro al lato flow.
- Mantiene allineamento bidirezionale: `selectedNodes` riflette sempre lo stato canonico.

**Contro**:
- Loop di update: il flow click chiama `useJjomSelection.onNodeClick` → scrive `_lastSelected` → questo effect rileva il change → `setNodes` con `selected: true` (già `true`) → `nodes` cambia reference → re-derive `selectedNodes` → ok ma extra lavoro. Mitigabile con guard "se `n.selected` è già il valore desiderato non ri-mappare".
- `useJjomSelection` è stata **deliberatamente isolata** dal sync (commento di apertura del file, L1-15) per evitare loop tra `isSelected` e `position`. Aggiungere un effect che reagisce a `_lastSelected` potrebbe interferire se non gestito con `markCanvasUpdatedBatch` (vedi `syncState.ts`).
- Bisogna comunque risolvere il lookup `modelElement → React Flow node id`: il React Flow node ha `id = vertex.id`, non DObject id. Servirebbe un'ulteriore lookup `vertex.model.id === modelElement` o un index in `nodes`.

**Rischi**: medio-alto. I loop di sync su selection sono storicamente la classe di bug più sottile in questo editor (il file `useJjomSelection.ts` ha un commento di apertura interamente dedicato a evitarli). Aggiungere un terzo writer di `n.selected` aumenta la superficie.

## Raccomandazione

**Opzione B**.

Motivazioni:
1. Allinea la palette al canale canonico già usato dal Properties panel (`Info.tsx`) e da JjScript. Stessa sorgente, stessa semantica, niente nuovi eventi.
2. Il "double-write" del flow (sia `n.selected` sia `_lastSelected`) è già una realtà — la palette semplicemente smette di leggere il canale "transient/internal" e legge quello "canonical/persistent". Il flow continuerà a funzionare identico.
3. Non introduce loop di selection sync (problema storico in editor-v2): la palette diventa puro consumer.
4. Diff localizzato (2 file, ~25-40 linee). Rollback facile.
5. Permette in futuro di unificare anche il selettore Toolbar (`selectedCount`, EditorV2.tsx:3003) sul medesimo canale, riducendo entropia.

L'unico dettaglio da gestire è la distinzione "selezione attiva su DObject" vs "_lastSelected residuo che punta al model di default" (gestito in `useJjomSelection.ts:141-178`): risolvibile controllando `lObj.className === 'DObject'` o equivalente prima di passare il metaclass alla palette.

## Open questions

1. **Lookup `vertex → DObject` per il listener** (rilevante se si scegliesse Opzione A o C): qual è il modo idiomatico in Jjodel per ottenere il DObject di un DVertex? Probabilmente `LVertex.fromPointer(vertexId).model.id`, ma da confermare.
2. **Disambiguazione modelElement deselect-default**: in `useJjomSelection.ts:160-172`, dopo deselect `_lastSelected.modelElement` viene impostato a un classifier (M2) o al model stesso, **non a `null`**. La palette deve trattare questi casi come "nessuna selezione". Verificare se LObject `instanceof.className === 'DClass'` o un altro check è appropriato (es. `LPointerTargetable.fromPointer(id) instanceof LObject`).
3. **Selezione multipla**: il classic supporta shift/ctrl-click (`graphElement.tsx:960`), ma `_lastSelected` è singolo. Il flow oggi mostra la palette solo per `selectedNodes.length === 1`. Vincolo coerente, ma vale chiedersi se il classic→palette debba anche supportare "ultima selezionata" o restare a "1 sola".
4. **Comportamento Q5/PropertiesPanel del flow** (`editor-v2/panels/PropertiesPanel.tsx`): è un secondo Properties panel diverso da `editors/Info.tsx`? Guardando rapidamente sembra il pannello del flow per nodi M2 (con prop `selectedNodes/selectedEdges` — stessa sorgente della palette). Se esiste un Properties anche per l'editor v2 in modalità M1, soffrirà dello stesso bug — andrebbe verificato e potenzialmente fixato con la stessa Opzione B.
5. **Conferma runtime**: la conclusione "il classic non scrive su React Flow" è dedotta dal codice (`graphElement.tsx` non importa `setNodes`/`useReactFlow`/`JjodelEvents.SELECT_NODE`). Una verifica empirica con breakpoint su `EditorV2.tsx:913` dopo click sul classic confermerebbe definitivamente che `nodes.filter(n=>n.selected)` resta vuoto.

---

**Stato**: discovery completata, nessun file di codice modificato.
**Prossimo step**: prompt di fix mirato basato sulla raccomandazione (Opzione B), previa decisione di Alfonso sulle open question 2 e 3.
