# Discovery — Stato della tipografia sugli elementi testuali dell'IR (read-only)

**Data**: 2026-07-27
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery pura (read-only). Zero modifiche al codice, nessun build.
**Nome documento prompt**: 2026-07-27 14:56

---

## Obiettivo

Stabilire, con evidenza dal codice del branch (non dallo snapshot dei documenti),
cosa è oggi realmente **esprimibile nei tipi**, **reso al DOM** e **autorabile
nell'UI** per lo stile tipografico (font-family, size, weight, style, color) dei tre
tipi di elemento testuale di una view IR: label dei vertici, righe dei compartimenti,
label di edge. E individuare il divario spec-vs-codice.

## Risultato in una riga

**Non esiste alcuna primitiva `TextStyle` nel codice, e nessuna delle tre superfici
testuali espone stile tipografico né nei tipi né nell'authoring.** La tipografia è
interamente hard-coded nel CSS/SCSS. L'unica proprietà tipografica che raggiunge il
DOM da dati IR è il **colore della label di edge**, che eredita `line.color` (E0b) —
non è un controllo di testo indipendente. La spec v1.2 dichiara `LabelSpec.style?:
TextStyle`, ma quel campo **non esiste** in `irTypes.ts`: divergenza confermata.

---

## File letti / analizzati (path completi)

**Type system**
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (intero)

**Renderer / interprete**
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (intero — BASE_CSS)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (label + edge compile, righe 266-290, 405-421)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (intero — `applyEdgeStyle`)
- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (label render, 104-122, 535-539, 557-808)
- `frontend/src/components/editor-v2/EditorV2.scss` (`.edge-label__text` 2154-2177)

**Authoring UI**
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (grep mirato)
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` (grep mirato)

**Spec (per il confronto)**
- `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (sez. 3, 5, 7). Nota: la v1.1
  (`spec_2026-06-08_ir_schema_v1_1.md`) **non è presente nel repo**; `TextStyle` è
  dichiarato "come v1.1 sez. 3" e non ha definizione materializzata in questo branch.

**Grep globali chiave**
- `grep -rn "TextStyle" frontend/src/` → **(no matches)** — nessun tipo `TextStyle` nel codice.
- `grep -rn "fontFamily|font-family" frontend/src/components/editor-v2/` → solo SCSS
  statici (`var(--font-sans)`, `'IBM Plex Mono'…`) e la debug `ReproHarness.tsx`.
- `grep -rn "fontFamily|fontWeight|fontStyle|fontSize|font-family|TextStyle|textStyle|typography|italic|bold" .../authoring/`
  → solo i chip UI dei pannelli (`CHIP` con `fontStyle:'italic'`), **nessun controllo di modello**.

---

## Findings per domanda (COSA 1-7)

### 1. Esiste un tipo `TextStyle` nei tipi IR?

**No.** `grep -rn "TextStyle" frontend/src/` restituisce zero occorrenze. Non esiste
alcun `fontFamily`, `size`/`fontSize`, `fontWeight`, `fontStyle` né text-`color` in
nessuna struttura IR. `irTypes.ts` non definisce e non importa `TextStyle`.

Le uniche proprietà "style" nei tipi IR sono **non tipografiche**:
- `ShapeSpec.border` → `style: 'solid' | 'dashed' | 'dotted'` (stile del bordo, `irTypes.ts:95`);
- `EdgeViewIR.edge.line.style` → `Conditional<'solid'|'dashed'|'dotted'>` (stile della linea, `irTypes.ts:178`).

Conseguenza: la domanda su fontFamily / size statico-vs-condizionabile / pesi
numerici / fontStyle è **vacua nel codice** — nessuno di questi assi è modellato.

### 2. Quali strutture referenziano stile tipografico inline?

**Nessuna.** Verifica puntuale sui tipi (`irTypes.ts`):

| Struttura | Righe | Campi | Campo `style`/tipografico? |
|---|---|---|---|
| `LabelSpec` | 55-61 | `position`, `source`, `visible?`, `editable?` | **NO** (nessun `style`) |
| `FieldCompartmentSpec` | 76-90 | `id`, `source`, `rowFormat:{segments}`, `visible?`, `separator?` | **NO** (`rowFormat` ha solo `segments`) |
| `FieldSegment` | 70-74 | `name` / `type` / `value{editable?}` / `literal{text}` | **NO** (nessuno stile per-segmento) |
| `EdgeViewIR.edge.labels` | 183-186 | `center?: TextSource`, `placement?` | **NO** (TextSource puro; niente `source`/`target`) |

Snippet `LabelSpec` (`irTypes.ts:55-61`) — conferma il finding della discovery B2a:
```typescript
export interface LabelSpec {
    position: LabelPosition;
    source: TextSource;
    visible?: Conditional<boolean>;
    editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' };
}
```

Snippet edge labels (`irTypes.ts:183-186`):
```typescript
labels?: {
    center?: TextSource;
    placement?: 'auto' | 'above' | 'below';
};
```
`TextSource` (`irTypes.ts:50-53`) è puro testo (`path` | `literal` | `intrinsic`), zero stile.

Le forme compilate confermano la stessa assenza: `CompiledLabel` (`irTypes.ts:309-315`)
= `{position, text, visible, editsName}`; `CompiledFieldCompartment` (`irTypes.ts:324-332`)
= `{id, source, segments, childFilter?, visible, separator}`. Nessun campo di stile.

### 3. Dove viene consumato lo stile tipografico? Cosa arriva al DOM?

Non esiste consumo di stile tipografico da dati IR (perché il dato non esiste). La
tipografia è **interamente hard-coded** nel CSS/SCSS. Per superficie:

**Label dei vertici** — `IRNodeContent.tsx:167-199` rende ogni label come
`<span className="ir-label ir-label--${position}">`. Gli unici inline-style emessi da
`IRNodeContent` sono `background` (fill) e `border` (`IRNodeContent.tsx:124,129`),
**mai** font. La tipografia viene da `BASE_CSS` in `irStyle.ts`:
```
.ir-label { font-size: 11px; line-height: 1.3; … }           // irStyle.ts:19
.ir-label--top    { … font-weight: 600; }                     // irStyle.ts:20
.ir-label--center { … font-weight: 600; }                     // irStyle.ts:21
```
`font-family` e `color` non sono impostati su `.ir-label`: ereditano dall'antenato
(`.ir-node-content` / root `.editor-v2` con `font-family: var(--font-sans)`,
`EditorV2.scss:18`). Il compile della label (`irCompile.ts:266-290`) produce
`{position, text, visible, editsName}` — nessuno stile viene compilato.

**Righe dei compartimenti** — `IRNodeContent.tsx:226-266` (slot-mode) e `IRRow.tsx:23-30`
(dispatch-mode R2) rendono ogni riga come `<div className="ir-row">` con `<span>` nudi
per segmento. Tipografia da `BASE_CSS`:
```
.ir-compartment .ir-row { font-size: 11px; line-height: 1.4; … }   // irStyle.ts:31
```
Nessun inline-style, nessuna weight/style/color per riga o per segmento.

**Label di edge** — percorso `UnifiedEdge`. Il testo è reso a
`UnifiedEdge.tsx:775`:
```typescript
<span className="edge-label__text" style={isIREdge && irStroke ? { color: irStroke } : undefined}>{labelText}</span>
```
Tipografia base da SCSS `.edge-label__text` (`EditorV2.scss:2154-2163`):
```scss
.edge-label__text {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--text-secondary);
    …
}
```
L'**unica** proprietà tipografica derivata da dati IR è `color`, impostato inline a
`irStroke` (= `line.color` risolto) quando l'edge è IR e ha un colore autorato (E0b).

### 4. Campi tipografici dichiarati-ma-mai-letti / letti-ma-mai-applicati?

Non ci sono dead-read né dead-apply **tipografici**, perché non esiste alcun campo
tipografico dichiarato. Classificazione dei cinque assi:

| Asse | Vertex label | Row/field | Edge label |
|---|---|---|---|
| font-family | **assente** (tipi) | **assente** | **assente** |
| size | **assente** | **assente** | **assente** |
| weight | **assente** | **assente** | **assente** |
| style (italic) | **assente** | **assente** | **assente** |
| color | **assente** | **assente** | **assente** come campo di testo; il colore reso viene da `line.color` (non testo) |

"Assente" = non dichiarato-nei-tipi, quindi non c'è né dead-read né rendering da dato.
Ciò che è **reso** proviene da costanti CSS (dichiarato+reso lato CSS, ma non
parametrizzabile dall'IR). Nota di contesto: `irStyle.ts:101-110` (`staticCssFor`)
è un hook per parti statiche per-view che **oggi non emette nulla** (`if (rules.length
=== 0) return ''`), esplicitamente tenuto come gancio futuro — è il punto naturale dove
uno stile per-view potrebbe atterrare, ma non è tipografico oggi.

### 5. Edge label: colore da `line.color` (E0b) e override tipografico?

**Confermato.** `applyEdgeStyle` (`irEdgeViews.ts:35-66`) risolve
`color = cv.lineColor(...)` e lo emette in `data.irStroke` (`irEdgeViews.ts:58`).
`UnifiedEdge` consuma `irStroke` sia per lo stroke del path/marker sia, esclusivamente,
per il **colore del testo** della label (`UnifiedEdge.tsx:775`). Il commento E0b è
esplicito (`UnifiedEdge.tsx:535-539`): le terminazioni ereditano `line.color`.

**Nessun override tipografico dedicato per la label di edge**: font-family (`var(--font-sans)`)
e font-size (`10px`) sono hard-coded in `.edge-label__text` (`EditorV2.scss:2155-2156`);
weight e style non sono impostati (default `normal`). Il label text proviene da
`labels.center` (compilato a `labelText`, `irCompile.ts:419`; risolto in `irEdgeViews.ts:41`);
in assenza, fallback al nome della reference (`UnifiedEdge.tsx:115`).

### 6. Controlli tipografici nell'authoring UI?

**Nessun pannello espone controlli tipografici sul modello.** Enumerazione dei campi
editabili per editor:

- **`LabelEntryEditor.tsx`** (label vertice): `Position` (Select), `Source`
  (TextSourceEditor), `Editable` (Checkbox / chip read-only), `Visible`
  (ConditionalEditor). **Nessun font/size/weight/style/color.**
- **`TextSourceEditor.tsx`**: solo la *sorgente* del testo — `from`
  (intrinsic/path/literal) + prop intrinseca / testo letterale / PathBuilder.
  **Nessuno stile.**
- **`FieldSegmentEditor.tsx`** (cella di riga): `kind` (Select), testo `literal`
  (Input), `editable` per `value` (Checkbox / chip). **Nessuno stile.**
- **`FieldCompartmentListEditor.tsx`** (compartimento): `Id`, `Source`, `Filtro
  children`, lista di segmenti (FieldSegmentEditor), `separator`, `visible`.
  **Nessuno stile.**
- **`RowAuthoringPanel.tsx`** (row view R1): Matching (metaclassi/condizione/priorità),
  `Template` (lista di TextSourceEditor), `Visible` (Conditional), `Label`.
  **Nessuno stile.**
- **`EdgeAuthoringPanel.tsx`** (edge view): Matching; **Linea** → `Colore`
  (ConditionalEditor+ColorPicker), `Spessore`, `Tratto`; Terminazioni; **Label** →
  checkbox "Label al centro" + TextSourceEditor (solo sorgente). Il `Colore` autora
  `line.color`, che a render colora **anche** il testo della label (E0b) — ma è un
  controllo di *linea*, non un controllo tipografico della label.

I match `fontSize`/`fontStyle:'italic'` trovati in
`LabelEntryEditor.tsx:16-18`, `FieldSegmentEditor.tsx:15-17`,
`FieldCompartmentListEditor.tsx:64-66` sono lo **styling dell'UI del pannello stesso**
(il costante `CHIP` read-only), non controlli sul modello.

### 7. Tabella di sintesi spec-vs-codice

Legenda celle: **T** = presente nei tipi IR · **R** = reso al DOM da dato IR · **A** =
autorabile in UI. `·` = assente. `(css)` = reso ma da costante CSS hard-coded (non
parametrizzabile dall'IR).

| Asse ↓ / Superficie → | Vertex label | Row / field | Edge label |
|---|---|---|---|
| **font-family** | T`·` R`(css var(--font-sans))` A`·` | T`·` R`(css var(--font-sans))` A`·` | T`·` R`(css var(--font-sans))` A`·` |
| **size** | T`·` R`(css 11px)` A`·` | T`·` R`(css 11px)` A`·` | T`·` R`(css 10px)` A`·` |
| **weight** | T`·` R`(css 600 top/center; default altrove)` A`·` | T`·` R`(css default)` A`·` | T`·` R`(css default)` A`·` |
| **style (italic)** | T`·` R`·` A`·` | T`·` R`·` A`·` | T`·` R`·` A`·` |
| **color** | T`·` R`(css eredita)` A`·` | T`·` R`(css eredita)` A`·` | T`·` R`✓ da line.color (E0b)` A`indiretto via edge.line.color` |

**Divergenze rispetto alla spec `TextStyle`**:
1. **`LabelSpec.style?: TextStyle`** è dichiarato in spec v1.2 sez. 5
   (`docs/specs/…v1_2.md:71`) ma **assente** in `irTypes.ts:55-61`. Divergenza
   confermata (già segnalata dalla discovery B2a).
2. **`EdgeSpec.labels.source?` / `target?`** dichiarati in spec v1.2 sez. 7
   (`…v1_2.md:128,130`) ma **assenti** nel codice: `edge.labels` ha solo `center`
   (`irTypes.ts:184`). La spec non aggancia comunque `TextStyle` alle edge label
   (nessun `labels.*.style`): anche a spec piena, il colore-label resterebbe derivato
   da `line.color`.
3. **`TextStyle` primitiva**: dichiarata "come v1.1 sez. 3" (`…v1_2.md:39`), ma la v1.1
   non è nel repo e nessun tipo `TextStyle` esiste nel codice. La forma nota dal prompt
   (`{ fontStyle?, fontWeight?, color?, size? }`) **non include `fontFamily`**: quindi
   font-family non sarebbe esprimibile nemmeno con la spec pienamente implementata.
4. **`FieldFormat.style`** (spec v1.1 sez. 5.4 citata nel prompt): in v1.2 il
   compartimento usa `rowFormat: { segments }` senza campo `style`
   (`irTypes.ts:87`); nessun aggancio a `TextStyle` sul field. Non verificabile contro
   v1.1 (file assente), ma nel codice del branch non c'è alcuno `style` di field.

---

## Dipendenze e rischi (dove atterrerebbe un eventuale gancio `style`)

> *Nota: sezione descrittiva del divario, non una proposta di fix (hard stop).*

Se in futuro si volesse rendere autorabile la tipografia, i punti di contatto sono:

1. **Tipi** (`irTypes.ts`): introdurre `TextStyle` + campo opzionale su `LabelSpec`,
   `FieldSegment`/`FieldCompartmentSpec.rowFormat`, `edge.labels.*`. Aggiungere il
   corrispettivo compilato su `CompiledLabel` / `CompiledFieldCompartment` /
   `CompiledEdgeView`. **Rischio scope**: `CompiledLabel` ecc. sono interfacce
   esportate — aggiunta di proprietà **opzionali** è ammessa (§2), modifica no.
2. **Compile** (`irCompile.ts`): il compile label (266-290) ed edge (405-421) dovrebbe
   propagare lo stile (statico o `Conditional`). `TextStyle` con campi `Conditional`
   richiederebbe `compileConditional` per asse.
3. **Render**:
   - Vertex/row: `IRNodeContent.tsx` emette già inline-style per fill/border — un
     `style` tipografico si aggiungerebbe lì; `irStyle.ts:staticCssFor` (101-110) è il
     gancio dichiarato per parti statiche per-view (oggi inerte).
   - Edge: `UnifiedEdge.tsx:775` già scrive `color` inline; andrebbe esteso a
     font-size/weight/style. **Rischio E0b**: il colore-label è oggi accoppiato a
     `irStroke` (= `line.color`); un color di testo indipendente dovrebbe **precedere**
     l'override `irStroke` senza rompere l'ereditarietà delle terminazioni.
4. **Authoring**: nessun editor tipografico esiste; andrebbe creato (fuori scope qui).
5. **Persistenza/migration**: l'IR delle view è persistito (le view sono `LViewElement`
   con `ir`); un nuovo campo opzionale è additivo e round-trip-safe (i pannelli fanno
   whole-object clone+replace, es. `EdgeAuthoringPanel.tsx:44,87`). Nessuna migration
   `jsxString` necessaria per l'IR (percorso diverso dai default-view template).

**Rischio dead-write (§5.1)**: se si aggiungesse `style` ai tipi ma non lo si leggesse
al render, sarebbe un dead-write classico. Qualunque implementazione va verificata
end-to-end (input IR → DOM), non per ispezione del comparatore/tipo.

---

## Domande aperte per Alfonso

1. **Superfici**: la tipografia va resa autorabile su tutte e tre le superfici o solo
   su alcune (es. solo label vertice)? La label di edge ha oggi il colore accoppiato a
   `line.color`: si vuole disaccoppiare (color di testo indipendente) o mantenere E0b?
2. **font-family**: la `TextStyle` della spec (per come nota) **non** ha `fontFamily`.
   Serve davvero font-family (richiede estendere anche la spec), o bastano
   size/weight/style/color?
3. **Statico vs `Conditional<T>`**: gli assi tipografici devono essere condizionabili
   (come `fill`/`line.color`) o statici? Questo decide se serve `compileConditional`
   per asse.
4. **Allineamento spec**: si vuole prima allineare `irTypes.ts` alla spec v1.2 già
   scritta (`LabelSpec.style`, `edge.labels.source/target`) e poi implementare, o
   trattare la spec come da rivedere (font-family, granularità per-segmento)?
5. **Per-segmento**: la spec dichiara "label per-segmento" **fuori scope**
   (`…v1_2.md:144`). Confermi che lo stile, se introdotto, è per-label/per-riga e non
   per-cella?

---

## Hard stop

Report scritto. **STOP.** Nessuna modifica al codice, nessuna proposta di fix
implementata, nessuna Fase 2. Le decisioni proseguono in chat a partire da questo
documento.
