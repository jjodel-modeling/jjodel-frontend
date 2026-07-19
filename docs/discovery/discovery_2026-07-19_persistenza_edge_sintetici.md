# Discovery — Persistenza su DVertex di waypoints, anchor e collasso (edge sintetici e graphVertex)

**Data**: 2026-07-19
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: Fase 1, discovery read-only. Nessuna modifica al codice. HARD STOP a report scritto.
**Decisione a monte (Alfonso, 2026-07-19)**: persistenza su campi opzionali additivi del DVertex — edge sintetico sul DVertex del nodo nascosto dell'oggetto; collasso sul DVertex del contenitore. Layout condiviso tra viewpoint, niente entità nuove, niente VersionFixer, rispetto di `persistWaypoints: false`, scrittura solo via write path canonico a fine gesto, undo/redo funzionante.

---

## 0. Obiettivo

Mappare (1) lo stato di sessione attuale degli override (waypoints, pin di lato, collasso), (2) il DVertex e il write path canonico di posizioni/size, (3) progettare i campi di persistenza e l'idratazione, (4) produrre il Layer Impact Report e il perimetro di Fase 2. Chiarire inoltre se DEdge esiste ancora come carrier alternativo.

## 1. File letti (path completi)

| File | Cosa vi ho verificato |
|------|----------------------|
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeInteraction.ts` (intero, 79 r.) | Store di sessione anchor/waypoints/selezione |
| `frontend/src/components/editor-v2/viewpoint/ir/irCollapseState.ts` (intero, 46 r.) | Store di sessione collasso |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (intero, 251 r.) | Sintesi object-as-edge, consumo override |
| `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (intero, 139 r.) | Wiring React, costruzione mappa override, segnali di invalidazione |
| `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` (intero, 201 r.) | Modello containment, computeHidden, lift-to-ancestor |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (sezione `CompiledEdgeView`) | Assenza di `persistWaypoints` nel compilato |
| `frontend/src/components/editor-v2/EditorV2.tsx` (diff dei 3 commit + righe 2050–2130, 3230–3360, 1370–1395) | handleEdgeChange, handleReconnect, onEdgesChange, undo/redo, drag-end write path |
| `frontend/src/components/editor-v2/edges/SegmentHandles.tsx` (righe 70–150) | Timing del commit waypoints (mouseup) |
| `frontend/src/components/editor-v2/edges/EndpointHandles.tsx` (righe 120–175) | Timing e payload del pin di lato (mouseup) |
| `frontend/src/components/editor-v2/types.ts` (righe 120–240) | Shape `EdgeWaypoint`, `AnchorConfig`, `AnchorSide` |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (testata + righe 1–100, 1530–1680, indice funzioni) | Write path posizioni/size, reconcileJjomAfterUndoRedo |
| `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts` (intero, 85 r.) | Autosave layout post drag-end |
| `frontend/src/model/dataStructure/GraphDataElements.tsx` (righe 80–135, 1321–1900 + indice classi) | DGraphElement, DVoidVertex, DVertex, DGraphVertex, DVoidEdge/DEdge |
| `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (grep mirato) | Precedente `ghostOffsets` (write path campi opzionali DVertex) |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (grep mirato) | Precedente lettura `__raw.ghostOffsets` |
| `frontend/src/api/persistance/projects.ts` (righe 1–120) | `ProjectsApi.save` |
| `frontend/src/common/U.tsx` (righe 415–460) | `compressedState` — serializzazione generica |
| `frontend/src/redux/action/action.ts` (righe 200–290 + grep UndoAction) | Semantica TRANSACTION, undo joiner |
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (righe 270–310 + grep mirati) | DGraph per-modello, DVertex.new/DVoidEdge.new2 |
| `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (intero, 210 r.) | Sez. 7 (`persistWaypoints`, gap #6), sez. 8 (collasso) |
| Commit `f5c51f130`, `9b404d280`, `dabeac79a` (`git show` completo su EditorV2.tsx + stat) | Origine degli override di sessione |

## 2. Findings — stato di sessione attuale

### 2.1 Struttura dati e proprietari

Due singleton di modulo (fuori Redux, per scelta documentata nei file: "view state come lo zoom"):

**`irEdgeInteraction.ts`** — `anchorOverrides: Map<objectId, IRAnchorOverride>` con:

```typescript
interface IRAnchorOverride {
    sourceHandle?: string;   // handle id esplicito da reconnect RF, formato `${side}-${index}`
    targetHandle?: string;
    sourceSide?: string;     // pin di lato da EndpointHandles ('top'|'right'|'bottom'|'left')
    targetSide?: string;
    waypoints?: unknown[];   // in pratica EdgeWaypoint[] = {segmentIndex: number, offset: number}[]
}
```

Chiave = **objectId dell'oggetto-edge** (non l'id RF `irobj_*`), quindi gli override sopravvivono alla ri-sintesi. Più `selectedSynthetic: Set<edgeId>` per la selezione (fuori scope persistenza). Versione + `useSyncExternalStore` per la reattività.

**`irCollapseState.ts`** — `collapsed: Set<objectId>` (assenza = espanso) + versione + hook.

### 2.2 Chi scrive

| Gesto | Percorso | Timing |
|-------|----------|--------|
| Drag segmento (waypoint) | `SegmentHandles.tsx` onMouseUp → `editorCtx.onEdgeDataChange(edgeId, {data:{waypoints}})` → `EditorV2.handleEdgeChange` ramo `irobj_` (r. ~3055) → `setIREdgeAnchorOverride(objectId, {waypoints})` | **Solo a fine gesto** (durante il drag muta solo il transform CSS dell'handle) |
| Pin di lato endpoint | `EndpointHandles.tsx` onMouseUp → `onEdgeDataChange(edgeId, {data:{sourceAnchor/targetAnchor: {mode:'pinned', side}}})` → stesso ramo → `setIREdgeAnchorOverride(objectId, {sourceSide/targetSide})` | Solo a fine gesto |
| Reconnect RF (drop su handle) | `EditorV2.handleReconnect` ramo `irObjectAsEdge` (r. ~1631): se endpoint spostato su altro nodo → riscrittura slot via proxy L (`slot.value = newObjId`); in ogni caso `setIREdgeAnchorOverride(objectId, {sourceHandle, targetHandle})` | A fine gesto |
| Toggle collasso | `ObjectNode.tsx:400` (chevron) e `IRContainmentHulls.tsx:91` (bottone hull) → `toggleCollapsed(objectId)` | Click |

Nessuna scrittura per-frame in nessun percorso. Il ramo `irobj_` di `handleEdgeChange` fa **early-return prima di `takeSnapshot()`**: i gesti sui sintetici oggi non entrano nemmeno nell'undo RF.

### 2.3 Chi legge

- `useIRContainment.ts` (r. 119–126): costruisce `overrides: Map<objectId, override>` dal singleton e la passa a `synthesizeObjectAsEdges`.
- `irEdgeViews.ts` `synthesizeObjectAsEdges` (r. 229–248): parte dall'assegnazione geometrica (`assignGeometricHandles`), poi l'override vince — `sourceHandle` esplicito ha precedenza sul lato (`sourceSide` → handle `${side}-${freeIndex}` calcolato al momento); `waypoints` ricopiati in `edge.data.waypoints` (consumati da `UnifiedEdge` via `applyWaypoints`).
- `useIRContainment.ts` (r. 112): `computeHidden(model, getCollapsedSet())` → `decorateNodes`/`decorateEdges` (lift-to-ancestor, soppressione, `__irlift`).

### 2.4 Ciclo di vita (cosa li azzera)

**Niente li azzera se non il reload della pagina.** I singleton non hanno API di clear per gli override (solo la selezione viene pulita su pane click). Sopravvivono a switch di viewpoint, chiusura/riapertura tab, perfino a cambio progetto nella stessa sessione (chiave = objectId, residui cross-progetto inerti ma presenti). Al refresh si perde tutto: è esattamente il gap che la persistenza chiude.

Nota: per gli edge base (non sintetici) esiste la regola R2 (EditorV2 r. ~2968): un flip di lato invalida i waypoints. Per i sintetici non c'è invalidazione equivalente — ma i lati pinnati impediscono il flip geometrico; comportamento attuale, invariato dalla persistenza.

## 3. Findings — DVertex e write path

### 3.1 Campi esistenti del DVertex (`GraphDataElements.tsx:1664`)

Ereditati/propri: `id, graph, model, isSelected, subElements, zoom, x, y, w, h, isResized, snap?` e — **precedente decisivo** — due campi opzionali additivi già committati con la stessa semantica richiesta:

```typescript
// Persisted per-reference drag offset of cross-MM ghost-target chips, keyed by refId.
ghostOffsets?: { [refId: string]: { dx: number; dy: number } };
// Persisted per-parent drag offset of cross-MM ghost-parent chips, keyed by super-type DClass id.
ghostParentOffsets?: { [classId: string]: { dx: number; dy: number } };
```

Pattern del precedente:
- **scrittura** (`ClassNode.tsx:98`): `TRANSACTION('persist ghost offset', () => { SetFieldAction.new(id, 'ghostOffsets', map, undefined, false); })` — oggetto intero riscritto a fine gesto, senza `markCanvasUpdated`;
- **lettura** (`jjomTransformers.ts:111,130`): `(vertex.__raw ?? vertex).ghostOffsets` — lettura D-diretta, nessuna dichiarazione su LVertex, nessun getter/setter custom;
- tipi letterali inline nel D-file (nessun import dal layer componenti — evita la dipendenza invertita model → components).

### 3.2 Write path posizioni/size (riferimento canonico)

`canvasToJjom.ts:43-78`: `syncPositionToJjom` / `syncPositionBatchToJjom` / `syncSizeToJjom` = `markCanvasUpdated(vertexId)` (anti-bounce: il sync JjOM→RF salta la ri-trasformazione) + `TRANSACTION('EditorV2 drag', () => SetFieldAction.new(vertexId,'x'/'y',...))`. Chiamate da `EditorV2.onNodesChange` **a fine drag** (lazy mode, r. 3256–3268) o via RAF-throttle in faithful mode con flush a fine drag. Dopo il commit: `scheduleLayoutSave()` (r. 3278) → `useLayoutAutosave` → debounce 1s → `ProjectsApi.save(project)` (salvataggio progetto completo, gated dalla preferenza `autosaveLayout`).

TRANSACTION qui è **lecita** (§3.3 CLAUDE.md: la proibizione riguarda i wrap di `DVertex.new`/`DVoidEdge.new2` in zona sync, non i gesture handler).

Nota sul precedente: le scritture `ghostOffsets` in ClassNode **non** chiamano `scheduleLayoutSave` (persistono solo al prossimo save esplicito/autosave altrui). Per i campi nuovi propongo di chiamarlo (vedi §5).

### 3.3 Serializzazione generica

`ProjectsApi.save` → `U.compressedState` (`U.tsx:427`): `JSON.stringify` dell'**intero state** (idlookup compreso), compresso UTF16. Qualsiasi campo opzionale JSON-safe sul D-object viaggia automaticamente. Unico scrub: `isSelected` azzerato (r. 432) — i campi proposti non sono toccati. Al load: `VersionFixer` gira ma non serve alcuna migrazione (campi opzionali, `undefined` = comportamento attuale). Shape proposte tutte JSON-safe (stringhe, numeri, boolean, array/oggetti piatti).

### 3.4 Esposizione al proxy L

Non necessaria: il precedente legge da `__raw`/idlookup. L'idratazione proposta legge direttamente `idlookup[vertexId]` dentro il modulo IR (pattern già usato ovunque nel modulo: `irReadCtx`, `oaeSlotsSig`). Nessuna modifica a `LVertex`.

### 3.5 DEdge esiste ancora? (accertamento richiesto)

Sì, come classe e come istanze: `DVoidEdge` (`GraphDataElements.tsx:1835`) e `DEdge` (`:2716`) esistono; `useJjomSync` Step 3/4 e `useM1ReferenceEdges` creano tuttora `DVoidEdge.new2` per gli edge M1/M2 **reali** (reference, inheritance). `DVoidEdge` porta ancora i campi classic-era `anchorStart?`, `anchorEnd?`, `segmentOffsets?` (consumati dal renderer classic, non da v2-flow).

**Ma l'edge sintetico object-as-edge non ha alcun D-carrier**: esiste solo nell'array RF decorato (`irobj_${objectId}`, creato da `synthesizeObjectAsEdges`). Il DVertex del nodo nascosto (creato normalmente da `useJjomSync` per l'oggetto, poi `hidden: true` dalla decorazione) è l'**unico substrato esistente** senza introdurre entità nuove — la decisione di Alfonso è coerente con lo stato del codice. Per gli edge reali non-sintetici (fuori scope di questa fase) il carrier naturale sarebbe invece `DVoidEdge` (gap #6 in senso lato, vedi domanda aperta D1).

### 3.6 Layout condiviso tra viewpoint — meccanismo confermato

Il DGraph v2-flow è **per modello** (`useJjomSync.ts:282`: `g.model === modelid && graphStyle === 'v2-flow'`), non per viewpoint. I viewpoint decorano lo stesso canvas → campi sul DVertex condivisi tra viewpoint, stessa semantica delle posizioni. Se un altro viewpoint rende l'oggetto come nodo, i campi restano inutilizzati ma agganciati a un'identità viva (il DVertex si cancella con l'oggetto → nessun orfano).

### 3.7 Undo/redo — stato di fatto

Sistema **duale** (debito tecnico documentato, `docs/reports/2026-04-23-undo-attr-zero-analysis.md`):
- EditorV2: `useHistory` con snapshot RF (nodes/edges) + `reconcileJjomAfterUndoRedo` che riconcilia **solo gli attributi** delle classi (non posizioni, non D-layer generico);
- joiner: `UndoAction` Redux-level, non collegato a Ctrl+Z di EditorV2.

Oggi: i gesti sui sintetici e il collasso **non sono già undoabili** (early-return prima di `takeSnapshot`; toggle senza snapshot). Le posizioni stesse hanno undo solo lato RF (il D-layer non viene ripristinato). La persistenza proposta **non degrada nulla**: scrive a fine gesto come le posizioni e eredita esattamente la loro semantica di undo. Renderli undoabili è un'estensione possibile (snapshot dei due store di sessione in `useHistory`) ma è una decisione separata (domanda aperta D2).

### 3.8 `persistWaypoints` non è compilato

`grep persistWaypoints` nel modulo `ir/` = **zero hit**. Il flag esiste solo nella spec (sez. 7, default `true`). `CompiledEdgeView` (`irTypes.ts:185`) non lo porta; `compileEdgeView` (`irCompile.ts:321`) non lo legge. La Fase 2 deve aggiungerlo al compilato per poter rispettare l'opt-out.

## 4. Proposta campi (progetto, non implementazione)

Due campi opzionali additivi su `DVertex` (`GraphDataElements.tsx`, accanto a `ghostOffsets`), tipi letterali inline come da precedente:

```typescript
// Persisted IR object-as-edge layout overrides (side pins + Manhattan waypoints),
// carried by the hidden edge-object's vertex. undefined = fully derived routing.
irEdgeLayout?: {
    sourceSide?: 'top' | 'right' | 'bottom' | 'left';
    targetSide?: 'top' | 'right' | 'bottom' | 'left';
    waypoints?: { segmentIndex: number; offset: number }[];
};
// Persisted collapse state of an IR graphVertex container. undefined = expanded.
irCollapsed?: boolean;
```

**Verifica collisioni (grep globale su frontend/src)**: `irEdgeLayout` → 0 occorrenze; `irCollapsed` → 0 occorrenze. Scartato il nome nudo `collapsed` (collide concettualmente con `Containment.collapsed` dell'IR schema in `irTypes.ts:127` e con vari prop UI). Scartati anche `edgeAnchors`/`edgeWaypoints` (liberi ma meno specifici; il prefisso `ir` marca l'origine della feature come per `irObjectAsEdge`, `irLifted`).

**Decisioni di shape**:
1. **Si persistono i lati, non gli handle id**: il formato handle `${side}-${index}` ha l'indice calcolato con `freeHandleIndex` contro gli edge presenti *in quel momento* — è sessione-relativo. Dal `sourceHandle` esplicito del reconnect si deriva il lato (`handle.split('-')[0]`) al momento della scrittura. Alla ri-sintesi il free-index viene ricalcolato (già così per i `sourceSide` di sessione).
2. **Waypoints come `EdgeWaypoint[]`** ({segmentIndex, offset}), la stessa shape prodotta da SegmentHandles e consumata da `applyWaypoints` — nessuna conversione.
3. **`irCollapsed` sul DVertex del contenitore** (l'objectId si ricava da `vertex.model`, mappa già in `ContainmentModel.objByVertex`).
4. Scrittura dell'**oggetto intero** `irEdgeLayout` per gesto (come `ghostOffsets`), merge con l'eventuale valore precedente fatto dal chiamante — un solo `SetFieldAction` per gesto.

**Write path proposto** (Fase 2): due funzioni foglia in `canvasToJjom.ts`, famiglia `syncPositionToJjom`:

```typescript
syncIREdgeLayoutToJjom(vertexId, layout)   // TRANSACTION + SetFieldAction.new(vertexId, 'irEdgeLayout', layout, undefined, false)
syncIRCollapsedToJjom(vertexId, collapsed) // TRANSACTION + SetFieldAction.new(vertexId, 'irCollapsed', collapsed, undefined, false)
```

Chiamate dai punti dove oggi si scrive il singleton (ramo `irobj_` di `handleEdgeChange`, ramo sintetico di `handleReconnect`, i due toggle di collasso), seguite da `scheduleLayoutSave()`. Punto da chiudere in Fase 2: se serve `markCanvasUpdated(vertexId)` (il precedente `ghostOffsets` non lo usa e non risultano bounce; i campi non sono letti dai transformer di posizione — prima ipotesi: non serve, da verificare con smoke test).

**Gate `persistWaypoints`**: aggiunta di `persistWaypoints: boolean` a `CompiledEdgeView` (da `ir.edge.persistWaypoints ?? true` in `compileEdgeView`). A `false`: niente scrittura D (override resta di sessione) e niente idratazione per gli oggetti la cui view risolta lo dichiara. Interpretazione letterale della spec: il flag governa i waypoints; per i pin di lato vedi domanda aperta D3.

## 5. Progetto dell'idratazione

**Principio**: i singleton di sessione restano l'unica fonte runtime (nessuna lettura Redux per-frame, nessun nuovo selettore caldo). La persistenza è un livello sotto: si idrata una volta, si scrive-through a fine gesto.

1. **Seed una-tantum per graph**: un effetto (hook dedicato, es. `useIRPersistedLayout(graphId)` montato in EditorV2 accanto a `useIRContainment`, oppure interno a `useIRContainment`) che al mount del graph legge `store.getState().idlookup`, itera i `subElements` del DGraph e per ogni DVertex con campi valorizzati fa il seed:
   - `irEdgeLayout` → `setIREdgeAnchorOverride(vertex.model, {sourceSide, targetSide, waypoints})` **solo se la chiave non è già presente** (sessione vince);
   - `irCollapsed === true` → add nel Set di collasso.
   Un `Set<graphId>` a livello di modulo marca i graph già idratati: il seed non si ripete (altrimenti un expand dell'utente — assenza dal Set — verrebbe ri-collassato dal seed). Le API di seed vanno aggiunte ai due moduli di stato (`hydrateIREdgeOverrides`, `hydrateCollapsed` o simili) senza bump di versione se il seed non cambia nulla.
2. **Write-through a fine gesto**: ogni gesto scrive prima il singleton (reattività immediata via `edgeInteractionVersion`/`collapseVersion`, invariata) poi il D-layer via le funzioni di §4. Dopo il primo gesto sessione e persistito coincidono per costruzione.
3. **Precedenza sessione-vs-persistito durante il gesto**: sessione vince sempre — il merge è "persistito come base, sessione sopra", realizzato dal seed-solo-se-assente + write-through. `synthesizeObjectAsEdges` non cambia (continua a ricevere la mappa dal singleton).
4. **Timing**: il seed non dipende dai nodi RF (legge il D-layer), quindi può girare al primo mount con `graphId` disponibile; la decorazione consumerà gli override alla prima sintesi utile. Switch di viewpoint: nessun re-seed necessario (write-through tiene allineato il D-layer).
5. **Risoluzione vertexId → objectId**: `vertex.model` (già usato da `buildContainmentModel`). Per la scrittura, objectId → vertexId via `model.vertexByObj` (disponibile in EditorV2 dalla decoration) o `ContainerInfo.vertexId` per il collasso; ObjectNode conosce direttamente il proprio node id.

Alternativa considerata e scartata: leggere i campi direttamente nel pass di sintesi/collasso senza singleton (fonte unica D-layer). Scartata perché richiederebbe un nuovo selettore di invalidazione sui campi DVertex nel memo di `useIRContainment` (oggi invalidato solo da nodes/edges/irSig/le due versioni/oaeSlotsSig) e sposterebbe in Redux uno stato che durante il gesto deve restare fuori (filosofia documentata nei due moduli).

## 6. LAYER IMPACT REPORT (per la Fase 2 proposta)

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)        — DVertex: +2 campi opzionali additivi
  [ ] L-layer (computed proxies)      — NON toccato (lettura via idlookup/__raw, precedente ghostOffsets)
  [ ] JjOM (model entities)           — NON toccato (nessuna modifica a DObject/DClass/DValue)
  [x] Canvas v2-flow                  — EditorV2: write-through nei rami irobj_ esistenti + hook di seed;
                                        ObjectNode/IRContainmentHulls: write-through sul toggle
  [ ] Canvas classic                  — NON toccato (il classic non legge i campi nuovi)
  [x] Sync layer (useJjomSync hooks)  — SOLO canvasToJjom: +2 funzioni foglia nuove; nessuna modifica a
                                        funzioni esistenti, né a useJjomSync/syncState/portDistribution/
                                        useM1ReferenceEdges
  [x] Persistence                     — serializzazione generica (U.compressedState) trasporta i campi
                                        automaticamente; NESSUN VersionFixer (undefined = comportamento
                                        attuale); jsxString non coinvolto

D-layer:
  - Cambia: DVertex guadagna irEdgeLayout? e irCollapsed? (tipi letterali inline, JSON-safe).
  - NON cambia: nessun campo esistente, nessun costruttore, nessuna classe D/L rinominata o estesa
    altrove; DVoidEdge intatto (anchorStart/anchorEnd/segmentOffsets classic-era restano).
  - Cross-layer: i campi viaggiano nel save (JSON.stringify dello state) e tornano al load senza
    migrazione; lo scrub di compressedState tocca solo isSelected.
  - Side-effect safety: SetFieldAction su vertex esistente non altera subElements né i contatori dei
    selettori di useJjomSync (Step 3/4 non ri-sparano strutturalmente). Da verificare in Fase 2 se il
    cambio idlookup del vertex nascosto inneschi ri-trasformazioni indesiderate (ipotesi: no, come per
    ghostOffsets che non usa markCanvasUpdated; smoke test dedicato).

Canvas v2-flow:
  - Cambia: i 4 punti di scrittura sessione (handleEdgeChange irobj_, handleReconnect sintetico,
    2 toggle collasso) aggiungono il write-through + scheduleLayoutSave; nuovo effetto di seed.
  - NON cambia: la sintesi (synthesizeObjectAsEdges), la decorazione collasso, la selezione sintetica,
    onEdgesChange, il flusso base degli edge reali; con campi undefined il comportamento è
    bit-identico all'attuale.
  - Cross-layer: TRANSACTION nei gesture handler = zona lecita (§3.3); NESSUN wrap di DVertex.new /
    DVoidEdge.new2 (regole 12-13 rispettate: non si creano edge D, quindi hasCanvasEdgePair non è
    coinvolto).

Sync layer (canvasToJjom):
  - Cambia: +syncIREdgeLayoutToJjom, +syncIRCollapsedToJjom (foglie, stessa famiglia di
    syncPositionToJjom).
  - NON cambia: tutte le funzioni esistenti, reconcileJjomAfterUndoRedo, il write-back di
    posizioni/size.
  - Undo/redo: i gesti sintetici e il collasso oggi NON sono undoabili (early-return prima di
    takeSnapshot); la persistenza eredita la semantica delle posizioni (scrittura a fine gesto non
    revocata da Ctrl+Z — dual undo system, debito noto). Nessuna regressione; estensione undoabile =
    decisione separata (D2).

Persistence:
  - Cambia: i campi entrano nel salvataggio progetto; scheduleLayoutSave chiamato anche dai gesti IR.
  - NON cambia: VersionFixer (nessuna migrazione), formato progetto (campi opzionali additivi),
    default view / jsxString (regola 14 non innescata).

Smoke-test scenarios potenzialmente impattati (per la Fase 2):
  - Progetto con object-as-edge: drag segmento → refresh → waypoint identico (offset numerico).
  - Pin endpoint su lato → refresh → stesso lato; reconnect su handle esplicito → refresh → stesso lato.
  - Collasso contenitore → refresh → ancora collassato con badge; expand → refresh → espanso.
  - View con persistWaypoints:false → gesto → refresh → routing derivato (override non persistito).
  - Secondo viewpoint che rende l'oggetto come nodo: campi inerti, nodo normale, nessun crash.
  - Save → close → reopen: stato identico; progetto pre-esistente senza campi: comportamento attuale.
  - Delete dell'oggetto-edge: vertex cancellato → campi spariti con lui (no orfani).
  - Undo dopo gesto: comportamento documentato (non revoca; nessuna corruzione degli stack).
  - Edge reali (reference/inheritance M1/M2): waypoints/anchor di sessione invariati (fuori scope).

Uncertain about propagation? → l'unico punto aperto è l'anti-bounce (markCanvasUpdated) sul write dei
campi nuovi: ipotesi motivata "non serve" dal precedente ghostOffsets, da confermare con smoke test
prima del commit di Fase 2.
```

## 7. Perimetro stimato di Fase 2

File da toccare (9 — oltre soglia regola 19: la lista va confermata nel prompt di Fase 2):

1. `frontend/src/model/dataStructure/GraphDataElements.tsx` — +2 campi opzionali su DVertex (D-only).
2. `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — +2 funzioni foglia (critical zone → LIR aggiornato in chat prima del diff).
3. `frontend/src/components/editor-v2/viewpoint/ir/irEdgeInteraction.ts` — API di seed (hydrate, guard per-graph).
4. `frontend/src/components/editor-v2/viewpoint/ir/irCollapseState.ts` — API di seed.
5. `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — `persistWaypoints` in `CompiledEdgeView` (+ eventuale campo su `EdgeViewIR` se non già passante).
6. `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` — compilazione del flag.
7. `frontend/src/components/editor-v2/EditorV2.tsx` — write-through nei 2 rami sintetici + hook di seed + scheduleLayoutSave.
8. `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` — write-through toggle (o helper condiviso).
9. `frontend/src/components/editor-v2/viewpoint/ir/IRContainmentHulls.tsx` — idem.

Test: estensione di `viewpoint/ir/__tests__/ir.test.ts` (merge precedenza persistito/sessione se estratto in funzione pura; gate persistWaypoints in compileEdgeView). Le funzioni canvasToJjom foglia non hanno harness di test esistente (nessun test per syncPositionToJjom): verifica via smoke test.

Gate di verifica: `npm run build` pass; `npm run typecheck` senza aumento della baseline (riferimento: 33 errori); smoke test §6.

Rischi residui:
- anti-bounce (punto aperto §6);
- doppio seed se il guard per-graph non copre il re-mount del componente con singleton già popolato (mitigato dal Set di modulo);
- stale waypoints su cambi drastici di geometria (già vero in sessione; nessuna invalidazione R2 per i sintetici — accettato come comportamento attuale);
- residui cross-progetto nei singleton (pre-esistente, inerte; eventuale clear su cambio progetto è fuori scope).

## 8. Domande aperte per Alfonso

- **D1 — Edge reali (non sintetici)**: la spec sez. 7 fa diventare persistiti i waypoints degli edge RF in generale (gap #6), carrier "DEdge/DVertex esistente". Questa fase copre solo sintetici + collasso. La persistenza per gli edge reference/inheritance reali (carrier naturale: `DVoidEdge`, che ha già i campi classic-era ma non nel formato v2) resta una fase successiva separata — confermi?
- **D2 — Undo**: "undo/redo deve funzionare" lo leggo come "nessuna regressione e nessuna corruzione" (i gesti sintetici oggi non sono undoabili; la persistenza eredita la semantica delle posizioni). Se invece vuoi che Ctrl+Z revochi waypoint/pin/collasso, serve estendere gli snapshot di `useHistory` ai due store di sessione — scelta separata con trade-off (il dual undo system è debito noto). Quale delle due?
- **D3 — Perimetro di `persistWaypoints: false`**: letteralmente il flag governa i waypoints. I pin di lato sono anch'essi routing: l'opt-out li copre (flag = "layout dell'edge sempre derivato") o persiste comunque i lati? Propongo la lettura estesa (copre entrambi) per coerenza d'intento, ma la spec letterale dice solo waypoints.
- **D4 — Nomi campo**: `irEdgeLayout` + `irCollapsed` (verificati senza collisioni). Ok o preferisci altri nomi?

## 9. Ratifica delle domande aperte (Alfonso, 2026-07-19, stessa sessione)

- **D1 → fase separata**: la Fase 2 copre solo edge sintetici + collasso; la persistenza degli edge reali (carrier DVoidEdge) sarà una fase successiva con discovery propria.
- **D2 → nessuna regressione**: "undo/redo deve funzionare" = semantica delle posizioni (scrittura a fine gesto non revocata da Ctrl+Z, nessuna corruzione degli stack). Nessuna estensione di `useHistory`.
- **D3 → lettura estesa**: `persistWaypoints: false` = "layout dell'edge sempre derivato" — a `false` non si persistono né waypoints né pin di lato.
- **D4 → nomi confermati**: `irEdgeLayout` + `irCollapsed`.

Il documento è chiuso: il prompt di Fase 2 può recepire il perimetro §7 (9 file, da confermare esplicitamente per la regola 19) senza altre decisioni pendenti. Resta l'unico punto tecnico aperto da chiudere in Fase 2 con smoke test: necessità o meno di `markCanvasUpdated` sul write dei campi nuovi (§6).
