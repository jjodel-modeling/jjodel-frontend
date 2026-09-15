# Milestone — lo scheletro della validazione e la sezione 5.5 del libro

**Data**: 2026-09-08 · **Natura**: materiale di lavoro, non normativo (HARNESS-DOCS §4.8)
**Normativa di riferimento**: `docs/spec/claude_spec_2026-09-08_user_defined_validation.md`,
serie R-VAL in `docs/decisions.md`
**Corsia**: ramo `validation-skeleton`, fuori dalla release del 15 settembre

## Definizione di fatto

La milestone e' chiusa quando **lo scheletro cammina dentro l'applicazione e la sezione 5.5 del
libro si puo' scrivere**. Non quando i test passano: quando il giro si fa a mano nell'app, sul
semaforo del libro. Tutto cio' che non serve a quel risultato sta fuori, ed e' elencato in fondo.

## Percorso critico

**1. Step 3** (in esecuzione) — comando Validate sul modello aperto, lista delle violazioni nel
registro dei problemi, i tre numeri di R-VAL-14 (violazioni, regole inattive, valutazioni non
valutabili). Chiude con hard stop e verifica visiva di Alfonso.

**2. Step 4** — authoring minimo: il posto da cui una regola si scrive. Monaco per il corpo,
contesto dichiarato in testa (`self: <Classe>`), regole ereditate visibili in sola lettura e
distinte dalle proprie, difetti della regola accanto al corpo e mai nel registro (R-VAL-7). Non
nel rail di destra (R-VAL-1, R-VAL-11).

**3. Prova end to end nell'applicazione** — il gate vero, oggi mancante: il criterio di
accettazione e' misurato a livello di modulo, con fixture. Va rifatto sul semaforo in
`localhost:3000`, in offline: creare il viewpoint dall'interfaccia, autorare l'invariante dello
stato iniziale, togliere `isInitial` e vedere la violazione comparire, rimetterlo e vederla
sparire. Finche' questo giro non e' fatto, «funziona» significa «funziona nei test».

**4. Screenshot per la 5.5** — catturate il 2026-09-09, tre PNG 1500x950 in
`docs/discovery/harness/_tmp_book55_*.png`, ignorate da git. Vanno portate nel repo del libro,
`/Users/alfonso/Documents/Claude/Projects/Jjodel Book/678e1c12660f5f6b2e85fe7b`, cartella
`author/images/`, con i nomi del capitolo 5. **Avvertenza**: quell'albero ha 18 file modificati non
committati piu' `author/audit-2026-09/` non tracciata, WIP di un'altra corsia; qualunque scrittura
li' si committa con pathspec esplicito, mai `git add` largo.

**6. Scrittura della 5.5** — un invariante solo, **esattamente uno stato iniziale**, che e' quello
che il metamodello non sa esprimere; la terza invariante della Tabella 7.5 non serve qui perche' la
molteplicita' di `nextState` la impone gia' e la 5.3 la mostra. Rinvio al capitolo 7 per JjEL, che
a quel punto del libro non e' ancora stato introdotto. Insieme la 5.6, oggi anch'essa un titolo
vuoto.

*Misurato il 2026-09-09*: la 5.6 **e' gia' scritta** (bozza del 2026-09-08) e porta una nota che
avverte di ritoccare l'ultima frase del primo paragrafo quando la 5.5 esiste. Quindi resta da
scrivere la sola 5.5, piu' quella frase.

## In parallelo, non bloccanti

**5. Figura 5.8** — *misurato il 2026-09-09: non e' una figura stantia, e' un segnaposto.*
`ch05-conformance-violation.png` e `ch05-conformance-ok.png` sono due PNG 1400x620 del 26 giugno
con la scritta PLACEHOLDER e la didascalia di cosa andrebbe catturato. Quindi non c'e' niente da
verificare: c'e' da catturare, con un indicatore **vivo**. La `ValidationPill` non e' renderizzata
(`Toolbar.tsx:28`); vivi sono i badge per nodo sul canvas e il punto di conformita' nella status
bar. **Decisione da prendere insieme alla cattura**: il testo della 5.3 dice «the validity
indicator» al singolare, e la frase e' sul modello intero, quindi o si nomina il punto nella status
bar (globale, coerente col testo, ma una figura debole) oppure si nominano entrambi i livelli
(globale piu' l'elemento colpevole), che e' piu' informativo e piu' vero. Raccomandazione:
entrambi, con la 5.3 riscritta di conseguenza. Riguarda la conformance derivata dal metamodello,
non la validazione definita dall'utente: e' del capitolo 5, non di questa corsia.

**7. Correzione del capitolo 7 — FATTA il 2026-09-09**, due commit su `master` del repo del libro:
`8b66b74` `style(ch07)` porta gli otto ritocchi tipografici che erano gia' in albero, con la
dipendenza non committata dichiarata nel messaggio (`\meta` e `\origtexttt` in `commands.tex`, il
colore `codeMeta` in `book.tex`, nessuno dei tre in HEAD, quindi a quel commit il libro non
compila); `c04e108` `docs(ch07)` porta i due interventi su file pulito, piu' un terzo dichiarato:
la frase che elencava i tre idiomi chiamava il terzo «a `forall` projection» e con la riga 3
cambiata sarebbe diventata falsa. Compilazione verificata in directory di scratch, due passate,
exit 0, nessun `Overfull` nelle righe toccate, il rimando risolve a Table 7.5. L'affermazione sul
pannello pianificato, nei due punti in cui compare, e' rimasta ferma: si riscrive dopo il merge.

*Storico, prima di essere fatta*: file e righe individuati il 2026-09-09:
`author/part2/ch08-jjel.tex` (il capitolo 7 del libro), tabella `tab:jjel-invariants` a riga 454,
paragrafo sulla truthiness alle righe ~492-500, sezione 7.7 `sec:jjel-guards` a riga 429. Terza
riga della Tabella 7.5 in
`ownedTransitions.all(t => t.nextState != null)`, e il paragrafo sulla truthiness, che e' misurato
falso (`discovery_2026-09-08_verdetto_booleano.md`) e va corretto a prescindere da qualunque scelta
di design. Nella 7.7, dove oggi si legge che il pannello di validazione e' pianificato e non
costruito, dire con precisione cosa esiste (valutazione su comando) e cosa no (reattivita').

**8. Checkpoint di sessione** — `sessione_CORRENTE.md` nel Project Knowledge e' fermo al 6
settembre e non conosce ne' la serie R-VAL ne' questa corsia. Da fare prima di chiudere la chat,
non dopo.

**9. Decisione sul merge** di `validation-skeleton`, dopo il 15, con il gate da concordare. Nota:
quattro commit di soli docs sono stati portati su `alfonso-frontend-jjtl` con cherry-pick
(`02dcbe554`, `d1e4c0802`, `e96d3440b`, `e0a41c42e`); esistono quindi in due copie con hash
diversi. Se al merge compaiono conflitti su `decisions.md`, `PROTOCOL.md` o la spec, la causa e'
questa e la risoluzione e' tenere la versione gia' presente, non fondere due volte lo stesso testo.

## Fuori dalla milestone

Scritto perche' la tentazione di infilarlo dentro sara' forte.

**Fetta 1 completa**: segnaposto nei messaggi, due severita', controllo statico dei nomi in
authoring, indicatori sul canvas, controesempi dal vivo, rivalutazione automatica con debounce,
modale alla cancellazione della classe (R-VAL-9).

**Prerequisiti e debiti gia' iscritti**: triage di `ValidationPill` e delle violazioni di modello
scartate in `conformanceToProblems.ts:43`; consolidazione dei nomi riservati in un elenco unico;
riparazione del lexer (keyword dopo il punto); riparazione generale delle cartelle di stato
(`reducer.ts:186-188`, con la normalizzazione al caricamento: e' una corsia di migrazione);
divergenza fra `isTruthy` e `Boolean()` su `[]`.

**Fette 2 e 3**: filtro di rivalutazione dal visitor, lint del modellatore come viewpoint proprio,
completamento dei nomi in Monaco, vincoli con proprietario il modello, waiver per singola istanza.

**Documentazione su `docs.jjodel.io`**: non ha senso scriverla per uno scheletro.
