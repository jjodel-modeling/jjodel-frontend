# R-RAIL-45: un ordine si legge nel dato, non nella posizione

**Nome del documento prompt**: 2026-08-13 16:18
**Tipo**: docs. **Zero file sorgente toccati.**
**Base attesa**: il ramo `alfonso-frontend-jjtl` dopo `0f7eed2e7` (commit 4 del task delle 15:42).
**Un commit solo.** Nessun push.

---

## Regola zero

**Nessuna fase di discovery.** Il testo da scrivere è fornito verbatim e il punto di inserimento
è indicato per contenuto. Se il contenuto atteso non c'è dove dovrebbe, **fermati e chiedi**:
significa che il prompt ha un difetto. Non produrre discovery report.

**Due file, non uno di più**: `docs/decisions.md` e `docs/claude-code-log.md`. Nessun file
sorgente, nessun `AGENTS.md` (questo task non tocca `CLAUDE.md`, quindi `gen:agents` non entra
in scena).

**Il repo è conteso.** Altre sessioni stanno scrivendo su `docs/decisions.md` in questo momento,
almeno una serie `R-IRN` non committata, e su `docs/claude-code-log.md` ci sono due entry
estranee non committate (14:00 e 16:00) con i loro report non tracciati. **Non toccare niente di
tutto questo.** Non committarlo, non riordinarlo, non ripulirlo. Se il tuo staging lo
intercetta, usa il pattern di CLAUDE.md §6.1 e ripristina lo stato altrui esattamente come lo
hai trovato.

---

## COSA

### 1. Verifica il numero prima di scriverlo

Su `8cc34ed` l'ultimo id della serie era R-RAIL-43, e il task delle 15:42 ha aggiunto R-RAIL-44.
Quindi **45 dovrebbe essere libero**. Ma il file è conteso, quindi verificalo al momento
dell'esecuzione invece di fidarti di questa riga:

```
command grep -o "R-RAIL-[0-9]*" docs/decisions.md | sort -t- -k3 -n | tail -1
```

Se 45 risulta occupato, prendi il primo libero, **rinumera il testo qui sotto di conseguenza** e
dichiaralo nelle `Notes` della entry di log. È già successo una volta su questo ramo: R-RAIL-36
entrò come 36 e non come 34 perché il passo 4 aveva nel frattempo occupato 34 e 35. Non
duplicare un numero.

### 2. La voce

Va inserita in coda alle voci attive della sezione `## Arco rail destro`, **subito dopo l'ultima
riga di R-RAIL-44** (che termina con «si misura in **un tema**, light.») e **prima** della riga
vuota che precede `## Superate`.

Testo, da incollare senza modifiche a parte l'eventuale rinumerazione del punto 1:

```
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
  per il timestamp dell'intestazione, mai per posizione; e in un file che più sessioni scrivono,
  ogni affermazione della forma «X sta in cima, in fondo, in posizione N» è una misura con una
  data di scadenza, da riderivare al momento dell'esecuzione e non da ereditare dal prompt. Ne
  segue una regola su come si scrivono i prompt, non solo su come si eseguono: **si dà il
  criterio e si lascia che l'esecutore ne derivi le posizioni.** Rapporto con le regole vicine,
  da non lasciare implicito: è la stessa specie del conteggio preso su una finestra troncata
  (CLAUDE.md §5), perché in entrambi i casi si misura la disposizione al posto del contenuto;
  R-RAIL-28 copre le asserzioni di assenza e di presenza, R-RAIL-36 il caso in cui si misura
  l'elemento sbagliato, R-RAIL-43 la stima mai eseguita; questa copre **l'osservazione promossa
  a invariante**.
```

**Separatore**: la voce usa il trattino lungo `—` (U+2014) fra id e testo, come tutte le voci
del file. Non va "corretto" applicando le regole di scrittura dei documenti.

### 3. Entry di log

In cima a `docs/claude-code-log.md`, formato delle entry vicine, validato da `check:docs`.
Tipo `docs`.

- **Prompt document name**: `2026-08-13 16:18`
- **Regressions**: nessuna possibile, nessun file sorgente toccato
- **Layer Impact Report**: `not-required`
- **Smoke visivo**: `non applicabile`
- **Files touched**: `docs/decisions.md`, questo file

### 4. NON ruotare

Il log è sopra soglia e resterà sopra soglia dopo questa entry. **È voluto.**

Misura e dichiara nelle `Notes`: quante entry attive ci sono prima e dopo, e quante delle attive
sono non committate e non tue. Il debito di rotazione non è tuo da sciogliere, perché le entry
in eccesso appartengono a sessioni concorrenti e i loro discovery report non sono ancora
tracciati: ruotarle significherebbe archiviare lavoro altrui prima che il suo autore lo abbia
committato. Scrivi questo nelle `Notes` come motivazione esplicita del mancato lotto, così la
prossima sessione trova la ragione e non riapre la domanda.

---

## COME

- `git add docs/decisions.md docs/claude-code-log.md`. Mai `git add .`.
- Se lo staging del log presenta un hunk unico che include le entry estranee, usa il pattern di
  CLAUDE.md §6.1 e **ripristina il loro diff byte per byte** dopo il commit, come nel task delle
  15:42.
- **Un commit solo**: `docs: R-RAIL-45, un ordine si legge nel dato e non nella posizione`
  (rinumera il messaggio se il punto 1 ha cambiato l'id).
- Nessun push, nessun `--no-verify`.
- **Gate**: `npm run check:docs` deve passare. Il warning preesistente su
  `Corregge: 2026-08-11 17:34` resta e non va toccato: è una voce aperta di cui si occupa
  Alfonso, non questo task.

## Hard stop

Fatto il commit, fermati. Riporta l'hash, l'id effettivamente assegnato alla voce, i conteggi
del log prima e dopo con quante entry non sono tue, e l'esito di `check:docs`.

---

## RIFERIMENTI

**Da dove viene la voce.** Dall'esecuzione del prompt delle 15:42, che ha prodotto i quattro
commit da `40472f93b` a `0f7eed2e7`. L'inversione nel working tree è stata trovata e dichiarata
dall'esecutore, non dall'autore del prompt: la voce registra un difetto del prompt, non
dell'esecuzione, e va scritta in quei termini.

**Cosa NON è in scope.**

- La correzione del `Corregge` che non risolve. Il valore giusto è già scritto e verificato nella
  nota (6) della entry del 12/8, ma correggerlo significa editare il record di un task passato, e
  quella è una decisione di Alfonso.
- Il debito di rotazione e le due entry estranee. Vedi punto 4.
- Il delta non committato su `properties-with-tree-view.scss`.
- La serie `R-IRN` e qualunque altro lavoro concorrente in `docs/decisions.md`.
