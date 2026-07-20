# Discovery: Memory Leak Frontend Jjodel (Fase 1, read-only)

**Data**: 2026-07-05
**Tipo**: discovery (nessuna modifica al codice — HARD STOP dopo il report)
**Branch**: alfonso-frontend-jjtl

## 1. Sommario esecutivo

Dopo deduplica, **20 finding uniche** (da 25 grezze; 5 erano lo stesso `file:riga` visto da finder diversi — vedi `reducer.ts:1436`, `reducer.ts:1429`, `Collaborative.ts:152`, `Collaborative.ts:140/145`). Distribuzione per rischio: **4 alto, 11 medio, 5 basso**. Per categoria: eventi 6, globali 5, monaco 3, subscription 3, timer 3, observer 0 (categoria pulita al 100%). Il baricentro del problema è quasi certamente in `frontend/src/redux/reducer/reducer.ts`: un `setInterval(COMMIT)` e un `$(document).on('mouseup')` installati in `setDocumentEvents()`, senza teardown e **re-registrati a ogni `resetState()`** (round-trip Dashboard / logout), sommati alla history undo/redo illimitata nello stesso file. Questi tre bersagli combinano crescita non limitata + trigger frequente + CPU compounding.

> **Nota di verifica (orchestratore)**: i 5 sospetti top e i punti chiave di `reducer.ts` sono stati riletti direttamente sul tree corrente — vedi §7. In particolare `setDocumentEvents()` **non ha alcun guard** (né interno né a monte della chiamata a riga 1501), quindi la re-registrazione per `resetState()` è **incondizionata** per un utente loggato, non solo "probabile".

## 2. Tabella findings

| # | File:riga | Categoria | Descrizione | Rischio | Certezza |
|---|-----------|-----------|-------------|---------|----------|
| 1 | frontend/src/components/collaborative/Collaborative.ts:152 | globali (+subscription) | Array debug `firedActionsNCA`/`firedActionsCA` (pinnati su window) accumulano ogni azione collaborativa ricevuta, mai svuotati; commento "just for tmp debug, delete this". Oggetti Action interi (MB). | alto (in sessione collaborativa) | leak certo |
| 2 | frontend/src/redux/reducer/reducer.ts:1259 | globali | History undo/redo (`statehistory[user].undoable` + `.all.undoable`) cresce a ogni `isRelevantChange` senza cap/splice/shift; redoable mai svuotato. Delta di stato interi, pinnati su window. | alto | leak certo |
| 3 | frontend/src/redux/reducer/reducer.ts:1436 | timer (+eventi/subscription) | `setInterval(COMMIT, U.UpdatingTimer)` in `setDocumentEvents()` senza handle né `clearInterval`; `stateInitializer()` è re-eseguibile via `U.resetState()` → N loop COMMIT sovrapposti permanenti + CPU compounding. | alto | leak certo |
| 4 | frontend/src/redux/defaults/views.ts:607 | timer | Handler generato `onDataUpdate` costruisce un `setInterval(...,150)` senza `clearInterval` nel body; `onDataUpdate` è un evento Measurable ripetuto → un nuovo interval permanente per ogni firing su nodo mosso/snappato. | alto | probabile |
| 5 | frontend/src/redux/reducer/reducer.ts:1429 | eventi (+subscription) | `$(document).on('mouseup', arrow)` anonimo senza namespace né `.off`; re-aggiunto a ogni `stateInitializer()`/`resetState()` → un handler document accumulato per round-trip Dashboard. | medio | leak certo |
| 6 | frontend/src/components/collaborative/Collaborative.ts:140 | globali (+subscription) | Dict dedup module-level `actions` (`actions[id]=true` in `fire()`, riga 145) mai potato/resettato; una entry per azione ricevuta, monotono per l'intera sessione collaborativa. | medio | leak certo |
| 7 | frontend/src/components/collaborative/Collaborative.ts:55 | subscription | `connect()` riassegna `Collaborative.client = io(...)` + `.on('pullAction', receive)` senza guard su un client preesistente; un connect senza disconnect (double-connect/StrictMode/reconnect) orfaneggia il socket precedente e il suo listener. | medio | da verificare a runtime |
| 8 | frontend/src/components/editors/Broker.tsx:39 | subscription | `client.on('pull-action', arrow)` sul socket IoT singleton con il `.off` di dedup **commentato** e nessun cleanup di unmount → ogni Connect/mount impila un handler sul socket a vita pagina. | medio | leak certo |
| 9 | frontend/src/components/editors/languages/Javascript.tsx:60 | monaco | `addExtraLib()` senza `filePath` → monaco 0.52.2 genera path random, dedup fallisce, disposable scartato; editor JS del pannello Info monta molto spesso (uno per campo) → `_extraLibs` cresce di 1 per mount + re-validate TS-worker. | medio | leak certo |
| 10 | frontend/src/components/editors/languages/Js.tsx:66 | monaco | Stesso meccanismo di Javascript.tsx: `addExtraLib()` senza `filePath`, entry `_extraLibs` permanente per mount. (Setta anche `window.monaco` — pin del singleton, non leak.) | medio | leak certo |
| 11 | frontend/src/components/editors/languages/Jsx.tsx:59 | monaco | Stesso meccanismo: `addExtraLib()` senza `filePath`, una entry `_extraLibs` trattenuta per vita pagina a ogni mount dell'editor JSX. | medio | leak certo |
| 12 | frontend/src/common/U.tsx:193 | eventi | Listener singleton `document` 'click' (capture) in `U.clickedOutside`, mai rimosso (by design). Vero vettore: `clickedOutsideMapEntries` trattiene riferimenti Element grezzi, svuotato solo su deregister esplicito; solo 2 call-site di deregister → ogni register dimenticato pinna un Element (e sottoalbero). | medio | probabile |
| 13 | frontend/src/common/U.tsx:3546 | eventi | `Keystrokes.unregister` usa namespace letterale `'.src'` mentre `register` usa `'.'+src` dinamico → `.off` jQuery non matcha, handler `document.body` non rimossi + duplicati per ciclo. **Latente**: nessun caller di `unregister`, register guardato da `avoidDuplicateRegisters`. | medio | leak certo (latente) |
| 14 | frontend/src/model/dataStructure/GraphDataElements.tsx:2536 | eventi | `LVoidEdge` anchor-follow: add `document.body` mousemove+keydown guardato su `!following`, remove guardato su condizione asimmetrica (`following && id===startFollow/endFollow`); teardown via id non corrispondente lascia i listener attaccati (bounded a 1 coppia stale). | medio | da verificare a runtime |
| 15 | frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts:60 | globali | `orphanStore` cattura i valori di ogni istanza su delete di attributo; entry liberata solo su re-add dell'attributo o rimozione classe → delete-senza-readd lascia lo snapshot (potenzialmente molte istanze) nella Map module-level per la sessione. | medio | probabile |
| 16 | frontend/src/components/editors/Mqtt.tsx:21 | subscription | `client.on('pull-action', arrow)` sul socket singleton con `off` preventivo (crescita limitata a 1), ma **nessun cleanup di unmount**: unmount-while-connected lascia 1 handler + socket aperto sul singleton a vita pagina. | basso | probabile |
| 17 | frontend/src/components/forEndUser/Color.tsx:42 | eventi | Drag SV-picker aggiunge `document` mousemove/mouseup su mousedown, rimossi solo dentro l'handler `up`; nessun cleanup di unmount → leak solo se il pannello smonta a bottone premuto (edge case, non per-interazione). | basso | da verificare a runtime |
| 18 | frontend/src/graph/damedges/damedge.tsx:232 | eventi | Drag di segmento: `document` mousemove/mouseup (capture) rimossi solo dentro `onUp`; class component senza cleanup di unmount → leak per drag incompleto/unmount mid-drag (mouseup normalmente scatta, accumulo reale basso). | basso | da verificare a runtime |
| 19 | frontend/src/model/megamodelPersistence.ts:65 | globali | `megamodelRegistry.set(projectId, data)`; la delete esiste (riga 79) ma **nessun caller** repo-wide → entry mai evinte, una per progetto toccato. Stesso pattern dead-delete in `megamodelRuntime.ts`. | basso | probabile |
| 20 | frontend/src/joiner/classes.ts:2727 | timer | `setInterval(saveToState, 1)` che si auto-`clearInterval` appena `store.getState()` è truthy (praticamente sempre) → one-shot in pratica; leak solo se getState resta falsy indefinitamente. Incluso per esaustività. | basso | da verificare a runtime |

## 3. Top 5 sospetti

Peso ≈ rischio × certezza × frequenza-per-sessione.

1. **COMMIT setInterval re-registrato** — `frontend/src/redux/reducer/reducer.ts:1436`
   `setDocumentEvents()` non è one-shot: `stateInitializer()` → `U.resetState()` è invocato dal menu Dashboard della Navbar e dai path di logout. Ogni round-trip impila un altro loop COMMIT permanente che continua a girare, pinnando la sua closure. Impatto: N loop sovrapposti a vita pagina + CPU compounding. Il sospetto più forte perché unisce crescita, trigger reale e costo CPU continuo.

2. **History undo/redo illimitata** — `frontend/src/redux/reducer/reducer.ts:1259`
   Ogni edit rilevante fa `push` su due stack (`[user].undoable` e `.all.undoable`) senza alcun cap/splice/shift (grep vuoto su `MAX_HISTORY`/`.undoable = []`). I delta sono diff di stato interi (grandi su modelli grandi) e `statehistory` è pinnato su window. Crescita monotona ≥1 entry per interazione: memoria che sale linearmente con l'uso.

3. **onDataUpdate 150ms interval generato** — `frontend/src/redux/defaults/views.ts:607`
   La stringa handler crea un `setInterval(...,150)` senza `clearInterval`; `onDataUpdate` è un evento Measurable ripetuto (graphElement). Ogni firing su un nodo mosso/snappato genera un interval permanente che muta le coordinate midnode per sempre. Accumulo illimitato + CPU crescente. Certezza "probabile" (codice generato, va confermato a runtime che il ramo scatti).

4. **Array debug collaborativi** — `frontend/src/components/collaborative/Collaborative.ts:152`
   `firedActionsNCA`/`firedActionsCA` (pinnati su window, marcati "tmp debug, delete this") ricevono un push per ogni azione collaborativa ricevuta e non sono mai svuotati; trattengono oggetti Action/CompositeAction interi (MB-capable). Rischio alto **solo in sessione collaborativa attiva** — condizionale, ma quando scatta è il peggiore per byte.

5. **Monaco `addExtraLib` senza filePath** — `frontend/src/components/editors/languages/Javascript.tsx:60` (+ `Js.tsx:66`, `Jsx.tsx:59`)
   Path random per-mount (monaco 0.52.2) sconfigge il dedup, disposable scartato; questi sono gli editor del pannello proprietà/Info che montano molto spesso (uno per campo). `_extraLibs` nel TS-worker cresce di 1 per mount + `_fireOnDidExtraLibsChangeSoon()` → re-validate ripetute. Byte piccoli per entry ma frequenza di mount alta e crescita non limitata per l'intera sessione.

## 4. Osservazioni per categoria

- **eventi**: categoria in larga parte pulita. Due finder hanno verificato ~90 coppie add/remove bilanciate (stesso reference, flag capture coerenti, pattern `if(isOpen){add;return remove}`). I problemi reali sono: (a) listener singleton/install-once senza teardown installati all'init (`U.tsx` clickedOutside con array che trattiene Element, `reducer.ts` setDocumentEvents), (b) drag imperativi che rimuovono i listener solo nel proprio handler di mouseup (Color, damedge — edge case unmount-mid-drag), (c) il mismatch di namespace jQuery in `Keystrokes.unregister` (latente). Nessun caso inline-arrow-added/named-removed trovato.

- **monaco**: unica classe di leak reale = i tre `addExtraLib()` senza `filePath`. Tutti gli host `<Editor>` di `@monaco-editor/react` sono puliti (unmount dispone subscription+model+editor, verificato in node_modules). `JjtlEditor` raw è disposto nel cleanup; registrazioni linguaggio/tema guardate da flag `registered`; nessun `deltaDecorations`/`addCommand` accumulante.

- **timer**: coperta interamente. `setInterval` reali = 6, di cui 3 coppie pulite (Jodie, Navbar, BottomToolbar) e `useRelativeTime` ref-counted. Gli unici scoperti sono `reducer.ts:1436`, la stringa generata `views.ts:607`, e il poll auto-terminante `classes.ts:2727`. `setTimeout` (159) quasi tutti single-shot; nessun loop rAF infinito (tutti double-rAF one-shot con cancel verificati).

- **globali**: la maggioranza delle strutture module-scope è bounded/pulita (syncState clear* raggiungibili, `edgePathRegistry`, `oclCache` con cap, `throttleStates` con reset, ecc.). I problemi veri: history undo/redo senza cap (il più grave), array debug collaborativi window-pinnati, `actions` dict mai potato, `orphanStore` (heavy per entry), e il pattern "dead-delete" (`megamodel*` con API delete senza caller). Pattern sistemico: esporre Map su window per DevTools previene anche la GC.

- **subscription**: coppie pulite verificate (store.subscribe con unsubscribe, `CollaborativeAttacher` connect/disconnect appaiati, `useSyncExternalStore`). Pattern sistemico dei leak: funzioni di setup side-effect che assumono esecuzione single-shot ma sono re-eseguibili (`setDocumentEvents` via resetState), e registrazioni `.on()` sugli editor IoT su socket singleton **senza cleanup di unmount** (Broker con `.off` commentato = peggiore, Mqtt con `off` preventivo = più contenuto).

- **observer**: 0 leak. Tutte e 4 le istanziazioni (2 in MappingLinesOverlay, TabsOverflowMenu, useInfiniteScroll) sono coppie create+disconnect nello stesso effect. I 7 altri hit `.disconnect()` sono client MQTT/network, non Observer (falso positivo di categoria).

## 5. Domande aperte (verifica a runtime)

- **views.ts:607**: confermare via trace che `onDataUpdate` scatti effettivamente sul ramo che crea il `setInterval` (nodo snappato/mosso) e misurare quanti interval si accumulano per un drag reale. Certezza attualmente "probabile".
- **reducer.ts:1436 / :1429**: confermare con un ciclo Editor → Dashboard → Editor (o logout/login) che `setDocumentEvents()` venga ri-eseguito e che i loop COMMIT / handler mouseup si sommino (contare gli interval attivi / i listener document dopo N round-trip). *(Codice: nessun guard presente — vedi §7; resta da misurare la frequenza reale del trigger `resetState` durante l'uso normale.)*
- **Collaborative.ts:55**: serve un trace mount/unmount + reconnect per capire se `connect()` viene mai raggiunto senza `disconnect()` precedente (double-connect / StrictMode / path di errore).
- **GraphDataElements.tsx:2536 (LVoidEdge)**: riprodurre un teardown del follow via context con id non corrispondente per confermare che `following` resti `true` e i listener `document.body` persistano.
- **Color.tsx:42 / damedge.tsx:232**: confermare l'edge case unmount-mid-drag (smontare il componente a bottone premuto) — normalmente il mouseup ripulisce, quindi va provato deliberatamente.
- **U.tsx:193**: quantificare la crescita reale di `clickedOutsideMapEntries` — quanti register-site nel codice omettono il deregister e quindi pinnano Element per la vita pagina.
- **classes.ts:2727**: verificare che `store.getState()` sia sempre truthy al primo tick (atteso), così l'interval resta effettivamente one-shot.
- **Trasversale**: heap snapshot comparativo (baseline → N cicli mount/unmount degli editor property-panel) per quantificare la crescita di `_extraLibs` Monaco e distinguerla dal rumore.

## 6. Note metodologiche

Scope coperto: 8 finder paralleli su 6 categorie (eventi, monaco, timer, observer, globali, subscription) con lettura dell'intera coppia add/remove o del ciclo di vita di ogni struttura module-scope. **Non ispezionato / esplicitamente fuori scope**: `TreeViewSidebar` e `BulkActionsBar` (listener presenti ma fuori dalla lista assegnata al finder eventi), e strutture non catturate dai grep prescritti. Le certezze "da verificare a runtime"/"probabile" indicano ipotesi statiche non ancora riprodotte su codice corrente. **Nessun file sorgente è stato modificato**: questa è Fase 1, census-only, hard stop dopo il report.

## 7. Verifica diretta dei top findings (spot-check orchestratore)

Prima di pubblicare, i 5 sospetti top e i punti chiave sono stati riletti a mano sul working tree corrente (§5.1 CLAUDE.md — non fidarsi della sola ispezione dei finder):

- **reducer.ts:1436 (COMMIT interval) — CONFERMATO, incondizionato.** `setInterval(()=>{ COMMIT(undefined,false) }, windoww.U.UpdatingTimer)` senza id né `clearInterval`. `setDocumentEvents()` (riga 1417) **non ha alcun guard interno**; è chiamato incondizionatamente da `stateInitializer()` a riga 1501 (l'unico early-return a monte è `if (!DUser.current) return` per utente sloggato). `stateInitializer`/`resetState` ha call-site utente reali: `Navbar.tsx:493`, `Navbar.tsx:1943`, `LeftBar.tsx:180/192`, `Auth.tsx:241`, `Notes.tsx:250`, `PathChecker.tsx:12`, oltre a `App.tsx:95` e `ExecuteOnRead.ts:279`. ⇒ Ogni `resetState` di un utente loggato impila un nuovo interval permanente. **Correzione a una nota di finder**: l'ipotesi di un "firstLoading gate" che renderebbe l'init one-shot **non trova riscontro** nel codice — nessun gate protegge `setDocumentEvents`.
- **reducer.ts:1429 ($(document).on('mouseup')) — CONFERMATO.** Handler arrow anonimo, senza namespace, aggiunto dentro `setDocumentEvents` (via `setTimeout(...,1)`); nessun `.off`. Stesso meccanismo di re-registrazione del punto sopra.
- **reducer.ts:1259 (history undo/redo) — CONFERMATO.** `statehistory[user].undoable.push(delta)` + `statehistory.all.undoable.push(delta)` (righe 1259-1260) senza alcun cap. Gli `.splice()` presenti nel file (righe 279/280/307/333) applicano delta di stato, **non** troncano la history; `pop()` (1127) serve all'undo. Nessun `MAX_HISTORY`.
- **views.ts:607 (setInterval 150ms in onDataUpdate) — CONFERMATO.** La stringa handler concatena `view.onDataUpdate += "    setInterval(() => {\n"` … `"    }, 150);\n"` (righe 607-621), dentro il ramo `if (snap)`. Nessun `clearInterval` nella stringa generata. (Il mio primo grep l'aveva mancato solo per un troncamento `head`, non per errore del finder.)
- **Collaborative.ts:152 (array debug) — CONFERMATO.** `firedActionsNCA`/`firedActionsCA`/`firedActions` dichiarati alle righe 152-153 + `firedActions`, alimentati via `.push()` (righe 112/122/131), pinnati su window (155-157) con commento "just for tmp debug, delete this".
- **Broker.tsx:38-39 (.off commentato) — CONFERMATO.** `// client.off('pull-action');` (riga 38) commentato subito prima di `client.on('pull-action', ...)` (riga 39). Esiste un `client.off('pull-action')` attivo a riga 51, ma nel flusso di connect/disconnect, non come cleanup di unmount React.

Esito: tutti e 5 i sospetti top sono leak reali sul tree corrente; l'unica imprecisione riscontrata era in una *nota interna* di un finder (il presunto gate), già corretta dalla sintesi e ribadita qui.
