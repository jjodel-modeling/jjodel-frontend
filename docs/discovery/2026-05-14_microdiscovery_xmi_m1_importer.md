# Microdiscovery — XMI M1 Importer (Phase A, read-only)

**Date**: 2026-05-14
**Branch**: `alfonso-frontend-jjtl`
**Mode**: read-only Phase A. Zero source files modified.
**Working tree at start**: dirty post-B.1/B.1.1 (3 files modified, 4 fixtures untracked, 3 prior discovery docs untracked, log modified). Only the two doc deliverables of this Phase A were added.

---

## 1. Sintesi esecutiva

Il workstream "Importer XMI M1" è **già parzialmente attivo** sul branch corrente. Tra il prompt che ha aperto l'attività (B.1 implement) e questo prompt di discovery, sono stati landed in working-tree (non ancora committati):

- **B.1**: `XMIService.importM1FromFile` + `importM1FromXML` (flat instances + primitive attributes, auto-resolve metamodel via xmlns, wrapper `<xmi:XMI>` path), `handleXmiFileChange` + button "Import Model (.xmi)" in ProjectEditor, 3 fixtures.
- **B.1.1**: branching `wrapper / single-root` con error message dedicato, skip esteso di `xmi:version` e `xmi:type`, fixture `table-example.xmi`.

Quindi la discovery di Phase A è in larga parte un **inventory dello stato corrente** più che una mappa di territorio inesplorato. Resta utile come baseline per Phase B.2 (containment), B.3 (xsi:type polymorphism + cross-instance refs) e per round-trip parity con l'export.

**Cosa esiste già**: XML parser (browser-native `DOMParser` + `prj_xml2json.js` custom), pattern canonico DObject.new senza outer TRANSACTION, sync layer reattivo (`useJjomSync` Step 2bis crea DVertex per ogni DObject scoperto, Step 4 crea edge per ogni DReference value), nameMap resolver in M2 importer (riusabile per xsi:type), NodeProblem registry per validation aggregate, importer M1 base B.1.

**Cosa manca**: containment nesting (B.2), `xsi:type` polymorphism (B.3), cross-document `href` (post-MVP), `xmi:id` preservation per round-trip, M1-level cardinality validation (oggi solo `nameUniqueness` è attivo).

**Sforzo stimato per le fasi successive**: B.2 small (riuso pattern `parseDObject` di data.ts:583 con `fatherType=DValue`); B.3 medium (resolver xsi:type + ricostruzione references via two-pass); round-trip parity small (xmi:id passthrough).

**Blocchi inattesi**: nessuno. Le decisioni architetturali di B.1 (no TRANSACTION wrapping, stringhe puro come values, ignorare xmi:id) si rivelano allineate ai pattern già consolidati nel codebase.

---

## 2. Risposte alle 19 domande

### A. Entry-point UI e flow utente

**A1 — Dove vive l'entry-point UI per Import Ecore (M2)?**
`frontend/src/components/project/ProjectEditor.tsx`. Catena:
- `importEcoreRef = useRef<HTMLInputElement>(null)` — ProjectEditor.tsx:225
- `handleImportEcore` — ProjectEditor.tsx:758-762: `importEcoreRef.current?.click(); setShowImportMenu(false);`
- `handleEcoreFileChange` — ProjectEditor.tsx:783-825: chiama `EcoreService.importFromFile(file)`, su `success` collega il modello a `project.metamodels`/`project.graphs`.
- Label "Import Ecore (.ecore)" — ProjectEditor.tsx:2063, dentro il dropdown `import-select-menu` della section METAMODELS.
- Hidden file input — ProjectEditor.tsx:2672-2677: `<input ref={importEcoreRef} type="file" accept=".ecore" style={{display:'none'}} onChange={handleEcoreFileChange}/>`

**A2 — Esiste già qualche scheletro UI/codice per "Import XMI" / "Import Model" / "loadModel" / "import*model"?**
**SÌ — già implementato (B.1)**. File-level:
- `XMIService.importM1FromFile` — `frontend/src/services/export/XMIService.ts:463` (async wrapper su FileReader, UTF-8).
- `XMIService.importM1FromXML` — XMIService.ts:482 (corpo principale: parse, validate root, resolve metamodel, walk).
- `handleImportXmi` — ProjectEditor.tsx:832-835.
- `handleXmiFileChange` — ProjectEditor.tsx:838-870.
- `importXmiRef` — ProjectEditor.tsx:228. Hidden input — ProjectEditor.tsx:2680-2685.
- `showImportModelMenu` state + click-outside handler — ProjectEditor.tsx:218-220, 308-321.
- Button "Import Model (.xmi)" dentro dropdown `import-select-menu` della section MODELS — ProjectEditor.tsx:2200+ (numero linea approssimato post-B.1.1).

`EcoreParser.parseM1Model` in `frontend/src/api/data.ts:472` è un secondo importer M1 di natura interna (chiamato dal flusso `parseM2Model` per dispatching, ma non wired a UI corrente).

**A3 — Creazione manuale di un DObject M1?**
Tre path attivi:
1. **JjScript** — `frontend/src/jjscript/executor/commands/instance.ts:executeCreateInstance` (riga 154-265). Snippet riga 227-233:
   ```typescript
   const dObject = (DObject as any).new(
       metaclass.id, targetModel.id, DModel, instanceName, true
   );
   ```
2. **Canvas drag/drop** — `frontend/src/components/editor-v2/sync/canvasToJjom.ts:syncCreateObject` (riga 1117-1156). Stesso pattern + `createVertexForObject` per il DVertex.
3. **Transformations pipeline (JjTL via ProjectEditor)** — ProjectEditor.tsx:1528: `const dObject = DObject.new(targetClass.id, dModel.id, DModel, objectName, true);` con accumulo di pending attribute writes e flush deferred (vedi pattern CLAUDE.md "Deferred attribute setting").

In **tutti e tre** i path la regola è: NO outer TRANSACTION wrapping. `Constructors.persist` (classes.ts:643) apre già una sua TRANSACTION interna e il nesting è vietato (commento esplicito a useJjomSync.ts:496-498 e a canvasToJjom.ts:1107).

**A4 — Esiste un Export XMI M1?**
**SÌ**. `XMIService.exportToXML(model, options)` — XMIService.ts:70-117 (existed prior to B.1, indipendente dall'importer). Output: XML con `<xmi:XMI>` wrapper + namespace declarations + optional embedded metamodel (`<embeddedMetamodel>` block via `EcoreService.exportToXML`). Schema di emit:
- Riga 154: `xmi:id="${obj.id}"`
- Riga 168-172: attributi primitivi inline (single-value e multi-value space-separated)
- Riga 199-209: containment children come nested elements
- Riga 192: non-containment refs come space-separated id list

Già wired a UI: `handleExportXMI` — ProjectEditor.tsx:874-880, accessibile da context menu del singolo model (ProjectEditor.tsx:2331).

**Implicazione cruciale**: lo schema di mapping DObject ⇄ XML è già fissato lato output; gli importer post-B.1 devono solo invertirlo (compresi `xmi:id`, containment nesting, non-containment refs via id list). Niente reverse-engineering necessario.

Altra superficie storica: `SaveManager.exportEcore_click` (frontend/src/components/topbar/SaveManager.ts:60-78) supporta export M1/M2 toggle via `toXML` flag (path JSON o XML via `XML.fromJSON`). Probabilmente legacy/parzialmente non wired (vedi entry log 2026-05-14 Fase A.5 discovery: "SaveManager.exportEcore_click + importEcore_click + importEcore_click0 sono dead code").

---

### B. Persistenza progetti

**B1 — Il file di progetto include le istanze M1?**
SÌ implicitamente. Il "save" non serializza M1 in formato dedicato: serializza l'**intero Redux DState**, che contiene tutti i `DObject`/`DValue` indicizzati in `state.idlookup`.

**B2 — In che formato?**
JSON nativo Redux, `JSON.stringify(state)`. Vedi `SaveManager.save` — SaveManager.ts:31-33:
```typescript
static save(): void {
    let project: LProject = DUser.current.project;
    if (project) ProjectsApi.save(project);
}
```
e `ProjectsApi.save` — frontend/src/api/persistance/projects.ts:94 (delega a `Online.save`/`Offline.save` con `dProject` payload). Non XMI, non Ecore.

**B3 — Load Project è un import M1 mascherato?**
NO. `SaveManager.load` — SaveManager.ts:41-58:
```typescript
let save: GObject<DState> = SaveManager.tmpsave = 
    typeof state0 === 'string' ? JSON.parse(state0) : state0;
// ... patch viewelements/viewpoints, VersionFixer.update, LoadAction.new(save)
```
È un **dump/restore di Redux DState**: `LoadAction.new(save)` reinserisce tutto `idlookup` nello store. Niente parsing instance-by-instance, niente DObject.new per element. Le istanze M1 sono già materializzate come `DObject` dentro `state.idlookup` e vengono caricate atomicamente.

**B4 — C'è un livello di astrazione condivisibile (bulkCreateDObjects)?**
NO. Non esiste un `bulkCreateDObjects(spec[])` o equivalente. Il pattern canonico è un **loop di `DObject.new` individuali**, ognuno con TRANSACTION interna automatica. Vedi:
- `EcoreParser.parseM1Model` (data.ts:472-543) — loop con `parseDObject` per ogni root.
- `XMIService.importM1FromXML` (B.1) — loop esplicito.
- ProjectEditor transformation pipeline (riga 1528) — loop per `targetInstances`.

Tentare di accorpare con TRANSACTION outer → nesting violation. La concorrenza è gestita dal sync layer reattivo (`useJjomSync` osserva `modelObjectCount` come dep).

---

### C. Parser XML / XMI

**C1 — Quale library XML è in uso?**
- **Built-in browser `DOMParser`** — 5 usage sites: U.tsx:281, U.tsx:299, XMIService.ts:342, XMIService.ts:487 (B.1 path), EcoreService.ts:425.
- **Custom `prj_xml2json.js`** in `frontend/src/common/libraries/prj_xml2json.js` — converte XML DOM → JSON con prefisso `-` per attributi (allineato a `EcoreParser.XMLinlineMarker = '-'` a data.ts:959). Esposto come `XML.parse`, `XML.toJson`, `XML.fromJSON` via `frontend/src/joiner/index.ts:21-25`.

`package.json` NON contiene xml2js, fast-xml-parser, sax, htmlparser2, xmlbuilder o altri parser esterni.

**C2 — Quale parser usa l'importer Ecore?**
`frontend/src/api/data.ts` opera già su **JSON** (tipo `Json`), non su stringa XML. La conversione avviene a monte. Per esempio, `EcoreService.importFromFile` (EcoreService.ts) usa `DOMParser` (riga 425) e poi un `xmlToJson` interno (EcoreService propria), prima di passare il JSON a `EcoreParser.parse(json)` in data.ts. Quindi `data.ts` non chiama mai `DOMParser` direttamente.

Stesso pattern in `XMIService.importM1FromXML` (B.1): `DOMParser → this.xmlToJson(xmiRoot) → walk JSON`.

**C3 — Il parser scelto supporta xsi:type / xmi:id / href?**
`DOMParser` supporta tutto (attributi XML standard letti come stringhe). `prj_xml2json.js` e l'`xmlToJson` di XMIService normalizzano tutti gli attributi con prefisso `-`, quindi `xsi:type` diventa `-xsi:type`, `xmi:id` → `-xmi:id`, `href` → `-href`. Nessun trattamento speciale: sono semplici chiavi del JSON output.

Uso esistente di `xsi:type` nel codebase: data.ts:1307, 1325, 1336 (definizioni costanti per Ecore parsing M2). data.ts:784-786 mostra il pattern di switch:
```typescript
const xsiType = this.read(child, ECoreAttribute.xsitype);
switch (xsiType) { default: Log.exx('unexpected xsi:type: ', ...); ... }
```
Per **M1 importer**, B.1 ignora `xsi:type` con warning capped a 5 (XMIService.ts:checkForXsiType). B.3 dovrà aggiungere un resolver.

---

### D. Creazione DObject M1 in batch

**D1 — Esiste un pattern bulk?**
SÌ, ma non come API singola: è un **loop manuale di `DObject.new`** senza TRANSACTION outer. Tre snapshot:
- `EcoreParser.parseM1Model` data.ts:536-538:
  ```typescript
  for(let rootjson of roots_for_this_metaclass) {
      EcoreParser.parseDObject(rootjson, dObject, DModel, mmclass, generated);
  }
  ```
- `XMIService.importM1FromXML` (B.1) XMIService.ts:547-562 — stesso pattern, push manuale a `dModel.objects`.
- ProjectEditor.tsx:1528 (transformation pipeline) — loop su `targetInstances` con `DObject.new` ognuno.

**D2 — API canonica per single DObject?**
`DObject.new(instanceoff?, father?, fatherType?, name?, persist=true)` — definita in `frontend/src/model/logicWrapper/LModelElement.tsx:5663`. Signature:
```typescript
public static new(
    instanceoff?: DObject["instanceof"],
    father?: DObject["father"],
    fatherType?: typeof DModel | typeof DValue,
    name?: DNamedElement["name"],
    persist: boolean = true
): DObject
```
Convenzione canonica per istanze root di un modello: `DObject.new(classId, dModel.id, DModel, name, true)`. Per istanze nested in una containment reference: `DObject.new(classId, dValue.id, DValue, name, true)` (vedi data.ts:639 in `parseDValue`).

**D3 — DValue popolazione**
`DValue.new(name?, instanceof?, val?, father?, persist=true, isMirage=false)` — LModelElement.tsx:6286. Pattern canonico per attributo primitivo (data.ts:629-633 e XMIService.ts B.1):
```typescript
const dValue: DValue = DValue.new(undefined, metaFeature.id, [rawValue], dObject.id, true, false);
dObject.features.push(dValue.id);
```
Pattern alternativo via proxy L (post-creation, deferred): `(lObject as any)['$' + attrName].value = ...` (vedi CLAUDE.md sezione "Pattern critici per Object Persistence", e ProjectEditor.tsx:1413 commento "Store object NAME (not ID!) ... ID from DObject.new() is unreliable").

**D4 — Reference cross-istanza (DValue su DReference che punta ad altro DObject)?**
Pattern canonico via proxy L (canvasToJjom.ts:1285-1296):
```typescript
TRANSACTION('EditorV2 create composition link', () => {
    const refProxy = (parentObject as any)['$' + referenceName];
    if (refProxy) {
        const rawVals: any[] = refProxy.__raw?.values ?? [];
        const meaningful = rawVals.filter((v: any) => v != null && v !== '');
        refProxy.values = [...meaningful, childObject.id];
    }
    // optionally: DVoidEdge.new2(refDefId, graphId, graphId, undefined, parentVertexId, childVertexId, ...)
});
```
Pattern raw equivalente: `DValue.new(undefined, refMetaFeature.id, [targetObjectId, ...], dObject.id, true, false)` + `dObject.features.push(dValue.id)`. Da preferire dentro un loop di import (no outer TRANSACTION), riservando l'append `.values` per setter post-batch.

---

### E. Sync layer e xsi:type resolver

**E1 — Il pattern import M1 è compatibile col sync layer?**
SÌ. `useJjomSync` (frontend/src/components/editor-v2/hooks/useJjomSync.ts) ha due step rilevanti:

- **Step 2bis** (riga 536-567): scopre ogni `DObject` in `rawModel.objects` che non ha ancora un `DVertex` nel graph e ne crea uno automaticamente con layout grid. Snippet riga 540-565:
  ```typescript
  if (missingObjectsCount > 0) {
      for (const objId of (rawModel.objects ?? [])) {
          // ... compute (x, y) grid position ...
          const size = new GraphSize(x, y, 200, 120);
          const dv = DVertex.new(0, objId, graphId, graphId, undefined, size);
          if (dv?.id) vertexIdByModelId.set(objId, dv.id);
      }
  }
  ```
- **Step 4** (riga 636-689): scopre ogni `DReference` value che punta a un DObject visibile e crea il `DVoidEdge` corrispondente.

**Implicazione architetturale chiave**: l'importer XMI **non deve creare vertici/edge canvas**. Deve solo creare `DObject` + `DValue` puro; il sync layer li materializza reattivamente. Conferma empirica in B.1: l'importer crea solo dati, e funziona.

Vincolo: useJjomSync.ts:496-498:
```typescript
// Each DVertex.new / DVoidEdge.new2 has its own internal TRANSACTION,
// so they must NOT be wrapped in an outer TRANSACTION (nesting
// causes x/y coordinates to be lost).
```
Quindi sia l'importer (DObject.new) sia il sync layer (DVertex.new) operano fuori da TRANSACTION outer. Niente conflitti.

Deps di re-fire di Step 4: `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]` (useJjomSync.ts:698). `SetFieldAction` su `DValue.values` NON re-fira Step 4 (non è una dep) — confermato dal prompt. Ciò significa che se l'importer scrive references via `SetFieldAction` post-batch, gli edge cross-instance potrebbero non materializzarsi finché non cambia un `modelObjectCount` o equivalente. **Workaround attivo in B.1**: nessun bisogno per ora perché B.1 non importa references; per B.3 dovrà essere considerato.

**E2 — Utility per resolve xsi:type → DClass?**
Parzialmente. Pattern esistenti:
- `nameMap` in data.ts:239-298: durante M2 parse popola map `#//FullName → DModelElement`. Riusabile come lookup ma con chiavi M2-relative.
- `findMetaclassByName(metamodel, className)` in XMIService.ts (B.1, helper privato) — walker stack-based su `metamodel.classes` + subpackages + packages. Già coverage per ereditarietà via `LClass.allAttributes`/`allReferences`.
- `LClass.allAttributes`/`allReferences` getters (LModelElement.tsx:2984-2988) — risolvono ereditarietà.

Per B.3 xsi:type pattern `"ns:Class"`: strip prefisso namespace → invocare `findMetaclassByName(metamodel, classShortName)`. **Stessa funzione già usata per il root tag** in B.1. Solo aggiungere un branch per leggere `-xsi:type` come override del tag-derived type prima del lookup.

---

### F. Validation

**F1 — Esiste un sistema di validation M1 attivo al popolamento?**
Parzialmente. NodeProblem registry esiste in `frontend/src/components/editor-v2/problems/registry.ts`:
- API: `registerProblem(p: NodeProblem)`, `clearProblem(id)`, `markResolved(id)`, `useNodeProblems(nodeId)`, `useActiveOverlayId()`.
- Tipo `NodeProblem`: `{ id, nodeId, kind, severity, title, description, relatedNodeIds, action?, createdAt, resolvedAt? }` — registry.ts:36-47.
- TTL `RESOLVED_TTL_MS = 5000` per problemi marcati risolti.
- Window mirror: `(window as any)._jjNodeProblems: Map<string, NodeProblem>` per debug.

Feeders attivi: **uno solo** — `UniquenessProblemSync.tsx` (mounted in editor-v2): chiama `detectDuplicateNames` da `model/logicWrapper/nameUniqueness.ts` e registra `kind: 'duplicate-name'`. Niente feeder per cardinalità, type-mismatch, abstract class instantiation, multiplicity violations. M1-level cardinality validation non è implementata.

**F2 — Bulk import + validation: silenzia o tollera?**
B.1 attualmente **non interagisce** col NodeProblem registry. Le warning (xsi:type, nested, unknown attribute) sono raccolte in un array locale `warnings[]` e loggate via `console.warn` + ritornate in `XMIImportResult.warnings`. Il pattern proposto è ortogonale al registry: l'importer è un puro batch producer di errori in-memory, decoupled dalla UI di validation.

Considerazione: dato che `UniquenessProblemSync` osserva DState e reagisce ai cambi DObject/DValue, durante import bulk *può* triggerare problem registration spurio per nomi duplicati transienti. Tuttavia il pattern attuale di B.1 non genera duplicati (default-name di `DObject.new` usa `defaultname` autoincrement) e non si è osservato il problema empiricamente.

Per Phase B.3 con risoluzione references inter-istanza, se in futuro venissero introdotti validatori cardinality/type-mismatch, conviene loggare nel `warnings[]` interno (no registry) durante il batch e poi, **dopo** il return, registrare un eventuale NodeProblem aggregato a livello model (`relatedNodeIds: [dModel.id]`) per surfacing UI. Niente silenziamento esplicito necessario.

---

## 3. Pattern di codice riusabili

| Path:line | Descrizione |
|-----------|-------------|
| `frontend/src/services/export/XMIService.ts:487` | `DOMParser → xmlToJson` pipeline per XMI input |
| `frontend/src/services/export/XMIService.ts:561-562` | `DObject.new` + manual push a `(dModel.objects as Pointer<DObject>[]).push(dObject.id)` — pattern fuori da TRANSACTION |
| `frontend/src/model/logicWrapper/LModelElement.tsx:5663` | `DObject.new(instanceoff, father, fatherType, name, persist)` — signature canonica |
| `frontend/src/model/logicWrapper/LModelElement.tsx:6286` | `DValue.new(name, instanceoff, val, father, persist, isMirage)` |
| `frontend/src/api/data.ts:629-631` | `DValue.new + parent.features.push(dValue.id)` pattern raw |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts:1285-1296` | Reference value via proxy L con TRANSACTION wrapper (single op, no nesting) |
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts:540-567` | Step 2bis: auto-DVertex per ogni DObject scoperto in `model.objects` |
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts:642-689` | Step 4: auto-DVoidEdge per ogni DReference value valido |
| `frontend/src/services/export/XMIService.ts:70-117` | `exportToXML` — schema di emit inverso (riferimento per round-trip) |
| `frontend/src/components/editor-v2/problems/registry.ts:127` | `registerProblem(p)` per post-batch surfacing UI |
| `frontend/src/api/data.ts:239-298` | `nameMap` resolver pattern (riusabile per xsi:type cross-doc) |
| `frontend/src/joiner/classes.ts:643` | `Constructors.persist` opens internal TRANSACTION — nesting vietato |
| `frontend/src/model/logicWrapper/LModelElement.tsx:2984-2988` | `LClass.allAttributes/allReferences` — getter con ereditarietà |

---

## 4. Architettura proposta

Visto che B.1 è già landed (wrapper `<xmi:XMI>` + single-root + flat attributes, con auto-resolve metamodel via xmlns e helper privati `findMetaclassByName` / `findMetafeatureByName` / `checkForXsiType` / `getMetamodelByNsURI`), l'architettura **resta confermata**: importer puro-dati che produce `DObject`+`DValue`, materializzazione canvas delegata a `useJjomSync` (Step 2bis + Step 4), nessun TRANSACTION wrapping outer, lookup metaclass riusato sia per root tag sia (futuro) per xsi:type. Le tre forme di "creazione DObject" presenti nel codebase (JjScript via `executeCreateInstance`, canvas via `syncCreateObject`, transformation pipeline in ProjectEditor) sono coerenti col pattern adottato in `importM1FromXML` — niente refactoring orizzontale necessario.

Per **Phase B.2 (containment)**: estendere il loop di walking attributi in `importM1FromXML` per riconoscere keys non-dash come containment children, ricorrere con `DObject.new(childClassId, parentDValue.id, DValue, ...)` (pattern di `parseDObject` in data.ts:583 con `fatherType=DValue` e `parent=dValue`). Il containment DValue va creato per primo, popolato la sua `values` con il childObject.id, e contribuisce a `dObject.features`. Per **Phase B.3 (xsi:type + non-containment refs)**: riusare `findMetaclassByName(metamodel, classShortName)` per il resolver xsi:type (after strip namespace prefix); per cross-instance refs introdurre un secondo pass post-DObject-creation che risolve `xmi:id` references via un id-to-DObject map costruito al primo pass.

---

## 5. Open Questions per Fase B

1. **Containment nesting (B.2)**: il pattern parseDObject di data.ts:583 usa `fatherType=DValue` e push a `parent.values`; lo replichiamo verbatim, oppure per uniformità manteniamo `fatherType=DModel` e gestiamo la father link tramite DValue separato? Decidere se i child DObject devono apparire in `dModel.objects` (visibili come istanze top-level del modello) o solo come values del containment DValue (nesting strict).
2. **xsi:type polymorphism (B.3)**: il resolver è `findMetaclassByName(metamodel, classShortNameAfterPrefixStrip)` o serve un map dedicato xsi:type → DClass costruito post-import del metamodel? Performance e correctness: il walker stack-based è O(N) per lookup, ma N è piccolo (~50 classi tipiche).
3. **xmi:id preservation**: per round-trip con `XMIService.exportToXML` (che emette `xmi:id="${obj.id}"`), l'importer deve preservare gli xmi:id come `DObject.id` (o un alias separato)? Implicazione: collision con id auto-generati da Constructors. Alternativa: ignorare in import + warning.
4. **Cross-document `href` non-containment refs**: in MVP scope (B.3) o post-MVP? I sample correnti (Persons, Families, Book, Table) NON hanno `href`. Il pattern XML `<ref href="other.xmi#id"/>` richiede un model resolver multi-file.
5. **Naming UI**: post-B.1 il bottone è "Import Model (.xmi)" (`accept=".xmi,.xml"`). Confermare label oppure rinominare in "Import Model Instance" per disambiguazione con i metamodel?
6. **Warning surface**: `XMIImportResult.warnings: string[]` è solo loggato a `console.warn` dall'handler. Conviene aggregare come `NodeProblem` (`kind: 'import-warning'`, severity: warning, nodeId: dModel.id) per visualizzazione persistente in UI?
7. **Multi-valued primitive attributes**: B.1 supporta solo single-valued. Il pattern esistente in `XMIService.exportToXML:171` per multi-valued usa space-separated values nell'attributo XML; l'importer dovrà splittare su space + cast a tipo primitivo. Decidere strategia di parsing (whitespace strict, supporto per valori che contengono spazi tramite escaping XML attribute splitting).
8. **NodeProblem-driven post-import validation**: introdurre un validator step opzionale (`validateM1Bulk(dModel)`) che a fine import verifica cardinality, abstract class instantiation, type compatibility, e registra NodeProblem aggregati. Scope futuro.

---

## 6. Hard stop

**Confermo**: nessun file di codice sorgente è stato modificato in questa Phase A. Solo i due file documentazione previsti (`docs/discovery/2026-05-14_microdiscovery_xmi_m1_importer.md` — questo report — e `docs/claude-code-log.md` — entry aggiunta).

`git status` post-Phase-A è atteso identico a quello pre-Phase-A salvo per i due deliverables docs.
