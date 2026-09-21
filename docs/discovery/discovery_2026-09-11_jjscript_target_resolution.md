# Discovery — JjScript: la risoluzione del target dopo `in <Target>`

**Data**: 2026-09-11
**Fase**: 1 (READ-ONLY). Nessun sorgente toccato.
**Prompt**: `2026-09-11 10:15` — «fix target resolution for `in <Target>` (case-insensitive match picks wrong element kind)»
**Ramo di sessione**: `validation-skeleton` (vedi §0: il prompt ne dichiara un altro)

---

## 0. Preliminare — il ramo dichiarato non e' quello della sessione

Il prompt chiude con «Working branch: `alfonso-frontend-jjtl`». La sessione e' aperta su
`validation-skeleton`. Il ramo citato **esiste** (`git branch -a` lo elenca, locale e remoto).

Non e' un ostacolo alla Fase 1 perche' ogni file nel perimetro e' **byte-identico sui due rami**.
Misurato con `git diff --quiet <ramo> <ramo> -- <path>`, exit status letto:

```
IDENTICAL  frontend/src/jjscript/executor/resolvers.ts
IDENTICAL  frontend/src/jjscript/executor/commands/create.ts
IDENTICAL  frontend/src/jjscript/parser/parser.ts
IDENTICAL  frontend/src/jjscript/recovery/rules.ts
IDENTICAL  frontend/src/jjscript/executor/utils.ts
```

Controllo positivo sullo stesso comando, su un file che i due rami **sanno** di avere diverso:
`DIFFERS frontend/src/jjscript/executor/commands/eval.ts`. Il silenzio delle cinque righe sopra
e' quindi una misura, non un comando che non ha girato (CLAUDE.md §5, «un'asserzione di assenza
richiede la prova che la ricerca sia girata»).

**Domanda per Alfonso**: la Fase 2 si esegue su `validation-skeleton` (dove siamo, e dove due file
di `validation/ValidationRulesModal.*` sono sporchi da un'altra corsia — RC-13) o si cambia ramo
prima di partire? Il diff sarebbe identico nei due casi; cambia solo dove atterra il commit.

---

## 1. Obiettivo

Capire perche' `create literal HAPPY in Mood` fallisce con

```
Cannot create literal in attribute 'mood'. Literals can only be added to enums
```

quando lo script ha creato, prima, `create attribute mood in Scene type String` e, dopo,
`create enum Mood`.

Confermare o smentire l'ipotesi del prompt: il resolver del target dopo `in` cerca
case-insensitive su tutti i tipi di elemento e restituisce il primo che trova.

---

## 2. File letti (percorsi completi)

Letti **per intero**:

- `frontend/src/jjscript/executor/resolvers.ts` (564 righe) — il resolver
- `frontend/src/jjscript/executor/commands/create.ts` (781 righe) — il chiamante che fallisce
- `frontend/src/jjscript/executor/utils.ts` (306 righe) — `getTargetMetamodel`, `getDefaultParent`, `needsParent`
- `frontend/src/jjscript/executor/commands/add.ts` (42 righe) — delega a `create`
- `frontend/src/jjscript/recovery/rules.ts` (140 righe) — la regola di recovery che dipende dal messaggio d'errore

Letti in finestre dichiarate:

- `frontend/src/jjscript/parser/parser.ts` — righe 279-292, 460-560, 585-630, 715-745 (i punti dove si consuma `in`)
- `frontend/src/jjscript/types.ts` — righe 110-300 (le forme degli argomenti di comando)
- `frontend/src/joiner/classes.ts` — righe 3479-3520 (`LProject.get_classes/attributes/enumerators/...`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` — righe 5700-5760, 5820-5892 (`LModel.get_classes/enumerators/attributes`, `_impl_getByName`)
- `frontend/src/model/logicWrapper/nameUniqueness.ts` — righe 344-400, 495-545 (tassonomia dei kind, confronto dei nomi)
- `frontend/src/jjtl/executor/jjodelConverter.ts` — righe 380-438 (l'omonimo locale `findClassInMetamodel`)
- `frontend/src/jjel/evaluator/evaluator.ts` — righe 595-640 (`findSimilarProperty`)
- `frontend/src/jjscript/__tests__/commands.test.ts`, `frontend/vitest.config.ts` — banco di prova

Scansionati per chiamate al resolver (non letti per intero): i restanti 11 comandi sotto
`frontend/src/jjscript/executor/commands/`.

---

## 3. Referto — l'ipotesi e' confermata, e c'e' una causa prossima piu' specifica

`create literal HAPPY in Mood` arriva a `executeCreate` con `parent = {segments:['Mood']}` e
`elementType = 'literal'`. Il parent viene risolto **prima** dello switch sul tipo
(`create.ts:185-199`), e il tipo non entra nella risoluzione:

```typescript
// create.ts:185-196
if (parent) {
    if (targetMetamodel) {
        parentElement = resolveElementInMetamodel(parent, targetMetamodel);
        if (!parentElement) {
            console.warn(`[JjScript] Parent '...' not found in target metamodel, trying project-wide search`);
            parentElement = resolveElement(parent, project);
        }
    } else {
        parentElement = resolveElement(parent, project);
    }
}
```

`resolveElementInMetamodel` prova per prima la «Strategy 1», `resolveByPathInMetamodel`. Ecco il
cuore del difetto, verbatim (`resolvers.ts:115-156`):

```typescript
function resolveByPathInMetamodel(segments: string[], metamodel: LModel): any {
    if (segments.length === 0) return null;

    let current: any = metamodel;

    for (let i = 0; i < segments.length; i++) {
        const segmentName = segments[i].toLowerCase();          // (1) case-insensitive
        let found = false;

        // Try to find in metamodel collections (no cross-metamodel search)
        const collections = [
            'packages', 'subPackages', 'classifiers', 'classes',
            'attributes', 'references', 'operations', 'parameters',   // (2) attributes 5°
            'literals', 'enumerators'                                 //     enumerators ULTIMO
        ];

        for (const collName of collections) {
            const collection = current[collName];
            if (Array.isArray(collection)) {
                const match = collection.find((item: any) =>
                    item?.name?.toLowerCase() === segmentName          // (3) primo che capita
                );
                if (match) {
                    current = match;
                    found = true;
                    break;
                }
            }
        }
        ...
```

Tre difetti indipendenti, nello stesso punto:

1. **Il confronto e' `toLowerCase()` su entrambi i lati.** Non c'e' nessun tentativo esatto prima.
2. **L'ordine delle collezioni decide il vincitore.** `'attributes'` e' quinto, `'enumerators'`
   ultimo. Non c'e' nessun filtro per il tipo che il comando ammette.
3. **Vince il primo, e la pluralita' non e' mai un errore.** `resolveByNameInMetamodel`
   (`:161-194`) accumula in `results[]` e poi ritorna `results[0]`, con il commento
   «Return first match within this metamodel»; il gemello project-wide `resolveByName`
   (`:322-355`) dice a chiare lettere «Return first match (could be improved to handle ambiguity)».

**Perche' `metamodel.attributes` contiene `Scene.mood`.** `LModel.attributes` non e' una
collezione locale: e' la lista **piatta** di tutti gli attributi di tutte le classi del
metamodello (`LModelElement.tsx:5833-5836`,
`return context.proxyObject.classes.flatMap(c => c.attributes)`). Stesso schema a livello di
progetto (`joiner/classes.ts:3488-3490`). Quindi il nome `mood` di `Scene` e' visibile dalla
radice del metamodello, esattamente come il nome `Mood` dell'enum — e arriva cinque collezioni
prima.

### 3.1 Misura, non lettura del comparatore

CLAUDE.md §5 vieta di validare una risoluzione leggendo il codice. Il resolver e' stato
**eseguito** su un metamodello sintetico che riproduce la forma dello script, sotto lo stesso
runner del repo (vitest 4.1.4, `environment: 'node'`). Sorgente della sonda in §9, riproducibile
verbatim.

| sonda | input | risultato misurato |
|---|---|---|
| P1-a | `resolveElementInMetamodel({segments:['Mood']}, mm)` | ritorna **l'attributo** `Scene.mood` (`attr-scene-mood`, `DAttribute`) |
| P1-b (controllo positivo) | stesso, ma con `attributes: []` | ritorna **l'enum** `Mood` (`enum-mood`) |
| P1-c | `{segments:['MOOD']}` | ritorna **l'attributo** — il confronto e' davvero case-insensitive |
| P2-a | `resolveElement({segments:['Mood']}, project)` | ritorna **l'attributo**: il resolver project-wide ha lo stesso difetto |
| P2-b | due enum `colour` e `Colour`, si chiede `Colour` | ritorna **`colour`** — la corrispondenza esatta di caso **perde** contro la prima in ordine |
| P2-c (controllo) | stesse due, si chiede `colour` | ritorna `colour` — l'ordine e' l'unica cosa che conta |

P1-b e' il controllo che rende P1-a una misura: la ricerca **arriva** a `enumerators`, quindi il
fatto che non lo restituisca e' una scelta del codice, non una collezione mai visitata.

P2-b e' il caso che il punto 2 del prompt chiede di sanare, misurato: oggi la corrispondenza
esatta non ha nessuna precedenza.

---

## 4. La tabella dei comandi con `in <Target>` e i kind ammissibili

Il parser consuma `in` in quattro forme diverse. Vanno distinte, perche' due di esse **non**
passano un `parent` separato: ripiegano il target in un nome qualificato `Parent.membro`.

### 4.1 Forma A — `parent` esplicito (`create`, `add`)

`parser.ts:279-292`. `CreateArgs.parent?: QualifiedName` (`types.ts:132`). Il kind e' gia' noto al
sito di risoluzione (`create.ts:185`), quindi qui il fix e' diretto.

| comando | guardia di kind che oggi fallisce a valle | kind ammissibili per il target |
|---|---|---|
| `create attribute N in X type T` | `isClass`, `create.ts:389` | **classe** (`DClass`) |
| `create reference N in X ...` | `isClass`, `create.ts:453` | **classe** |
| `create containment N in X ...` | `isClass`, `create.ts:453` | **classe** |
| `create composition N in X ...` | `isClass`, `create.ts:453` | **classe** |
| `create operation N in X` | `isClass`, `create.ts:562` | **classe** |
| `create parameter N in X.op` | `isOperation`, `create.ts:618` | **operazione** (`DOperation`) |
| `create literal N in X` | `isEnum`, `create.ts:742` | **enum** (`DEnumerator`) |
| `create class N in X` | nessuna | **package** o **modello** |
| `create abstract class N in X` | nessuna | **package** o **modello** |
| `create interface N in X` | nessuna | **package** o **modello** |
| `create enum N in X` | nessuna | **package** o **modello** |
| `create enumeration N in X` | nessuna | **package** o **modello** |
| `create package N in X` | nessuna | **package** o **modello** |
| `add <tipo> N to\|in X` | delega a `executeCreate` (`add.ts:34`) | come la riga di `create` corrispondente |

Nota sulle cinque righe «nessuna guardia»: oggi il parent arriva a `DClass.new(..., parentId, ...)`
senza nessun controllo (`create.ts:298-311`). Se `create class Foo in mood` risolvesse
sull'attributo, si creerebbe una classe figlia di un attributo, **in silenzio**. Non e' il bug
riportato, ma e' lo stesso difetto un passo piu' in la'.

### 4.2 Forma B — `in` ripiegato in `Parent.membro` (`delete`, `rename`)

`parser.ts:474-484` e `:525-536`. Entrambi producono
`target = { segments: parent.segments, member: elementName }`, poi `resolveElement(target, project)`
risolve i `segments` e chiama `resolveMember` (`resolvers.ts:419-445`, anch'esso case-insensitive).

| comando | kind ammissibili per il target dopo `in` |
|---|---|
| `delete attribute N in X` / `rename attribute N in X to M` | **classe** |
| `delete reference N in X` / `rename reference N in X to M` | **classe** |
| `delete operation N in X` / `rename operation N in X to M` | **classe** |
| `delete parameter N in X` / `rename parameter N in X to M` | **operazione** |
| `delete literal N in X` / `rename literal N in X to M` | **enum** |
| `delete class\|interface\|enum\|package N in X` / `rename ...` | **package** o **modello** |
| senza token di tipo (`delete N in X`) | qualunque contenitore — il tipo non e' dichiarato |

`delete.ts:71-80` ha gia' un `matchesElementType` che controlla il kind **dell'elemento trovato**,
non del suo contenitore: e' il controllo giusto sull'oggetto sbagliato per questo bug.

### 4.3 Forma C — `in` come filtro di scope (`list`)

`parser.ts:736-739`, `ListArgs.filter.in` (`types.ts:238`), risolto in `list.ts:43`.
Kind ammissibili: **package**, **classe**, **enum**, **modello** — qualunque cosa possa contenere
altro. Non c'e' un kind unico: e' il solo sito dove la restrizione e' «un contenitore qualsiasi».

### 4.4 Forma D — `in` che non e' un target (nessun intervento)

`parser.ts:890` (`let ... in <comando>`), `:1099` (`forall x in <collezione>`), `:948` (la
disambiguazione fra i due). Questi `in` non sono nomi di elementi e non toccano il resolver.

### 4.5 Altri siti che risolvono un nome e vogliono un kind (senza `in`)

Non sono «comandi `in <Target>`», ma condividono il resolver e lo stesso difetto. Il prompt dice
«apply the same principle to every other `in <Target>` command»; questi stanno appena fuori da
quel perimetro e vanno decisi esplicitamente.

| sito | cosa risolve | kind atteso |
|---|---|---|
| `create.ts:318/322` | `options.superClass` di `create class X extends Y` | **classe** |
| `create.ts:337/340` | `options.superClasses[i]` | **classe** |
| `create.ts:483/488` | il target di `create reference N in X type T` | **classe** (o enum, §6.2) |
| `extends.ts:46/49`, `:80/83` | i due lati di `extends Child Parent` | **classe** |
| `abstract.ts:46/49` | il target di `abstract X` (guardia `className.includes('Class')`, `:66`) | **classe** |
| `move.ts:44`, `:57` | elemento e destinazione | elemento: qualsiasi; destinazione: contenitore |
| `copy.ts:53`, `:66` | idem | idem |
| `remove.ts:49`, `:62`, `:143` | target, contenitore, classe | contenitore; classe |
| `set.ts:52`, `:272` | l'elemento e un valore che e' un riferimento | qualsiasi elemento nominato |
| `show.ts:48`, `validate.ts:47` | il target | qualsiasi |
| `elementWaiter.ts:128/132` | la dipendenza attesa (`dep.name`) | dipende dal tipo di dipendenza |

---

## 5. Altri consumatori del resolver

Ricerca su tutto `frontend/src`, con `command grep` (non il wrapper `ugrep`: vedi CLAUDE.md §5).

**Dentro JjScript** — 14 file importano `resolveElement` e/o `resolveElementInMetamodel`:
`abstract.ts`, `add.ts`, `copy.ts`, `create.ts`, `delete.ts`, `extends.ts`, `list.ts`, `move.ts`,
`remove.ts`, `rename.ts`, `set.ts`, `show.ts`, `validate.ts`, `elementWaiter.ts`.
Piu' `__tests__/elementWaiter.test.ts`, che li **mocka** entrambi (`vi.mock('../resolvers')`,
righe 34-35): un cambio di firma non lo rompe, ma un cambio di semantica non verrebbe visto da li'.

**Fuori da JjScript**: **nessuno importa il resolver direttamente.** Il barrel
`frontend/src/jjscript/index.ts` riesporta `resolveElement`, `resolveParent`, `findElements`,
`getElementPath`, `isAncestor` (righe 57-61), ma nessun consumatore esterno li nomina. Controllo
positivo della stessa ricerca: lo stesso comando trova 18 import esterni verso altri simboli di
`jjscript/` (`JjScriptService`, `buildEvalContext`, `getActiveMetamodel`, `parse`, …), quindi la
ricerca ha segnale e il silenzio sui resolver e' un negativo vero.

**Jjodie e' un consumatore indiretto, e va nominato.**
`frontend/src/jjodie-integration/JjodieAPIImpl.ts:8` importa `executeCommand` dall'executor:
ogni script che Jjodie genera passa dagli stessi resolver. Cambia il comportamento, non il codice
di Jjodie. Stesso discorso per `components/Jodie/ChatMessages.tsx` e
`components/common/MarkdownRenderer.tsx`, che eseguono `ScriptBlock` via `JjScriptService`.
**Non serve toccare nessuno di questi file** — il vincolo di scope del prompt («se il fix richiede
di toccare i percorsi di Jjodie, fermati») non scatta.

**Omonimo, non consumatore.** `jjtl/executor/jjodelConverter.ts:388` chiama un
`findClassInMetamodel` **locale**, definito a `:420` nello stesso file, che confronta
`c.name === className` — case-**sensitive**. Non e' l'export di `resolvers.ts:63` (che invece e'
case-insensitive e non ha **nessun** chiamante: `findClassInMetamodel` di `resolvers.ts` e' codice
morto, misurato — l'unica occorrenza fuori dal file di definizione e' l'omonimo di JjTL).
Regola 9: non rimuoverlo, semmai marcarlo.

---

## 6. Come si confrontano i nomi altrove nella piattaforma

Riferito, non modificato. La conclusione e' che **JjScript e' l'anomalia**.

### 6.1 `nameUniqueness.ts` — il motore di unicita' M2 e' case-sensitive, e il caso-solo e' un avviso

`frontend/src/model/logicWrapper/nameUniqueness.ts:513`:

```typescript
const collidingWith = namespace.filter(e => (e as { name?: string }).name === name);
```

Confronto esatto. E subito dopo (`:527-539`) la differenza di solo caso e' trattata come
**accettata con avviso**, non come collisione:

```typescript
const lowered = typeof name === 'string' ? name.toLowerCase() : '';
const nearby = namespace.find(e => {
    const n = (e as { name?: string }).name;
    return typeof n === 'string' && n !== name && n.toLowerCase() === lowered;
});
if (!nearby) return { ok: true };
return { ok: true, warning: `Name "${name}" differs only by case from "${...}" in the same scope` };
```

**Conseguenza diretta per il punto 3 della Fase 2 del prompt**: due enum che differiscono solo per
il caso **possono coesistere** — l'unicita' non li rifiuta, li segnala. Il test di ambiguita' che
il prompt chiede e' quindi costruibile, e non va saltato.

Lo stesso file fornisce la tassonomia canonica dei kind M2 (`:347-360`), che e' il vocabolario
giusto se si vuole restare consistenti invece di inventarne uno nuovo:

```typescript
export type M2NamespaceKind = 'classifier' | 'datatype' | 'feature' | 'package' | 'literal' | 'parameter';
const M2_KIND_BY_CLASSNAME: { [className: string]: M2NamespaceKind } = {
    DClass: 'classifier', DEnumerator: 'classifier', DDataType: 'datatype',
    DAttribute: 'feature', DReference: 'feature', DOperation: 'feature',
    DPackage: 'package', DEnumLiteral: 'literal', DParameter: 'parameter',
};
```

Attenzione: e' una tassonomia di **namespace**, non di metaclasse — `DClass` e `DEnumerator`
condividono `'classifier'`. Serve a dire «chi collide con chi», **non** a dire «una classe non e'
un enum», che e' esattamente la distinzione che serve qui. Utile come riferimento, non riusabile
tale e quale.

### 6.2 `_impl_getByName` — il precedente esatto della disciplina che il prompt chiede

`frontend/src/model/logicWrapper/LModelElement.tsx:5869-5890`, usato da `LModel.getClassByName` e
`LModel.getEnumByName`:

```typescript
_impl_getByName(collection, name, caseSensitive: boolean = false) {
    name = name.trim();
    const key: string = '$' + name;
    if (collection[key]) return collection[key];        // (1) esatto prima
    if (caseSensitive) return null;
    let initialKeys: string[] = Object.keys(collection);
    for (let k of initialKeys) { collection[(k + '').toLowerCase()] = collection[k]; }
    return collection[key.toLowerCase()] || null;       // (2) case-insensitive come ripiego
}
```

E' **gia'** «esatto prima, case-insensitive come fallback», e **gia'** separato per kind
(`get_getClassByName` passa `get_classes`, `get_getEnumByName` passa `get_enumerators`,
`:5863-5868`). Il fix richiesto dal prompt porta i resolver di JjScript sulla stessa disciplina
che il L-layer applica da mesi. Questo e' il precedente da citare nel commit.

### 6.3 JjEL / JjTL

- JjEL: nessuna risoluzione di nomi di elemento case-insensitive. L'unico `toLowerCase()` vicino
  ai nomi e' `findSimilarProperty` (`jjel/evaluator/evaluator.ts:610-632`), che e' un
  **suggeritore di refusi** per i messaggi d'errore, non un resolver — e comunque tratta la
  corrispondenza di solo caso come un caso a parte, prima della distanza di Levenshtein.
- JjTL: `jjodelConverter.ts:425` confronta `c.name === className`, esatto.

Nessuno dei due va toccato.

---

## 7. Rischi

1. **La regola di recovery dipende dalla stringa d'errore.**
   `frontend/src/jjscript/recovery/rules.ts:94` fa
   `ctx.errorMessage.includes('Literals can only be added to enums')`, e `:97-101` accende la
   regola **solo se** esiste un attributo con quel nome e **non** esiste un enum con quel nome
   esatto. Il fix rende quella regola in gran parte irraggiungibile per il caso buono (l'enum
   c'e': il resolver ora lo trova, nessun errore) e la lascia viva per il caso legittimo
   (l'enum non c'e' davvero). **Il messaggio va preservato nel testo che quella regola cerca**,
   altrimenti la regola muore in silenzio. Il punto 3 del prompt («keep the wording of existing
   messages where they are still accurate») e questa dipendenza dicono la stessa cosa.
   Il test `recovery` non esiste: nessun file sotto `__tests__/` nomina la recovery.

2. **Il fallback project-wide mangia il fix.** In `create.ts:188-193`, se la ricerca scoped
   ritorna `null` si ricade su `resolveElement(parent, project)`. Se il fix restringe i kind nella
   scoped ma non nella project-wide, il caso «enum inesistente» ricadrebbe **di nuovo**
   sull'attributo. Le due strade vanno restrette insieme, o il fallback va reso consapevole del
   kind.

3. **`resolveByPath` a piu' segmenti.** Per `A::B::C` il filtro di kind vale solo sull'**ultimo**
   segmento: i segmenti intermedi devono restare contenitori qualsiasi. Un filtro applicato a
   tutto il ciclo romperebbe i nomi qualificati. `resolvers.ts:120-153` e' un unico `for` su tutti
   i segmenti: il fix deve distinguere l'ultima iterazione.

4. **`resolveMember` e' il secondo gradino, e non e' stato toccato dall'analisi come difetto.**
   `resolvers.ts:419-445` cerca il membro case-insensitive su
   `['attributes','references','operations','parameters','literals']` e poi ripiega su
   `memberName in element` — che su un proxy L puo' colpire **qualunque** proprieta' del proxy, non
   solo un elemento del modello. Per la forma B (§4.2) questo e' il punto dove `delete literal X in Mood`
   finirebbe. Fuori dal COSA del prompt; segnalato.

5. **`elementWaiter.test.ts` mocka i resolver.** Un cambio di firma non lo fa arrossare, quindi non
   e' una rete. Se la firma cambia, va aggiornato comunque perche' il mock diventi rappresentativo.

6. **Nessun file del perimetro e' in critical zone** (CLAUDE.md §3.1: `useJjomSync.ts`,
   `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`,
   `VersionFixer.tsx`, `defaultViewTemplate.ts`, `DV.tsx`, `viewpoint/authoring/`,
   `viewpoint/ir/`, `problems/`). Nessun Layer Impact Report dovuto. Il fix e' in sola lettura sul
   D-layer: i resolver leggono i proxy L, non scrivono.

---

## 8. Due cose che il prompt da' per scontate e che la misura smentisce

Entrambe toccano il **criterio di accettazione della Fase 2**, quindi vanno sciolte prima.

### 8.1 Il test end-to-end sull'executor NON gira nel banco attuale

Il punto 3 della Fase 2 chiede «a test that executes the reproduction script through the JjScript
executor». Misurato: **non si puo', oggi.**

`frontend/vitest.config.ts` fissa `environment: 'node'`. Importare
`src/jjscript/executor/commands/create.ts` sotto quel runner fallisce:

```
ReferenceError: window is not defined
    at frontend/node_modules/monaco-editor/esm/vs/base/browser/window.js:14:27
```

Controllo positivo nella stessa sonda: `import('.../executor/resolvers')` riesce, errore `NONE`.
Quindi il fallimento e' del modulo, non del banco. Coerente con la baseline gia' registrata:
`npx vitest run src/jjscript/__tests__/` da **8 file passati, 1 fallito** — e il file fallito e'
`context-binding.test.ts`, con la **stessa** `ReferenceError` da monaco.

Tre strade, in ordine di costo crescente:

- **(a)** Test a livello di resolver, sul metamodello sintetico di §9. Copre i tre punti del fix
  (kind, esatto-prima, ambiguita') e gira oggi. **Raccomandata.**
- **(b)** Test sull'executor con `vi.mock` del barrel `joiner` — replica il pattern gia' in uso in
  `elementWaiter.test.ts`. Copre la catena `executeCreate` → resolver → guardia, ma la superficie
  mockata e' larga e fragile.
- **(c)** Spostare il file di test a `environment: 'jsdom'` con la direttiva `// @vitest-environment jsdom`.
  Tira dentro monaco e l'intero `joiner`: fuori scope, e tocca il banco condiviso.

**Domanda per Alfonso**: (a), (b) o (c)?

### 8.2 `create attribute animalMood in Animal type Mood` non produce un attributo tipato enum — e non e' questo bug

L'ultima riga dello script di riproduzione, e il criterio «attribute `Animal.animalMood` typed with
the enum», dipendono da un percorso **diverso** da quello del target dopo `in`.

`createAttribute` (`create.ts:407-414`) non risolve affatto il tipo: lo normalizza su una tabella
di primitivi.

```typescript
// create.ts:41-69
export function normalizeAttributeType(raw: string): string {
    const map: Record<string, string> = { 'estring': 'EString', 'string': 'EString', ... 'void': 'EVoid' };
    return map[raw.toLowerCase()] ?? 'EString';        // <- 'Mood' non e' nella mappa
}
// create.ts:412
const typePointer = (Defaults as any)['Pointer_' + shortType.toUpperCase()] ?? Defaults.Pointer_ESTRING;
```

`normalizeAttributeType('Mood')` ritorna **`'EString'`**, per il `?? 'EString'` di riga 69. Quindi
`animalMood` nasce `EString`, **in silenzio**, con `success: true` e il messaggio
`Created attribute 'animalMood'`. Nessun errore, nessun avviso.

Il confronto che lo rende evidente: `createReference` **risolve** il tipo
(`create.ts:479-495`, `resolveElementInMetamodel` / `resolveElement` + `SetFieldAction`), mentre
`createAttribute` no. Le due strade divergono per costruzione.

Questo e' un **secondo difetto, indipendente**, e sta fuori dal COSA del prompt (che parla del
target dopo `in`). Non lo si puo' sanare «di passaggio» senza sforare lo scope (regola 1):
richiederebbe a `createAttribute` di risolvere un enum e scrivere `type` con `SetFieldAction`, cioe'
un percorso di scrittura nuovo.

**Domanda per Alfonso**: lo si porta dentro questo giro allargando esplicitamente il perimetro, o
si apre una corsia separata e il test della Fase 2 asserisce solo che `animalMood` **esiste**
(senza pretendere il tipo enum)? Come sta scritto ora, il criterio di accettazione del prompt
**non e' raggiungibile** col solo fix del resolver.

---

## 9. La sonda, verbatim

Eseguita fuori dal repo (scratchpad di sessione), con `node_modules` del frontend collegato in
symlink e una config vitest che include solo la cartella della sonda. Nessun file del repo creato o
modificato. `npx vitest run` → **5 test passati su 5**, output `stdout` riportato in §3.1.

```typescript
// probe.resolvers.test.ts
import { describe, it, expect } from 'vitest';
import { resolveElement, resolveElementInMetamodel }
    from '/Users/alfonso/jjodel/frontend/src/jjscript/executor/resolvers';

// LModel.attributes e' la lista PIATTA di ogni attributo di ogni classe
// (joiner/classes.ts:3488, model/logicWrapper/LModelElement.tsx:5833).
const sceneMood = { name: 'mood',  className: 'DAttribute',  id: 'attr-scene-mood' };
const moodEnum  = { name: 'Mood',  className: 'DEnumerator', id: 'enum-mood', literals: [] };
const scene     = { name: 'Scene', className: 'DClass',      id: 'cls-scene', attributes: [sceneMood] };
const mm: any = {
    name: 'MM', id: 'mm-1', packages: [], classes: [scene], attributes: [sceneMood],
    references: [], operations: [], parameters: [], literals: [], enumerators: [moodEnum],
};
const project: any = { name: 'P', metamodels: [mm], models: [] };

it('P1-a  Mood -> attributo', () =>
    expect(resolveElementInMetamodel({segments:['Mood'], raw:'Mood'} as any, mm)?.id)
        .toBe('attr-scene-mood'));

it('P1-b  CONTROLLO POSITIVO: senza l\'attributo, Mood -> enum', () => {
    const clean: any = {...mm, attributes: [], classes: [{name:'Scene', className:'DClass', id:'c', attributes:[]}]};
    expect(resolveElementInMetamodel({segments:['Mood'], raw:'Mood'} as any, clean)?.id).toBe('enum-mood');
});

it('P1-c  MOOD -> attributo (il confronto e\' case-insensitive)', () =>
    expect(resolveElementInMetamodel({segments:['MOOD'], raw:'MOOD'} as any, mm)?.id)
        .toBe('attr-scene-mood'));

it('P2-a  il resolver project-wide ha lo stesso difetto', () =>
    expect(resolveElement({segments:['Mood'], raw:'Mood'} as any, project)?.id)
        .toBe('attr-scene-mood'));

it('P2-b  la corrispondenza esatta di caso PERDE contro la prima in ordine', () => {
    const e1 = { name: 'colour', className: 'DEnumerator', id: 'enum-lower', literals: [] };
    const e2 = { name: 'Colour', className: 'DEnumerator', id: 'enum-upper', literals: [] };
    const mm2: any = {...mm, attributes: [], classes: [], enumerators: [e1, e2]};
    expect(resolveElementInMetamodel({segments:['Colour'], raw:'Colour'} as any, mm2)?.id)
        .toBe('enum-lower');   // 'Colour' esiste esatto, e perde
});
```

---

## 10. Domande aperte per Alfonso

1. **Ramo** (§0). Fase 2 su `validation-skeleton` o si passa a `alfonso-frontend-jjtl`?
2. **Banco di prova** (§8.1). Test a livello di resolver (a), executor con `joiner` mockato (b), o
   `jsdom` sul file di test (c)? Il test end-to-end come scritto nel prompt non gira.
3. **Il tipo enum degli attributi** (§8.2). Dentro questo giro con perimetro allargato, o corsia
   separata e criterio di accettazione ridotto?
4. **Perimetro dei kind**. Solo le quattro forme `in <Target>` di §4.1-4.3, o anche i siti di §4.5
   (`extends`, `superClass`, il tipo di `reference`, `move`/`copy`/`remove`) che hanno lo stesso
   difetto ma non la parola `in`?
5. **Forma della restrizione.** Un parametro `kinds?: string[]` opzionale su
   `resolveElementInMetamodel` / `resolveElement` (retro-compatibile: assente = comportamento di
   oggi, quindi zero rischio per i 14 chiamanti che non lo passano), oppure due funzioni nuove
   accanto alle esistenti? La prima e' meno codice e non tocca nessun chiamante che non si voglia
   cambiare; la seconda lascia i vecchi percorsi letteralmente intatti. Raccomando la prima.
6. **Restrizione anche sulle cinque righe senza guardia** di §4.1 (`create class ... in X` &c.,
   che oggi accetterebbero un attributo come padre in silenzio)? E' dentro il principio enunciato
   dal punto 1 del prompt, ma nessuna di esse fallisce oggi in modo visibile.

---

**HARD STOP.** Fase 1 chiusa. Nessuna modifica ai sorgenti. La Fase 2 non parte senza il via
esplicito in chat, e senza le risposte a §10.1, §10.2 e §10.3, che cambiano cosa si scrive.

---

## 11. Addendum — le risposte e cosa e' stato costruito (Fase 2, stesso giorno)

Le sei domande di §10 hanno avuto risposta in chat. Perimetro finale, piu' stretto di quello che
il prompt descriveva:

| § | domanda | risposta |
|---|---|---|
| 10.1 | ramo | si committa su `validation-skeleton`, dove siamo. Il commit va **cherry-picked** su `alfonso-frontend-jjtl`. Niente `git stash`, i due `ValidationRulesModal.*` restano dell'altra corsia |
| 10.2 | banco | opzione **(a)**: test a livello di resolver, niente jsdom, niente mock di `joiner`. Il test end-to-end dello script **esce** dal punto 3 della Fase 2; la verifica end-to-end e' manuale su localhost |
| 10.3 | tipo enum degli attributi | **fuori scope**. `normalizeAttributeType` e `createAttribute` non si toccano. Cade il criterio «`Animal.animalMood` tipato con l'enum»; resta «`Scene.mood` ancora String». Prompt separato |
| 10.4 | perimetro dei kind | la tabella di §4. I siti di **§4.5 restano aperti** |
| 10.5 | forma | un solo resolver kind-aware, applicato sia a `resolveByPathInMetamodel` sia a `resolveElement` |
| 10.6 | righe senza guardia | dentro la tabella, ma con ripiego (vedi sotto) |

**Cosa e' stato scritto.** `selectTarget` in `resolvers.ts` e' l'unica regola, e serve entrambe le
strade: match esatto di caso fra i kind ammissibili; altrimenti ripiego case-insensitive, valido
solo se unico; piu' di un candidato ammissibile e' un'ambiguita' con le grafie in chiaro; nient'altro
e' un miss. Il membro di `Parent.member` viene applicato **prima** del test di kind, cosi' un
candidato il cui membro non risolve esce e si prova il successivo: e' cio' che fa scavalcare
l'attributo `mood` a `delete literal HAPPY in Mood`, senza un percorso separato per quella forma.

**Due precisazioni che la misura ha imposto, e che §3 non anticipava.**

1. La precedenza al caso esatto vale per **tutti** i chiamanti, anche quelli che non passano
   `kinds`: e' la meta' del fix che non richiede adesione. Misurato: `resolveElementInMetamodel(qn('Mood'), mm)`
   **senza restrizione** ora ritorna l'enum, non piu' l'attributo. Tre asserzioni scritte in prima
   battuta come «controllo: il non ristretto si comporta come prima» erano sbagliate e sono state
   corrette su cio' che il codice fa davvero. L'**ambiguita'**, invece, e' riservata ai chiamanti
   ristretti: i 9 non ristretti conservano il primo-che-capita.
2. Le righe di §4.1 senza guardia a valle (`class`, `enum`, `package`: prendono qualunque `father`
   ricevano) hanno la restrizione **piu' un ripiego** al lookup non ristretto. Senza, un parent che
   oggi risolve avrebbe smesso di risolvere e l'elemento sarebbe nato orfano, perche' `needsParent`
   e' falso per loro e nessun errore sarebbe scattato.

**Resta aperto, dichiarato.** I siti di §4.5 — `extends.ts`, `abstract.ts`, `move`/`copy`/`remove`,
`options.superClass` e il tipo di `reference` in `create.ts` — hanno lo stesso difetto ma non la
parola `in`, e non sono stati toccati. `resolveMember` (rischio §7.4) e il `findClassInMetamodel`
morto di `resolvers.ts:63` restano come sono (regola 9).

**Verifica.** `npx tsc --noEmit` 33 su output completo, la baseline, zero nei file toccati;
`npm run build` exit 0; `npx vitest run` 3496 passati 0 falliti (+25); banco delle mutazioni sul
resolver 5 su 5 discriminanti, sorgente ripristinato byte per byte. La verifica end-to-end dello
script di riproduzione e' **da fare a mano**, per la decisione 10.2.
