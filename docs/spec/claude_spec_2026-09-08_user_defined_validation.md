# Spec — Validazione definita dall'utente

**File**: `docs/spec/claude_spec_2026-09-08_user_defined_validation.md`
**Data**: 2026-09-08
**Stato**: vigente, non implementata. Nessuna Fase 2 aperta.
**Serie di decisioni**: R-VAL (R-VAL-1..15, con 6-bis)
**Referti a monte**:
`docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` (Fase 1, 834 righe, `fdf087259`)
`docs/discovery/discovery_2026-09-08_*keyword*` (micro-discovery lexer, `3e4dec57b`)

---

## 1. Scopo e perimetro

Oggi Jjodel valida un modello contro la definizione del suo metamodello: conformance,
uniqueness dei nomi, forma dei nomi. Questa spec definisce il livello successivo, cioe' i
vincoli che il *language designer* scrive esplicitamente e che valgono sulle istanze del
linguaggio che sta definendo.

**In scope**: invarianti dichiarate in funzione di una classe M2, valutate su ogni istanza M1
di quella classe, scritte in JjEL, non bloccanti.

**Fuori scope, dichiarato**: i vincoli di modello (contesto = il modello intero) e la
soppressione per singola istanza (waiver). Vedi §11.

**Confine con i tipi scalari**: un vincolo sul valore di un singolo campo (`min`, `max`,
dominio) appartiene al tipo scalare raffinato e si verifica in scrittura. Le invarianti di
questa spec sono i vincoli relazionali e strutturali. La stessa cosa non si dice in due posti.

---

## 2. Decisioni ratificate

**R-VAL-1** (2026-09-08) — La validazione e' un *concern* con viewpoint propri, non un
capitolo del metamodello ne' una sezione dei viewpoint di sintassi. Ragione ratificata da
Alfonso: il viewpoint e' il meccanismo con cui Jjodel separa gli aspetti specificati in
funzione di un metamodello, e tenere le regole insieme alle proprieta' della classe aumenta il
carico cognitivo. Il criterio di R-VP (metamodello = validita', viewpoint = presentazione)
riguarda i viewpoint di sintassi concreta e non si applica qui.

**R-VAL-2** (2026-09-08) — I viewpoint di validazione sono **multipli** e selezionabili, come
quelli di sintassi e diversamente dal Data Manager Viewpoint (R-DMV). Conseguenza accettata e
da dichiarare in interfaccia: «valido» e' relativo all'insieme dei viewpoint di validazione
attivi.

**R-VAL-3** (2026-09-08) — Nella prima fetta il proprietario di una regola e' sempre una
**classe** M2. Il livello modello resta fuori: il registro dei problemi richiede `nodeId`
(`registry.ts:63`, sette siti), le violazioni di modello sono gia' scartate a monte
(`conformanceToProblems.ts:43`) e non esiste una superficie che le mostri.

**R-VAL-4** (2026-09-08) — Le violazioni **non bloccano** nessuna scrittura, mai. Un modello in
costruzione e' normalmente invalido.

**R-VAL-5** (2026-09-08) — Attivazione a due livelli indipendenti: il viewpoint e la singola
regola. Vedi §6.

**R-VAL-6** (2026-09-08) — Una regola ha la stessa **forma** di una view (legame a una classe,
interpretazione sulle istanze, attivabilita', dispatch) ma **non lo stesso tipo**: non e' un
`DViewElement`. Ereditare il tipo delle view porterebbe stile, layout e primitive IR che per una
regola non significano niente. Nota storica: `joiner/classes.ts:1186` conserva un
`//thiss.constraints = [];` commentato su `DViewElement` accanto a un flag `isValidation`, cioe'
il tentativo precedente di questa unificazione.

**R-VAL-6-bis** (2026-09-08, dopo l'osservazione di Alfonso) — **La forma condivisa e' piu'
piccola di quanto R-VAL-6 dichiarava, e la conclusione si rafforza**: la regola nasce come **tipo
parallelo**, senza supertipo comune. Una view di viewpoint sintattico *seleziona*: puo' prendere
istanze di piu' metaclassi, filtrarle con predicati, e il dispatch sceglie quale view vince su una
data istanza. Una regola *predica*: ha un contesto solo, una classe e le sue sottoclassi, e non
c'e' nessuna scelta da fare perche' tutte le regole applicabili si valutano. Legame e dispatch,
cioe' due dei quattro elementi che R-VAL-6 dava per comuni, non lo sono. Resta condiviso solo
l'essenziale: appartenere a un viewpoint ed essere attivabile. Appoggiare la regola su un
supertipo che ammette piu' classi e un filtro renderebbe rappresentabile uno stato senza
significato, la regola con due contesti, e obbligherebbe il valutatore a dargliene uno.

**R-VAL-11** (2026-09-08) — **Nessun cartello nel rail.** Il pannello della classe non dice che la
classe porta delle regole: resta il solo indicatore sul nodo. Una riga in sola lettura sarebbe il
precedente per cui ogni concern che tocca la classe ne chiede una, e il rail tornerebbe a essere
un indice di tutto. Se l'esigenza si vede all'uso, si progetta di proposito una zona dei concern,
non si aggiunge una riga alla volta.

---

## 3. Il concern e i suoi viewpoint

Un **viewpoint di validazione** e' un contenitore di regole definito sopra un metamodello. Un
progetto ne puo' avere piu' d'uno, e ciascuno raccoglie una famiglia coerente di regole: le
regole strutturali della lingua, le convenzioni di nomenclatura, i controlli che un utente
aggiunge sopra un metamodello che non ha scritto lui.

Da R-VAL-2 discendono tre proprieta':

1. L'insieme delle regole in vigore e' l'unione delle regole attive dei viewpoint attivi.
2. Attivare e disattivare un intero concern e' un'operazione sola, non N.
3. Il *lint del modellatore* (controlli di chi usa una lingua altrui) non e' un meccanismo
   terzo: e' un viewpoint di validazione come gli altri. Previsto, fuori dalla prima fetta.

### 3.1 Cancellazione della classe referenziata (R-VAL-9)

Cancellare una classe non cancella in silenzio le sue regole. Si apre una modale che chiede se
cancellarle o conservarle come documentazione disabilitata.

Tre precisazioni che discendono dalla scelta e che la spec fissa:

1. **Lo stato di orfana e' distinto dalla disattivazione volontaria di R-VAL-5.** Una regola
   conservata dopo la cancellazione della classe non e' semplicemente spenta: e' priva di
   contesto, non e' riattivabile, e non deve comparire nel conteggio delle regole che l'utente ha
   scelto di silenziare. Il nome della classe si conserva come testo, altrimenti la
   documentazione e' illeggibile (`self: <cancellata>` non documenta niente).
2. **Sui percorsi non interattivi la modale non c'e'** (import, round trip, cancellazione in
   blocco applicata a tutti). Il default e' sempre **conservare**, mai cancellare: una perdita
   silenziosa di regole e' peggio di un residuo visibile. Una cancellazione in blocco chiede una
   volta sola e applica la risposta a tutte.
3. **L'undo deve ripristinare le regole cancellate dalla modale.** Il progetto ha gia' un debito
   noto sul doppio sistema di undo: se il ripristino non e' garantito, la modale conserva e basta
   invece di offrire la cancellazione.

### 3.2 Metamodello in un altro progetto (R-VAL-10)

Un metamodello che entra in un progetto diverso da quello in cui le regole sono state scritte si
comporta come se le regole fossero nate li'. Perche' l'enunciato sia un comportamento e non
un'intenzione, ne discende che:

1. **I viewpoint di validazione seguono il metamodello** quando questo viene importato o copiato.
   Non e' automatico: il viewpoint e' di progetto, quindi l'importazione deve portarseli dietro
   esplicitamente.
2. **Arrivano attivi.** L'attivazione e' una scelta del progetto (§6) e un metamodello appena
   arrivato non ne ha ancora una: il default attivo e' l'unico che rende vera la frase «come se
   fosse stato realizzato li'».
3. **Le collisioni di nome si risolvono come i modelli duplicati**, con il suffisso `(1)`, `(2)`,
   senza fondere due viewpoint omonimi e senza sovrascrivere.

---

## 4. La regola

Campi:

| Campo | Contenuto |
|---|---|
| `name` | identificatore leggibile, unico nel viewpoint |
| `context` | puntatore alla classe M2 proprietaria; `self` e' l'istanza |
| `body` | espressione JjEL booleana |
| `message` | testo con segnaposto valutati nello stesso contesto, es. `"{self.name} ha saldo {self.saldo}"` |
| `severity` | `error` o `warning`. Nessun terzo livello nella prima fetta |
| `enabled` | attivazione della singola regola (§6) |

**Ereditarieta'**: una regola su una superclasse vale su tutte le sue sottoclassi. Nell'ambiente
di authoring le regole ereditate sono visibili in sola lettura e distinte da quelle proprie:
senza, il designer riscrive un vincolo che gia' esisteva piu' su.

### 4.1 Superclasse e sottoclasse con una regola ciascuna (R-VAL-12)

**Le regole si accumulano, non si sovrascrivono.** Su un'istanza di una sottoclasse valgono le
regole della sottoclasse e tutte quelle ereditate. Nessuna regola ne annulla un'altra, e non
esiste un modo di sopprimere dalla sottoclasse una regola della superclasse.

Non e' una preferenza: discende da R-VAL-6-bis. Una view *seleziona* e il dispatch deve scegliere
una vincente, perche' un'istanza si disegna in un modo solo; una regola *predica* e non c'e'
niente da scegliere, perche' un'istanza puo' violare piu' regole insieme. La differenza va
dichiarata in interfaccia, perche' chi arriva dai viewpoint di sintassi si aspetta per analogia
che la sottoclasse sovrascriva, e qui non succede.

Tre conseguenze:

1. **La congiunzione sta nell'aggregato, non nelle regole.** Ogni regola produce il proprio
   verdetto, il proprio messaggio e la propria severita', e ogni violazione e' una voce a se' nel
   registro. «AND» e' solo la risposta alla domanda derivata «il modello e' valido», dove la
   severita' complessiva e' la massima fra quelle violate. Le regole non si fondono mai in un
   verdetto unico.
2. **Un nome uguale non crea un override.** I nomi sono unici dentro un viewpoint; una regola
   omonima in un altro viewpoint e' un'altra regola e vale in aggiunta. Far dipendere la validita'
   da una coincidenza di nomi e' escluso.
3. **Indebolire una regola in una sottoclasse non si puo', ed e' voluto.** Un invariante puo' solo
   rafforzarsi scendendo nella gerarchia: se la sottoclasse ha bisogno di violare una regola della
   superclasse, la regola sta troppo in alto e va spostata giu'. Chi vuole comunque spegnere una
   famiglia di regole ha gia' la via legittima: metterle in un viewpoint di validazione suo e
   disattivarlo (R-VAL-2, R-VAL-5), che e' una scelta esplicita e visibile invece di una
   soppressione implicita.

L'accumulo rende anche l'ereditarieta' multipla un non problema: due superclassi portano le loro
regole e valgono tutte, senza nessuna gerarchia di precedenza da definire.

**Contesto dichiarato**: l'ambiente mostra sempre `self: <Classe>` sopra il corpo. Il contesto e'
parte del significato della regola, non della selezione corrente.

---

## 5. Semantica di valutazione

**Tri-stato**: vero, falso, non valutabile. Il terzo valore non e' una violazione e non compare
tra i problemi del modello.

JjEL non ha un tri-stato e la navigazione su un assente **lancia** `JjelEvaluationError`
(misurato, referto §punto 2). Il tri-stato si costruisce quindi al confine della regola: il
motore cattura l'eccezione e la mappa su *non valutabile*, mai su violazione. Il linguaggio non
si tocca.

### 5.1 Il verdetto pretende un booleano (R-VAL-13)

**Il valutatore non converte nulla.** Se il corpo della regola non restituisce un booleano, il
risultato non e' un verdetto: e' un difetto della regola, e va sul canale di authoring insieme
agli errori di compilazione (R-VAL-7). Nessuna coercizione, nessuna terza semantica di truthiness.

Misurato allo Step 0 (`discovery_2026-09-08_verdetto_booleano.md`, sonda 42/42):

- `forall t in coll: pred` restituisce un array. `[true, false, true]` risulta **vero per tutte le
  vie** (`if`, `not`, `and`, `implies`, `Boolean()`): una regola violata verrebbe dichiarata
  soddisfatta in silenzio.
- L'array vuoto e' **falso** per la truthiness dell'evaluator: la verita' vacua e' rotta nel verso
  opposto, e uno stato senza transizioni risulterebbe violante.
- I due convertitori esistenti (`JjelEvaluator.isTruthy` e il `Boolean()` di JS usato da JjTL in 9
  siti e da JjScript) divergono su **un solo valore**, `[]`, che e' esattamente quello in gioco.

Aggiungere al validatore una regola di conversione propria produrrebbe una **terza** semantica in
un sistema che ne ha gia' due che divergono, e la produrrebbe nel sottosistema che meno puo'
permettersi un verdetto silenziosamente sbagliato. La forma esplicita e' misurata e funziona:
`coll.all(x => pred)` restituisce un booleano e distingue i casi.

**Costo, dichiarato**: la Tabella 7.5 del libro va corretta nella terza riga, che diventa
`ownedTransitions.all(t => t.nextState != null)`. Va corretto comunque, a prescindere da questa
decisione: il paragrafo che afferma che «le regole di truthiness dell'evaluator fanno funzionare
la cosa in pratica» e' misurato falso.

Il costrutto unico di JjEL non e' in discussione: `forall` resta uno solo e continua a calcolare.
Cambia soltanto che al confine fra chi calcola e chi decide il tipo e' esplicito.

### 5.2 I tre ingressi del non valutabile (R-VAL-13)

Catturare `JjelEvaluationError` non basta. Il tri-stato ha tre ingressi, e tutti e tre danno **non
valutabile**, mai violazione:

1. l'eccezione di valutazione;
2. un risultato che non e' un booleano (compreso l'array vuoto che `forall` restituisce su un non
   array, cioe' il caso dell'istanza malformata);
3. una diagnostica di identificatore assente, che passa dai warning di `jjelEvalWithDiagnostics` e
   non dalle eccezioni.

**Euristica per separare il modello incompleto dalla regola rotta**, senza analisi statica: una
regola non valutabile su **tutte** le istanze del suo contesto e' segnalata come sospetta sul
canale di authoring; non valutabile su alcune e' soltanto non valutabile.

**Costo della scelta, dichiarato**: un refuso nel nome di una feature diventa a runtime
indistinguibile da un modello incompleto. La mitigazione non e' a runtime ma in authoring (§10).

**Due canali separati, mai mescolati**:

- una regola che non compila, che nomina una feature inesistente sulla classe di contesto, o che
  usa un nome riservato, e' un **difetto della regola**. Si mostra nell'ambiente di authoring,
  accanto al corpo;
- una regola che vale e risulta falsa su un'istanza e' una **violazione del modello**. Va nel
  registro dei problemi.

Il registro dei problemi non e' mai il posto dove si scopre che una regola e' scritta male.

---

## 6. Attivazione a due livelli (R-VAL-5)

Due flag indipendenti; una regola e' in vigore se e solo se entrambi sono attivi.

- **Viewpoint attivo**: scelta del progetto, non proprieta' del viewpoint, cosi' che un viewpoint
  riusabile (una libreria di convenzioni) possa essere attivo in un progetto e non in un altro.
- **Regola attiva**: proprieta' della regola dentro il suo viewpoint. Una regola disattivata
  individualmente **resta disattivata** quando il viewpoint viene riattivato.

Disattivare non e' cancellare, e la differenza deve restare visibile.

**Guardia obbligatoria**: la superficie dove si leggono le violazioni dichiara sempre quante
regole sono inattive e quanti viewpoint sono spenti. Una validazione che si puo' spegnere in
silenzio e' una validazione di cui non ci si puo' fidare: un progetto che valida contro tre
regole su undici deve dirlo da solo.

---

## 7. Superficie di authoring

**Ambiente dedicato**, con la stessa forma del View Designer per la sintassi e dell'editor delle
trasformazioni per JjTL: da un lato le classi del metamodello, dall'altro le regole, corpo in
Monaco.

**Non nel rail di destra** insieme alle proprieta' della classe (R-VAL-1). Sul nodo resta un
indicatore discreto con il numero di regole che la classe porta; nel rail al piu' una riga in
sola lettura che apre l'ambiente, mai un editor.

**Controesempi dal vivo**: mentre si scrive una regola, l'ambiente mostra su quali istanze del
modello corrente tiene e su quali cade. E' la feature che giustifica una superficie propria: nel
rail non ci sarebbe stato lo spazio, e un invariante scritto alla cieca si scopre sbagliato
giorni dopo, su un modello altrui.

**Progressive disclosure**: l'ambiente e' materia da language designer e vive in modalita'
Advanced. Chi impara non lo incontra.

**Aggancio futuro, non prima fetta**: il completamento dei nomi di feature dentro Monaco e'
alimentato dallo stesso risolutore statico di §10, che va quindi tenuto separato dal controllo e
riusabile. Jjodie che redige una regola dal linguaggio naturale e' il quinto uso dell'AI e viene
dopo che la forma scritta a mano funziona.

---

## 8. Superficie delle violazioni

Le violazioni entrano nel **registro dei problemi esistente** come nuovo produttore, al prezzo di
un membro in piu' nella union `NodeProblemKind`. L'innesto e' pulito: `ownerModelId` e
`getProblemIdsOwnedBy` filtrano per kind e per modello. Nessun pannello proprietario.

**Vincolo di scopo, scoperto in discovery**: `ValidationPill` non e' montata dal 2026-08-26
(`Toolbar.tsx:26`, zero siti di mount). Oggi non esiste un posto dove leggere l'elenco delle
violazioni. La prima fetta deve quindi comprendere una superficie di lettura, rimontando la pill
o facendo una lista minima. La decisione appartiene alla corsia di triage (§13).

### 8.1 Perimetro e i tre numeri (R-VAL-14)

**Perimetro**: si valuta il **modello aperto**, non tutti i modelli conformi del progetto. La
validazione dell'intero progetto e' un comando esplicito a se', fuori dalla prima fetta: con
undici modelli target in un progetto reale il costo si moltiplica e la superficie dovrebbe dire a
quale modello appartiene ogni voce.

**La superficie dichiara sempre tre numeri**, non solo l'elenco:

1. le violazioni, che sono le voci;
2. quante regole sono **inattive**, per la guardia di R-VAL-5;
3. quante valutazioni sono risultate **non valutabili**.

Il terzo chiude l'ultima strada silenziosa, e la misura dello Step 2 mostra perche' serve: sullo
stesso modello rotto, il corpo nella forma del libro produce zero violazioni e tre non valutabili,
mentre la forma con `.all(...)` produce una violazione. Senza quel numero l'autore della prima
forma vedrebbe **silenzio**, che e' indistinguibile da un modello valido. L'euristica del sospetto
(§5.2) copre solo il caso limite in cui la regola e' non valutabile su tutte le istanze; il numero
copre anche il caso parziale. Restano voci non elencate una per una: e' un contatore, non una
lista di problemi del modello.

### 8.2 L'estensione coincide con il perimetro validato (R-VAL-15)

`X.instances` dentro il corpo di una regola vede le istanze del **modello che si sta validando**,
non quelle del progetto. Le due cose vanno tenute uguali, e la ragione e' una regola di cardinalita'
qualunque: `(forall s in State.instances such that s.isInitial).size == 1` su un progetto che
contiene due macchine a stati, ciascuna con il suo stato iniziale, conterebbe **due** e
dichiarerebbe violate entrambe. E' esattamente la prima invariante della Tabella 7.5 del libro, e
il progetto di prova su beta contiene undici modelli target: il caso non e' teorico.

Il contesto di valutazione puo' restare quello di progetto per tutto il resto (le classi del
metamodello, la risoluzione dei nomi): a dover coincidere con il perimetro validato e'
**l'estensione**, cioe' l'insieme che una quantificazione attraversa. Verifica minima: due modelli
della stessa lingua nello stesso progetto, uno stato iniziale ciascuno, la regola non deve
violare.

**Misurato il 2026-09-09: la verifica e' rossa.** `State.instances` contiene gli stati di tutti i
modelli del progetto, e la prima invariante del libro viola su un modello sano. Il perimetro delle
**istanze validate** invece e' corretto (controllo positivo: una regola su `isInitial` viola su una
sola delle due istanze del modello aperto), quindi il difetto e' solo nell'estensione, come §8.2
prevedeva.

**La restrizione vive dentro `buildEvalContext`, con un parametro opzionale che di default lascia
il comportamento di oggi**, non come filtro applicato dopo sul valore di ritorno. Il filtro dopo
sarebbe contenuto nella corsia, ma dovrebbe enumerare i quattro posti in cui l'estensione vive
(`variables.instances`, `instances`/`allInstances`/`instanceCount` sulle shell, le istanze
qualificate per nome, la mappa delle ambiguita'), cioe' duplicare fuori dal modulo una conoscenza
che e' del modulo: il giorno in cui l'estensione compare in un quinto posto la validazione lo manca
**in silenzio** e torna a produrre verdetti sbagliati. La mappa delle ambiguita' e' poi dato
derivato, e ricalcolarla fuori sarebbe logica duplicata. Vincolo: l'identita' per riferimento
(`self.instanceOf == State`) deve reggere, quindi le shell si costruiscono gia' ristrette, non si
ricostruiscono dopo.

### 8.3 La superficie dichiara cosa non ha girato (R-VAL-15)

I tre numeri di §8.1 sono un caso particolare di un impegno piu' generale: **la superficie dice
sempre quanto e' parziale il verdetto che stai leggendo**. Non ha girato una regola disattivata,
non ha prodotto verdetto una valutazione non valutabile, e non ha girato una regola che non
compila. Le tre cose hanno pesi diversi ma la stessa conseguenza per chi legge: la validazione che
vede copre meno di quanto sembra.

Nello scheletro la regola che non compila e' dichiarata in una riga in fondo al modale invece che
come quarto numero, e va bene cosi'. Ma non e' una toppa da togliere quando arriva il canale di
authoring dello Step 4: quel canale serve a **chi scrive** la regola, mentre questa riga serve a
**chi legge** il verdetto, che puo' essere un'altra persona in un altro momento. La forma visiva si
decidera' con il resto della superficie; l'impegno a dichiararlo resta.

---

## 9. Rivalutazione e costo

`AFTER_TRANSACTION` riceve solo `newState` e **non dice quali oggetti sono cambiati** (referto,
punto 5). Il pattern reale e' firma-selettore piu' debounce, con rivalutazione **totale**.

Prima fetta: comando esplicito di validazione, piu' rivalutazione totale con debounce all'inerzia.
Il costo va **misurato** su un metamodello realistico all'inizio della Fase 2, con un budget
dichiarato: se lo sfora, si degrada al solo comando esplicito invece di rallentare l'editing.
Non si assume che la rivalutazione totale sia accettabile.

Seconda fetta: un visitor sull'AST JjEL restituisce i nomi delle feature toccate da una regola
(non le coppie oggetto-feature che l'IR concretizza) e serve da filtro grossolano per saltare le
regole che non guardano niente di cambiato. E' lo stesso visitor di §10, pagato una volta.

---

## 10. Nomi riservati e controllo statico

Misurato (micro-discovery): **18 keyword su 18** in JjEL rompono dopo un punto, **25 su 25** in
JjTL, e le due tabelle divergono; l'unione e' di 29 parole. I nomi che una feature porta quasi
sempre (`type`, `name`, `value`, `values`, `abstract`, `owner`, `label`, `father`) **non** sono
keyword. La via d'uscita `self["in"]` funziona e restituisce il valore giusto. Nessun controllo,
a nessuno dei tre livelli, impedisce oggi di chiamare una feature come una keyword.

Conseguenze per questa spec:

1. Il **controllo statico in authoring** risolve i nomi di feature contro la classe di contesto e
   ha due mestieri: segnalare il refuso, e segnalare il nome riservato indicando la forma
   `self["in"]`. Trasforma un errore di parse incomprensibile in un avviso mentre si scrive.
2. Il controllo **non puo' avere una terza copia** della lista: legge un elenco unico dei nomi
   riservati, esportato da un modulo che entrambi i lexer importano. La consolidazione di
   quell'elenco e' **prerequisito** di questa fetta; la riparazione del lexer non lo e'.
3. `true`, `false` e `null` sono l'unico caso in cui il sistema **sbaglia in silenzio**: parsano
   come letterali e una feature con quel nome restituisce il valore sbagliato senza errore. Per un
   validatore e' la categoria peggiore, perche' produce un verdetto autorevole calcolato sul
   valore sbagliato. Vanno intercettati alla creazione del nome con una diagnostica di CHECK 12,
   non un rifiuto della scrittura (R-VAL-4 vale anche qui).

---

## 11. Fette

**Fetta 1**. Viewpoint di validazione multipli; regole con proprietario di sola classe; corpo
JjEL con tri-stato al confine; messaggio con segnaposto; due severita'; attivazione a due
livelli con la guardia di §6; ambiente di authoring dedicato con contesto dichiarato, ereditate
in sola lettura, diagnostiche accanto al corpo e controesempi dal vivo; indicatore sul nodo;
violazioni nel registro esistente; superficie di lettura; comando esplicito piu' rivalutazione
totale misurata.

**Fetta 2**. Filtro di rivalutazione dal visitor dei nomi di feature; lint del modellatore come
viewpoint di validazione dedicato; completamento dei nomi in Monaco.

**Fetta 3 e oltre**. Vincoli con proprietario il modello (richiede uno scope non ancorato nel
registro e una superficie); waiver per singola istanza; Jjodie che redige regole.

**Fuori scope, esplicito**: il waiver per singola istanza non e' definito e non va introdotto per
approssimazione: tocca la chiave del registro e va progettato quando lo si vuole davvero.

---

## 12. Limiti dichiarati

1. Una regola con un refuso a runtime e' indistinguibile da un modello incompleto (§5). Mitigato
   in authoring, non risolto.
2. I nomi riservati sono l'unione di due tabelle divergenti: una feature `from` o `to` naviga in
   JjEL e si rompe in JjTL (§10).
3. La rivalutazione e' totale finche' non arriva il filtro della fetta 2 (§9).
4. Un metamodello esportato in `.ecore` non porta con se' le regole. L'export perde comunque le
   annotazioni in silenzio oggi (`includeAnnotations` dichiarata e mai letta), quindi non e' una
   regressione, ma va detto.

---

## 13. Prerequisiti

1. **Triage della validazione esistente**: `ValidationPill` non montata dal 2026-08-26 e
   violazioni di modello scartate in `conformanceToProblems.ts:43`. Una parte della validazione
   che diamo per funzionante calcola e butta via. Va davanti a tutto il resto.
2. **Consolidazione dei nomi riservati** in un elenco unico importato da entrambi i lexer, piu'
   la diagnostica sui tre letterali e il messaggio di parser che nomina la parola e indica
   `self["in"]`. Primo prompt di codice, dopo il rilascio del 15 settembre.
3. **Riparazione del lexer** (keyword dopo il punto): corsia separata, non prerequisito.

Nessuna di queste corsie va aperta prima del rilascio della 3.0.

---

## 14. Domande aperte

Nessuna. Le due che restavano sono chiuse: il cartello nel rail da R-VAL-11 (non si fa), il
supertipo comune da R-VAL-6-bis (non esiste e non serve: tipo parallelo).
