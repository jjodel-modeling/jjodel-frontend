# Discovery: Ecore I/O Completeness vs Standard EMF/Ecore

**Data**: 2026-05-17
**Branch**: `alfonso-frontend-jjtl`
**Autore**: Claude Code (read-only analysis)
**Scope**: matrix sistematica di gap fra schema D-layer / importer / exporter e specifica Ecore.ecore standard, per derivare la sequenza implementativa verso Ecore I/O 100%.
**Esito atteso**: report autoritativo, zero modifiche al codice source.

---

## Convenzioni

- ✅ = campo letto/scritto correttamente, default EMF-compliant.
- ⚠️ = parziale (default sbagliato, scrittura non strict, lettura via costante errata, ecc.).
- ❌ = assente nel codice.
- N/A = non applicabile (es. proprietà derivate volatile/transient in EMF, mai serializzate).
- Code reference: `file:line`.

**File source analizzati (read-only):**

- `frontend/src/api/data.ts` (1406 righe) — importer `EcoreParser`
- `frontend/src/services/export/EcoreService.ts` (698 righe) — exporter `EcoreService.exportToXML` (path attivo in `ProjectEditor.tsx:729` e `XMIService.ts:157`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (7722 righe) — schema D + wrapper L

**Note metodologiche:**

- Esiste un secondo path d'export "legacy" via `generateEcoreJson_impl` sulle classi L (lines 2997, 2346, 4193, 4499 ...). Il path **attivo** in produzione è `EcoreService.exportToXML`. La discovery valuta quest'ultimo. Quando i due path divergono per una feature, lo segnalo in nota.
- Costanti `ECoreXxx.fieldName` in `data.ts:1131-1407` definiscono i nomi-attributo XMI riconosciuti. La mancanza di una costante per una feature implica `❌` strutturale nell'importer.

---

## 1. Tabella riepilogativa globale

| Metaclasse        | Feat. canoniche serializzabili | D-layer gap | Importer gap | Exporter gap | Note                                                                                 |
| ----------------- | -----------------------------: | ----------: | -----------: | -----------: | ------------------------------------------------------------------------------------ |
| EPackage          |                              5 |           0 |          1⚠️ |          2❌ | eAnnotations dropped; eFactoryInstance N/A in Jjodel                                 |
| EClass            |                              9 |           2 |        2⚠️+3❌ |          5❌ | instanceTypeName r/o asimmetrico; no eGenericSuperTypes, eTypeParameters             |
| EAttribute        |                             14 |           0 |       2⚠️+3❌ |          4❌ | no iD, defaultValueLiteral, eGenericType, eAnnotations                               |
| EReference        |                             16 |           2 |         1⚠️+4❌ |         5❌ | importer non legge eOpposite; no eKeys, resolveProxies, defaultValueLiteral          |
| EOperation        |                             11 |           3 |       4⚠️+3❌ |         6❌ | exporter ignora bounds/flags/eExceptions; no eGenericExceptions, eTypeParameters     |
| EParameter        |                              7 |           0 |          2⚠️ |          4❌ | exporter emette solo name+eType; no eGenericType                                     |
| EEnum             |                              5 |           0 |           0 |          2❌ | exporter non emette instanceClassName, serializable                                  |
| EEnumLiteral      |                              3 |           0 |           0 |         1⚠️+1❌ | exporter usa `literal` come XML name (bug); `literal` separato non emesso          |
| EDataType         |                              4 |           0 |       4❌ totale |     4❌ totale | nessuna parseDDataType; nessuna exportDataType; user-defined EDataType non supportato |
| EAnnotation       |                              3 |           0 |       3❌ totale |     3❌ totale | parseDAnnotation `return []` dead code; nessun exportAnnotation                       |
| ETypeParameter    |                              2 |       2❌ totale |   2❌ totale |      2❌ totale | DTypeParameter non esiste                                                            |
| EGenericType      |                              5 |       5❌ totale |   5❌ totale |      5❌ totale | DGenericType non esiste                                                              |

**Totali aggregati**: ~73 feature canoniche × 3 dimensioni = 219 celle valutate. Gap: ~71 (incluse classi integralmente assenti).

---

## 2. Sezione per metaclasse

### 2.1 EPackage

| Campo               | D-layer field                                         | Importer                                                                                       | Exporter                                                                            |
| ------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `name`              | `DPackage.name: string` (`LModelElement.tsx:1736`)    | ✅ `data.ts:692, 722` via `ECoreNamed.namee`                                                   | ✅ `EcoreService.ts:150, 154, 423`                                                  |
| `nsURI`             | `DPackage.uri: string` (`LModelElement.tsx:1743`)     | ✅ `data.ts:699, 727` via `ECorePackage.nsURI`                                                 | ✅ `EcoreService.ts:151, 154` (via `pkg.__raw.uri`)                                 |
| `nsPrefix`          | `DPackage.prefix: string` (`LModelElement.tsx:1744`)  | ✅ `data.ts:700, 728`                                                                          | ✅ `EcoreService.ts:152, 154, 423`                                                  |
| `eClassifiers`      | `DPackage.classes` + `DPackage.enumerators` (split)   | ⚠️ `data.ts:707-708, 736-737`: solo `ecore:EClass` e `ecore:EEnum`; `ecore:EDataType` default-throws (`Log.exx`). Multi-package "primitive-only" packages vengono consumati via `isPrimitivePackage`/`rewriteXPathPointers`. | ⚠️ `EcoreService.ts:157-165, 426-432`: emette solo `classes` + `enumerators`; nessun supporto a EDataType user-defined |
| `eSubpackages`      | `DPackage.subpackages` (`LModelElement.tsx:1742`)     | ✅ `data.ts:711, 740` ricorsivo                                                                | ✅ `EcoreService.ts:168-172, 436-438`                                               |
| `eSuperPackage`     | derived (parent)                                      | N/A                                                                                            | N/A                                                                                 |
| `eFactoryInstance`  | ❌ assente                                              | ❌                                                                                              | ❌                                                                                   |
| `eAnnotations`      | `DPackage.annotations` (`LModelElement.tsx:1735`)     | ⚠️ `data.ts:695-696`: collezionato via `getAnnotations()`, passato a `parseDAnnotation` (`data.ts:644-672`) **che ha `return []` come prima istruzione** → dato silenziosamente droppato. | ❌ `EcoreService.ts:104-176`: nessuna emissione di eAnnotations sull'EPackage      |

**Gap totali EPackage**: 4 (1⚠️ importer + 2❌ exporter + 1⚠️ eClassifiers). `eFactoryInstance` non in scope (factory pattern non applicabile a Jjodel).

---

### 2.2 EClass

| Campo                  | D-layer field                                                            | Importer                                                                                       | Exporter                                                                  |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `name`                 | `DClass.name` (`LModelElement.tsx:2628`)                                 | ✅ `data.ts:748` via `ECoreNamed.namee`                                                        | ✅ `EcoreService.ts:205`                                                  |
| `instanceClassName`    | `DClass.instanceClassName: string` (`LModelElement.tsx:2624`)            | ⚠️ `data.ts:769`: assegnato leggendo **`ECoreClass.instanceTypeName`** (asimmetria semantica) | ❌ exporter non emette                                                    |
| `instanceTypeName`     | non esiste come campo distinto (collassato in `instanceClassName`)        | ⚠️ stesso: vedere riga sopra                                                                   | ❌                                                                        |
| `instanceClass`        | derived (volatile, transient)                                            | N/A                                                                                            | N/A                                                                       |
| `defaultValue`         | `DClassifier.defaultValue` (`LModelElement.tsx:1619`)                    | N/A (derived in EMF)                                                                           | N/A                                                                       |
| `abstract`             | `DClass.abstract: boolean = false` (`LModelElement.tsx:2634`)            | ✅ `data.ts:771`                                                                               | ✅ `EcoreService.ts:209-211` (truthy emit)                                |
| `interface`            | `DClass.interface: boolean = false` (`LModelElement.tsx:2635`)           | ✅ `data.ts:770`                                                                               | ✅ `EcoreService.ts:214-216` (truthy emit)                                |
| `eSuperTypes`          | `DClass.extends: Pointer<DClass, 0, 'N'>[]` (`LModelElement.tsx:2642`)   | ✅ `data.ts:772-778` (space-split, con guard B.G)                                              | ✅ `EcoreService.ts:219-223` con `crossPackagePointer`                    |
| `eStructuralFeatures`  | `DClass.attributes` + `DClass.references` (split)                        | ✅ `data.ts:779-792` discriminato per `xsi:type`                                               | ✅ `EcoreService.ts:226-244`                                              |
| `eOperations`          | `DClass.operations` (`LModelElement.tsx:2637`)                           | ✅ `data.ts:780, 782` via filtro `functions: true`                                             | ✅ `EcoreService.ts:228, 245-247`                                         |
| `eGenericSuperTypes`   | ❌ assente                                                                | ❌                                                                                              | ❌                                                                        |
| `eTypeParameters`      | ❌ assente                                                                | ❌                                                                                              | ❌                                                                        |
| `eAnnotations`         | `DClass.annotations` (`LModelElement.tsx:2627`)                          | ⚠️ collezionato `data.ts:754`, droppato                                                       | ❌                                                                        |

**Note:**

- `instanceClassName` vs `instanceTypeName`: in Ecore.ecore sono campi distinti (uno è il nome Java FQ, l'altro è il template; in pratica spesso uguali ma serializzati separatamente). Jjodel li collassa in un unico campo D-layer (`DClass.instanceClassName`) letto da `instanceTypeName` (`data.ts:769`). Round-trip lossy per chi distingue le due.
- `defaultValue` come campo derived in EMF non viene serializzato direttamente; in Jjodel `DClassifier.defaultValue` è usato per altri scopi (default per inferenza M1) → non si tratta di un gap di I/O.

**Gap totali EClass**: 10 (2 D-layer + 2⚠️ + 3❌ importer + 5❌ exporter). Inclusi: `instanceClassName/instanceTypeName` asimmetria, eGenericSuperTypes, eTypeParameters, eAnnotations.

---

### 2.3 EAttribute

| Campo                  | D-layer field                                                                 | Importer                                                              | Exporter                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `name`                 | `DAttribute.name` (heredita `DNamedElement`)                                  | ✅ `data.ts:851`                                                       | ✅ `EcoreService.ts:263`                                                                                                  |
| `eType`                | `DAttribute.type: Pointer<DClassifier>` (heredita `DTypedElement`)            | ✅ `data.ts:864`                                                       | ✅ `EcoreService.ts:267-268` via `mapToEcoreType`                                                                         |
| `eGenericType`         | ❌ assente                                                                     | ❌ (`DGenericType` mancante)                                           | ❌                                                                                                                        |
| `lowerBound`           | `DAttribute.lowerBound: number = 0` (heredita `DTypedElement`)                | ✅ `data.ts:862` (default 0)                                           | ⚠️ `EcoreService.ts:271-273` emette solo se `!== 0` (corretto). `0` mai emesso (default EMF).                            |
| `upperBound`           | `DAttribute.upperBound: number = 1`                                           | ✅ `data.ts:863` (default 1)                                           | ⚠️ `EcoreService.ts:274-276` emette solo se `!== 1` (corretto).                                                          |
| `many`                 | derived                                                                       | N/A                                                                   | N/A                                                                                                                       |
| `required`             | derived                                                                       | N/A                                                                   | N/A                                                                                                                       |
| `ordered`              | `DStructuralFeature.ordered: boolean = true` (`LModelElement.tsx:2073`)       | ✅ `data.ts:865` default true                                          | ✅ `EcoreService.ts:279` strict `=== false`                                                                               |
| `unique`               | `DStructuralFeature.unique: boolean = true`                                   | ✅ `data.ts:866` default true                                          | ✅ `EcoreService.ts:280` strict `=== false`                                                                               |
| `changeable`           | `DStructuralFeature.changeable: boolean = true` (`LModelElement.tsx:2081`)    | ✅ `data.ts:867` default true                                          | ⚠️ `EcoreService.ts:292`: `if (!attr.changeable)` (truthy-check) — emette anche con `undefined`. In pratica `changeable` è sempre definito quindi safe; ma non strict. |
| `volatile`             | `DStructuralFeature.volatile: boolean = false`                                | ✅ `data.ts:870` default false                                         | ✅ `EcoreService.ts:290` truthy emit                                                                                      |
| `transient`            | `DStructuralFeature.transient: boolean = false`                               | ✅ `data.ts:869` default false                                         | ✅ `EcoreService.ts:289` truthy emit                                                                                      |
| `defaultValueLiteral`  | `DAttribute.defaultValueLiteral: string = ''` (`LModelElement.tsx:4113`)      | ❌ mai letto (nessuna costante `ECoreAttribute.defaultValueLiteral`)   | ❌ `EcoreService.ts:283-285` **commentato** (codice disabilitato)                                                          |
| `defaultValue`         | `DAttribute.defaultValue: PrimitiveType[]` (`LModelElement.tsx:4127`)         | N/A (derived da `defaultValueLiteral` in EMF)                          | N/A                                                                                                                       |
| `unsettable`           | `DStructuralFeature.unsettable: boolean = false`                              | ✅ `data.ts:871` default false                                         | ✅ `EcoreService.ts:291` truthy emit                                                                                      |
| `derived`              | `DStructuralFeature.derived: boolean = false`                                 | ✅ `data.ts:868` default false                                         | ✅ `EcoreService.ts:288` truthy emit                                                                                      |
| `iD`                   | `DAttribute.isID: boolean = false` (`LModelElement.tsx:4130`)                 | ❌ mai letto (nessuna costante `ECoreAttribute.iD`)                    | ❌                                                                                                                        |
| `eAttributeType`       | derived                                                                       | N/A                                                                   | N/A                                                                                                                       |
| `eAnnotations`         | heredita `DModelElement.annotations`                                          | ⚠️ collezionato `data.ts:859`, droppato                              | ❌                                                                                                                        |

**Note:**

- `defaultValueLiteral`: il D-layer ha già il campo (`DAttribute.defaultValueLiteral` riga 4113, e `DReference.defaultValueLiteral` riga 3755), serializzato anche in `duplicate()` (riga 4223), ma l'exporter ha il blocco di emissione **commentato** e l'importer non legge la costante. Path predisposto ma disabilitato.
- `changeable`: il truthy-check exporter (`!attr.changeable`) è funzionalmente corretto perché D-layer inizializza sempre a `true`. Rimane non-strict — se in futuro `changeable` può essere `undefined`, l'output cambia.
- `iD`: campo D-layer presente con commento sospetto `// ? exist in ecore as "iD" ?`. Risposta: sì, esiste in Ecore standard come `iD` (con I maiuscola). Mai wired.

**Gap totali EAttribute**: 9 (2⚠️ + 3❌ importer = 5; 4❌ exporter; 1⚠️ exporter su `changeable` non-strict).

---

### 2.4 EReference

| Campo                  | D-layer field                                                              | Importer                                                                          | Exporter                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `name`                 | `DReference.name`                                                          | ✅ `data.ts:882`                                                                  | ✅ `EcoreService.ts:303`                                                                                                          |
| `eType`                | `DReference.type: Pointer<DClass>`                                         | ✅ `data.ts:891`                                                                  | ✅ `EcoreService.ts:307-310` via `targetTypePointer`                                                                              |
| `eGenericType`         | ❌                                                                          | ❌                                                                                 | ❌                                                                                                                                |
| `lowerBound`           | inherits `DStructuralFeature.lowerBound: number = 0`                       | ✅ `data.ts:889`                                                                  | ⚠️ `EcoreService.ts:313-315`: emette **sempre se definito** (no skip default 0). EMF normalmente non serializza 0. Verbose, ma EMF lo tollera. |
| `upperBound`           | inherits `DStructuralFeature.upperBound: number = 1`                       | ✅ `data.ts:890`                                                                  | ✅ `EcoreService.ts:316-318` skip default 1                                                                                       |
| `many` / `required`    | derived                                                                    | N/A                                                                               | N/A                                                                                                                               |
| `ordered`              | inherits, default true                                                     | ✅ `data.ts:892`                                                                  | ✅ `EcoreService.ts:321`                                                                                                          |
| `unique`               | inherits, default true                                                     | ✅ `data.ts:893`                                                                  | ✅ `EcoreService.ts:322`                                                                                                          |
| `changeable`           | inherits, default true                                                     | ✅ `data.ts:894`                                                                  | ✅ `EcoreService.ts:323` strict `=== false`                                                                                       |
| `volatile`             | inherits, default false                                                    | ✅ `data.ts:897`                                                                  | ✅ `EcoreService.ts:326`                                                                                                          |
| `transient`            | inherits, default false                                                    | ✅ `data.ts:896`                                                                  | ✅ `EcoreService.ts:325`                                                                                                          |
| `defaultValueLiteral`  | `DReference.defaultValueLiteral: string = ''` (`LModelElement.tsx:3755`)   | ❌ mai letto                                                                       | ❌                                                                                                                                |
| `unsettable`           | inherits, default false                                                    | ✅ `data.ts:898`                                                                  | ✅ `EcoreService.ts:327`                                                                                                          |
| `derived`              | inherits, default false                                                    | ✅ `data.ts:895`                                                                  | ✅ `EcoreService.ts:324`                                                                                                          |
| `containment`          | `DReference.composition: boolean = false` (mapping)                        | ✅ `data.ts:887` via `composition`                                                | ✅ `EcoreService.ts:330-332` (`composition \|\| containment`)                                                                     |
| `resolveProxies`       | ❌ assente                                                                  | ❌                                                                                 | ❌                                                                                                                                |
| `eOpposite`            | `DReference.opposite?: Pointer<DReference>` (`LModelElement.tsx:3770`)     | ❌ **nessuna costante `ECoreReference.eOpposite`**; `parseDReference` non legge   | ✅ `EcoreService.ts:336-339`: scrive `eOpposite="#//Class/name"` via `crossPackagePointer` + `/featureName`                       |
| `eKeys`                | ❌                                                                          | ❌                                                                                 | ❌                                                                                                                                |
| `container`            | `DReference.container: boolean = false` (`LModelElement.tsx:3769`)         | ⚠️ `data.ts:888` legge `ECoreReference.container` ma EMF non lo serializza normalmente (derived volatile/transient) | ❌ exporter non emette `container` (in linea con la specifica EMF: derived); ma D-layer ha campo non-derived           |
| `eReferenceType`       | derived                                                                    | N/A                                                                               | N/A                                                                                                                               |
| `eAnnotations`         | inherits                                                                   | ⚠️ collezionato `data.ts:884`, droppato                                          | ❌                                                                                                                                |

**Note:**

- **eOpposite (B.2 backlog noto)**: asimmetria critica per round-trip. L'exporter scrive correttamente `eOpposite="#//Cls/feat"`, ma l'importer non legge → round-trip rompe le bidirezionalità.
- `container`: in EMF è derivato (true se l'opposite è containment). Jjodel lo modella come campo persistente e lo legge dall'XML — asimmetria semantica vs EMF, ma se mai venisse serializzato non causa errori (lettura tolerant).
- `eKeys`: chiavi per containment con upperBound>1 e dedup logico. Raramente usato; usato in UML2 (≈3-5 occorrenze).

**Gap totali EReference**: 10 (2 D-layer + 1⚠️ + 4❌ importer + 5❌ exporter; container ⚠️ marginale).

---

### 2.5 EOperation

| Campo                   | D-layer field                                              | Importer                                                                                              | Exporter                                              |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `name`                  | `DOperation.name`                                          | ✅ `data.ts:929`                                                                                      | ✅ `EcoreService.ts:352`                              |
| `eType` (return)        | `DOperation.type`                                          | ✅ `data.ts:937` (via `ECoreAttribute.eType`)                                                         | ✅ `EcoreService.ts:356-360` via `targetTypePointer`  |
| `eGenericType`          | ❌                                                          | ❌                                                                                                     | ❌                                                    |
| `lowerBound`            | inherits `DStructuralFeature.lowerBound: number = 0`       | ⚠️ `data.ts:935`: default `1` (errato; EMF default 0)                                                | ❌ non emesso                                         |
| `upperBound`            | inherits, default 1                                        | ✅ `data.ts:936`                                                                                      | ❌ non emesso                                         |
| `many` / `required`     | derived                                                    | N/A                                                                                                   | N/A                                                   |
| `ordered`               | inherits, default true                                     | ⚠️ `data.ts:939`: `this.read(json, ECoreOperation.ordered, 'false')` — default `'false'` (errato)    | ❌ non emesso                                         |
| `unique`                | inherits, default true                                     | ⚠️ `data.ts:940`: default `'false'` (errato)                                                          | ❌ non emesso                                         |
| `eParameters`           | `DOperation.parameters` (`LModelElement.tsx:2272`)         | ✅ `data.ts:942-944` ricorsivo                                                                        | ✅ `EcoreService.ts:362-374`                          |
| `eExceptions`           | `DOperation.exceptions: Pointer<DClassifier>[]`            | ⚠️ `data.ts:938`: `[this.read(json, ECoreOperation.eexceptions, '')]` — legge come **singolo string**, wrappato in array di lunghezza 1. EMF usa "spazio-separato" ma il parser non splitta. Stringa vuota → `['']`. | ❌ non emesso                                         |
| `eGenericExceptions`    | ❌                                                          | ❌                                                                                                     | ❌                                                    |
| `eTypeParameters`       | ❌                                                          | ❌                                                                                                     | ❌                                                    |
| `eAnnotations`          | inherits                                                   | ⚠️ collezionato `data.ts:932`, droppato                                                              | ❌                                                    |

**Note:**

- `lowerBound = 1` default nell'importer è inconsistente con DStructuralFeature (default 0) e con EMF (default 0). Probabilmente confusione con "1 valore di ritorno" semantica, ma EMF usa 0 anche per operation return.
- `ordered/unique` default `'false'` (sì, anche come default arg di `U.fromBoolString` line 940 manca il secondo arg). EMF default è `true` per entrambi.
- `eExceptions`: il path attuale non splitta per spazi, quindi una operazione con 2+ exceptions perde le altre. Non testato (nessuna fixture).
- Path legacy `LOperation.generateEcoreJson_impl` (`LModelElement.tsx:2346-2360`) emette ordered/unique/lowerBound/upperBound/eExceptions, ma **non è il path attivo**.

**Gap totali EOperation**: 13 (3 D-layer N/A nelle 11 serializzabili; 4⚠️ + 3❌ importer = 7; 6❌ exporter).

---

### 2.6 EParameter

| Campo            | D-layer field                              | Importer                                                                              | Exporter                              |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------- |
| `name`           | `DParameter.name`                          | ✅ `data.ts:909`                                                                      | ✅ `EcoreService.ts:385`              |
| `eType`          | `DParameter.type`                          | ✅ `data.ts:916`                                                                      | ✅ `EcoreService.ts:388-392`          |
| `eGenericType`   | ❌                                          | ❌                                                                                     | ❌                                    |
| `lowerBound`     | inherits, default 0                        | ✅ `data.ts:914`                                                                      | ❌ non emesso                         |
| `upperBound`     | inherits, default 1                        | ✅ `data.ts:915`                                                                      | ❌ non emesso                         |
| `many`/`required` | derived                                   | N/A                                                                                   | N/A                                   |
| `ordered`        | inherits, default true                     | ⚠️ `data.ts:917`: default `'false'` (errato; EMF true)                               | ❌                                    |
| `unique`         | inherits, default true                     | ⚠️ `data.ts:918`: default `'false'` (errato)                                          | ❌                                    |
| `eAnnotations`   | inherits                                   | ⚠️ collezionato, droppato                                                            | ❌                                    |

**Note:**

- Stesso pattern bug default-ordered/unique come EOperation.
- Path legacy `LParameter.generateEcoreJson_impl` (`LModelElement.tsx:2558-2569`) emette lowerBound/upperBound/ordered/unique/eType, ma non attivo.

**Gap totali EParameter**: 7 (2⚠️ + 0❌ importer; 4❌ exporter).

---

### 2.7 EEnum

| Campo                | D-layer field                                                   | Importer                                                                              | Exporter                                                                          |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `name`               | `DEnumerator.name`                                              | ✅ `data.ts:803`                                                                      | ✅ `EcoreService.ts:403`                                                          |
| `instanceClassName`  | `DEnumerator.instanceClassName` (`LModelElement.tsx:4437`)      | ✅ `data.ts:816` (legge `ECoreEnum.instanceTypeName`)                                 | ❌ non emesso                                                                     |
| `instanceTypeName`   | tied a `instanceClassName`                                      | ⚠️ vedere sopra                                                                       | ❌                                                                                |
| `serializable`       | `DEnumerator.serializable: boolean = true` (`LModelElement.tsx:4443`) | ✅ `data.ts:815`                                                                      | ❌ exporter `EcoreService.ts:400-414` non emette `serializable`                   |
| `eLiterals`          | `DEnumerator.literals` (`LModelElement.tsx:4446`)               | ✅ `data.ts:819-821, 828-843`                                                         | ✅ `EcoreService.ts:405-409`                                                      |
| `eAnnotations`       | inherits                                                        | ⚠️ collezionato `data.ts:805`, droppato                                              | ❌                                                                                |
| `eTypeParameters`    | ❌                                                               | ❌                                                                                     | ❌                                                                                |

**Note:**

- Path legacy `LEnumerator.generateEcoreJson_impl` (`LModelElement.tsx:4499-4511`) emette `instanceTypeName` + `serializable` correttamente — ma path non attivo.

**Gap totali EEnum**: 4 (0 D-layer; 0 importer hard ma 1⚠️ aliasing + eAnnotations; 2❌ + 1⚠️ exporter su serializable e instanceClassName).

---

### 2.8 EEnumLiteral

| Campo            | D-layer field                                | Importer                                                                                | Exporter                                                                                                                                                                          |
| ---------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`           | `DEnumLiteral.name`                          | ✅ `data.ts:840`                                                                        | ⚠️ `EcoreService.ts:408`: `name="${literal.literal}"` — usa **`literal.literal`** invece di `literal.name`. Possibile bug semantico: in Ecore `name` è l'identificatore Java, `literal` è il display label opzionale. |
| `value`          | `DEnumLiteral.value: number`                 | ✅ `data.ts:838`                                                                        | ✅ `EcoreService.ts:407-408` via `ordinal`                                                                                                                                        |
| `literal`        | `DEnumLiteral.literal: string`               | ✅ `data.ts:839`                                                                        | ❌ non emesso come attributo separato (usato erroneamente come `name`)                                                                                                            |
| `instance`       | derived                                      | N/A                                                                                     | N/A                                                                                                                                                                               |
| `eEnum`          | container/derived                            | N/A                                                                                     | N/A                                                                                                                                                                               |
| `eAnnotations`   | inherits                                     | ⚠️ collezionato `data.ts:835`, droppato                                                | ❌                                                                                                                                                                                |

**Note:**

- Path legacy `LEnumLiteral.generateEcoreJson_impl` (`LModelElement.tsx:4340-4348`) emette `value`, `literal`, `name` correttamente come campi distinti. L'exporter attivo collassa `name`←`literal` erroneamente.

**Gap totali EEnumLiteral**: 3 (1⚠️ semantico exporter `name`/`literal`, 1❌ exporter `literal`, 1⚠️ importer eAnnotations).

---

### 2.9 EDataType (user-defined)

**Stato: classe non gestita integralmente.**

- **D-layer**: `DDataType` esiste (`LModelElement.tsx:3652-3682`) con campi `name`, `instanceClassName`, `defaultValue`, `serializable`. ✅
- **Importer**: nessuna `parseDDataType`. In `parsePackageBody` (`data.ts:705-710`) e `parseSubPackage` (`data.ts:733-739`) il default case è `Log.exx('unexpected xsitype:...')` — qualsiasi `ecore:EDataType` dentro un pacchetto "normale" (non primitive-only) fa **throw**. ❌
- I pacchetti che contengono **solo** EDataType vengono consumati silenziosamente come "primitive packages" (`data.ts:1042-1054, isPrimitivePackage`) e mappati ai primitive Jjodel via `rewriteXPathPointers`. EDataType custom **non vengono mai materializzati** come `DDataType`.
- **Exporter**: nessuna `exportDataType` in `EcoreService.ts`. Solo `exportClass` + `exportEnumerator` + `exportOperation` + `exportParameter`. ❌

| Campo               | D-layer | Importer | Exporter |
| ------------------- | ------- | -------- | -------- |
| `name`              | ✅      | ❌       | ❌       |
| `instanceClassName` | ✅      | ❌       | ❌       |
| `serializable`      | ✅      | ❌       | ❌       |
| `eTypeParameters`   | ❌      | ❌       | ❌       |
| `eAnnotations`      | ✅ (inh) | ❌       | ❌       |

**Gap totali EDataType**: 4 (campo `eTypeParameters` esiste e va contato, gli altri 3 sono pieni gap in I/O nonostante il D-layer ci sia).

---

### 2.10 EAnnotation

**Stato: parsing dead code, export assente in path attivo.**

- **D-layer**: `DAnnotation` (`LModelElement.tsx:982-1001`) con campi `source: string`, `details: DAnnotationDetail[]`. `DAnnotationDetail` (`LModelElement.tsx:147-151`) con commento `// todo`, senza campi `key`/`value` espliciti (sì costanti `ECoreDetail.key/value` in `data.ts:1308-1309` ma non agganciate).
- **Importer**: `parseDAnnotation` (`data.ts:644-672`) ha **`return []; // todo` come prima istruzione** — tutto il corpo è morto. `getAnnotations()` viene chiamato da ogni `parseDXxx` ma il risultato non viene mai materializzato. ❌
- **Exporter**: `EcoreService.exportToXML` non chiama mai `exportAnnotation`. Esiste `LAnnotation.generateEcoreJson_impl` (`LModelElement.tsx:1025-1033`) nel path legacy, ma non wired. ❌

| Campo            | D-layer field                              | Importer | Exporter |
| ---------------- | ------------------------------------------ | -------- | -------- |
| `source`         | `DAnnotation.source: string`               | ❌       | ❌       |
| `details`        | `DAnnotation.details: DAnnotationDetail[]` | ❌       | ❌       |
| `eModelElement`  | container/derived (via `father`)           | N/A      | N/A      |
| `contents`       | ❌ assente                                  | ❌       | ❌       |
| `references`     | costante `ECoreAnnotation.references` esiste ma scollegata; D field assente | ❌       | ❌       |
| `eAnnotations` (su annotation) | `DAnnotation.annotations` inherits | ❌       | ❌       |

**Gap totali EAnnotation**: 3 hard (source, details, eAnnotations su annotation) + 2 minori (contents, references rare in real-world).

**Volume nelle fixture locali**: `frontend/src/__tests__/fixtures/xmi-m1/*.ecore` → 0 occorrenze di `eAnnotation` su tutti i file (`Graph.ecore`, `Library.ecore`, `Shapes.ecore`, `*.xmi`). Le fixture sono troppo semplici per misurare la criticità reale. Per metamodelli del mondo reale (UML2, Ecore.ecore reflective, BPMN): le annotazioni sono **massive** (decine-centinaia per metamodel) e usate per OCL constraints, redefines, subsets, gen-model directives, persistence hints. Senza supporto annotazioni, l'import di UML2.ecore perde la maggior parte della semantica.

---

### 2.11 ETypeParameter

**Stato: classe non esistente in Jjodel.**

| Campo            | D-layer | Importer | Exporter |
| ---------------- | ------- | -------- | -------- |
| `name`           | ❌      | ❌       | ❌       |
| `eBounds`        | ❌      | ❌       | ❌       |
| `eAnnotations`   | ❌      | ❌       | ❌       |

- `grep DTypeParameter` su tutto `frontend/src/` → 0 hit.
- Generics in metamodelli concreti: rari (UML2 li usa in `Operation`, `Classifier`, `Behavior`). Concrete usage volume modesto.

**Gap totali ETypeParameter**: 3 (decisione di scope, vedi OQ1).

---

### 2.12 EGenericType

**Stato: classe non esistente.**

| Campo              | D-layer | Importer | Exporter |
| ------------------ | ------- | -------- | -------- |
| `eClassifier`      | ❌      | ❌       | ❌       |
| `eTypeParameter`   | ❌      | ❌       | ❌       |
| `eUpperBound`      | ❌      | ❌       | ❌       |
| `eLowerBound`      | ❌      | ❌       | ❌       |
| `eTypeArguments`   | ❌      | ❌       | ❌       |

**Gap totali EGenericType**: 5 (vedi OQ2).

---

## 3. Gap classificati per gravità

### 3.1 Blocker (rompono round-trip o causano errori runtime su modelli reali)

| ID  | Gap                                                       | File              | Causa                                                                                                | Effetto                                                                                |
| --- | --------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| BL1 | `eOpposite` non letto in importer (B.2 noto)              | `data.ts:875-900` | Costante `ECoreReference.eOpposite` non dichiarata, parseDReference non chiama `read(json, ..., eOpposite)` | Bidirezionalità persa al re-import. Round-trip fallisce.                              |
| BL2 | `EDataType` user-defined throws in package non-primitive  | `data.ts:706, 735` | Default case `Log.exx('unexpected xsitype...')`                                                      | Import di metamodelli con custom EDataType (es. UML2 Types.ecore inline) genera crash. |
| BL3 | `parseDAnnotation` dead code (`return []` prima istruzione) | `data.ts:644-645` | Implementazione mai completata                                                                       | Tutti i metadati legali/OCL/genmodel persi al re-import. UML2 si re-importa quasi vuoto. |
| BL4 | EEnumLiteral exporter usa `literal` come XML `name`       | `EcoreService.ts:408` | Confusione tra `name` (identifier) e `literal` (display label)                                       | Round-trip cambia gli identificatori dei letterali enum. Rotture downstream M1.        |
| BL5 | `eExceptions` non splitta per spazi                       | `data.ts:938`     | `[this.read(json, ECoreOperation.eexceptions, '')]` wrappa single string                             | Operazioni con N>1 exception perdono tutte tranne la prima al re-import.               |
| BL6 | EOperation exporter perde lowerBound/upperBound/ordered/unique/eExceptions | `EcoreService.ts:347-377` | `exportOperation` emette solo `name` + `eType`                                                       | Tutti i flag di multiplicity/ordering del return type persi all'export.                |
| BL7 | EParameter exporter perde lowerBound/upperBound/ordered/unique | `EcoreService.ts:382-395` | `exportParameter` emette solo `name` + `eType`                                                       | Idem per parametri.                                                                    |

### 3.2 Significativi (perdita di informazione, no errori runtime)

| ID  | Gap                                                                   | File                              | Effetto                                                                                |
| --- | --------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| SI1 | `eAnnotations` collezionate ma droppate per tutti gli element type     | `data.ts:644-672`                 | OCL / subsets / redefines / genmodel hints persi.                                      |
| SI2 | `defaultValueLiteral` né letto né scritto (importer ed exporter)       | `data.ts`, `EcoreService.ts:283`  | I default ai campi vengono persi sia all'import sia all'export.                        |
| SI3 | `iD` su EAttribute mai letto né scritto                                | `data.ts`, `EcoreService.ts`      | Flag chiave-primaria perso → tooling downstream perde la nozione di ID logico.         |
| SI4 | EOperation: default importer `lowerBound=1`, `ordered=false`, `unique=false` (errati) | `data.ts:935, 939, 940`           | Modelli con default impliciti vengono importati con valori diversi da EMF.             |
| SI5 | EParameter: stessi default importer errati `ordered=false`, `unique=false` | `data.ts:917, 918`                | Idem per parametri.                                                                    |
| SI6 | EEnum exporter omette `instanceClassName` e `serializable`             | `EcoreService.ts:400-414`         | Round-trip enum perde tipo Java associato e flag serializable.                         |
| SI7 | EClass exporter omette `instanceClassName`                             | `EcoreService.ts:198-255`         | Round-trip class perde tipo Java associato.                                            |
| SI8 | EClass: `instanceClassName` vs `instanceTypeName` collassati nel D-layer | `LModelElement.tsx:2624`, `data.ts:769` | Asimmetria EMF: chi distingue i due campi perde info al round-trip.                    |
| SI9 | EDataType user-defined non rappresentato                                | `data.ts`, `EcoreService.ts`      | Pacchetti con tipi custom non-primitivi non importabili (BL2) né esportabili.          |
| SI10 | EReference: `lowerBound` sempre emesso (anche 0)                       | `EcoreService.ts:313-315`         | Verbose, non-EMF-idiomatic.                                                            |

### 3.3 Minori (feature rare in metamodelli concreti)

| ID  | Gap                                                | Note                                                                              |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| MI1 | `eKeys` su EReference                              | UML2 ≈3-5 occorrenze; raro fuori da metamodelli industriali.                      |
| MI2 | `resolveProxies` su EReference                      | Tipicamente sempre true (default); rilevante solo per cross-resource refs.        |
| MI3 | `eGenericType` su Attribute/Reference/Param/Operation | Generics nei metamodelli: praticamente solo UML2 e Ecore.ecore stesso.            |
| MI4 | `eGenericSuperTypes` su EClass                     | Idem.                                                                             |
| MI5 | `eTypeParameters` su EClass/EDataType/EOperation    | Idem.                                                                             |
| MI6 | `eGenericExceptions` su EOperation                  | Combinazione di MI3 + eExceptions; ancora più raro.                               |
| MI7 | `container` su EReference: ambiguità derived/persistente | EMF lo deriva da opposite-of-containment; Jjodel lo persiste. No impatto se assente. |
| MI8 | `EAnnotation.contents` / `EAnnotation.references`  | Annotazioni con sub-EObject contents: usate per OCL annotations strutturate. Raro. |
| MI9 | EEnumLiteral: emit corretto separato di `literal`+`name` | Risolvibile insieme a BL4.                                                       |

---

## 4. Dipendenze tecniche

### 4.1 Gap risolvibili **senza** modificare D-layer (additive su importer/exporter)

- BL1 (eOpposite read) — solo aggiungere costante + `read()`.
- BL2 (EDataType in normal package) — aggiungere `parseDDataType` + branch nel switch.
- BL5 (eExceptions split) — modifica `data.ts:938`.
- BL6, BL7 (EOperation/EParameter exporter flags) — solo aggiungere righe a `exportOperation`/`exportParameter`.
- SI4, SI5 (default errati) — cambiare valori default nei `U.fromBoolString(..., correctDefault)`.
- SI6, SI7 (EEnum/EClass instanceClassName + serializable) — solo righe exporter.
- SI10 (lowerBound skip default) — modifica `EcoreService.ts:313`.
- BL4 + MI9 (EEnumLiteral fix) — exporter only.

### 4.2 Gap che **richiedono** modifica D-layer (e VersionFixer per persistenza esistente)

- SI2 (`defaultValueLiteral`): D-layer **ha già il campo**, solo wire I/O. → additive.
- SI3 (`iD`): D-layer ha `DAttribute.isID`, solo wire I/O. → additive.
- SI8 (instanceClassName vs instanceTypeName): se vogliamo distinguerli, serve aggiungere `DClass.instanceTypeName` separato + VersionFixer (perché modelli esistenti hanno solo `instanceClassName`).
- SI9 (EDataType in normal package): D-layer `DDataType` esiste. Serve solo wire importer (parseDDataType) + exporter (exportDataType). → additive.
- SI1 + BL3 (eAnnotations): D-layer `DAnnotation` esiste ma `DAnnotationDetail` è scheletro (no campi `key`/`value`). Serve **completare DAnnotationDetail** + VersionFixer per oggetti esistenti.
- MI1 (eKeys): richiede nuovo campo `DReference.keys: Pointer<DAttribute>[]`. + VersionFixer.
- MI2 (resolveProxies): richiede nuovo campo `DReference.resolveProxies: boolean = true`. + VersionFixer.
- MI3-MI6 (eGenericType, eGenericSuperTypes, eGenericExceptions, eTypeParameters): richiedono nuove D-classi `DGenericType`, `DTypeParameter` + relazioni containment + VersionFixer.

### 4.3 Path legacy vs path attivo

`generateEcoreJson_impl` su classi L (path JSON-based, `LModelElement.tsx`) è in molti casi **più completo** di `EcoreService.exportToXML`. Esempi:

- `LOperation.generateEcoreJson_impl` (riga 2346) emette ordered/unique/lowerBound/upperBound/eExceptions.
- `LParameter.generateEcoreJson_impl` (riga 2558) emette ordered/unique/lowerBound/upperBound.
- `LEnumerator.generateEcoreJson_impl` (riga 4499) emette serializable + instanceTypeName.
- `LEnumLiteral.generateEcoreJson_impl` (riga 4340) usa correttamente `name`, `value`, `literal` come campi distinti.

**Possibile strategy**: o riallineare il path attivo a quello legacy (e poi eliminare il legacy), o portare il path legacy a essere il path attivo + rimuovere `EcoreService.exportToXML`. Vedi OQ8.

---

## 5. Stima righe per gap

Stima conservativa, basata su pattern B.3.2 (~30 righe per "7 feature flag coordinato" su 2 funzioni, lato exporter+importer).

### 5.1 Blocker

| ID  | Item                                         | Righe importer | Righe exporter | Righe D-layer | Totale |
| --- | -------------------------------------------- | -------------: | -------------: | ------------: | -----: |
| BL1 | eOpposite read                                | 5              | 0              | 0             | 5      |
| BL2 | EDataType in normal package (parseDDataType + branch + exportDataType) | 20             | 25             | 0             | 45     |
| BL3 | parseDAnnotation completare + parseDAnnotationDetail | 35             | 0              | ~30 (DAnnotationDetail) | 65     |
| BL4 | EEnumLiteral exporter fix (name vs literal)   | 0              | 4              | 0             | 4      |
| BL5 | eExceptions split + multi-target              | 5              | 0              | 0             | 5      |
| BL6 | exportOperation lowerBound/upperBound/ordered/unique/eExceptions | 0              | 20             | 0             | 20     |
| BL7 | exportParameter lowerBound/upperBound/ordered/unique | 0              | 15             | 0             | 15     |
| **Subtotale Blocker** |                                    | **65**         | **64**         | **30**        | **159** |

### 5.2 Significativi

| ID   | Item                                         | Righe importer | Righe exporter | Righe D-layer | Totale |
| ---- | -------------------------------------------- | -------------: | -------------: | ------------: | -----: |
| SI1  | exportAnnotation in EcoreService              | 0              | 30             | 0             | 30     |
| SI2  | defaultValueLiteral wire (attr + ref)         | 8              | 6 (uncomment + ref) | 0             | 14     |
| SI3  | iD su EAttribute wire                         | 5              | 3              | 0             | 8      |
| SI4  | EOperation default fixes (3 fields)           | 6              | 0              | 0             | 6      |
| SI5  | EParameter default fixes (2 fields)           | 4              | 0              | 0             | 4      |
| SI6  | EEnum exporter serializable + instanceClassName | 0              | 6              | 0             | 6      |
| SI7  | EClass exporter instanceClassName             | 0              | 3              | 0             | 3      |
| SI8  | instanceTypeName separato (opzionale)         | 5              | 3              | 5 + VersionFixer | 25     |
| SI9  | EDataType end-to-end completo (coperto da BL2) | (incluso BL2) | (incluso BL2) | 0             | 0      |
| SI10 | lowerBound EReference skip default 0          | 0              | 2              | 0             | 2      |
| **Subtotale Significativi** |                              | **28**         | **53**         | **5+VF**      | **98** |

### 5.3 Minori

| ID  | Item                                         | Righe importer | Righe exporter | Righe D-layer | Totale |
| --- | -------------------------------------------- | -------------: | -------------: | ------------: | -----: |
| MI1 | eKeys                                        | 8              | 6              | 4 + VersionFixer | 25    |
| MI2 | resolveProxies                                | 5              | 4              | 3 + VersionFixer | 18    |
| MI3 | eGenericType (Attribute/Ref/Param/Op)         | 30             | 25             | ~80 (DGenericType) + VF | 150   |
| MI4 | eGenericSuperTypes                            | 10             | 8              | (riusa MI3)   | 18     |
| MI5 | eTypeParameters                               | 15             | 12             | ~50 (DTypeParameter) + VF | 90    |
| MI6 | eGenericExceptions                            | 8              | 6              | (riusa MI3)   | 14     |
| MI7 | container coerenza derived/persistente        | (no-op) o 3   | (no-op) o 2   | discussione   | 0-5   |
| MI8 | EAnnotation contents/references               | 15             | 10             | ~20 + VF      | 50     |
| **Subtotale Minori** |                                       | **91**         | **73**         | **~157 + VF** | **~365** |

### 5.4 Totale assoluto

- **Blocker**: ~159 righe.
- **Significativi**: ~98 righe (+ VersionFixer per SI8).
- **Minori**: ~365 righe (+ VersionFixer per MI1-6 e MI8).
- **Subset "tool definitivo" senza generics**: Blocker + Significativi + MI1 + MI2 + MI7 + MI8 ≈ **~257 + 98 + ~100 = ~455 righe**.
- **100% completo (incluso generics)**: ~620 righe + ~5 VersionFixer.

---

## 6. Raccomandazione sequenza

Ordine motivato dalle dipendenze e dalla criticità:

1. **W1 — Quick wins importer/exporter (additive, no D-layer)**: BL1 (eOpposite read), BL4 (EEnumLiteral name/literal), BL5 (eExceptions split), BL6+BL7 (Operation/Parameter exporter flags), SI4+SI5 (default fixes), SI6+SI7+SI10 (exporter polish). Tutto in `data.ts` + `EcoreService.ts`. ≈80 righe, alta resa, basso rischio. Allinea con backlog noto B.3.4.
2. **W2 — EDataType end-to-end (BL2 + SI9)**: aggiungere `parseDDataType` + `exportDataType` + branch nei switch. Sblocca import di metamodelli con tipi custom (es. UML2 Types). ≈45 righe.
3. **W3 — defaultValueLiteral + iD (SI2 + SI3)**: wire I/O su campi D-layer già esistenti. ≈22 righe. Test deve coprire round-trip su un metamodel con default + ID flag.
4. **W4 — EAnnotation end-to-end (BL3 + SI1)**: completare `DAnnotationDetail` (campi `key`/`value`), riscrivere `parseDAnnotation`, scrivere `exportAnnotation`. Richiede VersionFixer per modelli esistenti che potrebbero avere DAnnotationDetail vuoti. ≈95 righe + VF. Sblocca UML2 import semantico.
5. **W5 — instanceTypeName separato (SI8)**: opzionale; valutare se vale lo split o accettare collasso. Vedi OQ3.
6. **W6 — eKeys + resolveProxies (MI1 + MI2)**: campi semplici additive con VersionFixer. ≈43 righe.
7. **W7 — Generics (MI3 + MI4 + MI5 + MI6)**: blocco grande, completare solo se "tool definitivo" include generics in scope. ≈270 righe + 2 D-classi + VF. Vedi OQ1/OQ2.
8. **W8 — EAnnotation contents/references (MI8)**: ultima rifinitura. ≈50 righe.

Rationale: W1 ha rapporto valore/sforzo massimo (chiude 7 voci backlog con ≤80 righe). W2-W4 sono prerequisiti per "tool definitivo" perché UML2/Ecore.ecore real-world fanno uso pesante di EDataType, defaultValueLiteral e eAnnotations. W7 è il vero scope-decision point: senza generics, l'import di UML2 perde precision; ma il D-layer impact è enorme.

---

## 7. Open Questions

**OQ1 — ETypeParameter in scope?**
- Contesto: generics raramente usati in metamodelli concreti; presenti in UML2 (`Classifier::ownedTemplateParameter`), in Ecore.ecore stesso (`EClassifier::eTypeParameters`).
- Opzioni: (A) escludere — round-trip lossy per UML2; (B) includere come blocco W7; (C) skip-tolerant import (parsa lo XML ma droppa il dato nel D-layer, evita crash).
- Raccomandazione: (C) per W1-W6, valutare (B) come fase finale.

**OQ2 — EGenericType in scope?**
- Contesto: stessi argomenti di OQ1. EGenericType è il vero veicolo di parametrizzazione, ETypeParameter è la dichiarazione.
- Raccomandazione: vincolare alla decisione di OQ1.

**OQ3 — `instanceClassName` vs `instanceTypeName` distinguere o collassare?**
- Contesto: in Ecore standard sono campi distinti (FQ Java vs template name). In Jjodel collassati in `DClass.instanceClassName`, letto da `ECoreClass.instanceTypeName`.
- Opzioni: (A) lasciare collassato — round-trip lossy per pochi metamodelli che li distinguono; (B) split + VersionFixer — pulizia semantica, costo basso.
- Raccomandazione: (A) per ora, (B) se emerge un caso reale.

**OQ4 — `iD` su EAttribute è bloccante?**
- Contesto: usato per identificare attributi che fungono da chiave primaria. Importante per editor M1 (visualizzazione) e per generator code.
- Opzioni: (A) priorità W3; (B) rimandare.
- Raccomandazione: (A) — campo già nel D-layer, costo ~8 righe.

**OQ5 — `defaultValueLiteral`: dove memorizzare?**
- Contesto: D-layer ha già `DAttribute.defaultValueLiteral` (riga 4113) e `DReference.defaultValueLiteral` (riga 3755). EMF semantica: `defaultValueLiteral` è la stringa source, `defaultValue` è il valore typed (derived).
- Risposta: nessuna decisione da prendere — solo wire I/O sui campi esistenti.

**OQ6 — `DAnnotationDetail` ridisegno o estensione minimal?**
- Contesto: `DAnnotationDetail` (riga 147-151) ha solo `// todo` come body. Per supportare `<details key="K" value="V"/>` serve aggiungere campi.
- Opzioni: (A) campi diretti `key: string`, `value: string`; (B) flat dictionary su DAnnotation (`details: Record<string,string>`) eliminando DAnnotationDetail; (C) mantenere DAnnotationDetail come D-class con campi key/value (allineato a EMF EStringToStringMapEntry).
- Raccomandazione: (C) per fedeltà semantica + estensibilità futura (annotations possono essere elementi con metadata). Richiede VersionFixer.

**OQ7 — Path legacy `generateEcoreJson_impl` vs path attivo `EcoreService.exportToXML`?**
- Contesto: il path legacy su classi L è più completo, ma duplicato e separato. Mantenere entrambi è anti-DRY.
- Opzioni: (A) chiudere i gap solo sull'attivo, lasciare legacy in stato corrente; (B) sincronizzare i due path; (C) eliminare legacy e portare la sua logica nel path attivo.
- Raccomandazione: (A) per ora (focus su completezza), valutare (C) come refactor dedicato dopo W6.

**OQ8 — `EOperation.eExceptions` semantica: single-string back-compat?**
- Contesto: importer attuale wrappa string singola in array di 1 (`['']` se vuoto). Cambiare a split per spazi rompe metamodelli salvati con la semantica attuale?
- Risposta: i modelli esistenti non hanno mai avuto multi-exception (era già rotto), quindi cambiare a split è safe. Però il fallback `''` → `['']` produce un "fake exception" con stringa vuota — dovrebbe essere `[]`.

**OQ9 — `eFactoryInstance` su EPackage in scope?**
- Contesto: in EMF `EFactory` è generato dal model code generator e referenziato runtime. Non ha analogo in Jjodel (no codegen runtime).
- Raccomandazione: out-of-scope permanente.

**OQ10 — `container` su EReference: derived o persistente?**
- Contesto: EMF lo deriva da opposite-of-containment, Jjodel lo persiste come campo. Asimmetria semantica.
- Opzioni: (A) status quo (Jjodel persiste, importer legge se presente, exporter non emette — è già coerente con EMF derived); (B) rendere derived in Jjodel pure.
- Raccomandazione: (A) status quo. Nessun gap I/O reale.

---

## 8. Scoperte inattese (non nel backlog noto)

1. **EDataType user-defined throws** (BL2): l'importer fa crash su qualsiasi `ecore:EDataType` in pacchetto misto. Mai notato perché le fixture locali non hanno mai messo EDataType custom in pacchetti EClass-misti. Bug latente.
2. **EEnumLiteral exporter usa `literal` come XML `name`** (BL4): inversione semantica. Tutti i metamodelli esportati hanno enum literals con identificatori sbagliati. Round-trip rompe.
3. **`eExceptions` non splittato** (BL5): wrappa singola string, perde ogni eccezione oltre la prima. Mai esercitato (fixture non testano operations con exceptions).
4. **EOperation exporter perde lowerBound/upperBound/ordered/unique/eExceptions** (BL6): emette solo `name` + `eType`. Mai notato perché backlog B.3 era focalizzato su Attribute/Reference flags.
5. **EParameter exporter perde lowerBound/upperBound/ordered/unique** (BL7): idem BL6.
6. **EOperation/EParameter importer default `'false'` per ordered/unique** (SI4, SI5): doppio bug. Default EMF è `true`. Importing un metamodel "neutro" cambia silenziosamente i flag.
7. **EOperation importer default `lowerBound=1`** (SI4): è il return-multiplicity. EMF default è 0. Cambio silente.
8. **EClass/EEnum exporter perdono `instanceClassName`** (SI6, SI7): mai serializzato in output, ma letto in input. Asimmetria.
9. **EEnum exporter omette `serializable`** (SI6): flag EMF importante per generator config. Letto in input ma non emesso.
10. **EAnnotation parsing è dead code completo** (BL3, parzialmente noto): il backlog dice "schema D-layer mancante", ma in realtà `DAnnotation` **esiste** nel D-layer (riga 982). Manca completare `DAnnotationDetail` (solo scheletro) e riscrivere `parseDAnnotation` (oggi è `return [];`). Lo scope reale è minore di quanto suggerito dal backlog.
11. **`container` su EReference: campo D persistente, ma derived in EMF** (MI7): potenziale asimmetria fonte di confusione futura. Non un gap I/O, ma un disallineamento di modello da chiarire.
12. **Path legacy `generateEcoreJson_impl` è più completo del path attivo**: scoperta architetturale. Decisione di sequenza/refactor (vedi OQ7).
13. **Costante `ECoreReference.eOpposite` non esiste**: backlog B.2 menziona solo "parseDReference non legge l'attributo", ma il gap è ancora più profondo: la costante stessa non è dichiarata in `data.ts:1216-1234`. Va aggiunta nel pass W1.
14. **`isPrimitivePackage` filter silenziosamente droppa EDataType user-defined isolati**: i pacchetti che contengono solo EDataType vengono trattati come "primitive package aliases" e mappati ai primitive Jjodel. Questo è corretto per UML2 Types.ecore (Boolean, Integer aliases), ma se l'utente esporta un proprio metamodel di soli EDataType custom, viene silenziosamente cancellato senza warning. (Connesso a BL2/SI9.)
15. **Path importer per EAnnotation collezionato in 9 funzioni `parseDXxx`**: `getAnnotations(json)` è invocato in 9 luoghi (`data.ts:653,695,724,754,805,835,859,884,911,932,959`) ma il risultato finisce sempre in `parseDAnnotation` morto. Sforzo di riattivare le annotations è centralizzato in una sola funzione.

---

## 9. Conclusione operativa

- **Stato attuale Ecore I/O**: copre i casi base (single + multi-package classes con attributi/referenze base) ma ha 7 blocker + 10 significativi + 9 minori = 26 gap distinti rispetto a Ecore standard.
- **Sforzo per "tool definitivo" senza generics**: ~455 righe in 4-6 PR.
- **Sforzo per 100% (con generics)**: ~620 righe + 2 nuove D-classi + 5 VersionFixer.
- **Path consigliato**: W1 → W2 → W3 → W4 = ~242 righe per chiudere tutti i blocker + i significativi che non richiedono D-layer impact strutturale. Dopo W4, `iD` + EAnnotation + EDataType + Operation/Parameter completi → Ecore I/O coerente al ~85% per metamodelli industriali.

---

**Build status**: nessuna modifica a file source. Build invariata.
