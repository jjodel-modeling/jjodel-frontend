# Discovery — Import Summary Modal per .ecore e .xmi

**Data**: 2026-05-19
**Branch**: `alfonso-frontend-jjtl`
**Scope**: Fase A read-only. Conferma return shape dei service, inventario warning channel, conteggi disponibili via L-layer, pattern modale di riferimento, call site dei toast da sopprimere. Nessuna modifica al codice.
**Hard stop**: a fine documento. Fase B parte solo dopo OK in chat.

---

## Step A.1 — Return shape dei service

### A.1.1 — `EcoreParser.parse(...)` (`frontend/src/api/data.ts:170`)

Firma:

```ts
static parse(
    ecorejson: GObject | string | null,
    isMetamodel: boolean,
    filename: string | undefined,
    persist: boolean = true
): DModelElement[]
```

**Forma del valore restituito**: **array piatto** di tutti i `DModelElement` parsati (DModel, DPackage, DClass, DAttribute, …). NON è un oggetto con campi nominati. Il chiamante recupera il modello con:

```ts
const dmodel = parsedElements.find(e => e.className === DModel.cname) as DModel;
```

(uso confermato in `EcoreService.importFromXML:564`).

| Aspetto | Stato |
|---|---|
| Espone `warnings: string[]`? | ❌ No. I `Log.ww` interni finiscono in `Log.messageMapping['w']`/`Log.allMessages` (vedi A.2), non sono restituiti al chiamante. |
| Espone `metadata` (nsURI, packagesParsed, …)? | ❌ No. Le metadata devono essere ricavate via L-layer dopo il parse (es. `lModel.packages[0].__raw.uri`). |
| Side effect | Sì: `Constructors.persist(parsedElements)` dispatcha azioni Redux che inseriscono i DModelElement nello store. La `parse` muta lo stato globale. |
| Throws? | Sì, se `Log.exx(...)` viene chiamato (default in switch `parsePackageBody`, `parseSubPackage`, `parseDClass`, `parseDEnum`, `parseDDataType`, ecc.). L'eccezione propaga al chiamante. |

### A.1.2 — `EcoreService.importFromFile(file)` (`frontend/src/services/export/EcoreService.ts:594-614`)

Firma:

```ts
static async importFromFile(file: File): Promise<EcoreImportResult>
```

dove `EcoreImportResult` (linea 46-51) è:

```ts
export interface EcoreImportResult {
    success: boolean;
    model?: LModel;
    errors: string[];
    warnings: string[];
}
```

| Aspetto | Stato |
|---|---|
| Espone `warnings: string[]`? | ✅ Sì come campo, ma **mai popolato dal service**. `importFromXML` (537-589) ritorna sempre `warnings: []` su success, idem su error. Quindi oggi è un placeholder vuoto. |
| Espone `metadata` (nsURI, …)? | ❌ No. Solo `success`, `model`, `errors`, `warnings`. |
| Throws? | ❌ No. Il `try/catch` interno cattura ogni eccezione del parser e ritorna `{success:false, errors:['Import failed: ' + e.message]}`. Il chiamante in ProjectEditor lo riconverte in `throw new Error(...)` per il proprio catch (vedi A.5). |

### A.1.3 — `XMIService.importM1FromFile(file)` (`frontend/src/services/export/XMIService.ts:511-528`)

Firma:

```ts
static async importM1FromFile(file: File): Promise<XMIImportResult>
```

dove `XMIImportResult` (linea 71-77) è:

```ts
export interface XMIImportResult {
    success: boolean;
    model?: LModel;
    metamodel?: LModel;  // popolato solo dal vecchio path 'importFromXML' (embedded MM)
    errors: string[];
    warnings: string[];
}
```

| Aspetto | Stato |
|---|---|
| Espone `warnings: string[]`? | ✅ Sì, **e popolato** via `ctx.warnings.push(...)` nei walker (`processAttribute`, `processContainment`, `resolveReferences`, `resolveDClass`). I 14 `console.warn` interni hanno tutti il loro testo già duplicato in `ctx.warnings` (vedi A.2). |
| Espone `metamodel`? | Solo dal **vecchio path** `importFromXML` (con embedded metamodel, B.0). In **`importM1FromXML`** (linea 530-688) il return non include `metamodel` — il metamodello è recuperabile dal chiamante via `lModel.instanceof`. |
| Espone `pattern: 'wrapper' \| 'single-root'`? | ❌ No. La distinzione viene calcolata internamente come `const isWrapper = (xmiRoot.tagName === 'xmi:XMI' \|\| xmiRoot.tagName === 'XMI');` (linea 546) e usata per branching, ma **mai propagata** al chiamante. Per il summary va aggiunto al return (micro-modifica, vedi A.6 OQ-1). |
| Throws? | ❌ No. Stesso pattern di EcoreService: `try/catch` interno → `{success:false, errors:[...]}`. |

### A.1.4 — `XMIService.importM1FromXML(xml, filename)` (linea 530)

Helper interno chiamato da `importM1FromFile`. Stessa shape di ritorno (`XMIImportResult`). **`private static`** → da rendere `public static` se vogliamo chiamarlo direttamente da test (non necessario in B). Per ora non si tocca.

---

## Step A.2 — Inventario warning channel attuale

### A.2.1 — `EcoreParser` in `data.ts`

Sito | File:line | Severità | Bloccante? | Messaggio (riassunto)
---|---|---|---|---
parseM2Model error (default switch) | data.ts:661 | `Log.exx` | ✅ (throws) | `unexpected field in EAnnotation`
parsePackageBody children debug | data.ts:701 | `console.warn` | ❌ | `parsePackageBody.children` (debug-only, non user-facing)
parsePackageBody default | data.ts:706 | `Log.exx` | ✅ | `unexpected xsitype` in package body
parseSubPackage children debug | data.ts:731 | `console.warn` | ❌ | `parseSubPackage.children` (debug-only)
parseSubPackage default | data.ts:736 | `Log.exx` | ✅ | `unexpected xsitype` in subpackage
parseDClass default | data.ts:761 | `Log.exx` | ✅ | `unexpected field in parseDClass`
parseDClass eStructuralFeatures default | data.ts:788 | `Log.exx` | ✅ | `unexpected xsi:type in feature`
parseDEnum default | data.ts:813 | `Log.exx` | ✅ | `Enum.parse() unexpected key`
parseDDataType default | data.ts:843 | `Log.exx` | ✅ | `unexpected field in parseDDataType`
parseDReference eOpposite xpath | data.ts:939 | `Log.ww` | ❌ | `eOpposite with multi-root XPath /N/...`
LinkAllNamesToIDs unknown EDataType | data.ts:326 | `Log.ww` | ❌ | `found unknown EDataType "<x>", remapping to string`
LinkAllNamesToIDs type Object | data.ts:331 | `Log.ww` | ❌ | `type Object not supported, remapped to EString`
LinkAllNamesToIDs duplicate name | data.ts:297 | `Log.w(...)` | ❌ | `found 2 elements with same name` (condizionale, b=truthy) |
LinkAllNamesToIDs missing primitive | data.ts:253 | `Log.exDev` | ✅ (dev) | `missing primitive type` (sviluppo) |
LinkAllNamesToIDs missing native | data.ts:265 | `Log.exDev` | ✅ (dev) | `missing ecore native class` |
parseEnumLiteral non-numeric | data.ts:360 | `Log.ee` | ❌ (no throw) | `found non-numeric value in a literal value` |
getEcoreTypeName fail | data.ts:1081 | `Log.exx` | ✅ | `getEcoreTypeName failed` |
data.ts:1141 unknown EDataType | data.ts:1141 | `console.warn` | ❌ | `[EcoreImporter] Unknown EDataType "X" ... falling back to EString` |
debug parse result | data.ts:180 | `console.warn` | ❌ | `parse.result D` (debug-only)

**Sintesi**:
- I `Log.exx` (8 siti) sono punti di errore strutturale: throw → catch in `EcoreService.importFromXML` → `{success:false, errors:['Import failed: <msg>']}`. Il messaggio finisce in `errors`, gestito da modale ramo error.
- I `Log.ww` / `Log.w(true,...)` / `Log.ee` (5 siti) sono warning non bloccanti. Vanno solo a console + `Log.messageMapping['w'|'e'|'eDev']` (vedi Log.ts:167-168). **Non sono nei `EcoreImportResult.warnings`.**
- I `console.warn` diretti (4 siti, di cui 2 puramente debug "parsePackageBody.children") non passano da Log; sono difficili da intercettare se non monkey-patcciando `console.warn`.
- Linee 253, 265 sono `Log.exDev` — dev-mode only, throw solo in development. In produzione sono noop. OK trascurarli.

### A.2.2 — `EcoreService` console.warn

Sito | File:line | Severità | Note
---|---|---|---
targetTypePointer null target | EcoreService.ts:733 | `console.warn` | edge case raro: target null/undefined
crossPackagePointer null target | EcoreService.ts:763 | `console.warn` | idem

Entrambi sono export-side, non import-side. Fuori scope.

### A.2.3 — `XMIService` walker M1 (B.1+B.2+B.3)

Tutti i 14 `console.warn` in XMIService.ts hanno il **testo già duplicato in `ctx.warnings.push(msg)`** (e contatore `ctx.summary.warnings++`). Quindi `XMIImportResult.warnings` è già la lista completa dei warning del walker.

| Sito | File:line | Categoria |
|---|---|---|
| processAttribute unknown feature | 773 | unknown attribute |
| processAttribute multi-valued caveat | 804 | multi-value caveat |
| processContainment xmi:Extension | 838 | extension skipped |
| processContainment unknown nested | 849 | unknown nested |
| processContainment attr-not-ref | 858 | malformed XMI |
| processContainment no idref+text | 883 | empty reference |
| processContainment no declared type | 902 | malformed type |
| xsi:type mismatched subclass | 931 | type-safety violation |
| resolveDClass unknown prefix | 992 | unknown ns prefix |
| resolveDClass URI mismatch | 1001 | URI not loaded |
| resolveDClass unknown classname | 1012 | unknown class |
| resolveReferences multi/single mismatch | 1060 | bounds mismatch |
| resolveReferences EMF path | 1069 | EMF path unsupported |
| resolveReferences ref not found | 1079 | xmi:idref unresolved |

Da B.1: `console.info('[XMI M1 Import] Completato:', ...)` a linea 670 — log informativo finale, non un warning.

### A.2.4 — Raccomandazione su come collezionare warning

Due opzioni concrete (la C è la raccomandata):

**Opzione A** — modificare `EcoreParser.parse(...)` per accettare un `warnings: string[]` parametro e ridondare ogni `Log.ww` in `warnings.push`. **Sconsigliata**: tocca `data.ts` (file core con blast radius alto). Richiede 5+ modifiche distribuite. I `console.warn` diretti (linee 180/701/731/1141) non vengono comunque catturati.

**Opzione B** — monkey-patch di `Log.ww` durante l'import: salva originale, sostituisci con interceptor, restore alla fine. **Sconsigliata**: fragile, race condition se altri caller di Log girano in parallelo (es. effetti React durante `await FileReader`).

**Opzione C (raccomandata)** — leggere `Log.messageMapping['w'].length` prima e dopo `await EcoreService.importFromFile(...)`, prendere il delta. Implementazione:

```ts
const before = Log.messageMapping['w'].length;
const result = await EcoreService.importFromFile(file);
const collected: string[] = Log.messageMapping['w']
    .slice(before)
    .map(s => (s.short_string || '').trim());
```

Vantaggi:
- Zero modifiche a `data.ts`. Blast radius nullo lato parser.
- Cattura `Log.ww`, `Log.w(true,...)`, in più tutto `Log.messageMapping['w']`.
- `LoggerCategoryState.short_string` (Log.ts:23) è la concatenazione dei restArgs formattati con `\t\r\n` — leggibile e già pronta per la lista UI.

Limiti accettati:
- I 4 `console.warn` diretti in `data.ts` (linee 180, 701, 731, 1141 — 2 debug + 2 effettivi) NON sono catturati. Il `[EcoreImporter] Unknown EDataType "X"` (linea 1141) è un warning effettivo: documentare la perdita come noto in Open Question OQ-2.
- Se il rendering React durante `await` chiama `Log.ww` da un altro punto del codice, il delta lo includerebbe. In pratica gli unici altri caller di Log.ww nel codebase durante un FileReader sono debug, basso rischio.

**Per XMI**: usare `result.warnings` direttamente. Il canale è già implementato e popolato.

---

## Step A.3 — Conteggi disponibili via L-layer

Tutti i getter sono già esistenti su `LModel`, `LPackage`, `LClass`, `LObject`. Niente helper da aggiungere ai wrapper.

### A.3.1 — Per metamodello (M2)

Quantità | Getter | Note
---|---|---
N° package totali (root + subpackage ricorsivi) | `model.packages[i].allSubPackages` (LModelElement.tsx:1937-1957) → flatten + dedup. **Più semplice**: `[...model.packages, ...model.packages.flatMap(p => p.allSubPackages)]`. `allSubPackages` include `c.data` corrente nel checked map (linea 1942), quindi parte già da self. **Quindi** = somma `model.packages.length` + per ogni p `p.allSubPackages.length - 1` (escludendo p stesso). **Alternativa più pulita**: helper recursive di B.5 che fa BFS su `pkg.subpackages` accumulando count.
N° classi totali | `pkg.classes.length` sommato su tutti i package (incl. subpackages). Usare il helper di sopra.
N° attributi totali | `cls.attributes.length` sommato. `attributes` su `LClass` è quello "own" — non include inherited. Confermato da uso in EcoreService.exportClass:240.
N° reference totali | `cls.references.length` sommato. Same caveat (own, not inherited).
N° enum totali | `pkg.enumerators.length` sommato.
N° datatype totali | `pkg.datatypes.length` sommato (LPackage:1797 — getter esiste, EcoreService lo usa a linea 171). NB: gap discovery 17/05 segnalava assenza di `exportDataType`. Quel gap è stato chiuso in W2 (commit 815cbec73). Il getter è disponibile.
nsURI root package | `pkg.__raw.uri` (puntare a `__raw`, non al getter `pkg.uri` che concatena `uri + "." + name` — vedi LModelElement.tsx:1841 e EcoreService.ts:103-117).
nsPrefix root package | `pkg.__raw.prefix` (analogo).
Model name | `model.name` (getter L) o `model.__raw.name`.

**Logica di sommatoria** per uno schema flat:

```ts
function visitAllPackages(top: LPackage[]): LPackage[] {
    const out: LPackage[] = [];
    const stack = [...top];
    const seen = new Set<string>();
    while (stack.length) {
        const p = stack.pop()!;
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        out.push(p);
        for (const sp of (p.subpackages || [])) stack.push(sp);
    }
    return out;
}
```

(In alternativa `LPackage.allSubPackages` ha già BFS interna inclusa quella di self; valutare in B se conviene riusarla.)

### A.3.2 — Per modello (M1)

Quantità | Getter | Note
---|---|---
Nome metamodello | `lModel.instanceof?.name` (LModel:4785) — il metamodel è linkato come instanceof.
nsURI metamodello | `lModel.instanceof?.packages[0]?.__raw.uri`.
Pattern XMI rilevato | **Non disponibile via L-layer** — è una proprietà del parse, non del modello. Va aggiunto al return di `importM1FromXML`. Vedi OQ-1.
N° root object | `model.roots.length` (LModel:4788, getter LModelElement.tsx:5379-5380). Filtra solo `isRoot` (vedi linea 4602).
N° object totali (root + nested) | `model.objects.length` (LModel:4786). In B.3 sono pushati sia root (XMIService.ts:629 / 650) sia nested (XMIService.ts:939).
N° nested object | `model.objects.length - model.roots.length`.
N° DValue popolati | somma `obj.features.length` su tutti gli `model.objects`. Ogni feature è un `LValue` con `.values` array di primitive o Pointer (LValue:4802, 6364).
N° warning | `result.warnings.length` (già esposto dal service).

**Pattern XMI** (non disponibile via L-layer):
- Oggi `importM1FromXML` rileva la differenza a linea 546 e poi diverge il flow. La proprietà NON è propagata in `XMIImportResult`.
- **Micro-modifica proposta in B**: aggiungere `pattern?: 'wrapper' | 'single-root'` a `XMIImportResult` e popolarlo entrambi i rami (linea 613 wrapper, linea 634 single-root). 3 righe.

---

## Step A.4 — Pattern modale di riferimento

File: `frontend/src/jjtl/components/MappingAnalysisProgressModal.{tsx,scss}`.

### A.4.1 — Struttura DOM essenziale

```
.mapping-analysis-progress-overlay         (full-screen, dim background, click closes if canClose)
  └─ .mapping-analysis-progress-modal      (white card, fixed 400px width)
       ├─ .progress-modal-header           (header bar)
       │    └─ .progress-title (icon + text)
       ├─ .progress-steps                  (body)
       │    └─ .progress-step (multiple)
       └─ .progress-footer                 (button bar)
            └─ .progress-close-btn
```

### A.4.2 — Z-index e mounting

| Aspetto | Valore in MappingAnalysisProgressModal | Valore atteso per ImportSummaryModal |
|---|---|---|
| Z-index overlay | `1000` (hardcoded in .scss:37) | `var(--z-modal)` = 9999 (token in `styles/tokens/_z-index.scss:31`) |
| Mounting | Locale, dentro `SuggestedMappingsPanel` (chiamato da `useState`) | Globale, dentro `<div className="router-wrapper">` di App.tsx ultimo figlio (sopra `<HelpDrawer/>`/`<ExplainModal/>` per essere visibile anche su modali sovrapposti) |
| Backdrop click chiude? | Sì se `canClose` | Sì sempre (modale read-only, niente operazione critica in corso) |
| ESC chiude? | No esplicito (delega al focus dell'utente) | Sì (vincolo prompt) |

### A.4.3 — Side-stripe colorata

Il modale di riferimento **NON ha side-stripe**. La sua segnalazione visiva è solo via icona colorata in header (`bi-check-circle-fill` verde / `bi-x-circle-fill` rosso / `bi-stars` giallo). Per ImportSummaryModal il prompt richiede side-stripe a sinistra (allineata al pattern `.jj-toast`). Verifica pattern esistente:

```bash
$ grep -rn "side-stripe\|border-left.*--color-" /Users/alfonso/jjodel/frontend/src/components/Toast 2>/dev/null
```

(Da verificare in B; pattern jj-toast deve essere replicato come `border-left: 4px solid var(--color-success)` ecc.)

### A.4.4 — Convenzioni SCSS

- Local SCSS variables (linee 21-28) deliberatamente duplicate da DocumentationTab.scss (commento esplicito linea 18). Pattern accettato: NON factorizzare con altre componenti.
- Tutte le rules scoped sotto `.mapping-analysis-progress-overlay { ... }` per evitare collision globali. **Replicare** per ImportSummaryModal: tutto sotto `.import-summary-modal { ... }`.
- Keyframe locale scoped (linea 198, `mapping-analysis-spin`). Per ImportSummaryModal niente animazioni richieste, no keyframe necessario.

### A.4.5 — Test ID, ARIA, focus trap

| Aspetto | MappingAnalysisProgressModal | Atteso per ImportSummaryModal |
|---|---|---|
| Test ID | nessuno | nessuno (Alfonso testerà manualmente) |
| ARIA | nessuno (dialog implicit) | `role="dialog"` + `aria-labelledby` minimo |
| Focus trap | nessuno | focus iniziale sul Close button — niente trap completo (vincolo prompt: "Focus trap minimo") |

### A.4.6 — Riutilizzabilità

Conclusione: **NON riutilizzare** `MappingAnalysisProgressModal` come componente base. Le differenze sono troppe (side-stripe, footer dual-button, body con sezioni dinamiche, mounting globale). Replicare il **pattern** di organizzazione (header/body/footer + scoped SCSS) ma creare componente nuovo `ImportSummaryModal`.

---

## Step A.5 — Soppressione toast/alert

### A.5.1 — `handleEcoreFileChange` (ProjectEditor.tsx:788-830)

```
788   const handleEcoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
789       const file = e.target.files?.[0];
790       if (!file) return;
791
792       try {
793           const result = await EcoreService.importFromFile(file);
794
795           if (result.success && result.model) {
796               // [project.metamodels linking — KEEP]
802               try {
803                   project.metamodels = [...project.metamodels, result.model];
804                   if (result.model.node) {
805                       project.graphs = [...project.graphs, result.model.node as any];
806                   }
807               } catch (linkErr) {
808                   console.warn('[Bug F fix] Failed to link imported metamodel to project:', linkErr);
809               }
810  ❌       U.alert('i', 'Imported', `Metamodel "${result.model.name}" imported from Ecore`);   // RIMUOVERE
811           markDirty();
812
813           if (result.warnings.length > 0) {
814  ⚠️       console.warn('Ecore import warnings:', result.warnings);                            // MANTENERE (debug log)
815           }
816       } else {
817           throw new Error(result.errors.join(', '));
818       }
819
820   } catch (error) {
821       console.error('Import Ecore error:', error);                                            // MANTENERE
822  ❌   U.alert('e', 'Import Failed', `Could not import Ecore: ${(error as Error).message}`);   // RIMUOVERE
823   }
824   // ...
```

**Da rimuovere**:
- Linea 810 (success toast)
- Linea 822 (error toast)

**Da inserire al posto**:
- Linea ~810: `dispatchImportSummary(buildEcoreImportSummary(result, file.name, collectedWarnings))`
- Linea ~822: `dispatchImportSummary(buildErrorImportSummary('metamodel', file.name, (error as Error)?.message ?? String(error)))`

**Da mantenere**:
- `console.error` linea 821 (debug, non user-facing)
- `console.warn` linea 814 (debug log dei warning ridondante)
- `project.metamodels` linking (Bug F fix, fuori scope)
- `markDirty()`
- Reset input linee 826-828

### A.5.2 — `handleXmiFileChange` (ProjectEditor.tsx:838-876)

```
838   const handleXmiFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
839       const file = e.target.files?.[0];
840       if (!file) return;
841
842       try {
843           const result = await XMIService.importM1FromFile(file);
844
845           if (result.success && result.model) {
850               try {
851                   project.models = [...project.models, result.model];
852                   if (result.model.node) {
853                       project.graphs = [...project.graphs, result.model.node as any];
854                   }
855               } catch (linkErr) {
856                   console.warn('[XMI import] Failed to link imported model to project:', linkErr);
857               }
858  ❌       U.alert('i', 'Imported', `Model "${result.model.name}" imported from XMI`);          // RIMUOVERE
859           markDirty();
860
861           if (result.warnings.length > 0) {
862               console.warn('XMI import warnings:', result.warnings);                           // MANTENERE
863           }
864       } else {
865           throw new Error(result.errors.join(', '));
866       }
867
868   } catch (error) {
869       console.error('Import XMI error:', error);                                               // MANTENERE
870  ❌   U.alert('e', 'Import Failed', `Could not import XMI: ${(error as Error).message}`);     // RIMUOVERE
871   }
872   // ...
```

**Da rimuovere**: linee 858 (success) + 870 (error).
**Da inserire**: `dispatchImportSummary(buildXmiImportSummary(result, file.name, result.warnings))` + ramo error.

### A.5.3 — Propagazione `e.message` al modale

Il pattern `Import failed: <message>` da Bug F (commits 2026-05-13) si manifesta così:
1. `Log.exx(...)` in `data.ts` (es. linea 706) lancia `MyError('[Error]<msg>')`.
2. `EcoreService.importFromXML` catch (linea 582-588) restituisce `{success:false, errors:['Import failed: <msg>']}`.
3. `handleEcoreFileChange` riconverte: `throw new Error(result.errors.join(', '))` (linea 817) — quindi il messaggio è `'Import failed: <msg>'`.
4. Catch interno (linea 820): `(error as Error).message` → `'Import failed: <msg>'`.

Il modale userà `(error as Error)?.message ?? String(error)` direttamente. Niente prefissi aggiuntivi ("Could not import Ecore:") perché il messaggio è già descrittivo.

### A.5.4 — Altri toast in ProjectEditor.tsx — fuori scope

Per chiarezza, gli altri `U.alert` in ProjectEditor (linee 497, 520, 523, 542, 690, 693, 718, 721, 730, 733, 882, 885 — viste in grep) non riguardano import e **vanno lasciati intatti**. Solo le 4 linee elencate sopra (810, 822, 858, 870) si toccano.

---

## Step A.6 — Open Questions

### OQ-1 — Pattern XMI in return value

**Decisione richiesta**: aggiungere `pattern?: 'wrapper' | 'single-root'` a `XMIImportResult` e popolarlo in `importM1FromXML`?

**Default proposto**: ✅ Sì, micro-modifica. 3 righe in XMIService:
- Aggiungere campo opzionale a `XMIImportResult` (interface linea 71-77)
- Linea 613 (wrapper branch): `pattern: 'wrapper'` nel return
- Linea 634 (single-root branch): `pattern: 'single-root'` nel return

**Alternativa**: derivarlo nel summary builder ispezionando il primo root del modello. Più hacky, sconsigliato.

### OQ-2 — Warning channel — copertura limitata

**Decisione richiesta**: accettare la limitazione che i 4 `console.warn` diretti in `data.ts` (linee 180, 701, 731, 1141) NON sono catturati dall'opzione C?

**Default proposto**: ✅ Sì. Le linee 180/701/731 sono debug-style ("parse.result D", "parsePackageBody.children"), non user-facing warning. La linea 1141 (`[EcoreImporter] Unknown EDataType "X" falling back to EString`) è user-facing ma in pratica overlapping con `Log.ww` linea 326 che cattura lo stesso scenario via canale Log. Quindi 0 user-visible warning persi in pratica.

**Alternativa**: monkey-patch `console.warn` durante l'import. Più invasivo, race condition risk. Sconsigliato.

### OQ-3 — Conteggio attributes/references

**Decisione richiesta**: usare `cls.attributes` (own, definiti localmente) o `cls.allAttributes` (incl. inherited)?

**Default proposto**: ✅ `cls.attributes`. Allineato a EcoreService.exportClass:240 e al senso di "attributi nel metamodello" (no doppio conteggio per eredità). Per "attributi totali di una classe runtime" servirebbe `allAttributes`, ma il summary è statico.

### OQ-4 — N° root vs nested objects in M1

**Decisione richiesta**: come distinguere "root objects" e "nested objects" nel summary?

**Default proposto**: `rootObjectCount = model.roots.length` (filtrato isRoot), `nestedObjectCount = model.objects.length - model.roots.length`. Funziona in B.3 e successivi. In B.1 (solo root) `nestedObjectCount = 0` automaticamente.

**Caveat**: se `model.roots` getter ha logica diversa da quello che ci si aspetta (es. include cross-roots), può sballare. Verificare comportamento in B prima di committare.

### OQ-5 — Identità metamodello: uri vs name fallback

**Decisione richiesta**: nel summary M1, quando `pkg.__raw.uri` è vuoto (caso fixture Persons/Families), cosa mostrare come `metamodelNsURI`?

**Default proposto**: mostrare `pkg.__raw.uri || `(name: ${pkg.__raw.name})``. Renderlo leggibile per l'utente, indicare che è un fallback. Coerente con `getMetamodelByNsURI` fallback (XMIService:48-57).

### OQ-6 — Race condition Log.messageMapping['w']

**Decisione richiesta**: accettare il rischio di "warning estranei" catturati nel delta se altre parti del codice loggano via `Log.ww` durante `await FileReader`?

**Default proposto**: ✅ accettare. La finestra è milliseconds. Documentare il limite nel commento del builder. Se in prod diventa problema, opzione B (monkey-patch) può essere aggiunta in seconda iterazione.

---

## Files da toccare in Fase B (path + righe stimate)

File | Tipo | Operazione | Righe ±
---|---|---|---
`frontend/src/components/import/ImportSummary.types.ts` | new | crea tipi `ImportSummary`, `EcoreImportSummary`, `XmiImportSummary`, `ImportStatus` | +50
`frontend/src/components/import/ImportSummaryModal.tsx` | new | crea componente React + dispatch | +200
`frontend/src/components/import/ImportSummaryModal.scss` | new | side-stripe, BEM, scoped | +120
`frontend/src/components/import/buildImportSummary.ts` | new | helper estrazione conteggi + builder per success/error | +120
`frontend/src/components/import/dispatchImportSummary.ts` | new | helper dispatch CustomEvent | +10
`frontend/src/events/registry.ts` | edit | aggiunge `IMPORT_SUMMARY_SHOW` a `JjodelEvents` | +1
`frontend/src/services/export/XMIService.ts` | edit | aggiunge `pattern: 'wrapper' \| 'single-root'` a `XMIImportResult` + popolazione (OQ-1) | +3
`frontend/src/App.tsx` | edit | monta `<ImportSummaryModal/>` come ultimo figlio di `.router-wrapper` | +2
`frontend/src/components/project/ProjectEditor.tsx` | edit | wira i 2 handler (rimuove 4 `U.alert`, aggiunge 4 `dispatchImportSummary`, aggiunge delta su `Log.messageMapping['w']`) | +25 / -4
`docs/claude-code-log.md` | edit | entry 2026-05-19 | +6

**Totale stimato**: ~530 righe aggiunte, 4 rimosse, 4 file modificati, 5 file creati. Nessun file core (data.ts, LModelElement.tsx) toccato.

---

## Sintesi delle decisioni proposte

| ID | Decisione | Default | Motivazione |
|---|---|---|---|
| D1 | Warning channel Ecore | Opzione C — delta su `Log.messageMapping['w']` | Zero blast radius su parser, cattura quasi tutti i warning user-facing |
| D2 | Warning channel XMI | usare `result.warnings` esistente | Già implementato lato service, niente da modificare |
| D3 | `pattern` in XMIImportResult | aggiungere 3 righe | Micro-modifica, info di valore per il summary |
| D4 | Conteggio attributes | `cls.attributes` (own) | Allineato a export, evita doppio conteggio inherited |
| D5 | Root vs nested objects | `roots.length` vs `objects.length - roots.length` | Pulito e zero-cost in B.1 |
| D6 | Mounting modale | globale in App.tsx, CustomEvent trigger | Allineato a pattern ToastProvider |
| D7 | Side-stripe | replicata da `.jj-toast`, 4px var(--color-*) | Allineato al design system esistente |
| D8 | Pattern di riuso modale | nessun riuso, componente nuovo | Differenze troppo sostanziali con MappingAnalysisProgressModal |

---

**HARD STOP**. Aspetto OK in chat prima di procedere alla Fase B.

Per dare OK basta scrivere: "ok fase B" (eventualmente con override delle OQ proposte sopra, es. "ok, ma per OQ-3 usa allAttributes").
