# Discovery (read-only): TS1 - TextStyle su label del vertice (authoring trigger+popover)

> Fase 1 di un two-phase. **Read-only: nessun edit al codice di feature.** L'unico file
> che puoi scrivere e' il discovery report. Al termine, HARD STOP.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente
(filone IR authoring + shape/resize del 23-27/07). Leggi la spec ratificata
`docs/discovery/discovery_2026-07-27_ir_text_typography_state.md` gia' presente nel repo
(ground truth: nessuna `TextStyle` nel codice, tipografia hard-coded, unico dato IR sul testo =
colore label edge via `line.color`/E0b).

Branch di lavoro: `alfonso-frontend-jjtl`.

## Contesto e obiettivo finale (NON implementare ora)

E' stata ratificata la primitiva IR `TextStyle` (schema `ir-1.3`, additivo su 1.2) per rendere
autorabile lo stile tipografico del testo delle view. TS1 e' la prima fetta verticale: **solo la
label del vertice**. La fetta comprende: nascita di `TextStyle` + `CompiledTextStyle`, compile
per-asse, due componenti authoring nuovi (`TextStyleField` + `TextStyleEditor`), aggancio su
`LabelSpec.style`, render inline nella label, fix del misuratore per il `fontSize`, introduzione del
token `--font-mono` se assente, mount dell'authoring in `LabelEntryEditor`.

Assi ratificati (esattamente questi 5, niente altro):

- `fontFamily`: enum `'sans' | 'mono'` (select a 2 valori, non ricerca libera). `sans` ->
  `var(--font-sans)`, `mono` -> `var(--font-mono)`.
- `fontSize`: `number` px (no em/rem, no breakpoint responsive).
- `fontWeight`: `'normal' | 'medium' | 'semibold' | 'bold'` (400/500/600/700).
- `fontStyle`: `'normal' | 'italic'`.
- `color`: `Conditional<string>` (token o hex), STESSA forma di `fill`/`border.color`.

Ogni asse e' `Conditional<T>`. Asse assente = comportamento attuale (default CSS della superficie),
nessuna regressione.

Decisioni UX ratificate da Alfonso (orientano cosa mappare, NON rimetterle in discussione):

- **Pattern**: `TextStyleField` = riga compatta con riassunto live dello stile; al click apre il
  `TextStyleEditor` in **popover overlay assoluto** (NON accordion inline, NON tab: vincolo
  "no layout shift"). Il riassunto mostra "Default/ereditato" finche' nulla e' autorato, poi i delta;
  per un asse condizionale un glifo "condizione" al posto del valore letterale.
- **Assi**: solo i 5 sopra. Line-height, letter-spacing, transform, decoration, unita' em/rem,
  breakpoint sono FUORI scope (non nell'IR).
- **Condizionalita' per-asse**: nel popover ogni asse ha un toggle; OFF = controllo semplice, ON =
  riuso del `ConditionalEditor` esistente per quell'asse (riuso, non riscrittura).

Questa e' **solo la discovery**: mappare i punti di aggancio reali per tipi, compile, render, sizing
e authoring, e verificare quali primitive UI riusare per popover / conditional editor / controlli.
**Non scrivere codice di feature.**

## COSA mappare (rispondi a OGNI punto con `file:riga` e citazioni verbatim)

### Q1 - `irTypes.ts`: dove nascono `TextStyle`/`CompiledTextStyle` e come sono fatti i vicini
Trova e cita: il type `Conditional<T>` (definizione esatta); `BorderSpec` e la sua forma compilata
(`TextStyle` la affianca); come sono tipati oggi `fill` e `border.color` (conferma che sono
`Conditional<string>`, cosi' `color` si allinea al codice e non a un alias `ColorToken` che vive solo
nella spec). **Incognita chiave**: `LabelSpec` esiste? Dichiara gia' un campo `style?` (la spec v1.2
lo dichiarava ma non era mai stato implementato)? Se si', cita `file:riga` verbatim del campo. Indica
il punto esatto dove aggiungere l'interfaccia `TextStyle` e dove agganciare `LabelSpec.style?`.

### Q2 - Compile: come si compila un `Conditional<T>` oggi
Trova l'helper che compila un `Conditional<T>` in valore-o-funzione, usato per `fill` e
`line.color`: nome, firma, `file:riga`. Trova la funzione che compila un elemento view
(authored IR -> compiled) e dove si materializza il compiled della label: e' li' che va inserito il
compile per-asse di `TextStyle` -> `CompiledTextStyle`. Conferma che NON serve un nuovo write path
ne' un nuovo motore di valutazione condizionale (riuso puro). Cita `file:riga`.

### Q3 - Render della label del vertice in `IRNodeContent`
Dove viene reso il testo della label del vertice (lo `span`/`div` esatto): `file:riga`. Riporta le
classi CSS in gioco (`.ir-label--top` / `.ir-label--center` o come si chiamano davvero) e il
`font-weight` hard-coded attuale (la spec assume 600 su top/center: verificalo in `irStyle.ts` o
dove risiede). Conferma che un inline-style asse-per-asse sul nodo testo vince per specificita' sul
`font-weight` di classe (cosi' l'override funziona senza toccare il CSS). Indica il punto esatto dove
applicare l'inline-style dal `CompiledTextStyle`.

### Q4 - `nodeSizing.ts`: come si misura il testo oggi (SENSIBILE)
Trova la funzione che misura larghezza/altezza della label per il content-hug: `file:riga`. **Usa un
font fisso (costante) o legge lo stile effettivamente reso?** Cita verbatim il punto dove entra il
font nel calcolo. E' questo il punto da correggere perche' un `fontSize` autorato maggiore allarghi
il nodo invece di far scattare l'ellipsis prematura. **Valuta se il fix esce dal perimetro della sola
label**: se tocca il sizing di altri elementi o si intreccia con `useJjomSync`/`portDistribution`,
dillo esplicitamente (in Fase 2 servira' go-ahead + Layer Impact Report). Se resta confinato alla
misura del testo della label, dillo altrettanto chiaramente.

### Q5 - Design token: `--font-mono` e `--font-sans`
Dove sono definiti i design token font (file SCSS/CSS delle variabili): `file:riga`. `--font-sans`
esiste e a cosa mappa? `--font-mono` esiste? Se NO, qual e' il monospace gia' in uso nel codebase
(la spec ipotizza IBM Plex Mono: verificalo con una grep, non darlo per scontato) a cui mappare il
token additivo? Riporta il valore reale trovato, non l'ipotesi.

### Q6 - Primitive UI da riusare per `TextStyleField` + `TextStyleEditor` (incognita chiave)
Serve costruire i due componenti SENZA nuove dipendenze e nello stile-casa. Mappa:
- **Popover / overlay**: esiste una primitiva popover/overlay in `components/ui/*` (ispirazione
  shadcn) che renda in portal/absolute senza reflow? Nome, `file:riga`, API (props). Se non esiste,
  esiste un pattern overlay/floating gia' usato altrove da imitare? (NON introdurre librerie nuove.)
- **ConditionalEditor**: esiste il componente per editare un `Conditional<T>` riusato negli altri
  editor authoring? Nome, `file:riga`, API (props: come riceve il valore, come emette il cambio,
  se e' generico su `T` o specializzato). E' quello che va incastonato per-asse nel popover.
- **Controlli semplici**: Select (per family/weight/style), Input px (per size), ColorPicker (per
  color) gia' esistenti da riusare? Nome e `file:riga` di ciascuno. Il ColorPicker deve essere lo
  stesso usato per `fill`.
- **Trigger/summary chip**: esiste gia' un pattern "riga compatta che apre un popover" nel codebase
  (per imitarlo visivamente ed evitare un widget nuovo)? Se si', `file:riga`.

### Q7 - `LabelEntryEditor`: struttura e read/write dell'IR della label
Struttura attuale di `LabelEntryEditor` (o come si chiama l'editor della label vertice): `file:riga`.
Come legge oggi lo spec della label e come riscrive nell'IR (conferma il pattern clone-whole-object
citato in spec §7)? Dove esattamente monterebbe il `TextStyleField` (che riceve lo `style` corrente
e emette il nuovo). Il componente authoring vive in
`components/editor-v2/viewpoint/authoring/` (convenzione presentazionale: prop dati piatti, token
`var(--...)`, nessun import di editor-v2 runtime): conferma path reale e convenzione locale.

### Q8 - Collision check dei nuovi identificatori (OBBLIGATORIO da CLAUDE.md)
Prima che la Fase 2 li introduca, `grep -r` per confermare che siano liberi:
`TextStyle`, `CompiledTextStyle`, `TextStyleEditor`, `TextStyleField`, il token `--font-mono`, e
qualsiasi nuova classe CSS che i due componenti userebbero. Riporta esito per ciascuno (libero /
gia' in uso e dove). Le collisioni CSS sono le piu' insidiose: cerca anche eventuali classi
`text-style`/`typography` gia' presenti negli SCSS.

## Discovery report (OBBLIGATORIO)

Al termine, salva il report in `docs/discovery/discovery_2026-07-27_ts1_textstyle_label.md`
(crea la cartella se manca). Naming: `discovery_<data>_<descrizione>.md`, data `YYYY-MM-DD`.
Contenuto minimo: obiettivo; file letti con path completi; findings Q1..Q8 con `file:riga` e
citazioni verbatim; **verdetto sul fix di `nodeSizing.ts`** (resta nel perimetro label o e'
sensibile/critical -> LIR richiesto in Fase 2?); esito del collision check; primitive UI da riusare
(con nomi e API); lista dei file che la Fase 2 dovra' toccare (proposta); rischi; domande aperte per
Alfonso. L'hard stop non e' completo finche' il report non e' scritto.

Il discovery report NON sostituisce l'entry in `docs/claude-code-log.md`: aggiorna anche il log
(tipo `docs`/discovery, prompt ricevuto in una riga, file letti, esito).

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice di feature, nessun commit, nessun
`git add`. Restituisci in chat la sintesi Q1..Q8 con i `file:riga` chiave, il verdetto sul misuratore,
l'esito del collision check, e la lista proposta dei file per la Fase 2, cosi' scrivo il prompt di
implementazione TS1 (con LIR se il misuratore risultera' sensibile oltre il perimetro label).

## RIFERIMENTI

- Spec ratificata: `spec_2026-07-27_ir_textstyle_addendum.md` (KB progetto) - §2 primitiva, §3
  aggancio a `LabelSpec.style`, §4 semantica render + fontSize/content-hug, §6 UX authoring, §8
  fasatura TS1, §9 decisioni fini, §10 rischi (misuratore + dead-write).
- Ratifiche UX: `ratifiche_2026-07-27_typography_ux.md` (KB progetto) - trigger+popover, 5 assi.
- Ground truth tipografia: `docs/discovery/discovery_2026-07-27_ir_text_typography_state.md` (repo).
- Spec IR: `spec_2026-07-18_ir_schema_v1_2.md` (campo `LabelSpec.style` dichiarato non implementato).
- Punti probabili da confermare (NON assumere i path): `irTypes.ts`, `irStyle.ts`, `IRNodeContent`,
  `nodeSizing.ts`, `LabelEntryEditor`, `components/ui/*`, `components/editor-v2/viewpoint/authoring/`.

---
**Nome del documento prompt**: 2026-07-27 16:56
