# Micro-discovery Bug E + Bug F — TreeView duplicate / Dashboard empty

**Data**: 2026-05-13
**Tipo**: read-only diagnostic (Fase A combinata)
**Esito**: ⚠️ **Diagnosi del prompt errata su entrambi i bug.** Né Bug E né Bug F sono regressioni del refactor B.1. Bug E ha root cause in `tempfix_untilopennewtabisdone` (data.ts:212-217) — bug pre-esistente al refactor 2026-05-08 del TreeView, che ha esposto m2models direttamente come selector. Bug F ha root cause nell'import handler che non collega il `DModel` importato a `currentProject.metamodels`. I due bug sono **indipendenti** ma vengono entrambi diagnosticati in questa Fase A.

---

## 1. Baseline pre-B.1 — flusso DModel/DPackage

**Commit di riferimento**: `06f766e2e` (HEAD, branch `alfonso-frontend-jjtl`).
**File baseline**: `/tmp/data_pre_b1.ts` (1222 righe, estratto via `git show HEAD:frontend/src/api/data.ts`).
**File working tree**: `frontend/src/api/data.ts` (1330 righe, dirty con B.1 + fix Bug C).

### Funzioni pre-B.1 di interesse

| Funzione | File:riga |
|---|---|
| `parse()` (entry point) | `/tmp/data_pre_b1.ts:164-189` |
| `tempfix_untilopennewtabisdone` | `/tmp/data_pre_b1.ts:187-192` |
| `parseM2Model` monolitico | `/tmp/data_pre_b1.ts:368-384` |
| `parseRootPackage` monolitico | `/tmp/data_pre_b1.ts:614-648` |

### Push su parent in parseRootPackage pre-B.1

```typescript
// /tmp/data_pre_b1.ts:619-621
let dObject: DPackage = DPackage.new();
generated.push(dObject); dObject.father = parent.id;
if (parent) parent.packages.push(dObject.id);
```

**Un solo push** su `parent.packages` per chiamata.

### Push pre-B.1 in parseM2Model

```typescript
// /tmp/data_pre_b1.ts:368-384 (semplificato)
static parseM2Model(json, filename): DModelElement[] {
    let dObject: DModel = DModel.new( modelname || "imported_metamodel_1", ... );  // <-- (a)
    generated.push(dObject);
    EcoreParser.parseRootPackage(dObject, json, generated);  // <-- chiama parseRootPackage che pusha su parent.packages
    return generated;
}
```

`DModel.new()` (a) tramite il mixin `DModel()` di `classes.ts:918-939` pusha l'id del DModel in `state.m2models` via `_persistCallbacks` (riga 937):
```typescript
thiss._persistCallbacks.push(SetRootFieldAction.create(isMetamodel ? "m2models" : "m1models", thiss.id, "+=", true));
```

### Push pre-B.1 in tempfix_untilopennewtabisdone

```typescript
// /tmp/data_pre_b1.ts:187-192
private static tempfix_untilopennewtabisdone(parsedElements, isMetamodel) {
    let model: DModel = null as any;
    for (let elem of parsedElements) { if (elem.className === DModel.cname) { model = elem as any; break; } }
    SetRootFieldAction.new(isMetamodel ? "m2models" : "m1models", model.id, '+=', false);  // <-- (b)
}
```

**Secondo push** del medesimo `model.id` in `state.m2models` con accessModifier `+=` → append senza dedup.

**Conclusione pre-B.1**: ogni `parse()` chiamato per un metamodello dispatcha **2 push** su `state.m2models`: una dal Constructor del DModel (via `_persistCallbacks`), una dal `tempfix`. Il bug è pre-esistente al refactor B.1.

---

## 2. Stato post-B.1 — flusso DModel/DPackage

### Funzioni post-B.1 di interesse

| Funzione | File:riga |
|---|---|
| `parse()` | `frontend/src/api/data.ts:164-189` (invariato) |
| `tempfix_untilopennewtabisdone` | `frontend/src/api/data.ts:212-217` (invariato) |
| `parseM2Model` (con branch multi-package) | `frontend/src/api/data.ts:393-449` |
| `parseRootPackage` (thin wrapper) | `frontend/src/api/data.ts:653-660` |
| `parsePackageBody` (body estratto da parseRootPackage) | `frontend/src/api/data.ts:662-692` |
| `parseSubPackage` | `frontend/src/api/data.ts:694-721` |

### Diff push pre-B.1 vs post-B.1

```bash
$ diff <(sed -n '187,192p' /tmp/data_pre_b1.ts) <(sed -n '212,217p' frontend/src/api/data.ts)
# Nessuna differenza — tempfix è byte-per-byte identico.
```

`parsePackageBody` (data.ts:667-669) post-B.1:
```typescript
let dObject: DPackage = DPackage.new();
generated.push(dObject); dObject.father = parent.id;
if (parent) parent.packages.push(dObject.id);
```

**Identico** a pre-B.1 `parseRootPackage`. Un solo push per chiamata su `parent.packages`.

In `parseM2Model` post-B.1 (riga 393-449), il ramo multi-package itera `epkgChildren` (riga 435-438) chiamando `parsePackageBody` una volta per ogni EPackage non-primitive. Per **Persons.ecore** (1 normal package + 1 primitive types package opzionale che viene saltato), `parsePackageBody` viene invocato **una sola volta**. Per **Families.ecore** (2 normal packages), 2 invocazioni distinte, ciascuna crea un nuovo DPackage.

**Nessun doppio push su `parent.packages` o `parent.subpackages` dal refactor B.1.** L'ipotesi del prompt che B.1 abbia introdotto un push doppio su collection del DModel è **falsa**.

### Conferma dalla console raw

Dal log Persons.ecore single-click post-fix-C:
```
parse.result D (6) [DModel2, DPackage2, DClass2, DAttribute2, DClass2, DClass2]
```

6 elementi creati: 1 DModel + 1 DPackage + 1 DAttribute + 3 DClass. **Un solo DPackage**. Quindi `parent.packages` contiene **1 entry**. La duplicazione che il TreeView vede non è in `parent.packages` (DModel.packages).

---

## 3. Struttura del DModel — collection arrays disponibili

`frontend/src/model/logicWrapper/LModelElement.tsx:4622-4668`:

```typescript
export class DModel extends DNamedElement {
    id!: Pointer<DModel, 1, 1, LModel>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];        // ereditato da DModelElement (vuoto per DModel root)
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];       // ereditato

    packages: Pointer<DPackage, 0, 'N', LPackage> = [];                // <-- ARRAY 1: root packages
    isMetamodel: boolean = true;
    objects: Pointer<DObject, 0, 'N', LObject> = [];                   // <-- ARRAY 2: DObject instances (M1)
    models: Pointer<DModel, 0, 'N', LModel> = [];                      // <-- ARRAY 3: M1 models conformi (in M2)
    instanceof?: Pointer<DModel>;
    instances!: Pointer<DModelElement>[];                              // <-- ARRAY 4
    dependencies!: Pointer<DModel>[];                                  // <-- ARRAY 5
}
```

`DModel.packages` è la **sola** collection che il parser popola in `parseM2Model`. Le altre (`models`, `objects`, `instances`, `dependencies`) restano vuote per un metamodello appena importato.

### Collection a livello state (root fields)

| State root field | Tipo | Scrittura |
|---|---|---|
| `state.m2models` | `Pointer<DModel>[]` | DModel mixin `_persistCallbacks` (classes.ts:937) + tempfix (data.ts:216) |
| `state.m1models` | `Pointer<DModel>[]` | DModel mixin `_persistCallbacks` (classes.ts:937) + tempfix (data.ts:216) |
| `state.idlookup[<DModelId>]` | `DModel` data | Constructor `CreateElementAction` |

### Collection a livello DProject (per-progetto)

`frontend/src/joiner/classes.ts` (DProject):

```typescript
// (estratto delle properties rilevanti)
metamodels: Pointer<DModel>[];      // <-- per-project metamodel list
models: Pointer<DModel>[];          // <-- per-project model list
metamodelsNumber: number = 0;       // <-- counter stored, sincronizzato a save()
modelsNumber: number = 0;
```

Setter `set_metamodelsNumber` (classes.ts:3183) e `set_metamodels` (classes.ts:3279) sono dispatched via `SetFieldAction`.

`metamodelsNumber` viene calcolato e sincronizzato **solo in `ProjectsApi.save()`** (projects.ts:98): `dProject.metamodelsNumber = project.metamodels.length;`. Non è derivato runtime: è uno stored value.

---

## 4. Componenti consumer

### 4.1 TreeView (`TreeViewSidebar/TreeViewContent.tsx`)

**Selector** (riga 1640-1641):
```typescript
const metamodelPointers = state.m2models || [];
const metamodels: LModel[] = (LPointerTargetable.fromPointer(metamodelPointers) || []).filter(Boolean);
```

**Source**: `state.m2models` (root-level array). Resolve via `LPointerTargetable.fromPointer` → array di LModel.

**Iterazione** (riga 1399-1413):
```typescript
{metamodels.map(mm => (
    <MetamodelNode
        key={mm.id}
        mm={mm}
        ...
    />
))}
```

`mm.id` come key. Filtri: `.filter(Boolean)` (riga 1641) elimina LModel `null`/`undefined` ma **non deduplica per id**.

Per ogni metamodello, internamente (riga 1704-1732):
```typescript
ret.metamodels = metamodels.map((mm) => {
    const rootPackages: TreePackageData[] = [];
    const pkgs = (mm as any).packages || [];
    for (const pkg of pkgs) {
        if (!pkg) continue;
        rootPackages.push(buildPackageData(pkg, mmName));
    }
    ...
});
```

`mm.packages` viene letto via proxy LModel → `DModel.packages`. Per Persons.ecore: 1 entry → 1 PackageNode reso → no warning a livello pkg.

**Componente note**: il warning React menziona `SectionNode2` ma il file espone solo `SectionNode` (definito a riga 276). Il "2" è artefatto di React DevTools quando lo stesso `memo`'d component viene reso da più punti — il sito reale dell'iterazione duplicata è `MetamodelNode` a riga 1399 (MetamodelNode internamente apre un SectionNode "Models" a riga 792).

### 4.2 Navbar Submenu (`pages/components/Navbar.tsx`)

**Selector** (riga 1979):
```typescript
ret.metamodels = state.m2models;
```

**Source**: `state.m2models` (stesso di TreeView). Pointer non resolved (passati come array di Pointer).

**Iterazione (a) — top menu "New Document" submenu** (riga 1259-1261):
```typescript
subItems: metamodels.map((m2, i)=>({
    name: mmNamesArray[i],
    function: () => createM1(project, m2),
    id: 'mmid_'+ props.metamodels[i],   // <-- key composta da pointer
}))
```

Questi items finiscono in `<Submenu>` (riga 452) e passano per `makeEntry` (riga 355-411). Riga 384:
```typescript
return (
    <li className={...} key={i.id||i.name} tabIndex={0} ...>
```

Key = `'mmid_' + <pointer>`. Se `state.m2models` ha lo stesso pointer 2 volte, due items con `id` identico → warning duplicate keys.

**Iterazione (b) — "New Document → Model" submenu del NewDocumentButton** (riga 133, 312):
```typescript
const sortedMetamodels = useMemo(
    () => (isModelSubmenu ? [...metamodels].sort((a, b) => a.name.localeCompare(b.name)) : []),
    [metamodels, isModelSubmenu]
);
...
{sortedMetamodels.map(mm => (
    <button key={mm.id} ...>
```

Stesso problema: sort preserva duplicati → `mm.id` duplicato → warning.

**Iterazione (c) — Tools / Metamodel Tools** (riga 1469-1473):
```typescript
subItems: metamodels.map((m2, i) => ({
    name: mmNamesArray[i] || 'Unnamed',
    icon: <i className="bi bi-diagram-3" />,
    disabled: true
}))
```

Non specifica `id`, quindi makeEntry usa `key={i.id||i.name}` → key = `name`. Per Persons.ecore importato 2 volte (duplicate in state), entrambi gli items hanno `name='Persons'` (oppure `mmNamesArray[0]`==`mmNamesArray[1]`==`'Persons'`) → key collisione.

### 4.3 Project Dashboard (`pages/AllProjects.tsx`)

**Selector** (riga 185-189):
```typescript
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.projects = LProject.fromArr(state.projects);
    ret.version = state.version;
    return ret;
}
```

**Source**: `state.projects` (root-level array di Pointer<DProject>). Resolve in LProject[].

**Iterazione metamodel count**: avviene **dentro il componente Project** (`pages/components/Project.tsx:371`):
```typescript
{data.metamodelsNumber} {data.metamodelsNumber === 1 ? 'metamodel' : 'metamodels'}
```

`data` è una `LProject` (passata come prop a `<Project data={p} ...>`). `data.metamodelsNumber` legge `c.data.metamodelsNumber` dal DProject in idlookup. **Non legge `state.m2models`**.

Quindi la Dashboard:
- **Non ha rapporto diretto con `state.m2models`** (la collection duplicata).
- Mostra `project.metamodels.length` (snapshot del campo stored su DProject).
- Update avviene solo via `set_metamodels` o `set_metamodelsNumber` — entrambi triggered esclusivamente da `ProjectsApi.save()` (projects.ts:98) o da `createM2` (Navbar.tsx:75).

---

## 5. Tabelle di mapping

### 5.1 Componente → collection iterata

| Componente | File:riga | Selector / source | Collection iterata | Key prop | Filtri |
|---|---|---|---|---|---|
| TreeView MetamodelNode (metamodels list) | TreeViewContent.tsx:1399 | `state.m2models` → `LPointerTargetable.fromPointer` | `metamodels: LModel[]` | `mm.id` | `.filter(Boolean)` (no dedup) |
| TreeView PackageNode (rootPackages) | TreeViewContent.tsx:778 | `mm.packages` (DModel.packages proxy) | `mm.rootPackages: TreePackageData[]` | `pkg.id` | nessuno |
| Navbar Submenu items — New Doc / Models | Navbar.tsx:1259 → makeEntry:384 | `state.m2models` (raw pointers) | `metamodels.map((m2,i) => ({...}))` | `'mmid_'+pointer` (i.id) | nessuno |
| Navbar NewDocumentButton submenu | Navbar.tsx:312 | `props.metamodels → L.fromArr → sort` | `sortedMetamodels` | `mm.id` | nessuno |
| Navbar Tools / Metamodel Tools | Navbar.tsx:1469 → makeEntry:384 | `state.m2models` | `metamodels.map(...)` | `i.id\|\|i.name` (name) | nessuno |
| Dashboard Project component | AllProjects.tsx:156 → Catalog → Project | `state.projects` → `LProject.fromArr` | `projects` (LProject[]) | `p.id\|\|i` | filtri tag/search runtime |
| Project.tsx metamodel count | components/Project.tsx:371 | `data.metamodelsNumber` (LProject getter) | scalare (numero) | n/a | n/a |

### 5.2 Collection → popolata da / consumata da

| Collection | Popolata da | Quante volte per Persons.ecore | Consumata da |
|---|---|---|---|
| `state.m2models` | (1) DModel mixin `_persistCallbacks` riga 937 classes.ts<br>(2) `tempfix_untilopennewtabisdone` riga 216 data.ts | **2** (push doppio dello stesso pointer) | TreeView (1640), Navbar (1979), Selectors.getAllMetamodels (selectors.ts:232), Console (1071), LModelElement (1319) |
| `state.m1models` | analogo per M1 | n/a per Persons.ecore (importato come M2) | Navbar, TreeView (m1Models @ 1645), Console |
| `dModel.packages` | `parsePackageBody:669` (post-B.1) / `parseRootPackage:621` (pre-B.1) | **1** push per ogni `parsePackageBody` call → 1 totale per Persons.ecore | TreeView buildPackageData:1707-1713 |
| `dModel.subpackages` | `parseSubPackage:700` | **0** (Persons.ecore non ha subpackages) | buildPackageData via `lPkg.subpackages` (1570) |
| `dPackage.classes` | mixin DClass via setExternalPtr (classes.ts) | 3 (Person+2 classi attese) | buildPackageData (1578) |
| `state.projects[*].metamodels` (DProject.metamodels) | `createM2` Navbar.tsx:75 OR mai dall'import flow | **0 dal flusso Ecore import** | Dashboard via `metamodelsNumber` (Project.tsx:371) e `project.metamodels.length` (Dashboard.tsx:380-385, ProjectEditor.tsx:153, StatusBar.tsx:83, ecc.) |
| `state.projects[*].metamodelsNumber` | `ProjectsApi.save:98` (`dProject.metamodelsNumber = project.metamodels.length`) | Persiste 0 fino al prossimo save | Project.tsx:371 |

---

## 6. Diagnosi

### 6.1 Bug E (TreeView 2× M Persons, Navbar 2× M Persons)

**Root cause**: doppio push del medesimo `DModel.id` in `state.m2models`.

**Sequenza meccanica**:
1. `parse()` (data.ts:172) setta `Constructors.paused = true`.
2. `parseM2Model` (data.ts:400) chiama `DModel.new(...)`. Il Constructor della classe `Constructors` (classes.ts:567-585) crea il DModel e accumula in `_persistCallbacks` un `SetRootFieldAction.create("m2models", thiss.id, "+=", true)` (classes.ts:937 nel mixin `DModel()`).
3. Il Constructor's `end()` (classes.ts:678-682) chiama `Constructors.persist(this.thiss)` → `Constructors.persist()` (classes.ts:641-668) controlla `if (Constructors.paused) return;` (riga 642) e **non fa nulla** perché siamo ancora in `paused = true`.
4. `parse()` esegue parsing dei children, poi setta `Constructors.paused = false` (data.ts:177).
5. `parse()` chiama `Constructors.persist(parsedElements)` (data.ts:181). Questa volta non è paused → itera ogni elemento, fa scattare i `_persistCallbacks`. Per il DModel: **push #1** in `state.m2models`.
6. `parse()` chiama `tempfix_untilopennewtabisdone(parsedElements, isMetamodel)` (data.ts:185). Questa funzione (data.ts:212-217) cerca il primo elemento di tipo DModel e chiama `SetRootFieldAction.new("m2models", model.id, '+=', false)` → **push #2** dello stesso id.

Risultato: `state.m2models = [persons_id, persons_id]`. Tutti i consumer (TreeView 1640, Navbar 1979) leggono questa array e vedono 2 entry con lo stesso pointer. Il `.map(mm => <X key={mm.id}>)` produce 2 children con key identica → React warning.

**Perché il refactor B.1 NON è responsabile**: la funzione `tempfix_untilopennewtabisdone` esiste byte-per-byte identica in pre-B.1 (`/tmp/data_pre_b1.ts:187-192`). Il push doppio era presente anche pre-B.1.

**Perché il bug non era visibile pre-B.1**:
- L'attuale `TreeViewContent.tsx` ha commento riga 32: "redesign 2026-05-08". Il selector `state.m2models` come source list è del 2026-05-08. Prima il TreeView probabilmente leggeva `project.metamodels` (la per-project list che non è duplicata), quindi il duplicate era invisibile.
- L'attuale Navbar ha commento riga 1976-1978 sul performance optimization che indica revisione recente del selector.
- Per **Families.ecore**: pre-B.1 il parser falliva al validator ecore-version su root `<xmi:XMI>` (vedi discovery Bug D). Quindi `parseM2Model` non arrivava mai a creare il DModel → no push duplicato visibile per multi-package files. Post-B.1 il validator è hoisted al wrapper level e i multi-package files passano → finalmente si manifesta il bug E anche per Families.

**Conferma empirica dal log**:
```
Warning: Encountered two children with the same key, `Pointer1778699020500_USER_185`. Keys should be unique...
  at SectionNode2 (TreeViewContent.tsx:152)
Warning: Encountered two children with the same key, `Pointer1778699020500_USER_185`. Keys should be unique...
  at Submenu (Navbar.tsx:551)
```

Lo stesso ID `Pointer..._185` appare 2 volte in entrambe le iterazioni — perfetto match con duplicate-push in m2models.

### 6.2 Bug F (Dashboard mostra 0 metamodelli post-import)

**Root cause**: il flusso di import Ecore (`EcoreParser.parse()` → `SaveManager.importEcore` → `EcoreService.importFromXML`) **non aggiorna `project.metamodels`** del progetto corrente.

**Sequenza meccanica**:
1. L'utente in ProjectEditor clicca "Import Ecore" → `handleImportEcore` (ProjectEditor.tsx:759) → `importEcoreRef.current?.click()`.
2. File selezionato → `handleEcoreFileChange` (ProjectEditor.tsx:764) → `EcoreService.importFromFile(file)` → `importFromXML(xmlString, filename)` (EcoreService.ts:373).
3. `importFromXML` chiama `EcoreParser.parse(json, true, filename, true)` (riga 398). Il parser:
   - Crea il DModel → pusha in `state.m2models` (2× per il bug E).
   - Crea DPackage, DClass, DAttribute, etc.
   - NON tocca `project.metamodels`.
4. `importFromXML` ritorna `{ success: true, model: lmodel, ... }`. L'handler mostra l'alert "Imported" ma **non collega** il nuovo metamodello al progetto.

Confrontare con `createM2` (Navbar.tsx:69-91) — il flusso interattivo "New Metamodel":
```typescript
export function createM2(project: LProject, name0?: string) {
    const dModel = DModel.new(name, undefined, true);          // crea DModel → push m2models
    const lModel: LModel = LModel.fromD(dModel);
    project.metamodels = [...project.metamodels, lModel];      // <-- collega al progetto
    project.graphs = [...project.graphs, lModel.node as LGraph];
    const dPackage = lModel.addChild('package');
    ...
}
```

`createM2` esegue `project.metamodels = [...project.metamodels, lModel]` (riga 75). L'import flow non lo fa.

**Conseguenza visibile**:
- `project.metamodels` resta vuoto post-import → `project.metamodels.length === 0`.
- Al prossimo save, `ProjectsApi.save` (projects.ts:98) imposta `dProject.metamodelsNumber = 0` (perché `project.metamodels.length === 0`).
- La Dashboard `<Project>` component (Project.tsx:371, 526, 567) legge `data.metamodelsNumber` → mostra 0.
- Inoltre, `ProjectEditor.tsx:153` (`project.metamodels || []`) — la lista interna del ProjectEditor è anch'essa vuota, quindi anche **dentro** il progetto editor l'utente non vede il metamodello importato (eccetto via la sidebar che legge da `state.m2models`, che è duplicato).

**Perché il refactor B.1 NON è responsabile**: l'import flow (data.ts:164-189, EcoreService.ts:373-417) è invariato tra pre e post B.1. Il missing link a `project.metamodels` è pre-esistente. Pre-B.1 single-package Persons.ecore avrebbe avuto lo stesso problema, ma probabilmente non testato sistematicamente o non notato perché la TreeView leggeva da una source diversa.

**Non aggiorna**: la Dashboard mostra 0 in modo *corretto* rispetto al suo selector (`project.metamodels.length` = 0). Non c'è bug di re-render: c'è bug di data flow. L'osservazione "non aggiorna" significa che — anche dopo save + reload del progetto — il count resta 0, perché lo stato persistito non contiene il link metamodel→project.

### 6.3 Relazione E ↔ F

**Indipendenti** ma entrambi pre-esistenti al refactor B.1:

- Bug E: pre-existing duplicate push (tempfix) + selector redesign 2026-05-08 (TreeView ora legge `state.m2models`).
- Bug F: pre-existing missing project link nell'import flow.

I due bug si rilevano insieme nello stesso test (import di Persons.ecore in un progetto) ma vivono su **collection diverse**:
- Bug E: `state.m2models` (global root-level).
- Bug F: `state.projects[*].metamodels` (per-project).

I fix sono indipendenti e applicabili in parallelo senza conflitti.

---

## 7. Strategie di fix (NON applicate)

### 7.1 Fix Bug E — rimozione push doppio in tempfix

**File**: `frontend/src/api/data.ts`, funzione `tempfix_untilopennewtabisdone` (righe 212-217).

**Strategia A (raccomandata)**: rimuovere il push redundant in tempfix. Il push del DModel constructor (classes.ts:937) è sufficiente.

**Diff proposto**:

```diff
@@ -212,7 +212,11 @@
     private static tempfix_untilopennewtabisdone(parsedElements: DModelElement[], isMetamodel: boolean) {
         // replaces current model with parsed model. this needs to be removed to open a new tab later on.
         let model: DModel = null as any;
         for (let elem of parsedElements) { if (elem.className === DModel.cname) { model = elem as any; break; } }
-        SetRootFieldAction.new(isMetamodel ? "m2models" : "m1models", model.id, '+=', false); // it is pointer but no need to update pointedby's this time
+        // RIMOSSO 2026-05-13: questo push duplica state.m2models perché il Constructor di DModel
+        // (classes.ts:937) ha già dispatchato la medesima azione durante Constructors.persist().
+        // Il push qui causava il warning React "duplicate key" in TreeView+Navbar (Bug E).
+        // Manteniamo l'iterazione per trovare il primo DModel ma senza il push.
+        // SetRootFieldAction.new(isMetamodel ? "m2models" : "m1models", model.id, '+=', false);
+        void model; // non più usato in questo branch, ma il nome del file suggerisce future use con tabs
     }
```

**Razionale**:
1. Il Constructor `DModel()` (classes.ts:937) dispatcha già `SetRootFieldAction.create("m2models", thiss.id, "+=", true)` come parte di `_persistCallbacks`, che fire durante `Constructors.persist(parsedElements)` (data.ts:181, dopo `Constructors.paused = false`). Quindi il push #1 è garantito.
2. Il push #2 in tempfix è quindi sempre **redundant** quando il DModel viene da `parseM2Model` o `parseM1Model` (l'unico path per arrivare a tempfix è via `parse()` chiamato con un DModel appena costruito).
3. Il commento del nome (`tempfix_untilopennewtabisdone`) e il commento inline ("replaces current model with parsed model. this needs to be removed to open a new tab later on") suggeriscono che la funzione era nata come hack temporaneo per garantire che `state.m2models`/`state.m1models` fosse aggiornato in scenari dove i `_persistCallbacks` non avrebbero firato. Con il flusso `Constructors.paused = true/false` + `Constructors.persist()` corrente, il push del Constructor è affidabile e tempfix è obsoleto.
4. Rimuovere l'intera funzione (Strategia B alternativa) sarebbe più pulito ma richiede di rimuovere anche il call site (data.ts:185) e fare grep di altri caller. Per minimal-change, commentare la sola riga di push è sufficiente.

**Strategia B (più aggressiva)**: rimuovere completamente la chiamata a `tempfix_untilopennewtabisdone` (data.ts:185) e la funzione stessa. Risk: maggiore, va testato su scenari "open new tab" sottintesi nel nome della funzione.

**Effetti collaterali attesi (Strategia A)**:
- Dopo il fix, `state.m2models` contiene il pointer del nuovo DModel **una sola volta**.
- TreeView e Navbar non emettono più il warning React.
- Dashboard non è influenzata (legge da `project.metamodels`, non `state.m2models`).
- Console (Console.tsx:855, 1071) ora vede 1 metamodello invece di 2 → comportamento atteso.
- `Selectors.getAllMetamodels()` (selectors.ts:232-236) ritorna 1 entry invece di 2 → comportamento atteso.
- Possibile cascata di test che assumevano duplicati? Improbabile: il bug è silently broken, non testato deliberatamente.

**Costi / rischi**:
- Il commento "this needs to be removed to open a new tab later on" è enigmatic. Potrebbe esistere uno scenario edge (es. tab-open senza progetto attivo) dove il Constructor non viene mai chiamato. Da verificare con regression test importando in dashboard mode (route `/allProjects` con drag-drop, `ProjectsApi.importFromText` projects.ts:133) — quel flusso forse non passa per il flusso "ProjectEditor → EcoreService".
- Se Strategia A si rivela insufficiente in qualche edge case, fallback: applicare dedup nel reducer per `SetRootFieldAction` con `+=` su path `m2models`/`m1models`. Più intrusivo, non raccomandato come primo passo.

### 7.2 Fix Bug F — link metamodel a project nell'import flow

**File**: `frontend/src/components/project/ProjectEditor.tsx`, handler `handleEcoreFileChange` (righe 764-792).

**Strategia (raccomandata)**: dopo che `EcoreService.importFromFile` ritorna con successo, eseguire il pattern `createM2` di `project.metamodels = [...project.metamodels, lmodel]`.

**Diff proposto**:

```diff
@@ -764,17 +764,28 @@
     const handleEcoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
         if (!file) return;

         try {
             const result = await EcoreService.importFromFile(file);

             if (result.success && result.model) {
-                U.alert('i', 'Imported', `Metamodel "${result.model.name}" imported from Ecore`);
-                markDirty();
+                // Link the imported metamodel to the current project (Bug F fix 2026-05-13):
+                // EcoreParser.parse() pushes the DModel to state.m2models but does NOT update
+                // project.metamodels. Without this, the Dashboard shows metamodelsNumber=0
+                // because metamodelsNumber is computed from project.metamodels.length at save time.
+                // Pattern mirrors createM2() in Navbar.tsx:69-91.
+                try {
+                    project.metamodels = [...project.metamodels, result.model];
+                    if (result.model.node) {
+                        project.graphs = [...project.graphs, result.model.node as any];
+                    }
+                } catch (linkErr) {
+                    console.warn('Failed to link imported metamodel to project:', linkErr);
+                }
+                U.alert('i', 'Imported', `Metamodel "${result.model.name}" imported from Ecore`);
+                markDirty();

                 // Show warnings if any
                 if (result.warnings.length > 0) {
                     console.warn('Ecore import warnings:', result.warnings);
                 }
             } else {
                 throw new Error(result.errors.join(', '));
             }
```

**Razionale**:
1. `EcoreService.importFromFile` ritorna `{ success, model: LModel }`. Il `model` è l'LModel wrapper dell'imported DModel.
2. `project` è `LProject` (prop del componente ProjectEditor, riga 127). Il setter `project.metamodels` (classes.ts:3279) dispatcha `SetFieldAction.new(dProject.id, 'metamodels', val, '', true)` — la convenzione standard per Pointer-array writes.
3. `project.graphs = [...project.graphs, ...]` è il pattern di `createM2:76` (e `createM1:100`) — assicura che il graph del nuovo metamodello sia incluso nella lista del progetto. Necessario perché DockManager e altre features cercano i graph via `project.graphs`.
4. `markDirty()` (già chiamato) segna il progetto modificato, così il prossimo save persiste i nuovi link.
5. Try/catch difensivo: se il link fallisce, log a console e prosegui con l'alert "Imported" (il metamodel comunque esiste in `state.m2models`, il progetto è semplicemente non aggiornato).

**Effetti collaterali attesi**:
- Dopo il fix, `project.metamodels.length` aumenta di 1 post-import.
- Al successivo save, `metamodelsNumber` viene aggiornato (projects.ts:98).
- Dashboard (Project.tsx:371) mostra il count corretto.
- ProjectEditor's `metamodels` array interno (riga 153) include l'imported model → la lista in-page si aggiorna.
- StatusBar.tsx:83 (`project.metamodels.length`), ProjectEditor.tsx:1042/1049 (transformation source/target lookup), edgeCandidate.ts:57 (`project.metamodels ?? []`) — tutti questi consumer ora vedono il metamodello importato.

**Costi / rischi**:
- **Importazione da Dashboard mode (drag-drop)**: questo handler è in ProjectEditor, non in AllProjects. Il flusso `ProjectsApi.importFromText` (projects.ts:133) viene invocato da AllProjects.tsx:88 (dropConfirm). Quel flusso forse non ha un `project` contesto disponibile (l'utente è in Dashboard, non in un progetto). Da verificare se il fix deve duplicare anche lì o se quel flusso usa già un meccanismo diverso (es. crea un nuovo project, importa, salva).
- **`result.model.node`**: per un metamodello appena importato, `lModel.node` potrebbe essere `null` (nessun graph creato durante parse). Il pattern `createM2` chiama `lModel.addChild('package')` che probabilmente trigger la creazione di node/graph implicitamente. Per Ecore import non c'è equivalente; quindi `project.graphs = [...project.graphs, undefined]` rischia di pushare `undefined`. Il try/catch + null-check `if (result.model.node)` mitiga.
- **Doppio link in caso di import multipli accidentali**: se l'utente importa lo stesso Ecore 2 volte, otterrà 2 entry in `project.metamodels` con id diversi (perché ogni `DModel.new()` genera id fresco). Comportamento atteso, non bug.
- **Concorrenza con altri caller**: cercare altri caller di `EcoreService.importFromXML` o `EcoreParser.parse(..., true, ...)` per assicurarsi che non sia chiamato altrove silenziosamente. Caller noti:
  - `SaveManager.importEcore_click0:99` → `SaveManager.importEcore:156` → `EcoreParser.parse`. Questo è invocato da topbar/menu (oltre che dal ProjectEditor wire). Anche questo caller dovrebbe applicare il link. Soluzione alternativa: spostare il link DENTRO `EcoreParser.parse()` (data.ts:181) o dentro `EcoreService.importFromXML`, ma serve accesso al `LProject` corrente che parser/service non hanno.
  - `XMIService.ts:351` → `EcoreService.importFromXML` — flusso XMI usa parser Ecore internamente. Stesso requisito.

Per coerenza completa, considera Strategia 2 (più centralizzata): aggiungere il link in `EcoreService.importFromXML` opzionalmente parametrizzando con `linkToProject?: LProject`. Più invasivo ma elimina la duplicazione dei call site.

### 7.3 Conflitti potenziali

Nessuno meccanico: i due fix operano su collection separate (`state.m2models` vs `state.projects[*].metamodels`) e non condividono righe modificate.

Possibili interferenze osservative durante test:
- Se il fix Bug E rimuove il push #2 ma il fix Bug F popola `project.metamodels`, il TreeView ora mostra 1 voce di "M Persons" (corretta) e la Dashboard mostra 1 (corretta). Coerente.
- Se solo il fix Bug E è applicato senza Bug F: TreeView corretto (1 voce), Dashboard ancora 0. UX incoerente: il TreeView mostra il metamodello, la Dashboard no.
- Se solo il fix Bug F è applicato senza Bug E: Dashboard corretta (1 voce), TreeView ancora 2x. UX incoerente: la Dashboard mostra 1, il TreeView 2.

**Raccomandazione**: applicare entrambi i fix nello stesso commit per evitare stati intermedi incoerenti. I due diff sono piccoli, testabili separatamente con `git diff`.

---

## 8. Open questions

1. **Importazione da dashboard (drag-drop su AllProjects)**: `AllProjects.tsx:88` invoca `ProjectsApi.importFromText`. Quel path importa un `.Jjodel` project zip, non un file ecore singolo. Verificare se anche `.jjodel` import passa per parser Ecore o ha un suo flusso separato. Se l'utente potesse droppare un `.ecore` direttamente in dashboard mode (no project loaded), il fix Bug F del §7.2 non si applicherebbe lì. Da chiedere all'utente o esaminare `ProjectsApi.importFromText` con file = `.ecore`.

2. **`SaveManager.importEcore_click0`**: il caller invocato dal menu File→Import Ecore (topbar). Anche questo flusso deve applicare il link a `project.metamodels`. Non incluso nel diff del §7.2 — serve un secondo edit point o una refactor centralizzata. Decisione: applicare il fix in entrambi i call site (più semplice) o spostare la responsabilità a un helper `linkImportedMetamodelToCurrentProject(lModel)` riusabile?

3. **`tempfix_untilopennewtabisdone` — perché esiste?** Il commento "this needs to be removed to open a new tab later on" suggerisce che la funzione era un workaround per uno scenario di "open new tab" mai implementato. Con il framework attuale (Constructors + persist) il push del Constructor è affidabile. Possibile rimuovere completamente la funzione (Strategia B di §7.1). Da chiedere a chi ha scritto il commento (git blame: dobbiamo verificare).

4. **Multipli `parse()` consecutivi**: se l'utente importa N file Ecore in rapida successione, ogni `parse()` produce 2 push (post-fix: 1 push). Con il fix Bug E, `state.m2models` ha esattamente N entry. Senza il fix, 2N. Caso edge da testare per regression: import sequenziale di 5+ Ecore files.

5. **`ProjectsApi.save` rebuild dell'array**: `dProject.metamodelsNumber = project.metamodels.length` (projects.ts:98) sincronizza il counter al save. Ma se `project.metamodels` ha pointer **stale** (riferiscono a DModel cancellati), il count è gonfiato. Non scope di questa discovery — flag per audit futuro.

6. **`state.m2models` vs `project.metamodels` — duplicazione architetturale**: l'esistenza di 2 collection separate per la stessa entità (metamodelli) è la radice di entrambi i bug. Long-term: considerare unification (es. derivare `state.m2models` da `Σ project.metamodels` o viceversa). Out-of-scope per questa Fase A.

7. **React DevTools "SectionNode2"**: il warning cita `SectionNode2` ma il file definisce solo `SectionNode`. Possibile che React DevTools aggiunga suffisso numerico a memo'd components reso da più posti. Non blocca il fix, ma sarebbe utile sapere il sito esatto per future-investigations.

---

## 9. Verifica end-to-end attesa (dopo applicazione fix)

| Scenario | Prima del fix | Dopo fix Bug E | Dopo fix Bug E+F |
|---|---|---|---|
| Import Persons.ecore in progetto | TreeView 2× M Persons, Dashboard 0 metamodels | TreeView 1× M Persons, Dashboard 0 metamodels | TreeView 1× M Persons, Dashboard 1 metamodel |
| Import Families.ecore in progetto | TreeView 2× M Families, Dashboard 0 metamodels | TreeView 1× M Families, Dashboard 0 metamodels | TreeView 1× M Families, Dashboard 1 metamodel |
| Import Persons + Families | TreeView 2× Persons + 2× Families, Dashboard 0 | TreeView 1× Persons + 1× Families, Dashboard 0 | TreeView 1× Persons + 1× Families, Dashboard 2 metamodels |
| `createM2` from Navbar (interactive) | TreeView 1×, Dashboard 1 (già funziona) | invariato | invariato |
| Re-load progetto (state.projects da disco) | dipende da save precedente | dipende da save precedente | dipende da save precedente |

**Test minimi raccomandati per validare i fix**:
1. Import Persons.ecore → TreeView 1×, Dashboard 1.
2. Import Families.ecore → TreeView 1×, Dashboard 2 (cumulativo).
3. `createM2` interattivo → TreeView 1×, Dashboard +1.
4. Save → reload → counts persistiti correttamente.
5. Check React console: zero `duplicate key` warnings post-fix.
