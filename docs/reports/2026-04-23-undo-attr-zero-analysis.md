# Diagnostic — Bug storico "undo/attr_0" e cugini

**Data:** 2026-04-23
**Scope:** Solo analisi, zero modifiche a `frontend/src/`
**Riferimento stub:** `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts:63` — "DIAGNOSTIC: OrphanStore temporarily disabled to isolate undo/attr_0 bug"
**Commit stub:** `45a83df9a57da34e9182ba07c4e0400288e334f5` (2026-03-10)

---

## TL;DR

- **Il bug è riproducibile OGGI**, con `useOrphanFeatures` disabilitato.
- **Root cause: dual undo-system desincronizzato.** Editor-v2 ha un sistema di history proprio (RF snapshot su `useRef`), parallelo e **non collegato** al sistema undoable di Redux. Le edit via Info panel (dock destro) dispatchano SetFieldAction a Redux ma **non triggerano `takeSnapshot` di editor-v2**. `reconcileJjomAfterUndoRedo` al Ctrl+Z successivo ripristina il JjOM allo stato della snapshot RF più vecchia — che non include le edit Info-panel — sovrascrivendo le modifiche.
- Il bug `undo/attr_0` del commento stub e il bug **"attributi rinominati tornano ai nomi default"** sono **lo stesso bug**, vistoda angolazioni diverse. Sintomi osservabili divergono perché `attr_0` è il nome di default di `defaultname("attr_", father)`, e quindi è il valore a cui le rinomine "torna indietro" quando l'undo attraversa una snapshot pre-rename.
- L'implementazione precedente di `useOrphanFeatures` (mai committata) **aggravava il bug** ma non ne era la causa primaria. Il nome-based signature detection avrebbe interpretato ogni rename come delete+add, moltiplicando gli effetti collaterali a cascata.

**Raccomandazione:** il fix del bug undo dual-system va trattato come **prompt separato** PRIMA di riabilitare la co-evolution. Re-abilitare OrphanStore sopra un dual-undo rotto produce comportamenti non deterministici.

---

## A. Tentativi di riproduzione (statico, via tracing del codice)

Non posso eseguire il browser interattivamente. Ho tracciato le chiamate attraverso il codice per ricostruire la sequenza esatta di dispatch per ogni scenario. Dove possibile ho identificato il file:riga di ogni side-effect.

### A.1 — Scenario `attr_0` default naming

**Non riproducibile direttamente via questo scenario specifico** — la logica di `defaultname` (`joiner/classes.ts:1399-1418`) usa `U.increaseEndingNumber(startingPrefix + '0', ..., childrenNames.has)` e restituisce il primo nome libero. Se rinomini `attr_0 → name` e crei un nuovo attributo, ottieni un NUOVO `attr_0` perché il nome è libero. Non c'è counter monotonico — la naming è reattiva.

Tuttavia, questo scenario **crea le condizioni** per il bug vero in A.3.

### A.2 — Scenario rinomina pura, poi undo

**Due varianti divergenti a seconda del punto di entry del rename:**

**A.2a — Via inline editor in ClassNode** (`editor-v2/nodes/ClassNode.tsx:81`):
```
editorContext?.takeSnapshot();       // ← snapshot PRE-rename
setNodes(...)                         // aggiorna RF data
syncUpdateAttribute(attrId, 'name', value, id);   // dispatch SetFieldAction
```
Flow corretto: la snapshot cattura lo stato **prima** del rename. Ctrl+Z → `handleUndo` → pop snapshot → `reconcileJjomAfterUndoRedo` → rileva `dAttr.name (nuovo) !== rfAttr.name (vecchio)` → ripristina vecchio nome. **Funziona come atteso.**

**A.2b — Via Info panel nel dock destro** (`components/editors/Info.tsx`):
```
lAttr.name = newValue;   // L-proxy setter → SetFieldAction (Redux only)
```
Nessun `takeSnapshot()`. Nessun accesso a `editorContext`. La rename esiste **solo nell'undoable history di Redux**, non in quella di editor-v2.

Alla Ctrl+Z (bind a `handleUndo`, vedi `EditorV2.tsx:1850-1853`), il sistema editor-v2 non sa nulla della rename. Dipende da cosa c'è nella sua history.

### A.3 — Scenario create + rename + undo

**Riproducibile tramite questo percorso (tracing statico):**

| Step | Azione utente | takeSnapshot? | Stato RF post-azione | Stato JjOM post-azione | Past stack editor-v2 |
|------|---------------|---------------|----------------------|------------------------|----------------------|
| 0 | (starting state) | — | `C: {}` | `C: {}` | `[]` |
| 1 | Drag attr from palette to class C (`ClassNode.tsx:185`) | ✅ SÌ (pre-drag) | `C: {P_X: 'attr_0'}` (dopo useJjomSync rebuild) | `C: {P_X: 'attr_0'}` | `[snap_pre_A: C:{}]` |
| 2 | Rename via Info panel: `attr_0 → foo` | ❌ NO | `C: {P_X: 'foo'}` (dopo useJjomSync) | `C: {P_X: 'foo'}` | `[snap_pre_A]` |
| 3 | Drag/move class C (`EditorV2.tsx:1594` o simili) | ✅ SÌ (pre-drag) | `C: {P_X: 'foo'}`, new pos | `C: {P_X: 'foo'}` | `[snap_pre_A, snap_pre_move: C:{P_X:'foo'}]` |
| 4 | Ctrl+Z (handleUndo) | — | `C: {P_X: 'foo'}`, old pos | `C: {P_X: 'foo'}` | `[snap_pre_A]`, future: `[snap_pre_undo1]` |
| 5 | Ctrl+Z ancora | — | `C: {}` | `C: {}` (dopo reconcile) | `[]`, future: `[..., snap_pre_undo2]` |

Al passo 5, `reconcileJjomAfterUndoRedo` confronta RF snapshot `C: {}` con JjOM `C: {P_X: 'foo'}`. Trova `P_X` in JjOM ma non in RF → **delete** `P_X` via `DeleteElementAction.new(lAttr.__raw)` (`canvasToJjom.ts:1361-1381`). L'attributo e la sua rename svaniscono insieme.

**Effetto osservato dall'utente:** due undo → l'attributo che avevo rinominato `foo` è SPARITO.

Ora considera una variante con altra azione intermedia tra rename e step 3:

| Step | Azione | Past stack |
|------|--------|-----------|
| 1 | Drag attr (snapshot pre-drag) | `[snap_0: C:{}]` |
| 2 | Rename via Info panel | `[snap_0]` |
| 3 | **Inline-edit sullo stesso attributo** (snapshot pre-edit) | `[snap_0, snap_1: C:{P_X:'foo'}]` |
| 4 | Rename inline foo → bar | `C: {P_X: 'bar'}` |
| 5 | Ctrl+Z: pop snap_1 → reconcile → renames bar → foo | ✓ corretto, revert inline rename |
| 6 | Ctrl+Z: pop snap_0 → reconcile → DELETE P_X | attributo sparisce |

### A.4 — Scenario "rinominato torna ad attr_0" (il cugino vero)

**Questo è il sintomo del bug storico.** Riproducibile come segue:

| Step | Azione | takeSnapshot | RF after | JjOM after | Past |
|------|--------|--------------|----------|-----------|------|
| 1 | Crea attributo via inline drag in ClassNode | ✅ pre-create | `C: {P_X: 'attr_0'}` | `C: {P_X: 'attr_0'}` | `[snap_0: C:{}]` |
| 2 | **Inline-edit rename** via ClassNode (snapshot pre-edit) | ✅ pre-edit | `C: {P_X: 'foo'}` | `C: {P_X: 'foo'}` | `[snap_0, snap_1: C:{P_X:'attr_0'}]` |
| 3 | Qualche altra operazione RF (drag nodo, aggiunta altro attr, ecc.) | ✅ | `C: {P_X:'foo', ...}` | `C: {P_X:'foo', ...}` | `[snap_0, snap_1, snap_2]` |
| 4 | Ctrl+Z: pop snap_2 | — | (pre-step-3) | match → no change | `[snap_0, snap_1]` |
| 5 | Ctrl+Z: pop snap_1 = `C:{P_X:'attr_0'}` | — | `C:{P_X:'attr_0'}` | ⚠️ reconcile: `dAttr.name='foo' !== rfAttr.name='attr_0'` → **lAttr.name = 'attr_0'** | `[snap_0]` |

**Effetto osservato dall'utente al passo 5:** "Avevo rinominato l'attributo `foo`, e dopo due undo è TORNATO ad `attr_0` (nome di default)!".

Questo è esattamente `undo/attr_0`. Non c'è bisogno di Info panel — basta che l'inline-edit catturi una snapshot pre-rename. `attr_0` appare perché è la nome default con cui viene creato l'attributo originariamente.

**Stato Redux incoerente?** No, Redux resta coerente: la rename inline dispatcha SetFieldAction proprio, e quando reconcile ripristina il nome, dispatcha un'altra SetFieldAction. Stato sempre consistente ma **non è quello che l'utente si aspettava**.

**Console warnings?** Nessuno (reconcile ha `console.warn` solo su fallimenti tecnici, non su rename silenziose).

### A.5 — Scenario con istanze M1

Non ho tracciato uno scenario M1 completo, ma la logica è la stessa:
- Rinomina attributo → DValue.instanceof **non cambia** (punta sempre allo stesso DAttribute.id)
- ObjectNode legge `lookup[attrId].name` live → mostra il nuovo nome
- Undo ripristina il vecchio nome del DAttribute via reconcile
- ObjectNode continua a mostrare il nome live → torna al vecchio nome
- **DValues e loro valori restano intatti** in tutto questo

Nessun orphan di DValue in questo flusso perché l'identità del DAttribute (il suo ID) non cambia mai. L'interazione problematica è tutta a livello di NOME.

---

## B. Identificazione root cause

### B.1 — `defaultname` e naming reattivo

**File:** `joiner/classes.ts:1399-1418`

```ts
static defaultname<L extends LModelElement = LModelElement>(
    startingPrefix: string | ((meta:L)=>string),
    father?: ...
): string {
    ...
    const childrenNames: (string)[] = lfather.childNames;
    return U.increaseEndingNumber(startingPrefix + '0', false, false,
        (newname) => childrenNames.indexOf(newname) >= 0);
}
```

E `U.increaseEndingNumber` (`common/U.tsx:1485-1510`):
```ts
static increaseEndingNumber(s, ..., increaseWhile?) {
    if (increaseWhile && !increaseWhile(s)) return s;  // ← prima chance
    // altrimenti incrementa "attr_0" → "attr_1" → ... until free
}
```

**Conseguenze:**
- Primo attributo: `attr_0` (sempre libero)
- Secondo: `attr_1`, e così via
- Dopo rename di `attr_0 → foo`: il prossimo nuovo attributo prende `attr_0` (libero ora)
- **Naming NON monotonico.** Non c'è counter globale, non c'è memoria di nomi passati.

Questo è corretto di suo — è il framework che non ha bug qui. Ma crea la condizione perché `attr_0` sia un nome ricorrente, ri-assegnabile, e quindi un valore molto comune nelle snapshot pre-rename.

### B.2 — Percorso undo per rename attributo

Tre possibili entry point:

| Entry point | File:riga | takeSnapshot? | Dispatch Redux |
|------------|-----------|---------------|----------------|
| Inline edit (ClassNode) | `nodes/ClassNode.tsx:81` | ✅ SÌ, prima di setNodes+sync | SetFieldAction via `syncUpdateAttribute` |
| Info panel (dock) | `components/editors/Info.tsx` (molteplici punti) | ❌ NO | SetFieldAction via L-proxy setter `lAttr.name = ...` |
| PropertiesPanel (dead code) | `panels/PropertiesPanel.tsx:493` | ❌ NO | SetFieldAction via `syncUpdateAttribute` |

Redux ricorda il valore vecchio di `name` via state-delta (`reducer.ts:1179`: `Uobj.objectDelta(ret, oldState, true, false)`). Tecnicamente Redux **ha** un undo funzionante per rename, ma non è raggiungibile da `handleUndo` di editor-v2.

### B.3 — Collisione tra naming di default e snapshot undo

**Confermata.** Meccanismo preciso:

1. Crea attributo → name default `attr_0`
2. Una snapshot catturata in QUESTO momento contiene `{attr_0}`
3. Rinomina → name `foo`
4. Altra snapshot in questo momento (se presa) contiene `{foo}`
5. Ctrl+Z sovrascrive lo stato corrente con l'RF snapshot più vecchia
6. `reconcileJjomAfterUndoRedo` confronta JjOM ora (`foo`) con RF (`attr_0` nella snap vecchia) → ripristina `attr_0` in JjOM via `lAttr.name = rfAttr.name` (`canvasToJjom.ts:1389-1395`)

**Il mismatch tra attr_N default names e le rename assegna un valore "pseudo-default" visibilmente distinguibile (`attr_0` vs nomi utente) al momento del rollback.** Da qui il nome "`undo/attr_0` bug".

### B.4 — Interazione con `DStructuralFeature` e DValue

Quando reconcile ricrea un attributo (`canvasToJjom.ts:1350` → `lClass.addAttribute(rfAttr.name)`):
- Il nuovo DAttribute ha un **nuovo ID** (diverso da quello snapshottato in RF)
- `DStructuralFeature()` init hook (`joiner/classes.ts:703-743`) auto-crea nuovi DValue per le istanze esistenti, con `instanceof = newId` e `values = []`
- **I vecchi DValue con `instanceof = oldId`** restano orphan in idlookup (`oldId` è stato cancellato dal reconcile al passo precedente via `DeleteElementAction`)
- Per via di come `DeleteElementAction` funziona (bypass di `Dummy.get_delete` — vedi report precedente), i vecchi DValue restano zombie anche dopo delete dell'attributo originale

**Net effect:** undo che attraversa un rename via reconcile non solo perde il nome (bug visibile), ma può anche lasciare dietro DValue zombie (bug invisibile). I valori precedenti non sono recuperabili nemmeno con redo perché il nuovo DAttribute ha ID diverso. `idMap` in reconcile (`canvasToJjom.ts:1352`) rimappa gli attributi ID, ma **non le DValue** (non le conosce — le DValue vivono in DObject, non in ClassNodeData).

### B.5 — Due sistemi undo non collegati

Questo è il **cuore architetturale** del bug:

| Sistema | Cosa cattura | Trigger | Cosa ignora |
|---------|-------------|---------|-------------|
| **Redux state-delta history** (`reducer.ts:1179-1247`) | Ogni azione che modifica `idlookup` | Automatico su ogni SetFieldAction, CreateElementAction, DeleteElementAction | Position nodi RF, viewport |
| **Editor-v2 RF snapshot history** (`hooks/useHistory.ts`) | JSON-cloned snapshot di `getNodes()` e `getEdges()` | Esplicito, solo ove `editorContext?.takeSnapshot()` viene chiamato | Rename via Info panel, azioni che modificano solo Redux senza toccare RF |

Ctrl+Z in editor-v2 (`EditorV2.tsx:1850-1853`) invoca SOLO il secondo sistema, via `handleUndo()`. Il primo è **non raggiungibile** dall'UI editor-v2 standard. L'utente che ha fatto una modifica via Info panel e poi preme Ctrl+Z non undoa la modifica Info panel — undoa l'ultima azione RF-tracked.

`reconcileJjomAfterUndoRedo` è stato introdotto per "bridgare" i due sistemi — prende il RF snapshot ripristinato e forza JjOM a matchare. Questo **funziona** per azioni che *sono* state catturate in entrambi i sistemi, ma **corrompe** lo stato quando Redux contiene informazioni (rename) che il RF snapshot non include.

---

## C. Overlap con "attributi rinominati tornano ai nomi default"

### C.1 — Ricerca nel log

```
grep -n "rinominat\|rename.*default" docs/claude-code-log.md
```

Nessuna entry esplicita. L'issue appare solo nel prompt originale dell'utente e in `docs/reports/2026-04-23-attribute-coevolution-analysis.md:311-313` (il report di Fase 1 precedente, ma come fuori-scope da affrontare in "Prompt 2"). L'issue esiste nella memoria di progetto come "open issue noto" senza ticket formale.

### C.2 — Same bug o different?

**Sono lo stesso bug.** Evidenze:
- Same root cause: la snapshot pre-rename sovrascrive la JjOM current via reconcile
- Same trigger: una sequenza rename + subsequent RF action + undo
- Stesso sintomo visibile: il nome attributo cambia da utente-definito a `attr_N` (il default)
- Stesso file cruciale: `canvasToJjom.ts:1389-1395`

La dicitura `undo/attr_0` probabilmente si riferisce al caso specifico in cui il primo attributo (`attr_0` per default) viene rinominato e l'undo lo riporta a quel default. "Rinominati tornano a default" è la formulazione user-facing dello stesso meccanismo.

---

## D. Propagazione alla co-evolution attributi (ipotesi)

L'implementazione originale di `useOrphanFeatures` non è committata. Inferenza basata su:
1. Il presente stub (`useClassAttrSig` signature helper, già scritto)
2. Il commento del commit (`45a83df9a`)
3. L'intent del docblock ("soft-delete + restore")

### Valutazione delle 4 ipotesi dell'utente

**Ipotesi 4 — Name-based collision è la più plausibile.**

Motivazione:
- Lo stub usa un signature `classId=attr_0,attr_1|...` (sola lista di nomi, `useClassAttrSig:43-56`)
- Un diff basato su questa signature interpreta una rename come `{attr_0 removed, foo added}` — indistinguibile da un delete + add
- Se l'implementazione originale agiva sul "removed" capturando valori in OrphanStore, la rename avrebbe generato una **entry spurious** `{classId, attr_0, EString}` con i valori correnti
- Se poi l'implementazione agiva sul "added" facendo rehydrate, la rename in senso inverso (foo → attr_0) o la creazione successiva di un altro attributo chiamato `attr_0` matcharbbe la entry, **sovrascrivendo i valori correnti con valori stale**

Questa ipotesi spiega anche perché il bug si chiami "`attr_0` bug" e non "rename bug" in generale:
- `attr_0` è il nome di default → alta frequenza di comparsa
- Dopo una rename `attr_0 → foo`, creare un altro attributo dà di nuovo `attr_0` (naming reattivo) → MATCH con la entry spurious → rehydrate con valori stale
- Utente vede: creo un nuovo attributo e ha già dei valori magici pre-inseriti sulle istanze

**Ipotesi 1 (doppia creazione DValue su undo-delete):** Possibile ma secondaria. Richiederebbe che l'undo di una delete attivi sia la restore dal delta sia la rehydrate da OrphanStore. Anche così, lo scontro sui DValue sarebbe minore (doppia scrittura stesso valore).

**Ipotesi 2 (diff falsi positivi su undo):** Vera **in via consequenziale** all'ipotesi 4. Ogni undo che attraversa un rename farebbe oscillare il signature tra due valori, triggherando cicli di capture/rehydrate.

**Ipotesi 3 (OrphanStore in Redux collide con snapshot):** Falsa secondo lo stub attuale — il tipo `OrphanStore = Map<...>` è in-memory, non Redux. Ma l'ipotesi sarebbe vera se l'implementazione precedente avesse messo l'OrphanStore in Redux.

### Combinazione bug dual-undo + ipotesi 4

Lo scenario aggravato con OrphanStore enabled e bug dual-undo attivo:

1. Crea `attr_0`, valorizza istanza con "hello"
2. Rename `attr_0 → foo` via Info panel
3. Hook (con impl originale, name-based): sig diff → "attr_0 removed, foo added"
4. Hook capture: OrphanStore[`C:attr_0:EString`] = `{objId: ['hello']}`
5. Hook rehydrate: lookup `C:foo:EString` → no match → no-op sui valori
6. Drag class → takeSnapshot in editor-v2
7. Ctrl+Z → handleUndo → reconcile → rinomina `foo → attr_0` in JjOM (bug primario)
8. useJjomSync fires → RF rebuilt con {P_X: 'attr_0'}
9. **Hook fires di nuovo**: sig diff ancora — "foo removed, attr_0 added"
10. Hook capture: OrphanStore[`C:foo:EString`] = `{objId: ['hello']}` (cattura valori CORRENTI che sono ancora "hello")
11. Hook rehydrate: lookup `C:attr_0:EString` → **MATCH** (step 4) → rehydrate `['hello']` → ma DValues già hanno "hello" → no-op visibile

In questo caso specifico non rompe nulla MA:
- OrphanStore accumula entry spurious ad ogni rename
- In scenari con valori più complessi o multi-instance, potrebbe sovrascrivere con valori stale
- Memory leak sulla durata della sessione

E se tra step 2 e step 7 l'utente modifica il valore a "world":
- Step 10 cattura "world" in `OrphanStore[C:foo:...]`
- Step 11 rehydrate `OrphanStore[C:attr_0:...]` → `['hello']`
- **Il valore torna a "hello"** anche se l'utente l'aveva cambiato a "world"

Questo è molto insidioso: l'utente perde modifiche in modo invisibile.

**Verdetto:** l'ipotesi 4 + bug dual-undo produce comportamento non deterministico e corruzione silenziosa di valori. Questo è il motivo per cui OrphanStore è stato disabilitato.

---

## E. Raccomandazione

### E.1 — Il bug undo/attr_0 è riproducibile OGGI senza co-evolution

Documentato al passo A.4. Il fix è **pre-condizione** alla riabilitazione della co-evolution — re-abilitarla sopra un dual-undo rotto significa accumulare ipotesi 4 + bug primario, producendo corruzione silenziosa di valori difficile da riprodurre e debuggare.

### E.2 — Fix richiesto: prompt DEDICATO SEPARATO

**Complessità stimata:** **media** (non piccolo, non grande).

**File principali da toccare:**
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — logica `reconcileJjomAfterUndoRedo`
- `frontend/src/components/editor-v2/hooks/useHistory.ts` — possibile estensione per catturare Redux state assieme a RF state
- `frontend/src/components/editors/Info.tsx` — integrazione con `editorContext?.takeSnapshot()` quando è aperto sopra un nodo editor-v2

**Alternative di fix da considerare nel prompt separato:**

**Opzione 1 — Far emettere takeSnapshot al Info panel quando scoped su editor-v2:**
- Pro: minimal change, preserve existing design
- Con: Info panel è shared tra editor-v1 e v2 → serve detection del contesto
- Lavoro stimato: 1-2 hour più testing

**Opzione 2 — Usare Redux undo come single source of truth:**
- Sostituire editor-v2 history con UndoAction.new / RedoAction.new di Redux
- Rimuovere `useHistory.ts`, `reconcileJjomAfterUndoRedo`, e tutto il boilerplate
- Pro: elimina dual-system, semplifica
- Con: Redux undo cattura ANCHE cose non-UI (es. nodi auto-layout, transient view state). Può essere troppo granulare. Richiede testing esteso di regressioni.
- Lavoro stimato: 1-2 giorni

**Opzione 3 — Far catturare a `useHistory` anche uno snapshot Redux ID-keyed:**
- Al takeSnapshot, clonare non solo nodes/edges RF ma anche un subset di Redux (idlookup filtrato per le classi presenti)
- Al undo, restore sia RF sia Redux subset
- Rimuovere `reconcileJjomAfterUndoRedo` a favore di restore diretto
- Pro: elimina bug fondamentale, Redux + RF sempre coerenti
- Con: snapshot più costosi in memoria (tutte le DAttribute/DValue nel subset), complessità non banale
- Lavoro stimato: 2-3 giorni

**Opzione 4 (QUICK FIX SCOPED, raccomandata come interim):**
- In `reconcileJjomAfterUndoRedo:1383-1396`, NON rinominare mai attributi trovati in entrambi RF e JjOM con ID matching
- Solo re-create / delete in base a differenza di ID
- Trade-off: un Ctrl+Z dopo inline-edit non revocherà il rename (regression minore sull'inline)
- Ma elimina il bug principale (Ctrl+Z dopo Info panel rename non tocca più il nome)
- Lavoro stimato: 15 minuti più testing mirato

Il prompt dedicato deve definire trade-off e test matrix. Raccomando **Opzione 4** come interim — chirurgica, elimina il bug visibile subito, compatibile con qualsiasi fix successivo più completo.

### E.3 — Riabilitazione `useOrphanFeatures`

**Dopo** il fix del bug undo, l'implementazione nuova di `useOrphanFeatures` deve:

1. **NON usare signature name-based.** Usare invece signature `{DClass.id, DAttribute.id}` tuple list. Identity by ID, non name.
   - Rename cambia solo `DAttribute.name` → la tuple `(classId, attrId)` resta stabile → nessun falso positivo

2. **Usare `useRef` session-local** (conferma design dello stub corrente) — l'OrphanStore NON va in Redux, evita Ipotesi 3.

3. **Memoizzare per prevent re-execution su undo:** usare `useEffect` con dipendenza sulla signature, e tenere traccia dell'ultima signature processata per evitare doppia-esecuzione su state oscillation (undo/redo cycle).

4. **Mitigare l'impatto residuo del bug dual-undo (se non ancora fissato):** se il fix undo tarda, l'hook può riconoscere il pattern "id resurrected" (vecchio attrId ricompare dopo essere sparito) → no-op su rehydrate, fidandosi del delta Redux.

**Test manuali obbligatori al momento della riabilitazione** (regression check):
- Scenario A.1 — create+default naming → no spurious OrphanStore entry
- Scenario A.2a — inline rename → no spurious OrphanStore entry
- Scenario A.2b — Info panel rename → no spurious OrphanStore entry
- Scenario A.3 — create+rename+undo → valori non corrompono
- Scenario A.4 — undo sopra snapshot pre-rename → valori non corrompono
- Scenario M1 con valorizzazione e delete+re-add → rehydrate funziona
- Scenario M1 con delete classe → tutte le entry OrphanStore relative vengono purgate

---

## Elementi aggiunti durante la diagnosi

**Nessuno.** Questa analisi è stata condotta interamente tramite:
- Lettura di sorgenti esistenti (`frontend/src/`)
- Git log / git diff
- Ricerche grep
- Tracing statico di flussi di esecuzione

Nessun console.log, mock, breakpoint o altro tool temporaneo è stato aggiunto al codice di produzione.

---

## Riferimenti

- Commit stub: `45a83df9a57da34e9182ba07c4e0400288e334f5` (2026-03-10, Alfonso Pierantonio)
- Report Fase 1: `docs/reports/2026-04-23-attribute-coevolution-analysis.md`
- File chiave: `frontend/src/components/editor-v2/sync/canvasToJjom.ts:1300-1400` (reconcileJjomAfterUndoRedo)
- File chiave: `frontend/src/components/editor-v2/hooks/useHistory.ts` (RF snapshot system)
- File chiave: `frontend/src/redux/reducer/reducer.ts:1100-1300` (Redux state-delta undo)
- File chiave: `frontend/src/joiner/classes.ts:1399-1418` (defaultname logic)
- File chiave: `frontend/src/components/editor-v2/nodes/ClassNode.tsx:75-122` (inline edit + snapshot)
- File chiave: `frontend/src/components/editor-v2/EditorV2.tsx:1697-1765` (handleUndo / handleRedo wiring)

---

**Fine diagnosi. In attesa di decisione utente su quale opzione di fix adottare nel prompt dedicato separato.**
