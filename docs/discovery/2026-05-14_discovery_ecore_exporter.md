# Discovery — Ecore Exporter (Fase A, read-only)

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
Untracked files:
  docs/discovery/discovery_2026-05-14_xmi_m1_importer.md
```

Tree non pulito: residuo della sessione discovery XMI M1 importer di poche ore fa (log + report markdown, nessun file `frontend/src/` toccato).

---

## 2. CLAUDE.md + log review

- `CLAUDE.md` letto (presente in conversazione: riferimento operativo, contesto + convenzioni).
- `docs/claude-code-log.md` letto: ultime 5 entry (2026-05-14 XMI M1 discovery, 2026-05-14 Bug H fix, 2026-05-14 Bug H discovery, 2026-05-13 Ecore Import Validator discovery, 2026-05-13 Bug G fix). Tutte sull'importer Ecore — nessuna entry sull'**exporter**, segnale che il workstream è nuovo.

---

## 🚨 HARD-STOP attivato: l'exporter ESISTE GIÀ (parzialmente)

> Hard-stop condition (vincolo del prompt): "Esistono già funzioni `exportEcore*` o `EcoreExporter*` nel codebase (in tal caso fermarsi e riportare cosa fanno)."

**Trovate 3 implementazioni:**

| Path | Cosa è | Stato |
|---|---|---|
| `frontend/src/services/export/EcoreService.ts:64-128` | `exportToXML` + `exportToFile` (template strings, single-package) | ✅ Quasi completa (vedi §3.1) |
| `frontend/src/components/topbar/SaveManager.ts:60-79` | `exportEcore_click` (usa `model.crossEcore` + `XML.fromJSON`) | ⚠️ Probabilmente broken per prefix `-` vs `@` (vedi §3.2) |
| `frontend/src/model/logicWrapper/LModelElement.tsx:486 + 13 overrides` | `generateEcoreJson_impl` (alimenta `crossEcore`/`ecore`/`ownEcore`) | ✅ Implementato in 13 L-classi (vedi §3.3) |

E **1 wiring UI**:

| Path | Cosa è |
|---|---|
| `frontend/src/components/project/ProjectEditor.tsx:706-715` | `handleExportEcore(mm)` chiama `EcoreService.exportToFile(mm)`. Menu item "Export Ecore (.ecore)" a riga 2086 (dentro context-menu del singolo metamodello). |

**SaveManager.exportEcore_click NON è invocato da nessuna parte del codebase** (grep esaustivo: zero usage). Stesso per `SaveManager.importEcore_click`. Sono metodi vivi ma orfani — probabilmente legacy del topbar precedente al redesign UI.

**Implicazione per Fase B:** non si scrive un "exporter ex novo". Si valutano 3 strategie:
- (A) Estendere `EcoreService.exportToXML` per supportare multi-package (`<xmi:XMI>` wrapper) — cambio chirurgico, ~30-60 LOC.
- (B) Sostituire la generazione interna di `EcoreService.exportToXML` con `model.crossEcore + XML.fromJSON`, fixando il prefix mismatch — cambio invasivo, alto rischio regressione su single-package già funzionante.
- (C) Lasciare `EcoreService` come motore per single-package + aggiungere wrapper per multi-package senza toccarlo.

Raccomandazione (Fase A): (A) o (C). Vedi §8.

---

## 3. Risposte alle 6 domande

### Q1 — Serializer XML

**Riassunto:** `json2xml` esiste, ma è **inutilizzabile direttamente** per l'exporter di cui parla il prompt, a causa di prefix mismatch + bug di shape.

**Candidato 1 — `prj_xml2json.js:199-268`**

Path: `/Users/alfonso/jjodel/frontend/src/common/libraries/prj_xml2json.js`

Firma:
```javascript
// prj_xml2json.js:199-268
export function json2xml(o, tab/*obj, string*/) {
   if (typeof o === 'string') {
      try { o = JSON.parse(o); } catch(e) { o = {error: "..."}; }
   }
   if (typeof o === 'object') {
      let rootkey = '';
      if (o[window.ECoreClass.xsitype]) {  // riga 205
         switch (o[window.ECoreClass.xsitype].substring('ecore:E'.length)) {
            case 'subPackages': rootkey = window.ECorePackage.eSubpackages; break;
            case 'Package': rootkey = window.ECoreModel.packages; break;
            // ... altri casi ecore-specific
         }
      }
      ...
   }
   var toXml = function(v, name, ind) {
      ...
      for (var m in v) {
         if (m.charAt(0) == "@")        // riga 237 — ATTRIBUTI con prefix '@'
            xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
         else hasChild = true;
      }
      ...
   }
   ...
   return xmlFormat(xml);  // riga 263 — pretty-print via xml-formatter
}
```

Anche esportata come `XML.fromJSON` a riga 270:
```javascript
export const XML = {parse: parseXml, toJson:xml2json, toJSON:xml2json, toJsonObject: xml2jsonobj, toJsonString: xml2jsonstr, fromJSON:json2xml};
```

**Esempio di shape JSON attesa in input** (4 righe, dedotto dalla logica di `toXml`):
```json
{
  "ecore:EPackage": {
    "@name": "Persons",
    "@nsURI": "http://example.org/persons",
    "eClassifiers": [{ "@xsi:type": "ecore:EClass", "@name": "Person" }]
  }
}
```

**Convenzione attributi:** prefix `@` (riga 237).

**Preserva ordine chiavi:** sì, itera con `for (var m in o)` che in V8/JavaScript object iteration preserva l'inserzione per chiavi non-numeriche. Quindi gli `if (classifiers.length) ecore[...] = classifiers` di `generateEcoreJson_impl` mantengono l'ordine atteso.

**Limitazione critica — domain-specific switch riga 205-217:** quando trova `xsitype === 'ecore:EClass'` (o sim.) **rewrappa il root** in `{eClassifiers: o}`. Questo è progettato per quando `json2xml` riceve un singolo Classifier, non un'EPackage. Per l'output di `generateEcoreJson_impl` di un LModel/LPackage, il root non ha `xsitype` quindi non scatta il rewrappa, ma per i sub-elementi sì. **Effetto laterale potenzialmente indesiderato sul nostro use case** — da verificare in B.

**Bug residui in `json2xml`:**
- `console.log('json2xml pre formatting', {xml})` a riga 262 — debug leftover non rimosso.
- Dipende da `window.ECoreClass`, `window.ECoreParser`, `window.ECorePackage`, ecc. (globals patchati da `data.ts`). Non puro.

**Candidato 2 — generazione template-string in `EcoreService.exportToXML`**

Path: `frontend/src/services/export/EcoreService.ts:64-128` (single-package), 340-364 (sub-packages).

Firma:
```typescript
// EcoreService.ts:64-111
static exportToXML(metamodel: LModel, options: EcoreExportOptions = {}): string {
    const pkg = metamodel.packages[0]; // Root package
    if (!pkg) throw new Error('Metamodel has no packages to export');
    const nsURI = options.nsURI || pkg.uri || `http://jjodel.org/${metamodel.name}`;
    const nsPrefix = options.nsPrefix || pkg.prefix || metamodel.name.toLowerCase();
    ...
    const xmlParts: string[] = [];
    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlParts.push(`<ecore:EPackage xmi:version="2.0"`);
    xmlParts.push(`${indent}xmlns:xmi="http://www.omg.org/XMI"`);
    xmlParts.push(`${indent}xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
    xmlParts.push(`${indent}xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"`);
    xmlParts.push(`${indent}name="${this.escapeXml(pkg.name || metamodel.name)}"`);
    xmlParts.push(`${indent}nsURI="${this.escapeXml(nsURI)}"`);
    xmlParts.push(`${indent}nsPrefix="${this.escapeXml(nsPrefix)}">`);
    for (const cls of pkg.classes || []) xmlParts.push(this.exportClass(cls, classes, indent, newline));
    for (const enumType of pkg.enumerators || []) xmlParts.push(this.exportEnumerator(enumType, indent, newline));
    for (const subpkg of pkg.subpackages || []) xmlParts.push(this.exportSubPackage(subpkg, indent, newline, 1));
    xmlParts.push('</ecore:EPackage>');
    return xmlParts.join(newline);
}
```

Non passa per `json2xml`. È **autosufficiente**: produce XML direttamente da template literals + `escapeXml`. **Questo è il candidato realistico per essere la base della Fase B.**

**Conclusione Q1:** ci sono **2 generatori XML coesistenti**: `json2xml` (legacy, generic, prefix `@`) e `EcoreService.exportToXML` (modern, template strings). Per la Fase B, **estendere `EcoreService.exportToXML`** per multi-package è la strada di minor resistenza. `json2xml` resta leggibile come fallback, ma non va wirato.

---

### Q2 — Getter L-layer per iterare un metamodello

Tutti i path sono in `frontend/src/model/logicWrapper/LModelElement.tsx`.

| Getter | Su classe L | Nome reale | Tipo ritorno | Note |
|---|---|---|---|---|
| iterazione package del model | `LModel` | `packages: LPackage[]` (riga 4646 D-layer; L-getter implicito via proxy) | `LPackage[]` | Top-level packages |
| iterazione classifier di un package | `LPackage` | **separati**: `classes` (riga 1892), `enumerators`/`enums` (riga 1900-1901), `subpackages` (implicito) | `LClass[]`, `LEnumerator[]`, `LPackage[]` | Non c'è un getter `classifiers` unificato; `LPackage.generateEcoreJson_impl:1830-1833` li merge a mano |
| iterazione attributi di una classe | `LClass` | `attributes` (riga 3003 — `l.attributes`) | `LAttribute[]` | **Solo own** (per `inherited` cercare `allAttributes`) |
| iterazione reference di una classe | `LClass` | `references` (riga 3004 — `l.references`) | `LReference[]` | Solo own |
| superclassi di una classe | `LClass` | `extends` (riga 3007 — `l.extends.map(superclass => superclass.typeEcoreString)`) | `LClassifier[]` | Direct only |
| flag astratta | `LClass` | `abstract` (riga 3012 — `d.abstract`; setter 3095-3110) | `boolean` | |
| flag interfaccia | `LClass` | `interface` (riga 3011 — `d.interface`) | `boolean` | |
| iterazione literal di un enum | `LEnumerator` | `literals` (riga 4504 — `c.proxyObject.literals`); ordinali via `ordinals` getter (4566) | `LEnumLiteral[]` | `LEnumLiteral.literal` è il nome testuale, `.value`/`.ordinal` è il numero |
| tipo di un attribute | `LAttribute` | `type` (riga 4200 — `l.type.typeEcoreString`) | `LClassifier` con getter `typeEcoreString` | Vedi sotto |
| **lowerBound/upperBound** | `LAttribute`/`LReference` | `lowerBound`, `upperBound` (riga 1241-1242 base, 1498-1527 LStructuralFeature) | `number` | `-1` per unbounded (riga 1509, 1525) |
| opposite di una reference | `LReference` | `opposite?: LReference` (riga 3886) | `LReference \| undefined` | D-layer: `opposite?: Pointer<DReference>` riga 3770 |
| **containment** di una reference | `LReference` | **AMBIGUITÀ:** ci sono **DUE** proprietà — `composition: boolean` (D riga 3767, L riga 3869) E `containment: boolean` (riga 3872, esposta in `__info_of__containment` 3880) | `boolean` | `LReference.generateEcoreJson_impl:3907-3908` usa `d.aggregation \|\| d.composition` come "cont". `EcoreService.exportToXML:252` usa `ref.composition \|\| ref.containment` (entrambe). **Naming conflict.** |

**typeEcoreString getter — chiave per emettere eType:**
```typescript
// LModelElement.tsx:1704-1709
typeEcoreString!: string;
typeString!: string;
private get_typeEcoreString(c: Context) {
    return EcoreParser.classTypePrefix + c.data.name;  // "#//" + name
}
```

⚠️ **Limitazione importante:** `typeEcoreString` produce **sempre** `#//<name>`, anche per primitive del framework. Questo viola la decisione architetturale #4 (cross-doc form `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString` per primitive). Vedi anche §4 sezione bug latenti.

`EcoreService.exportToXML` **bypassa** `typeEcoreString` e usa la propria `mapToEcoreType` (riga 503-544) che SÌ produce la forma cross-doc per primitive. Questa è una incoerenza tra i due exporter coesistenti.

**Divergenze dalle memorie utente:** il prompt menziona "composition (da memorie utente) o containment". **Esistono entrambe** come proprietà distinte; sono semanticamente sovrapposte ma trattate separatamente nel codice. La memoria utente sembra parzialmente corretta — `composition` è dominante in `LReference.generateEcoreJson_impl` (riga 3907 `cont = d.aggregation || d.composition`), mentre `containment` è il nome standard Ecore. Da chiarire in Open Q.

---

### Q3 — Primitive framework vs DDataType utente

**Riassunto:** discriminazione affidabile via `DClass.isPrimitive: boolean`.

**Flag esplicito:**
```typescript
// LModelElement.tsx:1651 (LClassifier) e classes.ts:949-954 (Constructor)
isPrimitive!: boolean;
// Constructor in classes.ts:
DClass(isInterface: DClass["interface"] = false, isAbstract: DClass["abstract"] = false,
       isPrimitive: LClassifier["isPrimitive"] = false, ...): this {
    const thiss: DClass = this.thiss as any;
    thiss.isPrimitive = isPrimitive;  // riga 954
    ...
}
```

**Setter bloccato come immutabile:**
```typescript
// LModelElement.tsx:1668-1669
protected set_isPrimitive(val: this["isPrimitive"], context: Context): boolean {
    return this.cannotSet("isPrimitive");
}
```

Il flag è **read-only post-creazione**. Significa che non si può convertire un DClass utente in primitive a runtime.

**Selectors per primitive (data.ts:241-273):**
```typescript
let replacePrimitiveMap: Dictionary<string, DClassifier> = {};
let d_Estring: DClassifier = Selectors.getAllPrimitiveTypes()[1];
// ...
for (let shortkey in ShortAttribETypes) {
    let dClassType: DClassifier = Selectors.getPrimitiveType(shortetype, state);
    replacePrimitiveMap[typeprefix + shortkey] = dClassType;  // "#//EChar" → DClass primitive
}
for (let shortkey in ShortDefaultEClasses) {
    let dClassType: DClassifier = Selectors.getDefaultEcoreClass(shortetype, state);
    // ...
}
```

`Selectors.getAllPrimitiveTypes()`, `Selectors.getPrimitiveType(name, state)`, `Selectors.getDefaultEcoreClass(name, state)` esistono come API pubbliche (chiamate da data.ts, quindi callable dall'exporter Phase B).

**Pointer IDs predeterminati:** i primitive sono globalmente in un namespace `Pointer_E*` (es. `Pointer_EBOOLEAN`, `Pointer_ESTRING`). Citato in `claude-code-log.md:13` (Bug H entry): `Pointer_E*` constants (`Defaults.ts:75-86`) sono gli `.id` finali dei DClassifier sottostanti. Reverse-lookup via pointer ID è praticabile.

**Modo più affidabile per discriminare:**
```typescript
function isFrameworkPrimitive(classifier: LClassifier | LDataType | LClass): boolean {
    return !!(classifier as any).isPrimitive;
}
```

**isPrimitivePackage (importer side, per simmetria):**
```typescript
// data.ts:1030-1037
private static isPrimitivePackage(pkg: Json): boolean {
    const classifiers = this.getChildren(pkg);
    if (classifiers.length === 0) return false;
    for (const c of classifiers) {
        if (c[ECoreClass.xsitype] !== 'ecore:EDataType') return false;
    }
    return true;
}
```

Per l'exporter NON serve un check simmetrico, perché i primitive del framework non sono in nessun package — sono globali, accedibili via Selectors.

**Conclusione Q3:** la discriminazione è banale (`classifier.isPrimitive === true`). L'exporter deve **escludere** dal walk dei classifiers tutti i `DClass` con `isPrimitive === true`, perché non sono parte del metamodello utente.

---

### Q4 — Timestamp lastModified

**Riassunto:** `DModel` NON ha `lastModified`. `DProject` SÌ. Per il submenu di metamodelli si usa **alphabetical sort** (già implementato in Navbar).

**`DProject.lastModified`:**
```typescript
// classes.ts:2959-2961
description!: string;
/* no */creation: number = Date.now();
/* no */lastModified: number = Date.now();
```

Il commento `/* no */` (forse "non persisted"?) è ambiguo. Esiste getter/setter:
```typescript
// classes.ts:3160-3166
protected get_lastModified(context: Context): this['lastModified'] {
    return context.data.lastModified;
}
protected set_lastModified(val: this['lastModified'], c: Context): boolean {
    TRANSACTION(this.get_name(c)+'.lastModified', ()=>{
        SetFieldAction.new(c.data.id, 'lastModified', val, '', false);
    }, c.data.lastModified, val)
    return true;
}
```

**Updates automatici:** verificato — `lastModified` viene aggiornato manualmente via setter, **non automaticamente** ad ogni modifica. Grep per `lastModified =` ritorna 1 hit di assegnamento esplicito a `Date.now()` in setup, niente reducer automatico.

**`DModel` NON ha lastModified.** Verifica con grep su `class DModel`/`class LModel`: nessuna proprietà `lastModified`.

**Comportamento attuale dell'app — citazione autoritativa:**
```typescript
// Navbar.tsx:131-135
const hasMetamodel = metamodels.length > 0;
const isModelSubmenu = metamodels.length > 1;
// DModel has no lastModified/createdAt field — sort alphabetically by name (user choice).
const sortedMetamodels = useMemo(
    () => (isModelSubmenu ? [...metamodels].sort((a, b) => a.name.localeCompare(b.name)) : []),
    [metamodels, isModelSubmenu]
);
```

Il submenu "Create new artifact › Model" già ordina per nome alfabetico, con commento esplicito sull'assenza di lastModified.

**Conclusione Q4:** **opzione lastModified non praticabile** oggi senza modifiche al codice (richiederebbe aggiungere il campo a DModel + popolarlo nei reducer). **Fallback raccomandato:**

(a) **Alphabetical sort** come fa già Navbar (`name.localeCompare`). Coerente con UI esistente.
(b) **Insertion order** di `project.metamodels` array. Più "last-touched-like" se gli import recenti sono in coda.

Raccomando **(a) alfabetico** per coerenza con la UI esistente. Il prompt menziona "last-modified discendente" ma è una **decisione architetturale da rivisitare** alla luce di questa scoperta. Vedi Open Q.

---

### Q5 — Utility di download file da browser

**Riassunto:** **`U.download` esiste**, pronta all'uso.

**Path:** `/Users/alfonso/jjodel/frontend/src/common/U.tsx:1780-1793`

```typescript
// U.tsx:1780-1793
static download(filename: string = 'nameless.txt', text: string = '',
                mimeType: string = 'text/plain', debug: boolean = true): void {
    if (!text) return;
    filename = U.toFileName(filename);
    const htmlA: HTMLAnchorElement = document.createElement('a');
    const blob: Blob = new Blob([text], {type: mimeType, endings: 'native'});
    const blobUrl: string = URL.createObjectURL(blob);
    htmlA.style.display = 'none';
    htmlA.href = blobUrl;
    htmlA.download = filename;
    document.body.appendChild(htmlA);
    htmlA.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(htmlA);
}
```

**Sanitization filename** via `U.toFileName(filename)` interna.

**Già usato da:** `SaveManager.exportEcore_click:78` (`U.download(name, str)`).

**Pattern alternativo inlined** in 7 file (verificato via grep `createObjectURL`):
- `frontend/src/services/export/EcoreService.ts:119` (EcoreService.exportToFile)
- `frontend/src/services/export/XMIService.ts:125`
- `frontend/src/components/abstract/tabs/DocumentationTab.tsx:849`
- `frontend/src/components/envgen/hooks/useEnvGenWizard.ts:150`
- `frontend/src/pages/settings/AdvancedSettings.tsx:35`
- `frontend/src/services/DocumentationGenerator.ts:412`

**Asimmetria:** alcuni servizi recenti (EcoreService, XMIService) NON usano `U.download` ma replicano il pattern. Per la Fase B, **raccomandazione: usare `U.download`** per consistenza con il pattern già stabilito in `SaveManager.exportEcore_click`. Il refactoring di EcoreService.exportToFile per usare U.download è scope follow-up, non bloccante.

**Conclusione Q5:** `U.download(filename, text, mimeType)` pronta. Niente da creare.

---

### Q6 — Struttura `SaveManager.importEcore` e registrazione menu File

**Path:** `frontend/src/components/topbar/SaveManager.ts` (confermato).

**Naming convention dei click handler:**
- Pubblici: `verboNome_click` con suffix `_click`. Esempi: `exportEcore_click` (riga 60), `importEcore_click` (riga 81), `exportLayout_click` (riga 185), `importLayout_click` (riga 190).
- Privati / unwrapped: `verboNome_click0` per la versione "potenzialmente throw" wrappata dal pubblico con try/catch. Esempio: `importEcore_click0` (riga 88), wrappato da `importEcore_click` (riga 81-87).
- I "puri" senza `_click` sono i motori riusabili. Esempi: `importEcore` (riga 156, motore chiamato dai click handler) e `exportEcore` (riga 149).

**La Fase B userà:** `exportEcore_click` esiste GIÀ (riga 60), quindi va aggiornato/sostituito, oppure si lascia legacy e si crea `exportEcoreV2_click` (sconsigliato — naming bruttino). Vedi Open Q.

**Corpo di `importEcore` (motore, riga 149-183):**
```typescript
// SaveManager.ts:156-183
public static importEcore(jsonstr: GObject | string | null, isMetamodel: boolean,
                          filename: string | undefined, persist: boolean = true): DModelElement[] {
    const parsedElements = EcoreParser.parse(jsonstr, isMetamodel, filename, persist);
    // Link imported metamodel to current project (Bug F fix 2026-05-13):
    // EcoreParser.parse() pushes the DModel to state.m2models but does NOT update
    // project.metamodels. Without this, Dashboard shows metamodelsNumber=0 because
    // metamodelsNumber is computed from project.metamodels.length at save time.
    try {
        const project = LProject.getProject();
        if (project && isMetamodel) {
            let dmodel: DModelElement | undefined;
            for (const elem of parsedElements) { if (elem.className === 'DModel') { dmodel = elem; break; } }
            if (dmodel) {
                const lmodel = LPointerTargetable.fromD(dmodel) as LModel;
                if (lmodel) {
                    project.metamodels = [...project.metamodels, lmodel];
                    if (lmodel.node) {
                        project.graphs = [...project.graphs, lmodel.node as any];
                    }
                }
            }
        }
    } catch (linkErr) {
        console.warn('[Bug F fix] Failed to link imported metamodel to project:', linkErr);
    }
    return parsedElements;
}
```

**Corpo di `importEcore_click0` (riga 88-147):** vedi file. Usa `U.fileRead` per aprire file picker, `prxml2json.xml2jsonobj` per XML→JSON, route per estensione (`.ecore` → isMetamodel=true), chiama `SaveManager.importEcore`.

**Corpo di `exportEcore_click` (legacy, NON wirato):**
```typescript
// SaveManager.ts:60-79
public static exportEcore_click(toXML: boolean = false, toFile: boolean = true): void {
    let lmodel: null|LModel = Selectors.getActiveModel();
    if (!lmodel) return;
    let json = SaveManager.exportEcore(lmodel);          // → lmodel.crossEcore (LModelElement.tsx:464)
    let str = JSON.stringify(json, null, "\t");
    if (toXML) {
        str = XML.fromJSON(json, '\t');                   // json2xml, prefix '@' atteso
        str = U.formatXml(str);
    }
    if (!toFile) {
        localStorage.setItem("import", str);
        return;
    }
    let ism2 = (lmodel as LModel).isMetamodel;
    let name = (lmodel.name || (ism2 ? 'M2' : 'M1') + '_unnamed')
               + (toXML ? ".xml" : '.json') + "."+ (ism2 ? "ecore" : lmodel.instanceof?.name || "shapeless");
    U.download(name, str);
}
```

**Registrazione menu File nel topbar:**

⚠️ **Divergenza significativa dal mental model del prompt.** Il prompt assume che `SaveManager.importEcore_click` sia registrato in un "File menu di topbar". **Non lo è.** Verifica:

- `grep -rn "SaveManager.importEcore\|importEcore_click\|exportEcore_click" frontend/src/` ritorna **0 hit fuori da `SaveManager.ts` stesso** (eccetto la self-invocation `this.importEcore_click0`). I 4 metodi `*_click` sono **dead code** dal punto di vista UI.
- `grep -rn "Import Ecore" frontend/src/` ritorna 1 hit UI a `ProjectEditor.tsx:1998` (dentro l'import-dropdown della sezione metamodelli del Project Dashboard) + 1 hit `ProjectEditor.tsx:798` (log di errore).
- Directory `frontend/src/components/topbar/` contiene solo 3 file: `SaveManager.ts`, `undoredocomponent.tsx`, `undoredo.scss`. **Nessun componente File-Menu**.

**Convenzione e UI attuale:**
- Import Ecore è gestito da `ProjectEditor.tsx:759-806` (`handleImportEcore` + `handleEcoreFileChange`) tramite un input file nascosto + dropdown `import-select-menu` (riga 1985-2001). Il bottone "Import Ecore (.ecore)" è inline nel dashboard del progetto.
- Export Ecore è gestito da `ProjectEditor.tsx:706-715` (`handleExportEcore`) come voce di menu contestuale per ogni metamodello (riga 2086 dentro `metamodels.map`).
- `SaveManager.exportEcore_click` non viene usato dalla UI corrente. Probabilmente residuo del topbar pre-redesign 2026-04.

**Riferimento al submenu pattern "Create new artifact › Model":**
```tsx
// Navbar.tsx:304-332 — submenu laterale che si apre on-hover
{open && submenuOpen && isModelSubmenu && (
    <div className="new-document__submenu" role="menu" ...>
        {sortedMetamodels.map(mm => (
            <button key={mm.id} type="button" role="menuitem"
                    className="new-document__submenu-item"
                    onClick={() => { createM1(project, mm); ...}}>
                <span className="new-document__badge" ...>
                    {(mm.name || 'M').charAt(0).toUpperCase()}
                </span>
                <span className="new-document__submenu-label">{mm.name}</span>
            </button>
        ))}
    </div>
)}
```

Path: `frontend/src/pages/components/Navbar.tsx:304-332`.
Trigger pattern: `isModelWithSubmenu` con `onMouseEnter={scheduleOpenSubmenu}` / `onMouseLeave={scheduleCloseSubmenu}` (riga 281-282). Posizione calcolata via `computeSubmenuPos` (riga 142+).

Icona: ogni item ha un `<span>` badge con la prima lettera del nome (`(mm.name || 'M').charAt(0).toUpperCase()`), non Bootstrap Icons. La voce trigger principale usa BI: `<i className="bi bi-chevron-right new-document__chevron"/>` (riga 297).

**Conclusione Q6:** il "menu File del topbar" che ospita "Import Ecore…" **non esiste**. Le opzioni sono:
- (i) Creare ex novo un topbar File menu component (nuovo file, integrato in `Navbar.tsx` o adiacente).
- (ii) Aggiungere "Export Ecore (.ecore)" come voce a fianco di "Import Ecore (.ecore)" nel dropdown `import-select-menu` di `ProjectEditor.tsx` (oggi è solo Import — diventerebbe Import+Export).
- (iii) Aggiungere "Export Ecore" come voce di menu in Navbar.tsx (similare a "Create new artifact › Model"), riusando lo submenu pattern.

Per coerenza con la "Import Ecore" attuale (in ProjectEditor.tsx), **opzione (ii) è la più simmetrica**. Il prompt menziona "topbar" — questo va riconciliato con Alfonso. Vedi Open Q.

---

## 4. Bug latenti / inconsistenze osservate

(Lista breve, NESSUN fix proposto in Fase A.)

1. **Prefix mismatch `-` vs `@` in `SaveManager.exportEcore_click`.**
   `generateEcoreJson_impl` (es. `LPackage` riga 1825-1844) emette attributi con prefix `-` (via `ECorePackage.xmiversion` = `EcoreParser.XMLinlineMarker + 'xmiversion'` = `-xmiversion`).
   `json2xml` (riga 237) cerca prefix `@` per gli attributi.
   **Risultato:** `XML.fromJSON(model.crossEcore)` produce XML malformato dove gli attributi appaiono come elementi children (es. `<-name>Persons</-name>`).
   **Mitigation oggi:** `SaveManager.exportEcore_click` non è wirato a nessuna UI, quindi il bug è dormiente.

2. **`LReference.generateEcoreJson_impl` non emette `eOpposite`.**
   `LModelElement.tsx:3896-3910` produce `xsitype`, `eType`, `name`, `lowerbound`, `upperbound`, `containment`, `container` — **manca completamente `eOpposite`**.
   `EcoreService.exportReference` (EcoreService.ts:257-260) **SÌ lo emette**. Quindi i due exporter coesistenti hanno coverage differente:
   ```typescript
   // EcoreService.ts:257-260
   const opposite = ref.opposite;
   if (opposite && targetType) {
       parts.push(`eOpposite="#//${targetType.name}/${opposite.name}"`);
   }
   ```
   **Risultato:** se la Fase B sceglie di estendere `LReference.generateEcoreJson_impl`, deve aggiungere `eOpposite`. Se sceglie `EcoreService.exportToXML`, copertura ok.

3. **`typeEcoreString` non produce forma cross-doc per primitive.**
   `LModelElement.tsx:1707-1709`:
   ```typescript
   private get_typeEcoreString(c: Context) {
       return EcoreParser.classTypePrefix + c.data.name;  // "#//" + name
   }
   ```
   Per `EString` produce `#//EString`, non `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString`. Viola la decisione architetturale #4. `EcoreService.mapToEcoreType` (EcoreService.ts:503-544) lo fa correttamente con un type map hardcoded.

4. **`EcoreService.exportToXML` single-package only.**
   Riga 65: `const pkg = metamodel.packages[0]`. Se il metamodello ha 2+ top-level packages, ne esporta solo 1 silenziosamente.
   Conflicts con architectural decision #2 (auto-detect 1 vs N, root `<xmi:XMI>` per N>1).

5. **`isMetamodel` default = true per `DModel`.**
   `LModelElement.tsx:4642: isMetamodel: boolean = true;`. **Comportamento di default per `DModel.new()` senza arg.** Se in futuro si crea un DModel M1 senza esplicito `isMetamodel=false`, viene erroneamente classificato come metamodel. Già noto come fonte di bug.

6. **`SaveManager.exportEcore_click` codice morto.**
   Mai chiamato. Rimuovere o wirare. Lo stesso per `SaveManager.importEcore_click`.

7. **`console.log` debug residuo in `json2xml` (prj_xml2json.js:262).**
   `console.log('json2xml pre formatting', {xml})` — non rimosso.

8. **Naming conflict `composition` vs `containment` su LReference.**
   Coesistono come proprietà distinte; semanticamente sovrapposte. Codice prod usa entrambe in posti diversi (`LReference.generateEcoreJson_impl:3907` usa `composition`, `EcoreService.exportReference:252` usa entrambe). Confusione potenziale per futuri sviluppatori.

---

## 5. Suggerimenti per Fase B

**Ordine raccomandato dei moduli:**

1. **Step B.1:** estendere `EcoreService.exportToXML` per multi-package: aggiungere parametro/branch che wrappa N package in `<xmi:XMI>` invece di `<ecore:EPackage>` singolo. Stima: ~40 LOC su EcoreService.ts, isolated.

2. **Step B.2:** decidere wiring UI — (i)/(ii)/(iii) di Q6. Se (ii), aggiungere bottone "Export Ecore (.ecore)" nel dropdown `import-select-menu` con branching 0/1/N analogo a `isModelSubmenu` di Navbar. ~30 LOC su ProjectEditor.tsx.

3. **Step B.3 (opzionale):** se serve roundtrip su Families.ecore, aggiungere `eOpposite` a `EcoreService.exportReference` (è già presente, ma verificare il path nel matching dell'importer Bug-H-fixato).

4. **Step B.4 (opzionale, fuori scope MVP):** rimuovere `SaveManager.exportEcore_click` + `importEcore_click` + `importEcore_click0` se confermato dead code. Cleanup tech debt.

**Edge case sospetti:**

- Metamodel con 0 package (es. shapeless) — l'exporter attuale crasha (`Metamodel has no packages to export`). Handler errore + toast.
- Metamodel con classes ma 0 subpackages — coverage attuale OK.
- Classe con `extends` verso una classe **fuori dal pacchetto corrente** in multi-package — il `mapToEcoreType` non distingue cross-package, emette `#//ClassName` ovunque. Roundtrip su Families.ecore potrebbe richiedere `/0/X` o `/1/X` style. Da verificare empiricamente.
- Enum literal con `value` esplicito vs ordinal implicito — `EcoreService.exportEnumerator:327-330` usa `literal.ordinal !== undefined ? literal.ordinal : index`. Verificare che importer Bug-G-fixato producesse lo stesso campo `ordinal`/`value`.

---

## 6. Open questions per Alfonso

1. **Wiring UI dell'Export Ecore — quale opzione?**
   (i) nuovo topbar File menu (più infrastruttura),
   (ii) aggiungere a `import-select-menu` di ProjectEditor (più simmetrico con Import esistente),
   (iii) submenu Navbar tipo "Create new artifact" (più visibile).
   Il prompt menziona "topbar" ma il topbar non esiste oggi. Da scegliere.

2. **`SaveManager.exportEcore_click` legacy.** Rimuovere o riusare? Se riusare, va riparato (prefix mismatch). Se rimuovere, includere anche `importEcore_click` + `_click0` orfani.

3. **Sort order del submenu in caso N>1 metamodel.** Il prompt dice "last-modified discendente", ma DModel non ha `lastModified`. Alphabetical (come Navbar oggi) o insertion order? Decisione architetturale da rivedere.

4. **Coerenza tra `EcoreService.exportToXML` e `model.crossEcore`.** Esistono due path; quale è canonical per il futuro? Se EcoreService.exportToXML, è già completo per single-package + ha `eOpposite`. Se `crossEcore`, va riparato il prefix mismatch e aggiunto `eOpposite` a `LReference.generateEcoreJson_impl`.

5. **`composition` vs `containment` su LReference.** Coesistono. Il decision-maker dell'export sceglie quale leggere? `EcoreService.exportReference:252` usa `composition || containment` (OR logico — più permissivo). Confermare semantica.

6. **`mapToEcoreType` type-map hardcoded vs `Selectors.getPrimitiveType`.** Oggi `EcoreService.ts:509-535` ha una lookup table 26-righe hardcoded. C'è già la struttura `Selectors.getAllPrimitiveTypes()` / `Selectors.getPrimitiveType(name, state)` che si potrebbe interrogare. Per MVP keep hardcoded; long-term refactor verso Selectors.

7. **`xsi:type="ecore:EReference"` per ALL references o solo containment?**
   `EcoreService.exportReference:233` emette sempre `xsi:type="ecore:EReference"`. Ma in Ecore standard, `xsi:type` è opzionale quando il tag stesso identifica il tipo. Verifica con `Persons.ecore` se è atteso.

8. **Esportare `EDataType` utente.** Il prompt include "EDataType definiti dall'utente" in scope. Non vedo gestione di `LDataType` (non-enum) in `EcoreService.exportToXML`. Esiste `DDataType` come superclass di `DEnumerator` (LModelElement.tsx:4595). Da verificare se Phase B deve aggiungere `exportDataType`.

---

## 7. Files consultati

| File | Range | Scopo |
|---|---|---|
| `/Users/alfonso/jjodel/CLAUDE.md` | full | Contesto + convenzioni |
| `/Users/alfonso/jjodel/docs/claude-code-log.md` | head 100 (ultime 5 entry) | Contesto recente |
| `/Users/alfonso/jjodel/frontend/src/common/libraries/prj_xml2json.js` | 1-270 | `json2xml`, `xml2json`, `X.toObj` |
| `/Users/alfonso/jjodel/frontend/src/common/U.tsx` | 1780-1793 | `U.download` |
| `/Users/alfonso/jjodel/frontend/src/components/topbar/SaveManager.ts` | full | `*_click` handlers, naming convention, `importEcore`/`exportEcore` engines |
| `/Users/alfonso/jjodel/frontend/src/components/project/ProjectEditor.tsx` | 700-806 (handler), 1998 (button), 2086 (export button) | UI integration attuale |
| `/Users/alfonso/jjodel/frontend/src/services/export/EcoreService.ts` | 1-558 | `exportToXML`, `exportToFile`, `mapToEcoreType`, helpers |
| `/Users/alfonso/jjodel/frontend/src/model/logicWrapper/LModelElement.tsx` | 450-498 (crossEcore api), 1700-1850 (LPackage), 1240-1530 (LStructuralFeature bounds), 1650-1715 (typeEcoreString, isPrimitive), 2900-3100 (LClass), 3760-4040 (LReference + composition/opposite), 3890-3910 (LReference.generateEcoreJson_impl), 4190-4204 (LAttribute.generateEcoreJson_impl), 4340-4595 (LEnumerator), 4499-4595 (LEnumerator.generateEcoreJson_impl) | L-layer getters per Q2 |
| `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` | 940-980 (Constructors.DClass), 2955-2970 (DProject lastModified), 3160-3170 (lastModified setter) | DProject lastModified |
| `/Users/alfonso/jjodel/frontend/src/api/data.ts` | 240-280 (primitive resolution map), 960 (classTypePrefix), 1005-1037 (write+isPrimitivePackage) | Constants, write API, primitive utils |
| `/Users/alfonso/jjodel/frontend/src/pages/components/Navbar.tsx` | 125-140 (sortedMetamodels), 280-335 (submenu pattern) | Submenu pattern + sort fallback evidence |

---

**End of discovery.**
