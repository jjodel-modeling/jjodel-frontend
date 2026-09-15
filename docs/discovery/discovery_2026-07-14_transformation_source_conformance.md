# Discovery — Conformità sorgente falsata nell'Execute Transformation

**Data**: 2026-07-14
**Tipo**: Fase 1 discovery READ-ONLY (hard stop prima della Fase 2)
**Branch**: `alfonso-frontend-jjtl`
**Zona**: `jjtl/components/`, `components/abstract/DockManager.tsx`, `components/project/ProjectEditor.tsx` — **fuori critical-zone** (nessun `useJjomSync.ts` / `portDistribution.ts` / `syncState.ts` toccato o coinvolto).
**Working tree**: pulito salvo un file untracked non correlato (`frontend/src/jjscript/__tests__/_detect_probe.test.ts`), lasciato intatto.

> ⚠️ **Correzione di path**: il prompt cita path `src/...`. Nel working tree i file sono sotto `frontend/src/...`. Tutti i riferimenti riga sotto sono verificati sul working tree corrente.

---

## Obiettivo

Confermare sul working tree reale la meccanica per cui, nel dialog "Execute Transformation", **a volte** un modello realmente conforme al metamodello `from` non compare tra i sorgenti selezionabili (o il dialog dichiara "No models conforming to …"), e sciogliere Q1–Q6 prima di decidere la forma del fix. Nessuna modifica al codice in questa fase.

---

## Root cause — CONFERMATA

Il dialog decide la conformità **per uguaglianza di stringa sul nome del metamodello**, mai per identità (ID). L'ID è presente e affidabile su entrambi i lati ma non viene usato per il confronto.

`frontend/src/jjtl/components/ExecuteTransformationDialog.tsx:70-101` (blocco `compatibleModels`):

```ts
const mmId = model.metamodelId || model.conformsTo || (typeof model.metamodel === 'string' ? model.metamodel : model.metamodel?.id) || '';
const mmName = model.metamodelName || (typeof model.metamodel === 'object' ? model.metamodel?.name : '') || '';

const matchesByName = mmName && mmName === sourceMetamodelName;
const matchesById   = mmId   && mmId   === sourceMetamodelName; // ID confrontato con NOME → vero solo per coincidenza
const matches = matchesByName || matchesById;
```

- `matchesByName` è **l'unico criterio realmente attivo**: nome-vs-nome.
- `matchesById` confronta l'**ID del metamodello del modello** con il **nome** cercato (`sourceMetamodelName`) → semanticamente privo di senso, vero solo per coincidenza. Il commento inline ("In case sourceMetamodelName is actually an ID") non corrisponde a nessun chiamante reale: `sourceMetamodelName` è sempre un nome (vedi Q2).
- Il dialog **non riceve** `sourceMetamodelId` (props: `ExecuteTransformationDialog.tsx:21-32`), quindi non ha alcun modo di confrontare per identità anche se volesse.

Qualunque divergenza tra `model.metamodelName` (prodotto in `ProjectEditor`) e `sourceMetamodelName` (fotografato sulla trasformazione) scarta un modello conforme, mentre `model.metamodelId === transformation.sourceMetamodelId` resterebbe **vero**.

**Precedente ID-based nello stesso codebase** (la conformità canonica NON usa il nome per l'identità):
- `frontend/src/model/conformance/useConformance.ts:34` — il metamodello di un modello è `lModel.instanceof` (identità del puntatore).
- `frontend/src/model/conformance/ConformanceValidator.ts:63` — metaclasse risolta con `mmClassById.get(metaClass.id) || mmClassByName.get(metaClass.name)` → **ID-first, nome solo come fallback**. È esattamente il pattern da replicare nel dialog.
- `frontend/src/components/project/ProjectEditor.tsx:440-457` + `frontend/src/model/megamodelInference.ts:126-127` — la stessa relazione concettuale (quale modello conforma a quale metamodello / sorgente di una trasformazione) è già decisa **per ID** (`instanceofMetamodelId`, `t.sourceMetamodelId`).

Il dialog è l'**unico** punto che si discosta dal pattern ID-based.

---

## Findings per domanda

### Q1 — Forma attuale sul working tree

**`frontend/src/jjtl/components/ExecuteTransformationDialog.tsx`**
- `ModelOption` (L11-19): ha sia `metamodelId: string` sia `metamodelName: string` (più `conformsTo?`, `metamodel?`).
- `ExecuteTransformationDialogProps` (L21-32): riceve `sourceMetamodelName: string` e `availableModels: ModelOption[]`. **NON riceve `sourceMetamodelId`**. Confermato.
- `compatibleModels` `useMemo` (L54-111): logica riportata sopra. Deps: `[availableModels, sourceMetamodelName, isOpen]` (L111).
- Il messaggio "No models conforming to …" è a L258; il gate `noCompatibleModels = compatibleModels.length === 0` è a L214 e disabilita anche il pulsante Execute (L362).

**`frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx`** (threading props → dialog)
- Props del componente: `sourceMetamodelName?: string` (L37, default `'Source'` a L74), `availableModels?: ModelOption[]` (L40, default `[]` a L76). **Nessuna prop `sourceMetamodelId`**.
- Mount del dialog (L889-898):
  ```tsx
  <ExecuteTransformationDialog
      isOpen={isExecuteDialogOpen}
      onClose={...}
      onExecute={handleExecuteTransformation}
      transformationName={ast?.name || 'Untitled'}
      sourceMetamodelName={sourceMetamodelName}   // L894
      targetMetamodelName={targetMetamodelName}
      availableModels={availableModels}            // L896
      existingModelNames={existingModelNames}
  />
  ```
  (Le occorrenze `sourceMetamodelName` a L578/L605/L743 alimentano ALTRI componenti — DualMetamodelPanel / SuggestedMappingsPanel — non il dialog.)

**`frontend/src/components/abstract/DockManager.tsx`** (`openTransformation`, L244-317)
- `tabContent = React.createElement(JjtlDevelopmentEnv, {...})` a L304-317:
  - `sourceMetamodelName: transformation.sourceMetamodelName || 'Source'` (**L310**) — se il nome memorizzato è vuoto diventa la stringa letterale `'Source'`.
  - `availableModels: availableModels || []` (L312).
  - **Non passa `sourceMetamodelId`**. (`transformation.sourceMetamodelId` è disponibile sull'oggetto `transformation` ricevuto come primo argomento — vedi Q3.)

**Scostamenti rispetto ai riferimenti del prompt**: solo path (`frontend/src/…`) e micro-drift di riga (props L21-32 vs "~L20-30"; compatibleModels L54-111 vs "~L52-111"; dialog mount / `sourceMetamodelName` L894; DockManager L310). Nessuna differenza sostanziale: il working tree corrisponde ai riferimenti del branch pushato.

### Q2 — Tutti i punti di montaggio

**Il dialog ha UN SOLO mount point**: `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx:889`.
`ProjectEditor` **non** monta il dialog direttamente. `NewTransformationDialog` è un componente distinto (creazione, non esecuzione).

Catena di montaggio unica e lineare:
```
ProjectEditor.handleOpenTransformation  (ProjectEditor.tsx:1105)
  ├─ costruisce availableModels          (:1133-1169)   metamodelId affidabile, metamodelName fragile
  └─ DockManager.openTransformation(transformation, …, availableModels, …)   (:1871)   [UNICO caller]
        └─ tabContent = JjtlDevelopmentEnv({ sourceMetamodelName: transformation.sourceMetamodelName || 'Source', availableModels, … })   (DockManager.tsx:304-317)
              └─ <ExecuteTransformationDialog sourceMetamodelName=… availableModels=… />   (JjtlDevelopmentEnv.tsx:889)
                    └─ filtro compatibleModels PER NOME   (:83-86)
```

- `DockManager.openTransformation` ha **un solo caller**: `ProjectEditor.tsx:1871`.
- `availableModels` in forma `ModelOption[]` è costruito in **un solo posto**: `ProjectEditor.tsx:1133`.
- **Test**: nessun test tocca `ExecuteTransformationDialog`, `compatibleModels`, o `availableModels` (vedi Q5).

**Conseguenza**: il threading a 3 file previsto dalla Fase 2 (Dialog + JjtlDevelopmentEnv + DockManager) è **completo e sufficiente**. `ProjectEditor` **non** richiede modifiche: `DockManager` legge `transformation.sourceMetamodelId` direttamente dall'oggetto `transformation` che già riceve. Lo step 4 della Fase 2 ("se ProjectEditor monta il dialog direttamente") **non si applica**.

### Q3 — Persistenza di `sourceMetamodelId`

- **Tipo**: `frontend/src/jjtl/types/transformation.ts:15` — `sourceMetamodelId?: string` (**opzionale**).
- **Hydrate**: `ProjectEditor.tsx:168-170` — lo stato React è idratato da `((project as any).transformations as JjtlTransformation[]) || []`. È un array di oggetti `JjtlTransformation` plain persistiti sul `DProject`.
- **Sync-back / save**: `ProjectEditor.tsx:171-182` — ogni `setTransformations` fa `SetFieldAction.new(project.id, 'transformations', next, '', false)`; il commento a L165-166 conferma "synced back to Redux on every change so SaveManager picks them up". Round-trip come **campo plain** dell'oggetto: **nessun serializer custom che spoglia campi**. Quindi una trasformazione salvata e ricaricata **conserva `sourceMetamodelId`** se lo aveva al momento del salvataggio.
- **Creazione (dialog)**: `NewTransformationDialog` → `ProjectEditor.tsx:2706-2711` `handleCreateTransformation(data.name, data.sourceMetamodelId, …)` → `ProjectEditor.tsx:1087-1098` `createTransformation(name, sourceId, sourceMM?.name, …)` → `transformation.ts:59` `sourceMetamodelId = sourceId`. **Le trasformazioni create dal dialog hanno sempre l'ID** (a meno che `sourceId` sia undefined).
- **Duplicazione**: `ProjectEditor.tsx:1927-1934` propaga `original.sourceMetamodelId`. OK.
- **Fixtures/legacy nel repo**: **nessun** file progetto (`.jjodel`/`.json`) versionato nel repo contiene array `transformations`. Nessuna fixture legacy con `sourceMetamodelName` ma senza `sourceMetamodelId`.

**Rischio legacy residuo (fuori repo)**: essendo `sourceMetamodelId?` opzionale, esistono potenzialmente progetti salvati **nel browser dell'utente (IndexedDB/localStorage)** creati:
  (a) prima che `sourceMetamodelId` esistesse nello schema, oppure
  (b) con `sourceId` undefined (→ `sourceMetamodelId=undefined`, `sourceMetamodelName='SourceMM'`).
Questi hanno un nome ma non l'ID. → **Il fallback per nome va MANTENUTO** (come previsto dalla Fase 2), per non regredire su queste trasformazioni. Nota: per il caso (b) anche il fallback per nome fallisce (`'SourceMM'` letterale non combacia con nulla) — ma quel caso è già rotto oggi e non peggiora.

### Q4 — Semantica di `model.instanceof`

Confermato: `metamodelId` in `availableModels` è **sempre il pointer id del metamodello**, in entrambi i rami (`ProjectEditor.tsx:1138-1153`):
```ts
const instanceOf = model.instanceof;
if (typeof instanceOf === 'string') {          // raw Pointer string
    mmId = instanceOf;                          // = pointer id del metamodello
    mmName = metamodels?.find(m => m.id === mmId)?.name || '';   // FRAGILE
} else if (typeof instanceOf === 'object') {    // LModel proxy
    mmId = (instanceOf as any).id || '';        // = id del metamodello
    mmName = (instanceOf as any).name || '';    // FRAGILE (proxy può non aver risolto .name)
}
```
- `model.instanceof` di un modello = puntatore/proxy al suo **metamodello**. Corroborato da tre siti indipendenti:
  - `useConformance.ts:34` — `const metamodel = lModel.instanceof as LModel`.
  - `ProjectEditor.tsx:1138` — `model.instanceof` → mmId.
  - `ProjectEditor.tsx:441-442` (megamodel) — `m.__raw.instanceof` (string pointer) → `instanceofMetamodelId`.
- `models`/`metamodels` sono L-proxy da `project.models` / `project.metamodels` (`ProjectEditor.tsx:160-161`).
- `metamodelId` è **affidabile** in entrambi i rami; `metamodelName` è il campo **fragile** (vuoto quando il metamodello non è nell'array `metamodels` in quel momento, o quando il proxy risolve `.name` in ritardo).

### Q5 — Test esistenti

- **Nessun** test su matching/conformità del dialog di esecuzione, su `compatibleModels`, o su `availableModels` (grep su `*.test.ts(x)` → 0 hit).
- L'unico test che usa `sourceMetamodelId` è `frontend/src/model/__tests__/megamodel.test.ts:34` (megamodel inference, ID-based) — **non correlato** al dialog, non a rischio dal fix.
- `frontend/src/model/conformance/` non ha test unitari nella cartella.

**Conclusione**: il fix non può rompere test esistenti; nessun test da aggiornare (opzionale: un nuovo test unitario su `compatibleModels` sarebbe additivo, ma il componente non ha una superficie di test isolata oggi).

### Q6 — Secondo gate all'esecuzione

**Non esiste** una ri-validazione della conformità del sorgente **per nome** a valle della selezione. Il path di run:
- `JjtlDevelopmentEnv.handleExecuteTransformation` (`JjtlDevelopmentEnv.tsx:268-354`): riceve `sourceModelId`, ri-parsa l'AST, chiama `onExecuteTransformation(sourceModelId, outputModelName, ast)`. **Nessun controllo di conformità/nome**.
- `ProjectEditor.handleExecuteTransformation` (`ProjectEditor.tsx:1259-…`): unico gate è `const sourceModel = models.find(m => m.id === sourceModelId)` (**:1287**, pura ricerca per ID) + `metamodels.find(mm => mm.id === transformation.targetMetamodelId)` (:1296) per il target. La risoluzione `className` (:1317+) serve solo a costruire i dati sorgente per l'executor, **non** è un gate di conformità.

**Conseguenza**: il filtro `compatibleModels` del dialog è **l'UNICO** gate di conformità del sorgente. Correggerlo è sufficiente: nessun rigetto a valle re-introdurrà il problema per nome.

---

## Perché "a volte" (intermittenza) — meccanica confermata

In tutti i casi sotto, `model.metamodelId === transformation.sourceMetamodelId` resterebbe **vero**; è solo il confronto per **nome** a fallire.

1. **Nome non risolto** (idratazione): `metamodelName` esce vuoto quando `instanceof` è un pointer string e il metamodello non è (ancora) nell'array `metamodels` (`ProjectEditor.tsx:1146-1147`), o quando il proxy risolve `.name` in ritardo (`:1150-1151`). Dipende dallo stato al momento di apertura del tab → `matchesByName` falso, `matchesById` (ID vs nome) falso → modello scartato.
2. **Snapshot stantìo**: `transformation.sourceMetamodelName` è fotografato alla creazione (`createTransformation`); un rename successivo del metamodello lo fa divergere dal `metamodelName` corrente dei modelli.
3. **Nome assente → letterale**: `'SourceMM'` (`transformation.ts:52`) o `'Source'` (`DockManager.tsx:310`) per trasformazioni senza nome risolvibile → non combacia con nulla.
4. **Normalizzazione (latente)**: `generateDefaultCode` produce `from ${sourceMM.replace(/\s+/g,'')}` (`transformation.ts:81`); qualunque path che derivi il nome dal token `from` divergerebbe da `metamodel.name` con spazi.

---

## Dipendenze e rischi

- **Scope**: 3 file (Dialog, JjtlDevelopmentEnv, DockManager). `ProjectEditor` **non** va toccato (Q2). Tutti **fuori critical-zone**.
- **Interfacce TS**: aggiunta di **sole proprietà opzionali** (`sourceMetamodelId?: string`) su `ExecuteTransformationDialogProps` e `JjtlDevelopmentEnvProps` → additivo, non rompe chiamanti esistenti. `ModelOption` **non** cambia (ha già `metamodelId`). `metamodelName` resta per il fallback.
- **Rischio regressione**: minimo. Il criterio primario diventa ID; il fallback per nome preserva il comportamento attuale per trasformazioni legacy prive di ID (Q3). Nessun path a valle da adeguare (Q6). Nessun test da aggiornare (Q5).
- **`matchesById` attuale** va **rimosso/corretto** (ID-vs-nome): non deve restare come criterio primario, altrimenti in progetti dove per caso un modello ha `metamodelId` uguale al `sourceMetamodelName` cercato si avrebbe un match spurio (raro ma possibile).
- **Deps `useMemo`**: aggiungere `sourceMetamodelId` a `[availableModels, sourceMetamodelName, isOpen]`.
- Build/typecheck: baseline noto (typecheck ~33 errori pre-esistenti, nessuno nei file toccati; build verde salvo warning chunk-size). Il fix non deve incrementare il conteggio.

---

## Forma del fix proposta (da confermare in chat — Fase 2)

Coerente con la direzione del prompt e con il precedente ID-first/name-fallback di `ConformanceValidator.ts:63`:

1. **`ExecuteTransformationDialog.tsx`**
   - Prop opzionale `sourceMetamodelId?: string` in `ExecuteTransformationDialogProps` (additiva).
   - `compatibleModels`: se `sourceMetamodelId` presente → criterio **primario** `mmId && mmId === sourceMetamodelId`; **fallback** (solo se `sourceMetamodelId` falsy) → `mmName && mmName === sourceMetamodelName`.
   - Rimuovere/correggere `matchesById = mmId === sourceMetamodelName`.
   - Aggiungere `sourceMetamodelId` alle deps del `useMemo`.
2. **`JjtlDevelopmentEnv.tsx`**: prop `sourceMetamodelId?: string`, inoltrata al dialog accanto a `sourceMetamodelName` (L894).
3. **`DockManager.tsx`**: nel `tabContent` (L304-317) passare `sourceMetamodelId: transformation.sourceMetamodelId`.
4. **`ProjectEditor.tsx`**: nessuna modifica (Q2).

---

## Domande aperte per Alfonso

1. **Fallback per nome**: mantenerlo (raccomandato, per le trasformazioni legacy/browser prive di `sourceMetamodelId` — Q3)? La Fase 2 lo prevede; confermo?
2. **Caso (b) di Q3** (trasformazioni con `sourceMetamodelId=undefined` E `sourceMetamodelName='SourceMM'`): sono già rotte oggi e restano non recuperabili anche col fix (nessuna delle due chiavi combacia). Le consideriamo fuori scope (non peggiorano), o vuoi anche un percorso di "ri-binding" (fuori dai 3 file)? — Raccomando **fuori scope**.
3. **Test additivo**: vuoi che in Fase 2 aggiunga un piccolo unit test su `compatibleModels` (estraendo la logica di filtro come funzione pura), o teniamo il diff strettamente ai 3 file senza refactor? — Di default tengo il diff minimo, **senza** estrazione.
4. **`matchesById` corrente**: confermi la rimozione del confronto ID-vs-nome (privo di senso)?

---

## File letti/analizzati

- `frontend/src/jjtl/components/ExecuteTransformationDialog.tsx` (intero)
- `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` (props L28-97; mount dialog L880-903; run path L268-354)
- `frontend/src/components/abstract/DockManager.tsx` (`openTransformation` L230-324)
- `frontend/src/components/project/ProjectEditor.tsx` (hydrate/sync L163-182; megamodel L400-460; handleCreateTransformation/handleOpenTransformation/availableModels L1085-1214; run path L1259-1333 + L1780-1890; NewTransformationDialog mount L2702-2714)
- `frontend/src/jjtl/types/transformation.ts` (intero)
- `frontend/src/jjtl/utils/metamodelConverter.ts` (`findMetamodelById` L243-246)
- `frontend/src/model/conformance/useConformance.ts` (intero)
- `frontend/src/model/conformance/ConformanceValidator.ts` (intero)
- `frontend/src/model/megamodelInference.ts` (L8-51, L126-127, via grep)
- grep globali: mount points, threading `sourceMetamodelName`/`sourceMetamodelId`/`availableModels`, callers `openTransformation`/`handleExecuteTransformation`, test coverage, fixtures.

---

## HARD STOP

Report salvato. **Non si procede alla Fase 2** senza go-ahead esplicito in chat.
