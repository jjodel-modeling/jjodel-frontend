# Discovery — censimento lingua R-4 (Voce 6, Fase 0)

**Data**: 2026-08-09
**Tipo**: discovery, read-only
**Branch**: `alfonso-frontend-jjtl`
**Prompt**: «Fase 0 — Discovery: censimento lingua R-4 (Voce 6)», 2026-08-09 17:32
**Esito**: completato — nessun file sorgente toccato

---

## 1. Obiettivo

Mappare l'intera superficie di stringhe italiane **visibili in UI** in `frontend/src`,
prima di decidere in chat come scomporre la pass di traduzione R-4 in commit. La Fase 0
non traduce nulla e non tocca sorgenti.

Decisione che apre la voce (ratificata in chat 2026-08-09): **la lingua del sistema è
unica ed è l'inglese**; il mix EN/IT permanente non è ammesso. R-4 (2026-08-04) aveva
rimandato la pass per non mischiare diff strutturali e diff di traduzione.

### 1.1 Ipotesi che la discovery sta falsificando (P4)

| # | Ipotesi di partenza | Esito |
|---|---------------------|-------|
| H1 | «Esiste un sistema i18n, o ne serve uno prima di tradurre» | **Falsificata.** Nessun i18n, nessuna risorsa, tutto hardcoded (§3) |
| H2 | «L'italiano è confinato ai tre file noti da R-4 (`RowAuthoringPanel`, `EdgeAuthoringPanel`, `MatchingSection`)» | **Falsificata.** 21 file, 5 aree; `PredicateBuilder`, `TextStyle*`, Jodie non erano nel seed |
| H3 | «Le posizioni riportate nelle review pregresse sono ancora valide» | **Parzialmente falsificata.** I file ci sono ancora, ma tre seed si risolvono **negativi**: `InfoTooltip`, `VertexAuthoringPanel`, placeholder `Select` (§5) |
| H4 | «`VertexAuthoringPanel` non è ancora censito, quindi probabilmente contiene italiano» | **Falsificata nel file, confermata a schermo**: file inglese, rendering italiano via `MatchingSection` (§6.1) |
| H5 | «Un grep con una lista di parole italiane basta a censire la superficie» | **Falsificata.** Il seed lessicale ha prodotto falsi negativi reali; è servito un rilevatore indipendente dal lessico (§2) |
| H6 | «Tradurre è una sostituzione meccanica» | **Falsificata.** Tre collisioni terminologiche con inglese già in uso (§6.2) e un doppione di contenuto bilingue (§6.3) |

---

## 2. Metodo

Tre rilevatori **indipendenti**, per non far dipendere il censimento da una sola lista
di parole. La convergenza fra i tre è il criterio di completezza.

| # | Rilevatore | Come funziona | Esito |
|---|-----------|---------------|-------|
| 1 | **Seed lessicale** | ~250 parole italiane + suffissi (`-zione`, `-mente`, `-ità`, `-aggio`, `-abile`) + accenti `[àèéìòù]`, su `.ts/.tsx/.js/.jsx/.scss/.css/.html/.json/.md`. Classificazione riga per riga fra commento e codice, con riconoscimento del commento a fine riga. | 764 hit totali, 171 in posizione di codice |
| 2 | **Function-word** | Estrazione delle stringhe quotate e del testo JSX, poi filtro «≥ 2 function-word italiane distinte» (`della`, `nella`, `che`, `non`, `una`, `quando`, `senza`, `finché`…). Nessuna sovrapposizione voluta col seed di pass 1. | 46 hit, di cui **1 solo** non già trovato da pass 1 (in un file di test) |
| 3 | **Vocabolario esaustivo** | Estrazione di **tutte** le stringhe UI-bearing (prop `label/title/placeholder/aria-label/alt/text/tooltip/emptyHint/addLabel/message/desc/…`, testo fra tag JSX, argomenti di `toast.*`/`alert`/`confirm`): **3362 stringhe distinte**. Filtro per assenza dal dizionario inglese di sistema (`/usr/share/dict/words`, 236k voci) + morfologia italiana. Nessuna dipendenza da liste di parole italiane. | 274 candidati, che hanno **aggiunto stringhe non viste da pass 1** |

**Perché servivano tre passi.** Pass 1, da solo, ha prodotto falsi negativi reali:
`Capi`, `Capo sorgente`, `Tratto`, `Natura`, `(qualsiasi reference)`, `Booleano`,
`Corsivo`, `Tipografia`, `Personalizzato` e l'intero vocabolario di
`predicateDefaults.ts` non contenevano nessuna parola del seed. Pass 3 li ha
intercettati. Pass 2 ha confermato che pass 1 non lasciava scoperto nulla nella sua
classe (frasi lunghe).

**Perimetro residuo misurato.** Il dizionario inglese di sistema contiene come voci
proprie 6 parole italiane usate qui come label: `nome`, `stile`, `linea`, `peso`,
`label`, `matching`. Sono quindi invisibili a pass 3. Ho chiuso il buco con un grep
mirato su quelle 6 come stringhe UI: risultato in §4 (`Peso`, `Stile`, `Linea`
trovate e censite; `Matching` è inglese in tutti e tre i siti).

**Verifica supplementare**: dump completo, riga per riga, di **ogni** stringa UI dei
file di authoring IR e di `PredicateBuilder`, letta integralmente e non per campione.

---

## 3. Finding ad alta priorità — non esiste alcun sistema i18n

**Verificato negativo su tutti i fronti.**

- `frontend/package.json`: nessuna dipendenza `i18n*`, `intl*`, `lingui`, `polyglot`,
  `react-intl`, `i18next` (grep case-insensitive, exit 1).
- `frontend/src`: **zero** occorrenze di `i18n`, `useTranslation`, `FormattedMessage`,
  `LocaleProvider`, `gettext` (ripgrep su `.ts/.tsx/.js/.json`).
- Nessuna cartella di risorse (`locales/`, `translations/`, `lang/`), nessun file
  `*.po`/`*.ftl`, nessun contesto React di traduzione.

**Conseguenza operativa**: tutte le stringhe sono **hardcoded nel JSX/TS**. La pass R-4
è quindi una sostituzione diretta in-place, **non** richiede una decisione
infrastrutturale preliminare e non introduce dipendenze (Rule 4 non è sollecitata).

Corollario: nessun meccanismo di fallback protegge da una traduzione dimenticata — una
stringa non tradotta resta italiana e visibile, quindi il gate della pass è la lettura
del diff, non un tooling.

---

## 4. Censimento (a) — stringhe UI italiane

**Totale: ~170 stringhe visibili in UI, in 21 file.** Le stringhe italiane sono
**concentrate**: 5 aree coprono la quasi totalità. Fuori da queste aree il codice è già
in inglese.

### Area 1 — Authoring IR (86 stringhe, 6 file)

Il grosso della pass.

#### `components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` — 46

| Riga | Stringa |
|------|---------|
| 54 | `imposta una metaclasse sorgente nel tab Applies to per abilitare i path sulle feature` (const `FEATURES_HINT`) |
| 55 | `imposta una metaclasse nel tab Applies to per abilitare la scelta dei capi` (const `ENDPOINT_FEATURES_HINT`) |
| 56 | `Un capo non può leggere l'intero array (.values): scegli values[N] …` (const `ENDPOINT_ARRAY_ERROR`) |
| 59 | `Reference (stila una reference M1)` |
| 60 | `Object (oggetto reso come linea)` |
| 361 | `(qualsiasi reference)` |
| 451 / 452 | HelpText intro, due varianti (object / reference) |
| 472 | `Metaclasse dell'oggetto` / `Metaclasse sorgente` |
| 476 | `Tutte le metaclassi (*)` |
| 484 | HelpText «Una object-as-edge deve nominare almeno una metaclasse…» |
| 487 | ErrorText «Questa view ha metaclasse wildcard (*)…» |
| 497 | `title="Rimuovi"` |
| 504 / 505 | HelpText lista vuota, due varianti |
| 511 | `placeholder="Aggiungi metaclasse…"` |
| 518 / 519 | HelpText «…si risolvono dalla prima metaclasse della lista.», due varianti |
| 534 | HelpText «Una reference specifica ha priorità…» |
| 540 | `Condizione` |
| 544 | `Applica solo se (predicate)` |
| 560 / 561 | HelpText predicate, due varianti |
| 567 | `Priorità` |
| 572 | HelpText «Vince la priorità più alta; a parità, la specificità…» |
| 586 | `Natura` |
| 593 / 594 | HelpText natura, due varianti |
| 601 | `Capi` |
| 602 | HelpText «Con entrambi i capi impostati…» |
| 604 | `Capo sorgente` |
| 616 | `Capo destinazione` |
| 634 / 636 / 637 | HelpText divergenza capi, tre varianti (C-1/C-2/C-3) |
| 646 | `Linea` |
| 648 | `Colore` |
| 660 | `Spessore` |
| 672 | `Tratto` |
| 700 | «quelli già salvati restano e tornano visibili con Manhattan.» |
| 706 | `Terminazioni` |
| 708 | `Sorgente` |
| 716 | `Destinazione` |
| 734 | `Label al centro` |
| 749 / 750 | HelpText label, due varianti |

Già inglesi nello stesso file (**non toccare**): 64–66 `Solid/Dashed/Dotted`, 74–75
`Direct/Bezier`, 78–83 `None/Open arrow/Closed arrow/Hollow triangle/Filled
diamond/Hollow diamond`, 449 `IR Edge view authoring`, 470 `Matching`, 528 `Reference`,
690 `Routing`, 693 `Manhattan (default)`, 729 `Label`, 757 `Source`.

#### `components/editor-v2/viewpoint/authoring/MatchingSection.tsx` — 14

Righe 76, 80 (`Metaclassi`), 84 (`Tutte le metaclassi (*)`), 95 (`Rimuovi`), 101, 107
(`Aggiungi metaclasse…`), 113, 118 (`Condizione`), 122 (`Applica solo se (predicate)`),
137, 143 (`Priorità`), 148, 153 (`Esclusiva`), 160.

#### `components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` — 13

Righe 46 (const `FEATURES_HINT`), 266, 286 (`Metaclassi`), 290, 301, 307, 313, 319,
324, 328, 343, 349 (`Priorità`), 354.

#### `components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` — 8

Righe 72, 112, 127, 130, 132, 135, 137 (tutte `HelpText`), 142 (`Abilita authoring IR`).

#### `components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` — 4

Righe 194 (`Filtro children`), 196 (`predicate avanzato (preservato)`),
202 (`filtra per metaclasse (isKind)`), 236 (HelpText).

#### `components/editor-v2/viewpoint/authoring/authoringMessages.ts` — 1

Riga 30, `metaclassAmbiguityWarning`: «La metaclasse «…» è dichiarata in N metamodelli
del progetto…». È il messaggio cross-tab di R-B, consumato da Edge e Row.

### Area 2 — TextStyle (16 stringhe, 2 file)

`TextStyleEditor.tsx`: 16 `Normale`, 17 `Corsivo`, 101 `Condizionale`, 108 `Torna a
valore fisso` / `Rendi condizionale (ƒx)`, 170 `Dimensione`, 204 `Peso`, 224 `Stile`,
237 `Normale`, 244 `Colore`, 258 `Rimuovi (Default)`.

`TextStyleField.tsx`: 68 `Personalizzato`, 99 `Stile`, 160 `Colore condizionale`,
169 `Tipografia`, 175 `Reimposta al default`.

**Questa è l'area col mix più visibile a colpo d'occhio**: nello stesso `Select` le
opzioni sono `Normal / Medium / Semibold / Bold` (inglese) mentre la label del campo è
`Peso`; `Font` e `Default` inglesi convivono con `Dimensione`, `Stile`, `Colore`.

### Area 3 — PredicateBuilder (26 stringhe, 2 file) — primitiva condivisa `components/ui/`

`PredicateBuilder.tsx`: 22 `Booleano`, 23 `Numero`, 24 `Testo`, 29 `Valore`, 129 `vero`,
196 `Nessuna condizione — aggiungine una.`, 197 `Aggiungi condizione`, 251
`Seleziona tipo…`, 257 `Nome del tipo`, 263 `su un oggetto raggiunto da un path`,
285 `sempre vero`, 297 `Sinistra`, 307 `Destra`.

`predicateDefaults.ts` (21–33), vocabolario completo degli operatori:
`Tutte vere (AND)`, `Almeno una vera (OR)`, `Nega (NOT)`, `= uguale a`, `≠ diverso da`,
`< minore di`, `≤ minore o uguale a`, `> maggiore di`, `≥ maggiore o uguale a`,
`Esiste (non vuoto)`, `È vuoto`, `È di tipo…`, `Sempre vero/falso`.

Nota: sta sotto `components/ui/`, quindi è **superficie di primitiva condivisa** e non
di pannello. Rilevante per l'ordine dei commit e per l'eventuale ingresso in vetrina DS.

### Area 4 — Jodie (25 stringhe, 3 file)

`JjodieGreeting.tsx` (13): 18–39 le cinque card (`Creare Metaclassi`, `Nuove metaclassi
con attributi specifici`, `Eliminare Metaclassi`, `Rimuovere metaclassi esistenti`,
`Modificare Attributi`, `Aggiungere, rimuovere o modificare attributi`, `Creare
Riferimenti`, `Composizioni, associazioni e aggregazioni`, `Gestire Ereditarietà`,
`Relazioni di ereditarietà tra metaclassi`), 51–52 il saluto, 71 il congedo.

`JjodieWelcome.tsx` (6): 18 `Ciao, sono Jjodie!`, 22, 29 `Design di metamodelli`,
34 `Validazione e vincoli`, 44 `Generazione codice`, 50.

`ChatMessages.tsx` (6): 82 `Sembra un comando JjScript`, 91 `Esegui`, 99 e 189
`Chiedi a Jjodie`, 378, 387.

### Area 5 — Sparsi (21 stringhe, 8 file)

| File | Righe | Contenuto |
|------|-------|-----------|
| `components/editors/EditorToolbar.tsx` | 126, 136, 147, 158 | `Disabilita/Abilita Word Wrap`, `Copia contenuto`, `Riduci/Espandi altezza`, `Apri in finestra grande` (6 stringhe) |
| `components/editor-v2/EditorV2.tsx` | 982, 989 | due `toast.warning` |
| `components/editor-v2/hooks/useClassRemoval.ts` | 259, 260 | toast «…è diventata orfana» / «…sono diventate orfane» |
| `jjscript/components/ScriptBlock.tsx` | 1454, 1455 | `Errore di sintassi alla riga N:` / `Errore alla riga N:` |
| `components/editors/views/ViewData.tsx` | 144 | HelpText «View IR di kind "…": authoring non ancora disponibile.» |
| `components/editors/views/data/TemplateData.tsx` | 24–25 | HelpText «Questo template non viene più interpretato…» |
| `components/DonationBanner/DonationBanner.tsx` | 18, 36–37 | `aria-label="Chiudi"`; corpo del banner |
| `pages/ConfirmAccount.tsx` | 50 | `Conferma in corso... 🔄` |

---

## 5. Verifica dei seed del prompt — punto per punto

Il prompt chiedeva esplicitamente di **non fidarsi** delle posizioni delle review
pregresse. Verificate tutte per lettura diretta.

| Seed | Esito |
|------|-------|
| `RowAuthoringPanel`, `EdgeAuthoringPanel`, `MatchingSection` — stringhe rimandate da R-4 | **Confermato**, tutte ancora in italiano, posizioni aggiornate in §4 |
| Intro «IR Edge view authoring» ripetuta sui 5 tab | **Confermato e localizzato**: `EdgeAuthoringPanel.tsx:449–452` sta **prima** del primo `<div style={body('ir-applies-to')}>` (riga 464), quindi è fuori dai body ed è visibile su tutti e 5 i tab. Stesso schema in `RowAuthoringPanel.tsx:265–266` (prima del body a riga 278). L'intro (449) è **inglese**; la `HelpText` sotto (451/452) è **italiana**. La ripetizione è strutturale, non linguistica: **fuori scope R-4**, segnalata e non corretta |
| Label mancanti sui `Select` del tab Text; placeholder `"Select..."` | Il primitivo `Select` (`components/ui/Select/Select.tsx:50`) ha già default **inglese** `'Select...'`; idem `forEndUser/Input.tsx:363`. **Nessuna uniformazione linguistica necessaria.** Unico override italiano: `PredicateBuilder.tsx:251` `"Seleziona tipo…"` |
| Sezioni a figlio unico: «Label / Label», «Metaclasse dell'oggetto / Tutte le metaclassi» | «Label / Label» è **già inglese** (`VertexAuthoringPanel.tsx:400`, `EdgeAuthoringPanel.tsx:729`). La coppia metaclasse è italiana: `EdgeAuthoringPanel.tsx:472` + `476`. La **fusione strutturale resta fuori scope**, come da prompt |
| Armonizzazione tooltip ⓘ / helper | I testi `HelpText` italiani sono censiti in §4. I testi `InfoTooltip` sono **già tutti inglesi**: vedi sotto |
| `VertexAuthoringPanel.tsx` — non ancora censito | **Il file è interamente inglese** (verificato per lettura completa delle sue stringhe UI). **Ma vedi §6.1**: il pannello *rende* italiano a runtime, via `MatchingSection` |
| Siti InfoTooltip di voce 5 (`editors/Info.tsx`, `views/data/InfoData.tsx`, `authoring/irTabs.tsx`, `viewParenting/ViewParentingFields.tsx`) | **Tutti inglesi.** `irTabs.tsx:99`, `ViewParentingFields.tsx:72,121`, `InfoData.tsx:138,147,167,182,189,196,215,227,245,268` sono stringhe letterali inglesi; `Info.tsx:83` riceve la prop `tooltip`, i cui 3 call-site (`Info.tsx:102,105,121`) sono inglesi. **Seed risolto negativo** |
| Pannelli Properties (legacy e nuovi), Structure, Appearance, Source | Nessuna stringa UI italiana. `irTabs.tsx` è integralmente inglese e la riga 27 lo dichiara: «Tab labels — English (R-4), independent of the italian strings inside the panels» |

Spot-check aggiuntivo, tutto **negativo** (solo commenti italiani, nessuna UI):
`components/editor-v2/problems/`, `components/import/`, `components/envgen/`,
`components/megamodel/`, `components/commandbar/`, `components/Settings/`,
`components/TreeViewSidebar/`, `components/abstract/`, `view/`, `model/`.
Verificati anche: `content:` in SCSS/CSS (solo glifi Bootstrap Icons, nessun testo) e
`public/index.html` (inglese).

---

## 6. Dipendenze e rischi

### 6.1 Le stesse stringhe vivono in tre copie — e una raggiunge un file inglese

`MatchingSection` è importata **solo** da `VertexAuthoringPanel`
(`VertexAuthoringPanel.tsx:14,280`). `EdgeAuthoringPanel` e `RowAuthoringPanel`
**inlinano una propria copia** del blocco matching, per scelta documentata nei loro
commenti (`EdgeAuthoringPanel.tsx:125`, `RowAuthoringPanel.tsx:66`: `MatchingSection`
è tipizzata `VertexViewIR`).

Due conseguenze:

1. **`VertexAuthoringPanel` è inglese nel suo file ma italiano a schermo.** Chi
   verifica visivamente il pannello vertex vedrà italiano senza trovarne traccia nel
   file: la sorgente è `MatchingSection`. Va detto nel prompt di traduzione, o la
   verifica visiva sembrerà contraddire il diff.
2. Sette stringhe esistono **identiche in triplice copia** (`Tutte le metaclassi (*)`,
   `Rimuovi`, `Aggiungi metaclasse…`, `Condizione`, `Applica solo se (predicate)`,
   `Priorità`, la HelpText «Vince la priorità più alta…»). Tradurle in commit diversi
   produrrebbe **uno stato intermedio con lingua incoerente fra pannelli fratelli**.
   → I tre file dell'Area 1 vanno nello **stesso commit**, o l'ordine va scelto per
   evitare la finestra incoerente.

### 6.2 Collisioni terminologiche già presenti in inglese

La traduzione non è meccanica: alcuni termini italiani mappano su parole inglesi **già
usate con altro significato nello stesso pannello**.

- `Sorgente` / `Destinazione` (Terminazioni, righe 708/716) → `Source`/`Target`: ma
  `Source` è già il **nome del tab** (`ir-source`) e il titolo della FormSection a riga
  757 dello stesso file.
- `Natura` (586) → `Nature`? `Kind` è già occupato (`EnableIRPanel.tsx:117`, e `kind`
  è campo dell'IR).
- `Tratto` (672) → `Style`/`Dash`: ma `VertexAuthoringPanel.tsx:350` usa già `Style`
  per lo stesso concetto di bordo, e `TextStyleField` usa `Stile` per il font-style.
  Tre `Style` diversi, se si traduce senza decidere.
- `Capo`/`Capi` è lessico di dominio ratificato (R-C, R-D, C-1..C-4) e ricorre in
  `docs/decisions.md`: la scelta inglese va ratificata, non improvvisata, perché
  cambia il vocabolario dei documenti di progetto.

### 6.3 Doppione di saluto Jodie, una copia in italiano e una in inglese

`JjodieWelcome.tsx:18–44` (italiano: `Ciao, sono Jjodie!` / `Design di metamodelli` /
`Validazione e vincoli` / `Generazione codice`) e `ChatMessages.tsx:431–437` (inglese:
`Hi, I'm Jjodie!` / `Metamodel design patterns` / `Validation and constraints` /
`Best practices and trade-offs` / `Code generation guidance`) sono **lo stesso
contenuto in due lingue e due componenti**. Non è solo una traduzione: è una
duplicazione da risolvere.

### 6.4 Rischi minori

- `EdgeAuthoringPanel.tsx:56` `ENDPOINT_ARRAY_ERROR` e `authoringMessages.ts:30` sono
  **costanti esportate/condivise**: cambiarne il testo tocca più consumatori. Verificare
  che nessun test asserisca sul testo prima di tradurre.
- `predicateDefaults.ts` sta in `components/ui/`: la traduzione tocca una primitiva
  condivisa, non un pannello. Rule 11 (interfacce esportate) non è sollecitata — cambiano
  i *valori* `label`, non le firme — ma il file è più esposto della media.

---

## 7. Censimento (b) — commenti di codice in italiano (fuori scope traduzione UI)

Segnalati per completezza del quadro, **non target di questa pass**.

**593 righe di commento con italiano, in 99 file distinti.**

| Area | Righe |
|------|-------|
| `components/editors` | 129 |
| `components/editor-v2` | 64 |
| `redux` | 41 |
| `services` | 41 |
| `components/TreeViewSidebar` | 36 |
| `common` | 35 |
| `model` | 35 |
| `joiner` | 33 |
| `utils` | 32 |
| `styles` | 32 |
| altre 10 aree | 115 |

File più densi: `components/editors/properties-with-tree-view.scss` (41),
`model/logicWrapper/LModelElement.tsx` (34), `components/editors/PropertiesWithTreeView.tsx`
(28), `components/editors/monacoConfig.ts` (25), `components/TreeViewSidebar/tree-view-sidebar.scss`
(20), `styles/default-view.scss` (19), `services/export/EcoreService.ts` (19).

Il volume è **3,5× quello delle stringhe UI**. Una eventuale pass sui commenti è una
voce a sé, con costo e rischio molto diversi (tocca la critical zone §3 — `reducer.ts`,
`proxy.ts`, `LModelElement.tsx`, `canvasToJjom.ts` — dove il diff di commento è rumore
puro su file load-bearing). **Non proporla dentro R-4.**

---

## 8. Censimento (c) — falsi positivi e non-UI

| Sito | Perché non è target |
|------|---------------------|
| `pages/Auth.tsx:42`, `pages/components/about/AboutDialog.tsx:124` — `Università degli Studi dell'Aquila` | **Nome proprio istituzionale.** Non si traduce (l'ateneo non ha denominazione inglese ufficiale in uso qui). Vedi domanda D6 |
| `pages/Auth.tsx:44` — `Fondazione Bruno Kessler` | Nome proprio, idem |
| `redux/VersionFixer.tsx:1181` | `console.log` di migrazione, **non UI** |
| `services/export/XMIService.ts:703` | `console.info('[XMI M1 Import] Completato:', …)`, **non UI** |
| `redux/defaults/views.ts:574,704` — `"Inter Variabile"` | Nome di font errato (refuso storico), non lingua UI. Già annotato in `styles/classic-object-view.scss:128` come «beats legacy "Inter Variabile" typo» |
| `common/U.tsx:2610` — `Windows Vista` | Stringa di user-agent |
| `pages/Profile.tsx:27` — `2.2 (to come)` | Inglese; `come` intercettato per omografia |
| `services/export/__tests__/ecore-io.test.ts` (15 righe) | Titoli `it(...)` in italiano: **test, non UI**. Vedi domanda D7 |
| `redux/__tests__/versionfixer_2227_migration.test.ts:146,241` | idem |
| `jjtl/README.md` (11 righe) | Documentazione, non UI. Fuori dal perimetro `src/` UI dichiarato |
| `examples/shapes.ts` | Stato Redux serializzato di demo, con identificatori di modello italiani (`$inizio`, `$fine`). Vedi domanda D8 |

---

## 9. Domande aperte per Alfonso

Classificazioni che **non** ho deciso in autonomia, come da vincolo del prompt.

- **D1 — Lessico dei capi.** `Capo` / `Capi` / `Capo sorgente` / `Capo destinazione` →
  `Endpoint` / `Endpoints` / `Source endpoint` / `Target endpoint`? Il termine è
  ratificato in italiano in R-C, R-D, C-1..C-4 e ricorre in `docs/decisions.md`: la
  traduzione cambia il vocabolario dei documenti, non solo della UI. Si aggiornano
  anche le ratifiche, o resta la doppia denominazione doc-IT / UI-EN?
- **D2 — Le tre collisioni di §6.2.** `Sorgente`/`Destinazione` sotto `Terminazioni`
  vs il tab `Source`; `Natura` vs `Kind`; `Tratto` vs i due `Style` già esistenti.
  Servono tre scelte esplicite prima di scrivere il primo diff, altrimenti la pass
  produce ambiguità nuove al posto di quelle vecchie.
- **D3 — Operatori del PredicateBuilder.** `= uguale a` → `= equals` o solo `=`? Si
  tiene il prefisso simbolico? E `Tutte vere (AND)` → `All true (AND)` o direttamente
  `AND`? È l'unico blocco dove la traduzione può anche **ridurre** testo.
- **D4 — Persona di Jodie.** Il doppione di §6.3 è intenzionale (assistente
  localizzato) o un residuo? Se va tutto in inglese, quale delle due copie
  sopravvive, e `JjodieWelcome` va deduplicato contro `ChatMessages:431–437` nella
  stessa voce o in una successiva?
- **D5 — `DonationBanner`.** Il corpo (36–37) si rivolge a ricerca e didattica, con
  destinatario plausibilmente italiano. Traduzione piena, o è una superficie
  deliberatamente localizzata?
- **D6 — Nomi propri.** Confermi che `Università degli Studi dell'Aquila` e
  `Fondazione Bruno Kessler` restano invariati (mia raccomandazione: sì)?
- **D7 — Titoli dei test in italiano.** 15 righe in `ecore-io.test.ts` + 2 in
  `versionfixer_2227_migration.test.ts`. Non sono UI, ma sono output leggibile del
  runner. Dentro R-4, voce separata, o si lasciano?
- **D8 — `examples/shapes.ts`.** Stato serializzato con identificatori di modello
  italiani (`$inizio`, `$fine`). È dato di demo spedito all'utente o fixture interna?
  Se è demo visibile, la lingua del *contenuto del modello* è una decisione diversa da
  quella della *chrome* dell'applicazione — e il prompt chiedeva di segnalare, non
  decidere.
- **D9 — Commenti (b).** Confermi che le 593 righe di §7 restano fuori da R-4?

---

## 10. Proposta di scomposizione (da ratificare, non eseguita)

Ordine suggerito, ognuno bisecabile, dal meno al più esposto:

| # | Commit | File | Stringhe | Nota |
|---|--------|------|----------|------|
| 1 | Sparsi | 8 file di §4 Area 5 | 21 | Nessuna dipendenza incrociata, nessuna decisione lessicale aperta. Buon primo commit per validare il formato |
| 2 | TextStyle | `TextStyleEditor`, `TextStyleField` | 16 | Chiude il mix più vistoso; dipende solo da D2 (`Tratto`/`Stile`) |
| 3 | PredicateBuilder | `PredicateBuilder`, `predicateDefaults` | 26 | Bloccato da **D3** |
| 4 | Authoring IR | `EdgeAuthoringPanel`, `RowAuthoringPanel`, `MatchingSection`, `EnableIRPanel`, `FieldCompartmentListEditor`, `authoringMessages` | 86 | **Unico commit** (§6.1). Bloccato da **D1** e **D2**. È il più grosso: 6 file, sopra la soglia di Rule 19 → richiede la pausa con elenco file prima di procedere |
| 5 | Jodie | `JjodieGreeting`, `JjodieWelcome`, `ChatMessages` | 25 | Bloccato da **D4**; probabile che sia traduzione + dedup, non sola traduzione |

I commit 1 e 2 sono sbloccati oggi. I commit 3, 4, 5 attendono rispettivamente D3,
D1+D2, D4.

---

## 11. File letti / analizzati

**Scansione automatica**: l'intero albero `frontend/src` (tutti i `.ts`, `.tsx`, `.js`,
`.jsx`, `.scss`, `.css`, `.html`, `.json`, `.md`, esclusi `node_modules`, `dist`,
`build`, `coverage`).

**Letti direttamente** (path completi da `/Users/alfonso/jjodel/`):

- `frontend/package.json`
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (integrale)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/authoringMessages.ts`
- `frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx`
- `frontend/src/components/ui/PredicateBuilder/predicateDefaults.ts`
- `frontend/src/components/ui/Select/Select.tsx`
- `frontend/src/components/ui/InfoTooltip/InfoTooltip.tsx`
- `frontend/src/components/viewParenting/ViewParentingFields.tsx`
- `frontend/src/components/editors/views/data/InfoData.tsx`
- `frontend/src/components/editors/views/data/TemplateData.tsx`
- `frontend/src/components/editors/views/ViewData.tsx`
- `frontend/src/components/editors/Info.tsx`
- `frontend/src/components/editors/EditorToolbar.tsx`
- `frontend/src/components/Jodie/ChatMessages.tsx`
- `frontend/src/components/Jodie/JjodieGreeting.tsx`
- `frontend/src/components/Jodie/JjodieWelcome.tsx`
- `frontend/src/components/DonationBanner/DonationBanner.tsx`
- `frontend/src/components/editor-v2/EditorV2.tsx`
- `frontend/src/components/editor-v2/hooks/useClassRemoval.ts`
- `frontend/src/jjscript/components/ScriptBlock.tsx`
- `frontend/src/pages/ConfirmAccount.tsx`
- `frontend/src/pages/Auth.tsx`
- `frontend/src/pages/components/about/AboutDialog.tsx`
- `frontend/src/redux/VersionFixer.tsx`
- `frontend/src/examples/shapes.ts`
- `docs/PROTOCOL.md`, `docs/decisions.md`, `docs/claude-code-log.md`, `CLAUDE.md`

**Nessun file sorgente modificato.** L'unico artefatto prodotto è questo report.
