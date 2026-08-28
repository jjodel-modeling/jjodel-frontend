# Prompt — I nodi istanza singleton si disegnano come pill

Data: 2026-08-28 15:00
Consegnato: in chat (nessun documento preesistente; vedi la nota in coda)
Protocollo: `docs/PROTOCOL.md` — clausole P1..P10 applicabili.
Discovery di Fase 1: `docs/discovery/discovery_2026-08-28_singleton_pill.md`

---

## Task

Estendere il lavoro di livello 3 (Row-view) gia' in corso. Cambio **additivo**:
nessuna configurazione di nodo esistente cambia comportamento, e il nodo istanza
rettangolare specificato in `README.md` resta esattamente com'e' per ogni
istanza non singleton.

Riferimento di design: `Instance Node Proposal.dc.html`, sezione «Turno 4»
(opzioni 4a-4d). Prototipo di design, non codice da copiare: il trattamento va
ricreato nel frontend con il sistema di token SCSS di
`frontend/src/styles/tokens/`, non copiando stili inline.

## Problema

Le istanze singleton (`Red`, `Green`, `Blue`, `Config` nel modello Shape) oggi
non sono differenziate in alcun modo: si disegnano come rettangoli ordinari,
`Red : Red`, con il compartimento vuoto. Due difetti:

1. **`Red : Red` e' ridondante.** Per un singleton nome e tipo coincidono
   (`joiner/classes.ts:942` — `addObject({name: d.name})` da' all'istanza il
   nome della classe alla nascita), quindi la meta' «tipo» dell'header non porta
   informazione, e il compartimento vuoto sotto non ne porta nessuna.
2. **Non c'e' alcun segnale che l'istanza sia un singleton**, che e'
   informazione di modellazione vera: l'istanza e' l'unico membro della sua
   classe.

**Non esiste un trattamento ciano dei singleton da rimuovere.** Una bozza
precedente di questo prompt lo affermava: era sbagliato, il ciano nello
screenshot di partenza era lo stato di selezione. La lettura corretta di quella
osservazione e' il vincolo qui sotto, non un difetto da correggere.

**Vincolo che ne segue**: il ciano e' riservato alla selezione e vince sempre
(`README.md`, «Selected state»). Non differenziare i singleton con un
riempimento di alcuna tinta. La differenziazione vive nella **forma** e
nell'**etichetta**.

## Cosa costruire

### 1. Risoluzione della forma — sul contenuto, non sul flag

```
isSingleton === true && valuedSlotCount === 0   -> pill
altrimenti                                     -> rettangolo (nodo esistente)
```

Il flag e' `DClass.isSingleton` (`LModelElement.tsx:2659`): sta sulla
**metaclasse**, non sulla view. `valuedSlotCount = slotRows.filter(r => !r.isEmpty).length`;
non e' il conteggio del suffisso `[k]` (quello e' per-slot, i valori dentro UN
solo slot multi-valore) ne' quello del footer (che e' il complemento,
`emptyRowCount`). Un singleton con struttura (un `Config` che tiene
`debug = true, level = 2`) deve restare rettangolo: una pill non puo' ospitare un
compartimento. In quel caso si aggiunge un **badge di cardinalita'**: cerchio
18x18 prima del nome, `border: 1px solid <border>`, IBM Plex Mono 10px/600,
slate-500, glifo `1`. Vedi 4d.

### 2. Geometria della pill

- `padding: 7px 16px; border-radius: 999px`
- Superficie `--color-surface` (bianco), `border: 1px solid <border-default>`
  (slate-300), ombra `0 1px 2px rgba(0,0,0,0.04)`
- `white-space: nowrap`, nessun compartimento, nessuna barra d'accento, nessun
  riempimento colorato in alcuno stato
- **Selezionata**: `border-color: #0891b2` +
  `box-shadow: 0 0 0 3px rgba(6,182,212,0.18), 0 1px 2px rgba(0,0,0,0.04)` —
  identico al trattamento di selezione del rettangolo, cosi' la selezione si
  legge uguale su entrambe le forme. Vedi 4b.
- **Hover**: il token opaco nuovo (vedi «Decisioni»), nessun sollevamento (gli
  oggetti della tela non traslano).

### 3. Risoluzione dell'etichetta

```
firstAbstractDirectSuperclass(metaclass)
  ? `${superclass.name} : ${instance.name}`
  : instance.name
```

- Le superclassi dirette si leggono da `DClass.extends` (`:2648`) — **non** da
  `superclasses` o `extendsChain`, che sono transitive e farebbero emergere un
  antenato di parecchi livelli sopra. L'astrattezza e' il campo D `abstract`,
  **non** `isAbstract` (quel nome esiste solo come rinomina del transformer e
  letto da `idlookup` da' `undefined`).
- Solo dirette, e solo astratte. Una superclasse concreta non qualifica:
  nominerebbe un insieme di cui l'istanza poteva essere membro ordinario, che non
  e' l'informazione da far emergere.
- Con piu' di una superclasse diretta astratta si prende **la prima dichiarata**.
  L'elenco completo resta disponibile nell'inspector. Semplificazione
  deliberata e accettata: non ordinare, non disambiguare, non concatenare.
- Tipografia: superclasse `font-weight: 500; color: <text-secondary>`
  (slate-500), separatore `:` a slate-300, nome dell'istanza
  `font-weight: 600; color: <text-primary>` con `text-decoration: underline;
  text-underline-offset: 3px`.
- **La sottolineatura sta sul solo nome dell'istanza, mai su tutta la run.**
  `Color : Red` deve leggersi «un Red, che e' un Color» — non come un'istanza
  che si chiama letteralmente `Color : Red`. E' la stessa regola UML da diagramma
  degli oggetti gia' applicata all'header del rettangolo; cambia solo la sua
  estensione.

### 4. Parita' riga / canvas

Lo **stesso componente** rende il singleton come valore dentro una riga di
compartimento e come nodo autonomo sul canvas: e' il requisito di parita' di
livello 3 di `README.md`. Sono ammesse **esattamente due** differenze fra le due
posizioni:

- **Scala** — righe inline `font-size: 12px; padding: 2px 10px`; nodi canvas
  `13px` / `7px 16px`.
- **Sottolineatura** — presente sul nodo canvas (e' una specifica di istanza),
  assente sulla riga inline (e' un valore in uno slot).

Tutto il resto — forma, bordo, superficie, risoluzione dell'etichetta — viene da
una sola implementazione. Vedi 4c. Se ci si ritrova a scrivere la logica
dell'etichetta due volte, il confine del componente e' nel posto sbagliato.

## Accettazione

1. Un singleton `Red` con superclasse astratta `Color` si disegna come pill
   bianca che legge `Color : Red`, sottolineatura sul solo `Red`.
2. Un singleton `Config` senza superclasse astratta e senza slot valorizzati si
   disegna come pill bianca che legge `Config`.
3. Lo stesso `Config` con due slot valorizzati si disegna come rettangolo con
   badge `1` e compartimento di due righe.
4. Selezionando una qualunque delle tre si ottiene bordo ciano + anello e nulla
   altro; deselezionando torna la superficie bianca senza tinta residua.
5. La pill `Blue` dentro la riga `color` di `Shape_0` e la pill `Blue` sul canvas
   sono visibilmente lo stesso oggetto a due scale.
6. Nessun ciano, violetto, ambra o altro riempimento categoriale compare su un
   singleton in alcuno stato.
7. La riga `cfg` di `Shape_0` che punta a un `Config` rettangolare (con slot
   valorizzati) mostra ancora la pill di riferimento ciano di oggi, invariata.
   La parita' della pill riguarda la resa del singleton stesso, non le righe
   reference che lo prendono di mira.
8. Entrambi i temi: la superficie della pill resta **opaca** in tema scuro, a
   riposo e in hover.

## Decisioni gia' prese — non riaprire

1. Il bersaglio e' il **ramo nativo di `ObjectNode`**. `classic-object-view.scss`
   e `defaultViewTemplate.ts` sono fuori scope: nessun cambio alla vista
   classica, nessuna migrazione `VersionFixer`, nessun lavoro in critical zone.
   I progetti non migrati mantengono la resa attuale.
2. Token di hover approvato come proposto: aggiungere un
   `--color-inode-pill-hover` **opaco** a `_colors-light.scss` e
   `_colors-dark.scss`. Non introdurre `color-mix()`.
3. Perimetro approvato come elencato — tutti e 7 i file, inclusa la lettura della
   metaclasse del bersaglio **live da Redux** con una firma serializzata invece
   di allargare `refTargets`. Nessun Layer Impact Report necessario.
4. Igiene dei commit: la slice del nodo istanza non committata va portata a
   commit **per conto suo** prima di iniziare questa, e `StatusBar.*` /
   `featureSignature.ts` restano fuori da entrambe. La pill deve essere
   rivedibile come diff a se' stante.
5. Una pill `Config` che non mostra alcun tipo e' voluta. Per un singleton senza
   superclasse astratta il nome e' l'etichetta completa.
6. La parita' e' solo del ramo nativo. I widget di riferimento IR non sono
   toccati.

## Fuori scope

Il routing degli archi da e verso le pill (la geometria degli ancoraggi su una
forma completamente arrotondata e' un problema a se'), il pannello inspector che
elenca le superclassi astratte rimanenti, e i campi di livello 2 della Structure
tab.

---

## Nota sul riferimento di design

Il prompt cita «Turno 4 (opzioni 4a-4d)» di `Instance Node Proposal.dc.html`,
indicandola in testa al file sopra «Turno 3». **Quella sezione non e' presente
nella copia in repo**, ne' prima ne' dopo la richiesta di ri-pull: il file e'
rimasto invariato (35239 byte, mtime `2026-08-28 01:02:51`), contiene «Turno 3»
a riga 31 e «Turno 2» a riga 174, e `grep -rin singleton` su tutti e quattro i
`.dc.html` piu' il README esce con stato 1. Controllo positivo sullo stesso
comando: `grep -c "Turno 2"` restituisce 1. La cartella e' untracked, quindi non
c'e' remote da cui il ri-pull possa aver preso.

Il testo del prompt porta per esteso ogni valore concreto (geometria, colori,
tipografia, risoluzione dell'etichetta, parita', criteri di accettazione), quindi
l'esecuzione e' stata fatta su quello. Resta senza il riscontro visivo che le
quattro opzioni avrebbero dato: dove il testo non fissa una scelta, la resa e'
un'interpretazione e non un riscontro sul disegno.
