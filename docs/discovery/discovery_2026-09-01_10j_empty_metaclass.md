# 10j — l'empty state della metaclasse vuota

Data: 2026-09-01. Slice di sola superficie e copy, seriale dopo 10i.
Sonda: `frontend/scripts/smoke/_tmp_10j_verify.ts`, **before 29/19**, **after 55/0**,
zero errori di pagina in entrambi i giri.

**Chiusura (stesso giorno, secondo giro).** Le due leve del §1 sono state applicate
e la misura rifatta: gronda `24px`, riga di toolbar spenta INTERA. Sonda a 59
asserzioni, **after 59/0**, zero errori di pagina. **Cartello 185px, card 271px**,
contro i **298px** del prima e i **347px** del primo after. Il giro `before` non è
stato ripetuto: i suoi numeri sono di una sonda più corta e restano citati come
tali. Il §1 qui sotto resta scritto com'era — è il reperto che ha portato la
decisione, e riscriverlo cancellerebbe la ragione per cui è stata presa; quello che
segue è il suo esito, non la sua correzione.

---

## 0. Il reperto che cambia la slice: erano DUE casi, non uno

Il prompt descrive un difetto solo («la metaclasse Person è vuota, non il modello»).
La misura ne trova **due**, con due rese diverse, e nessuna delle due nominava la
metaclasse come soggetto:

| Caso | Prima | Card tabella |
|---|---|---|
| modello VUOTO, metaclasse scelta | `EmptyState` «This model has no instances yet» | **298px** |
| modello PIENO, metaclasse vuota | nessun cartello, la riga `No instance of Device in this model.` | **141px** |

Lo schermo del referto utente («Person · 0 instances») è il **primo**: il modello non
ha istanze e la testata nomina la metaclasse, quindi il cartello risponde parlando
dell'altra cosa fra le due che ha sotto gli occhi. Il secondo caso non aveva affatto
il difetto della card, perché non aveva affatto una card.

Sono la stessa domanda — «questa collezione è vuota» — e ricevevano due risposte
diverse. Da qui una condizione sola, `collectionIsEmpty`, per entrambi.

## 1. Il difetto 2 NON è stato corretto dalla misura richiesta

È il reperto da portare a decisione, e va detto per intero.

Sul caso fotografato (`Device · SmEmpty · 0 instances`):

| | prima | dopo |
|---|---|---|
| cartello | 183px | **233px** |
| card della tabella | 298px | **347px** |

La card è **49px più ALTA**, non più bassa. Due ragioni, entrambe misurate:

1. **Il chrome rimosso non occupava altezza propria.** Filtro, segmented e Columns
   stanno sulla STESSA riga di toolbar del bottone «New Device», che resta («resta
   la testata»). Toglierli libera spazio orizzontale e zero spazio verticale: la
   riga c'è ancora, con un bottone solo.
2. **La gronda richiesta è più alta di quella che sostituisce.** `padding-block:
   48px` contro i 32px del componente condiviso: +32px. La CTA dentro il cartello
   ne aggiunge altri ~45 fra margine e bottone. Il cerchio da 48px che se ne va ne
   restituisce 16.

Netto: +50px sul cartello. La misura richiesta è stata applicata alla lettera; il
suo effetto sull'altezza è l'opposto dell'intento dichiarato al punto 2 del prompt.
Le due leve che chiuderebbero il punto, non applicate perché fuori dal mandato:

- `padding-block: 24px` → cartello ~185px, card ~299px (parità col prima, con la CTA
  guadagnata e il copy corretto);
- più la riga di toolbar spenta a zero istanze (oggi contiene il solo «New», che la
  CTA già ripete 40px più in basso) → card ~261px.

La seconda tocca «resta la testata», e la parentesi del prompt su Export fa pensare
che «testata» includa la toolbar: per questo non è stata presa.

**Esito (chiusura).** Arbitrato: «resta la testata» = titolo + sottotitolo, e la
riga di riduzioni si spegne con loro. Entrambe le leve applicate, e la misura
rifatta le conferma: **271px** contro i ~261px stimati, 10px di scarto e nella
direzione giusta. Rispetto al prima della slice: **-27px**, con in più la CTA e il
copy corretto. La condizione è passata dai quattro figli alla RIGA — spegnere i
figli dentro una riga che resta libera spazio orizzontale e zero verticale, che è
esattamente il difetto misurato al punto 1 qui sopra. `New` e la CTA hanno la stessa
condizione (`classShape && !newReason`): nessun caso perde la create.

## 2. Quattro difetti della SONDA, prima di ogni misura del prodotto

Nessuno di questi è un difetto di jjodel. Tutti e quattro producevano numeri veri di
elementi sbagliati, che è il modo in cui una sonda mente senza fallire.

1. **`.jj-empty-state` è condiviso.** Un `document.querySelector` leggeva il cartello
   «No transformations yet» di un ALTRO pannello della pagina. Tutte le misure del
   primo giro (padding, glifo, titolo) erano di quel componente.
2. **I tab inattivi restano montati** (R-A) e rc-dock li tiene **dimensionati**,
   traslati dentro un contenitore clippato. Quindi `offsetParent !== null`,
   `:visible` di playwright **e** l'intersezione col viewport sono veri per
   entrambi: la sonda leggeva «State · SmFull · 3 instances» mentre a schermo
   c'era SmEmpty. L'unico test che regge è il **hit test** (`elementFromPoint` sul
   centro del pannello) — la regola §5 applicata alla scelta dell'elemento invece
   che al suo stile.
3. **Il dock è persistito nello stato del progetto**: un secondo `openManager` non
   prende il fuoco nemmeno dopo un reload. Il modello vuoto va misurato per PRIMO,
   quando in pagina c'è un manager solo.
4. **`^Device` sul testo della riga non matcha mai**: la riga comincia con la
   lettera del badge. Il click non avveniva, in silenzio, e la sonda misurava la
   metaclasse precedente credendo di aver cambiato.

## 3. La cascata sul componente condiviso, e perché il selettore raddoppia

`EmptyState` resta intatto: lo montano otto punti dell'app. La differenza sta nel
foglio del manager, e il selettore è `&__empty.jj-empty-state`, non `&__empty`.

Il componente dichiara le proprie regole scure come `[data-theme="dark"]
.jj-empty-state__icon-circle` — specificità (0,2,0). A classe singola le regole del
manager pareggerebbero e perderebbero per ordine di cascata. Raddoppiando, ogni riga
sta un gradino sopra la sua omologa scura.

**Misurato, non dedotto** (blocco 8 della sonda, tema scuro acceso a runtime):
glifo 32px, cerchio `rgba(0, 0, 0, 0)` mentre il componente dichiara `#1e293b`,
titolo 600, sottoriga 13px. La mutazione che toglie il raddoppio fa cadere 6 test.

## 4. I due grigi sono i due che il file già usa

Nessuna tinta nuova, nessun letterale: `--color-form-border-strong` (slate-300) per
il glifo — è il colore che `__foot-of` e `__th--readonly` danno **già al testo** in
questo stesso foglio, quindi è convenzione locale e non un prestito da una famiglia
di bordi — e `--color-form-muted` (slate-400) per la sottoriga. Entrambi virano col
tema, verificato: `rgb(203,213,225)` → `rgba(255,255,255,0.16)` e
`rgb(148,163,184)` → `rgb(96,96,96)`.

Nota per chi guarderà il contrasto: in scuro il glifo compone a circa `#3B3B3B` su
`#16181a`, cioè ~1.5:1. È decorazione, non informazione (il testo dice tutto), e la
gerarchia «glifo più quieto del testo» è la stessa nei due temi. A schermo si legge.

## 5. Export: la scelta è ASSENTE, e non è servito un ramo

Il prompt chiede di dichiararla. Export è già condizionato a `rows.length > 0`: a
zero istanze era assente **prima** di questa slice e lo resta. Nessuna riga nuova.

## 6. Espansione di scope dichiarata

`__tests__/instanceManager10c.test.ts` non era nel perimetro. 10c pinnava
`expect(CODE.match(/<EmptyState/g)).toHaveLength(1)` come surrogato dell'invariante
«un cartello solo, niente cascata». 10j ne aggiunge un secondo, ma i due sono **rami
alternativi della stessa catena ternaria**: mai due a schermo. Il surrogato è stato
sostituito con l'asserzione dell'ALTERNANZA, che dice la stessa cosa e dice di più —
due `<EmptyState>` in rami che si escludono non possono comparire insieme, mentre
due conteggiati a uno non escludevano nulla. L'invariante di 10c non è stato tolto.

## 7. Coordinamento: 10i era STAGED e non committata

Trovata alle 00:29 in scrittura attiva sugli stessi due file; alle 06:18 completa
(referto, sonda before/after, tutto in `git add`) ma **mai committata** — la sessione
si è chiusa fra lo stage e il commit. Nessuna attività dalle 00:50.

Il lavoro di 10j è stato fatto nell'albero, non nell'indice: l'indice teneva 10i
intatta, l'albero teneva 10i+10j.

**Come è finita, misurato il 01-09: questo paragrafo supera il resto della sezione.**
Il commit che ha chiuso 10i — `dc6ae5c52`, intitolato *«le intestazioni in maiuscolo
e il pannello Columns (10i)»* — ha committato l'ALBERO, non l'indice: porta dentro
di sé anche il delta 10j di `InstanceManagerTab.tsx`, di `instanceManagerTab.scss` e
il riallineo di `instanceManager10c.test.ts`. Il suo messaggio parla della sola 10i,
quindi **dichiara meno di ciò che porta**. Restavano fuori solo la suite
`instanceManager10j.test.ts` e questo referto.

Il commit di chiusura di 10j, di conseguenza, non contiene il grosso della slice: ne
porta le due leve, la suite e questo documento. La rettifica del non-detto vive
nell'entry di log di 10j — il log è add-only (R-RAIL-45), quindi l'entry di 10i
resta com'è e la correzione si legge in quella nuova.
