# Discovery READ-ONLY: substrato edge verso l'edge authoring IR

**Data**: 2026-07-26. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD `4273317f8`, working tree pulito. Nessun file sorgente modificato. Uniche scritture: questo report + l'entry in `docs/claude-code-log.md`.

**Perimetro**: mappare lo stato reale del substrato edge in vista dell'edge authoring IR, distinguendo **object-as-edge** (DObject reificato reso come linea, capi da PathExpr) e **reference-as-edge** (EReference resa come linea, senza oggetto proprio). Entrambe in scope. La differenza operativa è UNA: su cosa matcha la view. Compiled view, rendering e widget sono condivisi.

> **Nota di premessa (ipotesi del prompt falsificate — riportate perché la mappa vale più della conferma):**
> 1. Il prompt cita `sync/jjomTransformers.ts`: il transformer vive in realtà in `frontend/src/components/editor-v2/**utils**/jjomTransformers.ts` (anche `edgeUtils.ts`/`portDistribution.ts` sono sotto `utils/`).
> 2. Il prompt assume un testbed **CD3** (`Pointer_CD3_*`, "Class Diagram IR v3"). **Non esiste nel sorgente di questo branch**: `grep -rIE '\bCD3\b|Pointer_CD3' frontend/src` = 0 match reali (ogni occorrenza è un frammento di colore hex tipo `#fcd34d`). I docs KB citati (`claude/…`) non sono nel repo (esiste solo `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`). CD3 è quindi al più un **progetto salvato caricato a runtime**, non un artefatto ispezionabile qui: la domanda 1 è risposta strutturalmente (cosa il codice RENDE), non su un fixture CD3.
> 3. Il prompt ipotizza che `DVertex.irEdgeLayout` sia "solo dichiarato nella spec". **Falso**: è un campo D-layer reale, scritto e riletto (loop chiuso). Vedi Q4/Area 1.

---

## Risposte nette alle quattro domande

### Q1 — Quale natura rende il substrato oggi

**Entrambe le nature sono cablate a runtime, ma con gradi di completezza diversi; nessun fixture sorgente installa una edge view** (il demo fixture è vertex-only, `irDemoFixture.ts:27-88`; le uniche edge view autorate esistono nei test `ir.test.ts`). Struttura reale del codice:

- **reference-as-edge**: gli edge M1 nascono SEMPRE dal transformer (`utils/jjomTransformers.ts:454-482`, tipi `composition`/`instanceRef`) e sono resi SEMPRE da `UnifiedEdge` (`EditorV2.tsx:121-126`). La styling IR (`decorateReferenceEdges`, `irEdgeViews.ts:118-141`) gira a runtime (`useIRContainment.ts:152`) MA i suoi output di stile sono **dead write** (vedi Q4): l'edge appare con lo stile CSS di default di `UnifiedEdge`, non con quello IR.
- **object-as-edge**: `synthesizeObjectAsEdges` (`irEdgeViews.ts:166-257`) nasconde il nodo dell'oggetto e disegna un edge sintetico `type:'instanceRef'` tra i capi risolti. Questa **geometria** è viva e visibile; ma anche qui lo stile IR è dead write, quindi l'edge sintetico appare come una freccia generica (stroke CSS + freccia hardcoded), instradata Manhattan.

Verdetto: **la sola cosa IR-edge realmente visibile oggi è la sintesi object-as-edge (nodo nascosto + edge sintetico + persistenza layout) e la label center (solo su hover/selezione)**. Colore/spessore/tratteggio/marker autorati nell'IR NON si vedono. Evidenza: `irEdgeViews.ts:49-72` (produzione stile) vs `UnifiedEdge.tsx:62-76,477-484,486-488,592-599` (consumo assente).

### Q2 — Il dato edge RF porta già la provenienza?

**Sì per il nome della reference (M1), no per le metaclassi dei capi — ma la reference-as-edge è comunque "quasi gratis"**, perché il matching corrente non usa le metaclassi dei capi.

- **refName**: gli edge M1 portano `edge.data.referenceName` (`utils/jjomTransformers.ts:463-466` composition, `:478-481` instanceRef). È letto direttamente da `decorateReferenceEdges` (`irEdgeViews.ts:134`).
- **metaclasse sorgente**: NON è sul dato edge; è derivata a decoration-time via `objByVertex.get(e.source) → idlookup[srcObj].instanceof` (`irEdgeViews.ts:131-133`). Una lookup, non uno storage.
- **metaclasse target**: NON è portata E NON è usata (reference-as-edge matcha su metaclasse SORGENTE + refName; se un futuro matching la volesse, è derivabile con lo stesso pattern `objByVertex.get(e.target)→instanceof`, quindi ANCHE quella senza toccare il transformer).
- Nota M2: gli edge `reference` (M2) portano `data.reference.name` (non `referenceName`) e `data.reference.targetClassId = endVertex.id` che è un **id di vertice, non di metaclasse** (`utils/jjomTransformers.ts:513`). Ma reference-as-edge IR filtra su `e.type === 'instanceRef'|'composition'` (`irEdgeViews.ts:129`), cioè solo M1: gli M2 non entrano nel path IR.

**Il sito candidato ad aggiungere provenienza esplicita** (`utils/jjomTransformers.ts`) è **FUORI dalla critical zone** (§3.1 elenca `useJjomSync`/`portDistribution`/`canvasToJjom`/`syncState`, NON `jjomTransformers`). Ma di fatto **non serve aggiungere nulla**: refName c'è, le metaclassi sono derivabili.

### Q3 — Su cosa chiavizza il bucket edge

**reference-as-edge chiavizza già sulla metaclasse SORGENTE, con un sub-indice per nome-reference integrato nello score** — quindi ESTENDE il bucket per-metaclasse, non ne affianca uno nuovo. object-as-edge chiavizza sulla metaclasse dell'oggetto-edge.

Struttura reale di `IRViewpointIndex` (`irResolveCore.ts:44-60`):
```
byMetaclass / wildcard                 → vertex + graphVertex          (:47-49)
edgeByMetaclass / edgeWildcard         → reference-as-edge, key = metaclasse SORGENTE   (:50-52)
objectAsEdgeByMetaclass                → object-as-edge, key = metaclasse dell'oggetto  (:53-54)
rowByMetaclass / rowWildcard           → row (Fase R1)                 (:55-57)
```
Il routing per kind è a `irResolveCore.ts:116` (`ir.kind==='edge'`), e `isObjectAsEdge` (`irCompile.ts:408`) decide in quale dei due bucket edge finisce (`irResolveCore.ts:125-141`). Lo score composto (reference + metaclasse) esiste GIÀ: `resolveEdgeView` (`irResolveCore.ts:256-290`) cammina l'ancestry della metaclasse sorgente e applica il filtro `reference` con **+0.5 di specificità** per le view che nominano la reference (`:273-276`). Non serve inventare uno score nuovo: il "reference + coppia sorgente" è già la chiave/score attuale (manca solo, eventualmente, il target — vedi OQ-2).

### Q4 — Quanto dello scaffolding edge è vivo e cablato

**Molto più di un ipotetico "E1": il full stack resolve→compile→decorate→interact→persist→react è vivo e cablato. Il buco reale è a valle (il RENDERER non applica lo stile IR) e a monte (authoring assente).**

| Capacità | Stato | Evidenza |
|---|---|---|
| `CompiledEdgeView` | **vivo** (compilato, cache) | `irCompile.ts:382-428` |
| bucket edge + gate kind | **vivo** | `irResolveCore.ts:50-54,116-141` |
| `resolveEdgeView` / `resolveObjectAsEdgeView` | **vivi** | `irResolveCore.ts:256-320` |
| decoration a canvas (`decorateReferenceEdges` + `synthesizeObjectAsEdges`) | **vivi e cablati** in `useIRContainment` (consumato da EditorV2) | `irEdgeViews.ts:118-257`, `useIRContainment.ts:152,158` |
| sintesi object-as-edge (nascondi nodo + edge sintetico + soppr. ref edge) | **viva e VISIBILE** | `irEdgeViews.ts:186-256` |
| connect gesture (object-as-edge) | **vivo** | `irInteraction.ts:53-134`, reconnect scrive lo slot `EditorV2.tsx:1915-1918` |
| anchor override + selezione sintetici + waypoint di sessione | **vivi** | `irEdgeInteraction.ts` (intero), `EditorV2.tsx:1920,3412` |
| persistenza layout object-as-edge (`DVertex.irEdgeLayout`) | **viva, loop chiuso** | campo `GraphDataElements.tsx:1690-1694`; write `canvasToJjom.ts:90-101`; hydrate `EditorV2.tsx:1308-1331` |
| reattività cross-oggetto label edge | **viva** | `useIRContainment.ts:80-111,170-178`, `irEdgeViews.ts:205` |
| **applicazione VISIVA dello stile IR (stroke/width/dash/marker/routing)** | **DEAD WRITE** (renderer non lo consuma) | `irEdgeViews.ts:49-72` prodotto, `UnifiedEdge.tsx:62-76,477-484,486-488,592-599` ignorato |
| label center IR | **viva ma gated** (M1 solo su hover/selezione/toggle) | `UnifiedEdge.tsx:101,501-506,625,631` |
| **authoring edge (panel, tab, seed, hook)** | **ASSENTE** | nessun `EdgeAuthoringPanel`/`useIREdgeView`/`defaultEdgeViewIR`; `EnableIRPanel` solo vertex/row; `ViewData.showIRTab` esclude edge |

Conseguenza: un cantiere **E-obj** (object-as-edge) NON parte da zero: parte con resolver/compile/sintesi/interazione/persistenza/reattività già fatti e col test verde. Restano due lavori: **(1) far consumare lo stile IR al renderer** (oggi dead write), **(2) costruire il pannello di authoring**. Un cantiere **E-ref** (reference-as-edge) parte con resolver+decoration già vivi ma condivide i due buchi (renderer + authoring) e ha in più il problema del **carrier di persistenza mancante**.

---

## File letti / analizzati (path completi)

**Substrato IR (letti integralmente):** `viewpoint/ir/irTypes.ts`, `irResolveCore.ts`, `irCompile.ts`, `irEdgeViews.ts`, `irContainment.ts`, `useIRContainment.ts`, `irResolve.ts`, `irEdgeInteraction.ts`, `irInteraction.ts`, `irValidate.ts`, `irDefaults.ts`. Test `viewpoint/ir/__tests__/ir.test.ts` (blocchi edge). Tutti in `frontend/src/components/editor-v2/`.

**Renderer / canvas / sync (letti; sync/critical zone in SOLA LETTURA):** `edges/UnifiedEdge.tsx`, `utils/edgeUtils.ts` (soglia Manhattan), `utils/jjomTransformers.ts`, `EditorV2.tsx` (edgeTypes, reconnect, persistIREdgeLayout, hydration), `hooks/useJjomSync.ts` (solo call-site edge), `sync/canvasToJjom.ts` (solo `syncIREdgeLayoutToJjom`), `model/dataStructure/GraphDataElements.tsx` (campi `DVertex.irEdgeLayout`, `DEdge` anchor).

**Authoring (letti):** `authoring/MatchingSection.tsx`, `authoring/TextSourceEditor.tsx`, `authoring/VertexAuthoringPanel.tsx` (ciclo commit), `authoring/EnableIRPanel.tsx`, `editors/views/ViewData.tsx`. Census grep authoring/UI.

**Classic (verificato via fan-out):** `common/DV.tsx` (edgeView), `redux/store.tsx` (makeEdgeView), `redux/selectors/selectors.ts` (scoring), `joiner/components.tsx` (DerivedReferenceEdge rimosso).

---

## Findings per area

### Area 1 — Substrato edge in editor-v2 (React Flow)

**Nascita degli edge (transformer, `utils/jjomTransformers.ts`).** Unica factory `jjomEdgeToRFEdge` (`:426`), cinque siti di costruzione:
- **object-as-edge non c'è a livello di transformer**: la reificazione avviene DOPO, in `synthesizeObjectAsEdges` (un `DObject` con vertice diventa nodo normale via `jjomVertexToRFNode`, poi l'IR lo nasconde e crea l'edge sintetico). Il transformer produce solo edge "reali".
- **reference-as-edge / edge M1**: `composition` (`:454-467`, `data:{referenceName, referenceId}` `:463-466`), `instanceRef` (`:470-482`, `data:{referenceName, referenceId}` `:478-481`). Shape dell'edge: `type`, `label:refName`, `source`/`target` vertici, `data`.
- edge M2 `reference` (`:508-538`, `data:{reference:{id,name,kind,targetClassId=endVertex.id,lowerBound,upperBound,containment,opposite}, jjomRefId}`); `inheritance` (`:541-552`, `data:{}` vuoto); fallback reference generico (`:555-573`). **Nessun edge.data porta una metaclasse.**
- Costruttori gemelli lato UI (edge disegnati a mano): M2 `EditorV2.tsx:1612-1641`, M1 `EditorV2.tsx:1730-1744`.

**Componente edge custom.** `UnifiedEdge` (`edges/UnifiedEdge.tsx`) è l'UNICO renderer per tutti i tipi (`EditorV2.tsx:121-126` → `reference`/`inheritance`/`composition`/`instanceRef` tutti a `UnifiedEdge`; passato `:3842`). Rende un `<path className={edgeClassName}>` (`:592-599`, classe CSS `:486-488`), non usa `<BaseEdge>`.

**Regola Manhattan.** `computeManhattanPath` (`utils/edgeUtils.ts:92-135`). La convenzione "|dy|<5 = dritto, altrimenti curva" è **imprecisa**: non c'è ramo curva (routing puramente ortogonale); la soglia è `SNAP = 8` (`:106`), per-asse (allineamento sorgente/target → segmento dritto vs percorso Z/L/U). Curvatura solo come corner-rounding fisso in `roundManhattanPath` (`UnifiedEdge.tsx:248`).

**Marker/frecce, stile linea, colore — dove sono decisi OGGI.** Hardcoded in `UnifiedEdge`: marker `<marker>` SVG per-edge (`:513-575`), scelti da `kind` (composition→rombo pieno, aggregation→rombo vuoto, association→freccia, inheritance→triangolo) a `:477-484`; stroke via classe CSS (`reference-edge {kind}` / `inheritance-edge`). **Questo è esattamente il punto che il rendering IR-driven dovrà sostituire** — e oggi NON lo fa (vedi consumer verification sotto).

**Label sugli edge.** Sì: role label (nome reference) + badge cardinalità (`UnifiedEdge.tsx:625-668`). Per M1 la label è nascosta di default e mostrata su hover/selezione/toggle globale `showEdgeLabels` (`:501-506,631`). `props.label` (settato dall'IR) alimenta lo stato iniziale `labelText` (`:101`, sync `:104-108`).

**Consumer verification (rule §5.1 "verify consumers"): lo stile IR è quasi tutto DEAD WRITE.** `applyEdgeStyle` (`irEdgeViews.ts:49-72`) scrive `e.style.stroke/strokeWidth/strokeDasharray`, `e.markerStart/markerEnd` (RF `MarkerType`), `e.label`, `e.data.irEdgeViewId/irRoutingHint/irLabelPlacement`. `UnifiedEdge` destruttura (`:62-76`) SOLO `id/coords/source/target/handles/data/selected/label/type` — **non** `style`/`markerStart`/`markerEnd`, e non usa `<BaseEdge>`:
- `e.style` (stroke/width/dash) → **DEAD**: il path usa `className`, `props.style` mai letto.
- `e.markerStart/markerEnd` → **DEAD**: `UnifiedEdge` usa i propri `url(#…)` verso i propri `<marker>`; RF non inietta `edge.markerEnd` senza `<BaseEdge>`.
- `e.data.irRoutingHint` → **DEAD**: sempre `computeManhattanPath` (`:150-153`).
- `e.label` → **VIVO ma gated** (M1: solo hover/selezione/`showEdgeLabels`).

Conclusione: `applyEdgeStyle` è scritto per un consumer stile `<BaseEdge>` **che in questo codebase non esiste**. Il rendering IR-driven degli edge richiede o (a) far leggere a `UnifiedEdge` `props.style`+marker+`irRoutingHint`, o (b) un componente edge IR dedicato registrato per i tipi IR.

**Interazione.** Creazione via drag: M1 `EditorV2.tsx:1730-1744`; per object-as-edge il reconnect scrive lo slot reference (vedi Area 5). Selezione/cancellazione: `irEdgeInteraction.ts` (selezione sintetici ri-applicata in `useIRContainment.ts:164-165`). Ancoraggio: `portDistribution.ts` (solo punto di aggancio — vedi Area 5).

**Persistenza (input a Q4).** `DVertex.irEdgeLayout` è **implementato e vivo**, NON solo dichiarato: campo D-layer `GraphDataElements.tsx:1690-1694` (`sourceSide/targetSide/waypoints`); scritto da `syncIREdgeLayoutToJjom` (`canvasToJjom.ts:90-101`, `SetFieldAction` `:99`); riletto/idratato una volta per grafo in `EditorV2.tsx:1308-1331` (legge `v.irEdgeLayout` `:1320`, `hydrateIREdgeAnchorOverrides` `:1329`). Loop di sessione→persistenza→reidratazione chiuso. **Vale solo per object-as-edge** (il layout è portato dal DVertex nascosto dell'oggetto-edge; una reference-as-edge non ha carrier — vedi Rischi).

### Area 2 — Residui del substrato classic (lato edge)

**Vivo:** i `DViewElement` di default edge classici sono ancora coniati all'init dello store — `makeEdgeView` (`store.tsx:499-510`) → `DV.edgeView` (`DV.tsx:662-1068`) crea Association/Dependency/Inheritance/Aggregation/Composition, con `appliableTo='Edge'` (`DV.tsx:1057`), pushati in `edgeViews` (`store.tsx:501`) e nei subViews del default viewpoint (`:526-530`). Il motore di scoring generico processa anche gli edge (`selectors.ts:414` include `state.edges`; matching su `appliableToClasses` `:356-373`, `getFinalScore` `:417`, `updateScores` `:495`) — **nessun ramo di scoring edge-specifico**.

**Morto/vestigiale:** il campo `appliableTo` NON è usato nella risoluzione viva (solo commenti / blocco commentato `selectors.ts:450,479,550`); il jsxString delle edge view classiche non è reso da v2; **`DerivedReferenceEdge` è RIMOSSO** (Stadio 6; nota `components.tsx:13-14`) — restano solo occorrenze string/commento in `DV.tsx:1243,1281` (template mai eval'd) e `VersionFixer.tsx:988,991`. **Nulla di riusabile lato rendering**; l'analogo vivo del "dispatch per-oggetto" resta il resolver IR.

### Area 3 — Stato IR per kind `edge`

- **`irTypes.ts`**: `EdgeViewIR` esiste (`:163-191`) con discriminante `kind:'edge'`, `metaclasses`, **`reference?`** (per reference-as-edge), `predicate`, `priority`, `exclusive`, `label`, e `edge:{source?,target?,line?,terminations?,routing?,labels?,persistWaypoints?}`. `EdgeTermination` (`:145-151`) copre none/openArrow/closedArrow/hollowTriangle/filledDiamond/hollowDiamond. **Il matching copre GIÀ entrambe le nature**: `reference` per la reference-as-edge, `edge.source/target` per l'object-as-edge; la distinzione è `isObjectAsEdge = !!(sourceExpr && targetExpr)` (`irCompile.ts:408`). `CompiledEdgeView` (`irTypes.ts:236-257`) porta `reference`, `isObjectAsEdge`, `sourceExpr/targetExpr`, `lineColor/Width/Style`, `terminations`, `routing`, `labelText/labelPlacement`, `persistWaypoints`, `crossPaths`. Allineato alla spec v1.2 §7 (`docs/specs/spec_2026-07-18_ir_schema_v1_2.md:115-144`), con marker approssimati sul substrato RF (`irEdgeViews.ts:36-47`).
- **`irCompile.ts`**: `compileEdgeView` (`:382-428`) — percorso di compile completo e **cablato a rendering** (via decoration), non scheletro morto. Terminazioni default: `sourceEnd:'none'`, `targetEnd:'openArrow'` (`:414-417`); `persistWaypoints ?? true` (`:421`); label da `edge.labels.center` (`:419`). (`CompiledRowView` "modellato come edge" della fase R = tipo separato analogo, non correlato agli edge.)
- **`irResolveCore.ts`**: bucket dedicati (Q3). `compareCandidates` (`:35-42`) — il comparatore condiviso estratto in R1 — è **già adottato** da `resolveEdgeView` (`:283`) e `resolveObjectAsEdgeView` (`:313`). Lo score composto reference+sorgente c'è già (`:273-276`); per aggiungere il target servirebbe estendere la chiave/filtro di `resolveEdgeView` (oggi non guarda la metaclasse target).
- **`irResolve.ts`**: NON esiste `useIREdgeView`. **Scelta di design**: gli edge sono decorati in **batch** dentro il memo di `useIRContainment` (`:152,158`), non con una subscription per-edge come `useIRView`/`useIRRowView`. La reattività per-edge (label cross-oggetto) è ottenuta con `oaeSlotsSig` + `edgeObjectDeps` (`useIRContainment.ts:80-111,170-178`), non con un hook per-edge. Un futuro authoring non richiede un `useIREdgeView`.
- **`editors/views/ViewData.tsx`**: **nessun routing per kind `edge`**. `showIRTab` (`:58`) è `vertex || row || (isV && !ir && !isEdge)`: una view `ir.kind==='edge'` NON ottiene il tab IR, e le view marcate `isEdge` (edge classiche) sono escluse. Il ramo placeholder "authoring non ancora disponibile" (`:90-96`) è di fatto **irraggiungibile per edge** (richiede `showIRTab` true).
- **`authoring/EnableIRPanel.tsx`**: `KIND_OPTIONS` = solo `vertex`/`row` (`:8-11`). Nessun seed `edge`. Guard anti-overwrite (`:66-73`). `validateIR` invece instrada già `edge → compileEdgeView` (`irValidate.ts:18`). Rischio noto `D_LEVEL_TYPES` duplicato: presente in `EnableIRPanel.tsx:21-24` (e replicato nel featureInfo di VertexAuthoringPanel), da conoscere se si duplica in un edge panel.
- **Runtime**: sì, qualcosa viene reso a partire da una edge view IR — la **sintesi object-as-edge** (nodo nascosto + edge sintetico) è viva (`irEdgeViews.ts:166-257`, cablata `useIRContainment.ts:158`). La reference-as-edge styling gira ma è dead write a valle. Il kind edge **non esiste solo nello schema**: esiste in schema + compile + resolve + decorate + interact + persist; manca solo l'applicazione visiva dello stile e l'authoring.

### Area 4 — `decorateEdges`

`decorateEdges` (`irContainment.ts:240-277`) NON è la styling edge; è il **lift-to-ancestor del collasso** (spec §7): quando un capo è nascosto (collasso o soppressione row), rimappa l'edge al vertice antenato renderizzato (handle azzerati, `data.irLifted=true`, dedup coppie liftate, soppressione se entrambi i capi collassano sotto lo stesso antenato). Input = set `hidden` (collapse + row hidden uniti in `useIRContainment.ts:145-146`). Riusabile per un futuro rendering IR-driven: la meccanica lift/suppress è già generica e agisce su qualunque edge (inclusi i penzolanti dei row children soppressi, che vengono liftati senza logica nuova — `useIRContainment.ts:137-148`).

**Ordine di decorazione (rilevante per il matching post-lift).** In `useIRContainment` l'ordine è: **prima** `decorateNodes`/`decorateEdges` (lift, `:147-148`), **poi** `decorateReferenceEdges` (styling, `:152`), **poi** `synthesizeObjectAsEdges` (`:158`). Conseguenza per **reference-as-edge**: `decorateReferenceEdges` matcha su `objByVertex.get(e.source)` (`irEdgeViews.ts:131`), cioè sul capo **POST-lift** (l'antenato), non sul capo semantico originale. Se un edge è stato liftato, la reference view viene risolta sulla metaclasse dell'ANTENATO + il refName originale (che è preservato in `data.referenceName` dallo spread `...e.data` in `irContainment.ts:270`), il che è **semanticamente incoerente**: il matching semantico di una edge view dovrebbe usare i capi ORIGINALI (prima del lift), non quelli renderizzati. Oggi vince il post-lift. È un punto da decidere in spec (vedi OQ). Per object-as-edge il problema non si pone allo stesso modo: la risoluzione è sull'oggetto-edge (`resolveObjectAsEdgeView` su `objectId`), indipendente dai capi.

### Area 5 — Confine con la critical zone

Punti di contatto edge ↔ critical zone (SOLA lettura):
- **`portDistribution.ts` (§3.1)**: gli edge sintetici ricevono handle geometrici via `assignGeometricHandles` (`irEdgeViews.ts:93-116`) col contratto `${side}-${index}` di `DynamicHandles`; `computePortDistribution` è consumato in `EditorV2.tsx:967` dove si prende **solo** `edgeHandles` e si scarta `nodeHandles`. Nessun tocco a `portDistribution` è necessario per label/stile/marker/matching.
- **`useJjomSync.ts` (§3.1)**: unico entry di costruzione edge = `jjomEdgeToRFEdge` (import `:33`; popolazione `:1208-1214/:1229-1230`, `:1295`, `:1387`, `:1474-1526`). Read-only: il sync emette l'edge, l'IR decora a valle.
- **`canvasToJjom.ts` (§3.1)**: `syncIREdgeLayoutToJjom` (`:90-101`) È GIÀ in critical zone e già landed — scrive `DVertex.irEdgeLayout` per la persistenza object-as-edge. **Qualunque nuova persistenza edge tocca questo file.**
- **`jjomTransformers.ts`**: **FUORI** dalla critical zone (§3.1 non lo elenca). Aggiungere provenienza (refName/metaclassi) qui non tocca portDistribution/useJjomSync — ma (Q2) non serve.

**Cosa è implementabile SENZA toccare la critical zone**: matching su metaclasse E su reference (già fatto), label center, stile linea (color/width/dash), marker/terminazioni, conditionals — tutto a valle, in `irEdgeViews.ts`/`UnifiedEdge.tsx`/authoring. **Cosa la sfiora**: la persistenza di override di layout (waypoint/side) — object-as-edge già passa da `canvasToJjom.ts` (landed); una persistenza per **reference-as-edge** richiederebbe un carrier nuovo (non c'è DVertex) e quindi go-ahead + Layer Impact Report. Il routing configurabile e l'ancoraggio custom, se implementati, sfiorerebbero portDistribution/edgeUtils.

### Area 6 — Superficie di authoring

- **`MatchingSection`** è tipizzata `VertexViewIR` (`MatchingSection.tsx:12-20`) e autora metaclasses/predicate/priority/**exclusive**. Riusabile CONCETTUALMENTE per il ramo **object-as-edge** (matching sulla metaclasse propria), ma il tipo va allargato a `EdgeViewIR` (o va fatto un matching inline come nel `RowAuthoringPanel` di R3, che non riusò MatchingSection perché il row IR non ha `exclusive`). `EdgeViewIR` HA `exclusive`, quindi MatchingSection è più vicina — ma serve comunque il campo aggiuntivo (`reference`, `edge.source/target`).
- **Ramo reference**: un futuro `EdgeAuthoringPanel` deve esporre un **toggle di natura** (matcha su oggetto-edge / matcha su reference). Ramo reference = picker metaclasse sorgente + nome reference (`ir.reference`) + target opzionale (non ancora supportato dal resolver — OQ). Ramo object = picker metaclasse + `edge.source`/`edge.target` PathExpr.
- **Widget riusabili senza modifiche**: `TextSourceEditor` (intrinsic/path/literal — diretto per `edge.labels.center`), `PredicateBuilder`, `ConditionalEditor`, `ListEditor`, `ColorPicker`, `Select`, `NumberInput`, `LabelListEditor`. Ciclo di persistenza del draft = stesso canale vertex/row (`VertexAuthoringPanel.tsx:47-82`: draft clonato, validate eager, commit debounced `view.ir=draft`). **Widget nuovi presumibili**: editor stile linea (color/width via ColorPicker+NumberInput, dash via Select — componibile dai primitivi), picker terminazione/marker (Select su `EdgeTermination`).
- **Grep censimento (nessuna creazione)**: `EdgeAuthoringPanel`, `useIREdgeView`, `defaultEdgeViewIR`, `refMatch`, `EdgeMatchingSection` = **ZERO occorrenze**. `CompiledEdgeView` è consumato da `EditorV2.tsx`, `irResolveCore.ts`, `useIRContainment.ts`, `irEdgeInteraction.ts`, `irCompile.ts`, `irTypes.ts`, `irEdgeViews.ts` (runtime cablato, authoring assente).

### Area 7 — Domande aperte per Alfonso

Vedi §Domande aperte in coda.

---

## Dipendenze e rischi

1. **Dead write dello stile IR (rischio #1, il vero collo di bottiglia)**: `applyEdgeStyle` produce stroke/marker/routing che `UnifiedEdge` ignora. Finché il renderer non li consuma, autorare stile/marker/routing nell'IR non produce effetto visibile. Va deciso l'approccio: estendere `UnifiedEdge` (consuma `props.style`+marker+`irRoutingHint`) o un componente edge IR dedicato. **Rischio di regressione**: `UnifiedEdge` è condiviso con gli edge classici M2 — un consumo indiscriminato di `props.style` cambierebbe anche il rendering non-IR.
2. **Carrier di persistenza asimmetrico**: object-as-edge persiste il layout sul DVertex nascosto (`DVertex.irEdgeLayout`, vivo). Reference-as-edge NON ha oggetto/DVertex → nessun carrier: override di routing/side per reference-as-edge non hanno dove persistere senza un meccanismo nuovo (tocca `canvasToJjom.ts`, critical zone → LIR).
3. **Matching post-lift (Area 4)**: `decorateReferenceEdges` risolve la view sul capo post-lift, non sull'originale. Da decidere se il matching di una edge view va valutato sui capi semantici originali. Basso impatto oggi (styling dead), ma da fissare prima di rendere lo styling vivo.
4. **Gate authoring (`ViewData.showIRTab:58`)**: nessun entry-point per edge; le view `isEdge` classiche sono escluse dal tab IR. Serve un ramo che permetta di seedare un `EdgeViewIR` (analogo R3 per row) senza che `EnableIRPanel` ri-seedi a vertex.
5. **`irRoutingHint`/`irEdgeViewId`/`irLabelPlacement`** scritti e mai letti: se non si attiva il consumo, restano metadati morti (documentarlo o rimuoverli è cleanup, non parte dell'edge authoring).
6. **jjomTransformers è `utils/` non `sync/`** e fuori critical zone: aggiungere provenienza qui è sicuro, ma (Q2) non necessario.
7. **CD3 assente dal sorgente**: la validazione visiva delle due nature richiederà un progetto reale con edge view autorate; oggi l'unico banco object-as-edge vivo è nei test (`ir.test.ts`, pattern Transition), il demo runtime è vertex-only.

---

## Proposta di fasizzazione (proposta, NON decisione)

Dato lo stato reale, il taglio **per natura** è il più naturale — ma il buco condiviso #1 (renderer) va chiuso una volta sola, prima o insieme alla prima natura.

**Fase E0 — rendering IR-driven degli edge (prerequisito condiviso).** Far consumare al renderer lo stile IR già prodotto da `applyEdgeStyle` (stroke/width/dash, marker/terminazioni, `irRoutingHint`, label sempre-visibile quando l'IR lo chiede). Decidere `UnifiedEdge` esteso vs componente IR dedicato. Senza E0, E-obj ed E-ref sono invisibili nella parte "aspetto". È il lavoro che sblocca entrambe.

**Fase E-obj — object-as-edge full stack.** Parte già oltre un E1: resolver/compile/sintesi/interazione/persistenza/reattività vivi. Restano: (a) authoring panel (matching su metaclasse propria — MatchingSection allargata a EdgeViewIR + editor `edge.source/target` PathExpr + label + line + terminazioni), (b) entry-point in `ViewData`/`EnableIRPanel` (seed `edge` object-as-edge), (c) beneficio E0. Rischio critical zone: nessuno di nuovo (persistenza già landed).

**Fase E-ref — reference-as-edge.** Aggiunge il **matching su reference**, riusando compiled-view + rendering (E0) + widget di E-obj. Il resolver è già pronto (`edgeByMetaclass` + `reference` score); serve: (a) authoring del ramo reference (toggle natura, picker metaclasse-sorgente + refName [+ target opzionale se si estende il resolver]), (b) decidere il matching pre/post-lift (rischio #3), (c) SE si vuole persistere override di routing per reference-as-edge, progettare un carrier → critical zone + LIR (altrimenti routing sempre derivato, come `persistWaypoints:false`).

Ordine consigliato: **E0 → E-obj → E-ref**. Motivi: E-obj è quasi pronto e la sintesi è l'unica cosa già visibile (feedback rapido); E-ref eredita widget e rendering di E-obj e ha una dipendenza in più (carrier di persistenza / matching post-lift). La provenienza (Q2) è già gratis, quindi non pesa sull'ordine.

---

## Domande aperte per Alfonso (input al design in chat)

- **OQ-1 (renderer, prerequisito)**: E0 come? `UnifiedEdge` esteso a consumare `props.style`+marker+`irRoutingHint` (rischio: tocca anche gli edge classici M2 condivisi), oppure un componente edge IR dedicato registrato solo per gli edge con `data.irEdgeViewId`? Raccomando il componente dedicato (isola l'IR dal classic).
- **OQ-2 (matching reference-as-edge)**: object-as-edge matcha sulla metaclasse propria (confermato). Reference-as-edge oggi matcha su **metaclasse sorgente + refName** (+0.5 score). Vogliamo aggiungere il **target opzionale** alla chiave/score (`edgeByMetaclass` + refName + targetMetaclass)? E un predicate sul link? Con quale precedenza rispetto alla cascata (priority > specificità > declaration order)?
- **OQ-3 (feature set v1 condiviso)**: label center (TextSource) + stile linea (color/width/dash) + marker/terminazioni alle estremità + conditionals: confermi questo set per E0/E-obj/E-ref? La label center deve essere sempre visibile (oggi M1 solo hover)?
- **OQ-4 (Manhattan)**: la regola resta fissa (SNAP=8, sempre Manhattan) in v1, o `edge.routing` (`orthogonal/straight/curved`) diventa attivo? Oggi `irRoutingHint` è dead write.
- **OQ-5 (matching post-lift, rischio #3)**: la edge view va matchata sui capi ORIGINALI (semantici, pre-lift) o su quelli renderizzati (post-lift)? Oggi è post-lift (incoerente col matching semantico). Da fissare prima di E0.
- **OQ-6 (persistenza reference-as-edge)**: object-as-edge persiste su `DVertex.irEdgeLayout`. Per reference-as-edge accettiamo "routing sempre derivato" (nessun override persistito, come `persistWaypoints:false`), oppure progettiamo un carrier di persistenza (→ critical zone `canvasToJjom` + LIR)?
- **OQ-7 (entry-point authoring)**: come si seed una edge view? Nuovo ramo in `EnableIRPanel` (kind `edge` con toggle natura) + `ViewData.showIRTab` esteso a `edge`, evitando il ri-seed a vertex; oppure partire dalle view `isEdge` classiche (oggi escluse dal tab). Nuovo `EdgeAuthoringPanel` (raccomandato) o estensione condivisa con Vertex/Row?
- **OQ-8 (edge assorbiti)**: gli edge dei row children soppressi vengono liftati/soppressi da `decorateEdges` senza logica nuova (stato attuale). Confermi che va bene lasciarlo così anche quando l'edge stesso avrà una view IR?
- **OQ-9 (ordine di landing)**: confermi E0 → E-obj → E-ref? Alternativa: E0 + E-ref prima (se il caso d'uso Class Diagram è dominato da reference di dominio più che da oggetti reificati). Serve un banco reale (il "CD3") con edge view autorate per validare visivamente.

---

## Riferimenti

- Spec IR edge: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` §7 (`:115-144`, EdgeSpec), §6 (`:88-113`, InteractionSpec.connect), §10 (`:172-180`, fallback), §12 (`:193-197`, ReadCtx multi-hop).
- Prior art dispatch per kind: `docs/discovery/discovery_2026-07-25_row_view_dispatch.md`.
- Discovery persistenza edge sintetici: `docs/discovery/discovery_2026-07-19_persistenza_edge_sintetici.md`.
- Siti chiave: `irResolveCore.ts:44-60,116-141,256-320` (bucket/resolver), `irCompile.ts:382-428` (compile), `irEdgeViews.ts:49-72,118-257` (decoration), `UnifiedEdge.tsx:62-76,477-484,592-599` (consumer dead write), `utils/jjomTransformers.ts:426-573` (transformer), `EditorV2.tsx:121-126,967,1292-1331,1890-1963` (edgeTypes/handles/persistenza/reconnect), `canvasToJjom.ts:90-101` + `GraphDataElements.tsx:1690-1694` (persistenza object-as-edge), `ViewData.tsx:58`/`EnableIRPanel.tsx:8-11` (authoring assente).
</content>
</invoke>
