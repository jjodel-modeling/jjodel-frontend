# Micro-discovery Bug D — DReference father undefined (NON regressione B.1)

**Data**: 2026-05-13
**Tipo**: read-only diagnostic (Fase A)
**Esito**: ⚠️ **Stop-and-report**. La diagnosi preliminare del prompt è **errata** — il refactor B.1 NON ha alterato il flusso `father` di `DReference`. Il warning è un bug **pre-esistente** nel parser, latent perché Families.ecore prima di B.1 falliva al validator e non arrivava mai a `parseDReference`.

---

## 1. Baseline pre-B.1

- **Commit di riferimento**: `06f766e2e` (ultimo commit del branch `alfonso-frontend-jjtl`, subject `iniziale`).
- **File baseline**: estratto via `git show HEAD:frontend/src/api/data.ts > /tmp/data_pre_b1.ts` (1222 righe).
- **File working tree**: `frontend/src/api/data.ts` (1330 righe, dirty con B.1 + fix Bug C).
- **Verifica baseline**: contiene `parseM2Model_old` (riga 386), `parseRootPackage` monolitico (riga 614), NON contiene `parsePackageBody`. Conforme alle attese del prompt.

### Funzioni pre-B.1 di interesse

| Funzione | Riga | File |
|---|---|---|
| `parseRootPackage` monolitico | 614-648 | `/tmp/data_pre_b1.ts` |
| `parseDClass` | 679-724 | `/tmp/data_pre_b1.ts` |
| `parseDAttribute` | 775-797 | `/tmp/data_pre_b1.ts` |
| `parseDReference` | 798-816 | `/tmp/data_pre_b1.ts` |

### Funzioni post-B.1 + fix Bug C

| Funzione | Riga | File |
|---|---|---|
| `parseM2Model` (branch multi-package a 437) | 393-450 | `frontend/src/api/data.ts` |
| `parseRootPackage` (thin wrapper) | 653-660 | `frontend/src/api/data.ts` |
| `parsePackageBody` (body estratto) | 662-692 | `frontend/src/api/data.ts` |
| `parseDClass` | 723-768 | `frontend/src/api/data.ts` |
| `parseDAttribute` (post fix Bug C) | 819-840 | `frontend/src/api/data.ts` |
| `parseDReference` | 842-860 | `frontend/src/api/data.ts` |

---

## 2. Firma e body di `parseRootPackage` pre-B.1

**`/tmp/data_pre_b1.ts:614-648`**:

```typescript
static parseRootPackage(parent: DModel, json: Json, generated: DModelElement[]): DModelElement[] {
    if (!generated) generated = [];
    if (!json) { json = {}; }
    const childs = this.getChildren(json);

    let dObject: DPackage = DPackage.new();
    generated.push(dObject); dObject.father = parent.id;
    if (parent) parent.packages.push(dObject.id);

    let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
    Log.ex(!EcoreParser.supportedEcoreVersions.includes(version), "unsupported ecore version, must be one of:" + EcoreParser.supportedEcoreVersions + " found instead: "+version);
    dObject.name = this.read(json, ECoreNamed.namee, 'default');
    (dObject as GObject).__fullname = '';
    const annotations: Json[] = this.getAnnotations(json);
    for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
    /// *** specific start *** ///
    const subPackages: Json[] = this.getSubPackages(json);
    dObject.uri = this.read(json, ECorePackage.nsURI, null);
    dObject.prefix = this.read(json, ECorePackage.nsPrefix, null);
    console.warn("parseRootPackage.children", {childs, annotations, subPackages, dObject, generated});
    for (let child of childs) {
        switch (child[ECoreClass.xsitype]) {
            default: Log.exx('unexpected xsitype:', child[ECoreClass.xsitype], ' found in jsonfragment:', child, ', in json:', json, ' package:', dObject); break;
            case 'ecore:EClass': this.parseDClass(dObject, child, generated, ''); break;
            case 'ecore:EEnum': this.parseDEnum(dObject, child, generated, ''); break;
        }
    }
    for (let child of subPackages) EcoreParser.parseSubPackage(dObject, child, generated, '');
    /// *** specific end *** ///
    return generated; }
```

Annotazioni:
- Firma `(parent: DModel, json: Json, generated: DModelElement[])`.
- Crea `DPackage`, setta `father = parent.id`, push su `parent.packages`.
- Validator ecore version dopo la creazione del DPackage (linee 623-626).
- Loop sui children → `parseDClass(dObject, ...)` riga 642.
- `parseDClass` riceve `dObject: DPackage` come `parent`.

## 3. Firma e body di `parsePackageBody` post-B.1

**`frontend/src/api/data.ts:662-692`**:

```typescript
private static parsePackageBody(parent: DModel, json: Json, generated: DModelElement[]): DModelElement[] {
    if (!generated) generated = [];
    if (!json) { json = {}; }
    const childs = this.getChildren(json);

    let dObject: DPackage = DPackage.new();
    generated.push(dObject); dObject.father = parent.id;
    if (parent) parent.packages.push(dObject.id);

    dObject.name = this.read(json, ECoreNamed.namee, 'default');
    (dObject as GObject).__fullname = '';
    const annotations: Json[] = this.getAnnotations(json);
    for (let child of annotations) EcoreParser.parseDAnnotation(dObject, child, generated, (dObject as GObject).__fullname + "/");
    /// *** specific start *** ///
    const subPackages: Json[] = this.getSubPackages(json);
    dObject.uri = this.read(json, ECorePackage.nsURI, null);
    dObject.prefix = this.read(json, ECorePackage.nsPrefix, null);
    console.warn("parsePackageBody.children", {childs, annotations, subPackages, dObject, generated});
    for (let child of childs) {
        switch (child[ECoreClass.xsitype]) {
            default: Log.exx('unexpected xsitype:', child[ECoreClass.xsitype], ' found in jsonfragment:', child, ', in json:', json, ' package:', dObject); break;
            case 'ecore:EClass': this.parseDClass(dObject, child, generated, ''); break;
            case 'ecore:EEnum': this.parseDEnum(dObject, child, generated, ''); break;
        }
    }
    for (let child of subPackages) EcoreParser.parseSubPackage(dObject, child, generated, '');
    /// *** specific end *** ///
    return generated; }
```

Annotazioni:
- Firma identica: `(parent: DModel, json: Json, generated: DModelElement[])`.
- Crea `DPackage`, setta `father`, push, name, fullname, annotations: **identici** a `parseRootPackage` pre-B.1.
- Validator ecore version **rimosso** (hoisted in `parseM2Model` riga 412 e nel thin wrapper `parseRootPackage` riga 657-658). NON è un side-effect su `father`.
- Loop sui children → `parseDClass(dObject, ...)` riga 686. **Identico** al pre-B.1.

**Conclusione**: `parsePackageBody` post-B.1 è **funzionalmente equivalente** a `parseRootPackage` pre-B.1 per quanto riguarda il flusso `father` verso `DPackage` e la chiamata a `parseDClass`. Nessun side-effect perduto.

---

## 4. Diff sul flusso DReference

### `parseDReference` pre-B.1 (`/tmp/data_pre_b1.ts:798-816`)

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

### `parseDReference` post-B.1 (`frontend/src/api/data.ts:842-860`)

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

### Diff testuale

```diff
$ diff <(sed -n '798,816p' /tmp/data_pre_b1.ts) <(sed -n '842,860p' frontend/src/api/data.ts)
# Nessun output — i due body sono BYTE-PER-BYTE IDENTICI.
```

**Conclusione**: `parseDReference` pre-B.1 e post-B.1 sono **testualmente identici**. Nessun parametro perso, nessun side-effect alterato. Il bug NON è una regressione del refactor B.1.

### Diff sul flusso `parseDClass → parseDReference`

Pre-B.1 `parseDClass` riga 720: `this.parseDReference(dObject, child, generated, (dObject as GObject).__fullname + "/")`.
Post-B.1 `parseDClass` riga 764: `this.parseDReference(dObject, child, generated, (dObject as GObject).__fullname + "/")`.

Identici. La signature di `parseDClass` e il loop sui `eStructuralFeatures` non sono cambiati.

### Causa root reale del warning

Il warning `"Invalid father pointer in DStructuralFeature"` è emesso a **`frontend/src/joiner/classes.ts:721`** dentro il mixin `Constructors.DStructuralFeature()`:

```typescript
// classes.ts:704-728
DStructuralFeature(): this {
    if (this.thiss.className === 'DOperation') return this;
    let thiss = this.thiss as any;
    const _DClass: typeof DClass = windoww.DClass;
    const _DValue: typeof DValue = windoww.DValue;

    let targets: DClass[] = [(_DClass as typeof DPointerTargetable).from(thiss.father, this.state)];
    let alreadyParsed: Dictionary<Pointer, DClass> = {};
    while (targets.length) {
        let nextTargets: DClass[] = [];
        for (let target of targets) {
            if (!target) { Log.ww("Invalid father pointer in DStructuralFeature", {feature: thiss, father:target, superclasses: alreadyParsed}); continue; }
            ...
        }
        ...
    }
    ...
}
```

Il check legge `thiss.father` (riga 712: `(_DClass).from(thiss.father, this.state)`). Se `thiss.father` è `undefined`, `(_DClass).from(undefined, state)` ritorna `undefined`, e linea 721 emette il warning.

`DReference.new()` di LModelElement.tsx:3769 chiamato senza argomenti:

```typescript
public static new(name?: DReference["name"], type?: DReference["type"], father?: DReference["father"], persist: boolean = true): DReference {
    if (!type) type = father // default type is self-reference
    if (!name) name = this.defaultname("ref_", father);
    return new Constructors(new DReference('dwc'), father, persist, undefined).DPointerTargetable().DModelElement()
        .DNamedElement(name).DTypedElement(type).DStructuralFeature().DReference().end();
}
```

Quando chiamato con zero args (come fa `parseDReference` riga 846): `father = undefined`. Il `Constructors(new DReference('dwc'), undefined, true, undefined)` riceve `father = undefined`. La chain `.DStructuralFeature()` esegue il check su `thiss.father` (= undefined) → warning emesso.

**POI** `parseDReference` riga 847 fa `dObject.father = parent.id` come field-write. Ma è **troppo tardi**: il warning è già stato emesso durante il Constructor.

### Side-effect mancante

Nessuno. La sequenza pre-B.1 era **identica**:

1. `DReference.new()` (no args) → `thiss.father = undefined` → DStructuralFeature mixin emette warning.
2. `dObject.father = parent.id` field-write post-construction → ripara il valore, ma il warning è già stato emesso.

Questo accade **sia pre che post B.1**. Il warning è un bug **pre-esistente**.

---

## 5. Asimmetria `parseDClass` / `parseDAttribute` / `parseDReference`

| Parser | Pattern chiamata `.new()` | `father` passato al Constructor? | Warning DStructuralFeature? |
|---|---|---|---|
| `parseDClass` (data.ts:726-729) | `DClass.new(name, undef, undef, undef, undef, undef, parent.id)` (7 args) | ✅ Sì, `parent.id` come 7° arg | N/A (DClass non passa per `DStructuralFeature` mixin) |
| `parseDAttribute` (data.ts:824-828, post fix Bug C) | `DAttribute.new(name, undefined, parent.id)` (3 args) | ✅ Sì, `parent.id` come 3° arg | ❌ No (Constructor ha `thiss.father` impostato prima del check) |
| `parseDReference` (data.ts:846) | `DReference.new()` (zero args) | ❌ **No**, `father = undefined` | ✅ **Sì** (Constructor vede `thiss.father = undefined`) |

### Perché `parseDClass` non emette warning

`DClass` non è un `DStructuralFeature` — è un `DClassifier`. Il mixin `Constructors.DStructuralFeature()` (classes.ts:704) non viene chiamato per DClass (la chain di `DClass.new` è diversa: `.DClassifier().DDataType().DClass()` o simile). Quindi il check `father=undefined` non si attiva mai. SAFE per default, indipendentemente da come `parent.id` viene propagato.

### Perché `parseDAttribute` non emette warning (post fix Bug C)

`parseDAttribute` (data.ts:824) passa `parent.id` come 3° arg a `DAttribute.new(name, undefined, parent.id)`. Il Constructor di `DAttribute` riceve `father = parent.id` e la chain `.DStructuralFeature()` (LModelElement.tsx:4132) trova `thiss.father` correttamente impostato → no warning.

**Anche pre fix Bug C** `parseDAttribute` passava `parent.id` (la signature parametrizzata era `DAttribute.new(name, eType, parent.id)`). Il fix Bug C ha solo cambiato il 2° arg da `eType` raw → `undefined`, **lasciando intatto il 3° arg `parent.id`**. Quindi `parseDAttribute` non ha **mai** emesso il warning, né pre-B.1 né post-fix-C.

### Perché `parseDReference` emette warning

Storicamente `parseDReference` chiama `DReference.new()` (zero args) sia pre-B.1 (data baseline:802) sia post-B.1 (data working:846). Il `father` viene impostato come field-write post-construction (riga 803 pre / 847 post) — **troppo tardi rispetto al Constructor**. Asimmetria interna del codice pre-esistente al refactor B.1.

### Perché il warning era invisibile pre-B.1

1. **Persons.ecore (single-package)**: zero `DReference` (solo 1 attributo `fullName: EString`). Mai chiamato `parseDReference`. Zero warning.
2. **Families.ecore (multi-package XMI-wrapped)**: pre-B.1, il root `<xmi:XMI>` veniva passato a `parseRootPackage` come se fosse un `<ecore:EPackage>`. Il validator a riga 626 (`Log.ex(!supportedEcoreVersions.includes(version), ...)`) leggeva `json["-xmlns:ecore"]` sul root XMI: assente. Throw immediato `"unsupported ecore version"`. Il parse falliva **prima** di arrivare a `parseDReference`. Zero warning.

Post-B.1, l'import multi-package funziona end-to-end: `parsePackageBody` viene chiamato per ogni EPackage interno, e per Families.ecore (che ha 8 DReference: 4 su `Family`, 4 su `Member`) i warning si manifestano per la prima volta.

### Conferma del bug pre-esistente latent

Per validare la diagnosi senza runtime: un Ecore single-package CON references (es. `library.ecore` o equivalente noto già funzionante) avrebbe emesso lo stesso warning pre-B.1. Da verificare con regression test prima di applicare qualunque fix.

---

## 6. Strategia di fix (NON applicata)

### File

`frontend/src/api/data.ts`, funzione `parseDReference` (riga 842-860 post-B.1).

### Strategia proposta — Opzione A.1 (raccomandata)

Allineare `parseDReference` al pattern post fix-C di `parseDAttribute`: passare `parent.id` come 3° arg al Constructor `DReference.new(undefined, undefined, parent.id)`, e **commentare** le righe 847-848 (push esplicito ora ridondante).

### Diff proposto

```diff
@@ -842,16 +842,16 @@
     static parseDReference(parent: DClass, json: Json, generated: DModelElement[], fullnamePrefix: string): DModelElement[] {
         if (!generated) generated = [];
         if (!json) { json = {}; }
         const childs = this.getChildren(json);
-        let dObject: DReference = DReference.new();
-        generated.push(dObject); dObject.father = parent.id;
-        if (parent) parent.references.push(dObject.id);
+        let dObject: DReference = DReference.new(undefined, undefined, parent.id);
+        generated.push(dObject);// dObject.father = parent.id;
+        // if (parent) parent.references.push(dObject.id);
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

### Razionale

1. **Passare `parent.id` al Constructor** fa sì che il mixin `Constructors.DStructuralFeature()` (classes.ts:704-728) trovi `thiss.father` valido al momento del check (riga 712), evitando il warning a riga 721.
2. **Il mixin `Constructors.DReference()` (classes.ts:746-752)** fa **automaticamente** `setExternalPtr(thiss.father, "references", "+=")` (riga 751) — equivalente a `parent.references.push(dObject.id)`. Quindi la riga 848 esplicita diventa **duplicato** se passassimo `father` al Constructor senza commentarla. Commentare 847 (field-write `dObject.father = parent.id`) è anch'esso ridondante perché il Constructor lo imposta già.
3. **Pattern simmetrico a `parseDAttribute`** post fix-C (data.ts:824-831): stesso layout di righe commentate (`// dObject.father = ...` e `// if (parent) parent.attributes.push(...)`).
4. **Il field-write `dObject.type = this.read(...)`** (riga 858, parseDReference) **resta intatto** — è cruciale per il flusso `rewriteXPathPointers`: il Constructor `DTypedElement(type=undefined)` fa fallback a `fatherPtr` (DClass id), che viene poi sovrascritto dalla field-write con il valore raw da JSON Ecore (XPath o nome). Esattamente come per parseDAttribute post fix-C.

### Effetti collaterali attesi

- **Nessuna duplicazione** in `parent.references`: il Constructor pusha 1 volta, e il push esplicito viene commentato.
- **Nessuna regressione**: i field-writes successivi (composition, container, lowerBound, upperBound, type) restano invariati e sovrascrivono i default impostati dal Constructor.
- **`getEcoreTypeName(parent)`** (fallback alla riga 858 del field-write `type`): preserva il comportamento esistente, indipendente dal Constructor.
- **Warning** scompare per le 8 occorrenze osservate su Families.ecore + per qualunque altro Ecore con DReference (anche single-package — fix copre il bug pre-esistente).

### Costi / rischi

- **Modifica di un parser legacy**: il pattern `DReference.new()` (no args) era in piedi dal 2023 (commit `54d0dbbe3c` GiordanoT, stesso commit del bug C). Lo stesso commit ha applicato il pattern parametrizzato per `parseDAttribute` ma NON per `parseDReference`. Asimmetria storica non documentata. Il fix la rimuove.
- **Regression test obbligatorio**: import di un Ecore single-package con DReference (es. library.ecore o fixture noti) prima e dopo il fix. Atteso: nessun warning, struttura DReference identica nel TreeView, references presenti in `parent.references` (non duplicate).
- **DTypedElement con type=undefined per DReference**: il fallback alla riga 884-889 di `classes.ts` (`case 'DReference': type = this.fatherPtr as Pointer<DClass> || undefined`) imposta `type = fatherPtr` (DClass id). Il field-write a riga 858 sovrascrive subito. Comportamento simmetrico a parseDAttribute post fix-C.

---

## 7. Open questions

1. **Single-package Ecore con DReference noto già funzionante**: esistono fixture (`library.ecore` o altri) usati in dev/test che potremmo importare per verificare empiricamente che pre-B.1 emettesse già lo stesso warning su qualunque Ecore con references? Se sì, conferma definitiva che è bug pre-esistente. Domanda per l'utente.

2. **Asimmetria storica**: il commit `54d0dbbe3c` (GiordanoT 2023-11-27, subject `merge`) ha applicato il pattern parametrizzato `.new(name, type, parent.id)` a `parseDAttribute` ma non a `parseDReference`. Motivo non documentato. Potrebbe esserci stato un tentativo iniziale che non funzionava (es. il Constructor di DReference con type=`parent.id` causava qualche issue runtime non ovvio). Da verificare il rationale prima di chiudere definitivamente il fix.

3. **`parseDParameter` e `parseDOperation`** (data.ts:862-880, 882-906): entrambi chiamano rispettivamente `DParameter.new()` e `DOperation.new()` senza argomenti, e poi fanno `dObject.father = parent.id` come field-write. Stesso pattern di `parseDReference`. Domanda: anche questi emettono il warning `"Invalid father pointer in DStructuralFeature"` su Ecore con operations/parameters? Lo stack trace osservato runtime cita solo DReference (8 warning), ma potrebbe essere perché Families.ecore non ha operations. Da estendere il fix se conferma.

4. **`DStructuralFeature` check come Log.ww vs Log.ex**: il warning è non-blocking (`Log.ww`, console.warn). L'import procede comunque e il modello viene costruito correttamente (il `father` viene impostato dal field-write post-construction). Potrebbe esserci un argument per declassare il warning a `Log.exDev` (solo in dev mode) se non causa malfunzionamenti runtime. Decisione di policy, non scope di questo fix.
