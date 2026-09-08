# Discovery — che cosa restituiscono le tre invarianti del libro, e che cosa succede quando quel valore viene preso per un verdetto

**Data**: 2026-09-08
**Corsia**: Step 0 del prompt di Fase 2 — scheletro della validazione definita dall'utente
(`docs/prompts/claude_2026-09-08_1650_prompt_validation_skeleton_fase2.md`). READ-ONLY, hard stop.
Nessun file di codice modificato.
**Ramo**: `validation-skeleton`, aperto da `alfonso-frontend-jjtl` per questo giro.
**Sonda**: `docs/discovery/harness/probe_2026-09-08_jjel_verdetto_booleano.mts` — **42 PASS, 0 FAIL**.
**Precedenti**: `discovery_2026-09-08_validazione_definita_utente.md` (Fase 1),
`discovery_2026-09-08_keyword_dopo_il_punto.md` (micro-discovery sul lexer).

---

## 1. La domanda, e perche' non era rimandabile

La spec R-VAL dice «corpo JjEL booleano». Due delle tre invarianti che il libro dichiara nella
Tabella 7.5 non restituiscono un booleano: la prima confronta una cardinalita', la terza costruisce
un insieme. Il libro se ne accorge e scrive che «le regole di truthiness dell'evaluator fanno
funzionare la cosa in pratica».

Per un validatore quella frase e' una scommessa, non una specifica. Se un array non vuoto e' vero a
prescindere dal contenuto, `[false, false]` e' vero: la regola violata viene dichiarata soddisfatta
**in silenzio**, senza errore, senza warning, senza traccia. E' la categoria di difetto peggiore,
perche' il prodotto sembra funzionare.

Quattro cose da misurare, **eseguendo** l'evaluator e non leggendolo. Tutte e quattro hanno
risposta; due hanno la risposta cattiva.

---

## 2. Che cosa e' stato eseguito

```
cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-08_jjel_verdetto_booleano.mts
```

Otto blocchi: la fixture (A), le tre invarianti (B), `forall` con un elemento falso (C), la
collezione vuota (D), la ricerca del convertitore esistente (E), i controlli positivi (F), il
tri-stato (G, fuori mandato e dichiarato), la regola candidata messa alla prova (H, proposta).
Esito **42 PASS, 0 FAIL**.

La sonda **non c'e' lo store Redux**: il modello del semaforo e' costruito a mano. Ma non a
capriccio — la forma degli handle replica quella che `buildEvalContext`
(`frontend/src/jjscript/executor/commands/eval.ts`) e `fillInstanceSlots` (`:579`) producono dal
modello vero, e le quattro scelte che contano sono citate al punto di codice dentro la sonda:

| Scelta della fixture | Sito che la giustifica |
|---|---|
| una classe e' un oggetto piatto con `.instances`, legato per nome come variabile globale | `eval.ts:207`, `:277-283` |
| una feature multivalore e' **sempre** un array, vuoto se non popolata | `eval.ts:643`, `:648-654` |
| una reference singola non popolata e' **`null`**, non assente | `eval.ts:643` |
| un attributo singolo opzionale vuoto e' `null` | `emptyAttributeDefault`, `eval.ts:659-661` |
| le feature dell'istanza sono appiattite come identificatori nudi | `extractAttributeValues`, `modelContext.ts:23-83` |

Se questa forma e' sbagliata e' sbagliato tutto il resto, e per questo sta scritta in chiaro nella
sonda: e' contestabile riga per riga.

**Il blocco F esiste per questo.** Sette controlli a esito noto — `1 == 1`, `State.instances` di
cardinalita' 3, `.size` senza parentesi, `.isNotEmpty` senza parentesi, le feature leggibili come
nomi nudi, `self` legato all'istanza, `forall` su un solo elemento vero. Se uno solo fallisse, un
elenco di esiti sorprendenti sarebbe indistinguibile da una fixture vuota. Passano tutti e sette.

---

## 3. Domanda 1 — il tipo di ritorno delle tre invarianti

| # | Espressione | Tipo | Modello che la soddisfa | Modello che la viola |
|---|---|---|---|---|
| 1 | `(forall s in State.instances such that s.isInitial).size == 1` | **boolean** | `true` | `false` (0 iniziali) — `false` (2 iniziali) |
| 2 | `not isFinal implies ownedTransitions.isNotEmpty` | **boolean** | `true` | `false` |
| 3 | `forall t in ownedTransitions: t.nextState != null` | **array** | `[true]` | `[false]` |

Cioe': **due su tre sono booleane, la terza no.** L'ipotesi del prompt («la 1 restituisce un numero
confrontato, la 3 un insieme di booleani») e' corretta sulla 3 e **imprecisa sulla 1**: il `== 1`
finale la chiude, e il risultato e' un booleano vero e proprio. La prima invariante non pone nessun
problema.

La terza ne pone due, e sono distinti.

---

## 4. Domanda 2 — `forall ... : pred` con almeno un elemento falso

```
forall x in xs: x.p     con xs = [{p:true}, {p:false}, {p:true}]
  ->  [true, false, true]      array di 3
```

La proiezione restituisce **un elemento per elemento**, e conserva i falsi. Non aggrega niente:
`evaluateForAll` accumula `results.push(...)` e ritorna l'array (`evaluator.ts:915-931`).

La conversione a booleano, per **ogni via che un chiamante ha davvero**:

| Via | Esito su `[true, false, true]` |
|---|---|
| `if (…) then "VERO" else "FALSO"` | `"VERO"` |
| `not (…)` | `false` (cioe': lo considera vero) |
| `(…) and true` | `true` |
| `true implies (…)` | `true` |
| `Boolean(valore)` — la regola di JavaScript, quella che usano JjTL e JjScript | `true` |

**Un array che contiene un falso e' vero per tutte le vie misurate.** E in forma pura:

```
forall su [{p:false},{p:false}]  ->  [false, false]   e   if(...) -> "VERO"
```

La regola violata da **ogni** elemento risulterebbe soddisfatta. Il timore del prompt e' confermato
alla lettera.

Il termine di paragone, misurato accanto: `xs.all(x => x.p)` restituisce **`false`**, un booleano, e
distingue il caso. La forma corretta nel linguaggio esiste gia' — `all`, `any`, `none` sono builtin
di collezione (`getCollectionMethod('all')` e' una funzione; `forAll` resta `undefined`, come gia'
misurato il 2026-09-08).

---

## 5. Domanda 3 — la collezione vuota, e il difetto simmetrico

```
forall x in [] : x.p    ->  []      array di 0
```

| Via | Esito su `[]` |
|---|---|
| `if (…) then "VERO" else "FALSO"` | `"FALSO"` |
| `not (…)` | `true` (cioe': lo considera falso) |
| `Boolean(valore)` — JavaScript | **`true`** |
| `xs.all(x => x.p)` | `true` — la verita' vacua |

Qui il difetto e' **secondo, distinto dal primo, e va nella direzione opposta**. Un vincolo
universale su un insieme vuoto deve essere vero: uno stato senza transizioni uscenti non viola
«ogni transizione ha un target», non ne ha nessuna. La truthiness dell'evaluator dice `false`, cioe'
**dichiara violata una regola che e' vacuamente vera**.

Nell'esempio del semaforo il caso non e' teorico: `DEAD_END, self=Red (0 transizioni)` produce `[]`.
Un utente vedrebbe una violazione su uno stato che non ha fatto niente di male.

E qui succede anche un'altra cosa, che vale la pena isolare: **le due regole di conversione in
circolo nel codebase si contraddicono esattamente su questo valore.**

---

## 6. Domanda 4 — esiste gia' una funzione `JjelValue -> boolean`?

**Nel modulo pubblico, no.** I 20 export di `frontend/src/jjel/index.ts` sono `EvaluationContext,
JJEL_KEYWORDS, JjelEvaluationError, JjelEvaluator, JjelLexer, JjelParser, JjelTokenType,
TypeRegistry, createFunction, evaluate, fromJjelValue, getJjelErrors, isJjelFunction, isJjelObject,
isValidJjel, jjelEval, jjelEvalWithDiagnostics, parse, toJjelValue, tokenize`. Nessuno converte in
booleano.

**Nel codice, si': due, diverse, e nessuna delle due condivisa.**

**(a) `JjelEvaluator.isTruthy`** (`evaluator.ts:1003`), dichiarata `private` — che in TypeScript e'
una barriera di compilazione e non di runtime: a runtime sta sul prototype, ed e' li' che la sonda
l'ha **eseguita** per leggerne la regola invece di dedurla.

**(b) `Boolean()` di JavaScript**, applicata direttamente ai risultati JjEL da JjTL
(`jjtl/executor/executor.ts:1273, 2898, 2914, 2922, 2930, 3119, 3122, 3138, 3152`) e da JjScript
(`jjscript/executor/commands/forall.ts:57-58`, `if (pass)`).

Le due regole, sulla stessa tabella di valori:

| valore | `isTruthy` (JjEL) | `Boolean()` (JS — JjTL, JjScript) | concordi |
|---|---|---|---|
| `null` | false | false | si |
| `false` | false | false | si |
| `true` | true | true | si |
| `0` | false | false | si |
| `1` | true | true | si |
| `""` | false | false | si |
| `"x"` | true | true | si |
| `[]` | **false** | **true** | **NO** |
| `[false]` | true | true | si |
| `[false, false]` | true | true | si |
| `{}` | true | true | si |

La regola di `isTruthy`: `null` -> false, boolean -> se stesso, number -> `!= 0`, string -> non
vuota, **array -> non vuoto (il contenuto non e' guardato)**, qualunque altro oggetto -> true.

Divergenze sulla tabella: **una**, ed e' l'array vuoto — cioe' esattamente il valore su cui si gioca
la verita' vacua del §5. Due sottosistemi dello stesso prodotto rispondono in modo opposto alla
stessa domanda, e la differenza non e' documentata in nessun punto: `frontend/src/jjel/SPEC.md` non
contiene la parola «truthy» ne' «truthiness» (controllo positivo sullo stesso comando: `isNotEmpty`
nello stesso file restituisce la riga 259 — la ricerca ha segnale).

---

## 7. Fuori dalle quattro domande, dichiarato: il tri-stato di R-VAL-7 (blocco G)

Misurato qui perche' costava tre righe e la regola di verdetto dello Step 2 non e' scrivibile senza.
Su un'istanza a cui **mancano del tutto** le feature che la regola nomina:

| Espressione | Esito |
|---|---|
| `not isFinal implies ownedTransitions.isNotEmpty` | **LANCIA** `JjelEvaluationError: Cannot access property 'isNotEmpty' of null` |
| `forall t in ownedTransitions: t.nextState != null` | **`[]`**, nessuna eccezione |
| `self.owner.name != ""` | **LANCIA** `JjelEvaluationError: Cannot access property 'name' of null` |
| `jjelEvalWithDiagnostics('ownedTransitions', …)` | `{"value":null,"warnings":[{"kind":"undefined-identifier","identifier":"ownedTransitions","suggestion":null}]}` |

Due invarianti, la stessa istanza malformata, **due comportamenti diversi**: la seconda non lancia
perche' `evaluateForAll` su un non-array ritorna `[]` (`evaluator.ts:916`). Cioe' una regola che
nomina una feature inesistente, se e' scritta con `forall`, **non arriva mai al canale delle
eccezioni**: scivola nel valore `[]` e da li' dentro il verdetto, dalla parte sbagliata a seconda di
quale delle due regole di conversione si applichi.

Conseguenza operativa per lo Step 2: catturare `JjelEvaluationError` **non basta** a costruire il
tri-stato di R-VAL-7. Il canale delle eccezioni copre la navigazione; l'identificatore assente passa
per i warning di `jjelEvalWithDiagnostics`, che il tri-stato dovra' leggere.
`JjelEvaluationError` e' esportata e catturabile al confine — quello si', verificato.

---

## 8. La regola candidata, provata (blocco H — proposta, non codice in albero)

Il prompt prescrive: se la truthiness dell'evaluator non distingue `[false]` da `[true]`, il
valutatore **non la usa** e applica la propria regola dichiarata. Il §4 ha misurato che non la
distingue. La regola candidata, scritta come funzione unica:

```
booleano -> se stesso
insieme  -> soddisfa se e solo se OGNI elemento e' vero; l'insieme vuoto soddisfa
null     -> non soddisfa
altro    -> la truthiness ordinaria (number != 0, string non vuota, oggetto -> true)
```

Provata sulle otto combinazioni invariante x fixture:

| caso | valore grezzo | regola candidata | truthiness evaluator | atteso |
|---|---|---|---|---|
| INV1 modello OK | `true` | true | true | true |
| INV1 senza stato iniziale | `false` | false | false | false |
| INV1 con due stati iniziali | `false` | false | false | false |
| INV2 OK, self=Green | `true` | true | true | true |
| INV2 DEAD_END, self=Red | `false` | false | false | false |
| INV3 OK, self=Green | `[true]` | true | true | true |
| **INV3 DANGLING, self=Yellow** | `[false]` | **false** | **true** | false |
| **INV3 DEAD_END, self=Red (vuoto)** | `[]` | **true** | **false** | true |

Otto su otto per la regola candidata; **sei su otto** per la truthiness dell'evaluator, e i due
sbagliati sono precisamente i due che il criterio di accettazione del libro mette in gioco: la
transizione senza target, dichiarata soddisfatta, e lo stato senza transizioni, dichiarato violato.

Nessuna di queste righe entra in albero da questo giro: e' una proposta misurata, e la decisione e'
di Alfonso.

---

## 9. Che cosa questo referto NON prova

- Non prova niente sul **modello del semaforo reale dentro l'app**: prova la semantica
  dell'evaluator su un contesto della stessa forma, costruito secondo i cinque siti citati al §2.
  Il criterio di accettazione del prompt («tolto lo stato iniziale al semaforo, la prima invariante
  compare fra le violazioni») resta da verificare sull'app, e non e' verificabile in Step 0.
- Non prova che nessun **altro** convertitore esista fuori dai due trovati: la ricerca ha coperto
  `frontend/src/jjel` e `frontend/src/jjtl` piu' i chiamanti di `jjelEval*` in tutto
  `frontend/src`. Un convertitore che non chiami JjEL e non si chiami `truthy|toBool|asBool|isBool`
  sfuggirebbe.
- Non tocca il linguaggio. Il difetto misurato al §4 e al §5 e' **della lettura del risultato**, non
  di `forall`: `forall` fa quello che la SPEC §5.1 dichiara, cioe' una comprehension. Cambiare
  `forall` non e' fra le opzioni e non e' stato considerato.
- Non esercita la collisione fra `isFinal` come feature M1 dell'istanza e `isFinal` come property
  strutturale di classe (`docs/spec/concern_languages.md:30`). Nel contesto di una regola `self` e'
  un'istanza e la feature appiattita vince; su un contesto di classe la domanda e' aperta e non e'
  stata misurata.

---

## 10. Domande aperte — la decisione e' di Alfonso, e lo Step 2 dipende da questa

**D1 — la regola di verdetto.** Tre opzioni, con esiti utente diversi:

- **(a) la regola candidata del §8**, cioe' quella che il prompt prescrive. L'insieme soddisfa se e
  solo se tutti gli elementi sono veri; l'insieme vuoto soddisfa. Otto su otto sul criterio di
  accettazione. Costo: una funzione documentata nel valutatore, e una semantica che **diverge** da
  quella dell'evaluator su un valore (`[]`) e dal `Boolean()` di JjTL su un altro (`[false]`). Tre
  regole in circolo invece di due.
- **(b) pretendere un booleano**: un corpo che non restituisce `boolean` e' un **difetto della
  regola** e va nel canale di authoring (R-VAL-7), non fra le violazioni. Il libro allora dovrebbe
  riscrivere l'invariante 3 come `ownedTransitions.all(t => t.nextState != null)`, che e' misurata e
  funziona. Costo: la Tabella 7.5 cambia, e cambia dopo che e' stata scritta.
- **(c) normalizzare in JjEL**, cioe' toccare `isTruthy` o aggiungere un convertitore esportato e
  farlo usare anche a JjTL e JjScript. Chiude la divergenza alla radice, ma tocca il linguaggio e
  due sottosistemi che oggi funzionano: **fuori dallo scope dello scheletro**, e da valutare come
  corsia propria.

La mia lettura, non una decisione: **(a) per lo scheletro, (b) come forma raccomandata in
authoring** — la regola candidata regge il criterio di accettazione senza toccare niente, e
`coll.all(x => pred)` resta la forma che si insegna. (c) e' la cosa giusta a lungo termine e non e'
questo il giro.

**D2 — la seconda meta' del tri-stato.** Il §7 mostra che catturare `JjelEvaluationError` non basta:
una regola che nomina una feature inesistente, scritta con `forall`, non lancia. Lo Step 2 deve
leggere anche i warning di `jjelEvalWithDiagnostics`, oppure accettare che quel caso finisca fra le
violazioni (o fra le soddisfatte, secondo D1). Non e' derivabile dal codice: e' una scelta.

**D3 — dove va scritta la regola scelta.** Il prompt dice «funzione unica e documentata, non
sparsa», e lo Step 2 la mette nel modulo puro del valutatore. Se pero' la scelta cade su (c), il
posto e' un altro e il perimetro dello Step 2 cambia. Va deciso prima, non durante.

---

## 11. Gate e stato dell'albero

Giro READ-ONLY: **nessun file di codice modificato**, nessun gate di build o di suite eseguito, e
questo e' dichiarato qui invece di essere taciuto. `npm run typecheck`, `npm run build` e
`npx vitest run` non sono stati lanciati perche' non c'e' diff di sorgente da difendere.

I due file consegnati sono questo referto e la sonda. `git status --porcelain frontend/src` e' vuoto
a fine giro; controllo positivo sullo stesso comando senza pathspec, che elenca i due file nuovi.

**File letti e non modificati**: `frontend/src/jjel/index.ts`, `frontend/src/jjel/evaluator/evaluator.ts`,
`frontend/src/jjel/evaluator/context.ts`, `frontend/src/jjel/evaluator/modelContext.ts`,
`frontend/src/jjel/evaluator/builtins/collections.ts`, `frontend/src/jjel/SPEC.md`,
`frontend/src/jjscript/executor/commands/eval.ts`, `frontend/src/jjscript/executor/commands/forall.ts`,
`frontend/src/jjtl/executor/executor.ts` (grep mirato sulle coercizioni).

**HARD STOP.** Si riprende dallo Step 1 dopo che Alfonso ha letto questo referto e chiuso D1.
