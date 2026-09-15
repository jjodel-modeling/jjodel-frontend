# Discovery — JjTL: istanze sorgente contenute e creazione annidata

**Data**: 2026-09-06
**Prompt**: `docs/prompts/claude_2026-09-06_1440_prompt_jjtl_contained_sources_and_nested_creation.md`
**Fase**: 1 (read-only). Hard stop dopo questo referto: nessun file di codice toccato.
**Base**: branch `alfonso-frontend-jjtl`, HEAD `54b65d705`.
**Referto precedente sullo stesso tema**: `docs/discovery/discovery_2026-09-04_jjtl_nested_object_creation.md`
(fix del parser `a4355b365`, che la entry di log del 2026-09-04 cita come `1c567930d` — SHA
inesistente su questo albero, vedi §9 R5).

---

## 1. Ipotesi che la discovery falsifica

| # | Ipotesi dal prompt | Esito |
|---|---|---|
| H1 | Il sintomo 1 nasce da `sourceModel.objects` = soli oggetti radice | **CONFERMATA** (§3, §4.1) |
| H2 | Il sintomo 2 nasce da `checkBody` che valida un nome di feature come classe | **CONFERMATA MA INSUFFICIENTE** (§5): il warning è reale, ma anche eliminandolo gli oggetti annidati **non** diventano DObject (§6) |
| H3 | `-> Class { … }` a livello di regola «gira in silenzio e non crea nulla» | **CONFERMATA** (§6.2) |
| H4 | «`name := a.name` dentro un blocco forall non parsa» | **FALSIFICATA** (§7.1): parsa. Il messaggio `Expected source attribute name` viene da un caso diverso, il value mapping dopo la conversione (§7.3) |
| H5 | «`->` deve stare sulla stessa riga di `forall … in …`» | **CONFERMATA** (§7.2), e chiude la domanda aperta lasciata da F5 del referto 2026-09-04 |
| H6 | «un value mapping dopo la forma di conversione non parsa» | **CONFERMATA**, con root cause precisa (§7.3) |

---

## 2. File letti (path completi)

Codice:
- `frontend/src/components/project/ProjectEditor.tsx` (1399-1417 `wrapIfRef`; 1450-1571 costruzione di `sourceModelData`; 1584 chiamata all'executor; 1719-1815 STEP 6; 1880-2025 STEP 8 / 8b)
- `frontend/src/jjtl/executor/executor.ts` (66 import; 371-511 `execute`; 518-595 `validateTargetClasses`; 601-650 `initializeContext`; 719-785 `extractSourceInstances`; 798-830 `pass1CreateTargets`; 1044-1117 `createTargetInstance`; 1122-1230 `executeAttributeMappings*`; 1425-1490 `executeAttributeMapping`; 1549-1644 `executeObjectCreation`; 1648-1715 `executeForAllMapping`; 1718-1783 `executeForAllMappingOnObject`; `applyCrossTypeResolution` / `wrapIfTargetReference` / `resolveValue`; `createInstanceContext` incl. risoluzione di `parent`)
- `frontend/src/jjtl/executor/jjodelConverter.ts` (intero; in particolare 354-410 `convertResultToJjodel`)
- `frontend/src/jjtl/parser/parser.ts` (209-232 `mappingBody`; 237-360 `attributeMapping`; 368-414 `findValueMappingColon`; 415-431 `parseValueMappingPairs`; 432-455 `objectCreation`; 489-531 `forAllMapping`; 534-568 `conversion` / `isValueMappingStart`; 1412-1416 `skipNewlines`; 1472-1475 `parse`)
- `frontend/src/jjtl/types/ast.ts` (intero)
- `frontend/src/jjtl/hooks/useJjtlParser.ts` (40-75), `frontend/src/jjtl/hooks/useJjtlExecutor.ts` (55-140)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (5661-5665 `get_objects`; 5791-5824 `get_allSubObjects` / `_getallSub`; 3142-3152 `get_allAttributes` / `get_allReferences`; 7195-7300 `LValue.addObject`) — **lettura, nessuna modifica: fuori perimetro**
- `frontend/src/joiner/classes.ts` (3512-3515 `LProject.get_objects`) — **lettura, fuori perimetro**

Documenti:
- `frontend/src/jjtl/SPEC.md` (§3.3, §4.4-4.6, §9.1-9.2, §10, §12.1-12.3, §13.1)
- `frontend/src/jjtl/CLAUDE.md`, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `docs/claude-code-log.md`
- `frontend/src/jjtl/__tests__/forall-mapping.test.ts`, `frontend/src/jjtl/__tests__/nested-object-creation.test.ts`
- `docs/discovery/discovery_2026-09-04_jjtl_nested_object_creation.md`

---

## 3. Metodo: le sonde, e cosa hanno stubbato

I findings non nascono dalla lettura del comparatore ma dall'**esecuzione** del soggetto
(CLAUDE.md §5, PROTOCOL P11). Quattro sonde, tutte fuori albero, in
`/private/tmp/.../scratchpad` (nessun file creato o lasciato in `frontend/src`):

| Sonda | Soggetto eseguito | Cosa misura |
|---|---|---|
| `probe.test.ts` | `tokenize` + `parse` | AST delle 6 forme, con e senza delega JjEL |
| `probe2.test.ts` | `tokenize` + `parse` + `execute` | `targetModel.instances`, `warnings`, `stats` per le 4 forme e per sorgente con/senza istanze contenute |
| `probe3.test.ts` | idem | forma della collection nel `forall`: `{__ref}` contro oggetti inline |
| `probe4.test.ts` | `tokenize` + `parse` | 10 varianti di sintassi × 2 percorsi (con/senza `source`) |

**Scostamento dichiarato**: per importare `executor.ts` sotto `environment: 'node'` la sonda
alias-a `monaco-editor`, `jquery`, `sweetalert2` e il modulo `../../joiner` (di cui l'executor
usa il solo `U.asNumber`, riprodotto fedelmente). Il soggetto — lexer, parser, executor — gira
**intero e non stubbato**. Senza questo, l'import fallisce con
`ReferenceError: window is not defined`: è la stessa condizione pre-esistente che rende rossi 7
file della suite `src/jjtl` (fra cui `forall-mapping.test.ts`), verificata qui eseguendo quel
file su HEAD.

**Un falso verde incontrato e corretto, che vale la pena registrare.** Il primo giro di
`probe3` ha riportato `1 passed` senza scrivere il file di output: il `sed` che doveva ripuntare
`include` nella config aveva cercato una stringa che nella config non c'era, e vitest ha
rieseguito `probe2`. Un verde indistinguibile da quello giusto. Il controllo che l'ha smascherato
è banale e va fatto sempre: **verificare che l'artefatto atteso esista**, non che il runner sia
verde.

---

## 4. Sintomo 1 — le istanze contenute non arrivano mai all'executor

### 4.1 Il percorso del dato, confermato

`ProjectEditor.tsx:1450`

```ts
const sourceObjects = (sourceModel.objects || []).filter((obj: LObject | null | undefined) => { … });
```

`sourceModel` è una `LModel` (`ProjectEditor.tsx:81` `models: LModel[]`, `:205`
`project.models`). `LModel.get_objects` (`LModelElement.tsx:5662`):

```ts
protected get_objects(context: Context, includeCrossReferences: boolean = false): this['objects'] {
    let ret: LObject[] = context.data.objects.map((pointer) => LPointerTargetable.from(pointer));
    …
}
```

`context.data.objects` è il campo D-layer del modello: **solo le radici**. Gli oggetti contenuti
hanno per `father` la `DValue` dello slot del genitore, non il `DModel`, e non compaiono lì.

`LModel.get_allSubObjects` (`LModelElement.tsx:5793`) delega a `_getallSub`, che scandisce
`Selectors.getAll(DObject, …)` e tiene ogni `DObject` il cui `l.model.id` è quello del modello:
radici **e** contenuti. Che sia l'accessore giusto è già asserito altrove nel codebase —
`LProject.get_objects` (`joiner/classes.ts:3512`) fa `data.models.flatMap(m => m.allSubObjects)`.

### 4.2 Misura

`probe2`, regola `Attribute -> Column { name := name }`, stesso metamodello target, due sorgenti:

| Sorgente | `warnings` | `Column` creati |
|---|---|---|
| solo radici (oggi) | `Source class 'Attribute' has no instances in the source model. Mapping 'Attribute -> Column' produced no output.` | 0 |
| radici + contenuti | `[]` | 3, con `name` = `ssn`, `age`, `vat` |

Il messaggio è **verbatim** quello riportato nel prompt (`executor.ts:819`). Il resto della
pipeline non ha bisogno di nulla: `extractSourceInstances` (`executor.ts:719-740`) indicizza per
`item.className || item.__type`, che il ramo `.map` di `ProjectEditor` popola già per ogni
oggetto.

### 4.3 `_containerId` e `parent` continuano a funzionare

`ProjectEditor.tsx:1558-1568` calcola già `_containerId` risalendo `__raw.father → DValue →
DValue.father`, e lascia il campo assente per le radici. Il calcolo è per-oggetto e non dipende
da quale collezione lo ha prodotto: si applica identico agli oggetti contenuti.

`executor.ts` `createInstanceContext` risolve `parent` così:

```
1. feature utente chiamata "parent"
2. _containerId → sourceArr.find(o => o.id === containerId)
3. fallback .father / .eContainer / .owner
```

Il passo 2 cerca il genitore **dentro l'array sorgente**. Oggi un oggetto contenuto non è
nell'array, quindi il punto è muto; enumerandoli, sia il figlio sia il genitore ci sono e
`parent` risolve. Non c'è regressione possibile sul passo 2 per gli oggetti radice: il loro
`_containerId` resta assente.

### 4.4 Risoluzione cross-type dei sorgenti contenuti in Pass 2

`resolveValue` risolve `{ __ref: pointerId }` **contro la trace**, cioè cerca il target prodotto
dal sorgente con quel pointer. Con le istanze contenute enumerate, Pass 1 le registra in trace
come ogni altra, quindi un `source := left` che punta a un oggetto contenuto risolve. Senza
enumerazione, il pointer non è in trace e il valore viene lasciato cadere.

---

## 5. Sintomo 2, primo strato — `-> feature { … }` e la validazione

### 5.1 Come parsa oggi (misurato, `probe.test.ts`)

`attributeMapping()` (`parser.ts:249-282`), ramo `-> IDENT`:

- se dopo `{` (saltati i NEWLINE, `parser.ts:259`, fix `a4355b365`) c'è un `ARROW`
  → `objectCreation(targetAttribute)`, e `targetClass` è la classe interna. **Il parametro
  `parentAttr` di `objectCreation()` (`parser.ts:433`) non viene mai usato**: il nome della
  feature sopravvive solo come `AttributeMapping.targetAttribute`.
- altrimenti → ramo «nested mapping body», e `targetClass = targetAttribute`, cioè **il nome
  della feature usato come nome di classe**.

Un `forall` non è un `ARROW`. Quindi:

| Forma | `AttributeMapping.targetAttribute` | `ObjectCreation.targetClass` |
|---|---|---|
| `-> columns {` NL `forall a in … -> Column { … }` NL `}` | `columns` | **`columns`** |
| `-> columns {` NL `-> Column { … }` NL `}` | `columns` | `Column` |
| `-> Column { … }` a livello di regola | `Column` | `Column` |

### 5.2 Il warning

`validateTargetClasses.checkBody` (`executor.ts:574-587`) valida
`item.objectCreation.targetClass` contro le classi del metamodello target, per
`AttributeMapping` e `ForAllMapping` allo stesso modo. Con `targetClass = 'columns'`
(`executor.ts:566`):

```
Target class 'columns' not found in target metamodel (object creation in Table). Mapping skipped.
```

Verbatim quello del prompt. Misurato in `probe2`/`probe3`.

**«Mapping skipped» è falso.** `unknownTargetClasses` è consultato solo da `pass1CreateTargets`
(`executor.ts:803`), cioè per le classi target di **regola**. Una object-creation annidata non
lo consulta: l'esecuzione prosegue e produce, su `Table.columns`, un oggetto-involucro
`{ __type: 'columns', className: 'columns', columns: [ …Column… ] }`. Il messaggio descrive un
comportamento che non c'è.

### 5.3 «Stesso warning senza il `forall`» — non riproducibile su HEAD

Con `-> columns { -> Column { name := "id" } }`, su HEAD, `targetClass = 'Column'` e i warning
sono **vuoti** (`probe2`, blocco R3). Il warning su `'columns'` per quella forma è il
comportamento **precedente** al fix `a4355b365` (2026-09-04 23:46). L'osservazione del prompt su
questo punto è quindi coerente con una build di `beta.jjodel.io` anteriore a quel commit. Da
verificare prima di trattarla come sintomo aperto: **non è un difetto del codice in albero**.

---

## 6. Sintomo 2, secondo strato — la ragione vera: nessun oggetto annidato diventa mai un DObject

Questo è il finding che cambia la forma della Fase 2. Anche togliendo il warning, **nessuna delle
tre forme produce un `Column` nel modello**, per due ragioni indipendenti e entrambe a valle del
parser.

### 6.1 L'executor non registra gli annidati fra le istanze

`executeObjectCreation` (`executor.ts:1549-1644`) costruisce un oggetto **piano**
`{ __type, className, …bindings }` e lo **restituisce come valore**; chi lo ha chiesto lo scrive
in `targetInstance[targetAttribute]` (`executor.ts:1482`). Nessuna scrittura su
`targetModel.instances`: quella Map è popolata solo da `createTargetInstances`
(`executor.ts:1075-1083`), cioè solo per le classi target di **regola**.

Corollario misurato: `stats.targetInstancesCreated` conta anche gli annidati (5 in R2 di
`probe2`) mentre `targetModel.instances` ne contiene 2. Il numero nel Trace non corrisponde a
ciò che il modello riceverà.

Nota: gli oggetti annidati **non** portano `__createdBy: 'JjTL'` (lo mette solo
`createTargetInstance`, `executor.ts:1103-1113`), quindi nemmeno
`wrapIfTargetReference` li marca come `{ __ref_result }`.

### 6.2 `ProjectEditor` STEP 6 scarta il valore

`ProjectEditor.tsx:1780-1791`, whitelist:

```ts
const domainAttrNames = new Set((targetClass.allAttributes || []).map((a: any) => a.name).filter(Boolean));
for (const [attrName, attrValue] of Object.entries(instanceData)) {
    if (!domainAttrNames.has(attrName)) continue;
    …
}
```

`LClass.get_allAttributes` (`LModelElement.tsx:3142`) è `ownAttributes + inheritedAttributes`:
**le reference non ci sono** (stanno in `get_allReferences`, `:3145`). `columns` è una
composition reference → mai in `pendingAttributeSets`.

Il secondo canale, `pendingReferenceSets` (`ProjectEditor.tsx:1801-1810`), accetta solo valori
con `__ref_result` — che, per §6.1, gli annidati non hanno mai.

**Quindi il valore cade in un buco fra due filtri, senza un solo messaggio.** È esattamente ciò
che il prompt descrive come «gira in silenzio e non crea nulla», ed è vero per **tutte e tre** le
forme, non solo per `-> Column { … }` a livello di regola.

### 6.3 Misure (`probe2`, `probe3`)

| Forma | warning | `Table.columns` (o omonimo) nell'output executor | DObject `Column` creati |
|---|---|---|---|
| `-> columns { forall a in ownedAttributes -> Column { … } }` | `'columns' not found` | `{__type:'columns', columns:[Column, Column]}` | **0** |
| `-> columns { -> Column { … } }` | nessuno | `{__type:'Column', name:'id'}` (oggetto singolo, non array) | **0** |
| `-> Column { … }` a livello di regola | nessuno | proprietà **`Column`** = `{__type:'Column', …}` | **0** |
| `forall a in ownedAttributes -> Column { … }` a livello di regola | nessuno | `columns: [Column, Column]` — **array vero** | **0** |

### 6.4 Quale forma «dovrebbe» funzionare, secondo il codice e secondo i documenti

- **Il codice** supporta compiutamente **una** forma: il `forall` **a livello di regola**, senza
  involucro. `executeForAllMapping` (`executor.ts:1701-1714`) appende i risultati a una proprietà
  ricavata dalla **euristica di pluralizzazione** `targetClass[0].toLowerCase() + slice(1) + 's'`
  — `Column` → `columns`. Tutti i test di `forall-mapping.test.ts` (9 test) usano questa forma e
  asseriscono su `target.columns`. Che il nome coincida con la feature è, come dice il prompt,
  una coincidenza: `Person → persons` sbaglierebbe, e per una feature chiamata `cols` sbaglia
  sempre.
- **La SPEC interna** (`frontend/src/jjtl/SPEC.md` §3.3 e §13.1) documenta l'altra forma,
  `-> arcs { -> Arc { … } }`, e la grammatica
  `objectCreation = "{" ( "->" IDENTIFIER objectCreation | mappingBodyItem )* "}"`.
  **`forall` non compare in SPEC.md: zero occorrenze.** La forma del prompt
  (`-> feature { forall … }`) non è documentata da nessuna delle due parti in questo repo; il
  documento che la descrive è `jjodel-docs`, che qui non c'è (RC-10: dichiarato, si procede sul
  resto).
- Nessuna delle due forme documentate arriva comunque a creare un DObject (§6.1-6.2). La SPEC lo
  ammette a metà: §9.2 «Target Model Write-back — **Not in jjodelConverter**. Lives in
  `ProjectEditor.tsx` with timing workarounds», e §12.1 elenca «Nested object creation ✅»
  riferendosi al solo executor.

### 6.5 `convertResultToJjodel` è codice morto

`executor.ts:66` lo importa; nel file non c'è **nessun'altra occorrenza** (`grep -c` = 1). In
tutto `frontend/src` le uniche occorrenze sono l'import, la definizione
(`jjodelConverter.ts:354`) e una menzione in SPEC.md:557. La conversione risultato → DObject
avviene interamente in `ProjectEditor` STEP 6/8/8b. Da **non** rimuovere (regola 9); segnalato
perché il prompt lo indicava come punto da verificare: non è il posto dove intervenire.

---

## 7. Limiti del parser (domanda 3 del prompt)

Tutti misurati con `probe4`, dieci varianti × due percorsi (`parse(tokens)` e
`parse(tokens, source)`). **Nota di percorso**: `useJjtlParser.ts:61` chiama `parse(lexerResult.tokens)`
**senza** `source`, quindi in app è attivo il percorso `this.expression()`, non la delega JjEL.
I messaggi che l'utente vede sono quelli della colonna «nosrc».

| Forma dentro `forall … -> Column { … }` | nosrc | src |
|---|---|---|
| `name := a.name` | **OK** | **OK** |
| `a.name -> name` (legacy, source attr puntato) | `Expected '->'` | idem |
| `-> name : a.name` | OK | OK |
| `-> type : a.type : String=VARCHAR, Integer=INT` | `Expected source attribute name` | 3 errori JjEL su `=` |
| `type := a.type : String=VARCHAR, Integer=INT` | `Expected source attribute name` | 3 errori JjEL su `=` |
| `forall a in coll` NL `-> Column {` | `Expected '->' for object creation in forall` | idem |
| `forall a in coll such that a.isKey` NL `-> Column {` | idem | idem |

### 7.1 `name := a.name` dentro il forall **parsa** — H4 falsificata

Il ramo `IDENTIFIER ASSIGN` (`parser.ts:283`) non guarda dentro il `forall`: la RHS è
un'espressione qualsiasi e `a.name` è un `MemberAccess` regolare. Verificato anche dai test
esistenti: `forall-mapping.test.ts:140` e `:342` usano `name := a.name` e sono verdi.

Ciò che **non** parsa è la forma legacy **inversa**, `a.name -> name`, con l'attributo sorgente
puntato a sinistra — ed è esattamente il limite già scritto in `frontend/src/jjtl/CLAUDE.md`
(«Source attribute in forall: `a.name -> targetAttr` does not parse (dotted source attrs)»).
Il messaggio reale è `Expected '->'`, non quello citato nel prompt.

### 7.2 Il NEWLINE prima di `->` nel forall — H5 confermata, e chiude F5 del 2026-09-04

`forAllMapping()` (`parser.ts:497-508`):

```ts
const collection = this.expression();
…
if (this.match(TokenType.SUCH)) { … filter = this.expression(); }
this.consume(TokenType.ARROW, "Expected '->' for object creation in forall");
```

Nessun `skipNewlines()` fra la fine della collection (o del filtro) e il `consume(ARROW)`. È
**la stessa classe di difetto** corretta in `attributeMapping()` da `a4355b365`, in una posizione
diversa. Il referto del 2026-09-04 §F5 concludeva «`forAllMapping()` non ha il difetto, non
toccato» e lasciava la variante col newline come «nota a margine, non verificata». La nota è ora
verificata: **il difetto c'è**, in entrambe le varianti (con e senza `such that`).

### 7.3 Il value mapping dopo la conversione — root cause

Due lookahead richiedono che la chiave del value mapping sia un **letterale tipizzato**:

- `isValueMappingStart()` (`parser.ts:561-563`): `check(BOOLEAN) || check(NUMBER) || check(STRING)`
- `findValueMappingColon()` (`parser.ts:390-400`): `next1.type ∈ {BOOLEAN, NUMBER, STRING}` e `next2.type === EQUALS`

In `String=VARCHAR` la chiave `String` è un **IDENTIFIER**. Nessuno dei due lookahead scatta:
il `:` viene letto come conversione, `a.type` come espressione, e il parser si ritrova davanti a
un secondo `:` che non sa collocare → `Expected source attribute name` (`parser.ts:343`).
Il caso funziona solo con chiavi `true=1`, `false=0`, `1=…`, `"x"=…`: cioè **con i tipi Ecore e i
literal di enum, che sono identificatori, non funziona mai**.

Questo — non `name := a.name` — è il caso che produce il messaggio `Expected source attribute
name` riportato nel prompt.

---

## 8. Dipendenze e rischi

### R1 — Enumerare i contenuti cambia cosa vede **ogni** trasformazione esistente (rischio alto, richiesto dal prompt)

Una regola su una classe contenuta che oggi è silenziosamente vuota comincerà a produrre output.
Nel caso `ERDLanguage` è l'effetto voluto (7 Attribute → 7 Column). In un progetto esistente
significa: nuove istanze nel modello target, nuovi `DObject` in STEP 6, nuove righe in trace.
Nessun modo di distinguere «voluto» da «inatteso» dal codice.

Effetti collaterali oltre alle regole:
- `bindings.source` / `bindings.data` (`executor.ts:604-606`) sono **l'array intero**: una
  trasformazione che usi `data.size()` o iteri `source` legge un numero diverso.
- `generateUniqueModelName` e la deduplica di `usedObjectNames` (`ProjectEditor.tsx:1727`)
  vedono più nomi: più probabili le collisioni e i rinomini `_2`.
- costo: `_getallSub` scandisce `Selectors.getAll(DObject)` sull'**intero store** a ogni accesso,
  contro un `.map` su `data.objects`. Su modelli grandi non è gratis, e la chiamata è nel percorso
  sincrono di Execute.

Mitigazione praticabile in Fase 2: nessuna gratuita. Si può solo dichiararlo e, se serve, dare
all'utente la scelta — ma è una decisione di prodotto, non di implementazione.

### R2 — Il `forall` su una collection di reference itera su involucri `{__ref}`, non su oggetti (rischio alto, **non previsto dal prompt**)

`ProjectEditor.tsx:1399-1408` `wrapIfRef` trasforma ogni valore Pointer in `{ __ref: id }`.
Quindi `ownedAttributes` arriva all'executor come `[{__ref:'P1_A'}, {__ref:'P2_A'}]`.
`resolveValue` sa risolvere `{__ref}` **solo contro la trace** (sorgente → target), mai
all'indietro verso l'oggetto sorgente. Dentro `forall a in ownedAttributes`, `a` è quell'involucro
e `a.name` è `undefined`.

Misurato (`probe3`), stessa regola, due sorgenti:

| `ownedAttributes` | `Column[].name` |
|---|---|
| `[{__ref:'P1_A'}, {__ref:'P2_A'}]` (come oggi in app) | `null`, `null` |
| oggetti sorgente inline | `"ssn"`, `"age"` |

**Conseguenza per la Fase 2**: risolvere H1 e H2 non basta. Con le istanze contenute enumerate e
il nome-feature accettato, `forall a in ownedAttributes -> Column { name := a.name }` produrrebbe
il numero giusto di Column **tutte con i campi a null**. Serve, in aggiunta, che l'iterazione di
una collection di reference deriferisca l'elemento all'oggetto sorgente (ora possibile: con §4.1
quell'oggetto è nell'array). Tutti i test verdi di `forall-mapping.test.ts` usano collection di
oggetti inline e non coprono questo caso.

### R3 — Creare DObject contenuti non è `DObject.new` (domanda aperta, non risolta in Fase 1)

STEP 6 usa `DObject.new(targetClass.id, dModel.id, DModel, name, true)`, che crea una **radice**
(father = DModel). Per un figlio in uno slot di composizione la primitiva è
`LValue.addObject(json, metaclass)` (`LModelElement.tsx:7195`, `get_addObject` `:7211`). Non è
stato verificato in Fase 1 se `addObject` apra una TRANSACTION propria: se lo fa, chiamarla dentro
la TRANSACTION di STEP 6 ricade nel divieto di §3.3 (annidamento di creatori) e va spostata fuori,
come già si fa per `DVertex.new` (`ProjectEditor.tsx:1855`). **Da verificare prima di scrivere il
diff.**

Secondo effetto: STEP 8/8b risolvono per nome su `lModel.objects` — di nuovo **solo radici**. Le
Column contenute non sarebbero trovate, e i loro attributi non scritti. Anche STEP 8 va portato su
`allSubObjects`, o gli attributi vanno passati direttamente a `addObject(json)`.

### R4 — Il perimetro della Fase 2 supera i 5 file (regola 19 / RC-11)

Conteggio minimo per chiudere i due sintomi: `ProjectEditor.tsx`, `executor.ts`, `parser.ts`,
più almeno due file di test nuovi (`__tests__/` executor e parser), più `SPEC.md` e
`frontend/src/jjtl/CLAUDE.md` per i limiti noti. Sono 7. Da dichiarare ed elencare prima di
procedere; la deroga la sana il reviewer a valle.

### R5 — La entry di log del 2026-09-04 cita uno SHA inesistente

Cita `1c567930d`; su questo albero il commit è `a4355b365` («fix(jjtl): accept newlines inside
nested object creation», 2026-09-04 23:46:20 +0200), unico commit che tocca `parser.ts` e crea
`nested-object-creation.test.ts`, ed è antenato di HEAD. `git cat-file` su `1c567930d` dà
`unknown revision`. Il log è add-only e non si emenda (§21): registrato qui.

---

## 9. Domande aperte (per la chiusura della Fase 1)

1. **La semantica di `-> feature { … }`.** Le opzioni sono tre e non sono equivalenti:
   (a) `feature` è il nome della feature target e la classe sta dentro — è la SPEC §3.3;
   (b) si accetta anche `forall` dentro l'involucro, che oggi nessun documento del repo descrive;
   (c) `-> Class { … }` a livello di regola resta com'è, oppure diventa un errore esplicito.
   La (c) è la domanda già lasciata aperta dal referto 2026-09-04 §F4 e ancora senza risposta.
   Serve una decisione prima del diff: la scelta cambia il parser, non solo l'executor.
2. **Il `forall` a livello di regola e l'euristica di pluralizzazione.** Oggi è l'unica forma che
   funziona fino all'output dell'executor, ed è quella su cui poggiano 9 test. Se `-> feature { forall … }`
   diventa la forma canonica, l'euristica va sostituita da una risoluzione esplicita della feature,
   e i test esistenti vanno riletti alla luce di quella scelta (non necessariamente cambiati:
   `Column → columns` continuerebbe a valere per caso).
3. **R2**: si vuole che una collection di reference sia iterabile come collection di oggetti
   sorgente? È il vero abilitante del caso `ERDLanguage`, e non è nel prompt.
4. **R1**: enumerare i contenuti sempre, o solo quando una regola nomina una classe contenuta?
   La seconda opzione è più conservativa ma introduce un comportamento dipendente dal programma.
5. **R3**: verificare `LValue.addObject` rispetto a §3.3 prima di scrivere il write-back.
6. Il warning `Mapping skipped` va corretto in ogni caso (§5.2): oggi afferma il falso.

---

## 10. Comandi eseguiti

Nessun `npm run build`, `typecheck` o `test` sulla suite: la Fase 1 non tocca codice e non ha
baseline da spostare. Eseguiti solo `vitest run --config <config fuori albero>` sulle quattro
sonde, e `vitest run src/jjtl/__tests__/forall-mapping.test.ts` per confermare la condizione
`window is not defined` pre-esistente. `frontend/src` è pulito a fine giro: i due file temporanei
creati per bisezionare l'errore di import (`zz-probe-tmp.test.ts`, `zz-bisect.test.ts`) sono stati
rimossi, verificato con `git status`.

## 11. Hard stop

Fase 1 chiusa. Nessuna riga di codice modificata. Fase 2 solo dopo go-ahead, e dopo una risposta
alle domande 1 e 3 di §9: senza quelle, il diff sarebbe una scelta architetturale presa
dall'esecutore.
