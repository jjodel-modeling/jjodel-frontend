# Meeting transcripts (project evidence)

> Provenance note. These are auto-generated transcripts of six working meetings on the jJodel
> harness and its FTG+PM model, captured for the MDE Intelligence 2026 paper. They are raw
> evidence for phase 1 (evidence sweep, T1). The transcription is machine-produced and noisy:
> speaker turns are not attributed, language switches between Italian and English, and several
> passages are garbled. Subtitle artifact lines ("Sottotitoli creati dalla comunita Amara.org")
> have been stripped. Substantive content is preserved verbatim and should be read as
> approximate. When a claim in the paper rests on one of these meetings, cite the meeting number
> and quote the relevant passage rather than paraphrasing the noise.
>
> Participants across the sessions include the human director (Alfonso) and external
> collaborators, among them Hans Vangheluwe (original author of FTG+PM) in meeting 4.

---

## Meeting 1

Modellare le parti e vedere come modellare un lavoro cosi agente: questa sarebbe l'applicazione
delle nostre tecniche di modellazione. Stai usando il modello per definire il flusso? Esattamente,
questa e una direzione: come possiamo usare il modello per l'AI. L'altra cosa e come usare l'AI per
le attivita di modellazione. Questi sono i due argomenti: abbiamo questo topic di AI, MDE, e ora
potremmo dire MDE per AI e AI per MDE, o forse e qualcosa di nuovo.

L'idea e di definire gli obiettivi del gruppo (research question o simili), presentare alcuni
esempi di come lo stiamo usando, e poi rispondere alle research question. Spendiamo cinque minuti
per definire i risultati prima di decidere quali sono le domande. Facciamo un giro tra noi.

Ho chiesto ai miei studenti di usare l'AI come avrebbero potuto. Lo hanno usato non solo per
imparare i concetti, ma anche per usarli. Da cio che ho osservato, lo usavano piu intensamente per
il debugging. La code-generation in se, con diversi tipi di LLM, non e cosi buona come ci
aspettavamo; non sono cosi abituati con l'MDE come con altri tipi di coding. Per il modellamento
formale non possiamo contare sugli elementi per fare qualcosa, perche abbiamo piu allucinazioni,
ogni tipo di decisioni nascoste dal modello statistico che non possiamo spiegare. Da quello che ho
visto con gli studenti, l'intelligenza umana e sempre necessaria.

Questa interazione umana e artificiale e uno dei temi che dobbiamo risolvere: stiamo risolvendo la
complessita accidentale ma non quella essenziale, il che significa che ci serve ancora l'approccio
dell'ingegneria. Stiamo solo allargando i cicli.

Per me e molto importante: puoi fare cambiamenti facilmente e velocemente. Prima discutevamo se un
modello di trasformazione fosse "agile" o no, e abbiamo scoperto che non e una proprieta inerente
del modello. Con approcci basati sull'AI non sono sicuro di quanto sei agile, forse molto piu
agile perche puoi fare cambiamenti che prima non potevamo. E molto facile aggiungere nuove
caratteristiche, funziona molto bene; e un po' piu difficile cambiare qualcosa che gia esiste,
questa e la mia esperienza. Dovremmo chiamarlo harness, come e il vostro harness. Tutti i documenti
hanno un ruolo, e penso sia una sfida: i documenti non sono strutturati. Hai il titolo, puoi
classificare la rilevanza.

Penso sia agile, veloce, puoi applicare direttamente le tue idee in qualcosa di concreto e vedere
il risultato. Questo e molto importante per noi ricercatori e per i giovani ricercatori, perche
possono iniziare a lavorare su qualcosa senza troppi esercizi e continuare. Sono piu preoccupato di
pubblicare che dell'examen della vita: vedi la beta e poi hai molti comitati prima del termine. E
uno spreco di risorse in un certo senso. La risposta e si, e agile, con alcune precauzioni: se ti
organizzi, se sai come fare le cose, e sicuramente agile.

Penso sia possibile classificare i documenti marcati. La LLM vuole i documenti marcati, perche e
molto efficace per loro. Quello che potremmo fare e prima di tutto capire come categorizzare questi
documenti, ma allo stesso tempo dovresti lasciare il designer libero di scrivere le cose che gli
interessano. Questo significa che abbiamo bisogno di diversi gradi di conformita, severita o
strettezza: a volte vuoi essere molto stretto, altre volte e controproducente esserlo. Un altro
punto e capire quali sono i ruoli che vogliamo coprire e vedere quanto e generale applicarli a
scenari diversi.

Non so se un progetto e un modello o no. Certo, e una specificazione, ma Fowler lo chiama
spec-driven. La sua applicazione e davvero illimitata. Una domanda che dovremmo discutere: di
solito, con una buona piattaforma, cosa fai? Disegni la tua lingua, la trasformazione, la
generazione del codice, poi costruisci un ambiente di modellazione. E questi ambienti sono
relativamente buoni ma non estremamente buoni. Ora, invece di definire la tua lingua, puoi
discutere con alcuni agenti di codifica e ottenere un ambiente molto migliore. Se combini questi
due tipi di risultati e trovi un modo di mescolarli, i modelli intesi come questi documenti
categorizzati possono permetterci di aggiungere alcuni strati semantici che altrimenti non si
aggiungono facilmente all'ambiente.

Per farvi un esempio, ho preparato questo. E un ambiente costruito con l'AI; all'epoca non avevo
l'esperienza che ho ora. Ho avuto un incontro con un'azienda di macchine elettroniche, poi sono
andato a casa e ho passato 7 ore durante la settimana, e in 7 ore ho ricevuto questo. Hai quattro
strati diversi: il comportamento, l'RTL, il gate level e il livello fisico nel disegnare FPGA. Non
sono un esperto. Puoi specificare la macchina a stati: questo e il counter, questo e il port di
entrata e di uscita, la macchina di stato e dentro questo componente principale, riceve l'evento
di entrata e produce. Poi c'e la scheda con il pulsante e un LED che indica lo stato del pulsante,
un display, lo stato della macchina, il counter ha modulo 9, poi c'e un simulatore. Non credo di
poter fare qualcosa come questo con qualsiasi MDE, non in 7 ore. Poi hai il codice VHDL, anche
generato. Se e corretto o no, non lo so, ma e generato dal modulo e dal tipo di semantica. Puoi
specificare con MDE questo tipo di cose in modo molto preciso, ma il simulatore, o il modo in cui
presenta i dati, avere una dashboard che presenta i dati, e solo un esempio.

Il framework concettuale e gia presente, e una sorta di istanziazione di un modello. L'AI e
totalmente a parte dall'MDE e dobbiamo costruire un ponte di qualche tipo. Se considerate il prompt
come un modello, definite anche un meta-modello o qualcosa che giochi il ruolo di meta-modello? Se
c'e uno schema, probabilmente si. Possiamo pensare a una forma di sistema: andare in un certo punto
e controllare se si conforma allo schema che vogliamo; se l'utilizzatore manca qualcosa, chiedergli
di continuare. Quindi, prima di entrare direttamente nel modello, usate la LLM per fare il
controllo della conformita. Quando e conforme prendete l'altro modello e potete inserirlo nella
LLM. Ovviamente dovete fare una valutazione prima: l'utilizzatore puo inserire qualunque cosa,
quindi non puo essere un modello subito, ma dopo qualche passaggio di pulizia potrebbe esserlo.

Questo alimenta il contesto: deve essere istruito, quindi abbiamo bisogno di un sistema che prende
lo schema, prende questo, e ritorna come risposta deterministica che rifletta questo; altrimenti
l'utilizzatore puo correggere il documento. Il checker puo anche fornire suggerimenti su come
cambiare lo schema. Immaginate di iniziare con un progetto: all'inizio potrebbe essere che non
avete considerato le coordinate. Dipendendo dalla fase o dal ruolo dei documenti, hai diversi
schemi. Se vuoi considerare il prompt come un modello, hai bisogno di questo, e questo riflette il
dominio dell'applicazione: qualcosa che descrive l'architettura, qualcosa che descrive il blocco di
decisione, la sessione.

Non si puo andare per sempre, bisogna risolvere le problematiche e anche la consistenza. Vorrei
parlare anche delle skill: i cosiddetti skill sono anch'essi documenti che specificano certe
capacita, non solo relazionati con la code-generation, ma anche per controllare i vincoli, la
qualita e lo sviluppo.

Un system prompt e un template, diciamo, nel quale c'e qualche variabile. Specifichi una
funzionalita. Quando scrivi qualcosa, lo scrivi nel system prompt, lo schema sta nel system prompt,
e poi questo conosce tutto. Questa e la costituzione? E il documento principale, ma dipende da cosa
vuoi fare. Per esempio, se avete un assistente di chat, direte che deve rispondere a tutte le
domande sul turismo in Portogallo, e se chiedi se e bello avere i giorni di vacanza in Italia, ti
risponde che non e il suo obiettivo. Lo fai in modo dinamico, perche lo memorizzi in un file: se
vuoi cambiare il comportamento cambierai il system prompt, non il codice. Poi hai delle varianti
con questa tecnica: hai un indice specifico e inietti il risultato, che contiene anche informazioni
contestuali.

C'e la finestra di contesto, la quantita massima di token che l'elemento puo processare in una
volta. Empiricamente dicono che non devi passare oltre il 60%, perche in questo 60% hai il contesto
iniziale, tutta la discussione che hai fatto, e ti serve il resto per l'inferenza. Se hai meno del
40% per l'inferenza la profondita di ragionamento diventa piu bassa. Se non sei riuscito a
finalizzare la feature, aggiungi la sessione, e cosi iniziamo a generare un prompt per questo:
leggo il documento dell'ultima sessione. Questo documento puo essere condiviso con un'altra persona,
e loro possono scegliere la loro opzione per eseguire l'output. Quando un'altra persona entra,
hanno un punto di intervento e non hanno bisogno di un'altra sessione. Sostanzialmente rimuovi
informazioni inutilizzate, perche se i documenti sono troppo lunghi consumano molti token.

Quello che ho lasciato implicito e il seguente. Immaginate di fare queste iterazioni. I tipi di
iterazione che ho identificato sono di due tipi, leggero e completo. Realizzi un prompt di
discovery, lo passi all'agente di codifica. L'agente di codifica ha accesso alla base di codice e
alla documentazione. Qui avete diverse strategie per traversare i documenti. L'obiettivo e avere
questi fattori di qualita e consistenza, ma anche non consumare troppi token; altrimenti dovresti
cercare ogni volta nella base di codice. Quindi la discovery ritorna un documento. Voglio aggiungere
questa nuova mega-feature: si fa la discovery, la discovery viene ritornata, e poi a seconda della
discovery si prende la decisione e si produce un altro prompt che viene passato al coder, e il
coder implementa.

E interessante: se hai un paper con un approccio specifico, normalmente se il paper e ben scritto,
l'approccio e molto ben specificato. Dici "vorrei realizzare questo con il mio strumento", passi
questo. Sono davvero buoni quando aggiungi qualcosa di nuovo senza vincoli. La cosa che ho provato e
un paper di Stefano Ducasse e Michele Lanza dell'Universita di Lugano con queste viste polimetriche
per visualizzare diversi aspetti degli oggetti: passavo il paper e dicevo che volevo applicarlo ai
metamodelli. Le altre cose che avevo aggiunto erano la beautificazione, l'apertura di tutti gli
elementi, o mostrare solo quelli conformi a una certa evidenza. E ancora valido quello che dici se
tutto e in conformita.

---

## Meeting 2

E ancora un primo approccio, ma diventa evidente che c'e bisogno di una sorta di strategia di
gestione del modello, una strategia di management dei prompt. Stavi facendo solo un modo possibile,
ma ci possono essere altri modi. A un certo punto potresti voler tornare indietro, come in Git:
iniziare un branch e poi dire che ha iniziato a divergere e vuoi tornare 10 passi indietro. C'e
bisogno di una strategia, perche in questo momento e cio che ti ricordi che e nella tua mente.

Uso solo un agente per interagire e discutere di tutto. Le persone usano cose diverse, in
parallelo, ma tutte fanno la stessa cosa. Ho specializzato questo grado (chat), ma potrei creare un
altro grado con altre istruzioni: parlare di qualita, leggibilita del codice, aggiungere commenti.
Quello che non ho fatto qui e avere un tipo di workflow agentico deciso da me stesso: sto piu
usando documenti per arrangiare tutto, e questo potrebbe essere il prossimo passo. Al momento sono
l'unico che lavora su questa parte del sistema, quindi funziona. Ma una volta che diventa
collaborativo, le cose diventano piu complesse, ed e per questo che le strategie di gestione del
modello o dei prompt saranno piu complesse.

Con diversi agenti potresti cercare di risolvere questo problema? Le scuole possono avere gli stessi
concern ma con molte piu persone: hai le istruzioni per ogni chat diversa e potresti avere diversi
esempi dello stesso tipo di chat, quindi posso mettere in parallelo un numero di chat. Puo essere
confuso, perche a volte bisogna tagliare le cose manualmente. Se fai qualcosa di sbagliato, e
abbastanza intelligente da capirlo. Un altro punto: definisci diversi tipi di chat, di diversi
progetti. Un progetto e una chat specializzata in cui metti istruzioni diverse, e poi puoi avere un
comportamento specializzato. Posso gestire il sistema, la documentazione e il sito web con la stessa
chat: e solo spiegare cosa fare con questo e con quello, e normalmente funziona, condivido la stessa
informazione.

Se fai tutto in un unico agente, occupa un sacco di token. C'e come un orchestrator che decide i
task dei sub-agenti: ogni agente ha un'altra finestra che usa e non potra contattare l'agente
principale, conosce solo il livello alto. Puoi avere un implementatore e un revisore di codice: il
revisore da feedback all'agente, lo fissa, e quando ha finito lo manda all'agente principale e gli
dice che ha finito, ecco il summary. Cosi l'agente principale ha molto meno consumo di token e la
memoria e piu disponibile per altri task. Quando lo chiami devi definire i task specificamente,
quindi passi piu tempo prima di chiamarlo, e poi dara un risultato migliore. Ogni agente diventa
piu intelligente perche deve preoccuparsi di un singolo task: il focus e sul task.

Se prendiamo l'approccio Git dove inizi ad andare in una direzione e hai un agente: questo non ti
permette di farlo. Con un unico agente puoi fare un sub-claude e un Codex di OpenAI che ti
permettono di tornare in chat a un certo punto e passare in un altro branch, ma e un unico agente.
In questa fase ci sono 5 sub-agenti e puoi tornare a una fase, ma non puoi tornare a un punto dentro
il sub-agente. Come garantisci la consistenza con gli altri agenti? Questo agente stava cercando
errori e a un certo punto ha detto "rollback 10 edizioni". Ha la possibilita di rollback. E un
orchestrator. Ma per un sistema agentico, come l'AI, non si sa per certezza: se dice di tornare
indietro, potrebbe non tornare completamente, perche la chat torna ma il codice forse no. Vogliamo
committare spesso, ogni passo: con questo puoi tornare in qualsiasi momento. La chat non ti da
l'opzione deterministica di tornare, quindi devi usarlo con Git per assicurarti di poter tornare.

[Demo.] Questo e un modo molto semplice per la state machine. Ha stati, transizioni ed eventi. Non
c'e action, non ci sono nemmeno guardie. Posso creare un nuovo modulo, aprire questo, e dire
"genera un modello conforme": una state machine per gestire. Hai un'idea per migliorarlo: cliccando
su metamodel puoi dare una selezione, scegliere il metodo. Ha generato questo, ed e nell'Ecore. Ora
posso eseguirlo, passo a passo o come batch.

Quando crei un oggetto in JavaScript l'architettura interna utilizza una combinazione asincrona.
Hai creato l'oggetto, e un'operazione asincrona, quindi puoi iniziare il prossimo risultato prima
che questo sia disponibile. All'inizio ho creato l'oggetto, poi un'attivita di questo, e ho avuto
un errore, ma poi ho capito che serve circa 150 millisecondi. Ora il timeout e a 500 millisecondi
ma puo essere ridotto. Abbiamo importato il database. Ha una rappresentazione interna dei modelli e
del progetto intero, e usa l'API per modificare lo stato. Poi c'e la console, una piccola
trasformazione tipo OCL: per tutte le classi C nel metamodello, se vuoi sapere quale classe hai;
oppure vuoi sapere tutte le istanze; oppure per tutti gli stati. Puoi dire che nel prossimo stato
ci sara piu di una transizione successiva. L'idea e di avere qualcosa di simile alla notazione
abituale e puoi usare questi modi diversi. Qui avete i connettori esistenziali e universali, ma
potete usarlo per scrivere espressioni che usano i binding. Per tutte le classi, c'e un attributo
in c.attributes tale che c.name sia uguale a un nome. Qui non si considera l'inheritance: questo e
un problema nella semantica di questa lingua. L'unico modo per scrivere e scrivere qualcosa come un
prompt; hai un operatore che apre un modal in cui puoi inserire il nome dell'espressione.

Come dovrebbe essere la conformita tra schema e schema? Cosa abbiamo nello schema? Definiremo un
metamodello per questo. La sessione e stata scritta abbastanza bene: ci sono gia molti concetti per
un possibile metamodello. Potremmo chiedere alla LLM di proporre un metamodello basato su questa
descrizione. Quello che ho fatto per le slide: ho preparato il progetto con Claude e ha generato le
slide, quindi conosce di cosa stiamo parlando. Posso andare nel transcript. Ci sono molte decisioni
che saranno presenti qui. Consideriamo il seguente transcript: e parte della seconda sessione che e
ancora in corso. Alla fine condivideremo il transcript completo.

Avete visto altri approcci simili? Ce ne sono diversi. Quando usi Claude Code ci sono diversi modi:
uno e il planning, che e quello che faccio con le chat, e poi c'e l'agente di coding. Ho chiesto a
Claude se fosse la cosa migliore e mi ha sempre risposto che l'organizzazione era molto buona, ma
tende a essere benevolente. Ci sono altri approcci come Copilot o editor specializzati come Cursor,
OpenCode. Non scrivo una singola linea, non codifico. Zero, forse il 10%. La maggior parte del tempo
e sapere cosa fare, con abbastanza attrezzamento. Inizialmente, per avere un buon output, se sei
pigro nel primo passaggio l'output e terribile. Questo ti forza a essere consapevole di cosa succede
nel codice: devi pensare all'architettura, prima dovevi pensare a come scrivere, ora non piu.

Vogliamo progettare una notazione per esprimere i documenti: uno schema per i documenti MD, e le
relazioni di conformita, un metamodello. Vuoi dire un diagramma? Gli chiedi di generare un EMF. No,
perche a volte se gli chiedi di fare cosi fa quello che hai chiesto, ma se fai una domanda aperta
("cosa ne pensi?") propone altre alternative, dice pro e contro, e piu conversazionale.

Penso che ci sia un altro aspetto interessante: questo tipo di lavoro e molto intensivo, e ci sono
persone che ci lavorano a tempo pieno e si bruciano, perche hai molte idee e le stai mantenendo. Se
l'industria spinge molto, l'impiegato potrebbe avere problemi, specialmente se stanno sostituendo
altri. Quello che devi fare e rendere il tuo token piu utile: non e provare tutto, devi prendere
uno strumento e provarlo e vedere se funziona per te. Ci sono alcune skill disponibili gia
pronte. Un'altra cosa molto bella e la ricerca accademica: il problema delle LLM e che quando provi
a chiedere di trovare qualcosa, a volte non esiste, quindi la skill e trovare il paper, leggerlo e
citarlo correttamente. Alla conferenza piu importante sull'AI, NeurIPS, c'e un gruppo che ruota
sulla detection delle LLM: ci sono circa 50 paper con citazioni assolutamente inadeguate, ed e un
grande problema. Con questa skill cerco di trovare il vero paper con il vero link.

Un'altra cosa utile e l'orchestrazione. Per un sistema AI: se vuoi che un agente ti aiuti a
viaggiare, devi spiegare data e luogo, l'agente deve trovare il volo, l'hotel e fare l'itinerario.
Se un agente fa tutto questo, e difficile, si rompe subito: quindi il primo agente trova il volo,
ecc. Stavo dando i dati e produceva tutto questo: ha proposto i voli, la connessione a Roma, la
checklist. Questo e piu per uso personale; per un sistema di produzione vuoi che le risposte siano
piu deterministiche. Puoi avere una dashboard: questo e il dashboard del codice del progetto, qui
c'e la duplicazione. A un certo punto la duplicazione del codice e andata in alto, e poi (il verde
e l'AI) la duplicazione e andata in basso; questa e la produttivita, le linee di codice.

[Discussione sul metamodello dei documenti MD.] Questa e la categoria della sessione, questi sono i
diversi tipi. Sono curioso se la prosa dovrebbe essere di tipo primitivo. Qui c'e il tipo Prosa.
Questo e il Markup Metamodel: ha dei blocchi, quindi non e esattamente corretto. Si tratta di
blocchi, ma possiamo cambiare il nome. Qui abbiamo un documento. Questo e il metamodello 2. Ha
blocchi, secondo la struttura che avete visto prima. I blocchi possono essere di questo tipo. Lo
chiamiamo documento, ma non il progetto in se. Il progetto e un'istanza di questo. Il prompt puo
essere un blocco di codice. Ci sono sequenze specifiche tra loro? La sequenza e qui, perche hai
questa stella. Poi c'e un blocco che si chiama Paragrafo, ma cio che non mi piace e che questa e
sostanzialmente la struttura del documento, non ci sono tipi, mentre nell'altro caso i tipi di
parola sono visibili.

In termini di metamodello questo e sbagliato, abbiamo bisogno di alcuni tipi. Cerchiamo di
riprodurre questa situazione. Abbiamo un documento, chiamiamolo MD. Abbiamo diversi tipi: Prosa,
Decisiones, Generated Prompt, Pending Prompt. Se abbiamo prompt possiamo specializzarli. Il prompt
sembra essere di tipo primitivo. Diamogli un tipo, chiamiamoli Feature. La feature come tipo. Hanno
entrambi un nome. Quando aggiungi un attributo, dipendendo dal nome, prova a indovinare il tipo di
default: se aggiungo "eta" sceglie un tipo. Possiamo avere diversi blocchi, ogni blocco e una
classe: lo chiamerei blocco, e piu specifico per il dominio. La provocazione (prompt) e un tipo,
giusto? Cosi puoi specificare: hai il documento, i blocchi, e in un blocco puoi mettere il free
text. Ma forse vorremmo essere piu precisi. Raffinamenti su cio che possiamo avere in diversi tipi
di blocchi: per esempio un blocco con una data, e poi hai un dato di tipo Date. Puoi avere una
descrizione, una sorta di prosa piu corta. Pensi che il dato debba avere una descrizione anche?
Perche ha uno scopo.

---

## Meeting 3

E un oceano, penso che ce ne siano molti. Lo scheletro e riutilizzabile, il contenuto no. Il pattern
della sezione, il layout dei comandi, la convenzione: questi sono generali, li hai in ogni base di
codice. Ci sono queste sezioni, o blocchi, nel file che ci hai mostrato prima? Penso di si,
possiamo controllare. Questi documenti strutturali, ma dobbiamo tenere in mente che questo e un
lavoro molto profondo.

---

## Meeting 4

Dare la lista dei diversi tipi di documenti markup, e poi cerchiamo di capire qual e il ruolo di
ognuno. Ora diventa interessante: quanta riflessione puo fare un large language model. Possiamo
lavorare sul progetto che uso per sviluppare codice, perche ha accesso a tutta la codebase, oppure
posso creare un nuovo progetto che ha accesso alla codebase ma con un obiettivo diverso: analizzare
il workflow. Claude ha due applicazioni desktop: una e la chat, l'altra si chiama Cowork. Cowork e
come la chat, ma ha la possibilita di leggere e scrivere su una data cartella della macchina locale.
Posso dire: questa e la cartella, e voglio capire come e organizzato questo processo.

Creo un nuovo progetto. Prima devo scrivere tutte le istruzioni, ed e complicato. Non ho trovato
nessun documento che lo descriva, quindi e una mia scelta e non so se ci siano modi migliori. Apro
Claude chat. "Voglio creare un progetto Cowork per analizzare la codebase di jJodel e capire l'uso
di tutti i documenti markup creati e gestiti durante lo sviluppo agentico e basato su modelli." La
chat e molto robusta ai typo. Non voglio guidare il processo.

[Su Fable.] Ho usato questo file Fable per un paio di giorni, era impressionante. Hanno diversi
modelli e una classe di modelli chiamata mythos, considerata troppo potente per essere rilasciata.
Fable 5 e uno di questa classe, ma hanno messo dei guardrail. Era molto impressionante, ma il
governo USA ha deciso di bloccarlo, perche qualcuno ha fatto jailbreak e bypassato i guardrail. Era
controverso perche il governo lo considerava un'arma.

Abbiamo l'architetto, Claude (il modello che uso). Uso la chat come architetto, uso Claude Code per
l'implementazione, e poi ci sono io. Il primo goal e systematize the workflow going forward. Cos'e
questo harness engineering book? Sto provando a scrivere un libro. Il termine harness e il modo in
cui organizzi le cose; organizzare queste cose richiede skill, piu o meno quello che stiamo
discutendo qui. Maybe the drift is if the documentation is still in synchronization with the
implementation. Concentriamoci sul primo. Vogliamo anche formalizzare il workflow e i tipi di
documento in un modello. Usiamo il formalismo di Hans, FTG+PM. He is the first author of this paper.
Plus, FTG plus PM.

[Output del progetto, prima riflessione.] "Quello che state descrivendo non e davvero documentation
cleanup, e un audit del vostro sviluppo. Il posto dove la conoscenza di dominio viene passata da un
agente al successivo, dove l'intento e codificato prima che il codice esista, e dove il modello
condiviso del sistema persiste tra le sessioni. L'oggetto reale di studio e la topologia
dell'harness e i file markdown sono il suo instruction set." Mi piace "harness topology". Il
reframing conta per due ragioni: primo, cambia la domanda da "quali documenti esistono" a "che
ruolo gioca ogni documento nel loop e chi scrive contro chi legge". Secondo, e una misura diretta
della knowledge depth dentro il vostro stesso processo.

[Discussione su knowledge depth.] Con knowledge depth si intende che usa qualche conoscenza di
background per analizzare queste cose. Lo human in the loop non e consapevole di tutto. Non e
qualcosa relativo agli artefatti, non e technical depth (nel senso della struttura del codice). E
qualcosa che riguarda il designer: c'e una distanza tra cio che il designer sa e cio che il sistema
sa. "Ogni posto dove un documento markup ha drift dal codice, e dove la conoscenza vive solo nella
tua testa e non e mai stata incarnata."

[Le domande che il progetto dovrebbe rispondere, dal modello.] Inventory e tassonomia. Agent role
mapping: per ogni documento quale agente lo produce, quale lo consuma e a che punto del ciclo:
questo disegna la topologia reale dell'harness e di solito fa emergere asimmetrie mai progettate
deliberatamente. Lifecycle e freshness: creato quando, aggiornato spesso, version control o
effimero, live o stale; stale ma autoritativo e il quadrante pericoloso. Health e gap:
contraddizioni tra documenti, drift tra documenti e codice, prompt orfani, artefatti mancanti. La
delivery e un report, un modello dell'harness su cui poi agire.

[FTG+PM come strumento.] "FTG+PM e lo strumento giusto e fa piu lavoro di quanto sembri. Il mapping
e pulito: l'FTG (type level) diventa un catalogo dei vostri documenti, i formalismi come nodi, e le
trasformazioni tra loro come archi. Quindi 'capire tutti i documenti markup' smette di essere un
inventory chore e diventa: enumera i formalismi e le trasformazioni e hai l'FTG." Si, ma per fare
l'FTG devi fare il PM prima, e poi viene fuori l'FTG. "La disciplina che FTG+PM impone gratis e che
ogni artefatto nel processo e tipizzato da un formalismo e ogni attivita e tipizzata da una
trasformazione. Questo e esattamente il rigore che il vostro harness manca sulla carta anche se lo
segue in pratica." La parte interessante: il classico FTG+PM tipizza ogni trasformazione come
manuale o automatica, ma il vostro loop ha tre esecutori, non due. La mossa naturale e sollevare
quell'attributo binario in un executor typing: human director (architect, Claude AI), implementer
(Claude Code).

[Sul book chapter sorgente del metamodello.] Questo e un book chapter scritto da Muharrem, Hans e
altri (Joachim). Fatto nel contesto della COST action. Questo e il metamodello per FTG+PM. Hai una
parte di incertezza dentro. Forse e piu per AADL. Abbiamo deciso di modellare questo con FTG+PM.
Loro modellano con incertezza. Attualmente e molto strict, come hai detto. Molto strict.

[Hans interviene sul significato dell'FTG.] La ragione per avere l'FTG e poter ragionare sui
transformation path in modelli eterogenei. Quella era la novelty. Hai oggetti tipizzati. "Avrei
dovuto notarlo perche mi chiedevo perche hai transformation." Per inciso, formalism transformation
graph: inizialmente era FTL, formalism transformation lattice. La ragione per cui ho parlato di FTG,
FTL: in realta dovrebbe essere FRG (formalism relationship graph), perche ho linguaggi e relazioni
tra linguaggi, e alcune sono dirette e sono trasformazioni, ma in generale potrei annotare questi
formalismi: a cosa servono, che tipo di analisi posso fare. Per esempio, se ho due formalismi,
PetriNet e LTL, posso avere un'analisi che prende una PetriNet e una formula LTL e come risultato
ottengo un Booleano e un controesempio, o una traccia che e un controesempio o un witness. Potrei
inferirlo dal pattern nell'FTG, o annotare collezioni di formalismi dicendo "questo e suscettibile
di simulazione, questo di altro". Il formalism transformation graph e troppo influenzato dall'uso
per la trasformazione e il chaining. Il mio goal originale era come combinare formalismi diversi nel
mondo della simulazione. I link tra i formalismi possono avere semantiche specifiche, non deve
essere una trasformazione. E un particolare livello di astrazione che ha valore. La novelty non e
nel PM, la novelty e nell'FTG.

[Generazione del metamodello dallo screenshot.] Mostra come il metamodello e generato dall'immagine.
Alfonso ha incollato uno screenshot e ora c'e il metamodello. Sembra un activity diagram metamodel.
Penso che abbia confuso le relazioni tra node e control. Vediamo: c'e Node, poi control flow e data
flow, many to many. Poi Object, Activity, Control, e i control come Join. Questo manca. C'e Object,
e l'Object ha un link object typed by verso Language, e Language ha una definition. Qui ho string
invece di path. La transformation, e Language: ci sono inputs, da Language a Transformation. La
direzione e sbagliata. Hai gli output. Hai esattamente un output. "Si e confuso col plurale,
outputs uno." Strano, dovrebbe essere output many. Star star. Un linguaggio puo essere usato in
molte trasformazioni, e una trasformazione puo avere molti output. Abbiamo trovato un errore: e una
versione piu vincolata. In questo caso permetti alla trasformazione di dare un solo tipo. Normalmente
per le trasformazioni dici n input e n output. Potresti avere trasformazioni N a M. Per esempio,
output di un code model e un configuration model: hai un configuration language e un programming
language, ed e la stessa trasformazione.

Posso fornire indietro il metamodello, e c'e una versione online: non devi installare niente.
Posso prendere il paper e metterlo nella knowledge base del progetto. Claude non scrive senza il tuo
consenso: genera qualcosa, genera un file, e poi lo aggiungi alla knowledge. Il sourcing paper. I
doc che hai in multiple checkpoint sono una specie di knowledge base. In VS Code hai una cartella
docs e un log di ogni volta che parli con un checkpoint. Lui deve chiedere e farlo lui stesso. Questi
sono alcuni dei documenti, e ce ne sono molti. Non e completamente consistente, perche riflette
diverse fasi del progetto: il project management nel corso di questi mesi e diventato sempre piu
accurato. All'inizio era una specie di. Quello che e interessante: queste sono tutte le query sul
codice, e spiegano gli aspetti specifici. Poi e usato dal coder per implementare qualcosa. L'idea e:
vorrei implementare questo. Scrivo il prompt. La prima cosa che faccio e generare un prompt per fare
una discovery. Esegui la discovery, prendi l'outcome, e dall'outcome genero un altro prompt che e
l'implementazione della feature. E un po' strutturato, ma funziona molto bene. Questo non e piu
usato: l'ho usato fino alla prima settimana di febbraio. Gli end-over sono documenti che genera, li
prendi e li passi alla chat successiva. Per via di questa recalibration, invece di generare
end-over genera Session documents. Hai la traccia completa della comunicazione, ma solo da un certo
punto in poi, perche all'inizio non ero cosi consapevole.

Ora abbiamo una nuova versione delle istruzioni. Ho usato la chat per generare le istruzioni del
progetto. Penso che possiamo usare una cartella esistente. Qui scrivo le istruzioni; puoi cambiarle
anche dopo. Puoi anche chiedere al progetto stesso di migliorare le istruzioni. Qui scrivo la
knowledge base: ho il paper. Cambiamo il titolo. Compound AI, analysis.

[Riconoscimento del modello.] "Questo sembra un activity diagram metamodel." A un certo livello sono
solo grafi, e poi hai activity diagram con fork e join, niente di nuovo. Questo e il metamodello del
mio paper, FTG. Non ho mai affermato che ci sia qualcosa di nuovo nel PM: la novelty e nell'FTG.
Rappresentare esplicitamente un grafo di formalismi e relazioni a livello di linguaggio. C'e un link
con gli activity diagram perche gli artefatti (istanze dei formalismi) sono gli artefatti nel
workflow, e le trasformazioni tra i formalismi sono il tipo dei contratti sulle istanze di
attivita. Ma la ragione per avere l'FTG e ragionare sui transformation path. Quella era la novelty.

[Sui conflitti di interesse e revisioni, digressione.] Single-blind, ma molto strict. Posso fare
parte di un comitato PhD solo invitando persone con cui non ho pubblicato. Ho 320 co-autori su
Google Scholar.

[Costruzione del modello PM/istanza.] Stai costruendo un'istanza. Property input e un'altra feature.
No, sta creando il modello di qualcosa secondo il tuo metamodello. Cerchiamo di recuperare cosa sta
facendo questo lavoro AI. La ragione della strictness: c'erano casi di chiedere ai propri amici. Ora
e andato all'altro estremo, super strict. La regola strict si applica anche al supervisor, agli
studenti LHC, ai reviewer piu importanti, e anche tua moglie non puo fare review; la famiglia anche
in senso accademico (doctor father) e genetico.

Abbiamo un numero di root element. Non so se tutti hanno senso. Abbiamo Node. Il Node puo essere un
Object e poi un Activity. Quello e complicato, ma e buono: ha classificato transformation,
activities. Ora ci serve una concrete syntax. Hai un generatore per la concrete syntax? Leggere un
workflow model in abstract syntax e piuttosto difficile. L'idea e di avere delle sintassi
predefinite per i processi, ma ci vorra tempo. Prendiamo l'activity, e il punto di partenza. Poi va,
quello e il control flow. C'e di nuovo il control flow, che sta rivedendo quello che hanno ottenuto.
Poi questo. Workflow.

Possiamo creare velocemente una concrete syntax? Quanto lavoro e? Abbiamo solo cinque tipi di nodi.
Ci serve un simbolo per object, language, transformation. Hai un initial node, ma hanno una
super-classe. Per la super-classe abbiamo un notation element. Cosa abbiamo? Object, language,
transformation; il workflow ha activities e object. Ho creato una syntax, la chiamo visual process.
Dobbiamo decidere da cosa iniziare. Iniziamo con activity. Crei una view. La aggiungo nella mia
nuova sintassi. Qui posso usare la concrete syntax o avere sia l'abstract che la concrete allo
stesso tempo. Questi sono gli object. Sta creando una rappresentazione di default che puoi cambiare.

Markdown reviewed language. Markdown draft language. Forse possono essere unificati, o hanno
contenuto diverso, o lo status (lo stesso documento che va in stadi diversi). Rappresentiamo le
trasformazioni. Questo e il reviewed artifact. L'object dovrebbe avere un link al language. E
richiesto? Deve essere tipizzato dal tuo language, quindi multiplicita uno. Non lo vedi perche non
e stato rappresentato, non perche non c'e. L'object va a object typed by. Quello e il predicato OCL
che seleziona tutte le istanze di tipo Object. Qui c'e il visual template: bootstrap icons, cerco
Object, prendo component. Questo e un'activity, prendo action/settings.

[Vari dettagli di concrete syntax in jJodel: viewpoint, view, JSX template, edge per composition,
source node, end node, terminologia bootstrap.] Puoi mostrare il type link dall'object al language?
Object type by, value.id piu "age" per un ID diverso. Ah, e la key. Abbiamo i link. Il tuo artifact
ha un link al language. Possiamo customizzare l'edge. Lo duplico, lo apro, lo muovo nel mio
viewpoint visual process, cambio il nome, edge language.

[Versione beta vs stabile.] La stabile e la vecchia versione, quella vista a Lille. Dovremmo
giocare con la beta. Puoi usare la beta, potrebbe avere qualche problema minore ma non crasha. C'e
un data leak perche sta diventando molto lento.

[Su goal modeling, in chiusura.] Sembra che abbiamo un workflow model, abbiamo gli artefatti, le
attivita. Vediamo cos'e questa nozione di transformation alla fine. Sarebbe interessante avere goal
modeling: il tuo obiettivo, il goal e mantenere la consistenza, e poi hai documenti che aiutano
questo. Come un catalogo: per ogni goal hai i fattori, le attivita. E interessante perche facciamo
reverse engineering: se funziona, potresti dare un tale modello a Claude e dire "genera nuova
infrastruttura per eseguire questo workflow" o migliorarlo. Immagina di generare la completa
infrastruttura per eseguire le diverse trasformazioni di modello, simulazioni, quello che serve.
Potremmo provare a mandarlo a MDE Intelligence. Se hai questo modello ed e significativo, potresti
fare miglioramenti a livello di modello, rimandarlo indietro. Tutti questi documenti sono fini, ma
per me era difficile vedere la big picture: vedere tutte queste interconnessioni, per questo i
modelli sono buoni.

---

## Meeting 5

Ora abbiamo il set di istruzioni del task, il workflow. Questa e una skill. Quando l'utente fa una
serie di domande e non menziona la skill, c'e una evaluation: si valuta se la skill serve. Se serve,
prendi la skill nel workflow; se no, non viene usata nella sessione. Ho tipo 10 skill: se parli con
un client e dici "creami una presentazione", trova una skill per creare slide. Non e un riferimento
diretto alle skill: determina da solo che hai skill per questo. Abbiamo web search skill: se chiedi
qualcosa di nuovo, qualcosa dopo il training, va sul sito. L'evaluation valuta l'input e vede se
serve una skill. A volte servono piu skill: "crea uno slide deck su un piano per visitare delle
citta" richiede web search e molto altro.

Qual e la differenza tra una skill e una istruzione del progetto? L'istruzione e simile, ma viene
caricata nel token server ogni volta che inizi una sessione: gia consumi token caricando l'istruzione
del progetto in memoria. La skill invece catcha solo il nome e la descrizione (il front matter).
Non carichi tutto finche l'evaluation non passa: questa descrizione e quello che ci serve, allora
carica l'intera sezione. Le istruzioni del progetto invece caricano l'intero file ogni volta. Questo
e un modulo che puoi riusare e usare per connettere ad altri tool esterni. Ho chiesto di mostrare un
esempio di skill.

Nel progetto hai una cartella skill in cui c'e questo skill.md. Esempio semplice. C'e il front
matter (YAML), poi "until all three sections below are filled". Poi le sezioni required: osserva cosa
sta accadendo in termini concreti, valori di coordinate, file e linea dove origina il comportamento,
mai affidarsi solo a uno screenshot; expected, il comportamento target allo stesso livello di
precisione, separa il fallimento di correttezza dalle preferenze estetiche; acceptance criterion,
una frase verificabile meccanicamente (es. due anchor con coordinate Y distinte). Poi le rules: se
il reporter non puo dare observed ed expected con precisione, chiedi prima di cercare nel codice;
prima di affermare che un valore e sbagliato, conferma che e effettivamente letto da un consumer. E
interessante che dice "rules", ma per me sono piu istruzioni o comandi. Puoi anche dare istruzioni
su come accedere a tool esterni: hanno il protocollo MCP, e via MCP puoi connettere tool esterni
(per esempio inviare per email, fare backup su Google).

Il front matter si carica nel blocco quando inizi una sessione, ma non carica tutto; quando
l'evaluation matcha il prompt utente con la descrizione, allora carica. Questo aiuta molto perche
l'instruction e troppo lunga e si carica ogni volta, consumando token e memoria: con le skill la
spezzi e carichi solo quando serve. Un esempio mio: debugging di un'app complessa con voci di
database. Devo controllare tre posti: database, log Python, output del container per l'email. Ho
chiesto di mettere una skill, cosi la prossima volta dico "usa questa skill, va a fare il debug": va
al database, fa la query, va al log Python, al log del container. Non devo andare io. E molto
potente quando definisci il tuo workflow e lo riusi velocemente.

[Skill come trasformazioni.] Un termine migliore: hai skill, puoi chiamare la tua model
transformation come vuoi. Per esempio, quando fai una state machine to activity diagram, o disegni
una tabella, ha qualche problema, fa un mapping sbagliato, ma puoi chattare e raffinare. Dopo
qualche raffinamento il risultato e quello atteso, e puoi salvare questa trasformazione complessa
come skill. La prossima volta dai una state machine e dici "usa questa skill per trasformarla":
produce l'output basato sull'intera progressione che avevi prima, lo comprime e ti da l'output. E
piu deterministico cosi.

[Non-determinismo nella selezione delle skill.] Se hai un set di skill e stai eseguendo questo
processo, hai del non-determinismo, perche potresti applicare certe skill piuttosto che altre. La
selezione e dall'alto verso il basso. Ma puoi anche chiamare la skill direttamente, e allora non
passa per l'evaluation. Diventa interessante: possiamo analizzare queste descrizioni, ma se vuoi
sapere cosa accade davvero devi andare ai doc e vedere quali skill, e questo process mining avrebbe
molto senso. Vuoi loggare non solo le cose usuali, ma anche il tipo di skill usate. Questo e il
problema principale del workflow. Noi prendiamo decisioni in hard time, non pianifichiamo l'intera
giornata ed eseguiamo fino alla fine: abbiamo le evolving chip cards. C'era questa idea di
algoritmi dove hai un input fisso ed esegui per ottenere un output: troppo strict. Questa e la
potenza dell'AI: puoi delegare molte cose a runtime e dire "ora seleziona la skill che e piu utile
in questo particolare setting". In un workflow model esprimere questo e difficile.

Quello che dici ha molto senso: per ogni run del workflow stai loggando il tipo di skill. Potremmo
avere una nozione di coerenza: ammetti il non-determinismo perche non puoi fare altrimenti, ma sai
che se c'e una certa traccia stai entrando in una zona rischiosa e qualche quality factor potrebbe
diminuire o essere a rischio. Potresti analizzare questo tipo di tracce. Tolleri il non-determinismo:
il workflow e deterministico nel modo in cui lo descriviamo, perche e il designer che esegue ogni
step e decide cosa fare. Se voglio uscire dal ciclo, e solo "sono contento di quello che hai fatto",
e indipendentemente dalla qualita usciamo dal ciclo. Ma durante l'esecuzione di ogni singola
attivita, il sistema potrebbe decidere di usare una certa skill o procedere in un modo che non
conosci in anticipo. Se hai 10 skill, alcune hanno senso, altre meno: questo potrebbe dare una
misura della qualita, o almeno feedback.

Questo e il vero cambio di paradigma: prima dovevi fare workflow molto strict e sapere molto che non
sai, e su-vincolavi il sistema. C'erano i declarative process model: non do un workflow, descrivo
solo alcune proprieta (es. un'attivita sempre eseguita dopo un'altra, ma le altre in parallelo, non
mi interessa). E conformance checking sui process log: rinunciamo ai grandi process model e diciamo
"alcune proprieta devono valere". Ora deleghiamo molto al runtime, a un agente intelligente. Quello
che non abbiamo piu e forse il workflow model, perche e troppo dinamico e non-deterministico. E non
sappiamo molto delle proprieta, ma le proprieta possiamo controllarle, anche sulle execution trace
(es. e sempre fatta una validazione dopo un cambio di codice). Non e una cosa a priori: puoi avere
un monitor che gira in parallelo e fa runtime monitoring.

[Quando e come una skill e considerata.] Una skill e considerata in tre stadi diversi, e in
particolare l'agente non tiene tutti i dettagli della skill ma solo abbastanza per decidere quando
va usata: salva molti token. Hai il nome. Il full text e una descrizione condensata. E una specie di
firma. "Trigger on: investigate, discovery, before I fix it." Puoi anche codificare la skill se sai
cosa vuoi fare; se non lo sai, non puoi.

[Il caso Golden Gate.] Antrobic (Anthropic) ha scritto il paper. Una delle critiche piu ricorrenti:
"e un elegante modello probabilistico". Hanno mostrato che non e puramente probabilistico, con
questo esempio del Golden Gate Bridge. Questo e legato all'applicazione delle skill, alla decisione
di quando una skill va applicata: si potrebbe pensare a lexical matching o distanza lessicale, ma c'e
dell'inference. E il controesempio alla critica che e solo macchineria probabilistica. Il paper e di
maggio 2024, fatto con Sonnet, non il modello piu potente. Hanno usato dictionary learning per
estrarre milioni di feature interpretabili. Hanno dimostrato che va oltre la probabilita: se
descrivi in cinese con gli ideogrammi, e in grado di identificare cosa scrivi (la stessa feature si
attiva con testo, con immagine del ponte). Sembra che il concetto abbia una specie di forma normale,
e indipendentemente da come descrivi il concetto puoi raggiungerla. Concetto molto forte. Il
problema e cosa sia il concetto: ci sono discussioni ontologiche. Cos'e il Golden Gate? Il ponte, il
building plan, la foto? Identificato come l'oggetto concreto, la costruzione, e poi collegato col
construction plan.

Se questo fosse possibile, sarebbe davvero piu che probabilistico. "Se stai usando questo nella tua
scrittura contro la versione piu pulita Golden Gate, questa e evidenza di una rappresentazione
interna causalmente efficace, che mina la visione probabilistica naive senza ribaltare l'account
probabilistico." E cruciale per l'applicazione delle skill, perche hai dell'inference sul linguaggio
naturale mappato a un concetto. Legato al triangolo semiotico: il concetto, la rappresentazione, e
l'interprete (l'oggetto). Stavano scrivendo un libro sulla guerra, una menzione inglese del ponte,
e una discussione in giapponese, cinese, greco, vietnamita, russo, e anche un'immagine: queste sono
istanze multimodali, identifichi il concetto dentro queste rappresentazioni. In alcuni casi non
menzioni nemmeno "Golden Gate Bridge", solo la descrizione, e ancora viene identificato.

[Discussione probabilistico vs concettuale.] Per me la base reasoning e probabilistica: descrivi
qualcosa in giapponese, e stato addestrato su testi dove il termine co-occorre con parole
importanti. La domanda principale: a quale livello di qualita potresti dire che il reasoning
probabilistico apre la porta a un mondo concettuale dove fai logical reasoning? Se il modello
probabilistico funziona cosi bene che non lo distingui da un approccio concettuale e logico, forse e
quello il punto: da un punto di vista osservazionale sono equivalenti. Da un punto di vista
concettuale e molto diverso. Puoi pensarli come due layer: il layer logico/concettuale e quello
fisico. Il problema: questi modelli sono pain-perfect, qualunque cosa vedano la pensano vera. Noi
umani sul layer logico possiamo dire no. Se inietti molti dati strani li ripetono. Artificial
ignorance, non solo intelligence: se puoi ignorare le cose, fai un passo avanti. L'esperimento e
interessante. Questo e anche un tema per la selezione delle skill: se hai skill usate in
programming, le trovi molto in repository open source. Funziona bene in un dominio specifico: come
potrebbe andare con domini dove non c'e molto materiale (es. poca ATL)?

[Su ETL/ATL.] Puoi avere una rappresentazione astratta delle trasformazioni: se hai una
rappresentazione intermedia di trasformazioni ETL e sei in grado di mapparla nella concrete syntax
di ATL, allora puoi estendere quello che impari con ETL ad ATL. Sarei sorpreso se non lo facessero
gia.

[Quando viene applicata la skill.] Il sistema ha il nome e la descrizione, e usa solo nome e
descrizione per capire se un contesto contiene questa descrizione o puo essere connesso ad essa. Poi
c'e il body della skill, la parte operativa. Hai nome, descrizione, e parte operativa. Il coding
agent considera la skill principalmente a execution time, e c'e una deliberate ordering rule: non e
dichiarativo, perche l'ordine conta. Se vuoi scrivere un documento, ti serve la skill per quello, e
la skill puo usare tool esterni deterministici comunicando con MCP. Una activity, puoi eseguirla di
nuovo e l'output puo essere diverso ogni volta. E un'applicazione rule-based di una forma di
competenza, ma non e la trasformazione: sono le rules aggiunte alla trasformazione. Quando chiami la
skill e si esegue, quella e una trasformazione. E un nuovo modo di pensare alla programmazione.

---

## Meeting 6

Come implementiamo queste funzioni, hardware e software? Iniziamo molto high level e poi spezziamo.
Potrei usare questa pipeline per tutti i livelli: "ho una libreria e un sistema di gestione per i
miei libri", e potrei anche dire "ecco una claim" e catturare quali entita gestiscono il mio library
system. E molto generale. Quando inizi qualcosa cosi, dovremmo capire quali sono gli ingredienti di
base necessari per realizzare un'applicazione in un dominio o in un altro. Le caratteristiche
dell'applicazione possono essere molto diverse: un sito web e diverso da un'applicazione mobile.
Qui abbiamo qualcosa che descrive la semantica del dominio (descrittivo) e qualcosa di operazionale
(le rules, i constraint, il modo in cui questo tipo di cose deve comportarsi). Mi chiedo se tutte le
parti operazionali possano essere rappresentate come skill: ha molto senso.

E poi abbiamo il resto. I discovery report sono qualcosa che viene letto. Quello che vedo: questo non
e usato da nessuno, ed e un errore, perche deve essere usato qui. Altrimenti stai implementando
qualcosa senza considerare cosa hai scoperto del sistema. E un documento intermedio che da
informazioni sullo stato della codebase e vincola il modo in cui implementi nuove feature: deve
essere usato da qualcuno qui sotto. Normalmente va in una cartella e ogni discovery e un file
individuale. E una specie di database: memorizzi e tieni la storia di tutte le discovery. Immagina di
voler implementare una nuova feature: il sistema produce un prompt, che e una query sulla codebase e
sugli altri documenti, e genera un report (markup) con informazioni sulla codebase, per esempio se
devi modificare cose pericolose con possibile ripple effect o regressione. Prendi questo discovery
report, lo dai di nuovo al sistema (anche automaticamente), e genera un altro prompt che implementa
la feature.

Normalmente dopo una discovery il sistema ti chiede qualcosa, perche potresti dover trovare il
giusto trade-off. Spesso: opzione A e opzione B. La prima e la soluzione subottimale ma senza
rischi, non tocchi niente che potrebbe rompere il comportamento. La seconda e la soluzione ideale e
richiede vari step perche devi modificare diverse cose: l'effort e diverso, i rischi sono diversi. A
volte propone solo un'implementazione, quando quello che vuoi e molto semplice; altre volte chiede
se vuoi la soluzione semplice o quella complessa. Dai il tuo feedback e inizia a implementare:
modifica la codebase. Allo stesso tempo, secondo quello che c'e scritto qui e secondo le skill,
aggiorni tutti questi documenti di design (log, report): metti un log qui, una versione distillata di
tutti i tuoi prompt altrove.

Dov'e il modello? Il flowchart e un modello. Ogni input e output possiamo considerarlo un modello.
Questi sono solo rules. Per esempio questo e un discovery report, piu in linguaggio naturale,
conforme a markup. Hai una descrizione, le rules. "Read before every task." Model e effort: il tipo
di LLM e con quale intensita (xhigh, high, medium, max). E scritto che non dovresti mai usare max a
meno che non sia specificato nel prompt. Altre prescrizioni su quando deve fermarsi e chiedere
all'utente: sono considerate risk area, e sono molto project-specific. Il sistema a un certo punto ha
identificato queste parti come qualcosa di rischioso da modificare. Preservation: qualunque cosa
committata e considerata verificata; verified significa che e passata per tutto il processo, incluso
testing automatizzato.

C'e il critical zone con due layer (data e logic) che devono restare in sync: molto tricky, ma non e
qualcosa che deve esserci in ogni progetto, e molto specifico. Una sottosezione e la lista dei file
in questa critical zone, e i layer. C'e il layer impact report: quando cambi qualcosa qui ottieni
uno speciale report (per ogni layer toccato: cosa cambia, cosa non cambia, cross-layer, side effect,
safety). Questi sono test che vanno validati con esempi, generati dall'agente e proposti all'utente:
l'utente e un Oracle debole, non automatico. Ci sono cose proibite, transaction e un tipo speciale
di funzione (una lambda che esegue qualcosa senza interrompere). Molto domain-specific. La sezione
tre e molto domain-specific.

Il version fixer e qualcosa che rileva una specie di code drift o disallineamento e prova a migrare
l'artefatto verso le nuove versioni consistenti: una specie di recovery procedure. Ora e applicato
in modo molto specifico, ma ha senso come feature generale del workflow. I port sono dove gli edge
si attaccano ai nodi nel canvas. Poi come accedere allo stato del sistema. Scope e anti-refactoring.
Cos'e anti-refactoring? E l'opposto del refactoring: piu recentemente, perche l'AI ha la tendenza a
toccare il tuo codice senza chiedere. E specifico per lo sviluppo AI: dici "non puoi andare a far
sembrare giusta qualche funzione". Modifica solo i file nominati nel prompt (il prompt non e quello
dell'utente ma quello generato dall'agente architetto). Change minimization: la minima modifica,
perche altrimenti tocca tutto.

Per esempio: se serve aggiungere un import mancante, e una modifica minima, viene applicata e
documentata (menzionata); ma se la modifica e piu ampia, va chiesta prima e non eseguita in modo
silenzioso. C'e una do-not list (blacklist): rename existing identifiers, reorder imports of files
not being modified, clean up adjacent code, remove apparently unused code (il codice inutilizzato e
marcato), reformat blocks, modify TypeScript interfaces (oltre ad aggiungere optional properties),
introduce new dependencies. Dipende dallo stack tecnologico (React). Vede la versione precedente,
cosa hai cancellato? E nella storia: c'era un editor v1 implementato manualmente, poi un v2 con
React flow, poi ho provato un v3 ma stava diventando un casino e sono tornato indietro. Ci sono i
CSS token: centralizzare le definizioni CSS per piu coerenza nell'interfaccia.

Discovery before action: il prompt potrebbe avere path sbagliati, va verificato prima di editare.
Sempre prima di modificare un file: find/grep per confermare che il path esista, cat per visualizzare
l'intero file o la sezione rilevante. Cosa sia "rilevante" non e chiaro. All'inizio della sessione
leggi questo, inizia con le non-negotiable rules, poi leggi il claude code log (ultime 5-10 entry).
Visual bugs: quando un bug e riportato via screenshot, il primo step e sempre estrarre la
specificazione formale dal reporter prima di scegliere un percorso diagnostico. Le tre sezioni
(observed, expected, acceptance criterion) sono generali ma applicate a un caso molto specifico
(l'aspetto visivo del canvas). Sotto-rule: verifica i consumer prima di assumere che un output sia
load-bearing; non validare i sort leggendo il comparator.

Commit discipline: solo quando i test passano. Prescrizione sui nomi dei commit: feature, fix,
refactor, chores, docs, test. L'implementer puo fare una di queste categorie di cambio. Subject line
meno di 72 caratteri, commit splittati per tema. Hard stop prima del commit: mostra il diff
all'utente. Guardare il diff di tutto e difficile, e a basso livello; mi chiedo se questo diff possa
essere usato come fonte di documentazione aggiuntiva. Forse scrivi qui che fornisci un summary dei
diff. Mi chiedo se ci serve una nozione di trace link: se cambio il codice qui ed e stato triggerato
dal prompt, e utile averlo. Incident log se c'e un problema.

Design system: non inteso come piano ma come design dell'interfaccia utente (colori, font, size).
Deve usare bootstrap icon. Importante per l'implementazione ma non per la nostra analisi. Token
system: i token sono variabili usate col CSS (primary color, accent, background, radius).
Convenzioni: camel case, pascal case, constant in upper snake case, file CSS in kebab-case. Sono
rules, e si riferiscono specificamente a cose definite da React. E tra la semantica del dominio e
del problema e della soluzione. E come quello che normalmente hai in molti tool in modo piu
informale, discusso e tenuto in testa. Sembra che qui sia esplicitato. Forse c'e un modello di
quando questo file e prodotto.

Siamo solo a meta del documento. Third attribute settings, nessuna idea. Removed components: ci
sono versioni di editor rimosse. C'e l'expression language (JjEL): c'e la specification. E
interessante, e la prima volta che introduce il termine specification.

[La SPEC di JjEL.] Jodl expression language specification. Objective: e un linguaggio dichiarativo
per navigare, interrogare e trasformare i modelli. "Transforming" e sbagliato perche non trasforma
niente, e read-only. Non vuoi side effect. Potrebbe esserci qualche side effect: a volte qualcosa
funziona in modo diverso, ieri ho notato qualcosa che non funzionava come due settimane fa. Design
criteria: deve essere molto dichiarativo (l'utente descrive cosa vuole, mai come), ogni espressione e
pura e produce un valore senza side effect. Minimum cognitive load: poche regole da ricordare. Le
operazioni MDE piu frequenti sono metodi nativi (toUppercase, toLowercase, toData). I connettivi
logici sono testuali (AND, OR, NOT). Ci sono costrutti come "forall exists implies". Non e un
constraint language come OCL: non asserisce cosa deve essere vero (cosa che pianifico di fare, per la
validazione). Non e un linguaggio di programmazione come JavaScript (niente variabili, loop, side
effect). Non e un linguaggio di trasformazione. Non e un query language come SQL: non interroga
database, naviga un model graph. Direi che e un query language, con la differenza dell'indicizzazione.

[Genesi di JjEL.] Generato anche questo. Stavo progettando il transformation language: volevo i lati
buoni di ATL ed ETL. ATL ha un embedding di OCL. Dovevo decidere se avere OCL o qualcos'altro: l'idea
era provare qualcosa di diverso, piu vicino alla notazione matematica (forall c in classes, forall
attributes in c.attributes such that exists). Forniva suggerimenti: potevi concatenare espressioni
(forall c in classes such that there exists an attribute in the attributes of the class that has as
name 'manual'). Mi diceva "ti serve un separatore altrimenti non posso parsare bene". Alla fine e
venuto fuori con un EBNF, e implementava il parser, l'interprete. L'interprete accede automaticamente
ai modelli, ai progetti. La cosa bella: potevo rivedere il linguaggio con piccoli cambiamenti, e mi
chiedevo se dovessi rifarlo a mano attraverso parser e generator (un incubo), ma sembra che sia
molto bravo a farlo, con pochissime alterazioni.

[Operatori, semantica.] Ci sono gli operatori logici, aritmetici, grouping, separatori. Quanti
valori per il Boolean? True, false, null. Non ho undefined. In JavaScript c'e il question mark, non
elegante, ora e nascosto nel linguaggio: non avrai errori perche qualcosa non e stato assegnato,
mantieni il null. Keyword, operatori, operator semantics (ripetizione di stringa, come JavaScript),
lazy evaluation, e la grammatica. Qui siamo definitivamente nel modello. Ora sono d'accordo col
termine specification, perche e abbastanza preciso. Cosa bella: nel transformation language c'e una
grammatica e ho chiesto di generare i railroad diagram della grammatica con esempi, generati
automaticamente, inline col tool. Avevo in mente di usarlo per insegnare.

[Sintassi.] Separation role, such that. Quando fai questo stai attraversando il confine verso l'altro
linguaggio. Exists, implies, with do (puoi avere un'espressione). Conditional expression: sono
espressioni, non statement (if abstract returns abstract). Safe navigation: sarebbe stata molto utile
in ATL, dovevi sempre controllare se il valore era definito. Building methods per stringhe (case,
white space, search), per numeri, per collection (flatten). Variante di OCL. Il linguaggio era usato
in guard condition, mapping expression: quando assegni un valore a un attributo nelle trasformazioni
puoi usare questo expression language. Sulla console posso eseguire questa espressione: c'e
l'assistente, scrivo l'espressione ed e eseguita. Navighi il modello visualmente. Invariants: esistono
ma non ho deciso come introdurle nel metamodello: potresti avere un invariant generale o specifico
per una data metaclasse. Filters and conditions. Open point: if-then-else da un sapore procedurale al
linguaggio ma e molto leggibile; l'idea era avere entrambe le possibilita (espressione, question
mark, valore di verita). Nesting: puoi annidare (forall classes, anche your attributes): ottieni set
of sets, ma c'e una funzione flatten. Tipica in JavaScript. Bella specification, completa, generata
dal sistema, usata da Claude per derivare l'implementazione (gia implementata e integrata). L'input
non era questo documento ma una conversazione: la specification e stata aggiornata mano a mano. Questa
e la specification del modello. E interessante che la chiami specification, non skill. Possiamo
chiamarlo una specie di metamodello.

[Chiusura.] Quello che e confusing: questo non ha una struttura prefissata. Ha una nozione di
coverage che non conosciamo, e copre tutti questi tipi di cose, e probabilmente la coverage ha
natura probabilistica, perche ci sono molti documenti con grammatiche e cose simili.
