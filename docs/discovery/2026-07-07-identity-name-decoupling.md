# Discovery — Decoupling identità/name per le istanze M1 (JjScript) — Fase 1 (read-only)

**Data**: 2026-07-07
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery, read-only. **Nessun file sorgente modificato.** Solo analisi + proposta di design.
**Correlata**: `docs/discovery/2026-07-06-jjscript-executor-timing.md` (timing executor), Fase 2a (waiter M1, in attesa di gate visivo).

> HARD STOP rispettato: questo documento chiude la Fase 1. Nessuna implementazione, nessun
> refactoring. La Fase 2 parte solo dopo review in chat e go-ahead esplicito. Se l'opzione
> scelta toccasse `useJjomSync.ts` o la persistenza, servirà un Layer Impact Report.

---

## 0. Executive summary

L'handle con cui uno script JjScript indirizza un'istanza M1 **coincide oggi con l'attributo
di dominio `name`** (`findInstanceByName` matcha `o.name`). Questo produce tre difetti,
tutti confermati sul codice:

1. **`set x.name` re-keya l'istanza**: dopo aver scritto `name`, i comandi successivi che
   la indirizzano con l'handle originale falliscono con "Element not found".
2. **Il re-key è asincrono e non deterministico**: la distanza tra il rename e il primo
   fallimento varia (comando successivo … 188 comandi dopo). **Root cause identificata**:
   non è cache — è il commit dello store, differito a un `setTimeout(0)` (macrotask), che
   corre in gara col loop dei comandi (che risolve su microtask). §3.
3. **Nomi di dominio duplicati inesprimibili**: se identità = `name`, quattro Port tutte
   `name="clk"` collassano su una sola raggiungibile via lookup.

**Fatto abilitante (verificato di persona)**: l'`id` di un `DObject` è **stabile e immutabile
dalla creazione** (`Constructors.makeID`, contatore monotòno + timestamp) e risolvibile
immediatamente via `LPointerTargetable.fromPointer` — anche prima del commit nello store —
grazie a `pendingCreation`. Non c'è alcun remap di id. §1-Q2.

**Raccomandazione**: **Opzione A — registry di handle locale all'executor** (`handle → id`
catturato alla `create instance`, risoluzione per id con fallback per nome). Elimina tutti e
tre i difetti, non tocca il modello di identità del runtime, non tocca alcuna zona critica,
non rompe reference/persistenza (che sono già id-based). Diff piccola e confinata a
`jjscript/executor/`. L'Opzione B (identità di prima classe runtime-wide) resta come
evoluzione concettuale, fuori scope. §4-§5.

---

## 1. Risposte alle domande Step 1 (file:line)

### Q1 — Chiave di lookup: su cosa matcha `findInstanceByName`?

`jjscript/executor/commands/instance.ts:101-104`:
```ts
export function findInstanceByName(model: LModel, instanceName: string): any | null {
    const objects = (model as any).objects ?? [];
    return objects.find((o: any) => o?.name === instanceName) ?? null;
}
```
Matcha sul getter L-proxy `o.name`. Per un'istanza (`LObject`), `get_name`
(`model/logicWrapper/LModelElement.tsx:5804-5806`) risolve **in quest'ordine**:
```ts
protected get_name(context: Context): this['name'] {
    return (context.proxyObject as GObject)['$name']?.value || context.data.name || context.proxyObject.instanceof?.name;
}
```
1. `$name.value` — il valore dello **slot identità** `name:EString` (un DValue figlio), se
   presente e non vuoto;
2. `context.data.name` — il campo D-layer;
3. `instanceof.name` — il nome della metaclasse (ultimo fallback).

Quando lo slot `name:EString` è vuoto, il suo getter fa a sua volta fallback su
`owner.initialName || owner.name` (`LModelElement.tsx:7315-7330`). Quindi la chiave di lookup
è un **valore composito** dominato dallo slot identità quando la metaclasse ha un attributo
`name:EString` (caso tipico dei Port hardware).

`model.objects` non è una struttura indicizzata: è un **array ricalcolato ad ogni accesso**
(§3), e la lookup è una `find` lineare su `o.name`.

### Q2 — Creazione: dove finisce il nome quotato, e l'id è stabile?

`create instance of C "x"` → `executeCreateInstance` (`instance.ts:154-276`) →
`(DObject as any).new(metaclass.id, targetModel.id, DModel, instanceName, true)`.

- `DObject.new` (`LModelElement.tsx:5734-5744`) passa `name` a `Constructors.DNamedElement(name)`
  (`joiner/classes.ts:849-852`), che scrive **`data.name` diretto**. **Non** crea alcuno slot
  `name:EString`: quello nasce dalla macchina di conformità come DValue separato.
- `initialName` è impostato a parte e vale **sempre il default calcolato**
  (`ret.initialName = computedDefaultName`, `LModelElement.tsx:5741`) — **non** il nome quotato.
  Per questo l'executor lo sovrascrive esplicitamente quando c'è un nome quotato
  (`instance.ts:242-244`: `(dObject as any).initialName = explicitInstanceName`), per non farsi
  ombreggiare dal fallback initialName-first dello slot vuoto.
- **Id stabile (fatto load-bearing, verificato di persona)**: l'id è generato **subito e in modo
  sincrono** dentro il costruttore `Constructors` (`classes.ts:567-573` →
  `setID` `:590-592` → `makeID` `:587-588`):
  ```ts
  static makeID(): Pointer { return "Pointer" + new Date().getTime() + "_" + (...) + "_" + (DPointerTargetable.maxID++); }
  ```
  È un id **unico e definitivo** (timestamp + contatore monotòno `maxID`, mai resettato,
  `classes.ts:1387`), **non** un placeholder. Registrato all'istante in
  `pendingCreation[t.id]` (`classes.ts:573`). `CreateElementAction` scrive lo store al path
  `idlookup.<id>` **con lo stesso id** (`redux/action/action.ts:743-744`,
  `redux/reducer/reducer.ts:449-451`) — **nessun remap**.
- **Chiarimento a CLAUDE.md §9.1**: la frase "DObject.new() returns temporary IDs … not
  accessible via `store.getState()[dObject.id]`" è **fuorviante sul codice attuale**. L'id è
  reale e definitivo; ciò che è differito è la **presenza dell'oggetto nell'`idlookup`
  committato**, colmata nel frattempo dal ponte `idlookup.__proto__ = pendingCreation`
  (`reducer.ts:641`) su cui `fromPointer` fa fallback (`classes.ts:1495-1496`). Il caveat
  reale è §9.2 (disponibilità differita del proxy dopo la TRANSACTION), non un id temporaneo.

  **Conseguenza per il design**: un id catturato alla `create instance` è valido per tutta la
  durata dello script e risolvibile subito con `LPointerTargetable.fromPointer(id)` (via
  `pendingCreation` prima del commit, via `idlookup` dopo). Il remap **non avviene** mid-script.

### Q3 — Mutazione di `name`: percorso e origine della race → §3 (sezione dedicata).

In breve: `set x.name` (ramo attribute di `executeSetInstance`, `instance.ts:510-521`) fa
`lObject['$name'].value = "clk"`. Questo, in `setValueAtPosition` (`LModelElement.tsx:7519-7522`),
emette **due** azioni: `values.0` sullo slot `$name` **e** un `SetFieldAction` diretto su
`father.name` (il DObject). Dopo il commit, sia `$name.value` sia `data.name` valgono "clk" →
`get_name` ritorna "clk" → `findInstanceByName("uart_clk")` fallisce. `initialName` **non**
viene toccato.

### Q4 — `rename instance` vs `set x.name`

`executeRenameInstance` (`instance.ts:399-406`) dentro TRANSACTION:
```ts
SetFieldAction.new(lObject, 'name', args.newName);
SetFieldAction.new(lObject, 'initialName', args.newName);
```
Scrive **direttamente** `data.name` **e** `data.initialName` (li tiene allineati), senza passare
per lo slot `$name`. Differenze da `set x.name`:
- `rename` = un'azione atomica su `data.name` + allineamento `initialName`; `get_name` risolve
  via `data.name` e via fallback initialName (coerenti).
- `set x.name` = scrittura slot `$name` + azione secondaria condizionata su `father.name`,
  con `initialName` lasciato stale.
- **Ma sul timing del commit sono uguali**: entrambe passano per lo stesso `setTimeout(0)`
  (§3). `rename` è più "atomico" ma **non** sincrono. Inoltre `rename` ha un guard di conflitto
  nomi (`instance.ts:387-395`, `NAME_CONFLICT`) che `set x.name` non ha.

### Q5 — Nomi duplicati: cosa succede oggi?

- **Creazione con nome auto** (`create instance of C`, senza virgolette): `generateInstanceName`
  (`instance.ts:110-119`) deduplica (`C`, `C2`, `C3`…) → nomi sempre unici. Anche
  `DPointerTargetable.defaultname` (`classes.ts:1431-1450`) deduplica contro `childNames`.
- **Creazione con nome quotato duplicato** (`create instance of Port "clk"` ×4): **nessun
  controllo** lo blocca in creazione — `DNamedElement` scrive `data.name="clk"` e basta. Le
  quattro istanze coesistono in `model.objects`, ma `findInstanceByName("clk")` ritorna
  **solo la prima** (`.find` → first match). Le altre tre sono **non indirizzabili per nome**.
- **`set x.name="clk"` su più istanze**: il percorso slot dell'executor **bypassa** il guard di
  unicità di `LObject.set_name` (che invece è Direction A, L-layer; §Q6), quindi i duplicati via
  executor **non vengono bloccati** — ma restano non indirizzabili (stesso problema di lookup).
- **UI**: `UniquenessProblemSync` (`components/editor-v2/problems/UniquenessProblemSync.tsx:62`)
  mostra un **badge soft** di nome duplicato; `LObject.set_name` (L-layer, `LModelElement.tsx:6070`)
  fa **hard-block** con toast su rename in collisione. Questi due sono ortogonali all'executor.

### Q6 — Persistenza e altri consumer per nome

- **Reference tra istanze: sempre per id.** Executor (`instance.ts:629`
  `refProxy.values = [...meaningful, targetInstance.id]`), canvas
  (`canvasToJjom.ts:1399`, `:1467`), JjEL (risoluzione via `instanceById`, `eval.ts:155-158`,
  `:602-618`). L'**unico** passo per nome è il comando umano `set x.ref = "Y"`, che risolve il
  nome → `.id` a write-time.
- **Persistenza/export: per id.** XMI usa `xmiIdMap` keyed su `DObject.id`
  (`services/export/XMIService.ts:141-144`, `:275`, `:299/340`, import `:1065-1102`); gli xmi:id
  **non** derivano dai nomi. `EcoreService` è M2-only. Niente di persistito dipende
  dall'unicità del nome istanza.
- **`VersionFixer`**: `2.217 -> 2.218` (`redux/VersionFixer.tsx:800-831`) semina
  `initialName` da `data.name` o sintetizza `<Metaclass>_<idSuffix>` — **identificatore
  id-stabile di fallback** (conferma che `initialName` è progettato come handle stabile
  disaccoppiato dal `name`). `2.205 -> 2.206` (`:517-519`) storicamente lega il valore dello
  slot `name` a `DObject.name`.
- **JjEL bind per nome**: `eval.ts` lega le istanze in scope per nome (Stage 2, `:321-341` bare,
  `:215-226` qualificato `Class.Name`), **ma gestisce già l'ambiguità**: nomi duplicati non
  vengono legati come variabile bare; l'evaluator emette il warning "usa la forma qualificata"
  (`jjel/evaluator/evaluator.ts:228-238`, `AMBIGUOUS_INSTANCES_KEY`). Nota: `modelContext.ts:19-22`
  **sovrascrive** l'entry di contesto `name` con il valore dell'attributo di metamodello `name`
  (conflazione identità/attributo, da tenere presente).
- **Altri per-id (non per nome)**: `ConformanceGuard.ts:201/211` (`objects.find(o=>o.id===…)`);
  sync canvas M1 tutto id-based (`useM1ReferenceEdges.ts:77-79/142-149`).
- **Assunzioni di unicità nome**: `model/logicWrapper/nameUniqueness.ts`
  (`validateNameUniqueness` `:79-88`, `detectDuplicateNames` `:98-110`), `LObject.set_name`
  `:6070`, `set_father` `:6131`, `UniquenessProblemSync.tsx`, `generateInstanceName`,
  rename `NAME_CONFLICT`.

---

## 2. Sintesi del modello di identità attuale

| Concetto | Dove vive | Ruolo | Stabile? |
|---|---|---|---|
| `DObject.id` | `classes.ts:587-592` (makeID) | identità **reale** del runtime; chiave di `idlookup`, dei reference, dell'export | **Sì, immutabile** |
| `data.name` | `DNamedElement` `classes.ts:849` | attributo di dominio + **handle di lookup dell'executor** (difetto) | No — mutabile via `set/rename` |
| slot `$name` (`name:EString`) | DValue figlio | valore identità che **ombreggia** `data.name` in `get_name` | No — mutabile |
| `initialName` | `LModelElement.tsx:5727` | **fallback display id-stabile**, immutabile via API normale | **Sì** (per design) |

L'identità **reale** del runtime è già `id` (stabile). Il problema è **solo** nello strato di
lookup dell'executor, che usa `name` come handle. Decouplare l'handle dall'attributo `name`
è quindi un intervento **locale all'executor**, non un cambio del modello di identità.

---

## 3. Meccanismo della race (documentato)

**Non è caching.** `LModel.get_objects` (`LModelElement.tsx:5404-5408`) **ricalcola l'array a
ogni accesso** via `LPointerTargetable.from(pointer)` → `wrap` → `store.getState().idlookup[ptr]`
(`classes.ts:1526-1528`), costruendo un Proxy nuovo ogni volta. Nessun memo, nessun
`_derived` su questo path. Quindi `o.name` riflette **istantaneamente** lo store **committato**.

**È il commit a essere differito.** Dentro una `TRANSACTION`, `Action.fire`
(`redux/action/action.ts:319-357`) **accumula** le azioni in `t.pendingActions`; a `FINAL_END`
vengono flushate come un unico `CompositeAction` la cui `fire()` prende il ramo asincrono
`setTimeout(() => store.dispatch(...), 0)` (`action.ts:349`, flush `:153-181`). In più, la
scorciatoia ottimistica in-memory è **disattivata**: `U.liveStateChanges = false`
(`common/U.tsx:177`) → i `livePatches` sincroni (`action.ts:326-328`) e il refresh del
`LogicContext` da livePatches (`proxy.ts:58-63`) **non girano**. Quindi `context.data` riflette
**sempre** lo store committato, aggiornato solo quando il macrotask `setTimeout(0)` drena.

**La gara**: i comandi dell'executor sono `async` e la loro `TRANSACTION` risolve sulla coda
**microtask**, **prima** che scattino i timer. Finché la coda timer non drena,
`idlookup[uart_clk_id].name` è ancora `"uart_clk"` e `findInstanceByName("uart_clk")`
continua a riuscire. Quando i `setTimeout(0)` accodati partono (tipicamente al primo yield al
timer phase — es. lo `sleep(BATCH_DELAY_MS=20)` del loop UI in `ScriptBlock`), `name` diventa
`"clk"` e la lookup fallisce. **La distanza variabile (1 … 188 comandi) è esattamente il
momento in cui l'event loop cede ai timer accodati rispetto al loop microtask dei comandi** —
da cui il non determinismo osservato.

Corollario: qualunque fix basato su `name`/timing (attese, flush) sarebbe fragile. Solo
disaccoppiare l'handle dal `name` elimina la classe di bug.

---

## 4. Proposta di design — Opzione A (raccomandata) vs Opzione B

### Opzione A — Registry di handle locale all'executor  ✅ raccomandata

**Idea**: alla `create instance of C "x"`, l'executor cattura l'id già disponibile
(`dObject.id`, che oggi ritorna già in `affectedElements`, `instance.ts:265`) e registra
`handle "x" → id` in una mappa di sessione dello script (sul contesto dell'executor, che è un
singleton per `(project, model, level)` e sopravvive all'intero batch). Tutti i comandi
successivi (`set`/`delete`/`rename`, e il **target di reference** `set x.ref = "Y"`) risolvono
**prima** nel registry per id (`LPointerTargetable.fromPointer(id)`), con **fallback** a
`findInstanceByName` per le istanze preesistenti allo script (caricate da file).

**Effetti:**
- `set x.name` diventa **innocuo**: l'handle "x" resta legato all'id; il `name` è libero.
- **Nomi duplicati esprimibili e indirizzabili**: quattro `create … "clk_a".."clk_d"` +
  `set clk_i.name = "clk"` → quattro istanze `name="clk"`, ciascuna indirizzabile via handle.
- **Race eliminata**: la risoluzione per id via `fromPointer` è **sempre** immediata (via
  `pendingCreation` prima del commit, `idlookup` dopo) — indipendente dal `setTimeout(0)`.
- **Bonus timing**: per le istanze create nello script, il waiter M1 (Fase 2a) diventa
  superfluo (id sempre risolvibile) → 0 attesa garantita anche senza polling.

**Invasività**: bassa, confinata a `jjscript/executor/`. Nessuna zona critica. Il modello di
identità del runtime resta **invariato**. Reference/persistenza/JjEL id-based non toccati.

**Validazione del punto critico (id stabili)**: ✅ risolta in §1-Q2 — l'id è immutabile e
risolvibile mid-script via `pendingCreation`. Il registry NON deve agganciare alcun remap
(non esiste). Va solo popolato con `dObject.id` alla create.

**Rischi e mitigazioni**:
1. *Handle duplicati nello script* (`create … "clk"` due volte con lo stesso handle):
   il registry `handle→id` verrebbe sovrascritto (second wins). Mitigazione: gli script
   generati devono usare handle unici (es. `clk_a`, `clk_b`); opzionale `console.warn` alla
   ri-registrazione di un handle. **Il requisito di dominio è "nomi duplicati", non "handle
   duplicati"**: i quattro Port hanno handle unici e `name="clk"`.
2. *Target di reference per nome* (`set x.ref = "Y"`): con nomi duplicati, risolvere `Y` per
   nome è ambiguo. **Il fix deve risolvere anche `Y` via registry** (handle → id), non per
   `name`. Incluso nel design.
3. *Istanze preesistenti* (non create dallo script): non nel registry → fallback
   `findInstanceByName`. Se il modello caricato ha già nomi duplicati, vince il primo (come
   oggi). Accettabile e invariato.
4. *JjEL bare-name ambiguo* con nomi duplicati: **già gestito** da JjEL (forma qualificata /
   warning ambiguità). Nessuna regressione; solo semantica già prevista.

**Fuori scope A** (restano invariati, eventuale Opzione B/policy): il hard-block di unicità di
`LObject.set_name` (L-layer, canvas rename), il badge soft `UniquenessProblemSync`, la
conflazione identità/attributo in `modelContext.ts`. Se il dominio vuole nomi duplicati
**senza** badge/blocco, è una decisione di policy separata (rilassare il validatore per le
istanze), non necessaria per rendere gli script corretti.

### Opzione B — Decoupling runtime-wide (identità = label/id di prima classe)

Label/id di istanza come identità di prima classe nel modello; lookup per label; `name`
attributo qualunque, duplicabile senza vincoli. Concettualmente più pulita, ma tocca **modello,
sync (`useJjomSync`), persistenza, VersionFixer (coevoluzione dei progetti salvati) e UI**
(problemi/badge, `set_name`). Richiede **Layer Impact Report completo** e una migrazione.
Sproporzionata rispetto al difetto osservato, che è **interamente nello strato di lookup
dell'executor**. Da considerare come evoluzione futura, **non** come fix.

### Confronto sintetico

| Criterio | A (registry executor) | B (runtime-wide) |
|---|---|---|
| File toccati | solo `jjscript/executor/` (+ test) | modello, sync, persistenza, VersionFixer, UI |
| Zona critica | nessuna | `useJjomSync`, persistenza → LIR |
| Risolve `set x.name` | sì | sì |
| Risolve nomi duplicati (script) | sì (indirizzabili via handle) | sì (nativamente) |
| Elimina la race | sì (risoluzione per id) | sì |
| Coevoluzione progetti salvati | non necessaria | necessaria |
| Rischio regressioni | basso, confinato | alto, trasversale |
| Diff stimata | ~40-60 righe + ~100 di test | grande, multi-strato |

---

## 5. Piano Fase 2 per l'Opzione A (da NON implementare ora)

**File da toccare (tutti fuori zona critica):**
1. `jjscript/executor/types.ts` — aggiungere a `ExecutionContext` un campo opzionale
   `instanceHandles?: Map<string, Pointer>` (~1 riga).
2. `jjscript/executor/executor.ts` — inizializzare `instanceHandles: new Map()` nel costruttore
   del contesto (~1 riga). ⚠️ questo file contiene la strumentazione `TEMP-DISCOVERY`: in Fase 2
   la strumentazione andrà rimossa **prima** di committare; l'unica riga vera è l'init.
3. `jjscript/executor/commands/instance.ts`:
   - `executeCreateInstance`: dopo la create, `context.instanceHandles?.set(handle, dObject.id)`
     (handle = `explicitInstanceName ?? instanceName` = il nome di creazione). ~2 righe.
   - Nuovo helper `resolveInstanceHandle(context, model, name)`: prova registry
     (`fromPointer(id)`, verifica che l'oggetto esista/appartenga al modello) poi fallback
     `findInstanceByName`. ~10 righe.
   - Sostituire le 4-5 chiamate `findInstanceByName(targetModel, …)` in
     `executeSetInstance`/`executeDeleteInstance`/`executeRenameInstance` **e il target di
     reference** (`instance.ts:601`) con `resolveInstanceHandle`. ~5 siti.
4. `jjscript/executor/elementWaiter.ts` (opzionale, coordinamento con Fase 2a): per M1, se
   l'handle è nel registry, considerarlo risolto via id (attesa 0 garantita). Altrimenti resta
   il comportamento Fase 2a. ~5 righe.
5. **Test** — nuovo file `jjscript/__tests__/instanceHandles.test.ts` (o estensione), stile
   dei test esistenti (mock di joiner/utils come `elementWaiter.test.ts`):
   - **Regression del bug osservato**: `create "x"; set x.name="y"; set x.dir=...` → tutti
     risolvono, nessun "not found" (oggi fallisce).
   - **Nomi duplicati (requisito di dominio)**: `create "a" Port; set a.name="clk";
     create "b" Port; set b.name="clk"; set a.dir=in; set b.dir=out` → entrambe indirizzabili,
     entrambe `name="clk"` (oggi la seconda è irraggiungibile).
   - **Fallback preesistenti**: istanza non creata dallo script risolvibile per nome.
   - **Reference con handle**: `set a.ref = "b"` risolve `b` via handle anche con nomi duplicati.

**Diff stimata**: ~40-60 righe sorgente + ~100 di test. Piccola, atomica, un solo commit
tematico.

**Fuori scope Fase 2 (A)**: `set_name` L-layer, `UniquenessProblemSync`, JjEL, canvas, modello,
persistenza. Nessun `useJjomSync`/`portDistribution`/VersionFixer toccato → **nessun Layer
Impact Report richiesto** per l'Opzione A.

---

## 6. Rischi residui / questioni aperte per la review

- **Id temporanei**: ✅ non è un rischio — id stabili (§1-Q2), nessun remap. Il registry
  cattura `dObject.id` che è già l'id definitivo.
- **Contratto generatore**: gli script generati (Jodie) devono emettere **handle unici** e
  usare `set x.name` per i nomi di dominio (anche duplicati). Da coordinare col prompt di
  generazione (il divieto attuale di `set x.name` diventa superfluo dopo A).
- **Policy nomi duplicati nella UI**: dopo A gli script sono corretti, ma il badge soft di
  duplicato (`UniquenessProblemSync`) e l'hard-block di `set_name` restano. Decidere in chat se
  il dominio hardware richiede di rilassarli per le istanze (cambio di policy separato).
- **Conflazione identità/attributo in JjEL** (`modelContext.ts:19-22`): con nomi duplicati che
  diventano comuni, verificare in Fase 2b che i binding JjEL restino coerenti (già gestiti come
  ambigui, ma vale un test mirato).

---

## 7. Hard stop

Fine Fase 1. Nessuna implementazione. La Fase 2 (Opzione A) parte solo dopo review del report
in chat e go-ahead esplicito di Alfonso.
