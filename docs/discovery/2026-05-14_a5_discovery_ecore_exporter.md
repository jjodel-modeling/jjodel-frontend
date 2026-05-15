# Discovery — Ecore Exporter Fase A.5 (read-only, mirata)

**Date:** 2026-05-14
**Branch:** `alfonso-frontend-jjtl`
**Scope:** read-only. Nessun file `frontend/src/` modificato.

---

## 1. Working tree status

```
On branch alfonso-frontend-jjtl
Your branch is ahead of 'origin/alfonso-frontend-jjtl' by 1 commit.
Changes not staged for commit:
  modified:   docs/claude-code-log.md
  modified:   frontend/src/components/project/ProjectEditor.tsx
  modified:   frontend/src/services/export/XMIService.ts
Untracked files:
  docs/discovery/2026-05-14_discovery_ecore_exporter.md
  docs/discovery/discovery_2026-05-14_xmi_m1_importer.md
  frontend/src/__tests__/
```

**Stato divergente da quanto atteso:** `frontend/src/components/project/ProjectEditor.tsx` e `frontend/src/services/export/XMIService.ts` sono modificati, e `frontend/src/__tests__/` è untracked. Questi cambiamenti provengono dalla sessione XMI M1 importer Phase B.1 (log entry: `## 2026-05-14 — feat: XMI M1 importer Phase B.1 (flat instances + attributes)`). **Per questa sessione Fase A.5 sono read-only — i file modificati vengono solo letti, non toccati.**

Le righe in `ProjectEditor.tsx` riportate dalla Fase A si sono shiftate per via dei nuovi handler XMI: `handleExportEcore` ora a 725 (era 706), import dropdown a 2050 (era 1985), bottone "Export Ecore (.ecore)" del context menu a 2151 (era 2086).

---

## 2. CLAUDE.md + log review

- `CLAUDE.md` letto (presente in conversazione).
- `docs/claude-code-log.md` letto, ultime 5 entry: (1) XMI M1 Phase B.1 implementazione, (2) Ecore exporter Fase A discovery, (3) XMI M1 importer discovery, (4) Bug H fix, (5) Bug H discovery. Continuità con Fase A confermata.

---

## 3. Risposta D1 — composition vs containment

### 3.1 Tabella comparativa

| Aspetto | `composition` | `containment` |
|---|---|---|
| **Definizione D-layer (storage)** | `DReference.composition: boolean = false;` a `LModelElement.tsx:3767` | **Nessuna.** Non esiste come campo D-layer. |
| **Definizione L-layer (declaration)** | `LReference.composition!: boolean;` a `LModelElement.tsx:3869` con commento `// aggregation \|\| containment` | `LReference.containment!: boolean;` a `LModelElement.tsx:3872` |
| **Getter L-layer** | `get_composition(context): { return context.data.composition; }` a `LModelElement.tsx:4024` — passthrough diretto al D-layer | `get_containment(context): { return context.data.composition \|\| context.data.aggregation; }` a `LModelElement.tsx:3964` — **DERIVATO** |
| **Setter L-layer** | `set_composition` (definito in `LStructuralFeature` superclass) — scrive direttamente `c.data.composition` | `set_containment(val, c, mainkey='composition', altkey='aggregation')` a `LModelElement.tsx:3965-4022` — di default scrive `c.data.composition` |
| **Default value** | `false` (D-layer default a riga 3767) | Derivato: `composition \|\| aggregation` — `false \|\| false === false` |
| **Call site di scrittura** | `data.ts:880` (importer), `useClassRemoval.ts:168` (canvas), `canvasToJjom.ts:691,695` (canvas), `classes.ts:749` (Constructor), `LModelElement.tsx:3928` (duplicate). **Totale: 5 siti scrivono `composition`** | `JjodieActionExecutor.ts:286,487` (jjodie actions) scrivono `(ref as any).containment = ...` via L-proxy — il setter ridireziona a `composition`. **Totale: 2 siti scrivono `containment` (e finiscono in `composition` via setter ridirezione)** |
| **Importer Ecore `parseDReference`** | `data.ts:880`: `dObject.composition = U.fromBoolString(this.read(json, ECoreReference.containment, false), false);` — legge XMI key `-containment`, scrive D-layer `composition`. **Conferma: `composition` è la verità storage.** | Non scritto direttamente dall'importer. |
| **`EcoreService.exportToXML` legge** | Sì — `ref.composition` a `EcoreService.ts:252`: `if (ref.composition \|\| ref.containment) parts.push(\`containment="true"\`);` | Sì — `ref.containment` nella stessa riga 252 (operatore `\|\|`). **Letto entrambi per safety**, ma dato il getter derivato, `composition` è già sottoinsieme di `containment` ⇒ il secondo termine è ridondante. |
| **`generateEcoreJson_impl` (LReference, path non-canonical)** | Sì — `LModelElement.tsx:3907`: `let cont = d.aggregation \|\| d.composition;` legge D-layer. Coerente. | Non letto direttamente. |

### 3.2 Conferme di consistenza dal codice

**`VersionFixer.tsx:424`** — migrazione legacy:
```typescript
for (let c of (s.references).map(p=> this.d(p, s))) {
    if (c.composition === undefined) c.aggregation = !(c.composition = !!(c as any).containment);
}
```
Storicamente esisteva un campo D-layer `containment`. Il VersionFixer lo migra a `composition`. **Conferma: il legacy è stato deprecato a favore di `composition`.**

**`Info.tsx:656`** (UI properties panel):
```typescript
isComposition = (feature as LReference)?.composition === true;
```
Anche la UI canonical legge `.composition`.

### 3.3 Raccomandazione canonical per Fase B

**Leggere `d.composition` (D-layer), scrivere XMI key `containment="true"`.**

Motivazione (4 righe):
- (a) **Coerenza con l'importer:** `parseDReference:880` scrive XMI `-containment` → D-layer `composition`. Per round-trip simmetrico, l'exporter deve fare l'inverso: leggere D-layer `composition` → emettere XMI `containment="true"`.
- (b) **Call site minimi:** `composition` è la sola storage; tutte le scritture finiscono lì (anche via setter `set_containment` che ridireziona). Leggere il source-of-truth invece del derivato è più robusto.
- (c) **Chiarezza semantica:** la convenzione D-layer è "`composition` = whole-part stretto; `aggregation` = whole-part lasco; `containment` = uno dei due (derivato L-only)". Per l'export Ecore standard `containment="true"` significa whole-part. Mapping più stretto: `containment_attr_value = composition`.
- (d) **`aggregation` come fallback opzionale:** se il modello ha `aggregation=true` ma `composition=false` (caso UML, fuori Ecore standard), l'exporter potrebbe emettere `containment="true"` per non perdere semantica al round-trip via Ecore (decisione architetturale: trade-off semantico, da confermare). `EcoreService.exportToXML:252` oggi usa `ref.composition || ref.containment` — il secondo termine è ridondante (vedi §3.1); la forma più pulita è `ref.composition` o `ref.composition || ref.aggregation`.

**Cleanup suggerito per sessione futura (NON in questa):** in `EcoreService.exportToXML:252` sostituire `ref.composition || ref.containment` con `ref.composition` (o `ref.composition || ref.aggregation`). Il termine `ref.containment` è derivato da entrambi, quindi `composition || containment === composition || (composition || aggregation) === composition || aggregation`. Semplificazione algebrica safe.

---

## 4. Risposta D2 — Gap analysis `EcoreService.exportToXML` vs Tier B

### 4.1 Tabella per costrutto

#### Costrutto 1 — Root single-package

**Stato:** ✅ gestito.

Path: `EcoreService.ts:64-111`.

```typescript
// EcoreService.ts:64-87
static exportToXML(metamodel: LModel, options: EcoreExportOptions = {}): string {
    const pkg = metamodel.packages[0]; // Root package
    if (!pkg) throw new Error('Metamodel has no packages to export');
    const nsURI = options.nsURI || pkg.uri || `http://jjodel.org/${metamodel.name}`;
    const nsPrefix = options.nsPrefix || pkg.prefix || metamodel.name.toLowerCase();
    ...
    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlParts.push(`<ecore:EPackage xmi:version="2.0"`);
    xmlParts.push(`${indent}xmlns:xmi="http://www.omg.org/XMI"`);
    xmlParts.push(`${indent}xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
    xmlParts.push(`${indent}xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"`);
    xmlParts.push(`${indent}name="${this.escapeXml(pkg.name || metamodel.name)}"`);
    xmlParts.push(`${indent}nsURI="${this.escapeXml(nsURI)}"`);
    xmlParts.push(`${indent}nsPrefix="${this.escapeXml(nsPrefix)}">`);
```

**Forma XML emessa:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
  xmlns:xmi="http://www.omg.org/XMI"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
  name="Persons"
  nsURI="http://example.org/persons"
  nsPrefix="persons">
```

**Gap vs EMF:** nessuno. Forma standard.

#### Costrutto 2 — Multi-package wrapped `<xmi:XMI>`

**Stato:** ❌ **non gestito.**

Verifica: a `EcoreService.ts:65`, `const pkg = metamodel.packages[0]` prende solo il primo pacchetto. **Nessun branch** ispeziona `metamodel.packages.length > 1`. I package successivi al primo vengono silenziosamente scartati.

**Forma XML attesa per N>1 (NON prodotta oggi):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore">
  <ecore:EPackage name="Persons" nsURI="..." nsPrefix="...">...</ecore:EPackage>
  <ecore:EPackage name="Pets"    nsURI="..." nsPrefix="...">...</ecore:EPackage>
</xmi:XMI>
```

**Gap vs EMF:** completo. Decisione architetturale #2 chiede auto-detection.

#### Costrutto 3 — EClass

**Stato:** ✅ gestito (con limitazione cross-package).

Path: `EcoreService.ts:133-190`.

```typescript
// EcoreService.ts:138-158
const classAttrs: string[] = [
    `xsi:type="ecore:EClass"`,
    `name="${this.escapeXml(cls.name)}"`,
];
if (cls.abstract) classAttrs.push(`abstract="true"`);
if (cls.interface) classAttrs.push(`interface="true"`);
const superTypes = cls.extends || [];
if (superTypes.length > 0) {
    const superRefs = superTypes.map(st => `#//${st.name}`).join(' ');
    classAttrs.push(`eSuperTypes="${superRefs}"`);
}
```

**Forma XML emessa per `Family extends NamedEntity`:**
```xml
<eClassifiers xsi:type="ecore:EClass" name="Family" eSuperTypes="#//NamedEntity">...
```

**Gap:**
- ⚠️ `eSuperTypes` usa SOLO la forma in-document `#//ClassName`. Se la superclasse è in **un altro pacchetto** del metamodello (caso Families.ecore con classi distribuite), produce un pointer broken. EMF standard userebbe `/0/ClassName` o `/1/ClassName` (multi-package XPath) o `MyPkgURI#//ClassName` (cross-doc URI). Da fixare insieme al multi-package.
- ⚠️ `eSuperTypes` NON usa la forma cross-doc per classi Ecore native (es. `EObject`). Caso raro ma possibile.

#### Costrutto 4 — EAttribute

**Stato:** ✅ gestito (per primitive standard; eType cross-doc corretto).

Path: `EcoreService.ts:195-226`.

```typescript
// EcoreService.ts:196-211
const parts: string[] = [
    `xsi:type="ecore:EAttribute"`,
    `name="${this.escapeXml(attr.name)}"`,
];
const ecoreType = this.mapToEcoreType(attr.type);
parts.push(`eType="${ecoreType}"`);
if (attr.lowerBound !== undefined && attr.lowerBound !== 0) parts.push(`lowerBound="${attr.lowerBound}"`);
if (attr.upperBound !== undefined && attr.upperBound !== 1) parts.push(`upperBound="${attr.upperBound}"`);
```

`mapToEcoreType` (riga 503-544):
```typescript
const typeMap: Record<string, string> = {
    'String': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
    'EString': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
    'Integer': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt',
    'EInt': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt',
    'Boolean': 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean',
    // ... 26 chiavi totali per 10 primitive
};
if (typeMap[typeName]) return typeMap[typeName];
return `#//${typeName}`;  // fallback per type-reference utente
```

**Forma XML emessa per `Person.fullName: EString`:**
```xml
<eStructuralFeatures xsi:type="ecore:EAttribute" name="fullName"
  eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
```

**Gap vs EMF:**
- ✅ Forma cross-doc primitive corretta (decisione architetturale #4 rispettata).
- ⚠️ Lookup hardcoded a 26 entries. Mancano primitive Ecore meno comuni come `EBigDecimal`, `EBigInteger`, `EJavaClass`, `EJavaObject`. Non in scope MVP — solo Persons + Families usano EString/EInt/EBoolean.
- ⚠️ Type **EDataType utente** (non-enum, definito dall'utente): fallback line 543 `#//${typeName}` — produce ref in-package. Se l'EDataType è in un sub-package o in un altro pacchetto, broken. Vedi §4 Costrutto 7.
- ⚠️ `attr.upperBound !== 1` salta upperBound=-1 (unbounded), `attr.upperBound !== 0` MA serve emettere `upperBound="-1"` per `[0..*]` ammissibili. Verificare: `(attr.upperBound !== undefined && attr.upperBound !== 1)` — `-1 !== 1` è true, quindi `upperBound="-1"` viene emesso. ✅ OK.

#### Costrutto 5 — EReference

**Stato:** ⚠️ parziale — `containment` ok; `eOpposite` formato presente ma con limitazioni.

Path: `EcoreService.ts:231-263`.

```typescript
// EcoreService.ts:232-260
const parts: string[] = [
    `xsi:type="ecore:EReference"`,
    `name="${this.escapeXml(ref.name)}"`,
];
const targetType = ref.type;
if (targetType) parts.push(`eType="#//${this.escapeXml(targetType.name)}"`);
if (ref.lowerBound !== undefined) parts.push(`lowerBound="${ref.lowerBound}"`);
if (ref.upperBound !== undefined && ref.upperBound !== 1) parts.push(`upperBound="${ref.upperBound}"`);
// Containment (composition)
if (ref.composition || ref.containment) parts.push(`containment="true"`);
// Opposite reference
const opposite = ref.opposite;
if (opposite && targetType) {
    parts.push(`eOpposite="#//${targetType.name}/${opposite.name}"`);
}
```

**Forma XML emessa per `Family.father: Member [containment, eOpposite=familyFather]`:**
```xml
<eStructuralFeatures xsi:type="ecore:EReference" name="father"
  eType="#//Member" lowerBound="1" containment="true"
  eOpposite="#//Member/familyFather"/>
```

**Gap vs EMF:**
- ✅ `containment="true"` emesso quando `composition` o `aggregation` veri (via getter `containment` derivato, vedi D1).
- ⚠️ `eOpposite="#//${targetType.name}/${opposite.name}"`: forma in-document a 2 segmenti. EMF accetta `/N/X/Y` (3-segment XPath multi-package) e `#//X/Y` (single-package). **Limitazione cross-package** identica a `eSuperTypes`.
- ⚠️ **Asimmetria con importer:** dal Fase A è emerso che `parseDReference:868-886` legge `containment`, `container`, `lowerBound`, `upperBound`, `eType` **ma NON `eOpposite`**. **Quindi anche se l'exporter emette eOpposite correttamente, il round-trip Families.ecore → import → export NON preserva l'opposite** perché l'importer non lo legge mai (`DReference.opposite` resta `undefined` post-import). Questo è un gap dell'**importer**, non dell'exporter, ma blocca il roundtrip.
- ⚠️ `ref.lowerBound !== undefined` (line 244): manca check `!== 0`, quindi `lowerBound="0"` viene emesso. EMF accetta omissione `lowerBound="0"` (default 0). Cosmetico, non bloccante.

#### Costrutto 6 — EEnum

**Stato:** ✅ gestito.

Path: `EcoreService.ts:321-335`.

```typescript
// EcoreService.ts:321-334
parts.push(`${indent}<eClassifiers xsi:type="ecore:EEnum" name="${this.escapeXml(enumType.name)}">`);
const literals = enumType.literals || [];
literals.forEach((literal, index) => {
    const ordinal = literal.ordinal !== undefined ? literal.ordinal : index;
    parts.push(`${indent}${indent}<eLiterals name="${this.escapeXml(literal.literal)}" value="${ordinal}"/>`);
});
parts.push(`${indent}</eClassifiers>`);
```

**Forma XML emessa per `Color { RED=0, GREEN=1, BLUE=2 }`:**
```xml
<eClassifiers xsi:type="ecore:EEnum" name="Color">
  <eLiterals name="RED" value="0"/>
  <eLiterals name="GREEN" value="1"/>
  <eLiterals name="BLUE" value="2"/>
</eClassifiers>
```

**Gap:**
- ⚠️ Usa `literal.literal` (proprietà testuale L-layer) come `name` XML. Verificare che corrisponda al nome user-facing dell'enum literal. Da `LModelElement.tsx` cercando `literal!:` — proprietà definita ma semantica da verificare in B.
- ⚠️ `literal.ordinal !== undefined ? literal.ordinal : index`: se l'utente ha definito ordinali non sequenziali (es. RED=0, GREEN=2), li preserva. ✅ Fixed correctly.
- ❌ Non emette `eAnnotations` (literal description). Out-of-scope MVP.

#### Costrutto 7 — EDataType utente (non-enum)

**Stato:** ❌ **non gestito.**

Verifica con grep: `EcoreService.ts` non contiene `exportDataType`, e `exportToXML:96-99` itera solo `pkg.enumerators` non `pkg.dataTypes`. **Inoltre `LPackage` non espone un getter `dataTypes`** — verifica con `grep dataTypes LModelElement.tsx` → zero hit.

DEnumerator estende DDataType (`LModelElement.tsx:4595` `RuntimeAccessibleClass.set_extend(DDataType, DEnumerator)`). Ma le istanze di DDataType "pure" (non-enum) non sono iterabili da `LPackage` con l'API attuale: `pkg.enumerators` ritorna solo DEnumerator subclasses.

**Forma XML attesa (NON prodotta oggi) per `Date_DDataType`:**
```xml
<eClassifiers xsi:type="ecore:EDataType" name="Date" instanceClassName="java.util.Date"/>
```

**Gap vs Tier B:** scope dichiarato include "EDataType definiti dall'utente". Implementazione richiede:
1. Aggiungere getter `dataTypes` a `LPackage` (richiede modifica a `LModelElement.tsx`, **out of A.5 scope; serve sessione separata per il getter L-layer**).
2. Aggiungere metodo `exportDataType` a `EcoreService`.
3. Iterazione in `exportToXML` e `exportSubPackage`.

Se la sessione futura decide che gli EDataType utente sono rarissimi nel use case attuale, scope può scivolare a B.2.

#### Costrutto 8 — Sub-packages (nesting)

**Stato:** ✅ gestito.

Path: `EcoreService.ts:340-364`.

```typescript
// EcoreService.ts:340-362
private static exportSubPackage(pkg: LPackage, indent: string, newline: string, level: number): string {
    const i = indent.repeat(level);
    const parts: string[] = [];
    parts.push(`${i}<eSubpackages name="${this.escapeXml(pkg.name)}"${pkg.uri ? ` nsURI="${this.escapeXml(pkg.uri)}"` : ''}${pkg.prefix ? ` nsPrefix="${this.escapeXml(pkg.prefix)}"` : ''}>`);
    for (const cls of pkg.classes || []) parts.push(this.exportClass(cls, pkg.classes || [], i + indent, newline));
    for (const enumType of pkg.enumerators || []) parts.push(this.exportEnumerator(enumType, i + indent, newline));
    for (const subpkg of pkg.subpackages || []) parts.push(this.exportSubPackage(subpkg, indent, newline, level + 1));
    parts.push(`${i}</eSubpackages>`);
    return parts.join(newline);
}
```

**Forma XML emessa:**
```xml
<eSubpackages name="SubPkg" nsURI="..." nsPrefix="...">
  <eClassifiers .../>
  <eSubpackages name="DeepSub">...</eSubpackages>
</eSubpackages>
```

**Gap:** stessi limiti di `exportClass` e `exportEnumerator` su pointer cross-package.

#### Costrutto 9 — EOperation / EParameter

**Stato:** ✅ gestito (fuori scope MVP Tier B, ma presente).

Path: `EcoreService.ts:268-316`.

```typescript
// EcoreService.ts:271-294
const opAttrs: string[] = [
    `xsi:type="ecore:EOperation"`,
    `name="${this.escapeXml(op.name)}"`,
];
if (returnType) opAttrs.push(`eType="${this.mapToEcoreType(returnType)}"`);
const parameters = op.parameters || [];
if (parameters.length > 0) {
    parts.push(`${indent}<eOperations ${opAttrs.join(' ')}>`);
    for (const param of parameters) parts.push(this.exportParameter(param, indent + '  '));
    parts.push(`${indent}</eOperations>`);
} else {
    parts.push(`${indent}<eOperations ${opAttrs.join(' ')}/>`);
}
```

**Forma XML emessa:** (esempio Persons non ha operations; UML2 sì)
```xml
<eOperations name="greet" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString">
  <eParameters name="prefix" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
</eOperations>
```

**Gap:**
- Non emette `eExceptions` (lista di exception types). Esiste su `DOperation` (vedi data.ts `parseDOperation` ECoreOperation.eexceptions).
- Non emette `body` o `eAnnotations` con implementation code (`thiss.implementation` in `classes.ts:944`). Out-of-scope.

### 4.2 GAP list ordinata per priorità d'intervento

Ordine: minore rischio → maggiore rischio.

1. **GAP-1: Multi-package wrapped XMI** (Costrutto 2)
   - Priorità: 🔴 alta (decisione architetturale #2 esplicita).
   - File: `EcoreService.ts:64-111`.
   - Intervento: aggiungere branch `if (metamodel.packages.length > 1)` che genera root `<xmi:XMI>` con N `<ecore:EPackage>` figli. Estrarre `exportRootPackage(pkg, ...)` come metodo riusabile.
   - Rischio: medio (cambia root del documento; verificare contro Families.ecore già funzionante post-importer fix).

2. **GAP-2: `eOpposite` round-trip preservation** (Costrutto 5)
   - Priorità: 🟡 media (necessaria per acceptance criterion Families.ecore).
   - **NOTA:** gap nell'IMPORTER (`data.ts:parseDReference:868-886` non legge `eOpposite`), NON nell'exporter. L'exporter già emette. **Va fixato l'importer prima di poter testare round-trip.** Tecnicamente fuori dallo scope esporter, ma blocca il test.
   - Rischio: medio (cross-document XPath resolution per il pointer `/N/X/Y`).

3. **GAP-3: Cross-package pointers** (Costrutti 3, 5, 8)
   - Priorità: 🟡 media (richiesta per multi-package Tier B).
   - File: `EcoreService.ts:156` (`eSuperTypes`), `:240` (`eType` reference), `:259` (`eOpposite`).
   - Intervento: introdurre helper `formatCrossPackageRef(target: LClassifier, currentPackage: LPackage)` che decide tra `#//X` (same-package), `/N/X` (cross-package multi), `MyURI#//X` (cross-doc). Logica richiede sapere l'indice del pacchetto target nella lista `metamodel.packages`.
   - Rischio: alto (logica di risoluzione path nontriviale).

4. **GAP-4: EDataType utente** (Costrutto 7)
   - Priorità: 🟢 bassa-media (in scope Tier B ma raro nei sample correnti).
   - **Pre-requisito blocking:** `LPackage.dataTypes` getter non esiste. Richiede modifica a `LModelElement.tsx` per esporre l'iterazione. Scope **out of B.1**, spostabile a B.2.
   - File: `EcoreService.ts` (nuovo `exportDataType`) + `LModelElement.tsx` (nuovo getter).
   - Rischio: medio (nuova surface API L-layer).

5. **GAP-5: Pulizia condition `ref.composition || ref.containment`** (cosmetico)
   - Priorità: 🟢 bassa.
   - File: `EcoreService.ts:252`.
   - Intervento: sostituire con `ref.composition || ref.aggregation` (più espressivo) o `ref.composition` (più stretto). Vedi D1 §3.3.
   - Rischio: basso (algebricamente equivalente).

6. **GAP-6: Primitive lookup hardcoded** (Costrutto 4)
   - Priorità: 🟢 bassa (sample correnti coperti).
   - File: `EcoreService.ts:503-544`.
   - Intervento: refactor verso `Selectors.getPrimitiveType(name, state)` per dinamica. Out-of-MVP.
   - Rischio: basso.

7. **GAP-7: `lowerBound="0"` cosmetico** (Costrutto 5)
   - Priorità: 🟢 bassissima.
   - File: `EcoreService.ts:244`.
   - Intervento: aggiungere `!== 0` al check.
   - Rischio: nullo.

---

## 5. Risposta D3 — branching 0/1/N + UI ancoraggio

### 5.1 `handleExportEcore` corpo e firma attuali

Path: `ProjectEditor.tsx:725-734`.

```typescript
// ProjectEditor.tsx:725-734
// Export metamodel as Ecore (.ecore)
const handleExportEcore = (mm: LModel) => {
    try {
        EcoreService.exportToFile(mm);
        U.alert('i', 'Exported', `Metamodel exported as Ecore: ${mm.name}.ecore`);
    } catch (error) {
        console.error('Export Ecore error:', error);
        U.alert('e', 'Export Failed', 'Could not export as Ecore format.');
    }
    closeMenu();
};
```

**Selezione LModel:** prende `mm: LModel` come **argomento esplicito**. Non c'è lookup da state. Non c'è branching 0/1/N — il chiamante deve passare il metamodello specifico.

**Comportamento per 0 packages:** `EcoreService.exportToFile` → `exportToXML` → `throw new Error('Metamodel has no packages to export')` (riga 67). L'errore bubbla nel `try/catch` e mostra toast generico "Could not export as Ecore format." Non c'è check pre-emptive.

**Comportamento multi-metamodel:** non rilevante — l'handler è invocato per UN metamodello alla volta dal context menu.

### 5.2 Wiring UI attuale: dove "Export Ecore" è renderizzato

**Non è nel dropdown `import-select-menu`.** È nel **context menu del singolo metamodello** in `metamodels.map()`:

```tsx
// ProjectEditor.tsx:2146-2152
<button
    className="context-menu__item"
    onClick={() => handleExportEcore(mm)}
>
    <i className="bi bi-file-earmark-code" />
    Export Ecore (.ecore)
</button>
```

Voce inclusa nel `<div className="context-menu">` aperto cliccando sul bottone three-dots (`<i className="bi bi-three-dots-vertical"/>`) di ciascun list-card item del metamodello.

### 5.3 Struttura dell'`import-select-menu` esistente (per simmetria)

Path: `ProjectEditor.tsx:2026-2066`.

```tsx
// ProjectEditor.tsx:2027-2066
<div className="project-section" id="section-metamodels">
    <SectionHeader
        title="METAMODELS"
        count={metamodels.length}
        primaryAction={{ label: '+ New', onClick: handleCreateMetamodel }}
        secondaryAction={{
            label: 'Import',
            onClick: () => setShowImportMenu(!showImportMenu),
            icon: 'upload',
            hasDropdown: true,
            isDropdownOpen: showImportMenu,
        }}
    >
        <button
            className="btn btn--ghost btn--xs"
            onClick={() => setShowMegamodelModal(true)}
            title="View relationships between project artifacts"
        >
            <i className="bi bi-diagram-3" />
            View Megamodel
        </button>
        {/* Import dropdown menu (rendered inside actions area) */}
        {showImportMenu && (
            <div className="import-select-menu" ref={importMenuRef}>
                <button
                    className="import-select-menu__item"
                    onClick={handleImportJmm}
                >
                    <i className="bi bi-file-earmark" />
                    Import .jmm
                </button>
                <button
                    className="import-select-menu__item"
                    onClick={handleImportEcore}
                >
                    <i className="bi bi-file-earmark-code" />
                    Import Ecore (.ecore)
                </button>
            </div>
        )}
    </SectionHeader>
```

**Struttura HTML:**
- Trigger: `<SectionHeader secondaryAction={{ label: 'Import', icon: 'upload', hasDropdown: true, ...}}>`. Non un `<select>` nativo né un componente di terze parti — è un bottone con stato React (`useState`).
- Container dropdown: `<div className="import-select-menu" ref={importMenuRef}>`.
- Item: `<button className="import-select-menu__item">` con `<i className="bi bi-*"/>` icona + testo.
- Click-outside dismissal: `useEffect` con event listener documentato a riga 296-310 (verificato da `setShowImportMenu(false)`).

**Stato state-level (riga 216 e 220):**
```typescript
const [showImportMenu, setShowImportMenu] = useState(false);          // metamodel section
const [showImportModelMenu, setShowImportModelMenu] = useState(false); // model section
```

**Effetto click-outside (riga 296-310 inferred):**
```typescript
useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
            setShowImportMenu(false);
        }
    };
    if (showImportMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showImportMenu]);
```

### 5.4 Considerazioni per Phase B

**⚠️ Conflict semantico:** l'`import-select-menu` (nome BEM) è semanticamente per **importare**. Aggiungerci "Export Ecore…" sarebbe ambiguo. Pattern alternativi:

(a) **Specchiare `import-select-menu` con un nuovo `export-select-menu`** parallelo. Stesso CSS reusabile come `select-menu` generic, nuovo state `showExportMenu`. Trigger: `secondaryAction={{ label: 'Export', icon: 'download', ...}}`. Più pulito semanticamente.

(b) **Rinominare CSS in `select-menu`** + tenere `import-select-menu` come variant. Più refactor.

(c) **Tenere il context menu per-item** (com'è oggi) e NON aggiungere section-level export. Decisione architetturale #2 dice "Voce 'Export Ecore…' in `import-select-menu`" — segue questo schema.

**Branching 0/1/N section-level (se decisione architetturale prevale):**

- **0 metamodel:** sezione mostra `EmptyState` (`ProjectEditor.tsx:2069-2075`). Nessun bottone Export. (Già coperto dall'EmptyState attuale — basterà aggiungere il check nel container.)
- **1 metamodel:** click "Export Ecore…" → chiama `handleExportEcore(metamodels[0])` direttamente.
- **N>1 metamodel:** click "Export Ecore…" → mostra submenu con elenco ordinato alfabetico dei metamodelli (riusando `[...metamodels].sort((a, b) => a.name.localeCompare(b.name))` come fa Navbar:131-135). Click su voce → `handleExportEcore(mm)`.

**Pattern submenu disponibile:** `Navbar.tsx:304-332` (vedi Fase A Q6).

### 5.5 Già esiste "Export" nel dropdown? NO

Conferma: ricerca `Export.*\.ecore` o `setShowExport` in ProjectEditor.tsx restituisce **solo** la voce nel context menu (riga 2151) e quella nei log di errore (riga 730). Nessun "Export" preexistente nell'`import-select-menu`. La Fase B aggiungerà ex novo, non duplicherà.

---

## 6. Bug latenti aggiuntivi osservati

Nuovi rispetto a quelli già documentati in Fase A (no fix proposti).

1. **`parseDReference` NON legge `eOpposite`.** Importer-side. `data.ts:868-886` legge `containment`, `container`, `lowerBound`, `upperBound`, `type` — manca `eOpposite`. Conseguenza: round-trip Families.ecore perde gli opposite. **Blocca acceptance criterion Tier B.** Fix proposto è scope separato (importer fix), non rientra in Phase B exporter.

2. **`LPackage.dataTypes` getter mancante.** Conseguente: `EcoreService.exportToXML` non può iterare EDataType utente perché l'API L-layer non li espone separatamente da `enumerators`. **Decisione di scope architetturale necessaria** prima di B (vedi GAP-4).

3. **`literal.literal` vs `literal.name`.** `EcoreService.exportEnumerator:329` usa `literal.literal` come name XML. È plausibile che questa sia la proprietà "valore testuale" (es. "RED_VALUE_LITERAL") mentre `literal.name` sarebbe il nome del DEnumLiteral interno. Verificare contro la fixture Persons (se ha enum) per non emettere ricorsivamente sbagliato. Non bloccante per Persons/Families (no enum).

4. **`mapToEcoreType` accetta `type: any`.** Linea 503 firma `(type: any): string`. Se `type === null/undefined` ritorna EString hardcoded (riga 504). Se è un `LClassifier`, usa `.name`. Se è una stringa (raw type name?), la passa a `typeMap`. **Tolleranza eccessiva** che maschera bug — un type undefined dovrebbe segnalare errore, non fallback silenzioso a EString. Logging suggerito ma non critico.

5. **`EcoreExportOptions` parzialmente usato.** L'interfaccia (riga 37-42) ha `includeAnnotations`, `prettyPrint`, `nsURI`, `nsPrefix`. Solo `prettyPrint`, `nsURI`, `nsPrefix` sono usati. `includeAnnotations` è dichiarato ma ignorato. Tech debt.

6. **`escapeXml` non escapa CDATA / commenti.** `EcoreService.ts:549-557` solo `& < > " '`. Se un nome di classe avesse `]]>` (raro ma valido in alcuni nomi UTF-8), produrrebbe XML malformato. Non rilevante per sample correnti.

---

## 7. Suggerimento ordine Fase B

Strategia: **partire dal cambio meno invasivo, fixare blocchi del round-trip, lasciare l'UI per ultima.**

| Step | Intervento | LOC stimati | Rischio | Pre-req |
|---|---|---|---|---|
| **B.1** | GAP-1 multi-package: estrarre `exportRootPackage(pkg, mode='inline'\|'wrapped')` da `exportToXML`, aggiungere branch `<xmi:XMI>` wrapper. Sample test: Families.ecore. | +60 / -20 in `EcoreService.ts:64-111` | Medio | Nessuno |
| **B.2** | GAP-2/3: importer fix per `eOpposite` (`data.ts:parseDReference` aggiungere lettura `eOpposite`). Verificare con Families.ecore round-trip che produca eOpposite identico nel re-export. | +10 in `data.ts:880-885`; +helper resolver per XPath `/N/X/Y` se non già coperto | Medio-alto | B.1 (per testare multi-package) |
| **B.3** | GAP-3 cross-package pointers: introdurre `formatCrossPackageRef(target, currentPkg, allPkgs)`. Sostituire `#//${target.name}` con chiamata helper nei 3 siti (`eSuperTypes`, `eType` reference, `eOpposite`). | +30 nuove righe in `EcoreService.ts`; modifiche puntuali in 3 siti | Alto | B.1, B.2 |
| **B.4** | UI wiring section-level: nuovo state `showExportMenu`, dropdown `export-select-menu` (o `select-menu` generico), branching 0/1/N con submenu pattern Navbar:304-332. Handler `handleExportEcoreAtSection()` (no args) che decide tra direct call o submenu. | +50 in `ProjectEditor.tsx` + nuovo CSS se non riusabile `import-select-menu` come generic | Basso (UI isolata) | B.1-B.3 (per test end-to-end) |
| **B.5 (opzionale)** | GAP-4 EDataType utente: aggiungere `LPackage.dataTypes` getter (modifica `LModelElement.tsx`), aggiungere `EcoreService.exportDataType` + chiamata da `exportToXML`/`exportSubPackage`. | +40 totale tra 2 file | Medio (nuovo getter L-layer) | B.1-B.4 |
| **B.6 (opzionale)** | GAP-5/7: cleanup `composition \|\| containment` → `composition \|\| aggregation`, `lowerBound="0"` skip. | +5 in `EcoreService.ts` | Nullo | — |

**Rationale dell'ordine:**

- **B.1 prima di B.4**: il backend deve produrre XML corretto prima di esporre la UI; altrimenti il bottone genera file rotti.
- **B.2 deve seguire B.1**: testare round-trip richiede multi-package wrap funzionante, perché Families.ecore (l'unico sample con eOpposite) è multi-package.
- **B.3 segue B.2**: il fix cross-package pointers ha senso solo dopo che multi-package + eOpposite siano integrati, perché il pointer cross-package è la ragione dell'esistenza di B.3.
- **B.4 dopo B.3**: la UI non va wirata se il backend non è stabile.
- **B.5 e B.6 sono opzionali**: scope può scivolare. B.5 è gated da decisione architetturale su EDataType utente.

**Acceptance gate B.1:** smoke test manuale di Alfonso su `Persons.ecore` (import → export → diff = trivial whitespace).
**Acceptance gate B.2/B.3:** smoke test manuale su `Families.ecore` (import → export → diff = trivial whitespace, eOpposite preservato in entrambi i lati della relazione bidirezionale).
**Acceptance gate B.4:** click test su 0/1/N metamodel nel project.

---

## 8. Files consultati

| File | Range | Scopo |
|---|---|---|
| `/Users/alfonso/jjodel/CLAUDE.md` | full | Contesto |
| `/Users/alfonso/jjodel/docs/claude-code-log.md` | head 100 | Ultime 5 entry |
| `/Users/alfonso/jjodel/frontend/src/services/export/EcoreService.ts` | 60-365 (export), 461-557 (utilities) | D2 gap analysis |
| `/Users/alfonso/jjodel/frontend/src/model/logicWrapper/LModelElement.tsx` | 3760-3796 (DReference), 3800-3910 (LReference + generateEcoreJson_impl), 3963-4040 (containment getter/setter), 4595 (DDataType ⊃ DEnumerator) | D1 composition/containment + EDataType chain |
| `/Users/alfonso/jjodel/frontend/src/api/data.ts` | 868-886 (parseDReference) | D1 importer behavior |
| `/Users/alfonso/jjodel/frontend/src/components/project/ProjectEditor.tsx` | 720-734 (handleExportEcore), 2026-2066 (SectionHeader + import dropdown), 2130-2178 (context menu), 2183-2210 (Models section import dropdown) | D3 UI anchor |
| `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` | 748-749 (DReference Constructor defaults) | D1 default values |
| `/Users/alfonso/jjodel/frontend/src/redux/VersionFixer.tsx` | 424 (containment→composition migration) | D1 historical migration |

---

**End of A.5 discovery.**
