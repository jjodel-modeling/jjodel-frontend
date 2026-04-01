# JjEL Delegation Architecture: JjTL → JjEL → JjScript

> Report di esplorazione per replicare in JjScript lo stesso meccanismo di delegation che JjTL usa verso JjEL.

---

## 1. Schema di Delegation in JjTL

```
JjTL Source Code
      ↓ parse()
JjTL AST (ExpressionAST nodes)
      ↓ executor.evaluateExpression(expr, ctx)
      │
      ├─ [standalone FunctionCall + Identifier callee]
      │     ctx.getBuiltin(fnName).call(args, ctx)     ← helper/resolve bypass
      │
      └─ [everything else]
            toJjelAst(expr)                             ← astBridge converts AST
                  ↓
            JjEL AST (JjelExpression nodes)
                  ↓
            this.jjelEvaluator.evaluate(jjelExpr, ctx)  ← same EvaluationContext
                  ↓
            JjelValue                                   ← result
```

### Punti chiave

- **Un solo JjelEvaluator persistente** — `private jjelEvaluator: JjelEvaluator = new JjelEvaluator()` (executor.ts:285). Riusato per tutta l'esecuzione, preserva builtins registrati.
- **Il contesto è condiviso per riferimento** — lo stesso oggetto `EvaluationContext` creato dall'executor viene passato direttamente a `jjelEvaluator.evaluate()`. Nessuna traduzione.
- **Standalone function calls bypassano il bridge** — se `expr.type === 'FunctionCall'` e `callee.type === 'Identifier'`, l'executor cerca un builtin nel contesto e lo chiama direttamente, senza passare per JjEL. Questo gestisce helper functions e resolve().

---

## 2. Firma Esatta dell'Interfaccia di Delegation

### 2.1 Entry Point — `evaluateExpression` (executor.ts:1562)

```typescript
// Punto di delegation centrale: ogni espressione JjTL passa di qui
private evaluateExpression(expr: ExpressionAST, ctx: EvaluationContext): JjelValue {
    // Step 1: intercetta standalone function calls
    if (expr.type === 'FunctionCall' && expr.callee.type === 'Identifier') {
        const fnName = expr.callee.name;
        const builtin = ctx.getBuiltin(fnName);
        if (builtin) {
            const args = expr.arguments.map(arg => this.evaluateExpression(arg, ctx));
            return builtin.call(args, ctx);
        }
    }
    // Step 2: tutto il resto → bridge → JjEL
    const jjelExpr = toJjelAst(expr);
    return this.jjelEvaluator.evaluate(jjelExpr, ctx);
}
```

### 2.2 Bridge — `toJjelAst` (astBridge.ts:57)

```typescript
export function toJjelAst(expr: ExpressionAST): JjelExpression
```

Funzione pura, senza side-effects. Converte ricorsivamente nodi JjTL AST in nodi JjEL AST. Conversioni principali:

| JjTL AST type | JjEL AST type | Note |
|---|---|---|
| `Literal` | `Literal` | literalType remappato (string→EString, number→EInt, boolean→EBoolean) |
| `Identifier` | `Identifier` | passthrough diretto |
| `MemberAccess` | `MemberAccess` | ricorsivo su object |
| `FunctionCall` (con MemberAccess callee) | `MethodCall` | `obj.method(args)` |
| `FunctionCall` (con Identifier callee) | `Identifier` | gestito dall'executor, non da JjEL |
| `BinaryExpression` | `Binary` | operatori normalizzati: `=`→`==`, `<>`→`!=`, `&&`→`and`, `\|\|`→`or` |
| `ConditionalExpression` | `IfThenElse` | |
| `NullCoalesceExpression` | `NullCoalesce` | |
| `LambdaExpression` | `Lambda` | |
| `ArrayLiteral` | `ArrayLiteral` | |
| `JjelExpression` (wrapper) | inner expression | unwrap diretto |

### 2.3 Evaluator — `JjelEvaluator.evaluate` (evaluator.ts:117)

```typescript
evaluate(expr: JjelExpression, ctx?: EvaluationContext): JjelValue
```

- `ctx` opzionale: se passato (come fa l'executor), usa quello; altrimenti usa `this.context`
- Dispatch ricorsivo su `expr.type` per tutti i tipi di nodo JjEL
- Ritorna `JjelValue` (string | number | boolean | null | array | object | JjelFunction)

### 2.4 Convenience function — `jjelEval` (jjel/index.ts:74)

```typescript
export function jjelEval(expression: string, context?: Record<string, any>): any
```

Usata come fallback in `evaluatePropertyPath` per valutare stringhe raw. Crea un `JjelEvaluator` fresco ad ogni chiamata (non riusa il persistente). Usata solo per property paths che falliscono le strategie dirette.

---

## 3. Struttura del Contesto JjEL in JjTL

### 3.1 EvaluationContext (context.ts)

```typescript
class EvaluationContext {
    private scopes: Map<string, JjelValue>[] = [];   // stack di scope Maps
    private builtins: Map<string, JjelFunction>;      // flat, non-scoped
    readonly typeRegistry: TypeRegistry;

    constructor(initialBindings?: Record<string, JjelValue>, typeRegistry?: TypeRegistry)
    get(name: string): JjelValue | undefined           // cerca dall'innermost all'outermost
    set(name: string, value: JjelValue): void           // scrive nello scope corrente
    child(bindings?: Record<string, JjelValue>): EvaluationContext  // fork con nuovo scope
    registerBuiltin(name: string, fn: JjelFunction): void
    getBuiltin(name: string): JjelFunction | undefined
}
```

**child()** — crea un context figlio che eredita tutti gli scope del padre (shallow copy dell'array, Map condivise per riferimento) + un nuovo scope vuoto in cima. I builtins sono condivisi per riferimento (stessa Map).

### 3.2 Come l'executor costruisce il contesto

**Fase 1 — initializeContext() (executor.ts:506):**
```typescript
this.context.evalContext = new EvaluationContext({
    source: shallowToJjelValue(sourceModel),
    data:   shallowToJjelValue(sourceModel),
});
```

**Fase 2 — registerHelpers() (executor.ts:596):**
```typescript
// Per ogni helper dichiarato nel JjTL
this.context.evalContext.registerBuiltin(helper.name, createHelperFunction(helper));
```

**Fase 3 — resolve/resolveAll come builtins:**
```typescript
this.context.evalContext.registerBuiltin('resolve', createFunction(...));
this.context.evalContext.registerBuiltin('resolveAll', createFunction(...));
```

**Fase 4 — createInstanceContext() (executor.ts:1463) — per ogni source instance:**
```typescript
private createInstanceContext(sourceInstance: any): EvaluationContext {
    const bindings: Record<string, JjelValue> = {
        source: shallowToJjelValue(sourceInstance),
        self: shallowToJjelValue(sourceInstance),
        it: shallowToJjelValue(sourceInstance),
    };
    // + tutte le proprietà dell'istanza come bindings individuali
    // + valori M1 estratti da $attrName.value pattern
    return this.context.evalContext.child(bindings);
}
```

Il child context eredita automaticamente helper functions e resolve/resolveAll dai builtins del parent.

### 3.3 ForAll — scope nidificati

```typescript
// executeForAllMapping (executor.ts:1325)
const collection = this.evaluateExpression(forall.collection, instanceCtx);
for (const element of collection) {
    const forallCtx = instanceCtx.child({
        [forall.variable]: shallowToJjelValue(element)
    });
    // ... usa forallCtx per valutare body
}
```

---

## 4. JjScript Oggi — Gap Analysis

### 4.1 Architettura attuale

```
User Input → normalizer → parse() → CommandNode AST → extractDependencies()
    → waitForDependencies() → executeAST() → command handler → Redux actions
```

### 4.2 Cosa ha JjScript

| Componente | Esiste? | Dettaglio |
|---|---|---|
| Parser | ✅ | Recursive descent, produce CommandNode AST |
| Executor | ✅ | JjScriptExecutor con dispatch per comando |
| Context | ✅ parziale | ExecutionContext con projectId, modelId, selectedElement |
| Variables map | ✅ dichiarata | `variables: Map<string, any>` — **mai usata** |
| Element resolution | ✅ | resolveElement() con 3 strategie fallback |
| Dependency waiting | ✅ | Polling Redux store asincrono |
| Expression evaluation | ❌ | Nessuna — solo literal values e qualified names |
| JjEL integration | ❌ | Zero import da `../jjel/` |
| Builtin functions | ❌ | Nessun meccanismo |

### 4.3 Cosa manca per replicare la delegation JjTL→JjEL

| Gap | Descrizione | Complessità |
|---|---|---|
| **1. Expression parsing** | JjScript non ha nodi AST per espressioni. Il parser riconosce solo literal values. Serve: o riusare il parser JjEL per le espressioni inline, o aggiungere nodi espressione al parser JjScript. | Media |
| **2. AST Bridge (o bypass)** | JjTL ha bisogno del bridge perché ha il suo AST distinto. JjScript potrebbe: (a) parsare direttamente con il lexer/parser JjEL e ottenere JjelExpression AST, oppure (b) creare il suo bridge. L'opzione (a) è più semplice. | Bassa se si sceglie (a) |
| **3. JjelEvaluator istanza** | Serve un'istanza persistente di JjelEvaluator nell'executor JjScript, come fa JjTL. | Bassa — poche righe |
| **4. EvaluationContext per JjScript** | Serve costruire un context che esponga: metamodello corrente, classi, attributi, riferimenti, elemento selezionato. Analogo a `createInstanceContext()` di JjTL ma con binding diversi. | Media |
| **5. Builtins specifici** | JjScript potrebbe voler registrare builtins specifici (es. `resolve()` per risolvere nomi qualificati nel metamodello corrente). | Bassa |
| **6. Punti di injection nel parser** | Decidere DOVE nel parser JjScript le espressioni JjEL sono ammesse: valori in `set`, filtri in `list`, condizioni in comandi futuri? | Decisione architetturale |

---

## 5. Stima di Complessità

### Verdetto: Integrazione chirurgica, NON refactoring

L'architettura JjEL è già progettata per essere riusata:

1. **EvaluationContext.child()** permette di iniettare bindings custom senza modificare il contesto globale
2. **registerBuiltin()** permette di aggiungere funzioni domain-specific
3. **JjelEvaluator.evaluate()** accetta un context esterno come parametro
4. **Il parser JjEL** (`jjel/parser/parser.ts`) è standalone e può parsare qualsiasi espressione JjEL da stringa

### Stima per comando

| Intervento | File da modificare | Effort |
|---|---|---|
| Aggiungere `JjelEvaluator` + `EvaluationContext` all'executor JjScript | `jjscript/executor/executor.ts` | ~20 righe |
| Costruire context con metamodello corrente | `jjscript/executor/executor.ts` o nuovo `jjscript/executor/jjelContext.ts` | ~50-80 righe |
| Modificare `set` per accettare espressioni | `jjscript/executor/commands/set.ts` + `jjscript/parser/parser.ts` | ~30 righe per file |
| Aggiungere filtro espressioni a `list` | `jjscript/executor/commands/list.ts` + parser | ~40 righe per file |
| Nuovo comando `eval` (REPL-style) | Nuovo command handler + parser rule | ~60 righe totali |

**Effort totale stimato:** ~200-300 righe di codice nuovo, 0 righe di refactoring del codice esistente.

### Approccio raccomandato

```
JjScript Input: "set MyClass.abstract = name.endsWith('Base')"
                                        ↑
                            questo è un'espressione JjEL
      ↓
JjScript Parser
  - riconosce "set" command
  - dopo "=", invoca jjelParser.parse(remainingTokens)
  - ottiene JjelExpression AST
      ↓
JjScript Executor
  - costruisce EvaluationContext con bindings metamodello
  - chiama jjelEvaluator.evaluate(jjelExpr, ctx)
  - usa il risultato come valore per SetFieldAction
```

Questo approccio:
- **Non richiede un AST bridge** — JjScript può usare direttamente il parser JjEL per ottenere nodi JjelExpression
- **Non duplica logica** — riusa evaluator e context identici a JjTL
- **È incrementale** — si può iniziare con `set` e `eval`, poi estendere ad altri comandi

---

## Appendice: File di Riferimento

| File | Ruolo nella delegation |
|------|----------------------|
| `frontend/src/jjtl/executor/executor.ts` | Executor JjTL — `evaluateExpression()` (L1562), `createInstanceContext()` (L1463) |
| `frontend/src/jjtl/executor/astBridge.ts` | Bridge JjTL→JjEL — `toJjelAst()` (L57) |
| `frontend/src/jjel/evaluator/evaluator.ts` | Evaluator — `evaluate()` (L117), `child()` (L919) |
| `frontend/src/jjel/evaluator/context.ts` | Context — `child()` (L205), `get()` (L158), `registerBuiltin()` |
| `frontend/src/jjel/index.ts` | Export `jjelEval()` (L74) — convenience string→value |
| `frontend/src/jjscript/executor/executor.ts` | Executor JjScript — punto di integrazione futuro |
| `frontend/src/jjscript/types.ts` | ExecutionContext — `variables: Map<string, any>` (mai usata) |
| `frontend/src/jjscript/executor/commands/set.ts` | Primo candidato per accettare espressioni JjEL |
| `frontend/src/jjscript/executor/utils.ts` | `getActiveMetamodel()` — contesto corrente per JjEL |
