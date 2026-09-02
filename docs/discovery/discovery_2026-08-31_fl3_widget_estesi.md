# Discovery — FL3: widget estesi come gemelli write-side delle Row view

Data: 2026-08-31
Prompt: `docs/prompts/PROMPT_FL3_widgets.md`
Fase: 1 (read-only). Nessun file sorgente modificato.

## Ipotesi che questa discovery sta falsificando

1. «I widget estesi si aggiungono estendendo `WidgetKind` in `irTypes.ts`.»
2. «La parte read dei widget richiesti esiste gia' e va solo riusata.»
3. «Il test di readOnly ("rende la variante disabilitata, mai un input attivo")
   e' un render test, quindi serve una dipendenza DOM.»
4. «Lo stato di focus specificato dal prompt e' quello che la form gia' rende.»

Esito: **1 falsificata, 2 falsificata in parte, 3 falsificata, 4 falsificata.**

## Obiettivo

Stabilire (a) dove vivono i widget form esistenti e con quali vincoli di import,
(b) quali renderer read esistono davvero e quale shape di valore leggono,
(c) come si testa senza DOM, (d) quali file toccare senza collidere con FL1/FL2.

## File letti (path completi)

- `docs/prompts/PROMPT_FL3_widgets.md`
- `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`
- `docs/PROTOCOL.md`, `docs/decisions.md` (coda), `docs/claude-code-log.md` (prime 120 righe)
- `frontend/src/components/editor-v2/nodes/valueRenderer.ts` (740 righe, intero)
- `frontend/src/components/editor-v2/nodes/RowValue.tsx` (390 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/widgetRenderer.ts` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (righe 1-200)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (righe 218-270)
- `frontend/src/components/editor-v2/viewpoint/ir/slotValues.ts` (righe 1-40)
- `frontend/src/components/editor-v2/viewpoint/ir/widgets/` — tutti e otto i file
- `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss` (righe 1-60, 376-430, 700-840 + indice dei selettori)
- `frontend/src/components/editor-v2/nodes/instanceNode.scss` (righe 229-245, 460-500)
- `frontend/src/components/abstract/tabs/instanceManagerTab.scss` (righe 265-330, 720-760)
- `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss`, `_shadows.scss`, `_typography.scss` (blocchi rilevanti)
- `frontend/src/jjform/index.ts`, `frontend/src/jjform/write.ts`
- `frontend/src/components/ui/ColorPicker/ColorPicker.tsx`
- `frontend/vitest.config.ts`, `frontend/package.json`

## Findings

### F1 — Il documento autoritativo citato dal prompt NON esiste nel repo

Il prompt dichiara autoritativa per icone, formati e stati la sezione
"Extended widget classes" di `Form Auto Layout.dc.html`. Ricerca su tutto il repo:

```
$ command grep -rniI "Extended widget" --include="*.html" --include="*.md" .
./docs/prompts/PROMPT_FL3_widgets.md:3:...sezione "Extended widget classes" di `Form Auto Layout.dc.html`...
```

L'unico hit e' il prompt stesso. `Form Auto Layout.dc.html` e' citato da quattro
prompt (FL1, FL2, FL3, FL4) e da `form-autolayout-spec.md:3`, e non e' in albero:
i `.dc.html` presenti sono nove, elencati sotto `docs/design/design_handoff_*/`
e `docs/redesign/rail/`, nessuno con quel nome. Controllo positivo sulla stessa
riga di comando: `"Width classes"` rende `form-autolayout-spec.md:9`, quindi la
ricerca ha segnale.

Secondo scostamento, minore: il prompt cita `docs/design/form-autolayout-spec.md`;
il file sta in `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`.

**Conseguenza operativa.** La Regola 15 dice STOP su un path citato che non esiste.
Il corpo del prompt pero' enumera per esteso icone (`bi-calendar3`, `bi-clock`,
`bi-box-arrow-up-right`, `bi-check-circle`, `bi-x`), colori (`#ecfeff` / `#0891b2` /
`#a5f3fc`), il ring di focus, il fondo disabled e la min-height, cioe' esattamente
cio' per cui il board sarebbe autoritativo. Il perimetro resta eseguibile; quello
che manca e' il tie-break sui dettagli non enumerati (per esempio "formato ISO
abbreviato come nel prototipo": il prototipo non e' leggibile). Segnalato, non
aggirato in silenzio.

### F2 — La sede dei widget esiste ed e' una sola

`frontend/src/components/editor-v2/viewpoint/ir/widgets/`, otto componenti:
`TextWidget`, `NumberWidget`, `CheckboxWidget`, `SelectWidget`, `ReferenceWidget`,
`ListWidget`, `ChipsWidget`, `ReferencePicker`. Il dispatch e' in `IRFormField.tsx`
(`IRFormField.tsx:216-320`), a catena di `else if` esclusivi. Non esiste registro:
il dispatch e' inline. Foglio di stile unico, `irFormStyle.scss`, importato da
`IRForm.tsx:37`.

Nessuno dei sette widget copre i tipi chiesti da FL3. In particolare `color` e'
gia' un membro di `WidgetKind` (`irTypes.ts:224`) e `WIDGET_RENDERER` lo mappa su
`swatch` (`widgetRenderer.ts:55`), **ma `IRFormField` non ha un ramo `color`**:
oggi un colore cade nel ramo finale e rende come `TextWidget`. Stesso vale per
`link`. Questo e' il buco che FL3 riempie.

### F3 — Vincolo di import: meta' dei widget non e' caricabile sotto vitest

`vitest.config.ts` dichiara `environment: 'node'` e
`include: ['src/**/__tests__/**/*.test.ts']` — solo `.ts`, nessun jsdom, nessun
`@testing-library` in `package.json`. Un modulo che raggiunge il barrel `joiner/`
trascina Monaco, che dereferenzia `window` all'import: e' la classe di fallimenti
gia' documentata in `slotValues.ts:1-11` e in `valueRenderer.ts` (perche'
`RENDERER_LABELS` vive li' e non sull'inspector).

Misurato per catena di import:
- **liberi**: `NumberWidget`, `ChipsWidget` (zero import oltre `react`)
- **legati a `ui/`**: `TextWidget`, `SelectWidget`
- **legati a `joiner/`**: `CheckboxWidget` (`U`), `ReferenceWidget` (`LPointerTargetable`),
  e per transitivita' `ReferencePicker` (importa `metaclassLetter` da `ReferenceWidget`)
  e `ListWidget`.

Verificato eseguendo davvero (spike cancellato dopo la misura): un test `.test.ts`
che fa `createElement` + `renderToStaticMarkup` da `react-dom/server` su
`NumberWidget` e `ChipsWidget` **passa** in ambiente node, 1/1. `react-dom` e' gia'
in `package.json` (react 18.3.1): nessuna dipendenza nuova.

Verificato allo stesso modo che un `import './x.scss'` dentro un modulo `.ts`
raggiunto da un test **passa** sotto vitest (spike cancellato): lo stile puo'
stare accanto ai widget senza rendere il registro non testabile.

**Conseguenza di progetto**: i widget nuovi non devono importare ne' `ui/` ne'
`joiner/`. E' ottenibile — sono tutti `<input>`/`<textarea>` con classi proprie,
come `NumberWidget` gia' fa — e paga due volte: rende il registro importabile e
tiene il test di readOnly un test vero e non un proxy.

### F4 — Ipotesi 3 falsificata: il render test non richiede una dipendenza nuova

Vedi F3. `renderToStaticMarkup` copre l'asserzione «rende la variante disabilitata,
mai un input attivo» sull'HTML reale. Il test resta `.test.ts` scrivendo
`createElement` invece di JSX. Nessuna delle 100 suite esistenti rende React: e'
un precedente nuovo, e va dichiarato come tale.

### F5 — La parte read esiste per date/duration/color, NON esiste per url

`RowValue.tsx` + `valueRenderer.ts` sono la meta' read. Shape di valore che leggono:

| widget FL3 | renderer read | cosa legge |
|---|---|---|
| `date` / `datetime` | `date` | `values[0]`, normalizzato da `absoluteDate` (`valueRenderer.ts:211`), che prende i primi 10 caratteri quando la stringa e' gia' ISO |
| `duration` | `numberUnit` | `values[0]` come numero + `unit` **dall'annotazione `jjodel/unit`**, mai inferita (`valueRenderer.ts:130-146`, `RowValue.tsx:130-146`) |
| `color` | `swatch` | `toCssColor(values[0])` — accetta hex 3/4/6/8, `0xRRGGBB`, `rgb()/hsl()/lab()/oklch()`, i 148 nomi CSS e `amber` |
| `@email` | `truncatedText` | la stringa |
| `text` multiline / `richtext` | `code` / `truncatedText` | la stringa |
| tags | `collection` | `values[]`, chip |
| multi-ref | `refPill` | `targets[]`, pill cyan |
| `@url` | **nessuno** | — |

Ipotesi 2 falsificata in un punto: il prompt scrive «il valore rende come link
nella parte read», ma in `RendererKind` non c'e' un membro link. `WIDGET_RENDERER`
mappa `link: 'refPill'`, che e' la pill di un RIFERIMENTO a un elemento del modello,
non un URL. Aggiungere un membro a `RendererKind` propaga a `RENDERER_LABELS`,
`DECLARABLE_RENDERERS`, allo `switch` di `RowValue`, all'inspector e a
`WIDGET_RENDERER` (che e' `Record<WidgetKind, RendererKind>`, totale): e' la
propagazione che la Regola 20 vuole fermata e riportata. **Fuori perimetro FL3**:
la parte write dell'url emette la stringa, che la parte read gia' rende come testo.
Da decidere in FL4 o in una slice dedicata.

### F6 — Ipotesi 1 falsificata: `WidgetKind` non va toccato

`WidgetKind` (`irTypes.ts:224`) e' vocabolario di IR **persistito**, e la nota in
testa a `FormSpec` e' esplicita: «Since the saved IR has no VersionFixer at all
(R-B9), every literal below is DEFINITIVE once written». Allargarlo rompe anche il
tipo di `WIDGET_RENDERER`, dichiarato totale su `WidgetKind`.

Il prompt lo evita da solo: «in questa sessione i widget si registrano per NOME —
non dipendere dal file di FL1, esporta un registro `{ nome: componente }`». Il
registro ha quindi chiavi `string`, vocabolario proprio, e resta separato da
`WidgetKind` finche' FL1/FL4 non decidono come cucirli.

### F7 — Ipotesi 4 falsificata: il focus specificato non e' quello reso oggi

Il prompt chiede ring `0 0 0 3px rgba(8,145,178,0.12)` + bordo `#0891b2` (cyan).
La form oggi rende slate: `irFormStyle.scss:376-386` usa `--color-accent`
(= `$slate-700` in light, `_colors-light.scss:118`) e `--focus-ring`
(= `0 0 0 3px rgba(148,163,184,0.25)`, `_shadows.scss:31`).

Il cyan sul focus e' conforme a CLAUDE.md §7.1 («Cyan: only focus states, active
indicators, links»), quindi la richiesta non e' in conflitto con il design system —
ma applicarla ai controlli esistenti cambierebbe un aspetto committato (Regola 3).
Proposta: i due ruoli nuovi valgono **solo per le classi dei widget nuovi**, e
l'allineamento del resto della form resta una decisione di FL4.

I valori chiesti esistono gia' come letterali nei token, con un altro ruolo:
`--color-inode-ref-fg: #0891b2`, `--color-inode-ref-bg: #ecfeff`,
`--color-inode-ref-border: #a5f3fc` (`_colors-light.scss:467-469`). Per le pill
ref del chip input sono i token GIUSTI anche per ruolo (sono la pill di
riferimento della Row view, cioe' proprio il gemello read chiesto). Per il focus
no: servono due ruoli nuovi, e la Regola 28 li vuole in `styles/tokens/`.

### F8 — «identici ai pill della tabella»: la tabella oggi non e' cyan

`instanceManagerTab.scss:296` rende `&__pill` con `--color-form-border` /
`--color-form-section`, cioe' slate. Il cyan chiesto dal prompt e la riga
«Table: ... multis as cyan reference pills» di `form-autolayout-spec.md` non sono
ancora nella tabella. I token `--color-inode-ref-*` sono pero' esattamente i tre
letterali del prompt, e sono quelli che la pill del canvas usa gia'
(`instanceNode.scss:469-489`). I widget nuovi useranno quei token: cosi' il chip
ref e' identico alla pill del canvas oggi, e alla tabella quando la tabella si
allineera'. **La tabella non viene toccata** (fuori perimetro).

### F9 — Lo swatch «lo STESSO della Row view» e' scoperto da tre misure diverse

- Row view (canvas): 10px, `border-radius: 3px`, `box-shadow: inset 0 0 0 1px
  var(--color-inode-swatch-hairline)`, colore via `--inode-swatch`
  (`instanceNode.scss:229-236`), **annidato sotto `.mm-node.mm-object`** — quindi
  la classe non e' riusabile dentro la form senza portarsi dietro lo scope.
- Tabella manager: 14px, bordo 1px `--color-form-muted` (`instanceManagerTab.scss:277`).
- Form (FL3): 12px, richiesto dal prompt.

Tre taglie, un solo linguaggio: il principio «un renderer, due taglie» e' gia'
violato in ampiezza dall'esistente. Lo swatch della form riusa **radius, hairline
e la custom property** della Row view a 12px, che e' il massimo di identita'
ottenibile senza toccare `instanceNode.scss` (fuori perimetro).

### F10 — `ui/ColorPicker` non e' riusabile qui, per la stessa ragione di `ui/NumberInput`

`components/ui/ColorPicker/ColorPicker.tsx` esiste ma: (a) e' un CSS module con
wrapper e label propri, incompatibile con la riga a tre elementi della form;
(b) committa a ogni battuta, senza semantica di blur, mentre tutta la form
committa su blur/Enter e ripristina su Escape; (c) il suo `HEX_RE` accetta solo
`#rgb`/`#rrggbb`, quindi uno slot che vale `Green` o `rgb(0,0,0)` — valori che il
gemello read `toCssColor` rende senza problemi — verrebbe trattato come invalido.
Stessa motivazione, testuale, con cui `NumberWidget` rifiuta `ui/NumberInput`
(`NumberWidget.tsx:1-16`). `ui/ColorPicker` resta intoccato: ha altri consumatori.

### F11 — Sessione parallela in corso

`git status --porcelain` a inizio Fase 1 mostra, oltre ai `docs/prompts/*`
untracked di inizio giornata, `?? docs/discovery/discovery_2026-08-31_fl2_temi_form.md`:
FL2 sta lavorando. Indice vuoto. FL2 tocchera' la sezione THEMES di
`irFormStyle.scss`. Per tenere i file davvero disgiunti (come il prompt chiede),
lo stile dei widget nuovi va in un foglio proprio accanto ai widget, importato dal
registro — non in `irFormStyle.scss`.

## Dipendenze e rischi

- **R1** — `Form Auto Layout.dc.html` assente (F1): i dettagli non enumerati nel
  prompt restano una scelta di implementazione dichiarata, non una lettura del board.
- **R2** — collisione con FL2 su `irFormStyle.scss` se lo stile non viene isolato (F11).
- **R3** — il render test e' un precedente nuovo per questa suite (F4).
- **R4** — due token nuovi in `styles/tokens/` sono un file condiviso: solo aggiunte,
  nessun valore esistente cambiato (F7).
- **R5** — `@url` non ha gemello read (F5): il paio nasce zoppo, e va detto.

## Domande aperte

1. `Form Auto Layout.dc.html` va depositato nel repo, o FL3 procede sui dettagli
   enumerati dal prompt dichiarando le scelte residue?
2. Il focus cyan vale solo per i widget nuovi (proposta) o va allineato tutto in FL4?
3. `@url`: si accetta che la parte read resti `truncatedText` in FL3, con il
   renderer `link` aperto come slice a se'?

---

## Esito Fase 2 (stessa sessione, dopo il go-ahead)

Le tre domande aperte sono state ratificate in chat il 2026-08-31:

1. **Board assente** → si procede sui dettagli enumerati dal prompt. Le scelte
   residue, non coperte dal testo, sono dichiarate nei commenti di testata dei
   componenti: il picker nativo come unico datepicker (`DateWidget`), lo swatch che
   mostra e non sceglie (`ColorWidget`), il quadretto tratteggiato per un valore non
   dipingibile, `add…` / `+ add target` come nel prompt. `Form Auto Layout.dc.html`
   resta un debito documentale: quattro prompt e la spec lo citano, il repo non lo ha.
2. **Focus cyan** → solo sulle classi FL3. Due ruoli nuovi in **entrambi** i file di
   token (`--color-form-focus-border`, `--color-form-focus-ring`), letti soltanto da
   `formWidgets.scss`. Nessun valore esistente cambiato; i controlli precedenti
   tengono lo slate con cui erano stati verificati. L'allineamento resta a FL4.
3. **`@url`** → parte write ora, renderer read `link` come slice a se'. Il paio nasce
   dichiaratamente zoppo, e il test lo asserisce esplicitamente
   (`extendedWidgets.test.ts`, «the read half is truncatedText today»).

### Due fatti emersi in Fase 2, non previsti dalla Fase 1

**F12 — il commit di FL2 ha inglobato una modifica non committata di questa sessione.**
`c98f47d3c` («export the form theme from the barrel») ha portato dentro anche le due
righe `export ... from './widgetValue'` che questa sessione aveva nel working tree,
mentre `widgetValue.ts` era ancora untracked. Fra quel commit e `d60275228` **HEAD
referenziava un file non tracciato**: un checkout pulito non avrebbe compilato. E'
esattamente l'incidente che CLAUDE.md §6.1 descrive («`git add <paths>` non basta: il
commit committa tutto l'indice») visto dal lato di chi subisce, non di chi lo causa.
Chiuso committando subito il modulo puro da solo. Da qui in avanti, con tre sessioni
in parallelo su `jjform/index.ts`, conviene che ciascuna committi il proprio export
nello stesso passo in cui crea il modulo.

**F13 — il foglio di stile compila ma non e' ancora nel bundle.**
`formWidgets.scss` e' importato da `widgets/index.ts`, e nessuno importa ancora il
registro: il tree-shaking lo lascia fuori, e `grep` sul CSS emesso da `npm run build`
rende **0** occorrenze di `ir-datefield` / `ir-chipinput__pill`. E' il
comportamento corretto per questa slice — l'innesto e' FL4 — ma significa che «il
build passa» non dice nulla sulla validita' del foglio. Verificato a parte:
`npx sass` sul file, exit 0, **81 regole** emesse. Conseguenza per FL4: importare il
registro e' anche cio' che accende lo stile.

### Verifiche

- `npx vitest` sulle due suite nuove: **71/71** (32 pure + 39 render/round-trip).
- **Controllo di mutazione**, perche' 39 verdi al primo colpo non sono una prova:
  due difetti introdotti a mano — `readOnly` che non raggiunge l'input di
  `DateWidget`, e `ColorWidget` che smette di chiedere `toCss` al lato read — hanno
  prodotto **3 rossi** e i tre attesi (`date`, `datetime`, «a named colour survives»).
  Ripristinati, di nuovo 71/71.
- Gate a tre valori: `npm run typecheck` **33** (baseline invariata, conteggio su
  output completo), `npm run build` **exit 0** (solo il warning chunk-size e le
  deprecation `@import` preesistenti: `formWidgets.scss` non ha `@import`),
  `npm run test` **2382 passati, 0 falliti**, 9 file rossi = i noti
  `window is not defined`, nessuno dei quali e' di questa slice.
- `npm run smoke` **GREEN, 12 passed / 0 failed / 3 skipped**.
