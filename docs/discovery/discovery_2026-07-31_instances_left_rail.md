# Discovery — Fase INSTANCES / rail sinistro (read-only)

**Data**: 2026-07-31
**Branch**: `alfonso-frontend-jjtl` · HEAD `07cee5219` (== `origin/alfonso-frontend-jjtl`, 0 ahead / 0 behind)
**Tipo**: discovery pura. Nessun sorgente modificato.
**Effort**: high.

---

## 0. Obiettivo

Mappare il lato sinistro dell'app (rail di progetto `LeftBar` + gruppo dock che ospita le
tab canvas) prima di scegliere la strategia della fase INSTANCES. Il lato destro
(overlay floating Properties+Tree) è già chiuso da F2–F5 e viene toccato qui solo
come censimento di ciò che è parametrico vs cablato a destra (§2.5) e come punti di
contatto (§2.4).

Il report NON contiene proposte di design: le opzioni di fase si decidono in chat.

---

## 1. File letti

Tutti i path sono relativi alla radice del repo.

**Rail e shell**
- `frontend/src/pages/components/LeftBar.tsx` (533 righe, letto integralmente)
- `frontend/src/pages/components/Dashboard.tsx` (649 righe, letto integralmente)
- `frontend/src/pages/components/index.ts`
- `frontend/src/pages/dashboard.scss` (1461 righe; letti 330–429, 795–1254)
- `frontend/src/pages/Project.tsx` (call-site route)
- `frontend/src/pages/components/Navbar.tsx` (letture mirate: `createM1`/`createM2`
  :71–114, layout-mode :896–916, mode-switch :1938–1940, `mapStateToProps` :2059)

**Dock**
- `frontend/src/components/abstract/Dock.tsx` (425 righe, letto integralmente)
- `frontend/src/components/abstract/DockManager.tsx` (373 righe, letto integralmente)
- `frontend/src/components/abstract/DockLayout.tsx` (289 righe — **interamente
  commentato**, vedi §2.3)
- `frontend/src/components/dock/MyRcDock.tsx` (733 righe; letti 560–661 + mappa
  strutturale)
- `frontend/src/components/abstract/tabs/TabDataMaker.tsx`
- `frontend/src/components/abstract/tabs/ModelsSummaryTab.tsx`

**Progetto / istanze**
- `frontend/src/components/project/ProjectEditor.tsx` (2883 righe; letti 240–270,
  1061–1154, 1780–1802, 425–445, 2036–2100, 2205–2680 a campione)
- `frontend/src/components/StatusBar.tsx` (letti 1–30, 295–360)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (letture mirate:
  `FeatureRow` 687–720, `ModelNode` 963–1020, builder 2210–2245)

**Overlay destro (solo censimento)**
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (letti 36–166,
  240–440, 580–610)
- `frontend/src/components/editors/properties-with-tree-view.scss` (letti 1150–1280)
- `frontend/src/components/editor-v2/viewportInset.ts` (integrale)
- `frontend/src/components/editor-v2/Toolbar.tsx` (letti 185–230, 495–525)
- `frontend/src/contexts/TreeViewPanelContext.tsx` (letti 185–215)

**Grep repo-wide eseguiti**: `LeftBar`, `psb-|leftbar` (scss/css), `EDITOR_TYPE_CHANGE`,
`ACTIVE_TAB`, `LAYOUT_MODE_CHANGE`, `data-layout-mode`, `state.advanced`,
`searchParams` / `get('section')`, `OPEN_MEGAMODEL`, `openShareModal`,
`TabDataMaker`, `openDocumentation`, `PinnableDock.load/save`, `ProjectHeader`,
`leftbar-footer`, `status-badge`, `item-count`.

---

## 2. Findings

### 2.1 LeftBar

**Due varianti mutuamente esclusive**, scelte da un solo ternario su `active`
(`LeftBar.tsx:364`):

| Variante | Classe | Condizione | Mount |
|---|---|---|---|
| Rail progetto | `.leftbar .leftbar--project` | `active === 'Project'` | `Dashboard.tsx:621` |
| Rail dashboard | `.leftbar` | tutti gli altri `active` | `Dashboard.tsx:322` |

`active` è tipizzato `DashProps['active']` (`Dashboard.tsx:228`, 16 valori). L'unico
call-site che passa `'Project'` è `pages/Project.tsx:80` → `Dashboard` →
`ProjectDashboard`.

#### Inventario sezioni `psb-*` (variante progetto, `:365–438`)

| Elemento | Riga | Contenuto | Handler |
|---|---|---|---|
| `.psb-back` | :367 | «‹ All projects» | `handleBackToProjects` = `closeProject` (:183–223) |
| `.psb-megamodel` | :373 | nome progetto + freccia | `openMegamodel` → CustomEvent `OPEN_MEGAMODEL` |
| Sezione Metamodels | :379 | badge `M`, item + «New metamodel» | item → `DockManager.open2(lm)`; new → `createM2(project)` |
| Sezione Models | :387 | badge `m`, item + «New model» | item → `DockManager.open2(lm)`; new → `navigateToSection('models')` |
| Sezione Transforms | :395 | badge `T`, item + «New transform» | item **e** new → `navigateToSection('transformations')` |
| Sezione Viewpoints | :405 | badge `V`, item + «New viewpoint» | item → `DockManager.openViewpoint(lv)`; new → `navigateToSection('viewpoints')` |
| Sezione Project (azioni) | :414–437 | Download / Favorite / Share / Close | `exportProject`, `toggleFavorite`, `openShareModal`, `closeProject` |

Il renderer condiviso è `renderSection(key, label, badge, items, onItemClick, onNewClick, newLabel)`
(:320–356). Le sezioni sono **4**, non 2: il prompt cita solo Metamodels/Models.

**Il badge NON è un contatore**: `.psb-badge` è la lettera del tipo (`M`/`m`/`T`/`V`,
`:344`, stili `dashboard.scss:1147–1161`). Un conteggio numerico esiste solo nella
variante dashboard (`Item` prop `count` → `.item-count`, `:74`) e **nessun call-site
lo passa** → `.item-count` non è mai reso.

**Fonti dati** (`:314–318`):
- `project?.metamodels` :314, `project?.models` :315, `project?.viewpoints` :316 — proxy L.
- `pTransformations` :318 = `(project as any).transformations`, sincronizzato da
  `ProjectEditor` via `SetFieldAction` (commento a :317).

#### Stato

- **Collapse per sezione**: `useState<Record<string, boolean>>` locale (`:302`),
  `toggleSection` (:303). Non persistito, non in Redux. Chiavi:
  `'metamodels' | 'models' | 'transformations' | 'viewpoints' | 'project'`.
- **Navigazione sezioni**: `type ProjectSection` (:226), `currentSection` (:227),
  `navigateToSection` (:229–236) via `setSearchParams`. **Vedi il finding critico sotto.**
- **Filtro** (solo variante dashboard): `?filter=` (:158, `handleFilterChange` :166–176),
  in sync con `Catalog.tsx:175–187`.
- **Redux consumato**: **nessuno**. `LeftBar` non è `connect`-esso, non usa
  `useSelector`, non legge `state.advanced` (§2.6).

#### ⚠ Finding critico — `?section=` è una scrittura morta

`navigateToSection` scrive `?section=` nell'URL. L'unico lettore nel repo è
`ProjectEditor.tsx:245`:

```ts
const currentSection = (searchParams.get('section') || 'metamodels') as
    'metamodels' | 'models' | 'transformations' | 'viewpoints' | 'documentation';
```

`grep -n "currentSection" ProjectEditor.tsx` restituisce **una sola riga (245)**: la
variabile non è mai usata. Le cinque sezioni sono rese incondizionatamente in una
sola pagina scrollabile — `#section-metamodels` :2217, `#section-models` :2366,
`#section-transformations` :2557, `#section-viewpoints` :2583,
`#section-documentation` :2663 — e non esiste alcun consumatore di quegli `id`
(nessun `scrollIntoView`, nessun `getElementById('section-…')` nel repo; commenti
espliciti a `ProjectEditor.tsx:395` «IntersectionObserver removed» e `:543`
«scrollToSection removed»).

Conseguenza utente: **«+ New model», «+ New transform», «+ New viewpoint» e il click
su un item Transform non fanno nulla di visibile** — cambiano solo la query string.
L'unico «+ New» funzionante del rail è «New metamodel» (`createM2`).

#### ⚠ Finding — «Share» è inerte

`openShareModal` (:310–312) dispatcha la stringa hardcoded `'jjodel:openShareModal'`
(fuori registry, §8.6 — codice pre-esistente, non toccare). Grep repo-wide:
**zero listener**. Il commento a `:309` («Listener is added in a follow-up task»)
descrive un task mai completato.

Per contrasto, `OPEN_MEGAMODEL` (registry, :307) ha il suo listener a
`ProjectEditor.tsx:436` (`setShowMegamodelModal(true)`) — vivo, perché `ProjectEditor`
sta nella tab `project_summary` che è `closable:false`.

#### Codice morto dentro LeftBar.tsx (osservato, NON rimosso — rule 9)

| Simbolo | Riga | Stato |
|---|---|---|
| `ProjectHeader` (+ `getProjectStatus`) | :128–145 | definito, **mai reso**. Unico produttore di `.status-badge` nel rail |
| `SectionLabel` | :124–126 | definito, mai usato |
| `Divisor` | :120–122 | definito, mai usato (l'omonimo vivo sta in `components/menu/Menu`) |
| `Upload` | :79–87 | `return(<></>)` alla prima riga: corpo irraggiungibile |
| `Menu.Item = Item` | :147 | assegnazione mai letta |
| `interface StateProps` | :31–33 | non riferita |
| `MenuProps.project` | :93, uso :106 | nessun call-site passa `project` → il dot «modified» non appare mai |
| Import inutilizzati | :2, :4, :8, :10, :11 | `DUser`, `L`, `SetRootFieldAction`, `windoww`, `icon`, `storage`, `SaveManager`, `Tooltip` |

Corrispettivo lato SCSS: `.leftbar-footer` (`dashboard.scss:976–1016`) non ha alcun
produttore JSX nel repo; `.psb-item.active` (`:1131–1144`, con la barretta cyan
`::before`) è irraggiungibile perché `renderSection` scrive `className="psb-item"`
fisso (`:340`) senza mai aggiungere `active`.

#### Stili

`frontend/src/pages/dashboard.scss` è **l'unico** proprietario di `.leftbar` / `psb-*`
(`grep -rl --include=*.scss --include=*.css` → un solo file). **26 occorrenze**, non 24.

| Blocco | Righe |
|---|---|
| Commento di intestazione file | :3 |
| `.three-column` responsive `.leftbar` (≤768px, off-canvas) | :348–365 |
| `.two-column` + `&.hide-leftbar` + responsive | :371–399 |
| `.project-dock-wrapper` (cella accanto al rail) | :408–418 |
| `.leftbar` base (240px fisso, flex column, overflow-y auto) | :804–1016 |
| `.leftbar--project` (tutto il blocco `psb-*`) | :1020–1219 |
| `.status-badge`, `.item--muted`, `.item--danger` | :1221–1254 |

Nessun blocco dark-mode dedicato al rail progetto: `.leftbar--project` usa literal
slate hardcoded (`#f8fafc`, `#e2e8f0`, `#334155`, `#94a3b8`, `#0ea5e9`…), non i token
di `styles/tokens/`. La variante dashboard invece usa i token (`var(--color-bg-primary)`,
`var(--color-text-*)`, `var(--space-*)`).

---

### 2.2 Mount e visibilità

#### Mount

- `Dashboard.tsx:322` — `<LeftBar active={active} projects={user?.projects}/>` dentro
  `GenericDashboard` (tutte le viste non-progetto). **Nessuna logica di hide**: il rail
  è sempre montato.
- `Dashboard.tsx:621` — `{!hideLeftBar && <LeftBar active={'Project'} project={project} />}`
  dentro `ProjectDashboard`. Nota: qui `projects` NON viene passato, quindi la sezione
  «Recently Modified» (che vive nell'altra variante) è comunque fuori gioco.

Il nascondimento è **doppio**: unmount React (`!hideLeftBar &&`) *e* CSS
(`.two-column.hide-leftbar { grid-template-columns: 1fr }`, `dashboard.scss:378–380`).

#### Ciclo `EDITOR_TYPE_CHANGE`

`hideLeftBar` (`Dashboard.tsx:549`) è pilotato da due listener registrati insieme
(`:562–588`):

```
isEditorTab(t) = t === 'metamodel' || t === 'model' || t === 'transformation'   (:563-564)
handleEditorType(e) → tabTypeMapRef[activeId] = editorType; setHideLeftBar(isEditorTab(editorType))  (:566-574)
handleActiveTab(e)  → resolved = tabType ?? tabTypeMapRef[activeId] ?? null; setHideLeftBar(isEditorTab(resolved))  (:576-580)
```

**Emettitori di `EDITOR_TYPE_CHANGE`** (grep completo):

| Sito | Riga | Valore emesso |
|---|---|---|
| `Dashboard.tsx` (mount `GenericDashboard`) | :262 | `'summary'` |
| `DockManager.open2` | :116 | `'metamodel'` \| `'model'` |
| `DockManager.openDocumentation` (esistente) | :146 | `'summary'` |
| `DockManager.openDocumentation` (nuova tab) | :168 | `'summary'` |
| `DockManager.openTransformation` (esistente) | :333 | `'transformation'` |
| `DockManager.openTransformation` (nuova) | :358 | `'transformation'` |
| `Dock.handleLayoutChange` | :372 | **solo** `'metamodel'` \| `'model'` (gate a :371) |
| `PinnableDock._detectActiveTabChange` | `MyRcDock.tsx:600` | `'transformation'` \| `'summary'` \| `'viewpoint'` \| `'metamodel'` \| `'model'` |

**Punto non ovvio**: `Dock.handleLayoutChange` non emette mai `'summary'`. Il rientro
sul tab summary (e quindi la **ricomparsa del rail**) è prodotto da
`PinnableDock._detectActiveTabChange` (`MyRcDock.tsx:574–603`, chiamato in
`componentDidUpdate` :607), che mappa per prefisso di id:

```
jjtl_*  → 'transformation'
doc_*   → 'summary'
vp_*    → 'viewpoint'
altro   → idlookup[activeId].className === 'DModel' ? (isMetamodel?'metamodel':'model') : 'summary'
```

con early-return sugli id `DockComponent_rightbar_*` e sull'id invariato (`:581`, `:583`).

**Consumatori di `EDITOR_TYPE_CHANGE`** oltre a Dashboard: `Dock.tsx:254` (scrive
`document.body[data-editor-type]`), `TreeViewPanelContext.tsx:203`
(`setActiveEditorType`, che è il gate dell'overlay destro), `Jodie.tsx:232`,
`JodieHeader.tsx:132`, `jjscript/executor/utils.ts` (cache artefatto attivo).

`ACTIVE_TAB` è emesso solo da `Dock.tsx:353`; consumatori: `StatusBar.tsx:304`,
`Navbar.tsx:648` e `:1710`, `Dashboard.tsx:583`.

#### Tabella vista → rail visibile

| Vista | `editorType` risultante | Rail |
|---|---|---|
| Dashboard progetti (`/allProjects`, Templates, Explore, Profile…) | `'summary'` (emesso a :262) ma **irrilevante**: `GenericDashboard` non ha gate | **sì** (variante `.leftbar`) |
| Progetto aperto, tab `project_summary` attiva | `'summary'` | **sì** (`.leftbar--project`) |
| Editor metamodello | `'metamodel'` | **no** |
| Editor modello | `'model'` | **no** |
| Editor trasformazione (`jjtl_*`) | `'transformation'` | **no** |
| Tab Documentation (`doc_*`) | `'summary'` | **sì** |
| Tab viewpoint (`vp_*`) | `'viewpoint'` | **sì** (ma nessun `vp_*` è creato oggi, vedi §2.3) |

Interazione col kill-switch documentation: `Dock.handleLayoutChange:377–383` scrive
`document.body[data-active-tab="documentation"]` quando `activeId === 'documentation'`
o inizia per `doc_`. Quell'attributo è consumato solo dall'overlay **destro**
(`properties-with-tree-view.scss:1227–1229` → `display:none !important`) e da
`abstract/style.scss`. **Non tocca il rail sinistro**: sulla tab Documentation il rail
resta visibile e l'overlay destro sparisce.

#### Reload con una tab editor attiva

`PinnableDock` riceve `defaultLayout={layout}` (`Dock.tsx:388`) e `layout` è ricostruito
a ogni render con la sola tab `project_summary` (`:322`, `:329`). La persistenza rc-dock
esiste (`MyRcDock.tsx:663–730`, `PinnableDock.load/save` su `DUser.layout` /
`DProject.layout`) ma **non è mai invocata dal codice applicativo** (grep: solo
auto-riferimenti dentro `MyRcDock.tsx`) — conferma la nota (3) della log entry F2.

Quindi: **dopo un reload si torna sempre alla sola tab summary, con il rail visibile.**
Non esiste lo stato «reload con editor attivo». La stickiness di `activeEditorType`
citata nel prompt è reale (`TreeViewPanelContext` lo aggiorna solo su
`EDITOR_TYPE_CHANGE`) ma al boot viene riportato a `'summary'` da
`_detectActiveTabChange` sul primo `componentDidUpdate`.

#### Perché `Navbar.tsx` e `index.ts` nominano LeftBar

- `Navbar.tsx:82` e `:103`: **solo commenti** («Use open2() so EDITOR_TYPE_CHANGE
  dispatches and Dashboard hides the LeftBar»). Nessun import, nessun uso.
- `pages/components/index.ts:3`: **re-export puro** (`export {LeftBar} from './LeftBar'`).
  Serve a `Dashboard.tsx:18` che importa da `'./'`. Nessun altro consumatore.
- Stessa natura i commenti in `ProjectEditor.tsx:1793` e `model/megamodelRuntime.ts:6`.

#### Rapporto LeftBar ↔ ProjectEditor

`ProjectEditor` è montato **dentro il dock**, non accanto al rail:
`Dock.tsx:277` → `<ModelsSummaryTab/>` → `ModelsSummaryTab.tsx:14` → `<ProjectEditor project={project}/>`.

I punti di contatto reali sono due, e uno solo funziona:

1. `OPEN_MEGAMODEL` — rail (`LeftBar.tsx:307`) → `ProjectEditor.tsx:436`. **Vivo.**
2. `?section=` — rail (`LeftBar.tsx:229–236`) → `ProjectEditor.tsx:245`. **Inerte** (§2.1).

I riferimenti `ProjectEditor.tsx:243/395/543/2040` citati nel prompt sono tutti
**commenti** che descrivono la migrazione a URL-based; il codice che avrebbe dovuto
consumarli non esiste.

---

### 2.3 Dock e tab canvas

#### Nascita di una tab canvas

```
ProjectEditor.handleOpenModel / handleOpenMetamodel  (:1099 / :1095)
LeftBar renderSection onItemClick                    (LeftBar.tsx:382, :390)
Navbar createM1 / createM2                           (Navbar.tsx:104, :71)
Dashboard ProjectCatalog righe                       (Dashboard.tsx:428, :450)
        └─► DockManager.open2(me)                    (DockManager.tsx:111-119)
              ├─ TabDataMaker.metamodel(me) | .model(me)   (TabDataMaker.tsx:16 / :26)
              ├─ DockManager.open('models', tab)           (:91-109)
              │     ├─ guard: dock.find(tab.id) esistente → updateTab(…, true) e return
              │     └─ dockMove(tab, layout.dockbox.children[0], 'middle')   ← index = 0 fisso (F1)
              └─ dispatch EDITOR_TYPE_CHANGE {editorType, modelId}
```

`TabDataMaker` produce `group:'models'`, `closable:true`, `id = model.id`, titolo
`<div class="tab-title active-on-mouseenter" data-type="metamodel|model">`. Il
`data-type` è ciò che `Dock.handleLayoutChange:351` rilegge per popolare `tabType`.

**Prefissi id** in circolazione: nudo `model.id` (metamodel/model), `doc_<id>`,
`jjtl_<id>`, `vp_<id>` (nessun produttore attivo), `project_summary`,
`DockComponent_rightbar_<n>` (`Dock.tsx:133–140`, contatore azzerato a ogni render
`:145`).

`TabDataMaker.viewpoint()` è stato rimosso (commento `TabDataMaker.tsx:36–39`):
`DockManager.openViewpoint` (:192–236) **non crea tab**, imposta solo
`_lastSelected.view` e, se nessun editor è attivo, apre il primo metamodello per
rendere visibile il pannello Properties.

#### Gruppi

```ts
// Dock.tsx:267-272
const groups = {
    'models':  {floatable: true, maximizable: false},
    'editors': {floatable: true, maximizable: false, tabLocked: true}
};
```

- `models` è l'unico gruppo con un pannello vivo: `layout.dockbox.children.push({tabs:[ModelsSummary], size:leftSize})` (`:329`). Dockbox a **child unico**.
- `editors` è orfano: il push del figlio destro è stato rimosso in F2 (commento
  `:331–338`). Le const `metadata` :282, `node` :284, `collaborative` :287,
  `console` :290, `logger` :291, `permissions` :292, `mtm` :293 sono ancora
  dichiarate con `group:'editors'` e **nessuna è referenziata da `layout`**.
- Unico produttore residuo di `group:'editors'`: `TabDataMaker.documentation()`
  (`TabDataMaker.tsx:47`). Il suo unico caller è `Jodie.tsx:689` — e la catena
  `onOpenDocumentation` arriva a `JodieHeader.tsx:148` senza essere cablata a un
  `onClick` (prop orfana, già registrato nella log entry F1). La via **viva** alla
  documentazione è `DockManager.openDocumentation` (chiamata da
  `DocumentationSection.tsx:61` e `:86`), che costruisce la sua `TabData` inline con
  `group:'models'` (`DockManager.tsx:159`) — quindi non passa da `TabDataMaker`.

Netto: nel layout runtime **non esiste alcuna tab di gruppo `editors`**; `groups.editors`
e le 7 const sono peso morto (backlog noto, differito oltre F5).

#### `PinnableDock` e MyRcDock

`PinnableDock extends DockLayout` (`MyRcDock.tsx:435`). Aggiunge a rc-dock:

- **Strip di pin** sui 4 lati (`PinnableStrip` `:194`, resi in `render()` :647–661
  attorno a `super.render()` dentro `.pinnable-dock-root`). Il gruppo `'pinned'`
  interno usa `{floatable:false, maximizable:false, tabLocked:true}` (`:210`).
- **Registry statici** `TabHeader.instances` (`:43`) e `TabContent.instances` (`:155`),
  chiave `tid` — servono a spostare header e contenuto in modo indipendente quando
  una tab viene pinnata. È la ragione del pattern `id()`/`tid()` in `Dock.tsx:135–140`
  e dell'accoppiata `<TabHeader tid={…}>` / `<TabContent tid={…}>`.
- **Controlli di drop** custom (`getAnchorControls()` `:423`, iniettati in
  `.dock-drop-layer` da `componentDidUpdate` :608–622).
- **`_detectActiveTabChange()`** (`:574–603`), il rilevatore di cambio tab descritto in §2.2.
- **Persistenza slot** `load`/`save` (`:663–730`) — mai chiamata (§2.2).

#### `handleLayoutChange` → `ACTIVE_TAB` → `EDITOR_TYPE_CHANGE`

`Dock.tsx:343–384`. Sequenza:

1. legge `newLayout.dockbox.children[0].activeId`; esce se assente;
2. cerca la tab attiva fra `panel.tabs` e ne estrae
   `(activeTab.title as any)?.props?.['data-type'] ?? null` → `tabType`;
3. dispatch `ACTIVE_TAB {activeId, tabType}`;
4. **semantica di `tabType === null`**: rc-dock non preserva le props degli elementi
   React nei titoli quando si commuta fra tab già aperte (commento `:355–357`).
   Fallback: `store.getState().idlookup[activeId]` → `model.isMetamodel ? 'metamodel' : 'model'`
   (`:359–369`). Se anche questo fallisce, `resolvedEditorType` resta `null` e
   **nessun `EDITOR_TYPE_CHANGE` viene emesso** (gate `:371`): è esattamente il buco
   che `_detectActiveTabChange` copre.
   Lato Dashboard il `null` ha un secondo fallback indipendente,
   `tabTypeMapRef.current.get(activeId)` (`:578`).
5. scrive/rimuove `document.body[data-active-tab="documentation"]` (`:377–383`).

#### `calculatePanelSizes` e `layoutMode`

`calculatePanelSizes(mode)` (`Dock.tsx:112–126`) ritorna `{leftSize, rightSize}`.
Post-F2 solo `leftSize` è destrutturato (`:326`) e usato per il child unico (`:329`);
`rightSize` non ha più consumatori dentro `Dock.tsx` (il binding morto è stato tolto in F5).
`getInitialPanelWidth` (`:103–106`, marcato `@deprecated`) è importato da
`Navbar.tsx:51` **e mai chiamato**.

Stato reale dei modi:

| Modo | Chi lo può impostare | Effetto oggi |
|---|---|---|
| `split` (default) | `getSavedLayoutMode()` fallback | `data-layout-mode="split"` → `abstract/style.scss:1042` |
| `sidebar` | solo `prevPanelMode.current` iniziale in `editor-v2/Toolbar.tsx:185` | `style.scss:1059` |
| `canvas-only` | **vivo**: bottone fullscreen `editor-v2/Toolbar.tsx:502–517` | `style.scss:1192` + kill-switch overlay destro (`properties-with-tree-view.scss:1225–1226`) |
| `vertical-console` | **solo da console JS**: `window.setVerticalConsoleMode()` (`Dock.tsx:61–71`) | branch di render alternativo `Dock.tsx:296–319` (canvas sopra + `<Console/>` sotto, niente rc-dock) |

I due writer di `document.body[data-layout-mode]` sono `editor-v2/Toolbar.tsx:218`
(vivo) e `Navbar.tsx:899` (dentro `setLayoutModeState`). **In `Navbar.tsx`
`layoutMode` (:896), `handleLayoutModeChange` (:903) e `handleLayoutModeDoubleClick`
(:915) non sono referenziati da alcun JSX** — confermato dal grep: le uniche
occorrenze sono le dichiarazioni più la chiamata interna a :916. Sono gli «orfani
split» citati dal prompt: confermati orfani.

Il ramo `handleLayoutChange` di `LAYOUT_MODE_CHANGE` (`Dock.tsx:164–207`) e
`handleDockResize` (`:210–226`) sono entrambi gatati su
`currentLayout.dockbox.children.length >= 2`: con il dockbox a child unico
**non entrano mai**. Idem `saveDockPanelRatio`. Restano attivi solo il
`setLayoutMode(newMode)` finale (`:206`) e il listener `mouseup` debounced (inerte).

#### Vincoli rc-dock 3.3 rilevanti (installato: **3.3.2**, `package.json` `^3.3.0`)

Fatti osservati nel codice, non congetture:

- **Dockbox a child unico**: rc-dock normalizza il pannello unico al 100% della
  larghezza (commento `Dock.tsx:334–335`, e la regressione F2-fix conferma che il
  child unico è simultaneamente `:first-child` e `:last-child` — le regole
  `.dock-hbox > .dock-panel:last-child` scritte per la colonna Properties colpivano
  il canvas; fix con `:not(:first-child)` in `abstract/style.scss`). **Qualsiasi
  intervento che reintroduca un secondo figlio del dockbox riattiva quelle regole
  `:last-child`.**
- **`floatable: true`** (gruppo `models`): le tab canvas possono essere trascinate
  fuori in una finestra flottante rc-dock. Non c'è codice che lo impedisca.
- **`maximizable: false`**: nessun bottone di massimizzazione; `maxbox` resta vuoto,
  ma `PinnableDock.render` (`:648–650`) lo legge comunque per la classe `fullscreen`
  e `data-maximized`.
- **`tabLocked: true`** (gruppo `editors`): disabiliterebbe il riordino drag-and-drop
  (commento `Dock.tsx:269–270`); oggi senza effetto perché nessuna tab è in quel gruppo.
- **`key={''+advanced}` su `PinnableDock`** (`Dock.tsx:388`): la key è legata a
  `state.advanced`. Vedi §2.6 (rischio).

#### `DockLayout.tsx` — file morto

`frontend/src/components/abstract/DockLayout.tsx` contiene una sola riga viva
(`export const unused = '?';`, :1); le restanti 288 sono commentate. Non va confuso
con `DockLayout` di rc-dock (import in `MyRcDock.tsx` e `DockManager.tsx`).

Analogamente senza consumatori: `abstract/tabs/PersistanceTab.tsx` e
`abstract/tabs/TestTab.tsx` (grep repo-wide: zero import).

---

### 2.4 INSTANCES oggi

Va distinto cosa il codice chiama «instance»:

- **M1 model** = `DModel` con `isMetamodel:false` — nel rail è la sezione *Models*.
- **M1 object** = `DObject` dentro un modello — è ciò che la StatusBar conta come
  «N instances» e ciò che il Tree View elenca come `FeatureRow`.

#### Liste e azioni lato sinistro

| Superficie | Cosa mostra | Azioni |
|---|---|---|
| Rail, sezione Models (`LeftBar.tsx:387–393`) | elenco M1 del progetto, badge `m` | **apri** (`DockManager.open2`); «New model» **inerte** (§2.1) |
| `ProjectEditor` sezione MODELS (`:2366–2556`, dentro la tab `project_summary`) | `.list-card` per M1, nome + `Model · <metamodel>` | apri (`handleOpenModel` :1099), rinomina (`handleRenameSubmit` :1061), elimina (`handleDeleteModel` :1138), «+ New» (`handleNewModelClick` :1108 → `createM1`), Import `.xmi` (`handleImportXmi`) |
| `Dashboard.ProjectCatalog` (`Dashboard.tsx:446–466`) | riga per M1 nella project-list | apri (`DockManager.open2`), duplicate (**handler vuoto**, `:458`), delete (`model.delete()` :461) |
| `StatusBar` (`StatusBar.tsx:344–347`) | in editor modello: `N instance(s) · <metamodel>` | sola lettura; `objectCount` da `lModel.objects.length` (`:174–175`) |

#### Percorso completo — creare un M1 dal rail

```
click «+ New model»  (LeftBar.tsx:391)
   └─► navigateToSection('models')  (:229-236)
         └─► setSearchParams({..., section:'models'})
               └─► ProjectEditor re-render → currentSection calcolato e SCARTATO
                     └─► nessun cambiamento visibile          ⟵ DEAD END
```

Il percorso **funzionante** passa da `ProjectEditor` o dal Navbar:

```
handleNewModelClick (ProjectEditor.tsx:1108)
  ├─ metamodels.length === 0 → return
  ├─ metamodels.length === 1 → createM1(project, metamodels[0])
  └─ altrimenti → apre il menu di scelta metamodello → handleCreateModel (:1125) → createM1

createM1(project, metamodel)   (Navbar.tsx:95-114)
  ├─ nome unico: U.increaseEndingNumber('model_1', …) su metamodel.models
  ├─ DModel.new(name, metamodel.id, false, true)
  ├─ project.models = [...project.models, lModel]
  ├─ project.graphs = [...project.graphs, lModel.node as LGraph]
  ├─ DockManager.open2(lModel)          → tab canvas + EDITOR_TYPE_CHANGE 'model' (rail si nasconde)
  └─ ActivityLogger.log(MODEL_CREATED)
```

**Aprire** un M1 dal rail: `LeftBar.tsx:390` → `pModels.find(...)` → `DockManager.open2(lm)`
→ `TabDataMaker.model` → `dockMove(..., children[0], 'middle')` → `EDITOR_TYPE_CHANGE 'model'`
→ `Dashboard` nasconde il rail.

**Eliminare** un M1: **non è possibile dal rail** (nessuna azione oltre il click di
apertura). Solo da `ProjectEditor` (menu `⋮` per riga → `handleDeleteModel` :1138 →
`DockManager.closeTabsForEntity(id,'model')` + `model.delete()` + toast) o da
`Dashboard.ProjectCatalog` (:461, `model.delete()` senza chiusura tab).

**Creare/eliminare un M1 object (istanza vera)**: nessuna superficie a sinistra.
Avviene solo dentro il canvas (`EditorV2`) o dal context-menu del canvas.

#### Punti di contatto col Tree View destro (solo censimento)

- Costruttore dati: `TreeViewContent.tsx:2210–2245` costruisce, per ogni M1,
  `instances: TreeFeatureData[]` leggendo `obj.instanceof` per il nome della metaclasse.
- `ModelNode` (`:963–1020`): il chevron di espansione è gatato da
  `canExpand = model.isActive && hasInstances` (`:987`) — solo il modello **attivo**
  espande le sue istanze.
- `FeatureRow` (`:687–720`): riga foglia `nome : Metaclasse`. Al click fa due cose,
  `SetRootFieldAction.new('_lastSelected', {node:'', view:'', modelElement: instance.id})`
  (`:704`) e `dispatchEvent(SELECT_NODE, {nodeId, modelId})` (`:709`).
- Filtro/ricerca: `:287–301` filtra `instances` e propaga `matchCount`/`firstMatchId`.
- **Nessuna azione di scrittura sulle istanze** dal Tree View: solo selezione.
- Gap noto già a log (round 2/3 Tree View): le righe istanza selezionano via
  `.tree-row__content--selected`, classe **senza regola CSS** → nessuna pill di
  selezione sulle istanze M1.

---

### 2.5 Floating esistente: cosa è right-specific

Censimento del meccanismo overlay (F2/F3/F5). Nessuna proposta.

#### Parametrico / riusabile senza modifiche

| Elemento | Dove | Nota |
|---|---|---|
| Mount via `createPortal(..., document.body)` | `PropertiesWithTreeView.tsx:582`, `:592` | agnostico rispetto al lato |
| Gate `overlayActive` su `activeEditorType ∈ {model, metamodel}` | `:408`, `:341` | agnostico |
| Persistenza dimensioni su `localStorage` con chiavi dedicate | `:46–54` (`jjodel_property_overlay_width`, `jjodel_property_tree_height`) | chiavi però semanticamente «property/tree» |
| Clamp con NaN-guard | `clampTreeHeight` `:59–62`; letture `:73–102` | agnostico; il cap `60vh` è verticale, non laterale |
| Accordion maximize/restore | `cardMaximized` `:247–249`, stili flex `:412–425` | agnostico (asse verticale) |
| Splitter in-flow fra le card (`order:2`) | `:509`, scss `:1278+` | agnostico (asse verticale) |
| Kill-switch CSS | `properties-with-tree-view.scss:1225–1229` | gatato su `data-layout-mode`/`data-active-tab`, non sul lato |

#### Cablato al bordo destro

| Elemento | Dove | Assunzione |
|---|---|---|
| `.properties-tree-overlay { position:fixed; right:8px }` | scss `:1240–1249` | ancoraggio destro literal; `top: calc(60px + 40px)` e `bottom: calc(32px + 8px)` sono literal composti a mano (navbar 60 + toolbar 40; StatusBar 32 + gap 8) — commento esplicito «No CSS vars exist for these heights» |
| `z-index: 900` | scss `:1249`, `:1166` | tier condiviso con il cluster pill; sotto context-menu canvas (1000) e modali |
| `.properties-tree-floating-cluster { top:150px; right:16px }` | scss `:1162–1166` | posizione della pill di riapertura, tarata sotto navbar+toolbar+canvas-toolbar, sempre a destra |
| Nome + semantica della CSS var `--jj-canvas-right-inset` | writer `PropertiesWithTreeView.tsx:350–359`; reader `editor-v2/viewportInset.ts` | il nome, la formula `overlayWidth + 8` e `fitPadding` che scrive **solo** `right: '<n>px'` sono right-only |
| Consumatori dell'inset | `EditorV2.tsx` (5 `fitView` + math `selectNode`, MiniMap `right`), `NodeProblemOverlay.tsx`, `Jodie/JodieWindow.css` (FAB `right`) | tutti assumono che l'ingombro sia a destra |
| Larghezze | `DEFAULT_OVERLAY_WIDTH 400`, `MIN 320`, `MAX 640` (`:46–48`) | dimensione di una colonna verticale a destra |
| Direzione del drag di resize orizzontale | `:175–218` | segno del delta calcolato per un pannello ancorato a destra |
| Classi | `.properties-tree-overlay`, `.properties-with-tree-view--floating`, `.properties-tree-floating-cluster` | nomi legati al contenuto (properties/tree), non al lato — ma il modificatore `--floating` è oggi l'unico valore dell'union `mode` (`:65`) |
| `pointer-events` | scss `:1251–1254` | il wrapper resta `auto`: l'esperimento `none` fu revertito perché rompeva l'hit-testing del resize |

Osservazione: `mode` è ormai il literal type `'floating'` (`:65`, ristretto il
2026-07-29) — non c'è più un asse «modo» su cui parametrizzare senza riaprire l'union.

---

### 2.6 Basic/Advanced a sinistra

Grep su `state.advanced` / selector `advanced`. Situazione lato sinistro:

| File | Consuma `advanced`? | Come |
|---|---|---|
| `LeftBar.tsx` | **no** | nessun `connect`, nessun `useSelector` |
| `Dashboard.tsx` | **no** | — |
| `ProjectEditor.tsx` | **no** | grep `advanced` → zero occorrenze |
| `Dock.tsx` | **sì** | `mapStateToProps` :405 → `props.advanced` :274 → **usato solo come `key` di `PinnableDock`** (:388) |

Consumatori reali altrove (per contesto): `Navbar.tsx` (segmented :1938, voce di menu
:1442/:1548, writers `enableAdvancedMode`/`disableAdvancedMode` :838–858),
`Info.tsx:1408`, `PropertiesWithTreeView.tsx:252` (gata la sezione NODE),
`VertexAuthoringPanel.tsx:61`, `Console.tsx:877`, `BottomBar.tsx:119`,
`ProfileSection.tsx:471`.

**Conclusione**: oggi, sul lato sinistro, il toggle Basic/Advanced **non cambia nulla
nel rail**. La sua unica interazione con quest'area è indiretta e potenzialmente
distruttiva (vedi rischio R1).

---

## 3. Mappa «chi monta cosa»

```
App (HashRouter)
│
├── /allProjects, /templates, /explore, /profile, …
│   └── Dashboard  (Dashboard.tsx:639 — active !== 'Project')
│       └── GenericDashboard  (:254)
│           ├── <Navbar/>                                   (:314)
│           ├── div.dashboard-container.{two|three}-column   (:316)
│           │   ├── <LeftBar active={active} projects/>      (:322)   ← variante .leftbar
│           │   │     ├── Menu Administration (solo admin@gmail.it)
│           │   │     ├── Menu (All projects)
│           │   │     ├── Menu Filters      → ?filter=  (sync Catalog.tsx)
│           │   │     ├── Menu Favorites
│           │   │     ├── Menu Browse       (Templates / Explore)
│           │   │     ├── Menu Recently Modified (top 5)
│           │   │     └── Menu Resources    (link esterni)
│           │   ├── div.dash-content → <Catalog>{children}</Catalog>
│           │   └── <RightPanel/>  (solo se active!=='Project' && hasProjects)
│           └── <StatusBar/>                                 (:353)
│
└── /project?id=…
    └── Project.tsx:80 → Dashboard active='Project'
        └── ProjectDashboard  (Dashboard.tsx:545)
            ├── <style#views-css-injector-d> + CSS_Units      (:613-616)
            ├── <Navbar/>                                     (:619)
            ├── div.dashboard-container.two-column[.hide-leftbar]   (:620)
            │   ├── {!hideLeftBar && <LeftBar active='Project' project/>}  (:621)  ← .leftbar--project
            │   │     ├── .psb-back            → closeProject (dialog unsaved)
            │   │     ├── .psb-megamodel       → CustomEvent OPEN_MEGAMODEL → ProjectEditor:436
            │   │     ├── section Metamodels   → open2(lm) | createM2
            │   │     ├── section Models       → open2(lm) | ?section=models  [INERTE]
            │   │     ├── section Transforms   → ?section=transformations     [INERTE]
            │   │     ├── section Viewpoints   → openViewpoint(lv) | ?section [INERTE]
            │   │     └── section Project      → export | favorite | share[INERTE] | close
            │   └── div.project-dock-wrapper                  (:622)
            │       ├── <Dock/>                               (:623)
            │       │   └── <PinnableDock key={advanced} defaultLayout groups onLayoutChange/>  (Dock.tsx:388)
            │       │       └── dockbox (horizontal) — CHILD UNICO
            │       │           └── panel group='models'      (Dock.tsx:329)
            │       │               ├── tab 'project_summary' (closable:false)
            │       │               │     └── ModelsSummaryTab → ProjectEditor
            │       │               │           ├── section METAMODELS
            │       │               │           ├── section MODELS  (create/open/rename/delete M1)
            │       │               │           ├── section TRANSFORMATIONS
            │       │               │           ├── section VIEWPOINTS
            │       │               │           └── section DOCUMENTATION → DocumentationSection
            │       │               ├── tab <modelId>  (metamodel) → MetamodelTab → EditorSwitch → EditorV2
            │       │               ├── tab <modelId>  (model)     → ModelTab     → EditorSwitch → EditorV2
            │       │               ├── tab jjtl_<id>              → JjtlDevelopmentEnv
            │       │               └── tab doc_<id>               → DocumentationTab
            │       │       └── + <TabsOverflowMenu/>          (Dock.tsx:389)
            │       └── <PropertiesWithTreeView mode='floating'/>  (:627)
            │             └── createPortal → <body>
            │                   ├── .properties-tree-overlay  (Tree card / splitter / Properties card)
            │                   └── .properties-tree-floating-cluster (pill di riapertura)
            └── <StatusBar/>                                  (:635)

ORFANI nel dock (dichiarati, mai montati):
    groups.editors                                   (Dock.tsx:271)
    const metadata/node/collaborative/console/logger/permissions/mtm  (Dock.tsx:282-293)
    branch layoutMode 'vertical-console'             (Dock.tsx:296-319, solo da console JS)
    abstract/DockLayout.tsx                          (interamente commentato)
    abstract/tabs/PersistanceTab.tsx, TestTab.tsx    (zero import)
```

---

## 4. Divergenze working tree ↔ origin

**Nessuna sui file censiti.**

- `HEAD == origin/alfonso-frontend-jjtl == 07cee5219` (0 ahead / 0 behind).
- `git status --porcelain` sui path censiti (LeftBar, Dashboard, dashboard.scss,
  `components/abstract/**`, `components/dock/**`, ProjectEditor,
  PropertiesWithTreeView + scss) → **vuoto**.
- Il WIP concorrente nel working tree tocca solo l'authoring IR e non interseca la
  fase: `editor-v2/nodes/ObjectNode.tsx`, `viewpoint/authoring/LabelEntryEditor.tsx`,
  `viewpoint/authoring/TextStyleEditor.tsx`, `viewpoint/ir/irStyle.ts`,
  `styles/components/_form-system.scss`, + untracked `TextStyleField.tsx`.

**Divergenze fra il prompt e il codice** (la ricognizione preliminare era su origin;
riporto le correzioni):

| Prompt | Realtà |
|---|---|
| «header progetto con status badge (~140)» | `ProjectHeader` esiste a `:137–145` ma **non è mai reso** |
| «sezioni Metamodels/Models» | sono **4** sezioni + una di azioni |
| «sezioni … con badge» | il badge è la lettera del tipo, non un contatore; il contatore (`.item-count`) esiste ma non ha call-site |
| «24 occorrenze» di `psb-`/`leftbar` in `dashboard.scss` | **26** |
| «`ProjectEditor.tsx:243,395,543,2040`: chi legge `?section=`» | sono **commenti**; l'unico lettore è `:245` e la variabile è scartata |
| «`Dock.tsx` gruppo `editors` :282–293 consts orfane» | confermato; in più `groups.editors` :271 è orfano e `TabDataMaker.documentation()` è l'unico produttore residuo (caller dormiente) |
| «`Dock.tsx` :267–271 gruppo models floatable non maximizable» | confermato (:267–272) |
| «`DockManager` prefix `DockComponent_rightbar_` (:133)» | il prefisso è in `Dock.tsx:133`, non in `DockManager.tsx` |
| «`DockLayout.tsx` (~289)» | 289 righe di cui 288 commentate: file morto |
| «`Dashboard.tsx:322` / `:549` / `:573`» | tutti confermati |
| rc-dock 3.3.0 | `package.json` `^3.3.0`, **installato 3.3.2** |

---

## 5. Rischi

**R1 — `key={''+advanced}` sul dock.** `Dock.tsx:388` lega la key di `PinnableDock` a
`state.advanced`. Cambiare modalità Basic↔Advanced dovrebbe quindi rimontare il dock,
che riparte da `defaultLayout` (sola tab `project_summary`) → **tutte le tab editor
aperte si chiudono** e il rail riappare. Il codice è inequivocabile; la conseguenza
runtime **non è stata osservata a video** in questa discovery (§5.1 CLAUDE.md) e va
verificata prima di costruirci sopra. Il rischio è salito di rilevanza con B5: il
toggle ora vive nel Navbar, montato su ogni vista, quindi è raggiungibile mentre un
editor è aperto.

**R2 — reintrodurre un secondo figlio del dockbox riapre la regressione F2-fix.**
`abstract/style.scss` porta 9 blocchi corretti con `:not(:first-child)` proprio perché
il canvas era diventato simultaneamente `:first-child` e `:last-child`. Un secondo
figlio (a sinistra o a destra) cambia di nuovo quella semantica.

**R3 — `?section=` inerte.** Tre «+ New» e il click su un Transform non fanno nulla.
Qualsiasi lavoro sul rail che tocchi quelle voci si scontra con un contratto rotto:
o si ripristina il consumo di `currentSection` in `ProjectEditor`, o si cambiano gli
handler. È un bug utente pre-esistente, non introdotto dalla fase.

**R4 — «Share» senza listener.** Voce di menu visibile e cliccabile che non produce
effetti. Stesso profilo di R3.

**R5 — due meccanismi paralleli decidono `editorType`.** `Dock.handleLayoutChange`
(props del titolo → `data-type`, con fallback su `idlookup`) e
`PinnableDock._detectActiveTabChange` (prefisso dell'id). Coprono buchi diversi e non
sono equivalenti: `handleLayoutChange` non emette mai `'summary'`; `_detectActiveTabChange`
è l'unico che riporta il rail. Un intervento che tocchi id o titoli delle tab deve
rispettare entrambi.

**R6 — il rail progetto non usa i token del design system.** `.leftbar--project` è
interamente su literal slate, senza blocco dark. Un restyle che lo porti sui token
cambia la resa in dark mode (oggi: il rail resta chiaro).

**R7 — `PinnableStrip` e la persistenza slot.** `MyRcDock` porta strip di pin sui 4
lati e un registry statico `TabHeader.instances`/`TabContent.instances`. Un intervento
che monti UI a sinistra dentro l'area dock (invece che fuori) entra in collisione con
`PinnableStrip side="l"` (`MyRcDock.tsx:655`).

**R8 — quantità di codice morto nella zona.** `LeftBar.tsx` porta 6 simboli morti +
8 import inutilizzati; `Dock.tsx` 7 const + un gruppo orfani; `DockLayout.tsx`,
`PersistanceTab.tsx`, `TestTab.tsx` interi. Non è un rischio in sé, ma rende ogni
grep di impatto rumoroso: le occorrenze trovate vanno verificate vive prima di
trattarle come vincoli.

---

## 6. Domande aperte per Alfonso

1. **`?section=` (R3)** — la navigazione per sezioni doveva funzionare o è un residuo
   di un design abbandonato? Decide se «+ New model / transform / viewpoint» dal rail
   vanno riparati (consumo di `currentSection` in `ProjectEditor`) o ricablati su
   handler diretti (come «New metamodel»).

2. **«Share» (R4)** — voce da cablare, o da nascondere fino a che il modal esiste?

3. **Che cos'è un'«istanza» per questa fase?** Il rail oggi conosce solo gli M1
   (`DModel`); gli M1 object vivono solo nel canvas e nel Tree View destro. La fase
   INSTANCES deve portare a sinistra i **modelli**, gli **oggetti**, o entrambi?

4. **Il rail deve restare nascosto dentro gli editor?** È la scelta corrente
   (`isEditorTab`), motivata dal commento `Dashboard.tsx:552–556` (ridondanza coi menu
   File/Edit/Jjodel). Se la fase porta le istanze nel rail, quella motivazione decade
   proprio nel contesto in cui servirebbero.

5. **R1 va verificato prima o dopo la scelta di strategia?** Se il rimontaggio del
   dock su cambio modalità è reale, condiziona qualunque soluzione che persista stato
   nel dock.

6. **Ambito di pulizia ammesso.** Il codice morto di §2.1/§2.3 è dentro i file che la
   fase toccherebbe. Rimuoverlo, annotarlo `// TODO: cleanup`, o lasciarlo intatto?

7. **Token vs literal nel rail progetto (R6)** — la fase può portare `.leftbar--project`
   sui token (con conseguente comparsa del dark mode), o lo stile resta congelato?

---

## 7. Fuori scope, registrato

- `Dock.tsx:104` `getInitialPanelWidth` è `@deprecated`, importato da `Navbar.tsx:51`
  e mai chiamato.
- `Navbar.tsx:896–916` — stato e handler di `layoutMode` senza JSX che li usi.
- `Dock.tsx:164–226` — i due handler `LAYOUT_MODE_CHANGE` / `handleDockResize` sono
  gatati su `children.length >= 2`: inerti col dockbox a child unico.
- `DockManager.openViewpoint` apre il primo metamodello se nessun editor è attivo
  (`:227–231`), quindi cliccare un viewpoint dal rail può **nascondere il rail stesso**
  come effetto collaterale.
- `Dashboard.ProjectCatalog` ha due bottoni «Duplicate» con handler vuoto
  (`Dashboard.tsx:437`, `:458`).
