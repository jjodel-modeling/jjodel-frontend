# Discovery 2026-07-30 — Toggle Basic/Advanced dalla card Properties al Navbar (B5, Fase 1)

**Prompt**: Commit B5 (two-phase) — relocation del segmented Basic|Advanced dall'header della card
Properties all'header dell'applicazione (Navbar). Fase 1 = discovery read-only, nessuna modifica a
sorgenti.

**Esito**: discovery completa. **Due premesse del prompt sono smentite dal codice** (§3 e §7.1) e
richiedono una decisione esplicita prima della Fase 2.

---

## 0. File letti

| Path | Motivo |
|------|--------|
| `frontend/src/hooks/useInterfaceMode.ts` | API del meccanismo (letto integralmente) |
| `frontend/src/pages/components/Navbar.tsx` | writer, badge, menu, shortcut, JSX header (2050 righe, letto a blocchi) |
| `frontend/src/pages/components/navbar.scss` | palette appbar, `.main-header-right`, `.appbar-level-badge`, dark mode |
| `frontend/src/components/editors/PropertiesWithTreeView.tsx` | segmented B2 + wiring + riconciliazione |
| `frontend/src/components/editors/properties-with-tree-view.scss` | `.properties-mode-switch` base + skin B4 + dark |
| `frontend/src/pages/components/BottomBar.tsx` | `ModeIndicator` (writer alternativo) |
| `frontend/src/components/Settings/UnifiedSettingsModal/sections/ProfileSection.tsx` | writer "Editor mode" |
| `frontend/src/App.tsx`, `frontend/src/pages/components/Dashboard.tsx` | siti di render del Navbar |
| `frontend/src/events/registry.ts`, `frontend/src/common/U.tsx`, `frontend/src/utils/keyboardShortcuts.ts` | evento, statico, shortcut |

---

## 1. Stato della serie B — tutti i commit presenti

```
e9541e06b + ca558c972  B4  style(panels): apply mockup skin to properties card
6e9f80240              B3  feat(panels): gate conditional editing behind advanced mode for vertex
029f79e2e              B2  feat(panels): move disclosure toggle to card header wired to global interface mode
118b6eb7f + 7bf5d6369  B1  wrap vertex authoring groups in FormSection / wire vertex disclosure toggle
```

B2 è committato: il segmented **è** nell'header della card. Nessun blocco. La skin B4 (§2.3 del
prompt) è anch'essa applicata, scoped sotto `.properties-panel-container`.

Working tree: 5 file modificati non correlati (WIP TextStyle/irStyle/ObjectNode/_form-system) +
`.claude/scheduled_tasks.lock`. **Nessuno tocca i file di questo task** → `git add` per path espliciti,
nessun rischio di contaminazione.

---

## 2. Censimento del meccanismo — writer e lettori

### 2.1 API di `useInterfaceMode` (`hooks/useInterfaceMode.ts`)

Export: `getInterfaceMode()`, `setInterfaceMode(mode)`, `isAdvancedMode()`, `isBasicMode()`,
`useInterfaceMode()` (hook), default export.

L'hook ritorna `{ mode, isBasic, isAdvanced, toggleMode, setMode }`.

Cosa scrive `setMode`/`toggleMode` (righe 81-97):
1. `localStorage['jjodel.interfaceMode']` (via `setInterfaceMode`, riga 35)
2. `U.interfaceMode` (riga 37)
3. `window.dispatchEvent(SystemEvents.INTERFACE_MODE_CHANGE)` (righe 87, 96)

Cosa **non** scrive: Redux `state.advanced`, `windoww.advanced`.

### 2.2 Writer (mutano la modalità) — 6 siti + 1 riconciliazione

| # | Path:riga | Chi | Redux `advanced` | `windoww.advanced` | localStorage | `U.interfaceMode` | Effetti extra |
|---|-----------|-----|:---:|:---:|:---:|:---:|---|
| 1 | `Navbar.tsx:838-850` | `enableAdvancedMode(showTutorial)` | ✅ | ✅ | ✅ | ✅ | tutorial 1ª volta / `U.alert` |
| 2 | `Navbar.tsx:852-858` | `disableAdvancedMode()` | ✅ | ✅ | ✅ | ✅ | `U.alert` |
| 3 | `Navbar.tsx:860-866` | `toggleAdvancedMode()` | dispatcher su 1/2 | | | | chiamato da menu View (1413-1417) e Cmd+Shift+M (1137-1141) |
| 4 | `BottomBar.tsx:53-60` | `ModeIndicator.toggleMode` | ✅ | ✅ | ✅ | ✅ | `U.alert` |
| 5 | `ProfileSection.tsx:391-397` | riga Settings "Editor mode" | ✅ | ✅ | ✅ | ✅ | — |
| 6 | `PropertiesWithTreeView.tsx:264-270` | `selectDisclosureMode` (**B2, da rimuovere**) | ✅ | ✅ | via hook | via hook | — |
| R | `PropertiesWithTreeView.tsx:278-284` | riconciliazione al mount (localStorage → Redux, **solo direzione positiva**) | ✅ | ✅ | — | — | one-shot, `[]` |

Il pattern canonico è quindi: **Redux `state.advanced` è il canale di broadcast runtime**;
localStorage/`U.interfaceMode` sono solo persistenza.

### 2.3 Lettori

**Redux `state.advanced`** (tutti i consumatori reali):
`Dock.tsx:405` (+274) · `Info.tsx:1408` · `Console.tsx:1070` (+877) · `NestedView.tsx:545`
(`isAdvanced`) · `VertexAuthoringPanel.tsx:61` · `PropertiesWithTreeView.tsx:254` (+528 sezione NODE) ·
`Navbar.tsx:2028` → `props.advanced` (badge 1909, label menu 1413, blocco 1521) · `BottomBar.tsx:172` ·
`ProfileSection.tsx:471`.

**`U.interfaceMode`** (statico): **un solo lettore** — `components/metrics/Metrics.tsx:85`.

**`isAdvancedMode()`** (localStorage): `PropertiesWithTreeView.tsx:279` (riconciliazione).

**`SystemEvents.INTERFACE_MODE_CHANGE`** (`registry.ts:102`): **zero listener nel repo**. Compare solo
nei due `dispatchEvent` dell'hook e nella registry. È un canale morto.

### 2.4 Conseguenza operativa (⚠ smentisce §2.1 del prompt)

> Prompt §2.1: «legge e scrive SOLO attraverso `useInterfaceMode`. Non scrivere `state.advanced`
> direttamente».

Un segmented che scrive **solo** via `useInterfaceMode` sarebbe **inerte**: nessun consumatore legge
`U.interfaceMode` (tranne Metrics) e l'evento non ha ascoltatori. La card Properties, la
`VertexAuthoringPanel`, il Dock e il badge del Navbar leggono tutti Redux → **non si aggiornerebbe
nulla**, violando il criterio di accettazione «commutare dal Navbar aggiorna la card live».

Anche B2 (il commit che il prompt cita come modello) scrive Redux esplicitamente
(`PropertiesWithTreeView.tsx:267`) e usa l'hook solo per la metà "persistenza".

**Proposta di wiring** (§7.1 per la domanda aperta): i due bottoni del segmented chiamano le funzioni
**già esistenti** `enableAdvancedMode()` / `disableAdvancedMode()` (`Navbar.tsx:838-858`) — le stesse
che usano già la voce di menu View e la shortcut Cmd+Shift+M. Zero nuovi writer, zero stato locale,
zero duplicazione della logica di scrittura.

---

## 3. Il Navbar oggi

**Path**: `frontend/src/pages/components/Navbar.tsx` (2050 righe) · SCSS proprietario:
`frontend/src/pages/components/navbar.scss` (2283 righe).

### 3.1 Struttura JSX dell'header (return a riga 1784)

```
<nav id="navbar" class="w-100 nav-container d-flex appbar">          1785
  ├─ .nav-logo                                                       1786
  ├─ .appbar__sep                                                    1795
  ├─ <MainMenu items={items} />        ← cluster SINISTRO            1796
  ├─ section.nav-commands (Debugger)                                 1797
  ├─ .project-label            {project && …}   ← CENTRO             1802
  ├─ .appbar-tabs              {project && …}   flex:1, overflow:hidden  1826
  └─ .main-header-right                          ← cluster DESTRO    1906
       ├─ button.appbar-level-badge   ← indicatore modalità (read-only)  1908-1915
       ├─ .appbar__sep                                               1916
       ├─ .appbar__sep            {project && …}                     1920
       ├─ .help-menu                                                 1922
       └─ .user-menu-container                                       1934
```

### 3.2 Palette

L'appbar è **chiara** e token-driven: `.nav-container` → `background-color: var(--color-bg-primary)`
(navbar.scss:173); `.nav-container.appbar` → altezza **50px**, `border-bottom: 0.5px solid
var(--color-border-tertiary, #e2e8f0)` (1591-1594). Testo dei menu 12px/500
`var(--color-text-secondary, #64748b)` (1616-1620).

Il **dark mode esiste** ed è gestito con `[data-theme="dark"] { … }` (blocco 2163-2283): `.appbar__sep`
→ `#334155` (1657-1659), `.appbar-level-badge` → track `rgba(255,255,255,0.04)`, bordo `#475569`,
testo `#64748b`/`#94a3b8` (2269-2283). Famiglia slate coerente col design system.

`.main-header-right` (navbar.scss:1030-1036): `display:flex; align-items:center; margin-left:auto;
gap:8px; flex-shrink:0` (tutti `!important`). In `@media` compatta (blocco che finisce a 1643):
`gap: 4px !important`.

### 3.3 Controllo modalità già esistente nel Navbar

**Sì, ne esistono due, entrambi visibili all'utente finale:**

1. **`.appbar-level-badge`** — `Navbar.tsx:1908-1915`, primo figlio di `.main-header-right`.
   `<button>` con dot + label `props.advanced ? 'Advanced' : 'Basic'` (riga 1782), `title="Click to
   change in Settings"`, `onClick={() => openSettings('profile')}`. **Non è un writer**: è un
   indicatore read-only che rimanda alla Settings. Stili: navbar.scss:2106-2143 (11px/500, padding
   3px 10px, radius 6px, bordo 0.5px) + dark 2269-2283.
2. **Voce di menu "Switch to Basic/Advanced Mode"** — `Navbar.tsx:1413-1417`, dentro il menu **View**,
   con pill di shortcut Cmd+Shift+M. Chiama `toggleAdvancedMode`. **È un writer**, ma non visibile a
   riposo (è dentro un dropdown).

Fuori dal Navbar ma sempre visibile: **`ModeIndicator` nella BottomBar** (`BottomBar.tsx:50-84`,
renderizzato a 119) — writer, cliccabile, mostra Basic/Advanced. Vedi §7.3.

---

## 4. Visibilità del Navbar per vista

`<Navbar />` compare in 3 punti, **uno dei quali è codice morto**:

| Path:riga | Stato |
|-----------|-------|
| `App.tsx:194` | **dentro un blocco commentato** (`/* … */` aperto a 188, chiuso a 204) — inerte |
| `Dashboard.tsx:314` | viste dashboard (all-projects, favorites, …) |
| `Dashboard.tsx:619` | shell del progetto — sotto di esso vive il `<Dock />` con **tutte** le viste (editor, summary, documentation) |

Conseguenze:
- Il Navbar è **un'unica istanza per rotta**, sempre lo stesso componente, senza props di variante.
- Editor / summary / documentation sono **tab dentro lo stesso Dock**, sotto lo stesso Navbar → il
  Navbar non cambia forma tra loro.
- L'unica variazione è `project`-dependent: `.project-label` (1802) e `.appbar-tabs` (1826) spariscono
  sulla dashboard. `isDashboard = !project` (riga 1290) disabilita alcune voci di menu.
- **`.main-header-right` è renderizzato incondizionatamente in entrambi i casi** → il segmented sarà
  visibile su tutte le viste senza gating.

---

## 5. Il segmented nella card

**Markup**: `PropertiesWithTreeView.tsx:481-502` — `div.properties-mode-switch[role=group]` con
`onDoubleClick` stoppato (per non innescare il maximize dell'header), e due `<button>` generati da
`(['basic','advanced'] as const).map`, classe `properties-mode-switch__opt(--active)`,
`aria-pressed`, `title` esplicativo.

**Wiring**: `selectDisclosureMode` (264-270) + `const { setMode: setGlobalInterfaceMode } =
useInterfaceMode()` (263) + selector `advanced` (254).

**Posizione nella riga**: `.properties-panel-header` è `display:flex; gap:8px; height:41px`
(properties-with-tree-view.scss:145-158) e il titolo ha `> span:first-of-type { flex: 1 }` (166-168).
Ordine attuale: icona · titolo (flex:1) · **segmented** · pin (503) · collapse (512).

**SCSS del segmented** — 3 blocchi, tutti in `properties-with-tree-view.scss`:
- **176-212** — blocco base, **top-level (non scoped)**: track `#f1f5f9`, bordo `#e2e8f0`, radius
  `$radius-sm`, opt 11px/600.
- **330-349** — **skin B4, scoped sotto `.properties-panel-container`**: padding 3px, `border:none`,
  radius `$pc-radius-ghost` (10px), track `$pc-slate-100` (#f1f5f9); opt 13px/600, colore
  `$pc-slate-400` (#94a3b8), radius `$pc-radius-chip` (8px), padding 4px 10px; attivo `#fff` +
  `$pc-slate-800` (#1e293b) + `box-shadow: 0 1px 2px rgba(15,23,42,.10)`.
- **1186-1203** — dark mode, scoped sotto la radice dark della card: track `rgba(255,255,255,.05)`,
  bordo `rgba(255,255,255,.1)`, opt `#cbd5e1`, attivo `#334155`/`#f1f5f9`, no shadow.

**Grep di dipendenza (punto 5 del prompt)** — nessun rischio:
- `grep -rn "properties-mode-switch"` → **solo** i 2 usi in `PropertiesWithTreeView.tsx` e i 3 blocchi
  SCSS sopra. Nessun consumatore esterno.
- Selettori posizionali su `.properties-panel-header`: solo `> i` (161), `> span:first-of-type` (166 e
  322). **Nessun `:nth-child`, `+`, `~`** che dipenda dalla presenza del segmented.
- `grep` su file `*.test.ts(x)` per `mode-switch` / `Advanced` → **0 risultati**. Nessun test.
- Rimuovendo il segmented la riga diventa: icona · titolo (`flex:1`) · pin · collapse — geometria
  invariata, i due bottoni restano allineati a destra. Nessuno squilibrio previsto.

**Nota sulla rimozione**: tolto `selectDisclosureMode`, la chiamata `useInterfaceMode()` (263) resta
senza consumatori e va rimossa con esso (sottoscrizione pendente altrimenti). L'import di
`isAdvancedMode` **deve restare**: serve alla riconciliazione (279). Il selector `advanced` (254)
**deve restare**: gating della sezione NODE (528).

---

## 6. Proposta per la Fase 2

### 6.1 Collocazione — sostituire il level badge

Il segmented prende il posto di `.appbar-level-badge` (`Navbar.tsx:1908-1915`), **stessa slot**, primo
elemento di `.main-header-right`, prima del `.appbar__sep` di riga 1916.

**Motivazione**:
- È già lo slot della modalità: il badge mostra *esattamente* la stessa informazione (Basic/Advanced),
  ma read-only con un rimbalzo alla Settings. Il segmented la rende azionabile in loco → **un solo
  controllo, un solo writer visibile**, nessun residuo duplicato (ratifica (b)).
- **Spazio reale**: il badge occupa ~65px; il segmented ~135px (a 12px di font) → **+70px**. Il
  cluster destro è `flex-shrink:0` e `.appbar-tabs` è `flex:1; min-width:0; overflow:hidden`
  (navbar.scss:1705-1712): i 70px vengono assorbiti dalla striscia tab, che clippa. **Nessun wrap,
  nessun overflow** del cluster destro a qualsiasi larghezza.
- L'overflow dei tab è a **conteggio fisso** (`MAX_VISIBLE_TABS = 6`, riga 1746), non misurato sul
  DOM: nessun effetto collaterale sul calcolo di `+N ▾`.
- Altezza: appbar 50px, il segmented risulta ~26px — coerente con badge (~22px) e user badge (28px).

### 6.2 Stile — classe `.appbar-mode-switch`

Nome scelto dopo grep di collisione: `appbar-mode-switch`, `navbar-mode-switch`, `jj-navbar-mode-toggle`,
`appbar-mode-toggle` → **0 occorrenze nel repo**. `appbar-mode-switch` segue la convenzione BEM già in
uso nel file (`appbar-tab`, `appbar-tabs__overflow-btn`, `appbar-level-badge__dot`).

**File proprietario**: `pages/components/navbar.scss`, nella sezione oggi occupata dal level badge
(2102-2143); variante dark nel blocco `[data-theme="dark"]` esistente (2163-2283).

**Perché NON riusare `.properties-mode-switch`**: il blocco base (176-212) è globale, ma la skin che gli
dà l'aspetto mockup è **scoped sotto `.properties-panel-container`** (330) e il dark sotto la radice
della card (1186). Riusando la classe nel Navbar si erediterebbe il base 11px senza skin e **senza dark
mode** — esattamente il caso escluso dal §2.3 del prompt.

**Valori proposti — light** (fondo `var(--color-bg-primary)`):

| Proprietà | Valore | Fonte |
|-----------|--------|-------|
| track background | `#f1f5f9` | B4 `$pc-slate-100` |
| track radius / padding | `10px` / `3px` | B4 |
| track border | nessuno | B4 |
| opt font | **12px** / 600 | ⚠ vedi §7.2 (B4 = 13px) |
| opt padding / radius | `4px 10px` / `8px` | B4 |
| opt inattivo | `#94a3b8` | B4 `$pc-slate-400` |
| opt attivo | bg `#ffffff`, testo `#1e293b`, `box-shadow: 0 1px 2px rgba(15,23,42,.10)` | B4 |

**Valori proposti — dark** (`[data-theme="dark"]`, richiesto dal §2.3 «su fondo scuro: proponi nel
report una variante coerente coi token slate»):

| Proprietà | Valore | Coerenza |
|-----------|--------|----------|
| track background | `rgba(255,255,255,0.05)` | identico al dark della card (1187) |
| opt inattivo | `#94a3b8` | `.appbar-level-badge--advanced` dark (2278) |
| opt attivo | bg `#334155`, testo `#f1f5f9`, `box-shadow: none` | dark card (1197-1201) + `.appbar__sep` dark (1658) |

### 6.3 Wiring proposto

```
basic    → disableAdvancedMode()     (Navbar.tsx:852)
advanced → enableAdvancedMode()      (Navbar.tsx:838)
stato    → props.advanced            (già mappato, Navbar.tsx:2028)
```

No-op se la modalità richiesta è già attiva (guardia come B2 riga 266), per non ripetere toast e
tutorial. Nessun `useState` locale, nessun listener nuovo, nessuna modifica a `useInterfaceMode` né
alla riconciliazione.

### 6.4 Diff previsto (4 file)

| File | Modifica |
|------|----------|
| `pages/components/Navbar.tsx` | rimozione `.appbar-level-badge` (1908-1915) + `levelLabel` (1782); inserimento segmented nella stessa slot |
| `pages/components/navbar.scss` | rimozione blocchi `.appbar-level-badge` (2106-2143, 2269-2283); nuovo `.appbar-mode-switch` light + dark |
| `components/editors/PropertiesWithTreeView.tsx` | rimozione JSX segmented (481-502), `selectDisclosureMode` (264-270), hook `useInterfaceMode()` (263) |
| `components/editors/properties-with-tree-view.scss` | rimozione dei 3 blocchi `.properties-mode-switch` (176-212, 330-349, 1186-1203) |

Sotto la soglia dei 5 file (regola 19).

---

## 7. Rischi e domande aperte per Alfonso

### 7.1 ⚠ Il Navbar NON riconcilia — la riconciliazione è nella card (decisione richiesta)

Il prompt §2.1 assume «il Navbar già riconcilia». **Non è vero**: l'unico ripristino
localStorage → Redux al mount vive in `PropertiesWithTreeView.tsx:278-284`, cioè **dentro la card che
stiamo svuotando**. Redux `advanced` nasce `false` a ogni boot (store.tsx:215, come documentato nel
commento B2).

Conseguenza pratica: dopo un reload, la modalità Advanced viene ripristinata **solo quando la card
Properties monta**, cioè solo nell'editor di progetto. **Sulla dashboard il segmented mostrerebbe
Basic** anche con `localStorage = advanced`. È un difetto **preesistente** (il level badge ha già oggi
lo stesso comportamento), ma il segmento lo rende più visibile perché diventa un controllo attivo.

**Opzioni**:
- **(A) Nessun intervento** — diff minimo, comportamento identico a oggi. La dashboard mostra Basic
  fino all'apertura dell'editor.
- **(B) Spostare l'effetto di riconciliazione dalla card al Navbar** — il ripristino avviene su tutte
  le viste, coerente con l'idea che la modalità è globale e il suo owner è l'header. Non aggiunge un
  secondo riconciliatore (ne sposta l'unico esistente), ma tocca `PropertiesWithTreeView.tsx` fuori
  dall'header e aggiunge un `useEffect` al Navbar → **richiede approvazione esplicita**.

**Raccomandazione: (B)**, perché è l'unica che soddisfa davvero «reload conserva la modalità» in tutte
le viste, ed è coerente con la ratifica (a) — la modalità è dell'app, non della card. Ma è una
deviazione dal perimetro dichiarato: decide Alfonso.

### 7.2 Tipografia — 13px del mockup o 12px dell'appbar?

Il §2.3 fissa «testo 13px weight 600» (valore B4). Nell'appbar il testo più grande è **12px** (menu
titles, navbar.scss:1616); il level badge è 11px. Un segmented a 13px sarebbe l'elemento tipografico
**dominante** della barra e porterebbe la larghezza da ~135px a ~145px.

**Raccomandazione: 12px** (geometria e colori B4 invariati), per non far gridare il controllo sopra il
resto dell'header. Se Alfonso preferisce l'aderenza letterale al mockup → 13px, costo trascurabile.

### 7.3 Terzo indicatore: `ModeIndicator` nella BottomBar

`BottomBar.tsx:50-84` renderizza un indicatore Basic/Advanced **cliccabile** (writer completo, con
toast) sempre visibile in basso. La ratifica (b) chiede «un solo writer visibile»: dopo B5 ne
resterebbero **due** — segmented nel Navbar e ModeIndicator nella BottomBar.

Fuori dal perimetro dichiarato di questo prompt (che nomina solo Navbar e card). **Domanda**: lo
lasciamo (e la ratifica si intende limitata all'header), o apriamo un B6 per rimuoverlo?
**Raccomandazione: lasciarlo ora**, valutarlo separatamente.

### 7.4 Toast e tutorial a ogni click

`enableAdvancedMode`/`disableAdvancedMode` mostrano un `U.alert` a ogni commutazione (e il tutorial
"advanced mode" la prima volta). Coerente con menu View e Cmd+Shift+M, ma su un segmented — cliccato
più spesso — può risultare rumoroso. B2 nella card **non** mostrava alcun toast.

**Opzioni**: (A) riusare le funzioni così come sono (toast+tutorial, coerenza totale con gli altri
writer del Navbar); (B) passare un flag per sopprimere il toast dal segmented.
**Raccomandazione: (A)** — zero nuovo codice, e il tutorial di prima attivazione resta agganciato dove
serve.

### 7.5 Perdita dell'affordance "Click to change in Settings"

Rimuovendo il badge sparisce la scorciatoia verso `openSettings('profile')`. Non è una regressione
funzionale (la Settings resta raggiungibile dal menu utente e la modalità ora si cambia in loco), ma è
un link in meno. Nessuna mitigazione proposta: segnalato per completezza.

### 7.6 Rischio residuo basso su `props.advanced`

Il segmento riflette Redux, che è il canale che tutti i consumatori già leggono → la card si aggiorna
live senza codice aggiuntivo. Nessun rischio di doppia fonte di verità **purché** non si introduca
stato locale nel componente (§6.3).

---

## 8. Checklist di verifica per la Fase 2 (dal §3 del prompt)

- [ ] `npm run build` exit 0 (solo chunk-size warning)
- [ ] `npm run typecheck` Δ0 sulla baseline (33)
- [ ] Segmented visibile nel Navbar in light e dark
- [ ] Card senza toggle, riga titolo integra (icona · PROPERTIES · pin · collapse)
- [ ] Commutare dal Navbar → Compartments/Badges/Matching compaiono/spariscono live nella card
- [ ] Reload conserva la modalità (⚠ dipende dalla decisione §7.1 — nell'editor sì in entrambe le
      opzioni, sulla dashboard solo con (B))
- [ ] Da vista matching, passare a Basic ripiega senza errori
- [ ] Edge e Row invariati
- [ ] Navbar su editor / summary / documentation / dashboard, e a larghezza ridotta: nessun wrap

---

**HARD STOP** — Fase 2 solo dopo go-ahead esplicito e risposta ai punti §7.1 e §7.2.
