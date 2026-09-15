# Discovery, censimento di testo e bordi (D-UI-13, arco 3)

**Data**: 2026-08-20 - **Branch**: `alfonso-frontend-jjtl` - **HEAD**: `796055e96`
**Fase**: 1, read-only. Nessun file di codice o di stile modificato.
**Decisione che governa**: **D-UI-13** e il suo **Emendamento 1** in `docs/decisions.md`.
**Superficie**: tutto `frontend/src` (escluso `node_modules`), piu' misure live in Chromium su
`http://localhost:3000`.

> Questo report **corregge due premesse** dell'Emendamento 1 e **una conclusione intermedia di
> questa stessa sessione**. Sono segnate con **CORREZIONE**.

---

## 0. Obiettivo

L'Emendamento 1 ha ratificato che due gruppi della consegna dei colori non si fanno
meccanicamente: i 162 siti di `--color-text-tertiary`, che vanno smistati fra due gradi di una
scala diversa, e le due famiglie di bordo, che la consegna separa di un gradino dentro l'area che
D-UI-11 ha appena unificato. Questo censimento produce l'evidenza che precede quelle due decisioni,
piu' l'inventario dei sedici nomi solo-light che l'ordine emendato mette **prima** dello
smistamento.

Nessuna patch e' proposta. Le destinazioni indicate nel censimento A sono una classificazione, non
un piano di edit.

---

## 1. Metodo, e perche' il conteggio grezzo non basta

**CORREZIONE, e riguarda questa sessione.** La prima passata ha classificato
`styles/style.scss:297` e `:477` come regole vive, leggendo una finestra di dodici righe intorno a
ciascuna. Sono entrambe dentro un blocco `/* ... */`: il commento si apre a riga **231** e si chiude
a riga **302**, un secondo va da **437** a **488**. Una lettura che si ferma alla riga non vede il
commento che la contiene. E' esattamente il modo di fallire descritto in `CLAUDE.md` §5 per i
conteggi presi su una finestra, applicato qui alla lettura invece che al conteggio.

Da li' in avanti ogni occorrenza e' passata per una **maschera commenti/stringhe a livello di
carattere** (stato `code | line | block | string`, con escape), validata su quattro casi noti prima
di fidarsene: `properties-with-tree-view.scss:869` (dentro `//`), `skeleton.scss:127` (dentro
`/* */`), `commandbar.scss:27` (dentro `//`), e per contrasto le occorrenze vive dei fogli del rail.
Le due asserzioni che avevo dato per certe sono state **smentite dalla maschera**, non il contrario.

Effetto sui numeri, misurato:

| token | occorrenze | vive | dentro un commento |
|---|---:|---:|---:|
| `--color-text-tertiary` | 162 | **160** | 2 |
| `--color-border-primary` | 141 | **131** | 10 |
| `--color-panel-border` | 18 | **18** | 0 |

Le grep di questo report sono state eseguite con `command grep` (BSD grep 2.6.0-FreeBSD), non con
il wrapper `ugrep --ignore-files` della shell interattiva: `CLAUDE.md` §5 spiega perche' la
differenza cambia il significato di `--include` e degli esclusi. Ogni asserzione di assenza ha il
suo controllo positivo, riportato in linea.

**Nota sul numero 162.** Una grep letterale su `var(--color-text-tertiary` restituisce **163** righe.
La 163esima e' `components/editors/EditorToolbar.scss:166`,
`color: var(--color-text-tertiary-dark, #6B7280)`: **un altro nome**, non un altro uso. Il nome
`--color-text-tertiary-dark` non e' dichiarato da nessuna parte, quindi quel sito dipinge sempre il
fallback `#6B7280`, che non e' nessuno dei valori in gioco. E' un difetto suo, segnalato in §7.

---

## 2. File letti e misure eseguite

Letti: `styles/tokens.css`; `styles/tokens/_colors-light.scss`, `_colors-dark.scss`,
`_gradients.scss`; `styles/variables.scss`; `components/editor-v2/_themes.scss`;
`components/editors/info-improvements.scss`, `properties-with-tree-view.scss`;
`components/editors/Info.tsx`, `PropertiesWithTreeView.tsx`; `styles/style.scss`,
`styles/diagram.scss`, `components/widgets/widgets.scss`, `pages/components/Edit/edit.scss`,
`components/forEndUser/color.scss`, `components/editors/skeleton.scss`, piu' le finestre di codice
di ogni sito che la regola di classificazione non risolveva da sola.

Misure statiche: inventario di tutte le occorrenze `var(--x)` con la proprieta' CSS a cui il token
e' assegnato (estratta per posizione, non per riga) e la catena di selettori annidati, su testo
ripulito dai commenti.

Misure live, tre sonde `_tmp_` non committate in `frontend/scripts/smoke/`:

- `_tmp_censusC.ts` — i sedici nomi solo-light nei tre regimi di `data-theme`, letti **sia** su
  `:root` **sia** su un elemento discendente di `<body>`. Pagina `#/allProjects`, nessun progetto
  aperto. Attributo iniziale `null`, ripristinato `null`.
- `_tmp_censusB.ts` — colore dipinto e rettangolo di ogni candidato delle due famiglie di bordo, in
  regime A e in regime B. **Richiede un progetto aperto**, dichiarato qui come chiede il prompt: il
  rail vive solo li'. Il contesto browser e' effimero e viene distrutto a fine sonda; nessun salvataggio
  esplicito. Eseguita due volte, numeri identici.
- `_tmp_reconTabs.ts` — ricognizione dei controlli raggiungibili, per capire come arrivare a una tab
  `model_*`.

---

## 3. Censimento A — i 162 usi di `--color-text-tertiary`

### 3.1 Il criterio, dichiarato prima e applicato uniformemente

Regole ordinate, vince la prima che si applica. La **proprieta' CSS** e' il discriminante, non il
nome del token.

```
R0  l'occorrenza sta dentro un commento          -> commentato
R1  la proprieta' e' una custom property         -> alias   (l'indirezione si traccia a parte)
R2  la proprieta' non e' `color`                 -> altro   (si riporta la proprieta' e ci si ferma)
R3  stato disabilitato o read-only               -> subtle
R4  placeholder                                  -> subtle
R5  icona o glifo generato, senza testo proprio  -> subtle
R6  tutto il resto                               -> caption
```

Due precisazioni che fanno parte del criterio, non della sua applicazione:

- **Le icone vanno in `subtle` come gruppo**, non sito per sito. Il secchio `subtle` si scompone in
  **16 stati disabilitati, 8 segnaposto e 19 icone o glifi generati**, e le 19 sono elencate per
  intero, cosi' la decisione si ribalta in un colpo solo se Alfonso la vuole diversa. Classificarle
  una per una avrebbe prodotto diciannove scelte silenziose invece di una dichiarata.
- **Un messaggio di stato vuoto e' `caption`**, non `subtle`. Quando compare e' l'unico contenuto
  sullo schermo, e il grado di grigio che lo dipinge e' quello che decide se si legge.

I siti che il criterio non risolve stanno in `dubbi` con una riga di motivazione. Sono **sette**.

### 3.2 I numeri

| secchio | siti | destino |
|---|---:|---|
| `caption` | **55** | resta su `--color-text-tertiary`, si scurisce da `#94a3b8` a `#475569` |
| `subtle` | **43** | passa a `--color-text-disabled`, resta `#94a3b8` |
| `dubbi` | **7** | decide Alfonso |
| `altro` | **41** | il token non dipinge testo: si riporta la proprieta' e basta |
| `alias` | **12** | dichiara un'altra custom property; l'indirezione e' tracciata in §3.6 |
| `morto` | **2** | la regola non raggiunge mai il DOM |
| `commentato` | **2** | dentro un blocco di commento |
| **totale** | **162** | |

**Un quarto dei siti (41) non dipinge testo.** Un token chiamato `text-*` e' assegnato a
`background-color` 13 volte, a `border` o a una sua variante 20, a `background` 6, a `outline` una.
Il quarantunesimo e' `metrics.scss:96`, dove la proprieta' **e'** `color` ma la scatola e' un `hr`,
che di testo non ne contiene. E' un difetto indipendente da questo arco e non va classificato: va
guardato dopo.

### 3.3 Il taglio sul rail destro

Dei 162 siti, quelli nei due fogli del rail — l'area gia' verificata a occhio, e quindi la piu'
facile da falsificare — sono **uno solo**:

| sito | esito |
|---|---|
| `components/editors/info-improvements.scss:913` (`.props-header__badge`) | **morto** |
| `components/editors/properties-with-tree-view.scss` | **nessun uso** |

E quell'unico e' morto. `.props-header__badge` non e' mai reso: il commento a
`properties-with-tree-view.scss:373-378` racconta che la classe del glifo si chiama `__glyph`
**proprio per non riusare** `.props-header__badge`, che `info-improvements.scss:903` gia' occupava.
La sonda live conferma: `document.querySelectorAll('.props-header__badge')` restituisce **0** con la
tab metamodello aperta e un nodo selezionato.

**Conseguenza operativa**: lo smistamento del testo **non tocca il rail**. La verifica visiva
accumulata su quell'area non e' messa in discussione da questo arco. Il rischio sta altrove.

### 3.4 Contrasto, misurato

I due candidati sui tre fondi in gioco, rapporto WCAG 2.x:

| primo piano | su `#ffffff` | su `#f8fafc` | su `#f1f5f9` |
|---|---:|---:|---:|
| `#94a3b8` — oggi, ed e' il `--color-text-disabled` di `tokens/` | 2.56:1 | 2.45:1 | 2.34:1 |
| `#475569` — il `--color-text-tertiary` di `tokens/` | 7.58:1 | 7.24:1 | 6.92:1 |
| `#64748b` — `--color-text-placeholder` | 4.76:1 | 4.55:1 | 4.34:1 |
| `#334155` — `--color-text-secondary` | 10.35:1 | 9.90:1 | 9.45:1 |

Le soglie sono 4.5:1 per il testo normale e 3.0:1 per il testo grande e i componenti di interfaccia.
**Il valore di oggi non arriva ne' all'una ne' all'altra**: i 55 siti `caption` sono tutti sotto
soglia, e lo sono anche i 43 `subtle`. In regime scuro `--color-text-tertiary` vale `#606060`, che
sui tre fondi scuri dell'app da' 3.17:1, 3.03:1 e 2.83:1 — sotto la soglia del testo normale in
tutti e tre.

Questo non decide lo smistamento, perche' WCAG esente i controlli disabilitati e non i segnaposto,
ma dice da che parte pende il costo dell'errore: mettere in `subtle` una didascalia la lascia
illeggibile, mettere in `caption` un segnaposto lo rende solo piu' scuro del previsto.

### 3.5 I fallback, ventinove, tutti morti e tutti diversi

Ventinove dei 162 siti scrivono `var(--color-text-tertiary, <fallback>)`. Il token e' dichiarato,
quindi **nessuno di quei fallback si applica mai**. Ma dicono che cosa credeva chi ha scritto:

| fallback | siti | che cos'e' |
|---|---:|---|
| `#94a3b8` | 14 | il valore risolto oggi, ricopiato a mano |
| `#717784` | 5 | un grigio che non appartiene a nessuna delle due scale |
| `#9ca3af` / `#9CA3AF` | 5 | grigio Tailwind `gray-400`, un'altra palette |
| `#64748b` | 3 | e' `--color-text-placeholder` di `tokens/` |
| `gray` | 2 | parola chiave CSS |

I quattordici `#94a3b8` sono la cosa da guardare: fissano nel codice il valore che questo arco
cambia. Dopo lo smistamento resteranno a dire `#94a3b8` sotto un token che vale `#475569`. Restano
inerti, ma diventano documentazione falsa.

### 3.6 Gli alias, dodici dichiarazioni, una sola che arriva a schermo

Dodici siti non dipingono: dichiarano un'altra custom property a partire da questa. Tracciati fino
al consumatore:

| alias | dichiarato in | consumatori `var()` vivi | esito |
|---|---|---:|---|
| `--accent-50` | `abstract/style.scss:11`, `style_ap.scss:11`, `dock/DockManagerStyles.scss:6` | **0** | morto |
| `--bg-4` | `abstract/style.scss:21`, `style_ap.scss:20`, `pages/components/style.scss:14` | **0** | morto |
| `--disabled` | `abstract/style.scss:24`, `style_ap.scss:23`, `dock/DockManagerStyles.scss:20` | **0** | morto |
| `--neutral` | `widgets.scss:10` (su `.toggle`), `Edit/edit.scss:76` (su `div.edit.checkbox`) | 12, ma **uno solo in scope** | vedi sotto |
| `--color-disabled` | `styles/variables.scss:46` (su `body`) | **1** | vivo |

Controllo positivo sulla stessa forma di ricerca: `var(--color-panel-border)` da' 18 occorrenze.
Le tre asserzioni di zero non sono un silenzio della ricerca.

`--neutral` ha **tre** dichiaranti e **due** sorgenti diverse: `variables.scss:26` lo prende da
`--color-text-secondary`, gli altri due da `--color-text-tertiary`. I dodici consumatori vivi
stanno in `.command-bar` e `.palette-row`, che non sono dentro `.toggle` ne' dentro
`div.edit.checkbox`: prendono quindi il valore di `body`, cioe' `secondary`, e **non sono toccati**
da questo arco. L'unico consumatore in scope e' `widgets.scss:90`, che dice
`border: 2px border var(--neutral)`: `border` non e' uno stile di linea valido, la dichiarazione e'
invalida al momento della sostituzione e la proprieta' torna al valore iniziale. Dichiaro che
questa e' una lettura della specifica e **non una misura**: nella sonda live `.toggle .toggle-label`
non era presente in nessuno degli stati raggiunti.

`--color-disabled` invece arriva: un consumatore, `forEndUser/color.scss:663`,
`input.prefix:disabled { color: var(--color-disabled) !important; }`. Per il criterio e' `subtle`.

### 3.7 I sette dubbi

| sito | selettore | perche' e' dubbio |
|---|---|---|
| `pages/dashboard.scss:909` | `.leftbar .menu-header h1` | un `h1` a tertiary: elemento di intestazione, ruolo di occhiello |
| `pages/components/RightPanel/RightPanel.scss:753` | `.group-item-name` | e' un **nome**, accanto a `-time` dipinto dello stesso grigio |
| `pages/components/style.scss:228` | `span.project-link > span ~ span` | segmenti fratelli di uno stesso percorso, spezzati su due grigi |
| `components/Jodie/JodieWindow.css:2584` | `.jodie-inspector-value-expandable` | e' un **valore** dell'ispettore, cioe' dato, non cromo |
| `components/TreeViewSidebar/tree-view-sidebar.scss:1803` | `.tree-edge-marker, .tree-stack-marker` | glifo, ma e' l'unico portatore del tipo di riga |
| `pages/components/menu/menu.scss:100` | `span.keystroke` | testo vero (una scorciatoia) reso come cromo |
| `components/GlobalSearch/GlobalSearch.scss:97` | `.shortcut-hint kbd` | stesso caso del precedente, in un altro componente |

I primi quattro hanno la stessa forma: **un dato dipinto del grigio del cromo**. Gli ultimi tre
hanno la forma opposta: **cromo che pero' e' testo che si legge**. Sono due domande, non sette.

### 3.8 Enumerazione completa

Tutti i 162, uno per riga, raggruppati per secchio, con proprieta' e selettore.

#### caption — 55 siti

| file:riga | proprieta' | selettore |
|---|---|---|
| `common/error.scss:390` | `color` | `.error-badge-slick > .error-badge-instance` |
| `common/error.scss:401` | `color` | `.error-badge-slick > .error-badge-hint` |
| `components/JjodieWidget/jjodie-widget.scss:226` | `color` | `.jjodie-suggestions-label` |
| `components/JjodieWidget/jjodie-widget.scss:472` | `color` | `.jjodie-disclaimer` |
| `components/Jodie/JodieWindow.css:588` | `color` | `.jodie-message-meta` |
| `components/Jodie/JodieWindow.css:2556` | `color` | `.jodie-inspector-key` |
| `components/Jodie/SettingsModal.css:161` | `color` | `.jodie-settings-provider-name span` |
| `components/NotificationCenter.scss:41` | `color` | `.app-notif-popover > &__count` |
| `components/NotificationCenter.scss:70` | `color` | `.app-notif-popover > &__empty` |
| `components/NotificationCenter.scss:174` | `color` | `.app-notif-popover > &__item-time` |
| `components/Toast/toast.scss:115` | `color` | `.jj-toast__time` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:428` | `color` | `.tree-search > &__count` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:1572` | `color` | `.tree-section > &__label` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:1581` | `color` | `.tree-counter` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:1834` | `color` | `.tree-feature__type` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:1853` | `color` | `.tree-empty-doc > &-label` |
| `components/dock/tabs-overflow-menu.scss:32` | `color` | `.jj-tabs-overflow-menu > &__header` |
| `components/dock/tabs-overflow-menu.scss:40` | `color` | `.jj-tabs-overflow-menu > &__empty` |
| `components/editor-v2/sim/simulation-panel.scss:162` | `color` | `.sim-panel > &__section` |
| `components/editor-v2/sim/simulation-panel.scss:169` | `color` | `.sim-panel > &__hint` |
| `components/editor-v2/sim/simulation-panel.scss:186` | `color` | `.sim-panel > &__label` |
| `components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx:65` | `color` | `const CHIP: React.CSSProperties =` |
| `components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx:16` | `color` | `const CHIP: React.CSSProperties =` |
| `components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx:18` | `color` | `const CHIP: React.CSSProperties =` |
| `components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss:307` | `color` | `.symbol-editor-modal > .symbol-catalog > &__tag` |
| `components/import/ImportSummaryModal.scss:105` | `color` | `.import-summary-modal > &__section-title` |
| `components/import/ImportSummaryModal.scss:118` | `color` | `.import-summary-modal > &__kv-label` |
| `components/ui/ListEditor/ListEditor.module.css:9` | `color` | `.empty` |
| `components/ui/PathBuilder/PathBuilder.module.css:34` | `color` | `.previewEmpty` |
| `components/ui/PathBuilder/PathBuilder.module.css:40` | `color` | `.hint` |
| `components/viewParenting/viewParenting.scss:40` | `color` | `.jj-viewpoint-row > &__state` |
| `pages/auth.scss:700` | `color` | `.auth-field-hint` |
| `pages/auth.scss:882` | `color` | `.auth-terms-text` |
| `pages/components/RightPanel/RightPanel.scss:296` | `color` | `.timeline-group-label` |
| `pages/components/RightPanel/RightPanel.scss:495` | `color` | `.timeline-time` |
| `pages/components/RightPanel/RightPanel.scss:595` | `color` | `.empty-activity` |
| `pages/components/RightPanel/RightPanel.scss:759` | `color` | `.group-item-time` |
| `pages/components/catalog/catalog.scss:832` | `color` | `.dashboard-container .project-list > .header` |
| `pages/components/menu/menu.scss:151` | `color` | `.dropdown .user-header > .user-email` |
| `pages/components/project-card.scss:1205` | `color` | `.gallery-card__rev` |
| `pages/components/project-card.scss:1221` | `color` | `.gallery-card__progress-labels` |
| `pages/components/project-card.scss:1246` | `color` | `.gallery-card__footer-time` |
| `pages/components/style.scss:219` | `color` | `span.project-link` |
| `pages/dashboard.scss:685` | `color` | `.project-card-v2 > .card-footer` |
| `pages/dashboard.scss:936` | `color` | `.leftbar > .sidebar-empty-text` |
| `pages/dashboard.scss:981` | `color` | `.leftbar > .recmod-time` |
| `pages/dashboard.scss:1202` | `color` | `.leftbar > .item--muted` |
| `pages/dashboard.scss:1229` | `color` | `.leftbar > .item-count` |
| `pages/tokenPreview.scss:127` | `color` | `.color-var` |
| `pages/tokenPreview.scss:157` | `color` | `.type-label` |
| `styles/diagram.scss:299` | `color` | `.attribute,.reference > .multiplicity,  .cardinality` |
| `styles/diagram.scss:444` | `color` | `.operation:not(.operation-row) > .operation-return` |
| `styles/diagram.scss:556` | `color` | `.label-end .label-text` |
| `styles/diagram.scss:729` | `color` | `.empty-state,.no-attributes,.no-children` |
| `styles/diagram.scss:746` | `color` | `.empty-state,.no-attributes,.no-children > span,  p` |

#### subtle — 43 siti

| file:riga | proprieta' | selettore |
|---|---|---|
| `components/GlobalSearch/GlobalSearch.scss:33` | `color` | `.global-search .search-icon` |
| `components/GlobalSearch/GlobalSearch.scss:47` | `color` | `.global-search input > &::placeholder` |
| `components/GlobalSearch/GlobalSearch.scss:63` | `color` | `.global-search .clear-btn` |
| `components/JjodieWidget/jjodie-widget.scss:431` | `color` | `.jjodie-input > &::placeholder` |
| `components/Jodie/JodieWindow.css:2521` | `color` | `.jodie-inspect-toggle` |
| `components/NotificationCenter.scss:191` | `color` | `.app-notif-popover > &__item-close` |
| `components/Toast/toast.scss:131` | `color` | `.jj-toast__close` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:405` | `color` | `.tree-search > > i.bi-search` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:420` | `color` | `.tree-search > &__input > &::placeholder` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:441` | `color` | `.tree-search > &__clear` |
| `components/abstract/style.scss:121` | `color` | `.dock-tab-btn-disabled` |
| `components/abstract/style.scss:183` | `color` | `.dock-tab-disabled` |
| `components/abstract/style.scss:187` | `color` | `.dock-tab-disabled:hover` |
| `components/abstract/style.scss:474` | `color` | `.dock-dropdown-menu-item-disabled,.dock-dropdown-menu-item-disabled:hover` |
| `components/abstract/style_ap.scss:125` | `color` | `.dock-tab-btn-disabled` |
| `components/abstract/style_ap.scss:188` | `color` | `.dock-tab-disabled` |
| `components/abstract/style_ap.scss:192` | `color` | `.dock-tab-disabled:hover` |
| `components/abstract/style_ap.scss:468` | `color` | `.dock-dropdown-menu-item-disabled,.dock-dropdown-menu-item-disabled:hover` |
| `components/colorScheme/defaultColorScheme.scss:1103` | `color` | `.dock-style-graph > .changelog li.info::before` |
| `components/editor-v2/sim/simulation-panel.scss:110` | `color` | `.sim-panel > &__header > > .bi,        > .bi:hover` |
| `components/editor-v2/sim/simulation-panel.scss:131` | `color` | `.sim-panel > &__collapse` |
| `components/editors/EditorToolbar.scss:94` | `color` | `.editor-toolbar > &__btn` |
| `components/editors/info.scss:159` | `color` | `.collaborative-tab input::placeholder` |
| `components/import/ImportSummaryModal.scss:71` | `color` | `.import-summary-modal > &__close-btn` |
| `components/ui/ColorPicker/ColorPicker.module.css:75` | `color` | `.hex:disabled` |
| `components/ui/HelpText/HelpText.module.css:29` | `color` | `html[data-theme="dark"] > .helpText i` |
| `components/ui/Input/Input.module.css:61` | `color` | `.input::placeholder` |
| `components/ui/Input/Input.module.css:96` | `color` | `.input:disabled,.input:read-only` |
| `components/ui/Input/Input.module.css:145` | `color` | `.leftIconContainer,.rightIconContainer` |
| `pages/auth.scss:22` | `color` | `.auth-split-screen > input::placeholder` |
| `pages/components/RightPanel/RightPanel.scss:649` | `color` | `.scroll-to-top-btn` |
| `pages/components/menu/menu.scss:112` | `color` | `.dropdown > div.item > &.disabled` |
| `pages/components/menu/menu.scss:117` | `color` | `.dropdown > div.item > &.disabled > > .bi,    > i` |
| `pages/components/navbar.scss:537` | `color` | `.nav-container .content > & label.disabled .bi` |
| `pages/components/navbar.scss:636` | `color` | `.nav-container .content.context-menu ul > >li > &:hover, &:focus-within > >label > &.disabled` |
| `pages/components/navbar.scss:1846` | `color` | `.appbar-tab > &__close` |
| `pages/components/navbar.scss:2052` | `color` | `.new-document > &__chevron` |
| `pages/dashboard.scss:546` | `color` | `.legenda .disabled` |
| `pages/dashboard.scss:920` | `color` | `.leftbar > .menu-header > .bi-chevron-down,    .bi-chevron-right` |
| `pages/dashboard.scss:1205` | `color` | `.leftbar > .item--muted` |
| `styles/style.scss:82` | `color` | `.input > &:disabled` |
| `styles/style.scss:88` | `color` | `.input > &::placeholder` |
| `styles/style.scss:935` | `color` | `.login > & input::placeholder` |

#### dubbi — 7 siti

| file:riga | proprieta' | selettore |
|---|---|---|
| `components/GlobalSearch/GlobalSearch.scss:97` | `color` | `.global-search .shortcut-hint > kbd` |
| `components/Jodie/JodieWindow.css:2584` | `color` | `.jodie-inspector-value-expandable` |
| `components/TreeViewSidebar/tree-view-sidebar.scss:1803` | `color` | `.tree-edge-marker,.tree-stack-marker` |
| `pages/components/RightPanel/RightPanel.scss:753` | `color` | `.group-item-name` |
| `pages/components/menu/menu.scss:100` | `color` | `.dropdown > div.item > > span.keystroke` |
| `pages/components/style.scss:228` | `color` | `span.project-link > span ~ span` |
| `pages/dashboard.scss:909` | `color` | `.leftbar > .menu-header > h1` |

#### altro — 41 siti

| file:riga | proprieta' | selettore |
|---|---|---|
| `components/Jodie/JodieWindow.css:627` | `background` | `.jodie-typing-indicator span` |
| `components/Jodie/JodieWindow.css:984` | `background` | `.jodie-messages::-webkit-scrollbar-thumb:hover` |
| `components/Jodie/SettingsModal.css:587` | `background` | `.jodie-settings-body::-webkit-scrollbar-thumb:hover` |
| `components/contextMenu/ContextMenu.scss:159` | `border` | `.edit-panel-container > &>.edit-panel > & .properties-tab > & .item` |
| `components/contextMenu/ContextMenu.scss:182` | `background` | `.edit-panel-container > &>.edit-panel > &>.close` |
| `components/editors/console.scss:23` | `border-top` | `.group.result-container > & .output-row:first-child` |
| `components/editors/console.scss:24` | `border-left` | `.group.result-container > & .output-row:first-child` |
| `components/editors/console.scss:25` | `border-right` | `.group.result-container > & .output-row:first-child` |
| `components/editors/console.scss:32` | `border-left` | `.group.result-container > .output-row` |
| `components/editors/console.scss:33` | `border-right` | `.group.result-container > .output-row` |
| `components/editors/console.scss:39` | `border-left` | `.group.result-container > .output-row:last-child` |
| `components/editors/console.scss:40` | `border-right` | `.group.result-container > .output-row:last-child` |
| `components/editors/console.scss:41` | `border-bottom` | `.group.result-container > .output-row:last-child` |
| `components/editors/console.scss:124` | `border` | `.console > .console-terminal textarea` |
| `components/editors/info.scss:384` | `border` | `.node-editor > .object-state` |
| `components/forEndUser/color.scss:563` | `outline` | `.palette-row > .color-suggestion` |
| `components/forEndUser/control.scss:54` | `border-right` | `div.jjodel-control > & .control-header` |
| `components/forEndUser/control.scss:75` | `border-left` | `div.jjodel-control > & .control-widget:first-of-type` |
| `components/forEndUser/control.scss:123` | `border` | `div.jjodel-control .control-slider:hover > & ::-webkit-slider-thumb` |
| `components/forEndUser/control.scss:149` | `background-color` | `div.jjodel-control .control-slider input[type="range"]` |
| `components/forEndUser/control.scss:171` | `border` | `div.jjodel-control .control-slider ::-webkit-slider-thumb` |
| `components/forEndUser/control.scss:211` | `background-color` | `div.jjodel-control div.toggle` |
| `components/forEndUser/control.scss:280` | `border-right` | `div.control-notification > & .control-header` |
| `components/forEndUser/control.scss:314` | `background-color` | `.zoom > & > .zoom-in, .zoom-out, .zoom-reset` |
| `components/forEndUser/control.scss:349` | `background-color` | `.jjodel-panel` |
| `components/forEndUser/control.scss:424` | `background-color` | `.jjodel-panel > & .panel-content > &.debug` |
| `components/forEndUser/control.scss:449` | `background-color` | `.jjodel-panel > & .panel-content > & button` |
| `components/forEndUser/toggle.scss:49` | `background-color` | `div.toggle > input[type="checkbox"] ~ label` |
| `components/forEndUser/toggle.scss:50` | `border` | `div.toggle > input[type="checkbox"] ~ label` |
| `components/forEndUser/tooltip.scss:78` | `background` | `.tooltip-wrapper > &> .dark *` |
| `components/forEndUser/tooltip.scss:79` | `border` | `.tooltip-wrapper > &> .dark *` |
| `components/metrics/metrics.scss:96` | `color` | `.metrics-panel > & hr` |
| `components/widgets/widgets.scss:78` | `background-color` | `.toggle .toggle-label` |
| `pages/components/RightPanel/RightPanel.scss:411` | `background-color` | `.timeline-dot` |
| `pages/components/catalog/catalog.scss:864` | `background-color` | `.dashboard-container .project-list > input[type=text]:focus` |
| `pages/components/catalog/catalog.scss:875` | `background-color` | `.dashboard-container .project-list > textarea` |
| `pages/components/navbar.scss:1876` | `border-color` | `.appbar-tabs__overflow-btn > &:hover` |
| `pages/dashboard.scss:158` | `background-color` | `.project-version` |
| `pages/dashboard.scss:555` | `background-color` | `project-card .tip` |
| `styles/style.scss:316` | `border` | `.properties-tab > .object-state` |
| `styles/style.scss:423` | `background` | `.switch,input[type='checkbox'].switch > &:disabled > &::before` |

#### alias — 12 siti

| file:riga | proprieta' | selettore |
|---|---|---|
| `components/abstract/style.scss:11` | `--accent-50` | `body` |
| `components/abstract/style.scss:21` | `--bg-4` | `body` |
| `components/abstract/style.scss:24` | `--disabled` | `body` |
| `components/abstract/style_ap.scss:11` | `--accent-50` | `body` |
| `components/abstract/style_ap.scss:20` | `--bg-4` | `body` |
| `components/abstract/style_ap.scss:23` | `--disabled` | `body` |
| `components/dock/DockManagerStyles.scss:6` | `--accent-50` | `.dock-tab` |
| `components/dock/DockManagerStyles.scss:20` | `--disabled` | `.dock-tab` |
| `components/widgets/widgets.scss:10` | `--neutral` | `.toggle` |
| `pages/components/Edit/edit.scss:76` | `--neutral` | `div.edit.checkbox` |
| `pages/components/style.scss:14` | `--bg-4` | `.nav-container, .catalog-container, .context-menu` |
| `styles/variables.scss:46` | `--color-disabled` | `body` |

#### morto — 2 siti

| file:riga | proprieta' | selettore |
|---|---|---|
| `components/editors/info-improvements.scss:913` | `color` | `.props-header__badge` |
| `pages/dashboard.scss:1248` | `color` | `.text-gray` |

#### commentato — 2 siti

| file:riga | proprieta' | selettore |
|---|---|---|
| `styles/style.scss:297` | `??` | `(top level)` |
| `styles/style.scss:477` | `??` | `(top level)` |

#### distribuzione per file

| file | usi | caption | subtle | altro | alias | dubbi | morto | commentato |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `pages/dashboard.scss` | 12 | 5 | 3 | 2 | 0 | 1 | 1 | 0 |
| `components/forEndUser/control.scss` | 11 | 0 | 0 | 11 | 0 | 0 | 0 | 0 |
| `components/TreeViewSidebar/tree-view-sidebar.scss` | 9 | 5 | 3 | 0 | 0 | 1 | 0 | 0 |
| `components/editors/console.scss` | 9 | 0 | 0 | 9 | 0 | 0 | 0 | 0 |
| `components/abstract/style.scss` | 7 | 0 | 4 | 0 | 3 | 0 | 0 | 0 |
| `components/abstract/style_ap.scss` | 7 | 0 | 4 | 0 | 3 | 0 | 0 | 0 |
| `pages/components/RightPanel/RightPanel.scss` | 7 | 4 | 1 | 1 | 0 | 1 | 0 | 0 |
| `styles/style.scss` | 7 | 0 | 3 | 2 | 0 | 0 | 0 | 2 |
| `components/Jodie/JodieWindow.css` | 6 | 2 | 1 | 2 | 0 | 1 | 0 | 0 |
| `components/editor-v2/sim/simulation-panel.scss` | 5 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| `pages/components/navbar.scss` | 5 | 0 | 4 | 1 | 0 | 0 | 0 | 0 |
| `styles/diagram.scss` | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/GlobalSearch/GlobalSearch.scss` | 4 | 0 | 3 | 0 | 0 | 1 | 0 | 0 |
| `components/NotificationCenter.scss` | 4 | 3 | 1 | 0 | 0 | 0 | 0 | 0 |
| `pages/components/menu/menu.scss` | 4 | 1 | 2 | 0 | 0 | 1 | 0 | 0 |
| `components/JjodieWidget/jjodie-widget.scss` | 3 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/import/ImportSummaryModal.scss` | 3 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/ui/Input/Input.module.css` | 3 | 0 | 3 | 0 | 0 | 0 | 0 | 0 |
| `pages/auth.scss` | 3 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| `pages/components/catalog/catalog.scss` | 3 | 1 | 0 | 2 | 0 | 0 | 0 | 0 |
| `pages/components/project-card.scss` | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| `pages/components/style.scss` | 3 | 1 | 0 | 0 | 1 | 1 | 0 | 0 |
| `common/error.scss` | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/Jodie/SettingsModal.css` | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| `components/Toast/toast.scss` | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/contextMenu/ContextMenu.scss` | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `components/dock/DockManagerStyles.scss` | 2 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| `components/dock/tabs-overflow-menu.scss` | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/editors/info.scss` | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| `components/forEndUser/toggle.scss` | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `components/forEndUser/tooltip.scss` | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `components/ui/PathBuilder/PathBuilder.module.css` | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/widgets/widgets.scss` | 2 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| `pages/tokenPreview.scss` | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/colorScheme/defaultColorScheme.scss` | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/editors/EditorToolbar.scss` | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/editors/info-improvements.scss` | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| `components/forEndUser/color.scss` | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `components/metrics/metrics.scss` | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `components/ui/ColorPicker/ColorPicker.module.css` | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/ui/HelpText/HelpText.module.css` | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/ui/ListEditor/ListEditor.module.css` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/viewParenting/viewParenting.scss` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `pages/components/Edit/edit.scss` | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| `styles/variables.scss` | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |

---

## 4. Censimento B — dove le due famiglie di bordo si incontrano

### 4.1 La coesistenza non e' dove il conteggio la metteva

**CORREZIONE di una premessa dell'Emendamento 1.** L'Emendamento dice che i due file dove le due
famiglie coesistono sono `info-improvements.scss` e `properties-with-tree-view.scss`. A livello di
file e' vero solo per il primo: l'unica occorrenza di `--color-border-primary` in
`properties-with-tree-view.scss` sta a riga **869**, dentro un commento, in un blocco marcato
`// TODO: cleanup — no longer rendered since rail arc 1 (2026-08-10)`:

```scss
border-bottom: 1px solid #f1f5f9; // var(--color-border-primary);
```

Il token e' commentato **e** la regola che lo conterrebbe non e' piu' resa: `.tree-view-panel-header`
non compare in nessun `.tsx` (controllo positivo sulla stessa forma di ricerca:
`props-header__glyph` da' due occorrenze, una SCSS e una in `Info.tsx:1040`).

Distribuzione vera delle occorrenze **vive**:

| foglio | `--color-border-primary` | `--color-panel-border` |
|---|---:|---:|
| `info-improvements.scss` | **3** (righe 467, 872, 914) | **1** (riga 1392) |
| `properties-with-tree-view.scss` | **0** | **17** |

E delle tre di `info-improvements.scss`, quella a riga **914** e' sul `.props-header__badge` mai
reso (§3.3). Restano **due** dichiarazioni vive che dipingono davvero con `--color-border-primary`
dentro il rail: `.props-header` (872) e `.properties-section-header` (467).

**La coesistenza vera non e' fra due file: e' fra due fogli che vestono lo stesso sottoalbero.**
`PropertiesWithTreeView.tsx:515` monta il contenitore `.properties-with-tree-view--rail` e alla riga
`634` ci rende dentro `<Info>`, che a `Info.tsx:1039` emette `.props-header`. Il foglio del rail
dipinge il contenitore, il foglio dell'inspector dipinge il contenuto, e le due famiglie finiscono
a pochi pixel l'una dall'altra.

### 4.2 La misura in pagina, ed e' il risultato che conta

Sonda `_tmp_censusB.ts`, viewport 1440x900, progetto nuovo con tab metamodello aperta e un nodo
selezionato. Colore effettivamente dipinto e rettangolo, nei due regimi chiari:

| elemento | famiglia | rettangolo (x, y, w, h) | regime A | regime B (`data-theme="light"`) |
|---|---|---|---|---|
| `.rail-header` | panel-border | 1041, **91**, 399x44 | `rgb(226,232,240)` | `rgb(226,232,240)` |
| `.tree-search` | panel-border | 1041, **135**, 399x41 | `rgb(226,232,240)` | `rgb(226,232,240)` |
| `.tree-view-panel-container` | panel-border | 1041, **135**, 399x392 | `rgb(226,232,240)` | `rgb(226,232,240)` |
| `.rail-header__btn` | panel-border | 1310, 100, 26x26 | `rgb(226,232,240)` | `rgb(226,232,240)` |
| **`.props-header`** | **border-primary** | 1041, **527**, 399x52 | `rgb(226,232,240)` | **`rgb(203,213,225)`** |
| `.properties-node-section__rule` | panel-border | 1115, **826**, 313x1 | `rgb(226,232,240)` | `rgb(226,232,240)` |

**Si incontrano, e in modo massimo.** Cinque linee impilate nella stessa colonna larga 399px, da
y=91 a y=826, e quella dell'altra famiglia sta **in mezzo**, a y=527, con quattro sorelle sopra e
una sotto.

E qui sta il risultato che riformula la domanda. **In regime B il gradino c'e' gia' oggi.**
`.props-header` dipinge `rgb(203,213,225)` mentre le sue cinque vicine dipingono `rgb(226,232,240)`,
adesso, senza che nessun arco sia stato consegnato. Chi ha scelto «Light» nelle impostazioni vede
gia' la linea di mezzo piu' scura delle altre; chi non ha mai aperto Appearance no.

Segue che la consegna dell'arco 5 **non introduce il difetto: lo estende dal regime B al regime A**.
E che la verifica visiva di D-UI-11, fatta in regime A, non poteva vederlo: in regime A le due
famiglie hanno lo stesso valore, e infatti lo hanno ancora.

In regime scuro le due famiglie sono gia' separate e in modo piu' netto:
`--color-border-primary` vale `rgba(255,255,255,0.08)`, `--color-panel-border` vale `#334155`.

**Copertura dichiarata mancante**: `.jj-conformance-bar`, `.properties-section-header`,
`.jj-flags__rule` e `.rail-focusbar__back` non erano presenti in nessuno degli stati che la sonda e'
riuscita a costruire (`querySelectorAll` = 0). Il tentativo di aprire una tab `model_*` ha premuto
il `+ New` della sezione Models ma la banda `Conforms to` non e' comparsa. Per quei quattro la
coesistenza e' argomentata staticamente — stesso foglio, stesso contenitore — e **non misurata**.

### 4.3 I letterali, che sono la stessa famiglia di difetto

Nei due fogli, occorrenze vive dei due grigi scritti a mano:

| foglio | `#e2e8f0` | `#cbd5e1` |
|---|---:|---:|
| `info-improvements.scss` | **14** (12 bordi, 1 background, 1 color) | **10** (6 bordi, 2 background, 2 color) |
| `properties-with-tree-view.scss` | 4, di cui 2 bordi (una e' `$pc-slate-200`) | 3, di cui 0 bordi (una e' `$pc-slate-300`) |

Diciotto bordi scritti a mano nei due valori esatti che le due famiglie di token stanno per
separare, e sedici di quei diciotto in un foglio solo. Le due scale che D-UI-13 vuole distinguere
esistono gia' li' dentro, ma come letterali, dove nessun token le governa. `properties-with-tree-view.scss`
tiene perfino le due variabili SCSS affiancate, `$pc-slate-200: #e2e8f0` e `$pc-slate-300: #cbd5e1`,
righe 310 e 311.

---

## 5. Censimento C — i sedici nomi solo-light

### 5.1 L'elenco, ricavato e non copiato

Insieme dei nomi dichiarati da `_colors-light.scss` meno quelli dichiarati da `_colors-dark.scss`:
**199 - 183, differenza 16**, e i sedici sono esattamente quelli dell'Emendamento, nome per nome.
L'elenco regge. Nell'altro verso la differenza e' **zero**: `_colors-dark.scss` non dichiara nulla
che il file chiaro non dichiari.

Un dettaglio che il nome nasconde: i quattro `--gradient-card|-hover|-panel|-sidebar` vengono da
`_colors-light.scss`, non da `_gradients.scss`, che dichiara un'altra famiglia
(`--gradient-primary`, `--gradient-start`, `--gradient-hover-start`, ...) e non e' in questione.

### 5.2 Usi vivi

| nome | usi vivi | file |
|---|---:|---|
| `--color-border-focus` | 6 | `toast.scss`, `viewParenting.scss`, `ImportSummaryModal.scss` |
| `--color-text-disabled` | 4 | `_buttons.scss`, `Textarea.module.css`, `Select.module.css`, `viewParenting.scss` |
| `--color-bg-active` | 3 | `_buttons.scss` |
| `--color-error-bg` | 1 | `error.scss` |
| `--color-info-bg` | 1 | `viewapplyto.scss` |
| `--color-text-placeholder` | 1 | `JodieWindow.css` |
| `--color-interactive-active` / `-default` / `-disabled` / `-hover` | **0** | — |
| `--color-success-bg`, `--color-warning-bg` | **0** | — |
| `--gradient-card` / `-hover` / `-panel` / `-sidebar` | **0** | — |

**Nove nomi su sedici non hanno nemmeno un consumatore.** Sedici usi vivi in tutto. `--color-success-bg`
a zero conferma dall'altro lato quello che la discovery del mattino aveva misurato: la banda
`Conforms to` porta il letterale `#f0fdf4` proprio perche' il token non e' mai stato usato.

### 5.3 Che cosa risolvono in dark, misurato

Letti in pagina su `#/allProjects`, senza progetto aperto, nei tre regimi:

| nome | A (nessun attributo) | B (`light`) | C (`dark`) |
|---|---|---|---|
| `--color-bg-active` | `#e2e8f0` | `#e2e8f0` | `#e2e8f0` |
| `--color-border-focus` | `#06b6d4` | `#64748b` | `#06b6d4` |
| `--color-error-bg` | `#fef2f2` | `#fef2f2` | `#fef2f2` |
| `--color-info-bg` | `#eff6ff` | `#eff6ff` | `#eff6ff` |
| `--color-interactive-active` | `#0f172a` | `#0f172a` | `#0f172a` |
| `--color-interactive-default` | `#334155` | `#334155` | `#334155` |
| `--color-interactive-disabled` | `#94a3b8` | `#94a3b8` | `#94a3b8` |
| `--color-interactive-hover` | `#1e293b` | `#1e293b` | `#1e293b` |
| `--color-success-bg` | `#f0fdf4` | `#f0fdf4` | `#f0fdf4` |
| `--color-text-disabled` | `#94a3b8` | `#94a3b8` | `#94a3b8` |
| `--color-text-placeholder` | `#64748b` | `#64748b` | `#64748b` |
| `--color-warning-bg` | `#fffbeb` | `#fffbeb` | `#fffbeb` |
| `--gradient-card` | `linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)` | idem | idem |
| `--gradient-hover` | `linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)` | idem | idem |
| `--gradient-panel` | `linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)` | idem | idem |
| `--gradient-sidebar` | `linear-gradient(180deg, #f1f5f9 0%, #e9eff6 100%)` | idem | idem |

**Nessuno dei sedici e' vuoto in dark: quindici portano il valore chiaro dentro il tema scuro**, e
il sedicesimo (`--color-border-focus`) risolve al ciano di `tokens.css`, che e' la collisione gia'
tolta dalla serie. Il meccanismo e' `_colors-light.scss:75-76`, `:root, :root[data-theme="light"]`:
un blocco solo dalla riga 75 alla 379, quindi il ramo `:root` nudo resta valido anche quando
l'attributo dice `dark`. Non e' un buco che lascia la stringa vuota, e' un tema chiaro che non si
spegne.

Per lo smistamento del testo la conseguenza e' precisa: i 43 siti `subtle` finirebbero su
`--color-text-disabled`, che in dark vale **`#94a3b8`**, cioe' un grigio chiaro su fondo scuro. E'
esattamente il difetto che l'Emendamento 1 dice di non fabbricare mentre se ne chiude uno accanto.

### 5.4 La trappola di `body`, verificata

Il prompt avverte che l'assenza su `:root` non significa stringa vuota, perche' altri sistemi
dichiarano su `body` e vincono per ereditarieta'. Verificato per costruzione e misurato:

| nome | letto su `:root` | letto su un discendente di `<body>` |
|---|---|---|
| `--neutral` | *(vuoto)* | `#475569` in A, `#334155` in B, `#a0a0a0` in C |
| `--color-disabled` | *(vuoto)* | `#94a3b8` in A, `#475569` in B, `#606060` in C |

Una misura presa solo su `document.documentElement` avrebbe riportato «non dichiarato» per due nomi
che dipingono. Nessuno dei sedici del censimento C e' pero' in questo caso: `variables.scss`,
`_form-system.scss` e `_themes.scss` non ne dichiarano nessuno (controllo positivo sulla stessa
forma di ricerca: gli stessi comandi trovano `--neutral` e `--color-disabled` in `variables.scss`).
`_themes.scss` genera i suoi 91 nomi da mappe SCSS con `--#{$name}`, ma il vocabolario e' un altro
(`--text-primary`, `--border-subtle`, `--canvas-bg`): nessuna collisione con i sedici.

---

## 6. Difetti incidentali, trovati per strada e non toccati

Nessuno di questi e' in perimetro. Sono elencati perche' un censimento che li vede e non li scrive
li fa ritrovare a qualcun altro fra un mese.

1. **`--color-text-tertiary-dark` non esiste.** `EditorToolbar.scss:166` lo usa con fallback
   `#6B7280`, che quindi dipinge sempre. Un nome mai dichiarato, non un uso del token censito.
2. **`.text-gray` e' una regola morta.** `pages/dashboard.scss:1247-1249`, zero consumatori nel
   repo (controllo positivo: `project-link` da' 6 occorrenze, `leftbar` compare in cinque file fra
   cui due `.tsx`).
3. **`.props-header__badge` e' una regola morta**, `info-improvements.scss:903-915`, gia' nota e
   documentata in `properties-with-tree-view.scss:373-378`. Porta due dei token in questione, uno
   per famiglia, su righe adiacenti.
4. **`widgets.scss:90` e' invalida**: `border: 2px border var(--neutral)` — `border` non e' uno
   stile di linea. Lettura della specifica, non misura.
5. **Tre `CHIP: React.CSSProperties`** identici (`FieldCompartmentListEditor.tsx:62`,
   `FieldSegmentEditor.tsx:13`, `LabelEntryEditor.tsx:15`) accoppiano `--color-text-tertiary` e
   `--color-border-primary` nello stesso oggetto: cambiano su **due** archi diversi.
6. **`styles/tokens/README.md:77`** documenta `--color-text-tertiary` come «Placeholders, disabled»,
   mentre `_colors-light.scss:100` lo commenta «Labels, captions». Il README descrive la scala di
   `tokens.css`, il file descrive la propria. Una delle due va corretta quando lo smistamento e'
   deciso.
7. **`menu.scss:375`** porta gia' un commento sul contrasto: «`--color-text-tertiary` (#606060) su
   #1e293b sta a ~2.2:1». Qualcuno aveva gia' misurato il problema del §3.4, in dark, e l'ha
   lasciato scritto li'.
8. **Due fogli quasi gemelli**, `components/abstract/style.scss` e `style_ap.scss`, portano le stesse
   sette occorrenze a poche righe di distanza. Non e' in perimetro stabilire quale sia vivo.

---

## 7. Che cosa questo censimento cambia rispetto all'Emendamento 1

1. **Lo smistamento del testo non tocca il rail.** L'unico sito nei due fogli e' morto. L'area
   verificata a occhio non e' in gioco nell'arco 4.
2. **La coesistenza dei bordi e' peggio di come era descritta, ma per un motivo diverso.** Non e'
   una questione di due file: e' una linea di una famiglia in mezzo a cinque dell'altra, dentro la
   stessa colonna, misurata.
3. **Il gradino dei bordi esiste gia' oggi, in regime B.** L'arco 5 non lo crea. Lo estende al
   regime A, cioe' lo rende visibile anche a chi non ha mai aperto Appearance. Vale, con gli stessi
   numeri, per il testo: `--color-text-tertiary` in regime B **vale gia' `#475569`**, che e' la
   destinazione dello smistamento.
4. **Il buco dark non e' un buco: e' un tema chiaro che non si spegne.** Quindici nomi su sedici
   portano il valore chiaro in dark. Il lavoro dell'arco 2 e' dare un valore scuro, non riempire un
   vuoto, e nove di quei sedici oggi non hanno nemmeno un consumatore.

---

## 8. Domande aperte per Alfonso

1. **I quattro dati dipinti col grigio del cromo** (`.group-item-name`, `.jodie-inspector-value-expandable`,
   `span.project-link > span ~ span`, l'`h1` occhiello della leftbar). Un dato che si legge va in
   `caption` anche quando il progetto lo ha voluto smorzato, o il grigio piu' chiaro e' una scelta
   di gerarchia da conservare?
2. **Le tre scorciatoie rese come cromo** (`span.keystroke`, `kbd`, e il marker della tree). Testo
   che si legge ma non si vuole leggere: `caption` o `subtle`?
3. **Le sedici icone come gruppo.** Il criterio le manda tutte in `subtle`. Confermi il gruppo, o
   alcune (il chevron della leftbar, la lente della ricerca) devono restare leggibili quanto la loro
   etichetta?
4. **La scala dei bordi, alla luce del §4.2.** Il gradino c'e' gia' in regime B. Le opzioni non sono
   piu' «introdurlo o no» ma: (a) estenderlo al regime A, cioe' consegnare e accettare la linea di
   mezzo piu' scura; (b) portare `.props-header` e `.properties-section-header` su
   `--color-panel-border`, che chiude D-UI-11 anche in regime B e toglie del tutto la questione dal
   rail; (c) lasciare com'e'. La (b) non e' nell'ordine emendato ed e' una decisione nuova.
5. **I 41 siti in cui un token `text-*` dipinge sfondi e bordi.** Arco a parte, oppure si lasciano?
   Non hanno una destinazione dentro lo smistamento.
6. **I quattordici fallback `#94a3b8`.** Si riallineano nello stesso commit dello smistamento, o si
   lasciano come sono, inerti e falsi?
7. **I nove nomi solo-light senza consumatori.** L'Emendamento dice di coprire l'insieme completo,
   per la ragione di D-UI-10. Vale anche per i quattro `--gradient-*`, che nessuno usa e che in dark
   dovrebbero diventare tutt'altro?

---

## 9. Hard stop

Fase 1 chiusa. Nessuna modifica proposta, nessun edit a file di codice o di stile. L'arco 4 non
parte senza la risposta alle domande 1, 2 e 3; l'arco 5 non parte senza la 4.
