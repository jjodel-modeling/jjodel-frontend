# Discovery — De-entanglement del classic editor (piano per il delete di graph/)

**Data**: 2026-07-19
**Branch analizzato**: `alfonso-frontend-jjtl` @ `853f434` (clone del repo pushato, analisi read-only in sessione Cowork cloud)
**Tipo**: discovery (b) del piano IR. Nessun file modificato. Da committare in `docs/discovery/` col prossimo giro di Claude Code.

---

## Obiettivo

Rendere cancellabile il perimetro dei componenti del classic editor (directory `frontend/src/graph/` e satelliti) censendo ogni import in ingresso dal resto del codebase, classificando ogni dipendenza per strategia di sgancio e proponendo una sequenza di commit piccoli e verificabili fino al delete finale.

## File letti (path completi)

Letti integralmente o nelle sezioni rilevanti:

- `frontend/src/graph/graphElement/graphElement.tsx` (import block, righe 1400-1520)
- `frontend/src/graph/graphElement/sharedTypes/sharedTypes.tsx` (intero, 239 righe)
- `frontend/src/graph/graphElement/GraphDragHandler.ts` (intero, 33 righe)
- `frontend/src/graph/vertex/Vertex.tsx`, `Shapes.tsx`, `frontend/src/graph/damedges/damedge.tsx`, `frontend/src/graph/defaultNode/DefaultNode.tsx` (import block)
- `frontend/src/joiner/components.tsx` (intero, 100 righe)
- `frontend/src/joiner/index.ts` (righe 90-110, 195-215, 300-330)
- `frontend/src/joiner/ExecuteOnRead.ts` (righe 1-60, 90-130)
- `frontend/src/joiner/classes.ts` (righe 125-140, 4180-4200)
- `frontend/src/redux/reducer/reducer.ts` (righe 1-70, 985-1030, 1430-1450, 1498)
- `frontend/src/redux/store.tsx` (righe 1-80, 330-395)
- `frontend/src/model/dataStructure/GraphDataElements.tsx` (righe 1-75, 880-910, 1850-1870, 2130-2140, 2230-2490, 2510-2600)
- `frontend/src/common/UX.tsx` (righe 1-40, 95-115, 195-265, 425-470)
- `frontend/src/components/abstract/tabs/ModelTab.tsx`, `EditorSwitch.tsx`
- `frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx`, `nodes/ClassNode.tsx` (righe 415-440), `ActiveEditorContext.tsx` (righe 85-110)
- `frontend/src/edges/derived/DerivedReferenceEdge.tsx` (import block, righe 200-227)
- `frontend/src/DSL/DSL.ts` (intero, 54 righe)
- `frontend/src/utils/defaultViewTemplate.ts` (righe 1-80)
- `frontend/src/view/viewElement/view.tsx` (righe 1340-1370)
- Grep sistematici su tutto `frontend/src` per: import da path `graph/` e `edges/routing/classic`, simboli `Vertex|GraphElement|damedge|Shapes|DefaultNode|sharedTypes|GraphDragHandler|EdgeOverlay|GraphsContainer|EdgeFallbackCard`, tipi `VertexOwnProps|EdgeOwnProps|...`, campi `anchorStart|anchorEnd|segmentOffsets`, globali `windoww.GraphElementComponent|windoww.Components|defaultContext`, `contextFixedKeys`, `DerivedReferenceEdge`, `startPanning|draggingGraph`, alias Vite (`frontend/vite.config.ts`).

## Perimetro classic individuato

Confermato che l'UI monta solo EditorV2: `ModelTab.tsx:39-44` e `EditorSwitch.tsx` (commento "Classic shutdown Fase 5a") rendono esclusivamente `<EditorV2>`; le modalità classic/split sono state rimosse. `GraphsContainer` non esiste più come file (`joiner/components.tsx:14`); `EdgeOverlay.tsx` e `WorkbenchCanvas` risultano già cancellati (sopravvivono solo in commenti).

**Anello 1 — perimetro da cancellare (`src/graph/`, ~3.200 righe):**

| File | Righe |
|---|---|
| `graph/graphElement/graphElement.tsx` (GraphElement/GraphElementComponent, renderer jsxString) | 1594 |
| `graph/vertex/Vertex.tsx` (Vertex, VoidVertex, GraphVertex, Field, EdgePoint, Graph) | 585 |
| `graph/damedges/damedge.tsx` (Edge, EdgeComponent) | 295 |
| `graph/vertex/Shapes.tsx` (19 shape: Circle, Polygon, Star, ...) | 219 |
| `graph/defaultNode/DefaultNode.tsx` | 192 |
| `graph/graphElement/graphElement.scss` (import commentato, di fatto orfano) | 41 |
| `graph/graphElement/sharedTypes/sharedTypes.tsx` — **da traslocare, non cancellare** | 239 |
| `graph/graphElement/GraphDragHandler.ts` — **da traslocare o eliminare con evidenza** | 33 |

**Satelliti:**

- `components/edgeOverlay/EdgeFallbackCard.tsx` (77 righe): unico consumer è `graphElement.tsx:1411`; diventa orfano al delete e va cancellato insieme.
- `edges/routing/classic/` (~1.200 righe, 10 file + test): **NON è cancellabile nella stessa ondata.** È importato dal model layer (`GraphDataElements.tsx:65-71`) e da `edges/derived/DerivedReferenceEdge.tsx:12-13`. Il nome "classic" nel path è fuorviante: è una libreria di routing condivisa. Va trattato come stadio separato (Stadio 6).
- `components/editors/TemplatePreview.tsx`: usa `windoww.Components` (righe 76-80) ed è completamente non referenziato nel codebase. Candidato a delete bonus.

## Censimento consumer

Legenda categorie: (a) type-only da spostare · (b) runtime ma dead-code, rimozione sicura · (c) runtime vivo, serve sostituzione · (d) tenuto intenzionalmente.

| File:riga | Simboli | Type/Runtime | Uso | Categoria |
|---|---|---|---|---|
| `joiner/components.tsx:6-15, 20-29, 60-93` | GraphElement(Component), Vertex, VoidVertex, GraphVertex, Field, EdgePoint, VertexComponent, 19 Shapes, DefaultNode(Component), Edge, EdgeComponent + dict | runtime | Barrel: re-export + dizionari per la registrazione globale. Unico punto che "tiene in vita" il perimetro. | (b) — serve solo alla eval dei jsxString, mai eseguita; purge Stadio 4 |
| `joiner/index.ts:101-102` | GraphElementStatee, *Props, EdgeStateProps, EdgeOwnProps, VertexOwnProps, BasicReactOwnProps (da sharedTypes) | runtime (classi come tipi) | Re-export dei prop-type del template engine. | (a)/(d) — segue il trasloco di sharedTypes |
| `joiner/index.ts:205` | GraphDragManager | runtime | Re-export per il reducer. | (d) — Stadio 2 |
| `joiner/index.ts:305-328` | tutti i componenti classic | runtime | Secondo blocco di re-export. | (b) — purge Stadio 4 |
| `joiner/ExecuteOnRead.ts:15, 94-121` | `* as Componentss` | runtime vivo all'avvio | Copia ogni export del barrel su `windoww` per la risoluzione dei tag nei jsxString compilati con `new Function`. Con classic smontato mai eseguiti. | (b) — decade col purge del barrel; il loop resta per i componenti vivi |
| `joiner/classes.ts:136, 4191, 4195` | GraphElementComponent | runtime vivo | `transientProperties.updateNode*` chiamano `GraphElementComponent.map[nid]?.forceUpdate()`. La map è popolata solo dal mount classic: oggi sempre vuota, no-op garantito dall'optional chaining. | (c) leggera — registry autonomo o rimozione (Stadio 3) |
| `redux/reducer/reducer.ts:68` + usi 745, 892, 940, 980, 1002, 1069 | `contextFixedKeys` (sharedTypes) | **runtime vivo** | Parametri delle `new Function` per jsCondition/usageDeclarations/jsxString (VIEWS_RECOMPILE), path vivo in produzione. | (d) — si sgancia traslocando sharedTypes (Stadio 1) |
| `redux/reducer/reducer.ts:22`, 1019, 1081 | GraphElementComponent | runtime vivo (error path) | `tv.JSXFunction = () => GraphElementComponent.displayError(...)` come fallback di compile fallita. | (c) — estrarre displayError (Stadio 3) |
| `redux/reducer/reducer.ts:14, 1441` | GraphDragManager | runtime vivo, no-op | `stopPanning(e)` su mouseup globale; unico chiamante di `startPanning` commentato (`graphElement.tsx:837`), `draggingGraph` mai settato. | (d) oggi; declassabile a (b) (Stadio 2) |
| `redux/reducer/reducer.ts:20-21` | EdgeOwnProps, EdgeStateProps | import inutilizzato | Nessun uso. | (b) — Stadio 0 |
| `redux/reducer/reducer.ts:1498` | `...windoww.Components` | runtime vivo, vestigiale | Spread nel `windoww.defaultContext`; unici consumer: TemplatePreview (dead) e un blocco commentato in view.tsx:1356. | (b) |
| `redux/store.tsx:2-65, 68` | Vertex, VoidVertex, GraphVertex, EdgePoint, 19 Shapes, Graph, GraphElement, Edge, Field + dict | import inutilizzato | Unico "uso" è il blocco commentato 353-360. Le stringhe CSS `[data-nodetype="Vertex"]` (261-323) non sono import. | (b) — Stadio 0 |
| `common/UX.tsx:6` | `type AllPropss` (Vertex.tsx) | type-only | Annotazione di `_assignnodeid` (riga 391). | (a) |
| `common/UX.tsx:20, 23` + 102, 211-249, 442 | GraphElementComponent, EdgeComponent | runtime | `injectProp` (unico chiamante `graphElement.tsx:1511`, dead) e `parseAndInject` catch (displayError, vivo via reducer). | injectProp: (b); displayError: (c) Stadio 3 |
| `components/forEndUser/Control.tsx:18` + 150, 213, 375 | VertexOwnProps | type-only | Annotazione props delle factory Control/Panell/Panel. File vivo (Toggle usato da `editors/Info.tsx:29`). | (a) |
| `components/forEndUser/Panel.tsx:16` + 147 | VertexOwnProps | type-only | Come sopra. | (a) |
| `components/widgets/Widgets.tsx:10` | VertexOwnProps, VertexStateProps | import inutilizzato | Nessun uso. | (b) — Stadio 0 |
| `model/dataStructure/GraphDataElements.tsx:65-71` | svgLetterSize, computePoints, snapSegmentsToBorders, setLabels, computeHeadPosition, computeRouting, roundManhattanCorners (routing/classic) | runtime | Implementano i getter L-layer `LVoidEdge.get_segments` (2405), `get_d` (2391), `headPos_impl` (2250), `get_points_impl` (2348), snap (2481). Nessun consumer vivo fuori dal model layer, ma sono API proxy esposte a JjScript. **`svgLetterSize` (65) e `setLabels` (68) sono import inutilizzati.** | 2 import: (b) Stadio 0; resto: (d)/Stadio 6 |
| `model/dataStructure/GraphDataElements.tsx:21, 183, 473, 2624` | GraphElementComponent | runtime | `component!: GraphElementComponent` (tipo), `get_component` (473, sempre undefined oggi), lookup follow-edge (2624, solo classic). | (c) leggera — Stadio 3 |
| `edges/derived/DerivedReferenceEdge.tsx:12-13` | computeRouting, roundManhattanCorners, `type RoutingInput` | runtime | Rendering nativo degli edge reference nei template DV (`common/DV.tsx:1243, 1281`). Raggiungibile solo via eval jsxString: dead a runtime oggi. | (d)/Stadio 6 |
| `debugtools/debug.tsx:12-52` | `windoww.GraphElementComponent` | runtime (global) | Tool dev da console; crasherebbe se invocato post-delete. | (b) con guardia |
| `components/editors/NodeEditor.tsx:656-681` | campi `anchorStart`/`anchorEnd` via proxy LEdge | **runtime vivo** | UI live (Dock.tsx:285, PropertiesWithTreeView.tsx:365) che edita i campi classic-era di DEdge. | (d) — vincola i campi D, vedi Rischi |
| `DSL/DSL.ts:27` | stringa `'<DefaultNode ...>'` | string-level | La macro `<Children>` espande in jsxString. Zero import. | nessuno |
| `common/DV.tsx` (925, 1307-1577), `utils/defaultViewTemplate.ts` | `<DefaultNode>`, `<EdgePoint>`, `<DerivedReferenceEdge>` nei template | string-level | Sorgenti dei jsxString persistiti. | Stadio 6 / roadmap IR |
| `examples/*.ts` | 'GraphVertex' ecc. | string-level | Dump serializzati. | nessuno |

**Scostamenti dalla consumer map preliminare** (verificati):
- `model/logicWrapper/LModelElement.tsx`: **nessun import dal perimetro** (solo check su stringhe `className.includes('Vertex')`, 631-644).
- `DSL.ts`: nessun import; solo coupling a livello di stringa.
- "vari editors/views/data": solo letterali stringa, nessun import.
- La map preliminare non citava tre consumer reali: `joiner/classes.ts` (forceUpdate sulla map), `edges/derived/DerivedReferenceEdge.tsx` (routing/classic), `components/edgeOverlay/EdgeFallbackCard.tsx` (dipendenza inversa).

## Piano a stadi

Gate comuni: `npm run typecheck` (baseline 33, nessun aumento) e `npm run build`. Nessuno stadio tocca `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`.

**Stadio 0 — Rimozione import morti (fuori perimetro).** `redux/store.tsx` (2-65, 68), `components/widgets/Widgets.tsx:10`, `redux/reducer/reducer.ts:20-21`, `GraphDataElements.tsx:65, 68` (svgLetterSize, setLabels). Rischio minimo. Tocca reducer e model layer solo su righe import.

**Stadio 1 — Trasloco di sharedTypes.tsx.** `git mv` verso `common/sharedTypes.tsx` (proposta); aggiornare i path in `joiner/index.ts:101-102`, `reducer.ts:68`, `Control.tsx:18`, `Panel.tsx:16`, e nei file interni al perimetro finché esistono. Rischio basso (solo path). Tocca il reducer (import path only).

**Stadio 2 — GraphDragHandler.** Consigliato: `git mv` in `redux/` (o `utils/`), aggiornando `joiner/index.ts:205`. Alternativa delete: evidenza no-op (unico chiamante di `startPanning` commentato; `draggingGraph` mai assegnato) ma la classe è `@RuntimeAccessible` e in teoria invocabile da user script; il delete tocca `reducer.ts:14, 1441`. Rischio basso (move) / basso-medio (delete).

**Stadio 3 — Sgancio di displayError e del component registry.** (1) Estrarre `GraphElementComponent.displayError` in modulo autonomo (es. `common/jsxErrorView.tsx`), aggiornare `reducer.ts:1019, 1081` e `UX.tsx:442`. (2) Estrarre la static `map` in un registry module; aggiornare `joiner/classes.ts:4191, 4195` e `GraphDataElements.tsx:473, 2624` (tipo a 183 → GObject). Rischio medio per superficie, basso per semantica. Smoke: vista con jsxString invalido (esercita displayError).

**Stadio 4 — Purge del barrel.** `joiner/components.tsx` (import 6-15, export 20-29, dict 60-93), `joiner/index.ts` (voci classic in 305-328). Da qui `windoww` non registra più i componenti classic: impatto nullo (unica esecuzione jsxString era il renderer classic, smontato; `ClassNode.tsx:423` mai alimentato, verificato). `Info.tsx:29` (Toggle) continua a funzionare. Rischio medio; compile-safe. Smoke completo.

**Stadio 5 — Delete del perimetro.** `rm -r frontend/src/graph/`, `rm -r frontend/src/components/edgeOverlay/`; in `UX.tsx` rimuovere `injectProp` + import + `type AllPropss`; guardare/rimuovere gli accessi globali in `debugtools/debug.tsx`; opzionale `rm components/editors/TemplatePreview.tsx`. I riferimenti in commenti restano innocui. Verifica: typecheck + build + test + smoke completo.

**Stadio 6 — (decisione separata) `edges/routing/classic` + DerivedReferenceEdge + campi DEdge.** Tre decisioni: (1) i getter routing di LVoidEdge (`segments`/`d`/`headPos`) sono API JjScript da mantenere? Se sì la libreria resta e va rinominata (es. `edges/routing/manhattan`); (2) destino di DerivedReferenceEdge, legato alla sostituzione dei template DV con l'IR; (3) scrub dei campi `anchorStart`/`anchorEnd`/`segmentOffsets` su DEdge, che hanno un consumer UI vivo (`NodeEditor.tsx:656-681`).

## Rischi

1. **jsxString persistiti.** I progetti salvati nominano Vertex/DefaultNode/Shapes nei jsxString. La compile nel reducer (VIEWS_RECOMPILE, `reducer.ts:995-1021`) resta viva e funziona dopo il purge (traspila soltanto; i nomi si risolvono sui globali solo all'esecuzione, che non avviene mai). Rischio futuro: se IR o ClassNode eseguissero quei jsxString post-purge, ReferenceError. Da tenere nella roadmap IR.
2. **Campi classic-era su DVoidEdge/DEdge.** Cancellarli NON rompe il load dei vecchi progetti (campi extra restano inerti in idlookup; nessuna migrazione VersionFixer li referenzia, grep a zero hit). Ma hanno due consumer reali: `NodeEditor.tsx:656-681` (UI viva) e i getter routing (`GraphDataElements.tsx:2354-2355, 2412-2413, 2435, 2596`). Rimozione accoppiata allo Stadio 6.
3. **Superficie RuntimeAccessible/windoww.** I componenti classic sono richiamabili per nome da user script e template custom: il purge è un cambio di API superficie. Mitigazione: changelog.
4. **VIEWS_RECOMPILE resta vivo e inutile.** Dopo il delete il reducer continuerà a compilare jsxString che nessuno esegue (costo runtime residuo + dipendenza da contextFixedKeys/UX/DSL). Spegnerlo = deprecazione completa del sistema viste jsxString, fuori scope.
5. **Test.** `edges/routing/classic/__tests__/routing.test.ts` si cancella solo con lo Stadio 6; nessun altro test importa dal perimetro `graph/`.
6. **Tool di debug.** `debugtools/debug.tsx` crasherebbe da console post-delete senza guardia.
7. **`Control.tsx` e `Panel.tsx` hanno due factory omonime `Control`**: al trasloco di sharedTypes aggiornare entrambi senza toccare altro.

## Domande aperte per Alfonso

1. **GraphDragManager**: move (zero rischio) o delete (con evidenza no-op)? Il delete tocca una riga runtime del reducer.
2. **Sede di sharedTypes.tsx**: `common/` (proposta) o `model/`/`redux/`? contextFixedKeys è di fatto contratto del reducer.
3. **I getter L-layer `edge.segments`/`edge.d`/`headPos`** sono API JjScript/user-facing da mantenere? Decide se `edges/routing/classic` resta come libreria (rinominata) o entra nel perimetro di cancellazione.
4. **DerivedReferenceEdge**: l'IR è destinato a sostituirlo? Se sì, si cancella coi template DV nello Stadio 6.
5. **Quando si spegne VIEWS_RECOMPILE/jsxString nel reducer?** È il vero ultimo filo: finché vive, sharedTypes, UX.parseAndInject e DSL.ts restano dipendenze del reducer per design.
6. **TemplatePreview.tsx** (non referenziato): delete nello Stadio 5 o conservare per la roadmap template?
7. **Scrub dei campi DEdge nei salvataggi**: migrazione VersionFixer di pulizia alla rimozione, o campi orfani lasciati nei file (innocui)?
