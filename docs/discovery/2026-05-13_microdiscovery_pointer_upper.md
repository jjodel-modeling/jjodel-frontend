# Micro-discovery — `Pointer_<UPPER>` transformation points (Bug C)

**Data**: 2026-05-13
**Tipo**: read-only Fase A
**Scope**: localizzare i punti esatti dove la pipeline Ecore produce `Pointer_ESTRING` (uppercase) per il campo `type` di `DAttribute`, causando il fallimento di `LinkAllNamesToIDs` su Persons.ecore
**Branch**: `alfonso-frontend-jjtl`
**File analizzati**: `frontend/src/api/data.ts`, `frontend/src/joiner/classes.ts`
**Working tree**: dirty (`data.ts` post-B.1, righe leggermente shiftate rispetto al discovery report del mattino)

---

## TL;DR

L'uppercase `Pointer_ESTRING` **non** viene prodotto da `parseDAttribute` né da `parseDReference` direttamente. Viene prodotto dal **mixin `DTypedElement(type)` in `classes.ts:844-902`** chiamato dal costruttore `DAttribute.new(name, eType, parentId)`. Quando il mixin riceve un XPath come `/0/String`, `Selectors.getByName2('/0/String')` ritorna null (la classe `String` non esiste ancora durante il parse), e il fallback `case 'DAttribute': type = Pointers.ESTRING;` (linea 898) clobbera il valore originale con la costante hardcoded `'Pointer_ESTRING'`.

**`parseDReference` non ha lo stesso bug**: assegna `dObject.type = this.read(...)` come field-write diretto DOPO `DReference.new()` (no args), bypassando il mixin.

Il pre-pass `rewriteXPathPointers` (data.ts:1018) viene quindi servito un valore già `Pointer_ESTRING`, che fallisce il guard `value.startsWith('/')` (linea 1026) e passa inalterato a `LinkAllNamesToIDs`, dove `replacePrimitiveMap['Pointer_ESTRING']` non matcha alcuna chiave (le chiavi sono camelCase: `EString`, `#//EString`, ecc.).

---

## Sezione 1 — `parseDAttribute`: punto di trasformazione

**Definizione**: `frontend/src/api/data.ts:819-840`.

**Citazione esatta** (data.ts:819-840):

```typescript
static parseDAttribute(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
    if (!generated) generated = [];
    if (!json) { json = {}; }
    const childs = this.getChildren(json);
    // done: old approach does not set pointedBy, i should set father and all pointers in .new() parameters
    let dObject: DAttribute = DAttribute.new(
        this.read(json, ECoreNamed.namee, 'attr_1'),
        this.read(json, ECoreAttribute.eType, AttribETypes.EString),
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
    //dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
    /// *** specific end *** ///
    return generated; }
```

**Punto di trasformazione**: linee 824-828 — `DAttribute.new(name, eType, parentId)`. Il secondo argomento (`eType`, raw XPath letto dal JSON, es. `'/0/String'` per Persons.ecore) viene passato al costruttore.

**`parseDAttribute` di per sé non chiama `.toUpperCase()` né compone `Pointer_<...>`** — il valore raw viene solo letto dal JSON e propagato. Il commento alla linea 838 (`//dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);`) mostra una vecchia versione field-write-after-construction (variante simmetrica a `parseDReference`); è stata sostituita dall'attuale variante costruttore-parametrizzato che attraversa il mixin DTypedElement.

**Trasformazione effettiva** in `frontend/src/joiner/classes.ts:844-902` (mixin `DTypedElement` chiamato dal costruttore di `DAttribute`):

```typescript
DTypedElement(type?: DTypedElement["type"]): this {
    const thiss: DTypedElement = this.thiss as any;
    thiss.allowCrossReference = false;

    // Short-circuit: if `type` is already a primitive Pointer ID (e.g. 'Pointer_EINT'),
    // trust it and assign directly. `getByName2` does by-name lookup and would fail
    // for these Pointer IDs, falling through to the hardcoded ESTRING fallback below
    // — silently downgrading every non-EString input.
    if (typeof type === 'string' && /^Pointer_E[A-Z]+$/.test(type)) {
        this.setPtr("type", type);
        return this;
    }

    let dtype = Selectors.getByName2(type) as DClassifier | null;
    switch (dtype?.className){
        default: type = undefined; break;
        case 'DClass':
            switch (thiss.className) {
                ...
                case 'DAttribute':
                default: type = dtype.id; break;
            }
            break;
        ...
    }

    if (!type) {
        switch (thiss.className) {
            ...
            case 'DAttribute':
                type = Pointers.ESTRING; break;     // <-- linea 898
        }
    }
    this.setPtr("type", type);
    return this; }
```

**Origine dell'uppercase**: linea 898 `type = Pointers.ESTRING;` dove `Pointers.ESTRING` è la costante hardcoded:

```typescript
// classes.ts:1564-1566
export class Pointers{
    public static prefix = 'Pointer';
    public static ESTRING = 'Pointer_ESTRING';
```

**Non è un `.toUpperCase()` né un template literal**: è un literal string fisso `'Pointer_ESTRING'`.

**Condizioni che attivano il fallback** (al momento del parse di Persons.ecore):
1. `type = '/0/String'` (XPath raw letto dal JSON).
2. Linea 852: il regex `/^Pointer_E[A-Z]+$/` non matcha (l'XPath non inizia con `Pointer_`).
3. Linea 857: `Selectors.getByName2('/0/String')` cerca per nome; nessuna classe registrata si chiama `/0/String`, quindi ritorna null.
4. Linea 858 switch su `dtype?.className`: `default: type = undefined; break;` — `type` viene reso `undefined`.
5. Linee 884-899: `if (!type) { ... case 'DAttribute': type = Pointers.ESTRING; ... }`. Il fallback hardcoded sovrascrive l'XPath originale.
6. Linea 901: `this.setPtr("type", type)` scrive `'Pointer_ESTRING'` su `dObject.type`.

**Effetto**: l'XPath `/0/String` viene perso PRIMA che `rewriteXPathPointers` possa intercettarlo. Il `dObject.type` salvato è `'Pointer_ESTRING'`, non `'/0/String'`.

---

## Sezione 2 — `parseDReference`: confronto con `parseDAttribute`

**Definizione**: `frontend/src/api/data.ts:842-860`.

**Citazione esatta** (data.ts:842-860):

```typescript
static parseDReference(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
    if (!generated) generated = [];
    if (!json) { json = {}; }
    const childs = this.getChildren(json);
    let dObject: DReference = DReference.new();
    generated.push(dObject); dObject.father = parent.id;
    if (parent) parent.references.push(dObject.id);
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
    /// *** specific end *** ///
    return generated; }
```

**Differenza chiave rispetto a `parseDAttribute`**:

| Passo | `parseDAttribute` | `parseDReference` |
|---|---|---|
| Costruzione | `DAttribute.new(name, eType, parentId)` (3 args) — eType passa attraverso `DTypedElement` mixin | `DReference.new()` (zero args) — mixin riceve `type = undefined` |
| Behaviour mixin con XPath | `Selectors.getByName2('/0/String')` → null → fallback `Pointers.ESTRING` | mixin chiamato con `undefined` → `dtype?.className` undefined → `type = undefined` → fallback dipende dalla classe |
| Assegnazione di `type` | Definitiva al costruttore | Sovrascritta dopo (linea 858: `dObject.type = this.read(json, ECoreReference.eType, ...)`) |
| Valore salvato per XPath `/0/String` | `'Pointer_ESTRING'` (uppercase, hardcoded) | `'/0/String'` (XPath raw, intatto) |

**Nessuna trasformazione `Pointer_<UPPER>` in `parseDReference`**. Il campo `dObject.type` finisce nella pipeline come XPath raw, dove `rewriteXPathPointers` (data.ts:1018) può rewrittarlo in `'EString'` (camelCase) per primitive packages o in `'#//Name'` per normal packages.

**Nota collaterale**: `parseDReference` chiama `DReference.new()` con zero argomenti. Per il mixin `DTypedElement(type)` con `type = undefined`:
- Linea 852: regex su `undefined` → false.
- Linea 857: `Selectors.getByName2(undefined)` → presumibilmente null.
- Linea 884-889: `case 'DReference': type = this.fatherPtr as Pointer<DClass> || undefined;` — fallback al pointer del padre.
- Linea 901: `setPtr("type", fatherPtr)` — type iniziale è il padre (DClass).
- Linea 858 di data.ts: `dObject.type = this.read(...)` — **questa scrittura supera il setter del mixin** sovrascrivendo con l'XPath raw.

Il pattern è asimmetrico per design: DAttribute usa il pattern parametrizzato `.new(...)` per non avere doppia scrittura; DReference usa pattern field-write-after-construction.

**Adiacenti da segnalare** (path code simmetrici a `parseDReference`, non a `parseDAttribute`):

- `parseDParameter` (data.ts:862-880), linea 876: `dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);` — field-write diretto dopo `DParameter.new()` (no args alla linea 866).
- `parseDOperation` (data.ts:882-906), linea 897: `dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);` — field-write diretto dopo `DOperation.new()` (no args alla linea 886).

Entrambi questi parser ricevono lo stesso trattamento di `parseDReference` (XPath raw sopravvive fino a `rewriteXPathPointers`). Solo `parseDAttribute` è atipico.

---

## Sezione 3 — `replacePrimitiveMap`: struttura e popolazione

**Definizione**: `frontend/src/api/data.ts:228` (variabile locale di `LinkAllNamesToIDs`):

```typescript
let replacePrimitiveMap: Dictionary<string, DClassifier> = {};
```

**Tipo**: dizionario `string → DClassifier`. Locale alla funzione, non esposta come state.

**Popolazione**: due loop sequenziali a `data.ts:236-261`.

### Seed iniziale (linea 230)

```typescript
let d_Estring: DClassifier = Selectors.getAllPrimitiveTypes()[1];
replacePrimitiveMap[AttribETypes.EString] = d_Estring;
```

Dove `AttribETypes.EString` è una chiave enum (camelCase, come tutti gli enum membri).

### Loop primitivi EDataType (data.ts:236-248)

```typescript
const typeprefix = "#//";
for (let shortkey in ShortAttribETypes) {
    if (shortkey === ShortAttribETypes.EVoid) continue;
    let shortetype: ShortAttribETypes = (ShortAttribETypes as GObject)[shortkey];
    let longetype: AttribETypes = toLongEType(shortetype);
    let dClassType: DClassifier = Selectors.getPrimitiveType(shortetype, state);
    Log.exDev(!dClassType, "missing primitive type: " + shortkey, {shortkey, shortetype, longetype, dClassType, state});
    // the correct one
    replacePrimitiveMap[typeprefix + shortkey] = dClassType; // like "#//EChar"
    // fallbacks for missing type instead of crash
    if (!replacePrimitiveMap[shortkey]) replacePrimitiveMap[shortkey] = dClassType;
    if (!replacePrimitiveMap[shortetype]) replacePrimitiveMap[shortetype] = dClassType;
    if (!replacePrimitiveMap[longetype]) replacePrimitiveMap[longetype] = dClassType;
}
```

**Chiavi popolate per ciascuna primitiva EDataType** (caso `shortkey = 'EString'`):
1. `'#//EString'` (chiave `typeprefix + shortkey`)
2. `'EString'` (chiave `shortkey` — camelCase, dal nome del membro enum)
3. `'EString'` (chiave `shortetype` — il valore dell'enum, in genere identico al membro per `ShortAttribETypes`)
4. `'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString'` (chiave `longetype`, dal mapping `toLongEType`)

**Casing**: tutte camelCase con prefisso `E` (`EString`, `EInt`, `EBoolean`, ...). **Nessuna variante uppercase** come `ESTRING` o `Pointer_ESTRING`.

### Loop EClasses native (data.ts:249-261)

```typescript
for (let shortkey in ShortDefaultEClasses) {
    let shortetype: ShortDefaultEClasses = (ShortDefaultEClasses as GObject)[shortkey];
    let longetype: DefaultEClasses = toLongEClass(shortetype);
    let dClassType: DClassifier = Selectors.getDefaultEcoreClass(shortetype, state);
    Log.exDev(!dClassType, "missing ecore native class: " + shortkey, {shortkey, shortetype, longetype, dClassType, state});

    // the correct one
    replacePrimitiveMap[longetype] = dClassType;
    // fallbacks for missing type instead of crash
    if (!replacePrimitiveMap[shortkey]) replacePrimitiveMap[shortkey] = dClassType;
    if (!replacePrimitiveMap[shortetype]) replacePrimitiveMap[shortetype] = dClassType;
    if (!replacePrimitiveMap[longetype]) replacePrimitiveMap[typeprefix + shortkey] = dClassType; // like "#//EObject"
}
```

Stessa shape: chiavi camelCase (`EClass`, `EObject`, ecc.) + varianti con `#//` prefix + longetype.

### Conclusioni

- **Tutte le chiavi sono in camelCase con prefisso `E`** (es. `EString`, non `ESTRING`).
- **Nessuna chiave inizia con `Pointer_`**.
- **Il lookup `replacePrimitiveMap['Pointer_ESTRING']` è destinato a fallire** — non c'è alcuna entry con questa shape, neppure tramite fallback.
- **Valori**: oggetti `DClassifier` (i Selectors per primitive types e default ecore classes), non stringhe né pointer.

---

## Sezione 4 — `LinkAllNamesToIDs`: punto di consumo

**Definizione**: `frontend/src/api/data.ts:220-330`.

**Loop di lookup**: data.ts:290-330.

**Citazione esatta del lookup** (data.ts:303-327):

```typescript
for (let value of values) {
    if (!value) continue;
    // console.log("fixalltypes", {replacekey, dobj, value, values});
    let target: DModelElement = replacePrimitiveMap[value];
    if (!target) target = nameMap[value];
    if (!target && value.indexOf("ecore:EDataType") === 0) {
        Log.ww('found unknown EDataType "' + value + '", remapping it to string');
        target = replacePrimitiveMap[AttribETypes.EString];
    }
    /*
    if (!target && value === "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject"){
        Log.ww('found type Object is not supported yet in metamodel, remapped to EString');
        target = replacePrimitiveMap[AttribETypes.EString];
    }*/
    // if (Pointers.isPointer(value)) { target = value;  if it happen to be a pointer it's a mistake in parser }
    // (value.indexOf("#//") == 0) && console.log("attempt to replace primitive type to his id", {target, dobj, replacekey, value, replacePrimitiveMap, nameMap, idMap, parsedElements});

    if (replacekey === "extends") {
        if (!target) continue;
        Log.ex(target.className !== DClass.cname, "found a class attempting to extend an object that is not a class", {target, dobj, replacePrimitiveMap, nameMap, idMap});
        // (target as DClass).extendedBy.push((dobj as DClass).id);
    }
    Log.ex(!target, "LinkAllNames() can't find type target:", {value, nameMap, replacePrimitiveMap, dobj, replacekey});
    if (isArray) dobj[replacekey].push(target.id);
    else dobj[replacekey] = target.id;
}
```

**Linea critica**: 306 `let target: DModelElement = replacePrimitiveMap[value];`.

**Conferma empirica del fallimento per Persons.ecore**:

- `value = 'Pointer_ESTRING'` (sovrascritto da `DTypedElement` mixin durante `parseDAttribute`).
- `replacePrimitiveMap['Pointer_ESTRING']` → `undefined` (le chiavi sono camelCase).
- Linea 307 fallback: `nameMap['Pointer_ESTRING']` → `undefined` (nameMap contiene FQN del modello, prefissati da `#//`, non `Pointer_*`).
- Linea 308 fallback EDataType: `'Pointer_ESTRING'.indexOf("ecore:EDataType")` → -1, condizione falsa, fallback non attivato.
- Linea 325 `Log.ex(!target, ...)`: throw — il messaggio esatto è quello osservato runtime nella sessione 2026-05-13:
  ```
  [Error]LinkAllNames() can't find type target:
  {value: 'Pointer_ESTRING', nameMap: {…}, replacePrimitiveMap: {…}, dobj: DAttribute2, replacekey: 'type'}
  ```
- Il commento commentato alla linea 317 (`if (Pointers.isPointer(value)) { target = value; ...`) suggerisce che il caso fosse stato anticipato a livello di intent ma non implementato: "if it happen to be a pointer it's a mistake in parser".

---

## Sezione 5 — Conclusioni operative

### Numero esatto di punti di codice da toccare

**Per fixare Bug C il numero minimo è 1 punto**, ma con scelte di strategia diverse:

#### Strategia A (raccomandata, chirurgica) — Allineare `parseDAttribute` a `parseDReference`

1 punto da modificare: `frontend/src/api/data.ts:824-828` (`parseDAttribute`).

Sostituire la costruzione parametrizzata `DAttribute.new(name, eType, parentId)` con la stessa shape di `parseDReference`/`parseDParameter`/`parseDOperation`:
- `DAttribute.new(name, undefined, parentId)` (oppure due-arg form se disponibile)
- Aggiungere `dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);` come field-write diretto dopo `__fullname` assignment.

Effetto: l'XPath `/0/String` sopravvive fino a `rewriteXPathPointers`, che lo rewritta in `'EString'` per primitive packages (data.ts:1031-1037) e quindi `LinkAllNamesToIDs` trova `replacePrimitiveMap['EString']`.

**Path code da verificare per non rompere casi che già funzionano**:
- Single-package Ecore: `eType` letto è `'ecore:EDataType ...'` o `'#//ClassName'`. Il field-write diretto preserva questo formato; `LinkAllNamesToIDs` linea 306-310 lo gestisce già (via `replacePrimitiveMap` per longetype o via `nameMap` per `#//` references).
- DAttribute senza eType (manca nel JSON): `this.read(json, ECoreAttribute.eType, AttribETypes.EString)` ritorna `'EString'` (default). `LinkAllNamesToIDs` matcha `replacePrimitiveMap['EString']`. OK.
- DAttribute con `eType = 'ecore:EDataType ...'`: come oggi, fa eccezione al linea 308 e fallback a `EString`. OK.

**Rischio**: il commento alla riga 838 di `parseDAttribute` (`//dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);`) suggerisce che questo pattern era già stato usato in passato e poi rimosso. Investigare il motivo (git blame) prima di applicare il fix per evitare di reintrodurre un bug precedentemente fissato.

#### Strategia B (più invasiva, intercetta il mixin) — Far passare l'XPath dal `DTypedElement`

1 punto da modificare: `frontend/src/joiner/classes.ts:844-902`.

Estendere lo short-circuit alla riga 852 per riconoscere anche XPath (`/^\/\d+\/`) e propagarli inalterati via `setPtr("type", type)` invece di passare attraverso `getByName2` + fallback.

**Path code da verificare per non rompere casi che già funzionano**:
- Tutti i call site di `DTypedElement` (DAttribute, DOperation, DParameter, DReference) — il cambio ha effetto globale. Da verificare che nessun call site M1 (durante creazione utente, JjScript, dummy templates) passi XPath senza intenzione.
- Pipeline JjScript `create.ts:412` usa `'Pointer_' + shortType.toUpperCase()` come Pointer ID già valido — non passa XPath, OK.
- `Dummy.ts:161` setta `lObj.type = 'Pointer_ESTRING'` direttamente sul proxy — bypassa il mixin, OK.

**Rischio**: lascia in piedi l'asimmetria DAttribute vs DReference/DParameter/DOperation a livello di parser. Maschera la divergenza invece di risolverla. Sconsigliato come fix principale; può essere una difesa secondaria.

#### Strategia C (cosmetica, copre i sintomi) — Estendere `replacePrimitiveMap`

1 punto da modificare: `frontend/src/api/data.ts:248` (dopo il loop primitivi).

Aggiungere alias uppercase + `Pointer_*` durante la popolazione di `replacePrimitiveMap`, es.:
```typescript
replacePrimitiveMap['Pointer_' + shortkey.toUpperCase()] = dClassType;
```

**Rischio**: non risolve la causa root (la perdita dell'XPath in `DAttribute.new`), maschera il sintomo. Se altre path code dipendono dal fatto che `dObject.type` sia una stringa-nome (non un Pointer ID) — es. il pre-pass `rewriteXPathPointers` o serializers Ecore export — la fix C produce dati inconsistenti tra DAttribute (Pointer ID) e DReference (XPath rewritten a nome). Sconsigliato.

### Strategia raccomandata in una frase

**Strategia A**: simmetrizzare `parseDAttribute` a `parseDReference`/`parseDParameter`/`parseDOperation` spostando la lettura di `eType` dal costruttore al field-write dopo costruzione, così l'XPath raw sopravvive fino al pre-pass `rewriteXPathPointers` che lo risolve correttamente.

### Path code adiacenti da verificare prima del fix

1. **Git blame su `parseDAttribute:824-828`**: investigare quando e perché il pattern field-write (linea 838 commentata) è stato sostituito dal pattern parametrizzato. Potrebbe esserci un'intent storico (es. supportare il caso dove name + type + parent vanno creati atomicamente per pointedBy correttezza).
2. **`DAttribute.new()` signature**: verificare se il 2° argomento (eType) può essere `undefined` o se forza una validation che richiederebbe una variante a 2-arg.
3. **Test JjOM esistenti per DAttribute**: cercare unit/integration tests che usano `DAttribute.new(name, eType, parent)` in modo dipendente dal valore di `eType` all'atto di costruzione (es. validazione di tipo coerente con padre prima di `LinkAllNames`).
4. **`fixObjectPointers` (data.ts:191)** e `fixNamingConflicts` (data.ts:176): verificare che non assumano `dObject.type` essere un Pointer al momento della loro esecuzione (avvengono dopo `LinkAllNamesToIDs`, quindi atteso che `type` sia un Pointer; ma se Strategia A è applicata, il flow tra parse e LinkAllNames è cambiato — la sequenza temporale tra costruzione DAttribute e LinkAllNames resta invariata, quindi atteso safe).
5. **Single-package Ecore di regression** (es. `library.ecore` storico o altri test fixture): eseguire un import smoke test post-fix per confermare nessuna regressione su path code che oggi funziona.
