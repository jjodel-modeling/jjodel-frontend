# Form Engine Contract — v0 (draft dalla simulazione)

Contratto del motore form portabile (R-FORM-2). Il motore è un modulo puro:
`(metamodelShape, instanceData, formSpec) → formModel` + eventi astratti.
Nessun import da store/D-graph/React-jjodel. Dentro jjodel: adapter D-graph.
Fuori: adapter JSON/API. Derivato da `CRUD Manager Simulation.dc.html` (costante META).

## 1. metamodelShape (input, serializzabile)

```json
{
  "enums": {
    "StateKind": ["initial", "normal", "final"]
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
      "root": false,
      "containedIn": ["StateMachine"],
      "attrs": [
        { "key": "name", "type": "string", "lower": 1, "upper": 1 },
        { "key": "kind", "type": "enum", "enum": "StateKind", "lower": 0, "upper": 1 }
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
- `upper: -1` = `*`. Cardinalità → obbligatorietà (`lower >= 1` = required) e limiti di Add.
- `containedIn` è lista: una metaclasse può essere contenuta in più contesti.
- Tipi attributo v0: `string | number | boolean | enum | date` (allineare al censimento joiner).
- Deriva dentro jjodel: adapter D-graph via Selectors (Fase 1, voce 2 del censimento).

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

- Solo gli override della view. La risoluzione completa del widget (precedenza: view → annotazione → tipo → nome)
  la fa il motore SE gli si passa anche la mappa annotazioni; dentro jjodel conviene che l'adapter
  passi il widget già risolto da `valueRenderer` (punto aperto → censimento voce 4).
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

## Punti aperti (si chiudono col report di discovery)

1. La shape si deriva tutta dal joiner senza passare dal renderer? (voce 2)
2. Il widget risolto arriva dall'adapter (valueRenderer) o il motore rifà la precedenza? (voce 4)
3. Operazioni/derived attributes: fuori dal v0?
4. Multi-valued attributes (upper > 1 sugli attrs): fuori dal v0?
5. Naming del package e collocazione (voce 6).
