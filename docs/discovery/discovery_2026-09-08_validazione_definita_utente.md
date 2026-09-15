# Discovery — validazione definita dall'utente (vincoli M2 in JjEL sulle istanze M1)

**Data**: 2026-09-08
**Corsia**: Fase 1 di un two-phase, READ-ONLY. Nessun file di codice modificato.
**Prompt**: prompt di discovery (punti 1–5) + addendum (punti 6–8), stessi vincoli.

---

## 1. Obiettivo

Accertare la fattibilita' di una validazione definita dall'utente: vincoli dichiarati su
classi M2, corpo scritto in JjEL, valutati sulle istanze M1, **non bloccanti** (diagnostica,
non guard). Otto punti da accertare, nessuna scelta di progetto e nessun diff.

Questo referto **non propone un'implementazione**. Riporta cosa esiste, cosa e' misurato,
cosa manca, e le domande che restano aperte per Alfonso.

---

## 2. File letti (path completi)

Tutti relativi a `/Users/alfonso/jjodel/`.

### Registro dei problemi
- `frontend/src/components/editor-v2/problems/registry.ts` (296 righe, letto per intero)
- `frontend/src/components/editor-v2/problems/useNodeProblems.ts`
- `frontend/src/components/editor-v2/problems/conformanceToProblems.ts`
- `frontend/src/components/editor-v2/problems/ConformanceProblemSync.tsx`
- `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx`
- `frontend/src/components/editor-v2/problems/NodeProblemIndicator.tsx`
- `frontend/src/components/editor-v2/problems/ValidationPill.tsx`
- `frontend/src/components/editor-v2/EditorV2.tsx` (righe 4200–4240, punto di mount)
- `frontend/src/components/editor-v2/Toolbar.tsx` (righe 20–35, 980–1000)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (righe 720–740, 885–905)
- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (righe 365–375, 490–495)
- `frontend/src/model/conformance/ConformanceTypes.ts` (letto per intero)
- `frontend/src/model/conformance/useConformance.ts` (letto per intero)
- `frontend/src/model/conformance/ConformanceValidator.ts` (outline dei 12 CHECK)

### JjEL
- `frontend/src/jjel/index.ts` (letto per intero)
- `frontend/src/jjel/evaluator/index.ts`
- `frontend/src/jjel/evaluator/context.ts` (letto per intero)
- `frontend/src/jjel/evaluator/evaluator.ts` (righe 1–150, 203–275, 380–605, 900–1000)
- `frontend/src/jjel/evaluator/modelContext.ts` (letto per intero)
- `frontend/src/jjel/evaluator/builtins/index.ts`, `builtins/collections.ts` (indice funzioni)
- `frontend/src/jjel/lexer/lexer.ts` (righe 390–405)
- `frontend/src/jjel/SPEC.md` (§5.1, §7, §9, §12)
- `frontend/src/jjel/__tests__/parser.test.ts`, `__tests__/evaluator.test.ts` (copertura)
- `frontend/src/jjtl/lexer/lexer.ts` (righe 320–335)
- `frontend/src/jjtl/SPEC.md` (§12.1, §12.2)
- `frontend/src/jjtl/executor/executor.ts` (righe 2260–2300, `createInstanceContext`)
- `frontend/src/jjscript/executor/commands/eval.ts` (righe 94–210, `buildEvalContext`)

### IR / dependency set
- `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts` (letto per intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (righe 1–140; grep su `dependencySet`)
- `frontend/src/components/editor-v2/viewpoint/ir/irCrossDeps.ts` (righe 1–80)

### Metamodello / persistenza / I-O
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`DOperation` :2326, `DClass` :2691,
  `LClass.allInstances` :3334, `DModel` :4951, `DObject` :5985)
- `frontend/src/joiner/classes.ts` (`Constructors.DOperation` :1018, `DViewElement` :1186,
  `getCollection` :2612 area, `EModelElements` :4040 area, mappe `DtoL`/`LtoD`/`WtoD` :511–518)
- `frontend/src/redux/VersionFixer.tsx` (setup :94–130, migrazioni :404–1289)
- `frontend/src/services/export/EcoreService.ts` (righe 42, 250–300, 400–425, 500)
- `frontend/src/api/data.ts` (righe 437, 532, 665, 799–885, 1068–1085, 1242–1320)
- `frontend/src/common/Dummy.ts` (riga 647)

### Transazioni / reducer
- `frontend/src/redux/action/action.ts` (righe 80–270, 350–375)
- `frontend/src/redux/reducer/reducer.ts` (righe 426–470, 545–560, 595–630, 1350–1380, 1440–1445)

### Sonde eseguite (fuori albero, P11)
- `<scratchpad>/probe_forall.ts` + `.cjs` — bundle esbuild, eseguito con node
- `<scratchpad>/probe2.ts` + `.cjs` — idem

Le sonde **eseguono** lexer/parser/evaluator JjEL; non ne leggono il sorgente. Output
integrale riportato in §5.2 e §5.7.

---

## 3. Sintesi in cinque righe

1. Il registro dei problemi **ha un punto di innesto pulito** per un terzo produttore, e la
   proprieta' delle entry e' gia' nel dato (`ownerModelId`). Costo: un membro in piu' in una
   union esportata.
2. JjEL **non ha un tri-stato**: assente e nullo valgono entrambi `null`, e la navigazione su
   `null` **lancia**, non ritorna null. Una politica esplicita per il vincolo che non decide
   e' obbligatoria, non opzionale.
3. JjEL **non espone alcun dependency set**. Quello che esiste (IR §9) e' su una grammatica
   chiusa e non trasferibile a un'espressione arbitraria senza perdere il lato "oggetto".
4. La radice del modello **non e' tipata da una classe**: `DModel.instanceof` punta a un altro
   `DModel`. Un vincolo con proprietario "radice" non ricade nel caso "vincolo su classe".
5. Il registro **non ammette una diagnostica non ancorata**, e la sola superficie che le
   mostrava (`ValidationPill`) e' spenta dal 2026-08-26.

---

## 3bis. Ipotesi in ingresso, e loro esito

Le ipotesi che il prompt porta con se', e che questa discovery ha cercato di falsificare.

| # | Ipotesi | Esito | Dove |
|---|---|---|---|
| H1 | Nel registro dei problemi esiste un punto di innesto per un produttore nuovo senza toccare quelli esistenti | **CONFERMATA**, con un attrito: la union `NodeProblemKind` va allargata | §4.1 |
| H2 | JjEL ha (o puo' avere) una nozione di tri-stato per la navigazione su assente | **FALSIFICATA**: `JjelValue` non ha `undefined`, e la navigazione su assente **lancia** anziche' ritornare null | §4.2, sonda |
| H3 | Il compilatore JjEL espone (o puo' esporre) l'insieme delle feature/oggetti navigati | **FALSIFICATA in parte**: non esiste compilatore, non esiste visitor, e un visitor futuro darebbe i **nomi** delle feature, non le coppie (oggetto, feature) che l'IR concretizza | §4.3 |
| H4 | «`DModel` e' tipato da qualcosa al livello superiore, quindi un vincolo con proprietario radice ricade nel caso vincolo-su-classe» | **FALSIFICATA**: `DModel.instanceof` e' `Pointer<DModel>`, non `Pointer<DClass>` | §5.1 |
| H5 | Il registro ammette uno scope non ancorato a un elemento | **FALSIFICATA**: `nodeId: string` obbligatorio, e sette siti lo assumono; le violazioni di modello sono scartate a monte e la sola superficie che le mostrava e' spenta | §5.4 |
| H6 | `.forAll` e' un bug della sola via dell'app JjTL | **FALSIFICATA**: riprodotto chiamando JjEL direttamente. In piu', un secondo difetto non iscritto: la lambda `x: pred` non e' accettata come argomento di metodo | §5.3 |
| H7 | Esiste un aggancio a fine transazione che dice quali oggetti sono cambiati | **FALSIFICATA**: `AFTER_TRANSACTION` riceve solo `newState`; l'unica lista somigliante e' `possibleInconsistencies`, parziale, azzerata a ogni giro e consumata da una funzione marcata `_OBSOLETE` | §4.5 |

---

## 4. Findings — punti 1..5

### 4.1 Punto 1 — `editor-v2/problems/`

**Forma del registry.** `registry.ts` e' uno store a livello di modulo, non Redux: una
`Map<problemId, NodeProblem>` (`:108`), una `Map<problemId, Timeout>` per i TTL (`:109`), un
`Set<Listener>` (`:112`) e una cache di snapshot per nodo (`:117`) che preserva l'identita'
dell'array quando il contenuto non cambia, cosi' `useSyncExternalStore` puo' uscire su
`Object.is`. E' **session-local, non persistito, immune a undo/redo** (`:8-10`), ed e' esposto
su `window._jjNodeProblems` per il debug (`:122-124`).

**API produttore** (`:182-236`):
- `registerProblem(p: NodeProblem)` — upsert per `p.id`; cancella un TTL pendente, azzera
  `resolvedAt`, **conserva `createdAt`** di un'entry preesistente (sticky).
- `clearProblem(id)` — rimozione immediata.
- `clearProblemsByNode(nodeId)`.
- `markResolved(id)` — imposta `resolvedAt` e programma la rimozione dopo
  `RESOLVED_TTL_MS = 5000`; il timer **non parte** se l'overlay e' aperto sullo stesso nodo, e
  riparte alla chiusura (`:162-180`, `:284-296`).

**API lettura** (`:238-296`): `subscribe`, `getNodeProblemsSnapshot(nodeId)`,
`getProblemIdsOwnedBy(kind, ownerModelId)`, `getActiveOverlayProblemId`,
`getIsHighlighted(nodeId)`, `setActiveOverlayProblemId(id|null)`. Gli hook stanno in
`useNodeProblems.ts`: `useNodeProblems`, `useActiveOverlayId`, `useIsHighlighted`.

**Forma della diagnostica** (`NodeProblem`, `:61-104`):
`id`, `nodeId`, `kind`, `severity`, `title`, `description`, `relatedNodeIds`, `action?`,
`conformance?`, `ownerModelId?`, `createdAt`, `resolvedAt?`.
`NodeProblemKind = 'duplicate-name' | 'conformance'` (`:28`).

**Produttori attuali.** Due, montati fianco a fianco in `EditorV2.tsx:4223-4224`, entrambi
ritornano `null`:

| Produttore | Sorgente | Reattivita' | Chiave | Ancoraggio |
|---|---|---|---|---|
| `UniquenessProblemSync` | `nameUniqueness.detectDuplicateNames` / `detectM2DuplicateNames` | firma `useSelector` su `id:name:father` di ogni DObject e di ogni elemento M2 nominato, con guardia `hasOwnProperty` per saltare le pending create (`:185-205`) | `duplicate-name:${nodeId}` | **solo l'id dell'elemento** |
| `ConformanceProblemSync` | `useConformance(modelid)` (debounce 500 ms) | il `result` dell'hook (`:131`) | `conformance:${nodeId}` | **doppia**: id del DObject + id del DVertex risolto |

**Come si registra una diagnostica.** Il registry **non impone un formato di id**, richiede
solo unicita' (`:12-18`). Entrambi i produttori usano `${kind}:${nodeId}` perche' un nodo puo'
portare al massimo una entry di quel kind. Il commento `:16-18` prevede gia' il caso nostro:
«future producers with more than one problem of the same kind per node (e.g. conformance
violations per constraint) will use longer IDs like `${kind}:${nodeId}:${constraintId}`».

**Chiave di ancoraggio e come l'indicatore la risolve.** `NodeProblemIndicator` e' montato in
`ObjectNode.tsx` a `:920`, `:1151`, `:1217` con `nodeId={id}`, dove `id` e' **l'id del nodo
ReactFlow, cioe' l'id del DVertex**. Il registry non risolve nulla: e' il produttore a dover
registrare sotto l'id giusto. `ConformanceProblemSync` lo fa con `buildVertexResolver`
(`:59-70`), che scandisce `graph.subElements` e costruisce `DObject.id -> DVertex.id`,
registrando due entry per oggetto violato (`:109-115`). `UniquenessProblemSync` **non lo fa**,
e il suo header lo dichiara misurato (`:58-63`): «the dot does not appear on the canvas».

Altri consumatori dello stesso registry, con altre chiavi:
- `TreeViewContent.tsx:898` — `problemKey = expandKey` (id entita'; stringa vuota per le
  sezioni sintetiche).
- `IRForm.tsx:371` — `objectId`, cioe' l'id del DObject, «the half that» il form vede.
- `formDiagnostics.ts` — conta con la stessa regola dell'indicatore (`:55`).

**Esiste un punto di innesto senza toccare i produttori esistenti? SI'.** Serve:
1. un valore nuovo nella union `NodeProblemKind` (`registry.ts:28`);
2. un componente `…ProblemSync` montato accanto agli altri due in `EditorV2.tsx:4223`;
3. `ownerModelId` scritto **alla registrazione** e revoca via
   `getProblemIdsOwnedBy(kind, modelid)` — che filtra su `kind` **e** su `ownerModelId`, quindi
   le entry degli altri due produttori sono fuori portata per costruzione (`:263-271`).

Il solo attrito reale e' la union: aggiungere un membro a `NodeProblemKind` **non e'
"aggiungere una proprieta' opzionale"** ai sensi della Regola 11, ed e' l'unica via — il
registry filtra per `kind` e i consumatori discriminano su di esso. Va autorizzato.

**Vincolo secondario, misurato.** `NodeProblemIndicator:48-51` conta
`p.conformance?.length ?? 1`: un kind nuovo senza campo di dettaglio conta **1 per entry**.
Se un oggetto puo' violare tre vincoli utente, o si aggiunge un campo dettaglio proprio
(additivo, come `conformance` lo e' stato) o si registrano tre entry con l'id lungo
`${kind}:${nodeId}:${constraintId}`.

---

### 4.2 Punto 2 — JjEL: firma di ingresso, contesto, navigazione su undefined, tri-stato

**Non c'e' un compilatore.** La catena e' lexer -> parser -> evaluator ad albero
(`JjelEvaluator.evaluate` fa uno `switch` sul `type` del nodo, `evaluator.ts:150-200`).
Nessuna fase di compilazione, nessuna IR intermedia, nessun artefatto riusabile fra due
valutazioni.

**Firme d'ingresso** (`jjel/index.ts`):
```ts
parseExpression(source: string): { expression: JjelExpression | null; errors: {line,column,message}[] }
evaluate(expr: JjelExpression, ctx?: EvaluationContext): JjelValue
jjelEval(source: string, variables?: Record<string, JjelValue>): JjelValue            // :74
jjelEvalWithDiagnostics(source, variables?): { value: JjelValue; warnings: JjelWarning[] }  // :124
isValidJjel(source): boolean            // :148
getJjelErrors(source): string[]         // :159
```
`jjelEval` **lancia** sugli errori di parse (`:81`, `:85`). `jjelEvalWithDiagnostics` pure.

**Come si passa il contesto (`self`).** `new EvaluationContext(initialBindings?, typeRegistry?)`
(`context.ts:263-278`): scope a pila, `child(bindings)` per gli scope annidati, che eredita il
sink dei diagnostici e la mappa delle ambiguita'.

**`self` non e' una primitiva del linguaggio**: e' una convenzione dei chiamanti. Il precedente
diretto e' `JjtlExecutor.createInstanceContext` (`jjtl/executor/executor.ts:2275-2300`):
```ts
const bindings = {
    source: shallowToJjelValue(sourceInstance),
    self:   shallowToJjelValue(sourceInstance),
    it:     shallowToJjelValue(sourceInstance),
};
for (const [key, value] of proxyEntries(sourceInstance))
    if (!key.startsWith('__')) bindings[key] = shallowToJjelValue(...);
extractAttributeValues(sourceInstance, bindings);
```
Cioe': l'istanza e' legata a tre nomi **e** le sue proprieta' sono appiattite come
identificatori nudi.

`extractAttributeValues` (`jjel/evaluator/modelContext.ts:23-83`) e' il ponte M1: legge le
chiavi `$`-prefissate del proxy L, prende `.value` e scrive sotto il nome senza `$`. Il commento
`:19-22` avverte che **il valore dello slot sovrascrive l'identita'**: `name` del DObject viene
rimpiazzato dal valore dell'attributo `name`.

Conseguenza sintattica misurata: `self.$age.value` **non si parsa** (`1:6 Expected property name
after '.'`, un `DOLLAR_IDENT` non e' ammesso dopo un `DOT`). L'unica via per leggere uno slot M1
in JjEL e' il nome nudo prodotto da `extractAttributeValues`.

**Navigazione su undefined — misurata, non dedotta** (sonda `probe_forall.ts`, sezione EVAL):

| Espressione | Contesto | Esito |
|---|---|---|
| `xyz` | `{}` | `null` **silenzioso** (`evaluator.ts:211-266`) |
| `a.b` | `{a: null}` | **LANCIA** `JjelEvaluationError: Cannot access property 'b' of null` (`:380-388`) |
| `a.b` | `{}` | **LANCIA**, stesso errore (`a` -> null, poi member access su null) |
| `a?.b` | `{a: null}` | `null` (`:393-400`) |
| `a.b.c` | `{a:{b:null}}` | **LANCIA** su `.c` |
| `o.missing` | `{o:{a:1}}` | `null` + warning `property-not-found` |
| `coll.name` | `{coll:[{name:'x'}]}` | **LANCIA**, messaggio pedagogico che suggerisce `forall` (`:436-440`) |
| `nothing == 1` | `{}` | `false` (nessuna eccezione: il `==` non naviga) |

Cioe': **l'identificatore mancante e' silenzioso, la navigazione su di esso e' fatale.** Un
vincolo `self.owner.name != ''` su un'istanza senza `owner` **lancia**; scritto
`self.owner?.name != ''` ritorna `false`, che non e' lo stesso di "non applicabile".

**Tri-stato: NON esiste.** `JjelValue = null | boolean | number | string | JjelValue[] |
JjelObject | JjelFunction` (`context.ts:13-20`). Non c'e' `undefined`, non c'e' `unknown`. Il
solo canale che distingue "assente" da "esplicitamente nullo" e' `JjelWarning[]`
(`context.ts:137-168`), che:
- e' popolato **solo** se il chiamante usa `jjelEvalWithDiagnostics` (o imposta
  `ctx.diagnostics` a mano);
- e' **deduplicato per identificatore** (`evaluator.ts:250-252`, `:225-233`), quindi non dice
  quante volte e' successo ne' dove;
- ha tre kind: `undefined-identifier`, `property-not-found`, `ambiguous-instance`.

Misura (sonda `probe2.ts`):
```
DIAG  jjelEvalWithDiagnostics('missing', {})       -> {"value":null,"warnings":[{"kind":"undefined-identifier","identifier":"missing","suggestion":null}]}
DIAG2 jjelEvalWithDiagnostics('o.missing', {o:{a:1}}) -> {"value":null,"warnings":[{"kind":"property-not-found","identifier":"missing","suggestion":null}]}
```

**Cosa resta da decidere** (domanda D2 in §7): un vincolo che valuta a `null`, o che lancia,
non e' ne' soddisfatto ne' violato. Le tre politiche possibili — "non applicabile" (silenzio),
"warning di forma" (il vincolo e' rotto, non il modello), "violazione" — hanno esiti utente
molto diversi, e la scelta non e' derivabile dal codice.

---

### 4.3 Punto 3 — dependency set

**Cosa fa oggi la pipeline IR (spec v1.2 §9).**

Il parser e' `pathExpr.parsePathExpr` (`ir/pathExpr.ts:31-58`), grammatica **chiusa**:
```
FORBIDDEN_PATH = /\?\.|\?\?|[?:()]/          // :21
STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/   // :23
```
cioe' `$feature ( .value | .values | .values[N] )` ripetuto, separato da punti. Nessuna
chiamata, nessun operatore, nessun letterale, nessun navigare condizionale.

Restituisce `{ steps: {feature?, take}[], featureNames: string[] }`. **Il dependency set e'
`featureNames`**, raccolto durante il parse, non da un'analisi a posteriori.

`irCompile.compilePath` (`:100-137`) produce l'accessore e, quando `steps.length >= 2`,
deposita nel sink di modulo `crossPathSink` un `CompiledCrossPath` = `{hops, terminal}`
(`:131-135`). Il deposito finale sul `CompiledView` avviene a `:416`, `:495`, `:517`, `:570`:
`dependencySet: Array.from(deps)`.

Il consumo e' `irCrossDeps.resolveCrossDeps(idlookup, objectId, crossPaths)` (`:60-...`), che
naviga ogni crossPath con la **stessa** funzione che usa il render (`navigateRefHop`, cosi'
render e reattivita' non divergono, `:52-58`) e concretizza ogni coppia `(oggetto, feature)`
nell'**id del DValue**. Cap di fan-out `CROSS_FANOUT_CAP = 100` (`:37`). Il risultato viene
appeso alla firma della `useSelector` dell'osservatore.

Il limite dichiarato: `irCompile.ts:96-99` — «only single-hop self paths are fully reactive» era
il limite v1.1, chiuso da §9 per i multi-hop.

**JjEL espone qualcosa del genere? NO.**

Cercato e non trovato:
- nessun visitor dell'AST JjEL fuori da `evaluator/` e `parser/`. Il grep su `MemberAccess`
  in tutto `frontend/src` restituisce **solo** `jjtl/types/ast.ts`, `jjtl/utils/astToGrammar.ts`,
  `jjtl/parser/parser.ts` e i file `jjel/` gia' noti. (Controllo positivo sullo stesso comando:
  cercando `AFTER_TRANSACTION` in tutto `frontend/src` restituisce 16 righe — il comando ha
  segnale.)
- l'autocomplete JjEL (`jjel/autocomplete/context.ts`) lavora sul **testo**
  (`findCurrentWord`, `skipWhitespaceBack`, `readIdentBack`), non sull'AST: non e' un
  precedente riusabile.

**Puo' esporlo?** Tecnicamente si': l'AST e' tipizzato (`jjel/types/ast.ts`, 375 righe, 20 tipi
di nodo) e un visitor che raccolga `Identifier.name` e `MemberAccess.property` e' meccanico.
Ma il risultato **non sarebbe l'equivalente del dependency set IR**, per tre ragioni misurate:

1. **Il lato "oggetto" e' gia' perso.** Le feature M1 arrivano nel contesto **appiattite** da
   `extractAttributeValues`: `p.age` non e' la navigazione di uno slot, e' l'accesso a una
   proprieta' di un oggetto piatto. Un visitor recupera il **nome** della feature, non la
   coppia `(oggetto, feature)` che `irCrossDeps` concretizza in un id di DValue.
2. **I binding sono dinamici.** `forall x in coll`, `exists x in coll`, `with obj do` e le
   lambda introducono nomi il cui valore dipende dalla valutazione: staticamente `x.name` e'
   "la feature `name` di qualcosa", punto.
3. **`IndexAccess` con indice calcolato e' opaco** (`evaluator.ts:967-982`).

Un dependency set JjEL sarebbe quindi **conservativo, per nome di feature**, e non per coppia.
Usato come firma di sottoscrizione, farebbe rivalutare piu' del necessario ma non meno — il che
e' la direzione sicura, e coincide con quello che `useConformance` gia' fa oggi (§4.5).

---

### 4.4 Punto 4 — aggiungere un elemento contenuto in una classe M2

**Precedenti**: `DAttribute`, `DReference`, `DOperation`. Il piu' vicino e' `DOperation`
(`LModelElement.tsx:2326-2386`), contenuto in `DClass.operations`
(`LModelElement.tsx:2717`: `operations: Pointer<DOperation, 0, 'N', LOperation> = []`), padre
`DClass`.

**Cosa comporta, ricavato dal precedente:**

| # | Sito | Cosa | Path |
|---|---|---|---|
| 1 | classe D + classe L | `class DXxx extends DModelElement`, `class LXxx extends L…`, decoratori `@RuntimeAccessible('LXxx')` (+`@Node` se va sul canvas), `static new/new2/new3` | `frontend/src/model/logicWrapper/LModelElement.tsx` |
| 2 | collezione su DClass e LClass | `xxx: Pointer<DXxx,0,'N',LXxx> = []` e l'omologo L | idem, `:2691` e `:2769` |
| 3 | `Constructors.DXxx()` | fa `this.setExternalPtr(thiss.father, "<collezione>", "+=")` — modello: `DOperation()` | `frontend/src/joiner/classes.ts:1018-1024` |
| 4 | `Constructors.getCollection()` | `case 'DXxx': return '<collezione>';` | `frontend/src/joiner/classes.ts` (~:2724, blocco con `case 'DOperation': return 'operations';`) |
| 5 | enum `EModelElements` | `"(m2) Xxx" = "DXxx"` | `frontend/src/joiner/classes.ts` (~:4040) |
| 6 | via generica di creazione figlio | `case '<collezione>': d = DXxx.new3(ptrs, callback, true); break;` | `frontend/src/common/Dummy.ts:647` |
| 7 | mappe di tipo | `DtoL`, `DtoW`, `LtoD`, `WtoD` e le loro ripetizioni | `frontend/src/joiner/classes.ts:511, 514, 516, 518, 2490, 2493, 2543-2544, 2570-2571` |

**Attenzione al punto 7**: sono catene condizionali `export type` che elencano **ogni** coppia
D/L. Non sono `interface`, quindi la Regola 11 letterale non le copre, ma la modifica **non e'
additiva-opzionale** e tocca un file del cuore. Va autorizzata (Regola 5).

**Lato VersionFixer.** Nessuna migrazione e' richiesta per *creare* elementi nuovi. E'
richiesta per i **progetti gia' salvati**: le loro `DClass` in `idlookup` non hanno la chiave
nuova, quindi `cls.xxx` e' `undefined`, non `[]`. Il precedente esatto e' additivo-normalizzante:

```ts
// VersionFixer.tsx:487-505, '2.204 -> 2.205'
if (!p.classes) p.classes = [];
if (!p.enumerators) p.enumerators = [];
// VersionFixer.tsx:447-456, '2.201 -> 2.202'
if (c.isCrossReference === undefined) c.isCrossReference = false;
```

Quindi: **una migrazione si', ma di normalizzazione di campo, non di riscrittura `jsxString`**.
La regola 14 / §3.9 di CLAUDE.md **non si applica**: nessun file di default-view viene toccato.
`highestVersion` si alza da se' dal nome del metodo (`VersionFixer.tsx:94-113`). L'ultima
migrazione presente e' `'2.227 -> 2.228'` (`:1196`), quindi la prossima e' `'2.228 -> 2.229'`.

**Lato round trip `.ecore`.**

- **Export** — `EcoreService.exportClass` (`:250-285`) decide se emettere un tag aperto con
  `const hasChildren = attributes.length > 0 || references.length > 0 || operations.length > 0;`
  (`:259`) e poi cicla le tre collezioni. **Un contenuto nuovo non entra**: senza toccare
  quel calcolo e senza un `exportXxx`, l'elemento **si perde in silenzio** all'export.
- **Import** — `api/data.ts` riconosce i figli per nome di tag: `ECoreClass.eOperations`
  (`:803`), `eAnnotations` (`:799`, `:851`, `:881`). Un tag non riconosciuto viene ignorato.
- **Ecore non ha un elemento nativo per i vincoli.** EMF li scrive come
  `<eAnnotations source="http://www.eclipse.org/emf/2002/Ecore/OCL"><details key=… value=…/></eAnnotations>`.
  Stato misurato di quella via qui:
  - **import: presente** — `api/data.ts:665` documenta
    `<eAnnotations source=…><details key=… value=…/></eAnnotations>` -> `DAnnotation`, e i
    `case` a `:799/:851/:881` lo eseguono;
  - **export: assente** — `ExportOptions.includeAnnotations` (`EcoreService.ts:42`) e'
    **dichiarata e mai letta**. Verificato con grep su tutto `frontend/src`: **due sole
    occorrenze**, la dichiarazione e il commento che la denuncia
    (`components/editor-v2/nodes/rowViewAnnotations.ts:47`). Il commento a
    `EcoreService.ts:500` conferma: «split instanceTypeName (EMF 2.x) e eAnnotations rimandati
    a W5/W4».

Cioe': **oggi un vincolo scritto come eAnnotation entra dall'import e si perde all'export.**
Qualunque strada si scelga (elemento proprio o annotation), il lato export va scritto.

---

### 4.5 Punto 5 — aggancio a fine transazione

**Il macchinario** sta in `frontend/src/redux/action/action.ts`: `BEGIN` (`:103`), `ABORT`
(`:112`), `COMMIT` (`:120`), `END` (`:142`), `FINAL_END` (`:153`). `FINAL_END` e' il punto in
cui le azioni pendenti diventano una `CompositeAction` e vengono fired (`:163-165`).

**Gli agganci esposti** (`action.ts:148-182`):

| Hook | Quando | Riceve | Note |
|---|---|---|---|
| `AT_TRANSACTION(cb)` | **prima** del reducer, sempre, anche se la transazione fallisce; non se abortita prima del lancio | niente | eseguito in `FINAL_END:167-170` |
| `AFTER_TRANSACTION(cb)` | **dopo** il reducer, prima dell'update React, **solo se riuscita** | `newState: DState` | «cannot call store.getState while inside» (`:155`) |
| `AFTER_UPDATE(cb)` | dopo il render React | `newState` | e' `AFTER_TRANSACTION` + `setTimeout(...,1)` |

Invocazione: `DO_AFTER_TRANSACTION_NOT_FOR_USERS(ret)` in `reducer.ts:617` e `:623`.

**Sono code one-shot.** `DO_AFTER_TRANSACTION_NOT_FOR_USERS` (`action.ts:163-174`) copia
l'array e lo **azzera** prima di eseguire. Non sono sottoscrizioni: chi vuole essere richiamato
a ogni transazione deve ri-registrarsi ogni volta.

**Nessuno di questi dice QUALI oggetti sono cambiati.** `AFTER_TRANSACTION` riceve solo
`newState`. L'unica struttura che assomiglia a una lista e'
`Action.possibleInconsistencies: Dictionary<subtype, Pointer[]>` (`action.ts:360`), ma:
- e' popolata in `Action.parse1` **solo** per le azioni che portano un `subType` (`:366-369`);
- e' azzerata all'inizio di ogni `CompositeActionReducer` (`reducer.ts:436`);
- e' consumata da una funzione che si chiama `updateRedundancies_OBSOLETE`
  (`reducer.ts:550, 554-561`).

Non e' un'API su cui appoggiarsi.

**Il pattern effettivamente in uso, ed e' il precedente da seguire: firma-selettore +
debounce.** `useConformance` (`model/conformance/useConformance.ts:45-77`) costruisce con
`useSelector` una stringa che copre **esattamente** cio' che la validazione legge:

```
m:<instanceof del modello>;
o<id>=<instanceof>;      per ogni DObject
v<id>=<JSON.stringify(values)>;   per ogni DValue
c<id>=<abstract>,<attributes>|<references>|<extends>;   per ogni DClass
a<id>=<type>,<lowerBound>,<upperBound>,<isID>;          per ogni DAttribute
r<id>=<type>,<lowerBound>,<upperBound>;                 per ogni DReference
e<id>=<literals>;  l<id>=<name>;                        enum e literal
```

e un `useEffect` con `DEBOUNCE_MS = 500` (`:8`, `:79-117`) rivaluta. Il commento `:22-32`
spiega perche' non basta un selettore su `idlookup[modelId]` (le edit profonde non toccano
l'entry del modello) ne' uno sull'intero `idlookup` (fired a ogni azione, il debounce
trailing non atterrerebbe mai).

`UniquenessProblemSync` fa lo stesso con una firma piu' stretta (`id:name:father`,
`:185-205`), con la guardia `hasOwnProperty` per saltare le pending create — il cui difetto
originario, e la misura che lo chiuse, sono documentati nel suo header (`:24-47`).

**Costo del pattern: la rivalutazione e' totale, non incrementale.** Nessuno dei due produttori
attuali rivaluta il singolo oggetto cambiato: `validateConformance(lModel, metamodel)` ripercorre
tutte le istanze, `detectDuplicateNames(model)` pure. Misure di costo esistenti, sullo stato di
150/154 chiavi: `detectM2DuplicateNames` 0,87 ms, `detectDuplicateNames` 2,59 ms per scansione
(header di `UniquenessProblemSync.tsx:43-46`). Per la conformance non ho una misura.

---

## 5. Findings — addendum, punti 6..8

### 5.1 Punto 6 — radice del modello

**Definizione**: `frontend/src/model/logicWrapper/LModelElement.tsx:4951`.

```ts
export class DModel extends DNamedElement {
    id!: Pointer<DModel, 1, 1, LModel>;
    parent: Pointer<DModelElement, 0, 'N', LModelElement> = [];
    father!: Pointer<DModelElement, 1, 1, LModelElement>;
    annotations: Pointer<DAnnotation, 0, 'N', LAnnotation> = [];
    name!: string;
    packages: Pointer<DPackage, 0, 'N', LPackage> = [];
    isMetamodel: boolean = true;
    objects: Pointer<DObject, 0, 'N', LObject> = [];
    models: Pointer<DModel, 0, 'N', LModel> = [];
    instanceof?: Pointer<DModel>;              // <-- punta a un DModel
    instances!: Pointer<DModelElement>[];
    dependencies!: Pointer<DModel>[];
    metadata?: { xmiIdMap?: Record<string, string> };
}
```

**Risposta secca: e' una struttura a parte, non un oggetto tipato da una classe del livello
superiore.** `DModel.instanceof` e' `Pointer<DModel>`: un modello e' istanza di un **modello**
(il suo metamodello), non di una `DClass`. Il contrasto e' esplicito su `DObject`
(`:5999`): `instanceof?: Pointer<DClass>`.

Conferma d'uso, non solo di dichiarazione: `useConformance.ts:90`
`const metamodel = lModel.instanceof as LModel | undefined;`.

**Conseguenza per il prompt**: un vincolo con proprietario "radice" **non** ricade nel caso
"vincolo su classe" senza aggiunte. Non esiste una classe M2 di cui il `DModel` sia istanza a
cui appendere il vincolo.

**Chi lo istanzia**: `DModel.new` (`:4976`), `new2` (`:4983`), `new3` (`:4991`). Tutti passano
per `new Constructors(new DModel('dwc'), …).DPointerTargetable().DModelElement().DNamedElement(name).DModel(instanceoff, isMetamodel).end()`.
`Constructors.DModel` (`joiner/classes.ts`, ~:962-968) fa
`SetRootFieldAction.create(isMetamodel ? "m2models" : "m1models", thiss.id, "+=", true)` e,
se c'e' un `instanceoff`, `setExternalPtr(instanceoff, "instances", "+=")`.

Call site misurati (grep su `frontend/src`, `DModel.new|new2|new3`):
`components/project/ProjectEditor.tsx:1703`; `api/data.ts:437` (import metamodello) e `:532`
(import modello); `pages/components/Navbar.tsx:77` e `:101`;
`services/export/XMIService.ts:593`; `jjodie-integration/JjodieAPIImpl.ts:95`;
gli esempi `examples/StateMachine/M2/index.ts:19`, `M1/index.ts:52`,
`examples/RowViewSmoke/index.ts:75` e `:324`. Due call site commentati in
`components/abstract/DockLayout.tsx:193, 228`.

Nota su `DModel.instances`: e' popolato dal costruttore del modello figlio, quindi
`metamodel.instances` e' la lista dei modelli M1 di quel metamodello — ed e' esattamente cio' su
cui si appoggia `buildEvalContext` per raccogliere le istanze (§5.2).

---

### 5.2 Punto 7a — "tutte le istanze di C"

**Livello L: esiste ed e' vivo.** `LClass.allInstances`
(`LModelElement.tsx:3334-3339`):
```ts
allInstances!: LObject[];
__info_of__allInstances: Info = {type: 'LObject[]', txt: "Instances in m1 of this class and of all subclasses."};
protected get_allInstances(context: Context): this["instances"] {
    let sc = this.get_allSubClasses(context, true);
    return sc.flatMap( (c) => c.instances );
}
protected get_instances(context: Context) { return context.data.instances.map(p => LPointerTargetable.from(p)); }
```
Semantica: istanze della classe **e di tutte le sottoclassi** (il `true` e' "includi te stessa").

**Livello JjEL: non e' una primitiva del linguaggio.** Non esiste un builtin `allInstances`
(`jjel/evaluator/builtins/` espone `filter, map, flatMap, first, last, any, all, none, count,
size, isEmpty, isNotEmpty, contains, distinct, distinctBy, sortBy, sortByDescending, reverse,
take, skip` e i moduli strings/numbers/dates). E' un **dato del contesto**, costruito da
`buildEvalContext` (`jjscript/executor/commands/eval.ts:94-210`):

- `variables['classes']` — una shell per ogni classe del metamodello (`:121`), con
  `superTypes`/`subTypes` risolti per identita' nel linking pass Option C (`:129-146`);
- `variables['instances']` — il pool piatto di **tutti** gli oggetti M1 di **tutti** i modelli
  del metamodello (`:148-149`), raccolti da `metamodel.instances` -> `model.allSubObjects`
  (`:107-112`);
- per ogni shell di classe, `classObj.instances` e `classObj.allInstances` popolati al Pass 4
  (`:178-209`), condividendo i **riferimenti** del pool (identita' preservata, quindi `==`
  funziona fra istanze).

Riusato da `jjscript/executor/commands/let.ts:125`, `forall.ts:32`, e da
`components/Jodie/jodieJjelContext.ts:39` — che e' il precedente di riuso fuori da JjScript.

**Avvertenza misurata dal codice stesso** (`eval.ts:104-107`):
> «The DClass.instances pointer list is unreliable here (often doesn't reflect newly-created
> model objects), so we compute from the M1 model side instead.»

Un validatore che si appoggi a `LClass.allInstances` **eredita quella inaffidabilita'**;
`buildEvalContext` la aggira ricalcolando dal lato M1. Va scelto consapevolmente quale delle due
vie usare.

Nota di scopo: il pool di `buildEvalContext` e' **tutti i modelli M1 del metamodello**, non il
modello aperto. Per una validazione "su questo modello" e' uno scope piu' largo del necessario,
e la mappa delle ambiguita' (`AMBIGUOUS_INSTANCES_KEY`, `context.ts:171-198`) esiste proprio
perche' quel pool produce omonimi.

---

### 5.3 Punto 7b — stato di `.forAll`: RIPRODOTTO

Sonda fuori albero che **esegue** lexer e parser JjEL (bundle esbuild -> node). Output
integrale:

```
--- "classes.forAll(c: c.name != null)"
  tokens: IDENTIFIER DOT FORALL LPAREN IDENTIFIER COLON IDENTIFIER DOT IDENTIFIER NEQ NULL RPAREN EOF
  parse errors: 1  ->  1:9 Expected property name after '.'
  expression: null
--- "classes.forall(c: c.name != null)"
  tokens: IDENTIFIER DOT FORALL LPAREN ...          (identico)
  parse errors: 1  ->  1:9 Expected property name after '.'
--- "forall c in classes such that c.abstract"      parse errors: 0   expression: ForAll
--- "forall c in classes: c.name"                   parse errors: 0   expression: ForAll
--- "exists c in classes such that c.abstract"      parse errors: 0   expression: Exists
--- "classes.all(c: c.name != null)"                parse errors: 1  ->  1:14 Expected ')' after arguments
--- "classes.any(c: c.abstract)"                    parse errors: 1  ->  1:14 Expected ')' after arguments
--- "self.name"                                     parse errors: 0   expression: MemberAccess
--- "self.$age.value"                               parse errors: 1  ->  1:6 Expected property name after '.'
```

Le quattro righe a 0 errori sono il **controllo positivo**: il parser funziona, quindi il
silenzio delle altre e' un risultato, non un comando che non ha girato.

**Difetto 1 — `.forAll` non si parsa mai, ed e' un difetto di JjEL, non solo della via JjTL.**
Causa: `jjel/lexer/lexer.ts:397-400`
```ts
const textLower = text.toLowerCase();
const keywordType = JJEL_KEYWORDS[textLower];
```
`forAll` -> `forall` -> token `FORALL`, che dopo un `DOT` non puo' essere un nome di proprieta'.
La gemella e' `jjtl/lexer/lexer.ts:330`
(`JJTL_KEYWORDS[text.toLowerCase()] || TokenType.IDENTIFIER`), ed e' quella citata da
`jjtl/SPEC.md:752`. **La scheda in SPEC attribuisce il difetto alla via dell'app JjTL; la
misura mostra che JjEL da solo, chiamato direttamente, fa lo stesso.**

**Difetto 2 — non iscritto da nessuna parte: la lambda a due punti non e' accettata come
argomento di un metodo.** `classes.all(c: c.name != null)` e `classes.any(c: c.abstract)`
falliscono al `COLON` con `Expected ')' after arguments`. La stessa espressione con la freccia
si parsa **e valuta** (sonda 2, su `classes = [{name:'A',abstract:false},{name:null,abstract:true}]`):
```
classes.all(c => c.name != null)                    -> false
classes.any(c => c.abstract)                        -> true
classes.none(c => c.abstract)                       parse 0 errori
(forall c in classes such that c.abstract).isEmpty  -> false
exists c in classes such that c.abstract            -> true
```
`jjel/SPEC.md:326-337` documenta `=>` per le lambda dei metodi e `:` **solo** per la proiezione
di `forall`, quindi il comportamento misurato e' quello specificato. Ma
**`CLAUDE.md §12.6` dichiara `coll.forAll(x: pred)` come il quantificatore booleano di JjEL, e
quella riga e' falsa su entrambi i pezzi**: il metodo non esiste (si chiama `all`) e la forma
della lambda non si parsa.

**Il quantificatore booleano che funziona oggi**, in ordine di leggibilita':
`exists x in coll such that P` · `coll.any(x => P)` · `coll.all(x => P)` · `coll.none(x => P)` ·
`(forall x in coll such that P).isEmpty` · `not (exists x in coll such that P)`
(builtin a `jjel/evaluator/builtins/collections.ts:122, 139, 156`).

**Copertura a test.** `.forAll` non e' coperto da nessun test JjEL. `.all`/`.any` sono coperti
**solo con la freccia**: `jjel/__tests__/evaluator.test.ts:90` (`items.any(x => x.active)` ->
true) e `:94` (`items.all(x => x.active)` -> false). La forma `forall … in …` e' coperta bene
(18 occorrenze in `parser.test.ts`, 13 in `evaluator.test.ts`).

**Non corretto in questo giro, come chiesto.** Se e quando si correggera', i file coinvolti
sono `frontend/src/jjel/lexer/lexer.ts` (`:397-400`) e/o
`frontend/src/jjel/parser/parser.ts` (il ramo del member access dopo `DOT`), piu' una scelta su
`frontend/src/jjtl/lexer/lexer.ts:330` per la simmetria. Nessun test esistente da aggiornare;
tutti nuovi.

---

### 5.4 Punto 8 — la chiave del registro ammette uno scope non ancorato?

**No. `nodeId` e' obbligatorio.** Tipo esatto, `registry.ts:61-104`:

```ts
export interface NodeProblem {
    id: string;
    nodeId: string;          // <-- obbligatorio, non nullable, non opzionale, nessuna union
    kind: NodeProblemKind;
    severity: NodeProblemSeverity;
    title: string;
    description: string;
    relatedNodeIds: string[];
    action?: NodeProblemAction;
    conformance?: ConformanceProblemDetail[];
    ownerModelId?: string;
    createdAt: number;
    resolvedAt?: number;
}
```

**I punti che lo assumono** (tutti in `registry.ts` salvo dove indicato):

| Sito | Cosa assume |
|---|---|
| `rebuildSnapshots` `:126-146` | raggruppa **per `p.nodeId`**: e' l'unico indice del registro |
| `getNodeProblemsSnapshot(nodeId)` `:245-247` | l'**unica** lettura dei consumatori, per nodo |
| `clearProblemsByNode(nodeId)` `:213-223` | filtra su `p.nodeId` |
| `pauseTimersForNode` / `resumeTimersForNode` `:162-180` | filtrano su `p.nodeId` |
| `getIsHighlighted(nodeId)` `:277-282` | `active.relatedNodeIds.includes(nodeId)` |
| `setActiveOverlayProblemId` `:284-296` | naviga a `active.nodeId` per i timer |
| `ObjectNode.tsx:920, 1151, 1217` | monta l'indicatore con l'id del nodo RF (DVertex) |
| `TreeViewContent.tsx:898` | `problemKey = expandKey` (id entita'; `''` per le sezioni) |
| `IRForm.tsx:371` | `objectId` (id DObject) |
| `getProblemIdsOwnedBy` `:263-271` | e' **la sola enumerazione esportata**, e restituisce **solo id**, non entry |

**La diagnostica di modello e' oggi esclusa per costruzione.**
`conformanceToProblems.aggregateConformanceByObject:43`:
```ts
// model-level / unattachable violations do not go into the registry
if (!v.objectId || v.objectId === result.modelId) continue;
```
col commento `:29-31`: «not attachable to a node and only feed the toolbar pill».

**E la toolbar pill non e' piu' renderizzata.** `Toolbar.tsx:26-28`:
> «TODO: cleanup — `ValidationPill` is no longer rendered here (2026-08-26). The import is
> dropped, the component is not: it is the only conformance summary in the codebase and the
> aggregated Problems panel it defers to (WP2-D) is still to be built.»

e `Toolbar.tsx:988-991` ripete che e' stata ritirata e non ricollocata. Grep su tutto
`frontend/src`: le sole occorrenze di `ValidationPill` sono la sua definizione e questi due
commenti — **nessun sito di mount**.

Cioe': **oggi una diagnostica di modello viene calcolata (`validateConformance` produce i
`check_failed` e il post-pass CHECK-11 con `objectId === modelId`), poi scartata
dall'aggregatore, e la sola superficie che la mostrava e' spenta.** Non e' un rischio futuro,
e' lo stato corrente.

**Conseguenza per un vincolo con proprietario "radice"** (che il punto 6 rende un caso a se'):
non ha dove comparire. Le opzioni, in ordine di costo:

- **(a)** ancorarlo all'id del `DModel`. Il registry lo accetterebbe — e' una stringa e non
  valida nulla. Ma **nessun consumatore monta un indicatore su quell'id**: si registrerebbe e
  non si vedrebbe. Costo zero, effetto zero.
- **(b)** rendere `nodeId` opzionale, o unirlo a uno scope (`{kind:'model', modelId}`). E' una
  modifica **non additiva-opzionale** a un'interfaccia esportata (Regola 11) e tocca i sette
  siti della tabella sopra. Da autorizzare esplicitamente.
- **(c)** costruire il Problems panel aggregato che `Toolbar.tsx:26` rinvia (WP2-D) e leggere
  dal registro **per kind** invece che per nodo. Oggi quella lettura non esiste:
  `getProblemIdsOwnedBy` restituisce solo id, ed e' documentata come «the only enumeration of
  the registry exported» (`:251-252`). Andrebbe aggiunta una lettura (additiva, a basso
  rischio) piu' il pannello.

---

## 6. Dipendenze e rischi

### 6.1 Dipendenze fra i punti

```
Vincolo su classe M2                   Vincolo su "radice"
   │                                      │
   ├─ p.4 nuovo elemento contenuto        ├─ p.6: la radice NON e' tipata da una classe
   │   ├─ classi D/L + collezione         │   -> serve o una convenzione o un proprietario DModel
   │   ├─ Constructors + getCollection    │
   │   ├─ mappe di tipo (autorizzare)     └─ p.8: e comunque non ha superficie
   │   ├─ VersionFixer: 1 migrazione additiva
   │   └─ Ecore: export da scrivere (import c'e' solo per le annotation)
   │
   ├─ p.2 valutazione JjEL
   │   ├─ contesto: precedente createInstanceContext (self/source/it + appiattimento)
   │   ├─ nessun tri-stato -> politica del "non decide" da fissare  [D2]
   │   └─ navigazione su assente LANCIA -> serve un catch per vincolo
   │
   ├─ p.5 rivalutazione
   │   ├─ nessun "quali oggetti sono cambiati"
   │   └─ pattern disponibile: firma-selettore + debounce (rivalutazione TOTALE)
   │       └─ p.3: JjEL non da' un dependency set -> la firma sara' larga
   │
   └─ p.1 registrazione
       ├─ innesto pulito, ma un membro in piu' nella union NodeProblemKind
       └─ ancoraggio: DVertex per il canvas, DObject per tree e form -> doppia registrazione
```

### 6.2 Rischi

| # | Rischio | Evidenza | Gravita' |
|---|---|---|---|
| R1 | **Il vincolo che lancia.** `self.x.y` su un'istanza senza `x` solleva `JjelEvaluationError`, non ritorna falso. Senza `try/catch` per vincolo, un vincolo mal scritto rompe l'intero giro di validazione | sonda §5.3, `evaluator.ts:380-388` | **alta** |
| R2 | **Assente e nullo indistinguibili.** `null` e' sia "non c'e'" sia "e' null". Il solo canale che distingue e' `JjelWarning[]`, deduplicato per identificatore | `context.ts:13-20, 137-168`; sonda | **alta** |
| R3 | **Rivalutazione totale a ogni cambio.** Il pattern disponibile ricalcola tutto il modello. Con N vincoli x M istanze il costo si moltiplica; `useConformance` gia' occupa un debounce di 500 ms per conto suo | `useConformance.ts:79-117`; misure in `UniquenessProblemSync.tsx:43-46` | **alta** |
| R4 | **Perdita silenziosa all'export `.ecore`.** `hasChildren` non considera un contenuto nuovo, e `includeAnnotations` e' morta: qualunque forma si scelga, senza lavoro sull'export il vincolo non sopravvive al salvataggio in Ecore | `EcoreService.ts:42, 259`; grep a 2 occorrenze | **alta** |
| R5 | **Il vincolo di modello non ha superficie.** Registrarlo sull'id del DModel produce un'entry invisibile | `Toolbar.tsx:26`, `conformanceToProblems.ts:43` | **alta** se il caso "radice" e' in scope |
| R6 | **`NodeProblemKind` e' una union esportata.** Il terzo kind non e' una "proprieta' opzionale in piu'" ai sensi della Regola 11 | `registry.ts:28` | media, **da autorizzare** |
| R7 | **Le mappe di tipo in `joiner/classes.ts`.** Un nuovo D/L tocca 8+ catene condizionali nel file del cuore (Regola 5) | `classes.ts:511-518, 2490-2571` | media, **da autorizzare** |
| R8 | **Doppio ancoraggio o difetto noto.** Registrare solo sull'id dell'elemento riproduce il difetto gia' misurato su `UniquenessProblemSync` (pallino assente sul canvas) | `UniquenessProblemSync.tsx:58-63` | media |
| R9 | **`DClass.instances` inaffidabile** per gli oggetti appena creati; `LClass.allInstances` ci si appoggia | `eval.ts:104-107`; `LModelElement.tsx:3336` | media |
| R10 | **`.forAll` e la lambda `x:` non parsano.** Se la documentazione utente dei vincoli suggerisce `coll.forAll(x: pred)` — come fa oggi `CLAUDE.md §12.6` — ogni vincolo scritto cosi' e' un errore di parse | sonda §5.3 | media |
| R11 | **La migrazione VersionFixer e' obbligatoria** anche se non tocca `jsxString`: senza, `cls.<collezione>` e' `undefined` su ogni progetto salvato | `VersionFixer.tsx:487-505` come precedente | bassa (nota, non rischio, se ricordata) |
| R12 | **Nessun test end-to-end esistente** per un produttore del registro montato in EditorV2: i test presenti sono `conformanceToProblems.test.ts` (puro) e `UniquenessProblemSync.test.ts` (chiama `reconcileDuplicateProblems` esportata apposta, non il componente) | `problems/__tests__/` | bassa |

### 6.3 Cosa NON e' stato verificato

- Non ho eseguito `npm run build`, `npm run typecheck`, `npm run test`: giro read-only, nessun
  file di codice toccato. `frontend/src` e' rimasto pulito.
- Non ho misurato il costo di `validateConformance` su un modello reale (R3 e' argomentato
  sulla forma del codice e sulle misure di `detect*DuplicateNames`, non su una misura propria).
- Non ho verificato a schermo nessuno dei comportamenti UI descritti: le affermazioni su
  `ValidationPill` e sul pallino mancante vengono dal codice e dai commenti misurati che vi sono
  iscritti, non da uno smoke visivo.
- Non ho letto `ConformanceValidator.ts` per intero (34 KB): solo l'outline dei 12 CHECK e la
  forma delle `violations.push`.

---

## 7. Domande aperte per Alfonso

**D1 — Proprietario del vincolo.** Il punto 6 chiude la scorciatoia: la radice non e' un'istanza
di una classe. Il vincolo di modello e' **in scope** per la prima fetta, oppure ci si limita ai
vincoli su classe (che sono il caso pulito) e la radice si rimanda? La risposta cambia
completamente il punto 8: se e' fuori scope, il registro va bene com'e'.

**D2 — Politica del vincolo che non decide.** Un vincolo puo': valutare a `true`, a `false`, a
`null`, oppure **lanciare**. Le ultime due sono lo stesso caso agli occhi dell'utente ("il
vincolo non ha deciso") ma arrivano da meccanismi diversi. Quale politica?
- (i) silenzio — trattato come soddisfatto;
- (ii) `warning` di forma, distinto dalla violazione, che dice "il vincolo e' rotto, non il
  modello" (e' cio' che `check_failed` fa gia' per la conformance,
  `ConformanceTypes.ts:59-61`);
- (iii) violazione.
Consiglio nel referto: (ii), perche' esiste gia' un precedente esatto e perche' (i) nasconde i
vincoli mal scritti. Ma e' una decisione di prodotto.

**D3 — Forma del vincolo nel metamodello.** Tre vie, con costi molto diversi:
- (a) **elemento contenuto proprio** (`DConstraint` in `DClass.constraints`) — pulito
  concettualmente, ma e' il costo pieno del punto 4, mappe di tipo comprese (R7), piu' un
  export Ecore da scrivere (R4);
- (b) **`DAnnotation`** — il tipo esiste gia', l'import Ecore lo legge gia'
  (`api/data.ts:665`), e' la forma che EMF stesso usa per OCL. Costo: solo l'export (R4), zero
  modifiche a `joiner/classes.ts`. In cambio: nessuna tipizzazione, i vincoli sono coppie
  chiave/valore in mezzo alle altre annotation;
- (c) **fuori dal metamodello**, in una struttura di progetto a parte — nessun costo D-layer,
  ma il vincolo non viaggia col metamodello (ne' in export, ne' fra progetti).
Nota: `DViewElement` porta gia' un `//thiss.constraints = [];` commentato
(`joiner/classes.ts:1186`) e un flag `isValidation` — c'e' una storia precedente su cui potresti
avere contesto che il repo non ha.

**D4 — Granularita' della rivalutazione.** Il pattern disponibile e' totale (R3). Va bene per la
prima fetta — e' quello che fa la conformance oggi — o serve fin da subito qualcosa di
incrementale? Se serve incrementale, il punto 3 dice che JjEL non aiuta: la firma sarebbe
comunque larga.

**D5 — Superficie.** I vincoli utente devono comparire dove compaiono le violazioni di
conformance (pallino sul nodo + overlay + triangolo nell'albero + contatore nel form), o hanno
bisogno di una superficie propria? Se condividono, condividono anche il **conteggio**: il badge
somma `conformance?.length ?? 1` per entry (R e §4.1), quindi un vincolo utente varrebbe 1
accanto a N violazioni di conformance.

**D6 — `.forAll`.** Il difetto e' riprodotto e non corretto (come chiesto). Va aperto un giro a
parte prima della Fase 2 — perche' se la sintassi documentata dei vincoli usasse quella forma
ogni vincolo sarebbe un errore di parse (R10) — oppure la documentazione dei vincoli usa `all` /
`any` / `exists` e il fix resta un debito separato?

**D7 — `CLAUDE.md §12.6`.** La riga «JjEL forall: Boolean quantifier: `coll.forAll(x: pred)`»
e' falsa su entrambi i pezzi (§5.3). Va corretta in un giro di sola documentazione, o si lascia
al giro che sistemera' `.forAll`?

---

## 8. Stato dell'albero a fine giro

Nessun file di codice modificato. L'unico file scritto da questo giro e' questo referto.
Le due sonde vivono nella scratchpad di sessione, fuori dall'albero del repo.
