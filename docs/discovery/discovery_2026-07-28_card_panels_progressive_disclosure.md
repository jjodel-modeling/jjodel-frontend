# Discovery (read-only) — Pannelli a card indipendenti + progressive disclosure (Properties)

**Data**: 2026-07-28
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery Fase 1 (read-only). Nessuna modifica al sorgente, nessun commit, nessun build.
**Nome documento prompt**: 2026-07-28 (Fase 1 card panels + progressive disclosure)

---

## Obiettivo

Mappare **com'e implementato oggi** (a) il layout a dock che contiene Tree e Properties, per renderli
**card indipendenti** (angoli arrotondati, elevazione, inset) senza rompere resize/split/collapse; e
(b) il meccanismo Basic/Advanced e la struttura interna del pannello di authoring del vertex, per
introdurre la **progressive disclosure** del mockup "after" (toggle Basic/Advanced nell'header,
sezioni in maiuscolo, in Basic si nascondono compartments, badges e il ramo conditional-visibility).
Nessuna implementazione qui.

## Metodo

- Riuso dei due discovery precedenti citati dal prompt: `discovery_2026-07-28_properties_panel_redesign.md`
  (meccanismo Basic/Advanced, sub-tab locale, `.props-header*`, catena host, checkbox) e
  `discovery_2026-07-28_tree_view_redesign.md` (catena host tree, `.tree-view-panel-*`, critical-zone tree).
- Lettura diretta di `hooks/useInterfaceMode.ts` (intero) e di `VertexAuthoringPanel.tsx:193-332`
  (struttura render verificata di persona) + `ui/FormSection/FormSection.tsx` (intero).
- Due agenti read-only paralleli (findings verificati sui punti caldi contro il codice):
  - **Parte A** (dock/container/resize/chrome/collapse/critical-zone): `Dock.tsx`, `DockLayout.tsx`,
    `DockManager.tsx`, `PropertiesWithTreeView.tsx`, `properties-with-tree-view.scss`, `style.scss`,
    `abstract/docking.scss`, `dock/MyRcDock.tsx`/`MyDock.tsx`.
  - **Parte B** (authoring/sezioni/compartments/badges/conditional/sharing): `views/ViewData.tsx`,
    `VertexAuthoringPanel.tsx`, `LabelListEditor.tsx`/`LabelEntryEditor.tsx`,
    `FieldCompartmentListEditor.tsx`, `BadgeListEditor.tsx`, `ui/ConditionalEditor/ConditionalEditor.tsx`,
    `EdgeAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`, `ui/FormSection/*`, `ui/index.ts`.

## File letti / analizzati (path completi)

Prefisso `frontend/src/`.
- `hooks/useInterfaceMode.ts` (intero)
- `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (verificato `193-332`)
- `components/ui/FormSection/FormSection.tsx` + `FormSection.module.css` + `components/ui/index.ts:59-60`
- `components/abstract/Dock.tsx`, `DockLayout.tsx`, `DockManager.tsx`
- `components/editors/PropertiesWithTreeView.tsx` + `components/editors/properties-with-tree-view.scss`
- `components/dock/MyRcDock.tsx`, `MyDock.tsx`; `style.scss` (rc-dock), `components/abstract/docking.scss`
- `components/editors/views/ViewData.tsx`
- `components/editor-v2/viewpoint/authoring/` : `LabelListEditor.tsx`, `LabelEntryEditor.tsx`,
  `FieldCompartmentListEditor.tsx`, `BadgeListEditor.tsx`, `EdgeAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`
- `components/ui/ConditionalEditor/ConditionalEditor.tsx`
- `styles/components/_form-system.scss` (`.jj-field-label`, `.jj-section-*`)

---

# PARTE A — Container / dock (card per entrambi i pannelli)

## A1 — Layout host

**Libreria di docking: rc-dock.** `Dock.tsx:7` importa `LayoutData` da `'rc-dock'`. Il layout e un
`dockbox` orizzontale con due figli:
- `Dock.tsx:323` `const layout: LayoutData = { dockbox: { mode: 'horizontal', children: [] } }`
- `Dock.tsx:330` figlio SINISTRO = `{ tabs: [ModelsSummary], size: leftSize }` (canvas / models summary)
- `Dock.tsx:348` figlio DESTRO = `{ tabs, size: rightSize }` (gruppo editor)
- Reso a `Dock.tsx:398` `<PinnableDock key={''+advanced} ref=... defaultLayout={layout} ... />`
  (`PinnableDock` da `../dock/MyRcDock`, `Dock.tsx:12`).

**La tab "Properties" e l'unico contenuto del pannello destro.** `Dock.tsx:282`
`structure = { ... content: <TabContent ...><PropertiesWithTreeView mode={'tab'}/></TabContent> }`,
pushata a `Dock.tsx:338`.

**Il container affiancato e `.properties-with-tree-view`** — un flex ROW reso dentro la tab
(`PropertiesWithTreeView.tsx:330-333`; stile `properties-with-tree-view.scss:30-41`:
`display:flex; height/width:100%; overflow:hidden; background:#fff; position:relative`).
Due colonne:
- **Properties = colonna SINISTRA** — `.properties-panel-container` (`PropertiesWithTreeView.tsx:337-339`),
  stile `properties-with-tree-view.scss:47-88`.
- **Tree View = colonna DESTRA** — `.tree-view-panel-container` (`PropertiesWithTreeView.tsx:406-408`),
  stile `properties-with-tree-view.scss:327-365`; ospita `<TreeViewContent />` a `PropertiesWithTreeView.tsx:437`.

**`PropertiesWithTreeView` implementa il PROPRIO split interno**, come tab-leaf dentro rc-dock. NON usa
`DockLayout` (morto: `DockLayout.tsx:1` esporta solo `export const unused = '?'`, tutto il resto
commentato) ne `DockManager` per lo split (`DockManager.tsx` e solo un helper imperativo che tiene il
ref `DockManager.dock`, assegnato a `Dock.tsx:398`, per il tab-loading).

**Attenzione — commento stale.** L'header di `PropertiesWithTreeView.tsx:13-22` dice "Left: Properties
FLUID / Right: Tree FIXED 260px": **e obsoleto**. Il modello vivo ("fixed-widths 2026-07-06") da a
**entrambe** le colonne width inline fisse: Properties `propsWidth` 400-700 default 440
(`PropertiesWithTreeView.tsx:37-40`), Tree `width` 200-500 default 260 (`:26-28`), entrambe
`flex: 0 0 auto` (`properties-with-tree-view.scss:52, 328`). Il lato (Properties sx, Tree dx) e
corretto; "fluid" no.

## A2 — Resize / split

Ci sono **due livelli indipendenti** di resize:

**(A) Esterno, canvas <-> tab Properties — splitter della libreria rc-dock.** `.dock-divider`
(`style.scss:578-587`, `flex:0 0 1px; border-left:1px`), cursore `ew-resize` (`:610-612`), handle hover
`::after` (`:591-608`). Divide i due `dockbox.children`. **Ma** la larghezza del pannello destro e
sovrascritta dal width-lock (sotto), quindi trascinare il divider rc-dock e in gran parte superato dalle
width interne.

**(B) Interno, Properties <-> Tree — drag handle CUSTOM (nessuna libreria).**
- Handle Tree: `.tree-view-panel-resize-handle` (`PropertiesWithTreeView.tsx:410-418`), handler
  `handleResizeStart` (`:65-95`, formula `startWidth - delta`, handle sul bordo SINISTRO del tree
  ancorato a destra); stile `position:absolute; left:-3px; width:6px; z-index:10`
  (`properties-with-tree-view.scss:372-402`).
- Handle Properties: `.properties-panel-resize-handle` (`PropertiesWithTreeView.tsx:341-347`), handler
  `handlePropsResizeStart` (`:111-139`); stile `position:absolute; left:0; width:6px; z-index:11`
  (`properties-with-tree-view.scss:95-125`).
- I due handle si renderizzano solo se entrambi i pannelli sono espansi:
  `showResizeHandle = showPropertiesPanel && showTreePanel` (`PropertiesWithTreeView.tsx:239, 410`).

**Driver delle larghezze:** width/minWidth/maxWidth inline per container (`PropertiesWithTreeView.tsx:339,
408`) + `flex:0 0 auto` (`properties-with-tree-view.scss:52, 328`). La larghezza dell'INTERA TAB e
**bloccata** via una CSS custom property `--properties-tree-tab-width` scritta su `document.body`
(`PropertiesWithTreeView.tsx:257-280`), consumata da `style.scss:1119-1128` che forza
`.dock-hbox > .dock-panel:last-child` a quella larghezza. Durante il drag
`data-properties-tree-dragging` disabilita la transizione (`style.scss:1133-1138`).

### A2.bis — RISCHIO PRINCIPALE: cosa si rompe con margin / shadow / border-radius / gap attorno ai pannelli

1. **La matematica del width-lock assume gap fra pannelli = 0 e inset esterno = 0.**
   `tabWidth = propsWidth + width` con entrambi aperti (`PropertiesWithTreeView.tsx:261`);
   `= (propsWidth|width) + COLLAPSED_PANEL_TOGGLE_WIDTH` con uno collassato (`:262-263`).
   `COLLAPSED_PANEL_TOGGLE_WIDTH = 28` e esplicitamente la MARGIN-BOX del toggle (24 + 2 + 2), documentato
   "must match the SCSS" (`PropertiesWithTreeView.tsx:42-46`; margini `properties-with-tree-view.scss:262-269`).
   Ogni margine/gap/bordo di card aggiunge larghezza reale oltre `--properties-tree-tab-width`; poiche
   `.properties-with-tree-view` e `overflow:hidden` (`:34`) e il last-child rc-dock e forzato a quella
   larghezza esatta (`style.scss:1122-1125`), l'eccedenza viene **clippata / va in overflow**.
2. **`overflow:hidden` taglia le ombre.** `.properties-with-tree-view` (`:34`) e i due container (`:57,
   :333`) clippano l'overflow. Le box-shadow delle card vengono tagliate ai bordi container/tab, a meno di
   aggiungere padding al wrapper — che pero cambia di nuovo la width-math.
3. **La geometria degli handle assume pannelli edge-to-edge a giunzione condivisa.** Il tree handle
   protrude `left:-3px` (`:376`) per stare a cavallo della giunzione fra le due colonne; il Properties
   handle sta `left:0; z-index:11` vs tree `z-index:10` di proposito per non rubare la hitzone `ew-resize`
   del divider rc-dock (commento `:93-99`). Le linee `::before` da 1px di entrambi gli handle si
   sovrappongono al `border-left` condiviso. Un margine/gap fra le due colonne lascerebbe questi handle
   **sospesi nel vuoto** e disallineati dalla giunzione visiva.
4. **Oggi non c'e sfondo dietro i pannelli.** Gli sfondi vivono su `.properties-with-tree-view`
   (`#fff`, `:35`) e su `.dock-panel` (`background: var(--color-bg-primary)`, `style.scss:504`). Uno
   "sfondo dietro le card" va aggiunto a uno di questi (o al width-locked `.dock-hbox >
   .dock-panel:last-child`, `style.scss:1120`).

## A3 — Chrome attuale

**I pannelli sono FLUSH / edge-to-edge.** Hanno sfondo e una giunzione `border-left` da 1px, ma
**nessun** border-radius, box-shadow, margin, gap. Sfondi/bordi (tutti **LOCALI** a
`properties-with-tree-view.scss`, usati solo da `PropertiesWithTreeView.tsx`):
- Wrapper esterno `.properties-with-tree-view` — `background:#fff` (`:35`).
- Properties `.properties-panel-container` — `background:#f8fafc; border-left:1px solid #e2e8f0` (`:59-60`).
- Tree `.tree-view-panel-container` — `background:#fff; border-left:1px solid $color-border` (`:334-335`).
- Header `.properties-panel-header` / `.tree-view-panel-header` — `background:#fff; border-bottom:1px`
  (`:132-156`, `:448-474`).
- **Precedenti di stile "card" gia presenti**: inset shadow `treeViewHighlight` (`:416-426`); il cluster
  flottante `.properties-tree-floating-cluster` (`:874-916`) e **gia** `border-radius:8px; box-shadow:0
  2px 8px` — buon precedente da imitare per la card.

**Classi da toccare per la card** (radius, shadow, margin): `.properties-panel-container`
(`properties-with-tree-view.scss:47`) e `.tree-view-panel-container` (`:327`); + uno sfondo/padding su
`.properties-with-tree-view` (`:30`) per stare dietro le card.

**Classi CONDIVISE (rischiose — NON restilare per la card):**
- `.dock-panel` (`style.scss:500-514`), `.dock-content` (`:318`), `.dock-tabpane` (`:334`),
  `.dock-divider` (`:578`), `.dock-hbox` — classi GLOBALI rc-dock usate da OGNI pannello/tab dell'app
  (canvas, console, metadata, ...), stilate anche in `abstract/docking.scss` (che ha gia varianti
  `.dock-style-card` a `docking.scss:62-105`, ma sono chrome della tab-bar rc-dock, non di questi pannelli).
- `.dock-hbox > .dock-panel:last-child` (`style.scss:1120-1128`) e il container width-locked del gruppo
  card, ma e gated da `body[data-properties-tree-width-lock]` → e il posto globale **piu sicuro** dove
  mettere lo "sfondo dietro le card".
- `.tree-node__*` / `.tree-DModel` ecc. (`properties-with-tree-view.scss:604-727`) rispecchiano lo stile
  righe del tree (vedi discovery tree) — lasciare stare per un task card.

**Classi LOCALI (sicure da toccare):** `.properties-with-tree-view`, `.properties-panel-container`,
`.tree-view-panel-container`, i due `*-header`, i due `*-resize-handle`, `.collapsed-panel-toggle` —
definite solo in `properties-with-tree-view.scss` e consumate solo da `PropertiesWithTreeView.tsx`.

## A4 — Collapse

Ogni pannello ha il proprio chevron di collapse nell'header:
- **Properties:** `.properties-panel-toggle-btn` (`bi-chevron-right`) → `toggleProperties`
  (`PropertiesWithTreeView.tsx:360-366`). Stato `isPropertiesVisible` (`:148-163`), persistito su
  localStorage `jjodel_property_panel_visible` (`:33, :157`).
- **Tree:** `.tree-view-toggle-btn` (`bi-chevron-left`) → `toggleTreeView` da `useTreeViewPanel()`
  (`PropertiesWithTreeView.tsx:428-434`, context `:177-185`).

**Meccanismo = SWAP di elemento DOM, non width:0/display:none.** Quando un pannello e collassato, il suo
`*-container` viene **smontato** e sostituito da un bottone compatto 24x24 `<CollapsedPanelToggle>`
(`PropertiesWithTreeView.tsx:336-398` Properties, `:405-442` tree; componente `:488-502`; stile
`.collapsed-panel-toggle` `properties-with-tree-view.scss:262-295`). `showPropertiesPanel`/`showTreePanel`
(`:237-238`) governano lo swap.

**Caso entrambi collassati:** nessun toggle in-panel; `tabWidth = 0` (`:264`); un cluster di riapertura
flottante e portalato su `<body>` (`:448-470`, gated `showFloatingCluster` `:246`). Il CSS azzera il
last-child dock-panel e nasconde il divider (`style.scss:1147-1168`).

**Interazione card <-> collapse:** poiche il collapse fa swap verso un bottone nudo da 24px (non
un'animazione di width), il chrome della card **sparisce** quando collassato ed e rimpiazzato da
`.collapsed-panel-toggle`. Il chrome card va pensato anche per il toggle collassato (o si accetta che la
card svanisca). Il width-lock usa `COLLAPSED_PANEL_TOGGLE_WIDTH = 28` (margin-box) per il lato collassato
(`:262-263`); se la card aggiunge margine al toggle, questa costante **e** i margini SCSS (`:266-269`)
vanno tenuti in sync o la larghezza tab si desincronizza.

## A5 — Critical-zone (dock/container)

**Verifica esplicita: NESSUN import** di `useJjomSync` / `portDistribution` / `editor-v2/sync/*` in tutta
la catena dock/container. Grep "no match" su
`Dock.tsx`, `DockLayout.tsx`, `DockManager.tsx`, `PropertiesWithTreeView.tsx`, `TreeViewContent.tsx`,
`TreeViewSidebar.tsx`. L'unico riferimento `editor-v2` nella catena e `TreeViewContent.tsx:26-27`
(`useNodeProblems`/`NodeProblem` da `editor-v2/problems/*` — registry dei problemi, NON sync; verificato
anche transitivamente: `editor-v2/problems/` non tira dentro sync/portDistribution).
`MyRcDock.tsx`/`MyDock.tsx` confermati senza import critical-zone.

→ **La Fase 2 (container/card) NON richiede Layer Impact Report.** (§3.1/§3.2 non toccati.) Il rischio
della Fase 2 container e di **coupling CSS/JS** (width-lock + selettori globali rc-dock), non di layer
sync — vedi A2.bis e "Dipendenze e rischi".

---

# PARTE B — Progressive disclosure (Properties)

## B6 — Meccanismo Basic/Advanced globale (`useInterfaceMode`)

**Hook** `hooks/useInterfaceMode.ts` (letto intero):
- Storage key `'jjodel.interfaceMode'` (`:17`); default **`'basic'`** (`:28`).
- `getInterfaceMode()`/`setInterfaceMode()`/`isAdvancedMode()`/`isBasicMode()` (`:22-52`); `setInterfaceMode`
  aggiorna anche il globale statico `U.interfaceMode` (`:37`).
- Hook React `useInterfaceMode()` (`:57-106`) → ritorna `{ mode, isBasic, isAdvanced, toggleMode, setMode }`.
  `toggleMode`/`setMode` scrivono localStorage + dispatchano `SystemEvents.INTERFACE_MODE_CHANGE`
  (`:87, :96`) + sync cross-tab via `storage` event (`:68-78`).

**Due rappresentazioni riconciliate** (come da discovery Properties): (A) hook `useInterfaceMode` +
statico `U.interfaceMode` + evento `INTERFACE_MODE_CHANGE`; (B) Redux `state.advanced`
(`redux/store.tsx:215`). Riconciliate nel Navbar (`Navbar.tsx:838-866`).

**Consumo attuale:** `Info.tsx` consuma entrambe (`:33, :111, :1408`). **`ViewData.tsx`, `views/data/*`,
`editor-v2/viewpoint/authoring/*` NON consumano NESSUNA delle due** → il progressive disclosure sul lato
view (authoring) e **greenfield**. Wiring consigliato: **riusare `useInterfaceMode`** dentro il pannello
di authoring (o `state.advanced` se si preferisce Redux, gia usato dall'host `PropertiesWithTreeView.tsx:166`
per la sezione NODE); **non** creare un nuovo meccanismo.

## B7 — Sub-tab locale e dove va il toggle nell'header

**Il sub-tab locale esiste ed e SCOLLEGATO dal mode globale.**
- `VertexAuthoringPanel.tsx:55` `const [tab, setTab] = useState<'basic'|'advanced'>('basic')` (commento
  `:54`: "pure local UI state ... never touches view.ir or the draft").
- Reso come controllo segmentato a `:199-202` (due `Button`, variant su `tab`).

**NUANCE CRITICA — l'asse `tab` esistente NON e l'asse del progressive disclosure richiesto.** Oggi `tab`
significa **visuale vs matching**, non disclosure:
- `tab === 'basic'` → tutto il blocco visuale (Label, Shape, Fill, Border, Resizable, Labels,
  Compartments, Badges) — `VertexAuthoringPanel.tsx:216-314`.
- `tab === 'advanced'` → **solo** `MatchingSection` (metaclassi/predicate/priorita/exclusive) + un HelpText
  — `:316-329`.

Cioe l'"Advanced" attuale mostra **solo** il matching, e il "Basic" attuale mostra **gia** compartments,
badges e i conditional switch. Il progressive disclosure richiesto (Basic nasconde compartments/badges/
conditional) e un concetto **ortogonale**. → decisione di design (vedi Domande aperte): (a) **riusare**
`tab` ridefinendone la semantica (Advanced = matching **+** compartments/badges + conditional switch;
Basic = shape/fill/border/sizing/labels con conditional forzato Fixed), oppure (b) aggiungere un
**secondo** asse `mode` indipendente accanto a `:55` (due toggle Basic/Advanced sarebbero pero confusi).

**Header dove mettere il toggle:**
- Header locale del pannello: `.jj-field-label` "IR View authoring" (`VertexAuthoringPanel.tsx:196`),
  seguito dal controllo segmentato (`:199-202`) — **e** la sede naturale del toggle disclosure (dove gia
  vive quello esistente).
- L'header esterno view/viewpoint `props-header props-header--view` e a `ViewData.tsx:157` (chrome
  condiviso VIEW/VIEWPOINT: back button, breadcrumb `path-list`, type badge, help) — **non** IR-specifico:
  un toggle disclosure vertex-only NON va li, resta nel pannello vicino a `:199`.

## B8 — Struttura in sezioni (dove vanno gli header in maiuscolo)

**Oggi = stack piatto di blocchi `.jj-field`; gli "header" sono `.jj-field-label` normali.** Nessun
elemento wrapper di sezione, nessun header in maiuscolo. Tutto dentro un unico
`<section className="properties-tab properties-panel">` (`VertexAuthoringPanel.tsx:195`).

Ordine di render dentro `tab === 'basic'` (`:216-314`), **verificato di persona**:
1. **Label** — `.jj-field` `:219-222` (Input).
2. **Shape** — `.jj-field` `:225-236` (`ConditionalEditor<ShapeForm>` → Select `FORM_OPTIONS`).
3. **Fill** — `.jj-field` `:239-250` (`ConditionalEditor` → ColorPicker).
4. **Border** — un solo `.jj-field` `:253-261` con dentro Color/Width/Style (tre sub-label
   `.jj-field-label`, ColorPicker + NumberInput + Select `BORDER_STYLE_OPTIONS`).
5. **Resizable / Sizing** — `.jj-field` `:265-282` (Checkbox `Resizable` + HelpText + Button "Propagate size").
6. **Labels** — pseudo-header `.jj-field-label` `:285` + `<LabelListEditor>` `:286-292` (l'editor NON e
   dentro un `.jj-field`).
7. **Field compartments** — pseudo-header `.jj-field-label` `:295` + `<FieldCompartmentListEditor>` `:296-302`.
8. **Badges** — pseudo-header `.jj-field-label` `:305` + `<BadgeListEditor>` `:306-312`.

`.jj-field-label` = `styles/components/_form-system.scss:951-959` (11px, weight 500, grigio, **NON**
maiuscolo, no letter-spacing). I tre "header" (`:285/295/305`) usano la STESSA classe delle label di
campo, distinti solo da `marginTop` inline → oggi non c'e gerarchia di sezione visiva.

**Primitiva di sezione in maiuscolo GIA ESISTENTE ed esportata — riusare, non inventare CSS:**
- `FormSection` (`components/ui/FormSection/FormSection.tsx:25-37`): rende `<h3 className={styles.title}>`
  (titolo auto-maiuscolo) + divider opzionale + `.content` in colonna flex. Props `{ title, divider?,
  children }` (`:4-20`). Verificato di persona.
- CSS `.title` maiuscolo: `FormSection.module.css:9-16` (`text-transform:uppercase; letter-spacing:0.05em;
  weight semibold; slate-500`).
- Esportata dal barrel `components/ui/index.ts:59-60` → `import { FormSection } from '../../../ui'` senza
  nuovo wiring. Oggi usata solo in `components/ui/examples/FormExample.tsx` (mai in un pannello authoring).
- Variante **collassabile** in maiuscolo alternativa: `.jj-section-header` / `.jj-section-title`
  (`_form-system.scss:1137-1163`), usata da `Info.tsx` (se si vogliono sezioni espandibili invece che
  header statici).

**Mapping proposto (pattern, non sezioni letterali del mockup — il mockup e antecedente a Shape/Fill):**
avvolgere i blocchi JSX esistenti in `<FormSection title="...">` dentro il fragment `tab === 'basic'`:
- **SHAPE** → Label + Shape (`:219-236`)
- **FILL** → Fill (`:239-250`)
- **LINE / BORDER** → il `.jj-field` Border (`:253-261`) — nota terminologia "Border" vs mockup "Line"
  (open question ereditata dalla discovery Properties P4)
- **SIZING** → Resizable (`:265-282`)
- **LABELS** → header `:285` + `LabelListEditor` (`:286-292`)
- **COMPARTMENTS** → header `:295` + editor (`:296-302`) — Advanced-only (B9a)
- **BADGES** → header `:305` + editor (`:306-312`) — Advanced-only (B9b)

## B9 — Cosa nascondere in Basic (identificato nel codice)

### (a) Compartments
- Componente `FieldCompartmentListEditor` (`editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`),
  montato a `VertexAuthoringPanel.tsx:296-302` (header `:295`).
- Dato: `const fieldCompartments = draft.fieldCompartments ?? []` (`:180`); commit
  `onChange={(next) => patch({ ...draft, fieldCompartments: next })}` (`:301`).
- **Nascondere in Basic:** avvolgere header+editor (`:295-302`) in `{advanced && (...)}`. Nessun thread di
  prop: il blocco e interamente locale al pannello; il dato fa round-trip verbatim perche l'intero `draft`
  (compreso `fieldCompartments`) e riscritto al commit (`VertexAuthoringPanel.tsx:75`).

### (b) Badges
- Componente `BadgeListEditor` (`.../BadgeListEditor.tsx`), montato a `VertexAuthoringPanel.tsx:306-312`
  (header `:305`).
- Dato: `const badges = shape.badges ?? []` (`:179`); commit `onChange={(next) => patchShape({ badges: next })}`
  (`:311`). Round-trip garantito dal commit whole-object.
- **Nascondere in Basic:** avvolgere header+editor (`:305-312`) in `{advanced && (...)}`.

### (c) Ramo conditional-visibility (lo switch Fixed/Conditional)
Lo switch vive nel `ConditionalEditor` **condiviso** (`ui/ConditionalEditor/ConditionalEditor.tsx`):
- Bottoni segmentati **Fixed / Conditional** (il "branch selector") a `:65-68` (`.modeToggle`).
- Modo Fixed delega a `renderValue` a `:70`.
- **Ramo condizionale** (da nascondere in Basic) = blocco `:72-108`: `When` `PredicateBuilder` (`:79-85`),
  `Then` (`:87-90`), checkbox "Include else branch" (`:91-99`), `Otherwise` opzionale (`:100-105`).
- `mode` derivato dalla forma del valore a `:42-44` (`isWhen ? 'conditional' : 'fixed'`).

**I `ConditionalEditor` "visible" targettati** dalla feature:
- `LabelEntryEditor.tsx:86-95` — `label.visible` (**questo** e quello mostrato in Basic, dato che i Labels
  restano in Basic).
- `FieldCompartmentListEditor.tsx:249-258` — `comp.visible` (nascosto comunque se compartments → Advanced).
- `BadgeListEditor.tsx:90-100` — `badge.visible` (nascosto comunque se badges → Advanced).
- Inoltre Shape e Fill del vertex usano `ConditionalEditor` (`VertexAuthoringPanel.tsx:227, 241`): sono
  editor di *valore* condizionale, ma portano lo **stesso** switch Fixed/Conditional → un Basic che forza
  "Fixed only" semplificherebbe anche Shape/Fill.

**Prop/flag per forzare "Fixed only" — NON ESISTE ANCORA.** `ConditionalEditor` rende sempre il toggle
(`:65-68`); `ConditionalEditorProps` (`:10-20`) non ha `allowConditional`/`mode`/`hideSwitch`. Serve:
1. aggiungere una prop opzionale (es. `allowConditional?: boolean`, default `true`) a `ConditionalEditorProps`
   e gate su `:65-68` / `:72-108`, forzando `renderValue(...)` (Fixed) quando `false`;
2. threadare `advanced` (o `!basic`) da `VertexAuthoringPanel` giu attraverso `LabelListEditor` →
   `LabelEntryEditor` (nessuno dei due ha oggi una prop `mode`: `LabelListEditorProps` `LabelListEditor.tsx:9-17`,
   `LabelEntryEditorProps` `LabelEntryEditor.tsx:25-33`) + ai call-site Shape/Fill (`:227, 241`).

**Caveat comportamentale (importante):** un valore GIA condizionale (`isWhen === true`) sotto un naive
"hide switch + force fixed" cadrebbe su `renderValue((value as T) ?? defaultValue, ...)` a `:70` →
renderizzerebbe l'oggetto `Conditional` grezzo come valore (**bug**). Approccio sicuro in Basic: se il
valore e gia condizionale, o si continua a mostrarlo (nascondendo solo la *possibilita di switchare*), o
si mostra una chip read-only (imitando il pattern multi-rule a `ConditionalEditor.tsx:47-49`).

## B10 — Condivisione (impatto vertex vs edge/row)

**Tre pannelli SEPARATI, non un pannello condiviso.** Routing in `ViewData.tsx:89-94` per `ir.kind`:
`'vertex'` → `VertexAuthoringPanel`, `'row'` → `RowAuthoringPanel`, `'edge'` → `EdgeAuthoringPanel`.
Ognuno ha la propria copia del ciclo seed/validate/debounced-commit. **Non esiste un pannello `textstyle`**:
"textstyle" e `TextStyleField.tsx`/`TextStyleEditor.tsx`, editor foglia usati dentro i Labels, non un
`ir.kind` instradato.

**Vertex-specifici** (import reali): `LabelListEditor`, `FieldCompartmentListEditor`, `BadgeListEditor`,
`MatchingSection` importati **solo** da `VertexAuthoringPanel.tsx:9-12`. Edge/Row autorano il matching
inline (Edge `EdgeAuthoringPanel.tsx:266-347`, Row `RowAuthoringPanel.tsx:218-288`).

**Editor foglia condivisi:** `ConditionalEditor` usato da Vertex (`:227/241`), Edge
(`EdgeAuthoringPanel.tsx:353/365/377`), Row (`RowAuthoringPanel.tsx:314`), + `LabelEntryEditor`,
`FieldCompartmentListEditor`, `BadgeListEditor`, `MatchingSection`, `TextStyleField`, `TextStyleEditor`.
Condivisi anche `FormSection`, `PredicateBuilder`, `ListEditor`, `TextSourceEditor`, `Button`.

**Impatto:**
- **Nascondere compartments & badges = vertex-only automaticamente**: quegli editor e i dati
  `draft.fieldCompartments`/`shape.badges` esistono solo su `VertexViewIR` e si montano solo in
  `VertexAuthoringPanel`. Edge/Row non hanno compartments/badges → nessun impatto.
- **Nascondere lo switch conditional = potenzialmente cross-panel se fatto a livello `ConditionalEditor`**:
  essendo condiviso, aggiungere `allowConditional` con default `true` lascia Edge/Row invariati finche non
  passano `false`. Poiche questa fase e vertex-only, si threada il flag solo dal `mode` di
  `VertexAuthoringPanel` e Edge/Row usano il default → disclosure vertex-only senza toccare Edge/Row, al
  costo di **una prop opzionale su un componente condiviso** (§2: aggiunta additiva a interfaccia esportata
  = OK).
- **Header in maiuscolo = vertex-only** se si avvolge solo il JSX in `VertexAuthoringPanel.tsx:216-314`.
  Edge (`EdgeAuthoringPanel.tsx:255-434`) e Row (`RowAuthoringPanel.tsx:207-330`) usano i propri
  pseudo-header `.jj-field-label` piatti e resterebbero invariati salvo migrazione separata.

---

## Dipendenze e rischi (sintesi)

**Parte A (card):**
1. **Width-lock `--properties-tree-tab-width` (rischio #1)**: la larghezza tab e calcolata come somma
   esatta delle width dei pannelli (+28 collapsed), assumendo gap/inset = 0 (`PropertiesWithTreeView.tsx:257-280`,
   `style.scss:1119-1128`). Ogni margine/gap/bordo di card va **compensato** nella width-math o clippa
   (`overflow:hidden` `:34`). La card come "inset con sfondo dietro" e piu sicura fatta con **padding
   interno / gutter** dentro il container width-locked, non con margin che allarga la tab.
2. **`overflow:hidden` taglia le box-shadow** (wrapper + entrambi i container). Serve un gutter/padding
   che contenga l'ombra, coerente col punto 1.
3. **Resize handle a giunzione condivisa** (`left:-3px`, z-index 10/11): un gap fra le colonne li lascia
   sospesi → vanno riposizionati se si introduce spazio fra card.
4. **Collapse = swap DOM** verso `.collapsed-panel-toggle` 24x24: il chrome card sparisce al collapse; la
   costante `COLLAPSED_PANEL_TOGGLE_WIDTH=28` (margin-box) e accoppiata ai margini SCSS (`:266-269`).
5. **Selettori globali rc-dock condivisi** (`.dock-panel`, `.dock-hbox`, `.dock-divider`, ...): NON toccare
   per la card; il punto sicuro per "sfondo dietro le card" e `.dock-hbox > .dock-panel:last-child` gated
   da `body[data-properties-tree-width-lock]` (`style.scss:1120`).
6. **Classi da NON rinominare** (public API / scoping esterno, §2): `.properties-with-tree-view`,
   `.properties-panel-container`, `.tree-view-panel-container`, `.view-editor-*`, `:has(.view-editor-root)`
   (`properties-with-tree-view.scss:63-85`).

**Parte B (progressive disclosure):**
7. **Asse `tab` esistente sovraccarico**: `basic|advanced` a `VertexAuthoringPanel.tsx:55` significa gia
   "visuale vs matching". Decidere se riusarlo (ridefinendo la semantica) o affiancare un `mode` — vedi
   Domande aperte. Rischio di doppio toggle confuso.
8. **`ConditionalEditor` condiviso**: `allowConditional` e additiva (default true) → sicura per Edge/Row,
   ma va threadata attraverso `LabelListEditor`/`LabelEntryEditor` (net-new prop `mode`/`allowConditional`).
9. **Valori gia condizionali in Basic**: force-fixed naive = bug di render (`:70`). Serve UX definita
   (read-only chip vs switch nascosto ma valore condizionale ancora mostrato).
10. **`FormSection` riusabile**: header maiuscoli senza nuovo CSS; ma cambia il markup del pannello (i
    `.jj-field-label` pseudo-header `:285/295/305` verrebbero sostituiti/avvolti) → verificare che lo
    spacing `--space-*` resti coerente.

## Critical-zone (Layer Impact Report)

**Non richiesto** per nessuna delle due fasi. Verifica esplicita §0: nessun import `useJjomSync`/
`portDistribution`/`canvasToJjom`/`syncState` nella catena dock/container (A5) ne in `editors/*` /
`editor-v2/viewpoint/authoring/*` (confermato dalle due discovery precedenti). Il rischio della Fase 2
container e di **coupling CSS/JS** (width-lock + selettori globali rc-dock), non di layer sync.

## Domande aperte per Alfonso

1. **Card senza rompere il width-lock (A2.bis)**: si preferisce la card come **inset con gutter/padding
   dentro** il container width-locked (piu sicuro, nessun cambio alla width-math), o come pannelli con
   **margin esterno** (richiede di riscrivere `PropertiesWithTreeView.tsx:257-280` + la costante
   `COLLAPSED_PANEL_TOGGLE_WIDTH` + i selettori `style.scss:1119-1168`)? Consiglio: gutter/padding.
2. **Sfondo dietro le card**: aggiungerlo su `.properties-with-tree-view` (`:30`, locale) o sul
   width-locked `.dock-hbox > .dock-panel:last-child` (`style.scss:1120`, globale ma gated)? E che colore
   (slate-50/`#f8fafc` gia usato dal Properties container)?
3. **Card e collapse**: quando un pannello collassa il chrome card sparisce (swap a toggle 24x24). Va bene
   cosi, o la card deve "ridursi" in un rail arrotondato?
4. **Asse Basic/Advanced (B7, rischio #7)**: **riusare** il `tab` esistente ridefinendone la semantica
   (Advanced = matching + compartments + badges + conditional switch; Basic = shape/fill/border/sizing/labels
   con conditional forzato Fixed) — **consigliato**, un solo toggle — oppure aggiungere un secondo asse
   `mode` indipendente? E il toggle resta nel pannello (`:199`) o va spostato altrove nell'header?
5. **Scope Fase 2 disclosure**: solo **vertex** in questa fase (compartments/badges sono vertex-only), con
   Edge/Row invariati (default `allowConditional=true`), confermi?
6. **Valori gia condizionali in Basic (rischio #9)**: se un campo e gia `Conditional`, in Basic lo mostro
   read-only (chip) o nascondo solo lo switch tenendo l'editor condizionale visibile?
7. **`FormSection` per gli header maiuscoli (B8)**: uso la primitiva esistente `FormSection` (statica) o la
   variante collassabile `.jj-section-*` (come `Info.tsx`)? Terminologia "Border" vs "Line" (open question
   ereditata da P4) da confermare.

---

## Hard stop

Report scritto. **STOP.** Nessuna modifica ai sorgenti, nessun commit, nessuna Fase 2. Nessuna entry in
`docs/claude-code-log.md` (fase read-only, come da prompt §4). L'analisi prosegue in chat a partire da
questo documento; la Fase 2 sara verosimilmente spezzata (container/card, poi progressive disclosure).
