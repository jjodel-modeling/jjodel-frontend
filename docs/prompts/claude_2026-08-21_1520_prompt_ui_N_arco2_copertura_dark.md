# Prompt Claude Code, 2026-08-21 15:20: arco 2 di D-UI-13, copertura dark dei sedici nomi

> **ARCHIVIATO IL 2026-08-21, NON ESEGUIRE.** Il tema scuro e' sospeso da **R-RAIL-44**
> (2026-08-13) e questo prompt aggiunge sedici dichiarazioni dark, cioe' esattamente l'erosione del
> freeze che quella decisione prevedeva. Resta in albero perche' le misure che contiene valgono il
> giorno che il dark si riprende. Vedi **D-UI-13 Emendamento 4**.

**Fase**: 2, implementazione. **Un solo commit, un solo file di stile.** Nessuna discovery: le misure
sono qui dentro, prese il 2026-08-21 e ratificate in **D-UI-13 Emendamento 3**.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: `24e2dc3a6` o successivo.
**Decisioni che governano**: **D-UI-13 con i suoi tre emendamenti** e **D-UI-10** (principio di
copertura completa), in `docs/decisions.md`. **Rileggile prima di cominciare.**
**Evidenza**: `docs/discovery/discovery_2026-08-20_censimento_testo_e_bordi.md` §C, e le misure di
contrasto riportate qui sotto.

---

## Inquadramento

`_colors-light.scss` dichiara sedici nomi che `_colors-dark.scss` non dichiara. Non e' un vuoto: il
blocco chiaro sta su `:root, :root[data-theme="light"]` (righe 75-379), quindi il ramo nudo non si
spegne mai e **quindici nomi su sedici portano il valore chiaro dentro il tema scuro**. Il sedicesimo,
`--color-border-focus`, risolve al ciano di `tokens.css`. Un vuoto si vede; un valore chiaro plausibile
dentro il buio no, ed e' peggio.

Uno di quei valori e' patologico oggi: `--color-text-disabled` dipinge `#94a3b8`, che su `#08090a` sta
a **7.77:1**, cioe' **sopra** il testo secondario dark (`#a0a0a0`, 7.62:1). Il disabled e' piu'
prominente del secondario. L'altro nome di testo e' invece a posto per caso: `--color-text-placeholder`
dipinge `#64748b` a 4.19:1, dove il ruolo lo vuole.

**Questo arco copre, non ricalibra.** Nessun valore e' scelto a occhio: ognuno continua una rampa che
esiste gia' nel file scuro. Il fatto che la scala di testo dark sia sfalsata rispetto alla chiara (il
suo tertiary sta a 3.17:1, dove il chiaro mette il *disabled*) e' registrato nell'Emendamento 3 come
**vincolo dell'arco 4** e **non si tocca qui**.

---

## COSA

Un commit. Tutti gli edit in **`frontend/src/styles/tokens/_colors-dark.scss`**, dentro il blocco
`:root[data-theme="dark"]`. Sedici dichiarazioni nuove piu' una correzione di commento. Ancorare al
testo delle sezioni, non ai numeri di riga.

**Convenzione del file, da rispettare**: letterali piu' commento che nomina il gradino di palette.
`$slate-300` e compagni sono tecnicamente in scope (i due file sono `@import`ati nello stesso ambito
da `index.scss`), ma il file scuro non li usa da nessuna parte. **Non introdurli.**

### 1. Sezione `BASE BACKGROUNDS`, subito dopo `--color-bg-hover`

```scss
  --color-bg-active: rgba(255, 255, 255, 0.08);    /* Active/pressed state - continua il passo 0.04 -> 0.06 */
```

### 2. Sezione `BORDERS`, subito dopo `--color-border-hover`

```scss
  --color-border-focus: var(--color-accent);       /* Agganciato all'accento dark, non scelto: ticket --accent, CLAUDE.md 7.2 */
```

**Questo e' l'unico `var()` del file, ed e' voluto.** Il valore di questo nome spetta al ticket
`--accent`; agganciarlo invece di copiarlo copre il nome senza prendere la decisione, e quando il
ticket cambiera' l'accento dark l'anello di focus seguira' da solo. `--color-accent` e' dichiarato
solo in `styles/tokens/` (le mappe di `editor-v2/_themes.scss` generano `--accent`, che e' un altro
nome), quindi risolve deterministicamente.

### 3. Sezione `TEXT COLORS`, subito dopo `--color-text-tertiary` e prima di `--color-text-inverse`

```scss
  --color-text-placeholder: #7a7a7a;  /* Placeholder text - 4.64:1 su --color-bg-primary */
  --color-text-disabled: #525252;     /* Disabled text - 2.55:1, il meno contrastato della famiglia */
```

Nello **stesso commit**, il commento di `--color-text-tertiary` diventa falso appena queste due righe
esistono: oggi dice `/* Placeholders, disabled text */` e da adesso quei due ruoli hanno un nome
proprio. Sostituirlo con:

```scss
  --color-text-tertiary: #606060;     /* Labels, captions - 3.17:1, ricalibratura all'arco 4 (D-UI-13 Em. 3) */
```

Il valore **non cambia**. Cambia solo il commento, ed e' l'unica riga preesistente che questo commit
tocca: un commento che mente e' l'origine documentale della confusione che D-UI-13 sta chiudendo.

### 4. Sezione nuova `INTERACTIVE STATES`, fra `SECONDARY` e `SEMANTIC COLORS`

Stessa posizione che occupa in `_colors-light.scss`.

```scss
  /* ============================================
     INTERACTIVE STATES
     Rampa slate specchiata: in chiaro va verso il buio (700/800/900),
     in dark va verso la luce (300/200/100). Disabled a slate-600.
     ============================================ */
  --color-interactive-default: #cbd5e1;   /* slate-300 */
  --color-interactive-hover: #e2e8f0;     /* slate-200 */
  --color-interactive-active: #f1f5f9;    /* slate-100 */
  --color-interactive-disabled: #475569;  /* slate-600 */
```

Tutti e quattro hanno **zero consumatori**: si dichiarano per completezza (D-UI-10), non per un uso.

### 5. Quattro `-bg` semantici, uno per famiglia, dopo il rispettivo `-hover`

Stessa posizione che occupano in `_colors-light.scss` (fra `-hover` e `-muted`).

```scss
  --color-success-bg: #12201d;   /* success @8% su --color-bg-secondary */
  --color-warning-bg: #221e13;   /* warning @8% su --color-bg-secondary */
  --color-error-bg: #22181a;     /* error @8% su --color-bg-secondary */
  --color-info-bg: #151c25;      /* info @8% su --color-bg-secondary */
```

**Derivazione**: in chiaro il `-bg` e' il colore della famiglia all'8% sul bianco (verificato sui
quattro `-50` di Tailwind, errore massimo 3 unita' per canale). In dark e' lo stesso rapporto: il
`-subtle` gia' dichiarato, che sta esattamente a 0.08, composito su `--color-bg-secondary` (`#0f1012`),
che e' la superficie su cui queste bande vivono. Sono opachi come i loro gemelli chiari, mentre
`-muted` e `-subtle` restano rgba: la struttura della famiglia non cambia.

### 6. Sezione nuova `GRADIENTS`, fra `AUTO-* PILL FAMILY` e `CANVAS & GRAPH COLORS`

Stessa posizione che occupa in `_colors-light.scss`.

```scss
  /* ============================================
     GRADIENTS - CSS Custom Properties
     Ogni gradiente spende un gradino della rampa di superfici scure, nella
     stessa posizione relativa che il gemello chiaro occupa nella rampa chiara.
     Il quarto gradino (#1d1f22) estende la rampa con lo stesso delta dei tre
     esistenti (+7, +7, +8).
     ============================================ */
  --gradient-card: linear-gradient(180deg, #0f1012 0%, #16181a 100%);
  --gradient-sidebar: linear-gradient(180deg, #08090a 0%, #0f1012 100%);
  --gradient-panel: linear-gradient(135deg, #0f1012 0%, #16181a 100%);
  --gradient-hover: linear-gradient(180deg, #16181a 0%, #1d1f22 100%);
```

Vanno **qui e non nel blocco dark di `_gradients.scss`**, che ospita i `--gradient-primary*`: il
gemello chiaro di questi quattro sta in `_colors-light.scss`, e separare un gemello dall'altro e' il
meccanismo della divergenza silenziosa. Anche questi quattro hanno **zero consumatori**.

> **Da NON toccare, dichiarato qui perche' l'istinto dice il contrario.**
> **`_colors-light.scss`: nemmeno una riga.** Il ramo `:root, :root[data-theme="light"]` resta com'e';
> spegnerlo e' un altro arco, e non e' questo.
> **`styles/tokens.css`: nemmeno una riga.** Il ciano `--color-border-focus: #06b6d4` di riga 126
> resta: governa i regimi chiari e appartiene al ticket `--accent`.
> **`_gradients.scss`: nemmeno una riga.**
> **`styles/tokens/README.md`: nemmeno una riga.** Il disaccordo di riga 77 e' dell'arco 4.
> **I 41 siti in cui un token `text-*` dipinge sfondi o bordi non si correggono qui**, compreso
> `styles/components/_buttons.scss:93` che usa `--color-text-disabled` come `background`. Sono censiti
> e sono un arco a se'.
> **Nessuna ricalibratura di `--color-text-tertiary` in dark.** Il suo valore resta `#606060`.

---

## COME, il gate

**Asserzioni relazionali, non su valori assoluti** (P8), tranne dove il valore assoluto **e'** la
consegna: le sedici dichiarazioni nuove si verificano per identita' col testo del prompt, perche' li'
il valore e' il contratto.

Sonda `_tmp_` non committata, `http://localhost:3000` (**non 3001**), `#/allProjects` senza progetto
aperto basta: si legge `getComputedStyle(document.documentElement)`, come l'arco 1. Leggere **prima e
dopo** l'edit, nei tre regimi, ripristinando `data-theme` allo stato iniziale a fine misura.

**Insieme da leggere**: i sedici nomi, piu' `--color-text-primary|-secondary|-tertiary`,
`--color-bg-primary|-secondary|-elevated|-hover`, `--color-accent`.

### Asserzione 1, il controllo negativo (la piu' importante)

**Nei regimi A (nessun attributo) e B (`light`): tutti i valori identici fra PRIMA e DOPO.** Tutte le
dichiarazioni entrano sotto `:root[data-theme="dark"]`, quindi fuori dal dark **non si muove niente**.
Se qualcosa si muove, una dichiarazione e' finita fuori dal blocco: fermarsi e riportarlo, non
aggiustare.

### Asserzione 2, la consegna

**In regime C (`dark`)**, tabella PRIMA/DOPO dei sedici nomi. Attesi PRIMA: quindici col valore chiaro
(`#e2e8f0` per `bg-active`, `#64748b` per `placeholder`, `#94a3b8` per `disabled`, i `-50` di Tailwind
per i quattro `-bg`, `#334155`/`#1e293b`/`#0f172a`/`#94a3b8` per gli interactive, i quattro gradienti
slate), e `--color-border-focus` a `#06b6d4`. Attesi DOPO: i sedici valori di questo prompt.
**Se un valore PRIMA non e' quello atteso, fermarsi e riportarlo**: significa che il modello dei tre
regimi ha una falla, e vale piu' della consegna.

### Asserzione 3, relazionale, la ragione dell'arco

In dark, calcolare il contrasto WCAG dei cinque token di testo contro `--color-bg-primary` e
**ordinarli**. Non asserire i numeri: asserire il **rango**.

- **PRIMA**: `disabled` e' il **secondo piu' contrastato** dei cinque, sopra `secondary`.
- **DOPO**: `disabled` e' il **meno contrastato** dei cinque, e `secondary` sta sopra `placeholder`.

Questa e' l'inversione di gerarchia che l'arco chiude, ed e' l'unica asserzione che parla del perche'.

### Asserzione 4, identita' non letterale

In dark, `--color-border-focus` e `--color-accent` risolvono alla **stessa stringa**. Non confrontare
con `#94a3b8` scritto a mano: confrontare i due valori risolti fra loro. Se un giorno l'accento dark
cambia, questa asserzione deve continuare a passare.

### Asserzione 5, la rampa degli overlay

In dark, alfa di `--color-bg-elevated` **<** alfa di `--color-bg-hover` **<** alfa di
`--color-bg-active` (0.04, 0.06, 0.08).

### Asserzione 6, il controllo sul controllo

Come nell'arco 1: verificare che il CSS **servito** sia quello nuovo, cercando
`--color-interactive-default` dentro un blocco `[data-theme="dark"]` del foglio compilato. Un DOPO
stantio passerebbe l'asserzione 1 e fallirebbe silenziosamente le altre.

---

## Verifica a vista di Alfonso, in dark

Tre punti soli, perche' dieci nomi su sedici non hanno consumatori:

1. **Bottone primario disabilitato** (`.btn-primary:disabled`, sfondo da `--color-text-disabled`):
   oggi e' una pillola chiara `#94a3b8` che sembra abilitata, dopo e' `#525252`, rientrata.
2. **Bottone secondario premuto** (`.btn-secondary:active`, `--color-bg-active`): oggi un lampo quasi
   bianco `#e2e8f0`, dopo un velo bianco all'8%.
3. **Anelli di focus** (Toast, viewParenting, ImportSummaryModal): da ciano a slate. Erano l'unico
   ciano del tema scuro.

---

## Gate di regressione

- `npm run build`, exit 0 (il warning chunk-size e le deprecation Sass sono noti e preesistenti).
- `npm run typecheck`: baseline **33** sull'output completo. Zero errori nuovi.
- `npm run smoke`: baseline **12 passed / 0 failed / 3 skipped**, A5 invariata.
- `npm run check:docs`, exit 0 senza warning.

---

## Vincoli

- **Un solo file di stile toccato.** Se ti accorgi che ne servirebbe un secondo, fermati e chiedi.
- **Zero refactoring opportunistico.** L'unica riga preesistente che si tocca e' il commento di
  `--color-text-tertiary`, autorizzato sopra e per il solo commento.
- **Verificare prima di dichiarare**: `grep` di ciascuno dei sedici nomi in `_colors-dark.scss` deve
  dare **una** occorrenza dopo l'edit, non due.
- Staging per file esplicito, `git commit -m "<messaggio>" -- <path>`, con il `--` dopo il messaggio.
- Messaggio proposto:
  `feat(tokens): cover the sixteen light-only names in dark (D-UI-13 arc 2)`

## Hard stop

Dopo il commit, **fermarsi**. Il prossimo arco e' il 4, lo smistamento del testo, e non parte: prima
serve la decisione sulla ricalibratura di `--color-text-tertiary` in dark, che e' del direttore.

## Log

Entry in `docs/claude-code-log.md` a fine task, tipo `feat`, con nelle note: la tabella PRIMA/DOPO dei
sedici nomi in regime C, l'esito dell'asserzione 1 con il conteggio dei valori confrontati in A e B, e
i due ordinamenti dell'asserzione 3. **Rotazione del log se supera le 20 entry.**
Nome del documento prompt: `2026-08-21 15:20 claude_2026-08-21_1520_prompt_ui_N_arco2_copertura_dark.md`.
