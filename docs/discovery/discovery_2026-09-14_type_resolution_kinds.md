# Discovery — type resolution in `set ... type`, `create parameter`, `createReference`

Data: 2026-09-14
Prompt: `docs/prompts/claude_2026-09-14_1631_prompt_lane_c_type_resolution_kinds.md`
Ramo: `validation-skeleton`, HEAD `26d04febc`
Fase: 1 (sola lettura; nessun sorgente modificato)

## 1. Obiettivo

Accertare, per i tre siti che il prompt nomina, quale lookup eseguono oggi, cosa fanno su
tipo sconosciuto / omonimo fra due metamodelli / primitivo, quale forma di ritorno attende
il chiamante, e se il chiamante e' eseguibile in bench. In coda, la decisione del gate
condizionale.

## 2. File letti (percorsi completi)

- `frontend/src/jjscript/executor/resolvers.ts` (894 righe, intero)
- `frontend/src/jjscript/executor/commands/set.ts` (321 righe, intero)
- `frontend/src/jjscript/executor/commands/create.ts` (990 righe, intero nelle parti
  rilevanti: 1-120, 250-402, 480-870)
- `frontend/src/jjscript/executor/commands/add.ts` (42 righe, intero)
- `frontend/src/jjscript/executor/utils.ts` (`getTargetMetamodel`, 287-306)
- `frontend/src/jjscript/executor/__tests__/resolvers.test.ts` (652 righe, intestazione e
  inventario dei `describe`)
- `frontend/src/jjscript/parser/parser.ts` (`parseSetCommand` 552-584,
  `parseCreateOptions` 340-410, `parseValueOrQualified` 1220-1246,
  `expectIdentifierOrQualified` 1257-1268)
- `frontend/src/jjscript/parser/grammar.ts` (`parseTypeReference` 203-244)
- `frontend/src/jjscript/types.ts` (`TYPE_ALIASES` 540-564)
- `frontend/src/joiner/classes.ts` (`Constructors.resolveClassifier` 872-889,
  `Constructors.DTypedElement` 891-983, `Pointers.ESTRING` 1640)
- `frontend/src/common/Defaults.ts` (elenco `Pointer_E*`, 29-40)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`get_validTargets` 1332-1346;
  `DParameter` 2564-2612)
- `frontend/vite.config.ts` (config vitest: `environment: 'node'`)

Probe eseguite e poi rimosse (scratchpad, non committate): un file di test temporaneo
`__tests__/zz_probe.test.ts` per misurare importabilita' e forme di parse. I numeri qui
sotto vengono da quelle esecuzioni, non da lettura del codice.

## 3. Sito 1 — `set <el> type <X>` (`set.ts`)

### 3.1 Il lookup di oggi

`executeSet` (set.ts:83) chiama `convertValue(value, propertyInfo.type, project)`.
`convertValue` (set.ts:253-274) tratta i letterali e, per una `QualifiedName`, fa:

```ts
const resolved = resolveElement(qn, project);
return resolved?.id || qualifiedNameToString(qn);
```

- **pool**: l'intero progetto (`resolveTargetInProject`), nessuna preferenza per il
  metamodello attivo. `set.ts` non importa `getTargetMetamodel`.
- **kinds**: nessuno (`kinds` omesso) — quindi qualunque elemento che risponda al nome
  vince, classe, attributo, riferimento, letterale.
- **exact / case-insensitive**: la disciplina di `selectTarget` vale gia' (A1,
  `a52dfe5f3`): exact prima, poi case-insensitive, e la pluralita' e' ambiguita'. Ma
  `resolveElement` e' la scorciatoia che **butta via** `TargetResolution` e ritorna
  `.element`: un'ambiguita' arriva a `convertValue` come `null`, indistinguibile da
  «non trovato».
- **fallback**: `|| qualifiedNameToString(qn)` — la stringa del nome viene scritta al
  posto del puntatore, con `isPointer: true` (set.ts:105). Nessun errore, `success: true`.

### 3.2 Comportamento misurato

| input | oggi |
|---|---|
| tipo sconosciuto (`set age.type = Nope`) | `type` = stringa `'Nope'`, comando riuscito. `LTypedElement.get_type` risostituisce il father per ogni `data.type` falsy — qui non e' falsy ma non risolve, quindi il puntatore resta rotto |
| omonimo esatto in due metamodelli | `resolveElement` ritorna `null` (A1 riporta l'ambiguita' in `ambiguousWith`, che la scorciatoia scarta) → fallback stringa, comando riuscito |
| primitivo (`set age.type = String`) | nessun ramo primitivo in `set.ts`: `resolveElement` non trova `String` nel progetto (i primitivi m3 stanno nello store, non in un metamodello) → fallback stringa `'String'` |

### 3.3 La forma attesa dal chiamante

`convertValue` ritorna `any`, consumato a set.ts:83-95 (operatore `+=`/`-=`) e poi scritto
da `SetFieldAction.new(element, actualProperty, finalValue, undefined, isPointer)`.
Per riportare un errore serve **o** cambiare la forma di ritorno di `convertValue`
(funzione locale, non esportata: nessuna interfaccia esportata coinvolta) **o**
intercettare la proprieta' `type` prima della chiamata. `PropertyInfo` e' `interface`
locale non esportata. **Nessun cambio di interfaccia esportata e' richiesto.**

### 3.4 `convertValue` non serve solo i tipi — misurato

`convertValue` e' il convertitore di **ogni** valore `QualifiedName` del comando `set`, non
solo di `type`. Le proprieta' puntatore dichiarate a set.ts:197 sono
`['type', 'opposite', 'superTypes', 'exceptions']`.

Questo e' il punto in cui il COME del prompt («attribute type via `set` = enumerators»)
non si puo' applicare alla lettera: `type` e' raggiungibile anche su un **riferimento**
(set.ts:165 `referenceProps` include `'type'`) e su una **operazione** (set.ts:166). Un
`kinds = ['enum']` piatto su `type` trasformerebbe `set r.type = Person` — che oggi
funziona — in un errore. Regola 3 di CLAUDE.md: il comportamento committato non si degrada.

La tabella canonica dei kinds ammissibili per `type` esiste gia' nel prodotto, ed e'
`LTypedElement.get_validTargets` (`model/logicWrapper/LModelElement.tsx:1340-1346`):

```
DModel     -> models
DReference -> classi
DAttribute -> primitivi + enum
DParameter -> classi + primitivi + enum
DOperation -> classi + primitivi + enum (+ tipi di ritorno)
```

Le tre terne che il prompt fissa (attributo = enum + primitivi; parametro = enum + classi
+ primitivi; riferimento = solo classi) **coincidono** con quella tabella. La lettura
coerente e' quindi: i kinds di `set ... type` si derivano dall'elemento che si sta
tipando, con la stessa tabella. E' una decisione, non un dato: va ratificata.

### 3.5 Grammatica — cosa si scrive davvero (misurato, non dedotto)

Il lexer emette un solo token `QUALIFIED_NAME` per `Person.age`, e `parseSetCommand`
(parser.ts:552-584) ricava la property dal `member` di quel token. Misurato:

| riga | parse |
|---|---|
| `set age type Mood` | **ok** — target `age`, property `type`, value `Mood` |
| `set age.type = Mood` | **ok** — target `age`, property `type` |
| `set Person::age.type = Mood` | **ok** — target `Person::age`, property `type` |
| `set age.type = MM::Mood` | **ok** — value e' una `QualifiedName` a due segmenti |
| `set Person.age type Mood` | **errore di parse**: «Expected qualified name or identifier, found 'type'» |
| `set Person.age.type = Mood` | **errore di parse**: «...found '.'» |

Lo scenario di verifica visiva che il prompt annuncia (`set age type Mood`) e' la prima
riga: parsa. La forma con il punto dentro il percorso della classe non esiste; il
separatore di classe e' `::`.

**Conseguenza buona**: l'input qualificato `MM::Mood` come *valore* di `set` arriva
intatto al resolver. Per `set`, il requisito «qualified input raggiungibile dall'helper»
e' **verificato**.

## 4. Sito 2 — `create parameter ... type <X>` (`create.ts:812-866`)

### 4.1 Il lookup di oggi

Non ce n'e' uno. La riga e' `create.ts:844`:

```ts
const typeName = options?.type?.kind === 'primitive' ? options.type.type : undefined;
```

- **pool / kinds / case**: nessun resolver viene chiamato. `createParameter` non riceve
  nemmeno `project` ne' `targetMetamodel` (firma a create.ts:812-816, chiamata a
  create.ts:361: `createParameter(name, parentElement, options)`).
- Il valore passato a `DParameter.new(name, typeName, parentId, true)` per un primitivo
  e' l'**alias normalizzato di JjScript** (`'String'`, `'Integer'`, `'Boolean'`, …,
  `types.ts:540-564`), **non** il nome Ecore (`'EString'`) e **non** un `Pointer_E*`.

### 4.2 Comportamento misurato, leggendo `Constructors.DTypedElement`

`DTypedElement` (`joiner/classes.ts:891-983`) scorta `'Integer'` cosi':
non e' `/^Pointer_E[A-Z]+$/`, quindi `resolveClassifier('Integer')` cerca
`idlookup['Integer']` (niente) e poi `getByName2('Integer', 'DClass' | 'DEnumerator' |
'DDataType')` (niente) → `dtype` undefined → `type = undefined` → `Log.ww` → ramo
`case 'DParameter': type = Pointers.ESTRING` (classes.ts:974-977).

| input | oggi |
|---|---|
| `type Person` (classe) | `typeName` undefined → nessun `Log.ww` (il seed e' «voluto») → parametro tipato **EString**, comando riuscito. E' lo scarto silenzioso che il COSA descrive |
| `type Mood` (enum) | identico: il parser lo consegna come `kind: 'class'` |
| `type Integer` | `'Integer'` non risolve → **EString**, con un `Log.ww` in console. Il downgrade silenzioso e' lo stesso di `create attribute` prima di `39c5bf4ab` |
| `type String` | `'String'` non risolve → EString: esito giusto per la ragione sbagliata |
| nessuna clausola `type` | `undefined` → seed EString, che e' il default documentato |
| tipo sconosciuto | EString, `success: true` |
| omonimo in due metamodelli | irrilevante: non si risolve nulla |

### 4.3 Forma attesa dal chiamante

`createParameter` e' `async function` **locale** (non esportata), unico chiamante il
`switch` a create.ts:360-362. Aggiungere `project` e `targetMetamodel` alla firma e'
interno al file. **Nessuna interfaccia esportata coinvolta.**

Il puntatore da scrivere per un primitivo e' `(Defaults as any)['Pointer_' + short]`
(`Pointer_ESTRING`, `Pointer_EINT`, …, `common/Defaults.ts:29-40`), la stessa forma che
`resolveAttributeType` gia' usa (create.ts:520). `DTypedElement` ha lo short-circuit che
accetta i `Pointer_E*` direttamente (classes.ts:899-902), quindi passarlo a
`DParameter.new` e' la strada gia' battuta da `DAttribute.new`.

## 5. Sito 3 — `createReference` (`create.ts:644-754`)

### 5.1 Il lookup di oggi (create.ts:686-705)

```ts
let targetClass = targetMetamodel ? resolveElementInMetamodel(options.type.name, targetMetamodel) : null;
if (!targetClass) targetClass = resolveElement(options.type.name, project);
if (targetClass) { SetFieldAction.new(newRef, 'type', targetClass.id, undefined, true); }
```

- **pool**: metamodello prima, progetto dopo — l'ordine giusto, gia' quello che
  `resolveEnumTypeTarget` replica.
- **kinds**: **nessuno**. E' il difetto che il COSA nomina: un enum, un attributo o una
  operazione che rispondano al nome vengono accettati come tipo di un riferimento.
- **exact / case**: la disciplina di `selectTarget` vale, ma di nuovo attraverso le
  scorciatoie `resolveElement*` che scartano `TargetResolution`: un'ambiguita' diventa
  `null` e cade nel `if (targetClass)` mancato.
- **ordine delle operazioni**: `DReference.new(...)` e' chiamata **prima** (create.ts:682),
  il tipo si scrive dopo. Un tipo irrisolvibile lascia quindi un riferimento a meta'.

### 5.2 Comportamento misurato

| input | oggi |
|---|---|
| `type Person` (classe esistente) | corretto |
| `type Mood` (enum) | il riferimento viene tipato **con l'enum**. `Constructors` non lo protegge: il `SetFieldAction` e' un field-write diretto, non passa da `DTypedElement` |
| tipo sconosciuto | nessun `SetFieldAction`; il riferimento resta col seed di `DReference.new(name, undefined, …)`, che con `requested === undefined` prende **il father** come tipo (classes.ts:967-969) — il riferimento punta al proprio contenitore. `success: true` |
| omonimo esatto in due metamodelli | `resolveElement` → `null` → stesso esito del tipo sconosciuto, `success: true` |
| primitivo (`type String`) | `options.type.kind === 'primitive'` → il `if` a create.ts:688 non entra → stesso esito, `success: true` |

### 5.3 Forma attesa

`createReference` e' locale, chiamata solo a create.ts:347 e 353; riceve gia' `project` e
`targetMetamodel`. Nessuna modifica di firma necessaria.

## 6. Bench — cosa e' eseguibile, misurato oggi

Config: `frontend/vite.config.ts`, `test.environment: 'node'`, include
`src/**/__tests__/**/*.test.ts`.

- `commands/create.ts` e `commands/set.ts`: **NON importabili**. Misurato con una probe
  temporanea: entrambi falliscono con
  `ReferenceError: window is not defined` a
  `node_modules/monaco-editor/esm/vs/base/browser/window.js:14`, raggiunto attraverso il
  barrel `joiner`. La nota in testa a `resolvers.test.ts` (2026-09-11) vale ancora.
- `executor/resolvers.ts`: importabile, 652 righe di test gia' verdi.
- `parser/parser.ts` e `parser/grammar.ts`: **importabili** (sono stati la base delle
  misure §3.5 e §7).

Controllo positivo dell'asserzione di non-importabilita': la stessa probe, nello stesso
file e con lo stesso comando, importa `parser/parser.ts` e ne esegue `parse` con esito
verde. Il silenzio di `create.ts`/`set.ts` e' quindi un fallimento reale, non uno
strumento rotto.

Conseguenza per la Fase 2: i test di comportamento vanno sull'helper in
`__tests__/resolvers.test.ts`; per i tre chiamanti resta il buco dichiarato, come il
prompt prevede.

## 7. Rilievo non richiesto ma bloccante per un requisito del prompt

Il prompt chiede: «Qualified input `Metamodel::X` resolves within that metamodel (already
supported by `selectTarget`; verify it is reachable from the helper)».

**Per `create ... type MM::X` NON e' raggiungibile.** Misurato:

```
create attribute age in Person type MM::Mood   -> parse error: "raw.trim is not a function"
create parameter p in Shape::draw type MM::Person -> stesso errore
create reference r in A type MM::Person        -> stesso errore
```

Causa: `parser.ts:352`

```ts
options.type = parseTypeReference(this.expectIdentifierOrQualified('type name') as string);
```

`expectIdentifierOrQualified` (parser.ts:1257-1268) ritorna un **oggetto `QualifiedName`**
quando il token e' `QUALIFIED_NAME` — e il lexer emette proprio `QUALIFIED_NAME:MM::Mood`.
`parseTypeReference(raw: string)` fa `raw.trim()` sulla prima riga: `TypeError`, che il
parser converte in errore di parse. Il `as string` e' un cast che copre esattamente il
caso che rompe. Identico a `parser.ts:404` per `returns`.

Quindi la R3 del referto del 2026-09-11 («qualificato gia' risolve») e' vera **del
resolver** e falsa **end-to-end** per il comando `create`. Per `set` invece e' vera anche
end-to-end (§3.5), perche' il valore passa da `parseValueOrQualified`, che non ha quel
cast.

`parser.ts` **non e' in DOVE**. Il rilievo si dichiara e non si tocca.

## 8. Quarto sito della stessa famiglia

`createOperation` (`create.ts:756-810`), riga 788:

```ts
const returnType = options?.returnType?.kind === 'primitive' ? options.returnType.type : undefined;
```

E' lo stesso difetto di `create parameter`, riga per riga: scarto silenzioso del tipo di
ritorno non primitivo, alias JjScript non normalizzato per il primitivo, nessun resolver,
`createOperation(name, parentElement, options)` senza `project` ne' `targetMetamodel`
(chiamata a create.ts:357). I kinds ammissibili sarebbero classi + enum + primitivi
(`get_validTargets`, `DOperation`).

Il COSA ne nomina tre. Questo e' il quarto, nello stesso file, e **non viene toccato**
senza ratifica.

## 9. Inventario: nessun altro chiamante degli stessi percorsi

- `convertValue`: un solo chiamante esterno, `executeSet` (set.ts:83), piu' la ricorsione
  sugli array (set.ts:265). Verificato con `command grep -rn convertValue frontend/src`.
- `createParameter`, `createReference`, `createOperation`: locali a `create.ts`, chiamati
  solo dal `switch` di `executeCreate`. Gli hit fuori file per quei nomi sono omonimi
  scollegati (`components/editor-v2/types.ts`, `autocomplete/providers/metamodel.ts`,
  `jjtl/services/SimpleMatcher.ts`) — verificato uno per uno.
- `executeAdd` (`add.ts`) ricostruisce gli argomenti e delega a `executeCreate`: eredita i
  fix senza codice proprio.
- `resolveEnumTypeTarget`: un solo chiamante di produzione, `create.ts:548`
  (`resolveAttributeType`), piu' `resolvers.test.ts`.
- Scritture di `'type'` altrove in `jjscript/`: `copy.ts:234, 268, 289`, che ricopiano
  `source.type` (gia' un puntatore) — nessuna risoluzione per nome, fuori perimetro.

## 10. Rischi

- **R1 — i kinds di `set` derivati dall'elemento.** Se si applicasse `['enum']` piatto,
  `set r.type = Person` regredirebbe. La mitigazione proposta (tabella per className,
  §3.4) e' un ampliamento del COME del prompt e va ratificata.
- **R2 — il primitivo di `create parameter` cambia valore scritto.** Oggi `type Integer`
  finisce a EString; dopo, a `Pointer_EINT`. E' una correzione, non una regressione, ma e'
  un cambio di comportamento oltre la frase «scarta silenziosamente un tipo non
  primitivo».
- **R3 — `createReference` deve risolvere prima di creare.** Spostare la risoluzione prima
  di `DReference.new` cambia l'ordine delle azioni Redux del comando. Nessuna `TRANSACTION`
  e' coinvolta e il file non e' in critical zone (§3.1), ma va detto.
- **R4 — il buco di verifica resta.** I tre chiamanti non sono eseguibili in bench: la
  verifica e' manuale su localhost.
- **R5 — l'input qualificato per `create` non e' verificabile end-to-end** finche'
  `parser.ts:352` resta com'e' (§7).

## 11. Domande aperte (gate)

1. `set ... type`: si ratifica la derivazione dei kinds dall'elemento tipato, con la
   tabella di `get_validTargets` (attributo → enum+primitivi, riferimento → classi,
   parametro/operazione → classi+enum+primitivi)?
2. `createOperation` (§8): dentro o fuori questo giro?
3. `parser.ts:352` / `:404` (§7): si apre una corsia a parte, o si accetta che
   «qualified input» resti non raggiungibile per `create` in questo giro?

## 12. Esito del gate

Il gate condizionale del prompt si attiva: c'e' **un quarto sito** (§8), c'e' **un dubbio
semantico** sui kinds di `set` (§3.4), e c'e' **un requisito del prompt non soddisfabile
dentro DOVE** (§7). Fase 2 sospesa, in attesa di risposta.

---

## 13. Addendum — ratifica e Fase 2 (stesso giro)

Le tre domande di §11 sono state poste in chat e risposte, tutte sull'opzione raccomandata:

1. **Kinds di `set` derivati dall'elemento tipato** — ratificato. La tabella di
   `get_validTargets` e' quella implementata, in `SET_TYPE_RULES` (`commands/set.ts`) e in
   `TYPE_CLAUSE_RULES` (`commands/create.ts`), chiavi sul className **D-layer** (§3.13).
2. **`createOperation` (§8) dentro questo giro** — ratificato. Deroga alla regola 1
   dichiarata qui e nel campo `Out-of-scope changes` della entry, secondo RC-11: quarto
   sito, stesso file, stesso helper.
3. **`parser.ts:352` / `:404` (§7) fuori perimetro** — ratificato. Il difetto resta e
   resta iscritto qui; `create ... type MM::X` continua a non parsare.

### 13.1 Cosa e' stato scritto

Commit `3e3ab691a`, 4 file.

| file | cosa cambia |
|---|---|
| `executor/resolvers.ts` | nuovo `resolveTypeTarget(name, metamodel, project, kinds)`; `resolveEnumTypeTarget` diventa la sua istanza `['enum']` e **non e' rinominato** |
| `executor/commands/create.ts` | `TYPE_CLAUSE_RULES` + `resolveTypeClause`, su cui delegano `resolveAttributeType` (invariato il default EString quando la clausola manca), `createReference`, `createParameter`, `createOperation`. `pointerFor` sale a livello di modulo. `createParameter`/`createOperation` ricevono `project` e `targetMetamodel` (firme locali, non esportate) |
| `executor/commands/set.ts` | `SET_TYPE_RULES` + `setTypeRuleFor` + `resolveSetType`; `executeSet` instrada `type` la' e lascia ogni altra proprieta' su `convertValue`, intatto |
| `executor/__tests__/resolvers.test.ts` | 11 test nuovi (54 → 65) |

Ordine delle operazioni cambiato in `createReference`, `createParameter`,
`createOperation`: il tipo si risolve **prima** di `.new()`, come gia' faceva
`createAttribute`. Nessuna `TRANSACTION` coinvolta; nessun file della critical zone (§3.1).

### 13.2 Il fallback che sparisce, per sito

| sito | prima | dopo |
|---|---|---|
| `set <attr>.type` | nome scritto come puntatore, `success: true` | enum o primitivo, altrimenti errore |
| `set <ref>.type` | idem, senza restrizione di kind | solo classe, altrimenti errore |
| `create parameter type Person` | scartato in silenzio → EString | risolto; se irrisolvibile, errore |
| `create parameter type Integer` | EString + `Log.ww` | `Pointer_EINT` |
| `create operation returns Person` | scartato in silenzio → father | risolto; se irrisolvibile, errore |
| `create reference type Mood` | riferimento tipato con l'**enum** | errore: un riferimento punta a una classe |
| `create reference` tipo ignoto o ambiguo | riferimento creato, tipo = proprio contenitore | errore, nessun elemento creato |

### 13.3 Gate eseguiti

- `npm run typecheck`: **33** righe `error TS` su output completo — la baseline dichiarata
  in CLAUDE.md §17. **0** in ciascuno dei tre sorgenti toccati, contate una per una.
  Controllo positivo con segnale, stesso comando e stesso output: `src/` → 69 righe.
- `npx vitest run src/jjscript/executor/__tests__/resolvers.test.ts`: **65 passati, 0
  falliti** (erano 54).
- `npx vitest run src/jjscript`: **326 passati**, 9 file verdi su 10. Il decimo,
  `__tests__/context-binding.test.ts`, fallisce all'import con `window is not defined`
  (monaco via il barrel `joiner`). **Misurato pre-esistente**: ripristinati i quattro file
  da `git show HEAD:<path>`, rieseguito, stesso fallimento; poi rimessi a posto da copia,
  `diff` a zero su tutti e quattro, indice mai toccato (§6.4).
- `npm run build`: exit 0, solo il warning di chunk-size gia' noto.

### 13.4 Cosa resta scoperto

- I tre comandi non sono eseguibili in bench (§6): la verifica e' manuale.
- `create ... type MM::X` non parsa (§7). Il percorso qualificato dell'helper e' coperto
  dai test unitari e, end-to-end, solo da `set`.
