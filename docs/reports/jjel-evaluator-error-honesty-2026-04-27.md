# Discovery Report — JjEL evaluator error honesty

Data: 2026-04-27
Tipo: discovery (read-only). Zero modifiche al codice.
Scope: localizzare i punti in cui l'evaluator JjEL maschera errori (identifier irrisolti, property miss) come `null`, e mappare il canale di errore esistente verso la UI.

---

## 1. File dell'evaluator

- **Path principale**: `frontend/src/jjel/evaluator/evaluator.ts` (991 righe). Contiene la classe `JjelEvaluator` e la `function evaluate(expr, context)` di convenienza.
- **File correlati**:
  - `frontend/src/jjel/evaluator/context.ts` — `EvaluationContext`, `JjelValue` type union, `JjelObject`, `JjelFunction`, `TypeRegistry`, helpers `createFunction`/`isJjelFunction`/`isJjelObject`/`toJjelValue`/`fromJjelValue`.
  - `frontend/src/jjel/evaluator/modelContext.ts` — `extractAttributeValues` (estrazione attributi M1 da L-proxy).
  - `frontend/src/jjel/evaluator/builtins/` — strings, numbers, dates, collections (35+ metodi ciascuno).
  - `frontend/src/jjel/evaluator/index.ts` — barrel export del modulo evaluator.
  - `frontend/src/jjel/index.ts` — barrel top-level + funzione di convenienza `jjelEval(source, variables?)` che orchestra parse + evaluate.
- **Punto di ingresso pubblico**: `jjelEval(source: string, variables?: Record<string, JjelValue>): JjelValue` esportata da `frontend/src/jjel/index.ts:74`. Sincrono. Lancia `Error` (con prefisso `JjEL parse error:` o `JjEL evaluation error:`) su fallimenti del parser; lancia `JjelEvaluationError` (sottoclasse di `Error`) su fallimenti dell'evaluator.

---

## 2. Strategia di lookup

Lookup degli identificatori centralizzato in **un unico metodo**: `JjelEvaluator.evaluateIdentifier` in `evaluator.ts:182-195`.

```ts
private evaluateIdentifier(expr: IdentifierExpr, ctx: EvaluationContext): JjelValue {
    if (ctx.hasBuiltin(expr.name)) {
        return ctx.getBuiltin(expr.name)!;
    }
    if (ctx.has(expr.name)) {
        return ctx.get(expr.name)!;
    }
    // Undefined variable
    return null;
}
```

La catena:

1. Builtin registrato (`ctx.hasBuiltin`)
2. Variabile nel context scope chain (`ctx.has` → cerca dallo scope più interno verso l'esterno, vedi `context.ts:158-167`)
3. Altrimenti: **`return null`** silente, nessuna throw, nessun warn.

**Centralizzato — un solo punto.** Questo è il nodo principale del bug "1 e 2" della descrizione del prompt (identifier non definito → null silente; `1 + tr` → `tr` valutato silente come null, `+` riceve `(number, null)`, ricade nel ramo "non riconosciuto" e ritorna null — vedi sezione 4 sotto).

### Punti collaterali di null silente (mappati ma non centrali)

Oltre a `evaluateIdentifier`, l'evaluator ritorna `null` silenzioso in altri punti. Sono semanticamente differenti dal bug di error honesty, vanno comunque elencati per evitare di trattarli come dello stesso problema:

| Sito | Riga | Significato | Cambia in Fase 2? |
|---|---|---|---|
| `evaluateIdentifier` fallback | 194 | identifier irrisolto | **Sì, target principale** |
| `getProperty` su numeri/booleani fallback finale | 445 | property access su tipo non gestito | Probabilmente sì |
| `getProperty` su `JjelObject` con prop assente | 442 | property miss su oggetto (genera `console.warn` con suggerimento, poi ritorna null) | Probabilmente sì |
| `evaluateIndexAccess` su tipo non array/object | 853 | `obj[i]` con `obj` non indicizzabile | Discutere |
| `evaluateIndexAccess` index out of bounds | 848, 851 | indexing fuori range (esiste già un test che ne sancisce la semantica null: `evaluator.test.ts:214`) | **NO, semantica esplicita testata** |
| `evaluateBinary +` per tipi misti non gestiti | 221 | `a + b` quando nessuna combinazione type-matcha (string concat / number sum / array concat) | **Sì** — è qui che `1 + null` (da `1 + tr`) diventa null |
| `evaluateBinary -, *, /, %` per non-number | 227, 236, 243, 250 | aritmetica su non-numeri | **Sì** |
| `evaluateUnary -` per non-number | 298 | negazione su non-numero | **Sì** |
| `evaluateIfThenElse` senza else con cond falsy | 714 | `if false then x` senza else (test esplicito: `evaluator.test.ts:57`) | **NO, semantica esplicita testata** |

I punti "Sì" sono mascheramenti di errore. I punti "NO" sono semantica di linguaggio deliberata. I "Probabilmente sì/Discutere" sono ambigui e meritano discussione.

**Conteggio "punti distinti di null silente da fixare"**: minimo **3** (identifier, +, altri operatori aritmetici) — alla soglia del trigger "Stop & ask #2" (più di tre) ma sotto. Tecnicamente 1 punto principale (identifier) + 2 famiglie correlate (binary aritmetico, unary). Vedi sezione 9.

---

## 3. Distinzione null legittimo vs identifier non trovato

**Strutturalmente la distinzione esiste** già a livello di `EvaluationContext`:

- `EvaluationContext.get(name): JjelValue | undefined` — ritorna `undefined` se la chiave non esiste in nessuno scope (`context.ts:158-167`).
- `EvaluationContext.has(name): boolean` — basato su `get(name) !== undefined` (`context.ts:172-174`).

Quindi il context distingue tra "variabile assente" (`undefined`) e "variabile presente con valore null" (`null`). Il `JjelValue` type union (`context.ts:13-20`) non include `undefined`: `undefined` è un sentinel **esterno** al type system di JjEL, usato solo dall'API context per dire "not found".

**Il collasso avviene in `evaluateIdentifier`** (`evaluator.ts:194`): l'`undefined` ritornato dal context viene appiattito su `null` con un `return null` esplicito. È un'unica riga di codice, nessuna libreria, nessuna struttura sottostante da riprogettare.

Questo significa che la Fase 2 ha la libertà completa: può throware, può ritornare un sentinel custom (es. `JjelEvaluationError` invocato direttamente), può aggiungere un `undefined` al type union (più invasivo). La struttura non blocca nessuna scelta.

---

## 4. Property access

Centralizzato in `getProperty(obj, property)` in `evaluator.ts:332-446`, chiamato da:
- `evaluateMemberAccess` (`obj.prop`, righe 309-320) — throwa `JjelEvaluationError` se `obj === null`, altrimenti delega
- `evaluateNullSafeMemberAccess` (`obj?.prop`, righe 322-330) — ritorna null se `obj === null`, altrimenti delega

### Comportamento di `getProperty` per tipo

| Tipo di `obj` | Property nota (es. `length`, `first`, `toUpper`) | Property ignota |
|---|---|---|
| `Array` | Ritorna il valore (length, first, last, isEmpty, isNotEmpty) | **Throwa** `JjelEvaluationError` con messaggio che suggerisce `forall x in collection : x.${property}` (righe 351-353) |
| `string` | Ritorna il valore (length, isEmpty, toUpper, toLower, trim, ...) | Cade nel fallback finale → `return null` (riga 445) |
| `JjelObject` (con `className === 'DClass'` o `__isProxy`) | Gestisce `superclass`, `superclasses`, `allSuperclasses`, `subclass`, `subclasses`, `allSubclasses` (righe 388-422) | Continua al ramo generico oggetto |
| `JjelObject` generico | Se `property in obj` ritorna `obj[property] ?? null` (riga 427) | **Ritorna null + `console.warn`** con suggerimento Levenshtein o lista keys (righe 431-442) |
| `number`, `boolean`, `null`, `function` | N/A | Fallback finale `return null` (riga 445). `null` è già stato intercettato a monte da `evaluateMemberAccess` con throw. |

### Caso `collection.scalarProp` (D4)

**D4 risulta già parzialmente corretto.** Il caso `classes.name` produce oggi un throw esplicito:

```
Cannot access property 'name' on a collection. Use 'forall x in collection : x.name' to project it over each element.
```

(`evaluator.ts:351-353`)

**Da verificare con l'utente**: è D4 davvero ancora aperto come descritto in `contesto_progetto.md`, o è già stato risolto in una sessione precedente non trascritta nel context del prompt? L'evaluator attuale lo gestisce — quindi o D4 è obsoleto, oppure il bug riportato è di forma diversa (es. property non-scalare? collection di un tipo diverso?). Vedi sezione 9.

### Caso "object property miss" → `null` + warn

Per `objectInstance.unknownProp`, il comportamento è:
1. `console.warn` con suggerimento Levenshtein o lista keys (`evaluator.ts:435-440`)
2. `return null`

Quindi **per la console** l'utente vede `null` senza segnali (i `console.warn` finiscono nella DevTools del browser, non nella REPL). Questa è disonestà silente uguale al bug "1" (identifier non trovato). Da sistemare in Fase 2 insieme.

---

## 5. Console UI

- **File**: `frontend/src/components/editors/Console.tsx` (la console standalone JjEL/JS, a 989+ righe). La UI di Jodie code-mode è separata (`frontend/src/components/Jodie/ChatMessages.tsx` `CodeReplEntry`) ma usa lo stesso evaluator via `jodieJjelContext.ts`.
- **Canale di errore separato**: **sì.** Il blocco JjEL execution (Console.tsx:671-712) ha try/catch. L'output è poi confezionato in un `ConsoleEntryData` con discriminator `type: 'error' | 'result'` (riga 742). Il rendering CSS si basa su questo `type` per colorare rosso vs grigio. **Nessuna modifica UI necessaria** per supportare nuovi error throw dall'evaluator: basta che `jjelEval` lanci, il try/catch cattura, `hasError = true`, l'entry diventa `type: 'error'` e renderizza in rosso.
- **Shape del result**:
  ```ts
  // ConsoleEntryData (definito in Console.tsx attorno a riga 100-150 — non riletto integralmente)
  {
      id: string;
      type: 'command' | 'result' | 'error' | 'info' | 'help';
      timestamp: Date;
      content: string;     // testo serializzato
      input: string;       // espressione originale
      collapsed: boolean;
      language: 'jjel' | 'js';
      // (e altri campi opzionali)
  }
  ```
  Il `content` è una stringa già stringificata. Per errori contiene il messaggio (con il prefisso `JjEL parse|evaluation error:` strippato a Console.tsx:698). Per success contiene il valore serializzato via `safeStringify` o coerced a stringa.

- **Separazione parse error vs eval error**: già fatta upstream nello stripping del prefisso (`Console.tsx:698`). La UI non distingue tra i due tipi di error: tutto va in `type: 'error'`. Sufficiente per la Fase 2.

- **Per la Jodie code-mode REPL** (`ChatMessages.tsx` `CodeReplEntry`): consume `CodeEntry.output` che è `{ ok: true; value: unknown } | { ok: false; error: string }` (vedi `types/jodie.ts`). Anche qui il canale errore esiste già, popolato da `evaluateJjelInJodie` che cattura i throw (`jodieJjelContext.ts:73-75`). **Anche qui zero modifiche UI necessarie.**

---

## 6. Test esistenti

- **File**: `frontend/src/jjel/__tests__/evaluator.test.ts` (368 righe), `frontend/src/jjel/__tests__/parser.test.ts` (519 righe).
- **Test totali sull'evaluator**: **90** (count via `grep -c "^\s*test("`). Coprono literals, arithmetic, comparison, logical, null coalesce, if/then/else, string methods, collection methods, implies, forall, exists, with...do, array indexing, object literals, truthiness, FunctionCall (3 test).
- **Test su identifier-not-found**: **0.** Nessun test verifica che `eval_('nonExistentVar')` su un context vuoto produca un errore (oggi ritorna null silente, nessun test sancisce questa semantica).
- **Test su property-not-found su oggetto**: **0.** Nessuno verifica che `eval_('{a:1}.b')` ritorni qualcosa di specifico (oggi: null + console.warn).
- **Test su FunctionCall undefined**: **3** (righe 356, 359-361, 363-367). Già esistono e già verificano che lanci. Sono il modello per i nuovi test che la Fase 2 aggiungerà.

### Snapshot/test che la Fase 2 dovrà preservare o aggiornare

Test che sanciscono comportamenti esistenti coerenti con la spec, da **NON** rompere:
- `'out of bounds = null'` (riga 214): `[1,2,3][9]` → null. È semantica IndexAccess, non identifier resolution.
- `'if false then 1 (no else) = null'` (riga 57): conditional senza else → null. Semantica deliberata.
- `'sortBy on array of objects'` e altri test che usano property access su oggetti generici (`x.n`, `c.attributes`): la property esiste sull'oggetto, il fix non li tocca.

Nessuno snapshot da invalidare. La Fase 2 aggiungerà nuovi test, non riscriverà gli esistenti — eccetto eventualmente quelli che testano combinatori binari su tipi misti (oggi `null + 1 = null`), se la Fase 2 cambia anche quelli.

---

## 7. String-similarity utility

- **Esistente nel codebase**: **sì, in più punti.** Cinque implementazioni separate di Levenshtein (e `findSimilarProperty`):

| Path | Tipo | Visibilità |
|---|---|---|
| `frontend/src/jjel/evaluator/evaluator.ts:535-564` | `levenshteinDistance` | **private method della classe `JjelEvaluator`** — già usata da `findSimilarProperty` (`evaluator.ts:507-530`) per i warn di property miss |
| `frontend/src/jjscript/parser/grammar.ts:444-...` | `levenshteinDistance` | function modulo, JjScript |
| `frontend/src/jjscript/executor/errors.ts:325-...` | `levenshteinDistance` | function modulo, JjScript |
| `frontend/src/jjscript/executor/commands/set.ts:290-...` | `levenshtein` | function modulo, JjScript |
| `frontend/src/jjscript/autocomplete/...` | `fuzzy` (vari) | autocomplete |

**Per Fase 2**: il Levenshtein nel JjelEvaluator è già lì e già funzionante. Riusabile direttamente — basta esporlo come metodo private o spostarlo a function modulo. Zero need di nuove utility o dipendenze.

**Convenzione codebase (CLAUDE.md)**: nessuna regola contro `levenshteinDistance` duplicato. Refactoring per centralizzare le 5 implementazioni è fuori scope — segnalato qui per visibilità.

---

## 8. Backward compatibility

Call sites di `jjelEval` o `JjelEvaluator` esterni a `frontend/src/jjel/`:

| Path | Funzione | Wrapping | Comportamento su throw |
|---|---|---|---|
| `frontend/src/jjscript/executor/commands/eval.ts:37` | `executeEval` (JjScript `eval` command) | try/catch (28-80) | Catturato, formato come `ExecutionResult` con `success: false`. **Già robusto.** Inoltre c'è un workaround alle righe 41-52 che intercetta `result === null && isBareIdentifier(...)` per mascherare l'attuale silenzio — questo workaround diventa **dead code** dopo la Fase 2 (l'evaluator non ritornerà più null silente per bare identifier). Da rimuovere. |
| `frontend/src/jjscript/executor/commands/let.ts:132` | `evaluateJjel` (helper interno) | Implicit: chi chiama `evaluateJjel` (executeLet) ha try/catch | Catturato a livello executor. **Già robusto.** |
| `frontend/src/jjscript/executor/commands/forall.ts:38, 57` | `executeForAll` | try/catch (30-...) | Catturato. **Già robusto.** |
| `frontend/src/components/editors/Console.tsx:690` | console JjEL execution | try/catch (673-700) | Catturato, `hasError = true`. **Già robusto.** |
| `frontend/src/components/Jodie/jodieJjelContext.ts:71` | `evaluateJjelInJodie` (Jodie code-mode) | try/catch (69-76) | Catturato, ritorna `{ok: false, text}`. **Già robusto.** |
| `frontend/src/jjtl/executor/executor.ts:2015` | `evaluatePropertyPath` (JjTL strategy 3 di 4) | try/catch (2014-2020) | Catturato, fallthrough a strategy 4 (manual traversal). **Già robusto.** |
| `frontend/src/jjtl/executor/executor.ts:2087, 2402` | `JjelEvaluator.evaluate` direct | Catch upstream nei chiamanti del JjTL executor | Da verificare in dettaglio se cambi il policy: il JjTL executor usa l'evaluator anche per espressioni "veloci" dove il null-fallback è la norma. Se in Fase 2 si cambia la policy, **alcuni path JjTL potrebbero degradare da "ritorna null" a "throw"** che propaga fino al chiamante. Probabilmente ok perché il chiamante alto-livello cattura comunque, ma da verificare nel prompt di Fase 2. |

**Dipendenze sul "null come success path"**:

- **JjTL `evaluatePropertyPath`** (executor.ts:1994-2039): il pattern di 4 strategie fallback usa il null restituito da jjelEval come "non trovato, prova la strategia successiva". Se l'evaluator passa da "null silente" a "throw", il try/catch alla strategia 3 cattura il throw e fa fallthrough alla strategia 4 — comportamento equivalente, **non regressivo**. Ma il warn console.warn alla riga 2019 diventerà più rumoroso (ogni miss ora genererà uno warn). Da decidere se silenziare il warn per il caso "expected miss" o accettare il rumore.

- **JjScript `eval.ts` workaround** (righe 41-52): codice esplicitamente di compensazione per il bug attuale. **Diventa dead code** in Fase 2. Da rimuovere insieme.

- **Test `'out of bounds = null'`** (`evaluator.test.ts:214`): usa IndexAccess, non identifier resolution. Non impattato.

- **Nessun call site assume `null = success path` per identifier o property access.** Tutti trattano null come "non interessante" o lo wrappano in error checks. La compatibilità è praticamente garantita.

---

## 9. Stop & ask occorsi

Tre punti che richiedono conferma esplicita prima di procedere alla Fase 2:

1. **D4 sembra già risolto per il caso `classes.name`**. L'evaluator oggi throwa con un messaggio che suggerisce `forall`. Il prompt Fase 1 elenca D4 come bug aperto (citando `contesto_progetto.md`). **Domanda**: è una versione obsoleta della descrizione del bug, oppure il bug riportato in `contesto_progetto.md` ha forma diversa (es. una collection di tipo non-array, una property che si aspetta come "scalar but array"...) che il fix attuale non copre? Necessario chiarire prima della Fase 2 per non farlo target di un fix doppio.

2. **`contesto_progetto.md` non esiste nel repo** (almeno non con quel nome — `find / -name "contesto_progetto.md"` → 0 hit). Il prompt lo cita come fonte di D4 e di altre informazioni. **Domanda**: dove vive il documento? È fuori dal repo (Notion, Drive)? Ne serve una copia per la Fase 2? Per ora il report assume la descrizione di D4 fornita nel prompt come autoritativa.

3. **Soglia "più di tre punti distinti di null silente"** (Stop & ask #2 della spec): il conteggio dei siti dipende dalla granularità.
   - Se contiamo "punti di codice" (linee distinte di `return null`): sono **5+** (vedere tabella sezione 2). Trigger Stop & ask #2.
   - Se contiamo "famiglie semantiche di disonestà" (identifier resolution + binary operator type-mismatch + property miss): sono **3 famiglie**. Sotto soglia.

   **Raccomandazione**: trattare il fix come "famiglia identifier resolution" come scope primario della Fase 2 (1 punto: `evaluateIdentifier`). Le altre famiglie (binary aritmetico, property miss) **discusse separatamente** prima del fix, perché toccano semantica del linguaggio (l'utente potrebbe volere `null + 1 = null` come pattern OCL-like, oppure error). Senza decisione esplicita, il fix sull'identifier risolve già il caso 1 (`tr`) e — di rimbalzo — il caso 2 (`1 + tr`), perché `tr` throwerà prima che il `+` sia valutato. **Questo è il fix chirurgico minimo, e lo raccomando**.

Nessun blocco di tipo 1, 4 o 5 della spec (evaluator localizzato, UI ha canale errore, Levenshtein esiste già).

---

## 10. Raccomandazione preliminare per Fase 2

**Fix chirurgico singolo punto**: `evaluator.ts:182-195` (`evaluateIdentifier`). Sostituire `return null` con un `throw new JjelEvaluationError(...)` con messaggio del tipo:

```
Unknown identifier '${expr.name}'. Did you mean '${suggestion}'?
```

Riusare `findSimilarProperty` esistente (privato della classe stessa, `evaluator.ts:507-530`) passando come `candidates` la lista delle chiavi disponibili: `[...ctx.builtins.keys(), ...allScopeKeys]`. Per ottenere `allScopeKeys` aggiungere un metodo `EvaluationContext.allKeys()` o esporre `scopes` via getter.

**File toccati (stima Fase 2)**:
- `frontend/src/jjel/evaluator/evaluator.ts` — la modifica chirurgica (~10 LOC nel metodo + ~5 LOC per la lista dei candidati)
- `frontend/src/jjel/evaluator/context.ts` — nuovo metodo `allKeys()` per esposizione (~5 LOC)
- `frontend/src/jjscript/executor/commands/eval.ts` — rimozione del workaround righe 41-52 (~12 LOC delete) ora dead code
- `frontend/src/jjel/__tests__/evaluator.test.ts` — nuovi test per identifier-not-found, ~5-8 test (~30 LOC)
- `frontend/src/jjtl/executor/executor.ts` — eventuale silenziamento warn linea 2019 nel caso "expected miss" della strategy 3 (opzionale, ~2 LOC)

**Stima totale diff**: ~70 LOC, di cui ~25 di rimozione (dead code) e ~45 di aggiunta.

**Fuori scope (richiede discussione separata prima)**:
- Property miss su oggetto generico (`getProperty` riga 442): se rimpiazzare warn+null con throw, oppure mantenere warn (per compatibilità con i pattern OCL "navigazione tollerante")
- Binary/unary type mismatch (righe 221, 227, etc.): cambiare anche questi a throw cambia il dialetto del linguaggio — discutere con l'utente
- D4: confermare se aperto o chiuso (vedi sezione 9 punto 1)
