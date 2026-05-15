# Pre-implementation investigation Fase 2 — JjScript M1

Data: 2026-04-30
Tipo: discovery (read-only). Zero modifiche al codice.
Scope: chiarire 3 punti aperti residui prima di iniziare l'implementazione delle operazioni M1 (`create/delete instance`, `set` su istanze).

---

## Indagine A — `let` e sub-comandi

### Diagnosi

**File ispezionato**: `frontend/src/jjscript/executor/commands/let.ts` (263 righe, integralmente).

`let` parsa il valore della binding come **stringa libera** (`binding.valueExpr: string`) e lo dispatcha in `evaluateBindingValue` (`let.ts:79-97`) in tre branch:

1. `prompt(...)` → `UIBridge.showPrompt`
2. `confirm(...)` → `UIBridge.showConfirm`
3. **Fallback unico**: `evaluateJjel(trimmed, context)` → `jjelEval(...)` (`let.ts:123-133`)

**Non esiste** un branch che intercetti `create / delete / rename / set / generalize / specialize / ...` come sub-comando JjScript. Conseguenze:

- `let myClass = create class Person` oggi produce silenziosamente l'errore `JjEL parse error: ...` perché la stringa `create class Person` è inviata al parser JjEL, che non riconosce `create` come token valido.
- Il branch `try/catch` di `executeLet` (`let.ts:37-66`) cattura l'errore e ritorna `{ success: false, command: 'let', message: 'Let binding error: <parse error>' }`. L'utente vede un errore generico, non una diagnostica utile.
- Quindi `let myClass = create class Person` è **silenziosamente broken** oggi (non bug-ridden in termini di crash, ma non funzionale).

La logica successiva di `resolveVariablesInBody` (`let.ts:143-205`) sostituisce `$varName` con `LiteralValue` (string/number/boolean/null) negli `args` del body. Questo significa che la binding di un'istanza M1 (es. `let p = create instance of Person`) **non potrebbe nemmeno essere referenziata** come `p.name` in un `set` successivo: il sostituto si limita a stringhe primitive, non a riferimenti a oggetti del modello.

### Modifiche necessarie per supportare `let p = create instance of X`

Per il sample script richiesto in Fase 2:

```jjs
let p1 = create instance of Person
set p1.name = "Alice"
```

la funzione `evaluateBindingValue` (`let.ts:79-97`) deve guadagnare un branch che riconosca prefissi di sub-comando e li dispatchi all'executor:

- **File**: `frontend/src/jjscript/executor/commands/let.ts`
- **Linee**: 79-97 (4° branch in testa, prima del fallback JjEL) + nuovo helper di parsing locale
- **Scope**: ~30 LOC

Pseudo-codice del branch:

```ts
const COMMAND_PREFIXES = ['create ', 'delete ', 'rename ', 'set ', 'generalize ', 'specialize '];
if (COMMAND_PREFIXES.some(p => trimmed.startsWith(p))) {
    const subAst = parseSingleCommand(trimmed); // riusa il parser JjScript
    const subResult = await getExecutor().executeAST(subAst, context);
    if (!subResult.success) throw new Error(`Sub-command failed: ${subResult.message}`);
    // Estrai l'oggetto creato/modificato:
    const id = subResult.affectedElements?.[0];
    return id ? resolveLObjectFromId(id) : null;
}
```

Punti aperti che il report dell'implementazione dovrà sciogliere:

1. **Cosa lega la binding**: l'ID stringa o il proxy LObject? Scelta consigliata: il proxy. La sostituzione in `resolveVariablesInBody` deve essere estesa per ammettere QualifiedName che si traducono in **path JjEL** (es. `p1.name = ...` → l'evaluator JjEL risolve `p1` dalle variables di context come oggetto). Questo è coerente con come `buildEvalContext` esponendo le variables nel namespace JjEL.
2. **Verifica che `tryResolveVariable` (`let.ts:189-205`) sia adeguata**: oggi accetta solo primitivi. Per riferire un'istanza M1 occorre aggiungere il caso `kind: 'object' | 'reference'` o, più pulitamente, lasciare il riferimento `$p1` non sostituito e farlo risolvere dalla `set` chain via JjEL su `setArgs.target`.

**Decisione operativa per Fase 2**: estendere `evaluateBindingValue` con il 4° branch e modificare `tryResolveVariable` per propagare reference a oggetti L-proxy (mantenendo i primitivi come oggi). Il `set` M1 leggerà `target` dal context delle variabili.

---

## Indagine B — `syncDeleteObject` vs path UI editor v2

### Diagnosi

**File ispezionato**: `frontend/src/components/editor-v2/sync/canvasToJjom.ts:1425-1459`.

Risultato chiave: **`syncDeleteObject` è codice morto**. Definito alla riga 1425, ha **zero call site** nel codebase.

```bash
$ grep -rn "syncDeleteObject\b" frontend/src --include="*.ts" --include="*.tsx"
frontend/src/components/editor-v2/sync/canvasToJjom.ts:1425:export function syncDeleteObject(objectVertexId: string): void {
```

Il path effettivamente usato dall'editor v2 per cancellare qualunque vertex (incluse istanze M1) è **`syncDeleteVertex`** (`canvasToJjom.ts:259-305`):

- Caller 1: `EditorV2.tsx:1613` — Delete handler bulk per nodi non-class.
- Caller 2: `EditorV2.tsx:1648` — `deleteNode(nodeId)` per cancellazione di un singolo nodo (i class node sono routing diverso via `handleClassRemoval` in JjOM mode).
- Caller 3: `useClassRemoval.ts:268` — Step finale del co-evolution flow per le classi (riusa la funzione perché generica).

`syncDeleteVertex` è **polimorfico**: accetta un `vertexId` (DVertex) e:

1. Risolve `vertexProxy = LPointerTargetable.fromPointer(vertexId)`.
2. Trova tutti gli edge connessi nel graph (`vertexProxy.graph.edges`) filtrando per `start.id === vertexId || end.id === vertexId`.
3. In una `TRANSACTION`, per ogni edge cancella anche dall'`extends` array della classe sorgente (rilevante solo per M2; no-op per M1).
4. Chiama `DeleteElementAction.new(edge.__raw ?? edge)` per ogni edge.
5. Risolve `modelElement = vertexProxy.model` (per un'istanza: il `DObject`).
6. In una seconda `TRANSACTION`: `DeleteElementAction.new(modelElement.__raw ?? modelElement)`.

**Cascade**: la pulizia degli edge è completa per il visual layer (DEdge); la cascata model-level (DValue, riferimenti incoming, ecc.) è demandata a `DeleteElementAction`. Il pattern è già testato dal flow editor v2 e dal `useClassRemoval`.

### Confronto con `syncDeleteObject` (dead)

`syncDeleteObject` (linee 1425-1459) è **funzionalmente identica** a `syncDeleteVertex` per il caso M1, meno la branch `edge.isExtend` (irrilevante per istanze). È letteralmente una copia ridondante mai wirata. Probabile residuo di un tentativo passato di separare il path M1.

### Scelta del path per JjScript `delete instance`

Vincolo dal prompt: *"Solo file JjScript + system prompt Jjodie + CLAUDE.md. Niente modifiche a editor v2."*

Il consumer JjScript ha un input semantico differente: parte dal **nome dell'istanza** + modello target, non da un `vertexId`. Le istanze possono esistere senza vertex (modello chiuso, no graph aperto sul DObject). La scelta giusta è quindi un helper interno a JjScript che:

1. Risolve il `LObject` per nome nel `DModel` target: `lModel.objects.find(o => o.name === instanceName)`.
2. Itera ogni `LVertex` con `vertex.model?.id === lObject.id` (un'istanza può apparire su più graph). Per ognuno, chiama l'esistente `syncDeleteVertex(vertex.id)` — riuso del path testato, cleanup edge incluso.
3. Se nessun vertex esiste (modello headless), chiama `DeleteElementAction.new(lObject.__raw ?? lObject)` direttamente dentro `TRANSACTION('JjScript delete instance', ...)`.

Vantaggi:

- Riusa `syncDeleteVertex` senza modificarlo (vincolo prompt rispettato).
- Copre il caso headless (graph non aperto) che `syncDeleteVertex` non gestirebbe.
- Non tocca il dead code `syncDeleteObject` (può essere rimosso in un task separato di cleanup).

**Nota**: `syncDeleteVertex` è esportata da `canvasToJjom.ts`, quindi il command handler JjScript può importarla senza modifiche al sync layer. La dipendenza inversa (JjScript → editor v2 sync) è già accettata implicitamente, vedi imports analoghi in altri command handler M2 esistenti.

### Decisione operativa

Path scelto per `delete instance` JjScript:

```ts
// frontend/src/jjscript/executor/commands/delete-instance.ts (nuovo)
import { syncDeleteVertex } from '../../../components/editor-v2/sync/canvasToJjom';
import { DeleteElementAction, TRANSACTION } from '...';
// 1. Risolvi LObject by name nel DModel attivo
// 2. Trova ogni LVertex con .model.id === lObject.id  → syncDeleteVertex(vertex.id)
// 3. Se nessun vertex: TRANSACTION → DeleteElementAction.new(lObject.__raw)
```

Non riusare `syncDeleteObject` (dead). Non modificare il sync layer.

---

## Indagine C — Modifiche `jjel/` non committate

### Diagnosi

3 file modificati, 1 file nuovo.

| File | Stato | Tipo modifica |
|------|-------|---------------|
| `jjel/autocomplete/providers/method.ts` | M | autocomplete UX, narrowing per `ReceiverKind` |
| `jjel/evaluator/context.ts` | M | aggiunto variant `'property-not-found'` a `JjelWarning` |
| `jjel/evaluator/evaluator.ts` | M | `getProperty` privata: nuovo param `ctx`, sostituisce `console.warn` con push opzionale a `ctx.diagnostics` |
| `jjel/autocomplete/util/receiverKind.ts` | ?? | nuovo file pure-function di inferenza receiver kind per autocomplete |

### Q1 — Firma di `jjelEvalWithDiagnostics` o equivalenti

**Invariata.** La signature in `jjel/index.ts:124` è:

```ts
export function jjelEvalWithDiagnostics(
    source: string,
    variables?: Record<string, JjelValue>,
): JjelEvalResult
```

dove `JjelEvalResult = { value: JjelValue; warnings: JjelWarning[] }`. Nessun cambio nelle public functions (`jjelEval`, `jjelEvalWithDiagnostics`).

L'unica firma toccata è `JjelEvaluator.getProperty` (privata) che passa da `(obj, prop)` a `(obj, prop, ctx)`. Zero impatto esterno.

### Q2 — Struttura del Diagnostic

**Estesa additivamente.** L'union `JjelWarning` (`context.ts:137-148`) ora include:

```ts
export type JjelWarning =
    | { kind: 'undefined-identifier'; identifier: string; suggestion: string | null }
    | { kind: 'property-not-found';   identifier: string; suggestion: string | null }; // NUOVO
```

Il variant pre-esistente `'undefined-identifier'` resta invariato. Pattern matching esistente (`switch (w.kind) { case 'undefined-identifier': ... }`) continua a compilare/funzionare; nuovo codice può aggiungere `case 'property-not-found':`.

L'unico consumer pubblico noto (`Jodie/jodieJjelContext.ts:67`) usa `warnings: JjelWarning[]` opaque-style e non discrimina i kind oggi. Quindi nessuna regressione.

### Q3 — Coerenza con uso JjScript M1

**Positiva, è un enabler diretto per Q8 del prompt Fase 2.**

Il branch `set <ref>.<attr> = <RHS>` su istanza M1 deve produrre, secondo Q8:

> Possible causes:
>   - the navigation chain returned an empty result
>   - a property in the chain does not exist

La modifica a `evaluator.ts:493-513` è esattamente quello che serve: ogni property miss in catena (es. `p1.unknownField.foo`) genera un diagnostic `'property-not-found'` con `identifier` e `suggestion`. Il command handler M1 può quindi:

```ts
const { value, warnings } = jjelEvalWithDiagnostics(rhs, variables);
if (value === null || value === undefined) {
    const propMisses = warnings.filter(w => w.kind === 'property-not-found');
    // produci messaggio Q8 distinguendo tra "chain empty" e "property does not exist on <X>"
}
```

**Effetto collaterale da non assumere nei test**: i `console.warn` per property-not-found sono **rimossi** (sostituiti da push al sink). Test che catturassero l'emissione su console fallirebbero. Per i test JjScript M1 nuovi: usare `jjelEvalWithDiagnostics` esplicitamente e ispezionare `warnings`, mai `console.warn`.

### Q4 — Modifiche autocomplete

`method.ts` + `receiverKind.ts` impattano solo l'autocomplete UX (filtraggio dei built-in dopo `.`). Zero impatto sull'evaluator runtime e zero impatto sulla semantica JjEL. Non rilevanti per Fase 2.

### Stato suggerito

Le modifiche sono **stabili e coerenti**. Possibilità raccomandata: **commit separato prima di iniziare Fase 2** (es. `feat(jjel): add property-not-found diagnostic; receiver-kind autocomplete narrowing`) per isolare il delta autocomplete/diagnostics dal delta JjScript M1. Non è un blocker, ma riduce rumore nel diff finale.

---

## Conclusione

**Fase 2 può procedere**, ma con questi prerequisiti chiariti:

1. **Indagine A — `let` ha bisogno di estensione** (~30 LOC in `let.ts:79-97` + tweak a `tryResolveVariable`) per supportare `let p = create instance of Person`. Senza, l'esempio canonico del prompt non funziona. Da fare contestualmente al Step 3 dell'implementazione (è un command handler change, non una violazione del vincolo "solo file JjScript").

2. **Indagine B — Path delete istanza fissato**: `delete-instance.ts` risolve `LObject` per nome, itera vertex con `model.id === lObject.id` chiamando `syncDeleteVertex(vertex.id)`, fallback `DeleteElementAction.new(lObject)` se headless. Riuso di `syncDeleteVertex` (no modifica). `syncDeleteObject` (dead) non riusare.

3. **Indagine C — Coerenti, anzi enabler positivo**: `'property-not-found'` diagnostic è esattamente quello che serve a Q8. Raccomandato (non bloccante): committare separatamente le modifiche `jjel/` prima di iniziare Fase 2 per isolare i diff. Per i test M1, usare sempre `jjelEvalWithDiagnostics` (mai `console.warn` capture).

Nessun problema bloccante rilevato. Attesa via libera per partire con Step 1 dell'implementazione.
