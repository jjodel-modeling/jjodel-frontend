# Discovery — Exporter eType resolution bug (W2 follow-up)

**Data**: 2026-05-18
**Tipo**: discovery (read-only)
**Branch**: `alfonso-frontend-jjtl`
**Esito atteso**: report 1-pager con punto esatto del bug + proposta di fix minimal (NO code edit in questa fase)

---

## Contesto

W2 smoke manuale ha rivelato un bug nell'exporter Ecore. Diagnosi empirica già fatta in chat con Alfonso:

**Stato D-layer (corretto)**:
- `birthDate.type → USER_191` (user-defined `DDataType Date`)
- `homepage.type → USER_192` (user-defined `DDataType URL`)
- L'importer risolve correttamente `eType="#//Date"` come user-defined nello stesso package.

**Stato re-export (bug)**:

Fixture originale (`DataType_test.ecore`, riga 10):
```xml
<eStructuralFeatures xsi:type="ecore:EAttribute" name="birthDate" eType="#//Date"/>
```

Re-export Jjodel:
```xml
<eStructuralFeatures xsi:type="ecore:EAttribute" name="birthDate" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDate"/>
```

**Per `Resource.homepage` (eType=URL) il re-export è corretto** — `URL` non collide con nessun primitive canonical.

**Ipotesi**: l'exporter, quando emette `eType` su un EAttribute, risolve il tipo per **nome stringa** invece che per **identità del pointer**. Per `Date` user-defined collide con l'alias inverso del primitive `EDate` (canonical map: `EDate ↔ Date`?), quindi emette l'URI del primitive invece del local pointer `#//Date`.

`URL` non ha alias → emit corretto.

---

## Obiettivi della discovery

1. Localizzare la funzione/branch dell'exporter che decide come emettere il valore di `eType` per un EAttribute.
2. Identificare il pattern di matching (name-based vs identity-based vs map lookup).
3. Determinare se esiste una `replacePrimitiveMap` reverse o canonical alias map nell'exporter (analoga a `EDATATYPE_CANONICAL_ALIASES` dell'importer).
4. Proporre un fix minimal che **distingua** user-defined EDataType dai primitive canonical, **senza rompere** il pattern primitive (es. UML2 che importa `Types.ecore` deve continuare a esportare `EString` come `http://...#//EString`).
5. **NON** scrivere codice. Solo report.

---

## Task

### 1. Localizzare l'emit di `eType`

```bash
grep -n 'eType' frontend/src/services/export/EcoreService.ts | head -40
```

Identificare:
- La funzione `exportAttribute` (o `exportEStructuralFeature` o equivalente).
- Tutte le occorrenze dove `eType=` viene stampato in stringa XML.
- La logica che decide tra:
  - `eType="#//<localName>"` (local reference, intra-package)
  - `eType="ecore:EDataType http://...#//E<Name>"` (URI primitive)
  - `eType="#//<otherPkg>/<localName>"` (cross-package, gestito da `crossPackagePointer`)

### 2. Funzione di risoluzione del type pointer

Cercare la funzione (probabilmente helper) che dato un `DClass` o `DDataType` ritorna la stringa da emettere:

```bash
grep -n -E '(getECoreTypeReference|resolveTypeReference|typeRefString|getTypeRef|typeToString)' frontend/src/services/export/EcoreService.ts
```

Oppure ispezionare manualmente il body di `exportAttribute` (e `exportReference`) per la branch su `eType`.

### 3. Identità vs nome — verifica del check

Una volta trovata la branch decisionale, verificare se il check è:

- **name-based** (`type.name === 'Date'`, `if (PRIMITIVES.includes(type.name))`, ecc.) → **bug confermato**: collide con user-defined dello stesso nome.
- **id-based** (`type.id.startsWith('Pointer_E')`, `type.id === 'Pointer_EDATE'`, ecc.) → **bug altrove**: forse l'alias map ha `Date → EDate` reverse.
- **flag-based** (`type.isPrimitive`, `type.__raw.isCanonical`, ecc.) → verificare se il flag è settato correttamente in import.

### 4. Mappa alias inverse

Cercare una map analoga a `EDATATYPE_CANONICAL_ALIASES` (dell'importer in `data.ts`) nel codice dell'exporter o in un file shared:

```bash
grep -rn -E '(CANONICAL|ALIAS|PRIMITIVE|replacePrimitiveMap)' frontend/src/services/export/ frontend/src/api/data.ts | head -30
```

Verificare se la mappa è uni-direzionale (import only) o bi-direzionale (anche export). Se l'export riusa una mappa **reverse** o costruita dall'inverso di quella import, è probabile che il bug sia lì.

### 5. Confronto con `EcoreService.ts:171` e `EcoreService.ts:515`

Dalla diagnostica precedente, l'exporter accede a `pkg.datatypes` in due punti (riga 171 e 515). Verificare se in quei punti il loop emette gli user-defined come `<eClassifiers xsi:type="ecore:EDataType" ...>` (questo già funziona, lo smoke lo conferma). Il bug è altrove, nell'emit di `eType` su feature, NON nell'emit dei classifier stessi.

### 6. Verdetto + proposta fix minimal

Proporre un fix concreto, con dimensione attesa (1 riga? 5 righe? coinvolge una funzione separata?). Tre forme tipiche:

**Forma α (1 riga)**: cambiare il check da name a id. Esempio:
```typescript
// Prima
if (PRIMITIVE_NAMES.includes(type.name)) emitURI(type);
// Dopo
if (type.id?.startsWith('Pointer_E') && PRIMITIVE_NAMES.includes(type.name)) emitURI(type);
```

**Forma β (3-5 righe)**: introdurre helper `isCanonicalPrimitive(type)` che combina id-check + name-check:
```typescript
function isCanonicalPrimitive(type: DClassifier): boolean {
  return type.id?.startsWith('Pointer_E') && CANONICAL_PRIMITIVE_NAMES.has(type.name);
}
```

**Forma γ (invasivo)**: refactor della catena di risoluzione `eType`. Solo se α/β non applicabili.

---

## Output atteso al ritorno in chat

1. **File + linea exatta** della branch decisionale `eType` per `exportAttribute`.
2. **Pattern di matching attuale**: name / id / flag, con snippet.
3. **Esistenza di alias map reverse** (sì/no, file + linea se sì).
4. **Verdetto bug**: confermata l'ipotesi name-based collision? O qualcos'altro?
5. **Forma di fix proposta**: α / β / γ con snippet completo da applicare.
6. **Risk surface**: cosa potrebbe rompersi con la fix? (regression su UML2 Types.ecore? su Library.ecore? altri metamodelli che hanno classi con nome `Date`/`String`/`Integer`?)
7. **Test additionale necessario**: serve estendere DataType_test.ecore? Aggiungere una fixture col nome `String` user-defined? Una EClass con eType primitive canonical (es. `EString`) per regression?

---

## Hard constraints

- **Zero edit a codice source.** Solo grep, view, e raccomandazione.
- **Zero touch a working tree W2 esistente** (non chiudere il dev server di Alfonso, non toccare file dirty).
- Tempo target: 10-15 minuti.
- Se la discovery rivela un fix > 10 righe o > 1 file, proporre comunque il fix ma flaggarlo come **invasivo** → potrebbe diventare W2.5 separato post-commit-W2.

---

## Note operative

- Il bug si manifesta solo per **EDataType user-defined il cui nome collide con un primitive canonical** (Date, String, Integer, Boolean, Double, Float, Real — ricontrolla la lista completa).
- Per scoprire la lista completa dei nomi colliding, ispezionare la canonical map dell'importer (`EDATATYPE_CANONICAL_ALIASES` in `data.ts`).
- Probabile fonte del bug: una mappa simmetrica che mappa nomi short ↔ canonical, riusata anche in export senza distinguere identità.
