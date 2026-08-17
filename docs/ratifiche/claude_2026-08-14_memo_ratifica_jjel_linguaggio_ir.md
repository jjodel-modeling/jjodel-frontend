# Memo di ratifica — JjEL come linguaggio delle espressioni dell'IR

**Data**: 2026-08-14
**Origine**: domanda di Alfonso in chat Cowork, discovery
`docs/discovery/discovery_2026-08-14_jjel_come_linguaggio_espressioni_ir.md`, spike eseguibile
allegato.
**Stato**: **ratificata il 2026-08-18**, a registro in `docs/decisions.md` come serie R-J
(R-J1..R-J7). Le sei voci qui sotto sono decisioni, non opzioni; ognuna porta la misura o il
riferimento a codice che la giustifica. Il corpo del memo resta **come scritto il 2026-08-14**:
quanto e' cambiato in ratifica sta nell'addendum in coda, non riscritto qui.

---

## Il punto di partenza, misurato

La domanda «PathExpr e' gia' un sottoinsieme di JjEL?» ha risposta **si', tranne il
multi-hop**. Le forme single-hop (`$f`, `$f.value`, `$f.values`, `$f.values[N]`) parsano in
JjEL con AST isomorfo a quello di `parsePathExpr`; `$a.value.$b.value` no, perche'
`postfix()` consuma solo `IDENTIFIER` dopo il punto (`parser.ts:341-342`).

E la forma che Alfonso propone (`source` invece di `$source.value`, `parent` invece di una
risalita che oggi non esiste) non e' un'aggiunta al linguaggio: e' **l'idioma che JjEL ha
gia'**. Il builder di contesto appiattisce le chiavi `$attr` del proxy L in nomi nudi
(`jjel/evaluator/modelContext.ts:23-60`), con questo commento in testa: *"M1 instance
attribute values are stored in the L-layer proxy under `$attrName.value`, but JjEL users
expect to write just `attrName`"*.

---

## R-J1 — JjEL diventa il linguaggio delle espressioni dell'IR. Nessun caso custom

Si adotta JjEL. **Non** si introduce un campo «espressione libera» accanto al PathBuilder.

Rationale: un'espressione che il compilatore non sa decomporre non produce `dependencySet`
ne' `crossPaths`, quindi la view renderebbe una volta e poi resterebbe stale. E' la classe di
bug chiusa a luglio con l'opzione-d, riaperta per scelta. JjEL non e' codice arbitrario: e'
un AST camminabile, ed e' esattamente la ragione per cui la ratifica R-6 del 2026-08-03
vieta JS ma non vieta questo.

Guadagno collaterale, non estetico: il progetto **toglie** grammatiche invece di aggiungerne.
Il conto reale delle copie e' sei, non cinque; la sesta e' `utils/edgeExpressionEval.ts`, 103
righe di valutatore indipendente degli endpoint del substrato classic, viva, con grammatica
divergente da quella dell'IR e fallimento silenzioso. La sua intestazione di maggio prevedeva
gia' «future L2.5+ **or JjEL inline**».

## R-J2 — Profilo dichiarato, chiuso, allargabile per ratifica

Il profilo v1 accetta: `Identifier`, `MemberAccess`, `IndexAccess` con indice letterale
intero, e l'identificatore `parent`. Tutto il resto e' **rifiutato dal validatore con un
messaggio che dice perche'**: `MethodCall`, `FunctionCall`, `ForAll`, `Exists`, `IfThenElse`,
`NullCoalesce`, `Binary`, `Lambda`, `WithDo`, `IsType`, `InterpolatedString`, `ArrayLiteral`,
`ObjectLiteral`.

Rationale: i costrutti a dipendenza non limitata staticamente (`Class.instances`,
`forall x in <collezione>`, in prospettiva `closure()` dello Stage 8) rendono il
`dependencySet` non un insieme finito di nomi di feature ma «tutto il modello». Oggi PathExpr
**non puo'** esprimere una dipendenza illimitata, per costruzione, e quella garanzia e'
gratuita. Con JjEL va ricomprata, e il profilo e' il prezzo.

Il profilo si allarga per ratifica, un costrutto alla volta, quando esiste la risposta sul
lato reattivita'. Chiuso e allargabile, come il vocabolario delle azioni di R-6.

## R-J3 — Il multi-hop legacy si migra. JjEL non si tocca

`$a.value.$b.value` diventa `a.b`; `$a.values[0].$b.value` diventa `a[0].b`. Si **non**
allarga `postfix()` ad accettare `DOLLAR_IDENT` dopo il punto.

Rationale: allargare costa una riga ma congela in un linguaggio condiviso (console, Jodie,
JjTL) proprio la forma che vogliamo far sparire. Peggio: legittimerebbe `$x.value` nella
console, dove il contesto JjEL **non lega** i nomi col dollaro e il risultato sarebbe `null`
silenzioso. Una sintassi accettata dal parser e morta nel valutatore e' la peggiore delle tre
opzioni.

## R-J4 — La compatibilita' all'indietro vive nel walker dell'IR, non nel contesto

Lo spike lo dimostra: il walker normalizza `$f` + `.value` nello **stesso step** di `f`,
quindi ogni PathExpr single-hop persistito continua a compilare senza toccare ne' JjEL ne' il
contesto di valutazione. Nessun binding di `$feature` va aggiunto da nessuna parte.

Il ramo legacy del walker e' **temporaneo e dichiarato tale**: muore quando la migrazione
(R-J3) ha riscritto i path persistiti.

## R-J5 — `ReadCtx` cresce di un metodo, e il contesto resta lazy

`ReadCtx` acquisisce `getParent(elementId): string | null`, implementato sui due backend con
la stessa semantica gia' scritta in `resolveParentHandle` (`eval.ts:766-784`): due salti sulla
catena grezza, `DObject.father` -> `DValue` -> `father` -> `DObject`, e `null` esplicito sulle
radici. `irCrossDeps` acquisisce il ramo `parent` nella concretizzazione degli hop, accanto a
`navigateRefHop`.

**Vincolo dominante**: il contesto di valutazione dell'IR e' un adattatore lazy sul `ReadCtx`.
Non passa mai da `buildEvalContext` (`jjscript/executor/commands/eval.ts:93`), che
materializza l'intero modello, «O(objects x features), no cross-evaluation cache».

Nota su cosa e' stato ritirato: l'obiezione «interpretare invece di compilare costa» era
sbagliata come formulata. Misurato: 62-161 ns per valutazione JjEL contro 11-17 ns per la
closure, cioe' circa 0,25 ms per un canvas da 500 nodi a 5 espressioni. Il costo non e' la
valutazione, e' il contesto.

## R-J6 — Diagnostica sempre accesa, mai la variante silenziosa

L'IR usa **sempre** `jjelEvalWithDiagnostics` e porta i warning nel pannello di authoring, mai
`jjelEval`.

Rationale: `evaluateIdentifier` ritorna `null` in silenzio sugli identificatori non legati
(`evaluator.ts:211-260`), mentre oggi `parsePathExpr` lancia e `validateIR` mostra il
messaggio. Senza questa clausola, `nmae` invece di `name` smetterebbe di essere un errore
visibile e diventerebbe una label vuota. E' l'unica regressione seria che la migrazione puo'
introdurre, ed e' evitabile per costruzione.

---

## Cosa NON si decide qui

- **`utils/edgeExpressionEval.ts`**: resta viva e divergente. Slice separata, debito
  dichiarato. Finche' il substrato classic e' vivo, il progetto ha due semantiche di endpoint.
- **Il tipo statico degli endpoint**: «questa espressione produce un oggetto singolo» resta
  una domanda di cardinalita' senza type checker. La guardia si sposta a runtime (endpoint che
  non risolve a un `DObject` singolo -> card di fallback esplicita, spec v1.2 §7). Da
  ratificare quando la slice endpoint arriva, non prima.
- **Il corpus persistito**: quanti multi-hop esistano nei progetti reali non e' misurabile dal
  repo. Va contato su un progetto vero prima di dimensionare il VersionFixer.

---

## Staging

| Slice | Contenuto | Rischio |
|---|---|---|
| **J1** | Modulo puro `irJjelPath.ts`: walker AST -> `{fn, featureNames, crossPaths}`, profilo, ramo legacy. Test. **Nessun cablaggio.** | nullo, non entra in nessun percorso vivo |
| **J2** | `ReadCtx.getParent` sui due backend; ramo `parent` in `irCrossDeps`; `compilePath` accetta entrambe le grammatiche. Prima solo le **label**. | medio, cuore dell'interprete |
| **J3** | Superficie di authoring: il PathBuilder emette JjEL, campo testo con diagnostica, builder disabilitato con hint quando l'espressione esce dal sottoinsieme rappresentabile | medio, UX |
| **J4** | Endpoint object-as-edge + migrazione VersionFixer dei multi-hop persistiti | alto, tocca la resa a canvas |

L'ordine non e' negoziabile su un punto: **le label prima degli endpoint**. Un
`dependencySet` sbagliato su una label costa una label stale; sugli endpoint costa un arco
attaccato all'oggetto sbagliato, o sparito.


---

## Addendum di ratifica — 2026-08-18

Il memo e' andato a registro con un emendamento e una sigla in piu'. Il corpo sopra non e' stato
riscritto: e' l'artefatto del 2026-08-14 e resta leggibile come tale.

**Emendamento a R-J2 — il profilo lega `parent` *e* `container`.** Il memo elencava il solo
`parent` perche' il 14/8 era l'unico identificatore nudo previsto. Il 2026-08-17 la serie R-B13
ha spedito `container` come membro d'unione fuori grammatica: `EndpointExpr = PathExpr |
'container'`, verificato a codice in `irTypes.ts:220` (commento del contratto) e `:230`
(`CONTAINER_ENDPOINT`). Ratificare il profilo alla lettera avrebbe messo a registro una
descrizione gia' falsa rispetto al codice. Il profilo v1 lega quindi entrambi; quando J2 atterra,
l'unione collassa dentro la grammatica delle espressioni e `container` **resta legale solo negli
endpoint**, come oggi. R-B13 tiene per intero: il token non e' legale in predicati, label,
conditional, `TextSource`, `childFilter`.

**Coordinamento su `ReadCtx` (tocca R-J5).** R-B14 riserva la superficie di `ReadCtx`
all'estensione `state` (R-SIM-4); R-J5 vuole aggiungerci `getParent`. Non e' un conflitto — sono
due metodi — ma e' lo stesso punto di crescita: le due estensioni si sequenziano fra loro, e chi
arriva secondo rilegge la superficie prima di scrivere.

**R-J7, sigla nuova.** Il profilo e' l'unico punto di estensione della grammatica delle
espressioni: una forma nuova entra come identificatore legato o costrutto ammesso, mai come
ulteriore membro d'unione accanto a `PathExpr`. Origine della regola: in un mese la stessa
cucitura ha accumulato tre pressioni di estensione — `parent` previsto, `container` spedito,
`state` in arrivo — su una grammatica progettata chiusa (`STEP_RE` di `pathExpr.ts`, che accetta
solo `$feature | value | values | values[N]`). Conseguenza operativa immediata: il namespace
`state` di R-SIM-4 si progetta su questo terreno, non come quarto membro d'unione.

**Cosa la ratifica non fa.** Non schedula. Lo staging J1..J4 resta non calendarizzato; J2, che il
memo classifica «medio, cuore dell'interprete», non si apre senza go-ahead dedicato.
