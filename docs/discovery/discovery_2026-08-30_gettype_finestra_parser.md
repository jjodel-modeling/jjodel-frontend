# La via (A) di `get_type` — la finestra transitoria del parser, misurata

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `d50b299a0`
**Prompt**: «Discovery: la via (A) di get_type — il padre nella finestra transitoria»
**Residuo che chiude**: `discovery_2026-08-30_dref_seed_rifiutata.md` §8.5, primo punto
**Sorgenti toccati**: **nessuno**. Una sonda non committata,
`frontend/scripts/smoke/_tmp_gettype_window.ts` (15 check, **ALL GREEN**, zero errori di pagina).

---

## 0. Il verdetto in tre righe

1. **La finestra esiste ed e' leggibile** — non perche' gli elementi siano nello store,
   ma perche' `reducer.ts:639` mette `DPointerTargetable.pendingCreation` come `__proto__`
   di `idlookup`: un elemento non ancora committato si legge da `idlookup[id]` pur non
   essendo fra le sue own key. Misurato: 8 elementi su 8, own key **0**, catena di
   prototipi **8**.
2. **Ma non e' osservabile da nessun consumatore**, perche' e' interamente **sincrona**:
   durante `ECoreParser.parse` i dispatch Redux sono **0** e le own key di `idlookup` non
   cambiano (112 → 112). Nessun render, nessun hook di sync, nessun export puo' interlacciarsi.
   Gli unici lettori possibili sono le funzioni che la parse stessa chiama.
3. **E in quella finestra `data.type` di una DReference non e' mai falsy**: `DReference.new`
   sostituisce il padre al tipo assente **prima** che `Constructors.DTypedElement` veda
   qualcosa (`LModelElement.tsx:3891`), e il padre e' risolvibile via `pendingCreation`.
   Il gradino 3 di `get_type` **non scatta mai sul percorso del parser**.

Conseguenza diretta sul residuo: il rischio dichiarato «non misurabile da sonda» il 30-08
— «cambiare `get_type` cambia anche la finestra transitoria del parser Ecore» — **e'
falsificato**. La via (A) non tocca quella finestra, perche' quella finestra non passa dal
gradino 3.

---

## 1. Come e' stata raggiunta la parse, e perche' non dal percorso di ieri

Il referto del 30-08 (`dtypedelement` §8) dichiarava l'import Ecore end-to-end **non
esercitato**: `SaveManager.importEcore` non raggiungibile da `window`, il convertitore
esposto solo dentro la callback del file picker. Il prompt di oggi indicava
`xml2jsonobj` come via. Misurato, quella via **non funziona**, e per una ragione che vale
la pena registrare:

```
page.evaluate: TypeError: X.xml2json is not a function
    at Module.xml2jsonobj (src/common/libraries/prj_xml2json.js:195)
```

`prj_xml2json.js:195` e' `export function xml2jsonobj(xml, tab){ return X.xml2json(xml, tab, false); }`,
ma `X` (definito a `:10`) espone `toObj`, `toJson`, `innerXml`, `escape`, `removeWhite` e
**non** `xml2json` (che e' una funzione di modulo, `:178`). Quindi `prxml2json.xml2jsonobj`
solleva sempre. **Controllo positivo**: la stessa ricerca sul file trova 5 chiavi di `X` e
la definizione di `xml2json` a `:178`, quindi ha segnale; e' `X.xml2json` a non esistere.

Corollario, dichiarato e non corretto (regola 9): i suoi due chiamanti sono
`SaveManager.importEcore_click0` (`:96` e `:132`), e **`importEcore_click` non ha
chiamanti in albero** — `command grep -rn "importEcore_click"` ritorna 3 righe, tutte
dentro `SaveManager.ts`, tutte definizioni o auto-chiamate. Il percorso vivo di import e'
un altro: `ProjectEditor.tsx:933` e `ImportDropZone.tsx:80` → `EcoreService.importFromFile`
→ `importFromXML` → `xmlToJson` (privata) → `EcoreParser.parse`.

**La via usata dalla sonda** e' quindi: la copia verbatim di `EcoreService.xmlToJson` (una
funzione pura di walk del DOM) piu' `windoww.ECoreParser.parse`, cioe' **il parser vero
dell'app**. Non un `import()` dinamico: Vite serve `classes.ts` e `classes.ts?t=…` come
record distinti, e la prima versione della sonda — che importava `EcoreService.ts` — ha
misurato un secondo grafo di moduli (sintomo: `TypeError: ltarget.extendedBy is not
iterable`, identita' di classe diverse). I moduli veri si prendono dal global, che
`@RuntimeAccessible` popola (`classes.ts:459`, `if (!windoww[cname]) windoww[cname] = ctor`).

---

## 2. La finestra: dov'e', e chi la vede — misurato

Il perimetro sincrono e' `EcoreParser.parse` (`api/data.ts:172-193`):

```
178:  Constructors.paused = true;
179:  parsedElements = parseM2Model(...) | parseM1Model(...)
181:  this.LinkAllNamesToIDs(parsedElements);
182:  this.fixNamingConflicts(parsedElements);
183:  Constructors.paused = false;
185:  this.fixObjectPointers(parsedElements);
187:  Constructors.persist(parsedElements);
```

`Constructors.persist` esce subito se `paused` (`classes.ts:651`), quindi nella fase 179-182
nessuna `CreateElementAction` parte. Ma il costruttore registra comunque l'oggetto in
`DPointerTargetable.pendingCreation` (`classes.ts:575`), e `idlookup` ha `pendingCreation`
come prototipo (`reducer.ts:639`). `LPointerTargetable`/`DPointerTargetable.fromPointer`
consultano `pendingCreation` **prima** dello store (`classes.ts:1519`, `:1551`).

Misura, presa **dentro la stessa esecuzione sincrona** che ha chiamato `parse`:

| grandezza | prima | subito dopo |
|---|---|---|
| dispatch Redux | 0 | **0** |
| own key di `idlookup` | 112 | **112** |
| elementi prodotti leggibili da `idlookup[id]` | — | **8 / 8** |
| di cui own key (committati) | — | **0** |
| di cui solo per catena di prototipi | — | **8** |
| presenti in `pendingCreation` | — | **8** |
| `getPrototypeOf(idlookup) === pendingCreation` | — | **true** |

Dopo l'assestamento (5 s): **1** dispatch, `idlookup` a 120 own key, 8/8 committati.
**Controllo positivo del contatore**: 0 → 1, quindi il wrapper su `store.dispatch` aveva
segnale; **controllo positivo dell'import**: `success`, due classi in albero, 4 feature.

`String(ECoreParser.parse).startsWith('async')` = **false**: la parse non ha punti di
sospensione. Con zero dispatch e nessun `await`, dentro la finestra puo' girare solo cio'
che la parse chiama.

### 2.1 Chi la parse chiama, e che cosa legge

| chiamato dalla parse | legge dal proxy? | legge `.type`? |
|---|---|---|
| `Constructors.DTypedElement` → `resolveClassifier` (`classes.ts:867-882`) | no — `s.idlookup[type]` grezzo | legge l'**argomento**, non `get_type` |
| `Constructors.DStructuralFeature` (`classes.ts:713-753`) | **si'** — `L.from(target).extendedBy` sul padre | no |
| `LinkAllNamesToIDs` (`api/data.ts:232-360`) | no — scrive `dobj[replacekey]` grezzo | scrive `.type`, non lo legge dal L |
| `fixNamingConflicts` (`api/data.ts:412`) | — | **e' uno stub vuoto**, `// todo:4 final` |
| `fixObjectPointers` (`api/data.ts:198-217`) | si' — `ecorePointer()` | no: `get_ecorePointer` (`LModelElement.tsx:6536`) cammina `fatherList`, `name`, `values` |

**Nessun lettore di `.type` attraverso `get_type` dentro la finestra.** L'unica lettura da
proxy che la finestra fa e' `extendedBy` sul padre, e non passa dal gradino 3.

---

## 3. Che cosa c'e' davvero in `data.type` durante la finestra

La domanda del prompt presuppone `type === undefined` come contratto del parser. **Non lo e'
per una DReference**, e la ragione sta due layer sopra il costruttore:

```
LModelElement.tsx:3891   DReference.new(name?, type?, father?, persist=true)
                         if (!type) type = father   // default type is self-reference
```

`parseDReference` (`api/data.ts:931`) chiama `DReference.new(undefined, undefined, parent.id)`:
`type` diventa **il puntatore al padre**, che e' definito. `Constructors.DTypedElement` riceve
quindi un `requested` non-`undefined`, `resolveClassifier` lo risolve — il padre e' leggibile
via `pendingCreation` — e `data.type` esce dal costruttore **gia' come puntatore a una DClass
vera**. Nessun ramo di fallback, nessun `Log.ww`.

Misura, snapshot preso a fine parse sulle 4 feature di un `.ecore` con due classi:

| feature | `data.type` nella finestra | e' il padre? |
|---|---|---|
| `DOperation greet` | `Pointer_ESTRING` | no |
| `DAttribute fullName` | `Pointer_ESTRING` | no |
| `DReference friend` (eType `#//ProbePerson`, self) | `ProbePerson` | si', **legittimamente** |
| `DReference home` (eType `#//ProbeHouse`) | `ProbeHouse` | no |

**Righe di console `DTypedElement: cannot resolve`: 0.** **Righe `LinkAllNames() can't find
type target`: 0.** `Log.ww` stampa sempre (`Log.ts:187` → `Log.w` → `console.warn`), quindi
lo zero e' un'assenza misurata, non un canale spento.

La riga `friend` e' l'unica con `type === father` ed e' **corretta**: una self-reference
punta alla propria classe. Il criterio che discrimina il seed dal caso legittimo e' `home`,
misurato a `ProbeHouse`.

### 3.1 L'unica sotto-finestra con `type` davvero assente

`DOperation.new()` senza argomenti (`api/data.ts:996`: `DOperation.new()` e poi
`dObject.father = parent.id` a mano) arriva a `DTypedElement` con `requested === undefined`
e **senza `fatherPtr`**, quindi cade in `case 'DOperation': type = this.fatherPtr` = `undefined`.
Fra quella riga e la scrittura di `.type` due statement dopo, `data.type` e' assente. Per un
`DOperation` il gradino 3 restituisce `'Pointer_ESTRING'`, **non il padre** — la riga 1406
mette il padre solo per `className === 'DReference'`. Vale lo stesso di §2: la sotto-finestra
e' sincrona e nessuno la legge.

---

## 4. Chi arriva a `get_type` con `data.type` falsy, fuori dal parser — censimento

`get_type` gradino 3 (`LModelElement.tsx:1405-1406`) scatta se e solo se `LPointerTargetable.from(c.data.type)`
e' falsy e il gradino 2 non ha risolto. I modi di produrre quel `data.type`:

| via | raggiungibile in albero? | misurato |
|---|---|---|
| `DReference.new(nome, undefined, padre)` | **si'**, e' il parser e jjscript `create.ts:473` | `data.type` = **il padre**, non falsy |
| `DReference.new(nome, undefined, undefined)` — senza padre | **no** in albero: ogni chiamante passa un padre (censimento §5 del referto `dref_seed_rifiutata`, riverificato) | `data.type` = **null** → gradino 3 |
| `Constructors.DTypedElement` fallback con `fatherPtr` assente | idem sopra | — |
| `SetFieldAction(ref, 'type', undefined)` diretta | console / API, nessun sito in albero | D `undefined`, L = **il padre** (riconferma della misura del 30-08) |
| **cancellazione della classe-tipo** | **si'**, percorso UI vivo | **non** produce un falsy: vedi sotto |

### 4.1 La cancellazione della classe-tipo non passa dal gradino 3

Ipotesi plausibile e falsificata dalla misura. Cancellata `ProbeHouse` mentre `home` la
tipava:

```
houseStillInStore: false
home.__raw.type: Pointer…_125   (ancora il puntatore alla classe cancellata)
pointsToDeleted:  true
L .type:          un proxy il cui .name legge "TypeError"
isFatherAtL:      false
```

`data.type` resta **truthy**, quindi il gradino 1 vince e il gradino 3 non viene mai
raggiunto. Il difetto che si vede qui e' un altro — un puntatore penzolante non ripulito, e
un proxy su un elemento inesistente che si presenta con `name === "TypeError"` invece di
essere `undefined` — ed e' **fuori dal perimetro di questo discovery**: dichiarato, non
toccato (regola 9).

**Conclusione del censimento**: fuori dalla finestra del parser, **nessun sito in albero**
raggiunge `get_type` con `data.type` falsy. Le due vie che ci arrivano sono la console e
l'API pubblica (`DReference.new` senza padre, `SetFieldAction` a mano).

---

## 5. Il reperto collaterale: un `eType` irrisolvibile spegne il costruttore

Non era una domanda del prompt; e' emerso perche' la prima versione della sonda importava un
`.ecore` con `eType="#//DoesNotExist"`.

`LinkAllNamesToIDs` chiude con `Log.ex(!target, "LinkAllNames() can't find type target")`
(`api/data.ts:348`), e `Log.ex` **solleva** (`Log.ts:139-144`, `canthrow = true`). L'eccezione
esce da `EcoreParser.parse` fra `Constructors.paused = true` (`:178`) e
`Constructors.paused = false` (`:183`), **senza `try/finally`**.

Misurato, per contrasto, sulla stessa pagina:

| | |
|---|---|
| `Constructors.paused` prima dell'import rotto | `false` |
| `Constructors.paused` dopo | **`true`** |
| errore | `[Error]LinkAllNames() can't find type target:` |
| una `DAttribute.new` successiva | id assegnato, **leggibile** da `idlookup` (prototipo), **`committed: false`** |

Da quel momento ogni elemento creato nella sessione resta in `pendingCreation` e non entra
mai nello store: l'app continua a rispondere e a mostrare cio' che gia' aveva, e ogni nuova
creazione sparisce al primo reload. Il costo del fix e' un `try/finally` intorno a 179-182;
il rischio e' che oggi il fallimento e' rumoroso (una `throw` in console) mentre col
`finally` resterebbe rumoroso e basta — nessun comportamento committato viene degradato.
**Fuori perimetro: dichiarato, non toccato.**

---

## 6. Proposta di fix per la via (A), con costo e rischio

La domanda 3 del prompt («il gradino 3 serve ancora?») ha una risposta misurata: **fuori
dalla finestra del parser il censimento e' vuoto**, e **dentro la finestra il gradino non
scatta**. Quindi il gradino 3, nella sua meta' `DReference → il padre`, non ha piu' nessun
chiamante in albero.

Tre forme possibili, in ordine di costo. **Nessuna e' ratificata: la scelta e' del design.**

### (A1) Delimitare — il gradino resta, ma smette di inventare il padre

```ts
// 3) fallback values.
return LPointerTargetable.fromPointer(c.data.className === 'DReference'
    ? Defaults.Pointer_EOBJECT       // era: c.data.father
    : 'Pointer_ESTRING');
```

- **Costo**: 1 riga, 1 file core (`LModelElement.tsx`), Layer Impact Report obbligatorio (§3.2).
- **Rischio**: nullo sul parser (misurato: non ci passa). Cambia soltanto le due vie di
  console/API di §4, che oggi vedono il contenitore.
- **Coerenza**: e' esattamente la decisione gia' presa a valle nel costruttore con la via (B)
  del 30-08, scritta anche nel getter. Le due righe tornano a dire la stessa cosa, che era
  il reperto §1 di quel referto («il seed e' scritto in due posti»).
- **Non chiude** `MISSING_TYPE` (`validate.ts:280`), che resta irraggiungibile per costruzione.

### (A2) L'assenza vera — il gradino 3 sparisce per le reference

`return undefined` quando `data.type` e' falsy su una DReference.

- **Costo**: la riga 1406 **piu'** i tre getter derivati `get_classType`/`get_enumType`/
  `get_primitiveType` (`LModelElement.tsx:1359-1372`), che fanno `type.isClass` **senza
  guardia** e solleverebbero. E' il costo gia' misurato il 30-08 §6(A), invariato.
- **Guadagno**: `MISSING_TYPE` torna raggiungibile, e l'assenza smette di essere indicibile
  nel L-layer.
- **Rischio**: ogni consumatore di `.type` (§4 del referto del 30-08: export Ecore, payload
  JSON, riga del canvas, validazione) deve reggere `undefined`. Non misurato qui.

### (A3) Non fare nulla, e registrare

Il gradino e' inerte per ogni percorso in albero. Lasciarlo costa zero e mantiene una riga
che dice il falso a chi la legge — che e' il modo in cui il difetto originale e' passato
inosservato per mesi.

**La misura raccomanda (A1)**: chiude il residuo §8.5 al costo di una riga, con il rischio
del parser **misurato come inesistente** invece che dichiarato non misurabile.

---

## 7. Limiti dichiarati

- **Un solo documento `.ecore`**, costruito per la misura: due classi, un attributo, due
  reference (una self, una cross) e un'operazione. Non un metamodello reale di grandi
  dimensioni, e non un import **M1** (`parseM1Model`): per M1 la finestra include
  `fixObjectPointers`, che gira con `paused === false` e usa proxy L su elementi non ancora
  committati. Quel ramo e' stato letto (non legge `.type`) ma **non esercitato**.
- **Il gradino 2** di `get_type` (risoluzione per nome, `LModelElement.tsx:1382-1402`) non e'
  stato misurato qui, ma il referto gemello di oggi
  (`discovery_2026-08-30_uniqueness_m2.md` §4) misura che i suoi due strumenti,
  `model.getClassByName` e `model.getEnumByName`, **ritornano sempre `null`**. Se cosi' e',
  il gradino 2 e' inerte quando `model` esiste, e la stringa cade sempre su
  `Selectors.getByName`. Chi tocchera' `get_type` deve leggere quel paragrafo.
- **Il numero di riga vale per `d50b299a0`.** Le citazioni sono state rilette una per una su
  quel commit, non ricopiate dal referto precedente.
- **Zero modifiche ai sorgenti.** L'unico artefatto e' la sonda, non committata
  (`.gitignore:66`, verificato con `git check-ignore -v`, exit 0).

### 7.1 Una citazione del prompt che non regge

Il prompt dichiara «ora la regola gitignore e' globale». A `d50b299a0` `command grep -n "_tmp" .gitignore`
ritorna **una** riga, `66:frontend/scripts/smoke/_tmp_*`, che e' path-anchored. Le sonde di
questa sessione stanno in quella directory e sono quindi ignorate lo stesso; ma la regola
globale non e' nel repo (RC-4/RC-9: cio' che non e' nel repo non vincola), e i due siti di
atterraggio fuori perimetro registrati in `README-probes.md` restano scoperti.
