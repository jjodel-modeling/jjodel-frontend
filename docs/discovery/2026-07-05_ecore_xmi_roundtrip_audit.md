# Audit round-trip Ecore/XMI: import → export → re-import

**Data**: 2026-07-05 (sessione Cowork autonoma, notte)
**Branch**: `alfonso-frontend-jjtl` @ 2d6ade081 + working tree
**Obiettivo**: garantire che `import(export(import(X))) ≡ import(X)` per metamodelli (.ecore) e modelli (.xmi), a meno delle eAnnotation (escluse per decisione).
**Esito**: round-trip M2 e M1 verde su tutte le fixture + UML2 (Eclipse UML.ecore, 243 classi). 10 fix applicati al working tree (RT1–RT10), NIENTE committato: gate visivo e commit spettano ad Alfonso.

---

## 1. Criterio di verifica

Il confronto è tra snapshot semantici D-layer di due import successivi:

```
snap1 = snapshot(import(X))
snap2 = snapshot(import(export(import(X))))
diff(snap1, snap2) deve essere vuoto
```

L'identità è per NOME e struttura, mai per Pointer id (rigenerati a ogni import). Il criterio misura la fedeltà di ciò che Jjodel HA CAPITO del file: ciò che il primo import droppa per scelta o per gap noto (sez. 6) è fuori scope per definizione.

Lo snapshot M2 copre: package (name/uri/prefix/subpackages), classi (abstract, interface, instanceClassName, extends, attributi, reference, operazioni con parametri/eccezioni/bounds/flags), enum (literals con name/value/literal, serializable, instanceClassName), datatype. Lo snapshot M1 copre: albero di containment per radici, valori di attributi (enum → nome literal), reference cross-object come path posizionali.

## 2. Suite headless (nuova)

`frontend/ecore-roundtrip-tests/` — stessa filosofia di `coevolution-tests/` (fuori da `src/`, stub monaco/jquery riusati, config vitest propria):

```
cd frontend && npx vitest run --config ecore-roundtrip-tests/vitest.roundtrip.config.ts
```

- `xml-mini.ts` — mini DOM XML + shim `DOMParser` (nessuna nuova dipendenza): i path di import di PRODUZIONE (`EcoreService.importFromXML`, `XMIService.importM1FromXML`) girano invariati sotto node.
- `snapshot.ts` — snapshot semantici M2/M1 + deepDiff.
- `rt-helpers.ts` — bootstrap (stateInitializer + DUser offline + `DState.init_editor()` per i tipi primitivi, che il boot headless salta) e **compensazione F7** (sez. 3).
- `m2-roundtrip.test.ts` — 5 fixture .ecore + sanity anti-vacuous-green.
- `m2-uml.test.ts` — stress test su UML.ecore (fixture NON committata: `fixtures-local/` è gitignored; scaricarla da eclipse-uml2 per abilitare il test, altrimenti skip).
- `m1-roundtrip.test.ts` — 3 coppie ecore+xmi dalle fixture esistenti.

Risultato: **10/10 verdi** (9 + 1 skip automatico se manca la fixture UML). Ogni test scarica report JSON + file esportato in `/tmp/rt-reports/` per ispezione.

Nota sandbox linux: servono i binari nativi (`@esbuild/linux-arm64`, `@rollup/rollup-linux-arm64-gnu` alle versioni del lock) in un prefix esterno via `NODE_PATH`. Sul Mac il comando gira nudo.

## 3. F7 e la compensazione del harness

L'import Ecore headless perde le registrazioni differite dei `_persistCallbacks` (SetFieldAction su collection del father + campo `father`): `pkg.classes`, `cls.attributes/references/operations`, `op.parameters`, `pkg.datatypes` restano vuoti, mentre le mutazioni DIRETTE del parser (packages, subpackages, enumerators, literals) sopravvivono. È la famiglia F7 dell'audit co-evoluzione (2026-07-04), osservata qui dal lato importer. In app le stesse registrazioni funzionano (i metamodelli importati si vedono; il round-trip W2 fu verificato su dev server).

Il harness compensa ricostruendo le wiring perse dall'ORDINE di creazione (l'inserzione in idlookup segue la DFS del parser), in modo idempotente e write-only-if-missing: `rt-helpers.ts:compensateF7`. La compensazione è dichiaratamente harness-only; la root cause F7 resta un filone aperto.

Secondo apprendimento infrastrutturale: il commit dello store è ASINCRONO anche fuori transazione (gli elementi fanno ponte via `Constructors.pending`); ogni ispezione post-import deve attendere un flush di macrotask.

## 4. Fix applicati (RT1–RT10) — tutti nel working tree

### M2 — Ecore

| ID | File | Problema | Fix |
|----|------|----------|-----|
| RT1 | `api/data.ts` (LinkAllNamesToIDs) | L'importer risolve i reflection EClass solo nella forma `ecore:EClass platform:/plugin/...Ecore.ecore#//X` (DefaultEClasses). La forma equivalente `http://www.eclipse.org/emf/2002/Ecore#//X` (emessa dal nostro exporter e da altri tool) falliva con "LinkAllNames() can't find type target" → **il re-import di ogni export con reference a EObject abortiva** (UML: 19 occorrenze). | Registrate entrambe le forme in `replacePrimitiveMap`. |
| RT2 | `EcoreService.targetTypePointer` | L'exporter emetteva la forma http per i reflection EClass; Eclipse serializza la forma platform. Asimmetria import/export nello stesso codebase. | Emessa la forma `platform:/plugin` (nuova costante `ECORE_PLATFORM_URI`). |
| RT3 | `EcoreService.exportEnumerator` | `value` dei literal emesso da `literal.ordinal` (getter L = POSIZIONE nella collezione, non il value EMF; headless -1). Un literal con value esplicito ≠ posizione veniva esportato sbagliato anche in app. L'importer usa la sentinella `-Infinity` per "value assente". | `value` letto da `__raw.value` (D-layer), emesso solo se finito, omesso quando assente (come Eclipse). |
| RT4 | `EcoreService.exportToXML` / `renderEPackageBody` | nsURI/nsPrefix INVENTATI (`http://jjodel.org/...`) quando assenti nel modello → round-trip sporco su ogni fixture senza nsURI. | Emissione condizionale: assente nel modello ⇒ assente nel file (override via options resta). L'import M1 risolve comunque per nome package (fallback esistente in `getMetamodelByNsURI`). |

### Core (attenzione: critical-zone)

| ID | File | Problema | Fix |
|----|------|----------|-----|
| RT5 | `joiner/classes.ts` (`Constructors.setPtr`) | Con `checkPointerValidity === undefined` il check di pointer-ness era SALTATO: ogni valore primitivo truthy in `DValue.values` (es. `issue="42"`, `title="Moby Dick"` da import XMI M1) generava `SetFieldAction(idlookup.<primitiva>.pointedBy)` → "Invalid action path" nel reducer per OGNI attributo importato. In app: console sporca e azioni spazzatura a ogni import M1 (le scritture non atterravano comunque: path invalido). Headless: abort del batch → il DModel M1 spariva. | `Pointers.isPointer(v, checkPointerValidity)` SEMPRE verificato (con state se fornito, altrimenti check di prefisso `Pointer`). Argomento di sicurezza: le azioni rimosse fallivano già nel reducer, quindi lo stato committato non cambia; spariscono solo gli errori. |

### M1 — XMI

| ID | File | Problema | Fix |
|----|------|----------|-----|
| RT6 | `XMIService.exportToXML` | Il root emetteva solo `xmlns:<prefix>` MA `importM1FromXML` richiede lo xmlns di DEFAULT per risolvere il metamodello → **ogni export M1 era un file non re-importabile**. Inoltre il namespace inventava URI. | `xmlns="<nsURI ?? nome package>"` (stesso fallback dell'import); tag radice e `xsi:type` NON prefissati (stessa forma delle fixture EMF single-metamodel). |
| RT7 | `XMIService.exportToXML` | La side-table `DModel.metadata.xmiIdMap` (xmi:id originali, Phase B.7) era popolata all'import ma MAI usata all'export: gli id originali andavano persi. | Implementata B.7: `mapId()` riemette gli xmi:id originali (fallback: Pointer id), sia su `xmi:id` sia nei valori delle reference. |
| RT8 | `XMIService.exportToXML` | `model.objects` contiene TUTTI gli oggetti (anche i figli containment, registrati per il canvas): l'export li emetteva sia nested sia come radici → **duplicazione di ogni figlio al re-import**. | Export delle sole RADICI (insieme `contained` calcolato dagli slot containment, + dedup). |
| RT9 | `XMIService.serializeFeatures` (nuovo helper condiviso) | I valori venivano letti dal getter L `values`, che mappa i pointer in proxy (`String(v)` = garbage per enum/reference); reference non-containment emesse coi Pointer Jjodel. | Valori letti dal D-layer (`__raw.values`): enum literal pointer → NOME del literal; reference → xmi:id mappato (RT7); attributi multi-valore space-joined. |
| RT10 | `XMIService.importM1FromXML` | Nel wrapper path, `xmi:Documentation` (embedded metamodel emesso dall'export di default!) veniva trattato come istanza radice → `Unknown class 'Documentation'` → **abort dell'intero import**. | Skip degli elementi di sistema `xmi:*` / `xsi:*` sotto il wrapper, con warning. |

## 5. Matrice risultati

| Fixture | Contenuto esercitato | Esito |
|---|---|---|
| Library.ecore | classi, abstract, extends, containment, refs, bounds | ✅ pulito |
| Graph.ecore | refs non-containment multi-valore | ✅ pulito |
| Shapes.ecore | gerarchia, 4 classi | ✅ pulito |
| DataType_test.ecore | EDataType user-defined (W2) | ✅ pulito |
| DataType_collision_test.ecore | collisione nomi canonici (String/Date) | ✅ pulito |
| **UML.ecore (Eclipse UML2)** | 243 classi, 13 enum, 1481 operazioni, 167 eOpposite, bounds/flags massivi, reflection EObject | ✅ pulito (mod annotations + generics) |
| combo_test.xmi (Library) | containment, xsi:type, refs cross-object, **xmi:id originali preservati** | ✅ pulito |
| polymorphism_test.xmi (Shapes) | wrapper `<xmi:XMI>`, xsi:type | ✅ pulito |
| references_test.xmi (Graph) | path EMF `//@nodes.N` | ✅ simmetrico (perdita nota al primo import, sez. 6) |

L'export di combo_test è quasi byte-identico all'originale (id `m1`, `b1`, `mg1` preservati via RT7).

## 6. Perdite al PRIMO import (fuori scope del round-trip, backlog)

Queste informazioni si perdono quando il file entra in Jjodel; il round-trip non può conservarle finché l'importer non le legge:

1. **eAnnotations** — esclusione DELIBERATA (decisione di Alfonso). Il piano W4 del 2026-05-17 resta il riferimento se mai servirà.
2. **defaultValueLiteral + iD (W3)** — campi D-layer già esistenti, wiring I/O mai fatto (exporter commentato, costanti importer assenti). UML.ecore ne ha 81: oggi droppati. È il prossimo quick-win (~22 righe, piano nel discovery 2026-05-17).
3. **Generics (eGenericType/eTypeParameters, W7)** — 900 occorrenze in UML.ecore, droppate silenziosamente. Scope-decision aperta (OQ1/OQ2).
4. **Reference M1 con path EMF `//@feature.N`** — `resolveReferences` supporta solo xmi:id literal; references_test perde source/target al primo import. Backlog B.3 M1.
5. **eKeys, resolveProxies, instanceTypeName separato** — come da audit 2026-05-17 (MI1/MI2/SI8).
6. **Reflection EClass collassati** — `Selectors.getDefaultEcoreClass` ritorna sempre `Pointer_EOBJECT`: EClass/EPackage/ENamedElement/EAnnotation-typed feature diventano EObject-typed (UML: tutte le 19). Perdita semantica accettabile per ora; da documentare a UI se serve.

## 7. Findings collaterali (non fixati, da tracciare)

- **Doppio path di import M1**: `ImportDropZone.tsx:93` usa il LEGACY `XMIService.importFromXML` (EcoreParser M1 + embedded metamodel), `ProjectEditor.tsx:892` usa `importM1FromFile` (il path attivo B.1–B.3). I due path hanno semantiche diverse; unificare (candidato: drop del legacy).
- **F7 root cause** ancora aperta (le SetFieldAction differite dei Constructors sotto `paused` + `persist` non atterrano headless; in app sì). La compensazione del harness la aggira, non la risolve.
- **M1 con enum**: nessuna fixture esercita attributi enum a M1; il path RT9 (literal pointer → nome) è codificato ma non coperto da test. Suggerita fixture dedicata.
- Test file pre-esistenti che falliscono headless in sandbox (`window is not defined`: jjtl/jjscript/UDComparator suites) — ambientale, non correlato; 703/703 test passano.

## 8. Gate eseguiti e gate mancanti

Eseguiti (sandbox):
- Suite round-trip: **10/10** ✅
- `npm run test` (root): **703/703** ✅ (9 file env-fail pre-esistenti)
- `tsc --noEmit`: **26 errori totali, ZERO nei file toccati** (26 < baseline 33; i residui sono pre-esistenti, es. data.ts:837 `DDataType` visibility)

Mancanti (Mac, Alfonso):
- `npm run build`
- Gate visivo: import UML.ecore in-app → export → re-import; import combo_test.xmi → export → re-import; regressione canvas M1 (RT5 tocca il core).

## 9. File toccati in questa sessione

Sorgente (5): `frontend/src/api/data.ts` (+6), `frontend/src/services/export/EcoreService.ts` (RT2-4), `frontend/src/services/export/XMIService.ts` (RT6-10, riscrittura exportObject/exportNestedObject + helper serializeFeatures), `frontend/src/joiner/classes.ts` (RT5, ~10 righe).
Nuovi (7): `frontend/ecore-roundtrip-tests/*` (suite completa + gitignore fixtures-local).
Docs: questo audit + entry in `docs/claude-code-log.md`.
Pre-esistenti NON toccati: EditorV2.tsx, ClassNode.tsx, canvasToJjom.ts, LModelElement.tsx (dirty della sessione ghost-chip).
