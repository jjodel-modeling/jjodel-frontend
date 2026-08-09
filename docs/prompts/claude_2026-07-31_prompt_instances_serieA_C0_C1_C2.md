# Fase INSTANCES — Serie A: C0 fix dock key, C1 bonifica LeftBar, C2 contratto del rail

**Tipo:** 3 commit (fix + chore + feat), hard stop dopo OGNI commit per verifica visiva di Alfonso su `localhost:3000` (hard refresh).
**Data prompt:** 2026-07-31
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl` · base attesa `07cee5219`
**Effort consigliato:** high
**Precondizione:** discovery `docs/discovery/discovery_2026-07-31_instances_left_rail.md` committata e analizzata in chat. Working tree con WIP authoring IR concorrente (ObjectNode, LabelEntryEditor, TextStyleEditor, irStyle, _form-system.scss, TextStyleField): **mai `git add .`**, sempre pathspec espliciti.

> **Ratifiche 2026-07-31** (analisi in chat sul report di discovery):
> (1) Semantica INSTANCES: il rail resta a livello artefatti (metamodelli, modelli M1, trasformazioni, viewpoint). Gli oggetti M1 restano nel Tree View destro e nel canvas: niente doppio albero.
> (2) Contratto azioni: gli item aprono via DockManager; i "+ New" diventano CustomEvent del registry gestiti da ProjectEditor (pattern vivo di `OPEN_MEGAMODEL`); le scritture `?section=` si ritirano; la voce Share si rimuove finché il modal non esiste.
> (3) Il rail resta nascosto dentro gli editor (status quo `isEditorTab`). Nessun overlay sinistro in questa serie.
> (4) R1 (`key={''+advanced}` sul dock): root cause confermata a codice E a runtime. Osservato da Alfonso il 2026-07-31: con una tab M1 aperta, il toggle Basic↔Advanced chiude la tab e mostra la dashboard di progetto (il dock rimonta da `defaultLayout`, che ha la sola tab `project_summary`). Fix in C0.
> (5) Bonifica del codice morto: sì, commit `chore` dedicato (C1), lista esplicita sotto. Token e skin sono fuori da questa serie (C3/C4 arriveranno col mockup).

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: segnala e fermati.
- **Critical-zone:** non toccare `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`.
- Non toccare: il ciclo di visibilità del rail (`EDITOR_TYPE_CHANGE`, `isEditorTab`, `hideLeftBar`), `MyRcDock.tsx`, i gruppi del dock, l'overlay destro, `?filter=` della variante dashboard.
- Zero refactoring opportunistico oltre le rimozioni ELENCATE. Mai rinominare identificatori esistenti.
- Prima di ogni nuovo identificatore (evento, funzione, classe): `grep -r` globale per collisioni.
- `git add` per path espliciti. Un commit per volta, hard stop dopo ciascuno.
- Dopo ogni commit: `npm run build` verde, `npm run typecheck` a baseline (Δ0), entry in `docs/claude-code-log.md`.

## 1. C0 — `fix(dock)`: key stabile su PinnableDock

**Root cause** (dal report §2.6 e rischio R1): `Dock.tsx:388` monta `<PinnableDock key={''+advanced} …/>` con `advanced = state.advanced` (`mapStateToProps` :405). Ogni cambio Basic↔Advanced cambia la key, quindi rimonta il dock da `defaultLayout` (sola tab `project_summary`): le tab editor aperte si perdono. La key è un vestigio del gruppo `editors` morto (quando Properties/Node/Console vivevano nel dock e leggevano `advanced` al mount). Oggi nessun contenuto montato dal dock consuma `advanced`.

Passi:

1. **Ri-verifica statica**: grep di `advanced` in `Dock.tsx` e nei contenuti montati dal dock (`ModelsSummaryTab`/`ProjectEditor`, `MetamodelTab`, `ModelTab`, `DocumentationTab`, `EditorSwitch`, catena JjTL). Atteso: zero consumatori a parte la key. Se ne trovi uno vivo, FERMATI e riporta: il fix cambierebbe comportamento.
2. Rimuovi `key={''+advanced}` da `PinnableDock` (`Dock.tsx:388`).
3. Rimuovi `let advanced` (:274) e il campo `advanced` da `StateProps`/`mapStateToProps` SOLO se dopo il punto 2 non hanno altri usi nel file (grep interno). Niente altro.
4. Build + typecheck.

Commit: `fix(dock): stop remounting dock on interface mode change` con `git add frontend/src/components/abstract/Dock.tsx`.

**Verifica visiva (Alfonso):**
- Baseline già fatta (2026-07-31, pre-C0): tab M1 aperta → toggle → la tab si chiude e appare la dashboard di progetto. Sintomo confermato: riportalo nel log come osservato, non previsto.
- Dopo C0: editor metamodello + editor modello aperti → toggle Basic↔Advanced dal Navbar più volte → le tab restano, la tab attiva resta attiva, il canvas resta l'editor; le sezioni della card destra continuano a comparire/sparire live (leggono Redux via connect, non serve il remount); reload conserva la modalità (riconciliazione nel Navbar, non toccata); pin strip e overflow tab invariati.

**HARD STOP.**

## 2. C1 — `chore(leftbar)`: bonifica del codice morto

Solo rimozioni, dalla lista del report §2.1. Per OGNI voce: grep repo-wide prima di rimuovere; se compare un consumatore vivo, lasciala e annota nel log.

In `frontend/src/pages/components/LeftBar.tsx`:
- `ProjectHeader` + `getProjectStatus` (:128–145, mai reso)
- `SectionLabel` (:124–126), `Divisor` (:120–122), `Upload` (:79–87, corpo irraggiungibile)
- `Menu.Item = Item` (:147, assegnazione mai letta)
- `interface StateProps` (:31–33, non riferita)
- `MenuProps.project` e l'uso del dot «modified» (:93, :106): nessun call-site passa `project`
- Import inutilizzati (:2, :4, :8, :10, :11): `DUser`, `L`, `SetRootFieldAction`, `windoww`, `icon`, `storage`, `SaveManager`, `Tooltip` (rimuovi solo quelli che il typecheck conferma inutilizzati dopo le rimozioni sopra)

In `frontend/src/pages/dashboard.scss`:
- `.leftbar-footer` (:976–1016, nessun produttore JSX)
- `.status-badge` (:1221+) SOLO se il grep repo-wide conferma zero produttori dopo la rimozione di `ProjectHeader`; `.item--muted` e `.item--danger` restano se usati dalla variante dashboard (grep).

**NON rimuovere**: `.psb-item.active` (:1131–1144, lo stato attivo tornerà col redesign), `.item-count` e la prop `count` di `Item` (API viva della variante dashboard), `navigateToSection`/`ProjectSection`/`openShareModal` (li tratta C2, non questo commit).

Build + typecheck (Δ0). Commit: `chore(leftbar): remove dead symbols and orphaned styles` con `git add frontend/src/pages/components/LeftBar.tsx frontend/src/pages/dashboard.scss`.

**Verifica visiva (Alfonso):** rail identico a prima in entrambe le varianti (dashboard e progetto), chiaro e scuro dove applicabile.

**HARD STOP.**

## 3. C2 — `feat(leftbar)`: il contratto del rail torna vero

Obiettivo: ogni affordance visibile nel rail fa qualcosa. Percorsi vivi riusati, un solo writer per flusso.

### 3.1 Item Transform aprono l'ambiente JjTL

- In `LeftBar.tsx`, sezione Transforms (:395): al click sull'item, sostituisci `navigateToSection('transformations')` con `DockManager.openTransformation(...)`. Verifica la firma reale e i call-site esistenti di `openTransformation` (`DockManager.tsx:320+`) per costruire gli argomenti come fanno i chiamanti vivi; se la firma richiede callback che il rail non possiede, individua il chiamante vivo (probabile in ProjectEditor) e riusa il suo percorso via evento come in 3.2, riportandolo nel log.
- Item Metamodels/Models (`open2`) e Viewpoints (`openViewpoint`) NON si toccano. L'effetto collaterale noto di `openViewpoint` (può aprire il primo metamodello e nascondere il rail) resta fuori scope.

### 3.2 I «+ New» diventano eventi del registry

- In `frontend/src/events/registry.ts` (stile di `OPEN_MEGAMODEL: 'jjodel:openMegamodel'`, :35) aggiungi, previa grep di collisione sui nomi: `CREATE_MODEL: 'jjodel:createModel'`, `CREATE_TRANSFORMATION: 'jjodel:createTransformation'`, `CREATE_VIEWPOINT: 'jjodel:createViewpoint'`.
- In `LeftBar.tsx`: «+ New model» / «+ New transform» / «+ New viewpoint» dispatchano il rispettivo evento (rimpiazzando `navigateToSection`). «+ New metamodel» resta su `createM2`, invariato.
- In `ProjectEditor.tsx`, accanto al listener vivo di `OPEN_MEGAMODEL` (:436), aggiungi i tre listener:
  - `CREATE_TRANSFORMATION` → apre il modal esistente di creazione trasformazione (lo stato che alimenta l'`onSubmit` a :2821 → `handleCreateTransformation` :1186);
  - `CREATE_VIEWPOINT` → apre il modal esistente (:2835 → `handleCreateViewpoint` :1159);
  - `CREATE_MODEL` → riusa il flusso di `handleNewModelClick` (:1108): 0 metamodelli → comportamento attuale del flusso; 1 → `createM1` diretto; N → apri lo stesso selettore di metamodello usato dal summary (individua come si apre: stato locale/menu; non costruirne uno nuovo).
- **Attivazione e scroll**: se al momento dell'evento la tab attiva non è `project_summary` (es. Documentation), prima attiva `project_summary` col meccanismo rc-dock più piccolo disponibile (`DockManager.dock.find('project_summary')` + `updateTab(..., true)` come nel guard di `open2`, o `dockMove`; se serve un helper in `DockManager`, nome nuovo grep-ato). Poi, per `CREATE_MODEL` a N metamodelli e comunque dove ha senso mostrare il contesto, scrolla all'anchor di sezione esistente (`#section-models`, `#section-transformations`, `#section-viewpoints` — finalmente un consumatore per quegli id). I modal non richiedono scroll.

### 3.3 Ritiro di `?section=` e della voce Share

- Rimuovi `navigateToSection`, `currentSection` e il tipo `ProjectSection` da `LeftBar.tsx` (:225–236) una volta che nessun handler li usa più.
- Rimuovi il lettore morto in `ProjectEditor.tsx:245` (`currentSection` mai usato).
- NON toccare `?filter=` della variante dashboard (`:158–176`, sync con Catalog).
- Rimuovi la voce Share dalla sezione Project del rail e `openShareModal` (:310–312): zero listener nel repo, task mai completato. Registralo nel log e nel corpo del commit.

### 3.4 Verifica

- Build verde, typecheck Δ0.
- Visiva (Alfonso): dal rail, item metamodello/modello aprono le tab come prima; item transform apre l'ambiente JjTL; «+ New metamodel» invariato; «+ New model» con 1 metamodello crea subito, con N apre il selettore; «+ New transform» e «+ New viewpoint» aprono i modal, ANCHE partendo dalla tab Documentation (attivazione summary + eventuale scroll); Share assente; l'URL non accumula più `?section=`; reload ok; card destra, Edge, Row intatti.

Commit: `feat(leftbar): wire rail items and new-actions to live flows, retire dead section navigation` con `git add frontend/src/pages/components/LeftBar.tsx frontend/src/components/project/ProjectEditor.tsx frontend/src/events/registry.ts frontend/src/components/abstract/DockManager.tsx` (l'ultimo solo se l'helper si è reso necessario).

**HARD STOP.** Riporta in chat: esito dei tre commit, cosa è emerso dai grep guard, ogni scostamento dalle premesse.

## 4. Riferimenti

- `docs/discovery/discovery_2026-07-31_instances_left_rail.md`: §2.1 (inventario e codice morto), §2.2 (visibilità, da non toccare), §2.3 (dock, R1), §2.4 (percorsi vivi di creazione/apertura), rischi R1–R8.
- `events/registry.ts:35` (`OPEN_MEGAMODEL`) e il suo listener vivo `ProjectEditor.tsx:436`: il pattern da replicare.
- `DockManager.tsx:91–119` (`open`/`open2` col guard `find` + `updateTab(..., true)`), `:320+` (`openTransformation`).
- `ProjectEditor.tsx:1108` (`handleNewModelClick`), `:1159` (`handleCreateViewpoint`), `:1186` (`handleCreateTransformation`), `:2821`/`:2835` (modal onSubmit), anchor `#section-*` (:2217, :2366, :2557, :2583, :2663).
- Log entry B5 (2026-07-30) per la semantica della modalità post-B5 (riconciliazione nel Navbar).
