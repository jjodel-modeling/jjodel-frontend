# Discovery READ-ONLY: E-obj — authoring object-as-edge

**Data**: 2026-08-02. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD locale `b65bfe78f` (23 commit non pushati sopra `origin/alfonso-frontend-jjtl` = `07cee5219`). Working tree con WIP estraneo (lane TextStyle), lasciato intatto. Uniche scritture: questo report + l'entry in `docs/claude-code-log.md`. Nessun edit al codice, nessuno stash/checkout/commit/push.

**Documento prompt**: 2026-08-02 15:34.

## Obiettivo

Fornire, con `file:riga` verificati a HEAD, tutto ciò che serve a scrivere il prompt di implementazione **E-obj** (authoring della natura object-as-edge del kind `edge`) senza altre esplorazioni: come il resolver discrimina la natura, cosa il pannello deve rendere obbligatorio, quanto costa riusare `MatchingSection` contro il matching inline già scritto in E-ref, quale widget autora una PathExpr, e su quale banco si collauda.

Questa discovery è la continuazione di `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md`: i suoi findings non sono ripetuti, sono citati e ri-verificati solo dove gli anchor sono cambiati.

---

## Correzioni agli anchor citati nel prompt (ri-ancorati via grep a HEAD)

| Anchor del prompt | Valore reale a HEAD |
|---|---|
| `irResolveCore.ts:44-60` (bucket) | ✅ corretto — `IRViewpointIndex` `:44-60` |
| `irResolveCore.ts:116-141` (routing kind) | ✅ quasi — il ramo edge è `:116-143` (`continue` a `:143`) |
| `irResolveCore.ts:256-320` (resolver) | ✅ corretto — `resolveEdgeView` `:256-290`, `resolveObjectAsEdgeView` `:293-320` |
| `irCompile.ts:382-428` (compileEdgeView) | ❌ **spostato**: `compileEdgeView` è `:404-450`; `compileTextSource` è `:380-400`. `isObjectAsEdge` è `:430`, terminazioni default `:436-439` |
| `irEdgeViews.ts:49-72` (applyEdgeStyle) | ❌ **spostato**: `applyEdgeStyle` è `:35-67` |
| `irEdgeViews.ts:118-257` (decoration) | ❌ **spostato**: `decorateReferenceEdges` `:114-139`, `synthesizeObjectAsEdges` `:164-255` |
| `useIRContainment.ts:152,158` | ✅ corretto (decorate `:152`, synthesize `:158`) |
| `ViewData.tsx:57-58` (showIRTab) | ❌ **spostato**: `showIRTab` è `:61`; il routing del kind è `:84-105` |
| `EnableIRPanel.tsx:8-11` (KIND_OPTIONS) | ❌ **spostato/cambiato**: `KIND_OPTIONS` è `:8-12` e ha **3 voci** (vertex/row/edge), non 2 |
| `canvasToJjom.ts:90-101` (persistenza) | ❌ **spostato**: `syncIREdgeLayoutToJjom` è `:105-116`, la `SetFieldAction` è `:114` |
| `irContainment.ts:240-277` | non riletto in questa sessione (nessuna OQ lo richiedeva) — anchor **non verificato** |

**Nota di processo**: il prompt chiedeva di recuperare hash e file toccati dall'entry di log della fase E-ref. **Quell'entry non esiste**: `grep "reference-as-edge"` su `docs/claude-code-log.md` + `docs/claude-code-log-archive.md` trova solo le due discovery (archive `:118`, `:140`), nessuna entry per il landing. I dati sono stati ricostruiti da git: commit **`9bd8cad9a`** *"feat(editor-v2): edge view authoring panel (reference-as-edge)"*, 2026-07-28 01:10, **5 file**: `EdgeAuthoringPanel.tsx` (+439, nuovo), `EnableIRPanel.tsx` (+27/-…), `__tests__/edgeAuthoring.test.ts` (+136, nuovo), `ir/irDefaults.ts` (+19), `editors/views/ViewData.tsx` (+31). Un secondo commit ha poi toccato il pannello: `e9913d3fa` *"refactor(panels): use design-system toggles for authoring flags"*. `9bd8cad9a` è antenato sia di HEAD sia di origin.

---

## File letti (path completi, tutti sotto `/Users/alfonso/jjodel`)

**IR core**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (378 righe, integrale), `irResolveCore.ts` (362, integrale), `irCompile.ts` (501, integrale), `irEdgeViews.ts` (255, integrale), `irDefaults.ts` (143, integrale), `irValidate.ts` (25, integrale), `useIRContainment.ts` (186, integrale), `irInteraction.ts` (174, integrale), `irDemoFixture.ts` (132, integrale).

**Authoring**: `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (442, integrale), `EnableIRPanel.tsx` (148, integrale), `MatchingSection.tsx` (166, integrale), `TextSourceEditor.tsx` (87, integrale), `VertexAuthoringPanel.tsx` (parziale: `:1-120`, `:300-353`).

**UI / widget**: `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` (143, integrale), `frontend/src/components/ui/PathBuilder/pathExpr.ts` (integrale).

**Routing tab**: `frontend/src/components/editors/views/ViewData.tsx` (248, integrale).

**Canvas / persistenza (sola lettura)**: `frontend/src/components/editor-v2/EditorV2.tsx` (`:140-190`, `:1855-1935`, grep mirati su `irObjectAsEdge`/`persistIREdgeLayout`), `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`:85-124`, **critical zone, sola lettura**).

**Test**: `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` (136, integrale), `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (`:520-690`, blocco edge; indice dei describe sull'intero file).

**Fixture**: `frontend/src/__tests__/fixtures/xmi-m1/Graph.ecore`, `frontend/src/__tests__/fixtures/xmi-m1/references_test.xmi`.

**Documenti**: `CLAUDE.md`, `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md`, `docs/claude-code-log.md`, `docs/claude-code-log-archive.md` (entry late-July).

---

# Findings

## Area 1 — Discriminante di natura

### OQ-1 — Come il resolver assegna una EdgeViewIR al bucket object

**Il discriminante è STRUTTURALE, non esplicito.** Non esiste alcun campo dell'IR che dichiari la natura.

Catena esatta:

1. `irCompile.ts:420-421` compila le due PathExpr: `sourceExpr = compileExpr(e.source)`, `targetExpr = compileExpr(e.target)`. `compileExpr` (`:414-419`) restituisce `null` per stringa assente **o vuota** (`if (!expr) return null`).
2. `irCompile.ts:430`: `isObjectAsEdge: !!(sourceExpr && targetExpr)` — **serve che ENTRAMBE siano presenti e non vuote**.
3. `irResolveCore.ts:125-141` — il punto esatto della decisione:
   ```
   if (compiledE.isObjectAsEdge) {
       if (ir.metaclasses !== '*') { … objectAsEdgeByMetaclass … }     // :126-132
   } else if (ir.metaclasses === '*') { edgeWildcard.push(entry) }      // :133-134
   else { … edgeByMetaclass … }                                          // :135-141
   ```

Tre conseguenze operative, tutte rilevanti per il pannello:

- **(a) Una edge view senza `edge.source`/`edge.target` È una reference-as-edge**, per costruzione. Non c'è uno stato "edge view non ancora decisa": il seed corrente (`defaultEdgeViewIR()`, `edge: {}`) è già, a tutti gli effetti, una view di natura reference viva sul canvas.
- **(b) Con una sola delle due PathExpr valorizzata la view resta reference-as-edge** e la PathExpr compilata resta inerte (`sourceExpr` è compilato ma `resolveEdgeView`/`decorateReferenceEdges` non lo leggono mai). Nessun warning.
- **(c) `metaclasses: '*'` + natura object → la view NON entra in NESSUN bucket** (`:126` gate `!== '*'`): non è object-as-edge (nessun indice) e non finisce nel ramo `edgeWildcard` (quel ramo è `else if`, non raggiunto). La view è **silenziosamente inerte**, ma viene comunque contata in `viewIds` (`:142`), quindi non fa fallire l'indice. Zero diagnostica.

Il consumo del bucket è `synthesizeObjectAsEdges` → `resolveObjectAsEdgeView` (`irResolveCore.ts:293-320`), che esce subito se `objectAsEdgeByMetaclass.size === 0` (`:300`) e cammina l'ancestry della metaclasse dell'**oggetto stesso** (`:305-311`, specificità 2 self / 1 ereditata; **nessun tier wildcard**, coerente con (c)).

### OQ-2 — Tipo `EdgeViewIR` completo e vincoli incrociati

`irTypes.ts:187-215`. Campi:

| Campo | Riga | Obbligatorio | Natura |
|---|---|---|---|
| `irVersion: string` | `:188` | sì (tipo) | entrambe |
| `kind: 'edge'` | `:189` | sì | entrambe |
| `metaclasses: string[] \| '*'` | `:190` | sì | entrambe — **semantica diversa**: sorgente (reference) vs metaclasse dell'oggetto-edge (object) |
| `reference?: string` | `:191` | no | **solo reference** |
| `predicate?: Predicate` | `:192` | no | entrambe (radica su oggetto sorgente / oggetto-edge) |
| `priority?: number` | `:193` | no | entrambe |
| `exclusive?: boolean` | `:194` | no | **inerte per entrambe** (OQ-10) |
| `label?: string` | `:195` | no | entrambe, **mai letto a runtime** (grep: nessun consumer di `ir.label` fuori dai tipi) |
| `edge: { … }` | `:196-214` | sì (tipo) | entrambe |
| `edge.source?: PathExpr` | `:197` | no (tipo) | **solo object**, di fatto obbligatorio (OQ-1/OQ-3) |
| `edge.target?: PathExpr` | `:198` | no (tipo) | **solo object**, idem |
| `edge.line?{color,width,style}` | `:199-203` | no | entrambe |
| `edge.terminations?{sourceEnd,targetEnd}` | `:204` | no | entrambe |
| `edge.routing?` | `:206` | no | entrambe — **inerte** (D3, congelato) |
| `edge.labels?{center,placement}` | `:207-210` | no | entrambe |
| `edge.persistWaypoints?: boolean` | `:213` | no | **di fatto solo object** (il gate `isIREdgeLayoutPersistable` in `EditorV2.tsx:159-173` risolve solo `resolveObjectAsEdgeView`) |

**Nessun campo nomina la natura.** Il commento del tipo (`irTypes.ts:177-186`) documenta le due nature a parole.

**Vincoli incrociati in `irValidate.ts`: NON esistono.** `validateIR` (`:16-25`) è un wrapper di 10 righe che chiama `compileEdgeView` e cattura il throw. `compileEdgeView` non fa alcun cross-check. Quindi **una view ibrida passa la validazione**:

- `reference: 'x'` + `edge.source/target` → `isObjectAsEdge = true` → finisce nel bucket object; `compiled.reference` è valorizzato (`:429`) ma `resolveObjectAsEdgeView` **non lo legge mai** → la restrizione autorata è silenziosamente ignorata.
- solo `edge.source` (senza target) → resta reference-as-edge, `reference` (se presente) continua a filtrare.

L'unico errore che il validatore intercetta è la PathExpr malformata (costrutti vietati `FORBIDDEN_PATH` `irCompile.ts:37`, step non conformi a `STEP_RE` `:39`) — che però **abbatte l'intera view**: `getIRIndex` la salta con `console.warn` (`irResolveCore.ts:120-123`).

### OQ-3 — Cosa `synthesizeObjectAsEdges` legge, e cosa è indispensabile

`irEdgeViews.ts:164-255`. Per ogni nodo con un oggetto associato (`:180-183`):

1. `resolveObjectAsEdgeView(objectId, metaclassId, …)` (`:184`) — richiede che il bucket object contenga la metaclasse (⇒ **`metaclasses` array non vuoto e non `'*'`**).
2. `if (!cv || !cv.sourceExpr || !cv.targetExpr) continue` (`:185`) — doppia guardia ridondante con `isObjectAsEdge`.
3. Valutazione dei due accessor in `try/catch` (`:187-190`): un throw ⇒ `continue` (nodo resta visibile).
4. **Normalizzazione dell'endpoint** (`:194-198`): accetta una stringa (backend draw) **o** un oggetto con `.id` (backend L-proxy). Qualsiasi altro valore ⇒ `null`.
5. `vertexByObj.get(srcId/tgtId)` (`:199-200`); se uno dei due manca ⇒ `continue` con commento esplicito *"fallback: keep the node rendered"* (`:201`).
6. Costruzione dell'edge sintetico (`:204-216`): id `irobj_${objectId}`, `type:'instanceRef'`, `data.irObjectAsEdge/irObjectId`, e **`irSourceFeature`/`irTargetFeature` = `firstFeatureOf(cv.ir.edge?.source|target)`** (`:213-214`, helper `:158-162`, regex `^\$([A-Za-z_][A-Za-z0-9_]*)`).
7. Effetti collaterali sul canvas: **il nodo dell'oggetto viene nascosto** (`:226`, `hidden:true`) e **tutti gli edge reali che toccano quel vertice vengono soppressi** (`:228`).
8. Handle geometrici + override d'ancoraggio (`:229-253`).

**Campi indispensabili perché una object-as-edge sia funzionante a canvas**: `kind:'edge'`, `metaclasses` = array non vuoto **senza wildcard**, `edge.source` **e** `edge.target` compilabili e risolvibili a un oggetto che ha un vertice nel grafo corrente. Tutto il resto (line, terminations, labels, priority, predicate) è opzionale.

**Indispensabili per le gesture** (non per il rendering): le due PathExpr devono iniziare con `$feature`, altrimenti `firstFeatureOf` restituisce `null` e:
- `deriveIRInteraction` (`irInteraction.ts:74-75`) produce una connect rule con feature nulle, che `matchConnectRules` scarta (`:123`) → **la gesture di connect non crea più l'oggetto-edge**;
- `handleReconnect` (`EditorV2.tsx:1874-1877`) esce senza scrivere → **il trascinamento di un capo non riscrive lo slot**.

**Comportamento in caso di assenza/errore** (input diretto al design UI):

| Situazione | Effetto |
|---|---|
| `edge.source`/`target` assenti | Nessun crash: la view è una **reference-as-edge** (OQ-1a) e stila gli edge M1 uscenti dalle istanze della metaclasse |
| Una sola delle due presente | Idem (reference-as-edge), la PathExpr è inerte |
| `metaclasses: '*'` con entrambe presenti | View **inerte**, nessun bucket, nessun warning (OQ-1c) |
| Path sintatticamente invalida | `compileEdgeView` throw → `validateIR` la blocca in authoring; se già persistita, `getIRIndex` scarta la view con `console.warn` (`irResolveCore.ts:121`) |
| Path valida che non risolve (slot vuoto, target senza vertice) | **Fallback silenzioso esplicito**: nodo renderizzato normalmente, nessun edge sintetico (`irEdgeViews.ts:201`; test `ir.test.ts:668-685`) |
| Path che punta a un **attributo** invece che a una reference | Compila e valuta; il valore è una stringa non-id → `vertexByObj.get(...)` undefined → stesso fallback silenzioso |

### OQ-4 — Default di `compileEdgeView`

`irCompile.ts:404-450`. **Nessun default differisce per natura**: la funzione non si ramifica mai su `isObjectAsEdge` (che viene solo calcolato a `:430`).

| Chiave | Default se assente | Riga |
|---|---|---|
| `priority` | `0` | `:425` |
| `predicate` | `() => true` | `:412` (via `compilePredicate(undefined)` `:165`) |
| `reference` | `null` | `:429` |
| `sourceExpr`/`targetExpr` | `null` | `:414-421` |
| `lineColor` / `lineWidth` / `lineStyle` | `null` (⇒ nessuna emissione: `applyEdgeStyle` `:36-38` produce `undefined`) | `:433-435` |
| `terminations.sourceEnd` | `'none'` | `:437` |
| `terminations.targetEnd` | `'openArrow'` | `:438` |
| `routing` | `null` | `:440` |
| `labelText` | `null` (⇒ l'edge conserva la propria label) | `:441` |
| `labelPlacement` | `'auto'` | `:442` |
| `persistWaypoints` | `true` | `:443` |
| `ir.edge` mancante del tutto | `{}` (`const e = ir.edge ?? {}`) | `:413` |

**Chiavi che il pannello può droppare senza cambiare il rendering**: `reference`, `predicate`, `priority`, `edge.line` (intera), `edge.terminations`, `edge.labels`, `edge.routing`, `edge.persistWaypoints`, `label`, `exclusive`. **Non droppabili per la natura object**: `edge.source`, `edge.target`.

Attenzione al default `targetEnd:'openArrow'`: droppare `terminations` **non** produce "nessuna freccia" ma la freccia aperta. Il pannello E-ref infatti mostra sempre un valore nei due Select (`EdgeAuthoringPanel.tsx:222-223`) e scrive la chiave al primo cambiamento.

---

## Area 2 — Il pannello E-ref esistente

### OQ-5 — Struttura reale di `EdgeAuthoringPanel.tsx` a HEAD (442 righe)

**Ciclo di edit** (identico a Row/Vertex):
- `seed()` `:66` — `clone(view.ir ?? defaultEdgeViewIR())`; `clone` è `JSON.parse(JSON.stringify(...))` `:44`.
- stato: `draft` `:68`, `error` `:69`, `dirtyRef` `:70`.
- **reset su cambio view**: `useEffect` su `[view.id]` `:73-78` — azzera `dirtyRef`, ri-seeda, pulisce l'errore, **senza commit**.
- **validate eager + commit debounced**: `useEffect` su `[draft, view.id]` `:81-91` — esce se `!dirtyRef.current`; `validateIR` `:82`; se ok, `setTimeout(() => { view.ir = draft }, 300)` (`COMMIT_DEBOUNCE_MS` `:26`) con cleanup.
- `patch(next)` `:93-96` — marca dirty e sostituisce il draft (immutabile).
- **Round-trip**: l'intero `ir` clonato viene riscritto, quindi i campi non autorati (incluse `edge.source/target`, `routing`, `persistWaypoints`) sopravvivono verbatim — dichiarato nel JSDoc `:56-58` e coperto dal test `edgeAuthoring.test.ts:107-136`.

**Sezioni del form** (nell'ordine di render):

| Sezione | Righe | Neutra rispetto alla natura? |
|---|---|---|
| Header + HelpText introduttiva | `:255-256` | ❌ testo hardcoded reference ("gli edge derivati dalle reference M1 il cui oggetto SORGENTE…") |
| ErrorText validazione | `:258` | ✅ |
| Warning metaclasse ambigua (N metamodelli) | `:260-264` | ✅ |
| **Matching — metaclassi** (toggle `*`, lista, Select "Aggiungi…") | `:266-303` | ⚠️ **meccanica neutra**, etichette hardcoded ("Metaclasse sorgente" `:269`, help `:290`/`:302`). Il toggle `*` è **pericoloso per la natura object** (OQ-1c) |
| **Matching — reference** (Select + drop-key) | `:305-314` (handler `:190-205`) | ❌ **esclusivo reference** |
| Matching — predicate (Toggle + PredicateBuilder) | `:316-339` (handler `:208-218`) | ✅ meccanica; ❌ help `:337` ("valutato sull'oggetto sorgente della reference") |
| Matching — priorità (NumberInput) | `:341-349` | ✅ |
| Linea — colore / spessore / tratto (ConditionalEditor) | `:351-394` (helper `:225-230`) | ✅ |
| Terminazioni — sorgente / destinazione (Select ×6 voci) | `:396-413` | ✅ |
| Label center (Toggle + TextSourceEditor + drop-key) | `:415-437` (handler `:233-251`) | ✅ meccanica; ❌ help `:435` ("nome della reference") |

**Risoluzione delle feature** (`featureInfo`, `:104-155`): pinna la classe per **identità** da `view.appliableToClasses` confrontando col **primo** nome in `draft.metaclasses` (`:113-138`), conta quanti metamodelli dichiarano quel nome (`:127-138`) e produce `PathBuilderFeatures` con `attributes` + `references` (`:143-150`). **Meccanicamente neutro rispetto alla natura**: per il ramo object le feature della metaclasse dell'oggetto-edge sono esattamente quelle che servono ad autorare `edge.source`/`edge.target`. L'unico riuso improprio è semantico: `refNames` (`:190`) usa lo stesso `features.references` sia per il picker `reference` (reference) sia — potenzialmente — per i capi (object).

**`exclusive` è deliberatamente omesso** (`:63`, ratifica R-5). **Nessun toggle di natura** (R-3).

**Cosa manca per la natura object**: editor di `edge.source` e `edge.target` (PathExpr), gate sul wildcard, eventuale toggle `persistWaypoints`, e testi/help specifici. Tutto il resto (linea, terminazioni, label, predicate, priorità, lista metaclassi) è riusabile così com'è **dentro lo stesso pannello**.

### OQ-6 — `EnableIRPanel.tsx` + `defaultEdgeViewIR()`

- `KIND_OPTIONS` `:8-12`: 3 voci — `vertex` / `row` / **`edge` etichettata "Edge (reference)"**.
- Stato: `useState<'vertex' | 'row' | 'edge'>('vertex')` `:61`; cast nell'`onChange` del Select `:121`.
- **Guard anti-reseed** `:67-75`: se `view.ir` esiste, il pannello **ritorna un placeholder read-only** e non offre nulla. È a monte del kind, quindi vale per ogni natura.
- `resolveMetaclassNames(view)` `:34-46`: da `appliableToClasses` tiene solo i pointer che risolvono a `DClass`, scartando i tipi D-level (`D_LEVEL_TYPES` `:22-25`).
- Ramo di seed `enable()` `:79-107`: `rowSeed` `:82-87`, `vertexSeed` `:88-92`, **`edgeSeed` `:96-99`** = `{...defaultEdgeViewIR(), metaclasses: names.length ? [...names] : []}`; scelta a `:100`; `validateIR` `:101-103`; scrittura `view.ir = seed` `:106`.
- Testi di aiuto per il kind `:126-138` (ramo edge `:128-133`).
- `defaultEdgeViewIR()` — `irDefaults.ts:79-86`: `{ irVersion:'ir-1.2', kind:'edge', metaclasses:[], edge:{} }`. JSDoc `:71-78` documenta che `edge:{}` lascia applicare i default di compile.

**Punti minimi da toccare, per scenario:**

**(a) Due voci distinte nel selettore di kind** (`edge-reference` / `edge-object`)
1. `KIND_OPTIONS` `:8-12` — +1 voce, e rinomina dell'etichetta esistente (⚠️ rinominare una *label* non viola la regola 2, che riguarda gli identificatori).
2. Tipo dello stato `:61` + cast `:121` — union a 4 valori.
3. `enable()` `:96-100` — nuovo `edgeObjectSeed` + terzo ramo nella scelta del seed.
4. `irDefaults.ts` — nuova factory (es. `defaultObjectAsEdgeViewIR()`) accanto a `defaultEdgeViewIR()`.
5. Testi di aiuto `:128-133` — ramo dedicato; **il testo cambia semantica**: per la natura object `names` è la metaclasse **dell'oggetto-edge**, non della sorgente.
6. `ViewData.tsx` — **nessuna modifica** (il routing è per kind, OQ-7).
7. **Problema aperto**: qualunque seed object con `source`/`target` vuoti è strutturalmente una reference-as-edge (OQ-1a/b), quindi la scelta fatta qui **non si conserva** finché l'autore non riempie entrambi i capi. Se invece il seed pre-compila i due capi con le prime reference disponibili, alla creazione **tutte le istanze della metaclasse spariscono dal canvas** (nodo nascosto, `irEdgeViews.ts:226`).

**(b) Una voce edge unica + scelta di natura dentro il pannello**
1. `EnableIRPanel`: **zero modifiche strutturali**; solo l'etichetta `:11` ("Edge (reference)" → "Edge") e il testo di aiuto `:128-133` da rendere neutri.
2. Tutto il lavoro cade in `EdgeAuthoringPanel`: rilevare la natura dal draft (`!!(edge.source && edge.target)`) o tenerla in stato locale, renderizzare il ramo corrispondente, gestire la transizione.
3. Stesso problema aperto di (a) al punto 7, ma **visibile e governabile dentro il pannello**: finché i due capi non sono valorizzati la view resta viva come reference-as-edge sulla metaclasse selezionata (ossia stila tutti gli edge M1 uscenti da quelle istanze).

### OQ-7 — `ViewData.tsx`: routing per kind

- `showIRTab` `:61`:
  ```
  (ir?.kind === 'vertex') || (ir?.kind === 'row') || (ir?.kind === 'edge') || (isV && !ir && view.isEdge !== true)
  ```
  Commento `:52-60` che ribadisce: `view.isEdge` (marker classic jsxString) **non** ha relazione con `ir.kind === 'edge'`.
- Routing `:84-105`: cascata di ternari `vertex → VertexAuthoringPanel` `:90`, `row → RowAuthoringPanel` `:92`, **`edge → EdgeAuthoringPanel` `:94`**, altro-ir → placeholder `:96-101`, nessun ir → `EnableIRPanel` `:102`.

**Il routing dipende SOLO dal kind, mai dalla natura.** Con il pannello unico (D8) `ViewData.tsx` **non va toccato**. Sarebbe da toccare solo se si scegliesse un secondo componente (`ObjectAsEdgeAuthoringPanel`), che richiederebbe di leggere la natura qui — cioè di duplicare in `ViewData` la logica strutturale di `isObjectAsEdge`.

---

## Area 3 — Matching e widget riusabili

### OQ-8 — `MatchingSection`: firma, uso, e il costo delle due strade

**Firma** (`MatchingSection.tsx:14-20`): `{ draft: VertexViewIR; patch: (next: VertexViewIR) => void; features: PathBuilderFeatures | null; featuresHint: string; classNames: string[] }`. Componente presentazionale e stateless (JSDoc `:22-34`).

**Campi toccati**: `metaclasses` (`:49-56` handler, `:79-114` JSX), `predicate` (`:59-70`, `:117-139`), `priority` (`:142-149`), **`exclusive`** (`:152-161`).

**Chi la usa oggi**: **un solo consumer** — `VertexAuthoringPanel.tsx:13` (import) e `:339-345` (uso, dentro il gate `advanced &&` `:337`). `RowAuthoringPanel.tsx:48` e `EdgeAuthoringPanel.tsx:61` la citano **solo nei commenti** per motivare di non averla usata.

**Strada A — allargare la tipizzazione a `EdgeViewIR`**

Interventi: `MatchingSection.tsx:12` (import del tipo), `:14-20` (props generiche o union), `:68` (cast `rest as VertexViewIR` nel drop-key del predicate), `:152-161` (il blocco `exclusive` va reso opzionale via prop, perché per gli edge è **inerte** — OQ-10 — e mostrarlo autorerebbe un campo che nessuno legge). Call-site vertex `VertexAuthoringPanel.tsx:339-345`: 0 o 1 riga (nuova prop `showExclusive`).

Costo netto sul componente condiviso: **~10-14 righe modificate** su 166. Il rischio *tipizzazione* è basso (con un generico vincolato l'inferenza al call-site vertex resta identica).

**Il costo vero non è lì**: per usarla nel ramo object bisogna **cancellare le ~84 righe di JSX inline già scritte e verificate in E-ref** (`EdgeAuthoringPanel.tsx:266-349`, matching metaclassi + predicate + priorità) e i relativi ~45 righe di handler (`:174-218`) — oppure tenere due implementazioni del matching nello stesso pannello, una per natura. La prima opzione **tocca il ramo reference già verificato** (commit `9bd8cad9a`, mai smoke-testato in un'entry di log): è lì che si concentra il rischio di regressione, non nel vertice. Va inoltre notato che il picker `reference` (`:305-314`) resterebbe comunque inline: `MatchingSection` non conosce `reference` e non è pensata per ospitarlo.

**Strada B — replicare il matching inline (come fa oggi il ramo reference)**

Sotto D8 (pannello unico per il kind edge) il matching inline **è già scritto e già condiviso**: metaclassi, predicate e priorità sono neutri rispetto alla natura (OQ-5) e non richiedono una riga nuova. La duplicazione aggiuntiva per E-obj è quindi **0 righe** per il matching; l'unico costo è nascondere il picker `reference` (`:305-314`) sul ramo object (**~2 righe di gate**) e adattare 3-4 stringhe di help (`:256`, `:269`, `:302`, `:337`, `:435`).

Se invece si scegliesse un **secondo pannello** separato, la duplicazione sarebbe di ~130 righe (handler + JSX del matching) più l'intero ciclo draft/validate/commit (~50 righe): ~180 righe duplicate.

*(Nessuna raccomandazione, come richiesto: i due costi misurati sono 10-14 righe sul condiviso + rimozione di 84+45 righe verificate dal ramo reference (A) contro ~2 righe di gate (B) sotto D8, oppure ~180 righe duplicate (B con pannello separato).)*

### OQ-9 — Widget per autorare una PathExpr

**Esiste**: `PathBuilder` — `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` (143 righe), esportato da `components/ui/index.ts`.

**API** (`:17-25`): `{ features: PathBuilderFeatures | null; value: string; onChange: (expr: string) => void; disabled?: boolean; disabledHint?: string }`. `PathBuilderFeatures` (`:12-15`) = `{ attributes: {name,type,upperBound}[]; references: {name,targetClassName,upperBound}[] }`.

**Cosa produce**: una stringa emessa da `pathExprFromSelection` (`pathExpr.ts:18-26`): `$feature.value` | `$feature.values` | `$feature.values[N]`. **Single-hop soltanto** (parse `:31`, TODO multi-hop `:72-73`).

**Dove è già usato**: `TextSourceEditor.tsx:74-82` (modo `path`), e via quello da `LabelEntryEditor`, `LabelListEditor`, `FieldCompartmentListEditor`, `BadgeListEditor`, `RowAuthoringPanel`, `EdgeAuthoringPanel` (label center); inoltre direttamente da `ConditionalEditor` e `PredicateBuilder` (`components/ui/`).

**Compatibilità col tipo che `edge.source`/`edge.target` si aspettano**: **coincide**. Entrambi sono `PathExpr = string` (`irTypes.ts:17`); la grammatica emessa è esattamente il sottoinsieme accettato da `parsePathExpr` (`irCompile.ts:37-73`) e la forma `$feature…` soddisfa `firstFeatureOf` (`irEdgeViews.ts:158-162`, `irInteraction.ts:47-51`), quindi connect e reconnect funzionano.

**Distanza da colmare — piccola, e senza toccare il widget**: `PathBuilder` offre attributi **e** reference nella stessa Select (`:66-78`), mentre un capo deve essere una **reference** (altrimenti fallback silenzioso, OQ-3). La restrizione si ottiene passando `features={{ attributes: [], references: features.references }}` dal pannello: **~3 righe**, zero modifiche al design-system. In alternativa, una prop `only?: 'references'` su `PathBuilder` (~6 righe nel widget condiviso, usato da 8+ superfici).

**Caveat multiplicità**: per una reference multi-valore `PathBuilder` propone `values` e `values[N]` (`:83-91`). `$ref.values` (array intero) **non** risolve a un endpoint (`toId` `irEdgeViews.ts:194-198` rifiuta gli array) → fallback silenzioso; `$ref.values[0]` funziona. Rilevante perché il banco di prova candidato (Graph.ecore) ha `target` con `upperBound="-1"` (OQ-12).

### OQ-10 — `exclusive` sul ramo object

`exclusive` è **presente** in `EdgeViewIR` (`irTypes.ts:194`) ma **il resolver non lo consuma per gli edge**:

- l'unico consumo è `irResolveCore.ts:168` (`if (ir.exclusive === false) continue`), che si trova **dopo** il `continue` del ramo edge (`:143`) e del ramo row (`:165`): è raggiungibile solo da `vertex`/`graphVertex`;
- `CompiledEdgeView` (`irTypes.ts:260-281`) **non ha** un campo `exclusive`; `compileEdgeView` non lo legge.

Quindi il campo è **inerte per entrambe le nature del kind edge**. Non c'è alcuna ragione tecnica per introdurlo nel ramo object: **l'omissione (R-5) resta coerente**, ed esporlo produrrebbe un controllo che non ha effetto (lo stesso `HelpText` di `MatchingSection.tsx:160` già avverte che le view decorative non sono supportate — e per gli edge non sono nemmeno lette).

---

## Area 4 — Verifica e ambiente di prova

### OQ-11 — `__tests__/edgeAuthoring.test.ts` (136 righe)

Il file **non importa i componenti** (dichiarato `:9-14`: `EnableIRPanel`/`EdgeAuthoringPanel` non sono import-safe nell'ambiente node — joiner → monaco → `window`), e asserisce **letterali speculari** guidati attraverso `validateIR`/`compileEdgeView` reali.

Copertura attuale:

| Blocco | Righe | Cosa copre |
|---|---|---|
| `defaultEdgeViewIR — seed shape + validity` | `:23-49` | forma esatta del seed, assenza della chiave `reference`, validate+compile con i default (`isObjectAsEdge:false`, terminazioni, label/line null) |
| `EnableIRPanel — minimal edge seed` | `:51-73` | letterale speculare del ramo `kind === 'edge'` di `enable()` con metaclasse risolta |
| `reference matching (drop-key)` | `:75-87` | reference nominata → `compiled.reference`; chiave assente → `null` |
| `center label (drop-key)` | `:89-105` | `labels.center` → accessor; assenza → `labelText null` |
| `round-trip` | `:107-136` | ir completo clonato → validate → compile con i campi intatti, **incluso un campo non autorato dal pannello (`routing`)** |

**Casi che si estendono naturalmente al ramo object** (stesso stile, stesso motore):
1. **seed object valido**: letterale con `edge.source`/`edge.target` → `validateIR ok` e `compileEdgeView(...).isObjectAsEdge === true`.
2. **discriminante**: source senza target (e viceversa) → `isObjectAsEdge === false` (blinda OQ-1b, oggi non coperto da nessun test).
3. **wildcard inerte**: `metaclasses:'*'` + capi → `getIRIndex` non popola `objectAsEdgeByMetaclass` (richiede `getIRIndex`, come in `ir.test.ts:340-420`; blinda OQ-1c, oggi non coperto).
4. **drop delle chiavi**: assenza di `line`/`terminations`/`labels` → default invariati; assenza di `reference` sul ramo object.
5. **round-trip senza corruzione**: un ir object completo (con `persistWaypoints:false` e `routing`) sopravvive a clone → validate → compile.
6. **feature names per le gesture**: `firstFeatureOf` via `deriveIRInteraction` — `ir.test.ts:688-765` copre già `matchConnectRules`; un caso in più con una PathExpr `values[0]` verificherebbe che la connect rule resta valida.
7. **routing del kind**: già coperto per row (`ir.test.ts:350-368`); l'analogo edge — una view object non finisce mai nei bucket vertex/reference — non esiste.

`ir.test.ts:550-686` copre invece il **runtime** object-as-edge (sintesi, nodo nascosto, soppressione ref edge, endpoint proxy, handle geometrici, fallback su endpoint irrisolvibile) con il fixture `edgeWorld()` (`:526-548`, pattern `Transition{src,tgt}` su `State`).

### OQ-12 — Ambiente per la verifica visiva

**Snippet/helper di console per seedare una object-as-edge view: NON esiste.** L'unico helper è `irDemoFixture.ts` → `window.__jjodelInstallIRDemo(metaclassName?, boolAttrName?)` (`:89-119`, registrato `:129`, importato da `nodes/ObjectNode.tsx:39`), che installa un viewpoint con **due view vertex** (base + flag booleano) e **nessuna edge view**: `baseViewIR` `:28-54` e `flagViewIR` `:56-87` sono entrambe `kind:'vertex'`. Nessun residuo di E0 con seeding edge (grep `__jjodel` → 5 hit, tutti su questo helper).

**Metamodello con relazione reificata utilizzabile come banco: SÌ, esiste in repo.**
`frontend/src/__tests__/fixtures/xmi-m1/Graph.ecore`:
```
Graph { nodes: Node[*] containment, edges: Edge[*] containment }
Node  { name: EString }
Edge  { source: Node, target: Node[*] }          ← relazione reificata
```
con il modello M1 corrispondente `frontend/src/__tests__/fixtures/xmi-m1/references_test.xmi` (3 `Node` A/B/C + 3 `Edge`, che coprono le tre notazioni XMI di riferimento: path `//@nodes.0`, id, `xmi:idref`).

Due caveat verificati:
- **Non è usata da nessun test**: `ecore-io.test.ts` referenzia solo `DataType_test.ecore` e `DataType_collision_test.ecore` (`:10-12`); `grep "Graph.ecore"` su `frontend/src` = 0. Quindi la **compatibilità con l'importer non è dimostrata da un test verde** — va provata importando dalla UI.
- **`Edge.target` è multi-valore** (`upperBound="-1"`): la PathExpr del capo target dovrà essere `$target.values[0]` (OQ-9), e **la gesture di reconnect scrive `slot.value = newObjId`** (`EditorV2.tsx:1886`), semantica single-value su uno slot multi-valore — comportamento non verificato staticamente.

Alternativa "pulita" se si vuole un banco senza caveat: un metamodello minimo `StateMachine { State{name}, Transition{src: State, tgt: State} }` (entrambi single-valued, esattamente il fixture `edgeWorld()` dei test, `ir.test.ts:526-548`), creato a mano nella UI in 5 minuti, con 2-3 State e 2 Transition. Nessun file da aggiungere al repo.

---

## Area 5 — Fotografia dello stato git (nessuna azione eseguita)

**Commit locali non pushati** — `git log origin/alfonso-frontend-jjtl..HEAD --oneline` (23 commit, HEAD `b65bfe78f`, origin `07cee5219`):
```
b65bfe78f docs: log entry for the left-aligned Jjodie window
5edfaef88 docs: discovery for the left-aligned Jjodie window
3c3744f1b fix(jodie): left-align chat window in both floating and fullscreen mode
733dab0bb docs: log entry for the allowlist narrowing and rework telemetry
77edbfbc5 docs: narrow smoke allowlist and add rework telemetry to prompt log
3d1802002 docs: log entry for the visual smoke assertions
1b20cc5c8 test: add visual smoke assertions with console baseline
560987571 docs: log entry for the protocol alignment and smoke calibration
aa8b15f29 test: add smoke calibration script and playwright dev dependency
435c22da9 docs: align CLAUDE.md with docs/PROTOCOL.md, resolve four conflicts
8dde49e0a docs: log entry for the Jjodie window bottom-left default
5f8e5eb1d docs: discovery for the Jjodie window bottom-left default
ddc9be2cd fix(jodie): default chat window to bottom-left anchored to the FAB
b05e50364 protocol added
b21616a55 docs: discovery + log entries for the Jjodie FAB reposition
616cf47e6 fix(jodie): move minimized FAB to bottom-left inside canvas
ea02928fd fix(leftbar): disable Share unless the project is public
7cf864839 docs: archive log entries older than 2026-07-29
32c78c950 docs: log entries for the instances/left-rail serie A
315365eff feat(leftbar): wire rail items and new-actions to live flows, retire dead section navigation
1aebded92 chore(leftbar): remove dead symbols and orphaned styles
7baa32e8d fix(dock): stop remounting dock on interface mode change
7a048c9e0 docs: discovery report for instances/left-rail phase
```

**WIP nel working tree** — `git status --short`:
```
 M .claude/scheduled_tasks.lock
 M docs/mde-intelligence-2026/paper/main.pdf
 M docs/mde-intelligence-2026/paper/main.tex
 M frontend/src/components/Jodie/JodieWindow.tsx
 M frontend/src/components/editor-v2/nodes/ObjectNode.tsx
 M frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx
 M frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx
 M frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts
 M frontend/src/components/megamodel/MegamodelView.tsx
 M frontend/src/styles/components/_form-system.scss
?? docs/discovery/… (6 report non tracciati)
?? docs/mde-intelligence-2026/metrics-snapshot.md
?? frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx
```

**Stato dei file candidati alla Fase 2** (`git status --short` mirato su `viewpoint/`, `ViewData.tsx`, `ui/PathBuilder/`):

| File candidato | Modifiche non committate |
|---|---|
| `authoring/EdgeAuthoringPanel.tsx` | **no** (pulito) |
| `authoring/EnableIRPanel.tsx` | **no** |
| `ir/irDefaults.ts` | **no** |
| `ir/irTypes.ts` | **no** |
| `authoring/MatchingSection.tsx` | **no** |
| `authoring/__tests__/edgeAuthoring.test.ts` | **no** |
| `editors/views/ViewData.tsx` | **no** |
| `ui/PathBuilder/PathBuilder.tsx` | **no** |
| `ir/irResolveCore.ts`, `ir/irCompile.ts`, `ir/irEdgeViews.ts` | **no** |

**Nessun file candidato a E-obj ha modifiche pendenti.** Il WIP nella stessa cartella (`LabelEntryEditor.tsx`, `TextStyleEditor.tsx`, `irStyle.ts`, `TextStyleField.tsx` non tracciato) appartiene alla lane TextStyle e **non interseca** il perimetro E-obj: la Fase 2 può partire senza pushare, purché lo staging resti file-per-file (regola 17).

---

## Dipendenze e rischi

1. **Regressione sul ramo reference già verificato (rischio principale).** Il ramo E-ref (`9bd8cad9a`) è landed ma **senza entry di log e senza smoke documentato**. Ogni riga condivisa che E-obj riscrive (matching inline, ciclo draft/commit, help text) la mette a rischio. Il profilo di rischio più basso è additivo: nuove sezioni sotto gate di natura, nessuna riscrittura di `:174-218` e `:266-349`.
2. **La natura non è un dato, è una conseguenza.** Con il discriminante strutturale (OQ-1) una view "object" incompleta **è viva come reference-as-edge**: seleziona la metaclasse come SORGENTE e stila tutti gli edge M1 uscenti dalle sue istanze. Durante l'authoring (fra il primo e il secondo capo) l'utente vede un comportamento che non ha chiesto. Va deciso dove vive la natura (OQ aperta 2).
3. **Il flip di natura è ad alto impatto visivo e non annunciato.** Appena entrambe le PathExpr risolvono, `synthesizeObjectAsEdges` **nasconde il nodo** di ogni istanza della metaclasse (`irEdgeViews.ts:226`) e **sopprime i suoi edge reali** (`:228`). Autorare per errore la natura object su una metaclasse "normale" (es. `State`) fa sparire tutti i suoi nodi dal canvas. Non è un crash e non c'è nessun messaggio: è esattamente lo scenario in cui l'utente pensa di aver rotto il progetto.
4. **Wildcard silenzioso (`metaclasses:'*'` + natura object).** La view finisce in nessun bucket (`irResolveCore.ts:126`) e non produce **nulla**, senza warning. Il toggle "Tutte le metaclassi (*)" (`EdgeAuthoringPanel.tsx:270-275`) va disattivato o segnalato sul ramo object.
5. **IR ibridi accettati dalla validazione** (OQ-2): `reference` + capi (la reference è ignorata), oppure un solo capo (i capi sono ignorati). Nessun errore, nessun warning. Se il pannello non li impedisce, li produrrà.
6. **Propagazione a un layer non nominato nel prompt (regola 20): la superficie di interazione.** Indicizzare una object-as-edge view cambia **palette** e **connect rules** (`irInteraction.ts:64-78`: la metaclasse dell'oggetto-edge viene aggiunta alla palette e nasce una `IRConnectRule`). Autorare una view, cioè, modifica le gesture disponibili sul canvas. È già il comportamento attuale della fase E0 (non una novità di E-obj), ma va dichiarato nel Layer Impact Report della Fase 2 se il pannello permette di creare/rimuovere view object.
7. **Critical zone: E-obj NON la richiede.** Verificato: la persistenza del layout esiste già ed è landed (`canvasToJjom.ts:105-116` → `DVertex.irEdgeLayout`, `GraphDataElements.tsx:1690`), idratata in `EditorV2.tsx:1353-1362`, con gate `persistWaypoints` in `:159-173`. L'authoring non aggiunge scritture: **nessun tocco a `useJjomSync`/`portDistribution`/`canvasToJjom`/`syncState`**. Se in Fase 2 emergesse la necessità di scriverci, è un cambio di perimetro da fermare e riportare.
8. **`persistWaypoints` autorabile = cambia il comportamento di persistenza.** Se il pannello lo espone, metterlo a `false` rende session-only waypoint **e** side pin già persistiti (il gate è letto sia in scrittura `EditorV2.tsx:1329` sia in idratazione `:1353`). Non è distruttivo (il dato resta sul DVertex) ma smette di essere riletto.
9. **Reconnect su reference multi-valore non verificato**: `slot.value = newObjId` (`EditorV2.tsx:1886`) su uno slot `upperBound=-1` (caso `Graph.ecore`). Da provare a mano prima di scegliere quel banco.
10. **Allargare `MatchingSection` tocca il vertice.** Il rischio tecnico è contenuto (un solo consumer, `VertexAuthoringPanel.tsx:339-345`, dietro il gate `advanced`), ma `exclusive` (`:152-161`) è l'unico campo davvero specifico del vertice e va reso condizionale: se resta visibile sugli edge autora un campo che nessun resolver legge (OQ-10).

---

## Domande aperte per Alfonso (decisioni che la discovery non può prendere)

**Q1 — Dove si sceglie la natura?**
(a) Due voci in `EnableIRPanel` (`edge-reference` / `edge-object`). Costo: 5 punti di modifica in `EnableIRPanel` + 1 factory in `irDefaults`; la scelta però **non è persistibile** finché i capi sono vuoti (OQ-1a) → il seed "object" nasce reference.
(b) Una voce `edge` + toggle di natura dentro `EdgeAuthoringPanel`. Costo: ~2 stringhe in `EnableIRPanel`, tutto il resto dentro il pannello; la transizione è governabile e spiegabile all'utente nel punto in cui avviene.

**Q2 — La natura resta strutturale o diventa esplicita?**
(a) **Strutturale** (stato attuale): 0 modifiche allo schema, 0 al resolver; l'UI tiene la natura in stato locale React e la ri-deriva a ogni seed/reset. Prezzo: la view è viva-come-reference durante l'authoring incompleto, e riaprendo il pannello su un ir con capi vuoti la natura scelta è persa.
(b) **Esplicita** — campo opzionale in `EdgeViewIR` (es. `edge.nature?: 'reference' | 'object'`, ammesso dalla regola 11 perché additivo e opzionale). Costo: +1 riga in `irTypes.ts`; poi la scelta: lasciarlo **metadato di sola UI** (rischio divergenza dal comportamento reale del resolver) oppure farlo consumare da `compileEdgeView`/`irResolveCore` (≈ 5-8 righe, ma **cambia la semantica di risoluzione di ogni edge view esistente** → richiede Layer Impact-style di verifica e un test di non-regressione sul ramo reference).

**Q3 — Matching: `MatchingSection` allargata o inline?**
(a) Widening: ~10-14 righe sul componente condiviso (1 solo consumer), ma comporta rimuovere ~130 righe di matching inline già verificate dal ramo reference. `reference` resterebbe comunque fuori dal componente.
(b) Inline (stato attuale, sotto D8): ~2 righe di gate per nascondere il picker `reference` sul ramo object, 0 duplicazione nuova. Se invece si vuole un pannello separato: ~180 righe duplicate.

**Q4 — Wildcard sul ramo object**: nascondere il toggle `*` (l'autore non può creare una view inerte) oppure lasciarlo con un `ErrorText`/`HelpText` esplicito ("una object-as-edge con `*` non si applica a nulla")? Costo simile (~3 vs ~5 righe); cambia la filosofia — impedire vs informare.

**Q5 — Picker dei capi**: `PathBuilder` con `features` filtrate alle sole reference (~3 righe nel pannello, zero nel design-system) oppure una prop `only` su `PathBuilder` (~6 righe in un widget usato da 8 superfici)? E: si accettano i capi multi-valore (`$ref.values[0]`) o li si nasconde in v1 (⇒ `Graph.ecore` non è più un banco valido)?

**Q6 — `persistWaypoints` nel pannello**: esporlo (unico posto dove sarebbe autorabile; rischio rischio n. 8) o lasciarlo fuori come `routing`, round-trippando verbatim?

**Q7 — Avviso sull'effetto "nodo nascosto"**: il pannello deve avvisare che dichiarando i due capi le istanze della metaclasse spariranno come nodi (rischio n. 3)? Semplice `HelpText` o conferma esplicita al primo completamento dei due capi?

**Q8 — Banco di prova**: importare `Graph.ecore` + `references_test.xmi` (già in repo, zero lavoro, ma `target` multi-valore e importer non coperto da test) oppure costruire a mano un `StateMachine{State, Transition{src,tgt}}` (5 minuti, single-valued, identico al fixture dei test)?

---

## Mappa dei file candidati alla Fase 2

| File | Intervento previsto | Condizionato a |
|---|---|---|
| `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | **Principale**: rilevazione/selezione della natura; nuova sezione "Capi" con due `PathBuilder` (source/target) per il ramo object; gate del picker `reference` e del toggle wildcard; help text per natura | sempre |
| `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` | Estensione: seed object, discriminante one-endpoint, wildcard inerte, drop-key, round-trip object | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` | Nuova factory di seed object (`defaultObjectAsEdgeViewIR()`), oppure nessuna modifica se il seed resta unico | Q1(a) |
| `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` | Q1(a): +1 voce in `KIND_OPTIONS`, union dello stato, terzo ramo di seed, help. Q1(b): sole stringhe (`:11`, `:128-133`) | sempre (entità variabile) |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | +1 proprietà **opzionale** per la natura esplicita | Q2(b) |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` + `ir/irResolveCore.ts` | Consumo della natura esplicita nel discriminante (`isObjectAsEdge`) e/o gestione non silenziosa del wildcard object | Q2(b) / Q4 |
| `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (+ `VertexAuthoringPanel.tsx` al call-site) | Tipizzazione generica + `exclusive` condizionale | Q3(a) |
| `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` | Prop `only?: 'references'` | Q5 (alternativa: nessuna modifica) |
| `frontend/src/components/editors/views/ViewData.tsx` | **Nessuna modifica prevista** (routing per kind, OQ-7) — da toccare solo se si sceglie un secondo pannello | improbabile |
| `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState.ts` | **NESSUNO** — E-obj non richiede la critical zone (rischio n. 7) | mai |

Perimetro atteso della Fase 2: **3-4 file** nello scenario minimo (pannello + test + `EnableIRPanel` + eventuale `irDefaults`), sotto la soglia dei 5 file della regola 19.

---

## Riferimenti

- Discovery precedente: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (substrato), `docs/discovery/discovery_2026-07-26_edge_authoring_panel.md` (superficie di authoring pre-E-ref).
- Landing E-ref: commit `9bd8cad9a` (2026-07-28), 5 file; refactor successivo dei toggle: `e9913d3fa`. **Nessuna entry di log** per il landing (gap di processo).
- Siti chiave ri-verificati a HEAD: `irResolveCore.ts:44-60` (bucket), `:116-143` (routing kind), `:125-141` (discriminante di bucket), `:256-290`/`:293-320` (resolver); `irCompile.ts:404-450` (compile edge), `:430` (isObjectAsEdge); `irEdgeViews.ts:35-67` (style), `:114-139` (reference), `:164-255` (sintesi), `:158-162` (firstFeatureOf); `irInteraction.ts:53-84` (piano di interazione), `:112-134` (matchConnectRules); `useIRContainment.ts:152,158`; `EdgeAuthoringPanel.tsx:65-251` (ciclo+handler), `:253-438` (form); `EnableIRPanel.tsx:8-12,61,67-75,96-100`; `ViewData.tsx:61,84-105`; `MatchingSection.tsx:14-20,152-161`; `PathBuilder.tsx:17-25,66-91`; `pathExpr.ts:18-26`; `EditorV2.tsx:159-173,1325-1362,1858-1897`; `canvasToJjom.ts:105-116` (critical zone, sola lettura).
