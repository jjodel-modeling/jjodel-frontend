## Contesto Progetto Jjodel

## Ultimo aggiornamento

**2026-08-10 (sera, sessione Cowork su Opus). Slice C chiusa e pushata. Arco del rail
destro aperto e ratificato per intero: R-RAIL-1..R-RAIL-13. Fase 0 e C9.1 eseguiti. Manca
solo il prompt di implementazione dell'arco 1.**

Questo file è stato riconsolidato contro `origin/alfonso-frontend-jjtl` con un fetch della
sera del 10/8, non contro la memoria delle sessioni precedenti. Dove un fatto non è
verificabile da origin è scritto esplicitamente.

## Stato verificato su origin (fetch 2026-08-10 sera)

Tip: **`7c373df`** (10/8, 17:12), "Add documentation for rail redesign" (i due file di
design in `docs/redesign/rail/`, commit diretto di Alfonso). Sotto: `6e42de7` (docs della
Fase 0), `569f787` (rotazione, nono lotto), i cinque commit sorgente di Slice C
(`f4e72f8`, `a801403`, `47603c6`, `473813c`, `6b8e91d`), poi `abc0182` e la coda della
notte già nota (`ab90ed0` fix `allPossibleParentViews`, `03363ce` e `b0292b8` fusione spec
v1.2).

Non su origin: il solo **`4d215ff0e`** (C9.1, token entity).

## Slice C (serie U): chiusa e pushata

- **Verdetto di Alfonso: Q7 superato su tutti e tre i commit.** Il Commit 3 (C-2 / U-7,
  doppie label dei toggle) verificato a video su toggle Applies to, liste label, badge e
  compartment; casi informativi e label uniche intatti.
- Su origin i cinque commit sorgente più la rotazione `569f787`, verificati da clone.

## Punto 2 (tree dei viewpoint): CHIUSO come non riproducibile (10/8 sera)

Lo snippet discriminante è stato eseguito da Alfonso sulla console del progetto vivo. **Ha
falsificato la diagnosi**, non l'ha confermata, e la verifica a video conferma: selezionare
un viewpoint nel tree si comporta correttamente.

Cosa dice il dato:

- Il progetto (`Pointer1786196936796_USER_85`) ha **due viewpoint reali**, non uno:
  `Pointer1786229699343_USER_185` = «Class Diagram» (8/8 22:54) e
  `Pointer1786367389512_USER_222` = «ggg» (10/8 13:09), più i due default statici
  `Pointer_ViewPointDefault` e `Pointer_ViewPointValidation`. Nomi distinti: non sono due
  materializzazioni dello stesso oggetto.
- `vpDalGetterL` è **esattamente** `Defaults.viewpoints` più il campo D, verbatim, come
  prescrive `get_viewpoints` (`joiner/classes.ts:3323`). Nessuna lista memoizzata, nessuna
  istanza stantia: la seconda ipotesi è esclusa strutturalmente e la prima non ha oggetto,
  perché non c'è nulla da riconciliare.
- Nello store ci sono quattro `DViewPoint` in tutto, tutti con nome distinto.
- Ipotesi aggiuntiva testata e scartata: il tree monta i viewpoint **inclusi i due
  default**, quindi un click risolto per posizione su una lista filtrata avrebbe scritto il
  viewpoint sbagliato con uno scarto di due. Non è così: `handleClick`
  (`TreeViewContent.tsx:1328-1340`) scrive `vp.id` catturato nella closure della riga, mai
  un indice.

**Perché la diagnosi era sbagliata**: poggiava sulla premessa «il progetto ha un solo
viewpoint», falsa già al momento dell'osservazione (`ggg` era stato creato alle 13:09, il
checkpoint è delle 13:34). Con due viewpoint in campo, «stesso viewpoint materializzato due
volte» era la lettura di due oggetti diversi.

**Residuo non spiegato**: l'id `Pointer1786285503592_USER_185`, dato dal checkpoint come
«prima lettura», non esiste nello stato attuale. Non è ricostruibile se sia stato
riassorbito da un reload o se l'osservazione fosse su uno stato diverso.

**Cosa riaprirebbe la voce**: il ripresentarsi del sintomo a video. In quel caso serve
catturare, nello stesso istante, il sintomo osservato e l'output dello snippet
(`claude/2026-08-10_memo_ratifica_2_rail_fase0.md` non lo contiene; lo snippet è nella
cronologia della sessione del 10/8 sera). Chiudere per non riproducibilità non è chiudere
per fix: nessun codice è stato toccato.

## Arco rail destro (nuovo, aperto il 10/8)

Redesign del rail destro del project editor: fusione delle due card flottanti (PROPERTIES
e TREE VIEW) in un rail unico e continuo. Origine: documento di claude design, due file
(`README.md` handoff e `Jodel Side Panel.dc.html` mock interattivo) che **oggi esistono
solo come upload di chat**. Destinazione decisa: `docs/redesign/rail/`, non `docs/design/`
(che non esiste; `docs/redesign/` sì, e ospita già `JJODEL-UI-MASTER-SPEC.md`).

**Ratifiche del 10/8** (memo `claude/2026-08-10_memo_ratifica_arco_rail.md`), tutte
accettate da Alfonso:

- **R-RAIL-1**: il rail è un guscio e l'inspector è uno slot polimorfo. L'arco 1 scrive un
  solo renderer, quello dell'elemento di metamodello; i pannelli di view authoring entrano
  nello stesso slot senza redesign interno (C1.1). L'identity block deve essere calcolabile
  anche per una view, altrimenti è opzionale, non inventato (C1.2).
- **R-RAIL-2**: U-2 è superato solo nella parte posizionale del breadcrumb, non
  contraddetto. Il breadcrumb di "Applies to" è semantica della view e sopravvive. Da
  scrivere a verbale in `docs/decisions.md` (arco U) all'apertura dell'implementazione.
- **R-RAIL-3**: arco 1 = solo preset `2a`. Niente gear e niente popover (C3.1); componente
  parametrico ma senza rami morti, un tipo `RailPreset` e una costante `PRESET_2A` (C3.2);
  il segmented Basic/Advanced **resta nella top bar** (C3.3).
- **R-RAIL-4**: si consumano `--color-selection-bg` e `--color-selection-bar`, mai
  letterali. Nessuna unificazione col sky. La discrepanza fra i tre cyan resta com'è e
  diventa voce di design system.
- **R-RAIL-5**: si consumano `var(--font-sans)` e `var(--font-mono)`, mai nomi di famiglia
  (C5.1). **C5.2 annullato**: i font sono caricati da `_typography.scss:81,84` con due
  `@import` da Google Fonts, quindi non esiste alcuna voce "dichiarati ma non caricati". La
  definition of done si verifica col font che rende davvero (C5.3), e rende IBM Plex Mono.

**Fase 0 eseguita** (prompt `claude/2026-08-10_1630_prompt_rail_fase0.md`, nome canonico
`2026-08-10 16:30`). Report in `docs/discovery/discovery_2026-08-10_rail_fase0.md`, HEAD
`569f78735`, working tree pulito. Esiti principali: i due sistemi di token si sovrappongono
su 27 nomi soltanto, di cui **13 divergenti** (il resto è deterministico); 35 valori del
design su 56 hanno un token, 14 sono `snap`, 7 sono `nuovo`; il portale di `ViewData` è
**già ritirato** da Slice C; la barra di selezione che il design vuole era stata **rimossa
apposta** il 28/7 e il badge lettera **sostituito da glifi** lo stesso giorno.

**Secondo giro di ratifiche: fatto.** R-RAIL-6..R-RAIL-13 più C7.1 e C9.1, nel memo
`claude/2026-08-10_memo_ratifica_2_rail_fase0.md`, che risponde alle 11 domande aperte del
report. Tutte accettate. **C9.1 eseguito** (commit `4d215ff0e`). Resta da scrivere il
prompt di implementazione dell'arco 1: è il documento più lungo della serie e il primo
lavoro della prossima sessione. Deve portarsi dietro la lista nera dei 13 nomi di token, la
tabella di mapping di D3, gli emendamenti al design (niente barra, glifi, snap sempre) e la
nota U-2 da scrivere in `docs/decisions.md`.

**Collisione con Slice C: rientrata.** Il D1 del report mostra che Slice C ha già toccato
tutto ciò che doveva, portale di `ViewData` incluso, e che il working tree è pulito. Non
c'è un ordine da decidere fra due archi in volo: c'è una coda di sei commit locali sotto
cui il rail si innesta. Unico rischio residuo, operativo: se Slice C venisse riscritta
(rebase, amend, squash) dopo l'inizio dell'arco, i commit del rail andrebbero ribasati.

## Coda (per Alfonso)

1. **Ratificare R-RAIL-6..R-RAIL-13** (memo del secondo giro), poi commit dei token entity
   (C9.1) e prompt di implementazione dell'arco 1.
2. **Rotazione del log** (22 entry attive, soglia 20) e **push**: ahead c'è il solo
   `4d215ff0e` (C9.1), più il commit di rotazione quando lo fai.
3. Facoltativi invariati: prima sync GitHub Issues col PAT dal Mac; amendment q4b nella
   chat del cruscotto.

Chiuse in serata: push di Slice C (fatto, verificato su origin), punto 2 (non
riproducibile), file di design in `docs/redesign/rail/` (fatto da Alfonso). Nota sul mock:
fa riferimento a nove fogli di stile in `_ds/jjodel-design-system-<uuid>/` che non sono nel
repo, quindi aperto in un browser rende senza il suo design system. Il danno è limitato,
il mock ha tutti i valori inline e zero `var()`.

## Voci chiuse (riepilogo)

- Voci 3, 4, 5, 6, irValidate, R-B9-bis, rotazioni log, U-2 / Slice D, nota Select:
  chiuse e pushate (dettaglio nei checkpoint del 9/8).
- **Slice B2 (U-5 stepper)**: chiusa e pushata l'8/8 (`4e9255462`).
- **Slice A3-bis (token sky)**: chiusa (`4701b73`). Il glifo oggi non è raggiungibile a
  video (nessun consumatore passa `icon`); debito residuo = migrazione dei letterali.
- **Fix `allPossibleParentViews`**: chiuso e pushato (`ab90ed0`, verdetto smoke in
  `3dc2774`).
- **Fusione spec v1.2 (R-FS1..R-FS7)**: chiusa e pushata (`03363ce`, `b0292b8`).
- **Slice C (U-3 + U-7 + ritiro portale)**: chiusa, Q7 superato su tutti e tre i commit,
  **pushata** il 10/8 sera. Su origin i cinque commit sorgente (`6b8e91d`, `473813c`,
  `47603c6`, `a801403`, `f4e72f8`) più la rotazione `569f787`, verificati da clone.
- **Punto 2 (tree dei viewpoint)**: chiuso come non riproducibile, nessun codice toccato.
- **C9.1 (coppie `--color-entity-*` da `entityMeta`)**: chiuso, commit `4d215ff0e`, non
  ancora pushato. Origin è a `7c373df`.
- **Archivio KB nel repo**: `28db0a3` + `5f9c969`.
- **Cruscotto**: artefatto `jjodel-tracciabilita`, chiave `jjodel-trace-v17`, seed
  `p20260810a`, 28 voci. Il sorgente jsx nel KB resta v16, delta in
  `claude/tracciabilita_delta_v17.md`.

## Backlog

- **Migrazione dei letterali `#0ea5e9` verso `--color-sky-500`** (DS-10, bassa): le
  occorrenze sono **257**, non ~197 come diceva la versione precedente di questo file. Da
  riproiettare sulle tre superfici vive.
- **Unificazione dei tre cyan** (nuova, da R-RAIL-4): `#06b6d4` è
  `--color-canvas-accent` (selezione e focus sul canvas), `#0891b2` è
  `--color-selection-bar` (selezione nei pannelli), `#0ea5e9` è `--color-sky-500` (accent
  interattivo DS). Oggi pannello e canvas non sono sincronizzati. Fuori dall'arco del rail.
- **Cascata dei token theme-dipendente** (nuova, alta, da R-RAIL-6): i due sistemi
  definiscono 13 nomi con valori diversi (`--color-bg-primary/secondary`,
  `--color-text-secondary/tertiary`, i tre `--color-border-*`, i quattro `--shadow-*`,
  `--transition-fast/slow`), e quale valore vince dipende da `localStorage.theme`: senza
  attributo `data-theme` vince `tokens.css`, con `data-theme="light"` vince il sistema
  SCSS. La palette dell'applicazione cambia in base a uno stato utente non dichiarato.
- **Due sistemi di modalità non sincronizzati** (nuova, alta, da R-RAIL-13): Redux
  `state.advanced` e l'hook `useInterfaceMode` convivono dentro `Info.tsx` a nove righe di
  distanza (`:96` e `:105`), e `INTERFACE_MODE_CHANGE` non ha ascoltatori che
  risincronizzino Redux.
- **`TreeViewSidebar.tsx` è codice morto** (nuova, media): 249 righe, nessun file fuori
  dalla sua cartella lo importa. Con esso è morta la chiave `jjodel_treeview_visible`.
- **Tre palette entity divergenti** (nuova, media): `badgeBg`/`badgeText` di `entityMeta`,
  il campo `color` dello stesso file, e le `$color-*` locali di `tree-view-sidebar.scss`.
  Cinque tipi su sette hanno un `color` di famiglia cromatica diversa dal proprio badge.
- **Self-hosting dei font** (nuova, bassa): il TODO a `_typography.scss:74-78` lo propone
  per prestazioni, conformità privacy e uso offline. L'`@import` da Google Fonts espone
  l'IP dell'utente a ogni caricamento. Voce distinta e minore rispetto a quella sbagliata
  che questo file conteneva prima (vedi Regola di processo).
- **Amendment q4b**: da verificare nella chat del cruscotto.
- **Prima sync GitHub Issues col PAT** (dal Mac).
- **Flattening `editors/viewpoint/`**: deferred.
- **Undo dei valori di modello** (alta, congelato fuori archi): invariato.
- **Commenti italiani D9** (bassa): invariato.
- **Naming dei prompt con HH:mm**: convenzione rispettata dal prompt del rail
  (`2026-08-10 16:30`). I prompt del 10/8 notte restano senza orario: `check:docs`
  rifiuterà futuri `Corregge` che vi puntino.

## Fronti congelati e attivi

- **Arco rail destro: ATTIVO**, appena aperto. Ratifiche fatte, Fase 0 da lanciare.
- **Serie U / skin B4: quasi chiuso.** Slice C è l'ultima slice ed è chiusa in locale.
  Resta la coda fuori scope dichiarata: NODE, `allowConditional` in Basic, Q-A2 dark mode,
  indipendenza Composition/Aggregation, gating Extends. Attenzione: la coda NODE si
  interseca con l'arco del rail, che sposta `NODE` dentro l'inspector come sezione
  Appearance.
- **Design system di piattaforma**: DS-1..DS-10 ratificate, slice 0 chiusa. Si aggiungono i
  tre debiti nuovi qui sopra (cyan, font, raggi/ombre).
- **Code dell'arco B, fuori archi**: invariati.

## Regola di processo

Invariata: ogni voce dichiarata chiusa riporta la verifica diretta (origin se pushata,
`git log` locale se in locale).

Due lezioni aggiunte:

- **Questo file va riconsolidato prima di generare prompt di ripresa**, non dopo. I tre
  context drift della serie nascono tutti da specifiche stantie, non da esecuzioni
  sbagliate.
- **Le claim di un documento di design esterno si verificano prima di ratificare.** In
  questa sessione due questioni su cinque hanno cambiato natura dopo un clone shallow di
  origin, a partire dal cyan di selezione, che era già un token con tanto di TODO che
  chiedeva proprio questa estensione.
- **Una diagnosi eredita la premessa da cui parte.** Il punto 2 è stato inseguito per due
  sessioni su «il progetto ha un solo viewpoint», premessa mai verificata e falsa già al
  momento in cui fu scritta. Tutto il ragionamento a valle (stesso viewpoint materializzato
  due volte, id stantio, riconciliazione mancante al load) era corretto **dato** quel
  presupposto, e sbagliato senza. Prima di costruire ipotesi su un'anomalia, contare gli
  oggetti.
- **Chi conta i commit ahead fetcha prima.** Il report di C9.1 dichiarava «otto commit
  locali non pushati»: erano uno. Il ref `origin/alfonso-frontend-jjtl` di Claude Code era
  fermo ad `abc0182`, prima del push di Slice C, quindi il conteggio includeva sei commit
  già in remoto più i due nuovi. È la quarta volta che la serie inciampa su un riferimento
  stantio. Ogni dichiarazione di stato rispetto a origin va preceduta da `git fetch`.
- **Una grep troncata non è una verifica.** La versione precedente di questo file
  dichiarava Inter e IBM Plex Mono "non caricate". È falso: `_typography.scss:81,84` le
  carica entrambe da Google Fonts con due `@import url(...)`. L'errore nasce da una grep
  chiusa con `head -20` le cui prime venti righe erano tutte occorrenze di `font-family`:
  una conclusione tratta da una lista incompleta senza controllare che fosse completa. È
  finito in tre documenti prima che la Fase 0 lo smontasse. Quando una grep serve a
  concludere che qualcosa **non** esiste, va letta intera o contata.

## Info strutturali scoperte

Aggiunte del 10/8 pomeriggio, verificate su `abc0182`:

- Il codice sta sotto **`frontend/`** nella root del repo, non `src/`. Path corretto:
  `frontend/src/...`.
- **Due sistemi di token convivono**: `frontend/src/styles/tokens/` (11 file SCSS, ~1500
  righe) e `frontend/src/styles/tokens.css` (293 righe, 80 custom property `--color-*`).
  Quale dei due debba consumare un componente nuovo è domanda aperta della Fase 0 (D2).
- `entityMeta.ts` sta in `frontend/src/common/`, non sotto `styles/`.
- **Token di selezione già esistenti**: `_colors-light.scss:352-353`,
  `--color-selection-bg: #e0f7fa` e `--color-selection-bar: #0891b2`, col TODO a
  `:350-351` che dice "usati solo da `.tree-row--selected`, estendere alle altre selezioni
  in un task futuro". Il rail è quel task futuro.
- **`#0891B2` ha due ruoli**: è `--color-selection-bar` ed è anche
  `entityMeta.reference.badgeText` (`entityMeta.ts:161`). Su una riga Reference selezionata
  barra di selezione e testo del badge coincidono di colore.
- **Anagrafica del rail attuale**: `PropertiesWithTreeView.tsx` (648 righe) +
  `properties-with-tree-view.scss` (1375 righe), montato una volta sola in
  `Dashboard.tsx:627` come `<PropertiesWithTreeView mode='floating'/>`. Card PROPERTIES:
  header `:449-459` (lo slot del portale è `:459`), body `:477` con `<Info>` più la sezione
  NODE resa solo in advanced (contiene `<NodeEditor/>`). Card TREE VIEW: header `:548`,
  body `:568` con `<TreeViewContent/>`.
- **Pannelli di view authoring**: `editor-v2/viewpoint/authoring/` (Vertex, Row, Edge,
  EnableIR), importati e montati da `editors/views/ViewData.tsx:28-30`, che porta le
  proprie azioni nell'header via portale (`:203`, `:223`).
- Il toggle Basic/Advanced è di `ModeSystem/ModeToggle.tsx`; `PropertiesWithTreeView` ne è
  già consumatore (la sezione NODE è gated su `advanced`).
- Il gate `check:docs` è `frontend/scripts/gates/check-docs.ts` e valida il formato delle
  entry di log: intestazione `## YYYY-MM-DD — <tipo>: ...`, campi obbligatori, e
  `**Prompt document name**: YYYY-MM-DD HH:mm` come ancora di chiusura. **I trattini lunghi
  di quel formato sono validati dal gate**: non vanno "corretti" applicando le regole di
  scrittura dei documenti.

Invariate le info delle sessioni precedenti:

- Il bridge Cowork sul working tree del Mac non può fare `unlink`: ogni comando git lascia
  lock file stale, da spostare via `mv` in `.git/_to_delete/` prima del comando successivo.
  A fine sessione della notte: zero lock residui.
- Sul Mac esiste l'untracked pre-esistente `.claude/settings.local.json`, non toccato.
- Il sandbox cloud proxya l'API GitHub e nega i repo non abilitati alla sessione, ma **il
  clone git anonimo funziona**: è il modo per verificare origin senza il Mac.
- typecheck su Linux dà 14 errori (baseline sparsa); i 19 di casing sono solo su FS
  case-insensitive. Baseline Mac resta 33.
- Invariate: vite port 3000, `set_father`, `readViewParenting`, `jj-context-bar`, HTML
  artefatto minificato con escape.
