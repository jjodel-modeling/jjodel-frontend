# Schema formale dell'IR — Generazione AI di viewpoint sintattici (v1.1)

**Data**: 2026-06-08
**Stato**: schema corretto contro il codice reale. Supersede la v1.0.
**Versione schema IR**: `ir-1.0`
**Target di rendering v1**: **classic editor** (motore di template jsxString). Vedi sez. 1.
**Fonti**: schema v1.0, discovery *"Generatore AI di viewpoint sintattici (IR ir-1.0)"* (2026-06-08), decisioni di sessione 2026-06-08.

Questo documento definisce il formato che l'AI emette quando genera un viewpoint sintattico da un metamodello. Non è il `jsxString` finale: è la rappresentazione intermedia tipizzata da cui un generatore deterministico produce la quadrupla `(predicato, jsxString, SCSS, opzioni)` di ogni view, e la persiste come master.

---

## 0. Cosa cambia rispetto alla v1.0

Cinque correzioni dalla discovery, tutte di semantica e di lowering. Lo schema persistito cambia forma in un solo punto (il rinominato `appliesToClasses` → `metaclasses`).

1. **Selettore rinominato.** `appliesToClasses` portava una semantica sbagliata. A runtime `appliableToClasses` contiene il **livello jjodel** (`'DObject'`, `'DModel'`...), non la metaclasse utente. Il campo IR diventa `metaclasses: MetaclassRef[]` (nomi di metaclasse); il generatore deriva il livello jjodel dal `kind` e abbassa la metaclasse in una clausola OCL `instanceof.id`.
2. **Predicato → OCL.** Il predicato non si abbassa nel "dialetto vincolato" (quello governa solo il `jsxString`). Si abbassa in `oclCondition` (OCL), con `jsCondition` (JS pieno) come escape. Lowering dettagliato in sez. 6.3.
3. **`priority`/`exclusive` esistono già.** Mappano su `explicitApplicationPriority` e `isExclusiveView` (default `true`). Niente campi nuovi.
4. **Contenimento ricorsivo di GraphVertex in v1.** Il rendering annidato esiste già nel classic (`data.children.map(...)`). Cade il piano "graphVertex piatto + placeholder v1.1". Resta aperto solo `LayoutSpec.mode`.
5. **`ir?` additivo a costo quasi nullo.** Serializzazione generica, nessun allowlist. Confermato.

---

## 1. Perimetro e target di rendering

**Il target v1 è il classic editor.** L'intera pipeline IR → quadrupla → rendering è un meccanismo del classic, perché il classic è il motore che interpreta i template di view (`jsxString` via `JSXT.fromString` + `new Function`, scope window) e legge i campi `view.*`. Il flow-v2 rende componenti React fissi (`ClassNode`, `UnifiedEdge`) sui `DVertex`/`DEdge` del graph e ignora i template di view, sia per i nodi sia per gli edge. In flow-v2 un viewpoint generato sarebbe inerte.

Questo non è un ripiego: il classic è il renderer fatto per interpretare notazioni sintattiche custom, il flow-v2 è l'editor strutturale generico e uniforme. Far onorare i viewpoint generati al flow-v2 significa costruire un substrato di interpretazione delle view nei suoi componenti React, oggi inesistente: iniziativa separata, fuori dalla v1.

---

## 2. Principi dello schema

**Discriminatore `kind` più capacità componibili.** I cinque tipi di nodo (`graph`, `vertex`, `graphVertex`, `field`, `edge`) sono composizioni di capacità riusabili, non record rigidi con campi duplicati. `graphVertex = ShapeCap & ContainmentCap` codifica "GraphVertex = Graph + Vertex" a livello di tipo; un `vertex` con `containment` è errore di compilazione. Confermato dal codice: `DGraphVertex` eredita strutturalmente sia da `DGraph` sia da `DVertex`.

**Due assi di selezione, non tre.** La realtà jjodel ha `kind` (categoria di rendering, mappa su `appliableTo`) e poi un solo asse semantico per "cosa selezionare": la metaclasse utente e il filtro M1 confluiscono entrambi nel predicato OCL. Il livello jjodel (`appliableToClasses`) è meccanico e derivato dal `kind`, non lo emette l'AI. Lo schema espone quindi `kind`, `metaclasses` (la metaclasse utente, asse semantico) e `predicate` (filtro M1 fine); il generatore li fonde nel predicato runtime.

**Grammatica chiusa, due lowering.** Predicati e condizioni dell'IR vivono in un'unica grammatica chiusa (`Predicate`). La stessa grammatica si abbassa verso due target a seconda di **dove** sta:
- come **filtro di applicabilità** della view (campo `predicate`) → **OCL** (`oclCondition`).
- come **condizionale a render-time** dentro un template (`Conditional<T>` in shape/badge/style) → **dialetto vincolato** del template engine (ternari, `var`, niente `?.`/`??`), valutato al rendering.

JS arbitrario non è rappresentabile nella grammatica chiusa: è l'escape hatch, rimandato (`jsCondition` resta come canale di escape esplicito). JjEL non è cablato a runtime, quindi non lo emettiamo mai.

**Un solo costrutto condizionale.** Visibilità di label e badge, styling che dipende da una proprietà, scelta della forma: tutti "valore, oppure regola `when -> then`". `Conditional<T>` copre i tre casi.

---

## 3. Primitive condivise

### 3.1 PathExpr (navigazione chiusa)

```typescript
/**
 * Micro-grammatica chiusa di navigazione (produce un valore):
 *   - inizia con "$" + nome feature              ($name, $source, $attrs)
 *   - ".value"  per slot a cardinalita' 1         ($name.value)
 *   - ".values[n]" per slot multi-valued          ($attrs.values[0])
 *   - navigazione concatenata                      ($source.value.$owner.value)
 * VIETATI: ?.  ??  ternari  chiamate  aggregazioni.
 * I confronti NON vivono qui: stanno in Predicate.
 */
type PathExpr = string;
```

### 3.2 Literal

```typescript
type Literal =
  | { kind: 'string';  value: string }
  | { kind: 'number';  value: number }
  | { kind: 'boolean'; value: boolean };
```

### 3.3 Predicate (booleano chiuso)

```typescript
type Predicate =
  | { op: 'and' | 'or'; args: Predicate[] }
  | { op: 'not'; arg: Predicate }
  | { op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';
      left: PathExpr | Literal; right: PathExpr | Literal }
  | { op: 'exists'; path: PathExpr }       // la feature ha un valore
  | { op: 'empty';  path: PathExpr }       // la collezione e' vuota
  | { op: 'isKind'; class: MetaclassRef; path?: PathExpr } // test di tipo su self o su un oggetto navigato
  | { op: 'literal'; value: boolean };
```

`isKind` senza `path` testa il tipo di `self`; con `path` testa il tipo dell'oggetto navigato (es. "il target di `$ref` e' uno State"). La metaclasse propria della view non passa di qui: passa da `metaclasses` (sez. 4.2).

### 3.4 Conditional&lt;T&gt;

```typescript
type Conditional<T> =
  | T                                                       // incondizionato
  | { when: Predicate; then: T; else?: T }                  // regola singola
  | { rules: { when: Predicate; then: T }[]; default?: T }; // cascata first-match
```

### 3.5 MetaclassRef e token

```typescript
/**
 * Nome della metaclasse del metamodello (es. "State", "Entity").
 * NON e' un cname jjodel e NON e' un pointer: e' il nome di dominio.
 * Il generatore lo risolve al pointer DClass e lo usa in OCL come
 * self.instanceof.id = '<pointer>'. Per nomi non univoci, qualified
 * name "Package::Class". Forma del pointer da fissare in discovery (FU4).
 */
type MetaclassRef = string;

type ColorToken = string; // token design system (slate/cyan) oppure hex
interface BorderSpec { color: ColorToken; width: number; style: 'solid' | 'dashed' | 'dotted'; }
interface TextStyle {
  fontStyle?: Conditional<'normal' | 'italic'>;
  fontWeight?: Conditional<'normal' | 'bold'>;
  color?: Conditional<ColorToken>;
  size?: number;
}
```

---

## 4. Struttura di alto livello

L'AI emette un `ViewpointIR`. Il generatore lo divide in view singole, genera ogni quadrupla, e persiste l'IR di ogni view sul rispettivo `DViewElement`.

```typescript
interface ViewpointIR {
  irVersion: string;        // "ir-1.0"
  name?: string;
  metamodel?: string;       // riferimento al metamodello sorgente (contesto)
  views: ViewIR[];
}
```

### 4.1 ViewIR (unione discriminata sui 5 kind)

```typescript
type ViewIR =
  | ({ kind: 'graph'       } & ViewCommon & ContainmentCap & GraphBackgroundCap)
  | ({ kind: 'vertex'      } & ViewCommon & ShapeCap)
  | ({ kind: 'graphVertex' } & ViewCommon & ShapeCap & ContainmentCap)
  | ({ kind: 'field'       } & ViewCommon & FieldCap)
  | ({ kind: 'edge'        } & ViewCommon & EdgeCap);
```

### 4.2 ViewCommon (selettore semantico e persistenza)

```typescript
interface ViewCommon {
  irVersion: string;            // copia per migrazione indipendente della view persistita
  id?: string;                  // si lega all'id del DViewElement esistente; guida la rigenerazione
  metaclasses: MetaclassRef[];  // la metaclasse utente che la view rende (asse semantico).
                                // Generatore: appliableToClasses derivato dal kind + clausola OCL instanceof.id.
                                // Piu' valori = OR di instanceof.id.
  predicate?: Predicate;        // filtro M1 fine; in AND con la clausola di metaclasse. Assente = tutte le istanze
  priority?: number;            // -> explicitApplicationPriority. Conta quando i predicati si sovrappongono
  exclusive?: boolean;          // -> isExclusiveView (default runtime true). Vedi sez. 6.2
  label?: string;               // nome della view per l'editor
}
```

Identità: `id` riusa l'id del `DViewElement` esistente, non uno spazio di uuid parallelo.

---

## 5. Capacità componibili

### 5.1 ShapeCap (Vertex, GraphVertex)

```typescript
interface ShapeCap {
  shape: Shape;
  fieldCompartments?: FieldCompartment[];
}

interface Shape {
  form: Conditional<'rect' | 'rounded' | 'ellipse' | 'diamond' | 'hexagon' | 'icon'>;
  icon?: Conditional<string>;     // Bootstrap Icons, richiesto se form === 'icon'
  fill?: Conditional<ColorToken>;
  border?: Conditional<BorderSpec>;
  labels?: LabelSpec[];
  badges?: BadgeSpec[];
  minWidth?: number;
  minHeight?: number;
}
```

`shape` e `fieldCompartments` restano ortogonali nello schema. La convenzione (rombi ed ellissi per nodi-relazione senza lista, rettangoli per le entita' con compartimenti) vive nel system prompt e nei few-shot, non come vincolo dello schema.

### 5.2 LabelSpec

```typescript
interface LabelSpec {
  position: 'top' | 'center' | 'inside' | 'bottom';
  source: TextSource;
  visible?: Conditional<boolean>;
  style?: TextStyle;
}

type TextSource =
  | { from: 'path';    expr: PathExpr }   // valore di feature o navigazione
  | { from: 'literal'; text: string };
```

### 5.3 BadgeSpec

```typescript
interface BadgeSpec {
  icon: Conditional<string>;        // Bootstrap Icons
  position: 'tl' | 'tr' | 'bl' | 'br' | 'inline';
  visible: Conditional<boolean>;    // "icona se predicato vero"
  tooltip?: Conditional<string>;
  color?: Conditional<ColorToken>;
}
```

### 5.4 FieldCompartment e FieldFormat

```typescript
interface FieldCompartment {
  id: string;                    // stabile nella view ("attributes", "operations")
  title?: Conditional<string>;
  source: RowSource;
  rowFormat: FieldFormat;
  visible?: Conditional<boolean>;
  separator?: boolean;
}

type RowSource =
  | { from: 'attributes' }
  | { from: 'references' }
  | { from: 'operations' }
  | { from: 'features'; filter?: Predicate }
  | { from: 'query'; path: PathExpr };

interface FieldCap { field: FieldFormat; }

interface FieldFormat {
  segments: FieldSegment[];
  visible?: Conditional<boolean>;
  style?: TextStyle;
}

type FieldSegment =
  | { kind: 'name' }
  | { kind: 'type' }
  | { kind: 'value'; path?: PathExpr }
  | { kind: 'multiplicity' }
  | { kind: 'literal'; text: string }
  | { kind: 'badge'; badge: BadgeSpec };
```

### 5.5 ContainmentCap (Graph, GraphVertex)

Il rendering ricorsivo dei figli esiste già nel classic (`common/DV.tsx`, `data.children.map(c => <DefaultNode .../>)`); è in v1.

```typescript
interface ContainmentCap { containment: Containment; }

interface Containment {
  layout: LayoutSpec;
  childFilter?: Predicate;       // quali elementi contenuti si rendono qui
}

interface LayoutSpec {
  // 'free' e' nativo (coordinate assolute, substrato attuale).
  // 'vertical'|'horizontal'|'grid' = SCSS generato best-effort, fallback su 'free'.
  mode: 'free' | 'vertical' | 'horizontal' | 'grid';
  gap?: number;
  padding?: number;
}
```

### 5.6 GraphBackgroundCap (solo Graph)

```typescript
interface GraphBackgroundCap {
  background?: ColorToken;
  grid?: boolean;
  decorations?: BadgeSpec[];
}
```

### 5.7 EdgeCap

Lo schema descrive l'edge UML completo. Il substrato effettivo dipende da come l'edge esiste (sez. 6.4): il path classico `palette`/`bendingMode` supporta tutto, l'overlay L2 è ridotto.

```typescript
interface EdgeCap { edge: EdgeSpec; }

interface EdgeSpec {
  source?: PathExpr;             // per object-as-edge (-> edgeSource); derivato dalla struttura per reference-as-edge
  target?: PathExpr;             // idem (-> edgeTarget)
  line?: {
    color?: Conditional<ColorToken>;
    width?: Conditional<number>;
    style?: Conditional<'solid' | 'dashed' | 'dotted'>;
  };
  terminations?: {
    sourceEnd?: EdgeTermination;
    targetEnd?: EdgeTermination;
  };
  routing?: 'orthogonal' | 'straight' | 'curved';  // hint; mappa su EdgeBendingMode (sez. 6.4)
  labels?: {
    source?: TextSource;         // -> label-start
    center?: TextSource;         // -> label centro/per-segmento
    target?: TextSource;         // -> label-end
  };
}

type EdgeTermination =
  | 'none'
  | 'openArrow'       // associazione / dipendenza
  | 'closedArrow'     // navigabile
  | 'hollowTriangle'  // generalizzazione
  | 'filledDiamond'   // composizione
  | 'hollowDiamond';  // aggregazione
```

---

## 6. Lowering: come l'IR diventa DViewElement

Questa sezione è il cuore del generatore. Lo schema persistito (`ir?`) è il master; questi sono i campi runtime che il generatore scrive a partire da esso.

### 6.1 Mapping dei campi

| Campo IR | Target su DViewElement | Note |
| --- | --- | --- |
| `kind` | `appliableTo` | Vertex / Edge / Field / Graph / GraphVertex |
| (derivato da `kind`) | `appliableToClasses` | `graph` → `['DModel']`; il resto → `['DObject']` (istanze M1) |
| `metaclasses` | clausola in `oclCondition` | `self.instanceof.id = '<pointer>'`, OR-ata se piu' valori |
| `predicate` | clausola in `oclCondition` | in AND con la metaclasse; escape `jsCondition` se OCL non basta |
| `priority` | `explicitApplicationPriority` | numero; conta su predicati sovrapposti |
| `exclusive` | `isExclusiveView` | default runtime `true`; vedi 6.2 |
| spec nodo/edge + `Conditional<T>` | `jsxString` + SCSS | generati nel dialetto vincolato |
| `edge.source`/`edge.target` | `edgeSource`/`edgeTarget` (+ `isEdge=true`) | solo path object-as-edge (6.4) |
| `ViewIR` intero | nuovo campo `ir?` (master) | additivo, serializzazione generica |

### 6.2 Metaclasse, predicato ed esclusività

Una view su una metaclasse, con un filtro M1, si abbassa in un solo `oclCondition`:

```
appliableToClasses = ['DObject']
oclCondition = context DObject inv: self.instanceof.id = 'Pointer_State' and self.$isInitial.value = true
```

Multi-view per la stessa metaclasse = piu' `ViewIR` con stesso `metaclasses` e `predicate` disgiunti; tutte `exclusive` (`isExclusiveView=true`), così esattamente una matcha per istanza. Le view decorative (badge/overlay impilabili sopra una main view) usano `exclusive=false`. Il system prompt insegna questa distinzione.

### 6.3 Predicate → OCL

Il filtro di applicabilità si abbassa in OCL (subset di `@stekoe/ocl.js`).

| Costrutto IR | OCL |
| --- | --- |
| `and` / `or` / `not` | `and` / `or` / `not` |
| `eq` `neq` `lt` `lte` `gt` `gte` | `=`  `<>`  `<`  `<=`  `>`  `>=` |
| `exists path` | `not self.<path>.oclIsUndefined()` (collezioni: `->notEmpty()`) |
| `empty path` | `self.<path>->isEmpty()` |
| `isKind class` (su self) | `self.instanceof.id = '<pointer>'` |
| `isKind class path` | `self.<path>.instanceof.id = '<pointer>'` |
| `PathExpr $f.value` | `self.$f.value` |
| `$f.values[n]` | `self.$f.values->at(n+1)` (1-based, da verificare nel subset, FU3) |

Quando un costrutto non è esprimibile in OCL, il generatore ricade su `jsCondition` (corpo JS pieno: `?.`, `??`, `let`/`const` ammessi; il dialetto vincolato vale solo per `jsxString`).

### 6.4 Edge: scegliere il substrato

L'edge esiste in due forme nel classic, con substrati diversi.

- **Reference-as-edge** (la metaclasse-edge è una reference, es. una generalizzazione modellata come reference): edge nativo classico, stilizzato da `view.palette` + `bendingMode`. Substrato **completo**: terminazioni (`palette.head`/`palette.tail`, libreria `EdgeHead`), routing (`EdgeBendingMode`), 3 label (start/centro/end), colore hex e dash arbitrari. Gli endpoint vengono dalla struttura, `source`/`target` non servono.
- **Object-as-edge** (la metaclasse-edge è un object con reference source/target, es. una Transition: il pattern StateMachine): meccanismo L2 `isEdge` + `edgeSource`/`edgeTarget`, reso dall'`EdgeOverlay`. Substrato **ridotto**: nessuna terminazione, 6 token di colore, width clampata, una sola label al centro.

Mapping `routing` → `EdgeBendingMode`: `straight` → `Line`; `orthogonal` → `Manhattan` (default edge); `curved` → `Bezier_cubic`.

Il generatore sceglie il path in base alla natura della metaclasse e a quale renderer è vivo nel prodotto (FU1). Per edge UML completi targettizza il path `palette`. Se la metaclasse-edge è un object e serve UML completo, è un upgrade di substrato (object-as-edge oggi passa per l'overlay ridotto): da dichiarare degradato o da rimandare.

### 6.5 Conditional&lt;T&gt; → dialetto vincolato

I `Conditional<T>` dentro shape/badge/style si abbassano in logica condizionale nel `jsxString` (ternari su `var` precalcolate, niente `?.`/`??`, solo componenti registrati). Stessa grammatica `Predicate`, target diverso dal predicato di applicabilità.

---

## 7. Esempi

### 7.1 ERD Entity (vertex, compartimento attributi)

```json
{
  "kind": "vertex",
  "irVersion": "ir-1.0",
  "metaclasses": ["Entity"],
  "label": "Entity",
  "shape": {
    "form": "rect",
    "border": { "color": "#334155", "width": 1, "style": "solid" },
    "labels": [ { "position": "top", "source": { "from": "path", "expr": "$name.value" } } ]
  },
  "fieldCompartments": [
    {
      "id": "attributes",
      "source": { "from": "attributes" },
      "rowFormat": { "segments": [ { "kind": "name" }, { "kind": "literal", "text": ": " }, { "kind": "type" } ] }
    }
  ]
}
```

Si abbassa in: `appliableToClasses=['DObject']`, `oclCondition = context DObject inv: self.instanceof.id = '<pointer Entity>'`.

### 7.2 UML Class (badge condizionale abstract + compartimenti)

```json
{
  "kind": "vertex",
  "irVersion": "ir-1.0",
  "metaclasses": ["Class"],
  "shape": {
    "form": "rect",
    "labels": [
      {
        "position": "top",
        "source": { "from": "path", "expr": "$name.value" },
        "style": {
          "fontStyle": {
            "when": { "op": "eq", "left": "$isAbstract.value", "right": { "kind": "boolean", "value": true } },
            "then": "italic", "else": "normal"
          }
        }
      }
    ],
    "badges": [
      {
        "icon": "bi-asterisk",
        "position": "tr",
        "visible": {
          "when": { "op": "eq", "left": "$isAbstract.value", "right": { "kind": "boolean", "value": true } },
          "then": true, "else": false
        },
        "tooltip": "abstract"
      }
    ]
  },
  "fieldCompartments": [
    { "id": "attributes", "source": { "from": "attributes" }, "rowFormat": { "segments": [ { "kind": "name" }, { "kind": "literal", "text": ": " }, { "kind": "type" } ] } },
    { "id": "operations", "separator": true, "source": { "from": "operations" }, "rowFormat": { "segments": [ { "kind": "name" }, { "kind": "literal", "text": "()" } ] } }
  ]
}
```

Il `Conditional` su `fontStyle` e la `visible` del badge si abbassano nel `jsxString` (ternari), non in OCL: sono condizionali a render-time, non filtri di applicabilità.

### 7.3 UML Generalization (edge, terminazione a triangolo vuoto)

```json
{
  "kind": "edge",
  "irVersion": "ir-1.0",
  "metaclasses": ["Generalization"],
  "edge": {
    "source": "$specific.value",
    "target": "$general.value",
    "line": { "style": "solid", "width": 1 },
    "terminations": { "sourceEnd": "none", "targetEnd": "hollowTriangle" },
    "routing": "orthogonal"
  }
}
```

Terminazione e 3-label disponibili sul path `palette` (reference-as-edge) o degradate sull'overlay (object-as-edge): scelta in 6.4.

### 7.4 UML Package (graphVertex, contenimento ricorsivo in v1)

```json
{
  "kind": "graphVertex",
  "irVersion": "ir-1.0",
  "metaclasses": ["Package"],
  "shape": {
    "form": "rect",
    "labels": [ { "position": "top", "source": { "from": "path", "expr": "$name.value" } } ]
  },
  "containment": {
    "layout": { "mode": "free", "padding": 16 },
    "childFilter": { "op": "isKind", "class": "Class" }
  }
}
```

Le classi contenute si rendono dentro il package (rendering ricorsivo nativo). `layout.mode: 'free'` è il substrato attuale; gli altri mode sono SCSS generato best-effort.

---

## 8. Persistenza e versioning

- `ir?` è un campo **opzionale e additivo** sul `DViewElement`. La serializzazione è generica (`U.compressedState` fa `JSON.stringify` su tutto `state.idlookup`, nessun allowlist), quindi viaggia automaticamente come il `jsxString`. Costo: dichiarazione D-layer in `view.tsx` (+ accessor L se serve), nessun VersionFixer per un opzionale `undefined`.
- L'IR è il **master**. Si edita l'IR e si rigenera la view (forward ripetuto). Mai backward nel core.
- L'edit manuale del `jsxString` **scollega** la view dall'IR (drift), segnalato con badge "view custom, non più legata all'IR".
- `irVersion` su `ViewpointIR` è la versione all'emissione, copiata su ogni `ViewIR` persistita.
- L'identità della view è l'id del `DViewElement` esistente.

---

## 9. Stato discovery

**Risolti**: formato `appliableToClasses` (cname, livello jjodel), pattern OCL `instanceof.id`, contenimento ricorsivo già presente, `explicitApplicationPriority`/`isExclusiveView` esistenti, target di lowering del predicato (OCL + JS escape), editor target (classic).

**Aperti, interni al generatore** (non bloccano schema né system prompt; vanno chiusi nella discovery read-only che precede la spec del generatore):
1. **FU1** — quale renderer edge è vivo nel classic (`DV.tsx`/`palette` completo vs `EdgeOverlay` ridotto), e per quali casi (reference-as-edge vs object-as-edge). Determina se "edge UML completi" sono v1 o richiedono upgrade di substrato.
2. **FU3** — subset OCL di `@stekoe/ocl.js`: `->at(n)` (1-based?), `->isEmpty()`/`->notEmpty()`, `oclIsUndefined()`, navigazione `self.$feature.values`. Determina la completezza del transpiler `Predicate → OCL`.
3. **FU4** — forma del pointer DClass in `instanceof.id` (`Pointer_<name>` vs `DClass_<hash>`). Fissa l'unica forma che il generatore emette risolvendo `MetaclassRef`.

---

## 10. Fuori dalla v1

- **Flow-v2 come target di rendering**: richiede un substrato di interpretazione delle view nei componenti React, inesistente. Iniziativa separata.
- **Escape hatch** (frammento di template raw per slot, sanitizzato): in architettura, fuori dalla release. Resta aperta la scelta se riservarne ora un seam nello schema (`kind: 'raw'` rifiutato dal validatore v1) per non bumpare lo schema in v1.1.
- **Backward lift** (view -> IR): best-effort, fuori dal core.

---

## Prossimi passi

1. **System prompt**: derivarlo da questo schema. Insegna a emettere `metaclasses` (nomi di metaclasse), predicati e condizioni nella grammatica chiusa, i cinque `kind`. Non dipende da FU1/3/4 (l'idraulica jjodel/OCL è del generatore). Gli esempi di sez. 7 sono il seme dei few-shot.
2. **Discovery pre-generatore** (read-only): chiudere FU1, FU3, FU4.
3. **Spec del generatore** per Claude Code: transpiler `Predicate → OCL`, derivazione `appliableToClasses` dal `kind`, risoluzione `MetaclassRef → pointer`, emissione `jsxString` nel dialetto vincolato, scrittura `explicitApplicationPriority`/`isExclusiveView`, instradamento edge per substrato.
4. **Dove nell'UI**: il punto di attivazione della feature.
