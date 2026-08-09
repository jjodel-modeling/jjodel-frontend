# Sessione 2026-08-01 — FAB Jjodie in basso a sinistra (dentro il canvas)

Sessione breve notturna (circa 01:00-01:40), un solo task, chiuso end-to-end: prompt, discovery, review del report in chat, implementazione, verifica visiva di Alfonso.

## Stato a fine sessione

- FAB minimizzato di Jjodie (`.jodie-minimized`, `bi bi-robot`) spostato da basso-destra a **basso-sinistra**, dentro l'area contenuto: `left: 30px` nelle tab editor (rail smontato); `left: calc(240px + 30px)` nelle viste con rail montato, via `body:has(.leftbar)` sotto guard `@media (min-width: 769px)`. `bottom: 100px` invariato, z-index invariato, finestra Jodie invariata (si è spostata solo l'icona).
- Un solo file di codice toccato: `frontend/src/components/Jodie/JodieWindow.css`. Rimosso anche l'override `body[data-notification-visible="true"]` (bottom: 280px), non più necessario col FAB a sinistra.
- Verifica visiva di Alfonso: OK ("fatto tutto").
- **ATTENZIONE GIT**: il remoto `alfonso-frontend-jjtl` è fermo a `07cee5219` (verificato con fetch a fine sessione). Tutto il lavoro locale è NON pushato: i commit che avevano portato il repo a `ea02928fd` (HEAD locale al momento della discovery) più il commit `fix(jodie)` di questa sessione. **Primo comando prossima sessione: `git log origin/alfonso-frontend-jjtl..HEAD --oneline`, poi push.**
- Domanda aperta: i commit tra `07cee5219` e `ea02928fd` dovrebbero essere la serie A INSTANCES (C0/C1/C2), ma Alfonso non lo ha confermato in questa chat. Verificare nel `docs/claude-code-log.md`.

## Decisioni prese

### 2026-08-01 — Offset rail via CSS-only `body:has(.leftbar)`, niente variabile left-inset
Per tenere il FAB "dentro il canvas" anche nelle viste con rail sinistro montato (dashboard, project summary), scelta la soluzione CSS pura a un solo file: regola base `left: 30px` più `body:has(.leftbar) .jodie-minimized { left: calc(240px + 30px) }`. Scartata l'alternativa di pubblicare una `--jj-canvas-left-inset` da Dashboard.tsx (specchio del pattern F3): avrebbe toccato due file e aggiunto un effect per un valore comunque hardcoded. Premesse verificate: il rail smonta davvero (`{!hideLeftBar && <LeftBar/>}`, non display:none), `:has()` è già usato in almeno 5 file del codebase, larghezza rail fissa 240px per design.

### 2026-08-01 — Guard `@media (min-width: 769px)` sull'offset
Sotto 768px il rail resta nel DOM ma scivola off-canvas (`position: fixed; left: -240px`, con stato `.open { left: 0 }`): `:has(.leftbar)` sarebbe vero senza che il rail occupi spazio. Il breakpoint replica quello di `dashboard.scss`. Edge case accettato: su viewport stretti col drawer rail aperto, il drawer copre il FAB (overlay temporaneo, tool desktop).

### 2026-08-01 — Verticale e finestra invariati
`bottom: 100px` resta identico (minimal diff: cambia solo il lato). La finestra Jodie continua ad aprirsi con la geometria attuale (default a destra, draggabile): il task riguardava solo l'icona.

### 2026-08-01 — Rimozione dell'override notification
`body[data-notification-visible="true"] .jodie-minimized { bottom: 280px }` esisteva per evitare la sovrapposizione col NotificationWidget (fixed bottom-right). Col FAB a sinistra la regola avrebbe solo fatto saltare il FAB verso l'alto senza motivo: rimossa con autorizzazione esplicita nel prompt. Meccanismo `data-notification-visible` e `NotificationWidget.tsx` intatti.

## Bug risolti

Nessuno: task di riposizionamento UI, non fix di bug.

## Bug nuovi / Todo

- **[ALTA] Push del branch**: remoto fermo a `07cee5219`, tutto il lavoro recente è solo locale (vedi Stato).
- **[MEDIA] Confermare esito serie A (C0/C1/C2)**: HEAD locale era avanzato a `ea02928fd` già prima di questo task; verificare nel claude-code-log cosa è entrato, e fare la verifica post-C0 (toggle Basic/Advanced con tab M1 aperta: non deve più chiudere le tab).
- **[BASSA] Bonifica `JjodieWidget`**: `frontend/src/components/JjodieWidget/` è un componente morto (zero import) con un suo `.jjodie-fab` bottom-right pieno di `!important`. Confonde le discovery su Jjodie. Candidato a rimozione in un futuro commit `chore`, con le cautele CLAUDE.md sul codice "apparentemente inutilizzato".

## Documenti aggiornati

- KB progetto: `claude/2026-07-31_prompt_jjodie_fab_bottom_left.md` (nuovo; nome file con data 07-31 per continuità con la serie della giornata, timestamp interno 2026-08-01 01:06).
- KB progetto: questo file di sessione.
- Repo (da Claude Code): `frontend/src/components/Jodie/JodieWindow.css` (fix), `docs/discovery/discovery_2026-08-01_jjodie_fab_bottom_left.md` (report 5/5 PASS), entry in `docs/claude-code-log.md`.

## Prompt generati per Claude Code

- `2026-07-31_prompt_jjodie_fab_bottom_left.md` — fix(jodie), one-shot con mini-discovery (5 verifiche + report obbligatorio, procedi-se-tutte-PASS, hard stop solo sul diff pre-commit) — **✅ eseguito**: discovery 5/5 PASS, edit applicato su un solo file, verifica visiva OK.

## Prompt pendenti

- `2026-07-31_prompt_instances_serieA_C0_C1_C2.md` (serie A fase INSTANCES): esito da confermare nel log; probabilmente eseguita vista l'avanzata di HEAD, ma serve conferma esplicita e verifica visiva post-C0.
- C3 (struttura + token `.leftbar--project`) e C4 (skin): in attesa del mockup della vista INSTANCES. Metodo consolidato: replica HTML approvata, poi one-shot a valori letterali.

## Prossimi passi

1. Push del branch (dopo `git log origin/alfonso-frontend-jjtl..HEAD --oneline`).
2. Confermare esito serie A nel claude-code-log; verifica post-C0 del toggle Basic/Advanced con tab M1 aperta.
3. Mockup della vista INSTANCES per sbloccare C3/C4.
4. Backlog invariato dalle ratifiche 2026-07-31: Duplicate con handler vuoto in Dashboard.ProjectCatalog, `getInitialPanelWidth` deprecato importato e mai chiamato, side effect di `DockManager.openViewpoint`, file morti in zona dock, `.tree-row__content--selected` senza regola CSS, persistenza rc-dock mai invocata. Più il backlog storico: dual-canvas, orfani split, `groups.editors`, language sweep, token orfani.

## Info strutturali scoperte

- **FAB Jjodie**: il componente vivo è `JodieMinimized.tsx` (solo className, zero stili inline), stili in `frontend/src/components/Jodie/JodieWindow.css` (~riga 871). Mount globale: `App.tsx:44` importa `Jodie` da `components/Jodie/`; wrapper `.jodie-root` (solo transizione opacity, mai `pointer-events: none`, lezione C9).
- **`JjodieWidget` è morto**: zero import fuori dalla sua cartella; il suo `.jjodie-fab` non è il FAB reale.
- **Rail sinistro**: `.leftbar` larghezza fissa 240px (`pages/dashboard.scss:804-808`, anche max-width), mount condizionale in `pages/components/Dashboard.tsx:621`; sotto 768px diventa drawer fixed off-canvas (`left: -240px`, `.open { left: 0 }`).
- **`--jj-canvas-right-inset`**: writer `PropertiesWithTreeView.tsx:355`, consumer superstite la MiniMap (`EditorV2.tsx:3853`). Il FAB non la consuma più dopo questo fix.
- **NotificationWidget**: fixed `bottom: 60px; right: 24px` (`notification-widget.scss:7-9`).
- **`:has()` nel codebase**: App.scss (137, 170, 253, 258, 259, 401), styles/diagram.scss:899, styles/style.scss (724, 727, 732, 756), editors/views/nestedView.scss:97, viewoptions.scss. Baseline browser del progetto già dipende da `:has()`.
- **Angolo basso-sinistro del canvas libero**: zoom controls migrati in toolbar (commento in EditorV2), MiniMap a destra a `bottom: 100px`.

## Cronologia

Alfonso chiede di spostare l'icona di Jjodie da destra a in basso a sinistra, comunque dentro il canvas. Discovery in chat su clone del repo (HEAD `07cee5219`): identificato il FAB vivo (`.jodie-minimized` in `JodieWindow.css`, non il morto `JjodieWidget`), rilevato il problema del rail sinistro 240px nelle viste non-editor, scelta la soluzione CSS-only con `:has` e guard responsive. Generato prompt one-shot con mini-discovery (5 verifiche, report obbligatorio, hard stop solo sul diff). Claude Code esegue la discovery su HEAD locale `ea02928fd`: 5/5 PASS, file target identico al riferimento del prompt nonostante il drift di HEAD. Review del report in chat: coerente al 100% con la discovery preliminare, via libera con descrizione del diff atteso (3 hunk). Implementazione e verifica visiva OK. A fine sessione, fetch dal clone: il remoto è ancora a `07cee5219`, tutto il lavoro locale non è pushato; promemoria push registrato come primo passo della prossima sessione.
