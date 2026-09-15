# W2 — Fix mapToEcoreType + collision fixture (pre-commit completion)

**Data**: 2026-05-18
**Tipo**: feat completion (chiusura W2 prima del commit)
**Branch**: `alfonso-frontend-jjtl`
**Prerequisiti**: discovery `2026-05-18_W2_discovery_export_etype.md` eseguita (verdict: bug name-based in `mapToEcoreType:701`, fix forma α applicabile)

---

## Contesto

W2 smoke manuale ha rivelato un bug nell'exporter: `mapToEcoreType` matcha gli alias short per **nome stringa** invece che per **identità del pointer**, causando collisione tra user-defined EDataType e canonical primitive quando i nomi coincidono (es. user-defined `Date` → emesso come `EDate` canonical).

Discovery report ha localizzato:

- **File**: `frontend/src/services/export/EcoreService.ts:666-707` (funzione `mapToEcoreType`).
- **Pattern bug**: `if (typeMap[typeName]) return typeMap[typeName]` (riga 701) è name-based.
- **Fix forma α**: aggiungere guard `isCanonical = isString || type.id.startsWith('Pointer_E')` prima del match.
- **Risk surface**: basso. UML2 Types.ecore protetto dal rimapping import-side (canonical IDs sopravvivono).

La fix è inclusa nel commit W2 perché il bug è raggiungibile **solo** se esistono user-defined DDataType — capacità introdotta da W2 stesso.

---

## Hard stop intermedio

Questo prompt esegue:

1. Fix `mapToEcoreType` (2 righe logiche).
2. Estensione `mapToEcoreType` JSDoc per documentare il discriminator.
3. Creazione fixture `DataType_collision_test.ecore`.
4. Estensione test strutturali per la nuova fixture.
5. Build verde.
6. **STOP** — riportare in chat per smoke manuale Alfonso.

Il commit W2 NON è fatto in questo prompt. Verrà eseguito in un prompt separato dopo che Alfonso ha confermato lo smoke.

---

## Task 1 — Fix `mapToEcoreType` in `EcoreService.ts`

### 1.1 Lettura pre-edit

Apri `frontend/src/services/export/EcoreService.ts` linee 666-707. Verifica che la struttura corrisponda al pattern descritto nella discovery (riga 701 con `if (typeMap[typeName])`). Se la struttura è diversa, **STOP** e riporta.

### 1.2 Modifica

Trasforma il body di `mapToEcoreType` come segue. Sostituisci:

```typescript
private static mapToEcoreType(type: any): string {
    if (!type) return 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString';

    const typeName = typeof type === 'string' ? type : (type.name || 'EString');

    const typeMap: Record<string, string> = {
        // ...mappa invariata, lascia esattamente com'è...
    };

    if (typeMap[typeName]) return typeMap[typeName];
    return `#//${typeName}`;
}
```

con:

```typescript
/**
 * Resolve a type reference to its Ecore XML attribute value.
 *
 * Canonical primitives (Pointer_E* convention, e.g. Pointer_ESTRING, Pointer_EDATE)
 * are emitted as full Ecore URIs. User-defined EDataType/EClass with names that
 * collide with canonical short aliases (e.g. 'Date', 'String') are emitted as
 * local references (`#//Name`) to preserve their identity. The `Pointer_E` id
 * prefix is the discriminator: only canonical primitives have it (see
 * selectors.ts:149 for the lookup convention).
 *
 * Plain string inputs (e.g. from JjScript executor) are always treated as
 * canonical, since user-defined references arrive as classifier objects.
 */
private static mapToEcoreType(type: any): string {
    if (!type) return 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString';

    const isString = typeof type === 'string';
    const typeName = isString ? type : (type.name || 'EString');
    const isCanonical = isString || (typeof type.id === 'string' && type.id.startsWith('Pointer_E'));

    const typeMap: Record<string, string> = {
        // ...mappa invariata, lascia esattamente com'è...
    };

    if (isCanonical && typeMap[typeName]) return typeMap[typeName];
    return `#//${typeName}`;
}
```

**Vincoli espliciti**:

- La `typeMap: Record<string, string>` (contenuto, ordine, key/value) **NON va modificata**. Solo wrap della condizione di match.
- La JSDoc è obbligatoria: documenta la convenzione `Pointer_E` per i lettori futuri.
- Nessun rename di variabili esistenti.

### 1.3 Verifica diff

```bash
git diff frontend/src/services/export/EcoreService.ts
```

Deve mostrare: aggiunta della JSDoc (~10 righe commento), aggiunta di `const isString` (1 riga), aggiunta di `const isCanonical` (1 riga), modifica della condizione `if` (1 riga modificata). Niente altro.

Se il diff include modifiche non previste, **STOP** e riporta.

---

## Task 2 — Nuova fixture `DataType_collision_test.ecore`

### 2.1 Creazione file

Crea `frontend/src/__tests__/fixtures/xmi-m1/DataType_collision_test.ecore` con questo contenuto **esatto**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
    xmlns:xmi="http://www.omg.org/XMI"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
    name="collision" nsURI="http://example.org/collision" nsPrefix="collision">
  <eClassifiers xsi:type="ecore:EDataType" name="String"/>
  <eClassifiers xsi:type="ecore:EDataType" name="Date" instanceClassName="java.util.Date"/>
  <eClassifiers xsi:type="ecore:EClass" name="UserDefined">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="customString" eType="#//String"/>
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="customDate" eType="#//Date"/>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="CanonicalRegression">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="age" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt"/>
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="canonicalLabel" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
  </eClassifiers>
</ecore:EPackage>
```

**Vincoli**:

- Encoding: UTF-8, no BOM.
- Line endings: `\n` (LF).
- File deve terminare con newline finale.

### 2.2 Razionale (per la JSDoc del test)

La fixture copre 3 scenari complementari a `DataType_test.ecore`:

1. **Collision String** (user-defined `String`, EClass `UserDefined.customString` punta a `#//String`): post-fix deve preservare `#//String`, non emettere il primitive URI `EString`.
2. **Collision Date** (user-defined `Date` con `instanceClassName="java.util.Date"`, EClass `UserDefined.customDate` punta a `#//Date`): post-fix deve preservare `#//Date`, non `EDate` canonical.
3. **Canonical regression** (EClass `CanonicalRegression` con `age:EInt` e `canonicalLabel:EString`): post-fix deve **preservare** invariato il primitive URI, perché l'importer rimappa `EInt`/`EString` a `Pointer_EINT`/`Pointer_ESTRING` (id canonical), che fa scattare il branch `isCanonical=true`.

---

## Task 3 — Estensione test strutturali

### 3.1 Localizza il file di test esistente

```bash
ls -la frontend/src/services/export/__tests__/
```

Apri `ecore-io.test.ts` (creato in W2). Trova il test esistente "DataType_test round-trip" o equivalente.

### 3.2 Aggiungi un nuovo blocco `describe` o `test` per collision

Aggiungi alla fine del file, prima della chiusura del modulo, un blocco simile al test esistente ma con asserts diversi. Pattern atteso (adatta agli helper esistenti del file):

```typescript
describe('DataType_collision_test.ecore', () => {
  const fixturePath = path.join(__dirname, '../../../__tests__/fixtures/xmi-m1/DataType_collision_test.ecore');
  let fixtureXml: string;

  beforeAll(() => {
    fixtureXml = fs.readFileSync(fixturePath, 'utf-8');
  });

  test('fixture exists and is well-formed XML', () => {
    expect(fixtureXml).toContain('<ecore:EPackage');
    expect(fixtureXml).toContain('name="collision"');
  });

  test('contains 2 user-defined EDataType with collision names', () => {
    expect(fixtureXml).toMatch(/xsi:type="ecore:EDataType"\s+name="String"/);
    expect(fixtureXml).toMatch(/xsi:type="ecore:EDataType"\s+name="Date"/);
  });

  test('contains EAttribute with local reference to user-defined String', () => {
    expect(fixtureXml).toMatch(/name="customString"\s+eType="#\/\/String"/);
  });

  test('contains EAttribute with local reference to user-defined Date', () => {
    expect(fixtureXml).toMatch(/name="customDate"\s+eType="#\/\/Date"/);
  });

  test('contains EAttribute with canonical EInt URI (regression)', () => {
    expect(fixtureXml).toMatch(/name="age"\s+eType="ecore:EDataType\s+http:\/\/www\.eclipse\.org\/emf\/2002\/Ecore#\/\/EInt"/);
  });

  test('contains EAttribute with canonical EString URI (regression)', () => {
    expect(fixtureXml).toMatch(/name="canonicalLabel"\s+eType="ecore:EDataType\s+http:\/\/www\.eclipse\.org\/emf\/2002\/Ecore#\/\/EString"/);
  });
});

describe('mapToEcoreType canonical guard (W2 collision fix)', () => {
  test('EcoreService.ts mapToEcoreType has isCanonical guard', () => {
    const filePath = path.join(__dirname, '../EcoreService.ts');
    const src = fs.readFileSync(filePath, 'utf-8');
    expect(src).toContain('isCanonical');
    expect(src).toMatch(/type\.id\.startsWith\(['"]Pointer_E['"]\)/);
  });

  test('EcoreService.ts mapToEcoreType retains plain-string canonical path', () => {
    const filePath = path.join(__dirname, '../EcoreService.ts');
    const src = fs.readFileSync(filePath, 'utf-8');
    expect(src).toMatch(/const\s+isString\s*=\s*typeof\s+type\s*===\s*['"]string['"]/);
  });
});
```

**Vincoli**:

- Se il file esistente usa pattern di import o struttura diversa (es. `import fs from 'fs'` vs `const fs = require('fs')`), **adattati al pattern locale**, non importare nuove dipendenze.
- Se il file usa già `describe` block per la prima fixture, segui lo stesso stile.
- Niente refactoring del test esistente.

### 3.3 Verifica conteggio test

Atteso: ~6 nuovi test in `describe('DataType_collision_test.ecore', ...)` + 2 in `describe('mapToEcoreType canonical guard', ...)` = ~8 test nuovi.

Lancia:

```bash
npx vitest run frontend/src/services/export/__tests__/ecore-io.test.ts
```

Risultato atteso: **31/31 pass** (23 esistenti + 8 nuovi). Se conteggio diverso o fail, riporta.

---

## Task 4 — Build verification

```bash
npm run build
```

Deve restare verde. Se fallisce, riportare l'errore esatto.

---

## Task 5 — Hard stop, NO commit

**Non eseguire `git add` o `git commit` in questo prompt.**

Il commit W2 unificato (incluso questa fix) verrà eseguito da un prompt successivo `2026-05-18_W2_commit.md` dopo lo smoke manuale di Alfonso.

---

## Output atteso al ritorno in chat

1. `git diff --stat` finale (atteso: ~5 file modified/new rispetto a HEAD).
2. Diff specifico di `mapToEcoreType`:
   ```bash
   git diff frontend/src/services/export/EcoreService.ts | grep -A2 -B2 'isCanonical'
   ```
3. Esito `npm run build` (verde / errore).
4. Esito `vitest run` (X/Y pass).
5. **Conferma esplicita che NON è stato fatto commit.**
6. Lista file untracked che ora include `DataType_collision_test.ecore`.

---

## Hard constraints

- **Zero refactoring opportunistico** in `EcoreService.ts` o nei test esistenti.
- **Zero modifica della `typeMap`** all'interno di `mapToEcoreType`.
- **Zero rename** di funzioni, variabili, parametri esistenti.
- **Zero touch** ad altri file oltre a quelli elencati nei task 1-3.
- **Zero commit** in questo prompt.
- Aggiornare `docs/claude-code-log.md` con entry per questo prompt al termine.

---

## Note operative

- Smoke manuale Alfonso (post questo prompt) coprirà:
  - Re-import `DataType_test.ecore` → re-export → diff vuoto atteso.
  - Import `DataType_collision_test.ecore` → 4 console check su `customString.type`, `customDate.type`, `age.type`, `canonicalLabel.type` → re-export → diff vuoto atteso.

- Se lo smoke manuale fallisce ancora, ridiscussione architetturale in chat prima di iterare.
