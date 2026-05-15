# Discovery — L2.x.1 polish v2: predicate-based classifier extraction

**Date**: 2026-05-08 (sessione)
**Branch**: `alfonso-frontend-jjtl`
**Phase**: A (read-only). Hard stop dopo questo documento; in attesa di OK prima di Fase B.

**Scope**: estendere la heuristic del banner edge-candidate per derivare il classifier in-context anche dal predicato OCL/JS della view, non solo da `appliableToClasses`. Caso d'uso target: view auto-create per metaclasse DD (predicato `context DObject inv: self.instanceof.id = '<DD-pointer>'`), `appliableToClasses` vuoto, banner deve apparire comunque.

---

## A.1 — Schema dei campi del predicato sul `DViewElement`

Due campi distinti, entrambi definiti su DViewElement e LViewElement:

| Field         | Path D-layer (decl.)                | Path L-layer (getter / setter)            | Tipo TS    | Default |
|---------------|-------------------------------------|-------------------------------------------|------------|---------|
| `oclCondition` | `view/viewElement/view.tsx:218`    | view.tsx:993 / get_oclCondition:996 / set_oclCondition:999 | `string`  | `''` (Constructors classes.ts:1099) |
| `jsCondition`  | `view/viewElement/view.tsx:219`    | view.tsx:1009 / get_jsCondition:1012 / set_jsCondition:1015 | `string` | `''` (Constructors classes.ts:1100) |

Entrambi possono essere popolati contemporaneamente, **non sono mutuamente esclusivi**. Il sistema di view-application (`redux/selectors/selectors.ts:583, 720-746`) li valuta indipendentemente: `OCLScore` e `jsScore` vengono combinati per il `finalScore` (selectors.ts:420-428). Stringhe vuote → "match by default" (lazyOCL skippa eval; jsCondition empty → `tnv.jsScore = true`, selectors.ts:746).

Editor UI:
- `OclEditor` (`components/editors/languages/Ocl.tsx`) scrive su `view.oclCondition` via `view.oclCondition = ocl` (riga 24).
- `JsEditor` (`components/editors/views/data/InfoData.tsx:338-340`) scrive su `view.jsCondition` tramite l'`<Input>` con `field={'jsCondition'}`.

Default per view auto-create:
- DClass-context auto-create (`utils/lastViewpoint.ts:123`): `oclCondition = "context DObject inv: self.instanceof.id = '<elementId>'"`, `jsCondition = ""`.
- DEnumerator/DModel/DPackage (lastViewpoint:128/133/138): `oclCondition = "context DXxx inv: self.id = '<elementId>'"`, `jsCondition = ""`.
- `view.tsx:300-323` (`newDefault(forData, forSelf)`): patterns analoghi (vedi A.3).
- `redux/defaults/views.ts`: 9 view di default usano `"context DXxx inv: true"` (predicati generici, non identificano classifier specifico).

**Nessun campo `oclPredicate` / `where` / `constraint`** esiste. I due nomi canonici sono `oclCondition` e `jsCondition`.

---

## A.2 — Esiste un parser/utility nativo per estrarre il classifier dal predicato?

**No, non esiste.** Verifica esauriente effettuata:

- `grep -rn "parsePredicate|extractClassifier|resolvePredicateTarget|getPredicateClassifier|getViewClassifier"` → 0 hit
- `grep -rn "OclParser|parseOCL|OCL\.parse|compileOcl|oclToJs|OCLEvaluator"` → 0 hit
- `grep -rn "parseOcl|parseJs|extractContext|getContext|oclParser|predicateParser|inferClassifier"` → 0 hit (eccetto match in commenti / nomi di variabili in jjscript/jjtl scollegati)

Cosa esiste invece:

1. **`frontend/src/ocl/ocl.tsx`** — wrapper sopra la libreria `@stekoe/ocl.js`. Espone:
   - `OCL.evaluate(obj, constructor, oclexp, ...)` — registra tipi e valuta una OCL contro un oggetto, ritorna `OclResult`
   - `OCL.test(me, view, node)` / `OCL.test_bugged_new(...)` — valuta `view.oclCondition` contro `me`, ritorna boolean
   - `OCL.filter(...)` — applica OCL a un array di oggetti
   - `windoww.OCL = OCL` (riga 182): esposto globale
   - **Nessuna funzione "parse senza evaluate"**. La libreria internamente parsa OCL (per costruire l'engine), ma non espone l'AST.

2. **`frontend/src/utils/LazyOCL.ts`** — sistema di caching dei risultati OCL basato su hash (clonedCounter + viewVersion). Nessuna analisi sintattica.

3. **`redux/selectors/selectors.ts:725-746`** — il view-application engine valuta `tv.jsCondition` (che è una `(context: GObject) => boolean` — vedi `joiner/classes.ts:4046` `jsCondition!: undefined | ((context:GObject) => boolean)`, NB: questa è la versione COMPILATA della stringa) contro `{data, node, view, constants}`. Compilation pipeline: la stringa user-facing `jsCondition: string` (DViewElement) viene compilata in `tv.jsCondition: Function` da qualche parte dell'init (transientProperties). Anche qui: nessun parsing strutturale che restituisca il classifier target.

4. **`@stekoe/ocl.js`** (npm dep) — l'engine espone `addOclExpression` / `evaluate` / `registerTypes`, ma *non* espone l'AST parsed in modo accessibile dall'esterno (verifica con `import {OclEngine} from "@stekoe/ocl.js"`: API surface è `create()`, `addOclExpression()`, `registerTypes()`, `evaluate()`, `getEvaluatedContexts()`, `getResult()`).

**Conclusione**: dobbiamo procedere via regex. La libreria OCL ha un parser interno ma non lo espone, e creare un parser proprio (con AST visit per estrarre `instanceof.id/name`) sarebbe sproporzionato per il nostro caso d'uso. La regex è la scelta giusta.

---

## A.3 — Schema dei predicati delle view auto-create (samples reali)

Estratti dal codebase. Tabella riassuntiva:

| # | Predicato (OCL/JS)                                            | File / line                  | Match in regex candidata? | Classifier target |
|---|---------------------------------------------------------------|------------------------------|---------------------------|-------------------|
| 1 | `context DObject inv: self.instanceof.id = '<DD-pointer>'`    | lastViewpoint.ts:123         | ✅ (id, `<DD-pointer>`)    | DD (per id)      |
| 2 | `context DObject inv: self.instanceof.id = '<DD-pointer>'`    | view.tsx:314 (newDefault)    | ✅ (id, `<DD-pointer>`)    | DD (per id)      |
| 3 | `context DModel inv: self.instanceof.id = '<MM-pointer>'`     | view.tsx:311 (newDefault)    | ✅ (id, `<MM-pointer>`)    | MM (per id)      |
| 4 | `context DValue inv: self.instanceof.id = '<DA-pointer>'`     | view.tsx:318 (DA/DR auto)    | ✅ (id, `<DA-pointer>`)    | DA/DR (per id)   |
| 5 | `context DEnumerator inv: self.id = '<elementId>'`            | lastViewpoint.ts:128         | ❌ (manca `instanceof`)    | (nessuno — match per istanza singola) |
| 6 | `context DModel inv: self.id = '<elementId>'`                 | lastViewpoint.ts:133         | ❌                         | (nessuno)        |
| 7 | `context DPackage inv: self.id = '<elementId>'`               | lastViewpoint.ts:138         | ❌                         | (nessuno)        |
| 8 | `context DEnumLiteral inv: self.id = '<elementId>'`           | view.tsx:321 (default arm)   | ❌                         | (nessuno)        |
| 9 | `context DObject inv: true`                                   | redux/defaults/views.ts:545  | ❌                         | (predicato generico, no classifier) |
| 10| `context DXxx inv: true` (×9 varianti per ogni D-type)        | redux/defaults/views.ts      | ❌                         | (idem)           |
| 11| `return data?.instanceof?.isSingleton`                        | redux/defaults/views.ts:640  | ❌ (JS, no `instanceof.id/name = ...`) | (idem) |

Patterns reali by-name (`self.instanceof.name = '...'`): **non trovati nel codebase**. Il pattern by-id è quello canonico per le view auto-create che identificano una metaclass user-defined. Il pattern by-name è plausibile per predicati scritti a mano dall'utente (più leggibile), ma non è generato automaticamente da nessun template.

Pattern JS canonici (es. `data.instanceof.id == '...'`): **non trovati nel codebase per view auto-create**. L'unica auto-create che usa jsCondition è la singleton (`return data?.instanceof?.isSingleton`), che non identifica un classifier specifico. Gli utenti potrebbero scrivere predicati JS a mano usando `data.instanceof.id == '<id>'`; il regex dovrà supportare anche quel caso.

**Forme `and`/`or`/composte**: non trovate nel codebase per le auto-create. Possibili in predicati custom user-written. Da gestire con la policy A.7 (multi-classifier → ambiguità → no banner).

---

## A.4 — Strategia di selezione tra OCL e JS quando entrambi popolati

Dal codebase non esiste una "canonical source" tra OCL e JS — sono **indipendenti** (scenario (ii)):

- L'engine in `selectors.ts:583` chiama `Selectors.updateJSScore` e (presumibilmente in altro punto) `updateOCLScore`; entrambi i risultati contribuiscono al `finalScore` (selectors.ts:428: `explicitprio = (dview.jsCondition?.length || 1) + (dview.oclCondition?.length || 1)`).
- Auto-create (`lastViewpoint.ts`, `view.tsx newDefault`) scrive sempre solo su `oclCondition`, mai su entrambi.
- L'unica view di default che usa `jsCondition` esclusivamente è la singleton (`defaults/views.ts:640`) — predicato non identificativo di classifier.
- Le view di default storiche (`defaults/views.ts:48,122,174,...`) scrivono sempre solo su `oclCondition`.

**Strategia raccomandata per la heuristic**:

1. **Provare prima OCL** (`view.oclCondition`): se non vuoto, applicare la regex e usare il match.
2. **Fallback su JS** (`view.jsCondition`): solo se OCL è vuoto OR la regex su OCL non produce match. Applicare la stessa regex.
3. **Se entrambi vuoti / nessun match**: niente banner.
4. **Se entrambi popolati e producono classifier diversi**: ambiguità → niente banner (coerente con A.7).
5. **Se entrambi popolati e producono lo stesso classifier**: banner OK (ridondanza, decision unanime).

Rationale priorità OCL: tutte le auto-create (caso d'uso target del polish) usano OCL. JS è auxiliary e meno frequente.

---

## A.5 — Risoluzione classifier-da-name

**API esistente**: `LModel.getClassByName(name: string): LClass | null` — definita in `model/logicWrapper/LModelElement.tsx:5528-5538`.

```ts
// LModelElement.tsx:5528
getClassByName(name: string): LClass | null { return this.cannotCall('getClassByName'); }

// :5533
get_getClassByName(c: Context): (name: string) => LClass | null {
    return (name: string) => {
        // ... implementation: itera packages, trova classe con nome corrispondente
    };
}
```

Pattern d'uso esistente nel codebase (verifica via grep):
- `model/logicWrapper/LModelElement.tsx:1393`: `if (model) type = model.getClassByName(rawType) as LClass;`
- `model/logicWrapper/LModelElement.tsx:1451`: `if (model) ptr = (model.getClassByName(ptr)?.id || ptr);`
- `model/logicWrapper/LModelElement.tsx:6168`: `metaptr = model.classes.filter(c=> c.name === val)[0]?.id;` (variante inline)
- `jjtl/executor/jjodelConverter.ts:425`: `const found = metamodel.classes.find((c: any) => c.name === className);`
- `services/JjodieActionExecutor.ts:116, 145, ...`: `findClassByName(project, ...)` (helper privato del service)

**Variante per namespacedclasses**: `LModel.getClassByNameSpace(namespacedclass: string)` (LModelElement.tsx:5514) — gestisce `'package.ClassName'`.

**Comportamento per duplicati**: l'implementazione `pkg.classes.filter(c => c.name === classname)[0]` (riga 5524) ritorna la **prima occorrenza**. Jjodel **permette** classi omonime in package diversi (ed è uno scenario valido in metamodelli grossi). Per la nostra heuristic questo è un edge case: se la regex matcha un nome ambiguo (presente in più package), `getClassByName` ritorna comunque uno specifico — l'utente vedrebbe il banner ma con un classifier potenzialmente sbagliato. Politica conservativa: usare un wrapper che conta i match e ritorna `null` se ambiguo, oppure accettare il primo match (semplicità, consistente col resto del codebase).

**Comportamento per nomi astratti** (`'DObject'`, `'DClass'`, ecc.): `getClassByName` cerca solo nei package del metamodello user-defined, NON nel kernel D-types. Quindi `getClassByName('DObject')` ritornerebbe `null` (a meno che l'utente non abbia creato una classe DObject custom in un suo package — patologico ma legale). Coerente con la decisione del polish base (no banner per tipi astratti).

**Quale `LModel` usare**: il metamodel "attivo" per la view in editing va risolto. Path possibili:
- (i) `view.viewpoint.metamodels[0]` — viewpoint può essere multi-metamodello
- (ii) Iterare tutti i metamodelli del progetto (`LProject.getProject()?.metamodels`) e cercare in tutti finché non si trova una corrispondenza

Esistono pattern entrambi nel codebase. La via più semplice e robusta per la heuristic: **iterare tutti i metamodels del progetto**. Questo perché:
- Le view non sono necessariamente bound a un singolo metamodel.
- Cercare in tutti i metamodels è O(N×classi totali), trascurabile per una heuristic eseguita on-render.
- Fallisce in modo safe se duplicati (prima occorrenza, come `getClassByName`).

---

## A.6 — Schema della regex (validazione contro samples)

Regex candidata:

```js
/(?:self|data)\.instanceof\.(id|name)\s*={1,3}\s*['"]([^'"]+)['"]/g
```

### Validazione su samples A.3

| # | Sample (truncated)                                             | Match? | group1 (id/name) | group2 (value)        |
|---|----------------------------------------------------------------|--------|------------------|-----------------------|
| 1 | `... self.instanceof.id = '<DD-pointer>'`                     | ✅      | `id`             | `<DD-pointer>`        |
| 2 | `... self.instanceof.id = '<DD-pointer>'` (newDefault)         | ✅      | `id`             | `<DD-pointer>`        |
| 3 | `... self.instanceof.id = '<MM-pointer>'`                      | ✅      | `id`             | `<MM-pointer>`        |
| 4 | `... self.instanceof.id = '<DA-pointer>'`                      | ✅      | `id`             | `<DA-pointer>`        |
| 5 | `... self.id = '<elementId>'`                                  | ❌      | n/a              | n/a (no `instanceof`) |
| 6 | `... self.id = '<elementId>'` (DModel)                         | ❌      | n/a              | n/a                   |
| 7 | `... self.id = '<elementId>'` (DPackage)                       | ❌      | n/a              | n/a                   |
| 8 | `... self.id = '<elementId>'` (DEnumLiteral default arm)       | ❌      | n/a              | n/a                   |
| 9 | `context DObject inv: true`                                    | ❌      | n/a              | n/a                   |
| 10| `context DXxx inv: true`                                       | ❌      | n/a              | n/a                   |
| 11| `return data?.instanceof?.isSingleton`                         | ❌      | n/a              | n/a (no `=` operator) |

**Tutti i comportamenti sono corretti**:
- Samples 1-4 (DClass-meta auto-create): banner triggerable. Use case target.
- Samples 5-8 (`self.id = '<id>'`): match per istanza singola, NON per metaclass. Banner correttamente NON appare (non ha senso per istanze singole).
- Samples 9-10 (predicati generici "context X inv: true"): banner correttamente NON appare (nessun classifier specifico).
- Sample 11 (JS singleton): banner correttamente NON appare.

### Pattern utente-scritti (non auto-generati) — validazione teorica

| Pattern                                              | Match? | Note                              |
|------------------------------------------------------|--------|-----------------------------------|
| `data.instanceof.id == '<id>'`                        | ✅     | `={1,3}` accetta `==`             |
| `data.instanceof.id === '<id>'`                       | ✅     | `={1,3}` accetta `===`            |
| `self.instanceof.name = 'MyClass'`                    | ✅     | group1=`name`, group2=`MyClass`   |
| `self.instanceof.name = "MyClass"` (double quotes)    | ✅     | `['"]` gestisce entrambi          |
| `self.instanceof.id="<id>"` (no whitespace)           | ✅     | `\s*` accetta zero whitespace     |
| `self.instanceof.id    =    '<id>'` (lots of WS)      | ✅     | `\s*` greedy                      |

### Falsi positivi noti

1. **OCL inequality** `self.instanceof.id <> '<id>'`: regex NON matcha (solo `=` accettato). ✓ comportamento safe.
2. **JS inequality** `data.instanceof.id != '<id>'` o `!== '<id>'`: il `!=` non matcha `={1,3}` perché c'è un `!` davanti. Tecnicamente la regex potrebbe matchare `= '<id>'` se il regex engine fa partial match, ma lo `\s*` davanti a `={1,3}` significa "WS then equals". `!` non è WS, quindi non matcha. ✓ safe.
3. **Negazione OCL** `not (self.instanceof.id = '<id>')`: regex matcha il sub-pattern `self.instanceof.id = '<id>'`. Falso positivo: l'utente vuole NON quella classe, ma la heuristic suggerirà di applicare quella classe. **Edge case accettabile per la prima iterazione** (banner è una hint, non un'imposizione; l'utente vede comunque la heuristic e può ignorarla). Se diventa un problema reale, mitigation: scartare il match se preceduto da `not\s*\(`.
4. **Nested non-self** `self.father.instanceof.id = '<id>'`: regex richiede `self.instanceof.` ANCORATO (non `self.father.instanceof.`), quindi NON matcha. ✓ comportamento corretto (la classe è del father, non del self).
5. **Stringhe OCL escape** `self.instanceof.id = 'a\'b'`: la regex `[^'"]+` si ferma al primo `'` interno, catturando solo `a\\` come group2. Edge case patologico, classifier IDs reali sono UUID-style → non contengono apostrofi. ✓ accettabile.

### Falsi negativi noti

1. **Operatore alternativo OCL** `self.instanceof.id eq '<id>'` (rarissimo, OCL accetta `eq` come synonym di `=`): regex NON matcha. **Mitigation possibile**: estendere a `\s*(?:={1,3}|eq)\s*`. Decisione: **non estendere ora** (mai visto nel codebase, complicates regex per un caso teorico).
2. **Pattern composti `and`** `self.instanceof.id = 'X' and self.instanceof.id = 'Y'`: la regex con flag `g` matcha BOTH. Heuristic deve riconoscere multi-match e ritornare null/ambiguo (vedi A.7). Pattern logicamente incoerente in pratica, ma codice deve essere robusto.
3. **Predicato in commento** `-- self.instanceof.id = '<id>'`: regex matcha, ma è commento. **Mitigation**: pre-stripping dei commenti OCL (`-- ... \n`) prima dell'apply della regex. Codice ~3 righe. **Consigliato**.

### Versione finale proposta della regex

```js
const PREDICATE_CLASSIFIER_RE = /(?:self|data)\.instanceof\.(id|name)\s*={1,3}\s*['"]([^'"]+)['"]/g;
```

Con pre-processing del predicato per rimuovere commenti OCL line-style:

```js
function stripOclComments(src: string): string {
    return src.replace(/--[^\n]*$/gm, '');
}
```

(I commenti JS `// ... ` non danno problemi al parsing JS, ma per simmetria si possono strippare nel passaggio di pre-processing — opzionale.)

---

## A.7 — Politica di fallback e ambiguità

Riassumo le decisioni di design (la spec proponeva (a) come raccomandata, e la riconfermo):

### Quando il banner appare

Banner visibile **solo se** entrambe le condizioni sono soddisfatte:

1. La heuristic risolve un **classifier univoco e valido** (LClass concreta, non astratta, esistente nei metamodelli del progetto, con esattamente 2 reference dichiarate).
2. `view.isEdge !== true`.

### Sorgente del classifier (priorità)

Ordine di tentativo:

1. **`view.appliableToClasses`** — se `length === 1` e l'elemento è un classifier-id risolvibile a un'`LClass` con className `'DClass'`. (Comportamento attuale del banner, **invariato**.)
2. Se (1) non produce un classifier valido, **applicare la regex su `view.oclCondition`** (vedi A.6). Estrarre tutti i match (flag `g`).
3. Se (1) e (2) entrambi non producono, **applicare la regex su `view.jsCondition`**.
4. Se nessuna delle tre sorgenti produce un classifier valido, **niente banner**.

### Ambiguità intra-sorgente

Per le sorgenti OCL e JS (regex-based):

- **0 match**: nessun classifier candidato → fallback alla sorgente successiva.
- **1 match**: candidato unico. Applicare la risoluzione:
  - `group1 === 'id'` → `LPointerTargetable.fromPointer(group2) as LClass`. Verificare `className === 'DClass'`.
  - `group1 === 'name'` → iterare `LProject.getProject().metamodels` chiamando `mm.getClassByName(group2)` finché non si trova un'LClass. Prima occorrenza vince (consistente con `getClassByName` interno).
- **2+ match**: se tutti i match risolvono allo stesso classifier-id, OK (caso degenere, banner appare). Se risolvono a classifier diversi, **ambiguità → fallback alla sorgente successiva o no banner**.

### Ambiguità cross-sorgente (appliableToClasses vs predicato)

Decisione: **appliableToClasses ha priorità** (opzione (a) della spec).

Rationale:

- L'utente che ha esplicitamente popolato `appliableToClasses` ha fatto una **scelta deliberata**. Il predicato è spesso auto-generato (lastViewpoint, newDefault) e meno autorevole.
- Il view-application engine usa `appliableToClasses` come filtro **primario** (EdgeOverlay:312 `findApplicableEdgeView`, vedi discovery 2026-05-08 task base). Coerenza col motore.
- Polish behavior: se l'utente ha già impostato `appliableToClasses` su Una classe specifica, il banner si attiva con quella classe; il predicato viene ignorato come sorgente. (Caso d'uso target del polish v2: `appliableToClasses` **vuoto** → si scende al predicato. Caso comune oggi.)

Caso particolare: **`appliableToClasses` ha valori `'DObject'`/`'DClass'`/...** (tipi astratti, non classifier-id). Il check attuale del banner (className !== 'DClass') ritorna null per questo caso → si scende correttamente al predicato. ✓

### Edge case: `appliableToClasses` ha 2+ classifier-id concreti

Heuristic attuale ritorna null (length !== 1). Si scenderebbe al predicato. **Decisione**: **non scendere al predicato** in questo caso. Se l'utente ha esplicitamente bound a 2+ classifier, il banner non ha senso (il classifier "in-context" è ambiguo per definizione). Il banner nel polish v2 controlla `appliableToClasses.length === 0` per decidere il fallback al predicato, NON `length !== 1`.

Pseudocode finale della heuristic:

```ts
function resolveClassifier(view): LClass | null {
    // (1) appliableToClasses single concrete classifier-id
    const apc = view.appliableToClasses ?? [];
    if (apc.length === 1) {
        const lCls = LPointerTargetable.fromPointer(apc[0]) as LClass | undefined;
        if (lCls && (lCls as any).className === 'DClass') return lCls;
    }
    if (apc.length > 0) return null;  // 2+ classifier o single non-LClass → ambiguo, no fallback

    // (2) regex su oclCondition
    const ocl = stripOclComments(view.oclCondition || '');
    let cls = matchSinglePredicateClassifier(ocl);
    if (cls) return cls;

    // (3) regex su jsCondition
    const js = view.jsCondition || '';
    cls = matchSinglePredicateClassifier(js);
    if (cls) return cls;

    return null;
}

function matchSinglePredicateClassifier(predicate: string): LClass | null {
    const matches = [...predicate.matchAll(PREDICATE_CLASSIFIER_RE)];
    if (matches.length === 0) return null;
    const candidates = new Set<string>();  // dedupe by classifier-id
    let lClsResolved: LClass | null = null;
    for (const m of matches) {
        const [, kind, value] = m;
        let lCls: LClass | null;
        if (kind === 'id') {
            lCls = LPointerTargetable.fromPointer(value) as LClass | undefined;
            if (!lCls || (lCls as any).className !== 'DClass') continue;
        } else { // 'name'
            const mms = LProject.getProject()?.metamodels ?? [];
            lCls = null;
            for (const mm of mms) {
                const found = mm.getClassByName(value);
                if (found) { lCls = found; break; }
            }
            if (!lCls) continue;
        }
        candidates.add(lCls.id);
        lClsResolved = lCls;
    }
    return candidates.size === 1 ? lClsResolved : null;  // unique resolution
}
```

### Implicazioni per il bottone "Apply suggestions"

Il bottone scrive 3 campi (`isEdge`, `edgeSource`, `edgeTarget`) in singola TRANSACTION. Quando il classifier viene dal predicato (path 2/3), `appliableToClasses` resta vuoto. **Decisione di design da confermare**: in questo caso Apply popola anche `appliableToClasses = [classifier.id]`?

- **Pro**: rende l'intento dell'utente esplicito; future re-render della heuristic non devono ri-parsare il predicato; il view-application engine usa `appliableToClasses` come filtro primario, l'utente vede subito il binding nel multiselect "Applicable to".
- **Contro**: scrive un campo che l'utente non ha esplicitamente toccato; "Apply" diventa una scrittura su 4 campi invece che 3 (cambio semantico).

**Raccomandazione**: **scrivere anche `appliableToClasses = [classifier.id]`** quando il classifier viene dal predicato (path 2/3) E `appliableToClasses.length === 0`. Coerente con il caso d'uso target del polish v2 ("click Apply popola Applicable to con DD oltre a settare isEdge/edgeSource/edgeTarget").

Quando il classifier viene da `appliableToClasses` (path 1), Apply NON tocca `appliableToClasses` (già corretto, comportamento attuale).

Pattern handler:

```ts
TRANSACTION('Apply edge suggestions', () => {
    view.isEdge = true;
    view.edgeSource = `$${ref0Name}.value`;
    view.edgeTarget = `$${ref1Name}.value`;
    if ((view.appliableToClasses ?? []).length === 0) {
        view.appliableToClasses = [classifierId];
    }
});
```

---

## Aperti / decisioni da confermare prima di Fase B

1. **Scrittura `appliableToClasses` nell'handler Apply quando classifier viene dal predicato**: confermare la raccomandazione (scrivere se vuoto). Alternative: non scrivere mai (lascia campo vuoto), scrivere sempre (anche se popolato — sovrascrive). La raccomandazione (scrivi-se-vuoto) è il pattern più conservativo e coerente col caso d'uso target.

2. **Pre-stripping commenti**: confermare che si fa solo per OCL line comments (`-- ...`) o anche JS (`// ...`, `/* ... */`). Raccomandazione: solo OCL line comments per la prima iterazione (i predicati JS auto-create non hanno commenti).

3. **Estensione regex a `eq`** (OCL synonym for `=`): non implementare ora, segnare come known limitation.

4. **Risoluzione name su tutti i metamodelli vs metamodelli del viewpoint**: raccomandazione "tutti i metamodels del progetto" (semplicità). Confermare.

5. **Gestione ambiguità name (classi omonime in package diversi)**: prima occorrenza vince (consistente con `getClassByName` interno). Confermare o richiedere "no banner se ambiguo" (più strict).

6. **Path discovery doc**: questo file è in `docs/discovery/` come da convenzione del polish base. ✓ no decisione richiesta.

---

## Riassunto exec

- **A.1** ✅ — Campi: `oclCondition: string`, `jsCondition: string` (entrambi). Default empty.
- **A.2** ❌ — Nessun parser nativo. Procediamo con regex.
- **A.3** ✅ — 11 sample patterns mappati. 4 auto-create matchano la regex (uso target), 7 non matchano correttamente.
- **A.4** ✅ — OCL e JS indipendenti. Strategia: prima OCL, fallback JS.
- **A.5** ✅ — `LModel.getClassByName(name): LClass | null` esiste; iterare metamodels del progetto.
- **A.6** ✅ — Regex candidata valida sui samples reali. Aggiungere pre-stripping commenti OCL.
- **A.7** ✅ — Priorità `appliableToClasses` > predicato. Multi-classifier ambigue → no banner. Apply scrive `appliableToClasses` solo se vuoto.

**Fase A completata. Hard stop. In attesa di OK (e di chiarimenti sui 5 aperti) prima di procedere a Fase B.**
