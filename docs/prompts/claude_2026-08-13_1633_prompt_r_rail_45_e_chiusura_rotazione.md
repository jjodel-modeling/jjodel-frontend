# R-RAIL-45, la entry fuori posto, e la rotazione del ventiquattresimo lotto

**Nome del documento prompt**: 2026-08-13 16:33
**Tipo**: docs. **Zero file sorgente toccati.**
**Base attesa**: `alfonso-frontend-jjtl` a `8dc56bf` o discendente.
**Tre commit**, in ordine. Nessun push.

---

## Regola zero

**Nessuna fase di discovery.** Il testo da scrivere è fornito verbatim e i criteri di selezione
sono dati esplicitamente. Se una misura di controllo non torna, **fermati e chiedi**: significa
che il prompt ha un difetto o che l'albero si è mosso. Non produrre discovery report.

**Tre file, non uno di più**: `docs/decisions.md`, `docs/claude-code-log.md`,
`docs/claude-code-log-archive.md`. Nessun sorgente, nessun `CLAUDE.md`, quindi `gen:agents` non
entra in scena e `AGENTS.md` non va toccato.

**I numeri di controllo di questo prompt sono misurati su `8dc56bf`** e servono a verificare che
l'albero sia quello atteso, non a sostituire la misura. Rimisurali tutti.

---

## Contesto minimo

Il log delle sessioni Claude Code è ordinato **newest-first per giorno**. Una sessione
concorrente ha appeso in fondo al file la entry `2026-08-13 16:00`, che è la più recente in
assoluto, e quella entry è ora committata in quella posizione. Il file quindi contraddice il
proprio invariante, e una rotazione calcolata per posizione archivierebbe la entry più nuova
senza far scattare nessun gate.

Questo task fa tre cose: scrive a registro la regola che quell'episodio ha prodotto, rimette la
entry al suo posto, e salda il debito di rotazione.

---

## COSA e DOVE

### Commit 1: R-RAIL-45 in `docs/decisions.md`

**Verifica il numero prima di scriverlo.** Su `8dc56bf` l'ultimo id della serie è R-RAIL-44,
quindi 45 dovrebbe essere libero. Il file è conteso (una serie `R-IRN` ci è arrivata da
un'altra sessione), quindi controlla:

```
command grep -o "R-RAIL-[0-9]*" docs/decisions.md | sort -t- -k3 -n | tail -1
```

Se 45 risulta occupato, prendi il primo libero, rinumera il testo e il messaggio di commit, e
dichiaralo nelle `Notes`. Precedente su questo ramo: R-RAIL-36 entrò come 36 e non come 34
perché il passo 4 aveva occupato 34 e 35 nel frattempo.

**Dove**: in coda alle voci attive della sezione `## Arco rail destro`, subito dopo l'ultima
riga di R-RAIL-44 (termina con «si misura in **un tema**, light.») e prima della riga vuota che
precede `## Superate`.

Testo, verbatim salvo la rinumerazione:

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
```

**Separatore**: la voce usa il trattino lungo `—` (U+2014) fra id e testo, come le altre 44. Non
va "corretto" applicando le regole di scrittura dei documenti.

**Non toccare** la serie `R-IRN` né qualunque altro lavoro concorrente presente nel file.

**Commit**: `docs: R-RAIL-45, un ordine si legge nel dato e non nella posizione`

---

### Commit 2: rimettere al suo posto la entry fuori ordine

**Zero modifiche di contenuto.** Si sposta un blocco, non si riscrive.

La entry il cui `**Prompt document name**` è `2026-08-13 16:00` (intestazione: «docs: discovery
dei siti di creazione delle view e presupposti del collasso IR-nativo») si trova **in fondo** a
`docs/claude-code-log.md`. È la più recente del file. Spostala **in cima**, subito sotto il
titolo `# Claude Code Session Log` e sopra la entry che oggi è prima.

Sposta il blocco intero: intestazione, tutti i campi, e i separatori che lo delimitano, così che
il file resti ben formato e `check:docs` continui a parsarlo.

**Quello che NON va fatto, ed è la parte che conta**: non riordinare il resto del file. Dentro
una giornata l'ordine non è monotono e non deve diventarlo. Misurato su `8dc56bf`, il blocco
`2026-08-12` corre `17:00, 17:30, 18:00` in senso crescente, e le `2026-08-13` corrono
`14:00, 15:42, 14:05, 13:35, 01:18`. **Non sono errori da sistemare**: sono il record com'è
stato scritto, e riordinarlo sarebbe refactoring opportunistico su un archivio. Si sposta la
sola entry che rompe l'invariante di giorno, cioè una entry `2026-08-13` finita sotto le
`2026-08-11`.

Controllo dopo lo spostamento: le date delle intestazioni, lette dall'alto al basso, devono
essere non crescenti **a livello di giorno**. Se resta un'altra violazione di giorno, fermati e
segnalala invece di correggerla.

**Commit**: `docs: la entry del 13/8 16:00 torna in cima, l'ordine del log è per giorno`

---

### Commit 3: entry di questo task e rotazione

**3a. Entry di log** in cima al file, sopra quella appena spostata, nel formato delle entry
vicine e validato da `check:docs`. Tipo `docs`.

- **Prompt document name**: `2026-08-13 16:33`
- **Regressions**: nessuna possibile, nessun file sorgente toccato
- **Layer Impact Report**: `not-required`
- **Smoke visivo**: `non applicabile`
- **Files touched**: i tre file di questo task

**3b. Rotazione**, e l'aritmetica va fatta in questo ordine:

1. Misura le intestazioni attive prima di tutto: `command grep -c "^## " docs/claude-code-log.md`.
   Controllo atteso su `8dc56bf`: **22**. I commit 1 e 2 non cambiano questo numero.
2. Aggiungi la entry di 3a. Diventano **23**.
3. La soglia è **20**, quindi vanno spostate **3** entry.
4. **Le tre da spostare si scelgono per data, non per posizione.** Sono le tre più vecchie del
   file. Controllo atteso: le tre `2026-08-11`, che portano `22:45`, `21:40` e `20:30`, e sono
   le uniche `2026-08-11` rimaste. Dopo lo spostamento la più vecchia attiva deve essere una
   `2026-08-12`, quindi **il taglio cade esattamente sul confine di giornata**. Se non cade lì,
   fermati: qualcosa non torna.
5. Le tre entry si accodano in fondo a `docs/claude-code-log-archive.md`, che è append-only in
   coda. Controllo atteso: **757** intestazioni prima, **760** dopo. Misura entrambi.
6. Nelle `**Notes**` registra: quali entry sono state spostate con la loro chiave, i conteggi di
   attivo e archivio prima e dopo, e **il fatto che taglio per data e taglio per posizione
   adesso concordano perché il commit 2 ha rimesso in ordine la entry che li faceva divergere**.
   Se qualcosa non concorda, dichiaralo invece di assorbirlo.

Contabilità di contenuto, come nel lotto precedente: righe tenute più righe ruotate più
eventuale riga vuota di coda deve fare il conteggio originale. Riportala.

**Commit**: `docs: log entry e rotazione del ventiquattresimo lotto`

---

## COME

- `git add` per file esplicito. Mai `git add .`.
- **Tre commit separati**, nell'ordine dato.
- Se lo staging del log presenta un hunk unico, usa il pattern di CLAUDE.md §6.1.
- Nessun push, nessun `--no-verify`.
- **Gate**: `npm run check:docs` deve passare dopo il commit 3.
- Il warning preesistente su `Corregge: 2026-08-11 17:34` **resta e non va toccato**: è una voce
  aperta che decide Alfonso. Nota che una delle tre entry ruotate da questo task è
  `2026-08-11 21:40`, che è uno dei due valori corretti candidati per quel campo; la risoluzione
  non ne soffre, perché il gate risolve le chiavi su log attivo **più** archivio
  (`check-docs.ts`, dove l'insieme di risoluzione è costruito su `[...active, ...archived]`).

## Hard stop

Fatti i tre commit, fermati. Riporta: i tre hash, l'id effettivo della voce, i conteggi misurati
di attivo e archivio prima e dopo, le tre chiavi ruotate, e l'esito di `check:docs`.

---

## RIFERIMENTI

**Da dove viene la voce.** Dall'esecuzione del prompt `2026-08-13 15:42`. L'inversione è stata
trovata e dichiarata dall'esecutore, non dall'autore del prompt: la voce registra un difetto del
prompt, non dell'esecuzione, e va scritta in quei termini.

**Perché il commit 2 esiste.** Finché la entry `16:00` resta in fondo, ogni rotazione futura
calcolata per posizione archivia una entry recente, e il gate non se ne accorge perché il
formato resta valido. La voce R-RAIL-45 dice come non caderci; il commit 2 toglie la trappola.

**Cosa NON è in scope.**

- La correzione del `Corregge` che non risolve. Il valore giusto è già scritto e verificato nella
  nota (6) della entry del 12/8, ma correggerlo significa editare il record di un task passato, e
  quella è una decisione di Alfonso.
- Il riordino del file oltre alla singola entry del commit 2.
- Qualunque lavoro concorrente in `docs/decisions.md`, serie `R-IRN` inclusa.
