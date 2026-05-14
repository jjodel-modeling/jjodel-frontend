# Micro-discovery Bug G — `childrenNames.indexOf is not a function` su Families.ecore

**Data**: 2026-05-13
**Tipo**: read-only diagnostic (Fase A)
**Esito**: ✅ root cause identificata con catena causale completa. **Bug G è una regressione del fix-D combinata con un bug parser pre-esistente** (`extends = tmps.split(' ')` produce `['']` per classi senza eSuperTypes). Il proxy `TargetableProxyHandler` (proxy.ts:284) swallowa l'eccezione interna trasformandola in valore di ritorno, mascherando il vero errore e producendo il messaggio fuorviante `childrenNames.indexOf is not a function`.

---

## 1. Localizzazione hits

```bash
$ grep -rn "childrenNames" /Users/alfonso/jjodel/frontend/src/
```

**Hit unico**:
- `frontend/src/joiner/classes.ts:1432-1433` (declaration + `.indexOf` call site).

```typescript
const childrenNames: (string)[] = lfather.childNames; // lfather.children.map(c => (c as LNamedElement)?.name);
return U.increaseEndingNumber(startingPrefix + '0', false, false, (newname) => childrenNames.indexOf(newname) >= 0);
```

Variabile locale dentro `DPointerTargetable.defaultname` static method (classes.ts:1421-1440). Source: `lfather.childNames` (computed L-property).

### Source property `childNames`

```bash
$ grep -rn "childNames" /Users/alfonso/jjodel/frontend/src/
```

**Hit di interesse**:

| File:riga | Cos'è |
|---|---|
| `LModelElement.tsx:451-453` | Base declaration su `LModelElement`: `childNames!: string[];` + `get_childNames` che usa `get_children` |
| `LModelElement.tsx:2831` | **Override su LClass**: `get_childNames(c): string[] { return this.get_allChildren(c).map(c => c.name).filter(c=>!!c) as string[]; }` |
| `LModelElement.tsx:5847, 5934, 6676, 6858` | Vari consumer (M1 instance building, ecore generation) — non rilevanti per il bug |

**Per il flusso Families**, `lfather` è una **LClass** (Family/Member), quindi viene usata la override a riga 2831.

---

## 2. Analisi del call site

`DPointerTargetable.defaultname` (classes.ts:1421-1440):

```typescript
static defaultname<L extends LModelElement = LModelElement>(
    startingPrefix: string | ((meta:L)=>string),
    father?: Pointer | DPointerTargetable | ((a:string)=>boolean),
    metaptr?: Pointer | null
): string {
    let lfather: LModelElement;
    if (father) {
        if (typeof father === "string" || (father as any).className) { // Pointer or D
            lfather = LPointerTargetable.wrap(father as DModelElement) as LModelElement;
            if (!lfather) return (typeof startingPrefix === "string" ? startingPrefix : "unnamed_elem");
            if (typeof startingPrefix !== "string") {
                let meta = LPointerTargetable.from(metaptr as Pointer);
                startingPrefix = startingPrefix(meta as L);
            }
            const childrenNames: (string)[] = lfather.childNames;          // <-- riga 1432
            return U.increaseEndingNumber(startingPrefix + '0', false, false, (newname) => childrenNames.indexOf(newname) >= 0);  // <-- riga 1433
        }
        else if (typeof father === 'function') { ... }
    }
    return startingPrefix + "1";
}
```

| Aspetto | Valore atteso |
|---|---|
| **Tipo dichiarato** | `(string)[]` |
| **Source** | `lfather.childNames` (LClass override invoca `get_allChildren().map(c=>c.name).filter(c=>!!c)`) |
| **Uso** | `.indexOf(newname) >= 0` come predicato per `U.increaseEndingNumber` (genera nome univoco) |

---

## 3. Call site raggiunto dal flusso Families

### Catena di chiamate

```
1. EcoreParser.parse(json, true, 'Families', true)              data.ts:164
2. EcoreParser.parseM2Model(json, 'Families')                   data.ts:393
3. EcoreParser.parsePackageBody(dModel, pkg_json, generated)    data.ts:662   (multi-package branch)
4. EcoreParser.parseDClass(dPackage, 'Family' json, generated)  data.ts:686 → 729
5. dObject_Family = DClass.new("Family", ..., dPackage.id)      data.ts:732
6. (dObject_Family.attributes=[], references=[], operations=[], extends inherited from class field default)
7. dObject_Family.extends = tmps.split(' ')                      data.ts:758   ← KEY ASSIGNMENT
8. for (let child of features) ...                               data.ts:763
9. EcoreParser.parseDReference(dObject_Family, refJson, ...)    data.ts:770 → 848
10. DReference.new(undefined, undefined, dObject_Family.id)     data.ts:852   ← post-fix-D
11. (inside DReference.new) defaultname("ref_", dObject_Family.id)   LModelElement.tsx:3771
12. (inside defaultname) lfather = LPointerTargetable.wrap(dObject_Family.id)   classes.ts:1426
13. (inside defaultname) const childrenNames = lfather.childNames    classes.ts:1432   ← ENTRY EXPLOSION
14. (proxy get) → get_childNames(c) → get_allChildren(c) → get_inheritedChildren(c)
15. → get_inheritedAttributes(c) → get_extendsChain(c) → get_superclasses(c)
16. (get_superclasses) queue = get_extends(c) = [undefined]   (LModelElement.tsx:3596)
17. for-loop: elem = queue[0] = undefined; visited[elem.id]   ← THROWS "Cannot read properties of undefined (reading 'id')"
18. (proxy.ts:284) TargetableProxyHandler.get catches the error → returns Error object as `lfather.childNames` value
19. childrenNames = <Error: Cannot read properties of undefined (reading 'id')>
20. childrenNames.indexOf(newname) → TypeError "indexOf is not a function"   ← USER VISIBLE
21. EcoreService.importFromXML catch → result.errors = ["Import failed: childrenNames.indexOf is not a function"]
22. ProjectEditor.handleEcoreFileChange throw new Error(result.errors.join(','))   ProjectEditor.tsx:794
```

### Step 7 — KEY ASSIGNMENT

`data.ts:758`:

```typescript
let tmps: string = this.read(json, ECoreClass.eSuperTypes, '');
dObject.extends = tmps.split(' ');
```

Per **Family** (no `eSuperTypes` nel JSON): `tmps = ''` → `''.split(' ')` = `['']` (array con UN elemento, stringa vuota).

`dObject_Family.extends = ['']`.

### Step 12-13 — Proxy wrap + property access

`lfather` è una `LClass` Proxy attorno a `dObject_Family` (che esiste in `DPointerTargetable.pendingCreation[id]` perché `Constructors.paused = true`).

`lfather.childNames` invoca la override di LClass (LModelElement.tsx:2831).

### Step 14-15 — get_allChildren chain

```typescript
// LModelElement.tsx:2993
protected get_allChildren(context: Context): this['allChildren'] {
    return U.arrayMergeInPlace<any>(this.get_ownChildren(context), this.get_inheritedChildren(context));
}

// LModelElement.tsx:2979
protected get_inheritedChildren(context: Context): this['inheritedChildren'] {
    return U.arrayMergeInPlace<any>(this.get_inheritedAttributes(context), this.get_inheritedReferences(context), this.get_inheritedOperations(context));
}

// LModelElement.tsx:2970
protected get_inheritedAttributes(context: Context): this['inheritedAttributes'] {
    return this.get_extendsChain(context).flatMap((superClass) => superClass.ownAttributes);
}

// LModelElement.tsx:3612
private get_extendsChain(c: Context): this['extendsChain'] { return this.get_superclasses(c); }
```

### Step 16-17 — get_superclasses choke

`LModelElement.tsx:3594-3607`:

```typescript
private get_superclasses(c: Context, plusThis: boolean = false, initialExtends?: Pointer<DClass>[]): LClass[] {
    const visited: Dictionary<Pointer, LClass> = {};
    let queue: LClass[] = (initialExtends ? (L.fromArr(initialExtends) as LClass[]).filter((e)=>!!e) : this.get_extends(c));
    if (plusThis) queue.push(c.proxyObject);

    const ret: LClass[] = [];
    for (let i = 0; i < queue.length; i++) {
        let elem: LClass = queue[i];          // <-- elem = undefined per Family
        if (visited[elem.id]) continue;       // <-- TypeError: Cannot read properties of undefined (reading 'id')
        visited[elem.id] = elem;
        ret.push(elem);
        queue.push(...elem.extends);
    }
    return ret;
}
```

`this.get_extends(c)` (LModelElement.tsx:3301-3305):

```typescript
protected get_extends(context: Context): this["extends"] {
    return context.data.extends.map((pointer) => {
        return LPointerTargetable.from(pointer)
    });
}
```

Con `context.data.extends = ['']`: map ritorna `[LPointerTargetable.from('')]`. `from('')` (vedi classes.ts:1486-1487):

```typescript
return (DPointerTargetable.pendingCreation[ptr as string] || s.idlookup[ptr as string]) as any;
```

`pendingCreation[''] === undefined`, `s.idlookup[''] === undefined` → ritorna `undefined`.

Quindi `get_extends(c) = [undefined]`. Queue ha 1 elemento undefined. Il for-loop tenta `elem.id` su undefined → TypeError.

### Step 18 — Proxy swallow

`proxy.ts:276-293` (`TargetableProxyHandler.get`):

```typescript
public get(targetObj: ME, propKey: string | symbol, proxyitself: Proxyfied<ME>): any {
    if (typeof propKey === 'symbol') return Reflect.get(targetObj, propKey, proxyitself);
    let ret;
    let isError = false;
    try { ret = this.get0(targetObj, propKey, proxyitself); } catch(e) {
        ret = e;                  // <-- caught Error becomes the return value
        isError = true;
    }
    return ret;
}
```

`get0` per `childNames` ha invocato `get_childNames(c)` che throw'd in step 17. Il `catch(e)` setta `ret = e` (l'Error object). `get` ritorna l'Error.

Quindi `lfather.childNames` = `<Error("Cannot read properties of undefined (reading 'id')")>` (NON una string[]).

### Step 19-20 — Final crash

```typescript
const childrenNames: (string)[] = lfather.childNames;   // = <Error object>
return U.increaseEndingNumber(..., (newname) => childrenNames.indexOf(newname) >= 0);
//                                                       ^^ Error objects don't have .indexOf
```

`Error.indexOf` is undefined. `undefined()` → TypeError "childrenNames.indexOf is not a function". Questo è il **vero** errore visibile, ma con il messaggio del tutto fuorviante rispetto alla root cause.

---

## 4. Diagnosi type mismatch

Tra le ipotesi H1-H4 proposte dal prompt, la corretta è una **combinazione**:

| Ipotesi | Verdetto |
|---|---|
| **H1** (`childrenNames` popolato da `dObj.children`-like, branch nuovo) | ❌ no — è popolato da `lfather.childNames` getter, sempre lo stesso codepath |
| **H2** (mappa Pointer→Name shape diversa) | ❌ no |
| **H3** (refactor B.1 ha cambiato inizializzazione childrenNames) | ❌ no — `defaultname` e `parseDClass.extends` invariati pre/post B.1 |
| **H4** (`childrenNames` è property DObject mal inizializzata) | ⚠️ parzialmente — l'init mal-fatta è di `dObject.extends`, NON di `childrenNames` direttamente |

### Diagnosi reale (ipotesi H5, non listata nel prompt)

`childrenNames` riceve un **Error object** perché il **proxy handler swallowa silenziosamente** un TypeError interno e lo ritorna come valore della property. Catena causale:

1. **Pre-existing parser bug** (`data.ts:758`): `dObject.extends = tmps.split(' ')` produce `['']` per classi senza eSuperTypes.
2. **Fix-D regression** (`data.ts:852`): `DReference.new(undefined, ..., parent.id)` ora chiama `defaultname()` con `father` valido (pre-fix-D era undefined → early return).
3. `defaultname` accede a `lfather.childNames` (LClass override).
4. `get_childNames` → `get_allChildren` → `get_inheritedChildren` → ... → `get_superclasses` che fa walk su `extends=['']`.
5. `get_extends(c)` ritorna `[undefined]` (perché `LPointerTargetable.from('')` = undefined).
6. `get_superclasses` for-loop tenta `undefined.id` → TypeError.
7. **Proxy swallow**: `TargetableProxyHandler.get` (proxy.ts:284) cattura il TypeError e ritorna l'Error object come valore.
8. Caller vede `childrenNames = Error` invece di string[] → `.indexOf` fail con messaggio fuorviante.

### Evidenza nel codice

- `data.ts:758`: `tmps.split(' ')` su stringa vuota → `['']`. Verificato direttamente.
- `LModelElement.tsx:3301-3305` (`get_extends`): mappa `extends` via `LPointerTargetable.from(pointer)` senza filtro su valori invalidi/empty.
- `LModelElement.tsx:3594-3607` (`get_superclasses`): no defensive filter su `queue` initializzata da `get_extends`.
- `classes.ts:1486-1487` (`DPointerTargetable.from`): ritorna `undefined` per ptr=`''`.
- `proxy.ts:276-293` (`TargetableProxyHandler.get`): swallow esplicito tramite `ret = e` nel catch.

---

## 5. Differenza Persons vs Families

### Persons.ecore

Classi: Person (1 EAttribute "fullName", 0 EReference, 0 eSuperTypes), Male (0 features, eSuperTypes="#//Person"), Female (0 features, eSuperTypes="#//Person").

| Classe | extends post-parser | parseDReference call? | defaultname invoked? |
|---|---|---|---|
| Person | `['']` (eSuperTypes vuoto) | ❌ no (0 references) | ❌ no |
| Male | `['#//Person']` | ❌ no | ❌ no |
| Female | `['#//Person']` | ❌ no | ❌ no |

**Persons NON triggera mai `parseDReference`**, quindi non c'è chiamata a `DReference.new()` → `defaultname()` → `lfather.childNames` → crash.

Per `parseDAttribute` (data.ts:825-828 post-fix-C): `DAttribute.new(name, undefined, parent.id)` con `name` letto da JSON (`"fullName"`) → `name` truthy → `defaultname` NON chiamato. No crash.

Il bug `extends=['']` è presente anche per Person, ma latent perché nessun consumer accede a `lfather.childNames` durante il parsing di Person.

### Families.ecore

Classi: Family (0 EAttribute, 4 EReference, 0 eSuperTypes), Member (0 EAttribute, 4 EReference, 0 eSuperTypes).

| Classe | extends post-parser | parseDReference call? | defaultname invoked? | Crash |
|---|---|---|---|---|
| Family | `['']` | ✅ sì (4 references) | ✅ sì (`DReference.new(undefined, ..., dObject_Family.id)`) | 🔥 crash |
| Member | `['']` | ✅ sì (4 references) | (mai raggiunto causa crash precedente) | n/a |

**La prima EReference di Family** (`father` o `daughters`, dipende dall'ordine in XML) triggera il crash.

### Sintesi

- **Bug parser** (`extends=['']`): presente in entrambi i file, pre-esistente al refactor B.1.
- **Bug fix-D regression** (`DReference.new(undefined, ..., parent.id)`): introdotto in questa serie di fix, esercita un codepath (`defaultname` con father valido) mai testato prima per parseDReference.
- **Bug proxy swallow** (proxy.ts:284): pre-esistente, maschera il vero errore.

Persons non innesca il fix-D regression perché non ha references. Pre-fix-D, anche Families non sarebbe arrivato qui (parseDReference passava `father=undefined` al Constructor, `defaultname` faceva early return su `if (!father)`, niente accesso a `childNames`).

---

## 6. Strategy di fix (NON applicate)

### Opzione A (raccomandata) — Fix narrow su `parseDClass`, allinea con assenza di eSuperTypes

**File**: `frontend/src/api/data.ts`, riga 758, in `parseDClass`.

**Diff**:

```diff
@@ -755,7 +755,7 @@
         dObject.interface = this.read(json, ECoreClass.interface, 'false') === 'true';
         dObject.abstract = this.read(json, ECoreClass.abstract, 'false') === 'true';
         let tmps: string = this.read(json, ECoreClass.eSuperTypes, '');
-        dObject.extends = tmps.split(' ');
+        dObject.extends = tmps ? tmps.split(' ') : [];
         const features: Json[] = this.getChildren(json);
         const functions: Json[] = this.getChildren(json, false, true);
```

**Razionale**:
- `tmps.split(' ')` su `tmps=''` produce `['']` (array con stringa vuota), che è semanticamente errato: "nessun supertipo" deve essere array vuoto.
- Il guard `tmps ? ... : []` rende `extends=[]` quando non ci sono eSuperTypes, conforme alle aspettative del walker `get_superclasses` e di tutti i consumer di `extends`.
- Single-line change, semantico, niente effetti collaterali su classi con eSuperTypes (la branch `tmps.split(' ')` resta identica per quei casi).

**Effetti**:
- `extends=[]` → `get_extends(c)=[]` → `get_superclasses` queue vuoto → ret vuoto → `get_inheritedAttributes=[]` → ... → `get_allChildren=[].concat([])=[]` → `childNames=[]`.
- `defaultname` riceve `childrenNames=[]` (array vuoto). `[].indexOf(...) === -1` → predicato sempre false → `U.increaseEndingNumber` ritorna `"ref_0"` (il default).
- Niente crash.

**Risk**:
- Effetti su altre classi parseDClass: solo quando `tmps === ''` (no eSuperTypes). Per Persons.Male/Female con eSuperTypes valid, niente cambia.
- Effetti sui rewriter (`rewriteXPathPointers`, `LinkAllNamesToIDs`): non dovrebbe esserci impatto — un array vuoto è banalmente skippato da qualsiasi loop di rewrite.
- Effetti su altri parser che producono `extends`: solo `parseDClass` ha questo pattern (verificato con grep).

### Opzione B (defensive, complementare) — Filter undefined da `get_superclasses` queue

**File**: `frontend/src/model/logicWrapper/LModelElement.tsx`, riga 3596.

**Diff**:

```diff
@@ -3593,7 +3593,7 @@
     private get_superclasses(c: Context, plusThis: boolean = false, initialExtends?: Pointer<DClass>[]): LClass[] {
         const visited: Dictionary<Pointer, LClass> = {};
-        let queue: LClass[] = (initialExtends ? (L.fromArr(initialExtends) as LClass[]).filter((e)=>!!e) : this.get_extends(c));
+        let queue: LClass[] = (initialExtends ? (L.fromArr(initialExtends) as LClass[]).filter((e)=>!!e) : this.get_extends(c).filter((e)=>!!e));
         if (plusThis) queue.push(c.proxyObject);
```

**Razionale**:
- `initialExtends` path già filtra `!!e`. Il branch `this.get_extends(c)` no — asymmetric design.
- Filtra elementi null/undefined dalla queue, evitando il `elem.id` crash su pointer non risolvibili.
- Difensivo: protegge contro qualunque scenario futuro (non solo parser bug) in cui `extends` contenga pointer invalidi (es. references rotti post-delete, file corrotti, ecc.).

**Risk**:
- Compatibilità con altri caller di `get_superclasses` (chiamato anche internamente da `get_inheritedAttributes/References/Operations`): tutti beneficeranno del filtro senza regressioni.
- Performance: filtro O(N) trascurabile per array tipici (< 10 elementi).

### Opzione C (allineamento pattern, complementare) — Pass name a DReference.new come per parseDAttribute

**File**: `frontend/src/api/data.ts`, righe 848-856, in `parseDReference`.

**Diff**:

```diff
@@ -848,9 +848,9 @@
     static parseDReference(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
         if (!generated) generated = [];
         if (!json) { json = {}; }
         const childs = this.getChildren(json);
-        let dObject: DReference = DReference.new(undefined, undefined, parent.id);
+        let name: string = this.read(json, ECorePackage.namee, 'Ref_1');
+        let dObject: DReference = DReference.new(name, undefined, parent.id);
         generated.push(dObject);// dObject.father = parent.id;
         // if (parent) parent.references.push(dObject.id);
-        dObject.name = this.read(json, ECorePackage.namee, 'Ref_1');
+        // dObject.name = ...   already set via Constructor
         (dObject as GObject).__fullname = fullnamePrefix + dObject.name;
```

**Razionale**:
- Allinea `parseDReference` al pattern di `parseDAttribute` post-fix-C: tutti e tre i Constructor args sono parametrizzati (name + type undef + parent.id).
- `name` truthy nel Constructor → `defaultname` NON viene chiamato → bug Opzione A masked anche se non risolto.

**Risk**:
- Edge case: se `this.read(...)` ritorna `''` (empty string), `name=''` è falsy in `DReference.new`'s `if (!name) name = this.defaultname(...)` → defaultname ancora chiamato. Quindi la fix da sola non è sufficiente se gli EReference hanno name vuoto.
- Effetti su `getEcoreTypeName(parent)` (riga 864 del field-write `dObject.type`): nessuno, il field-write rimane.

### Raccomandazione: applicare A + B

- **A** risolve la root cause (parser produce `['']` invece di `[]`).
- **B** è defensive belt-and-suspenders per future invarianti.
- **C** è ortogonale: utile per simmetria del codice ma non strettamente necessaria se A è applicata.

Single-commit con A + B è minimal, no regression risk noto.

---

## 7. Open questions

1. **Proxy swallow design** (proxy.ts:284): il pattern `try { ret = get0(...); } catch(e) { ret = e; }` maschera bug latent e produce errori fuorvianti come questo. Decisione storica? Potrebbe essere utile aggiungere almeno un `console.error` per non-symbol keys (i.e. non-internal accesses) per non perdere completamente il segnale. Fuori scope di Bug G fix, ma da considerare in audit dedicato.

2. **`parseDOperation` e `parseDParameter`**: stesso pattern `.new()` zero-args + field-write father (data.ts:872, 892). Non triggered da Families/Persons (no operations/parameters), ma potenzialmente fallirebbero ALLA STESSA MANIERA per Ecore con operations su classi senza eSuperTypes. Verificare con regression test su un Ecore con `<eOperations>`. Workaround applicato da Opzione A risolve anche questo caso (perché il bug è in parseDClass, non nei parser delle features).

3. **`extends=['']` impact downstream**: ho assunto che il rewrite via `rewriteXPathPointers` / `LinkAllNamesToIDs` skip empty strings correttamente per il flusso post-parse. Da verificare con grep se ci sono altri call site che leggono `dObject.extends` durante parsing (non solo via L-proxy) e potrebbero choke su `['']`.

4. **`DClass.new(name, ..., father)`** con `name=undefined` e `father=parent.id`: anche `DClass.new` può chiamare `this.defaultname("Concept_", father)` (LModelElement.tsx:2663). Per Family/Member parseDClass passa nome valido da JSON, ma se un Ecore avesse classi senza name, `defaultname` verrebbe chiamato su un DPackage father. DPackage.get_childNames usa la base LModelElement (line 453) → `get_children` walk. DPackage's `get_children` non è altrettanto rischioso ma da verificare se ha lo stesso pattern di empty-pointer-walk.

5. **Test fixture Families.ecore**: il prompt dice "8 EReference (4 per class), bidirectional eOpposite". L'eOpposite di Bug D Fase B.2 era taggato come tre-segment XPath `/N/X/Y`. Bug G non dipende da eOpposite — è triggered dalla prima EReference qualunque essa sia. Test minimo: un Ecore con 1 classe senza eSuperTypes e 1 EReference riproduce il crash. Sarebbe utile creare un fixture sintetico `families_minimal.ecore` per regression test.

6. **Verifica empirica della catena causale (post-fix)**: applicare solo Opzione A e verificare che (a) Families importa senza errore, (b) i React duplicate-key warning di Bug E restano risolti, (c) la Dashboard mostra +1 metamodel post-import. Se Opzione A da sola risolve, conferma diagnosi. Se non risolve completamente, valutare Opzione B/C.
