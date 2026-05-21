# Discovery — Bug post-Fase B Import Summary Modal

**Data**: 2026-05-19
**Branch**: `alfonso-frontend-jjtl`
**Scope**: read-only diagnostic. Bug 1 (conteggi a 0 nel modale) + Bug 2 (Dashboard mostra 0 metamodelli). Nessuna modifica al codice.
**Hard stop**: a fine documento. Fase fix parte solo dopo OK in chat.

---

## Step 1 — Stato attuale handler in `ProjectEditor.tsx`

### 1.1 — `handleEcoreFileChange`

**Range righe**: 795-857 (post-Fase B).

**Codice integrale**:

```ts
const handleEcoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Warning capture: snapshot Log.messageMapping['w'] length before import, then take the
    // delta after import. The parser uses Log.ww/Log.w(true,...) for non-fatal warnings;
    // those messages are pushed to messageMapping['w']. See discovery sez. A.2 opzione C.
    const warningsBefore = (Log as any).messageMapping?.['w']?.length ?? 0;

    try {
        const result = await EcoreService.importFromFile(file);

        if (result.success && result.model) {
            // Link imported metamodel to current project (Bug F fix 2026-05-13):
            // EcoreParser.parse() pushes the DModel to state.m2models but does NOT update
            // project.metamodels. Without this, Dashboard shows metamodelsNumber=0 because
            // metamodelsNumber is computed from project.metamodels.length at save time.
            // Pattern mirrors createM2() in Navbar.tsx:75. Reference:
            // docs/discovery/2026-05-13_microdiscovery_bug_ef_render_duplicate.md sec 6.2.
            try {
                project.metamodels = [...project.metamodels, result.model];
                if (result.model.node) {
                    project.graphs = [...project.graphs, result.model.node as any];
                }
            } catch (linkErr) {
                console.warn('[Bug F fix] Failed to link imported metamodel to project:', linkErr);
            }
            markDirty();

            const wAfter = (Log as any).messageMapping?.['w']?.length ?? warningsBefore;
            const wEntries = (Log as any).messageMapping?.['w'] ?? [];
            const collected: string[] = wEntries
                .slice(warningsBefore, wAfter)
                .map((entry: any) => (entry?.short_string ?? String(entry ?? '')).trim())
                .filter((s: string) => s.length > 0);

            if (collected.length > 0) {
                console.warn('Ecore import warnings:', collected);
            }

            dispatchImportSummary(
                buildEcoreImportSummary(result.model, file.name, collected)
            );
        } else {
            throw new Error(result.errors.join(', '));
        }

    } catch (error) {
        console.error('Import Ecore error:', error);
        dispatchImportSummary(
            buildErrorImportSummary(
                'metamodel',
                file.name,
                (error as Error)?.message ?? String(error)
            )
        );
    }

    // Reset input
    if (importEcoreRef.current) {
        importEcoreRef.current.value = '';
    }
};
```

**Project linking** (riga 814-821): ✅ **PRESENTE**. Identico al pattern `createM2` (Navbar.tsx:75-76). Piazzato PRIMA di `markDirty()` e PRIMA del `dispatchImportSummary`. **NON ci sono early-return prima del linking**: se `result.success && result.model` è true, il linking viene eseguito.

### 1.2 — `handleXmiFileChange`

**Range righe**: 865-918 (post-Fase B).

**Codice integrale**:

```ts
const handleXmiFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const result = await XMIService.importM1FromFile(file);

        if (result.success && result.model) {
            // Link imported M1 model to current project (mirrors Bug F fix for Ecore metamodels):
            // XMIService.importM1FromFile creates the DModel but does not register it under
            // project.models / project.graphs, so the Dashboard count and the persistence
            // payload would miss it otherwise.
            try {
                project.models = [...project.models, result.model];
                if (result.model.node) {
                    project.graphs = [...project.graphs, result.model.node as any];
                }
            } catch (linkErr) {
                console.warn('[XMI import] Failed to link imported model to project:', linkErr);
            }
            markDirty();

            if (result.warnings.length > 0) {
                console.warn('XMI import warnings:', result.warnings);
            }

            dispatchImportSummary(
                buildXmiImportSummary(
                    result.model,
                    result.metamodel,
                    result.pattern ?? 'unknown',
                    file.name,
                    result.warnings ?? []
                )
            );
        } else {
            throw new Error(result.errors.join(', '));
        }

    } catch (error) {
        console.error('Import XMI error:', error);
        dispatchImportSummary(
            buildErrorImportSummary(
                'model',
                file.name,
                (error as Error)?.message ?? String(error)
            )
        );
    }

    if (importXmiRef.current) {
        importXmiRef.current.value = '';
    }
};
```

**Project linking** (riga 877-884): ✅ **PRESENTE**. `project.models = [...project.models, result.model]` + `project.graphs = [...project.graphs, result.model.node]`. Stesso pattern del flusso Ecore. NON ci sono early-return prima del linking.

### 1.3 — Sintesi step 1

| Handler | `project.metamodels = ...` | `project.models = ...` | `project.graphs = ...` | `markDirty()` |
|---|---|---|---|---|
| `handleEcoreFileChange` (linee 815-818) | ✅ riga 815 | n/a (M2) | ✅ riga 817 | ✅ riga 822 |
| `handleXmiFileChange` (linee 877-881) | n/a (M1) | ✅ riga 878 | ✅ riga 880 | ✅ riga 885 |

**Nessun early-return prima del linking**. **Nessuna `REGRESSIONE PROBABILE`** localizzata da questa analisi statica.

---

## Step 2 — Diff vs pre-Fase B

### 2.1 — Stato git

I 4 file Fase B sono **non committati** ancora (M flag):
```
 M frontend/src/App.tsx
 M frontend/src/components/project/ProjectEditor.tsx
 M frontend/src/events/registry.ts
 M frontend/src/services/export/XMIService.ts
```

Quindi `git diff HEAD -- frontend/src/components/project/ProjectEditor.tsx` mostra working-tree vs HEAD (= pre-Fase B).

**Hash HEAD**: `e89b59c44` (`chore(log): record W2 EDataType unified implementation entry`).

### 2.2 — Diff puntuale dei due handler

Estratto sintetico (le righe che ho aggiunto/rimosso in Fase B):

```diff
@@ -20,6 +20,7 @@ import {
     TRANSACTION,
     getViewpointType,
     DViewPoint,
+    Log,
 } from '../../joiner';
@@ -42,6 +43,12 @@ import MegamodelView, { type ArtifactStats } from '../megamodel/MegamodelView';
 import { JjodelEvents, SystemEvents, EnvGenEvents } from '../../events/registry';
+import { dispatchImportSummary } from '../import/dispatchImportSummary';
+import {
+    buildEcoreImportSummary,
+    buildXmiImportSummary,
+    buildErrorImportSummary,
+} from '../import/buildImportSummary';
 import './project-editor.scss';
```

**Handler Ecore — solo i cambi rilevanti**:

```diff
@@ -789,6 +796,11 @@ const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onNavigateBack }
     const file = e.target.files?.[0];
     if (!file) return;
 
+    const warningsBefore = (Log as any).messageMapping?.['w']?.length ?? 0;
+
     try {
         const result = await EcoreService.importFromFile(file);
 
@@ -807,20 +819,35 @@ const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onNavigateBack }
             } catch (linkErr) {
                 console.warn('[Bug F fix] Failed to link imported metamodel to project:', linkErr);
             }
-            U.alert('i', 'Imported', `Metamodel "${result.model.name}" imported from Ecore`);
             markDirty();
 
-            // Show warnings if any
-            if (result.warnings.length > 0) {
-                console.warn('Ecore import warnings:', result.warnings);
+            const wAfter = (Log as any).messageMapping?.['w']?.length ?? warningsBefore;
+            const wEntries = (Log as any).messageMapping?.['w'] ?? [];
+            const collected: string[] = wEntries
+                .slice(warningsBefore, wAfter)
+                .map((entry: any) => (entry?.short_string ?? String(entry ?? '')).trim())
+                .filter((s: string) => s.length > 0);
+
+            if (collected.length > 0) {
+                console.warn('Ecore import warnings:', collected);
             }
+
+            dispatchImportSummary(
+                buildEcoreImportSummary(result.model, file.name, collected)
+            );
         } else {
             throw new Error(result.errors.join(', '));
         }
 
     } catch (error) {
         console.error('Import Ecore error:', error);
-        U.alert('e', 'Import Failed', `Could not import Ecore: ${(error as Error).message}`);
+        dispatchImportSummary(
+            buildErrorImportSummary(
+                'metamodel',
+                file.name,
+                (error as Error)?.message ?? String(error)
+            )
+        );
     }
```

**Handler XMI — solo i cambi rilevanti** (struttura identica al precedente):

```diff
@@ -855,19 +882,34 @@ const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onNavigateBack }
             } catch (linkErr) {
                 console.warn('[XMI import] Failed to link imported model to project:', linkErr);
             }
-            U.alert('i', 'Imported', `Model "${result.model.name}" imported from XMI`);
             markDirty();
 
             if (result.warnings.length > 0) {
                 console.warn('XMI import warnings:', result.warnings);
             }
+
+            dispatchImportSummary(
+                buildXmiImportSummary(
+                    result.model,
+                    result.metamodel,
+                    result.pattern ?? 'unknown',
+                    file.name,
+                    result.warnings ?? []
+                )
+            );
         } else {
             throw new Error(result.errors.join(', '));
         }
 
     } catch (error) {
         console.error('Import XMI error:', error);
-        U.alert('e', 'Import Failed', `Could not import XMI: ${(error as Error).message}`);
+        dispatchImportSummary(
+            buildErrorImportSummary(
+                'model',
+                file.name,
+                (error as Error)?.message ?? String(error)
+            )
+        );
     }
```

### 2.3 — Conclusione step 2

| Aspetto | Stato |
|---|---|
| Project linking PRE (Bug F fix `project.metamodels = ...`, `project.graphs = ...`) | ✅ presente |
| Project linking POST | ✅ identico, riga per riga, **preservato** |
| `markDirty()` PRE / POST | ✅ presente in entrambi |
| `try/catch linkErr` interno | ✅ preservato |
| Modifiche rilevanti al linking | ❌ **NESSUNA** |

**Verdetto step 2**: la Fase B **NON ha modificato** il project linking. Le sole modifiche sono:
- Cattura warning channel (delta `Log.messageMapping['w']`)
- Rimozione `U.alert` x4 e sostituzione con `dispatchImportSummary`
- Spostamento di `markDirty()` di una riga (era dopo `U.alert`, ora è subito dopo `linkErr`).

Il **codice di linking è bit-per-bit identico** alla versione pre-Fase B.

---

## Step 3 — Stato attuale di `buildImportSummary.ts`

Letto integralmente (160 righe). Estratto delle funzioni chiave:

### 3.1 — `resolveRootPackage`

```ts
function resolveRootPackage(model: LModel): LPackage | undefined {
    return model.packages?.[0];
}
```

**Accesso diretto** a `model.packages` via L-getter. Restituisce il **primo** package (root).

### 3.2 — Conteggi `buildEcoreImportSummary`

```ts
const allRoots: LPackage[] = model.packages ?? [];
const allPackages = visitAllPackages(allRoots);

let classCount = 0;
let attributeCount = 0;
let referenceCount = 0;
let enumCount = 0;
for (const pkg of allPackages) {
    const classes = pkg.classes ?? [];
    classCount += classes.length;
    for (const cls of classes) {
        attributeCount += (cls.attributes ?? []).length;
        referenceCount += (cls.references ?? []).length;
    }
    enumCount += (pkg.enumerators ?? []).length;
}
```

### 3.3 — `visitAllPackages` (BFS deduplicato)

```ts
function visitAllPackages(rootPackages: LPackage[]): LPackage[] {
    const out: LPackage[] = [];
    const seen = new Set<string>();
    const stack: LPackage[] = [...rootPackages];
    while (stack.length > 0) {
        const p = stack.pop()!;
        if (!p || seen.has(p.id)) continue;
        seen.add(p.id);
        out.push(p);
        const subs = p.subpackages ?? [];
        for (const sp of subs) stack.push(sp);
    }
    return out;
}
```

### 3.4 — `resolveRootPackageDisplay`

```ts
function resolveRootPackageDisplay(pkg: LPackage | undefined): { name: string; nsURI: string } {
    if (!pkg) return { name: '(unnamed package)', nsURI: '' };
    const name = pkg.name || '(unnamed package)';
    const rawUri: string = ((pkg as any).__raw?.uri ?? '') as string;
    const nsURI = rawUri || `(name: ${name})`;
    return { name, nsURI };
}
```

**Tutte le letture passano da `model.packages?.[0]`**. Se quel getter restituisce `undefined` o un wrapper "vuoto", tutti i conteggi cadono a 0 e nsURI cade nel fallback `(name: <name>)`.

---

## Step 4 — Verifica runtime via console (NON eseguita)

**Status**: questo step è **un'operazione runtime in browser** che richiede l'apertura della DevTools console e l'esecuzione manuale di snippet JavaScript. **Non l'ho eseguita** in questa sessione di discovery — non ho accesso al browser dell'utente.

**Snippet diagnostico raccomandato** (da eseguire da Alfonso post-discovery, se vuole confermare la diagnosi):

```js
// Subito dopo aver chiuso il modale post-import:
const state = (window as any).store?.getState?.();
const idlookup = state?.idlookup ?? {};

// 1) DModel pointer e entità
const m2pointers = state?.m2models ?? [];
const dmodel = idlookup[m2pointers[m2pointers.length - 1]];
console.log('Last DModel:', dmodel);
console.log('DModel.packages field (Pointer[]):', dmodel?.packages);
console.log('DModel.isMetamodel:', dmodel?.isMetamodel);

// 2) DPackage in idlookup
const allEntities = Object.values(idlookup);
const dpackages = allEntities.filter((e: any) => e?.className === 'DPackage');
console.log('All DPackages:', dpackages.length);
console.log('DPackages of imported model:',
    dpackages.filter((p: any) => p?.father === dmodel?.id));

// 3) DClass conteggio
const dclasses = allEntities.filter((e: any) => e?.className === 'DClass');
console.log('All DClasses:', dclasses.length);

// 4) LProject metamodels (LIVE check)
const projects = state?.projects ?? state?.idlookup ?
    Object.values(idlookup).filter((e: any) => e?.className === 'DProject') : [];
const currentProject = (projects as any[]).find((p) => p?.isOpen) ?? (projects as any[])[0];
console.log('currentProject.metamodels (Pointer[]):', currentProject?.metamodels);
console.log('currentProject.metamodelsNumber (PERSISTED):', currentProject?.metamodelsNumber);
```

**Output atteso (ipotesi più probabili)**:

| Scenario | DModels count | DModel.packages | DPackages of model | DClasses | currentProject.metamodels.length | currentProject.metamodelsNumber |
|---|---|---|---|---|---|---|
| **A** (Bug 1 confermato, Bug 2 = pre-existing UX) | ≥1 | popolato | ≥1 | ≥1 | ≥1 (linking ok) | 0 (mai salvato) |
| **B** (Bug 1 = wrapper stale, Bug 2 idem) | ≥1 | **popolato** ma `result.model.packages` returns `[]` | ≥1 | ≥1 | ≥1 | 0 |
| **C** (parser bug pre-esistente) | ≥1 | **vuoto** in idlookup | 0 | ≥1 ma orfane | ≥1 | 0 |

Scenario **A** + **B** sono entrambi compatibili con i sintomi riferiti.

---

## Step 5 — Stato L-layer wrapper (NON eseguito)

Anche questo step è runtime-only. Lo snippet utile sarebbe:

```js
const LPointerTargetable = (window as any).LPointerTargetable;
const lmodel = LPointerTargetable?.fromD?.(dmodel);
console.log('LModel wrapper:', lmodel);
console.log('lmodel.packages:', lmodel?.packages);
console.log('lmodel.packages.length:', lmodel?.packages?.length);
console.log('lmodel.packages[0].__raw:', lmodel?.packages?.[0]?.__raw);
console.log('lmodel.packages[0].__raw.uri:', lmodel?.packages?.[0]?.__raw?.uri);
console.log('lmodel.packages[0].classes:', lmodel?.packages?.[0]?.classes);
console.log('lmodel.packages[0].classes.length:', lmodel?.packages?.[0]?.classes?.length);
```

**Output diagnostico**:
- Se `lmodel.packages` è `[]`/`undefined` → Bug 1 root cause in **L-getter** (non in `buildImportSummary`).
- Se `lmodel.packages[0].__raw` è un wrapper di **DModel** invece che di **DPackage** → bug di shape (parser confonde i tipi).
- Se `lmodel.packages[0]` è una LPackage corretta MA `.classes` è vuoto → bug di linking DPackage→DClass (separabile).

---

## Step 6 — Pattern canonico di project linking

### 6.1 — Pattern M2 (createM2)

`frontend/src/pages/components/Navbar.tsx:69-91` definisce il pattern canonico:

```ts
export function createM2(project: LProject, name0?: string) {
    let name = name0 || 'metamodel_' + 1;
    let names: string[] = Selectors.getAllMetamodels().map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => names.indexOf(newName) >= 0);
    const dModel = DModel.new(name, undefined, true);
    const lModel: LModel = LModel.fromD(dModel);
    project.metamodels = [...project.metamodels, lModel];               // <-- linking M2
    project.graphs = [...project.graphs, lModel.node as LGraph];        // <-- graphs link
    const dPackage = lModel.addChild('package');                        // <-- crea il package root
    const lPackage: LPackage = LPackage.fromD(dPackage);
    lPackage.name = 'default';
    DockManager.open2(lModel);
    // ...
}
```

**Differenza chiave rispetto al flusso Ecore-import**: `createM2` chiama `lModel.addChild('package')` per creare ESPLICITAMENTE un DPackage. Nell'import Ecore, il DPackage è creato DAL PARSER e linkato via `parent.packages.push(dObject.id)` (data.ts:690).

### 6.2 — Pattern M1 (createM1)

Stesso file, righe 93-112:

```ts
export function createM1(project: LProject, metamodel: LModel) {
    let name = 'model_' + 1;
    let modelNames = metamodel.models.map(m => m.name);
    name = U.increaseEndingNumber(name, false, false, newName => modelNames.indexOf(newName) >= 0);
    const dModel: DModel = DModel.new(name, metamodel.id, false, true);
    const lModel: LModel = LModel.fromD(dModel);
    project.models = [...project.models, lModel];                       // <-- linking M1
    project.graphs = [...project.graphs, lModel.node as LGraph];
    DockManager.open2(lModel);
    // ...
}
```

### 6.3 — Storia del fix Bug F

- Discovery originale: `docs/discovery/2026-05-13_microdiscovery_bug_ef_render_duplicate.md` sez. 6.2.
- Fix applicato in DUE call site:
  - `ProjectEditor.tsx:814-821` (handler `handleEcoreFileChange`)
  - `SaveManager.ts:156-183` (metodo `importEcore`, percorso menu topbar)
- **Razionale**: `EcoreParser.parse()` pusha il DModel in `state.m2models` ma NON in `project.metamodels`. Il `metamodelsNumber` su DProject è popolato da `projects.ts:98` (`dProject.metamodelsNumber = project.metamodels.length`) **solo a save-time**. Senza il linking, anche al save il count rimane 0.

### 6.4 — Dove è renderizzato `metamodelsNumber`

```bash
grep -rn "metamodelsNumber" frontend/src --include="*.tsx" --include="*.ts"
```

Risultati UI consumer (escludendo DTO, persistance, getter/setter):
- `pages/components/Project.tsx:371` — card progetto nella pagina **AllProjects** (UI atteso da bug 2 user-report)
- `pages/ProjectsInfo.tsx:22` — pagina debug
- `ProjectEditor.tsx:810,811` — solo commenti referenziali al Bug F fix, NESSUN render

Nessun consumer in `ProjectEditor.tsx`. La "Project Dashboard" del bug-report dell'utente è **la pagina AllProjects** (card list), non il pannello interno dell'editor.

---

## Step 7 — Open Questions

### OQ-A — Bug 1: dove fallisce esattamente la pipeline `result.model.packages` → conteggi?

**Default proposto**: aggiungere `console.log` di diagnostica **temporanea** dentro `buildEcoreImportSummary` per ispezionare:
- `model` (intero wrapper)
- `model.packages` (lunghezza + struttura)
- `model.packages?.[0]?.__raw?.uri`
- `model.packages?.[0]?.classes?.length`

Stampare su 1 import di test, leggere i log, rimuovere i `console.log`. Più veloce di una nuova ipotesi astratta.

**Alternativa**: chiedere ad Alfonso di eseguire gli snippet di step 4-5 in console e riportare l'output. Stesso risultato senza modifiche al codice.

### OQ-B — Bug 2: è una regressione di Fase B o behavior pre-esistente?

**Default proposto**: il diff `git diff HEAD -- ProjectEditor.tsx` mostra che il linking è **bit-per-bit preservato**. Quindi Bug 2 **NON è una Fase B regressione**, ma behavior pre-esistente: `metamodelsNumber` è popolato solo a save-time (vedi `projects.ts:98`). Senza save, la card AllProjects mostra il valore precedente. Confermare con Alfonso se ha effettivamente salvato il progetto prima di tornare ad AllProjects.

**Alternativa**: se Alfonso ha salvato e il count resta 0, c'è qualcos'altro. Possibile:
- `project.metamodels = [...]` setter fallisce silenziosamente (il `try/catch linkErr` cattura ma non rilancia)
- Il `set_metamodels` di LProject (classes.ts:3282) ha un bug che non scrive in `idlookup[project.id].metamodels`. Verificabile via runtime console.

### OQ-C — Bug 1 alternativo: `Pointers.from(val0)` in `set_metamodels` perde l'oggetto?

**Decisione**: in `LProject.set_metamodels` (classes.ts:3282-3288):
```ts
let val = Pointers.from(val0);
TRANSACTION(... () => SetFieldAction.new(c.data.id, 'metamodels', val, '', true) )
```
`Pointers.from(val0)` riceve `[...project.metamodels, result.model]`. Se `result.model` è un wrapper LModel e `Pointers.from` accede a `wrapper.id`, ottiene la stringa giusta. Se invece serializza in modo inaspettato, il pointer potrebbe essere corrotto.

**Default proposto**: ignorare per ora. Se OQ-A rivela che `model.packages` funziona ma la dashboard è broken, allora investigare OQ-C.

### OQ-D — Stato sidebar/TreeView: davvero mostra il metamodello correttamente?

L'utente ha dichiarato "Sidebar (TreeView, Navbar) mostra il metamodello correttamente." Questa è la chiave per il Bug 1:
- Sidebar mostra i metamodelli da `state.m2models` (NON da `project.metamodels`). Quindi il DModel È in state.
- Sidebar mostra anche le classi (TreeView espande il DModel → DPackage → DClass). Quindi `dmodel.packages` E `dpackage.classes` SONO popolati in idlookup.

**Se questo è confermato**, allora il bug è SOLO nella chiamata `buildEcoreImportSummary(result.model, ...)` → `result.model` non è una buona reference per accedere a `.packages`.

**Default proposto**: confermare con Alfonso che la sidebar mostra le **classi**, non solo il nome del metamodello. Se sì → OQ-A è la strada giusta (problema nel wrapper L o nel reference `result.model`).

---

## Diagnosi finale

### Bug 1 — Conteggi sempre a 0

**Ipotesi più probabile** (in ordine):

1. **L-getter `model.packages` restituisce empty array** anche se il dato è in idlookup. Motivi possibili:
   - Il `LPointerTargetable.fromD(dmodel)` in `EcoreService.importFromXML:573` crea un wrapper basato sull'**ID del local dmodel pre-persist**. Dopo `Constructors.persist`, in idlookup c'è una **copia** del DModel con ID **uguale** (atteso). Ma se il persist clona profondamente e perde il riferimento `packages`, il wrapper trova `context.data.packages = []`.
   - **Confidence**: media. La discovery 17/05 non riporta bug simili; il TreeView legge correttamente. Da verificare in runtime.

2. **`result.model.packages?.[0]` è un LPackage corretto, ma `.classes` è vuoto**:
   - Il parser linka `dpackage.classes` via `parseDClass(dObject, child, generated, '')` (data.ts:707). La funzione `parseDClass` (non letta integralmente in questa discovery) potrebbe pushare le classi su un campo diverso o aver un bug. Confidence: bassa, perché la sidebar le vede.

3. **Race condition / async timing**: la `dispatchImportSummary` viene chiamata dopo TRANSACTION del `project.metamodels = ...`. Eventuali Redux re-runs intermedi potrebbero re-creare wrapper o ridurre arrays. Confidence: bassa, le TRANSACTION sono sync.

**Diagnostica raccomandata**: OQ-A.

### Bug 2 — Dashboard mostra 0 metamodelli

**Diagnosi**: **NON è una regressione di Fase B**. Il diff dimostra che il project linking è bit-per-bit preservato. Il `metamodelsNumber` letto in `pages/components/Project.tsx:371` è il campo **persistito** sul DProject (`dProject.metamodelsNumber`), aggiornato solo al save (`projects.ts:98`). Senza save, la card AllProjects non riflette i cambi in-memory.

**Confidence**: alta, basata su:
- diff `git diff HEAD` → linking preservato
- `metamodelsNumber` getter (`classes.ts:3183`) legge `c.data.metamodelsNumber` (campo statico, non computed)
- `metamodelsNumber` setter chiamato solo in `projects.ts:98` (save-time) e `projects.ts:224` (DTO load-time)

**Possibili motivi secondari (meno probabili)**:
- Se Alfonso ha effettivamente salvato e il count resta 0, allora `project.metamodels = [...]` setter fallisce silenziosamente. Verificabile con OQ-A snippet riga "currentProject.metamodels (Pointer[])".

---

## File da toccare nella Fase fix (stima)

Scenario A — diagnostica leggera (OQ-A):

| File | Operazione | Righe ± |
|---|---|---|
| `frontend/src/components/import/buildImportSummary.ts` | aggiunta temporanea di 3-4 `console.log` diagnostici dentro `buildEcoreImportSummary` | +5 / -0 (rimossi dopo verifica) |
| `frontend/src/components/import/buildImportSummary.ts` | rimozione `console.log` post-diagnosi e applicazione del fix mirato | -5 / +xxx |

Scenario B — fix `Bug 1` con guard difensiva (se OQ-A indica wrapper stale):

| File | Operazione | Righe ± |
|---|---|---|
| `frontend/src/components/import/buildImportSummary.ts` | sostituire `model.packages?.[0]` con `LPointerTargetable.fromPointer(model.__raw?.packages?.[0])` o `Selectors.getAll(DPackage).filter(p => p.father === model.id)[0]` | +10 / -2 |
| `frontend/src/services/export/EcoreService.ts` | eventuale fix in `importFromXML` se `LPointerTargetable.fromD(dmodel)` ha un problema noto (sconsigliato — più rischio sul bundle service) | +1 / -1 |

Scenario C — fix `Bug 2` (solo se OQ-B conferma una vera regressione, NON dal diff statico):

| File | Operazione | Righe ± |
|---|---|---|
| `frontend/src/components/project/ProjectEditor.tsx` | aggiungere un `void project.metamodels` post-set per forzare re-read (workaround), o spostare il linking dopo `dispatchImportSummary` (cambio di ordering) | +1 / -0 |

**Nota**: tutti i file core (`data.ts`, `LModelElement.tsx`, `Log.ts`) restano fuori scope.

---

**HARD STOP**. Aspetto decisione di Alfonso su:
1. **OQ-A**: aggiungere `console.log` diagnostici a `buildImportSummary.ts` e farti riportare l'output? OPPURE Alfonso esegue gli snippet di step 4-5 in console e riporta i valori? OPPURE altra strategia diagnostica?
2. **OQ-B**: confermare se Bug 2 è solo "ho dimenticato di salvare" (UX clarification) o c'è un problema runtime sotto.
3. Approvazione Scenario A/B/C per la Fase fix.
