# Figura 5.8 e sezione 5.3 del libro — l'indicatore di conformita'

**Data**: 2026-09-09
**Repo del libro**: `/Users/alfonso/Documents/Claude/Projects/Jjodel Book/678e1c12660f5f6b2e85fe7b`,
branch `master`. Capitolo: `author/part2/ch05-getting-started.tex`. Figure: `author/images/`.

Questa corsia riguarda la **conformance derivata dal metamodello**, non la validazione definita
dall'utente. Le due cose non vanno confuse nel testo: la 5.3 parla di cio' che il metamodello impone
da solo (una molteplicita' `[1]` non soddisfatta), la 5.5 di cio' che il metamodello non sa dire.

## Perimetro e avvertenza

L'albero del libro ha voci sporche di un'altra corsia. **Prima di scrivere, verificare che
`ch05-getting-started.tex` non sia fra quelle**: se lo e', HARD STOP e riferisci. Pathspec esplicito
sul commit, mai `git add` largo, nessun artefatto di build nel repo, compilazione in scratch con
`-output-directory` e le sottodirectory rispecchiate (serve per gli `.aux` degli `\include`).

## Il problema

`ch05-conformance-violation.png` e `ch05-conformance-ok.png` sono due PNG 1400x620 del 26 giugno con
la scritta PLACEHOLDER e la didascalia di cosa andrebbe catturato. Non c'e' niente da verificare:
c'e' da catturare, e prima da decidere che cosa si mostra.

Il testo della 5.3 dice «the validity indicator» al **singolare**, e la frase e' sul modello intero.
Misurato il 2026-09-09: `ValidationPill` **non e' montata**, zero elementi nel DOM. Gli indicatori
vivi sono due, il punto di conformita' nella status bar (verdetto complessivo) e il badge sul nodo
nel canvas (elemento colpevole).

## Passo zero, obbligatorio

Verificare nell'applicazione (`localhost:3000`, offline) che cosa esiste davvero **oggi**, senza
fidarsi di questo prompt:

1. Il punto di conformita' nella status bar: dove sta, che stati ha, che cosa cambia quando il
   modello non conforma.
2. Il badge sul nodo nel canvas: compare sull'elemento colpevole, e sparisce quando il difetto e'
   sanato?
3. La frase attuale della 5.3 dice che l'indicatore «si spegne nell'istante in cui un target viene
   fornito». Verificare che sia ancora vero per entrambi.

Riferire qualunque scostamento fra quello che vedi e quello che questo prompt racconta.

## Cosa scrivere

Riscrivere il passaggio della 5.3 che nomina l'indicatore, portandolo dal singolare ai **due
livelli**: il verdetto complessivo dice se il modello conforma, il segno sull'elemento dice quale
pezzo non lo fa. Nominare uno solo dei due dava una figura fatta di un puntino e raccontava meta' di
quello che il tool fa.

**Non riscrivere il resto della sezione.** Il contenuto concettuale (la conformance come
appartenenza all'insieme delle istanze ben formate che il metamodello ammette, il richiamo al
capitolo 3, la collocazione M0-M3) e' buono e resta com'e'. Si tocca la frase sull'indicatore e la
didascalia della figura, non l'argomento.

## Figure

Ricatturare le due immagini **mantenendo i nomi di file esistenti**, cosi' `\includegraphics`,
`\label` e i rimandi non cambiano. Scenario, che e' gia' quello della didascalia: il semaforo con una
transizione il cui `nextState` non e' impostato, quindi il modello non conforma; poi il target
fornito e il modello che conforma. Le due catture mostrano l'editor intero, con entrambi gli
indicatori visibili nello stesso scatto.

**Queste due NON sono provvisorie**, a differenza delle tre della 5.5: la conformance e' funzione
stabile e rilasciata, non una corsia in evoluzione. Nessun commento di provvisorieta'.

## Stile

Regole di scrittura del progetto **meno la seconda persona**: il capitolo e' in «we», e una frase in
«you» in mezzo si vedrebbe. Niente em dash, mai. Frasi brevi, voce attiva, niente filler. Rileggere
il paragrafo intero dopo l'edit per la coerenza col contesto.

## Consegna

Un commit `docs:` con il `.tex` e le due immagini, messaggio in inglese. Compilazione in scratch, due
passate, e riferire che i rimandi alla figura risolvono e che non compaiono overfull box nuove oltre
a quelle preesistenti del capitolo.
