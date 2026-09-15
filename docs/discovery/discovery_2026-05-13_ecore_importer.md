# Discovery — Ecore importer multi-package

Scope: read-only mapping dello stato attuale dell'import Ecore in `frontend/src`, in preparazione del fix Fase B (Opzione 2 — multi-package XMI-wrapper + XPath pointer + EDataType fallback). Nessuna modifica al codice.

## 1. Error source (Obiettivo 1)

- **File**: `frontend/src/api/data.ts`
- **Funzione**: `EcoreParser.parseRootPackage` (definizione `data.ts:614`, throw a `data.ts:626`)
- **Libreria XML**: NESSUNA dentro EcoreParser. Il parser riceve già JSON in input; due chiamanti distinti convertono XML→JSON con strumenti diversi (vedi §2). EcoreParser è quindi puro reader di un AST JSON.
- **Lettura del namespace** (`data.ts:623`):
  ```ts
  let version = (json[EcoreParser.prefix+"xmlns:ecore"] || '') as string;
  ```
  con `EcoreParser.prefix = '@'` (`data.ts:136`) e `EcoreParser.XMLinlineMarker = '@'` (`data.ts:889`). La chiave letta è quindi sempre `"@xmlns:ecore"`. Nessuna lettura `namespaceURI`/`lookupNamespaceURI`: si lavora puramente per chiavi prefissate sull'oggetto JSON.
- **Valore hardcoded atteso** (`data.ts:135`):
  ```ts
  static supportedEcoreVersions = ["http://www.eclipse.org/emf/2002/Ecore"];
  ```
  Array di 1 elemento; la `.includes(version)` accetta solo la stringa esatta.
- **Cosa fa il codice se la validazione passa** (`data.ts:627-647`): tratta `json` come un EPackage, legge `@name`, `@nsURI`, `@nsPrefix`, itera annotations, poi `getChildren(json)` (dispatch per `xsi:type` su `ecore:EClass` → `parseDClass` / `ecore:EEnum` → `parseDEnum`), poi `getSubPackages` → `parseSubPackage` ricorsivo. Quindi assume **un singolo EPackage radice** che contiene `eClassifiers` direttamente.
- **Supporto root `<xmi:XMI>`**: **NO**. `parseM2Model` (`data.ts:368-384`) chiama `parseRootPackage(dObject, json, generated)` passando l'**intero** JSON come se fosse l'EPackage. Esiste una versione **OLD/dead-code** `parseM2Model_old` (`data.ts:386-410`) che fa `for (let child of EcoreParser.getChildren(json)) parseRootPackage(dObject, child, generated)` — strutturalmente corretta per file XMI-wrapped, ma non più referenziata da nessun chiamante.

## 2. Pipeline import (Obiettivo 2)

- **Bottone Import**: `frontend/src/components/project/ProjectEditor.tsx:1979-1985` — voce "Import Ecore (.ecore)" dentro il dropdown `showImportMenu` aperto cliccando il SectionHeader "Import" della sezione Metamodels.
- **Click handler**: `handleImportEcore` (`ProjectEditor.tsx:759-762`) — `.click()` sul `<input type="file" accept=".ecore">` nascosto a `ProjectEditor.tsx:2569-2575` (ref `importEcoreRef`).
- **File picker**: nativo HTML `<input type="file" accept=".ecore">`. No drag&drop su ProjectEditor; un componente separato `ImportDropZone` (`frontend/src/components/common/ImportDropZone.tsx:78-103`) esiste e usa lo stesso `EcoreService.importFromFile`, ma non lo vedo wrappato attorno alla Dashboard (controllo non esaustivo, vedi Open Q.7).
- **File read**: `handleEcoreFileChange` (`ProjectEditor.tsx:764-792`) → `EcoreService.importFromFile(file)` → `new FileReader().readAsText()` (`EcoreService.ts:431-451`).
- **Format detection**: implicito tramite estensione `.ecore` (filtro `accept=".ecore"`). Nessun sniffing del contenuto.
- **Routing al parser Ecore**: `EcoreService.importFromXML(content, filename)` (`EcoreService.ts:373-426`) → `new DOMParser().parseFromString(xmlString, 'application/xml')` → `xmlToJson(doc.documentElement)` (`EcoreService.ts:461-498`) → `EcoreParser.parse(json, true, filename, true)` (`EcoreService.ts:398`) → `parseM2Model` → `parseRootPackage` (`data.ts:614`).
- **Error path → toast**:
  1. `Log.ex(...)` a `data.ts:626` throw.
  2. catch in `EcoreService.importFromXML` (`EcoreService.ts:419-425`) → ritorna `{success:false, errors:["Import failed: ${msg}"]}`.
  3. `handleEcoreFileChange` a `ProjectEditor.tsx:780` rilancia: `throw new Error(result.errors.join(', '))`.
  4. catch a `ProjectEditor.tsx:783-786` → `U.alert('e', 'Import Failed', 'Could not import Ecore: ' + error.message)`.
- **Formati accettati dal bottone**: solo `.ecore`. Il dropdown ha anche una voce separata "Import .jmm" (linea 1972-1978) che usa un handler/ref differente (`handleImportJmm`, `importJmmRef`, accept `.jmm`). Quindi: dalla section "Metamodels" → due formati distinti (`.ecore`, `.jmm`); `.xmi` è gestito altrove (XMIService, sezione Models).

**Percorso parallelo (legacy, non triggerato dal bottone Import del dashboard)**: `SaveManager.importEcore_click` (`SaveManager.ts:81-147`) usa `DOMParser + prxml2json.xml2jsonobj` (`frontend/src/common/libraries/prj_xml2json.js`) che prefissa gli attributi con `window.ECoreParser.prefix` (= `@`) — quindi compatibile col validator. Non chiamato dall'Import button della ProjectEditor Dashboard, ma rimane attivo come API.

## 3. JjOM API per popolare metamodelli (Obiettivo 3)

### 3.1. Creazione programmatica

Le API D-level sono complete e usate sia dal parser Ecore sia da jjscript/canvasToJjom. Esistono anche helper L-level di alto livello che incapsulano `D.new()`.

- **Creare metamodello (DModel di tipo M2)**:
  - D-level: `DModel.new(name?, instanceoff?, isMetamodel?, persist?)` — `LModelElement.tsx:4644-4650`. Per M2: `DModel.new('mmName', undefined, true, true)`. Auto-uniquifica il nome via `defaultname` se omesso.
  - Esempio canonico: `frontend/src/examples/StateMachine/M2/index.ts:19` → `DModel.new('metamodel_1', undefined, true)`.
- **Aggiungere DPackage al DModel**:
  - D-level: `DPackage.new(name?, uri?, prefix?, father?, persist?, fatherType?)` — `LModelElement.tsx:1746-1758`. Per root pkg: `DPackage.new(name, uri, prefix, dmodel.id, true, DModel)`.
  - L-level: `LModel.addPackage(name?, uri?, prefix?)` → ritorna `LPackage` (`LModelElement.tsx:1866`, implementazione `:1868-1873`; usato da `Info.tsx:193`).
- **Aggiungere DClass a un DPackage**:
  - D-level: `DClass.new(name?, isInterface?, isAbstract?, isPrimitive?, partial?, partialDefaultName?, father?, persist?, id?)` — `LModelElement.tsx:2661-2668`. Esempio: `DClass.new('Person', false, true, false, undefined, undefined, dpkg.id, true)`.
  - L-level: `LPackage.addClass(name?, isInterface?, isAbstract?, isPrimitive?, isPartial?, partialDefaultName?)` → `LClass` (`LModelElement.tsx:1875-1882`). Usato da `Info.tsx:185`, `canvasToJjom.ts:882`.
- **Aggiungere DAttribute a una DClass**:
  - D-level: `DAttribute.new(name?, type?, father?, persist?)` — `LModelElement.tsx:4128-4133`. `type` è `Pointer<DClass>` (verso il DClassifier primitivo). Default type: `Selectors.getFirstPrimitiveTypes()` (primo registrato globalmente).
  - L-level: `LClass.addAttribute(name?, type?)` → `LAttribute` (`LModelElement.tsx:3079-3082`).
  - Multiplicity: campi diretti su `DAttribute` (vedi §3.2). `lowerBound`/`upperBound`/`ordered`/`unique` (cfr. `LModelElement.tsx:4167-4169`). Non c'è argomento dedicato in `new()` — vanno settati via L proxy (`(lattr as any).lowerBound = N`) o `SetFieldAction`.
- **Aggiungere DReference a una DClass**:
  - D-level: `DReference.new(name?, type?, father?, persist?)` — `LModelElement.tsx:3769-3774`. Default type: `father` (auto-reference). I campi `composition` (= containment), `aggregation`, `container`, `lowerBound: 0`, `upperBound: 1`, `opposite` sono campi diretti su `DReference` (`LModelElement.tsx:3737-3767`) — vanno settati post-creazione.
  - L-level: `LClass.addReference(name?, type?)` → `LReference` (`LModelElement.tsx:3084-3087`).
- **Settare `extends`** (gerarchia tra DClass):
  - L-level: `lclass.extends = [otherLClass, ...]` — setter `set_extends` a `LModelElement.tsx:3306-3344`. Side-effects: validazione anti-ciclo via `get_canExtend`, `_fixExtendInstances` per istanze M1 esistenti, `TRANSACTION` interna. Per metamodel-only puro è sufficiente assegnare l'array.
- **Settare `opposite`** (bidirezionale tra due DReference):
  - L-level: `lref.opposite = otherLRef` — setter `set_opposite` a `LModelElement.tsx:4030-4037`. **Scrive solo un lato**: `SetFieldAction.new(c.data, 'opposite', ptr, ...)`. Per bidirezionale bisogna assegnare manualmente entrambi (`refA.opposite = refB; refB.opposite = refA;`). Vedi Open Q.3.

### 3.2. Primitive types

- **Modello**: i tipi primitivi (`EString`, `EInt`, `EBoolean`, `EDouble`, `EFloat`, `EChar`, `EDate`, `ELong`, `EShort`, `EByte`, `EBigDecimal`, `EBigInteger`, `EVoid` — enum `ShortAttribETypes` a `U.tsx:3322-3348`, long-form `AttribETypes` a `U.tsx:3615+`) sono `DClassifier` (specificamente `DDataType`) **registrati globalmente** nel kernel e indicizzati in `state.primitiveTypes` (`DState`). Non sono stringhe né enum: sono entità con `id` pointer.
- **API selettore**:
  - `Selectors.getAllPrimitiveTypes(): DClassifier[]` — `selectors.ts:151-156`. Itera `state.primitiveTypes`.
  - `Selectors.getFirstPrimitiveTypes(): DClassifier` — `selectors.ts:157-159`. Usato come default per `DAttribute.new` quando `type` è omesso.
  - `Selectors.getPrimitiveType(type: AttribETypes | ShortAttribETypes, state?): DClassifier` — `selectors.ts:146-150`. Lookup tramite `state.idlookup["Pointer_"+shorttype.toUpperCase()]` (es. `"Pointer_ESTRING"`).
  - `Selectors.getDefaultEcoreClass(type: DefaultEClasses | ShortDefaultEClasses, state?): DClassifier` — `selectors.ts:140-145`. **Hardcoded a EObject** (vedi commento `// todo: make other m3 classes and make this generic`); non utilizzabile in modo generico.
- **API per dichiarare un EAttribute di tipo X**:
  ```ts
  const eStringType = Selectors.getPrimitiveType('EString', state); // DClassifier
  const attrType: Pointer<DClass> = LPointerTargetable.from(eStringType).id;
  const dattr = DAttribute.new('fullName', attrType, parentClass.id, true);
  ```
  oppure via L-level: `lclass.addAttribute('fullName', LPointerTargetable.from(Selectors.getPrimitiveType('EString')))`.

### 3.3. Uniqueness

- **`nameUniqueness.ts`** (`frontend/src/model/logicWrapper/nameUniqueness.ts`) — **NON applicabile** al metamodel-level. Lo scope esplicito (`nameUniqueness.ts:1-15`) è siblings tra `LObject` M1 (rootable in `LModel` o nested dentro `LValue` di un container). API: `getSiblingNamespace(lobj, opts)`, `validateNameUniqueness(lobj, newName, opts)`, `detectDuplicateNames(model)`. Tutte ritornano `LObject[]`. Non c'è equivalente per `LClass`/`LAttribute`/`LPackage`.
- **`DPointerTargetable.defaultname(prefix, father, metaptr): string`** — `frontend/src/joiner/classes.ts:1421-1440`. Genera nomi unici tipo `Concept_0`, `Concept_1`... usando `U.increaseEndingNumber(prefix + '0', false, false, condition)` (`U.tsx:1496`). `father` può essere `Pointer | DPointerTargetable | ((newname:string)=>boolean)`. È invocato automaticamente dai `.new()` di `DClass/DAttribute/DReference/DPackage/DModel` quando `name` è omesso. Pattern di numerazione: suffisso numerico (`Concept_1`), NON `(1)`/`(2)`.
- **Pattern `(1)`/`(2)`**: utility locale inline in `ProjectEditor.tsx:1059-1086` (funzione `getUniqueTransformationName`), specifica per i nomi dei modelli risultato di trasformazione. NON è esposta come utility generica.
- **Conclusione**: per popolare un metamodel da Ecore con classi/attributi/riferimenti potenzialmente collidenti col DModel attivo, NON c'è un'utility centrale. Il pattern de-facto è (a) lasciare che `D.new()` chiami `defaultname` (genera `Concept_0`...) se `name` è omesso, (b) per nomi forniti dall'utente affidarsi alla validation del setter del singolo campo `name` (es. `LObject.set_name` chiama `nameUniqueness` solo per M1 — non c'è equivalente M2).

### 3.4. Containment per metamodel-level DReference

- **Pattern**: campo booleano `composition` su `DReference` (`LModelElement.tsx:3762`). Default `false`. Il campo `aggregation` esiste per modellare UML ma in Ecore non viene mai settato. Il getter L-level `LReference.containment` ritorna `composition || aggregation` (`LModelElement.tsx:3959`); il setter `set_containment(val)` scrive di default su `composition` (`LModelElement.tsx:3960-4014`).
- **Source di verità**: il parser Ecore corrente fa `dObject.composition = U.fromBoolString(this.read(json, ECoreReference.containment, false), false)` a `data.ts:810`, mappando `containment="true"` dell'XML su `composition: true`.
- **Side effects del setter L-level** (`set_containment` linea 3960-4014): se è M1 (`get_instances` non vuoto), fa riassegnare `father` degli oggetti puntati al value della reference contenitiva, rimuove i pointer da altri value containers, eccetera. Per metamodel puro (M2 vuoto di istanze) il setter è di fatto un `SetFieldAction` su `composition`. Per **costruire un metamodel da Ecore**: scrivere direttamente `dRef.composition = true` (campo D) prima di `Constructors.persist` è equivalente e bypassa side-effects M1 inutili.
- Il campo `container` è un altro flag derivato (`LReference.container` = "ha un opposite che è containment"), `LModelElement.tsx:3869`. Non va settato manualmente: viene calcolato.

## 4. Failure mode reale dei file di test

Path attivo: `EcoreService.xmlToJson` → `EcoreParser.parse(_, isMetamodel=true)` → `parseM2Model` → `parseRootPackage`.

**Step di rottura**: `data.ts:626` — la `Log.ex(...)` sull'`includes(version)`.

**Stringa letta come "found instead"**: `''` (stringa vuota). La causa è doppia e indipendente:

1. **Prefix mismatch** (più immediato): `EcoreService.xmlToJson` a `EcoreService.ts:468` prefissa gli attributi XML con `'-'`:
   ```ts
   json['-' + attr.name] = attr.value;
   ```
   ma il validator legge `json[EcoreParser.prefix+"xmlns:ecore"]` con `prefix='@'` (`data.ts:136, 623`). La chiave `"-xmlns:ecore"` esiste con il valore corretto, ma `json["@xmlns:ecore"]` è `undefined` → `'' (||)`. Quindi `version === ''`, non incluso negli `supportedEcoreVersions`, throw.

2. **Wrapping XMI ignorato**: anche se il prefisso fosse corretto, `parseM2Model` passa il **root element (`xmi:XMI`)** a `parseRootPackage` (`data.ts:382`). I file di test hanno `@xmlns:ecore` come attributo dell'`<xmi:XMI>` root — coincidenza fortuita: in questo specifico caso il validator passerebbe (perché l'attr è sull'XMI root). Ma `getChildren(json)` (chiamato a `data.ts:639`) restituirebbe i 2 `ecore:EPackage` children, e per ciascuno `child[ECoreClass.xsitype]` è undefined (il tipo è dato dal tag name, non da `xsi:type`) → switch a `data.ts:640` cadrebbe nel `default: Log.exx('unexpected xsitype: ...')`. Quindi un secondo crash a valle.

**Path che gestirebbe `<xmi:XMI>` come root**: solo `parseM2Model_old` (`data.ts:386-410`) — dead code, nessun chiamante. Itera `getChildren(json)` e chiama `parseRootPackage(dObject, child, generated)` su ognuno. Per i file di test ciò significherebbe 2 invocazioni di `parseRootPackage`, una per package (Persons + PrimitiveTypes), risultato: il DModel contiene 2 DPackage. Modulo il bug del prefisso, è strutturalmente la forma giusta per multi-package XMI-wrapped.

**Per i 2 file di test specifici**:

- `Persons.ecore` e `Families.ecore`: stesso fallimento al validator. Anche se il fix prefix + wrapping fossero applicati, le reference XPath (`eType="/1/String"`, `eSuperTypes="/0/Person"`, `eOpposite="/0/Member/familyFather"`) **non sono risolvibili dal `LinkAllNamesToIDs` corrente** (`data.ts:195-353`): cerca `replacePrimitiveMap[value]` (chiavi: `"#//EString"`, alias di tipo) o `nameMap[typeprefix + name]` (chiavi: `"#//ClassName"`). Una stringa `/1/String` non matcha nessuna delle due → `Log.ex(!target, ...)` a `data.ts:300` → crash con messaggio "LinkAllNames() can't find type target".

**EDataType custom (`String` in `PrimitiveTypes` package)**: esiste un fallback a `data.ts:283-286`:
```ts
if (!target && value.indexOf("ecore:EDataType") === 0) { /* remap to EString */ }
```
Ma la stringa `/1/String` non inizia con `"ecore:EDataType"` → fallback non scatta. Per il fix Fase B serve riconoscere il pattern XPath-style E i nomi di EDataType "noti" (`String`, `Integer`, `Boolean`, `Double`, `Real`) → EString/EInt/etc.

## 5. Open Questions

1. **Prefix `-` vs `@` in `EcoreService.xmlToJson`** — l'unico file in repo che usa `-` come prefisso attributi è `EcoreService.ts:468`. Il commento alla linea 467 dice "Use '-' prefix as EcoreParser expects" — contraddetto da `EcoreParser.prefix = '@'`. Bug introdotto durante il rewrite del servizio? Aligning a `@` è il fix minimale. Da confermare se altri test/consumer dipendono da `-` (a vista, no).
2. **Distinzione XMI-wrapped vs single-EPackage** — qual è il segnale di detection più robusto? Opzioni: (a) presenza key `ecore:EPackage` come child del root JSON (il tag name si conserva nelle chiavi degli oggetti, quindi tracciabile); (b) presenza attributo `@xmlns:xmi` E assenza di `@nsURI` sul root; (c) propagare il `nodeName` del root XML come campo speciale prima della conversione JSON. (a) è probabilmente il più leggibile.
3. **`LReference.set_opposite` scrive un lato solo** — il setter a `LModelElement.tsx:4030-4037` non auto-sincronizza l'opposite della reference target. Per file Ecore con `eOpposite` bidirezionale (i nostri test) bisogna iterare 2 volte (prima crea tutte le ref, poi un secondo passaggio set opposite su entrambi i lati). Confermare se è davvero così o se esiste un side-effect non visibile (cfr. `set_father` o `Constructors` hook).
4. **XPath pointer resolution** — strategia per `/0/Person`, `/0/Member/familyFather`: (a) pre-pass che riscrive `/N/X` → `"#//X"` e si appoggia al `LinkAllNamesToIDs` esistente (rischio: collisione nomi tra package); (b) resolver dedicato che indicizza le top-level EPackage per posizione e fa lookup name-based dentro il N-esimo package. (b) è più corretto ma più invasivo. Per MVP (a) funziona se assumiamo namespace flat — accettabile per Ecore semplici come i test, da documentare come limitazione.
5. **Gestione del dead-code `parseM2Model_old`** — eliminare o restaurare? Se Fase B riusa l'approccio "iterate children", `parseM2Model` può essere riscritto **in-place** assorbendo la logica di `_old` (e quest'ultimo cancellato). Decidere se Fase B può modificare `parseM2Model` o se deve introdurre `parseM2Model_xmi` separato per non rischiare regressioni su file ecore single-package.
6. **Multiplicity (`upperBound=-1`) e altre flag attributi** — `parseDAttribute` (`data.ts:792-793`) legge `lowerBound`/`upperBound` direttamente da `json[@lowerBound]`/`json[@upperBound]` via `this.read`. Con prefix `-` invece di `@`, anche queste letture falliscono e cadono al default `0`/`1`. È un sintomo dello stesso bug del Q.1, ma rilevante per il fix: la correzione del prefix sblocca tutto in cascata.
7. **`ImportDropZone` non visibilmente wrappato sul Dashboard** — il componente esiste e gestirebbe drop di `.ecore` chiamando lo stesso `EcoreService.importFromFile`. Verificare se è in uso da qualche parte del Dashboard o solo orfano. Non è critico per Fase B (il flusso bottone è prioritario), ma se è attivo eredita lo stesso bug.

## 6. Estensioni richieste per Fase B (preliminary)

Lista non-prescrittiva di interventi candidate per il fix Opzione 2. Lo scope finale va deciso insieme.

- **Fix prefix attributi in `EcoreService.xmlToJson`** (`EcoreService.ts:468`): cambiare `'-' + attr.name` in `EcoreParser.prefix + attr.name` (= `@`). Singolo-file change. Sblocca tutte le letture attributo (xmlns:ecore, name, nsURI, lowerBound, upperBound, ...).
- **Supporto root `<xmi:XMI>` in `parseM2Model`** (`data.ts:368-384`): aggiungere detection del wrapper XMI e iterare `getChildren(json)` chiamando `parseRootPackage` su ciascun `ecore:EPackage` child. Riusare logica di `parseM2Model_old`. Detection candidate: presenza key `ecore:EPackage` come child object.
- **XPath pointer resolver per `eType`/`eSuperTypes`/`eOpposite`**: pre-pass nel `LinkAllNamesToIDs` (`data.ts:195-353`) che normalizza pointer XPath-style. Per `/N/X` → `"#//X"`. Per `/N/X/Y` (feature reference per eOpposite) → strategy più complessa, possibilmente costruire una mappa `(className,featureName) → DReference.id` durante un primo passaggio.
- **Riconoscimento EDataType per nome con fallback a EString/EInt/etc.**: estendere `replacePrimitiveMap` in `LinkAllNamesToIDs` con alias `"String" → EString`, `"Integer" → EInt`, `"Boolean" → EBoolean`, `"Double" → EDouble`, `"Real" → EDouble` (mapping da decidere). Se serve, riconoscere anche pattern XPath di EDataType (`/N/String` → EString) come parte del pre-pass del punto precedente.
- **Bidirectional opposite wiring**: due-pass nel parser. Pass 1: crea tutte le DReference, accumula `{refId, oppositePath}` pendenti. Pass 2 (dopo `LinkAllNamesToIDs`): risolve `oppositePath` a `DReference.id` target e setta `dRef.opposite = targetId` + `targetRef.opposite = dRef.id` (entrambi i lati esplicitamente).
- **(Opzionale) Naming conflict guard per metamodel-level**: utility analoga a `nameUniqueness.ts` ma per `LClass`/`LAttribute`/`LReference` siblings dentro un `LPackage`. Non bloccante per il fix, ma utile per evitare collisioni se l'utente importa lo stesso file due volte. Riusabile come fondamento di rinominazione auto-suffix `(1)`/`(2)` sui DModel duplicati.
- **Multiplicity flag**: dopo il fix prefix il parser già legge `lowerBound`/`upperBound` correttamente (`data.ts:792-793`, `812-813`), incluso `upperBound="-1"`. Nessun lavoro extra previsto.
