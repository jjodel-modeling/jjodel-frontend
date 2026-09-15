# Form Engine Contract — v0 (draft dalla simulazione)

Contratto del motore form portabile (R-FORM-2). Il motore è un modulo puro:
`(metamodelShape, instanceData, formSpec) → formModel` + eventi astratti.
Nessun import da store/D-graph/React-jjodel. Dentro jjodel: adapter D-graph.
Fuori: adapter JSON/API. Derivato da `CRUD Manager Simulation.dc.html` (costante META).

> **Allineato il 2026-08-30 (slice 2b).** I cinque punti aperti in coda sono chiusi o
> ridotti dalla misura; le due risposte che cambiano il documento — la precedenza sta nel
> MOTORE, e i multivalore sono NEL v0 — sono riportate nelle sezioni 1 e 3. Il tipo
> `metamodelShape` esiste ora in `frontend/src/jjform/shape.ts`, e l'adapter D-graph che lo
> produce in `frontend/src/components/editor-v2/hooks/shapeAdapter.ts` (+ `shapeDraw.ts`,
> la meta' senza import). Le tre deviazioni dello schema JSON qui sotto sono dichiarate in
> testa a `shape.ts`. Ratifiche in `docs/decisions.md`, serie R-FORM.

## 1. metamodelShape (input, serializzabile)

```json
{
  "enums": {
    "StateKind": { "id": "e1", "name": "StateKind", "literals": [
      { "id": "l1", "name": "initial" }, { "id": "l2", "name": "normal" }, { "id": "l3", "name": "final" }
    ] }
  },
  "classes": {
    "StateMachine": {
      "root": true,
      "attrs": [
        { "key": "name", "type": "string", "lower": 0, "upper": 1 }
      ],
      "refs": [],
      "children": [
        { "key": "states", "of": "State", "lower": 0, "upper": -1 },
        { "key": "transitions", "of": "Transition", "lower": 0, "upper": -1 }
      ]
    },
    "State": {
      "root": false, "abstract": false, "singleton": false,
      "containedIn": ["StateMachine"],
      "attrs": [
        { "key": "name", "id": "a1", "type": "string", "typeName": "EString",
          "lower": 1, "upper": 1, "many": false, "required": true, "derived": false, "readOnly": false },
        { "key": "kind", "id": "a2", "type": "enum", "enum": "StateKind", "typeName": "StateKind",
          "lower": 0, "upper": 1, "many": false, "required": false, "derived": false, "readOnly": false }
      ],
      "refs": [],
      "children": []
    },
    "Transition": {
      "root": false,
      "containedIn": ["StateMachine"],
      "attrs": [
        { "key": "name", "type": "string", "lower": 0, "upper": 1 }
      ],
      "refs": [
        { "key": "source", "of": "State", "lower": 1, "upper": 1 },
        { "key": "target", "of": "State", "lower": 1, "upper": 1 }
      ],
      "children": []
    }
  }
}
```

Note:
- **`State` e' scritta per esteso, `StateMachine` e `Transition` no**: le due abbreviate
  omettono i campi che `State` mostra, non li negano. La forma completa e' quella di `State`,
  e la sua definizione autorevole e' `frontend/src/jjform/shape.ts`.
- `upper: -1` = `*`. Cardinalità → obbligatorietà (`lower >= 1` = required) e limiti di Add.
- `containedIn` è lista: una metaclasse può essere contenuta in più contesti.
- Tipi attributo v0: `string | number | boolean | enum | date`, piu' `unknown` — aggiunto
  dalla misura: un datatype dichiarato dall'utente non e' una stringa solo perche' non si e'
  trovato di meglio, e un renderer a cui si dice `unknown` cade su testo di proposito invece
  che per caso. Mappatura in `shapeDraw.classifyAttrType`, dalla stessa lista di
  `widgetForPrimitive` — letta due volte, mai una terza.
- **`enums` porta letterali con ID, non `string[]`** (deviazione 1 di `shape.ts`): il D-layer
  scrive il valore di uno slot enum come POINTER del letterale, l'importer XMI ne scrive il
  NOME. I due scrittori non concordano, e un `string[]` non sa dire quale delle due
  convenzioni si sta guardando.
- **Ogni shape porta l'`id` opaco** dell'elemento che descrive (deviazione 2): il motore non
  lo interpreta, l'adapter ne ha bisogno per riscrivere.
- **`derived` e `readOnly` su ogni feature** (deviazione 3): una tabella deve sapere di non
  offrire la cella, che e' una decisione di resa e non di scrittura.
- `containedIn` si deriva invertendo le reference di containment, accumulando anche sulle
  sottoclassi concrete: una reference tipizzata su una classe astratta contiene ognuna delle
  sue concrezioni.
- Deriva dentro jjodel: `shapeAdapter.buildMetamodelShape`, che usa `getMetaclassInfo` come
  spina dorsale (packages, catena extends, sottoclassi concrete, rootable) e riempie da
  `idlookup` i tre buchi che quella struttura non porta.

## 2. instanceData (input/output, serializzabile)

```json
{
  "instances": {
    "m1": { "cls": "StateMachine", "values": { "name": "traffic light" },
            "refs": {}, "children": { "states": ["s1","s2"], "transitions": ["t1"] }, "owner": null },
    "s1": { "cls": "State", "values": { "name": "red", "kind": "initial" },
            "refs": {}, "children": {}, "owner": "m1" },
    "s2": { "cls": "State", "values": { "name": "green", "kind": "normal" },
            "refs": {}, "children": {}, "owner": "m1" },
    "t1": { "cls": "Transition", "values": { "name": "go" },
            "refs": { "source": "s1", "target": "s2" }, "children": {}, "owner": "m1" }
  }
}
```

Invarianti:
- `owner` ridondante con `children` ma obbligatorio (lookup O(1) per uniqueness/siblings).
- Un ref rotto (id assente o "") è rappresentabile: il modello può essere invalido, il motore lo dichiara (12d: delete sporco).

## 3. formSpec (input, per-metaclasse — dalla view attiva)

```json
{
  "State": { "widgets": { "name": "text" } },
  "Transition": { "widgets": {} }
}
```

- Solo gli override della view. **La precedenza completa (view → annotazione → tipo → nome)
  la fa il MOTORE**, non l'adapter — deciso il 2026-08-30, e va contro l'ipotesi che questa
  riga avanzava. Ragione misurata: la precedenza *e' gia'* un modulo puro. `valueRenderer.ts`
  (683 righe, la ladder e il vocabolario dei renderer) e `irReadCtx.ts` hanno **zero** import;
  `widgetRenderer.ts`, che implementa la mappa widget→renderer di R-STR-3, ne ha due e sono
  tipi. Farla all'adapter terrebbe fuori dal motore l'unica parte gia' portabile.
  L'adapter passa quindi le ANNOTAZIONI, non il verdetto (`readRowViewAnnotations`, anch'esso
  a zero import).
- `surface` per metaclasse (R-FORM-3): `{ "StateMachine": { "surface": "diagram" } }` — il motore
  la espone nel formModel; il consumo (diagramma embedded) è del contenitore, non del motore.

## 4. formModel (output — quello che una UI qualunque rende)

Per un'istanza: lista di field descriptor già validati:

```json
{
  "id": "t1", "cls": "Transition", "title": "go",
  "fields": [
    { "key": "name", "kind": "text", "value": "go", "required": false, "error": null },
    { "key": "source", "kind": "ref", "of": "State", "value": "s1", "required": true,
      "options": [{ "id": "s1", "label": "red" }, { "id": "s2", "label": "green" }], "error": null }
  ],
  "valid": true
}
```

Per una collezione: colonne (dagli attrs+refs) + righe. Per un delete: preflight
`{ referencedBy: [{ id, refKey }], reassignCandidates: [...] }` (12d).

## 5. `WriteCtx` — la firma delle scritture (l'adapter la implementa, il motore la usa)

Gli eventi astratti di questa sezione hanno smesso di essere prosa: da S4 sono
`frontend/src/jjform/writeCtx.ts`, sei primitive che l'host implementa e che il motore
chiama. L'implementazione di jjodel e' `editor-v2/hooks/writeCtxLproxy.makeWriteCtx`,
sorella di `irReadCtxLproxy` per il lato lettura.

```ts
setValue(id, key, index, value, isPtr?)   -> WriteResult
clearValue(id, key, index, isPtr?)        -> WriteResult   // lascia un BUCO (R-FORM-7)
appendValue(id, key, value, isPtr)        -> WriteResult
setName(id, name)                         -> WriteResult   // primitiva a se' (R-WCX-2)
create(cls, ownerId|null, childKey|null, seed) -> CreateResult
delete(id)                                -> WriteResult

WriteResult  = { ok, changed, reason? }        // S2
CreateResult = { ok, id: string|null, reason? }
```

L'indirizzamento e' `(id, chiave, indice)` **sempre**: mai uno slot, mai un proxy. Non
e' stile — un proxy tenuto nel tempo scrive in uno slot morto e **si dichiara riuscito**
(misurato, S3). `WriteResult.reason` e' l'unico canale per cui un rifiuto dell'host
raggiunge il motore, e viaggia **verbatim**.

**Ancora fuori**: `validTargets(id, key)`, il filtro per-istanza del picker (R-FORM-13).
E' obbligatorio nel contratto finito e ha la sua slice (S5) perche' e' l'unica primitiva
con una resa a schermo. Oggi il picker lo legge dal proxy (`useFormWidgets.readOptions`).

### 5.0 Gli OBBLIGHI dell'implementazione (R-WCX-3)

Non sono codice del motore: sono cio' che un adapter deve garantire perche' il motore
resti corretto. Un adapter che ne salta uno perde dati in silenzio.

- **Il filtro containment-loop e' dell'HOST** (R-FORM-13). Nessuna shape puo' rifarlo:
  legge la catena dei padri di QUESTA istanza. Finche' `validTargets` non e' nel
  contratto (S5), l'host lo applica al picker e rifiuta comunque in scrittura.
- **La rete in scrittura e' dell'HOST, e non e' completa.** `setValueAtPosition` rifiuta
  il ciclo di contenimento; la conformita' di tipo del bersaglio e' **commentata**
  (`LModelElement.tsx:7652`), quindi il motore non puo' contarci: limite dichiarato, non
  garanzia.
- **`clearValue` buca, la cascata dell'host accorcia per valore** (R-FORM-7 / R-FORM-10).
  Un `instanceData` che non sa rappresentare un buco non fa round-trip.
- **Il doppio legame dell'identita'** (CLAUDE.md §3.12, R-WCX-2): `setName` scrive
  ENTRAMBI i lati. Riunirla a `setValue(id,'name',…)` scriverebbe il solo slot.
- **L'obbligo di sequenza**: i piani sono ORDINATI e ogni passo dev'essere osservabile
  dal successivo. In jjodel costa `U.UpdatingTimer * 2` fra una scrittura di slot e una
  delete (R-FORM-11) e **zero** fra N scritture su N slot distinti (R-FORM-12). I
  millisecondi sono dell'host; l'obbligo e' del contratto.
- **`create` fa LA metaclasse chiesta**, mai una sua sottoclasse (`forceCreation`), e i
  valori del `seed` viaggiano CON la create, non dopo.
- **La cascata di containment NON e' di `delete`**: e' del piano (R-FORM-9).

### 5.1bis Chi scrive attraverso il ctx, oggi

`jjform/delete.applyPlanWrites(ctx, plan)` — le reassign e le clear di un piano, in
ordine. E' il motore che scrive, ed e' provato **contro un host che non e' jjodel**:
`jjform/__tests__/writeCtx.test.ts` implementa `WriteCtx` su un `Record` JSON e ci fa
atterrare gli stessi piani (la portabilita' di R-FORM-2 smette di essere strutturale).

Le altre due inversioni sono **dichiarate e rimandate**, non dimenticate:

- `multiAdapter.applyBulk` — il suo `BulkResult` distingue `missing` (slot irrisolvibile)
  da `refused` (host che rifiuta), e attraverso il ctx le due arriverebbero come lo
  stesso `{ok:false}`: fonderle sarebbe la confusione che S2 esiste per togliere.
- `createAdapter.applyCreate` — resta il TRADUTTORE del draft (campi non toccati scartati,
  stringhe tipate per attributo); la scrittura sotto e' gia' `createInstance`, cioe' la
  primitiva `create` del ctx.

Regole già ratificate che il motore implementa:
- containment crea / reference seleziona (Turno 10)
- required da cardinalità; uniqueness del nome tra siblings stesso cls+owner (12a)
- multi-selezione: valori Mixed dichiarati, identità mai bulk (12b)
- ricorsione inline 1 livello, poi drill-in (12c)
- delete referenziato: preflight, reassign default, delete sporco dichiarato (12d)

## 5.1 `create` — quello che la slice 2c ha implementato

Il motore puro sta in `frontend/src/jjform/create.ts` (zero import, come `shape.ts`):
`newDraft`, `validateDraft`, `draftModel`, piu' i due verdetti di offerta
`newInstanceReason` e `addChildReason`. L'applicazione al D-graph sta nell'adapter,
`editor-v2/hooks/createAdapter.applyCreate`, con la meta' pura in `createDraw.ts`.

- **Le due vie sono UN evento.** Catalogo `(cls, null, null)` e child-slot
  `(cls, ownerId, childKey)`: nel motore niente si dirama sulla provenienza del gesto,
  che e' l'avvertimento Q8 messo in codice — la scelta fra catalogo e outline si rifa'
  in 10b.
- **La primitiva e' `addObject`, non `DObject.new`.** `LValue.get_addObject`
  (`LModelElement.tsx:7035`) serve sia `LModel.addObject` (root) sia `LValue.addObject`
  (contenuta), e chiamata su uno slot di containment mette il padre **sullo slot**
  (`:7043`): `owner` e `children[childKey]` — l'invariante ridondante della sezione 2 —
  sono cosi' scritti dalla stessa chiamata e non possono divergere. `forceCreation: true`
  e' obbligatorio: senza, `:7095` sceglie la sottoclasse per match di schema invece della
  metaclasse che l'utente ha scelto.
- **I valori viaggiano CON la create**, come `json`, perche' `addObject` semina gli slot
  su un `setTimeout` proprio (`:7153`, il ritardo di CLAUDE.md §9.2): una sola dilazione
  invece di due. Chiavi `$`-prefissate, tranne `name`, che passa nuda per raggiungere
  anche `DObject.name` (il doppio legame di §3.12) e solo se la metaclasse dichiara
  l'attributo.
- **Required** e' `lower >= 1` letto come «almeno un valore»: un draft offre un controllo
  per feature, quindi un `2..*` non sarebbe mai soddisfacibile e il commit resterebbe
  bloccato per sempre. Il messaggio stampa la molteplicita', cosi' la mancanza si vede
  invece di restare muta.
- **Uniqueness del nome** fra siblings stesso `cls` + `owner`, sul solo `name`: e' la
  feature con cui il resto di jjodel risolve un'istanza. Un nome vuoto non collide con dei
  siblings senza nome — l'assenza di un nome non e' un nome che sbatte.
- **Derived e read-only non sono offerti** nel draft: un controllo su un valore che il
  write path rifiuta e' un controllo che mente. Restano nella shape, quindi la tabella
  continua a mostrarne la colonna.
- **L'enum si apre sul primo letterale**, required o no: e' quello che fa
  `CRUD Manager Simulation.dc.html` (`openModal`), e il design e' l'autorita' sugli stati.
- **Fuori dalla 2c**: il delete (12d), la multi-selezione (12b), e l'Add dentro il gruppo
  «children» della form — `ListWidget.onAppend` e' un PICKER su elementi esistenti, cioe'
  «reference seleziona», il gesto sbagliato per uno slot di containment. La create
  contenuta e' quindi una barra accanto alla form, non un bottone dentro.

## 5.2 `delete` — quello che la slice 12d ha implementato

Il motore puro sta in `frontend/src/jjform/delete.ts` (zero import, come
`shape.ts` e `create.ts`): `deletePreflight`, `deleteVerdict`, `deletePlan`.
L'applicazione al D-graph sta nell'adapter, `editor-v2/hooks/deleteAdapter`, con la
metà pura in `deleteDraw.ts`. Misure in
`docs/discovery/discovery_2026-08-30_slice12d_delete.md`.

- **Il preflight è SEMPRE calcolato**, referenziato o no. Non referenziato e senza
  discendenti: conferma semplice, «This cannot be undone.». Referenziato: i
  referrer elencati **per nome** e per feature — uno per PUNTATORE, non per istanza
  (R-FORM-8), perché ognuno va riassegnato per conto suo.
- **Tre verdetti, un evento.** `{ reassignTo }`, `{ clearRefs: true }`, `{}`. Non
  sono due travestiti da tre: `clearSlotValue` lascia un **buco** (R-FORM-7) mentre
  la cascata del core **accorcia** l'array per valore — misurato su uno slot `0..*`
  a due bersagli. Su un monovalore coincidono, su un multivalore no. La simulazione
  li fonde in una riga perché nel suo modello in memoria l'effetto è lo stesso; qui
  le righe sono due, e la riga della reassign resta quella del design.
- **La cascata di containment è dell'ADAPTER, non del core.** Misurato: `Dummy.get_delete`
  scende su `children`, e un `DObject` contenuto sta nei `values` dello slot, non fra
  i `children` di nessuno. Cancellare il contenitore lasciava il figlio **orfano** e
  invisibile (le liste risalgono `father` fino a un `DModel`). Il piano elenca i
  discendenti e li cancella **dal più profondo**; il preflight li conta prima.
- **I referrer VERSO i discendenti sono referrer**, e il dialogo lo dice
  (`viaDescendant`). I puntatori tenuti da chi sta morendo sono invece scartati:
  riassegnarli sarebbe modificare un fantasma.
- **Il delete sporco è dichiarato, non impedito** (sezione 2). `DeletePlan.invalidates`
  nomina i referrer il cui slot scende sotto il proprio `lower`, e la tabella rende
  come `missing` un ref `required` rimasto senza valori. Non c'è puntatore appeso da
  rendere: il core toglie il puntatore entrante, quindi lo stato invalido è lo slot
  VUOTO — l'altra metà di «id assente o ""».
- **`blocked`** è la delete che l'host rifiuterà comunque. L'unico caso misurato è
  l'istanza singleton: `LObject.get_delete` logga e ritorna. Dichiarato nel
  preflight, mai scoperto premendo il bottone.
- **Le delete sono differite di `U.UpdatingTimer * 2` quando il piano ha scritto
  prima** (reassign o clear). Non è una precauzione: nello stesso tick le due
  operazioni atterrano nell'ordine sbagliato e un valore si perde — misurato. Un
  piano `dirty` non scrive nulla e non è differito.
- **Fuori dalla 12d**: la multi-selezione (12b), l'undo/redo oltre a quello che il
  core già offre, l'outline di 10b.

## 5.3 `multi` e `nav` — quello che la slice 12b/12c ha implementato

I due motori puri stanno in `frontend/src/jjform/multi.ts` e `frontend/src/jjform/nav.ts`
(zero import, come `shape.ts`, `create.ts` e `delete.ts`). L'applicazione al D-graph sta
in `editor-v2/hooks/multiAdapter`, con la meta' pura in `multiDraw.ts`. Misure in
`docs/discovery/discovery_2026-08-30_slice12bc_multiselect_recursion.md`.

**La specifica sta in `Instance Node Proposal.dc.html`, Turno 12** — non in
`CRUD Manager Simulation.dc.html`, che il prompt della slice citava: misurato, quel file
porta zero occorrenze di `mixed`, `multi`, `12b`, `12c`, con controllo positivo a segnale
(`openModal` 6, `META` 9) sullo stesso file.

- **Mixed e' dichiarato, mai mediato.** Un campo su cui la selezione non concorda porta
  `state: 'mixed'`, `value: null` e i valori **distinti**, cosi' la UI stampa
  «Mixed (Green, Red, Blue)» invece di mostrarne uno e mentire sugli altri.
- **Non toccato = non scritto.** `bulkPlan` emette eventi per le sole chiavi che l'utente
  ha davvero scritto. E' cio' che lascia misto un campo misto dopo una scrittura altrove.
- **Identita' e containment spariscono, con motivo.** Assenti, non disabilitati (R-FORM-14),
  e la guardia gira due volte: in `multiModel` e di nuovo in `bulkPlan`.
- **Il toggle ha un terzo stato**: `counts` porta `on`/`off`/`unset`, che e' cio' che
  stampa «2 on · 1 off». Un booleano mai scritto e' `unset`, non `off`.
- **Un bulk e' N `setValue`, non un evento nuovo**: 12b non allarga la sezione 5.
- **Le scritture bulk non sono differite** (R-FORM-12), e la differenza con R-FORM-11 e'
  misurata, non assunta.
- **La profondita' e' un numero solo**, `INLINE_DEPTH_LIMIT = 1`: al livello del soggetto
  i figli contenuti si editano inline, dal secondo in poi il corpo della form e'
  **sostituito** dal figlio e il breadcrumb tiene la strada. Una form sola, non uno stack.
- **La delete multipla e' un preflight solo** (`unionPreflight`): i referrer sono l'unione
  **meno** i puntatori tenuti da chiunque stia morendo, e i candidati di riassegnazione
  sono l'**intersezione** — il dialogo offre un bersaglio per tutto l'insieme.
- **Fuori dalla 12b/12c**: il bulk di un multivalore (12b edita un campo, e un campo e' un
  controllo: letto e scritto in posizione 0), l'outline 10b, il diagramma 13a.

## Punti aperti — stato al 2026-08-30

1. **La shape si deriva tutta dal joiner senza passare dal renderer?** — **Si', ora.**
   `getMetaclassInfo` copriva `attrs`/`refs`/`children` con cardinalita' e containment ma non
   i letterali di enum (portava il nome del tipo e un flag, non l'id), non `derived`/`changeable`,
   e non le reference entranti. Tutti e tre chiusi in `shapeDraw.ts`, per id, senza toccare il core.
2. **La precedenza: adapter o motore?** — **Motore.** Vedi sezione 3: risposta contraria
   all'ipotesi originaria, e la ragione e' una misura, non una preferenza.
3. **Operazioni e attributi derivati fuori dal v0?** — le OPERAZIONI si', e `MetaclassInfo`
   non le porta comunque. I `derived` **no**: sono nello schema come flag (deviazione 3). Fuori
   dal v0 resta la loro VALUTAZIONE, non la loro esistenza.
4. **Multivalore fuori dal v0?** — **No, sono dentro**, e non sarebbe stato gratis escluderli:
   il repo li gestisce gia' (`upper !== 1` → `treatment: 'list'`, `addSlotValue`,
   `appendSlotValue`) e `formWrite.clearSlotValue` lascia un **buco** invece di accorciare
   l'array. Un `instanceData` che ignorasse i buchi non farebbe round-trip con quello che
   jjodel produce. `instanceTable.slotShapeFor` li salta esplicitamente, nel conteggio e nel
   testo.
5. **Naming e collocazione** — `frontend/src/jjform/`, pari grado di `jjel/`, che e' il
   precedente misurato (zero import da joiner/react/redux). Aperta nella slice 2b per il solo
   TIPO; **il motore ci e' arrivato con S4**, che ha deciso `WriteCtx` (sezione 5) e gli ha
   dato il primo scrittore (`applyPlanWrites`). Resta aperto il solo `validTargets` (S5).

### Chiuso dalla 2c

6. **Il filtro containment-loop non esiste a livello di shape.** — **Chiuso dalla slice 2c.**
   `LValue.get_validTargets` scarta i candidati che chiuderebbero un ciclo di contenimento,
   leggendo la catena dei padri dell'ISTANZA. Non ha significato per una metaclasse ed e'
   quindi **assente** dalla shape, non approssimato. Dove e' finito, e perche':

   - **Nell'adapter, nella sua meta' pura**: `createDraw.containmentChain` (la catena) e
     `createDraw.candidatesFor` (la sottrazione), in
     `frontend/src/components/editor-v2/hooks/createDraw.ts`. Non nel motore, che non ha
     un'istanza da leggere; non nella shape, che non ha un'istanza di cui parlare. Nella
     meta' pura e non in quella impura perche' un filtro non provato e' un filtro creduto:
     le prove stanno in `__tests__/createDraw.test.ts` e provano **per contrasto** — stessa
     chiamata, un candidato che chiuderebbe il ciclo assente e uno lecito offerto.
   - **La catena di un draft e' quella del suo OWNER**, l'owner incluso: il draft non e'
     ancora nello store e non ha padri propri. E' l'equivalente esatto del `fatherList` che
     il core legge (`LModelElement.tsx:7871`).
   - **Solo sulle feature di containment**, dietro lo stesso `if (isContainment)` del core:
     una reference non-containment non puo' chiudere un ciclo di contenimento, e filtrarla
     vieterebbe un modello lecito.
   - **Misurato: per la CREATE il filtro e' inerte, e non e' un difetto.** Il Turno 10 dice
     «containment crea», quindi un draft non offre nessun selettore su una feature di
     containment: `draftableRefs` restituisce le sole reference non-containment. Il ramo e'
     scritto come la regola si legge, non come i dati di oggi lo rendono, e i due percorsi
     che lo raggiungeranno hanno gia' un nome — l'EDIT di uno slot di containment (12b/12c) e
     il gesto «sposta qui un figlio esistente». Fino ad allora la garanzia resta del core:
     `setValueAtPosition` rifiuta la scrittura (`:7654`) e `get_validTargets` filtra il
     picker che `IRForm` gia' monta.
