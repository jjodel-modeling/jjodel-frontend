# Fase 2 · Tree View redesign (implementazione scoped)

**Tipo:** refactor (UI restyle, nessun cambio di modello dati)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Basato su:** `docs/discovery/discovery_2026-07-28_tree_view_redesign.md` (Fase 1). **Leggilo prima.**

> Redesign del Tree View (path vivo: `PropertiesWithTreeView` → `TreeViewContent`), scoped ai soli file dichiarati. **Restyle-only:** nessun rename di identificatori, nessun cambio di logica o interazione. 4 commit ordinati, ognuno con **hard stop per verifica visiva** di Alfonso su `localhost:3001` (hard-refresh) prima del successivo.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**.
- **Tocca SOLO i file in §2.** Se ne serve un altro, **chiedi prima**.
- Leggi **ogni file per intero** prima di editarlo. `str_replace` puntuali.
- **Zero refactoring opportunistico. Mai rinominare identificatori esistenti** (classi CSS/SCSS, props, funzioni, componenti, custom event, `data-*`). Le classi `tree-row`/`tree-node`/`tree-children` sono referenziate come **stringhe** in `components/forEndUser/Tooltip.tsx:167` (scope-guard) e come public API dal markup: **rename = rottura**. `grep -r` prima di ogni nuovo identificatore.
- **Critical-zone:** la discovery conferma nessun import di `useJjomSync`/`portDistribution` → **niente Layer Impact Report**.
- `git add <file specifici>` a ogni commit, **mai `git add .`** (nel working tree c'è WIP di un altro thread: TextStyle/size-readback). Commit convenzionale, inglese, una riga.
- Dopo ogni edit `npm run build` deve passare. Poi **HARD STOP**: conferma visiva di Alfonso prima del commit e del passo successivo.
- **Niente em dash** in stringhe/commenti. **Solo Bootstrap Icons.** Tokens: slate `#334155`, cyan `#0ea5e9` (solo accent, mai sulle righe), label 11px, griglia 8px (`--space-*`), **no layout shift**.
- I numeri di riga sono dalla discovery (indicativi): **individua per contenuto**.

## 0-bis. Invarianti da preservare (restyle, non ricablare)

- **double-click → PIN:** `CustomEvent JjodelEvents.PROPERTIES_PIN_VIEW` su `SubViewItem` via `EntityRow onDoubleClick` (`TreeViewContent.tsx:1175-1181`, `:1238`). Non rimuovere/spostare l'handler.
- **Selezione** (`_lastSelected`), **espandi/collassa** (`DProject.expandedTreeNodes`), **`data-element-id`** su ogni riga (target scroll + context-menu), **`.tree-row__actions`** hover-reveal, **inline-rename** (guardia `isRenaming`), **context-menu** (`useClassifierContextMenu`): tutti intatti.
- **`TreeViewSidebar.tsx`** (host orfano) non si tocca e non si cancella (§9).

## 0-ter. Decisioni ratificate (non re-interpretare)

Vedi `claude/ratifiche_2026-07-28_tree_view.md`. In sintesi: barra cyan via, sfondo tenue resta; icone lettere→glifi Bootstrap per tipo (mappa in C3); icona/chevron a 14px; guida di indentazione hairline per-container (non full-height); label 11px; `--space-*` solo sugli spot toccati. Token `--color-selection-bar` resta orfano (non ritirare, non toccare i file colori).

---

## 1. Obiettivo

Allineare il Tree View al mockup "after" (artifact `jjodel-panel-redesign`): **active state pulito** (rimozione barra cyan), **icone consistenti** (glifi Bootstrap per tipo), **guida di indentazione leggera**, **ritmo 8px e label 11px**. Restyle puro: nessun cambio di dati o interazione.

## 2. File in scope (SOLO questi)

1. `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (solo l'elemento **icona di tipo**, C3)
2. `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (stili riga, primario)
3. Il file di stile di `PropertiesWithTreeView` (`properties-with-tree-view.scss`, copie override sotto `.tree-view-panel-body`). **Conferma il path** leggendo la cartella.

**Must-NOT-touch:** `TreeViewSidebar.tsx`; i file token `_colors-light.scss`/`_colors-dark.scss`; `_form-system.scss`/`jj-*`; qualsiasi classe/attributo/handler esistente (solo restyle); il resto di `TreeViewContent.tsx` oltre l'elemento icona.

---

## 3. Commit ordinati (hard stop dopo ognuno), dal più sicuro al più rischioso

### C1 · `refactor(tree): clean active state, remove selection cyan bar`
**File:** `tree-view-sidebar.scss`
**COME:**
- Rimuovi il blocco `.tree-row--selected::before` (barra cyan, `~:1694-1703`).
- Tieni `.tree-row--selected { background-color: var(--color-selection-bg) }` (`~:1692`) e il suo `:hover`. Il dot `.tree-row__active-dot` resta invariato.
- Il token `--color-selection-bar` diventa orfano: **non toccare i file colori** (fuori §2); annotalo solo nel log a fine Fase 2.
**Verifica visiva:** riga selezionata = solo sfondo tenue, niente barra cyan a sinistra; il dot active pulsante c'è ancora; nessun layout shift. Controlla light e dark.

### C2 · `refactor(tree): 11px labels and 8px spacing rhythm`
**File:** `tree-view-sidebar.scss` (+ `properties-with-tree-view.scss` se il ritmo toccato vive nelle copie panel-body)
**COME:**
- Label a **11px** su `.tree-row__name` (`~:1728`), `.tree-feature__name` (`~:1891`), `.tree-instance__name` (`~:745`).
- Normalizza alla griglia 8px **solo** gli offender di spaziatura che tocchi (i 6/3/2px che rompono il ritmo nelle righe), usando `--space-*`. **Non** convertire tutto l'albero; **non** toccare `_form-system.scss`/`jj-*`.
**Verifica visiva:** label 11px coerenti su row/feature/instance; spaziatura più regolare; niente overflow/clipping.

### C3 · `refactor(tree): consistent Bootstrap type icons`
**File:** `TreeViewContent.tsx` (markup icona) + `tree-view-sidebar.scss` + `properties-with-tree-view.scss` (colore/size icona)
**COME:**
- Sostituisci la **lettera** testuale del type-icon con un **glifo Bootstrap per tipo**. Mantieni il wrapper `<span className="tree-node__icon {typeClass}">` (porta il colore); dentro metti `<i className="bi bi-..." aria-hidden="true" />` col glifo mappato, e aggiungi un `title`/`aria-label` col nome del tipo sul wrapper (la lettera faceva da etichetta testuale, ora va preservata l'accessibilità). **Non** toccare badge/label/markers/`onClick`/`onDoubleClick`/`data-element-id`.
  **Mappa ratificata:** Metamodel `bi-diagram-3`, Package `bi-folder2`, Class `bi-square`, Attribute `bi-dash-lg`, Reference `bi-arrow-right`, Model (M1) `bi-file-earmark`, Viewpoint `bi-eye`, Sub-view `bi-easel`, Transformation `bi-arrow-left-right`, Rule `bi-list-check`, Helper `bi-wrench`.
- **Colore icona, fonte unica:** i token `--color-entity-*` (`tree-view-sidebar.scss ~:645-706`). Nel blocco `.tree-view-panel-body` (`properties-with-tree-view.scss ~:652-664`, che oggi **vince** con literal hardcoded text-only) sostituisci i literal con gli stessi `var(--color-entity-*)`, così la fonte del colore è una sola. Verifica anche gli override dark (`~:1048-1056`, `~:1290-1303`).
- **Dimensione:** unifica toggle (`.tree-node__toggle`) e icona (`.tree-node__icon`) a **14px** in entrambe le copie (panel-body da 20px `~:609` a 14px; sidebar già 14px `~:583`). Più proporzionato alla label 11px.
**Verifica visiva:** ogni tipo ha il suo glifo (niente più lettere); colori per-tipo coerenti in light e dark; chevron/icone a 14px allineati; Class vs Transformation e Reference vs Rule ora visivamente distinti; **double-click→pin sulle view ancora funzionante**; hover-actions e rename intatti.

### C4 · `refactor(tree): light per-container indentation guides`
**File:** `tree-view-sidebar.scss`
**COME:**
- Aggiungi una **hairline verticale per-container** via `.tree-children::before` (`.tree-children` ha già `position:relative` `~:1668`). 1px, ancorata all'offset di indentazione dei figli, che copre **solo l'estensione del proprio container** (NON full-height dal root: quella è stata rimossa il 2026-05-12 per invasività, `~:1660-1666`).
- **Colore:** slate a bassa opacità, **mai cyan**. Light `rgba(51,65,85,0.12)`, dark `rgba(148,163,184,0.15)` (o token neutro equivalente a bassa alpha se già presente). Riusa il blocco dark orfano `.tree-children::before` (`~:2005-2007`) come colore dark della guida invece di lasciarlo inerte.
**Verifica visiva:** guide leggere e per-livello (non una linea continua dal MEGAMODEL); appena percepibili in light e dark; nessuna sensazione di griglia invasiva. Se risulta troppo presente, abbassa l'alpha o proponi hover-only al hard-stop.

---

## 4. Chiusura

- Dopo **C4** e la conferma visiva finale: aggiorna `docs/claude-code-log.md` con **una entry** per l'intera Fase 2 Tree View (tipo `refactor`, prompt riassunto in una riga, i 3 file toccati, esito, nota: barra cyan rimossa + glifi Bootstrap per tipo + guida indentazione + 11px/8px; `--color-selection-bar` orfano da cleanup separato). Formato `CLAUDE.md`, riga finale `Nome del documento prompt: 2026-07-28 Fase 2 Tree View redesign`.
- Se emerge la necessità di toccare un file fuori §2 o rinominare una classe: **fermati e segnala**.

## 5. Riferimenti

- **Discovery Fase 1:** `docs/discovery/discovery_2026-07-28_tree_view_redesign.md`.
- **Ratifiche:** `claude/ratifiche_2026-07-28_tree_view.md` (D1-D5).
- **Mockup target:** artifact `jjodel-panel-redesign` (Tree View "after", barra cyan degli item attivi rimossa).
- **Invarianti:** `PROPERTIES_PIN_VIEW`, `_lastSelected`, `expandedTreeNodes`, `data-element-id`.
- **Tokens:** slate `#334155`, cyan `#0ea5e9` (solo accent), 11px label, 8px grid (`--space-*`), solo Bootstrap Icons, no layout shift.
