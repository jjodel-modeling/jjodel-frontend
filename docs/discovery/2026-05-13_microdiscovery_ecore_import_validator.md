# Discovery: Ecore Import Validator (Fase A, read-only)

**Data**: 2026-05-13
**Tipo**: read-only diagnostic
**Esito**: ✅ catena completa tracciata dal validator al toast UI. Identificati: (a) sito unico della whitelist hardcoded a 1 elemento, (b) 2 call site del check (post-B.1 multi-package + single-package), (c) 4 entry-point UI di import M2, (d) 1 entry-point UI di import M1 separato (`XMIService`, accetta `.xmi` ma non `.ecore`), (e) il messaggio fuorviante "found instead: " (vuoto) deriva dal pattern `(json[...] || '')` che equipara "attributo mancante" a "stringa vuota". Nessun infrastruttura di classificazione del documento esistente — Jjodel decide tra M2 vs M1 import esclusivamente per estensione del file (`.ecore` → M2, `.xmi` → M1).

---

## 1. Localizzazione della stringa di errore

### Hits "unsupported ecore version"

```bash
$ grep -rni "unsupported.*ecore.*version" /Users/alfonso/jjodel/frontend/src/
```

**2 occorrenze, entrambe in `frontend/src/api/data.ts`**:

#### Hit A — `data.ts:420` (parseM2Model, branch multi-package XMI-wrapped)

```typescript
// data.ts:393 (function signature)
static parseM2Model(json: Json, filename: string | undefined): DModelElement[] {
    // ...
    // data.ts:413
    const epkgChildren = EcoreParser.getMultiPackageChildren(json);

    if (epkgChildren) {
        // Multi-package wrapped XMI path.
        // The xmlns:ecore attribute is on the XMI wrapper, not on individual EPackage
        // children, so we validate here instead of inside parsePackageBody.
        let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
        Log.ex(!EcoreParser.supportedEcoreVersions.includes(version), "unsupported ecore version, must be one of:" + EcoreParser.supportedEcoreVersions + " found instead: "+version);
        // ...
    } else {
        // Single-package path: root JSON IS the <ecore:EPackage>. parseRootPackage validates internally.
        EcoreParser.parseRootPackage(dObject, json, generated);
    }
    return generated;
}
```

#### Hit B — `data.ts:664` (parseRootPackage thin wrapper, single-package)

```typescript
static parseRootPackage(parent: DModel, json: Json, generated: DModelElement[]): DModelElement[] {
    if (!json) { json = {}; }
    // Single-package path validates the ecore namespace here. For multi-package XMI-wrapped
    // imports the validation is hoisted to the wrapper level in parseM2Model.
    let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
    Log.ex(!EcoreParser.supportedEcoreVersions.includes(version), "unsupported ecore version, must be one of:" + EcoreParser.supportedEcoreVersions + " found instead: "+version);
    return EcoreParser.parsePackageBody(parent, json, generated);
}
```

### Whitelist e prefix XML

`data.ts:135-136`:

```typescript
@RuntimeAccessible('ECoreParser')
export class EcoreParser{
    static supportedEcoreVersions = ["http://www.eclipse.org/emf/2002/Ecore"];
    static prefix:string = '-'; // aligned with EcoreService.xmlToJson output (was '@')
    // ...
}
```

| Aspetto | Valore | Note Fase B |
|---|---|---|
| Whitelist | Array literale di 1 elemento | Facile da estendere (es. supportare URL alias storici), ma serve type-safety se diventa map |
| Prefisso attributi | `'-'` (allineato con `xmlToJson` output) | Comment storico "was '@'" indica passaggio di refactor — verificare se ancora usato il "@" altrove |

### Altri hit collaterali (NON sito del messaggio target)

`data.ts:503-509` e `data.ts:583-589` (dentro `parseM1Model` e `parseDObject`): check separati su `xmi:version === "2.0"` e `xmlns:xmi === "http://www.omg.org/XMI"`. Messaggi distinti (`"The only supported ecore version is..."` e `"Unexpected XMI schema..."`) — riguardano l'import M1, non scope di questo bug.

---

## 2. Catena chiamate validator → UI

Sintesi grafica:

```
[UI button click]
  │
  ├── ProjectEditor.handleImportEcore (ProjectEditor.tsx:759-762)
  │     │ trigga hidden <input ref={importEcoreRef}> via .click()
  │     ▼
  ├── <input type="file" accept=".ecore" onChange={handleEcoreFileChange}>
  │     │ (ProjectEditor.tsx:2583-2589)
  │     ▼
  ├── ProjectEditor.handleEcoreFileChange (ProjectEditor.tsx:764-806)
  │     │ try { ... } catch { U.alert('e', 'Import Failed', `Could not import Ecore: ${(error as Error).message}`) }
  │     ▼
  ├── EcoreService.importFromFile (EcoreService.ts:431-451)
  │     │ FileReader → readAsText → resolve(importFromXML(content, filename))
  │     ▼
  ├── EcoreService.importFromXML (EcoreService.ts:373-426)
  │     │ try { ... DOMParser.parseFromString ... xmlToJson ... EcoreParser.parse(...) ... }
  │     │ catch (error) { return { success: false, errors: [`Import failed: ${(error as Error).message}`] } }
  │     ▼
  ├── EcoreParser.parse (data.ts:164-189)
  │     │ Constructors.paused = true
  │     │ NON ha try/catch — eccezione propaga al chiamante
  │     ▼
  ├── EcoreParser.parseM2Model (data.ts:393-454) — isMetamodel=true path
  │     │
  │     ├─[if epkgChildren]── Log.ex(!supportedEcoreVersions.includes(version), "unsupported ecore version, ...")  [data.ts:420]
  │     │
  │     └─[else]── EcoreParser.parseRootPackage (data.ts:659-666)
  │                  │ Log.ex(!supportedEcoreVersions.includes(version), "unsupported ecore version, ...")  [data.ts:664]
  │                  │
  │                  ▼
  ├── Log.ex (Log.ts:139-144)
  │     │ Log.lastError = restArgs
  │     │ chiamata interna a Log.log(prefix='Error', category='e', canthrow=true, ...)
  │     ▼
  └── Log.log (Log.ts:99-121)
        │ exception = new MyError('[Error]' + str, ...)
        │ Log.updateLoggerComponent(...)
        │ originalFunc(key, ...restArgs)   ← console.error
        │ throw exception   ← line 119 ← propaga upward fino al primo try/catch (EcoreService.importFromXML)
        ▼
[Errore catturato da EcoreService:419-424]
        │ return { success: false, errors: [`Import failed: ${error.message}`] }
        ▼
[ProjectEditor:794 rethrows]
        │ throw new Error(result.errors.join(', '))
        ▼
[ProjectEditor:797-800 catches]
        │ console.error(...)
        │ U.alert('e', 'Import Failed', `Could not import Ecore: ${error.message}`)
        ▼
[U.alert (U.tsx:388-405)]
        │ window.dispatchEvent(new CustomEvent(JjodelEvents.TOAST, {detail: {priority, title, message}}))
        ▼
[ToastContext.tsx:135 listener]
        │ window.addEventListener(JjodelEvents.TOAST, handler)
        │ setToasts(...) → render Toast component
        ▼
[Toast user-visible]
   "Could not import Ecore: Import failed: [Error]unsupported ecore version, must be one of:http://www.eclipse.org/emf/2002/Ecore found instead: "
```

### Decomposizione del messaggio finale visto dall'utente

```
"Could not import Ecore: Import failed: [Error]unsupported ecore version, must be one of:http://www.eclipse.org/emf/2002/Ecore found instead: "
└──────────┬──────────┘ └──┬────────┘ └──┬───┘└──────────────────────┬──────────────────────────────────────────────────────────┘
   ProjectEditor:799    EcoreService:422  Log.log:113     restArgs[0] di Log.ex a data.ts:420 o data.ts:664
   `Could not import       `Import failed:`  prefix         "unsupported ecore version, must be one of:" + supportedEcoreVersions
   Ecore: ${msg}`          ${msg}            '[Error]'       + " found instead: " + version
                                                              (version === '' quando attributo manca → output vuoto dopo `:`)
```

### Funzioni che intercettano errori

| Funzione | File:riga | Comportamento error |
|---|---|---|
| `EcoreParser.parse` | data.ts:164-189 | **Non** intercetta — propaga upward |
| `EcoreParser.parseM2Model` | data.ts:393-454 | **Non** intercetta — `Log.ex` lancia direttamente |
| `EcoreParser.parseRootPackage` | data.ts:659-666 | **Non** intercetta |
| `EcoreService.importFromXML` | EcoreService.ts:373-426 | **try/catch** → return `{success:false, errors:['Import failed: '+msg]}` |
| `EcoreService.importFromFile` | EcoreService.ts:431-451 | Wrapper Promise, delega a `importFromXML` |
| `ProjectEditor.handleEcoreFileChange` | ProjectEditor.tsx:764-806 | **try/catch** → `U.alert('e', 'Import Failed', ...)` |
| `SaveManager.importEcore_click` | SaveManager.ts:81-87 | **try/catch** → `console.trace` + commento "throw new Error str" disabilitato |
| `SaveManager.importEcore` | SaveManager.ts:156-184 (post-fix-F) | **Non** intercetta il parse, ha try/catch interno solo per il project-link |

**Nota Fase B**: il try/catch di EcoreService trasforma l'eccezione in un return object con `errors: string[]`. Questo significa che **l'oggetto Error originale (con stack trace) viene perso**: solo `error.message` viene preservato come stringa. Per la classificazione del documento, sarebbe meglio:
- (a) restituire un oggetto `EcoreImportResult` con `errorCode` strutturato (es. `'UNSUPPORTED_NAMESPACE'`, `'NOT_ECORE_FORMAT'`, `'XMI_INSTANCE_DETECTED'`) accanto a `errors: string[]`;
- (b) oppure preservare l'eccezione originale come `cause` (ES2022 `Error.cause`) per debug.

---

## 3. Anatomia del check del namespace

### Parser XML

`EcoreService.importFromXML` (EcoreService.ts:379-393):

```typescript
const parser = new DOMParser();   // standard browser API
const doc = parser.parseFromString(xmlString, 'application/xml');

// Check for parse errors
const parseError = doc.querySelector('parsererror');
if (parseError) {
    return {
        success: false,
        errors: ['Invalid XML: ' + parseError.textContent],
        warnings: [],
    };
}

// Convert XML DOM to JSON format expected by EcoreParser
const json = this.xmlToJson(doc.documentElement);
```

**`xmlToJson`** (EcoreService.ts:461-498): converte DOM → JSON con convenzioni:
- Attributi prefissati con `'-'`: `json['-' + attr.name] = attr.value` (riga 468).
- Children inseriti come properties con `tagName` come key (case-sensitive).
- Se più children con stesso tagName: trasformati in array.

```typescript
// xmlToJson essential
private static xmlToJson(element: Element): any {
    const json: any = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        json['-' + attr.name] = attr.value;
    }
    for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        const tagName = child.tagName;
        // ...
        json[tagName] = childJson;  // or array
    }
    // ...
    return json;
}
```

**Path alternativo via SaveManager**: `SaveManager.importEcore_click0` (SaveManager.ts:88-147) usa `prxml2json.xml2jsonobj(xmlDoc, ' ')` (riga 132) invece di `EcoreService.xmlToJson`. Output diverso ma comunque allineato con il prefix `'-'` (a quanto si vede dalle costanti `ECoreParser.prefix='-'`).

### Attributo letto

Entrambi i call site (data.ts:419 + data.ts:663):

```typescript
let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
```

`EcoreParser.prefix === '-'` → effettivamente legge `json["-xmlns:ecore"]`. Casi:

| Scenario | Root XML | `json["-xmlns:ecore"]` |
|---|---|---|
| Ecore single-package standard | `<ecore:EPackage xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" ...>` | `"http://www.eclipse.org/emf/2002/Ecore"` ✅ |
| XMI 2.0 multi-package wrapped Ecore | `<xmi:XMI xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" xmlns:xmi="...">` | `"http://www.eclipse.org/emf/2002/Ecore"` ✅ |
| `modelBook.ecore` (M1 instance, XMI 2.0) | `<xmi:XMI xmlns="Book" xmlns:xmi="http://www.omg.org/XMI">` | `undefined` → `''` (per `\|\| ''`) ❌ |
| `MOF-1_4.ecore` (XMI 1.1) | `<XMI xmi.version="1.1" xmlns:Model="omg.org.mof.Model">` | `undefined` → `''` ❌ |
| Ecore con namespace sbagliato | `<ecore:EPackage xmlns:ecore="http://wrong.url/">` | `"http://wrong.url/"` ❌ |

Il pattern `(json[...] || '')` **collassa due casi distinti** (attributo mancante vs valore vuoto) in `''`. Questo è il motivo del troncamento del messaggio `"found instead: "`.

### Costruzione messaggio

`data.ts:420` e `data.ts:664`:

```typescript
Log.ex(
    !EcoreParser.supportedEcoreVersions.includes(version),
    "unsupported ecore version, must be one of:"
        + EcoreParser.supportedEcoreVersions   // Array → toString → joined by ','
        + " found instead: "
        + version                              // empty string when missing
);
```

Concatenazione di un Array in template-string fa `Array.toString()` che equivale a `arr.join(',')`. Con 1 elemento, output = `"http://www.eclipse.org/emf/2002/Ecore"` (senza prefisso `[` o suffisso `]`).

### Whitelist (data.ts:135)

```typescript
static supportedEcoreVersions = ["http://www.eclipse.org/emf/2002/Ecore"];
```

**Letterale, 1 elemento.** Non c'è una const symbol distinta o un export riusabile altrove. Esattamente la stessa URL appare anche in:
- `LModelElement.tsx:1835, 1837, 6128` (export Ecore)
- `LModelElement.tsx:1418` (lista prefissi accettati per type resolution)
- `U.tsx:3364, 3616-3640` (costanti per primitive types: `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//<TYPE>`)

**Annotazione Fase B**: candidato per estrazione in un'unica costante esportata (es. `EcoreNamespaces.ECORE_2_0 = 'http://www.eclipse.org/emf/2002/Ecore'`), da riusare. Out-of-scope ma desiderabile.

---

## 4. Punto di ingresso UI

### Entry-point primario — Hidden file input (button-triggered)

`ProjectEditor.tsx:2583-2589`:

```tsx
<input
    ref={importEcoreRef}
    type="file"
    accept=".ecore"
    style={{ display: 'none' }}
    onChange={handleEcoreFileChange}
/>
```

**Refs e trigger**:

- `importEcoreRef = useRef<HTMLInputElement>(null)` — ProjectEditor.tsx:221.
- `handleImportEcore = () => { importEcoreRef.current?.click(); setShowImportMenu(false); }` — ProjectEditor.tsx:759-762.
- Trigger button: `<button onClick={handleImportEcore}>` — ProjectEditor.tsx:1995.

### Lettura file

`EcoreService.importFromFile` (EcoreService.ts:431-451):

```typescript
static async importFromFile(file: File): Promise<EcoreImportResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            resolve(this.importFromXML(content, filename));
        };
        reader.onerror = () => {
            resolve({
                success: false,
                errors: ['Failed to read file'],
                warnings: [],
            });
        };
        reader.readAsText(file);
    });
}
```

Standard `FileReader.readAsText(file)` — input encoding assunto UTF-8.

### Notifica toast

`U.alert` (U.tsx:388-405):

```typescript
static alert(type: 'i'|'w'|'e'|'s', title: React.ReactNode, message: React.ReactNode = ''): void {
    // @deprecated facade — see toast.* in components/Toast
    // ...
    const priority = ({ i: 'info', w: 'warning', e: 'error', s: 'success' } as const)[type] ?? 'info';
    const hasMessage = message !== '' && message !== null && message !== undefined;
    const finalTitle = hasMessage ? title : undefined;
    const finalMessage = hasMessage ? message : title;

    window.dispatchEvent(new CustomEvent(JjodelEvents.TOAST, {
        detail: { priority, title: finalTitle, message: finalMessage },
    }));
}
```

Dispatcha `CustomEvent(JjodelEvents.TOAST, { detail })`. Listener in `ToastContext.tsx:135`:

```typescript
window.addEventListener(JjodelEvents.TOAST, handler);
// ...
setToasts(prev => [toast, ...prev].slice(0, MAX_TOASTS));
```

**Modulo che gestisce le notifiche**: `frontend/src/components/Toast/` (ToastContext.tsx, ToastContainer.tsx, Toast.tsx, toastDispatch.ts, index.ts).

**Annotazione Fase B**: `U.alert` è marcato `@deprecated`. L'API moderna è `toast.{error|warning|info|success}()` da `components/Toast/toastDispatch.ts`. Per messaggi multi-line strutturati (es. "did you mean to import as M1 model?" + bottone d'azione), considerare migrazione a `toast.error(message, {title, action: {...}})` invece di `U.alert`.

### Entry-point secondari

#### 4.1 ImportDropZone (drag-drop)

`frontend/src/components/common/ImportDropZone.tsx:74-103`:

```typescript
for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    try {
        if (extension === 'ecore') {
            if (onImportMetamodel) {
                const result = await EcoreService.importFromFile(file);
                onImportMetamodel(result);
                // ...
            }
        } else if (extension === 'xmi') {
            if (onImportModel) {
                const result = await XMIService.importFromFile(file);
                onImportModel(result);
                // ...
            }
        } else {
            results.push(`Unsupported file type: .${extension}`);
        }
    } catch (error) { /* ... */ }
}
```

**Discrimina M2 vs M1 SOLO per estensione**: `.ecore` → EcoreService (M2), `.xmi` → XMIService (M1). Non c'è ispezione del contenuto. Un file `modelBook.ecore` (M1 in XMI 2.0 ma con estensione `.ecore`) viene routato all'EcoreService e fallisce sul namespace check.

#### 4.2 SaveManager.importEcore_click (topbar File menu)

`SaveManager.ts:81-147` — path legacy. Usa `U.fileRead` + `prxml2json.xml2jsonobj` (non `DOMParser`). Discrimina M2 vs M1 per estensione:

```typescript
// SaveManager.ts:143
let isMetamodel = filename.indexOf(".ecore") === filename.length - ".ecore".length;
```

Stesso pattern di routing per estensione. Anche qui un `.ecore` con contenuto M1 fallirebbe sul check namespace.

#### 4.3 AllProjects.tsx dropConfirm (drag-drop in Dashboard)

`AllProjects.tsx:73-96` — dispatcha a `ProjectsApi.importFromText(content, name, date)`. Quest'ultima (`projects.ts:133`) attende un `.jjodel` zip JSON, NON un file `.ecore`. Quindi un `.ecore` droppato nella Dashboard fa `JSON.parse(xmlContent)` → throw "Unexpected token <". **Non passa per EcoreParser** — è un path separato per `.jjodel` projects.

---

## 5. Import M1 esistente

### XMIService — entry-point dedicato per istanze M1

`frontend/src/services/export/XMIService.ts` (512 righe).

**Path principale**: `XMIService.importFromXML(xmlString, filename)` (XMIService.ts:320-410):

```typescript
static importFromXML(xmlString: string, filename?: string): XMIImportResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Parse XML to DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'application/xml');
        // ... parse error check ...

        let importedMetamodel: LModel | undefined;

        // Try to extract embedded metamodel
        const embeddedMM = doc.querySelector('embeddedMetamodel ecore\\:EPackage') ||
                           doc.querySelector('embeddedMetamodel EPackage') ||
                           doc.querySelector('Documentation embeddedMetamodel > *');

        if (embeddedMM) {
            const serializer = new XMLSerializer();
            const mmXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                          serializer.serializeToString(embeddedMM);

            const mmResult = EcoreService.importFromXML(mmXml, filename ? `${filename}_metamodel` : 'imported_metamodel');

            if (mmResult.success && mmResult.model) {
                importedMetamodel = mmResult.model;
                // ...
            }
        }

        // Find model namespace and match to metamodel
        const xmiRoot = doc.documentElement;
        const nsPrefix = this.findModelNamespacePrefix(xmiRoot);

        // Convert model instances to JSON for EcoreParser
        const modelJson = this.xmlToJson(xmiRoot);
        delete modelJson['xmi:Documentation'];
        delete modelJson['Documentation'];

        const meta = importedMetamodel;

        // Parse model using EcoreParser (isMetamodel=false)
        const parsedElements = EcoreParser.parse(modelJson, false, filename || 'imported_model', true);
        // ...
    } catch (error) { /* ... */ }
}
```

**Caratteristiche**:

- Estrae un metamodel embedded da `<embeddedMetamodel>` (custom XMI convention prodotta da Jjodel stesso in `XMIService.exportToXML`).
- Fallback: usa un metamodel già caricato (non sempre risolvibile).
- Chiama `EcoreParser.parse(json, false, ...)` → routa a `parseM1Model` (data.ts:471, isMetamodel=false).
- `parseM1Model` (data.ts:471-528): legge attributi del root JSON, switch su `ECoreObject.xmi_version` (check su "2.0", data.ts:504) e `ECoreObject.xmlns_xmi` (check su `http://www.omg.org/XMI`, data.ts:509). Loop sui children come oggetti M1.

**Entry-point UI per XMI 2.0**: `ImportDropZone` discrimina per estensione `.xmi` (riga 91). **NON c'è hidden input button-triggered per `.xmi`** nel ProjectEditor (a differenza di `.ecore`). L'utente può importare M1 SOLO via drag-drop o via XMIService programmatic call.

### Limitazioni XMIService

- Assume `<embeddedMetamodel>` (custom Jjodel convention) — file XMI 2.0 puri come `modelBook.ecore` (`<xmi:XMI xmlns="Book">` con oggetti `<Book>` dentro, **senza** metamodel embedded) non passano la logica di matching → cadono nel ramo `warnings.push('No embedded metamodel found in XMI - looking for existing metamodel')` e poi `parseM1Model` opera senza meta → probabilmente fallisce.
- File MOF 1.4 in XMI 1.1 (`MOF-1_4.ecore`) non sono gestiti: il check `xmi:version === "2.0"` (data.ts:504) verrebbe attivato e lancerebbe.

### Risposta sintetica

**Esiste un path M1 separato (XMIService)**, ma:
- Accetta SOLO `.xmi` (estensione) — non `.ecore`.
- È accessibile SOLO via `ImportDropZone` o codice (no hidden input UI).
- Assume embedded metamodel convention Jjodel — file XMI 2.0 puri standard non sono fluently supportati.

**Per Fase B**, possibile suggerimento "did you mean to import as M1 model?" — ma il routing dovrebbe:
1. Detectare contenuto XMI 2.0 instance (root `<xmi:XMI>` con namespace `xmlns:xmi` ma SENZA `xmlns:ecore`).
2. Suggerire all'utente di rinominare il file `.ecore → .xmi` OPPURE estendere `EcoreService` per classificare e routare internamente.

---

## 6. Namespace e versioni note

### Hits "http://www.eclipse.org" / "http://www.omg.org" / xmlns:xmi / xmlns:xsi

```bash
$ grep -rn "http://www.eclipse.org\|http://www.omg.org\|xmlns:xmi\|xmlns:xsi" frontend/src/
```

**18 hit non-fixture**, distribuiti su 4 file:

| File:riga | Stringa | Contesto |
|---|---|---|
| `api/data.ts:135` | `"http://www.eclipse.org/emf/2002/Ecore"` | Whitelist `supportedEcoreVersions` |
| `common/U.tsx:3364` | `"ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//"` | `ecoreprefix` per type resolution |
| `common/U.tsx:3616-3640` | `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//<TYPE>` | Costanti primitive types (EString, EInt, etc.) — enum |
| `model/logicWrapper/LModelElement.tsx:1418` | `["http://www.eclipse.org/emf/2002/Ecore#//", "#//", "ecore:", "ecore:#//", "ecore#//"]` | Lista prefissi accettati per type resolution (note: "not sure which are actually valid") |
| `model/logicWrapper/LModelElement.tsx:1835, 6126` | `'http://www.omg.org/XMI'` | Export Ecore — header XMI |
| `model/logicWrapper/LModelElement.tsx:1837, 6128` | `'http://www.eclipse.org/emf/2002/Ecore'` | Export Ecore — header xmlns:ecore |
| `services/export/XMIService.ts:79-82` | `'http://www.omg.org/XMI'`, `'http://www.w3.org/2001/XMLSchema-instance'`, `'http://www.eclipse.org/emf/2002/Ecore'` | Export XMI — header tre namespace standard |
| `api/data.ts:503-509, 583-589` | `"2.0"`, `"http://www.omg.org/XMI"` | parseM1Model — check su `xmi:version` e `xmlns:xmi` |
| `api/data.ts:1258-1262` | `xmlns:xmi`, `xmlns:xsi`, `xmi:version`, `xmlns:ecore` | Costanti `ECorePackage.xmlnsxmi`, `xmlnsxsi`, `xmiversion`, `xmlnsecore` |

### Namespace conosciuti

| Namespace | Riconosciuto da | File |
|---|---|---|
| `http://www.eclipse.org/emf/2002/Ecore` | ✅ Ecore validator + type resolution + export | data.ts:135, LModelElement.tsx, U.tsx |
| `http://www.omg.org/XMI` (XMI 2.0) | ✅ XMI 2.0 root attribute check + export header | data.ts:509, XMIService.ts:80, LModelElement.tsx:1835 |
| `http://www.w3.org/2001/XMLSchema-instance` (XSI) | ⚠️ Solo come header export | XMIService.ts:81 — NON checked in import |
| XMI 1.0 / 1.1 / 1.2 | ❌ NON riconosciuto | nessuna costante |
| `omg.org/mof.Model` (MOF 1.4) | ❌ NON riconosciuto | nessuna costante |
| UML namespaces | ❌ NON riconosciuto | nessuna costante |
| `xmlns` (default, per istanze) | ⚠️ Letto via `getClassByNameSpace` (parseM1Model logic) ma NON come check di formato | data.ts:518 (in switch loop) |

### Pattern di "expected" hard-coded inline

`data.ts:507-509` e `data.ts:587-589`:

```typescript
case ECoreObject.xmlns_xmi:
    let expected = "http://www.omg.org/XMI";
    Log.ex(json[key] !== expected,"Unexpected XMI schema. Should be \""+expected+"\", found instead: \""+json[key] +"\"");
    break;
```

`expected` come **variabile locale**, non costante esportata. Stessa stringa duplicata in 2 punti. Refactor desiderabile out-of-scope.

### Annotazioni per Fase B

- **Whitelist espandibile**: per supportare XMI 1.x, MOF 1.x, UML, basta estendere `EcoreParser.supportedEcoreVersions` o introdurre una classification logic prima del check. Esempio:
  ```typescript
  static knownNamespaces = {
      ECORE_2_0: 'http://www.eclipse.org/emf/2002/Ecore',
      XMI_2_0: 'http://www.omg.org/XMI',
      XMI_1_X: '...',         // not implemented
      MOF_1_4: 'omg.org.mof.Model',  // not implemented
      UML_NS: '...',          // not implemented
  };
  static supportedEcoreVersions = [EcoreParser.knownNamespaces.ECORE_2_0];
  ```
- **Document classifier**: una funzione `classifyDocument(json)` potrebbe ispezionare la root XML e ritornare uno dei: `'ECORE_M2'` / `'XMI_M1'` / `'MOF_1_4'` / `'UNKNOWN'` / `'NOT_XML'`. Esempi euristici:
  - root `<ecore:EPackage>` + xmlns:ecore ECORE_2_0 → `ECORE_M2_SINGLE_PACKAGE`.
  - root `<xmi:XMI>` + xmlns:ecore ECORE_2_0 → `ECORE_M2_MULTI_PACKAGE`.
  - root `<xmi:XMI>` + xmlns:xmi XMI_2_0 SENZA xmlns:ecore → `XMI_M1_INSTANCE` (suggerire path M1).
  - root `<XMI>` con `xmi.version === "1.1"` o `"1.2"` → `XMI_1_X_UNSUPPORTED`.
  - root con `xmlns:Model="omg.org.mof.Model"` → `MOF_1_4_UNSUPPORTED`.
  - parse failure → `NOT_XML`.

---

## 7. Sintesi per Fase B

### Punti di intervento candidate

| Layer | File | Cosa potrebbe cambiare in Fase B |
|---|---|---|
| **Parser/Validator** | `data.ts:135` | Estrarre whitelist in costante esportata; eventualmente whitelist multipla con metadata (es. `{url, version, supported}`) |
| **Classificazione** | (nuovo modulo, es. `services/export/DocumentClassifier.ts`) | Ispezione root pre-parse → return `DocumentClass` enum + diagnostic info (XML/non-XML, ecore/xmi/mof/other, M2/M1/unknown) |
| **Error message construction** | `data.ts:420, 664` | Usare il classifier per costruire messaggi specifici. Distinguere "attributo mancante" da "valore vuoto" da "valore non in whitelist" |
| **Error propagation** | `EcoreService.ts:422` | Strutturare `EcoreImportResult.errorCode` + `errorContext` invece di solo `errors: string[]` (preserva info per UI smart suggestions) |
| **UI suggestion** | `ProjectEditor.tsx:799`, `ImportDropZone.tsx:86` | Sulla base di `errorCode`, mostrare bottone "Did you mean to import as M1 model?" o link a documentazione |
| **File routing pre-EcoreService** | `ImportDropZone.tsx:75-90`, `ProjectEditor.handleEcoreFileChange:764` | Pre-classify il contenuto prima di routare a EcoreService vs XMIService (oggi solo per estensione) |
| **Toast moderni** | sostituire `U.alert` con `toast.error` per messaggi strutturati con action buttons | `components/Toast/toastDispatch.ts` API |

### Punti che NON dovrebbero cambiare (rispettare scope)

- `EcoreParser.parseM1Model` e flusso istanze: il bug riguarda solo la classificazione/diagnostica, non il parsing.
- `XMIService`: non toccare il path embedded metamodel, è una convention Jjodel.
- `Log.ex` / `Log.log`: meccanismo throw-on-error generale, fuori scope.

### Open questions

1. **Distinzione "attributo mancante" vs "valore vuoto"**: vale la pena distinguere? Per file Ecore validi entrambi sono errori, ma il messaggio user-facing potrebbe essere più chiaro: "attributo `xmlns:ecore` mancante (probabile file XMI 2.0 instance, prova ad importare come modello .xmi)" vs "valore `xmlns:ecore` non riconosciuto: X (whitelist: ...)".

2. **Auto-routing M1 dentro ProjectEditor**: se rileviamo che `.ecore` contiene XMI 2.0 instance data, possiamo offrire un'opzione "Import as M1 model" che internamente richiede di scegliere il metamodel target (eventualmente già caricato). Vale la pena lo sforzo UX o è meglio limitare il messaggio a un suggerimento di rinominare il file?

3. **MOF 1.4 / UML / XMI 1.x**: scope esplicito di Fase B includerli come "ricognosciuti ma non supportati" (con messaggio chiaro), oppure ignorarli (fallendo come oggi con messaggio generico migliorato)?

4. **`SaveManager.importEcore_click` legacy path**: questo entry-point ha un proprio routing (`prxml2json` invece di `DOMParser`). Vale la pena uniformare? Out-of-scope ma da decidere.

5. **`U.alert` deprecation**: rimosso completamente da Ecore import flow per Fase B (migrato a `toast.error` con action buttons) o lasciato com'è?
