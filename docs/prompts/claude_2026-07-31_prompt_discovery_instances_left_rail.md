# Discovery — Fase INSTANCES / rail sinistro (read-only)

**Tipo:** discovery pura, nessuna modifica ai sorgenti. Output: report + log entry.
**Data prompt:** 2026-07-31
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** high
**Precondizione:** B5 (`bdb6b01`), swap checkbox→Toggle (`e9913d3`) e review round della card (`cc1cb51`) verificati a vista da Alfonso il 2026-07-31. Working tree con possibile WIP concorrente: sola lettura, mai `git add .`.

## 0. Contesto

Il redesign pannelli ha chiuso il lato destro: la card Properties + Tree View vive in un overlay floating montato su body (`.properties-tree-overlay`), fuori da rc-dock, sopra un canvas full-width; il dockbox è rimasto a child unico (gruppo `models`). Resta il lato sinistro: il rail di progetto (LeftBar) e il suo rapporto col gruppo dock che ospita le tab canvas.

Differenza strutturale rispetto a destra: il rail NON fluttua sopra il canvas. Sta accanto al dock a livello Dashboard e viene nascosto quando una tab editor diventa attiva. Prima di scegliere la strategia della fase (overlay anche a sinistra, restyle in place, ibrido) serve la mappa esatta di chi monta cosa e di chi possiede il ciclo di vita delle tab canvas.

Una ricognizione preliminare è stata fatta da chat su origin (`bdb6b01..07cee52`): i riferimenti path:riga qui sotto vengono da lì. Il working tree locale è la fonte di verità: verifica e correggi dove diverge, e segnala nel report se i file censiti divergono da origin.

## 1. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: segnala e fermati.
- Read-only sui sorgenti. Uniche scritture ammesse: il report di discovery e l'entry nel log.
- Critical-zone (`EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`): lettura consentita se serve a chiudere un punto, modifiche mai.
- Commit finale: solo report + log entry, `git add` per i due path espliciti. Mai `git add .`.

## 2. Punti da censire

### 2.1 LeftBar

`frontend/src/pages/components/LeftBar.tsx` (~533 righe).

- Varianti di rendering (`.leftbar`, `.leftbar--project`, riga ~365) e quando si attiva ciascuna (lista progetti vs progetto aperto).
- Inventario delle sezioni `psb-*`: header progetto con status badge (~140), back (~367), megamodel (~373), sezioni Metamodels/Models (`project?.metamodels` ~314, `project?.models` ~315) con badge, item arrow e "+ new", upload, "Recently Modified".
- Stato: collapsed per sezione (local-only, ~301), navigazione `?section=` via search param (~225-233, `ProjectSection`), eventuale stato Redux consumato.
- Handler: cosa succede ESATTAMENTE al click su un item metamodello vs modello vs megamodel (apre tab canvas via DockManager? naviga `?section=`? entrambi a seconda del tipo?). Percorso completo click → tab.
- Stili: `frontend/src/pages/dashboard.scss` risulta l'unico proprietario delle classi `psb-*`/`.leftbar` (24 occorrenze). Conferma, riporta il range di righe, e cerca stili sparsi altrove (`grep -rn "psb-\|leftbar" src/ --include=*.scss --include=*.css`).

### 2.2 Mount e visibilità

- `Dashboard.tsx:322` monta `<LeftBar active={active} projects={user?.projects}/>`; `hideLeftBar` (`:549`) pilotato da `EDITOR_TYPE_CHANGE` via `isEditorTab(editorType)` (`:573`). Censire il ciclo completo: chi emette `EDITOR_TYPE_CHANGE` (Dock.tsx `handleLayoutChange`; `ProjectEditor.tsx:1793` `open2()`; altri), quando il rail riappare, e cosa succede su reload con una tab editor attiva (`activeEditorType` è sticky: solo EDITOR_TYPE_CHANGE lo aggiorna).
- Tabella vista → rail visibile sì/no: dashboard progetti, progetto aperto (summary), editor metamodello, editor modello, documentation (interazione col kill-switch `data-active-tab="documentation"`, Dock.tsx ~377-382), summary/altre viste Navbar.
- Perché `Navbar.tsx` e `pages/components/index.ts` referenziano LeftBar (re-export o uso reale).
- Rapporto LeftBar ↔ ProjectEditor: la navigazione sezioni è URL-based dal rail (`ProjectEditor.tsx:243,395,543,2040`); censire chi legge `?section=` e cosa renderizza per sezione.

### 2.3 Dock e tab canvas

`components/abstract/Dock.tsx` (~425), `DockManager.tsx` (~373), `DockLayout.tsx` (~289), `components/dock/MyRcDock.tsx`, `components/abstract/tabs/*` (TabDataMaker, MetamodelTab, ModelTab, DocumentationTab, EditorSwitch, PersistanceTab, TestTab, ModelsSummaryTab).

- Come nasce una tab canvas: chi chiama DockManager, con quale TabData (TabDataMaker), prefix id `DockComponent_rightbar_` (:133), tab `project_summary` (:277).
- Gruppi: `models` (floatable, non maximizable, :267-271) è il gruppo vivo a child unico (:329); le consts gruppo `editors` (:282-293) sono orfane post-F2 (commenti :278-281 e :330-338). Stato reale di `groups.editors` e delle consts (backlog noto).
- `PinnableDock` (:388) e MyRcDock: cosa aggiungono a rc-dock (pin, fixed, `TabHeader.instances` registry).
- `handleLayoutChange` → `ACTIVE_TAB` (:340-353, semantica di `tabType` null) → `EDITOR_TYPE_CHANGE`.
- `calculatePanelSizes(layoutMode)` (:327) e layoutMode: `vertical-console` (branch :296, JS-only da console) e orfani split (`LayoutMode`, `style.scss:1042`, handler Navbar mai cablati): stato reale, senza toccarli.
- Vincoli rc-dock 3.3.0 rilevanti per un futuro intervento: cosa impone il dockbox a child unico, effetto di floatable/tabLocked.

### 2.4 INSTANCES oggi

- Dove vivono liste e azioni sulle istanze M1 lato sinistro: sezione Models del LeftBar, sezioni del ProjectEditor, StatusBar ("N instances").
- Percorso completo per creare / aprire / eliminare un'istanza dal rail oggi (handler, azioni Redux, apertura tab).
- Punti di contatto col Tree View destro (TreeViewContent ha già sezioni instances): SOLO i punti di contatto, il lato destro non è oggetto di questa fase.

### 2.5 Floating esistente: cosa è right-specific

Del meccanismo overlay destro (mount su body, viewport insets F3, resize, accordion, pill, modificatore `--floating`): elenca cosa è parametrico e cosa è cablato al lato destro (classi, inset, larghezze, assunzioni sul bordo destro). SOLO censimento: nessuna proposta di generalizzazione in questa fase.

### 2.6 Basic/Advanced a sinistra

Consumatori di `state.advanced` in LeftBar, Dashboard, ProjectEditor, Dock (grep su `state.advanced` e selector `advanced`): cosa cambia già oggi tra le modalità sul lato sinistro. La disclosure arriverà anche qui: serve la fotografia dello stato attuale, non proposte.

## 3. Report OBBLIGATORIO

`docs/discovery/discovery_2026-07-31_instances_left_rail.md` con: obiettivo; file letti (path completi); findings dei punti 2.1-2.6 con riferimenti path:riga; mappa "chi monta cosa" come albero testuale (Dashboard → Navbar / LeftBar / dock → tab canvas → contenuti); divergenze working tree vs origin sui file censiti; rischi; domande aperte per Alfonso.

NIENTE proposte di design nel report: le opzioni di fase (overlay, in place, ibrido) si decidono in chat sul report salvato. L'hard stop non è completo finché il report non è scritto.

## 4. Chiusura

- Entry in `docs/claude-code-log.md` (tipo `docs`).
- Commit: `docs: discovery report for instances/left-rail phase` con `git add docs/discovery/discovery_2026-07-31_instances_left_rail.md docs/claude-code-log.md`.
- **HARD STOP.** Nessuna Fase 2 in questo prompt: l'analisi avviene in chat.

## 5. Riferimenti

- Commenti F2 in `Dock.tsx` (:278-281, :330-338): morte del child destro del dockbox e consts orfane.
- Log entry B5 (2026-07-30) in `docs/claude-code-log.md`: la riconciliazione localStorage→Redux della modalità ora vive nel Navbar (la parte su `useInterfaceMode` di `discovery_2026-07-28_card_panels_progressive_disclosure.md` è superata su questo punto).
- Log entries 2026-07-30/31 (swap Toggle, review round) per lo stato corrente della card destra.
- Note di sessione: `vertical-console` è JS-only (`window.setVerticalConsole…`); porta di verifica visiva `localhost:3000` con hard refresh.
