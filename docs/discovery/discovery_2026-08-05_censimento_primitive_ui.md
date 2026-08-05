# Discovery — Censimento trasversale delle primitive UI

**Data**: 2026-08-05
**Tipo**: Fase 1 read-only. Nessuna modifica a file sorgente, nessun `git add`, nessun commit.
**Repo**: `jjodel`, branch `alfonso-frontend-jjtl`, working tree locale (HEAD `85fc8aa3e`).
**Perimetro di misura**: `frontend/src/`. Tutti i path citati sotto sono relativi a `frontend/`.
**Critical zone**: non toccata. `useJjomSync.ts` e `portDistribution.ts` non sono stati né letti né modificati: nessuna primitiva UI vive lì.

---

## 0. Obiettivo e come leggere questo documento

Il progetto vuole unificare il design system **per componente e trasversalmente**: una
primitiva alla volta, ovunque compaia. Questo censimento risponde a due domande, in
quest'ordine:

1. **Dove va misurato** — quali superfici dell'applicazione sono davvero raggiungibili
   (§1). Questa sezione viene prima perché il 4 agosto un censimento è stato eseguito su
   `frontend/src/examples/` senza verificare che fosse codice vivo: erano quattro blob
   senza importatori, e il risultato è valso per file che nessuno carica
   (`docs/discovery/discovery_2026-08-04_legacy_view_census_real_projects.md`, §"Perché è
   servito"). La stessa cautela vale qui.
2. **Quante implementazioni esistono** di ciascuna primitiva e dove (§2–§9).

Ogni finding porta `file:riga`. Dove una cosa **non esiste**, è detto esplicitamente con
il comando di ricerca che lo dimostra, invece di essere dedotto dal silenzio.

### Convenzione sui conteggi

- **call site** = occorrenza del tag JSX o della classe CSS in un file `.tsx`, esclusa la
  definizione del componente stesso.
- Un componente con **0 call site** è marcato `MORTO`. È un fatto verificabile con una
  `grep` globale, non una stima.
- Le stringhe `jsxString` (template di view persistiti in Redux) **non** sono contate come
  call site: sono sorgenti testuali, non JSX compilato. Vedi §1.5 — è una sottigliezza che
  può far sottostimare l'uso dei componenti `forEndUser/`.

---

## 1. Il perimetro reale

### 1.1 Le route

Unica tabella di routing: `src/App.tsx:131-167` (`HashRouter`). Non esiste altro router —
`src/router/Router.tsx` contiene la sola riga `export let deleted = true;`.

Le route esistono in due rami mutuamente esclusivi: `user` valorizzato (25 route) o no
(2 route: `confirm/:id/:token` e il fallback su `AuthPage`).

| Route | Componente radice | Raggiungibile da UI? | Stato |
|---|---|---|---|
| `/` → `/allProjects` | `Navigate` — `App.tsx:133` | sì (default) | vivo |
| `allProjects` | `AllProjectsPage` — `src/pages/AllProjects.tsx:1` | sì — logo navbar `Navbar.tsx:1809`, LeftBar `LeftBar.tsx:416`, 17 `navigate('/allProjects')` | **vivo, superficie principale** |
| `project` | `ProjectPage` — `src/pages/Project.tsx:37` | sì — click su una project card, `LeftBar.tsx:132` | **vivo, superficie principale** |
| `account` | `AccountPage` — `src/pages/Account.tsx` (690 righe) | sì — `RightPanel.tsx:107,110`, ma la colonna destra si monta solo se `active !== 'Project' && hasProjects` (`Dashboard.tsx:310,339`) | vivo, condizionato |
| `auth` | `AuthPage` — `src/pages/Auth.tsx` (724 righe) | sì — logout `Navbar.tsx:1987` | vivo |
| `templates` | `TemplatePage` — `src/pages/Templates.tsx:8` | sì — LeftBar `LeftBar.tsx:451` | **raggiungibile ma vuota**: renderizza solo `<ComingSoonPlaceholder>` |
| `explore` | `ExplorePage` — `src/pages/Explore.tsx:8` | sì — LeftBar `LeftBar.tsx:452` | **raggiungibile ma vuota**: renderizza solo `<ComingSoonPlaceholder>` |
| `usersInfo` | `UsersInfoPage` — `src/pages/UsersInfo.tsx:7` | solo `email === 'admin@gmail.it'` — `LeftBar.tsx:408-412` | **inerte**: `useState<DUser[]>([])` mai popolato, l'`useEffect` che lo popolava è commentato (`UsersInfo.tsx:9-15`) |
| `projectsInfo` | `ProjectsInfoPage_Obsolete` — `src/pages/ProjectsInfo.tsx:8` | solo admin | **inerte**, stesso pattern (`ProjectsInfo.tsx:10-15`). Il nome porta `_Obsolete` |
| `news` | `NewsPage` — `src/pages/News.tsx:5` | solo admin | **placeholder**: renderizza `<b>Ciao</b>` |
| `settings` | `SettingsPage` — `src/pages/Settings.tsx` | quasi no — unico link `JjodieWidget.tsx:187`, e `JjodieWidget` ha **0 consumatori** | **irraggiungibile in pratica** |
| `updates` | `UpdatesPage` — `src/pages/Updates.tsx` (223 righe) | **no link in app** | solo digitando `#/updates` |
| `profile` | `ProfilePage` — `src/pages/Profile.tsx:7` | **no link** | contiene link hardcoded a `/jjodel/2.0`, `/2.1`, `/2.2 (to come)` |
| `archive` | `ArchivePage` — `src/pages/Archive.tsx:5` | **no link** | **vuota**: `<div>Empty page, still in progress.</div>` |
| `community` | `CommunityPage` — `src/pages/Community.tsx:5` | **no link** | **vuota**: stesso testo |
| `notes` | `NotesPage` — `src/pages/Notes.tsx` (319 righe) | **no link** | codice presente, superficie non raggiunta |
| `recent` | `RecentPage_Obsolete` — `src/pages/Recent.tsx:74` | **no link** | il nome dichiara l'obsolescenza |
| `test-tokens` | `TokenPreviewPage` — `src/pages/TokenPreview.tsx:18` | **no link** | vetrina dei token, vedi §9 |
| `test-resize` | `TestLayout` — `src/components/TestLayout.tsx:4` | **no link** | banco di prova del resize handle |
| `editor-v2` | `EditorV2` — `src/components/editor-v2/EditorV2.tsx` | **no link** | montato senza `modelid` |
| `repro-v2flow` | `ReproHarness` — `src/components/editor-v2/repro/ReproHarness.tsx` | **no link** | harness di riproduzione bug RF 4/8 |
| `repro-v2flow-reactive` | `ReproHarnessReactive` | **no link** | idem |
| `*` (fallback) | `AllProjectsPage` | sì | vivo |
| `confirm/:id/:token` | `ConfirmAccount` — `src/pages/ConfirmAccount.tsx` | via email | vivo, fuori sessione |

Il commento `{/* non functioning stuff */}` a `App.tsx:148` precede esattamente il blocco
`settings … community`: la non-funzionalità è già dichiarata nel sorgente.

**Verifica delle attese del prompt.**
- *Explore "coming soon"*: **confermato** — `Explore.tsx:11-15`.
- *Templates renderizza una pagina senza nodi*: **da correggere**. Oggi Templates
  renderizza lo stesso `ComingSoonPlaceholder` di Explore (`Templates.tsx:11-15`, componente
  a `src/components/ComingSoonPlaceholder/ComingSoonPlaceholder.tsx:10`). Le due superfici
  sono ormai identiche nella struttura, non diverse. L'osservazione "renderizza vuoto" del
  censimento del 4 agosto descrive uno stato precedente al commit `047de54a2`
  (2026-04-27), che ha introdotto il placeholder.

### 1.2 Le superfici dentro il progetto aperto

`ProjectPage` → `Dashboard active='Project'` (`src/pages/components/Dashboard.tsx:305`) →
`Navbar` + `LeftBar` + `ProjectEditor`/`Dock`.

| Superficie | Radice | Raggiungibile | Note |
|---|---|---|---|
| Navbar app | `src/pages/components/Navbar.tsx` (2081 righe) | sì | contiene il segmented Basic/Advanced (`Navbar.tsx:1933`) |
| LeftBar progetto | `src/pages/components/LeftBar.tsx:321-405` | sì | 4 sezioni collassabili + azioni |
| Tab Metamodel | `MetamodelTab` — `src/components/abstract/tabs/MetamodelTab.tsx` via `TabDataMaker.metamodel` (`TabDataMaker.tsx:16`) | sì | |
| Tab Model | `ModelTab` via `TabDataMaker.model` (`TabDataMaker.tsx:26`) | sì | |
| Tab Documentation | `DocumentationTab` via `TabDataMaker.documentation` (`TabDataMaker.tsx:41`) | sì | |
| Tab Project summary | `ModelsSummaryTab` — `src/components/abstract/Dock.tsx:275` | sì | |
| Editor flow (canvas) | `EditorV2` via `EditorSwitch` — `src/components/abstract/tabs/EditorSwitch.tsx:129-139` | sì | **unica modalità viva** |
| Editor classic / split | — | **NO** | spento: `EditorSwitch.tsx:123-127` («Classic shutdown Fase 5a, decisione B 2026-07-17 … the classic/split modes are no longer reachable»). La preferenza in localStorage è ignorata |
| Pannello Properties | `PropertiesWithTreeView` → `Info.tsx` | sì | il pannello più denso di controlli |
| Pannello Viewpoints (NestedView + ViewData) | `src/components/editors/views/NestedView.tsx` | sì | `TabDataMaker.viewpoint()` è stato rimosso (`TabDataMaker.tsx:36-39`) |
| Pannelli authoring IR | `src/components/editor-v2/viewpoint/authoring/*` | sì | 8 file, i consumatori più moderni di `ui/` |
| Console / Jodie | `src/components/Jodie/*` | sì | |
| Modale Settings unificata | `UnifiedSettingsModal` via `SettingsModalContext` | sì — 9 chiamate a `openSettings()` | |
| **GlobalDrawer** (Settings / Account / Help) | `src/components/GlobalDrawer/GlobalDrawer.tsx:35` | **NO** | `openDrawer` è destrutturato a `Navbar.tsx:590` e **mai chiamato**: `grep -rn "openDrawer(" src/` restituisce solo la definizione nel context. Due dei tre pannelli sono comunque placeholder "coming soon" (`GlobalDrawer.tsx:27,32`) |
| HelpDrawer | `src/components/HelpDrawer.tsx` | sì — Fn+F1, capture phase | |

### 1.3 Modali e dialoghi: quelli morti

`grep` per il tag JSX di ciascuno, escluso il file di definizione:

| Componente | Call site | Esito |
|---|---|---|
| `src/components/megamodel/MegamodelModal-toDelete.tsx` | 0 | **MORTO** (il nome lo dichiara) |
| `src/components/panels/ElementPropertiesDrawer.tsx` | 0 | **MORTO** |
| `src/components/panels/BottomDrawer.tsx` | 0 | **MORTO** |
| `src/components/JjodieWidget/JjodieWidget.tsx` | 0 | **MORTO** (ed è l'unico link a `/settings`) |
| `src/components/export/ExportImageMenu.tsx` | 0 riferimenti in tutto `src/` | **MORTO** |
| `src/components/common/ExportImportMenu.tsx` | 0 riferimenti | **MORTO** |
| `src/components/Jodie/ProviderSelector.tsx` | 0 (solo il re-export in `Jodie/index.ts:9`) | **MORTO** |

### 1.4 Codice morto già noto, riconfermato

`src/examples/` (10 file + sottocartella): `grep -rn "examples/" --include="*.tsx" --include="*.ts" src/`
esclusi i file interni → **0 importatori**. Conferma la conclusione del report del 4 agosto.

### 1.5 Avvertenza metodologica: i `jsxString` non sono grep-abili come JSX

I componenti esportati da `src/joiner/components.tsx` (`Input`, `Select`, `Toggle`,
`Control`, `Slider`, `Panel`, `MetaElementPicker`, `ContextMenu`, …) costituiscono il
vocabolario JSX disponibile **dentro i template di view persistiti** (`jsxString` in
Redux). Un loro call site può quindi vivere in una stringa, non in un `.tsx`.

Esempio concreto: `src/common/DV.tsx:1320-1321` contiene `<Toggle name='grid'>` e
`<Toggle name='snap'>`, ma **dentro un template literal** che è sorgente di `jsxString`, non
JSX compilato. Il `Toggle` in questione è `Toggle_Obsolete` (`components.tsx:41`).

Conseguenza per il piano di migrazione: **la superficie `forEndUser/` non si misura con
una grep sui `.tsx`**. Il numero reale di call site dipende dai template salvati nei
progetti degli utenti, che è la stessa misura fatta il 4 agosto sui progetti reali. Con lo
spegnimento del classic editor (§1.2) è plausibile che quei template non siano più
valutati, ma **non è verificato in questa sessione** ed è la OQ-1 di §12.

---

## 2. Controlli booleani

**14 implementazioni distinte.** Il censimento del 28 luglio ne contava 5 sul solo pannello
Properties; allargando a tutta la piattaforma il numero quasi triplica, e — dato non
previsto — **la primitiva canonica `ui/Checkbox` non è usata da nessuno**.

| # | Implementazione | Definizione | Call site | Superfici | Resa (off → on) | Scrive su |
|---|---|---|---|---|---|---|
| B1 | `ui/Toggle` | `src/components/ui/Toggle/Toggle.tsx:52` + `Toggle.module.css` | **31** in 14 file | authoring IR, Properties, ViewData | pillola 36×20 (md) / 28×16 (sm) / 24×14 (xs); off `#cbd5e1`, **on `#0ea5e9` cyan**; thumb bianco 16/12/10px | dipende dal call site: IR (`irDefaults`), `SetFieldAction` su `DViewElement`, stato locale |
| B2 | `ui/Checkbox` | `src/components/ui/Checkbox/Checkbox.tsx:25` + `Checkbox.module.css:7` | **0** — solo il barrel `ui/index.ts:40` | nessuna | quadrato 18×18, `--radius-sm`; on `#334155` slate | — |
| B3 | `.bool-toggle` | `src/components/editors/info-improvements.scss:1630` | **1** (`src/components/editors/Info.tsx:718-731`) | Properties → slot `EBoolean` di un `DValue` M1 | pillola 32×18; off `#cbd5e1`, on `#0ea5e9`; knob 14px; label testuale `true`/`false` a fianco | modello (`LValue.setValueAtPosition` via `changeDValue`, dentro `TRANSACTION`) |
| B4 | `.viewpoint-checkbox` | `src/components/editors/views/nestedView.scss:1238-1296` | **1** (`NestedView.tsx:155`) | pannello Viewpoints, viewpoint di tipo overlay | 16×16 raggio 4px; on `#0891b2` cyan-600 | **niente**: `checked={false}` hardcoded e `onChange` con `{/* TODO: overlay selection logic */}` (`NestedView.tsx:158-160`) |
| B5 | `.viewpoint-radio` | `nestedView.scss:1182-1231` | **1** (`NestedView.tsx:145-153`) | stesso pannello, viewpoint esclusivi | cerchio 16×16, pallino 6px `#64748b` | `select(d.id)` → viewpoint attivo |
| B6 | `.jjodel-switch` / `-track` / `-thumb` | `src/styles/components/_switch.scss:7,58,83` | **0 in `.tsx`** (solo riferimenti da altri SCSS: `info-improvements.scss:396`, `info.scss:780`) | nessuna | 36×20; off `#cbd5e1`, **on `#334155` slate** — il file dichiara «slate — NOT cyan» | — |
| B7 | `.toggle` / `.form-toggle` / `.toggle-switch` (alias) | `src/styles/components/_form-system.scss:332-410` | **0 in `.tsx`** per `.form-toggle`; `.toggle-switch` usato solo da B8 e da classi namespaced | — | 36×20; off `var(--form-toggle-bg)` `#cbd5e1`, on `var(--form-toggle-bg-active)` `#475569` | — |
| B8 | `ui/VerticalToggle` | `src/components/ui/VerticalToggle.tsx:14` + `VerticalToggle.scss` | **0** | nessuna | pillola verticale, off trasparente + bordo slate, on slate-900 | — |
| B9 | `.settings-toggle-switch` | `src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.scss:690` (`&-switch` sotto `.settings-toggle`) | **3** (`sections/ProfileSection.tsx:385,416,433`) | modale Settings → Profile | 36×20; off `#cbd5e1`, on `#334155` slate | Redux (`SetRootFieldAction.new('advanced', …)`), `windoww.advanced` |
| B10 | `.jodie-toggle-slider` | `src/components/Jodie/SettingsModal.css:206-239` | **1** (`Jodie/SettingsModal.tsx:94`) | modale Jodie | pillola CSS classica con `input:checked +` | `localStorage['jjodie-settings']` |
| B11 | `.jjtl-dialog__toggle-switch` | **nessuna definizione SCSS** — `grep -rn "jjtl-dialog__toggle" --include="*.scss" src/` → 0 | **1** (`src/jjtl/components/dialogs/JjtlInputDialog.tsx:108`) | dialoghi JjTL | classe orfana, resa non definita | stato locale del dialogo |
| B12 | `ToggleComponent_Obsolete` | **duplicato in due file**: `src/components/forEndUser/Control.tsx:544` e `src/components/forEndUser/Panel.tsx:227` | via `joiner/components.tsx:41` (alias `Toggle`) → `DV.tsx:1320,1321` in `jsxString` | template di view, vedi §1.5 | `.toggle` + `.toggle-input` + `.toggle-label` + `.toggle-labels` | `props.node.state` (stato del `LGraphElement`) |
| B13 | `EditCheckbox` | `src/pages/components/Edit/Edit.tsx:290`, dispatch a `:390` | 1 (interno a `Edit`) | card di progetto | `<input type="checkbox">` nativo | proprietà del `DProject` |
| B14 | `<input type="checkbox">` nativo, senza wrapper | **30 occorrenze in 21 file** | 30 | Settings, export, logger, catalog, BulkActionsBar, ProviderModelSelector, dialoghi JjTL, NodeEditor, GraphData, PermissionModelTab/ViewTab/ViewpointTab, widgets, Auth… | **vedi il gotcha sotto** | varie |

### 2.1 Il gotcha del checkbox nativo

`src/styles/tokens/index.scss:106-112` nasconde **globalmente** ogni checkbox nativo:

```scss
input[type="checkbox"] {
  position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
}
```

Il blocco che avrebbe dovuto ridisegnarlo (`::before` con `width/height/border`,
`tokens/index.scss:115-132`) **è commentato**. Restano attive solo le regole di stato
(`:checked`, `:hover`, `:focus`, `:disabled`, righe 143-174), che colorano un `::before`
mai dimensionato. `index.scss` è importato da `src/App.scss:6`, quindi vale su tutta
l'app.

Conseguenza: le 30 occorrenze di B14 sono **invisibili e non cliccabili** salvo che il
componente si ridefinisca il proprio stile. 19 file SCSS lo fanno (in testa
`viewoptions.scss` con 15 regole, `nestedView.scss` con 8, `forEndUser/toggle.scss` con 5).
Gli altri no.

Caso concreto: B4. Il `<label className="viewpoint-checkbox">` di `NestedView.tsx:155-162`
**non renderizza più** lo `<span className="viewpoint-checkbox__custom">` che il fratello
radio invece renderizza (`:152`). Le ~130 righe di CSS `\.viewpoint-checkbox__custom` in
`nestedView.scss` (righe 1255-1296, 1933-1950, 3085-3100) sono quindi irraggiungibili, e
il controllo è un `<label>` vuoto.

### 2.2 Divergenza fra `CLAUDE.md` §7.1 e l'implementazione

`CLAUDE.md` §7.1 prescrive: «Horizontal toggle switches: 36×20 px. Active `#334155`
(slate, **not cyan**)».

- B6, B7, B9 rispettano la regola (on = slate).
- **B1 (`ui/Toggle`, la primitiva più usata, 31 call site) e B3 la violano**: `on = #0ea5e9`
  cyan, con il commento `/* CHECKED STATE - active = cyan accent #0ea5e9 (design system A) */`
  (`Toggle.module.css:77-80`).
- B2 (`ui/Checkbox`) porta il commento opposto: `/* Checked = slate #334155 (design system A: cyan is accent-only, never a fill) */`
  (`Checkbox.module.css:38`).

Due file della stessa cartella `ui/` citano lo stesso "design system A" per giustificare
scelte opposte. Non è una svista di un singolo file: è un canone non deciso.

---

## 3. Select, dropdown e picker

**9 implementazioni.**

| # | Implementazione | Definizione | Call site | Note |
|---|---|---|---|---|
| S1 | `ui/Select` | `src/components/ui/Select/Select.tsx` | **45** in 21 file | wrapper su `<select>` nativo; `size: 'sm'\|'md'\|'lg'`, `options: SelectOption[]`. Maggior consumatore: `editor-v2/viewpoint/authoring/*` |
| S2 | `ui/JjSelect` | `src/components/ui/JjSelect/JjSelect.tsx` | **5** (`editors/Info.tsx` ×3, `forEndUser/Input.tsx` ×2) | wrapper su **`react-select`**, unico consumatore della dipendenza in tutto `src/`. Stili co-locati in JS (non SCSS) per scelta esplicita, motivata nel docblock. Focus slate `#334155`, selected cyan `#0ea5e9` |
| S3 | `<select>` nativo nudo | — | **65 occorrenze in 42 file** | envgen (5 in `DesignStep.tsx`), polymetric (3), `forEndUser/Input.tsx` (3), `ViewProperties.tsx` (3), `Info.tsx` (7), `MTM.tsx`, `ObjectNode.tsx`, `DockLayout.tsx`, Auth, Account… |
| S4 | `.jj-slot-value-select` (picker dentro `builder.value()`) | `src/components/editors/Info.tsx:612` — markup a `:741`, `:747`, `:754` | 3 rami (`isEnumerator`, `isReference`, `isComposition`) | `<select>` nativo con `<option>` da `value.validTargetsJSX`; sentinella `'undefined'` come prima opzione. È il picker dei valori M1 |
| S5 | `forEndUser/Select` (via `joiner/components.tsx:19`) | `src/components/forEndUser/Input.tsx` | 6 (di cui **3 in `jsxString`** a `DV.tsx:1614,1655,1684`) | vocabolario dei template di view, vedi §1.5 |
| S6 | `forEndUser/Selector` | `src/components/forEndUser/Selector.tsx:198` | **0** | **MORTO** |
| S7 | `forEndUser/MySelect` | `src/components/forEndUser/MySelect.tsx:146` | **0 riferimenti in tutto `src/`** | **MORTO** |
| S8 | `forEndUser/DropDownButton` | `src/components/forEndUser/DropDownButton.tsx` | **0 riferimenti** | **MORTO** |
| S9 | `forEndUser/CountryPicker` | `src/components/forEndUser/CountryPicker.tsx` | 1 (auto-riferimento di tipo) | di fatto morto |

### 3.1 Combo costruite a mano (menu assoluto, non `<select>`)

| Componente | File | Call site |
|---|---|---|
| `ColorSchemeSelector` | `src/components/editor-v2/components/ColorSchemeSelector.tsx` (13 `<button>`) | 1 (`editor-v2/Toolbar.tsx:368`) |
| `ProviderModelSelector` | `src/components/common/ProviderModelSelector.tsx` | 3 (`DocumentationTab.tsx:967`, `JodieHeader.tsx:182`, `SuggestedMappingsPanel.tsx:570`) |
| `TabsOverflowMenu` | `src/components/dock/TabsOverflowMenu.tsx` | 1 (`abstract/Dock.tsx:387`) |
| `MetaElementPicker` | `forEndUser/Control.tsx` | 6, **tutti interni a `Control.tsx:351-358`** |
| `ui/ColorPicker` | `src/components/ui/ColorPicker/ColorPicker.tsx` | 6 (authoring IR) |
| menu "New document" | `src/pages/components/Navbar.tsx:260-300` | 1 — ha già un flag `entry.comingSoon` (`:295`) |
| `ContextMenu` | `src/components/contextMenu/ContextMenu.tsx` | vari; nota a `:429` un item con `tooltip: 'Coming soon'` |
| `ProviderSelector` (×2) | `Jodie/ProviderSelector.tsx`, `common/ProviderSelector.tsx` | **0** — MORTI |

**Chip multi-select**: `forEndUser/inputselect.scss` è importato da 5 file
(`Selector`, `MTM`, `MySelect`, `CountryPicker`, `Input`), di cui 3 morti. `viewapplyto.scss`
serve `editors/views/data/InfoData.tsx:27`. Sono le due implementazioni di chip citate in
`CLAUDE.md` §7.1.

---

## 4. Sezioni collassabili e disclosure

**11 meccanismi distinti.** Nessuno condiviso fra più di una superficie.

| # | Meccanismo | Definizione | Call site | Dove vive lo stato | Persistito? |
|---|---|---|---|---|---|
| C1 | `CollapsibleSection` locale di Info | `src/components/editors/Info.tsx:36` (classi `.props-section*`) | **25** dentro `Info.tsx` | `useState(defaultOpen)` — `Info.tsx:38` | **no** — si riapre a ogni remount |
| C2 | `ModeSystem/CollapsibleSection` | `src/components/ModeSystem/CollapsibleSection.tsx:33` | **0** | prop `expanded` controllata | — **MORTO** |
| C3 | `useAdvancedSections` | `src/hooks/useAdvancedSections.ts:24` | **0** consumatori | `localStorage['jjodel_advanced_sections']` | sì, ma **MORTO**: la chiave non compare fra quelle scritte a runtime |
| C4 | `ModeSystem/ModeToggle` | `src/components/ModeSystem/ModeToggle.tsx:26` | **0** | — | **MORTO** |
| C5 | Sezioni della LeftBar progetto | `src/pages/components/LeftBar.tsx:279-315` (`.psb-section`, chevron `:290`) | 5 (`metamodels`, `models`, `transformations`, `viewpoints`, `project`) | `useState<Record<string,boolean>>` — `LeftBar.tsx:251` | **no** — commento esplicito «local-only» |
| C6 | `Menu mode='collapsable'` | `src/pages/components/menu/Menu.tsx:40` | 6 (Administration, Filters, Favorites, Browse, Recently Modified, Resources) | `useState(false)` | no |
| C7 | `ui/FormSection` | `src/components/ui/FormSection/FormSection.tsx:25` | 11 (8 in `VertexAuthoringPanel`) | **non è collassabile**: titolo + divider, nessuno stato | n/a |
| C8 | Visibilità pannelli Properties / TreeView | `src/components/editors/PropertiesWithTreeView.tsx:29,33,40,49,54` | — | `useState` + `useEffect` | **sì** — 5 chiavi `jjodel_property_*` |
| C9 | TreeView sidebar | `src/components/TreeViewSidebar/TreeViewSidebar.tsx:21-22`; contesto `src/contexts/TreeViewPanelContext.tsx:60` | — | context + `useState` | **sì** — `jjodel_tree_view_open`, `jjodel_tree_view_width`, `jjodel_treeview_visible` |
| C10 | Features panel | `src/contexts/FeaturesPanelContext.tsx:14` | — | context | **sì** — `jjodel.features-panel.expanded` |
| C11 | Collassabili della Console | `Console/CollapsibleJSONViewer.tsx`, `CollapsibleShortcuts.tsx`, `CollapsibleContextKeys.tsx` | 3 componenti separati | `useState` locale | no |

**Osservazione.** Tre chiavi diverse governano la visibilità del tree view
(`jjodel_tree_view_open`, `jjodel_treeview_visible`, più `jjodel_property_tree_view_width`),
scritte da tre file diversi: `TreeViewSidebar.tsx:21`, `TreeViewPanelContext.tsx:60`,
`PropertiesWithTreeView.tsx:29`. Non è verificato in questa sessione se convergano.

---

## 5. Bottoni

| Metrica | Valore |
|---|---|
| `ui/Button` — varianti dichiarate | 4: `primary \| secondary \| danger \| ghost` (`Button.tsx:4`), 3 size `sm\|md\|lg`. Il docblock dichiara «ALL ARE OUTLINE STYLE» |
| `ui/Button` — call site | **39** in 18 file (3 dei quali nel `FormExample` morto) |
| `<button>` HTML nudo | **631 occorrenze in 186 file** |
| Rapporto | ~1 bottone del design system ogni **16** bottoni scritti a mano |
| Classi CSS contenenti `btn`/`button` | **253 distinte**; **192 famiglie** dichiarate come selettore di primo livello |

**Sistema canonico dichiarato**: `src/styles/components/_buttons.scss` (importato da
`App.scss:12`), che definisce `.btn` + 9 varianti: `.btn-primary`/`-primary-solid` (`:69`),
`.btn-secondary`/`-secondary-outlined` (`:103`), `.btn-outline` (`:130`), `.btn-ghost` (`:155`),
`.btn-danger` (`:179`), `.btn-slate` (`:268`), `.btn-slate-gradient` (`:287`), size `.btn-sm`
(`:202`) / `.btn-lg` (`:212`), `.btn-block` (`:227`), `.btn-icon` (`:232`), `.btn-group` (`:253`).
Usato in `.tsx` con `className` contenente `btn`: **228 occorrenze**.

Le 192 famiglie sono quindi tre canoni sovrapposti — `ui/Button` (39), `.btn*` (228),
e ~180 classi locali nate una volta sola (`.dock-tab-btn` 14, `.toolbar-btn` 12,
`.action-btn` 11, `.add-btn` 10, `.properties-btn` 9, `.provider-btn` 6, `.test-btn` 4,
`.tree-generate-btn` 2, …) — più i 631 `<button>` senza classe di sistema.

`_buttons.scss:307-345` contiene già un blocco di **rattoppo retroattivo** che intercetta
`.save-btn, .btn-save, …` e `&[style*="gradient"], &[style*="slate"]`: un selettore che
insegue lo stile inline è il sintomo che la divergenza è nota e non governata.

---

## 6. Header di pannello

**182 classi CSS distinte** contenenti `header`. Le famiglie con più di un consumatore:

| Pattern | Definizione | Consumatori | Struttura |
|---|---|---|---|
| `.props-header` + `__icon` `__name` `__badge` | `src/components/editors/info-improvements.scss:865-910` | **2**: `Info.tsx:905-909` (metaclasse) e `ViewData.tsx:184` con modifier `--view` | icona + nome + badge |
| `.props-header--view` | `properties-with-tree-view.scss:307`, `nestedView.scss:3692,3717` | 1 (`ViewData.tsx:184`) | **divergenza documentata nel sorgente**: `nestedView.scss:3652-3658` spiega che `.view-entity-header` è «un SECONDO header» che riusa le classi globali `.props-header*` |
| `.props-section__header` | `Info.tsx:41-53` | 1 (interno a C1) | titolo + chevron, è l'header della sezione collassabile |
| `.psb-section-header` | `LeftBar.tsx:290`, `:378` | 2 | label + chevron |
| `SectionHeader` (componente React) | `src/components/project/ProjectEditor.tsx:137` | 3 (`:2251`, `:2591`, `:2617`) | title + count + primaryAction + secondaryAction |
| `.settings-section-header` | `pages/settings.scss` | 7 | |
| `.envgen-section-header` | `EnvGenWizardModal.scss` | 6 | |
| `.project-section-header` + `__title` `__actions` `__count` | `project-card.scss` | 3 | |
| `.panel-header` | vari | 7 | |
| `.dialog-header` / `.modal-header` | vari | 8 / 5 | |
| altri (`.page-header`, `.properties-panel-header`, `.view-editor-header`, `.style-section-header`, `.mp-section-header`, `.events-section-header`, `.prompts-section-header`, `.tree-view-panel-header`, `.jj-slot-header`, …) | | 1 ciascuno | |

**Dove divergono**: `.props-header` porta uno slot `__badge` (`info-improvements.scss:903`)
che il solo consumatore `Info.tsx` non usa; `SectionHeader` di `ProjectEditor` ha `count` e
due slot azione che `.props-header` non ha; `.props-section__header` ha il chevron che gli
altri due non hanno. Le tre astrazioni coprono lo stesso ruolo semantico con tre contratti
diversi e zero codice condiviso.

---

## 7. Spacing, colore, tipografia

### 7.1 Chi definisce valori

| File | Vocabolario | Entry point |
|---|---|---|
| `src/styles/tokens/` (9 partial + `index.scss`) | `--space-*`, `--text-*`, `--font-*`, `--color-*` (172 light / 159 dark), `--radius-*`, `--shadow-*`, `--transition-*`, `--z-*`, `--gr-*` | `@import './styles/tokens/index'` da `src/App.scss:6` e da `src/styles/diagram.scss:6` |
| `src/styles/tokens.css` (288 righe) | **`--spacing-*`**, **`--font-size-*`**, `--font-weight-*`, `--color-slate-*` / `-cyan-*` / `-red-*` / `-yellow-*` … | `import './styles/tokens.css'` da `src/App.tsx:8` |
| `src/styles/variables.scss` (116 righe) | `--color`, `--accent-secondary`, `--danger`, `--bg`, `--palette-*`, `--side-padding: 31px`, `--knob: 16px` | `@import "./variables"` da `style.scss:1` e `view.scss:6` |
| `src/styles/components/_form-system.scss` | `--form-input-*`, `--form-toggle-*`, `--form-label-*`, `--form-field-gap` (33 variabili) | `@import` da `style.scss:2` |
| `src/styles/components/_switch.scss` | valori letterali, nessuna variabile | `style.scss:3` |
| `src/styles/components/_buttons.scss` | valori letterali | `App.scss:12` |
| **30 file SCSS** con palette privata `$color-*` | in testa `tree-view-sidebar.scss` (30 def.), `logger.scss` (23), `nestedView.scss` (23), `jjtl.scss` (17), `forEndUser/tree.scss` (17) | locali |
| **7 file SCSS** con scala spacing privata `$spacing-*` | `console-tab.scss`, `nestedView.scss`, `syntax-error-modal.scss`, `forEndUser/tree.scss`, `execute-transformation-dialog.scss`, `jjtl.scss`, `MappingTraceView.scss` | locali |
| 17 file `*.module.css` sotto `src/components/ui/` | consumano `--spacing-*`, `--font-size-*`, `--radius-*`, `--input-border-*`, `--transition-*` | CSS Modules |

### 7.2 Quante scale di spacing coesistono: **quattro**

1. `--space-0 … --space-24`, base 4px, `tokens/_spacing.scss:13-25` (+ alias
   `--gap-xs…xl`, `--panel-padding*`, `--button-padding-*`).
2. `--spacing-0 … --spacing-16`, base 4px in **px** anziché rem, `tokens.css:122-133`.
   È la scala che **i CSS Module di `ui/` usano davvero**: `Toggle.module.css:5`
   (`var(--spacing-3)`), `Checkbox.module.css:4` (`var(--spacing-2)`), 39 occorrenze totali.
3. `$spacing-xs/sm/md/lg` SCSS, ridefinita **7 volte** con valori non identici fra file
   (es. `nestedView.scss:30-33` → 4/8/12/16).
4. La scala documentata in `CLAUDE.md` §7.1 — «Grid: 8px base. Standard padding: 8 / 12 / 16 / 24» —
   che non corrisponde alla base 4px di nessuna delle tre implementazioni.

Le due scale CSS (1 e 2) **non sono alias l'una dell'altra**: sono due dichiarazioni
indipendenti che coincidono per valore ma non per nome. Chi scrive `var(--space-3)` e chi
scrive `var(--spacing-3)` ottiene 12px in entrambi i casi, ma un cambio in un file non
propaga all'altro.

### 7.3 Valori hardcoded — ordine di grandezza

Colori esadecimali negli stylesheet (`.scss` + `.css`), **8 633 occorrenze**:

| Cartella | Occorrenze |
|---|---|
| `src/components/` | ~6 191 |
| `src/pages/` | ~1 013 |
| `src/styles/` | ~682 (in gran parte legittime: è dove i token si definiscono) |
| `src/jjtl/` | ~343 |
| `src/jjscript/` | ~272 |
| `src/common/` | ~69 |
| `src/view/` | 0 |

Esadecimali dentro `.tsx`/`.ts` (stile inline, palette derivate): **555**.

Misure in px negli stylesheet: **14 548 occorrenze**, su **134 valori distinti**.
190 file `.scss` in totale.

### 7.4 Tipografia

`font-size` dichiarati negli stylesheet: **2 698 dichiarazioni**, **128 valori distinti**.
I dieci più frequenti sono tutti letterali:

| Valore | Occorrenze |
|---|---|
| `12px` | 422 (+21 con `!important`) |
| `13px` | 377 (+17) |
| `14px` | 310 |
| `11px` | 308 (+14) |
| `10px` | 211 |
| `16px` | 117 |
| `var(--text-sm)` | 76 |
| `18px` | 67 |
| `$font-size-sm` | 58 |
| `$font-size-xs` | 52 |

I token (`var(--text-*)`) coprono ~150 dichiarazioni su 2 698, cioè **~5%**.

Esistono **tre** vocabolari tipografici paralleli:
`--text-xs…2xl` (`tokens/_typography.scss:28-33`, 11/13/15/18/24/32px),
`--font-size-xs…3xl` (`tokens.css:144-151`, 11/12/13/14/16/18/20/24px — **valori diversi a
parità di nome logico**: `sm` è 13px nel primo e 12px nel secondo, `base` 15px vs 13px),
e `$font-size-*` SCSS ridefinito localmente in almeno 2 file (`nestedView.scss:9-12`,
`syntax-error-modal.scss:31-34`).

### 7.5 Token legacy: calibrazione di `CLAUDE.md` §7.2

| Token | Stato dichiarato in `CLAUDE.md` | Misura odierna |
|---|---|---|
| `--accent` | «1 residuo in `EditorV2.scss:857`» | **31 occorrenze in 7 file**: `EditorV2.scss` 19, `redux/defaults/views.ts` 5, `tree-view-sidebar.scss` 3, `classic-object-view.scss` 1 (commento), `metrics.scss` 1, `forEndUser/control.scss` 1, `properties-with-tree-view.scss` 1 |
| `--bg-1` … `--bg-5` | eliminati | `--bg-2` 2, `--bg-3` 2, gli altri 0 |
| `--secondary`, `--terziary` | eliminati | **0** — confermato |
| `--radius` | legacy | 9 usi; ancora **definito** come mapping a `tokens/_radius.scss:39` |
| `--color` | legacy | 3 usi; ancora **definito** a `variables.scss:24` |

La riga «Current state: 1 residual `var(--accent)`» di `CLAUDE.md` §7.2 è quindi disallineata
di un ordine di grandezza. Segnalato, non corretto (il prompt vieta di toccare `CLAUDE.md`).

---

## 8. Il caso del controllo di scelta

**L'assunzione del prompt è smentita.** Non esiste una primitiva segmented condivisa, ma
esistono **almeno 12 controlli a scelta esclusiva costruiti a mano**, di cui 9 vivi. La
nuova primitiva non parte da zero: parte da qui.

| # | Implementazione | Markup | CSS | Opzioni | Stato |
|---|---|---|---|---|---|
| E1 | `.appbar-mode-switch` (Basic / Advanced) | `src/pages/components/Navbar.tsx:1933-1944` — `role="group"`, `aria-pressed` | `navbar.scss:2111-2140`, dark `:2273` | 2 | **vivo**, è il writer unico dell'interface mode globale |
| E2 | `.jodie-mode-switch` (console mode) | `src/components/Jodie/JodieHeader.tsx:191-205` — `role="tablist"`, `aria-selected` | `Jodie/*.scss` | 3 | **vivo**. Il commento lo chiama «segmented pill» |
| E3 | `.wp-type-segmented` (tipo di viewpoint) | `src/components/editors/viewpoint/properties/ViewpointProperties.tsx:57-68` | `viewpoint/properties/properties.scss:237-238` | N da `typeOptions` | **vivo**, 2 consumatori (`Info.tsx:1202`, `WorkbenchProperties.tsx:48`) |
| E4 | `.lang-toggle` (linguaggio del predicato) | `src/components/editors/viewpoint/PredicateEditor.tsx:74-80` | `viewpoint/editors.scss:138` («Language Toggle — segmented button for Predicate») | N | **vivo** |
| E5 | `.marker-preview-toggle` (head / tail) | `src/components/editors/EdgeMarkerEditorModal.tsx:384-397` | `EdgeMarkerEditorModal.scss:518` (sotto il commento «Segmented Toggle (shared base)» a `:481`) | 2 | **vivo** |
| E6 | `.jjtl-dual-panel-view-toggle` | `src/jjtl/views/DualMetamodelPanel.tsx:262` | `jjtl.scss:1048-1092` (incl. `__badge`) | N | **vivo** |
| E7 | `.mode-selector` | `src/jjtl/views/SuggestedMappingsPanel.tsx:569` | `jjtl.scss:1877` | N | **vivo** |
| E8 | `.editor-view-mode-toggle` | `src/components/editors/EditorFullscreenModal.tsx:250` | `EditorFullscreenModal.scss:397` | N | **vivo** |
| E9 | `.radio-group` (visibilità progetto) | `src/components/CreateProjectDialog/CreateProjectDialog.tsx:151-195` — 3 `<input type="radio">` | `create-project-dialog.scss:377` | 3 | **vivo** |
| E10 | radio del tema (light / dark) | `src/pages/settings/AppearanceSettings.tsx:27,46` | `settings.scss` | 2 | vivo ma la pagina è irraggiungibile (§1.1) |
| E11 | `.mode-toggle` di `ModeSystem` | `src/components/ModeSystem/ModeToggle.tsx:26-45` | `mode-system.scss:28` | 2 | **MORTO** — 0 call site |
| E12 | `.editor-mode-toggle` (flow / classic / split) | nessun markup | `EditorV2.scss:253-256` | 3 | **CSS MORTO** — `grep` restituisce solo la definizione SCSS; il segmented è caduto con il classic shutdown (`EditorSwitch.tsx:123`) |

Vicini ma non segmented, da valutare come casi limite: `.jj-segmented-control`
(`info-improvements.scss:1034-1035`, «Segmented control (Basic/Advanced)») — **CSS senza
consumatori**; il "segmented switch" di `ui/ConditionalEditor.tsx:89`, che il commento
descrive come «one mode selector» ma è implementato come coppia di `Toggle`;
`.view-toggle` di `catalog.scss:67`; `.form-radio-group` di `forms.scss:263`;
`.btn-group` di `_buttons.scss:253`.

**Candidato più maturo come base**: E1 e E2. Sono gli unici due con semantica ARIA corretta
(`role="group"` + `aria-pressed`, `role="tablist"` + `aria-selected`), rendering per mappa
sull'array di opzioni, e modifier `__opt` / `__opt--active` coerenti fra loro. E3 ha la
stessa struttura ma senza ARIA.

---

## 9. Precedenti di vetrina

**Esistono tre precedenti, tutti raggiungibili solo digitando l'URL.**

| Precedente | Path | Route | Stato |
|---|---|---|---|
| `TokenPreview` | `src/pages/TokenPreview.tsx` (226 righe) + `tokenPreview.scss` | `#/test-tokens` — `App.tsx:140` | **funzionante e riusabile.** Sezioni: Colors (swatch per bg/border/text/accent/semantic), Typography (5 size + font samples), Spacing, Shadows, Border Radius. Ha un toggle light/dark che scrive `data-theme` sull'`<html>` (`TokenPreview.tsx:22-26`). Il docblock dice «TO USE: Add a route in your router: /test-tokens» — la route c'è |
| `FormExample` | `src/components/ui/examples/FormExample.tsx` (153 righe) | nessuna | **orfano**: 0 importatori. Dimostra `Button`, `Input`, `Select`, `Toggle`, `FormSection` in un form completo. È già lo scheletro di una pagina "componenti" |
| `TestLayout` | `src/components/TestLayout.tsx` | `#/test-resize` — `App.tsx:142` | banco di prova del solo resize handle |

**Storybook: assente.** `ls .storybook` → non esiste; `find src -name "*.stories.*"` → 0 file.

**Raccomandazione (nel report, non nel codice)**: la vetrina viva non va creata da zero.
`TokenPreview` copre già token e temi; `FormExample` copre già i componenti. Montare il
secondo dentro il primo, e aggiungere una voce di navigazione a `LeftBar.tsx:474` (sezione
Resources) o una route dedicata, costa molto meno che ripartire.

---

## 10. Tabella riassuntiva

| Primitiva | Implementazioni | di cui morte | Call site totali | Implementazione canonica candidata |
|---|---|---|---|---|
| Controllo booleano | **14** | 5 (`ui/Checkbox`, `ui/VerticalToggle`, `.jjodel-switch`, `.form-toggle`, `.jjtl-dialog__toggle-switch` senza CSS) | ~72 (31 `ui/Toggle` + 30 `<input>` nativi + 11 altri) | `ui/Toggle` per uso, `.jjodel-switch` per conformità a `CLAUDE.md` §7.1 — **decisione aperta**, vedi §12 OQ-2 |
| Select / dropdown | **9** + 8 combo a mano | 4 (`Selector`, `MySelect`, `DropDownButton`, `ProviderSelector` ×2) | ~121 (45 `ui/Select` + 65 nativi + 5 `JjSelect` + 6 `forEndUser`) | `ui/Select`; `JjSelect` resta il caso multi-value |
| Collassabile / disclosure | **11** | 3 (`ModeSystem/CollapsibleSection`, `useAdvancedSections`, `ModeToggle`) | ~45 | `Info.tsx:36` per uso (25 call site), ma è locale e non persiste |
| Bottone | **3 canoni** + ~180 classi one-off | — | 39 `ui/Button` + 228 `.btn*` + **631** `<button>` | `ui/Button` (4 varianti dichiarate) |
| Header di pannello | **~12 famiglie** con >1 consumatore, 182 classi | — | ~50 | `.props-header` (2 consumatori) o `SectionHeader` (3) |
| Scala di spacing | **4** | — | 39 usi di `--spacing-*`, N.D. per `--space-*` | `--space-*` (`tokens/_spacing.scss`) per dichiarazione, `--spacing-*` per uso reale in `ui/` |
| Scala tipografica | **3** | — | 2 698 dichiarazioni, ~5% via token | `--text-*` |
| Palette colore | **1 canonica + 30 private** | — | 8 633 hex negli stylesheet, 555 nei `.tsx` | `tokens/_colors-light.scss` + `_colors-dark.scss` |
| Controllo di scelta esclusiva | **12** | 2 (`ModeToggle`, `.editor-mode-toggle`) + `.jj-segmented-control` orfano | ~12 | E1 `.appbar-mode-switch` / E2 `.jodie-mode-switch` |
| Vetrina | **3** precedenti | 1 (`FormExample`, orfano) | — | `TokenPreview` esteso |

---

## 11. Dipendenze e rischi

1. **`tokens/index.scss:106` è un moltiplicatore di rischio.** Nasconde globalmente ogni
   `<input type="checkbox">`. Unificare i controlli booleani senza rimuoverlo contestualmente
   significa migrare a una primitiva che poi verrà nascosta, o lasciare 19 file di override
   difensivi che diventano regole zombie. Va deciso **prima** della prima migrazione, non
   durante.
2. **Canone del colore "on" non deciso.** `ui/Toggle` (cyan) e `ui/Checkbox` (slate) citano
   entrambi "design system A". `CLAUDE.md` §7.1 sta con slate; la primitiva con 31 call site
   sta con cyan. Migrare 14 implementazioni verso un canone non deciso significa rifare il
   lavoro due volte.
3. **Due sistemi di token caricati insieme.** `App.tsx:8` importa `tokens.css`
   (`--spacing-*`, `--font-size-*`); `App.scss:6` importa `tokens/index.scss`
   (`--space-*`, `--text-*`). Nessuno dei due è alias dell'altro, e i valori a parità di
   nome logico divergono (`sm` = 12px vs 13px). Una migrazione che tocchi solo uno dei due
   produce regressioni invisibili nell'altro.
4. **`ui/` è già inconsistente al proprio interno.** I `.module.css` di `ui/` consumano
   `--spacing-*` e `--font-size-*` (cioè `tokens.css`), mentre la documentazione di
   `tokens/index.scss:12-15` presenta `--space-*` come «single source of truth».
5. **`CLAUDE.md` §7.2 è disallineato** sul conteggio dei residui `--accent` (1 dichiarato vs
   31 misurati). Chi pianifica sulla base di quella riga sottostima il lavoro.
6. **Rischio perimetro.** Templates, Explore, Archive, Community e le pagine admin sono
   raggiungibili o quasi, ma vuote. Misurare le primitive *dentro* di esse produrrebbe
   numeri veri e irrilevanti. Le superfici che contano davvero sono tre: **AllProjects**,
   **Project (dock + Properties + Viewpoints + authoring IR)**, **le modali**.
7. **Sottostima strutturale di `forEndUser/`.** §1.5: i call site nei `jsxString` non sono
   grep-abili. Se quei template sono ancora valutati, `Toggle_Obsolete`, `Select`,
   `MetaElementPicker` hanno più consumatori di quanti ne conti questo report.
8. **Nessun test copre queste primitive.** `find src -name "*.stories.*"` → 0;
   nessuna suite sotto `src/components/ui/__tests__`. Gli unici test vicini sono
   `PathBuilder/__tests__/pathExpr.test.ts` e `PredicateBuilder/__tests__/predicateDefaults.test.ts`,
   che testano logica, non rendering. Una migrazione trasversale non ha rete.

---

## 12. Domande aperte per Alfonso

- **OQ-1** — I template `jsxString` sono ancora valutati dopo il classic shutdown
  (`EditorSwitch.tsx:123`)? Se no, `forEndUser/Control.tsx`, `Panel.tsx`, `Input.tsx` e i
  loro controlli escono dal perimetro; se sì, entrano con un numero di call site che questo
  report non ha misurato.
- **OQ-2** — Colore "on" del toggle: cyan `#0ea5e9` (`ui/Toggle`, 31 call site) o slate
  `#334155` (`CLAUDE.md` §7.1, `.jjodel-switch`, `.settings-toggle-switch`)? La risposta
  determina se la migrazione è un rename o un ridisegno.
- **OQ-3** — Il canone spacing è `--space-*` (dichiarato) o `--spacing-*` (usato da `ui/`)?
  E `tokens.css` va assorbito in `tokens/` o viceversa?
- **OQ-4** — `ui/Checkbox` ha 0 call site: si tiene come primitiva da adottare (e allora i
  30 `<input>` nativi ci migrano) o si elimina in favore del solo `Toggle`?
- **OQ-5** — Il segmented nuovo parte da E1 `.appbar-mode-switch` o da E2
  `.jodie-mode-switch`? Sono i due con la semantica ARIA migliore, ma usano ruoli diversi
  (`group`/`aria-pressed` vs `tablist`/`aria-selected`) per lo stesso pattern visivo.
- **OQ-6** — La vetrina si costruisce estendendo `TokenPreview` (`#/test-tokens`) o come
  route nuova? E va linkata in `LeftBar` sezione Resources, o resta URL-only?
- **OQ-7** — `tokens/index.scss:106-112` (checkbox nascosti globalmente): si rimuove come
  precondizione della migrazione booleana, o si conserva e si migra tutto a componenti che
  non usano l'input nativo visibile?
- **OQ-8** — Il codice morto elencato (§1.3, §2, §3, §4, §8) si rimuove in un commit
  dedicato prima della migrazione, o si lascia e si migra solo il vivo? Rimuoverlo prima
  fa scendere il conteggio di implementazioni da 14 a 9 per i booleani e da 9 a 5 per le
  select, cambiando la stima del lavoro.

---

## 13. File letti

Tutti sotto `frontend/`, salvo dove indicato.

*Perimetro*: `src/App.tsx`, `src/App.scss`, `src/router/Router.tsx`, `src/pages/index.ts`,
`src/pages/{Archive,Community,Explore,News,Profile,ProjectsInfo,Recent,Templates,UsersInfo,Error,Project,TokenPreview}.tsx`,
`src/pages/components/{Dashboard,LeftBar,Navbar}.tsx`, `src/pages/components/menu/Menu.tsx`,
`src/components/ComingSoonPlaceholder/ComingSoonPlaceholder.tsx`,
`src/components/GlobalDrawer/GlobalDrawer.tsx`, `src/contexts/GlobalDrawerContext.tsx`,
`src/components/abstract/tabs/{TabDataMaker,EditorSwitch}.tsx`, `src/components/project/ProjectEditor.tsx`,
`src/components/TestLayout.tsx`.

*Primitive*: `src/components/ui/index.ts`, `src/components/ui/{Toggle/Toggle.module.css,Checkbox/Checkbox.module.css,Button/Button.tsx,Select/Select.tsx,JjSelect/JjSelect.tsx,FormSection/FormSection.tsx,VerticalToggle.scss}`,
`src/components/ui/examples/FormExample.tsx`, `src/components/forEndUser/{Control.tsx,Panel.tsx,Toggle.tsx}`,
`src/joiner/components.tsx`, `src/components/editors/Info.tsx`,
`src/components/editors/views/{NestedView.tsx,ViewData.tsx,data/NodeData.tsx}`,
`src/components/editors/viewpoint/properties/ViewpointProperties.tsx`,
`src/components/editor-v2/viewpoint/authoring/{MatchingSection,EdgeAuthoringPanel}.tsx`,
`src/components/Jodie/JodieHeader.tsx`, `src/components/Settings/UnifiedSettingsModal/sections/ProfileSection.tsx`,
`src/components/ModeSystem/{CollapsibleSection.tsx,index.ts}`, `src/hooks/useAdvancedSections.ts`,
`src/components/editors/PropertiesWithTreeView.tsx`, `src/common/DV.tsx` (estratto).

*Stili*: `src/styles/tokens/{index,_spacing,_typography,_radius}.scss`, `src/styles/tokens.css`,
`src/styles/variables.scss`, `src/styles/components/{_form-system,_switch,_buttons}.scss`,
`src/components/editors/{info-improvements.scss,views/nestedView.scss}`,
`src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.scss`,
`src/jjtl/styles/jjtl.scss` (estratti).

*Documenti*: `CLAUDE.md`, `docs/claude-code-log.md` (ultime entry),
`docs/discovery/discovery_2026-08-04_legacy_view_census_real_projects.md`.

**Sezione più costosa**: §7 (spacing/colore/tipografia), per il volume dei conteggi
aggregati. È stata consegnata con ordini di grandezza per cartella, come previsto dal
prompt, senza elenco puntuale delle 8 633 occorrenze.

---

## 14. Superfici morte — il dato che fissa il perimetro

Il ramo autenticato di `App.tsx:132-161` dichiara **23 `<Route>`**. Tolte la redirect `/` e
il fallback `*`, restano **21 pagine**: **17 sono morte** — irraggiungibili, vuote o inerti —
e **4 sono vive** (`allProjects`, `project`, `account`, `auth`).

*Raggiungibili ma senza contenuto* (4): `templates`, `explore` — entrambe solo
`ComingSoonPlaceholder`; `archive`, `community` — entrambe `<div>Empty page, still in
progress.</div>`.

*Raggiungibili solo da admin e inerti* (3): `usersInfo`, `projectsInfo` (liste mai
popolate, `useEffect` commentato), `news` (`<b>Ciao</b>`).

*Senza alcun link nell'applicazione, raggiungibili solo digitando l'hash* (10): `settings`
(unico link da `JjodieWidget`, a sua volta morto), `updates`, `profile`, `notes`,
`recent`, `test-tokens`, `test-resize`, `editor-v2`, `repro-v2flow`,
`repro-v2flow-reactive`.

*Superfici non-route morte*: il **GlobalDrawer** completo (Settings/Account/Help —
`openDrawer` mai chiamato), `MegamodelModal-toDelete`, `ElementPropertiesDrawer`,
`BottomDrawer`, `JjodieWidget`, `ExportImageMenu`, `ExportImportMenu`, `ProviderSelector`
(×2), l'intero `src/examples/`, e le **modalità editor classic e split**.

**Il perimetro reale della migrazione è quindi di tre superfici**: `#/allProjects`
(dashboard + card + catalog + LeftBar + Navbar), `#/project` (dock, tab Metamodel/Model/
Documentation, canvas flow, pannello Properties, pannello Viewpoints, pannelli authoring
IR), e le **modali** (UnifiedSettings, CreateProject, NewViewpoint, NewTransformation,
ExecuteTransformation, Import summary, EdgeMarkerEditor, EnvGenWizard, dialoghi JjTL).
Tutto il resto è misurabile ma non vale la misura.
