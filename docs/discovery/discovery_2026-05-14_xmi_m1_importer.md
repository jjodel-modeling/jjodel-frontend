# Discovery — XMI M1 Importer (Phase A, read-only)

**Date:** 2026-05-14
**Branch:** `alfonso-frontend-jjtl`
**Working tree:** clean (1 commit ahead of `origin/alfonso-frontend-jjtl`)
**Status:** Read-only discovery completed. No files under `frontend/src/` modified.

---

## Step 0 — Setup verification

- `CLAUDE.md` letto (presente in conversazione).
- `docs/claude-code-log.md` letto (5554 righe; ultime entry pertinenti = Bug H cross-document EDataType del 2026-05-14, fase B Ecore importer del 2026-05-13).
- `git status`: clean, branch `alfonso-frontend-jjtl` ahead by 1 commit.
- I tre sample XMI (`sample-Persons.xmi`, `sample-Families.xmi`, `modelBook.xmi`) **non sono presenti sul filesystem** (`find -name '*.xmi'` ritorna vuoto). Sono allegati al prompt. La Phase B dovrà copiarli sotto `frontend/src/__tests__/fixtures/` (o equivalente) per smoke-testing.

**Path divergenze tra CLAUDE.md e reality**

| In CLAUDE.md | Vera posizione |
|---|---|
| `frontend/src/joiner/LModelElement.tsx` | `frontend/src/model/logicWrapper/LModelElement.tsx` (re-export da `joiner/index.ts:170`) |
| `frontend/src/services/export/DocumentClassifier.ts` | **Non esiste.** `find` su tutto l'albero ritorna vuoto. `git log` non ne ha mai tracciato il file. |

L'assenza di `DocumentClassifier.ts` è significativa: il prompt e i session notes lo nominano, ma è un file mai creato. La logica "XMI_M1_INSTANCE" descritta non esiste oggi. Vedi Sezione 8.

---

## Step 1 — Metamodel registry lookup by nsURI

### 1.1 Dove vive `nsURI` nel data layer

- **`DPackage.uri: string`** — `frontend/src/model/logicWrapper/LModelElement.tsx:1743`. È *l'unico* punto canonico dove il nsURI viene preservato.
- **`DModel`** non ha `uri`. Vedi `LModelElement.tsx:4626-4655`: il DModel ha `name`, `packages[]`, `isMetamodel`, `objects[]`, `models[]`, `instanceof?`. Niente uri.
- L'Ecore importer popola `dObject.uri` sul DPackage:
  - `frontend/src/api/data.ts:699` — single-package root: `dObject.uri = this.read(json, ECorePackage.nsURI, null);`
  - `frontend/src/api/data.ts:727` — subpackage: `dObject.uri = this.read(json, ECoreSubPackage.nsURI, null);`
- Il valore letto è la chiave `-nsURI` del JSON post-`xmlToJson` (definita in `data.ts:1294` come `ECorePackage.nsURI = EcoreParser.XMLinlineMarker + 'nsURI'`).

### 1.2 LPackage espone una `uri` derivata

`LModelElement.tsx:2027-2029`:
```typescript
protected get_uri(context: Context): this["uri"] {
    if (context.data.uri) return context.data.uri + "." + context.data.name;
    return undefined as any;
}
```

**ATTENZIONE:** il getter di L-layer concatena `data.uri + "." + data.name`. Per fare match esatto contro nsURI raw bisogna leggere `lpkg.__raw.uri` o `dpkg.uri`, **non** `lpkg.uri`. Altrimenti il match fallirebbe sempre.

### 1.3 Helpers esistenti

| Helper | Path | Cosa fa |
|---|---|---|
| `getMetamodelById(project, id)` | `jjscript/executor/resolvers.ts:199` | Per ID, non per nsURI |
| `findMetaclassByName(metamodel, name)` | `jjscript/executor/commands/instance.ts:74` | Cerca classe per nome — model + packages + subpackages ricorsivo (riusabile per XMI tag → DClass) |
| **`getMetamodelByNsURI` / `getPackageByUri`** | — | **Non esiste.** Va creato. |

### 1.4 Pattern di lookup raccomandato (lo fa già `parseM1Model`!)

`data.ts:501-506` mostra il pattern usato da `EcoreParser.parseM1Model` quando deve risolvere il metamodel da una namespace string:
```typescript
if (ns && !meta) {
    let allpkgs: LPackage[] = Selectors.getAll(DPackage, undefined, undefined, true, true);
    let matchpkg: LPackage[] = allpkgs.filter( (d) => d.uri === ns);
    meta = matchpkg[0]?.model;
}
```

Itera tutti i `DPackage` nel store, filtra per `uri === ns`, risale al `model` (LPackage.model è getter automatico verso il DModel/LModel containing). **Da riusare quasi 1:1.**

### 1.5 Lo store espone `m2models` come root array

`frontend/src/redux/store.tsx:116`:
```typescript
m2models: Pointer<DModel, 0, 'N'> = [];
```

L'auto-registrazione avviene in `classes.ts:937` (Constructors.DModel):
```typescript
thiss._persistCallbacks.push(SetRootFieldAction.create(
    isMetamodel ? "m2models" : "m1models", thiss.id, "+=", true
));
```

Anche `m1models` esiste come root field. **Quindi sia gli M2 che gli M1 sono globalmente indicizzati**, non solo per progetto.

### 1.6 Edge case: duplicate nsURI

**Nessuna guardia esiste oggi.** Se due metamodelli con stessa `uri` vengono caricati, `matchpkg[0]` ritorna il primo. Per l'Ecore importer (`handleEcoreFileChange` in `ProjectEditor.tsx:764`) non c'è check di unicità di uri prima del push. Da flaggare in Open Questions.

### Conclusione Step 1
- **Pronto:** il dato `nsURI` viene preservato come `DPackage.uri`; il pattern di lookup è già implementato in `parseM1Model:501-506`.
- **Da creare:** un helper dedicato `getMetamodelByNsURI(nsURI: string): LModel | null` ispirato a quel pattern, esposto dall'XMI importer.
- **Ambiguo:** comportamento in caso di duplicate uri (Open Q 1).

---

## Step 2 — API di creazione DObject

### 2.1 Signature canonica

`LModelElement.tsx:5663-5669`:
```typescript
public static new(
    instanceoff?: DObject["instanceof"],     // Pointer<DClass>
    father?: DObject["father"],              // Pointer<DModel> | Pointer<DValue>
    fatherType?: typeof DModel | typeof DValue,
    name?: DNamedElement["name"],
    persist: boolean = true
): DObject
```

### 2.2 Linking a DClass

`DObject.instanceof: Pointer<DClass>` (line 5659) — **puro pointer string**, non L-proxy.
Il framework lo persiste; `LObject.instanceof` getter espone l'L-proxy del DClass.

### 2.3 `findMetaclassByName` — riusabile

`jjscript/executor/commands/instance.ts:74-96`:
```typescript
function findMetaclassByName(metamodel: LModel, className: string): LClass | null {
    const visited = new Set<string>();
    const stack: any[] = [metamodel];
    while (stack.length > 0) {
        const container = stack.pop();
        if (!container || visited.has(container.id)) continue;
        visited.add(container.id);
        const classes = container.classes ?? [];
        for (const c of classes) {
            if (c?.name === className) return c as LClass;
        }
        const subpackages = container.subpackages ?? container.subPackages ?? [];
        for (const sp of subpackages) stack.push(sp);
        const packages = container.packages ?? [];
        for (const p of packages) stack.push(p);
    }
    return null;
}
```

**Risale model → packages → subpackages ricorsivo.** Tutti i sample MVP sono single-package, quindi anche un walker più semplice basterebbe, ma riusare questo è gratis.

### 2.4 Alternativa più potente: `LModel.getClassByNameSpace`

`LModelElement.tsx:5519-5521`:
```typescript
public getClassByNameSpace(namespacedclass: string): LClass | undefined { ... }
```

Usata da `parseM1Model:533`. Risolve un nome qualificato (es. `"pkg.Class"`). Per i nostri sample i tag XMI sono bare (`<Male/>`, non `<Persons:Male/>`), quindi `findMetaclassByName` è più diretto.

### 2.5 TRANSACTION e DObject.new

**Pattern documentato in `canvasToJjom.ts:1107-1108`:**
> IMPORTANT: Do NOT wrap DObject.new in an outer TRANSACTION — nesting causes x/y coordinates to be lost (see MEMORY.md).

`jjscript/executor/commands/instance.ts:227-233` segue lo stesso pattern:
```typescript
const dObject = (DObject as any).new(
    metaclass.id, targetModel.id, DModel, instanceName, true
);
```
*Non* dentro TRANSACTION. La `.new()` ne apre una interna.

Per **N DObject + N DValue**: l'opzione idiomatica è **una TRANSACTION SOLO attorno alla popolazione dei DValue (setting), separata dalle .new()**. Vedi `instance.ts:493-528`:
```typescript
TRANSACTION('JjScript: Set instance attribute', () => {
    const featureProxy = (lObject as any)['$' + args.property];
    featureProxy.value = primitive;
});
```

Quindi per l'XMI importer il pattern raccomandato è:
1. **Fuori TRANSACTION:** crea tutti i DObject (`.new()` apre TRANSACTION interna ciascuna). Tieni traccia in una mappa `xmlElement → DObject.id` o per nome.
2. **In una TRANSACTION sola:** scrivi tutti i DValue.value per gli attributi, e `refProxy.values = [...]` per i containment.

### Conclusione Step 2
- **Pronto:** `DObject.new` signature, `findMetaclassByName`, pattern TRANSACTION-per-DValue.
- **Da creare:** logica di walking sul JSON XMI che intercetta tag → invoca findMetaclassByName → invoca DObject.new.
- **Ambiguo:** strategia per N DObject — meglio singola TRANSACTION attorno al setting (raccomandata) o multipla. Vedi Open Q 2.

---

## Step 3 — API di populazione `DValue` per attributi

### 3.1 Struttura DValue

`LModelElement.tsx:6260-6312`:
```typescript
export class DValue extends DModelElement {
    id!: Pointer<DValue, ...>;
    father!: Pointer<DObject, 1, 1, LObject>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    values: PrimitiveType[] | Pointer<DObject|DEnumLiteral, 1, 'N', LObject|LEnumLiteral> = [];
    instanceof!: Pointer<DAttribute, 1, 1, LAttribute> | Pointer<DReference, 1, 1, LReference> | undefined;
    edges!: Pointer<DEdge, 0, 'N', LEdge>;
    isMirage!: boolean;
    // ...
}
```

**`values` è un array singolo per il DValue**, non N DValue per feature. Lo stesso DValue può tenere 1 (single-valued) o N (multi-valued) valori. La feature multiplicity è data dal metafeature (`upperBound`).

### 3.2 DValue.new signature

`LModelElement.tsx:6286-6297`:
```typescript
public static new(
    name?: DNamedElement["name"],
    instanceoff?: DValue["instanceof"],     // metafeature pointer
    val?: DValue["values"],
    father?: DValue["father"] | DObject,
    persist: boolean = true,
    isMirage: boolean = false
): DValue
```

### 3.3 DObject.features

`LModelElement.tsx:5660`:
```typescript
features: Pointer<DValue>[] = [];
```

Array di pointer ai DValue. **Un DValue per feature attributo o reference.**

### 3.4 Linking DObject → DValue: lo fa il framework

`data.ts:629-631` (`parseDValue`):
```typescript
let dValue: DValue = DValue.new(meta ? undefined : name, meta?.id, [], parent.id, true, false);
generated.push(dValue); dValue.father = parent.id;
parent.features.push(dValue.id);
```

Quindi: `DValue.new(...)` con `father = dObject.id` + push manuale su `parent.features`.

### 3.5 Type coercion: empiricamente cosa va nei `values`

`data.ts:633`:
```typescript
if (meta && meta.className === DAttribute.cname) { dValue.values = jsonvalues; return generated; }
```

Le `jsonvalues` arrivano da `parseDObject:613-616`:
```typescript
let values: any[];
if (Array.isArray(val)) values = val;
else if (val as unknown === undefined) values = [];
else values = [val];
```

Dove `val` è il valore raw del JSON, che per gli attributi XML è **sempre stringa**. Quindi:
- `EString` → `["Jim"]` (string)
- `EInt` → `["42"]` (**stringa**, non number!)
- `EBoolean` → `["true"]` (**stringa**)

Il D-layer non fa coercion. La coercion avviene altrove (rendering, evaluator) tramite type lookup sul metafeature. Per la consistency con l'Ecore parser, **l'MVP dovrebbe storare anche stringhe**.

(N.B. Il pattern L-proxy `featureProxy.value = primitive` di `instance.ts:504` invece accetta JS primitives — il framework coerce. Vedi 3.6.)

### 3.6 L-proxy vs D-layer: quale usare nell'importer

| Path | Pro | Contro |
|---|---|---|
| Diretto D-layer (`DValue.new(name, metaId, values, fatherId)`) | Più veloce, parsing in TRANSACTION singola | Bypassa validazioni proxy |
| L-proxy (`lObject['$' + featureName].value = primitive`) | Idiomatic, type coercion automatica, validazioni | Richiede prima `LPointerTargetable.fromD(dObject)`; il proxy NON è disponibile immediatamente dopo `DObject.new` (vedi CLAUDE.md "deferred attribute setting") |

**Importatori del codebase a confronto:**
- `EcoreParser.parseDValue` (data.ts:624) — usa **D-layer diretto** (`DValue.new`, `dValue.values = ...`).
- `JjScript executeSetInstance` (instance.ts:493) — usa **L-proxy** (`featureProxy.value = primitive`), perché agisce su DObject già esistenti.
- `canvasToJjom syncUpdateFeatureValue` (line 1233) — usa **L-proxy** ma in TRANSACTION separata, sempre su DObject pre-esistenti.

**Raccomandazione per XMI M1 importer:** **D-layer diretto** (come `parseDValue`), perché:
- Si crea contestualmente DObject + DValue (no proxy yet)
- Si evita il problema deferred-attribute-setting documentato in CLAUDE.md
- Pattern già provato dall'Ecore importer

### Conclusione Step 3
- **Pronto:** signature `DValue.new`, pattern `parent.features.push(dValue.id)`, pattern D-layer diretto.
- **Da creare:** loop di walking sui figli del tag XMI che chiama `DValue.new` per attributi.
- **Ambiguo:** type coercion XML→JS (numbers/bool come stringhe vs primitivi). Vedi Open Q 3.

---

## Step 4 — XMIService esistente

### 4.1 File trovato

`frontend/src/services/export/XMIService.ts` (513 righe). **Già esiste, già implementato in modo non-trivial.**

### 4.2 Surface API attuale

| Metodo | Implementazione | Adatto al MVP? |
|---|---|---|
| `XMIService.exportToXML(model, options)` | ✅ Implementato (54-117) — emette XMI con embedded metamodel opzionale | Indiretto: ci dà un contratto su che shape NON usare per parsing (vedi 4.3) |
| `XMIService.exportToFile(model, options)` | ✅ Implementato (122-134) — download blob | N/A |
| `XMIService.importFromXML(xmlString, filename)` | ✅ Implementato (320-410) — tenta estrarre embedded metamodel; delega a `EcoreParser.parse(json, false, ...)` per le istanze | **No.** Assume embedded metamodel; per i nostri sample falsche-positive il branch "warning: no embedded metamodel" e poi delega a `parseM1Model` (vedi Step 1.4 + 4.4) |
| `XMIService.importFromFile(file)` | ✅ Implementato (415-435) | Stesso problema |
| `XMIService.xmlToJson` | ✅ Implementato (461-496) — riusabile per il nuovo path | ✅ Riusabile o ricreabile (è ~35 righe) |

### 4.3 Shape dell'export emesso (per riferimento contrattuale)

`XMIService.exportToFile` produce, esempio:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.0"
  xmlns:xmi="http://www.omg.org/XMI"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
  xmlns:persons="http://jjodel.org/Persons">

  <!-- Embedded Metamodel for standalone import -->
  <xmi:Documentation>
    <embeddedMetamodel>... ecore content ...</embeddedMetamodel>
  </xmi:Documentation>

  <!-- Model Instances -->
  <persons:Male xmi:id="..." firstName="Jim">
    <subRef xsi:type="persons:Male" xmi:id="..." firstName="Bob" />
  </persons:Male>
</xmi:XMI>
```

**Differenze importanti con i sample reali:**
- XMIService usa **prefix namespace** (`xmlns:persons="..."` + tag `<persons:Male>`). I sample reali usano **default xmlns** (`xmlns="Persons"` + tag `<Male>`).
- XMIService usa `xmi:id` per ogni elemento (preservation per import successivi). I sample no.
- XMIService embedda l'Ecore inline; i sample no.
- XMIService emette `xsi:type` su containment per polimorfismo; i sample no.

**Conclusione contrattuale:** un file generato da `XMIService.exportToFile` ha shape **DIVERSA** dai sample. L'XMI M1 importer deve trattare entrambi (o solo i sample, lasciando il roundtrip del proprio output come scope post-MVP).

### 4.4 Cosa fa `XMIService.importFromXML` sui sample (analisi statica)

Tracciatura mentale per `sample-Persons.xmi`:

1. **Parse XML to DOM** → OK.
2. **`doc.querySelector('embeddedMetamodel ecore\\:EPackage')`** → null (i sample non hanno embedded).
3. `warnings.push('No embedded metamodel found in XMI - looking for existing metamodel');`
4. `findModelNamespacePrefix(xmiRoot)` — itera `xmlns:*`; salta xmi/xsi/ecore. **Ritorna stringa vuota** per i nostri sample (hanno solo `xmlns:xmi` default + `xmlns="Persons"`, non un prefix namespace).
5. `xmlToJson(xmiRoot)` → `{ "-xmi:version": "2.0", "-xmlns:xmi": "http://...", "-xmlns": "Persons", "Male": [...], "Female": [...] }`.
6. `EcoreParser.parse(modelJson, false, filename, true)` → dispatcha a `parseM1Model(json, undefined, filename)`.
7. **`parseM1Model:494-500`** — la funzione `findns` cerca il primo `:` in una key di livello 1 o 2. Per i nostri sample, nessuna key ha `:` (le keys sono `Male`, `Female`, `-xmi:version`, `-xmlns:xmi`, `-xmlns`). Aspetta — `-xmi:version` HA `:` a position 4. Quindi `findns` ritornerebbe `"-xmi"` come ns. **Bug: questo NON è il metamodello.**
8. **`parseM1Model:501-506`** — cerca `DPackage` con `uri === "-xmi"`. Nessun match. `meta` resta `undefined`.
9. Crea `DModel` shapeless (no instanceof).
10. Itera root keys. Per `Male`, `Female` crea DObject senza metaclass. Tutti gli attributi diventano DValue senza metafeature.

**Conclusione:** `XMIService.importFromXML` + `EcoreParser.parseM1Model` **non funzionano per i sample MVP**. Risulterebbero in un M1 model shapeless. Il bug-piccolo è il `findns` che pesca `-xmi` come namespace.

Questo conferma la decisione architetturale del prompt di **separare entry point e logica**.

### Conclusione Step 4
- **Pronto:** `XMIService.xmlToJson` (riusabile o riscrivere). `XMIService.escapeXml` (non serve all'import).
- **NON pronto:** `XMIService.importFromXML` ha un percorso che assume embedded metamodel e delega a `parseM1Model` che non handle default xmlns. Servirebbe modifiche significative per supportare i sample MVP.
- **Da creare:** un nuovo metodo `XMIService.importM1FromFile(file, projectM2models)` (oppure nuova classe `XMIImporter`) che:
  1. Parse XML
  2. Legge `-xmlns` attribute del root → nsURI
  3. Risolve metamodello via `state.m2models` filter su `pkg.uri === nsURI`
  4. Walks i child tags → DObject + DValue
- **Nota:** la decisione "XMIImporter come nuovo servizio" del prompt va riconciliata con l'esistenza di XMIService. Vedi Open Q 4.

---

## Step 5 — Containment references: come popolare un DValue di tipo reference

### 5.1 Containment vs non-containment

Il flag rilevante è su `LReference.composition` (e l'alias `containment`). Visto in `XMIService.ts:176`:
```typescript
if (refMeta.composition || refMeta.containment) { ... }
```

E in `LModelElement.tsx:6379`:
```typescript
let lref: LReference = this.get_instanceof(c) as LReference;
let dref = lref.__raw;
if (dref.composition || dref.aggregation) for(let v0 of this.get_values(c)) { ... }
```

Quindi per detect containment in metafeature: `(metafeature as LReference).composition === true`.

### 5.2 Single-valued containment: come popolare

Dato:
```xml
<Family lastName="March">
  <father firstName="Jim"/>
</Family>
```

L'approccio del codebase è in `EcoreParser.parseDValue:624-642`:
```typescript
let dValue: DValue = DValue.new(meta ? undefined : name, meta?.id, [], parent.id, true, false);
generated.push(dValue); dValue.father = parent.id;
parent.features.push(dValue.id);

if (meta && meta.className === DAttribute.cname) { dValue.values = jsonvalues; return generated; }

for (let v of jsonvalues) {
    if (typeof v !== "object") { dValue.values.push(v); continue; }
    EcoreParser.parseDObject(v, dValue, DValue, (meta as LReference)?.type, generated);
}
```

Cose da notare:
- **Per il containment, `parent` del child DObject è il DValue, non il DObject originale.** `parseDObject(v, dValue, DValue, ...)` con `parentType = DValue`.
- Dentro `parseDObject:591-592`: `if (parentType === DValue) (parent as DValue).values.push(dObject.id);`. **Il pointer del child finisce in `parentDValue.values`.**

Quindi la struttura risultante:
```
Family (DObject)
  features: [Value_lastName, Value_father]
  Value_lastName: { instanceof: LAttribute_lastName, values: ["March"] }
  Value_father:   { instanceof: LReference_father, values: [Jim.id] }
    father (the child Jim DObject)
      father pointer: Value_father.id (not Family.id directly!)
      instanceof: LClass_Member
```

### 5.3 Multi-valued containment

Per `<Family><sons firstName="John"/><sons firstName="Mike"/></Family>` (xml2json crea array `sons: [{...}, {...}]`):
- Una sola `Value_sons` DValue
- `Value_sons.values = [John.id, Mike.id]`
- John e Mike sono entrambi DObject con `father = Value_sons.id`

### 5.4 Bidirectional opposite

**Cercato:** `grep eOpposite` in `LModelElement.tsx` e `data.ts`.

- `data.ts:1207-1208`: `ECoreReference.eOpposite = '-eOpposite';` — riconosciuto come campo del DReference (M2).
- `LReference` proxy ha `eOpposite` come pointer al lato opposto (definito nella metaclasse).
- **Nessun meccanismo auto-popolante trovato** che sincronizza una scrittura `family.father = jim` con `jim.familyFather = family`. Il framework si fida che i sync sync chi scrive.
- Il pattern EMF (auto-materialize opposite at load) non è implementato.

**Implicazione MVP:** se i sample avessero reference non-containment con eOpposite, l'XMI importer dovrebbe esplicitamente popolare entrambi i lati. **Per fortuna i tre sample non hanno reference non-containment serializzate** (i .ecore di Families ha `Member.familyFather` ma non viene serializzata; EMF la materializza al load).

### 5.5 Pattern alternativo via L-proxy (post-creation)

Per riferimento (NON consigliato per l'importer, ma idiomatic in altri scenari): vedi `canvasToJjom.ts:1253-1321` `syncCreateCompositionLink`:
```typescript
TRANSACTION('EditorV2 create composition link', () => {
    const refProxy = (parentObject as any)['$' + referenceName];
    const rawVals: any[] = refProxy.__raw?.values ?? [];
    const meaningful = rawVals.filter((v: any) => v != null && v !== '');
    refProxy.values = [...meaningful, childObject.id];
    // + DVoidEdge.new2(...)
});
```

Questo pattern è per **post-fact linking di DObject già esistenti**. Per l'XMI importer, dove creiamo il child contestualmente, il pattern `parseDValue → parseDObject(v, dValue, DValue, ...)` è strutturalmente più pulito perché il framework gestisce internamente `parent.values.push(child.id)`.

### Conclusione Step 5
- **Pronto:** pattern `parseDValue → parseDObject` con `parentType = DValue` per containment.
- **Da creare:** la logica di walking ricorsivo che propaga `parentType` correttamente.
- **Limitazione documentata:** opposite refs non auto-popolate. Per ora non rilevante (sample non hanno non-containment).
- **Ambiguo:** quale upperBound enforcement? Vedi Open Q 5.

---

## Step 6 — ProjectEditor integration

### 6.1 `handleEcoreFileChange` — blueprint per `handleXmiFileChange`

`frontend/src/components/project/ProjectEditor.tsx:764-806`:
```typescript
const handleEcoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const result = await EcoreService.importFromFile(file);

        if (result.success && result.model) {
            // Link imported metamodel to current project (Bug F fix 2026-05-13):
            // EcoreParser.parse() pushes the DModel to state.m2models but does NOT update
            // project.metamodels. Without this, Dashboard shows metamodelsNumber=0 because
            // metamodelsNumber is computed from project.metamodels.length at save time.
            try {
                project.metamodels = [...project.metamodels, result.model];
                if (result.model.node) {
                    project.graphs = [...project.graphs, result.model.node as any];
                }
            } catch (linkErr) {
                console.warn('[Bug F fix] Failed to link imported metamodel to project:', linkErr);
            }
            U.alert('i', 'Imported', `Metamodel "${result.model.name}" imported from Ecore`);
            markDirty();

            if (result.warnings.length > 0) {
                console.warn('Ecore import warnings:', result.warnings);
            }
        } else {
            throw new Error(result.errors.join(', '));
        }

    } catch (error) {
        console.error('Import Ecore error:', error);
        U.alert('e', 'Import Failed', `Could not import Ecore: ${(error as Error).message}`);
    }

    if (importEcoreRef.current) {
        importEcoreRef.current.value = '';
    }
};
```

**Punti di adattamento per `handleXmiFileChange`:**
- Sostituire `EcoreService.importFromFile` con il nuovo XMI M1 import method.
- `project.metamodels = [...]` → diventa `project.models = [...]` (M1, non M2). Verifica `LProject.models` esista (vedi 6.3).
- `project.graphs = [..., result.model.node]` — vale anche per M1? Vedi 6.4.

### 6.2 Bottone "Import Ecore (.ecore)"

`ProjectEditor.tsx:1993-1999`:
```tsx
<button
    className="import-select-menu__item"
    onClick={handleImportEcore}
>
    <i className="bi bi-file-earmark-code" />
    Import Ecore (.ecore)
</button>
```

E il file input nascosto `ProjectEditor.tsx:2583-2589`:
```tsx
<input
    ref={importEcoreRef}
    type="file"
    accept=".ecore"
    style={{ display: 'none' }}
    onChange={handleEcoreFileChange}
/>
```

Pattern handler:
- `importEcoreRef = useRef<HTMLInputElement>(null)`
- `handleImportEcore` = `() => { importEcoreRef.current?.click(); setShowImportMenu(false); }` (line 759-762)

**Importante:** il dropdown è dentro la sezione `metamodels` (vedi line 2002 `metamodels.length === 0 ?` immediatamente dopo). Per "Import Model" il dropdown vorrebbe stare dentro la **sezione models**. Cercare l'analoga `SectionHeader` per `models` in ProjectEditor.

### 6.3 `LProject.models` esiste?

`classes.ts:2992-2993` (DProject.new signature):
```typescript
public static new(type: DProject['type'], name?: string, state?: DProject['state'],
                  m2?: DProject['metamodels'], m1?: DProject['models'], id?: DProject['id'], otherProjects?:LProject[]): DProject
```

`m1` = `DProject['models']`. Quindi sì, **`DProject.models` è il campo M1.**

Cerca proprietà: classes.ts ha `metamodels` e `models` come array distinte. Per l'XMI importer:
```typescript
project.models = [...project.models, result.model];
```

### 6.4 `project.graphs` anche per M1?

L'auto-popolazione di useJjomSync crea DGraph per ogni DModel. Vedi Step 7 e `useJjomSync.ts:504-510`:
```typescript
if (needsNewGraph) {
    const dGraph = DGraph.new(0, modelid);
    graphId = dGraph.id;
    TRANSACTION('Tag v2-flow graph', () => {
        SetFieldAction.new(graphId, 'graphStyle', 'v2-flow', '', false);
        SetRootFieldAction.new('graphs', graphId, '+=', true);
    });
}
```

**Il graph viene auto-creato da `useJjomSync` quando il modello viene aperto, non dall'importer.** Quindi:
- `result.model.node` esiste solo se il graph è stato già creato. Subito dopo `DModel.new`, `.node` può essere undefined.
- L'EcoreImporter setta `project.graphs = [..., result.model.node]` SE `result.model.node` esiste; altrimenti skip silenzioso.

**Per l'XMI M1 importer:** stessa logica difensiva. Probabilmente `result.model.node` sarà undefined alla fine di `importFromFile` (no graph yet), e va bene — `useJjomSync` lo creerà al primo open.

### 6.5 EcoreService.importFromXML vs EcoreParser.parse direct call

Per l'XMI importer dobbiamo decidere se:
- (a) Aggiungere un metodo a `XMIService` chiamato dall'handler.
- (b) Creare un nuovo file `XMIM1Importer.ts` o simile.

Coerentemente con il prompt ("nuovo servizio XMIImporter, verificare nome esatto"): siccome `XMIService` esiste già ed è il candidato naturale, l'opzione (a) `XMIService.importM1FromFile(file, options)` minimizza il fan-out di file ma confina il nuovo codice a un file esistente. Vedi Open Q 4.

### Conclusione Step 6
- **Pronto:** il blueprint `handleEcoreFileChange` clonabile linea per linea con sostituzioni minimali.
- **Da creare:** `handleXmiFileChange`, `handleImportXmi`, `importXmiRef`, bottone "Import Model" nella sezione M1, file input nascosto `accept=".xmi"`.
- **Ambiguo:** Posizione esatta del bottone nel JSX (sezione models, dove esattamente). Verificabile in B.1.

---

## Step 7 — useJjomSync preconditions

### 7.1 Step 2bis (auto-DVertex per DObject orfani) — ATTIVO

`useJjomSync.ts:536-567`:
```typescript
// Step 2bis: Create missing M1 object vertices.
// JjScript and JjTL transformations create DObject instances directly,
// without creating their corresponding DVertex in the flow graph. This
// step ensures every DObject in the model is represented in the graph.
if (missingObjectsCount > 0) {
    // ... layout grid ...
    for (const objId of (rawModel.objects ?? [])) {
        if (typeof objId !== 'string') continue;
        const dObj = idlookup[objId] as any;
        if (!dObj) continue;
        if (vertexIdByModelId.has(objId)) continue;
        if (isSingletonSuppressed(objId)) continue;
        // ...
        const size = new GraphSize(x, y, 200, 120);
        const dv = DVertex.new(0, objId, graphId, graphId, undefined, size);
        // ...
    }
}
```

### 7.2 Step 4 (auto-DVoidEdge per M1 reference values) — ATTIVO

`useJjomSync.ts:636-689`:
```typescript
// Step 4: Create missing M1 instance reference edges.
// For each DObject in the model, scan its reference features and
// create DVoidEdge for every (sourceVertex, targetVertex) pair that
// doesn't have an edge yet.
if (missingM1EdgeCount > 0) {
    // ...
    for (const objId of (rawModel.objects ?? [])) {
        // ...
        for (const featId of (dObj.features ?? [])) {
            const dFeat = ...;
            const metaId = dFeat.instanceof;
            const meta = ...;
            if (!meta || meta.className !== 'DReference') continue;
            for (const tgtObjId of (dFeat.values ?? [])) {
                // ...
                DVoidEdge.new2(metaId, graphId, graphId, undefined, srcVertex, tgtVertex, ...);
            }
        }
    }
}
```

### 7.3 Dipendenze dell'useEffect

`useJjomSync.ts:698`:
```typescript
}, [modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]);
```

**Selettori:**
- `modelObjectCount` (line 299): conta `rawModel.objects.length`
- `modelClassCount` (line 307): conta classi nei package
- `modelRefCount` (line 322): conta references nei DClass

**`modelObjectCount` cambia quando `rawModel.objects` cambia.** Ogni `DObject.new` con `parentType = DModel` fa `parent.objects.push(dObject.id)` (vedi `parseDObject:591`). Anche le creazioni dentro containment (`parentType = DValue`) finiscono nei DValue.values, **ma non aumentano `objects` array del DModel direttamente** — solo il root finisce in `rawModel.objects`.

**WAIT.** Verifica: i child contenuti finiscono in `rawModel.objects` o solo nei DValue?

Da `parseDObject:589-593`:
```typescript
generated.push(dObject); dObject.father = parent.id;
if (parent) {
    if (parentType === DModel) (parent as DModel).objects.push(dObject.id);
    else (parent as DValue).values.push(dObject.id);
}
```

**Risposta: solo i root DObject (parentType === DModel) finiscono in `model.objects`. I containment-nested NON.** Questo è un comportamento da verificare empiricamente — potrebbe essere che `model.objects` debba contenere TUTTI i DObject del modello (root + nested), oppure solo i root.

`useJjomSync.ts:547` itera `rawModel.objects` per il Step 2bis. **Se i child nested non sono in `model.objects`, allora non avranno mai un DVertex auto-creato.**

Questo è un bug latente da chiarire. Vedi Open Q 6.

Workaround: l'XMI importer potrebbe esplicitamente aggiungere TUTTI i DObject (root + nested) a `model.objects` post-creazione, per garantire visibilità nel canvas.

### 7.4 La nota di CLAUDE.md sui "modelRefValueCount"

CLAUDE.md menziona: "l'auto-populate effect ha dipendenze che NON includono `modelRefValueCount` (feature-hash dei DObject), quindi `set X.refName = Y` non re-attiva l'effect."

**Per l'XMI importer:**
- Creiamo TUTTI i DObject + popoliamo TUTTI i DValue in una sequenza atomica.
- `rawModel.objects.length` cambia (per i root); `modelObjectCount` cambia.
- L'effect si re-trigga al *fine* dell'importazione (o durante; React batch updates lo decide).
- Step 4 (auto-DVoidEdge) viene eseguito leggendo l'intero stato attuale; se le reference values sono già popolate, gli edge vengono creati.

**Conclusione 7.4:** non è un problema per l'XMI importer perché creiamo DObject E popoliamo DValue nella stessa "fase" — `modelObjectCount` cambia sufficientemente per riattivare l'effect. **A meno che** la TRANSACTION batch tutti i changes e l'effect veda solo lo stato finale — ma quello sarebbe comunque OK perché lo stato finale ha le values già popolate.

### Conclusione Step 7
- **Pronto:** Step 2bis + Step 4 attivi e correttamente dipendenti da `modelObjectCount`.
- **Caveat:** i DObject nested via containment non finiscono in `model.objects` direttamente (`parseDObject:592`). Step 2bis vede solo i root.
- **Da fare in B:** decidere se l'XMI importer aggiunge ESPLICITAMENTE tutti i nested objects a `model.objects` per garantire la creazione di DVertex per ognuno.

---

## Step 8 — DocumentClassifier oggi cosa fa per un XMI M1

### 8.1 File NON esiste

```bash
find /Users/alfonso/jjodel -name 'DocumentClassifier*' → vuoto
git log --all -- '**/DocumentClassifier*'             → vuoto
grep -rn 'DocumentClassifier' frontend/src/           → vuoto
```

**`DocumentClassifier.ts` non esiste nel repository.** Né nel filesystem né nella storia git.

Le sessioni 2026-05-13 menzionate nel prompt e in CLAUDE.md (`sessione_2026-05-13_3.md`) sembrano riferirsi a un componente che non è mai stato committato, oppure è stato rimosso senza traccia, oppure il nome è cambiato. Non ho trovato un sostituto ovvio (es. nessun file `*Classifier*.ts` in `services/`).

### 8.2 Implicazioni

- La logica "XMI_M1_INSTANCE detection" descritta nel prompt **non esiste in codice**.
- Non c'è oggi un toast errore "this looks like an M1 instance" da disabilitare/redirigere.
- Per il MVP non c'è nessun routing da modificare/evitare. Entry point separato è semplicemente un nuovo handler.

### 8.3 Possibile utility condivisa

Il prompt chiede di valutare l'estrazione di un rilevatore "default xmlns" in utility condivisa. **Valutazione:**

- L'Ecore importer e l'XMI M1 importer hanno entrambi `xmlToJson` quasi identico (XMIService.ts:461 vs EcoreService.ts:461). Già una piccola duplicazione esiste.
- Rilevare il default xmlns sul root è 5 righe:
  ```typescript
  function getDefaultXmlns(jsonRoot: any): string | null {
      return jsonRoot['-xmlns'] || null;
  }
  ```
- Estrarre una utility a parte aggiungerebbe un file/import senza un secondo cliente concreto.

**Raccomandazione:** non estrarre nell'MVP. Inline nell'XMI importer. **Riconsiderare quando** si aggiunge un terzo formato (es. UML2.xmi).

### Conclusione Step 8
- **Pronto:** nulla (DocumentClassifier non esiste).
- **Da creare:** nulla nell'MVP — il rilevamento default-xmlns è inline (5 righe).
- **Ambiguo:** se "DocumentClassifier" è un componente pianificato ma non implementato, o se è una documentazione stale. Vedi Open Q 7.

---

## Step 9 — JSON shape post-xmlToJson per gli XMI sample

Ragionato sulla logica di `xmlToJson` in `XMIService.ts:461-496` (e `EcoreService.ts:461-496`, identica). Comportamento:
- Ogni attributo XML → key con prefix `-` (es. `-fullName`).
- Ogni child element → key con tagName (no prefix). Se il tag si ripete, **il secondo crea un array** (line 477-484).
- Il `textContent` di un elemento foglia diventa la value direttamente (line 489-491), oppure va in `'#text'` se ci sono attributi/figli.

### 9.1 sample-Persons.xmi (atteso)

```xml
<xmi:XMI xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns="Persons">
  <Male fullName="Jim March" age="42"/>
  <Male fullName="Bob March" age="9"/>
  <Female fullName="Diane March" age="40"/>
  ...
</xmi:XMI>
```

**JSON atteso post-`xmlToJson(documentElement)`:**
```json
{
  "-xmi:version": "2.0",
  "-xmlns:xmi": "http://www.omg.org/XMI",
  "-xmlns": "Persons",
  "Male": [
    { "-fullName": "Jim March", "-age": "42" },
    { "-fullName": "Bob March", "-age": "9" },
    // ... 3 more
  ],
  "Female": [
    { "-fullName": "Diane March", "-age": "40" },
    // ... more
  ]
}
```

**Note:**
- `-age` resta stringa `"42"` (non number) — `xmlToJson` non type-coerce.
- Se `Male` appare 5 volte, è un array di 5 oggetti. Se appare 1 volta, è un singolo oggetto (non array di 1). **Importante:** il walker deve normalizzare `Array.isArray(val) ? val : [val]` come fa `parseDObject:613-616`.

### 9.2 sample-Families.xmi (atteso)

```xml
<xmi:XMI xmi:version="2.0" xmlns:xmi="..." xmlns="Families">
  <Family lastName="March">
    <father firstName="Jim"/>
    <mother firstName="Diane"/>
    <sons firstName="John"/>
    <sons firstName="Mike"/>
    <daughters firstName="Sarah"/>
  </Family>
  <Family lastName="Smith">
    ...
  </Family>
</xmi:XMI>
```

**JSON atteso:**
```json
{
  "-xmi:version": "2.0",
  "-xmlns:xmi": "http://www.omg.org/XMI",
  "-xmlns": "Families",
  "Family": [
    {
      "-lastName": "March",
      "father":  { "-firstName": "Jim" },
      "mother":  { "-firstName": "Diane" },
      "sons":    [ { "-firstName": "John" }, { "-firstName": "Mike" } ],
      "daughters": { "-firstName": "Sarah" }
    },
    {
      "-lastName": "Smith",
      // ...
    }
  ]
}
```

**Note critiche:**
- `father` appare 1 volta → oggetto singolo (non array). Il walker, per uniformità, dovrebbe wrappare come `[val]`.
- `sons` appare 2 volte → array di 2 oggetti.
- `daughters` 1 volta → oggetto singolo.

**Asimmetria:** il walker deve consultare il metafeature per sapere se è single- o multi-valued, e normalizzare il JSON di conseguenza. Pattern già usato in `parseDObject:613-616`.

### 9.3 Distinzione attribute / child

**L'unica convenzione è il prefix `-`** per gli attributi (vedi `xmlToJson:465-468`). Niente altre convenzioni speciali. Il `'#text'` key è usato solo se un elemento ha sia text content che children/attributes — non si verifica nei nostri sample.

### 9.4 Incertezze residue (verificabili empiricamente in B.1)

- **`textContent` con whitespace-only:** `xmlToJson:487` fa `trim()`. Se un elemento ha solo whitespace tra i tag (es. pretty-printed XML), `textContent` è "" → la condizione del line 487-491 non scatta. ✅ OK.
- **`xmi:version` su elementi nested:** se compare su `<father xmi:version="2.0">`, viene letto come attributo `-xmi:version`. Per i nostri sample non compare su nested.
- **`xmi:id` sui nostri sample:** assenti (prompt lo conferma). Se ci fossero, sarebbero `-xmi:id` e il walker dovrebbe ignorarli (decisione architetturale #4: ignorati nell'MVP).

### Conclusione Step 9
- **Atteso:** JSON shape descritta sopra, con normalize `Array.isArray(val) ? val : [val]` per gestire single-vs-multi.
- **Verificabile in B.1:** comportamento di `xmlToJson` su tag con texto contenuto E attributi (non rilevante per i sample).
- **Cleanup:** se `XMIService.xmlToJson` viene riusato, è già robust per il caso MVP.

---

## Step 10 — Open questions per Alfonso

1. **Duplicate nsURI tra metamodelli loaded.** Cosa fare se due metamodelli loaded hanno `pkg.uri === <nsURI>`? Il pattern `parseM1Model:503` ritorna `matchpkg[0]?.model` — il primo trovato. **Proposta MVP:** se trovati >1, mostrare errore esplicito "ambiguous metamodel" + lista nomi; chiedere a future Phase di aggiungere picker UI.

2. **TRANSACTION granularity per N DObject.** Tre opzioni:
   - (a) Nessuna TRANSACTION outer (ogni `.new` ha la sua); 1 TRANSACTION attorno al setting di TUTTI i DValue.
   - (b) 1 TRANSACTION attorno a TUTTO (richiede `.new` patchato o usato senza TRANSACTION interna — non fattibile col pattern esistente).
   - (c) Nessuna TRANSACTION outer; ogni DValue.value setting in TRANSACTION individuale.
   **Raccomandazione:** (a). 1 TRANSACTION attorno al "popola tutti i DValue" è atomic, undoable, e non confligge con `DObject.new` che apre la sua. Vedi Step 2.5 + canvasToJjom.ts:1107.

3. **Type coercion XML→JS per attributi.** L'XML rappresenta tutti gli attributi come stringa. Decisione MVP:
   - (a) Storiare come stringhe nei `DValue.values` (come fa `parseDValue:633`).
   - (b) Coerce su tipo metafeature (`EInt` → `parseInt`, `EBoolean` → `=== "true"`).
   **Raccomandazione:** (a) per coerenza con Ecore importer; coercion avviene nel rendering/evaluator. Documentare come known limitation.

4. **Riconciliazione con `XMIService` esistente.** Opzioni:
   - (a) Aggiungere metodo `XMIService.importM1FromFile(file)` separato dal existing `importFromFile` (che resta per il path embedded-metamodel).
   - (b) Creare nuovo file `services/export/XMIImporter.ts` come da prompt.
   - (c) Modificare `XMIService.importFromFile` per supportare il caso "no embedded MM + match by xmlns" (più invasivo, viola lo scope guard del prompt).
   **Raccomandazione:** (a). Più piccola, confinata, esistente XMIService nessun side effect.

5. **Multiplicity enforcement.** Per attributi multi-valued (`upperBound > 1`) gli XML serializzano con N tag ripetuti (es. `<sons/><sons/>`). Il walker deve sapere distinguere single da multi per produrre `DValue.values = [a, b, c]` vs `DValue.values = [a]`. Approccio MVP:
   - Usa il metafeature: `metafeature.upperBound !== 1` → multi. Normalizza JSON di conseguenza.
   - **Edge case:** metafeature single-valued ma XML serializza 2 tag → quale comportamento? Errore? Append + warn? Take last? **Raccomandazione:** errore esplicito con line/path al failure (es. `"Feature 'X' is single-valued but appears 2 times for parent <Y>"`).

6. **DObject nested in containment NON finiscono in `model.objects`.** Verifica empirica necessaria in B.1: dopo `parseDObject:592` un child nested ha `father = DValue.id`, e `DValue.values.push(child.id)`, ma il **DModel non lo vede in `.objects`**. Conseguenze:
   - Step 2bis di `useJjomSync` skippa questi nested (no DVertex creato).
   - Property panel di un Family.father visualizzato come node? Forse non visualizzabile via canvas.
   **Opzione MVP:** dopo import, forzare `model.objects = [...model.objects, ...nestedIds]` per garantire visibilità nel grafo. Da decidere in B.1.

7. **`DocumentClassifier` riferito ma assente.** Il prompt e CLAUDE.md menzionano un componente che non esiste. È:
   - (a) Mai committato — referenze obsolete da pulire.
   - (b) Rimosso silentemente.
   - (c) Pianificato ma non realizzato.
   **Azione:** chiarire con Alfonso; non blocking per Phase B.

8. **Riusabilità per UML2.xmi / PNML.** I sample MVP non hanno `xsi:type`. UML2 serializza con `xsi:type` su quasi ogni containment. PNML usa namespace tipato. **Decisione MVP:** XMI M1 importer NON gestisce `xsi:type`. Aggiungere check + warning se `-xsi:type` appare in qualsiasi elemento; nel MVP, ignorato (decisione #2 del prompt). Documentare come scope post-MVP.

9. **Encoding.** `FileReader.readAsText(file)` (XMIService.ts:433) usa UTF-8 di default. Se un sample è ISO-8859-1 dichiarato (`<?xml version="1.0" encoding="ISO-8859-1"?>`), il decode potrebbe corromper i caratteri. **Risk:** sample con accenti italiani in nomi instance. **Raccomandazione MVP:** assumere UTF-8 (è il caso dei sample del prompt). Se serve, `reader.readAsText(file, encoding)` per future.

10. **Unknown attribute / class.** Cosa fare quando l'XMI ha:
    - Un attributo non presente nella metaclass (es. `<Male fullName="X" badAttr="Y"/>` ma `Male` non ha `badAttr`)?
    - Un tag che non corrisponde a una metaclass nota (es. `<Foo/>` con `Persons` come metamodel)?
    **Opzioni:** (a) errore strict; (b) warning + skip; (c) shapeless mode (DValue senza metafeature). **Raccomandazione MVP:** warning + skip per attributi unknown; errore per class tag unknown (non possiamo creare un DObject senza metaclass nel MVP).

---

## Sintesi e raccomandazione per Phase B

### 1. Estensioni candidate MVP

| Estensione | In MVP | Razionale |
|---|---|---|
| Auto-resolve metamodel via default xmlns | ✅ IN | Decisione architetturale #1 del prompt |
| `XMIService.importM1FromFile(file)` come nuovo metodo | ✅ IN | Minor footprint, riusa xmlToJson, decisione architetturale #5 (separato da Ecore handler) |
| Containment refs (single + multi) | ✅ IN | Tutti e 3 i sample lo richiedono |
| Type coercion → string (come Ecore importer) | ✅ IN | Coerenza, vedi Open Q 3 |
| `xsi:type` polymorphism | ❌ OUT | Decisione architetturale #2; sample non lo usano |
| `xmi:id` preservation per round-trip | ❌ OUT | Decisione architetturale #4 |
| Non-containment references / opposite refs | ❌ OUT | Sample non li hanno; Pass-2 XPath resolver fuori scope |
| Multi-package metamodels | ❌ OUT-tested | EMV già supporta multi-package metamodels; basta che il match `pkg.uri` lavori (verificare in B.2) |
| Validation errors UI | ⚠️ PARTIAL | Toast `U.alert('e', ...)` come Ecore handler. No inline error panel |
| Round-trip import-of-export | ❌ OUT | `XMIService.exportToFile` produce shape diversa dai sample (prefix namespace + xmi:id + embedded MM) |

### 2. Stima realistica line count

| Prompt | Scope | Stima LOC |
|---|---|---|
| **B.1 — Persons (flat, no containment)** | Walker base, nsURI lookup, DObject + DValue attribute only, handler + bottone UI | **+250 / -0 LOC** (XMIService.ts ~150, ProjectEditor.tsx ~50 handler+UI, test fixtures ~50) |
| **B.2 — Families + Book (containment single + multi)** | Estensione walker per containment ricorsivo + multiplicity normalize + nested-objects-in-model.objects fix | **+150 / -10 LOC** (XMIService.ts ~120, possibili tweak in ProjectEditor.tsx ~30) |
| **Tot. MVP** | Cumulativo B.1 + B.2 | **~400 LOC nuovi, 1 file principale modificato (XMIService.ts), 1 wrapper (ProjectEditor.tsx)** |

### 3. Blocker per partire con B.1

**Nessun blocker hard.** Tutti i prerequisiti sono presenti:
- ✅ `DObject.new`, `DValue.new` API stabili e documentate
- ✅ `findMetaclassByName` riusabile
- ✅ Pattern di lookup metamodel via `pkg.uri` già implementato in `parseM1Model:501-506`
- ✅ `XMIService.xmlToJson` riusabile
- ✅ `useJjomSync` Step 2bis e Step 4 attivi per visualizzazione automatica
- ✅ `Persons.ecore` (single-package senza dataType) **è importabile oggi** — confermato da `sessione_2026-05-13_2.md` (Bug F + G fixes); quindi B.1 può creare il metamodello di test in un primo step manuale.
- ⚠️ `Families.ecore`: contiene refs con eOpposite. Va testato il loading prima di B.2. Se non importa, B.2 è bloccato finché non si fixa l'Ecore importer per opposite refs. **Verifica empirica necessaria — non blocking per B.1.**

### 4. Sequenza raccomandata Phase B

1. **B.0 (3-5 min):** Copiare i 3 sample XMI in `frontend/src/__tests__/fixtures/` o `docs/samples/`. (Hard stop di Phase A vieta `frontend/src/` quindi farlo in Phase B.)
2. **B.1 (1-2h):** Implementare walker flat + handler + UI. Smoke test su Persons.xmi.
3. **B.1.5 (30min):** Decidere come trattare DObject nested vs model.objects (Open Q 6). Test empirico apertura Persons.xmi nel canvas.
4. **B.2 (1.5h):** Estensione containment + multi-valued. Smoke test su Families.xmi + modelBook.xmi.
5. **B.3 (post-MVP):** xsi:type, non-containment refs, xmi:id preservation.

---

## Files consultati

| File | Range | Scopo |
|---|---|---|
| `/Users/alfonso/jjodel/CLAUDE.md` | full | Contesto + convenzioni |
| `/Users/alfonso/jjodel/docs/claude-code-log.md` | head 100 / tail 300 | Recent Ecore importer history |
| `/Users/alfonso/jjodel/frontend/src/api/data.ts` | 134-743 (parser), 1143-1300 (constants) | EcoreParser internals |
| `/Users/alfonso/jjodel/frontend/src/model/logicWrapper/LModelElement.tsx` | 1723-1798 (DPackage), 4626-4673 (DModel), 5519-5523 (getClassByNameSpace), 5646-5680 (DObject), 6260-6313 (DValue) | D/L layer class definitions |
| `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` | 918-940 (auto-register), 2936-3025 (DProject) | DProject + auto-register |
| `/Users/alfonso/jjodel/frontend/src/joiner/index.ts` | 164-209 | Re-exports |
| `/Users/alfonso/jjodel/frontend/src/services/export/EcoreService.ts` | 370-451 (import), 461-496 (xmlToJson) | Ecore import flow |
| `/Users/alfonso/jjodel/frontend/src/services/export/XMIService.ts` | full | Existing XMI service |
| `/Users/alfonso/jjodel/frontend/src/jjscript/executor/commands/instance.ts` | full | Create/Set instance patterns |
| `/Users/alfonso/jjodel/frontend/src/jjscript/executor/resolvers.ts` | 180-210 | getMetamodelById |
| `/Users/alfonso/jjodel/frontend/src/components/project/ProjectEditor.tsx` | 759-806 (handler), 1983-2001 (button), 2575-2589 (file input) | UI integration points |
| `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/canvasToJjom.ts` | 1080-1330 | DObject.new + sync patterns |
| `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useJjomSync.ts` | 280-700 | Auto-sync logic Step 2bis + Step 4 |
| `/Users/alfonso/jjodel/frontend/src/redux/store.tsx` | 116 | m2models root field |

---

**End of discovery.**
