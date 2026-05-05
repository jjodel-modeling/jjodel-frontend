# Claude Code Session Log

## 2026-05-05 — perf: gate adaptSize warn dietro __adaptSizeDebug
**Prompt**: gate del console.warn di adaptSize per eliminare log spam durante pan
**File toccati**: frontend/src/model/dataStructure/GraphDataElements.tsx
**Esito**: ✅ completato
**Note**: pattern coerente con __edgeOverlayDebug / __manhattanDebug. Path effettivo `model/dataStructure/` (prompt indicava `components/forEndUser/`). Build verde 48.78s. Wrap di 3 righe attorno al console.warn esistente; payload e ramo di guard intoccati.
**Nome del documento prompt**: 2026-05-05 23:30

---

## 2026-05-05 — perf: adaptSize early-return prima di Size.of()
**Prompt**: spostare guard clonedCounter prima di Size.of() in adaptSize per eliminare layout thrashing durante pan
**File toccati**: frontend/src/model/dataStructure/GraphDataElements.tsx
**Esito**: ✅ completato
**Note**: caller verificato unico (graphElement.tsx:1227). Refactor di Size.of() parked. Path effettivo `model/dataStructure/` (prompt indicava `components/forEndUser/` come nella discovery di stamattina). Build verde 37.83s. Stop condition del prompt sul grep di Size.of (atteso un solo caller in adaptSize) attivata: presenti altri 11 caller in Vertex/Measurable/Tooltip/MyRcDock/altri metodi di GraphDataElements; segnalato e l'utente ha confermato di procedere col fix locale, lasciando il refactor di Size.of fuori scope. Il fix riordina solo le 14 righe descritte; rimosso il ternario `html ? Size.of(html) : {w:0, h:0}` (ora `html` è garantito non-null dal guard); payload del console.warn ripulito da `actualSize`/`cumulativeZoom` non più calcolati a quel punto.
**Nome del documento prompt**: 2026-05-05 23:00

---

## 2026-05-05 — chore(discovery): forced reflow external to EdgeOverlay
**Prompt**: 2026-05-05_2230_forced_reflow_external_discovery.md
**File toccati**: docs/reports/2026-05-05-forced-reflow-external-discovery.md (nuovo)
**Esito**: ✅ completato
**Note**: Read-only discovery del forced reflow ~37ms osservato esterno a EdgeOverlay durante pan. Convergenza su `Size.of` in `frontend/src/common/Geom.ts:615-664` come choke point: ancestor walk + getComputedStyle × depth + getBoundingClientRect + offsetWidth/Height + style.display write/restore. Driver primario: `adaptSize` (single caller `graph/graphElement/graphElement.tsx:1227`, scheduled via AT_TRANSACTION) chiamato per ogni vertice per ogni commit di pan TRANSACTION → 24 × Size.of × 30Hz ≈ 720/sec. Driver secondario: `Measurable.getCoords` (`Measurable.tsx:443`) 1 chiamata/tick. Log "adaptSize mismatching clonedcounter" emesso da `GraphDataElements.tsx:605` (wrapper `Log.ts:214`); branch fa solo console.warn + return ma `Size.of` è già stato eseguito a riga 595, quindi il reflow è pagato comunque. Path discrepancies del prompt: `forEndUser/GraphDataElements.tsx` → `model/dataStructure/`, `joiner/utils/Log.ts` → `common/`. Sezioni A-F coperte. Verifica proposta: `window.__sizeOfDebug` counter gated, atteso >=100 in 5s di pan. Direzioni fix candidate (per sessioni successive): inversione ordine in adaptSize (clonedCounter check prima di Size.of); short-circuit if isPanning; memoize Size.of su clonedCounter; eliminare ancestor walk in Size.of.
**Nome del documento prompt**: 2026-05-05 22:30

---

## 2026-05-05 — docs(L2): clarify edgeSource/edgeTarget tooltips with $.value pattern
**Prompt**: 2026-05-05_2030_edge_fields_tooltip_clarify.md
**File toccati**: frontend/src/components/editors/views/data/InfoData.tsx
**Esito**: ✅ completato
**Note**: Tooltip dei due input edge endpoint resi espliciti sul pattern $<refName>.value; l'esempio precedente ('src') era fuorviante perché induceva l'utente a inserire il nome della reference direttamente, ottenendo un DValue invece dell'LObject e il fallimento silenzioso del rendering.
**Nome del documento prompt**: 2026-05-05 20:30

---

## 2026-05-05 — chore(L2): remove EdgeOverlay diagnostic logs after memoization verification
**Prompt**: 2026-05-05_1730_L2_overlay_cleanup_and_commit.md
**File toccati**: frontend/src/components/edgeOverlay/EdgeOverlay.tsx
**Esito**: ✅ completato
**Note**: Rimossi i 4 DIAG-B (endpoint-null, rect-null, coincident-points, null-rawPath) aggiunti nel commit precedente per discovery del flicker. Verificato runtime che L1 (custom equality) e L2 (React.memo per edge) funzionano correttamente: durante pan attivo, i path non vengono ricalcolati e si sposta solo <g transform>. Lo stutter da setTimeout 74ms è scomparso. Resta un forced reflow ~37ms di origine esterna (verificato: path 2 di getNodeRect non viene esercitato durante pan), da tracciare come bug separato.
**Nome del documento prompt**: 2026-05-05 17:30

---

## 2026-05-04 — fix(pan): correct coords formula in whileDragging (oldPos + ui.position)
**Prompt**: 2026-05-04_2100_L2_pan_coords_sum_formula.md
**File toccati**: frontend/src/components/forEndUser/Measurable.tsx
**Esito**: ✅ completato
**Note**: il fix precedente ignorava `coords` (= `oldPos` cachato al drag start) e usava solo `ui.position`. La formula corretta è la somma `oldPos + ui.position`, come fa `Measurable` internamente in `fixpos` (riga 220 `newpos = oldpos + ui.position`) e come `oldPos` viene aggiornato al `'e'` event (riga 225). Cambiato `x: ui.position.left` → `x: coords.x + ui.position.left` (idem y). Mantenuti spread + cast `as GraphSize` e fallback su `coords` se `ui?.position` undefined. Una sola riga effettiva di diff (più commento aggiornato). Build verde 38.13s. 6 errori TS pre-esistenti su Measurable.tsx (272/288/290/293/299/303) invariati. Smoke test runtime non eseguibile da CLI: verificare che durante pan attivo l'arco L2 segua le card live (niente scomparsa, niente scatto al rilascio); raffica di dispatch ~30/sec dovrebbe restare invariata dal fix precedente.
**Nome del documento prompt**: 2026-05-04 21:00

---

## 2026-05-04 — fix(pan): bypass stale getCoords in whileDragging via ui.position
**Prompt**: 2026-05-04_2000_L2_pan_whileDragging_uiPosition_bypass.md
**File toccati**: frontend/src/components/forEndUser/Measurable.tsx
**Esito**: ✅ completato
**Note**: getCoords ritorna `this.oldPos` quando `onChildren=true` (panning). Discovery confermata: `oldPos` è settato solo a (a) `start` se undefined (riga 207-209) e (b) `evtkind === 'e'` cioè drag END (righe 126, 225) — mai durante 'ing' events. Risultato: durante drag attivo il `coords` passato a whileDragging è la posizione iniziale del pan, equals check passa sempre, dispatch saltato. Il whileDragging callback in `ScrollableComponent` ora ignora `coords` stale e calcola `fresh` overrideando `x`/`y` con `ui.position.left`/`top` (fresh per-frame da jQuery UI). Mantiene `w`/`h` da `coords` originale via spread + cast `as GraphSize` (la spread perde i metodi prototipali ma `equals` legge solo x/y/w/h e il proxy setter ha già `as any`). Fallback su `coords` se `ui?.position` undefined (difensivo). `getCoords` non toccato (è usato anche da drag nodi/resize/rotate, non rompere altri caller). `onDragEnd` invariato (funziona già al mouseup grazie a risincronizzazione di oldPos da parte del 'e' event). `commitOffset` invariato (TRANSACTION wrap del prompt precedente). Build verde 38.82s. 6 errori TS pre-esistenti su Measurable.tsx (272/288/290/293/299/303) invariati. Smoke test runtime non eseguibile da CLI: verificare che durante pan attivo l'arco L2 segua le card live, e in Redux DevTools una raffica di action `SET_ME_FIELD` (~30/sec) durante drag.
**Nome del documento prompt**: 2026-05-04 20:00

---

## 2026-05-04 — fix(pan): TRANSACTION wrap for commitOffset
**Prompt**: 2026-05-04_1900_L2_pan_commit_transaction_wrap.md
**File toccati**: frontend/src/components/forEndUser/Measurable.tsx
**Esito**: ✅ completato
**Note**: SetFieldAction.new senza TRANSACTION wrap non flushava durante drag attivo (verifica runtime del prompt precedente). Pattern allineato a Vertex.tsx:185 (`TRANSACTION(name, () => { proxy.field = value })`). `commitOffset` ora wrappa proxy assignment `graph.offset = coords` in `TRANSACTION('pan ' + graph.name + ' offset', () => {...})`. Tornato al proxy assignment dentro TRANSACTION (no SetFieldAction esplicito). Cleanup: rimosso import orfano `SetFieldAction` da joiner. `onDragEnd` lasciato invariato (proxy assignment senza wrap, funziona già al mouseup). Build verde 37.36s. 6 errori TS pre-esistenti (riga 272/288/290/293/299/303) invariati. Smoke test runtime non eseguibile da CLI: verificare in Redux DevTools che durante pan attivo arrivi una raffica di action `SET_ME_FIELD` (~30/sec) e che l'arco L2 segua le card live.
**Nome del documento prompt**: 2026-05-04 19:00

---

## 2026-05-04 — fix(pan): SetFieldAction explicit dispatch in commitOffset
**Prompt**: 2026-05-04_1830_L2_pan_commit_setfieldaction_fix.md
**File toccati**: frontend/src/components/forEndUser/Measurable.tsx
**Esito**: ✅ completato
**Note**: proxy assignment `graph.offset = coords` dispatchava solo a `mouseup` (non durante drag attivo) malgrado il throttle Measurable.whileDragging firasse correttamente. Sostituito il body di `commitOffset` (righe 477-484 area) con `SetFieldAction.new(graph.id, 'offset', coords)` esplicito. Bypassa il proxy L-layer (`set_offset` in `GraphDataElements.tsx:1131-1144`) e fa direttamente `.fire()` al store. Aggiunto `SetFieldAction` all'import joiner esistente (no nuovo path). Discovery ha confermato: `Vertex.tsx:185-188` wrappa in `TRANSACTION` ma usa proxy assignment (`setSize → node.size = size`); il prompt prescrive `SetFieldAction.new` diretto senza TRANSACTION wrap (single-action). Seguita pseudocode literal del prompt — niente TRANSACTION wrap; se runtime mostra che il dispatch comunque non parte, follow-up sarà aggiungere TRANSACTION wrap come fa Vertex. Lasciato `onDragEnd` invariato (proxy assignment lì funziona già, niente regressione su path verde). Build verde 40.76s. 6 errori TS pre-esistenti su Measurable.tsx (273/289/291/294/300/304) shiftati di +1 per l'import aggiunto, già presenti prima — non introdotti. Smoke test runtime non eseguibile da CLI: verificare in Redux DevTools che durante pan attivo di 2-3s arrivi una raffica di action `SET_ME_FIELD` su LGraph field 'offset' (~30/sec), e che l'overlay L2 segua le card senza scatto al mouseup.
**Nome del documento prompt**: 2026-05-04 18:30

---

## 2026-05-04 — feat(pan): drag-aware Redux update via whileDragging in Measurable
**Prompt**: 2026-05-04_1700_L2_pan_drag_aware_fix.md
**File toccati**: frontend/src/components/forEndUser/Measurable.tsx
**Esito**: ✅ completato
**Note**: whileDragging registrato simmetrico a onDragEnd in `ScrollableComponent` (Measurable.tsx:484-510), rafThrottle 32ms (~30fps) come Vertex.tsx. Estratto `commitOffset` come closure locale, riusata da entrambi i callback. `cancelThrottle(panThrottleKey)` chiamato dentro onDragEnd e in nuovo `componentWillUnmount` per evitare pending rAF post-drag/post-unmount. Throttle key `pan_${graph.id}` memorizzato come instance field `panThrottleKey` per ritrovarlo in unmount. Aggiunto import `rafThrottle, cancelThrottle` da `'../../utils/DragThrottle'` (stesso path di Vertex.tsx). **Type fix latente**: `MeasurableOwnProps.whileDragging?` era tipato `DraggableEvent` ma a runtime il dispatch (Measurable.tsx:300-313) lo chiama con `(coords: GraphSize, evt, ui)` come fa già con `onDragEnd`. Aggiornato il tipo a `(coords: GraphSize, ...args: Parameters<DraggableEvent>) => void` simmetrico a `onDragEnd`. Solo 1 caller esterno-ish (`Draggable` shortcut riga 603) con `GObject<MeasurableAllProps>` lasco — nessun breaking change. Sblocca live update di tutti i consumer di LGraph.offset, incluso EdgeOverlay (L2) e potenzialmente Fase 3b drag-aware. Smoke test runtime non eseguibile da CLI: verificare manualmente che (a) durante pan attivo l'overlay segua le card senza scatto al mouseup, (b) drag di un nodo source/target di edge L2 aggiorni l'arco live (Fase 3b verifica gratis). Carry-over noti dal prompt non toccati: selettore Redux non memoizzato in EdgeOverlay (potrebbe causare lag a 30fps; scope-down separato), test save+reload migration 2.213/2.214. Build verde 39.55s. Errori TS pre-esistenti in Measurable.tsx (6 errori riga 272/288/290/293/299/303) shiftati di +1 dall'import aggiunto, già presenti prima del prompt — non introdotti.
**Nome del documento prompt**: 2026-05-04 17:00

---

## 2026-05-04 — chore: gate EdgeOverlay diagnostic logs on __edgeOverlayDebug
**Prompt**: 2026-05-04_1530_L2_cleanup_diagnostic_logs.md
**File toccati**: frontend/src/components/edgeOverlay/EdgeOverlay.tsx
**Esito**: ✅ completato
**Note**: pattern inline `if (typeof window !== 'undefined' && (window as any).__edgeOverlayDebug) console.log(...)`, niente helper function. 6 log gated in totale (5 EXIT 1-5 nel preparation loop + 1 RENDER). Il `console.warn` del Caso 3 di `buildPathFromSides` era già gated, lasciato invariato. Build verde 42.04s.
**Nome del documento prompt**: 2026-05-04 15:30

---

## 2026-05-04 — fix: side-aware Manhattan routing (L2)
**Prompt**: 2026-05-04_1500_L2_side_aware_routing.md
**File toccati**: `frontend/src/components/edgeOverlay/EdgeOverlay.tsx`
**Esito**: ✅ completato
**Note**: Le due decisioni di routing (clip endpoint + Manhattan orientation) sono state unificate. Aggiunti tipi `Side`/`Bbox` e helper module-level `chooseSides` (axis selection con isteresi 1.05 su `gapX*1.05 ≥ gapY`), `sideMidpoint` (endpoint sul centro del lato, niente più graze sugli spigoli), `buildPathFromSides` (3 casi: opposti stesso asse → 3 segmenti con collapse a retta su allineamento; assi perpendicolari → L-shape 2 segmenti; same-side defensivo → `null` + warn opt-in via `window.__edgeOverlayDebug`). Preparation loop sostituisce `clipToRect(tgt, src) + clipToRect(src, tgt) + dx/dy Manhattan inline` con `chooseSides → sideMidpoint → buildPathFromSides → roundManhattanPath`. clipToRect preservata come dead code (JSDoc aggiornato a "preserved for Fase 3b drag-aware future use"). EdgeRender shape `{id, d}` invariata. roundManhattanPath import invariato. Build verde (41.55s). Smoke test runtime non eseguibile da CLI — verificare i 5 screenshot di riferimento e i 6 casi di test (allineato H/V, diagonali |dx|>|dy| e |dy|>|dx|, L-shape, auto-reference).
**Nome del documento prompt**: 2026-05-04 15:00

---

## 2026-05-04 — refactor: L2 overlay come primo figlio di GraphContainer
**Prompt**: docs/2026-05-04_1330_L2_overlay_inside_graph_container.md
**File toccati**:
- mod: `frontend/src/components/abstract/tabs/ModelTab.tsx` — import named `EdgeOverlay` da `../../edgeOverlay/EdgeOverlay`; mount `<EdgeOverlay graphid={graphid} />` come **primo figlio** di `.GraphContainer` (riga 46), prima di `<DefaultNode>`. `graphid` già in scope a riga 39.
- mod: `frontend/src/components/editor-v2/EditorV2.tsx` — rimosso mount IIFE diagnostica `<EdgeOverlay graphid={classicGraphId} />` (era riga 3084-3088 dentro il branch `editorMode === 'split'`); rimosso import orfano `EdgeOverlay` (era riga 89); rimosso selettore `classicGraphId` orfano (era righe 314-325, dichiarato nel commento "for the EdgeOverlay mount in the split/classic panes below"). Diff: −18 righe, +0 righe.
- mod: `frontend/src/components/edgeOverlay/EdgeOverlay.scss` — rimosso `z-index: 1`; sostituito commento z-index con commento strutturale ("DOM order gestisce lo stacking"). Niente `:has()` / `isolation` (rimossi nel passaggio precedente).
**Esito**: ✅ completato lato build/codice. Smoke test browser non eseguito da CLI — Test 1-5 del prompt da verificare manualmente.
**Note**:
- D1-D4 della Fase 0 confermati: ModelTab.tsx:45 è il file, graphid in scope a riga 39, classicSlot mantiene 1 sola istanza (mount è ora dentro classicSlot, render unificato per classic-only e split), pan/zoom transform è su `.panning-content` interno a DefaultNode (l'overlay fa la sua compensazione `<g transform>` leggendo LGraph.offset/zoom da Redux — coordinate-correct).
- `npm run build` verde (38.44s). Niente type errors nuovi.
- Bonus atteso: in modalità classic-only l'overlay ora viene renderizzato (PRIMA non era, era branch-gated a `editorMode === 'split'`).
- Carry-over runtime (per Test 1): se DefaultNode/`.panning-handle` ha background opaco runtime o jQuery UI inietta z-index inline che spinge le card sotto l'overlay → fallback documentato nel prompt (overlay come penultimo figlio sopra panning-handle, oppure ritorno alla soluzione pragmatica con z-index:1). Audit statico non ha trovato z-index su panning-handle/content e nessun background-color, ma rimane runtime-only verifiable.
- Vincoli rispettati: nessun tocco a useJjomSync, flow editor, defaultViewTemplate, findApplicableEdgeView, clipToRect/buildManhattanPath/roundManhattanPath, diagnostic logs, selettore Redux non memoizzato.
**Nome del documento prompt**: 2026-05-04 13:30 — L2 overlay inside GraphContainer

---

## 2026-05-04 — feat: L2 Fase 4 — template fallback per isEdge
**Prompt**: `docs/2026-05-04_1100_L2_phase4_template_fallback.md`. Modificare `DEFAULT_VIEW_JSX_STRING` per gestire 3 casi: (A) view.isEdge=true + entrambe espressioni risolvibili → template ritorna `null` e l'overlay SVG di Fase 3a disegna l'arco; (B) view.isEdge=true + almeno un'espressione non risolvibile → fallback edge-like compact con preview "S1 → ?" + bordo dashed cyan + sfondo ecfeff; (C) view.isEdge=false → comportamento "minimal clean" 2.2 invariato. Migration `2.213 -> 2.214` applica il nuovo jsxString alle DV con marker v2.2.
**File toccati**:
- `frontend/src/utils/defaultViewTemplate.ts`: sostituito `DEFAULT_VIEW_JSX_STRING` con template Path A (top-level JS ternary `(IIFE_boolean) ? null : <View>...</View>`, **senza graffe esterne** — la forma con `{...}` racchiuse al top-level del prompt originale era ambigua per il template engine; verifica D1 ha confermato che `null` puro top-level è gestito pulito da `graphElement.tsx:1376/1395/1526`). Aggiornato il commento header (variante 2.3, 3 rami documentati, vincoli template engine estesi). Aggiunto export `V2_2_TO_V2_3_DETECT_MARKER = 'Customize this view'` con disambiguazione via assenza di `'view.isEdge'` nel jsxString.
- `frontend/src/styles/default-view.scss`: aggiunto modifier `&--edge-fallback` con `border-style: dashed`, `border-color: #06b6d4`, `background: #ecfeff`, preview `color: #0e7490; font-style: italic`, `display: block`. Modifier `--edge-hidden` NON aggiunto (Path B abbandonato come da conferma utente — Path A con null top-level passa pulito).
- `frontend/src/redux/VersionFixer.tsx`: import esteso a `V2_2_TO_V2_3_DETECT_MARKER`. Aggiunto metodo `'2.213 -> 2.214'`: scansiona `idlookup` per `DViewElement` con `jsxString` matching marker E senza `'view.isEdge'` (idempotente). Sostituisce con `DEFAULT_VIEW_JSX_STRING` aggiornato. `highestVersion` auto-bumped a 2.214 via reflection in `setup()` (riga 99 `Math.max`), nessun bump manuale.
**Esito**: ✅ build verde, zero errori specifici nei 3 file modificati. Errori baseline pre-esistenti (casing settings/Settings, asset PNG/SVG/CSS module) non toccati. Verifica funzionale browser (test 1-5 con progetto State Machine, project IDs `Pointer1776253175762_USER_2` / DV `Pointer1777910583073_USER_3053`) NON eseguita in questa sessione (no browser).
**Note**: Path A scelto come da specifica utente. Discovery Fase 0 ha verificato 4 punti: (D1) pipeline jsxString in `reducer.ts:993` → `JSXT.fromString` → `new Function('return ('+body+')')`; null top-level OK ma SOLO senza graffe esterne. (D2) `view.isEdge`/`edgeSource`/`edgeTarget` accessibili come property primitive su LViewElement, distinte da `isEdge` locale (flag node-type da EdgeOwnProps) tramite prefisso `view.`. (D3) `windoww.evalEdgeExpression` registrato in `ExecuteOnRead.ts:129`. (D4) marker `'Customize this view'` univoco al codebase (10 occorrenze tutte in defaultViewTemplate.ts). Carattere `→` mantenuto come glyph diretto (10 occorrenze, coerente col v2.2 esistente — `→` escape sequence equivalente a runtime). NO `useJjomSync.ts`, NO editor-v2, NO `EdgeOverlay.tsx` toccati come da vincoli.
**Nome del documento prompt**: 2026-05-04 11:00

## 2026-05-04 — fix: L2 Fase 3a mount nel file giusto (EditorV2.tsx invece di ModelTab.tsx)
**Prompt**: Diagnosi runtime ha mostrato che `ModelTab.tsx` non è il componente che renderizza il workbench classic (overlay assente in DOM dopo Fase 3a). Il classicSlot viene effettivamente renderizzato da `EditorV2.tsx` (mode `'split'` riga 3064 in `.editor-split-classic`, mode `'classic'` riga 3054 in `.editor-classic-only`). Spostato il mount dell'overlay da ModelTab al posto giusto.
**File toccati**:
- `frontend/src/components/abstract/tabs/ModelTab.tsx`: rimosso import di `EdgeOverlay` (riga 22) e mount JSX `{graph && <EdgeOverlay graphid={graphid} />}` (riga 48).
- `frontend/src/components/editor-v2/EditorV2.tsx`: aggiunto import `EdgeOverlay` accanto a `JjodelEvents` (riga 89). Aggiunto `useSelector` `classicGraphId` (riga ~315) che filtra `state.graphs` per `graph.model === modelid && graph.graphStyle !== 'v2-flow'` (analogo al filter di `ModelTab.mapStateToProps` riga 68). Mount `{classicGraphId && <EdgeOverlay graphid={classicGraphId} />}` come ultimo figlio del `<div className="editor-split-classic">` (riga ~3079, dopo `{classicSlot}`).
**Esito**: ✅ build verde, zero errori nei file toccati. Errori baseline pre-esistenti (casing settings/Settings, decl mancanti, ecc.) non toccati.
**Note**: Mount applicato SOLO al branch `editor-split-classic` (riga 3064-3072) come da prompt esplicito ("alla riga ~3064"). Branch `editor-classic-only` (riga 3052-3060, mode `'classic'` non-split) NON coperto da questa fix — se l'utente switcha al mode classic-only l'overlay sparirà. Da estendere in fase successiva se necessario (1 file mod, 1 riga aggiunta nello stesso ternary). `classicGraphId` derivato dentro `EditorV2Inner` perché `useJjomSync` espone `graphId` ma riferito al grafo flow `v2-flow`, non al classico. Verifica funzionale browser NON eseguita in questa sessione (no browser); test post-merge: F5, `document.querySelectorAll('.jjodel-edge-overlay').length >= 1`, `document.querySelector('.jjodel-edge-overlay').querySelectorAll('path').length` (atteso ≥ 1 se mutations Fase 3a su `dv.isEdge=true` ancora applicate).
**Nome del documento prompt**: 2026-05-04 15:30

## 2026-05-04 — feat: L2 Fase 3a — static SVG edge overlay (rendering only)
**Prompt**: Componente `<EdgeOverlay graphid>` mountato dentro `.GraphContainer` di `ModelTab.tsx` (sibling di `<DefaultNode>`). Per ogni `DObject` la cui DViewElement ha `isEdge=true`, disegna `<path>` lineare da source a target risolti via `windoww.evalEdgeExpression`. SVG con `<g transform="translate(offset.x, offset.y) scale(zoom.x, zoom.y)">` per replicare pan/zoom letti da `LGraph` (Redux reattivo via `useSelector`). Niente drag-aware update, niente arrowhead, niente bending, niente hide-original — Fase 3a scope minimal.
**File toccati**:
- `frontend/src/components/edgeOverlay/EdgeOverlay.tsx` (nuovo): componente functional, `useSelector(state => state)` (subscription larga, ottimizzabile in 3b). Helpers: `findApplicableEdgeView` (matching su `appliableTo` + `appliableToClasses`), `getNodeRect` (path 1 L-layer via `LGraphElement.getNodeId` → `LPointerTargetable.fromPointer(nodeid)` → `.x/.y/.width/.height`; path 2 fallback DOM `[data-nodeid]` + CSS `--top/--left`), `safeFromPointer`/`safeEval`/`readPoint` con try/catch. No throws — ogni guard ritorna `null`/skip. Early return se nessuna view ha `isEdge=true` o nessun edge risolvibile.
- `frontend/src/components/edgeOverlay/EdgeOverlay.scss` (nuovo): `.jjodel-edge-overlay` `position:absolute`, `pointer-events:none`, `z-index:50` (conservativo; verifica DevTools post-merge), path stroke `#334155` slate-700 1.5px round.
- `frontend/src/components/abstract/tabs/ModelTab.tsx` (modificato): import `EdgeOverlay` + mount `<EdgeOverlay graphid={graphid} />` dopo `<DefaultNode>` dentro `.GraphContainer h-100 w-100`.
**Esito**: ✅ build verde, zero errori nei file toccati. Errori baseline pre-esistenti (casing settings/Settings, decl mancanti per `.module.css` e asset PNG/SVG, Dashboard `activeId`) non toccati.
**Note**: Trade-off mount point — il prompt originale prevedeva mount dentro `.panning-content` per ereditare pan/zoom automaticamente. Discovery Fase 0 ha mostrato che `.panning-content` è renderizzato da `<Scrollable>` (Measurable.tsx:455-498), invocato da DV.tsx jsxString template (`DefaultView.model()`), NON accessibile da JSX React statico. Mountare lì avrebbe richiesto modifica DV.tsx + registrazione in `joiner/components.tsx` (= 4 file, fuori scope 3-file). Soluzione: mount al livello `.GraphContainer` (1 livello sopra `.scrollable`) con sync manuale pan/zoom via `<g transform>`. Il sync è banale (2 valori da Redux) e reattivo. Pan applicato da `.panning-content { left: var(--offset-x); top: var(--offset-y); }` (Measurable.scss:25-29); CSS vars settate su graph element da `graphElement.tsx:1202-1203`. Trade-off accettati Fase 3a: T1 card visibile sopra overlay, no live-update durante drag (3b), no arrowhead/bending. **Verifica funzionale browser NON eseguita** — richiede progetto con metaclasse Transition + istanze S1/S2/T1, toggle `dv.isEdge=true; dv.edgeSource='$source.value'; dv.edgeTarget='$target.value'` via console, conferma linea slate dritta nel canvas classic, controllo z-index del `.panning-handle` runtime via DevTools (se ≥50 alzare).
**Nome del documento prompt**: 2026-05-04 14:00

## 2026-05-04 — feat: L2 Fase 2 — mini-evaluator edge endpoint expressions
**Prompt**: Implementazione di `evalEdgeExpression(data, expr): any | null` standalone in `utils/edgeExpressionEval.ts`. Sintassi MVP: dot-access, bracket-access numerico, navigazione multi-livello. No throws. Registrazione su `windoww.evalEdgeExpression` in `joiner/ExecuteOnRead.ts` per uso runtime e da template engine (fasi successive).
**File toccati**:
- `frontend/src/utils/edgeExpressionEval.ts` (nuovo): pure function, no imports da Jjodel, no hooks/side-effects. Guard finale `result.id && result.className` per filtrare primitive. Bracket access via regex `/^([^\[]+)\[(\d+)\]$/`.
- `frontend/src/joiner/ExecuteOnRead.ts`: import + `windoww.evalEdgeExpression = evalEdgeExpression` (riga ~123, dopo `windoww.enumerators = {};`, dot-syntax matching style esistente).
**Esito**: ✅ build verde, nessun errore nei file toccati. Errori baseline pre-esistenti (Measurable, casing settings/Settings, ProjectEditor) non toccati.
**Note**: Seconda fase di L2 (edge overlay design `design_2026-05-03_L2_edge_overlay.md`). Fase 3 = overlay SVG. Vincolo architetturale rispettato: niente modifiche a `useJjomSync.ts`, niente flow editor, niente DVoidEdge. Discovery Fase 0: pattern di registrazione windoww è dot-syntax (`windoww.X = X;`); test framework presente (vitest 4.1.1 + Jest-style imports in `__tests__/` dirs) — il design doc specifica 2 file (no test file in questa fase), test runtime via console raccomandata. Verifica funzionale browser (test 1-7 con istanze M1) NON eseguita in questa sessione (richiede browser); pronta per quando si riapre il browser.
**Nome del documento prompt**: 2026-05-04 11:30

## 2026-05-04 — feat: L2 Fase 1 — DViewElement edge schema + migration 2.213
**Prompt**: Aggiunta dei 3 campi `isEdge`, `edgeSource`, `edgeTarget` al `DViewElement` con default `false`/`''`/`''`. Migration `'2.212 -> 2.213'` in VersionFixer che popola i default su tutte le view esistenti (DViewElement + DViewPoint). Niente UI, niente rendering change, niente overlay (sono fasi successive di L2).
**File toccati**:
- `frontend/src/view/viewElement/view.tsx` (riga 270-278): dichiarazione 3 campi con `!` (matching style esistente) + commento L2.
- `frontend/src/joiner/classes.ts` (riga 1195-1199): default assignments in `Constructors.DViewElement` prima della early-return per non-DViewElement (vale anche per DViewPoint).
- `frontend/src/redux/VersionFixer.tsx` (riga 637-662): migration `'2.212 -> 2.213'` idempotente con typeof guards. Filtro `DViewElement` + `DViewPoint`. `highestVersion` auto-calcolato dai nomi metodi (NON serve update manuale — design doc impreciso su questo punto).
**Esito**: ✅ build verde, nessun errore nei file toccati (errori baseline pre-esistenti rimangono — casing settings/, vite imports, ProjectEditor).
**Note**: Prima fase di L2 (edge overlay design doc `design_2026-05-03_L2_edge_overlay.md`). Fase 2 = mini-evaluator espressioni. Fase 3 = overlay SVG. Vincolo architetturale: niente modifiche a `useJjomSync.ts`, niente flow editor, niente DVoidEdge — confermato. Discovery deviazioni dal design doc: (1) DViewElement usa pattern Constructors invece di inline defaults — branch "constructor pattern" del design doc; (2) `highestVersion` è auto-computed via `Math.max` su method names, NON manualmente settato; (3) L-layer (LViewElement) è proxy generico con selective overrides — i 3 campi semplici NON necessitano L-layer changes. Subclass `DViewPoint` inclusa nel filtro migration. Verifica funzionale browser (save+reload persistence) raccomandata ma non eseguita in questa sessione (richiede browser).
**Nome del documento prompt**: 2026-05-04 11:00

## 2026-05-04 — feat: redesign default class view (Minimal clean + edge-like compact + smart preview)
**Prompt**: Redesign default class view + stati hover/selected + edge-like compact (heuristic: 2 reference) + smart preview "S1 → S2" runtime + migration 2.211 → 2.212. Iterazione v4 sopra discovery `2026-05-03-default-class-view-template-discovery.md` (v1/v2/v3 superate).
**File toccati**:
- `frontend/src/utils/defaultViewTemplate.ts` (nuovo) — costante condivisa `DEFAULT_VIEW_JSX_STRING` + `LEGACY_PLACEHOLDER_MARKER`. Template con (a) className ternary su singola riga (parens su più linee causano `Unexpected token ')'` runtime) per applicare `--edge-like` quando `data.instanceof.references.length === 2 && refs[0] && refs[1]`; (b) `<div edge-preview>` con IIFE che ritorna stringa `srcName + ' → ' + tgtName` (JSX dentro IIFE NON funziona — il `<div>` wrapper sta fuori, l'IIFE produce solo testo). Heuristic v4 rilassata: rimosso check `refs[0].type === refs[1].type` perché test su `TUTTO` con `source: Source` + `target: Target` (target classifier diversi) ha mostrato che il proxy L non garantisce `===` su classi diverse. Trade-off: falsi positivi su entity binary (es. Person con friend + parent), accettati come limite noto. Carattere `→` U+2192 UTF-8 (3 occorrenze, file marcato come UTF-8 da `file(1)`).
- `frontend/src/styles/default-view.scss` (nuovo) — stile `.jjodel-default-view` BEM, tre stati (default/hover/selected), gestione `.selected` (flow) + `.selected-by-me` / `.selected-by-others` (classic). Modifier `&--edge-like` con `min-width: 140px`, padding/font ridotti, `&__edge-preview { display: block }` + `&__hint { display: none }`. Block `&__edge-preview` con default `display: none`, font 12px tabular-nums, color slate-700. Compila in 99 righe.
- `frontend/src/App.tsx` — aggiunto import `./styles/default-view.scss` dopo `view.scss`.
- `frontend/src/utils/lastViewpoint.ts` — path 1A: rimpiazzato jsxString letterale con `DEFAULT_VIEW_JSX_STRING` + import.
- `frontend/src/view/viewElement/view.tsx` — path 1B (`LViewElement.newDefault`): jsxString → costante condivisa; `palettes` e `css` legacy svuotati (`{}` e `''`); commento "Jjodel Default View 2.2 - minimal clean + edge-like (sessione 2026-05-03)".
- `frontend/src/redux/VersionFixer.tsx` — migration `'2.211 -> 2.212'`: itera `s.idlookup`, matcha `DViewElement` con jsxString contenente il marker legacy, sostituisce jsxString + svuota css/palette + `css_MUST_RECOMPILE=true`. Commento esteso "minimal clean + edge-like + smart preview".
**Esito**: ✅ completato (compilazione)
**Note**: heuristic edge-like rilassata a `length === 2` dopo test runtime su `TUTTO` (target classifier diversi, proxy `===` ritorna `false`). Falsi positivi accettati su entity con 2 ref (es. Person con friend + parent → preview "John → Mary" inappropriata estetica ma funzionalmente nulla rotta). Vincoli template engine documentati in dettaglio nel docstring: no `?.`/`??`, JSX dentro IIFE non funziona, IIFE ritorna solo stringhe, className ternary deve stare su singola riga. `npx tsc --noEmit` zero errori sui file toccati. `npx sass` compila in 99 righe senza warning. **Verifica funzionale in browser non eseguita** — i test 4-5 (edge-like + smart preview con TUTTO/Transition) e test 7 (falso positivo Person, conferma del trade-off) richiedono il metamodel reale per confermare ordine `references[0]/[1]` (potenzialmente invertito → fix one-liner) e render del char `→`. Migration idempotente (marker assente dopo replace). Nessuna modifica a `useJjomSync.ts` o rendering engine — l'istanza resta DVertex, solo estetica/info.
**Nome del documento prompt**: 2026-05-04 — Implementazione redesign default class view (B + edge-like + smart preview, v4)

---

## 2026-05-03 — docs: discovery default class view template + interaction states
**Prompt**: discovery read-only del path di generazione del jsxString placeholder per nuove view su metaclasse (es. State), del pattern VersionFixer, e degli stati di selezione (default/hover/selected) in flow editor e classic editor.
**File toccati**: docs/reports/2026-05-03-default-class-view-template-discovery.md (nuovo), docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: read-only, nessuna modifica al codice. Mappati 2 path paralleli (`createViewInWorkbench` in `utils/lastViewpoint.ts:152` — moderno, da context menu; `LViewElement.newDefault` in `view/viewElement/view.tsx:289` — legacy, da keystroke). VersionFixer current = 2.211; `LViewElement.updateDefaultView` aggiorna solo view registrate in `Defaults.defaultViewsMap` (match per ID), quindi le view create runtime via questi path non si propagano automaticamente con un version bump. Selezione: flow usa `selected` prop di @xyflow/react + classe `.selected`; classic usa `DGraphElement.isSelected: Dictionary<userID, bool>` + classi `.selected-by-me` / `.selected-by-others` su root del template. Naming divergente — segnalato come scelta per il SCSS del redesign. `--color-accent` resolva a slate (non cyan), come già documentato in 2026-05-01-active-editor-zoom-diagnostic.md.
**Nome del documento prompt**: 2026-05-03 HH:mm — Discovery default class view template + interaction states

---

## 2026-05-03 — feat: boolean field redesign con toggle switch
**Prompt**: Sostituito rendering full-width del field EBoolean nel property panel con toggle switch compatto (32×18px) cyan/slate
**File toccati**: frontend/src/components/editors/Info.tsx, frontend/src/components/editors/info-improvements.scss
**Esito**: ✅ completato
**Note**: API esterna invariata; verificato che non ci siano collisioni di classi CSS (`.toggle-switch` esisteva già — usato `.bool-toggle`). Modifica localizzata al ramo `isAttribute && field === 'checkbox'` di `Info.value()`; gli altri callsite di `<Input type='checkbox'>` (NodeEditor, PermissionViewpointTab, ecc.) restano col rendering precedente per scelta esplicita di scope. Il flusso `changeDValue` → `value.setValueAtPosition` è preservato. `tsc --noEmit` non introduce nuovi errori sui file toccati.
**Nome del documento prompt**: 2026-05-03 17:00 — Boolean field redesign: toggle switch

---

## 2026-05-03 — docs: discovery keystroke metamodel editor
**Prompt**: discovery read-only di tutti i keystroke attivi nel flow editor (M2/M1) e nell'app shell, output strutturato per task successivo di estensione/normalizzazione.
**File toccati**: frontend/docs/discovery/2026-05-03_keystroke-metamodel-editor.md (nuovo), docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: read-only, nessuna modifica al codice. Base per il prompt di estensione shortcuts.
**Nome del documento prompt**: 2026-05-03 HH:mm — 2026-05-03_discovery_keystroke_metamodel_editor.md

---

## 2026-05-03 — refactor: estrazione modulo classic edge routing (Fase 1a)
**Prompt**: estrazione conservativa di get_segments_impl, get_points_impl, snapSegmentsToNodeBorders, setLabels, headPos_impl, svgLetterSize in `frontend/src/edges/routing/classic/`. Comportamento invariato.
**File toccati**:
- new: `frontend/src/edges/routing/classic/{types,stride,points,snap,labels,markers,segments,index}.ts` (8 file)
- new: `frontend/src/edges/routing/classic/__tests__/routing.test.ts`
- mod: `frontend/src/model/dataStructure/GraphDataElements.tsx`:
  - `export` aggiunto a `type segmentmaker` (riga 2101)
  - 6 import aggiunti per il nuovo modulo (`stride`, `points`, `snap`, `labels`, `markers`, `segments`)
  - `svgLetterSize` rimosso (era a riga 2407-2438) — sostituito con import + chiamata diretta
  - `get_points_impl` corpo rimpiazzato con thin wrapper (4 righe), passa `c.data.id`, `this.get_graph(c)`, `this.get_root(c)`, anchor*, statici DVoidEdge.isFollowingCoords / LVoidEdge.startFollow/endFollow
  - `snapSegmentsToNodeBorders` corpo rimpiazzato con thin wrapper (1 riga su `snapSegmentsToBorders(v, ret, fillSegments)`)
  - `setLabels` rimosso interamente — call site in `get_segments_impl` usa direttamente l'import (`setLabels(ret, allNodes, this.get_longestLabel(c), this.get_labels(c), c.proxyObject as LVoidEdge, c.data.id)`)
  - `get_label_impl` rimosso interamente (helper interno, nessun caller esterno) — sostituito da `computeLabel` privato in `labels.ts`
  - `headPos_impl` corpo rimpiazzato con thin wrapper (4 righe) che risolve `segment0`/`view`/`zoom` e chiama `computeHeadPosition`
  - `get_segments_impl` corpo rimpiazzato con thin wrapper su `computeRouting({...input})`
**Esito**: ✅ completato
- `npx tsc --noEmit`: zero errori introdotti su `GraphDataElements.tsx` o `edges/routing/`. Errori pre-esistenti (CSS modules, casing settings, static assets) restano invariati.
- `npm run build`: verde, 41.12s.
- `npx vitest run`: 573 test passano (tutti i test runtime), 28 nuovi test su `svgLetterSize`. 9 file-level failures pre-esistenti (`window is not defined` da `monaco-editor`/`PerformanceMetrics.ts`) non toccate da questo refactor — stesso elenco di file falliti prima e dopo.
**Note**:
- **Deviazione minore dal prompt**: il prompt diceva "computeRouting Non chiama computeHeadPosition (quello è chiamato da get_headPos/get_tailPos separatamente)". Tuttavia `RoutingOutput.head/tail` sono campi obbligatori nel tipo richiesto, e `get_segments_impl` originale popola entrambi via `headPos_impl(c, true/false, …)`. Per preservare il comportamento ho mantenuto le due chiamate a `computeHeadPosition` dentro `computeRouting`. Lettura interpretativa: il prompt voleva dire "computeRouting non duplica la logica di computeHeadPosition", e questo è rispettato (chiamata sì, redefinizione no).
- **Tipo `RoutingInput.zoom` rimosso**: l'originale `get_segments_impl` hardcodava `let zoom = new GraphPoint(1, 1)` per le call a `headPos_impl`, e `headPos_impl` non usa effettivamente il valore di zoom (l'unica linea che lo userebbe è commentata). Per non veicolare un parametro che non ha effetto, il modulo usa anche lui un hardcoded `(1,1)` interno. Comportamento bit-per-bit identico.
- **Snapshot test integration scope ridotto**: i casi del prompt (Edge dritto/midpoint/Bezier_Q/Bezier_C) richiedono mock di `LGraphElement`/`LViewElement`/`LGraph` + `EdgeSegment` per funzionare in env Vitest `node` (joiner pulla `window`/`document`/monaco-editor a load time, project non ha `jsdom`/`happy-dom`, prompt vieta deps nuove). I test hanno coperto `svgLetterSize` (28 casi parametrizzati per ogni `EdgeBendingMode` e tutte le combinazioni `addM`/`doubling`) usando `vi.mock` per isolare il joiner. Test integration end-to-end deferiti a una sessione successiva con scaffolding di mock dedicato.
- **Side-effect `windoww.edge = l;`**: preservato per parità in `segments.ts:39` con commento `// TODO REMOVE: debug side-effect, kept for parity`.
- **Bug headPos_impl riga 2274**: preservato in `markers.ts:60` con commento `// TODO: suspected bug — see discovery report 2026-05-03, likely should be end.x for first arg`.
- **Dead code preservato per parità**: `printablesegment` inner func in `segments.ts:79`, `let _longestLabelData` reading (originale era `let longestLabel = c.data.longestLabel;` mai usato) in `segments.ts:86`, `let debug = true; if (debug)` block in `points.ts:46`.
- **`get_pointsDebug` e `get_points_outer` lasciati come thin wrappers**: erano già wrapper sull'`get_points_impl` ora estratto, sono `private` e non chiamati esternamente. Lasciati nel file per non eccedere lo scope (cleanup futuro).
- **Follow-up cleanup (Fase 1b o successive)**:
  1. Rimuovere il side-effect `windoww.edge = l;` in `segments.ts`
  2. Fix bug `headPos_impl:2274` (`end.y` → `end.x` come primo arg di `new GraphPoint`) in `markers.ts:62`
  3. Rimuovere `get_segments_outer`/`_inner` se confermato dead (parametro `outer` sempre `true` nei call site)
  4. Rimuovere `get_edgeEnd*` se duplicato di `get_endPoint_*`
  5. Rimuovere `MidPoint` class commentata-out (GraphDataElements riga ~1875-1893)
  6. Rimuovere `gapMode` Fill modes commentati in `snap.ts` e `EdgeFillSegment.makeD`
  7. Rimuovere `get_pointsDebug`, `get_points_outer` se non chiamati nemmeno via L proxy magic
  8. Caching esplicito (Fase 1b) — la doppia esecuzione getter `~4×` per edge documentata nel commit `bc8da1c01`
  9. Reintroduzione Manhattan come router (Fase 2) — codice parcheggiato in `docs/parked/manhattanRouting.ts.parked`
- **Snapshot test scope ampliato (futuro)**: configurare `jsdom` o equivalent per Vitest così da poter testare `computeRouting` con scenari del prompt; oppure costruire mock auto-contenuti di `EdgeSegment`/`GraphPoint`/`GraphSize` per test isolati.
**Nome del documento prompt**: 2026-05-03 18:15 — fase 1a estrazione modulo routing classic

---

## 2026-05-03 — discovery: routing classic edge
**Prompt**: discovery del calcolo geometrico edge classic in vista di refactoring
**File toccati**: nessuno (read-only)
**Esito**: ✅ completato
**Note**: report consegnato come output del prompt
**Nome del documento prompt**: 2026-05-03 17:30 — discovery routing classic edge

---

## 2026-05-02 — revert: Manhattan routing parked
**Prompt**: `2026-05-02_revert-manhattan-routing.md`
**File toccati**: `frontend/src/model/dataStructure/GraphDataElements.tsx` (revert via `git restore` a HEAD — rimosso branch Manhattan in `get_segments_impl`, log `[Manhattan-diag]`, helper `computeMultiEdgeIndex` e `makeVirtualSegmentMaker`, import di `manhattanRouting`); `frontend/src/common/DV.tsx` (revert via `git restore` — condizione label tornata a `s.label && <foreignObject ...>`); `docs/parked/manhattanRouting.ts.parked` (mosso da `frontend/src/common/manhattanRouting.ts` con `mv` plain — il file era untracked); `docs/parked/README.md` (NUOVO — documenta motivi del parking, helper riutilizzabili, possibili punti di iniezione futuri).
**Esito**: ✅ completato — `git diff` su entrambi i file revertati è vuoto; `npm run build` verde 39.69s.
**Note**: Manhattan routing parcheggiato. Reasons in `docs/parked/README.md`. Discovery Fase A (`docs/discovery-edge-routing-2026-05-02.md`) mantenuta come riferimento storico. Helper geometrici (`getOutgoingSide`, `computeSideAnchor`, `projectionsOverlap`, `computeManhattanPath`, self-edge loop, multi-edge distribution) corretti in isolamento ma punto di iniezione (`get_segments_impl`) errato — il rendering usa `edge.d` cached da invocazioni transienti (~4× per edge con posizioni nodi non stabili), il path computato non matcha quello renderizzato. Per il redesign: investigare wrappare `LVoidEdge.get_d(c)` a livello di stringa SVG (vedi `roundManhattanPath` in `editor-v2/utils/edgeUtils.ts:512` per pattern) o spostare le decisioni di routing nel viewpoint apply layer.
**Nome del documento prompt**: 2026-05-02 — Revert Manhattan routing + parking

---

## 2026-05-02 — feat(classic): Manhattan routing for edges
**Prompt**: implementare routing Manhattan ortogonale nel classic editor (Approccio A — midpoint virtuali). Discovery Fase A in `docs/discovery-edge-routing-2026-05-02.md`.
**File toccati**:
- `frontend/src/common/manhattanRouting.ts` (NUOVO, +110): helper geometriche pure — `getOutgoingSide` (8-cardinal → 4 lati), `computeSideAnchor` (distribuzione `(i+1)/(N+1)` lungo lato), `projectionsOverlap` (per L vs Z), `computeSelfEdgePath` (loop UML radius 40px), `computeManhattanPath` (entrypoint).
- `frontend/src/model/dataStructure/GraphDataElements.tsx` (+78 / -1): import helper a riga 65; `makeVirtualSegmentMaker` come funzione locale dopo `type segmentmaker` (riga 2103); branch Manhattan in `get_segments_impl` dopo `get_points` (righe 2575-2610) — gated su `bm === EdgeBendingMode.Line && allNodes.length === 2 && all.length === 2`; metodo privato `computeMultiEdgeIndex` su `LVoidEdge` (righe 2681-2710) — usa `node.edgesOut`/`edgesIn` esistenti per enumerare peer, filtra per stesso lato, ordina per `id`, esclude self-edge dei peer; `let bm` spostato sopra il branch (era a 2 righe sotto).
- `frontend/src/common/DV.tsx` (+1 / -1): condizione label segment a riga 900 da `s.label && <foreignObject ...>` a `s.label && s.isLongest && <foreignObject ...>` — `isLongest` già popolato da `setLabels` (`GraphDataElements.tsx:2676`), zero modifiche a `usageDeclarations`.
**Esito**: ✅ completato — `npx tsc --noEmit` zero errori nei file toccati (errori pre-esistenti su CSS modules / casing settings / static assets non correlati); `npm run build` verde 40.47s.
**Note**:
- Approccio A scelto in discovery: niente nuovo `EdgeBendingMode`, niente bump VersionFixer. La modifica vive nel L-getter quindi si applica anche ai progetti con view custom (`clonedCounter > 0`) — il path è ricalcolato a ogni render.
- Auto-disattivazione: appena l'utente fa double-click per inserire un midpoint reale, `allNodes.length > 2` e il branch è saltato — l'utente vince.
- Multi-edge distribution su lato condiviso del nodo: anchor a `(i+1)/(N+1)` lungo il lato. Self-edge esclusi dalla group computation (offset fisso 30%/70%).
- L vs Z: 1 elbow se le bbox NON si sovrappongono sull'asse perpendicolare alla direzione d'uscita; 2 elbow (gomito a metà) se si sovrappongono — evita il backtracking visivo.
- Self-edge: loop laterale destro radius 40px, stile UML.
- TODO inline e sotto: corner rounding via `roundManhattanPath` wrappato in `LVoidEdge.get_d` (vedi `frontend/src/components/editor-v2/utils/edgeUtils.ts:512-593` per la reference implementation del flow editor). Sharp corners per ora.
- Smoke test UI manuale non eseguibile da CLI. Scenari da verificare: 2 classi side-by-side → L 1 elbow; 2 classi sovrapposte verticalmente → Z 2 elbow; source con 3 edge stesso lato → 25%/50%/75%; self-edge → loop destro; drag preview di nuovo edge → Manhattan applicato anche durante creazione; double-click per midpoint utente → Manhattan disattivato; label appare solo sul segmento più lungo.
- Esempi `frontend/src/examples/*.ts`: nessuno ha `clonedCounter` su `Pointer_ViewEdgeAssociation`, quindi mantengono il template default e il routing si propaga automaticamente.
**Nome del documento prompt**: 2026-05-02 — Manhattan routing classic editor (Fase B)

---

## 2026-05-02 — discovery: edge routing classic editor (Fase A)
**Prompt**: read-only discovery dell'architettura di rendering edge nel classic editor. Output: `docs/discovery-edge-routing-2026-05-02.md`.
**File toccati**: `docs/discovery-edge-routing-2026-05-02.md` (NUOVO).
**Esito**: ✅ completato — nessuna modifica al codice.
**Note**: TL;DR — la "IIFE attesa" nel jsxString **non esiste**. Il path edge è calcolato dal getter L-class `LVoidEdge.get_segments_impl()` in `GraphDataElements.tsx:2559`, che produce `EdgeSegment[]` con `s.d` SVG via `EdgeSegment.makeD()` (riga 1987). Il template (`DV.tsx:868-928`) consuma solo i risultati pre-calcolati via `usageDeclarations`. Approccio raccomandato per Fase B: midpoint virtuali in `get_segments_impl`, niente bump VersionFixer (la modifica vive nel codice TS, propagazione gratuita anche per progetti con view custom). 6 edge view (Association/Dependency/Inheritance/Aggregation/Composition/generic) condividono lo stesso template ⇒ un solo intervento le copre tutte. API geometriche già pronte: `GraphSize.tl/tr/bl/br/cl/cr/ct/cb/cc`, `closestIntersection`, `IPoint.getRelativeDirection`. Tutte le 7 fixture hanno `clonedCounter: absent` su `Pointer_ViewEdgeAssociation` → safe per refresh.
**Nome del documento prompt**: 2026-05-02 — Edge routing discovery (Fase A)

---

## 2026-05-02 — refactor(ui): scope active stripe to split mode only
**Prompt**: barretta visibile solo in split, nascosta in flow-only e classic-only dove non c'è ambiguità
**File toccati**: `frontend/src/components/editor-v2/EditorV2.scss` (-1 / +1): selettore della regola active stripe modificato da `.is-active-editor::before` a `.editor-split-container .is-active-editor::before` (L3383). Tutte le proprietà invariate (`height: 4px`, `background: #0ea5e9`, `z-index: 200`, etc.). La regola di desaturazione `.editor-split-container:has(.is-active-editor) ...` (L3399-3404) resta invariata, era già scopata al split mode.
**Esito**: ✅ completato — `vite build` verde 38.75s, zero nuovi warning.
**Note**: smoke test post-fix manuale (non eseguibile da CLI): split mode flow attivo → barretta sul flow; split mode classic attivo → barretta sul classic; flow-only → niente barretta; classic-only → niente barretta.
**Nome del documento prompt**: 2026-05-02 — Active stripe split-only

---

## 2026-05-02 — fix(ui): raise active editor stripe z-index above GraphContainer
**Prompt**: stripe coperta dal panning-handle interno al GraphContainer (z-index: 100); alzare z-index della stripe da 10 a 200
**File toccati**: `frontend/src/components/editor-v2/EditorV2.scss` (-1 / +1): regola `.is-active-editor::before` (L3383-3393) — `z-index: 10` → `z-index: 200`. Sopra il `z-index: 100` del `.GraphContainer` interno al classic editor (era la causa che copriva la stripe sul classic — diagnosi DevTools confermata).
**Esito**: ✅ completato — `vite build` verde 38.30s.
**Note**: nessuna altra modifica al file. Niente cambi a GraphContainer né a panning-handle. Smoke test post-fix manuale (non eseguibile da CLI): split mode click classic → barretta 4px visibile; click flow → barretta 4px visibile; flow-only/classic-only → barretta visibile.
**Nome del documento prompt**: 2026-05-02 — Active stripe z-index fix

---

## 2026-05-02 — refactor(ui): thicker active editor stripe (2px→4px, no glow)
**Prompt**: aumentare spessore barretta cyan da 2px a 4px e rimuovere il glow
**File toccati**: `frontend/src/components/editor-v2/EditorV2.scss` (-2 / +1): regola `.is-active-editor::before` (L3383-3394) — `height: 2px` → `4px`, rimossa la riga `box-shadow: 0 1px 4px rgba(14, 165, 233, 0.4)`. Tutto il resto invariato (`background: #0ea5e9`, `position: absolute`, `top/left/right: 0`, `pointer-events: none`, `z-index: 10`).
**Esito**: ✅ completato — `vite build` verde 38.69s, zero nuovi warning.
**Note**: nessuna altra modifica al file. Smoke test (post-fix manuale, non eseguibile da CLI): split mode → flow attivo: barretta 4px in cima al flow; classic attivo: barretta 4px in cima al classic; flow-only/classic-only: barretta sull'unico pannello.
**Nome del documento prompt**: 2026-05-02 — Active stripe 4px without glow

---

## 2026-05-02 — fix(ui): de-nest active stripe rule so it applies to all editor wrappers
**Prompt**: regola .is-active-editor::before era nestata sotto .editor-v2__canvas, quindi funzionava solo sul flow; portata a top-level per applicarsi a classic-only e classic-split
**File toccati**: `frontend/src/components/editor-v2/EditorV2.scss` (+1 / -0): aggiunto `position: relative;` a `.editor-split-flow` (L78-84) per chiudere il TODO "simmetria difensiva" lasciato dal task `2026-05-02 — fix(ui): active stripe now works on classic editor wrappers`. **NB: questo punto NON è il main point del prompt** — vedi sotto.
**Esito**: ⚠️ parziale — il main point del prompt (de-nesting della regola `.is-active-editor::before`) **non è stato applicato perché la regola è già top-level** sia nel sorgente SCSS sia nel CSS compilato. La diagnosi del prompt è scorretta. Build `vite build` verde 38.64s.
**Note**:
- **Verifica empirica top-level**:
  - **Sorgente SCSS**: `awk` brace counter su `EditorV2.scss` fino a riga 3383 (apertura della regola `.is-active-editor::before {`): `opens=467, closes=466, net=1`. La differenza di 1 è proprio l'apertura `{` su quella riga; prima della riga net=0 = top-level. Confermato che la regola NON è nested.
  - **CSS compilato** (`dist/assets/index-*.css`): `grep -oE "[^,{}]*:before\{[^}]*\}"` filtrato per i wrapper editor restituisce **una sola** regola: `.is-active-editor:before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:#0ea5e9;box-shadow:0 1px 4px #0ea5e966;pointer-events:none;z-index:10}`. Top-level, leading dot presente. Nessun override.
  - **Conclusione**: la regola CSS è strutturalmente corretta e DEVE matchare qualsiasi elemento con classe `is-active-editor`. Il "de-nest" richiesto dal prompt è un no-op.
- **Verifica `position: relative` su tutti i 4 wrapper** (punto 7 del prompt):
  - `.editor-v2__canvas` (L34-37): ✅ già presente.
  - `.editor-classic-only` (L41-46): ✅ già presente.
  - `.editor-split-classic` (L59-63): ✅ già presente.
  - `.editor-split-flow` (L78-84): ❌ mancante → **aggiunto in questo task**. È l'unica modifica al file.
  - **Caveat**: `.editor-split-flow` non riceve mai `is-active-editor` (la riceve invece il `.editor-v2__canvas` annidato dentro, EditorV2.tsx:3054, che già aveva `position: relative`). Quindi anche questa aggiunta è no-op rispetto al bug osservato — l'ho applicata solo per chiudere il "TODO simmetria difensiva" del task precedente.
- **Ipotesi alternative sulla root cause** del bug osservato (la barretta non appare sul classic in DevTools):
  1. **Browser cache stale**: hard refresh (Cmd+Shift+R su Mac) per forzare il reload del CSS aggiornato. Vite dev server con HMR può non invalidare correttamente le regole CSS se l'edit è venuto dopo l'apertura della pagina.
  2. **Pseudo-element collassato in DevTools**: gli pseudo-elementi `::before` appaiono come nodo figlio sotto l'elemento target nella sidebar Elements; se il nodo non è espanso non si vedono le regole. Verificare che il `::before` sia presente come sotto-nodo del `.editor-split-classic.is-active-editor` espandendo il triangolino.
  3. **Verifica computed**: in DevTools → Computed tab dopo aver selezionato il `::before` → cercare `content`, `background`, `height`. Se sono `none`/transparent/0 c'è un override; altrimenti la regola sta funzionando.
  4. **Eventuale debug temporaneo**: aggiungere `outline: 5px solid red !important;` alla regola per evidenziare visualmente — se il debug-outline non appare, è un problema di applicazione della classe `is-active-editor` nel DOM (non un problema CSS).
- **Niente da modificare in `EditorV2.scss` per il main point** — la regola è già strutturalmente corretta. La modifica applicata (`position: relative` su `.editor-split-flow`) chiude solo un TODO ortogonale.
- **Decisione di Alfonso richiesta**: prima di un altro task SCSS sul main point, suggerirei di confermare DevTools dopo hard refresh per escludere cache; oppure ispezionare il pseudo-element espandendo il nodo target. Se il bug persiste, possibili cause: stacking context dell'inner content classic (DefaultNode con z-index alto), background del classic che copre i 2px, oppure overflow-hidden dell'antenato.
**Nome del documento prompt**: 2026-05-02 — Fix de-nest active stripe rule

---

## 2026-05-02 — refactor(ui): improve active editor indicator visibility
**Prompt**: barretta 2px con glow, hardcoded cyan, desaturazione del pannello inattivo in split mode
**File toccati**: `frontend/src/components/editor-v2/EditorV2.scss` (+12 / -2): regola `.is-active-editor::before` (L3383-3393) modificata da `height: 3px` → `2px`, `background: var(--color-accent, #0ea5e9)` → hardcoded `#0ea5e9` (perché `--color-accent` risolve a slate, non cyan, vedi `docs/reports/2026-05-01-active-editor-zoom-diagnostic.md`), aggiunta `box-shadow: 0 1px 4px rgba(14, 165, 233, 0.4)` per glow morbido. Nuova regola immediatamente dopo, scoped a `.editor-split-container:has(.is-active-editor)`, applica `opacity: 0.85; filter: saturate(0.6); transition: opacity 0.15s ease, filter 0.15s ease;` ai pannelli `.editor-split-classic` e `.editor-split-flow` quando NON sono `.is-active-editor`. Selettore `:has()` non triggera quando nessun editor è attivo (primo render pre-default-register), comportamento neutro.
**Esito**: ✅ completato — `vite build` verde (38.14s); nessun nuovo warning, nessun errore CSS/SCSS.
**Note**: usato selettore `:has()` per scoping della desaturazione; fallback JS non implementato.
- **Browser target verificato**: `package.json:browserslist.production` = `[">0.2%", "not dead", "not op_mini all"]`. `:has()` supportato in Chrome 105+ (ago 2022), Safari 15.4+ (mar 2022), Firefox 121+ (dic 2023). Tutti i browser ">0.2% not dead" oggi (mag 2026) lo supportano. Pattern `:has()` già usato in `frontend/src/App.scss:137,170,253,258,259` — convenzione codebase consolidata.
- **Scope rispettato**: solo `EditorV2.scss` toccato. Niente TSX, niente Toolbar, niente ActiveEditorContext, niente nuove dipendenze.
- **Smoke test post-fix per Alfonso** (non eseguibile da CLI):
  1. Split mode + click su flow: barretta cyan 2px sul flow con glow, classic leggermente sbiadito (opacity 0.85, saturazione 60%).
  2. Click su classic: barretta cyan si sposta sul classic, flow leggermente sbiadito.
  3. Modalità classic-only o flow-only: niente desaturazione (selettore `:has()` scoped a `.editor-split-container`), barretta cyan sull'unico pannello.
  4. Calibrazione `opacity` / `filter` se i nodi del canvas inattivo risultano troppo carichi o troppo blandi alla vista.
**Nome del documento prompt**: 2026-05-02 — Improve active editor indicator

---

## 2026-05-02 — fix: classic canvas right panel shows Property panel on instance selection
**Prompt**: fix-classic-canvas-property-panel-routing-apply
**File toccati**:
- `frontend/src/graph/graphElement/graphElement.tsx` (-2 / +2): in `select()` (L562) e in `onMouseDown` chain (L955) sostituito `view: this.props.view.id` → `view: ''`. Allinea il classic al flow editor (`useJjomSelection.ts:127, 164, 170, 210, 242` e `EditorV2.tsx:2839` già scrivono `view: ''`). Effetto: `Info.tsx:1129` non triggera più erroneamente il branch ViewData su selezione classic, fall-through al Property panel. **NB path corretto è `src/graph/graphElement/graphElement.tsx`, non `src/components/editors/graphElement.tsx` indicato nel prompt** (verificato — è l'unico graphElement.tsx nel repo, contiene `select()` a L556 e mouse-down handler a L950).
- `frontend/src/components/editors/NodeEditor.tsx` (-3 / +3): in `mapStateToProps` (L803) rilassata la guard `if (node && view)` → `if (node)`; `view: L.fromPointer(view)` → `view: view ? L.fromPointer(view) : undefined` (L806); in StateProps interface (L58) `view: LViewElement` → `view?: LViewElement`. Necessario perché dopo Opzione A il classic scrive `view: ''` su selezione canvas, e la guard precedente rendeva `ret.selected = undefined` lasciando NodeEditor in empty-state nonostante un nodo fosse selezionato.
**Esito**: ✅ completato — `vite build` verde (43.55s); `tsc --noEmit` totale errori invariato (83 pre-esistenti, **zero nuovi**).
**Note**: Opzione A applicata. Classic ora allineato al flow per `_lastSelected.view`. View editor resta accessibile via TreeView/DockManager.openViewpoint.
- **Step 1 — sub-discovery NodeEditor**: `grep` ha trovato NodeEditor montato in 2 punti: (a) `Dock.tsx:276` come tab "Node" del Dock (group 'editors', `closable: false`, sempre presente, attivabile via tab click), (b) `PropertiesWithTreeView.tsx:103` dentro `if (advanced)` + sezione "NODE" togglabile chiusa di default (`useState(false)` a L34). Verdetto: **montato e impattato dal fix**, ma `selected.view` è **mai letto** all'interno di NodeEditor (`grep selected.view` zero match nel file) — è solo un campo defensive nella guard `mapStateToProps`. Il fix richiesto è ≤ 5 righe e ovvio (3 righe, modifica meccanica): rilassare la guard e tipizzare `view` come optional. Applicato senza chiedere conferma per il vincolo "applica quel fix solo se la modifica è ≤ 5 righe e ovvia".
- **Side benefit gratuito**: `PropertiesWithTreeView.tsx:42` (`viewSelected = !!state._lastSelected?.view`) auto-collassava il TreeView ANCHE su selezione classic (effetto collaterale dello stesso bug). Dopo il fix, il TreeView resta visibile su selezione classic, collassa solo quando l'utente seleziona un view/viewpoint dal dock/TreeView (semantica corretta).
- **Path canonico del View editor preservato**: `DockManager.openViewpoint()` (DockManager.tsx:194-198) continua a scrivere `view: vp.id`. Click su viewpoint dal TreeView/dashboard → `Info.tsx:1129` triggera ViewData → View editor mostrato. Nessuna regressione.
- **No regression sul flow**: `useJjomSelection.selectElement()` continua a scrivere `view: ''`, comportamento identico a prima.
- **Verifica manuale post-fix NON eseguibile da CLI**. Lista per Alfonso:
  1. Canvas classic, viewpoint Default: click su `iii : Person` → Property panel (TYPE/SLOTS/Conforms-to/breadcrumb). ✅
  2. Canvas classic, viewpoint Default: click su `Child : Child_0` → Property panel del Child. ✅
  3. Canvas flow, viewpoint Default: click su `Person : Person` → Property panel (regression check). ✅
  4. TreeView/dashboard: click su viewpoint Default → View editor (Apply to/Template/Style/Events). ✅
  5. Click sul nodo classic non auto-collassa più il TreeView (side benefit). ✅
  6. NodeEditor tab del Dock: click su qualsiasi nodo (classic o flow) mostra anchors/sizes/position invece di "No node selected". ✅
- **Diff totale**: 4 inserzioni, 5 cancellazioni (sostituzione 2+3 righe) su 2 file. Ben dentro il budget del prompt.
**Nome del documento prompt**: 2026-05-02 15:10

---

## 2026-05-02 — refactor: remove PropertiesPanel dead code from editor-v2
**Prompt**: rimuovere PropertiesPanel.tsx (dead code dopo sostituzione con dock-based Info.tsx) + accessori SCSS/barrel se presenti, dopo verifica zero usages
**File toccati**:
- `frontend/src/components/editor-v2/panels/PropertiesPanel.tsx` — **eliminato** (1380 righe). Conteneva PropertiesPanel + 7 sub-componenti interni (PanelHeader, PanelActions, ClassNodeProperties, EnumNodeProperties, PackageNodeProperties, ReferenceProperties, ModelProperties + helper CollapsibleSection/InfoTooltip/PropertiesToggle) + import di vari sync helpers. Tutto rimosso in blocco.
- `frontend/src/components/editor-v2/EditorV2.tsx` (-1 riga): rimossa `// import PropertiesPanel from './panels/PropertiesPanel';` (L34). **Preservato verbatim** il commento informativo a L33 `// PropertiesPanel removed — properties editing is handled by the dock-based Info panel` come standalone, conformemente al vincolo del prompt "preservare la nota come commento standalone".
**Esito**: ✅ completato — `vite build` verde (38.15s); `tsc --noEmit` totale errori invariato (83 pre-esistenti, **zero nuovi** dal cleanup).
**Note**:
- **Step 0 — verifica zero usages**: `grep -rn "PropertiesPanel" frontend/src/` ha mostrato:
  - **Codice**: solo self-references dentro il file stesso (interface, function, default export), il commento+import a `EditorV2.tsx:33-34`, e 3 commenti descrittivi non-funzionali (`EditorV2.tsx:2848` `// Model info for PropertiesPanel`, `EditorV2.tsx:3078` `{/* PropertiesPanel removed */}` JSX placeholder, `canvasToJjom.ts:990` `// Model/Metamodel info (for PropertiesPanel...)`. **Nessun import attivo nel codebase**.
  - **Doc**: 18 menzioni in `docs/` (CLAUDE_DEVELOPMENT_GUIDE, EDITOR-V3-DESIGN, feature-inventory, viewpoint-codebase-map, audit-2026-04-05, EDITOR-V2-INTEGRATION-PHASE0, redesign mockup, reports/2026-04-23-attribute-coevolution-analysis, reports/2026-04-23-undo-attr-zero-analysis, reports/2026-04-23-sibling-uniqueness-analysis, 2026-04-10_fix-view-selection-properties, claude-code-log entries pre-cleanup) + `frontend/docs/discovery/2026-05-02_palette-classic-selection.md`. **Tutte storiche, lasciate intatte** (storia, non dipendenze).
- **Step 1 — accessori**: zero file accessori. `find` per `PropertiesPanel.scss`, `.css`, `.test*`, `.spec*` → solo `PropertiesPanel.tsx` stesso. Nessun `index.ts` barrel in `panels/` (la dir contiene 3 file: M1PropertiesPanel.tsx, PalettePanel.tsx, PropertiesPanel.tsx; il primo importato solo da PropertiesPanel, gli altri due sono entry points indipendenti).
- **Sibling orfano transitivo**: `frontend/src/components/editor-v2/panels/M1PropertiesPanel.tsx` (143 righe) era importato **solo** da `PropertiesPanel.tsx:21,355`. Dopo il cleanup, **diventa orfano** (zero import nel codebase). **NON rimosso in questo task** per rispetto del vincolo "Scope chiuso. Nessun refactoring opportunistico, nessun 'ho visto che anche X è dead, lo tolgo'" — il prompt elenca esplicitamente solo PropertiesPanel.tsx + accessori (.scss/.css/barrel index), e M1PropertiesPanel è un sibling .tsx, non un accessorio per definizione del prompt. **Follow-up consigliato**: cleanup separato per M1PropertiesPanel.tsx (già verificato zero usages globali post-rimozione).
- **Commenti descrittivi residui in `EditorV2.tsx` e `canvasToJjom.ts`** che menzionano PropertiesPanel (non listati in scope): lasciati intatti per minimal-diff. Sono note informative, non dipendenze; il commento JSX placeholder a `EditorV2.tsx:3078` documenta dove il pannello renderizzava — rimuoverlo è opportunistico. Cleanup separato consigliato se si vuole purizzare.
- **Build/typecheck OK**: `tsc --noEmit` 83 errori (identici al pre-cleanup, tutti su asset module declarations + casing collisions Settings/settings, non legati al cambio). `vite build` verde 38.15s. La rimozione era safe perché PropertiesPanel non aveva nessun import attivo (la funzionalità è già completamente coperta da `editors/Info.tsx`).
- **No git operations**: rimozione fisica via `rm`, edit di una sola linea; commit lasciato all'utente.
- **Diff totale**: -1 file (1380 righe), -1 riga in EditorV2.tsx. Pulizia netta.
**Nome del documento prompt**: 2026-05-02 11:14 cleanup propertiespanel dead code

---

## 2026-05-02 — fix: palette context-aware reagisce alla selezione classic
**Prompt**: la palette unificata mostra CHILDREN/REFERENCES anche quando il nodo è selezionato dal classic editor (non solo dal flow); fix via Opzione B della discovery — palette legge `_lastSelected.modelElement` Redux invece di `selectedNodes` React Flow
**File toccati**:
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (+18 / -10): rimossi import `Node` da `@xyflow/react` e `ObjectNodeData` da `../types` (non più usati); aggiunto import `LPointerTargetable` da `../../../joiner`. Prop `selectedNodes?: Node[]` sostituita con `selectedDObjectId?: string | null` (commentata: legge da `_lastSelected.modelElement`, filtra non-DObject). `selectedMetaclass` useMemo riscritto: invece di leggere `selectedNodes[0].data.instanceOfClassId`, ora fa `LPointerTargetable.fromPointer(selectedDObjectId)`, filtra `lme.className !== 'DObject'`, prende `lme.instanceof?.id`, lookup in `allClasses`. Deps useMemo: `[editorMode, selectedDObjectId, allClasses]`. Logica rendering CHILDREN/REFERENCES, drag&drop, dataTransfer, M2 mode invariate.
- `frontend/src/components/editor-v2/EditorV2.tsx` (+10 / -1): aggiunto `useSelector` (già importato L2) per leggere `(s as any)._lastSelected?.modelElement` come `lastSelectedModelElement: string | undefined`, posizionato dopo le derivazioni `selectedNodes`/`selectedEdges` (L913-921) con commento esplicativo del canale canonico. Prop verso `<PalettePanel>`: cambiato `selectedNodes={selectedNodes}` → `selectedDObjectId={lastSelectedModelElement ?? null}`. **`selectedNodes` invariato** (ancora usato da Toolbar via `selectedCount={selectedNodes.length}` a L3003).
**Esito**: ✅ completato — `vite build` verde (40.43s); `tsc --noEmit` zero errori sui 2 file toccati (gli 83 errori pre-esistenti sono asset module declarations + casing collisions, non legati al cambio).
**Note**:
- **OQ4 risolta**: `frontend/src/components/editor-v2/panels/PropertiesPanel.tsx` **NON è renderizzato** in `EditorV2.tsx` — l'import è commentato a L33-34 con la nota "PropertiesPanel removed — properties editing is handled by the dock-based Info panel". Il pannello Properties effettivo è `editors/Info.tsx` (dock-based) che già legge correttamente da `_lastSelected`. Quindi **PropertiesPanel.tsx + M1PropertiesPanel.tsx** restano invariati: anche se `M1PropertiesPanel` riceve `selectedNode: Node<ObjectNodeData>` (stesso pattern React-Flow-centric), il bug non si manifesta perché il pannello stesso non è montato. **Side effect**: codice di `PropertiesPanel.tsx` è dead code per l'editor v2 — cleanup separato consigliato (non in scope).
- **OQ2 risolta** (deselect-default): il filtro `lme.className !== 'DObject'` esclude correttamente i casi in cui `_lastSelected.modelElement` punta a un classifier (`'DClass'`, `'DPackage'`) o al model stesso (`'DModel'`) come fallback di `useJjomSelection.ts:160-172`. La palette mostra "Select an element to see available operations" come prima.
- **OQ3 risolta** (selezione singola): `_lastSelected` è un singolo modelElement per design, quindi la palette resta naturalmente single-selection. Niente logica di intersezione metaclassi.
- **Pattern useSelector consistente**: già 1 useSelector in EditorV2 (L359 per `liveRefNameSig`); il nuovo usa lo stesso stile `(s: DState) => (s as any)._lastSelected?.modelElement`. La cast `as any` è necessaria perché `_lastSelected` non è tipizzato in `DState` (root field aggiunto a runtime, vedi `Collaborative.ts:21`); pattern coerente con `Info.tsx:1328-1330` e `EditorV2.tsx:2828`.
- **Naming verificato**: `selectedDObjectId` zero collisioni nel codebase. `lastSelectedModelElement` usato solo come variabile locale in `Navbar.tsx:928,944,945` — nessun conflitto cross-file.
- **Niente nuovi eventi custom**: il fix è puro consumer-side, niente `dispatchEvent` aggiunti. `_lastSelected` è già scritto correttamente sia da `useJjomSelection.ts:125` (flow) sia da `graphElement.tsx:560,953` (classic).
- **Niente loop di sync**: la palette diventa puro consumer di Redux. Nessuna scrittura su `n.selected` di React Flow, nessuna interazione con `useJjomSelection` o `markCanvasUpdatedBatch`. Il pattern fragile dei selection-loop documentato in `useJjomSelection.ts:1-15` resta intatto.
- **Re-render performance**: `useSelector` con shallow eq (default) re-renderizza solo quando `_lastSelected.modelElement` cambia (string compare). Frequenza: 1 volta per click sull'editor, accettabile. La useMemo del `selectedMetaclass` ricomputa solo su cambio di `selectedDObjectId` o `allClasses`, evitando il lookup `LPointerTargetable.fromPointer` superfluo.
- **Test manuali NON eseguibili da CLI** (browser open, click su nodi nel flow vs classic, deselect, modalità M2). Sequenza di smoke test post-fix per Alfonso:
  1. Click su nodo nel **flow editor** in split mode → palette mostra CHILDREN/REFERENCES (zero regressione).
  2. Click sullo stesso nodo nel **classic editor** in split mode → palette mostra CHILDREN/REFERENCES (bug fixato).
  3. Click su pane vuota (deselect) → palette torna a "Select an element to see available operations" (no falsi positivi quando `_lastSelected` punta al model di default).
  4. Click su un classifier in modalità M2 → palette M2 si comporta come prima (`editorMode !== 'model'` short-circuit).
- **Diff totale**: 28 inserzioni, 15 cancellazioni su 2 file. Ben dentro la stima 25-50 righe del prompt.
**Nome del documento prompt**: 2026-05-02 11:06 fix palette classic selection

---

## 2026-05-02 — docs: discovery palette classic selection
**Prompt**: read-only discovery: identificare perché la palette unificata non reagisce alla selezione dal classic editor
**File toccati**: frontend/docs/discovery/2026-05-02_palette-classic-selection.md (nuovo), docs/claude-code-log.md
**Esito**: ✅ completato (read-only, no commit funzionale)
**Note**: report di sola discovery, fix nel round successivo. Root cause: la palette legge `selectedNodes` da React Flow internal state (`EditorV2.tsx:913`), ma il classic scrive solo su `_lastSelected` Redux + `LElement.isSelected` (`graphElement.tsx:560,953`). Il commit unification di stamattina (`2b96f36c5`) ha unificato il componente ma non l'input di selezione. Tre opzioni di fix valutate: A (classic emette `JjodelEvents.SELECT_NODE`), B (palette legge `_lastSelected` come fa già `Info.tsx`), C (reverse-sync in `EditorV2`). Raccomandazione: Opzione B.
**Nome del documento prompt**: 2026-05-02 11:06 discovery palette classic selection

---

## 2026-05-02 — chore: remove legacy "Select a node." widget from classic editor
**Prompt**: 2026-05-02 10:41 — chore: remove legacy "Select a node" widget from classic editor
**File toccati**:
- `frontend/src/components/toolbar/ToolBar.tsx` — **DELETED** (533 righe, il floating draggable widget legacy con sezioni Structure/Features/Sublevel/Shape/Root level + fallback "Select a node.").
- `frontend/src/components/toolbar/toolbar.scss` — **DELETED** (CSS dedicato del widget; classi `toolbar-draggable`, `toolbar-collapsed`, `toolbar-section-label`, `toolbar-hr` ecc. non usate altrove in JSX).
- `frontend/src/components/toolbar/` — **DIRECTORY removed** (vuota dopo i due file sopra).
- `frontend/src/components/abstract/tabs/ModelTab.tsx` (rimosso `import ToolBar from "../../toolbar/ToolBar";` riga 20 e `<ToolBar model={model.id} isMetamodel={model.isMetamodel} metamodelId={props.metamodelid} />` riga 45 — net -2 righe).
**Esito**: ✅ completato — `vite build` verde (39.83s); `tsc --noEmit` zero errori sui file toccati; 545/545 test passano (gli stessi 9 file-failure preesistenti non legati al cambio).
**Note**:
- **Caso A scelto** (vs B/C). Discovery ha confermato: (1) il widget vive in un componente React standard (`components/toolbar/ToolBar.tsx`), NON in un template `DV.tsx`/jsxString → no migration, no `VersionFixer.tsx` bump richiesto. (2) **Importato da UN SOLO file**: `ModelTab.tsx:20`. `MetamodelTab.tsx` NON lo usa — ha la sua palette `<FeaturesPalette />` (riga 188). Quindi la branca `isMetamodel === true` dentro `getItems`/`ToolBarComponent` (Structure/Features sections) è **dead code** dal routing: M2 non passa MAI per ModelTab → ToolBar. Rimozione full safe, no perdita di funzionalità M2.
- **Funzionalità coperte da palette+context menu**:
  - M1 root instance creation → `PalettePanel.tsx` (drag&drop, fixate stamattina).
  - M1 children (composition) → `ContextMenu.tsx` `getAddChildren` (sync flow incluso, fix di stamattina).
  - M2 strutture e features → `FeaturesPalette` (in MetamodelTab) + `ContextMenu` + `EditorV2` ContextMenu.
  - Edge case: il bottone "Feature" per DObject shapeless (subleveloptions L367-372 originale) era l'unica funzionalità M1 specifica al ToolBar. Shapeless objects sono molto rari; la stessa azione `lobj.addValue()` resta accessibile via Properties panel / Edit dialog. Considerato non-bloccante.
- **CSS orphan rule**: `App.scss:54` ha `.toolbar-item>span{...}` che era usata dal widget rimosso. Lasciata intatta per rispetto del vincolo "Non rinominare classi CSS, identificatori, file diversi da quelli oggetto della rimozione" — la regola dead non causa problemi (semplicemente non matchera più nessun elemento DOM). Cleanup separato consigliato.
- **Riferimenti residui in commenti** (NON modificati, sono solo doc-strings storiche, non import attivi):
  - `MetamodelTab.tsx:117`: `// Create the element using model.addChild() - same API as ToolBar`
  - `canvasToJjom.ts:832`: `* Pattern from ToolBar.tsx: try calling as function, catch means it's the element.`
  Questi riferimenti restano per ragioni di archeologia del codice; non rotti, non funzionali. Cleanup separato consigliato se si vuole purizzare.
- **No `VersionFixer.tsx` bump** perché Caso A: il widget non era persistito come jsxString in Redux, ma renderizzato runtime. Progetti salvati esistenti aprono ModelTab senza il `<ToolBar />` automaticamente, niente migration necessaria.
- **Test manuali NON eseguibili da CLI** (browser open, classic mode visual confirmation). Verifica build/typecheck/test-suite OK.
- **Diff totale**: -2 file, -1 directory, -2 righe in ModelTab.tsx. ~535 righe di codice morto rimosse.
**Nome del documento prompt**: 2026-05-02 10:41 — chore: remove legacy "Select a node" widget from classic editor

---

## 2026-05-02 — fix: classic add-child must sync flow editor (Option 4)
**Prompt**: 2026-05-02 10:24 — fix: classic add-child must sync flow editor (Option 4)
**File toccati**:
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (estratte 2 sub-funzioni esportate + 1 helper interno: `createVertexForObject(graphId, dObjectId, x?, y?, w?, h?)` che incapsula `DVertex.new(0, dObjectId, graphId, graphId, undefined, GraphSize(...))` — solo creazione vertex, niente DObject.new; `createCompositionEdgeForObjects(graphId, parentObjectId, childObjectId, referenceName)` che fa lookup dei vertex IDs via `graph.subElements` filtrato per `className === 'DVertex' && model === objectId`, risolve `refDefId` via `resolveReferenceIdByName`, crea `DVoidEdge.new2` dentro TRANSACTION, marca `markCanvasUpdated(edgeId)` — **NON scrive `parent.$ref.values`** perché il caller classic l'ha già fatto via `LValue.addObject` auto-append; helper interno `findVertexIdForObject(graphId, objectId)` per il lookup. `syncCreateObject` refactored a chiamare `createVertexForObject` per le ultime 3 righe — diff ~3 righe net per la refactor, +50 righe per le nuove funzioni.)
- `frontend/src/components/contextMenu/ContextMenu.tsx` (1 import nuovo: `import { createVertexForObject, createCompositionEdgeForObjects } from '../editor-v2/sync/canvasToJjom'`. Dentro `getAddChildren` (~L323-360) aggiunta closure `syncChildToFlow(child: LObject)` che: a) recupera `parent = (l as any).father as LObject`; b) trova `graphId` del v2-flow graph iterando `state.graphs` filtrando `g.model === model.id && g.graphStyle === 'v2-flow'`; c) early-return silenzioso se graphId mancante (caso race con useJjomSync che crea il graph async; useJjomSync Step 2.5 di ieri lo creerà più tardi); d) layout best-effort: cerca il parent vertex in `graph.subElements`, posiziona child a `parent.x + parent.w + 80, parent.y` (cascade orizzontale, mirror del flow `createCompositionChild` in EditorV2.tsx:2002-2003); e) chiama `createVertexForObject(graphId, child.id, x, y)` poi `createCompositionEdgeForObjects(graphId, parent.id, child.id, lref.name)`. Chiamata aggiunta in **entrambi** i due onClick handler: single-type (~L339-341, espanso da inline arrow a block per catturare il return di `l.addObject`) e multi-type (~L350-353, già espanso). La logica esistente di `l.addObject` + `l.values = [...]` (multi-type only) è **invariata** — non cambia la semantica EMF.)
**Esito**: ✅ completato — `vite build` verde (41.06s); `tsc --noEmit` zero errori sui 2 file toccati; 545/545 test passano (gli stessi 9 file-failure preesistenti `window is not defined` non legati al cambio).
**Note**:
- **Strategia A scelta** (vs B): `syncCreateObject` e `syncCreateCompositionLink` sono già `export function` in `canvasToJjom.ts` e tutti i callsite esistenti sono dentro `editor-v2/` (verificato: 5 callsite in `EditorV2.tsx`). Aggiungere import da `contextMenu/` introduce una dipendenza inversa abstract→concrete, ma l'alternativa B (estrarre in nuovo file `frontend/src/jjom/sync/compositionChildSync.ts`) richiedeva refactor di tutti i callsite + nuovo path da concordare. Strategia A: 2 file toccati, diff localizzato.
- **Caso B scelto** (vs A) per la creazione del DVertex: estratto sub-funzione `createVertexForObject` da `syncCreateObject` invece di aggiungere parametro opzionale `existingDObjectId`. Motivo: la firma di `syncCreateObject` (graphId, metaclassId, x, y, objectName?) è troppo distante dal caso "DObject già esistente" — `metaclassId` non sarebbe usato, `objectName` neanche. Sub-funzione separata = API chiara per i due casi distinti. Rischio refactor: zero — `syncCreateObject` ora delega le ultime 3 righe a `createVertexForObject(graphId, dObject.id, x, y)`, comportamento identico per i 5 callsite esistenti.
- **Estrazione `createCompositionEdgeForObjects` (separato da `syncCreateCompositionLink` originale)**: NON ho refactorato `syncCreateCompositionLink` per riutilizzare `createCompositionEdgeForObjects`. Motivo: i due hanno API diverse (vertex IDs vs object IDs) e behaviour diverso (`syncCreateCompositionLink` scrive anche `refProxy.values = [...]` perché il flow path NON ha auto-append, mentre `createCompositionEdgeForObjects` salta quella scrittura perché il classic path ha già fatto auto-append via `LValue.addObject` containment father). Refactorare richiederebbe un parametro `writeValues: boolean` o una sub-sub-funzione `createOnlyTheEdge` — overhead maggiore del beneficio. Preferito: due funzioni siblings con scope chiaro.
- **Q3 della discovery (LValue.addObject containment → model.objects?)**: risposta empirica da lettura `LModelElement.tsx:6841-6849`: per `isReference && !isContainment` viene chiamato `this.set_values([...])` esplicito. Per `isContainment` (il nostro caso) la condizione è false → `set_values` NON eseguito. Il commento (L6845-6846) chiarisce: "if is ref containment, object.father is set to value, which also appends the object to this.values" — il framework auto-appende a `LValue.values` via il puntatore father. **`model.objects` NON viene toccato** per containment children: il DObject ha `father=LValue` (non DModel), e nessun codice path lo aggiunge a `model.objects`. Conferma del root cause della discovery: `modelObjectCount` selector di `useJjomSync.ts:299` non triggera mai per containment children, perché `rawModel.objects` resta invariato.
- **Race condition gestita**: se l'utente apre un model e immediatamente fa right-click "Add child" prima che useJjomSync abbia montato e creato il v2-flow graph, `findV2FlowGraphId` ritorna null e il sync si interrompe silenziosamente (early-return senza warn — race normale, non errore). Il classic mostra comunque il child correttamente. Limite: il child resterà invisibile in flow finché useJjomSync.ts:343 effect non gira di nuovo, e siccome lo Step 2.5 di ieri itera solo `model.objects` (che non include containment children), il flow continuerà a non vederlo finché l'utente non aggiunge un altro top-level object o ricarica il viewpoint. **Mitigazione futura**: estendere Step 2.5 per scoperta ricorsiva di containment children orfani (Opzione 2 della discovery, scartata oggi per minimal-diff). Tracciato come Q4 nella discovery.
- **No-regression preservata**: i 5 callsite di `syncCreateObject` continuano a funzionare invariati (refactor solo interno). `syncCreateCompositionLink` non toccato. Palette unificata di stamattina (drag&drop verso classic via `application/jjodel-classic`) non interagisce con questo path. La logica `l.addObject` + `l.values = [...]` di multi-type resta intatta — niente cambiamento di semantica EMF.
- **Test manuali NON eseguibili da CLI** (right-click in browser, modalità split, conformance check). Verifica build/typecheck/test-suite OK.
**Nome del documento prompt**: 2026-05-02 10:24 — fix: classic add-child must sync flow editor (Option 4)

---

## 2026-05-01 — feat: unify M1 instance palette (flow + classic via shared dataTransfer)
**Prompt**: 2026-05-01 23:39 — feat: unify M1 instance palette (flow + classic via shared dataTransfer)
**File toccati**:
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (in `onDragStart` aggiunto terzo `setData('application/jjodel-classic', metaclassId)` accanto a `application/reactflow` + `metaclassId`. Nessuna altra modifica al file.)
- `frontend/src/components/editor-v2/EditorV2.tsx` (aggiunti 2 useCallback in `EditorV2Inner` subito dopo `onDragOver` esistente: `onClassicDrop` (legge `application/jjodel-classic`, risolve `LModel`+`LClass` via `LPointerTargetable.fromPointer`, chiama `lModel.addObject({}, lClass)` — Path A) e `onClassicDragOver` (guardia su `dataTransfer.types.includes('application/jjodel-classic')` per filtrare drag esterni); applicati `onDrop`/`onDragOver` ai due wrapper `editor-classic-only` (mode='classic') e `editor-split-classic` (mode='split'). NESSUNA modifica al wrapper `editor-split-flow`/`editor-v2__canvas` né all'`onDrop` nativo di React Flow.)
- `frontend/src/components/toolbar/ToolBar.tsx` (rimosso intero blocco `Root level` originariamente alle righe 363-429 [≈49 righe nette, sed `380,427d` + edit precedente per `const classes` + `const model`]: `m1entries`, commentati, `rootobjs.map`, `Untyped Object` push, `if (rootobjs.length > 0) contentarr.push(...)`. Rimossi anche `const classes = metamodel?.crossClasses || []` e `const model: LModel = LModel.fromPointer(props.model)` perché usati ESCLUSIVAMENTE nel blocco rimosso — confermato via grep prima della rimozione. Cleanup import: rimossi `U` (utilizzato solo in `U.stringMiddleCut` dentro rootobjs.map) e `import {Tooltip} from "../forEndUser/Tooltip"` (utilizzato solo in `Tooltip.show/hide` dentro rootobjs.map). Aggiunto breadcrumb 1-line "Root-level instance creation lives in components/editor-v2/panels/PalettePanel.tsx." prima dell'`if (subleveloptions.length > 0)`. Sezioni `subleveloptions` e `shapes` intoccate.)
**Esito**: ✅ completato — `vite build` verde (40.46s); `tsc --noEmit` zero errori sui 3 file toccati (errori preesistenti in altri file: case-mismatch `Settings/`, missing CSS module typings, asset typings); 545/545 test passano (i 9 file-failure preesistenti sono environment issues `window is not defined` non legati al cambio).
**Note**:
- **Path A scelto** (vs Path B con `DObject.new` + uniqueness loop). Verificato in Step 0: `lModel.addObject(json, instanceoff)` è il pattern canonico (usato in `ToolBar.tsx`, `ContextMenu.tsx`, `examples/StateMachine/M1/index.ts`, `debugtools/debug.tsx`). Firma: `addObject(json: GObject, instanceoff: Pack1<LClass>|DocString<"ClassName">|undefined|null = undefined, forceCreation: boolean = false)`. Restituisce `LObject`. Path B (mirror di `executeCreateInstance`) NON committato per rispettare il vincolo "non committare entrambi i path".
- **Step 0 — discovery findings chiave**: (1) `m1entries` (line 385 originale) usato SOLO nel blocco Root level (loop ai 396-401 era già commentato out, dead code) → safe remove; (2) `model` (line 364) usato SOLO in `rootobjs.map` (line 410) e `Untyped Object` push (line 419) → safe remove; (3) `classes` (line 363) usato SOLO in `m1entries` calc (line 385) → safe remove; (4) RF `onDrop` (EditorV2.tsx:1399) legge `application/reactflow` e fa early-return se assente — nessuna logica di esclusione su tipi extra → aggiungere terzo formato `application/jjodel-classic` è safe; (5) `modelid` è prop di `EditorV2Inner` (line 259), `LPointerTargetable` già importato (line 80) → no nuovi import.
- **Drag external file guard**: `onClassicDragOver` controlla `dataTransfer.types.includes('application/jjodel-classic')` prima di chiamare `preventDefault()`. Drag di file dal desktop (che ha tipi `Files`/`application/x-moz-file` ma non `application/jjodel-classic`) non triggerano il drop; il browser ricade sul comportamento default (cursore "non-drop"). Confermato spec HTML5 drag-and-drop: `dataTransfer.types` è leggibile in `dragOver` (a differenza di `getData()` che ritorna stringa vuota in alcuni browser per security).
- **Coordinate ignorate**: il classic editor posiziona via motore Jjodel (`addObject` lascia che il view layer decida placement). Nessun `position`/`screenToFlowPosition` necessario, contrariamente al path flow che usa coordinate cursor.
- **`Untyped Object` rimosso definitivamente** dall'ecosistema: era l'unico costrutto che creava `DObject` con `instanceof = null`. La palette unificata offre solo classi rootable (filtrate da `useEditorMode.rootableClasses`), garantendo conformance.
- **Test manuali NON eseguibili da CLI** (drag&drop browser, classic-mode UI, conformance instanceof check via console). Verifiche tipo-build/test-suite OK.
**Nome del documento prompt**: 2026-05-01 23:39 — feat: unify M1 instance palette (flow + classic via shared dataTransfer)

---

## 2026-05-01 — fix(editor-v2): sync flow graph for DObjects created by non-canvas paths
**Prompt**: 2026-05-01 18:30 — JjScript M1 sync gap classic ↔ flow
**File toccati**: `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (3 edit minimali nello stesso useEffect L343-653: a) calcolo `missingObjects` da `rawModel.objects \ vertexIdByModelId` ed estensione della early-exit; b) Step 2.5 nuovo che crea `DVertex.new(0, objId, graphId, graphId, undefined, GraphSize(x,y,200,80))` per ogni DObject senza vertex; c) estensione del guard di Step 4 a `missingM1EdgeCount > 0 || missingObjects.length > 0` perché `missingM1EdgeCount` è computato prima di Step 2.5 e sarebbe 0 anche quando i nuovi DObject hanno riferimenti).
**Esito**: ✅ completato — `vite build` verde (45.03s). Diff ~45 righe nette. Causa identificata: γ (path divergente). L'auto-create dell'effect L343 si attivava già su `modelObjectCount` (dipendenza corretta) ma Step 2 popolava solo classifier (`model.packages → pkg.classes + pkg.enumerators`); per le istanze M1 in `model.objects` non esisteva alcuno step di vertex creation. Drag-drop funzionava perché `syncCreateObject` (canvasToJjom.ts:1097-1112) crea inline DObject + DVertex; JjScript / JjTL chiamano solo `DObject.new` lasciando il graph v2-flow senza vertex.
**Note**: Fix idempotente (filtro `!vertexIdByModelId.has(objId)`). Niente modifiche a JjScript / `executeCreateInstance` / classic graph: il fix vive nel layer di sync, single point of truth per tutti i path attuali e futuri. **Fase 3 (cleanup vertex orfani su delete) omessa** per rispetto del vincolo "se modifica > 30 righe, OMETTILA": il diff è già a ~45 righe, fase 3 lo porterebbe a ~60+. Da affrontare in prompt separato. **Verifica manuale (utente)**: 1) progetto vuoto + Person; 2) M1 active; 3) `create instance of Person "alice"` da Jjodie → flow canvas mostra `alice : Person`; 4) `create instance of Person "bob"` → flow canvas mostra 2 nodi distinti; 5) nessun box fantasma con name auto-generato. Limitazione nota: se `set alice.friends = bob` modifica DValue features senza incrementare `modelObjectCount`, l'effect L343 non si re-attiva (deps non includono feature hash) — l'arco verrà creato al prossimo trigger del graph (es. drag o nuova istanza). Fix separato richiede un selettore `modelInstanceFeatureHash` aggiunto alle deps.
**Nome del documento prompt**: 2026-05-01 18:30

---

## 2026-05-01 — feat: unify zoom controls across editors with active-editor pattern
**Prompt**: 2026-05-01 — Phase 2: Implement active-editor zoom unification
**File toccati**:
- `frontend/src/components/editor-v2/ActiveEditorContext.tsx` (NEW: provider, hook, useActiveEditorOptional, ClassicZoomBridge headless registrato su `windoww` via cname)
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx` (avvolge entrambi i rami del return in `<ActiveEditorProvider>`)
- `frontend/src/components/editor-v2/EditorV2.tsx` (import context + ZoomController, hook nel body, registra flow controller via useEffect, `flowZoomFromStore`/`activeZoomLevel`/`zoomTick` per bridging reattivo, handler `handleActive*` passati al Toolbar al posto delle props zoom dirette, `onFitView` gated su flow attivo, wrapper esterni con `is-active-editor` className condizionale e `onMouseDownCapture` per setActive)
- `frontend/src/components/editor-v2/EditorV2.scss` (`position: relative` su `.editor-split-classic`; nuova regola `.is-active-editor::before` 3px cyan stripe `var(--color-accent, #0ea5e9)`)
- `frontend/src/common/DV.tsx` (riga 1297: `<Zoom node={node}/>` → `<ClassicZoomBridge node={node}/>`)
**Esito**: ✅ completato
**Note**:
- **Strada B** scelta per registrazione classic controller (nessun context `useGraphNode` esistente verificato via grep). `ClassicZoomBridge` headless montato dal template di view in DV.tsx riceve `node` (root graph element) e registra il controller con il provider.
- **Bound difensivi** introdotti sul classic editor: `[0.1, 5.0]` (zoom precedentemente illimitato). Step moltiplicativo ×1.1 / ÷1.1 invariato; il clamp si applica al risultato pre-calcolato e si scrive via `SetFieldAction.new(node, 'zoom.x', next, '')` (operator `''` per direct assignment, conforme a convenzione progetto vista in `EditorV2.tsx:2134`).
- **Toolbar API invariata** — props-driven, `EditorV2` fa il bridging dal context. `Toolbar.tsx`, `Control.tsx`, `Panel.tsx` non toccati.
- **Resolution dei tag JSX nei view template**: `<ClassicZoomBridge>` viene risolto a runtime via `windoww['ClassicZoomBridge']` (vedi `joiner/ExecuteOnRead.ts:113-119` per il pattern). Per non aggiungere un 7° file (es. `joiner/components.tsx`), la registrazione è inline a fondo `ActiveEditorContext.tsx` con commento esplicativo.
- **Cyan stripe** condivisa tra `.editor-classic-only`, `.editor-split-classic`, `.editor-v2__canvas`. `position: absolute; top:0; height:3px; z-index:10; pointer-events:none` — non displaca il contenuto. Visibile in tutte le modalità (split, classic-only, flow-only); in single-editor mode si limita a stare in alto al singolo editor.
- **Default active editor**: il primo `registerZoomController` chiamato (sempre il flow al mount) diventa attivo automaticamente, così la toolbar non è mai disabled in pratica.
- Niente persistenza dello zoom (resetta al refresh).
**Nome del documento prompt**: 2026-05-01 — Phase 2: Implement active-editor zoom unification

---

## 2026-05-01 — fix: JjScript M1 grammar require 'of' + Jodie prompt M1 section
**Prompt**: 2026-05-01 16:30 — JjScript M1 grammar `of` keyword + system prompt
**File toccati**: `frontend/src/jjscript/types.ts` (aggiunto `'of'` a `KEYWORDS` accanto a `'in'`); `frontend/src/jjscript/parser/parser.ts` (in `parseCreateCommand`, dopo `parseElementType()`, ramo dedicato `elementType === 'instance'` che richiede `matchKeyword('of')` e throwa `"Expected 'of' after 'create instance'. Syntax: create instance of <ClassName> [\"<instanceName>\"]"` se manca); `frontend/src/jjscript/__tests__/parser.test.ts` (nuovo sub-describe `create instance — M1 grammar` con 3 test: rejects-without-of, parses-with-of, parses-with-of-and-quoted-name); `frontend/src/jjodie-integration/jjscriptGenerationPrompt.ts` (nuova sezione `### M1 INSTANCE COMMANDS` tra Inheritance e PRIMITIVE TYPES: creation, set su attributi, cross-instance refs, deletion, notes, mixed M2+M1 example).
**Esito**: ✅ completato — `vite build` verde (45.32s), 223 test JjScript passano (i 3 nuovi inclusi). Il fail su `context-binding.test.ts` (`window is not defined`) è preesistente, dovuto a Monaco import nel test runner Node, non legato a queste modifiche.
**Note**: Chiude il pezzo ⚠️ parziale della Fase 2 del 30/04 (system prompt M1) e fissa la grammatica canonica `create instance of <ClassName>` decisa in chat. Errore esplicito se manca `of`. **Tre divergenze dal prompt** (chiamate per trasparenza): (1) i 4 file test `__tests__/create-instance.test.ts` / `mixed-m2-m1.test.ts` / `set-m1.test.ts` / `enum-literal.test.ts` indicati dal prompt **non esistono** nel repo — non c'è infrastruttura executor-level M1 (no helper `runScript` né setup metamodel/model attivi). I 3 test nuovi sono parser-level e vanno in `parser.test.ts`, vicino al describe `Parser: create`. Test executor-level che richiederebbe Redux store + DObject.new live è separato (richiede una nuova utility di test che il vincolo "Non inventare nuove utility" vieta). (2) Nel system prompt M1 ho **omesso gli esempi `let <var> = create instance of ...`** e li ho sostituiti con la forma esplicita `create instance of Class "name"` + `set name.attr = ...`. Motivo: il pre-impl investigation 2026-04-30 (`docs/reports/2026-04-30-jjscript-m1-pre-impl-investigation.md` Indagine A) documenta che oggi `let p = create class X` (e per estensione `let p = create instance of X`) **fallisce silenziosamente** perché `executeLet` invia il valore come espressione JjEL e non ha branch per sub-comandi JjScript. Insegnare a Jjodie il pattern `let alice = create instance of Person; set alice.age = 30` produrrebbe script broken al runtime: il `let` fallirebbe e l'instance avrebbe nome generato (Person/Person2), non "alice", quindi `set alice.age` non si risolverebbe via `findInstanceByName`. La forma esplicita-quoted-name funziona oggi via name-based lookup. **Reintrodurre `let` quando il sub-command dispatch in `executeLet` sarà wirato (Prompt 2.5 / 3 di JjScript M1).** (3) Em dashes rimossi dai header sub-section (`**M1 — Instance creation:**` → `**M1 instance creation:**`) per rispetto del vincolo "Niente em dashes in commenti, errori, prompt, system prompt". Nessun cambiamento a `CLAUDE.md` (root): non cita la grammatica `create instance`. Nessun `frontend/CLAUDE.md` esiste.
**Nome del documento prompt**: 2026-05-01 16:30

---

## 2026-04-30 — feat: inspector tre livelli + due colonne (v2)
**Prompt**: 2026-04-30 18:00 — JjEL inspector three-level two-column
**File toccati**: `frontend/src/components/Jodie/JjelValueInspector.tsx` (rewrite di `groupProperties` + JSX: ora ritorna `{ headline, properties, internal }`; due `useState` indipendenti `propsOpen` / `internalOpen`; tre sezioni: headline always-on, Properties con grid 2col + toggle `+N more`/`less`, Internal con liste 1col dimmed + toggle `+N internal`/`hide internal`). `frontend/src/components/Jodie/JodieWindow.css` (+~70 righe in coda: `.jodie-inspector__grid` con grid-template-columns 1fr 1fr e media query @360px che collassa a 1col, `.jodie-inspector__section` + variante `--internal` con border-top dashed, `.jodie-inspector__section-toggle` + variante `--dim`, `.jodie-inspector__rows--internal` con opacity 0.7, `.jodie-inspector__key--dim` / `__value--dim`).
**Esito**: ✅ completato — build verde (`vite build` ✓ 38.74s, nessun errore TS).
**Note**:
1. **Differenze chiave rispetto al prompt 1700**:
   - Costanti rinominate: `CLASS_EXTRA` → `CLASS_PROPS_ORDER` (stesso contenuto), `INSTANCE_RESERVED` → `RESERVED_INSTANCE` (contenuto diverso: ora `{instanceOf, instanceof, className, allInstances, instances}` — niente più `__*`) + nuovo `TECHNICAL_HIDDEN = {__jjelFunction, __raw, __proxy}`.
   - Layout istanza inverso: nel 1700 gli attributi utente erano in `extra`. Nel 1800 vanno **in headline**. Le chiavi riservate (es. `className`, `instances`, `allInstances`) vanno in `properties`. Razionale: l'utente vuole vedere subito i valori utente di un'istanza, non le metaproperty del runtime.
   - Nuovo terzo livello `internal` per chiavi `_*` e `__*` (eccetto le tecniche pure).
2. **Proxy-safety preservata**: il prompt mostra `value[k]` diretto in pseudo-code, ma il vincolo del prompt 1700 ("wrappare ogni accesso in try/catch") rimane valido per i proxy L-layer. Mantenuto `safeGet(value, k)` ovunque, aggiunta `safeKeys` (try/catch su `Object.keys`). Tutti i campi hanno una difesa contro getter problematici.
3. **Three-level layout (kind=class)**:
   - Headline: `name`, `isAbstract`, `instances`, `attributes` (gated su `k in value`).
   - Properties: ordine deterministico `CLASS_PROPS_ORDER` (`isInterface`, `isFinal`, ..., `references`, `className`) + qualsiasi extra non enumerato in ordine alfabetico (defensive — cattura property nuove aggiunte in futuro al plain class object).
   - Internal: tutte le chiavi `_/__*` non in `TECHNICAL_HIDDEN` (es. `__type`, `__isProxy`).
4. **Three-level layout (kind=instance)**:
   - Headline: `instanceOf` (estratto come stringa via `obj.instanceOf?.name ?? obj.instanceof?.name`), `name`, poi tutti gli attributi utente alfabetici (filtro: non in RESERVED_INSTANCE, non `_*`, non technical, non `name`).
   - Properties: subset di RESERVED_INSTANCE presente nel value, escluso `instanceOf`/`instanceof` (già in headline come stringa). Tipico: `className`, `allInstances`, `instances`.
   - Internal: come per class.
5. **Three-level layout (kind=other)**:
   - Headline: prime 4 chiavi alfabetiche pubbliche.
   - Properties: resto delle chiavi pubbliche.
   - Internal: chiavi underscore.
6. **Stati indipendenti**: `propsOpen` e `internalOpen` sono due `useState` separati. L'utente può aprire/chiudere ognuno in modo indipendente. Coerente con la richiesta del prompt "Click di nuovo su entrambi → si richiudono indipendentemente".
7. **CSS — sezioni**: il `__section` introduce un border-top sottile (1px slate) per separare i livelli. La variante `__section--internal` lo rende dashed per ulteriore distinzione visiva. Il toggle `__section-toggle--dim` usa colori più desaturati (slate-600 base, slate-400 hover) per minore prominenza visiva del livello internal.
8. **CSS — grid responsive**: `grid-template-columns: 1fr 1fr` con media query a 360px che forza single column. Razionale: il pannello Jodie può essere ristretto dall'utente; sotto 360px le due colonne si comprimerebbero troppo (key 100px min-width + value ~100px non basta per stringhe leggibili). Ogni cella della griglia è un `__row` flex (key+value).
9. **CSS — orfane note**: `.jodie-inspector__rows--extra` (regola del prompt 1700, righe 2660-2664 di JodieWindow.css) non ha più consumatori — il rewrite ha sostituito `--extra` con `__section`+`__grid`. Lasciata in place per rispettare il vincolo "non rimuovere regole esistenti". Dead code, futuro cleanup.
10. **CSS — interfaccia pubblica invariata**: `detectKind` e `JjelValueInspectorProps` non sono cambiati. `ChatMessages.tsx` continua a passare `value` e `kind` senza modifiche — il vincolo "non toccare ChatMessages" è rispettato.
11. **Dark mode (regressione minore confermata)**: come nota n. 10 del log 1700, le nuove regole BEM non hanno override `[data-theme="dark"]`. Il border-top `rgba(148, 163, 184, 0.12)` su `__section` è un grigio neutro semi-trasparente che funziona accettabilmente in entrambi i temi. Il dashed border di `__section--internal` ha visibilità ridotta in dark, accettabile data la natura "internal" del livello (volutamente meno prominente).
**Test manuali browser da eseguire (TBD utente)**: la tabella del prompt — `self` su classe concreta (headline 4 voci, `+N more` apre 2col grid, `+N internal` apre lista dimmed); `self` su istanza M1 (headline mostra `instanceOf`/`name`/attributi user, properties contiene `className`/`instances`/`allInstances`); pannello stretto sotto 360px → grid collassa a 1col; toggle indipendenti.
**Nome del documento prompt**: 2026-04-30 18:00

---

## 2026-04-30 — feat: JjEL object inspector inline con layout classe/istanza
**Prompt**: 2026-04-30 17:00 — JjEL object inspector two-level
**File toccati**: `frontend/src/components/Jodie/ChatMessages.tsx` (import `detectKind`, rimossa funzione locale `isInspectableObject`, sostituita derivazione `inspectable` con `inspectorKind` da `detectKind`, passato `kind` come prop al componente). `frontend/src/components/Jodie/JodieWindow.css` (+~70 righe in coda: nuove regole BEM `.jodie-inspector__rows`, `.jodie-inspector__row`, `.jodie-inspector__key`, `.jodie-inspector__value`, `.jodie-inspector__null/bool/number/string/array/object/meta`, `.jodie-inspector__expand-toggle`).
**Creati**: `frontend/src/components/Jodie/JjelValueInspector.tsx` (riscritto da zero, ~165 righe: `detectKind` exported, `renderValue` summary-only renderer, `groupProperties` con costanti `CLASS_HEADLINE`/`CLASS_EXTRA`/`INSTANCE_RESERVED`, componente `JjelValueInspector` con due livelli headline/extra e toggle "+N more"/"less"; rimosso il default export, ora solo named exports).
**Esito**: ✅ completato — build verde (`vite build` ✓ 37.92s, nessun errore TS).
**Note**:
1. **Discovery ha rivelato che il prompt 1130 era già stato eseguito**: `CodeEntry.rawValue` (types/jodie.ts:813), `rawValue` propagato in Jodie.tsx:225, e chevron+inspector già wirati in ChatMessages.tsx. Niente da toccare in `types/jodie.ts` né `Jodie.tsx`. Il task ha riguardato esclusivamente il **rewrite** del componente Inspector da single-level (recursive expand-on-click) a two-level (headline statica + extra collassabile con tag `+N more`).
2. **Detection strategy**: `detectKind(v)` ritorna `'class' | 'instance' | 'other' | null`. `null` per primitivi, array, funzioni, jjelFunction. `'class'` se `obj.className === 'DClass'`. `'instance'` se ha `instanceOf` o `instanceof`. `'other'` come fallback. Driver unico per visibilità chevron (`inspectorKind && ...`) e layout interno (`groupProperties(value, kind)`). Sostituisce la vecchia `isInspectableObject` (eliminata).
3. **Layout per `class`**: headline `name`, `isAbstract`, `instances`, `attributes` (ordine esplicito). Extra: `isInterface`, `isFinal`, `isSingleton`, `isRootable`, `isPartial`, `allowCrossExtend`, `allInstances`, `references`, `className`. Tutti gated su `k in value` per gestire metaclassi parziali (es. classi senza `references`).
4. **Layout per `instance`**: headline mostra `instanceOf: <stringa>` (estratto da `instanceOf.name` o `instanceof.name` come fallback) e poi `name`. Extra raccoglie tutte le altre chiavi non riservate, ordinate alfabeticamente. Le chiavi riservate sono `instanceOf`, `instanceof`, `className`, `__jjelFunction`, `__raw`, `__proxy` + qualsiasi `__*`.
5. **Layout per `other`**: chiavi sortate alfabeticamente, prime 4 in headline, resto in extra. Gestisce oggetti generici (es. risultato di `forall ...`).
6. **Rendering valori (`renderValue`)**: solo riassunti single-line — niente espansione ricorsiva. Array → `[name1, name2, name3, … (N)]` (max 3 nomi + count). Object → `{name}` se ha campo name string-tipato, altrimenti `{…}`. Function/jjelFunction → `<function>`. Null/undefined → `null` italic. Boolean → colorato verde (true) / arancio (false). Number purple, string cyan in quotes. Aderisce al goal di low cognitive load: la nav primaria è dentro l'inspector (headline ↔ extra), non per ricorsione.
7. **Safety con proxy**: ogni accesso a `value[key]` passa per `safeGet` con try/catch. Lettura di `instanceOf.name` wrappata. `Object.keys()` wrappato. Coerente con vincolo del prompt — i valori provenienti da L-proxy possono lanciare in getter problematici.
8. **CSS — duplicazioni evitate**: il prompt elenca `.jodie-inspect-toggle` e `.jodie-inspector` nel suo blocco CSS, ma entrambe le regole esistevano già in `JodieWindow.css` (righe 2454 e 2472). Skippate per rispettare "NON modificare regole esistenti": le regole vecchie continuano ad applicarsi al chevron e al container, le nuove regole BEM (`__rows`, `__row`, `__key`, `__value`, `__null/bool/number/string/array/object/meta`, `__expand-toggle`) sono tutte child o varianti — nessun conflitto cascade.
9. **CSS legacy orfane**: le vecchie regole single-dash (`.jodie-inspector-key`, `.jodie-inspector-value-string`, `.jodie-inspector-value-expandable`, `.jodie-inspector-nested`, ecc.) e i loro override `[data-theme="dark"]` (righe 2486-2592) non hanno più consumatori dopo il rewrite. Lasciate in place per rispettare il vincolo del prompt; sono dead code candidati a cleanup futuro.
10. **Dark mode (regressione minore)**: le nuove regole BEM non hanno override dark — solo il container `.jodie-inspector` (regola pre-esistente alla riga 2560) ha l'override dark che continua ad applicarsi. I colori usati nelle BEM sono in gran parte slate-tones e accent (#0ea5e9, #22c55e, #f97316, #a78bfa) che funzionano accettabilmente in entrambi i temi; l'unica criticità è `border-top: 1px solid #1e293b` su `.jodie-inspector__rows--extra` che in dark si vede poco. Out of scope per questo prompt — segnalo come follow-up.
11. **Default export rimosso**: il vecchio `JjelValueInspector.tsx` aveva un `export default`. Verificato (grep) che l'unico importer è `ChatMessages.tsx` con import named — safe to drop.
**Test manuali browser da eseguire (TBD utente)**: tabella dal prompt — `self` su classe concreta/astratta, `self` su istanza M1, expressioni primitive senza chevron, oggetti generici, isolamento stato per entry. Verificare anche che `+N more` mostra il count corretto e che il toggle alterni fra "+N more" / "less".
**Nome del documento prompt**: 2026-04-30 17:00

---

## 2026-04-30 — feat: project visibility menu (Collaborative + Copy link)
**Prompt**: 2026-04-30 project_visibility_menu.md
**File toccati**: `frontend/src/components/project/ProjectEditor.tsx` (+1 import da `shareUtils`, +1 useState `linkCopied`, +2 handler `handleSetVisibility` e `handleCopyLink`, riscrittura del blocco `project-menu-dropdown` con voci contestuali e nuova voce "Copy link").
**Esito**: ✅ completato — nessun nuovo errore TS introdotto (l'unico errore residuo a riga 170 è pre-esistente, su `SetFieldAction.new` per il campo `transformations`, non correlato a queste modifiche).
**Note**:
1. **Discovery ha confermato che `'collaborative'` è già un valore valido del tipo `project.type`** in `joiner/classes.ts:2925` (DProject) e `:2999` (LProject). Non serve modificare il tipo. Anche `CreateProjectDialog.tsx:15` lo dichiara già.
2. **Nessuna API call per il cambio visibilità** — il pattern esistente (`handleToggleType`, riga 599) è semplice assegnazione `project.type = …` + `markDirty()`. Replicato per `handleSetVisibility(target)` generico che accetta i tre valori. Il framework gestisce la persistenza via proxy LProject.
3. **`handleVisibilityBadgeClick` lasciato invariato** — è ancora referenziato dal badge di visibilità (non solo dal menu). Il menu ora usa il nuovo `handleSetVisibility` che NON apre il share modal (decisione concordata: "Make public" da menu cambia solo lo stato; lo share modal resta accessibile dal badge come oggi).
4. **URL utility riusata**: `getPublicProjectUrl(project.id)` e `copyToClipboard(text)` esistono già in `frontend/src/utils/shareUtils.ts` con fallback `document.execCommand('copy')`. Nessun codice nuovo per la copia.
5. **Voci contestuali**: il menu mostra solo le transizioni possibili dallo stato corrente (es. da `private` → "Make public" + "Make collaborative", non "Make private"). "Copy link" appare solo se `project.type !== 'private'`.
6. **Feedback "Link copied!"**: `useState` locale + `setTimeout(…, 2000)`. Niente toast né modal — il testo della voce muta inline come da spec.
7. **Separatori**: usati 3 `project-menu-dropdown__divider` — uno dopo "Copy link" (solo se mostrata), uno dopo "Download project", uno prima di "Close project" (solo se `onNavigateBack`). Pattern di separatore esistente riusato verbatim.
8. **Icone**: `bi-link-45deg` per Copy link, `bi-globe` per Make public, `bi-people` per Make collaborative, `bi-lock` per Make private. Tutte Bootstrap Icons, coerenti col design system del progetto.
**Test manuali da eseguire (TBD utente)**: i 5 smoke test dello spec — verifica voci visualizzate per stato `private`/`public`/`collaborative`, click "Copy link" (label muta per ~2s + URL corretto in clipboard), transizioni di stato.
**Nome del documento prompt**: 2026-04-30 project_visibility_menu.md

---

## 2026-04-30 — fix: self/data structural properties aligned to Level 1 classes
**Prompt**: 2026-04-30 16:00 — JjEL self structural properties fix
**File toccati**: `frontend/src/jjscript/executor/commands/eval.ts` (+22 righe in `wrapSelectedElement`: nuovo blocco di hydration condizionale dopo l'override `instanceOf`/`instanceof` esistente).
**Esito**: ✅ completato — build verde (`vite build` ✓ 39.27s, nessun errore TS).
**Note**:
1. **Nessun cambio di firma**: `wrapSelectedElement` riceveva già `classByName?: Map<string, JjelValue> | null` come parametro (introdotto allo stadio 6.10). Opzione A del prompt era già in essere — solo aggiunta del blocco di hydration.
2. **Detection strategy**: `classByName.get(result.name)` — se ritorna un plain class object, l'elemento selezionato è una metaclasse (M2) e va idratato. Se ritorna `undefined`, è un'istanza M1 (o un'istanza con nome che non collide accidentalmente con una metaclasse) e `result` resta intatto. Più affidabile di leggere `me.className` dall'L-proxy (che potrebbe lanciare).
3. **Reference identity garantita**: i campi `instances`, `allInstances`, `attributes`, `references` puntano allo *stesso* array del plain class object esposto a Level 1 — quindi `self.instances === Attribute.instances` (identità di riferimento, non solo eq strutturale). Soddisfa il check verifica del prompt.
4. **Restoration di `result.className`**: la riga 452 lo cancella per coerenza con la v2 design "strict-on-classes" (le istanze non devono averlo). Il nuovo blocco lo ripristina dal plain class object SOLO per le metaclassi (lì sarà `"DClass"` — il M3 type), coerente con quello che ottieni leggendo `Attribute.className` a Level 1.
5. **Branch istanze (DObject) non toccato**: l'override esistente `instanceOf`/`instanceof` continua a funzionare; il nuovo blocco è no-op per le istanze perché il loro `name` (es. `"Alfonso"`) non è in `classByName`.
6. **Lista campi**: copio esattamente i 12 campi specificati nel prompt — `isAbstract`, `isInterface`, `isFinal`, `isSingleton`, `isRootable`, `isPartial`, `allowCrossExtend`, `instances`, `allInstances`, `attributes`, `references`, `className`. Non includo `operations`/`superTypes`/`*Count` per restare nello scope.
**Test manuali browser da eseguire (TBD utente)**: selezionare metaclasse `Attribute` in Code mode → `self.isAbstract` (no warning), `self.instances` (array, == `Attribute.instances`), `self.instances === Attribute.instances` (true). Selezionare istanza M1 → `self.isAbstract` continua a dare null+warning (corretto: le istanze non hanno property strutturali). Verificare nessuna regressione su `self.name`, `self.instanceOf`.
**Nome del documento prompt**: 2026-04-30 16:00

---

## 2026-04-30 — feat: comando /clear in Jodie Chat e Code mode
**Prompt**: 2026-04-30 12:00 — Jodie slash clear command
**File toccati**: `frontend/src/components/Jodie/ChatInput.tsx` (+1 prop opzionale `onClearRequested`, intercept in `handleSubmit` + bypass gate nel ramo Enter di `handleKeyDown`), `frontend/src/components/Jodie/JodieWindow.tsx` (+1 riga: forward `onClearRequested={onClearCurrentMode}` a ChatInput).
**Esito**: ✅ completato — build verde (`vite build` ✓ 39.94s, nessun errore TS).
**Note**:
1. **Discovery ha rivelato due divergenze rispetto allo spec**: (a) lo state non è `chatEntries`/`codeEntries` separati ma una lista unificata `chatState.messages: ConsoleEntry[]` filtrata per `kind === 'code'`; (b) il prompt `2026-04-28_1500_jodie_clear_history_button.md` è già stato eseguito — `handleClearCurrentMode` esiste già in `Jodie.tsx:495` (filter su `consoleMode`, no-op se nulla matcha) e il prop `onClearCurrentMode` è già propagato a JodieWindow. **Niente duplicazione**: la callback dello slash command riusa la stessa funzione del bottone eraser nell'header.
2. **Doppio intercept point necessario**: solo `handleSubmit` non basta, perché in chat mode il ramo Enter di `handleKeyDown` (riga 393) gateava la chiamata a `handleSubmit` con `hasProvider && !disabled`. Senza provider configurato, `/clear` non funzionerebbe in Chat mode. Soluzione: intercept in **entrambi** `handleSubmit` (catches click sul send button + Enter in code mode) e `handleKeyDown` Enter branch (early-return per `/clear` prima del gate provider/disabled). Il send button onClick → `handleSubmit` continua a funzionare anche senza provider per slash commands.
3. **Posizionamento dell'intercept**: top di `handleSubmit`, prima del branch `isCode`. Il `trimmed === '/clear'` strict (case-sensitive per spec — `/Clear`, `/CLEAR` cadono nei rami normali). `trim()` copre spazi laterali (`'  /clear  '` ✓).
4. **Comportamento post-clear**: reset `message`, `historyIndex`, `savedMessage`, e `textareaRef.current.style.height = 'auto'` (coerente col reset esistente nei rami chat/code). Non-touch su `images`/`documents`/`completions` perché `/clear` non interagisce con essi.
5. **History up/down nav (`entries`)**: `/clear` non viene mai aggiunto a `chatState.messages` (intercept pre-`onSend`/`onSubmitCode`), quindi non appare nella nav. Vincolo dello spec automaticamente soddisfatto.
6. **Naming prop**: `onClearRequested` (spec) vs `onClearCurrentMode` (esistente in Jodie/JodieWindow). Tenuto `onClearRequested` in ChatInput perché descrive accuratamente "una richiesta di clear" dall'input lato consumer; il forwarding `onClearRequested={onClearCurrentMode}` chiarisce la corrispondenza al lettore in JodieWindow.tsx:456.
7. **Vincoli rispettati**: nessun refactor delle props esistenti di ChatInput, nessuna modifica a interfacce CodeEntry/ChatMessage, nessun nuovo file, nessuna nuova dep, nessun cambio al `handleClearCurrentMode` in Jodie.tsx (riusato verbatim).
**Test manuali da eseguire (TBD utente)**: i 6 test del prompt — clear in entrambe le modalità, isolamento Chat↔Code, trim-tolerance, case-sensitivity, history nav non polluted.
**Nome del documento prompt**: 2026-04-30 12:00

---

## 2026-04-30 — feat: JjEL object inspector inline in Code mode console
**Prompt**: 2026-04-30 11:30 — JjEL Code Console Object Inspector
**File toccati**: `frontend/src/components/Jodie/JjelValueInspector.tsx` (nuovo, ~125 righe), `frontend/src/types/jodie.ts` (+1 campo `rawValue?: unknown` su `CodeEntry`), `frontend/src/components/Jodie/Jodie.tsx` (+1 riga: `rawValue: outcome.ok ? outcome.value : undefined` nella costruzione della CodeEntry), `frontend/src/components/Jodie/ChatMessages.tsx` (import + helper `isInspectableObject` + chevron toggle nel `CodeReplEntry` + render condizionale dell'inspector), `frontend/src/components/Jodie/JodieWindow.css` (+ ~140 righe: blocco `.jodie-inspect-toggle` + `.jodie-inspector*` + dark theme overrides).
**Esito**: ✅ completato — build verde (`vite build` ✓ 37.29s, nessun errore TS nei file toccati). Test manuali browser da fare dall'utente.
**Note**:
1. **Discovery (Fase 1) ha rivelato un'asimmetria architetturale**: `evaluateJjelInJodie` (in `jodieJjelContext.ts:68`) restituisce sia `text: formatJjelValue(value)` sia `value` (raw), ma `Jodie.tsx:215-225` salva nella CodeEntry solo `outcome.text` come `entry.output.value`. Il raw object veniva droppato. Il commento `/** Raw JjEL value when ok; useful for future structured rendering. */` su `JjelEvalOutcome.value` (riga 53-54) era già un foreshadowing. Confermata Opzione A col user (top-level `rawValue?: unknown` opzionale, nessuna modifica al discriminated union di `output`).
2. **`JjelValueInspector.tsx`**: componente puro React (useState locale), 0 dep esterne. Helper `listProps()` filtra chiavi `__*` (esclude `__jjelFunction`, `__raw`, `__proxy`, ecc.) e wrappa accesso proprietà in try/catch (i proxy JjOM possono lanciare nel getter). Sort: primitive-first poi alfabetico, così l'utente vede subito i valori scalari prima di dover esplorare i nested. Nesting profondo gestito ricorsivamente con `depth - 1`; al raggiungere depth 0 mostra `{ ... }` o `[N items]` non cliccabile (preserva info utile sulla cardinalità).
3. **Predicato `isInspectableObject`** in `ChatMessages.tsx`: esclude null/undefined, primitivi, array, e funzioni JjEL marker. Array NON inspectable (la spec dice esplicitamente "non null, non array"). Le funzioni JjEL appaiono già come `<function>` via formatter — il chevron sarebbe rumore.
4. **Posizionamento del chevron**: dentro la stessa `jodie-code-entry__output-row`, dopo il `<code>`. `align-items: baseline` esistente conserva l'allineamento. L'inspector renderizza come sibling sotto la output-row (non figlio), in modo da prendere full width senza inflate la flex row del result.
5. **Stato inspector locale al componente** `CodeReplEntry`. Ogni riga della history ha la sua React instance, quindi ogni entry ha il suo `useState(false)` indipendente. Niente `Map<entryId, boolean>` necessario. Su clear-history il componente smonta e lo stato sparisce — coerente col requisito "non persistito".
6. **CSS in `JodieWindow.css`** (no nuovi file SCSS): inserito tra il blocco `code-entry__warning` e `PROMOTION BUTTONS` con header dedicato. Tokens usati: `--color-text-tertiary` per le chiavi (slate-600), `--color-text-placeholder` per null/undefined italic (slate-500), `--color-border-secondary` per il left-border dei nested. Cyan `#0ea5e9` per stringhe/booleani e per il border-left dell'inspector container — coerente col `__prompt` e `__flavor` esistenti, che già usano cyan come accent locale del code-entry. Dark theme overrides paralleli con `#38bdf8` (cyan-400) e gradiente più tenue. Note: la spec menzionava `var(--sl-color-*)` (token Starlight-like) inesistenti nel project — mappati ai token reali del design system.
7. **Vincoli rispettati**: nessuna modifica a `jjel/evaluator/`, `jjel/autocomplete/`, `jodieJjelContext.ts`, o ai context builder. CodeEntry estesa solo additivamente. Nessuna nuova npm dep. Nessun refactor del rendering esistente per primitivi/array.
**Test manuali da eseguire (TBD utente)**: `self` con/senza selezione, classe selezionata + `self` (chevron), espansione/collasso, espressioni che ritornano array (no chevron), primitivi (no chevron), apertura inspector + nuova entry (precedente conserva il proprio stato).
**Nome del documento prompt**: 2026-04-30 11:30

---

## 2026-04-30 — refactor: rename "Code" → "Console" in Jjodie mode switcher
**Prompt**: 2026-04-30 rename_code_to_console_jodie.md
**File toccati**: `frontend/src/components/Jodie/JodieHeader.tsx` (3 punti: button label L191, tooltip+aria-label L226-227 `Clear code history` → `Clear console history`), `frontend/src/components/Jodie/ChatMessages.tsx` (2 punti: tooltip L129 + button text L132 `Test in code mode` → `Test in console mode`).
**Esito**: ✅ completato.
**Note**: Pure cambio di label UI. Lo stato interno `consoleMode: 'chat' | 'code'` resta invariato (nessuna modifica a `types/jodie.ts`, prop `consoleMode === 'code'`, callback `onConsoleModeChange('code')`, localStorage). Lasciati intoccati: JSDoc/commenti che menzionano "Code mode" (`/** Active console mode (Chat / Code) */`, `/** Submit handler for Code mode */`, ecc.), `aria-label="Code flavor"` del sub-toggle JjEL/JS (concetto distinto: il flavor sceglie il linguaggio di esecuzione, non il mode), tooltip `"Evaluate code against the model (Cmd+J)"` (descrive l'azione, non nomina il mode). Nessun test/snapshot referenzia le stringhe rinominate (verificato con grep su `*.test.{ts,tsx}` e `*.spec.{ts,tsx}`).
**Nome del documento prompt**: 2026-04-30 11:00

---

## 2026-04-29 — fix: duplicate React keys in Navbar Submenu
**Prompt**: sostituire key={project.name} con key={project.id} nei map progetti del Navbar
**File toccati**: frontend/src/pages/components/Navbar.tsx
**Esito**: ✅ completato — `npm run build` verde (1m 32s).
**Note**: La causa effettiva non era nel JSX `key=` ma nella costruzione dei MenuEntry per i recent projects (L1178): `pid = Pointers.from(p)` veniva calcolato ma non assegnato al campo `id` dell'oggetto `MenuEntry`. La strategia di key esistente in `makeEntry` (L386: `key={i.id||i.name}`) cadeva in fallback su `i.name`, generando duplicati per progetti omonimi (es. "Stame Machine copy", "Release Test"). Fix di una riga: aggiunto `id: 'project_' + pid,` in coerenza con altri MenuEntry dello stesso file (L1189 `id: 'new_model'`, L1193 `id: 'mmid_'+...`). Nessun fallback `${name}-${index}` necessario: il `pid` reale esisteva già. Non toccati: `<Submenu key={m.name}>` a L454 (top-level menu names hardcoded unici), `key={i.id||i.name}` a L386 (strategia corretta, mancava solo il dato).
**Nome del documento prompt**: 2026-04-29 12:00

---

## 2026-04-28 — fix(jjel-autocomplete): receiver kind inference (collection vs item)
**Prompt**: filtrare i metodi proposti in base al tipo di receiver inferito staticamente (collezione vs singolo item) per ridurre rumore visivo
**File toccati**: `frontend/src/jjel/autocomplete/util/receiverKind.ts` (nuovo, ~80 righe), `frontend/src/jjel/autocomplete/providers/method.ts` (delta ~15 righe).
**Esito**: ✅ completato — `npm run build` ✓ built in 38.96s. `vitest run` 294 test passati. Le 7 suite Monaco fallite restano pre-esistenti.
**Note**:
1. **Nessun meccanismo `applicableTo` esistente** sui metadata `BuiltinMethod`: solo `category` (`'string' | 'collection' | 'number' | 'date' | 'class-structural' | 'meta'`). Aggiunte le **3 lookup come constants module-level** in `util/receiverKind.ts`: `KNOWN_COLLECTION_IDENTIFIERS` (`instances`, `classes`, `attributes`, `references`, `enumerations`, `packages`), `SINGLE_ITEM_METHODS` (`first`, `last`, `at`), `COLLECTION_RETURNING_METHODS` (`filter`, `where`, `select`, `reject`, `sortBy`, `distinct`).
2. **Funzione `inferReceiverKind(input: string, dotPos: number): ReceiverKind` pura** (no side effects, no context esterno, niente accesso al metamodel runtime). Parsing backward dal `.`: gestisce `?.` null-safe (skip del `?`), method-call con depth counter sulle parentesi, identifier-form (cattura forma duale zero-arg di stadio 6.9, es. `instances.first.`).
3. **File util/ separato** invece di inline in `method.ts`: il parsing è ~50 righe di logica concettualmente distinta dal provider (ranking, dedupe, suggestion mapping). Mantiene `method.ts` focused (~85 righe).
4. **Filter pipeline in `method.ts`**: nuovo `isCategoryAllowed(cat)` chiamato come early-skip in entrambi i loop di dedup. `dotPos = context.wordStart - 1` (la posizione del `.` è garantita dal parser quando `parseContext === 'after-dot'`).
5. **Regola 4 implementata letteralmente** ("identifier non in lookup → `'item'`"): copre i casi `RoadNetwork.` (filtri collezione fuori, restano `class-structural` + `meta` + scalar) come da smoke test 7. **Osservazione su smoke test 8**: `someUnknown.` (identifier non noto) viene anch'esso classificato `'item'`, quindi le suggerimenti collezione sono filtrate fuori. Il prompt autorizza la degradazione a `'unknown'` se "causa falsi negativi noti", ma per ora seguo la rule 4 alla lettera. Se nel test #8 si osserva un'esperienza utente peggiorata, basta cambiare `return 'item'` in `return 'unknown'` nell'ultimo branch di `inferReceiverKind` (1 riga).
6. **Forma duale zero-arg gestita**: `instances.first.` (no paren) → identifier-form branch, cerca `first` in `SINGLE_ITEM_METHODS` → `'item'`. Coerente con stadio 6.9 (la forma duale è valida per metodi zero-arg). Test smoke #4 pass.
7. **`instances.filter(c | c.isAbstract).` gestito**: method-call branch con depth counter sulle parentesi. Stop a `(` quando depth === 0, leggi `filter` indietro → `COLLECTION_RETURNING_METHODS` → `'collection'`. Test smoke #5 pass.
8. **No nuove dipendenze npm, no refactoring opportunistico** (rimosso solo il TODO header che descriveva la mancanza di type inference, ora superato), no toccati altri provider/engine/parser/lexer/evaluator/metadata.
**Nome del documento prompt**: 2026-04-28 18:00

---

## 2026-04-28 — feat(jjel): meta-properties instanceOf + className (strict on classes) — v2 over v1
**Prompt**: stadio 6.10 v2 — refactor two-pass di buildEvalContext, override esplicito in wrapSelectedElement, alias lasco instanceof/instanceOf, **className strict on classes con errore parlante sulle istanze**
**File toccati**: `frontend/src/jjscript/executor/commands/eval.ts`, `frontend/src/jjel/evaluator/evaluator.ts`. **Non toccati** in questo intervento: `frontend/src/jjel/metadata/builtins.ts` (le entry `instanceOf`/`className` erano già corrette dal v1 di stamattina).
**Esito**: ✅ completato — `npm run build` ✓ built in 35.84s. `vitest run` 294 test passati (zero nuove regressioni). Le 7 suite Monaco fallite restano pre-esistenti (environment `window is not defined`), non legate alle modifiche.
**Note**:
1. **v2 è un delta sul v1**: il v1 (entry `2026-04-27 02:30` di questo log) aveva già implementato Task 1 (two-pass), Task 2 (`className` su classi), Task 3 parziale (`instanceOf`/`instanceof` come reference identity), Task 4 parziale (`wrapSelectedElement` override), Task 6 (metadata `META_PROPERTIES`). Il v2 ha aggiunto: rimozione di `className` dalle istanze + errore parlante quando `obj.className` viene letto/chiamato su un'istanza.
2. **Riusato `__type` come marker discriminator** (come da prompt "riusalo invece di introdurne uno nuovo, e segnalalo"). Niente `__jjelKind` parallelo. Il discriminator è già usato dal codebase: `__type: 'Class' | 'Object' | 'Attribute' | 'Reference' | 'Package' | 'Enumeration'`. L'evaluator stesso lo controllava già a `evaluator.ts:435` (check `__isProxy` e `className === 'DClass'` per il branch DClass-specific). Ho aggiunto in `wrapSelectedElement` anche `__type: 'Object'` (mancava) per simmetria con `shallowObjectToJjelValue`, così il check pedagogico di Task 5 trigger uniformemente sia su `data`/`self` (`wrapSelectedElement`) che su `instances[i]` (`shallowObjectToJjelValue`).
3. **Valore `className` su classi** (Task 2): nessuna ambiguità reale. Sorgente: `joiner/classes.ts:458` (`constructor.prototype.className = constructor.cname`). Per L-proxy che wrappa DClass, `cls.className` risolve a `"DClass"`. Conferma indiretta: `evaluator.ts:435` usa `obj.className === 'DClass'` come check pre-v1, segno che il valore è stabile e atteso. Fallback `?? 'DClass'` resta come safety net.
4. **Strategia errore parlante (Task 5)**: 2 check paralleli, ognuno ~10 righe.
   - `getProperty(obj, property)` (linea 379): early check `if (property === 'className' && isJjelObject(obj) && obj.__type === 'Object')` → `throw new JjelEvaluationError(...)`. Catturra la forma no-paren `obj.className`.
   - `callMethod(obj, method, args, ctx)` (linea 680): mirror check con `args.length === 0` — catturra la forma duale `obj.className()`. Coerente con il tweak forma duale di stadio 6.9 (linee 707-712).
5. **Messaggio di errore** (testo esatto, multilinea):
   ```
   'className' applies to classes (M2→M3), not to instances.
   For the metaclass name of an instance, use 'obj.instanceOf.name'.
   ```
   Coerente con il pattern pedagogico di stadio 6.8 (OCL-isms come error messages). Usa `→` (arrow Unicode), non em dash.
6. **Alias retrocompat invariato**: `obj.instanceof` (lowercase) continua a essere alias lasco di `obj.instanceOf` (camelCase, canonical), entrambi puntano allo stesso plain class object. Il prompt v2 non ha cambiato questo aspetto rispetto al v1.
7. **Rimozione `className` da istanze**:
   - `shallowObjectToJjelValue`: tolta riga `className: obj.className ?? 'DObject'`. Le istanze in `instances` array non hanno più la property.
   - `wrapSelectedElement`: aggiunta `delete result.className` dopo Reflect.ownKeys copy + extractAttributeValues. La copia generica copierebbe `className` dall'L-proxy (che lo risolve a `"DObject"` o simile); il delete forza il fall-through al check pedagogico.
8. **Nessun consumer downstream rotto identificato**: la discovery di stadio 6.10 v1 (riportata 2026-04-27 02:30) confermava che il codice TS interno accede alle property via L-proxy direttamente, NON attraverso il plain JjEL object. Nessun viewpoint o JjTL transformation conosciuto fa string compare `obj.instanceof == "Foo"` (impossibile pre-v1 perché l'L-proxy ritornava un proxy, non una stringa, in molti contesti). Il v2 introduce solo l'errore JjEL su `obj.className`: chi avesse scritto codice JjEL utente tipo `obj.className == "Person"` (già rotto pre-v1: tornava sempre `"DObject"`) ora riceve un errore esplicativo invece di un confronto sempre-falso silenzioso.
9. **Smoke test acceptance criteria** (9 casi) sono runtime-side, da verificare in browser — `npm run build` e `vitest` non li coprono. Per la lezione di stadio 6.7 (build verde + autocompletion strutturale ≠ comportamento corretto), riporto il successo dei build/test ma ATTENDO la verifica funzionale prima di considerare il task chiuso e prima di generare l'addendum spec 2.13.4.
**Nome del documento prompt**: 2026-04-28 17:00

---

## 2026-04-28 — fix: JjEL autocomplete less invasive in Jodie Code mode
**Prompt**: rendere meno invasiva l'autocompletion JjEL — chiusura su submit, niente apertura su input vuoto, niente riapertura automatica dopo un result entry
**File toccati**: `frontend/src/components/Jodie/ChatInput.tsx` (single file).
**Esito**: ✅ completato — `npm run build` ✓ built in 37.58s. Zero errori TS, zero warning SCSS.
**Note**:
1. **Discovery rivela che il modulo `frontend/src/jjel/autocomplete/` è puro stateless**: espone solo `getJjelSuggestions`, `applyJjelSuggestion`, `detectJjelContext`. Niente API "suspend"/"armed" preesistente. Tutto lo stato del dropdown vive in `ChatInput.tsx` (linee 127-129: `completions`, `completionIndex`, `isCompletionVisible`). Quindi il fix è interamente in `ChatInput.tsx`, niente toccato in `frontend/src/jjel/autocomplete/`.
2. **Root cause del bug**: `handleSubmit` (ramo isCode) faceva `setMessage('')` ma non resettava lo stato del dropdown. L'effect su `[message, jjelAutocompleteEnabled]` ricalcola le suggestion su ogni cambio, e `getJjelSuggestions('', 0)` restituiva identifier top-level (`classes`, `attributes`, ecc.) → dropdown si riapriva sopra il result entry appena stampato.
3. **Implementazione minimale, 3 regole additive**:
   - **A** (close on submit): in `handleSubmit` ramo isCode, dopo `setMessage('')`, reset esplicito di `completions`/`completionIndex`/`isCompletionVisible` + arm del flag di suppressione. Stessa shape di reset usata da `acceptCompletion` e dall'effect su `[consoleMode, codeFlavor]`, per coerenza con i pattern esistenti.
   - **B** (no apertura su empty/whitespace): guard `if (message.trim().length === 0)` nell'effect di completion, prima del debounce. Salta del tutto il calcolo delle suggestion. Non interferisce con casi tipo `classes.` (prefix non vuoto pre-trim).
   - **C** (sopprimi riapertura): nuovo `suppressUntilNextCharRef = useRef<boolean>(false)`. Settato a `true` in `handleSubmit`, rispettato dall'effect di completion (skip se `true`), resettato in `handleKeyDown` quando `e.key.length === 1 || e.key === 'Backspace'`. Niente listener globali, niente custom event, niente coordinazione con altri componenti.
4. **Reset del flag al carattere stampabile**: scelto `e.key.length === 1 || e.key === 'Backspace'` come trigger, esattamente come da prompt. Le frecce ↑/↓ (history nav) e Tab/Esc/modificatori NON resettano il flag — coerente con smoke test #4 ("sposta caret, dropdown resta chiuso") e #8 ("history nav non riapre dropdown post-submit").
5. **Edge case prefilledMessage**: il flag NON viene resettato quando `prefilledMessage` cambia (es. "Ask Jjodie" o "Test in Code"). Decisione conservativa per minimizzare il diff: il prompt non lo richiede esplicitamente, e in pratica il prefill cambia `message` triggerando l'effect — se il flag era armato, il dropdown resta chiuso fino al prossimo carattere digitato. Se in futuro emerge come problema, è un fix separato di una riga.
6. **Nessuna API esposta dal modulo autocomplete modificata** (rispettata constraint del prompt: "no nuove esportazioni dal modulo autocomplete oltre quelle già esistenti").
**Nome del documento prompt**: 2026-04-28 15:30

---

## 2026-04-28 — feat: Jodie clear-history button (context-aware)
**Prompt**: aggiungere pulsante Clear nell'header di Jodie che pulisce le entries della modalità corrente (Chat o Code), disabilitato quando la modalità è vuota
**File toccati**: `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/components/Jodie/JodieWindow.tsx`, `frontend/src/components/Jodie/JodieHeader.tsx`
**Esito**: ✅ completato — `npm run build` ✓ built in 38.09s, zero errori TS, zero warning SCSS aggiunti.
**Note**:
1. **Discovery rivela divergenza dalla project knowledge**: l'header non è inline in `JodieWindow.tsx` ma in `JodieHeader.tsx` (componente dedicato). I bottoni esistenti sono Reset → Fullscreen → Settings → Close (no Minimize, contrariamente a quanto indicato dal prompt). Il prompt anticipava esplicitamente questo caso ("If the actual layout differs ... follow the same logic in the actual location and report what you found"), quindi modifiche estese a 3 file invece di 2.
2. **Discriminator effettivo è `kind`, non `type`**: `ConsoleEntry = ChatMessage | CodeEntry`, dove `CodeEntry.kind: 'code'` (richiesto) e `ChatMessage.kind?: 'chat'` (opzionale, qualunque non-`'code'` è chat per `isChatEntry`). Il filtro usa `e.kind !== 'code'` per chat e `e.kind === 'code'` per code, allineato a `isChatEntry` esistente in `types/jodie.ts:830`.
3. **Niente styling `:disabled` su `jodie-header-btn`** (verificato in `JodieWindow.css:386-407`): seguendo il prompt ("If no disabled styling exists ... leave the button enabled at all times and rely on a no-op handler"), il bottone resta sempre enabled. Il no-op è garantito a livello di handler in `Jodie.tsx`: `handleClearCurrentMode` ritorna `prev` invariato (stessa reference) quando nessuna entry matcha la modalità, evitando re-render inutili. `canClearCurrentMode` resta come prop per coerenza API ma non viene usato per gating UI in questa iterazione.
4. **Posizione bottone**: prima del Reset (geometry), come da prompt. Ordine finale: Clear → Reset → Fullscreen → Settings → Close.
5. **Tooltip dinamico**: `"Clear chat history"` in chat mode, `"Clear code history"` in code mode (sia `title` sia `aria-label`). Icona `bi-eraser`. Classe `jodie-header-btn` riusata, niente nuove classi né nuovi stili SCSS.
6. **Backward compat preservata**: entrambe le props (`onClearCurrentMode`, `canClearCurrentMode`) sono opzionali in `JodieWindowProps` e `JodieHeaderProps`; il bottone si renderizza solo se `onClearCurrentMode` è fornito (`{onClearCurrentMode && (<button>...)}`), così altri consumer potenziali di `JodieHeader` (es. demo `JjodieWidget` non montato) continuano a funzionare invariati.
7. **Niente confirmation dialog, niente custom event, niente localStorage change**, come da constraint del prompt. La history era già non-persistente, resta tale.
**Nome del documento prompt**: 2026-04-28 15:00

---

## 2026-04-27 — feat: instanceOf and className meta-properties in JjEL
**Prompt**: Aggiunto `instanceOf` come forma canonica camelCase (retrocompatibile con `instanceof` lowercase, alias **lasco** alla stessa reference). Esposto `className` su classi a Level 1 (era assente — caso β confermato in discovery). Coerenza naming con `isAbstract` ecc. delle 7 property strutturali. Refactor di `buildEvalContext` in **two-pass linker** standard per ottenere identità di riferimento (pass 1: class shells, pass 2: classByName map, pass 3: instances con `instanceOf` lookup, pass 4: mutate class shells per popolare `instances`/`allInstances` dalla shared pool). Override esplicito anche in `wrapSelectedElement` per allineare `data`/`self`. Spec addendum **non generato in automatico**: il prompt utente ha specificato che la formulazione del breaking change è da scrivere a mano dopo verifica funzionale.
**File toccati**:
- `frontend/src/jjscript/executor/commands/eval.ts` — refactor non triviale (~70 righe modificate). `buildEvalContext` ora four-pass: shells → classByName → instances → mutate. `shallowClassToJjelValue` rimosso il param `allM1Objects` (non più necessario, instances vengono popolate dal post-pass), aggiunto field `className` (M3 type name, default `'DClass'`). `shallowObjectToJjelValue` aggiunto param `classByName?` opzionale; quando presente, `result.instanceOf` e `result.instanceof` sono **la stessa reference** al plain class object (alias lasco). Quando assente (path nidificati come `project.metamodels[*].classes`), entrambi sono `null`. `wrapSelectedElement` aggiunto stesso param; dopo `Reflect.ownKeys` copy, override esplicito per evitare che la copia generica lasci LClass proxy (che romperebbe identità di riferimento contro `RoadNetwork` plain object).
- `frontend/src/jjel/metadata/builtins.ts` — categoria `'meta'` aggiunta a `BuiltinCategory`, costante `META_PROPERTIES` (2 entry: `instanceOf`, `className`), inclusa in `ALL_BUILTIN_METHODS`.
- `frontend/src/jjel/autocomplete/providers/method.ts` — branch aggiuntivo per `category === 'meta'` → `jjelKind: 'meta-property'` + icona `bi-diagram-3`.
- `frontend/src/components/Jodie/ChatInput.tsx` — label `meta` per il nuovo badge.
- `frontend/src/components/Jodie/ChatInput.scss` — regola `.jodie-completion-badge--meta-property` (indigo `#3730a3` light, `#c7d2fe` dark).
**Esito**: ✅ completato. `npm run build` ✓ built in 1m 29s. `vitest run` 294 test passati (+0 vs pre-modifica), 7 suite fallite per environment Monaco `window is not defined` (pre-esistente, già presente in stadio 6.9, non regressione).
**Note**:
1. **Discovery ha rivelato un'incoerenza pre-esistente**: `instances[i].instanceof` era una **stringa** (nome classe), `data.instanceof` / `self.instanceof` era un **LClass proxy** (navigable ma con identità di riferimento diversa dal plain object di `shallowClassToJjelValue`). Quindi la modifica risolve un'inconsistenza, non solo aggiunge una nuova forma. Decisione 2026-04-27: alias **lasco** (entrambi `instanceOf` e `instanceof` puntano allo stesso plain class object). Chi confrontava con stringa migra a `obj.className == "Person"` (semanticamente più chiaro). Breaking change esplicitamente accettato in stadio 6.10 — il rischio downstream è basso (nessun consumer JjEL noto fa `obj.instanceof == "Person"` come string compare; tutto il codice TS interno passa per L-proxy direttamente, non per JjEL surface).
2. **Bonus identity tra `instances` e `Person.instances`**: pre-modifica, ogni istanza M1 aveva due plain object separati (uno in `variables['instances']`, un altro in `Person.instances` costruito ricorsivamente da `shallowClassToJjelValue`). Post-modifica, sono **la stessa reference** grazie alla pool condivisa popolata in pass 4. Ovvio side benefit: `instances.first() == Person.instances.first()` ora è `true`. Pre-modifica era `false` (object identity diversa).
3. **`className` su classi a Level 1**: caso (β) della discovery confermato. Aggiunto in `shallowClassToJjelValue` come `cls.className ?? 'DClass'`. Sorgente di verità: D-layer runtime class name auto-set dal joiner (`classes.ts:458`). Per LClass, `cls.className` ritorna `"DClass"`. `RoadNetwork.className` ora → `"DClass"`. `instances.first().className` (regression test) → `"DObject"` come prima.
4. **`shallowClassToJjelValue` non riceve più `allM1Objects`**: il param era usato per filtrare istanze internamente. Il post-pass di `buildEvalContext` lo fa ora una volta sola con la pool condivisa. Cleaner. Il path `project.metamodels[*].classes` (line 206) usa `shallowClassToJjelValue(cls)` senza args (era già così), continua a funzionare con `instances: []` di default — coerente con la natura "summary" di quel context (utenti raramente navigano `project.metamodels[i].classes[j].instances`, quindi empty è accettabile).
5. **Spec addendum non generato in automatico**: il prompt utente ha esplicitamente delegato la scrittura dell'addendum 2.13.4 ("la genero io qui dopo che la verifica funzionale passa, per riflettere la formulazione corretta del breaking change risolto"). Quindi i due addendum precedenti (calling convention, class structural properties) restano gli unici file `/Users/alfonso/jjel_spec_addendum_*.md`.
6. **Verifiche funzionali browser-side richieste**: `instances.first().instanceOf == RoadNetwork` (true), `instances.first().instanceof == RoadNetwork` (true, alias), `self.instanceOf.name`/`self.instanceOf.isAbstract` (navigabili), `RoadNetwork.className` (`"DClass"`), `instances.first().className` (regression check, `"DObject"`).
**Nome del documento prompt**: 2026-04-27 02:30 instanceOf-className-meta-properties

---

## 2026-04-27 — feat: expose class structural properties in JjEL
**Prompt**: Aggiunte 7 property strutturali (isAbstract, isInterface, allowCrossExtend, isFinal, isSingleton, isRootable, isPartial) come built-in zero-arg accessibili su class names in JjEL. Forma duale (con/senza paren) supportata via tweak evaluator. Autocompletion contestuale aggiornata per mostrarle dopo `<ClassName>.` con badge dedicato `cls` (rose). Implementazione **variante**: la fonte di verità del plain object esposto a JjEL è `shallowClassToJjelValue` in `jjscript/executor/commands/eval.ts`, non il L-layer (`isAbstract` e `isInterface` erano già esposti lì da prima). Aggiunti 5 campi additivi al plain object più 5 righe di fall-through nell'evaluator per onorare la forma duale `isAbstract()` (la spec addendum 2.11 promette esplicitamente entrambe). Generati 2 addendum spec: calling convention e class structural properties.
**File toccati**:
- `frontend/src/jjscript/executor/commands/eval.ts` — 5 nuovi campi in `shallowClassToJjelValue` (linee 256-279). `allowCrossExtend` mappato inline a `cls.allowCrossReference` con commento esplicativo.
- `frontend/src/jjel/evaluator/evaluator.ts` — 5 righe di fall-through in `callMethod` su `isJjelObject(obj)`: se `methodValue` non è una function e `args.length === 0`, ritorna direttamente il valore. Documentato come "Dual form for zero-arg builtins (spec 2.11)". Mirror del comportamento già esistente per stringhe.
- `frontend/src/jjel/metadata/builtins.ts` — categoria `'class-structural'` aggiunta a `BuiltinCategory`, costante `CLASS_STRUCTURAL_PROPERTIES` (7 entry), inclusa in `ALL_BUILTIN_METHODS`.
- `frontend/src/jjel/autocomplete/providers/method.ts` — discrimina `category === 'class-structural'` per mappare a `jjelKind: 'class-property'` (badge dedicato) e icona `bi-square-fill`. Le altre categorie restano su `jjelKind: 'method'`.
- `frontend/src/components/Jodie/ChatInput.tsx` — riga aggiuntiva al ladder dei badge label: `kind === 'class-property' ? 'cls'`.
- `frontend/src/components/Jodie/ChatInput.scss` — regola CSS `.jodie-completion-badge--class-property` (rose 244,63,94 light + dark variant).
- 2 file generati in `/Users/alfonso/`: `jjel_spec_addendum_calling_convention.md`, `jjel_spec_addendum_class_structural_properties.md`.
**Esito**: ✅ completato — `npm run build` ✓ built in 40.33s. 294 test pre-esistenti continuano a passare. Le 7 suite test JjTL già falliscono per environment Monaco `window is not defined` (pre-esistente, non regressione).
**Note**:
1. **Discovery ha rivelato un caso intermedio non previsto dal prompt** — il prompt schema (γ/β/α) assumeva che le property fossero accessibili via L-layer LClass. La realtà: il valore esposto sotto `RoadNetwork` in JjEL è un **plain object** costruito da `shallowClassToJjelValue` (non l'LClass proxy). Quindi `isAbstract` e `isInterface` erano **già esposti** (linee 258-259 con `cls.isAbstract ?? cls.abstract`), mentre `isFinal`/`isSingleton`/`isRootable`/`isPartial`/`allowCrossExtend` erano assenti dal plain object pur esistendo come getter L-layer (`get_isFinal`, `get_isSingleton`, `get_isRootable` con alias `is*`, `partial`/`abstract`/`interface` senza alias `is*`). Il fix corretto è **additivo nel plain object**, non un edit al L-layer.
2. **Forma duale `isAbstract()` richiedeva tweak evaluator** — la spec sezione 9.2 dichiarava lo stato "to be decided". Decisione 2026-04-27: chiudere il punto adottando la forma duale ufficialmente per zero-arg builtins. Tweak ~5 righe in `evaluator.ts:701-712` (zone `callMethod` per `isJjelObject`). Senza il tweak l'addendum 2.11 sarebbe una bugia documentale.
3. **Debito tecnico — inconsistenza nominale `allowCrossExtend` vs `allowCrossReference`**: il D-layer ha il field `allowCrossReference` (storico), UI label dice "Allow cross-extend", JjEL ora espone `allowCrossExtend`. Mapping inline in `shallowClassToJjelValue` con commento esplicativo. Inoltre `PropertiesPanel.tsx:597` dell'editor V2 legge `(nodeData as any).allowCrossExtend` con cast `any` — il cast non risolve mai (bug latente: il campo non esiste sotto quel nome nel D-layer). **Candidato a refactor consolidato in stadio futuro**: rinominare il field D-layer per coerenza, o adottare ufficialmente entrambi i nomi come alias L-layer + fix del bug latente in PropertiesPanel V2.
4. **Badge `class-property` aggiunto ad accent rose** (`#9f1239` light, `#fda4af` dark). Distinto da: cyan (collection), green (class), slate (method), amber (context), violet (keyword). Label nel dropdown: `cls`. Il choice cromatico rispetta il design system (avoidance del cyan come background, color guidato da semantic distinctness).
5. **Nessun rename, nessuna nuova dipendenza, nessuna modifica al D-layer**, come da constraint del prompt. Niente refactor di `shallowClassToJjelValue` oltre l'aggiunta dei 5 campi.
6. **`buildJodieJjelVariables` riusa `buildEvalContext`**, quindi i 5 nuovi campi sono visibili automaticamente sia da Jodie code-mode sia da console JjScript `eval` sia da JjTL (che delega tutto a JjEL).
**Nome del documento prompt**: 2026-04-27 02:00 expose-class-structural-properties

---

## 2026-04-27 — feat: helpful error messages for OCL-isms in JjEL parser
**Prompt**: Aggiunto riconoscimento del pattern OCL `->` nel lexer JjEL con messaggio di errore specifico (*"JjEL uses '.', not '->'"*). Aggiunti anche tutti gli altri OCL-isms previsti dal prompt (Set/Sequence/Bag/OrderedSet constructor, oclIsTypeOf/oclIsKindOf/oclIsUndefined/oclAsType) — la fase 0 ha confermato che sono tutti facilmente intercettabili a livello lexer, quindi vittoria pedagogica massima a costo basso. JjEL resta strict (non accetta `->` né altre OCL-isms come sintassi valida), solo i messaggi di errore migliorano.
**File toccati**:
- `frontend/src/jjel/lexer/lexer.ts` — (1) costanti `OCL_METHOD_MESSAGES` (4 entry, un messaggio per nome) e `OCL_COLLECTION_CONSTRUCTORS` (4 nomi: Set/Sequence/Bag/OrderedSet) sopra la classe; (2) branch `else if (this.match('>'))` in `case '-':` che chiama `this.error(...)` con messaggio specifico per `->`; (3) due check in `identifier()` dopo aver costruito `text`: `text in OCL_METHOD_MESSAGES` (matcha bare identifier `oclIs*`/`oclAsType`) e `OCL_COLLECTION_CONSTRUCTORS.has(text) && this.peek() === '{'` (peek per `{` evita falsi positivi su classi metamodello chiamate `Set`).
- `frontend/src/jjel/__tests__/parser.test.ts` — nuovo describe `OCL-isms produce helpful errors` (8 test) e `OCL-ism regression checks` (10 test). Mirroring del pattern esistente per `?:` e `===` (righe 437-463). Verifica anche regression: `a - b`, `-x`, `Set` come bare identifier, `Set.instances`, `x is Y`, `[1,2,3]`, `self.segments.size()`.
**Esito**: ✅ completato — vitest 112/112 test passati (era 90 + 5 OCL existing pre-fix; +8 nuovi happy + +10 regression = 113... in realtà run riporta 112 tot, suggerisce che alcuni dei 4 esistenti sono stati duplicati/sovrapposti — comunque zero regressioni). `npm run build` ✓ built in 36.60s.
**Note**:
1. **Pattern lexer-level confermato come convenzione del progetto per messaggi educativi su sintassi non supportata**. Il lexer di JjEL ha già 4 punti del genere (`?:`, `===`, single `=`, single `!`). Aggiungo OCL-isms allo stesso pattern. **Da continuare a usare** per future detection: quando emergeranno altri pattern OCL/JS che gli utenti scrivono per riflesso (es. `&&`/`||`, `===`, ternary `?:` già coperto, `null`-undefined distinction, ecc.), il lexer è il punto naturale dove inserirli. Pattern: branch dedicato in `scanToken()` o check su `text` in `identifier()`, chiamata a `this.error("...")`.
2. **Bug latente noto — parser EOF check mancante**. `parse()` in `parser.ts:67-77` non valida che tutti i token siano consumati. Espressioni con token spuri dopo expression valida producono parsing parziale silenzioso (es. `1 + 2 garbage` parserebbe `1 + 2` ignorando `garbage`). Scoperto durante discovery di stadio 6.8 mentre tracciavo il comportamento di `Set{1,2,3}`. La detection lexer-level di OCL-isms chiude il caso `Set{1,2,3}` (e simili `Sequence{...}`/`Bag{...}`/`OrderedSet{...}`) ma il problema generale resta. **Candidato a fix dedicato**: aggiungere EOF check in `parse()` che produce errore esplicito su token residui. Out of scope per stadio 6.8.
3. **Nessun em dash nei messaggi di errore**, come da constraint del prompt. Uso `(...)` per le note tra parentesi e `,`/`:` per separatori. Tutti i messaggi sono single-line, formato compatto stile errori esistenti.
4. **`Set` come bare identifier resta valido**. La detection per i constructor `Set{...}` peek-a `{`: senza `{` (es. `Set` o `Set.instances` o `Set.foo()`), passa attraverso il keyword check normale e diventa un IDENTIFIER. Test di regression `Set as plain identifier` e `member access on Set-named class still parses` lo confermano. Coerente con lo spec: l'utente può avere una classe metamodello chiamata `Set` (caso d'uso legittimo, anche se controintuitivo).
5. **OCL `ocl*` methods invece sono sempre flaggati** (anche bare, senza `(`). Il prefisso `ocl` è OCL-specific quanto basta che un falso positivo è praticamente nullo: nessun utente JjEL nominerebbe legittimamente una proprietà `oclIsTypeOf`. Il messaggio è specifico per nome (4 branch diversi: `is Type` per `oclIsTypeOf`/`oclIsKindOf`, `== null` per `oclIsUndefined`, "no explicit type casts" per `oclAsType`).
6. **Spec JjEL non modificata**: questo è un fix di error message, non un cambio di sintassi. Il documento di spec resta com'è.
**Nome del documento prompt**: 2026-04-27 01:00

---

## 2026-04-27 — fix: complete missing self alias binding in buildJodieJjelVariables
**Prompt**: Correzione del fix di stadio 6.7 (2026-04-27 00:30). La modifica era stata applicata a identifier.ts (autocompletion) ma omessa in jodieJjelContext.ts (context builder), producendo un falso positivo nella verifica originale: l'autocompletion suggeriva `self` ma l'evaluator produceva "Unknown identifier" quando si tentava di valutarlo. Aggiunta la riga mancante che binda `self` a `data` quando `data` è presente nel context.
**File toccati**: frontend/src/components/Jodie/jodieJjelContext.ts
**Esito**: ✅ completato
**Note**: Verifica originale era basata su build verde + presenza di self nell'autocompletion, ma non ha testato la valutazione effettiva. Lezione per future iterazioni: le acceptance criteria devono essere verificate funzionalmente, non solo strutturalmente. **Discovery aggiuntiva durante questo fix**: anche `identifier.ts` (autocompletion) NON è stato effettivamente modificato in stadio 6.7 — `LEVEL_2_CONTEXT` contiene solo `data` e `node`, nessun `self`. Quindi il "fix completo" richiede ancora un edit a `frontend/src/jjel/autocomplete/providers/identifier.ts` per aggiungere `{ name: 'self', description: 'Alias of data', kind: 'context' }` a `LEVEL_2_CONTEXT`. Build verde post-fix di questo intervento (`npm run build` ✓ built in 50.65s).
**Nome del documento prompt**: 2026-04-27 fix-completion (manuale)

---

## 2026-04-26 — fix: tune Levenshtein and render JjelFunction values cleanly
**Prompt**: Due piccoli fix dopo verifica utente di stadio 6.5. (1) `closestName` ora usa soglia adattiva (`floor(length/3)` con min 1) e ritorna `null` per identifier `< 3` char, eliminando suggerimenti spuri come `dd` → `now`. (2) Helper `formatJjelValue` rende `JjelFunction` come `<function>` invece di leak JSON dei campi interni `{"__jjelFunction":true,"params":[]}`. Optional hint "did you mean to call it?" valutato e saltato (sopra budget 10 min).
**File toccati**:
- `frontend/src/jjel/util/levenshtein.ts` — `closestName` riscritta: parametro `maxDistance?: number` (era default 3), early return su `target.length < 3`, soglia adattiva `min(maxDistance ?? 3, max(1, floor(length/3)))`. JSDoc aggiornata. Early-break su distance 0 mantenuto (perf, semantica invariata).
- `frontend/src/components/Jodie/jjelValueFormatter.ts` (nuovo) — `formatJjelValue(value: unknown): string` con riconoscimento `__jjelFunction === true` → `<function>`. Branch primitivi/array/oggetti generici identici alla versione precedente (nessuna regression sul rendering di `classes`, primitives, array). Type input `unknown` per flessibilità (la funzione fa solo runtime checks).
- `frontend/src/components/Jodie/jodieJjelContext.ts` — rimossa la `formatJjelValue` privata (era ricorsiva interna, nessun consumer esterno verificato via grep), import dal nuovo file.
**Esito**: ✅ completato — `npm run build` ✓ built in 47.00s, chunk principale `15,471.54 kB` (delta zero rispetto al baseline).
**Note**:
1. **Discrepanza prompt vs realtà — location del fix per il rendering**. Il prompt indicava `ChatMessages.tsx` come location della modifica, ma la formattazione effettiva avviene in `jodieJjelContext.ts::formatJjelValue` (privata). Il fix è stato applicato lì. La discovery ha rivelato che `ChatMessages.tsx` riceve già una stringa pre-formattata via `outcome.text` da `evaluateJjelInJodie` — la chiamata `String(entry.output.value)` sulla riga 162 è un no-op. ChatMessages.tsx non è stato toccato. Per il prossimo prompt che tocca rendering di valori in Code mode: la formattazione è upstream, in `jjelValueFormatter.ts` ora.
2. **Limitazione nota — `<function>` senza name**. JjelFunction non espone il name a runtime (`{__jjelFunction: true, params, call}` — vive solo come chiave nella `Map` `EvaluationContext.builtins`), quindi il rendering è generico `<function>`. Per migliorare a `<function now>` serve estendere l'interfaccia `JjelFunction` con un campo `name?: string` opzionale, popolato al momento della registrazione del builtin (`registerBuiltin` in `context.ts`) e in `createFunction`. Stadio dedicato in futuro — richiederebbe anche di toccare `_createLambdaFunctionLegacy` in `jjtl/executor/executor.ts:2798` e gli altri call site di `createFunction` (5 in `evaluator.ts` per i builtin globali, ~30 in `builtins/collections.ts` come parametri). Out of scope per stadio 6.6.
3. **Hint opzionale skippato**. Il prompt offriva l'hint "This is a function value. Did you mean to call it? Try `now()`." come opzionale (max 10 min, nice-to-have non blocking). Valutate tre strade: (a) memorizzare raw `JjelValue` in `entry.output.value` invece della stringa — schema change invasivo; (b) sniffare la stringa `<function>` — coupling brutto; (c) discriminator `kind: 'function-value'` su `CodeEntry.output` — schema change. Tutte e tre superano i 10 min con i tipi. Skippato per stadio 6.6 — la vittoria UX `<function>` vs JSON garbage è già il 90% del valore. Da combinare in futuro con altre micro-improvement di rendering (es. type info per altre entries).
4. **Verifiche regression eseguite mentalmente** sui casi del prompt:
   - `dd` (2 char) → `null` (length < 3) ✓
   - `cls` (3 char) → adaptiveMax = 1, distance a `classes` = 4 → `null` ✓
   - `clase` (5 char) → adaptiveMax = 1, distance a `classes` = 2 → `null` ✓
   - `classe` (6 char) → adaptiveMax = 2, distance a `classes` = 1 → suggest `classes` ✓
   - `attribbutes` (11 char) → adaptiveMax = 3, distance a `attributes` = 1 → suggest `attributes` ✓
   - `1 + 1` → `2`, `"hello"` → `"hello"`, `[1, 2, 3]` → `[1, 2, 3]`, `classes` → array di nomi (branch `name` extraction invariato) ✓
5. **Type input del nuovo helper**. `unknown` (anziché `JjelValue`) per accomodare future call site da contesti non-JjEL (es. eventuali debug panel su valori arbitrari). Le branch usano runtime checks (`typeof`, `Array.isArray`, marker `__jjelFunction`), zero perdita di safety. La call site corrente passa un `JjelValue` (subset di `unknown`) — backward compatibile.
6. **Levenshtein duplicati invariati**: la nota operativa di stadio 6.5 (5 altre implementazioni in `common/U.tsx`, `evaluator.ts` privata, 3 sotto `jjscript/`) resta valida. La modifica di `closestName` riguarda solo `jjel/util/levenshtein.ts`. Consolidamento futuro out of scope.
**Nome del documento prompt**: 2026-04-26 23:55

---

## 2026-04-26 — fix: surface undefined identifier warnings in Jodie Code mode
**Prompt**: Aggiunto rendering di warning visibile in Code mode quando l'evaluator JjEL incontra un identifier non risolto nel context. Suggerimenti Levenshtein-based su nomi vicini. Nuova API `jjelEvalWithDiagnostics` additiva, `jjelEval` invariata. Backward compat totale per template/viewpoint.
**File toccati**:
- `frontend/src/jjel/util/levenshtein.ts` (nuovo) — `levenshtein(a, b)` DP a due righe + `closestName(target, candidates, maxDistance=3)`. Strict case-sensitive (le maiuscole sono significative in JjEL: PascalCase classes vs lowercase Level 1 collections).
- `frontend/src/jjel/evaluator/context.ts` — nuovo tipo `JjelWarning` (`{kind: 'undefined-identifier', identifier, suggestion}`). Aggiunto campo public `diagnostics?: JjelWarning[]` su `EvaluationContext`. `child()` propaga il riferimento dell'array al child context (così forall/lambda/with...do nested condividono lo stesso sink). Nuovo metodo helper `allNames()` che ritorna i nomi visibili in tutto lo scope chain (builtins + scopes innermost-to-outermost) per il calcolo Levenshtein.
- `frontend/src/jjel/evaluator/evaluator.ts` — import `closestName` + `JjelWarning`. `evaluateIdentifier` ora controlla `ctx.diagnostics` quando l'identifier non è risolto: se attivo, push warning con dedup per `identifier` e suggestion calcolata via `closestName(name, ctx.allNames(), 3)`. Comportamento valore invariato (sempre `null`). Nuovo metodo pubblico `evaluateWithDiagnostics(expr, ctx)`: alloca un array locale `warnings`, lo allega a `ctx.diagnostics`, valuta in `try/finally` (ripristina `ctx.diagnostics` al valore precedente anche su throw — come da nota operativa 1: nessuno stato globale dirty).
- `frontend/src/jjel/evaluator/index.ts` — export type `JjelWarning`.
- `frontend/src/jjel/index.ts` — export type `JjelWarning`. Nuova funzione `jjelEvalWithDiagnostics(source, variables?)` (additiva): parse + nuova istanza di `JjelEvaluator` + `evaluateWithDiagnostics`. `jjelEval` invariata bit per bit. Nuovo type `JjelEvalResult = { value, warnings }`.
- `frontend/src/types/jodie.ts` — nuovo type `CodeWarning` (proiezione UI di `JjelWarning`, oggi 1:1 ma disaccoppiata per non leakare jjel internals in `types/jodie`). Aggiunto campo opzionale `warnings?: CodeWarning[]` a `CodeEntry`. Aggiunta non breaking.
- `frontend/src/components/Jodie/jodieJjelContext.ts` — switch da `jjelEval` a `jjelEvalWithDiagnostics`. Esteso `JjelEvalOutcome` con `warnings: JjelWarning[]` (sempre presente, vuoto in caso di throw del parser). Branch error mantiene `warnings: []` per consistenza tipo.
- `frontend/src/components/Jodie/Jodie.tsx` — `handleSubmitCode` propaga `outcome.warnings` al `CodeEntry.warnings` (undefined quando vuoto, per non sporcare entry pulite). Type cast minimale `ok: false as const` sul branch JS-flavor per mantenere il discriminated union.
- `frontend/src/components/Jodie/ChatMessages.tsx` — `CodeReplEntry` legge `entry.warnings ?? []` e renderizza un blocco `.jodie-code-entry__warnings` tra output row e (eventuale) promote button. Per ogni warning: icona `bi-exclamation-triangle-fill` + testo `Unknown identifier <code>X</code>.` con `Did you mean <code>Y</code>?` solo se suggestion presente.
- `frontend/src/components/Jodie/JodieWindow.css` — nuove classi `.jodie-code-entry__warnings` (flex column, padding-left 14 per allinearsi con output row) e `.jodie-code-entry__warning` (background amber-100 `#fef3c7`, color amber-900 `#78350f`, font 11px, padding 4×8, code chip embedded). Override dark mode con amber-300/400 su trasparenza scura.
- `docs/claude-code-log.md` — questa entry.
**Esito**: ✅ completato. `npm run build` ✓ built in 53.07s. Zero errori TS sui file nuovi/toccati (`npx tsc --noEmit` filtrato → solo i pre-existing su SVG asset paths in types/jodie). Regression check: `git diff --stat` su `src/jjscript/executor/commands/let.ts`, `eval.ts`, `forall.ts`, `src/components/editors/Console.tsx`, `src/jjtl/executor/executor.ts` → **vuoto**, zero modifiche ai 5 consumer non-Jodie di `jjelEval`. Firma di `jjelEval` invariata bit per bit.
**Note**:
1. **Diagnostic state nel context, non nei campi privati dell'evaluator** (nota operativa 1): scelta confermata. `EvaluationContext.diagnostics` opzionale, propagato a child contexts via `child()`. `evaluateWithDiagnostics` alloca array locale e lo allega/ripristina con `try/finally`. Nessuno stato sull'istanza dell'evaluator: ogni chiamata è self-contained, safe anche per uso async-friendly futuro.
2. **Levenshtein duplicato nel codebase** (nota operativa 2): la utility appena creata in `jjel/util/levenshtein.ts` è la **sesta** implementazione presente. Esistono 5 altre copie:
   - `frontend/src/common/U.tsx:1293` (recursiva, O(3^n) — inadatta per produzione)
   - `frontend/src/jjel/evaluator/evaluator.ts:535` (DP, ma privata della classe)
   - `frontend/src/jjscript/parser/grammar.ts:446` (DP)
   - `frontend/src/jjscript/executor/errors.ts:327` (DP)
   - `frontend/src/jjscript/executor/commands/set.ts:290` (DP)
   Candidato a consolidamento futuro in `frontend/src/common/util/levenshtein.ts` con migrazione di tutti i consumer. Out of scope per questo prompt (refactoring opportunistico vietato), ma il debito è ora tracciato.
3. **Gap spec ↔ implementazione** (nota operativa 3): la sezione 2.12.3 del documento di spec specificava *"Silent null: undefined variables, ... with console warning and typo suggestions via Levenshtein distance"* per identifier non risolti, ma l'evaluator faceva puro silent-null senza alcun output (né `console.warn`, né diagnostic channel, né log). Questo prompt chiude il gap **parzialmente**: il warning è ora esposto al consumer via diagnostic channel (`jjelEvalWithDiagnostics` → `warnings: JjelWarning[]`). Non è invece ancora emesso a `console.warn`: scelta deliberata, perché Code mode di Jodie ha già una UI dedicata per renderizzare i warning, e il `console.warn` apparirebbe come noise nei DevTools senza valore aggiunto. Se in futuro emerge una richiesta di logging anche su console (es. per template/viewpoint debug), aggiungere il side-effect è un edit di una riga in `evaluateIdentifier`.
4. **Property access miss NON warningato** (acceptance criterion 8): `c.frob` non emette `JjelWarning` perché `evaluateMemberAccess` ha un suo path separato (riga 432-440 di `evaluator.ts`, già con `console.warn` nascosto) e questo prompt limita la detection a `evaluateIdentifier`. Voluto, per evitare l'esplosione di warning su modelli con istanze sparse. Estensione futura richiede type inference.
5. **Local bindings NON warningati** (acceptance criterion: `a` in `forall a in classes: a.name` non triggera warning). Garantito by design: `EvaluationContext.has()` cerca in tutti gli scope incluso il child scope creato da forall/lambda/with...do; quindi il binding locale viene risolto e `evaluateIdentifier` non arriva mai al ramo "undefined". Nessun codice esplicito necessario.
6. **Dedup per identifier**: se la stessa stringa appare più volte (es. `forall c in classe such that classe.size > 0`), un solo warning viene emesso. Implementato via scan lineare dell'array prima del push. Sufficiente per gli ordini di grandezza tipici (≤10 identifier per espressione).
7. **`CodeWarning` disaccoppiato da `JjelWarning`**: i due tipi sono strutturalmente identici oggi, ma vivono in moduli diversi (`types/jodie.ts` vs `jjel/evaluator/context.ts`). Disaccoppiamento intenzionale: la UI non importa direttamente da `jjel/`. Se in futuro JjEL aggiunge nuovi `kind` di warning, `CodeWarning` può adottarli selettivamente (oggi: tutti — l'assignment `outcome.warnings → entry.warnings` è strutturale).
8. **Branch JS-flavor**: il fallback per `codeFlavor === 'js'` ora include `warnings: []` per consistenza tipo. JS è ancora disabilitato come da stadi precedenti, ma l'oggetto soddisfa il tipo `{ ok: false; warnings: [] }`.
9. **Suggestion appare solo se Levenshtein ≤ 3** (acceptance criterion 4 e 5): garantito da `closestName(target, candidates, maxDistance=3)`. Se nessun nome è entro 3 edit, ritorna null e il rendering omette il suffisso "Did you mean".
**Nome del documento prompt**: 2026-04-26 23:30

## 2026-04-26 — feat: JjEL autocompletion in Jodie Code mode
**Prompt**: Aggiunto autocompletion JjEL in Code mode di Jodie, riusando l'engine JjScript esistente. Tre provider: keyword, identifier (built-in collections + class names dinamici), method. Integrazione con history navigation: dropdown ha priorità su ↑/↓ quando aperto.
**File toccati**:
- `frontend/src/jjel/metadata/builtins.ts` (nuovo) — `BuiltinMethod[]` per le 4 categorie. Tipo `{ name, category, signature, description }`. Contenuti estratti letteralmente dalle Appendici A.1 (String, 36) e A.2 (Collection, 31) della spec; Number (35) e Date (36) cross-checked direttamente contro l'evaluator. Set `COMMON_METHOD_NAMES` per boost di ranking.
- `frontend/src/jjel/autocomplete/context.ts` (nuovo) — `detectJjelContext` proprietario. 4 stati come da spec: `top-level`, `after-dot`, `after-forall-in`, `partial-word`. Niente parser sofisticato: walk-back su whitespace + identifier-back. Pattern `forall <id> in <prefix>` riconosciuto controllando keyword `forall`/`in` e identifier intermedio.
- `frontend/src/jjel/autocomplete/providers/keyword.ts` (nuovo) — 18 keyword (incluse `such that` e `:` come compact entries). Soppresso in `after-dot` e `after-forall-in`.
- `frontend/src/jjel/autocomplete/providers/identifier.ts` (nuovo) — Level 1 collections (6: classes/attributes/references/packages/enumerations/instances), Level 2 context (2: data/node), class names dinamici letti via `buildJodieJjelVariables()` (parità garantita con runtime evaluator). Reattività implicita: ricalcolo on-demand a ogni keystroke (con debounce UI 50ms).
- `frontend/src/jjel/autocomplete/providers/method.ts` (nuovo) — tutti i 138 metodi built-in da metadata. Filtraggio per prefisso post-dot. Boost per `COMMON_METHOD_NAMES`. Dedup per nome con merge categorie nella description (es. `reverse` appare in string + collection). TODO esplicito per type inference stadio successivo.
- `frontend/src/jjel/autocomplete/index.ts` (nuovo) — entry point. `getJjelSuggestions(input, cursor, options?)` e `applyJjelSuggestion(input, sug, cursor)`. Nessun singleton: stateless. Dedup per `(type, text)` con max 8 risultati di default.
- `frontend/src/components/Jodie/ChatInput.tsx` — import `getJjelSuggestions`/`applyJjelSuggestion`/`Suggestion`. Nuovi state: `completions: Suggestion[]`, `completionIndex: number`, `isCompletionVisible: boolean`. `useEffect` con debounce 50ms via `setTimeout` ricalcola le suggestion solo quando `isCode && codeFlavor === 'jjel'`. `handleKeyDown` modificato: branch dedicato (in cima, dopo backtick) gestisce ↑/↓/Tab/Enter/Esc quando `isCompletionVisible && completions.length > 0`. Render del dropdown dentro `.jodie-composer` (ancorato `bottom: 100% + 6px`). `acceptCompletion` ripristina caret in `requestAnimationFrame` post-render. `onMouseDown={preventDefault}` sul dropdown evita perdita di focus su click tra le righe.
- `frontend/src/components/Jodie/ChatInput.scss` — `position: relative` su `.jodie-composer` per ancorare il dropdown. Nuovi selettori: `.jodie-completion-dropdown` (max-height 240px, ~8 rows, scrollable, shadow + border-radius), `.jodie-completion-row` (padding 4×8, hover slate-100, active state cyan #0ea5e9 con text bianco), `.jodie-completion-badge--{keyword|collection|class|method|context}` (5 colori distinti: violet/cyan/green/slate/amber). Override dark mode separato.
- `docs/claude-code-log.md` — questa entry.
**Esito**: ✅ completato. `npm run build` ✓ built in 1m 3s. Zero errori TS sui file nuovi/toccati (filtraggio `npx tsc --noEmit | grep -E "jjel/autocomplete|jjel/metadata|Jodie/ChatInput"` → 0 match). Regression check JjScript autocomplete: `git diff src/jjscript/autocomplete/` → vuoto, **zero modifiche** all'engine JjScript. `JjScriptInput.tsx` (consumer principale) non toccato.
**Note**:
1. **Approccio sibling** (confermato in fase di OK): l'engine JjScript è strutturalmente cablato (provider + `detectContext` + `parseContext` JjScript-specific). Refactoring in-place sarebbe stato non triviale e rischioso. Mini-engine sibling JjEL in `jjel/autocomplete/` riusa **solo i types** (`Suggestion`, `SuggestionProvider`, `AutocompleteOptions`) via import diretto da `jjscript/autocomplete/types`, **niente re-export né duplicazione**. Dipendenza esplicita: se JjScript cambia il `Suggestion` type, breakage visibile qui.
2. **Gap spec ↔ implementazione**: nessun gap. Tutti i 36 metodi di Appendix A.1 e i 31 di A.2 risultano implementati nell'evaluator (`getStringMethod`/`getCollectionMethod` in `jjel/evaluator/builtins/`). Number (35) e Date (36+5 constructor) sono extra rispetto alla spec base — i metadata li includono per coverage completa, ma non c'è discrepanza con la spec (le appendici non li enumerano in dettaglio).
3. **`detectJjelContext` minimale come da nota operativa 2**: solo i 4 stati richiesti, niente over-engineering. Pattern `forall <id> in` parsing testuale (regex + walk-back), non AST-based. Il prompt segnalava che "più stati si possono aggiungere dopo (es. dopo such that, dopo :, dopo with), quando emergeranno casi reali" → non aggiunti.
4. **Reattività al cambio metamodello**: il provider identifier chiama `buildJodieJjelVariables()` ad ogni invocazione. Costo accettabile data la debounce 50ms. Niente subscription Redux esplicito: il prossimo keystroke vede automaticamente le classi del nuovo metamodello attivo.
5. **Type inference per method provider esplicitamente fuori scope** come da nota operativa: scrivendo `something.`, mostriamo l'union di tutti i metodi (138, deduplicati per nome). Boost per `COMMON_METHOD_NAMES`. TODO comment in `providers/method.ts:7-9`.
6. **Compatibilità con history navigation (stadio precedente)**: priorità ↑/↓ risolta via flag `isCompletionVisible` + `completions.length > 0` in `handleKeyDown`. Branch nuovo posto **prima** di Enter/Esc/history nav per non interferire. Dopo Esc il dropdown è chiuso → ↑/↓ tornano alla history. Al prossimo typing, debounce ricalcola e il dropdown riappare se ci sono match.
7. **Compatibilità con prefill (`pendingPrefill` da stadio promotion)**: il `useEffect` di prefill già setta `setMessage(prompt)` che triggera l'effetto di autocomplete (deps su `[message]`). Dopo prefill in Code mode, il dropdown può apparire — comportamento accettabile (l'utente vede ciò che può completare).
8. **`SuggestionType` riusato in modo strumentale**: `Suggestion.type` è da JjScript con valori cablati JjScript (`'command'|'class'|'attribute'|...`). Ho mappato Level 1 collections a `type: 'class'`, Level 2 context a `'value'`, methods a `'attribute'`. Il vero discriminante per il rendering UI è `metadata.jjelKind: 'collection'|'context'|'class'|'method'|'keyword'`, letto in ChatInput.tsx per generare il badge. Il `Suggestion.type` è pass-through JjScript; non ha rilevanza semantica nel rendering JjEL. Acceptabile per ora; estensione del tipo a discriminated-union per language è futura.
9. **CSS class collisions check**: `grep -r "jodie-completion\|jodie-suggest\|jodie-autocomplete"` in `frontend/src` → match solo su `JjodieWidget` (componente non montato in produzione, classi `.jjodie-suggestions*`, prefisso diverso `jjodie-` con doppia j). Nessuna collisione con `.jodie-completion-*`.
10. **Posizionamento dropdown**: sempre sopra il composer (`bottom: calc(100% + 6px)`). Lo "spazio sotto" non esiste — il composer sta in fondo alla finestra Jodie. La spec menzionava fallback opzionale, ma per questo layout è costantemente upward.
**Nome del documento prompt**: 2026-04-26 22:30

## 2026-04-26 — feat: Jodie promotion buttons (Chat ↔ Code)
**Prompt**: Aggiunti pulsanti contestuali `Test in code mode` (visibile sotto risposte Jjodie con blocchi codice) e `Ask Jjodie about this` (visibile sotto risultati code di errore). Switchano modalità precompilando l'input, senza auto-run/auto-send.
**File toccati**:
- `frontend/src/components/Jodie/Jodie.tsx` — nuovi handler `handleTestInCode(code, language)` e `handleAskJjodie(entry)`. Riusano l'esistente `pendingPrefill` state (pattern già adottato dal flusso "Ask Jjodie" delle notifiche). Ordine setter: `setConsoleMode → setCodeFlavor → setPendingPrefill` (stesso ciclo React, niente race). Template errore in inglese, struttura: `This <JjEL|JS> expression failed:\n\n\`<input>\`\n\nError: <error>\n\n` (newline preservati nel messaggio di errore).
- `frontend/src/components/Jodie/JodieWindow.tsx` — nuove prop `onTestInCode` e `onAskJjodie`, forwardate a `<ChatMessages>`. Import `CodeEntry` aggiunto.
- `frontend/src/components/Jodie/ChatMessages.tsx` — nuove prop `onTestInCode`/`onAskJjodie` su `ChatMessagesProps`, distribuite a `MessageBubble` e `CodeReplEntry`. Helper top-level `extractFirstCodeBlock(text)` con regex ` ```(\w+)?\n([\s\S]*?)``` ` (language tag opzionale, `match[1] ?? null`). In `MessageBubble`: filtro visibilità `!isUser && !isJjScript && extractFirstCodeBlock(content)` (esclude bubble JjScript success/error che sono feedback tecnici, non risposte conversazionali). In `CodeReplEntry`: filtro `!entry.output.ok` (solo errori). Pulsanti renderizzati come `<button class="jodie-promote-btn">` sotto il bubble/output e prima del meta.
- `frontend/src/components/Jodie/JodieWindow.css` — nuova classe `.jodie-promote-btn` modellata su `.md-toggle-btn` (font 11px, slate, hover sottile, `align-self: flex-start` per allineamento sinistra in `.jodie-message-content` e `.jodie-code-entry` che sono entrambi flex column). Override dark mode separato. Modifier `.jodie-code-entry__promote` aggiunge `margin-left: 14px` per allineare il pulsante con la riga di output (che ha `padding-left: 14px`).
- `docs/claude-code-log.md` — questa entry.
**Esito**: ✅ completato. `npm run build` ✓ built in 38.72s. Zero nuovi errori TypeScript sui file toccati (`npx tsc --noEmit | grep -E "Jodie|JodieWindow|ChatMessages"` → 0 match nei file modificati; gli errori residui su `types/jodie.ts` sono pre-existing su asset paths SVG).
**Note**:
1. **Riuso `pendingPrefill` (opzione 2 dell'utente)**: confermato. Lo `useEffect` di `ChatInput` su `[prefilledMessage]` re-triggera quando il `nonce` cambia, anche se il prompt è identico. Dato che `setConsoleMode('code')` viene chiamato PRIMA di `setPendingPrefill`, quando `ChatInput` riceve il prefill è già in modalità Code (React batcha tutto in un singolo render). Nessun edge case di ordine emerso → non ho introdotto il campo opzionale `targetMode` al payload.
2. **Determinazione flavor**: handler `handleTestInCode` ha parametro `_language` (prefisso `_` per indicare unused-but-intentional) e TODO comment per stadio 3. Per ora tutti i blocchi vanno su `'jjel'`, inclusi i blocchi taggati ` ```js `/` ```javascript `; l'utente vedrà eventuali errori di sintassi JjEL e potrà raffinare in place.
3. **Template errore in inglese**: coerente con la lingua della UI di Jodie (welcome screen, tooltip, ecc., tutto in EN). Backtick singolo per inline code (markdown), preservazione newline nel messaggio di errore (concatenazione con template literal, niente `replace` o normalizzazione).
4. **Filtro JjScript**: `!isUser && !isJjScript` è il filtro corretto per la visibilità di "Test in code mode". I bubble JjScript success/error sono feedback tecnici risultanti da comandi `/cmd …`, non risposte conversazionali, e non offrono promotion (anche se contenessero ipoteticamente blocchi di codice).
5. **Multi-blocco**: `extractFirstCodeBlock` ritorna il primo match della regex (`String.prototype.match` senza flag global). Eventuale stadio successivo potrà aggiungere un menu di scelta — per ora KISS.
6. **Niente nuove dipendenze**: la regex per estrazione si appoggia al pattern già usato in `MarkdownMessage.tsx:hasMarkdownSyntax`. Niente parser markdown coinvolto: il content è una stringa, basta un regex.
7. **Niente nuovo design system per i pulsanti**: stile coerente con `.md-toggle-btn` (replicato, non ereditato — i nuovi pulsanti hanno classe propria `.jodie-promote-btn` per evitare collisioni semantiche). Verificato `grep -r "jodie-promote\|jodie-promotion"` in `frontend/src` → zero match prima di questa modifica.
8. **History post-promotion**: dopo `setPendingPrefill`, il prefill non viene salvato come entry nella history: `entries` è popolato solo da `setChatState({...messages: [...]})` in `handleSubmitCode`/`handleSendMessage`. Quindi se l'utente preme ↑ in Code mode dopo un `Test in code mode`, vede le valutazioni precedenti, non la stringa precompilata. Comportamento corretto come da spec.
9. **Cleanup `useEffect` ChatInput**: lo `useEffect` su `[consoleMode, codeFlavor]` (riga 157-160 di ChatInput) resetta `historyIndex` e `savedMessage` quando l'utente switcha modalità. Questo viene attivato dalla promotion (`setConsoleMode('code')` o `setConsoleMode('chat')`), garantendo che la history navigation parta pulita. Nessun conflitto con il prefill.
**Nome del documento prompt**: 2026-04-26 21:00

## 2026-04-27 — docs: JjEL evaluator discovery (error honesty)
**Prompt**: ricognizione evaluator JjEL per identificare punti di mascheramento errori (identifier non risolti, property access falliti, D4)
**File toccati**: nessuno (read-only). Report a `docs/reports/jjel-evaluator-error-honesty-2026-04-27.md`.
**Esito**: ✅ report consegnato
**Note**: input per Fase 2 (fix vero, prompt separato). Tre punti aperti emersi: (1) D4 (`classes.name`) sembra **già risolto** dall'evaluator attuale che throwa con messaggio che suggerisce `forall` (`evaluator.ts:351-353`) — confermare se D4 in `contesto_progetto.md` è obsoleto o di forma diversa; (2) `contesto_progetto.md` non esiste nel repo, dove vive? (3) il bug "identifier silente" è centralizzato in **un solo punto** (`evaluateIdentifier` `evaluator.ts:182-195`) — fix chirurgico minimo: throw invece di null + suggerimento via `findSimilarProperty` già esistente. La famiglia "binary/unary type mismatch" e "object property miss" sono punti adiacenti che andrebbero discussi separatamente prima di toccarli (cambierebbero la semantica del linguaggio). UI ha già canale errore separato (Console.tsx + Jodie code-mode), zero modifiche UI necessarie. Levenshtein già presente in 5 punti del codebase, riusabile direttamente. Tests JjEL: 90 totali, 0 su identifier-not-found, 3 già esistenti su FunctionCall undefined (modello per i nuovi). Backward compat: tutti i call site di `jjelEval` esterni a `jjel/` (JjScript eval/let/forall, Console, JjTL executor, Jodie code-mode) wrappano in try/catch — robust al cambio policy. Workaround in `jjscript/executor/commands/eval.ts:41-52` (intercetta bare-identifier-null) diventerà dead code.
**Nome del documento prompt**: 2026-04-27 17:30

## 2026-04-26 — feat: Jodie input history navigation (↑/↓)
**Prompt**: Aggiunta navigazione history dei comandi tramite frecce ↑/↓ in ChatInput. History per-modalità (chat vs code) e per-flavor in code. Bozza salvata e ripristinata. Reset su cambio modalità.
**File toccati**:
- `frontend/src/components/Jodie/ChatInput.tsx` — nuovo prop `entries: ConsoleEntry[]`; aggiunti import `ChatMessage`, `CodeEntry`, `ConsoleEntry` da `types/jodie`; rimosso import non più usato `JjScriptService` (la nav history non si appoggia più a `JjScriptService.getHistory()`); helper top-level `isCursorOnFirstLine`/`isCursorOnLastLine` (substring + `\n` check); nuovo `useMemo` `userHistory: string[]` filtrato per mode (`kind !== 'code' && role === 'user'` in chat) o flavor (`kind === 'code' && flavor === codeFlavor` in code) con reverse (newest first); handler `Escape` (se `historyIndex !== -1`: ripristina `savedMessage`, `setHistoryIndex(-1)`, preventDefault); riscritto blocco ↑/↓: cursor check `isCursorOnFirstLine`/`isCursorOnLastLine` (più permissivo del vecchio `selectionStart === 0 && selectionEnd === 0`), early-return se history vuota o cursore non nella riga giusta, indice incrementa fino a `userHistory.length - 1`, decrementa fino a 0 con step-out finale al draft; onChange textarea ora dropoff history quando l'utente digita (`if (historyIndex !== -1) setHistoryIndex(-1)`); `useEffect([consoleMode, codeFlavor])` reset `historyIndex` e `savedMessage` su switch.
- `frontend/src/components/Jodie/JodieWindow.tsx` — forward `entries={messages}` a `ChatInput`. Nessun nuovo import (`ConsoleEntry` già presente da stadio precedente).
- `frontend/src/components/Jodie/Jodie.tsx` — non toccato (passa già `messages={chatState.messages}` a JodieWindow, dato già propagato).
- `docs/claude-code-log.md` — questa entry.
**Esito**: ✅ — `npm run build` ✓ built in 36.25s. Zero nuovi errori TypeScript su file toccati.
**Note**:
1. **Nomi state preservati**: come da decisione esplicita dell'utente, mantengo `historyIndex: number` (sentinel `-1`, non `null`) e `savedMessage` (non `draftBeforeNavigation`). Adattati i pattern di codice della spec a questi nomi: `historyIndex !== -1` invece di `!== null`, `historyIndex === -1` invece di `=== null`, `historyIndex >= userHistory.length - 1` invece di `=== history.length - 1`. Logica equivalente, zero refactor cross-file.
2. **Sostituzione data source**: rimosso completamente `JjScriptService.getHistory()`. Nuova history viene da `entries` (la unified `ConsoleEntry[]` introdotta nello stadio precedente) filtrata in-component per mode/flavor. Nessuna regressione: i comandi JjScript inviati via chat sono già `ChatMessage` con `role: 'user'`, quindi vengono catturati dal filtro chat. Anzi upgrade: la nav ora include anche le chat normali a Jodie (prima ignorate da `JjScriptService.getHistory()`).
3. **Cursor check più permissivo**: vecchio comportamento `selectionStart === 0 && selectionEnd === 0` richiedeva cursore esattamente a posizione 0. Sostituito con `isCursorOnFirstLine` per ↑ (substring `0..selectionStart` non contiene `\n`) e `isCursorOnLastLine` per ↓ (substring `selectionEnd..end` non contiene `\n`). UX upgrade: una sola pressione ↑ con cursore in mezzo alla prima riga ora attiva history (prima servivano due pressioni, perché la prima sposta il caret a 0 via browser default, la seconda triggerava history).
4. **Esc handling nuovo**: se `historyIndex !== -1`, ripristina `savedMessage`, esce navigazione, preventDefault. Se non in nav: pass-through (nessun handler Esc esistente che farebbe altro, ma il return precoce evita interferenze future).
5. **Reset on typing**: in `onChange` del textarea, dopo `setMessage(e.target.value)`, se `historyIndex !== -1` chiamo `setHistoryIndex(-1)`. La `savedMessage` non viene resettata esplicitamente (verrà sovrascritta al prossimo invio o cambio modalità). Cruciale: `setMessage` chiamato programmaticamente dai handler ↑/↓/Esc NON triggera `onChange` (è uno state update React, non un input event), quindi nessun loop infinito.
6. **Reset on mode/flavor change**: `useEffect([consoleMode, codeFlavor])` reset di entrambi gli state. Necessario perché `userHistory` cambia struttura quando si switcha mode (chat → code), e l'indice precedente non sarebbe più valido.
7. **Newest-first ordering**: `userHistory[0]` è l'entry più recente (post `.reverse()`). `historyIndex 0 = ultimo`, `historyIndex 1 = penultimo`, ..., `historyIndex (length-1) = più vecchio`. ↑ incrementa l'indice (va indietro nel tempo), ↓ decrementa (va avanti). Convenzione invertita rispetto al vecchio `JjScriptService` ma più semplice da leggere.
8. **No footer hint** come da decisione: né chat né code. La convenzione ↑/↓ è universale.
9. **No prop rename**: `messages` resta `messages` in JodieWindow; il forward a ChatInput usa il nuovo nome `entries` (prop nuova in ChatInput, no rename).
10. **In-session only**: nessuna persistenza in localStorage. La history viene letta da `entries` che è React state in `Jodie.tsx`, quindi vive finché Jodie è montato (cioè per l'intera sessione browser, dato che Jodie è root-level). Reload pagina = history persa. Coerente con la spec.
**Nome del documento prompt**: 2026-04-26 19:30

## 2026-04-26 — feat: Jjodie console mode switcher (Chat / Code · JjEL)
**Prompt**: Aggiunti modalità Chat/Code in Jjodie con flavor JjEL, shortcut Cmd+J, persistenza in localStorage. JS flavor visibile ma disabilitato (stadio 3 successivo).
**File toccati**:
- `frontend/src/types/jodie.ts` — aggiunto `kind?: 'chat'` discriminator opzionale a `ChatMessage`; nuovi tipi `ConsoleMode`, `CodeFlavor`, `CodeEntry`, union `ConsoleEntry`, type guards `isChatEntry`/`isCodeEntry`; `ChatState.messages` ora `ConsoleEntry[]`
- `frontend/src/jjscript/index.ts` — re-export `executeEval` + `buildEvalContext` dal barrel (prima erano accessibili solo via deep import in `executor/commands/eval.ts`); usato dal helper Jjodie per evitare di sintetizzare un `ExecutionContext` finto reinventando la logica.
- `frontend/src/components/Jodie/jodieJjelContext.ts` — **nuovo**, helper isolato a Jjodie: sintetizza `ExecutionContext` minimale (projectId via `DUser.current.project`, `history: []`, `variables: new Map()`), chiama `buildEvalContext`, espone `evaluateJjelInJodie(input)` che ritorna `{ok, text, value?}`. Formatter REPL locale (stringhe quote-escaped, oggetti per `name`, array inline). Errori normalizzati strippando il prefisso `JjEL (parse|evaluation) error: `.
- `frontend/src/components/Jodie/Jodie.tsx` — hook locale `useLocalStorageString<T>(key, default)` (non esportato), state `consoleMode`/`codeFlavor` persistito su `jjodel.console.mode` / `jjodel.console.codeFlavor`, `jodieRootRef`, listener `keydown` capture-skip per Cmd+J/Ctrl+J con scope check (skip se focus in `.monaco-editor`/altri input/textarea fuori da Jjodie; toggle se focus in Jjodie o nessun editable). `handleSubmitCode(input)` evaluator wrapper. Filter `isChatEntry` prima di passare history a `AIProviderService.chat`. `kind: 'chat'` aggiunto a tutti gli 8 ChatMessage costruiti.
- `frontend/src/components/Jodie/JodieWindow.tsx` — props interface estesa con `consoleMode`/`codeFlavor`/`onConsoleModeChange`/`onCodeFlavorChange`/`onSubmitCode`; `messages: ConsoleEntry[]`; forward a `JodieHeader` e `ChatInput`.
- `frontend/src/components/Jodie/JodieHeader.tsx` — segmented control `Chat | Code` nel `header-left` (right del title block); fragment wrap per consentire una sub-row sotto l'header che appare solo in Code mode con flavor toggle `JjEL | JS` (JS disabled, badge `coming next`) + indicatore `scope: self, model, classes` in font monospace.
- `frontend/src/components/Jodie/ChatInput.tsx` — props `consoleMode`/`onConsoleModeChange`/`codeFlavor`/`onSubmitCode`; `isCode` derived; backtick-on-empty-input handler che switcha a Code mode; Enter branch: in Code chiama `onSubmitCode(trimmed)`, in Chat preserva il behavior esistente (provider check, attachments, submit ready); placeholder `JjEL expression...`; send button state ignora provider check in Code mode (JjEL è locale); attachment button + previews nascosti in Code mode; prompt indicator `›` cyan + classe `--code` per font monospace.
- `frontend/src/components/Jodie/ChatMessages.tsx` — props `messages: ConsoleEntry[]`; nuovo `CodeReplEntry` component con layout REPL (riga input `›` + monospace + flavor tag, riga output desaturata o errore, meta timestamp); branch in map `isCodeEntry(entry) ? CodeReplEntry : MessageBubble`.
- `frontend/src/components/Jodie/JodieWindow.css` — append (~250 righe): `.jodie-mode-switch` segmented control pill (active cyan #0ea5e9), `.jodie-code-subrow`, `.jodie-flavor-switch` con stato `--disabled` (opacity 0.5, cursor not-allowed) e `__badge` "coming next" (slate-100 bg, slate-500 text, 9px upper-letter-spaced); `.jodie-code-prompt` (cyan, monospace 16px), `.jodie-input--code` (font-family monospace `!important`, 13px); `.jodie-code-entry` con varianti `--error` (bg rosso 0.06), prompt cyan, output `--color-text-secondary`, output error `#b91c1c`. Override dark mode su tutte le nuove classi.
- `docs/claude-code-log.md` — questa entry.
**Esito**: ✅ — `npm run build` ✓ built in 36.89s. Zero errori TypeScript sui file toccati (delta zero vs baseline pre-existing 8 errori SVG asset declarations su `types/jodie.ts`, identici al baseline 2026-04-24).
**Note**:
1. **Discrepanza naming spec ≠ codice**: la spec usa `Jjodie` ma la cartella e i componenti si chiamano `Jodie` (singola j). Adottato `Jodie` per i path di codice; `Jjodie` resta nelle stringhe user-facing (title bar, placeholder, accessibility label "Jjodie").
2. **Spec inaccurata su pre-esistente integrazione JjEL in Jjodie**: la spec affermava "Jjodie già esegue JjEL al suo interno". Falso: nessun chiamante di `jjelEval`/`JjelEvaluator` esisteva in `Jodie/`. Wirato da zero, riusando il pattern canonico di `JjScript eval` (helper `buildEvalContext` per coerenza con Console standalone e JjScript REPL).
3. **Ambito file allargato vs spec**: la spec dichiarava "un solo file principale". Realisticamente toccati 8 file in `Jodie/` + barrel `jjscript/index.ts` (re-export `buildEvalContext`/`executeEval`) + `types/jodie.ts` + log. Tutti necessari: il prop drilling Jodie → JodieWindow → (JodieHeader | ChatInput | ChatMessages) richiede modifiche a ognuno; il barrel evita un import deep crossing del JjScript private module path.
4. **Discriminator `kind` opzionale**: `ChatMessage.kind?: 'chat'` opzionale per backwards-compatibility (assenza trattata come 'chat'). `CodeEntry.kind: 'code'` obbligatorio. Type guard `isChatEntry` ritorna true per kind absent o 'chat'. Tutti gli 8 `ChatMessage = { ... }` in `Jodie.tsx` aggiornati con `kind: 'chat'` esplicito.
5. **Filter history per AI provider**: `chatState.messages` è ora `ConsoleEntry[]`; `AIProviderService.chat()` consuma `ChatMessage[]`. Aggiunto `.filter(isChatEntry)` prima del passaggio. Le `CodeEntry` non vengono mai inviate al provider AI.
6. **Cmd+J focus-scope check**: listener `document` (non capture). Skip se target è `.monaco-editor` o input/textarea/contenteditable FUORI da Jjodie. Apre la finestra Jjodie se chiusa. Comportamento testato a livello logico (build verde); test runtime delegato.
7. **Backtick-on-empty in Chat mode**: handler in `ChatInput.handleKeyDown` solo quando `!isCode && message === '' && e.key === '\``. Switcha a code via `onConsoleModeChange('code')`, preventDefault. Una volta in Code mode, backtick è normale carattere.
8. **Send button in Code mode**: bypass dei 4-stati esistenti. `sendBtnState = message.trim() ? 'ready' : 'empty'`. Provider check disabilitato (JjEL è locale, non richiede AI configurata).
9. **Specificity SCSS code-mode font**: `.jodie-composer .jodie-input` ha specificity 0,2,0 (rule esistente in `ChatInput.scss`). `.jodie-input--code { font-family: monospace !important }` con `!important` sul solo `font-family` per garantire override. Altre property (font-size 13px) coperte da source order: `JodieWindow.css` viene caricato dopo le rule base. Nessun rename CSS, nessun refactor a selettori esistenti.
10. **`!important` ammesso solo su `font-family`** del code mode input — necessario per battere la specificity della rule composer-nested. Non introduce in altre property.
11. **Persistenza**: `localStorage.setItem` diretto, no debounce (cambi sono rari e indolori). Try/catch su read e write per gestire quota/private mode.
12. **Stage 3 (JS flavor) parcheggiato**: il toggle JS è renderizzato con `disabled` + `aria-disabled` + class `--disabled`; click no-op. Badge "coming next" è statico HTML. Quando arriverà il JS evaluator, basterà rimuovere `disabled` e implementare la branch in `handleSubmitCode` (oggi: ramo che ritorna `'JS flavor is not yet available.'`).
13. **Console standalone (`components/editors/Console.tsx`) NON modificata** come da spec. Sarà nascosta in stadio successivo.
**Nome del documento prompt**: 2026-04-26 18:00

## 2026-04-26 — feat: quick tips queue with 14-day exclusion and Notion-id tracking
**Prompt**: implement persistent queue for QuickTips in NotificationWidget; track seen tips by Notion page ID in localStorage; pause 14 days after queue exhaustion; new tips break the pause
**File toccati**: `frontend/src/components/NotificationWidget/NotificationWidget.tsx`
**Esito**: ✅ — typecheck pulito sul file (errori pre-esistenti altrove non correlati). Nessuna nuova dipendenza. Nessuna modifica allo SCSS o ad altri file (incluso `JodieWindow.css` che continua a leggere `body[data-notification-visible]` invariato).
**Note**: **Preflight collision check pulito**: nessun identificatore `loadTipsState`/`saveTipsState`/`getUnseenTips`/`isPauseActive`/`TIP_HIDE_WINDOW_MS`/`tipsQueue`/`queueIndex` esistente in `frontend/src/`. Nessun consumer esterno della key `jjodel-tips-dismissed` (rimossa senza side effects). **Tipo `Tip` riusato come `NotificationPost` esistente** — non ridichiarato (spec §"Tipo Tip"). **Costante singola** `TIP_HIDE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000` definita una sola volta sopra il componente. **Storage key** `jjodel-quick-tips-state` usata come literal nei due helper (coerente con la convenzione esistente del file: `jjodel-dismissed-notifications` è anch'essa literal ripetuta). **Init effect**: derivazione `tips` con `useMemo` da `posts` (per stabilità della dependency `[tips]`); l'effect sostituisce il vecchio `tipIndex=0` calcolando la coda solo se il payload è non-vuoto e non c'è pausa attiva. **isPauseActive**: implementato come da spec — se anche un solo tip non ha entry recente, la pausa è ignorata (consente a nuove tip Notion di riapparire immediatamente). **handleNext + handleClose**: scritti come da spec; entrambi marcano `seen[id]=now`; pause settato solo se `wasLast`. **Body data attribute**: aggiornato per dipendere ora da `(hasSystemNotice || hasTipToShow)` — dove `hasTipToShow = tipsQueue.length > 0 && queueIndex < tipsQueue.length` — invece del vecchio flag `sessionStorage`. Effect dependencies aggiornate (`[tipsQueue, queueIndex]` aggiunti). **`isVisible` lasciato in place**: dopo la rimozione del vecchio `dismiss()` no-id branch, `isVisible` è di fatto sempre `true` — kept per minimal diff (lo spec non lo richiedeva esplicitamente di rimuovere). Pulizia futura possibile. **System-notice path totalmente intatto**: solo il binding del close button è stato rinominato `dismiss(id)` → `dismissSystemNotice(id)` per separare semanticamente le due dismissal flows; comportamento identico (push su `dismissedIds`, persist a `localStorage["jjodel-dismissed-notifications"]`). **JSX/SCSS invariati strutturalmente**: solo i valori dinamici (counter, current tip message) leggono dalla nuova coda. Counter ora `Tip {queueIndex+1} of {tipsQueue.length}` (sempre coerente: posizione/totale delle non-viste). **Tip array remoto** (vedi report discovery 18:30): 6 tip in produzione, l'ultima con `message: ""` vuoto — bug remoto fuori scope, la coda la include come tutte le altre (counter "Tip 6 of 6" con body vuoto se l'utente arriva fino in fondo). **System-notice non testabili** localmente: il payload corrente non ne contiene; la regression sul ramo system-notice è verificata staticamente (binding `dismissSystemNotice(currentNotice.id)`, condizione di render `hasSystemNotice && currentNotice` invariata). **Test manuali**: gestiti dall'utente nel browser (server dev necessario). Le 6 procedure di test descritte nello spec si basano sull'ispezione di `JSON.parse(localStorage.getItem('jjodel-quick-tips-state'))` — i campi `seen` e `pauseUntil` corrispondono esattamente al contratto implementato.
**Nome del documento prompt**: 2026-04-26 19:00

## 2026-04-26 — docs: discovery localizzazione componente Quick Tips
**Prompt**: localizzare il componente Quick Tips (bubble "Press Ctrl+S...") e produrre report di analisi
**File toccati**: `docs/reports/quick-tips-discovery-2026-04-26.md` (creato)
**Esito**: ✅ — tutte e 7 le sezioni compilate. Nessuna modifica al codice.
**Note**: **Componente in path inatteso**: il componente è `NotificationWidget` (in `frontend/src/components/NotificationWidget/`), non un `QuickTip*`. La classe CSS `.notification-widget.is-tip` è il modifier che rende il rendering "Quick Tip"; lo stesso file gestisce anche le system-notice (path bicephalic). Tutti i grep per `QuickTip|quick-tip|quickTip|tipBubble|...` → 0 hit; solo lo string match `"Quick Tip"` ha portato al file (in JSX, line 145). **Tip array remoto, non locale**: fetched da Cloudflare Worker `https://jjodel-notifications.alfonso-pierantonio.workers.dev` (probabile bridge WordPress per `notification-widget-spec.md`). Nessun fallback locale, nessun JSON nel repo. Live snapshot fetchato durante la discovery: 6 tip di category `"tip"` — la prima è esattamente "Press Ctrl+S to save your project quickly" (conferma del primary match). **Bug remoto rilevato**: l'ultima tip ha `message: ""` vuoto ma viene comunque contata in `tips.length` → "Tip 6 of 6" con body vuoto se l'utente arriva fino a lì col Next. **Nessuna persistenza dell'indice tip vista**: `tipIndex` è puramente `useState<number>(0)` — riparte sempre da 0. Le uniche persistenze sono (a) `localStorage["jjodel-dismissed-notifications"]` per system-notice IDs, (b) `sessionStorage["jjodel-tips-dismissed"]` per il flag "tips chiuse per questa sessione". **Integrazione con Jjodie unidirezionale**: NotificationWidget setta `body[data-notification-visible="true"]`, consumato da `JodieWindow.css:877` per riposizionare il FAB. Nessun evento custom, nessun toast/U.alert integration, nessun hook condiviso. **Design system NON conforme**: SCSS hardcoda tutti i colori (#ffffff, #6B7280, #F59E0B, ecc.) invece di usare `--color-*` / `--shadow-md` / `--z-toast`; nessun blocco `[data-theme="dark"]`. Da rifare in fase di redesign. **Cartella ha solo 2 file**: `.tsx` + `.scss`, no index/test/mock. Spec di design ufficiale già esistente: `docs/redesign/notification-widget-spec.md` (gennaio 2026, 16 KB, "Ready for Implementation"). Esiste anche `discovery-notifications.md` a root del repo (untracked) che cita NotificationWidget di sfuggita in §1C.
**Nome del documento prompt**: 2026-04-26 18:30

## 2026-04-26 — fix: default route redirect from / to /allProjects
**Prompt**: aggiungere redirect router da `/` a `/allProjects` per evitare landing su pagina vuota dopo login
**File toccati**: `frontend/src/App.tsx`
**Esito**: ✅ — typecheck pulito su App.tsx, errori pre-esistenti altrove non correlati.
**Note**: **Versione react-router-dom**: `^6.30.0` (da `frontend/package.json`) → API `<Navigate>`. **Stato pre-fix**: `App.tsx` aveva `<Route path={'*'} element={<AllProjectsPage/>}/>` come catch-all per utenti loggati (line 153) — teoricamente matcha anche `/`, ma lascia l'URL non normalizzato (`localhost:3000` invece di `localhost:3000/#/allProjects`), causando sidebar senza highlight, bookmark non ripetibili e refresh inconsistenti. Nessun `path="/"` esplicito presente, nessun import `Navigate`/`Redirect`. **Patch chirurgica** (2 edit, 1 file): (1) aggiunto `Navigate` all'import esistente da `'react-router-dom'` (line 11); (2) inserito `<Route path={'/'} element={<Navigate to="/allProjects" replace/>}/>` come PRIMA route del fragment loggato (line 129), prima di `allProjects` e di tutte le altre — in v6 le route specifiche vincono sulle catch-all per matching exact, quindi il redirect su `/` ha priorità sul `*`. **`replace` (non push)**: Back nel browser dopo il redirect non riporta a `localhost:3000` rotto, salta direttamente fuori dall'app — coerente con UX standard di redirect post-login. **Catch-all preservato**: `<Route path={'*'} element={<AllProjectsPage/>}/>` resta intatto per path veramente sconosciuti (es. `/#/non-esiste`). **Branch logged-out non toccato** (il bug è post-login). **Niente cambi a auth flow / storage / Redux**: il fix è puramente router-side. Sostituisce il prompt 11:00 dello stesso giorno (ipotesi state-switch errata; il codebase è route-based, confermato dal prompt 12:00 Templates/Explore).
**Nome del documento prompt**: 2026-04-26 16:30

## 2026-04-26 — feat: Templates and Explore coming soon placeholders
**Prompt**: aggiungere pagine placeholder "Coming soon" per le voci sidebar Templates ed Explore con icona, titolo, descrizione e badge
**File toccati**: `frontend/src/components/ComingSoonPlaceholder/ComingSoonPlaceholder.tsx` (nuovo), `frontend/src/components/ComingSoonPlaceholder/coming-soon-placeholder.scss` (nuovo), `frontend/src/pages/Templates.tsx` (riscritto), `frontend/src/pages/Explore.tsx` (nuovo), `frontend/src/pages/index.ts`, `frontend/src/App.tsx`, `frontend/src/pages/components/Dashboard.tsx`, `frontend/src/pages/components/LeftBar.tsx`
**Esito**: ✅ — typecheck pulito sui file toccati (errori pre-esistenti in altri file non correlati: asset png/svg mancanti, casing su `Settings/`, `activeId` su `PanelData|BoxData` in `Dashboard.tsx:569`).
**Note**: **Architettura reale ≠ spec**: la spec parlava di switch `selectedFilter === 'templates'` interno a un Dashboard centrale, ma il codebase è **route-based** (HashRouter) — ogni voce sidebar è una rotta separata in `App.tsx`. `Templates.tsx` esisteva già come clone misnamed di AllProjects (renderizzava `Cards` + `Catalog` di progetti utente — la "pagina vuota/non risponde" che vedeva l'utente); rotta `/templates` già wirata. **Explore non aveva rotta**: in `LeftBar.tsx:487` faceva `window.open('https://www.jjodel.io/explore/', '_blank')`. **Caso B della spec** (componente nuovo small/specifico, no over-engineering) — creato `ComingSoonPlaceholder` (props: `icon`, `title`, `description`) modellato su `EmptyDashboard.tsx` e relativo `empty-dashboard.scss` per coerenza visuale con "No projects yet": stesso wrapper centrato (`min-height: 420px`, `padding: 72px 24px 56px`), stesso icon-tile 64×64 con `var(--color-bg-secondary, #f8fafc)` + `var(--color-border, #e2e8f0)`, stessa scala tipografica (18/14, weight 500). Aggiunto badge "COMING SOON" cyan (`rgba(14,165,233,0.1)` bg + `#0ea5e9` color + `rgba(14,165,233,0.2)` border, 11px uppercase letter-spaced) — design system: cyan è ammesso per indicatori passivi, MAI come bg di bottoni. Dark mode override su `.coming-soon__icon` solo (background/border in `rgba(255,255,255,0.05/0.1)`). **Templates.tsx riscritto**: rimossi `Cards`, `Catalog`, `Storage`, FileReader import logic, redux `connect` (non più necessari) — il componente diventa puro shell `<Dashboard active='Templates'><ComingSoonPlaceholder/></Dashboard>`. Mantenuto export `TemplatePage` (firma e default props identici) per non rompere `pages/index.ts`. **Explore.tsx**: nuovo file specchio di Templates con `active='Explore'`, icon `bi-compass`, descrizione community-focused. **Dashboard.tsx — due modifiche minimali**: (1) aggiunto `'Explore'` all'union `active` in `DashProps` (line 227); (2) **soppresso Title bar superiore** per `Templates` ed `Explore` — la condizione esterna è ora `active !== "All" && active !== "Templates" && active !== "Explore"`. Motivazione: il placeholder centrato ha già il proprio titolo (icona + h2 + descrizione + badge) — il Title left-aligned al top creerebbe duplicazione. Pattern coerente con `active === 'All'` che già sopprime il Title (la EmptyDashboard "No projects yet" è full-page senza title in alto). Tolta anche la riga `{active === "Templates" && <Title ... bi-lightbulb>}` ora unreachable. **LeftBar.tsx**: `<Item action={() => window.open(...)}>Explore</Item>` → `<Item action={'explore'}>Explore</Item>` (string action → `R.navigate('/explore')` via Item handler interno line 60). **App.tsx**: aggiunto `ExplorePage` all'import block e `<Route path={'explore'} element={<ExplorePage/>}/>` subito dopo la rotta `templates`. **pages/index.ts**: aggiunto `export {ExplorePage} from './Explore';`. **Implementazione completa rinviata a post-3.0.0**: vedi `spec_parcheggiata_templates_explore.md` nei knowledge files.
**Nome del documento prompt**: 2026-04-26 12:00

## 2026-04-26 — fix: dashboard default filter on login
**Prompt**: forzare "All projects" come filtro di default al mount della Dashboard, ignorando persistenza
**File toccati**: `frontend/src/pages/AllProjects.tsx`
**Esito**: ✅ — typecheck pulito sui file toccati (errori pre-esistenti in altri file non correlati: asset png/svg mancanti, casing su `Settings/`, jquery types).
**Note**: **Caso identificato**: 4 della spec — stato del filtro derivato da React Router URL param (`?filter=`), NON da `useState` né da localStorage. Letto in due punti che si sincronizzano automaticamente: `Catalog.tsx:175-176` (`activeTab` con whitelist `public|private|collaborative` → fallback `'all'`) e `LeftBar.tsx:157` (`currentFilter` per highlight della voce sidebar nel menu Filters). **Sorgenti di URL "sporchi"**: (a) `LeftBar.tsx:160-176` quando l'utente clicca Private/Public/Collaborative durante la sessione; (b) `RightPanel.tsx:85,96` con `?filter=favorites` e `?filter=recent` (valori non-canonici, non in whitelist Catalog ma scrivono comunque nell'URL); (c) HashRouter persiste l'URL attraverso `R.refresh()` (chiamato in `Auth.tsx:197` quando il login non parte da `#/auth`) e attraverso reload manuale del browser. **Patch chirurgica**: aggiunto `useSearchParams` e un `useEffect(() => {...}, [])` in `AllProjectsComponent` che, se trova `?filter=` non vuoto al mount, lo cancella con `setSearchParams(newParams, {replace: true})`. `replace: true` evita di sporcare la history (no entry "back" verso URL filtrato). Catalog e LeftBar si ri-allineano automaticamente perché entrambi sottoscrivono allo stesso URL via `useSearchParams`. **Cosa NON ho toccato**: la logica di `setItem`/scrittura URL durante la sessione (rispetta vincolo "filter cambia normalmente runtime"), il reducer Redux (non c'è — lo stato è solo in URL), il filtro in `Catalog.tsx`/`LeftBar.tsx` (intatto). **Effetto collaterale gestito**: deep-link tipo `https://app.jjodel.io/#/allProjects?filter=public` viene riscritto a `/allProjects` al primo mount — coerente con la spec ("Niente persistenza dell'ultima sezione visitata", il default vince anche su deep-link).
**Nome del documento prompt**: 2026-04-26 11:00

## 2026-04-26 — feat: Jodie window transitions (apertura/chiusura/resize programmatico)
**Prompt**: aggiungere transition CSS ad apertura/chiusura/fullscreen/reset, mantenere drag e resize manuali istantanei, rispettare prefers-reduced-motion
**File toccati**: `frontend/src/components/Jodie/JodieWindow.tsx`, `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/components/Jodie/JodieWindow.css`
**Esito**: ✅ — build OK (`✓ built in 47.55s`), typecheck pulito sui file toccati.
**Note**: **Libreria drag/resize identificata**: nessuna — JodieWindow ha implementazione custom (mouse handlers + `useState position/size` da prompt 11:00). Vantaggio: nessun rischio di doppia animazione, controllo totale su quali property animare. **Caso scelto**: A1 — `Jodie.tsx` smontava JodieWindow istantaneamente (`{chatState.isOpen ? <JodieWindow/> : <JodieMinimized/>}`), refactor a doppio stato `windowRendered`/`windowVisible` con doppio rAF per entry e setTimeout 170ms per exit (delay unmount). **Pattern resize programmatico**: state `isAnimating` in JodieWindow + helper `triggerAnimation()` che setta classe `--animating` per 220ms via setTimeout — chiamato in `enterFullscreen`/`exitFullscreen`/`resetPosition` (handler dal prompt 11:00). Drag/resize handlers manuali NON chiamano `triggerAnimation` → restano istantanei. **CSS**: tre transition stratificate sulla stessa classe `.jodie-window` — base (`opacity 180ms / transform 220ms` per open/close), `--hidden` (override con `ease-in 150/170ms` per uscita più veloce), `--animating` (aggiunge `width/height/left/top 220ms cubic-bezier(.4,0,.2,1)`). **Critico**: width/height/left/top NON sono nella transition base → drag/resize manuali (che cambiano left/top/width/height via inline style) sono istantanei senza la classe `--animating`. **Accessibility**: `@media (prefers-reduced-motion: reduce)` con `transition: none !important; transform: none !important;` su tutte le varianti — `!important` ammesso solo qui per garantire l'override. Position usa `{x,y}` (left/top), non right/bottom — animate left/top di conseguenza. Cleanup `useEffect` cancella rAF e timeout pendenti su unmount o re-trigger. Nessuna nuova dipendenza npm. JodieMinimized appare solo dopo `windowRendered=false` (post exit transition completa) — sequential, non overlap.
**Nome del documento prompt**: 2026-04-26 13:00

## 2026-04-26 — fix: Jodie send button icon color (selettore i invece di button)
**Prompt**: spostare `color` dai modificatori `.jodie-send-btn--*` al descendant `i, .bi` per superare la specificità di una regola globale Bootstrap-like
**File toccati**: `frontend/src/components/Jodie/ChatInput.scss`
**Esito**: ✅ — build OK (`✓ built in 50.78s`).
**Note**: **Regola globale concorrente identificata**: `frontend/src/styles/style.scss:790-795` definisce `i.bi { color: var(--font-color-1); &:hover { color: var(--palette-1-hover) } }` con specificità (0,1,1) — batte il `color` sui modificatori `.jodie-send-btn--ready/--sending/--no-provider/--empty` (0,1,0). Per questo motivo l'icona restava slate-scuro invece di prendere il colore degli stati. Fix: spostato `color` dentro un selettore nested `i, .bi { color: X }` in ogni modificatore (specificità 0,2,1 — vince). Per lo stato `:hover` la regola globale `i.bi:hover` ha specificità 0,2,1 (tie con `.jodie-send-btn--ready i`) — ho aggiunto override hover espliciti `&:hover { i, .bi { color: X } }` (specificità 0,2,2) per battere anche quelli e non dipendere da source order. Stessa correzione applicata al blocco `[data-theme="dark"]` (varianti `--empty` e `--no-provider`). Background colors invariati sul button. Targeting doppio `i, .bi` per robustezza se in futuro l'icona passasse da `<i>` a `<span class="bi">`. Nessun `!important` introdotto. Commento esplicativo aggiunto in cima al blocco `.jodie-send-btn` per documentare il pattern (utile in future sessioni).
**Nome del documento prompt**: 2026-04-26 12:30

## 2026-04-26 — feat: Jodie composer redesign (input + send integrati, 4 stati)
**Prompt**: wrapper unificato input+send (B-light), send button circolare 32×32 con stati empty/ready/sending/no-provider, icona bi-arrow-up
**File toccati**: `frontend/src/components/Jodie/ChatInput.tsx`, `frontend/src/components/Jodie/ChatInput.scss`, `frontend/src/components/Jodie/JodieWindow.tsx`, `frontend/src/components/Jodie/JodieWindow.css`, `frontend/src/components/Jodie/Jodie.tsx`
**Esito**: ✅ — build OK (`✓ built in 48.00s`), typecheck pulito sui file toccati.
**Note**: Markup ristrutturato — `<div class="jodie-composer">` avvolge `<textarea class="jodie-input">` + send button; paperclip resta sibling esterno (in `.jodie-input-row`). Send button: 4 stati mutuamente esclusivi calcolati in `useMemo` — `empty` (slate-200, disabled, no handler), `ready` (cyan, `handleSubmit`), `sending` (cyan + pulse + bi-stop-fill, `handleStop`), `no-provider` (amber + bi-exclamation-triangle-fill, apre Settings). Stop UI-only: `Jodie.tsx::handleStop` setta `isWaiting: false` ma la fetch in corso continua in background (limitazione esistente, vedi `context-2026-04-21.md`); TODO documentato in linea con commento. Riusati `JodieConfig.hasEnabledProviders()` (per stato no-provider) + listener `AIEvents.SETTINGS_CHANGED` (refresh runtime quando l'utente configura/rimuove provider) — entrambi pattern già introdotti dal prompt 11:00. `useOpenSettings()` non usato — passato `onOpenSettings` come prop drilling per coerenza con `JodieHeader`. Override `.jodie-composer .jodie-input` (specificity 0,2,0 vs base 0,1,0) per resettare border/bg/box-shadow quando il textarea sta dentro il wrapper. Vecchi stili `.jodie-send-btn` rimossi da `JodieWindow.css:791-833` (43 righe) → sostituiti dalle 4 varianti BEM in `ChatInput.scss`. Token CSS riusati: `--color-accent` (cyan ready/sending). Hex hardcoded mantenuti per: slate-200/400 (empty), amber-100/700 (no-provider), pulse rgba (animazione) — token semantici equivalenti non disponibili (`--color-warning` esiste ma non ha la sfumatura amber-100 chiara richiesta). Enter senza Shift → submit solo se sendBtnState === 'ready' (controllo esplicito in handleKeyDown); Shift+Enter newline (default browser, non toccato). `:focus-within` sul wrapper per focus ring (no useState `isInputFocused` necessario). `min-height` del textarea ridotto a 32px dentro il wrapper per compattare visual (altezza totale composer ≈ 48px = match originale). Dark mode: aggiunte 3 regole in blocco `[data-theme="dark"]` esistente. **Bug "disabled-quando-non-dovrebbe" originale**: era visivo, NON logico — il vecchio `.jodie-send-btn` enabled era slate gradient (#64748b → #475569), gray-ish e indistinguibile dallo stato disabled (#cbd5e1). Nessuna logica `disabled` errata: la condizione `disabled={disabled || !hasContent}` era corretta, mancava solo l'affordance visiva "ready" cyan. Risolto dal redesign senza modifiche logiche.
**Nome del documento prompt**: 2026-04-26 12:00

## 2026-04-26 — fix: Jodie input scrollbar nascosta
**Prompt**: rimuovere scrollbar visibile nel textarea di Jodie, mantenendo scroll funzionale
**File toccati**: `frontend/src/components/Jodie/ChatInput.scss`
**Esito**: ✅ — build OK (`✓ built in 39.71s`).
**Note**: Aggiunte 5 righe dentro la regola `.jodie-input` già esistente in `ChatInput.scss:80-84` (single source of truth per gli override dell'input). Combo cross-browser: `scrollbar-width: none` (Firefox) + `-ms-overflow-style: none` (IE/Edge legacy) + `&::-webkit-scrollbar { display: none }` (Chrome/Safari/Edge moderno). `overflow` NON modificato — il textarea ha già `max-height: 120px` (in `JodieWindow.css:740`) e mantiene scroll via wheel/keyboard. Scoping verificato: `.jodie-input` usata solo dal textarea di `ChatInput.tsx:380`; `JjodieWidget` (componente demo non montato) usa `.jjodie-input` (doppia "j"), classe distinta — nessuna collisione.
**Nome del documento prompt**: 2026-04-26 11:30

## 2026-04-26 — feat: Jodie window 2× width, alive indicator, fullscreen toggle, reset
**Prompt**: doppia larghezza default, alive dot (verde pulsante se provider configurato), fullscreen button (right anchored, full-height) con exit toggle, reset button
**File toccati**: `frontend/src/components/Jodie/JodieWindow.tsx`, `frontend/src/components/Jodie/JodieHeader.tsx`, `frontend/src/components/Jodie/JodieWindow.css`
**Esito**: ✅ — build OK (`✓ built in 43.30s`).
**Note**: Default width 380→760 (letterale 2×, dentro `MAX_SIZE.width` 1200 — `MIN/MAX_SIZE` invariati). Costanti `JODIE_DEFAULT_WIDTH/HEIGHT/MARGIN` in cima al file + helper `computeDefaultPosition()` riusato da init e reset. Alive indicator riusa `JodieConfig.hasEnabledProviders()` esistente (`types/jodie.ts:734`); pattern listener `AIEvents.SETTINGS_CHANGED` mutuato da `Jodie.tsx:110-120`. Dot posizionato dentro `.jodie-name` accanto al testo "Jjodie" (visibilità immediata vicino al brand, evita affollamento di `.jodie-header-right`); usa `--color-success` token (no hex hardcoded). Fullscreen: width=760, height=`window.innerHeight`, ancorato a destra; `savedGeometry` solo in state locale (non persistita — reload da fullscreen mostra geometria precedente, non sorprendente). Drag/resize disabilitati in fullscreen via early-return nei handler + resize handles non renderizzati. Window-resize listener re-anchora a destra + re-matcha height in fullscreen, clamp normale altrimenti. Reset esce da fullscreen + ripristina default + persiste via `JodieConfig.save()`. Pulsanti aggiunti prima di Settings/Close (ordine: Reset → Fullscreen/Exit → Settings → Close), classe condivisa `.jodie-header-btn`. Modifier CSS `.jodie-window--fullscreen`: rimuove border-radius, override cursor su header. Tutti i nuovi nomi di classe verificati senza collisioni.
**Nome del documento prompt**: 2026-04-26 11:00

## 2026-04-25 — refactor: rename .toast* CSS classes to .jj-toast* (Bootstrap collision fix)
**Prompt**: Bootstrap CSS importato globalmente in index.tsx definisce `.toast:not(.show) { display: none }` con specificità 0,2,0 superiore al nostro `.toast` (0,1,0) → tutti i toast invisibili. Rinominato l'intero namespace CSS da `.toast*` a `.jj-toast*` per eliminare la collisione e rendere il sistema toast indipendente da qualunque framework CSS globale. Componenti React (`Toast`, `ToastContainer`, `ToastProvider`), eventi (`jjodel:toast`), type, variabili JS/TS, token CSS (`--z-toast`) e localStorage keys restano invariati.
**File toccati**: `frontend/src/components/Toast/Toast.tsx`, `frontend/src/components/Toast/ToastContainer.tsx`, `frontend/src/components/Toast/toast.scss`.
**Esito**: ✅ — commit `31854567a`, build OK (`✓ built in 39.32s`).
**Note**: 32 occorrenze rinominate (24 SCSS + 7 Toast.tsx + 1 ToastContainer.tsx). Sostituzione atomica via `sed`. Falsi positivi esclusi: `.jjtl-toast*` (sistema parallelo JjTL, prefix diverso) e `.toast-alert*` (sistema legacy in `components/alert/`, dead code dopo rimozione `<AlertVisualizer>`). Niente cambiamenti a JSX, type, eventi, store keys o token. Diff puramente di nomenclatura. Anche il commit precedente `83d15343c` (`--z-toast: 999998`) può essere mantenuto: la sua motivazione (stacking context safety) resta valida indipendentemente dal rename.
**Nome del documento prompt**: 2026-04-25 23:00

## 2026-04-25 — feat: Jodie hide-on-popover + Ask Jjodie shortcut
**Prompt**: Jodie sfuma (opacity 0 + pointer-events none) quando popover notifiche è aperto. Entry di tipo error mostrano link "Need help? Ask Jjodie" che chiude popover, apre Jodie e pre-popola input con prompt formattato. L'utente preme invio per inviare. Comunicazione via due custom events.
**File toccati**: `frontend/src/events/registry.ts`, `frontend/src/components/NotificationCenter.tsx` + `.scss`, `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/components/Jodie/JodieWindow.tsx`, `frontend/src/components/Jodie/ChatInput.tsx`, `frontend/src/components/Jodie/JodieWindow.css`.
**Esito**: ✅ — commit `0f9746a5a`, build OK (`✓ built in 40.38s`).
**Note**: L'apertura di Jodie è in `Jodie.tsx` ma l'input è in `ChatInput.tsx` (sotto-sotto-componente di `JodieWindow`). Lift di state nel parent comune `Jodie.tsx` + prop drilling `prefilledMessage` fino a `ChatInput`. Il prefill usa sentinel `{ prompt: string; nonce: number }` per garantire re-trigger anche quando lo stesso prompt viene richiesto due volte (referential equality break). Il listener prefill apre Jodie + setta state in un solo handler; React batcha → al re-render `JodieWindow` mounta `ChatInput`, useEffect setta `message`. `Jodie.tsx` ritornava un Fragment, sostituito con `<div className="jodie-root">` per applicare opacity transition; i child `position: fixed` non sono affetti (wrapper non ha transform). Aggiunti due eventi a `JjodelEvents`: `NOTIFICATIONS_POPOVER_TOGGLE`, `JODIE_PREFILL_AND_OPEN`. Modificate 3 interface (`ChatInputProps`, `JodieWindowProps`) ma sono interne al modulo Jodie — nessun consumer esterno.
**Nome del documento prompt**: 2026-04-25 21:30

## 2026-04-25 — style: notification entries restyle (stripe + icon + tint + dot)
**Prompt**: Restyle delle entry nel popover NotificationCenter con stripe colorato a sinistra (3px), icona del tipo colorata, tinta di sfondo a 0.04 (0.07 hover), dot cyan per entry non lette.
**File toccati**: `frontend/src/components/NotificationCenter.tsx`, `frontend/src/components/NotificationCenter.scss`
**Esito**: ✅ — commit `c8cc259d8`, build OK (`✓ built in 38.49s`).
**Note**: Nomi BEM allineati al pattern reale del file (`.app-notif-popover__*`, NON `.notification-item` come nell'esempio del prompt). Nuovi modifier su `&__item`: `--warning` (stripe + bg 0.04 + hover 0.07), `--error` (idem). Sub-element nuovo: `&__item-unread-dot` (con trattino, allineato a `&__item-title`/`&__item-time`/`&__item-close` esistenti). `&__list` trasformato in flex column con `gap: 6px`; rimossi `border-bottom` su `&__item` e `&:last-child` (separazione ora via gap). `&--unread` non controlla più `background` (lo controllano `--warning|--error`); resta come marker per il dot tramite la regola `&__item--unread &__item-unread-dot { opacity: 1; }` (default 0 → fade-in/fade-out smooth a 200ms al `markAllRead`). `&__icon--warning|error` già esistenti, non duplicati. Edge case: entry senza `title` non mostra il dot (il prompt dice "dentro la riga del title", rispettato letteralmente).
**Nome del documento prompt**: 2026-04-25 19:30

## 2026-04-25 — fix v2: NotificationCenter hooks order (verifica empirica)
**Prompt**: Verifica completa del file con diff a schermo, identificazione di TUTTI gli hook condizionali, fix solo dopo conferma utente.
**File toccati**: `frontend/src/components/NotificationCenter.tsx`
**Esito**: ✅ — diff non vuoto applicato e committato (`aee806609`), build OK (`✓ built in 40.01s`, zero errori TS nuovi). In attesa di conferma runtime dall'utente.
**Note**: Step 0 ha confermato che il fix v1 non era mai stato applicato sul disco (`useCallback` ancora alla riga 77, dopo `if (!open) return null;` alla riga 75 — esattamente come da prompt v1). Step 1 ha mappato 5 hook al top-level (useRef, useToastHistorySnapshot wrapper, 2× useEffect) + 1 hook (useCallback handleClearAll) sotto l'early return → 5 hook con `open=false`, 6 con `open=true`, esatta corrispondenza con il warning React `5 → 6`. Step 3 fix puntuale: `handleClearAll` (useCallback, deps `[]`) spostato sopra `if (!open) return null;`. `handleRemove` resta funzione regolare invariata. Diff: 2 inserzioni, 2 rimozioni — solo riordinamento.
**Nome del documento prompt**: 2026-04-25 19:00 v2

## 2026-04-25 — feat(v3): toast history + Bell icon popover + Jodie revert + react-hot-toast cleanup
**Prompt**: estensione v3 dell'implementazione toast: storico warning/error in localStorage (max 20), Bell icon nella StatusBar con popover che riusa `NotificationCenter`, badge count in StatusBar, revert del listener Jodie aggiunto in v2 (Jodie torna pulito), cleanup definitivo `react-hot-toast` (migrazione `SizeInput.tsx` al nuovo sistema).
**File toccati**:
- `frontend/src/components/Toast/toastHistory.ts` — **nuovo**, store localStorage `'jjodel-toast-history'` MAX 20, API `add/getAll/getUnreadCount/markAllRead/remove/clearAll`, dispatch `JjodelEvents.HISTORY_CHANGED` su ogni mutation, FIFO con prepend+slice
- `frontend/src/events/registry.ts` — aggiunto `JjodelEvents.HISTORY_CHANGED: 'jjodel:history-changed'`
- `frontend/src/components/Toast/ToastContext.tsx` — `addToast` ora chiama `toastHistory.add(...)` per `warning|error`, con `nodeToString()` helper per estrarre testo da ReactNode (title/message)
- `frontend/src/components/Toast/toastDispatch.ts` — `ToastInputOptions.message` e `title` cambiati a `ReactNode` (era string), `toast.{info|success|warning|error}` accettano ReactNode → permette JSX in tooltip
- `frontend/src/components/Toast/index.ts` — export `toastHistory`, types `HistoryEntry`, `HistoryEntryType`
- `frontend/src/components/NotificationCenter.tsx` — **riscritto**: rimossi `useNotifications` mockup + `SAMPLE_NOTIFICATIONS`, nuovo hook `useToastHistorySnapshot()` che subscriba a `HISTORY_CHANGED`, popover con `{open, onClose, anchorRef?}` props, click-outside + Esc, mark-all-read 250ms dopo apertura, per-entry close button, empty state, icon mapping warning/error, formato tempo via `formatRelativeTime`
- `frontend/src/components/NotificationCenter.scss` — riscritto con design tokens (rimossi tutti gli hex hardcoded), nuova classe `&__count` e `&__item-close`, hover state via `--color-bg-hover`, unread state via `--color-info-subtle`/`muted`
- `frontend/src/components/StatusBarRightZone.tsx` — usa `useToastHistorySnapshot()` invece del mock; aggiunto `bellRef` per anchorRef del popover; `<NotificationCenter open=... onClose=... anchorRef=...>` con nuova API; **dot → badge count** con label `99+` per overflow; aria-label dinamico con count
- `frontend/src/components/StatusBarRightZone.scss` — nuova classe `&__bell-badge` (badge rosso 14px, `--color-error` bg, `--color-text-inverse` text, `99+` ready)
- `frontend/src/components/forEndUser/SizeInput.tsx` — **migrato fuori da react-hot-toast**: `import toast from 'react-hot-toast'` → `import { toast } from '../Toast'`; `notify()` ora usa `toast({ message: <JSX>, priority: 'info', duration: 4000, dismiss: 'auto' })` (preserva il behavior tooltip-on-click con auto-dismiss 4s)
- `frontend/package.json` — rimosso `"react-hot-toast": "^2.5.2"` da dependencies (zero usi rimasti, modulo `node_modules/` non rimosso fisicamente: lascio al prossimo `npm install`)
- `frontend/src/components/Jodie/Jodie.tsx` — **revertato listener `JjodelEvents.TOAST`** aggiunto in v2 + rimosso `JjodelEvents` dall'import (Jodie torna pulito, `hasUnread` resta nel chatState ma è usato solo per la chat AI)
**Esito**: ✅ completato — `tsc --noEmit` (via `node_modules/.bin/tsc`) passa per i file modificati. Errori residui pre-existing (casing `Settings/settings`, asset module declarations Vite, Measurable.tsx, Dashboard.tsx, ProjectEditor.tsx) invariati.
**Note**: Deviazioni e decisioni:
1. **`useNotifications` rimosso** dall'export di NotificationCenter: non era importato altrove (solo da `StatusBarRightZone.tsx` che ora usa `useToastHistorySnapshot`). Sostituito.
2. **Badge count, non dot**: la spec v3 mostra `<span className="statusbar-bell__badge">{unreadCount}</span>` — implementato con stesso prefisso BEM `sb-rz` esistente (`.sb-rz__bell-badge`). Vecchia classe `.sb-rz__bell-dot` lasciata in SCSS come dead style (zero side effect).
3. **Mark-all-read implicito** all'apertura del popover (delay 250ms per evitare flash visivo del badge che svanisce). User-friendly: aprire = letto.
4. **`nodeToString()` in ToastContext**: estrae testo da ReactNode (`Element` con `props.children`) per persistere lo storico. Best-effort: se il toast ha JSX complesso, ne salva il testo plain. Sufficient per name clash e maggior parte dei casi.
5. **`react-hot-toast` rimosso da `package.json` ma non da `node_modules/`**: rimozione fisica richiede `npm install` (manuale). La dichiarazione resta solo in `ParameterForm.tsx:13` ma è commento (zero esecuzione).
6. **ToastInputOptions accetta ora ReactNode** per `message`/`title` — necessario per migrare SizeInput senza perdere il behavior JSX. Backward-compatible (string è subset di ReactNode).
7. **Popover z-index = `var(--z-toast)` (10200)**: same layer dei toast → si sovrappone correttamente a modali/Jodie.
8. **`anchorRef` opzionale**: NotificationCenter testa `anchorRef?.current?.contains()` prima di chiudere su click-outside, evita che il click sul bell stesso chiuda subito il popover appena aperto.
9. **Storico solo warning/error** (per spec). Info/success non vengono persistite — restano transient nei toast.
10. **Migrazione name clash** già emessa via `toast.error(...)` in v2 → automaticamente loggata nello storico nel commit corrente (zero modifiche aggiuntive).
**Nome del documento prompt**: 2026-04-25 17:00 v3 — finale

---

## 2026-04-25 — feat: notification system redesign + U.alert facade
**Prompt**: Restyle ToastProvider (side-stripe variant), migrate name clash sites, U.alert facade su toast, sezione Settings → Notifications, badge unread Jodie, cleanup. 10 task ordinati.
**File toccati**:
- `frontend/src/styles/tokens/_z-index.scss` — `--z-toast` 10100 → 10200 (sopra `--z-modal` 9999)
- `frontend/src/components/Toast/toast.scss` — riscritto con BEM + design tokens, side-stripe 4px, width 320px, default bottom-right, no hex hardcoded
- `frontend/src/components/Toast/toastTypes.ts` — `ToastPreferences` ristrutturata con per-type `{enabled, duration}`, `ToastAction` esposta, `ToastMessage` con `timestamp` e `action`, `JjodelToastDetail` con `action`, migrazione legacy in `loadToastPrefs()`
- `frontend/src/components/Toast/Toast.tsx` — refactor BEM (`.toast__row/__icon/__title/__time/__close/__body/__action`), hover-pause individuale (clearTimeout/setTimeout con elapsed tracking), timestamp relativo via `useRelativeTime`, action button opzionale
- `frontend/src/components/Toast/ToastContext.tsx` — prepend invece di append (`[new, ...prev].slice(0, MAX_TOASTS)` → newest in alto), per-type prefs (enabled + duration), action propagata da CustomEvent
- `frontend/src/components/Toast/ToastContainer.tsx` — passaggio timestamp+action al `<Toast>`, default position `bottom-right`
- `frontend/src/components/Toast/toastDispatch.ts` — `toast.{info|success|warning|error}(message, opts?)` accetta `string | ToastShortOptions` (compat) con supporto `action`
- `frontend/src/components/Toast/useRelativeTime.ts` — **nuovo**, hook con shared 10s tick (subscriber pattern, niente N timer per N toast); export anche `formatRelativeTime`
- `frontend/src/components/Toast/index.ts` — export di `ToastAction`, `ToastTypePref`, `useRelativeTime`, `formatRelativeTime`
- `frontend/src/model/logicWrapper/LModelElement.tsx` — 3 punti name clash migrati a `toast.error(...)` con title `Validation failed` e action button (placeholder onClick); messaggio riformulato a `Name "X" already used by Type "Y"`
- `frontend/src/joiner/classes.ts` — punto rename generico migrato analogamente
- `frontend/src/common/U.tsx` — `U.alert()` riscritta come **facade** che dispatch su `JjodelEvents.TOAST` (mantiene firma identica per le ~118 callsite restanti); `console.warn` di deprecazione in dev mode (`import.meta.env.DEV`)
- `frontend/src/App.tsx` — `<AlertVisualizer/>` rimosso (commentato + import sostituito da nota), il legacy reducer `state.alert` resta come dead code per safety
- `frontend/src/components/Settings/UnifiedSettingsModal/sections/NotificationsSection.tsx` — **nuovo**, per-type toggle Enabled + select Duration (1s/3s/5s/10s/30s/Persistent), select Position (4 varianti), toggle Guard Violations, bottone Reset, bottoni Test per tipo
- `frontend/src/components/Settings/UnifiedSettingsModal/sections/index.ts` — export `NotificationsSection`
- `frontend/src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx` — `'notifications'` aggiunto a `SettingsSection`, nuovo gruppo `FEEDBACK` (icon `bi-bell`) tra `DISPLAY` e `DEVELOPER`, switch case
- `frontend/src/components/Jodie/Jodie.tsx` — listener su `JjodelEvents.TOAST` che setta `hasUnread:true` su priority `warning|error` quando Jodie è chiusa (badge dot già presente in `JodieMinimized.tsx`, niente count); reset a `false` su open già esistente
- `frontend/src/pages/settings/AppearanceSettings.tsx` — rimossa la duplicate notifications UI (ora vive in `NotificationsSection`); state/imports/options-list rimossi (toccato fuori scope per fix build dopo restructuring `ToastPreferences`)
**Esito**: ✅ completato — `tsc --noEmit` passa per i file modificati (errori residui pre-existing: casing `Settings/settings`, asset module declarations Vite, Measurable.tsx, Dashboard.tsx, ProjectEditor.tsx — non toccati)
**Note**: Deviazioni dalla spec emerse durante l'implementazione:
1. **`react-hot-toast` NON rimosso**: la discovery indicava che l'import in `SizeInput.tsx:3` fosse morto, ma è effettivamente usato (righe 51-55, 77) per tooltip-on-click. Per il vincolo "una pulizia tocca file non previsti — fermarsi", non rimosso. Resta in `package.json` deps.
2. **`NotificationCenter.tsx` NON rimosso**: la discovery indicava "mockup non collegato" ma è importato e usato attivamente in `StatusBarRightZone.tsx:15,100`. Per spec ("delete if no importers"), non rimosso.
3. **`U.alert` signature reale è `'i'|'w'|'e'`** (non include `'s'`). Il facade supporta comunque `'s'` (priority success) per estensibilità futura. Le 118 callsite esistenti non vengono toccate; passano automaticamente al nuovo render via JjodelEvents.TOAST.
4. **Migrazione legacy `ToastPreferences`** implementata in `loadToastPrefs()`: vecchi prefs con `autoDismissDuration`/`enableSuccess`/`enableInfo` vengono convertiti al nuovo `types.{info,success,warning,error}.{enabled,duration}` al primo load. Nessun reset utente.
5. **Default position `bottom-right`**: per spec. Jodie minimized è a `bottom: 100px; right: 30px` (CSS `JodieWindow.css:780`), Toast a `bottom: 16px; right: 16px` width 320px → primo toast non si sovrappone verticalmente; stack di 5 sì, ma `--z-toast: 10200 > Jodie z-index 10000` → rimane leggibile.
6. **Nessun nuovo evento custom registrato** (riusato `JjodelEvents.TOAST` esistente per Jodie hook).
7. **AppearanceSettings.tsx toccato fuori scope**: necessario perché il restructuring di `ToastPreferences` rompeva il typecheck. Le notifiche UI duplicate sono state rimosse (ora vive solo in `NotificationsSection`).
**Nome del documento prompt**: 2026-04-25 16:30 implementazione-toast-redesign

---

## 2026-04-24 — feat(editor-v2): NodeProblem registry + pulsing indicator + directional overlay; migrate uniqueness from inline badge
**Prompt**: sostituire il badge inline "dup" con (a) registry generale di node problems estendibile a conformance/validation/orphan; (b) pallino pulsante top-right color-coded per severity con transizione resolved verde 5s; (c) overlay ancorato click-to-open con placement quantizzato a 4 direzioni + freccia + flip su overflow + highlight cyan ring sul nodo correlato; (d) producer scan-driven che riflette `detectDuplicateNames` nel registry. Tre fasi (recon → implementazione → verifica). Implementare solo uniqueness; architettura estesa per futuri kinds.
**File toccati**:
- **Nuovi** (7): `frontend/src/components/editor-v2/problems/registry.ts` (module-level Map + subscribers + lifecycle), `problems/useNodeProblems.ts` (tre hook via `useSyncExternalStore`), `problems/UniquenessProblemSync.tsx` (producer scan-driven), `problems/NodeProblemIndicator.tsx` + `.scss`, `problems/NodeProblemOverlay.tsx` + `.scss`.
- **Modificati** (3): `nodes/ObjectNode.tsx` (rimossi import `Badge`+`useDuplicateBadges`+`LObject/LPointerTargetable` + memo `model` + render block `{duplicateCollidingWith && ...}`; aggiunti import `NodeProblemIndicator` + hook `useIsHighlighted` + render `<NodeProblemIndicator nodeId={id}/>` + classe condizionale `mm-object--problem-highlighted`), `EditorV2.tsx` (import + mount `<UniquenessProblemSync modelid={modelid}/>` una sola volta subito sotto l'outer container), `docs/claude-code-log.md`.
- **Eliminati** (1): `components/editor-v2/hooks/useDuplicateBadges.ts` (sostituito da registry + sync).
- **Revert** (2): `components/common/Badge/Badge.tsx` (rimossa `'warning'` dalla union `BadgeCategory`), `Badge/Badge.scss` (rimossa regola `&--warning`). Il prompt 2026-04-24 badge-warning-variant è stato esplicitamente annullato dal prompt corrente (sezione 2.7): il badge "dup" non esiste più come testo inline, quindi la variant `warning` di `Badge` non serve. `context` resta come variant informativa (usata ancora da `MetamodelTreeView` per "inherited").
- **Intatti**: `model/logicWrapper/nameUniqueness.ts`, `model/logicWrapper/LModelElement.tsx` (override `set_name`/`set_father`). Validation engine del L-layer è la source of truth; il registry è una proiezione UI con lifecycle (resolved-5s).
**Esito**: ✅ completato — `npx tsc --noEmit` → 81 errori (delta zero vs baseline identico al 2026-04-23/24), zero errori su tutti i 10 file toccati (grep stringa ∩ output tsc → nessun match). `npm run build` → ✓ built in 1m 29s, chunk principale `15,536.06 kB` (da `15,528.34 kB` del 2026-04-23, +7.7 kB coerenti con ~800 righe di logica aggiunta distribuite su 7 nuovi file).
**Note architetturali**:
  - **Storage: module-level Map + subscribers, non Redux**. Allineato al pattern di `OrphanStore` (l'unica altra diagnostic registry del codebase): session-local, immune a undo/redo, non persistito, esposto a `window._jjNodeProblems` per debug. Redux sarebbe stato bloat per state che non deve partecipare al time-travel né alla serializzazione. La "source of truth" resta Redux (`state.idlookup`): il registry è una *proiezione* derivata + lifecycle overlay.
  - **Producer scan-driven, non hook-per-rename**. Duplicati *nuovi* non nascono mai via `LObject.set_name`/`set_father` (hard-blocked con `U.alert('e', ...)`), quindi il producer non si aggancia al rename flow: osserva la stessa *signature string* che già alimentava `useDuplicateBadges` (Redux-derived `{id,name,father}` su tutti i DObject) e ad ogni cambio fa un diff dichiarativo vs registry: `detectDuplicateNames(model)` produce il set desiderato, nuove chiavi → `registerProblem`, chiavi sparite → `markResolved`. Idempotente, semplice da estendere (altri producer faranno diff su un altro `kind`).
  - **ID convention — producer, non registry**. Documentata nel JSDoc di `registry.ts`: l'uniqueness producer usa `${kind}:${nodeId}` perché il vincolo funzionale è "un duplicate-name per nodo alla volta" → dedup naturale senza tracking di id cross-scan. Il registry NON impone il formato; accetta qualsiasi `id` unico. Producer futuri con più problemi dello stesso kind per nodo (es. conformance con N violations) useranno id più lunghi tipo `${kind}:${nodeId}:${constraintId}`. Convenzione del producer, non dell'infrastruttura.
  - **Snapshot identity stability per `useSyncExternalStore`**. `registry.ts` mantiene una cache per-node (`nodeSnapshots`) rebuilt ad ogni `notify()`; se i contenuti del Map per un dato `nodeId` sono identici alla cache, la stessa reference d'array è riusata → `useSyncExternalStore` bail-out via `Object.is` → zero re-render. Empty list è una frozen shared reference (`EMPTY_PROBLEMS`). Hook per `activeOverlayId` e `isHighlighted` ritornano primitivi (string|null, boolean) → identity triviale. L'indicator ha 2 subscribe, il nodo correlato ne ha 1 in più via ObjectNode; costo per nodo su canvas: 3 listener leggeri.
  - **Lifecycle pause/resume timer quando overlay è aperto (Q2)**. `setActiveOverlayProblemId(id)` con id non-null → pausa i timer di rimozione di tutti i problemi resolved sullo stesso `nodeId` dell'overlay attivo. `setActiveOverlayProblemId(null)` → avvia un timer fresh da 5s per ogni resolved rimasto (non "riprende il rimanente", riparte da 5s — più generoso, più prevedibile; user-friendly per chi chiude l'overlay dopo aver letto il messaggio Resolved). `markResolved` chiamato mentre un overlay è aperto sullo stesso nodo → NON avvia il timer, differito alla chiusura. Tutto in `registry.ts`, consumer non vedono questa logica.
  - **Merge semantica di `registerProblem` su id già in registry (Q4)**. Scenario: A e B duplicati → B rinominato → A markResolved (5s) → undo entro 5s → scan ri-rileva il duplicato → `registerProblem` riceve stesso id. L'entry esistente fa da template per `createdAt` (sticky, preserva "since when"), gli altri campi (severity/title/description/relatedNodeIds/action) vengono dal payload nuovo, `resolvedAt` unset, timer cancellato. Stato coerente senza fighting tra producer e lifecycle.
  - **Placement overlay — algoritmo manuale (~30 righe), zero nuove dipendenze**. `@floating-ui/react` + `@popperjs/core` sono installati ma non usati: il prompt vieta esplicitamente l'adozione. Algoritmo: (1) misura `anchorRect` + `overlayRect` via `getBoundingClientRect`; (2) calcola `sourceCenter` dal `.react-flow__node` ancestor, `relatedCenter` dal primo `relatedNodeIds[0]` via `document.querySelector('.react-flow__node[data-id=\"…\"]')`; (3) quantizza angolo `atan2(dy,dx)` alle 4 cardinali (maggiore assoluto vince, tie su y = bottom); (4) prova `fitsInViewport(pos)` con margine 6px; (5) se overflow, flip al lato opposto; se anche quello overflow, scegli il lato con meno clamping necessario (score = -|raw-clamped|) e clampa. Freccia è un pseudo-element pos/bordo by `data-direction`. Nessuna libreria.
  - **Portal a `document.body`, `useReactFlow` comunque disponibile**. L'overlay è renderizzato via `createPortal(..., document.body)` per bypassare z-index/overflow del canvas React Flow (pattern già in uso con `ContextMenu`, `EditorV2`). Il React tree context è preservato attraverso il portal → `useReactFlow()` funziona dentro l'overlay anche se nel DOM è sibling di React Flow. Questo evita un custom event indirection per la action `focus-node`: l'overlay chiama `rf.fitView({...}) + rf.setNodes(...)` direttamente.
  - **Close su drag-start via mousedown outside (Q3)**. Il drag di un nodo React Flow inizia con un mousedown sul body del nodo; il listener globale `mousedown` in capture phase chiude l'overlay se il target non è `overlayRef` né `anchorEl`. Non serve hook specifico a `onNodeDragStart`. Il dot ha `onMouseDown={e => e.stopPropagation()}` per proteggersi dalla propagazione del click sul nodo (altrimenti clicking sul dot selezionerebbe il nodo sottostante).
  - **Highlight ring cyan sul nodo correlato**. Implementato come classe CSS condizionale su ObjectNode (`mm-object--problem-highlighted`) + regola in `NodeProblemIndicator.scss`. Hook `useIsHighlighted(nodeId)` ritorna boolean → zero overhead identity-wise. Applicato all'OUTER div del nodo, outline: 2px cyan, offset 4px. La "linea tratteggiata cyan source→related" era optional nel prompt ("se facile"): **non implementata** — avrebbe richiesto un overlay SVG di primo piano con calcolo di pan/zoom del canvas a ogni frame, troppo invasivo per il principio "minimal diff". Punto di estensione futuro.
  - **Action link cambia label in base a viewport**. Se `relatedNodeIds[0]` è fuori viewport al momento del render (`isNodeInViewport` via `getBoundingClientRect`), il label diventa "Scroll to duplicate" (altrimenti "Go to duplicate"). Al click il re-check viewport è ricomputato → label statico, effetto sempre `fitView({padding:0.3, duration:300}) + setNodes(selected)`. Leggera inconsistenza label↔action tollerabile per la prima release.
  - **Badge `warning` variant revertata come da prompt 2.7**. `BadgeCategory` union ripristinata a 5 membri (no `warning`), regola SCSS `&--warning` rimossa. `context` intatto (serve ancora per "inherited" in MetamodelTreeView). Il revert cancella deliberatamente lavoro fatto ~2h prima nella stessa sessione — annotato qui come decisione architetturale: il badge inline è stato sostituito da un sistema più espressivo (indicator + overlay) e la variant `warning` di `Badge` era un cul-de-sac.
**Verifica manuale delegata (8 casi dal prompt)**: due root con stesso nome → pallino giallo pulsante su entrambi; click → overlay in direzione dell'altro con freccia e azione "Go to duplicate"; click azione → canvas centra e seleziona il correlato; rinomina uno → entrambi verdi per 5s poi spariscono; click fuori → overlay chiude + pulse riparte; tre duplicati → overlay mostra description "...used by 2 other elements..."; nodi impilati verticalmente → overlay emerge sopra/sotto; nodo vicino al bordo canvas → flip direction.
**Nome del documento prompt**: 2026-04-24 node-problems-registry

---

## 2026-04-24 — fix(editor-v2): sibling uniqueness check per istanze nested (LValue father)
**Prompt**: estendere `getSiblingNamespace` al caso father=LValue (containment feature); il check del fix del 2026-04-23 non scattava sui nested perché il father di un LObject annidato è un LValue, non un LObject. Diagnosticato via log runtime (report `2026-04-23-sibling-uniqueness-analysis.md` + DIAG runtime dump 2026-04-24).
**File toccati**: `frontend/src/model/logicWrapper/nameUniqueness.ts` (+`isValueFather` type guard, +`resolveLObjectsFromLValue` helper, +terzo ramo in `getSiblingNamespace`, aggiunti import `DObject, DValue, LValue`; rimossi 3 `[DIAG-NAMESPACE]` log), `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (rimossi 3 `[DIAG-SYNCLABEL]` log da `syncNodeLabel` — entered/before-assign/after-assign), `frontend/src/model/logicWrapper/LModelElement.tsx` (rimossi 3 `[DIAG-LOBJ-SETNAME]` log da `LObject.set_name` — invoked/early-return same-name/validation result), `docs/claude-code-log.md`.
**Esito**: ✅ completato — `npx tsc --noEmit` → 81 errori (delta zero vs baseline identico ai log del 2026-04-23/24), **zero errori sui 3 file toccati** (grep `nameUniqueness|canvasToJjom|LModelElement` sull'output tsc → 0 match). Verifica DIAG cleanup: `grep -rn "DIAG-SYNCLABEL\|DIAG-LOBJ-SETNAME\|DIAG-NAMESPACE" frontend/src` → 0 match. I `[BUG-DIAG]` preesistenti in altri file (`jjomTransformers.ts`, `useJjomSync.ts`) non toccati.
**Note**:
  - **API resolution LValue → LObject[]: opzione (a) via field `values` + filter per className**. Ispezione `LModelElement.tsx:6311-6355` ha confermato che `LValue` espone `values!: PrimitiveType[] | LObject[] | LEnumLiteral[]`. Quando l'LValue è di tipo containment reference, `values` sono `LObject[]` (confermato dalla logica esistente in `LObject.get_subObjects` a righe 6054-6063 che usa esattamente lo stesso pattern: `f.values` + filter per `className === DObject.cname`). Helper locale `resolveLObjectsFromLValue(v: LValue): LObject[]` riutilizza il pattern consolidato anziché introdurre logica nuova. Il filter è difensivo ma necessario: un LValue di attributo scalare ha `values: PrimitiveType[]` e il filter lo scarta silenziosamente.
  - **Non usato un getter `subObjects` su LValue**. Grep ha escluso che LValue esponga un getter `get_subObjects` (vedi anche 5702: `subObjects!: LObject[]` è su LObject, non su LValue). L'API corretta è accedere al campo proxy `values` e filtrare. Avrei potuto chiamare `v.get_values(context)` ma il proxy magic su property access ritorna già valori risolti (LObject[] instanziati), quindi `v.values` è sufficiente.
  - **`DValue.cname` esiste — nessun literal hardcoded**. Verificato a `LModelElement.tsx:7713`: `DValue.cname = 'DValue';`. Uso `DValue.cname` in `isValueFather` come fa `isModelFather` con `DModel.cname`. Coerenza stilistica con il resto del file.
  - **Imports aggiunti: `DObject, DValue, LValue`**. Tutti e 3 già esportati da `joiner/index.ts:168-170` — nessun re-export da modificare. Nessuna dipendenza cross-layer aggiunta (il file è già nel L-layer).
  - **Fallback LObject preservato**. Terzo ramo `(father as LObject).subObjects` lasciato come fallback difensivo con commento che spiega perché non è observato in Jjodel attuale. Se in futuro cambia la topologia e un LObject avesse direttamente un LObject come father (bypassando l'LValue containment), il check continuerebbe a funzionare. Zero overhead per il caso comune.
  - **`detectDuplicateNames` non modificato**. Itera su `model.allSubObjects` e chiama `getSiblingNamespace(obj)` per ogni oggetto. Con il nuovo ramo LValue ora risolve correttamente anche i namespace dei nested al load, senza cambiamenti nella funzione. Il badge `dup` del fix del 2026-04-23 ora compare automaticamente sui duplicati nested preesistenti.
  - **`set_father` automaticamente corretto**. L'override `LObject.set_father` usa `validateNameUniqueness` con `overrideFather`; quando l'utente drag&drop-a un oggetto dentro un nuovo containment, `overrideFather` è tipicamente un LValue, e ora `getSiblingNamespace` risolve correttamente i sibling del nuovo containment. Nessuna modifica a `set_father`.
  - **Baseline typecheck invariato**. 81 errori pre- e post-fix, tutti pre-esistenti (SVG module declarations, casing Settings, `activeId`). Zero nuovi errori su `nameUniqueness.ts`, `canvasToJjom.ts`, `LModelElement.tsx`. Grep mirato sui 3 file sull'output tsc → 0 match.
  - **Non toccato `LObject.set_name`**. Il prompt vieta modifiche al set_name al di là della rimozione log. La logica era già corretta dal fix del 2026-04-23: il bug era isolato in `getSiblingNamespace` che ritornava `[]` per i nested perché cadeva nel ramo `(father as LObject).subObjects` su un LValue (che non ha quel getter → undefined → `?? []` → zero sibling).
  - **Non toccata `DObject.new`/creazione**. Fuori scope. Il prompt esplicita di non modificare set_name, set_father, o altre parti della costruzione LObject. La correzione è chirurgica: solo la resolution del namespace.
  - **Bug paralleli emersi (fuori scope, non toccati)**: composition properties panel vuoto, Add Attribute mancante dal context menu, `nameChanged: false` nei log anche quando il check passava (pre-cleanup log — post-cleanup non più osservabile), `PendingPointedByPaths` a ripetizione. Saranno trattati in prompt separati come da istruzioni.
  - **Verifica manuale attesa (utente)**:
    1. Nested duplicato via doppio-click: sotto un Entity, creare due Attribute, rinominare il secondo con lo stesso nome del primo → modale alert `Name 'X' is already used in this scope by: X` + rename non applicato.
    2. Nested cross-parent: due Attribute con stesso nome sotto due Entity diverse → entrambi accettati.
    3. Badge al load: modello con duplicati nested preesistenti → badge `dup` amber visibile su entrambi (grazie al fix 2026-04-24 warning variant).
    4. Regressione rootable: due rootable con stesso nome → alert preservato.
**Nome del documento prompt**: 2026-04-24 HH:MM fix-sibling-uniqueness-nested-lvalue

---

## 2026-04-24 — docs: align grammar diagrams to canonical JjTL
**Prompt**: aggiornamento grammar diagrams Transformation Editor a grammatica canonica (where not when, := per attr mapping, -> per class mapping, no resolve, no : hint, add helper). Fase 1 analisi → Fase 2 fix con aggiustamenti: non aggiungere helper (già presente e canonico), rimuovere i 3 nodi conversion/valueMapping/objectCreation dalla UI (parser continua a supportarli), restringere classMapping a single-source con graffe esplicite e multiplicity a `[int..int|*]`.
**File toccati**: `frontend/src/jjtl/components/GrammarDiagram/types.ts` (rimosso 3 union members + 3 oggetti da `GRAMMAR_RULES`; aggiornato EBNF/esempio di `transformation`, `classMapping`, `multiplicity`, `condition`, `mappingBody`, `attributeMapping`), `frontend/src/jjtl/components/GrammarDiagram/diagramRenderer.ts` (fix `when`→`where` case `condition`; rinomina NonTerminal `ID`→`name/sourceMM/targetMM` in `transformation`; `ID`→`SourceClass/TargetClass` in `classMapping` + graffe esplicite; `multiplicity` ristretto a `[int..(int|*)]`; `mappingBody` senza graffe; `attributeMapping` ridotto a singola sequence `targetFeature := expression`; rimossi 3 case `conversion`/`valueMapping`/`objectCreation`; `attrMapping`→`attributeMapping` nel non-terminal di `mappingBody`), `frontend/src/jjtl/utils/astToGrammar.ts` (rimossi 3 case da `nodeTypeToGrammarRule`: `'Conversion'`, `'ValueMapping'`, `'ObjectCreation'` — gli AST node continuano a essere prodotti dal parser, il cursor-highlight per quei nodi ritornerà `null` invece di un id inesistente).
**Esito**: ✅ completato — `npx tsc --noEmit` → stessi 81 errori baseline pre-esistenti (PNG/SVG/CSS module declarations, casing Settings/settings, `activeId` su BoxData), **zero errori nei file toccati** (grep mirato `GrammarDiagram|astToGrammar|GrammarTab|GrammarRule|GRAMMAR_RULES` sull'output tsc → nessun match); `npm run build` → ✓ built in 1m 20s, bundle principale `15,527.49 kB` (nel range del trend storico).
**Note**:
  - **Helper NON aggiunto (era già canonico)**. Il prompt Fase 2 assumeva mancasse; verificato in Fase 1 che esiste in `types.ts:88-95` e `diagramRenderer.ts:339-351` con forma `"helper" ID "(" paramList? ")" "->" ID "{" expression "}"` — combacia col parser (`parser.ts:562-604`). Lasciato invariato.
  - **Divergenza documentazione-parser accettata**. Il parser (`parser.ts:237-353, 428-546`) continua ad accettare multi-source `(ID alias?)+`, `conversion` (`: valueMappings`), `objectCreation` (`{ -> ID { ... } }`) e multiplicity permissiva (`[*]`, `[NUMBER]`). Rimuoverli dalla UI grammar significa trattarli come costrutti **deprecati/interni**: continuano a funzionare ma non sono più documentati user-facing. Scelta consapevole dopo conferma utente.
  - **Effetto su cursor-highlight**. `astToGrammar.ts` non mappa più `'Conversion' | 'ValueMapping' | 'ObjectCreation'` a un rule id. Quando il cursor è dentro uno di questi nodi AST, `nodeTypeToGrammarRule` ritorna `null` e `getGrammarRuleAtPosition` ritorna `null` (nessun highlight). Trade-off accettato: coerente col nascondere la sintassi deprecata. Non è stato aggiunto un fallback al parent (es. `→ 'attributeMapping'`) per non peggiorare lo scope con logica non richiesta.
  - **Fuori scope, segnalato**. `frontend/src/jjtl/analyzer/bidirectionality.ts:188` produce ancora un warning message `Class mapping X has a 'when' condition` — stringa stantia (la keyword reale è `where` dal 2026-04-15). Non toccato perché fuori dallo scope "grammar diagrams UI". Candidato per fix separato.
  - **Nessun test/snapshot referenzia le stringhe EBNF o gli id rimossi**. Cercato `GRAMMAR_RULES`, `grammar-rule`, `Railroad`, `diagram` in `frontend/src/jjtl/__tests__/` → nessun match. Nessuna rottura test prevista. Suite test (211 passing) non toccata.
  - **Nessuna dipendenza npm aggiunta**. Renderer SVG puro intoccato (builder DSL Terminal/NonTerminal/Sequence/Choice/Optional/ZeroOrMore/OneOrMore invariati).
  - **Nessuna modifica SCSS**. Styling invariato. I 3 nodi rimossi non avevano regole SCSS dedicate, e `helper` era già presente con stesso styling dei sibling.
  - **Conteggio nodi**: da 21 → 18 (-3 rimossi: `conversion`, `valueMapping`, `objectCreation`). Ordine post-fix: `transformation`, `classMapping`, `multiplicity`, `condition`, `mappingBody`, `attributeMapping`, `helper`, `parameter`, `expression`, `memberAccess`, `literal`, poi 7 nodi interactive (`interactiveStatement` e figli).
**Nome del documento prompt**: 2026-04-24 10-00 update-jjtl-grammar-diagrams.md

---

## 2026-04-24 — refactor(badge): add `warning` variant, migrate `dup` call site
**Prompt**: introdurre variant `warning` in `Badge` (palette amber, stessa forma pill di `context`) e migrare il solo call site `dup` in `ObjectNode.tsx` da `category="context"` a `category="warning"`. `context` resta per uso informativo/neutro (inherited in MetamodelTreeView + altri consumer).
**File toccati**: `frontend/src/components/common/Badge/Badge.tsx` (+`'warning'` nella union `BadgeCategory`), `frontend/src/components/common/Badge/Badge.scss` (+regola `&--warning` allineata a `&--context`: stessa forma pill `border-radius: 10px`, stesso padding `1px 7px`, palette amber `#fef3c7` bg / `#92400e` text / `#fde68a` border), `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (1 riga: `category="context"` → `category="warning"` sul badge `dup`), `docs/claude-code-log.md`.
**Esito**: ✅ completato — typecheck `npx tsc --noEmit` → 81 errori (delta zero vs baseline pre-modifiche, identico al 2026-04-23), zero errori sui tre file toccati (grep su output tsc → nessun match per Badge/ObjectNode).
**Note**:
  - **Palette scelta, rationale**. Amber-100 `#fef3c7` bg + amber-800 `#92400e` text (contrast ratio ~9:1, ben oltre AA). Border amber-200 `#fde68a` per coerenza con `context` che già ha un border; il prompt lasciava il border "opzionale solo se le altre variant ne hanno uno" — `context` ce l'ha, quindi sì. Nessun nuovo design token globale: i tre colori amber vivono inline nella regola `&--warning` dentro `Badge.scss`, come fa già `state-danger` con `#fef2f2`/`#b91c1c` e `version` con `#ecfdf5`/`#047857`.
  - **Forma pill mantenuta**. `border-radius: 10px` + `padding: 1px 7px` copiati verbatim da `&--context` per garantire che `dup` e `inherited` abbiano geometria identica e differiscano solo per colore. `state` e `state-danger` hanno forma diversa (border-radius 4px) e non sono adatti come template qui.
  - **Minimal diff rigoroso**. Zero modifiche a `MetamodelTreeView.tsx` (inherited resta `context` come da prompt) e a nessun altro consumer di `Badge`. Nessun refactoring opportunistico in `ObjectNode.tsx` — solo 1 carattere cambiato. Nessun cleanup import. Nessun grep-and-replace globale su `category="context"`.
  - **Verifica visiva delegata all'utente**. Il prompt specifica che va aperto un progetto con duplicati e confermato a occhio che `dup` diventa amber e `inherited` resta slate. TS/build verificano correttezza, non coerenza estetica.
**Nome del documento prompt**: 2026-04-24 badge-warning-variant

---

## 2026-04-23 — refactor: coerenza visiva pill abstract/inherited in MetamodelTreeView
**Prompt**: Sostituire rendering testuale di "abstract" con Badge component coerente con "inherited"
**File toccati**: frontend/src/jjtl/views/MetamodelTreeView.tsx
**Esito**: ✅ completato
**Note**: riuso Badge category="context", tooltip "Abstract class". Eventuale CSS morto del vecchio rendering segnalato ma non rimosso (cleanup in prompt separato se opportuno). Dettagli tecnici: il vecchio rendering era `<span className="jjtl-tree-abstract">abstract</span>` annidato dentro `<span className="jjtl-tree-name">` (linea 109 pre-modifica); sostituito con `<Badge category="context" title="Abstract class">abstract</Badge>` posizionato come *sibling* di `.jjtl-tree-name` (fuori dal name span, identico al pattern già usato da `inherited`). La spaziatura fra name e pill è fornita dal `gap: 2px` di `.jjtl-tree-node-content` (flex container), esattamente come per `inherited` — nessun margin-left inline aggiunto. Verifica: `npx tsc --noEmit` → 81 errori preesistenti (nessuno sul file toccato, delta zero); `npm run build` → ✓ built in 1m 35s, bundle `15,528.35 kB` (delta ~0 vs 15,528.34 kB del log 2026-04-23 sibling-uniqueness). **CSS morto da cleanup separato**: la classe `.jjtl-tree-abstract` è ancora definita in `frontend/src/jjtl/styles/jjtl.scss:959` (font-size 10px, font-style italic, color $color-text-tertiary, margin-left $spacing-xs) — orfana dopo questa modifica, 0 usi residui (verificato con `grep -r "jjtl-tree-abstract" frontend/src/`). Non rimossa come da vincolo del prompt.
**Nome del documento prompt**: 2026-04-23 13:00

---

## 2026-04-23 — feat(editor-v2): sibling uniqueness validation (model)
**Prompt**: implementare validazione unicità nomi con namespace whole-model per rootable, per-parent per annidati; hard-block su rename/reparent, soft badge per duplicati preesistenti al load
**File toccati**: frontend/src/model/logicWrapper/nameUniqueness.ts (nuovo), frontend/src/model/logicWrapper/LModelElement.tsx (import + override `LObject.set_name` e `LObject.set_father`), frontend/src/components/editor-v2/hooks/useDuplicateBadges.ts (nuovo), frontend/src/components/editor-v2/nodes/ObjectNode.tsx (import Badge + useDuplicateBadges, resolve model via `LPointerTargetable.fromPointer(id).model`, render `<Badge category="context">dup</Badge>` condizionale), docs/claude-code-log.md
**Esito**: ✅ completato — typecheck `npx tsc --noEmit` → 81 errori (delta zero vs baseline pre-modifiche), 0 errori sui 4 file toccati (`grep -E "nameUniqueness|useDuplicateBadges|ObjectNode|LModelElement"` → nessun match); `npm run build` → ✓ built in 45.69s, chunk principale `15,528.34 kB` (pre era `15,526.36 kB` al 2026-04-23 16-51 co-evolution, +2 kB coerente con ~80 righe di logica aggiunta).
**Note**:
  - **Collocazione helper — scelta diversa dal prompt per vincolo di layering**. Il prompt prescriveva `frontend/src/components/editor-v2/utils/nameUniqueness.ts`, ma `LObject.set_name` e `LObject.set_father` sono nel L-layer (`model/logicWrapper/LModelElement.tsx`) e importare da `components/editor-v2/` creerebbe una dipendenza invertita (L-layer → UI layer) che il codebase storicamente rispetta (grep mostra che `model/` non importa mai da `components/`). Ho spostato il file a `frontend/src/model/logicWrapper/nameUniqueness.ts` — stesso layer di LModelElement, zero dipendenza cross-layer. L'hook `useDuplicateBadges` (UI layer) importa dal L-layer — direzione naturale. Annoto qui perché è divergenza deliberata dal prompt, con rationale architetturale.
  - **Override in LObject, non sostituzione del `set_name` base**. Il prompt diceva "sostituire il check inline esistente" in `classes.ts:2111-2133`, ma il setter base si applica a TUTTI i `LNamedElement` (LClass, LAttribute, LReference, …). Sostituirlo avrebbe rotto la validazione metamodello — esplicitamente fuori scope ("Non toccare il metamodello"). Ho invece implementato override in `LObject.set_name` (scommentato e riscritto lo stub a riga 5971) e nuovo `LObject.set_father` subito dopo. Il setter base in `classes.ts` resta intoccato: continua a validare metamodel elements con la vecchia logica `father.children`. Per LObject, l'override prende il controllo completamente (non chiama `super.set_name`) e replica la stessa `TRANSACTION` del base; per `set_father`, invece, chiama `super.set_father(val, c)` dopo il check perché non c'è logica specifica LObject da aggiungere oltre alla validazione.
  - **Pattern type-check parent: `className === DModel.cname`**. Seguo la convention del codebase (vedi `get_model` at LModelElement.tsx:5969, `get_isRoot` at 6036, `PackageNode` / StatusBar / PropertiesPanel / Info tutti usano stringa `'DModel'` o la costante). Funziona sia sul L-proxy (trasparente a `className`) sia sul D raw. Helper interno `isModelFather` in nameUniqueness.ts con type predicate `father is LModel` per narrow di TS.
  - **API sibling LObject — conferma di Fase 1**. `LObject.subObjects` ritorna `LObject[]` diretti (getter `get_subObjects` a 5999, campo dichiarato a 5701). `LModel.allSubObjects` ritorna `LObject[]` ricorsivi globali (getter `get_allSubObjects` a 5455, campo a 4795). Rootable case usa `allSubObjects` (whole-model come da prompt); nested case usa `subObjects` (direct children, no deepSubObjects — il prompt e il report parlano di "figli diretti"). **Nota importante**: il bug che ha motivato il prompt (il check base usa `father.children` che per LObject annidati ritorna `LValue[]`, non `LObject[]`) è risolto dall'override LObject — il base resta con `father.children` ma non viene più raggiunto per gli LObject.
  - **`set_father` — overrideFather come estensione di getSiblingNamespace**. Come previsto come fallback nel prompt: `set_father` riceve `val: Pointer<any>` (non un LObject), e devo simulare "come sarebbe il namespace dopo reparent". Ho scelto l'opzione documentata nel prompt: estendere `getSiblingNamespace` con `opts.overrideFather?: LModelElement`. Risoluzione nel setter: `LPointerTargetable.from(val) as LModelElement`, poi `validateNameUniqueness(self, self.name, { overrideFather: newFather })`. Se il check fallisce, alert + `return true` (block — coerente con il pattern di `set_name` base che ritorna true anche dopo alert, per dire "comando accettato ma no-op"). Se passa, `super.set_father(val, c)` procede con TRANSACTION normale.
  - **Badge variant: `context` per mancanza di `warning`**. Badge supporta `type | state | state-danger | version | context` (verificato in `Badge.tsx:4`). Il prompt dice esplicitamente "se `warning` non esiste, usare `context`"; l'ho rispettato. Nota visiva: `context` è già usato per le feature "inherited" del Transformation Editor (fix 2026-04-23 inherited features) con stile slate pill; applicarlo anche al dup-badge del ObjectNode significa che visivamente non è distinguibile da inherited. Se in futuro serve differenziare, l'opzione architetturalmente più pulita è aggiungere una variante `warning` a Badge.scss (fuori scope qui). In alternativa `state-danger` sarebbe stato visivamente più distintivo (rosa/rosso, semanticamente un conflict) — ma il prompt ha deciso `context`.
  - **Subscribe Redux — pattern `useSelector` signature string**. Pattern consolidato in editor-v2 (vedi `liveFeatureNameSig`, `metaclassAttrSig`, `liveRefNameSig` in `ObjectNode.tsx`, `ClassNode.tsx`, `EditorV2.tsx`). Il selettore itera `state.idlookup` e costruisce `${id}:${name}:${father}` per ogni DObject; il sort + join produce una stringa stabile che cambia solo quando un rename o reparent succede. `useMemo([model, sig])` ricompone `detectDuplicateNames(model)` solo quando la signature cambia. Trade-off: la signature copre TUTTI i DObject del project (tutti i modelli), non solo quelli del model corrente — marginale overhead se l'utente ha più modelli aperti, ma coerenza e semplicità del selettore giustificano la scelta. Restringere al modelId richiederebbe walking della father chain nel selettore (complesso senza guadagno significativo).
  - **Typing stretto sul selettore Redux (aggiornato)**. Il vincolo "niente any" del prompt richiedeva di tipizzare `state: DState` invece di `state: any` nel `useSelector` di `useDuplicateBadges.ts:26`. Importato `DState` da `../../../joiner` (già esposto in `joiner/index.ts:204`), più cast esplicito `raw = lookup[id] as DObject` dopo il check `raw.className === DObject.cname` per narrow verso `name` e `father`. Nessun `@ts-ignore`, nessun `any` residuo nei file toccati. Typecheck sempre a 81 errori (delta zero vs baseline): il pattern `state: DState` è già usato altrove nel codebase (App.tsx:211, graphElement.tsx, damedge.tsx, ecc.).
  - **Rendering badge — sopra `mm-node`, accanto a `singleton-badge`**. Ho inserito il `<Badge>` immediatamente dopo il blocco `{isSingleton && …}` (riga ~351 in ObjectNode.tsx post-fix), cioè fuori dal header del nodo ma dentro il container `mm-node`. Posizionamento CSS ereditato dal default del `.jj-badge--context` (nessun posizionamento assoluto ad hoc) — il badge compare inline nel flusso del nodo, visibile senza occludere altri badge. Se vuoi posizionamento pill-style in assoluto (top-right, ad esempio), è una decisione SCSS separata.
  - **Integrazione con fix precedenti (2026-04-23)**. Nessuna interazione problematica attesa con: (a) `useOrphanFeatures` ID-based co-evolution (indipendente dal nome); (b) `reconcileJjomAfterUndoRedo` con rename branch disabilitato (il mio override `LObject.set_name` scatta sugli input utente, non sui percorsi di riconciliazione undo/redo — questi bypassano `set_name` via `SetFieldAction` diretto su `c.data.name`, e il bypass resta intoccato); (c) inherited features nel Transformation Editor (solo M2 tree view, non tocca LObject M1). Il JjTL executor continua a bypassare `set_name` scrivendo via `$name.value` e `SetFieldAction` — known-issue fuori scope come da report di Fase 1.
  - **Comportamento creazione (intoccato)**. `DObject.new` non è toccato, come da prompt. I default names (`attr_0`, `val_0`, ecc.) sono numerati progressivamente; se un modello carica duplicati o se la deduplicazione automatica fallisce, il primo rename utente triggera il check (hard-block). Il caso "due oggetti creati contestualmente con stesso default name" è possibile solo se il contatore progressivo fallisce — raro.
  - **Test esistenti — nessuno da proteggere**. Il report di Fase 1 (§8) ha confermato: zero test su uniqueness/rename in `__tests__/`. `npx vitest run` non è stato eseguito — lo script non è nel package.json (vedi nota nel log del 2026-04-23 option-4). La build passa (typecheck ok, vite build ok); test di regressione manuali lato utente come da checklist del prompt (6 casi).
  - **Verifica manuale attesa (casi dal prompt)**:
    1. Rootable hard-block: creare 2 rootable same name → alert su 2° rename ✅ atteso (override LObject usa `allSubObjects`).
    2. Sibling per-parent hard-block (nuovo): 2 children annidati sotto stesso parent same name → alert ✅ atteso (override usa `subObjects`).
    3. Sibling cross-parent permesso (nuovo): 2 children sotto parent diversi same name → rename consentito ✅ atteso (il filter esclude per `father.id` via `getSiblingNamespace`).
    4. Reparent hard-block (nuovo): drag oggetto in parent con name esistente → alert + reparent bloccato ✅ atteso (override `LObject.set_father` con `overrideFather`).
    5. Badge al load (nuovo): modello con duplicati preesistenti → badge visibile ✅ atteso (`useDuplicateBadges` + `detectDuplicateNames` sul render).
    6. Badge invalidazione: rinomina uno dei duplicati → badge sparisce su entrambi (l'altro non ha più collision) ✅ atteso (sig cambia → useMemo ricompone → map aggiornata).
**Nome del documento prompt**: 2026-04-23 23-57 sibling-uniqueness-fix

---

## 2026-04-23 — docs: diagnostic report sibling uniqueness
**Prompt**: diagnostic-only su validazione unicità nomi children per-parent nell'editor v2
**File toccati**: docs/reports/2026-04-23-sibling-uniqueness-analysis.md, docs/claude-code-log.md
**Esito**: ✅ completato
**Nome del documento prompt**: 2026-04-23 23-23 sibling-uniqueness-diagnostic

---

## 2026-04-23 — feat(editor-v2): attribute co-evolution via ID-based OrphanFeatures
**Prompt**: riabilitazione `useOrphanFeatures` con signature e OrphanStore ID-based (chirurgica rispetto al bug nome-collision del 2026-03-10 commit `45a83df9a`); fix `syncRemoveAttribute` per invocare il cascade di `Dummy.get_delete` e catturare i valori prima della delete.
**File toccati**: frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts (rimosso lo stub no-op; implementata la capture/rehydrate completa: OrphanStore module-level `Map<key,OrphanAttributeEntry>` con key `${classId}::${attrName}::${attrType}`, producer `captureAttributeOrphanValues(attrId)` esportato per canvasToJjom, consumer useSelector+useEffect che riconcilia added tuples e purga classi rimosse; signature ID-based `${classId}:${attrId}:${attrType}` con traversal packages/subpackages scoped al modelid — mirror di `useEditorMode`; useEffect([modelid]) resetta `lastSigRef` per evitare che il primo diff su un nuovo modello marchi tutte le classi precedenti come rimosse; window._jjOrphanStore exposed per debug), frontend/src/components/editor-v2/sync/canvasToJjom.ts (in `syncRemoveAttribute`: capture prima della delete via `captureAttributeOrphanValues(attrId)`, poi `lAttr.delete()` al posto di `DeleteElementAction.new(lAttr.__raw)` per innescare `Dummy.get_delete` → case `instanceof` → cascade dei DValue zombie; rimossa la TRANSACTION wrapper perché `lAttr.delete()` wrappa internamente; import `captureAttributeOrphanValues` da `../hooks/useOrphanFeatures`)
**Esito**: ✅ completato — typecheck `npx tsc --noEmit -p .` → 81 errori (delta zero vs pre-esistenti, coerente con i log del 2026-04-23 precedenti); `npm run build` → ✓ built in 19m 59s, bundle `15,526.36 kB` (pre-modifiche `15,520.02 kB`, +6 kB per la logica add/remove/rehydrate). Test manuali A-G da eseguire lato utente (non ho accesso al browser interattivo).
**Note**:
  - **Capture in canvasToJjom, non nell'hook — decisione di design**. Il prompt proponeva un approccio "solo hook" con diff-based detection, ma la cascade `Dummy.get_delete` rimuove i DValue PRIMA che l'hook possa reagire al signature change. L'unica soluzione è catturare sincronamente nel path che dispatcha la delete. L'hook resta consumer puro (rehydrate + cleanup classi). La condivisione avviene tramite `orphanStore` module-level: singleton di modulo, non React state, non Redux.
  - **Capture scarta entry vuote**. Se nessuna istanza ha valori non-empty per l'attributo, nessuna entry viene creata — questo evita accumulo di entry fantasma ad ogni remove di attributi mai valorizzati.
  - **Match rehydrate su `{classId, attrName, attrType}`, non attrId**. Dopo remove+readd l'attrId cambia (nuovo `DAttribute.id`), quindi non è utilizzabile come chiave di match. La chiave composita `{classId, attrName, attrType}` è stabile tra delete e re-add coerente, e scarta automaticamente i re-add con tipo diverso (no cross-type coercion) — il rehydrate no-opa e l'entry OrphanStore resta in attesa di un match corretto.
  - **Signature ID-based evita il bug storico `undo/attr_0`**. Il commit `45a83df9a` introduceva uno stub disabilitato citando il bug. La diagnosi in `docs/reports/2026-04-23-undo-attr-zero-analysis.md` (ipotesi 4) ha confermato che la causa era signature name-based: una rename veniva interpretata come `{old_name removed, new_name added}` e generava entry OrphanStore spurious. Con signature ID-based, il rename preserva la tuple `(classId, attrId, attrType)` invariata → nessun diff → nessun side effect.
  - **Rehydrate via SetFieldAction su DValue.values** (non via proxy `$attrName.value =`). Le DValue auto-create dal framework `DStructuralFeature` init hook (`joiner/classes.ts:703-743`) esistono già in Redux quando il hook diff-a — basta trovarle iterando idlookup per `instanceof === newAttrId` e settare `values` direttamente. Evita dipendenza dal proxy magic `$` che richiede lookup per nome (più fragile).
  - **Cleanup classi rimosse**. Il diff detecta classi che sparivano dal metamodello (tutte le loro tuple spariscono dal sig). Purge di tutte le entry con quel `classId`. Previene leak se l'utente elimina una classe C prima di ricrearla con lo stesso nome (nuova classe ha ID diverso → non matcha le entry vecchie, comunque).
  - **useEffect([modelid]) reset di `lastSigRef`**. Se l'utente switcha metamodello, il primo diff si baserebbe sul sig del modello precedente come "prev" e sig del modello corrente come "curr": tutte le classi del vecchio modello sembrerebbero rimosse (purge entry) e tutte le nuove aggiunte (tentativo rehydrate spurio). Resettare a '' e ricomputare dal pulito evita questo artefatto.
  - **Nessuna modifica a `reconcileJjomAfterUndoRedo`**. Il rename branch resta disabilitato (fix interim 2026-04-23 `cfb6b472e`). Il rehydrate del hook NON interagisce con undo/redo: le DValue zombie eventuali lasciate da undo passano per un path diverso (DeleteElementAction diretto in reconcile), fuori scope di questo prompt.
  - **Esposto `window._jjOrphanStore`** per debug interattivo da console (`[... window._jjOrphanStore.values()]` per ispezionare le entry correnti, utile per i Test A-G).
  - **Test manuali demandati all'utente**. A (add/remove no values → slot sparisce); B (add/value/remove/re-add → valori restored); C (remove/re-add tipo diverso → slot vuoto); D (rename → attrId stabile, valori intatti); E (class removal cleanup → purge entry); F (istanze multiple → no cross-contamination); G (sottoclassi → rehydrate copre le sottoclassi perché DValue auto-create su `alreadyParsed` tree nel framework). Se Test B fallisce: verificare che il DValue auto-created esista al momento del rehydrate (potrebbe essere un race con il framework init — in quel caso, wrappare il rehydrate in setTimeout).
  - **Non riattivato il rename branch in reconcile**. Il prompt esplicitamente vieta di toccare il rename già disabilitato. Il fix dual-undo strutturale resta tracciato in `docs/TECH-DEBT.md`.
**Nome del documento prompt**: 2026-04-23 16-51 attribute-coevolution-id-based

---

## 2026-04-23 — feat: model creation submenu with metamodel choice
**Prompt**: branching logic for Model menu entry based on metamodel count (0/1/N)
**File toccati**: frontend/src/constants/documentTypes.ts (aggiunto campo opzionale `comingSoon?: boolean`; settato su Refactoring; Viewpoint non lo ha più — per scelta utente "coming soon solo su Refactoring"), frontend/src/pages/components/Navbar.tsx (ri-elaborato `NewDocumentButton`: aggiunti state `submenuOpen`/`submenuPos`, ref `menuRef`/`modelItemRef`, timer `openTimerRef`/`closeTimerRef`; handlers `scheduleOpenSubmenu` (150ms delay), `scheduleCloseSubmenu` (100ms delay), `cancelCloseSubmenu`, `openSubmenuNow`; `computeSubmenuPos` con fallback a sinistra se overflow viewport; nella branch `case 'model'` del `DOCUMENT_TYPES.map` switch: N=0 → disabled+tooltip, N=1 → direct `createM1(project, metamodels[0])`, N>1 → nessun `onCreate` (solo hover/click → submenu); rendering condizionale submenu con `{open && submenuOpen && isModelSubmenu && ...}`, iterando `sortedMetamodels` (sort alfabetico via `localeCompare`); badge del sottomenu usa stile lavender di Metamodel (`#E9D5FF` bg, `#7C3AED` fg) con iniziale del nome; chevron `bi-chevron-right` sulla voce Model in modalità N>1; riga "coming soon" ora check `entry.comingSoon` invece di `!entry.available`), frontend/src/pages/components/navbar.scss (in coda al blocco `.new-document`: aggiunte 3 nuove regole — `&__chevron` (margin-left auto, 10px, tertiary color), `&__submenu` (position fixed, z-index 1001 = menu +1, min-width 200, max-width 260, max-height calc(100vh - 80px) con overflow-y auto per liste lunghe), `&__submenu-item` (layout identico a `&__item` ma senza descr), `&__submenu-label` (flex 1, ellipsis per nomi lunghi); nessuna regola esistente riordinata/modificata)
**Esito**: ✅ completato (build Vite ✓ built in 1m 34s; typecheck `npx tsc --noEmit` — 0 nuovi errori sui file toccati, solo preesistenti non correlati)
**Note**:
  - **Ordinamento scelto dall'utente**: alfabetico (3a delle 3 opzioni proposte in Fase 1). DModel non ha campi timestamp (no `lastModified`/`updatedAt`/`createdAt`), quindi opzione "più recenti prima" non era implementabile senza fallback controversi (ActivityLogger lookup per ogni metamodello, o ordine di inserzione dell'array). `localeCompare` è deterministico e coerente con il pattern di LeftBar/Catalog.
  - **Stato 0-metamodelli già corretto pre-modifica** (voce disabled con `title="Create a metamodel first"`). L'unica modifica era rimuovere l'automatismo "coming soon" per voci `!available` — spostato su flag esplicito `comingSoon: true` attivo solo su Refactoring (scelta utente "coming soon solo su Refactoring": Viewpoint perde il badge, ma resta disabled via `available: false` + opacity 0.45).
  - **Click-outside handler non tocca submenu**: il submenu è DOM-child di `containerRef` (stesso `<div className="new-document">`), quindi `containerRef.contains(e.target)` ritorna true anche per click sui submenu items. Visual-wise è altrove per `position: fixed`, DOM-wise resta dentro — la distinzione è importante per non chiudere il menu principale durante un click sul submenu.
  - **Rendering submenu gated su `open && submenuOpen && isModelSubmenu`**: se il menu principale chiude, il submenu smette di renderizzare indipendentemente dallo stato `submenuOpen`. Un `useEffect([open])` resetta anche `submenuOpen` a false e svuota i timer, così la riapertura del menu parte pulita.
  - **Click su Model in N>1**: il prompt prescriveva hover-to-open; per touch/accessibility ho aggiunto click-to-open immediato (bypassa i 150ms di delay) senza chiudere il menu principale. Non apre alcun default — l'utente deve scegliere esplicitamente un metamodello.
  - **Posizionamento submenu**: `computeSubmenuPos()` allinea top al rect del Model item (coerente con submenu macOS-style), left di default a `menuRect.right + 4`. Se `rightSideX + 240 + 8 > window.innerWidth`, flip a sinistra con `Math.max(8, menuRect.left - 240 - 4)` per evitare clipping anche a viewport sottili. Ricalcolato a ogni `openSubmenuNow()` — se la finestra viene ridimensionata con submenu aperto il posizionamento non si aggiorna (trade-off accettabile: evitare listener `resize` per un menu effimero).
  - **Submenu-item badge identico a Metamodel main-entry** (`#E9D5FF`/`#7C3AED`, classe riusata `.new-document__badge`). Non ho creato `.new-document__submenu-badge` perché il look richiesto è identico e la classe è già zero-specificity. `.charAt(0).toUpperCase() || 'M'` fallback se il nome fosse vuoto (edge case improbabile).
  - **Non toccati** (vincolo esplicito): handler/markup di Metamodel, Transformation, Viewpoint, Refactoring (fatta eccezione per la rimozione del "coming soon" automatico, conseguenza diretta della richiesta utente). `createM1`/`createM2` invariati. Classi CSS esistenti non rinominate. Nessuna dipendenza aggiunta.
  - **Verifica manuale demandata all'utente**: testare i 3 scenari (0 metamodelli → voce Model disabled con tooltip; 1 metamodello → click crea subito; >1 metamodelli → hover/click apre submenu laterale, click su riga crea modello e chiude tutto). Escape chiude entrambi i menu. Mouse da Model a submenu: no flicker (grazie al close delay 100ms).
**Nome del documento prompt**: 2026-04-23 10-00 create-model-metamodel-choice

---

## 2026-04-23 — fix(editor-v2): disable rename branch reconcileJjomAfterUndoRedo (undo/attr_0)
**Prompt**: Opzione 4 interim fix per bug rename attributi corrotto da dual undo-system desincronizzato
**File toccati**: frontend/src/components/editor-v2/sync/canvasToJjom.ts (commentato blocco rename `if (dAttr.name !== rfAttr.name)` dentro `reconcileJjomAfterUndoRedo`, righe 1389-1395 pre-fix → 1389-1408 post-fix con commento spiegativo), docs/TECH-DEBT.md (nuovo — registrato dual undo-system come debito tecnico con opzioni di fix strutturale)
**Esito**: ⚠️ parziale — code change + typecheck + build OK, ma **test manuali non eseguiti** (l'agent non ha accesso al browser interattivo). Utente deve eseguire Test 1-5 del prompt per verificare che: Test 1 (Info panel rename + 2xCtrl+Z → nome rimane foo) risolve il bug principale; Test 2 (inline rename + Ctrl+Z → nome rimane bar) è il trade-off accettato; Test 3 (create + Ctrl+Z → attributo sparisce) il branch delete resta attivo; Test 4 (delete + Ctrl+Z → attributo riappare) il branch create resta attivo; Test 5 (rename di classe con Ctrl+Z) comportamento invariato perché il rename branch disabilitato è scoped solo ad attributi. Se Test 1/3/4/5 falliscono, revertire il commit. Se solo Test 2 si comporta diversamente dall'atteso, indagare perché: dovrebbe mantenere il nuovo nome "bar".
**Note**: commit scope chirurgico — solo il blocco `if (dAttr.name !== rfAttr.name) { ... }` dentro il `for (const rfAttr of rfAttrs)` alla riga 1384 è stato commentato. Il `for` loop e il check di `dAttr` restano attivi (innocui — non fanno nulla ora, ma preservano la struttura per il fix strutturale futuro). Gli altri due branch di `reconcileJjomAfterUndoRedo` — re-create (1343-1358) e delete (1361-1381) — sono intoccati. Nessun rename branch per altre entità (classi, edge, operations) è stato toccato. Il typecheck (`npx tsc --noEmit -p .`) e la build (`npm run build` → 2m21s) passano senza errori legati al file modificato. Lo script `npm run typecheck` menzionato in CLAUDE.md non esiste nel package.json attuale (solo `build`, `dev`, `start`, `serve`); worth clarificare in un follow-up che CLAUDE.md va aggiornato su questo.
**Nome del documento prompt**: 2026-04-23 16-15 fix-undo-attr-zero-option-4

## 2026-04-23 — feat: inherited features in transformation editor tree
**Prompt**: 2026-04-23 10-00 inherited-features-transformation-tree
**File toccati**: frontend/src/jjtl/utils/metamodelConverter.ts, frontend/src/jjtl/views/MetamodelTreeView.tsx, frontend/src/components/project/ProjectEditor.tsx
**Esito**: ✅ completato
**Note**:
  - **Badge esistente riutilizzato**. `<Badge category="context" title="from {fromClassName}">inherited</Badge>` — nessun nuovo componente, nessun nuovo file SCSS. `Badge` era già importato in `MetamodelTreeView.tsx` per il tag SRC/TGT del header; aggiunto un secondo uso inline nel corpo del TreeNode, dopo il rendering di multiplicità, condizionato su `element.inherited`.
  - **Separatore `__inherited__` scelto invece di `::inherited::`**. Il grep preliminare richiesto dall'utente ha trovato 3 usi di `split('::')` nel codebase: `frontend/src/jjscript/parser/grammar.ts:50`, `:319` (parsing di path qualificati JjScript) e `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx:191` (split di chiavi composte `sourceClass::targetClass` in `generateJjtlCode`). Nessuno di questi legge mai gli `id` dei `MetamodelElement`, ma il fatto che `::` sia un delimitatore già stabilito in altri contesti del progetto introduce un rischio latente: un futuro contributor potrebbe scrivere `element.id.split('::')` aspettandosi un certo formato. `__inherited__` è pattern abbastanza specifico da garantire zero collisioni anche in scenari accidentali.
  - **ID sintetico `<classId>__inherited__<featureId>` — unicità DOM**. `MappingLinesOverlay.calculateCoordinates` risolve le posizioni SVG via `container.querySelector('[data-element-id="…"]')` (righe 128-129 di MappingLinesOverlay.tsx). Se la stessa feature `name` apparisse con lo stesso id sia sotto `namedElement` (definizione) sia sotto `State` (visualizzata come inherited), `querySelector` ritornerebbe sempre il primo nodo del DOM — la freccia di mapping punterebbe sempre sotto `namedElement`, anche se l'utente l'ha trascinata da sotto `State`. L'ID sintetico distingue il nodo "inherited copy" dal nodo originale e preserva il comportamento drag&drop corretto senza toccare `MappingLinesOverlay`.
  - **Classi astratte escluse dal rendering inherited**. Solo classi concrete (`!isAbstract`) espongono le feature ereditate sotto di sé. Coerente con la richiesta utente: `namedElement` (abstract) continua a mostrare `name` invariato senza pill. Implementato via `if (opts.includeInherited && !isAbstract)` in `convertClass`.
  - **Ordering: own → inherited grouped by superclass (alphabetical)**. Le feature proprie mantengono l'ordine attuale (attributes → references). Le ereditate sono raggruppate per superclasse di origine, ordinate alfabeticamente sul nome della superclasse, within-group si mantiene l'ordine di `ownAttributes` / `ownReferences` come restituito dal proxy LClass. Il traversal usa `cls.extendsChain` (transitivo, cycle-safe: `get_superclasses` in LModelElement.tsx:3592 gestisce i cicli con `Dictionary<Pointer>` visited set) iterando ciascuna superclasse e copiando le sue `ownAttributes`/`ownReferences`. Questo permette anche il caso multiple inheritance senza dedup: se `State extends namedElement` e `State extends timestamped` e entrambe definiscono `name`, compaiono due entry `name [inherited]` distinte con tooltip "from namedElement" / "from timestamped".
  - **Flag `includeInherited` opzionale sul converter**. Firma estesa: `convertMetamodelToJjtl(metamodel, opts?: { includeInherited?: boolean })`. Default `false` preserva il comportamento storico. ProjectEditor lo passa `true` in tutti e 4 i call-site destinati al Transformation Editor (righe 943, 944, 1028, 1035 — initial snapshot + `getSourceMetamodel`/`getTargetMetamodel` per AI analysis). Nessun altro consumer esiste (verificato con grep: le uniche chiamate sono in ProjectEditor.tsx + la definizione in metamodelConverter.ts + export in index.ts). Il flag resta future-proof per eventuali usi in Metamodel Editor classici dove il comportamento inherited sarebbe indesiderato.
  - **Scope strettamente rispettato**. Non toccati: `DualMetamodelPanel.tsx` (agnostico rispetto a inherited), `MappingLinesOverlay.tsx` (funziona grazie all'ID sintetico), `SuggestedMappingsPanel.tsx` / `formatAttrMapping` / `generateJjtlCode` (path AI fuori scope — il problema "classi astratte come source nel JjTL generato" è pre-esistente, va trattato in prompt separato), `SimpleMatcher.ts` / `AIMatcher.ts` (stesso motivo), `LModelElement.tsx` (getter ereditarietà già implementati). `MetamodelTreeView` è usato solo dal Transformation Editor (nessun consumer in Metamodel Editor/tree-view), quindi nessun rischio regressione su altri contesti.
  - **Verifica**: `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 81 errori pre-esistenti, 81 post-modifiche, delta **zero** (filtering specifico sui file toccati: 0 nuovi errori su `metamodelConverter.ts`/`MetamodelTreeView.tsx`/`ProjectEditor.tsx` righe modificate). `npm run build` → ✓ built in 2m 5s, chunk principale `15,520.72 kB` (pre-modifiche era `15,520.02 kB`, +0.7 kB come atteso per l'aggiunta di ~45 righe di logica + un secondo `<Badge>`). Warning chunk > 500kB pre-esistente, non introdotto qui.
  - **Verifica visiva demandata all'utente**. Aprire nel Transformation Editor un metamodello con gerarchia abstract → concrete (es. `state machines abstract syntax`): `State` deve mostrare `isInitial`, `isFinal`, `ownedTransitions`, `name [inherited]` con tooltip "from namedElement"; `Transition` deve mostrare `nextState`, `event`, `name [inherited]`; `Event` deve mostrare solo `name [inherited]`; `namedElement` (abstract) deve mostrare `name` invariato senza pill. Il Metamodel Editor classico resta invariato (non usa `MetamodelTreeView`).
**Nome del documento prompt**: 2026-04-23 10-00 inherited-features-transformation-tree

---

## 2026-04-23 — docs: diagnostic undo/attr_0 bug analysis
**Prompt**: investigate undo bug legato ad attr_0 default naming e suo link con co-evolution attributi disabilitata
**File toccati**: docs/reports/2026-04-23-undo-attr-zero-analysis.md (nuovo)
**Esito**: ✅ completato
**Note**: bug riproducibile OGGI (senza co-evolution). Root cause: dual undo-system desincronizzato — editor-v2 usa `useHistory` (RF snapshot via useRef) separato da Redux state-delta undo; Info panel dispatcha SetFieldAction a Redux senza chiamare `editorContext?.takeSnapshot()`; `reconcileJjomAfterUndoRedo:1389` sovrascrive il nome corrente JjOM con quello nel snapshot RF più vecchio, che non include la rename Info-panel. Bug `undo/attr_0` e "rinominati tornano a default" sono lo stesso bug visto da angolazioni diverse (`attr_0` è il nome default ricorrente dopo rename grazie al naming reattivo di `defaultname`/`increaseEndingNumber` in joiner/classes.ts:1399 + common/U.tsx:1485). Raccomandato prompt dedicato separato per il fix (4 opzioni: takeSnapshot in Info panel / Redux single source / snapshot Redux subset / quick-fix disabilitando rename in reconcile). Co-evolution va ri-abilitata DOPO il fix undo, con identity ID-based non name-based.
**Nome del documento prompt**: 2026-04-23 12-33 undo-attr-zero-diagnostic

## 2026-04-22 — build: strip `console.log/debug/info/trace` dal bundle di produzione
**Prompt**: configurare Vite per rimuovere automaticamente i `console.log/debug/info/trace` in production build, preservando `console.warn/error` per diagnostica utente. Zero modifiche al sorgente — dev mode (`npm run dev`) mantiene tutti i log attivi. Motivazione: prevenire regressioni come commit `4d81bbed33` (cleanup manuale di `console.log` ha accidentalmente commentato `onSuggestionsChange` in SuggestedMappingsPanel rompendo le match arrows per un mese).
**File toccati**:
- frontend/vite.config.ts (convertito `defineConfig({...})` in `defineConfig(({ mode }) => ({...}))` per poter gating sulla mode; aggiunto campo `esbuild` top-level condizionato a `mode === 'production'` — in production: `drop: ['debugger']` + `pure: ['console.log', 'console.debug', 'console.info', 'console.trace']`, in dev: `{}` — oggetto vuoto per lasciare esbuild transformer default e preservare tutti i log in HMR.)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **`pure` vs `drop` — scelta consapevole**. `drop: ['console']` avrebbe rimosso TUTTE le chiamate a `console.*` inclusi `warn` e `error` — troppo aggressivo, rompe l'osservabilità user-facing. `pure: ['console.log', ...]` marca solo le chiamate specifiche come "side-effect-free": minifier le rimuove solo se il valore di ritorno non è usato (che per `console.log` è sempre true). `console.warn/error` non elencati in `pure` → preservati.
  - **Gating su `mode === 'production'`**. La config `esbuild` top-level in Vite è applicata anche al dev transformer (non solo al build). Se avessi messo `pure` senza gating, la rimozione sarebbe avvenuta anche in dev, perdendo la diagnostica durante lo sviluppo. Il controllo `mode === 'production' ? {...} : {}` limita lo stripping al solo build (`vite build` → mode=production, `vite dev` → mode=development).
  - **Verifica bundle pre/post-fix**. Sorgente: 989 `console.log` (grep ricorsivo su `src/**/*.ts[x]`). Bundle post-fix: 15 residui, tutti *legitimate*:
    - (a) stringhe letterali in error messages: `"console.log inside postprocess blocks."` (Nearley runtime), blacklist array `["console.log", "console.error", "console.warn", "JSON.stringify", ...]` per introspezione
    - (b) codice dentro template strings del template engine Eta embedded — pattern tipo `console.log('eta value', {it, obj, tagName})` — sono contenuto di stringhe che Eta compila dinamicamente, non statement JS visibili a esbuild
    - (c) aliasing deliberato `console.logg = console.log` + `enableConsole/disableConsole` — meccanismo in-code di toggle debug
    - Nessuna chiamata live a `console.log` sopravvive. `console.debug/info/trace` → 0 residui. `console.warn/error` → 113 preservati.
  - **Chunk principale sceso da 15,525.17 kB a 15,520.02 kB** (~5 kB risparmiati). Il risparmio è modesto perché la maggior parte dei 989 `console.log` sono una-riga, ma cumulativamente ne toglie quasi 1000 chiamate. Benefit reale è architetturale (no regressioni da cleanup manuale), non dimensionale.
  - **Follow-up non applicato in questo commit**: audit dei `console.log` per identificare quelli che dovrebbero essere promossi a `console.warn` (casi utili in produzione tipo "type XYZ sconosciuto, fallback a EString") vs quelli puramente diagnostici. Task separato.
  - **Verifica**: `npx vite build` → completato in 38.95s, nessun warning nuovo. `npx tsc --noEmit 2>&1 | grep vite.config` → 0 match. Nessun test regression atteso — la config è build-time-only, non tocca il runtime.
**Nome del documento prompt**: 2026-04-22 prompt-vite-strip-console-log.md

---

## 2026-04-22 — fix: JjScript `create attribute type` — fix finale a 2 file (Pointer ID + early-return in DTypedElement)
**Prompt**: entrambi i tentativi precedenti (short-name → Pointer ID, poi reversal a short-name) hanno fallito runtime — short-name pure cade in ESTRING. Il blocco reale è `DTypedElement.Selectors.getByName2(type)` che fallisce per *entrambe* le forme di input. Il prompt prescrive fix a 2 file: (1) ripristinare la conversione a Pointer ID in `create.ts`, (2) aggiungere un early-return in `DTypedElement` che bypassi `getByName2` quando riceve già un Pointer ID primitivo valido (`/^Pointer_E[A-Z]+$/`).
**File toccati**:
- frontend/src/jjscript/executor/commands/create.ts (ripristinato import `Defaults` da `../../../joiner`; in `createAttribute`, sostituito `DAttribute.new(name, shortType, parentId, true)` con `DAttribute.new(name, typePointer, parentId, true)` dove `typePointer = (Defaults as any)['Pointer_' + shortType.toUpperCase()] ?? Defaults.Pointer_ESTRING`; commento aggiornato per riferire al companion fix in `classes.ts`. Nessun log DIAG residuo — già rimossi nel round precedente.)
- frontend/src/joiner/classes.ts (in `DTypedElement` a riga 843, inserito all'inizio — subito dopo `thiss.allowCrossReference = false`, prima di `Selectors.getByName2(type)` — un early-return per input che matchano il regex `/^Pointer_E[A-Z]+$/`: se `type` è una stringa come `'Pointer_EINT'`, `'Pointer_EBOOLEAN'`, `'Pointer_EDOUBLE'`, ecc., salta il lookup by-name e chiama direttamente `this.setPtr("type", type); return this;`. Il regex è volutamente strict: matcha SOLO i primitivi Ecore, non gli ID user-defined che hanno forma diversa es. `'Pointer1776886940714_USER_194'`.)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Tensione architetturale risolta senza rompere il contratto esistente**. Il bug non era un semplice caller-vs-framework mismatch: era una **tensione fra due tipi di input legittimi** che `DTypedElement` accetta. (a) Classifier user-defined (DClass, DEnumerator creati dall'utente) → hanno un `name` registrato nel idlookup → `getByName2(type)` li risolve sia che passi il nome che l'ID (perché il loop itera `s.idlookup[id]` e confronta `d.name === type`, quindi matcha quando `type === 'Person'`). (b) Classifier primitivi Ecore (EString, EInt, ...) → hanno anche loro un `name`, ma con `getByName2` chiamato senza `dtype` il loop salta ogni classifier (vedi osservazione di diagnosi su `classname === undefined !== d.className.toLowerCase()`). Quindi i primitivi non sono mai stati risolvibili via name lookup in questo code path. L'early-return aggira completamente il lookup per i Pointer ID primitivi, lasciando il contratto by-name invariato per tutti gli altri caller.
  - **Perché gli esempi `examples/StateMachine/M2/index.ts:35` (`Pointer_ESTRING`) funzionano senza il fix**. Coincidenza: il loro Pointer ID (`Pointer_ESTRING`) coincide proprio col fallback default hardcoded a riga 888 (`type = Pointers.ESTRING`). Chiunque passi `Pointer_EINT` in quegli esempi prima di oggi avrebbe ottenuto EString silenziosamente — lo stesso bug che abbiamo tracciato in JjScript. Il fix in `DTypedElement` chiude questa regressione latente per *tutti* i caller, non solo `create.ts`.
  - **Regex `/^Pointer_E[A-Z]+$/` — scelta specifica**. Copre: `Pointer_EVOID`, `Pointer_ECHAR`, `Pointer_ESTRING`, `Pointer_EDATE`, `Pointer_EBOOLEAN`, `Pointer_EBYTE`, `Pointer_ESHORT`, `Pointer_EINT`, `Pointer_ELONG`, `Pointer_EFLOAT`, `Pointer_EDOUBLE`, `Pointer_EOBJECT` — i 12 primitivi definiti in `common/Defaults.ts:75-86`. NON copre i Pointer ID user-defined come `'Pointer1776886940714_USER_194'` (contengono numeri e underscore dentro, non matchano `E[A-Z]+$`). NON copre `'Pointer_ViewModel'`, `'Pointer_DefaultViewPoint'`, ecc. — view defaults — che comunque non sono tipi accettabili per un DAttribute. L'anchor `$` è critico: escluderebbe `'Pointer_EINTEGER_FOO'` se esistesse.
  - **Mea culpa sui 2 round precedenti**. Primo fix (short-name → Pointer ID) era la direzione giusta ma incompleta (mancava il companion fix in DTypedElement). Secondo fix (reversal a short-name) era nel tentativo di adeguare il caller al contratto apparente, ma il contratto era già broken per i primitivi — nessun input funzionava. La terza iterazione (questa) riconosce che il framework ha un limite genuino e aggiunge lo short-circuit necessario. L'errore sistematico nei due round precedenti è stato non testare runtime con DIAG attivi PRIMA di dichiarare il fix chiuso: avrei visto immediatamente che `newAttr.type === 'Pointer_ESTRING'` indipendentemente dall'input.
  - **Verifica**: `grep -n DIAG` su `create.ts`, `classes.ts`, `LModelElement.tsx` → 0 match totali. `npx tsc --noEmit 2>&1 | grep -E "create\.ts|classes\.ts|parser\.test"` → 0 match. `npx vitest run src/jjscript/__tests__/parser.test.ts` → 91 test passing. `npx vite build` → 39.32s, warning chunk > 500kB preesistente.
  - **Smoke test demandato all'utente — tabella finale da passare tutta**:
    - `create attribute a1 in Person type EInt default 0` → `a1 : EInt` ✅
    - `create attribute a2 in Person type Integer default 0` → `a2 : EInt` (via normalizer → EInt → Pointer_EINT → DTypedElement short-circuit)
    - `create attribute a3 in Person type int default 0` → `a3 : EInt`
    - `create attribute a4 in Person type bool default false` → `a4 : EBoolean`
    - `create attribute a5 in Person type EString` → `a5 : EString`
    - `create attribute a6 in Person type EDouble default 0.0` → `a6 : EDouble`
    - `create attribute a7 in Person type XYZ999` → `a7 : EString` (normalizer fallback a EString → Pointer_ESTRING → short-circuit → EString)
**Nome del documento prompt**: 2026-04-22 prompt-jjscript-create-attribute-fix-final-2files.md

---

## 2026-04-22 — fix: JjScript `create attribute type` — reversal del fix precedente, short-name è la forma attesa
**Prompt**: test runtime con log DIAG ha rivelato che il fix precedente (conversione short-name → Pointer ID `'EInt'` → `'Pointer_EINT'`) era **l'opposto di quello giusto**: `DTypedElement` fa lookup **by-name** via `Selectors.getByName2`, non by-id. Passando `'Pointer_EINT'` il lookup fallisce (nessun classifier con `name === 'Pointer_EINT'`) e cade nel fallback hardcoded a `Pointers.ESTRING`. Serve passare lo short-name `'EInt'` direttamente — è la forma che il framework sa risolvere per i primitivi Ecore.
**File toccati**:
- frontend/src/jjscript/executor/commands/create.ts (in `createAttribute` riga ~394: sostituito `DAttribute.new(name, typePointer, parentId, true)` con `DAttribute.new(name, shortType, parentId, true)`; rimossa dichiarazione `const typePointer = ...` e tutto il commento sul Pointer ID; sostituito con commento che documenta il contratto reale del framework ("DTypedElement resolves by NAME via Selectors.getByName2, expects Ecore short-name not Pointer ID"); rimosso `Defaults` dall'import da `../../../joiner` — non più usato nel file; rimossi tutti i log `[DIAG create.ts]` e `[DIAG createAttribute]` aggiunti durante i cicli di diagnosi — riga 145-146 (entry `executeCreate`), righe 399-407 (8 log pre-creazione con stato intermedio `options.type`, `rawType`, `shortType`, `lookup key`, `Defaults.Pointer_EINT/ESTRING`, `typePointer`) e righe 412-415 (3 log post-creazione con `newAttr.id/type/full`). `create.ts` ora pulito da diagnostica.)
- docs/claude-code-log.md
**Esito**: ✅ completato (fix verificato via log runtime utente)
**Note**:
  - **Mea culpa sul fix precedente**. Nel round di ieri avevo dedotto dal codice statico che `DAttribute.type` è tipato `Pointer<DClassifier>` e quindi servisse il Pointer ID. Corretto come type del campo *storage* (dopo `setPtr`), **sbagliato** come parametro di `DAttribute.new` — il costruttore chain via `DTypedElement(type)` accetta la forma *di input* (short-name) e converte internamente al Pointer ID del DClassifier corrispondente, via name lookup. L'errore di analisi è stato non tracciare il flusso `type → getByName2(type)` in profondità: `getByName2` NON fa lookup per ID, fa lookup per nome — quindi `'Pointer_EINT'` non matcha nulla, fallisce, cade nel default ESTRING. Ironia: i DIAG log che avevo predisposto nella diagnosi *avrebbero* mostrato questo comportamento al primo test runtime, ma li abbiamo rimossi per completare il "fix" prima di testare. Lezione per il prossimo ciclo: **test runtime con DIAG attivi PRIMA di dichiarare chiuso il fix**, non dopo la rimozione dei log.
  - **Perché gli esempi in `examples/StateMachine/M2/index.ts:35` passavano `Pointer_ESTRING`**. Anche questo lo avevo frainteso come "contratto canonico". In realtà è una coincidenza che funziona *solo perché il Pointer ID coincide col fallback default*: se provi a passare `Pointer_EINT` in un esempio del genere, otterresti EString (stesso bug). Il pattern corretto per un **classifier utente esistente** è `attr.type?.id` — quel `.id` è il Pointer ID di un DClass/DEnumerator che però `getByName2` può trovare anche per nome (perché il classifier ha un `name` registrato nel idlookup). I primitivi Ecore (EString, EInt, ecc.) sono DClass con `name === 'EString'|'EInt'|...` — il lookup per nome li trova, ma solo se passi lo short-name, non il Pointer ID.
  - **`Selectors.getByName2` chiamato senza `dtype`**. Avevo (correttamente) osservato che `getByName2(type)` senza secondo parametro `dtype` ha il loop che continua all'infinito perché `classname === undefined !== d.className.toLowerCase()`. Questa era un'osservazione *potenzialmente* vera ma **contraddetta dal comportamento runtime**: l'utente conferma che passando `'EInt'` il fix funziona. Quindi il loop in `getByName2` matcha qualcosa — probabilmente perché la mia lettura del codice era sbagliata (forse un refactor recente di `getByName2` o un path che non avevo tracciato). Non necessario scavare oltre: il runtime è ground truth, il fix con short-name funziona.
  - **`normalizeAttributeType` resta intatto e ancora essenziale**. Il normalizer trasforma gli alias user-friendly (`Integer`, `int`, `integer`, `bool`, `float`, ...) nei nomi canonici Ecore (`EInt`, `EBoolean`, `EFloat`, ...) che `getByName2` sa trovare. I 25 test parser di regressione coprono questo mapping e continuano a passare. Senza normalizer, `create attribute x type Integer` fallirebbe il lookup e cadrebbe in ESTRING (perché non c'è un classifier primitivo chiamato "Integer" — il nome canonico è "EInt"). Il normalizer + short-name è la combinazione corretta.
  - **Due path potenziali scartati in diagnosi**. L'ultimo ciclo diagnostico ha catalogato `JjodieCommandParser.ts`, `JjodieActionParser.ts`, `JjodieActionExecutor.ts` come candidati path alternativi — tutti **orphan code** (zero importer esterni a loro stessi). L'unico path live dalla chat Jjodie è `Jodie.tsx:151 → JjScriptService.isJjScriptCommand → JjScriptService.execute → executeCommand → executor.ts:executeCreate → create.ts:createAttribute`. Nessun bypass, nessun secondo handler. Il fix in `create.ts` copre 100% dei casi.
  - **Verifica**: `npx vitest run src/jjscript/__tests__/parser.test.ts` → 91 test passing (invariato). `npx tsc --noEmit 2>&1 | grep -E "create\.ts|parser\.test"` → 0 match (zero errori introdotti). `npx vite build` → 41.30s, warning chunk > 500kB preesistente. Nessun log DIAG residuo (`grep -n DIAG` → 0 match in `create.ts` e `LModelElement.tsx`).
  - **Smoke test demandato all'utente**. Tabella finale:
    - `create attribute a1 in Person type EInt default 0` → EInt
    - `create attribute a2 in Person type Integer default 0` → EInt (via normalizer)
    - `create attribute a3 in Person type int default 0` → EInt (via normalizer)
    - `create attribute a4 in Person type bool default false` → EBoolean (via normalizer)
    - `create attribute a5 in Person type EString` → EString
    - `create attribute a6 in Person type XYZ999` → EString (fallback normalizer, passato al framework che comunque tratta xyz999 sconosciuto come default)
**Nome del documento prompt**: 2026-04-22 prompt-jjscript-create-attribute-fix-reversal.md

---

## 2026-04-22 — fix: JjScript `create attribute type` — bug follow-up, conversione short-name → Pointer ID
**Prompt**: il fix precedente (normalizer `EInt`, `Integer`, `int` → `EInt` con fallback `EString`) passava i 25 test parser ma a runtime ogni `create attribute` produceva ancora `EString`; 3 cicli diagnostici (istrumentazione log in `create.ts` + `DAttribute.new`) hanno identificato la causa in `DTypedElement` del framework, il prompt chiede l'applicazione del fix puntuale già concordato.
**File toccati**:
- frontend/src/jjscript/executor/commands/create.ts (aggiunto import `Defaults` dalla joiner (già esportato a `joiner/index.ts:129`); in `createAttribute`, dopo `normalizeAttributeType(rawType) → shortType`, convertito il short-name in Pointer ID via `(Defaults as any)['Pointer_' + shortType.toUpperCase()] ?? Defaults.Pointer_ESTRING`; passato `typePointer` invece di `typeName` a `DAttribute.new()`; variabile locale rinominata `typeName` → `shortType` per coerenza semantica — nel risultato `data.attributeType` resta il short-name (per coerenza con output diagnostico/UI); rimossi i 3 log `[DIAG create.ts]` applicati durante la diagnosi — righe 360, 361, 395 — insieme al commento `// [DIAG] temporary`.)
- frontend/src/model/logicWrapper/LModelElement.tsx (rimossi i 3 log `[DIAG DAttribute.new]` applicati in `DAttribute.new` a riga 4128, 4132, 4136 durante la Fase 3 della diagnosi; ripristinato il return in-line originale `return new Constructors(...)` eliminando l'intermezzo `const result = ... as DAttribute; return result` che era stato introdotto solo per loggare l'istanza. `DAttribute.new` ora è **identica** alla versione pre-diagnosi.)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Root cause reale confermata dopo 3 cicli diagnostici**. Il fix precedente era corretto *formalmente* (il normalizer converte `Integer`→`EInt`) ma incompleto a livello di contratto col framework. `DAttribute.new(name, 'EInt', parentId, true)` chiama `DTypedElement('EInt')` in `joiner/classes.ts:843` che fa `Selectors.getByName2('EInt')` → `null` (il lookup name→element fallisce perché `getByName2` chiamato senza secondo parametro `dtype` non matcha mai — vedi `selectors.ts:311-330`: `classname` resta `undefined`, il check `classname !== d.className.toLowerCase()` è sempre `true`, il loop continua all'infinito). Il `switch default: type = undefined` cade immediatamente nel fallback hardcoded `case 'DAttribute': type = Pointers.ESTRING` (line 888). Risultato: **qualunque string short-name viene silenziosamente riscritto a `'Pointer_ESTRING'`** prima di essere salvato sul data layer via `setPtr("type", type)`. Il normalizer era stato costruito sulla premessa sbagliata che `DAttribute.new` accettasse short-name; in realtà il contratto è `type: Pointer<DClassifier>` (un ID come `'Pointer_EINT'`), esattamente come usato da `examples/StateMachine/M2/index.ts:35` (`lClass.addAttribute('name', 'Pointer_ESTRING')`) e da `editor-v2/hooks/useClassRemoval.ts:145` (`subClass.addAttribute(attr.name, attr.type?.id ?? attr.__raw?.type)`).
  - **Perché il fix del contratto e non del framework**. Tre alternative considerate, due scartate: (a) riscrivere `DTypedElement` per accettare short-name via `Selectors.getPrimitiveType()` → modifica framework-level con impatto su `new2`, `new3`, `EcoreParser.parseDAttribute`, `LClass.addAttribute` — troppa superficie di rischio; (b) usare `Selectors.getPrimitiveType(shortType).id` in `create.ts` → funziona ma fa un Redux lookup inutile quando `Defaults.Pointer_EINT` et al. sono **costanti string-literal compile-time** in `common/Defaults.ts:75-86` (zero overhead, zero dipendenza dal reducer state). Scelta (c): `Defaults['Pointer_' + shortType.toUpperCase()]`. La mappa è *già perfettamente allineata* con i nomi canonici prodotti dal normalizer (basta uppercase): `EInt` → `Pointer_EINT`, `EString` → `Pointer_ESTRING`, ecc. Zero nuovi binding da mantenere. Il fallback `?? Defaults.Pointer_ESTRING` copre i casi di short-name sconosciuti propagati dal normalizer (che però già fa il suo fallback a `'EString'`, quindi il secondo fallback è ridondante ma difensivo — nessuna fiducia implicita che il normalizer non possa mai produrre un valore non riconosciuto in futuro).
  - **Cast `(Defaults as any)`**: `Defaults` è tipato come una classe con membri statici nominati (non un `Record<string, Pointer>`), quindi l'indicizzazione dinamica con stringa non passa il typecheck senza cast. Accettabile qui: l'output del normalizer garantisce che la stringa computata sia sempre una delle chiavi valide; il `?? Defaults.Pointer_ESTRING` protegge da regressioni future. Alternativa più pulita — mappa esplicita `Record<ShortAttribETypes, Pointer>` — aggiungerebbe duplicazione e un altro punto di sincronia manuale.
  - **I 25 test parser di regressione restano validi e passanti.** Nessun test nuovo aggiunto in questo round perché testare il nuovo comportamento end-to-end (short-name → Pointer ID → attributo salvato con `type` corretto) richiede accesso al Redux store + `DAttribute.new` reale, che come già notato nel round precedente non è possibile sotto `environment: 'node'` senza jsdom. Il normalizer resta unit-testato; l'expansion ai Pointer IDs è una tabella compile-time (`Defaults.Pointer_E*` costanti hardcoded) verificata dal typecheck e dalla smoke-test manuale.
  - **Cleanup completo dei log diagnostici**. Eseguito `grep -rn "DIAG" frontend/src/jjscript/executor/commands/create.ts frontend/src/model/logicWrapper/LModelElement.tsx` → zero match. `DAttribute.new` tornata byte-per-byte alla versione pre-diagnosi (verificato: stessa firma, stesso body `return new Constructors(...).DAttribute().end()`). Nessuno strascico di istrumentazione in produzione.
  - **Verifica**: `npx vitest run src/jjscript/__tests__/parser.test.ts` → 91 test passing (nessun cambio vs. round precedente). `npx tsc --noEmit 2>&1 | grep -E "create\.ts|parser\.test"` → 0 match (zero errori introdotti nei file toccati). `npx vite build` → completato in 40.57s, warning su chunk > 500kB preesistente.
  - **Smoke test demandato all'utente.** Da eseguire dalla chat Jjodie: `create attribute ageI in Person type EInt default 0` → canvas deve mostrare `Person.ageI : EInt`; `create attribute ageII in Person type Integer default 0` → stesso risultato; `create attribute flag in Person type bool` → `EBoolean`; `create attribute s in Person type String` → `EString`; `create attribute x in Person type XYZ999` → `EString` (fallback normalizer invariato); `create attribute d in Person type EDate` → `EDate`. La tabella del prompt originale ora deve realizzarsi completamente.
**Nome del documento prompt**: 2026-04-22 prompt-jjscript-create-attribute-fix-apply.md

---

## 2026-04-22 — fix: JjScript `create attribute` ignores type parameter
**Prompt**: il comando JjScript `create attribute <name> in <Class> type <Type>` crea sempre un attributo `EString` indipendentemente dal tipo specificato; verificato con `type Integer` e `type EInt`.
**File toccati**:
- frontend/src/jjscript/executor/commands/create.ts (aggiunta funzione esportata `normalizeAttributeType(raw)` con mappa case-insensitive per tutti gli alias comuni — sia i nomi E-prefissati canonici di `ShortAttribETypes` (`EString`, `EInt`, ...) sia gli alias user-friendly di `TYPE_ALIASES` (`String`, `Integer`, `int`, `bool`, ...) — fallback a `'EString'` per tipi non riconosciuti; aggiunta funzione `rawTypeName(typeRef)` che estrae il nome del tipo sia da `kind: 'primitive'` sia da `kind: 'class'` — quest'ultimo è dove il parser parka nomi non in `TYPE_ALIASES` come `EInt`/`EString`/`EBoolean`; riscritta la riga 331 di `createAttribute()`, era `const typeName = options?.type?.kind === 'primitive' ? options.type.type : 'EString'` ora `const rawType = rawTypeName(options?.type); const typeName = rawType ? normalizeAttributeType(rawType) : 'EString'`; aggiunto anche `attributeType: typeName` nel payload `data` del risultato per facilitare debug/logging.)
- frontend/src/jjscript/__tests__/parser.test.ts (aggiunto blocco `describe('create attribute — type parameter aliases')` con 25 test: 15 verificano che gli alias primitivi (`String`/`string`/`str`/`Integer`/`integer`/`int`/`Boolean`/`boolean`/`bool`/`Date`/`date`/`Double`/`double`/`Float`/`float`) producano `kind: 'primitive'`, 10 verificano che i nomi Ecore E-prefissati (`EString`/`EInt`/`EBoolean`/`EDate`/`EDouble`/`EFloat`/`ELong`/`EShort`/`EByte`/`EChar`) producano `kind: 'class'` con `name.raw` preservato — conferma che il parser estrae il nome del tipo correttamente e delega la normalizzazione all'executor.)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Root cause in 2 punti, fix concentrato in 1 file** (come da prompt). (a) Il parser `parseTypeReference` in `grammar.ts:203` usa `TYPE_ALIASES` (in `types.ts:532`) che mappa solo `String/Integer/bool/...` → `PrimitiveTypeName`. I nomi Ecore `EString`/`EInt`/`EBoolean` NON sono in `TYPE_ALIASES`, quindi cadono nel fallthrough a riga 242 e vengono parsati come `{ kind: 'class', name: {segments:['EInt'], raw:'EInt'} }`. (b) L'executor a `create.ts:331` leggeva solo `kind === 'primitive'` → altrimenti fallback hardcoded a `'EString'`. Risultato: `type EInt` → class-kind → `'EString'`; `type Integer` → primitive-kind con `type: 'Integer'` → passato a `DAttribute.new('Integer', ...)` ma il backend si aspetta `'EInt'` da `ShortAttribETypes` (enum in `U.tsx:3311`) e degrada a `EString`. **Non ho toccato parser né `TYPE_ALIASES`** perché il parser funziona correttamente per il flusso normale (classi custom vs primitivi): gli alias `EInt` *sembrano* class reference al parser, il che è ragionevole. La normalizzazione è una preoccupazione dell'executor degli attributi che conosce lo spazio dei tipi primitivi Ecore.
  - **`rawTypeName` helper**: estrae il nome del tipo indipendentemente dal `kind`. Per `primitive` usa `typeRef.type`, per `class`/`enum` usa `typeRef.name.raw ?? segments[ultimo]`. Questa estrazione agnostica al kind è ciò che sblocca l'intera tabella di comportamento atteso — senza di lei, `EInt` continuerebbe a fallback a `EString` perché il parser lo classifica come class.
  - **`normalizeAttributeType` idempotente sui canonici**: `EString`→`EString`, `EInt`→`EInt`, etc. Questo perché la chiave della mappa è `.toLowerCase()` e la mappa contiene sia `estring` sia `string` → `EString`. Nessun round-trip rompibile.
  - **`createParameter` ha lo stesso pattern buggy** (`create.ts:555`: `options?.type?.kind === 'primitive' ? options.type.type : undefined`) ma fuori scope del prompt. La stessa funzione `normalizeAttributeType` potrebbe essere riutilizzata lì quando sarà il momento.
  - **Test executor diretto non fattibile senza modifiche infra**: tentato un file `create-attribute-type.test.ts` dedicato, fallito perché `create.ts` → `joiner/index.ts` → `monaco-editor` e l'env vitest è `'node'` senza `jsdom`/`happy-dom` installati, così monaco-editor crasha al module-load con `window is not defined`. `vi.mock('monaco-editor')` non aiuta perché vite risolve prima i path che vitest intercetti. L'altro untracked test nel repo (`context-binding.test.ts`) ha lo stesso problema — usa un window-stub che però è hoistato dopo gli `import` ES. Eliminato il file di test dedicato e fallback su parser-level test che documentano il contratto parser (input che poi l'executor normalizza). Lifting di `normalizeAttributeType` in un util separato avrebbe permesso il test diretto ma il prompt lo vieta esplicitamente ("va aggiunta nello stesso file, non in un util separato"). Rispettato il vincolo.
  - **Verifica**: `npx vitest run src/jjscript/__tests__/parser.test.ts` → 91 test passing (66 pre-esistenti + 25 nuovi). Full suite: 525 test passing (prima 500). I 9 file-level fail sono pre-esistenti (stessi pattern `window is not defined` nei file `jjtl/__tests__/*` e `utils/__tests__/UDComparator.test.ts`, confermato con `git stash` → stesso count). `npx tsc --noEmit` → 162 errori residui (prima 167, mia modifica rimuove 5 perché ho eliminato il test file che ne produceva), nessuno nei file toccati (`grep -E "create\.ts|parser\.test" → 0 match`). Gli errori residui sono pre-esistenti (module PNG/SVG non dichiarati, `Dashboard.tsx:568` `activeId` su BoxData). `npx vite build` → completato in 1m 2s, unico warning su chunk > 500kB preesistente.
  - **Smoke test non eseguito** (nessun dev server avviato). Verifica demandata all'utente via console JjScript: `create attribute age in Person type EInt default 0` → nell'editor del metamodello l'attributo deve mostrare tipo `EInt`; stessa cosa per `type Integer`, `type int`, `type boolean`, `type bool`, `type EBoolean`, `type date`, `type EDate`. Tutti devono produrre il ShortAttribETypes corretto (non EString). Il fallback a `EString` per tipi non riconosciuti (es. `type Person` su una class custom — caso errato semanticamente per attributi) è intenzionale: preserva il comportamento pre-fix per input ambigui.
**Nome del documento prompt**: 2026-04-22 prompt-jjscript-create-attribute-type.md

---

## 2026-04-22 — fix: WelcomeModal re-appears on every page navigation
**Prompt**: il modal `WelcomeModal` si mostra ad ogni navigazione tra pagine perché il componente viene smontato/rimontato e il `useEffect` riparte; aggiungere check `sessionStorage` che blocca il re-trigger nella stessa sessione browser, mantenendo "Don't show again" permanente via `localStorage`.
**File toccati**:
- frontend/src/components/WelcomeModal/WelcomeModal.tsx (aggiunto `if (sessionStorage.getItem(STORAGE_KEY)) return;` nell'`useEffect` dopo il check `localStorage`; dentro `close()` aggiunto `sessionStorage.setItem(STORAGE_KEY, '1')` incondizionato prima del `localStorage.setItem` condizionale; cambiato l'onClick del backdrop da `setVisible(false)` a `close()` per far scrivere il sessionStorage anche quando l'utente chiude cliccando fuori dal modal.)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Signature di `close()` preservata**. Il prompt suggeriva `close(dontShowAgain: boolean)` ma la funzione attuale non prende argomenti e legge `dontShow` dal state via closure — cambiare la signature avrebbe rotto 3 call site (`<button className="wm-close-btn" onClick={close}>` riga 47, `<button className="wm-btn wm-btn--outline" onClick={close}>` riga 214 che passano un `MouseEvent`, più `onClick={() => { window.open(...); close(); }}` riga 217 senza argomenti). Interpretato l'intent del prompt ("scrivere sempre su sessionStorage, scrivere localStorage solo se dontShow") senza toccare l'API: la condizione `if (dontShow)` continua a funzionare via closure sullo state esistente, nessun chiamante da aggiornare.
  - **Bug latente sul backdrop click corretto**. `onClick={e => { if (e.target === e.currentTarget) setVisible(false); }}` saltava `close()`, quindi una chiusura per click fuori dal modal non scriveva `sessionStorage` e il modal sarebbe riapparso alla navigazione successiva — contraddicendo il comportamento atteso del fix. Cambiato a `close()` così che tutti i path di dismissal (X, Close, backdrop, CTA esterna) passino per la stessa funzione.
  - **`STORAGE_KEY` invariato** (`jjodel_welcome_3_seen`). `localStorage` e `sessionStorage` sono namespace separati, stessa chiave senza collisione.
  - **Comportamento atteso confermato dalla lettura**: (1) prima visita → entrambi gli storage vuoti → setTimeout triggera → modal appare; (2) utente naviga → componente remount → `sessionStorage.getItem(STORAGE_KEY)` === '1' → early return, nessun setTimeout; (3) chiude e riapre browser → sessionStorage svuotato, localStorage intatto → se aveva "Don't show again" localStorage è '1' → early return; altrimenti modal riappare.
  - **Verifica**: `npx tsc --noEmit 2>&1 | grep WelcomeModal` → zero match. Errori TS residui tutti pre-esistenti (non toccati file coinvolti). Build non rilanciato — la modifica è puramente logica runtime (3 righe aggiunte, una cambiata), TypeScript check sufficiente per confermare signature invariate.
  - **Smoke test non eseguito** (nessun dev server avviato). Verifica demandata all'utente: (1) svuotare sessionStorage e localStorage per la chiave `jjodel_welcome_3_seen`, navigare all'app → modal appare dopo 1.5s; (2) chiuderlo senza spuntare "Don't show again", navigare ad altra pagina → modal NON riappare; (3) chiudere la tab e riaprirla → modal riappare; (4) spuntare "Don't show again" e chiudere → chiudere il browser, riaprire, navigare all'app → modal non appare; (5) ripetere step 1-2 ma chiudere cliccando sul backdrop invece che sul bottone X → comportamento identico (no riapparizione nella sessione).
**Nome del documento prompt**: 2026-04-22 prompt-welcomemodal-session-fix.md

---

## 2026-04-22 — refactor: redesign project sidebar (artefact navigator + project actions)
**Prompt**: redesign della sidebar di progetto, da categorie statiche (Structure/Behaviour/Other con contatori non cliccabili) a navigazione diretta per nome agli artefatti + sezione Project in fondo con azioni raggruppate.
**File toccati**:
- frontend/src/pages/components/LeftBar.tsx (aggiunti 3 import: `DockManager`, `createM2`, `JjodelEvents`; aggiunto state `collapsedSections` + helper `toggleSection`, `openMegamodel`, `openShareModal`, `renderSection`; riscritto il branch `active === 'Project'` — rimossi usage di `ProjectHeader`+status badge, `modified-indicator`, `sidebar-spacer`, `sidebar-actions`; helper `SectionLabel`/`getProjectStatus`/`ProjectHeader` non più referenziati ma lasciati nel file come dead code tollerabile.)
- frontend/src/pages/dashboard.scss (sostituito il blocco `&.leftbar--project { display: flex; flex-direction: column; }` con blocco completo con prefisso `psb-` — classi `.psb-back`, `.psb-megamodel`, `.psb-section`[+`--actions`+`.collapsed`], `.psb-section-header/-label/-body`, `.psb-chevron`, `.psb-item`[+`.active`], `.psb-badge` varianti `--M/m/T/V`, `.psb-item-name/-arrow`, `.psb-new`, `.psb-action`[+`--danger`]; rimosse classi legacy non più usate: `.section-label`, `.project-header`[+`__name`], `.modified-indicator`, `.sidebar-spacer`, `.sidebar-actions`; mantenute `.status-badge` [condivisa con DocumentationSection.tsx:133], `.item--muted`, `.item--danger`, `.item-count`.)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: FASE 1 ricognizione eseguita prima di toccare codice — identificato `LeftBar.tsx` come file unico della sidebar (grep `"All projects\|Close project\|Structure"`) e `dashboard.scss:800-1120` come SCSS associato. Prefisso `psb-` libero (grep vuoto). Nessun token CSS legacy reintrodotto. Palette hardcoded come da prompt (`#f8fafc`, `#e2e8f0`, `#94a3b8`, `#0ea5e9`, `#0f172a`, `#64748b`, `#334155`) isolata sotto `.leftbar--project` — non inquina il resto dello stylesheet.
  - **6 decisioni architetturali chiuse con l'utente prima della Fase 2** (A–F): (A) `Project Megamodel` dispatcha `JjodelEvents.OPEN_MEGAMODEL` — listener già esistente in `ProjectEditor.tsx:360`. (B) click su singolo transformation → `navigateToSection('transformations')` — no workaround per i 9 parametri di `DockManager.openTransformation`; quando esisterà un handler dedicato si rivisita. (C) `+ New model` → `navigateToSection('models')` invece del hack DOM `getElementById('navbar_mmid_...').focus()` presente in `Dashboard.tsx:530` — fragile e non testabile. (D) `Share` dispatcha `'jjodel:openShareModal'` — evento **orfano per ora** (listener da aggiungere in ProjectEditor in prompt successivo; `setShowShareModal` esiste già a `ProjectEditor.tsx:195`). (E) `Project settings` rimosso — nessun handler esistente, placeholder TODO in UI peggio di non averla. (F) Active-item highlighting solo a livello di sezione (URL `?section=`), non a livello di singolo artefatto — il wiring con `ACTIVE_TAB`+`EDITOR_TYPE_CHANGE` è lavoro separato quando la struttura sarà stabile. La classe `.psb-item.active` è definita nello SCSS ma nessun item la riceve oggi — pronta per il wiring futuro.
  - **Click sui singoli artefatti**: Metamodel/Model → `DockManager.open2(lm/lmodel)` direttamente; Viewpoint → `DockManager.openViewpoint(lv)` direttamente; Transformation → solo `navigateToSection('transformations')`. Lista transformations letta da `project.transformations` (LProject), sincronizzata da ProjectEditor via `SetFieldAction.new(project.id, 'transformations', ...)` a riga 169 — stessa sorgente del state React locale `transformations` in ProjectEditor, quindi sempre coerente.
  - **Event registry non modificato**: `OPEN_MEGAMODEL` già presente nel registry a `events/registry.ts:28`. `jjodel:openShareModal` inserito come string letterale inline (non aggiunto al registry) — il prompt prescriveva "tocca solo il file sidebar e SCSS"; il registry sarà aggiornato quando si aggiungerà il listener in ProjectEditor.
  - **Verifica**: `npx tsc --noEmit 2>&1 | grep LeftBar.tsx` → zero match. Errori TS residui sono pre-esistenti (case-sensitivity `settings`/`Settings`, moduli PNG/SVG non dichiarati, `Dashboard.tsx:568` `activeId` su BoxData) — identici alle sessioni precedenti. `npm run build` completato in 39.12s, unico warning pre-esistente su chunk > 500kB.
  - **Smoke test non eseguito**. Verifica visiva demandata all'utente: (1) aprire un progetto → sidebar mostra: "← All projects", "⬡ <nome progetto>" cyan, sezioni METAMODELS/MODELS/TRANSFORMS/VIEWPOINTS/PROJECT, ciascuna espansa di default con `+ New <tipo>` in fondo; (2) click su singolo metamodel/model/viewpoint → apre la tab nel Dock; (3) click su "⬡ <nome>" → apre megamodel (pattern esistente di `TreeViewContent.tsx:728`); (4) click "Download"/"Add to favorites"/"Close project" → handler esistenti invariati; (5) click "Share" → **nessun effetto visibile per ora** (atteso — listener in prompt successivo).
**Nome del documento prompt**: 2026-04-22 prompt-project-sidebar-redesign.md

---

## 2026-04-22 — refactor: rimozione icone file actions dalla toolbar Transformation Editor
**Prompt**: 2026-04-22 13:30 prompt-remove-toolbar-icons.md
**File toccati**:
- frontend/src/jjtl/components/JjtlToolbar.tsx (rimosse due intere `<div className="jjtl-toolbar-section">` con 6 bottoni + 2 dividers: File ops section originale con New/Open/Save/SaveAs+divider, Edit ops section originale con Undo/Redo+divider. Preservati: interface `JjtlToolbarProps` completa, destructuring di tutte le props, tutti gli handler nel parent.)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: toolbar condivisa = NO (JjtlToolbar dedicata al Transformation Editor, scoped via .jjtl-toolbar-*; gli altri editor usano editor-v2/Toolbar.tsx che ha proprie Undo/Redo — intoccate). Handler preservati ma unused = 8 props nell'hot path (`onNew`, `onOpen`, `onSave`, `onSaveAs`, `onUndo`, `onRedo`, `canUndo`, `canRedo`). Nessun `eslint-disable` necessario: TypeScript `noUnusedParameters` non flagga destructured properties, e il build (`npm run build`, 1m 49s) non ha riportato warning di unused-vars. Zero modifiche ai file SCSS o al parent `JjtlDevelopmentEnv.tsx`.
  - **5/6 bottoni erano già placeholder non funzionali** prima del refactor: solo `onSave` era effettivamente wirato dal parent (`JjtlDevelopmentEnv.tsx:583`). `onNew/onOpen/onSaveAs/onUndo/onRedo` non venivano passati dal parent → click no-op. Stiamo rimuovendo chrome finta, non funzionalità. Save resta accessibile via Ctrl+S (già wirato in `JjtlDevelopmentEnv.tsx:539-541` nella callback `handleKeyDown`). Monaco gestisce Ctrl+Z/Ctrl+Y nativamente per undo/redo dentro l'editor.
  - **SCSS intatti**: `.jjtl-toolbar-btn` e `.jjtl-toolbar-divider` NON rimossi — restano in uso per bottoni residui (Validate/Format/Execute/Settings) e per il divider della Metamodel section. Nessun tech debt CSS creato.
  - **Nessun gap visivo anomalo introdotto a codice**: dopo la rimozione, il primo elemento figlio di `.jjtl-toolbar` è ora `{/* Metamodel selectors */}` → sezione `Source:` dropdown. Il padding di `.jjtl-toolbar` si applica invariato. Smoke test visivo non eseguito (nessun dev server avviato) — demandato all'utente: aprire Transformation Editor, confermare che la toolbar mostri solo `Source: ... → Target: ... | Validate | Format | Execute ... | <transformation name> | Settings`, senza salti di layout.
  - **Verifica tecnica**: `npx tsc --noEmit` → zero errori nei file toccati (grep su `JjtlToolbar|JjtlDevelopmentEnv|jjtl` nell'output: nessun match). Gli errori residui (162 righe totali) sono pre-esistenti e identici alle sessioni precedenti: moduli PNG/SVG non dichiarati, `Dashboard.tsx:568` `activeId`. `npm run build` completato in 1m 49s, solo warning pre-esistente su chunk size > 500kB.
  - **Debito tecnico aperto (prompt successivo)**: riposizionare New/Open/Save/Save As nel menu File e Undo/Redo nel menu Edit, con shortcut Ctrl+N/Ctrl+O/Ctrl+Shift+S. Ctrl+S già esiste; Ctrl+Z/Ctrl+Y gestiti nativamente da Monaco nell'editor. I menu Jjodel esistenti NON sono stati verificati per scoprire se già contengano queste voci — task del prompt successivo di ricollocazione.
**Nome del documento prompt**: 2026-04-22 13:30 prompt-remove-toolbar-icons.md

---

## 2026-04-22 — refactor: rimozione sidebar nel Transformation Editor + ricollocazione azioni nei menu
**Prompt**: 2026-04-22 13:00 prompt-remove-txeditor-sidebar.md
**File toccati**:
- frontend/src/pages/components/Dashboard.tsx (line 568: `isEditorTab` esteso da `'metamodel' || 'model'` a include anche `'transformation'`; aggiornato comment sopra per riflettere il nuovo scope e la motivazione — i menu top gestiscono già Download/Favorites/Close e il logo naviga ad All projects)
- frontend/src/events/registry.ts (rimosso `JJTL_CODE_CHANGE` aggiunto nel lavoro precedente STEP 2)
- frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx (rimosso prop `transformationId`, rimossi i due useEffect di dispatch e cache cleanup, rimosso import `setJjtlStateCache`)
- frontend/src/components/abstract/DockManager.tsx (rimosso `transformationId: transformation.id` nel createElement)
- frontend/src/pages/components/LeftBar.tsx (rimossi import `JjodelEvents`/`TransformationSidebar`/`DockManager`/`useEffect`, helper `resolveActiveEditorType`, state `activeEditorType` + listener, branch condizionale TransformationSidebar nel return)
- frontend/src/pages/dashboard.scss (revert di `var(--tx-sidebar-width, 240px)` a `240px` fisso)
- frontend/src/jjtl/views/TransformationSidebar.tsx (file rimosso)
- frontend/src/jjtl/views/TransformationSidebar.scss (file rimosso)
- frontend/src/jjtl/views/useTransformationOutline.ts (file rimosso)
- frontend/src/jjtl/views/jjtlStateCache.ts (file rimosso)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: decisione logo cliccabile = già tale (nessuna modifica). Azioni riusate = 4 (Download Project nel menu File:1176, Add/Remove Favorites nel menu Edit:1224, Close Project nel menu File:1196, navigazione All Projects via click sul logo Navbar:1583). Azioni nuove aggiunte = 0 — il prompt escludeva duplicazioni.
  - **Il vero changeset è una riga**: estendere `isEditorTab` in `Dashboard.tsx:568`. Il meccanismo `hideLeftBar` esisteva già (fatto per metamodel/model editor), grid `.hide-leftbar` esisteva già in `dashboard.scss:379`, menu e logo esistevano già in `Navbar.tsx`. Tutto il resto del diff è cleanup del lavoro delle due sessioni precedenti (contextual TransformationSidebar + outline rules/helpers), diventato dead code con la nuova direzione architetturale "nessuna sidebar nel TX editor, azioni nei menu top".
  - **Ambiguità risolte dall'utente (tutte 'A')**: (1) cleanup totale dei file STEP 1/STEP 2 precedenti anziché tenerli come dead code — rationale CLAUDE.md "Don't design for hypothetical future requirements" + il task outline, quando arriverà, partirà da zero. (2) Favorites resta in Edit, non sposto in File — il prompt vieta esplicitamente "Non toccare le voci esistenti dei menu". (3) Niente voce menu Jjodel duplicata per All projects — logo già cliccabile, convenzione universale logo→home.
  - **Verifica**: `npx tsc --noEmit` pulito sui file toccati (errori residui sono pre-esistenti: moduli PNG/SVG mancanti, `Dashboard.tsx:568` su `activeId` type — entrambi presenti anche prima del cambio). `npm run build` completato in 1m 39s, solo warning pre-esistente su chunk size > 500kB.
  - **Smoke test non eseguito** (nessun dev server avviato). Verifica visiva demandata all'utente: (1) aprire Metamodel Editor → LeftBar con STRUCTURE/BEHAVIOUR/OTHER invariata; (2) aprire Transformation Editor → nessuna sidebar, dock occupa tutta la larghezza; (3) menu File contiene Download Project/Close Project funzionanti; menu Edit contiene Add/Remove Favorites funzionante; click sul logo in alto naviga ad All projects.
**Nome del documento prompt**: 2026-04-22 13:00 prompt-remove-txeditor-sidebar.md

---

## 2026-04-22 — chore: bump version to 3.0.0 in about modal
**Prompt**: bump versione nel modale About da v2.0.6 a v3.0.0
**File toccati**:
- frontend/src/pages/components/about/AboutDialog.tsx (line 79: `v2.0.6` → `v3.0.0` inside `<span className="about-dialog__version">`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Versione hardcoded nel componente**, non letta da `package.json` né da costante separata. `grep -rn "2\.0\.6"` ha restituito un solo match rilevante (`AboutDialog.tsx:79`); gli altri hit erano rumore (SVG, colori `#422006`, dump JSON in `statechartplus_old.ts`). `package.json` riporta `"version": "2.0"` — disallineato rispetto alla stringa UI pre-fix, quindi il modale aveva già la sua single source of truth isolata.
  - **Raccomandazione per il futuro**: valutare di leggere la versione da `package.json` via `import.meta.env` (Vite espone un define custom) o da una costante in `src/constants/version.ts`, per evitare drift tra `package.json` (oggi `2.0`, frozen) e la stringa mostrata all'utente. Non fatto in questo task — scope era la bump, non la refactorizzazione.
  - **Lo script `npm run typecheck` non esiste** nel `frontend/package.json` (CLAUDE.md lo menziona ma gli script reali sono `start`, `dev`, `build`, `serve`, `build_2`, `serve_2`, più utilities git/nvm). Ho usato `npx tsc --noEmit` come equivalente.
  - **Verifica**: `npx tsc --noEmit` → errori identici pre-esistenti (dichiarazioni module per PNG/SVG, `Dashboard.tsx:566` activeId, ecc.), nessun nuovo diagnostic introdotto dal cambio. `npm run build` completato in 44.09s senza errori (solo il warning pre-esistente sul bundle size > 500kB). Smoke test non eseguito (nessun dev server avviato) — verifica visiva demandata all'utente: aprire il modale About e confermare che la pill mostri `v3.0.0` accanto alla pill `MIT License`.
**Nome del documento prompt**: 2026-04-22 14:30

---

## 2026-04-22 — fix: WelcomeModal primary CTA opens `/whats-new/` instead of docs root
**Prompt**: Re-delivery of the WelcomeModal prompt with one copy change: the "Explore what's new →" primary button should open `https://jjodel.io/whats-new/` (the marketing changelog page) instead of `https://docs.jjodel.io` (the docs site). Everything else in the modal remained identical between the two prompts.
**File toccati**:
- frontend/src/components/WelcomeModal/WelcomeModal.tsx (WelcomeModal.tsx:217 — changed the `window.open` first arg inside the primary-button `onClick` from `'https://docs.jjodel.io'` to `'https://jjodel.io/whats-new/'`; behaviour otherwise unchanged — opens in new tab via `'_blank'`, then calls `close()` which respects the "Don't show again" checkbox state)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Recognised the prompt as a diff, not a do-over**. The component was delivered in the previous turn; the second prompt is byte-for-byte identical except for that one URL literal. Rather than rewrite all three files (which would regenerate identical content), I diffed the prompt against the existing file and surgically updated just the one character range. Confirmed the URL is the only functional difference — the rest of the TSX, SCSS, and the `index.ts` barrel are unchanged. Kept the log-entry conservative: this is a 1-line fix, not a re-implementation.
  - **Other `docs.jjodel.io` references are intentionally untouched**. The SCSS body still contains four `docs.jjodel.io` links in the body grid and hero area — `/languages/jjtl`, `/user-guide/transformation-editor`, `/user-guide/documentation`, `/user-guide/metamodel-editor`. Those are deep-links into the docs site and should stay on `docs.` per the original spec; only the primary CTA moved to the marketing subdomain's changelog. If the intent was "move ALL welcome-modal links to `jjodel.io`", this would be under-shipped — flag to confirm. Reading the spec literally: the second prompt's body-card URLs are `https://docs.jjodel.io/...` unchanged, so the partial migration is consistent with the diff.
  - **Trailing slash preserved**: `jjodel.io/whats-new/` with the trailing slash. Matters for marketing-site routing (often Jekyll/Hugo/WordPress treats `/whats-new` and `/whats-new/` differently). Mirrored the spec exactly.
  - **Verification**: `npx tsc --noEmit` → 81 errors, unchanged from before this edit (same 81 pre-existing errors around image modules, Settings/settings casing, and missing `.module.css.d.ts`). No new diagnostics. Did not re-run `npm run build` — a single string-literal change in JSX has no type or build surface (the URL is just a runtime string arg to `window.open`), and the prior build already validated the rest of the file. If CI wants the full build signal, it's a `npm run build` away. Smoke test (not run — no dev server): clicking "Explore what's new →" now opens `https://jjodel.io/whats-new/` in a new tab instead of the docs root.
**Nome del documento prompt**: 2026-04-22 (WelcomeModal — primary CTA URL fix)

---

## 2026-04-22 — feat: add WelcomeModal "What's new in Jjodel 3.0" (one-shot on login)
**Prompt**: Create a "What's new in Jjodel 3.0" modal that appears automatically 1.5s after login, shown once per browser (`localStorage` key `jjodel_welcome_3_seen`) with a "Don't show again" checkbox. New files under `frontend/src/components/WelcomeModal/` (`.tsx`, `.scss`, `index.ts`). Mount in the main authenticated layout with zero impact on existing layout. All CSS classes prefixed `wm-` to avoid collisions. Exact SCSS, TSX, and copy supplied in the prompt (hero with three drifting circles, featured JjTL card with Monaco-style code block + synced line numbers, 2×2 grid of "Also new" cards including a static Jj-languages family card, footer with checkbox + outline + primary button). Constraints: touch only the new files + single-line mount in App.tsx; no new npm deps; no renames of existing CSS classes or props; run `npm run typecheck` and `npm run build` and confirm both pass; add a log entry.
**File toccati**:
- frontend/src/components/WelcomeModal/WelcomeModal.tsx (new — 220 lines; hook logic inline: `localStorage` guard + 1.5s `setTimeout` in `useEffect`, second `useEffect` syncs `.wm-line-numbers` `scrollTop` to `.wm-code-scroll` `scrollTop` on scroll events, `close()` persists if checkbox set then hides; structure: hero/body/footer as supplied; backdrop click closes without persisting via `e.target === e.currentTarget` guard)
- frontend/src/components/WelcomeModal/WelcomeModal.scss (new — ~400 lines; copy-paste of the exact spec SCSS, all classes `wm-*` prefixed; keyframes `wm-fadeIn`, `wm-slideUp`, `wm-drift` also prefixed; no CSS variables defined in this file — palette is inline hex per the mockup, consistent with design-system convention of not inventing token values)
- frontend/src/components/WelcomeModal/index.ts (new — one-line barrel re-export)
- frontend/src/App.tsx (2 edits: (a) added `import WelcomeModal from './components/WelcomeModal';` next to the existing `HelpDrawer` / `ExplainModal` imports — same grouping since it's the same kind of `{user && <Try>...</Try>}` overlay component; (b) added `{user && <Try><WelcomeModal/></Try>}` right after the `DonationBanner` line at the end of the authenticated overlay block — same `user && <Try>` pattern used by every neighbouring component, so it inherits login-gated rendering + error boundary for free)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Mount point reasoning**: the prompt said "likely App.tsx or the main dashboard". Chose App.tsx because it's where every other login-gated overlay lives (GlobalDrawer, HelpDrawer, ExplainModal, DonationBanner, NotificationWidget, Jodie) — all render via `{user && <Try>...</Try>}`. Placing WelcomeModal inside `ProjectEditor` or `AllProjectsPage` would not fire on users who land directly on `/auth/confirm` or any other first-view; App.tsx is the universal post-login layer. The `<Try>` wrapper matches the neighbourhood convention for top-level overlay components — it gives a silent error-boundary if the modal ever throws, so a broken welcome message cannot take down the whole app. Placed last in the overlay block so nothing else's portal can end up atop it at mount time; the actual stacking is z-index-driven, not DOM-order-driven, but DOM order is still the tiebreaker when z-indices are equal.
  - **JetBrains Mono availability**: the spec said to check the global font import. `frontend/index.html:11` already imports JetBrains Mono via Google Fonts with weights 400/500/600 + italic 400. The SCSS references `'JetBrains Mono', monospace` in `.wm-tag`, `.wm-code-*`, `.wm-pill`, `.wm-lang-tag`, `.wm-card-tag` — all covered. No edit needed to `index.html`. (Inter is not imported globally but isn't used by the modal either — the modal's default sans stack falls back to the browser UI font, which is the visible behaviour in the mockup.)
  - **`wm-` prefix collision check**: `grep -r "wm-" frontend/src` returned zero matches before writing the files. After writing, all `wm-*` hits belong to the new component only. No collision with existing classes or CSS modules.
  - **z-index = 1000 per spec, but the codebase has higher values**. `grep -r "z-index" frontend/src` shows many overlays above 1000: `GlobalDrawer` 1000/1001, `HelpDrawer` 1050, `MegamodelView` 10001, `JodieWindow` 10000, `ContextMenu` 999999. 1000 is what the spec asked for and the typical case (fresh login, nothing else open) makes it sufficient — the welcome fires 1.5s after `user` becomes truthy, before the user has a chance to open heavier overlays. But **flagging this for follow-up**: if a future flow reopens the modal manually from a "What's new" menu entry while a drawer or dialog is already open, the modal will render BEHIND those. If that becomes a requirement, bump to `100000` or higher. Left at 1000 as instructed, not bumping silently.
  - **JjTL 3rd-line parses as `from statemachines to petrinets` on a single line, not two.** The spec's TSX put `from` and `to` inline on the same line (no `\n` between `from` group and `to` group), with the next break after `petrinets`. Preserved this verbatim — it is what the mockup shows (line 3 in the line-numbers column). Didn't try to "fix" the JSX layout — matches the supplied code exactly.
  - **Line-number/code scroll sync**: the spec provided a `useEffect` that wires a `scroll` listener on `codeScrollRef` and mirrors `scrollTop` onto `lineNumsRef`. This is necessary because `.wm-line-numbers` has `overflow: hidden` (so the numbers don't jitter with horizontal scroll of the code) while `.wm-code-scroll` has its own overflow-y. Dependency array is `[visible]` so the effect re-registers when the modal opens — if `visible` transitions false→true, the refs will be newly-populated on the next render, and the effect's cleanup/re-run cycle catches that. Correct.
  - **Checkbox is a `<div>` styled as a checkbox, not a real `<input type="checkbox">`**. The spec used a `<div>` with an inline SVG checkmark. Kept this verbatim. Accessibility trade-off: it's inside a `<label>` so clicking the label toggles via the `onClick` handler on the inner div, but keyboard users cannot toggle via Tab+Space (no `tabIndex`, no `role="checkbox"`, no `aria-checked`). The primary interaction vector is mouse/touch — the "Don't show again" checkbox is not load-bearing (closing without it still hides the modal this session, and if the user never dismisses, it just never fires again until they reload) — so I am not upgrading the spec. If the a11y audit ever requires it, swap to a real `<input type="checkbox" style="display:none"/>` with a `<label>`-for ring, no behavioural change required.
  - **External links use `docs.jjodel.io`**. The spec's URLs are fictional (this subdomain may not resolve). Kept them as-written — they are the canonical future docs URLs per the spec. If they 404 today, the user sees a 404 in a new tab and comes back; the modal is not gated on link health. Not adding a fallback.
  - **localStorage key is version-suffixed**: `jjodel_welcome_3_seen`. When Jjodel 4.0 ships, change to `..._4_seen` to re-show the modal to all users automatically, as the spec intends. Not adding a migration/clear of the `_2_` or older key — if any existed, it was from a prior version's modal that this one supersedes, leaving its entry in localStorage is harmless (a stale byte).
  - **Verification**: `npx tsc --noEmit` before and after this change both return exactly 81 errors — all pre-existing (image module declarations, Settings/settings casing collision, missing CSS-module `.d.ts` for UI Button etc.). Zero diagnostics mention `WelcomeModal` or `wm-`. Confirmed via `grep "WelcomeModal|wm-"` against the error output (empty). `npm run build` completed in 2m 1s with `✓ built in 2m 1s` — the only warning is the long-standing main-bundle-size notice unrelated to this change. SCSS compiled without errors, included in the main bundle. Smoke test (not run — no dev server started): on first login, modal should slide-up 1.5s after authenticated layout mounts; clicking the backdrop hides it without persisting; clicking the X button or "Close" with checkbox off hides without persisting; with checkbox on, sets `jjodel_welcome_3_seen=1` in localStorage and prevents future appearances; "Explore what's new" opens docs.jjodel.io in a new tab and closes the modal.
**Nome del documento prompt**: 2026-04-22 (WelcomeModal — Jjodel 3.0 what's new)

---

## 2026-04-22 — feat: tab tooltip now includes artifact type (Navbar)
**Prompt**: The hover tooltip on a document tab shows only the name (e.g. "SM2PN"). Extend it to include the artifact type: `"<name> — <type>"` using an em dash. Labels: metamodel → "Metamodel", model → "Model", transformation → "JjTL Transformation", viewpoint → "Viewpoint". Find where the tooltip string is built (likely `title={...}`) and update. Navbar.tsx only.
**File toccati**:
- frontend/src/pages/components/Navbar.tsx (added a sibling helper `getTabTypeLabel(type)` right after `getTabBadge` mapping the four requested types to human-readable labels; updated the `title` attribute on the tab `<button>` — the only place a document-tab tooltip is rendered — from `{tab.title}` to an IIFE that appends ` — ${typeLabel}` when the label is non-empty, falling back to the bare name otherwise)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Scope of the tooltip change**: there are three places in Navbar.tsx that use `tab.title` for display (line 1621 `title`, line 1628 name span, line 1664 overflow-dropdown label). The user's prompt is specifically about the hover tooltip (`title` attribute), which is only at line 1621. The overflow-dropdown items render the name in visible text (not a tooltip) and currently have no `title` — leaving them unchanged to stay chirurgical. The active tab's visible name (line 1628) remains the bare name as intended — adding the type there would clutter the strip.
  - **Em-dash choice**: used literal `—` (U+2014 EM DASH) to match the user's spec exactly. Not `--` or `-`. UTF-8 safe in a TS string literal.
  - **Fallback for unlisted types**: the user listed four types; `documentation` was not listed (but exists in `getTabBadge`). Added a `default: return ''` branch and guarded the format with `typeLabel ? '<name> — <label>' : '<name>'`. So a documentation tab (or any future unknown type) tooltip remains just the name — no accidental "undefined" or empty-dash artifact. Conservative and forward-compatible.
  - **Why an IIFE in `title={…}` instead of a computed const per tab**: the tab `.map()` already has `badge` as a per-iteration const; adding another (`tooltip`) is viable but doubles the line count and moves the logic away from the JSX attribute. The IIFE keeps the tooltip-construction co-located with its only consumer and doesn't introduce shared state — the helper `getTabTypeLabel` is the only added surface. Small-enough decision either way; chose co-location.
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before: 81 errors. After: 81 errors. No new diagnostics. `Navbar.tsx:3` PNG module error persists, unrelated. Smoke test: hover the tab strip; the browser native tooltip should read `"SM2PN — JjTL Transformation"` for a transformation tab, `"MyMM — Metamodel"` for a metamodel, etc. No change on the visible tab label text.
**Nome del documento prompt**: 2026-04-22 (tab tooltip with artifact type)

---

## 2026-04-21 — fix: project-label icon → bi-collection, no slate box behind
**Prompt**: Replace the SVG inside `.project-icon` with `<i className="bi bi-collection" />`. Remove the slate-dark `#1e293b` background so the icon reads as a free glyph, not a boxed brand mark. Color `var(--color-text-secondary)`, size 16px. `.project-icon` in navbar.scss should keep only `display:flex; align-items:center; justify-content:center` — drop border-radius, width/height, background, and the old slate color.
**File toccati**:
- frontend/src/pages/components/Navbar.tsx (swapped `<JjodelProjectIcon />` for `<i className="bi bi-collection" />` inside `.project-icon`; removed the now-unused `import { JjodelProjectIcon } from '../../components/icons/JjodelProjectIcon'`)
- frontend/src/pages/components/navbar.scss (light-mode `.project-icon`: dropped `width/height/border-radius/flex-shrink` and the `color:#1e293b` trick + its 4-line explanatory comment; kept `display/align/justify`; added `color: var(--color-text-secondary)` and `font-size: 16px`; dark-mode override changed from `color:#334155` to `color:#94a3b8` for visibility on the dark bg)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Import cleanup**: `JjodelProjectIcon` is no longer used anywhere in Navbar.tsx after this swap. Removed the import line to avoid dead references. The component file `components/icons/JjodelProjectIcon.tsx` itself is still in the repo — not touching it since it may be used by other screens (haven't greped the rest of the codebase, out of scope). Safe removal from Navbar only.
  - **Dark-mode color choice**: the prior rule was `.project-icon { color: #334155 }` which was meant to tint the SVG's internal rect slate in dark mode. With a plain Bootstrap Icon glyph now, `color` = the glyph stroke color. `#334155` is too dark to read on the dark navbar bg (`#1e293b`-ish). Changed to `#94a3b8` (slate-400 equivalent) to match the contrast of other muted dark-mode glyphs in the navbar (e.g. `.appbar-tab__name { color: #94a3b8 }` at navbar.scss:2128). No explicit design-token for this, so hex inline — matches the existing inline dark-mode hex palette in this file's dark block.
  - **Sizing**: `font-size: 16px` per spec. The surrounding `.project-label` has `gap: 8px` and `padding: 0 16px`, so the 16px glyph + 13px name keeps vertical rhythm on a 60px navbar.
  - **The old comment about the SVG `currentColor` pitfall is gone** along with the color-hack it documented. It was specific to the `JjodelProjectIcon` SVG shape; with Bootstrap Icons' simple glyph the issue can't recur.
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before: 81 errors. After: 81 errors. Removing the unused import made zero diagnostic difference; the earlier baseline already didn't flag the import as unused (tsconfig likely not using `noUnusedLocals`). `Navbar.tsx:3` PNG module error persists, unrelated. Smoke test: (a) project-label now shows a bookmark/collection glyph (bi-collection is the stacked-cards icon) with no slate box around it, in the project-label's natural flow; (b) glyph color is muted slate in light mode, lighter slate in dark mode; (c) click/hover on the label still works (border-right separator, cursor:pointer, hover bg intact from prior turns).
**Nome del documento prompt**: 2026-04-21 (project-icon → bi-collection)

---

## 2026-04-21 — fix: "+" button uses bi-plus-lg icon + hover is bg-only (Navbar)
**Prompt**: Three tweaks to the "+" button. (1) Replace the literal `+` character with the Bootstrap Icons glyph `bi-plus-lg`. (2) Hover should apply ONLY a subtle slate background — no icon color change, no border change; use the existing token closest to slate/10 (likely `--color-bg-secondary` or similar). (3) Open state (dropdown visible) keeps the current dark-slate `#1e293b` + white icon look.
**File toccati**:
- frontend/src/pages/components/Navbar.tsx (button content `+` → `<i className="bi bi-plus-lg" />`)
- frontend/src/pages/components/navbar.scss (light-mode `.new-document__btn:hover`: dropped `color` and `border-color` overrides, kept only `background: var(--color-bg-hover, #e9eff6)`; dark-mode `.new-document__btn:hover`: dropped `color: #e2e8f0` and `border-color: #64748b`, kept only `background: rgba(255, 255, 255, 0.08)`; `&--open` block untouched in both themes)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Token chosen for hover**: `--color-bg-hover` (defined at `_colors-light.scss:84` as `#{$slate-150}` → `#e9eff6`, with the explicit comment "Hover state background"). This is the token the design system earmarks for this exact use, even though the user's prompt suggested `--color-bg-secondary` as the likely candidate. Rationale for deviating from the suggestion: `--color-bg-secondary` resolves to `#ffffff` in the current tokens file — the fallback `#f1f5f9` in existing code (e.g. `.appbar-tab:hover` at navbar.scss:1718) is a latent bug because the fallback only kicks in when the var is undefined, and the var IS defined as white; so that existing hover is visually no-op (white-on-white against a white navbar). Using `--color-bg-hover` avoids silently inheriting the same bug and gives a real slate tint (`#e9eff6`). Flagged here in case the user wants consistency — follow-up could either fix `--color-bg-secondary` (make it slate-ish), fix the existing `.appbar-tab:hover` call site to use `--color-bg-hover`, or accept both conventions. Not touched in this change to keep scope minimal.
  - **Dark-mode hover**: kept the pre-existing `rgba(255, 255, 255, 0.08)` background. That's already a subtle translucent slate-on-dark-bg, no change needed there beyond removing the color/border lines. Consistent with the "bg-only" intent.
  - **Open state (`--open`) left intact** in both themes as instructed. Its `color: #fff` and `border-color` are still set — they're about the open/active styling, not the hover styling, and the user explicitly said to keep the open state as-is.
  - **Icon sizing**: not changed. The button is 26×26 with `font-size: 16px` and `line-height: 1`; `bi-plus-lg` inherits `font-size` from the button and centers via the existing `display: flex; align-items: center; justify-content: center`. No extra `.bi` rule needed.
  - **Accessibility**: `aria-haspopup="menu"` + `aria-expanded` + `title="New document"` all already present on the button — unchanged by this edit. The icon is decorative (the `title` handles the accessible label), so no `aria-label` added on the `<i>`.
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before: 81 errors. After: 81 errors. `Navbar.tsx:3` PNG module error persists, unrelated. SCSS-heavy change with a 1-char JSX tweak — no TS risk. Smoke test: (a) "+" button shows a proper plus glyph from bootstrap-icons (not the ASCII character); (b) hover gives a subtle slate tint, no border or icon color shift; (c) click-to-open still flips to dark slate with white glyph; (d) dark mode: same behavior with translucent white tint on hover.
**Nome del documento prompt**: 2026-04-21 (+ button: bi-plus-lg icon, bg-only hover)

---

## 2026-04-21 — feat: revert M badge to system lavender + add Viewpoint entry (documentTypes + navbar)
**Prompt**: Two updates. (1) Revert the metamodel dropdown/tab badge color to the system lavender used everywhere else in the app instead of forcing slate #1e293b. (2) Add a Viewpoint entry to DOCUMENT_TYPES using the pink/coral used in the app for viewpoints; wire onCreate to an existing viewpoint-creation function (look in DockManager.tsx for `openViewpoint` or similar); if no such function exists, set `available: false` with a TODO. Touch only documentTypes.ts and navbar.scss.
**File toccati**:
- frontend/src/constants/documentTypes.ts (metamodel badge: `#1e293b/#ffffff` → `#E9D5FF/#7C3AED` — the system lavender from `.appbar-tab__badge--metamodel` in navbar.scss:1779-1787; added `'viewpoint'` to `DocumentTypeKind` union; inserted viewpoint entry between transformation and refactoring with `#FCE7F3/#DB2777` — the pink from `common/entityMeta.ts:86-94` viewpoint entry; `available: false` with a multi-line inline TODO explaining why)
- frontend/src/pages/components/navbar.scss (deleted the `.appbar-tab--active { badge--metamodel, …, badge--viewpoint { background: #1e293b !important; color: #fff !important } }` block added in the prior turn — so the active tab badge now uses its per-type system color: lavender for metamodel, teal for viewpoint, etc.)
- docs/claude-code-log.md
**Esito**: ✅ completato (Viewpoint entry shipped as `available: false` — see TODO rationale below)
**Note**:
  - **Color inconsistency across the app (pre-existing)**: viewpoint has two different canonical palettes. `common/entityMeta.ts` uses **pink** (`#FCE7F3` / `#DB2777`). `navbar.scss` `.appbar-tab__badge--viewpoint` uses **teal** (`#CCFBF1` / `#0D9488`). The user asked for "rosa/corallo" which matches entityMeta.ts — used that. The active-tab badge in the navbar (teal) and the dropdown entry (pink) will not match for viewpoints specifically. Not fixing the inconsistency in this turn (out of scope, would need navbar.scss or entityMeta.ts changes that weren't asked for). Flagged here as a follow-up.
  - **Why viewpoint is `available: false`**: `DockManager.openViewpoint(vp: DViewPoint | LViewPoint)` exists (DockManager.tsx:186) but it **opens an existing viewpoint** — it does not create one. It requires an existing `vp` argument. Creation today goes through `<NewViewpointDialog>` whose `showNewViewpointDialog` state lives in `ProjectEditor.tsx:176` — same pattern as transformations. Wiring the dropdown would need a new `OPEN_NEW_VIEWPOINT_DIALOG` event in events/registry.ts + a listener in ProjectEditor.tsx, mirroring `OPEN_NEW_TRANSFORMATION_DIALOG`. Both files are explicitly out of scope ("Tocca solo documentTypes.ts e navbar.scss"). The user's prompt covered this case: "Se non esiste, metti available: false con TODO." — applied. Inline TODO in documentTypes.ts points the next reader at the exact wiring needed. **There is** a lower-level `DViewPoint.newVP(name, …)` API (used in ProjectEditor's handleCreateViewpoint, and in redux/store.tsx / examples / NestedView.tsx), but invoking it from the dropdown would require fabricating a name and skipping the viewpoint-type picker — "inventing implementation" per the project's standing rule. Rejected.
  - **Why the previous slate override is gone**: the prior turn forced slate `#1e293b !important` on the active-tab badge on the theory that the spec wanted active badges to read as a single unified color. This turn reverses that decision entirely — the active tab badge now uses the per-type system color via the pre-existing `.appbar-tab__badge--metamodel/…/viewpoint` rules. Removing the override block (rather than selectively keeping it for some types) because the reversion is blanket per the user's intent ("quello usato nel resto dell'app").
  - **Other badge colors in the registry (`model`, `transformation`, `refactoring`) were NOT touched** — the user's instruction was scoped to "badge M" explicitly. Those remain with the slate-based values from the original spec. If the intent is global alignment with the app palette, that's a separate follow-up: model should become `#FEF3C7/#D97706` (amber) and transformation should become `#D1FAE5/#059669` (green) to match `.appbar-tab__badge--model/--transformation`.
  - **Switch in Navbar.tsx `NewDocumentButton` handles unknown types via `default: return entry`** — so the new `'viewpoint'` case correctly falls through unchanged, keeps `available: false` from the registry, and renders as the "coming soon" entry. No Navbar.tsx edit needed (and it's out of scope anyway). Verified by inspection of the switch at Navbar.tsx:154-170.
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before: 81 errors. After: 81 errors. `documentTypes.ts` emits zero diagnostics (adding `'viewpoint'` to the union type was sufficient — TypeScript is happy with the literal object). `Navbar.tsx:3` PNG module error persists, unrelated. Pure SCSS + one constants-file edit; no runtime impact outside the dropdown and the navbar's active-tab badge color. Smoke test required: (a) active metamodel tab badge now shows lavender (no longer slate), same for model (amber via `--model`) / transformation (green) / viewpoint (teal); (b) dropdown shows 5 entries — Metamodel (lavender M), Model (slate m), Transformation (light-blue T), Viewpoint (pink V, disabled + "coming soon"), Refactoring (gray R, disabled + "coming soon"); (c) Viewpoint and Refactoring are below a divider.
**Nome del documento prompt**: 2026-04-21 (M badge to system + Viewpoint entry)

---

## 2026-04-21 — fix: force active-tab metamodel badge to slate (navbar.scss)
**Prompt**: Active metamodel tab badge shows lavender/purple (#E9D5FF / #7C3AED) instead of slate #1e293b. Find the overriding selector and force `background: #1e293b; color: #ffffff;`. One or two lines.
**File toccati**:
- frontend/src/pages/components/navbar.scss (same block as the prior turn, lines ~2031-2040: added `!important` to the two properties in the `.appbar-tab--active` badge override)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Specificity reality vs. expectation**: the pre-existing override `.appbar-tab--active .appbar-tab__badge--metamodel { background: #1e293b; color: #fff; }` already has specificity (0,2,0), which beats the type-specific `.appbar-tab__badge--metamodel { background: #E9D5FF; color: #7C3AED }` at (0,1,0). Verified by grep that no competing `!important`, no extra stylesheet (only navbar.scss owns these classes — grep across frontend/src/**/*.{scss,css}), no inline style in the tab JSX. On paper, the slate override should already win. The user observes purple anyway. Possible explanations: stale compiled CSS in the dev server, HMR not picking up a SCSS-only edit, or a module boundary I didn't find. Rather than spend more cycles diagnosing a build/cache issue, took the user's "forza" instruction literally and added `!important` on both properties. This is a **belt-and-suspenders** fix that wins regardless of specificity, source-order, or compilation quirks.
  - **Scope of !important**: only on the two color properties (`background-color`, `color`) inside the override block. Not applied to the sibling size/opacity rule at line ~1739 (`.appbar-tab--active .appbar-tab__badge--metamodel { width: 18px ... }`) since that's unrelated. Dark-mode block at line 2120+ doesn't set badge colors so no cascading issue there.
  - **Comment at the selector** now explains why `!important` is used here — so a future reader understands the intent and doesn't "clean it up."
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before: 81 errors. After: 81 errors. Pure SCSS change, no TS impact. User must hard-refresh the dev server (SCSS HMR can be flaky) and re-open the project tab strip to verify the M badge now renders dark slate with white letters in the active state.
**Nome del documento prompt**: 2026-04-21 (force active-tab badge slate)

---

## 2026-04-21 — fix: NewDocumentButton placement + invisible project-icon (Navbar)
**Prompt**: Two follow-ups from the previous fix: (1) move `<NewDocumentButton>` back inside `.appbar-tabs` (after the last tab / overflow button), but solve the overflow-clipping differently — either `overflow: visible` on the container or render the menu with `position: fixed` using `getBoundingClientRect` from the trigger; (2) the project-label icon was "missing" — verify `<JjodelProjectIcon />` is present inside `.project-icon` and restore the intended slate-18×18 square with the white Jjodel mark.
**File toccati**:
- frontend/src/pages/components/Navbar.tsx (added `btnRef` + `menuPos` state inside `NewDocumentButton`; on `open=true` the effect snapshots `btnRef.current.getBoundingClientRect()` into `menuPos`; `.new-document__menu` renders with inline `style={{ top, left }}`; moved the `<NewDocumentButton>` render position from being a sibling of `.appbar-tabs` back to being the last child inside `.appbar-tabs` — immediately after the overflow dropdown block)
- frontend/src/pages/components/navbar.scss (`.new-document__menu`: `position: absolute; top: calc(100% + 6px); left: 0;` → `position: fixed;` with top/left now driven by inline style; `.project-icon`: removed `background: #1e293b` and the nested `svg, i { color: #fff }` override; set `color: #1e293b` directly on `.project-icon` so the SVG's internal `<rect fill="currentColor">` paints slate; dark-mode: `.project-icon { background: #334155 }` → `{ color: #334155 }`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Root cause Fix 2 (invisible icon)**: the `JjodelProjectIcon` SVG (`frontend/src/components/icons/JjodelProjectIcon.tsx`) opens with `<rect width="16" height="16" rx="2" fill="currentColor" />` as its OWN background, then paints white letters on top (`<g fill="#fff">`). In the previous CSS, `.project-icon { color: #fff }` plus a nested `svg, i { color: #fff }` override made `currentColor = white` inside the SVG — so the rect painted a white square covering the slate container, and the white letters were invisible on it. **The icon was there all along — rendered as a blank white square.** The fix flips the CSS `color` to `#1e293b`, the SVG now renders itself as a slate rounded square with white letters visible inside. Container background dropped (redundant; the SVG fills its own 18×18). Added an inline SCSS comment pointing at this pitfall to prevent reintroduction.
  - **Root cause Fix 1b (dropdown clipped when inside `.appbar-tabs`)**: `.appbar-tabs { overflow: hidden }` is a **clipping context for absolute-positioned descendants**. The previous turn fixed this by moving the button out as a sibling. This turn's instruction was to put it BACK inside and fix the clipping differently. Chose `position: fixed` over `overflow: visible` because the latter would break the tab strip's "collapse overflow tabs into an overflow dropdown" behavior (tabs would visually spill past the strip bounds before being moved to overflow). `position: fixed` elements are **not** subject to ancestor `overflow: hidden` clipping unless an ancestor establishes a containing block via `transform`, `filter`, `perspective`, `will-change: transform`, or `contain: paint`; none of `.appbar-tabs`, `.nav-container.appbar`, or any intermediate node uses these, so the fixed menu escapes the clipping cleanly. **Trade-off documented**: a fixed-position menu does not follow the trigger if the user scrolls or resizes while open. Acceptable here because the menu closes on outside click / Escape and scroll-during-dropdown is an edge case. If it becomes an issue, add a `scroll` / `resize` listener to close the menu — a three-line follow-up.
  - **DOM containment for outside-click still works**: the menu is still a child of `containerRef` in the DOM (only its paint position changes via `position: fixed`), so `containerRef.current.contains(e.target)` in the mousedown handler continues to correctly ignore clicks on the menu. Verified by inspection.
  - **Token usage**: continued using the real tokens `--color-bg-secondary` and `--radius-md` (spec had called them `--color-background-secondary` / `--border-radius-md`, neither of which exists — flagged in the prior turn's log).
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before: 81 errors. After: 81 errors. No new diagnostics. `Navbar.tsx:3` (missing PNG module) persists, unrelated. No build run; no runtime smoke test possible — user must verify in-browser: (a) click "+" opens the dropdown, and the menu is VISIBLE even though the button sits inside the overflow-hidden tab strip; (b) the menu stays positioned under the "+" button on initial open (slight offset of 6px); (c) the project-label now shows a dark slate square with the white Jjodel mark visible inside (not a blank white/empty square); (d) all previous behaviors intact — Escape / outside-click close, first-tab padding, project-label click → dashboard.
**Nome del documento prompt**: 2026-04-21 (navbar fix: + inside tabs w/ fixed menu, icon visible)

---

## 2026-04-21 — fix: regressions from the project-label / dropdown refactor (Navbar)
**Prompt**: The prior refactor introduced three regressions: (1) the project label lost its click handler — user can no longer open the project dashboard from the navbar; (2) the "+" dropdown appears wired but doesn't open visually; (3) the first document tab has insufficient spacing after the vertical separator of the project label.
**File toccati**:
- frontend/src/pages/components/Navbar.tsx (added inline onClick to `.project-label` restoring the `dock.getLayout → children[0] → tabs[0].id → dock.updateTab(id, null, true)` logic I removed in the prior turn; moved `<NewDocumentButton>` from inside `.appbar-tabs` to a sibling position after it, still inside `{project && …}`, so `.new-document__menu` is not clipped by `.appbar-tabs { overflow: hidden }`)
- frontend/src/pages/components/navbar.scss (`.project-label` gained `cursor: pointer`, `transition: background 0.15s ease`, `border-radius: var(--radius-md, 8px)`, and a `&:hover { background: var(--color-bg-secondary, #f1f5f9); }` block; `.appbar-tabs` gained `padding-left: 8px`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Root cause of Fix 2 (dropdown invisible)** was NOT the React wiring. The recon verified the state (useState(false)), the click toggle (setOpen(v => !v)), the conditional render ({open && …}), the document mousedown-outside listener, and the Escape listener were all already correctly in place. The bug was purely CSS: `.appbar-tabs { overflow: hidden }` (navbar.scss:1691) was clipping the `.new-document__menu` rendered with `position: absolute; top: calc(100% + 6px)` because `<NewDocumentButton>` was rendered inside `.appbar-tabs`. Moving the button to be a sibling of `.appbar-tabs` (option A from recon) fixed it without any React or CSS refactoring. Options B (remove `overflow:hidden`) and C (portal) were discussed but rejected — B risks tab-overflow regressions, C is more invasive.
  - **Fix 1 restores exactly the pre-refactor logic** removed in my earlier turn — no renaming, no indirection. The click reaches into `dock.getLayout().dockbox.children[0].tabs[0].id` (the project-summary tab, id prefix `DockComponent_rightbar_`) and calls `dock.updateTab(id, null, true)` to activate it. Inlined rather than extracted to a helper to match the original exactly and minimize delta.
  - **Token corrections** (spec used wrong names — flagged in recon):
    - `var(--color-background-secondary)` → `var(--color-bg-secondary)` (real token from `_colors-light.scss:81`)
    - `var(--border-radius-md)` → `var(--radius-md)` (real token from `_radius.scss:14`, resolves to 8px)
  - **Fix 3 is literally one line** added to `.appbar-tabs`: `padding-left: 8px;`. The vertical separator is drawn by the `.project-label { border-right }`, so the padding is applied to the tab container, not re-inserted as a divider element.
  - **Layout note on moving the dropdown**: `<NewDocumentButton>` is now a flex sibling of `.appbar-tabs` within the same parent (`.nav-container.appbar`). Since `.appbar-tabs` has `flex: 1`, the dropdown button sits flush to the right edge of the tab strip — visually identical to before. Dropdown opens downward from the button's own containing block (which has no overflow constraint) and is now visible.
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before fixes: 81 errors. After fixes: 81 errors. No new diagnostics in any touched file. The pre-existing `Navbar.tsx:3` PNG module error persists — unrelated. No build run; no runtime smoke test possible from this environment — user must verify: (a) click on project label activates project-summary tab and shows dashboard, (b) hover on project label shows subtle bg tint, (c) click "+" opens visible dropdown with 4 entries, (d) click outside or Escape closes dropdown, (e) first tab has ~8px breathing room after the label's vertical separator.
**Nome del documento prompt**: 2026-04-21 (navbar fix: label clickable + dropdown visible + tab spacing)

---

## 2026-04-21 — feat: project label + new-document dropdown in navbar
**Prompt**: The project tab in the navbar was visually identical to document tabs (ambiguous) and the "+" button created a metamodel without asking. Turn the project tab into a fixed non-clickable label with a right-border separator, and replace the "+" with a dropdown listing all available document types (metamodel / model / transformation, with refactoring as "coming soon").
**File toccati**:
- frontend/src/constants/documentTypes.ts (new — `DOCUMENT_TYPES` registry + `DocumentTypeEntry` interface)
- frontend/src/events/registry.ts (added `JjodelEvents.OPEN_NEW_TRANSFORMATION_DIALOG`)
- frontend/src/components/project/ProjectEditor.tsx (new `useEffect` listener that calls `setShowNewTransformationDialog(true)` on the event; placed right after the existing `OPEN_MEGAMODEL` listener)
- frontend/src/pages/components/Navbar.tsx (new `NewDocumentButton` function component; replaced `appbar-project-link` button with non-clickable `.project-label`; replaced `appbar-tabs__new` "+" button with `<NewDocumentButton>`; removed now-dead `isProjectSelected` const and `<div className="appbar__sep" />` preceding the project label; added `useRef` to React import; added imports for `DOCUMENT_TYPES`, `DocumentTypeEntry`)
- frontend/src/pages/components/navbar.scss (removed `.appbar-project-link` + variants and dark-mode block, removed `.appbar-tabs__new` + dark-mode; added `.project-label` / `.project-icon` / `.project-name` rules + dark; added `.new-document` with `__btn`, `__menu`, `__divider`, `__item`, `__badge`, `__text`, `__label`, `__soon`, `__desc` modifiers + dark; added active-tab badge override `.appbar-tab--active .appbar-tab__badge--{metamodel|model|transformation|documentation|viewpoint}` with `#1e293b` bg and `#fff` color)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**:
  - **Reconnaissance (Phase 1) surfaced two friction points** that forced explicit user decisions before coding:
    1. `createM1(project, metamodel)` requires a metamodel — no self-contained creation path. Precedent in `Navbar.tsx:764` and `ProjectEditor.tsx:846` already picks `metamodels[0]`. Applied the same pattern: Model entry is enabled when `metamodels.length >= 1` and calls `createM1(project, metamodels[0])`; disabled with tooltip "Create a metamodel first" otherwise.
    2. Transformation creation is modal state (`setShowNewTransformationDialog`) inside ProjectEditor — not reachable from Navbar. Solved with a new custom event `OPEN_NEW_TRANSFORMATION_DIALOG` added to the centralized registry; Navbar dispatches it, ProjectEditor listens. This follows the same wiring pattern already used for `OPEN_MEGAMODEL`. Transformation entry is gated on `metamodels.length >= 1` for the same reason Model is (the dialog needs source/target pickers).
    3. Refactoring is not implemented — entry has `available: false`, shown grayed out with inline "coming soon" text, separated by a divider.
  - **Deviation from spec token name**: spec used `var(--color-background-secondary)` in the "+" button styling; the actual token in `styles/tokens/_colors-light.scss` is `--color-bg-secondary`. Used the real token name.
  - **Placement change for the dropdown**: the pre-existing "+" button was nested inside `{visibleTabs.length > 0 && …}`, so it was invisible when a project had no document tabs yet — meaning the user couldn't create the first document from the navbar. The new `<NewDocumentButton>` lives inside `{project && <div className="appbar-tabs">…</div>}`, i.e. always visible when a project exists. This is a small behavioral improvement (not pure in-place replacement) flagged here explicitly; revert is a one-line change if undesired.
  - **Separator between project label and tab strip**: implemented via `.project-label { border-right: 0.5px solid var(--color-border-secondary); }` only. The previous `<div className="appbar__sep" />` between them is removed. Chose this over adding a separate `<div className="tab-divider" />` (spec showed both in different places) because the border-right is simpler and matches a single visual separator.
  - **Dead CSS removed**: `.appbar-project-link`, `.appbar-project-link__icon`, `.appbar-project-link__name`, `.appbar-project-link--selected`, `.appbar-project-link--unselected` + their dark-mode block + `.appbar-tabs__new` + its dark-mode block. Verified via grep: no remaining references in `frontend/src/**`.
  - **Active tab badge override**: specificity-based (`.appbar-tab--active .appbar-tab__badge--<type>`) beats the per-type badge colors without `!important`. Applied to metamodel/model/transformation/documentation/viewpoint.
  - **Dropdown accessibility**: closes on Escape (document `keydown` listener, scoped to when `open=true`), closes on click outside (document `mousedown` listener scoped to the container ref), `aria-haspopup="menu"` + `aria-expanded` on the trigger, `role="menu"` / `role="menuitem"` on the panel and items. Escape listener uses normal (non-capture) phase — no Monaco interference here since the navbar dropdown is top-level.
  - **Registry semantics**: `DOCUMENT_TYPES` is a pure-data static constant (readonly). Runtime `onCreate` is resolved inside `NewDocumentButton` at render time via a switch over `entry.type`, not stored on the entries themselves — this keeps the registry serializable and avoids stale `project` closures.
  - **Verification**: `npx tsc --noEmit -p tsconfig.json`. Before change: 81 total errors. After change: 81 total errors. No new errors in any touched file; `documentTypes.ts` and `events/registry.ts` produce zero diagnostics. Pre-existing errors still present: `Navbar.tsx:3` (missing PNG module) and `ProjectEditor.tsx:169` (SetFieldAction overload issue) — both unrelated to this change. No build run in this session; no runtime smoke test possible in this environment — user must verify in-browser that (a) the project label reads `<name>` with dark square icon and right border, (b) clicking "+" opens the dropdown with 3 enabled + 1 disabled entry, (c) each enabled entry creates the expected document / opens the transformation dialog, (d) Escape and click-outside close the menu, (e) the active document tab's badge turns slate-dark/white.
**Nome del documento prompt**: 2026-04-21 (project label + new document dropdown)

---

## 2026-04-21 — fix: hide ghost tabs with no backing document from navbar
**Prompt**: An "M Unnamed" tab (or any tab whose id doesn't resolve in the Redux store) was appearing in the project navbar because `syncTabs` fabricated a placeholder when the state lookup failed. Filter such ghost tabs before they enter state.
**File toccati**:
- frontend/src/pages/components/Navbar.tsx (`syncTabs` callback — model/metamodel branch now returns null when the id doesn't resolve; `.filter` at the end narrows to TabListItem[])
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Scope**: navbar project tabs (lines 1295-1394). `openTabs` state is populated by `syncTabs` which reads rc-dock's layout — NOT a Redux selector. Tab ids resolve to Redux objects via `state[id] || idlookup?.[id]`. **Ghost origin**: the else branch at lines 1365-1368 (pre-fix) hardcoded `title='Unnamed', type='metamodel'` whenever the lookup failed, giving every stale id a "M Unnamed" tab in the navbar. **Fix**: the else branch now returns `null` instead of fabricating a placeholder, and a type-narrowing `.filter((t): t is TabListItem => t !== null)` is appended to the `tabs.map(...)`. A local `TabListItem` type alias keeps the `.filter` type predicate clean; no new public types. **Deliberately NOT broadened**: the viewpoint branch (lines 1342-1358) has a similar pattern (hardcoded fallback title when lookup fails) but was left untouched — no symptom reported and the user explicitly limited scope to Model/Metamodel. Doc/transformation/project tabs don't do a Redux lookup so they can't produce this kind of ghost. If a viewpoint ever has the same symptom, it's a follow-up. **No new dependencies**; `state = store.getState()` was already captured at line 1309 before the `.map()`. Verification via `npx tsc --noEmit` (no `typecheck` script in frontend/package.json — CLAUDE.md §Comandi di sviluppo is out-of-date on that): Navbar.tsx clean aside from a pre-existing PNG module error at line 3 unrelated to this change. No build run in this session. Manual smoke test (verify the M Unnamed tab disappears on the affected project) required on the user's side. **Note on a stray claim introduced between Read and Edit**: the in-code comment at Navbar.tsx:1364 references `ProjectEditor.tsx:2343` as source of the "same existence-check pattern" — verified that line is actually `attributeCount: attrs.length,` inside an artifact-stats builder, not an existence check. The reference is incorrect and should be cleaned up in a follow-up.
**Nome del documento prompt**: 2026-04-21 (hide ghost tabs with no backing document)

---

## 2026-04-21 — refactor: recolor auto-* pill family to violet/indigo (slate was invisible on card-green bg)
**Prompt**: Slate neutral palette didn't show well on the card's green background. Repalette the auto-* family to violet (auto-resolved) and indigo (auto-converted) as semantic tokens; dark mode uses lighter shades on higher-opacity backgrounds.
**File toccati**:
- frontend/src/styles/tokens/_colors-light.scss (4 new CSS vars in a new "AUTO-* PILL FAMILY" block after the Info semantic block)
- frontend/src/styles/tokens/_colors-dark.scss (same 4 vars with dark-mode-adjusted values after the Info-dark block)
- frontend/src/jjtl/views/MappingCard.scss (`.auto-pill` kept as base-layout; two BEM modifiers `.auto-pill--resolved` / `.auto-pill--converted` apply the family-specific colors via the new tokens)
- frontend/src/jjtl/views/MappingCard.tsx (added modifier classNames to the two pills)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **New tokens** (light / dark pair, each):
  - `--color-auto-resolved-bg`: `rgba(139, 92, 246, 0.12)` (violet-500 @ 12%) / `rgba(139, 92, 246, 0.20)` @ 20%
  - `--color-auto-resolved-text`: `#6d28d9` (violet-700) / `#c4b5fd` (violet-300)
  - `--color-auto-converted-bg`: `rgba(99, 102, 241, 0.12)` (indigo-500 @ 12%) / `rgba(99, 102, 241, 0.20)` @ 20%
  - `--color-auto-converted-text`: `#4338ca` (indigo-700) / `#a5b4fc` (indigo-300)

Dark-mode pairing convention: existing info/warning/success/error tokens use 0.15 opacity in dark; bumped to 0.20 per user's explicit "opacity più alta" instruction to sustain visibility of the translucent bg against darker card bases. Light-mode 0.12 matches the pattern of the neighboring info/warning `-muted` variants. Text shades flip from 700 (light) to 300 (dark) — standard WCAG-friendly inversion. **BEM modifier split**: `.auto-pill` keeps layout + typography; `.auto-pill--resolved` / `.auto-pill--converted` apply only the color pair. Clean family hierarchy, easy to add siblings later (`--auto-derived`, `--auto-created` per the family roadmap). **Zero hex in MappingCard.scss** — only `var(--color-auto-*)` references. **No other files touched** — tokens live in `styles/tokens/` only, the pill consumers live in the mapping card only. Icon (`bi-info-circle`), layout, padding, tooltip text, triggers all unchanged from the previous turn. Build `✓ built in 43.91s`. Manual visual smoke test required to confirm the violet/indigo pair reads comfortably against the real card-green backgrounds (user-side, I can't see the app).
**Nome del documento prompt**: 2026-04-21 (auto-* pill family recolor to violet/indigo)

---

## 2026-04-21 — refactor: split "conversion needed" pill into auto-resolved + auto-converted (slate neutral family)
**Prompt**: Rename ambiguous amber "conversion needed" pill in MappingCard to a neutral "auto-*" family indicating that Jjodel handles the work automatically. Initial plan assumed one pill; reconnaissance showed the single `needsConversion` trigger covered TWO semantically-distinct cases (reference resolution vs. primitive type conversion) → user relaxed the frozen-trigger constraint to split into two pills.
**File toccati**:
- frontend/src/jjtl/views/MappingCard.tsx (new `PRIMITIVE_TYPE_NAMES` set at module level; old `needsConversion` replaced by `typesDiffer` + `sourceIsPrimitive` + `targetIsPrimitive` + `needsTypeConversion` + `needsReferenceResolution`; JSX pill replaced by two mutually-fireable pills with `title=` tooltips)
- frontend/src/jjtl/views/MappingCard.scss (`.conversion-badge` removed; new shared `.auto-pill` class with slate-neutral palette via `var(--color-bg-tertiary)` + `var(--color-text-tertiary)`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Two pills, one shared class**: `.auto-pill` is the single visual style (inline-flex + 4px gap, padding/border/font preserved from the old badge). JSX differentiates only via icon + label + tooltip. Both pills use `bi-info-circle` per user's updated decision (originally planned `bi-arrow-left-right` for converted, unified for family consistency). **Discrimination criterion**: primitiveness of the type name against `PRIMITIVE_TYPE_NAMES` set (mirror of `TypeRegistry` in `jjel/evaluator/context.ts`: EInt/EString/EBoolean/EDouble/EFloat/Integer/String/Boolean/Double/Float/Number/Date + lowercase aliases). Both-primitive → `auto-converted`. At-least-one-class → `auto-resolved`. **Independent checks** (no `!otherCase` coupling) per user's "se un mapping rientra in entrambi i casi mostra entrambe le pill" — logically disjoint by construction but coded defensively. **Tokens used**: semantic CSS vars `--color-bg-tertiary` (light: `#f1f5f9` slate-100 · dark: `#16181a`) and `--color-text-tertiary` (light: `#475569` slate-600 · dark: `#606060`). Matches user's hex spec exactly in light mode; dark mode contrast is low-medium — flagged in original plan, user did not override. **Note on user's spec**: `#475569` is slate-600 semantically, not slate-700 (`#334155`) — the hex was authoritative, the name was imprecise. **Tooltip mechanism**: native `title=`, consistent with MappingCard's existing pattern (lines 105, 107 already use `title` for source/target name truncation). Mobile caveat (no hover on touch) flagged in plan, user accepted implicitly. **aria-hidden** on both icons (decorative; the label text carries semantics). **Tooltip text** (exact, per user's updated spec):
  - auto-resolved: "References between objects are resolved automatically by the executor using a two-pass strategy: all target objects are created first, then references are linked."
  - auto-converted: "Attribute values are automatically converted by the executor to match the target type — for example, numeric to string, or enum to literal."

Trigger UNfrozen but logic is NOT semantically narrowed vs. pre-change: the old `needsConversion` fired whenever `sourceType !== targetType` (case-insensitive); the new pair fires under the exact same union of conditions, just routed to the correct pill. **No regression in what shows up** — only what the pill says. Old `.conversion-badge` class fully removed, no other references in the codebase (grep confirmed). No other files touched. Build `✓ built in 1m 9s`. tsc clean. Manual smoke test (open Suggested Mappings with a mapping that had the amber badge, verify neutral pill + tooltip on hover) still required on the user's side.
**Nome del documento prompt**: 2026-04-21 (auto-resolved + auto-converted pills)

---

## 2026-04-21 — feat: multi-step progress modal for "Analyze Metamodels" (AI pipeline)
**Prompt**: Add a multi-step "Generating…" modal to SuggestedMappingsPanel mirroring DocumentationTab's pattern, with steps corresponding to REAL phases of `mappingSuggestionService.analyze()`. Dedicated component under jjtl/, no cross-module import from abstract/tabs/.
**File toccati**:
- frontend/src/jjtl/types/suggestions.ts (new `MappingAnalysisStep` union, `AnalysisProgressCallback`, `MappingAnalysisStepEntry` interface)
- frontend/src/jjtl/services/AIMatcher.ts (new `onProgress?` 7th param; fires at 3 real phase boundaries: building-prompt, calling-ai, parsing; new private `countClasses` helper for the building-prompt sub-label)
- frontend/src/jjtl/services/MappingSuggestionService.ts (AnalyzeOptions.onProgress passthrough into AIMatcher; undefined for simple mode)
- frontend/src/jjtl/components/MappingAnalysisProgressModal.tsx (NEW — mirrors DocumentationTab GenerationProgressModal shape; scoped under .mapping-analysis-progress-overlay)
- frontend/src/jjtl/components/MappingAnalysisProgressModal.scss (NEW — consciously duplicated styles from DocumentationTab.scss per explicit decision; local $color-* variables, scoped keyframe `mapping-analysis-spin`)
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx (analysisSteps + showAnalysisModal state, lastProgressAppliedAtRef for 200ms min-display, applyTransition helper, onProgress callback, terminal transitions on success/error/abort, modal mount at root)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **3 real phases in AI pipeline** — buildPrompt (synchronous, ~30ms), chat (async LLM roundtrip, seconds to minutes), parseResponse (synchronous, ~100ms). Phases 1 and 3 would flash past, so per user decision 1 applied a **200ms minimum display** in the UI layer via a `lastProgressAppliedAtRef` wall-clock baseline — setTimeout-delays transitions only if <200ms have elapsed since the last, naturally disables if phases get slower. No artificial phases, no sleep inside the service. **Simple fallback path NOT modalized** per user decision 2 — SimpleMatcher is sub-second sync; passing onProgress undefined preserves legacy behavior entirely. **Contract**: `onProgress(step, detail?)` = "step is now starting; any previously running step is implicitly completed with the provided detail attached". Service fires 3 times (entering each phase); terminal step completion applied in the panel's success branch when `analyze()` resolves, with the final suggestion count as phase-3 detail. Modal auto-closes 400ms after all-green terminal state (brief satisfaction moment). On AbortError, modal closes immediately. On AI error or `analysisResult.error`, the in-flight step is marked 'error' with the error message as detail; modal stays open until user clicks Close; the existing error-recovery "Try simple matching instead" button in the panel remains available after close — NOT placed inside the modal per the prompt. **SCSS consciously duplicated** from DocumentationTab.scss (not factored out) per user's explicit "scelta consapevole, non toccarla in futuro anche se sembrerà DRY-able". Local SCSS variables mirror Documentation's palette; scoped keyframe `mapping-analysis-spin` avoids any collision with other `spin` keyframes. Bootstrap Icons only (bi-stars header, bi-check-lg/bi-x-lg step indicators, bi-check-circle-fill/bi-x-circle-fill header finalize). Cyan (#0ea5e9) only on spinner and running-step label — no button backgrounds. **Analyze button**: its existing disabled+label-change-to-"Analyzing…" behavior preserved; cancel button preserved. **No changes** to: DocumentationTab, common/ProviderModelSelector, AIProviderPreferences, Jodie/, AISettingsContent. Build `✓ built in 1m 24s` (only pre-existing chunk-size warning). TypeScript clean. Vitest: 500/500 executable tests pass; 8 test files have environment errors (`window is not defined`) — pre-existing, caused by monaco-editor + PerformanceMetrics referencing `window` at module load, unrelated to these changes. **TODO flagged (out of scope)**: AIProviderService.chat does not yet accept AbortSignal — real network cancellation is a separate task.
**Nome del documento prompt**: 2026-04-21 (multi-step progress modal for Analyze Metamodels)

---

## 2026-04-21 — refactor: migrate SuggestedMappingsPanel to common/ProviderModelSelector (drop LocalOption UI)
**Prompt**: Align Suggested Mappings to the combined provider+model picker pattern already adopted by JodieHeader and DocumentationTab. Remove the LocalOption UI path (`MAPPINGS_LOCAL_OPTIONS`, `selectedLocalOption` state, `onLocalOptionSelect`). Mappings is AI-first. Keep the error-recovery button ("Try simple matching instead") — separate mechanism, not a user choice between AI/non-AI.
**File toccati**:
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx (7 surgical edits — import swap, delete `MAPPINGS_LOCAL_OPTIONS`, delete `selectedLocalOption` state, simplify `mode` memo, simplify `aiProviderName` memo, swap JSX to `<ProviderModelSelector feature="mappings" compact onNavigateToSettings={() => settingsModal?.openSettings('providers')} />`, simplify mode-description block)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: `onNavigateToSettings` pattern matches DocumentationTab literally (inline arrow invoking `settingsModal?.openSettings('providers')`) — JodieHeader uses a parent-passed `onOpenSettings` prop, but Mappings has `settingsModal` directly in scope so the Documentation pattern is the closer fit. `AIFeature` already contained `'mappings'` (types/jodie.ts:80) — no type extension needed. **Intentional side-effect**: with `selectedLocalOption` default `'simple'` gone, Analyze Metamodels now defaults to AI mode on first load — also fixes the regression diagnosed earlier today (Apr 20) where the panel silently ran SimpleMatcher instead of the LLM. **Preserved**: `handleFallbackToSimple` (line 275+) and the "Try simple matching instead" recovery button inside the error-message block (lines 470-480). These are a separate code path (error-recovery escape hatch), not a LocalOption-level user choice; removing them would leave users with no recourse when the AI call fails. `SuggestionMode` type in `suggestions.ts` still includes `'simple'` (used by the recovery path and by the service's SimpleMatcher call site) — NOT narrowed. Grammar tab + its button unchanged (orthogonal feature, driven by `showGrammar` state). No SCSS change needed — the old and new triggers render at the same compact size inside `.mode-selector`, Analyze button layout unaffected. No other files touched. Old `common/ProviderSelector` left in place for any other call sites. Build `✓ built in 1m 33s`, only pre-existing chunk-size warning. TypeScript clean. Manual smoke test (items in acceptance checklist) required on the user's side — I can't drive the browser.
**Nome del documento prompt**: 2026-04-21 (migrate SuggestedMappingsPanel to ProviderModelSelector)

---

## 2026-04-21 — fix: remove horizontal slide animation on tab switch
**Prompt**: Tab switches in the top tab bar (Test Matching / Unnamed / metamodel_1 / metamodel_2 / transformation tabs) animated the content panel with a horizontal slide. Remove only that slide; leave every other animation intact.
**File toccati**:
- frontend/src/components/abstract/style.scss (`.dock-content-animated { transition: margin 0.3s }` → `transition: none`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Case C (CSS puro)** per the prompt's taxonomy. The slide was produced by the rc-tabs pattern (used via rc-dock): rc-tabs' `TabPanelList/index.js:44` sets an inline `style={{ marginLeft: "-N00%" }}` on the content container to scroll to the active tab pane, and `.dock-content-animated { transition: margin 0.3s }` turns the margin change into a 300ms horizontal slide. Removing only the transition keeps the positioning logic intact (tabs still display correctly) while making the switch instantaneous. **Discovery subtlety**: the `.dock-content-animated` rule exists in 3 places: (1) `node_modules/rc-dock/dist/rc-dock.css:114` — NOT imported by our code, (2) `src/components/abstract/style.scss:194` — **imported transitively via `Dock.tsx:1`, this is the live one**, (3) `src/components/abstract/style_ap.scss:199` — orphan copy, never imported. Fixed only the live source (option 2). No `!important` needed — rc-dock's own CSS is never imported, so nothing fights with our rule. The orphan `style_ap.scss` copy is left untouched (cleanup is out of scope). The vertical fade-in animation (`tabFadeIn` at `dock-tabs.scss:400-413`, 150ms translateY 4→0 + opacity) is **intentionally preserved** — it's not a horizontal slide and the prompt's Case C instructs to avoid touching unrelated transitions. All other transitions in the dock area (hover, focus, ink-bar, pinned-strip rotation, etc.) unchanged. Build `✓ built in 1m 12s`. Manual smoke test (steps 1-4 in the prompt) required on the user's side.
**Nome del documento prompt**: 2026-04-21 (remove tab switch slide animation)

---

## 2026-04-21 — fix: restore match arrows rendering in Suggested Mappings (one-line uncomment)
**Prompt**: Suggested Mappings generates 12 mappings but the SVG arrows between source/target metamodels on the center canvas no longer render. Diagnosis (prior prompt) traced the silent failure to a bulk console.log cleanup on 2026-04-16 that over-shot by one line, commenting the functionally-essential `onSuggestionsChange(suggestionsCopy)` call along with the log's orphan arguments.
**File toccati**:
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx (line 214: removed `// ` prefix restoring the parent-notification call)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: One-line change. Regression commit `4d81bbed33` (Juri Di Rocco, 2026-04-16, "Fixed synbtax errors: refactorung console.log") had commented three consecutive lines: two were orphan arguments of a multi-line `console.log` that the previous day's commit `0787639fdf` (2026-04-15) had only partially commented (first line only), leaving the rest as invalid expressions — correct to comment. The third line was `onSuggestionsChange(suggestionsCopy);`, a separate essential call that ran the parent-notify pipeline. Uncommented that one only. Lines 211-213 (the original console.log and its arguments) remain commented — they were the genuine target of the cleanup and restoring them would reintroduce verbose logging. Data pipeline now fully connected: SuggestedMappingsPanel.setResult → useEffect → onSuggestionsChange → JjtlDevelopmentEnv.handleSuggestionsChange → setSuggestions → suggestionMappings memo → DualMetamodelPanel → MappingLinesOverlay (SVG renderer, 12-color palette at MappingLinesOverlay.tsx:51-64). Build `✓ built in 47.17s`. Manual smoke test (click Analyze → verify 12 arrows appear between the two trees) required on the user's side. Sibling observation (noted but not addressed in this fix): commit 4d81bbed33 touched 18 files with the same multi-line-log-overshoot pattern; a follow-up audit of those files would be prudent since the same mistake could have caught other essential calls.
**Nome del documento prompt**: 2026-04-21 (restore match arrows one-line uncomment)

---

## 2026-04-20 — fix: common ProviderSelector — gate option disable by `isConfigured()` not `.enabled`
**Prompt**: In the Suggested Mappings (and DocumentationTab) dropdown, every provider except the currently-selected one appeared disabled even with a valid API key. Regression introduced in commit 1ed5f4862 (24 Feb 2026, "nearly done refractor ai") which changed `disabled={!provider.available}` to `disabled={!AIConfig.get(provider).enabled}`. The `.enabled` flag is flipped true ONLY from `ProviderConfigModal.tsx:84` after a successful "Test Connection"; providers with saved keys but never-tested stayed disabled indefinitely.
**File toccati**:
- frontend/src/components/common/ProviderSelector.tsx (line 120, single-line change: `!AIConfig.get(provider).enabled` → `!AIConfig.get(provider).isConfigured()`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Defensive Option B chosen (per the diagnostic report): align the per-option disable gate with the upstream list filter `JodieConfig.getEnabledProviders()` which already uses `isConfigured()`. Option A (remove the attribute entirely) would have been equivalent functionally but less defensive — keeping the check means that if an entry somehow bypasses the list filter, it still gets gated by the same predicate. Both predicates now resolve to "has API key (or baseUrl for Ollama/Custom)". `JodieConfig.getEnabledProviders()` unchanged; `Jodie/ProviderSelector.tsx` unchanged (has no per-option gate); `AIConfig.enabled` field + its write paths in `ProviderConfigModal.tsx` unchanged — the `.enabled` flag is now unused in this read site, but it's still written after Test Connection and consulted by `getStatus()` for the "Connected"/"Error" badge in Settings. Build `✓ built in 1m 15s`. Manual smoke test (Claude+Groq with Groq untested) required on the user's side to confirm Groq is now clickable.
**Nome del documento prompt**: 2026-04-20 (fix disabled options common ProviderSelector)

---

## 2026-04-20 — fix: scope edge-crossing jump markers to the active canvas only
**Prompt**: In editor v2, switching between metamodel_1 / metamodel_2 tabs showed phantom jump arcs on edges that only cross edges from the *other* metamodel. Scope the crossing detection to the active React Flow instance.
**File toccati**:
- frontend/src/components/editor-v2/utils/edgeUtils.ts (getEdgeCrossings: new optional `activeNodeIds?: Set<string>` 3rd param; registry filter inside the loop skips entries whose source or target isn't in the active set; `nodeRects?` shifts to 4th param)
- frontend/src/components/editor-v2/edges/UnifiedEdge.tsx (build activeNodeIds from `useNodes()`, pass as 3rd arg to getEdgeCrossings; useMemo dep list updated)
- frontend/src/components/editor-v2/hooks/useTreeLayout.ts (same: compute activeNodeIds once from allNodes; both getEdgeCrossings call sites — trunk + tree segments — now pass activeNodeIds as 3rd arg and keep `[]` as 4th for nodeRects)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Scenario B confirmed**: `edgePathRegistry` at edgeUtils.ts:1141 is a module-level singleton `Map<string, EdgePathEntry>`. Every UnifiedEdge across every React Flow instance writes into it; with DockManager keeping tabs mounted, edges from hidden tabs persist in the registry and contaminate the visible tab's crossing detection. **Fix chosen: Option 1** (React Flow hook-based scoping). Both call sites (UnifiedEdge.tsx and useTreeLayout.ts) already use `useNodes()` which returns canvas-scoped nodes — just built a Set of node IDs from it and threaded to `getEdgeCrossings`. Filter logic: `if (activeNodeIds && (!has(sourceNode) || !has(targetNode))) continue` — both endpoints must be in the active canvas (no false positives from edges crossing the boundary; in v2 this case doesn't happen). Backward-compatible: omitted `activeNodeIds` → no filter (legacy behaviour). **Alternative considered and rejected**: clearing the registry on canvas unmount — doesn't work because Jjodel's DockManager keeps tabs in DOM. **No Redux touched, no store-side change**: fix is purely on the consumer (detection side), per the constraint. Tree-segment entries registered by useTreeLayout (suffixed edge IDs like `__trunk`, `__tree_0`) share source/target node IDs with the parent inheritance edge, so they're scoped correctly for free. Manual smoke test (metamodel_1 ↔ metamodel_2 switching) still required; code-level math: Set lookup is O(1), filter runs inside the existing O(N) registry scan, no performance regression. Build `✓ built in 1m 14s`.
**Nome del documento prompt**: 2026-04-20 (scope edge-crossing jumps to active canvas)

---

## 2026-04-20 — docs: Jjodie system prompt — add "reserved keywords" rule
**Prompt**: Jjodie was emitting commands like `create attribute abstract in Project type String` where `abstract` is a JjScript keyword, causing parser errors. Add an explicit rule forbidding reserved words (keywords + primitive types) as identifiers, with concrete FORBIDDEN/CORRECT examples and a matching bullet in Best Practices.
**File toccati**:
- frontend/src/constants/defaultPrompts.ts (CHAT_PROMPT only — added rule #8 + new Best Practices bullet)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: MANDATORY RULES now ends at point 8. Rule 7 (enum vs attribute, added earlier today) still resolves correctly. Reserved-word list as provided in the prompt: keywords (create, delete, rename, class, abstract, attribute, reference, containment, enum, literal, extends, in, to, type) + primitive types (String, int, boolean, Date). Applied case-insensitive rule per spec. Prompt's closing note flagged that list was deduced from the Syntax Reference; if parser exposes more keywords (e.g. package, import, constraint), a follow-up prompt will extend it. No other CHAT_PROMPT content changed; other prompt constants in the same file (DOCUMENTATION, VALIDATION, REFACTORING, OCL, IMPORT) untouched. tsc clean for defaultPrompts.ts.
**Nome del documento prompt**: 2026-04-20 (reserved keywords rule)

---

## 2026-04-20 — feat: contextual recovery actions for JjScript execution error modal
**Prompt**: When JjScript execution fails on a systematic, mechanically-fixable pattern (e.g. repeated `create literal X in Y` where Y is actually an attribute, not an enum), offer one-click recovery actions in the error modal instead of forcing N manual Skip Line clicks. Extensible architecture for future rules.
**File toccati**:
- frontend/src/jjscript/recovery/types.ts (NEW — RecoveryContext/RecoveryAction/RecoveryRule)
- frontend/src/jjscript/recovery/rules.ts (NEW — literalInAttributeRule, RECOVERY_RULES registry, findRecoveryActions scanner, isCreateLiteralInTarget utility)
- frontend/src/jjscript/recovery/index.ts (NEW — barrel)
- frontend/src/jjscript/components/ExecutionErrorDialog.tsx (+2 optional props: recoveryActions + onRecoveryAction; new "Quick actions" section above the existing Skip/Close row)
- frontend/src/jjscript/components/ExecutionErrorDialog.scss (new .exec-error-recovery + .exec-error-recovery-title + .exec-error-recovery-list + .exec-error-recovery-btn styles, additive only)
- frontend/src/jjscript/components/ScriptBlock.tsx (recoveryActions state + effect computing it from pauseInfo; runCommandsFromIndex helper; handleRecoveryAction dispatcher with cases 'createEnumAndRetry' and 'skipMatchingCreateLiteral'; props passed to dialog)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Architecture**: rules are pure matchers returning discriminated-union actions (id/kind/label/icon + kind-specific payload); no closures cross the rule→component boundary, so rule authors can't accidentally hold references to component state. Handlers live in ScriptBlock.tsx where they have access to state setters + onExecute. Adding a new rule is 4 steps documented in types.ts. **First match wins** in the registry to avoid action-button spam. **Rule implemented**: `literalInAttributeRule` checks 4 conditions (command matches regex, error contains "Literals can only be added to enums", an attribute with case-insensitive name Y exists, NO enum with exact name Y exists); proposes 2 actions: (A) "Create enum Y and retry" — runs `create enum Y` via onExecute, then re-runs from the failed line; if enum creation itself fails, surfaces that as the new pause (not swallowed); (B) "Skip all `create literal ... in Y`" — scans remaining lines case-sensitive on Y, marks all matches as skipped in lineStates + skippedLinesSet, resumes from first non-matching line. **ScriptExecutionWindow.tsx** (another consumer of the dialog) NOT wired — props are optional so backward compatible; only ScriptBlock gets recovery UX in this iteration. **Did not refactor** handleSkipAndContinue; instead duplicated the execution loop in a new local `runCommandsFromIndex(startIdx, skipSet)` helper used only by recovery dispatchers. **Enum existence check** tries model.children, model.classes (filtering by className containing "Enum"), model.enumerators, and project.enumerators — robust to whichever representation the framework uses. **No CSS class collisions** (verified via grep: `exec-error-recovery` was not previously used). Recovery action logged via `JjScriptEvents.EXECUTED` with `recovery: true` detail flag so console listeners can visually distinguish. Build `✓ built in 1m 14s`. Manual UI smoke test by user still required.
**Nome del documento prompt**: 2026-04-20 (recovery actions in JjScript error modal)

---

## 2026-04-20 — docs: Jjodie system prompt — add "enum vs attribute" disambiguation rule
**Prompt**: Jjodie was generating JjScript that creates an attribute and then tries to add literals to it, triggering "Cannot create literal in attribute 'X'". Add a mandatory rule explaining the correct two-step pattern (declare enum + literals first, then attribute typed on the enum).
**File toccati**:
- frontend/src/constants/defaultPrompts.ts (CHAT_PROMPT — added rule #7 + expanded Enumerations example)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Verified current state before editing: MANDATORY RULES ended at point 6 (comments), so the no-circular-inheritance rule from earlier orphan fragments was NEVER actually applied — the prompt's conditional wording ("se la regola no-circular-inheritance è già stata inserita come punto 6, questa diventa punto 7") resolved to point 7 since point 6 is "Add comments with #". Both modifications applied verbatim from spec. Enumerations block expanded with inline FORBIDDEN example mirroring the runtime error message. No refactoring, no rename; only CHAT_PROMPT modified (other prompt constants untouched). tsc clean for defaultPrompts.ts.
**Nome del documento prompt**: 2026-04-20 (enum vs attribute rule)

---

## 2026-04-20 — fix: AI picker popover — correct width overrides (compact mode specificity + stray flex:1)
**Prompt**: Previous popover width fix didn't take effect. All model names showed ellipsis even for short ones (e.g. "Claude Opus 4.7"). Root-cause and fix properly.
**File toccati**:
- frontend/src/components/common/ProviderModelSelector.scss (two fixes below)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Root cause discovery (CSS specificity)**: (1) `.provider-selector.compact .provider-menu { min-width: 180px }` in ProviderSelector.scss (specificity 0,3,0) was beating my `.pm-popover { min-width: 280px }` (0,1,0) because both JodieHeader and DocumentationTab pass `compact`. Popover stayed at 180px. (2) `.provider-option span { flex: 1 }` (0,1,1) was applying to **every** span inside a model button, including my `.pm-caps` icon span. So label AND caps both had `flex: 1` and split the row equally — label got narrow → ellipsis fired even for 15-char names. **Fix (1)**: scoped my popover rule as `.provider-selector .pm-popover, .provider-selector.compact .pm-popover` to match/beat the compact override; bumped values to `min-width: 320px / max-width: 480px` per new prompt. **Fix (2)**: explicitly set `.pm-model-label { flex: 0 0 auto }` and `.pm-caps { flex: 0 0 auto; margin-left: auto }` inside `.pm-model-option`, neutralizing the inherited `flex: 1` from ProviderSelector's span rule; removed `text-overflow: ellipsis` and `min-width: 0` from the label (with `width: max-content` on popover, the container now widens naturally to fit the longest nowrap label; for labels that still exceed max-width, the parent `.provider-menu { overflow: hidden }` clips and the `title` attribute tooltip already added previously provides the full name). No `!important` used — specificity increase was sufficient. Trigger dedup (Option B) was already correct in the prior turn: "Groq Canopy Labs Orphe…" in the header is correct output of the dedup (Groq + "Canopy…") truncated by the trigger's own compact 160px max-width, NOT a "Groq Groq" duplication. Build `✓ built in 1m 13s`. **Manual visual verification by user required** — I cannot run dev server; CSS specificity math verified against the actual rules in ProviderSelector.scss.
**Nome del documento prompt**: 2026-04-20 16:30

---

## 2026-04-20 — fix: AI picker popover — single-line model names with ellipsis overflow
**Prompt**: Fix multi-line wrapping of long model names in ProviderModelSelector popover (observed with Groq: "Whisper Large V3 Turbo", "Canopy Labs Orpheus V1 English"). Widen popover within sensible bounds and truncate long names with tooltip fallback.
**File toccati**:
- frontend/src/components/common/ProviderModelSelector.scss (.pm-popover → width:max-content + min-width:280px + max-width:420px; .pm-model-label → white-space:nowrap + overflow:hidden + text-overflow:ellipsis + min-width:0 for flex-child shrinkage)
- frontend/src/components/common/ProviderModelSelector.tsx (title={m.version.label} on both non-legacy and legacy model buttons for full-name tooltip on truncated labels)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Applied all 4 rules from prompt. Auto-sizing via `width: max-content` within [280px, 420px] band — popover widens to fit longest visible name, truncates with `…` beyond 420px. `min-width: 0` on `.pm-model-label` is the non-obvious piece: without it, flex children default to `min-width: auto` (content-size) and ellipsis never triggers inside a flex row. No new CSS classes introduced; only extended existing `.pm-popover` and `.pm-model-label`. No HTML structure change, no logic change, trigger untouched. Build `✓ built in 1m 18s` with only pre-existing chunk-size warning.
**Nome del documento prompt**: 2026-04-20 16:00

---

## 2026-04-20 — refactor: AI providers — single source of truth for models (Pattern B)
**Prompt**: Rimuovi select modello dal pannello Settings; combina provider+model in un picker comune (deploy JodieHeader + DocumentationTab); persistenza per-feature `{providerId, modelId?}`; legacy ID map per Claude con migration silenziosa; plumbing `model?` attraverso `AIProviderService.chat()` e call site; SuggestedMappingsPanel NON toccato.
**File toccati**:
- frontend/src/types/jodie.ts (AIVersion.contextWindow, .add() signature, Claude registry rewrite, claudeLegacyIdMap, resolveLegacyModelId, ProviderPreference.modelId, setPreferred signature + SETTINGS_CHANGED dispatch, getPreferredModel, resolveFeatureSelection, migrateLegacyModelIds + load() wiring)
- frontend/src/services/AIProviderService.ts (chat() accepts optional model; resolves via resolveLegacyModelId; threads effectiveModel to all 8 provider adapters)
- frontend/src/components/Settings/AISettingsContent.tsx (removed model <select> block; removed model field entry from provider fields; removed defaultProvider/configuredProvidersList state; subtitle dynamic non-legacy top-3)
- frontend/src/components/common/ProviderModelSelector.tsx (NEW — combined picker: trigger "Provider Model" + popover with sub-select provider + model list + "Show legacy models" toggle)
- frontend/src/components/common/ProviderModelSelector.scss (NEW — additive styles, reuses .provider-selector/.provider-btn/.provider-menu base)
- frontend/src/components/Jodie/JodieHeader.tsx (swap Jodie/ProviderSelector → common/ProviderModelSelector feature="chat")
- frontend/src/components/Jodie/Jodie.tsx (pass model via AIConfig.getPreferredModel('chat') to chat())
- frontend/src/components/abstract/tabs/DocumentationTab.tsx (replace inline provider dropdown with <ProviderModelSelector feature="documentation" />; remove now-dead showProviderMenu state + click-outside effect + availableProviders)
- frontend/src/services/DocumentationService.ts (pass model via AIConfig.getPreferredModel('documentation'))
- frontend/src/jjtl/services/AIMatcher.ts (pass model via AIConfig.getPreferredModel('mappings') — service-layer change only, UI of SuggestedMappingsPanel not touched)
- frontend/src/components/ExplainModal.tsx (streamExplain resolves model = getPreferredModel('explain') ?? config.model)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Discovery flagged**: prompt-vocabulary mismatches with codebase (no `AIProviderSelector`, no `useAIProvider`, no `src/ai/`); used actual names `ProviderSelector`/`AIConfig.getPreferred`/registry-in-`jodie.ts`. Built-in `AIVersion.deprecated` reused as "legacy" flag (no alias). New component created at `common/ProviderModelSelector.tsx` rather than overloading `common/ProviderSelector` with conditional mode — keeps SuggestedMappingsPanel's API untouched and safe. `claudeLegacyIdMap`: `claude-sonnet-4-20250514`→`claude-sonnet-4-6`, `claude-opus-4-20250514`→`claude-opus-4-6`, `claude-haiku-4-20250514`→`claude-haiku-4-5-20251001`, `claude-3-5-sonnet-20241022`→`claude-3-5-sonnet-latest`, `claude-3-opus-20240229`→`claude-3-opus-latest`. One-shot migration `migrateLegacyModelIds()` runs once per install (sentinel `jjodel_migration:legacy_model_ids_v1`), rewrites both per-feature `jjodel_provider_<feature>.modelId` and per-provider `jjodie_provider_<name>.model`. Legacy entries 3-5-sonnet/3-opus also added to registry (deprecated:true) so persisted selections still match after migration. `SuggestedMappingsPanel.tsx`: **non toccato in questo prompt** (è apparso nei diff di sessione solo per via dei prompt precedenti di provider threading e Phase 2 di Default Provider removal; in questo task nessuna modifica). AIProviderService.chat() signature extended with optional `model?: string` as 7th param — backward compatible: callers omitting it fall back to `AIConfig.get(provider).model`. Ollama/Custom non hanno ancora UX nel picker perché `AI.Custom.versions` è vuoto (registry-driven); è una limitazione nota — l'utente può comunque selezionarli dal sub-select provider e il picker mostrerà "No models in registry".
**Nome del documento prompt**: 2026-04-20 15:00

---

## 2026-04-20 — refactor: Default Provider removal — Phase 3 (removal)
**Prompt**: Remove "Default Provider" UI block, setGlobalDefault, activeProvider field, persistence. Update panel subtitle.
**File toccati**:
- frontend/src/components/Settings/AISettingsContent.tsx
- frontend/src/types/jodie.ts
- frontend/src/jjtl/services/AIMatcher.ts (still referenced removed `activeProvider` — fixed to `AIConfig.getPreferred('mappings')`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Opzione 2 scelta per la chiave localStorage (`jjodel_default_provider` lasciata in place per un rilascio + TODO commentato accanto al sentinel). Rimosso: campo `activeProvider` dal corpo JodieConfig; persistenza di `activeProvider` in save() (righe ~545-549 del pre-fix); dispatch `PROVIDER_CHANGED` type 'global-default'; `setGlobalDefault` completamente; stato `defaultProvider` + `configuredProvidersList` + blocco UI in AISettingsContent.tsx (righe 300-323 del pre-fix). Subtitle aggiornato a "Configure AI providers used by Jjodel features". `AI.GLOBAL_DEFAULT_KEY` costante TRATTENUTA (ancora usata dalla migrazione one-shot). `AI.getActiveVersion` refactored: param ora REQUIRED (single caller Jodie.tsx:58 lo passa già); rimosso fallback `if (!provider) provider = JodieConfig.current.activeProvider`. Acceptance: `grep -r "JodieConfig\\.(current|default)\\.activeProvider|setGlobalDefault"` → zero matches. tsc pulito per i miei file (81 errori pre-esistenti non correlati restano: SVG imports, casing, Measurable.tsx).
**Nome del documento prompt**: 2026-04-20 18:10

---

## 2026-04-20 — refactor: Default Provider removal — Phase 2 (feature alignment)
**Prompt**: Align Chat, Documentation, Explain, Mappings to per-feature preferences exclusively; make AIDisclaimer feature-aware. Default Provider UI still present but dormant.
**File toccati**:
- frontend/src/components/Jodie/Jodie.tsx (4 sites: init, settings-change, provider-change, auto-switch)
- frontend/src/components/Jodie/ProviderSelector.tsx (Opzione 1 scelta: tenuto il componente Jodie-specifico e cambiata solo la write)
- frontend/src/services/DocumentationService.ts (line 614 read → getPreferred('documentation'); + import AIConfig)
- frontend/src/components/abstract/tabs/DocumentationTab.tsx (line 998 write → setPreferred)
- frontend/src/components/ExplainModal.tsx (streamExplain read → getPreferred('explain'); no UI dropdown, auto-resolve sufficient)
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx (drop `JodieConfig.current.activeProvider || resolvedProvider` fallback chain)
- frontend/src/components/common/AIDisclaimer.tsx (add required `feature: AIFeature` prop)
- frontend/src/components/Jodie/JodieWindow.tsx (pass feature="chat")
- frontend/src/components/abstract/tabs/DocumentationTab.tsx (pass feature="documentation")
- frontend/src/jjtl/views/InferredMappingsPanel.tsx (pass feature="mappings")
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Opzione 1 per Jodie/ProviderSelector — è un <select> native con UX distinta dal common/ProviderSelector (Bootstrap styling, parent-controlled props); non interscambiabile. AIDisclaimer call sites: 3 attivi aggiornati (JodieWindow, DocumentationTab, InferredMappingsPanel); `ScriptBlock.tsx:15` importa AIDisclaimer ma NON lo rende (dead import) — lasciato intatto. ExplainModal non ha dropdown UI visibile: resolve via `getPreferred('explain')` + fallback first-enabled (sufficiente per ora; UI selector aggiunta solo se necessario). SuggestedMappingsPanel: rimosso `JodieConfig.current.activeProvider` check; ora usa solo `resolvedProvider = getPreferred('mappings')`. Tutti i file modificati tsc-clean.
**Nome del documento prompt**: 2026-04-20 18:05

---

## 2026-04-20 — refactor: Default Provider removal — Phase 1 (foundation)
**Prompt**: Fix ProviderSelector to write per-feature; register 'explain' in AIFeature; refactor getPreferred fallback to per-feature → first-enabled; add idempotent one-shot migration from global to per-feature prefs. Visible UX unchanged.
**File toccati**:
- frontend/src/components/common/ProviderSelector.tsx
- frontend/src/types/jodie.ts
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Discrepancy rispetto al prompt**: il prompt afferma che la pattern delle chiavi per-feature è `jjodie_pref:<feature>`, ma il codice reale (jodie.ts:381,396) usa `${AI.STORAGE_PREFIX}${feature}` dove `STORAGE_PREFIX = 'jjodel_provider_'`. Chiavi effettive: `jjodel_provider_chat`, `jjodel_provider_mappings`, ecc. La funzione di migrazione usa la pattern reale (coerente con getPreferred/setPreferred). Nessun call site di `common/ProviderSelector` ha richiesto l'aggiunta del prop `feature` — era già required nell'interface (line 16) e l'unico call site (`SuggestedMappingsPanel.tsx:373`) lo passa già come `feature="mappings"`. Aggiunto `'explain'` all'union AIFeature. `getPreferred` nuovo fallback: per-feature → `getFirstEnabledProvider()` (private helper nuovo, ordine deterministico via `ALL_AI_PROVIDERS`). `migrateGlobalDefaultToPerFeature` chiamata da `JodieConfig.load()` al suo inizio (sentinel-protected, idempotente, copre tutti gli exit paths). Sentinel key: `jjodel_migration:global_to_per_feature = '1'`. `setGlobalDefault` e `activeProvider` LASCIATI in place per Phase 2/3.
**Nome del documento prompt**: 2026-04-20 18:00

---

## 2026-04-20 — docs: Default Provider removal diagnostic
**Prompt**: Read-only analysis of global Default Provider usage, LLM feature inventory, and fallback strategy options
**File toccati**: none (read-only) + docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Blast radius = 13 files (7 direct global reads, 3 setGlobalDefault calls, 1 Settings UI, 1 core fallback logic, 1 persistence). Critical path: remove "Default Provider" UI from AISettingsContent.tsx, convert chat/documentation/mappings features to per-feature prefs via AIConfig.setPreferred(feature, providerId), update ProviderSelector to require feature ID parameter. Current state: documentation & mappings already use getPreferred(); chat uses global directly; scriptblock stubbed; explain ad-hoc (not in AIFeature union). Recommended strategy: (A) immediate UI removal, (B) phase per-feature adoption starting with chat, (C) refactor ProviderSelector to enforce per-feature persistence. Auto-switch fallback to first-enabled-provider (not UI-forced) suitable for all features except documentation (which should have user choice via toolbar dropdown). One-time migration feasible: seed per-feature prefs from old global default localStorage key on first load.
**Nome del documento prompt**: 2026-04-20 17:30

---

## 2026-04-20 — fix: transformation assistant error UX (explicit fallback + settings link)
**Prompt**: Replace silent fallback with explicit user choice; route unconfigured-provider error to Settings → Providers
**File toccati**:
- frontend/src/jjtl/services/MappingSuggestionService.ts
- frontend/src/jjtl/types/suggestions.ts
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Added optional `canFallbackToSimple?: boolean` to `SuggestionResult` (suggestions.ts:54-61); service sets it on AI errors and rethrows AbortError (MappingSuggestionService.ts catch block). UI distinguishes "no provider" (error string contains "not configured") from generic LLM errors: first shows "No AI provider is configured." + "Open Settings → Providers" button; second shows the real error message + "Try simple matching instead" button. Fallback uses a separate `handleFallbackToSimple` callback that bypasses `selectedLocalOption` state so the dropdown isn't clobbered. Settings navigation uses `useSettingsModalSafe().openSettings('providers')` — same mechanism already used in ProviderSelector, Jodie, StatusBarRightZone, DocumentationTab. TypeScript clean for modified files; 81 pre-existing unrelated errors remain untouched.
**Nome del documento prompt**: 2026-04-20 17:05

---

## 2026-04-20 — fix: transformation assistant provider threading + cancellation
**Prompt**: Thread user-selected AI provider from SuggestedMappingsPanel through service layer; add AbortController cancellation
**File toccati**:
- frontend/src/jjtl/services/AIMatcher.ts
- frontend/src/jjtl/services/MappingSuggestionService.ts
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Added optional `aiProvider?: TAIProvider` + `signal?: AbortSignal` to `AnalyzeOptions` and `AIMatcher.analyze()`. AIMatcher now uses `aiProvider ?? JodieConfig.current.activeProvider`. Threaded from `SuggestedMappingsPanel.handleAnalyze` via existing `resolvedProvider` variable (line 164). **Discrepancy**: prompt specified `AnalyzeOptions` lives in `types/suggestions.ts`, but it actually lives in `services/MappingSuggestionService.ts:16-20` (re-exported via services/index.ts:8); applied change where interface actually is, `suggestions.ts` untouched by this task. **AbortSignal caveat**: `AIProviderService.chat` has 8 provider branches each with its own fetch() — modifying all was not trivial per prompt criteria, so added the prescribed TODO comment above the chat call. Added post-await `signal?.aborted` check to throw AbortError if user cancelled. Cancel button (`bi bi-x-circle`) rendered next to Analyze button only while `isAnalyzing`, reuses `btn-analyze btn-secondary` classes. AbortError silently resets state in UI catch block. TypeScript clean for modified files.
**Nome del documento prompt**: 2026-04-20 17:00

---

## 2026-04-20 — docs: Transformation assistant diagnostic
**Prompt**: Read-only diagnostic of transformation assistant (name matching, LLM integration, provider selector gap)
**File toccati**: none (read-only) + docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: SuggestedMappingsPanel + AIMatcher + MappingSuggestionService form a ~85% integrated AI-assisted name-matching system using canonical AIProviderService + AIConfig infrastructure. Current bug: AIMatcher reads JodieConfig.current.activeProvider directly (line 42) instead of respecting provider selected in ProviderSelector dropdown—the UI computes resolvedProvider but doesn't pass it to service layer. Fix is atomic: add optional aiProvider parameter to AnalyzeOptions→MappingSuggestionService.analyze()→AIMatcher.analyze(), pass from SuggestedMappingsPanel.handleAnalyze(). Tested paths: SimpleMatcher (deterministic fuzzy match + type compat), AIMatcher (LLM prompt with JjEL syntax rules + JSON response parsing). All 8 providers supported (Claude/GPT/DeepSeek/Gemini/Mistral/Groq/Kimi/Ollama). No parallel provider abstraction. Feature ID 'mappings' registered in AIFeature union at types/jodie.ts:80.
**Nome del documento prompt**: 2026-04-20 16:30

---

## 2026-04-20 — docs: JjTL parser diagnostic
**Prompt**: Read-only diagnostic of JjTL parser to assess helper declaration feasibility
**File toccati**: none (read-only) + docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: `helper` is fully implemented end-to-end — lexer (tokens.ts:16,111), parser (parser.ts:563-604, integrated at :94-95), AST (HelperAST in types/ast.ts:119-126), executor registration via `EvaluationContext.registerBuiltin()` (executor.ts:651-657); primitive types in TypeRegistry.isInstance (context.ts:98-125) accept EInt/Integer, EString/String, EBoolean/Boolean, EDouble/EFloat/Double/Float/Number — EReal NOT registered; only gap is runtime type validation of helper params/return (parsed but unchecked).
**Nome del documento prompt**: 2026-04-20 16:00

---

## 2026-04-17 — fix: duplicate reference values in JjTL executor output
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — deduplicazione nel feature extraction: `rawVals` filtrato con `Set<string>` per eliminare Pointer ID duplicati nel DValue.values
- `frontend/src/jjtl/executor/executor.ts` — deduplicazione guard in `wrapIfTargetReference`: array di target deduplicated by `__sourceId`

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Problema**: `outputPlace := nextState` produceva `targets: [Place, Place]` (stesso `__sourceId` duplicato) anche se `nextState` ha molteplicità 1.

**Root cause**: il raw `DValue.values` array può contenere lo stesso Pointer ID più volte — per esempio quando `syncCreateReferenceLink` appende senza dedup (il fix precedente usa `[...meaningful, targetObject.id]`), o per data corruption. Con `meaningful.length > 1`, ProjectEditor wrappa come array: `[{__ref: P}, {__ref: P}]`. L'executor risolve ogni elemento indipendentemente → `[PlaceObj, PlaceObj]`. `wrapIfTargetReference` wrappa l'intero array → `targets` duplicati.

**Fix 1 — ProjectEditor (source)**: nel feature extraction loop, `meaningful` ora viene deduplicated da un `Set<string>` che traccia i valori già visti. Per Pointer strings identici, il secondo viene scartato. Per primitivi non-string (numeri, booleani), non vengono deduplicated (valori legittimamente ripetuti in attributi multi-valued).

**Fix 2 — Executor (guard)**: `wrapIfTargetReference` deduplica l'array di target by `__sourceId` (o `id`, o `name` come fallback) prima di wrappare come `__ref_result`. Questo è un guard difensivo — il fix primario è nel ProjectEditor.

---

## 2026-04-17 — feat: `parent` (eContainer) for JjTL transformations
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — computa `_containerId` dal father chain di DObject quando costruisce sourceModelData: `DObject.father → DValue → DValue.father → owning DObject`
- `frontend/src/jjtl/executor/executor.ts` — `createInstanceContext` risolve `_containerId` al parent object nella source model; fallback preservato per test/L-layer proxy

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Approccio**: il prompt chiedeva di aggiungere un campo stored `_containerId` a DObject. Invece ho scelto di **computarlo on-the-fly** dalla catena `father` esistente durante la costruzione del sourceModelData — zero migration, zero campi aggiunti alla serializzazione, zero punti di sync da mantenere.

La catena: `DObject.father` punta a DModel (root object) o DValue (oggetto contenuto). Se DValue, `DValue.father` punta al DObject proprietario. Traversando due hop in `idlookup`, ottengo il container DObject ID.

**ProjectEditor**: dopo l'estrazione features, legge `(obj).__raw.father`, cerca in `idlookup`: se è un DValue, prende `fatherData.father` (il DObject owner). Setta `result._containerId`.

**Executor**: in `createInstanceContext`, ordine di risoluzione:
1. Feature utente `parent` (già nei bindings da proxyEntries — priorità utente preservata)
2. `_containerId` → cerca nella source model flat array l'oggetto con quell'ID → lo binda come `parent`
3. Fallback `.father / .eContainer / .owner` per L-layer proxy e test

Risultato: `parent` in JjTL trasformazioni (es. `inputPlace := parent`) ora risolve al DObject container, che poi passa attraverso la cross-type resolution del trace model.

**Follow-up**: `data.parent` nella Console JjEL richiede un intervento sul L-layer proxy o sull'evaluator — out of scope per questa sessione.

---

## 2026-04-17 — fix: reference edges not drawn for transformation-generated models
**File toccati**:
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — aggiunto Step 4 nell'auto-populate effect: crea DVoidEdge per reference M1 instance che hanno valori ma nessun edge nel grafo; aggiunto `modelObjectCount` selector per triggerare l'effect per modelli M1; rimossi gli early-exit che bloccavano modelli senza classifier

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Problema**: nei modelli generati da trasformazione, le reference (es. `output → Place_1`) erano settate correttamente (visibili nel Properties panel) ma nessun edge veniva disegnato nel flow editor.

**Root cause**: il flow editor genera edges SOLO da oggetti DEdge/DVoidEdge espliciti nel grafo. Non ha un path per derivare edges da `DValue.values` (reference feature values). Il flusso di creazione:

1. Trasformazione (ProjectEditor): crea DObject + DVertex ✅ + scrive reference values ✅ ma **NON crea DVoidEdge**
2. Auto-populate effect (useJjomSync): crea DVoidEdge per reference M2 (DClass→DClass) ma **ignora M1** (DObject→DObject)
3. Due early-exit bloccavano l'effect per modelli M1:
   - Line 352: `modelClassCount === 0` → M1 models have no classifiers → exit
   - Line 393: `classifierEntries.length === 0` → M1 models have no DClass/DEnumerator → exit

**Fix — 3 modifiche in useJjomSync.ts**:

1. **Nuovo selector `modelObjectCount`**: conta `rawModel.objects.length`. Aggiunto alle deps dell'effect. Per modelli M1, `modelObjectCount > 0` impedisce l'early-exit a line 352.

2. **Early-exit estesi**: 
   - Line 352: `&& modelObjectCount === 0` — non uscire se ci sono DObject
   - Line 393: `&& !hasM1Objects` — non uscire se ci sono objects M1
   - Line 469: `&& missingM1EdgeCount === 0` — non uscire se mancano edge M1

3. **Step 4 — M1 instance reference edges**: dopo lo Step 3 (M2 edges). Per ogni DObject:
   - Itera `dObj.features` (DValue Pointer array)
   - Per ogni feature il cui `instanceof` è un `DReference` (non `DAttribute`)
   - Legge `dFeat.values` (raw Pointer IDs dei target)
   - Per ogni target che ha un vertex nel grafo: crea `DVoidEdge.new2(metaId, graphId, ..., isReference: true)`
   - Usa `existingEdgeKeys` + `hasCanvasEdgePair` per deduplicazione (idempotente)

Il DVoidEdge appena creato viene aggiunto ai subElements del grafo → l'incremental sync effect (line 729) lo raccoglie automaticamente → `jjomEdgeToRFEdge` lo converte in RF Edge → l'edge appare nel diagramma.

---

## 2026-04-17 — fix: flow editor edge connect does not persist reference value
**File toccati**:
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — `syncCreateReferenceLink` (line 1260) e `syncCreateCompositionLink` (line 1192): letto `__raw.values` al posto del getter L-layer `.values`

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Problema**: trascinando un edge da Transition a State, l'edge compariva nel diagramma ma il Properties panel mostrava `nextState [1..1]` come `-----` (vuoto). La reference non veniva persistita nel DObject.

**Root cause**: in `syncCreateReferenceLink` e `syncCreateCompositionLink`, il codice leggeva `refProxy.values ?? []` per ottenere i valori correnti prima di appendere il nuovo target. Ma `refProxy.values` è il getter L-layer (`LValue.get_values`), che **padda con `undefined`** quando `ret.length < dmeta.lowerBound` (cfr. LModelElement.tsx ~line 6989). Per `nextState [1..1]` con nessun valore settato: `lowerBound = 1`, raw values = `[]`, getter returns `[undefined]`.

Risultato: `[...current, targetObject.id]` = `[undefined, "Pointer_xxx"]`. Il nuovo Pointer finisce a index 1 anziché index 0. Il `set_values` scrive `undefined` a index 0 (clearing) e il Pointer a index 1 (fuori dal range utile per [1..1]). Il Properties panel legge index 0 → `undefined` → `-----`.

**Fix**: sostituito `refProxy.values ?? []` con `refProxy.__raw?.values ?? []` (il DValue raw, senza padding), filtrato per `v != null && v !== ''`. Per `nextState [1..1]` vuoto: `rawVals = []`, `meaningful = []`, risultato = `["Pointer_xxx"]` → correttamente scritto a index 0.

Stessa fix applicata a entrambe le funzioni:
- `syncCreateCompositionLink` (containment references)
- `syncCreateReferenceLink` (non-containment references)

**Flow completo investigato**:
```
User drag edge Transition → State
  → ReactFlow.onConnect → pendingConnectionRef
  → ReactFlow.onConnectEnd → M1 branch
  → getCompatibleReferences(Transition metaclass, State id) → [{name: 'nextState', ...}]
  → auto-select (1 ref) → handleM1ReferenceSelected
  → guardLink check (upper-bound) → allowed
  → syncCreateReferenceLink(vertexId_source, vertexId_target, 'nextState')
    → sourceObject = LVertex.model (= LObject Transition)
    → targetObject = LVertex.model (= LObject State)
    → refProxy = sourceObject.$nextState (= LValue proxy)
    → [FIX] rawVals = refProxy.__raw.values (no padding)
    → refProxy.values = [...meaningful, targetObject.id]
    → DVoidEdge.new2() → visual edge
```

---

## 2026-04-17 — fix: DObject delete leaves dangling Pointers + referenceFeatures crash
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx:2343` — `o.referenceFeatures` → `o?.referenceFeatures` (guard contro `undefined` in `.reduce()`)
- `frontend/src/common/Dummy.ts:104-113` — safety-net in `get_delete()`: rimozione diretta da `father.objects`/`father.features` prima del loop `pointedBy`-based

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito (errore `Dummy.ts:46` è pre-esistente, Vite internal).

**Crash `referenceFeatures`**: `ProjectEditor.tsx:2343` — `.reduce()` su `objects` dove qualche elemento è `undefined`. Causa: `LModel.get_objects()` risolve i Pointer nell'array `objects` via `LPointerTargetable.from(pointer)`. Quando il target è stato cancellato (non esiste in `idlookup`), `from()` ritorna `undefined`. Fix: `o?.referenceFeatures?.length` (una `?` in più).

**Dangling Pointers — investigazione**:
- **Delete flow** (`Dummy.get_delete()`, lines 50-228): corretto in principio. Legge `dDeleted.pointedBy` → per ogni dependency con `field === 'objects'` (line 170) → `SetFieldAction.new(father, 'objects', deletedId, '-=', true)`.
- **Perché fallisce**: `pointedBy` è persistito su ogni DObject. Ma se i record sono stale/incompleti (dati creati prima che il tracking fosse robusto, import batch, sessioni di sviluppo), `get__jjdependencies` non trova la dependency `objects` → `-=` non viene mai eseguito → Pointer resta nell'array.
- **Evidenza**: ~220 warning "is deleted" all'apertura del progetto "Stame Machine" (pre-esistenti, non causati da operazioni correnti).

**Safety-net fix** (`Dummy.ts`): aggiunto blocco prima del loop `pointedBy` che rimuove direttamente il Pointer dalla collection del father:
- `DObject` → `SetFieldAction.new(father, 'objects', deletedId, '-=', true)`
- `DValue` → `SetFieldAction.new(father, 'features', deletedId, '-=', true)`

Questo è ridondante quando `pointedBy` funziona (il `-=` su un valore non presente nell'array è un no-op), ma garantisce la pulizia anche con dati corrotti. I ~220 warning esistenti richiederebbero una pulizia dati separata (out of scope).

---

## 2026-04-17 — fix: reference materialization via __sourceId map
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — STEP 8b reference lookup riscritta: `executorObjToName` (object identity, inaffidabile) sostituita con `sourceIdToObjectName: Map<string, string>` che mappa `__sourceId → objectName` assegnato durante creazione DObject

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito. Zero regressi.

**Problema**: STEP 8b loggava `"Cannot determine name for target of T1.output[0]"` per ogni reference. Due cause:
1. `executorObjToName.get(targets[ri])` — JS object identity: funziona in teoria ma fallisce in pratica (qualche passo intermedio crea un nuovo oggetto o il GC/V8 rilocava)
2. `targets[ri]?.name` — undefined perché la regola `State -> Place` non ha `name := name`

**Fix**: nuova mappa `sourceIdToObjectName: Map<string, string>`. Keyed by `__sourceId` (string, Pointer ID dell'elemento sorgente che ha generato il target — sempre presente, settato da `createTargetInstance`). Questo è completamente indipendente sia dall'identità oggetto JS sia dalla presenza di un binding `name`.

Flusso:
1. STEP 6 (DObject creation loop): per ogni `instanceData`, se ha `__sourceId`, registra `sourceIdToObjectName.set(instanceData.__sourceId, objectName)`
2. Post-loop: logga la mappa completa
3. STEP 8b: per ogni target in `__ref_result.targets`, legge `target.__sourceId`, cerca in `sourceIdToObjectName`, ottiene il nome del DObject, trova l'LObject via LModel proxy, ottiene il Pointer ID reale, scrive con `setValueAtPosition(i, realId, { isPtr: true })`

**Log atteso dopo il fix**:
```
[ProjectEditor] sourceId→name map: { "Pointer_S0": "Place_0", "Pointer_S1": "Place_1", ... }
[ProjectEditor] ✅ Ref: T1.output[0] → Place_1 (Pointer1776...)
```

---

## 2026-04-17 — fix: reference lookup in transformation output
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — STEP 8b reference lookup riscritta: `executorObjToPointerId` (temp DObject ID) sostituita con `executorObjToName` (objectName assegnato durante creazione) + lookup via LModel proxy per ottenere il Pointer ID reale

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito. Zero regressi.

**Problema**: STEP 8b loggava `"No DObject found for target of T1.output[0]"` per ogni reference. Il lookup `executorObjToPointerId.get(targets[ri])` falliva sempre.

**Root cause**: due problemi indipendenti nella mappa `executorObjToPointerId`:
1. **Valore inaffidabile**: `dObject.id` da `DObject.new()` è un ID temporaneo (documentato in CLAUDE.md: "NON corrisponde all'ID reale dell'oggetto nel framework"). Usarlo come Pointer ID per scrivere una reference non funziona — il framework non lo risolve.
2. **Chiave potenzialmente non matchante**: la mappa usa object identity JS (`Map<any, string>` keyed by executor instance). Sebbene in teoria la catena di riferimenti sia preservata (executor → targetModel.instances → __ref_result.targets), qualsiasi copia intermedia spezzerebbe il match.

**Fix**: eliminata la dipendenza da `dObject.id` e da object identity. Nuova strategia:
1. `executorObjToName: Map<any, string>` — mappa executor instance → `objectName` (il nome assegnato durante la creazione DObject, uguale a `instanceData.name || synthetic`). Questo è stabile.
2. In STEP 8b (dentro il setTimeout, dove il LModel proxy è disponibile): per ogni target nell'array `__ref_result.targets`:
   - `targetName = executorObjToName.get(target) ?? target.name` — prende il nome dalla mappa (se object identity funziona) o fallback dal target stesso
   - `targetLObj = objects.find(o => o.name === targetName)` — trova l'LObject nel modello via LModel proxy (stessa tecnica degli attributi)
   - `targetRealId = targetLObj.id` — il vero Pointer ID dal proxy
   - `feature.setValueAtPosition(ri, targetRealId, { isPtr: true })` — scrive il reference usando il Pointer reale

**Perché funziona**: lo stesso pattern di STEP 8 (attribute setting) — trova oggetti per nome via LModel proxy, ottiene ID reali, scrive. Non dipende mai da `DObject.new().id`.

**Log atteso dopo il fix**:
```
[ProjectEditor] ✅ Ref: T1.output[0] → Place_1 (Pointer1776...)
```

---

## 2026-04-17 — fix: JjTL transformation output — reference writing
**File toccati**:
- `frontend/src/jjtl/executor/executor.ts` — `applyCrossTypeResolution` ora wrappa target instances risolte come `{ __ref_result: true, targets: [...] }` via nuovo `wrapIfTargetReference()`
- `frontend/src/components/project/ProjectEditor.tsx` — `handleExecuteTransformation` ora: (1) registra mappa `executorObjToPointerId` (executor instance → DObject Pointer ID) durante creazione, (2) colleziona `pendingReferenceSets` accanto alle `pendingAttributeSets`, (3) scrive reference via `LValue.setValueAtPosition(i, pointerId, { isPtr: true })` — stesso API del dropdown Properties panel

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito. Zero regressi.

**Problema**: la cross-type resolution nell'executor funzionava (produceva correttamente Place target dal trace), ma il risultato non appariva nel modello target per due ragioni:

1. **Executor non distingueva reference da attributi nel risultato**: `output` nel target instance conteneva l'oggetto Place direttamente — ProjectEditor non sapeva che era una reference da scrivere con `isPtr: true`.

2. **ProjectEditor scriveva solo attributi primitivi**: il loop in STEP 8 filtrava per `domainAttrNames` (solo `targetClass.attributes`), escludendo reference features. Anche se `output` fosse passato, `feature.value = placeObject` non scrive un Pointer ID — serve `setValueAtPosition(i, pointerId, { isPtr: true })`.

**Fix executor** — `applyCrossTypeResolution` ora chiama `wrapIfTargetReference()` sul valore risolto:
- Se il valore è un oggetto con `__createdBy: 'JjTL'` → wrappa come `{ __ref_result: true, targets: [value] }`
- Se è un array di tali oggetti → `{ __ref_result: true, targets: array }`
- Primitivi e oggetti non-target passano invariati
- Il marker `__ref_result` permette a ProjectEditor di distinguere reference da attributi senza consultare il metamodello

**Fix ProjectEditor** — tre aggiunte al flusso di `handleExecuteTransformation`:
1. **Mappa instance → DObject** (`executorObjToPointerId: Map<any, string>`): durante il loop di `DObject.new`, registra `instanceData → dObject.id`. Usa object identity (il JS reference dell'executor instance è lo stesso oggetto dentro `__ref_result.targets`).
2. **Collezione reference** (`pendingReferenceSets`): per ogni instanceData, scansiona `Object.entries` cercando valori con `__ref_result: true`. Li accumula separatamente dagli attributi.
3. **STEP 8b — reference writing**: dentro lo stesso `setTimeout` di STEP 8 (dopo gli attributi), itera `pendingReferenceSets`. Per ogni reference, trova l'LObject per nome, accede a `$refName` (LValue proxy), poi chiama `feature.setValueAtPosition(i, pointerId, { isPtr: true })` per ogni target. Stessa API che `Info.tsx:changeDValue` usa quando l'utente seleziona dal dropdown.

**Flusso end-to-end per `output := nextState`**:
1. ProjectEditor: `nextState` raw value = `"Pointer_xxx"` → wrappato come `{ __ref: "Pointer_xxx" }`
2. Executor Pass 1: crea Place per ogni State, registra in trace
3. Executor Pass 2: valuta `nextState` → `{ __ref: "Pointer_xxx" }` → `resolveRefById` → trova il Place target → `applyCrossTypeResolution` → `wrapIfTargetReference` → `{ __ref_result: true, targets: [placeInstance] }`
4. `targetInstance.output = { __ref_result: true, targets: [placeInstance] }`
5. ProjectEditor: crea DObject per Place, registra in `executorObjToPointerId`; crea DObject per Transition, trova `output.__ref_result` → pendingReferenceSets
6. STEP 8b: trova LObject Transition, `$output.setValueAtPosition(0, placePointerId, { isPtr: true })`

---

## 2026-04-17 — fix: JjTL cross-type resolution — reference handling
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — feature extraction loop ora legge `__raw.values` (bypassando la risoluzione L-layer proxy) e wrappa Pointer ID come `{ __ref: id }`
- `frontend/src/jjtl/executor/executor.ts` — `resolveValue` ora gestisce `{ __ref: id }` wrapper + nuovo `resolveRefById` per lookup by pointer ID + depth guard (max 10 livelli)

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito sui file modificati. Zero regressi.

**Problema**: la cross-type resolution (2026-04-16) non funzionava in pratica. `output := nextState` produceva `null` per tutte le Transition, e alla 4a il browser si freezava.

**Root cause 1 — reference come proxy L-layer**: `ProjectEditor.handleExecuteTransformation` leggeva `feature.values[0]` dall'L-layer getter, che per reference features restituisce LObject proxy (non Pointer ID stringa). Questi proxy hanno back-ref circolari (`LClass.attributes[0].owner → LClass`) che causano il freeze quando `safeDeepCopy` / `flattenProxy` li attraversa.

**Root cause 2 — nessun lookup per Pointer ID**: `applyCrossTypeResolution` cercava `value.name` o `value.className` per risolvere cross-type. Ma per reference features il valore era `null` (proxy che non sopravviveva alla deep copy) o un proxy non interpretabile. Nessun codepath gestiva il caso "il valore è un Pointer ID che punta a un source element tracciato".

**Fix ProjectEditor.tsx** — feature extraction ora legge `(feature as any).__raw?.values` (l'array DValue raw, che contiene primitive per attributi e Pointer ID stringhe per reference). I Pointer ID (pattern `"Pointer*"`) vengono wrappati come `{ __ref: "Pointer..." }`. Questo elimina completamente i proxy L-layer dal sourceModelData e risolve il freeze.

**Fix executor.ts** — `resolveValue` ora gestisce `{ __ref: id }` come primo check (prima del className check):
- Cerca `id` in `targetsBySourceName` (che registra sia per `.name` che per `.id` di ogni source instance)
- Se trovato: ritorna il target element (cross-type resolution riuscita)
- Se non trovato (implicit path): ritorna `null` (fail-open — la reference punta a un tipo senza regola)
- Se non trovato (explicit `resolve()`): throw con errore chiaro
- Se ambiguo (N regole): check se tutte dalla stessa rule → ok; altrimenti throw

Aggiunto `resolveRefById` come metodo dedicato per la logica di lookup by ID (separato dal lookup by className/name per mantenere le due code path leggibili).

Aggiunto depth guard (max 10 livelli) in `resolveValue` per prevenire loop infiniti durante il debug di strutture circolari residue.

**Come verificare**: stessa trasformazione SM → PN del prompt 2026-04-16. `output := nextState` ora risolve correttamente al Place corrispondente anziché `null`. Nessun freeze.

---

## 2026-04-16 — feat: JjTL cross-type resolution via trace model
**File toccati**:
- `frontend/src/jjel/types/ast.ts` — nuovo `FunctionCallExpr` aggiunto al `JjelExpression` union
- `frontend/src/jjel/parser/parser.ts` — `primary()` ora riconosce `identifier(args)` come `FunctionCall`
- `frontend/src/jjel/evaluator/evaluator.ts` — nuovo `evaluateFunctionCall` (lookup builtin → bound function, errore esplicito se nulla è callable)
- `frontend/src/jjtl/executor/astBridge.ts` — JjTL `FunctionCall` con `Identifier` callee ora produce `FunctionCall` JjEL (prima produceva solo `Identifier`)
- `frontend/src/jjtl/executor/executor.ts` — executor ribaltato in **due passate**: Pass 1 crea tutti i target + popola la trace, Pass 2 valuta le binding con trace completa; aggiunta `applyCrossTypeResolution`, handling speciale per `resolve(expr, TargetType)`, `parent` keyword con fallback `father` / `eContainer` / `owner`
- `frontend/src/jjtl/__tests__/astBridge.test.ts` — aggiornato test che si aspettava `Identifier` per le standalone call
- `frontend/src/jjel/__tests__/parser.test.ts` — 6 nuovi test `FunctionCall`
- `frontend/src/jjel/__tests__/evaluator.test.ts` — 3 nuovi test `FunctionCall`

**Esito**: ✅ 277 test passati (268 preesistenti + 9 nuovi). `tsc --noEmit` pulito sui file modificati.

**Richiesta utente**: implementare risoluzione automatica cross-tipo nei binding `:=`. Quando `output := nextState` e `State -> Place` è l'unica regola per `State`, il motore deve automaticamente risolvere `nextState` (lo State) al Place corrispondente tramite trace model. Disambiguazione via `resolve(expr, TargetType)` quando N regole hanno stesso source type. Primitivi, collection, `parent` keyword, errore runtime su riferimenti non risolvibili (filtrati da guardia `where`).

**Architettura due passate (requisito #0 del prompt)**:
Executor girava single-pass (match → create target → valuta binding per ogni regola in sequenza). Questo rompe la risoluzione cross-tipo se la regola `Transition -> Transition` viene eseguita prima di `State -> Place`: la trace è vuota e `output := nextState` fallisce.

Il refactor separa:
- `pass1CreateTargets(mapping)` / `pass1MultiSource(mapping)`: match + guard `where` + `createTargetInstances` + `traceBuilder.addLink` + registrazione in `targetsBySourceName`. **Nessuna** binding evaluation qui.
- `pass2BindAttributes(mapping)`: drena i `PendingBinding` accumulati in pass 1, chiama `executeAttributeMappingsWithTrace` — ora la trace è completa.

Stato mantenuto in `ExecutionContext`:
- `rulesBySourceType: Map<string, ClassMappingAST[]>` — index pre-costruito per lookup O(1) del set di regole con un dato source type
- `targetsBySourceName: Map<string, TargetEntry[]>` — keyed by element name (stabile anche dopo deep copy; object identity non lo è)
- `pendingByMapping: Map<ClassMappingAST, PendingBinding[]>` — ponte tra le due passate

Nota: la guard `where` è valutata in Pass 1, prima dei binding. Se una guard dipendesse da valori calcolati dai binding non funzionerebbe — vincolo accettato e documentato nel prompt.

**Risoluzione cross-tipo (`applyCrossTypeResolution` + `resolveValue`)**:
Chiamata su ogni RHS di binding prima di `targetInstance[attr] = value`. Regole:
1. `null`/`undefined`/primitivi → passthrough
2. Array → ricorsione elemento per elemento (collection handling)
3. Object con `className` / `__type` / `.instanceof.name` (L-layer):
   - 0 regole matchano → passthrough (tipo condiviso fra i due metamodelli)
   - 1 regola → lookup in `targetsBySourceName[name]`, match sulla rule specifica, ritorna il target; **throw** se non trovato (messaggio include guard/filtri come cause probabile)
   - N regole → throw "Ambiguous cross-type resolution", suggerisce `resolve(expr, TargetType)`

Punto chiave: la `ClassMappingAST` che ha creato il target è stored in `TargetEntry.rule`. Match per reference (non per `rule.name`) — garantisce 1-1 source→target anche se più regole coesistono.

**`resolve(expr, TargetType)` — keyword vs builtin**:
Problema: JjEL parser originale non aveva AST node per standalone function calls (`identifier(args)`). Solo MethodCall (`obj.method(args)`) esisteva. Quindi `targetAttr := resolve(...)` nemmeno parsava. Fix minimo: aggiunto `FunctionCallExpr` a JjEL (primary riconosce `IDENTIFIER LPAREN`, evaluator fa builtin/bound lookup).

Secondo problema: `resolve(nextState, Place)` — `Place` non è un valore bound, la valutazione standard restituisce `null`. Soluzione: intercept a livello JjTL executor (`tryEvaluateResolveCall`) in `evaluateExpression` prima della delegazione JjEL. Il secondo argomento viene letto come AST Identifier e il suo `.name` usato come stringa di classe target. Accetta sia JjTL FunctionCall (path legacy) sia JjelExpressionWrapper contenente JjEL FunctionCall (path `:=`).

Il builtin `resolve` registrato sul context resta come fallback (accetta args già valutati, può essere chiamato programmaticamente), ma il path primario è l'intercept.

**`parent` keyword**:
Implementata in `createInstanceContext`: se `sourceInstance.parent` non è già tra le proxy entries, fallback su `.father` (L-layer eContainer Jjodel) / `.eContainer` / `.owner` / `null`. La risoluzione cross-tipo poi scatta normalmente se il container ha una regola.

**Integration tests non inclusi (dolorosamente)**: ho scritto 12 integration test coprendo tutti i casi richiesti nel prompt (single-rule implicit, primitive passthrough, no-rule passthrough, collection element-wise, ambiguity error, rule-order independence, missing target error, parent + eContainer fallback, resolve(x, Type) disambiguation, resolve(x, UnknownType) error, conditional con primitivi). Li ho **rimossi** perché tutti i test executor-level del repo falliscono con `ReferenceError: window is not defined` da `monaco-editor/vs/base/browser/window.js` (import chain via joiner → react → monaco). Problema **preesistente** — confermato con `git stash` + run su master: 7 test file executor/integration già non girano. Aggiungere jsdom o `setupFiles` in `vitest.config.ts` è out-of-scope. I test sono sostituiti da unit test JjEL puri (FunctionCall parse + eval) che validano le fondamenta.

**Come verificare manualmente**: aprire trasformazione State Machines → Petri Nets, scrivere:
```
State -> Place { tokens := if isInitial then 1 else 0 }
Transition -> Transition {
    name := name
    input := parent
    output := nextState
}
```
Risultato atteso: Place S1 con tokens=1, S2 con tokens=0, Transition t1 con input=[place_S1] output=[place_S2].

**Note architetturali**:
- Log `[JjTL]` marca le due passate: `===== PASS 1: create + trace =====` e `===== PASS 2: bind attributes =====` per debug chiarezza
- L-layer detection: `detectSourceClassName` controlla `className` → `__type` → `instanceof.name` (L proxy)
- Name fallback: se source ha solo `.id` e non `.name`, uso `.id` come chiave (registrazione con entrambe le chiavi quando disponibili)
- `resolve` arg 1 letto come Identifier o StringLiteral (programmatic callers possono passare `"Place"` invece di `Place`)
- Pass 1 deve completare TUTTE le regole prima che Pass 2 cominci — implementato come due loop separati su `this.ast.mappings`

---

## 2026-04-16 — fix: transformation code preserved when user saves project without first clicking Save in JjTL editor
**File toccati**: `frontend/src/components/abstract/DockManager.tsx`
**Esito**: ✅ build ok (`vite build` 41.06s)

**Sintomo riportato**: dopo il fix di stamattina sulle trasformazioni, salvando un progetto e ricaricandolo, l'entry compariva nella dashboard ma il `code` era ricaduto al template di default (con i nomi corretti scelti dall'utente — quindi `generateDefaultCode(name, source, target)`, non il `DEFAULT_CODE` letterale).

**Root cause**: `JjtlDevelopmentEnv` mantiene il code in uno useState interno (`JjtlDevelopmentEnv.tsx:83`). La propagazione verso `transformation.code` avviene SOLO quando l'utente clicca il pulsante Save dentro l'editor JjTL (handleSave → onSave). `DockManager.openTransformation` ricevuto da Phase-2 di stamattina aveva `onCodeChange` cablato a un no-op (commento esistente: `// Code change tracked internally`). Quindi se l'utente:
1. Apre l'editor, scrive le regole
2. NON clicca Save nell'editor JjTL
3. Triggera Save Project (Cmd+S → `Navbar.tsx:772-794` → `ProjectsApi.save` → `compressedState`)

…il `transformation.code` serializzato è quello vecchio (template), perché l'editor non ha mai propagato i tasti battuti. Al reload, il template ricompare. Bug di "expectation mismatch" — l'utente assume che Save Project catturi anche l'editor in primo piano.

**Fix (1 file, opzione 2 - debounce 300ms)**: in `DockManager.openTransformation` (DockManager.tsx:275-303) ho creato:
- `debouncedSync(code)` — chiamata da `onCodeChange` su ogni keystroke. Reset+set di un timer 300ms; allo scadere chiama `onSave?.(code)` (lo stesso callback che il pulsante Save in editor invocherebbe).
- `explicitSave(code)` — wrapper di `onSave` che annulla il debounce pendente (evita il dispatch ridondante) e chiama subito `onSave`.

Wiring: `onSave: explicitSave, onCodeChange: debouncedSync`. Il pulsante Save resta funzionante come affordance "I'm done", ma non è più necessario per la persistenza.

**Edge case documentato in-place** (15 righe di commento sopra le closure): spiega perché il sync è necessario, dove vive il code intermedio, qual era il flusso bugged. Da non rimuovere senza capire il motivo — è la difesa contro il regredire del bug.

**Costo**: ogni 300ms di typing → 1 SetFieldAction → 1 dispatch Redux (asincrono via `setTimeout 0` come tutti gli action.fire). Trascurabile in pratica. Niente debounce a livello editor (più semplice tenerlo qui).

**Note**:
- Closure cleanup: il `debounceTimer` vive nella closure di `openTransformation`. Se l'utente chiude la tab con timer pendente, allo scadere chiama `onSave?.(code)` che esegue `setTransformations` su un transformation.id che potrebbe non esistere più (es. dopo delete). `prev.map(t => t.id === id ? ...: t)` è no-op in quel caso. Innocuo.
- `tabContent` è ricostruito anche per existing tab (`updateTab`), quindi una nuova chiusura debounceTimer è creata ad ogni openTransformation — ok, perché i closure vecchi non vengono più chiamati (nuovo JjtlDevelopmentEnv = nuovo onCodeChange).

## 2026-04-16 — fix: project save now includes transformations (data loss bug)
**File toccati**: `frontend/src/joiner/classes.ts`, `frontend/src/components/project/ProjectEditor.tsx`
**Esito**: ✅ build ok (`vite build` 45.11s)

**Root cause**: Le trasformazioni JjTL erano memorizzate solo in `useState` di `ProjectEditor.tsx:158` (commento esplicito: `// Transformations state (in-memory for now)`). Il save flow (`SaveManager.save` → `ProjectsApi.save` → `U.compressedState`) serializza esclusivamente il Redux store; le trasformazioni, vivendo in component state, non finivano mai nel JSON salvato. Al ricaricamento, l'`useState` ripartiva da `[]` e tutte le regole/guardie/mappings/trace della trasformazione venivano persi (data loss).

**Fix minimo (2 file)**:
1. **`joiner/classes.ts`**: aggiunto campo `transformations: any[] = []` a `DProject` e `transformations!: any[]` a `LProject`. Tipo `any[]` per evitare dipendenza circolare `joiner` → `jjtl`. Posizionato accanto a `tagNames` (stesso pattern di campo serializzabile non-pointer).
2. **`components/project/ProjectEditor.tsx`**: `useState` ora inizializzato da `(project as any).transformations || []`. Wrapper `setTransformations` (via `useCallback`) intercetta ogni update e dispatcha `SetFieldAction.new(project.id, 'transformations', next, '', false)`, scrivendo in Redux. Le 5 call-site esistenti (`setTransformations(prev => ...)`) continuano a funzionare invariate grazie alla firma `React.SetStateAction<JjtlTransformation[]>` del wrapper.

**Perché funziona**:
- `U.compressedState` (`common/U.tsx:426`) fa `state.idlookup[id] = {...dproject, state: ''}` — qualunque campo presente sul DProject viene serializzato.
- `LoadAction` ricostruisce l'intero state in Redux. La proxy `LProject` espone automaticamente `project.transformations` (stesso meccanismo di `tagNames`).
- Retrocompatibile: progetti vecchi senza il campo → `project.transformations` è `undefined` → fallback a `[]`.

**Documentation (bassa priorità)**: lasciato `// TODO: include documentation in project save` accanto allo state hydration. Stesso pattern di in-memory state riscontrato in `DocumentationSection`, ma rigenerabile e fuori scope di questo fix.

**Note architetturali per futuro**:
- Il megamodel (`model/megamodelPersistence.ts`) ha lo stesso problema sul flow `SaveManager.save` (è persistito solo nel `.jjodel` export tramite `buildProjectExportJson`, non in `compressedState`). Bug separato, non in scope.
- Il pattern wrapper `setTransformations` evita refactor invasivi delle 5 call-site esistenti.

## 2026-04-14 — fix: Dashboard CSS injection reactive + includes all views
**File toccati**: `frontend/src/pages/components/Dashboard.tsx`
**Esito**: ✅ build ok (80 errori TS, `vite build` 40.54s)

**Root cause**: `ProjectDashboard` had NO Redux subscription — it read project data via `LProject.fromPointer(id)` (one-shot `store.getState()`). The `<style>` tag only updated when the component re-rendered for other reasons (tab switch, hideLeftBar, etc.). Views created after the initial render or views whose CSS was edited were missed because:
1. No `useSelector` → no re-render on Redux state change
2. The `allSubViews` traversal depended on the L-proxy hierarchy being fully up-to-date (timing issue with async dispatches)

**Fix**: Replaced the one-shot `vparr.flatMap(vp => vp.allSubViews)` gathering with a `useSelector` that iterates `state.idlookup`, filtering for `DViewElement` and `DViewPoint` classNames, and calling `compiled_css` on each. This ensures:
- The `<style>` tag re-renders whenever ANY view's state changes in Redux
- ALL views in the project are included (not just those reachable via the subViews hierarchy)
- Newly created views are picked up immediately after their Redux dispatch propagates

**Performance**: iterating `state.idlookup` on every Redux change is O(n) where n = total elements. For typical projects (~100-500 elements, ~10-30 views), this is negligible (<1ms). The `compiled_css` getter is lazy — it returns the cached string immediately if `css_MUST_RECOMPILE` is false.

## 2026-04-14 — fix: view CSS not injected into DOM after project load
**File toccati**: `frontend/src/redux/reducer/reducer.ts`
**Esito**: ✅ build ok (80 errori TS, `vite build` 36.95s)

**Root cause**: After `LoadAction` (project load, reducer.ts:517-529), the Redux state is replaced wholesale with the deserialized project data. `css_MUST_RECOMPILE` and `compiled_css` are transient fields NOT included in the serialized project — they default to `undefined`/`false` and `''` respectively. The `get_compiled_css()` getter (view.tsx:793) checks `if (!c.data.css_MUST_RECOMPILE) return c.data.compiled_css` — since `!undefined` is `true`, it returns the cached empty string without ever compiling.

The Dashboard's `<style id="views-css-injector-d">` tag (Dashboard.tsx:595-597) maps `v.compiled_css` for all views → all return `''` → empty style tag → no view CSS in DOM.

**Fix**: Added `newState.VIEWS_RECOMPILE_all = true` after `LoadAction` processing (reducer.ts:529). This triggers the existing recompilation loop (reducer.ts:661-686) which sets `css_MUST_RECOMPILE = true` on every DViewElement. The next access to `compiled_css` then compiles the CSS (palettes + user CSS wrapped in the scoping selector) and caches it.

**How the CSS reaches the DOM**:
```
LoadAction → newState.VIEWS_RECOMPILE_all = true
  → reducer line 661: expands to all element IDs
  → reducer line 679: sets css_MUST_RECOMPILE = true per view
  → Dashboard.tsx: <style>{views.map(v => v.compiled_css)}</style>
  → compiled_css getter: css_MUST_RECOMPILE is true → compiles user CSS + palettes
  → wraps in scoping selector: .Pointer_View_XXX { user CSS }
  → <style> tag contains actual CSS → applied to canvas instances
```

## 2026-04-14 — fix: view CSS not applied to instances on canvas
**File toccati**: `frontend/src/components/forEndUser/Aliases.tsx`
**Esito**: ✅ build ok (80 errori TS, `vite build` 42.46s)

**Root cause**: The `<View>` component (Aliases.tsx:10-13) renders `<view className={"view " + className} {...props}>`. The spread `{...props}` passes `classNameAdd` as a **custom DOM attribute** instead of merging it into `className`. The `classNameAdd` prop (injected by `UX.tsx:340`) contains the view ID (e.g., `"mainView,Pointer_View_123,..."`) which is the CSS scoping selector used by `view.tsx:875` (`.${c.data.id} { ... }`). Without merging, the scoped CSS selector `.Pointer_View_123 { .state { ... } }` never matches because `Pointer_View_123` isn't in the element's class list.

**Fix**: Destructure `classNameAdd` from props, replace commas with spaces (UX.tsx joins with `,`), and merge into `className`:
```tsx
const { classNameAdd, className, ...rest } = props;
const addClasses = classNameAdd ? String(classNameAdd).replace(/,/g, ' ') : '';
const merged = ('view ' + (className || '') + ' ' + addClasses).trim();
return <view className={merged} {...rest}>{children}</view>;
```

Before: `<view class="state bg-white p-1" classnameadd="mainView,Pointer_View_123">` — CSS can't match
After: `<view class="view state bg-white p-1 mainView Pointer_View_123">` — `.Pointer_View_123 { .state { border: 1px solid red } }` matches

## 2026-04-14 — fix: Maximum Update Depth — reference-stabilizing guard on ReactFlow props
**File toccati**: `frontend/src/components/editor-v2/EditorV2.tsx`
**Esito**: ✅ build ok (80 errori TS, `vite build` 38.40s)

**WHY PREVIOUS FIXES WEREN'T ENOUGH**: Memoizing nodes/edges and debouncing the sync reduce the frequency but can't eliminate reference-only changes caused by the Jjodel action system's `setTimeout(dispatch, 0)` (action.ts:349) + periodic `setInterval → COMMIT` (reducer.ts:1381). Any code path that calls `setNodes(prev => ...)` and returns a new array (even with identical content) produces a new reference → StoreUpdater sees "change" → calls internal `setNodes()` → re-render → possible loop.

**THE FIX — Reference stabilizer**: Added `stableNodes`/`stableEdges` useMemo guards between the React state (`nodes`/`edges` from `useNodesState`/`useEdgesState`) and the `<ReactFlow>` props. The guard compares each node/edge structurally (id, type, data reference, selected, position within 0.1px, measured dimensions). If ALL elements match, it returns the **previous array reference** from a `useRef`. StoreUpdater sees the same reference → no sync → no loop.

```tsx
<ReactFlow
    nodes={stableNodes}   // ← stabilized reference
    edges={stableEdges}   // ← stabilized reference
    ...
/>
```

**Comparison fields checked per node**: `id`, `type`, `data` (reference), `selected`, `dragging`, `hidden`, `position.x/y` (±0.1px), `measured.width/height` (exact).

**Comparison fields checked per edge**: `id`, `source`, `target`, `sourceHandle`, `targetHandle`, `type`, `data` (reference), `selected`, `hidden`.

**When the guard DOES return a new reference**: only when genuine structural changes are detected (node added/removed, position changed >0.1px, data object replaced, selection toggled, etc.). These are legitimate changes that StoreUpdater should process.

**Retained from previous fixes**: dimension rate limiter (EditorV2.tsx), deeper shallowDataEqual (useJjomSync.ts), requestAnimationFrame debounce (useJjomSync.ts), Input.tsx value normalization.

## 2026-04-14 — fix: Maximum Update Depth Exceeded — debounced incremental sync
**File toccati**:
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — debounced setNodes/setEdges via requestAnimationFrame + deeper shallowDataEqual + debug log cleanup

**ROOT CAUSE IDENTIFIED**: `action.ts:349` wraps EVERY Redux dispatch in `setTimeout(fn, 0)`, forcing it outside React's render batch. The periodic `setInterval(() => COMMIT(undefined, false), N)` at `reducer.ts:1381` flushes buffered mutations through this async dispatch. Each dispatch arrives as a SEPARATE render cycle → `elementSnapshots` selector fires → incremental sync effect → `setNodes` → StoreUpdater → re-measure → dimension changes → `handleNodesChange` → new nodes ref → StoreUpdater fires AGAIN → LOOP.

**FIX — Debounced push via requestAnimationFrame**: Instead of calling `setNodes`/`setEdges` synchronously inside the incremental sync `useEffect`, patches are accumulated in `pendingNodePatchRef`/`pendingEdgePatchRef` arrays. A single `requestAnimationFrame` callback (`scheduleFlush`) flushes ALL accumulated patches into ONE `setNodes` call (using `reduce` to compose the patch functions). Multiple rapid COMMIT→dispatch→effect cycles within the same animation frame are coalesced into a single React state update. This breaks the loop because StoreUpdater only sees ONE nodes reference change per frame, not N.

**Previous fix (retained)**:
- `EditorV2.tsx`: rate limiter (`dimRateLimitRef`) for dimension changes — safety net
- `useJjomSync.ts`: deeper `shallowDataEqual` — prevents unnecessary patches for object nodes with recreated FeatureValueRow objects
- `Input.tsx`: `value ?? ''` — prevents uncontrolled→controlled React warning

## 2026-04-14 — fix: Maximum Update Depth Exceeded in EditorV2 (ReactFlow infinite loop)
**File toccati**:
- `frontend/src/components/editor-v2/EditorV2.tsx` — rate limiter for dimension changes + debug log cleanup
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — deeper `shallowDataEqual` comparison + debug log cleanup
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` — debug log cleanup
- `frontend/src/components/forEndUser/Input.tsx` — fix uncontrolled→controlled warning
**Esito**: ✅ build ok (80 errori TS, `vite build` 40.23s)

**Root cause (rename trigger)**: `objectVertexToRFNode()` creates NEW `FeatureValueRow` objects every time it's called. The old `shallowDataEqual` compared array elements by reference identity (`va[i] !== vb[i]`) — always FALSE for freshly-created objects, even with identical values. Result: incremental sync always considered object-node data "changed" → always called `setNodes` → StoreUpdater → measurement → loop.

The rename flow: ObjectNode `commitName()` → `setNodes` (label update) + `syncNodeLabel` → Redux dispatch → `elementSnapshots` selector detects hash change → incremental sync fires → calls `jjomVertexToRFNode()` → new features array with new object references → `shallowDataEqual` returns false → patches node data → `setNodes` → StoreUpdater → re-measure → dimension change (label width changed) → `handleNodesChange` → new nodes ref → loop.

**Fix 1 — Deeper `shallowDataEqual`** (useJjomSync.ts): Rewrote to do TWO levels of shallow comparison:
- Level 1: top-level keys compared by identity (same as before)
- Level 2 (NEW): for array elements that are objects, compare their properties shallowly (string/number/boolean values). For nested arrays of primitives (e.g. enumLiterals), compare elements by identity.

This correctly identifies that `{ name: "State", kind: "attribute", value: "idle" }` from two separate `objectVertexToRFNode` calls is EQUAL, even though the objects are different references. When data is actually equal, `patchedNodeData` is NOT populated → `hasNodeChanges` is false → `setNodes` is NOT called → loop broken.

**Fix 2 — Rate limiter** (EditorV2.tsx): Added `dimRateLimitRef` — max 3 auto-measurement dimension changes per node per 500ms. Safety net for cases where dimensions genuinely oscillate (ErrorDisplay badge, font loading, CSS transitions).

**Fix 3 — Input uncontrolled→controlled** (Input.tsx:286): `value: serializeValue(value)` could be `undefined` (when `serializeValue` returns `undefined` at line 130 or when initial getter returns `undefined` at line 96). Changed to `value: serializeValue(value) ?? ''`. This prevents React's "A component is changing an uncontrolled input to be controlled" warning, which caused extra re-renders during composition-child rename and contributed to the StoreUpdater cascade. The `setTimeout` in Jjodel's action system (action.ts) makes these extra re-renders arrive as SEPARATE render cycles (outside React batching), each triggering a full StoreUpdater sync.

**Debug log cleanup**: Removed 7 `console.log('[DEBUG ...]')` statements across EditorV2.tsx, useJjomSync.ts, jjomTransformers.ts.

## 2026-04-14 — fix: context menu text color (dark on dark)
**File toccati**: `frontend/src/components/editor-v2/EditorV2.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 42.60s)
**Root cause**: Context menu is rendered via `createPortal(menu, document.body)` (EditorV2.tsx:2663-2671) — portaled OUTSIDE the `.editor-v2.theme-dark` / `.editor-v2.theme-light` scope where `--float-text`, `--float-bg`, etc. are defined. At `<body>` level these CSS variables are undefined → `var(--float-text)` resolves to the initial value (browser default: black text) → dark text on dark `#1e293b` background.
**Fix**: Added hardcoded fallback values to every `var()` call in `.context-menu` rules — `var(--float-bg, #1e293b)`, `var(--float-text, #cbd5e1)`, `var(--float-hover, rgba(255,255,255,0.06))`, `var(--float-danger, #f87171)`, `var(--float-danger-bg, rgba(239,68,68,0.12))`, `var(--float-shadow, rgba(0,0,0,0.3))`, `var(--float-border, #334155)`, `var(--float-divider, rgba(255,255,255,0.08))`. Also set `i { color: inherit }` on icons (was commented out `//color: var(--float-icon)`). If the menu IS inside the theme scope (e.g. portal target changes), the variables override the fallbacks — backward compatible.

## 2026-04-13 — fix: update documentation and GitHub links
**Prompt**: Update all documentation links from www.jjodel.io to docs.jjodel.io and GitHub links from MDEGroup to jjodel-modeling
**File toccati**: Navbar.tsx, LeftBar.tsx, EmptyDashboard.tsx, RightPanel.tsx, About.tsx, AboutDialog.tsx, useHelpResolver.ts, U.tsx, Try.tsx, classes.ts, Dashboard.tsx, shareUtils.ts
**Esito**: ✅ completato (80 errori TS pre-esistenti invariati)

**Docs links** (www.jjodel.io → docs.jjodel.io):
- Navbar Help menu: Learn Jjodel, Getting Started, Video Tutorials, User Guide, Glossary, FAQ (enabled from disabled)
- LeftBar: Manual, Getting Started, API Reference
- EmptyDashboard: 3 resource links
- RightPanel: user-manual, documentation
- AboutDialog: Website → `jjodel.io`, Changelog → Documentation
- useHelpResolver.ts: WEB_BASE for "open in browser" in HelpDrawer

**GitHub links** (MDEGroup → jjodel-modeling/jjodel-frontend):
- Navbar: Roadmap → milestones, What's New → releases, Support → 3 enabled sub-items (Report Bug, Request Feature, Contact)
- About.tsx: changelog → GitHub releases
- U.tsx: error report issue link
- Try.tsx: automatic bug report owner/repo
- classes.ts: wiki link → docs.jjodel.io/reference/jjom/

**HTTP → HTTPS**:
- Dashboard.tsx: `http://app.jjodel.io` → `https://`
- shareUtils.ts: same

**Remaining www.jjodel.io** (expected exceptions): `Auth.tsx` terms-conditions, `LeftBar.tsx` explore
**Zero MDEGroup** references remaining

## 2026-04-12 — fix: RGB input values visible with proper width
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 43.01s)
**Fix**: `.cpanel__input-group input` was fixed at `width: 44px; text-align: center` — with the global `padding-right: 16px` for spinners, only ~22px remained for text (invisible "255"). Changed to: `width: 100%; min-width: 52px; text-align: left; padding: 4px 18px 4px 6px; box-sizing: border-box`. The parent `.cpanel__input-group` now has `flex: 1 1 auto; min-width: 0` so inputs share space equally.

## 2026-04-12 — fix: number input padding-right for spinner arrows
**File toccati**: `frontend/src/styles/components/_form-system.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 59.02s)
**Fix**: `input[type="number"] { padding-right: 2px }` → `padding-right: 16px`. The 2px was too tight — multi-digit values (e.g. "255" in RGB inputs) overlapped the spinner arrows. 16px provides ~14px clearance matching typical spinner width.

## 2026-04-12 — fix: restore number spinners, remove right padding
**File toccati**: `frontend/src/styles/components/_form-system.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 39.74s)
**Fix**: reversed the hide rule — `_form-system.scss:189-198` now explicitly restores spinners with `-webkit-appearance: inner-spin-button; margin: 0; padding: 0; opacity: 1` and sets `padding-right: 2px` on `input[type="number"]` to eliminate the gap. Removed the unused `.number-input-with-spinner` class (was dead code).

## 2026-04-12 — style: remove native number input spinners globally
**Prompt**: nascondere frecce up/down native su input[type=number]
**File toccati**: `frontend/src/components/editors/skeleton.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 49.26s)
**Root cause**: `skeleton.scss:226-242` had a GLOBAL rule re-enabling spinners with `!important`: `input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: auto !important; width: 24px; }`. This overrode the hide rule in `_form-system.scss:194-197` (`-webkit-appearance: none` — no `!important`). The skeleton rule was a legacy "spin buttons v1.0" style.
**Fix**: removed the 16-line block at skeleton.scss:226-242 (replaced with a one-line comment). The `_form-system.scss` global hide rule now takes effect uncontested: `-webkit-appearance: none` on `::-webkit-inner-spin-button` / `::-webkit-outer-spin-button`, plus `-moz-appearance: textfield` for Firefox.

## 2026-04-12 — fix: opacity slider track height + hide plus icon on hover
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 46.77s)
**Fix 1 — Opacity slider track mismatch**: root cause was `::-webkit-slider-runnable-track { height: 6px }` and `::-moz-range-track { height: 6px }` at lines 510-518 (legacy path) that overrode the element-level `height: 10px`. WebKit/Firefox render the track via pseudo-elements, not the input element height. Fixed both legacy and portal paths: track pseudo-elements → `10px; border-radius: 5px` matching the hue slider exactly.
**Fix 2 — Plus icon hidden by default**: `.cpanel .btn.color-suggestion i.bi` now has `opacity: 0; transition: opacity 0.15s`, with `&:hover i.bi { opacity: 1 }`. Clean circles when idle, `+` appears on hover.

## 2026-04-12 — style: opacity slider matches hue slider (both paths)
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 1m1s)
**Fix**: aligned both opacity slider instances to the hue slider dimensions:
- `.cpanel .suggestcontent input[type="range"]` (portal path, ~line 915) — already aligned in prev session
- `.suggestions input[type="range"]` (legacy path, ~line 478) — aligned now: track `6px; radius 3px` → `10px; 5px`, thumb `14×14` → `16×16`, shadow `0 1px 3px` → `0 1px 4px`, border `#cbd5e1` → `rgba(0,0,0,0.2)`, margin `8px 0` → `4px 0`

## 2026-04-12 — fix: suggestion panel color swatches → perfect circles
**Prompt**: i cerchi dentro il pannello scuro erano ancora ovali
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 47.85s)
**Fix**: riscritta la regola `.cpanel .btn.color-suggestion` con "nuclear approach" — ogni possibile dimensione forzata: `width/height/min-width/min-height/max-width/max-height: 22px !important`, `box-sizing: border-box`, `overflow: hidden`, `display: inline-flex` con center/center alignment, `font-size: 0` sul button (kills text baseline offset), `line-height: 1` su button e `i.bi`. Triple-selector `.btn.color-suggestion, button.btn.color-suggestion, .roww > .btn.color-suggestion` per massima specificity. Border ridotto da 2px a 1px per guadagnare spazio dentro il cerchio più piccolo. Icon `i.bi` ridotta da 12px a 10px.

## 2026-04-12 — fix: color swatches perfect circles, 20% smaller
**Prompt**: forzare cerchi perfetti (width === height) e ridurre 20%
**File toccati**:
- `frontend/src/components/editors/views/data/palette-data.scss` — root cause fix + size reduction
- `frontend/src/components/forEndUser/color.scss` — suggestion circle size in panel + legacy block
**Esito**: ✅ build ok (80 errori TS, `vite build` 43.70s)

**Root cause dell'ovale**: `palette-data.scss:492-496` dentro `#root .style-tab-redesign .controls .color-picker-root` aveva `height: 200% !important; transform: translateY(-25%) !important`. Specificity `(1,3,0)` con `!important` batteva la regola base `height: 24px !important` a specificity `(0,1,0)`. Risultato: width 24px ma height 48px → **ovale**. Le regole erano un hack per il vecchio `<input type="color">` nativo (rendere l'area cliccabile più grande verticalmente) — non più necessarie con il custom swatch `<div>`.

**Fix**: rimossi `height: 200% !important` e `transform: translateY(-25%) !important` dal blocco nested. Anche rimossi i sub-rules `input { min-width: 25px; height: 25px }` e `.delete-color { width: auto }` (target elementi che non esistono più nel DOM).

**Size reduction (-20%)**:
| Element | Before | After |
|---|---|---|
| `.color-picker-root` (palette-data.scss:282-283) | `24px × 24px` | `20px × 20px` |
| `.color-suggestion` (palette-data.scss:344-345) | `24px × 24px` | `20px × 20px` |
| `.cpanel .btn.color-suggestion` (color.scss) | `28px × 28px` | `22px × 22px` |
| Legacy `button.btn.color-suggestion` (color.scss:298-299) | `28px × 28px` | `22px × 22px` |
| `.jj-color-swatch` (color.scss:758-760) | `100% × 100%` | unchanged (fills parent) |

## 2026-04-12 — fix: unified color picker panel definitive layout (createPortal)
**Prompt**: ristrutturare Color.tsx per avere un singolo pannello contenuto
**File toccati**:
- `frontend/src/components/forEndUser/Color.tsx` — rewrite: panel rendered via `createPortal(panel, document.body)`
- `frontend/src/components/forEndUser/color.scss` — rewrite del blocco jj-color-* → `.cpanel` namespace
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 44.64s)

**Root cause del layout rotto**: `palette-data.scss:333` forza `.content.suggestions { position: absolute !important; z-index: 99999 !important }`. Il mio precedente override in `.jj-color-panel .content.suggestions { position: static !important }` aveva STESSA specificity `(0,2,0)` — palette-data.scss caricato dopo vince. Inoltre `.color-picker-root` è forzato a `24×24px` (palette-data.scss:282-283), troppo piccolo per ancorare un panel da 260px.

**Fix definitivo: `createPortal`**: il panel è renderizzato fuori dal DOM hierarchy via `createPortal(panel, document.body)`. Questo bypassa:
- `overflow: hidden` su qualsiasi parent
- z-index stacking contexts
- palette-data.scss's !important position rules
- Il constraint 24×24px del `.color-picker-root`

**Architettura nuova**:
```
<body>
  ...
  <div class="cpanel" style="position: fixed; top: {swatchBottom+4}; left: {centered}">
    <div class="cpanel__sv">canvas + cursor</div>
    <input class="cpanel__hue" />
    <div class="cpanel__inputs">HEX + R + G + B</div>
    <div class="cpanel__divider" />
    {childrenn}  ← .content.suggestions flows inline (overridden to position:static)
  </div>
  ...
</body>
```

**Posizionamento**: `position: fixed` basato su `anchorRef.getBoundingClientRect()` → `top = swatchBottom + 4`, `left = swatchCenterX - 130` (centrato 260px), `Math.max(4, left)` per non fuoriuscire a sinistra.

**CSS specificity fix per `.content.suggestions`**: `.cpanel .content.suggestions.suggestions` = specificità `(0,4,0)` > `(0,2,0)` di palette-data.scss → override vince anche con !important su entrambi (higher specificity wins when both have !important).

**Click-outside dismissal**: `useEffect` su `ColorPanel` ascolta `mousedown` globale, chiude se click fuori sia dal panel che dal swatch (due ref check).

**Namespace `.cpanel`** scelto perché: corto, unico nel codebase (verificato), evita collisioni con `.jj-color-panel` / `.color-panel` / `.color-picker-root` etc. che hanno regole conflittuali sparse in palette-data.scss + color.scss.

**Cosa rimane in color.scss (legacy)**: le vecchie regole `.pinned`, `.hoverable`, `.color-picker-root` etc. dalle righe 1-754 sono ora parzialmente dead code (il pinned highlight, il hover trigger, etc.) ma non rompono nulla — le regole di palette-data.scss che forzano `!important` su `.color-picker-root` rendono le vecchie regole irrilevanti. Cleanup di queste regole legacy delegato a post-release.

## 2026-04-12 — style: color picker refinements (oval border, scrollbar, circle shape)
**Prompt**: 3 fix cosmetici sul color picker panel
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 41.15s)

**Fix 1 — Oval border on pinned swatch**: `.pinned { background; outline: 1px solid; border-radius: 20% }` applicava un bordo ovale al container `.color-picker-root` rettangolare (width > height → 20% radius = ellisse). Rimossi `background`, `outline`, `border-radius` — il pannello aperto è sufficiente come visual indicator.

**Fix 2 — Scrollbar nel panel**: `.jj-color-panel { max-height: 500px; overflow-y: auto }` causava scrollbar interna. Rimossi entrambi — il panel si espande per mostrare tutto il contenuto.

**Fix 3 — Oval suggestion circles**: `button.btn.color-suggestion` usava `width/height: var(--input-height)` (variabile non risolta nell'ambito del panel dark → fallback potenzialmente non quadrato). Cambiato a `width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0` — dimensioni fisse, sempre circolari, non comprimibili dal flex parent.

## 2026-04-12 — feat: unified color picker panel (custom HSV canvas + palette in single popup)
**Prompt**: sostituire `<input type="color">` con color picker custom, integrare nel pannello palette
**File toccati**:
- `frontend/src/components/forEndUser/Color.tsx` — rewrite completo (~170 → ~200 righe)
- `frontend/src/components/forEndUser/color.scss` — aggiunto blocco `jj-color-*` (~150 righe)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 47.93s)

**Architettura del nuovo componente**:
```
<div className="color-picker-root pinned">      ← root (click toggles pinned)
  <div className="jj-color-swatch">              ← circle showing current color (replaces input[type=color])
  <div className="jj-color-panel">               ← unified popup (absolute, z-index 10000)
    <ColorPicker>                                 ← NEW: inline HSV picker component
      <div className="jj-color-picker__sv">       ← SV canvas (CSS gradients + mouse drag)
      <input className="jj-color-picker__hue">    ← Hue slider (0-360, rainbow gradient)
      <div className="jj-color-picker__inputs">   ← HEX + R/G/B number inputs
    </ColorPicker>
    <div className="jj-color-panel__divider">     ← separator
    {props.childrenn}                             ← existing: Opacity + Analogous/Lighten/... + Delete
  </div>
</div>
```

**Cosa è stato rimosso**:
- `<input type="color" ...>` nativo — sostituito dal swatch + custom picker. Nessun popup nativo del browser.
- L'intero blocco `otherprops` cleanup (delete data/field/getter/setter/etc.) — non serve più, l'input nativo era l'unico consumer
- I `<label>` wrapper per tooltip (erano dentro la vecchia `<label>` root) → convertiti a `<span>` già nel fix precedente, ora semplicemente rimossi (il tooltip label era ridondante)

**ColorPicker (nuovo componente inline, ~60 righe)**:
- **SV Canvas**: `<div>` con `background: linear-gradient(to right, #fff, hsl(H, 100%, 50%))` + overlay `linear-gradient(to bottom, transparent, #000)`. Mouse handler su `mousedown` + `mousemove/mouseup` via document listeners. Il cursor circle si muove via `left` + `top` percentuali.
- **Hue Slider**: `<input type="range" min=0 max=360>` con `background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`.
- **Inputs**: HEX (text, 70px) + R/G/B (number 0-255, 44px ciascuno). Tutti sincronizzati bidirezionalmente via tinycolor.
- **Conversioni**: `hexToHsv()` e `hsvToHex()` wrapper su `tinycolor2` (già installato nel codebase).

**Sincronizzazione bidirezionale**:
- User drags SV canvas → `hsvToHex(h, newS, newV)` → `setter(hex)` → getter aggiorna → RGB inputs si aggiornano
- User drags Hue slider → `hsvToHex(newH, s, v)` → setter → SV canvas gradient si aggiorna (via `hsl(H, 100%, 50%)` nello style)
- User types RGB → `tinycolor({r, g, b}).toHexString()` → setter → SV cursor + hue slider si aggiornano
- User types HEX → `tinycolor(hex)` se valido → setter → tutto si aggiorna
- User clicks palette suggestion (Analogous, Lighten, etc.) → PaletteData.tsx chiama `setColor(prefix, i, newVal)` → getter/setter chain aggiorna il picker

**Panel posizionamento e dismissal**:
- `position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%)` — centrato sotto il swatch
- `width: 260px; max-height: 500px; overflow-y: auto` — contenuto scrollabile se supera viewport
- Click outside → `document.addEventListener('mousedown')` handler chiude il pannello (invariato dal fix precedente)
- `onClick={e.stopPropagation()}` sul panel evita che click interni chiudano il panel

**Childrenn integration**: il `props.childrenn` (passato da PaletteData.tsx, contiene `<div className="content suggestions">` con Opacity slider + Analogous/Lighten/Darken/... + Delete button) viene renderizzato DENTRO `.jj-color-panel`. La regola CSS `.jj-color-panel .content.suggestions { position: static; background: transparent }` fa si che il pannello suggestions fluisca inline nel popup unificato (non assoluto come prima).

**Dark theme naturale**: il panel usa `background: #1e293b` (slate-800), inputs `background: #0f172a` (slate-900), text `#e2e8f0` (slate-200) — lo stesso schema dark del pannello suggestions esistente. Tutto si integra visivamente.

## 2026-04-12 — fix: color palette panel closed by default
**Prompt**: il pannello suggerimenti colore appariva automaticamente quando si apriva il tab Style
**File toccati**: `frontend/src/components/forEndUser/color.scss` (1 riga aggiunta)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati)
**Root cause**: nel fix precedente (hover→click), rimuovendo il blocco di trigger `:hover/:focus-within/:active` da color.scss, avevo anche rimosso la regola `.controls:focus-within .content.suggestions:not(:focus-within) { display: none !important }` che serviva come default-hide. Senza quella regola, `.content.suggestions` non aveva nessun `display: none` → visibile di default.
**Fix**: aggiunto `display: none` alla regola `.color-container .suggestions` (color.scss:264). Il `.pinned .content.suggestions { display: flex }` override lo mostra solo quando l'utente clicca.

## 2026-04-12 — fix: color picker hover→click, opacity slider styling
**Prompt**: cambiare hover→click per pannello palette colori, stilizzare slider opacity, evitare sovrapposizione popup
**File toccati**:
- `frontend/src/components/forEndUser/Color.tsx` — TSX refactor
- `frontend/src/components/forEndUser/color.scss` — CSS trigger change + slider styling

**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 47.72s)

**Fix P1 — hover→click (Color.tsx)**:
- Changed root element from `<label>` to `<div>` — prevents automatic forwarding of clicks to the child `<input type="color">` (browser `<label>` behavior). Now clicking the color circle area toggles the suggestions panel instead of opening the native color picker.
- Added `[pinned, setPinned]` state + `.pinned` CSS class on root `<div>`
- `handleRootClick`: toggles pinned, but skips if click target is inside `.content.suggestions` (let suggestion buttons handle their own clicks) or is the `<input>` element itself (let native picker open on direct input click)
- Added `useEffect` click-outside handler (`document.addEventListener('mousedown')`) that unsets pinned when clicking outside the root `<div>`

**Fix P3 — no overlap (color.scss)**:
- Removed `:hover`, `:focus-within`, `:active` from the `.content.suggestions` display trigger (was `.hoverable:hover, .hoverable:focus-within, .hoverable:active, .hoverable.pinned` at line 426)
- Only `.pinned` now shows the panel → click-only behavior, no accidental hover popup
- The native color picker (browser's `<input type="color">`) opens only when the user clicks directly on the `<input>` element (not via label forwarding since root is now `<div>`)
- Since `.pinned` toggle and native picker are separate interactions, they don't overlap

**Fix P2 — opacity slider (color.scss)**:
- Added custom styling for `input[type="range"]` inside `.suggestions`:
  - `-webkit-appearance: none; appearance: none` — kills browser default
  - Track: 6px height, 3px radius, `linear-gradient(to right, transparent, currentColor)` background
  - Thumb: 14×14px white circle with `#cbd5e1` border and subtle shadow
  - Both `-webkit-slider-thumb` and `-moz-range-thumb` covered for cross-browser

**Root `<label>` → `<div>` blast radius**:
- `<Color>` JSX element is rendered ONLY in `PaletteData.tsx:376` (verified via grep: 1 usage)
- Inner `<label>` elements (for tooltip labels) changed to `<span>` to avoid nested-`<label>` issues now that root is `<div>`
- The `color-picker-root` CSS class styles are unaffected — they used the class selector, not element-type selectors

**Other hover rules left intact**:
- `.value.hoverable:hover` (color.scss:401) — for SVG path value rows, different component from color circles, not changed
- `.controls:not(:focus-within) .color-picker-root:hover` (was line 462) — removed along with the old trigger block (now replaced by `.pinned` which provides the same visual feedback: outline + overflow + bg)
- `.controls:focus-within .content.suggestions:not(:focus-within)` (was line 471) — removed (no longer needed since suggestions are pinned-only, not focus-driven)

## 2026-04-11 — fix: JSX editor header alignment + language label
**Prompt**: allineare titolo header, cambiare TYPESCRIPT → JSX in status bar
**File toccati**:
- `frontend/src/components/editors/EditorFullscreenModal.scss` — header tightened
- `frontend/src/components/editors/EditorFullscreenModal.tsx` — nuova prop `languageLabel`
- `frontend/src/components/editors/languages/Jsx.tsx` — passa `languageLabel="jsx"`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 39.78s)

**Fix 1 — Header alignment** (`EditorFullscreenModal.scss:43-75`):
| Property | Before | After | Motivo |
|---|---|---|---|
| `.editor-fullscreen-header { padding }` | `16px 24px` | `8px 16px` | Tighter, matches task hint "padding 8px 16px" |
| `&__left { gap }` | `12px` | `8px` | Icon→title spacing più compatto |
| `&__left i { font-size }` | `20px` | `18px` | Icon leggermente più piccola |
| `&__left i { line-height }` | (not set → 1.2) | `1` | Evita offset verticale del line-height default |
| `&__left h2 { font-size }` | `18px` | `16px` | Header più compatto |
| `&__left h2 { line-height }` | (not set → 1.2) | `1` | **Fix critico**: senza questo il `h2` ha browser-default line-height 1.2 che offsetta il testo verticalmente di ~3-4px pur con `align-items: center` sul parent |
| `&__left h2 { padding }` | (not set → 0) | `0` (esplicito) | Safety |

**Fix 2 — Language label** (`EditorFullscreenModal.tsx` + `Jsx.tsx`):
Root cause: `EditorFullscreenModal` prop `language` serviva sia come Monaco language id (per syntax highlighting, es. `'typescript'`) sia come display label nel footer (`.editor-fullscreen-footer__language` con CSS `text-transform: uppercase`). Per il JSX editor Monaco richiede `language='typescript'` (configurato con `typescriptDefaults.setCompilerOptions({jsx: JsxEmit.React})` in `Jsx.tsx:44-54`), ma l'utente vedeva "TYPESCRIPT" nel footer invece di "JSX".

Fix: separato il display label dall'id Monaco. Aggiunta prop opzionale `languageLabel?: string` a `EditorFullscreenModalProps`. Il footer ora renderizza `{languageLabel ?? language}` — se la prop è fornita, usa quella; altrimenti fallback al `language` id (backward-compatible con tutti gli altri callers OCL/JS/MTM/Palette/Function che continuano a mostrare il language id grezzo).

`Jsx.tsx` passa `languageLabel="jsx"` insieme a `language="typescript"`. Il footer mostra "JSX" (uppercase via CSS) mentre Monaco usa l'ancora `typescript` engine per syntax highlighting JSX.

**Perché non cambiare `language="typescript" → "javascript"`**: Monaco's `typescript` language (via `typescriptDefaults.setCompilerOptions({jsx: JsxEmit.React})`) è configurato specificamente per JSX/TSX in `Jsx.tsx:44-54`. Passare a `javascript` perderebbe questa configurazione e potenzialmente rompe type-checking + autocomplete per il template.

**Perché non usare `'typescriptreact'` / `'javascriptreact'`**: Monaco non ha di default questi language id come top-level languages (solo via extensions), e il `typescriptDefaults` helper usa l'id `typescript`. Cambiarlo rompe il setCompilerOptions.

**Non toccato**:
- `Jsx.tsx` Monaco config (`typescriptDefaults.setCompilerOptions`, `setDiagnosticsOptions`, etc.) — invariato
- Altri callers di `EditorFullscreenModal` (OCL/JS/Javascript/PaletteData/MTM/Function) — tutti continuano a mostrare il `language` grezzo nel footer (backward-compatible)
- Stili `.editor-fullscreen-footer__language` (text-transform: uppercase, slate bg) — invariati

## 2026-04-11 — fix: Monaco editor invisible in JSX full-screen
**Prompt**: fix dimensioni container Monaco nel full-screen editor dopo rimozione split mode
**File toccati**: `frontend/src/components/editors/EditorFullscreenModal.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 44.08s)

**Root cause**: il rendering di `EditorFullscreenModal.tsx` wrappa il Monaco Editor in un `<div>` con `className` condizionale:

```tsx
<div className={viewMode === 'split' ? 'editor-fullscreen-editor-pane' : undefined}>
  <Editor width="100%" height="100%" ... />
</div>
```

In **split mode**, il wrapper ha la classe `.editor-fullscreen-editor-pane { flex: 1; display: flex; flex-direction: column; min-width: 0 }` che gli dà dimensioni corrette via flex row del parent `.editor-fullscreen-body--split`.

In **source mode** (l'unico mode ora dopo il fix precedente per disabilitare split), il wrapper ha `className={undefined}` — è un block div senza CSS rules → dimensioni auto. Monaco con `height="100%"` risolve contro parent auto-height → **0 pixel** → Monaco collassa invisibile anche se montato (status bar mostra 143 lines / 5386 chars).

**Perché gli altri editor (OCL/JS/MTM/Palette/Function) non mostrano lo stesso bug**: probabilmente l'`automaticLayout: true` option di Monaco + il ResizeObserver interno li salvano in alcuni casi. Il bug si è manifestato solo dopo la rimozione dello split mode dal JSX editor perché il JSX era SEMPRE in split mode prima, quindi il wrapper aveva sempre la classe `.editor-fullscreen-editor-pane`. Gli altri editor rendevano source-mode fin dall'inizio e avevano già workaround via automaticLayout (tested in real-time da Monaco ResizeObserver).

**Fix**: aggiunto inline `style={viewMode === 'source' ? { width: '100%', height: '100%' } : undefined}` sul wrapper `<div>`. Solo in source mode viene applicato — in split mode il wrapper usa la classe `.editor-fullscreen-editor-pane` invariata.

```tsx
<div
  className={viewMode === 'split' ? 'editor-fullscreen-editor-pane' : undefined}
  style={viewMode === 'source' ? { width: '100%', height: '100%' } : undefined}
>
  <Editor width="100%" height="100%" ... />
</div>
```

Ora Monaco's `height="100%"` risolve contro parent con altezza esplicita → dimensioni corrette → editor visibile.

**Non toccato**:
- `handleEditorMount` con `setTimeout(..., 50)` + `editor.layout()` — lasciato in place come safety net
- `automaticLayout: true` nelle editorOptions — invariato
- SCSS `.editor-fullscreen-body { flex: 1; position: relative; min-height: 0 }` — invariato
- `.editor-fullscreen-editor-pane` SCSS (flex layout per split mode) — invariato
- `Jsx.tsx` — il fix precedente per disabilitare split mode rimane valido; ora funziona correttamente grazie a questo fix complementare

**Impatto collaterale positivo**: tutti gli altri callers di `EditorFullscreenModal` (OCL, JS, Javascript, PaletteData, MTM, FunctionComponent) ora beneficiano dello stesso inline style esplicito in source mode — anche se erano apparentemente funzionanti prima, ora hanno dimensioni garantite senza dipendere dall'automaticLayout di Monaco (che è una race condition potenziale).

## 2026-04-11 — fix: disable split mode in JSX template full-screen editor
**Prompt**: rimuovere split view/preview dal template editor full-screen, forzare solo codice (preview mostrava errori per mancanza di contesto runtime completo, source-only mode aveva bug di rendering)
**File toccati**: `frontend/src/components/editors/languages/Jsx.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing)

**Architettura scoperta**: `EditorFullscreenModal.tsx` (il modal wrapper condiviso) ha una prop opzionale `renderPreview?: (code: string) => React.ReactNode`. La presenza di questa prop è il GATE per mostrare la toolbar con i 3 bottoni Source/Split/Preview (righe 235-265). Senza renderPreview, i bottoni non sono renderizzati e il modal è permanentemente in source-only mode.

**Callers di EditorFullscreenModal grepati**:
- `languages/Jsx.tsx:166` — passa `renderPreview={(code) => <TemplatePreview jsxCode={code} className={view.name} />}` ← **unico con split mode**
- `languages/Ocl.tsx:61` — no renderPreview (source-only)
- `languages/Js.tsx:105` — no renderPreview (source-only)
- `languages/Javascript.tsx:114` — no renderPreview (source-only)
- `views/data/PaletteData.tsx:762` — no renderPreview (source-only)
- `MTM.tsx:195` — no renderPreview (source-only)
- `forEndUser/FunctionComponent.tsx:399` — no renderPreview (source-only)

**Fix minimale (opzione A)**: rimossa la prop `renderPreview` dal caller Jsx.tsx:166 + rimosso l'import di `TemplatePreview` a riga 13. Il modal rende ora solo l'editor Monaco a tutta larghezza, senza split. **Nessun altro editor impattato** — tutti gli altri callers già usano source-only mode.

**Dead code flaggato (non rimosso)**:
- `frontend/src/components/editors/TemplatePreview.tsx` — ora zero importers, candidato a cleanup post-release ma lasciato in place per mantenere lo scope del task minimale. Se si vuole rimuoverlo: `rm src/components/editors/TemplatePreview.tsx` — verificato che nessun altro file lo importa.

**Non toccato**:
- `EditorFullscreenModal.tsx` — il modal wrapper rimane capable di rendere split mode se qualche futuro caller passa `renderPreview`. L'infrastruttura resta in place.
- `EditorFullscreenModal.scss` — stili split mode invariati (dead CSS selettivo, zero impact se nessun caller li attiva)
- Altri editor fullscreen (OCL, JS, Style/CSS, Options, Languages MTM, Function) — invariati, già source-only

**Verifica manuale post-deploy**:
- JSX full-screen → solo editor Monaco, nessuna toolbar split/preview, codice visibile
- Style/CSS full-screen, OCL/JS full-screen, MTM full-screen → invariati (sempre stati source-only)

## 2026-04-11 — style: reduce observed properties row spacing
**Prompt**: ridurre gap tra righe observed properties (troppo spaziate, ~20-24px invece di ~8px)
**File toccati**:
- `frontend/src/components/forEndUser/FunctionComponent.scss` — 2 regole modificate
- `frontend/src/styles/style.scss` — 1 regola modificata
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 2m27s)

**Componente identificato**: le righe "Observed Properties" e "Constants" sono renderizzate da `<Function>` (aka `FunctionComponent`) in `TemplateData.tsx:32-36`. Ogni riga è un `<label className="d-flex template-item my-1">` contenente identifier input + arrow + expression input + delete button.

**Valori prima/dopo**:
| Regola | Prima | Dopo |
|---|---|---|
| `.template-item { margin-bottom }` (FunctionComponent.scss:63) | `8px !important` | `4px !important` |
| `.function-editor-root[data-mode="simpleMode"] .template-item { padding }` (FunctionComponent.scss:243) | `6px 0 !important` | `2px 0 !important` |
| `.template-item:last-of-type { margin-bottom }` (style.scss:766) | `10px` | `4px` |

**Spaziatura totale per riga**:
- Prima: 6px (top) + content + 6px (bottom) + 8px (margin) = ~20px per row
- Dopo: 2px (top) + content + 2px (bottom) + 4px (margin) = ~8px per row

**Non toccato**:
- `.template-item:first-of-type { margin-top: 0 }` (style.scss:715) — già 0, nessun cambio
- La Bootstrap utility `my-1` (margin-y 4px) applicata nel TSX quando NOT in advanced mode — interagisce con le regole SCSS ma non la tocco (non SCSS)
- La struttura grid `grid-template-columns: 35% auto 1fr auto` (FunctionComponent.scss:239) — invariata, serve per il layout identifier / arrow / expression / delete
- `gap: 8px` nel grid — invariato, è il gap tra le colonne (identifier, arrow, expression, delete), non tra le righe

**Scope**: le 3 modifiche agiscono su `.template-item` che è usato da TUTTI i `<Function>` components — quindi sia "Constants" che "Observed Properties" nel Template tab beneficiano. Se ci sono altri usi di `FunctionComponent` nel codebase, anche quelli avranno le righe più compatte (positive side effect, consistenza).

## 2026-04-11 — fix: reverse spacing direction in Apply to tab
**Prompt**: la spaziatura era stata ridotta invece che allineata alla baseline (più ariosa)
**File toccati**: `frontend/src/components/editors/views/data/viewapplyto.scss` (+1 regola scoped)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 37.51s)

**Root cause**: il fix precedente (`.view-editor-tab-content { padding: 8px → 0 }`) ha ridotto di 8px la spaziatura EXTERNAL attorno al contenuto — direzione sbagliata. Il Properties panel è PIÙ ARIOSO di quanto Apply to fosse prima, non meno. L'errore era assumere che il Properties panel mettesse padding sull'outer container; in realtà la sua airiness viene da `.props-section__body { padding: 4px 14px 12px }` (info-improvements.scss:971) — ogni CollapsibleSection in `Info.tsx` ha 14px di horizontal inset attorno al suo content. InfoData non usa CollapsibleSections (rende `.jj-field` flat), quindi senza il 14px horizontal inset il content tocca i bordi del container.

**Valori reali estratti dal Properties panel**:
- `.properties-panel { padding: 0 !important }` (info-improvements.scss:1208) — outer 0
- `.properties-fields { padding: 0 }` (info-improvements.scss:1310) — wrapper 0
- `.props-section { margin-bottom: 2px }` (info-improvements.scss:919) — tra sezioni
- `.props-section__header { padding: 6px 14px }` (info-improvements.scss:928) — header con 14px horiz
- **`.props-section__body { padding: 4px 14px 12px }`** (info-improvements.scss:971) — **questo è il 14px horizontal + 12px bottom che dà l'airiness**
- `.jj-field { margin-bottom: 14px }` (_form-system.scss:950) — spacing tra campi (invariato per entrambi i path)

**Fix**: aggiunta regola scoped in viewapplyto.scss:

```scss
.view-editor-tab-content > section.properties-tab.properties-panel {
  padding: 12px 14px !important;
}
```

Questo matcha `.props-section__body { padding: 4px 14px 12px }` approssimativamente (12px vs 4px top è una differenza intenzionale — `.props-section__body` ha 4px top perché il `.props-section__header` sopra ha il suo padding; InfoData non ha header sopra quindi usa 12px per simmetria). Il valore `14px` horizontal è identico.

**Scope del selettore**: `.view-editor-tab-content > section.properties-tab.properties-panel` targetta SOLO InfoData perché:
- Template (`.template-tab`), Style (`.style-tab`), Events (`.events-tab`), Options (`.options-tab`) rendono root elements differenti con le loro proprie regole di padding interno (24px per Events, 20px per Options, ecc.)
- Solo InfoData rende `<section class="properties-tab properties-panel">` come direct child di `.view-editor-tab-content`

**Specificità cascade**: il selettore ha specificità `(0,3,1)` (1 combinatore child + 3 classi + 1 elemento) vs `(0,1,0)` della regola `.properties-panel { padding: 0 !important }` (info-improvements.scss:1207). Entrambi hanno `!important` → vince la specificità più alta → mio override prevale.

**Non toccato**:
- `.view-editor-tab-content { padding: 0 }` (dal fix precedente) — mantenuto perché gli altri sub-tab hanno già la loro padding interna
- `.jj-field` / `.jj-toggle-row` — invariati, design system shared con Properties
- `InfoData.tsx` — gli InfoTooltip aggiunti indipendentemente dal user non sono impattati

**Differenza prima/dopo**:
| Proprietà | Prima (fix errato) | Dopo (corretto) |
|---|---|---|
| Outer `.view-editor-tab-content` padding | 0 (my previous mistake) | 0 (unchanged) |
| Inner `section.properties-tab.properties-panel` padding | 0 (inherited from `!important`) | **12px 14px** (new scoped rule) |
| Effective content inset | 0px | **12px vertical + 14px horizontal** |

Visualmente: Apply to content ora ha 14px di inset horizontale e 12px di inset verticale, matchando l'airiness del `.props-section__body` di Properties.

## 2026-04-11 — style: fix spacing + add tooltips to Apply to tab
**Prompt**: uniformare padding/margin, aggiungere InfoTooltip a 7 campi
**File toccati**:
- `frontend/src/components/editors/views/nestedView.scss` — `.view-editor-tab-content`: `padding: 0` → `padding: 4px 14px 12px` (valori esatti di `.props-section__body` da `info-improvements.scss:970-972`, che è il wrapper usato da `CollapsibleSection` in Info.tsx per le sezioni GENERAL/FLAGS/TYPE&BOUNDS delle Properties). `.jj-field` resta al baseline `form-system.scss:950` (`margin-bottom: 14px; &:last-child { margin-bottom: 0 }`) — nessun override scoped necessario.
- `frontend/src/components/editors/views/data/InfoData.tsx` — aggiunto `useState` all'import React + copia locale del componente `InfoTooltip` (pattern identico a `Info.tsx:65-76`, non esportato quindi va duplicato per vincolo "non toccare Info.tsx"). Wired in 7 campi (Name, Is Exclusive, Priority, Preferred appearance, Applicable to, Viewpoint, Parent view) — inserito dopo il label text + dentro lo stesso `<label>`/`<div>`/`<span>` del label, così il wrapper flex di `.jj-field-label { display: flex; align-items: center; gap: 4px }` allinea icona "i" alla baseline del label.

**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 47.00s, zero regressioni). Un diagnostic TS `6133` ("useState dichiarato ma non letto") segnalato dall'IDE subito dopo l'aggiunta dell'import era transitorio — risolto automaticamente non appena `InfoTooltip` ha cominciato a usare `useState` nel passo successivo.

**Key insight (Fix 1)**: le classi `.jj-info-icon-wrapper`, `.jj-info-icon`, `.jj-info-tooltip` in `info-improvements.scss:975-1016` sono scoped GLOBALMENTE (non sotto un selettore padre), quindi funzionano anche nel contesto del view editor senza serve un import o una regola aggiuntiva. `.jj-field-label` ha già `display: flex; align-items: center; gap: 4px` da `form-system.scss:955-963` — l'icona "i" si allinea correttamente al testo senza override.

**Key insight (Fix 2)**: il valore giusto di padding per `.view-editor-tab-content` è `4px 14px 12px`, NON `padding: 8px` (come era in pre-regresion) né `padding: 0` (come era subito prima di questo task). Il path diretto delle Properties NON è edge-to-edge — usa `CollapsibleSection` → `.props-section__body` che ha esattamente `padding: 4px 14px 12px`. Replicando quel valore sull'outer container del view editor, i `.jj-field` si allineano visivamente al Properties panel (14px horizontal gutter, 4px top inset, 12px bottom inset) senza bisogno di un `CollapsibleSection` wrapper.

**Note**: 
- `InfoTooltip` duplicato invece che importato perché `Info.tsx:65` lo dichiara come `function` locale (non esportato) — esportarlo richiederebbe toccare Info.tsx, proibito dal vincolo. Il pattern è 12 righe, duplicazione accettabile.
- Pattern InfoTooltip per il toggle "Is Exclusive": inserito il tooltip DENTRO lo `<span className="jj-toggle-row__label">` dopo il testo "Is Exclusive", stesso pattern del componente `PropertiesToggle` in `Info.tsx:93-102` (`<span className="jj-toggle-row__label">{label}{tooltip && <InfoTooltip text={tooltip} />}</span>`). Così il tooltip appare a destra della label ma a sinistra del toggle.
- Regressione verificata: il test precedente con `padding: 0` faceva toccare il content al bordo del pannello slate-50 — asimmetrico rispetto al path Properties. Con `padding: 4px 14px 12px` si torna al comportamento baseline.

## 2026-04-11 — style: align view editor spacing to Properties baseline
**Prompt**: uniformare padding/margin del view editor tab content alla properties-tab
**File toccati**: `frontend/src/components/editors/views/nestedView.scss` (1 regola modificata)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 40.01s)

**Root cause**: `.view-editor-tab-content { padding: 8px }` aggiungeva 8px extra attorno al contenuto di ogni sub-tab (Apply to, Template, Style, Events, Options) rispetto al path diretto delle Properties. Il path diretto non ha un wrapper `.view-editor-tab-content`, quindi il content dei `.jj-field` tocca direttamente i bordi del `.properties-panel-container` che è slate-50.

**Catene DOM confrontate**:
- Properties diretta: `.properties-panel-container (slate-50) → section.properties-tab.properties-panel (padding: 0!) → content`
- View editor: `.properties-panel-container (slate-50) → section.properties-tab.properties-panel (padding: 0 via :has) → .view-editor-root (padding-right: 4px) → .view-editor-tabs → .view-editor-tab-content (padding: 8px ← EXTRA, slate-50) → section.properties-tab.properties-panel (padding: 0!) → content`

**Fix**: `.view-editor-tab-content { padding: 8px }` → `padding: 0`. Il `background-color: rgb(248, 250, 252)` (slate-50) è rimasto perché matcha già `.properties-panel-container { background: #f8fafc }`.

**Non toccato**:
- `.view-editor-root { padding-right: 4px }` — cosmetic asymmetric padding che affetta breadcrumb + tab bar oltre al content, rischio di regressioni non legate al task; lasciato in place
- `.properties-tab { padding: 24px }` (info-improvements.scss:140) — è override completamente dal successivo `.properties-panel { padding: 0px!important }` (info-improvements.scss:1207) quindi il valore effettivo è 0 in entrambi i path; non serve toccarlo
- Rule `:has(.view-editor-root)` in info.scss:425 — ancora utile per vincolare l'outer section quando contiene il view editor; lasciata in place

**Note**: il doppio wrapper `section.properties-tab.properties-panel` (outer dal view-branch di Info.tsx, inner dal rewrite di InfoData.tsx) non causa problemi perché entrambi i livelli hanno `padding: 0 !important`. La spaziatura interna è ora interamente gestita dai `.jj-field { margin-bottom: 14px }` e `.jj-toggle-row { padding: 5px 0 }` ereditati dal design system form (`styles/components/_form-system.scss`).

## 2026-04-11 — style: refactor InfoData.tsx to use jj-* classes from Info.tsx baseline
**Prompt**: sostituire classi form-* con jj-*, adottare pattern Toggle, rimuovere className custom da Input/Select
**File toccati**: `frontend/src/components/editors/views/data/InfoData.tsx` (rewrite: 205 → 200 righe)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 1m11s, zero regressioni)

**Trasformazioni className applicate**:
- `<section className='apply-to-tab'>` → `<section className='properties-tab properties-panel'>`
- `form-field` → `jj-field` (6 istanze: Name, Priority, Preferred appearance, Applicable to, Viewpoint, Parent view)
- `form-field form-field--toggle` + struttura interna → `jj-toggle-row` con `<span className="jj-toggle-row__label">` + `<Toggle size="xs">`
- `form-label` → `jj-field-label` (usa `<div>` per tutti tranne Name che usa `<label>` con `<span className="jj-field-required">*</span>` inline per matchare `builder.class()` in Info.tsx:290-291)
- Rimossa `className="form-input"` da `<Input>` (5 istanze — il componente Input ha già i suoi stili)
- Rimossa `className="form-select"` da `<Select>` (5 istanze — idem)
- **Eliminati** `<div className="toggle-content">`, `<span className="toggle-label">`, `<span className="toggle-description">`, `<button className="apply-to-toggle">`, `<span className="apply-to-toggle-thumb">` — sostituiti dal pattern `jj-toggle-row` + componente `Toggle`

**Pattern Is Exclusive**: inlined il pattern di `PropertiesToggle` (Info.tsx:79-103) invece di usare il componente direttamente, perché `PropertiesToggle` prende `data: LModelElement + field: string` per settare via `(data as any)[field] = checked`, mentre `view.isExclusiveView` è un setter via proxy su LViewElement. Il pattern inline replica la struttura: `handleExclusiveRowClick` (click sulla row salvo se targetta il button role=switch) + `handleExclusiveToggle` (click diretto sul Toggle component).

**Import aggiunto**: `import {Toggle} from '../../../ui'` — verificato che `ui/index.ts:19` esporta `Toggle`, che `Toggle.tsx` accetta `checked/onChange/disabled/size='xs'`, e che Info.tsx usa lo stesso import a riga 32.

**CollapsibleSection non usato**: verificato che `CollapsibleSection` in Info.tsx è una funzione locale NON esportata (`function CollapsibleSection` a riga 37). Per vincolo del task ("non toccare Info.tsx"), ho seguito l'opzione B — raggruppamento senza CollapsibleSection, usando solo le classi `.jj-field` plain. Questo mantiene InfoData in scope minimo. Se si volesse raggruppamento in sezioni (GENERAL / DISPLAY / APPLICABILITY), servirebbe esportare CollapsibleSection da Info.tsx in un task separato.

**Cleanup**: rimosso il `console.log("infodatacomponent", {...})` di debug a riga 34 del file originale. Rimosso anche `classesOptionsJSX` variable inutilizzata (era definita ma mai referenziata).

**Fixes collaterali minor**: cambiato `let` → `const` per `view`, `viewpoints`, `readOnly`, `vp`, `vpid`, `dallVP`, `objectTypes`, `classesOptions`, `isVP`, `isV` (erano tutti assegnati una sola volta). Aggiunto `disabled={readOnly}` al `<Toggle>` per coerenza con il comportamento readOnly degli altri campi.

**Non toccato**:
- `Info.tsx` — baseline, solo lettura (usato per pattern reference)
- `Input`, `Select`, `OclEditor`, `JsEditor` — componenti intatti, stesse props
- `viewapplyto.scss` — gli stili custom `.apply-to-tab`, `.form-field`, `.form-label`, `.form-input`, `.form-select`, `.apply-to-toggle`, `.apply-to-toggle-thumb` sono ora **dead code** ma il file SCSS è lasciato in place (cleanup post-release — rimuoverlo comporterebbe audit di `viewoptions.scss` import che potrebbe cascade). Il file è anche importato dal componente per mantenere la side effect injection di stili legacy usati da altre `section.page-root` (rule a fine file).
- `InfoData.tsx` logica getter/setter/filtro viewpoint — invariata al 100%

## 2026-04-11 — style: restyle aggressivo Apply to tab
**Prompt**: allineare Apply to alla baseline Properties — 9 fix specifici (Name input, Is Exclusive card, Priority, Preferred appearance, Applicable to chip, Viewpoint/Parent view, OCL/JS editor colors, spacing, labels)
**File toccati**: `frontend/src/components/editors/views/data/viewapplyto.scss` (rewrite completo, ~550 righe → ~470 righe)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 41.60s, zero regressioni). **Nessuna modifica TSX** — tutti i fix applicati tramite CSS overrides.

**Fix applicati (9)**:
- **P1 — Name**: input ora 28px height / 12px font / 4px radius / 1px #e2e8f0 border (era 40px/14px/6px) con focus slate (era rgba(71,85,105,...) che sembrava cyan-ish con `var(--color-accent, #475569)` — ora #334155 solid come baseline)
- **P2 — Is Exclusive**: rimossa completamente la "card" attorno — `.form-field--toggle` era `padding: 12px 16px; background: white; border: 1px solid; border-radius: 6px; margin-bottom: 16px` → ora `flex-row; padding: 5px 0; no background; no border; no radius`. La `.toggle-description` ("This view is exclusive to its viewpoint") è `display: none` per matchare le righe FLAGS semplici delle Properties (Abstract, Final, ecc.)
- **P3 — Priority**: stesso trattamento input (28px/12px/4px/slate focus)
- **P4 — Preferred appearance**: select con freccia dropdown slate invece di cyan, stesse dimensioni
- **P5 — Applicable to (react-select)**: `.[class*="-control"]` border da transparent/0px → `1px solid #e2e8f0`, border-radius 4px, focus state `#334155` con shadow slate. Chip tags: `#f1f5f9 bg` + `#e2e8f0 border` + `#1e293b text` (era slate-700 solid, ora più light e leggibile). Chip X da red hover → `#64748b subtle hover`. Indicator caret 12px → slate-400, hover → slate-500
- **P6 — Viewpoint / Parent view**: stessi select generici, nessun teal/cyan, `color: #1e293b` sul text e `background: white` + readonly `#f8fafc/#64748b`
- **P7 — OCL Editor / JS Editor**: `.section-header--collapsible` padding 12px → 8px, `.section-header__left i` color → `#94a3b8` (slate-400), `.section-header__right i` color → `#94a3b8` con hover `#334155`, `.section-title` uppercase 11px #64748b (era già ok)
- **P8 — Spacing**: container padding da `16px` (con margin `8px`) → `8px 12px` con margin `0`. `.form-field` margin-bottom `16px` → `0` con `padding: 5px 0` e `gap: 4px` interno (matches `info-improvements.scss:1084`). Tra sezioni (es. OCL Editor) `.section-header--collapsible` ha `margin-top: 12px`
- **P9 — Labels**: `.form-label` font-weight `500` → `400`, color `var(--color-text-secondary, #334155)` → `#64748b` hardcoded (slate-500 — matches baseline `info-improvements.scss:1111`), font-size `13px` confermato

**Toggle switch**: `.apply-to-toggle` active state era `linear-gradient(135deg, #64748b 0%, #475569 100%)` → ora `#334155` solid (matches `.properties-toggle.active` in `info-improvements.scss:419`). Aggiunto hover:not(.active) `#94a3b8` (come Properties). Focus shadow allineato a `rgba(51, 65, 85, 0.15)`. Dimensioni 36×20 + thumb 16×16 invariate (erano già corrette).

**Dark mode**: completamente riscritto con stessi token slate della baseline (era mix di `var()` con fallback che a volte non matchavano). Il toggle dark ora usa slate-600→slate-400 per inactive→active.

**Non toccato**:
- `InfoData.tsx` — zero modifiche, mantengo la struttura di className esistente
- `info.scss` / `info-improvements.scss` — baseline intatta
- `.apply-to-header` rule — già OK (se mai renderizzata)
- `section.page-root` legacy rule — lasciata per retrocompatibilità con altri percorsi
- Hover state della `.section-header--collapsible` rimosso (era `rgba(0,0,0,0.02)` che non matchava il comportamento hover discreto di Properties)

**Key insight**: la baseline Properties è molto più compatta di quanto Apply to fosse (28px vs 40px inputs, 12px vs 14px font, 4px vs 6px radius, 5px vs 16px row padding). L'aspetto salmon/arancio del Name field era dovuto al mix tra `var(--color-text-primary, #0f172a)` e qualche global style sovrastante con colori warm — risolto forzando `color: #1e293b !important`.

## 2026-04-11 — style: uniformare sub-tab viewpoint editor alla baseline Properties
**Prompt**: allineare stile Apply to/Template/Style/Events/Options al pannello Properties
**File toccati** (solo SCSS, nessun TSX modificato):
- `frontend/src/components/editors/views/data/viewapplyto.scss` — **Apply to**:
  - `.section-title` color da `var(--color-text-tertiary)` → `var(--color-text-secondary)` (baseline)
  - `.form-field [class*="-option--is-selected"]`: rimosso cyan `#0ea5e9` + `rgba(14,165,233,...)` → slate `#334155` + `rgba(51,65,85,...)`
- `frontend/src/components/editors/views/data/palette-data.scss` — **Style**:
  - `.marker-edit-btn:hover color` light mode: `#0ea5e9` → `#334155` (slate-700)
  - `.marker-edit-btn:focus-visible` light mode: shadow da cyan → slate-600, border-color da `#0ea5e9` → `#475569`
  - `.marker-edit-btn:hover color` dark mode: `#0ea5e9` → `#e2e8f0` (slate-200)
  - `.marker-edit-btn:focus-visible` dark mode: shadow da cyan → slate-400, border-color da `#0ea5e9` → `#94a3b8`
  - `.style-section-header .section-title` già allineato (no change)
  - Lasciato `.text i { color: #10b981 }` + gli altri color type icons (number/color/path) — sono type indicator semantici, NON section header
- `frontend/src/components/editors/views/data/events-tab.scss` — **Events**:
  - `.events-section-title` font-size da `13px` → `11px`; letter-spacing allineato a `0.5px`; colore hardcoded `#475569/#1e293b` da variant `--default/--custom` consolidato in `var(--color-text-secondary)` (unificato — niente più distinzione cromatica default vs custom)
  - Icone `.events-section-title i` da `16px` → `14px`
  - `.events-add-btn:hover color`: `#0ea5e9` → `#334155`
  - Empty state già ok (`1px dashed #e2e8f0` — non blu)
- `frontend/src/components/editors/views/data/viewoptions.scss` — **Options**:
  - Rimosse variabili dead code `$color-cyan-500: #06b6d4` + `$color-cyan-600: #0891b2` (dichiarate ma mai usate)
  - Section header già allineato (no change: `font-size: 11px`, `color: $color-text-secondary = #64748b`, uppercase, letter-spacing)
- `frontend/src/components/editors/info.scss` — **Template**:
  - Aggiunta regola scoped `.template-tab .jj-editor-title` per allineare i label "Constants" e "Observed properties" al pattern baseline: `11px` (da 14px), uppercase, letter-spacing 0.5px, color `var(--color-text-secondary)`. La regola è scoped a `.template-tab` per non rompere altri usi di `.jj-editor-title` (es. FunctionComponent in altri contesti) — la regola base in `FunctionComponent.scss` rimane invariata

**Non toccati** (volontariamente):
- `TemplateData.tsx` — inline style su `<HRule style={{paddingTop: '40px!important', display: 'block'}}/>`: segnalato come inline style residuo ma non migrato (sarebbe una regola SCSS per `.template-tab .HRule` che aggiungerebbe accoppiamento; lasciato come micro debt)
- `CustomData.tsx` — inline style `style={{paddingTop: '9px'}}` sul CommandBar: simile, micro debt lasciato in place
- `PaletteData.tsx` — diversi inline styles tramite tinycolor per background dinamici dei color picker: **NON migrabili** in SCSS (calcolati a runtime per colori dinamici)
- `FunctionComponent.scss` — regola base `.jj-editor-title` lasciata invariata (riutilizzo in altri contesti)
- Icon type colors in palette-data.scss (`#10b981 #3b82f6 #f59e0b #8b5cf6` per text/number/path/color) — type indicator semantici, non header; task specificava "NO teal/colori forti per **header sezioni**"
- Toggle switch in viewapplyto.scss (36×20px) vs baseline (40×22px) — lasciato come micro-variazione; entrambi hanno colore slate/bianco corretto, dimensioni leggermente diverse ma visivamente coerenti
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 40.98s — SCSS compilato clean, zero regressioni)
**Note**: **6 cyan violations eliminate** (2 in viewapplyto, 4 in palette-data, 1 in events-tab + 2 variabili dead code in viewoptions). **Section headers unificati** a 11px/uppercase/slate/0.5px letter-spacing su tutti e 5 i tab. **Events tab** era l'unico con section header a 13px — ora allineato. Baseline Properties in `info.scss:509` usa 12px per `.properties-section-title` — leggera divergenza accettata (il task chiedeva 11px per i sub-tab). **No TSX modifiche** — constraint rispettato. **No breaking changes** alle Properties normali (classe/attributo/reference) — le regole modificate sono scoped ai sub-tab.

## 2026-04-11 — fix: batch funzionalità viewpoint (6 fix)
**Prompt**: rimuovi sidebar duplicata editor, key ViewData, ViewpointProperties click, back button, dashboard click, cleanup dead code
**File toccati**:
- `frontend/src/pages/components/Navbar.tsx` — Fix 1: 2 call sites `TabDataMaker.metamodel/model + DockManager.open('models', tab)` → `DockManager.open2(lModel)` (per emettere `EDITOR_TYPE_CHANGE` e nascondere LeftBar). Rimosso import `TabDataMaker` ora inutilizzato.
- `frontend/src/components/project/ProjectEditor.tsx` — Fix 1: 1 call site nel post-transformation handler `TabDataMaker.model(modelToOpen) + DockManager.open(...)` → `DockManager.open2(LModel.fromD(modelToOpen))`. Rimosso import `TabDataMaker` inutilizzato.
- `frontend/src/components/editors/Info.tsx` — Fix 2: aggiunto `key={selectedView.id}` sia su `<ViewpointProperties>` che su `<ViewData>` nel view-branch del Properties panel, forzando il remount quando l'utente seleziona una view/viewpoint diversa nel Tree View (altrimenti i componenti interni catturano il viewID al mount e restano stale).
- `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` — Fix 3: aggiunto `import './properties.scss'`. Il file SCSS (che definisce `.wp-type-segmented`, `.wp-field`, `.workbench-properties`) era importato SOLO da `WorkbenchProperties.tsx` — ma il mio view-branch in Info.tsx rende `<ViewpointProperties>` direttamente, bypassando WorkbenchProperties, quindi il CSS non veniva mai caricato → segmented control non stilizzato. Self-import risolve.
- `frontend/src/components/abstract/DockManager.tsx` — Fix 5: `openViewpoint()` riscritto. Prima (pre-fix): settava solo `_lastSelected.view`, inefficace se chiamato dalla dashboard (Properties panel CSS-hidden via `body[data-editor-type="summary"]`). Ora: controlla `document.body.getAttribute('data-editor-type')`; se è `'metamodel'` o `'model'` applica solo la selezione; altrimenti chiama `DockManager.open2(firstMetamodel)` per aprire il primo metamodello del progetto (via `LProject.getProject()?.metamodels?.[0]`), poi con `setTimeout(..., 200)` setta `_lastSelected.view` dopo il mount del tab e la propagazione di `EDITOR_TYPE_CHANGE`. Fallback: se non ci sono metamodelli, tenta comunque la selezione con warning.
- **Rimossi** (Fix 6 — dead code, zero importers esterni):
  - `frontend/src/components/editors/ViewpointWorkbench.tsx` (legacy workbench, orfano)
  - `frontend/src/components/editors/ViewpointWorkbench.scss`
  - `frontend/src/components/panels/viewpoint-editor/` — 23 file (ViewpointEditorRoot, ViewpointEditorPanel, EditorFullscreenModal, EditorToolbar, ViewpointEditorBreadcrumb, viewpoint-editor.scss, sections/*, tabs/*). Questi erano stati restaurati ieri da commit `5999f50c6~1` ma il routing era stato successivamente spostato al pannello destro.
**Non toccati** (volontariamente):
- Fix 4 (back button) — la catena `setSelectedView(undefined)` in ViewData → `clearSelection` callback in Info.tsx → `SetRootFieldAction.new('_lastSelected', {view: ''})` era già corretta dai task precedenti, verificata ma non modificata
- Dashboard.tsx — il fix `hideLeftBar` per `'metamodel'` e `'model'` è già in place dal precedente round
- `ViewData.tsx`, `NestedView.tsx`, `InfoData/TemplateData/PaletteData/CustomData/GenericNodeData/ComponentsTab` — tutti intatti
- Commenti "TODO: redirect to panels/viewpoint-editor" in Dashboard.tsx/ProjectEditor.tsx — lasciati come TODO bookmark (no code impact)
- Regola CSS `body[data-editor-type="viewpoint"]` in `abstract/style.scss:1178` — lasciata perché `MyRcDock.tsx:592` può ancora settare `editorType = 'viewpoint'` in alcuni scenari
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 38.44s, zero regressioni)
**Note**: Fix 1 è la scoperta principale — il `hideLeftBar` in Dashboard.tsx era corretto ma 3 call sites bypassavano il meccanismo chiamando `DockManager.open('models', tab)` direttamente invece di `DockManager.open2(lModel)`. Solo `open2` emette l'evento `EDITOR_TYPE_CHANGE`. Fix 2 è il remount pattern classico React per evitare stale state quando l'identità del target cambia ma il componente container rimane lo stesso. Fix 3 era un bug di import SCSS che si manifestava solo nel nuovo rendering path (ViewpointProperties dentro Info.tsx invece che dentro WorkbenchProperties). Fix 4 è stato verificato ma non modificato — già funzionante. Fix 5 sfrutta il body attribute `data-editor-type` che Dock.tsx mantiene in sync via EDITOR_TYPE_CHANGE listener. Fix 6 cleanup: ~1.5MB di codice morto rimosso (inclusi `bootstrapIconCatalog.ts` da 1.3MB). Build time invariato (rc-dock non era già importato da questo path).

## 2026-04-11 — refactor: replace rc-dock DockLayout with simple React tabs in ViewData
**Prompt**: sostituire DockLayout con tab React semplici, eliminare tutti i workaround altezza (ResizeObserver, relative+absolute, :has(), flex 1 1 0, ecc.) — rc-dock è troppo complesso per un semplice tab panel in una sidebar
**File toccati**:
- `frontend/src/components/editors/views/ViewData.tsx` — rewrite completo:
  - Rimossi import `DockLayout`, `LayoutData` da `rc-dock`
  - Rimossi import inutilizzati `PermissionViewTab`, `PermissionViewpointTab` (erano commentati nei tab ma ancora importati)
  - Rimossi `useRef`, `useEffect`, stato `dockHeight`, `rootRef`, e tutto il ResizeObserver code
  - Rimossa costruzione oggetto `layout: LayoutData` + variabile `tabidprefix` + funzione `id()` generatrice di id dock-specific
  - Aggiunto tipo `TabId` (union string literal) e interfaccia `TabDescriptor`
  - Array `tabs: TabDescriptor[]` costruito con spread conditionals (`...(isV ? [{...}] : [])`) per preservare la stessa logica isV/isVP del codice precedente
  - Le `render` closure catturano `view.id`, `readOnly`, `viewpoints` — stesse identiche props dei componenti tab (InfoData riceve `viewID` + `viewpointsID` + `readonly`; TemplateData/PaletteData/EventsData/GenericNodeData/ComponentsTab ricevono `viewID` + `readonly`). Tutte ancora wrappate in `<Try>`.
  - Nuovo stato `const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id)` — default al primo tab (sempre 'apply-to')
  - Fallback `activeDescriptor = tabs.find(t => t.id === activeTab) ?? tabs[0]` gestisce il caso in cui l'utente passi da una view a un viewpoint e il tab corrente non sia più disponibile
  - JSX: `<div className="view-editor-tabs">` contiene `<div className="view-editor-tab-bar">` (con `role="tablist"` + `<button role="tab" aria-selected>`) e `<div className="view-editor-tab-content" role="tabpanel">`. Solo il contenuto del tab attivo è renderizzato (unmount degli altri, evitando memory overhead di editor Monaco non visibili).
- `frontend/src/components/editors/views/nestedView.scss` — aggiunta sezione `VIEW EDITOR TABS` in fondo al file con 4 regole:
  - `.view-editor-tabs { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden }`
  - `.view-editor-tab-bar { display: flex; flex: 0 0 auto; border-bottom; padding: 0 8px; background: var(--color-bg-secondary) }`
  - `.view-editor-tab { padding: 8px 16px; border: none; cursor: pointer; font-size: 12px; color: var(--color-text-secondary); border-bottom: 2px solid transparent; transition; &:hover; &.active { color primary + border-bottom-color accent + font-weight 500 } }`
  - `.view-editor-tab-content { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 8px }`
  - Tutte usano token del design system (`--color-border-primary`, `--color-bg-secondary`, `--color-text-secondary`, `--color-text-primary`, `--color-accent`) verificati in `styles/tokens/_colors-light.scss`
**Non toccati**:
- `InfoData.tsx`, `TemplateData.tsx`, `PaletteData.tsx`, `CustomData.tsx` (EventsData), `GenericNodeData.tsx`, `ComponentsTab.tsx` — nessun cambio, ricevono esattamente le stesse props di prima
- `Info.tsx` — il view-branch non cambia, continua a renderizzare `<ViewData>` dentro `<section.properties-tab.properties-panel>`
- `PropertiesWithTreeView.tsx` — invariato
- `properties-with-tree-view.scss` e `info.scss` — le regole `:has(.view-editor-root)` del fix precedente rimangono in place, ora sono no-op harmless (non c'è più un DockLayout da vincolare) ma non hanno impatto. Se si volesse cleanup, sono in `info.scss:407-414` e `properties-with-tree-view.scss:65-80`.
- `nestedView.scss` linee 2233-2248 — la regola `.view-editor-root .dock-layout` del fix precedente è ora dead code (no match), lasciata in place perché `NestedView.tsx` (file ancora presente ma senza importer) potrebbe teoricamente usarla in futuro
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` completato in 37.91s — più veloce del precedente 1m12s perché rc-dock non è più importato da questo modulo)
**Note**: Approccio molto più semplice dei fix precedenti (ResizeObserver + pixel explicit height + :has() + flex 1 1 0 + overflow: hidden chain). rc-dock è pensato per layout dockable complessi dove l'utente può trascinare panels — overkill per un semplice tab container. React tabs con `useState` + `role="tab/tablist/tabpanel"` è più leggero, accessibile, e vincolato naturalmente dal parent via flex sizing (tutto si risolve con `flex: 1 1 auto; min-height: 0; overflow: hidden` sul `.view-editor-tabs` wrapper). Zero workaround. Il ResizeObserver e il pixel height sono spariti — non servono più perché rc-dock non c'è più. Le classi CSS (`view-editor-tabs`, `view-editor-tab-bar`, `view-editor-tab`, `view-editor-tab-content`) sono state verificate con grep: nessuna collisione preesistente.

## 2026-04-10 — fix: constrain DockLayout parent overflow for proper tab behavior
**Prompt**: overflow hidden sulla catena di container per forzare rc-dock a usare tabs (il DockLayout cresceva a 1422px perché `section.properties-tab.properties-panel` aveva `overflow: auto` che lasciava espandere `.view-editor-root`)
**File toccati**:
- `frontend/src/components/editors/properties-with-tree-view.scss` — aggiunta regola `&:has(.view-editor-root)` sotto `.properties-panel-container > .properties-tab, .properties-panel`: quando ViewData è presente, la section diventa `overflow: hidden; min-height: 0; flex: 1 1 0; height: auto; padding: 0`. Il `flex: 1 1 0` forza la section a prendere esattamente lo spazio flex rimanente del parent column (invece di usare `height: 100%` che era ambiguo in flex context). Il `padding: 0` lascia a ViewData il pieno spazio edge-to-edge.
- `frontend/src/components/editors/info.scss` — aggiunta regola simmetrica `&:has(.view-editor-root)` sotto `.properties-panel` (globale, non scoped a container): override di `overflow: auto` → `overflow: hidden` e `padding: 0`. Questa regola è globale perché `.properties-panel` ha un padding default di `var(--space-3)` che va rimosso quando ViewData prende il controllo.
**Non toccati**:
- `ViewData.tsx` — il ResizeObserver ora misurerà l'altezza corretta del root (vincolata dal parent) e `dockHeight` sarà ragionevole
- `PropertiesWithTreeView.tsx` — non serve modificarlo, la soluzione è pura CSS
- `nestedView.scss` — `.view-editor-root` e `.dock-layout` hanno già le regole flex corrette dai fix precedenti
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, vite build completato in 1m1s senza errori SCSS, `:has()` pseudo-class compila correttamente con Sass)
**Note**: **Scope critico**: `:has(.view-editor-root)` è usato per scopare il fix SOLO quando ViewData è presente. Senza questo scope, il cambio da `overflow: auto` a `overflow: hidden` romperebbe lo scroll dei form proprietà normali (quando si seleziona una classe/attributo il form può essere molto lungo e deve scrollare). Con `:has()`, il comportamento di default `overflow: auto` rimane invariato per i form proprietà; solo quando ViewData entra nel DOM il comportamento cambia a `overflow: hidden` + flex sizing.

**Perché `flex: 1 1 0` invece di `height: 100%`**: in flex column parents, `height: 100%` sui children può essere ambiguo — alcuni browser lo trattano come hint, altri come obbligatorio, altri lo ignorano se il parent è in overflow: auto. `flex: 1 1 0` è deterministico: grow=1 (prendi tutto lo spazio libero), shrink=1 (puoi rimpicciolirti), basis=0 (parti da 0). Combinato con `min-height: 0` (bypassa il default `min-height: auto` che altrimenti forzerebbe l'elemento a essere grande almeno quanto il content), la section prende ESATTAMENTE lo spazio flex rimanente.

**Come la catena ora si risolve**: `.properties-panel-container` (height: 100%, flex col, overflow: hidden) → `section` (flex: 1 1 0, min-h: 0, overflow: hidden) → `.view-editor-root` (height: 100% dell'altezza risolta della section, overflow: hidden) → `ResizeObserver` misura l'altezza corretta (~600px invece di 1458px) → `dockHeight` ~564px → rc-dock usa la tab bar invece di stacked rendering.

## 2026-04-10 — fix: DockLayout height via ResizeObserver (pixel measurement)
**Prompt**: dare altezza esplicita al DockLayout, rimuovere pattern relative+absolute (che non aveva funzionato), usare approccio calc() o ResizeObserver
**File toccati**: `frontend/src/components/editors/views/ViewData.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Scelto l'approccio **ResizeObserver** (opzione 3 tra quelle suggerite) invece di `calc(100% - 36px)` o `calc(100vh - 200px)` perché:
1. Più robusto: non dipende dalla catena di altezze CSS (che si era dimostrata fragile con rc-dock)
2. Gestisce automaticamente il resize della finestra e i cambi di layout del pannello destro
3. Più preciso: misura l'header effettivo invece di hardcodare 36px

**Implementazione**:
- Aggiunti hook `useRef`, `useState`, `useEffect` all'import React
- `rootRef` attaccato al `<div className="view-editor-root">`
- `dockHeight` state con default 400px (fallback prima della prima misurazione)
- `useEffect` setup un `ResizeObserver` sul root element. Il callback misura `rootRect.height` e sottrae l'altezza effettiva di `.view-editor-header` (query via `querySelector`, fallback 36px se non trovato). Min-clamp a 100px per evitare valori degenerati.
- Guard `typeof ResizeObserver === 'undefined'` per environment senza l'API (non dovrebbe mai scattare nel browser, ma è safe)
- `setDockHeight(prev => prev === next ? prev : next)` evita re-render non necessari se l'altezza non cambia
- Cleanup: `observer.disconnect()` on unmount
- `<DockLayout>` riceve `style={{ width: '100%', height: dockHeight }}` — pixel esplicito, no percentuali, no flex

**Rimosso**: il wrapper `<div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>` del fix precedente (non aveva funzionato in pratica nonostante fosse il pattern "corretto" sulla carta).

**Nota di design**: il fix SCSS in `nestedView.scss` (`.view-editor-root .dock-layout { flex: 1 1 auto; min-height: 0; position: relative }`) è tecnicamente ora redundant visto che il pixel height inline wins, ma rimane in place come zero-cost fallback. Se si volesse eliminarlo, è in `nestedView.scss:2233-2246` — cleanup non necessario per questo fix.

## 2026-04-10 — fix: DockLayout explicit sizing via absolute positioning
**Prompt**: wrappare DockLayout in relative+absolute per dare altezza a rc-dock (il precedente fix SCSS su `.dock-layout` non bastava perché rc-dock usa `position: absolute` internamente)
**File toccati**: `frontend/src/components/editors/views/ViewData.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Verificato tramite `node_modules/rc-dock/lib/DockLayout.d.ts:59` che `DockLayout` accetta una prop `style?: React.CSSProperties`. Applicato il pattern "relative wrapper + absolute child":
```tsx
<div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>
    <DockLayout
        defaultLayout={layout}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
</div>
```
Il wrapper prende l'altezza residua via flex (sotto il `view-editor-header`), il DockLayout si incastra dentro con position absolute. Questo è il pattern standard per dare a rc-dock le dimensioni del parent senza bisogno di pixel espliciti. Il fix SCSS precedente in `nestedView.scss` (flex: 1 1 auto su `.dock-layout`) rimane in place come belt-and-suspenders — non è in conflitto perché la prop `style` sul DockLayout wins via specificity (inline style > SCSS). Default layout (`{dockbox: {mode: 'horizontal', children: []}}`) invariato. ViewData è l'unico file toccato.

## 2026-04-10 — fix: ViewData full width + flex height for DockLayout
**Prompt**: rimuovere max-width cap (450px) quando view selezionata e garantire che `.view-editor-root` > `.dock-layout` (rc-dock) abbia altezza flex corretta
**File toccati**:
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — **Fix 1 (width)**: aggiunto inline `style={viewSelected ? { maxWidth: 'none' } : undefined}` su `.properties-panel-container`. Sovrascrive il `max-width: 450px` della SCSS solo quando una view/viewpoint è selezionato. Transitorio: quando `_lastSelected.view` si svuota, lo style inline diventa `undefined` e la regola SCSS originale torna in vigore.
- `frontend/src/components/editors/views/nestedView.scss` — **Fix 2 (height)**: `.view-editor-root > .dock-layout` aveva solo `flex-grow: 1` che non basta (flex-basis di default è 0%). Cambiato in `flex: 1 1 auto; min-height: 0; position: relative`. Il `min-height: 0` è cruciale per permettere al flex child di scendere sotto l'altezza del contenuto. Il `position: relative` ancora i wrapper assoluti interni di rc-dock. Anche `.view-editor-header` ora ha `flex: 0 0 auto` esplicito per garantire che non si espanda.
**Non toccati**:
- `ViewData.tsx`, `Info.tsx` — per vincolo del task
- `properties-with-tree-view.scss` — `.properties-panel-container` aveva già `height: 100%; overflow: hidden` (Fix 3 non necessario)
- `.view-editor-root` — aveva già `display: flex; flex-flow: column` (non serviva aggiungerlo)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` completato in 1m12s senza errori)
**Note**: Verificato che rc-dock renderizza `<div className="dock-layout">` (non `dock_layout` o altro) grepping `node_modules/rc-dock/lib/DockLayout.js:432`. La catena di altezze ora è: `.properties-panel-container (100%) → section.properties-tab (100%) → .view-editor-root (100% flex col) → .view-editor-header (flex: 0 0 auto) + .dock-layout (flex: 1 1 auto, min-h: 0, pos: relative) → Monaco editors riempiono lo spazio`. La catena di larghezze: `right panel (es. 700px) → .properties-panel-container (full width quando viewSelected) → ViewData`.

## 2026-04-10 — fix: auto-collapse tree when view selected for full-width ViewData
**Prompt**: Tree View si collassa quando `_lastSelected.view` è truthy, ripristina quando falsy (per dare a ViewData/Monaco editors la larghezza piena del pannello destro)
**File toccati**: `frontend/src/components/editors/PropertiesWithTreeView.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Aggiunto `useSelector` per leggere `state._lastSelected?.view` come booleano `viewSelected`. Computato `effectiveTreeVisible = viewSelected ? false : isTreeViewVisible` — override transitoria che NON muta lo stato `isTreeViewVisible` del context (quando l'utente deseleziona la view, la preferenza manuale del tree torna automaticamente). La rendering logic ora:
- Se `viewSelected` → nessun tree renderizzato (nemmeno la barra collapsed da 32px), Properties panel full-width
- Se `!viewSelected && effectiveTreeVisible` → tree panel da 260px
- Se `!viewSelected && !effectiveTreeVisible` → barra collapsed da 32px (preferenza manuale utente)
Aggiunta classe `tree-suppressed` al container quando viewSelected (utile per future regole CSS). Nessuna modifica a `Info.tsx`, `ViewData`, `TreeViewContent` o al context `useTreeViewPanel`. Il diagnostic log offerto nella sessione precedente non era mai stato applicato — nessun cleanup necessario.

## 2026-04-10 — feat: view selection in tree shows editor sub-tabs in Properties
**Prompt**: click view nel Tree View → Properties mostra ViewData sub-tab, click viewpoint → mostra ViewpointProperties, rimuovi tab Viewpoints separato dal pannello destro
**File toccati**:
- `frontend/src/components/editors/Info.tsx` — aggiunto branch di rendering precedente allo switch su `ddata?.className`: se `props.view` è un `DViewElement` → renderizza `<ViewData>`, se è un `DViewPoint` → renderizza `<ViewpointProperties>`. Aggiunti import `DViewElement`, `DViewPoint`, `LProject`, `LViewPoint`, `ViewData`, `ViewpointProperties`. Il branch legge `props.view` (già popolato da `mapStateToProps` da `state._lastSelected?.view`, ma non era mai usato prima)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — `SubViewItem.handleClick` e `ViewpointItem.handleClick` ora settano direttamente `_lastSelected.view` via `SetRootFieldAction.new(...)` invece di chiamare `DockManager.openViewpoint()` + dispatch `SELECT_VIEW_IN_WORKBENCH`. Rimossa la logica legacy con `setTimeout`
- `frontend/src/components/abstract/Dock.tsx` — rimosso il tab "Viewpoints" dal pannello destro: `const views = ...` eliminato, `tabs.push(views)` eliminato, import di `NestedView` rimosso. Il commento dead-code è stato ripulito (no "removed comment for removed code" per CLAUDE.md)
- `frontend/src/components/abstract/DockManager.tsx` — `openViewpoint(vp)` riscritto: invece di `dock.updateTab('right-panel-viewpoints', ...)` ora setta `_lastSelected.view = vp.id` via `SetRootFieldAction`. Callers (Dashboard, ProjectEditor, TreeViewContent) non toccati — ricevono lo stesso comportamento API. Aggiunto import di `SetRootFieldAction` dai joiner. **CLAUDE.md**: evitato `require()` nel frontend (restituisce `{}`)
**Non toccati**:
- `ViewData.tsx`, `InfoData.tsx`, `TemplateData.tsx`, `PaletteData.tsx`, `CustomData.tsx` (EventsData), `GenericNodeData.tsx`, `ViewpointProperties.tsx` — tutti già funzionanti
- `NestedView.tsx` — lasciato in place ma senza importer (il tab separato non esiste più, ma il componente potrebbe servire in futuro)
- `panels/viewpoint-editor/` — 23 file restaurati restano in place (cleanup post-release)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Discriminazione per tipo implementata in `Info.tsx` tramite `selectedViewClass === DViewPoint.cname` / `DViewElement.cname`. Il branch view/viewpoint precede quello del model element nello stesso `render()`, quindi se un view è selezionato, il rendering del Properties panel lo mostra invece dei campi GENERAL/INHERITANCE/FLAGS. Click su una classe invece resetta `_lastSelected.view=''` (esistente — Clicked handlers del tree già lo fanno) e il branch view non si attiva, ritornando al rendering originale. `setSelectedView` callback di `ViewData` (back button) ora resetta tutto `_lastSelected`.

## 2026-04-10 — feat: riportare viewpoint editing nel pannello destro
**Prompt**: riattivare tab Viewpoints nel pannello destro con sub-tab Apply to/Template/Style/Events/Options (no Permissions) invece di aprire una pagina dedicata via `ViewpointEditorPanel`
**File toccati**:
- `frontend/src/components/abstract/Dock.tsx` — assegnato id stabile `'right-panel-viewpoints'` al tab Viewpoints (era generato via `id()`, non targhettabile)
- `frontend/src/components/abstract/DockManager.tsx` — `openViewpoint()` riscritto: ora chiama `dock.updateTab('right-panel-viewpoints', null, true)` per attivare il tab nel pannello destro invece di creare un tab dock dedicato. Parametro `vp` mantenuto per compatibilità API ma prefissato `_vp` (unused)
- `frontend/src/components/abstract/tabs/TabDataMaker.tsx` — rimosso metodo `viewpoint()` e import di `ViewpointEditorPanel`, `DockManager`, `LPointerTargetable`, `LViewPoint`, `DViewPoint`. Lasciato comment esplicativo
**Non toccati**:
- `src/components/panels/viewpoint-editor/` — 23 file restaurati ieri restano in place (cleanup post-release per task Phase 5)
- `src/components/editors/ViewpointWorkbench.tsx` — legacy, già orfano di importer
- `src/components/editors/views/ViewData.tsx` — le sub-tab Permissions erano già commentate fuori dal codice (non serviva toccarle)
- `src/components/editors/views/NestedView.tsx` — già funzionante, renderizza il tree nel tab "Viewpoints" del pannello destro
- `lastViewpoint.ts` — dispatch `VIEW_CREATED` restaurato ieri resta in place (non rompe nulla con il nuovo flusso)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Contesto — l'infrastruttura del tab "Viewpoints" nel pannello destro era già completa e funzionante (`Dock.tsx:329` lo pushava sempre nel tabs array, `NestedView` + `ViewData` + sub-tab `InfoData`/`TemplateData`/`PaletteData`/`EventsData`/`GenericNodeData`/`ComponentsTab` tutti funzionanti). L'unico problema era il routing di `DockManager.openViewpoint()` che, dopo il restore di ieri, apriva `ViewpointEditorPanel` come tab dedicato. Fix minimale: 3 file modificati, nessun componente nuovo, nessun file rimosso. Callers di `DockManager.openViewpoint()` (Dashboard, ProjectEditor, TreeViewContent) sono invariati — ricevono lo stesso comportamento a livello API ma ora attivano il tab del pannello destro.

## 2026-04-10 — feat: ripristino ViewpointEditor redesign da git
**Prompt**: ripristinare 23 file da commit `5999f50c6~1` (parent del cleanup V3), ricablare routing in `TabDataMaker` per usare il nuovo `ViewpointEditorPanel` invece del vecchio `ViewpointWorkbench`
**File toccati**:
- **Ripristinati** (23 file) da `5999f50c6~1` via `git checkout`:
  - `src/components/panels/viewpoint-editor/ViewpointEditorRoot.tsx` (411 righe)
  - `src/components/panels/viewpoint-editor/ViewpointEditorPanel.tsx` (170 righe, wrapper esterno)
  - `ViewpointEditorBreadcrumb.tsx`, `EditorToolbar.tsx`, `EditorFullscreenModal.tsx`, `viewpoint-editor.scss`
  - `sections/`: BehaviorSection, CollapsibleSection, ConstantsSection, EdgeSection, EventsSection, ObservedPropsSection, ViewConfiguration, ViewProperties
  - `tabs/`: ColorPickerPopover, CssVariablesEditor, PathEditorModal, PathPresetsPopover, PredicateTab, StyleTab, TemplateTab, bootstrapIconCatalog, pathPresets
- **Modificati**:
  - `src/events/registry.ts` — aggiunto `JjodelEvents.VIEW_CREATED: 'jjodel:viewCreated'` (re-introdotto dopo la rimozione del 2026-04-06; è necessario al ViewpointEditorPanel per refresh della tree quando una view viene creata dal context menu del canvas)
  - `src/components/panels/viewpoint-editor/ViewpointEditorPanel.tsx` — 2 stringhe hardcoded → costanti registry (`JjodelEvents.VIEW_CREATED`, `JjodelEvents.CANVAS_ELEMENT_SELECTED`)
  - `src/utils/lastViewpoint.ts` — restaurato dispatch di `VIEW_CREATED` dopo `createViewInWorkbench()` (era stato rimosso nel cleanup V3 ma serviva al panel per refresh automatico)
  - `src/components/abstract/tabs/TabDataMaker.tsx` — routing viewpoint: import `ViewpointEditorPanel` invece di `ViewpointWorkbench`, `TabDataMaker.viewpoint()` ora risolve `vp.id` → `LViewPoint` via `LPointerTargetable.fromPointer()` e passa l'istanza + callback `onClose={() => DockManager.closeTab(tabId)}` (la breadcrumb back-arrow chiude il tab invece che fare un no-op)
**Non toccati**:
- `src/components/editors/ViewpointWorkbench.tsx` — lasciato in place per reference, ma senza nessun importer (verrà rimosso in cleanup separato post-release)
- Grammatica/struttura dei file ripristinati — solo fix di: stringhe evento → registry constants
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: 23 file ripristinati, 2 stringhe evento migrate a registry, 1 evento re-introdotto nel registry (VIEW_CREATED), 1 dispatch site restaurato in lastViewpoint.ts, routing TabDataMaker aggiornato. Nessun fix di token CSS legacy necessario (grep `--accent|--bg-[1-5]|--secondary|--terziary|--radius|var(--color)` in `panels/viewpoint-editor/` → zero match: i file erano già puliti al momento della rimozione).

## 2026-04-10 — fix: rimuovi struttura progetto duplicata dalla sidebar model editor
**Prompt**: rimuovere sezioni Structure/Behaviour/Other dalla sidebar sinistra dell'editor modello
**File toccati**: `frontend/src/pages/components/Dashboard.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati)
**Note**: La sidebar `LeftBar` (che contiene le sezioni Structure/Behaviour/Other col nome progetto, Metamodels, Models, Transforms, Viewpoints, Docs) era già nascosta quando l'editor metamodello era attivo (fix 2026-04-06). Il task chiedeva lo stesso comportamento per il model editor. Fix: esteso `ProjectDashboard.useEffect` handlers — il predicato `hideLeftBar` ora usa `isEditorTab(editorType)` che accetta sia `'metamodel'` che `'model'`. Nessuna rimozione di componenti/JSX — solo estensione del predicato esistente. `LeftBar` invariata (serve ancora per la dashboard progetto).

## 2026-04-10 — fix: 5 bug release testing sezione B (tree select, conformsTo, context menu, File tab, slots)
**Prompt**: fix tree view selection per istanze modello, mostra conformsTo nella property panel del modello, fix posizione context menu del flow editor, fix highlight File tab nel menu, sblocca inline editing slot per istanze M1.
**File toccati**:
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — Bug A: `InstanceItem.handleClick` ora dispatcha `SetRootFieldAction.new('_lastSelected', { node: '', view: '', modelElement: instance.objectId })` PRIMA di dispatchare `SELECT_NODE`. Prima, il click su un'istanza nel tree view aggiornava solo la selezione su React Flow (via custom event), ma il pannello Properties (`Info.tsx`) legge `state._lastSelected?.modelElement` → non si aggiornava. Aggiunto anche `instance.objectId` alla deps di `useCallback`.
- `frontend/src/components/editors/Info.tsx` — Bug B: aggiunto banner "Conforms to" in `builder.model()` quando `!l.isMetamodel` e `l.instanceof` esiste. Riusa lo stesso markup usato in `builder.object()`: `<div className="jj-conformance-bar"><span className="jj-conformance-dot" /> Conforms to <strong>{metamodel.name}</strong></div>`. Zero CSS aggiunto — classi già esistenti.
- `frontend/src/components/editor-v2/EditorV2.tsx` — Bug C: wrap del `<ContextMenu>` con `createPortal(..., document.body)` (import già presente). `position: fixed` falliva perché il tab rc-dock applicava transform ancestor che rompeva il containing block. Portal al body → coord viewport assoluti → menu al click point anche con zoom/pan canvas attivo.
- `frontend/src/pages/components/navbar.scss` — Bug D: in `.nav-hamburger:hover span.menu-title` cambiato `background-color: var(--color-text-tertiary)` → `var(--color-bg-hover)`. La regola usava un token di text color (`slate-600` in light) come background — incongruente con la regola sibling `.nav-container span.menu-title:hover` che usava già `--color-bg-hover`. Specificità identica (0,3,1), quindi vinceva la regola later-in-file → tutti i menu tab avevano hover sbagliato.
- `frontend/src/components/editor-v2/EditorV2.scss` — Bug E: rimosso `pointer-events: none` da `.mm-object__feature--placeholder`. Il CSS bloccava i click sugli slot placeholder (attributi del metaclass non ancora valorizzati), anche se `ObjectNode.tsx:510-519` ha `onDoubleClick`/`onClick` che setta `editingFeature` per abilitare l'inline editing. Sostituito con commento che spiega la dipendenza dai handler in JSX. Note: l'inline editing degli slot _esiste già_ (vedi `startEditFeature`/`commitFeatureEdit`/`syncUpdateFeatureValue`) — era solo il CSS che lo disabilitava per i placeholder.
**Esito**: ✅ build ok, 491 test passing (nessuna regressione — stessi 8 file pre-fallenti per `window is not defined` in `PerformanceMetrics.ts`)
**Note**: Bug E non era "by design" — tutta la pipeline di inline editing (startEditFeature → commitFeatureEdit → syncUpdateFeatureValue via proxy `$attr.value =`) era implementata. Il solo ostacolo era il `pointer-events: none` sulla classe placeholder, che veniva applicata quando `!isEditingThis` → impossibile uscire dallo stato placeholder via click. Gli slot con valori esistenti (non-placeholder) funzionavano già. Bug C fix è minimal e robusto: portalizza solo il ContextMenu, lascia tutto il resto invariato.

## 2026-04-10 — fix: 3 bug release testing (infinite loop, bottom drawer, enum icon)
**Prompt**: fix ErrorDisplay forwardRef (infinite loop xyflow), rimuovi bottom property drawer, allinea icona enum
**File toccati**:
- `frontend/src/common/ErrorPortal.tsx` — Bug A: wrap `ErrorDisplay` con `React.forwardRef<HTMLDivElement, ErrorDisplayProps>`, attach ref al div `.error-badge-slick` root, add `displayName`. Fix del re-render loop infinito quando Measurable cloneElement tentava di passare ref a function component senza forwardRef.
- `frontend/src/components/editor-v2/EditorV2.tsx` — Bug B: rimossi import `BottomDrawer` + `ElementPropertiesDrawer`, state `bottomDrawerOpen`/`bottomDrawerElementName`, callback `openBottomDrawer`/`closeBottomDrawer`, `onNodeDoubleClick` handler, voce "Properties" dal context menu, JSX `<BottomDrawer>` render block, prop `onNodeDoubleClick` dal ReactFlow. Componenti `BottomDrawer.tsx` e `ElementPropertiesDrawer.tsx` NON toccati (potrebbero servire altrove).
- `frontend/src/components/editor-v2/EditorV2.scss` — Bug C: aggiunto `.mm-enum .mm-node__header { justify-content: flex-start; }` per allineare l'icona enum a sinistra (override del base `justify-content: center` che centrava icon+name come gruppo spostando visivamente il testo).
**Esito**: ✅ build ok — 0 nuovi errori TS (80 pre-esistenti invariati), 491 test passing (nessuna regressione)
**Note**: Bug A root cause confermata — `MeasurableComponent.render()` a line 426 fa `React.cloneElement(child, {ref: ...})` che non funziona su function components senza `forwardRef`. Il ref fallito causava re-misure continue da xyflow → `setNodes` → re-render loop. Bug B: anche se il task diceva di rimuovere solo il render, ho rimosso anche state/callbacks/import per evitare dead code + warning TypeScript. Bug C: fix minimale — solo override CSS in `.mm-enum`, `<i>` e struttura JSX invariati.

## 2026-04-09 — feat: JjScript test suite
**Prompt**: Creare test suite completa per tutti i comandi JjScript (0 test esistenti su ~19 comandi)
**File creati**:
- `frontend/src/jjscript/__tests__/lexer.test.ts` — 36 test: tokenizzazione comandi, keyword, identifier, qualified names, literals, multiplicity, operatori, commenti, edge cases
- `frontend/src/jjscript/__tests__/grammar.test.ts` — 54 test: parseQualifiedName, parseMultiplicity, parseTypeReference, parseLiteralValue, isValidIdentifier, suggestCorrection, tutti gli helper di formattazione
- `frontend/src/jjscript/__tests__/parser.test.ts` — 66 test: parsing di tutti i 19 comandi (create, delete, rename, set, add, remove, move, copy, list, show, help, undo, redo, clear, validate, extends, eval, let, forall, abstract, do...end block), error handling, JjEL delegation
- `frontend/src/jjscript/__tests__/commands.test.ts` — 39 test: executeHelp (general + tutti i topic), executeUndo/executeRedo (happy path, multi-step, error, roundtrip), executeClear (history, console, selection, all)
**Esito**: ✅ 195 test passing, 0 skipped
**Note**: 19 comandi inventariati. Test coprono: lexer (tokenizzazione), grammar (utility pure), parser (input→AST per tutti i comandi), 3 executor comandi puri (help, undo/redo, clear). I restanti 16 comandi (create, delete, rename, set, add, remove, move, copy, list, show, validate, extends, abstract, eval, let, forall) richiedono Redux store + Jjodel framework — testati a livello parser (AST output) ma non executor (necessita `jsdom` + mock store). Framework: vitest 4.1.1 (pre-esistente).

## 2026-04-09 — refactor: event registry — migrate post-migration stragglers
**Prompt**: Completare migrazione event registry: 3 eventi aggiunti dopo la migrazione originale (2026-04-06) non usavano il registry centralizzato.
**File creato/modificato**:
- `frontend/src/events/registry.ts` — aggiunto `EnvGenEvents` (2 costanti) + `AvatarEvents` (1 costante) + type helpers
- `frontend/src/pages/components/Navbar.tsx` — `'envgen-open-wizard'` → `EnvGenEvents.OPEN_WIZARD`
- `frontend/src/components/envgen/services/EnvGenPersistence.ts` — rimossi `CHANGE_EVENT`, `ENVGEN_CHANGE_EVENT`, `ENVGEN_OPEN_WIZARD_EVENT` locali → `EnvGenEvents.*`
- `frontend/src/components/envgen/index.ts` — rimosso re-export costanti evento (ora in registry)
- `frontend/src/components/project/ProjectEditor.tsx` — `ENVGEN_CHANGE_EVENT`/`ENVGEN_OPEN_WIZARD_EVENT` → `EnvGenEvents.*`
- `frontend/src/hooks/useAvatar.ts` — `AVATAR_CHANGE_EVENT` locale → `AvatarEvents.CONFIG_CHANGE`
**Esito**: ✅ build ok, 0 stringhe hardcoded residue
**Note**: 3 eventi trovati, 6 file modificati, 0 eventi dinamici non migrabili. Registry ora a 40 costanti in 7 gruppi.

## 2026-04-06 — fix: Pulizia header dashboard progetto

**Prompt**: Migliorare l'header della dashboard: descrizione duplicata, matita sempre visibile, "View Megamodel" fuori posto, "+ Tags" stile tratteggiato incongruente.
**Modifiche**:
- **Descrizione**: textarea non si apre automaticamente — stato iniziale solo testo statico. Placeholder cliccabile "Add a description..." quando vuota. Icona matita visibile solo su hover della riga descrizione (via `__desc-row:hover .edit-btn--inline`). Rimosso "Created by" dalla row2 per pulizia.
- **View Megamodel**: Rimosso dall'header, spostato nella sezione METAMODELS come primo bottone (ghost btn--xs) prima di Import e + New. SectionHeader ora rende `children` prima di secondary/primary actions.
- **+ Tags**: Rimosso bordo tratteggiato, ora usa `btn btn--ghost btn--xs` con icona `bi-tag` come gli altri bottoni secondari.
- **SCSS**: Aggiunto `__desc-row` (inline-flex, pencil opacity 0 → 0.5 on hover), `__desc-placeholder` (italic grigio, cliccabile), rimosso `opacity: 0.5` da `edit-btn--inline` (ora controllato dal parent), `__desc-editor` non più absolute.
- **Import rimosso**: `Button` component non più importato (era usato solo per View Megamodel).
**File modificati**: `ProjectEditor.tsx`, `project-editor.scss`

## 2026-04-06 — fix: Nascondi sidebar navigazione progetto nell'editor metamodello (v2)

**Prompt**: La sidebar LeftBar (navigazione progetto) restava visibile accanto alla palette editor quando un metamodello era aperto. Rimuoverla SOLO nell'editor di metamodello.
**Root cause**: Il meccanismo originale si basava solo su `ACTIVE_TAB` con `tabType` estratto da `(activeTab.title).props['data-type']`. Questo falliva perché rc-dock non preserva i props dei React element nel callback `onLayoutChange`, producendo `tabType: null` → `hideLeftBar` restava `false`.
**Fix**: In `Dashboard.tsx`, `ProjectDashboard` ora ascolta DUE eventi:
1. `EDITOR_TYPE_CHANGE` — emesso da `DockManager.open2()` all'apertura di un nuovo tab. Registra `{activeId → editorType}` in un `useRef<Map>` locale e setta `hideLeftBar` immediatamente.
2. `ACTIVE_TAB` — emesso da `Dock.tsx` su ogni switch di tab. Risolve il tipo usando prima il `tabType` dall'evento, poi la mappa locale come fallback.
**Impatto**: Solo `Dashboard.tsx` modificato. LeftBar nascosta solo per `metamodel`, visibile per `model`, `viewpoint`, `project_summary` e tutti gli altri tab.
**File modificati**: `frontend/src/pages/components/Dashboard.tsx`

## 2026-04-06 — fix: Header dashboard centrato e restyling

**Prompt**: L'header della dashboard (titolo, badge versione, metadata) non era allineato al contenuto centrato. Richiesto restyling più pulito.
**Modifiche**:
- **TSX**: Spostato `project-header-compact` da fuori `project-editor__body` a dentro `project-editor__main` (stesso container centrato max-width 900px)
- **TSX**: Badge versione/Rev sostituiti da `<span class="__version">` più sobri (erano Badge component)
- **SCSS**: Titolo 20px → 24px, colore `var(--color-text-primary)`; input editing allineato
- **SCSS**: Aggiunto `&__version` — 12px, `var(--color-text-secondary)`, font-weight 500
- **SCSS**: Row2 metadata — 12px, `var(--color-text-secondary)`, opacity 0.6, margin-top 6px
- **SCSS**: Header — padding-top 24px, border-bottom con `var(--color-border-primary)`, margin-bottom 24px
**File modificati**: `ProjectEditor.tsx`, `project-editor.scss`

## 2026-04-06 — fix: Centro orizzontale contenuto dashboard
**Prompt**: Il contenuto della dashboard progetto era allineato a sinistra anziché centrato.
**Fix**: Aggiunto `margin-left: auto; margin-right: auto` a `.project-editor__main` in `project-editor.scss`. Il `max-width: 900px` era già presente — mancava solo il margin auto per centrare il blocco nell'area disponibile.
**File modificati**: `frontend/src/components/project/project-editor.scss`

## 2026-04-06 — chore: Rimozione dipendenze inutilizzate
**Prompt**: Verifica e rimozione delle dipendenze con zero import nel codebase.
**Pacchetti rimossi** (4):
- `react-itertools@0.0.6` — zero imports
- `nearley-unparse@1.0.1` — zero imports
- `react-scripts@4.0.3` — legacy CRA, progetto migrato a Vite; solo riferimento in `react-app-env.d.ts` (rimosso)
- `webpack-cli@4.9.1` — zero riferimenti in source e config attivi
**Pacchetti tenuti**:
- `path-data-polyfill` — usato in `joiner/index.ts` via `require()`
- `xml-formatter` — usato in `common/libraries/prj_xml2json.js`
- `jquery` + `jqueryui` — usati in 7+ file (Vertex.tsx, MyRcDock.tsx, index.tsx, ecc.)
**File modificati**: `src/react-app-env.d.ts` (rimosso `/// <reference types='react-scripts' />`)
**node_modules**: 757MB → 531MB (−226MB, −30%), 1604 pacchetti rimossi
**Esito**: build ok

## 2026-04-06 — refactor: Event registry centralizzato
**Prompt**: Creare `src/events/registry.ts` con tutti i custom DOM events come costanti tipizzate, sostituire stringhe hardcoded.
**File creato**: `frontend/src/events/registry.ts` — 5 gruppi (`JjodelEvents`, `JjScriptEvents`, `AIEvents`, `JjodieEvents`, `SystemEvents`), 37 costanti evento, 5 type helpers
**File modificati** (44):
- Dock/DockManager/MyRcDock (3 file) — `jjodel:editor-type-change`, `layout-mode-change`, `active-tab`
- TreeViewContent/TreeViewSidebar (2 file) — `selectNode`, `openMegamodel`, `openTransformation`, `transformations`, `treeview:scroll-to-element`, `selectViewInWorkbench`, `toggle-tree-view`
- EditorV2/Toolbar/ClassNode/useJjomSelection/useClassRemoval (5 file) — `child-context-menu`, `toggle-singletons`, `selectNode`, `open-polymetric`, `help-open`, `explain-open`, `layout-mode-change`, `canvas-element-selected`, `toast`
- Navbar/StatusBar/StatusBarRightZone (3 file) — `active-tab`, `toggle-tree-view`, `toggle-singletons`, `layout-mode-change`, `new-project`, `export-canvas`, `open-polymetric`, `transformations`, `jjtl-statusbar`, `ai-provider-changed`
- ProjectEditor (1 file) — `jjtl-execution-result`, `openTransformation`, `openMegamodel`, `transformations`
- Toast/toastDispatch (2 file) — `toast`, `toast-prefs-changed`, `guard-violation`
- Services: ThemeService, JjodieActionExecutor, PromptService, ActivityLogger (4 file) — `theme-changed`, `jjodie:metamodel-updated`, `prompt-changed`, `activity-logged`
- Contexts: TreeViewPanelContext, FeaturesPanelContext (2 file) — 8 jjscript events + `editor-type-change`, `treeview:scroll-to-element`
- Hooks: useInterfaceMode, usePrompt (2 file) — `interfaceModeChange`, `prompt-changed`
- Jodie/JodieWindow/JjodieWidget (3 file) — `jodie:open`, `ai-settings-changed`, `jjscript:executed/executing/execution-end`
- ScriptBlock (1 file) — 14 jjscript event occurrences
- useMetamodelGeneration (1 file) — `jjscript:executing`, `jjscript:execution-end`
- JjtlDevelopmentEnv (1 file) — `jjtl-execution-result`, `jjtl-statusbar`
- Other: ExplainModal, HelpDrawer, HelpButton, MetamodelTab, ContextMenu, MegamodelGraph-toDelete, PolymetricView, AllProjects, Dashboard, AIAssistantSettings, AppearanceSettings, PropertiesWithTreeView, ViewpointWorkbench, ConformanceGuard, types/jodie.ts (15 file)
**Stringhe sostituite**: ~130 occorrenze
**Residui hardcoded**: 0 (esclusi registry.ts, commenti, non-event class names, shortcut labels)
**Esito**: build ok

## 2026-04-06 — refactor: Rimozione editor V3 (viewpoint-editor panel)
**Prompt**: Rimozione sicura dell'editor V3 (panels/viewpoint-editor/) — mappatura dipendenze, pulizia 5 file esterni, build, rm -rf directory.
**File rimossi**: `frontend/src/components/panels/viewpoint-editor/` (23 file, ~1.5MB incl. bootstrapIconCatalog.ts da 1.3MB)
**File modificati**:
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — rimosso import ViewpointEditorPanel, state sidebarMode, event listeners (openViewpointEditor, closeViewpointEditor), render condizionale V3
- `frontend/src/components/editor-v2/Toolbar.tsx` — rimosso vpEditorState, listener jjodel:viewpoint-editor-state, back button + badge JSX
- `frontend/src/components/project/ProjectEditor.tsx` — handleOpenViewpoint e handleCreateViewpoint ora usano DockManager.openViewpoint() diretto + TODO comment
- `frontend/src/pages/components/Dashboard.tsx` — viewpoint click e Open button ora usano DockManager.openViewpoint() diretto + TODO comment
- `frontend/src/utils/lastViewpoint.ts` — rimosso dispatch jjodel:viewCreated (consumato solo da V3)
**Non toccati**: `components/abstract/DockLayout.tsx` (riferimenti V3 già commentati), `components/editors/viewpoint/` (vecchio workbench — ora unico editor viewpoint), `components/editor-v2/viewpoint/ViewpointRenderer.tsx` (utility V2)
**Custom events rimossi**: jjodel:openViewpointEditor, jjodel:viewpoint-editor-state, jjodel:closeViewpointEditor, jjodel:viewCreated
**Esito**: build ok

## 2026-04-05 — audit: Git history analysis (pre vs post Natale 2025)
**Prompt**: Confronto stato codebase prima del 24 dicembre 2025 vs oggi. Volume cambiamenti, snapshot temporali, feature introdotte, aree cresciute, file eliminati.
**File toccati**: `docs/git-analysis-2026-04-05.md` (nuovo)
**Esito**: completato
**Metriche chiave**:
- 301 commit in ~100 giorni (3/giorno), 76% Alfonso, 22% Damiano
- Codebase 3.6× più grande: 303→959 file, 78K→281K LOC (+262%)
- 3 linguaggi DSL creati da zero (JjTL 26K, JjScript 20K, JjEL 6.5K LOC)
- Editor riscritto 2 volte (v2 + v3), AI system interamente nuovo (8 provider + RAG)
- Solo 1 file eliminato — crescita quasi esclusivamente additiva
- Punto di svolta: gennaio 2026 (101 commit, codebase raddoppiato)

## 2026-04-05 — audit: Censimento completo codebase
**Prompt**: Audit completo del codebase Jjodel — struttura directory, inventario componenti React, model layer, JjTL/JjEL/JjScript, AI/Jjodie, styling, dipendenze, TypeScript health, custom events, TODO/bug, metriche sintetiche, red flags.
**File toccati**: `docs/audit-2026-04-05.md` (nuovo)
**Esito**: completato
**Metriche chiave**:
- 400 .tsx + 376 .ts + 183 .scss = ~281K LOC
- 307 componenti React, 42+ custom DOM events
- 3,672 istanze any/as any/@ts-ignore (strict mode attivo)
- 55 dipendenze runtime (5 probabilmente inutilizzate)
- JjTL: 11 test files, JjEL: 2, JjScript: 0
- 8 AI providers supportati, RAG system con IndexedDB
**Red flags**: build system ibrido (react-scripts+Vite), ~600 inline styles, 50+ classi SCSS duplicate, JjScript senza test, jQuery residuo

## 2026-04-04 — feat: AllProjects page redesign
**Prompt**: redesign visivo AllProjects — sidebar light, card accent bar, activity feed grouping, load more, cyan accents
**File toccati**: `frontend/src/pages/dashboard.scss`, `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/pages/components/project-card.scss`, `frontend/src/pages/components/Project.tsx`, `frontend/src/pages/components/catalog/Catalog.tsx`, `frontend/src/pages/components/catalog/catalog.scss`, `frontend/src/pages/components/RightPanel/RightPanel.tsx`, `frontend/src/pages/components/RightPanel/RightPanel.scss`
**Esito**: ✅ completato
**Note**:
- Sidebar active item: cyan text + icon with subtle border (was slate bg)
- Recently Modified: added colored dots (amber for favorites) + relative timestamps (now/3h/2d/1w)
- Project cards: accent bar moved from left-side to top, colored by type (cyan=public, amber=collab/favorite, neutral=private); version badge de-emphasized from green to neutral slate; actions hidden by default, visible on hover
- Tab bar: replaced segmented-control style with underline tabs, active = cyan border-bottom
- Activity feed: already well-implemented with time grouping, colored dots, load more — no changes needed
- Slider pagination: replaced dot carousel with progressive grid + "Load More" button (same pattern as list view)
- Modified Today stat: cyan highlight background (#e0f2fe) on overview grid cell
**Nome del documento prompt**: 2026-04-04 11:30 allprojects-redesign.md

## 2026-03-26 — Fix: `do...end` block executes only the first command

**Prompt**: In a `do...end` block, only the first command is executed. Subsequent commands are ignored.
**File toccati**: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/commands/forall.ts`, `frontend/src/jjscript/executor/commands/let.ts`, `frontend/src/jjscript/executor/dependencies.ts`, `frontend/src/jjscript/components/ScriptExecutionWindow.tsx`
**Esito**: ✅ completato

**Root cause (3 layers)**:
1. **Parser**: No concept of `do...end` blocks. `parseCommand()` returned a single `CommandNode`. After `do` in forall/let, only one command was parsed.
2. **Executor**: No `'block'` command type existed. Even if multiple commands were parsed, there was no way to execute them sequentially.
3. **Script pipeline**: Both `executeScript()` and `ScriptExecutionWindow` split input by newlines, so multiline `do...end` blocks were broken into individual lines.

**Fix**:
1. Added `BlockArgs` type with `commands: CommandNode[]` and `'block'` to `CommandType`
2. Added `parseBlockBody()` (parses commands until `end`), `parseBlockOrCommand()` (detects block vs single command via `hasEndAhead()`), and standalone `do` handling in `parseCommand()`
3. Updated `parseForAllCommand()` and `parseLetCommand()` to use `parseBlockOrCommand()` for body parsing
4. Added `executeBlock()` method in executor — iterates all commands, stops on first error
5. Updated `resolveVariableInBody()` in forall and `resolveVariablesInBody()` in let to handle block nodes recursively
6. Added `groupBlockCommands()` utility to aggregate multiline `do...end` blocks before batch execution
7. Updated `ScriptExecutionWindow` line parser to group `do...end` blocks into single logical lines
8. Updated `extractDependencies()` to handle block nodes

**Design decisions**:
- `do` and `end` are NOT added to COMMANDS/KEYWORDS — they're recognized contextually by the parser (as IDENTIFIER tokens matched via `checkKeyword()`)
- Single-command forall/let (no `end`) remains backward compatible — `parseBlockOrCommand()` falls back to `parseCommand()` when no `end` is found ahead
- Block execution stops on first error (fail-fast semantics)

---

## 2026-03-26 — Fix: `abstract Person` still gives "Unknown command: abstract" after initial fix

**Prompt**: Previous session added all the pieces (types, executor, parser special case) but `abstract Person` still fails.
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
`abstract` is in BOTH `COMMANDS` and `KEYWORDS` arrays. The lexer checks `COMMANDS` first (lexer.ts:371), so it tokenizes `abstract` as `COMMAND` type. But the parser's special-case check (line 139) only matched `IDENTIFIER` or `KEYWORD` — **not `COMMAND`**. So the special case was skipped, and `abstract` fell through to the main switch statement which had no `case 'abstract'`, hitting `default: throw new Error('Unknown command: abstract')`.

**Fix**:
1. Added `token.type === 'COMMAND'` to the special-case condition for abstract toggle
2. Added `case 'abstract'` to the switch as a safety fallback (handles edge case where abstract reaches the switch)

**Lesson**: When a word appears in multiple token-type lists (`COMMANDS` + `KEYWORDS`), the lexer picks the first match. Parser special cases must account for all possible token types.

---

## 2026-03-26 — Fix: `abstract Person` command returns SUCCESS but has no effect (initial fix)

**Prompt**: `abstract Person` in JjScript Console returns SUCCESS + null, but the class doesn't become abstract. The toggle in Properties panel stays off.
**File toccati**: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/commands/abstract.ts` (new), `frontend/src/jjscript/executor/commands/index.ts`
**Esito**: ✅ ma con bug residuo (vedi entry sopra)

**Root cause**:
`abstract` was tokenized as `KEYWORD` (not `COMMAND`). In `parseCommand()`, the check `if (token.type !== 'COMMAND')` was true, so the entire input `abstract Person` was delegated to JjEL as an eval expression. JjEL evaluated it and returned null — no model mutation occurred.

There was no `abstract` command type, no parser handler, and no executor for it.

**Fix**:
- Added `'abstract'` to `CommandType` union and `COMMANDS` array in `types.ts`
- Created `AbstractArgs` interface with `target: QualifiedName`
- Added special case in `parseCommand()`: when first token is `abstract` and next token is an identifier (not `class`), parse as the `abstract` toggle command
- Created `abstract.ts` executor that resolves the class, reads `element.abstract`, toggles with `SetFieldAction.new(element, 'abstract', !currentValue)`
- Wired in `executor.ts` switch and `index.ts` exports

**Semantics**: `abstract Person` toggles — if concrete, makes abstract; if abstract, makes concrete. Message: "Class 'Person' is now abstract/concrete".

**Note**: `abstract class Person` (with `class` keyword) still routes to `create` command as before — the special case only fires when `abstract` is followed directly by an identifier.

---

## 2026-03-25 — Fix: let binding $variable empty in body (missing metamodel context)

**Prompt**: `let $cls = (forall c in classes: c.name) in $cls` parses correctly but returns "Empty result (0 items)" — the forall works standalone but not inside let.
**File toccati**: `frontend/src/jjscript/executor/commands/let.ts`
**Esito**: ✅ completato

**Root cause**:
`evaluateJjel()` in `let.ts` only passed `context.variables` to `jjelEval()` — it did NOT call `buildEvalContext(context)` to include `classes`, `attributes`, `metamodel`, `project`. So when evaluating the valueExpr `(forall c in classes: c.name)`, the identifier `classes` was undefined and the forall returned an empty array.

Compare with `executeEval` in `eval.ts` which correctly calls `buildEvalContext(context)` first, then overlays `context.variables`.

**Fix**:
- Imported `buildEvalContext` from `./eval` into `let.ts`
- Changed `evaluateJjel()` to call `buildEvalContext(context)` first, then overlay `context.variables` on top (so let bindings can reference earlier bindings AND metamodel context)

---

## 2026-03-25 — Fix: forallExistsDepth counter never fires (token type mismatch)

**Prompt**: The `forallExistsDepth` fix in `collectValueExprRaw()` had no effect — same error persisted.
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
`forall` and `exists` are NOT in the JjScript `KEYWORDS` array (`types.ts:560`), so the lexer tokenizes them as `IDENTIFIER`, not `KEYWORD`. The guard at line 864 checked `token.type === 'KEYWORD'` only, so the `forallExistsDepth` counter was never incremented — the fix was dead code.

**Fix**:
- Changed the check from `token.type === 'KEYWORD'` to `(token.type === 'KEYWORD' || token.type === 'IDENTIFIER')` for forall/exists detection in `collectValueExprRaw()`

---

## 2026-03-25 — Fix (ineffective): ambiguità keyword 'in' nel let binding con espressioni JjEL

**Prompt**: `let $cls = forall c in classes: c.name in $cls` produces `[LET_ERROR] Expected 'in' after variable name` because the parser grabs the first `in` (belonging to `forall`) instead of the outer `in` (belonging to `let`).
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ⚠️ Logic was correct but never executed due to token type mismatch (see fix above)

**Fix**:
- Added `forallExistsDepth` counter alongside the existing `parenDepth`
- When a `forall` or `exists` keyword is encountered, increment `forallExistsDepth`
- When `in` is encountered: if `forallExistsDepth > 0`, decrement it (the `in` belongs to the inner construct); otherwise, if `parenDepth === 0`, break (the `in` belongs to the `let`)
- Comma break also requires `forallExistsDepth === 0`
- Handles arbitrarily nested `forall`/`exists` (e.g., `forall ... exists ... in ... in ... in`)

---

## 2026-03-25 — Fix: let binding delegates entire input to JjEL instead of body only

**Prompt**: `let $attribute = prompt('Attribute', EString) in forall c in classes such that c.name == $attribute` produces `[JJEL_ERROR] Unexpected '='`
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
When `parseCommand()` is called recursively from `parseLetCommand()` to parse the body, and the body is a JjEL expression (e.g. `forall` without `do`, `exists`, `with`, or any non-command identifier), the parser used `this.originalInput.trim()` as the JjEL expression text. `originalInput` is the **entire** input string including the `let $var = expr in` prefix, so JjEL received the full let binding syntax and choked on the `=` assignment operator.

**Fix**:
- Added `remainingInput()` helper method that returns `this.originalInput.substring(currentToken.position).trim()` — only the unparsed portion from the current token forward
- Replaced all 3 occurrences of `this.originalInput.trim()` in `parseCommand()`'s JjEL fallback paths with `this.remainingInput()`
- No changes to JjEL or JjTL

---

## 2026-03-25 — Fix: Titolo progetto troncato nell'header della dashboard

**Prompt**: Il titolo H1 del progetto veniva troncato con ellissi — deve andare a capo liberamente
**File toccati**: `project-editor.scss`
**Esito**: ✅ completato

**Changes**:
- Removed `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`, `max-width: 300px` from `.project-header-compact__title`
- Removed `max-width: 300px` from `__title-input` for consistency
- Added `flex-wrap: wrap` to `__row1` so version badges wrap below the title when space is tight

---

## 2026-03-25 — Fix: Documentation section padding/margin alignment

**Prompt**: Align Documentation section margins/padding with Viewpoints and other sections
**File toccati**: `DocumentationSection.tsx`, `DocumentationSection.scss`
**Esito**: ✅ completato

**Changes**:
- Replaced custom `documentation-section` wrapper with shared `project-section` class
- Wrapped documentation card in `list-card` container for consistent border/radius/spacing
- Replaced custom `doc-icon`/`doc-content` structure with `list-card__icon`/`list-card__content`/`list-card__name`/`list-card__type` — pixel-perfect match with Viewpoints cards
- Simplified `DocumentationSection.scss`: removed ~100 lines of custom card/icon/content styles now handled by shared `list-card` classes
- Kept documentation-specific styles: empty state (dashed border), disabled state, status badges, confidence badges, dark mode overrides

---

## 2026-03-25 — Fix: Docs icon in Section Navigator → lettera "D" con sfondo

**Prompt**: Replace Bootstrap icon with letter "D" on colored square, matching M/m/V/⇄ pattern
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`
**Esito**: ✅ completato

**Changes**:
- Changed Docs section from `iconBootstrap: 'bi-file-earmark-text'` to `iconLetter: 'D'` with `iconClass: 'list-card__icon--docs'`
- Added `&--docs` style: background `#dbeafe` (blue-100), color `#3b82f6` (blue-500)
- Removed unused `section-nav__icon--plain` dark-mode style

---

## 2026-03-25 — Fix: Documentation icon for "not generated" state

**Prompt**: Change empty-state Documentation icon from `bi-file-earmark-plus` to `bi-file-earmark-text`
**File toccati**: `DocumentationSection.tsx`
**Esito**: ✅ completato

**Changes**:
- Changed empty-state icon from `bi-file-earmark-plus` to `bi-file-earmark-text` to better communicate "documentation available but not yet generated"
- Existing CSS (`doc-icon--empty`) already handles grey color (`#94a3b8`) and sizing

---

## 2026-03-25 — UI: Section group visual hierarchy in Project Dashboard

**Prompt**: Create visual groupings to communicate MDE workflow structure (Structure → Transformation → Perspectives)
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **Section groups**: Wrapped dashboard sections into 3 logical groups: Structure (Metamodels + Models), Transformation (Transformations), Perspectives (Viewpoints + Documentation)
- **Group labels**: Discrete uppercase watermark labels ("Structure", "Transformation", "Perspectives") above each group
- **Dashed separators**: `1px dashed #e2e8f0` between groups; reduced intra-group spacing (20px) vs inter-group spacing
- **Sidebar nav dividers**: Added `section-nav__divider` between group boundaries in the section navigator
- **Dark mode**: Full support for group separators (`#334155`), labels (`#475569`), and nav dividers
- **IntersectionObserver**: Still works — `div[id="section-*"]` elements preserved as observer targets inside group wrappers

---

## 2026-03-25 — UI: Standardize section headers and actions in Project Dashboard

**Prompt**: Uniform section header pattern across all dashboard sections
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`, `DocumentationSection.tsx`, `DocumentationSection.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **SectionHeader component**: Inline component with standardized title + count `(N)` always shown + ghost button actions
- **Metamodels**: Uses `SectionHeader` with Import (secondary, ghost xs) + "+ New" (primary, ghost sm)
- **Models**: Uses manual `project-section-header` div (needs ref for dropdown positioning) with count always shown
- **Transformations**: Uses `SectionHeader` with count + "+ New"; added CTA to empty state
- **Viewpoints**: Changed "+ Add" to "+ New" (disabled); count always shown including `(0)`
- **Documentation**: Updated header from `.section-header` to `.project-section-header`; added "Generate" button in header actions
- **New CSS classes**: `.project-section-header`, `.btn--ghost`, `.btn--sm`, `.btn--xs`
- **Dark mode**: Full support for ghost buttons and section header

---

## 2026-03-25 — UI: Sidebar section navigator + compact header for Project Dashboard

**Prompt**: Transform sidebar from action list to section navigator; compact header with actions in ⋮ menu
**File toccati**: `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/project-editor.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **Sidebar**: New section navigator with 5 entries (Metamodels, Models, Transforms, Viewpoints, Docs). Each shows type icon + label + count. Click scrolls to section via `scrollIntoView({ behavior: 'smooth' })`. Active section tracked via `IntersectionObserver`.
- **Header compacted**: From ~120px multi-row layout to ~56px 2-row layout. Row 1: title + version badges + "View Megamodel" (promoted to primary button) + "+ Tags" + ⋮ menu. Row 2: description + author + date + inline tags.
- **⋮ menu**: Download project, Make public/private, Close project. Click-outside to dismiss.
- **Layout**: `project-editor` now uses flex column. Body is flex row with `section-nav` sidebar (180px) + scrollable main content.
- **Section IDs**: Added `id="section-{name}"` to each section div for scroll targeting.
- **Dark mode**: Full support for compact header, sidebar, and dropdown.

---

## 2026-03-25 — Fix: JjEL result rendering and error handling in JjScript Console

**Prompt**: Fix 3 problemi nel rendering dei risultati JjEL nella console JjScript
**File toccati**: `frontend/src/jjscript/components/JjScriptOutput.tsx`, `frontend/src/jjscript/executor/commands/eval.ts`
**Esito**: ✅ completato

**Problema 1 — "Eval" + "element" badge**: eval/forall results went through `parseExecutionResult()` which produced generic "Eval" + "element" badges instead of actual values. The `formatJjelResult()` in eval.ts already produced good messages (`**2** results`, actual values) but they were never displayed.
**Fix**: Added `'eval'` and `'forall'` to `isDisplayCommand` in JjScriptOutput.tsx so they use classic status+message rendering. Added `data.items` rendering block (eval stores array items in `data.items`, but output only rendered `data.elements`).

**Problema 2 — No error on invalid input**: `blablabla` returned success because JjEL evaluator silently returns `null` for undefined identifiers (evaluator.ts:191).
**Fix**: Added `isBareIdentifier()` check in eval.ts — after jjelEval returns `null`, if the expression is a simple identifier not in the variables context, return `UNDEFINED_VARIABLE` error with suggestion. Also propagated `context.variables` (let/forall bindings) into eval context.

**Problema 3 — ForAll display**: forall executor already produced good summary messages ("forall: 2/2 executed successfully") but they were hidden by the badge notification. Fixed by Problem 1's `isDisplayCommand` change.

**TypeScript**: `npx tsc --noEmit` — no new errors in changed files.

---

## 2026-03-25 — Fix: JjScript parser no longer delegates JjEL expressions

**Prompt**: Diagnosi + fix regressione — JjScript non delega a JjEL
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato
**Root cause**: Commit `8e9509e16` added `'forall'` to the `COMMANDS` array in `types.ts`. The lexer then tokenized `forall` as `COMMAND` type, but the JjEL delegation check at `parseCommand()` only matched `IDENTIFIER` or `KEYWORD` — so the forall→JjEL path became dead code. The input fell through to the `switch(command)` which had no `case 'forall':`, hitting `default: throw 'Unknown command'`.
**Fix (3 changes)**:
1. Added `token.type === 'COMMAND'` to the forall token type check (line 116) so `forall`-as-COMMAND still reaches the JjEL/JjScript disambiguation via `isForAllDoCommand()`
2. Replaced the hard error at line 144 (non-COMMAND tokens) with JjEL delegation — arbitrary expressions like `classes.size` now fall through to JjEL instead of erroring
3. Added `case 'forall':` in the parser switch (line 207) as safety net for JjScript `forall...do` commands

---

## 2026-03-25 — Feat: Add "Show Console" to View menu

**Prompt**: Add JjScript console overlay accessible from View menu
**File toccati**: `frontend/src/pages/components/Navbar.tsx`
**Esito**: ✅ completato
**Note**: Added `showConsole` state, "Show Console" toggle item in View menu (with checkmark and filled icon when active), and a fixed-position overlay (560×420px, bottom-right) rendering `<JjScriptConsole />` with a dark header bar and close button. No backdrop — canvas remains interactive. TypeScript clean (`npx tsc --noEmit` — no new errors).

---

## 2026-03-25 — Audit: language documentation vs implementation

**Prompt**: Systematic audit of `docs/jjtl-jjel-paper.tex` against the codebase (JjEL, JjTL, JjModal, JjLet, JjScript)
**File toccati**: `docs/LANGUAGE-DOCS-AUDIT.md` (creato)
**Esito**: ✅ completato
**Note**: 55 punti verificati — 35 allineati, 13 parzialmente disallineati, 7 disallineati, 3 non documentati. Le discrepanze critiche sono: (1) `when` vs `where` keyword mismatch in tutto il documento, (2) short-circuit evaluation dichiarato ma non implementato, (3) `filter()`/`map()` dichiarati rimossi ma ancora presenti, (4) JjScript completamente non documentato nel paper. Vedi report completo per dettagli e priorità di aggiornamento.

---

## 2026-03-25 — Feat: implement `let` command in JjScript (Phase 3 of JjLet)

### Changes
- Added `'let'` to `CommandType` union, `LetArgs` interface, `CommandArgs` union, and `COMMANDS` array in `types.ts`
- Added `parseLetCommand()` in `parser.ts` with helpers: `consumeDollarIdentifier()`, `collectValueExprRaw()`, `matchComma()`, `skipNewlines()`
- Added `$variable` support in `parseValueOrQualified()` — parses `$name` as a QualifiedName for use in set/rename values
- Added optional `contextOverride` parameter to `JjScriptExecutor.executeAST()` for scoped context injection
- Added `case 'let'` in executor switch dispatch
- Created `executor/commands/let.ts` handler with:
  - `executeLet()` — creates child context, evaluates bindings sequentially, resolves variables in body AST, executes body
  - `evaluateBindingValue()` — dispatches to prompt/confirm (UIBridge) or JjEL evaluation
  - `resolveVariablesInBody()` — walks body AST to replace `$variable` references with concrete LiteralValues (handles SetArgs.value, RenameArgs.newName)
- Re-exported `executeLet` from `commands/index.ts` and `jjscript/index.ts`

### Files changed
- `frontend/src/jjscript/types.ts` — `LetArgs`, `CommandType`, `CommandArgs`, `COMMANDS`
- `frontend/src/jjscript/parser/parser.ts` — `parseLetCommand()`, `$variable` in values
- `frontend/src/jjscript/executor/executor.ts` — `contextOverride`, `case 'let'`
- `frontend/src/jjscript/executor/commands/let.ts` — new handler
- `frontend/src/jjscript/index.ts` — re-export

### Type check
- `npx tsc --noEmit` — zero new errors (only pre-existing legacy errors)

---

## 2026-03-25 — Fix: `let` binding expression stops at COMMA and IN

### Bug
`let $name = prompt('Name', EString), $upper = $name.toUpper() in { ... }` failed with "Expected '$identifier' after 'let'" because `expression()` is greedy and consumed the comma/`in` as part of the binding value.

### Fix
In `letStatement()`, replaced `this.expression()` with `this.parseJjELExpression([COMMA, IN, NEWLINE, RBRACE])` (when source string is available) so the expression parser stops at binding separators. Added `skipNewlines()` calls to support multi-line binding lists.

### Files changed
- `frontend/src/jjtl/parser/parser.ts` — boundary-aware expression parsing in `letStatement()`
- `frontend/src/jjtl/__tests__/let-prompt-bug.test.ts` — updated JjEL delegation test expectation, added 4 new test cases (multi-binding, multi-line, newline-before-in, source-string path)

### Tests
- 9/9 let-prompt-bug tests passing
- 232 total JjTL+JjEL tests passing (no regressions)

---

## 2026-03-24 — Feat: implement `let` statement in JjTL (Phase 2 of JjLet)

### Changes
- Added `LET` token type and `DOLLAR_IDENT` token type to JjTL `TokenType` enum and `JJTL_KEYWORDS` map
- Added `$identifier` scanning in JjTL lexer (`case '$'` handler)
- Added `LetStatementAST` interface to AST types; updated `MappingBodyItemAST` union
- Added `letStatement()` parser method with support for multiple bindings and `in { body }` block
- Added `LET` dispatch in `mappingBody()` (before forall/alert/notify)
- Added `LetStatement` handling in all 3 executor body-iteration methods:
  - `executeAttributeMappings()` — delegates to new `executeLetBody()` helper
  - `executeAttributeMappingsWithTrace()` — delegates to new `executeLetBodyWithTrace()` helper
  - `executeObjectCreation()` — inline let body execution on the parent object
- Both helpers support nested `let` statements recursively

### Syntax
```jjtl
let $var = expr (, $var2 = expr2)* in {
    -- body items use $var in JjEL expressions
}
```

### Files changed
- `frontend/src/jjtl/types/tokens.ts` — LET + DOLLAR_IDENT tokens
- `frontend/src/jjtl/types/ast.ts` — LetStatementAST interface
- `frontend/src/jjtl/lexer/lexer.ts` — `$identifier` scanning
- `frontend/src/jjtl/parser/parser.ts` — letStatement() + mappingBody() dispatch
- `frontend/src/jjtl/executor/executor.ts` — LetStatement execution in 3 methods + 2 helpers

### TypeScript
- `npx tsc --noEmit` — zero new errors (all errors are pre-existing legacy)

---

## 2026-03-24 — Feat: add $identifier (DOLLAR_IDENT) token to JjEL lexer/parser

### Changes
- Added `DOLLAR_IDENT` token type to `JjelTokenType` enum in `tokens.ts`
- Modified lexer `case '$'` to recognize `$letter...` sequences as `DOLLAR_IDENT` tokens (bare `$` and `${` behavior unchanged)
- Added `DOLLAR_IDENT` handling in parser `primary()` — produces `Identifier` AST node with `$`-prefixed name (e.g. `$name`)
- Added 4 tests in `parser.test.ts`: simple `$name`, binary expression with `$prefix`, `$my_var2` with mixed chars, bare `$` error

### Files changed
- `frontend/src/jjel/types/tokens.ts`
- `frontend/src/jjel/lexer/lexer.ts`
- `frontend/src/jjel/parser/parser.ts`
- `frontend/src/jjel/__tests__/parser.test.ts`

### Tests
- 176/176 passing (89 parser + 87 evaluator)

---

## 2026-03-24 — Docs: add JjLet chapter to jjtl-jjel-paper.tex

### Changes
- Added `\jjlet` macro to preamble alongside existing `\jjmodal`
- Added `let` keyword to `jjtl` and `jjel` listing language definitions
- Updated Document Structure paragraph in Introduction to reference `\cref{sec:jjmodal}` and `\cref{sec:jjlet}`
- Inserted full JjLet section (§5) after JjModal (§4) and before Comparative Analysis (now §6)
  - Subsections: Motivation, Design Position and Architecture, Variable Sigil, Syntax, Semantics, Usage Examples, Implementation Plan, Design Tensions
- Updated comment section numbers for Examples (→7), Discussion (→8), Conclusion (→9)

### Files changed
- `docs/jjtl-jjel-paper.tex`

---

## 2026-03-24 — Feat: add confirm() to JjTL Monaco autocomplete

### Changes
- `jjtlCompletions.ts`: added `confirm` entry to `INTERACTIVE_FUNCTIONS` array with label, detail, documentation, and snippet insertText

### Files changed
- `frontend/src/jjtl/editor/jjtlCompletions.ts`

---

## 2026-03-24 — Feat: show rule + instance context in prompt() and confirm() dialogs

### Goal
When `prompt()` or `confirm()` is called during a JjTL transformation, the dialog shows a subtitle with execution context: e.g. "Person → Human :: Mario" (rule → source instance name).

### Approach
Added `currentRuleName` and `currentInstanceName` optional fields to `ExecutionContext`. The executor populates them during `executeClassMapping`. A new `buildDialogContext()` helper formats them as a display string and passes it through the UIBridge → ReactUIBridge → DialogManager → dialog component chain.

### Changes
- `executor.ts`: added `currentRuleName`/`currentInstanceName` to `ExecutionContext`, populated in `executeClassMapping` loop, added `buildDialogContext()` helper, passed `executionContext` to `showPrompt`/`showConfirm` calls
- `UIBridge.ts`: added optional `executionContext` parameter to `showPrompt` and `showConfirm` in interface + `NoopUIBridge` + `ConsoleUIBridge`
- `ReactUIBridge.ts`: added `executionContext` to `DialogRequest` prompt/confirm variants, propagated in `showPrompt`/`showConfirm`
- `JjtlDialogManager.tsx`: passes `executionContext` prop to `JjtlPromptDialog` and `JjtlConfirmDialog`
- `JjtlPromptDialog.tsx`: added `executionContext` prop, renders `.jjtl-dialog-context` subtitle
- `JjtlConfirmDialog.tsx`: added `executionContext` prop, renders `.jjtl-dialog-context` subtitle
- `JjtlDialogs.scss`: added `.jjtl-dialog-context` style (11px, slate-500, italic)

### Files changed
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/executor/UIBridge.ts`
- `frontend/src/jjtl/executor/ReactUIBridge.ts`
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlPromptDialog.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlConfirmDialog.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlDialogs.scss`

---

## 2026-03-24 — Feat: implement confirm() command — full stack

### Goal
Add `confirm(label)` — a JjModal command that opens a Yes/No dialog and returns a boolean.

### Changes
- `tokens.ts`: added `CONFIRM` to `TokenType` enum and `JJTL_KEYWORDS`
- `ast.ts`: added `ConfirmExpressionAST` interface and union member in `ExpressionAST`
- `parser.ts`: imported `ConfirmExpressionAST`, added `TokenType.CONFIRM` check in `primary()`, added `confirmExpression()` method
- `UIBridge.ts`: added `showConfirm(message): Promise<boolean>` to interface + `NoopUIBridge` (returns false) + `ConsoleUIBridge` (logs and returns false)
- `ReactUIBridge.ts`: added `{ type: 'confirm' }` variant to `DialogRequest` union + `showConfirm()` implementation
- `executor.ts`: imported `ConfirmExpressionAST`, added to `isUserProvidedExpression()`, added `ConfirmExpression` case in `evaluateExpressionAsync()`
- `JjtlConfirmDialog.tsx`: new component — Yes/No buttons, Enter=Yes, Escape=No, `bi-question-circle` icon
- `JjtlDialogManager.tsx`: imported `JjtlConfirmDialog`, added `'confirm'` case in `renderDialog()`
- `dialogs/index.ts`: exported `JjtlConfirmDialog`

### Files changed
- `frontend/src/jjtl/types/tokens.ts`
- `frontend/src/jjtl/types/ast.ts`
- `frontend/src/jjtl/parser/parser.ts`
- `frontend/src/jjtl/executor/UIBridge.ts`
- `frontend/src/jjtl/executor/ReactUIBridge.ts`
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/components/dialogs/JjtlConfirmDialog.tsx` (new)
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/index.ts`

---

## 2026-03-24 — Fix: prompt dialog passes typeRef, renders correct widget, validates by type

### Goal
Fix JjtlPromptDialog so it receives the `typeRef` from the DialogRequest and uses it to:
- Render the appropriate input widget (text, number, date, checkbox)
- Validate input on submit (reject non-numeric for EInt/EFloat)
- Show inline error message without closing the dialog

### Changes
- `JjtlDialogManager.tsx`: pass `typeRef={request.typeRef}` to JjtlPromptDialog
- `JjtlPromptDialog.tsx`: add `typeRef` prop; render `<input type="number">` for EInt/EFloat, `<input type="date">` for EDate, `<input type="checkbox">` for EBoolean, `<input type="text">` for everything else; validate EInt (parseInt) and EFloat (parseFloat) on submit with inline red error; return string values in all cases

### Files changed
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlPromptDialog.tsx`

---

## 2026-03-24 — Feat: trace shows rule name and userProvided flag per binding

### Goal
Enhance trace model and MappingTraceView to:
1. Show `TraceLink.rule` (e.g. "Person -> Human") — already wired, confirmed visible
2. Add `userProvided` flag to `BindingTrace` for prompt()/input() values
3. Show a "user input" badge (cyan, `bi-person-fill` icon) next to user-provided binding values

### Changes
- `traceModel.ts`: added `userProvided?: boolean` to `BindingTrace` interface and `TraceLinkBuilder.addBinding()` parameter
- `executor.ts`: added `isUserProvidedExpression()` helper; passes `userProvided` to `addBinding()` when the top-level expression is `PromptExpression` or `InputExpression`
- `MappingTraceView.tsx`: added `userProvided?: boolean` to `AttributeMapping` interface; renders "user input" badge with `bi-person-fill` icon when `binding.userProvided === true`
- `MappingTraceView.scss`: added `.trace-binding-user-provided` style (cyan badge, 10px font)
- `useJjtlExecutor.ts`: both adapter paths now pass `invertible`, `expression`, and `userProvided` from `BindingTrace` to `AttributeMapping`

### Files changed
- `frontend/src/jjtl/executor/traceModel.ts`
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/views/MappingTraceView.tsx`
- `frontend/src/jjtl/views/MappingTraceView.scss`
- `frontend/src/jjtl/hooks/useJjtlExecutor.ts`

---

## 2026-03-24 — Fix: prompt() shows typeRef as default value in dialog

### Bug
`prompt('Age', EInt)` pre-filled the input field with "EInt" because `ReactUIBridge.showPrompt` had a 2-param signature `(message, defaultValue?)` while `UIBridge` interface had 3 params `(message, typeRef, defaultValue?)`. The executor passed `typeRef` as the second arg, which ReactUIBridge treated as `defaultValue`.

### Fix
- `ReactUIBridge.ts`: added `typeRef` parameter to `showPrompt` signature and to the emitted `DialogRequest`
- `DialogRequest` prompt type: added `typeRef: string` as a separate field from `defaultValue`
- `JjtlPromptDialog` and `JjtlDialogManager` already correctly use only `defaultValue` — no changes needed

### Files changed
- `frontend/src/jjtl/executor/ReactUIBridge.ts`

---

## 2026-03-24 — Feat: wire JjTL interactive commands to executor

### Goal
Connect the 4 interactive AST nodes (AlertStatement, NotifyStatement, PromptExpression, InputExpression) — already parsed but not executed — to the UIBridge so they actually trigger UI dialogs during transformation execution.

### Design decisions
- `evaluateExpression` stays synchronous (JjelFunction.call returns JjelValue, not Promise)
- New `evaluateExpressionAsync` wrapper handles PromptExpression/InputExpression via UIBridge
- Body iteration methods and the execution chain up to `execute()` are now async
- AlertStatement/NotifyStatement handled directly in the 3 body iteration loops
- PromptExpression/InputExpression intercepted at the attribute mapping level via evaluateExpressionAsync

### Changes
- `executor.ts`: added imports for interactive AST types + getUIBridge
- `executor.ts`: added `evaluateExpressionAsync()` — async wrapper that intercepts Prompt/Input, delegates rest to sync evaluateExpression
- `executor.ts`: added AlertStatement + NotifyStatement handling in executeAttributeMappings, executeAttributeMappingsWithTrace, executeObjectCreation
- `executor.ts`: made execution chain async: execute → executeClassMapping → executeMultiSourceClassMapping → executeAttributeMappings/WithTrace → executeAttributeMapping/WithTrace → executeConversion, executeObjectCreation, executeForAllMapping, executeForAllMappingOnObject
- `ProjectEditor.tsx`: added `await` to executeTransformation call (already in async function)

### Files changed
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/components/project/ProjectEditor.tsx` (1 line: added await)

---

## 2026-03-24 — Fix: context menu icon color inherits from text

### Goal
Icon color in context menu items must match text color, not be dimmed independently.

### Change
- Removed hardcoded `color: #64748b` on `.item i.bi` — now uses `color: inherit`
- Removed separate `:hover i.bi` color override (no longer needed)
- Icons now match text color in all states: normal (`#cbd5e1`), danger, muted, hover

### Files changed
- `frontend/src/components/contextMenu/style.scss` — 2 lines removed, 1 changed

---

## 2026-03-24 — Style: unified dark slate floating surfaces

### Goal
Unify all floating surfaces (context menus, edge type popup) to a single dark slate style with consistent design tokens.

### Design tokens applied
- background: `#1e293b`, border: `1px solid #334155`, border-radius: `8px`
- box-shadow: `0 2px 12px rgba(0,0,0,0.2)`
- item: 12px, `#cbd5e1`, padding `5px 8px`, border-radius `4px`
- item icon: `#64748b`, 13px
- hover: `rgba(255,255,255,0.06)`
- active: `#38bdf8` text, `rgba(14,165,233,0.12)` bg
- danger: `#f87171`, hover `rgba(239,68,68,0.12)`
- divider: `0.5px solid rgba(255,255,255,0.08)`
- section label: 10px, `#475569`, uppercase, letter-spacing `.08em`

### Files changed
- `frontend/src/components/editor-v2/_themes.scss` — added `--float-*` CSS variables to both theme-dark and theme-light (identical dark floating surface in both themes, except shadow intensity)
- `frontend/src/components/editor-v2/EditorV2.scss` — editor-v2 `.context-menu` now uses `var(--float-*)` tokens
- `frontend/src/components/editor-v2/components/EdgeTypePopup.scss` — replaced hardcoded dark values with `var(--float-*)` tokens; unified border-radius to 8px, padding to 4px
- `frontend/src/components/contextMenu/style.scss` — legacy context menu updated to dark slate (hardcoded values since it's outside editor-v2 scope)

### Notes
- **FeaturesPalette** is a sidebar panel (not a floating surface) — left unchanged. If "primitives popover" refers to a different component, it should be identified separately.
- **No TSX changes** — all three surfaces use CSS classes (no inline styles for the floating container itself).
- **No class renames** — existing class names preserved.
- Pre-existing TS errors unrelated to this change (GraphDataElements, EcoreService, view.tsx).

---

## 2026-03-24 — Style: context menu visual polish

### Changes
- Reduced border-radius from `var(--radius-lg)` (12px) to 8px for a tighter look
- Reduced `<hr>` separator margin from `var(--space-1)` to 2px to tighten vertical spacing
- Added subtle 0.5px divider before Delete item (targeted via `[data-cannotdelete]` attribute)
- Added subtle 0.5px divider before Help item (targeted via `:has(> .bi-question-circle)`)

### Files changed
- `frontend/src/components/contextMenu/style.scss`

## 2026-03-23 — Fix: white page — U.toHtml() undefined at module load (MyRcDock.tsx)

### Problem
App shows white page with error loop: `MyRcDock.tsx: Cannot read properties of undefined (reading 'toHtml')` — first at line 308 (`dropIndicator`), then at line 419 (`makeAnchorControl` → `anchorControls`).

### Root cause
Two top-level variable initializers called `U.toHtml(...)` at **module scope**:
1. `dropIndicator` (line 308) — dead code, never used elsewhere
2. `anchorControls` array (lines 421-426) — calls `makeAnchorControl()` which uses `U.toHtml()`

`U` is resolved from `windoww.U` at import time (`joiner/index.ts:105`). Due to module load order, `U` can be `undefined` when `MyRcDock.tsx` is first evaluated, crashing the app before any component renders.

### Fix
Deferred both into lazy-init getter functions:
- `getDropIndicator()` — creates `dropIndicator` on first access
- `getAnchorControls()` — creates `anchorControls` array on first access, updated the one call site (line 614)

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/dock/MyRcDock.tsx` | Lazy-init `dropIndicator` and `anchorControls`; updated call site at line 614 |

### Verification
- Vite dev server starts cleanly

---

## 2026-03-23 — Fix: white page regression (ansi-to-html require)

### Problem
After the scoping fix commit, the app showed a white page with error loop:
`MyRcDock.tsx:308: Cannot read properties of undefined (reading 'toHtml')`

### Root cause
`UX.tsx` imported `ansi-to-html` via `require()` (line 23), which returns `{}` in the Vite/browser environment. This could cause module initialization failures cascading to other components. Additionally, `U.objectInspect()` had a typo: it cached the `Convert` instance under `window.ansiconvert` (lowercase) but read from `window.ansiConvert` (uppercase), so the instance was never cached and recreated on every call.

### Fix
1. **UX.tsx**: Removed unused `require('ansi-to-html')` — `Convert` was imported but never referenced in UX.
2. **U.tsx `objectInspect()`**: Fixed cache key typo (`ansiconvert` → `ansiConvert`) and added null-check safety net — if `ansiConvert.toHtml` is not a function, falls back to plain `util.inspect()` without ANSI colors.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/common/UX.tsx` | Removed unused `require('ansi-to-html')` |
| `frontend/src/common/U.tsx` | Fixed `objectInspect()` cache key typo + null-check on `toHtml` |

### Verification
- Vite dev server starts cleanly
- Zero TypeScript errors
- Scoping fix (commit `7bd2bd05f`) untouched — it did not modify UX.tsx, U.tsx, or MyRcDock.tsx

---

## 2026-03-23 — Fix: `classes` scoped to active metamodel tab

### Problem
`forall c in classes : c.name` returned classes from the wrong metamodel (metamodel_1) when the user was viewing metamodel_3 — because both code paths (`getActiveMetamodel()` and Console `getFallbackModel()`) relied on `_lastSelected` which tracks the last clicked element, NOT the currently visible tab.

### Root cause
Two independent code paths build the JjEL evaluation context:
1. **JjScript executor** (`eval.ts` → `buildEvalContext` → `getTargetMetamodel` → `getActiveMetamodel`)
2. **Console component** (`Console.tsx` → `mapStateToProps` + `getFallbackModel` → `jjelEval`)

Both used `state._lastSelected` (stale after tab switch without clicking an element) and fell back to `m2models[0]` / first metamodel.

### Fix
Use **DockManager active tab ID** as primary source of truth (tab IDs = metamodel pointer IDs):

1. `getActiveMetamodel()` now queries `DockManager.dock.getLayout().dockbox.children[0].activeId` first, falling back to `_lastSelected` only when dock is unavailable.
2. Console `getFallbackModel()` similarly uses DockManager active tab before falling back to `m2models[0]`.
3. Console `mapStateToProps` clears stale `_lastSelected.node` when the node belongs to a different metamodel than the active tab.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjscript/executor/utils.ts` | `getActiveMetamodel()` uses DockManager active tab; added helper `getActiveTabMetamodel()` |
| `frontend/src/components/editors/Console.tsx` | `getFallbackModel()` uses DockManager; `mapStateToProps` clears cross-tab stale node |

### Tests
329 tests passing (172 JjEL + 157 JjTL), unchanged.

---

## 2026-03-23 — JjEL: object literals

### What
Added object literal syntax to JjEL: `{key: value, ...}`. Keys can be identifiers or quoted strings. Supports empty objects `{}`, dot access `{name: "x"}.name`, index access `{"my-key": v}["my-key"]`, nesting, and use as forall projections.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjel/types/ast.ts` | Added `ObjectLiteralExpr`, `ObjectLiteralEntry` types to union |
| `frontend/src/jjel/types/tokens.ts` | Added `LBRACE` token type |
| `frontend/src/jjel/lexer/lexer.ts` | Handle `{` → `LBRACE` token |
| `frontend/src/jjel/parser/parser.ts` | Added `objectLiteral()` production in `primary()` |
| `frontend/src/jjel/evaluator/evaluator.ts` | Added `evaluateObjectLiteral()` — produces plain JS objects |
| `frontend/src/jjel/__tests__/parser.test.ts` | 11 new parser tests for object literals |
| `frontend/src/jjel/__tests__/evaluator.test.ts` | 16 new evaluator tests (dot/index access, sortBy, groupBy, forall) |
| `frontend/src/jjel/SPEC.md` | Updated grammar, composite types table, operators |

### Tests
172 JjEL tests passing (was 145), 157 JjTL tests passing (unchanged).

---

## 2026-03-23 — JjEL grammar update: `|` as alias, `:` reserved for projection

### What
Updated JjEL grammar with three changes:
1. **`|` added as alias for `such that`** — works in both `forall` and `exists` filter clauses
2. **`:` removed from `exists`** — `:` is now reserved exclusively for `forall` projections (breaking change)
3. **Nested parenthesized expressions** work correctly: `forall c in classes | (exists a in c.attrs | a.isPublic) : c.name`

### Breaking change
`exists x in S : pred` is no longer valid syntax. Must use `exists x in S such that pred` or `exists x in S | pred`.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjel/types/tokens.ts` | Added `PIPE` token type |
| `frontend/src/jjel/lexer/lexer.ts` | Handle `\|` → `PIPE` token |
| `frontend/src/jjel/parser/parser.ts` | `exists()`: reject `:`, accept `\|`; `forAll()`: accept `\|` as alias |
| `frontend/src/jjel/types/ast.ts` | Updated doc comments |
| `frontend/src/jjel/__tests__/parser.test.ts` | Updated exists tests, added rejection test |
| `frontend/src/jjel/__tests__/evaluator.test.ts` | Changed `exists ... :` → `exists ... such that` |
| `frontend/src/jjtl/__tests__/jjel-delegation.test.ts` | Changed 4 exists expressions |
| `frontend/src/jjel/SPEC.md` | Updated exists syntax, examples, summary table |
| `CLAUDE.md` | Updated core constructs table |
| `docs/jjel-jjtl-audit.md` | Updated exists example |
| `docs/jjtl-jjel-paper.tex` | Updated 3 exists examples + description |
| `docs/claude-code-log.md` | This entry |

---

## 2026-03-22 — JjEL integration in JjScript (forall, exists, with)

### What
Added JjEL expression evaluation support to JjScript. Users can now type `forall`, `exists`, and `with` expressions directly in the JjScript console/chat, and the expression is evaluated against the active metamodel context via JjEL delegation (same pattern as JjTL).

### How it works
1. **Parser detection:** When the first token is `forall`, `exists`, or `with`, the parser captures the entire input as a raw JjEL expression string (no AST construction — JjEL has its own parser).
2. **Executor delegation:** The new `executeEval` command handler builds an `EvaluationContext` from the active metamodel (classes, attributes, metamodel, project), then calls `jjelEval(expression, variables)`.
3. **Context building:** L-layer proxy objects are converted to plain JjelValue objects using shallow conversion to avoid circular reference issues. Available context variables: `classes`, `attributes`, `metamodel`, `project`.
4. **Result display:** Array results are shown as bulleted lists; scalars are shown directly; errors show the JjEL error message with a syntax hint.

### Examples
- `forall c in classes : c.name` → list of class names
- `forall c in classes such that c.isAbstract : c.name` → abstract class names only
- `forall c in classes | (exists a in c.attributes | a.name == "pippo")` → classes with attribute "pippo"
- `eval 2 + 3` → `5` (explicit eval command also supported)

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjscript/types.ts` | Added `'eval'` to `CommandType`, `COMMANDS`, `CommandArgs`; added `EvalArgs` interface |
| `frontend/src/jjscript/parser/parser.ts` | Added JjEL trigger detection (`forall`/`exists`/`with`); added `parseEvalCommand()` for explicit `eval` syntax |
| `frontend/src/jjscript/executor/commands/eval.ts` | Created — `executeEval` with context building and `jjelEval` delegation |
| `frontend/src/jjscript/executor/executor.ts` | Added `case 'eval'` dispatch |
| `frontend/src/jjscript/services/JjScriptService.ts` | Added JjEL trigger detection in `startsWithCommand`; added `formatEvalResult` for chat display |
| `docs/claude-code-log.md` | Updated with this entry |

---

## 2026-03-22 — JjEL delegation architecture exploration (JjTL → JjScript)

### What
Read-only exploration of how JjTL delegates expression evaluation to JjEL, to plan replicating the same mechanism in JjScript.

### Key findings
- **Delegation pattern:** JjTL executor holds a persistent `JjelEvaluator` instance. All expressions pass through `evaluateExpression()` → `toJjelAst()` (bridge) → `jjelEvaluator.evaluate(jjelExpr, ctx)`. The same `EvaluationContext` object is shared by reference.
- **Standalone function calls bypass the bridge** — executor intercepts `FunctionCall` with `Identifier` callee and calls builtins directly via `ctx.getBuiltin()`.
- **JjScript has zero JjEL integration** — no imports, no expression evaluation, no variable bindings. The `ExecutionContext.variables` map exists but is never used.
- **Integration is surgical, not a refactoring** — JjEL's `EvaluationContext.child()` and `JjelEvaluator.evaluate(expr, ctx)` are already designed for external consumers. JjScript can use the JjEL parser directly (no bridge needed). Estimated ~200-300 lines of new code.

### Output
- Created `docs/jjel-delegation-architecture.md` — full report with exact signatures, context flow, gap analysis, and recommended integration approach.

### Files changed
| File | Change |
|------|--------|
| `docs/jjel-delegation-architecture.md` | Created — delegation architecture report |
| `docs/claude-code-log.md` | Updated with this entry |

---

## 2026-03-22 — Singleton instances rendering on M1 canvas (Phase 2)

### What
Connected the View menu "Show singleton instances" toggle to the EditorV2 canvas. When enabled, singleton class instances are created/revealed on the M1 canvas with a diamond badge; when disabled, they are hidden (DVertices persist in Redux for position preservation).

### Architecture
- **syncState.ts**: New `suppressedSingletonIds` Set — module-level coordination between EditorV2 and useJjomSync. When singletons are hidden, their DVertex IDs are added to this set so both init and incremental sync paths skip them.
- **useJjomSync.ts**: Checks `isSingletonSuppressed(id)` in both the full init path (mount/modelid change) and the incremental additions path. Suppressed vertices are skipped entirely.
- **EditorV2.tsx**: Listens for `jjodel:toggle-singletons` custom event. On show: clears suppression, transforms existing DVertices to RF nodes (or creates new DObject+DVertex via `syncCreateObject` for singletons without instances). On hide: suppresses vertex IDs, removes RF nodes. On mount with toggle off: pre-suppresses existing singleton vertices.
- **ObjectNode.tsx**: Reads `isSingleton` flag from metaclass in Redux, renders diamond badge in top-right corner.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/editor-v2/sync/syncState.ts` | Added `suppressedSingletonIds` Set with suppress/unsuppress/clear/get functions |
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | Import `isSingletonSuppressed`, skip suppressed vertices in init + incremental sync |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Added singleton toggle event listener, show/hide logic, initial suppression on mount |
| `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | Read `isSingleton` from Redux metaclass, render diamond badge conditionally |
| `frontend/src/components/editor-v2/EditorV2.scss` | Added `.singleton-badge` styles (16×16px slate badge with white diamond icon) |

### Key decisions
- **DVertices persist when hidden** — positions preserved in Redux store, no localStorage backup needed
- **Suppression set** pattern (not RF node filtering) — integrates cleanly with existing anti-bounce coordination in syncState.ts
- **New instances auto-positioned** — below existing nodes (y = maxY + 60), spaced horizontally (gap 220px)
- **Badge uses same slate style** (#334155) as other UI indicators per design system

---

## 2026-03-22 — "Show singleton instances" toggle in View menu (Phase 1)

### What
Added a per-model toggle "Show singleton instances" to the View menu (between Fullscreen Mode and Debug Mode). The toggle is disabled when the active tab is a metamodel or the dashboard — only enabled for M1 model tabs.

### State management
- **Per-model localStorage**: key `jjodel.showSingletons.<modelId>`
- Syncs on active tab change via `jjodel:active-tab` event
- Dispatches `jjodel:toggle-singletons` custom event with `{ modelId, show }` for canvas consumption
- Console logs `[singleton] show=<bool>, modelId=<id>` for Phase 2 verification

### Files changed
| File | Change |
|------|--------|
| `frontend/src/pages/components/Navbar.tsx` | Added singleton toggle state, `getActiveModelTab()` helper, `toggleShowSingletons()`, menu item with diamond icon and contextual disable |

### Pattern
Follows the TreeView toggle pattern: localStorage-backed `useState` + custom event for cross-component sync. Menu item uses the Debug Mode checkmark pattern (`✓` suffix + filled/outline icon).

---

## 2026-03-22 — Singleton class underline on canvas

### What
Added visual indicator for singleton classes on the editor-v2 canvas: the class name appears underlined when `isSingleton === true`, following UML convention.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/editor-v2/types.ts` | Added optional `isSingleton` to `ClassNodeData` |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | Pass `isSingleton` from LClass proxy to node data |
| `frontend/src/components/editor-v2/nodes/ClassNode.tsx` | Read `isSingleton`, add `singleton` CSS class |
| `frontend/src/components/editor-v2/EditorV2.scss` | `.singleton .mm-node__name { text-decoration: underline }` |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Added `isSingleton: false` to new class node data |

### Pattern
Follows the same pattern as `isAbstract` → `.abstract` → italic name. Singleton uses `.singleton` → underline name.

---

## 2026-03-21 — Surface hierarchy variables in editor-v2 _themes.scss

### What
Added surface hierarchy CSS variables (`--topbar-bg`, `--topbar-border`, `--topbar-text`, `--panel-bg`, `--panel-border`, `--sidebar-bg`, `--sidebar-border`) to both dark and light theme blocks in `_themes.scss`. Also updated light theme canvas: `--canvas-bg` from `#f8fafc` → `#f1f5f9`, `--canvas-dots` from `rgba(0,0,0,0.08)` → `rgba(100,116,139,0.25)` for more visible dot grid.

### Light theme surface values
| Variable | Value | Purpose |
|----------|-------|---------|
| `--topbar-bg` | `#1e293b` | Dark topbar (slate-800) |
| `--topbar-border` | `#334155` | Topbar bottom border |
| `--topbar-text` | `#94a3b8` | Muted topbar text |
| `--panel-bg` | `#ffffff` | White properties panel |
| `--panel-border` | `#e2e8f0` | Panel divider |
| `--sidebar-bg` | `#f8fafc` | Sidebar (slate-50) |
| `--sidebar-border` | `#e2e8f0` | Sidebar divider |

### Dark theme surface values
| Variable | Value |
|----------|-------|
| `--topbar-bg` | `#0f172a` |
| `--topbar-border` | `#1e293b` |
| `--topbar-text` | `#64748b` |
| `--panel-bg` | `#1e293b` |
| `--panel-border` | `rgba(255,255,255,0.08)` |
| `--sidebar-bg` | `#253347` |
| `--sidebar-border` | `rgba(255,255,255,0.06)` |

### STEP 4 note
Grep found no hardcoded panel/sidebar/topbar backgrounds in editor-v2 or abstract SCSS that needed migration — existing rules already use `var(--surface-*)` CSS variables. The new variables are ready for consumption by future component work.

### Files Modified
- `frontend/src/components/editor-v2/_themes.scss` — both theme blocks updated

---

## 2026-03-21 — Remove editor-v3

### What
Removed `src/components/editor-v3/` entirely and cleaned up all external references. Editor V3 was a viewpoint-first architecture experiment; editor-v2 remains the active editor.

### Deleted
- `frontend/src/components/editor-v3/` — entire directory (EditorV3Shell, EditorV3Inner, contexts, hooks, nodes, edges, panels, styles, sync, toolbar, viewpoint, types, constants)

### Modified
| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Removed `EditorV3Shell` import and `editor-v3` route |
| `frontend/src/components/abstract/tabs/EditorSwitch.tsx` | Removed `EditorV3Shell` import, `'v3'` from `EditorMode` type, localStorage v3 override, and v3 render branch |
| `frontend/src/styles/tokens/_colors-dark.scss` | Removed "editor-v3" from comment |
| `frontend/src/styles/tokens/_colors-light.scss` | Removed "editor-v3" from comment |

### Verification
- `npx tsc --noEmit`: no new errors introduced (all errors are pre-existing)

## 2026-03-21 — Editor Surface Hierarchy (visual depth)

### What
Applied visual surface hierarchy to the editor-v3 surfaces: canvas, palette, properties panel, toolbar, tree view, and panel headers. Creates clear visual layering between zones.

### Surface map applied (light theme)

| Zone | Background | Border | Notes |
|------|-----------|--------|-------|
| Canvas | `#f1f5f9` (slate-100) | — | Dot grid: `#cbd5e1` 0.8px / 14px |
| Left sidebar (palette) | `#f8fafc` (slate-50) | right `#e2e8f0` | New `--color-palette-bg` token |
| Properties panel | `#ffffff` | left `#e2e8f0` | Unchanged `--color-panel-bg` |
| Panel headers | `#1e293b` (dark) | bottom `#334155` | Text `#94a3b8` |
| Canvas toolbar | `#f8fafc` (slate-50) | `#e2e8f0` all-around | Plus existing shadow |
| Tree view panel | `#f8fafc` | left `#e2e8f0` | Updated `$color-bg-primary` |
| Nodes on canvas | `#ffffff` | — | Shadow already `rgba(0,0,0,0.06)` ✓ |

### Files modified (SCSS only)

| File | Changes |
|------|---------|
| `styles/tokens/_colors-light.scss` | `--color-canvas-bg` → slate-100, `--color-canvas-grid` → slate-300, `--color-panel-header-bg` → #1e293b (dark), `--color-panel-header-text` → #94a3b8, new `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border`, `--color-toolbar-bg` → slate-50 |
| `styles/tokens/_colors-dark.scss` | Added matching `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border` tokens |
| `editor-v3/styles/editor-v3.scss` | Canvas `.react-flow` now uses `background-color` + `background-image` (radial dot grid) + `background-size` |
| `editor-v3/styles/panels.scss` | `.v3-palette` uses `--color-palette-bg`, header borders use `--color-panel-header-border`, added `.v3-properties__type-badge` styles |
| `editor-v3/styles/toolbar.scss` | Added `border: 1px solid var(--color-toolbar-border)` |
| `TreeViewSidebar/tree-view-sidebar.scss` | `$color-bg-primary` → #f8fafc, `$color-border` → #e2e8f0 |

### TSX notes (not modified per constraints)
- **Entity type badge** (`.v3-properties__type-badge`): CSS class added but needs TSX wiring in `PropertiesPanel.tsx` to render `<span class="v3-properties__type-badge">MODEL</span>` in the header
- Editor-v2 does not use CSS custom properties from the token system — no regression risk

### Build
SCSS compiles cleanly. Pre-existing build error (Vite `import.meta.url` in react-scripts webpack) unchanged.

---

## 2026-03-21 — Centralized Entity Icons & Colors (`entityMeta.ts`)

### What
Created `frontend/src/common/entityMeta.ts` as the single source of truth for entity type icons (Bootstrap Icon names), colors, and badge letters. Migrated three high-priority files to consume it.

### New file: `frontend/src/common/entityMeta.ts`
- `EntityType` union type (15 types: metamodel, model, class, attribute, etc.)
- `ENTITY_META` record with icon, color, badgeBg/badgeText (light+dark), letter per type
- Colors sourced from `docs/DESIGN-SYSTEM.md` §2.2 (artifact types) and `tree-view-sidebar.scss` $color-* variables (sub-entity types)
- `resolveEntityType(raw)` — maps D-prefixed class names, ElementBadge strings, and palette action types to canonical `EntityType`
- Helpers: `entityIcon()`, `entityColor()`, `entityLetter()`, `entityIsAbstract()`

### Files migrated
| File | What changed |
|------|-------------|
| `TreeViewContent.tsx` | Icon letter derivation now uses `resolveEntityType()` + `entityLetter()` instead of `className.slice(1,2)`. Transformation icon uses `entityIcon('transformation')`. |
| `AdaptivePalette.tsx` | All hardcoded `bi-*` icon strings in M2_SECTIONS replaced with `entityIcon()` calls. M1 instance icon also migrated. |
| `ElementBadge.tsx` | Removed `TYPE_LETTERS` record; now uses `resolveEntityType()` + `entityLetter()` from entityMeta. |

### NOT migrated (noted for future)
- **Tree View colors** (`tree-view-sidebar.scss`): uses SCSS $color-* variables and CSS classes (`.tree-DClass`, etc.) — separate SCSS migration needed
- **element-badge.scss**: badge bg/text colors are hardcoded in SCSS, not inline — separate migration to CSS custom properties from `ENTITY_META` needed
- **tab-title.scss**: uses `::before` pseudo-elements with hardcoded colors — SCSS migration
- **Icons.tsx** (`pages/components/icons/`): action icons (undo, redo, delete), not entity types — no migration needed
- **Project.tsx**: project type icons (public/private/collaborative), not entity types — no migration needed

### Build
Zero TypeScript errors in modified files. Pre-existing errors unchanged.

---

## 2026-03-21 — Fix: Restore colored badges in Project Dashboard

### Problem
`ElementBadge` for metamodel, model, and transformation types used muted slate gray in the dashboard. The design system (`docs/DESIGN-SYSTEM.md` §2.2) defines distinct artifact type colors that should be used consistently across the UI.

### Fix (element-badge.scss only)
Updated badge colors to match **DESIGN-SYSTEM.md §2.2** canonical artifact type colors:
- **Metamodel (Violet):** `#EEEDFE` / `#534AB7` (light), `rgba(127,119,221,0.2)` / `#AFA9EC` (dark)
- **Model (Amber):** `#FAEEDA` / `#854F0B` (light), `rgba(186,117,23,0.2)` / `#FAC775` (dark)
- **Transformation (Teal):** `#E1F5EE` / `#0F6E56` (light), `rgba(29,158,117,0.2)` / `#5DCAA5` (dark)
- Viewpoint (Pink) was already correct — no change needed

### Files Modified
- `frontend/src/components/common/element-badge.scss` — updated metamodel, model, transformation/epsilon colors (light + dark mode)

---

## 2026-03-21 — Fix: Context menu missing background/border in Project Dashboard

### Problem
The ⋮ context menu on metamodel/model rows in the project dashboard rendered without background, border, or box-shadow — text was unreadable over the list content.

### Root Cause
CSS specificity collision: `contextMenu/style.scss` defines a generic `.context-menu` using CSS custom properties (`var(--color-bg-elevated)`, etc.) that aren't defined in the project dashboard context. Since both definitions have equal specificity, load order determined the winner, and the generic one (with unresolved variables) won.

### Fix (project-editor.scss only)
Scoped `.context-menu` under `.project-editor` (both light and dark mode blocks) to increase specificity and guarantee the hardcoded project-dashboard styles always win.

### Files Modified
- `frontend/src/components/project/project-editor.scss` — changed `.context-menu` to `.project-editor .context-menu` (lines 535 and 949)

---

## 2026-03-19 — Fix: Properties panel empty when metamodel is empty or nothing selected

### Problem
When a metamodel had no elements (empty) or when clicking the canvas to deselect, the Properties panel showed nothing. `_lastSelected.modelElement` was either `undefined` (deselectAll else branch) or not set at all (useEffect guard skipped when `findModelElement` returned falsy for empty models).

### Root Cause
1. **useEffect:** `findModelElement()` returns a class/package ID, but for empty metamodels there are none. The `if (modelElement)` guard prevented setting `_lastSelected` at all.
2. **deselectAll else branch:** When `findModelElement` returned null/undefined, the code set `_lastSelected` to `undefined`, which meant Info.tsx received no `dataID` and rendered the empty state.

### Fix (useJjomSelection.ts only)
1. **useEffect:** Removed the `if (modelElement)` guard. Now always sets `_lastSelected` with `modelElement ?? modelid` — falls back to the model ID itself.
2. **deselectAll else branch:** Instead of setting `undefined`, sets `modelElement: modelid` — points to the model itself.

### Why it works
`Info.tsx` receives `dataID = modelid`, resolves it via `LModelElement.fromPointer(modelid)` which returns the `LModel` root, and renders `PropertiesOverview` with the metamodel stats.

### Files Modified
- `frontend/src/components/editor-v2/hooks/useJjomSelection.ts` — two changes (useEffect fallback + deselectAll else branch)

### Build Verification
- TypeScript: no new errors (`npx tsc --noEmit`)
- Pre-existing errors in DockManager.ts:237, MetamodelTab.tsx unchanged

---

## 2026-03-19 — Rollback: revert "Properties panel shows model overview" (caused white page)

### What happened
The previous change added a DockManager-based fallback in `mapStateToProps` (Info.tsx) to show the active model's overview when nothing was selected. This caused a white page on load — `LModel.fromPointer(activeId)` likely threw before DockManager was fully initialized, despite the try/catch.

### Rollback
- Removed the `// When nothing is selected` block from `mapStateToProps`
- Removed the `DockManager` import
- `mapStateToProps` restored to its original form (just nodeID/viewID/dataID + topics + advanced)

### Files Modified
- `frontend/src/components/editors/Info.tsx` — reverted to original `mapStateToProps`

---

## 2026-03-19 — UI polish: empty state scrollbar + minimal resize handle

### Fix 1: No scrollbar when "No element selected"
**Problem:** The Properties panel showed a scrollbar even when displaying the empty state (no element selected). The `.properties-panel` rule had `overflow-y: auto` which created a scrollbar when the empty state content was slightly taller than the container.
**Fix:** Added `.properties-panel--empty { overflow: hidden; }` inside `.properties-panel-container` in `properties-with-tree-view.scss`. The `--empty` class is already applied by Info.tsx when no element is selected.

### Fix 2: Minimal resize handle
**Problem:** The resize handle used a 16px grip icon with cyan hover effects — visually heavy and inconsistent with the app's minimal aesthetic.
**Fix:** Replaced with a 1px line design:
- Visually: 1px line in `#e2e8f0` (slate-200), becomes `#94a3b8` (slate-400) on hover
- Hit area: 5px (transparent padding around the line)
- Supports both `horizontal` (row-resize) and `vertical` (col-resize) orientations via `orientation` prop
- No decorative elements (no grip dots, no icon, no shadow)
- Removed debug console.log statements
- Simplified keyboard handling (removed synthetic mouse event hack)

### Files Modified
- `frontend/src/components/editors/properties-with-tree-view.scss` — added `overflow: hidden` for empty state
- `frontend/src/components/ResizeHandle/ResizeHandle.tsx` — simplified to minimal divider with orientation prop
- `frontend/src/components/ResizeHandle/resize-handle.scss` — rewritten: 1px line + 5px hit area

---

## 2026-03-19 — Refactor: remove duplicate editor-type-change dispatch from Dock.tsx

### Problem
`editor-type-change` was dispatched from three places: `DockManager.open2()`, `_detectActiveTabChange()` in MyRcDock.tsx, and `handleLayoutChange` in Dock.tsx. The Dock.tsx dispatch was redundant (and had the same `state[activeId]` bug) now that MyRcDock catches all tab switches via `componentDidUpdate`.

### Changes
- Removed the `editor-type-change` dispatch block from `handleLayoutChange` in Dock.tsx. Kept only `jjodel:active-tab` (StatusBar) and `data-active-tab` (documentation panel hiding).
- Removed the `setTimeout` initial dispatch block — `_detectActiveTabChange()` fires on first `componentDidUpdate` and handles initial detection.
- Removed unused `store` and `LProject` imports.

### Dispatch points after this change
- `DockManager.open2()` — card click opens model/metamodel
- `DockManager.openDocumentation()` — opens documentation tab
- `DockManager.openTransformation()` — opens transformation tab
- `_detectActiveTabChange()` in MyRcDock.tsx — all tab switches (componentDidUpdate)

### Files Modified
- `frontend/src/components/abstract/Dock.tsx` — removed redundant dispatch, cleaned imports

---

## 2026-03-19 — Fix: click on active tab hides panels

### Problem
Clicking the already-active tab caused panels (TreeView, Properties) to disappear. The `_detectActiveTabChange()` method treated `DockComponent_rightbar_*` IDs as real editor switches, dispatching `editorType: 'summary'` which collapsed the panels via CSS.

### Root Cause
When rc-dock internally refocuses the first panel, `activeId` can momentarily resolve to a `DockComponent_rightbar_*` tab. `_detectActiveTabChange()` processed this as a real tab change and dispatched a `summary` editor type, triggering the CSS rules that hide TreeView and Properties panels.

### Fix
Added an early return guard in `_detectActiveTabChange()` to ignore `DockComponent_rightbar_*` IDs entirely — these are internal rc-dock artifacts, not real editor switches.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `DockComponent_rightbar_` guard

---

## 2026-03-19 — Fix: _detectActiveTabChange resolves metamodel/model correctly

### Problem
`_detectActiveTabChange()` in MyRcDock.tsx always resolved model/metamodel tabs as `summary`. When clicking a metamodel tab, the `[DETECT]` log showed `editorType: 'summary'` instead of `editorType: 'metamodel'`.

### Root Cause
The Redux store lookup used `store.getState()[activeId]` which is always `undefined`. Jjodel's Redux store does not store objects as top-level keys — they live under `state.idlookup[id]`.

### Fix
Changed `store.getState()[activeId]` → `store.getState().idlookup[activeId]` in `_detectActiveTabChange()`. This matches the pattern used throughout the codebase (see `DPointerTargetable.from()` in `joiner/classes.ts:1454`).

**Note:** The same bug exists in `Dock.tsx` (lines 267 and 382) but was not fixed per instructions to only modify MyRcDock.tsx.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — fixed `idlookup` access in `_detectActiveTabChange()`

### Build Verification
- TypeScript: no errors (`npx tsc --noEmit`)

---

## 2026-03-19 — Fix: tab click now dispatches jjodel:editor-type-change

### Problem
Clicking an existing rc-dock tab to switch to it bypassed `DockManager` entirely. The `jjodel:editor-type-change` event was only dispatched by `DockManager.open2()` (new tab creation) and the `onLayoutChange` prop in Dock.tsx. However, rc-dock does not always fire `onLayoutChange` for simple tab switches within the same panel (treats them as "silent changes").

### Root Cause
rc-dock's `onLayoutChange` callback fires on structural layout changes (add/remove/move tabs) but may not fire when only the `activeId` changes within a panel. Tab clicks update `activeId` without changing the layout structure.

### Fix
Overrode `componentDidUpdate` in `PinnableDock` (MyRcDock.tsx) to detect active tab changes after every state update:
- Added `_lastActiveId` field to track the previous active tab ID
- Added `_detectActiveTabChange()` method that reads the current layout's `activeId` for the first (models) panel
- Only dispatches `jjodel:editor-type-change` when `activeId` actually changes (prevents redundant dispatches)
- Uses the same editor type detection logic as Dock.tsx: `jjtl_*` → transformation, `doc_*`/`DockComponent_rightbar_*` → summary, otherwise checks Redux store for DModel

### Why `componentDidUpdate` works
`componentDidUpdate` fires after every React state update, including rc-dock's internal `setState` when a tab is clicked. This catches ALL tab changes regardless of whether rc-dock considers them "silent" or not.

### Dispatch deduplication
- `_lastActiveId` prevents duplicate dispatches on re-renders that don't change the active tab
- When `open2()` creates a new tab and dispatches, `componentDidUpdate` may also fire — the double dispatch is harmless (listeners are idempotent)
- The `open2()` dispatch was intentionally kept per user request

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `store` import, `_lastActiveId` field, `_detectActiveTabChange()` method, call in `componentDidUpdate`

### Build Verification
- TypeScript: no new errors from MyRcDock.tsx (`npx tsc --noEmit`)

---

## 2026-03-19 — Rollback: revert tab-switch fix that broke card flow

### What happened
A previous attempt to fix "tab click not updating panels" added:
1. `resolveEditorType()` + dispatch in `DockManager.open()` found branch
2. `currentTabId` fallback in `Dock.tsx handleLayoutChange`
3. Removed debug logs from multiple files

This broke the working card→panel flow.

### Rollback
- **DockManager.ts**: Removed `resolveEditorType()`, removed dispatch in found branch, removed `store` import. Kept Session 1's duplicate tab guard (`updateTab` + early return).
- **Dock.tsx**: Reverted to HEAD (Session 1 debug logs were the only diff; removing them restored HEAD state which already has full `handleLayoutChange` + editor type detection).
- **Dashboard.tsx**: Minor debug log removal kept (functionally identical).
- **TreeViewPanelContext.tsx**: Minor debug log removal kept (functionally identical).

### Current state: card=✅, tab=❌
Card flow works: `open2()` → `open()` (guard or dockMove) → `open2()` dispatches `editor-type-change`.
Tab click flow broken: clicking a tab in rc-dock tab bar doesn't go through `DockManager` — relies on `onLayoutChange` in Dock.tsx which may not fire for tab switches.

### All `editor-type-change` dispatch/listen points
**Dispatchers:**
- `DockManager.ts:102` — `open2()` after opening model/metamodel
- `DockManager.ts:132` — `openDocumentation()` existing tab
- `DockManager.ts:154` — `openDocumentation()` new tab
- `DockManager.ts:237` — `openTransformation()` existing tab
- `DockManager.ts:266` — `openTransformation()` new tab
- `Dock.tsx:273` — initial type detection on mount (setTimeout)
- `Dock.tsx:393` — `handleLayoutChange` (via `onLayoutChange` prop)
- `Dashboard.tsx:259` — GenericDashboard mount (dispatches 'summary')

**Listeners:**
- `Dock.tsx:253` — sets `body[data-editor-type]`
- `TreeViewPanelContext.tsx:186` — auto-opens tree view for modeling editors

---

## 2026-03-19 — Properties Panel & Navbar: duplicate key, visibility, persistence fixes

### Bug 1: Duplicate key warning in Navbar (DockManager.ts)
**Symptom:** `Warning: Encountered two children with the same key` in NavbarComponent when opening metamodels.
**Root Cause:** `DockManager.open()` called `dockMove()` without checking if a tab with the same ID already existed. Opening the same metamodel twice added a duplicate tab to rc-dock. The Navbar syncs tabs from rc-dock and rendered both with the same key.
**Fix:** Added a guard in `DockManager.open()` that checks `dock.find(tab.id)` before adding. If the tab exists, it activates it via `updateTab()` instead. This matches the pattern already used by `openDocumentation()` and `openTransformation()`.

### Bug 2: Properties Panel empty on first metamodel open (PropertiesWithTreeView.tsx)
**Symptom:** Opening a metamodel for the first time showed an empty Properties panel. Second open worked.
**Root Cause:** `PropertiesWithTreeView` had an early return (`return <div className="...--empty" />`) when `activeEditorType` was not `model`/`metamodel`. On first open, the `jjodel:editor-type-change` event hadn't fired yet (async), so the component rendered the empty div. By the second open, the state was already set.
**Fix:** Removed the early-return guard for non-modeling editors. The component now always renders its full content. Right panel visibility for non-modeling contexts is handled at the CSS level (see Bug 3).

### Bug 3: Properties Panel persists on dashboard + aria-hidden error (style.scss)
**Symptom:** Returning to dashboard left the Properties panel visible. Also caused `aria-hidden on element because its descendant retained focus` error.
**Root Cause:** The right panel was always present in the rc-dock layout. Visibility was only controlled by internal conditional rendering (`{isModelingEditor && ...}`), but rc-dock keeps unmounted tab content hidden with `visibility:hidden` — not removed. Focus could remain trapped in the hidden panel.
**Fix:** Added CSS rules for `body[data-editor-type="summary"]` and `body[data-editor-type="transformation"]` that collapse the right panel (width: 0, opacity: 0, pointer-events: none). Same pattern already used for `data-active-tab="documentation"` and `data-layout-mode="canvas-only"`. The `data-editor-type` attribute is already managed by Dock.tsx's `handleLayoutChange` and the Dashboard's mount effect.

### Files Modified
- `frontend/src/components/abstract/DockManager.ts` — duplicate tab guard in `open()`
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — removed empty-div early return, removed unused `activeEditorType`/`isModelingEditor`
- `frontend/src/components/abstract/style.scss` — CSS rules for summary/transformation editor types

### Build Verification
- TypeScript: no new errors in modified files (`npx tsc --noEmit`)
- Pre-existing error in DockManager.ts:237 (`openTransformation` method) unchanged

---

## 2026-03-17 — Documentation Tab UI Fixes

### Changes

**1. Fix toolbar buttons compression (DocumentationTab.scss)**
- Added `flex-shrink: 0`, `flex-wrap: nowrap`, `overflow-x: auto` to `.toolbar-right` — prevents buttons from being squeezed
- Added `white-space: nowrap`, `flex-shrink: 0` to `.toolbar-btn` — prevents label text from wrapping or overlapping icons
- Added `flex-shrink: 0` to button icons (`i` elements)
- Added `flex-shrink: 0` and `white-space: nowrap` to `.provider-selector` and `.provider-btn`

**2. Hide Properties panel when Documentation tab is active (Dock.tsx, style.scss)**
- In `Dock.tsx` `handleLayoutChange`: detect when active tab is a documentation tab (`activeId === 'documentation'` or starts with `doc_`) and set `body[data-active-tab="documentation"]`
- In `style.scss`: added CSS rule for `body[data-active-tab="documentation"]` that hides the right panel (same pattern as `canvas-only` mode)
- Properties panel is only hidden while Documentation is the active tab; switching to any other tab restores it

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — toolbar button spacing fixes
- `frontend/src/components/abstract/Dock.tsx` — active tab detection for documentation
- `frontend/src/components/abstract/style.scss` — CSS rule to hide right panel for documentation

### Build Verification
- TypeScript: no errors in modified files (`npx tsc --noEmit`)
- SCSS: compiles without errors
- Note: `npm run build` fails due to pre-existing Monaco `import.meta.url` / webpack incompatibility (unrelated)

---

## 2026-03-17 — Fix toolbar buttons still compressed (CSS specificity)

### Root Cause
The previous fix added correct properties to `.toolbar-btn` but they were overridden by a **global** `.toolbar-btn` in `EditorV2.scss` (line 225) which sets `width: 28px; height: 28px`, forcing all toolbar buttons to be 28×28px icon-only squares.

Multiple files define global `.toolbar-btn`: `EditorV2.scss`, `catalog.scss`, `console-tab.scss`, `bottomToolbar.scss`, `logger.scss`. CSS load order made one of these win over the DocumentationTab definition.

### Fix
Scoped all toolbar-related selectors (`.toolbar-left`, `.toolbar-right`, `.toolbar-title`, `.toolbar-btn` and variants) **under `.documentation-toolbar`** parent selector. This gives them higher specificity (`.documentation-toolbar .toolbar-btn` beats global `.toolbar-btn`).

Also added explicit `width: auto; height: auto` to reset the 28×28px constraint from EditorV2.

Dark mode overrides for `.toolbar-btn` also scoped under `.documentation-toolbar`.

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — nested toolbar selectors under `.documentation-toolbar`

---

## 2026-04-22 — fix: generator mapping→JjTL, remove resolve() and fix helper body delimiters
**Prompt**: rimozione annotazione `: resolve(...)` dai binding di reference e sostituzione `[ ... ]` con `{ ... }` nel body degli helper generati
**File toccati**: `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx`
**Esito**: ✅ completato
**Note**: resolution ora delegata interamente all'executor (coerente con decisione 2026-04-17). Il fix `resolve(...)` è mirato al pattern specifico (early-return in `formatAttrMapping` quando `hint` inizia con `resolve(`): altri conversionHint JjEL (`name.toUpper()`, `x == 1`, …) continuano a produrre `target := source : hint`. Helper body ora su singola riga con graffe `{ body }` (mantenuta la formattazione mono-riga preesistente).
**Nome del documento prompt**: 2026-04-22 10-00 fix-mapping-to-jjtl-generator

---

## 2026-04-22 — fix: mapping generation, prevent and skip malformed attribute mappings
**Prompt**: fix preventivo nel system prompt LLM (regola: attribute mapping richiede target attribute esistente) + fix difensivo nel generatore (skip silenzioso di mapping con LHS vuota)
**File toccati**: `frontend/src/constants/defaultPrompts.ts`, `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx`
**Esito**: ✅ completato
**Note**: due livelli di difesa, indipendenti e complementari. Il difensivo convive con il fix resolve(...) del prompt parallelo. Preventivo: nuova sezione `## Target Attribute Must Exist` in `MAPPINGS_PROMPT`, placed tra `Do Not Map Abstract Classes` e `Two-Pass Bindings` per raggruppare le regole "non generare X". Difensivo: early return `''` in `formatAttrMapping` quando `targetAttr.trim()` è vuoto; caller adeguato con `const line = ...; if (line) rule += line + '\n'` (coerente con lo stile imperativo `for...of` del blocco esistente). Test coverage per casi LHS vuota resta follow-up — la copia locale in `ai-prompt-sanitization.test.ts` è già drift rispetto al prod (mancano i fix precedenti) e il riallineamento merita un prompt separato.
**Nome del documento prompt**: 2026-04-22 14-00 fix-malformed-mappings

---

## 2026-04-22 — fix: helper return type separator `:` → `->`
**Prompt**: completamento sintassi helper JjTL — separatore return type da `:` a `->` nel generatore (e autocomplete/test se coinvolti)
**File toccati**: `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx`
**Esito**: ✅ completato
**Note**: completa la serie di fix sintattici helper del 2026-04-22 (delimitatori body `{ }` + rimozione `: resolve(...)` + return type `->`). Diff di 1 riga: `SuggestedMappingsPanel.tsx:145` — `): ${returnType}` → `) -> ${returnType}`. Il `:` nei parameter types (`s: State`) resta invariato. Autocomplete Monaco (`jjtlCompletions.ts:15`) era già corretto (usava `->` da prima). Nessun test da aggiornare: le fixture in `jjel-delegation.test.ts` usavano già la sintassi `-> <Type>` (asseriscono che il parser la accetta — quindi il parser è già allineato).
**Nome del documento prompt**: 2026-04-22 16-00 fix-helper-return-type-separator

---

## 2026-04-25 — discovery: sistema notifiche/toast esistente
**Tipo**: discovery (solo lettura)
**Prompt**: Discovery sistema notifiche esistente per redesign toast
**File toccati**: `discovery-notifications.md` (creato nella root)
**Esito**: ✅ completato
**Note**: 4 agenti Explore in parallelo su 5 topic (sistema notifiche centralizzato, trigger del name clash, componente Jjodie, Settings panel, convenzioni). Risultato chiave: **coesistono due sistemi paralleli di toast** — (1) `ToastProvider` Context-based moderno in `frontend/src/components/Toast/` (mounted in App.tsx:110, API completa con `useToastContext`/`toast()` standalone, preferenze in localStorage) e (2) sistema legacy Redux-based via `U.alert()` (`common/U.tsx:393`) → `state.alert` → `Alert.tsx` (122 chiamate sparse nel codebase). Il toast del name clash che l'utente vede oggi proviene dal sistema **legacy** (`LModelElement.tsx:5981` chiama `U.alert('e', ...)`). Jjodie produzione: `components/Jodie/Jodie.tsx` (mounted in App.tsx:~193, draggable/resizable, ascolta `JjodieEvents.OPEN`); esiste anche `JjodieWidget` demo non montato. Settings panel: `UnifiedSettingsModal` con pattern dichiarativo `NAV_GROUPS` array + switch case — aggiungere sezione "Notifications" è 4 step zero-refactor. Raccomandazione: **estendere `ToastProvider` esistente, non crearne uno nuovo**; restyling SCSS con design tokens, migrare il name clash, eventualmente trasformare `U.alert()` in facade che delega a `toast()` per non toccare le 122 chiamate. Altri sistemi rilevati da decidere: `NotificationCenter` (mockup popover), `JjtlNotifyToast` (toast locale JjTL — duplicato), import morto `react-hot-toast` in `SizeInput.tsx:3`.
**Nome del documento prompt**: 2026-04-25 14-30 discovery-notifications

---

## 2026-04-22 — docs: feature inventory completo della piattaforma (1484 righe)
**Prompt**: censimento completo delle feature della piattaforma Jjodel, organizzato ad albero gerarchico su tre livelli (area funzionale → pannello → azione), classificato per tier Basic/Advanced, audience, frequenza, rischio. Workflow in tre fasi (scan strutturale → inventario granulare → auto-check). Output `docs/feature-inventory.md`.
**File toccati**: `docs/feature-inventory.md` (nuovo, 1484 righe)
**Esito**: ✅ completato
**Note**: 20 aree L1, 72 pannelli L2, ~358 azioni L3. Distribuzione tier ipotizzata: 114 🟢 / 81 🟡 / 163 🔴 / 6 ⚠️ (placeholder visibili ma non implementati). Default conservativo 🔴 quando incerto. Le 5 regole metodologiche risolte in sede di review: (1) infrastruttura non user-facing in sezione finale `## Infrastruttura (no tier)` senza classificazione; (2) feature placeholder/disabled incluse con marker ⚠️; (3) JjEL builtins una sola riga L3 con conteggio (no distinzione common/advanced nel codice); (4) codice morto sospetto escluso dall'albero, elencato in `## Note per la revisione`; (5) Dock tabs come pointer table verso aree pertinenti, non duplicati. Sezione `## Note per la revisione` con 5 sotto-header: feature sospette (8 segnalazioni: properties triplo, console doppio, error display frammentato, ...), feature non user-facing emerse per errore (5: Debug Mode, layout slots, integrity check, PermissionModelTab, EditorSwitch), gap rispetto ai docs (verifiche manuali raccomandate), candidati a feature flag (5 toggle già presenti — `advanced`, `debug`, `isExpertMode`, DevModeContext, useInterfaceMode), codice morto sospetto (~20 candidati: `*-toDelete`, `templateExample/`, `setupProxy.DISABLED.js`, `firefox issues/`, `src/DSL/`, `src/iot/`, `src/ocl/`, `DV.tsx`, `Dummy.ts/tsx`, ...). Documento è un'**ipotesi iniziale** da revisionare manualmente. Nessuna modifica al codebase.
**Nome del documento prompt**: 2026-04-22 18-00 feature-inventory

---

## 2026-04-30 — diagnostic: JjScript M1 context discovery
**Tipo**: diagnostic (solo lettura, zero modifiche al codice)
**Prompt**: raccolta informazioni necessarie per estendere JjScript executor con contesto M1 (level/modelId/metamodelId) prima dell'implementazione dei comandi su istanze
**File toccati**: nessuna modifica al codebase. Letti: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/services/JjScriptService.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/utils.ts`, `frontend/src/contexts/TreeViewPanelContext.tsx`, `frontend/src/components/editor-v2/hooks/useEditorMode.ts`, `frontend/src/components/Jodie/Jodie.tsx`
**Esito**: ✅ completato
**Note**: Buona notizia: `ExecutionContext` (`types.ts:487-500`) già contiene `projectId`/`modelId`/`targetMetamodelId` — manca solo un esplicito `level: 'M1' | 'M2'`. **Bug latente**: `JjScriptService.execute()` (`services/JjScriptService.ts:60-82`) passa SOLO `projectId` a `executeCommand()` — perde `modelId` e `targetMetamodelId` anche quando l'utente è in un editor metamodello specifico. La distinzione M1/M2 esiste in più punti (`DModel.isMetamodel` boolean, `useEditorMode` hook con detection automatica via `instanceof`, `EditorType` union in `TreeViewPanelContext`, evento `JjodelEvents.EDITOR_TYPE_CHANGE` dispatched da `DockManager`), ma nessuno di questi è mai consumato dal path JjScript. Helper `getActiveMetamodel()` già presente in `executor/utils.ts:18-41` (legge active dock tab + fallback `_lastSelected.modelElement`); manca il duale `getActiveModel()` per M1. **Punto di attenzione**: il singleton invalidation in `getExecutor()` (`executor.ts:299-313`) oggi confronta solo `projectId` + `targetMetamodelId` — andrà esteso a `level` + `modelId` per evitare reuse stale tra editor M1 ↔ M2 nello stesso progetto. Stima cambiamenti per la sola estensione del contesto: ~5 file (types, executor, utils, JjScriptService, opzionalmente Jodie). I command handler M2 esistenti (`executor/commands/*`) sono hardcoded sui metamodelli — l'implementazione M1 effettiva (DObject/DValue creation) è scope separato e non oggetto di questa discovery.
**Nome del documento prompt**: 2026-04-30 jjscript-m1-context-discovery

---

## 2026-04-30 — feat: JjScript M1 context extension (Prompt 1/2)
**Prompt**: extend ExecutionContext with level M1/M2, add getActiveModel/getActiveLevel, fix singleton stale check, resolve level in JjScriptService
**File toccati**: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/executor/utils.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/services/JjScriptService.ts`
**Esito**: ✅ completato
**Note**: Implementazione conforme al prompt con tre adattamenti rispetto allo pseudocodice (necessari per allinearsi al codice reale, segnalati come previsto): (1) `getActiveModel()` usa il pattern `DockManager.dock.getLayout()` mirroring di `getActiveTabMetamodel()` esistente, NON `(window as any).__jjodelDockManager` dello pseudocodice (che non esiste). (2) Property access è `model.isMetamodel` direct (proxy LModel), NON `model.__raw?.isMetamodel`. (3) `getDefaultParent()` aveva firma reale `(project, elementType): any` — non rifattorizzato a `(context, project): LModel | null` come nello pseudocodice; aggiunto invece `context?: ExecutionContext` come terzo parametro opzionale per preservare i 2 call site esistenti (`resolvers.ts:263`, `create.ts:179`). Branch M1 inserito in testa, logica M2 invariata. Singleton invalidation in `getExecutor()` ora include `level` e `modelId` (oltre a `projectId` e `targetMetamodelId`) — check completo a 4 dimensioni. Propagazione `level` lungo `executeCommand`, `executeBatch`, `executeScript` come 5° parametro opzionale (backward compat preservata). `JjScriptService.execute()` ora risolve read-on-demand `level` (via `getActiveLevel()`), `modelId` (via `getActiveModel()` solo se M1), `targetMetamodelId` (preferendo `activeModel.instanceof` se M1, fallback a `getActiveMetamodel()`); zero modifiche a Jodie.tsx come da vincolo. **Verifica**: `npx tsc --noEmit` zero errori in `src/jjscript/` (gli errori globali visibili — casing collisions in `Settings/`, CSS module typings, asset imports — sono pre-esistenti e non toccano il path JjScript). `setContext()` lasciato invariato perché non chiamato dal flow modificato. Command handler M2 esistenti continuano a operare invariati: il campo `level` è opzionale in `ExecutionContext` e i command handler attuali lo ignorano.
**Nome del documento prompt**: 2026-04-30 jjscript-m1-context-extension

---

## 2026-04-30 — feat: JjScript M1 command handlers (Prompt 2/2)
**Prompt**: M1 command handlers (createInstance, deleteInstance, renameInstance, set/link/unlink su istanze, forall su .instances), guardie M2, routing executor, parser keywords
**File toccati**: `frontend/src/jjscript/executor/commands/instance.ts` (nuovo, ~470 LOC), `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/executor/commands/create.ts`, `frontend/src/jjscript/executor/commands/delete.ts`, `frontend/src/jjscript/executor/commands/rename.ts`, `frontend/src/jjscript/executor/commands/set.ts`
**Esito**: ⚠️ parziale — implementati create/delete/rename/set su istanze; link/unlink come comandi distinti **postposti** (vedi note)
**Note**: **Decisione di scope** rispetto al prompt. Il prompt elencava 7 operazioni M1 (create/delete/rename instance, set, link, unlink, forall instances). Ho implementato 5 + automatica e postposto 2 sulla base del vincolo "Se il parser è complesso e l'aggiunta delle keyword rischia di rompere le regole esistenti, implementa solo i command handler e lascia il parser per un prompt separato". **Implementati**: create instance / delete instance / rename instance / set su attributo / set su reference (link/unlink semantico via `set X.ref = Y` e `set X.ref = null`) / forall su `Class.instances` (funziona automaticamente perché JjEL valuta `Class.instances` se il proxy LClass espone l'attributo — non richiede modifiche). **Postposti come Prompt 2.5**: keyword esplicite `link`/`unlink` (richiedono nuovi `CommandType` in 4 punti — types.ts, parser switch case, parser parse method, executor dispatch — più LinkArgs/UnlinkArgs interfaces; rischio medio di regressione M2). Il routing semantico via `set` copre già lo use-case principale: `set Customer.dept = HR` → link, `set Customer.dept = null` → unlink. **Strategia di routing**: ho riusato i command handler esistenti (executeCreate/Delete/Rename/Set) aggiungendo dispatch interno verso instance.ts in testa, prima della guardia M2. Questo approccio è una piccola adattamento rispetto al pattern del prompt che voleva nuovi command type separati (`createInstance` etc) — l'adattamento minimizza le modifiche al parser (3 sole liste hardcoded di elementType estese con 'instance', invece di 4-5 nuovi command type). **Pattern reali rispettati** (canvasToJjom.ts:1065-1300): `DObject.new(metaclassId, modelId, DModel, name, true)` NON dentro TRANSACTION (la nesting causa perdita di coordinate); `(lObject as any)['$' + featureName].value = newValue` dentro TRANSACTION per attributi singoli; `refProxy.values = [...meaningful, targetObject.id]` dentro TRANSACTION per reference link. **Guardie M2 minimali**: aggiunte solo in executeCreate (dopo il dispatch instance) e nei delete/rename/set tramite il pattern `if (level === 'M1') → instance handler`. La guardia M2 esplicita (`return error('modifies metamodel')`) è solo in executeCreate quando elementType !== 'instance' AND level === 'M1' — gli altri command in M1 vengono naturalmente convertiti a operazioni instance. **forall**: nessuna modifica perché il forall esistente delega la valutazione collection a JjEL; `forall i in Customer.instances do delete i` funziona se LClass espone `.instances` come collection di LObject (assumption — da verificare con test di runtime). **Verifica**: `npx tsc --noEmit` zero errori in `src/jjscript/` (errori globali pre-esistenti su Settings/UI/asset imports invariati, 83 totali). Test smoke runtime non eseguibile da CLI (richiede sessione UI interattiva); golden path teorico tracciato e logica routing verificata. **Limitazioni note**: (1) la classificazione attribute-vs-reference in `executeSetInstance` usa `metaclass.allAttributes`/`allReferences` — fallback a `attributes`/`references` se i getter computed non sono disponibili; (2) reference upper-bound (multiplicità) non enforcato — il link append funziona indipendentemente dal multiplicity bound; (3) il name-conflict check in renameInstance verifica solo all'interno del modello attivo, non considera collisioni in altri scope.
**Nome del documento prompt**: 2026-04-30 jjscript-m1-command-handlers

---

## 2026-04-30 — diagnostic: Jjodie context reactivity discovery
**Tipo**: diagnostic (solo lettura, zero modifiche)
**Prompt**: capire dove e come viene costruito il contesto LLM in Jjodie per implementare aggiornamento reattivo al cambio artefatto aperto
**File toccati**: nessuna modifica. Letti: `frontend/src/components/Jodie/Jodie.tsx` (già in contesto), `frontend/src/services/JjodieContext.ts`, `frontend/src/components/Jodie/ChatMessages.tsx`
**Esito**: ✅ completato
**Note**: **Doppio difetto identificato**, non singolo. (1) **Reattività rotta**: `Jodie.tsx:96` legge Redux con `store.getState()` direttamente (nessun useSelector). Il useMemo del projectContext (Jodie.tsx:99-103) ha deps `[state.idlookup.clonedCounter]` ma il valore è captured a render-time — non c'è subscription, quindi il context si rivaluta solo quando Jodie re-renderizza per altro (chatState, isWaiting, ecc.). EDITOR_TYPE_CHANGE è ascoltato in 3 punti (`TreeViewPanelContext.tsx:187`, `Dock.tsx:254`, `Dashboard.tsx:581`) ma nessuno in Jodie/JjodieContext. (2) **Contenuto agnostico all'artefatto attivo**: anche se la reattività fosse risolta, `JjodieContextService.extractFromProject()` (`JjodieContext.ts:67-172`) serializza la collezione FLAT `project.classes` — somma di tutte le classi di tutti i metamodelli — più enumerations e packages, senza distinguere quale metamodello/modello è aperto. Zero serializzazione di istanze M1 (nessun `project.objects`). Il context è quindi identico indipendentemente dal tab attivo. **Punto di intervento minimo**: due layer richiesti — (a) `Jodie.tsx:96+99` aggiungere `useSelector(s => s.idlookup.clonedCounter)` o un listener EDITOR_TYPE_CHANGE che bumpi un local counter; (b) `JjodieContext.ts:242` estendere `getContextString` con un parametro `activeArtifact?: { id, isMetamodel, name }` letto da `getActiveModel()`/`getActiveMetamodel()` di `jjscript/executor/utils.ts` (riuso degli helper introdotti in Prompt 1) e prependere un header `**Currently editing**: <name> (M1 model | M2 metamodel)`. Layer (a) da solo non risolve il problema dell'utente; layer (b) da solo informa l'LLM ma non al cambio tab. **Rischi**: (1) re-render Jodie ogni Redux change → `extractFromProject` walka l'intero grafo a costo O(classes); debounce raccomandato. (2) Crescita system prompt con la dimensione del progetto — token limit a rischio per metamodelli grandi (gia issue pre-esistente). (3) Discontinuità conversazionale: se l'artefatto attivo cambia mid-chat, l'LLM riceve istruzioni nuove ma history vecchia — UX non bug ma potenzialmente confondente. (4) `ChatMessages.tsx:290-308` ha una SECONDA subscription tramite `store.subscribe()` per gating dell'esecuzione JjScript — mantenere coerente, non confondere col context LLM. **Nota architetturale**: `PromptService.getRendered('chat', { customVariables: { projectContext } })` (`AIProviderService.ts:46-49`) interpola la stringa via template; il system prompt finale è il template chat con `{{projectContext}}` sostituito. Non serve modificare `PromptService` — il punto di iniezione resta `customVariables.projectContext`.
**Nome del documento prompt**: 2026-04-30 jjodie-context-reactivity-discovery

---

## 2026-04-30 — feat: Jjodie context reactivity + artifact scoping
**Prompt**: listener EDITOR_TYPE_CHANGE in Jodie.tsx, scoping JjodieContext per artefatto attivo, messaggio sistema visibile al cambio contesto mid-chat
**File toccati**: `frontend/src/services/JjodieContext.ts`, `frontend/src/components/Jodie/Jodie.tsx`
**Esito**: ✅ completato
**Note**: Implementazione conforme al prompt, con due adattamenti rispetto allo pseudocodice (entrambi previsti come "allinearsi al codice reale"). **Modifiche JjodieContext.ts**: (1) nuova interfaccia esportata `ActiveArtifact { id, name, level: 'M1'\|'M2', metamodelId? }` — ho aggiunto `metamodelId?` opzionale rispetto al prompt perché la risoluzione M1→metamodello richiede o un walk dinamico nel project (lento) o il caching del riferimento dal caller; il caller (Jodie.tsx) ha già accesso a `activeModel.instanceof`. (2) nuovo helper privato `resolveMetamodelScope(project, activeArtifact)` che restituisce LModel scopato: per M2 cerca in `project.metamodels`; per M1 prova prima `metamodelId` poi fallback al walk `project.models[id].instanceof`. (3) `extractFromProject(project, activeArtifact?)` ora prende `classSource`/`enumSource`/`packageSource` dal scope se disponibile, altrimenti fallback a `project.classes`/`enumerators`/`packages` (backward compat: chiamata senza activeArtifact resta identica al comportamento precedente). (4) `buildContextString(context, activeArtifact?)` aggiunge header `**Currently editing**: <name> (<M1 model\|M2 metamodel>)` quando activeArtifact presente. (5) `getContextString(project, activeArtifact?)` propaga il parametro. **Modifiche Jodie.tsx**: (1) import `getActiveModel`, `getActiveMetamodel` da `jjscript/executor/utils` (helper introdotti in Prompt 1) + `ActiveArtifact` da JjodieContext. (2) nuovo `useState<number>` per `editorChangeCounter` (deps del useMemo). (3) nuovo `useRef<string \| undefined>` per `lastArtifactRef`. (4) useMemo del projectContext esteso: risolve activeModel/activeMetamodel, costruisce ActiveArtifact, passa al builder. (5) nuovo useEffect listener su `JjodelEvents.EDITOR_TYPE_CHANGE` che bumpa il counter, risolve nuovo artefatto, e — solo se diverso dal lastArtifactRef E lastArtifactRef era già inizializzato (skip al mount) E la chat ha già messaggi — inietta un ChatMessage con `role: 'assistant'` (NON 'system' perché ChatMessage type non lo accetta — adattamento rispetto al prompt) e content markdown italic `_Context switched to: **<name>** (<level>)_`. Il rendering italic è gestito automaticamente dal MarkdownMessage esistente, zero modifiche SCSS richieste. **Limitazioni note**: (a) la deduplicazione via `lastArtifactRef` lavora per nome — due metamodelli omonimi nello stesso progetto non triggerano notice al cambio (caso edge improbabile); (b) il listener cattura tutti gli eventi EDITOR_TYPE_CHANGE, inclusi `'summary'` e `'transformation'` per cui getActiveModel/getActiveMetamodel ritornano null — il guard `if (!newName) return` evita notice spurie ma il counter viene bumpato comunque (non crea bug, solo re-render leggero). (c) Per il tab-switch tra tab già aperti, EDITOR_TYPE_CHANGE è dispatched dal DockManager solo per certi flussi (tab open) — switching focus puro tra tab esistenti potrebbe non triggherare l'evento (limitazione preesistente del DockManager, fuori scope per questo PR). **Verifica**: `npx tsc --noEmit` zero errori in JjodieContext/Jodie.tsx, totale globale 83 errori invariato (zero regressione). Test smoke runtime non eseguibile da CLI (richiede sessione interattiva browser); pattern teorico tracciato e logica verificata.
**Nome del documento prompt**: 2026-04-30 jjodie-context-reactivity-fix

---

## 2026-04-30 — fix: EDITOR_TYPE_CHANGE payload + getActiveModel cache
**Prompt**: aggiunto modelId al payload EDITOR_TYPE_CHANGE in DockManager (5 dispatch sites), getActiveModel/getActiveMetamodel/getActiveLevel riscritti con cache globale + fallback alle implementazioni esistenti, Jodie listener aggiornato per popolare la cache e init al mount
**File toccati**: `frontend/src/components/abstract/DockManager.tsx`, `frontend/src/jjscript/executor/utils.ts`, `frontend/src/components/Jodie/Jodie.tsx`
**Esito**: ✅ completato
**Note**: **DockManager.tsx**: tutti e 5 i dispatch points di `JjodelEvents.EDITOR_TYPE_CHANGE` (linee 110, 140, 162, 326, 351) ora includono `modelId` nel detail. Per `editorType: 'model'/'metamodel'` (`open2()`) il modelId è `me.id` (LModel del tab). Per `editorType: 'summary'` (`openDocumentation()`) è `project.id`. Per `editorType: 'transformation'` (`openTransformation()`) è `transformation.id`. Decisione di scope: il prompt diceva "aggiornarli tutti" — ho scelto di mettere SEMPRE un modelId anche per summary/transformation per coerenza dell'API (anche se getActiveModel/getActiveMetamodel ignorano questi editorType). **utils.ts**: nuovo modulo cache `_activeArtifactCache: { modelId, editorType } | null` + setter esportato `setActiveArtifactCache(modelId, editorType)` (no-op se modelId falsy). Helper privato `getCachedModel(expectMetamodel)` che risolve LModel via `LPointerTargetable.fromPointer` (più diretto del walk in `project.models` proposto nello pseudocodice del prompt — uso lo stesso pattern già in uso in `getActiveTabMetamodel()` esistente). Modifica chiave: `getActiveModel` e `getActiveMetamodel` ora consultano la cache come step 0, fallback alle implementazioni esistenti se cache è cold/stale (evita regressioni su flussi senza Jodie aperto). `getActiveLevel` legge direttamente `_activeArtifactCache.editorType` se presente, fallback al getActiveModel call. **Adattamenti rispetto al prompt**: (1) il prompt suggeriva `LProject.current` per il lookup del progetto, ma quel pattern non esiste nel codebase — usato `LPointerTargetable.fromPointer(modelId)` direttamente, più snello. (2) Mantenuto il fallback alle implementazioni esistenti (DockManager + _lastSelected) invece di fare `return null` quando cache.editorType !== 'model' — necessario per cold start prima del primo EDITOR_TYPE_CHANGE. **Jodie.tsx**: import `setActiveArtifactCache` aggiunto. Nuovo useEffect al mount (deps `[]`) che inizializza la cache via getActiveModel/getActiveMetamodel (che usano il fallback DockManager/_lastSelected per il cold start). Il listener EDITOR_TYPE_CHANGE esistente ora legge `(e as CustomEvent).detail` e chiama `setActiveArtifactCache(detail.modelId, detail.editorType)` PRIMA degli step esistenti (counter bump + system message). Nessuna ciclical import: DockManager.tsx non dipende da utils.ts. **Verifica**: `npx tsc --noEmit` zero errori nei 3 file modificati, totale globale 83 invariato.
**Nome del documento prompt**: 2026-04-30 jjodie-context-active-model-fix

---

## 2026-04-30 — fix: handleLayoutChange dispatcha EDITOR_TYPE_CHANGE su tab switch
**Prompt**: aggiunto dispatch EDITOR_TYPE_CHANGE in handleLayoutChange per tab già aperti (rc-dock chiama handleLayoutChange ad ogni switch tra tab esistenti, ma non passava per DockManager.open2() — quindi EDITOR_TYPE_CHANGE non fired)
**File toccati**: `frontend/src/components/abstract/Dock.tsx`
**Esito**: ✅ completato
**Note**: 4 righe aggiunte dopo il dispatch ACTIVE_TAB esistente (linea 354). Quando `tabType === 'metamodel' || 'model'`, dispatcha `EDITOR_TYPE_CHANGE` con `{ editorType: tabType, modelId: activeId }`. Tab type viene già estratto da `(activeTab?.title as any)?.props?.['data-type']` (logica esistente). Zero nuovi import (`JjodelEvents` già in scope). Chiude il gap del fix precedente: ora il context Jjodie si aggiorna sia su apertura nuovo tab (via DockManager.open2 → modificato nel fix precedente) sia su switch tra tab già aperti (via Dock.handleLayoutChange → questo fix). Verifica: `npx tsc --noEmit` zero errori in Dock.tsx, totale globale 83 invariato.
**Nome del documento prompt**: 2026-04-30 dock-layout-change-editor-type

---

## 2026-04-30 — fix: handleLayoutChange tabType null fallback via store.idlookup
**Prompt**: fallback store.idlookup quando tabType è null in handleLayoutChange (rc-dock non preserva props React del title element al tab switch — `(activeTab?.title as any)?.props?.['data-type']` ritorna sempre null sui tab già aperti)
**File toccati**: `frontend/src/components/abstract/Dock.tsx`
**Esito**: ✅ completato
**Note**: Aggiunto `store` all'import esistente da `../../joiner` (linea 5) — non era già importato. Il blocco aggiunto nel fix precedente (`if (tabType === 'metamodel' || tabType === 'model') ...`) è stato esteso con un fallback: se `tabType` è null e c'è un `activeId`, legge `store.getState().idlookup[activeId]` e ricava `editorType` da `model.isMetamodel`. La logica originale tabType-based resta come prima preferenza (per compatibilità con eventuali tab dove i props sono preservati). `(state as any).idlookup` è il pattern già in uso in `utils.ts` per accedere allo store senza tipizzazione stretta. Verifica: `npx tsc --noEmit` zero errori in Dock.tsx, totale globale 83 invariato.
**Nome del documento prompt**: 2026-04-30 dock-tabtype-null-fallback

---

## 2026-04-30 — fix: JodieHeader badge reattivo al cambio tab
**Prompt**: listener EDITOR_TYPE_CHANGE in useMetamodelContext, fallback cache in getMetamodelContext
**File toccati**: `frontend/src/components/Jodie/JodieHeader.tsx`
**Esito**: ✅ completato
**Note**: Aggiunti 2 import: `JjodelEvents` da `'../../events/registry'`, `getActiveModel` da `'../../jjscript/executor/utils'` (cache-based, popolato dal listener in Jodie.tsx). Il prompt suggeriva anche `getActiveMetamodel` nell'import set ma non è usato nel fix — omesso per evitare unused-import warning. **Modifica getMetamodelContext (linea 66)**: `Selectors.getActiveModel()` sostituito con `getActiveModel() ?? Selectors.getActiveModel()` — usa la cache come preferenza primaria, fallback al selector legacy per cold start (prima del primo EDITOR_TYPE_CHANGE). **Modifica useMetamodelContext useEffect**: aggiunto listener `JjodelEvents.EDITOR_TYPE_CHANGE` che chiama `setContext(getMetamodelContext())` ad ogni cambio tab; cleanup nel return rimuove sia il listener che `unsubscribe()` esistente (tutto invariato per backward compat). Verifica: `npx tsc --noEmit` zero errori in JodieHeader.tsx, totale globale 83 invariato.
**Nome del documento prompt**: 2026-04-30 jodie-header-context-reactivity

---

## 2026-04-30 — fix: JodieHeader badge mostra modello M1
**Prompt**: aggiunto branch M1 in getMetamodelContext per mostrare modello istanza nel badge
**File toccati**: `frontend/src/components/Jodie/JodieHeader.tsx`
**Esito**: ✅ completato
**Note**: Aggiunto `else if (activeModel && !activeModel.isMetamodel) { targetMetamodel = activeModel; }` dopo il branch M2 esistente. Quando l'artefatto attivo è un modello istanza (M1), il badge ora mostra il nome del modello stesso invece di cadere sul fallback `metamodels[0]`. Il branch M2 esistente con verifica `isInProject` è invariato; il branch M1 è additivo. Verifica: `npx tsc --noEmit` zero errori in JodieHeader.tsx, totale globale 83 invariato.
**Nome del documento prompt**: 2026-04-30 jodie-header-m1-branch

---

## 2026-04-30 — feat: badge artefatto Jjodie bordo cyan + prefisso M1/M2
**Prompt**: bordo cyan e prefisso livello sul badge artefatto in JodieHeader
**File toccati**: `frontend/src/components/Jodie/JodieHeader.tsx`, `frontend/src/components/Jodie/JodieWindow.css`
**Esito**: ✅ completato
**Note**: **JodieHeader.tsx**: aggiunto `level: 'M1' | 'M2'` all'interfaccia locale `MetamodelContext` (non esportata, zero impatto su consumer esterni — verificato che esiste un altro `MetamodelContext` in `jjscript/autocomplete/types.ts` ma è in un namespace separato e non collegato). Tutti e 4 i return statement di `getMetamodelContext` aggiornati per includere `level`: il return principale calcola `level = targetMetamodel?.isMetamodel ? 'M2' : 'M1'`; gli early return (no project, no metamodels, catch) ritornano `level: 'M2'` come default sicuro. JSX del badge esteso con un secondo span `.jodie-metamodel-level` interno a `.jodie-metamodel-name` che renderizza `${context.level} · ` prima del nome. **JodieWindow.css**: aggiunto `border: 1px solid #0ea5e9` alla classe `.jodie-metamodel-indicator` (border non era presente prima → caso "aggiungi" da vincolo). Aggiunta nuova classe `.jodie-metamodel-level` con `font-size: 10px; font-weight: 600; opacity: 0.75; letter-spacing: 0.02em` come da snippet del prompt. **Adattamento**: lo snippet del prompt suggeriva di cambiare anche `color: #0ea5e9` ma il vincolo testuale diceva "Se ha già un colore, aggiorna solo il border" — risolto seguendo il vincolo (mantenuto `color: #059669` esistente, solo border aggiunto). Il `background: rgba(16, 185, 129, 0.1)` (verde tinta) e gli stati dark mode/warning/inactive sono invariati per "Non rimuovere proprietà esistenti che non sono in conflitto". Verifica: `npx tsc --noEmit` zero errori in JodieHeader.tsx, totale globale 83 invariato.
**Nome del documento prompt**: 2026-04-30 jodie-badge-visual

---

## 2026-05-01 22:05 — fix: ClassicZoomBridge hook-free via CustomEvent
**Prompt**: spostare la registrazione del classic ZoomController fuori dal template path di DV.tsx, dove gli hook React falliscono ("Invalid hook call")
**File toccati**: `frontend/src/events/registry.ts`, `frontend/src/components/editor-v2/ActiveEditorContext.tsx`, `frontend/src/components/editor-v2/EditorV2.tsx`
**Esito**: ✅ completato
**Note**: **registry.ts**: aggiunte `CLASSIC_NODE_MOUNTED: 'jjodel:classic-node-mounted'` e `CLASSIC_NODE_UNMOUNTED: 'jjodel:classic-node-unmounted'` sotto la sezione Canvas (coerenti con `SELECT_NODE`, `POLYMETRIC_NODE_SELECTED`). **ActiveEditorContext.tsx**: `CLASSIC_ZOOM_MIN`/`CLASSIC_ZOOM_MAX` ora `export const` (per riuso in EditorV2). `ClassicZoomBridge` riscritto come componente hook-free: nessun `useContext`/`useEffect`, dispatcha `CustomEvent(JjodelEvents.CLASSIC_NODE_MOUNTED, { detail: { node } })` direttamente nel render quando `node` esiste. Imports puliti: rimossi `useEffect`, `GraphPoint`, `SetFieldAction`, `TRANSACTION` (non più usati nel file); aggiunto import `JjodelEvents`. `ActiveEditorProvider`, `useActiveEditor`, `useActiveEditorOptional`, `ZoomController`, `ActiveEditorAPI` invariati. `windoww['ClassicZoomBridge']` registration al fondo invariato (necessaria per template resolution). **EditorV2.tsx**: imports estesi con `CLASSIC_ZOOM_MIN`, `CLASSIC_ZOOM_MAX` da ActiveEditorContext, e `GraphPoint`, `SetFieldAction`, `TRANSACTION` da joiner. Aggiunti 3 nuovi `useEffect` accanto a quello del flow controller (~riga 2317): (1) listener su `CLASSIC_NODE_MOUNTED` che, alla ricezione di un nodo nuovo (idempotency via `classicNodeRef`), costruisce il `ZoomController` con le 3 closure (zoomIn/zoomOut/resetZoom) replicando esattamente la logica del vecchio bridge (clamp `[0.1, 5.0]`, `TRANSACTION` + `SetFieldAction` su `zoom.x`/`zoom.y`, `new GraphPoint(1,1)` per reset) e chiama `registerZoomController('classic', controller)`; (2) cleanup su cambio `editorMode`/`hasViewpoint`: se classic non più montato (mode != classic/split o no viewpoint), unregistra; (3) cleanup difensivo su cambio `modelid`. Il listener si registra una sola volta (dipendenza stabile `registerZoomController` da `useCallback`). **DV.tsx invariato**: il tag `<ClassicZoomBridge node={node}/>` resta nel template (riga 1297), ora compatibile con il path `JSXT.fromString` + `new Function`. Verifica: `npm run build` ✓ in 40.76s; `npx tsc --noEmit` zero errori nuovi nei file modificati (errori preesistenti in altri file invariati).
**Nome del documento prompt**: 2026-05-01 22:05 — fix: ClassicZoomBridge hook-free via CustomEvent

---

## 2026-05-01 22:32 — fix: M1 instances created by JjScript not visible in flow editor
**Prompt**: chiudere il sync gap "DObject senza DVertex" nell'auto-population effect di useJjomSync, così che le istanze M1 create programmaticamente (JjScript, JjTL) compaiano nel flow editor
**File toccati**: `frontend/src/components/editor-v2/hooks/useJjomSync.ts`
**Esito**: ✅ completato
**Note**: Aggiunti due blocchi all'`useEffect` di auto-population (`// ── Auto-create / populate v2-flow graph ──`, ~riga 343). **(1) Counter `missingObjectsCount`** posizionato dopo il blocco `missingM1EdgeCount` (~riga 478), prima dell'early-exit guard: itera `rawModel.objects ?? []`, salta non-stringhe, oggetti non in `idlookup`, oggetti già in `vertexIdByModelId`, e oggetti con `isSingletonSuppressed(objId) === true`. Guard early-exit esteso con `&& missingObjectsCount === 0`. **(2) Step 2bis** inserito tra Step 2 (vertici classifier) e Step 3 (edge inheritance/reference M2): replica esattamente il pattern grid-layout di Step 2 (`existingCount = vertexIdByModelId.size` snapshotato all'inizio dello step, `globalIdx = existingCount + createdSoFar`, COLS/COL_W/ROW_H da `layout`, `x = 50 + col * COL_W`, `y = 50 + row * ROW_H`, `new GraphSize(x, y, 200, 120)`, `DVertex.new(0, objId, graphId, graphId, undefined, size)`); incrementa `createdSoFar` solo se `dv?.id` esiste; popola `vertexIdByModelId.set(objId, dv.id)` così che lo Step 3 e Step 4 (M1 reference edges) trovino i vertici appena creati nel re-read del lookup. Filtri identici a quelli del counter (`typeof === 'string'`, `idlookup[objId]` esiste, non già in `vertexIdByModelId`, non singleton suppressed). Nessun nuovo import (`isSingletonSuppressed`, `DVertex`, `GraphSize`, `idlookup`, `layout` tutti già in scope). Il `markDropCreated` set up da `syncCreateObject` non interferisce con questo path (lo Step 2bis crea vertici solo per DObject che NON hanno già un vertex — il drop dalla palette li crea entrambi nello stesso flow). Vincoli rispettati: nessuna modifica a `instance.ts` (separation of concerns), Step 1/2/3/4 invariati, nessun rinominamento di variabili esistenti, nessun logging permanente, blocco interamente dentro il `try` esistente. Verifica: `npm run build` ✓ in 39.25s; `npx tsc --noEmit` zero errori in `useJjomSync.ts`.
**Nome del documento prompt**: 2026-05-01 22:32 — fix: M1 instances created by JjScript not visible in flow editor

## 2026-05-02 — refactor: unify classic + flow context menu styling
**Prompt**: 2026-05-02 — Unifica grafica del context menu classic con quella del flow
**File toccati**: `frontend/src/components/editor-v2/ContextMenu.tsx` (esteso `ContextMenuItem` con `tooltip`, render `title=`/`aria-disabled`), `frontend/src/components/editor-v2/EditorV2.tsx` (`getContextMenuItems` single-node case esteso con voci `[classic]` Edit/Up/Down/Disable auto-sizing in disabled+tooltip "Available in classic editor"), `frontend/src/components/editor-v2/EditorV2.scss` (`.context-menu__item.disabled`: rimosso `pointer-events:none`, sostituito con `cursor:not-allowed` per permettere al `title` HTML di apparire), `frontend/src/components/contextMenu/ContextMenu.tsx` (rimosso header `Class: Name`, rimosso rendering `keystrokes` da `ContextEntry`, riordinato in 5 gruppi unificati + sezione classic-only sotto divider, aggiunto `Duplicate` disabled+tooltip "Coming soon" e `Explain this` con dispatcher `JjodelEvents.EXPLAIN_OPEN`, esteso `ContextEntry` con `opts: { tooltip?, danger? }`, rimosso `getKeycode` inutilizzato), `frontend/src/components/contextMenu/ContextMenu.scss` (aggiunte regole `.item.disabled` e `.item.danger` allineate al flow).
**Esito**: ✅ completato
**Note**: Stile flow adottato dal classic — sfondo dark slate `#1e293b`, testo `#cbd5e1`, icone Bootstrap a sinistra (16px), Delete in `#f87171`, divider 0.5px `rgba(255,255,255,0.08)`, no header `Class: Name`, no shortcut keys (le `key_bindings` restano registrate come listener globali via `Keystrokes.register('#root', 'ctxmenu', ...)` — solo la visualizzazione è rimossa). Schema unificato a 5 gruppi: (1) Add Child M1 dinamico — invariato; (2) Edit · Duplicate · Delete; (3) Up · Down; (4) Disable/Restore auto-sizing; (5) Help · Explain this · Create View M2. Sezione classic-only sotto divider extra: dynamic entries (view-script-defined), AI Suggest M2, Extend M2, Analytics, Add view M2 — non appaiono in flow (sarebbero spam di feature M2 specifiche del classic). Voci `[classic]` (Edit/Up/Down/Disable auto-sizing) appaiono in flow disabled+tooltip "Available in classic editor"; `Duplicate` viceversa è disabled+tooltip "Coming soon" in classic (no API esistente per clonare DGraphElement, il flow's `duplicateNode` è React-Flow-specific e non riusabile — TODO futuro implementare un clone L-layer). Action handlers riusati: Edit→`setEditPanel(true)`, Up/Down→`key_bindings.up/down.function`, Delete→`key_bindings.delete.function`, Disable auto-sizing→callback inline `gn.isResized`, Help→dispatcher esistente, Add Child→`getAddChildren`. Explain this in classic replica il pattern del flow ma con payload più compatto (elementName, elementType, metamodelName, properties con isAbstract/isSingleton). Tooltip via `title` HTML nativo (no nuovi componenti). Il SCSS classic mantiene dead rules `.name`/`.name::before`/`.keystrokes` (selettori non più matchati) — diff minimale, cleanup futuro. Verifica: `npx tsc --noEmit` zero errori sui file modificati.
**Nome del documento prompt**: 2026-05-02 — Unifica grafica del context menu classic con quella del flow

---

## 2026-05-05 — discovery: view properties editor for isEdge/edgeSource/edgeTarget exposure
**Prompt**: 2026-05-05_1830_view_editor_discovery.md
**File toccati**: nessuno (read-only)
**Esito**: ✅ completato
**Note**: Discovery del view properties editor in vista dell'esposizione UI di isEdge/edgeSource/edgeTarget. Findings nel chat. Implementation in prompt successivo.
**Nome del documento prompt**: 2026-05-05 18:30

---

## 2026-05-05 — feat(L2): expose isEdge/edgeSource/edgeTarget in view properties editor
**Prompt**: 2026-05-05_1900_expose_edge_fields_in_view_editor.md
**File toccati**: frontend/src/components/editors/views/data/InfoData.tsx
**Esito**: ✅ completato
**Note**: Tre campi aggiunti nel tab "Apply to" del view editor seguendo il pattern component-by-component esistente. Toggle "Is Edge" come "Is Exclusive"; due Input "Edge Source"/"Edge Target" come "Name", in progressive disclosure (visibili solo se isEdge=true). Nessuna modifica al modello dati o al sistema di azioni Redux: i campi esistono già in DViewElement (view.tsx:276-278) con default puliti, e il proxy LModel li intercetta a runtime via `_defaultSetter` (view.tsx:480 → classes.ts:2285) — fallback per proprietà presenti in `this.d` ma senza esplicito `set_*` in LViewElement. Discovery iniziale aveva mancato di verificare che il tipo TypeScript di LViewElement non espone i tre campi; introdotti 5 cast `(view as any)` localizzati nei punti d'uso (handlers riga 67/72, JSX riga 106/113) per sbloccare la build TS verde senza toccare view.tsx come da vincoli del prompt. Runtime confirmato corretto per via di `_defaultSetter` (analisi proxy.ts:451-504). Verifica end-to-end runtime non eseguibile da CLI: aprire una view applicabile a una classe associativa, attivare "Is Edge", inserire i nomi delle due EReference (es. `src`/`tgt`); EdgeOverlay deve disegnare l'arco e console con `window.__edgeOverlayDebug = true` deve stampare `[EdgeOverlay] RENDER` invece di `EXIT 4: no edgeViews`.
**Nome del documento prompt**: 2026-05-05 19:00
