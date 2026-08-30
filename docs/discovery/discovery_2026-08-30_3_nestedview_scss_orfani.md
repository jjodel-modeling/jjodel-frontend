# Discovery 2026-08-30 — `nestedView.scss`, la potatura dei selettori orfani

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `7f37a6d80`
**Prompt**: `docs/prompts/PROMPT_scss_orphans.md` — potare i selettori **provatamente** orfani,
sciogliendo prima le due riserve di metodo dichiarate in §4 di
`discovery_2026-08-30_2_nestedview_rimozione.md`
**Base**: `discovery_2026-08-30_2_nestedview_rimozione.md` §4 (il censimento a 48+21 token),
`discovery_2026-08-30_nestedview_censimento_riverifica.md`, R-DEAD-1..6
**Esito**: **potato**. 886 istanze di selettore su 921 rimosse, ognuna con almeno una classe
provatamente assente dal codice. Il foglio passa da 3737 a 366 righe. Dieci ritagli
before/after **md5-identici**, in light e in dark, su tutti e cinque i tab del pannello.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep`
risolve in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo.

---

## 0. La misura non e' quella del 30-08, ed e' un'altra di quanto il prompt prevedeva

Il prompt parte dai «48 selettori resi orfani + 21 gia' orfani» del censimento del 30-08 e
chiede di rifare la misura sciogliendo le due riserve. Sciolte, la misura cambia di **ordine di
grandezza**, e per una ragione sola che non stava nelle due riserve:

> **`.viewpoint-tab` non ha piu' nessun emettitore.** Era emesso da `NestedView.tsx:476` e
> `:496` (`<section className={'viewpoint-tab'}>`), cancellato con `0494a9cad`. Il censimento
> del 30-08 lo aveva classificato **vivo** perche' confrontava per sottostringa e la stringa
> compare in `info.scss:24,112` e `styles/components/_form-system.scss:657,665,715,722` — ma
> quelli sono altri **fogli** che lo stilano, non codice che lo **emette**.

Da `.viewpoint-tab` pendeva il 78% del foglio: 284 delle 489 regole compilate. La regola
`.viewpoint-tab .tree-DEdge` non puo' mai combaciare, quale che sia la vita di `tree-DEdge`,
perche' l'antenato non esiste in nessun DOM. Il criterio del prompt — «rimuovi i **provatamente**
orfani» — applicato alla lettera porta quindi a togliere 886 istanze di selettore su 921, non 69.

Questa e' la sola sorpresa del task, ed e' dichiarata qui prima dei numeri perche' non venga
letta come un allargamento di scope: il perimetro resta **un file**, e il criterio resta quello
scritto nel prompt.

---

## 1. Le due riserve di metodo, sciolte

### Riserva (b) — i nesting `&` non espansi

Il censimento del 30-08 leggeva i selettori scritti per esteso: un `&__row` annidato non
produceva token, e la cifra era dichiarata «per difetto». Sciolta compilando il foglio con
`sass` (`node_modules/.bin/sass --no-charset`, nessun `@import`/`@use` nel file: e' autonomo) e
leggendo il **CSS compilato**, dove ogni `&` e' gia' risolto, con la source map a riportare ogni
regola alla sua riga sorgente.

| Misura | 30-08 (sottostringa) | oggi (espansione) |
|---|---|---|
| token di classe distinti | 137 | **180** |
| regole | non misurate | **489** |
| istanze di selettore (liste separate da virgola, esplose) | non misurate | **921** |

I 43 token che l'espansione fa emergere sono i `&__`/`&--` annidati (`view-entry__row`,
`viewpoint-box__header-left`, `vp-toggle__thumb`, `feature-badge--inactive`, …) piu' le varianti
non-`D` dei badge di tipo (`tree-Class`, `tree-Model`, `tree-Any`, …) che vivevano in liste di
selettori su piu' righe.

**Reperto di metodo, del tutto analogo a quello di §5 del report di riverifica.** La prima
versione del mio estrattore leggeva il CSS **riga per riga**, prendendo per selettore la riga che
finisce in `{`. In una lista su piu' righe

```
.view-entry .tree-Any,
.view-entry .icon.type:not(.DViewPoint) {
```

quella forma vede solo l'ultima riga e **perde silenziosamente** la prima. Contava 489 regole —
il numero giusto — e 143 token: il conteggio delle regole tornava, ed e' esattamente per questo
che l'errore non si annunciava. La forma corretta accumula il prelude fino alla graffa. 143 → 180.

### Riserva (a) — vita per classe usata, non per sottostringa

Il confronto per sottostringa e' generoso verso la vita: `viewpoint` compare in 41 file, `type`
in 41, `active` in 61. Sciolta cosi':

- **perimetro**: `frontend/src/**` (`.ts .tsx .js .jsx .scss .css .html`), piu' `frontend/public/*.css|html`
  e `frontend/index.html`. **1263 file**. Esclusi `public/webjars` (ace), `public/boxicons*`,
  `public/fonts`, `public/docs`, `docs/`, `*.md` — e **`frontend/scripts/`**, perche' una sonda di
  smoke che cerca `.viewpoint-box` non e' una prova che qualcuno la emetta: nel caso di
  `_tmp_nestedview_removal.ts` era anzi il **controllo negativo**;
- **classificazione di ogni hit**: `class-use` (la riga porta `className` / `class=` / `classList`
  / `querySelector` / `closest(` / `.matches(` / `getElementsBy`), `css-sel` (occorrenza preceduta
  da `.` in un foglio), `other`;
- **costruzione dinamica**, che nessun grep letterale vede. Cercata per prefisso su tutti i
  prefissi del foglio:

```
`viewpoint-  'viewpoint-'+  "viewpoint-"+  viewpoint-${    → 0
`view-entry  …                                             → 0
`feature-badge …                                           → 0
`vp-toggle `viewpoints-header `entry-root `left- `mid-stuff
`hover-stuff `inline-row `single-view                       → 0
`priority-                                                  → 1  NotificationWidget.tsx:205 `priority-${...}` (info|warn|…)
`right-                                                     → 1  portDistribution.test.ts:159 `right-${N}` (handleId, non una classe)
`tree-                                                      → 13
    controllo positivo, STESSA forma: `tree-row              → 4   (segnale)
```

I 13 di `tree-` sono la ragione per cui i badge di tipo andavano guardati uno per uno:
`forEndUser/Tree.tsx:139` e `:252` costruiscono `` `icon tree-${data.className}` `` e
`` `type tree-${className}` ``, che a runtime possono produrre `tree-DEdge`, `tree-DGraph`,
`tree-Anchors` e compagnia. La domanda pero' non si pone: nel foglio **ogni** regola `tree-*` sta
sotto `.viewpoint-tab` o sotto `.view-entry`, e sono entrambi morti. Il verdetto sui `tree-*` e'
quindi preso **sull'antenato**, non sul token.

---

## 2. Il verdetto, per istanza di selettore

L'unita' di rimozione non e' il token: e' l'**istanza di selettore**. Regola applicata:

> un'istanza di selettore e' orfana se **almeno una** delle sue classi e' provatamente assente dal
> codice dell'app; una regola si rimuove se **tutte** le istanze della sua lista lo sono; se solo
> alcune lo sono, si pota la lista e si lascia il tronco.

E' un criterio conservativo per costruzione: rimuove solo cio' che non puo' combaciare, e in caso
di combinazione sospetta ma con tutte le classi vive (`.view-editor-root .dock-layout`) **lascia**.

### 2.1 Le 93 classi morte

92 hanno **zero occorrenze** in tutti i 1263 file del perimetro, la nestedView.scss esclusa:

```
breadcrumb-type-badge btn-backi btn-new chevron-holder entry-root ex-icon exclusive-vp
expansion-line feature-badge feature-badge--ex feature-badge--inactive feature-badge--js
feature-badge--ocl hover-stuff inline-row js-icon left-stuff mid-stuff ocl-icon overlay-vp
priority-booster priority-clear priority-field priority-label ps-2 pt-2 right-content right-icon
right-stuff row-left row-right single-view-content tree-Anchors tree-Any tree-DEdge
tree-DEdgePoint tree-DField tree-DGraph tree-DGraphVertex tree-DVertex tree-Edge
tree-EdgeAggregation tree-EdgeAssociation tree-EdgeComposition tree-EdgeDependency
tree-EdgeGeneralization tree-EdgeInheritance tree-EdgePoint tree-Fallback tree-Field tree-Graph
tree-GraphVertex tree-Vertex vertical-centering view-editor-fullsize-content view-entry
view-entry--selected view-entry__badges view-entry__children view-entry__left view-entry__name
view-entry__priority view-entry__right view-entry__row view-entry__toggle
view-entry__toggle-spacer view-header-breadcrumb-band view-row view-tree viewpoint-active-toggle
viewpoint-badge viewpoint-badge--exclusive viewpoint-badge--overlay viewpoint-box
viewpoint-box--active viewpoint-box--overlay viewpoint-box__content viewpoint-box__header
viewpoint-box__header-left viewpoint-box__header-right viewpoint-box__name viewpoint-box__toggle
viewpoint-checkbox viewpoint-checkbox__custom viewpoint-radio viewpoint-radio__custom
viewpoints-header viewpoints-header__actions viewpoints-header__icon viewpoints-header__title
vp-toggle vp-toggle__thumb
```

La 93esima e' **`viewpoint-tab`**, l'unica dichiarata morta pur avendo occorrenze: 4, tutte
`css-sel` in fogli terzi (`info.scss:24,112`, `_form-system.scss:665,722`). Nessun `className` in
tutto `src`, nessuna costruzione dinamica, e — misura a runtime, §4 — **zero elementi
`.viewpoint-tab` nel DOM** in tutti e dieci gli stati della sonda. Le regole di quei due fogli
restano dove sono: **sono fuori perimetro**, e questo report le segnala senza toccarle.

Controllo positivo dello scanner di vita, sulla stessa forma di comando: `style-tab` →
`class-use=1` (`PaletteData.tsx:358`), `bi-chevron-down` → `class-use=34`. Uno scanner che
tornasse zero su questi sarebbe rotto, non informativo.

### 2.2 Le 87 classi vive, e i dubbi che restano nel foglio

- **50** compaiono davvero come classe da qualche parte (`class-use ≥ 1`): `view-editor-root`,
  `view-editor-tabs`, `view-editor-tab*`, `view-entity-header`, `props-header--view`, `path-list`,
  `path-element`, `jj-type-badge--view|--viewpoint`, `btn-back`, `page-root`, `editor-label`,
  `style-tab`, `dock-tabpane`, `dock-nav-wrap`, `dock-panel-max-btn`, …
- **24** vivono **solo come selettore in altri fogli**, mai emesse: `path-separator`
  (`properties-with-tree-view.scss:521`), `dock-layout`, `delete-btn`, `permissions-tab`,
  `row-actions`, `style-variable-row`, e i badge `tree-*` non-`D` e `tree-D*` di `tree.scss`.
- **13** vivono solo per hit non di classe: `controls`, `type`, `viewpoint`, `overlay`,
  `exclusive`, `spacer`, `bx`, `dock-content`, `tree-DClass|DModel|DPackage|DAttribute|DReference`.

Le ultime due famiglie sono **dubbio, e restano nel foglio** come il prompt dispone. In concreto
sopravvivono per questo: `#root .controls`, `.view-editor-root .dock-content .dock-tabpane`,
`.view-editor-root .dock-layout` (con `.dock-nav-wrap` e `.dock-panel-max-btn`),
`.view-editor-root .btn-back`, `.page-root`, `.editor-label`, e le tre regole su
`.path-separator`. La combinazione e' probabilmente morta — `ViewData` ha un suo sistema di tab
«replaces rc-dock DockLayout» e non monta piu' un `DockLayout` — ma «probabilmente» non e'
«provatamente»: le classi sono vive e nulla vieta a un discendente di annidarle.

### 2.3 Il conto

| | prima | dopo |
|---|---|---|
| regole compilate | 489 | **35** |
| istanze di selettore | 921 | **35** |
| token di classe distinti | 180 | **23** |
| righe sorgente | 3737 | **366** |

Rimosse **886** istanze di selettore. Blocchi sorgente cancellati: **63**. Liste di selettori
potate lasciando il tronco: **4** (le tre `::-webkit-scrollbar*` e la `text-align: left`, dove
`.viewpoint-tab` e `.view-editor-fullsize-content` erano in lista con `.view-editor-root`), piu'
un `&i::before` dentro `.btn-back` — il `.btn-backi` che era gia' orfano prima della rimozione di
`NestedView`, e che nessuno aveva mai visto perche' era un `&` annidato: e' la riserva (b) che
paga da sola il proprio scioglimento.

### 2.4 La verifica meccanica della potatura

Non ci si fida della lista: si ricompila e si confronta. Ogni terna
`(contesto at-rule, singolo selettore, blocco di dichiarazioni)` del CSS **dopo** deve esistere
identica nel CSS **prima**, e ogni terna del prima che manca nel dopo deve portare una classe morta.

```
istanze di selettore  prima: 921   dopo: 35
istanze presenti nel DOPO e assenti nel PRIMA (regressioni):        0
istanze rimosse che portano una classe morta:                     886
istanze rimosse che NON portano nessuna classe morta:               0
```

Zero e zero. Nessuna dichiarazione e' cambiata, nessun selettore e' comparso, nessuna regola e'
stata tolta senza la sua prova.

---

## 3. I commenti, e la regola con cui sono stati trattati

Regola applicata, dichiarata perche' e' una scelta e non un automatismo: **un commento il cui
unico soggetto e' un selettore rimosso se ne va con lui; un commento che descrive codice che
sopravvive resta.**

- Cancellato il solo banner `// SINGLE VIEW CONTENT OVERLAY`: il suo unico soggetto era
  `.single-view-content`, che non esiste piu'.
- **Ripristinati** `// SCROLLBAR STYLING` e `// ENSURE LEFT ALIGNMENT THROUGHOUT`: descrivono
  regole vive, ed erano stati portati via per sbaglio dalla potatura delle liste di selettori
  (il prelude di una regola include il commento che la precede).
- **Lasciati** l'intestazione del file (`NESTED VIEW - VIEWPOINTS PANEL`, ormai imprecisa: il
  pannello dei viewpoint non c'e' piu') e le 48 variabili SCSS in testa, 33 delle quali
  ora inutilizzate. Sono fuori dal soggetto del prompt, che parla di **selettori**. Due
  candidati dichiarati per una slice futura, non eseguiti qui.
- Lasciati anche i due blocchi vuoti preesistenti `.dock { }` e `.style-tab { }` dentro
  `.view-editor-root`: erano vuoti gia' prima, `sass` non li emette, e non sono orfani.

---

## 4. La prova visiva

Sonda `scripts/smoke/_tmp_scss_orphans.ts` (non committata), piu' larga di quella del 30-08
perche' la potatura e' piu' larga: gira su **tutti e cinque** i tab del pannello (`Applies to`,
`Structure`, `Symbol`, `Form`, `Source`), in **light e dark** — i blocchi rimossi includono tre
grossi `[data-theme="dark"]` — e a ogni combinazione misura il computed style di ogni classe che
`ViewData` emette davvero, conta le classi potate nel DOM e ritaglia `.view-editor-root`.

**Il gate ha segnale, ed e' stato provato prima di usarlo.** Due controlli, entrambi eseguiti sul
foglio intatto:

| Controllo | Esito |
|---|---|
| determinismo: la sonda girata **due volte** sullo stesso albero | 10 ritagli su 10 **md5 identici** |
| positivo: `.view-editor-tabs { padding-left: 12px → 13px }`, una sola dichiarazione di una regola **conservata**, poi ripristinata | 10 ritagli su 10 **md5 diversi** |

Senza il primo l'identita' non direbbe niente; senza il secondo non direbbe che la sonda guarda
davvero il foglio. Con entrambi, l'esito conta:

| Misura | before (HEAD) | after (potato) |
|---|---|---|
| 10 ritagli `.view-editor-root` (5 tab × 2 temi) | — | **md5 identici, 10 su 10** |
| computed style di root/header/entityHeader/propsHeader/pathList/pathElement/badge/tabs/tabBar/tab/tabActive/tabContent, 19 proprieta' ciascuno, per ogni tab e tema | — | **`diff` vuoto** |
| nomi dei tab resi | `Applies to, Structure, Symbol, Form, Source` | identici |
| errori di pagina | 4 (boot noto: `init_dash`, `wrong project setup in navbar` ×3) | **gli stessi 4** |
| controllo negativo nel DOM: `.viewpoint-tab`, `.viewpoint-box`, `.view-entry`, `.viewpoints-header`, `.single-view-content`, `.view-editor-fullsize-content`, `.entry-root`, `.inline-row`, `.feature-badge`, `.vp-toggle`, `.btn-new`, `.breadcrumb-type-badge`, `.chevron-holder`, `.view-header-breadcrumb-band` | tutti **0** | tutti **0** |

Il controllo negativo vale 0 anche **prima**, ed e' per questo che non e' il gate: dice solo che
la sonda guardava il posto giusto senza trovarci il morto in nessuno dei due stati, e conferma a
runtime cio' che §2.1 afferma sul codice, `.viewpoint-tab` inclusa. Il gate e' l'identita' byte a
byte dei dieci ritagli.

I ritagli non sono schermate vuote: rendono l'intera «IR State base» — nome, badge VIEW,
breadcrumb, e il contenuto di ciascuno dei cinque tab.

### Il bundle, misurato dopo una build fresca

```
dist/assets/index-BhiziORK.css, occorrenze (grep -o | wc -l):
  viewpoint-box 0   view-entry__row 0   viewpoints-header 0   vp-toggle 0
  feature-badge--ocl 0   viewpoint-radio__custom 0   single-view-content 0
  entry-root 1  → e' `datatree-entry-root`, di tree.scss:141. Altra classe.
  controllo positivo, stesso comando:
  view-editor-tab-content 65   view-editor-root 90   view-entity-header 5   jj-type-badge--viewpoint 1
  viewpoint-tab 6  → info.scss e _form-system.scss, fuori perimetro (§2.1)
```

**Reperto di metodo.** La prima forma di questo controllo era
`grep -c -- "$c" dist/assets/*.css | awk -F: '{s+=$2}'`, e dava **0 anche sui controlli
positivi**: con un solo file `grep -c` non stampa il prefisso `file:`, quindi `$2` non esiste e
la somma e' zero. Il conteggio dei morti sarebbe stato letto come conferma, ed era il numero di
un comando rotto. Se ne e' accorto il controllo positivo — che e' precisamente il suo mestiere.

---

## 5. Gate

| Gate | Esito |
|---|---|
| `npm run typecheck` | **33 = baseline**, contati su output completo (`grep -c "error TS"`) |
| `npx vitest run` | **2008 passed / 0 failed**, 9 file rotti all'import = baseline nota (jjtl ×7, jjscript ×1, UDComparator) |
| `npm run build` | **exit 0**, solo il chunk-warning preesistente |
| `npm run smoke` | **12 passed / 0 failed / 3 skipped** = baseline |
| ritagli before/after | **10/10 md5 identici** |

---

## 6. Cio' che questa misura non copre, dichiarato

1. **I template di view salvati.** Le view sono persistite come `jsxString` nello stato Redux del
   progetto, e un `jsxString` scritto da un utente puo' contenere qualunque `className`. La
   ricerca copre tutto `src`, quindi i template **di default** (`redux/defaults/views.ts`,
   `common/DV.tsx`) sono inclusi e non nominano nessuna delle 93; un progetto salvato da un utente
   che avesse scritto a mano `class="viewpoint-box"` in una sua view non e' visibile da qui.
   Vale per ogni classe del foglio, non solo per quelle rimosse.
2. **Gli stati che la sonda non apre.** Lo smoke di `run.ts` non apre mai un progetto salvato
   (`docs/PROTOCOL.md`, nota di implementazione a P8), e la sonda dedicata parte da un progetto
   creato ex novo. La resa misurata e' quella di `ViewData` nella Properties card.
3. **Gli orfani negli altri fogli.** `info.scss` e `styles/components/_form-system.scss` stilano
   `.viewpoint-tab`, che non ha piu' emettitori: sono orfani anche loro, in due file **fuori
   perimetro**. Segnalati, non toccati. Stessa cosa per le regole `tree-*` di `tree.scss` che
   nessuno emette e per `.path-separator` di `properties-with-tree-view.scss`: la loro vita non
   e' stata decisa qui.
