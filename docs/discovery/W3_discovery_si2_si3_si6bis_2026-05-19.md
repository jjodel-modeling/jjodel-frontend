# W3 Discovery — SI2 (defaultValueLiteral) + SI3 (iD) + SI6-bis (ECoreEnum.serializable)

**Branch**: `alfonso-frontend-jjtl`
**Data**: 2026-05-19
**HEAD**: `e89b59c44` (post-W2)
**Workstream**: W3 = SI2 + SI3 + SI6-bis
**Modalità**: read-only. Nessun source/test/fixture modificato.

Pre-check soft: `git status` pulito modulo `frontend/prompts/` untracked (scratchpad noto). Working tree clean — discovery autorizzata.

---

## TL;DR

| Item | Item file | Sub-item | Pos. attuale | Tipo cambio | Righe |
|------|-----------|----------|--------------|-------------|------:|
| SI2  | `data.ts` | declare `ECoreAttribute.defaultValueLiteral` | class @ L1297-1313 | additive (1) | 1 |
| SI2  | `data.ts` | declare `ECoreReference.defaultValueLiteral` | class @ L1276-1295 | additive (1) | 1 |
| SI2  | `data.ts` | assign `ECoreAttribute.defaultValueLiteral` | block @ L1435-1446 | additive (1) | 1 |
| SI2  | `data.ts` | assign `ECoreReference.defaultValueLiteral` | block @ L1418-1432 | additive (1) | 1 |
| SI2  | `data.ts` | `parseDAttribute` read | L874-902 | additive (1) | 1 |
| SI2  | `data.ts` | `parseDReference` read | L904-946 | additive (1) | 1 |
| SI2  | `EcoreService.ts` | `exportAttribute` emit | block commentato @ L297-299 | **uncomment** (3) | 3 |
| SI2  | `EcoreService.ts` | `exportReference` emit | nuovo, dopo flag block | additive (3) | 3 |
| SI3  | `data.ts` | declare `ECoreAttribute.iD` | class @ L1297-1313 | additive (1) | 1 |
| SI3  | `data.ts` | assign `ECoreAttribute.iD` | block @ L1435-1446 | additive (1) | 1 |
| SI3  | `data.ts` | `parseDAttribute` read (XML `iD` → D `isID`) | L874-902 | additive (1) | 1 |
| SI3  | `EcoreService.ts` | `exportAttribute` emit | inside truthy-flag block @ L302-306 | additive (1) | 1 |
| SI6b | `data.ts` | fix `ECoreEnum.serializable` prefix | L1402 | **edit (1)** | 1 (net 0) |

**Totale righe production stimato**: ~18 (vs. pre-stima ~23 — 4 in meno per via di emit più compatto su exporter attribute uncomment e su reference).

---

## §1 — SI2 (defaultValueLiteral wire)

### §1.1 Costanti importer

#### Dichiarazione `ECoreAttribute` (class declaration) — `frontend/src/api/data.ts:1297-1313`

```typescript
@RuntimeAccessible('ECoreAttribute')
export class ECoreAttribute {
    static cname = 'ECoreAttribute';
    static eAnnotations: string;
    static xsitype: string;
    static namee: string;
    static eType: string;
    static unique: string;
    static ordered: string;
    static lowerbound: string;
    static upperbound: string;
    static derived: string;
    static transient: string;
    static volatile: string;
    static changeable: string;
    static unsettable: string;
}
```

#### Dichiarazione `ECoreReference` (class declaration) — `frontend/src/api/data.ts:1276-1295`

```typescript
@RuntimeAccessible('ECoreReference')
export class ECoreReference {
    static cname = 'ECoreReference';
    static eAnnotations: string;
    static xsitype: string;
    static eType: string;
    static namee: string;
    static unique: string;
    static ordered: string;
    static upperbound: string;
    static lowerbound: string;
    static containment: string;
    static container: string;
    static derived: string;
    static transient: string;
    static volatile: string;
    static changeable: string;
    static unsettable: string;
    static eOpposite: string;
}
```

#### Assegnazione `ECoreAttribute.*` (assignment block) — `frontend/src/api/data.ts:1435-1446`

```typescript
ECoreAttribute.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'; // "ecore:EAttribute",
ECoreAttribute.eType = EcoreParser.XMLinlineMarker + 'eType'; // "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
ECoreAttribute.namee = EcoreParser.XMLinlineMarker + 'name';
ECoreAttribute.lowerbound = EcoreParser.XMLinlineMarker + 'lowerBound';
ECoreAttribute.upperbound = EcoreParser.XMLinlineMarker + 'upperBound';
ECoreAttribute.unique = EcoreParser.XMLinlineMarker + 'unique'; // "false",
ECoreAttribute.ordered = EcoreParser.XMLinlineMarker + 'ordered'; // "false",
ECoreAttribute.derived = EcoreParser.XMLinlineMarker + 'derived'; // "true"
ECoreAttribute.transient = EcoreParser.XMLinlineMarker + 'transient'; // "true"
ECoreAttribute.volatile = EcoreParser.XMLinlineMarker + 'volatile'; // "true"
ECoreAttribute.changeable = EcoreParser.XMLinlineMarker + 'changeable'; // "false"
ECoreAttribute.unsettable = EcoreParser.XMLinlineMarker + 'unsettable'; // "true"
```

#### Assegnazione `ECoreReference.*` (assignment block) — `frontend/src/api/data.ts:1418-1432`

```typescript
ECoreReference.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'; // "ecore:EReference"
ECoreReference.eType = EcoreParser.XMLinlineMarker + 'eType'; // "#//Player"
ECoreReference.containment = EcoreParser.XMLinlineMarker + 'containment'; // "true"
ECoreReference.container = EcoreParser.XMLinlineMarker + 'container'; // "true" todo: not sure if it's really like this.
ECoreReference.upperbound = EcoreParser.XMLinlineMarker + 'upperBound'; // "@1"
ECoreReference.lowerbound = EcoreParser.XMLinlineMarker + 'lowerBound'; // does even exists?
ECoreReference.namee = EcoreParser.XMLinlineMarker + 'name';
ECoreReference.unique = EcoreParser.XMLinlineMarker + 'unique'; // "false",
ECoreReference.ordered = EcoreParser.XMLinlineMarker + 'ordered'; // "false",
ECoreReference.derived = EcoreParser.XMLinlineMarker + 'derived'; // "true"
ECoreReference.transient = EcoreParser.XMLinlineMarker + 'transient'; // "true"
ECoreReference.volatile = EcoreParser.XMLinlineMarker + 'volatile'; // "true"
ECoreReference.changeable = EcoreParser.XMLinlineMarker + 'changeable'; // "false"
ECoreReference.unsettable = EcoreParser.XMLinlineMarker + 'unsettable'; // "true"
ECoreReference.eOpposite = EcoreParser.XMLinlineMarker + 'eOpposite'; // "#//Cls/feat" (3-segment intra-doc pointer)
```

#### Punto di intervento — SI2.1 (attribute)

- **Declaration insertion**: aggiungere `static defaultValueLiteral: string;` in `ECoreAttribute` class block. Posizione consigliata: dopo `static unsettable: string;` (ultimo flag), come trailing line. Sintatticamente è indifferente, ma a parità di stile l'ordine "primary props → flags → metadata" suggerisce di metterlo **dopo** `unsettable` (è metadata di default value, semanticamente distinto dai flag).
- **Assignment insertion**: aggiungere `ECoreAttribute.defaultValueLiteral = EcoreParser.XMLinlineMarker + 'defaultValueLiteral';` nel blocco di assignment. Posizione consigliata: dopo `ECoreAttribute.unsettable = ...` (riga 1446). Stesso razionale dell'ordine sopra.

#### Punto di intervento — SI2.2 (reference)

- **Declaration**: stessa cosa, in `ECoreReference` class. Posizione consigliata: dopo `static unsettable` (e prima di `eOpposite` per coerenza: `eOpposite` è già extra-positioned come metadata).
- **Assignment**: dopo `ECoreReference.unsettable = ...` (riga 1431), prima di `eOpposite` (riga 1432). Oppure dopo `eOpposite` — entrambi accettabili. Lo stile dell'autore mette `eOpposite` alla fine perché è "tail metadata"; `defaultValueLiteral` è simile.

#### Sanity check di non-collisione

```text
$ grep -n "'defaultValueLiteral'\|\"defaultValueLiteral\"" frontend/src/api/data.ts
(no match)
```

Nessuna costante stringa `'defaultValueLiteral'` esiste in `data.ts`. **Nessuna collisione**.

`XMLinlineMarker` è in scope globale del file: dichiarato a `EcoreParser.XMLinlineMarker = '-'` (riga 1023) e usato in tutti i blocchi di assignment delle costanti come `EcoreParser.XMLinlineMarker + 'xxx'`. **Verificato**.

#### Sanity check di non-regressione

Il campo `DAttribute.defaultValueLiteral` (LME L4115) e `DReference.defaultValueLiteral` (LME L3757) sono **già letti** da consumer downstream:

- `jjscript/executor/commands/set.ts:164` — accetta `defaultValueLiteral` come attributo settabile.
- `jjscript/executor/commands/set.ts:222-223` — alias `default`/`defaultvalue` → `defaultValueLiteral`.
- `jjscript/executor/commands/copy.ts:239` — copia attributo.
- `jjscript/executor/commands/show.ts:352` — display in PrintTable.
- `components/editor-v2/nodes/ObjectNode.tsx:115` — encode nel raw stringblock.
- `components/editor-v2/utils/jjomTransformers.ts:52` — fallback in jjomToCanvas.
- `components/editor-v2/hooks/useClassRemoval.ts:149-150` — preserve in remove/restore.

Tutti questi consumer leggono il campo direttamente dal proxy L. Oggi il campo è sempre `''` perché l'importer non lo legge. Dopo W3, riceveranno il valore reale se presente. Comportamento: campi che oggi mostrano stringa vuota mostreranno il valore di default reale. **Non è una regressione**: è il completamento del path.

Nessun consumer si aspetta `''` come marker semantico.

### §1.2 Read in `parseDAttribute`

**File**: `frontend/src/api/data.ts:874-902`.

```typescript
static parseDAttribute(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
    if (!generated) generated = [];
    if (!json) { json = {}; }
    const childs = this.getChildren(json);
    // done: old approach does not set pointedBy, i should set father and all pointers in .new() parameters
    let dObject: DAttribute = DAttribute.new(
        this.read(json, ECoreNamed.namee, 'attr_1'),
        undefined,
        parent.id,
    );
    generated.push(dObject);// dObject.father = parent.id;
    // if (parent) parent.attributes.push(dObject.id);
    //dObject.name = this.read(json, ECoreNamed.namee, 'attr_1');
    (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
    const annotations: Json[] = this.getAnnotations(json);
    for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
    /// *** specific start *** ///
    dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
    dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
    dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
    dObject.ordered = U.fromBoolString(this.read(json, ECoreAttribute.ordered, true), true);
    dObject.unique = U.fromBoolString(this.read(json, ECoreAttribute.unique, true), true);
    dObject.changeable = U.fromBoolString(this.read(json, ECoreAttribute.changeable, true), true);
    dObject.derived = U.fromBoolString(this.read(json, ECoreAttribute.derived, false), false);
    dObject.transient = U.fromBoolString(this.read(json, ECoreAttribute.transient, false), false);
    dObject.volatile = U.fromBoolString(this.read(json, ECoreAttribute.volatile, false), false);
    dObject.unsettable = U.fromBoolString(this.read(json, ECoreAttribute.unsettable, false), false);
    /// *** specific end *** ///
    return generated; }
```

#### Pattern read per stringhe

Le stringhe vengono lette via `this.read(json, KEY, default)` direttamente (es. `dObject.type` riga 893 default `AttribETypes.EString`; `dObject.instanceClassName` di parseDDataType riga 851 default `''`).

I boolean usano `U.fromBoolString(this.read(json, KEY, default), default)`.

I numerici usano `+this.read(json, KEY, default)` (unary plus per coerce).

#### Punto di intervento

Inserire dopo riga 900 (`unsettable`):

```typescript
dObject.defaultValueLiteral = this.read(json, ECoreAttribute.defaultValueLiteral, '');
```

Posizione esatta: subito prima di `/// *** specific end *** ///` (linea 901). Coerente con `parseDDataType:851` che usa `''` come default per `instanceClassName`.

**Sanity di scoping**: il setter via accesso diretto `dObject.X = ...` è il pattern dominante per parseDAttribute (vedi righe 891-900 tutte same-shape). Non serve `SetFieldAction` né proxy: D-layer raw assignment durante parse, pre-Redux-commit. ✅

### §1.3 Read in `parseDReference`

**File**: `frontend/src/api/data.ts:904-946`. **Toccato da W1 (BL1)** per `eOpposite` + XPath normalization.

```typescript
static parseDReference(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
    if (!generated) generated = [];
    if (!json) { json = {}; }
    const childs = this.getChildren(json);
    let dObject: DReference = DReference.new(undefined, undefined, parent.id);
    generated.push(dObject);// dObject.father = parent.id;
    // if (parent) parent.references.push(dObject.id);
    dObject.name = this.read(json, ECorePackage.namee, 'Ref_1');
    (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
    const annotations: Json[] = this.getAnnotations(json);
    for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
    /// *** specific start *** ///
    dObject.composition = U.fromBoolString(this.read(json, ECoreReference.containment, false), false);
    dObject.container = U.fromBoolString(this.read(json, ECoreReference.container, false), false);
    dObject.lowerBound = +this.read(json, ECoreAttribute.lowerbound, 0);
    dObject.upperBound = +this.read(json, ECoreAttribute.upperbound, 1);
    dObject.type = this.read(json, ECoreReference.eType, this.getEcoreTypeName(parent));
    dObject.ordered = U.fromBoolString(this.read(json, ECoreReference.ordered, true), true);
    dObject.unique = U.fromBoolString(this.read(json, ECoreReference.unique, true), true);
    dObject.changeable = U.fromBoolString(this.read(json, ECoreReference.changeable, true), true);
    dObject.derived = U.fromBoolString(this.read(json, ECoreReference.derived, false), false);
    dObject.transient = U.fromBoolString(this.read(json, ECoreReference.transient, false), false);
    dObject.volatile = U.fromBoolString(this.read(json, ECoreReference.volatile, false), false);
    dObject.unsettable = U.fromBoolString(this.read(json, ECoreReference.unsettable, false), false);
    // BL1: legge eOpposite come pointer raw "#//Cls/feat"; risolto a Pointer<DReference>
    // in LinkAllNamesToIDs grazie all'inclusione di "opposite" in replaceRules.
    const oppositeRaw = this.read(json, ECoreReference.eOpposite, '');
    if (oppositeRaw) {
        // Normalize EMF 3-segment XPath "/N/Class/Feature" to canonical "#//Class/Feature"
        // (rewriteXPathPointers explicitly skips 3-segment pointers, see line 1064).
        // We assume single-root document (N=0); multi-root would need package-index resolution.
        let normalized = oppositeRaw as string;
        const xpathMatch = /^\/(\d+)\//.exec(normalized);
        if (xpathMatch) {
            if (xpathMatch[1] !== '0') {
                Log.ww('eOpposite with multi-root XPath /' + xpathMatch[1] + '/... not fully supported, treating as N=0', { raw: oppositeRaw });
            }
            normalized = normalized.replace(/^\/\d+\//, '#//');
        }
        dObject.opposite = normalized as any;
    }
    /// *** specific end *** ///
    return generated; }
```

#### Punto di intervento

Inserire dopo riga 927 (`unsettable`), **prima** del blocco eOpposite (riga 928 in poi). Non si interferisce con la logica BL1 di W1: aggiungiamo una riga prima del comment marker `// BL1:`.

```typescript
dObject.defaultValueLiteral = this.read(json, ECoreReference.defaultValueLiteral, '');
```

Posizione esatta: tra L927 e L928, prima del commento `// BL1: legge eOpposite ...`.

**Merge-collision risk**: nessuno. Il blocco eOpposite è isolato dal commento marker e ha la sua signature (assegna `dObject.opposite`). Aggiungere una riga sopra non lo tocca.

### §1.4 Emit in exporter — attribute

**File**: `frontend/src/services/export/EcoreService.ts:274-309`.

```typescript
/**
 * Export EAttribute
 */
private static exportAttribute(attr: LAttribute, indent: string): string {
    const parts: string[] = [
        `xsi:type="ecore:EAttribute"`,
        `name="${this.escapeXml(attr.name)}"`,
    ];

    // Type mapping
    const ecoreType = this.mapToEcoreType(attr.type);
    parts.push(`eType="${ecoreType}"`);

    // Multiplicity
    if (attr.lowerBound !== undefined && attr.lowerBound !== 0) {
        parts.push(`lowerBound="${attr.lowerBound}"`);
    }
    if (attr.upperBound !== undefined && attr.upperBound !== 1) {
        parts.push(`upperBound="${attr.upperBound}"`);
    }

    // ordered/unique — opt-only emission (EMF default true)
    if (attr.ordered === false) parts.push(`ordered="false"`);
    if (attr.unique === false) parts.push(`unique="false"`);

    // Default value
    /*if (attr.defaultValueLiteral) {
        parts.push(`defaultValueLiteral="${this.escapeXml(attr.defaultValueLiteral)}"`);
    }*/

    // Other properties
    if (attr.derived) parts.push(`derived="true"`);
    if (attr.transient) parts.push(`transient="true"`);
    if (attr.volatile) parts.push(`volatile="true"`);
    if (attr.unsettable) parts.push(`unsettable="true"`);
    if (!attr.changeable) parts.push(`changeable="false"`);

    return `${indent}<eStructuralFeatures ${parts.join(' ')}/>`;
}
```

#### Stato attuale

Il blocco `defaultValueLiteral` (righe 297-299) è **già presente ma commentato**. La forma è semanticamente corretta:
- `attr.defaultValueLiteral` truthy → emit (skip empty string `''`).
- `escapeXml()` su payload — coerente con `name="${this.escapeXml(...)}"` riga 277.

#### Punto di intervento

**Uncomment** righe 297-299:

```typescript
// Default value
if (attr.defaultValueLiteral) {
    parts.push(`defaultValueLiteral="${this.escapeXml(attr.defaultValueLiteral)}"`);
}
```

Nessun riposizionamento necessario: il commento marker `// Default value` rimane.

#### Skip-default semantic

`defaultValueLiteral` è una stringa. EMF idiomatic: l'attributo XML `defaultValueLiteral="..."` viene emesso solo se non vuoto. Il guard `if (attr.defaultValueLiteral)` (truthy) skippa `''`, `null`, `undefined` — tutti casi che NON devono produrre output. **Corretto**.

### §1.5 Emit in exporter — reference

**File**: `frontend/src/services/export/EcoreService.ts:314-356`.

```typescript
/**
 * Export EReference
 */
private static exportReference(ref: LReference, allClasses: LClass[], indent: string, currentPackage: LPackage): string {
    const parts: string[] = [
        `xsi:type="ecore:EReference"`,
        `name="${this.escapeXml(ref.name)}"`,
    ];

    // Target type — emitted with reflection-aware, cross-package-aware pointer.
    const targetType = ref.type;
    if (targetType) {
        parts.push(`eType="${this.targetTypePointer(targetType, currentPackage)}"`);
    }

    // Multiplicity — SI10: skip default 0 per allineamento EMF idiomatic.
    if (ref.lowerBound !== undefined && ref.lowerBound !== 0) {
        parts.push(`lowerBound="${ref.lowerBound}"`);
    }
    if (ref.upperBound !== undefined && ref.upperBound !== 1) {
        parts.push(`upperBound="${ref.upperBound}"`);
    }

    // Feature flags — opt-only emission, strict === comparison (false-positive guard on undefined/missing).
    if (ref.ordered === false) parts.push(`ordered="false"`);
    if (ref.unique === false) parts.push(`unique="false"`);
    if (ref.changeable === false) parts.push(`changeable="false"`);
    if (ref.derived === true) parts.push(`derived="true"`);
    if (ref.transient === true) parts.push(`transient="true"`);
    if (ref.volatile === true) parts.push(`volatile="true"`);
    if (ref.unsettable === true) parts.push(`unsettable="true"`);

    // Containment (composition)
    if (ref.composition || ref.containment) {
        parts.push(`containment="true"`);
    }

    // Opposite reference — class-level pointer is cross-package-aware,
    // then we append /featureName for the opposite's own name.
    const opposite = ref.opposite;
    if (opposite && targetType) {
        parts.push(`eOpposite="${this.crossPackagePointer(targetType, currentPackage)}/${this.escapeXml(opposite.name)}"`);
    }

    return `${indent}<eStructuralFeatures ${parts.join(' ')}/>`;
}
```

#### Stato attuale

**Nessun blocco** per `defaultValueLiteral` (neanche commentato). Gap completo confermato.

#### Punto di intervento

Aggiungere dopo `containment` block (riga 346), prima di `// Opposite reference` (riga 348). Razionale: `defaultValueLiteral` è metadata di valore, va in zona "tail" prima di opposite (che è già relazionale).

Forma proposta:

```typescript
// Default value
if (ref.defaultValueLiteral) {
    parts.push(`defaultValueLiteral="${this.escapeXml(ref.defaultValueLiteral)}"`);
}
```

Allineato esattamente al pattern uncommented di `exportAttribute`.

**Note pratica**: `defaultValueLiteral` su EReference è semantica rara in EMF (le reference puntano a oggetti, non hanno literal default). EMF lo supporta nominalmente. Vedi §6 OQ-A per discussione.

---

## §2 — SI3 (iD wire)

### §2.1 Costante importer

#### Sanity check critico

```text
$ grep -n "'iD'\|\"iD\"\| iD = \| iD:" frontend/src/api/data.ts
(no match)
```

Nessuna costante stringa `'iD'` esiste in `data.ts`. Nessuna costante `ECoreAttribute.id` (lowercase) esiste. **Zero collision**.

#### Punto di intervento

**Declaration** (in `ECoreAttribute` class, dopo `defaultValueLiteral` se SI2 viene prima — altrimenti dopo `unsettable`):

```typescript
static iD: string;
```

**Assignment** (nel blocco assignment, dopo `ECoreAttribute.unsettable` o `ECoreAttribute.defaultValueLiteral`):

```typescript
ECoreAttribute.iD = EcoreParser.XMLinlineMarker + 'iD'; // bool, marca primary-key logico (EMF: "iD" con I maiuscola)
```

**Case sensitivity**: la stringa XML è `iD` (i minuscolo, D maiuscolo). Confermato:
- EMF standard EAttribute attribute name è `iD` (vedi `Ecore.ecore` reference + ETypedElement spec).
- Il commento esistente in `DAttribute.isID` (LME L4132: `// ? exist in ecore as "iD" ?`) — risposta affermativa.

### §2.2 Read in `parseDAttribute`

Il D-layer field è `DAttribute.isID: boolean = false` (LME L4132). Mapping: XML attr `iD` → D field `isID`.

**Pattern**: come boolean, usare `U.fromBoolString(this.read(json, KEY, false), false)`. Stile identico a `derived`/`transient`/`volatile`/`unsettable`.

#### Punto di intervento

Inserire dopo riga 900 (oppure dopo la nuova riga `defaultValueLiteral` di SI2.2 — l'ordine relativo SI2/SI3 dentro la funzione è indifferente).

Forma proposta:

```typescript
dObject.isID = U.fromBoolString(this.read(json, ECoreAttribute.iD, false), false);
```

**Nota di scoping**: il setter `dObject.isID = ...` accede al campo raw D pre-commit, identico al pattern di tutti gli altri set in parseDAttribute. ✅

### §2.3 Emit in exporter

**File**: `frontend/src/services/export/EcoreService.ts:274-309` (exportAttribute).

**Stile dominante**: emit truthy con stringa letterale `"true"`/`"false"`. Vedi righe 302-306:

```typescript
if (attr.derived) parts.push(`derived="true"`);
if (attr.transient) parts.push(`transient="true"`);
if (attr.volatile) parts.push(`volatile="true"`);
if (attr.unsettable) parts.push(`unsettable="true"`);
if (!attr.changeable) parts.push(`changeable="false"`);
```

Non viene usato `U.boolToString` né `String(value)` — stringhe letterali.

#### Punto di intervento

Inserire dopo `unsettable` (riga 305) o dopo `changeable` (riga 306). Posizione consigliata: dopo `unsettable`, prima di `changeable`. Razionale: `iD` è un flag di tipo "boolean opt-on" come unsettable/transient/derived, quindi raggruppato con quelli; `changeable` è "boolean opt-off" (default true), stilisticamente isolato in fondo.

Forma proposta:

```typescript
if (attr.isID) parts.push(`iD="true"`);
```

**Skip-default semantic**: EMF default `iD = false`. Emit solo se truthy. ✅

---

## §3 — SI6-bis (`ECoreEnum.serializable` XMLinlineMarker fix)

### §3.1 Localizzazione

**File**: `frontend/src/api/data.ts:1402`.

```typescript
ECoreEnum.instanceTypeName = ECoreClass.instanceTypeName;
ECoreEnum.serializable = 'serializable'; // "false", "true"
ECoreEnum.xsitype = ECoreClass.xsitype; // "ecore:EEnum"
ECoreEnum.eLiterals = 'eLiterals';
ECoreEnum.namee = ECorePackage.namee;
```

Riga 1402 esatta. Non shifted dalla pre-stima.

### §3.2 Verifica diagnostica

#### Pattern delle costanti vicine (`ECoreEnum.*`)

```typescript
ECoreEnum.instanceTypeName = ECoreClass.instanceTypeName;
// ECoreClass.instanceTypeName = EcoreParser.XMLinlineMarker + 'instanceTypeName'  (riga 1396)
// → quindi ECoreEnum.instanceTypeName === '-instanceTypeName' (con prefix)

ECoreEnum.serializable = 'serializable';
// → NO prefix. BUG.

ECoreEnum.xsitype = ECoreClass.xsitype;
// ECoreClass.xsitype = EcoreParser.XMLinlineMarker + 'xsi:type'  (riga 1393)
// → quindi ECoreEnum.xsitype === '-xsi:type' (con prefix)

ECoreEnum.eLiterals = 'eLiterals';
// → NO prefix, ma è un CHILD ELEMENT (non attribute), quindi corretto.

ECoreEnum.namee = ECorePackage.namee;
// ECorePackage.namee = EcoreParser.XMLinlineMarker + 'name'  (riga 1382)
// → quindi ECoreEnum.namee === '-name' (con prefix). Corretto per attribute.
```

**Conferma**: tutte le altre costanti EnumAttribute (`instanceTypeName`, `xsitype`, `namee`) hanno prefix `XMLinlineMarker`. Solo `serializable` no — bug pre-existing.

Per confronto, `ECoreDataType.serializable` (riga 1412) è prefixed correttamente:
```typescript
ECoreDataType.serializable = EcoreParser.XMLinlineMarker + 'serializable';
```

#### Fix proposto

```typescript
ECoreEnum.serializable = EcoreParser.XMLinlineMarker + 'serializable'; // "false", "true"
```

1 riga, sostituzione literal. Allineato a `ECoreDataType.serializable` (stessa stringa XML, stesso pattern).

#### Consumer downstream — `grep -rn "ECoreEnum.serializable" frontend/src/`

```text
frontend/src/api/data.ts:1402
    ECoreEnum.serializable = 'serializable';                    [DEFINIZIONE — da fixare]

frontend/src/api/data.ts:817
    case ECoreEnum.serializable: dObject.serializable = value === 'true'; break;
    [parseDEnum switch — IMPATTO POSITIVO del fix]

frontend/src/model/logicWrapper/LModelElement.tsx:371
    case ECoreEnum.serializable: delete ecore[k]; ecore.serializable = v; break;
    [_convertEcoreToJom_m2 in Dummy.t2m path — IMPATTO POSITIVO del fix]

frontend/src/model/logicWrapper/LModelElement.tsx:4510
    json[ECoreEnum.serializable] = d.serializable ? "true" : "false";
    [LEnumerator.generateEcoreJson_impl LEGACY path — SIDE EFFECT da verificare]
```

#### Analisi consumer

**Consumer 1 — `data.ts:817` (parseDEnum switch)**:

```typescript
for (let key in json) {
    const value = json[key];
    switch (key) {
        default: Log.exx('Enum.parse() unexpected key:', key, 'in json:', json); break;
        case ECoreEnum.eAnnotations:
        case ECoreEnum.xsitype: case ECoreNamed.namee: break;
        case ECoreEnum.eLiterals: break;
        case ECoreEnum.serializable: dObject.serializable = value === 'true'; break;
        case ECoreEnum.instanceTypeName: dObject.instanceClassName = value + ''; break;
    }
}
```

**Comportamento attuale (con bug)**: il loop `for (let key in json)` itera le chiavi XMI parsate. Le chiavi di attributo hanno prefix `XMLinlineMarker = '-'` (es. `'-serializable'`). Il `case ECoreEnum.serializable` (stringa `'serializable'`) **non matcha mai** la chiave reale `'-serializable'`. Falls into `default: Log.exx(...)` → log error ma nessun valore parsed. `dObject.serializable` rimane al default D-layer (probabilmente `true`).

**Comportamento dopo fix**: la stringa diventa `'-serializable'`, matcha la chiave reale, `dObject.serializable = value === 'true'` correttamente eseguito. Fixed. ✅

**Consumer 2 — `LModelElement.tsx:371` (`_convertEcoreToJom_m2` in Dummy.t2m)**:

```typescript
case ECoreEnum.serializable:         delete ecore[k]; ecore.serializable = v; break;
```

`_convertEcoreToJom_m2` normalizza chiavi XMI-prefixed → unprefixed (vedi righe 350-388 per pattern: tutti i case fanno `delete ecore[k]; ecore.X = v`). È usato da `Dummy.t2m()` (`frontend/src/common/Dummy.ts:265, 441, 635`).

**Comportamento attuale (con bug)**: stessa dinamica della Consumer 1 — case non matcha `'-serializable'`. La chiave `'-serializable'` cade in `default: break` (riga 347, silent skip). Il key NON viene eliminato dal `ecore` né normalizzato. Resta `-serializable` nell'output di `_convertEcoreToJom_m2`. Possibili side-effect downstream silenti.

**Comportamento dopo fix**: case matcha `'-serializable'`, delete + normalize a `ecore.serializable`. È **anche** un fix qui, allineato all'intento della funzione.

**Comportamento legacy/dummy path**: `_convertEcoreToJom_m2` è marcato "used in Dummy.t2m()". Dummy è path legacy (commento source). Probabilmente non sul critical path post-EcoreService refactor. Comunque il fix è additive/positive — non rompe nulla. ✅

**Consumer 3 — `LModelElement.tsx:4510` (`LEnumerator.generateEcoreJson_impl`)**:

```typescript
json[ECoreEnum.xsitype] = 'ecore:EEnum';
json[ECoreEnum.namee] = d.name;
if (d.instanceClassName) json[ECoreEnum.instanceTypeName] = d.instanceClassName;
json[ECoreEnum.serializable] = d.serializable ? "true" : "false";
if (literals.length) json[ECoreEnum.eLiterals] = literals;
```

Questo è il path **legacy** `generateEcoreJson_impl` — esplicitamente NON IN SCOPE W3 (vedi prompt § "Vincoli architetturali").

**Comportamento attuale**: emette `json['serializable'] = ...` (chiave unprefixed).
**Comportamento dopo fix**: emetterebbe `json['-serializable'] = ...` (chiave prefixed).

Il legacy path emette già le altre chiavi prefixed (`json['-xsi:type']`, `json['-name']`, `json['-instanceTypeName']`). Quindi prima del fix `serializable` era l'unica anomalia, dopo il fix è coerente con il resto.

**Risk**: se qualcuno consuma il JSON output di `generateEcoreJson_impl` aspettandosi `json.serializable` (unprefixed), il fix lo rompe. Ricerca:

```text
$ grep -rn "json\['serializable'\]\|json\[\"serializable\"\]\|\.serializable\s*=" frontend/src/ \
  | grep -v "test\|generateEcoreJson\|case ECore"
LME:4524    de.serializable = c.data.serializable;        [LEnumerator.get_duplicate — D-layer copy, not JSON]
data.ts:852 dObject.serializable = this.read(json, ECoreDataType.serializable, 'true') === 'true';   [legge da ECoreDataType key, prefixed, OK]
EcoreService.ts:454  if (enumType.serializable === false) {  [legge da L-proxy, OK]
EcoreService.ts:489  if (dt.serializable === false) {        [legge da L-proxy, OK]
```

Nessun consumer del JSON output di `generateEcoreJson_impl` che si aspetti la chiave unprefixed `serializable`. ✅

#### Razionale fix complessivo

Il fix è 1 riga, no side-effect negativo sul path attivo (EcoreService importer fissato, EcoreService exporter inalterato), positivo su path legacy (`_convertEcoreToJom_m2` e `generateEcoreJson_impl` ora coerenti con XMI key pattern).

### §3.3 Test smoke implicito

Fixture necessaria: file `.ecore` con almeno un `EEnum` che dichiari `serializable="false"`.

**Stato attuale fixture**:
- `Library.ecore` — no EEnum.
- `Graph.ecore` — no EEnum.
- `Shapes.ecore` — no EEnum.
- `DataType_test.ecore` — solo EDataType (non EEnum). Ha `serializable="false"` ma su EDataType, non Enum.
- `DataType_collision_test.ecore` — no EEnum.

**Nessuna fixture esistente** ha un EEnum, tantomeno con `serializable="false"`. Serve nuova fixture (o estensione di esistente) — vedi §4.

---

## §4 — Fixture e smoke test

### Inventario fixture `frontend/src/__tests__/fixtures/xmi-m1/`

| File | Contenuto | `defaultValueLiteral`? | `iD=`? | `serializable=`? (EEnum) |
|------|-----------|------------------------|--------|--------------------------|
| `combo_test.xmi` | M1 model — non Ecore | — | — | — |
| `DataType_collision_test.ecore` | 2 EDataType user-defined (String, Date) + 2 EClass con local refs + 1 EClass canonical regression | ❌ | ❌ | ❌ (no EEnum) |
| `DataType_test.ecore` | 2 EClass (Person/Resource) + 2 EDataType (Date, URL); URL ha `serializable="false"` (ma è EDataType non EEnum) | ❌ | ❌ | ❌ (no EEnum) |
| `Graph.ecore` | 3 EClass (Graph/Node/Edge) — basic graph metamodel | ❌ | ❌ | ❌ |
| `Library.ecore` | 5 EClass (Library/LibraryItem/Book/Magazine/Member) — basic taxonomy con eOpposite | ❌ | ❌ | ❌ |
| `modelBook.xmi` | M1 model | — | — | — |
| `polymorphism_test.xmi` | M1 model | — | — | — |
| `references_test.xmi` | M1 model | — | — | — |
| `sample-Families.xmi` | M1 model | — | — | — |
| `sample-Persons.xmi` | M1 model | — | — | — |
| `Shapes.ecore` | 4 EClass (Canvas/Shape/Circle/Square) | ❌ | ❌ | ❌ |
| `table-example.xmi` | M1 model | — | — | — |

### Gap & proposta

**Nessuna fixture esistente** esercita: `defaultValueLiteral` (EAttribute o EReference), `iD="true"`, EEnum con `serializable="false"`.

#### Proposta — opzione A: fixture singola consolidata

`Defaults_test.ecore` — un singolo file che copra:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
    xmlns:xmi="http://www.omg.org/XMI"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
    name="defaults_test"
    nsURI="http://example.org/defaults_test"
    nsPrefix="dft">
  <eClassifiers xsi:type="ecore:EClass" name="Person">
    <!-- SI3: iD su EAttribute -->
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="ssn"
        eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
        iD="true"/>
    <!-- SI2.1: defaultValueLiteral su EAttribute -->
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="name"
        eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
        defaultValueLiteral="Anonymous"/>
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="age"
        eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt"
        defaultValueLiteral="0"/>
  </eClassifiers>
  <!-- SI6-bis: EEnum con serializable="false" -->
  <eClassifiers xsi:type="ecore:EEnum" name="UnsavedStatus" serializable="false">
    <eLiterals name="ACTIVE" value="0"/>
    <eLiterals name="INACTIVE" value="1"/>
  </eClassifiers>
  <!-- EEnum con serializable default (true), come sanity check -->
  <eClassifiers xsi:type="ecore:EEnum" name="Color">
    <eLiterals name="RED" value="0"/>
    <eLiterals name="GREEN" value="1"/>
    <eLiterals name="BLUE" value="2"/>
  </eClassifiers>
</ecore:EPackage>
```

**Coverage**:
- SI2 attribute: `name` e `age` con `defaultValueLiteral`.
- SI2 reference: **NON coperto** (vedi §6 OQ-A).
- SI3: `ssn` con `iD="true"`.
- SI6-bis: `UnsavedStatus` con `serializable="false"` + `Color` come baseline default.

**Vantaggi**: una sola fixture, single source of truth per W3.

**Svantaggi**: file da ~25 righe XML, semantica composita (più item testati su uno stesso package).

#### Proposta — opzione B: 3 fixture separate

`DefaultValue_test.ecore` (SI2), `ID_test.ecore` (SI3), `EnumSerializable_test.ecore` (SI6-bis). Più granulari ma più overhead per file management.

#### Raccomandazione discovery

**Opzione A** (singola fixture `Defaults_test.ecore`) — coerente con stile W2 dove `DataType_test.ecore` raggruppa più scenari sotto un singolo package coeso. Decisione in chat.

#### Smoke test manuale 2-round

Stesso pattern W2 (vedi `claude-code-log.md` checkpoint W2):

1. **Round 1 — import**: caricare `Defaults_test.ecore` in dev server, verificare in Info panel che:
   - `Person.ssn.isID === true` (toggle ID acceso).
   - `Person.name.defaultValueLiteral === 'Anonymous'`.
   - `Person.age.defaultValueLiteral === '0'`.
   - `UnsavedStatus.serializable === false`.
   - `Color.serializable === true` (default).

2. **Round 2 — export**: ri-esportare via `EcoreService.exportToXML`, verificare diff:
   - `iD="true"` su `ssn`.
   - `defaultValueLiteral="Anonymous"` su `name`, `defaultValueLiteral="0"` su `age`.
   - `serializable="false"` su `UnsavedStatus` (assumendo SI6 exporter già attivo da W1).
   - Nessun `serializable="true"` su `Color` (default skip).

---

## §5 — Test strutturali da pianificare

### Pattern W2 (consolidato)

`frontend/src/services/export/__tests__/ecore-io.test.ts` — 39 grep-style test su sorgenti, vincolati al pattern:
- Fixture file esistenza.
- Fixture XML well-formed + contenuto chiave.
- Sorgente importer: regex su nome funzione/case/assignment.
- Sorgente exporter: regex su funzione/emit pattern.
- D-layer extensions: regex su field declaration.

### Test W3 proposti

**Da aggiungere a `ecore-io.test.ts`** in nuovi `describe()` block:

```text
describe('Ecore I/O — defaultValueLiteral (W3 SI2)', () => {
  // Fixture
  it('Defaults_test.ecore esiste ed è XML well-formed')
  it('fixture dichiara EAttribute con defaultValueLiteral non vuoto')

  // Importer
  it('ECoreAttribute.defaultValueLiteral assegnato con XMLinlineMarker')
  it('ECoreReference.defaultValueLiteral assegnato con XMLinlineMarker')
  it('parseDAttribute legge defaultValueLiteral con default ""')
  it('parseDReference legge defaultValueLiteral con default ""')

  // Exporter
  it('exportAttribute emette defaultValueLiteral truthy con escapeXml')
  it('exportReference emette defaultValueLiteral truthy con escapeXml')
})

describe('Ecore I/O — iD (W3 SI3)', () => {
  // Fixture
  it('fixture dichiara EAttribute con iD="true"')

  // Importer
  it('ECoreAttribute.iD assegnato con XMLinlineMarker')
  it('parseDAttribute legge iD via fromBoolString con default false, mappa a isID')

  // Exporter
  it('exportAttribute emette iD="true" se attr.isID truthy')
})

describe('Ecore I/O — EEnum serializable (W3 SI6-bis)', () => {
  // Fixture
  it('fixture dichiara EEnum con serializable="false"')

  // Source
  it('ECoreEnum.serializable assegnato con XMLinlineMarker (W3 fix)')
})
```

**Totale nuovi test grep**: **14** (6 SI2 + 3 SI3 + 2 SI6-bis + 3 fixture-existence). Post-W3 totale: **39 + 14 = 53**.

> Nota: la pre-stima del prompt era 6-9 nuovi test. La mia analisi suggerisce 14 per coverage simmetrica fixture+importer+exporter. **Decisione finale in chat** — riducibile a 6-9 stringendo (es. una sola fixture-existence + collassando importer/exporter per item).

### Round-trip vitest

**Non in scope W3** — limitazione Monaco/jsdom inalterata (vedi `claude-code-log.md` checkpoint W2). Smoke manuale via dev server resta il path validation.

---

## §6 — Open question pre-implementazione

### OQ-A — `defaultValueLiteral` su EReference: emettere o omettere?

**Contesto**: EMF semantica nominalmente supporta `defaultValueLiteral` su `EReference`, ma in pratica non viene mai usato (le reference puntano a istanze D, non hanno literal). Mai visto in metamodel UML2/Ecore.ecore reali.

**Opzioni**:
- (A) Wire I/O completo: importer legge, exporter emette. Costo: +2 righe (1 read + 1 emit). Garantisce simmetria total round-trip.
- (B) Solo read import, no emit: campo D viene popolato se mai presente nel sorgente, ma round-trip lossy.
- (C) Skip totale: ignorare reference, fare solo attribute. Costo: -2 righe.

**Raccomandazione**: (A) per simmetria. Costo trascurabile.

**Decisione**: chat.

### OQ-B — Ordine costanti `defaultValueLiteral` / `iD` nei blocchi `ECoreAttribute.*`

Lo stile attuale del blocco assignment (righe 1435-1446) sembra seguire l'ordine:
1. `xsitype`, `eType`, `namee` (identity)
2. `lowerbound`, `upperbound` (multiplicity)
3. `unique`, `ordered` (set semantics)
4. `derived`, `transient`, `volatile`, `changeable`, `unsettable` (flags)

Posizione consigliata:
- `defaultValueLiteral` → fine blocco, post-flags (è metadata, non flag).
- `iD` → con i flag, fra `unsettable` e (eventuale) `defaultValueLiteral`.

**Decisione**: chat. Indifferente sul piano semantico, solo stilistico.

### OQ-C — Uncomment vs. rewrite del blocco `defaultValueLiteral` in `exportAttribute`

Il blocco @ L297-299 è **già correttamente formato**. Uncomment puro è sufficiente. Forma proposta identica.

**Raccomandazione**: uncomment (zero churn, preserva intent originale).

**Decisione**: chat.

### OQ-D — Commit splitting: SI6-bis separato o unificato in W3?

SI6-bis è un bug fix indipendente da SI2/SI3 (line 1402 isolata). Può essere:
- (A) Commit separato pre-W3: `fix(ecore-io): ECoreEnum.serializable prefix XMLinlineMarker` (1 commit, 1 riga).
- (B) Incluso nel commit W3: `feat(ecore-io): W3 defaultValueLiteral + iD wire + ECoreEnum.serializable fix`.

**Pro (A)**: bisect-friendly, commit message chiaro, fix attribuibile.
**Pro (B)**: single deploy unit, allineato a workstream W3.

**Raccomandazione**: (A) commit separato — il fix tocca area diversa (constant declaration) rispetto a SI2/SI3 (parse+export wire) e il rationale è indipendente.

**Decisione**: chat.

### OQ-E — Naming nuova fixture

- Opzione A (raccomandata): `Defaults_test.ecore` (singolo file con SI2 + SI3 + SI6-bis coverage).
- Opzione B: 3 file separati (`DefaultValue_test.ecore`, `ID_test.ecore`, `EnumSerializable_test.ecore`).
- Opzione C: estendere `DataType_test.ecore` esistente.

**Raccomandazione**: A — single fixture, consistent con pattern W2.

**Decisione**: chat.

### OQ-F — Side-effect inatteso su `_convertEcoreToJom_m2` (Dummy.t2m path)

Fix SI6-bis attiva il `case ECoreEnum.serializable:` in `LModelElement.tsx:371` (`_convertEcoreToJom_m2`), che oggi è dead-code (case non matcha mai la chiave reale).

Comportamento post-fix: la funzione normalizza `'-serializable'` → `'serializable'` sull'oggetto ecore in input. Allineato all'intent della funzione (cfr. tutti gli altri case dello stesso switch).

**Risk**: il path `Dummy.t2m()` è legacy (commento "used in Dummy.t2m()"). Possibile che `Dummy.t2m()` non venga più chiamato in flow attivi. Discovery non ha tracciato se sia raggiungibile.

**Raccomandazione**: accettare la nuova attivazione come "lazy fix" (è coerente con intent). Se in chat emergono dubbi, posso fare microdiscovery dedicato sui call site di `Dummy.t2m()`.

**Decisione**: chat.

### OQ-G — Side-effect su `LEnumerator.generateEcoreJson_impl` (legacy emit)

Path legacy non in scope W3. Dopo fix SI6-bis, l'emit a `LModelElement.tsx:4510` cambia chiave da `json['serializable']` (unprefixed) a `json['-serializable']` (prefixed).

Globale `grep` ha confermato che nessun consumer JS legge `json.serializable` unprefixed. Cambio innocuo.

**Risk**: minimo. Da mettere a verbale.

**Decisione**: chat — proseguire con fix accettando il cambio come accidentally-positive (allinea il legacy path al XMI pattern).

### OQ-H — `defaultValue` (typed) come downstream fallout

`DAttribute.defaultValue: PrimitiveType[]` (LME L4129) e `DReference.defaultValue` (LME L3761) sono campi separati da `defaultValueLiteral`. In EMF, `defaultValue` è il valore typed (derived da `defaultValueLiteral` via parsing). Discovery 2026-05-17 marcava `defaultValue` come N/A in tabelle gap.

**Stato**: con W3 popoliamo `defaultValueLiteral`, ma nulla calcola `defaultValue` da esso. Se consumer downstream usano `defaultValue` (typed), restano vuoti.

**Raccomandazione**: scope creep — non in W3. Eventuale W5 o microdiscovery dedicato.

**Decisione**: chat se da menzionare in commit message o lasciar tacito.

---

## §7 — Riepilogo punti di intervento

| Item | File | Riga attuale | Tipo | Forma |
|------|------|-------------:|------|-------|
| SI2.attr.decl | `data.ts` | dopo 1312 (in class) | additive | `static defaultValueLiteral: string;` |
| SI2.ref.decl | `data.ts` | dopo 1293 (in class, prima di `eOpposite`) | additive | `static defaultValueLiteral: string;` |
| SI2.attr.assign | `data.ts` | dopo 1446 | additive | `ECoreAttribute.defaultValueLiteral = EcoreParser.XMLinlineMarker + 'defaultValueLiteral';` |
| SI2.ref.assign | `data.ts` | dopo 1431 (prima di `eOpposite`) | additive | `ECoreReference.defaultValueLiteral = EcoreParser.XMLinlineMarker + 'defaultValueLiteral';` |
| SI2.attr.read | `data.ts` | dopo 900, prima di 901 marker | additive | `dObject.defaultValueLiteral = this.read(json, ECoreAttribute.defaultValueLiteral, '');` |
| SI2.ref.read | `data.ts` | dopo 927, prima di `// BL1:` (riga 928) | additive | `dObject.defaultValueLiteral = this.read(json, ECoreReference.defaultValueLiteral, '');` |
| SI2.attr.emit | `EcoreService.ts` | 297-299 | uncomment | rimuove `/*`/`*/` |
| SI2.ref.emit | `EcoreService.ts` | dopo 346 (post-containment), prima di 348 | additive | `if (ref.defaultValueLiteral) parts.push(\`defaultValueLiteral="${this.escapeXml(ref.defaultValueLiteral)}"\`);` |
| SI3.decl | `data.ts` | in `ECoreAttribute` class | additive | `static iD: string;` |
| SI3.assign | `data.ts` | nel blocco `ECoreAttribute.*` | additive | `ECoreAttribute.iD = EcoreParser.XMLinlineMarker + 'iD';` |
| SI3.read | `data.ts` | dopo 900 (post-unsettable), insieme a SI2 | additive | `dObject.isID = U.fromBoolString(this.read(json, ECoreAttribute.iD, false), false);` |
| SI3.emit | `EcoreService.ts` | dopo 305 (post-unsettable), prima di 306 | additive | `if (attr.isID) parts.push(\`iD="true"\`);` |
| SI6b | `data.ts` | 1402 | edit | `ECoreEnum.serializable = EcoreParser.XMLinlineMarker + 'serializable'; // "false", "true"` |

**Righe production**: 12 additive + 1 edit + 3 uncomment-net = **≈16 righe nette** (con 3 righe già esistenti uncommented = net delta source 13). Vs. pre-stima 23 → ~7 righe in meno per uncomment efficiency.

**Fixture**: +1 file nuovo (`Defaults_test.ecore`, ~25 righe XML).
**Test**: +14 grep-style assertion (in `ecore-io.test.ts`, ~70 righe TS).

---

## §8 — Stop condition

Discovery completata. NESSUNA modifica a source/test/fixture. Working tree resta `git status` clean (modulo `frontend/prompts/`).

**Awaiting**: review report in chat, decisione su OQ A-H, eventuale microdiscovery aggiuntivo, poi prompt implementazione W3.

---

**Generato**: 2026-05-19
**Autore**: Discovery W3 (read-only)
**HEAD ref**: `e89b59c44`
**File toccati**: 0 source, 0 test, 0 fixture (solo MD generato).
