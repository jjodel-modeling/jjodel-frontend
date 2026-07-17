# Discovery — Deprecation del classic editor (v1) e applicabilità del meccanismo viewpoint a EditorV2

**Data**: 2026-07-17
**Tipo**: FASE 1 — discovery READ-ONLY. Nessuna modifica al codice. Hard stop a fine report.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prompt**: mappa completa di (a) cosa dipende dal classic editor, (b) quanto del meccanismo viewpoint è editor-agnostico vs classic-bound, (c) quanto lavoro serve per portare il rendering viewpoint-driven dentro EditorV2.

**Verdetto in una riga**: la rimozione del classic NON è un delete di `graph/` — gli entanglement veri stanno nel core (reducer, barrel joiner, DV.tsx/defaultViewTemplate.ts che sono critical-zone, VersionFixer che riscrive i progetti salvati VERSO template classic-only); ma il meccanismo viewpoint ha un taglio pulito **tra risoluzione e rendering**: scoring delle view e compilazione dei template sono già editor-agnostici e ospitabili da EditorV2, mentre scope runtime, prop-injection e tutto il machinery edge sono classic-bound e vanno sostituiti, non riusati. L'aggancio viewpoint esistente in EditorV2 (`ViewpointRenderer` + `data.jsxString`) è oggi **codice morto**: nessun transformer popola `jsxString`.

---

## 0. Metodo e file analizzati

Discovery condotta con 5 esplorazioni parallele (una per area) + verifica a campione delle citazioni load-bearing (reducer.ts:68/:1441, ClassNode.tsx:423/:434, types.ts:125, EditorSwitch.tsx:56/:111/:129, view.tsx:271/:901, VersionFixer.tsx:936-938/:972/:993, DV.tsx:32/:1707-1715, LModelElement.tsx:5178, jjomTransformers.ts:499-501 — tutte confermate sul working tree).

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
