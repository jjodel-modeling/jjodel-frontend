# Discovery — Ancoraggio delle label degli edge (ruolo + cardinalità) all'estremità target

> **Fase 1 — read-only.** Nessun file di codice modificato. Solo questo report + entry di log.
> Branch: `alfonso-frontend-jjtl`. Data: 2026-05-31.

## Sintesi in una riga

Role name e cardinalità sono **due `<div>` separati**, posizionati da **due
logiche geometriche diverse**: il ruolo sul **midpoint del segmento più lungo**
del path (migra per ogni edge), la cardinalità su un punto **vicino al target**
(inset 20px lungo l'ultimo segmento). Entrambi vivono già dentro `UnifiedEdge.tsx`
e — punto chiave per la fattibilità — il componente **ha già accesso** a
`targetX/targetY` (posizione schermo dell'handle di ingresso) e a `targetSide`
(lato dell'handle target). La convenzione-target è quindi implementabile **senza
esporre alcun dato nuovo**: serve solo riscrivere il posizionamento e fondere i
due div in un unico gruppo. Nessun file critical-zone va toccato.

---

## Risposte puntuali alle 10 domande

### 1. Role name — dove e a quali coordinate, e da dove arriva la stringa

- **Render**: `UnifiedEdge.tsx:667-692` — `<div className="edge-label ...">` dentro
  `<EdgeLabelRenderer>`. Trasformata: `translate(-50%,-50%) translate(${labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)` (`:672`).
- **Coordinate base** `labelPos`: `UnifiedEdge.tsx:280-283` → `computeLabelPosition(spreadPath)`
  (`edgeUtils.ts:792-814`). Questa funzione restituisce il **midpoint del segmento
  più lungo** del path (`edgeUtils.ts:796-811`). È la causa diretta del sintomo:
  con routing ortogonale multi-segmento, il segmento più lungo cambia da edge a
  edge, quindi il midpoint atterra in punti arbitrari.
- **Offset** `labelOffset`: `UnifiedEdge.tsx:285-313` — spostamento perpendicolare
  al segmento più lungo, in funzione dell'indice handle combinato (stacking di
  edge paralleli).
- **Stringa**: `labelText` (`UnifiedEdge.tsx:151`) inizializzato da
  `label || ref?.name || edgeData?.referenceName`. Per gli edge M2 la fonte è
  `data.reference.name`, costruito in `jjomTransformers.ts:505` da `refModel.name`
  (il `DReference.name` della JjOM). Anche `edge.label` è settato a `refModel.name`
  (`jjomTransformers.ts:530`).

### 2. Cardinalità — stesso componente o separato, coordinate, origine bounds

- **Componente: SEPARATO.** Secondo `<div className="edge-cardinality">` distinto,
  `UnifiedEdge.tsx:695-706`. Trasformata indipendente:
  `translate(-50%,-50%) translate(${cardinalityPos.x + cardinalityOffset.x}px, ${cardinalityPos.y + cardinalityOffset.y}px)` (`:700`).
- **Coordinate base** `cardinalityPos`: `UnifiedEdge.tsx:316-323` →
  `computeCardinalityPosition(spreadPath)` (`edgeUtils.ts:824-844`): prende
  l'**ultimo punto** del path (il target) e lo arretra di `offset=20px` lungo la
  direzione dell'ultimo segmento (`edgeUtils.ts:831-843`). Quindi la cardinalità è
  **già ancorata all'estremità target**, a differenza del ruolo.
- **Offset** `cardinalityOffset`: `UnifiedEdge.tsx:324-342` — perpendicolare
  all'ultimo segmento, stessa formula di stacking per indice handle del ruolo.
- **Stringa**: `cardinality = formatCardinality(ref.lowerBound, ref.upperBound)`
  (`UnifiedEdge.tsx:395`; `formatCardinality` in `types.ts:237-244`). Bounds da
  `data.reference.lowerBound/upperBound`, costruiti in `jjomTransformers.ts:508-509`
  da `refModel.lowerBound/upperBound`.

**Conclusione Q1+Q2**: ruolo e cardinalità nascono da **due funzioni diverse**
(`computeLabelPosition` = midpoint segmento più lungo; `computeCardinalityPosition`
= near-target). Sono disaccoppiati — è proprio l'origine dell'incoerenza percepita.

### 3. Geometria disponibile al render della label

Il componente ha **molto più** di `labelX/labelY`. Da `EdgeProps`
(`UnifiedEdge.tsx:113-128`) riceve direttamente:
- `sourceX, sourceY, targetX, targetY` — **coordinate schermo reali degli handle**
  agganciati (ReactFlow le risolve dalla posizione DOM dell'handle). `targetX/targetY`
  è quindi **il punto di ingresso sull'estremità target**, già usato per gli
  `EndpointHandles` (`EndpointHandles.tsx:50-51`).
- `sourceHandleId, targetHandleId` — id handle completi (formato `${side}-${index}`).
- `spreadPath` (locale) — da cui si estraggono gli ultimi due punti per la
  direzione del segmento di ingresso (già fatto in `cardinalityOffset`,
  `UnifiedEdge.tsx:326-330`).

Quindi il sito di rendering **non** è limitato al midpoint del path: ha sia
`targetX/targetY` sia il lato di ingresso.

### 4. Handle target — lato e posizione raggiungibili dal componente edge

**Sì, entrambi, senza passare per lo store.**
- **Lato**: `targetSide = getSideFromHandle(targetHandleId)` (`UnifiedEdge.tsx:175`;
  `getSideFromHandle` decodifica il prefisso `top|right|bottom|left` dell'id,
  `edgeUtils.ts:26-31`).
- **Posizione lungo il lato**: arriva come `targetX/targetY` (prop ReactFlow), cioè
  la posizione assoluta dell'handle. Non serve leggere `portDistribution`.

**Percorso del dato (handle side):**
`computePortDistribution` (`portDistribution.ts`) → `edgeHandles` →
`applyDistribution` in `EditorV2.tsx:826-847` setta `edge.sourceHandle/targetHandle`
(`:840-841`) → ReactFlow rende gli handle DOM tramite `DynamicHandles` (posizioni
fisiche calcolate da `handlePosition.ts:computeSidePositions`) → ReactFlow risolve
le coordinate assolute e le passa a `UnifiedEdge` come `targetX/targetY` +
`targetHandleId`. La side iniziale è scelta da `computeOptimalHandles`
(`jjomTransformers.ts:368,433`); non esiste un `selectOptimalSidesForEdges` (termine
del prompt → mappa su questi due).

### 5. Raggruppamento — un unico gruppo o due elementi indipendenti

**Due elementi indipendenti.** `edge-label` (`:667-692`) e `edge-cardinality`
(`:695-706`) sono due `<div>` fratelli dentro `EdgeLabelRenderer`, ciascuno con la
propria `transform` e le proprie coordinate base. Nessun wrapper-gruppo. Stili
separati: `.edge-label__text` (`EditorV2.scss:2052`) e `.edge-cardinality`
(`EditorV2.scss:2065`).

### 6. Costanti di offset esistenti

- `BUNDLE_SPREAD_PX = 12` (`UnifiedEdge.tsx:41`) — spread del corridoio centrale per
  edge in bundle.
- `LABEL_SPREAD_PX = 18` (`UnifiedEdge.tsx:42`) — passo di stacking delle label per
  indice handle (usato in `labelOffset` e `cardinalityOffset`).
- `MAX_HANDLES_PER_SIDE` (importata da `portDistribution.ts:29`) — usata nella
  formula di stacking (`:308,337`).
- Self-loop (`edgeUtils.ts:626-631`): `SELF_LOOP_INSET=16`, `SELF_LOOP_SIZE=24`,
  `SELF_LOOP_RING_STEP=14`, `SELF_LOOP_LABEL_OFFSET=10`, `SELF_LOOP_CARD_OFFSET=14`,
  `SELF_LOOP_CARD_T=0.28`.
- `computeCardinalityPosition` ha un offset default di `20px` (`edgeUtils.ts:826`).
- `DETOUR_PADDING=30` (`edgeUtils.ts:16`) — routing, non label.

**Non esiste** una costante "offset fisso fuori dal box per il gruppo-label" — andrà
aggiunta in Fase 2.

### 7. eOpposite — secondo edge o seconda label?

**Secondo edge, con proprio gruppo-label.** Una bidirezionale Ecore è composta da
**due `DReference`** distinte, ciascuna → un `DVoidEdge` → un RF edge → una propria
istanza `UnifiedEdge` con la propria label/cardinalità. Il campo `opposite` è solo
una **stringa** (nome dell'opposta) memorizzata in `data.reference.opposite`
(`jjomTransformers.ts:511`; tipo `MetaReference.opposite?: string`, `types.ts:59`) e
**non** usata per renderizzare una seconda label sullo stesso edge.

*Implicazione per la convenzione-target*: è un punto a favore. Ancorando ogni
gruppo alla **propria** estremità target, le due frecce opposte mettono le rispettive
label ai due capi diversi (ognuna sul suo ingresso), evitando la sovrapposizione che
oggi nasce quando entrambe puntano vicino al midpoint.

### 8. Generalization — niente label di ruolo/cardinalità

**Confermato.** Per `isInheritance`:
- il blocco label è gated `!isInheritance` (`UnifiedEdge.tsx:667`);
- `showCardinality = (uml|wireframe) && !isInheritance && !isM1Edge` (`:394`) → falso;
- l'edge data inheritance è `{}` (`jjomTransformers.ts:544`), nessun `reference`.
L'unica label inheritance è "**ISA**" in notazione ER, al midpoint (`:485-498`,
`:709-720`) — non un ruolo/cardinalità.

### 9. Composition/aggregation — dove il diamante, dove la cardinalità

- **Diamante all'estremità source (aggregato/whole)**: è un **SVG marker**
  (`markerStart`), `UnifiedEdge.tsx:541-544` (filled per composition, hollow per
  aggregation), posizionato automaticamente da SVG sull'endpoint **source**. Non è
  toccato dal codice di posizionamento label.
- **Freccia all'estremità target (parte)**: `markerEnd` (`:546-548`).
- **Cardinalità all'estremità target**: `computeCardinalityPosition` near-target
  (vedi Q2). Il diamante e la cardinalità stanno quindi su **estremità opposte** e
  non vanno toccati: la convenzione-target sposta solo il **gruppo-label** verso il
  target, dove la cardinalità già sta, e dove non c'è il diamante.

*Nota M1*: per `composition`/`instanceRef` (M1) i diamanti e la cardinalità sono
soppressi (`showDiamonds`/`showCardinality` falsi per `isM1Edge`, `:393-394`); la
label M1 è hidden-by-default, visibile su hover/selezione (`:669`).

### 10. ReactFlow — EdgeLabelRenderer (HTML) o `<text>` SVG

**`EdgeLabelRenderer` (overlay HTML)** per tutte le label/cardinalità
(`UnifiedEdge.tsx:664-721`). I path sono SVG, ma testo e cardinalità sono `<div>`
HTML in overlay. La label nativa ReactFlow è disattivata via CSS
(`EditorV2.scss:2158-2160`). Un solo componente edge registrato per tutti i tipi:
`edgeTypes = { reference, inheritance, composition, instanceRef } → UnifiedEdge`
(`EditorV2.tsx:101-105`).

---

## Verdetto di fattibilità della convenzione-target

> Un unico gruppo-label per edge (`ruolo cardinalità`), ancorato all'estremità
> target, agganciato all'handle di ingresso (lato + posizione), offset fisso fuori
> dal box; perpendicolare sopra per ingresso orizzontale (left/right), a fianco per
> ingresso verticale (top/bottom); nessun midpoint.

**IMPLEMENTABILE COSÌ COM'È — nessun dato nuovo da esporre.** Tutti gli ingredienti
sono già nelle props/local del componente:

| Ingrediente richiesto | Già disponibile? | Fonte |
|---|---|---|
| Posizione estremità target | ✅ | `targetX, targetY` (prop RF) |
| Lato di ingresso (top/right/bottom/left) | ✅ | `targetSide = getSideFromHandle(targetHandleId)` (`:175`) |
| Direzione segmento di ingresso | ✅ | ultimi 2 punti di `spreadPath` (già in `cardinalityOffset`, `:326-330`) |
| Stringa ruolo | ✅ | `ref.name` |
| Stringa cardinalità | ✅ | `formatCardinality(ref.lowerBound, ref.upperBound)` |
| Stacking per edge paralleli | ✅ | indice handle (`getHandleIndex`) già usato |

**Cosa cambia in Fase 2 (a livello concettuale, non implementato qui):**
1. Sostituire `labelPos` (midpoint segmento più lungo) con un ancoraggio basato su
   `targetX/targetY + targetSide + offset fisso` — la stessa famiglia di logica che
   `computeCardinalityPosition` già usa per la cardinalità.
2. Fondere i due `<div>` (`edge-label` + `edge-cardinality`) in **un unico gruppo**
   `ruolo cardinalità` (un wrapper flex-row, oppure due figli con base comune),
   così che restino solidali.
3. Regola di offset perpendicolare in funzione di `targetSide`: sopra per
   left/right, a fianco per top/bottom — l'informazione lato c'è già.

**Caveat da preservare in Fase 2 (non degradare comportamento committato):**
- **Self-loop** (`source === target`): ha già un ancoraggio dedicato all'angolo del
  loop (`computeSelfLoopCornerPath`, `edgeUtils.ts:648-730`; rami
  `UnifiedEdge.tsx:280-283,316-323`). È già endpoint-based — va lasciato sul suo
  ramo, non instradato sulla nuova regola.
- **Stacking di edge paralleli**: la separazione per indice handle
  (`labelOffset`/`cardinalityOffset`) resta utile per più edge che entrano sullo
  stesso lato; va riagganciata al nuovo ancoraggio (base sul lato target), non
  rimossa.
- **M1 hover-visibility** (`edge-label--m1-hover`, `:669`) e **highlight class**
  (`hlClass`) devono restare sul nuovo wrapper.
- **Editing inline** del ruolo (doppio click → `<input>`, `:678-690`) e
  `commitLabel`/`syncEdgeRefProperty` (`:358-378`) restano agganciati al ruolo nel
  gruppo.
- Notazione: `showCardinality` dipende da `notation` (`:394`); in notazioni senza
  cardinalità il gruppo mostra solo il ruolo.

**Nessun dato mancante.** Non serve toccare `portDistribution.ts` né
`handlePosition.ts` né il sync: il lato e la posizione dell'handle target arrivano
già al componente (Q3/Q4).

---

## File che una eventuale Fase 2 dovrebbe toccare (e perché)

| File | Perché | Critical-zone? |
|---|---|---|
| `editor-v2/edges/UnifiedEdge.tsx` | **Primario.** Fondere i due div in un gruppo; sostituire `labelPos`/`labelOffset` (midpoint) con ancoraggio target-handle; riusare/estendere la regola di `cardinalityOffset`. | No |
| `editor-v2/utils/edgeUtils.ts` | Aggiungere un helper di ancoraggio target-based (es. `computeTargetAnchoredLabel(targetX, targetY, targetSide, lastSegDir, offset)`) e una costante di offset fisso. **Non** rimuovere `computeLabelPosition`/`computeCardinalityPosition` (regola di preservazione: marcarle se diventano inutilizzate, non cancellarle). | No |
| `editor-v2/EditorV2.scss` | Adattare `.edge-label`/`.edge-cardinality` per il layout a gruppo unico (flex-row `ruolo cardinalità`), preservando i selettori esistenti (highlight `hl-c*`, `--m1-hover`, `selected`). | No (ma classi = API pubblica: non rinominare) |

**File che NON vanno toccati** (la side+posizione target arriva già al componente):
`portDistribution.ts`, `useJjomSync.ts`, `handlePosition.ts`, `canvasToJjom.ts`,
`jjomTransformers.ts`. Nessuna migrazione `VersionFixer` necessaria: handle e
coordinate sono props di render effimere, non `jsxString` persistito.

---

## HARD STOP

Report scritto. Nessuna modifica al rendering, nessun refactoring. L'analisi
prosegue in chat per decidere la Fase 2.
