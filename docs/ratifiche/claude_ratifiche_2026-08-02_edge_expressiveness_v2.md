# Ratifiche: arco "Espressivita' edge v2"

**Data**: 2026-08-02 (subito dopo la chiusura di E-obj)
**Stato**: ratificato in chat da Alfonso su tre punti espliciti (contenuto del custom, doppia forma delle cardinalita', label non editabile per default). Le restanti decisioni sono impegni presi con rationale, ribaltabili dai findings della discovery.
**Rapporto con l'addendum edge**: `spec_2026-07-26_ir_edge_authoring_addendum.md` §5 elencava routing configurabile e famiglia marker estesa come slice future dichiarate. Questo documento le apre e ne aggiunge una terza (label agli estremi ed editabilita').

## Perimetro dell'arco

Tre esigenze emerse dopo la verifica di E-obj, che insieme fanno un arco unico sull'espressivita' degli edge, non una coda di dettagli:

1. **Stile di routing autorabile**: manhattan, direct, bezier. Vale per entrambe le nature.
2. **Label**: flag di editabilita' piu' chiusura della scrittura morta; label agli estremi (source e target) oltre a quella centrale.
3. **Terminazioni**: anteprima grafica nelle Select, famiglia estesa (zampe di gallina ER e altro), opzione custom con path SVG fornito dall'utente.

## R-A1 — Tre slice, nomi e ordine indicativo

L'arco si divide in **E-mark**, **E-lab**, **E-route**, in continuita' col naming E0 / E-ref / E-obj.

- **E-mark**: registro dei marker, anteprima nelle Select, famiglia estesa, opzione custom.
- **E-lab**: label agli estremi, flag di editabilita', percorso di scrittura verso il modello.
- **E-route**: routing autorabile (manhattan / direct / bezier).

Ordine per rapporto valore-rischio, non per valore assoluto: E-mark e' autocontenuto e non tocca geometria ne' persistenza; E-lab tocca il percorso di scrittura verso JjOM; E-route e' l'unico che puo' entrare nella geometria. **L'ordine e' indicativo e la discovery puo' ribaltarlo**: se le molteplicita' agli estremi risultassero piu' urgenti sul canvas reale (un class diagram senza molteplicita' e' monco), E-lab passa davanti.

## R-A2 — Il registro dei marker e' la mossa unificante

Le tre richieste sul punto terminazioni sono una sola: estrarre un **registro di definizioni di marker nominate**, ciascuna col suo path e i suoi metadati geometrici, e farlo consumare da tutti.

Rationale: oggi le terminazioni sono un enum chiuso di sei valori che il renderer sa disegnare per conoscenza propria. Con il registro, l'anteprima nella Select disegna **lo stesso path** che disegna il canvas, quindi preview e rendering non possono divergere; la famiglia estesa diventa righe di dati invece che codice; e il custom diventa una voce di registro fornita dall'utente invece che dal sorgente. Senza il registro sarebbero tre innesti separati, ognuno con la sua possibilita' di driftare.

## R-A3 — Contratto del marker custom (ratificato)

- Si accetta **solo il contenuto dell'attributo `d`**. Mai un frammento `<svg>`, `<marker>` o markup di qualunque genere: l'input non deve poter iniettare nodi nel DOM.
- Validazione contro la grammatica dei path (comandi ammessi, numeri, separatori), con errore eager nel pannello. Un `d` non valido equivale a marker assente, non a marker rotto.
- **Sistema di coordinate dichiarato**: casella di riferimento fissa e punto di aggancio dichiarato, entrambi documentati nella UI accanto al campo. Senza questo contratto ogni marker custom nasce disallineato rispetto alla linea e l'utente attribuisce allo strumento un errore che e' di specifica mancante. La casella concreta la fissa la discovery, leggendola dal sistema di marker gia' in uso.
- Il custom eredita il colore della linea come gli altri marker (comportamento E0b), salvo evidenza contraria dalla discovery.

## R-A4 — Cardinalita' ER: entrambe le forme, in due slice diverse (ratificato)

- **Glifi** (zampe di gallina e parenti): sono marker a tutti gli effetti, entrano nel registro, quindi in **E-mark**.
- **Molteplicita' testuali** (`0..1`, `1..*` e simili): non sono marker, sono **label agli estremi**. Oggi `edge.labels` conosce solo `center`, quindi servono `source` e `target` come estensione additiva della spec delle label, in **E-lab**.

La distinzione non e' terminologica: separa un lavoro di dati da un lavoro di geometria e di spec, e tenerle insieme farebbe gonfiare una slice sola fino a renderla non verificabile.

## R-A5 — Label non editabile per default, subito (ratificato)

Micro-fix immediato, che precede tutte e tre le slice: la label degli edge **IR-autorati** smette di essere editabile, con il gate su `data.irEdgeViewId` che il progetto usa gia' da E0.

Rationale: oggi la label e' editabile perche' nessuno ha mai deciso che non lo fosse, e la modifica non raggiunge il modello. E' una scrittura morta, cioe' il modo peggiore in cui una UI puo' sbagliare: l'utente crede di aver cambiato il modello e ha cambiato dei pixel. Il gate sugli edge IR e' essenziale per non toccare il comportamento delle edge classiche, che non sono oggetto di questa segnalazione.

## R-A6 — L'editabilita' e' una capacita' condizionata, non una checkbox

Quando il flag arrivera' (E-lab), va abilitabile **solo se la sorgente della label lo sostiene**: un literal non ha niente da riscrivere, un path lo ha solo se risolve a uno slot scrivibile singolo. Un flag libero ricreerebbe la scrittura morta con il timbro dell'autore sopra.

Asimmetria da verificare in discovery: per **object-as-edge** il bersaglio della scrittura e' ben definito, perche' l'edge sintetico porta `data.irObjectId` e da li' si risale all'oggetto reificato e allo slot nominato dal path (e' il caso segnalato da Alfonso, il nome dell'istanza). Per **reference-as-edge** non esiste un oggetto proprio e il bersaglio non e' ovvio: probabile che il flag vada ristretto o disabilitato su quel ramo.

## R-A7 — E-route riapre D3

Il routing era congelato per una ragione precisa: tenere E0, E-ref ed E-obj interamente fuori dalla critical zone. Riaprirlo e' legittimo ma richiede di sapere prima se direct e bezier possono riusare gli handle scelti dalla logica ortogonale attuale, cambiando solo il path disegnato, oppure se pretendono una politica di ancoraggio propria. Nel primo caso la modifica resta nel renderer; nel secondo entra `portDistribution` e serve **go-ahead esplicito piu' Layer Impact Report**.

Da decidere con la discovery, non prima: che fine fanno i waypoint e i side pin persistiti in `DVertex.irEdgeLayout`, che sono un artefatto ortogonale, quando la stessa edge passa a bezier o a direct.

Nota a favore: il carrier esiste gia'. `edge.routing` e' in `EdgeViewIR` (`irTypes.ts:206`) e `compileEdgeView` lo compila con default `null` (`irCompile.ts:440`), quindi il lato authoring e' un Select da tre voci e la scelta vale per entrambe le nature senza duplicazione.

## R-A8 — Metodo

Una **discovery unica sul substrato condiviso** (come il renderer disegna linea, marker e label; dove finisce oggi l'edit della label; come e' calcolato il path ortogonale), poi **implementazioni separate** slice per slice. Le tre slice partono dagli stessi due o tre file: tre discovery separate rileggerebbero tre volte le stesse righe e produrrebbero tre mappe parziali dello stesso territorio.

## Vincoli che restano in piedi dall'arco precedente

- La natura di una edge view resta **strutturale**, derivata da `!!(sourceExpr && targetExpr)`. Nessuna delle tre slice introduce un campo di natura.
- La scrittura atomica dei capi (R-1 di E-obj) non va indebolita.
- `MatchingSection` resta non allargata (R-3 di E-obj, emenda D8).
- Ogni estensione dello schema deve essere **additiva e opzionale**, senza bump di `irVersion`, salvo evidenza contraria da portare in chat prima di procedere.
