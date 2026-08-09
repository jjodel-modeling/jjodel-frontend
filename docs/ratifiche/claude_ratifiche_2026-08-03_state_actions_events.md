# Ratifiche 2026-08-03 — Stato e azioni: sintassi astratta e concreta

**Contesto**: discovery `docs/discovery/discovery_2026-08-03_state_actions_events.md` eseguita e analizzata in chat. Le decisioni qui sotto sono ratificate da Alfonso il 2026-08-03 e valgono come vincoli per le slice future. Non vanno ridiscusse nei prompt: chi le contraddice segnala il conflitto e si ferma.

## Il fatto che riformula il capitolo

Due findings letti insieme cambiano la natura del lavoro.

- **§1.4**: il tab Events e' una superficie di authoring sopra un runtime rimosso. `evalContext` non ha un solo sito di scrittura in tutto il codebase; `JSXFunction` e' assegnata e mai invocata; l'editor classico e' spento dalla Fase 5a. Gli handler si scrivono, si salvano, si ricompilano e non vengono mai eseguiti.
- **§4.2**: `_state` su `DPointerTargetable` (`joiner/classes.ts:1427`) esiste, e' documentato, ed e' presente su ogni oggetto D. La sua doc inline descrive letteralmente il caso d'uso in discussione: *"A space where the user can store informations for their operations/views. Example: the Validation viewpoint uses it to store validation messages through onDataUpdate events"*.

**Conseguenza**: il capitolo "stato e azioni" non e' una feature nuova dell'IR. E' il recupero di una capacita' che Jjodel aveva e ha perso nella transizione classic → flow. Il substrato D/L e' vivo e orfano; manca il motore che lo alimenti.

Nota di simmetria che regge tutto il resto: `_state` sta sulla radice della gerarchia, quindi e' identico su `DObject` (sintassi astratta) e su `DVertex` / `DViewElement` (sintassi concreta). **Lo storage non distingue i due livelli. La distinzione deve viverla la dichiarazione.**

---

## R-1 — Il tab Events e' dichiarato morto e sara' sostituito, non riparato

Riattivare il canale events (Opzione H del report) richiederebbe di ricostruire `evalContext` da zero e di reintrodurre `new Function` su stringa utente dentro il flow editor, cioe' esattamente cio' che la Fase 5a ha spento. Ucciderebbe inoltre l'analizzabilita' statica delle dipendenze (`dependencySet`, `crossPaths`), che e' il fondamento della reattivita' IR.

Il modello di azione nascera' dentro l'IR (Opzione G). Il tab Events resta come superficie legacy.

**Conseguenza immediata e indipendente**: R1 del report e' una trappola utente attiva oggi. Il tab accetta codice, lo persiste, lo ricompila, e `ViewProperties.tsx:325-357` mostra un indicatore di stato "attivo" per gli handler definiti. Va marcato subito (slice 3), senza attendere il resto del capitolo. Nessuna rimozione del tab, nessuna rimozione dei campi, nessun tocco alla persistenza: solo onesta' verso chi lo apre.

## R-2 — Scope dello stato concreto: default per-viewpoint, condivisione dichiarata

Il caso gia' deciso indica la regola. `irEdgeLayout` e' condiviso fra viewpoint perche' il layout e' proprieta' del disegno del modello, con la stessa semantica delle posizioni dei nodi (decisione 2026-07-19, confermata dal codice). Il collasso e' cosa diversa: e' proprieta' di come si sta guardando adesso, e due viewpoint sullo stesso modello hanno ragioni legittime per divergere.

**Ratificato**: lo stato dichiarato sulla sintassi concreta e' **per-viewpoint per default**. La condivisione fra viewpoint e' una scelta esplicita dichiarata nell'IR (`shared: true` o equivalente), mai un default implicito.

Implementazione attesa additiva: `_state` sul carrier con namespace per viewpoint nella chiave; il flag dichiarato collassa il namespace. Nessuna entita' nuova.

Questo trasforma R3 del report (scope condiviso ereditato senza decisione) da accidente in decisione. Non retroagisce su `irCollapsed` e `irEdgeLayout` esistenti: quelli restano come sono finche' il dogfooding non dimostri che il collasso condiviso e' una frizione reale.

## R-3 — Persistenza: doppio regime dichiarato, default non persistito

Il doppio regime che il report segnala sul collasso (singleton di sessione come source of truth runtime, piu' write-through sul D-layer con idratazione una-tantum) non e' un difetto: e' la risposta a R7. La reattivita' passa dal singleton, che e' economico; la persistenza dal D-layer, che e' lento e raro.

**Ratificato**: lo stato dichiarato adotta lo stesso doppio regime, ma la persistenza e' **dichiarata per-stato** e il default e' **non persistito**. Il precedente di sintassi esiste gia' ed e' `persistWaypoints` (`irTypes.ts:213`, gate a `EditorV2.tsx:159-172`).

Motivazione del default: non persistere e' reversibile, persistire sporca i progetti salvati e sorprende l'utente al reload piu' spesso di quanto lo aiuti.

## R-4 — La destinazione della scrittura e' obbligatoria e senza default

E' il punto in cui l'osservazione originale diventa una regola implementabile.

Poiche' `_state` e' identico sui due livelli, nulla nello storage impedisce di scrivere nel posto sbagliato. I due errori simmetrici sono entrambi silenziosi e costosi:

- uno stato di interazione scritto sulla sintassi astratta finisce nel modello, viene esportato in XMI, entra nei diff e nelle trasformazioni JjTL come se fosse dato di dominio;
- uno stato semantico scritto sulla sintassi concreta e' legato alla notazione e sparisce cambiando viewpoint.

**Ratificato**: ogni dichiarazione di stato e ogni azione che scrive nomina il **livello di destinazione** in modo esplicito. Nessun default, nessuna inferenza. Il validatore rifiuta una dichiarazione priva di livello.

## R-5 — Lo stato e' leggibile nelle espressioni, via prefisso (Opzione D)

Uno stato che nessuna notazione puo' leggere e' una variabile morta: la lettura serve.

Fra le strade praticabili del report si sceglie **D (secondo prefisso riconosciuto dal parser)**, non E (contesto di lettura esteso). Motivazione: l'IR e' un artefatto che si versiona, si migra, si genera da AI e si legge a mano. Con E uno stato sarebbe indistinguibile da una feature nell'IR serializzato, e sarebbe un debito permanente. Il prefisso rende la distinzione strutturale e gratuita per chiunque legga l'IR.

**Vincolo associato**: R9 del report (contaminazione del `dependencySet`, fallimento silenzioso) si chiude con un **canale di dipendenze separato** (`stateDependencySet` o equivalente). I nomi di stato non entrano mai nel `dependencySet` delle feature.

## R-6 — Il vocabolario di azioni e' chiuso, mai JS arbitrario

`dependencySet` e `crossPaths` esistono perche' il linguaggio e' analizzabile staticamente (`irCompile.ts:6-8`: nessuna interpretazione a render-time). Un'azione JS arbitraria distrugge quella proprieta' e con essa la reattivita'.

**Ratificato**: il modello di azione e' un vocabolario finito di operazioni (scrivi feature, scrivi stato, toggle, e simili), compilato in closure come tutto il resto dell'IR. Le scritture passano dai write path canonici gia' censiti (§2.1 del report), mai da write path nuovi, coerentemente con la spec v1.2 §5 che risulta rispettata.

## R-7 — `_state` come substrato, nessun campo cablato nuovo

Si adotta l'Opzione A/B del report: `_state` come contenitore dei valori, dichiarazione dentro `DViewElement.ir`.

Motivazione: nessuna migrazione (`_state` e' sulla radice, `get_state` e' undefined-safe; `ir?` e' additivo e serializzato genericamente), semantica patch e sanitizzazione dei proxy gia' scritte e documentate, undo Redux gratuito perche' passa da `TRANSACTION`.

**Due verifiche obbligatorie prima di appoggiarcisi**, entrambe registrate come rischio nel report e nessuna delle due sanabile a tavolino:

- **R6**: il write path `SetFieldAction` con `'+='` / `'-='` su `_state` non e' esercitato da codice vivo ne' coperto da test. Va verificato a runtime.
- **R7**: nessun canale di reattivita' attuale osserva `_state`. Le signature di `useIRView`, `useIRRowView`, `useIRContainment` e `computeIRSignature` guardano `ir`, `instanceof` e i `values` dei `DValue`. Una scrittura su `_state` oggi non ridisegna nulla.

La seconda e' la ragione strutturale per cui R-3 impone il doppio regime: il singleton e' il canale di reattivita', il D-layer e' solo il carrier persistente.

## R-8 — Prerequisiti prima di aprire il capitolo

Il capitolo non si apre finche' non sono chiuse quattro slice piccole e indipendenti, tutte utili di per se':

1. **Push** dei 30 commit locali. Primo comando: `git log origin/alfonso-frontend-jjtl..HEAD --oneline`, poi push. In coda da cinque sessioni.
2. **R12**: `takeSnapshot()` e dirty flag sugli edit inline IR (`IRNodeContent.tsx:123-135`). Bug utente reale e indipendente dal capitolo.
3. **R1**: banner nel tab Events e indicatore di stato corretto (vedi R-1).
4. **R8**: `parsePathExpr` estratto in modulo puro esportato, con `PathBuilder` e `PredicateBuilder` che vi convergono.

La quarta e' prerequisito diretto di R-5: i tre parser indipendenti dello stesso linguaggio vanno unificati **prima** di estendere la grammatica, altrimenti ogni innesto ne tocca tre e puo' divergere in due. Paga anche il micro-debito `isUsableEndpointExpr` registrato il 2026-08-02.

Dopo le quattro slice: fix rehydration del viewpoint selector, poi dogfooding. La forma finale del capitolo si decide sull'evidenza dell'uso, non sull'analisi.

## R-9 — R4 del report si verifica nel dogfooding, non come task

L'isolamento per modello dei singleton di sessione (`collapsed`, `anchorOverrides`, `selectedSynthetic` sono `Set` / `Map` di modulo senza reset sul cambio di modello) e' l'unica ipotesi del report che richiede di far girare l'app. E' una riga di console con due modelli aperti. Non merita un prompt dedicato: si verifica alla prima occasione utile.

Se il modello di stato futuro sostituisce quei singleton, la verifica diventa superflua; se li estende, e' un prerequisito. La risposta arrivera' insieme alla forma del capitolo.

---

## Tab map: stato aggiornato della decisione

La razionalizzazione discussa il 2026-08-03 si ferma a tre tab per le view IR-authored:

**Applies to · Shape · Content**, piu' **Events** legacy marcato come inerte.

**Behavior** (State piu' Actions) nasce quando nasce il modello di stato, non prima. Un tab che promette azioni senza runtime sarebbe la stessa trappola di R1, spostata di un metro.

Restano valide e non ratificate qui, perche' dipendono dalla discovery tab map mai eseguita: l'unificazione dell'autorita' sul matching (Apply to contro MatchingSection), il ritiro del Basic/Advanced locale al pannello IR in favore del toggle globale in navbar, lo scioglimento di Options.

## Delta spec e debiti registrati in questa sessione

- **R11**: `FieldSegment.value.path` e' dichiarato nella spec v1.2 §5 e non implementato (`irTypes.ts:96`). La riga si risolve per posizione nello slot, non per PathExpr. Da sanare nella spec o nel codice, non urgente.
- **R10**: `ObjectNode.tsx:395` emette `data-viewid`, che nessun consumatore legge (`DViewElement.PtrFromHtml` legge `viewid`). Attributo morto e potenzialmente fuorviante.
- **R5**: fall-through del `_defaultGetter` da vertice a view (`GraphDataElements.tsx:361-366`). Vincola i nomi di ogni campo nuovo su `DVertex`: un campo assente sul vertice viene cercato sulla view.
- **R8** del report: tre parser dello stesso linguaggio. In chiusura con la slice 4.

## Riferimenti

- Discovery: `docs/discovery/discovery_2026-08-03_state_actions_events.md`.
- Prompt di discovery: `claude/2026-08-03_prompt_discovery_state_actions_events.md`.
- Mappa di copertura: `claude/mappa_sintassi_concreta.md` (da aggiornare con la sezione stato e azioni quando il capitolo si apre).
- Spec IR v1.2: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (§5 editabilita', §7 `persistWaypoints`, §12 serializzazione).
- Ratifiche precedenti: `claude/ratifiche_2026-08-02_eobj_object_as_edge.md`.
