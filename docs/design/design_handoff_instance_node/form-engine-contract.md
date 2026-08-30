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

## 5. Eventi astratti (il motore li emette, l'adapter li applica)

```
setValue(id, key, value)          — attributo
setRef(id, key, targetId|null)    — reference
create(cls, ownerId|null, childKey|null, draft)   — transazionale (12a)
delete(id, { reassignTo?|clearRefs })             — con preflight (12d)
```

Regole già ratificate che il motore implementa:
- containment crea / reference seleziona (Turno 10)
- required da cardinalità; uniqueness del nome tra siblings stesso cls+owner (12a)
- multi-selezione: valori Mixed dichiarati, identità mai bulk (12b)
- ricorsione inline 1 livello, poi drill-in (12c)
- delete referenziato: preflight, reassign default, delete sporco dichiarato (12d)

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
   TIPO; il motore ci arriva quando `WriteCtx` e' deciso.

### Aperto, nuovo

6. **Il filtro containment-loop non esiste a livello di shape.** `LValue.get_validTargets`
   scarta i candidati che chiuderebbero un ciclo di contenimento, leggendo la catena dei padri
   dell'ISTANZA. Non ha significato per una metaclasse ed e' quindi **assente**, non
   approssimato: la shape dice cosa il metamodello permette, quale di quei candidati una
   particolare istanza possa prendere e' una domanda del momento della scrittura. La eredita
   la slice 2c.
