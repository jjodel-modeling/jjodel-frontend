# Kickoff prossima sessione — partizione dei tab IR

Incolla questo come primo messaggio della chat nuova.

---

Riprendiamo l'arco della partizione dei tab per le view IR-authored. Leggi in quest'ordine e fermati: `claude/sessione_2026-08-05.md`, `claude/ratifiche_2026-08-05_emendamento_r1_eobj.md`, `claude/ratifiche_2026-08-05_panel_state_lifting.md`, `claude/ratifiche_2026-08-04_tab_partizione.md`. Il backlog ordinato è `claude/backlog_2026-08-04_vista_ordinata.md`, già emendato in place. Non serve altro per partire.

## Stato

La barra per una view IR-authored è ratificata: `Applies to · Structure · Appearance · Text · Source`, e **sostituisce** la barra di `ViewData` invece di annidarsi. Nessuna implementazione è iniziata. Il working tree ha WIP non committato su `EdgeAuthoringPanel.tsx` e `edgeAuthoring.test.ts`, sbloccato ma con quattro condizioni da soddisfare.

## Prima cosa da fare: chiudere la decisione aperta

Il pin di identità della metaclasse (R-1 del 04-08) entra nell'IR come campo additivo, e questo è ratificato. **Non è ratificata** la riga che serve a renderlo innocuo: `isMigratedDefaultView` (`irDefaults.ts:128-145`) decide la delega al rendering nativo confrontando `irHash(canonicalize(ir meno migratedFrom))` con l'hash di `defaultObjectViewIR()`, quindi scrivere il pin su una view migrata ne cambia l'hash e la fa uscire dalla delega. Su un progetto migrato è quasi tutto il parco view.

La proposta sul tavolo, argomentata in chat il 04-08 e non ancora accettata: **`canonicalize` esclude il pin**, come già fa con `migratedFrom`. L'alternativa scartata era scrivere il pin solo su azione esplicita dell'autore, che lascerebbe la mitigazione dell'omonimia assente proprio sulle view migrate che nessuno ha mai toccato. Chiudi questa e 1.3 parte.

## Ordine di atterraggio, già deciso

1. **2.1 allargata più il WIP, insieme**, due commit consecutivi: prima l'estrazione dei helper dei capi in un modulo puro importabile (inclusa la metà di stato locale, che è dove vive il comportamento nuovo e oggi ha copertura zero), poi la semantica del WIP con le condizioni C-1..C-4 dell'emendamento a R-1. I due lavori toccano gli stessi due file: si uniscono, non si alternano.
2. **Misura residua sul CSS**: a cosa risolve il css di default di una view (`classes.ts:1125-1170`, già annidato e già pieno di `!important`) quando il prefisso è `body`. Un minuto sull'harness di `709004102`. Decide la taglia di 3.6.
3. **3.6**, il rilevamento del conflitto `cssIsGlobal`. Precede 1.6 per ratifica.
4. **1.3** (pin) e **1.4** (rimozione di `Applicable to`), in commit separati e in quest'ordine.
5. **1.5**, la partizione della barra sulla strada B.
6. **1.6**, rimozione dei tab morti, dopo 3.6.

## Vincoli da non violare

- Barra sulla **strada B**: tutti i tab montati, inattivi nascosti con `display: none` e mai `visibility: hidden` o `opacity: 0`. Key di remount a livello di pannello. Niente `autoFocus`, `focus()`, `scrollIntoView` nei sotto-editor: è la premessa che rende B sicura.
- Un solo draft e un solo debounce a livello di pannello. La validazione vive nel pannello, i tab la riflettono.
- Niente badge di errore per-tab in v1: striscia di pannello sempre visibile più i tre messaggi cross-tab che nominano il tab nel testo.
- `validateIR` resta l'unico gate del commit, e la divergenza dei capi non va mai instradata lì: è una condizione di UI, non dell'IR.
- Le classi SCSS `.view-editor-tab*` non si rinominano. Nomi dei tab in inglese; la traduzione delle stringhe italiane dei pannelli è una pass separata.

## Cosa non rifare

Queste sono misurate, non ipotizzate, e ripeterle brucia contesto senza aggiungere niente:

- Il canale CSS: il vettore è il **testo** (regola annidata con `!important`), non i nomi delle palette. Le variabili sono schermate da `.editor-v2.theme-*`; passa il solo `--color-accent` da `:root`.
- Il costo DOM della strada B: ~645 nodi nel caso peggiore, cioè quanto si monta già oggi.
- `template`, `events`, `options` non sono letti per nessuna view; `getAppliedViewsNew` non ha chiamanti.
- Il resolver IR filtra sul solo `d.viewpoint`; `father`, `subViews` e `appliableToClasses` non sono letti da nessuna parte in `editor-v2/viewpoint/`.

## Note di processo

- Prima di scrivere un prompt di discovery, chiedimi lo stato di `docs/discovery/`: la chat non vede il working tree, e il 05-08 abbiamo scritto un prompt per un lavoro già fatto.
- Ogni prompt di discovery deve dichiarare cosa fare se il report esiste già: leggerlo per intero e produrre solo il delta in coda.
- Il working tree non è pulito. Ogni `git add` è per file espliciti, mai `git add .`.

## Todo che non appartengono a quest'arco

Bug dei due Select su `father` (`InfoData.tsx:306,323`, `ViewProperties.tsx:121-133`); bug di risoluzione di `check:docs` (`check-docs.ts:268` contro `:313`); regola anti-drift da aggiungere a `CLAUDE.md`; coordinate di campo in `validateIR`; graphVertex con la sua sezione containment; allineamento di `claude/mappa_sintassi_concreta.md`, stale sulla rehydration.
