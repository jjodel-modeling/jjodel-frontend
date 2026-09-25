# Memo 2026-09-25: catalogo dei ruoli, profili e modale Simulation roles (proposta R-SIM-47..55)

**Data**: 2026-09-25. **Chat**: `C-2026-09-25-1759`. **Ramo di riferimento**: `alfonso-frontend-jjtl`
per `docs/decisions.md` (R-SIM-38), `simulation-engine` (`e6e2e8fab`) per R-SIM-21..46.
**Stato**: proposta, da ratificare. **Input di design**:
`docs/design/claude_2026-09-25_simulation_roles_modal_design.md` (testo prodotto con Claude Design,
conservato come riferimento per la sola parte UI; il suo modello semantico era un segnaposto).

## Contesto

Il lato M2 del pannello Simulation oggi è una lista piatta di venti campi in quattro gruppi (R-SIM-37),
uno per chiave `sim*` del bag del metamodello. Il design di Claude Design propone di sostituirla con un
modale organizzato per preset (DFA, NFA, Moore, Mealy, macchina a stati, rete di Petri), ruoli
obbligatori sempre visibili, facoltativi chiusi, derivati raccolti in fondo. Il catalogo dei ruoli che
il design usa coincide con le chiavi esistenti, più un gruppo Output che non esiste.

Alfonso ha fissato la direzione il 2026-09-25: il catalogo è il superset di tutti i ruoli possibili;
flowchart, activity, automi e reti sono preset; l'utente può definire da zero un proprio tipo di
modello scegliendo i ruoli e dargli un nome; il profilo definito dall'utente si salva nel metamodello.

## Decisioni proposte

- **R-SIM-47. Catalogo unico, profili senza semantica.** Il catalogo dei ruoli della STC è uno solo ed
  è il superset. Un profilo è un nome più una selezione dal catalogo: per ogni ruolo un modo (`edit`,
  `derived` con valore fisso o sorgente dichiarata, `off` con motivo), i parametri di R-SIM-49 e i
  vincoli di R-SIM-49. Il motore e l'esportatore leggono i ruoli risolti, mai il profilo: un profilo
  non introduce semantica, restringe quella del nucleo (R-SIM-21). I profili di sistema stanno nel
  codice, in sola lettura; un profilo utente nasce vuoto oppure come copia di un profilo di sistema
  («Save as…»), e modificare un profilo di sistema lo rende «modified» finché non lo si salva con un
  nome.

- **R-SIM-48. L'obbligatorietà si calcola.** `required(profilo)` è l'unione di due insiemi. Il primo è
  la chiusura di eseguibilità della forma, non negoziabile: per il controllo di flusso Node,
  Transition, Next state, una sorgente (Source oppure Owned transitions, R-SIM-10) e Initial; per la
  forma Petri Node, Transition, Arc, Arc source, Arc target e Initial marking. Il secondo sono i
  requisiti aggiunti dal profilo, che possono solo restringere (il DFA richiede Trigger e Accepting).
  Un profilo utente può aggiungere requisiti, non toglierne. La chiusura segue la tabella delle
  dipendenze qui sotto; i gruppi Control flow e Petri net si escludono (la forma si deduce da
  `simArc`, R-SIM-31(4)). Il modello è checkable quando ogni ruolo richiesto è legato e nessun legame
  è incompatibile; «with warnings» se qualche legame è un avviso.

- **R-SIM-49. Parametri e vincoli del profilo.** Parametri: k (`simBound`, R-SIM-23); politica del
  selettore (lista, R-SIM-35; random e scenario arrivano con la traccia del passo 5); ipotesi d'ambiente
  dell'esportatore (ambiente cooperativo o aperto, R-SIM-16; stabilità, R-SIM-20). Vincoli: proprietà
  strutturali che il profilo pretende dal modello M1, come «nessun arco ε», «deterministico» (al più un
  arco uscente per coppia stato ed evento), «un solo token». I vincoli non entrano nel motore:
  diventano regole di un validation viewpoint generato dal profilo (voce «Generate validation
  viewpoint» del modale), con il tri-stato di R-SIM-15. Il determinismo quindi non è un controllo di
  tipo sul metamodello: la molteplicità 0..1 di Next state non lo garantisce, perché la non
  determinazione nasce da due archi uscenti dallo stesso stato con lo stesso evento. Fork come scelta
  o come parallelismo e join come merge o come sincronizzazione non sono parametri: li esprimono già
  la presenza o l'assenza di `simFork` e `simJoin` (R-SIM-22). Il decision block resta guardia più
  `else`, e la risposta dell'utente resta una politica del selettore (R-SIM-25).

- **R-SIM-50. L'accettazione è distinta dalla terminazione.** Ruolo facoltativo nuovo `simAccepting`
  (metaclasse). Una configurazione accetta quando qualche posto marcato è istanza di Accepting;
  l'accettazione non ferma il run, a differenza di `simTerminal`, dove una configurazione terminata non
  ha candidati (R-SIM-27). Serve perché in un DFA da uno stato accettante si continua a leggere. Il
  pannello mostra «accepting» accanto allo stato del run; l'esportatore genera `DEFINE accepting`.

- **R-SIM-51. Output di Moore e di Mealy.** Ruoli facoltativi nuovi `simStateOutput` (attributo della
  metaclasse nodo) e `simTransitionOutput` (attributo della classe che porta gli archi). I valori si
  leggono dal modello congelato del run (R-SIM-14). Il pannello mostra l'output dello stato marcato
  (Moore) e quello dell'ultimo scatto nella riga «Last step» (Mealy); l'esportatore genera
  `DEFINE out`. Output calcolati da espressioni sono attributi derivati (R-SIM-19) e restano con loro.

- **R-SIM-52. Gruppo Data nel catalogo.** Guardia (`simGuard`, già esistente) e azioni di R-SIM-17
  formano un gruppo proprio: `simAction` (feature `[0..*]` di tipo `Action` sulla classe che porta gli
  archi), `simEntry` e `simExit` (sulla metaclasse nodo). Un nodo di azione del flowchart è un nodo con
  `simEntry`. Le dichiarazioni degli attributi di stato (R-SIM-19) compaiono nel modale come sezione
  del gruppo, ma sono una tabella per metaclasse, non un legame, e arrivano con la loro corsia (C di
  R-SIM-39). I nomi delle chiavi nuove sono provvisori fino al commit di codice della corsia che le
  cabla, come in R-SIM-32.

- **R-SIM-53. Activity final.** Ruolo facoltativo nuovo `simActivityFinal` (metaclasse). Un suo posto
  marcato porta il run in `Terminated` anche con altri token vivi, come l'activity final di UML;
  `simTerminal` resta il flow final. Emenda R-SIM-27: terminata vale «marking non vuoto e ogni posto
  marcato in F, oppure un posto di activity final marcato»; in nuXmv è una disgiunzione in più in
  `DEFINE terminated`. È una modifica del motore e si può ratificare separatamente dalle altre.

- **R-SIM-54. Profili di sistema.** Nove profili, nella tabella qui sotto. Nei profili a controllo di
  flusso il gruppo Petri net è `off` («compiled from control flow», R-SIM-32) e non `derived`: le
  chiavi Petri non si scrivono, la rete la costruisce il compilatore. `derived` resta per valori veri:
  Bound = 1 e Initial marking = «1 on Initial» (R-SIM-28).

- **R-SIM-55. Persistenza additiva.** Il profilo attivo si salva nel bag M2 con una chiave additiva
  `simProfile`: l'id del profilo di sistema, oppure la definizione del profilo utente serializzata
  (nome, modi, parametri, vincoli, requisiti aggiunti). Le chiavi dei ruoli restano quelle di R-SIM-37,
  senza rinomine. Senza `simProfile` il modale ricostruisce un profilo «Custom» dalle chiavi presenti:
  nessuna migrazione e nessun salto di VersionFixer, come per `simSource` (R-SIM-10). Cambiare profilo
  non cancella legami: una chiave di un ruolo `off` resta nel bag e il bridge non la legge. Il profilo
  scelto si scrive solo con Apply. Una libreria personale di profili riusabile fra progetti (import ed
  export) è rinviata.

### Catalogo e dipendenze

| Gruppo | Ruolo | Chiave | Genere | Dipende da |
|---|---|---|---|---|
| General | Node | `simNode` | classe | |
| General | Initial | `simInitial` | classe | Node |
| General | Initial marking | `simInitialMarking` | attributo intero | Node |
| General | Terminal (flow final) | `simTerminal` | classe | Node |
| General | Accepting | `simAccepting` (nuova) | classe | Node |
| General | Activity final | `simActivityFinal` (nuova) | classe | Node |
| General | Bound | `simBound` | intero | |
| General | Transition | `simTransition` | classe | |
| Control flow | Owned transitions | `simOwnedTransitions` | riferimento | Node, Transition |
| Control flow | Source | `simSource` | riferimento | Transition |
| Control flow | Next state | `simNextState` | riferimento | Transition |
| Control flow | Fork | `simFork` | classe | Node |
| Control flow | Join | `simJoin` | classe | Node |
| Petri net | Arc | `simArc` | classe | |
| Petri net | Arc source | `simArcSource` | riferimento | Arc |
| Petri net | Arc target | `simArcTarget` | riferimento | Arc |
| Petri net | Arc weight | `simArcWeight` | attributo intero | Arc |
| Petri net | Inhibitor arc | `simInhibitorArc` | classe | Arc |
| Events | Trigger | `simTrigger` | riferimento | Transition |
| Events | Event | derivato da Trigger (R-SIM-38) | | Trigger |
| Events | Event identifier | `simEventIdentifier` | attributo, override | Trigger |
| Data | Guard | `simGuard` | attributo `Expression` | Transition |
| Data | Action | `simAction` (nuova) | attributo `Action [0..*]` | Transition |
| Data | Entry | `simEntry` (nuova) | attributo `Action [0..*]` | Node |
| Data | Exit | `simExit` (nuova) | attributo `Action [0..*]` | Node |
| Data | State attributes | tabella R-SIM-19 | dichiarazioni | |
| Output | State output | `simStateOutput` (nuova) | attributo | Node |
| Output | Transition output | `simTransitionOutput` (nuova) | attributo | Transition |

### Profili di sistema

| Profilo | Forma | Attivi oltre la chiusura di eseguibilità | Requisiti aggiunti | Vincoli e parametri |
|---|---|---|---|---|
| Petri net (P/T) | Petri | Arc weight, Inhibitor arc, Bound, Terminal | | k dichiarato |
| Flowchart | controllo | Guard, Terminal, Action, Entry | | un solo token; Fork e Join off |
| Activity | controllo | Guard, Terminal, Activity final, Fork, Join, Action, Entry | | k = 1 |
| State machine | controllo | Trigger, Guard, Terminal | | k = 1 |
| Extended state machine | controllo | Trigger, Guard, Terminal, Action, Entry, Exit, State attributes | | k = 1 |
| DFA | controllo | Trigger, Accepting | Trigger, Accepting | k = 1; nessun ε; deterministico; Guard off |
| NFA | controllo | Trigger, Accepting | Trigger, Accepting | k = 1; ε ammesso; Guard off |
| Moore | controllo | Trigger, State output | Trigger, State output | k = 1; nessun ε; deterministico |
| Mealy | controllo | Trigger, Transition output | Trigger, Transition output | k = 1; nessun ε; deterministico |

La forma Petri esige anche Initial marking; nei profili a controllo di flusso Initial marking è
derivato («1 on Initial») e Bound è derivato (1). I ruoli non elencati sono `off`.

## Parte UI presa dal design

Si prende dal design di Claude Design: lo Step 1 con le card (Automaton con i chip DFA, NFA, Moore e
Mealy; State machine; Petri net), a cui si aggiungono Activity/Flowchart e una card «Custom»; il
dropdown del profilo nell'intestazione, con i profili di sistema raggruppati e sotto quelli utente;
il badge checkable; la riga «N of M roles matched by name · Undo», dove il match-by-name propone solo
candidati compatibili e non scrive nulla fino ad Apply; la sezione Required sempre aperta, Optional
chiusa, derivati e `off` in una riga finale chiusa; il dropdown di legame con filtro, candidati
compatibili, conteggio degli incompatibili nascosti e un segnaposto «Expression…»; il footer con Reset,
Match by name, il menu «…» con «Generate validation viewpoint», Cancel e Apply. Il pannello SMV resta
un segnaposto inerte, marcato «not yet available», finché l'esportatore non esiste (passo 4-5).

Il controllo di compatibilità per legame (tipo, proprietario, molteplicità; supertipo ammesso con
avviso, R-SIM-8) resta come nel design, tranne il caso del determinismo, che passa ai vincoli
(R-SIM-49). La regola del 2026-09-24 sul pannello si precisa così: su un metamodello il pannello
mostra il riassunto della configurazione (profilo, badge checkable, ruoli mancanti) e un pulsante
«Configure…» che apre il modale; i quattro gruppi di R-SIM-37 passano nel modale.

## Alternative scartate

Preset come semantiche distinte (il testo di Claude Design lo faceva con un modello proprio in
`simulation/semantics.ts`): ogni preset sarebbe una semantica da tenere allineata al nucleo, contro
R-SIM-21. Obbligatorietà dichiarata a mano nei profili utente: permette di salvare un profilo che il
motore non sa eseguire. Parametri di modo per fork e join: duplicano quello che R-SIM-22 esprime con
la presenza del ruolo. Terminal come stato accettante: fermerebbe il run del DFA al primo stato
accettante. Simulazione dell'NFA «all branches»: con k = 1 produce uno scatto «unsafe» e contraddice
l'interleaving di R-SIM-7; la non determinazione la risolve il selettore, e nell'esportatore
l'insieme dei successori è già la semantica di nuXmv.

## Escluso per scelta

Stati gerarchici e regioni ortogonali (statechart), history, composizione di più macchine, object
flow delle activity, tempo (già escluso il 2026-09-12). Il modale non li mostra.

## Aperto

1. Flowchart e Activity: i requisiti del 2026-09-24 mettono fork e join nei flowchart. Se valgono,
   i due profili coincidono salvo l'activity final e conviene un profilo solo.
2. R-SIM-53 (activity final) insieme alle altre o in una ratifica separata.
3. Nome del profilo utente: unico nel metamodello, e se conserva il riferimento al profilo di sistema
   da cui è stato copiato.

## Prossimo passo

Ratificare non è schedulare. Ordine proposto: (1) catalogo, profili e calcolo di `required` come modulo
puro in `frontend/src/model/simulation/`, solo file nuovi, corsia veloce; (2) il modale, dopo la
chiusura della corsia eventi (`P-2026-09-25-1500`) e della 3b, con discovery su componenti e token
disponibili (Badge, EntityBadge, font mono) e sul pannello M2 attuale; (3) Accepting, output e
activity final nel motore, con una corsia propria; (4) il gruppo Data con la corsia C di R-SIM-39.
