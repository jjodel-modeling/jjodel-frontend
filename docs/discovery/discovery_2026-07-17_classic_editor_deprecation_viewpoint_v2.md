# Discovery — Deprecation del classic editor (v1) e applicabilità del meccanismo viewpoint a EditorV2

**Data**: 2026-07-17
**Tipo**: FASE 1 — discovery READ-ONLY. Nessuna modifica al codice. Hard stop a fine report.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prompt**: mappa completa di (a) cosa dipende dal classic editor, (b) quanto del meccanismo viewpoint è editor-agnostico vs classic-bound, (c) quanto lavoro serve per portare il rendering viewpoint-driven dentro EditorV2.
**Rev 2026-07-17 (seconda passata)**: integrate le 4 estensioni decise in chat di progetto — §3.2-bis (algoritmo di risoluzione multi-match per i nodi), §3.6-bis (edge con endpoint non renderizzati), §4-bis (registrazione nodeTypes React Flow), §4-ter (hotspot performance del render path). Sezioni preesistenti invariate salvo questa nota.

**Verdetto in una riga**: la rimozione del classic NON è un delete di `graph/` — gli entanglement veri stanno nel core (reducer, barrel joiner, DV.tsx/defaultViewTemplate.ts che sono critical-zone, VersionFixer che riscrive i progetti salvati VERSO template classic-only); ma il meccanismo viewpoint ha un taglio pulito **tra risoluzione e rendering**: scoring delle view e compilazione dei template sono già editor-agnostici e ospitabili da EditorV2, mentre scope runtime, prop-injection e tutto il machinery edge sono classic-bound e vanno sostituiti, non riusati. L'aggancio viewpoint esistente in EditorV2 (`ViewpointRenderer` + `data.jsxString`) è oggi **codice morto**: nessun transformer popola `jsxString`.

---

## 0. Metodo e file analizzati

Discovery condotta con 5 esplorazioni parallele (una per area) + verifica a campione delle citazioni load-bearing (reducer.ts:68/:1441, ClassNode.tsx:423/:434, types.ts:125, EditorSwitch.tsx:56/:111/:129, view.tsx:271/:901, VersionFixer.tsx:936-938/:972/:993, DV.tsx:32/:1707-1715, LModelElement.tsx:5178, jjomTransformers.ts:499-501 — tutte confermate sul working tree).

**Rev (seconda passata)**: 4 esplorazioni parallele aggiuntive, una per integrazione, con seconda tornata di verifiche a campione (selectors.ts:417-437 `getFinalScore` e classes.ts:4071-4095 `NodeTransientProperties.sort` verbatim; graphElement.tsx:1408-1411 ramo EdgeFallbackCard; damedge.tsx:119-126 error stub; LModelElement.tsx:5233+ `SkipExtendNodeHidden`; EditorV2.tsx:99-105/:112-117/:3387-3388 nodeTypes/edgeTypes; DynamicHandles.tsx:221 handle id; action.ts:349 dispatch async; useM1ReferenceEdges.ts:19-21 commento di costo; EditorV2.tsx:1145-1150 stabilizer; selectors.ts:594 commento OCL — tutte confermate). File aggiuntivi letti: `utils/edgeExpressionEval.ts`, `utils/LazyOCL.ts`, `redux/store.tsx`, `common/Defaults.ts`, `components/editor-v2/components/DynamicHandles.tsx`, `components/editor-v2/utils/edgeUtils.ts`, `components/editor-v2/utils/reLayoutWatcher.ts`, `components/editor-v2/components/InlineTypeSelect.tsx`, `components/editor-v2/panels/PalettePanel.tsx`, `components/editor-v2/repro/ReproHarness.tsx`, `redux/action/action.ts`, `graph/vertex/Vertex.tsx` (throttle), `edges/derived/DerivedReferenceEdge.tsx`.

File letti/analizzati (path da `frontend/src/` salvo diversa indicazione):

- **Classic**: `graph/graphElement/graphElement.tsx`, `graph/graphElement/sharedTypes/sharedTypes.tsx`, `graph/graphElement/GraphDragHandler.ts`, `graph/graphElement/SubViewComponent.tsx`, `graph/vertex/Vertex.tsx`, `graph/vertex/Shapes.tsx`, `graph/vertex/index.ts`, `graph/defaultNode/DefaultNode.tsx`, `graph/graph/graphContainer.tsx`, `graph/damedges/damedge.tsx`, `components/edgeOverlay/EdgeOverlay.tsx`, `components/edgeOverlay/EdgeFallbackCard.tsx`, `edges/derived/DerivedReferenceEdge.tsx`, `edges/routing/classic/*`
- **Viewpoint machinery**: `view/viewElement/view.tsx`, `view/viewPoint/viewpoint.ts`, `redux/selectors/selectors.ts`, `ocl/ocl.tsx`, `common/UX.tsx`, `DSL/DSL.ts`, `redux/reducer/reducer.ts`, `joiner/classes.ts` (ViewScore/NodeTransientProperties), `components/editors/viewpoint/*` (WorkbenchEditors, TemplateEditor, PredicateEditor, StyleEditor, WorkbenchCanvas, ViewTree, properties/*), `components/editors/TemplatePreview.tsx`, `components/rightbar/viewsEditor/`
- **Persistenza**: `utils/defaultViewTemplate.ts`, `common/DV.tsx`, `redux/VersionFixer.tsx`, `redux/defaults/views.ts`, `components/topbar/SaveManager.ts`, `styles/classic-object-view.scss`, `examples/*`
- **EditorV2**: `components/editor-v2/EditorV2.tsx`, `viewpoint/ViewpointRenderer.tsx`, `nodes/ClassNode.tsx`, `nodes/ObjectNode.tsx`, `nodes/EnumNode.tsx`, `nodes/PackageNode.tsx`, `types.ts`, `Toolbar.tsx`, `ActiveEditorContext.tsx`, `utils/jjomTransformers.ts`, `hooks/useJjomSync.ts`, `hooks/useM1ReferenceEdges.ts`, `hooks/useJjomSelection.ts`, `edges/UnifiedEdge.tsx`
- **Entry point / shell**: `components/abstract/tabs/EditorSwitch.tsx`, `ModelTab.tsx`, `MetamodelTab.tsx`, `TabDataMaker.tsx`, `components/contextMenu/ContextMenu.tsx`, `components/TreeViewSidebar/TreeViewContent.tsx`, `utils/lastViewpoint.ts`, `joiner/components.tsx`, `joiner/index.ts`, `joiner/ExecuteOnRead.ts`, `pages/components/Dashboard.tsx`
- **Critical zone (sola lettura, per l'intersezione)**: `hooks/useJjomSync.ts`, `sync/syncState.ts`, `sync/canvasToJjom.ts`, `utils/portDistribution.ts`, `model/logicWrapper/LModelElement.tsx`, `model/dataStructure/GraphDataElements.tsx`

---

## 1. AREA A — Perimetro del classic editor

### 1.1 File che compongono il classic

| File | ~Righe | Ruolo |
|---|---|---|
| `graph/graphElement/graphElement.tsx` | 1594 | **Cuore del v1.** `GraphElement`/`GraphElementComponent`: risolve la view applicabile per predicato (`mapViewStuff`, :164), valuta il jsxString a runtime (`getJSXContext` :673-688, `renderView` :1377), selezione/drag/properties, edge fallback. |
| `graph/vertex/Vertex.tsx` | 585 | `Vertex`, `VoidVertex`, `GraphVertex`, `Field`, `EdgePoint`, `Graph`, `VertexComponent`, tipo condiviso `AllPropss`. |
| `graph/vertex/Shapes.tsx` | 219 | Componenti shape (Polygon, Circle, Star, …) esposti alla palette del view editor. |
| `graph/defaultNode/DefaultNode.tsx` | 192 | `DefaultNode` — il root node classic montato dai tab; estende `GraphElementComponent`. |
| `graph/graph/graphContainer.tsx` | 102 | `GraphsContainer` — raggiungibile solo via barrel joiner, nessun consumer JSX esterno (quasi-morto). |
| `graph/damedges/damedge.tsx` | 295 | `Edge`/`EdgeComponent` — edge nativo classic. |
| `graph/graphElement/GraphDragHandler.ts` | 33 | `GraphDragManager` — pan/drag. |
| `graph/graphElement/sharedTypes/sharedTypes.tsx` | 239 | Tipi prop/state classic **+ il VALORE `contextFixedKeys`** (:220-239) usato dal reducer per compilare i template. |
| `components/edgeOverlay/EdgeOverlay.tsx` (+ .scss) | 776 | Overlay SVG statico per le view `isEdge` (header :12: "Static SVG overlay rendering edges in the classic editor"). Montato solo da `ModelTab.tsx:47`. |
| `components/edgeOverlay/EdgeFallbackCard.tsx` | 77 | Card fallback per edge non tracciabili; iniettata da `graphElement.tsx:1411`. |
| `edges/derived/DerivedReferenceEdge.tsx` | 227 | Edge M1 render-only (estrazione 2026-06); consumato da `common/DV.tsx:1243/:1281` — NON è una foglia classic. |
| `edges/routing/classic/*` (9 file + test) | ~880 | Router Manhattan puro. **Dual-purpose**: consumato da EdgeOverlay, DerivedReferenceEdge **e da `model/dataStructure/GraphDataElements.tsx:65-71`** (geometria edge del L-layer). MAI importato da `components/editor-v2/**` (verificato). |
| Codice morto interno | — | `graph/vertex/index.ts` (nessun importer), `graph/graphElement/SubViewComponent.tsx` (una riga, nessun importer). |

### 1.2 Tabella di entanglement — file classic → importer non-classic

Il crux è il **barrel joiner**: `joiner/components.tsx` importa tutti i componenti classic e li ri-esporta; `joiner/index.ts:305-329` li ri-esporta come API pubblica; `joiner/ExecuteOnRead.ts:15` li registra su `window` per la valutazione runtime dei jsxString.

| Modulo classic | Importer non-classic (path:riga) | Natura |
|---|---|---|
| `sharedTypes.tsx` → `contextFixedKeys` (VALORE) | **`redux/reducer/reducer.ts:68`**, usato a :745, :892, :940, :980, :1002, :1069 | **Hard**: il reducer costruisce il contesto di compilazione dei jsxString da una costante classic. |
| `GraphDragHandler.ts` → `GraphDragManager` | **`redux/reducer/reducer.ts:14` (type) + `:1441`** `RuntimeAccessibleClass.get("GraphDragManager").stopPanning(e)` | **Hard**: il reducer chiama il drag manager classic. |
| Tutti i componenti (`GraphElement`, `Vertex`, `Field`, `DefaultNode`, `Edge`, shapes, …) | `joiner/components.tsx:6-31` → `joiner/index.ts:305-329` → `joiner/ExecuteOnRead.ts:15` (registrazione su `window`) | **Hard**: API pubblica del joiner + scope globale dei template. |
| `damedge.tsx` → `Edge` | `common/DV.tsx` — i template default emettono `<Edge>` (:1257/:1295) e `<EdgePoint>` (:925/:1071-1079) come componenti ambient (nessun import statico: risolti da `windoww.Components`) | **Hard e silenzioso**: rimuovere `edges/`/`damedges` rompe il Model default view senza errore di compilazione. |
| `Shapes.tsx` (dicts `GraphElements`, `Vertexes`) | `components/editors/views/data/InfoData.tsx:10/:20` (palette del view editor) | Media. |
| `Vertex.tsx` → tipo `AllPropss` | `common/UX.tsx:6` (usato a :391 su `window._assignnodeid`) | Tipo + helper runtime. |
| `sharedTypes.tsx` (tipi) | `joiner/index.ts:101-103`; `components/forEndUser/Control.tsx:18`; `Panel.tsx:16`; `components/widgets/Widgets.tsx:10` | Solo tipi, ma superficie pubblica. |
| `edges/routing/classic/*` | **`model/dataStructure/GraphDataElements.tsx:65-71`** (`computeRouting`, `roundManhattanCorners`, `snapSegmentsToBorders`, `setLabels`, `computeHeadPosition`, `svgLetterSize`) | **Hard**: la geometria edge del model layer dipende dal router classic. |
| `DerivedReferenceEdge.tsx` | `joiner/components.tsx:31`; `common/DV.tsx:1243/:1281`; citato in `redux/VersionFixer.tsx:987-992` | Accoppiato ai template core, non foglia. |
| `EdgeOverlay.tsx` | solo `components/abstract/tabs/ModelTab.tsx:22/:47` | **Delete pulito.** |

Non-entanglement confermati: `components/editor-v2/**` ha **zero** import da `graph/**`, `damedges`, `edgeOverlay`, `edges/routing/classic` (l'`Edge` usato in editor-v2 è `import type { Edge } from '@xyflow/react'`). `view/**` non importa `graph/**` (accoppiamento unidirezionale graph→view). Circolarità DV↔edges: `DerivedReferenceEdge.tsx:14` importa `EdgeHead` da `common/DV`, e DV renderizza `<DerivedReferenceEdge>`.

### 1.3 Entry point UI verso il classic

| Entry point | Dettaglio |
|---|---|
| `EditorSwitch.tsx` (letto per intero) | Toggle 3-stati `'flow'|'classic'|'split'` (:9/:11). localStorage `jjodel.editorPrefs.${modelid}` (:19-37). **Default `'flow'`** (:64). `classicSlot` = `children` del caller, inoltrato a EditorV2 **solo se** `hasViewpoint = !!viewpointId && !isMetamodel` (:56, :129). Ramo senza viewpoint/metamodel (:111-121): EditorV2 puro, children scartati. Cambio viewpoint → reset a `'flow'` (:96-109). |
| `ModelTab.tsx:43-52` | children del switch = `<EdgeOverlay graphid/>` (:47) + `<DefaultNode data={model}/>` (:48) in `.GraphContainer`. Selezione grafo classic: `graphStyle !== 'v2-flow'` (:68). |
| `MetamodelTab.tsx:183-200` | children = `<FeaturesPalette/>` + `<DefaultNode/>` (:195). **Di fatto MORTO**: `isMetamodel` forza `hasViewpoint=false`, quindi il classicSlot M2 non viene mai renderizzato. Rimovibile indipendentemente. |
| `TabDataMaker.tsx:22/:32` | Mount dei tab dal DockManager. |
| `ContextMenu.tsx` | Path legacy `LViewElement.newDefault` dai keystroke: `addViewSelf()` :615/:618, `addViewInstances` :625/:628; `addViewToWorkbench()` → `createViewInWorkbench` :640. |
| `utils/lastViewpoint.ts:142` (`createViewInWorkbench`) | **CONDIVISO, non classic-only**: chiamato da `EditorV2.tsx:2644` (flow!), `ContextMenu.tsx:640`, `TreeViewContent.tsx:475`. Setta però `appliableTo`/`appliableToClasses` con valori classic (`'Vertex'`, `'GraphVertex'` :163/:178). |
| `TreeViewContent.tsx:475` | "Create View" → `createViewInWorkbench`. |
| `view/viewElement/view.tsx:307` | Definizione `LViewElement.newDefault` (factory legacy). |
| `components/editors/viewpoint/WorkbenchCanvas.tsx:50/:188-189` | La preview del viewpoint workbench monta il runtime classic (`<DefaultNode>` in `.GraphContainer`, filtra i grafi `v2-flow`). Seconda superficie UI dipendente dal classic. |

---

## 2. AREA B — Dipendenze persistite (il rischio silenzioso)

### 2.1 Costanti template (`utils/defaultViewTemplate.ts`)

| Costante | Definita | Consumer | Ruolo |
|---|---|---|---|
| `DEFAULT_VIEW_JSX_STRING` (v3 attivo) | :82 | `utils/lastViewpoint.ts:10/:192`; `view/viewElement/view.tsx:49/:309` (`newDefault`); `VersionFixer.tsx:628/:682/:974` | Write-path view nuove + target di migration |
| `DEFAULT_VIEW_JSX_V2_3_LEGACY` (FROZEN) | :16 | `VersionFixer.tsx:972` (2.223→2.224, match esatto) | Detection a runtime |
| `CLASSIC_OBJECT_VIEW_JSX` | :150 | `DV.tsx:1707` → `redux/defaults/views.ts:541`; `VersionFixer.tsx:936` | Sorgente default view M1 + target migration |
| `CLASSIC_VALUE_VIEW_JSX` | :176 | `DV.tsx:1711` → `views.ts:694`; `VersionFixer.tsx:937` | idem |
| `CLASSIC_SINGLETON_VIEW_JSX` | :188 | `DV.tsx:1715` → `views.ts:644`; `VersionFixer.tsx:938` | idem |
| Marker: `LEGACY_PLACEHOLDER_MARKER` :105, `V2_2_TO_V2_3_DETECT_MARKER` :117, `V2_3_TO_V3_DETECT_MARKER` :63, `CLASSIC_{OBJECT,VALUE,SINGLETON}_VIEW_MARKER` :146-148 | — | Tutti letti da `VersionFixer.tsx:17-20` (import) e usati come detection (:626, :679, :972, :936-938) | Idempotenza migration |

### 2.2 Migration VersionFixer rilevanti (`redux/VersionFixer.tsx`)

`highestVersion` calcolato dinamicamente (:102); ultimo metodo `'2.224 -> 2.225'` (:993) → **highestVersion = 2.225**.

| Versione | Riga | Cosa fa | Costanti lette |
|---|---|---|---|
| 2.211→2.212 | :619 | jsxString con marker legacy → `DEFAULT_VIEW_JSX_STRING` | LEGACY_PLACEHOLDER_MARKER, DEFAULT_VIEW_JSX_STRING |
| 2.213→2.214 | :672 | v2.2→v2.3 default view | V2_2_TO_V2_3_DETECT_MARKER, DEFAULT_VIEW_JSX_STRING |
| 2.220→2.221 | :852 | edge view default Line→Manhattan | — |
| 2.221→2.222 | :881 | palette composition/aggregation (EdgeHead) | — |
| **2.222→2.223** | :927 | **View M1 classic**: `'object-children'`→`CLASSIC_OBJECT_VIEW_JSX`, `'values_str'`→`CLASSIC_VALUE_VIEW_JSX`, `'singleton'`→`CLASSIC_SINGLETON_VIEW_JSX` (:936-938) | le 3 costanti + 3 marker |
| **2.223→2.224** | :965 | template v2.3 legacy → `DEFAULT_VIEW_JSX_STRING` (legge `DEFAULT_VIEW_JSX_V2_3_LEGACY` a runtime, :972) | 3 costanti |
| 2.224→2.225 | :993 | Bump puro → `updateDefaultView` rigenera le view default non toccate (→ `<DerivedReferenceEdge>`) | — |

Meccanismo duale (documentato a :923-926/:962-964): il bump di versione fa rigenerare da sorgente ogni default view *non toccata* via `LViewElement.updateDefaultView` (:134-143, che pesca `DV.objectView()` → le costanti classic); i metodi coprono le default *toccate* (`clonedCounter`). **Conseguenza: la catena di migration oggi riscrive i progetti salvati VERSO template renderizzabili solo dal runtime classic.** Entry point: `SaveManager.ts:56` (`VersionFixer.update` in `load()`), più `autocorrect` da `Try.tsx:198` / `Navbar.tsx:1525`.

### 2.3 Artefatti persistiti e conseguenza al load senza runtime classic

- **Compilazione jsxString**: avviene nel reducer al load, indipendente dall'editor attivo — `reducer.ts:1007` `'return (' + UX.parseAndInject(DSL.parser(dv.jsxString), dv) + ')'` → `new Function(paramStr, body)` (:1009), risultato in `transientProperties.view[vid].JSXFunction`. Errori catturati (:1011-1020) → funzione d'errore memorizzata, **niente crash**.
- **Esecuzione**: SOLO `GraphElementComponent` (classic) esegue la `JSXFunction` (`graphElement.tsx:762` `tv.JSXFunction.call(context, context)`). Gli identificatori liberi dei template (`View`, `Input`, `DefaultNode`, …) risolvono da `contextFixedKeys`/propmaker classic.
- **CSS**: `.jjodel-classic-object` / `-value` / `-singleton` / `__ref-anchors` definiti in `styles/classic-object-view.scss` (:26/:141/:177/:110); riferiti solo dai className dentro le costanti template.
- **`__ref-anchors`**: prodotto dal template `CLASSIC_OBJECT_VIEW_JSX` (`defaultViewTemplate.ts:169-171` — box `height:0; overflow:hidden` con `<DefaultNode>` per ogni reference feature); consumato da `LModelElement.tsx:5178` `impl_get_suggestedEdgesM1` (:5196-5205, salta i DValue il cui nodo non ha `.html` vivo). L'intero meccanismo di anchor edge M1 classic dipende da DOM classic montato.
- **Scenario "progetto con view classic aperto senza runtime classic"**: il load NON crasha (migration = trasformazioni pure di DState; compilazione con catch). Il canvas classic non esiste più → le view classic **non vengono renderizzate da nessuno**. In EditorV2 l'unico path jsxString è `ClassNode` → `ViewpointRenderer`, che con un template classic (JSX grezzo non-JS, identificatori `View`/`DefaultNode` mancanti) va in throw → placeholder `viewpoint-error`. Esito netto: **degrado silenzioso, non crash**.

### 2.4 Progetti demo nel repo

11 blob DState serializzati come template literal TS sotto `frontend/src/examples/` (`first/second/sequence/statechartplus/statechartplus_old/shapes/conflictsimulation` + 4 duplicati in `examples/examples/`): tutti contengono `Pointer_ViewObject` con jsxString classic legacy (`object-children`, `data.features.map(... <DefaultNode/>)`). Senza campo `version` → il load li porta a 2.1 (`VersionFixer.tsx:110`) e la 2.222→2.223 li migra alle costanti classic v3 (quindi restano classic-runtime-only). **Nota**: nessun modulo runtime importa `stateExamples` — appaiono dormienti/orfani. `public/`, fixtures XMI, `examples/StateMachine/` sono puliti.

---

## 3. AREA C — Inventario del meccanismo viewpoint e grado di accoppiamento

### 3.1 Data layer — `DViewElement`/`LViewElement` (`view/viewElement/view.tsx`), `DViewPoint extends DViewElement` (`viewpoint.ts:24`)

Campi persistiti per affinità (dettaglio in tabella §3.7):

- **Agnostici**: `jsxString` (:203), `oclCondition`/`jsCondition` (:219), `constants`/`usageDeclarations`/`preRenderFunc` (:197/:204/:201), `css`/`palette`/`compiled_css` (:261-265), `name`/`isValidation`/`isExclusiveView`/`viewpointType` (:191-194), `appliableToClasses`/`appliableTo` (:215-216), `explicitApplicationPriority`/`subViews`/`viewpoint`/`father` (:224/:217/:232/:266), bookkeeping OCL (:220-223).
- **Classic-bound**: `forceNodeType` (:209, commento "used in DefaultNode"), geometria nodo `defaultVSize`/`adaptWidth`/`adaptHeight`/`draggable`/`resizable` (:225-231), `storeSize`/`lazySizeUpdate`/`size` (:249-251), `snap`/`grid` (:267-268), lifecycle drag/resize/rotate (:235-245), `bendingMode`/`edgeGapMode` (:246-247), geometria anchor edge (:252-260), **intero blocco L2 edge-overlay** `isEdge`/`edgeSource`/`edgeTarget`/`edgeRouting`/`edgeLabel`/`edgeStroke*` (:276-286) — commento esplicito a :271-275 e :901: *"L2 — edge overlay schema (classic editor only). … No effect in flow editor."*

I getter/setter di `LViewElement` sono plumbing dati agnostico (SetFieldAction + `VIEWS_RECOMPILE_*`); il coupling classic in L è confinato a `get_nodes` (:505-522, ritorna `LGraphElement[]`), `grid`/`snap` che spingono `NODES_RECOMPILE_*` su `allSubVertexes` (:592/:644/:653), `updateSize`/`getSize` (:1496-1554).

### 3.2 Risoluzione della view (chi si applica a cosa)

Pipeline in `redux/selectors/selectors.ts`: `getAppliedViewsNew({data,node,pv,nid})` :609 → `updateScores` :495 (loop su tutte le view: `viewPointMatch` dal viewpoint attivo :529/:553-559, `metaclassScore = matchesMetaClassTarget(dview, data.__raw)` :571, `jsScore` :583/:718-750, `OCLScore = OCL.test(data,dview,node)` :596) → `NodeTransientProperties.sort` :621 → `mainView` + `stackViews`.

- `matchesMetaClassTarget` (:356-373) e `getFinalScore` (:417-437): **puri, nessun tipo classic**.
- `OCL.test` (`ocl/ocl.tsx:127-144`): model-driven, `node` è solo un "cheat" opzionale (:106-111).
- **Coupling**: (a) la cache dei risultati vive in `transientProperties.node[nid].viewScores` — chiavi = id di nodo classic (`ViewScore`/`NodeTransientProperties` in `joiner/classes.ts:4024-4056`); (b) **l'unico invocatore è il classic** `GraphElementComponent.mapViewStuff` (`graphElement.tsx:164`, `getScores` :139-142, assegnazione `view`/`views` :192/:226) dentro il suo mapStateToProps. TODO riconosciuto a `graphElement.tsx:994` (spostare il matching nel reducer). Il reducer si limita a invalidare gli score (`reducer.ts:804-828`).

**Classificazione: logica AGNOSTICA, storage+invocazione CLASSIC-BOUND.** Chiamabile da EditorV2 con `node: undefined` e un `nid` sintetico stabile.

### 3.2-bis Algoritmo di risoluzione multi-match per i nodi (integrazione rev.)

Cosa succede quando più view matchano lo stesso elemento (Vertex/Field/Graph — per gli edge vedi §3.6/§3.6-bis). Pipeline: `mapViewStuff` → `getScores` → `getAppliedViewsNew` → `updateScores` (componenti di score) → `NodeTransientProperties.sort` (score finale + ranking + split main/stack).

**Componenti di score per coppia (view, elemento)** — `updateScores` (`selectors.ts:495-606`), memorizzati in `ViewScore` (`classes.ts:4021-4044`):

| Componente | Valori | Sede |
|---|---|---|
| `viewPointMatch` | `VP_Explicit=2` (viewpoint attivo), `VP_Default=1` (`Pointer_ViewPointDefault`), `VP_Decorative=1` (viewpoint terzo NON esclusivo), `VP_MISMATCH=-∞` (viewpoint terzo esclusivo → short-circuit :562-565) | `selectors.ts:553-559`; costanti `classes.ts:4015-4018` |
| `metaclassScore` | `EXACT_MATCH=2`, `INHERITANCE_MATCH=1.5` (sottoclasse), `IMPLICIT_MATCH=1` (nessuna `appliableToClasses`), `MISMATCH=-∞` | `matchesMetaClassTarget` `selectors.ts:356-373` (chiamata :571); costanti `classes.ts:4009-4014` |
| `jsScore` | numero positivo o `true`; errore/valore non valido → `MISMATCH_JS=false`; condizione assente → `true` | `updateJSScore` `selectors.ts:718-750` (chiamata :583) |
| `OCLScore` | `true` se `oclCondition` assente (`ocl.tsx:130`); altrimenti booleano OCL; fallimento → `false` | `OCL.test` `ocl.tsx:127-144` (chiamata :596) |

**Formula finale** — `getFinalScore` (`selectors.ts:417-437`, verificata verbatim):

```
finalScore = viewPointMatch × metaclassScore × pvScore × explicitprio + bonus
```

- Qualunque componente in mismatch → return `MISMATCH` (-∞) subito (:418-420; il confronto `OCLScore === MISMATCH_JS` a :420 funziona perché `MISMATCH_JS` e `MISMATCH_OCL` sono entrambi `false`, `classes.ts:4010-4011`).
- `pvScore` = boost per-subview del parent: `parentView.subViews[vid]` se la view è nel dizionario `subViews` del parent, altrimenti `1` (:421-422).
- **Precedenza di `explicitprio`** (:424-429): (1) valore **numerico** ritornato dalla `jsCondition` vince su tutto; (2) altrimenti `explicitApplicationPriority` se settata (`view.tsx:224`, default `undefined` — `classes.ts:1113`); (3) altrimenti euristica automatica `(jsCondition.length||1) + (oclCondition.length||1)` — cioè **la lunghezza testuale dei predicati fa da priorità implicita** (più specifico ≈ più lungo ≈ vince).
- `defualtViewMalus` (:433): nonostante il nome è un **bonus additivo +0.1 per le view NON di default** — `dview.id.indexOf('View') >= 0 ? 0 : 0.1`. Le view built-in hanno id contenenti `"View"` (`Pointer_ViewModel`, `Pointer_ViewFallback`, … — `common/Defaults.ts:47-67`) → bonus 0; le view utente hanno id random senza `"View"` → +0.1, quindi a parità di parte moltiplicativa **la view utente batte la default**.

**Ordinamento e split** — `NodeTransientProperties.sort` (`classes.ts:4071-4095`, verificata verbatim): le view con `finalScore <= 0`/`-∞`/`undefined` sono scartate (:4082); le rimanenti sono divise per `dview.isExclusiveView` in `mainViews` vs `decorativeViews` (:4083); entrambi gli array ordinati **decrescenti per score puro** con comparatore `(s1, s2) => s2.score - s1.score` (:4085-4086) — **nessun tiebreak esplicito**. Risultato: `mainView = mainViews[0]` (:4091), `validMainViews` (tutti gli esclusivi ordinati, :4092), `stackViews` (tutti i decorativi ordinati, :4093).

**mainView / stackViews / decorators al render** (`graphElement.tsx:1299-1370`): solo la **mainView** produce l'output del nodo — è posta ultima in `allviews` (:1300), le view di stack sono renderizzate prima e accumulate in `decoratorViewsOutput` (:1362-1365), iniettato nel contesto della main come `context.decorators` (:1401). Le decorative NON emettono output autonomo: affiorano solo se il template della main usa `{decorators}`.

**`isExclusiveView` — doppia semantica** (default `true` per ogni view nuova, `classes.ts:1114`):
- **sulla view**: classificatore main/decorator (`classes.ts:4083`) — esclusiva compete per la singola `mainView`, non esclusiva va nello stack. NON blocca lo stacking né esclude view a priorità inferiore.
- **sul viewpoint** (`DViewPoint`, mappato a `'syntax'` in `viewpoint.ts:19`): gate cross-viewpoint (`selectors.ts:558-559`) — una view di un viewpoint terzo non-esclusivo matcha comunque come decorativa (`VP_Decorative`); di un viewpoint terzo esclusivo è rigettata (`VP_MISMATCH`). È il meccanismo che isola i viewpoint "sintassi" tra loro lasciando applicare i viewpoint overlay.
- Guardia: le default view non possono essere demote da esclusive (`view.tsx:469-472`).

**Fallback sulla default view — nessun ramo speciale**: il fallback è una **view reale che matcha sempre tramite lo scoring ordinario**. `Pointer_ViewFallback` è creata in `redux/store.tsx:466-482` senza `appliableToClasses`/predicati → `IMPLICIT_MATCH(1)` (`selectors.ts:358`), `jsScore=true` (:746), OCL `true` (`ocl.tsx:130`), `explicitprio=2` (euristica su stringhe vuote), viewpoint default → score ≈ 2–4 sempre positivo, sempre in `mainViews`. Qualunque view genuinamente matchante la sorpassa (le default per-metaclasse vincono via `EXACT_MATCH(2)` — es. `views.ts:43-54`); quando niente altro matcha, è l'unica esclusiva superstite → `mainView`. Cinture di sicurezza hardcoded in `mapViewStuff`: `graphElement.tsx:186` (view esplicita non trovata) e `:207-209` (guardia finale `if (!ret.view)`); la fallback riceve la classe `graph-centered` (:1464-1465). Commento che documenta il contratto: `classes.ts:4087-4089`.

**Determinismo**: iterazione su `Object.values(state.viewelements)` (`selectors.ts:525/:531`, `getAllViewElements` :89-95) e `Object.keys(tn.viewScores)` (`classes.ts:4075`) → ordine di inserzione deterministico; sort V8 stabile → i pareggi si risolvono per **ordine di creazione delle view**, riproducibile ma senza chiave semantica. **Unica fonte di non-determinismo temporale**: la cache OCL `utils/LazyOCL.ts` — TTL 2 secondi con `Date.now()` (:49, :114-115, :152, :164) e `getDataVersion` che deliberatamente hasha `className` invece di `clonedCounter` (:60-77) → un edit al modello che cambia l'esito di una `oclCondition` può non ribaltare il match della view fino alla scadenza del TTL. La selezione OCL-driven è quindi time-sensitive, non strettamente data-driven.

**Cache e invalidazione**: risultati in `transientProperties.node[nid]` (`viewScores`/`mainView`/`validMainViews`/`stackViews`/`needSorting` — `classes.ts:4047-4056`); re-sort solo se `needsorting || !tn.stackViews` (`selectors.ts:620-621`). Invalidazione nel reducer (righe correnti, lievemente driftate rispetto a §3.2): view creata :656-661, cancellata :669-676, `VIEWS_RECOMPILE_ocl` :804-817 (reset `OCLScore=NOT_EVALUATED_YET` su TUTTI i nodi), `VIEWS_RECOMPILE_preconditions` :824-832 (idem per `metaclassScore`), `VIEWS_RECOMPILE_jsCondition` :964-992, recompile totale :691-731 (`resetAllNodes` :724-730 cancella ogni `transientProperties.node[nid]`). La cache LazyOCL NON è toccata da questi path (si auto-scade sul TTL; `invalidateDataCache` :260-270 esiste ma non è chiamata da qui).

**Rilevanza per un interprete nuovo**: l'intero algoritmo è puro (dati D + costanti) salvo il node-cheat OCL — replicabile fuori dal classic. I punti semantici da decidere esplicitamente in una reimplementazione: l'euristica lunghezza-predicati come priorità implicita, il bonus +0.1 id-based, il tiebreak per ordine di creazione, e la doppia semantica di `isExclusiveView`.

### 3.3 Pipeline di valutazione template

- **Compile (agnostico, già condiviso)**: `reducer.ts:1007-1009` su `VIEWS_RECOMPILE_jsxString` (:995): `DSL.parser` (`DSL/DSL.ts:2`, espande tag custom tipo `<Children includes/excludes/>`) → `UX.parseAndInject` (`UX.tsx:438-444`, in realtà sottile: solo `JSXT.fromString` JSX→`React.createElement`, con fallback `displayError`) → `new Function(paramStr, body)`. Una funzione compilata **per view** in `transientProperties.view[vid].JSXFunction`, riusabile da qualunque renderer.
- **Scope runtime (classic-bound)**: `paramStr` da `contextFixedKeys` (`sharedTypes.tsx:220-239`): `data, node, view, views, viewsid, viewid, dataid, nodeid, graphid, parentViewId, parentnodeid, isGraph, isVertex, isEdge, isEdgePoint, isVoid, children, constants, usageDeclarations, component, htmlindex, state, props, stateProps, ownProps, otherViews, decorators`. L'oggetto scope reale è costruito da `GraphElementComponent.getJSXContext` (`graphElement.tsx:673-688`): `{...this.props, ..., component: this}` — `node` è un `LGraphElement`, `component` il componente classic (i template chiamano `component.onClick`, `component.html`…), `decorators` = stack di view decorative (:1401). Agnostici nello scope: `data`, `view`, `constants`, `usageDeclarations`, `state`.
- **Prop-injection (classic-bound, da sostituire)**: `UX.injectPropsToString` (:372-436) e `UX.injectProp` (:102-278) threadano `nodeid/graphid/parentnodeid/viewid` e le root props classic (`mainViewRootProps` :322-341: `ref: component.html`, data-attribute, handler mouse, `classNameAdd` con viewid :340); `UX.recursiveMap` riavvolge gli LObject nudi in `windoww.Components.DefaultNode` (:90).
- **Errori**: classic ha overlay source-mapped (`displayError` `graphElement.tsx:690-739`, wired a compile-time `reducer.ts:1019`).

### 3.4 Style

- Compilazione CSS agnostica: `LViewElement.get_compiled_css` (:765-859). Selettore per-view `.<viewid>`; per i viewpoint `.GraphContainer` (:853) — ancoraggio classic.
- Delivery agnostica: `Dashboard.tsx:596-607` concatena tutti i `compiled_css` in un `<style id="views-css-injector-d">` globale — esiste a prescindere dall'editor.
- **Applicazione della classe al nodo = classic-bound**: `UX.tsx:340` (`classNameAdd: [..., viewid, ...viewsid]`) + `graphElement.tsx:1462-1473` (`classes.push("mainView", dv.id)`, `data-viewid`). I nodi flow NON ricevono la classe `.viewid`, quindi il CSS per-view oggi non li colpirebbe. (Nota: `forcedRootCssClass` citato nel prompt NON esiste nel repo — il meccanismo equivalente è questo `classNameAdd`.)

### 3.5 Editor di authoring (`components/editors/viewpoint/` + `TemplatePreview.tsx`)

**Nessuno di questi risulta montato oggi** (nessun importer esterno di WorkbenchCanvas/WorkbenchEditors/TemplatePreview; `rightbar/viewsEditor/` è interamente commentato, import morto in `DockLayout.tsx:24/:90/:144/:243`).

- `TemplateEditor.tsx` (:115 `view.jsxString = jsx`), `PredicateEditor.tsx` (:48/:51), `StyleEditor.tsx`, `WorkbenchEditors.tsx` (:26), ViewTree/Breadcrumb/Properties: **AGNOSTICI** — editano solo dati DViewElement. `ViewProperties.tsx:15/:150-165` usa l'enum `GraphElements` solo come metadato per dropdown.
- `TemplatePreview.tsx`: **MISTO** — pipeline compile standalone (`DSL.parser` → `JSXT.fromString` → `new Function('ctx','with(ctx){…}')` :90-96) con mock context (:13-84), ma fonde `windoww.Components` nello scope (:79-81) → un template con `<DefaultNode>` raggiunge comunque il classic.
- `WorkbenchCanvas.tsx`: **CLASSIC-BOUND** — monta `<DefaultNode>` in `.GraphContainer` (:188-189), legge `transientProperties.node[nid].viewScores` (:96-102), filtra i grafi `v2-flow` (:50).

### 3.6 Edge e viewpoint

- Overlay L2 (`EdgeOverlay.tsx`): filtro per viewpoint attivo agnostico (:189-192/:205-206, `findApplicableEdgeView` :540, `safeEval` degli endpoint :233-234), ma risoluzione dei rect sui nodi classic (`getNodeRect`/`LGraphElement.getNodeId` :237-238/:590-605) e mount solo in `ModelTab.tsx:47`.
- Edge nativi: la view guida `bendingMode`/`edgeGapMode`/segmenti in `GraphDataElements.tsx:2375/:2463`; creazione `DEdge` in `graphElement.tsx:302-339` con anchor classic.
- **EditorV2 non consulta MAI le view per gli edge**: disegna da riferimenti JjOM via `UnifiedEdge.tsx` + `useM1ReferenceEdges.ts` + `refEdgeReconcile.ts`; `isEdge`/`edgeSource`/`edgeTarget`/`bendingMode`/anchor ignorati. Tutto il machinery edge-view è classic-only senza percorso di riuso.

### 3.6-bis Edge con endpoint non renderizzati — comportamento effettivo (integrazione rev.)

I due canali edge del classic gestiscono l'endpoint mancante in modi **strutturalmente diversi**. Comportamento documentato dal codice, non atteso.

**Canale 1 — L2 overlay (edge view-driven)**: la decisione è **spaccata tra due file con due criteri diversi**.
- Il **fallback** è deciso da `graphElement.tsx:1408-1411` sulla **risoluzione delle espressioni**: `evalEdgeExpression` (`utils/edgeExpressionEval.ts:64`, successo solo se il valore "sembra un LObject" — `:99-102`; navigazione dati pura, non guarda MAI se l'endpoint è renderizzato). Entrambe risolvono → `null` (nessuna card, l'arco spetta all'overlay); **0 o 1 risolte → `EdgeFallbackCard`** (che mostra `S1 → ?`, lati irrisolti come `'?'` — `EdgeFallbackCard.tsx:56-57/:64-72`).
- L'**arco** è deciso da `EdgeOverlay.tsx` sulla **risoluzione dei rect**: per ogni DObject candidato, view applicabile (:230-231), `safeEval` dei due endpoint (:233-235), poi `getNodeRect` × 2 (:237-239) — ogni fallimento è un `continue` **silenzioso** (log solo con `window.__edgeOverlayDebug`, :120-130). `getNodeRect` (:595-645): Path 1 dal L-layer (`LGraphElement.getNodeId` :605 → nodo store con coordinate finite — **il mount DOM NON è richiesto**), Path 2 fallback DOM `querySelector('[data-nodeid]')` :634-635.
- **Conseguenze**: (i) endpoint che risolve come LObject ma **senza nodo grafo nello store** → niente card (le espressioni risolvono) E niente arco (rect nullo) → **sparizione silenziosa: il gap tra i due criteri**. (ii) endpoint con nodo store e coordinate finite ma non montato nel DOM → **l'arco viene comunque disegnato** verso un endpoint invisibile. (iii) il filtro viewpoint (:202-206) opera sulle **edge view** (`e.viewpoint !== activeVpId` → view scartata → arco soppresso), non sugli endpoint: un endpoint nascosto dal viewpoint ricade nel caso (i). (iv) **nessuna risalita ad antenato** in tutto il canale: solo `continue`/`null`/card (`findApplicableEdgeView` :556-586 risale la priorità di *classifier* per la selezione della view, non gli antenati dell'endpoint).

**Canale 2 — edge nativi (suggestedEdges → `<Edge>`/`<DerivedReferenceEdge>`)**: gate alla **fase di suggestion** su `.html` vivo.
- **M1**: `impl_get_suggestedEdgesM1` (`LModelElement.tsx:5196-5205`) — sorgente senza `.html` → `continue outer` (salta TUTTI gli edge uscenti del DValue); target senza `.html` → `continue inner` (salta quel singolo edge). Silenzioso, nessuna card, nessuna risalita. (Il template M1 default tiene i DValue reference DOM-vivi apposta — commento `defaultViewTemplate.ts:126-130`, cfr. `__ref-anchors` §2.3.)
- **M2 reference**: `:5217-5228` — endpoint scartato con `console.warn('[EdgeDebug] … not rendered yet')` (:5219-5225). Soppressione silenziosa + warning dev.
- **M2 `extends` — l'UNICA risalita ad antenato del codebase**: `SkipExtendNodeHidden`/`_recstep` (`LModelElement.tsx:5233-5265`, consumo :5275-5277): se il nodo della superclasse non è renderizzato, ricorre negli `extends` della superclasse (nonni, ecc.) fino ai primi nodi renderizzati (`filternode` :5268-5274 richiede `c.rendered`, esclude edge/edgepoint/graph puri e nodi fuori grafo); documentata a :5232 ("if A extends B1, B2; B1 extends C1, C2; and node B1 is hidden … display edge from A~C1, A~C2, A~B2"). Il nodo di partenza deve comunque essere renderizzato (:5244-5247).
- **Filtro consumer**: `views.ts:110-111` scarta gli EdgeStarter con `vertexOverlaps` o `!sameGraph` — di nuovo silenzioso.
- **Guardie al render**: `damedge.tsx:248/:267` → `__skipRender` silenzioso se i pointer non risolvono; ma un edge già mintato il cui endpoint si smonta a runtime produce un **error stub rosso visibile** `errorMsg('Missing edge start/end')` (`damedge.tsx:119-126`, `errorMsg` :98-107 — artefatto DIVERSO dalla `EdgeFallbackCard` L2). `DerivedReferenceEdge` invece ritorna `null` su ogni failure (endpoint :85, view :88, graph :92, routing :117-118). La geometria (`GraphDataElements.tsx:1015-1028/:2334-2336`) assume endpoint risolti e posizionati — nessun fallback interno. `rendered` ≡ presenza DOM: `get_rendered = !!get_html` (:227).
- **Helper di risalita generale esistente ma NON cablato**: `firstRenderedNode` (`GraphDataElements.tsx:231-236`, cammina `[this, this.father, …]` fino al primo `rendered`) è referenziato solo da un `// todo` in `EdgeStarter` (`LModelElement.tsx:4768`).

**Container collassati**: il grafo classic **non ha alcun concetto di collapse** (grep `collaps` in `graph/` e `edgeOverlay/` = zero hit; le occorrenze sono confinate a editor-v2, pannelli e SCSS). L'analogo è lo slider di dettaglio `level` in `DV.tsx` (gate a :1228/:1266/:1308/:1312/:1577): un level basso semplicemente non renderizza i figli → l'endpoint ricade nei casi "non renderizzato" sopra.

**Tabella semantica cross-canale** (ciò che un interprete nuovo deve replicare o ridefinire esplicitamente):

| Situazione | Canale 1 (L2 overlay) | Canale 2 (nativi) |
|---|---|---|
| Espressione endpoint non risolve a LObject | **EdgeFallbackCard** (`graphElement.tsx:1411`) | n/a (i nativi usano relazioni del modello, non espressioni) |
| Endpoint risolve ma NON ha nodo grafo nello store | né card né arco → **sparizione silenziosa** (`EdgeOverlay.tsx:239`) | EdgeStarter mai creato → **silenzioso** (`LModelElement.tsx:5197/:5203`) |
| Nodo store con coordinate finite, non montato nel DOM | **arco disegnato comunque** (Path 1, `EdgeOverlay.tsx:619-631`) | non suggerito (serve `.html`) → **silenzioso** |
| Endpoint filtrato dal viewpoint attivo | edge view scartata → arco soppresso (:205-206); endpoint nascosto → riga 2 | perde `.html` → **silenzioso** |
| Container/level nasconde l'endpoint | riga 2 | **silenzioso**, TRANNE `extends` → **risale alla superclasse renderizzata** |
| Edge mintato, endpoint si smonta al render | (overlay salta) | **error stub rosso** (`damedge.tsx:119-126`) |
| Risalita ad antenato visibile | **nessuna** | **solo M2 `extends`** (`SkipExtendNodeHidden`) |

### 3.7 TABELLA DI CLASSIFICAZIONE (deliverable Area C)

| Componente | Ruolo | Classe | Evidenza chiave |
|---|---|---|---|
| `DViewElement`/`DViewPoint` — campi template/predicati/css/priorità | Record persistito | **AGNOSTICO** | `view.tsx:191-224, 261-265` |
| `DViewElement` — geometria nodo, eventi drag/resize, snap/grid, size | Record persistito | **CLASSIC-BOUND** | `view.tsx:209, 225-251, 267-268, 235-245` |
| `DViewElement` — blocco edge (anchor, bending, L2 `isEdge*`) | Record persistito | **CLASSIC-BOUND** | `view.tsx:246-260, 271-286` ("classic editor only") |
| `Selectors.updateScores`/`getAppliedViewsNew`/`matchesMetaClassTarget`/`getFinalScore` | Risoluzione view per elemento | **AGNOSTICO** (logica) | `selectors.ts:356-632` |
| Cache score `transientProperties.node[nid].viewScores` | Storage risoluzione | **CLASSIC-BOUND** (chiave = nodo classic) | `classes.ts:4024-4056` |
| Invocazione risoluzione (`mapViewStuff`) | Trigger | **CLASSIC-BOUND** (unico caller) | `graphElement.tsx:139-142, 164, 192, 226` |
| `OCL.test` | Predicato OCL | **AGNOSTICO** (`node` opzionale) | `ocl.tsx:127-144` |
| Compile template (`DSL.parser` → `UX.parseAndInject` → `new Function`, per-view) | jsxString → JSXFunction | **AGNOSTICO** | `reducer.ts:995-1020`; `UX.tsx:438-444`; `DSL/DSL.ts:2` |
| Scope runtime (`contextFixedKeys` + `getJSXContext`) | Parametri della JSXFunction | **CLASSIC-BOUND** | `sharedTypes.tsx:220-239`; `graphElement.tsx:673-688` |
| Prop-injection (`UX.injectProp*`, `mainViewRootProps`, `recursiveMap`→DefaultNode) | Root props, nodeid threading | **CLASSIC-BOUND** | `UX.tsx:90, 102-278, 322-341, 372-436` |
| Compilazione CSS per-view + delivery globale | Style | **AGNOSTICO** | `view.tsx:765-859`; `Dashboard.tsx:596-607` |
| Applicazione classe `.viewid` sul root + selettore viewpoint `.GraphContainer` | Style→nodo | **CLASSIC-BOUND** | `UX.tsx:340`; `graphElement.tsx:1462-1473`; `view.tsx:853` |
| TemplateEditor / PredicateEditor / StyleEditor / WorkbenchEditors / ViewTree / Properties | Authoring | **AGNOSTICO** (non montati) | `TemplateEditor.tsx:115`; `PredicateEditor.tsx:48-51` |
| `TemplatePreview.tsx` | Preview mock | **MISTO** | `:90-96` agnostico; `:79-81` scope classic |
| `WorkbenchCanvas.tsx` | Preview live | **CLASSIC-BOUND** | `:50, 96-102, 188-189` |
| EdgeOverlay: filtro viewpoint + `findApplicableEdgeView` + eval endpoint | Selezione edge-view | **AGNOSTICO** (core) | `EdgeOverlay.tsx:189-206, 230-234, 540` |
| EdgeOverlay: risoluzione rect + mount; edge nativi; `EdgeFallbackCard` | Rendering edge da view | **CLASSIC-BOUND** | `EdgeOverlay.tsx:237-238, 590-605`; `GraphDataElements.tsx:2375/:2463`; `graphElement.tsx:302-339, 1411` |

### 3.8 Le cuciture (dove tagliare)

1. **Risoluzione (la più pulita)**: EditorV2 può chiamare `getAppliedViewsNew` con `node: undefined` e `nid` sintetico (es. `"v2_"+dataId`) e ottenere `mainView`/`stackViews` → è il filo mancante che popolerebbe `data.jsxString` di ClassNode. Perdite accettabili al primo taglio: `node` in jsCondition (`selectors.ts:728`) e il node-cheat OCL.
2. **Compile (già condivisa)**: eseguire la `JSXFunction` per-view già prodotta dal reducer invece dello stub; il blocco è lo scope → serve una factory di scope editor-indipendente (`data/view/constants/usageDeclarations` reali; stand-in o no-op per `node/component/nodeid/decorators`).
3. **Injection (da sostituire, non spostare)**: `UX.injectProps*` è irriducibilmente classic. O si vincolano i template a JSX self-contained (l'assunzione di TemplatePreview) o si forniscono equivalenti flow di `<DefaultNode>`/`<Vertex>`. **La frontiera più dura.**
4. **Style (quasi gratis)**: aggiungere `className={viewid}` + `data-viewid` al wrapper viewpoint dei nodi flow; decidere il sostituto del selettore `.GraphContainer` per il CSS di viewpoint.
5. **Edge: NON riusare.** Lasciare le edge-view classic-only e decidere se droppare o reimplementare `edgeSource`/`edgeTarget` (la parte agnostica di EdgeOverlay) sugli edge React-Flow.

---

## 4. AREA D — Stato dell'integrazione viewpoint in EditorV2

- **`ViewpointRenderer.tsx` (32 righe, letto per intero)**: props `{jsxString, context}` (:3-6); compila con `new Function('React','data','return (' + jsxString + ')')` e invoca `fn(React, context)` (:17-18); try/catch → `<div className="viewpoint-error">` (:19-25); `useMemo([jsxString, context])` inefficace perché `context` è ricreato ad ogni pass del transformer; docstring che si autodichiara stub (:8-11: "In production, this will use the full DSL.parser → UX.parseAndInject → new Function pipeline"). **Mancano**: scope completo (solo `React`+`data`; niente `view/node/decorators/views/viewpoint/nodeid/dataid/viewid/isVertex/isEdge`), parser DSL e transform JSX (un template classic in JSX grezzo non è JS valido → throw), error-state UI con riga/colonna, subscription Redux (non si ricompila su edit del template: il transformer non legge mai le view), applicazione style/cssx (nessuna classe `.viewid`), e soprattutto **selezione della view per predicato** (renderizza ciò che gli viene passato; nessuno decide quale view si applica).
- **Agganci**: solo `ClassNode.tsx:422-437` (`if (data.jsxString)` → wrapper `viewpoint-wrapper` + `<ViewpointRenderer jsxString={data.jsxString} context={data}/>` :434). `ObjectNode.tsx` (M1), `EnumNode.tsx`, `PackageNode.tsx`: **nessun aggancio** (zero match per jsxString/ViewpointRenderer).
- **`data.jsxString` non è MAI popolato** (verificato: unica occorrenza in scrittura = dichiarazione opzionale `types.ts:125`; i literal `data` dei transformer — `jjomTransformers.ts:160-173` per class, :201 enum, :224 package, :328-337 object — non lo contengono). **Il ramo viewpoint di ClassNode è dead code.**
- **Flusso dati**: `useJjomSync(modelid, setNodes, setEdges, …)` (`EditorV2.tsx:344`) → `jjomVertexToRFNode`/`jjomEdgeToRFEdge`. Il transformer legge solo sintassi astratta dal proxy L; zero riferimenti a view/viewpoint in `jjomTransformers.ts`. **L'informazione "quale view del viewpoint attivo si applica" non arriva mai nella pipeline flow.** Il viewpoint attivo (`state.viewpoint`) è usato solo per chrome UI: selettore in `Toolbar.tsx:190`, pill Abstract/Concrete (:435-439), abilitazione toggle (:181/:455).
- **La "sintassi concreta" in EditorV2 oggi = il classic montato come `classicSlot`** (`EditorSwitch.tsx:129` → `EditorV2.tsx:3509-3546`, rami classic/split con divider e `splitPercent`).
- **Se il flow diventasse l'unico renderer**, diventano morti o da rilavorare: quasi tutto `EditorSwitch.tsx` (resta solo il ramo flow :111-121 + il restore del viewpoint :79-94), il reset-mode su cambio viewpoint (:96-109); in `ActiveEditorContext.tsx` l'intero concetto `'flow'|'classic'`, il registry `ZoomController` per-id e `ClassicZoomBridge` (:5-98); in `EditorV2.tsx` i rami classic/split (:3509-3546), il wiring `classicSlot`/`onClassicDrop`, i bridge zoom classic (:2729-2796), le prop `classicSlot/editorMode/hasViewpoint/onEditorModeChange` (:260-270/:3502-3503/:3593); in `Toolbar.tsx` il gruppo mode-toggle (:171-181/:449-456) e la pill (:435-439) da ripensare. In positivo: è esattamente il percorso che obbligherebbe a cablare risoluzione+scope (il ramo morto di ClassNode diventerebbe il render path vivo).

### 4-bis Registrazione dei custom node React Flow (integrazione rev.)

**Punto di registrazione**: mappe letterali **module-level** (identità stabile tra i render — pattern raccomandato da React Flow, nessun churn di ri-registrazione), NON `useMemo` né interne al componente. `EditorV2.tsx:99-105` (verificato verbatim):

```ts
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    enumNode: EnumNode,
    packageNode: PackageNode,
    objectNode: ObjectNode,         // M1: instance of a metaclass
};
```

`edgeTypes` a `:112-117` (`reference`/`inheritance`/`composition`/`instanceRef`, tutti → `UnifiedEdge`). Passate a `<ReactFlow>` a `:3387-3388`. Seconda registrazione indipendente solo di test: `repro/ReproHarness.tsx:8-9`. **Nessuna indirezione registry/factory**: la mappa letterale è l'unico meccanismo (grep per `registerNode`/`nodeFactory`/`nodeRegistry` = zero; il simbolo `NodeTypes` in `joiner/types.ts:233` è un union L-proxy JjOM, non React Flow). Aggiungere un tipo = una chiave nel literal.

**Assegnazione del `type`**: hard-coded nei transformer (`jjomTransformers.ts` — `classNode` :162, `enumNode` :203, `packageNode` :226 con `style:{zIndex:-1,width,height}` :228-232, `objectNode` :330); dispatcher `jjomVertexToRFNode` :345-363, `switch` su `className` del modello JjOM (`DClass`/`DEnumerator`/`DPackage`/`DObject`; `default → null` = nodo droppato).

**Siti che branciano sulle stringhe di tipo** (la misura dell'invasività — un tipo nuovo è assente da ognuno di questi `=== 'xNode'` e cade nel ramo default se non aggiornato):

| Sito | Cosa fa col tipo |
|---|---|
| `EditorV2.tsx:1261` | connect handler M1: solo object→object crea reference edge M1 |
| `EditorV2.tsx:1659-1660` | dimensioni default al drop (packageNode 200×120 vs 140×40) |
| `EditorV2.tsx:1669-1744` / `:1752-1808` | i due switch di drop (JjOM-mode / standalone) sui 4 tipi (+`classNode:abstract`) |
| `EditorV2.tsx:1873-2036` | path di delete: i `classNode` instradati sulla co-evoluzione |
| `EditorV2.tsx:2284`, `:625` | creazione nodi `objectNode` (composition child / altro path M1) |
| `EditorV2.tsx:2437`, `:2481`, `:2626` | context menu: submenu composizione (object), "Add reference" (class), "Create View" (class/enum) |
| `EditorV2.tsx:2565-2583` | context menu: classe CSS e label per tipo |
| `EditorV2.tsx:3424-3427` | colore MiniMap per tipo |
| `useJjomSync.ts:191-194` | gate `isVertexClassName` (`className.includes('Vertex')`, usato a :1273/:1356): decide quali D-object diventano nodi RF — un nodo backed da un vertex JjOM nuovo deve soddisfarlo |
| `canvasToJjom.ts:1552` | undo/redo: remap attribute-id solo per `classNode` |
| `edgeUtils.ts:1205`, `:1423` | `packageNode` escluso dagli ostacoli di routing (due scan) |
| `InlineTypeSelect.tsx:25` | dropdown tipi attributo: raccoglie i label dagli `enumNode` |
| `PalettePanel.tsx:18-21`, `:132` | catalogo palette (i `type` diventano il `rawType` del drag) |

`portDistribution.ts` è node-type-agnostico (brancia sul tipo di **edge**, :81).

**Assunzioni sui dati**: interfacce in `types.ts` — `ClassNodeData` :118-129 (incl. `jsxString?: string` :125 e index signature :128), `EnumNodeData` :131-135, `PackageNodeData` :137-140 (solo `label`), `ObjectNodeData` :196-203 + `FeatureValueRow` :205-214. `ClassNode` (~900 righe, unico a destrutturare `width`/`height` misurati da `NodeProps`, :32) assume `attributes`/`operations`/`ghostParents`/`ghostTargets` e legge `data.jsxString` :423; `ObjectNode` (547 righe) ha accoppiamento Redux vivo (legge `state.idlookup` per metaclasse e feature, :40-45/:54-120); `EnumNode` (233) e `PackageNode` (98) minimi. Comune a tutti e quattro: root `<div className="mm-node …">` + `<NodeResizer>` + `<DynamicHandles nodeId={id}/>` + `useNodeHighlightClass`.

**Contratto degli handle — il punto meno invasivo**: NESSUN nodo renderizza `<Handle>` fissi (grep: `<Handle` solo dentro `DynamicHandles.tsx`); tutti montano `<DynamicHandles nodeId={id}/>` (`ClassNode.tsx:433/:488`, `ObjectNode.tsx:351`, `EnumNode.tsx:166`, `PackageNode.tsx:72`). `DynamicHandles` (315 righe) è **node-type-agnostico**: prende solo `nodeId`, legge `useEdges()`, genera per lato `MAX_HANDLES_PER_SIDE`(=4) coppie source+target con id stabili `` `${side}-${index}` `` (:221, verificato); dipende da `.mm-node` come ancestor DOM (:123) e da `.react-flow__node[data-id]` per la misura (:194). I transformer emettono già id conformi (`computeOptimalHandles` `jjomTransformers.ts:374-420`). **Un nodo nuovo non deve replicare alcun markup di handle**: basta wrapper `.mm-node` + `<DynamicHandles/>` e gli edge si attaccano.

**Costo fattuale di un tipo nuovo `'xNode'`** (vs l'innesto attuale nello stub): (1) 1 riga nella mappa `nodeTypes`; (2) componente `nodes/XNode.tsx` + interfaccia `XNodeData` in `types.ts`; (3) se backed da JjOM: transformer + `case` nel dispatcher + compatibilità col gate `isVertexClassName`; (4) se creabile dall'utente: palette + i due switch di drop; (5) i 14 branch-site sopra degradano al default (colore minimap default, nessuna voce contestuale, trattato come ostacolo di routing) finché non si aggiunge il caso. Lo stub attuale evita TUTTO questo overload-ando `ClassNodeData.jsxString` e ritornando presto dentro `ClassNode.tsx:422-437` — riusa registrazione, transformer, drop path e ogni branch di `classNode`.

### 4-ter Hotspot di performance nel render path (integrazione rev.)

Solo lettura del codice, nessun profiling. Classificazione: **[COMMENTATO]** = commento/throttle/memo con motivazione perf esplicita nel codice; **[SOSPETTO]** = evidenza strutturale da verificare con benchmark.

**Amplificatore globale (entrambi gli editor)** — `redux/action/action.ts:349` (verificato verbatim): ogni dispatch è `setTimeout(()=>storee.dispatch({...this}), 0)` — un dispatch async per singolo field-change, fuori dal batching React; l'ottimizzazione `batchedUpdates` è presente ma commentata (:351-355). **[COMMENTATO]**. Ogni costo per-dispatch sottostante va moltiplicato per questa granularità.

**Classic**:

| Sito | Cosa succede | Classe |
|---|---|---|
| `graphElement.tsx:369/:380` → `mapViewStuff` :164 → `updateScores` `selectors.ts:495-606` | Ogni nodo `connect()`-ed ri-esegue `mapStateToProps` a OGNI dispatch → loop su TUTTE le view per nodo (`getAllViewElements` :525), con eval della `jsCondition` compilata per (nodo,view) (:583→:718-750) e OCL su data change (:592-596). O(nodi × view) per dispatch. Commenti espliciti: `:594` *"OCL is computationally heavy, so i decided it is now a requirement to update the model to reevaluate ocl"* (verificato verbatim); `:581-582` sulla scelta di rieseguire jsCondition sempre. | **[COMMENTATO]** |
| `reducer.ts:807-816`, `:824-831`, `:1023-1031` | Invalidazioni all-nodes (reset OCL/preconditions/`jsxChanged` su ogni nodo per view cambiata). Decisione documentata di SALTARE un'invalidazione su rename perché *"too computationally heavy"* (`:1099-1100`). | invalidazioni **[SOSPETTO]**; skip **[COMMENTATO]** |
| `EdgeOverlay.tsx:155-280` | Il body del `useSelector` gira a ogni dispatch: due passate complete su `idlookup` (:195-208, :222-262), `findApplicableEdgeView` + 2×`safeEval` + 2×`getNodeRect` per DObject; commit gated da `selectorResultEqual` ma lo scan è incondizionato. Layer di memoizzazione documentato (:19-35, :110-113, per-edge `React.memo` :349-374). Fallback DOM `querySelector`+`getComputedStyle` dentro il loop (:633-644) **[SOSPETTO]**. | **[COMMENTATO]** (memo presente, costo riconosciuto) |
| `GraphDataElements.tsx:2398-2422` (`get_segments`) | Il getter L-proxy ricalcola `computeRouting` **a ogni accesso, senza cache** (verificato: nessuna cache nel getter); `get_d` (:2369-2377) lo rilegge e aggiunge `roundManhattanCorners`; `damedge.tsx:160-196` lo legge a ogni render dell'edge. | **[SOSPETTO]** |
| `GraphDataElements.tsx:689-693` (`get_text`) | `html.innerText` → reflow; commento esplicito :690-691. | **[COMMENTATO]** |
| `graphElement.tsx:104-133` + `:440` | `computeUsageDeclarations` esegue la `UDFunction` per view dentro `shouldComponentUpdate` a ogni update del nodo. | **[SOSPETTO]** |
| `graphElement.tsx:1264-1295` | Viewport culling già presente (placeholder per vertici off-screen, `shouldEnableCulling(50)`). | **[COMMENTATO]** (ottimizzazione esistente) |
| `Vertex.tsx:179-192`, `:254-267` | Drag/resize già `rafThrottle` ~30fps (*"OPTIMIZATION: Throttle drag updates to ~30fps to reduce TRANSACTION calls"*). | **[COMMENTATO]** |

**Flow (editor-v2)**:

| Sito | Cosa succede | Classe |
|---|---|---|
| `useM1ReferenceEdges.ts:63-85` | Selector `m1RefValuesSig`: O(oggetti × feature × valori) a ogni dispatch — **auto-documentato** :19-21 (verificato verbatim: *"If profiling surfaces this as hot, consider WeakMap memoization"*). | **[COMMENTATO]** |
| `useJjomSync.ts:1081-1164` | Selector `elementSnapshots`: hash rolling di tutti i figli di ogni elemento a ogni dispatch (commento :1093-1096); + 5 selector di firma full-walk (:306-432) che alimentano i deps dell'effect strutturale :1075. L'effect stesso (:436-1075) è O(model) multi-pass a ogni firing — l'header (:6-8) dichiara O(1) incrementale ma vale per il re-transform, non per questi scan. | firma/hash **[COMMENTATO]**; full-walk selectors ed effect **[SOSPETTO]** |
| `ObjectNode.tsx:53-67`, `:90-120` | Due `useSelector` PER NODO oggetto (feature vive + attributi metaclasse) → O(nodi × feature) aggregato a ogni dispatch. | **[SOSPETTO]** |
| `jjomTransformers.ts:49-145`, `:260-277` | Traversata completa dei proxy L per vertex a ogni transform; bypass esplicito del proxy per le coordinate (`vertex.__raw ?? vertex`, *"LProxy gotcha"* :150-154/:196-199/:217-220) — unico segnale in-code del costo dei getter proxy (nessun commento perf nel joiner stesso; il più vicino, `classes.ts:2897`, è una nota di correttezza). | traversata **[SOSPETTO]**; bypass `__raw` **[COMMENTATO]** come rationale |
| `EditorV2.tsx:1157-1202` | `stableNodes`/`stableEdges`: confronto O(n) per render per stabilizzare le reference — aggiunto esplicitamente contro il feedback loop causato dal dispatch async (rationale :1145-1150, verificato verbatim, cita `action.ts:349`). | **[COMMENTATO]** |
| `EditorV2.tsx:1018-1130` | Catena distribution+measure: double-`requestAnimationFrame` + safety net 100ms + `querySelector`/`updateNodeInternals` per nodo su cambio topologia (rationale :1069-1072); gated da fingerprint `topologyKey` :1025-1030. | **[COMMENTATO]** |
| `EditorV2.tsx:396-405` | Selector `liveRefNameSig` per-dispatch sui nomi dei riferimenti degli edge. | **[SOSPETTO]** |
| `UnifiedEdge.tsx:119-171` | **Nessun `React.memo`** (come `ClassNode`/`ObjectNode`: funzioni nude in `nodeTypes`); si sottoscrive a `useNodes()`/`useEdges()` INTERI → ogni edge ri-renderizza a ogni cambio di qualunque nodo/edge; `bundleCenter` fa `allNodes.find` → O(edge × nodi) durante il drag. La pipeline di path è invece `useMemo`-izzata (:143-179). | mancato memo/subscription **[SOSPETTO]**; pipeline path ok |
| Coalescing esistente | `useJjomSync.ts:241-262` flush via rAF; `reLayoutWatcher.ts:43-87` debounce del re-layout; conformance debounced 500ms. | **[COMMENTATO]** |

**Sintesi fattuale**: il costo strutturale del classic è il re-scoring per-nodo × tutte-le-view a ogni dispatch (il path più annotato del codebase), amplificato dal dispatch async per-field; i costi del flow sono gli scan di firma per-dispatch negli hook di sync e l'assenza di boundary `React.memo` su nodi ed edge. Nessuno dei due editor ha misure di profiling registrate nel repo: tutte le voci [SOSPETTO] richiedono benchmark prima di qualunque conclusione.

---

## 5. AREA E — Rischi, critical zone, indizi

### 5.1 Intersezione con la critical zone (§3.1 CLAUDE.md)

- **Motore sync PULITO**: `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState.ts`, `useM1ReferenceEdges.ts` — zero import da graph/edgeOverlay/edges-classic/view/DV (verificato, conteggio = 0 per ciascuno). Sopravvivono intatti alla rimozione.
- **MA 2 file critical-zone su 8 SONO sorgente classic**: `utils/defaultViewTemplate.ts` (le costanti CLASSIC_* :150/:176/:188, `__ref-anchors` :169, header :120-142 "rendered by the CLASSIC editor") e `common/DV.tsx` (:27 importa `PaletteType` da view/, :32 le costanti classic; emette `<DerivedReferenceEdge>`/`<Edge>` come componenti ambient :1239-1295; `EdgeHead` :602-649). Qualunque modifica qui scatta la regola 14 (migration VersionFixer obbligatoria).
- **Accoppiamento bidirezionale**: `DerivedReferenceEdge.tsx:14` importa `EdgeHead` da DV (circolarità logica DV↔edges); `view.tsx:49` importa `DEFAULT_VIEW_JSX_STRING`.
- **`VersionFixer.tsx` (critical zone)** importa e scrive i template classic nello stato persistito (:18-20, migration 2.220→2.225).
- **Reducer core** (fuori critical zone ma bloccante): `reducer.ts:68` (`contextFixedKeys`) e `:1441` (`GraphDragManager.stopPanning`).

### 5.2 Comportamenti classic senza equivalente flow (parity gap)

| # | Comportamento | Sede classic | Analogo flow? |
|---|---|---|---|
| 1 | **Rendering di template viewpoint arbitrari** (scope DSL completo) | `UX.tsx:438` → `graphElement.tsx:1377` | **NO** — solo lo stub. **Il gap più grande.** |
| 2 | Decorators / subview stratificate | `view.tsx:938-968`; `graphElement.tsx:1300/:1360`; `{decorators}` nei template | NO (zero match in editor-v2) |
| 3 | Edge anchor sui Field via `__ref-anchors` | `defaultViewTemplate.ts:169-171`; `LModelElement.tsx:5178` | NO — flow usa mappa `vertexByModel` (`useM1ReferenceEdges.ts:104/:144`); attach a livello di Field perso |
| 4 | Bending mode per-view (Line/Manhattan/Bezier²/Bezier³/Arc/QT/CS) | `joiner/types.ts:125-135`; `damedge.tsx:76/:82/:164` | PARZIALE — solo Manhattan (`UnifiedEdge.tsx:144`) |
| 5 | `edgeRouting` per-view ("classic editor only") | `view.tsx:271-279/:914` | NO |
| 6 | Offset di routing persistiti (`segmentOffsets`) | `damedge.tsx:150-230` | GAP — flow ha `edge.data.waypoints` in stato RF ma `canvasToJjom.ts` non li persiste |
| 7 | `DEdgePoint` (waypoint come entità modello) | `Vertex.tsx:531`; `graphElement.tsx:297-299/:1101-1107` | NO |
| 8 | Label edge da espressione + per-segmento; marker `EdgeHead` completi | `view.tsx:283/:397-402`; `DV.tsx:602-649` | DEBOLE — label = `refName` (`jjomTransformers.ts:462/:477`) |
| 9 | Rendering Field template-driven via `<DefaultNode>` | `defaultViewTemplate.ts:168/:170`; `UX.tsx:90` | NO — righe strutturate in ClassNode |
| 10 | View a livello di grafo (`isGraph`) | `graphElement.tsx` (8 siti) | NO |
| 11 | Auto-size da template (`adaptWidth/adaptHeight`) | `view.tsx:226/:1002`; `graphElement.tsx:1247-1261` | DIVERSO — NodeResizer/DOM misurato |
| 12 | Zoom/scale per-elemento | `view.tsx:879-886` | NO — solo zoom canvas |
| 13 | `EdgeFallbackCard` per edge non risolti | `EdgeFallbackCard.tsx`; `graphElement.tsx:1411` | NO — drop silenzioso o ghost stub |
| 14 | Preview live del workbench (`WorkbenchCanvas`) | `WorkbenchCanvas.tsx:188-189` | NO |

### 5.3 Bug noto "edge non tracciabile nel flow" — indizi raccolti (non investigati a fondo)

Punti di drop silenzioso nella pipeline edge flow:
- `jjomTransformers.ts:433-434` — endpoint vertex non risolto → `return null`.
- `jjomTransformers.ts:496-501` — **soppressione cross-metamodel**: reference con tipo target in altro metamodello → `return null` (reso come ghost-target stub). Candidato forte.
- `useM1ReferenceEdges.ts:135/:144-145` — oggetto sorgente/target senza vertex nel grafo → skip.
- `useM1ReferenceEdges.ts:148` — guardia `hasCanvasEdgePair`: pair marcato ma edge RF mai renderizzato (finestra di race/orfano) → skip indefinito fino a `clearCanvasEdgePair`. Candidato forte.
- `useJjomSync.ts` Step 4, guardie orphan/dedup (~:1296-1300).

### 5.4 Test

Un solo test accoppiato al classic: `edges/routing/classic/__tests__/routing.test.ts` (interno all'albero, muore col codice). Sweep dei 36 file `__tests__` sotto `frontend/src/`: nessun test esterno importa graph/edgeOverlay/routing-classic/view/DerivedReferenceEdge. I test editor-v2 sono indipendenti.

---

## 6. Sintesi per la decisione

1. **Il delete "facile" non esiste**: solo `EdgeOverlay` (+ scss), `graphContainer`, `SubViewComponent`, `graph/vertex/index.ts` e il classicSlot morto di MetamodelTab sono rimozioni pulite. Tutto il resto passa per: barrel joiner (`components.tsx`/`index.ts:305-329`/`ExecuteOnRead.ts:15`), reducer (`contextFixedKeys` :68, `GraphDragManager` :1441), `DV.tsx`+`defaultViewTemplate.ts` (critical zone), `GraphDataElements.tsx:65-71` (router classic nel model layer), VersionFixer.
2. **Le migration oggi remano contro**: 2.222→2.223 e il bump 2.224→2.225 riscrivono/rigenerano i progetti salvati verso template classic-runtime-only. Prima di rimuovere il runtime serve una migration inversa (classic jsxString → qualcosa che il flow sappia rendere, o marcatura esplicita).
3. **Il viewpoint NON muore col classic**: risoluzione (selectors/OCL) e compilazione (reducer, per-view) sono agnostiche e già pronte; le parti da sostituire sono scope, injection, applicazione style al root, e tutto il canale edge-view. L'authoring (Template/Predicate/Style editor) è agnostico ma oggi non montato.
4. **EditorV2 parte da zero sul rendering viewpoint**: aggancio presente solo in ClassNode e mai alimentato; niente per M1 (ObjectNode). Il lavoro vero è: (i) selezione view nel transformer/hook (seam 1), (ii) scope factory + esecuzione della JSXFunction compilata (seam 2), (iii) politica sui template non self-contained (seam 3), (iv) classe `.viewid` per lo style (seam 4).
5. **Perdite funzionali da accettare o rifare** (§5.2): le più visibili sono i template arbitrari (finché non c'è il renderer v2), decorators/subview, edge-view (`isEdge`), bending non-Manhattan, anchor a livello di Field.

---

## 7. Domande aperte per Alfonso

**Q1 — Strategia di rimozione: big-bang o a strati?**
- (a) *Strati* (raccomandabile alla luce degli entanglement): 1. rimozioni pulite (EdgeOverlay, dead code, classicSlot M2); 2. de-entanglement core (spostare `contextFixedKeys` fuori da graph/, decidere `GraphDragManager` nel reducer, potare il barrel joiner); 3. renderer viewpoint v2 (seam 1+2); 4. spegnere classic/split in EditorSwitch; 5. delete di graph/.
- (b) *Big-bang*: tutto in un colpo dietro un flag. Più rapido ma rischio regressioni alto e diff enorme (viola la soglia 5-file molte volte → serve comunque un piano approvato per fasi).

**Q2 — Sorte del rendering viewpoint in EditorV2: portarlo o abbandonarlo?**
- (a) *Portare la pipeline* (seam 1+2+4): EditorV2 esegue le JSXFunction per-view con scope ridotto; i template esistenti "semplici" continuano a funzionare; quelli che usano `node/component/<DefaultNode>` degradano.
- (b) *Reset del concetto di view per il flow*: le view v2 diventano un formato nuovo (non jsxString classic) e le view classic persistite vengono migrate/archiviate. Più pulito a lungo termine, ma rompe la continuità dei progetti salvati e va deciso il destino di `TemplateEditor` e del workbench.
- (c) *Solo styling*: si portano predicati + css (seam 1+4), niente template JSX nel flow. Minimo lavoro, massima perdita funzionale.

**Q3 — Progetti salvati con view classic: cosa devono vedere gli utenti dopo la rimozione?**
- (a) Migration VersionFixer che riscrive i jsxString classic verso il formato scelto in Q2 (obbligatoria se Q2=a con formati incompatibili; comunque necessaria per neutralizzare 2.222→2.223).
- (b) Placeholder esplicito ("questa view richiede l'editor classic, non più supportato") — onesto ma brutto.
- (c) Silent fallback al rendering astratto v2 (i nodi si vedono comunque; la sintassi concreta sparisce senza avviso).

**Q4 — Edge-view (`isEdge`, edgeSource/Target, bendingMode, anchor sui Field): droppare o reimplementare?**
- (a) Droppare: gli edge del flow restano derivati dal modello (comportamento attuale); i campi L2 di DViewElement diventano legacy morto (eventualmente da deprecare nello schema).
- (b) Reimplementare la parte agnostica (filtro viewpoint + `findApplicableEdgeView` + eval endpoint di EdgeOverlay) sugli edge React-Flow — lavoro medio, recupera le edge-view utente.

**Q5 — `edges/routing/classic/` e `GraphDataElements`**: il router è usato dal model layer indipendentemente dalla UI classic. Lo si tiene (rinominandolo? `edges/routing/manhattan/`) o si valuta se `GraphDataElements` possa perdere quella dipendenza? (Da chiarire se la geometria edge L-layer serve ancora una volta spenta la UI classic — probabile sì per `DerivedReferenceEdge`, finché DV emette edge nei template.)

**Q6 — Progetti demo (`frontend/src/examples/`)**: appaiono orfani (nessun import runtime). Rimuoverli, aggiornarli al formato post-migrazione, o lasciarli come corpus di test per la migration di Q3?

**Q7 — Workbench viewpoint**: `WorkbenchCanvas` (preview live) è classic-bound e gli editor non sono montati. Il futuro workbench fa preview dentro EditorV2 (richiede Q2=a), usa `TemplatePreview` (mock, quasi-agnostico), o si rimanda?

**Q8 — `createViewInWorkbench` e `newDefault`** settano `appliableTo`/`appliableToClasses` con valori classic (`'Vertex'`, `'GraphVertex'` — `lastViewpoint.ts:163/:178`): nel mondo solo-flow che semantica hanno questi target? (Legato a Q2.)

---

**HARD STOP.** Nessuna proposta di implementazione oltre le opzioni sopra; il piano si decide in chat di progetto su questo report.
