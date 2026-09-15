# Prompt Claude Code: voce 4 della coda, la barra 1.5 su strada B (partizione a cinque tab per le view IR)

**Documento prompt**: 2026-08-06 12:27
**Tipo**: implementazione (Fase 2 dell'arco A, slice 1.5). Le discovery di riferimento sono già agli atti nel repo: tab map v2 (committata in `79a0d90c2`) e 1.2 sul panel state lifting (`f83252d06` più addendum `a80d282a5`). Niente nuova discovery: Fase 0 di re-ancoraggio breve con report, poi implementazione, sul modello del prompt E-route.
**Corsia**: completa (RC-3 in `docs/decisions.md`): il task supera i 3 file e riorganizza il render dei pannelli dei rami verificati E-ref/E-obj. Gate pieni, effort xhigh.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Ordine**: eseguire DOPO la voce 2 della coda e i due micro-commit (normalizzazione del log; `chore: regenerate AGENTS.md`). Le guardie sotto verificano il verificabile.
**Verifica visiva**: nessuna in questo task; rinviata all'hard stop unico della voce 5. Questo prompt consegna la checklist, non la esegue. Il commit parte a gate verdi.

## Prima di iniziare

1. Leggere `CLAUDE.md` nella root. In caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/decisions.md`: contiene i vincoli operativi attivi, che questo prompt cita per id. Vincolanti qui soprattutto **R-A (2026-08-05)** e **R-B (2026-08-05)**; sullo sfondo R-D e C-1..C-4 (2026-08-05), che questo task non deve disturbare. Come da intestazione di quel file, le sigle si citano con la data: la serie R-B9/R-B10/R-B12 del 2026-08-03 è un'altra serie.
3. Leggere `docs/claude-code-log.md` per il contesto recente.
4. Guardie git, da riportare nel report della Fase 0: `git log --oneline -10` e `git status --short`. **STOP e segnala** se una qualsiasi è vera:
   - `docs/claude-code-log.md`, `CLAUDE.md` o `.gitignore` risultano modificati e non committati: micro-commit della normalizzazione del log o voce 2 non atterrati, e un `git add` da qui trascinerebbe modifiche altrui;
   - un file bersaglio della Fase 1 è sporco con WIP non di questa slice;
   - il commit `docs: normalize Causa in two 2026-08-03 log entries` non compare nel log E il file di log è pulito: la normalizzazione è andata persa, anomalia da riportare prima di scrivere qualsiasi entry.
5. Nessuno stash, checkout o reset. Ogni `git add` è per file espliciti, mai `git add .`.

## CONTESTO (autocontenuto)

Oggi una view con `ir` si autora dentro un unico tab IR di `ViewData`, che monta il pannello di authoring intero (Vertex/Row/EdgeAuthoringPanel a seconda del kind). La partizione ratificata il 2026-08-04 **sostituisce la barra di `ViewData` per le view con `ir`** con cinque tab:

**Applies to · Structure · Appearance · Text · Source**

Mappa dei contenuti (ratifica R-5 del 2026-08-04, serie della partizione; non è in `docs/decisions.md`, quindi fa testo qui):

- **Applies to**: matching (metaclasses / predicate / priority / exclusive), il pin di identità landato con la 1.3, e la breadcrumb `viewpoint › parent › questa view` in sola lettura (condizionata: COSA 4).
- **Structure**: topologia. Vertex: compartimenti (`fieldCompartments`). Edge: natura, capi PathExpr e reference, con contenuto che cambia secondo la natura. Row: non si rende affatto (v. matrice). GraphVertex: fuori scope (R-6 del 2026-08-04: niente riga in `showIRTab`, niente sezione containment).
- **Appearance**: forma, fill, border, resizable, badge; per l'edge la sezione linea (stroke/width/dash), le terminazioni/marker e il Select Routing landato con E-route.
- **Text**: label del vertex con text style; template della row; label center dell'edge.
- **Source**: nuovo, sola lettura, **Advanced-only** (unico tab gatato).

Matrice per kind: vertex ed edge hanno tutti e quattro i tab di contenuto più Source; **row solo Applies to e Text**: Structure e Appearance per una row sono **nascosti strutturalmente**, cioè i corpi non si rendono affatto (una row non ha geometria per costruzione). Non confondere i due meccanismi di occultamento (vincolo V1 dell'emendamento 2026-08-05): strutturale per kind, `display: none` per tab inattivo.

Decisioni vincolanti già nel repo, in `docs/decisions.md`, citate per id:

- **R-A (2026-08-05), strada B**: tutti i tab montati, gli inattivi nascosti con `display: none`, mai `visibility: hidden` né `opacity: 0`; key di remount a livello di pannello (il reset avviene al cambio di view, non di tab); niente `autoFocus`, `focus()`, `scrollIntoView` nei sotto-editor. Corollario architetturale che discende dalla stessa ratifica: **nessun sollevamento di stato e zero righe toccate nella logica dei rami E-ref ed E-obj** (`applyEndpoints`, `changeNature`, i tre `useState` del draft capi, il seed). Il pannello resta montato intero; la partizione è un cambiamento di sola presentazione: si raggruppa il JSX in cinque corpi, non si sposta stato.
- **R-B (2026-08-05)**: niente badge di errore per-tab in v1. La striscia d'errore a livello di pannello, dove gli ErrorText vivono già, resta **fuori dai corpi dei tab e sempre visibile qualunque sia il tab attivo**; i tre messaggi cross-tab noti nominano il tab nel testo (COSA 6).
- **R-D e C-1..C-4 (2026-08-05)**: semantica dei capi e divergenza dichiarata. Questo task non la tocca: cambiare tab non è un evento di commit né di reset, il draft e i suoi avvisi sopravvivono identici.

Vincoli della partizione non ancora nel repo (ratifiche 2026-08-04 ed emendamento 2026-08-05 del KB, riportati per intero perché vincolanti):

- **R-3 (2026-08-04)**: dopo la partizione `advanced` sopravvive solo come gate sui rami Conditional e su Source. Mai su sezioni o tab: il matching della vertex view diventa raggiungibile anche in Basic, dentro Applies to.
- **R-4 (2026-08-04)**: nomi dei tab in inglese. Le classi SCSS `.view-editor-tab*` non si rinominano. Le stringhe italiane interne ai pannelli non si traducono in questo commit.
- **V2 (emendamento 2026-08-05)**: la barra resta solo cliccabile, **nessuna navigazione da tastiera in questa slice**. (Se un giorno si aggiunge, il cambio tab dovrà chiudere esplicitamente il popover di `TextStyleField`, che vive in portal e sopravvivrebbe al `display: none` del suo contenitore.)
- **Invarianti del 2026-08-04**: un solo draft e un solo debounce di commit (300 ms) a livello di pannello, invariati; cambiare tab non scrive niente; `validateIR` resta l'unico gate del commit; le stringhe di divergenza restano canale UI (decisione "validateIR muto sulla divergenza", 2026-08-05, in `docs/decisions.md`).

Cosa NON è questa slice. La rimozione dei tab morti (Template/Style/Events/Options) è la 1.6, separata di proposito: altrimenti la verifica visiva non distingue una regressione della barra da una regressione di ciò che la barra non mostra più; e 3.6 precede 1.6. Le view **senza** `ir` non cambiano di un pixel: barra attuale intatta, Template read-only di S2 compreso. Nessun edit a `CLAUDE.md`: la regola anti-drift di R-A è già vincolante via `docs/decisions.md`, e l'aggiunta della riga in `CLAUDE.md` è rimandata per non interferire con la voce 2 e col regen di `AGENTS.md`. Il ramo irraggiungibile "authoring non ancora disponibile" (`ViewData.tsx:95-101` all'epoca della discovery) si lascia dov'è: la sua cancellazione (R-6) va con la 1.6.

Definizione di fatto della slice, da verificare alla voce 5: *apro una edge view IR, cambio tab avanti e indietro durante un edit non salvato, niente si perde e niente si sposta.*

## FASE 0: re-ancoraggio breve (read-only)

Le discovery sono agli atti ma il ramo è avanzato (fra l'altro `d8159c2f0` ha toccato i tre pannelli). Prima di ogni edit:

1. `ls docs/discovery/` e leggere i due report di riferimento: quello della tab map v2 (committato in `79a0d90c2`, naming `discovery_2026-08-04_*`) e `discovery_2026-08-05_panel_state_lifting.md` con il suo addendum (§10-§14). Non fidarsi dei `file:riga` di allora: ri-ancorare via grep a HEAD.
2. Ri-ancorare, con `file:riga` a HEAD nel report:
   - **(a)** `ViewData.tsx`: come si costruisce la barra oggi, la condizione `showIRTab` (il gate `view.isEdge !== true` resta), quali tab vede oggi una view con `ir`.
   - **(b)** I tre pannelli (`VertexAuthoringPanel`, `RowAuthoringPanel`, `EdgeAuthoringPanel`): struttura attuale delle sezioni a HEAD, confrontata con la mappa R-5; compresa la posizione attuale del Select Routing di E-route nella sezione linea. Ogni controllo che non rientra in modo ovvio in un tab della mappa va elencato nel report con la collocazione proposta, PRIMA di implementare.
   - **(c)** Dove vivono oggi gli ErrorText a livello di pannello (la striscia di R-B) e i tre messaggi cross-tab: PathBuilder disabilitato per assenza di metaclasse; wildcard più natura object; ambiguità di metaclasse fra metamodelli.
   - **(d)** Il gate `advanced` oggi: quali sezioni o tab lo leggono (per R-3) e il meccanismo con cui Source dovrà leggerlo.
   - **(e)** `grep -rn "autoFocus\|\.focus()\|scrollIntoView"` sull'albero authoring e su `components/ui/`: la premessa di R-A è zero occorrenze.
   - **(f)** `.view-editor-tab` in SCSS (`nestedView.scss` all'epoca): classi esistenti da riusare; per ogni identificatore nuovo (classi, chiavi, eventi) grep globale preventivo di collisione.
   - **(g)** Breadcrumb: il pannello ha già a portata (props o context) i nomi di viewpoint e parent della view corrente? Sì o no, con evidenza.
   - **(h)** Il controllo legacy `Applicable to` (`appliableToClasses`): dove si rende oggi, se la sua rimozione (il passo 1.4 della sequenza del 2026-08-04) è già atterrata (git log), e conferma che con la partizione smette semplicemente di essere mostrato per le view IR, senza niente da spostare.
   - **(i)** `git status` dei file bersaglio: quali sono sporchi.
3. **DISCOVERY REPORT OBBLIGATORIO**: salvare in `docs/discovery/discovery_<YYYY-MM-DD di esecuzione>_barra_15_reanchor.md` con: obiettivo; file letti (path completi); esito punto per punto (a..i) con i `file:riga`; dipendenze e rischi; domande aperte per Alfonso. Se al path esiste già un report, non riscriverlo: leggerlo per intero e aggiungere in coda un addendum con le sole cose non coperte (R-E/E-1 in `docs/decisions.md`). La Fase 0 non è conclusa finché il report non è scritto.

**REGOLE DI USCITA (hard stop condizionato)**. Fermarsi dopo il report, senza toccare codice, e riportare in chat se una qualsiasi è vera:

1. È scattata una guardia git del punto 4 di "Prima di iniziare".
2. Il punto (e) trova occorrenze di `autoFocus`, `focus()` o `scrollIntoView` nell'albero authoring o in `components/ui/`: la premessa che rende sicura la strada B non regge più e serve una decisione.
3. La struttura dei pannelli a HEAD diverge dalla mappa R-5 in un modo che la mappa non copre (controlli orfani senza collocazione ovvia, `Applicable to` intrecciato a un corpo di tab), oppure realizzare la partizione richiederebbe di toccare la logica dei rami E-ref/E-obj o di spostare stato.
4. Qualsiasi altra assunzione del CONTESTO non regge a HEAD.

Se nessuna regola scatta, procedere direttamente alla Fase 1, senza round-trip in chat sul re-ancoraggio verde (stesso patto di E-route).

## FASE 1: implementazione

### COSA

1. **La barra a cinque per le view con `ir`** in `ViewData`: Applies to · Structure · Appearance · Text · Source, in quest'ordine, nomi in inglese. Per le view con `ir` i tab legacy non compaiono più nella barra; i loro corpi e il loro codice restano dove sono (li rimuove la 1.6). Le view senza `ir` mantengono la barra attuale, intatta.
2. **Strada B (R-A)**: i corpi dei cinque tab sono tutti montati come figli del pannello di authoring, che resta montato intero con il suo draft e il suo debounce; il tab inattivo si nasconde con `display: none`, mai `visibility` né `opacity`. Key di remount invariata a livello di pannello.
3. **Ripartizione del JSX dei pannelli** nei corpi secondo la mappa R-5 del CONTESTO. Solo raggruppamento di presentazione: zero righe cambiate in handler, stato ed effetti; import aggiornati solo se strettamente necessario. Per la row, Structure e Appearance non si rendono affatto (V1).
4. **Breadcrumb in Applies to**, sola lettura, solo testo, niente navigazione: `viewpoint › parent › questa view`. **Solo se** il punto (g) della Fase 0 ha trovato i nomi già a portata del pannello; altrimenti si rinvia con una riga nel report e in chat, senza costruire plumbing nuovo.
5. **Source**: corpo read-only con l'`ir` corrente della view formattato, riusando la primitiva di visualizzazione read-only già in uso nel codebase; nessuna dipendenza nuova. Visibile solo con `advanced` attivo (unico tab gatato). Contestualmente, R-3: il gate `advanced` su sezioni e tab si rimuove (il matching della vertex view diventa raggiungibile in Basic dentro Applies to); i rami Conditional restano gatati come oggi, residui noti compresi.
6. **Striscia d'errore e messaggi (R-B)**: gli ErrorText di pannello restano fuori dai corpi, sempre visibili; i tre messaggi cross-tab del punto (c) vengono aggiornati per nominare il tab nel testo. Se una stringa è italiana resta italiana e nomina il tab, senza tradurre altro (R-4). Niente badge per-tab, niente passaggio da `validateIR`.
7. **Niente altro**: nessuna modifica a `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `useJjomSync.ts`, `portDistribution.ts`, `CLAUDE.md`, `docs/decisions.md`, né alla logica dei capi (`applyEndpoints`, `changeNature`, seed, draft). Nessun `autoFocus`, `focus()` o `scrollIntoView` introdotto. Se qualcosa fuori lista sembra necessario, fermarsi e riportare.

### DOVE

File bersaglio attesi (la Fase 0 conferma i path reali): `ViewData.tsx`; i tre pannelli di authoring per il raggruppamento del JSX; lo SCSS della barra solo se indispensabile, riusando `.view-editor-tab*`. Ogni file aggiuntivo strettamente necessario va elencato nel report prima di toccarlo.

### COME

- Diff minimale, zero refactoring opportunistico, mai rinominare identificatori esistenti (classi SCSS comprese).
- TypeScript tipizzato.
- Gate pieni (corsia completa): `npx tsc --noEmit` con baseline 33 e Δ0; vitest completo (baseline nota: 9 suite `window is not defined`; perimetro viewpoint 200/200); `npm run build` exit 0; `npm run check:docs` exit 0 sul committato (dopo il micro-commit del log deve esserlo; se rosso per cause preesistenti, riportare senza allargare il task).
- Un solo commit, a gate verdi: `feat(editor-v2): five-tab partition for IR views (all tabs mounted, display none)`. `git add` dei soli file toccati, elencati uno per uno. Niente push.

## Chiusura

1. Entry in `docs/claude-code-log.md` (prima ricontrollare che il file sia pulito): tipo `feat`; Prompt riassunto in una riga; File toccati; Esito; Note: "verifica visiva rinviata all'hard stop unico della voce 5"; Nome del documento prompt: "2026-08-06 12:27 voce 4 barra 1.5 strada B".
2. `docs/decisions.md` non si tocca: le eventuali deviazioni decise in corsa vanno in chat e nel report, non nel file.
3. Consegnare in chat la checklist per la voce 5 (Alfonso, http://localhost:3001/, hard refresh):
   1. Vertex view IR: cinque tab coi contenuti della mappa; un edit non salvato (per esempio il testo della label) sopravvive al giro completo dei tab; nessuno spostamento di layout al cambio tab.
   2. Edge view IR, entrambe le nature: Structure mostra natura e capi, o reference, secondo la natura; il Select Routing sta in Appearance e funziona (regressione E-route); un edit non salvato dei capi sopravvive al cambio tab, con gli avvisi di divergenza (R-D, C-1..C-4) identici a prima.
   3. Row view IR: solo Applies to e Text; nessuna traccia di Structure e Appearance.
   4. View senza `ir`: barra identica a prima, Template read-only di S2 compreso.
   5. Striscia d'errore visibile da ogni tab; i tre messaggi cross-tab nominano il tab.
   6. In Basic: il matching della vertex view è raggiungibile in Applies to; Source assente. In Advanced: Source presente e read-only.
   7. Popover di `TextStyleField` aperto, click su un header di tab: si chiude (verifica mirata di R-A).
   8. Tabulando con la tastiera non si entra mai in controlli di tab nascosti.
   9. Il resto dell'editor invariato: canvas, edge M2, view classic.

## RIFERIMENTI

- Nel repo: `docs/decisions.md` (RC-3, R-A, R-B, R-D, C-1..C-4, R-E/E-1, "validateIR muto sulla divergenza"); `docs/discovery/discovery_2026-08-05_panel_state_lifting.md` più addendum; il report della tab map v2 (`79a0d90c2`); `CLAUDE.md`; `docs/claude-code-log.md`.
- Nel KB di progetto (tracciabilità; non servono per eseguire, questo prompt è autocontenuto): `ratifiche_2026-08-04_tab_partizione.md` (serie R-1..R-6 della partizione, mappa R-5), `ratifiche_2026-08-05_panel_state_lifting.md` (R-A, R-B), `ratifiche_2026-08-05_2_emendamento_strada_B.md` (R-8, V1, V2), `sessione_2026-08-06.md` (checkpoint v3).
