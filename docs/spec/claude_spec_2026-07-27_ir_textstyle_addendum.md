# Addendum spec IR — TextStyle authoring per gli elementi testuali (ir-1.3)

**Data**: 2026-07-27
**Stato**: **ratificato** (Alfonso, 2026-07-27). Estende `spec_2026-07-18_ir_schema_v1_2.md` (sez. 3, 5, 7).
**Basato su**: discovery `docs/discovery/discovery_2026-07-27_ir_text_typography_state.md` (ground truth: nessuna `TextStyle` nel codice, tipografia hard-coded, unico dato IR sul testo = colore label edge via `line.color`/E0b).
**Versione schema IR**: `ir-1.3` (additivo su 1.2).
**Changelog rispetto alla bozza del 2026-07-27 mattina**: recepite 2 correzioni (colore `string` non `ColorToken`; token `--font-mono`) e 4 gap risolti (row-dispatch, precedenza colore edge, weight override sul default 600, fontSize vs content-hug).

## 1. Scope ratificato

Rendere autorabile lo stile tipografico del testo delle view:

- **Assi**: `fontFamily` (enum sans/mono, non libera), `fontSize`, `fontWeight`, `fontStyle`, `color`.
- **Superfici**: tutte e tre. Label dei vertici, righe dei compartimenti, label di edge (center). Le righe hanno **due percorsi** di rendering (compartimento slot-iteration e row view del dispatch polimorfico): lo stile va agganciato a entrambi (sez. 3).
- **Condizionabilità**: tutti gli assi sono `Conditional<T>`.
- **Granularità**: per-label e per-riga. **Non** per-segmento (fuori v1, come spec v1.2 sez. 13).
- Fuori scope: font-family arbitraria, stile per-cella, temi multipli.

## 2. Primitiva `TextStyle` (nuova, in `irTypes.ts`)

Affianca `BorderSpec`. Ogni asse opzionale e `Conditional`; asse assente = comportamento attuale (default CSS della superficie), nessuna regressione.

```typescript
type FontFamilyToken = 'sans' | 'mono';
type FontWeightToken = 'normal' | 'medium' | 'semibold' | 'bold';   // 400 / 500 / 600 / 700

interface TextStyle {
    fontFamily?: Conditional<FontFamilyToken>;   // 'sans' -> var(--font-sans), 'mono' -> var(--font-mono)
    fontSize?:   Conditional<number>;            // px; assente = default della superficie
    fontWeight?: Conditional<FontWeightToken>;
    fontStyle?:  Conditional<'normal' | 'italic'>;
    color?:      Conditional<string>;            // token o hex; STESSA forma di fill/border.color nel codice
}
```

Due allineamenti al codice reale (correzioni):
- **`color: Conditional<string>`**, non `ColorToken`. Nel branch `fill` e `border.color` sono già `Conditional<string>`; `ColorToken` è un alias che vive solo nella spec. Ci si allinea al codice.
- **`fontWeight` include `semibold` (600)**: il default CSS delle label top/center è `font-weight: 600`. Un enum `normal|bold` non lo rappresenterebbe, creando una discontinuità (autorare `normal` assottiglia la label senza poter tornare al default). L'enum esteso copre 400/500/600/700.

Compilato: `CompiledTextStyle` con ogni asse risolto a valore o funzione (stesso pattern di `fill`/`line.color`).

## 3. Aggancio ai tipi esistenti (quattro punti, tutti additivi)

1. **Label vertice**: `LabelSpec.style?: TextStyle`. Materializza il campo dichiarato dalla spec v1.2 e mai implementato.
2. **Riga, compartimento slot-iteration**: `FieldCompartmentSpec.rowFormat` passa da `{ segments }` a `{ segments; style?: TextStyle }`. Stile per l'intera riga, non per segmento.
3. **Riga, row view del dispatch** (`kind:'row'`, R1/R2, resa da `IRRow.tsx`): `RowViewIR.style?: TextStyle`. È un percorso di rendering distinto dal compartimento; senza questo aggancio le righe rese via dispatch resterebbero non stilizzabili. I due percorsi non coesistono sullo stesso testo, quindi nessuna precedenza da arbitrare.
4. **Label di edge**: `edge.labels` passa da `{ center?; placement? }` a `{ center?; placement?; style?: TextStyle }`. Applicato alla center label.

Compiled corrispondenti: `CompiledLabel` += `style?`, `CompiledFieldCompartment` += `rowStyle?`, la row compilata del dispatch += `style?`, la label edge compilata += `style?`.

## 4. Semantica di rendering

- **Assente = invariato**: se `style` (o un suo asse) è assente, la superficie rende come oggi. Nessun elemento cambia finché non viene autorato.
- **Presente = inline-style asse per asse** sul nodo testo (`span`/`div`). `fontFamily` token risolto alla var del design system: `sans` -> `var(--font-sans)`, `mono` -> `var(--font-mono)` (se il token non esiste va introdotto, sez. 9). `fontWeight` token risolto al peso numerico (normal 400, medium 500, semibold 600, bold 700). L'inline-style vince per specificità sul `font-weight: 600` di `.ir-label--top/center`, quindi l'override funziona senza toccare `irStyle.ts`.
- **Edge label, precedenza colore (disaccoppia E0b senza romperlo)**: `style.color` che risolve a un valore vince, e vale **solo per il testo** della label. Se `style.color` è assente, oppure è condizionale e il ramo non produce valore (predicato falso senza `else`), si ricade sull'ereditarietà da `irStroke` (= `line.color`, E0b). **Marker e terminazioni restano sempre su `irStroke`**: `style.color` non li tocca.
- **fontSize e content-hug**: il font autorato **partecipa al sizing**. Il misuratore in `nodeSizing.ts` deve leggere lo stile effettivamente reso, così un `fontSize` maggiore allarga il nodo (content-hug) invece di far scattare l'ellipsis prematura. Se oggi il misuratore usa un font fisso, è il punto da correggere insieme al render della label (TS1).

## 5. Semantica condizionale

- Ogni asse `Conditional<T>` si compila con l'helper già usato per `fill` e `line.color`. Nessun nuovo write path, nessun nuovo motore di valutazione.
- Il **dependency set** si estende automaticamente ai `PathExpr` dentro i predicati degli assi: derivato, mai dichiarato (spec v1.2 sez. 9). Un cambio della feature letta da un predicato di stile re-renderizza l'elemento.
- Un predicato di stile che lancia = asse non applicato (fallback al default), mai crash.

## 6. UX authoring — `TextStyleEditor` riusabile

Nuovo componente presentazionale in `components/editor-v2/viewpoint/authoring/`, prop dati piatti, token `var(--...)`, nessun import di editor-v2 runtime (convenzione di `components/ui/*` e degli altri editor authoring).

**Progressive disclosure per-asse** (risolve il rischio "pannello ingolfato" di 5 assi condizionali):

- ogni asse è una riga con il controllo del **valore semplice** (Select per family/weight/style, Input px per size, ColorPicker per color) e un piccolo toggle "condizionale";
- toggle OFF (default): valore semplice, un solo `T`;
- toggle ON: il controllo semplice è sostituito dal `ConditionalEditor` esistente per quell'asse (riuso, non riscrittura);
- round-trip: un asse letto dall'IR in forma `Conditional` apre con toggle ON; un valore nudo con toggle OFF.

Riuso in quattro punti: `LabelEntryEditor` (label vertice, TS1), editor di compartimento (TS2), editor della row view del dispatch (TS2), `EdgeAuthoringPanel` sezione Label (TS3).

## 7. Persistenza e migration

- Additivo sul campo `ir` del `LViewElement`: opzionale, serializzazione generica, round-trip già garantito dal clone whole-object dei pannelli.
- Nessun `VersionFixer`: un opzionale `undefined` non richiede migrazione. `irVersion` per-view resta il carrier di migrazioni future.

## 8. Fasatura implementativa (vertical slice per superficie, hard stop tra le fasi)

Ogni fase è una fetta verticale completa (tipi + compile + render + authoring), verificabile a schermo, senza dead-write. **In ogni fase si aggiunge ai tipi solo l'aggancio della superficie di quella fase**: la primitiva `TextStyle` nasce completa in TS1, ma `rowFormat.style` / `RowViewIR.style` / `edge.labels.style` si aggiungono solo quando la rispettiva fase li rende (mai tipo senza render).

- **TS1 — Label del vertice**. Nasce `TextStyle`, `CompiledTextStyle`, il compile per asse, il `TextStyleEditor` riusabile. Aggancio su `LabelSpec.style`, render inline in `IRNodeContent` (label), fix del misuratore in `nodeSizing.ts` per il fontSize, introduzione del token `--font-mono` se assente, authoring in `LabelEntryEditor`. Verifica: una label che diventa italic/semibold/mono/colorata, anche condizionale, con il nodo che si allarga al crescere del fontSize.
- **TS2 — Righe / compartimenti**. Aggancio su `rowFormat.style` **e** `RowViewIR.style` (entrambi i percorsi), compile, render in `IRNodeContent` (slot-mode) e `IRRow`, authoring nei rispettivi editor. Riusa `TextStyleEditor`.
- **TS3 — Label di edge**. Aggancio su `edge.labels.style`, disaccoppiamento colore testo da `irStroke` in `UnifiedEdge` (sez. 4), authoring nella sezione Label di `EdgeAuthoringPanel`. Ultima per il rischio E0b.

## 9. Decisioni fini (ratificate)

1. **`fontWeight` = `normal | medium | semibold | bold`** (400/500/600/700), per coprire il default 600 senza discontinuità.
2. **`fontSize` = `number` px**, assente = default; nessun clamp hard nello schema, validazione soft in UI (suggerito 8-32).
3. **`color` = `Conditional<string>`** (token o hex), riusa il ColorPicker esistente; stessa forma di `fill`.
4. **`fontFamily` = `'sans' | 'mono'`**. `mono` -> `var(--font-mono)`; se il token non esiste nel design system, va introdotto (mappato al monospace già in uso, `IBM Plex Mono`) come additivo, non come letterale sparso.

## 10. Rischi

- **TS3 / E0b**: l'inversione del colore testo edge (da "eredita `irStroke`" a "`style.color` vince, altrimenti `irStroke`") va verificata end-to-end input IR -> DOM, non per ispezione dei soli tipi. Non deve rompere l'ereditarietà del colore delle terminazioni.
- **TS1 / sizing**: il fix del misuratore `nodeSizing.ts` tocca il content-hug. Va verificato che un fontSize maggiore allarghi il nodo e uno minore non lasci padding fantasma; il misuratore deve leggere lo stile reso, non una costante. Non è critical-zone formale ma è sensibile: se il fix esce dal perimetro della label, hard stop e conferma.
- **Dead-write**: ogni asse/aggancio aggiunto ai tipi deve avere consumo al render nella stessa fase. Mai un campo di stile nei tipi senza render corrispondente.
- **Divergenza spec residua**: `edge.labels.source/target` restano non implementati (solo `center`). Questo addendum non li aggiunge: fuori scope, coerente col codice.

## 11. Addendum 2026-08-25: radice della cascata e preset di spaziatura

Ratificato in chat il 2026-08-25 su richiesta di Alfonso; implementato in `0864c8824` (commit A),
`97c5a65e0` (commit B) e `d59cb06c9` (rettifica dell'input di riga).

- **`ShapeSpec.text?: TextStyle`**: stile tipografico del nodo, quinto aggancio di sez. 3 e radice
  della cascata. Reso inline su `.ir-node-content`; le superfici di testo (`.ir-label`, `.ir-row`,
  gli input inline) ereditano (`font-size: inherit` in `irStyle.ts`). Precedenza: default CSS <
  `shape.text` < `LabelSpec.style` (TS1) e, quando arrivera', `rowFormat.style` /
  `RowViewIR.style` (TS2). `fontWeight` non raggiunge le label top/center, che tengono il 600 di
  classe: si cambia dalla label.
- **Default CSS**: 13px (era 11px) su tutte le superfici di testo del simbolo; `.ir-badge`,
  `.ir-collapse-chip`, `.ir-hull__*` invariati.
- **`ShapeSpec.padding?: 'small' | 'normal' | 'large'`**: preset di spaziatura, scalare come
  `border`, su intestazione (top/bottom), label inside e compartimenti, tramite `--ir-pad-x` /
  `--ir-pad-y` (4/2, 8/4, 16/8 px). Prima l'intestazione non aveva padding. Authoring solo in
  Advanced; `normal` non viene persistito. Vocabolario chiuso in `VALID_PADDING_VALUES`
  (`irValidate.ts`), regola authoring-time per il criterio R-B9-bis.
- **Editor inline**: l'input della label riceve lo stesso stile della label (`resolveTextStyle` su
  `l.style`, come lo span che sostituisce) e il padding a token meno 1px di bordo, cosi' il box in
  edit ha l'altezza della label. L'input di riga tiene il padding piatto `0 4px`: la riga di
  compartimento e' un flex a `line-height: 1.4` e un input padded ne diventerebbe l'elemento piu'
  alto, facendo crescere la riga all'ingresso in edit (misurato: 22px -> 38px a padding Large).
- Entrambi additivi: nessun bump di `irVersion`, nessuna migrazione (precedente: `marker`,
  2026-08-15).
- Sez. 4 e sez. 10 vanno lette con questa correzione: il misuratore del content-hug
  (`useContentSize.ts`, `measureIntrinsic`) legge gia' il DOM (`offsetWidth`/`offsetHeight` a
  `max-content`, chrome da `getComputedStyle`) e non una costante di font, quindi il fix di
  `nodeSizing.ts` che TS1 annunciava come debito non serve.
