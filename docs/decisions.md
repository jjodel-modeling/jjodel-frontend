# Decisions — vincoli operativi attivi

Nato da RC-4 (2026-08-05): le decisioni che non stanno nel repo non vincolano l'esecutore.
Claude Code legge questo file a inizio sessione, come CLAUDE.md. Una riga per decisione:
id, data, vincolo operativo. Le motivazioni estese vivono nel knowledge base della chat di
progetto. Quando due serie condividono una sigla (R-B del 2026-08-05 vs R-B9 del 2026-08-03),
citare l'id con la data. Le decisioni sostituite si spostano in "Superate", con data.

## Processo

- **RC-3** (2026-08-05) — Due corsie. Corsia completa (two-phase, report in `docs/discovery/`,
  ratifiche, verbale, gate pieni, effort xhigh) solo per: critical zone (`useJjomSync.ts`,
  `portDistribution.ts`), migrazioni, task sopra 3 file o che cambiano interfacce esportate.
  Corsia veloce per tutto il resto: prompt fino a ~80 righe COSA/DOVE/COME/RIFERIMENTI;
  verifica preventiva inline riportata in massimo 10 righe nella entry di log, nessun report
  separato; gate ridotti (`npx tsc --noEmit` senza errori nuovi nei file toccati, baseline 33;
  vitest sui soli file toccati; `npm run build`); verifica visiva raggruppata in un solo hard
  stop a fine sessione; effort high. I prompt di corsia veloce lo dichiarano in testa; in
  conflitto con CLAUDE.md, segnalare citando questa ratifica.
- **R-E/E-1** (2026-08-05) — Discovery con report già esistente al path indicato: non
  riscriverlo; leggerlo per intero, confrontare punto per punto, aggiungere in coda un
  addendum con le sole cose non coperte.
- **RC-7** (2026-08-06) — I documenti generati sono verificati da un gate, non dalla
  disciplina: `npm run check:agents` rigenera in una temp di sistema e confronta byte per byte
  con **tutti** i file prodotti dal generatore (oggi `AGENTS.md` e `frontend/src/jjtl/AGENTS.md`),
  mai il solo root. Chi tocca un `CLAUDE.md` rigenera e include i generati nello stesso commit.
  Nella stessa ratifica: i riferimenti `Corregge` di `check:docs` si risolvono sul **prefisso
  timestamp**, l'unica parte che §21.2 fissa come formato — su entrambi i lati del confronto, non
  sul nome intero (che è la direzione opposta a quella ratificata a voce, e misurata come
  peggiorativa: 4 warning → 5 invece che → 1).

## Arco A — barra a tab e capi degli edge

- **R-A** (2026-08-05) — Strada B per la barra: tutti i tab montati, gli inattivi nascosti con
  `display: none` (mai `visibility: hidden` né `opacity: 0`). La key di remount resta a
  livello di pannello: il reset avviene al cambio di view, non di tab. Nei sotto-editor
  dell'authoring e in `components/ui/` non si introducono `autoFocus`, `focus()`,
  `scrollIntoView`. Verifica mirata sul popover di `TextStyleField` al cambio tab.
- **R-B** (2026-08-05) — Niente badge di errore per-tab in v1 (`validateIR` ritorna una
  stringa senza coordinate): striscia di errore a livello di pannello sempre visibile, e i
  messaggi cross-tab nominano il tab nel testo. Coordinate di campo in `validateIR` =
  follow-up separato, prerequisito dei badge.
- **R-C** (2026-08-05) — 2.1 allargata: `isUsableEndpointExpr`, `nextEdgeForEndpoints`,
  `dropEndpoints` e la logica decisionale dei capi vivono in un modulo puro importabile sotto
  `viewpoint/ir/`; i test importano il modulo, mai mirror per copia.
- **R-D, emendamento a R-1 di E-obj** (2026-08-05) — Scrittura atomica dei capi: entrambe le
  chiavi o nessuna, sempre; con input incompleto l'IR resta intatto e la divergenza fra draft
  e IR è dichiarata in UI, non silenziosa né distruttiva. Uscire da object-as-edge è solo
  `changeNature('reference')`.
- **C-1..C-4** (2026-08-05) — Messaggistica dei capi: C-1 il caso A (coppia committata, un
  capo svuotato) dichiara la conseguenza (coppia precedente attiva; uscendo, l'edit incompleto
  si perde); C-2 il caso B (nessuna coppia, un capo digitato) ha un avviso proprio di lavoro
  non salvato; C-3 nessun messaggio rivendica una persistenza non avvenuta (il draft non è
  "salvato"); C-4 i test descrivono la semantica attuale, senza mirror di rami cancellati.
- **validateIR muto sulla divergenza** (2026-08-05) — Le stringhe di stato della divergenza
  sono un canale UI: non passano da `validateIR`.
- **R-F** (2026-08-05) — Il pin di identità della metaclasse (slice 1.3) è escluso da
  `canonicalize`: la canonicalizzazione non lo riscrive e non lo rimuove.
- **R-G** (2026-08-05) — Risalita al parent per feature negli endpoint: semantica ratificata;
  il lessema concreto è delegato al prompt di F3. F3 non parte prima che 2.1 sia landata.
- **R-H** (2026-08-06) — Per le view IR il tab Applies to assorbe i controlli autoritativi del tab
  legacy (Name; father: Viewpoint/Parent), ricollocati verbatim con write path invariati; il doppio
  writer di father resta registrato e non corretto qui. Breadcrumb rinviata finché parent e viewpoint
  non sono distinguibili.
  **Sospensiva sciolta (2026-08-09)**: parent e viewpoint sono distinguibili dalla voce 4
  (D-4-1/D-4-2), U-2 parte. Ratifica in chat Cowork del 2026-08-09; la breadcrumb legge
  `readViewParenting`, non i getter del proxy. Vedi Q2 nella sezione «Uniformazione delle due
  property card», dove lo scioglimento è già a registro.
- **R-2/3.6** (2026-08-07) — Finestra Style, rilevamento del css globale. (1) Suonano solo i css
  **modificati dall'autore**: confronto col blocco di fabbrica (`view/viewElement/defaultViewCss.ts`,
  estratto dal costruttore) a whitespace normalizzato; residuo accettato, un css di fabbrica che
  mordesse i nodi IR resta invisibile. (2) Predicato a **due** congiunti, `cssIsGlobal === true` e
  presenza di `!important`: **deviazione dichiarata** dalla ratifica originaria a tre, perché la
  Fase 0 ha misurato che un `!important` globale di primo livello è altrettanto dannoso e il terzo
  congiunto lo escluderebbe (niente conteggio di graffe). (3) Insieme scansionato: tutte le view e i
  viewpoint del progetto, col gate di `view.tsx:778-782` replicato (i viewpoint esclusivi non di
  default contano solo se attivi; view normali, viewpoint di default e overlay sempre). (4)
  Superficie: **un** toast warning per attivazione che aggrega gli N colpevoli, con dedup di sessione
  su chiave stabile (insieme dei colpevoli più hash dei loro css), memoria module-level e non Redux;
  la sede persistente in Source (R-2) resta rinviata. (5) **La 3.6 informa e non scrive**: nessun
  write path verso il modello, e il minimo per spegnere `cssIsGlobal` da una view IR è una micro-voce
  futura.
- **Nota Select condiviso** (2026-08-08, lezione voce 3) — Il primitivo `Select`
  (`components/ui/Select/Select.tsx:91`) antepone sempre un'opzione vuota, e non disabilitata:
  sui campi a vocabolario chiuso il default va gestito nel value visualizzato, mai scritto nello
  stato o in persistenza. Prima di riusare il primitivo su un vocabolario chiuso (terminazioni,
  stile linea, natura), verificare il trattamento del valore vuoto. Da non confondere con l'altro
  `Select`, quello data-bound di `forEndUser/Input.tsx`, la cui opzione vuota è `disabled`.

## Voce 4 — `father` writer unico, viewpoint derivato

- **D-4-1** (2026-08-07) — Il viewpoint di appartenenza non è un controllo scrivibile: in Applies
  to è una riga read-only che mostra `d.viewpoint` (il campo persistito che il resolver IR legge)
  con indicatore attivo/non attivo. Allinea la UI a una regola che il modello già dichiarava:
  `LViewElement.set_viewpoint` è un no-op che logga «call view.setFather(viewpoint) instead».
- **D-4-2** (2026-08-07) — Un solo Select "Parent view", unico writer di `father` via `set_father`.
  Lista: prima voce «(root of ‹viewpoint›)» che scrive il pointer al viewpoint, poi le view con
  `d.viewpoint` uguale a quello della view corrente — lo stesso campo della riga read-only, così
  riga e lista non possono contraddirsi.
- **D-4-3** (2026-08-07) — Lo spostamento cross-viewpoint è un'azione esplicita «Move to
  viewpoint…» nel body di Applies to, con select del target e conferma che dichiara la cascata
  («n sub-views will follow»). Lo slot azioni del Tree View resta un'aggiunta futura.
- **D-4-4** (2026-08-07) — La cascata vive in `set_father`: è un invariante di modello presidiato
  nel setter, non nella UI. `validateIR` è lassista e non recupera a valle.
- **D-4-5, emendata** (2026-08-07) — `ViewProperties.tsx` non si tocca: è irraggiungibile a HEAD
  (host `WorkbenchProperties` senza importatori). La morte di `components/editors/viewpoint/` è
  voce di igiene separata, col TypeError di `e.target.value || undefined` annotato lì.
- **D-4-6** (2026-08-07) — La lista dei parent esclude la view stessa e tutto il suo sottoalbero:
  un ciclo non è creabile dalla UI. Il visited set nella cascata resta come cintura per dati
  legacy e console (`get_viewpoint`/`get_fatherChain` non ne hanno e non ritornerebbero).
- **D-4-7** (2026-08-07) — L'opzione "None" è rimossa: «nessun parent» è la root. Nessun percorso
  UI produce più `father = ''`. Il legacy persistito mostra uno stato "detached" evidente e si
  ripara alla prima scelta esplicita: nessuna auto-sanatoria all'apertura del pannello.
- **D-4-8** (2026-08-07) — La cascata gira SEMPRE, anche nei reparent intra-viewpoint, e per ogni
  discendente scrive `viewpoint` solo se diverso: idempotente, e sana lazy le divergenze legacy
  del ramo toccato. Enumerazione per scansione di `state.viewelements` su `father` (BFS, visited
  set, snapshot preso PRIMA della prima scrittura), mai via `subViews` — che ha quattro writer,
  uno dei quali (`updateDefaultView`) è una mutazione grezza a ogni caricamento progetto. Il
  riallineamento è `SetFieldAction` diretta, mai `set_viewpoint` (no-op silenzioso).
- **D-4-9** (2026-08-08) — Riconciliazione: le ratifiche di chat R-F1..R-F5 del 2026-08-08
  coincidono con D-4-1..D-4-8 e non entrano nel registro con quel prefisso (`R-F` è già
  assegnato, 2026-08-05); il residuo R-F4 (breadcrumb `viewpoint › parent › view`) è U-2
  dell'arco U. Gate residuo della voce 4: smoke visivo della cascata cross-viewpoint (punto 4
  della checklist).

## Edge IR — arco espressività (serie R-B del 2026-08-03) ed E-route

- **Deroga d'ordine** (2026-08-06) — E-route eseguita subito, in parallelo alla coda arco A e
  prima di F2/F3 e di E-mark/E-lab. Decisione di Alfonso. Commit `423f19f01` (amend
  dell'orfano `5b2cb2f60`: stesso contenuto, corretta solo la entry di log).
- **R-B9** (2026-08-03) — Vocabolario del routing: identificatori persistiti
  `'orthogonal' | 'straight' | 'curved'`, mai rinominati (le view IR salvate non hanno
  VersionFixer); etichette UI libere (oggi Manhattan / Direct / Bezier). Campo assente ≡
  `orthogonal`, resa identica.
- **R-B9-bis** (2026-08-09, dalla chiusura irValidate, commit `1cee0e252`) — Le regole di
  validazione dell'IR vivono nel percorso di authoring (`validateIR`, chiamato dai soli quattro
  pannelli di authoring), mai nel percorso di render (`compile*`): il render resta permissivo
  verso i dati già persistiti, l'authoring applica il vocabolario. Ogni nuova regola di
  validazione IR va collocata giudicando il caso con questo criterio (authoring-time vs
  render-time), non per analogia col primo pattern incontrato nel codebase. Precedente: la
  regola sul routing (R-B9) innestata in `compileEdgeView` avrebbe scartato in silenzio le view
  già persistite con routing `''` che oggi rendono ortogonali (`UnifiedEdge.tsx:142`); in
  `validateIR` blocca i nuovi valori invalidi senza toccare il pregresso. Vocabolario unico
  esportato: `VALID_ROUTING_VALUES`.
- **R-B10** (2026-08-03) — Con routing non ortogonale i waypoint non si creano
  (`SegmentHandles` non montato) e quelli persistiti in `DVertex.irEdgeLayout` non si
  cancellano né si riscrivono: tornano vivi al ritorno a `orthogonal`.
- **R-B12, gate del registry** (2026-08-03, implementato il 2026-08-06) — `registerEdgePath`
  è condiviso con gli edge classici: mai registrarvi la polilinea ortogonale fantasma di un
  edge non ortogonale. Stato attuale: gli edge non ortogonali non registrano nulla: il
  crossing detection li ignora.

- **R-B13** (2026-08-17) — **Endpoint `container` per l'irKind Edge.** Il tipo degli endpoint
  diventa `EndpointExpr = PathExpr | 'container'` (spec v1.2 §7); `PathExpr` (§3.1 v1.1) non si
  allarga: il token non è legale in predicati, label, conditional, `TextSource`, `childFilter`.
  Grafia definitiva `container`, minuscolo, nudo (R-B9: nessun VersionFixer per le view IR);
  vocabolario in costante esportata sul precedente di `VALID_ROUTING_VALUES`. Risolve il parent
  di contenimento dell'oggetto-edge; ammesso su source, target o entrambi (self-loop sul
  contenitore, legittimo). `$container.value` resta una feature ordinaria: le due grafie non
  collidono. Memo: `docs/ratifiche/claude_2026-08-17_memo_ratifica_edge_endpoint_container.md`.
- **R-B14** (2026-08-17) — **La sintesi object-as-edge itera oggetti, non nodi.** I candidati
  vengono dal walk di composizione dalle radici del modello, lo stesso che costruisce
  `containerOf` (seconda mappa completa in `ContainmentModel`; la `parentOf` esistente, filtrata
  su graphVertex, resta intatta e non si riusa per gli endpoint). Il vertice è obbligatorio solo
  agli endpoint, mai sull'oggetto-edge: forma (a) come oggi (nodo nascosto, edge propri
  filtrati), forma (b) (`father = DValue`, senza vertice) senza nulla da nascondere. `ReadCtx`
  non si tocca: la sua superficie resta riservata all'estensione `state` (R-SIM-4). Oggetto-edge
  senza vertice con endpoint irrisolvibile: resta invisibile, deroga a §10 dichiarata nella spec.
- **R-B15** (2026-08-17) — **Ordine di implementazione vincolante** (da R6 della discovery):
  render permissivo verso il token prima della sua autorabilità; poi misura di reattività,
  regola in `validateIR` (prima regola di validazione endpoint), UI (controllo dedicato
  «Reference path / Containing element» accanto al `PathBuilder`, mai voce sentinella dentro il
  componente condiviso), guard di `handleReconnect` (trascinare un estremo `container` non
  riparenta ma non deve perdere `setIREdgeAnchorOverride`), emendamenti spec (§3, §6, §7, §9,
  §10). Due slice: 2a fino alla misura inclusa, hard stop, poi 2b. Un `container` già persistito
  si preserva sempre nella UI, mai sanificato.
- **R-B16** (2026-08-17) — **Reattività v1 per canale dichiarato.** L'invalidazione degli
  endpoint `container` passa dai due hash generici del sync (`useM1ReferenceEdges.
  m1RefValuesSig`; hash per-vertice `ch:` di `useJjomSync`), misurata prima dell'adozione (slice
  2a). Le ottimizzazioni future di quei due hash devono preservare questa invalidazione finché
  il dependency set non acquisisce una nozione esplicita di dipendenza dal contenitore
  (estensione futura, ratifica propria). La connect rule resta spenta sull'estremo `container`:
  creare un figlio contenuto non è connettere; è comportamento dichiarato, non bug.
  **Aggiornamento 2026-08-18**: l'«estensione futura con ratifica propria» annunciata qui è
  R-MK-5, che assorbe la dipendenza dal contenitore nella nozione unica di canale dichiarato. Il
  debito non prende una ratifica separata; la migrazione è la fetta M3 di R-MK-9.

## Uniformazione delle due property card (arco U, dal 2026-08-08)

Discovery di Fase 1: `docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md`.
Le sigle `Q1..Q7` sono le domande aperte di quel report; le `U-1..U-8` i punti dell'arco.

- **U-6 / Q3 = opzione (b)** (2026-08-08) — Il toggle Fixed/Conditional di `ConditionalEditor`
  è reso dal primitivo condiviso `SegmentedControl`, **senza glifi**: nessuna prop `icon` sui
  segmenti, quindi nessun cyan in questo controllo (selezionato = pillola bianca, testo
  slate-900). `.appbar-mode-switch` (navbar) resta com'è: la parentela dichiarata nel vecchio
  commento era già stale — le due copie divergevano sul colore del testo attivo — e non si
  insegue. Conseguenza accettata: il contrasto fra segmento scelto e non scelto cala rispetto
  al cyan di prima.
- **Token del glifo del segmented** (2026-08-08, **ratificata ma NON implementata**) — Il glifo
  di `SegmentedControl` deve valere l'accent `#0ea5e9`, non `--color-cyan-500` (`#06b6d4`,
  famiglia Tailwind cyan). Implementazione sospesa perché **nessun token del design system vale
  `#0ea5e9`**: `--color-accent` è slate-700, l'unico token a quel valore è
  `--color-toolbar-btn-active-text` (semanticamente estraneo) e `--accent` di
  `editor-v2/_themes.scss` è un token legacy vietato (CLAUDE.md regola 27). Il valore è
  hardcoded ~197 volte nel repo senza un token che lo rappresenti. Serve una voce di igiene dei
  token prima di chiudere questa: creare il token è fuori dal mandato di chi esegue.
  **Implementata (2026-08-10)**: `4701b735b` crea `--color-sky-500: #0ea5e9` in
  `styles/tokens.css` (famiglia Tailwind sky, introdotta con la sola grade 500) e ci punta il
  glifo del primitivo al posto di `--color-cyan-500`. La motivazione della sospensione è
  superata: il token che mancava ora esiste. Resta fuori, e resta il debito vero, la migrazione
  dei ~197 literal `#0ea5e9` sparsi nel repo. Nota di verifica: il glifo non è oggi raggiungibile
  a video, perché l'unico consumatore del primitivo (`ConditionalEditor`) non passa `icon`.
- **U-5 riformulato** (2026-08-08 mattina) — Il design «default effettivo sempre visibile» è già
  nel codice (`?? 0` negli stepper, `DEFAULT_BORDER`, e la compile che materializza priority 0 e
  border width 1). Il difetto è di **rendering**, non di dati: la casella dello stepper può
  restare vuota in modo persistente con lo store sano.
- **U-5, emendata — riscoped sulla skin B4** (2026-08-08 pomeriggio) — La sede della correzione
  ipotizzata la mattina (`NumberInput`, «sync dello stato interno») è **caduta**: l'ipotesi H-B è
  stata falsificata leggendo il componente, che non ha alcuno stato interno ed è un controlled
  puro (`value={value}`). Il difetto è della **skin B4**: la regola generica
  `properties-with-tree-view.scss:378-386` colpisce anche l'input interno degli stepper e la
  vince su tutto (`(0,4,1)` contro i `(0,3,4)` del ramo stepper e la singola classe del CSS
  module); il suo `padding: 11px 14px`, con wrapper fisso a 96px, bottoni a 38px e
  `box-sizing: border-box` globale, manda il content box sotto zero, e `overflow: hidden`
  dipinge una casella vuota su un valore sano. **Direzione ratificata: (1) neutralizzazione
  additiva nel ramo stepper**, con perimetro pari a quello della regola che collide — quindi
  selettore **discendente**, che copre anche lo stepper annidato dentro `ConditionalEditor`
  (`Spessore`, `EdgeAuthoringPanel.tsx:663`), che il ramo a figlio diretto non ha mai raggiunto.
  Scartata la (2), toccare la generica: è viva e corretta su molti altri input, gli hex dei
  colori inclusi. Scartata la (3), allargare il primitivo: sposta geometria già approvata ai
  gate e cura il sintomo al layer sbagliato. Meccanismo, aritmetica del box e prova
  discriminante (Ordinal di un `DEnumLiteral`) nell'addendum Slice B di
  `docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md`.
- **H-B falsificata, agli atti** (2026-08-08) — `NumberInput` non ha stato interno: niente
  `useState`/`useEffect`/`useRef`, l'input è controllato puro. Non esiste nulla da
  risincronizzare, e nessuno stato del draft — sano o transiente — produce una casella vuota
  (il seed di fallback `defaultObjectViewIR()` dà `priority: 0` e, senza chiave `border`,
  `width: 1`). Chi in futuro rivedesse U-5 non ripercorra quella strada.
- **Residuo noto di U-5, non corretto** (2026-08-08) — La neutralizzazione restituisce il
  contenuto ma non lo spazio: wrapper fisso a 96px meno due bottoni da 38px lascia **20px**
  all'input, contro i 40px per cui il primitivo era stato disegnato
  (`NumberInput.module.css:9`, «28 + 40 + 28 — input leggibile»). Una o due cifre entrano, da
  tre in su vengono clippate da `overflow: hidden`. Correggerlo è la direzione (3), scartata.
- **Q7 — perimetro della skin B4** (2026-08-08) — La Fase 2 lavora **dentro**
  `.properties-panel-container` (la skin B4 di `properties-with-tree-view.scss`), accettando che
  le sue regole valgano su entrambe le card. Il gate di verifica visiva è quindi doppio: ogni
  slice che tocchi B4 si guarda sulla card view **e** su quella della sintassi astratta.
- **Q2 — sospensiva di R-H sciolta** (2026-08-08) — La breadcrumb rinviata da R-H («finché
  parent e viewpoint non sono distinguibili») è sbloccata: la voce 4 ha reso il viewpoint
  derivato e `father` writer unico. U-2 può partire. La breadcrumb legge `readViewParenting`
  (campo persistito `d.viewpoint`), **mai** `get_viewpoint` — che risale la catena `father` e
  potrebbe contraddire la riga read-only su dati legacy divergenti.
- **Q4 — emendamento di U-1** (2026-08-08) — L'help va all'host (riga PROPERTIES), il back
  torna nell'header della view, e il portal di `ViewData` verso
  `.properties-panel-header__actions` viene ritirato. Motivo: il lookup è un
  `document.querySelector` globale con deps vuote, quindi non scoped al proprio container e
  incapace di seguire un rimonta dell'header.
- **Q5 — doppie label per livelli** (2026-08-08) — U-7 non sopprime a tappeto la seconda label
  dei toggle: si applica per livelli. Ridondanza pura (`Visible`/`visible`,
  `Editable`/`editable inline`) → via la label del `Toggle`. Ridondanza parziale
  (`Separator`/`row separators`) → via, riscrivendo la label di campo se serve. Label che porta
  informazione assente dalla prima (`Metaclassi`/`Tutte le metaclassi (*)`,
  `Condizione`/`Applica solo se (predicate)`, `Esclusiva`/`exclusive`) → **si tiene**: lì il
  toggle commuta un modo, e la sua label è ciò che lo dice.
- **Q6 — U-8 decaduto su ADVANCED STATE** (2026-08-08) — Non esiste alcun flusso UI di aggiunta
  di custom state: il blocco è un `JsonViewer` in sola lettura e gli unici scrittori di `_state`
  sono il setter del proxy e una `SetFieldAction` mirata in `ProjectEditor`. Non c'è un'azione
  da offrire nell'empty state, e U-8 non si applica a quella sezione. Sulle liste dell'IR
  (compartments, badge, label, segment) U-8 è invece **già soddisfatto**: `ListEditor` rende il
  bottone dashed fuori dal ramo «lista vuota», quindi messaggio e azione convivono.

## Voce 5 — grappolo igiene (dal 2026-08-09)

- **D-5-1** (2026-08-09) — `InfoTooltip` è primitiva condivisa in
  `components/ui/InfoTooltip/`; consolida i 4 siti byte-identici (md5
  `47b49fac269cb6f677866c6d891615f3` sulle 12 righe della dichiarazione), incluso
  `editors/Info.tsx`, fermo dal 2026-07-05 e col touch ratificato. Le classi `jj-info-*`
  restano invariate — sono API interne, definite in `editors/info-improvements.scss:975-1015`
  — e non si migrano a CSS Module perché il mandato è resa identica: la primitiva non è
  auto-contenuta sul piano degli stili, e il suo docstring lo dichiara. Ingresso in vetrina
  rinviato al punto 4 della sequenza DS. Segue il pattern a tre livelli di `components/ui/`
  (file + `index.ts` del componente + voce nel barrel): l'opzione di saltare il barrel è stata
  scartata in ratifica perché avrebbe reso `InfoTooltip` l'unica primitiva invisibile da
  `ui/index.ts`. La firma resta inline `(props: { text: string })` invece di puntare a
  `InfoTooltipProps`: riscriverla avrebbe rotto la prova per md5, ed è riscrivibile quando la
  prova smette di essere portante.
- **D-5-2** (2026-08-09) — `InfoTooltip` adotta la grafica del cruscotto di tracciabilità:
  pannello slate `#334155`, testo `#cbd5e1`, titolo `#f1f5f9`, 12px, caret, ombra
  `0 4px 12px rgba(15,23,42,.25)`, radius 10px. API estesa con `title?` opzionale, oggi non
  esercitata da nessuno dei 4 siti; badge di stato **escluso** (è semantica di copertura
  R→D→I→P→C del cruscotto, non della primitiva). Stili colocati in
  `ui/InfoTooltip/InfoTooltip.scss`, regole globali `jj-info-*` ritirate da
  `editors/info-improvements.scss`: la primitiva è ora auto-contenuta, cosa che D-5-1 non
  poteva ancora dire. Niente animazioni, niente portal, niente librerie.
  **L'ancoraggio resta quello di prima** — a destra dell'icona, centrato in verticale — e
  **non** quello dello screenshot (`bottom: calc(100% + 8px)`): tutti e quattro i siti stanno
  dentro uno scroll container (`.properties-panel`, `info.scss:414-417`; `.apply-to-tab`,
  `viewapplyto.scss:47-50`) e il containing block del pannello è il wrapper dell'icona, quindi
  un pannello verso l'alto verrebbe tagliato — fino a ~125px per i testi più lunghi di
  `InfoData.tsx`. Il caret sta perciò sul bordo sinistro. Misura in
  `docs/discovery/discovery_2026-08-09_infotooltip_ui_consolidation.md` §A2, scelta in §A4
  (opzione A). Colori literal e non token per scelta dichiarata: è una superficie scura su UI
  chiara e la palette light non ha token di superficie invertita; `--z-tooltip` è l'unico token
  che calza ed è usato; 10px di radius e 12px di font sono fuori dalle scale (4/8/12/16 e
  11/13/15) e vengono dallo spec ratificato.

## Arco rail destro — preset 2a (dal 2026-08-10)

- **R-RAIL-1** (2026-08-10) — Il rail è un guscio, l'inspector uno slot; l'arco 1 scrive un
  solo renderer, quello dell'elemento di metamodello. Il dispatch polimorfo **esiste già** in
  `editors/Info.tsx:1172-1235` (la view vince sul model element, poi si discrimina su
  `className` del `__raw`): si riusa, non si riscrive. C1.1 i pannelli di authoring non si
  toccano. C1.2 l'identity block si calcola da `view.ir.kind` e `view.ir.metaclasses` per le
  view con IR; per le view legacy (`!view.ir`) non si rende affatto — niente placeholder,
  niente spazio riservato. **Emendata da R-RAIL-26** (2026-08-10): il renderer dell'elemento
  di metamodello esce dall'arco 1 e passa all'arco 2; l'arco 1 consegna guscio, slot e restyle
  del tree.
- **R-RAIL-2** (2026-08-10) — U-2 è superato **solo nella parte posizionale** del breadcrumb,
  non contraddetto: l'identity block del rail sostituisce la riga che dichiara dove sta
  l'elemento, ma il breadcrumb di «Applies to» è **semantica della view** — dice a quali
  metaclassi la view si applica, non dove si trova — e sopravvive invariato.
- **R-RAIL-3** (2026-08-10) — Arco 1 realizza solo il preset `2a`. C3.1 niente gear, niente
  popover, nessuna chiave di storage bruciata per il preset. C3.2 si introducono il tipo
  `RailPreset` e la costante `PRESET_2A`, e nient'altro: nessuno `switch` con casi vuoti,
  nessun `2b` abbozzato. C3.3 il segmented Basic/Advanced resta nella top bar.
- **R-RAIL-4** (2026-08-10) — Si consumano `--color-selection-bg` e `--color-selection-bar`,
  mai letterali; i tre cyan restano distinti, nessuna unificazione né migrazione verso
  `--color-sky-500`. Risolta con R-RAIL-8, che è posteriore: poiché la barra non si fa, l'arco
  consuma di fatto solo `--color-selection-bg`, e `--color-selection-bar` resta a zero
  consumatori senza che se ne introducano.
- **R-RAIL-5** (2026-08-10) — C5.1 si consumano `var(--font-sans)` e `var(--font-mono)`, mai
  nomi di famiglia. **C5.2 è annullato**: i font sono già caricati da
  `styles/tokens/_typography.scss:81,84`, due `@import url(...)` da Google per Inter e IBM
  Plex Mono, quindi non esiste alcuna dipendenza da introdurre. C5.3 la verifica è sul
  computed style in devtools, non sulla dichiarazione.
  **Verificato il 2026-08-12**: C5.2 misurata su entrambi i percorsi, voce di debito chiusa.
- **R-RAIL-6** (2026-08-10) — Token per lista nera, non per scelta di sistema: il rail consuma
  da entrambi i sistemi (`styles/tokens/*.scss` e `styles/tokens.css`) evitando i 13 nomi che
  i due definiscono con valori diversi — `--color-bg-primary`, `--color-bg-secondary`,
  `--color-border-focus`, `--color-border-primary`, `--color-border-secondary`,
  `--color-text-secondary`, `--color-text-tertiary`, `--shadow-*`, `--transition-fast`,
  `--transition-slow` — perché su quelli il vincitore della cascata dipende da
  `localStorage.theme`. Nota strutturale: `styles/variables.scss` è dichiarato su `body` e per
  ereditarietà batte entrambi i `:root` sui nomi condivisi (`--input-height` vale 36px, non 40).
- **R-RAIL-7** (2026-08-10) — Il tree pane **riusa `TreeViewContent`**, non lo riscrive; si
  adotta solo il restyle: suffisso di tipo in `var(--font-mono)`, riga 26px, nome 13px peso
  500, peso 600 sull'elemento selezionato. Rinviati badge lettera, filtro che appiattisce
  l'albero, conteggio totale, cambio di indent. C7.1 `TreeViewSidebar.tsx` è codice morto a
  backlog e non si tocca.
- **R-RAIL-8** (2026-08-10) — Nessuna barra di selezione, contro il design: resta la pill
  esistente più il peso 600, che soddisfa lo stesso requisito di accessibilità senza ribaltare
  la Fase 2 C1 del 2026-07-28. Il triplo ruolo di `#0891B2` resta inerte e non si tocca.
- **R-RAIL-9** (2026-08-10) — I 7 valori `nuovo` della tabella D3: le tre altezze (26, 28,
  44px) restano **letterali** nel foglio del rail, raccolte in un unico blocco di commento in
  testa al foglio che le elenca e ne dichiara la ragione (la scala dei token parte da 32 e
  sale di 8, quindi non ha gradini vicini); le quattro coppie entity sono già token dal commit
  `4d215ff0e` (C9.1) e si consumano, senza ridefinirle né duplicarle in locale. **Annotazione**
  (2026-08-10): la seconda metà non si è realizzata. Con R-RAIL-25 le quattro coppie restano
  **token senza consumatori nel pannello**; il criterio «zero consumatori a fine passo 3 ⇒
  passo incompleto» dell'emendamento rev 2 è ritirato, perché non discendeva da questa voce.
- **R-RAIL-10** (2026-08-10) — I 14 valori `snap` vanno **sempre** al gradino vicino della
  scala: si emenda il design, non si estende la scala per far combaciare il mockup. Due sole
  eccezioni: `letter-spacing: 0.08em` resta letterale, e le quattro ombre si compongono a mano
  — geometria scritta per esteso, colore da `--color-accent-subtle` e `--color-node-shadow` —
  mai `var(--shadow-*)`.
- **R-RAIL-11** (2026-08-10) — Sopravvivono due chiavi di storage, e solo quelle:
  `jjodel_property_panel_visible` e `jjodel_property_overlay_width`, quest'ultima con
  **minimo 360**, clampato sia in lettura sia durante il resize. Spariscono lo stato
  `cardMaximized`, i due `toggleMaximize*`, lo splitter e i due `CollapsedPanelToggle`. Non si
  toccano `jjodel_treeview_visible` né `TreeViewPanelContext`. `--jj-canvas-right-inset` resta
  il contratto verso il canvas, scritto con la semantica di oggi: il canvas non deve spostarsi
  in modo diverso da prima quando il rail si apre e si chiude. Una chiave resa inerte dal
  ritiro e non nominata qui **non si rimuove**: si annota nell'entry di log.
- **R-RAIL-12** (2026-08-10) — La sezione NODE resta nel guscio, gated su `advanced`,
  restilata come disclosure. Spostarla dentro l'inspector cambierebbe *quando* compare, non
  solo *dove*.
- **R-RAIL-13** (2026-08-10) — Il rail legge **solo** Redux `state.advanced`; nessun
  consumatore nuovo di `useInterfaceMode`. In `editors/Info.tsx` i due sistemi di modalità
  convivono a poche righe di distanza: non si «aggiusta» nulla, si evita soltanto di
  aggiungere consumatori del secondo.
- **R-RAIL-14** (2026-08-10) — Postura Browse/Focus **fuori dall'arco 1** (per R-RAIL-12).
  `PRESET_2A` codifica solo geometria. Tree 392px quando entrambi i pane sono montati; altezza
  intera al pane superstite; nessuna altezza trascinabile. **Ricollocata all'arco 2 da
  R-RAIL-38**: la clausola che vale ancora è l'assenza di altezza trascinabile.
- **R-RAIL-15** (2026-08-10) — Il restyle del tree si scrive in `tree-view-sidebar.scss`
  (ampliamento di scope dichiarato). Vietati gli override di specificità dal foglio del rail.
- **R-RAIL-16** (2026-08-10) — Identity block = `PropertiesHeader`, restilato in loco nel ramo
  model element; niente blocco nel guscio; **niente chip di firma**. **Superata per l'arco 1 da
  R-RAIL-26**.
- **R-RAIL-17** (2026-08-10) — Default larghezza **400** (già a codice); `MIN_OVERLAY_WIDTH` da
  320 a **360**.
- **R-RAIL-18** (2026-08-10) — Header unico: si riusa quello della card PROPERTIES; l'header
  del tree diventa label di sezione senza azioni; pin e HelpButton restano dove sono; **footer
  fuori arco**.
- **R-RAIL-19** (2026-08-10, forma fissata il 2026-08-11) — Le grep di conformità dell'arco
  girano sul **diff staged**, mai sul file intero: il foglio del rail ha 82 letterali
  esadecimali preesistenti che renderebbero rossa la grep sempre. Le occorrenze preesistenti si
  riferiscono nell'entry di log, non si correggono. Il quartetto originario non era stato messo
  a registro e non è più stato recuperabile dalle fonti autorizzate; l'11 agosto si è fissato
  il **quintetto** che lo sostituisce, preso da
  `docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md` §8: (1) i 13 nomi in lista nera di
  R-RAIL-6; (2) `var(--shadow-`; (3) letterali esadecimali `#[0-9a-fA-F]{3,8}`; (4) `z-index`;
  (5) `font-family:`. La quinta ha atteso **diverso da zero** quando il passo aggiunge una
  famiglia: la verifica è che la riga consumi `var(--font-mono)` e non un nome in chiaro. Forma
  sul diff: `git diff --cached -U0 -- <file> | grep '^+' | grep -v '^+++' | grep …`.
- **R-RAIL-20** (2026-08-10) — Il report di discovery si committa a sé, prima del passo di
  registro.
- **R-RAIL-21** (2026-08-10) — `jjodel_property_tree_height`: sparisce il codice, **resta il
  dato** nei `localStorage`; nessun cleanup, annotazione in log.
- **R-RAIL-22** (2026-08-10) — L'espressione di `overlayShown` non si tocca; il guscio si monta
  sulla condizione di oggi; i due pane si rendono ciascuno sulla propria visibilità.
- **R-RAIL-23** (2026-08-10) — Il controllo di collasso in header **commuta solo la
  visibilità dell'inspector** (`jjodel_property_panel_visible`). Con R-RAIL-18 l'header
  appartiene al guscio e resta a schermo finché almeno uno dei due pane è montato, quindi
  nascondere l'inspector è reversibile da lì e non esiste il vicolo cieco che motivava il
  collasso totale. Il tree conserva la propria chiave e ⌘B: il rail **non scrive mai**
  `jjodel_treeview_visible` e non chiama i setter di `TreeViewPanelContext` (R-RAIL-11).
  Quando entrambi i pane sono nascosti il guscio si smonta e subentra la pill di riapertura
  già esistente. L'espressione di `overlayShown` resta quella di oggi (R-RAIL-22). Motivo:
  col collasso totale chi chiudeva il rail perdeva la preferenza del tree al reload, perché
  la chiave del tree veniva scritta a `false`.
- **R-RAIL-24** (2026-08-10) — La disclosure NODE resta **chiusa di default**. La premessa che
  aveva motivato «aperta di default» era falsa: `nodeOpen` parte a `false` da sempre, quindi con
  `advanced` attivo si è sempre vista la sola intestazione, e aprirla non avrebbe conservato il
  comportamento — l'avrebbe cambiato. Restano invariati `aria-expanded`, lo stato non persistito
  (nessuna chiave nuova, l'inventario di R-RAIL-11 non si allarga), `NodeEditor` e le sue prop.
- **R-RAIL-25** (2026-08-10) — La palette del badge del pannello **non si migra** ai token
  entity. Il badge prende oggi i colori da `styles/components/_form-system.scss:1251-1259`
  (nove modificatori `.jj-type-badge--*`); `getElementTypeInfo` restituisce solo il nome di
  classe, non il colore. Due ragioni indipendenti: (1) `_form-system.scss` è importato
  globalmente da `styles/style.scss:2` e `.jj-type-badge` ha consumatori vivi oltre a `Info`
  (`views/ViewData.tsx:221`), quindi il raggio d'azione di una modifica lì è l'app e non il
  rail; (2) in tema light **nessuno dei quattro kind di C9.1 coincide** con il valore attuale, e
  attribute ed enum sono **invertiti** — l'ambra che nel pannello significa «attributo» è il
  token di `enum`, lo smeraldo che significa «enum» è il token di `attribute`. È un cambio di
  colore, non una migrazione di sorgente. Nessun colore cambia a video; la questione va a
  backlog in `docs/TECH-DEBT.md`.
- **R-RAIL-26** (2026-08-10) — Il restyle dell'identity block va **all'arco 2**, ed emenda
  R-RAIL-1: l'arco 1 consegna guscio, slot e restyle del tree. Dei quattro ingredienti del
  blocco, il chip di firma era già fuori (R-RAIL-16), i colori escono con R-RAIL-25, e il
  `padding` del form body è stato declinato perché `.properties-panel-body` ospita anche il ramo
  view. Resta la tipografia, la cui casa è il guscio: la rev 2 ha tenuto il blocco dentro il
  ramo model element solo per non cambiare cosa vede una view selezionata, quindi è una
  sistemazione provvisoria, e regole scritte ora sotto un modificatore element-only verrebbero
  smontate dall'arco 2. Vanno insieme all'arco 2: collocazione del blocco nel guscio, decisione
  sulla palette, chip di firma, padding del form body sotto modificatore.
  `editors/info-improvements.scss` **non si tocca in questo arco**.
- **R-RAIL-27** (2026-08-11) — Lo stato del working tree **non è invariante per macchina**:
  `git status` risente del gitignore globale `~/.config/git/ignore`, che è per utente e per
  macchina. Un working tree osservato dal bridge di Cowork non descrive quello che Claude Code
  vede sul Mac. Conseguenze: (a) un guard di prompt non elenca file ignorati fra le righe
  attese; (b) ogni guard dichiara la propria **tolleranza**, cioè quali divergenze sono ammesse
  e quali fermano il task, altrimenti si compra uno stop falso a ogni passo; (c) una divergenza
  di guard diagnosticata e a riduzione di lavoro non è un hard stop, ma va riportata. Estende
  alle **letture** la regola già in vigore per le scritture git dal bridge.
  - **Emendamento del 2026-08-13** — Il meccanismo, misurato e non inferito: `core.excludesFile`
    è **vuoto su entrambe le macchine**, quindi non è quella chiave a distinguerle. Non essendo
    impostata, git risolve il path di default degli esclusi da `$XDG_CONFIG_HOME` o, mancando
    anche quello, da `~/.config/git/ignore`, cioè **da `HOME`**. Il bridge monta la cartella del
    repo ma non la home dell'utente e punta `HOME` dentro la sessione, dove quel file non esiste.
    Riprodotto sul Mac spostando la sola `HOME`: `git check-ignore -v .claude/settings.local.json`
    passa da exit 0 a exit 1, e `git status --short` fa comparire `?? .claude/settings.local.json`,
    che in condizioni normali non c'è. **Conseguenza operativa: un `git status` dal bridge
    sovrastima sempre i file non tracciati.** Un elenco di residuo del working tree prodotto da lì
    va confrontato con quello locale prima di diventare una richiesta di decisione.
- **R-RAIL-28** (2026-08-11) — Un'asserzione di assenza vale solo se la ricerca che la sostiene
  è provata: exit status verificato, oppure un controllo positivo con segnale sullo stesso
  comando. **Testo normativo in `CLAUDE.md` §5**, sotto-regola «an assertion of absence
  requires proof that the search ran»: qui non si duplica, per non creare la solita coppia che
  diverge. Ratificata dopo quattro occorrenze in due giorni.
  - **Emendamento del 2026-08-11** — La regola vale per le asserzioni di **presenza** quanto per
    quelle di assenza. Un path, un conteggio di file, l'elenco dei siti di una duplicazione e
    **la descrizione di una resa a video** sono misure. Cinque occorrenze in questo arco: un path
    di cartella inferito da un file vicino; tredici variabili dichiarate consumate e in realtà
    morte; otto fogli col teal che erano dodici; una voce di debito già a registro proposta come
    nuova; un report di esecuzione che descriveva glifi colorati a token, ratificato senza
    guardare lo schermo, dove i glifi sono monocromi. L'ultima porta il corollario più utile:
    **un report di esecuzione non è una misura della resa.** Solo la verifica visiva lo è, e
    nessuna descrizione la sostituisce.
- **R-RAIL-29** (2026-08-11) — L'`grep` interattivo di questa macchina è un wrapper di
  `ugrep --ignore-files`: `--exclude-dir` è inerte e `--include` non filtra. `command grep`
  risolve a BSD grep, che li onora entrambi. Testo normativo in `CLAUDE.md` §5, sotto-regola
  «the interactive grep is not the system grep». Corollario retroattivo: chi cita una vecchia
  asserzione di assenza come autorità la rifà prima di citarla.
- **R-RAIL-30** (2026-08-11) — La scala entity ha **una sorgente sola**, i token in
  `_colors-light.scss` e `_colors-dark.scss`, generata in OKLCH a chiarezza e croma fissi:
  cinque tinte cromatiche equispaziate a 59.6 gradi, banda cyan 210-250 esclusa perché
  prenotata dalla selezione, e una coppia neutra slate per la famiglia dei contenitori. Le
  sotto-entità prendono la tinta del genitore a croma ridotto. I kind mappano su **nove
  coppie**; la mappatura vive nei file di token come alias, non si duplica altrove e non si
  ricopia a registro. Contrasto minimo misurato 5.96 su tutte le coppie e su entrambi i temi.
- **R-RAIL-31** (2026-08-11) — Ogni comando di shell scritto in un prompt quota i suoi glob e
  usa `-E` con barre nude per le alternanze. Terza occorrenza in un arco della stessa specie di
  errore, cioè un'affermazione scritta con la sicurezza di una misura e mai misurata. La regola
  vive anche nel template di prompt, che è dove l'attore che deve obbedirla la legge; qui sta
  come traccia, non come sede.
- **R-RAIL-32** (2026-08-11) — Una regola di famiglia vale finché i membri non compaiono come
  fratelli simultanei. La superficie che li affianca si cerca **prima** di ratificare la regola,
  non dopo. Nata dal menu «New document», unica superficie in cui i cinque tipi di documento si
  vedono insieme, e che la giustificazione della famiglia contenitori non aveva previsto.
  Corollario misurato nello stesso passo: le superfici erano **due**, non una — nel tree le
  icone di metamodel, package e model-M1 collassano sulla stessa coppia. Cercarne una e
  fermarsi non soddisfa la regola.
- **R-RAIL-33** (2026-08-11) — **La scala entity non entra nel tree.** Il colore di tipo vive
  dove l'elemento è isolato e non ha contesto strutturale che ne dichiari la natura: badge del
  pannello properties, navbar, badge `view`, tutti in registro a **pastiglia**, fondo `-bg` più
  testo `-fg`. Nel tree la natura è già dichiarata da due canali, la forma dell'icona e
  l'indentazione, quindi il colore sarebbe un terzo canale ridondante su una lista che può
  essere lunga centinaia di righe; e una campitura piena dentro una fascia che porta hover e
  selezione competerebbe con lo stato invece di aggiungersi. **Il tree resta monocromo.** Primo
  corollario: la collisione dei contenitori prevista da R-RAIL-32 non si presenta nel tree, dove
  metamodel, package e model annidato hanno icone diverse; resta aperta nel menu «New document»,
  che è superficie a pastiglia. Secondo corollario: i contrasti misurati in R-RAIL-30 descrivono
  il solo registro a pastiglia, dove `-fg` poggia sulla sua `-bg`. Prima del 2026-08-11 il tree
  era colorato: questa voce ratifica il cambiamento come scelta, non lo registra come
  regressione da riparare.
  - **Emendamento (2) del 2026-08-11** — «Il tree resta monocromo» vale per le righe di
    **elemento**. Le righe viewpoint e view-leaf fanno eccezione: sono a pastiglia da prima
    dell'arco e restano, perché sono righe di documento e non di elemento, e lì il colore è
    l'unico canale che le stacca dalla lista. La rimozione dei selettori prevista dalla voce di
    debito dell'11 agosto non le tocca.
- **R-RAIL-34** (2026-08-12, «D9» nel prompt) — **Il segmento del metamodel cade sempre nel
  breadcrumb del guscio**, non solo quando il package radice ne ripete il nome: il rail porta
  già il nome del `DModel` proprietario nel proprio header, in cima alla stessa colonna e
  sempre visibile, quindi quel segmento ripeteva l'header per costruzione. Restano i package,
  e nel caso comune il breadcrumb si svuota. Il prompt numera le decisioni di questo passo
  D1..D10; il registro dell'arco usa una serie sola, `R-RAIL-*`, e questa è la corrispondenza.
  **Caveat misurato**: `railTitle` (`PropertiesWithTreeView.tsx:277-289`) risale la catena
  `father` da `state._lastSelected.modelElement`, mentre il pannello rende `overrideSelected`
  quando il pin è attivo (`Info.tsx:1445-1448`). Stesso campo — `DModel.name` — ma ancore
  diverse: col pin acceso su un elemento e la selezione spostata su un altro metamodello, i due
  divergono. La divergenza **preesiste** a questa voce, che non la crea: toglie però l'unico
  punto in cui il pannello dichiarava il proprio metamodello, quindi la rende meno visibile.
  Non corretta qui.
- **R-RAIL-35** (2026-08-12, «D10» nel prompt) — **L'astrattezza si vede nel guscio**, col
  corsivo sul nome: stesso canale che il tree usa già (`is-abstract`, `tree-view-sidebar.scss:1763`),
  e non un badge, perché il badge porta il kind e mai i modificatori. Il dato era già in mano al
  componente (`data.abstract`, la stessa lettura che `Info.tsx` fa a `:229` e `:1106`), quindi la
  clausola di rinuncia del prompt — nessun accesso nuovo al modello per questa voce — non è
  scattata.
- **R-RAIL-36** (2026-08-12) — Lo stile computato di un elemento è una misura della resa **solo se
  quell'elemento è quello che dipinge**. Altrimenti la misura sono i pixel. Un `color` letto su un
  contenitore non dice nulla del glifo che contiene, se il glifo ha una dichiarazione propria.
  Gradino successivo dell'emendamento a R-RAIL-28, che aveva stabilito che un report di esecuzione
  non è una misura della resa: anche una misura vera, presa sull'elemento sbagliato, non lo è.
  Nata dal caso dei glifi del tree, dove un `color` che passa da bordeaux a cyan non muove un pixel.
- **R-RAIL-37** (2026-08-12) — Prima di rimuovere una dichiarazione si enumerano **tutte** le regole
  che sta battendo, non solo quella che il commento accanto nomina. Le undici `background:
  transparent` della copia del pannello ne tenevano due, la `-bg` del foglio del tree e la metà
  dark della quarta palette, e il commento ne dichiarava una: la seconda non era stata costata da
  nessuno. La verifica è meccanica e costa un giro di build: si toglie, si ricostruisce, si
  confronta lo stile computato **su ogni tema**, non sul tema che si ha davanti. Nata dall'hard stop
  del passo 7.
- **R-RAIL-38** (2026-08-12) — **La postura Browse/Focus rientra nell'arco 2**, e con essa la Focus
  bar di design §6. R-RAIL-14 la mandava fuori dall'**arco 1** e nessuna voce l'aveva poi
  ricollocata, quindi il registro la dava per esclusa da un arco che non era il suo. La
  ricollocazione non è un allargamento di perimetro: senza postura il preset `2a` non esiste, è il
  preset `1a` senza divider, e il design lo dice a §5 e §«Suggested build order» punto 5, «this
  yields preset 2a, the default». Non è nemmeno sviluppo nuovo: il codice era stato scritto in
  `bcc68da8f` e ritirato in `77e2bb6a6` con un commit additivo, apposta perché restasse
  recuperabile. Di R-RAIL-14 resta in vigore la clausola sulla geometria non trascinabile; cade la
  sola collocazione d'arco.
- **R-RAIL-39** (2026-08-12) — **Il breadcrumb posizionale non si rende in postura Browse.**
  Design §7: «this block replaces the current title row **and** the breadcrumb». In Browse la riga
  del tree mostra già dove sta l'elemento, e ripeterlo sotto il titolo è la terza dichiarazione
  della stessa cosa in 40px, cioè il problema 5 che il redesign è nato per togliere. In Focus il
  tree non c'è, e il contesto torna come Focus bar, che è un canale solo e non un duplicato.
- **R-RAIL-40** (2026-08-12) — **L'identity block resta dov'è e la postura lo raggiunge dal CSS.**
  Il memo del perimetro residuo proponeva di farlo salire dal ramo model element al guscio, con
  l'argomento che un blocco dentro il ramo non può animare su uno stato del guscio senza far
  passare la postura attraverso `Info`, cioè senza il props drilling che le convenzioni vietano.
  L'argomento assume che la postura debba viaggiare in JavaScript. Non deve: il guscio scrive già
  `--rail-focus` su di sé, e da lì la postura raggiunge qualunque discendente per cascata, che è il
  canale che il progetto usa. Il costo evitato è quello vero: salire nel guscio significava un
  blocco unico che rende due rami, `ViewData` che perde il suo header, e un secondo lettore del
  modello dentro il guscio per nome, kind, astrattezza e firma. Il beneficio era la sola
  collocazione. Conseguenza operativa: le regole di forma vivono nel foglio del rail, scopate a
  `.props-header:not(.props-header--view)`, e `_form-system.scss` e `info-improvements.scss`
  restano intoccati (R-RAIL-25).
- **R-RAIL-41** (2026-08-12) — **Il chip di firma si fa, e solo dove una firma esiste**: attribute,
  reference, parameter. Una classe, un package, un metamodello non hanno tipo né molteplicità, e per
  essi il chip non si rende affatto, senza placeholder e senza spazio riservato: è lo stesso criterio
  già ratificato da R-RAIL-1 C1.2 per l'identity block delle view legacy. Il conteggio «N features»
  che una classe mostra **non** è una firma e tiene il trattamento secondario piano, non il chip: la
  stessa forma per due significati diversi è il difetto che il redesign toglie, non uno che aggiunge.
  La clausola «niente chip di firma» di R-RAIL-16 cade qui, come R-RAIL-26 aveva annunciato.
- **R-RAIL-42** (2026-08-12) — **Una superficie nuova del rail si guarda nei due temi prima di
  dichiararla finita**, e i grade `--color-slate-*` sono palette grezza: non seguono il tema. La
  Focus bar era stata scritta nell'arco 1 con i valori del design, che è disegnato in light, e in
  dark rendeva un fondo quasi bianco sotto testo quasi bianco, più un chip con testo scuro su fondo
  scuro. Nessuno l'aveva vista perché nessuno l'aveva aperta in dark. È la stessa specie del debito
  già a registro sul caret `--color-slate-400`. Rimedio adottato: i valori del design restano per
  light, e un blocco `[data-theme="dark"]` corregge i soli colori che il tema deve cambiare.
  **Emendata da R-RAIL-44** (2026-08-13): la clausola dei due temi come condizione di chiusura è
  sospesa insieme al dark theme; la seconda metà, sui grade `--color-slate-*` come palette
  grezza, resta viva e non dipende dal tema.
- **R-RAIL-43** (2026-08-13) — **Un rinvio che ripete la motivazione di un rinvio precedente la
  rimette alla prova, oppure la cita come ereditata e non verificata.** Una stima di costo non
  provata non è una misura, e propagandola la fa degradare. Il caso che l'ha prodotta: i tre
  paragrafi mancanti del preambolo dell'archivio, rinviati due volte con la stessa motivazione,
  «ricostruirli è archeologia su git». Il ventunesimo lotto non l'ha riderivata, l'ha copiata dal
  ventesimo, e nel copiarla ne ha anche corrotto il conteggio, da tre paragrafi dovuti a quattro.
  Messa alla prova in `e88fca7df`, la motivazione è caduta in pieno: sono bastati due fatti già
  scritti nei due file — l'archivio è append-only in coda, quindi la posizione di una entry non
  cambia più una volta accodata, e ogni lotto registra nelle proprie note il conteggio dell'archivio
  prima e dopo — e **zero comandi git**. È la firma di un'affermazione ereditata: degrada mentre si
  propaga. Rapporto con le regole vicine, da non lasciare implicito: R-RAIL-28 copre le asserzioni
  di assenza e di presenza, R-RAIL-36 il caso in cui si misura l'elemento sbagliato; R-RAIL-43
  copre il terzo caso, **la stima mai eseguita**, e ha in più la parte sulla propagazione, che le
  altre due non hanno.
- **R-RAIL-44** (2026-08-13) — **Il dark theme è sospeso: i componenti nuovi non scrivono
  varianti dark.** Sospeso e non deprecato: i blocchi `[data-theme="dark"]` esistenti restano in
  albero e non si rimuovono (Regola 9), semplicemente non si manutengono e non si verificano. Il
  freeze era già vero a codice prima di essere scritto qui: `e682047a1` toglie il sottomenu Theme
  dalla navbar, quindi il dark non è raggiungibile dall'interfaccia e resta accessibile solo
  scrivendo `localStorage.theme`, che è quello che fa l'harness Playwright. **Emenda R-RAIL-42**:
  cade la clausola dei due temi come condizione di chiusura di una superficie nuova; sopravvive
  intatta la seconda metà, cioè che i grade `--color-slate-*` sono palette grezza e non seguono
  il tema. La ragione per cui la sospensione va scritta invece che sottintesa è che senza questa
  voce ogni prompt SCSS futuro continua ad aggiungere blocchi dark per abitudine, e il freeze si
  erode senza che nessuno lo decida. Nel solo foglio del rail i blocchi dark sono dieci, cinque
  dei quali sulle superfici dell'arco 3. Conseguenza operativa immediata: la definition of done
  dell'arco 3 si misura in **un tema**, light.
- **R-RAIL-45** (2026-08-13) — **Un ordine si legge nel dato, mai nella posizione, e un prompt
  che scrive una posizione come regola trasferisce un'ipotesi con l'autorità di un'istruzione.**
  Il caso che l'ha prodotta: il prompt di R-RAIL-44 dichiarava che l'ordine di
  `docs/claude-code-log.md` è newest-first e che le entry più vecchie stanno in fondo, e da lì
  ordinava di archiviare le quattro in coda. Era vero su HEAD, 23 entry, ed era falso nel
  working tree, 25, perché una sessione concorrente aveva appeso in fondo la entry delle 16:00,
  la più recente di tutte. Applicata a quell'albero, la regola avrebbe archiviato la entry più
  nuova, e **il danno sarebbe stato indistinguibile da un'esecuzione corretta**: nessun errore di
  gate, nessun conflitto, una rotazione dall'aspetto regolare. L'esecutore ha calcolato su HEAD e
  ha dichiarato l'inversione invece di assorbirla. Conseguenza operativa: una rotazione ordina
  per la data dell'intestazione, mai per posizione; e in un file che più sessioni scrivono, ogni
  affermazione della forma «X sta in cima, in fondo, in posizione N» è una misura con una data
  di scadenza, da riderivare al momento dell'esecuzione e non da ereditare dal prompt. Ne
  segue una regola su come si scrivono i prompt, non solo su come si eseguono: **si dà il
  criterio e si lascia che l'esecutore ne derivi le posizioni.** Nota sull'invariante vero del
  log, che il caso ha portato alla luce: il file è newest-first **per giorno**, non ordinato per
  timestamp, e dentro una giornata l'ordine non è monotono. Il criterio di rotazione è quindi la
  data, e il file **non va riordinato** oltre a ciò che rompe l'invariante di giorno. Rapporto
  con le regole vicine, da non lasciare implicito: è la stessa specie del conteggio preso su una
  finestra troncata (CLAUDE.md §5), perché in entrambi i casi si misura la disposizione al posto
  del contenuto; R-RAIL-28 copre le asserzioni di assenza e di presenza, R-RAIL-36 il caso in cui
  si misura l'elemento sbagliato, R-RAIL-43 la stima mai eseguita; questa copre **l'osservazione
  promossa a invariante**.

## Serie R-IRN — Collasso IR-nativo delle view (ratifiche 2026-08-13)

Base di evidenza: `docs/discovery/discovery_2026-08-13_view_creation_sites_ir_native.md`.

- **R-IRN-1** (2026-08-13) — **`ir` significa notazione autorata, non "view viva".**
  Invariante: ogni view autorata dall'utente nasce con `ir`. Le view di default create all'init
  dello store (23 per progetto, `redux/defaults/views.ts` + `redux/store.tsx`) restano senza
  `ir` per progetto, non per rinvio: rappresentano l'assenza di notazione e rendono astratto per
  costruzione (spec §10). Nessun seed su di esse, nessun uso di `migratedFrom` fuori dalla
  migration.
- **R-IRN-2** (2026-08-13) — **Legacy è definito da `irLegacyClassic`, non dall'assenza di
  `ir`.** La categoria legacy sono le view marcate dal flag (168 sul corpus misurato), chiusa
  per costruzione. `templateLegacy` in `ViewData.tsx` verrà retargetato sul flag (slice 3). La
  bonifica dei 60 progetti flaggati per errore pre-S1 è prerequisito o coda immediata della
  slice 3.
- **R-IRN-3** (2026-08-13) — **Emendamento spec §11.** Il placeholder a canvas per le view
  custom non riconosciute è superato: il degrado si segnala nella superficie di authoring (tab
  Template read-only con avviso, keyed sul flag), non sul canvas; l'elemento rende astratto come
  da §10, che è il fallback normativo e non uno stato di errore. Un badge nella lista view del
  tree è voce futura separata, non prescritta.
- **R-IRN-4** (2026-08-13) — **Seed IR alla creazione.** A1 (`newDefault`): `DClass` → vertex,
  `DAttribute` → row, `DReference` → edge; altri casi nessun seed. A2
  (`createViewInWorkbench`): class-like → vertex; `DModel`/`DPackage` nessun seed (graph e
  graphVertex non sono kind autorabili, R-6 2026-08-04). Il seed scrive anche il pin di identità
  dove il pointer è disponibile (`elementId` in A2, `forData.id` in A1) e non passa mai da
  `appliableToClasses` né da `resolveMetaclassNames`. A3 (blank dal «+»): la scelta del kind si
  sposta nel gesto di creazione; la metaclasse può restare wildcard e stringersi dopo.
- **R-IRN-5** (2026-08-13) — **Ritiro di `EnableIRPanel`** e della clausola legacy di
  `showIRTab`, con aggiornamento dell'avviso S2 (slice 2, dopo A3). Chiude anche il buco del
  gate `readOnly` sulle default di init.
- **R-IRN-6** (2026-08-13) — **Nessuna unificazione Source/Template.** Due superfici per due
  popolazioni disgiunte: Source (`<pre>` JSON, advanced-gated) per le view IR; Template
  read-only con avviso per le legacy. Nessun assorbimento.

- **R-IRN-7** (2026-08-16) — **Il canvas v1 non è raggiungibile dall'utente, e la migrazione a
  v2 è decisa.** Trascrizione a registro di quanto Alfonso ha dichiarato il 2026-08-16, e della
  «decisione B» del 2026-07-17 che finora viveva solo nei commenti del codice
  (`EditorSwitch.tsx:42,123`, `ModelTab.tsx:39`, `Toolbar.tsx:449`, `joiner/components.tsx:8`,
  `TemplateData.tsx:57`). Conseguenza operativa: una view priva di `ir` non ha interprete, quindi
  toccare le 20 view di default del viewpoint `Default` non può produrre regressioni visive. Il
  gradino `VP_Default` di `selectors.ts:557` e la cascata `viewScores`/`stackViews` restano
  vincolanti per il codice classico, non per il canvas. Base di evidenza:
  `docs/discovery/discovery_2026-08-16_2_le_23_view_di_default.md`.
- **R-IRN-8** (2026-08-16) — **Il viewpoint `Default Validation` non si semina più.** Le sue tre
  view erano un circuito chiuso (`error_*` prodotto e consumato solo da loro) e inerte per
  R-IRN-7. La regola lessicale del nome, che non aveva sostituto, è stata prima ri-ospitata come
  CHECK 12 del `ConformanceValidator` (`missing_name`, `invalid_name_format`, severità
  `warning`), poi il seed è stato rimosso da `Defaults.views`/`viewpoints` e da `store.tsx`. Le
  quattro costanti `Pointer_*` restano in `Defaults.ts` perché sono gli id che la migrazione dei
  salvataggi deve cercare: non vanno riusate. La migrazione condizionata (purga solo i record
  identici al seed, conserva quelli modificati dall'autore) è dovuta e non ancora scritta. Base
  di evidenza: `docs/discovery/discovery_2026-08-16_viewpoint_default_e_validation.md`.

## Serie R-SIM — Pannello di simulazione e attributi di stato (ratifiche 2026-08-17)

Base di evidenza: `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md` (con
addendum A1..A4). Memo: `docs/ratifiche/claude_2026-08-17_memo_ratifica_pannello_simulazione.md`.

- **R-SIM-1** (2026-08-17) — **Split degli strati.** Il run-state della simulazione (flag
  `active` sulle istanze M1) vive fuori da Redux, in un singleton di modulo stile
  `irCollapseState` (Set di elementId + version counter + `useSyncExternalStore`); mai nel bag
  `_state`, mai in azioni. Per costruzione: niente persistenza, niente undo, niente socket.
- **R-SIM-2** (2026-08-17) — **Configurazione nel bag del modello M2.** I ruoli di simulazione
  stanno in `data.state` del modello M2 con chiavi piatte prefissate `simNode`, `simInitial`,
  `simTerminal`, `simTransition`, `simOwnedTransitions`, `simNextState`; valori pointer, mai
  proxy. Vietato il sotto-oggetto annidato (R3 del report: la copia shallow fa scappare le
  mutazioni annidate dal macchinario).
- **R-SIM-3** (2026-08-17) — **Pannello fuori dall'IR.** Componente React `connect`-ato nella
  forma di `MetaData.tsx`, montato in editor-v2, mai nello scope dei template. Highlight dello
  stato attivo al wrapper del nodo via hook di versione (pattern problems overlay), senza toccare
  l'interprete né il dependency set.
- **R-SIM-4** (2026-08-17) — **Nessuna modifica al core per la v1.** `set_state`, reducer/history
  e canale collaborativo restano come sono. Il namespace `state` nelle espressioni IR e la
  simulazione condivisa sono estensioni future con ratifica dedicata: la prima emenda la spec §9
  e tocca `pathExpr.ts` + `irReadCtx.ts` + `irCrossDeps.ts` + `IRNodeContent.tsx`; la seconda
  passa da un canale socket dedicato, non dalle azioni di modello.
- **R-SIM-5** (2026-08-17) — **Reset e limiti noti.** Il singleton di run-state si azzera al
  cambio di progetto/modello. `isRelevantChangeCheck` non è una leva di opt-out dalla history:
  entro la finestra di 450ms fonde il delta nell'entry precedente (addendum A2); ogni futura
  esclusione per campo passa dal filtro del delta nel core, con ratifica.
- **R-SIM-6** (2026-08-17) — **`Control.tsx` si riscrive, la semantica si recupera.** Ruoli,
  reset/step/stop e l'invariante «la simulazione non tocca il modello» restano; il codice rinasce
  come pannello connesso. La spec del pannello fissa prima del codice il comportamento su
  deadlock (stato attivo senza transizioni uscenti) e il criterio di terminazione.

## Serie R-J — JjEL come linguaggio delle espressioni dell'IR (ratifiche 2026-08-18)

Base di evidenza: `docs/discovery/discovery_2026-08-14_jjel_come_linguaggio_espressioni_ir.md`
(con spike eseguibile). Memo: `docs/ratifiche/claude_2026-08-14_memo_ratifica_jjel_linguaggio_ir.md`,
proposto il 2026-08-14 e ratificato il 2026-08-18 con l'emendamento a R-J2 registrato qui sotto.
**Ratificare non è schedulare**: lo staging J1..J4 del memo resta non calendarizzato, e J2 (cuore
dell'interprete) non si apre senza go-ahead dedicato.

- **R-J1** (2026-08-18) — **JjEL è il linguaggio delle espressioni dell'IR.** Non si introduce un
  campo «espressione libera» accanto al `PathBuilder`: un'espressione che il compilatore non sa
  decomporre non produce `dependencySet` né `crossPaths`, quindi la view renderebbe una volta e
  poi resterebbe stale. JjEL non è codice arbitrario ma un AST camminabile, ed è la ragione per
  cui R-6 (2026-08-03) vieta JS e non vieta questo. Direzione dichiarata: il progetto **toglie**
  grammatiche invece di aggiungerne (il conto reale delle copie è sei, inclusa
  `utils/edgeExpressionEval.ts`, viva e divergente).
- **R-J2** (2026-08-18, **emendata in ratifica**) — **Profilo dichiarato, chiuso, allargabile per
  ratifica.** Il profilo v1 accetta `Identifier`, `MemberAccess`, `IndexAccess` con indice
  letterale intero, e gli identificatori nudi legati `parent` e `container`. Tutto il resto è
  rifiutato dal validatore con un messaggio che dice perché: `MethodCall`, `FunctionCall`,
  `ForAll`, `Exists`, `IfThenElse`, `NullCoalesce`, `Binary`, `Lambda`, `WithDo`, `IsType`,
  `InterpolatedString`, `ArrayLiteral`, `ObjectLiteral`. Motivo del profilo: i costrutti a
  dipendenza non limitata staticamente rendono il `dependencySet` non un insieme finito di nomi
  di feature ma «tutto il modello»; oggi PathExpr non può esprimere una dipendenza illimitata per
  costruzione, e quella garanzia con JjEL va ricomprata. **Emendamento**: il memo del 2026-08-14
  elencava il solo `parent`; il 2026-08-17 R-B13 ha spedito `container` come membro d'unione fuori
  grammatica (`EndpointExpr = PathExpr | 'container'`, verificato a codice in `irTypes.ts:220`
  e `:230`). Quando J2 atterra, quell'unione collassa dentro la grammatica delle espressioni e
  `container` resta legale **solo negli endpoint**, come oggi: il profilo lega l'identificatore,
  non lo rende universale (R-B13 tiene: il token non è legale in predicati, label, conditional,
  `TextSource`, `childFilter`).
- **R-J3** (2026-08-18) — **Il multi-hop legacy si migra, JjEL non si tocca.** `$a.value.$b.value`
  diventa `a.b`; `$a.values[0].$b.value` diventa `a[0].b`. Non si allarga `postfix()` ad accettare
  `DOLLAR_IDENT` dopo il punto: costerebbe una riga ma congelerebbe in un linguaggio condiviso
  (console, Jodie, JjTL) proprio la forma da far sparire, e legittimerebbe `$x.value` nella
  console, dove il contesto JjEL non lega i nomi col dollaro e il risultato sarebbe `null`
  silenzioso. Una sintassi accettata dal parser e morta nel valutatore è la peggiore delle tre.
- **R-J4** (2026-08-18) — **La retrocompatibilità vive nel walker dell'IR, non nel contesto.** Il
  walker normalizza `$f` + `.value` nello stesso step di `f`: ogni PathExpr single-hop persistito
  continua a compilare senza toccare né JjEL né il contesto di valutazione, e nessun binding di
  `$feature` va aggiunto da nessuna parte. Il ramo legacy del walker è temporaneo e dichiarato
  tale: muore quando la migrazione R-J3 ha riscritto i path persistiti.
- **R-J5** (2026-08-18) — **`ReadCtx` cresce di un metodo, e il contesto resta lazy.** `ReadCtx`
  acquisisce `getParent(elementId): string | null` sui due backend, con la semantica già scritta
  in `resolveParentHandle` (`eval.ts:766-784`): due salti sulla catena grezza `DObject.father` →
  `DValue` → `father` → `DObject`, `null` esplicito sulle radici; `irCrossDeps` acquisisce il ramo
  `parent` nella concretizzazione degli hop, accanto a `navigateRefHop`. Vincolo dominante: il
  contesto di valutazione dell'IR è un adattatore lazy sul `ReadCtx` e non passa **mai** da
  `buildEvalContext` (`eval.ts:93`), che materializza l'intero modello. Il costo non è la
  valutazione (misurato: 62-161 ns per valutazione JjEL contro 11-17 ns per la closure, circa
  0,25 ms per un canvas da 500 nodi a 5 espressioni): è il contesto. **Coordinamento**: R-B14
  riserva la superficie di `ReadCtx` all'estensione `state` (R-SIM-4). Le due estensioni crescono
  sullo stesso punto e si sequenziano fra loro; chi arriva secondo rilegge la superficie prima di
  scrivere.
- **R-J6** (2026-08-18) — **Diagnostica sempre accesa, mai la variante silenziosa.** L'IR usa
  **sempre** `jjelEvalWithDiagnostics` e porta i warning nel pannello di authoring, mai
  `jjelEval`. Motivo: `evaluateIdentifier` ritorna `null` in silenzio sugli identificatori non
  legati (`evaluator.ts:211-260`), mentre oggi `parsePathExpr` lancia e `validateIR` mostra il
  messaggio. Senza questa clausola, `nmae` invece di `name` smetterebbe di essere un errore
  visibile e diventerebbe una label vuota: è l'unica regressione seria che la migrazione può
  introdurre, ed è evitabile per costruzione.
- **R-J7** (2026-08-18, non nel memo del 14/8) — **Il profilo è l'unico punto di estensione della
  grammatica delle espressioni.** Una forma nuova non entra come membro d'unione accanto a
  `PathExpr` — `EndpointExpr` resta l'unico, e per R-J2 è transitorio — ma come identificatore
  legato o costrutto ammesso nel profilo, con ratifica propria. Vale in particolare per il
  namespace `state` (R-SIM-4), che si progetta su questo terreno e non come quarto membro
  d'unione. Origine: in un mese la stessa cucitura ha accumulato tre pressioni di estensione
  (`parent` previsto, `container` spedito, `state` in arrivo) su una grammatica progettata chiusa
  (`STEP_RE` di `pathExpr.ts`, che accetta solo `$feature | value | values | values[N]`).

## Serie R-MK — La marcatura come predicato dell'IR (ratifiche 2026-08-18)

Base di evidenza: `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md` (Q5b, Q8
R1..R9), più lettura diretta di `irTypes.ts:24-36`, `irCompile.ts:126-185`, `irReadCtx.ts:17-32`,
`pathExpr.ts:23`, `sim/simRunState.ts`. Memo:
`docs/ratifiche/claude_2026-08-18_memo_ratifica_marcatura_predicato_ir.md`. Chiude l'estensione
futura dichiarata da R-SIM-4, in forma diversa dalla sua lettura letterale: la sorgente non è il
bag `_state`, che non contiene affatto il run-state.

- **R-MK-1** (2026-08-18) — **La marcatura è un predicato, non un valore.** Si introduce
  `{ op: 'marked'; path?: PathExpr }` in `Predicate`, sul precedente esatto di `isKind`
  (`irTypes.ts:30`, compilato in `irCompile.ts:154-163`, con lo stesso `path?` opzionale per
  interrogare un altro elemento invece di quello corrente). **Non** un identificatore nudo
  `run.active`, **non** un allargamento di `STEP_RE`, **non** un membro d'unione accanto a
  `PathExpr`: la grammatica delle espressioni non si tocca, quindi R-J7 resta intatta e la feature
  non aspetta J2. Una marcatura è booleana per costruzione: non c'è valore da interpolare in una
  label. `marked` compone con `and`/`or`/`not` e si innesta in ogni `Conditional<T>` già nello
  schema (`fill`, `color`, `visible`, `marker`, `form`, `lineColor`, `lineWidth`, `lineStyle`,
  `fontWeight`, …).
- **R-MK-2** (2026-08-18) — **La sorgente è la marcatura effimera, mai il bag persistito.**
  `isMarked` legge il singleton di run-state (`sim/simRunState.ts`, R-SIM-1); `_state` resta
  invisibile alle espressioni IR. Tutti i rischi Q8 della discovery (R1 spazio piatto già
  affollato, R2 stringhe riavvolte in proxy L, R3 mutazioni annidate che bypassano il macchinario,
  R4 nessuna GC su un bag persistito e trasmesso, R6 pollution dell'undo) sono proprietà del bag,
  nessuno del singleton. Asimmetria di costo: esporre `_state` più avanti è una ratifica additiva;
  ritirarlo dopo che dei viewpoint salvati ci dipendono è una migrazione su view che per R-B9 non
  hanno VersionFixer.
- **R-MK-3** (2026-08-18) — **Nome neutro: `marked`, non `sim`.** Il costrutto è una marcatura,
  non un dettaglio di simulazione. Punto di estensione **riservato e non implementato**: un futuro
  `mark?: string` per marcature nominate, con default sull'unica marcatura di oggi; si dichiara
  perché la forma dello schema lo permetta senza rottura, non si scrive ora.
- **R-MK-4** (2026-08-18) — **`ReadCtx` cresce di `isMarked(elementId): boolean`.** Semantica
  totale (non marcato è `false`, mai `null`), lookup su Set nel singleton, contesto che resta lazy.
  **Coordinamento su tre ratifiche sullo stesso punto di crescita**: R-B14 riserva la superficie di
  `ReadCtx` «all'estensione `state` (R-SIM-4)» e questa serie *è* quell'estensione; R-J5 vuole
  aggiungerci `getParent`. Chi arriva secondo rilegge la superficie prima di scrivere.
  **Aggiornamento 2026-08-18 (post-discovery M1)**: la forma è l'**iniezione nel dispatcher**.
  `makeDrawReadCtx(idlookup, isMarked = () => false)`; `makeReadCtx` (`irReadCtxLproxy.ts`, già
  impuro: importa il joiner) importa `sim/simRunState` e inietta `isSimActive` in entrambi i
  backend. `irReadCtx.ts` resta a **zero import**; i 6 siti di chiamata di `makeReadCtx` non si
  toccano; il default `false` è confinato alle costruzioni dirette del draw nei test. Il metodo è
  obbligatorio sull'interfaccia: la deroga alla regola 11 (aggiunta non opzionale a interfaccia
  esportata, entrambi gli implementor in-repo aggiornati nello stesso diff) si dichiara nel Layer
  Impact Report, non si prende in silenzio.
- **R-MK-5** (2026-08-18) — **Il dependency set acquisisce UNA nozione di dipendenza non-feature:
  i canali dichiarati.** Insieme chiuso, allargabile per ratifica, due membri alla nascita: `mark`
  (version counter del singleton, `getSimVersion`) e `container` (il debito di R-B16, che **si
  chiude qui** invece di prendersi una ratifica propria). Due vincoli di forma: (1) i canali sono
  un insieme **separato** dal feature set, mai pseudo-feature prefissate — `irCrossDeps`
  (`irCrossDeps.ts:1-28`) concretizza il feature set in id di DValue e una `@mark` avvelenerebbe
  quella concretizzazione; operativamente `compilePredicate` riceve un secondo insieme accanto a
  `deps`; (2) **emendamento alla spec §9**: il dependency set ha due parti, feature e canali
  dichiarati, e la clausola restrittiva («NON DEVE re-renderizzare per feature fuori dal set») si
  conserva su entrambe.
  **Emendamento 2026-08-18 (post-discovery M1)**: la clausola operativa «`compilePredicate` riceve
  un secondo insieme accanto a `deps`» è sostituita dal **sink module-scoped** sul precedente
  esatto di `crossPathSink` (`irCompile.ts:47`, motivazione scritta nel commento :37-46: threading
  un secondo accumulatore «would touch every signature»). Il vincolo normativo resta pieno:
  insieme separato dal feature set, mai pseudo-feature prefissate. Due addenda dalla discovery
  (`docs/discovery/discovery_2026-08-18_m1_marcatura_predicato_interprete.md`, Q1-Q2): (1) il
  `dependencySet` delle view di nodo e di riga è un **dead write** (unica lettura applicativa:
  `useIRContainment.ts:87`, solo edge object-as-edge), quindi depositare `channels` non basta —
  l'effetto lo danno solo gli innesti in `useIRView` / `useIRRowView` / `useIRContainment`, e i
  test devono asserire il consumo, non il deposito; (2) il campo `channels` sui `Compiled*` nasce
  **opzionale**, per il precedente della 2a sulla regola 11.
- **R-MK-6** (2026-08-18) — **Granularità di v1 grossa e dichiarata.** Un bump di canale invalida
  ogni elemento che quel canale lo dichiara: uno step di simulazione re-renderizza tutti i nodi la
  cui view legge `marked`. È lo stesso ordine di grandezza dell'highlight di R-SIM-3, quindi non è
  una regressione ma il costo corrente reso autorabile. La granularità per elemento è un
  raffinamento futuro con ratifica propria, da aprire su una misura e non su un'intuizione.
- **R-MK-7** (2026-08-18) — **Fallback espliciti (spec §10).** Elemento senza marcatura: `false`,
  mai `undefined`. `path` che si esaurisce: `false`, con la ragione visibile nella diagnostica di
  authoring. Nessun default silenzioso; `marked` non lancia, e un IR malformato mostra l'errore in
  authoring come le altre regole di `validateIR`.
  **Interpretazione 2026-08-18 (post-discovery M1)**: un canale runtime→pannello non esiste
  (discovery M1, R4: le uniche diagnostiche del percorso IR sono la stringa statica di
  `validateIR` e i `console.warn` one-shot di `irCrossDeps`). «Ragione visibile nella diagnostica
  di authoring» si legge quindi: parte **statica** (path malformato o fuori profilo) in
  `validateIR`; esaurimento a **runtime** con warn one-shot sul modello di
  `warnUnresolvedCrossDeps` (`irCrossDeps.ts:176-190`). Il canale verso il pannello è una fetta a
  sé, non un requisito di M1.
- **R-MK-8** (2026-08-18) — **L'highlight di R-SIM-3 non si rimuove ora.** La classe `sim-active`
  su `ObjectNode` resta: è il default per i viewpoint che non autorano `marked`. Il ritiro è una
  fetta separata con ratifica propria, da aprire solo quando `marked` ha un consumatore reale
  (comportamento committato e verificato non si degrada, CLAUDE.md regola 3).
- **R-MK-9** (2026-08-18) — **Staging e corsia.** M1 (interprete: `ReadCtx.isMarked` sui due
  backend, `{op:'marked'}` in `irTypes`/`irCompile`, insieme dei canali, emendamento §9, test,
  **nessuna UI**) → M2 (`PredicateBuilder`: voce «È marcato» con `path` opzionale e diagnostica) →
  M3 (`container` migra sul canale e chiude il debito R-B16). **M2 dopo M1, non negoziabile**:
  un'UI che autora un operatore non ancora compilato salva IR che non rende, e per R-B9 le view IR
  non hanno VersionFixer per ripulirlo. M1 e M3 sono in critical zone (§3.1: `editor-v2/viewpoint/
  ir/` per M1, `useJjomSync`/`useM1ReferenceEdges` per M3): corsia completa, two-phase con report
  in `docs/discovery/`, **Layer Impact Report obbligatorio prima del diff**, effort xhigh.
- **R-MK-10** (2026-08-18) — **`marked.path` risolve con `getRef`, single-hop in v1; `isKind` non
  si tocca.** Il ramo `path` di `isKind` legge il terminale con `ctx.getValue`, che sul backend di
  produzione (lproxy) restituisce un proxy L e non un pointer (`LModelElement.tsx:7308`): il
  predicato torna sempre `false` (discovery M1, Q7/R3; tracciato a codice, non ancora eseguito
  contro lproxy). `marked.path` **non eredita la forma**: risolve con `ctx.getRef(id, feature,
  take)` (semantica draw su entrambi i backend, `null` sui casi di esaurimento → il fallback di
  R-MK-7 è soddisfatto per costruzione) ed è ristretto a **un solo hop su reference** in v1 —
  multi-hop rifiutato a compile con messaggio, perché non esiste un modo di compilazione
  «PathExpr → element id» e costruirlo è fuori M1. La marcatura del target non richiede
  `crossPaths`: la porta il canale (globale); l'identità del target la porta la feature in
  `deps`. Il difetto di `isKind` è registrato in `docs/TECH-DEBT.md`; la micro-slice di
  convergenza (anche `isKind` su `getRef`) parte solo dopo la verifica in console di Alfonso che
  conferma il difetto sul backend reale. Due `path?` con semantiche diverse a parità di aspetto
  sono una divergenza temporanea e dichiarata, non un design.
- **R-MK-11** (2026-08-18) — **`validateIR` acquisisce la regola del vocabolario chiuso di
  `Predicate.op`.** Camminata ricorsiva dei predicati (inclusi `and`/`or`/`not` annidati e i
  `Conditional`): un `op` fuori dal vocabolario produce un messaggio leggibile
  (`[ir] unknown predicate operator "<op>"` con il contesto), al posto del `TypeError` nudo del
  ramo `default` di `compilePredicate` che oggi butta via l'intera view al render
  (`irResolveCore.ts:198`) e congela l'authoring (commit gated su `v.ok`,
  `VertexAuthoringPanel.tsx:141`). Seconda regola authoring-time dopo quella degli endpoint,
  coerente con R-B9-bis. Il ramo `default` in sé resta com'è (rischio R2 della discovery,
  registrato): chiuderlo è fuori M1.

## Superate

- **D3** (2026-07-26, routing congelato in v1) — superata da E-route il 2026-08-06.
