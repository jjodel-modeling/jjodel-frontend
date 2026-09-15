# IR Schema Addendum: edge authoring (estensione della v1.2 §7)

**Data**: 2026-07-26
**Stato**: ratificato da Alfonso (OQ-1..OQ-9 del discovery report + due decisioni di chat: renderer E0 e ordine di landing).
**Fonti**: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (repo, findings con file:riga) + analisi in chat del 2026-07-26.
**Rapporto con la v1.2**: addendum additivo alla §7 (`EdgeSpec`). Nessuna modifica ai kind esistenti, nessun bump di `irVersion`. Lo schema edge è già in codice (`EdgeViewIR`, `CompiledEdgeView`): questo addendum ratifica il perimetro v1 e le decisioni di rendering/authoring, non introduce nuovi campi obbligatori.

## 1. Motivazione e stato reale

La discovery ha falsificato l'ipotesi "edge = capitolo da scrivere". Lo stack IR edge è già vivo e col test verde: resolve, compile, decorate, interact, persist, react. Restano due buchi soli:

- **Renderer dead-write**: `applyEdgeStyle` (`irEdgeViews.ts:49-72`) produce stroke/width/dash/marker/label, ma `UnifiedEdge` li ignora, perché destruttura solo id/coords/handles/data/label/type e non usa `<BaseEdge>` (`UnifiedEdge.tsx:62-76`). Lo stile IR non si vede: colore, spessore, tratteggio e marker autorati non arrivano a canvas.
- **Authoring assente**: nessun `EdgeAuthoringPanel`/`useIREdgeView`/`defaultEdgeViewIR` (grep = 0); `EnableIRPanel` offre solo vertex/row; `ViewData.showIRTab` esclude edge.

Tutto il resto è già landato: bucket resolver per entrambe le nature (`edgeByMetaclass`/`edgeWildcard`, `objectAsEdgeByMetaclass`), compile (`compileEdgeView`, `irCompile.ts:382-428`), decorazione a canvas (`decorateReferenceEdges` + `synthesizeObjectAsEdges`, cablate in `useIRContainment.ts:152,158`), connect/reconnect, persistenza `DVertex.irEdgeLayout` a loop chiuso (write `canvasToJjom.ts:90-101`, hydrate `EditorV2.tsx:1308-1331`), reattività cross-oggetto della label.

Due nature, **entrambe in scope**:

- **object-as-edge**: `DObject` reificato reso come linea; matcha sulla metaclasse propria; capi da `edge.source`/`edge.target` PathExpr; carrier di layout = DVertex nascosto (persistenza già viva). La sua geometria (nodo nascosto + linea sintetica) è l'unica cosa IR-edge già visibile oggi.
- **reference-as-edge**: EReference resa come linea (M1: `instanceRef`/`composition`); matcha su metaclasse-sorgente + nome reference; capi intrinseci al link; nessun carrier di layout.

La differenza operativa tra le due è UNA: su cosa matcha la view. Compiled view, rendering e widget di authoring sono condivisi.

## 2. Decisioni ratificate

**D1 (renderer E0, chiude OQ-1)**: E0 consuma lo stile IR con un **ramo gated dentro `UnifiedEdge`**, attivo solo quando `data.irEdgeViewId` è presente; NON un componente edge dedicato. `applyEdgeStyle` riscrive lo stile in vocabolario di dominio dentro `e.data` (leggibile da UnifiedEdge) invece che su `e.style`/RF `markerStart`/`markerEnd`, che il componente non può consumare senza `<BaseEdge>`. Rationale: minor cognitive load (un solo renderer, un solo modello mentale); il gate rende il path classic byte-identico quando l'IR è assente, azzerando la regressione sugli edge M2 condivisi (rischio #1 della discovery); zero duplicazione della macchina Manhattan/handle/marker che driftrebbe tra due componenti.

**D2 (matching pre-lift, chiude OQ-5)**: reference-as-edge matcha sui capi **originali (pre-lift)**, non su quelli post-lift dell'antenato. Oggi `decorateReferenceEdges` risolve su `objByVertex.get(e.source)` che, girando dopo il lift, è l'antenato: semanticamente incoerente. Impl: preservare gli id-oggetto originali dei capi sul `data` dell'edge prima del lift, e risolvere su quelli. Riguarda solo reference-as-edge (object-as-edge risolve su `objectId`, già lift-invariante). **Entra in E0**, perché è E0 a rendere il bug visibile.

**D3 (Manhattan, chiude OQ-4)**: routing **congelato** in v1 (SNAP=8, sempre ortogonale, `computeManhattanPath`). `edge.routing`/`irRoutingHint` restano dichiarati-inerti. Tiene E0 interamente fuori dalla critical zone.

**D4 (persistenza, chiude OQ-6)**: reference-as-edge **senza persistenza di layout** in v1 (routing sempre derivato, equivalente a `persistWaypoints:false`). object-as-edge tiene la sua persistenza già landata (`DVertex.irEdgeLayout`). Un carrier per reference-as-edge tocca `canvasToJjom.ts` (critical zone) e senza routing configurabile non ci sarebbe nulla da persistere comunque.

**D5 (matching reference, chiude OQ-2)**: chiave = **metaclasse-sorgente + refName** (lo score +0.5 per le view che nominano la reference esiste già, `irResolveCore.ts:273-276`). Target NON nella chiave in v1; la discriminazione per target, nel raro caso serva, passa dal `predicate` (E-ref conferma che il predicate degli edge veda il target del link). Target-in-key = estensione additiva futura.

**D6 (feature set, chiude OQ-3)**: v1 = label center (TextSource) + linea (color/width/dash) + terminazioni/marker + conditionals. La label center autorata nell'IR è **sempre visibile**; l'hover-gating M1 attuale resta solo per gli edge non autorati. Entra in E0.

**D7 (edge assorbiti, chiude OQ-8)**: **as-is**. Il lift/suppress di `decorateEdges` (`irContainment.ts:240-277`) è generico e corretto; l'unica interazione problematica (matching post-lift) è chiusa da D2. Nessuna semantica nuova per gli edge dei row children soppressi.

**D8 (authoring, chiude OQ-7)**: nuovo **`EdgeAuthoringPanel`** (non estensione di Vertex/Row), coerente col precedente R3. Entry-point: kind `edge` in `EnableIRPanel` con un **toggle di natura** (object / reference); `ViewData.showIRTab` esteso a `edge` con guard anti-reseed a vertex. `MatchingSection` (che è tipizzata `VertexViewIR` e include `exclusive`, presente anche in `EdgeViewIR`) va allargata a `EdgeViewIR` per il ramo object; il ramo reference usa matching inline (metaclasse-sorgente + refName). Riusati senza modifiche: `TextSourceEditor`, `PredicateBuilder`, `ConditionalEditor`, `ColorPicker`, `Select`, `NumberInput`, `ListEditor`; nuovi widget piccoli: editor stile linea, picker terminazione/marker.

**D9 (ordine di landing, decisione chat)**: **E0 → E-ref → E-obj**. E0 accende lo styling di entrambe le nature; E-ref rende autorabile dal pannello il class diagram reale (dominato da ereditarietà e reference di dominio); E-obj segue per i metamodelli che reificano le relazioni.

## 3. Confine con la critical zone

E0, E-ref ed E-obj sono presentazione pura e stanno **interamente FUORI** dalla critical zone (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState`). Toccano: `edges/UnifiedEdge.tsx`, `viewpoint/ir/irEdgeViews.ts`, `viewpoint/ir/irContainment.ts` (ordine/dati di decorazione), `authoring/EnableIRPanel.tsx`, `editors/views/ViewData.tsx`, nuovo `authoring/EdgeAuthoringPanel.tsx`, `authoring/MatchingSection.tsx`. La persistenza object-as-edge esistente passa già da `canvasToJjom.ts:90-101` (landata: non si tocca in v1).

Rinviato con go-ahead + Layer Impact Report: routing configurabile (geometria/`portDistribution`/`edgeUtils`), carrier di persistenza per reference-as-edge (nuovo campo in `canvasToJjom`).

## 4. Fasizzazione

**E0 (keystone) — rendering IR-driven, entrambe le nature.** Far consumare a `UnifiedEdge` lo stile IR gated su `data.irEdgeViewId`: stroke/width/dash, terminazioni mappate ai marker di dominio che UnifiedEdge già disegna, label center sempre visibile quando l'IR la dichiara. Include il fix di matching pre-lift (D2). NON tocca il routing (D3). Al termine, entrambe le nature sono stilabili via edge view seedate da console. Verifica visiva su CD3 con snippet, hard stop prima del commit.

**E-ref — authoring reference-as-edge.** Nuovo `EdgeAuthoringPanel` ramo reference (picker metaclasse-sorgente + refName + target opzionale via predicate), entry-point edge in `EnableIRPanel` + route in `ViewData` con guard anti-reseed. Resolver già pronto (`edgeByMetaclass` + score refName). Rende autorabile il class diagram reale senza console.

**E-obj — authoring object-as-edge.** Ramo object del panel (matching sulla metaclasse propria via `MatchingSection` allargata; editor `edge.source`/`edge.target` PathExpr). Per metamodelli che reificano le relazioni.

## 5. Fuori scope v1 (slice future dichiarate)

- Routing configurabile (`edge.routing`/`irRoutingHint` restano inerti) → slice con LIR.
- Persistenza di layout per reference-as-edge (nessun carrier) → slice con LIR.
- Target-metaclass nella chiave di matching (oggi via predicate) → estensione additiva.
- Edge M2 (`reference`) nel path IR: oggi la decorazione IR filtra solo M1 (`instanceRef`/`composition`), gli M2 non entrano nel path IR.
- Editing inline degli edge, decorative edge, famiglia marker estesa.
- Cleanup dei metadati dead-write residui: `irRoutingHint` resta dead finché non arriva la slice routing (documentarlo, non rimuoverlo); `irEdgeViewId`/`irLabelPlacement` smettono di essere dead a E0.

## 6. Riferimenti

- Discovery: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (repo).
- Schema base: `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` §7 (`EdgeSpec`), §6 (`InteractionSpec.connect`).
- Prior art per kind: `claude/spec_2026-07-25_ir_row_dispatch_addendum.md` (bucket/compile/resolve, authoring R3, comparatore condiviso).
- Mappa di copertura: `claude/mappa_sintassi_concreta.md` (aggiornare la riga edge dopo E0).
- Siti chiave (dalla discovery): `irResolveCore.ts:44-60,116-141,256-320`, `irCompile.ts:382-428`, `irEdgeViews.ts:49-72,118-257`, `UnifiedEdge.tsx:62-76,477-484,592-599`, `irContainment.ts:240-277`, `ViewData.tsx:58`, `EnableIRPanel.tsx:8-11`.
