# Discovery: dimensione del lotto e ordinamento nel catalogo progetti

**Data**: 2026-08-14
**Autore**: sessione Cowork (Claude), lettura diretta del working tree
**Branch**: `alfonso-frontend-jjtl`
**Working tree alla lettura**: pulito salvo `.claude/settings.local.json` e `_to_delete/` untracked.
Parte da `f55e9e2a5` (rimozione del rail destro).

**Obiettivo**: due domande poste da Alfonso in sequenza. (1) Il numero di righe visualizzate puo'
essere funzione della risoluzione? (2) Aggiungere piu' criteri di ordinamento oltre al cronologico.

**Origine**: continuazione diretta del task del rail destro. La prima domanda nasce dal fatto che
la griglia e' passata da tre colonne fisse ad `auto-fill`.

---

## 1. Tre nozioni di "quanti ce ne stanno", tutte nello stesso componente

Trovate in `pages/components/catalog/Catalog.tsx`:

| Nozione | Dove | Su cosa si basa |
|---------|------|-----------------|
| Colonne effettive | `catalog.scss` `.slider-page--gallery` | larghezza del **contenitore**, via `auto-fill` |
| `cardsPerPage` | `Catalog.tsx:338-342` (pre-fix) | `window.innerWidth`, tabella 9 / 6 / 3 |
| `PROJECTS_PER_BATCH` | `Catalog.tsx:36` | costante 12 |

I commenti accanto alla tabella dicevano `3x3 (max)`, `2x3`, `1x3`: era scritta assumendo tre
colonne fisse. Prima del passaggio ad `auto-fill` le tre nozioni andavano d'accordo per
coincidenza aritmetica, perche' con tre colonne sia 12 sia 9 sono divisibili per tre.

**Regressione misurata, introdotta da `f55e9e2a5`**: a quattro colonne il primo Load More porta a
`12 + 9 = 21` schede, cioe' cinque righe piene piu' una scheda sola. Il secondo porta a 30, sette
righe piu' due. La riga spaiata compare dal primo Load More in poi.

Da notare anche che `window.innerWidth` e la larghezza del contenitore non sono la stessa cosa: la
seconda dipende dal rail sinistro e dal cap di `.dashboard-main-content`. Una tabella di
breakpoint in JS e' destinata a divergere dal layout ogni volta che cambia il contorno, ed e'
esattamente quello che era successo.

## 2. Come si conta una colonna senza riscrivere il CSS in JS

`getComputedStyle(el).gridTemplateColumns` non restituisce la dichiarazione (`repeat(auto-fill,
minmax(280px, 1fr))`) ma la **used value**, cioe' la lista delle tracce risolte, una voce per
colonna, in pixel. Contare le voci e' quindi chiedere al browser cosa ha fatto invece di
riderivarlo. Due proprieta' utili: con `auto-fill` le tracce vuote esistono e vengono contate,
quindi il numero e' quello visivo anche con pochi progetti in lista; su un elemento non renderizzato
il valore e' `none`, quindi il caso va guardato esplicitamente.

`ResizeObserver` sull'elemento griglia copre sia il resize della finestra sia i cambi di larghezza
del contenitore che la finestra non vede. L'osservatore va ricreato al cambio di `viewMode` perche'
in vista lista quell'elemento non esiste.

## 3. Stato del ricambio di `cardsPerPage`

`cardsPerPage` aveva tre consumatori: `totalPages` (`:421`), l'incremento del Load More (`:428`) e
la condizione del messaggio "All projects loaded" (`:482`). Sostituirne il corpo con
`gridColumns * GRID_ROWS_PER_BATCH` li serve tutti e tre e riduce le tre nozioni a due (la costante
12 resta come default prima della prima misura, e come lotto della **vista lista**, che ha un
layout diverso e non e' toccata).

`windowWidth` e il suo listener di resize non avevano altri consumatori (ricerca su tutto il file:
righe 200, 339, 342 e nient'altro). Sono stati rimossi perche' l'osservatore li rimpiazza
esattamente: lasciarli avrebbe significato tenere in piedi un `setState` per ogni frame di resize
che non alimenta piu' nulla. E' sostituzione, non pulizia adiacente.

`prevPage` / `nextPage` / `slider-navigation` risultano invece **definiti ma mai renderizzati**
(ricerca su tutto il file: solo le definizioni a `:423-424`). Non toccati, Regola 9.

## 4. Ordinamento: cosa c'era e cosa e' disponibile

C'era **un solo ordinamento, implicito e non selezionabile**, in coda a `getFilteredProjects`
(`:405-406`): `_.sortBy(items, obj => -new Date(obj.lastModified).getTime())`. Unica occorrenza di
lodash nel file.

Campi disponibili su `LProject` (`joiner/classes.ts:2996` e seguenti): `name`, `lastModified`
(`:3022`), `creation` (`:3021`), `favorite`, `viewpointsNumber`, `metamodelsNumber`, `type`,
`tagNames`.

`creation` esiste ed e' un timestamp, ma e' stato aggiunto dopo: i progetti salvati prima non lo
portano e leggerlo restituisce `undefined`. `new Date(undefined).getTime()` e' `NaN`, e un
comparatore che restituisce `NaN` produce un ordine non definito sull'intero array, non solo sulle
coppie coinvolte. Serve quindi una normalizzazione, non un accesso diretto.

Sul confronto per nome: la lista reale contiene `testbed`, `Testbed 3`, `testbed2`, `testbed 4`.
Un confronto per code unit mette tutte le maiuscole prima di tutte le minuscole, quindi
`Testbed 3` finirebbe lontano da `testbed2`. `Intl.Collator` con `sensitivity: 'base'` e
`numeric: true` ordina per nome e tratta le cifre come numeri.

## 5. Dove vive la scelta

Il filtro per tab e' gia' nell'URL (`?filter=`, `Catalog.tsx:174-176`) e il `LeftBar` ci si
sincronizza. Mettere l'ordinamento nello stesso posto (`?sort=`) riusa il meccanismo esistente,
sopravvive al reload, e' condivisibile e non introduce storage lato client. Il valore di default
non viene scritto nell'URL, cosi' `#/allProjects` resta pulito.

## 6. Rischi

1. **`ResizeObserver`** e' disponibile ovunque tranne browser molto vecchi. Il codice degrada al
   default di tre colonne se manca, senza lanciare.
2. **Un ciclo di misura mal fatto oscilla**: se la misura cambiasse il numero di schede e questo
   a sua volta cambiasse la larghezza (per esempio facendo comparire una scrollbar), si
   entrerebbe in un loop. Qui non succede perche' il conteggio delle tracce non dipende dal numero
   di elementi, e la guardia `prev === count` evita il set di stato inutile. Da verificare a
   schermo, non dedotto.
3. **`creation` mancante** sui progetti vecchi: sotto "Recently created" finiscono in fondo. E'
   il comportamento scelto, non un difetto silenzioso.
4. **La riga dei controlli si allunga**: sort piu' toggle vista piu' ricerca. Larghezza stimata
   circa 530px contro i 320px di prima, dentro una griglia che ora e' larga almeno 1000px. Da
   guardare a finestra stretta.
5. **Gate non eseguibili da questa superficie**, limite ambientale gia' registrato.

## 7. Criterio di accettazione

> A qualsiasi larghezza di finestra, l'ultima riga della griglia e' piena tanto all'apertura quanto
> dopo ogni Load More; e il menu di ordinamento cambia l'ordine delle schede mantenendo il filtro,
> la ricerca e il tag attivi.

Controlli: (a) apri, conta le righe, allarga la finestra fino a cambiare colonna e verifica che le
schede gia' caricate non spariscano; (b) Load More due volte, nessuna scheda spaiata in fondo;
(c) "Name (A to Z)" mette `blabla` prima di `Class Diagram` e tiene `Testbed 3` accanto a
`testbed2`, non separati per maiuscola; (d) l'URL diventa `?sort=name`, e un reload lo conserva;
(e) "Last modified" toglie il parametro dall'URL; (f) l'ordinamento resta applicato passando alla
vista lista.
