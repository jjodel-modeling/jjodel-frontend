# Discovery: flow ↔ classic sync mismatch

Bug: in split mode, "Add child" via context menu works flow→classic but not classic→flow. After classic creation, the child is invisible to flow until a forced refresh.

## 1. Come il flow calcola i nodi

**File**: `frontend/src/components/editor-v2/EditorV2.tsx` + `frontend/src/components/editor-v2/hooks/useJjomSync.ts`

- `EditorV2.tsx:262`: `const [nodes, setNodes, onNodesChange] = useNodesState(modelid ? [] : initialNodes);` — RF state, partito vuoto in JjOM mode.
- `EditorV2.tsx:314`: `useJjomSync(modelid, setNodes, setEdges, …)` — il sync hook che popola `nodes`/`edges` dal modello.
- **Meccanismo**: `useSelector` reattivo su Redux. Tre selettori chiave triggerano i tre `useEffect` che chiamano `setNodes`/`setEdges`:
  - `graphInfo` (L271): `state.graphs` filtrato per `graph.model === modelid && graphStyle === 'v2-flow'`. Espone `graphId` + `subElements`.
  - `modelObjectCount` (L299): `state.idlookup[modelid].objects.length` — solo oggetti **top-level**.
  - `modelClassCount` (L307), `modelRefCount` (L322): per M2.
  - `elementSnapshots` (L704): per ciascun id in `subElementIds`, snapshot di `state.idlookup[id]` + hash dei children (attributes/references/operations/literals/features). Include i `DValue.values` (L742-750) per detectare cambi di feature.
- **Tre effect**:
  - L343 (init/auto-create graph + Step 2.5 dal fix di ieri): deps `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]`.
  - L790 (full transform on init): deps include `graphInfo, elementSnapshots, subElementIds`.
  - L867 (incremental update via diff su `elementSnapshots`): deps `[isJjomMode, elementSnapshots, subElementIds, scheduleFlush]`.

**Trigger di re-render**: cambia `subElementIds` (graph.subElements) **oppure** `modelObjectCount` (model.objects.length) **oppure** un hash dentro `elementSnapshots`.

## 2. Come il classic renderizza

**File**: `frontend/src/components/abstract/tabs/ModelTab.tsx:48` — `<DefaultNode data={model} nodeid={graphid} graphid={graphid} />` dentro un `EditorSwitch`.

- Il classic usa una **DGraph distinta** dal flow: `mapStateToProps` (L67-69) filtra `graphStyle !== 'v2-flow'`. Due graph separati condividono lo stesso `DModel`.
- Reattività via `connect()` (Redux `mapStateToProps` → re-render). `DefaultNode` è una connected class component che ridiscende ricorsivamente i children dal proxy LModel.
- Il classic **non** rappresenta i composition children come edge. Li renderizza come tree-children del parent: legge `parent.$<refName>.values` direttamente, segue il puntatore al DObject child, e renderizza inline.

## 3. Path creazione child da flow context menu

**File**: `frontend/src/components/editor-v2/EditorV2.tsx`
**Funzione**: `getContextMenuItems` → ramo M1 objectNode (L2129-2167), entry `Add <ChildClass>` chiama `createCompositionChild(node, cls, ref.name)` (L1991).

**API usata**: `syncCreateObject` (`canvasToJjom.ts:1076`) + `syncCreateCompositionLink` (`canvasToJjom.ts:1165`).

`syncCreateObject` (L1097-1112):
```ts
DObject.new(metaclassId, modelId, DModel, name, true);    // father=DModel → entra in model.objects
DVertex.new(0, dObject.id, graphId, graphId, undefined, size);  // entra in v2-flow graph.subElements
```

`syncCreateCompositionLink` (L1197-1224, dentro TRANSACTION):
```ts
parentObject.$<refName>.values = [...meaningful, childObject.id];   // aggiorna parent's LValue
DVoidEdge.new2(refDefId, graphId, …, parentVertexId, childVertexId, …);   // crea l'edge nel v2-flow graph
```

**Side effects post-creazione**:
- `model.objects` ++ → `modelObjectCount` selector triggera.
- `graph.subElements` ++ (vertex + edge) → `subElementIds` cambia.
- `parent.$ref.values` ++ → l'hash in `elementSnapshots` per il parent vertex cambia.
- `setNodes(nds => [...nds, childNode])` (EditorV2.tsx:2020) inserisce il nodo direttamente per feedback immediato.
- `markDropCreated(vertexId/edgeId)` (canvasToJjom) per impedire al sync di duplicare.

## 4. Path creazione child da classic context menu

**File**: `frontend/src/components/contextMenu/ContextMenu.tsx`
**Funzione**: `getAddChildren` (L323-360). Su click: `l.addObject({}, out[0])` (L339) o `l.addObject({}, lc); l.values = [...(l.values as LObject[]), child]` (L350-351). `l` è una **LValue** (il valore di una reference containment del parent).

**API usata**: `LValue.addObject` → `get_addObject` in `LModelElement.tsx:6742` → core in `LModelElement.tsx:6841-6849`:
```ts
TRANSACTION('…addObject()', () => {
    let dobj = DObject.new3(constructorPointers, …);
    if (isReference && !isContainment){
        // … if it's model, object.father = model, and it goes in model.objects and not in values.
        // … if is ref containment, object.father is set to value, which also appends the object to this.values
        this.set_values([...(c).data.values, dobj.id], c)
    }
    …
});
```

Per containment refs (caso M1 composition child): `DObject.new3` viene chiamato senza modelId come father; il father del nuovo DObject è la **LValue** parent. **Il DObject NON viene aggiunto a `model.objects`**.

**Side effects post-creazione**:
- `parent.$ref.values` ++ (parent's DValue.values).
- `DObject` creato con `father = LValue` (containment).
- **Niente DVertex creato**.
- **Niente DEdge creato**.
- **`model.objects` invariato**.
- **`graph.subElements` invariato** (né classic né flow).
- Nessun `dispatchEvent`, nessun callback verso flow.

## 5. Gap identificato

**Categoria: E (structural mismatch tra le due rappresentazioni)** + secondariamente **D (trigger di refresh assente)**.

**Descrizione concreta**: i due path scrivono nel modello in modo strutturalmente diverso.

| Path | DObject in `model.objects` | DVertex in `graph.subElements` | DEdge | parent's `$ref.values` |
|---|---|---|---|---|
| **Flow** (`syncCreateObject` + `syncCreateCompositionLink`) | sì (top-level) | sì | sì | sì |
| **Classic** (`l.addObject({}, lc)` su LValue containment) | **no** (sotto `LValue.father`) | **no** | **no** | sì |

I tre selettori chiave di `useJjomSync.ts` osservano segnali che la classic mutation non tocca:

1. `modelObjectCount` (L299) → invariato (DObject non è in `model.objects` per containment).
2. `subElementIds` da `graph.subElements` (L295) → invariato (nessun DVertex creato).
3. `elementSnapshots` (L704) → **potrebbe cambiare** (l'hash include `child.values` per `features`, L742-750), quindi se il parent vertex è già in `subElementIds`, l'hash del parent muta. Ma l'effect L867 che reagisce a questo cambio non ha logica per "scansionare i value-pointer del parent e creare DVertex per i child non visti". Si limita a re-applicare i dati del nodo esistente.

Anche **il fix di ieri (`useJjomSync.ts:343` Step 2.5)** non cattura questo caso: itera `rawModel.objects` per creare DVertex per "DObject senza vertex", ma i containment children non sono in `rawModel.objects`. Sono raggiungibili solo navigando ricorsivamente da `model.packages → … → DValue.values`.

**Coerenza con il sintomo "forza un refresh → appare"**: ricaricando il viewpoint o cambiando mode, `useJjomSync` re-inizializza con `prevElementsRef.current.clear()` e ricostruisce dallo store. Tuttavia, anche in re-init il flow popola solo da `subElementIds` (graph) — non scopre da solo i containment children. Il refresh probabilmente passa anche da un punto che chiama qualche helper di rebuild graph (es. `syncCreateObject` retroattivo su tutti gli objects, o un legacy reconcile in `canvasToJjom`). Verifica esatta del refresh-path è una **domanda aperta** (sezione 7).

## 6. Fix candidati

**Opzione 1 — Cambiare la classic a usare la stessa API del flow**.
Sostituire `l.addObject({}, lc)` in `contextMenu/ContextMenu.tsx:339,350` con `syncCreateObject(graphId, lc.id, x, y, name) + syncCreateCompositionLink(parentId, childId, refName)`.
- Pro: simmetria perfetta, single source of truth, niente nuove logiche di sync.
- Contro: rompe il classic in due modi: (a) il classic legge da `parent.$ref.values` ma anche da `model.objects` per il rendering tree? Da verificare. (b) il classic ha la sua DGraph (non v2-flow) — bisogna creare anche un vertex lì? Forse no se classic usa solo il modello, non la graph. (c) introduce dipendenza editor-v2 → contextMenu (un layer "abstract" che dipende da uno concreto). Da valutare.
- Rischio: medio-alto. Cambia il modello dati per i containment children, potenzialmente con effetti su persistence, JjEL, JjTL, undo/redo.

**Opzione 2 — Estendere Step 2.5 a scansione ricorsiva dei containment children**.
In `useJjomSync.ts:343` (effect), oltre a iterare `rawModel.objects`, fare BFS/DFS su `parent.$ref.values` per ogni vertex già esistente e creare DVertex per i child non visti. Aggiungere un nuovo selettore `containmentChildCount` (somma di `DValue.values.length` per tutte le containment refs raggiungibili) alle deps per triggerare il re-run quando un classic-add avviene.
- Pro: fix locale al sync layer, zero impatto su classic / API esistenti. Coerente con la filosofia del fix di ieri.
- Contro: il selector ricorsivo è costoso (ogni Redux update lo ri-computa). Mitigabile con custom comparator. Inoltre, dove posizionare i nuovi vertex? Bisogna sceglier un layout (es. cascata sotto/destra del parent, come `createCompositionChild`).
- Rischio: medio. Localizzato, ma il diff potrebbe superare le 30-50 righe (nuovo selector + scansione ricorsiva + auto-layout + edge creation).

**Opzione 3 — Wrapper su `LValue.addObject` che dispatcha un evento custom**.
In `LModelElement.tsx:6841` (dentro `get_addObject`), dopo la creazione, `window.dispatchEvent(new CustomEvent('jjodel:objectAdded', { detail: { dobjId, parentValueId, modelId } }))`. In `useJjomSync.ts`, listener che, se `modelId === current modelid` e parent vertex esiste, chiama `syncCreateObject`-like + `syncCreateCompositionLink`-like.
- Pro: niente cambiamenti al classic, fix non invasivo, single trigger point. Pattern già usato altrove (`JjodelEvents.HELP_OPEN`, etc.).
- Contro: introduce un evento custom in un file di model-layer (`LModelElement.tsx`), non bellissimo per separation of concerns. Inoltre, `addObject` è chiamato anche da JjScript / JjTL / batch operations — l'evento sparerebbe N volte per N child, possibile thrashing.
- Rischio: basso ma con caveat di event spam. Da considerare debouncing.

**Raccomandazione personale**: Opzione 2. Estende il pattern del fix di ieri (single point of truth nel sync layer), zero impatto su altri sistemi. Costo: una BFS ricorsiva e una decisione di layout (es. semplice cascata `parent.x + parent.w + 80, parent.y + i * 80` come `createCompositionChild`).

## 7. Domande aperte

1. **Cosa fa esattamente "forza un refresh"** (cambio mode, ricarica viewpoint) per fare apparire il nodo? Probabilmente passa da una rebuild completa del graph in `EditorV2`, ma il punto esatto va trovato. Se identificato, può essere il punto di hook per il fix.
2. **Il classic sa qualcosa del v2-flow graph?** Apparentemente no (filtra `graphStyle !== 'v2-flow'` in `ModelTab.tsx:68`). Quindi tocca al flow auto-allinearsi.
3. **`addObject` su `LValue` containment davvero non aggiunge a `model.objects`?** Il commento (LModelElement.tsx:6843-6849) dice "if is ref containment … object.father is set to value, which also appends the object to this.values". Non menziona `model.objects`. Verifica empirica via debugger consigliata prima del fix.
4. **Layout dei nuovi vertex creati dal sync auto-fill**: il fix di ieri usa `GraphSize(x,y,200,80)` con x/y di default (probabilmente 0,0 o random). Se `containmentChildCount`-Step crea vertex orfani sopra altri esistenti, UX degrada. Una piccola euristica di stagger (es. usa `parent.position + offset`) sarebbe meglio.
5. **JjScript create instance + add containment** — c'è un caso analogo dove JjScript crea un containment child? Se sì, il bug si manifesta lì allo stesso modo. Il fix dovrebbe coprirlo per simmetria.
6. **Quando `syncCreateCompositionLink` aggiorna `parent.$ref.values`, l'hash di `elementSnapshots` cambia** — questo è il segnale che il flow USA per intercettare il cambio di feature da JjScript / classic. Verificare se il diff in L867 include logica di "scansiona i pointer di valori per child non visti" (fast skim ha mostrato che no, ma vale doppio check). Se sì, il fix è banale (estendere lì); se no, va aggiunto.
