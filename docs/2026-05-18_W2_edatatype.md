# W2 — EDataType end-to-end

**Data**: 2026-05-18
**Tipo**: implementation
**Branch**: `alfonso-frontend-jjtl`
**Esito atteso**: branch verde + nuova fixture EDataType + smoke round-trip 3-scenari + working tree dirty (commit separato)

---

## Contesto

Secondo workstream della completeness Ecore I/O. W1 ha chiuso 10 fix additivi sull'importer/exporter di EClass/EAttribute/EReference/EOperation/EParameter/EEnum (commit `3fc381ad2`).

W2 estende la copertura agli **EDataType user-defined** (es. `DateType instanceClassName="java.util.Date"`), oggi causa di `Log.exx` nei default case di `parsePackageBody` (data.ts:706 e 735).

Discovery di riferimento: `docs/discovery/discovery_2026-05-17_ecore_io_completeness.md` (commit `95496929d`).

Copre **BL2** (EDataType user-defined throws in package non-primitive) e **SI9** (EDataType end-to-end completo).

---

## Scope IN

| Area     | Cosa                                                                                                                                                                                  | Linee stimate |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Importer | `parsePackageBody` default case → riconosce `xsi:type='ecore:EDataType'`, crea `DDataType`, parsa `name` + `instanceClassName` + `serializable` (default `true`)                       | ~20           |
| Exporter | nuovo `exportDataType(ldt)` agganciato al loop `eClassifiers`; emette `name` + `instanceClassName` (truthy) + `serializable` (skip se `true`)                                          | ~18           |
| Fixture  | nuovo `frontend/src/__tests__/fixtures/xmi-m1/DataType_test.ecore` con ≥1 EClass + 2 user-defined EDataType + 2 EAttribute typed sui due EDataType                                     | ~30           |
| Test     | round-trip identità (parse → re-export → diff XML normalizzato) nel suite                                                                                                              | ~30           |
| **Tot**  |                                                                                                                                                                                       | **~98**       |

## Scope OUT (NON toccare)

- `instanceTypeName` → W5 (split EMF 2.x)
- `defaultValueLiteral`, `iD` → W3
- `eAnnotations` sull'EDataType → W4/W8
- `ETypeParameter`/`EGenericType` → W7
- Path legacy `generateEcoreJson_impl` (resta congelato)
- Modifiche a `LModelElement.tsx` (D-layer) — vedi gate G1/G2 sotto

---

## Gate pre-implementation (read-only, riportare in chat PRIMA di scrivere codice)

### Gate G1 — proprietà D-layer

`DDataType` (`LModelElement.tsx:3653+`) espone già `instanceClassName: string` e `serializable: boolean`?

- ✅ Sì → procedere senza touch D-layer.
- ❌ No → **STOP** e riportare. Il fix richiederebbe touch D-layer + VersionFixer e va riposizionato (potenziale rescope di W2).

### Gate G2 — signature factory

`DDataType.new(modelId, parent, name, …)` ha la stessa signature di `DClass.new` / `DEnumerator.new`?

- ✅ Sì → riusare il pattern di `parseDClass` (`data.ts:741+`) come template per `parseDDataType`.
- ❌ No → riportare la signature reale e adattare.

### Gate G3 — struttura loop exporter

`EcoreService.ts` ha un loop unificato su `eClassifiers` (single iterate con dispatch su tipo) o iterazioni separate per Class/Enum?

- **Loop unificato** → aggiungere branch `else if (cls instanceof DDataType)` nel dispatch esistente, **senza imporre un ordine** (EMF standard preserva l'ordine di dichiarazione del package).
- **Iterazioni separate** → aggiungere terzo `forEach` per `DDataType`. **Default = Class → Enum → DataType** (append, non interleave) per preservare byte-identità delle fixture W1 esistenti (Library, Families, Persons). Se G3 rivela ordine diverso già in uso, riportare prima di scrivere.

**Se uno qualsiasi dei 3 gate non passa pulito, STOP prima del primo edit e riportare in chat.**

---

## File coinvolti

### `frontend/src/api/data.ts`

1. **Costanti** in `ECoreDataType` (analogo a `ECoreClass`):
   - `ECoreDataType.name = XMLinlineMarker + 'name'`
   - `ECoreDataType.instanceClassName = XMLinlineMarker + 'instanceClassName'`
   - `ECoreDataType.serializable = XMLinlineMarker + 'serializable'`

2. **Nuovo helper** `parseDDataType(parent, json, generated)` (~15 righe):
   - Read `name` (mandatory; `Log.exx` se mancante)
   - Read `instanceClassName` (opzionale, default `''`)
   - Read `serializable` via `U.fromBoolString(read(..., 'true'), true)` (default `true` EMF)
   - `DDataType.new(...)` + push a `generated`

3. **`parsePackageBody`** (linea 683+): nei default case 706 e 735, aggiungere prima dello `Log.exx`:

   ```typescript
   case 'ecore:EDataType':
       EcoreParser.parseDDataType(dObject, child, generated); break;
   ```

4. **Verifica anti-conflitto con `replacePrimitiveMap`**: il fix DEVE applicarsi solo agli EDataType user-defined (cioè quelli dichiarati in mixed package, NON quelli che esistono in `replacePrimitiveMap`/canonical Ecore). Il check `isPrimitiveOnlyPackage` (`data.ts:1063+`) non deve essere alterato — i primitive package continuano a essere remappati alle canonical.

### `frontend/src/services/export/EcoreService.ts`

1. **Nuovo `exportDataType(ldt: LDataType): string`** modellato sui pattern `exportClass` / `exportEnumerator` di W1 (SI6/SI7):
   - Attributi nell'ordine: `xsi:type="ecore:EDataType" name="…" instanceClassName="…" serializable="false"` (skip default `true`).
   - Self-closing tag (nessun nested).

2. **Wire nel loop di `eClassifiers`** (location dipende da G3, vedi sopra).

3. **Verifica** che user-defined EDataType non vengano emessi due volte (es. anche come riferimento). Solo l'EDataType emette il tag-elemento; gli EAttribute lo referenziano via `eType="#//<name>"`.

### `frontend/src/__tests__/fixtures/xmi-m1/DataType_test.ecore` (NEW)

Fixture con:

- 1 `EPackage`
- 2 user-defined `EDataType`:
  - `Date` con `instanceClassName="java.util.Date"` e default `serializable` (assente o esplicito `true`)
  - `URL` con `instanceClassName="java.net.URL"` e `serializable="false"` esplicito
- 1 `EClass` `Person` con 1 EAttribute `birthDate` di tipo `eType="#//Date"`
- 1 `EClass` `Resource` con 1 EAttribute `homepage` di tipo `eType="#//URL"`

Questo esercita: (a) skip-default path dell'exporter su `Date`, (b) emit-non-default path su `URL`, (c) puntatori `#//<name>` cross-attribute su due EDataType distinti nello stesso package.

---

## Test suite

- Aggiungere test "DataType_test round-trip" nel file di test Ecore I/O esistente (cercare con `grep -rn 'Library.ecore' frontend/src/__tests__`).
- Asserts minimi:
  1. parsed model ha 2 `DDataType` (`Date` + `URL`)
  2. `Date.instanceClassName === 'java.util.Date'`
  3. `Date.serializable === true` (default)
  4. `URL.instanceClassName === 'java.net.URL'`
  5. `URL.serializable === false` (esplicito)
  6. `Person.birthDate.eType` punta a `Date`
  7. `Resource.homepage.eType` punta a `URL`
  8. re-export → XML identico (modulo whitespace) all'input

---

## Smoke (post-implementation, riportare in chat)

1. **Regression W1**: round-trip `Families.ecore` → 8 `eOpposite` ancora preservati.
2. **Regression baseline**: round-trip `Library.ecore` → identità preservata.
3. **W2 target**: round-trip `DataType_test.ecore` → `Date.instanceClassName` + `URL.serializable=false` + entrambi i `eType` pointer preservati.
4. **Build**: `npm run build` verde, baseline tsc error 174 → invariati o lievemente shiftati per nuove righe.

---

## Hard constraints

- Niente touch a D-layer (`LModelElement.tsx`) salvo gate G1/G2 negativo → in tal caso STOP + riportare.
- Niente refactoring opportunistico su `parsePackageBody` o exporter.
- Niente modifica a `replacePrimitiveMap` o a `isPrimitiveOnlyPackage` (canonical EDataType handling resta intatto).
- Niente touch a path legacy `generateEcoreJson_impl`.
- Niente `console.log` di debug residui (rimuovere prima del termine, come W1).
- Niente commit in questo prompt — working tree resta dirty, commit gestito separatamente come per W1.
- Salvare questo prompt come `docs/2026-05-18_W2_edatatype.md` in repo (parte della disciplina di tracciamento prompt).

---

## Output atteso al ritorno in chat

1. Risultato dei 3 gate (G1/G2/G3) con citazioni `file:linea`.
2. Diff stat finale (`git diff --stat`).
3. Output dei 3 smoke (Families, Library, DataType_test) — pass/fail con dettaglio in caso di fail.
4. Conteggio tsc error pre/post.
5. Eventuali deviazioni dal prompt + scoperte inattese.

---

## Note operative

- **Aggiornare `docs/claude-code-log.md`** con entry W2 al termine, formato standard:
  ```
  ## 2026-05-18 — feat(ecore-io): W2 EDataType end-to-end
  **Prompt**: implementazione W2 (BL2+SI9) — parseDDataType + exportDataType + fixture DataType_test + round-trip test
  **File toccati**: frontend/src/api/data.ts, frontend/src/services/export/EcoreService.ts, frontend/src/__tests__/fixtures/xmi-m1/DataType_test.ecore, frontend/src/__tests__/<file-test-existing>.ts, docs/2026-05-18_W2_edatatype.md
  **Esito**: ✅ | ⚠️ | ❌
  **Note**: (eventuali deviazioni)
  **Nome del documento prompt**: 2026-05-18_W2_edatatype
  ```

- **Flag retroattivo W1**: il body del commit `95496929d` cita "W1-W4" mentre il discovery enumera W1-W8. Svista tipografica del commit message, non un cambio di piano. History immutabile, da NON correggere. Tracciato in sessione 2026-05-17.
