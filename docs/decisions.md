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

## Superate

- **D3** (2026-07-26, routing congelato in v1) — superata da E-route il 2026-08-06.
