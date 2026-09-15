# Prompt Claude Code, 2026-08-20 17:05: arco 1 di D-UI-13, i 16 token identici

**Fase**: 2, implementazione. **Un solo commit.** Nessuna discovery, la Fase 1 e' chiusa.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: `d5e773047` o successivo.
**Report di riferimento**: `docs/discovery/discovery_2026-08-20_riconciliazione_token.md`.
**Decisione che governa**: **D-UI-13** in `docs/decisions.md`. **Rileggila prima di cominciare**,
non fidarti di questo riassunto.

---

## Inquadramento

`frontend/src/styles/tokens.css` e `frontend/src/styles/tokens/` dichiarano **33 nomi in comune**.
Oggi vince `tokens.css` per ordine di import, non per una decisione. D-UI-13 stabilisce che il
livello semantico appartiene a `tokens/` e il livello primitivo a `tokens.css`, e ordina il lavoro
in quattro archi.

**Questo e' l'arco 1, e vale come controllo positivo del modello.** Tocca solo i **16 nomi che i due
file dichiarano con lo stesso identico valore**. Se il modello della discovery e' corretto, dopo
questo commit **nessun valore calcolato cambia, in nessuno dei tre regimi di tema**. Se qualcosa si
muove, il modello e' sbagliato e va fermato tutto prima degli archi 2 e 3, che invece cambiano la
UI davvero.

Gli archi 2, 3 e 4 **non sono in perimetro**. I sette colori divergenti, le quattro ombre, le due
transizioni e i quattro z-index **restano dove sono**, intatti.

---

## COSA

Un commit, due file.

### 1. `frontend/src/styles/tokens.css`: rimuovere 16 dichiarazioni

Sedici righe, e **solo** queste sedici. Ancora al testo, non al numero di riga.

```
--color-text-primary: #0f172a;     /* slate-900 */
--color-text-inverse: #ffffff;
--color-bg-tertiary: #f1f5f9;      /* slate-100 */
--radius-none: 0;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
--z-base: 0;
--z-dropdown: 1000;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--input-height-sm: 32px;
--input-height-lg: 48px;
```

> **TRAPPOLA, leggere due volte.** Le righe da togliere **non sono contigue**. In mezzo ai blocchi
> stanno tre nomi che **esistono solo in `tokens.css`** e che vanno **lasciati dove sono**:
>
> - `--radius-base: 6px;` sta **fra `--radius-sm` e `--radius-md`**, ed e' usato 7 volte.
> - `--input-height-base: 40px;` sta **fra `--input-height-sm` e `--input-height-lg`**, usato 3 volte.
> - `--shadow-base`, `--shadow-xs`, `--transition-base`, `--transition-slower`, `--z-fixed`,
>   `--z-popover` sono nella stessa zona e restano.
>
> Cancellare un blocco intero perche' "sembra tutto radius" rompe la libreria `components/ui/`.
> Fare sedici edit puntuali, uno per riga, non una riscrittura di sezione.

**Restano esplicitamente in `tokens.css`, non toccarli:** `--color-text-secondary`,
`--color-text-tertiary`, `--color-bg-primary`, `--color-bg-secondary`, `--color-border-*`,
`--shadow-sm|-md|-lg|-xl`, `--transition-fast`, `--transition-slow`, `--z-sticky`,
`--z-modal-backdrop`, `--z-modal`, `--z-tooltip`. Sono gli archi 2, 3 e 4.

**Aggiungere un solo commento**, in testa al file subito sotto il blocco di intestazione esistente,
in inglese, che spieghi il senso della sottrazione. Nessun commento dentro le sezioni: sei note
sparse fanno piu' rumore di una. Testo suggerito, adattabile:

```
/*
 * D-UI-13: the semantic layer belongs to styles/tokens/, the primitive layer
 * belongs here. Names declared by both files are being withdrawn from this one
 * in arcs. Arc 1 (2026-08-20) removed the 16 names whose value was identical in
 * both, so no computed value changed. Colours, shadows, transitions and z-index
 * that still collide are arcs 2 to 4; see docs/decisions.md.
 */
```

### 2. `frontend/src/components/editors/properties-with-tree-view.scss`: una citazione diventa falsa

Il commento in testa al file, punto (a), cita `tokens.css:229-231` come una delle due scale che
offrono 32 / 40 / 48 px. Dopo l'edit 1 quel file offre solo 40. Sostituire **solo** la porzione di
citazione, lasciando intatto il resto della frase e la sua punteggiatura:

- da: `` `_spacing.scss:33-35` and `tokens.css:229-231` offer 32 / 40 / 48 px ``
- a:   `` `_spacing.scss:33-35` offers 32 / 40 / 48 px ``

Nient'altro in quel file. Nessun riflusso del paragrafo, nessuna riscrittura del commento.

---

## COME, il controllo positivo

**Obbligatorio, e va eseguito prima e dopo.** Una misura che dice "non e' cambiato niente" vale solo
se la stessa misura, sull'albero senza le modifiche, dice la stessa cosa per costruzione e non per
caso.

1. Con l'albero **pulito**, dev server su `http://localhost:3000` (**non 3001**, P8), pagina
   `#/allProjects`, **senza aprire nessun progetto** (aprirlo innesca `useLayoutAutosave`).
2. Sonda `_tmp_` non committata, oppure snippet in console, che per ognuno dei **33 nomi collisi**
   legge `getComputedStyle(document.documentElement).getPropertyValue(nome)` nei **tre regimi**:
   attributo `data-theme` assente, `"light"`, `"dark"`. Ripristinare esattamente lo stato iniziale
   dell'attributo a fine misura. Salvare l'output come `PRIMA`.
3. Applicare le modifiche, ricaricare con hard refresh, rifare la stessa misura come `DOPO`.
4. **`PRIMA` e `DOPO` devono essere identici, tutti e 99 i valori.** Se anche uno solo differisce,
   **non committare**: fermarsi e riportare quale nome, quale regime, quali due valori.

I 33 nomi sono elencati nel report di discovery, §3 e §5. Se preferisci ricavarli invece di
ricopiarli, sono l'intersezione fra i nomi dichiarati in `tokens.css` e quelli dichiarati sotto
`styles/tokens/`.

**Perche' questo gate e non un gate di build**: nessun gate esistente guarda un valore di token, e
la build passa identica sia che il commit sia giusto sia che abbia cancellato `--radius-base`.

---

## Gate, dopo il controllo positivo

- `npm run build`, exit 0.
- `npm run typecheck`: baseline **33** su macOS. Zero errori nuovi.
- `npm run smoke`: baseline **12 passed / 0 failed / 3 skipped**. A5 deve restare `PASS` sui due
  stati con progetto aperto e `SKIP` su `empty-project`.
- `npm run check:docs`, exit 0 senza warning.

Nessuno di questi vede il difetto che conta. Servono a escludere che l'edit ne abbia introdotto un
altro.

---

## Vincoli

- **Zero refactoring opportunistico.** Nessun riordino di dichiarazioni, nessuna normalizzazione di
  commenti, nessun rename. La diff deve essere sedici sottrazioni, un commento aggiunto e una
  citazione corretta.
- **Non toccare `styles/tokens/`.** Nessun file di quella cartella entra nel commit.
- **Non toccare `components/editor-v2/_themes.scss` ne' `styles/variables.scss`.** Sono il terzo e
  il quarto sistema di token, censiti nel report, fuori perimetro.
- **Staging per file esplicito**, mai `git add .`: sessioni concorrenti sullo stesso repo sono la
  norma. Poi `git commit -m "<messaggio>" -- <paths>`, con il `--` **dopo** il messaggio.
- Messaggio di commit, una riga in inglese, tipo convenzionale. Proposto:
  `refactor(tokens): withdraw the 16 identical duplicates from tokens.css (D-UI-13 arc 1)`

---

## Hard stop

Dopo il commit, **fermarsi**. Non proseguire con l'arco 2: i sette colori divergenti cambiano la UI
e richiedono la verifica visiva di Alfonso prima ancora di essere scritti.

---

## Log

Aggiungere l'entry in `docs/claude-code-log.md` **dopo** il commit, con il formato di P-log:
data, tipo `refactor`, prompt riassunto in una riga, file toccati, esito, e nelle note l'esito del
controllo positivo (`PRIMA` uguale a `DOPO` su 99 valori, oppure quali hanno deviato).
Nome del documento prompt: `2026-08-20 17:05 claude_2026-08-20_1705_prompt_ui_I_arco1_token_identici.md`.

Il campo dello smoke visivo si riempie in luogo quando Alfonso conferma, non con una entry separata.
