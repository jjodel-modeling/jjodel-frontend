# Sessione 2026-08-28 (sera) — Livello 3: la libreria Row view

Branch `alfonso-frontend-jjtl`. Prompt: `docs/design/design_handoff_instance_node/PROMPT_row_view_library.md`.
Riferimento visivo: `Instance Node Proposal.dc.html`, Turno 5 (`5a` la libreria, `5b` collection e
reference rotte, `5c` l'ispettore). Il bundle era gia' aggiornato al Turno 5 in working tree
(mtime 16:54, +147 righe rispetto a HEAD): nessun ri-pull necessario.

Base: la pill singleton (`ee0eb3bdb`, `eb9645761`), primo membro della libreria e forma da imitare —
un modulo di risoluzione puro piu' un componente presentazionale con `variant: 'node' | 'row'`.

## Due lacune misurate prima del diff

Il prompt fonda quattro cose su un meccanismo che non esiste, e una quinta su un dato che nessuno
conserva. Entrambe sono state portate ad Alfonso con le opzioni prima di scrivere codice; le
decisioni sotto sono sue.

### 1. Le annotazioni del metamodello non funzionano

Ecore ha `EAnnotation` con `details` a chiave, e il D layer ha la classe. Misurato il 2026-08-28:

- `EcoreParser.parseDAnnotation` ritorna `[]` **alla prima riga** (`api/data.ts:650`): nessun import
  ha mai prodotto un'annotazione;
- `DAnnotationDetail` (`LModelElement.tsx:150`) e' una classe il cui corpo intero e' `// todo` —
  non ha ne' chiave ne' valore da tenere;
- `addAnnotation` ha **zero call site**, quindi nemmeno la scrittura esiste.

Quindi l'unita' di `numberUnit`, i bounds di `progress`, il trattamento `code` e la dichiarazione di
regola 1 su cui poggia l'override dell'ispettore non avevano dove stare.

**Opzioni presentate.** (A) codificare in `DAnnotation.source`, che e' un campo stringa vero e ha un
costruttore funzionante; (B) riempire il `// todo` di `DAnnotationDetail`, semanticamente giusto ma
modifica al core (regola 5) e comunque inutile finche' il parser resta stub in lettura; (C) niente
persistenza, che pero' rende irraggiungibile il criterio di accettazione sull'override.

**Scelta: (A).** Una `DAnnotation` per chiave, `source = "jjodel/<chiave>=<valore>"`, genitore la
`DAttribute`. Quattro chiavi: `renderer`, `unit`, `min`, `max`. Il prefisso di namespace e' cio' che
rende la lettura sicura: nessuno oggi legge `DAnnotation.source`, ma chi cominciasse distingue le
nostre quattro da un'annotazione arrivata altrimenti.

`DAnnotation.new(source, details, father)` collega da solo il puntatore: il costruttore fa
`setExternalPtr(father, "annotations", "+=")` (`joiner/classes.ts:810`), quindi non serve una seconda
azione. La chiamata resta **nuda**, mai dentro una TRANSACTION esterna: e' un creatore (§3.3).

**Costo dichiarato, non risolto qui.** Un round trip `.ecore` le perde, perche' `parseDAnnotation` e'
stub anche in lettura. Riempire quello stub sistemerebbe insieme questa codifica e le EAnnotation
vere, ed e' li' che vale la pena spendere lo sforzo.

`code` non ha una chiave propria: e' `jjodel/renderer=code`. Non e' una scorciatoia — `code` per
specifica ha **solo** l'annotazione come innesco, quindi la sua annotazione *e'* una dichiarazione di
regola 1, esattamente come lo diventa un override dell'utente.

### 2. Una reference rotta era invisibile, e il nome del target non lo conserva nessuno

`jjomTransformers.ts:337-352` scartava ogni puntatore che non risolvesse
(`typeof v === 'string' ? null : v`, poi `if (target?.name)`). Un target cancellato spariva dalla
riga: indistinguibile da una proprieta' mai valorizzata.

La condizione e' pero' raggiungibile, perche' cancellare un `DObject` **non** ripulisce i puntatori
entranti — il reducer toglie il record da `idlookup` e nessuno percorre gli archi in ingresso
(stessa lacuna che `docs/decisions.md` R-SGL-9 (f) registra per gli archi M1). Il puntatore penzolante
resta in `DValue.values`.

Il **nome**, invece, se n'e' andato con l'oggetto. Tre modi di riaverlo: (1) stampare l'id, sempre
disponibile e sempre corretto, ma si legge come output di debug; (2) ricordarlo per la sessione;
(3) persisterlo nel D layer, corretto sempre e fuori scope di un lavoro di livello 3 (schema +
VersionFixer).

**Scelta: (2) con (1) come fallback**, l'unica combinazione senza risposta sbagliata. `brokenRefMemory.ts`
tiene una mappa a livello di modulo, alimentata dal transformer a ogni passata su un target che
risolve; quando l'oggetto sparisce il nome e' gia' li'. Dopo un reload il nome non c'e' e la riga
degrada all'id accorciato invece che a un'ipotesi sicura di se'. Stato di modulo e non Redux: deve
sopravvivere allo smontaggio dei nodi (la riga che si rompe sta su un nodo **diverso** da quello
cancellato) e non e' ne' dato di modello ne' annullabile.

## Terza decisione, presa in corso d'opera

L'ispettore si apre con **Alt+click**, non col tasto destro. Il canvas lega gia'
`onNodeContextMenu` su ogni nodo (`EditorV2.tsx:2749`); prenderlo sulle celle valore avrebbe tolto
quel menu su parte di ogni nodo istanza — una regressione su comportamento committato (regola 3).
Alt+click non ombreggia nulla: click semplice seleziona e modifica, doppio click modifica, tasto
destro apre il menu del nodo. Il suggerimento sta nel `title` del **nome** della proprieta', non
della cella valore, perche' quella appartiene al renderer che ci dipinge dentro.

## Quarta decisione: l'ispettore serviva un'affordance visibile

Alt+click da solo non e' un modo di scoprire che il pannello esiste. Alfonso ha chiesto un'icona
`bi-sliders` 14px slate-400 al bordo destro della cella valore, rivelata sull'hover della riga con la
transizione di casa — lo stesso schema con cui le card di progetto scoprono le loro icone d'azione
(`project-editor.scss:110`), quindi zero vocabolario nuovo. Alt+click resta come acceleratore per chi
sta controllando molte proprieta' di fila.

Due scostamenti dalla lettera della richiesta, entrambi imposti dal DOM esistente:

1. **`.mm-object__row` non esiste.** Il compartimento e' `display: grid` a due colonne e la label e il
   valore sono figli **diretti** della griglia: avvolgerli in una riga romperebbe
   `grid-template-columns: fit-content(45%) 1fr` su ogni nodo istanza. Sono pero' fratelli adiacenti,
   il che basta: `.mm-object__slot-value:hover` e `.mm-object__slot-label:hover + .mm-object__slot-value`
   coprono le due meta' della riga e producono esattamente l'hover di riga chiesto, senza toccare il
   DOM. E' anche lo schema che `.mm-object__enum-chevron` usa gia' due regole piu' sotto.

2. **Slot riservato con `padding-right: 18px` fisso sulla cella**, non con una terza colonna di
   griglia. Costa 18px di larghezza valore su ogni riga, sempre, ed e' il prezzo giusto: fare spazio
   sull'hover farebbe scorrere il valore sotto il puntatore, e «un valore che si sposta quando ti
   avvicini e' peggio di nessuna affordance». Riservare vuol dire anche che l'icona non finisce mai
   sopra una stringa troncata con l'ellissi, cosa che `truncatedText` — il pavimento della libreria, e
   quindi il suo membro piu' frequente — incontrerebbe di continuo.

`position: relative` sulla cella e' sicuro accanto al popover degli enum: `.inline-type-select` e'
gia' `position: relative` per conto suo (`EditorV2.scss:2355`), quindi la sua lista si posiziona
contro quello e non contro il primo antenato relativo. Verificato prima di aggiungerlo.

L'icona porta `nodrag` e ferma anche `onMouseDown`: senza, React Flow inizia a trascinare il nodo
sotto la pressione e il click non arriva mai. E compare su **ogni** riga, incluse quelle gia'
`dichiarato` — il pannello della ladder e' il posto da cui si annulla un override, quindi nasconderlo
li' chiuderebbe l'unica uscita da una dichiarazione.

Ancoraggio: entrambi i punti d'ingresso ancorano il popover alla **cella valore**, mai all'icona. Un
pannello ancorato a un glifo di 14px comparirebbe in un punto diverso a seconda di come lo si e'
aperto, per la stessa riga.

## Cosa e' stato costruito

| File | Ruolo |
|---|---|
| `valueRenderer.ts` | La meta' che **decide**. Da 5 kind a 12 (i nove piu' `dash`, `collection`, `brokenRef`), piu' `traceLadder` che riporta tutti e quattro i pioli. Puro. |
| `RowValue.tsx` | La meta' che **dipinge**. Nove renderer, `variant: 'node' \| 'row'`. |
| `RendererInspector.tsx` + `.scss` | 5c. Popover in portal su `body`, quattro pioli, footer con la forma riga vera e *Cambia renderer*. |
| `rowViewAnnotations.ts` | La codifica, pura e testabile. |
| `rowViewAnnotationsWrite.ts` | Le due scritture Redux, separate perche' il barrel del joiner trascina Monaco, che dereferenzia `window` all'import e rende il modulo non caricabile sotto vitest (`environment: 'node'`). |
| `brokenRefMemory.ts` | La mappa di sessione. |

Fuori dall'elenco concordato, e riportato: `SingletonPill.tsx` prende una prop opzionale `leading`
(il 5a vuole la forma canvas dello swatch come «la pill col quadrato anteposto»), e `singletonShape.ts`
prende `readSiblingSubclassNames`, perche' la regola 3 possa girare anche quando un enum di colori e'
espresso come `Color` astratta con tre sottoclassi singleton invece che come EEnum. Lo scan e'
protetto da due gate indicizzati (`readIsSingleton`, poi il superclasse astratto): senza, sarebbe una
scansione completa di `idlookup` per nodo per cambio di store.

## Gate

`npm run typecheck` 33 = baseline, nessun errore nei file toccati. `npm run test` 1717 passati, stessi
9 file falliti all'import (`window is not defined`, noti). `npm run build` exit 0 col solo
chunk-warning. Regole CSS nuove verificate sul bundle compilato selettore per selettore, incluso
l'ordine di cascata di `.mm-object__chip--more` dopo `.mm-object__chip` e i due valori di tema di
ogni token nuovo.

**Smoke visivo: non eseguito.** Gli otto criteri di accettazione richiedono un canvas con un modello;
la checklist e' consegnata ad Alfonso.


---

# Coda: la fixture di smoke, e due ipotesi smentite dalla misura

`?smoke=rowviews` (`examples/RowViewSmoke/`, `components/devtools/SmokeBoot.tsx`) costruisce progetto,
metamodello e modello e apre il canvas su un `AllNine` che mostra tutti e nove i renderer in un nodo.
Dev-only: `SmokeBoot` e' inerte fuori da `import.meta.env.DEV` e l'import dinamico viene eliminato
dal build, verificato cercando `AllNine` in ogni `dist/**/*.js`.

## Cosa la costruzione ha misurato

Cinque tentativi di creare le istanze, ciascuno che correggeva il precedente, ciascuno una misura:

1. `addObject({name}, classId)` — respinto: il primo argomento e' uno **schema di matching** passato a
   `getInstantiableClasses`, non un sacco di valori iniziali.
2. `DObject.new(classId, …)` — l'oggetto esiste, `features` vuoto.
3. `addObject({}, classId, true)` — l'oggetto esiste, `features` vuoto **sulla lettura sincrona**.
4. `addObject({}, undefined)` — respinto, uno schema vuoto non conforma a nessun tipo.
5. Rimbalzo `instanceof = undefined` poi `= klass` per forzare la conformity: il clear ha preso, il
   re-set no, e tutte le istanze sono uscite `: Orphan` sul canvas.

Il punto (3) e' quello che mi ha portato fuori strada: la conformity **gira**, semplicemente non e'
visibile sulla lettura immediata. La fixture aveva quindi i suoi slot, e chiamare anche `addValue`
gliene dava un secondo giro.

## Le due ipotesi, e cosa ha detto la misura

**Righe duplicate.** Ipotesi (di Alfonso, ragionevole): mismatch di forma degli id, `coveredAttrIds`
confrontato contro `DAttribute.id` con una forma diversa, `Set.has` che manca sempre. Misurato dal
vivo, fianco a fianco: `firstClassAttrId` e `firstCoveredId` **identici carattere per carattere**,
`missing: 0`, `slotsNotInIdlookup: 0`. Il matching di `ObjectNode` era corretto. Il numero vero era
`slotCount: 25` per `classAttrCount: 12` (+1 reference): **la fixture creava gli slot due volte**.
Corretto scrivendo negli slot esistenti; 51 righe → 27, che e' 2×13 + 1.

Il fix apparteneva quindi alla fixture e **non** a `ObjectNode`, al contrario di quanto ipotizzato:
toccare il matching del nodo avrebbe rotto un comportamento corretto per compensare un difetto altrove.

**Reference rotta.** Misurato prima di scrivere codice, come richiesto. Dopo la delete di `Config_old`
il `DValue` di `cfg` legge:

```
values: ["Pointer1787938948576_USER_49"], valueCount: 1, firstResolves: false
```

Il puntatore **sopravvive**. La delete non ripulisce gli slot referenti, l'assunzione di
`brokenRefMemory` e' giusta, e la domanda di design sullo scrubbing **non si pone**. Il bug era mio,
nel path di risoluzione: `jjomTransformers` iterava `fv.values`, e il proxy L **scarta** le voci non
risolvibili invece di restituire la stringa, quindi il puntatore morto non arrivava mai al loop.
Corretto leggendo `__raw.values` come fonte di verita' e usando il proxy solo per dare un nome a
quelle che risolvono.

Terza misura, conseguenza della seconda: la delete e' legata al **rendering del canvas**, non a un
timer. `brokenRefMemory` impara il nome dal transformer, e `DockManager.open2` non monta l'editor da
solo; con un ritardo fisso la riga usciva sempre `Pointer178…` invece di `Config_old`. Ora la fixture
attende la prima `.mm-object` nel DOM, e la riga barra il nome.

## Stato

27 righe su 6 nodi, `unit` 2 e non 4 (il controllo del punto 3 passa), `broken` 1 etichettato
`Config_old`, tre pill singleton con lo swatch. Resta noto e non affrontato: dopo la delete il nodo
dell'oggetto cancellato resta sul canvas (`docs/decisions.md` R-SGL-9 (e)/(f), pre-esistente), e i
nodi nascono sovrapposti perche' la fixture non assegna coordinate.
