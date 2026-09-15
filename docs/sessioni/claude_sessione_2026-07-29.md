# Sessione 2026-07-29: fase floating panels (F1 → F5)

## Stato a fine sessione

**La fase floating panels è sostanzialmente completata e verificata a vista.** Properties e Tree sono uscite dal dock e vivono come overlay flottante impilato sopra un canvas a tutta larghezza (pattern Figma/tldraw). Cinque commit chiusi, un sesto (F5, cleanup) con prompt generato e ancora da eseguire.

Stato funzionale raggiunto:
- Canvas full-width; overlay portalato su body, ancorato sotto la toolbar e sopra la status bar, colonna ~400px a 8px dal bordo destro, z 900.
- Tree sopra, Properties sotto; resize verticale via splitter in-flow; accordion maximize/restore con doppio click sull'header (la card non massimizzata conserva il proprio header, quindi c'è sempre una via di ritorno).
- Viewport-aware: l'overlay pubblica `--jj-canvas-right-inset`, letta da fitView (5 call-site), dalla centratura di `selectNode`, dalla MiniMap e dal FAB Jodie. Con overlay nascosto l'inset va a zero e il comportamento coincide con quello pre-fase.
- MiniMap `pannable` e `zoomable`.
- Filtro della Tree fuori dall'area scrollabile.
- Build verde, typecheck a baseline (Δ0), nessun file critical-zone toccato, LIR mai dovuto.

**Git**: branch `alfonso-frontend-jjtl` con molti commit non pushati (si sommano a quelli delle sessioni precedenti). Possibile WIP TextStyle concorrente ancora nel working tree: mai `git add .`. I messaggi di commit esatti della fase sono in `docs/claude-code-log.md`.

## Decisioni prese

1. **Disposizione card: impilate** a destra (Tree sopra, Properties sotto). Motivo quantitativo: inset destro ~400px contro ~710px delle affiancate; su 13" le affiancate avrebbero coperto metà canvas, contraddicendo l'obiettivo full-width.
2. **Documentation** apre come tab nel gruppo canvas (`children[0]`), non più nella colonna destra.
3. **Migrazione layout: non necessaria** (vedi finding sotto). La decisione iniziale era "reset", si è rivelata senza oggetto.
4. **INSTANCES / rail sinistro: fase separata.** Far flottare il lato sinistro è strutturalmente diverso (sovrapporre un rail a un gruppo che ospita le tab canvas, non rimuovere un figlio dock).
5. **Overlay = portal su body**, non absolute-in-canvas (rc-dock ri-parenta i suoi content holder, sarebbe stato fragile).
6. **Nuovo mode `'floating'`** su `PropertiesWithTreeView`, additivo all'union, che fa divergere puliti i due gate: rende lo split senza scrivere gli attributi body del width-lock.
7. **F2a e F2b in un commit unico atomico**: rimuovere il figlio destro senza l'overlay avrebbe reso Properties irraggiungibile, montare l'overlay senza rimuovere il tab avrebbe dato doppio render.
8. **F3 e F4 accorpati**: condividono la stessa incognita (larghezza corrente dell'overlay, resizabile) e separarli avrebbe lasciato uno stato intermedio con fit corretto ma MiniMap ancora sepolta.
9. **Ancoraggio verticale top/bottom** invece di `max-height`: l'overlay non può sconfinare su toolbar o status bar a nessuna risoluzione, senza numeri magici da aggiornare.
10. **Inset dinamico, un writer e tre reader**: la larghezza è resizabile, quindi un inset hard-coded sarebbe stato sbagliato dopo il primo drag.

## Bug risolti (root cause e fix)

1. **Schermata bianca all'apertura del progetto, e canvas largo solo ~30%.** Root cause unico per due sintomi: rimosso il figlio destro, il pannello canvas è diventato contemporaneamente `:first-child` e `:last-child` del dockbox, quindi tutte le regole scritte per la vecchia colonna Properties (`.dock-hbox > .dock-panel:last-child`) hanno cominciato a colpirlo. Il sizing sidebar spiegava il 30%, la regola hide-in-mode per **summary** nascondeva il canvas sulla dashboard di progetto. Fix: ritiro o restrizione con `:not(:first-child)` di quei selettori, blocco per blocco. Evidenza diagnostica utile: toolbar e MiniMap terminavano alla stessa ascissa, e la MiniMap è `right:20px` dentro il container ReactFlow, quindi provava dove finiva davvero il canvas.
2. **Tree card troppo bassa.** Il riorientamento width → height riusava la chiave localStorage della larghezza: il valore persistito (~260, una larghezza) veniva riletto come altezza, rendendo invisibile qualunque nuovo default. Fix: chiave dedicata più default alzato.
3. **Righe dell'albero visibili dietro il campo di ricerca.** Il filtro stava dentro il container scrollabile. Fix strutturale: filtro fuori dallo scroll, non pezza di z-index e sfondo opaco.
4. **Properties sovrapposta alla status bar.** `max-height` teneva conto del solo offset superiore. Fix: ancoraggio `top` e `bottom`.
5. **MiniMap non funzionante.** Risolta rendendola `pannable` e `zoomable`.

## Bug nuovi / Todo

- **F5 da eseguire** (prompt pronto): ritiro del width-lock residuo e finalizzazione del gating della pill.
- **Push del branch**, molto indietro. Poi cleanup dei tag `reconstruct-base-*`.
- **Union `mode`**: dopo la sparizione dei call-site `tab`, ha probabilmente un solo valore vivo (`floating`), con `popup` e `inline` mai istanziati. F5 lo riporta senza modificarlo: restringere un tipo esistente non è additivo e va deciso a parte.
- **Verificare se il `pointer-events:none` sul wrapper dell'overlay è stato effettivamente applicato** in F3-fix: non compare nel riepilogo di Claude Code. Serve perché il wrapper non rubi click al canvas nelle zone trasparenti (era anche la mitigazione prevista per il pan-under).
- **WIP TextStyle concorrente** nel working tree: invariato, va tenuto fuori dai commit.
- Backlog dalle sessioni precedenti: 2B progressive disclosure (3 commit, vertex-only, prompt ancora da generare); language sweep Edge/Row/Matching; ritiro token orfani (`--color-selection-bar`).

## Documenti prodotti

- Discovery report (da Claude Code): `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md`, `docs/discovery/discovery_2026-07-29_f2_overlay_mount_migration.md`.
- Knowledge base: `claude/ratifiche_2026-07-29_floating_panels.md` (decisioni, finding, architettura consolidata, sequenza).
- `docs/claude-code-log.md`: entry per ogni commit della fase.

## Prompt generati per Claude Code (con esito)

1. `2026-07-29_prompt_fase2_F1_redirect_documentation.md` — ✅ eseguito e committato (`refactor(dock): route documentation tab to canvas group`).
2. `2026-07-29_prompt_fase2_F2_discovery_overlay_mount_migration.md` — ✅ eseguito (report prodotto e analizzato in chat).
3. `2026-07-29_prompt_fase2_F2_structural_swap_overlay.md` — ✅ eseguito e committato (commit atomico, assorbe le modifiche card 2A che erano rimaste unstaged).
4. `2026-07-29_prompt_fase2_F2fix_lastchild_collision.md` — ✅ eseguito e committato.
5. `2026-07-29_prompt_fase2_F3_viewport_insets.md` — ✅ eseguito e committato (accorpa il vecchio F4).
6. `2026-07-29_prompt_fase2_F3fix_overlay_clipping_pointer.md` — ✅ eseguito e committato.
7. `2026-07-29_prompt_fase2_F5_retire_widthlock.md` — ⏳ **da eseguire**.

## Prompt pendenti

- **F5** (7 sopra): primo passo della prossima sessione.
- **2B progressive disclosure** (3 commit, vertex-only): da generare, sulla base delle decisioni della sessione 2026-07-28_3 (punto 6) e della Parte B del report card+disclosure. Indipendente dal container: tocca file diversi.

## Prossimi passi

1. Eseguire F5, verificare a vista su tutti i layout mode, chiudere la fase floating.
2. Decidere sull'union `mode` in base a quanto riporta F5.
3. Push del branch e cleanup dei tag `reconstruct-base-*`.
4. Generare ed eseguire la 2B progressive disclosure.
5. Aprire la fase INSTANCES / rail sinistro.

## Info strutturali scoperte (per sessioni future)

**Persistenza del layout: non esiste.** `PinnableDock.load()`/`save()` non hanno chiamanti; il `LayoutData` è ricostruito fresco a ogni render in `Dock.tsx` e passato come `defaultLayout` (non `loadLayout`); i setter backend sono stub; `DProject.layout`/`DUser.layout` restano `{}` e non vengono mai letti all'apertura. Conseguenza pratica: **nessuna migrazione di layout è mai necessaria**, cambiare la forma del dock in `Dock.tsx` basta e vale per ogni progetto, nuovo o salvato. La sizing vive in localStorage (`jjodel_layout_mode`, `jjodel_dock_ratio_*`), non nel D-model.

**Regola operativa sui selettori `:last-child`.** Finché il dockbox ha un figlio solo, ogni regola `.dock-hbox > .dock-panel:last-child` colpisce il canvas, perché first-child e last-child coincidono. Vale per sizing, hide-in-mode e width-lock. Da trattare come sospetta ogni volta che si tocca quella zona di `abstract/style.scss`.

**Mount di `PropertiesWithTreeView`.** Una sola prop (`mode`), nessuna dipendenza dal dock (legge Redux via `useStore`/`useSelector` e il context `useTreeViewPanel`). `TreeViewPanelProvider` avvolge l'intera app, quindi non c'è barriera di context: si può montare ovunque dentro l'app. Montato come sibling di `<Dock/>` in `ProjectDashboard`, così il lifecycle segue la presenza del canvas e non serve gating di route.

**Due gate distinti su `mode`**: il gate di render (rende lo split) e il gate del width-lock (scrive gli attributi body). Vanno tenuti divergenti: `'floating'` rende ma non scrive.

**Architettura dell'inset**: `--jj-canvas-right-inset` scritta su body dall'overlay (larghezza corrente più 8px, `0px` da nascosto), letta da MiniMap e FAB via `calc()` e da un helper JS per il padding di `fitView`. Se il valore viene scritto senza unità il `calc()` diventa invalido e la dichiarazione viene scartata in silenzio: scrivere sempre `px`.

**Chiavi localStorage**: separare sempre le chiavi quando una dimensione cambia asse. Riusare la chiave della larghezza per un'altezza fa rileggere valori vecchi in un contesto sbagliato e maschera i default nuovi.

**`setViewport` non accetta padding** (a differenza di `fitView`, che in ReactFlow 12 supporta padding per-lato con unità): le centrature manuali vanno corrette a mano sottraendo l'inset dalla larghezza utile.

**`.collapsed-panel-toggle` non è morto** anche se somiglia a residuo del width-lock: l'elemento continua a essere reso.

## Cronologia (sintetica)

Sessione lineare e densa, tutta sulla fase floating. Si parte dal report di discovery floating panels, che mappa la catena di mount fino a ReactFlow, gli otto call-site di fit e centratura, e il verdetto che il lavoro è viewport-only (niente LIR). Quattro ratifiche chiudono il gate di progettazione: impilate, doc al gruppo canvas, reset della migrazione, INSTANCES rimandato.

F1 (redirect Documentation) va per primo di proposito, per togliere di mezzo il rischio alto prima di rimuovere il figlio destro. F2 riceve una discovery mirata propria, perché tocca due terreni delicati (mount app-level e dati di progetto salvati): il report ribalta il rischio più grosso della fase mostrando che la persistenza rc-dock è codice morto, quindi la migrazione temuta non esiste e F2 si riduce a non costruire più il figlio destro.

La verifica visiva di F2 apre il momento più interessante: schermata bianca all'apertura del progetto e canvas al 30%. La diagnosi dalle coordinate dello screenshot (toolbar e MiniMap che finiscono alla stessa ascissa) porta a un root cause unico e non ovvio, il pannello canvas divenuto first-and-last child che eredita le regole della colonna Properties. Da lì il ritiro delle regole `:last-child`, anticipato rispetto al piano perché da inerti erano diventate attive sul bersaglio sbagliato.

F3 assorbe F4 e introduce l'inset dinamico; il giro di rifiniture successivo sistema clipping della Tree, ancoraggio verticale e MiniMap, e Claude Code aggiunge di sua iniziativa lo splitter in-flow con accordion, accettato. Resta F5, il cleanup, con prompt già pronto e una regola di ingaggio severa sulle rimozioni: per ogni blocco, prova che il writer non esista più e prova che non regoli anche elementi vivi. Checkpoint generato su richiesta a fine giornata.
