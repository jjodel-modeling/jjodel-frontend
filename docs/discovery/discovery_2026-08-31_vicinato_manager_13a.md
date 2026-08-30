# Discovery — il riquadro di vicinato nel manager (13a, opzione 1a)

**Data**: 2026-08-31 · **Fase**: 1 (read-only, zero file sorgente toccati)
**Prompt**: «13a: il riquadro di vicinato nel manager», in chat, ratifica di design R-13A-1.
**Referenza di design**: `docs/design/design_handoff_instance_node/13a Diagramma Embedded.dc.html`,
opzione **1a** (untracked a inizio sessione; committato con questo referto).

---

## 1. Le ipotesi che questa discovery sta falsificando

| # | Ipotesi | Esito |
|---|---------|-------|
| H1 | Il vicinato richiede un walk nuovo (owner, refs uscenti, referenced-by). | **Falsificata**: i tre pezzi esistono e sono puri; §3. |
| H2 | Il riquadro deve rendere i nodi con un renderer proprio. | **Falsificata**: `slotShapeFor` e' esportato e `detectValueRenderer` e' la stessa decisione della tabella; §4. |
| H3 | Esiste gia' un'API di selezione cross-tab utilizzabile per un'istanza. | **Falsificata a meta'**: l'evento esiste (`SELECT_NODE`), ma il suo spazio di id e' quello dei **vertici**, non degli oggetti; §6. Serve una risoluzione oggetto -> vertice, che e' pura e testabile. |
| H4 | La sincronia di selezione va costruita (terzo emettitore = nuova macchina). | **Falsificata**: `subjectId` e' gia' «riga viva OPPURE DObject vivo del modello» (10b) e i due emettitori esistenti hanno lo stesso corpo; §5. |
| H5 | Il caso stale (S3/S5) richiede un'invalidazione dedicata. | **Falsificata**: tutto il tab pende da una sola `useSelector(state.idlookup)`; §7. |

## 2. Obiettivo della fase

Stabilire (a) quali puri esistenti compongono il vicinato, (b) dove vive la regola di
layout, (c) se «Open in canvas» ha una via, (d) il perimetro file per la Regola 19.

## 3. Il walk: tre pezzi che esistono gia'

**Owner, un livello su** — `frontend/src/components/editor-v2/hooks/createDraw.ts:145`:

```typescript
/** The DObject that owns this one, or null when the model owns it directly.
 *  One hop: `father` is the owner's SLOT, and the slot's father is the owner. */
export function ownerOf(idlookup: Idlookup, objectId: string): string | null {
```

`null` significa «il modello lo possiede direttamente»: e' il predicato di radice
dell'outline (`outlineDraw.ts:71`) ed e' anche la condizione «nessun nodo owner» del
riquadro.

**Refs uscenti, un salto** — le feature stanno su `ClassShape.refs` (non-containment,
`frontend/src/jjform/shape.ts:102`), i valori grezzi su
`createDraw.filledSlotValues` (`:100`), che filtra i **buchi** e non la vivezza:

```typescript
/** The values a slot actually holds, holes excluded. */
export function filledSlotValues(idlookup: Idlookup, ownerId: string, featureKey: string): string[]
```

Un valore che non risolve resta nella lista: e' quello che permette al nodo **broken**
di comparire invece di sparire in silenzio (stessa scelta di `outlineDraw`, header:
«a dangling pointer is a fact about the model's structure»).

**Referenced-by entranti** — `frontend/src/components/editor-v2/hooks/shapeDraw.ts:180`,
la risalita `pointedBy -> DValue -> father` della slice 2b:

```typescript
export function referencedBy(idlookup: Idlookup, instanceId: string): IncomingRef[] {
    const entries = idlookup?.[instanceId]?.pointedBy;
```

`IncomingRef` porta gia' `instanceId`, `instanceName`, `instanceClass`, `featureKey`,
`composition`, `index` (`jjform/shape.ts:152`), cioe' **tutto** cio' che serve a
disegnare un arco entrante con la chiave della feature sopra. Il filtro e' uno:
`!composition` — «an owner is not a referrer», la stessa riga che la tabella applica a
`TableRow.referencedBy` (`instanceTable.ts:228`).

**Nomi e metaclassi** — `makeDrawReadCtx` (`viewpoint/ir/irReadCtx.ts:166`): slot
identita' `name`, poi `DObject.name`, poi `initialName`. Un solo nome in tutto il
manager (tabella, outline, breadcrumb) e ora anche nel riquadro.

**Conseguenza**: il modulo nuovo del walk **compone** e non riscrive. Le quattro
funzioni sopra sono tutte importless (nessuna tocca il barrel del joiner), quindi il
modulo che le compone resta testabile sotto node — la ragione di R-FORM-5.

## 4. I nodi si rendono col motore che esiste

`slotShapeFor` **e' esportato** — `frontend/src/components/abstract/tabs/instanceTable.ts:134`:

```typescript
/** The `SlotShape` `valueRenderer` reads, built for one (instance, feature).
 *  Exported for the tests, which drive it on plain dictionaries. */
export function slotShapeFor(
```

Quindi il valore saliente di un nodo del vicinato passa dalla **stessa** chiamata della
cella: `slotShapeFor(...)` -> `detectValueRenderer(slot)`. Nessuna seconda decisione,
che e' la regola di R-FORM-15.

Gli stati del contratto arrivano di conseguenza: `brokenRef` per il pointer che non
risolve, `missingRequired` per il required vuoto, `dash` per lo slot vuoto. Il riquadro
li **riceve**, non li ricalcola.

**Regola del «valore saliente» proposta** (da ratificare, §9 Q2): il primo attributo
in ordine di shape, chiave diversa da `name` (lo slot identita', gia' speso nel titolo
del nodo), la cui decisione non sia `dash`. Al piu' uno; nessuno se non ce n'e'.

## 5. La selezione condivisa e' gia' li': il riquadro e' il terzo emettitore

`InstanceManagerTab.tsx:1021` — la risoluzione allargata di 10b:

```typescript
const subjectId = selectedObjectId
    && (rows.some(r => r.id === selectedObjectId)
        || (idlookup?.[selectedObjectId]?.className === 'DObject'
            && modelIdOfObject(idlookup, selectedObjectId) === modelid))
    ? selectedObjectId
    : null;
```

Il commento sopra la dichiara scritta apposta per una superficie che seleziona istanze
di **altre** metaclassi rispetto alla tabella mostrata. I due emettitori esistenti:
`selectOnly` (`:1075`, click di riga) e `selectFromOutline` (`:1259`). Hanno lo stesso
corpo — `setSelectedObjectId`, `setAlsoSelected([])`, `setBulkTouched({})`,
`setNav(null)` — e il terzo e' quello, piu' `setMenuFor(null)` se il riquadro avra' un
menu (non ne ha: e' read-only).

**Limite dichiarato, ereditato da 10b**: `toggleSelected` e `confirmMultiDelete`
ragionano su `rows`; restano corretti perche' il riquadro, come l'outline, **azzera**
`alsoSelected` e non alimenta la multi-selezione.

## 6. «Open in canvas»: l'evento c'e', la mappa no

**L'evento esiste** — `frontend/src/events/registry.ts:24`, `SELECT_NODE:
'jjodel:selectNode'`. Consumatore unico: `EditorV2.tsx:999-1016`:

```typescript
const { nodeId, modelId } = (event as CustomEvent).detail || {};
if (!nodeId || modelId !== modelid) return;
setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
```

Confronta con `n.id`, cioe' l'id del nodo React Flow. E l'id del nodo RF di un'istanza
**e' l'id del vertice** — `components/editor-v2/utils/jjomTransformers.ts:470-472`:

```typescript
    return {
        id: vertex.id,
        type: 'objectNode',
```

Il vertice porta l'oggetto in `model` (`model/dataStructure/GraphDataElements.tsx:1673`,
`model!: Pointer<DModelElement, 0, 1, LModelElement>`), scritto da
`useJjomSync.ts:773`: `DVertex.new(0, objId, graphId, graphId, undefined, size)`.

**Reperto collaterale, non in scopo**: l'unico dispatcher esistente
(`TreeViewSidebar/TreeViewContent.tsx:848`) manda `instance.id`, che
`buildInstanceForest` (`:2355`, `id: obj.id`) prende dall'`LObject` — cioe' **un id di
DObject**. Contro `n.id` di vertice non combacia mai: la selezione su canvas dalla
Tree View per le istanze M1 non puo' funzionare. Non e' toccato da questa slice
(Regola 1); e' registrato qui perche' e' la misura che dice come NON scrivere il
gesto nel manager.

**Il minimo che serve** (nessun file dell'editor toccato):

1. `vertexOfObject(idlookup, modelId, objectId)` — puro: scandisce `idlookup` per un
   `DVertex` con `model === objectId` il cui `graph` appartiene a `modelId`. Testabile.
2. aprire il tab canvas del modello — `DockManager.open2(LModel)`
   (`components/abstract/DockManager.tsx:144`), che apre `TabDataMaker.model` e attiva
   il tab se esiste gia' (`open`, `:98-104`).
3. dispatch di `SELECT_NODE` con `{ nodeId: vertexId, modelId }`.

**Il vincolo temporale, dichiarato**: se il canvas non e' mai stato aperto, i vertici
degli oggetti **non esistono** — li crea `useJjomSync` al mount (Step 2). Quindi il
passo 3 non e' immediato: va tentato finche' il vertice compare, con un tetto (proposta:
poll ogni 100 ms fino a ~2 s, poi rinuncia in silenzio — il tab e' comunque aperto sul
modello giusto). L'alternativa — insegnare a `EditorV2` la mappa oggetto -> vertice —
sistemerebbe anche la Tree View, ma tocca un file fuori dal perimetro e va chiesta.

## 7. Reattivita' e caso stale (S3/S5)

Tutto il tab pende da **una** sottoscrizione (`InstanceManagerTab.tsx:907`,
`useSelector((state: any) => state?.idlookup)`) e ogni lista derivata e' un `useMemo`
su quella. Il vicinato e' la stessa cosa: cambiare padre a un oggetto cambia
`idlookup`, il memo si ricalcola, il riquadro segue. Non serve invalidazione dedicata,
e **non** va tenuta una copia dell'albero in stato locale (la ragione gia' scritta per
l'outline, `:942`).

**Costo**: per il soggetto, un `pointedBy` (lettura d'indice, non scansione) piu' un
`filledSlotValues` per ogni reference non-containment della sua metaclasse; per ogni
vicino, un `getName`/`getMetaclassName` e al piu' un `slotShapeFor`. Il costo e' il
**grado** del nodo, non la taglia del modello. L'unica scansione e' `vertexOfObject`,
che gira **solo** al click di «Open in canvas».

## 8. Perimetro proposto (Regola 19: 8 file sorgente -> pausa)

| # | File | Cosa cambia |
|---|------|-------------|
| 1 | `frontend/src/jjform/neighborhood.ts` (nuovo) | Il motore puro: tipi `NeighborNode`/`NeighborEdge`/`Neighborhood`, la regola di posizione (owner sopra, soggetto al centro, entranti a sinistra, uscenti a destra) e le etichette. Zero import, come il resto della directory. |
| 2 | `frontend/src/jjform/index.ts` | Solo export dei nuovi tipi e funzioni. |
| 3 | `frontend/src/jjform/__tests__/neighborhood.test.ts` (nuovo) | Layout e etichette su dati piatti. |
| 4 | `frontend/src/components/editor-v2/hooks/neighborhoodDraw.ts` (nuovo) | Il walk sull'`idlookup`, composto da `ownerOf` + `referencedBy` + `filledSlotValues` + `makeDrawReadCtx` + `slotShapeFor`/`detectValueRenderer`; piu' `vertexOfObject`. Importless. |
| 5 | `frontend/src/components/editor-v2/hooks/__tests__/neighborhoodDraw.test.ts` (nuovo) | Fixture a 4 livelli + ghost + le due `Config` con referrer distinti. |
| 6 | `frontend/src/components/editor-v2/hooks/neighborhoodAdapter.ts` (nuovo) | La sola meta' impura: apre il tab canvas e dispatcha `SELECT_NODE` col vertice (con il tetto di attesa). |
| 7 | `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` | `NeighborhoodPanel` (read-only) piu' il cablaggio: il memo del vicinato, il terzo emettitore di selezione, il bottone «Open in canvas». |
| 8 | `frontend/src/components/abstract/tabs/instanceManagerTab.scss` | Le classi del pannello nuovo. Nessuna variabile CSS (regola 28), token esistenti. |

Piu' i documenti: questo referto, la entry di log a fine task. **`docs/decisions.md` non
si tocca**: e' della parallela dichiarata dal prompt.

**Critical zone**: nessun file di §3.1 nel perimetro (`viewpoint/ir/` e' letto, mai
scritto; `useJjomSync.ts` e' letto, mai scritto). Nessun creatore D, nessuna
`TRANSACTION`, nessuna `SetFieldAction`: il riquadro **legge**. Layer Impact Report
quindi non dovuto; se la Fase 2 dovesse toccare `EditorV2.tsx` (variante di §6) il
quadro cambia e si chiede prima.

## 9. Domande aperte (rispondere prima della Fase 2)

**Q1 — dove sta il riquadro.** Il manager e' una riga flex di pannelli
(`instanceManagerTab.scss:29-53`): outline `0 0 300px`, metaclassi `0 0 200px`, tabella
`1 1 auto`, dettaglio `0 0 400px`. Il mock 1a e' una card a se' (form 200 + riquadro
440). Proposta: **quinto pannello a destra del dettaglio**, `flex: 0 0 360px` — cosi'
«accanto alla form» e' vero nella stessa relazione del mock, e la tabella conserva lo
slack. Costo: a 1600px la tabella scende a ~340px. Alternativa: il riquadro **sotto**
la form dentro il pannello dettaglio (nessuna larghezza persa, ma non e' «accanto»).

**Q2 — la regola del valore saliente** (§4): confermare «primo attributo non-`name` con
decisione diversa da `dash`», o preferire una scelta diversa (p.es. il primo attributo
`required`).

**Q3 — entranti a sinistra / uscenti a destra.** Il prompt lo dichiara come regola e
dice «come nel mock»; il mock 1a in realta' mette **entrambi** a destra (Idle in alto
con `← t1`, Paused in basso con `t2 →`) e lascia libera la sinistra. Procedo con la
regola scritta nel prompt (sinistra/destra), che e' anche la piu' leggibile, e lo
segnalo qui come deviazione consapevole dalla figura.

**Q4 — «Open in canvas» quando il canvas non e' mai stato aperto** (§6): confermo il
tetto di attesa (~2 s) e la rinuncia silenziosa? Oppure si preferisce un toast?

**Q5 — la variante che sistema anche la Tree View** (mappa oggetto -> vertice dentro
`EditorV2.tsx`): fuori scopo qui, ma va aperta come voce a se'?

## 10. File letti (path completi)

- `frontend/src/jjform/{shape.ts,outline.ts,nav.ts,index.ts}`
- `frontend/src/components/editor-v2/hooks/{outlineDraw.ts,createDraw.ts,shapeDraw.ts,shapeAdapter.ts,useJjomSelection.ts}`
- `frontend/src/components/editor-v2/hooks/__tests__/outlineDraw.test.ts`
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (Step 2, righe 700-800)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (righe 280-475)
- `frontend/src/components/editor-v2/EditorV2.tsx` (righe 118-124, 960-1020)
- `frontend/src/components/editor-v2/nodes/valueRenderer.ts` (superficie esportata)
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` (righe 1-180)
- `frontend/src/components/abstract/tabs/{InstanceManagerTab.tsx,instanceTable.ts,instanceManagerModel.ts,instanceManagerTab.scss,TabDataMaker.tsx}`
- `frontend/src/components/abstract/DockManager.tsx` (righe 60-180)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (righe 820-865, 2322-2372)
- `frontend/src/model/dataStructure/GraphDataElements.tsx` (righe 1662-1715)
- `frontend/src/events/registry.ts`
- `docs/design/design_handoff_instance_node/13a Diagramma Embedded.dc.html`
- `docs/PROTOCOL.md`, `CLAUDE.md`, `docs/decisions.md`, `docs/claude-code-log.md`

---

## 11. Addendum di Fase 2 — il vertice non basta (misurato 2026-08-31)

La Fase 1 (§6) aveva scritto: «si tenta finche' il vertice non compare». Falso in
un punto, e la Fase 2 l'ha misurato invece di supporlo (`_tmp_13a_race.ts`, dal
click su «Open in canvas»):

```
246ms  vertice=no  nodoDOM=0  nodiRF=0  selezionati=[]
532ms  vertice=si  nodoDOM=0  nodiRF=0  selezionati=[]
949ms  vertice=si  nodoDOM=1  nodiRF=8  selezionati=[]
```

Il `DVertex` compare a **532 ms**, il nodo React Flow entra nel DOM a **949 ms**.
Un `SELECT_NODE` emesso nel mezzo — cioe' esattamente quello che la prima stesura
dell'adapter emetteva — **va perduto**: `EditorV2` marca `selected` su una lista di
nodi che ancora non contiene quello, e la lista che `useJjomSync` consegna dopo
nasce deselezionata. Controllo positivo sulla stessa corsa: un dispaccio a mano a
**3.2 s** attacca (`selezionati: ["Pointer…119"]`).

Quindi la condizione d'attesa non e' il vertice nello store ma il NODO montato —
`.react-flow__node[data-id=…]`, l'attributo con cui React Flow marca ogni nodo. E'
una lettura del DOM da codice d'applicazione, dichiarata nel docstring
dell'adapter: l'alternativa senza di essa e' una raffica di dispacci alla cieca,
che rifarebbe partire l'animazione del viewport a ogni colpo. Il tetto resta i 2 s
ratificati (il caso misurato ne usa 0.95), e alla scadenza si tenta una volta alla
cieca prima di rinunciare in silenzio.

La verifica a schermo (`_tmp_13a_verify.ts`, 27 controlli, **ALL GREEN**) chiude il
punto col suo controllo negativo: l'id selezionato sul canvas e' quello del
vertice, e **non** quello del DObject — che e' il difetto registrato in §6 per la
Tree View, sempre aperto e non toccato qui.
