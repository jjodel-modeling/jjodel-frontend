# Prompt Claude Code — Discovery: wiring connect gesture + containment drop (viewpoint IR)

**Data**: 2026-07-20
**Tipo**: Fase 1 di un task two-phase. SOLO discovery read-only + report. Nessuna modifica al codice.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Base attesa**: `417372c6e` (i riferimenti di riga in questo prompt sono validi su quel commit; se HEAD è avanzato, ri-verifica i numeri con grep prima di citarli nel report)
**Effort**: xhigh

---

## Contesto

Il viewpoint IR (spec v1.2) deriva da `irInteraction.ts` un interaction plan: `paletteMetaclasses`, `connectRules` (dalle view object-as-edge: `{edgeMetaclass, sourceFeature, targetFeature}`), `dropContainers` (dalle view graphVertex). Del plan oggi è cablata SOLO la palette (`applyIRPaletteFilter` in `EditorV2.tsx:1322-1327`). Mancano i due gesti, rimandati con rationale in `docs/discovery/discovery_2026-07-18_write_path_interaction_plan.md`:

1. **Connect gesture → creazione object-as-edge.** Oggi il gesto connect in M1 (`onConnectEnd`, ramo M1 a `EditorV2.tsx:1372-1458`) crea solo reference/composition link tra oggetti esistenti (auto-select se 1 sola compatibile a :1436, altrimenti `M1ReferencePopup`). Con una connect rule IR attiva, il gesto tra due nodi compatibili deve poter creare l'OGGETTO edge (es. una `Transition` tra due `State`): `syncCreateObject` + scrittura dei 2 slot source/target. L'edge visivo non va creato a mano: la synthesis (`irEdgeViews.ts` + subscription `oaeSlotsSig` in `useIRContainment.ts`) lo deriva dagli slot.

2. **Containment drop gating.** Oggi il drop dalla palette (`onDrop`, `EditorV2.tsx:1809`) crea solo oggetti rootable sul canvas (gate a :1848-1850, i non-rootable escono in silenzio); i figli di composizione si creano solo dal context menu (`createCompositionChild`, `EditorV2.tsx:2453`). Con viewpoint IR attivo, il drop di una metaclasse child sopra un container (nodo con view graphVertex, presente in `dropContainers`) deve creare oggetto + composition link nel container; il drop su container non abilitati o su canvas (se non rootable) resta rifiutato.

Il write path resta ESCLUSIVAMENTE quello canonico di `canvasToJjom.ts` (critical zone): `syncCreateObject` (:1284), `syncUpdateFeatureValue` (:1385), `syncCreateCompositionLink` (:1420), `syncCreateReferenceLink` (:1491). Nessun write path nuovo. Se dalla discovery emergesse la necessità di una API nuova in `canvasToJjom.ts`: STOP, si discute in chat prima.

Questo prompt copre la Fase 1. La Fase 2 (implementazione) sarà un prompt separato, generato in chat dopo l'analisi del report e il go-ahead esplicito di Alfonso.

---

## COSA — domande a cui la discovery deve rispondere

### A. Connect gesture → object-as-edge

- **A1 — Matching della connect rule.** `IRConnectRule` porta `edgeMetaclass` e i NOMI delle feature source/target, ma non i tipi degli endpoint. Per decidere se una rule si applica al gesto tra il nodo X (metaclasse MX) e il nodo Y (metaclasse MY) servono i tipi target delle due feature di `edgeMetaclass`, con conformance sull'ereditarietà. Verifica che `modeInfo.allClasses` (`MetaclassInfo` in `useEditorMode.ts:43`, con `references[].targetClassId` e `concreteSubclasses` precomputati) basti per una funzione di matching PURA da aggiungere a `irInteraction.ts`. Documenta: come risalire dalla feature name al tipo (attenzione: source/target di una Transition sono reference, non attributi), come gestire subtyping su entrambi i lati, cosa succede se la feature non esiste nella metaclasse (rule malformata: da ignorare con quale feedback?).
- **A2 — Sequenza di creazione e timing D→L.** La sequenza candidata è: `takeSnapshot()` → `syncCreateObject(graphId, edgeMetaclassId, x, y)` (ritorna il vertexId; il nodo dell'object-as-edge è nascosto dalla decoration) → scrittura dei 2 slot. Verifica COME scrivere gli slot subito dopo la creazione: `syncUpdateFeatureValue(vertexId, featName, objId)` funziona sincrono, o il proxy L non è ancora disponibile (CLAUDE.md §9.2, TRANSACTION async in microtask, `pendingCreation`)? Confronta col path già funzionante di `handleReconnect` (`EditorV2.tsx:1729-1769`) che scrive `slot.value = newObjId` su un oggetto ESISTENTE. Documenta la sequenza esatta che funziona (eventuale `setTimeout`/microtask, e con quale rischio di flicker), e che valore va scritto nello slot (DObject id del target, non vertex id: vedi :1750 e :1757).
- **A3 — Reattività post-creazione.** Verifica che la subscription `oaeSlotsSig` (`useIRContainment.ts`, snapshot degli slot endpoint) re-firi quando l'oggetto nuovo viene creato e i suoi slot valorizzati, e che l'edge sintetico appaia senza refresh. Attenzione al caso intermedio: oggetto creato con slot ancora vuoti → per spec il fallback è il nodo visibile; documenta se nel transitorio il nodo fallback lampeggia e con che meccanica evitarlo (ordine delle scritture, posizionamento del vertex).
- **A4 — Superficie UI.** Il popup M1 esistente è `M1ReferencePopup` (`components/M1ReferencePopup.tsx`, options = `CompatibleReference[]` da `compositionCompat.ts:100`). Documenta la sua struttura props/rendering e cosa serve per fargli offrire ANCHE voci object-as-edge (etichetta tipo "New Transition") accanto alle reference dirette, quando per la stessa coppia di nodi esistono entrambe. Mappa anche il caso auto-select: oggi 1 sola reference compatibile → creazione diretta senza popup (:1436-1442).
- **A5 — Guardie.** `guardLink` (`useConformanceGuard`, `model/conformance/useConformanceGuard.ts:26`) copre gli upper bound delle reference da un oggetto ESISTENTE. Per l'object-as-edge le scritture sono sugli slot dell'oggetto NUOVO (tipicamente upperBound 1: nessun problema), ma verifica se esistono vincoli da rispettare lato endpoint (es. opposite/containment) e se `markDropCreated` va chiamato sul vertexId creato (confronta onDrop :1900 e createCompositionChild :2469).
- **A6 — Palette e object-as-edge.** `deriveIRInteraction` mette le metaclassi object-as-edge in palette (`irInteraction.ts:58-60`). Documenta cosa succede OGGI droppando una Transition dalla palette sul canvas (nodo fallback visibile? nodo nascosto orfano?) e se il comportamento è accettabile come via alternativa di creazione o va gated.

### B. Containment drop

- **B1 — Hit-test del drop target.** Al drop serve identificare il container sotto il cursore. Documenta le opzioni concrete: bounding box dei nodi RF (`getNodes()` + `screenToFlowPosition`, già usato in onDrop :1819), `getIntersectingNodes` di React Flow, o la geometria degli hull (`IRContainmentHulls.tsx`: verifica se è un overlay SVG passivo o intercetta pointer events). Indica quale superficie è il target giusto quando il container è collassato (`irCollapseState.ts`).
- **B2 — Scelta della composition feature.** Dato container di metaclasse MC e child di metaclasse MK, la feature da scrivere va derivata dalle composition references di MC compatibili con MK. Verifica se `getCompositionChildOptions` (`compositionCompat.ts:128`, già usata dal context menu :2634) fa esattamente questo lavoro ed è riusabile invertita (dato il child, filtrare le ref); documenta il caso ambiguo (più ref compatibili) e quello vuoto (drop da rifiutare).
- **B3 — Percorso di creazione.** `createCompositionChild` (:2453-2508) fa già oggetto + `syncCreateCompositionLink` + edge RF con anchoring; il drop-on-container ne è una variante con posizione dal cursore e parent dal hit-test. Documenta cosa è riusabile as-is, cosa va parametrizzato, e come interagisce con la decoration IR (il child di un graphVertex container viene nascosto/riposizionato da `irContainment.ts`? l'edge composition viene liftato?). Verifica anche il gate rootable a :1848-1850: il child non-rootable droppato su container valido deve passare, su canvas nudo no.
- **B4 — Gating e feedback.** `dropContainers` contiene NOMI di metaclassi container. Documenta come risalire, dal nodo RF sotto il cursore, alla metaclasse del suo oggetto (via `model.objByVertex` di `useIRContainment` o via `ObjectNodeData.instanceOfClassId`) e quale feedback minimo è disponibile per un drop rifiutato (oggi il rifiuto è silenzioso; esiste macchinario di highlight su drag-over riusabile a costo basso, es. `HighlightProvider`, o il feedback visivo è da rimandare?).

### C. Trasversali

- **C1 — Undo.** Entrambi i gesti creano oggetto + scritture successive. Verifica la semantica di `takeSnapshot` sui path esistenti (M1 connect :1656, onDrop :1914 solo standalone) e documenta se un undo dopo la creazione object-as-edge lascia stati intermedi (oggetto senza slot, slot senza oggetto).
- **C2 — Non-regressione.** Elenca i comportamenti che il wiring NON deve toccare: gesto connect M1 senza viewpoint IR (reference dirette, auto-select, popup), gesto connect M2 (`EdgeTypePopup`), context menu composition children, onDrop M2, reconnect (sia object-as-edge sia reference M2).
- **C3 — Perimetro file per la Fase 2.** Proponi la lista minima dei file da toccare in Fase 2 con una riga di rationale ciascuno. Attesi: `EditorV2.tsx`, `irInteraction.ts` (+ `__tests__/ir.test.ts`), `M1ReferencePopup.tsx`, forse `useIRContainment.ts`. Se la lista supera questi o include file critical zone: evidenzialo in cima al report.

---

## DOVE — mappa dei file (riferimenti @ 417372c6e)

| File | Cosa guardare |
| --- | --- |
| `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` | Plan derivato, `IRConnectRule`, `applyIRPaletteFilter`. Modulo puro, testato. |
| `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` | `useIRInteractionPlan` (:50), subscription `oaeSlotsSig`, `model.objByVertex`. |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | Synthesis degli edge object-as-edge dagli slot. |
| `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` + `IRContainmentHulls.tsx` | Decoration containment, hull, collapse. |
| `frontend/src/components/editor-v2/EditorV2.tsx` | onConnect :1332, onConnectEnd :1348 (ramo M1 :1372), handleM1ReferenceSelected :1637, handleReconnect :1729, onDrop :1809, createCompositionChild :2453, context menu composition :2625, popups :3648-3666. |
| `frontend/src/components/editor-v2/components/M1ReferencePopup.tsx` e `EdgeTypePopup.tsx` | Superfici popup esistenti. |
| `frontend/src/components/editor-v2/utils/compositionCompat.ts` | `getCompatibleReferences` :100, `getCompositionChildOptions` :128. |
| `frontend/src/components/editor-v2/hooks/useEditorMode.ts` | `MetaclassInfo` :43 (references, targetClassId, concreteSubclasses). |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | SOLO LETTURA. API :518, :1284, :1385, :1420, :1491. |
| `frontend/src/model/conformance/useConformanceGuard.ts` | `guardLink` :26. |
| `docs/discovery/discovery_2026-07-18_write_path_interaction_plan.md` | Rationale del rinvio, mappa gesti→azioni, domanda aperta sul popup. |

---

## COME — procedura

1. Leggi `CLAUDE.md` (blocco NON-NEGOTIABLE RULES) e le ultime 5-10 entry di `docs/claude-code-log.md`.
2. Verifica che HEAD sia `417372c6e` (o segnalane la deviazione nel report). Git dalla RADICE del repo; npm da `frontend/`.
3. Rispondi alle domande A1-A6, B1-B4, C1-C3 leggendo il codice. NESSUNA modifica ai sorgenti, nessun esperimento che scriva file fuori dal report. Se un path o una riga citata qui non corrisponde: grep e correggi nel report, non assumere.
4. **Scrivi il discovery report** in `docs/discovery/discovery_2026-07-20_wiring_connect_containment_ir.md` (se esiste già, suffisso `_2`). Contenuto minimo: obiettivo, file letti con path completi, findings per ogni domanda (con path:riga), sequenza di creazione object-as-edge validata sul codice, dipendenze e rischi, perimetro file proposto per la Fase 2, domande aperte per Alfonso. La Fase 1 NON è completa finché il report non è scritto.
5. **HARD STOP.** Nessun commit (nemmeno del report: si committa dopo la review in chat). Nessuna implementazione. L'analisi riparte in chat dal report.

### Ipotesi di lavoro da validare (NON decisioni: la ratifica avviene in chat)

- **H1**: connect rule unica applicabile e nessuna reference diretta compatibile → creazione diretta senza popup, coerente con l'auto-select M1 esistente (:1436). Se coesistono reference dirette e connect rules → popup unico con entrambe le famiglie di voci.
- **H2**: drop su container con UNA sola composition feature compatibile → creazione diretta; più feature → picker (stessa logica del connect).
- **H3**: il re-parenting per trascinamento di nodi ESISTENTI dentro un container è FUORI scope di questo cantiere (solo drop dalla palette).
- **H4**: feedback visivo di drop rifiutato rimandato se non c'è macchinario riusabile a costo basso.

Nel report indica, per ciascuna ipotesi, se i fatti trovati la supportano, la contraddicono o la lasciano aperta.

---

## RIFERIMENTI

- Spec: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`, sez. 5 (write path canonico), sez. 6 (InteractionSpec e default derivato normativo).
- `CLAUDE.md`: §3 critical zone, §3.3 TRANSACTION, §9 persistence patterns (in particolare §9.1-9.2 per A2), §5 discovery.
- Nota nella zona: i `console.log('[BUG-DIAG-DROP] ...')` in onConnect/onConnectEnd sono strumentazione committata pre-esistente. Non rimuoverli e non aggiungerne.
- Test bed per la futura Fase 2: `sm.ecore` + `sm.xmi` + snippet IR (id fissi `Pointer_TB*`), scenario Machine/State/Transition: copre esattamente object-as-edge (Transition) e containment (Machine).

## Al termine

Aggiorna `docs/claude-code-log.md` con l'entry della discovery (tipo: docs, esito, Regressions: no, Out-of-scope: no, Layer Impact Report: not-required). Nome del documento prompt: 2026-07-20 (sera).
