# Discovery — JjEL come linguaggio delle espressioni dell'IR

**Data**: 2026-08-14
**Tipo**: discovery read-only. Nessun sorgente modificato.
**Branch**: `alfonso-frontend-jjtl`
**Origine**: domanda di Alfonso in chat Cowork: (a) prevedere un caso custom in cui l'autore
scrive l'espressione che vuole per `edge.source` / `edge.target`, oppure un meccanismo di
navigazione piu' ricca (`parent.parent`); (b) sostituire il linguaggio delle espressioni
attuale con JjEL, cosi' che `$source.value` diventi `source` e la risalita si scriva `parent`.

Questo report risponde a una sola domanda, quella che governa il costo di tutto il resto:
**il PathExpr di oggi e' gia' un sottoinsieme di JjEL?** Le altre osservazioni sono
conseguenze misurate durante la verifica.

---

## 1. Metodo

Tutte le affermazioni sulla grammatica sono **eseguite, non lette**. Il parser JjEL e il
parser PathExpr sono stati estratti in un container Linux separato (il `node_modules` del
repo porta binari darwin-arm64 e non gira nella VM del bridge) e fatti girare sullo stesso
corpus di espressioni.

**Controllo positivo**: la prima esecuzione della sonda ha restituito `ERR` su **tutte** le
18 espressioni, inclusa `name`, che JjEL accetta certamente. Il silenzio uniforme era la
sonda rotta, non il soggetto: `new JjelParser(src)` vuole un array di token, non una stringa
(`parser.ts:59`), e la forma corretta e' `parseExpression(source)` (`parser.ts:845`).
Corretta la sonda, `name` torna `OK Id(name)` e il resto del corpus diventa leggibile.
Senza quel controllo, il report avrebbe concluso che JjEL non parsa niente.

---

## 2. Esito: il PathExpr e' un sottoinsieme di JjEL, tranne il multi-hop

Corpus, con l'AST JjEL a sinistra e il `ParsedPath` a destra.

| Espressione | JjEL | PathExpr |
|---|---|---|
| `$name` | OK `Id($name)` | OK `{feature:name, take:value}` |
| `$name.value` | OK `Id($name).value` | OK `{feature:name, take:value}` |
| `$refs.values` | OK `Id($refs).values` | OK `{feature:refs, take:values}` |
| `$refs.values[0]` | OK `Id($refs).values[L(0)]` | OK `{feature:refs, take:0}` |
| `$my_ref.value` | OK `Id($my_ref).value` | OK |
| **`$a.value.$b.value`** | **ERR** `Expected property name after '.'` | **OK** 2 hop |
| **`$a.values[0].$b.value`** | **ERR** stessa | **OK** 2 hop |
| `name`, `parent`, `parent.parent`, `parent.name`, `instanceOf.name` | OK | ERR `invalid PathExpr step` |
| `$a?.value`, `a ?? b`, `if x then 1 else 2`, `forall a in attributes : a.name` | OK | ERR (vietati o invalidi) |

Tre conseguenze, in ordine di peso.

**2.1 La forma single-hop e' gia' JjEL valido, con AST isomorfo.** Il lexer riconosce
`$identificatore` come `DOLLAR_IDENT` (`lexer.ts:161-170`) e il parser lo trasforma in un
`IdentifierExpr` il cui `name` **include il dollaro** (`parser.ts:468-475`). Quindi
`$name.value` in JjEL e' `MemberAccess(Identifier('$name'), 'value')`: esattamente la stessa
struttura che `parsePathExpr` produce come singolo step. Nessuna ambiguita', nessun conflitto
di token.

**2.2 Il multi-hop e' l'unica rottura, ed e' un token.** `postfix()` consuma solo
`IDENTIFIER` dopo il punto (`parser.ts:341-342`), quindi `$a.value.$b.value` muore sul
secondo `$`. E' la sola forma del linguaggio attuale che JjEL non sa leggere. Due strade,
entrambe piccole ma non equivalenti: allargare quel `consume` ad accettare anche
`DOLLAR_IDENT`, che tocca **JjEL**, cioe' un linguaggio condiviso con console, Jodie e JjTL e
quindi materia da ratifica; oppure riscrivere i multi-hop persistiti nella forma idiomatica
JjEL, che non tocca il linguaggio ma richiede una migrazione.

**2.3 La semantica NON e' un sottoinsieme, ed e' un bene.** Il contesto JjEL non lega
`$feature`: `extractAttributeValues` (`jjel/evaluator/modelContext.ts:23-60`) legge le chiavi
`$attr` del proxy L, ne estrae `.value` e le espone **senza dollaro**. Il commento in testa al
modulo dice la cosa in chiaro: *"M1 instance attribute values are stored in the L-layer proxy
under `$attrName.value`, but JjEL users expect to write just `attrName`"*. La proposta di
Alfonso non e' un'aggiunta al linguaggio: e' **l'idioma che JjEL ha gia'**.

Tabella di traduzione, derivata dal builder di contesto (`fillInstanceSlots`,
`jjscript/executor/commands/eval.ts:554-612`, che espone una `DReference` come handle singolo
o come array a seconda di `upperBound`):

| PathExpr oggi | JjEL idiomatico |
|---|---|
| `$name.value` | `name` |
| `$refs.values` | `refs` |
| `$refs.values[0]` | `refs[0]` |
| `$source.value` | `source` |
| `$a.value.$b.value` | `a.b` |
| non esprimibile | `parent`, `parent.parent` |

---

## 3. `parent` come eContainer e' implementato, e la nota agli atti e' vecchia

Il concern `languages` registra `parent` come *"implementazione in progress, M1 ritorna
`ownedTransition` invece di `Transition`"*, cioe' la feature di containment invece
dell'oggetto contenitore. **Sul branch corrente quel difetto non c'e' piu'.**

`resolveParentHandle` (`eval.ts:766-784`) fa esattamente i due salti giusti sulla catena
grezza: `DObject.father` -> `DValue` (lo slot di containment) -> `DValue.father` -> `DObject`
proprietario. Le radici, il cui `father` e' il `DModel` e non un `DValue`, tornano `null`
esplicito. L'oggetto risolto e' **lo stesso handle del pool**, materializzato su richiesta se
sta fuori, quindi `t.parent == s` regge per identita'.

C'e' anche lo shadowing gia' scritto (`eval.ts:870-887`): se la metaclasse dichiara una
feature chiamata `parent`, il valore utente resta e l'eContainer non lo sovrascrive. E'
la regola *"feature utente vince sulla proprieta' JjOM built-in"*, applicata al caso che ci
interessa.

Resta da verificare a runtime su un modello vero (fuori dallo scope read-only di questa
discovery), ma il blocco dichiarato in chat come prerequisito **non e' piu' un blocco**.

Nota di lessico che vale un avviso: in JjEL `parent` e' il **contenitore**, mentre
`superclass` / `superclasses` / `allSuperclasses` sono l'**ereditarieta'**
(`evaluator.ts:470-495`, su `superTypes`). Le due risalite hanno nomi distinti e non si
confondono.

---

## 4. Le copie della grammatica sono sei, non cinque

Il conto tenuto finora (R8, discovery 2026-08-03) ne dichiarava tre convergenti piu'
`isUsableEndpointExpr` come quinta. La ricerca su tutto `frontend/src` ne trova una in piu',
mai censita.

| # | Sito | Natura | Stato |
|---|---|---|---|
| 1 | `viewpoint/ir/pathExpr.ts` | parser canonico | vivo, condiviso |
| 2 | `ui/PathBuilder/pathExpr.ts` | emettitore (`pathExprFromSelection`) | vivo |
| 3 | `ui/PathBuilder/PathBuilder.tsx` + `ui/PredicateBuilder` | consumatori, convergenti su `singleHopOf` | ok dopo R8 |
| 4 | `viewpoint/ir/edgeEndpoints.ts` `isUsableEndpointExpr` | regex `/\.values$/` | vivo, ora in modulo puro |
| 5 | **`utils/edgeExpressionEval.ts`** | **valutatore indipendente completo, 103 righe** | **vivo, substrato classic L2** |
| 6 | `jjel/` | lexer + parser + evaluator | vivo, altrove nel prodotto |

Il numero 5 e' la scoperta. E' il mini-evaluator degli endpoint del substrato classic
(`edgeSource`/`edgeTarget` su `DViewElement`), consumato da `joiner/ExecuteOnRead.ts:17` ed
esposto come globale `windoww.evalEdgeExpression` (`ExecuteOnRead.ts:129`). Ha una grammatica
**divergente** da quella dell'IR: accetta `$pair.value.left`, cioe' un identificatore nudo
dopo `.value`, che `parsePathExpr` rifiuta. E fallisce in modo opposto: **non lancia mai**,
ritorna `null` in silenzio su qualunque forma non supportata.

La sua intestazione, scritta a maggio, dice gia' dove andava a parare:

> NOT SUPPORTED (future L2.5+ **or JjEL inline**): ternaries / conditions, callback
> aggregations, JjEL/OCL functions.

Adottare JjEL non aggiunge una lingua al progetto. **Ne toglie almeno due**, e chiude una
divergenza gia' in produzione fra il ramo IR e il ramo classic.

---

## 5. Misure di costo

Micro-benchmark eseguito nel container (node v22.22.2), contesto sintetico a 5 chiavi,
200.000 iterazioni per riga. Non sostituisce una misura sul canvas vero, ma dimensiona
l'ordine di grandezza.

| Operazione | Costo |
|---|---|
| `parseExpression('name')` | 11,3 us |
| `parseExpression('parent.name')` | 6,6 us |
| `parseExpression('parent.parent.name')` | 6,5 us |
| valutazione JjEL di `name` | 62 ns |
| valutazione JjEL di `parent.name` | 91 ns |
| valutazione JjEL di `parent.parent.name` | 161 ns |
| closure equivalente (quel che `irCompile` produce oggi) | 11-17 ns |
| costruzione di un `EvaluationContext` a 5 chiavi | 266 ns |

**Lettura**: l'interpretazione dell'AST costa da 4 a 10 volte la closure, ma in assoluto
parliamo di 100 ns. Un canvas con 500 nodi e 5 espressioni per nodo spende 2500 valutazioni,
cioe' **circa 0,25 ms**. L'obiezione di performance sollevata in chat prima di misurare e'
quantitativamente debole, e va ritirata in quella forma.

**Il costo vero non e' la valutazione: e' il contesto.** L'unico builder di contesto di
modello esistente e' `buildEvalContext` (`jjscript/executor/commands/eval.ts:93`), che
materializza l'intero modello in valori JjEL: quattro passate su tutte le classi e tutte le
istanze, con un commento esplicito in testa, *"PERF: O(objects x features) per context build;
no cross-evaluation cache in Stage 1"*. Costruirlo a ogni render, o anche una volta per
frame, e' l'unico modo di rendere questa operazione cara.

Il vincolo corretto quindi non e' *"compilare invece di interpretare"*, come detto in chat
prima della misura, ma: **il contesto JjEL dell'IR deve essere un adattatore lazy sul
`ReadCtx` esistente, e non deve mai passare da `buildEvalContext`.** Il `ReadCtx`
(`viewpoint/ir/irReadCtx.ts:17-32`) e' gia' la superficie giusta: `getValue`, `getValues`,
`getName`, `getMetaclassName`, `isKindOf`, `getRef`, tutte per id di elemento e tutte lazy.

---

## 6. Il rischio che nessuno ha ancora nominato: il fallimento silenzioso

`evaluateIdentifier` (`evaluator.ts:211-260`) su identificatore non legato ritorna **null,
in silenzio**. Le diagnostiche esistono ma sono opt-in: `jjelEvalWithDiagnostics` accumula
warning con suggerimenti Levenshtein, `jjelEval` no.

Il regime attuale dell'IR e' l'opposto: `parsePathExpr` **lancia**, e `validateIR`
(`irValidate.ts:16-25`) riusa il compilatore come validatore e mostra il messaggio nel
pannello di authoring. Un errore di battitura oggi si vede subito.

Migrare senza attenzione a questo punto significa che `nmae` invece di `name` smette di
essere un errore visibile e diventa una label vuota. Il canale diagnostico esiste gia': la
condizione e' che l'IR usi **sempre** la variante con diagnostica e la porti nel pannello,
mai la variante silenziosa.

Nota collaterale: `utils/edgeExpressionEval.ts` (§4) e' gia' oggi in regime silenzioso. Il
problema non nasce con JjEL, ma JjEL lo estenderebbe alla superficie che oggi ne e' immune.

---

## 7. Estrazione delle dipendenze: cosa serve, e cosa esiste

E' il pezzo di lavoro vero. Oggi `compilePath` (`irCompile.ts:60-110`) produce due cose dalla
stessa passata:

- `featureNames`, che confluisce nel `dependencySet` della view (deps self);
- per i path a due o piu' step, un `CompiledCrossPath` (`hops[]` + `terminal`) spinto nel
  `crossPathSink`, che `irCrossDeps.ts` concretizza in dipendenze cross-object.

Un compilatore JjEL deve produrre gli stessi due output camminando il `JjelExpression`. Sui
costrutti del profilo ristretto (Identifier, MemberAccess, IndexAccess) la camminata e'
diretta e il mapping su hop e terminal e' meccanico.

I costrutti che rompono il modello sono quelli a dipendenza **non limitata staticamente**:
`Class.instances` / `allInstances`, `forall x in <collezione>`, e in prospettiva `closure()`
dello Stage 8. Su questi il `dependencySet` non e' un insieme finito di nomi di feature: la
view dipende dal modello. Due risposte possibili, e vanno scelte, non lasciate accadere:
profilo dichiarato che li rifiuta (con messaggio che dice perche'), oppure una dipendenza
grossolana "tutto il modello" che forza il re-render a ogni cambiamento. La prima e' coerente
con la disciplina gia' ratificata per il vocabolario delle azioni (R-6, 2026-08-03).

Da tenere presente: `navigateRefHop` (`irReadCtx.ts:70-85`) e' la sorgente unica della
navigazione degli hop, condivisa fra accessor di render e concretizzazione delle dipendenze
proprio perche' render e reattivita' non possano divergere (discovery 2026-07-21). Qualunque
compilatore nuovo deve continuare a passare di li'.

---

## 8. Perimetro: dove il PathExpr entra nell'IR

Da `irTypes.ts`: predicati (`eq`/`neq`/`lt`/`lte`/`gt`/`gte` sui due operandi, `exists`,
`empty`, `isKind.path`), `TextSource` con `from:'path'`, `edge.source`, `edge.target`. Piu' i
segmenti di template e i predicati dentro ogni `Conditional`, che passano dagli stessi
compilatori.

Nel repo la forma multi-hop compare in 11 file, di cui i sorgenti veri sono
`utils/edgeExpressionEval.ts`, `ui/PathBuilder/PathBuilder.tsx`, `ir/useIRContainment.ts`,
`ir/irCrossDeps.ts` piu' i test e quattro `examples/`. Il corpus persistito nei progetti
utente non e' ispezionabile da qui: e' una misura che va fatta su un progetto reale prima di
dimensionare la migrazione.

---

## 9. Domande aperte per Alfonso

1. **Il multi-hop si migra o si allarga JjEL?** Accettare `DOLLAR_IDENT` dopo il punto e' una
   riga di parser ma tocca un linguaggio condiviso. Riscrivere i path persistiti non tocca
   JjEL ma vuole un VersionFixer. La prima e' piu' economica e piu' sporca; la seconda e'
   piu' pulita e piu' cara.
2. **Compatibilita' all'indietro: legare `$feature` o no?** Poiche' `Id($name)` porta il
   dollaro nel nome, il contesto IR **puo'** legare `$feature` a un handle con `.value` /
   `.values` e far sopravvivere ogni PathExpr esistente senza riscriverlo. Comodo per la
   transizione, ma congela nel linguaggio una forma che vogliamo far sparire.
3. **Che fine fa `utils/edgeExpressionEval.ts`?** Se il substrato classic resta vivo, il
   progetto continua ad avere due semantiche di endpoint. Se muore, e' una slice a se'.
4. **Il profilo si dichiara subito o si allarga a valle?** Cioe': `forall` e `instances` sono
   fuori dalla v1 per decisione, o si entra con tutto JjEL e si scopre la reattivita' rotta
   sul campo.

---

## 10. File letti

`frontend/src/jjel/lexer/lexer.ts`, `parser/parser.ts`, `types/ast.ts`, `types/tokens.ts`,
`evaluator/evaluator.ts`, `evaluator/context.ts`, `evaluator/modelContext.ts`, `SPEC.md`;
`frontend/src/jjscript/executor/commands/eval.ts`;
`frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts`, `irCompile.ts`, `irTypes.ts`,
`irReadCtx.ts`, `irValidate.ts`, `edgeEndpoints.ts`, `irEdgeViews.ts`, `irCrossDeps.ts`;
`frontend/src/components/ui/PathBuilder/`, `components/ui/PredicateBuilder/PredicateBuilder.tsx`;
`frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`;
`frontend/src/utils/edgeExpressionEval.ts`, `frontend/src/joiner/ExecuteOnRead.ts`.

Sonde eseguite: parsing comparato del corpus (18 espressioni) e micro-benchmark, entrambi in
container separato, fuori dal repo.
