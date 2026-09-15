# Discovery — v2-flow reference delete pipeline ([diag1])

**Data**: 2026-05-24
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery (read-only + minimal diag instrumentation)
**Stato**: Step 1+2 completati; Step 3 (raccolta runtime) **da eseguire da Alfonso**.

---

## Fenomenologia accertata

User flow: crea DClass A, DClass B in v2-flow → crea reference `r` A→B (drag edge) → cancella `r` da canvas (Del o context menu) → chiudi tab metamodello → riapri.

**Esito atteso**: `r` non più presente.
**Esito reale**: `r` riappare come edge sul canvas al reload.

**Stato store dopo delete (verificato runtime)**:
- Model side **pulito**: `DReference: 0`, `DClass.references` vuoto, M1 instance side coerente.
- Graph side **sporco**: N `DEdge` con `className: 'DEdge'`, `isReference: true`, `start/end` puntano ai vertex di A/B, `model` punta a id di DReference inesistente. Ancora referenziati da `DGraph.subElements`, `DVertex.edgesOut/edgesIn`. `pointedBy: 5` per ciascuno.

Replica N=2: 2 DEdge orfani, 2 edge spurii al reload. Bug strutturale (non regressione recente).

---

## 1. Mappa statica entry point delete

### 1.1 Entry point dal canvas v2-flow

Tutti convergono su **una sola funzione di sync**: `canvasToJjom.syncDeleteEdge(edgeId, isInheritance)`.

| # | Entry point | File:linea | Path |
|---|-------------|------------|------|
| 1 | Tasto **Del / Backspace** con edge selezionato | `frontend/src/components/editor-v2/EditorV2.tsx:1928` | `onKeyDown` → `deleteSelected()` → loop `selectedEdges` → `syncDeleteEdge(edge.id, edge.type === 'inheritance')` (riga 1692) |
| 2 | Context menu su edge → "Delete reference" / "Delete inheritance" | `frontend/src/components/editor-v2/EditorV2.tsx:2390-2394` | `contextMenu.onClick` → `deleteEdge(edgeId)` (riga 1736) → `syncDeleteEdge(edgeId, edge.type === 'inheritance')` (riga 1744) |
| 3 | Cancellazione edge co-implicita con cancellazione nodo (batch delete) | `frontend/src/components/editor-v2/EditorV2.tsx:1659-1697` | Stesso path del #1: `deleteSelected()` raccoglie ogni edge selezionato in `selectedEdges` e li passa a `syncDeleteEdge` |

**Conclusione mappa entry point**: il sync layer ha un solo entry function (`syncDeleteEdge`). Nessuna duplicazione, nessun bypass.

### 1.2 Funzioni di sync delete trovate

```bash
grep "^export function syncDelete\|^export function syncRemove" src/components/editor-v2/sync/canvasToJjom.ts
```

| Funzione | File:linea | Firma | Note |
|----------|------------|-------|------|
| `syncDeleteVertex` | `canvasToJjom.ts:259` | `(vertexId: string)` | Pulisce **prima** i DEdge connessi via `graphProxy.edges` (commento esplicito: "Without this, orphan edges remain in graph.subElements"), **poi** cancella `modelElement`. |
| `syncDeleteEdge` | `canvasToJjom.ts:312` | `(edgeId: string, isInheritance: boolean)` | Branch `isInheritance: true` → riscrive `sourceClass.extends`. Branch `isInheritance: false` (reference) → `DeleteElementAction.new(refModel.__raw)`. **Nessuna cancellazione di `edgeProxy.__raw` (il DEdge sul graph side).** |
| `syncRemoveAttribute` | `canvasToJjom.ts:472` | `(attrId, _vertexId)` | Irrilevante per questo bug, citato per analogia. |
| `syncRemoveOperation` | `canvasToJjom.ts:542` | `(opId, vertexId)` | Idem. |
| `syncRemoveEnumLiteral` | `canvasToJjom.ts:594` | `(litId, vertexId)` | Idem. |
| `syncDeleteObject` | `canvasToJjom.ts:1513` | `(objectVertexId)` | M1 side, fuori scope. |

**Nessuna funzione `syncRemoveReference`** esiste in `canvasToJjom.ts`. Il delete reference è gestito interamente da `syncDeleteEdge` nel branch `isInheritance: false`.

### 1.3 Ipotesi causale aggiornata da analisi statica

Confronto chirurgico fra `syncDeleteVertex` (linee 259-305) e `syncDeleteEdge` (linee 312-342):

**`syncDeleteVertex`** — cancellazione di un nodo:
1. Trova `vertexProxy`.
2. Da `vertexProxy.graph.edges`, filtra `connectedEdges` (start o end == vertex).
3. **TRANSACTION 1**: per ogni connectedEdge → `DeleteElementAction.new(edge.__raw ?? edge)` (questa cancella il **DEdge graph side**).
4. **TRANSACTION 2**: `DeleteElementAction.new(modelElement.__raw)` (cancella DClass/DEnum model side).

**`syncDeleteEdge` (branch reference)** — cancellazione di un edge reference:
1. Trova `edgeProxy = LPointerTargetable.fromPointer(edgeId)`.
2. `refModel = edgeProxy.model` (la DReference model side).
3. **TRANSACTION**: `DeleteElementAction.new(refModel.__raw)` (cancella **solo** la DReference).
4. ❌ Mai cancellato `edgeProxy.__raw` (il DEdge graph side).

**Punto di omissione (ipotesi)**: linea 332-337 di `canvasToJjom.ts`. Manca, dentro la TRANSACTION del branch reference, una `DeleteElementAction.new(edgeProxy.__raw ?? edgeProxy)` per simmetria con `syncDeleteVertex`.

**Caveat sul branch inheritance** (linee 318-329): manipola solo `sourceClass.extends` e **non** cancella nemmeno `edgeProxy.__raw`. Possibile bug parallelo da verificare nello stesso run runtime. Out-of-scope di questo cluster, ma da menzionare nel report.

### 1.4 Diagramma testuale del flusso ipotizzato

```
[User: Del key / context menu / batch delete]
         │
         ▼
  EditorV2.tsx
  ┌─────────────────────────────────────────────┐
  │ deleteSelected / deleteEdge / deleteSelected│
  │   ↓                                          │
  │ syncDeleteEdge(edgeId, isInheritance)        │
  └─────────────────────────────────────────────┘
         │
         ▼
  canvasToJjom.ts:312
  ┌─────────────────────────────────────────────┐
  │ edgeProxy = LPointerTargetable.fromPointer  │
  │ refModel = edgeProxy.model  // DReference   │
  │                                              │
  │ TRANSACTION('EditorV2 delete edge', () => {  │
  │   DeleteElementAction.new(refModel.__raw)   │ ✅ DReference rimossa
  │   // ❌ edgeProxy.__raw NON cancellato       │ ← OMISSIONE IPOTIZZATA
  │ })                                           │
  └─────────────────────────────────────────────┘
         │
         ▼
  Stato D-layer post-delete:
  - idlookup[refId]    → undefined (PULITO)
  - idlookup[edgeId]   → ancora presente (SPORCO, orfano)
  - DGraph.subElements → contiene edgeId
  - DVertex.edgesOut   → contiene edgeId
  - DVertex.edgesIn    → contiene edgeId
         │
         ▼
  Reload tab metamodello:
  jjomToFlow legge edges da idlookup → ricostruisce visualmente
  N edge spurii (uno per ciascun delete non pulito).
```

**Falsificabili da `[diag1]` runtime**: confermare che `syncDeleteEdge` venga effettivamente chiamato (e una sola volta per ciascun delete UI), e che dopo la chiamata `idlookup[refId]` sia undefined ma `idlookup[edgeId]` ancora presente.

---

## 2. Trace runtime delete — `[diag1]` instrumentation

### 2.1 Punti instrumentati

`[diag1]` console.log con timestamp `performance.now()` aggiunti in:

| # | File:linea (approssimativa post-instrument) | Punto | Cosa logga |
|---|---------------------------------------------|-------|------------|
| 1 | `EditorV2.tsx` `deleteEdge` ingresso | Entry point context menu | edgeId, edge.type, presenza dell'edge in RF state |
| 2 | `EditorV2.tsx` `deleteSelected` ingresso | Entry point batch (Del key) | counts selectedNodes/selectedEdges, lista ids edge selezionati |
| 3 | `canvasToJjom.ts` `syncDeleteEdge` ingresso | Sync layer entry | edgeId, isInheritance, presenza dell'edgeProxy |
| 4 | `canvasToJjom.ts` `syncDeleteEdge` before-mutate | Pre-cancellazione store (branch reference) | refModelId, refModelPresentInStore, edgeIdPresentInStore |
| 5 | `canvasToJjom.ts` `syncDeleteEdge` after-mutate | Post-cancellazione store (branch reference) | refStillInStore, edgeStillInStore, graphSubElementsCount |

Nessuna instrumentation aggiunta al branch inheritance per questa discovery (bug parallelo sospetto ma fuori scope esplicito).

### 2.2 Output console runtime — DA RACCOGLIERE

> **Step 3 da eseguire da Alfonso** in browser session con DevTools console aperta.

#### Procedura

1. Aprire l'app, aprire o creare un progetto di test.
2. Aprire un metamodello vuoto in v2-flow editor (o creare M2 con 2 classi A e B).
3. **Snapshot PRE-TEST** in console:
   ```javascript
   (() => {
     const s = windoww.store.getState();
     const refs = Object.values(s.idlookup).filter(d => d?.className === 'DReference');
     const edges = Object.values(s.idlookup).filter(d => d?.className === 'DEdge');
     console.log('[diag1] PRE-TEST snapshot', {
       dReferenceCount: refs.length,
       dEdgeCount: edges.length,
       dEdgeIds: edges.map(d => d.id)
     });
   })();
   ```
4. Creare una reference `r` A→B trascinando un edge nel canvas.
5. **Snapshot POST-CREATE**:
   ```javascript
   (() => {
     const s = windoww.store.getState();
     const refs = Object.values(s.idlookup).filter(d => d?.className === 'DReference');
     const edges = Object.values(s.idlookup).filter(d => d?.className === 'DEdge');
     console.log('[diag1] POST-CREATE snapshot', {
       dReferenceCount: refs.length,
       dEdgeCount: edges.length,
       dReferences: refs.map(d => ({ id: d.id, name: d.name })),
       dEdges: edges.map(d => ({ id: d.id, model: d.model, isReference: d.isReference }))
     });
   })();
   ```
6. Cancellare `r` dal canvas v2-flow (selezionare edge, premere Del). Osservare i `[diag1]` che fire-ano in console.
7. **Snapshot POST-DELETE**:
   ```javascript
   (() => {
     const s = windoww.store.getState();
     const refs = Object.values(s.idlookup).filter(d => d?.className === 'DReference');
     const edges = Object.values(s.idlookup).filter(d => d?.className === 'DEdge');
     console.log('[diag1] POST-DELETE snapshot', {
       dReferenceCount: refs.length,
       dEdgeCount: edges.length,
       dReferences: refs.map(d => ({ id: d.id, name: d.name })),
       dEdges: edges.map(d => ({ id: d.id, model: d.model, isReference: d.isReference }))
     });
   })();
   ```
8. Ripetere con context menu (right-click su un edge → "Delete reference") per esercitare l'entry point #2.
9. Copia incolla l'output console qui sotto e ri-eseguire questo step a fronte di ulteriori esiti.

#### Output runtime (compilare)

```
[ atteso copia-incolla degli output [diag1] sequenziali + snapshot PRE/POST ]
```

#### Domande chiave a cui rispondere via runtime

- ✅ Il `syncDeleteEdge` viene effettivamente chiamato a ogni delete? (Verifica con `[diag1] sync/syncDeleteEdge entry`.)
- ✅ Il `refModel` viene effettivamente cancellato dallo store? (Verifica con `refStillInStore: false` in after-mutate.)
- ✅ L'`edgeProxy.__raw` (DEdge) sopravvive? (Verifica con `edgeStillInStore: true` in after-mutate.)
- ✅ Il `graphSubElementsCount` resta invariato a fronte del delete? (Conferma che il DEdge non viene scollegato dal grafo.)

Se le risposte sono `true / true / true / true` → l'ipotesi di omissione è confermata e Sezione 3 si applica così com'è. Se diverge, **rifare la sintesi prima del fix**.

---

## 3. Sintesi e raccomandazione fix — provvisoria pre-runtime

> **NOTA**: questa sezione è scritta sulla base della discovery statica (Sezione 1). Da rivalutare se il runtime (Sezione 2.2) mostra fatti incompatibili.

### 3.1 Pipeline ricostruita

Vedi Sezione 1.4. In sintesi: l'unico sync function `syncDeleteEdge` cancella la DReference ma non il DEdge graph side. La pulizia graph side **non è mai chiamata**, non è una chiamata fallita silenziosamente.

### 3.2 Punto di omissione

`frontend/src/components/editor-v2/sync/canvasToJjom.ts` linee 330-338, dentro il branch `isInheritance: false`. La TRANSACTION cancella solo `refModel.__raw` e non `edgeProxy.__raw`.

### 3.3 Opzioni di fix candidate (NON implementate)

**Opzione A** — fix chirurgico in `syncDeleteEdge`:
```typescript
// branch isInheritance: false
TRANSACTION('EditorV2 delete edge', () => {
    DeleteElementAction.new(refModel.__raw ?? refModel);
    DeleteElementAction.new(edgeProxy.__raw ?? edgeProxy);   // ← nuova riga
});
```
- **Pro**: minimal-diff (1 riga), simmetrico a `syncDeleteVertex`, mantiene scope nel sync layer.
- **Contro**: introduce due `DeleteElementAction.new` nella stessa TRANSACTION. Nessuna evidenza che sia problematico (sync layer è già TRANSACTION-aware), ma controllare comportamento side-effect ordering.
- **Rischio regressione**: basso. Il branch inheritance resta invariato. Il branch reference passa da cancellare 1 elemento a cancellarne 2 in atomic.

**Opzione B** — far chiamare a EditorV2 una seconda funzione `syncDeleteReferenceGraphEdge`:
```typescript
// EditorV2.tsx, in deleteSelected/deleteEdge
syncDeleteEdge(edge.id, edge.type === 'inheritance');
if (edge.type !== 'inheritance') syncDeleteReferenceGraphEdge(edge.id);
```
- **Pro**: esplicito su due livelli (model + graph) per il chiamante.
- **Contro**: invasivo (modifica 3 call site in EditorV2.tsx — riga 1692, riga 1744 e ogni altro futuro), e duplica la conoscenza di "due layer" nel chiamante. Non si allinea allo stile dei sync function già esistenti, che incapsulano l'intero cleanup (vedi `syncDeleteVertex`).
- **Rischio regressione**: medio. Ogni nuovo call site di delete edge richiede l'opt-in al cleanup graph side.

**Opzione C** — spostare cleanup graph side dentro `DReference.remove` (o equivalente metodo D-layer):
- **Pro**: cleanup strutturale, propaga a tutti i path di delete reference (anche non-canvas: pannello, JjScript, JjodieActionExecutor).
- **Contro**: forte rischio collaterale. `DReference` non sa nulla del graph layer per design (separazione di concerns model/graph). Aggiungere lookup graph side dentro D-layer è cross-cutting e potrebbe rompere assunzioni in altri loci. Probabilmente fuori scope.
- **Rischio regressione**: alto.

### 3.4 Raccomandazione

**Opzione A**. È simmetrica all'esistente `syncDeleteVertex`, minima, e non introduce knowledge di due layer al chiamante. Il sync layer è già il loco architetturale designato a sapere di entrambi i lati (model + graph), come dimostrato dal commento esplicito di `syncDeleteVertex` ("Without this, orphan edges remain..."). L'opzione A applica la stessa lezione al caso edge.

**Verifica pre-fix da fare in sessione successiva**:
1. Eseguire `[diag1]` runtime (Sezione 2.2) per confermare l'ipotesi.
2. Verificare che `LPointerTargetable.fromPointer(edgeId)` restituisce un proxy il cui `.__raw` è il DEdge corretto.
3. Verificare che `DeleteElementAction.new(edge.__raw)` pulisce anche `DGraph.subElements`, `DVertex.edgesOut`, `DVertex.edgesIn` (la mappa di reference reciproche). Confermato implicitamente dall'esistente `syncDeleteVertex` che usa lo stesso pattern.
4. Smoke test post-fix: A.4-edge (create→delete→reload, atteso PASS), test su delete-con-nodo (vertex delete deve continuare a funzionare immutato perché passa per `syncDeleteVertex`, non `syncDeleteEdge`).

### 3.5 Sospetto parallelo branch inheritance

Il branch `isInheritance: true` (linee 318-329) **non** cancella `edgeProxy.__raw` né dispatch alcuna `DeleteElementAction` sul DEdge. Manipola solo `sourceClass.extends`. Per simmetria fenomenologica, potrebbe lasciare DEdge inheritance orfani.

Non instrumentato in questa discovery (scope esplicito: reference). Da verificare con un secondo run [diag1] o, più pragmaticamente, da affrontare nel fix Opzione A estendendo simmetricamente anche al branch inheritance (1 riga aggiuntiva). Decisione in chat di fix successivo.

---

## 4. Riepilogo file toccati in discovery

| File | Tipo modifica | Da rimuovere in cleanup successivo |
|------|---------------|-----------------------------------|
| `docs/discovery/discovery_2026-05-24_v2flow_reference_delete.md` | nuovo | No (documento permanente) |
| `frontend/src/components/editor-v2/EditorV2.tsx` | `[diag1]` x 2 (deleteEdge, deleteSelected) | Sì |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | `[diag1]` x 3 (syncDeleteEdge entry, before-mutate, after-mutate) | Sì |
| `docs/claude-code-log.md` | nuova entry | No |
