# Discovery Fase A2 — Feature flags XMI + nsURI bug

**Data:** 2026-05-14
**Branch:** `alfonso-frontend-jjtl`
**Scope:** read-only discovery per i 6 feature flag XMI (`ordered`, `unique`, `derived`, `transient`, `volatile`, `changeable`) su EAttribute/EReference + bug nsURI suffix `.uml`.
**Vincolo:** nessuna modifica al codice. Output: questo report + entry log.

---

## 1. Working tree status

`git status` a inizio sessione:

```
On branch alfonso-frontend-jjtl
Your branch is ahead of 'origin/alfonso-frontend-jjtl' by 3 commits.

Changes not staged for commit:
	modified:   docs/claude-code-log.md
	modified:   frontend/src/services/export/EcoreService.ts
	modified:   frontend/src/services/export/XMIService.ts
```

Allineato all'atteso post-B.3.1 (più la modifica XMI B.2 pre-esistente su XMIService.ts). Nessun hard-stop su working tree.

---

## 2. CLAUDE.md + log review

- `CLAUDE.md` letto via system context (pattern critici Object Persistence + Custom Events + token system + JjTL/JjEL/JjScript boundaries — non rilevanti per la sessione attuale).
- Ultima entry log `claude-code-log.md:3-8` (2026-05-14, "fix: metamodel lookup fallback on EPackage.name"). **Punto rilevante per D5:** la nota osserva esplicitamente che il getter L-layer di `uri` *"concatena `uri + "." + name`, breaking exact match"*. Conferma indiretta della root cause del bug nsURI, indagata sotto.
- Entry precedente B.3.1 letta (claude-code-log.md:12-17): contesto exporter per reflection types cross-doc — non sovrapposto allo scope di questa discovery (modifica `targetTypePointer`/`crossPackagePointer`, non i flag).

---

## 3. Risposta D1 — D-layer storage audit

Tutte e 3 le classi D-layer di interesse sono dichiarate in **`frontend/src/model/logicWrapper/LModelElement.tsx`** (NON in `joiner/types.ts`). Hierarchy nominale:

- `DStructuralFeature` (line 2059) — abstract, dichiarato come `extends DModelElement` ma commento `// DTypedElement`
- `DAttribute` (line 4090) — `extends DModelElement` con commento `// DStructuralFeature`
- `DReference` (line 3732) — stessa pattern di DAttribute
- `DTypedElement` (line 1182) — abstract parent comune (`ordered`/`unique`/`lowerBound`/`upperBound` qui)

Nota di pattern: i campi sono **duplicati** su DAttribute, DReference, DStructuralFeature, e DTypedElement (per ottenere typing TypeScript stretto, e per fornire default initializer su ciascuna classe concreta). La gerarchia "vera" è composta runtime via `Constructors.DStructuralFeature()` → `Constructors.DAttribute()` o `Constructors.DReference()` (vedi `joiner/classes.ts:704, 746, 754`).

### Tabella D1 — flag su D-layer

| Flag | Campo D-layer | Path:riga | Default value | Tipo TS | Note |
|---|---|---|---|---|---|
| `ordered` | sì | `DAttribute` (4103), `DReference` (3745), `DStructuralFeature` (2073), `DTypedElement` (1198) | `true` | `boolean` | Default match EMF (`true`). |
| `unique` | sì | `DAttribute` (4104), `DReference` (3746), `DStructuralFeature` (2074), `DTypedElement` (1199) | `true` | `boolean` | Default match EMF (`true`). |
| `derived` | sì | `DAttribute` (4115), `DReference` (3761), `DStructuralFeature` (2086) | `!boolean` (undefined inizialmente) | `boolean` | **Gotcha**: non inizializzato. `undefined` è falsy → si comporta come `false`, ma `o.derived === false` ritorna `false`. EMF default è `false`. |
| `transient` | sì | `DAttribute` (4111), `DReference` (3753), `DStructuralFeature` (2083) | `false` | `boolean` | Default match EMF (`false`). |
| `volatile` | sì | `DAttribute` (4110), `DReference` (3752), `DStructuralFeature` (2082) | `false` | `boolean` | Default match EMF (`false`). |
| `changeable` | sì | `DAttribute` (4109), `DReference` (3751), `DStructuralFeature` (2081) | `true` | `boolean` | Default match EMF (`true`). |

**Esito:** tutti i 6 flag esistono sul D-layer con default conformi a EMF (modulo il `derived` undefined). **Nessuna migrazione VersionFixer necessaria** per B.3.2. **Nessuno scope extra blocker** segnalato.

### Flag EMF aggiuntivi già presenti sul D-layer

Scoperti durante l'audit:

- **`unsettable`** — `DAttribute:4112`, `DReference:3754`, `DStructuralFeature:2084` — `boolean = false`. EMF lo supporta come flag standard di `EStructuralFeature`. Default EMF: `false` (match). Già emesso dall'exporter (vedi D4). Candidato naturale da affiancare ai 6 in scope.
- **`defaultValueLiteral`** — `DAttribute:4113`, `DReference:3755` — `string = ''`. EMF lo supporta come stringa. **NON** dichiarato su DStructuralFeature. Importer non lo legge; exporter ha codice commentato (EcoreService.ts:279-281). Si comporta come default `''` ma necessita di logica di pretty-print/serializzazione perché `value === ''` è il sentinel "non impostato".
- **`isID`** — solo su `DAttribute:4130` — `boolean = false`. Commento nel codice: *"exist in ecore as `iD`"*. EMF `iD` flag, sì supportato. Non emesso, non letto.
- **`isIoT`** — `DAttribute:4131` — `boolean = false`. Estensione jjodel-specifica, non EMF.
- **`allowCrossReference`** — su tutte e tre `!boolean` (no default). Estensione jjodel-specifica.
- **`derived_read`** / **`derived_write`** — `string?` su tutte e tre. Estensione jjodel per derived runtime behavior.

**Flag EMF noti NON presenti sul D-layer** (riscontri da grep negativo):

- **`resolveProxies`** (EReference): non trovato. Default EMF `true`. Se serve in B.3.2, richiede campo D-layer nuovo.

**Raccomandazione:** in B.3.2, considerare di estendere lo scope da 6 a 7 flag includendo `unsettable` (presente ovunque, simmetrico). Non includere `defaultValueLiteral` finché non si decide la strategia di emissione (zero-empty-string detection).

---

## 4. Risposta D2 — L-layer getter audit

I getter risiedono in **`LModelElement.tsx`**, organizzati per superclasse:

### Tabella D2 — getter L-layer

| Flag | Getter | Setter | Riga | Classe owner | Inherited da LAttribute/LReference? |
|---|---|---|---|---|---|
| `ordered` | `get_ordered` | `set_ordered` | 1472 / 1476 | `LTypedElement` | sì (via LStructuralFeature → LTypedElement) |
| `unique` | `get_unique` | `set_unique` | 1485 / 1489 | `LTypedElement` | sì |
| `derived` | `get_derived` | `set_derived` | 2226 / 2227 | `LStructuralFeature` | sì |
| `transient` | `get_transient` | `set_transient` | 2206 / 2207 | `LStructuralFeature` | sì |
| `volatile` | `get_volatile` | `set_volatile` | 2196 / 2197 | `LStructuralFeature` | sì |
| `changeable` | `get_changeable` | `set_changeable` | 2186 / 2187 | `LStructuralFeature` | sì |
| `unsettable` | `get_unsettable` | `set_unsettable` | 2216 / 2217 | `LStructuralFeature` | sì |

Verificato che né `LAttribute` (4158+) né `LReference` (3801+) sovrascrivono questi getter. `LValue` ha override di delega tramite `get_fromlfeature` (6921-6935) ma non rilevante per export/import.

Inoltre tutti i flag hanno alias camelCase (es. `get_isOrdered`, `get_isUnique`) a `LStructuralFeature:2165-2184` e `set_isOrdered`, ecc. ai 2176-2184. Pattern in linea con `get_isContainment`/`get_isComposition`.

Tutti i setter chiamano `U.fromBoolString(val)` per normalizzare `'true'`/`'false'`/booleans, e usano `TRANSACTION` standard.

**Esito D2:** zero gap L-layer. Tutti i flag sono leggibili tramite proxy `(lAttr as any).changeable` / `lRef.derived` ecc. e scrivibili in modo identico. L'exporter (D4) usa proprio questo pattern (`attr.changeable`, `attr.derived` ecc.).

---

## 5. Risposta D3 — Importer audit (`frontend/src/api/data.ts`)

Funzioni di parsing:

- `EcoreParser.parseDAttribute` — riga 845-866
- `EcoreParser.parseDReference` — riga 868-886
- `EcoreParser.parseDParameter` — riga 888-906 (riferimento)
- `EcoreParser.parseDOperation` — riga 908-936 (riferimento)

### Tabella D3 — flag letti dall'importer

| Flag | Letto in parseDAttribute? | Letto in parseDReference? | Note |
|---|---|---|---|
| `ordered` | **no** | **no** | + bug constant: `ECoreAttribute.ordered` (data.ts:1342) e `ECoreReference.ordered` (data.ts:1333) sono inizializzati a `'-unique'` invece di `'-ordered'` — copy-paste bug |
| `unique` | **no** | **no** | constant `ECoreAttribute.unique` (1341) e `ECoreReference.unique` (1332) corretti, ma mai consultati dai parser |
| `derived` | **no** | **no** | constant `ECoreAttribute.derived` **non esiste** (riga 1217-1228); idem `ECoreReference.derived` (1202-1215) |
| `transient` | **no** | **no** | constant non esiste |
| `volatile` | **no** | **no** | constant non esiste |
| `changeable` | **no** | **no** | constant non esiste |
| `unsettable` | **no** | **no** | constant non esiste |

**parseDAttribute** legge solo `name`, `lowerBound`, `upperBound`, `eType` (data.ts:851, 862-864).
**parseDReference** legge solo `name`, `containment` → `composition`, `container`, `lowerBound`, `upperBound`, `eType` (data.ts:875, 880-884).

Pattern: nessun guard "default → exx" (a differenza di `parseDClass:744-794` che ha `switch(key) { default: Log.exx }`). Quindi attributi XML sconosciuti vengono silenziosamente ignorati.

### Punto di estensione

In `parseDAttribute`, le righe **862-864** sono il blocco "specific" dove vengono letti gli attributi non comuni. Aggiungere le 6 (o 7 con `unsettable`) letture immediatamente dopo, sul modello di `parseDReference:880-881`:

```typescript
// Esempio pattern (NON applicato):
dObject.ordered = U.fromBoolString(this.read(json, ECoreAttribute.ordered, true), true);
dObject.unique = U.fromBoolString(this.read(json, ECoreAttribute.unique, true), true);
// ... ecc, con default EMF
```

In `parseDReference`, le righe **880-884** sono il blocco analogo. Inserire dopo riga 881 prima della lettura di `lowerBound`.

### Pre-requisito di estensione

I costanti `ECoreAttribute.derived`, `ECoreAttribute.transient`, `ECoreAttribute.volatile`, `ECoreAttribute.changeable`, `ECoreAttribute.unsettable` (e gemelli su `ECoreReference`) **NON esistono**. Andranno:

1. Dichiarate come `static` fields nelle classi `ECoreAttribute` (data.ts:1217-1228) e `ECoreReference` (data.ts:1202-1215).
2. Inizializzate al pattern `XMLinlineMarker + 'derived'` ecc. nel blocco a partire da riga 1325/1336.
3. **Correzione collaterale obbligatoria**: i typo `ECoreReference.ordered = ... 'unique'` (1333) e `ECoreAttribute.ordered = ... 'unique'` (1342). Senza fix, qualsiasi lettura di `ordered` da queste constants leggerà l'attributo XML `unique` per errore.

### Parametri: pattern esistente di riferimento

Per confronto: `parseDParameter:903-904` e `parseDOperation:925-926` **già leggono** `ordered` e `unique`:

```typescript
dObject.ordered = U.fromBoolString(this.read(json, ECoreOperation.ordered, 'false'), false);
dObject.unique = U.fromBoolString(this.read(json, ECoreOperation.unique, 'false'), false);
```

Però usano **default `'false'`** (inconsistente con EMF default `true`). Costanti `ECoreOperation.ordered` (1347) e `ECoreParameter.ordered` (1356) sono corrette. Il parametro/operation lette ma poi mai emesse dall'exporter (vedi D4) — asimmetria pre-esistente. **In scope o no per B.3.2?** Open question per Alfonso (riportata sotto).

**Esito D3:** importer simmetricamente vuoto sui 6 flag in EAttribute/EReference. Nessuna asimmetria interna che possa indicare un parsing parziale. Hard-stop condition "importer ha metà flag ma non gli altri" **non triggata**.

---

## 6. Risposta D4 — Exporter audit (`frontend/src/services/export/EcoreService.ts`)

Funzioni:

- `EcoreService.exportAttribute` — riga 260-291
- `EcoreService.exportReference` — riga 296-329
- `EcoreService.exportOperation` — riga 334-364 (riferimento)
- `EcoreService.exportParameter` — riga 369-382 (riferimento)
- `EcoreService.exportClass` — riga 198-255 (per convenzione `abstract`/`interface`)

### Tabella D4 — flag emessi dall'exporter

| Flag | exportAttribute | exportReference | Convenzione |
|---|---|---|---|
| `ordered` | **no** | **no** | — |
| `unique` | **no** | **no** | — |
| `derived` | sì (riga 284) | **no** | opt-only — emesso solo se `truthy` (default EMF `false`) |
| `transient` | sì (riga 285) | **no** | opt-only |
| `volatile` | sì (riga 286) | **no** | opt-only |
| `unsettable` | sì (riga 287) | **no** | opt-only |
| `changeable` | sì (riga 288) | **no** | opt-only — emesso `="false"` solo se `!truthy` (default EMF `true`) |

### Convenzione attuale (su altri campi)

Verificata pattern "emit only if divergent from EMF default":

- `lowerBound` (riga 271): emesso solo se `!== 0` (default EMF).
- `upperBound` (riga 274): emesso solo se `!== 1` (default EMF).
- `containment` (riga 317): emesso solo se truthy (default EMF `false`).
- `abstract` (riga 209): emesso solo se truthy (default EMF `false`).
- `interface` (riga 214): emesso solo se truthy (default EMF `false`).

**Convenzione coerente** con la decisione architetturale del prompt ("solo divergente dal default EMF"). Esistente già per i flag di exportAttribute e per `containment`/`abstract`/`interface`.

### Asimmetria principale

`exportAttribute` emette 5 flag (con convenzione corretta) ma **non `ordered` e `unique`**.
`exportReference` emette **zero flag** (oltre a `containment` e `eOpposite`).

### Stato di dormienza

Anche se 5 flag sono emessi su attribute, l'effetto attuale è quasi nullo perché l'**importer non scrive** mai questi campi su D-layer (vedi D3). Risultato: tutti i valori restano ai default EMF → exportAttribute non emette mai niente di divergente. La feature flag emission è già pronta a livello di codice exporter, **ma è dormiente** in attesa che l'importer scriva il valore.

### Operation/Parameter

`exportOperation` (334-364) e `exportParameter` (369-382) **non emettono** `ordered`/`unique` neppure (asimmetria inversa: importer legge, exporter no). **Probabilmente in scope di B.3.2 estendere anche qui** se vogliamo round-trip per operation/parameter. Open question per Alfonso.

### Punto di estensione

In `exportAttribute:283` (subito prima di `if (attr.derived)`), aggiungere:

```typescript
// Pattern proposto (NON applicato):
if (!attr.ordered) parts.push(`ordered="false"`);
if (!attr.unique) parts.push(`unique="false"`);
```

In `exportReference:316` (subito prima di `// Containment`), aggiungere il blocco completo con i 5 flag mancanti (replicato da exportAttribute:284-288) più ordered/unique.

**Esito D4:** convenzione "only divergent" è già in vigore in exportAttribute. La differenza richiesta da B.3.2 è (a) aggiungere 2 flag mancanti su exportAttribute, (b) aggiungere 7 flag su exportReference, (c) sbloccare l'importer (D3) perché la feature attualmente dormiente sia visibile a runtime.

---

## 7. Risposta D5 — nsURI suffix `.uml` bug

### Root cause

Il bug è nell'**exporter**, non nell'importer.

**File:** `frontend/src/model/logicWrapper/LModelElement.tsx`, lines **2027-2030**:

```typescript
protected get_uri(context: Context): this["uri"] {
    if (context.data.uri) return context.data.uri + "." + context.data.name;
    return ('org.jjodelreact.') + (context.proxyObject.model?.name || "username") + "." + context.data.name;
}
```

Il getter L-layer di `LPackage.uri` concatena **sempre** `"." + name` al raw uri. Entrambi i branch (con `data.uri` impostato o no) aggiungono il suffisso.

**Call sites che incappano nel bug:** `frontend/src/services/export/EcoreService.ts`:

- **riga 102** (single-package case): `const nsURI = options.nsURI || pkg.uri || \`http://jjodel.org/${metamodel.name}\`;` — `pkg.uri` invoca il getter, restituisce `"http://...UML" + "." + "uml"` = `"http://...UML.uml"`.
- **riga 115** (multi-package case): `const nsURI = pkg.uri || \`http://jjodel.org/${metamodel.name}/${name}\`;` — stesso pattern.
- **riga 410** (subpackage case): `${pkg.uri ? ` nsURI="${this.escapeXml(pkg.uri)}"` : ''}` — 2 occorrenze, stesso getter.

### Importer side: confermato innocente

`EcoreParser.parseDPackage` (data.ts:692-702) scrive raw:

```typescript
dObject.uri = this.read(json, ECorePackage.nsURI, null);  // riga 699
```

Direct field assignment al D-layer (`dObject.uri = ...`), **bypassa il setter L-layer**. Quindi `D.uri = "http://www.eclipse.org/uml2/5.0.0/UML"` byte-equivalente all'XML.

Stesso pattern in `parseDSubPackage:727`.

### Verifica indipendente

La nota nel log entry del 2026-05-14 17:00 ("fix: metamodel lookup fallback on EPackage.name", claude-code-log.md:7) conferma il pattern: il fix di `getMetamodelByNsURI` (XMIService.ts:29) usa `p.__raw?.uri === nsURI` (raw access) proprio per evitare il getter L-layer. Quindi:

- Importer: scrive raw (no bug).
- L-layer getter: concatena `.name` (la "feature" o il "bug" originale, dipende dalla prospettiva).
- Exporter: legge tramite getter (incappa nel concat).
- Lookup runtime (XMIService.ts:29): usa raw (workaround già attivo).

### Fix proposto (1 punto, 3 call site)

In `EcoreService.ts`, sostituire `pkg.uri` con `pkg.__raw.uri` ai 3 callsite (102, 115, 410):

```typescript
// riga 102 — proposed:
const nsURI = options.nsURI || pkg.__raw.uri || `http://jjodel.org/${metamodel.name}`;

// riga 115 — proposed:
const nsURI = pkg.__raw.uri || `http://jjodel.org/${metamodel.name}/${name}`;

// riga 410 — proposed (2 occorrenze nella stessa stringa template):
${pkg.__raw.uri ? ` nsURI="${this.escapeXml(pkg.__raw.uri)}"` : ''}
```

Pattern verificato come idiomatico (XMIService.ts:29 usa `p.__raw?.uri`). Tipo `LPackage.__raw: DPackage` confermato a LModelElement.tsx:1781 (public field).

### Effetto collaterale del fix proposto

Per metamodelli **importati con nsURI dichiarato** (UML2): round-trip esatto → `nsURI="http://www.eclipse.org/uml2/5.0.0/UML"`.

Per metamodelli **senza nsURI dichiarato** (Persons, Families, modelBook, Table — come noto dal log entry 17:00): `D.uri = null` → `pkg.__raw.uri` è falsy → exporter cade su fallback `\`http://jjodel.org/${metamodel.name}\``. **Cambio di comportamento osservabile:** pre-fix il getter sintetizza `"org.jjodelreact.<modelname>.<pkgname>"`; post-fix l'exporter sintetizza `"http://jjodel.org/<modelname>"`. Entrambi sono placeholder, nessuno match il valore semantico mancante. Decisione architetturale.

### Verifica runtime suggerita (Alfonso, post-prompt B.3.2)

1. Pre-fix: esportare UML2.ecore e cercare nel risultato `nsURI=`. **Atteso:** `nsURI="http://www.eclipse.org/uml2/5.0.0/UML.uml"` (suffix `.uml`, bug visibile).
2. Pre-fix: esportare Persons.ecore. **Atteso:** `nsURI="org.jjodelreact.<modelname>.<pkgname>"` (synthetic getter branch, no `.persons` doubling perché D.uri null).
3. Post-fix (proposed): esportare UML2.ecore. **Atteso:** `nsURI="http://www.eclipse.org/uml2/5.0.0/UML"` (byte-equivalente al file originale).
4. Post-fix: esportare Persons.ecore. **Atteso:** `nsURI="http://jjodel.org/<modelname>"` (cambio di placeholder, non bug ma cambio).

### Bug osservato (segnalato, non corretto)

`EcoreParser.parseM2Model` a **data.ts:503** filtra `allpkgs.filter((d) => d.uri === ns)` — `d: LPackage`, quindi invoca il L-layer getter. Quando `ns` (dal default xmlns) è un URI raw e `d.uri` è concatenato con `.name`, il filtro fallisce sistematicamente. Stesso bug strutturale di `getMetamodelByNsURI:29` (già fixato in XMIService.ts). Non in scope di questa discovery, ma utile noting per follow-up.

---

## 8. Open questions per Alfonso (bloccanti B.3.2)

1. **Scope `unsettable`?** È un flag EMF standard, presente sul D-layer (default `false`), già emesso da `exportAttribute:287`. Includerlo nei 6 → 7 flag in import + export per simmetria? Pro: completezza EMF. Contro: scope creep.

2. **Scope `defaultValueLiteral`?** Stringa (non boolean), pattern di "default emission" diverso (zero-empty-string detection). Già su DAttribute/DReference (default `''`). Importer non legge; exporter ha codice commentato (riga 279-281). Include o park per B.3.3?

3. **Scope operation/parameter `ordered`/`unique`?** Importer già li legge (data.ts:903-904, 925-926); exporter NON li emette. Round-trip già rotto su questi due flag. Includere `exportOperation` e `exportParameter` in B.3.2 per simmetria? Costanti `ECoreOperation.ordered/unique` e `ECoreParameter.ordered/unique` sono **corrette** (no typo, a differenza di EAttribute/EReference).

4. **Fix typo `ECoreReference.ordered`/`ECoreAttribute.ordered` = `'-unique'` (data.ts:1333, 1342)**: applicare durante B.3.2 (sembra obbligatorio per leggere il flag correttamente) o tracking separato? Raccomandazione: applicare nello stesso atto, è prerequisito tecnico.

5. **Fix nsURI `.uml` suffix**: applicare durante B.3.2 (è una 1-line modifica × 3 callsite) o tracking separato? Raccomandazione: applicare assieme se Alfonso accetta il cambio di comportamento sul placeholder per metamodelli senza nsURI (open question 5a sotto).

6. **(5a)** Per Persons/Families/modelBook/Table (senza nsURI dichiarato), il fix proposto cambia il placeholder da `"org.jjodelreact.<modelname>.<pkgname>"` (synthetic) a `"http://jjodel.org/<modelname>"` (jjodel fallback). Accettabile o serve preservare il vecchio placeholder?

7. **Default importer EMF-compliant?** `parseDParameter` usa default `'false'` per ordered/unique (data.ts:903-904), ma EMF default è `true`. Allineare a EMF (`true` per ordered/unique) durante B.3.2 o lasciare come è?

8. **Asimmetria L-layer getter `LPackage.uri`**: il fix proposto in D5 lavora solo sull'exporter (changesite ridotto). Un fix architetturale "vero" sarebbe modificare il getter per non concatenare `.name` quando `D.uri` è esplicitamente impostato (cioè importato). Ma il getter ha probabilmente molti altri call site interni jjodel che dipendono dal pattern attuale. **Park.**

---

## 9. Ordine consigliato B.3.2

Per implementazione coordinata import + export (decisione architetturale già presa nel prompt):

1. **Step 0 (prerequisito)**: fix typo costanti `ECoreReference.ordered`/`ECoreAttribute.ordered` a data.ts:1333, 1342 (cambia `'-unique'` → `'-ordered'`). Senza questo, il fix di import è no-op per `ordered`.

2. **Step 1 (D-layer)**: NESSUNA modifica. I 6 flag esistono già. (Eccetto se Alfonso decide di aggiungere `resolveProxies` — out of scope corrente.)

3. **Step 2 (constants extension)**: aggiungere static fields a `ECoreAttribute` (data.ts:1217-1228) e `ECoreReference` (data.ts:1202-1215) per `derived`, `transient`, `volatile`, `changeable`, `unsettable` (se 7 flag). Inizializzare nel blocco data.ts:1325-1342.

4. **Step 3 (importer)**: estendere `parseDAttribute` (data.ts:862-865) e `parseDReference` (data.ts:880-885) con le 6/7 letture, usando `U.fromBoolString` e default **EMF-compliant** (true per ordered/unique/changeable; false per derived/transient/volatile/unsettable).

5. **Step 4 (exporter)**: estendere `exportAttribute` (EcoreService.ts:284-288) con 2 emissioni mancanti (`ordered`, `unique`); estendere `exportReference` (EcoreService.ts:316) con il blocco completo dei 7 emissioni replicato da exportAttribute. Convenzione opt-only invariata.

6. **Step 5 (nsURI fix, opzionale ma raccomandato)**: 3 sostituzioni `pkg.uri` → `pkg.__raw.uri` in EcoreService.ts:102, 115, 410.

7. **Step 6 (operation/parameter export, opzionale)**: estendere `exportOperation` e `exportParameter` con emissioni ordered/unique se Alfonso decide di chiudere la simmetria.

**Verifica post-fix:** runtime export di UML2.ecore. Conteggi attesi (da originale, vedi prompt):
- `ordered="false"` ≈ 1120 (post-fix dovrebbe corrispondere).
- `unique="false"` ≈ 8.
- `derived="true"` ≈ 81.
- `transient="true"` ≈ 84.
- `volatile="true"` ≈ 84.
- `changeable="false"` da verificare.

Diff strutturale vs originale (script lato Alfonso).

---

## 10. Hard checks rispettati

- Zero modifiche a file `frontend/src/`. Tutti i file letti tramite `Read` / `Grep` / `Bash`.
- Nessun fix opportunistico applicato (typo `ECoreReference.ordered`, callsite data.ts:503, getter L-layer, ecc. tutti segnalati ma non corretti).
- Niente runtime test, niente build.
- Niente commit, niente push.
- Output: 2 file markdown (questo + entry log).

**Hard-stop conditions** del prompt non triggerate:
- I 6 flag esistono sul D-layer (no VersionFixer scope extra).
- Importer simmetricamente vuoto (no asimmetria interna).
- `parseDAttribute` e `parseDReference` esistono come funzioni separate (pattern atteso).

Pronto per B.3.2 di implementazione.
