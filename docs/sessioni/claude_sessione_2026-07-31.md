# Sessione 2026-07-31: chiusura serie B, discovery INSTANCES, R1, serie A

## Stato a fine sessione

**Serie B chiusa e verificata.** I tre commit della notte (B5 `bdb6b01` toggle nel Navbar, `e9913d3` swap checkbox→Toggle, `cc1cb51` review round card) hanno passato la verifica visiva 12/12 di Alfonso. Tutti gli hard stop pendenti sono chiusi.

**Fase INSTANCES avviata e già in esecuzione.** Discovery eseguita e committata (`docs/discovery/discovery_2026-07-31_instances_left_rail.md`), analisi in chat, quattro ratifiche, R1 confermato a runtime, prompt serie A (C0+C1+C2) generato ed eseguito da Claude Code a fine sessione ("abbiamo fatto tutto"). Gli esiti dettagliati dei tre commit NON sono stati riportati in chat: la prossima sessione li legge dal `docs/claude-code-log.md`.

**PUSH NON FATTO al momento del checkpoint**: origin fermo a `07cee5219` (verificato). Primo comando prossima sessione: `git log origin/alfonso-frontend-jjtl..HEAD`, controllo esiti nel log, push. Se le verifiche visive di C0/C1/C2 non fossero complete, farle con le checklist del prompt serie A (in particolare C0: il toggle non deve più chiudere le tab).

**WIP concorrente noto nel working tree** (authoring IR): ObjectNode, LabelEntryEditor, TextStyleEditor, irStyle, _form-system.scss, TextStyleField untracked. Mai `git add .`.

## Decisioni prese (2026-07-31, ratifiche in `ratifiche_2026-07-31_instances_left_rail.md`)

1. **Semantica INSTANCES**: il rail resta a livello artefatti (metamodelli, modelli M1, trasformazioni, viewpoint); gli oggetti M1 restano nel Tree View destro e nel canvas. Niente doppio albero.
2. **Contratto azioni rail**: item aprono via DockManager (`open2`/`openTransformation`/`openViewpoint`); i «+ New» diventano CustomEvent del registry gestiti da ProjectEditor (pattern `OPEN_MEGAMODEL`), con attivazione summary + scroll agli anchor `#section-*`; scritture `?section=` ritirate; voce Share rimossa finché il modal non esiste.
3. **Rail negli editor**: resta nascosto (status quo `isEditorTab`). Overlay sinistro on-demand possibile come passo futuro, senza toccare il dockbox.
4. **R1**: fix con key stabile (C0). Bonifica codice morto sì (C1, lista esplicita; preservare `.psb-item.active` e `.item-count`).
5. **Token e skin**: `.leftbar--project` passa ai token in C3 (comparirà il dark: passata dedicata); skin in C4 col metodo replica HTML. Entrambi attendono il mockup.

## Bug risolti / Root cause

- **R1 — il toggle Basic/Advanced chiudeva le tab del dock.** Root cause: `Dock.tsx:388` `<PinnableDock key={''+advanced}…>` con `ret.advanced = state.advanced`; ogni cambio modalità cambia la key, il dock rimonta da `defaultLayout` (sola tab `project_summary`) e le tab editor si perdono, ricompare la dashboard di progetto. Vestigio del gruppo `editors` morto (oggi nessun contenuto montato dal dock consuma `advanced`). CONFERMATO a runtime da Alfonso (tab M1 aperta → toggle → tab chiusa, dashboard). Bug PRE-esistente a B5: B5 ha solo reso il trigger sempre visibile. Fix: C0 serie A (key rimossa). Perché il 12/12 non l'aveva visto: la card destra vive nell'overlay, legge Redux ed è gatata dallo sticky `activeEditorType`, quindi i punti della checklist erano verdi mentre la tab moriva in silenzio.
- **Contratto del rail rotto (pre-esistente, fix in C2)**: `?section=` è una scrittura morta (unico lettore `ProjectEditor.tsx:245` mai usato) → tre «+ New» su quattro e i click sugli item Transform non facevano nulla; Share dispatcha `'jjodel:openShareModal'` con zero listener.

## Bug nuovi / Todo / Backlog

- Dashboard.ProjectCatalog: due «Duplicate» con handler vuoto (`Dashboard.tsx:437`, `:458`).
- `getInitialPanelWidth` `@deprecated` importato da `Navbar.tsx:51` mai chiamato; orfani `layoutMode` Navbar (`:896–916`) confermati senza JSX.
- `DockManager.openViewpoint` side effect: può aprire il primo metamodello e nascondere il rail (`:227–231`). Fuori scope C2.
- File morti zona dock: `abstract/DockLayout.tsx` (288/289 righe commentate), `abstract/tabs/PersistanceTab.tsx`, `TestTab.tsx` (zero import).
- Tree View: `.tree-row__content--selected` senza regola CSS (niente pill di selezione sulle istanze M1).
- Persistenza layout rc-dock (`PinnableDock.load/save`) esiste e non è mai invocata: il reload riparte sempre dal solo summary (comportamento attuale, non regressione di C0).
- B6 potenziale: dopo B5 i writer di modalità visibili sono due (segmented Navbar + `ModeIndicator` BottomBar, più la voce menu View con Cmd+Shift+M). Rinviato a dopo la serie A.
- Dal backlog precedente: dual-canvas; orfani split; `groups.editors` + 7 const orfane in `Dock.tsx`; `groups.editors` in Dock; language sweep Edge/Row/Matching; token orfani (`--color-selection-bar`).

## Documenti aggiornati

- `claude/ratifiche_2026-07-31_instances_left_rail.md` (nuovo): analisi del report, 5 decisioni, piano C0–C4, backlog.
- Nel repo: `docs/discovery/discovery_2026-07-31_instances_left_rail.md` (Fase 1, committato).
- Questo file sessione.

## Prompt generati per Claude Code (con esito)

1. `2026-07-31_prompt_discovery_instances_left_rail.md` — ✅ eseguito. Report di alta qualità: corregge quattro premesse della ricognizione preliminare (i riferimenti `?section=` in ProjectEditor erano commenti; le sezioni del rail sono 4 più azioni; il badge è la lettera del tipo, non un contatore; `DockComponent_rightbar_` sta in Dock.tsx).
2. `2026-07-31_prompt_instances_serieA_C0_C1_C2.md` (v2, con R1 marcato come osservato) — ✅ eseguito per dichiarazione di Alfonso a fine sessione. Esiti, scostamenti e stato delle verifiche visive da leggere nel claude-code-log a inizio prossima sessione.

## Prompt pendenti

Nessuno. C3 (struttura+token) e C4 (skin) si generano quando arriva il mockup del rail/INSTANCES: prima la replica HTML approvata, poi il one-shot a valori letterali.

## Prossimi passi

1. **Push**: origin era fermo a `07cee5219` al checkpoint; verificare `git log origin/alfonso-frontend-jjtl..HEAD` e pushare la serie A.
2. Leggere le entry claude-code-log della serie A; completare le verifiche visive se mancanti (C0: toggle con editor aperto → le tab restano; C1: rail identico; C2: item Transform apre JjTL, «+ New» funzionanti anche da tab Documentation, Share assente, niente `?section=` nell'URL).
3. Mockup INSTANCES → replica HTML → C3 e C4.
4. B6 (un solo writer di modalità visibile?) e backlog.

## Info strutturali scoperte (per sessioni future)

- **LeftBar** (`pages/components/LeftBar.tsx`, 533 righe pre-C1): due varianti su `active==='Project'` (`.leftbar` dashboard / `.leftbar--project` progetto); 4 sezioni (Metamodels, Models, Transforms, Viewpoints) + azioni progetto; renderer condiviso `renderSection`. Stili SOLO in `pages/dashboard.scss` (`.leftbar` :804+, blocco `psb-*` :1020–1219); la variante progetto è su literal slate, senza token e senza dark.
- **Mount del rail**: Dashboard `:322` (generica, sempre visibile) e `:621` (progetto, `!hideLeftBar &&` + grid `hide-leftbar`). Il rail è FUORI da rc-dock (fratello del `project-dock-wrapper`). Visibilità pilotata da `EDITOR_TYPE_CHANGE`/`ACTIVE_TAB` con `isEditorTab = {metamodel, model, transformation}`; sulla tab Documentation il rail RESTA visibile.
- **Ricomparsa del rail al rientro sul summary**: la produce SOLO `PinnableDock._detectActiveTabChange` (`MyRcDock.tsx:574–603`, mappa per prefisso id `jjtl_`/`doc_`/`vp_`/lookup); `Dock.handleLayoutChange` non emette mai `'summary'`. Due meccanismi paralleli decidono `editorType`: interventi su id o titoli delle tab devono rispettarli entrambi.
- **Dock**: dockbox a child unico, gruppo `models`; tab canvas via `DockManager.open2` → `TabDataMaker` → `dockMove(children[0])`; la documentazione viva passa da `DockManager.openDocumentation` con TabData inline `group:'models'`. Un secondo figlio del dockbox riattiverebbe le regole `:last-child` corrette in F2-fix (9 blocchi `:not(:first-child)` in `abstract/style.scss`). rc-dock installato 3.3.2.
- **Registry eventi**: `src/events/registry.ts` (`OPEN_MEGAMODEL` :35 → listener `ProjectEditor.tsx:436`): il pattern per i nuovi eventi CREATE_MODEL / CREATE_TRANSFORMATION / CREATE_VIEWPOINT di C2.
- **ProjectEditor** (dentro la tab `project_summary`, `closable:false`): `handleNewModelClick` :1108, `handleCreateViewpoint` :1159, `handleCreateTransformation` :1186, modal onSubmit :2821/:2835, anchor `#section-*` :2217/:2366/:2557/:2583/:2663.
- **Overlay destro, riusabilità**: parametrici portal su body, gate su `activeEditorType`, accordion, splitter; right-specific `right:8px` + offset literal, var `--jj-canvas-right-inset` (consumatori: EditorV2 fitView/minimap, NodeProblemOverlay, Jodie FAB), larghezze 320/400/640, direzione del drag, cluster pill `top:150px;right:16px`.
- **Porta di verifica**: localhost:3000 con hard refresh (la :3001 può servire build stale).

## Cronologia (sintetica)

Sessione notturna in cinque atti. **Atto 1**: il kickoff era stale; riconciliato con origin via clone shallow: push già fatto, B5 già eseguito e pushato, più due commit di review (swap Toggle, round 5 punti) sconosciuti al checkpoint precedente; rettificata la lezione errata sui checkbox (`button[role=checkbox]` esiste, tab IR). **Atto 2**: checklist consolidata dei tre commit, verifica visiva 12/12, hard stop chiusi. **Atto 3**: prompt discovery INSTANCES generato ed eseguito; il report ribalta tre assunzioni: il rail è fuori da rc-dock (R2 evitabile per costruzione), il contratto funzionale è rotto (`?section=` morto, Share inerte), R1 sul dock. **Atto 4**: analisi in chat, quattro ratifiche (tutte sulle opzioni raccomandate); tentata la verifica R1 via Chrome (estensione non connessa), fallback sul test manuale di Alfonso: CONFERMATO (tab M1 chiusa, dashboard). **Atto 5**: prompt serie A (C0 fix key, C1 bonifica, C2 contratto) generato, aggiornato con R1 osservato, ed eseguito a fine sessione; push rimasto da fare; checkpoint.
