# Memo di ratifica: Symbol, due superfici, stencil (D14..D19)

**Data**: 2026-08-15. **Serie**: continua D1..D13 del fronte forme.
**Origine**: discussione in chat Cowork sul cognitive load del pannello e sulla divisione del rail;
due mockup approvati dal direttore («mi piace, proseguiamo veloci con queste scelte»).
**Mockup di riferimento**: `docs/redesign/claude_2026-08-15_mockup_rail_e_modale_symbol.html`,
`docs/redesign/claude_2026-08-15_mockup_catalogo_stencil_nuova_forma.html`.

## D14: riconoscimento strutturale del simbolo

L'identita' semantica di un simbolo e' DERIVATA confrontando gli assi autorati con il catalogo,
mai memorizzata. D10 (un preset e' un valore, non un tipo) resta intatta.

La relazione di equivalenza e' lo specchio esatto di `applyPresetToShape`: contano gli assi che un
preset scrive (form; border.style e border.width, con default solid e 1; marker, dove l'assenza nel
preset richiede l'assenza nella view; fill solo se il preset lo dichiara). Non contano gli assi che
un preset conserva: il colore del bordo, il fill sui preset che non lo dichiarano, labels, badges,
text style. Un asse condizionale non forza «custom» globale: fallisce solo i confronti in cui
quell'asse conta.

Il risultato e' un INSIEME, non un elemento: il catalogo e' dichiaratamente un indice molti-a-molti
sopra lo spazio degli assi (un rombo nudo e' Choice in UML, Decision nel flowchart, Relationship in
ER; un cerchio col dot e' Final state e Marked place). La UI mostra la prima etichetta in ordine di
catalogo e le altre come coda. Lo stato «modificato da X» non e' derivabile senza memoria (Start
event ed End event coincidono su form e marker e differiscono solo sulla width): esiste solo come
stato di sessione del picker dopo un'applicazione, e arriva con la slice della modale (D15).

## D15: due superfici

Il rail tiene il tree piu' una card leggera di identita': riconoscimento (D14), gli assi conservati
(colore), il lancio dell'editor. L'anatomia intera (form, marker, assi del bordo, fill, text style)
vive in una modale con il catalogo a colonna persistente e l'anteprima con label realistica, che
mostra il box prodotto dalla taglia da contenuto (D8). La sintassi astratta NON si sposta: il suo
flusso e' glance-and-tweak ad alta frequenza e resta nel rail (Arco 3 invariato). La semantica di
scrittura resta live, senza apply/cancel: una modale bufferizzata introdurrebbe una terza semantica
di undo sopra il debito del dual undo-system. Stesso trattamento per l'edge authoring.

Scartate: modale per tutte le proprieta' (rompe il ciclo selezione-ritocco-canvas e moltiplica i
cicli apri-chiudi); rail di solo tree (perde il colpo d'occhio: per sapere che simbolo e' una view
bisognerebbe aprire). Vincolo di forma dalla lezione Editor V3: stesso componente di authoring,
ri-ospitato; nessun secondo mondo editoriale con eventi e stato propri.

## D16: regola d'ingresso degli assi

Una capacita' visiva nuova entra come valore di un asse esistente, oppure come asse nuovo solo se
ortogonale e componibile. Mai come caso speciale o flag una tantum. Ogni preset del catalogo deve
essere esprimibile come assi; gli inesprimibili si escludono, non si approssimano (la prassi P5
diventa regola). Il predicato di appartenenza si legge dalla policy, non da liste di id
(precedente: `hasSizeSupplement`).

## D17: stencil di progetto

Uno stencil e' un fascio di valori di assi con un nome, salvato NEL PROGETTO. Il registry a codice
non si tocca (D1 intatta); niente libreria personale trasversale ai progetti: la portabilita' vince.
«Salva come stencil» sta nel footer della modale, attivo negli stati modificato e custom;
l'aggiornamento e' un risalvataggio con lo stesso nome. «Copia da una view del progetto» e' la
sorgente gratuita: ogni view autorata e' gia' una definizione di simbolo. Il riconoscimento D14 si
estende agli stencil.

## D18: catalogo a sezioni

Ricerca come gesto primario, recenti in testa, sezione Progetto sopra le notazioni standard,
sezioni per notazione con contatori e collasso. Precedenza di riconoscimento:
preset di piattaforma, poi stencil di progetto, poi custom. Il catalogo standard resta la parte
condivisa e verificata dello spazio; le forme di progetto vivono nella loro sezione e non inquinano
il sistema di coordinate comune.

## D19: contorni autorabili. RIMANDATA, con condizione di riapertura

Meccanica ratificata per quando si aprisse: definizione dichiarativa (path in viewBox normalizzato
piu' dichiarazione di simmetria), gate di qualita' con rifiuto spiegato (path chiuso, nessuna
autointersezione, profilo di larghezza monotono campionato), obblighi derivati dal percorso
numerico (`boxForContentNumeric`; profilo di rientro campionato dal path). Il risultato e' uno
stencil di progetto, mai una voce del catalogo standard.

**Condizione di riapertura**: D19 si riapre quando un caso d'uso reale, documentato in una
discovery, richiede almeno un contorno non esprimibile DOPO il completamento dello stadio
pathTemplate. Fino ad allora l'ingresso «Nuova forma» NON compare nella UI: niente promesse morte.

## Ordine di implementazione

D14 (modulo puro piu' chip, prima dipendenza di tutto), poi D15 (ri-hosting in modale), poi D18
(catalogo a sezioni), poi D17 (per ultima: e' l'unica che tocca la persistenza del progetto).
D19 chiusa finche' la condizione non scatta.
