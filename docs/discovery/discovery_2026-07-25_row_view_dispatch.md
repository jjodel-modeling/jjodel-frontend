# Discovery: dispatch polimorfico delle righe nei compartment IR (kind `row`)

**Data**: 2026-07-25. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`. Nessun file sorgente modificato, nessuna Fase 2. HARD STOP a report scritto + commit dei soli due file docs.

## Obiettivo

Mappare il terreno PRIMA della spec e della decisione finale su una proposta architetturale (di Alfonso, **non** da implementare qui): un dispatch polimorfico stile `DefaultNode` per le righe dei `fieldCompartments`. Il compartment dichiara solo su quali children iterare (filtro di kind); ogni child viene reso dalla view risolta per la SUA metaclasse concreta, con lo stesso matching dei vertici, ma in un **nuovo contesto di rendering**: un kind `row` (view inline testuale, niente shape/badge/resize). Fallback a cascata: row view esatta sul sottotipo > row view ereditata > riga di default built-in.

Perimetro già deciso a monte: solo containment children (caso `ownedFeatures` = composizione). Reference non-containment e parametri di `Operation` sono fuori scope.

Questa discovery risponde alle 8 domande obbligatorie del prompt (in coda al report, §Domande) e produce il perimetro di un'implementazione ipotizzabile con i rischi.

## Metodo

Lettura diretta del substrato IR (schema, resolver, compiler, renderer, innesto, containment, ReadCtx, defaults, authoring) + tre fan-out read-only:
- classic `DefaultNode` (catena di risoluzione view);
- critical zone: decisione nodi top-level + assorbimento graphVertex;
- censimento completo dei siti kind-aware + remnants del vocabolario tagliato in B2a.

## File letti / analizzati (path completi)

**Substrato IR (letti integralmente):**
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — schema TS del subset v1 interpretato.
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` — hook React `useIRView` + wiring store.
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` — risoluzione pura (index build + ordinamento).
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` — `compileView`/`compileEdgeView`, accessor/predicati/conditional compilati.
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` — interprete/renderer del contenuto nodo.
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` — `validateIR` (gate write authoring).
- `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` — modello containment + hull + collapse.
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` — interfaccia `ReadCtx`, `findFeatureRaw`, `navigateRefHop`, `makeDrawReadCtx`.
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` — default views IR + delega migrati.
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` — innesto del render IR nel nodo.
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` — editor authoring dei compartment.

**Prior art (letto):**
- `docs/discovery/discovery_2026-07-21_cross_object_render_lproxy.md` — fix render multi-hop cross-oggetto.

**Analizzati via fan-out (agenti), verificati per file:riga:**
- classic: `frontend/src/common/DV.tsx`, `frontend/src/redux/selectors/selectors.ts`, `frontend/src/joiner/classes.ts`, `frontend/src/model/logicWrapper/LModelElement.tsx`, `frontend/src/model/dataStructure/GraphDataElements.tsx`, `frontend/src/common/UX.tsx`, `frontend/src/common/graphComponentRegistry.ts`, `frontend/src/common/Defaults.ts`, `frontend/src/redux/store.tsx`.
- critical zone / presentazione: `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (solo lettura), `frontend/src/components/editor-v2/utils/jjomTransformers.ts`, `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts`, `frontend/src/components/editor-v2/viewpoint/ir/IRContainmentHulls.tsx`, `frontend/src/components/editor-v2/EditorV2.tsx`.
- census kind: `frontend/src/components/editors/views/ViewData.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx`, `frontend/src/components/editors/Info.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts`, i test `__tests__/`.

---

## Findings

### 1. Classic `DefaultNode`: risoluzione, fallback, reattività per-child

**Caveat strutturale importante**: il perimetro di **rendering** classic (`frontend/src/graph/…`, incl. `GraphElementComponent` e `DefaultNode`) è stato **cancellato** nel commit `e86c276f8` ("purge classic barrel and delete classic editor perimeter graph/"). Restano vivi nel working tree: (a) il motore di **risoluzione/scoring** (condiviso, in `redux/selectors` + `joiner/classes.ts`); (b) i **template JSX** delle default view (`common/DV.tsx`) che referenziano `<DefaultNode>`. I componenti connessi per-nodo esistono solo in git history. **L'analogo vivo per il dispatch per-oggetto oggi è il resolver IR (`resolveIRView`)**, non il classic.

**Risoluzione della view (vivo):**
- Entry: `selectors.ts:609` `getAppliedViewsNew(...)` → `selectors.ts:495` `updateScores(...)` itera ogni `DViewElement` e calcola tre gate indipendenti: match viewpoint (`:556-559`), match metaclasse `matchesMetaClassTarget` (`:356-373`), condizione JS/OCL (`:583`, `:596`).
- Specificità metaclasse: `selectors.ts:356-373` → `ViewEClassMatch` (`classes.ts:4007-4020`): `IMPLICIT_MATCH=1` (view senza `appliableToClasses`, wildcard), `INHERITANCE_MATCH=1.5`, `EXACT_MATCH=2`; viewpoint `VP_Default=1`, `VP_Explicit=2`.
- Score combinato: `selectors.ts:417` `getFinalScore`, formula `:434` = `viewPointMatch * metaclassScore * pvScore * explicitprio + defaultViewMalus` (dove `pvScore` è il boost se la view è nei `subViews` della view padre, `:421-422`; `explicitprio` da `explicitApplicationPriority`, `:424-429`).
- Selezione: `classes.ts:4072` `NodeTransientProperties.sort()`: le view esclusive competono per `tn.mainView = mainViews[0]?.view` (score desc, `:4087/:4092`), le non-esclusive impilano come decoratori (`tn.stackViews`, `:4094`).

**Fallback quando nessuna view matcha:** è un `DViewElement` reale singleton `Pointer_ViewFallback` (`Defaults.ts:67`; creato in `store.tsx:461`), il cui JSX (`DV.tsx:562` `fallbackView()` → template `void()` `DV.tsx:1331-1339`) rende il **nome intrinseco**: `"{data.name} didn't match any primary view"`. La sostituzione del main view mancante col fallback avveniva in `graphElement.tsx` `mapViewStuff` (git-only, deleted).

**Reattività per-child:** SÌ, ogni child era un **componente React separato con propria subscription redux** (per-component reactivity), non un render monolitico:
- I template emettono `data.children.map(c => <DefaultNode key={c.id} data={c}/>)` (`DV.tsx:1361`, `:1383`); il bridge JSX→component risolve ciascuno a `windoww.Components.DefaultNode({data:c, key})` (`UX.tsx:88`).
- `DefaultNode` era una class component `connect()`-ata con proprio `mapStateToProps` (deleted `graph/defaultNode/DefaultNode.tsx`), che chiamava `getAppliedViewsNew` per ricomputare indipendentemente le proprie applied view.
- Remnants vivi: registry per-nodo `graphComponentRegistry.ts:6` (chiave = node id), invalidazione mirata `graphComponentRegistry[nid]?.forceUpdate()` in `classes.ts:4192/:4196`.

**`data.children`:** collezione di containment. `LModelElement.get_children` (`LModelElement.tsx:731`) = merge delle sub-collezioni **eccetto annotazioni** (`:182`). Per M1 `LObject.get_children` (`:5876`) = gli slot `LValue`, dedup (`new Set`, `:5877`), ordinati per feature order della metaclasse, e (se metaclasse non `partial`) **filtrati alle feature conformi** via `meta.allChildren` (`:5881-5885`).

### 2. Substrato IR per i children del graphVertex

**I children di un graphVertex restano nodi ReactFlow di prima classe e top-level**; NON c'è reparenting né rendering ricorsivo dentro il padre. Il container è un **hull decorativo** disegnato intorno ai children. Dichiarato nel docstring: `irContainment.ts:4-9` ("children keep absolute canvas coordinates and top-level RF nodes; the container is visualized as a hull … True RF reparenting … is deferred: it changes the coordinate semantics of the canvas→JjOM write-back (critical zone)").

- Array nodi top-level costruito nel **sync layer** (critical zone): `useJjomSync.ts:1197-1227` (popolazione iniziale) e `:1264-1285` (incrementale), via `jjomVertexToRFNode` (`jjomTransformers.ts:345`) che dispatcha su `className` (DClass/DEnumerator/DPackage/DObject). **La decisione è graph-membership-driven, NON IR-view-driven**: ogni DObject con un DVertex nell'LGraph diventa nodo top-level a prescindere dalla view del padre.
- Assorbimento/hull = **filtro di presentazione** puro `useIRContainment` (`useIRContainment.ts:69-174`), invocato in `EditorV2.tsx:1287`; l'output `irContainment.nodes` è ciò che ReactFlow renderizza (`EditorV2.tsx:3823-3824`) e ciò che l'hull layer consuma (`IRContainmentHulls.tsx`, wiring `EditorV2.tsx:3874-3878`). Contratto pass-through: ritorna gli stessi ref quando non ci sono graphVertex IR (`useIRContainment.ts:6-9,118-121`).
- `childFilter` applicato in `irContainment.ts:95-98` dentro `buildContainmentModel`: `containmentChildren(...).filter(childId => cv.containment.childFilter(readCtx, childId))`. Il predicato è compilato in `irCompile.ts:305-309`; `isKind State` → `irCompile.ts:187-197` → `ctx.isKindOf(id, cls)`. Effetto del filtro: sola appartenenza a `childrenOf`/`parentOf` (membership hull + estensione subtree collapse), **non** rimozione dal top-level.
- **Unica soppressione top-level esistente = collapse.** `decorateNodes` setta `hidden:true` sui nodi il cui objectId è nel set nascosto (`irContainment.ts:144-155`); il set è calcolato da `computeHidden` che cammina i subtree collassati (`:110-124`), driven da `getCollapsedSet()` (`useIRContainment.ts:134-135`). In stato espanso (default) **nessun child è soppresso**.

### 3. Resolver IR e parametrizzabilità per contesto (vertex vs row)

Il matching vive in `irResolveCore.ts`. Ordine (spec v1.2 sez. 2): `priority` > specificità (esatta `2` / ereditata `1` / wildcard `0`) > declaration order.
- Index build `getIRIndex` (`:71-159`): per ogni viewelement del viewpoint attivo con campo `ir`, dispatcha per kind in **bucket separati per contesto**: `byMetaclass`/`wildcard` (vertex+graphVertex, `:120/:131-139`), `edgeByMetaclass`/`edgeWildcard` (reference-as-edge, `:108-116`), `objectAsEdgeByMetaclass` (object-as-edge, `:100-107`).
- Enumerazione candidate: `resolveIRView` (`:165-202`) legge `index.byMetaclass.get(selfName)` (esatta) + ancestry (`:181-184`) + `wildcard` (`:185`), poi ordina e valuta i predicati in ordine (`:194-200`).
- **Il comparatore di ordinamento è identico ma duplicato inline 3 volte**: `resolveIRView` (`:188-192`), `resolveEdgeView` (`:239-243`), `resolveObjectAsEdgeView` (`:273-277`).

**Fattorizzabilità per un contesto `row`**: SÌ, senza duplicare la logica di priorità/specificità *concettuale* — un contesto `row` = una nuova coppia di bucket (`rowByMetaclass`/`rowWildcard`) in `IRViewpointIndex` + un `resolveRowView` che riusa lo **stesso** comparatore e lo stesso `classAncestryNames`. Il routing per kind in `getIRIndex` è l'unico punto che cresce. **Nota di debito**: poiché il comparatore non è oggi estratto in un helper condiviso, un `resolveRowView` sarebbe una **4ª copia** dello stesso sort a meno di un piccolo refactor additivo (estrazione del comparatore). La logica di specificità (ancestry esatta/ereditata/wildcard) è già riusabile as-is.

### 4. Renderer dei fieldCompartments oggi

**È un map monolitico dentro l'interprete, NON un componente per riga.** `IRNodeContent.tsx`:
- Le righe vengono da un unico `useSelector` `compartmentSig` (`:44-65`) che legge SOLO le feature del **self** (`dObject.features`, gli slot DValue del self). Ogni slot è classificato `A`/`R` a seconda che `feat.className === 'DReference'` (`:55`); il valore reso per una reference è il **nome dei target** joinato con `, ` (`:58-61`).
- Render: `compiled.fieldCompartments.map(fc => … source.map(row => <div className="ir-row"> … fc.segments.map(seg => switch(seg.kind)) ))` (`:179-231`). Nested map inline; nessun componente per riga; ogni riga è keyed sul `objectId` del **self**.
- Conseguenza (coincide con la limitazione del prompt): `source:{from:'references'}` produce **una riga per l'intero slot reference del self** (i nomi dei target), senza poter scegliere quale reference né formattare le feature dell'oggetto target.

**Cosa manca perché una riga sia un componente legato a un ALTRO oggetto (il child) con reattività propria:**
1. Estrarre la `<div className="ir-row">` in un componente `IRRow` che riceve `childObjectId` + la sua row view compilata.
2. Dare al componente-riga una **subscription propria** keyed sul `childObjectId` (+ dependency set della row view risolta), speculare a `useIRView` (`irResolve.ts:45-94`) ma radicata sul child. Oggi `IRNodeContent` non ha alcun punto in cui una riga sia legata a un objectId diverso dal self.
3. Il dispatch: iterare i containment children (filtrati), risolvere la row view di ciascuno (nuovo contesto nell'index) e renderla col componente child-bound.

**Fix cross-object del 2026-07-21 — LANDED**: commit `a479e489d` "fix: navigate IR multi-hop paths by id on both ReadCtx backends (shared navigateRefHop)". `irReadCtx.ts:70-82` `navigateRefHop` è la single source of truth, consumata sia da `ReadCtx.getRef` (render accessor, `irReadCtx.ts:142-144`; usato in `irCompile.ts:119`) sia da `resolveCrossDeps` (reattività). La reattività cross-object era già in `d4d451676`. **NB**: questo meccanismo fa re-renderare il **nodo host** quando cambia una feature di un target navigato (crossDepsSignature appesa alla signature dell'host in `irResolve.ts:64-68`); NON è il pattern "componente-child indipendente". Per il dispatch row, la subscription-per-riga (analoga a `DefaultNode` connesso, §1) è più pulita e disaccoppiata del meccanismo crossDeps — che resta utile per PathExpr multi-hop dentro una singola riga.

### 5. Reattività cross-object — stato

Vedi §4: il fix è landed (`a479e489d` + `d4d451676`). Il substrato di subscription che un componente-riga userebbe per re-renderarsi al cambio del child esiste in due forme:
- **crossDeps** (`irCrossDeps.ts` + `irResolve.ts:64-68,86-91`): invalidazione dell'host su cambi di target navigati — adatta a un PathExpr multi-hop, non a un dispatch per-child.
- **subscription per-oggetto** (pattern `useIRView`): un `useSelector` keyed sul child — è ciò che il componente-riga dovrebbe replicare. È lo stesso principio dei `DefaultNode` connessi classic (§1), oggi non più materializzato in editor-v2 perché nessuna riga è child-bound.

### 6. Chi decide i nodi top-level (critical zone) — punto di innesto minimo per la soppressione

- I nodi top-level nascono nel **sync layer** (`useJjomSync.ts:1197-1227`, critical zone §3.1). L'assorbimento graphVertex NON tocca il sync: è un filtro di presentazione (`useIRContainment`). **Non esiste oggi un assorbimento "vero" per graphVertex** — i figli restano nodi; solo il collapse li nasconde (§2).
- **Punto di innesto minimo per "sopprimere il nodo top-level degli oggetti resi come row"**: uno step aggiuntivo in stile `decorateNodes` nel pass di presentazione `useIRContainment` (`useIRContainment.ts:112-137`), che marca `hidden:true` i nodi i cui objectId sono resi come riga in un compartment `children` di un altro nodo. È **fuori dalla critical zone** (il sync continua a emettere il DVertex; il filtro agisce a valle, tra sync e ReactFlow).
- **Rischi:**
  - Usare `hidden:true` (come il collapse), **non** rimuovere il nodo dall'array: l'edge lifting (`decorateEdges`, `irContainment.ts:164-201`) e la matematica del bounding-box dell'hull (`IRContainmentHulls.tsx`) indicizzano per id; un nodo rimosso rompe lift-to-ancestor e sizing hull. `portDistribution.ts` (critical zone) e `canvasToJjom` write-back sono keyed su posizione/id: un nodo presente in JjOM ma assente dall'array RF può desincronizzare la persistenza della posizione. `hidden:true` preserva l'oggetto nell'array (motivo per cui il collapse usa hidden, non removal).
  - Va deciso come trattare gli **edge** che toccano un oggetto reso come riga (un `Attribute` reificato in genere non ha edge propri, ma un child navigabile sì): probabile riuso della logica lift/suppress di `decorateEdges`.
  - Interazione con il DVertex esistente del child: oggi il child HA un DVertex (è un nodo). Se un oggetto è "solo riga", il suo DVertex resta ma nascosto; da valutare l'impatto su palette/drop, layout autosave, conteggi.

### 7. Censimento dei siti kind-aware

Kind vivi: `'vertex'`, `'graphVertex'` (node views → `CompiledView`), `'edge'` (→ `CompiledEdgeView`). Un nuovo kind `row` toccherebbe / dovrebbe conoscere:

**Hard requirements (rotti/invisibili altrimenti):**
- `irTypes.ts:94` — discriminante `kind:'vertex'` di `VertexViewIR` → nuova interface/allargamento literal per `row`.
- `irTypes.ts:185` — union `NodeViewIR = VertexViewIR | GraphVertexViewIR` / `AnyViewIR` → `row` va aggiunto o compiler/resolver non lo vedono mai.
- `irTypes.ts:236-237` — `CompiledView.kind: 'vertex' | 'graphVertex'` → allargare se `row` compila a `CompiledView`.
- **`irResolveCore.ts:120` — GATE CRITICO**: `if (ir.kind !== 'vertex' && ir.kind !== 'graphVertex') continue;` → un kind non riconosciuto è **silenziosamente scartato dall'index** e mai risolto/renderizzato. Questo è il singolo punto più importante.
- `irValidate.ts:18` — routing compile (`edge` → `compileEdgeView`, else `compileView`); `row` cade nell'`else` a meno di un branch dedicato.
- `irCompile.ts:251/306/328` — `compileView(ir: NodeViewIR)`, il branch `if (ir.kind === 'graphVertex')` per containment, e `kind: ir.kind` copiato nel CompiledView.

**Authoring (per rendere `row` autorabile):**
- `ViewData.tsx:53` — `showIRTab = (ir?.kind === 'vertex') || (isV && !ir && view.isEdge !== true)`: gate visibilità tab IR; **oggi anche graphVertex non ha tab**. `row` non mostrerebbe tab.
- `ViewData.tsx:81-83` — `ir?.kind === 'vertex' ? <VertexAuthoringPanel/> : <EnableIRPanel/>`: un `ir` di kind `row` cadrebbe su `EnableIRPanel`, che **lo ri-seederebbe come vertex** (gotcha).

**Aware-only (funzionano/degradano ma da conoscere):**
- `ObjectNode.tsx:60` (child-count solo graphVertex), `:404` (chip collapse solo graphVertex).
- `irContainment.ts:94` (`cv.kind !== 'graphVertex'` per container detection).
- `irInteraction.ts:59` (`e.compiled.kind === 'graphVertex'` per drop-target/palette).
- `IRNodeContent.tsx` — NON branch-a sul view kind (il `kind` locale a `:55/:62/:72-74` è feature-kind `A`/`R`; `seg.kind` a `:191` è segment-kind): una `CompiledView` di kind `row` renderebbe qui invariata — da toccare solo se la riga richiede layout diverso.
- `EnableIRPanel.tsx:55-59` (seed sempre `kind:'vertex'`), `VertexAuthoringPanel.tsx` (draft tipizzato `VertexViewIR`), `irDefaults.ts:28` (`defaultObjectViewIR()` kind vertex), `irDemoFixture.ts:30/57`.
- `Info.tsx` — host: monta `<ViewData/>` (`:1208`), non branch-a su kind (l'indirezione è in ViewData).
- Test: `__tests__/ir.test.ts` (kind literals a `:55/:366/:460/…`), `irCrossDeps.test.ts`, `irValidate.test.ts` — aggiornare se `row` va coperto.

**Non-IR (esclusi, falsi positivi):** `syncEdgeRefKind`/`kind:'composition'|'aggregation'|'association'` in `canvasToJjom.ts`/`UnifiedEdge.tsx`/`useJjomSync.ts` (reference kinds); `.kind` in `jjscript/`/`jjel/`/`megamodel/`/`Jodie/`/`conformance/` (discriminatori estranei).

### 8. Semantica dei children M1 e remnants

**`containmentChildren`** (`irContainment.ts:47-63`): cammina gli slot feature del D-layer del self; per ogni DValue il cui `instanceof` è una `DReference` con `composition === true`, pusha i pointer in `dValue.values`.
- **I target di una composizione compaiono** (per l'IR via `containmentChildren`, non via `data.children` — che è il concetto classic §1). **Ordine**: preservato per-slot (ordine dell'array `values`), iterando le feature in ordine `dObject.features`; più reference di composizione vengono concatenate in ordine di feature.
- **`isKind` risolve l'ereditarietà**: `isKindOf` (`irReadCtx.ts:137-141`) usa `classAncestryNames` (`:85-102`, walk transitivo su `DClass.extends`). Quindi `isKind Feature` matcha un `Attribute` (sottotipo). Confermato.
- **Provenienza per-reference NON distinguibile con meccanismi esistenti**: `containmentChildren` **appiattisce** tutte le reference di composizione senza taggare da quale reference proviene ogni child (`:51-61` pusha `v` senza etichetta di reference). Il futuro filtro per-reference richiederebbe un nuovo meccanismo (ritorno di coppie `{childId, refName}` o simili). Fuori scope ora, ma rilevante per la slice futura.

**Remnants del vocabolario tagliato in B2a** — verificato con grep sull'intero `frontend/src` e sul sottosistema IR: **ZERO occorrenze** di `from:'query'`, `from:'features'`, `value.path`, `multiplicity`, `'row'`, `'inline'`, `kind:'row'` in `components/editor-v2/viewpoint/`. Il vocabolario `from` vivo è: `'intrinsic'`, `'path'` (TextSource, label), `'attributes'`, `'references'` (FieldCompartment source), `'literal'` (TextSource + FieldSegment). `rowFormat.segments` è un token vivo distinto (non la stringa `'row'`). `p.path` in `irCompile.ts:175/179/189/190` è l'operand di un Predicate, non `value.path`. Il taglio B2a è pulito.

---

## Perimetro di un'implementazione ipotizzabile (SENZA implementarla)

Elenco file per capitolo, con rischio stimato e flag critical-zone. **Nulla di questo è autorizzato qui.**

### (a) Kind `row` in schema + resolver con contesto
| File | Modifica ipotizzata | Critical zone | Rischio |
|------|---------------------|---------------|---------|
| `ir/irTypes.ts` | nuova `RowViewIR` (kind `'row'`, `template: TextSource[]`, `metaclasses`, `predicate?`, `priority?`, `visible?`); aggiornare union `AnyViewIR`; nuovo `CompiledRowView` (o riuso `CompiledView` con `kind` allargato) | no | basso (additivo su interface esportate → OK §CLAUDE.md rule 11) |
| `ir/irCompile.ts` | `compileRowView` (o branch in `compileView`) che compila `template` in accessor | no | basso-medio (riuso `compileTextSource`) |
| `ir/irResolveCore.ts` | bucket `rowByMetaclass`/`rowWildcard` in `IRViewpointIndex`; **aggiornare il gate `:120`**; `resolveRowView` (riusa comparatore) | no | **medio**: il gate `:120` è il punto dove un errore rende il kind invisibile; estrazione comparatore additiva per evitare 4ª copia |
| `ir/irResolve.ts` | (event.) hook `useIRRowView(childId, metaclassId)` speculare a `useIRView` | no | basso |
| `ir/irValidate.ts` | routing `row` → `compileRowView` | no | basso |

### (b) Dispatch nel renderer dei compartment con sorgente `children`
| File | Modifica ipotizzata | Critical zone | Rischio |
|------|---------------------|---------------|---------|
| `ir/irTypes.ts` | `FieldCompartmentSpec.source` estesa con `{from:'children'; filter?:Predicate}` | no | basso (additivo) |
| `ir/IRNodeContent.tsx` | branch sorgente `children`: iterare `containmentChildren(self)` filtrati, per ciascuno componente-riga `IRRow` child-bound; estrarre `<div className="ir-row">` in `IRRow` con `useSelector` propria | no | **medio-alto**: nuova subscription per-child, riuso corretto della reattività, fallback a cascata (row esatta > ereditata > default built-in) |
| `ir/irDefaults.ts` (event.) | `defaultRowViewIR()` (built-in, intrinsic name) per il fallback a cascata | no | basso |

### (c) Soppressione top-level degli oggetti resi come row
| File | Modifica ipotizzata | Critical zone | Rischio |
|------|---------------------|---------------|---------|
| `ir/irContainment.ts` | funzione che calcola gli objectId "resi come riga" (children di compartment `children`) e li marca hidden (stile `decorateNodes`) | no (presentazione) | **medio**: interazione con edge lifting (`decorateEdges`) e hull sizing; usare `hidden`, non removal |
| `ir/useIRContainment.ts` | integrare lo step nel pass di presentazione | no | medio |
| `EditorV2.tsx` | (event.) nessuna, se il pass resta dentro `useIRContainment` | **al confine**: EditorV2 è §19.2, non §3.1; solo wiring presentazione | medio |
| — `useJjomSync.ts` / `portDistribution.ts` | **NON toccare** — il fix vive a valle | **CRITICAL ZONE (§3.1)** | alto se toccati: da evitare per costruzione |

### (d) Authoring panel per le row view
| File | Modifica ipotizzata | Critical zone | Rischio |
|------|---------------------|---------------|---------|
| `editors/views/ViewData.tsx` | `showIRTab` e scelta panel per kind `row` (`:53`, `:81-83`) | no | basso-medio (evitare che `EnableIRPanel` ri-seedi a vertex) |
| `authoring/RowAuthoringPanel.tsx` (nuovo) | editor del `template: TextSource[]` (riuso `FieldSegmentEditor`/pattern esistenti) | no | medio (nuovo componente) |
| `authoring/FieldCompartmentListEditor.tsx` | opzione source `children` + selettore filtro | no | basso |
| `authoring/EnableIRPanel.tsx` | (event.) seed row view | no | basso |

**Riepilogo critical zone**: nessuno dei quattro capitoli **richiede** di toccare la critical zone §3.1 (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState.ts`, `VersionFixer.tsx`). Il capitolo (c) è quello a rischio più alto perché *confina* con la persistenza posizione/edge; va progettato come filtro di presentazione (hidden) a valle del sync, replicando la disciplina del collapse. **VersionFixer**: se le row view diventano parte delle default view persistite (jsxString), scatterebbe §3.9 (migrazione) — da valutare in spec; oggi le IR view vivono nel campo `ir` del DViewElement, non nel jsxString, quindi probabilmente NON tocca VersionFixer, ma va confermato.

---

## Rischi e dipendenze individuati

1. **Gate `irResolveCore.ts:120`**: dimenticarlo = kind `row` silenziosamente invisibile, senza errore (coerente con la filosofia "malformed ir non deve far cadere il canvas"). Test di regressione obbligatorio.
2. **Comparatore duplicato 3×** (`resolveIRView`/`resolveEdgeView`/`resolveObjectAsEdgeView`): un `resolveRowView` senza estrazione = 4ª copia; drift futuro dell'ordinamento tra contesti.
3. **`ViewData.tsx:81-83`**: un `ir` non-vertex cade su `EnableIRPanel` che ri-seeda a vertex → possibile corruzione della row view se aperta in authoring prima del supporto.
4. **Provenienza per-reference assente** in `containmentChildren`: il filtro `children` per-reference (slice futura) richiede un nuovo meccanismo, non riusa nulla di esistente.
5. **Soppressione top-level (c)**: rischio desync posizione/edge se si rimuovono nodi invece di nasconderli; interazione con `decorateEdges` e hull sizing.
6. **Doppio substrato di reattività** (crossDeps vs subscription-per-oggetto): scegliere quello per-oggetto per le righe child-bound; non forzare crossDeps (pensato per multi-hop dentro una riga).
7. **Classic è git-only per il rendering**: l'analogia "stile DefaultNode" è concettuale; il codice vivo di riferimento è il resolver IR, non `graph/`.

## Domande — risposte sintetiche alle 8 obbligatorie

1. **Classic: risoluzione child, fallback, subscription per-child?** Risoluzione: `getAppliedViewsNew` (`selectors.ts:609`) → scoring `updateScores` → `NodeTransientProperties.sort` (`classes.ts:4072`), esclusiva top-score = `mainView`. Fallback: `Pointer_ViewFallback` che rende il nome intrinseco (`DV.tsx:562/1331`). Sì, ogni child era un `DefaultNode` `connect()`-ato con `mapStateToProps` proprio (per-node subscription) — **ma il componente è deleted (`e86c276f8`)**; vivo resta il motore di risoluzione + `graphComponentRegistry`.
2. **IR: children graphVertex = nodi RF veri o render ricorsivo? Dove l'assorbimento?** Nodi RF veri e top-level (`irContainment.ts:4-9`); l'hull è overlay (`IRContainmentHulls.tsx`). Nessun assorbimento reale: solo il collapse nasconde (`decorateNodes`, `irContainment.ts:144-155`). Array nodi = sync layer (`useJjomSync.ts:1197-1227`); filtro presentazione = `useIRContainment` (`EditorV2.tsx:1287`).
3. **`irResolve` fattorizzabile per contesto senza duplicare priorità/specificità?** Sì: nuovi bucket `rowByMetaclass`/`rowWildcard` + `resolveRowView` che riusa lo stesso comparatore e `classAncestryNames`. Enumerazione candidate in `resolveIRView` (`irResolveCore.ts:176-186`). Caveat: comparatore non estratto → estrazione additiva consigliata per non fare la 4ª copia.
4. **Righe: componente per riga o map monolitico? Cosa manca? Fix 21/07 landed?** Map monolitico (`IRNodeContent.tsx:179-231`) su selector solo-self (`:44-65`). Manca: componente-riga child-bound con subscription propria (speculare `useIRView`). Fix cross-object **landed** in `a479e489d` (+ reattività `d4d451676`) — ma è invalidazione dell'host, non subscription-per-child.
5. **Soppressione top-level passa per la critical zone? Innesto minimo e rischio?** No. Innesto minimo: step `hidden:true` stile `decorateNodes` nel pass `useIRContainment` (`useIRContainment.ts:112-137`), a valle del sync. Rischio: usare hidden (non removal) per non rompere edge lifting/hull sizing e persistenza posizione (`portDistribution`/`canvasToJjom`).
6. **Lista file:riga kind-aware.** Vedi §7. Hard: `irTypes.ts:94/185/236-237`, `irResolveCore.ts:120` (critico), `irValidate.ts:18`, `irCompile.ts:251/306/328`. Authoring: `ViewData.tsx:53/81-83`. Aware-only: `ObjectNode.tsx:60/404`, `irContainment.ts:94`, `irInteraction.ts:59`, `EnableIRPanel.tsx:55-59`, `irDefaults.ts:28`, `IRNodeContent.tsx` (feature/segment kind, non view kind), test.
7. **Target composizione in `data.children` con ordine stabile? `isKind` eredita? Provenienza per-reference?** Nell'IR i target compaiono via `containmentChildren` (`irContainment.ts:47-63`), non `data.children`. Ordine stabile per-slot (ordine `values`), reference concatenate in ordine feature. `isKind` eredita (`classAncestryNames`, `irReadCtx.ts:85-102`). Provenienza per-reference **NON** distinguibile (flatten senza tag). Vocabolario B2a: nessun remnant (§8).
8. **Perimetro implementazione + rischi + domande aperte.** Vedi §Perimetro (a-d) e §Rischi. Domande aperte sotto.

## Domande aperte per Alfonso (pre-spec)

- **OQ-1 (contesto resolver)**: `row` come nuovo kind con bucket dedicati in `IRViewpointIndex`, oppure riuso dei bucket vertex con un flag di contesto? Raccomando bucket dedicati (isola vertex-canvas da row-inline, evita match incrociati). Estraiamo il comparatore condiviso in un helper (evita la 4ª copia)?
- **OQ-2 (compiled shape)**: `row` compila a `CompiledView` (riuso, `kind` allargato) o a un `CompiledRowView` separato (come edge)? Un tipo separato tiene `IRNodeContent` pulito ma aggiunge un percorso; il riuso è più economico ma sporca `CompiledView.kind`.
- **OQ-3 (subscription riga)**: componente-riga con `useSelector` propria per-child (pattern `useIRView`), confermato in luogo del meccanismo crossDeps? Impatto perf su compartment con molti children (N subscription)?
- **OQ-4 (soppressione top-level)**: confermare la strategia `hidden:true` a valle del sync (no removal, no critical zone). Come trattiamo il DVertex esistente del child reso come riga (resta nascosto) e i suoi eventuali edge (lift/suppress alla `decorateEdges`)?
- **OQ-5 (fallback a cascata)**: la "riga di default built-in" quando nessuna row view matcha = intrinsic name (analogo `Pointer_ViewFallback` classic / `defaultObjectViewIR`)? Definiamo un `defaultRowViewIR()` in `irDefaults.ts`?
- **OQ-6 (authoring)**: `ViewData.tsx` deve mostrare il tab IR anche per `row` (oggi solo `vertex`)? Nuovo `RowAuthoringPanel` o estensione del `VertexAuthoringPanel`? Come evitare che `EnableIRPanel` ri-seedi a vertex un `ir` di kind row?
- **OQ-7 (persistenza)**: le row view restano nel campo `ir` del DViewElement (nessun jsxString → nessun VersionFixer), confermato? Se una default view seedata includesse row, scatterebbe §3.9.
- **OQ-8 (provenienza per-reference)**: la slice futura del filtro per-reference richiede di arricchire `containmentChildren` con la reference sorgente. Vogliamo predisporre il ritorno `{childId, refName}` fin dalla prima implementazione (anche se il filtro resta per-kind), o rimandare del tutto?

## Riferimenti

- Prior art: `docs/discovery/discovery_2026-07-21_cross_object_render_lproxy.md` (fix render multi-hop, landed `a479e489d`).
- Commit rilevanti: `a479e489d` (navigateRefHop), `d4d451676` (cross-object reattività), `e86c276f8` (classic shutdown, rendering deleted).
- Siti chiave: `irResolveCore.ts:120` (gate kind), `irContainment.ts:47-63` (containmentChildren), `IRNodeContent.tsx:44-65,179-231` (renderer self-only), `useJjomSync.ts:1197-1227` (nodi top-level, critical zone), `useIRContainment.ts:69-174` (filtro presentazione), `ViewData.tsx:53,81-83` (authoring gate).
</content>
</invoke>
