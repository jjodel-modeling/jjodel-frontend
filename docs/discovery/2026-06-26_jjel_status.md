# Discovery — Stato dell'implementazione di JjEL (per chiusura claim Ch8 / Ch6 §6.4–§6.5)

**Data**: 2026-06-26
**Tipo**: discovery — READ-ONLY (nessuna modifica al codice, nessun commit)
**Repo / branch**: `jjodel-modeling/jjodel-frontend` @ `alfonso-frontend-jjtl` (working tree; il repo pubblico è indietro)
**Scope**: analisi statica con evidenza `file:riga`. Nessun dev server avviato.
**Metodo**: lettura diretta del core (`jjel/**`, `jjscript/executor/commands/eval.ts`,
`jjtl/executor/executor.ts`, `LModelElement.tsx`) + 3 agenti Explore in parallelo per le
superfici (built-in registry, superfici view, validazione/ECA/attribute-assignment).
Verificato contro il codice corrente (non contro la memoria/discovery 2026-06-11, che
precede lo Stage 1 committato `65376be13` del 2026-06-12 — cfr. CLAUDE.md §5.1).

---

## 0. Tabella riassuntiva

| Punto | Stato | file:riga di prova | Nota |
|---|---|---|---|
| **A1** evaluator unico (Console/attr-assign/ECA/validazione/JjTL/JjScript) | **IMPLEMENTED** | `jjel/evaluator/evaluator.ts:72` (`class JjelEvaluator`); call-site §A | un solo `JjelEvaluator`; JjTL delega via `astBridge`, non ha evaluator proprio |
| **A2** superfici view usano lo STESSO evaluator? | **NO — motori separati** | `selectors.ts:356`, `ocl.tsx:127`, `reducer.ts:983`/`:1006`, `edgeExpressionEval.ts:64` | predicate=recognizer+OCL.js+`new Function`; template=`JSXT`+`new Function`; edge=path-eval ristretto |
| **B1** forall / exists / implies | **IMPLEMENTED** | `evaluator.ts:911` / `:929` / `:899`; `parser.ts:643`/`:684`/`:143` | `forall` = set-comprehension (ritorna array); `exists` = bool; `implies` = vacuous truth |
| **B2** operatore uguaglianza canonico | **IMPLEMENTED = `==`** | `tokens.ts:59-60`; `parser.ts:205`; `evaluator.ts:319-323`; `lexer.ts:132` | `=` singolo è **errore di lex**; non esiste `=` in JjEL. `=>` = lambda |
| **B3** and / or eager o short-circuit | **EAGER (non short-circuit)** | `evaluator.ts:268-271` poi `:338-342` | entrambi gli operandi sono SEMPRE valutati (U5) |
| **C1** optional chaining `?.` / nullish `??` | **IMPLEMENTED** | `?.` `evaluator.ts:388`/`:682`; `??` `:836`; parser `:364`/`:124` | |
| **C2** null in navigazione / forall | **IMPLEMENTED (semantica definita)** | throw `:378-382`/`:671-676`; forall→`[]` `:913`; prop assente→null `:513-540` | accesso non-safe su null **lancia**; combinato con B3 → guard `x!=null and x.f` lancia comunque |
| **D1** metodi naming-convention | **PARTIAL** | `strings.ts:32/50/60/70/81` | snake/camel/pascal/kebab/capitalize/uncapitalize ✓; screamingSnake/titleCase ✗ |
| **D2** metodi stringhe/collezioni/numeri/date | **IMPLEMENTED** | reg. `collections.ts:556`, `strings.ts:306`, `numbers.ts:271`, `dates.ts:438`/`:484` | 32 + 36 + 35 + 36 + 5(ctor) = 144 |
| **D3** closure() / descendants / ancestors | **NOT-YET** | nessun match | conferma roadmap (U3). NB: gerarchia di CLASSE sì → `evaluator.ts:470-509` |
| **E1** `<Class>.instances`/`allInstances` con oggetti CONTENUTI | **IMPLEMENTED (pieno)** | `eval.ts:106-111`,`:199`,`:186-204`; `LModelElement.tsx:5531-5562` | pool = `m.allSubObjects` = TUTTI i DObject del modello (contenimento-indipendente) |
| **E2** access piano + API raw `$` | **IMPLEMENTED, convergono** | `modelContext.ts:23-83`; `eval.ts:554-646`; `Console.tsx:682-684` | `$slot.value` (L-proxy) → proiettato a chiavi piane sul handle |
| **F1** predicate: solo type-test o anche per attributo | **recognizer, NON JjEL** | `selectors.ts:356` (`appliableToClasses`); predicazione→`ocl.tsx`/`reducer.ts` | attr-predication via OCL o JS, mai JjEL |
| **F2** `appliableToClasses` = lista → multi-metaclasse senza disgiunzione | **IMPLEMENTED** | `selectors.ts:356-372` | itera la lista; EXACT_MATCH o sottoclasse |
| **F3** edge expr: path-only? può nominare il container? | **path-only; container via `$container` slot, non `eContainer`/`$parent`** | `edgeExpressionEval.ts:64` + JSDoc `:11-37` | no condizioni/lambda/OCL |
| **F4** raw-`$` use-sites {template, edge, event} | **CONFERMATO** | `defaultViewTemplate.ts:48`/`:158`; `edgeExpressionEval.ts`; `reducer.ts:944` | nessun altro use-site nel view layer |
| **G1** invarianti: solo Console o `validateModel()` cablato? | **solo Console (manuale); nessun pannello JjEL** | `jjscript/.../validate.ts:62-366` | `validate` fa controlli STRUTTURALI, non JjEL |
| **H1** call-site `jjelEval(source, variables)` stesso evaluator di A | **IMPLEMENTED (stesso)** | `eval.ts:38`, `forall.ts:38/57`, `let.ts:132`, `executor.ts:2015`, `Console.tsx:690`, `jodieJjelContext.ts:67` | tutti → `jjel/index.ts:74` → `new JjelEvaluator` |

Legenda: IMPLEMENTED = cablato ed eseguibile · PARTIAL = parzialmente · NOT-YET = assente/roadmap.

---

## A. Unicità dell'evaluator

### A1 — Un solo evaluator condiviso

Esiste **una sola** classe evaluator: `JjelEvaluator` (`jjel/evaluator/evaluator.ts:72`),
con un unico `switch` di dispatch (`evaluator.ts:148-197`). Le API pubbliche (`evaluate`
`:1095`, `jjelEval` `jjel/index.ts:74`, `jjelEvalWithDiagnostics` `jjel/index.ts:124`)
istanziano tutte la stessa classe.

Call-site dei sei contesti del libro:

| Contesto | file:riga | Come invoca | JjEL? |
|---|---|---|---|
| JjScript `eval` | `jjscript/executor/commands/eval.ts:38` | `jjelEval(expression, variables)` | sì |
| JjScript `forall` | `jjscript/executor/commands/forall.ts:38,57` | `jjelEval` (collection + filter) | sì |
| JjScript `let` | `jjscript/executor/commands/let.ts:132` | `jjelEval(expr, variables)` | sì |
| Console — Jodie code mode | `components/Jodie/jodieJjelContext.ts:67` | `jjelEvalWithDiagnostics` (ctx = `buildEvalContext`) | sì |
| Console — standalone (view/template code mode) | `components/editors/Console.tsx:690` | `jjelEval` (ctx PROPRIO: `flattenProxyContext`+`extractAttributeValues`, `Console.tsx:682-685`) | sì |
| JjTL guard/binding/helper | `jjtl/executor/executor.ts:343` (`new JjelEvaluator`), `:2015`, `:2087`, `:2402` | delega via `toJjelAst` (astBridge) | sì |
| (attribute-assignment, dentro JjTL) | `jjtl/executor/executor.ts:1249` | `evaluateExpressionAsync` → `jjelEvaluator.evaluate` | sì |

**Verdetto A1: CONFERMATO.** Nel layer espressioni/trasformazioni c'è esattamente un
evaluator. JjTL **non** ha un evaluator proprio: converte il suo AST in AST JjEL
(`executor.ts:2086-2087`) e delega. Nota: esistono **due** costruttori di contesto JjEL
diversi (il ricco `buildEvalContext` di Jodie/JjScript vs il flatten ad-hoc di
`Console.tsx`) ma **lo stesso** evaluator — divergenza di *contesto*, non di *interprete*.

### A2 — Le superfici view usano motori SEPARATI (atteso → confermato)

Zero superfici del view layer passano per JjEL. I motori distinti:

| Superficie | Motore | file:riga |
|---|---|---|
| predicate `appliableToClasses` | recognizer per identità di metaclasse (+ ereditarietà) | `redux/selectors/selectors.ts:356` `matchesMetaClassTarget` |
| predicate `oclCondition` | **`@stekoe/ocl.js` OclEngine** (un secondo evaluator reale, attivo) | `ocl/ocl.tsx:127` `OCL.test` → `:149-151` `OclEngine.create()`; consumer `selectors.ts:596` |
| predicate `jsCondition` | JavaScript via `new Function` | `redux/reducer/reducer.ts:983`; invoke `selectors.ts:728` |
| template rendering | `JSXT.fromString` → `new Function` | `common/UX.tsx:441`; `reducer.ts:1004-1006` |
| edge expressions | path-evaluator ristretto (no JjEL) | `utils/edgeExpressionEval.ts:64` |

---

## B. Core del linguaggio

### B1 — forall / exists / implies
- **forall** (`parser.ts:643-678`, `evaluator.ts:911-927`): `forall x in C [such that|`|`| P] [: proj]`.
  Almeno fra filtro e proiezione uno è obbligatorio (`parser.ts:666`). Ritorna un **array**
  (semantica **set-comprehension**: filtra + proietta), `[]` se la collezione non è un array.
- **exists** (`parser.ts:684-711`, `evaluator.ts:929-938`): ritorna **boolean**; NON accetta `:`
  (errore esplicito `parser.ts:697`).
- **implies** (`parser.ts:143-157` right-assoc, `evaluator.ts:899-905`): `false implies x = true`
  (vacuous truth), `true implies x = isTruthy(x)`.

Precedenza completa documentata in `parser.ts:5-19` e coerente con CLAUDE.md §11.3.

### B2 — Operatore di uguaglianza canonico: `==`
Token `EQ = '=='` (`tokens.ts:59`), `NEQ = '!='` (`:60`); regola `equality` (`parser.ts:200-218`);
nel valutatore solo `'=='`/`'!='` (`evaluator.ts:319-323`). **Un `=` singolo non esiste**: il
lexer emette un errore esplicito `Unexpected '='. Did you mean '==' or '=>'?` (`lexer.ts:132`).
`=>` è la freccia lambda. **Riconciliazione Ch6 §6.5.2**: un predicate scritto con `=` non è
JjEL — è sintassi OCL (OCL.js usa `=`) sul canale `oclCondition`, oppure errore.

### B3 — and / or: valutazione EAGER (U5)
`evaluateBinary` valuta **entrambi** gli operandi (`evaluator.ts:268-269`) PRIMA di chiamare
`applyBinaryOperator`, dove `and`/`or` operano su valori già calcolati (`:338-342`). Quindi
**nessun short-circuit**. Conseguenza pratica: `self.x != null and self.x.foo` valuta sempre
`self.x.foo` e, se `self.x` è null, **lancia** (accesso membro non-safe, §C2). Per il guard va
usato `?.` (`self.x?.foo`), non `and`.

---

## C. Null safety

### C1 — `?.` e `??`
- `?.` member (`parser.ts:364-386` → `evaluator.ts:388-396`) e method (`:682-691`): se l'oggetto
  è null ritorna null. IMPLEMENTED.
- `??` (`parser.ts:124-138` → `evaluator.ts:836-842`): ritorna sinistra se ≠ null, altrimenti destra.
  IMPLEMENTED.

### C2 — Comportamento su null
- Accesso membro/metodo **non-safe** su null → **throw** (`evaluator.ts:378-382`, `:671-676`).
- `forall`/`exists` su non-array (incl. null) → `[]` / `false` (`:913`, `:931`).
- Proprietà assente su oggetto navigabile → `null` (+ warning `property-not-found` solo se il
  sink diagnostics è attivo) (`:513-540`).
- Identificatore non legato → `null` silenzioso (+ warning `undefined-identifier`/`ambiguous-instance`
  se sink attivo) (`evaluator.ts:218-260`).

---

## D. Built-in e navigazione

### D1 — Naming-convention (su stringhe)
IMPLEMENTED: `capitalize` (`strings.ts:32`), `uncapitalize`, `camelCase` (`:50`),
`pascalCase` (`:60`), `snakeCase` (`:70`), `kebabCase` (`:81`). **NOT-YET**: `screamingSnakeCase`,
`titleCase`.

### D2 — Inventario registri (144 metodi)
- **Collezioni** (`collections.ts:556`, 32): filter, map, flatMap, first, last, any, all, none,
  count, size, isEmpty, isNotEmpty, contains, distinct, distinctBy, sortBy, sortByDescending,
  reverse, take, skip, takeWhile, skipWhile, flatten, groupBy, join, sum, avg, min, max, indexOf, at.
- **Stringhe** (`strings.ts:306`, 36): toUpper, toLower, capitalize, uncapitalize, camelCase,
  pascalCase, snakeCase, kebabCase, trim, trimStart, trimEnd, padStart, padEnd, repeat, replace,
  replaceAll, substring, slice, split, startsWith, endsWith, contains, indexOf, lastIndexOf,
  charAt, length, isEmpty, isNotEmpty, isBlank, isNotBlank, matches, reverse, toNumber, toInt,
  quote, format.
- **Numeri** (`numbers.ts:271`, 35): abs, round, floor, ceil, trunc, sign, sqrt, pow, exp, log,
  log10, log2, sin, cos, tan, asin, acos, atan, toFixed, toPrecision, toExponential, toString,
  toHex, toBinary, toOctal, isInteger, isFinite, isNaN, isPositive, isNegative, isZero, clamp,
  between, mod, div.
- **Date** (`dates.ts:438` 36 metodi + `:484` 5 costruttori now/today/date/datetime/parseDate).

(Accesso a proprietà zero-arg su stringhe/array come `length`/`first`/`toUpper` è gestito anche
nel valutatore senza parentesi: `evaluator.ts:416-465`.)

### D3 — closure() / descendants / ancestors → NOT-YET
Nessun match in `frontend/src`. Conferma U3 (roadmap). **Distinzione importante**: la navigazione
della **gerarchia di CLASSE** *esiste* lato evaluator —
`superclass`/`superclasses`/`extends`/`allSuperclasses`/`subclass`/`subclasses`/`allSubclasses`
su `DClass` (`evaluator.ts:470-509`, chiusura ricorsiva `:549-600`) — e `allInstances` è
sottoclasse-aware (`eval.ts:186-204`). Ciò che manca è il combinatore generico `closure()` e gli
zuccheri `descendants`/`ancestors` sul **contenimento** M1.

---

## E. Access ways (Ch8 §jjom, Ch6 §6.4)

### E1 — `<Class>.instances` / `allInstances` includono gli oggetti CONTENUTI → SÌ (pieno)
Il pool di estensione è costruito da `rawM1Objects` = unione, per ogni `DModel` M1, di
`m.allSubObjects || m.objects` (`eval.ts:106-111`). `get_allSubObjects`
(`LModelElement.tsx:5531`) → `_getallSub` (`:5534`) seleziona **tutti** i `DObject`
(`Selectors.getAll(DObject, ...)`, `:5536`) e filtra solo per appartenenza al modello
(`l.model.id === context.data.id`, `:5551`): è un'enumerazione **piatta, indipendente dalla
profondità di contenimento**. Quindi una `Transition` (solo-contenuta dentro uno `State`) è nel
pool al pari di uno `State` radice. Poi:
- `<Class>.instances` filtra per `instanceof.name === cName` (`eval.ts:199`);
- `<Class>.allInstances` aggiunge le sottoclassi via `cls.allSubclasses` (`eval.ts:186-204`);
- `instances` (collezione globale) è l'intero pool (`eval.ts:148`).

**Verdetto E1: la nuova affermazione del libro ("funziona pienamente, contenuti inclusi") è
VERIFICATA.** Prova-chiave: `eval.ts:109` (`allSubObjects`) + `LModelElement.tsx:5536,5551`.
(Caveat residuo, non bloccante: il filtro di pool per nome di classe `instType === cName`,
`eval.ts:196-199`, è mono-metamodello-cieco se due MM condividono il nome — già annotato nella
memoria del piano M1, P2.)

### E2 — Access piano + API raw `$`: entrambe cablate, convergono
- Il valore di slot M1 è memorizzato sul L-proxy sotto `$attrName.value`. `extractAttributeValues`
  (`modelContext.ts:23-83`) legge le chiavi `$`-prefissate (Strategy 1) o le `features` (Strategy 2)
  e scrive il valore sotto la chiave **piana** non prefissata.
- `fillInstanceSlots` (`eval.ts:554-646`) materializza, sui handle di estensione, gli slot:
  attributi via L-getter `feature.value`/`values` (coercizione/enum), riferimenti via `__raw.values`
  risolti **per pointer** contro il pool (identità per `==`), `parent` via 2-hop (`:767-784`).
- Lo standalone `Console.tsx` appiattisce con `flattenProxyContext(data)` + `extractAttributeValues`
  (`Console.tsx:682-684`).

Convergenza: la **API raw `$slot.value`** è il meccanismo L-proxy sottostante; la chiave **piana**
è la superficie esposta a JjEL. Punto di convergenza unico: `extractAttributeValues`
(`modelContext.ts`) usata da extent-wrapper (`eval.ts:525`), `wrapSelectedElement` (`eval.ts:826`)
e Console (`Console.tsx:684`).

---

## F. Superfici ristrette vs JjEL (U1, U6, U7 — Ch6 §6.5)

### F1 — View predicate: recognizer, NON JjEL (U1)
Il "predicate" non è un'espressione JjEL. È composto da tre canali distinti, tutti **non-JjEL**:
1. **type-test**: `appliableToClasses` — lista di metaclassi, match per identità + ereditarietà
   (`selectors.ts:356-372` `matchesMetaClassTarget`). È un **recognizer**, non valuta testo.
2. **predicazione per attributo** (es. `and self.isInitial`): possibile solo via `oclCondition`
   (OCL.js, `ocl.tsx:127`) o `jsCondition` (`new Function`, `reducer.ts:983`) — **mai JjEL**.

Quindi la predicazione per attributo *esiste* ma nel dialetto OCL/JS, non in JjEL.

### F2 — `appliableToClasses` come lista → selezione ibrida multi-metaclasse
CONFERMATO: essendo una lista, `matchesMetaClassTarget` (`selectors.ts:356-372`) itera i target e
restituisce EXACT_MATCH o match-di-sottoclasse, dando selezione su più metaclassi **senza** scrivere
una disgiunzione nel testo del predicate.

### F3 — edge expressions: dialetto path-only
`evalEdgeExpression` (`utils/edgeExpressionEval.ts:64`) è un traversal iterativo dot/bracket, **senza
parser di espressioni**. JSDoc `:11-37` elenca il supportato (`$source.value`, `$source.values[0]`,
`$source.value.$container.value`) e l'**escluso** (ternari/condizioni, callback/lambda, funzioni
OCL/JjEL). Può **nominare il container** ma solo attraverso lo **slot raw `$container`**
(`$source.value.$container.value`), **non** tramite una keyword `eContainer`/`$parent`. È
reference-path + navigazione di slot, niente più.

### F4 — raw-`$` use-sites: {template JSX, edge expr, event handler} → CONFERMATO
- **template JSX**: `defaultViewTemplate.ts:48-49` (`data['$' + refs[i].name]`), `:158-159`
  (`data.$name`); compilato via `new Function` (`reducer.ts:1006`).
- **edge expr**: dentro `evalEdgeExpression` (`edgeExpressionEval.ts:11-16`).
- **event handler**: corpo evento compilato via `new Function` (`reducer.ts:944`).
Nessun altro use-site `$`-slot rilevato nel view layer (in particolare **non** in `oclCondition`
né in `jsCondition`).

---

## G. Validazione (Ch8 §guards, U4)

### G1 — Invarianti: solo in Console (manuale); nessun `validateModel()` JjEL cablato
Esiste un comando `validate` (`jjscript/executor/commands/validate.ts:62-366`) che fa **solo
validazione strutturale** (nomi classe maiuscoli, nomi attributo minuscoli, bound di molteplicità) —
**non** usa JjEL, **non** valuta invarianti. Non esiste un `validateModel()` né un pannello di
validazione cablato a JjEL/OCL. Le invarianti del libro (es.
`forall s in State.instances such that s.isInitial implies ...`) sono esprimibili e
*eseguibili solo manualmente* dall'utente nella Console/JjScript, sfruttando la macchina JjEL
`forall`/`implies`/`exists` (§B). **Verdetto: PARTIAL — la macchina c'è, il cablaggio dedicato no.**

---

## H. jjelEval

### H1 — Call-site `jjelEval(source, variables)` e stesso evaluator
Tutti i call-site di `jjelEval`/`jjelEvalWithDiagnostics` instradano alla stessa pipeline
`parseExpression → evaluate → new JjelEvaluator` (`jjel/index.ts:74-90`, `:124-140`):
- `jjscript/.../eval.ts:38`, `forall.ts:38,57`, `let.ts:132`
- `jjtl/executor/executor.ts:2015` (+ `:2087`, `:2402` via `this.jjelEvaluator.evaluate`)
- `components/editors/Console.tsx:690`
- `components/Jodie/jodieJjelContext.ts:67` (variante con diagnostics)

**Verdetto H1: stesso evaluator di §A. CONFERMATO.**

---

## Impatto sul libro

### Claim di Ch8

1. **"Un'unica sintassi, nessun secondo evaluator nel layer espressioni/trasformazioni"** →
   **CONFERMATO.** Un solo `JjelEvaluator` per Console + JjScript + JjTL; JjTL delega via astBridge
   (A1, H1). **Flag rimovibile.** *Caveat da esplicitare nel testo*: nel **view layer** esiste un
   secondo evaluator reale e attivo — `@stekoe/ocl.js` (`ocl.tsx:127`) — più `new Function`
   (template/JS-condition/event) e il path-eval degli edge. Coerente con la tesi solo se il claim
   resta circoscritto al layer *espressioni/trasformazioni* (come scritto). Se il libro afferma
   "nessun secondo evaluator nell'intero sistema", **smentito** dal canale OCL dei predicate.

2. **forall (filter+project+quantify), exists, implies; types/operators** → **CONFERMATO** (B1).
   `forall` set-comprehension, `exists` booleano, `implies` vacuous. **Flag rimovibile.**

3. **Operatore di uguaglianza** → l'operatore canonico JjEL è **`==`**; `=` è errore di lex
   (B2). Questo **riconcilia Ch6 §6.5.2**: l'esempio di predicate con `=` è OCL (canale
   `oclCondition`), non JjEL. **Flag rimovibile** una volta annotata la riconciliazione.

4. **Null safety (`?.`, `??`)** → **CONFERMATO implementati** (C1). *Caveat da aggiungere*:
   `and`/`or` sono **eager** (B3/U5), quindi il null-guard idiomatico è `?.`, non
   `x != null and x.f` (che lancia). Se il libro presenta l'and-guard come sicuro, va corretto.

5. **Built-in (naming methods)** → **CONFERMATO** snake/camel/pascal/kebab/capitalize/uncapitalize
   (D1); `screamingSnakeCase`/`titleCase` assenti. **closure()/descendants/ancestors → roadmap
   confermata** (D3, U3): il libro li dà correttamente per roadmap. **Flag U3 confermabile.**

6. **`<Class>.instances`/`allInstances` "funziona pienamente, oggetti contenuti inclusi"** →
   **VERIFICATO** (E1): prova `eval.ts:109` + `LModelElement.tsx:5536,5551`. **Flag rimovibile.**
   Caveat tecnico residuo (mono-MM name-filter) non inficia il claim per progetti a singolo MM.

### Claim di Ch6 §6.4 (access ways)

7. **Access piano + API raw `$` entrambe cablate** → **CONFERMATO**, convergono in
   `extractAttributeValues`/`fillInstanceSlots` (E2). **Flag rimovibile.**

### Claim di Ch6 §6.5 (superfici ristrette)

8. **U1 — predicate solo type-test o anche per attributo** → il type-test è un **recognizer**
   (`appliableToClasses`), non JjEL; la predicazione per attributo passa per **OCL/JS**, non JjEL
   (F1). Il libro deve descrivere il predicate come "recognizer di metaclasse + condizione
   OCL/JS opzionale", non come JjEL. **U1 chiaribile in questo senso.**

9. **U6/U7 — edge dialetto path-only; insieme raw-`$`** → **CONFERMATO** (F3, F4): edge =
   path-only (container raggiungibile via slot `$container`, non via keyword `eContainer`/`$parent`);
   raw-`$` = {template, edge, event}. **Flag U6/U7 confermabili.**

10. **U4 — validazione** → **PARTIAL** (G1): la macchina JjEL c'è (forall/implies/exists in
    Console) ma **nessun pannello/`validateModel()`** dedicato; `validate.ts` è solo strutturale.
    Il libro dovrebbe marcare la validazione come "Console-only / roadmap per il pannello".

### Nota sui "sei contesti" del libro

Dei sei contesti JjEL dichiarati: **Console**, **JjTL**, **JjScript** sono JjEL solidi;
**attribute-assignment** è JjEL ma **sussunto dentro JjTL** (`executor.ts:1249`), non una superficie
standalone; **validazione invarianti** è PARTIAL (G1); **ECA** è **ASSENTE/NOT-YET** (nessun motore
ECA nel codice). Se il libro presenta i sei come tutti operativi, vanno declassati ECA (roadmap) e
validazione (Console-only).

---

## Hard stop rispettato

Read-only. Nessuna modifica a `src/`, nessun fix/refactor, nessun file nuovo salvo questo report
(e l'entry di log richiesta da CLAUDE.md §21). Nessun commit, nessun push.
</content>
</invoke>
