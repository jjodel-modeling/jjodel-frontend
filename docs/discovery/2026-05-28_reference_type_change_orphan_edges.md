# Discovery — Reference Type change → orphan edges nel canvas v2-flow

**Data**: 2026-05-28
**Tipo**: discovery osservazionale, READ-ONLY (nessuna modifica al codice produttivo)
**Branch**: `alfonso-frontend-jjtl`
**Documento prompt**: 2026-05-28 21:00 — discovery_reference_type_change_orphan_edges
**Fixture**: `metamodel_2`, reference `dean` (DReference `Pointer1779719945861_USER_206`), cambio Type `Full Professor → Associate Professor` (nuovo type pointer `Pointer1779666666862_USER_282`). Dati D-layer dalla console di Alfonso.

---

## 0. Sintesi (TL;DR)

L'ipotesi di partenza è **confermata nella sostanza, ma il meccanismo del bug LIVE va corretto**. L'edge che rappresenta una `DReference` M2 nel canvas v2-flow è un **`DVoidEdge` persistito** in `DGraph.subElements`, con `model` = id della `DReference` (back-reference esplicita), `start`/`end` = id dei **vertici** sorgente/target risolti **al momento della creazione** da `DReference.type`. Quando `type` cambia, **nessuno ri-punta `end`**: l'`end` resta il vecchio vertice (Full Professor).

La correzione importante alla premessa del prompt: **un effect SÌ reagisce** al cambio di `type` — l'incremental-sync di `useJjomSync` (`useJjomSync.ts:907`) rifà partire perché il suo selettore `elementSnapshots` include nell'hash del vertice sorgente i `child.type` delle reference (`:773-776`). Ma quell'effect **ri-trasforma l'edge esistente in modo inerte**: `jjomEdgeToRFEdge` deriva il target da `edge.end` (vertice cachato), **mai** da `edge.model.type` (la reference live). L'effect che invece *creerebbe* l'edge corretto (l'auto-populate Step 3, deps a `:738`) **non** rifà partire, perché le sue deps contano `cls.references.length` (`modelRefCount`, `:322-337`), non i `type`. Risultato LIVE: la freccia resta su Full Professor, nessuna nuova freccia.

POST-RELOAD: l'init transform (`:860-877`) ridisegna il `DVoidEdge` vecchio (end = Full Professor: il vertice esiste ancora → non è orfano per il filtro), e l'auto-populate al mount crea un **secondo** `DVoidEdge` verso Associate Professor (chiave composita diversa → non dedotto come duplicato). Due frecce. Il vecchio non viene mai rimosso: nessun GC controlla la coerenza `edge.end` ↔ `edge.model.type`.

**Hard stop**: nessuno innescato (HS1/HS2/HS3/HS4 — vedi §8). HS2 è *sfiorato* ma non attivato: l'incremental-sync reagisce ma è inerte sulla topologia, non è un "effect dedicato che dovrebbe già correggere il bug".

**Famiglia di bug**: identica per meccanismo al bug di *delete reference da canvas* documentato in `discovery_2026-05-24_v2flow_reference_delete.md` (graph-side `DEdge` non riconciliato col model-side). Quel caso è **già stato corretto** (`canvasToJjom.ts:339` ora cancella anche `edgeProxy.__raw`); il caso Type-change è la stessa lezione **non ancora applicata**.

---

## 1. Architettura dell'edge per `DReference` M2 (risposta a §3.1)

### 1.1 Quale classe rappresenta l'edge persistito

Un **`DVoidEdge`** (classe `DEdge`, `className` contiene `"Edge"`). Creato via `DVoidEdge.new2(...)`. Vive in `DGraph.subElements` del grafo `graphStyle === 'v2-flow'` del modello, e nei `DVertex.edgesOut`/`edgesIn` reciproci (settati dal builder, `classes.ts:1017-1018`).

Firma del costruttore (`frontend/src/model/dataStructure/GraphDataElements.tsx:1874-1880`):

```typescript
public static new2(model, parentNodeID, graphID, nodeID, start, end, setter): DEdge {
    return new Constructors(new DEdge('dwc'), parentNodeID, true, undefined, nodeID)
        .DPointerTargetable()
        .DGraphElement(model, graphID)   // ← thiss.model = model
        .DVoidEdge(start, end)           // ← thiss.start = start, thiss.end = end
        .end(setter);
}
```

Builder `DVoidEdge` (`frontend/src/joiner/classes.ts:996-1030`): `this.setPtr("start", startid)` / `this.setPtr("end", endid)` (`:1015-1016`), con `startid/endid` = `getNodeId(start/end)` → **id di GraphElement (vertici)**, non di model element.

### 1.2 Legame con la `DReference`

**Esplicito, via `model`.** `DVoidEdge.new2` è chiamato dovunque con il primo argomento = id della `DReference`:

| Call site | File:linea | `model` (arg1) |
|-----------|-----------|----------------|
| Auto-populate Step 3 (reference M2) | `useJjomSync.ts:661-665` | `refId` (la `DReference`) |
| Auto-populate Step 4 (reference M1) | `useJjomSync.ts:718-722` | `metaId` (la `DReference` metaclasse) |
| Canvas drag-create reference | `canvasToJjom.ts:232-240` | `refId` (la `DReference` appena creata) |
| Inheritance (per contrasto) | `useJjomSync.ts:631-635`, `canvasToJjom.ts` | `undefined` (usa `isExtend`, non `model`) |

Quindi: **back-reference esplicita** `DVoidEdge.model → DReference.id`. Lo conferma l'helper `edgeKeyForD` in `useJjomSync.ts:404-409`, che legge `se.model` come id della reference, e `syncDeleteEdge` (`canvasToJjom.ts:335`) che usa `edgeProxy.model` per risalire alla `DReference` da cancellare.

**MA il target visivo NON deriva da `model`.** Il transformer `jjomEdgeToRFEdge` (`frontend/src/components/editor-v2/utils/jjomTransformers.ts:440-476`):

```typescript
const startVertex = edge.start;        // :384
const endVertex   = edge.end;          // :385
...
if (edge.isReference) {
    const refModel = edge.model;       // :442  la DReference (live via L-proxy)
    ...
    const refData = {
        reference: {
            id: refModel?.id,
            name: refModel?.name,                 // ← da refModel (live)
            kind, lowerBound, upperBound,         // ← da refModel (live)
            targetClassId: endVertex.id,          // :452  ← da edge.end (CACHATO)
            ...
        },
        jjomRefId: refModel?.id,                  // :458
    };
    return {
        source: startVertex.id,                   // :469  ← da edge.start
        target: endVertex.id,                     // :470  ← da edge.end (CACHATO)
        type: 'reference', label: refModel?.name, // :473-474
        ...
    };
}
```

`refModel` (= `edge.model`, la `DReference` viva) è letto per **name / kind / bounds / opposite / id**, ma il **target dell'edge** (`target` e `targetClassId`) viene da `endVertex` (= `edge.end`). **`refModel.type` non è letto da nessuna parte nel transformer.** Questa è la disconnessione strutturale: cambiare `DReference.type` non tocca `DVoidEdge.end`, e il renderer ignora `DReference.type`.

### 1.3 Tracing sulla fixture

Pre-change, nei `subElements` del grafo v2-flow di `metamodel_2` esiste un `DVoidEdge` `E_old`:

```
E_old = DVoidEdge {
  model: 'Pointer1779719945861_USER_206',   // dean
  start: <V_Department>,                     // vertice di Department
  end:   <V_FullProfessor>,                  // vertice di Full Professor  ← risolto da dean.type AL TEMPO DI CREAZIONE
  isReference: true
}
```

dove `<V_FullProfessor>` è stato risolto come `vertexIdByModelId.get(refObj.type)` con `refObj.type` = id della classe Full Professor *al momento della creazione* (`useJjomSync.ts:649,651-652`).

Dopo il cambio Type (console di Alfonso): `idlookup['Pointer1779719945861_USER_206'].type === 'Pointer1779666666862_USER_282'` (Associate Professor). **`E_old.end` resta `<V_FullProfessor>`** (immutato). La back-reference `E_old.model` punta ancora correttamente a `dean`; è `end` a essere scollegato.

> **Nota sul campo `target: Array(0)` visto in console**: la `DReference` ha sia `type` (pointer alla classe target, *autoritativo* — è quello che il sync legge a `:649`) sia un campo `target` array (vuoto, vestigiale per le M2). L'edge segue `type`, non `target`. Vedi §7 (domanda aperta).

---

## 2. Mappa dei write path per gli edge M2 (risposta a §3.2)

| Operazione | Codice che gira | File:linea | Comportamento (1 riga) |
|-----------|-----------------|-----------|------------------------|
| **Creazione (canvas drag)** | `syncReferenceEdge` | `canvasToJjom.ts:159-250` | `addReference` (TRANSACTION) + `lRef.type = targetClass.id`, poi `DVoidEdge.new2(refId, …, srcV, tgtV, d=>d.isReference=true)` (`:232-240`) in TRANSACTION separata. `end = tgtV` fissato qui. |
| **Creazione (boot / import / JjScript)** | `useJjomSync` auto-populate Step 3 | `useJjomSync.ts:646-670` | Per ogni `cls.references`, risolve `tgtVertex = vertexIdByModelId.get(refObj.type)` (`:649,652`), chiave composita `${refId}:${src}→${tgt}` (`:659`), crea `DVoidEdge.new2(refId, …)` se assente (`:660-668`). |
| **Cambio Type (Property Panel)** | `Select field='type'` → proxy setter | `Info.tsx:414` (via `feature` `:405`, editor `reference` `:461`); write `Input.tsx:243` `data['type'] = serializeValue(newValue)` | Dispatch `SetFieldAction` su `DReference.type`. **Nessun codice tocca alcun `DVoidEdge`.** (Conferma HS3: write corretto su `type`.) |
| **Eliminazione (canvas)** | `syncDeleteEdge(edgeId, false)` | `canvasToJjom.ts:312,333-341` | Cancella `refModel.__raw` **e** `edgeProxy.__raw` nella stessa TRANSACTION → ripulisce sia model che graph side. (Era buggato fino al 24/05; ora simmetrico — vedi §6 nota prior-art.) |
| **Eliminazione (vertice/classe)** | `syncDeleteVertex` | `canvasToJjom.ts:259-305` | Filtra `graph.edges` per `start/end == vertex`, cancella ogni `DEdge` connesso, poi il model element. |
| **Boot / load (reload)** | `useJjomSync` init transform | `useJjomSync.ts:830-904` | Legge `lGraph.edges` (tutti i `DVoidEdge` in subElements), `jjomEdgeToRFEdge` per ciascuno, `setEdges`. Filtro orfani: tiene solo edge con **entrambi** i vertici presenti (`:873-874`). |

**Nota di consumer-verification (sub-rule §5.1)**: entrambi i path di creazione producono `DVoidEdge` che finiscono in `subElements` → renderizzati dall'init transform (`:871-877`) e via incremental patch (`:1184-1188` → `setEdges`). L'edge prodotto **è** consumato (non è output morto). Il `target` dell'RF edge (`jjomTransformers:470`) è consumato da ReactFlow per il routing. La parte *non* consumata è `refModel.type`: presente come dato vivo su `edge.model`, ma il transformer non lo legge mai per il target → è il "buco" del rendering.

---

## 3. Root cause del bug LIVE

### 3.1 Le due metà del fallimento

Il cambio di `DReference.type` LIVE non produce alcun cambiamento visibile sull'edge per **due ragioni concorrenti**:

**(A) L'effect che aggiornerebbe l'edge esistente è inerte sulla topologia.**
L'incremental-sync (`useJjomSync.ts:907`, deps `[isJjomMode, elementSnapshots, subElementIds, scheduleFlush, Date.now()]` `:1192`) **rifà partire** sul cambio di `type` (vedi §3.2 sotto). Nel loop "Property changes" (`:996-1063`) ri-trasforma l'edge (`:1049-1060`) via `jjomEdgeToRFEdge`. Ma `jjomEdgeToRFEdge` deriva `target` da `edge.end` (= `<V_FullProfessor>`, immutato) e **mai** da `edge.model.type`. Quindi l'edge ri-trasformato ha topologia identica → `patchedEdges.set` → `setEdges` → **nessun movimento**.

**(B) L'effect che creerebbe l'edge corretto non rifà partire.**
L'auto-populate (`useJjomSync.ts:343`, deps `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]` `:738`) è l'**unico** loco che crea nuovi reference-edge. `modelRefCount` (`:322-337`) conta `cls.references.length` — invariato (dean esiste ancora, ha solo cambiato `type`). Nessuna altra dep cambia (vedi §3.3). → l'auto-populate **non gira** → nessun `DVoidEdge` verso Associate Professor LIVE.

**(C) Nessun GC / riconciliazione.** Non esiste codice che, al cambio di `type`, ri-punti `edge.end` o rimuova l'edge stale. (Grep su `editor-v2/hooks` + `editor-v2/sync` per `reconcile|retarget|repoint|stale|orphan` + lettura integrale di `useJjomSync.ts`: nessun candidato. `useM1ReferenceEdges` è add-only per esplicito design; `useClassRemoval`/`useOrphanFeatures` riguardano la rimozione classe / orphan attributi, non il type-change reference.)

Esito LIVE: freccia ferma su Full Professor, nessuna freccia nuova. **Coincide con la fenomenologia riportata.**

### 3.2 Proof empirico che l'incremental-sync *fira* (correzione alla premessa del prompt)

Il selettore `elementSnapshots` (`useJjomSync.ts:744-827`) calcola, per ogni vertice, un hash `ch:${id}` dei figli del suo model. Per il vertice di Department, itera `modelElem['references']` (`:761`) e per ogni reference figlia ne hasha **il `type`** (`:773-776`):

```typescript
const t = (typeof child.type === 'string' ? child.type : child.type?.id ?? '');
for (let i = 0; i < t.length; i++) { ch = ((ch << 5) - ch + t.charCodeAt(i)) | 0; }
```

`dean` è una reference figlia di Department. `dean.type` passa da `<FullProf id>` a `Pointer1779666666862_USER_282` → la stringa `t` cambia → `ch:${V_Department}` cambia → `mapReferenceEqual` (`:92-103`) ritorna `false` → il selettore emette una nuova `Map` → l'effect `:907` **rifà partire**. (In aggiunta, l'entry `model:${E_old}` = `idlookup[dean]` può cambiare reference se il reducer rimpiazza l'oggetto; ma il path via hash è sufficiente da solo, quindi la conclusione non dipende dall'object-identity del reducer.)

Quindi la frase del prompt "nessun effect ascolta un SetFieldAction su DReference.type" è **imprecisa**: l'incremental-sync ascolta (indirettamente, via hash) e gira. La frase "l'edge in ReactFlow non viene mai aggiornato" è **vera**, ma la causa non è "nessuno ascolta" — è che **chi ascolta non può cambiare la topologia, perché la topologia vive in `DVoidEdge.start/end`, non in `DReference.type`**, e chi *crea* la topologia (auto-populate) non ascolta.

### 3.3 Verifica deps auto-populate (risposta a §3.3)

Per il `SetFieldAction` su `dean.type`:

| Dep (`:738`) | Selettore | Cambia? | Perché |
|--------------|-----------|---------|--------|
| `modelid` | param | no | stesso modello |
| `hasGraph` | `:293` | no | grafo invariato |
| `subElementIds.length` | `:295` | no | nessun edge/vertice aggiunto/rimosso LIVE (è il bug) |
| `modelClassCount` | `:307-318` | no | conta classi+enum; il type-change non aggiunge/rimuove classifier |
| `modelRefCount` | `:322-337` | **no** | conta `cls.references.length`; dean resta, cambia solo `type` |
| `modelObjectCount` | `:299-303` | no | oggetti M1 invariati |

**Nessuna dep dell'auto-populate cambia** → non rifà partire. È **esattamente lo stesso pattern** della userMemory M1 ("deps non cambiano su `SetFieldAction` su `DValue.values`"): lì il counter mancante era sui valori-slot M1, qui è sul `type` delle reference M2.

**Dep aggiuntiva che servirebbe per intercettare il Type change** (solo identificata, NON da implementare): un selettore tipo `modelRefTypeHash` che hashi le coppie `(refId, type)` di tutte le `cls.references` (analogo a `m1RefValuesSig` di `useM1ReferenceEdges.ts:36-58`, ma sui `type` M2 invece che sui valori-slot M1). **Caveat**: aggiungere solo questa dep farebbe creare l'edge nuovo ma **non** rimuoverebbe il vecchio (l'auto-populate è add-only, chiave composita per-target), quindi da sola riprodurrebbe LIVE lo stato a due frecce del post-reload. Serve in più la riconciliazione/rimozione (vedi §6).

---

## 4. Root cause del bug POST-RELOAD

Al reload del tab/modello:

1. **Init transform** (`useJjomSync.ts:855-893`): legge `LGraph.edges` = tutti i `DVoidEdge` persistiti in `subElements`. `E_old` (end = `<V_FullProfessor>`) è tra questi. Filtro orfani (`:873-874`): `nodeCache.has(source) && nodeCache.has(target)` — sia `V_Department` sia `V_FullProfessor` esistono (Full Professor non è stata cancellata, solo deselezionata come target di `dean`) → **`E_old` passa il filtro e viene disegnato** (freccia Department→Full Professor).
2. **Auto-populate al mount** (`:343`, gira sempre al primo run perché `initializedRef`/`creatingGraphRef` partono falsi e c'è da popolare): per `dean`, `targetId = refObj.type = Pointer1779666666862_USER_282` (Associate Professor, ora). `tgtVertex = vertexIdByModelId.get(targetId) = <V_AssociateProfessor>`. Chiave composita `${refId}:${V_Department}→${V_AssociateProfessor}` (`:659`). `existingEdgeKeys` contiene `${refId}:${V_Department}→${V_FullProfessor}` (da `E_old`, raccolto a `:413-422`/`:441-447`). La nuova chiave **non** è presente → crea `E_new = DVoidEdge{model:dean, start:V_Department, end:V_AssociateProfessor}` (freccia Department→Associate Professor).
3. **Esito**: due `DVoidEdge` con lo stesso `model` (dean), `end` diversi → **due frecce**. Coincide con la fenomenologia.

**Perché l'orfano sopravvive** (file:linea):
- È persistito in `DGraph.subElements` (creato in una sessione precedente, mai cancellato).
- Entrambi i suoi endpoint-vertici esistono → il filtro orfani dell'init (`:873-874`) **non** lo scarta (il filtro guarda l'esistenza dei vertici, non la coerenza `model.type ↔ end`).
- La dedup dell'auto-populate è su chiave **composita per-target** `${refId}:${src}→${tgt}` (`:659,716`): `E_old` ed `E_new` hanno target diverso → chiavi diverse → `E_new` non collide con `E_old`, e `E_old` non viene mai matchato per rimozione.
- Non esiste GC che verifichi "il vertice di `edge.model.type` coincide con `edge.end`?". (Per le inheritance c'è `deduplicateInheritanceEdges` `:199-208`, ma è pair-based e solo per `type==='inheritance'`; per le reference non c'è equivalente.)

Conseguenza cumulativa (coerente col test informale suggerito da Alfonso): **ogni** cambio di Type accumula un `DVoidEdge` orfano permanente. N cambi → N orfani al reload.

---

## 5. Conferma/contrasto dell'ipotesi di partenza

| Punto dell'ipotesi | Esito |
|--------------------|-------|
| L'edge è persistito come `DEdge`/`DVoidEdge` in `subElements` | ✅ **Confermato** (`DVoidEdge`, §1.1). |
| `source/target` cachati come ID disaccoppiati da `DReference.type` | ✅ **Confermato** (`edge.start/end` = vertici, fissati alla creazione; `jjomTransformers` ignora `model.type`, §1.2). |
| Esiste un legame esplicito con la `DReference` | ✅ **Confermato e più forte del previsto**: `DVoidEdge.model → DReference.id`, già usato da `syncDeleteEdge` (§1.2). L'ipotesi diceva "source/target hardcoded e basta" — c'è in più la back-reference `model`. |
| LIVE: nessun effect ascolta con deps adeguate, l'edge non viene aggiornato | ⚠️ **Parzialmente corretto**: l'incremental-sync *ascolta e gira* (via hash dei `type`, §3.2), ma è inerte sulla topologia; l'auto-populate (che creerebbe l'edge) *non* ascolta. L'effetto finale ("edge non aggiornato") è quello previsto, la meccanica è più sottile. |
| POST-RELOAD: l'auto-populate crea il nuovo edge ma non rimuove il vecchio | ✅ **Confermato** (§4). |

---

## 6. Direzioni di fix candidate (NON scegliere, NON raccomandare)

> Presentate per discussione in chat di progetto. Pro/contro tecnici, nessuna preferenza.

### α — Edge come vista (non persistito)
Derivare gli edge reference M2 a render-time dalla `DReference` (source = vertice della classe-padre; target = vertice di `reference.type`), senza persistere `DVoidEdge`.
- **Pro**: elimina la classe intera — niente edge persistito ⇒ niente orfano al reload; il type-change si riflette automaticamente (target ricalcolato live da `reference.type` a ogni render); copre anche il delete.
- **Contro**: gli edge oggi persistono stato per-edge — `data.sourceAnchor/targetAnchor` (preservati in `useJjomSync.ts:1159-1164`), `waypoints` (`:1156-1158`), customizzazioni handle. Una vista pura ha bisogno di un'altra casa per questo stato, keyed per `refId`. Cambio architetturale ampio: tocca `jjomTransformers`, init+incremental di `useJjomSync`, `canvasToJjom` (create/delete diventerebbero no-op o si sposterebbero). Rischio sugli edge M1 instance che condividono lo stesso meccanismo `DVoidEdge`.

### β — Edge legato per ID alla `DReference` + riconciliazione su `end`
Il legame **esiste già** (`edge.model = refId`). Aggiungere una riconciliazione keyed su `refId`: al cambio di `reference.type`, trovare il `DVoidEdge` con `model == refId` e ri-puntare `end` al vertice di `type` (oppure delete+recreate).
- **Pro**: nessun nuovo campo dati (la `referenceId` chiesta dal prompt è di fatto `model`, già presente); riconciliazione localizzata; il re-point preserva l'identità dell'edge (e i suoi anchor/waypoint). Per le M2 c'è esattamente **un** edge per `refId` (una reference ha un solo `type`) → keying su `refId` pulito.
- **Contro**: serve un nuovo trigger reattivo (le deps auto-populate escludono `type`, §3.3); serve gestire la collisione di chiave composita (la dedup attuale è per-target, quindi "target spostato" appare come edge nuovo — la riconciliazione deve chiavare su `refId`, non su `(refId,src,tgt)`); ri-puntare `end` deve aggiornare anche i reciproci `edgesIn`/`edgesOut` (builder `classes.ts:1017-1018`) del vecchio e nuovo vertice target.

### γ — Hook reattivo dedicato `useM2ReferenceEdges` (analogo a `useM1ReferenceEdges`)
Un selettore keyed su una signature di coppie `(refId, type)` di tutte le `cls.references`; al cambio, riconcilia.
- **Pro**: ricalca il pattern già consolidato di `useM1ReferenceEdges` (montato a `EditorV2.tsx:349`); isola la concern M2-type-change; non tocca le deps fragili dell'auto-populate.
- **Contro**: `useM1ReferenceEdges` è **add-only per esplicito design** (header `useM1ReferenceEdges.ts:16-18`: "Orphan cleanup … is a separate workstream"; chiave pair `${srcV}→${tgt}` senza `refMetaId`, `:105`). Per **questo** bug l'hook M2 deve anche **rimuovere/ri-puntare** lo stale — cioè fare proprio l'orphan-cleanup che la versione M1 ha rimandato. Quindi γ è "useM1ReferenceEdges + la parte difficile che M1 ha saltato". Due hook di riconciliazione (M1 add-only + M2 add-remove) rischiano keying divergente (composito vs pair) e race di doppia-creazione; dovrebbero condividere le guardie `hasCanvasEdgePair`/`markCanvasEdgePair` (`syncState.ts`).

### δ — (fuori lista) Riconciliazione dentro il re-transform incremental
L'incremental-sync **già gira** sul type-change e **già ri-trasforma** l'edge (§3.1A). Far derivare il target da `edge.model.type` (vertice corrispondente) invece che da `edge.end` quando divergono, scrivendo a ritroso l'`end` corretto sul `DVoidEdge`.
- **Pro**: sfrutta un effect che gira già (per il LIVE non serve nuova dep/selettore); il re-transform diventa il punto di riconciliazione; un solo locus.
- **Contro**: `jjomEdgeToRFEdge` è oggi **puro** (D/L → RF, nessun write); fargli scrivere `end` rompe il contratto e rischia loop (il write rigenera lo snapshot → effect → …), serve guardia accurata. Una variante "solo lettura" (risolvere il target da `model.type` a render-time senza write-back) correggerebbe il LIVE ma lascerebbe `DVoidEdge.end` stale persistito (divergenza D-layer) — mezzo fix. Inoltre non aiuta se l'edge non era ancora stato creato, e il doppione post-reload resterebbe finché la dedup auto-populate non riconosce l'edge "spostato".

---

## 7. Domande aperte (da riportare in chat di progetto)

1. **Delete reference da albero/property-panel (non canvas)**: `syncDeleteEdge` è solo canvas (entry point `EditorV2.tsx`). Cancellare una `DReference` dal tree view o da un altro path (JjScript, Jodie) presumibilmente **non** passa da `syncDeleteEdge` → orfano `DVoidEdge` analogo al caso 24/05 (che però è canvas-only e già fixato). **Non tracciato qui** — merita una seconda discovery o un check mirato.
2. **eOpposite**: se `dean` ha un'opposite, il cambio di `type` impatta anche l'edge dell'opposite? Fuori scope, da verificare.
3. **M1 instance edge analogo**: quando uno slot M1 di reference cambia *target* (non solo si aggiunge), `useM1ReferenceEdges` essendo add-only lascia un orfano speculare? Probabile, stessa famiglia. Da confermare separatamente.
4. **Campo `DReference.target: Array(0)`** (visto in console): sembra vestigiale rispetto a `type` per le M2. Confermare che è inutilizzato per il rendering edge (il sync legge `type`, §1.2) e non esista un secondo path che lo consuma.
5. **Object-identity del reducer**: il path §3.2 via hash è sufficiente; resta non verificato se `SetFieldAction` su `type` rimpiazzi l'oggetto `idlookup[dean]` (rilevante solo per l'entry `model:${edgeId}` del selettore, non-blocking).
6. **Render in-node della riga reference**: il vertice sorgente viene ri-trasformato LIVE (§3.1A) → la riga "dean: …" dentro il ClassNode dovrebbe aggiornare il tipo mostrato; non tracciato fin dentro `ClassNode`. Da confermare se rilevante per la UX (il bug riportato è sulla freccia, non sulla riga).

---

## 8. Hard stop — esito

| HS | Condizione | Esito |
|----|-----------|-------|
| **HS1** | Edge M2 non persistito (bug post-reload impossibile) | **Non attivato** — l'edge È un `DVoidEdge` persistito (§1.1); il bug post-reload è possibile come descritto. |
| **HS2** | Esiste già un effect dedicato a `SetFieldAction` su `DReference.type` (bug A non dovrebbe esistere) | **Non attivato** (ma sfiorato). Nessun effect *dedicato* al `type`. L'incremental-sync reagisce *indirettamente* (hash, §3.2) ma è inerte sulla topologia. Segnalato come correzione alla premessa, non come hard stop: il bug A esiste eccome. |
| **HS3** | Il write del Property Panel colpisce un campo diverso da `DReference.type` | **Non attivato** — `Select field='type'` → `data['type'] = …` (`Input.tsx:243`) → `SetFieldAction` su `type`. Conferma indipendente della console di Alfonso. |
| **HS4** | Serve eseguire codice (build/dev/test) | **Non attivato** — discovery puramente statica. |

---

## 9. File letti (nessuno modificato fuori da `docs/`)

- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (integrale)
- `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` (integrale)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`:380-512`)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`:90-346`)
- `frontend/src/model/dataStructure/GraphDataElements.tsx` (`:1874-1880`)
- `frontend/src/joiner/classes.ts` (`:980-1030`, builder `DVoidEdge`)
- `frontend/src/components/editors/Info.tsx` (`:395-485`)
- `frontend/src/components/forEndUser/Input.tsx` (`Select` write path)
- `frontend/src/components/editor-v2/EditorV2.tsx` (`:45-46,349` wiring hook)
- Prior art: `docs/discovery/discovery_2026-05-24_v2flow_reference_delete.md`

**Working tree**: nessun `.ts/.tsx/.scss` modificato. Solo questo documento + `docs/claude-code-log.md`.
