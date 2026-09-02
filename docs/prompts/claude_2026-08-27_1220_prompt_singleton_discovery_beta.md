# Prompt Claude Code: singleton nascosti, coerenza della soppressione nel sync (fronte β, Fase 1)

**Nome del documento prompt**: 2026-08-27 12:20
**Branch**: `alfonso-frontend-jjtl`, HEAD `73aef31c9` (commit B landato: `1635e8450` codice, `5d9ea54fa` fix, entry di log raccolte in `a207f1bbe`)
**Tipo**: fix (questa è la Fase 1, read-only: nessun file di prodotto)
**Corsia**: completa. Critical zone §3.1 di `CLAUDE.md`: `useJjomSync.ts`, `syncState.ts`, `useM1ReferenceEdges.ts`. La Fase 2 porterà un Layer Impact Report; questa fase lo abbozza.
**Effort**: xhigh
**Protocollo**: `docs/PROTOCOL.md`, P1..P5 e P10 applicabili. P6..P9 non si applicano in Fase 1 (nessun commit, nessuna entry di log).
**Decisioni**: `docs/decisions.md`, R-SGL-2 (istanza segue il flag, rimozione con vertice e archi), R-SGL-9(g) (guard morto), R-SGL-10(6) (perimetro (α) di B e apertura di (β)).
**Precedenti**: `docs/discovery/discovery_2026-08-26_singleton_reference_select.md`, §6 intero (D5) e §9 (bozza del LIR di B). È la base di questo report: non riscriverne le parti, citale.

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Se qualcosa qui contraddice `CLAUDE.md`, fermati e segnala.

---

## 0. Contesto

Lo stato «singleton nascosti» oggi vive in tre posti non collegati: `localStorage['jjodel.showSingletons.<modelid>']` (Navbar, `:639-664`, sorgente del toggle), il Set `suppressedSingletonIds` in `syncState.ts:159-179` (id di **DVertex**, scritto solo da `EditorV2.tsx`), e il mirror React `showSingletons` in `EditorV2.tsx:656-688` che B ha aggiunto per le righe IR. La soppressione è applicata da `useJjomSync` in un percorso su due (report B §6.1) e il toggle in `EditorV2.tsx:717-833` muove i nodi con `setNodes` senza passare dalle cache del hook.

Quattro difetti misurati il 26/8 sera dalla chat con il Chrome di Alfonso (console, `getNodes()`/`getEdges()` sul DOM), più uno registrato per lettura. Sono fatti, non ipotesi: la discovery deve spiegarli, non riconfermarli.

1. **hide**: con un arco M1 verso un singleton visibile, il toggle su «nascosti» porta gli archi RF da 9 a 7 **senza alcun `setEdges`**: React Flow scarta in silenzio gli archi il cui nodo target sparisce. `rfEdgeCache` in `useJjomSync` li tiene ancora.
2. **assegnazione con singleton nascosti** (la select di B): valore e `DVoidEdge` scritti nel D-layer, archi RF fermi. `:1302` filtra su `currentIds` (che contiene il vertice soppresso), quindi l'arco passa e RF lo scarta.
3. **show**: l'arco creato mentre il target era soppresso non compare (D-layer 1, RF 0), serve reload. Vale anche per il caso 1: l'arco scartato da RF non torna perché la cache lo crede presente. Il §6.4 del report B, primo sotto-caso («ricompare da sé»), è quindi **falsificato dalla misura**.
4. **mount con chiave `false`**: i nodi singleton erano visibili e il menu senza spunta. La soppressione al mount (`EditorV2.tsx:837-858`) scrive nel Set ma non filtra i nodi RF; se l'init di `useJjomSync` (`:1167-1241`, effetto dichiarato a `EditorV2.tsx:461`) ha già fatto `setNodes` prima che quell'effetto (dichiarato a `:714`) popolasse il Set, i nodi restano. Ordine di dichiarazione degli effetti e timing di `graphInfo` decidono, cioè è una race.
5. **R-SGL-9(g)**: `useJjomSync.ts:670` e `:764` chiamano `isSingletonSuppressed(objId)` con un id di `DObject` contro un Set di id di `DVertex`: sempre falso, mascherato dal `continue` precedente su `vertexIdByModelId`. Si scopre nel caso «singleton senza vertice + nascosti», dove Step 4 crea un vertice, l'incrementale a `:1280` lo vede non soppresso (id nuovo) e il nodo compare col toggle spento.

Il filo comune: la visibilità dei singleton è decisa fuori dal hook che possiede le cache (`rfNodeCache`, `rfEdgeCache`, `prevSubElementsRef`) e lo stato RF. Ogni percorso che aggira le cache le lascia incoerenti, e l'incoerenza si paga al gesto successivo.

---

## 1. COSA

Un discovery report che risponda alle sette domande della sezione 3 e scelga, con evidenze, fra i tre disegni della sezione 4, così che la Fase 2 sia una lista chiusa di edit con il Layer Impact Report già abbozzato. Nessuna modifica al codice.

---

## 2. DOVE

Lettura attesa (path completi da `frontend/src/components/editor-v2/`):

- `hooks/useJjomSync.ts`: `scheduleFlush` e i patch ref (`:242-260`); Step 4, conteggio e creazione dei vertici mancanti (`:663-672`, `:760-770`); precedenti di `setEdges` filtrato (`:835`, `:926`); init (`:1167-1241`); incrementale, aggiunte (`:1244-1330`), rimozioni (`:1331-1336`), e il punto in cui `removedNodeIds`/`removedEdgeIds` arrivano a RF; il `return` del hook (`:1587`)
- `hooks/useM1ReferenceEdges.ts`: `vertexByModel` (`:104-113`) e la creazione del `DVoidEdge`
- `sync/syncState.ts` (`:159-179`)
- `EditorV2.tsx`: ordine delle chiamate (`useJjomSync` a `:461`, `useM1ReferenceEdges` a `:487`), mirror (`:656-688`), effetto del toggle (`:714-866`: handler `:717`, ramo `show` `:734-810`, ramo `hide` `:811-833`, soppressione al mount `:837-858`, cleanup con `clearSuppressedSingletons` `:861-865`), `editorContextValue` (`:4020`)
- `src/pages/components/Navbar.tsx` (`:639-664`, `:1486`)
- `docs/discovery/discovery_2026-08-26_singleton_reference_select.md`, §6 e §9

I numeri di riga sono di oggi su HEAD `73aef31c9`: rileggi, non fidarti.

**Report** in `docs/discovery/discovery_2026-08-27_singleton_suppression_sync.md`: ipotesi da falsificare, obiettivo, file letti con path completi, findings per domanda con `file:riga` e citazione verbatim, scelta fra i disegni di §4 con le ragioni, dipendenze e rischi, bozza del Layer Impact Report, domande aperte per Alfonso. Se il path esiste già, addendum in coda (R-E/E-1), non riscrittura.

---

## 3. COME: le sette domande

**D1. La race al mount (difetto 4).** Conferma o smentisci per lettura l'ordine: l'effetto di init di `useJjomSync` è dichiarato dentro la chiamata a `:461`, l'effetto di soppressione a `:714`; React esegue gli effetti nell'ordine di dichiarazione, quindi quando `graphInfo` è già disponibile al primo commit l'init fa `setNodes` **prima** che il Set sia popolato. Quando invece `graphInfo` arriva a un commit successivo, il Set è già pieno e l'init filtra bene. Dire in quali scenari reali (apertura da dashboard, cambio tab, reload con progetto in store) capita l'uno o l'altro. Poi: il cleanup a `:861-865` chiama `clearSuppressedSingletons()` a ogni cambio di `[isJjomMode, graphId, isModelMode, modelid, setNodes, getNodes]`; il Set è **globale**, non per modello. Con due tab modello aperte in sequenza, cosa resta nel Set?

**D2. Cosa sa la cache dopo hide (difetti 1 e 3).** Nel ramo `hide` il nodo esce da RF ma resta in `rfNodeCache`; gli archi incidenti escono da RF (scarto silenzioso) ma restano in `rfEdgeCache`. Elenca le conseguenze concrete, una per una, ai gesti successivi: (a) `show` rimette il nodo con `setNodes`, gli archi no perché la cache li crede presenti; (b) cancellazione a D-layer di un arco incidente mentre è nascosto: `rfEdgeCache.delete` → `removedEdgeIds` → `setEdges(filter)` su un arco già assente, no-op; (c) spostamento del vertice nascosto (non possibile da UI, ma da JjScript sì): `patchedNodePositions` su un nodo assente; (d) `isCanvasUpdated`/anti-bounce. Quali sono innocue, quali lasciano stato sporco.

**D3. Cosa fa React Flow con un arco senza nodo.** La misura dice: lo scarta dallo stato, senza log in console. Trova nel codice di React Flow in `node_modules` (versione da `package.json`) il punto esatto: è un filtro nel render (l'arco resta in `edges` ma non si vede) o una rimozione dallo store (`getEdges()` non lo restituisce più)? La differenza decide se il ramo `hide` deve fare `setEdges` esplicito o se basta riallineare la cache. Cita file e funzione.

**D4. Il percorso incrementale (difetto 2).** A `:1302` il guard è `currentIds.has(source) && currentIds.has(target)`. Aggiungere `!isSingletonSuppressed(source) && !isSingletonSuppressed(target)` allinea l'incrementale all'init (`:1211`), ma l'arco non entra in `rfEdgeCache`: al `show` chi lo aggiunge? Descrivi il contratto minimo che il ramo `show` deve rispettare perché l'arco torni: rilettura di `lGraph.edges` filtrata sugli endpoint rivelati, `jjomEdgeToRFEdge`, inserimento in cache **e** in RF. Verifica se `deduplicateInheritanceEdges` conta (per M1 no, ma dillo con la riga).

**D5. Il guard morto (difetto 5).** A `:670` e `:764` il `continue` su `isSingletonSuppressed(objId)` non può mai scattare. La semantica voluta è «non creare un vertice per un oggetto singleton se il modello ha i singleton nascosti». Per esprimerla servono due informazioni che il hook oggi non ha: se la metaclasse dell'oggetto è singleton (`idlookup[obj.instanceof].isSingleton`, un lookup) e se il modello è in stato «nascosti» (oggi solo in `localStorage` e nel mirror di EditorV2). Dire come la seconda può arrivare al hook senza `localStorage` dentro `hooks/` e senza prop drilling: candidati, un flag per modello in `syncState` (`hideSingletonsForModel(modelId)`, `areSingletonsHidden(modelId)`) seminato da EditorV2, oppure un argomento nuovo di `useJjomSync`. Costo di ciascuno sulla firma di Step 4 (`CLAUDE.md` §3.5: le deps sono chiuse, un flag nuovo deve entrarci o restarne fuori con motivazione).

**D6. `useM1ReferenceEdges` e il target soppresso.** `vertexByModel` (`:104-113`) risolve il vertice del singleton nascosto e crea il `DVoidEdge`. Questo è **corretto** (il D-layer deve avere l'arco: R-SGL-2 e il caso 2 del contesto), quindi il hook non va toccato per filtrare. Conferma che nessun altro punto del hook (reconcile, `validPairs`, `managedM1Edges`) dipende dalla presenza del nodo RF. Se dipende, dillo con la riga.

**D7. Precedenti di API imperativa esposta dal hook.** `useJjomSync` restituisce `justCreatedGraphRef` (`:1587`), un ref che EditorV2 usa per coordinarsi. Esiste un precedente di **funzione** restituita dal hook e chiamata da EditorV2 (o da un altro hook) che aggiorna cache e RF insieme? Cerca anche in `useClassRemoval.ts` e `useOrphanFeatures.ts`. Serve per pesare il disegno (i) di §4.

---

## 4. I tre disegni da pesare

Non implementare. Per ciascuno: file toccati, righe stimate, cosa risolve dei cinque difetti, cosa lascia aperto, rischio sulla critical zone. Chiudi con una raccomandazione motivata, una sola.

**(i) Visibilità posseduta dal hook.** `useJjomSync` espone `setSingletonVisibility(vertexIds: string[], visible: boolean): void` (nome da verificare con `grep -r`). `hide`: toglie da RF nodi **e** archi incidenti, li toglie dalle cache, marca il Set. `show`: toglie dal Set, rilegge vertici e archi incidenti da `lGraph`, li mette in cache e in RF. EditorV2 (`:734-833`) chiama la funzione al posto dei `setNodes` diretti; il fallback di creazione (`:770-808`) resta com'è perché passa dal D-layer e dall'incrementale. Al mount, la soppressione (`:837-858`) chiama la stessa funzione con `visible=false` **dopo** l'init, il che chiude la race a prescindere dall'ordine. Risolve 1, 2 (con il filtro a `:1302`), 3, 4. Il difetto 5 resta finché il hook non conosce lo stato per modello (D5).

**(ii) Predicato derivato, non Set di vertici.** `syncState` tiene un Set di **modelId** con singleton nascosti; `isSingletonSuppressed(vertexId)` diventa `isSuppressed(entity)` calcolato: vertice il cui `model` è un `DObject` la cui metaclasse è `isSingleton` e il cui modello è nel Set. Chiude 5 per costruzione (il guard a `:670`/`:764` interroga l'oggetto, non il vertice) e rende inutile la scansione di `subElements` al mount. Non chiude 1, 3, 4 da solo: servono comunque le operazioni su cache e RF di (i). Costo: ogni chiamata al predicato fa due lookup in `idlookup`; dire quante chiamate per ciclo incrementale su un M1 con N vertici.

**(iii) Re-init completo al toggle.** Il toggle mette `initializedRef.current = false` (via una funzione esposta, o un contatore in argomento) e l'init rifà il full transform con il Set aggiornato: `:1204` e `:1211` filtrano già bene. Infallibile per 1, 2, 3, 4. Costo: `setNodes`/`setEdges` interi, `onInitialized` → `fitView` (`EditorV2.tsx:461`, callback) che sposta il viewport, cache azzerate, `prevElementsRef` risnapshottato. Dire se `fitView` è evitabile senza toccare la firma di `onInitialized`, e il costo su un M1 grande (`docs/benchmarks/README.md` per gli ordini di grandezza).

La combinazione (i)+(ii) è ammessa come raccomandazione se le evidenze la reggono. La (iii) è il fallback se (i) si rivela più larga di 60 righe dentro `useJjomSync.ts`.

---

## 5. Bozza del Layer Impact Report

Già in questa fase, sulla base del disegno raccomandato: layer toccati (Canvas v2-flow, Sync layer, `syncState`; D-layer **no**, salvo dimostrazione contraria), cosa cambia e cosa no per ciascuno, scenari di smoke: Families.ecore con singleton visibili e nascosti al mount; assegnazione da select con nascosti, poi `show`, atteso arco 1/1; arco tirato con visibili, poi `hide`, poi `show`, atteso arco 1/1 e cache coerente; reload con chiave `false`, atteso zero nodi singleton; spegnimento del flag `isSingleton` con singleton nascosti (R-SGL-2), atteso oggetto, vertice e archi rimossi senza residui in cache.

---

**HARD STOP** a report scritto. L'analisi si fa in chat sul report.

---

## 6. Vincoli

- Read-only: nessun file di prodotto toccato, nessun `git add`.
- Il report è l'unico artefatto; niente entry di log finché la Fase 2 non è chiusa.
- Non riaprire il perimetro di A e B: `InlineObjectSelect`, `syncSetReferenceValue`, i sei filtri di instanziabilità sono fuori. Il §6 del report B si cita, non si riscrive.
- Il working tree ha modifiche non committate di altri fronti (`StatusBar.*`, `featureSignature.ts`, `docs/sessioni/sessione_2026-08-26_singleton.md`, prompt untracked): non toccarle.
- Ogni asserzione di assenza («nessun altro punto dipende da...») dichiara la ricerca che la sostiene (R-RAIL-28). Glob quotati nei comandi (R-RAIL-31).
