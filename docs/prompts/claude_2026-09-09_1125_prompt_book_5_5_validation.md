# Sezione 5.5 del libro — «Adding Basic Validation»

**Data**: 2026-09-09
**Repo del libro**: `/Users/alfonso/Documents/Claude/Projects/Jjodel Book/678e1c12660f5f6b2e85fe7b`,
branch `master`. Capitolo: `author/part2/ch05-getting-started.tex`. Figure: `author/images/`.
**Normativa di riferimento**: `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` e la
serie R-VAL in `docs/decisions.md`, nel repo del frontend.

## Perimetro e avvertenza

L'albero del libro ha voci sporche che appartengono a un'altra corsia (`author/book.pdf`,
`author/_build/book.pdf`, `author/book.idx` piu' materiale non tracciato). **Prima di scrivere,
verificare che `ch05-getting-started.tex` non sia fra quelle**: se lo e', HARD STOP e riferisci.
Pathspec esplicito sul commit, mai `git add` largo, nessun artefatto di build nel repo, e la
compilazione in una directory di scratch con `-output-directory`.

## Passo zero, obbligatorio: guardare cosa fa oggi

La sezione descrive un comportamento del prodotto, e la corsia si e' mossa piu' volte. **Non
scrivere da questo prompt: verificare prima nell'applicazione** (`localhost:3000`, offline,
modalita' Advanced) che cosa succede davvero, e riferire nel commit qualunque scostamento fra
quello che vedi e quello che sta scritto qui. In particolare:

1. Il pallino rosso compare sulle istanze che violano, dopo il comando di validazione.
2. Il modale dichiara i tre numeri (violazioni, regole inattive, valutazioni non valutabili).
3. Cosa accade **dopo una modifica al modello**: i pallini si ritirano e c'e' una dichiarazione di
   freschezza che dice che il modello non e' validato dall'ultima modifica (R-VAL-18). Se questa
   parte non c'e' o si comporta diversamente, la sezione **non** la descrive, e lo dichiari.

## Cosa scrivere

Un invariante solo, **per istanza**: ogni stato non finale deve avere almeno una transizione
uscente. Se il metamodello del capitolo 5 non dichiara `isFinal`, la regola diventa «ogni stato ha
almeno una transizione uscente». **Leggere la sezione del metamodello nel capitolo prima di
scegliere il corpo**, e usare gli attributi che ci sono davvero.

Perche' questo e non «esattamente uno stato iniziale», che sembrerebbe l'esempio ovvio: quella e'
una regola sull'insieme degli stati, il contesto e' una classe, quindi viene valutata una volta per
ogni stato e produce N righe identiche. Come primo esempio di un tutorial confonde, e insegna una
forma che cambiera' quando arriveranno i vincoli con proprietario il modello. L'invariante per
istanza invece fa cadere la violazione **sullo stato colpevole**, che e' esattamente cio' che rende
leggibile la figura.

L'argomento della sezione, in ordine: il metamodello dice che uno stato puo' possedere zero o piu'
transizioni (`0..*`), e non sa dire che uno stato non finale debba possederne almeno una; questo e'
il buco che la validazione riempie. Poi dove vivono le regole (un viewpoint di validazione,
l'ambiente sul metamodello, il contesto dichiarato `self: State`), la regola scritta, il comando di
validazione, la violazione che compare sullo stato colpevole nel diagramma e nella lista, la
correzione, e la nuova esecuzione.

JjEL arriva nel capitolo 7. Qui l'espressione si mostra e non si spiega: un rinvio in avanti, non
una lezione di sintassi.

## Cosa NON scrivere

Niente severita' multiple, segnaposto nei messaggi, controesempi dal vivo mentre si scrive la
regola, rivalutazione automatica. Non esistono, e la sezione non promette al lettore cose che non
puo' fare. Niente numeri di versione e niente affermazioni su cosa e' rilasciato.

## Figure

Le tre catture esistenti in `docs/discovery/harness/_tmp_book55_*.png` sono **superate due volte**:
ritraggono l'invariante sbagliata e un'interfaccia senza il pallino. Si ricatturano nello stesso
giro, stesse impostazioni (1500x950, Advanced, tema chiaro), sullo scenario di questa sezione.
Servono: la violazione, con il pallino sullo stato colpevole e il modale; lo stesso a violazione
risolta; l'ambiente di authoring con la regola e il contesto dichiarato.
Copiarle in `author/images/` con i nomi del capitolo 5 e marcarle come **provvisorie** con un
commento accanto all'`includegraphics`: ritraggono uno stato del prodotto ancora in evoluzione.

## La 5.6

E' gia' redatta e porta in testa la nota `%% DRAFTED 2026-09-08 … the last sentence of the first
paragraph may need adjusting once it is written`. Ritoccare quella frase ora che la 5.5 esiste, e
togliere la nota.

## Stile

Regole di scrittura del progetto: **niente em dash, mai**; frasi brevi, voce attiva, «you» al
lettore, niente filler, niente marketing. Se qualcosa ha un limite, dirlo. Rileggere l'intera
sezione dopo la scrittura per la coerenza con il contesto circostante.

## Consegna

Un commit `docs:` con il `.tex` e le immagini, messaggio in inglese. Compilazione in scratch, due
passate, e riferire i numeri di figura assegnati e i rimandi risolti. Se la compilazione da li' non
e' disponibile, dichiararlo invece di saltarla in silenzio.
