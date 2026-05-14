# Micro-discovery — Bug H: Cross-document EDataType alias resolution

**Data:** 2026-05-14
**Branch:** `alfonso-frontend-jjtl`
**Scope:** read-only, hard stop dopo il report.
**Trigger:** verifica UML2.ecore (243 classes) post chiusura workstream Persons+Families. Tutti gli attribute con `eType` cross-doc verso `Types.ecore` (Boolean, Integer, Real, UnlimitedNatural) appaiono come `Pointer_ESTRING` runtime.

---

## 1. Catena causale step-by-step

Input osservato in UML2.ecore (esempio canonico):

```xml
<eStructuralFeatures xsi:type="ecore:EAttribute" name="isAbstract"
    eType="ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//Boolean"/>
```

Il file `Types.ecore` referenziato dalla URL `platform:/plugin/...` **NON è un child** del wrapper `<xmi:XMI>` di UML2.ecore — è un secondo file fisicamente esterno. Il wrapper di UML2.ecore contiene esattamente un `<ecore:EPackage name="uml">` con `<EClass>` annidate; nessun pacchetto primitivo-only locale.

### Step 1 — `EcoreParser.parse()` ➜ `parseM2Model()`

`data.ts:164` (`parse`) → con `isMetamodel=true` chiama `parseM2Model(parsedjson, filename)` a `data.ts:173`.

### Step 2 — Classificazione package wrapped: tutti `normalIndices`

`parseM2Model` a `data.ts:413`:

```
const epkgChildren = EcoreParser.getMultiPackageChildren(json);
```

Per UML2.ecore: `epkgChildren = [umlPackage]` (1 elemento).

`data.ts:425-430`:

```
for (let i = 0; i < epkgChildren.length; i++) {
    if (EcoreParser.isPrimitivePackage(epkgChildren[i])) primitiveIndices.add(i);
    else normalIndices.add(i);
}
```

`isPrimitivePackage` (`data.ts:1015-1022`) controlla che TUTTI i classifier interni siano `ecore:EDataType`. Il package `uml` contiene `<EClass>` → ritorna `false` → finisce in `normalIndices`. **`primitiveIndices = ∅`**. Conseguenza: il `Types.ecore` esterno NON viene mai consumato dall'importer (mai stato un child del wrapper).

### Step 3 — `parseDAttribute` assegna la stringa raw a `dObject.type`

`data.ts:849`:

```typescript
dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
```

Per `isAbstract`, il valore di `json[ECoreAttribute.eType]` è la stringa intera `"ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//Boolean"`. La `read()` è una passthrough con character un-escaping (`data.ts:979-988`): assegna invariata al DObject.

Pattern identici in:
- `parseDReference` `data.ts:869` (`ECoreReference.eType`)
- `parseDParameter` `data.ts:887` (`ECoreAttribute.eType`)
- `parseDOperation` `data.ts:908` (return type)

**Fix-C interlock**: il fix di Bug C ha modificato `parseDAttribute` per passare `undefined` come secondo argomento a `DAttribute.new()` (`data.ts:837`), evitando che il mixin `DTypedElement` (`classes.ts:844-902`) faccia by-name lookup su quella stringa e cada nel fallback hardcoded `Pointers.ESTRING` (`classes.ts:898`). Il fix-C protegge il **constructor**; la stringa raw è comunque depositata dopo, sul field `.type`, in attesa del post-pass di `LinkAllNamesToIDs`.

### Step 4 — `rewriteXPathPointers` ignora il pattern cross-doc

`parseM2Model` `data.ts:449`:

```
EcoreParser.rewriteXPathPointers(generated, primitiveIndices, normalIndices, epkgChildren);
```

Implementazione `data.ts:1029-1067`:

```typescript
const xpathRe = /^\/(\d+)\/([^/]+)$/;
const rewriteOne = (value: string): string => {
    if (typeof value !== 'string' || !value.startsWith('/')) return value;
    const m = xpathRe.exec(value);
    if (!m) return value; // "/N/X/Y" or other shapes: scope Fase B.2
    ...
};
```

La stringa `"ecore:EDataType platform:/..."` **non inizia con `/`** → early-return alla prima riga di `rewriteOne` → `e.type` resta invariata. Nessun branch di questa funzione tocca pattern multi-value cross-doc.

### Step 5 — `LinkAllNamesToIDs`: la stringa cade nel fallback EString

`data.ts:226-336`, ciclo principale `for (let replacekey of replaceRules)` su `replaceRules = ["extends", "exceptions", "type", "values"]` (`data.ts:277`).

Per ogni DAttribute, processa il field `type` (`data.ts:296-335`). Risoluzione del valore (`data.ts:309-317`):

```typescript
for (let value of values) {
    if (!value) continue;
    let target: DModelElement = replacePrimitiveMap[value];
    if (!target) target = nameMap[value];
    if (!target && value.indexOf("ecore:EDataType") === 0) {
        Log.ww('found unknown EDataType "' + value + '", remapping it to string');
        target = replacePrimitiveMap[AttribETypes.EString];
    }
    ...
    if (isArray) dobj[replacekey].push(target.id);
    else dobj[replacekey] = target.id;
}
```

- **`replacePrimitiveMap[value]`** → undefined. Le chiavi popolate (`data.ts:236-267`) hanno tre forme: short (`"EString"`), short+prefix (`"#//EString"`), e long form Ecore-namespace (`"ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"`). Mai con URL platform-relative cross-doc.
- **`nameMap[value]`** → undefined. Le chiavi sono `"#//ClassName"` per i tipi in-document (`data.ts:292`).
- **Fallback line 314 cattura tutto**: `value.indexOf("ecore:EDataType") === 0` è TRUE per qualunque cross-doc EDataType, indipendentemente dal nome dopo `#//` (Boolean, Integer, Real, UnlimitedNatural, ...) → `target = replacePrimitiveMap[AttribETypes.EString]` → `dobj.type = Pointer_ESTRING`.

### Step 6 — emette `Log.ww` (warning)

Il warning `'found unknown EDataType "..." , remapping it to string'` viene emesso ma è silenzioso a livello UX (nessuna popup); finisce solo in console. Per UML2.ecore ne stampa ~652 (97 features + 555 parameters meno gli EString reali).

### Recap: tabella sintetica

| # | Sito | Cosa accade |
|---|------|-------------|
| 1 | `parse()` `data.ts:164` | Routing a `parseM2Model` |
| 2 | `parseM2Model` `data.ts:425-430` | `primitiveIndices=∅` (Types.ecore non è child) |
| 3 | `parseDAttribute` `data.ts:849` | Multi-value string assegnata a `dObject.type` |
| 4 | `rewriteXPathPointers` `data.ts:1037` | Early-return, pattern non matcha `^/N/X$` |
| 5 | `LinkAllNamesToIDs` `data.ts:312-317` | `replacePrimitiveMap`/`nameMap` miss → fallback Bool→EString |
| 6 | `LinkAllNamesToIDs` `data.ts:333` | `dobj.type = Pointer_ESTRING` |

---

## 2. Verifica puntuale F1-F4

### F1 — Field di destinazione (stringa raw)

`parseDAttribute` `data.ts:849`:

```typescript
dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString);
```

La stringa multi-value finisce **direttamente** sul field `.type` del `DAttribute`, senza pre-processing. È usata come pre-marker che `LinkAllNamesToIDs` deve poi risolvere in un Pointer a un DClassifier. Pattern identici a `parseDReference:869`, `parseDParameter:887`, `parseDOperation:908`.

### F2 — Regex `xpathRe` e ramo if/else

`data.ts:1035`:

```typescript
const xpathRe = /^\/(\d+)\/([^/]+)$/;
```

Pattern: solo forme `^/<digits>/<not-slash>$`, p.es. `/0/Boolean`. **Non** matcha `#//X` (è ancorata a inizio stringa col `/` letterale e non al `#`). **Non** matcha cross-doc multi-value (`ecore:EDataType platform:/...`).

Ramo if/else (`rewriteOne` lines `1036-1051`):

```typescript
const rewriteOne = (value: string): string => {
    if (typeof value !== 'string' || !value.startsWith('/')) return value;  // ① early-return
    const m = xpathRe.exec(value);
    if (!m) return value;                                                    // ② non matcha → no-op
    const idx = parseInt(m[1], 10);
    const name = m[2];
    if (primitiveIndices.has(idx)) {                                         // ③ primitiveIdx → alias
        const canonical = EcoreParser.EDATATYPE_CANONICAL_ALIASES[name];
        if (canonical) return canonical;
        ...
        return 'EString';
    }
    if (normalIndices.has(idx)) return EcoreParser.classTypePrefix + name;   // ④ normalIdx → #//Name
    return value;                                                            // ⑤ catch-all
};
```

Comportamento per Bug H: la stringa `"ecore:EDataType platform:/..."` colpisce **branch ①** (early-return: non inizia con `/`). Risultato: invariata.

### F3 — Resolution path in `LinkAllNamesToIDs`

Codice testuale `data.ts:309-317`:

```typescript
for (let value of values) {
    if (!value) continue;
    let target: DModelElement = replacePrimitiveMap[value];     // ① miss
    if (!target) target = nameMap[value];                       // ② miss
    if (!target && value.indexOf("ecore:EDataType") === 0) {    // ③ HIT
        Log.ww('found unknown EDataType "' + value + '", remapping it to string');
        target = replacePrimitiveMap[AttribETypes.EString];
    }
    // ...
}
```

Step-by-step per `value = "ecore:EDataType platform:/.../Types.ecore#//Boolean"`:

1. `replacePrimitiveMap[value]` → `undefined` (le chiavi sono: short `"EString"`, prefixed `"#//EString"`, full Ecore-NS `"ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"`, ecc. — costruite a `data.ts:236-267` da `ShortAttribETypes` e `ShortDefaultEClasses`).
2. `nameMap[value]` → `undefined` (le chiavi sono `"#//FullName"` per gli elementi in-document, popolate a `data.ts:292`).
3. **Catch-all silenzioso**: `value.indexOf("ecore:EDataType") === 0` → `true` → `target = Pointer_ESTRING`. Log emesso ma non bloccante.

Esiste un commento-out preserved a `data.ts:319-322` che riguardava un fallback simmetrico per `ecore:EClass platform:/...#//EObject` (mostra che il problema è stato già rilevato per le classi `EObject` in passato e gestito ad-hoc, poi commentato; il pattern duale per EDataType è rimasto attivo).

Ramo `Log.ex(!target, ...)` a `data.ts:331` non viene mai colpito perché il catch-all sopra garantisce `target !== undefined`.

### F4 — Coverage `EDATATYPE_CANONICAL_ALIASES`

Codice `data.ts:143-162`:

```typescript
private static EDATATYPE_CANONICAL_ALIASES: Dictionary<string, string> = {
    'String':   'EString',
    'Integer':  'EInt',
    'Int':      'EInt',
    'Boolean':  'EBoolean',
    'Bool':     'EBoolean',
    'Double':   'EDouble',
    'Real':     'EDouble',
    'Float':    'EFloat',
    'EString':  'EString',
    'EInt':     'EInt',
    'EBoolean': 'EBoolean',
    'EDouble':  'EDouble',
    'EFloat':   'EFloat',
    'EChar':    'EChar',
    'EDate':    'EDate',
    'ELong':    'ELong',
    'EShort':   'EShort',
    'EByte':    'EByte',
};
```

Coverage vs UML2.ecore Types.ecore:

| UML2 Type | Mappato? | Target | Note |
|-----------|----------|--------|------|
| `Boolean` | ✓ | `EBoolean` | OK |
| `String` | ✓ | `EString` | OK |
| `Integer` | ✓ | `EInt` | OK |
| `Real` | ✓ | `EDouble` | OK |
| **`UnlimitedNatural`** | ✗ | (none) | **MANCANTE** — fallback a EString se usato direttamente, ma in pratica neanche raggiungibile perché il map è consumato solo da `rewriteXPathPointers` ramo `primitiveIdx`, non dal fallback in `LinkAllNamesToIDs` |

**Short forms `Bool` e `Int`**: presenti (utili per altre convenzioni non-UML).

**`UnlimitedNatural` raccomandato → `EInt`**: la semantica UML è "intero non negativo, con `*` rappresentato come `-1`". JjOM non ha un EBigInteger; `EInt` è la mappatura corretta. (EBigInteger non è in `AttribETypes`/`ShortAttribETypes`, vedi `U.tsx:3322-3348` e `:3615-3641`.)

---

## 3. Candidati di fix — pro/contro

### Candidato A — Pre-pass in `rewriteXPathPointers` (regex aggiuntiva cross-doc)

**Modifica**: estendere `rewriteOne` con un secondo branch che riconosce `^ecore:E\w+\s+\S+#//(\w+)$` e mappa via `EDATATYPE_CANONICAL_ALIASES`.

**Pro:**
- Centralizza tutto il rewriting "pre-link" in un'unica funzione → coerente con l'attuale architettura "normalize before resolve".
- Lavora su `parsedElements` (TUTTI gli elements iterati), quindi cattura `type` su DAttribute, DReference, DParameter, DOperation senza modifiche multi-sito.
- Riusa il map `EDATATYPE_CANONICAL_ALIASES` già esistente (un solo punto da estendere per `UnlimitedNatural`).
- Blast radius: 1 funzione (~15 righe aggiunte). Nessun side-effect su input single-package, perché la nuova regex non matcha le forme già canoniche o `#//X` pure.
- **Simmetria con fix-C**: fix-C ha protetto la fase costruttore-time bypassando il by-name lookup; il rewrite cross-doc pre-link è il complemento naturale che protegge la fase post-link.

**Contro:**
- `rewriteXPathPointers` è chiamato solo dal ramo wrapped (`data.ts:415-449`). Se in futuro lo stesso pattern multi-value apparisse in un file non-wrapped (raro ma legale XMI), il fix non si applicherebbe. **Mitigazione**: chiamare `rewriteXPathPointers` anche nel ramo single-package; oppure spostare il branch cross-doc in una funzione separata invocata in entrambi i path.
- Il nome della funzione diventa parzialmente fuorviante (gestisce sia XPath che cross-doc). **Mitigazione**: rinominare a `normalizePointers` o splittare in due funzioni.

### Candidato B — Trasformazione in `parseDAttribute` (e simmetrici)

**Modifica**: riconoscere la forma multi-value direttamente in `parseDAttribute:849`, `parseDReference:869`, `parseDParameter:887`, `parseDOperation:908`, sostituendo prima dell'assegnazione al DObject.

**Pro:**
- Risolve il valore prima che entri nel sistema → semantica più pulita.
- Sito di intervento immediato alla sorgente.

**Contro:**
- 4 siti da modificare con logica identica → duplicazione, asimmetria con il pattern attuale (che ha già `rewriteXPathPointers` come single normalization point).
- Si applica indistintamente al ramo single-package e multi-package, ma il fix è equivalente in entrambi i casi quindi è un costo neutro/positivo.
- Asimmetrico con fix-C: fix-C ha agito **a monte** del DTypedElement mixin (passando `undefined` al constructor); B agirebbe sempre a monte ma in un layer ancora prima (parse XML→DObject). Coerenza accettabile ma meno modulare.
- Rischio di proliferazione: ogni nuovo parser di typed-element dovrà ricordarsi di applicare la stessa trasformazione.

### Candidato C — Estendere `replacePrimitiveMap` con chiavi multi-value

**Modifica**: in `LinkAllNamesToIDs` al popolamento di `replacePrimitiveMap` (`data.ts:236-267`), aggiungere entry tipo:
```
replacePrimitiveMap["ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//Boolean"] = EBoolean_dClassType;
```
... per ogni `(platform-URL × type-name)` combinazione.

**Pro:**
- Cambio puramente data-driven, nessuna logica nuova.

**Contro:**
- Le URL `platform:/...` sono **arbitrarie** (dipendono dal nome del plugin/file del fornitore del primitivo): la chiave esatta varia tra Types.ecore di UML2, Types.ecore di altri linguaggi, ecc. Servirebbe enumeration esaustiva. **Non scala**.
- Per UML2 specifico la URL è `platform:/plugin/org.eclipse.uml2.types/model/Types.ecore` ma per OCL Pivot, MOF, Acceleo, ecc. saranno diverse → ogni nuovo modello richiede aggiunta manuale.
- Alternativa: usare un Map basato su regex come keys, ma JS Map non supporta regex keys → richiede struttura ad-hoc, perdendo il vantaggio "data-driven".
- **Non raccomandato** salvo si voglia un workaround hardcoded molto specifico.

### Confronto sintetico

| Aspetto | A (rewrite pre-pass) | B (parser site) | C (extend map) |
|---------|----------------------|------------------|----------------|
| Righe modificate | ~15 (1 funzione) | ~10×4 siti = 40 | esponenziale (per ogni URL) |
| Robusto a nuove URL platform-relative | ✓ (regex generica) | ✓ (regex generica) | ✗ |
| Single-package coverage | dipende dall'invocazione | ✓ | ✓ (ma non scala) |
| Simmetria architetturale con fix-C | alta | media | bassa |
| Centralizzazione | alta | bassa (4 siti) | media |
| Blast radius | molto basso | medio | basso ma esplosivo per modelli futuri |

**Raccomandato: A**, con piccola precauzione architetturale (estendere anche al ramo single-package — vedi §4).

---

## 4. Strategia di fix raccomandata (A) — pseudocodice

### A.1 — Estendere `EDATATYPE_CANONICAL_ALIASES`

```typescript
// data.ts:143
private static EDATATYPE_CANONICAL_ALIASES: Dictionary<string, string> = {
    ...
    'UnlimitedNatural': 'EInt',  // UML2 Types.ecore: int with -1 sentinel for "*"
    ...
};
```

### A.2 — Estendere `rewriteXPathPointers` con branch cross-doc

```typescript
// data.ts:1029
private static rewriteXPathPointers(
    parsedElements: DModelElement[],
    primitiveIndices: Set<number>,
    normalIndices: Set<number>,
    epkgChildren: Json[]
): void {
    const xpathRe   = /^\/(\d+)\/([^/]+)$/;
    const crossDocDataTypeRe = /^ecore:EDataType\s+\S+#\/\/(\w+)$/;
    const crossDocClassRe    = /^ecore:EClass\s+\S+#\/\/(\w+)$/;   // optional, simmetrico per riferimenti
    const aliases = EcoreParser.EDATATYPE_CANONICAL_ALIASES;

    const rewriteOne = (value: string): string => {
        if (typeof value !== 'string') return value;

        // (a) Cross-document EDataType (UML2 Types.ecore, MOF Primitives, ecc.)
        const cd = crossDocDataTypeRe.exec(value);
        if (cd) {
            const name = cd[1];
            const canonical = aliases[name];
            if (canonical) return canonical;
            console.warn(`[EcoreImporter] Unknown cross-doc EDataType "${name}" in "${value}", falling back to EString`);
            return 'EString';
        }

        // (b) Cross-document EClass (Ecore reflection: EJavaObject, EDiagnosticChain, ecc.)
        //     Le risorse Ecore native (EObject, EClass, EAnnotation, ENamedElement, EPackage)
        //     sono già coperte da ShortDefaultEClasses → replacePrimitiveMap[longetype] in LinkAllNamesToIDs.
        //     Per i tipi reflection rari (EJavaObject, EDiagnosticChain) sì-o-no?  Vedi §6.
        //     Se decidiamo di gestirli, qui il branch.

        // (c) XPath /N/X (logica esistente, invariata)
        if (!value.startsWith('/')) return value;
        const m = xpathRe.exec(value);
        if (!m) return value;
        const idx = parseInt(m[1], 10);
        const name = m[2];
        if (primitiveIndices.has(idx)) {
            const canonical = aliases[name];
            if (canonical) return canonical;
            const pkgName = (epkgChildren[idx]?.[ECoreNamed.namee] as string) || '?';
            console.warn(`[EcoreImporter] Unknown EDataType "${name}" in primitive package "${pkgName}" (index ${idx}), falling back to EString`);
            return 'EString';
        }
        if (normalIndices.has(idx)) return EcoreParser.classTypePrefix + name;
        return value;
    };

    // Loop esistente: tocca tutti gli elements (DAttribute, DReference, DParameter, DOperation
    // condividono il field `type`; `extends` è array su DClass).
    for (const elem of parsedElements) {
        const e = elem as GObject;
        if (typeof e.type === 'string') {
            e.type = rewriteOne(e.type);
        }
        if (Array.isArray(e.extends)) {
            e.extends = e.extends.map((v: string) => typeof v === 'string' ? rewriteOne(v) : v);
        }
    }
}
```

### A.3 — Chiamare `rewriteXPathPointers` anche nel ramo single-package

`parseM2Model` `data.ts:450-453`:

```typescript
} else {
    EcoreParser.parseRootPackage(dObject, json, generated);
    // Anche nel ramo single-package è legale che un attribute referenzii Types.ecore
    // esterno (es. .ecore generato da Acceleo che importa primitives ma è single-EPackage).
    EcoreParser.rewriteXPathPointers(generated, new Set(), new Set([0]), [json]);
}
```

**Decisione di design da confermare con Alfonso**: invocare `rewriteXPathPointers` anche nel single-package è una micro-estensione conservativa. La funzione è no-op per i pattern già canonici (`#//X`, già-Pointer, ecc.), ma cattura cross-doc multi-value che potrebbe apparire anche fuori dai wrapped XMI. **Pro**: simmetria di trattamento. **Contro**: file single-package esistenti vengono ri-iterati una volta in più (overhead trascurabile, O(N) sui parsedElements). Raccomandato.

### A.4 — Simmetria su `parseDReference` e `parseDParameter`

Il loop di `rewriteXPathPointers` itera **tutti** i `parsedElements` e rewrite il field `type` se string. Quindi:

- `DAttribute.type` ✓ coperto
- `DReference.type` ✓ coperto (stesso field name)
- `DParameter.type` ✓ coperto
- `DOperation.type` ✓ coperto (return type)
- `DClass.extends` ✓ coperto (array branch)

**Non serve toccare** `parseDReference` e `parseDParameter` separatamente: condividono il field name `type` e cadono nel loop generico. Verifica: `e.type` è enumerable property assegnata in tutti i parser → loop generico la cattura.

L'unica asimmetria latente è in `DOperation.exceptions[]`: array di stringhe (`data.ts:909`), già gestito da `LinkAllNamesToIDs` (`replaceRules` include `"exceptions"`). Se in pratica le exceptions di UML2 sono cross-doc EClass references, il fix dovrebbe coprirle nel ramo (b) del rewrite — vedi §6.

---

## 5. Pattern XMI da catturare — regex proposta

### Pattern primario (EDataType cross-doc)

```
^ecore:EDataType\s+\S+#\/\/(\w+)$
```

Cattura il **nome finale** dopo `#//` come gruppo 1.

**Validazione contro casi osservati in UML2.ecore:**

| Input | Match? | Group 1 |
|-------|--------|---------|
| `ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//Boolean` | ✓ | `Boolean` |
| `ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//Integer` | ✓ | `Integer` |
| `ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//Real` | ✓ | `Real` |
| `ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//UnlimitedNatural` | ✓ | `UnlimitedNatural` |
| `ecore:EDataType platform:/plugin/org.eclipse.uml2.types/model/Types.ecore#//String` | ✓ | `String` |
| `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString` (long form Ecore-native) | ✓ | `EString` |

⚠️ **Falso positivo potenziale**: il pattern matcha anche la forma long Ecore-NS (`http://www.eclipse.org/...#//EString`), che è già coperta da `AttribETypes.EString` → `replacePrimitiveMap`. **Conseguenza**: il rewrite la trasformerebbe in `"EString"` (short form), che poi `LinkAllNamesToIDs` risolve via `replacePrimitiveMap["EString"]` (`data.ts:251-253`) al medesimo Pointer. **Net effect: idempotente**, non causa regressioni. Eventualmente si può anchor-ate la regex a `platform:/` se si vuole essere conservativi:

```
^ecore:EDataType\s+platform:\/\S+#\/\/(\w+)$
```

Ma sconsigliato: non tutte le cross-doc URI sono `platform:/...` (alcuni tools usano `pathmap:/`, `file:/`, HTTP, ecc.). Più robusto lasciare `\S+`.

### Pattern secondario opzionale (EClass cross-doc reflection)

```
^ecore:EClass\s+\S+#\/\/(\w+)$
```

Cattura `EClass`, `EObject`, `EJavaObject`, `EDiagnosticChain`, ecc. La maggior parte (`EObject`, `EClass`, `EAnnotation`, `ENamedElement`, `EPackage`) sono già coperti dal `replacePrimitiveMap` popolato via `ShortDefaultEClasses` (`data.ts:255-267` + `U.tsx:3608-3614`). Restano scoperti i reflection rari (`EJavaObject`, `EDiagnosticChain`) — vedi §6.

---

## 6. Tabella mapping completo

### Type names attesi in UML2.ecore (estratti dal conteggio xmllint)

| Type name | Cross-doc source | Mapping target | Alias map già copre? | Note |
|-----------|------------------|----------------|----------------------|------|
| `Boolean` | Types.ecore | `EBoolean` | ✓ | OK |
| `Integer` | Types.ecore | `EInt` | ✓ | OK |
| `Real` | Types.ecore | `EDouble` | ✓ | OK |
| `String` | Types.ecore | `EString` | ✓ | OK |
| `UnlimitedNatural` | Types.ecore | `EInt` | ✗ | **DA AGGIUNGERE** |
| `EBoolean` (long Ecore-NS form) | Ecore.ecore | `EBoolean` | ✓ | Idempotente con regex generica |
| `EInt` (long Ecore-NS form) | Ecore.ecore | `EInt` | ✓ | Idempotente |
| `EString` (long Ecore-NS form) | Ecore.ecore | `EString` | ✓ | Idempotente |
| `EJavaObject` | Ecore.ecore (reflection) | ??? | ✗ | **vedi §6 open questions** |
| `EDiagnosticChain` | Ecore.ecore (reflection) | ??? | ✗ | **vedi §6 open questions** |
| `EClass` (parameter type, reflection) | Ecore.ecore | DClass-meta (DefaultEClasses.EClass) | ✓ via `ShortDefaultEClasses` | Già OK (la long form Ecore-NS è una chiave esistente del map) |

### Conteggi xmllint UML2.ecore (riportati dal prompt)

**Features (97 multi-value):**
- Boolean: 68 → tutti vanno a EBoolean (oggi: EString) ❌
- String: 22 → tutti a EString (oggi: EString) ✓ accidentalmente corretto
- Altri: 7 → mix Integer/Real/UnlimitedNatural → oggi tutti EString ❌

**Parameters (555 multi-value):**
- EDiagnosticChain: 448 → ??? (vedi open questions)
- String: 51 → EString ✓ accidentale
- Boolean: 20 → EBoolean ❌
- Integer: 15 → EInt ❌
- UnlimitedNatural: 14 → EInt ❌
- EClass: 3 → DClass-meta ✓ (via ShortDefaultEClasses)
- Real: 2 → EDouble ❌
- EJavaObject: 1 → ??? (vedi open questions)

Distribuzione post-fix attesa (assumendo `EDiagnosticChain`/`EJavaObject` lasciati unresolved → fallback EString):

| Type pointer | Features | Parameters | Totale |
|--------------|----------|------------|--------|
| `Pointer_EBOOLEAN` | 68 | 20 | 88 |
| `Pointer_EINT` | ~0 (alcuni "Altri") | 15 + 14 = 29 | ~29-30 |
| `Pointer_EDOUBLE` | ~0 | 2 | ~2-3 |
| `Pointer_ESTRING` | 22 + parte di "Altri" | 51 + 448 + 1 = 500 | ~525 |
| Pointer to DClass (EClass-meta) | 0 | 3 | 3 |

Nota: con `EDiagnosticChain`/`EJavaObject` non gestiti, ~500 parameters resterebbero `Pointer_ESTRING`. Se decidiamo di mappare anche quelli a un default ragionevole, la distribuzione cambia.

---

## 7. Open questions per la fase di fix

### Q1 — `EDiagnosticChain` e `EJavaObject`: mappare o lasciare unresolved?

Sono tipi della reflection API Ecore, non veri primitives. UML2 li usa per i return type / parameter type delle operation di validazione.

**Opzioni:**
- **(a) Lasciare fallback a EString** — comportamento attuale, semplice ma semanticamente sbagliato.
- **(b) Mappare a un DObject opaco** — JjOM non ha un tipo "any object", quindi richiederebbe creare un classifier wrapper. Sproporzionato per il caso d'uso.
- **(c) Aggiungere `EJavaObject` come alias di EObject** — `EObject` esiste già in `ShortDefaultEClasses` (`U.tsx:3608`). Semanticamente accettabile: `EJavaObject` in UML2 è "qualcosa di non-EMF", `EObject` è "qualcosa di EMF" — divergenza concettuale ma pragmaticamente entrambi sono "puntatore generico".
- **(d) Per `EDiagnosticChain` lasciare fallback EString** — il commento esistente a `U.tsx:3334` e `:3628` indica che il problema era già noto ("present in uml.ecore, without definition. i guess it's a custom installed package"). Trattarlo come EString è coerente con la storia, ed è ragionevole per un parameter di operation di validation che restituisce stringhe diagnostiche.

**Raccomandazione**: (a) per entrambi, con un logging `Log.ww` distinto da quello generico in modo da poterli targettare in futuro. La mappatura "corretta" richiederebbe support per Java-interop o EMF reflection, fuori scope.

### Q2 — `EClass` come tipo di parameter: già coperto?

Sì. La long form `ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EClass` è una chiave attiva di `replacePrimitiveMap` via `ShortDefaultEClasses.EClass` (popolata a `data.ts:255-267`, valore enum a `U.tsx:3611`).

Verifica:
```typescript
// data.ts:262
replacePrimitiveMap[longetype] = dClassType; // longetype = DefaultEClasses.EClass
```

dove `DefaultEClasses.EClass = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EClass"`. Match esatto → il fallback EString non scatta. **3/555 parameter sono OK già adesso**.

### Q3 — I 555 parameter sono coperti dalla stessa logica delle 97 features?

Sì, **completamente**, per due ragioni:

1. **Field name identico**: `DParameter.type` e `DAttribute.type` sono entrambe property string assegnate nei parser (data.ts:849 vs :887). Il loop di `rewriteXPathPointers` (`data.ts:1053-1066`) itera `parsedElements` e tocca `e.type` su qualsiasi elemento abbia il field — non discrimina per className.
2. **Stessa fase di `LinkAllNamesToIDs`**: il ramo `replacekey = "type"` (`data.ts:277`) si applica a tutti gli elements con field `type`, indistintamente. Quindi il fallback errato si triggera oggi per parameters esattamente come per attributes; il fix lo cura per entrambi simultaneamente.

Stesso per `DReference.type` e `DOperation.type` (return type).

### Q4 — Lo stesso fix è necessario per `extends`?

`extends` su `DClass` è array di stringhe (DClass.eSuperTypes parsed at `data.ts:757-762` — non visualizzato sopra, ma è similmente raw-string).

Casi cross-doc per `extends`: in UML2 alcune classi estendono `ecore:EClass platform:/.../Ecore.ecore#//EObject` o similari. Tali pattern sono **già coperti** da `replacePrimitiveMap` via `ShortDefaultEClasses` → no fix needed.

Eventuali cross-doc verso classi di altri metamodelli user-defined NON-Ecore non sono in scope per UML2.ecore (verificato: tutti gli eSuperTypes nel file sono in-document o verso Ecore.ecore nativo).

**Quindi**: il branch `extends` del rewrite resta com'è oggi (gestisce solo XPath `/N/X`). La regex cross-doc EDataType e EClass del nuovo branch passerebbe attraverso anche `extends`, ma è no-op per casi già canonici → no harm.

### Q5 — Idempotenza del rewrite

Se `rewriteXPathPointers` viene chiamato due volte (improbabile ma possibile in test), il rewrite cross-doc è idempotente perché:
- Input `"ecore:EDataType platform:/...#//Boolean"` → output `"EBoolean"`.
- Input `"EBoolean"` (seconda call) → non matcha la regex `^ecore:EDataType\s+\S+#\/\/...` (manca il prefisso) → return invariato.

OK.

### Q6 — Smoke test post-fix da eseguire (delegato ad Alfonso)

Riepilogo del piano già nel prompt:

```javascript
const isAbstract = Object.values(idlookup).find(d => d.className === 'DAttribute' && d.name === 'isAbstract');
console.log(idlookup[isAbstract?.type]?.name);  // atteso "EBoolean"

const lower = Object.values(idlookup).find(d => d.className === 'DAttribute' && d.name === 'lower');
console.log(idlookup[lower?.type]?.name);  // atteso "EInt"
```

In aggiunta, raccomandato anche:

```javascript
// Verifica UnlimitedNatural risolto
const upper = Object.values(idlookup).find(d => d.className === 'DAttribute' && d.name === 'upper');
console.log(idlookup[upper?.type]?.name);  // atteso "EInt" (UnlimitedNatural → EInt)

// Verifica parametri (più numerosi delle features)
const paramTypes = {};
Object.values(idlookup).filter(d => d.className === 'DParameter')
  .forEach(p => {
    const tn = idlookup[p.type]?.name || `RAW:${p.type}`;
    paramTypes[tn] = (paramTypes[tn] || 0) + 1;
  });
console.table(paramTypes);
// atteso: EBoolean ~20, EInt ~44 (15+14+~15 altri), EDouble ~2, EString ~500 (string + EDiagnosticChain + EJavaObject), DClass-meta ~3
```

Regression check: ricaricare Persons.ecore + Families.ecore già funzionanti e verificare che il fix non rompa il loro path single-package o wrapped (se A.3 viene applicato). Distribuzione attesa identica al pre-fix.

---

## 8. Hard stop

Nessuna modifica al codice in questa fase. Il file di codice attivo non è stato toccato.

Modifiche fatte:
1. Creato `docs/discovery/2026-05-14_microdiscovery_bug_h_crossdoc_datatype.md` (questo file).
2. Aggiornato `docs/claude-code-log.md` con entry per questa discovery (vedi log).

---

**Fine report.**
