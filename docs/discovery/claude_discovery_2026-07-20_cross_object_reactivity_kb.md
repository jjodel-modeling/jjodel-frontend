# Discovery: reattività cross-oggetto del viewpoint IR (dependency set multi-hop)

Data: 2026-07-20. Sessione read-only su `/home/claude/jjodel-frontend`, branch `alfonso-frontend-jjtl` @ `56d7b20`. Nessun file sorgente modificato, nessun commit.

## Obiettivo

Chiudere il limite dichiarato in spec v1.2 sez. 9 (`docs/specs/spec_2026-07-18_ir_schema_v1_2.md:163-170`): i PathExpr multi-hop leggono eager l'oggetto navigato ma non invalidano il render dell'osservatore quando una feature del target cambia. Serve: (1) anatomia esatta della perdita di invalidazione, (2) come estrarre un dependency set multi-hop dal compile, (3) confronto dei meccanismi di invalidazione con costi, (4) perimetro file, (5) strategia test, (6) casi limite. Vincolo perf: la soluzione non deve reintrodurre lavoro per-store-change pesante (il conteggio commit React è appena stato ottimizzato, vedi `docs/discovery/discovery_2026-07-20_edge_settle_trickle.md`).

## File letti

- `/home/claude/jjodel-frontend/CLAUDE.md` (regole non negoziabili; §3.1 critical zone :108-121; §3.5 Step 4 deps :209-223; §5 discovery :374-416)
- `/home/claude/jjodel-frontend/docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (sez. 3 :41, sez. 4-5 :43-88, sez. 7 :115-144, sez. 9 :163-170, sez. 10 :172-180)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (integrale)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` e `irReadCtxLproxy.ts` (integrali)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (integrale)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (integrale)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` e `irResolveCore.ts` (integrali)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (integrale)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/irCollapseState.ts`, `irEdgeInteraction.ts` (pattern version-hook)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/EditorV2.tsx` (:1195-1335, stabilizzatori e wiring IR)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (:30-70, :375-400)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (:1380-1470, patch incrementale node data)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/utils/jjomTransformers.ts` (:243-300, objectVertexToRFNode)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (fixture idlookup)
- `/home/claude/jjodel-frontend/docs/discovery/discovery_2026-07-20_edge_settle_trickle.md` (integrale)
- `/home/claude/e2e/wiring_e2e.mjs` (bootstrap harness)

## Findings

### F1. Dove si perde l'informazione dei hop: nel valore di ritorno di compilePath

`parsePathExpr` (`irCompile.ts:40-67`) conserva la struttura completa dei hop: `steps: { feature?, take }[]` distingue hop intermedi e passo terminale. Ma `compilePath` (`irCompile.ts:75-96`) ritorna solo `{ fn, featureNames }` con `featureNames` PIATTO (`irCompile.ts:53-54` accumula ogni `$feature` della catena senza posizione). `compileOperand` (`irCompile.ts:102-110`) e i chiamanti (`:219-220`, `:330-334`) versano i nomi piatti in `deps`, che diventa `dependencySet` (`irCompile.ts:281`, `:359`). Risultato: `dependencySet` di una view con path `$assignee.value.$name.value` è `['assignee','name']`, indistinguibile da due feature di self. La struttura (quale feature è hop, quale terminale, su quale oggetto) esiste solo dentro la closure e viene buttata all'uscita di `compilePath`. Questo è l'unico punto di perdita: tutto il resto del pipeline consuma il set piatto.

### F2. Cosa fa il ReadCtx su un hop di reference: pointer string (draw) o proxy (lproxy)

L'accessor compilato (`irCompile.ts:77-94`) risolve gli hop a runtime: `ctx.getValue(currentId, feature)` e, se non è l'ultimo passo, pretende una stringa pointer (`:89`) da usare come `currentId` successivo. Backend draw: `findFeatureRaw` (`irReadCtx.ts:33-46`) matcha la DValue **per nome** della DAttribute/DReference (`:43`) e ritorna `values[0]`, quindi un pointer string per le reference. Backend lproxy (`irReadCtxLproxy.ts:22-31`): `lObj['$'+feature].value` può ritornare un PROXY (non stringa) per le reference; in quel caso il check `typeof out !== 'string'` a `irCompile.ts:89` fa fallire l'hop (bug noto aggirato in `irEdgeViews.ts:191-193` con `toId()` solo per gli endpoint object-as-edge, NON per i multi-hop dentro compilePath). Nota per il fix: la concretizzazione dei dep pair conviene farla con semantica draw (pointer string, nessuna coercizione a upperBound).

### F3. Reattività self: subscription per-nodo già esistente e non filtrata

`useIRView` (`irResolve.ts:37-57`) è la subscription di ogni ObjectNode (`ObjectNode.tsx:48`): il selector costruisce una firma con irSig + snapshot NON filtrato di TUTTI gli slot DValue di self (`:50-55`, commento esplicito: si evita la resolve dentro il selector). Cambia uno slot di self → firma cambia → re-render → `IRNodeContent` rilegge tutto a render-time via readCtx (`IRNodeContent.tsx:34-36`, `:106-148`). I compartment hanno una seconda firma self (`IRNodeContent.tsx:44-65`). Ergo: la macchina per-nodo "selector che produce una stringa → re-render mirato" esiste già e gira su ogni store-change per ogni nodo; estenderla di O(#dep cross) per nodo è marginale.

### F4. Reattività edge: oaeSlotsSig osserva solo gli slot DEGLI oggetti-edge, non dei target navigati

`oaeSlotsSig` (`useIRContainment.ts:69-93`): raccoglie i `dependencySet` (piatti, F1) delle view object-as-edge, poi scandisce `state.objects` e per ogni oggetto la cui metaclasse ha una view oae serializza `fid=JSON(values)` degli slot con nome nel set (`:80-91`). Osserva quindi `source`/`target`/`name` DELLA Transition, mai gli slot dello State navigato. Costo attuale per store-change: O(#oggetti × #feature) con costruzione stringa (scan completo di `state.objects`). La firma entra nel deps del useMemo (`:138`) che ricalcola l'INTERA decoration (buildContainmentModel + i due passi edge, `:95-133`): invalidazione globale, non mirata.

### F5. Anatomia end-to-end del caso rotto (vertex) e del caso "incidentalmente coperto" (edge)

Scenario: O (Task) ha view vertex con label `$assignee.value.$name.value`; slot `assignee` di O punta a B (Person). Muta `B.name` (o un attributo qualsiasi `B.x` letto dal path):

1. Il dispatch Redux rimpiazza la DValue di B in idlookup.
2. `useIRView(B)` vede la firma self di B cambiata → il nodo di B si ri-renderizza (F3). Anche `compartmentSig` di B cambia.
3. `useIRView(O)`: la firma copre solo gli slot di O, invariati → NESSUN re-render di O. React Flow memoizza i node component: il cambio dell'array `nodes` non ri-renderizza O se le sue props non cambiano. **La label di O resta stale** finché O non si ri-renderizza per altre ragioni (drag, select, edit proprio). Questo è il caso pulito del bug.
4. Percorso incidentale lato edge: il sync incrementale di `useJjomSync` ricalcola il node data di B (`useJjomSync.ts:1380-1384`), e `objectVertexToRFNode` (`jjomTransformers.ts:243-300`) include nel data le righe feature (valori attributi e NOMI dei target di reference) più la label; il patch (`useJjomSync.ts:1444-1460`) produce un nuovo array nodes → `stableNodes` cambia (`EditorV2.tsx:1228-1250`, `p.data !== n.data` a `:1236`) → il useMemo di `useIRContainment` ri-esegue (deps `nodes`, `:138`) → `synthesizeObjectAsEdges`/`decorateReferenceEdges` rivalutano le label con un readCtx fresco. Quindi **le label multi-hop degli edge oggi si aggiornano spesso "per caso"** (rename dello State incluso: cambia `data.label` di B), con la latenza del flush rAF, e SOLO perché la mutazione affiora nel node data del target. È un accoppiamento fragile (dipende da cosa objectVertexToRFNode serializza), costoso (ricalcolo O(model) della decoration per qualunque churn di node data, anche fuori dal dep set: viola la seconda metà di sez. 9) e non copre il caso vertex (punto 3).

### F6. Dove agganciare: indice, cache e pattern esistenti

- `irResolveCore.ts`: `computeIRSignature` (`:53-66`) e `indexCache` per signature (`:68`, `getIRIndex :71-159`) danno il punto di aggancio compile-time: l'indice conosce già tutte le compiled view del viewpoint attivo; un eventuale campo strutturato `crossDeps` per view sarebbe disponibile qui senza nuovi giri.
- L'indice inverso runtime (target → osservatori) NON può vivere nell'indexCache (statico per signature: i target dipendono dai VALORI correnti delle reference). Il pattern giusto per stato runtime del modulo ir è il singleton con version-hook: `irCollapseState.ts:11-62` e `irEdgeInteraction.ts:31-128` (Set/Map a livello modulo + `useSyncExternalStore`). Un nuovo `irCrossDeps.ts` con registry `observer → Set<fid>` e inverso `fid → Set<observer>` segue una convenzione già consolidata.
- Concretizzazione (objectId, featureName) → fid: `findFeatureRaw` (`irReadCtx.ts:33-46`) fa già la risoluzione nome→DValue; osservare il fid permette il check più economico possibile (confronto di REFERENCE su `idlookup[fid]`, che Redux rimpiazza a ogni scrittura).

### F7. Vincolo perf dal trickle report

Il trickle (`discovery_2026-07-20_edge_settle_trickle.md`, root cause :79-89) è render-side: subscription per-edge che fanno lavoro DOM per ogni notifica dello store RF. Lezioni per questo cantiere: (a) niente lavoro O(model) o DOM per store-change; (b) niente nuovi cicli rAF o `updateNodeInternals`; (c) il conteggio commit è il proxy di misura (`commits` costante ~1500 all'open): la soluzione non deve aggiungere commit se non quelli strettamente necessari (un re-render del solo nodo osservatore per mutazione del suo dep set). L'estensione naive di oaeSlotsSig (opzione a) va nella direzione opposta: O(#oggetti) di string-building per store-change più ricalcolo globale della decoration.

## Q2: estrazione del dep set multi-hop (proposta)

Compile-time (statico, per view): in `compilePath`, oltre a `featureNames`, esporre per ogni path con `steps.length > 1` la struttura `{ hops: {feature, take}[], terminal: {feature, take} }`. `CompiledView`/`CompiledEdgeView` guadagnano un campo additivo `crossPaths: CompiledCrossPath[]` (modifica additiva a `irTypes.ts`, consentita da CLAUDE.md regola 11). `dependencySet` piatto resta invariato per compatibilità (oaeSlotsSig, test esistenti).

Runtime (dinamico, per oggetto renderizzato): funzione pura `resolveCrossDeps(ctx, idlookup, objectId, crossPaths)` che cammina i prefissi:

- t0 = objectId; per ogni hop i: target = getValue/getValues(t_i, hop.feature) (semantica draw, F2; normalizzare proxy→id come `irEdgeViews.ts:191-193`);
- emette coppie (t_i, feature_{i+1}) per ogni livello: la coppia (O, hop1) è già coperta dalla subscription self; le coppie sui target intermedi e terminale sono il delta cross-oggetto;
- ogni coppia si risolve subito a fid via findFeatureRaw; coppia non risolvibile = feature assente sul target (vedi F9 rename M2);
- hop multivalore (`take: 'values'`): fan-out su tutti i target correnti; `values[N]`: solo l'N-esimo.

Il set è dinamico ma la sua ricomputazione è garantita dal design: il valore di un hop è sempre una feature dell'oggetto al livello precedente, quindi un cambio di hop invalida un osservato già nel set (il primo hop è self, coperto da F3) → re-render → re-registrazione delle coppie fresche. Non serve alcuna manutenzione incrementale separata del set: si ricalcola al render dell'osservatore, che è esattamente quando serve.

## Q3: opzioni di invalidazione a confronto

### (a) Estensione del pattern oaeSlotsSig (firma globale su tutti i target navigati)

Il selector di `useIRContainment` (e uno analogo globale per i vertex) concatenerebbe gli slot osservati di tutti i target raggiungibili. Costi: per store-change deve RI-RISOLVERE i target (i pair dipendono dai valori correnti) oppure scandire tutti gli oggetti come oggi; con 500-1500 oggetti è O(N×feature) di string-building a ogni dispatch, per sempre. Invalidazione non mirata: qualunque slot osservato cambia → ricalcolo dell'intera decoration; per i vertex una firma globale in un hook per-nodo ri-renderizzerebbe TUTTI i nodi (viola sez. 9, "NON DEVE re-renderizzare per feature fuori dal set"). Memoria bassa, complessità bassa, ma scala male ed è contraria al vincolo F7. Bocciata come soluzione generale; accettabile solo come tappabuchi per i soli edge.

### (b) Indice inverso mantenuto incrementalmente (modulo singleton + store.subscribe)

Nuovo `irCrossDeps.ts`: `Map<fid, Set<observerKey>>` + `Map<observerKey, Set<fid>>` + snapshot `Map<fid, lastRef>`. Registrazione al render (useIRView per i vertex, il memo di useIRContainment per gli edge); un unico `store.subscribe` che a ogni store-change confronta per REFERENCE `idlookup[fid]` dei soli fid osservati (O(#dep osservati) confronti puntatore, microsecondi con ~3000 dep) e bumpa i version counter degli osservatori colpiti (useSyncExternalStore per-nodo, pattern irCollapseState). Aggiornamento su cambio del valore della reference intermedia: automatico via re-render+re-registrazione (Q2); il subscribe deve solo ri-snapshottare i ref dopo ogni bump. Costi: per store-change minimi; memoria O(#dep); complessità MEDIA (lifecycle di registrazione/deregistrazione su unmount, notifiche fuori dal batch React, ordine subscribe vs dispatch setTimeout di action.ts). Rischio principale: una seconda infrastruttura di subscription parallela a react-redux, con i suoi edge case di timing.

### (c) Subscription per-nodo estesa (dentro l'infrastruttura useSelector esistente)

Estendere la firma di `useIRView` (`irResolve.ts:38-57`): oltre allo snapshot self, il selector legge le coppie cross (fid) registrate DAL RENDER PRECEDENTE (ref/mappa modulo keyed by vertexId, pattern two-phase: il render pubblica i dep correnti, il selector successivo li consuma) e appende `fid=JSON(values)` o il ref-token della DValue. Costo per store-change: O(#dep del nodo) per nodo, tipicamente 1-3 lookup diretti in idlookup; i selector per-nodo girano già tutti a ogni dispatch (F3), il delta è marginale. Nessuna nuova macchina di subscription; invalidazione mirata al singolo nodo (spec-compliant). Finestra di staleness zero in pratica: un cambio di hop passa dal primo hop (self) che fa già scattare la firma. Limite: copre i vertex; gli edge (useIRContainment) vanno coperti a parte.

### (d) Ibrido raccomandato: (c) per i vertex + registry di coppie per gli edge

- irCompile emette `crossPaths` (Q2).
- Nuovo modulo `irCrossDeps.ts` SENZA store.subscribe: solo registry passivo `vertexId/objectId → fid[]` popolato al render, letto dai selector.
- Vertex: opzione (c) su useIRView.
- Edge: il selector oaeSlotsSig viene esteso (o affiancato) a leggere i fid registrati dall'ultima esecuzione del memo per gli oggetti-edge E per i loro target navigati: da scan O(#oggetti×feature) a O(#coppie registrate) lookup diretti. Nota: questo MIGLIORA anche il costo attuale di oaeSlotsSig. La decoration resta monolitica (un ricalcolo per cambio reale di dep, invece che per ogni churn di node data); granularità per-edge rimandata.
- Il percorso incidentale F5.4 resta come rete di sicurezza; il contratto passa alle firme.

Costi (d): per store-change O(#dep totali) lookup diretti dentro selector già esistenti; zero nuovi commit oltre al re-render del nodo osservatore colpito; memoria O(#dep); complessità concentrata nel two-phase (render pubblica, selector consuma) che va documentato nel modulo. Nessun impatto sul ciclo rAF/updateNodeInternals del trickle.

## Q4: perimetro file e critical zone

Opzione (d), file toccati:

| File | Modifica |
|------|----------|
| `viewpoint/ir/irCompile.ts` | emissione `crossPaths` (additiva) |
| `viewpoint/ir/irTypes.ts` | tipi `CompiledCrossPath` + campo additivo su CompiledView/CompiledEdgeView |
| `viewpoint/ir/irCrossDeps.ts` | NUOVO: resolveCrossDeps + registry passivo (grep preventivo del nome, CLAUDE.md §4.3) |
| `viewpoint/ir/irResolve.ts` | selector di useIRView esteso + pubblicazione dep |
| `viewpoint/ir/useIRContainment.ts` | firma edge basata su coppie registrate |
| `viewpoint/ir/__tests__/ir.test.ts` (o nuovo file test) | estrazione + concretizzazione + firma |

Critical zone (CLAUDE.md §3.1, :108-121): NESSUNO dei file sopra è in lista (useJjomSync, useM1ReferenceEdges, syncState, canvasToJjom, portDistribution, VersionFixer, defaultViewTemplate, DV.tsx restano intoccati). Confermata l'attesa: tutto nel modulo ir. `EditorV2.tsx`, `ObjectNode.tsx`, `IRNodeContent.tsx` non richiedono modifiche (l'invalidazione arriva dalle firme esistenti). Solo letture del D-layer, nessun write path: Layer Impact Report non dovuto (§3.2), da dichiarare `not-required` nel log. Le opzioni (a) e (b) toccherebbero gli stessi file, (b) in più aggiunge il subscribe in irCrossDeps.ts.

Impatto sul conteggio commit React: (d) aggiunge un solo re-render del nodo osservatore per mutazione reale del suo dep set (commit che DEVE esserci per contratto sez. 9); nessun lavoro aggiuntivo per store-change fuori dai selector già attivi; nessun nuovo rAF. Compatibile con le leve del trickle report.

## Q5: strategia di test

Vitest puro (fixture idlookup, stile `__tests__/ir.test.ts:31-53`, estendendo `world()` con una DReference `R_assignee` e un hop): 

1. Estrazione: `compileView` con label `$assignee.value.$name.value` → `crossPaths = [{hops:[assignee], terminal:name}]`; `dependencySet` piatto invariato; path a 3 hop; path con `values`; path single-hop → `crossPaths` vuoto.
2. Concretizzazione: `resolveCrossDeps` su fixture → coppie (targetId, 'name') e fid corretti; hop multivalore → fan-out; reference vuota → set vuoto; ciclo O→B→O → terminazione e dedup; target inesistente → coppia assente.
3. Firma/invalidazione: simulare lo store-change clonando idlookup con una DValue rimpiazzata → la firma cambia solo per gli osservatori registrati su quel fid; DValue non osservata → firma invariata; fid sparito (delete) → firma cambia (marker 'gone').
4. Rename M2: fixture con DAttribute rinominata → resolveCrossDeps segnala la coppia non risolta (F9).

E2E (copiare il bootstrap da `/home/claude/e2e/wiring_e2e.mjs`: chromium `/opt/pw-browsers/chromium`, offline mode, New Project, import `sm.ecore` + `sm.xmi`, attivazione viewpoint IR sul test bed Machine/State/Transition):

- Scenario discriminante (caso vertex, oggi ROSSO): view vertex di State con una label multi-hop che legge una feature di un ALTRO oggetto (es. `$machine.value.$name.value` o un attributo del target); editare la feature sul target via double-click/Properties; assert sul testo DOM del nodo osservatore senza toccarlo. Pre-fix fallisce (F5.3), post-fix passa.
- Scenario utente (label dell'edge Transition che legge il nome dello State sorgente: rename dello State → label aggiornata): ATTENZIONE, oggi può già passare per il percorso incidentale F5.4 (il rename cambia `data.label` del nodo State). Va eseguito PRIMA sul codice corrente per fissare la baseline; resta come test di accettazione, ma il criterio di verità del meccanismo è lo scenario vertex.

## Q6: casi limite

1. **Catene 3+ hop**: coppie a ogni livello (Q2); profondità limitata dall'espressione; il costo del fan-out cresce col prodotto delle cardinalità intermedie.
2. **Reference multivalore**: si osservano TUTTI i target correnti (per `values`), solo l'N-esimo per `values[N]`. Proporre un cap (es. 100 target per path) con console.warn oltre soglia, per non degenerare su modelli densi.
3. **Cicli** (O→B→O): la camminata è lineare (un passo per hop), non una chiusura transitiva: termina sempre; dedup delle coppie per (objectId, feature); le coppie su self collassano nella subscription self.
4. **Target cancellato**: l'hop ritorna undefined → path degrada a undefined (fallback esplicito sez. 10, `spec:172-180`); il fid osservato sparisce da idlookup → la firma deve trattare 'assente' come cambiato (marker), così l'osservatore si ri-renderizza e ri-registra il set ridotto.
5. **Cambio del valore dell'hop** (B sostituito da C): il primo hop è uno slot self → firma self scatta (F3) → re-render → re-registrazione con i nuovi target. Per hop intermedi di catene lunghe, lo slot intermedio è già una coppia osservata. Nessun caso scoperto.
6. **Rename di feature M2** (incident di oggi: i PathExpr persistiti si rompono in silenzio perché `findFeatureRaw` matcha per nome, `irReadCtx.ts:43`): la concretizzazione risolve nome→fid a OGNI registrazione; una coppia che non risolve è esattamente il segnale "il path referenzia una feature che non esiste (più) su questo target". Il meccanismo può accorgersene a costo zero (la lookup avviene comunque) ed emettere un warning one-shot per (viewId, featureName). Caveat inverso: un fid GIÀ risolto resta valido dopo il rename (la DValue non cambia); poiché la risoluzione è per nome a ogni re-registrazione, il primo re-render successivo fa emergere la rottura. Per accorgersene SUBITO al rename bisognerebbe osservare anche i ref delle DAttribute/DReference usate (poche, costo trascurabile): opzione da decidere, non necessaria per il contratto sez. 9.

## Raccomandazione

Opzione (d): `crossPaths` strutturati dal compile + registry passivo di coppie (objectId, feature)→fid + estensione dei selector esistenti (useIRView per i vertex, firma registrata per gli edge in useIRContainment). Motivazione: invalidazione mirata per-nodo come richiede sez. 9, costo per store-change O(#dep) dentro infrastruttura già attiva, zero nuove subscription fuori React, nessun file di critical zone, e riduce pure il costo attuale di oaeSlotsSig. L'opzione (b) resta il fallback se il two-phase selector si rivelasse fragile; l'opzione (a) è bocciata per il costo per-store-change e l'invalidazione globale.

Rischi principali: (1) il two-phase (render pubblica, selector consuma) introduce una dipendenza d'ordine da documentare e testare (primo render senza dep registrati: innocuo, la registrazione avviene nello stesso commit); (2) coerenza draw/lproxy nella concretizzazione degli hop (F2): usare semantica draw con normalizzazione toId; (3) leak del registry su unmount/cambio viewpoint: prevedere cleanup su unmount e su cambio irSig.

## Domande aperte per Alfonso

1. Confermi la semantica draw per la concretizzazione dei dep pair anche con backend lproxy attivo (la coercizione a upperBound del proxy potrebbe far divergere target osservati e valore renderizzato)?
2. Cap sul fan-out delle reference multivalore: 100 target per path con warning va bene?
3. Warning one-shot per feature non risolta (rename M2): basta console.warn o va portato nel problems panel? E vale la pena osservare anche i ref delle feature M2 per accorgersi del rename al primo dispatch invece che al primo re-render?
4. La decoration edge resta monolitica (un ricalcolo per cambio reale di dep): accettabile per il Blocco 1, o vuoi già la granularità per-edge?
5. Il percorso incidentale F5.4 (node-data churn → ricalcolo decoration) oggi viola la seconda metà di sez. 9 (re-render per feature fuori dal set). Lo lasciamo come rete di sicurezza in questo cantiere e lo si stringe dopo, o va gestito insieme?
