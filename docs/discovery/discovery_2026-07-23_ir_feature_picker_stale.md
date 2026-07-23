# Discovery — feature-picker IR mostra feature stale/parziali

**Tipo**: discovery read-only (two-phase, Fase 1). Nessuna modifica al codice sorgente.
**Branch**: `alfonso-frontend-jjtl` (working tree locale — authoring IR non pushato).
**Data**: 2026-07-23
**Scope**: capire perché il dropdown "Select feature..." del pannello di authoring IR elenca una lista stale/parziale invece delle feature live della classe M2 target. Trovare la fonte esatta e il punto di divergenza. **Non correggere.**

---

## 1. Sintomo (dogfooding, verificato in UI da Alfonso)

- Metamodello state-machine. Classe `State`:
  - eredita `name : EString` da `NamedElement`;
  - attributi diretti: `isFinal : EBool`, `isInitial : EBool`, `attr_0 : EString`, `attr_1 : EInt`.
- Le istanze M1 di `State` mostrano tutte le feature correttamente → M2 e M1 sani.
- Il dropdown "Select feature..." del tab IR mostra **solo** `name` + `isInitial`. Mancano `isFinal`, `attr_0`, `attr_1`.
- Taglio **temporale**: le feature presenti al momento dell'enable IR compaiono; quelle aggiunte alla classe **dopo** l'enable no.
- Escluso il filtro per tipo (mostra sia EString che EBool, ne nasconde sia EString che EBool).

---

## 2. File letti / analizzati

| File | Ruolo nel bug | Righe chiave |
|------|---------------|--------------|
| `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` | Rende il `<Select>` "Select feature..."; **stateless/decoupled**, elenca esattamente ciò che riceve in `props.features`. | 12-25 (props), 44-78 (build opzioni), 114 (placeholder) |
| `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | **Origine unica** dell'oggetto `features` passato a tutti gli editor figli. | **84-106** (memo `features`), 106 (dep array), 46 (seed draft), 55-60 (re-seed su `view.id`) |
| `frontend/src/components/editor-v2/hooks/useEditorMode.ts` | `getMetaclassInfo` / `resolveM1Info`: enumerazione feature della classe M2. **Live** su `store.getState()`, nessuna cache. | 218-220, 229-320 (walk live), 359-404 (attributes/allAttributes/references), 43-56 (tipo `MetaclassInfo`) |
| `frontend/src/components/editors/views/ViewData.tsx` | Monta il tab IR; sceglie `VertexAuthoringPanel` vs `EnableIRPanel` in base a `view.ir?.kind`. | 52-53, 76-86, 178 (`activeDescriptor.render()`) |
| `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` | Seed di `view.ir` all'enable. Scrive **solo** `metaclasses` (nomi classe), nessuna feature. | 28-40 (resolveMetaclassNames), 54-66 (seed) |
| `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` | `defaultObjectViewIR()`: struttura del seed. | 25-48 |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | Schema IR: `metaclasses: string[] \| '*'`. Nessun campo che enumeri le feature. | 96, 116, 158, 78 (`source: {from:'attributes'}`) |
| `frontend/src/model/logicWrapper/LModelElement.tsx` | `get_allAttributes` = own + inherited (live). | 2991-2999 |
| `frontend/src/components/editors/Info.tsx` | Percorso "buono": legge `c.allAttributes`/`c.allReferences` **live** al render. | 1114-1119 |

Consumer di `features` (tutti a valle dello stesso memo, via prop drilling): `LabelListEditor.tsx`, `LabelEntryEditor.tsx`, `FieldCompartmentListEditor.tsx`, `BadgeListEditor.tsx`, `TextSourceEditor.tsx`, `MatchingSection.tsx`, `ConditionalEditor.tsx`, `PredicateBuilder.tsx` → `PathBuilder.tsx`. Nessuno di questi calcola le feature: le ricevono tutte dal memo di `VertexAuthoringPanel`.

---

## 3. Findings — la catena

### 3.1 `PathBuilder` è innocente (stateless)

`PathBuilder.tsx:44-78` costruisce le `options` del `<Select>` iterando **esattamente** `features.attributes` e `features.references` ricevute in prop (`PathBuilderFeatures | null`, righe 12-15). Non legge redux, non legge il `.ir`, non memoizza. Se la lista è stale, lo è la prop in ingresso. Stesso discorso per `PredicateBuilder`/`ConditionalEditor`: sono tramiti di prop.

### 3.2 La fonte esatta della lista: il `useMemo` di `VertexAuthoringPanel`

`VertexAuthoringPanel.tsx:84-106`:

```typescript
const features = useMemo<PathBuilderFeatures | null>(() => {
    const mcs = draft.metaclasses;
    if (mcs === '*' || !Array.isArray(mcs) || mcs.length === 0) return null;
    const targetName = mcs[0];
    const metamodels = LProject.getProject()?.metamodels ?? [];
    for (const mm of metamodels) {
        let info;
        try { info = getMetaclassInfo((mm as any).id, (mm as any).id); } catch { continue; }
        const target = info.allClasses.find((c) => c.name === targetName);
        if (target) {
            return {
                attributes: (target.allAttributes ?? target.attributes ?? []).map(...),
                references: (target.references ?? []).map(...),
            };
        }
    }
    return null;
}, [JSON.stringify(draft.metaclasses)]);   // ← dependency array
```

Due fatti che, combinati, producono il bug:

1. **La fonte dei dati è live**: `getMetaclassInfo` (`useEditorMode.ts:218`) → `resolveM1Info` ricostruisce la lista classi **da `store.getState()` ad ogni chiamata, senza cache** (`useEditorMode.ts:229-346`). `target.allAttributes` è `get_allAttributes` = own + inherited, calcolato live sul L-proxy (`LModelElement.tsx:2991-2993`). Quindi *quando il memo gira*, legge lo stato corrente e reale della classe.

2. **Il memo gira quasi mai**: la dependency è `[JSON.stringify(draft.metaclasses)]`, cioè **il/i nome/i della classe target**. Aggiungere `isFinal`/`attr_0`/`attr_1` alla classe M2 **non cambia** `draft.metaclasses` (`['State']` resta `['State']`). Il memo non si ri-esegue → restituisce lo **snapshot congelato** dell'ultima esecuzione.

Risultato: la lista è uno snapshot vivo ma **congelato all'istante in cui il memo ha girato l'ultima volta** — tipicamente il **mount** del pannello, subito dopo l'enable IR. Le feature esistenti allora (`name` ereditata + `isInitial` diretta) restano; quelle aggiunte dopo non entrano mai. Questo è esattamente il "taglio temporale" osservato.

### 3.3 Quando il memo si ri-esegue (comportamento di refresh)

`useMemo` ricomputa solo se (a) il componente monta ex-novo, o (b) `JSON.stringify(draft.metaclasses)` cambia. `VertexAuthoringPanel` **non** usa `useSelector`: pur ri-renderizzando quando `ViewData` (connesso) si aggiorna, il memo resta congelato perché la dep non cambia. Il re-seed del draft su `view.id` (`VertexAuthoringPanel.tsx:55-60`) non aiuta: `view.id` è invariato durante l'edit del metamodello, e comunque re-seedare `draft` da `view.ir` non cambia `draft.metaclasses`.

`ViewData.tsx:178` monta il contenuto del tab via `activeDescriptor.render()`: cambiare tab (IR → Style → IR) **smonta e rimonta** `VertexAuthoringPanel`, così come riselezionare la view. Poiché `getMetaclassInfo` è live, **un remount fa ripartire il memo e recupererebbe le feature nuove**. → Vedi Domanda aperta A: è la verifica che conferma "memo congelato" contro "snapshot persistito".

### 3.4 Refutazione dell'ipotesi di lavoro (il picker NON legge dal `.ir`)

L'ipotesi del prompt — "il picker enumera le feature dal documento `.ir` (seed di `defaultObjectViewIR()` o binding esistenti)" — è **smentita dal codice**:

- Lo schema IR non ha alcun campo che enumeri feature: `irTypes.ts:96` → `metaclasses: string[] | '*'` (solo nomi classe). I compartment usano **direttive astratte** (`source: { from: 'attributes' }`, `irTypes.ts:78`), risolte a render-time, non un elenco materializzato.
- `defaultObjectViewIR()` (`irDefaults.ts:25-48`) seeda `metaclasses`, `labels` con source `intrinsic`/path, e un compartment `from:'attributes'`. Nessuna lista di feature.
- `EnableIRPanel` (`EnableIRPanel.tsx:28-66`) risolve `appliableToClasses` a **nomi di metaclasse** e li scrive in `ir.metaclasses`. Non tocca le feature.

Quindi il `.ir` cattura all'enable **solo il nome classe** — che è però proprio la chiave del memo. Il `.ir` non contiene la lista; la lista arriva da `getMetaclassInfo` (live) ma **congelata dalla dep del memo**. L'ipotesi era vicina nell'effetto ("cattura all'enable"), sbagliata nel meccanismo (il congelamento è nel memo React, non nel documento persistito).

### 3.5 Confronto col percorso "buono"

Tutti i percorsi che mostrano le feature corrette leggono `allAttributes`/`allReferences`/`allFeatures` **live al momento dell'uso**, senza memo keyed sul nome classe:

- Pannello proprietà / metriche (`Info.tsx:1114-1119`): `c.allAttributes`, `c.allReferences` letti nel corpo del render.
- Getter L-layer (`LModelElement.tsx:2991-2999`): `get_allAttributes` = own ++ inherited, ricalcolato live.
- Le istanze M1 renderizzano gli slot per-istanza (che esistono per tutte le feature correnti della classe).

Il picker IR usa **la stessa sorgente** (`getMetaclassInfo` → `allAttributes`) ma la **cache-a** in un `useMemo` con dep insufficiente. Il delta tra buono e cattivo è **una sola cosa**: la dependency array. Non è una diversa utility di enumerazione, non è la gestione dell'ereditarietà, non è il `.ir`.

### 3.6 L'ereditarietà è gestita correttamente

`name` compare perché `target.allAttributes` (`useEditorMode.ts:378`) usa `get_allAttributes` = own + inherited: risolve la catena `State → NamedElement`. Anche `target.references` è popolato da `cls.allReferences ?? cls.references` (`useEditorMode.ts:392`, include ereditate). Quindi l'ereditarietà **non** è la causa: `name` appare non come caso speciale ma perché esisteva (ed è ereditata) all'istante dello snapshot. Il taglio è puramente temporale, ortogonale all'ereditarietà.

---

## 4. Risposte alle 5 domande

**1. Il picker legge dalla classe M2 live o dal `.ir`/seed?**
Dalla **classe M2 live** (`getMetaclassInfo` su `store.getState()`, no cache). Il `.ir` fornisce solo il **nome** della classe target (`draft.metaclasses[0]`), non le feature. L'ipotesi "legge dal seed" è smentita.

**2. La lista è persistita o runtime? Perché non si invalida?**
**Runtime**, calcolata in un `useMemo` (`VertexAuthoringPanel.tsx:84-106`). Non si invalida perché la dependency è `[JSON.stringify(draft.metaclasses)]` — solo il/i nome/i classe. Aggiungere una feature alla classe non cambia il nome, quindi il memo resta congelato allo snapshot dell'ultima esecuzione (mount post-enable). Un reload/remount la ricalcola (fonte live), non è nel `.ir` salvato.

**3. Come vengono trattate le feature ereditate (perché `name` compare)?**
Risolte correttamente e live: `target.allAttributes` = `get_allAttributes` = own ++ inherited (`LModelElement.tsx:2991`). `name` compare perché ereditata da `NamedElement` **ed** esistente all'istante dello snapshot. L'ereditarietà è integra; il problema è solo la freschezza dello snapshot.

**4. Bug puro o scelta di design?**
**Bug puro** (dependency array insufficiente del memo), non scelta di design. Nessun commento o struttura suggerisce l'intento di offrire "solo le feature già mappate": il memo tenta esplicitamente di leggere **tutte** le feature della classe live (`info.allClasses.find(...).allAttributes`). Il commento a `VertexAuthoringPanel.tsx:82-83` ("Source: LProject metamodels — same as InfoData") dichiara l'intento di rispecchiare InfoData (che è live); la memoizzazione tradisce quell'intento.

**5. Fix minimo ipotizzabile (NON implementato) e rischi.**
Far ri-eseguire il memo quando cambia il **set di feature** della classe target, non solo il nome. Opzioni, dalla più contenuta:
- (a) **Aggiungere alla dep una "feature signature" della classe target** derivata dallo store via `useSelector` (es. concatenazione di nomi/tipi/upperBound di `allAttributes`+`references`, o un contatore/hash leggero). Il memo ricomputa solo quando le feature cambiano davvero — niente costo per-render. Un pattern analogo esiste già in `useEditorMode.ts:205` (`metamodelClassSignature`).
- (b) In subordine, usare l'**hook** `useEditorMode` invece dell'accessor non-hook (già sottoscritto via `useSelector` a `metamodelClassSignature`), ma richiede un model/metamodel id nel contesto del pannello → più invasivo.

**File toccati dal fix (a)**: **solo** `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (memo + un `useSelector` per la signature). Nessun altro.

**Rischi**:
- **Fuori dalla critical-zone (§3.1)**: `VertexAuthoringPanel` non è nel set sync/D-L. Nessun `TRANSACTION`, `DVoidEdge`, `useJjomSync`, `VersionFixer`. → Layer Impact Report non richiesto.
- **Nessuna persistenza toccata**: il `.ir` non cambia formato → nessuna migrazione VersionFixer/jsxString (§3.9 non pertinente: questa è UI di authoring runtime, non default-view source).
- **Performance**: `getMetaclassInfo` è un walk completo del metamodello; va tenuto dietro alla signature così ricomputa solo al variare reale delle feature, non ad ogni store-change. Rischio basso se la signature è cheap.
- **Regressione possibile**: una signature troppo aggressiva farebbe ricomputare il memo (e re-renderizzare i figli) più spesso; una troppo lassa lascerebbe casi stale. Da validare con un trace end-to-end (aggiungi feature → il picker si aggiorna senza remount), non per sola ispezione del comparator (§5.1).

---

## 5. Domande aperte per Alfonso

**A. Repro del refresh su remount (diagnostico chiave).** Sul codice attuale, `getMetaclassInfo` è live e un remount di `VertexAuthoringPanel` dovrebbe ricalcolare le feature. Puoi confermare: dopo aver aggiunto `isFinal`/`attr_0`/`attr_1` alla classe, **cambiando tab (IR → Style → IR)** oppure **deselezionando/riselezionando la view**, il picker si popola con le feature nuove?
  - Se **sì** → confermato "memo congelato entro la sessione montata" (fix = dependency del memo). Il tuo workflow probabilmente teneva il pannello montato mentre editavi il metamodello.
  - Se **no** (resta stale anche dopo remount) → c'è una seconda cache a monte da cercare (contro quanto suggerisce il codice); da riprodurre sul codice attuale prima di ogni fix (§5.1: non fidarsi di fixture da memoria).

**B. `metaclasses[0]` vs multi-target.** Il memo usa solo `draft.metaclasses[0]` (`VertexAuthoringPanel.tsx:86-87`). Con una view applicata a più metaclassi, il picker offre le feature della **prima** soltanto. È il comportamento voluto per lo slice attuale, o va gestito il multi-target (intersezione/unione delle feature)? Fuori scope per il bug stale, ma emerso leggendo la fonte.

---

## 6. Conclusione

Fonte della lista: **un unico `useMemo` in `VertexAuthoringPanel.tsx:84-106`** con dependency `[JSON.stringify(draft.metaclasses)]`. La lista è **runtime e live nella fonte** (`getMetaclassInfo`, no cache) ma **congelata dalla dep insufficiente**: si aggiorna solo al variare del nome classe o al remount, mai all'aggiunta di feature alla classe. Il `.ir` non c'entra con l'enumerazione (contiene solo nomi classe). L'ereditarietà è corretta. È un **bug puro**, fuori critical-zone; fix minimo = rendere la dep sensibile alla feature-signature della classe target, in un solo file. **Hard stop: nessuna Fase 2 senza go-ahead.**
