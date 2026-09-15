# Ratifiche 2026-07-29 — Floating panels

Decisioni prese in chat dopo l'analisi dei report `discovery_2026-07-28_floating_panels_canvas.md` e `discovery_2026-07-29_f2_overlay_mount_migration.md`. Aggiornato post-F5 (vedi ultima sezione).

## Decisioni ratificate (Alfonso)

1. **Disposizione card**: IMPILATE a destra (Tree sopra, Properties sotto, colonna unica allineata al bordo destro). Inset destro ~400px vs ~710px delle affiancate; su 13" le affiancate coprirebbero metà canvas. Mantiene la vista simultanea.
2. **Redirect Documentation**: tab doc apre come tab nel gruppo canvas (`children[0]`). [F1 fatto]
3. **Migrazione layout**: RESET → in realtà MOOT (vedi finding F2): la persistenza rc-dock è codice morto, nessun layout persistito da migrare.
4. **INSTANCES / rail sinistro**: FASE SEPARATA.

## Finding chiave dalla discovery F2 (ribalta il rischio #4 del report base)

La persistenza rc-dock su `DProject.layout`/`DUser.layout` è **CODICE MORTO**: `PinnableDock.load()`/`save()` senza chiamanti; il layout è ricostruito fresco a ogni render in `Dock.tsx:323-348` e passato come `defaultLayout` (non `loadLayout`); backend setter stub. Nessun campo versione, nessuna migrazione VersionFixer applicabile. **F2b = sola rimozione del push di `children[1]` (`Dock.tsx:337-348`)**, nessuna migrazione.

## Finding dalla verifica visiva di F2 (2026-07-29): collisione `:last-child`

Rimosso il figlio destro, il pannello canvas è diventato **contemporaneamente `:first-child` e `:last-child`** del dockbox. Tutte le regole SCSS scritte per la vecchia colonna Properties via `.dock-hbox > .dock-panel:last-child` hanno cominciato a colpire **il canvas**:
- `style.scss:1042-1108` (sizing split/sidebar/responsive) → canvas schiacciato a ~30% invece che full-width (evidenza: toolbar e MiniMap terminano alla stessa ascissa, bianco vuoto oltre).
- `style.scss:1171-1288` (hide-in-mode, variante **summary**) → nasconde il canvas sulla vista dashboard di progetto: **schermata bianca all'apertura del progetto**.

Un solo root cause, due sintomi. **Conseguenza di piano: il ritiro delle regole `:last-child` non è più rimandabile a F5** (da inerti sono diventate attive sul bersaglio sbagliato): anticipato nel F2-fix, limitatamente ai selettori che colpiscono il canvas. Regola operativa per il resto della fase: ogni selettore `:last-child` sul dockbox va considerato sospetto finché il dock ha un figlio solo.

Sospetto correlato (Tree card troppo bassa): se il riorientamento width → height ha riusato la chiave `jjodel_property_tree_view_width`, il valore persistito (una larghezza, ~260) viene riletto come altezza e nessun nuovo default diventa visibile. Serve chiave dedicata.

## Decisioni sulle 6 OQ della discovery F2 (Claude.ai, "procedi autonomamente")

1. **Mount host** → `ProjectDashboard`, sibling di `<Dock/>` (lifecycle legato al canvas, niente gating route).
2. **Mode** → nuovo `'floating'` (gate render/width-lock divergono puliti; additivo all'union).
3. **Gate render** `:318` esteso a `'floating'`; **gate width-lock** `:258` invariato (floating non scrive attr body del dock).
4. **Gating overlay** → riuso `activeEditorType`/`showFloatingCluster` (già dock-independent): overlay con canvas model/metamodel, cluster esistente come pill di riapertura quando entrambe le card nascoste. `bothCollapsed` riadattato, non ritirato. Kill-switch CSS (`canvas-only`/`documentation`) mantenuto.
5. **Disposizione** → Tree sopra, Properties sotto (flex). Larghezza overlay ~400px, resize dal bordo sinistro. Offset destro 8px, z 900. **Altezza Tree rivista a ~360px** (default iniziale 240 risultato troppo basso a vista); **top dell'overlay sotto la toolbar del canvas**, così l'heading del canvas resta sempre a larghezza piena.
6. **F2a+F2b** → **commit unico atomico** (rimuovere il figlio destro senza overlay = Properties irraggiungibile; montarlo senza rimuovere il tab = doppio render).

## Decisione 2026-07-29: F3 e F4 accorpati

I vecchi F3 (inset viewport) e F4 (MiniMap, FAB) diventano **un commit solo**. Condividono la stessa incognita (larghezza corrente dell'overlay, resizabile) e separarli lascerebbe uno stato intermedio scomodo da valutare: fit corretto ma MiniMap ancora sepolta sotto le card.

**Architettura ratificata: un writer, tre reader.** L'overlay in mode `floating` scrive su body la var `--jj-canvas-right-inset` (larghezza corrente + 8px, `0px` quando nascosto). La leggono: MiniMap e FAB via `calc()`, e un helper JS che la passa a `fitView` come padding destro. Motivo: la larghezza è resizabile, un inset hard-coded sarebbe sbagliato dopo il primo drag; e con overlay nascosto l'inset va a zero, quindi il canvas torna intero senza casi speciali.

Nota: è una var su body introdotta subito dopo averne ritirata una (width-lock). Differenza sostanziale: writer unico, non dimensiona il dock, serve solo agli ancoraggi visivi. Gli attributi `data-properties-tree-*` restano ritirati e non vanno reintrodotti.

## Esito F3 e F3-fix (chiusi, verificati a vista)

- Viewport-aware completo: `--jj-canvas-right-inset` letta da fitView (5 call-site), centratura `selectNode`, MiniMap e FAB. Con overlay nascosto il comportamento coincide con quello pre-fase.
- MiniMap `pannable` + `zoomable`.
- Overlay ancorato **sotto la toolbar e sopra la status bar** (ancoraggio `top`/`bottom`, non `max-height`: non insegue numeri magici a nessuna risoluzione).
- **Aggiunta di Claude Code non prevista dal prompt, accettata**: resize verticale via splitter in-flow fra le card, più accordion maximize/restore con doppio click sull'header; la card non massimizzata conserva il proprio header, quindi resta sempre una via di ritorno.
- Filtro della Tree portato sopra le righe (fuori dall'area scrollabile).
- Build verde, typecheck a baseline (Δ0), nessun file critical-zone toccato, LIR non dovuto.

## Default consolidati

- Overlay = portal su body (tier z 900). No absolute-in-canvas.
- Offset destro 8px; larghezza overlay ~400px; ancoraggio verticale top/bottom.
- Inset destro = `--jj-canvas-right-inset`, letto dinamicamente.
- **Pointer events (C9 SUPERATA, correzione post-F5)**: NESSUNA regola `pointer-events:none` sul wrapper. L'esperimento fu provato e revertito perché rompeva l'hit-testing dello splitter, che vive nel wrapper fuori dalle card (`auto` sulle card non lo copriva); il revert è documentato in `properties-with-tree-view.scss:987-990`. Il requisito è soddisfatto **per struttura**: il wrapper `position:fixed` occupa solo la colonna delle card (width inline), il resto del canvas resta interattivo. Verificato a vista (F5, §8 punto 8). **Non reintrodurre la regola.**

## Sequenza Fase 2

1. **F1 — redirect Documentation** ✅ committato.
2. **F2 — structural swap** ✅ committato.
3. **F2-fix — collisione `:last-child`, Tree più alta, overlay sotto la toolbar** ✅ committato.
4. **F3 (+F4) — inset di fitView, MiniMap, FAB** ✅ committato.
5. **F3-fix — clipping Tree, ancoraggio verticale, pointer events** ✅ committato.
6. **F5 — ritiro width-lock residuo + gating della pill** ✅ committato e verificato a vista (8/8 contesti). **Fase floating CHIUSA.**

## Chiusura fase — esiti F5 e finding post-F5 (2026-07-29)

**F5 committato** (`refactor: F5 retire width-lock machinery + finalize cluster gating`), passata visiva di Alfonso verde su tutti gli 8 contesti della §8.

Esiti per parte:
- **A** completa: useEffect width-lock, `COLLAPSED_PANEL_TOGGLE_WIDTH`, 8 write di `data-properties-tree-dragging` (logica cursor/userSelect preservata), 3 blocchi CSS senza writer. Grep dei simboli ritirati: solo commenti.
- **B**: logica della pill già corretta, ricommentata in semantica overlay. Kill-switch `data-active-tab="documentation"` LASCIATO: il gate JS non copre il caso perché `activeEditorType` è sticky (aggiornato solo da EDITOR_TYPE_CHANGE).
- **C** parziale: binding `rightSize` morto rimosso; `groups.editors` deferito (const orfane lo dichiarano ancora).
- **D** non applicata, correttamente: vedi correzione C9 nei Default consolidati.

Finding post-F5 (query read-only):
- **Union `mode` di `PropertiesWithTreeView`**: unico call-site vivo `Dashboard.tsx:627` con `'floating'`; `'tab'`/`'popup'`/`'inline'` morti (le occorrenze in Info.tsx, ElementPropertiesDrawer, ContextMenu sono del componente Info, non correlate). **DECISIONE (Claude.ai): restringere l'union a `mode: 'floating'`** in un commit dedicato post-push; rimozione dei soli rami interni che il typecheck segnala come confronti impossibili. Il tipo documenta la realtà; il restringimento è auto-verificante via compilatore.
- **Split**: lo switcher di layout con i bottoni Split/Sidebar/Canvas-only era già stato rimosso da Navbar nel commit `59d0e3f5b` (2026-03-16), **prima** della fase floating. Non è una regressione della fase. Orfani residui a bassa priorità: valore `'split'` nel tipo `LayoutMode` (Dock.tsx:27), blocco SCSS `body[data-layout-mode="split"]` (style.scss:1042), handler `handleLayoutModeChange`/`handleLayoutModeDoubleClick` mai cablati in Navbar. Backlog cleanup.
- **vertical-console**: modalità di test JS-only, attivata unicamente da helper esposto su `window` (nessun bottone UI, nessuna regola SCSS). Layout: canvas sopra, `<Console/>` sotto, con resize handle. Fuori dalla verifica visiva standard.

Backlog nuovo:
- **Dual-canvas** (idea di Alfonso): riusare il concetto di "split" per affiancare due modelli, o modello e metamodello, in due canvas. Fase a sé, strutturalmente parente di INSTANCES (torna a lavorare sul dock). Da progettare, non mescolare col cleanup.

Autorizzati post-chiusura: **push del branch** `alfonso-frontend-jjtl` e **cleanup dei tag `reconstruct-base-*`**, poi commit di restringimento dell'union.

## Nota stato git

Card 2A assorbita in F2 (era unstaged, mai committata a parte). Possibile WIP TextStyle concorrente nel working tree: escluderlo via `git add` scoped, mai `git add .`. Branch `alfonso-frontend-jjtl` con molti commit non pushati.
