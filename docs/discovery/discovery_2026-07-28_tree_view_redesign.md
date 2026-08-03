# Discovery (read-only) — Tree View panel (redesign lato destro)

**Data**: 2026-07-28
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery Fase 1 (read-only). Nessuna modifica al sorgente, nessun commit, nessun build.
**Nome documento prompt**: 2026-07-28 (Fase 1 Tree View redesign)

---

## Obiettivo

Mappare **com'e implementato oggi** il Tree View (il pannello ad albero del progetto, affiancato
al Properties nella tab "Properties" del dock) per poter scopare con precisione la Fase 2 che lo
allinea al mockup "after" (artifact `jjodel-panel-redesign`): **icone consistenti, guide di
indentazione, active state pulito**, in particolare la **rimozione della barretta cyan a sinistra
degli item attivi**. Nessuna implementazione qui.

---

## Architettura del pannello (catena di host)

```
Dock.tsx:282  tab "Properties"  →  PropertiesWithTreeView (mode 'tab')
   PropertiesWithTreeView.tsx:405-439  →  colonna destra "TREE VIEW"  →  <TreeViewContent />  (:437)
       TreeViewContent.tsx  →  TreeViewContentConnected (connect, :2312)  →  TreeViewContentComponent (:1511)
           EntityRow (:575-667)  =  primitivo di riga condiviso da TUTTE le entita
```

**Fatto strutturale n.1 — due host, uno solo vivo.** `TreeViewContent` (il corpo dell'albero) e
renderizzato da due componenti host:
- **VIVO**: `PropertiesWithTreeView.tsx` (la colonna destra della tab "Properties" del dock,
  `Dock.tsx:282`). Rende `<TreeViewContent />` a `:437`. E **lo stesso file/host mappato nella Fase 1
  Properties**: Tree e Properties condividono il container split `.properties-with-tree-view`.
- **ORFANO**: `TreeViewSidebar.tsx` (rail adattivo per risoluzione: monitor/desktop/laptop-overlay).
  **Non e montato da nessuna parte** — grep di `<TreeViewSidebar` e degli import restituisce solo la
  sua definizione e la ri-esportazione in `index.ts`; nessun componente lo importa/renderizza. Codice
  morto (per regola §9 NON cancellare). **Ma** il suo foglio `tree-view-sidebar.scss` e importato da
  `PropertiesWithTreeView.tsx:10` → **e la fonte reale degli stili di riga dell'albero vivo**.

Conseguenza per la Fase 2: il target e `TreeViewContent.tsx` (markup righe) + `tree-view-sidebar.scss`
(stili righe) + il wrapper `.tree-view-panel-*` in `properties-with-tree-view.scss`. `TreeViewSidebar.tsx`
resta fuori scope (host morto), ma il suo SCSS e in scope perche condiviso.

---

## File letti / analizzati (path completi)

Diretti (io):
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (intero, 504 righe)
- `frontend/src/contexts/TreeViewPanelContext.tsx` (intero, 350 righe)
- `frontend/src/components/TreeViewSidebar/TreeViewSidebar.tsx` (intero, 249 righe — host orfano)
- `frontend/src/components/TreeViewSidebar/index.ts`
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (regioni chiave: 1169-1184, 1655-1724)
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (regione barra cyan 1655-1724)
- `frontend/src/events/registry.ts` (righe pin/toggle/scroll/editor-type)
- `frontend/src/styles/tokens/_colors-light.scss` / `_colors-dark.scss` (token `--color-selection-*`)
- `frontend/src/components/abstract/Dock.tsx` (tab Properties + nota tab tree rimossa)

Via 2 agenti read-only paralleli (inventari esaustivi, verificati poi io sui punti caldi):
- **TreeViewContent.tsx** (2320 righe) → costruzione albero, struttura riga, icone, indentazione,
  selezione/highlight, interazioni/eventi, mode basic/advanced, import critical-zone.
- **SCSS** (`tree-view-sidebar.scss` 2044 + `properties-with-tree-view.scss` 937) → stili riga,
  identita esatta della barra cyan, colori icona, indentazione, scala spaziatura, classi
  condivise/collisioni, igiene token.

---

## Findings — risposte alle 8 domande del prompt

### Q1 — Componente e costruzione dell'albero

- Componente vivo: `PropertiesWithTreeView.tsx:437` → `TreeViewContent`. Il pubblico
  `TreeViewContent` (`:2317`) wrappa `TreeViewContentConnected` (`connect`, `:2312`) →
  `TreeViewContentComponent` (`:1511`).
- L'albero e costruito **interamente in `mapStateToProps`** (`TreeViewContent.tsx:2136-2306`) dal
  **Redux `DState`** via navigazione **LModel/L-proxy** + `state.idlookup`. I dati sono precomputati in
  **interfacce plain serializzabili** (non proxy vivi), dichiarate `:79-160`
  (`TreeModelData`, `TreeClassData`, `TreePackageData`, `TreeMetamodelData`, `TreeSubViewData`,
  `TreeViewpointData`, `TreeTransformationData`, ...).
- Fonti: `state.m2models` (metamodelli), `state.m1models`, `state.graphs` (gate `modelsWithGraph`:
  solo modelli con tab aperta almeno una volta), `LProject.getProject()` (viewpoints, activeViewpoint),
  `state._lastSelected?.modelElement` (selezione + risoluzione active model).
- **Ricorsivo** su due livelli: build (`buildPackageData` `:2036`, `buildSubViewTree` `:2255`) e render
  (`PackageNode` `:844`, `SubViewItem` `:1125`).
- **Un unico renderer condiviso** — NON tre alberi separati. Tutte le entita reali passano da
  **`EntityRow`** (`:575-667`). Gerarchia (sezioni sintetiche `SECTION_KEYS` `:48-55`):

```
Megamodel  →  Metamodels  →  MetamodelNode[M]  →  PackageNode[P] (ric.)  →  ClassNode[C]
                                                                              →  StructuralFeatureRow attr[A] / ref[R]
                             →  Models section   →  ModelNode[m]  →  FeatureRow (istanza M1)
              Viewpoints  →  Syntax / Validation  →  ViewpointNode[VP]  →  SubViewItem[v] (ric.)
              Documentation  →  DocumentationEmptyState
              TransformationItem[C]  →  rule[R] / helper[H]
```

### Q2 — Struttura di una riga (item row)

Primitivo `EntityRow`, JSX `:609-663`. Wrapper:
```
<div className="tree-row ${selected ? 'tree-row--selected' : ''} ${highlightClass}"
     style={{ paddingLeft: depth * 12 }} data-element-id=...>
```
Composizione, in ordine:
1. **Chevron slot** (`:616-625`): `<button className="tree-node__toggle">` con
   `<i className="bi bi-chevron-down|right">`, oppure placeholder
   `<span className="tree-node__toggle is-leaf">` (mantiene l'allineamento sulle foglie).
2. **Content** (`:627`): `<div className="tree-row__content" onClick onDoubleClick>` contenente:
   - **type icon** = `<span className="tree-node__icon ${badgeClassName}">{badge}</span>` — **una
     LETTERA testuale** (M/P/m/C/VP/v/A/R), non un glyph (vedi Q4);
   - **label** = `<span className="tree-row__name ${nameClassName}">{name}</span>`;
   - opzionali: `.tree-pill`, marker `bi-bezier2 .tree-edge-marker` / `bi-stack .tree-stack-marker`,
     `bi-exclamation-triangle-fill .tree-problem-icon`, `.tree-node__badge--new` ("NEW").
3. **Actions** (`:656`): `<span className="tree-row__actions">` — bottoni hover-reveal.
4. **Active dot** (`:657-661`): `<span className="tree-row__active-dot--viewpoint|model">`.

Righe con struttura DIVERSA da `EntityRow`:
- `SectionNode` (`:521-542`): `.tree-section` › `.tree-section__header` (toggle + `.tree-section__label`
  + `.tree-counter`) › figli in `.tree-children`.
- `FeatureRow` (istanza M1, `:697-704`): `.tree-row.tree-row--feature`; selezione applicata su
  `.tree-row__content--selected` — **classe diversa** da `tree-row--selected` (e priva di regola CSS,
  vedi Q3).
- Rule/helper di trasformazione (`:1438-1453`): `.tree-row.tree-row--feature` inline con
  `.tree-node__icon.tree-rule`/`.tree-helper`.

### Q3 — Active / selected state e LA BARRETTA CYAN (target #1)

**Identita esatta della barretta cyan da rimuovere** (verificata sul codice corrente):

- **Selettore**: `.tree-row--selected::before`
- **File:linea**: `tree-view-sidebar.scss:1694-1703`
```scss
.tree-row {
  position: relative;                 // :1685 — ancora la barra
  &--selected {
    background-color: var(--color-selection-bg);   // :1692 — RESTA
    &::before {                                     // :1694-1703 — LA BARRA
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 2px;
      background-color: var(--color-selection-bar); // il cyan
      border-radius: 1px;
    }
    &:hover { background-color: var(--color-selection-bg); }
  }
}
```
- **Colore risolto** (`var(--color-selection-bar)`): light `#0891b2` (`_colors-light.scss:353`),
  dark `#22D3EE` (`_colors-dark.scss:253`). Questi due token (`--color-selection-bar` +
  `--color-selection-bg`) sono usati **SOLO** da questa selezione — TODO esplicito a
  `_colors-light.scss:350`. Togliendo la barra ma tenendo lo sfondo, `--color-selection-bar` resta
  orfano (candidato retire).
- **Cosa RESTA togliendo la barra**: lo sfondo tenue `.tree-row--selected { background-color:
  var(--color-selection-bg) }` (light `#e0f7fa` / dark `rgba(8,145,178,0.18)`). Testo e peso font
  **non cambiano** con la selezione (label resta `--color-text-primary`, 12px, peso normale). Nessun
  override dark oltre ai token (commento `:2002`).
- **Classe applicata dal markup**: `EntityRow:611` aggiunge `tree-row--selected` quando
  `isSelected = selectedId === id`, con `selectedId = state._lastSelected?.modelElement`
  (`mapStateToProps:2296`). Rimozione = solo CSS; nessun tocco al markup.
- **Il commento del codice conferma il target**: `tree-view-sidebar.scss:1660-1666` nomina
  letteralmente "la barra cyan della selezione su `.tree-row--selected`" e documenta che la **guida di
  indentazione globale** (`.tree-children::before`) e gia stata **rimossa** nel polish 2026-05-12
  perche "appariva come una linea grigia continua... troppo invasiva" (rilevante per Q5).

Altri stati visivi (da non confondere con la barra):
- **Highlight transiente** (feedback esecuzione script): `tree-row--highlighted` +
  `tree-row--action-${action}` (`EntityRow:605-611`), pilotato da `highlightedElementId` del
  `TreeViewPanelContext`.
- **Active-in-editor** = **dot pulsante** `.tree-row__active-dot--viewpoint|model`
  (`tree-view-sidebar.scss:1813-1837`), NON una barra: il redesign 2026-05-08 aveva gia sostituito una
  barra persistente "active" con questo dot (design intent, commento `:1807-1812`).
- **Dead/legacy**: `.tree-node__header--selected` (`tree-view-sidebar.scss:573`, copia
  `properties-with-tree-view.scss:691`) NON e reso da alcun componente → stila nulla oggi.

### Q4 — Icone (consistenza)

**Due sistemi coesistono** — e questa e la principale inconsistenza:
- **(a) type icon = LETTERA testuale badge** (NON `bi`): `<span className="tree-node__icon
  ${badgeClassName}">{badge}</span>`, `badge ∈ {M,P,m,C,VP,v,A,R}` (+ H per helper). Mappa
  tipo→lettera+classe: Metamodel `M`/`tree-DModel`, Package `P`/`tree-DPackage`, Model `m`/`tree-nested-model`,
  Class `C`/`tree-DClass`, Attribute `A`/`tree-DAttribute`, Reference `R`/`tree-DReference`,
  Viewpoint `VP`/`tree-viewpoint`, Sub-view `v`/`tree-leaf-view`, Transformation `C`/`tree-transformation`,
  rule `R`/`tree-rule`, helper `H`/`tree-helper`.
- **(b) Bootstrap Icons** (`bi bi-*`) per il resto: chevron (`bi-chevron-down|right`), marker
  (`bi-bezier2` edge, `bi-stack` non-exclusive, `bi-exclamation-triangle-fill` problem), azioni
  (`bi-copy`, `bi-trash`, `bi-plus-lg`), search (`bi-search`, `bi-x`), empty state (`bi-diagram-3`,
  `bi-stars`).

Verdetto consistenza:
- Tutte le `bi` sono **Bootstrap Icons**; nessun SVG/emoji/altra libreria; nessun `font-size` inline
  (tutto via CSS). → conforme al DS su questo asse.
- **Inconsistenza reale**: il "type icon" e una **lettera**, non un glyph → il redesign "icone
  consistenti" verosimilmente vuole sostituire le lettere-badge con **glifi `bi` coerenti per tipo**.
  Collisioni di lettera oggi mascherate solo dal colore: `C` = Class **e** Transformation
  (`:794` vs `:1422`); `R` = Reference **e** Rule (`:730` vs `:1441`).
- **Colore icona = CSS-driven per classe di tipo**, ma con **DOPPIA definizione**: badge tinto
  (token `--color-entity-*`) `tree-view-sidebar.scss:645-706` vs **text-only hardcoded**
  `properties-with-tree-view.scss:652-664` (quest'ultima **vince** nello split host
  `.tree-view-panel-body`), + override dark (`:1048-1056`, `:1290-1303`). Armonizzare le due fonti fa
  parte del redesign.

### Q5 — Indentazione (guida vs padding)

- **Solo padding calcolato**, nessuna guida oggi: `paddingLeft = depth * TREE_INDENT_STEP` con
  `TREE_INDENT_STEP = 12` (`TreeViewContent.tsx:44`), inline su ogni riga (`:525, 612, 698, 1438,
  1447, 1475`). `depth` passato e incrementato per livello. Nessuna scala CSS `padding-left`, nessuna
  custom property `--depth`.
- **Nessuna linea guida verticale** presente. La guida globale `.tree-children::before` e stata
  **rimossa** (commento `tree-view-sidebar.scss:1660-1666`, 2026-05-12: era "una linea grigia continua
  dal MEGAMODEL fino in fondo... troppo invasiva"). Resta solo `.tree-children { position: relative }`
  (`:1668-1670`) come ancora per decorazioni assolute future. Regola dark orfana
  `.tree-children::before { background: rgba(255,255,255,0.15) }` (`:2005-2007`) e **inerte** (base
  senza `content`).
- Distinzione confermata: la barra sinistra dell'active (Q3, `.tree-row--selected::before`) e cosa
  **diversa** da qualsiasi guida di indentazione — non c'e guida disegnata.
- → il mockup "guide di indentazione" e **greenfield**, ma **con un precedente rimosso per
  invasivita**: la Fase 2 dovra proporre una guida leggera/per-livello (non una linea continua
  full-height) per non re-incappare nel problema documentato.

### Q6 — Stile (file SCSS, classi condivise, scala di spaziatura)

- **Due file SCSS**: `tree-view-sidebar.scss` (2044, **primario** — il blocco redesign `.tree-row*` e
  a `:1612-2044`) + `properties-with-tree-view.scss` (937, wrapper host split; **copie scoped** sotto
  `.tree-view-panel-body` a `:603-724` che **vincono per specificita** nello split host).
- **Sistema vivo vs morto**: LIVE `.tree-row*`; DEAD `.tree-node__header*` / `.tree-node__name` /
  `.metamodel-tree__*` (nessun componente li rende — definiti solo nei due SCSS). Non sprecare effort
  sul legacy; per regola §2/§9 lasciarli (`// TODO: cleanup`), non cancellare.
- **Trappola specificita**: `.tree-node__toggle` e `.tree-node__icon` sono **ridefiniti** in
  `.tree-view-panel-body` (`properties-with-tree-view.scss:603-724`) → in questo host quelle copie
  vincono. `.tree-row` e `.tree-row__name` **non** sono ridefiniti li (arrivano solo da
  `tree-view-sidebar.scss`). Es. chevron: 14px in sidebar (`:583`) vs **20px** in panel-body
  (`:609`, quello che si vede).
- **Scala spaziatura**: **nessun token** `--space-*`/`--gap-*`/`--panel-*` (grep vuoto). Scale SCSS
  private (`$radius-sm:4px`... `tree-view-sidebar.scss:23-32`) ma **nessun `$spacing-*`**; padding/gap
  sono **px ad-hoc** (2/3/4/6/8/12/16). Griglia 8px **solo parzialmente onorata** (6px, 3px, 2px la
  rompono). Diverso dal Properties (che usa `--space-*` a macchia): qui i token spazio **non esistono
  affatto** nell'albero.
- **Label a 12px** (`.tree-row__name` `:1728`) → redesign vuole **11px**; allineare anche
  `.tree-feature__name` (`:1891`), `.tree-instance__name` (`:745`).
- **Condivisione/collisioni**: `tree-row`, `tree-node`, `tree-children` sono referenziate come
  **stringhe-selettore** in `components/forEndUser/Tooltip.tsx:167` (scope guard per soppressione
  tooltip nei container albero) → **restyle sicuro, RENAME romperebbe lo scoping tooltip**. Nessuna
  collisione CSS con altri componenti visivi. Selettori che raggiungono ALTRI componenti:
  `:has(.view-editor-root)` (`properties-with-tree-view.scss:63-85`),
  `.properties-node-section__content .node-header` (`:769`), `body[data-layout-mode]/[data-active-tab]`
  kill-switch (`:934-936`).
- **Igiene token**: **nessun** token legacy vietato (`--accent`, `--bg-1..5`, `--secondary`,
  `--terziary`, `--radius`, bare `--color`) presente in nessuno dei due file. **Nota**:
  `var(--accent-cyan, #0ea5e9)` (`tree-view-sidebar.scss:168,179,373`; `properties-with-tree-view.scss:311`)
  — `--accent-cyan` **non e definito** in `styles/` → risolve **sempre** al literal `#0ea5e9` (cyan
  hardcoded travestito da token). Solo su resize-handle hover e search-toggle `.is-active`, **NON sulle
  righe**.

### Q7 — Stato / interazione da preservare in un restyle

- **Selezione**: click su riga → `SetRootFieldAction.new('_lastSelected', {node,view,modelElement})`
  (forme a 5 e 2 argomenti nel file). `FeatureRow` dispatcha in piu `JjodelEvents.SELECT_NODE`
  (`:691`); `TransformationItem` dispatcha `JjodelEvents.OPEN_TRANSFORMATION` (`:1408`).
- **Double-click → PIN** (comportamento da NON rompere, rif. `sessione_2026-07-23.md`): **solo su
  `SubViewItem`**, `handleDoubleClick` `TreeViewContent.tsx:1175-1181`:
  `window.dispatchEvent(new CustomEvent(JjodelEvents.PROPERTIES_PIN_VIEW, { detail: { selected: {
  node:'', view: view.id, modelElement:'' } } }))`. Ascoltato da `PropertiesWithTreeView.tsx:288-304`
  (toggle: stessa view gia pinnata → unpin; altra → re-target + riapre il Properties). Guardato su
  `isRenaming`. Registry `PROPERTIES_PIN_VIEW: 'jjodel:properties-pin-view'` (`registry.ts:37`). Il
  wiring e sull'`EntityRow` via `onDoubleClick` (`:1238`) → **un restyle delle righe non deve rimuovere
  questo handler**. Nota: il pin scatta **solo sulle view** (sub-view), non su Class/Package/Model/Viewpoint.
- **Espandi/collassa**: **NON** usa `TreeViewPanelContext.expandedNodeIds/toggleNode`; usa
  `DProject.expandedTreeNodes` **persistito** (default = espanso; prefisso `!` = collassato).
  `isExpandedFn`/`onToggleFn` (`:1642-1665`) → `SetFieldAction.new(projectId, 'expandedTreeNodes', ...)`
  (`:1664`). Durante la search: Set effimero `searchCollapsed` (no scrittura Redux). Cleanup id orfani
  (`:1671-1709`).
- **Altri eventi**: dispatcha `SELECT_NODE` (`:691`), `PROPERTIES_PIN_VIEW` (`:1178`),
  `OPEN_TRANSFORMATION` (`:1408`); ascolta `JjodelEvents.TRANSFORMATIONS` (`:1619`) e
  `SystemEvents.TREEVIEW_SCROLL` (`:1634` → `scrollIntoView` su `[data-element-id]`). Context-menu
  `useClassifierContextMenu` (`:440-498`) con listener document click/keydown(Esc)/scroll.
- **Context consumato**: solo `useTreeViewPanel()` (`:1519`) → `highlightedElementId`,
  `highlightedAction` (per l'highlight animato). Il resto del context
  (`isVisible/show/toggle/attentionPulse`) e consumato dall'**host** `PropertiesWithTreeView`, non da
  `TreeViewContent`.
- **Da preservare**: `data-element-id` su ogni riga (target di scroll-to + context-menu); le
  `.tree-row__actions` hover-reveal (copy/trash/add-view); l'inline-rename dentro `.tree-row__content`
  (interagisce con la guardia `isRenaming` del double-click).

### Q8 — Basic / Advanced (consumo di `useInterfaceMode`)

- **`TreeViewContent` NON consuma il mode globale**: zero match per
  `useInterfaceMode`/`interfaceMode`/`advanced`/`U.interfaceMode`/`state.advanced`. L'albero rende
  **identico** in Basic e Advanced.
- Il **solo** uso di `advanced` sul lato Tree e nell'HOST `PropertiesWithTreeView.tsx:166`
  (`const advanced = useSelector(state.advanced)`), ma pilota la **sezione NODE del Properties**
  (`:376-393`), **non** l'albero.
- → progressive disclosure sull'albero = **greenfield**. Se il redesign lo vuole, riusare il
  meccanismo esistente (Redux `state.advanced` gia usato nell'host, o `useInterfaceMode`), **non**
  crearne uno nuovo — coerente col finding della Fase 1 Properties.

---

## Critical-zone (Layer Impact Report)

**Non richiesto.** Nessun import di `useJjomSync` / `portDistribution` / `canvasToJjom` / `syncState`
in `TreeViewContent.tsx` ne negli host (`PropertiesWithTreeView.tsx`, `TreeViewSidebar.tsx`). Verifica
esplicita come da §0 del prompt. Il tree scrive D-layer solo via `SetFieldAction`/`SetRootFieldAction`
su `_lastSelected` e `expandedTreeNodes`, e via L-proxy (`lView.name`, `lView.duplicate`, `lView.delete`)
— nessun modulo critical-zone coinvolto. → la Fase 2 **non** produce Layer Impact Report.

---

## Dipendenze e rischi (sintesi)

1. **Barra cyan = 1 solo block CSS** (`tree-view-sidebar.scss:1694-1703`, `.tree-row--selected::before`).
   Rimozione pulita e locale; lo sfondo tenue (`--color-selection-bg`) resta se lo si vuole tenere.
   Token `--color-selection-bar` diventa orfano (candidato retire in `_colors-light/dark.scss`).
2. **Doppia definizione SCSS** (`tree-view-sidebar.scss` base vs `properties-with-tree-view.scss`
   `.tree-view-panel-body`): per `tree-node__toggle`/`tree-node__icon` vince la copia panel-body. Ogni
   restyle di quelle due classi va fatto sul **giusto** blocco (o su entrambi) o non si vedra. `.tree-row`
   e `.tree-row__name` invece sono solo nel primario.
3. **Icone = lettere, non glifi** (`tree-node__icon` testuale): "icone consistenti" e un cambio di
   sistema (lettere→`bi` per tipo), con collisioni di lettera oggi (C class/transformation, R
   reference/rule) e doppia fonte di colore da armonizzare.
4. **Guida di indentazione = greenfield MA con precedente rimosso per invasivita** (`:1660-1666`):
   proporre una guida leggera, non full-height continua.
5. **Nessun token di spaziatura** nell'albero (px ad-hoc, griglia 8px parziale): il ritmo 8px del
   redesign va introdotto ex novo (o con `--space-*` o con una scala `$spacing-*` locale) — decisione
   di Fase 2.
6. **Rename VIETATO** per `tree-row`/`tree-node`/`tree-children` (scope-guard stringa in
   `Tooltip.tsx:167`) e per tutte le classi rese da `TreeViewContent` (public API, §2): **solo
   restyle**.
7. **Host orfano `TreeViewSidebar.tsx`**: fuori scope (mai montato), ma il suo `tree-view-sidebar.scss`
   e la fonte degli stili → toccare lo SCSS e in scope, toccare il `.tsx` no.
8. **Pin double-click** e la sola interazione "fragile" da preservare: e sulle sub-view via
   `onDoubleClick` di `EntityRow`; il restyle non deve alterare il wiring.

---

## Domande aperte per Alfonso

1. **Scope host**: la Fase 2 tocca solo il tree dentro `PropertiesWithTreeView` (host vivo) + il suo
   SCSS condiviso `tree-view-sidebar.scss`, lasciando intatto `TreeViewSidebar.tsx` (host orfano),
   giusto? O vuoi che valuti anche la sorte dell'host morto (fuori scope in questa fase)?
2. **Barra cyan**: rimuovere **solo** il `::before` e **tenere** lo sfondo tenue `--color-selection-bg`
   come active state "pulito"? O active state ancora piu neutro (solo cambio peso/testo, niente
   sfondo)? E: ritiro dei token `--color-selection-bar` orfani ora o `// TODO: cleanup`?
3. **Icone consistenti**: confermi il passaggio da **lettere-badge** a **glifi Bootstrap per tipo**
   (es. class/package/attribute/reference/viewpoint/view)? In tal caso serve la mappa tipo→icona dal
   mockup (quali `bi-*`), e come rendere il colore (badge tinto vs text-only, oggi doppia fonte).
4. **Guida di indentazione**: che forma nel mockup? (linea per-livello ancorata ai `.tree-children`,
   sottile e non full-height, dato il precedente rimosso per invasivita). Colore/opacita?
5. **Ritmo 8px + 11px label**: introdurre i `--space-*` (assenti oggi) o una scala locale? Portare la
   label a 11px tocca `.tree-row__name` + `.tree-feature__name` + `.tree-instance__name`: le allineo
   tutte a 11px o solo la label principale?
6. **Doppia definizione toggle/icon** (14px sidebar vs 20px panel-body): riconcilio le due copie in una
   sola dimensione durante il restyle, o intervengo solo sulla copia panel-body (quella che si vede)?

---

## Hard stop

Report scritto. **STOP.** Nessuna modifica ai sorgenti, nessun commit, nessuna Fase 2. Nessuna entry
in `docs/claude-code-log.md` (fase read-only). L'analisi prosegue in chat a partire da questo documento.
