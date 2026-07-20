# Discovery — Wiring connect gesture + containment drop (viewpoint IR)

**Data**: 2026-07-20
**Tipo**: Fase 1 read-only del cantiere wiring interaction plan IR (prompt `2026-07-20_prompt_discovery_wiring_connect_containment_ir.md`).
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**HEAD**: `2fc39692e` (il delta rispetto a `417372c6e` citato nel prompt è un solo commit su `.claude/scheduled_tasks.lock`: tutti i riferimenti di riga del prompt restano validi).
**Esecuzione**: sessione Cowork cloud autonoma (delega di Alfonso: Fase 2 condizionata).

## Obiettivo

Rispondere alle domande A1-A6 (connect gesture verso object-as-edge), B1-B4 (containment drop), C1-C3 (trasversali) del prompt; validare le ipotesi H1-H4; emettere il verdetto sulle due condizioni della Fase 2 condizionata (perimetro fuori critical zone; sequenza D→L validabile con test).

## File letti/analizzati

- `frontend/src/components/editor-v2/EditorV2.tsx` (onConnect :1332, onConnectEnd :1348, ramo M1 :1372-1458, handleM1ReferenceSelected :1637-1726, handleReconnect :1729-1806, onDrop :1809-1911, onDragOver :1983-1996, createCompositionChild :2453-2509, context menu composition :2625-2665, popups :3648-3666)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (createVertexForObject :1239, syncCreateObject :1284, syncUpdateFeatureValue :1385, syncCreateCompositionLink :1420, syncCreateReferenceLink :1491, reconcileJjomAfterUndoRedo :1577) — SOLO lettura
- `frontend/src/components/editor-v2/sync/syncState.ts` (markDropCreated :39, markCanvasUpdated :83)
- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (useIRInteractionPlan :50, oaeSlotsSig)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (synthesizeObjectAsEdges :162-251)
- `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` (intero) e `IRContainmentHulls.tsx` (intero)
- `frontend/src/components/editor-v2/components/M1ReferencePopup.tsx` (intero)
- `frontend/src/components/editor-v2/utils/compositionCompat.ts` (intero)
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (MetaclassInfo :43, build references :355-390, rootableClasses :452-454)
- `frontend/src/components/editor-v2/hooks/useHistory.ts` (takeSnapshot/undo/redo)
- `frontend/src/model/conformance/useConformanceGuard.ts` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (struttura describe, blocco irInteraction :488)

## Findings A — connect gesture → object-as-edge

### A1. Matching della connect rule: fattibile in puro, dati sufficienti

`MetaclassInfo` (useEditorMode.ts:43) porta tutto il necessario: `references: MetaclassReference[]` con `name`, `targetClassId`, `targetClassName`, `containment`, e `concreteSubclasses` precomputate ricorsivamente. Le references includono le ereditate: il build usa `cls.allReferences ?? cls.references` (:155, :358). La rule porta nomi: `edgeMetaclass` si risolve per NOME in `allClasses`; `sourceFeature`/`targetFeature` si risolvono per nome tra le references della metaclasse edge (sono reference, non attributi: per una Transition, `source` e `target` sono DReference verso State).

Conformance endpoint: identico al pattern già committato in `getCompatibleReferences` (compositionCompat.ts:113-115): match diretto su `targetClassId` oppure `concreteSubclasses.some(sub => sub.id === X)`. La funzione di matching proposta è pura, in `irInteraction.ts`:

```typescript
matchConnectRules(plan, sourceClassId, targetClassId, allClasses): IRConnectRuleMatch[]
```

Rule malformata (metaclasse edge non trovata, feature inesistente o non-reference): la rule è inapplicabile e va saltata; warn solo dev-gated con `(import.meta as any).env?.DEV ?? false`. Limite documentato: target cross-MM non risolvibili in `allClasses` non matchano (stesso limite di `getCompatibleContainmentRefs`, vedi B2).

### A2. Sequenza di creazione: le scritture sincrone post-creazione sono già comportamento committato

Evidenza nel codice verificato:

1. `onDrop` :1856 legge il nome dell'oggetto appena creato via proxy L SUBITO dopo `syncCreateObject` (comportamento committato e verificato).
2. `createCompositionChild` :2484 chiama `syncCreateCompositionLink` immediatamente dopo `syncCreateObject`; quella funzione risolve `childProxy.model` e scrive `refProxy.values` in modo sincrono (canvasToJjom :1426-1462).
3. `handleReconnect` :1750-1757 scrive `slot.value = newObjId` su uno slot reference con il valore = id del DObject target (non il vertex id).

Quindi la sequenza per l'object-as-edge NON richiede il differimento di CLAUDE.md §9.2 (quello serve quando si cerca l'oggetto per nome via `lModel.objects` dopo TRANSACTION esterne): qui abbiamo il vertexId e il proxy si risolve subito, come nei tre path sopra. Sequenza derivata:

```
takeSnapshot()
vertexId = syncCreateObject(graphId, edgeClassId, midX, midY)   // posizione: punto medio tra i due endpoint
syncUpdateFeatureValue(vertexId, rule.sourceFeature, srcObjectId)  // srcObjectId = DObject id (da sourceNode via proxy .model.id, pattern :1647-1648)
syncUpdateFeatureValue(vertexId, rule.targetFeature, tgtObjectId)
markDropCreated(vertexId)
setNodes(aggiunta del nodo RF)   // per ULTIMO, vedi A3
```

`syncUpdateFeatureValue` (:1385) fa la stessa scrittura di forma del reconnect (`$feat.value =` dentro TRANSACTION): path canonico, nessuna API nuova. Il rischio residuo (slot DValue non ancora materializzato alla prima scrittura) è basso (la creazione degli slot avviene alla creazione dell'oggetto, vedi discovery XMI 2026-07-20 su `_forceConformity`) e viene chiuso in Fase 2 da un test di integrazione scritto PRIMA del wiring (vedi verdetto condizioni).

### A3. Reattività: il vertex DEVE stare nell'array nodes; l'ordine delle scritture evita il flicker

`synthesizeObjectAsEdges` (irEdgeViews.ts:176-198) itera i NODI del canvas: senza il nodo RF del vertex edge-object, nessun edge sintetico viene emesso. Quindi il gesto deve aggiungere il nodo RF manualmente (con `markDropCreated` per evitare la duplicazione da useJjomSync), come fa onDrop.

Anti-flicker: aggiungendo il nodo RF DOPO aver scritto entrambi gli slot, al primo render in cui il nodo esiste la decoration risolve già gli endpoint, nasconde il vertex (:222) ed emette l'edge sintetico nello stesso commit. Il fallback a nodo visibile (:198) resta per i casi degeneri (endpoint cancellato dopo la creazione), che è il suo ruolo da spec (sez. 10). La subscription `oaeSlotsSig` (useIRContainment.ts) copre le mutazioni successive degli slot.

### A4. Superficie UI: M1ReferencePopup estendibile in modo additivo

`M1ReferencePopup` (components/M1ReferencePopup.tsx) riceve `options: CompatibleReference[]` e due callback; riusa `EdgeTypePopup.scss`; icone SVG inline per composition/reference. Estensione additiva (regola 11 CLAUDE.md): nuova prop opzionale per le voci object-as-edge (es. `objectEdgeOptions` con label "New <Metaclasse>") + callback dedicata; le props esistenti non cambiano. Auto-select esistente: 1 sola reference compatibile → creazione diretta senza popup (:1436-1442).

### A5. Guardie: nessuna nuova; parità con i path esistenti

Slot dell'oggetto nuovo: vuoti, upperBound tipicamente 1, nessun upper bound da controllare. `guardObject` esiste (useConformanceGuard.ts:38) ma NON ha call site in EditorV2 (nemmeno onDrop lo usa): per parità non si introduce. `guardLink` resta per le reference dirette (path invariato) e per il containment drop (B3). `markCanvasUpdated` non serve: il gesto non crea DVoidEdge (l'edge è sintetico, render-side).

### A6. Palette e object-as-edge: caso quasi sempre moot

`rootableClasses` esclude le classi target di composition, sottoclassi comprese (useEditorMode.ts:452-454), e la palette IR è l'INTERSEZIONE rootable ∩ plan (`applyIRPaletteFilter`). Nel test bed sm.ecore né State né Transition sono rootable: non appaiono in palette a prescindere dal plan. Se in un altro metamodello la metaclasse object-as-edge fosse rootable, il drop su canvas crea l'oggetto con slot vuoti → fallback a nodo visibile, esplicito da spec: accettabile, nessun gating necessario.

## Findings B — containment drop

### B1. Hit-test: il target affidabile è il bbox del NODO container, non lo hull

`IRContainmentHulls` non è una superficie di drop: `pointerEvents: 'none'` sul rettangolo (solo l'header è `all`), `zIndex: -1`, e lo hull viene disegnato SOLO se il container ha almeno un figlio visibile (:51). Un container ancora vuoto non ha hull. Hit-test proposto: `screenToFlowPosition` (già calcolato in onDrop :1819) + scan O(n) dei bbox dei nodi (`position` + `measured`), preferendo il nodo container più piccolo in caso di sovrapposizione. Opzionale: considerare anche il rettangolo hull (ricomputabile con la stessa matematica: HULL_PADDING 24, HULL_HEADER 22) come area valida quando presente. Nota: il drop dalla palette è HTML5 DnD (React.DragEvent), non un drag RF; `getIntersectingNodes` non è necessario, il bbox scan è dependency-free.

Container collassato: nodo visibile, hull assente, e un figlio creato dentro verrebbe nascosto subito da `computeHidden`. Decisione proposta (D3 sotto): in v1 il container collassato NON è drop target.

### B2. Scelta della feature: l'utility esiste già, mai cablata

`getCompatibleContainmentRefs(parentMetaclass, droppedClassId, allClasses)` (compositionCompat.ts:31-64) fa esattamente il filtro invertito richiesto (match diretto + sottoclassi), e `isDropCompatible` (:69) dà il booleano per il feedback. ATTENZIONE: il commento di testa del modulo (:4-7) dichiara "Reused by: onDrop handler, onDragOver handler", ma il grep globale mostra ZERO call site fuori dal modulo: il commento è aspirazionale, le utility sono committate e mai consumate. Sono pronte per questo cantiere (e questo cantiere le rende vive). Caso ambiguo (più ref compatibili) → picker; caso vuoto → drop rifiutato. Limite: target cross-MM non gestiti da `getCompatibleContainmentRefs` (skip silenzioso :43); documentato, non bloccante per v1.

### B3. Percorso di creazione: variante parametrizzata di createCompositionChild

`createCompositionChild` (:2453-2509) fa già: `syncCreateObject` + `syncCreateCompositionLink` + edge RF manuale con anchoring. La variante drop: posizione dal cursore (niente stacking `existingChildCount`), parent dal hit-test, ref dalla scelta B2, con `guardLink(parentObjectId, refName)` prima di creare (parità col context menu :2635) e `markDropCreated` su vertexId ed edgeId (:2469, :2487). Interazione con la decoration IR a container espanso: figlio visibile a coordinate assolute (containment-by-hull), edge composition visibile dentro lo hull; è il comportamento già committato del path context menu nei viewpoint IR, invariato.

Gate rootable (:1848-1850): va ramificato. Drop su container valido con ref compatibile → consentito anche se la classe non è rootable (è ESATTAMENTE il caso State/Transition del test bed, oggi creabili solo da context menu). Drop su canvas nudo → invariato (solo rootable). Perché la palette OFFRA le classi non-rootable droppabili nei container serve anche estendere il filtro palette IR: oggi `applyIRPaletteFilter` interseca con le sole rootable; la v1 del wiring aggiunge le metaclassi child dei `dropContainers` alla lista offerta in modalità IR (con lo stesso fallback normativo). Senza questo, il gesto non è esercitabile sul test bed.

### B4. Gating e feedback: estensione a costo basso di onDragOver

Metaclasse del nodo sotto il cursore: `ObjectNodeData.instanceOfClassId` è già in `node.data` (pattern :1391); `dropContainers` porta NOMI → risoluzione nome→MetaclassInfo via `allClasses`. Feedback: `onDragOver` (:1983-1996) già oggi calcola la classe trascinata (`getDraggedMetaclassId`, util `dragState`) e setta `event.dataTransfer.dropEffect`; l'estensione naturale è: hit-test del container sotto il cursore + `isDropCompatible` → `dropEffect = 'move' | 'none'`. Costo per evento: bbox scan O(n), accettabile; H4 è quindi soddisfacibile subito invece che rimandata.

## Findings C — trasversali

### C1. Undo: semantica ereditata, nessun rischio nuovo

`useHistory` è RF-level (snapshot JSON di nodes/edges, max 50); la riconciliazione JjOM post-undo esiste SOLO per gli attributi dei classNode (`reconcileJjomAfterUndoRedo`, canvasToJjom :1577). I gesti M1 esistenti (connect, drop, context menu) già oggi NON revocano JjOM all'undo: il canvas torna indietro, l'oggetto e i valori restano (alla reload riappaiono). I nuovi gesti ereditano identica semantica; per l'object-as-edge l'undo rimuove il vertex dall'array nodes e quindi l'edge sintetico sparisce dal canvas, ma l'oggetto resta in JjOM. Coerente con lo smoke 8 del cantiere persistenza ("undo senza revoca né corruzione"). Nessuna chiamata snapshot aggiuntiva oltre la parità (`takeSnapshot` a inizio gesto).

### C2. Non-regressione (perimetro da NON toccare nel comportamento)

Connect M1 senza viewpoint IR (auto-select + popup reference) · connect M2 (`EdgeTypePopup`) · context menu composition children · onDrop M2 e standalone · reconnect object-as-edge (:1737) e re-target reference M2 (:1771) · fallback palette normativo · path classic. I log `[BUG-DIAG-DROP]` committati nella zona restano (non rimuovere, non aggiungere).

### C3. Perimetro file proposto per la Fase 2

1. `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` — funzioni pure nuove: `matchConnectRules`, helper palette per classi droppabili nei container (B3).
2. `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` — unit test delle funzioni nuove.
3. `frontend/src/components/editor-v2/components/M1ReferencePopup.tsx` — props additive per le voci object-as-edge.
4. `frontend/src/components/editor-v2/EditorV2.tsx` — wiring: ramo M1 di onConnectEnd, onDrop, onDragOver, render popup.
5. NUOVO `frontend/src/components/editor-v2/sync/__tests__/canvasToJjomSequence.int.test.ts` — test di integrazione della sequenza A2 (store reale in vitest, fattibilità dimostrata dai test ecore-io che manipolano lo store).

Nessun file critical zone. `canvasToJjom.ts` non si tocca (il test nuovo vive in `__tests__/`, file nuovo). Se in implementazione servisse toccare altro: STOP e report, come da regole.

## Validazione ipotesi

- **H1 (connect: auto-create se unica, popup se coesistenza) — SUPPORTATA.** Il pattern auto-select esiste (:1436-1442); l'estensione del popup è additiva (A4). Regola derivata: 0 reference dirette + 1 rule → creazione diretta; qualunque coesistenza → popup unico a due famiglie di voci.
- **H2 (drop: diretta se una feature, picker se più) — SUPPORTATA.** `getCompatibleContainmentRefs` restituisce la lista per-ref; con 1 elemento si crea direttamente, con più si riusa il popup (voci = ref compatibili).
- **H3 (re-parenting fuori scope) — SUPPORTATA.** Nessun macchinario drag-into-container esiste; il reparenting RF vero è esplicitamente differito dall'header di `irContainment.ts` perché cambia la semantica delle coordinate nel write-back (critical zone adjacent).
- **H4 (feedback rimandato se costoso) — RIVISTA.** Il feedback cursore è a costo basso via `onDragOver` esistente (B4): si implementa in v1 invece di rimandarlo.

## Verdetto condizioni Fase 2 (delega "Fase 2 condizionata")

1. **Perimetro fuori critical zone, nessuna API nuova in canvasToJjom**: VERIFICATO. Le 4 API esistenti coprono entrambi i gesti (A2, B3).
2. **Sequenza D→L validabile con test**: VERIFICABILE. Tre evidenze committate di scritture sincrone post-creazione (A2); il test di integrazione (file 5 del perimetro) si scrive PRIMA del wiring: se fallisse, la Fase 2 si ferma lì e si riporta (fallback: harness Playwright sul dev server, pattern repro.mjs del 19/07).

Entrambe verdi → la Fase 2 procede in cloud con consegna a patch, commit separati: (1) connect gesture, (2) containment drop.

## Decisioni proposte sotto delega (ratificabili al rientro)

- **D1**: matching e auto-create secondo H1; label voci popup object-as-edge: "New <Metaclasse>".
- **D2**: posizione del vertex nascosto = punto medio tra i due endpoint.
- **D3**: container collassato NON è drop target in v1 (dropEffect 'none'); niente auto-expand al drop.
- **D4**: in modalità IR la palette offre anche le metaclassi child dei dropContainers (altrimenti il gesto drop non è esercitabile quando i child non sono rootable, come nel test bed); il fallback normativo resta invariato.
- **D5**: feedback drop = solo cursore via dropEffect (niente highlight hull in v1).

## Rischi

- Slot non materializzato alla prima scrittura (A2): probabilità bassa, chiuso dal test di integrazione test-first.
- Popup a due famiglie: rischio UX di affollamento se un metamodello ha molte reference + molte rules; mitigato dall'ordinamento (reference dirette prima, object-as-edge dopo).
- Cross-MM non coperto da matching e containment refs (limite dichiarato, invariato rispetto all'esistente).
- Costo onDragOver con canvas grandi: bbox scan O(n) per evento; se il profiling lo mostrasse rilevante, throttle (non atteso a 1500 nodi).

## Domande aperte per Alfonso

1. D3: preferisci l'auto-expand del container collassato al drop, invece del rifiuto? (v1: rifiuto)
2. D4: la palette IR estesa ai child droppabili ti va come default, o la vuoi dietro toggle?
3. Wording delle voci popup: "New Transition" o "Transition (source → target)"?
