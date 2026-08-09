# Fase 2 · F2 — Structural swap: canvas full-width + overlay floating impilato

**Tipo:** implementazione scoped (Fase 2, **commit unico atomico**). Denso: multi-file. NON discovery.
**Data prompt:** 2026-07-29
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Base:** report `docs/discovery/discovery_2026-07-29_f2_overlay_mount_migration.md` + report floating `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md` + ratifiche 2026-07-29. Precondizione: **F1 (redirect Documentation) già committato** (`refactor(dock): route documentation tab to canvas group`).

> Il commit centrale della fase floating. Rimuove il figlio destro del dock (Properties+Tree escono dal dock), estende il canvas a tutta larghezza, e monta Properties+Tree come **overlay flottante impilato** (portal su body) sopra il canvas. Atomico: non deve mai esistere uno stato intermedio con doppio render di Properties o con Properties irraggiungibile.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**.
- **Critical-zone:** NESSUN file di F2 è in critical-zone (verificato nel report: catena dock+overlay+persistenza pulita, zero import `useJjomSync`/`portDistribution`/`sync/*`). **Non toccare** `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`: l'inset del fitView/minimap è F3/F4, non questo commit.
- **Commit che tocca >3 file** → §"Formato modifiche" di CLAUDE.md: **elenca prima** tutti i file e cosa cambia in ciascuno (fatto in §3 qui), poi procedi.
- **`git add` SCOPED:** solo i file di §3 per path esplicito. **MAI `git add .`** (vedi Passo 0: card 2A unstaged da assorbire + possibile WIP TextStyle da tenere fuori).
- Zero refactoring opportunistico. Non rinominare identificatori esistenti. Non toccare i mode `'tab'`/`'popup'`/`'inline'` (solo aggiunta di `'floating'`). Non ritirare il width-lock in questo commit (è F5).
- Preferisci `str_replace` puntuali. `docs/claude-code-log.md` aggiornato a fine task.

## 0.bis — Passo 0 OBBLIGATORIO: triage del working tree (hard stop se ambiguo)

Lo stato git è incerto: le modifiche **card 2A** (Fase 2A) sono **unstaged** (mai committate; `git log` in testa `35da2610c`), e potrebbe esserci un **WIP TextStyle** concorrente non correlato.

1. Esegui `git status` e `git diff --stat`. Elenca i file con modifiche unstaged.
2. Identifica: quali modifiche unstaged sono **card 2A** (attese in `properties-with-tree-view.scss`: gutter interno, ombra soft, chrome card) e quali potrebbero essere **WIP TextStyle** (file di editor TextStyle, non correlati all'overlay).
3. **F2 assorbe le modifiche card 2A** (stesso file `properties-with-tree-view.scss` che F2 tocca) → verranno committate insieme a F2, corretto.
4. **Se in un file che F2 toccherà (§3) ci sono modifiche unstaged che NON riconosci come card 2A** (es. WIP TextStyle mescolato nello stesso file), **fermati e segnala** con il `git diff` di quel file, prima di editare. Non mescolare concern estranei nel commit F2.
5. I file WIP TextStyle **non** in §3 non entrano nel commit (li esclude naturalmente il `git add` scoped): lasciali unstaged.

## 1. COSA

- Il canvas si estende a **tutta larghezza** sotto le card (rimosso il figlio destro del dockbox).
- Properties + Tree diventano un **overlay flottante impilato** ancorato in alto a destra, portalato su `document.body` (`position:fixed`, tier z ~900), con **Tree sopra** e **Properties sotto**.
- Il pattern è Figma/tldraw: il canvas passa sotto le card (pan-under già accettato).

Comportamento atteso: aprendo un modello/metamodello, il canvas riempie l'area; l'overlay Properties+Tree galleggia in alto a destra a 8px dal bordo; nascondendo entrambe le card compare la pill di riapertura (cluster esistente); sui contesti non-canvas (summary, documentation) l'overlay non appare.

## 2. Decisioni ratificate (NON reinterpretare)

1. **Mount host:** `ProjectDashboard` (`Dashboard.tsx`), sibling di `<Dock/>`.
2. **Mode:** nuovo valore `'floating'` aggiunto all'union `PropertiesWithTreeViewProps.mode` (additivo).
3. **Gate render** (`PropertiesWithTreeView.tsx:318`): estendere a includere `'floating'` (rende lo split). **Gate width-lock** (`:258`): **invariato** → `'floating'` NON scrive gli attr body del dock (`--properties-tree-tab-width`, `data-properties-tree-*`).
4. **Gating overlay:** riuso di `activeEditorType`/`showFloatingCluster` (già dock-independent). Overlay reso quando `activeEditorType ∈ {model, metamodel}`; cluster/pill quando entrambe le card nascoste (`bothCollapsed`). Kill-switch CSS esistente (`:961-963`, `canvas-only`/`documentation`) **mantenuto**.
5. **Disposizione:** Tree sopra, Properties sotto. Colonna overlay larghezza ~**400px** (tarabile), resize dal **bordo sinistro** (`col-resize`). Split verticale Tree(top, altezza fissa ~**240px**)/Properties(bottom, flex), resize con handle orizzontale (`row-resize`). Offset destro **8px**; offset top da tarare a vista (sotto la toolbar del canvas); z **900**.
6. **Atomico:** rimozione figlio destro + mount overlay nello **stesso commit**. Niente migrazione layout (persistenza rc-dock = codice morto, confermato). Width-lock retire = F5, **non ora**.

## 3. File toccati (4 + log)

1. **`src/components/abstract/Dock.tsx`** — rimuovi la costruzione del figlio destro del dockbox: il `push` di `children[1]` (`:337-348`, il pannello `editors` con la tab Properties) e il riferimento a `<PropertiesWithTreeView mode='tab'/>` nella tab Properties (`:282`). Il dockbox nasce single-child → canvas full-width per costruzione (report C1: rc-dock normalizza il figlio unico a 100%, nessun CSS nuovo). `groups.editors`/`rightSize` diventano orfani: **lasciali** (cleanup separato). Non toccare `handleLayoutChange`/`handleDockResize` (guard `>=2` già no-op).
2. **`src/components/editors/PropertiesWithTreeView.tsx`** — (a) aggiungi `'floating'` all'union `mode`; (b) estendi il gate render `:318` a `if (mode !== 'tab' && mode !== 'floating') return <Info mode={mode}/>`; (c) lascia `:258` invariato; (d) per `mode==='floating'` avvolgi il return principale (lo split) in `createPortal(<div className="properties-tree-overlay">…</div>, document.body)` con `position:fixed`; (e) gate del render overlay su `activeEditorType ∈ {model,metamodel}`; (f) riorienta i due handler resize (vedi §4.2). Il cluster/pill esistente (`:448-470`) resta come riapertura.
3. **`src/components/editors/properties-with-tree-view.scss`** — regole **mode-scoped** per l'overlay floating (nuova classe `.properties-tree-overlay` o scope su un modificatore): `position:fixed; top:<taratura>; right:8px; z-index:900`; contenitore interno `flex-direction:column`; Tree sopra (via `order` o riordino, senza toccare gli altri mode); Tree altezza fissa, Properties `flex:1`; handle riorientati (`row-resize` per lo split, `col-resize` sul bordo sinistro per la larghezza). **Assorbe** qui le modifiche card 2A unstaged (chrome card, ombra, gutter). Non toccare le regole dei mode `tab`/`popup`/`inline`.
4. **`src/pages/components/Dashboard.tsx`** — monta `<PropertiesWithTreeView mode='floating'/>` come sibling di `<Dock/>` (dentro `.project-dock-wrapper` `:622` o alla radice del fragment `:609`). È dentro Redux + `TreeViewPanelProvider` (nessuna barriera di context, report A2).
5. **`docs/claude-code-log.md`** — entry a fine task.

## 4. COME (dettaglio per i punti non ovvi)

### 4.1 Dock.tsx — rimozione figlio destro
Il layout è ricostruito fresco a ogni render (`:323`). Rimuovendo il `push` di `children[1]` (`:348`) il dockbox resta con `children[0]` (gruppo canvas), che rc-dock porta a 100%. Verifica che nessun altro punto assuma `children[1]` esista senza guard (report: `handleLayoutChange :353-394` legge `children[0]`; guard `>=2` a `:172/:214` già no-op). Non rimuovere `groups.editors` né `calculatePanelSizes` (orfani innocui, cleanup separato per tenere la diff leggibile).

### 4.2 PropertiesWithTreeView.tsx — portal e handle
- **Portal:** per `mode==='floating'`, l'intero contenuto (lo split) va in `createPortal(..., document.body)` dentro un wrapper `position:fixed`. Oggi solo il cluster lo fa (`:448-470`): riusa lo stesso pattern per il contenuto principale.
- **Gating:** l'overlay (split) si rende quando `activeEditorType ∈ {model,metamodel}`; la pill (cluster) quando `bothCollapsed` (già `:245-247`). Overlay e pill mutuamente esclusivi. Le card singole continuano a nascondersi via `showPropertiesPanel`/`showTreePanel` (localStorage esistente).
- **Handle (il punto più delicato, verifica visiva attenta):** oggi due handler basati su `clientX`/delta-X:
  - `handleResizeStart` (`:65-95`, oggi = Tree width) → **riorienta a split verticale**: `clientY`/delta-Y, regola l'**altezza** del Tree (top). Cursore `row-resize`.
  - `handlePropsResizeStart` (`:111-139`, oggi = Properties width) → **riorienta a larghezza overlay**: resta `clientX`/delta-X ma dal **bordo sinistro** dell'overlay (ancorato a destra → trascinare a sinistra allarga; **attenzione al segno**). Cursore `col-resize`.
  - Applica il riorientamento **solo** per `mode==='floating'`. Clamp min/max come oggi.

### 4.3 SCSS — layout impilato
Scope tutte le nuove regole sotto `.properties-tree-overlay` (o un modificatore `--floating`), così i mode `tab`/`popup`/`inline` restano intatti. Tree sopra via `order` (preferito) o riordino; niente `column-reverse` se altera l'ordine di focus in modo confuso. Offset top: valore iniziale che parta **sotto** la toolbar Concrete Syntax (proposta ~64px, **da tarare a vista**), right `8px`, larghezza ~`400px`, z `900`. Verifica nomi classi nuovi con grep globale (collisioni CSS = bug invisibili, §CLAUDE.md).

### 4.4 Dashboard.tsx — mount
Aggiungi `<PropertiesWithTreeView mode='floating'/>` sibling di `<Dock/>`. Il parent DOM è indifferente (portala su body); conta solo lifecycle React (montato su `/project`) + context (ok).

## 5. Cosa NON fare

- Non toccare `EditorV2.tsx`/sync/portDistribution (inset fitView = F3).
- Non insettare MiniMap/FAB (= F4).
- Non ritirare il width-lock né i suoi consumer CSS (`style.scss:1119-1168`): restano inerti, li rimuove F5.
- Non aggiungere migrazioni VersionFixer (nessun layout persistito).
- Non toccare i mode `tab`/`popup`/`inline` oltre l'aggiunta di `'floating'` all'union e al gate `:318`.
- Non `git add .`.

## 6. Verifica

- `npm run build` senza errori TypeScript.
- A vista (`localhost:3001`, hard refresh):
  1. Apri un modello: il canvas riempie tutta la larghezza; l'overlay Properties+Tree galleggia in alto a destra (Tree sopra, Properties sotto), a 8px dal bordo destro, sopra il canvas.
  2. Il canvas passa **sotto** le card (pan-under): sposta un nodo sotto l'overlay, resta pannabile fuori.
  3. Resize: il bordo sinistro allarga/stringe l'overlay; l'handle tra Tree e Properties ne regola le altezze. Nessun salto invertito (verifica il segno).
  4. Nascondi entrambe le card → compare la pill di riapertura; riclicca → torna l'overlay.
  5. Vai su summary/ProjectEditor o Documentation (tab canvas, post-F1): l'overlay **non** appare.
  6. Nessun doppio Properties, nessun divider destro residuo, nessuna striscia di sfondo dietro le card.
- Conferma che le modifiche card 2A (chrome/ombra) sono presenti nell'overlay (assorbite).

## 7. Chiusura

- Aggiorna `docs/claude-code-log.md` (tipo `refactor`, una entry: prompt, file toccati, esito, nota "assorbe card 2A unstaged").
- `git add` **solo** i 4 file + il log, per path esplicito. Verifica con `git status` che nessun WIP estraneo sia staged.
- Commit convenzionale, inglese, una riga. Es: `refactor(panels): float properties+tree overlay over full-width canvas`.
- **Hard stop dopo il commit:** torna in chat per la verifica visiva di Alfonso prima di F3 (insetti fitView/viewport).

## 8. RIFERIMENTI

- Report F2: `docs/discovery/discovery_2026-07-29_f2_overlay_mount_migration.md` (A mount, B persistenza morta, C1 full-width, C2 impilato, C3 cluster, injection point F2a/F2b).
- Report floating: `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md` (A1 mount chain, B6 overlay/z-index, B7 resize/cluster, B8 retire width-lock).
- Ratifiche 2026-07-29: impilato, overlay=portal body z ~900, offset 8px, mount Dashboard, mode floating.
