# Discovery: il meccanismo che cadenza il trickle degli edge al settle

Data: 2026-07-20. Sessione read-only su `/home/claude/jjodel-frontend` (branch `alfonso-frontend-jjtl`, build di produzione servita con `vite preview` su porta 3011). Strumentazione eseguita solo su copie fuori dal repo (`/home/claude/tricklework/`). Nessun file tracciato modificato, nessun commit.

## Obiettivo

Il benchmark baseline (500 Task / 1000 next + 500 containment) mostra che il mount dei nodi scala con l'hardware (~9x tra container cloud e M3) ma l'edge settle no (~1.3x): gli edge compaiono a goccia per 119-148 s anche su M3. Un processo CPU-bound scalerebbe come il mount; il trickle è quindi cadenzato da qualcosa. Obiettivo: identificare il cadenzatore con evidenze e proporre le leve di fix, senza implementarle.

Risultato anticipato: il cadenzatore non è Redux e non è il timer da 300 ms. Tutti i 1500 edge entrano nello store in UN solo dispatch. Il trickle è interamente render-side: un ciclo di ~1500 iterazioni (una per commit React), ciascuna innescata via requestAnimationFrame, in cui ogni iterazione paga ~986 scansioni DOM `querySelector` eseguite dalle subscription zustand degli `EdgeLabelRenderer` (una per edge renderizzato, libreria @xyflow). Il numero di iterazioni è indipendente dalla macchina; il costo per iterazione ha un floor da frame rAF e scala poco con la CPU. Da qui la scalabilità 1.3x.

## File letti

Codice applicativo:
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (integrale: selettori, effect auto-populate Step 1-4, sync incrementale, scheduleFlush)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` (integrale)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/EditorV2.tsx` (righe 940-1260: applyDistribution e guard reattivo; 3000-3120: handleAutoLayout, reLayoutWatcher)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/components/DynamicHandles.tsx` (integrale)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (righe 380-660)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/edges/EndpointHandles.tsx` (import e riga 67)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/hooks/useAutoAnchor.ts` (prime 90 righe)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (righe 330-465)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/utils/reLayoutWatcher.ts` (via grep)
- `/home/claude/jjodel-frontend/frontend/src/redux/action/action.ts` (righe 90-370 e 720-815: BEGIN/END/COMMIT, Action.fire, CompositeAction, Constructors.persist)
- `/home/claude/jjodel-frontend/frontend/src/redux/reducer/reducer.ts` (righe 1360-1465: setInterval COMMIT)
- `/home/claude/jjodel-frontend/frontend/src/joiner/classes.ts` (righe 551-690: Constructors, persist)
- `/home/claude/jjodel-frontend/frontend/src/common/U.tsx` (riga 176: `UpdatingTimer = 300`)
- `/home/claude/jjodel-frontend/frontend/node_modules/@xyflow/react/dist/esm/index.js` (riga 3630: selector di EdgeLabelRenderer; 3766: updateNodeInternals)
- `/home/claude/jjodel-frontend/frontend/scripts/benchmarks/bench_baseline.mjs`
- `/home/claude/jjodel-frontend/docs/benchmarks/README.md`
- `/home/claude/discovery_2026-07-19_edge_mancanti_986_1000.md` (report correlato)

Artefatti prodotti fuori dal repo: `/home/claude/tricklework/bench_trickle.mjs` (run 1: log dispatch Redux + sampler), `bench_trickle2.mjs` (run 2: curva edge via MutationObserver, timestamp di ogni commit, profilo CPU CDP), `bench_trickle3.mjs` (run 3: attribuzione delle querySelector per tipo e per nodeId), con i rispettivi `trickle_run{1,2,3}.json` e `trickle_run2_profile.cpuprofile`.

## Pipeline store -> DOM ricostruita

1. Import XMI: crea solo il modello M1 (502 oggetti). Nessun grafo. Veloce (2.1 s in cloud).
2. Apertura modello: l'effect auto-populate di `useJjomSync` (deps a `useJjomSync.ts:1075`) esegue in sequenza: Step 1 crea il DGraph; Step 2bis crea 501 DVertex; Step 4 crea TUTTI i 1500 DVoidEdge in un unico passaggio sincrono (`useJjomSync.ts:1016-1066`).
3. Le azioni di creazione si accumulano nel buffer della transazione globale perennemente aperta (il `setInterval(() => COMMIT(undefined,false), 300)` a `reducer.ts:1443` chiude e riapre BEGIN a ogni tick; tutte le Action.fire tra un tick e l'altro finiscono in `pendingActions`). Ogni flush produce UN CompositeAction e UN dispatch (`action.ts:349`).
4. Il sync incrementale di `useJjomSync` (effect a :1244) trasforma i nuovi subElements in RF node/edge e li accoda; `scheduleFlush` (:246-259) li applica a React Flow in un solo requestAnimationFrame.
5. Il guard di distribuzione (`EditorV2.tsx:1084-1196`) assegna gli handle indicizzati (`applyDistribution`), poi forza la rimisura: double-rAF + setTimeout(100) + `updateNodeInternals`.
6. `DynamicHandles` (per nodo) osserva il cambio di `activeHandlesKey` e schedula il proprio double-rAF con `updateNodeInternals` sul singolo nodo (`DynamicHandles.tsx:184-203`).
7. Il `reLayoutWatcher` (`EditorV2.tsx:3080-3119`) riesegue una volta `handleAutoLayout` (ELK) quando arrivano gli edge M1; il ricalcolo lati (`computeGeometricAnchorsForAllEdges`) e `applyDistribution` riassegnano gli handle, riattivando i punti 5-6 su tutti i nodi.
8. React Flow renderizza un edge solo se i suoi handle risultano misurati negli internals del nodo; ogni `updateNodeInternals` aggiorna un nodo e fa comparire gli edge che dipendono da quel nodo.

Evidenza chiave lato creazione (run 1, log dispatch): 4 dispatch Redux in tutto il ciclo di open.

| t (in-page) | CompositeAction | Contenuto |
| --- | --- | --- |
| 22 s | n=4 | creazione DGraph |
| 48 s | n=3013 | 501 CreateElement DVertex + 2007 SetField + 504 SetRoot |
| 53 s | n=15000 | 1500 CreateElement DVoidEdge + 12000 SetField + 1500 SetRoot |
| 330 s | n=1002 | 1002 SetField (posizioni x,y post-ELK, `syncPositionBatchToJjom`) |

Lo store contiene i 1500 edge a t=53 s. Il DOM raggiunge 969 edge intorno a t=58 s (run 2, MutationObserver: 969 edge e 501 nodi con appena 69 commit). Il "settle" osservato dal benchmark è la coda: gli ultimi 17 edge compaiono uno alla volta nei successivi 160-280 s.

## Punti di cadenzamento individuati

1. CONFERMATO come cadenzatore reale: catena rAF per-nodo di `updateNodeInternals`. `DynamicHandles.tsx:184-203` (double-rAF per singolo nodo) e `EditorV2.tsx:1149-1186` (double-rAF + setTimeout(100) con querySelector per nodo a :1156). Ogni notifica dello store zustand di React Flow costa un'intera passata dei selettori subscriber (vedi punto 2), quindi ogni frame contiene di fatto UNA iterazione: un nodo rimisurato per commit.
2. CONFERMATO come costo per iterazione: `EdgeLabelRenderer` di @xyflow. Ogni edge renderizzato monta un `EdgeLabelRenderer` incondizionato (`UnifiedEdge.tsx:598-655`), la cui subscription zustand esegue `s.domNode?.querySelector('.react-flow__edgelabel-renderer')` A OGNI notifica dello store RF (`@xyflow/react/dist/esm/index.js:3630`). Con 986 edge renderizzati sono ~986 scansioni dell'intero DOM (~5000+ elementi) per notifica. Profilo CPU (run 2, finestra 283 s): 225 s dentro `querySelector`, cioè l'80% del main thread, con stack dominante `querySelector < selector$6 < ... < updateNodeInternals`.
3. Aggravante per iterazione: `EndpointHandles.tsx:67` usa `useNodes()`, quindi tutti i 986 componenti edge si ri-renderizzano a ogni cambio di internals di QUALSIASI nodo.
4. Trigger della coda: il re-layout ELK del `reLayoutWatcher` (`EditorV2.tsx:3080-3119`, finestra 3 s + debounce 150 ms, ma i timer slittano col main thread saturo: il dispatch delle posizioni è a t=330 s in cloud) riassegna lati e indici handle di tutti gli edge, facendo ripartire una passata completa di rimisure per-nodo serializzate.
5. ESCLUSO come causa del trickle: il `setInterval` di COMMIT a 300 ms (`reducer.ts:1443`, `U.tsx:176`) e il dispatch asincrono per azione (`action.ts:349`). Durante il trickle non c'è alcun dispatch Redux (4 in totale su tutto l'open). Il buffer perpetuo aggrega tutto correttamente.
6. ESCLUSO: `useM1ReferenceEdges` non partecipa (le creazioni passano tutte da Step 4 di useJjomSync; nessun dispatch aggiuntivo osservato).

## Curva dinamica osservata e correlazione

Run 2 (curva in-page via MutationObserver, timestamp per ogni commit React):
- t=58 s: 969 edge nel DOM, 501 nodi, 69 commit. Il grosso appare in blocco, non a goccia.
- t=58->338 s: SOLO 17 edge aggiuntivi (969 -> 986), con ~940 commit, ~1430 rAF (~1.5 per commit), ~31.000 getBoundingClientRect (~33 per commit) e zero dispatch Redux.
- Periodo del ciclo: intervallo tra commit mediano 274 ms (IQR 262-293, moda 280) durante il trickle; identico (285 ms) dopo il settle. E un ciclo a periodo quasi fisso, ma il periodo NON è un timer: è la durata di una iterazione (notifica zustand + 986 scansioni querySelector + re-render), col floor dei 2 frame rAF.
- Run 3 (attribuzione querySelector): 1.549.824 chiamate totali con selettore `.react-flow__edgelabel-renderer`; 1427 chiamate `.react-flow__node[data-id=...]` distribuite UNIFORMEMENTE su tutti i 501 nodi (~3 a testa, nessun nodo privilegiato). Un solo updateNodeInternals per iterazione. Dopo il settle le chiamate node[data-id] si fermano (1427, il ciclo converge) ma resta un churn ambientale di ~1.2 notifiche/s (5916 scansioni edgelabel ogni 5 s = 986 x 6) che costa ~1200 querySelector/s a canvas fermo, per sempre.

Correlazione con i numeri del benchmark:
- Iterazioni totali ~1500 = ~3 passate x 500 nodi. Il conteggio commit del benchmark durante l'open è 1508-1514 (cloud run4/5) e 1538-1556 (M3): COSTANTE tra macchine. E il numero di iterazioni del ciclo, non lavoro CPU-bound.
- M3: 1500 iterazioni in 119-148 s = ~80-95 ms per iterazione. Cloud (run strumentati): ~275 ms. Rapporto ~3x sul costo per iterazione contro ~9x del mount: il costo è dominato da scansioni DOM (memory-bound) più il floor rAF, per questo scala male con la CPU.
- La coda: ~55-60 iterazioni per ogni edge della coda (940/17 in run 2; su M3 ~100-130 s / 17 = 6-7.6 s per edge a ~80-95 ms per iterazione, stesso rapporto). Gli edge della coda compaiono quando l'endpoint giusto viene rimisurato nella passata seriale post-ELK.
- La firma della mutazione singola (20-22 commit, 6-16 s) ha la STESSA spiegazione: misurato in run 1 un solo dispatch Redux seguito da 32 commit e 26.5 s di settle. L'amplificazione non è nel dispatch ma nella cascata render-side, dove ogni commit paga le ~986 subscription.

## Root cause del trickle

Confidenza: alta.

Il settle degli edge è governato da un ciclo di convergenza render-side con numero di iterazioni fisso (~1500, indipendente dall'hardware) e costo per iterazione quasi incomprimibile:

1. Motore del ciclo: le rimisure per-nodo serializzate. Ogni riassegnazione di handle (arrivo edge, applyDistribution, re-layout ELK) fa scattare in `DynamicHandles` un double-rAF con `updateNodeInternals` sul singolo nodo; ogni update genera una notifica dello store RF; la notifica successiva parte solo al frame dopo. Tre passate per 500 nodi = ~1500 iterazioni.
2. Costo per iterazione: a ogni notifica dello store RF, le ~986 subscription `EdgeLabelRenderer` (una per edge renderizzato, montate incondizionatamente da `UnifiedEdge.tsx:598`) rieseguono ciascuna un `querySelector` sull'intero DOM, più il re-render dei 986 `EndpointHandles` iscritti a tutti i nodi via `useNodes()`. Misurato: 80% del main thread in `querySelector`, ~275 ms per iterazione in cloud, ~85 ms su M3.
3. Percezione "a goccia": il 98% degli edge (969) appare in blocco a fine mount; i 17 restanti dipendono dalle rimisure post-ELK e compaiono uno ogni ~55-60 iterazioni. Il tempo di settle misurato dal benchmark è quasi tutto questa coda.

Evidenze: (a) 4 soli dispatch Redux, con i 1500 edge in un unico CompositeAction (esclude ogni cadenzatore lato store); (b) zero registrazioni setTimeout durante il trickle, ~1.5 rAF per commit (esclude timer espliciti, conferma il pacing rAF); (c) profilo CPU con 225/283 s in querySelector sotto lo stack di updateNodeInternals -> selector di EdgeLabelRenderer; (d) 1427 rimisure node[data-id] uniformi (~3 per nodo), un updateNodeInternals per commit; (e) periodo inter-commit stabile a ~275 ms senza alcun timer di quel valore nel codice; (f) conteggio commit ~1500 costante tra cloud e M3 a fronte di tempi per iterazione 3x.

## Interazione con l'overflow handle (report 2026-07-19)

I 514 edge droppati (overflow oltre `MAX_HANDLES_PER_SIDE=4`) NON alimentano il ciclo: non essendo renderizzati non montano EdgeLabelRenderer e non generano retry (le rimisure sono uniformi sui nodi, ~3 a testa, nessuna concentrazione sui nodi ad alto grado o sul Board). Il trickle esisterebbe identico anche senza overflow.

L'interazione è però nell'altra direzione ed è importante: il clamp proposto ieri per recuperare i 514 edge porterebbe gli edge renderizzati da 986 a 1500, cioè +52% di subscription EdgeLabelRenderer e quindi +52% sul costo di OGNI notifica dello store RF. Applicare il clamp da solo peggiorerebbe settle e mutazione singola. Ordine consigliato: prima (o insieme) la leva 1 qui sotto, poi il clamp.

## Leve di fix candidate (ordine beneficio/rischio)

1. `UnifiedEdge.tsx` (NON in critical zone): montare `EdgeLabelRenderer` solo quando ha contenuto visibile. Oggi è incondizionato (:598) anche per gli edge M1, che mostrano la label solo su hover via CSS (:603) e per label vuote (:623 renderizza niente ma la subscription resta). Condizione: label non vuota e non 'newRef' per M2, `hovered || selected || editing` per M1, badge cardinalita, ISA. Nel benchmark azzererebbe ~986 subscription e il loro querySelector per notifica: il costo per iterazione crolla di ~60-80%. Rischio basso: cambio di mount-timing del portal label (verificare hover/editing label M1 e cardinalita). Beneficio atteso: settle da minuti a secondi, mutazione singola da 6-16 s a frazioni.
2. `EndpointHandles.tsx` (NON in critical zone): sostituire `useNodes()` (:67) con subscription mirate ai soli nodi source/target (`useInternalNode(sourceNodeId)` / `useInternalNode(targetNodeId)` o `useStore` con selettore puntuale). Elimina 986 re-render per ogni rimisura di un nodo qualsiasi. Rischio basso.
3. `DynamicHandles.tsx` (fuori dalla lista critical zone ma parte della pipeline handle di §3.10: coordinarsi con `portDistribution.ts`/`handlePosition.ts` in lettura): coalizzare gli `updateNodeInternals` per-nodo in uno scheduler condiviso a livello di modulo (Set di nodeId pendenti + un solo double-rAF che fa UNA chiamata `updateNodeInternals(Map)` per tutti). Riduce le iterazioni da ~1500 a ~3-5. Rischio medio-basso: timing di misura post-paint da preservare (stessa semantica double-rAF), da smoke-testare su drag e creazione edge.
4. `EditorV2.tsx` guard (:1084-1196, NON in critical zone ma adiacente ad applyDistribution): micro-ottimizzazione, sostituire il loop `domNode.querySelector` per nodo (:1156) con l'accesso a `storeApi.getState().nodeLookup` per gli elementi DOM, o costruire una mappa data-id -> elemento con UNA `querySelectorAll`. Utile ma secondario dopo la leva 3.
5. NON toccare per questo problema: `useJjomSync.ts` (critical zone) e il sistema COMMIT/300 ms. La creazione è gia ottimale (un composite unico). Il clamp overflow su `portDistribution.ts` (critical zone) resta valido per il problema dei 514 edge mancanti ma va sequenziato dopo la leva 1.

Nota di misura per la Fase 4: il conteggio `commits_open_flow` (~1500) è il proxy piu stabile del numero di iterazioni del ciclo; il tempo di settle diviso per i commit da il costo per iterazione. Dopo le leve 1-3 ci si aspetta commit <100 e settle nell'ordine dei secondi.

## Domande aperte per Alfonso

1. Churn ambientale post-settle: a canvas fermo restano ~1.2 notifiche RF/s (~1200 querySelector/s, ~1 commit/s) per sempre. Non ho identificato il trigger (candidati: i setInterval da 1000 ms attivi, il size-watcher di `GraphDataElements.tsx:635`, ConformanceProblemSync). Vale una micro-discovery dedicata? Con la leva 1 il costo diventa comunque trascurabile.
2. La leva 1 cambia il comportamento di mount del portal label (montato on-hover per gli edge M1). Accettabile una latenza di un frame alla prima comparsa della label su hover?
3. La leva 3 tocca la pipeline handle descritta in CLAUDE.md §3.10 pur non essendo nella lista critical zone di §3.1: la trattiamo comunque con Layer Impact Report e smoke test dedicati?
4. Upstream: il selettore di `EdgeLabelRenderer` che fa querySelector a ogni notifica è un costo di @xyflow 12.10 (dist :3630). Ha senso aprire una issue upstream o valutare il bump di versione per verificare se è gia stato ottimizzato, prima di lavorare intorno alla libreria?
5. Il README dei benchmark attribuisce il trickle a "creazione vertex/edge al primo open" (nota 1 della tabella cloud): con questa root cause la nota va corretta (la creazione è un singolo dispatch a inizio open; il blocco lungo è il ciclo di rimisure).
