# Discovery — Fase 0 dell'arco «rail destro»

**Documento prompt**: `2026-08-10 16:30`
**Data di esecuzione**: 2026-08-10
**Tipo**: discovery read-only. Nessuna modifica sotto `frontend/src/`.
**HEAD al momento dell'esecuzione**: `569f78735` (branch `alfonso-frontend-jjtl`)
**Ratifiche a monte**: R-RAIL-1..R-RAIL-5 + corollari C1.1, C1.2, C3.1, C3.2, C3.3,
C5.1, C5.2, C5.3 (Alfonso, 2026-08-10). Non rimesse in discussione qui.

---

## 0. Obiettivo e esito in una pagina

Sette accertamenti (D1..D7) a supporto del redesign del rail destro, preset `2a`
(«Adaptive rail»). Nessuna proposta di implementazione: il documento accerta e misura.

**I cinque fatti che cambiano il piano.**

1. **Slice C è tutta a HEAD locale e non è su origin** (D1). I cinque commit esistono qui
   con hash diversi da quelli citati nel checkpoint. Il working tree è **pulito**, quindi
   il commit di questa Fase 0 è ammesso dal vincolo del prompt. Il portale header di
   `ViewData.tsx` — che il prompt dava per da ritirare — **è già ritirato**.
2. **Non c'è un sistema di token, ce ne sono tre** (D2), e nel tema di default il
   perdente della cascata è quello che CLAUDE.md §7.2 dichiara «single source of truth».
   Peggio: **quale dei due vince dipende dal fatto che l'utente abbia mai toccato il
   theme toggle**. La regola per un componente nuovo **non è deducibile dal codice**:
   è una decisione per la chat.
3. **Il buco di token è più piccolo del temuto sui colori e più grande sulle altezze**
   (D3): 35 valori su 56 hanno un token, 14 sono `snap`, 7 sono `nuovo`. Il raggio 6px
   *esiste* (`--radius-base`, in `tokens.css`, non nella scala SCSS). Le altezze di
   controllo del design (26/28/30/34/44) non hanno scala di appoggio: quella esistente
   parte da 32 e sale di 8.
4. **La barra di selezione che il design vuole reintrodurre è stata rimossa apposta**
   (D3/D6): `tree-view-sidebar.scss:1744-1746` documenta la rimozione della barra cyan
   (Fase 2 C1, 2026-07-28) e lascia `--color-selection-bar` **orfano con un TODO di
   ritiro**. Il design chiede `inset 2px 0 0 var(--color-selection-bar)`, cioè
   esattamente il ritorno di ciò che è stato tolto. Decisione per Alfonso.
5. **Il tree ha quasi tutti i dati che il design gli chiede** (D5) — suffisso di tipo,
   corsivo astratto, filtro, conteggio dei match — ma **il badge lettera non esiste più**
   (sostituito da glifi Bootstrap il 2026-07-28) e **il conteggio totale non filtrato
   («16 items») non esiste**: oggi si vede solo il numero dei match, e solo a filtro attivo.

**Correzioni alla tabella delle ancore del prompt** (§5 del prompt, verificata su
`abc0182`, riverificata qui su `569f78735`): tre voci sono **false a HEAD**. Dettaglio in
§8.

---

## 1. File letti

Lettura integrale:

- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (652 righe)
- `frontend/src/components/editors/Info.tsx` (1415 righe)
- `frontend/src/components/editors/views/ViewData.tsx` (294 righe)
- `frontend/src/common/entityMeta.ts` (270 righe)
- `frontend/src/styles/tokens.css` (293 righe)
- `frontend/src/styles/tokens/index.scss` (158), `_colors-light.scss` (355),
  `_radius.scss` (55), `_shadows.scss` (91), `_typography.scss` (149),
  `_spacing.scss` (93), `_transitions.scss` (166)
- `frontend/src/styles/variables.scss` (116)
- `frontend/src/components/ModeSystem/ModeToggle.tsx` (52)
- `frontend/src/hooks/useInterfaceMode.ts`
- `frontend/index.html`

Lettura parziale / mirata:

- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (2357 righe — righe
  38-44, 95-130, 195-420, 495-560, 590-720, 740-770, 800-820, 1540-1570, 1740-1810,
  1836-1880)
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (1-40, 1670-1800,
  1900-1930, 2020-2035)
- `frontend/src/contexts/TreeViewPanelContext.tsx` (1-100, 310-350)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (120-215)
- `frontend/src/App.tsx` (1-30), `frontend/src/App.scss` (1-30),
  `frontend/src/index.scss` (1-40), `frontend/src/index.tsx` (import list)
- `frontend/src/events/registry.ts` (voci `TOGGLE_TREE_VIEW`, `PROPERTIES_PIN_VIEW`,
  `INTERFACE_MODE_CHANGE`)
- `frontend/src/pages/components/Dashboard.tsx` (righe 38, 627)
- `frontend/dist/assets/index-C-yuxLjX.css` (bundle di build del 10/8 15:30 — usato come
  oracolo della cascata, vedi D2)

Non letti perché fuori perimetro dichiarato: i quattro pannelli di authoring
(`VertexAuthoringPanel`, `RowAuthoringPanel`, `EdgeAuthoringPanel`, `EnableIRPanel`) —
R-RAIL-1 li dichiara intoccabili e la Fase 0 non ne ha bisogno oltre al loro punto
d'innesto, che sta in `ViewData.tsx` ed è stato letto.

**`docs/redesign/rail/` non esiste.** I due file del design (`README.md`,
`Jodel Side Panel.dc.html`) non sono nel repo. Il report si appoggia esclusivamente ai
valori riportati nel prompt, come previsto dalla sua clausola di autocontenimento.

---

## 2. D1 — Stato del working tree e della coda locale

### 2.1 Comandi e output

```
$ git status --short
(vuoto)

$ git branch --show-current
alfonso-frontend-jjtl

$ git fetch && git log origin/alfonso-frontend-jjtl..HEAD --oneline
569f78735 docs: rotate claude-code-log to 20 active entries (ninth batch)
f4e72f88f refactor(properties): drop redundant Toggle labels per Q5 levels (U-7)
a801403ba refactor(properties): FormSection as the single section-title mechanism (U-3)
47603c613 feat(properties): Parent view mirrors the tree, forbidden entries disabled
473813c5f refactor(properties): no back button in either property card header
6b8e91d73 refactor(properties): retire the ViewData header portal (Q4)

$ git log -1 --format='%h %ai %s' origin/alfonso-frontend-jjtl
abc01825c 2026-08-10 10:12:06 +0000 docs: rotate claude-code-log to 20 active entries (eighth batch)
```

### 2.2 Lettura

**Il working tree è pulito.** Nessun lavoro non committato preesistente. Il vincolo del
prompt («se `git status --short` mostra lavoro non committato preesistente, non
committare affatto») **non scatta**: il commit dei due file di docs è ammesso.

**Slice C è interamente a HEAD locale e interamente assente da origin.** La premessa del
prompt («origin non contiene nessun commit di Slice C») è **confermata**; la sua seconda
metà («gli hash `6b8e91d73`, `473813c5f`, `47603c613`, `a801403ba` non esistono nella
storia remota») va precisata: non esistono su **origin**, ma esistono tutti e quattro
**qui, a HEAD locale**, con esattamente quegli hash. Il checkpoint li citava correttamente:
citava hash locali di commit mai pushati.

Stato commit per commit:

| Commit | Hash | A HEAD locale | Su origin |
|---|---|---|---|
| Commit 1 — ritiro portale header ViewData (Q4) | `6b8e91d73` | sì | no |
| — niente back negli header delle due card | `473813c5f` | sì | no |
| — «Parent view» riproduce il nesting del tree | `47603c613` | sì | no |
| Commit 2 — `FormSection` unico meccanismo dei titoli (U-3) | `a801403ba` | sì | no |
| Commit 3 — via le doppie label dei toggle (U-7) | `f4e72f88f` | sì | no |
| rotazione log (nono lotto) | `569f78735` | sì | no |

**Sei commit locali non pushati**, di cui cinque sorgente.

### 2.3 Sovrapposizione di file fra i due archi — e perché non è più un conflitto

Slice C ha toccato, dei file del perimetro rail:

- `PropertiesWithTreeView.tsx` — commit `6b8e91d73` (C-3). Effetto **già applicato**:
  lo slot `properties-panel-header__actions` **non è più un bersaglio di portale**. Oggi
  (`PropertiesWithTreeView.tsx:461-463`) contiene un `<HelpButton helpKey="properties-panel" />`
  reso dall'host. Il commento a `:456-460` documenta la ragione.
- `ViewData.tsx` — commit `6b8e91d73` e `473813c5f`. Il `createPortal` verso
  `.properties-panel-header__actions` **non esiste più nel file**: alle righe
  `:203-225` c'è solo il context row, e il commento `:207-211` spiega il ritiro
  (il lookup era un `document.querySelector` globale con deps vuote, non scoped al
  proprio container e incapace di seguire un remount dell'header).
- `MatchingSection.tsx`, `EnableIRPanel.tsx`, `RowAuthoringPanel.tsx`,
  `EdgeAuthoringPanel.tsx`, `LabelEntryEditor.tsx`, `BadgeListEditor.tsx`,
  `FieldCompartmentListEditor.tsx` — sono i pannelli di authoring, che R-RAIL-1 dichiara
  di NON modificare. Nessuna sovrapposizione con l'arco rail.

**Conseguenza sull'ordine dei due archi.** La domanda «quale dei due tocca per primo
quali file» ha una risposta più semplice del previsto: **Slice C ha già toccato tutto
quello che doveva, e l'arco rail parte da uno stato in cui il portale non c'è più**. Non
c'è quindi un ordinamento da decidere fra due archi in volo: c'è una coda locale di sei
commit non pushati sopra cui l'arco rail si innesta. L'unico rischio residuo è
**operativo, non di merito**: se Slice C venisse riscritta (rebase, amend, squash) dopo
l'inizio dell'arco rail, i commit del rail andrebbero ribasati con essa.

**Ancore del prompt che l'ancora `PropertiesWithTreeView.tsx:459` non regge più.** Il file
è passato da 648 a 652 righe; lo slot `properties-panel-header__actions` è a `:461`, non
a `:459`, e non è più uno slot di portale. Vedi §8.

---

## 3. D2 — Quale sistema di token si consuma

### 3.1 Chi importa cosa, e in quale ordine

Catena di cascata, verificata sugli import reali:

```
index.tsx:6   bootstrap/dist/css/bootstrap.min.css
index.tsx:7   bootstrap-icons/font/bootstrap-icons.css
index.tsx:10  ./index.scss
index.tsx:13  ./App
              │
App.tsx:2     └── ./App.scss
                    │
App.scss:6          ├── ./styles/tokens/index          ← SISTEMA A (SCSS)
App.scss:12         ├── ./styles/components/buttons
App.scss:18         └── ./styles/diagram → ./tokens/index (già risolto)
App.tsx:3     ./styles/view.scss      → ./variables     ← SISTEMA C (legacy, scope `body`)
App.tsx:4..7  ./styles/default-view.scss, classic-object-view.scss,
              style.scss → ./variables, forms.scss
App.tsx:8     ./styles/tokens.css                       ← SISTEMA B (CSS piatto)
```

`styles/tokens/index.scss` importa nell'ordine: `colors-light`, `colors-dark`,
`typography`, `spacing`, `shadows`, `radius`, `transitions`, `z-index`, `gradients`
(`tokens/index.scss:29-53`).

`styles/variables.scss` è importato da `styles/style.scss:1` e `styles/view.scss:6`, ed è
l'unico dei tre a dichiarare su selettore `body` invece che `:root`.

### 3.2 Verifica empirica della cascata

Le posizioni relative sono state misurate sul bundle di build
`frontend/dist/assets/index-C-yuxLjX.css` (10/8 15:30, stesso giorno di HEAD), leggendo
gli offset in byte delle dichiarazioni in conflitto:

| Custom property | `tokens/*.scss` (offset) | `tokens.css` (offset) | Vince nel tema di default |
|---|---|---|---|
| `--color-bg-primary` | `#f8fafc` @ 580809 | `#ffffff` @ 689814 | `tokens.css` → **#ffffff** |
| `--color-bg-secondary` | `#ffffff` | `#f8fafc` | `tokens.css` → **#f8fafc** |
| `--color-text-secondary` | `#334155` @ 581134 | `#475569` @ 689721 | `tokens.css` → **#475569** |
| `--color-text-tertiary` | `#475569` | `#94a3b8` | `tokens.css` → **#94a3b8** |
| `--color-border-primary` | `#cbd5e1` @ 580978 | `#e2e8f0` @ 689939 | `tokens.css` → **#e2e8f0** |
| `--color-border-secondary` | `#d1d9e3` | `#cbd5e1` | `tokens.css` → **#cbd5e1** |
| `--color-border-focus` | `#64748b` | `#06b6d4` | `tokens.css` → **#06b6d4** |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.05)` @ 596702 | `0 1px 3px 0 …, 0 1px 2px -1px …` @ 691079 | `tokens.css` |
| `--shadow-md/lg/xl` | scala Material-like | scala Tailwind-like | `tokens.css` |
| `--transition-fast` | `var(--duration-fast) var(--ease-out)` @ 599119 | `.15s ease` @ 691621 | `tokens.css` → **ease, non ease-out** |
| `--transition-slow` | `400ms ease-in-out` | `300ms ease` | `tokens.css` |
| `--radius-*` | 0/4/8/12/16/24/9999 | 0/4/6/8/12/16/9999 | valori identici sui nomi comuni |

`tokens.css` è caricato **dopo** `tokens/*.scss` (offset ~689k vs ~580-599k) e dichiara su
`:root` semplice.

### 3.3 Il ribaltamento theme-dipendente

Il blocco SCSS non è su `:root` semplice: `_colors-light.scss:75-76` dichiara

```scss
:root,
:root[data-theme="light"] { … }
```

confermato nel bundle a offset 580809 (`:root,:root[data-theme=light]{--color-bg-primary: #f8fafc;…`).

Ne segue un comportamento a due regimi:

- **Nessun attributo `data-theme` sull'`<html>`** — è il caso di default:
  `frontend/index.html:14-19` scrive l'attributo **solo** se `localStorage.theme` vale
  `'dark'` o `'light'`. Solo il ramo `:root` della lista fa match, specificità (0,1,0),
  pari a quella di `tokens.css`. **Vince l'ultimo dichiarato: `tokens.css`.**
- **`data-theme="light"` presente** — l'utente ha toccato il theme toggle almeno una
  volta. Fa match `:root[data-theme="light"]`, specificità (0,2,0). **Vince
  `tokens/*.scss`.**

Quindi la palette risolta dell'applicazione — sfondo primario, testo secondario, bordi,
ombre, easing delle transizioni — **cambia a seconda che l'utente abbia mai usato il
theme toggle**, senza che nulla nel codice lo dichiari. Non è un'ipotesi: è la lettura
della specificità applicata ai selettori realmente emessi nel bundle.

### 3.4 Il terzo e il quarto sistema

**Sistema C — `variables.scss`, su selettore `body`.** Dichiara `--input-height: 36px`,
`--select-height: 36px`, `--tab-radius: 4px`, oltre a rimappature legacy
(`--color`, `--accent-secondary`, `--danger`, `--bg`, `--gr-1..12`). Selettore `body` =
specificità (0,0,1), **inferiore** a `:root`. Ma il meccanismo non è la cascata: è
l'**ereditarietà**. Per ogni elemento discendente di `<body>`, il valore ereditato è
quello dichiarato sull'antenato più vicino che lo definisce — cioè `body`. Quindi per
tutto il contenuto dell'app **`variables.scss` batte entrambi i sistemi `:root`** sui nomi
che condivide. Caso concreto: `--input-height` vale **36px** ovunque nell'app
(`variables.scss`), non 40px (`_spacing.scss:33`).

**Sistema D — variabili SCSS locali per file.** Numerosi stylesheet di componente
ridichiarano in testa una propria copia dei token come variabili SCSS `$`, con valori che
**divergono** da quelli canonici. Esempio dal file che il rail dovrà consumare,
`tree-view-sidebar.scss:5-41`:

```scss
$color-text-primary: #111418;   // canonico: #0f172a
$color-text-secondary: #6B7280; // canonico: #334155 o #475569
$color-text-tertiary: #9CA3AF;  // canonico: #475569 o #94a3b8
$radius-sm: 4px;  $radius-md: 6px;  $radius-lg: 8px;   // canonico: 4/8/12
$transition-fast: 150ms ease;   $transition-normal: 250ms ease;
$color-model: #7F77DD;  $color-package: #888780;  $color-class: #378ADD;
$color-attribute: #639922;  $color-reference: #D85A30;  $color-enum: #D4537E;
```

Lo stesso pattern (blocco `$`-vars in testa, commentato «Design tokens») è presente in
almeno: `DocumentationTab.scss:32`, `UnifiedSettingsModal.scss:24,33`,
`syntax-error-modal.scss:53,64`, `EnvGenWizardModal.scss:22,31`, `empty.scss:19`,
`nestedView.scss:36,41`.

### 3.5 Deliverable — la regola per un componente nuovo

**Non è deducibile dal codice.** Le condizioni per una risposta univoca non sono
soddisfatte:

1. Due sistemi `:root` sono entrambi vivi, definiscono gli stessi nomi con valori
   diversi, e **quale dei due vince dipende da uno stato utente** (§3.3) — quindi non
   esiste nemmeno un vincitore stabile da cui derivare una regola.
2. Un terzo sistema (`variables.scss`) batte entrambi per ereditarietà su una manciata di
   nomi, incluso `--input-height`, che il rail userebbe.
3. Un quarto pattern (variabili `$` locali) è quello effettivamente adottato dal file
   stilistico più vicino al rail — `tree-view-sidebar.scss` — con valori divergenti dal
   canone.
4. CLAUDE.md §7.2 dichiara `styles/tokens/` «single source of truth» e la regola 28
   vieta le CSS variables nei file di componente. Il codice contraddice entrambe: la
   fonte dichiarata perde la cascata nel tema di default, e il pattern `$`-locale è
   diffuso.

**È una decisione per la chat, non da prendere in autonomia.** Le tre opzioni visibili,
senza raccomandazione:

- (a) consumare `tokens.css` (`var(--color-slate-*)`, `var(--font-size-*)`,
  `var(--radius-base)`) — è il sistema che vince nel tema di default ed è quello con la
  scala più vicina ai valori del design (px, non rem; 11/12/13/14; radius 6);
- (b) consumare `tokens/` (`var(--color-text-primary)`, `var(--space-*)`) — è la fonte
  dichiarata da CLAUDE.md, ma perde la cascata quando l'utente non ha mai toccato il
  tema;
- (c) unificare prima i due sistemi, e solo dopo scrivere il rail.

L'opzione (c) esce dal perimetro dell'arco 1 e va valutata come lavoro a sé.

**Sintassi.** In entrambi i casi `var(--x)`: i token sono CSS custom properties, non
variabili SCSS. Le `$` esistono solo come copie locali (sistema D) e non sono
importabili da altri file (nessun `@use`/`@forward`, nessun file di partial di variabili
condiviso). **File da importare**: nessuno. `tokens/index.scss` è importato una volta da
`App.scss:6` e `tokens.css` una volta da `App.tsx:8`; entrambi dichiarano su `:root`,
quindi sono globali e uno stylesheet nuovo non deve importare niente per usarli. Un
`@import './tokens/index'` in un file di componente **duplicherebbe** l'intero blocco nel
bundle (è il motivo per cui `diagram.scss:6` lo ri-emette).

---

## 4. D3 — Mapping dei valori del design sui token esistenti

Legenda: `token` = esiste, si consuma. `snap` = non esiste, ma esiste un valore vicino
sulla scala (indicato con lo scostamento). `nuovo` = non esiste e non c'è niente di
vicino.

Dove un valore è definito in entrambi i sistemi, la colonna `file:riga` li riporta
entrambi; il consumo effettivo dipende dalla decisione D2.

### 4.1 Colori (15)

| Valore | Token esistente | file:riga | Classe |
|---|---|---|---|
| `#ffffff` | `--color-bg-secondary`, `--color-bg-elevated`, `--color-panel-bg`, `--color-node-bg`, `--color-text-inverse` | `_colors-light.scss:81,83,251,215,103` | `token` |
| `#f8fafc` | `--color-slate-50` / `--color-bg-primary` (SCSS) / `--color-bg-secondary` (CSS) / `$slate-50` | `tokens.css:14,112`; `_colors-light.scss:19,80` | `token` |
| `#fcfdfe` | — | — | `snap` → `#ffffff` (Δ 3/2/1 per canale); il gradino di scala più vicino è `--color-slate-50` `#f8fafc` (Δ 4/3/2) |
| `#f1f5f9` | `--color-slate-100`, `--color-bg-tertiary` (entrambi i sistemi), `$slate-100` | `tokens.css:15,113`; `_colors-light.scss:20,82` | `token` |
| `#eef2f7` | — | unica occorrenza nel repo come letterale: `Jodie/JodieWindow.css:2727` | `snap` → `--color-bg-hover` `#e9eff6` (`$slate-150`), Δ 5/3/1 | 
| `#e2e8f0` | `--color-slate-200`, `--color-border-primary` (CSS), `--color-node-border`, `--color-panel-border`, `$slate-200` | `tokens.css:16,119`; `_colors-light.scss:22,216,253` | `token` |
| `#cbd5e1` | `--color-slate-300`, `--color-border-primary` (SCSS), `--color-border-secondary` (CSS), `$slate-300` | `tokens.css:17,120`; `_colors-light.scss:27,90` | `token` |
| `#94a3b8` | `--color-slate-400`, `--color-text-tertiary` (CSS), `--color-text-disabled`, `$slate-400` | `tokens.css:18,105`; `_colors-light.scss:29,102` | `token` |
| `#64748b` | `--color-slate-500`, `--color-text-placeholder`, `--color-border-focus` (SCSS), `$slate-500` | `tokens.css:19`; `_colors-light.scss:30,101,93` | `token` |
| `#475569` | `--color-slate-600`, `--color-text-secondary` (CSS), `--color-text-tertiary` (SCSS), `$slate-600` | `tokens.css:20,104`; `_colors-light.scss:31,100` | `token` |
| `#334155` | `--color-slate-700`, `--color-accent`, `--color-brand`, `--color-text-secondary` (SCSS), `--color-edge-overlay-default`, `$slate-700` | `tokens.css:21`; `_colors-light.scss:32,118,109,99,233` | `token` |
| `#0f172a` | `--color-slate-900`, `--color-text-primary` (entrambi), `--color-node-text`, `$slate-900` | `tokens.css:23,103`; `_colors-light.scss:34,98,220` | `token` |
| `#e0f7fa` | `--color-selection-bg` | `_colors-light.scss:352` | `token` ✓ confermato |
| `#0891b2` | `--color-selection-bar`; **anche** `--color-cyan-600`; **anche** `ENTITY_META.reference.badgeText` | `_colors-light.scss:353`; `tokens.css:34`; `entityMeta.ts:161` | `token` ✓ confermato — **triplo ruolo**, vedi §4.7 |
| `#22c55e` | `--color-success` (via `$green-500`), `--color-green-500` | `_colors-light.scss:48,152`; `tokens.css:80` | `token` |

**Sottototale colori: 13 `token`, 2 `snap`, 0 `nuovo`.**

Nota su `#ffffff`/`#f8fafc`: i due sistemi li assegnano **a nomi scambiati**
(`--color-bg-primary` è `#f8fafc` in SCSS e `#ffffff` in CSS; `--color-bg-secondary` il
contrario). Consumare il valore per nome semantico è quindi ambiguo; consumarlo via
`--color-slate-50` / letterale bianco no.

### 4.2 Raggi (7)

Scala SCSS `_radius.scss:12-18`: 0 / 4 / 8 / 12 / 16 / 24 / 9999.
Scala CSS `tokens.css:183-189`: 0 / 4 / **6** / 8 / 12 / 16 / 9999 (manca il 24).

| Valore | Token esistente | file:riga | Classe |
|---|---|---|---|
| 4px | `--radius-sm` (entrambi), `--radius-tooltip`, `--tab-radius` | `_radius.scss:13,30,40`; `tokens.css:184` | `token` |
| 6px | **`--radius-base`** | `tokens.css:185` | `token` — **correzione al prompt**: 6 *non* è fuori scala, è nella scala CSS |
| 7px | — | — | `snap` → `--radius-base` 6px (Δ1) o `--radius-md` 8px (Δ1) |
| 9px | — (ma già hardcoded: `border-radius: 9px` sulla pill di selezione del tree) | `tree-view-sidebar.scss:1727` | `snap` → `--radius-md` 8px (Δ1) |
| 10px | — | — | `snap` → `--radius-md` 8px (Δ2) o `--radius-lg` 12px (Δ2) |
| 12px | `--radius-lg` (entrambi), `--radius-card`, `--radius-node` | `_radius.scss:15,27,31`; `tokens.css:187` | `token` |
| 99px | `--radius-full` = `9999px` | `_radius.scss:18`; `tokens.css:189` | `token` — valore letterale diverso, intento identico (pill); indistinguibile su qualunque elemento più basso di 198px |

**Sottototale raggi: 4 `token`, 3 `snap`, 0 `nuovo`.**

La premessa del prompt («quattro dei sette raggi — 6, 7, 9, 10 — cadono fuori scala») è
corretta per la scala SCSS ma **sovrastima di uno**: sono tre (7, 9, 10). Il 6 esiste.

### 4.3 Ombre (4)

**Esiste una famiglia slate-tinted?** Verificato: **no come famiglia di ombre**, **sì come
colore**. `_shadows.scss:14-18,33-37` è costruito interamente su `rgba(0,0,0,·)` in
entrambi i temi, e `tokens.css:194-199` idem. Ma due valori slate-tinted esistono già come
custom property di colore:

- `--color-node-shadow: rgba(15, 23, 42, 0.06)` — `_colors-light.scss:218`
- `--color-accent-subtle: rgba(51, 65, 85, 0.06)` — `_colors-light.scss:124`

Il secondo è **esattamente** il colore dell'anello di focus del design.

| Valore | Token esistente | file:riga | Classe |
|---|---|---|---|
| `0 4px 16px rgba(15,23,42,0.07)` (rail) | — | il più vicino: `--shadow-md` = `0 4px 12px rgba(0,0,0,0.08)` | `snap` → `--shadow-md` (offset Y identico, blur Δ4px, alpha Δ0.01, tinta nero vs slate). `_shadows.scss:34`. Attenzione: nel tema di default `--shadow-md` risolve al valore di `tokens.css:197` (`0 4px 6px -1px …, 0 2px 4px -2px …`), non a quello SCSS |
| `0 12px 32px rgba(15,23,42,0.16)` (popover) | — | il più vicino: `--shadow-lg` = `0 8px 24px rgba(0,0,0,0.12)` | `snap` → `--shadow-lg` (offset Δ4px, blur Δ8px, alpha Δ0.04). `_shadows.scss:35` |
| `0 0 0 3px rgba(51,65,85,0.06)` (anello di focus) | **colore sì**: `--color-accent-subtle`; geometria no | `_colors-light.scss:124`; cfr. `--input-focus-ring-width: 2px`, `tokens.css:253` | `snap` — componibile come `0 0 0 3px var(--color-accent-subtle)`: il colore è `token` esatto, resta da decidere il 3px (il token di ring width vale 2px, Δ1) |
| `0 1px 2px rgba(15,23,42,0.2)` (knob dello switch) | — | il più vicino: `--shadow-sm` SCSS = `0 1px 2px rgba(0,0,0,0.05)` | `snap` → `--shadow-sm` (**geometria identica**, alpha Δ0.15, tinta nero vs slate). `_shadows.scss:33`. Il `--shadow-sm` del tema dark è `rgba(0,0,0,0.3)`, `_shadows.scss:14` |

**Sottototale ombre: 0 `token`, 4 `snap`, 0 `nuovo`.**

Nessuna delle quattro è `nuovo` in senso stretto — tutte hanno un gradino vicino sulla
scala — ma **nessuna è consumabile senza una decisione**, perché in tutti e quattro i casi
la tinta del design (slate) diverge dalla tinta della scala (nero puro).

### 4.4 Tipografia (14 righe)

Scala px in `tokens.css:149-156`; scala rem in `_typography.scss:28-33` (11 / 13 / 15 /
18 / 24 / 32).

| Valore | Token esistente | file:riga | Classe |
|---|---|---|---|
| famiglia sans | `--font-sans` / `--font-family-sans` | `_typography.scss:13`; `tokens.css:143` | `token` |
| famiglia mono | `--font-mono` / `--font-family-mono` | `_typography.scss:16`; `tokens.css:144` | `token` |
| 19px sans | — | fra `--font-size-xl` 18px e `--font-size-2xl` 20px | `snap` (Δ1 in entrambe le direzioni) — `tokens.css:154,155` |
| 14px sans | `--font-size-md` | `tokens.css:152` | `token` (assente dalla scala SCSS) |
| 13px sans | `--font-size-base` / `--text-sm` (0.8125rem) | `tokens.css:151`; `_typography.scss:29` | `token` |
| 12px sans | `--font-size-sm` | `tokens.css:150` | `token` (assente dalla scala SCSS) |
| 11px sans | `--font-size-xs` / `--text-xs` (0.6875rem) | `tokens.css:149`; `_typography.scss:28` | `token` |
| 12px mono | `--font-size-sm` | `tokens.css:150` | `token` |
| 11px mono | `--font-size-xs` | `tokens.css:149` | `token` |
| 10px mono | — | il più basso è 11px | `snap` → `--font-size-xs` (Δ1) |
| peso 500 | `--font-weight-medium` / `--font-medium` | `tokens.css:162`; `_typography.scss:44` | `token` |
| peso 600 | `--font-weight-semibold` / `--font-semibold` | `tokens.css:163`; `_typography.scss:45` | `token` |
| peso 700 | `--font-weight-bold` / `--font-bold` | `tokens.css:164`; `_typography.scss:46` | `token` |
| eyebrow `letter-spacing: 0.08em` | — | `--tracking-wide` / `--letter-spacing-wide` valgono `0.05em` | `snap` (Δ0.03em) — `_typography.scss:67`; `tokens.css:178` |

**Sottototale tipografia: 11 `token`, 3 `snap`, 0 `nuovo`.**

Osservazione: la scala del design (11/12/13/14, px) coincide **esattamente** con
`tokens.css`, e coincide **male** con `_typography.scss` (che ha 11/13/15/18 e non ha né
12 né 14). È un input rilevante per la decisione D2.

Il resto della ricetta eyebrow è coperto: 11px = `--font-size-xs`, peso 600 =
`--font-weight-semibold`, `text-transform: uppercase` non è un token.

### 4.5 Altezze di riga / di controllo (6)

**`_spacing.scss` ha una scala di spaziatura, non di altezze di controllo.** Righe 13-25:
`--space-0..--space-24` (0/4/8/12/16/20/24/32/40/48/64/80/96 px, in rem). Le uniche
altezze sono tre, alle righe 33-35: `--input-height: 40px`, `--input-height-sm: 32px`,
`--input-height-lg: 48px`. `tokens.css:229-231` e `:260-262` ripetono la stessa terna per
input e bottoni (32 / 40 / 48). Non esiste alcun gradino sotto i 32px.

| Valore | Token esistente | file:riga | Classe |
|---|---|---|---|
| 26px (riga del tree) | — | il più vicino è 32px | `nuovo` (Δ6, sotto il pavimento della scala) |
| 28px (multiplicity) | — | il più vicino è 32px | `nuovo` (Δ4, sotto il pavimento della scala) |
| 30px (campo del form, disclosure) | — | `--input-height-sm` / `--button-height-sm` = 32px | `snap` (Δ2) — `tokens.css:229,260`; `_spacing.scss:34` |
| 34px (footer, breadcrumb) | — | 32px (Δ2) oppure 36px di `--select-height` (Δ2) | `snap` (Δ2) — `variables.scss` |
| 36px (filtro) | `--select-height: 36px`; anche `--input-height: 36px` **su `body`** | `variables.scss` (blocco `body`) | `token` — **ma legacy e in conflitto**: `--input-height` è dichiarato 40px in `_spacing.scss:33` su `:root` e 36px in `variables.scss` su `body`; per ereditarietà vince il 36 (§3.4). `--select-height` è invece univoco |
| 44px (header) | — | il più vicino è 40px (`--input-height-base`) | `nuovo` (Δ4) |

**Sottototale altezze: 1 `token`, 2 `snap`, 3 `nuovo`.**

È il gruppo con il buco maggiore, e il buco è strutturale: il design lavora con una scala
di altezze a passo 2 fra 26 e 44, il codice ha tre gradini a passo 8 fra 32 e 48.

### 4.6 Motion (3)

| Valore | Token esistente | file:riga | Classe |
|---|---|---|---|
| 150ms | `--duration-fast` | `_transitions.scss:14` | `token` |
| 250ms | `--duration-normal` | `_transitions.scss:15` | `token` |
| `cubic-bezier(0,0,0.2,1)` | `--ease-out` | `_transitions.scss:26`; `tokens.css:223` (**valore identico nei due sistemi**) | `token` |

**Sottototale motion: 3 `token`, 0 `snap`, 0 `nuovo`.**

L'unico gruppo interamente coperto. Due avvertenze sulle **combinazioni** preconfezionate:

- `--transition-fast` sarebbe `var(--duration-fast) var(--ease-out)`
  (`_transitions.scss:36`) — cioè esattamente 150ms + ease-out — ma nel tema di default è
  sovrascritto da `tokens.css:216` a `150ms ease`. **L'easing corretto va scritto
  esplicitamente.**
- `--transition-normal` (`_transitions.scss:40`) è 250ms + `--ease-in-out`, **non**
  ease-out. Per i 250ms del design serve la coppia esplicita
  `var(--duration-normal) var(--ease-out)`.

### 4.7 Coppie entity (7)

Le coppie del design corrispondono ai campi `badgeBg` / `badgeText` di `ENTITY_META`.
Verifica coppia per coppia:

| Entity | Coppia in `entityMeta.ts` | Riga | Token CSS corrispondente | Classe |
|---|---|---|---|---|
| metamodel (violet) | `#EEEDFE` / `#534AB7` | `:66-67` | `--color-entity-metamodel-bg` / `-fg` — valori identici | `token` (CSS + TS) — `_colors-light.scss:332-333` |
| package (blue) | `#DBEAFE` / `#2563EB` | `:105-106` | `--color-entity-package-bg` / `-fg` — valori identici | `token` (CSS + TS) — `_colors-light.scss:334-335` |
| class (red) | `#FEE2E2` / `#DC2626` | `:114-115` | `--color-entity-class-bg` / `-fg` — valori identici | `token` (CSS + TS) — `_colors-light.scss:336-337` |
| attribute (green) | `#D1FAE5` / `#059669` | `:151-152` | **nessuno** | `nuovo` a livello CSS (il valore esiste solo in TS) |
| reference (cyan) | `#CFFAFE` / `#0891B2` | `:160-161` | **nessuno** | `nuovo` a livello CSS |
| operation (indigo) | `#E0E7FF` / `#4F46E5` | `:169-170` | **nessuno** | `nuovo` a livello CSS |
| enum (amber) | `#FEF3C7` / `#D97706` | `:133-134` | **nessuno** | `nuovo` a livello CSS |

**Sottototale entity: 3 `token`, 0 `snap`, 4 `nuovo`.**

I token `--color-entity-*` esistenti (`_colors-light.scss:332-341`) coprono cinque tipi —
metamodel, package, class, **model**, **viewpoint** — dei quali solo i primi tre sono fra
i sette del design. I quattro tipi di feature (attribute, reference, operation, enum) non
hanno alcuna custom property, pur essendo definiti in `entityMeta.ts` e pur essendo
esattamente quelli che il rail deve badgiare più spesso.

Il commento `entityMeta.ts:10-12` e quello `_colors-light.scss:329-330` dichiarano un
obbligo di sincronia bidirezionale fra i due file; l'obbligo oggi è rispettato sulle tre
coppie presenti, e le altre quattro semplicemente non esistono sul lato CSS.

**Tre palette, non una.** `entityMeta.ts` porta due palette indipendenti per lo stesso
tipo, e il tree ne usa una terza:

| Entity | `badgeBg`/`badgeText` (usata dal design) | `color` (stesso file, `entityMeta.ts`) | `$color-*` locale del tree (`tree-view-sidebar.scss:36-41`) |
|---|---|---|---|
| metamodel | `#EEEDFE` / `#534AB7` violet | `#534AB7` violet ✓ coerente | `$color-model: #7F77DD` |
| package | `#DBEAFE` / `#2563EB` blue | `#f59e0b` **amber** ✗ | `$color-package: #888780` |
| class | `#FEE2E2` / `#DC2626` red | `#0ea5e9` **cyan** ✗ | `$color-class: #378ADD` |
| attribute | `#D1FAE5` / `#059669` green | `#10b981` green ~ coerente | `$color-attribute: #639922` |
| reference | `#CFFAFE` / `#0891B2` cyan | `#8b5cf6` **purple** ✗ | `$color-reference: #D85A30` |
| operation | `#E0E7FF` / `#4F46E5` indigo | `#06b6d4` **cyan** ✗ | — |
| enum | `#FEF3C7` / `#D97706` amber | `#ec4899` **pink** ✗ | `$color-enum: #D4537E` |

Cinque tipi su sette hanno un `color` che appartiene a una famiglia cromatica **diversa**
da quella del proprio badge, e il tree oggi non consuma né l'uno né l'altro: usa la terza
serie. Adottare le coppie del design significa quindi cambiare il colore dei tipi nel
tree, non solo aggiungerne il badge.

**Il doppio (triplo) ruolo di `#0891B2`.** Confermato, e più esteso di quanto segnalato
dal prompt: `#0891B2` è simultaneamente

- `--color-selection-bar` (`_colors-light.scss:353`),
- `ENTITY_META.reference.badgeText` (`entityMeta.ts:161`),
- `--color-cyan-600` (`tokens.css:34`).

Su una riga Reference selezionata, barra di selezione e testo del badge coinciderebbero
di colore. Non è un bug; va deciso consapevolmente. **Ma la premessa è oggi inerte**:
la barra di selezione non è più renderizzata (§6.3), quindi la collisione si
materializzerebbe solo reintroducendola.

### 4.8 Conteggi finali D3

| Gruppo | righe | `token` | `snap` | `nuovo` |
|---|---:|---:|---:|---:|
| Colori | 15 | 13 | 2 | 0 |
| Raggi | 7 | 4 | 3 | 0 |
| Ombre | 4 | 0 | 4 | 0 |
| Tipografia | 14 | 11 | 3 | 0 |
| Altezze | 6 | 1 | 2 | 3 |
| Motion | 3 | 3 | 0 | 0 |
| Coppie entity | 7 | 3 | 0 | 4 |
| **Totale** | **56** | **35** | **14** | **7** |

**35 `token`, 14 `snap`, 7 `nuovo`** su 56 valori.

L'affermazione del documento di design («ogni valore esiste già come token») è vera per il
62,5% dei valori. I sette `nuovo` sono concentrati in due soli gruppi: **tre altezze di
controllo** (26, 28, 44) e **quattro coppie entity** (attribute, reference, operation,
enum) che esistono in TypeScript ma non come CSS custom property.

---

## 5. D4 — Ancore per l'inspector polimorfo (R-RAIL-1, strada (a))

### 5.1 Cosa attraversa oggi il confine

**Montaggio.** Una sola istanza, `Dashboard.tsx:627`:
`<Try><PropertiesWithTreeView mode={'floating'} /></Try>` (import a `:38`). Nessun altro
call site nel repo.

**Props in ingresso al rail.** Una sola: `mode: 'floating'`
(`PropertiesWithTreeView.tsx:65-67`). L'interfaccia ammette solo quel valore letterale,
ma il corpo conserva rami `mode === 'tab'` non raggiungibili (`:132-155`, `:195-219`,
`:440`, `:540`, `:542-550`) — codice morto per il montaggio attuale.

**Props verso l'inspector** (`PropertiesWithTreeView.tsx:482-486` → `Info`):

| Prop | Valore | Contratto |
|---|---|---|
| `mode` | `'tab'` (forzato: `isFloating ? 'tab' : mode`) | `Info` distingue `popup` / `tab` / `inline` (`Info.tsx:1359`) |
| `overrideSelected` | `{node, view, modelElement}` o `undefined` | pin: congela la selezione (`Info.tsx:1388-1391`) |
| `onInternalNavigate` | callback o `undefined` (solo se pinnato) | ri-targetta il pin su navigazione interna |

**Props verso il tree**: nessuna. `<TreeViewContent />` è invocato senza props
(`PropertiesWithTreeView.tsx:573`); legge tutto da Redux (`connect`) e dal context.

**Custom DOM event che passano dal rail** (nomi da `events/registry.ts`, nessuna stringa
hardcoded):

| Evento | Costante | Ruolo nel rail | Ancore |
|---|---|---|---|
| `jjodel:properties-pin-view` | `JjodelEvents.PROPERTIES_PIN_VIEW` (`registry.ts:37`) | **in ascolto**: doppio click su una riga view del tree → pin sulla view, e riapre il pannello se collassato | listener `PropertiesWithTreeView.tsx:368-384`; unico dispatcher `TreeViewContent.tsx:1198` |
| `jjodel:toggle-tree-view` | `JjodelEvents.TOGGLE_TREE_VIEW` (`registry.ts:11`) | **in ascolto**: scorciatoia ⌘B | listener `PropertiesWithTreeView.tsx:387-395`; dispatcher `Navbar.tsx:1237`; **secondo listener** in `TreeViewSidebar.tsx:74` |
| `interfaceModeChange` | `SystemEvents.INTERFACE_MODE_CHANGE` (`registry.ts:105`) | non ascoltato dal rail (vedi D7) | dispatch in `useInterfaceMode.ts` |

**Portale di `ViewData.tsx`: non esiste più.** Ritirato dal commit `6b8e91d73` (Q4). Le
righe `:203` e `:223` citate dal prompt oggi contengono, rispettivamente, il `div` del
`view-editor-header` e la chiusura del `props-header--view`. Il commento
`ViewData.tsx:207-211` documenta il ritiro. **Un contratto in meno da preservare.**

**Chiavi di `localStorage` che attraversano il confine** (sei nel rail + una nel context):

| Chiave | Default | Dichiarata a | Cosa persiste |
|---|---|---|---|
| `jjodel_property_overlay_width` | 400 (320-640) | `PropertiesWithTreeView.tsx:50` | larghezza della colonna flottante |
| `jjodel_property_tree_height` | 360 (180-720, cap 60vh) | `:55` | altezza della card Tree |
| `jjodel_property_panel_visible` | `true` | `:34` | visibilità card Properties |
| `jjodel_treeview_visible` | `true` | `TreeViewPanelContext.tsx:60` | visibilità card Tree |
| `jjodel_property_tree_view_width` | 260 (200-500) | `PropertiesWithTreeView.tsx:30` | larghezza tree in `mode='tab'` — **inerte** |
| `jjodel_property_panel_width` | 440 (400-700) | `:41` | larghezza properties in `mode='tab'` — **inerte** |
| `theme` | — | `frontend/index.html:16` | tema; determina il vincitore della cascata dei token (§3.3) |

**Inset del canvas.** Il rail è **scrittore unico** di `--jj-canvas-right-inset` su
`document.body` (`PropertiesWithTreeView.tsx:351-360`): `overlayWidth + 8` quando
l'overlay è mostrato, `0px` altrimenti. Lo leggono il fit del viewport, la MiniMap e il
FAB di Jodie. **È il contratto verso il canvas e sopravvive intatto al rail unico**, con
una sola larghezza da pubblicare invece di una condizionale.

### 5.2 Chi decide oggi quale corpo mostrare

Il dispatch **non è nel rail**: è dentro `Info.tsx`, in due stadi.

**Stadio 1 — risoluzione della selezione** (`Info.tsx:1383-1398`, `mapStateToProps`).
Da `state._lastSelected` (o da `overrideSelected` se pinnato) escono tre id, risolti in
tre proxy L distinti:

```ts
const nodeID = sel ? sel.node          : state._lastSelected?.node;
const viewID = sel ? sel.view          : state._lastSelected?.view;
const dataID = sel ? sel.modelElement  : state._lastSelected?.modelElement;
if (nodeID) ret.node = LGraphElement.fromPointer(nodeID);
if (viewID) ret.view = LViewElement.fromPointer(viewID);
if (dataID) ret.data = LModelElement.fromPointer(dataID);
```

**Stadio 2 — dispatch sul tipo** (`Info.tsx:1172-1235`), in due livelli con precedenza:

1. **La view vince sul model element** (`:1174`). Se `mode==='tab'` e la selezione porta
   una view, si discrimina su `className` del `__raw`:
   - `DViewPoint` → `<ViewpointProperties>` (`:1189-1193`)
   - `DViewElement` → `<ViewData>` (`:1195-1201`)
   
   ed è un `return` anticipato: header, breadcrumb e overview del ramo model element non
   vengono mai renderizzati per una view.
2. **Altrimenti, switch su `ddata?.className`** (`:1211-1235`) verso i metodi statici di
   `class builder`: `DModel`→`model`, `DPackage`→`package`, `DClass`→`class`,
   `DEnumerator`→`enum`, `DAttribute`→`attribute`, `DReference`→`reference`,
   `DOperation`→`operation`, `DParameter`→`operation(data.father)`,
   `DEnumLiteral`→`literal`, `DObject`→`object`, `DValue`→`value`, default→`<Empty/>`.

**Terzo livello dentro il ramo view.** `ViewData.tsx:80-108` sceglie la barra di tab e,
per le view con IR autorabile, quale pannello di authoring montare: `ir.kind` vale
`'vertex'` → `VertexAuthoringPanel`, `'row'` → `RowAuthoringPanel`, `'edge'` →
`EdgeAuthoringPanel`; senza `ir` → barra legacy con `EnableIRPanel` sul tab `IR`
(`:127-148`). Tutti e tre i pannelli ricevono `view`, `activeTab` e
`identity = {viewpoints, readOnly}` (`:86`, `:92-100`).

**In sintesi**: l'inspector polimorfo non va costruito, **esiste già**. Il dispatcher è
`InfoComponent`, discrimina su `className` del `__raw` della selezione risolta, e i
pannelli di authoring sono già uno slot terminale raggiunto per `ir.kind`. Lo slot che
R-RAIL-1 descrive coincide con il confine `PropertiesWithTreeView → <Info>`.

### 5.3 Quali contratti sopravvivono al rail unico e quali no

**Sopravvivono intatti**:

- `Info` e la sua tripla `{node, view, modelElement}` — il contratto di selezione non
  cambia;
- `overrideSelected` / `onInternalNavigate` (il pin), che è ortogonale al layout;
- `--jj-canvas-right-inset`, con l'unica differenza che pubblicherà una larghezza sola;
- `PROPERTIES_PIN_VIEW`, che oggi fa due cose (pin + riapertura) entrambe sensate su un
  rail unico;
- `activeEditorType` dal context, che decide se il rail esiste (`overlayActive`,
  `PropertiesWithTreeView.tsx:409`).

**Non sopravvivono — due larghezze e due visibilità diventano una sola**:

- **Due visibilità indipendenti**. Oggi `isPropertiesVisible` (stato locale + chiave
  `jjodel_property_panel_visible`, `:228-239`) e `isTreeViewVisible` (dal
  `TreeViewPanelContext`, chiave `jjodel_treeview_visible`) sono **scorrelate**, e il
  rail rende quattro combinazioni: entrambe (`showResizeHandle`, `:331`), una sola
  (`CollapsedPanelToggle`, `:510` / `:577`), nessuna (`bothCollapsed` → pill di
  riapertura, `:340-342`, `:596-618`). In `2a` il tree non si «chiude»: **collassa a 0px
  in postura Focus e l'inspector resta sempre visibile**. Le due visibilità diventano una
  postura a due stati, con conseguenze da decidere: che ne è di
  `jjodel_treeview_visible`, letta anche da `TreeViewSidebar.tsx` (altro componente), e
  della pill di riapertura.
- **Due larghezze**. `overlayWidth` (colonna, 320-640, `:47-49`) e `treeHeight`
  (altezza della card Tree, 180-720 con cap 60vh, `:52-55`) sono due assi indipendenti
  con due handle di resize (`handlePropsResizeStart` `:171-219`, `handleResizeStart`
  `:109-155`) e due chiavi. In `2a` la larghezza è **una sola** (420px, usabile da
  360px) e l'altezza del tree pane è **derivata dalla postura** (392px / 0px), non
  trascinabile. Le due chiavi `jjodel_property_tree_view_width` e
  `jjodel_property_panel_width` sono già inerti (rami `mode==='tab'` irraggiungibili) e
  possono seguire il resto.
- **Due header con due doppi click.** Oggi il doppio click su ciascun header è
  `toggleMaximizeTree` / `toggleMaximizeProperties` (`:249-250`, `:451`, `:553`), che
  pilotano lo stato accordion `cardMaximized: 'tree' | 'properties' | null` (`:248`). In
  `2a` c'è **un header solo** e il doppio click cambia **postura** (Browse ↔ Focus). Lo
  stato `cardMaximized` e la classe `card-header-only` non hanno più referente.
- **Lo splitter in-flow** `tree-view-panel-vsplit` (`:517-528`) e i due
  `CollapsedPanelToggle` (`:636-650`) non hanno posto in un rail continuo.

---

## 6. D5 — Dati per il tree e per l'identity block

### 6.1 Le cinque richieste del design al tree

| Richiesta del design | Stato | Ancora |
|---|---|---|
| **suffisso di tipo in mono** (`": EString [0..1]"`) | **il dato esiste ed è già reso**, ma **non in mono** | `TreeViewContent.tsx:765`: `<span className="tree-feature__type">: {feature.typeName} [{feature.multiplicity}]</span>`. Forma stringa identica al design, virgola per virgola. Lo stile (`tree-view-sidebar.scss:1907-1914`) è `font-size: 11px; color: var(--color-text-tertiary)` e **non dichiara `font-family`**: eredita il sans. Il dato viene da `TreeStructuralFeatureData {id, name, typeName, multiplicity}` (`:106-111`), costruito in `mapStateToProps`. **Serve solo aggiungere `font-family: var(--font-mono)`** |
| **conteggio elementi** («16 items», «4 of 16») | **parziale** | Esiste `matchCount` (`:217-218`, propagato da tutte le `filterX`) ed è reso a `:1856` come `<span className="tree-search__count">{matchCount}</span>`, **solo quando il filtro è attivo** (`searchActive`). Quindi oggi si vede «4», mai «4 of 16» e mai «16 items». Il totale non filtrato **non è calcolato da nessuna parte**. Esiste inoltre una `counter?: number` opzionale su `SectionNode` (`:505`, resa a `:532-534` come `.tree-counter`) e i contatori `classCount` / `subPackageCount` / `instanceCount` sulle strutture dati (`:97,:116-117`), ma sono per-sezione, non totali di albero |
| **filtro** | **esiste, ma NON appiattisce a depth 0** | Input a `:1846-1854` (`placeholder="Filter..."`), stato `searchQuery` a `:1553`. Le funzioni `filterStructuralFeatures` / `filterClass` / `filterPackage` / `filterModel` / `filterMetamodel` / `filterViewpoint` / `filterSubViews` (`:224-411`) **potano preservando la gerarchia**: un nodo sopravvive se matcha o se ha un discendente che matcha, e conserva i figli potati (semantica documentata a `:205-215`). Un nodo che matcha direttamente conserva l'intero sottoalbero. **Il tree filtrato resta annidato.** In più: `renderHighlightedName` (`:419-434`) avvolge il match in `<mark>`, e `firstMatchId` alimenta l'Enter-to-scroll (`:1789-1801`). Un filtro che appiattisce a depth 0 è **comportamento nuovo**, non un adattamento |
| **corsivo per i classificatori astratti** | **il flag è disponibile ed è già cablato** | `TreeClassData.isAbstract` (`:100`); uso a `:815`: `nameClassName={cls.isAbstract ? 'is-abstract' : undefined}`; applicato a `:654` sullo `<span className="tree-row__name …">` |
| **badge lettera** per tipo | **rimosso il 2026-07-28 — oggi sono glifi Bootstrap** | `TreeViewContent.tsx:549-552` documenta la sostituzione (Fase 2 C3): «the per-type "badge" is now a Bootstrap glyph instead of a letter», motivata dalle collisioni di lettera (C = Class/Transformation, R = Reference/Rule). Mappa `BADGE_ICON` a `:555-563`, keyed per classe di colore. La lettera **sopravvive solo come fallback** quando la classe non è nella mappa: `:651` `{badgeIcon ? <i className={`bi ${badgeIcon.icon}`}/> : badge}`. Il tipo `EntityBadge` (`:547`) elenca ancora `'M'|'P'|'m'|'C'|'VP'|'v'|'A'|'R'`. **Le lettere del design contraddicono una decisione presa 13 giorni fa** |

**Provenienza del badge: né `entityMeta`, né una mappa locale — entrambe.** Il tree usa
`BADGE_ICON` (mappa locale, `TreeViewContent.tsx:555-563`) per il **glifo**, e le classi
CSS `.tree-DModel` / `.tree-DPackage` / `.tree-DClass` / `.tree-DAttribute` /
`.tree-DReference` / `.tree-nested-model` / `.tree-viewpoint` per il **colore**, che
risolvono alle `$color-*` locali di `tree-view-sidebar.scss:36-41` (terza palette, §4.7).
`entityMeta.ts` **non è importato da `TreeViewContent.tsx`**.

**Altri numeri della riga, per confronto con la spec `2a`**:

| Grandezza | Design `2a` | Oggi | Ancora |
|---|---|---|---|
| altezza riga | 26px | non fissata: `padding: 4px 0` + contenuto | `tree-view-sidebar.scss:1699-1710` |
| indent | `8px + depth * 13px` | `depth * 12px`, nessuna base | `TreeViewContent.tsx:44` (`TREE_INDENT_STEP = 12`), applicato a `:630`, `:525`, `:716` |
| nome | 13px / 500 | **11px**, peso non dichiarato | `tree-view-sidebar.scss` (`.tree-row__name`) |
| suffisso di tipo | mono 11px | sans 11px | `tree-view-sidebar.scss:1907-1909` |
| badge | lettera 16×16 | glifo Bootstrap | `TreeViewContent.tsx:646-652` |
| guida di indentazione | non prevista | hairline 1px per container, `left: calc(var(--tree-depth,0) * 12px + 7px)` | `tree-view-sidebar.scss:1685-1696` |

### 6.2 Identity block (corollario C1.2)

**Per un elemento di metamodello — tutto disponibile.**

| Campo | Fonte | Ancora |
|---|---|---|
| badge / lettera | `getElementTypeInfo(className)` → `{badge, badgeClass, icon}`; copre `DModel`, `DPackage`, `DClass`, `DEnumerator`, `DAttribute`, `DReference`, `DOperation`, `DParameter`, `DEnumLiteral`, `DObject`, `DValue` | `Info.tsx:847-874` |
| nome | `data.name` | `Info.tsx:894` |
| kind | stesso `getElementTypeInfo(...).badge`, con l'override `DModel` → `'Metamodel'` / `'Model'` su `isMetamodel` | `Info.tsx:882-887` |
| firma (`EString [0..1]`) | **ricomponibile, oggi resa spezzata**: `formatMultiplicity(lower, upper)` produce `[0..1]` / `[1]` / `[1..*]` (`Info.tsx:127-133`), reso nel badge `jj-bounds-badge` (`:435-437`); il nome del tipo è in `TypeSelect` (`:155-173`, da `data.type?.name`). Il tree li ha già uniti in una stringa sola (`TreeViewContent.tsx:765`) | — |

Un `PropertiesHeader` con esattamente badge + nome + kind **esiste già**
(`Info.tsx:877-903`, reso a `:1284`). Manca solo il chip di firma.

**Per una view — disponibile, con una precisazione.**

| Campo | Fonte | Ancora |
|---|---|---|
| badge | oggi è un badge testuale `VIEW` / `VIEWPOINT` | `ViewData.tsx:221-223`; classi `jj-type-badge--viewpoint` / `--view` |
| nome | `view.name` (oggi troncato: `U.cropStr(view.name, 1, 1, 10, 10)`) | `ViewData.tsx:219` |
| kind (natura IR: Vertex / Row / Edge) | **`view.ir.kind`** — `'vertex' \| 'row' \| 'edge' \| 'graphVertex'`; già letto e usato per il dispatch | `ViewData.tsx:59-65,80-81`; tipi in `irTypes.ts:143` (`VertexViewIR.kind`), `:334` |
| firma (metaclasse di applicazione) | **`view.ir.metaclasses`** — `string[] \| '*'` (il wildcard è la default-view, specificità minima) | `irTypes.ts:144-145` (`VertexViewIR`), `:168`, `:210`, `:252` — il campo è al **root** dell'IR, non sotto `matching` |

**Il dato per le view è raggiungibile: l'identity block non va reso opzionale.** Con una
riserva onesta: `ir.metaclasses` è definito solo per le view **con IR**. Una view legacy
senza `ir` (`ViewData.tsx:72`, `templateLegacy`) non ha né kind né metaclassi — per quelle
il chip di firma non ha sorgente, e nemmeno il kind. È il caso in cui l'alternativa
ratificata (identity block opzionale) resta necessaria, ma per un sottoinsieme
identificabile — `!view.ir` — non per le view in generale.

---

## 7. D6 — Selezione e sincronia col canvas

### 7.1 Sorgente di verità

**`state._lastSelected`**, campo di root dello store Redux, con forma
`{node: string, view: string, modelElement: string}`. Nessun'altra sorgente.

**Come si legge da un componente del rail** — tre modi, tutti in uso:

- `connect` + `mapStateToProps`: `Info.tsx:1389-1391`, `ViewData.tsx:269-277`;
- `useSelector`: `EditorV2.tsx:1255`, `ClassNode.tsx:41`
  (`(s: any) => s?._lastSelected?.modelElement`);
- lettura imperativa `store.getState()._lastSelected` per non risottoscrivere il
  componente — è quello che fa il pin: `PropertiesWithTreeView.tsx:307`, con la
  motivazione a `:285-286`.

**Come si scrive**: `SetRootFieldAction.new('_lastSelected' as any, {node, view, modelElement})`.

### 7.2 Chi la propaga, e in quale verso

**Canvas → pannello**:

- `useJjomSelection.ts:125`, `:162`, `:168`, `:210` — l'hook di selezione del canvas v2;
- `EditorV2.tsx:2913` (click su una reference), `:3733` (selezione di nodo, con lettura
  del valore corrente a `:3732`);
- `DockManager.tsx:228` — selezione di un viewpoint, che scrive `_lastSelected.view`
  (commento esplicativo a `:210-211` e `:257`).

**Pannello → canvas**: sì, dallo stesso canale. Il rail scrive `_lastSelected` da tre
punti dentro `Info.tsx`:

- `MetamodelContents.handleSelect` (`:184-188`) — click su una classe/enum/package nella
  sezione CONTENTS;
- `handleBreadcrumbClick` (`:1271-1275`) — navigazione nel breadcrumb;
- `clearSelection` (`:1177-1181`) — chiusura dell'editor di view.

**La propagazione è quindi bidirezionale, su un canale unico e simmetrico.** Il tree
scrive sullo stesso canale (i suoi `onSelect` passano per gli stessi `SetRootFieldAction`)
e legge `selected` per riga.

Un secondo canale, **unidirezionale e solo per le view**, è
`JjodelEvents.PROPERTIES_PIN_VIEW`: `TreeViewContent.tsx:1198` → listener
`PropertiesWithTreeView.tsx:368-384`. Il commento a `:365-367` spiega perché la tripla
viaggia nel `detail` invece di essere riletta dallo store: il dispatch di selezione del
tree è asincrono (`Action.fire` → `setTimeout 0`) e sarebbe stale.

### 7.3 `.tree-row--selected` e i token di selezione

- **Applicazione della classe**: `TreeViewContent.tsx:629` —
  `` className={`tree-row ${selected ? 'tree-row--selected' : ''} ${highlightClass}`.trim()} ``.
  Variante per le righe feature: `tree-row__content--selected` a `:718`.
- **Stile**: `tree-view-sidebar.scss:1717-1751`. La selezione è una **pill inset**
  disegnata con uno `::before` (`inset: 1px 4px; border-radius: 9px`), il cui
  `background-color` è `var(--color-selection-bg)` (`:1741`, e `:1749` per lo stato
  selected+hover). Hover neutro `#f1f5f9` (`:1737`).

**`--color-selection-bar` è orfano, per decisione.** `tree-view-sidebar.scss:1744-1746`:

```scss
// Cyan left bar removed (Fase 2 C1, 2026-07-28): the selected state is the
// tinted pill only. This leaves --color-selection-bar orphaned.
// TODO: cleanup — retire --color-selection-bar in _colors-light/dark.scss.
```

Il TODO gemello sta in `_colors-light.scss:350-351` (e i token in `_colors-dark.scss:252-253`).

Grep esaustivo dei consumatori dei due token in tutto `frontend/src`:

- `--color-selection-bg`: due usi, entrambi in `tree-view-sidebar.scss` (`:1741`, `:1749`);
- `--color-selection-bar`: **zero usi**.

**Conseguenza per il design.** La spec `2a` chiede
`box-shadow: inset 2px 0 0 var(--color-selection-bar)` sulla riga selezionata: è
**esattamente la barra cyan rimossa il 2026-07-28**. Il TODO in `_colors-light.scss:350`
citato dal prompt come «l'unico consumatore dichiarato dei token di selezione» è
**disallineato dal codice**: descrive uno stato precedente alla Fase 2 C1. Reintrodurre la
barra è legittimo, ma è **un ribaltamento di una decisione recente e documentata**, non
l'adozione di un token esistente. → **domanda aperta n. 3**.

### 7.4 «Elemento a fuoco» distinto da «elemento selezionato»

**Non esiste.** Grep su `isFocused` / `focusedElement` / `_lastFocused` / `focusedId` in
tutto `frontend/src`: gli unici match sono focus DOM di controlli
(`JjSelect.tsx:38,42,77`, `GlobalSearch.tsx:12,23,45`), estranei al concetto.

Esistono invece **tre stati adiacenti ma diversi**, tutti già in uso sul tree:

- `selected` — dalla tripla `_lastSelected`;
- `highlightedElementId` + `highlightedAction` — evidenziazione temporanea per il
  feedback di esecuzione JjScript, con auto-clear (`TreeViewPanelContext.tsx:37-41`;
  classi `tree-row--highlighted` + `tree-row--action-*`, `TreeViewContent.tsx:623-625`);
- `pinnedSelected` — la tripla congelata del pin (`PropertiesWithTreeView.tsx:282`).

**Conseguenza per la postura Focus.** L'evento che deve attivarla c'è (la scrittura di
`_lastSelected`), ed è già osservabile da dentro il rail via `useSelector`. Ma
`_lastSelected` **non dice di che tipo è ciò che è stato selezionato**: porta tre id, e il
tipo si ricava solo risolvendo il proxy e leggendo `__raw.className` (come fa
`Info.tsx:1211`). La regola di `2a` «Focus si attiva sulla selezione di una foglia
(attributo, reference, operation, literal)» richiede quindi, dentro il rail, la stessa
risoluzione che oggi vive dentro `Info` — cioè `LModelElement.fromPointer(id).__raw.className ∈
{DAttribute, DReference, DOperation, DEnumLiteral}`. Il dato c'è; il punto in cui
calcolarlo è una scelta di disegno.

---

## 8. D7 — Modalità Basic / Advanced

### 8.1 Come la legge oggi il pannello

`PropertiesWithTreeView.tsx:253`:

```ts
const advanced = useSelector((state: any) => state.advanced);
```

**È Redux**, campo di root `state.advanced` (booleano), letto con `useSelector`. Non è un
hook dedicato né un context. Il commento a `:256-259` dichiara il ruolo: «The Basic/Advanced
control lives in the app bar (Navbar) … This card is a pure reader of Redux `advanced`».

Altri lettori dello stesso campo, tutti via `mapStateToProps` (`ret.advanced = state.advanced`):
`Info.tsx:1396`, `ViewData.tsx:275`, `Console.tsx:1070`, `Navbar.tsx:2059`,
`BottomBar.tsx:172`, `ProfileSection.tsx:471`; `NestedView.tsx:545` lo mappa su
`ret.isAdvanced`.

Scrittori (`SetRootFieldAction.new('advanced', …)`): `Navbar.tsx:840,854,889`,
`BottomBar.tsx:55`, `ProfileSection.tsx:394`, `LockedFeature.tsx:41`.

### 8.2 Due sistemi di modalità, non uno

Accanto a Redux `advanced` esiste `useInterfaceMode` (`hooks/useInterfaceMode.ts`), che è
un sistema **indipendente**:

- stato locale `useState` per componente, seminato da `localStorage['jjodel.interfaceMode']`
  (default `'basic'`);
- scrive lo stesso `localStorage` e `U.interfaceMode`;
- notifica via `SystemEvents.INTERFACE_MODE_CHANGE` — evento che **nessuno ascolta per
  risincronizzare Redux**;
- ascolta l'evento `storage` (solo cross-tab), non le proprie mutazioni intra-tab.

Consumatori: `ModeToggle.tsx:24`, `LockedFeature.tsx`, `UpgradePrompt.tsx`,
`Navbar.tsx`, e — rilevante per il rail — **`Info.tsx:96`**, dentro `InheritanceSection`:

```ts
const { isAdvanced: globalAdvanced } = useInterfaceMode();
```

usato a `:117` per la classe `jj-toggle-row-animated--visible` che rivela
«Allow cross-extend». Nella stessa funzione, a `:105`, il ramo «Extends» è gated sul
`advanced` **di Redux**, arrivato per prop.

**Quindi dentro `Info.tsx` convivono due gate di modalità che leggono due sorgenti diverse**,
a quattro righe di distanza, senza alcun meccanismo che le tenga allineate. Non è nel
perimetro dell'arco rail risolverlo, ma il rail lo eredita: se il redesign tocca
`InheritanceSection` o il gating dei campi, incontrerà entrambi. → **domanda aperta n. 5**.

### 8.3 Cosa è gated su `advanced` dentro il perimetro del rail

Nel rail (`PropertiesWithTreeView.tsx`), **una sola cosa**:

- la sezione **NODE** (`:489-506`): `{advanced && (<div className="properties-node-section">…<NodeEditor/>…</div>)}`,
  con il proprio stato di apertura `nodeOpen` (`:254`).

Dentro l'inspector (`Info.tsx`), sul `advanced` di Redux:

| Gate | Ancora |
|---|---|
| `InheritanceSection` — blocco «Extends» (anche su `hasDependencies`) | `:105-116` |
| `enum` — toggle «Serializable» | `:410` |
| `feature` — intera sezione `ADVANCED` (8 toggle: unique, ordered, changeable, volatile, transient, unsettable, derived, allowCrossReference) | `:441-457` |
| `attribute` — sezione `FLAGS` (ID, IoT) | `:464-468` |
| sezione `ADVANCED STATE` (JsonViewer su `_state`) | `:1316-1326` |

Dentro `ViewData.tsx`: il tab **Source** è gated a livello di barra —
`irTabsForKind(irKind, props.advanced)` (`:104`), con la motivazione a `:262-264`
(«in Basic the tab is not offered at all»).

**Il segmented resta nella top bar** (C3.3): è in `Navbar.tsx`, che è anche l'unico
componente montato su ogni vista e possiede il restore once-per-mount della modalità
persistita (`PropertiesWithTreeView.tsx:256-259`). Nessuna azione richiesta dall'arco.

**Conseguenza per `2a`.** Il preset è dichiarato «sia il layout di Basic sia il default di
Advanced», quindi senza rami condizionali di **layout**. Ma i gate di **contenuto** qui
sopra restano tutti, e la sezione NODE è l'unico che vive nel guscio del rail invece che
nell'inspector: nel rail unico va deciso dove ricade (dentro il corpo dell'inspector,
presumibilmente, ma è una scelta di disegno).

---

## 9. Correzioni alla tabella delle ancore del prompt

Riverifica su HEAD `569f78735` delle 13 voci di §5 del prompt. **Dieci confermate, tre
false.**

| Fatto asserito dal prompt | Verdetto | Riscontro |
|---|---|---|
| il codice sta sotto `frontend/` | ✓ | — |
| coppia di selezione a `_colors-light.scss:352-353` col TODO a `:350-351` | ✓ **ma il TODO è obsoleto** | i token ci sono; il TODO descrive uno stato pre-Fase 2 C1. `--color-selection-bar` ha **zero** consumatori (§7.3) |
| `--color-canvas-accent: #06b6d4` a `_colors-light.scss:205` | ✓ | — |
| `--color-sky-500: #0ea5e9` a `tokens.css:42` | ✓ | — |
| `--font-sans` a `_typography.scss:13`, `--font-mono` a `:16` | ✓ | — |
| **«font non caricati»** | ✗ **FALSO** | `_typography.scss:81` e `:84` contengono due `@import url('https://fonts.googleapis.com/css2?…')` per **Inter** (assi variabili 100..900) e **IBM Plex Mono** (400/500/600). Nel bundle di build sono **hoistati in testa al file**, subito dopo `@charset`, quindi validi e onorati dal browser: `dist/assets/index-C-yuxLjX.css`, offset 0-260. Corretto invece che `@fontsource-variable/inter` è in `package.json:14` senza alcun import in `src/`, che non esiste nessun `@font-face`, che `index.html:11` carica da Google solo JetBrains Mono e che `public/fonts/` ha solo icomoon — ma la conclusione «i font non sono caricati» non segue: arrivano dagli `@import` di `_typography.scss`. Nota: il nome `'Inter Variable'` (primo nello stack di `--font-sans`) **non** è servito da Google; fa match il secondo, `'Inter'` |
| scala dei raggi 0/4/8/12/16/24/9999 a `_radius.scss:12-18` | ✓ **ma incompleta** | quella è la scala SCSS. `tokens.css:183-189` ne ha una seconda con **6px** (`--radius-base`) e senza 24. Uno dei quattro raggi dati per fuori scala esiste (§4.2) |
| ombre su nero puro a `_shadows.scss:33-37` | ✓ | e nessuna famiglia slate-tinted di ombre esiste; esistono due **colori** slate-tinted (§4.3) |
| coppie entity a `entityMeta.ts:60-200` | ✓ | `ENTITY_META` va da `:60` a `:202` |
| doppio ruolo di `#0891B2` (`entityMeta.ts:161` + `_colors-light.scss:353`) | ✓ **ed è triplo** | anche `--color-cyan-600`, `tokens.css:34`. Oggi però la collisione è inerte: la barra non è resa |
| montaggio del rail a `Dashboard.tsx:627` | ✓ | `<Try><PropertiesWithTreeView mode={'floating'} /></Try>` |
| **slot del portale a `PropertiesWithTreeView.tsx:459`, consumato da `ViewData.tsx:203,223`** | ✗ **FALSO a HEAD** | il portale è stato **ritirato** dal commit `6b8e91d73` (Slice C, Commit 1, Q4). `ViewData.tsx` non contiene alcun `createPortal`. Lo slot `properties-panel-header__actions` esiste ancora ma a **`:461`** e ospita un `HelpButton` reso dall'host (§2.3) |
| `PropertiesWithTreeView.tsx` 648 righe, `.scss` 1375 | ✗ **numeri di `abc0182`** | a HEAD: **652** e **1366** righe |

---

## 10. Rischi individuati

1. **Il rail nuovo erediterebbe l'ambiguità dei token, amplificata.** Finché la decisione
   D2 non è presa, ogni `var(--color-text-secondary)` scritto nel rail vale `#334155` o
   `#475569` a seconda che l'utente abbia toccato il theme toggle. Lo stesso per bordi,
   sfondi, ombre e per l'easing di `--transition-fast`. Un rail scritto «bene» sui token
   semantici sarebbe **meno prevedibile** di uno scritto sui letterali. Il rischio è
   massimo proprio sui token semantici, minimo sulle scale numerate
   (`--color-slate-*`, `--font-size-*`, `--radius-*`), che i due sistemi definiscono con
   valori concordi.
2. **Le sette altezze del design non hanno scala di appoggio.** 26/28/30/34/44 contro una
   scala 32/40/48. Qualunque scelta (nuovi token, letterali, riscalatura del design) è
   una decisione, e riguarda sei misure che compaiono ovunque nel rail.
3. **La barra di selezione è un ribaltamento, non un'adozione.** §7.3. Rimossa 13 giorni
   fa con motivazione scritta, con un TODO di ritiro del token ancora aperto. Va deciso
   esplicitamente, altrimenti si ripristina qualcosa che qualcuno ha tolto apposta.
4. **Il badge lettera è un secondo ribaltamento.** §6.1. I glifi Bootstrap hanno sostituito
   le lettere il 2026-07-28 per risolvere collisioni reali (C = Class/Transformation,
   R = Reference/Rule) che il design, con le sue lettere, reintrodurrebbe.
5. **Le tre palette entity.** §4.7. Adottare le coppie `badgeBg`/`badgeText` cambia il
   colore dei tipi nel tree (che oggi usa `$color-*` locali) e lascia scoperte quattro
   coppie su sette sul lato CSS. Sincronizzare `entityMeta.ts` e `_colors-light.scss` è
   un obbligo dichiarato dai commenti di entrambi i file.
6. **Il filtro che appiattisce a depth 0 è funzionalità nuova.** §6.1. Il filtro attuale
   pota preservando la gerarchia, e ci sono già `<mark>`, `matchCount` e
   Enter-to-scroll costruiti su quella semantica. Sostituirla non è un adattamento di
   stile.
7. **Sei commit locali non pushati.** §2.3. Non c'è conflitto di merito, ma se Slice C
   venisse riscritta dopo l'inizio dell'arco, i commit del rail andrebbero ribasati.
8. **`jjodel_treeview_visible` ha un secondo lettore fuori dal rail.** `TreeViewSidebar.tsx`
   monta un proprio listener di `TOGGLE_TREE_VIEW` (`:74`) e consuma la stessa visibilità
   dal context. Cambiare la semantica della visibilità del tree nel rail unico tocca un
   componente **non nominato dal prompt** — è esattamente il caso della regola 20 di
   CLAUDE.md.
9. **Codice morto `mode==='tab'`.** `PropertiesWithTreeView` ha ~90 righe di rami
   irraggiungibili e due chiavi di `localStorage` inerti. Non è un rischio per il
   funzionamento; lo è per la lettura del diff dell'arco, dove sarà difficile distinguere
   «rimosso perché il rail unico non lo prevede» da «rimosso perché era già morto».

---

## 11. Domande aperte per Alfonso

1. **D2 — quale sistema di token consuma il rail nuovo?** Non è deducibile dal codice
   (§3.5). Le opzioni visibili: (a) `tokens.css` — vince la cascata di default, e la sua
   scala tipografica px coincide esattamente con quella del design; (b) `tokens/` — è la
   fonte dichiarata da CLAUDE.md §7.2, ma perde la cascata quando l'utente non ha mai
   toccato il tema; (c) unificare prima i due sistemi, come lavoro a sé fuori dall'arco 1.
2. **Il ribaltamento della cascata theme-dipendente (§3.3) va trattato come bug da
   aprire, o come vincolo con cui convivere per la durata dell'arco?**
3. **La barra di selezione va reintrodotta?** (§7.3) Se sì, si riapre `--color-selection-bar`
   e si cancella il TODO di ritiro in `_colors-light.scss:350-351`,
   `_colors-dark.scss` e `tree-view-sidebar.scss:1745-1746`. Se no, la spec `2a` va
   emendata sulla riga selezionata (resta la sola pill `--color-selection-bg`, già in
   opera).
4. **Il badge torna a lettera o resta glifo?** (§6.1) Se torna lettera, come si risolvono
   le collisioni C e R che la Fase 2 C3 aveva eliminato?
5. **I 7 valori `nuovo` (§4.8): token nuovi o letterali?** Sono tre altezze (26, 28, 44) e
   quattro coppie entity (attribute, reference, operation, enum). Per le coppie entity
   c'è una terza via: aggiungerle come `--color-entity-*` in `_colors-light.scss` /
   `_colors-dark.scss`, che è quanto i commenti di sincronia di `entityMeta.ts:10-12` e
   `_colors-light.scss:329-330` già prescriverebbero. Nota: sarebbe una modifica ai file
   di token, quindi fuori dal perimetro di un commit di solo rail.
6. **I 14 valori `snap`: si adotta il gradino vicino o si tiene il valore del design?**
   In particolare le quattro ombre (§4.3), dove lo scostamento non è di misura ma di
   **tinta** (slate del design contro nero puro della scala), e i tre raggi 7/9/10.
7. **Il filtro deve appiattire a depth 0?** (§6.1) Se sì è funzionalità nuova, con la
   semantica attuale — potatura gerarchica, `<mark>`, `matchCount`, Enter-to-scroll — da
   riscrivere o da affiancare.
8. **Il conteggio «16 items» / «4 of 16»**: il totale non filtrato oggi non è calcolato da
   nessuna parte (§6.1). Va aggiunto al `mapStateToProps` del tree, o si ripiega sul solo
   `matchCount` già disponibile?
9. **Le due visibilità e le due larghezze diventano una** (§5.3): che fine fanno
   `jjodel_treeview_visible` — letta anche da `TreeViewSidebar.tsx`, fuori perimetro — la
   pill di riapertura e lo stato accordion `cardMaximized`?
10. **La sezione NODE** (unico gate `advanced` nel guscio del rail, §8.3) dove ricade nel
    rail unico?
11. **Il doppio sistema di modalità** (Redux `advanced` vs `useInterfaceMode`, §8.2)
    convivono già a quattro righe di distanza dentro `InheritanceSection`. Si lascia
    così, o l'arco lo tocca?

---

## 12. Definition of done — verifica

| Criterio | Stato |
|---|---|
| 1. Report esistente con obiettivo, file letti, D1..D7 con ancore, tabella D3 coi tre conteggi, rischi, domande aperte | ✓ questo file |
| 2. Nessun file sotto `frontend/src/` modificato | ✓ vedi §12.1 |
| 3. `npm run check:docs` passa | vedi §12.2 |
| 4. Entry in `docs/claude-code-log.md` col formato validato | ✓ |
| 5. Hard stop, nessun prompt di implementazione | ✓ |

### 12.1 `git status --short` a fine task

```
?? docs/discovery/discovery_2026-08-10_rail_fase0.md
 M docs/claude-code-log.md
```

Nessuna riga sotto `frontend/src/`. Read-only rispettato.

### 12.2 Gate

`npm run check:docs` — vedi la entry di log per l'esito. Nessun altro gate eseguito:
`typecheck`, `build`, `test` e `check:agents` non sono richiesti da un task che non tocca
sorgenti né alcun `CLAUDE.md`.
