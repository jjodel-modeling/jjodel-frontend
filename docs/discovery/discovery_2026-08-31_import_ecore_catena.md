# Discovery — la catena dell'import Ecore da UI: viva, e misurata dal gesto

**Data**: sessione 2026-08-30 sera, chiusa 2026-08-31 00:00 (+0200). Il referto porta la
data di chiusura; le sonde girano a cavallo della mezzanotte. Le sessioni parallele
(tick-fix, badge) datano 2026-08-30: non e' una incoerenza, e' lo stesso turno a cavallo.

**Ipotesi che la discovery falsifica**: «l'import `.ecore` da UI e' morto end-to-end, e il
"non verificabile" di `parseDAnnotation` era in realta' "morto a monte"».

**Verdetto**: **falsificata su entrambi i capi.** L'import `.ecore` da UI e' **vivo**, ed e'
stato esercitato dal gesto reale — dal click sul menu al `DAnnotation` nello store. Le due
misure del 30-08 sono entrambe **vere** e riguardano entrambe un percorso **legacy e mai
cablato**, non il percorso vivo. Il residuo dichiarato di `parseDAnnotation` e' chiuso: il
suo test end-to-end non e' solo scrivibile, e' **scritto e verde** (§7).

**Modifiche al codice**: zero. Sonde `_tmp_*` non committate.

---

## 0. File letti

| File | Righe lette |
|------|-------------|
| `frontend/src/common/libraries/prj_xml2json.js` | 1-275 (intero) |
| `frontend/src/components/topbar/SaveManager.ts` | 1-200 (intero) |
| `frontend/src/components/project/ProjectEditor.tsx` | 905-1055, 2275-2330, 2930-2960 |
| `frontend/src/services/export/EcoreService.ts` | 545-690 |
| `frontend/src/api/data.ts` | 136, 691-1050 (call site di `parseDAnnotation`), 1399-1472 |
| `frontend/src/components/editor-v2/nodes/rowViewAnnotations.ts` | 1-50 |
| `frontend/src/components/common/ImportDropZone.tsx` | grep mirato |
| `frontend/src/pages/AllProjects.tsx`, `pages/components/Dashboard.tsx` | handler di drop |
| `frontend/scripts/smoke/states.ts` | 143-300 |
| `frontend/scripts/smoke/_tmp_annotation_parse.ts` | intero (la sonda del 30-08 mattina) |
| `docs/discovery/discovery_2026-08-30_gettype_finestra_parser.md` | §1 |
| `docs/discovery/discovery_2026-08-30_dtypedelement_type_resolution.md` | §8 |

---

## 1. La catena, anello per anello (domanda 1)

C'e' **un solo gesto vivo** in tutto l'albero, e non passa dal `SaveManager`.

| # | Anello | `file:riga` | Stato |
|---|--------|-------------|-------|
| 1 | Sezione METAMODELS, azione secondaria «Import» (dropdown) | `ProjectEditor.tsx:2297-2303` | **vivo** |
| 2 | Voce di menu «Import Ecore (.ecore)» | `ProjectEditor.tsx:2314-2324` | **vivo** |
| 3 | `handleImportEcore` → `importEcoreRef.current?.click()` | `ProjectEditor.tsx:918-921` | **vivo** |
| 4 | `<input type="file" accept=".ecore" style={{display:'none'}}>` | `ProjectEditor.tsx:2940-2946` | **vivo** |
| 5 | `handleEcoreFileChange` (onChange) | `ProjectEditor.tsx:923` | **vivo** |
| 6 | `EcoreService.importFromFile(file)` | `ProjectEditor.tsx:933` → `EcoreService.ts:615` | **vivo** |
| 7 | `importFromXML` — `DOMParser` + check `parsererror` | `EcoreService.ts:557-570` | **vivo** |
| 8 | `EcoreService.xmlToJson` (privata, walk del DOM, prefisso `'-'`) | `EcoreService.ts:577` → def. `:645` | **vivo** |
| 9 | `EcoreParser.parse(json, true, filename, true)` | `EcoreService.ts:582` | **vivo** |
| 10 | `parseDClass` / `parseDAttribute` / … → `parseDAnnotation` | `data.ts:691`, 11 call site | **vivo** |
| 11 | Link al progetto + `ImportSummaryModal` | `ProjectEditor.tsx:942-966` | **vivo** |

Il prefisso e' allineato per costruzione, e il commento lo dichiara:

```
data.ts:136:    static prefix:string = '-'; // aligned with EcoreService.xmlToJson output (was '@')
```

**Nessun altro gesto raggiunge `.ecore`.** Verificato per esclusione, con controllo positivo:
- **drag & drop**: gli unici `onDrop` che leggono `dataTransfer.files` sono
  `AllProjects.tsx:62` e `Dashboard.tsx:290`, e filtrano **`.jjodel`** (progetti), non `.ecore`
  — `Dashboard.tsx:304` alza «Please drop a .jjodel file». Controllo positivo del grep:
  `grep -c onChange ProjectEditor.tsx` = 8, la ricerca ha segnale.
- **`ImportDropZone.tsx`** *supporta* `.ecore` (`:78-80`, chiama `EcoreService.importFromFile`)
  ma ha **zero siti di import**: `grep -rn "ImportDropZone" frontend/src/` ritorna solo il
  proprio `.tsx` e il proprio `.scss`. Componente corretto e **mai montato**. Idem
  `ExportImportMenu.tsx`.
- **`SaveManager.importEcore_click`**: vedi §2.

---

## 2. Il percorso legacy: rotto **e** mai cablato — due difetti indipendenti

Il censimento del 30-08 sera diceva il vero su entrambi i punti; qui li separo, perche' sono
guasti distinti e la loro somma e' quello che ha fatto sembrare morta tutta la catena.

### 2.1 `xml2jsonobj` solleva sempre

```
prj_xml2json.js:195:  export function xml2jsonobj(xml, tab= '    '){ return X.xml2json(xml, tab, false); }
prj_xml2json.js:196:  export function xml2jsonstr(xml, tab= '    '){ return X.xml2json(xml, tab, true); }
```

`X` (`:10`) espone cinque metodi — `toObj`, `toJson`, `innerXml`, `escape`, `removeWhite` — e
**non** `xml2json`, che e' una funzione **di modulo** (`:178`). Misurato in pagina:

```
xml2jsonobj → TypeError: X.xml2json is not a function
xml2jsonstr → TypeError: X.xml2json is not a function
xml2json    → OK, chiavi ["-xmlns:xmi","-xmlns:xsi","-xmlns:ecore","-xmi:version","-name","-nsURI"]
```

L'ultima riga e' il **controllo positivo**: la funzione modulo, sullo **stesso** documento,
ritorna il JSON. Non e' l'input a essere cattivo, e' `X.xml2json` a non esistere.

Ricaduta sulla facciata pubblica: `XML.toJsonObject` e `XML.toJsonString`
(`prj_xml2json.js:270`) sono i due alias di quelle funzioni e sono quindi **anch'essi morti**.
Hanno **zero consumatori** — grep su `toJsonObject|toJsonString` ritorna solo la definizione e
la facciata. `XML.toJson` / `XML.toJSON` puntano invece alla funzione buona e hanno un
consumatore vivo, `DV.tsx:419` (`XMI.toJSON(text)` dentro il `jsxString` della default view).

### 2.2 `importEcore_click` non ha, e non ha mai avuto, un chiamante

`grep -rn "importEcore_click" frontend/src/` ritorna 3 righe, tutte dentro `SaveManager.ts`
(`:81` definizione, `:82` auto-chiamata, `:88` definizione di `_click0`). Anche
`SaveManager.importEcore` (`:156`) e' raggiunto **solo** da `_click0:145`.

**Esteso a tutta la storia**: per ciascuno dei 20 commit che toccano la stringa
`importEcore_click`, `git grep -l` all'interno del commit trova il simbolo solo in
`SaveManager.ts` e nei **bundle di build committati** (`frontend/old build/static/js/
main.105ea528.js` e simili). E anche dentro il bundle le occorrenze sono 3 e tutte nel corpo
della classe: definizione, auto-chiamata, definizione. **Nessun `onClick`, in nessun punto
della storia di questo albero.** Non c'e' mai stato un menu File che lo montasse: la cartella
`components/topbar/` contiene oggi soltanto `SaveManager.ts`, `undoredo.scss`,
`undoredocomponent.tsx`.

---

## 3. Da quando (domanda 2)

`xml2jsonobj` **funzionava** ed e' stato rotto da una rifattorizzazione precisa.

```
commit 47a4b5b1097e1b66ac7a25bac974f756d4adefc8
Author: Damiano Di Vincenzo
Date:   2025-11-09 16:10:55 +0100
    languages + auth redirect

-export function xml2jsonobj(xml, tab= '    '){
-   return X.toObj(X.removeWhite(xml));
-}
+export function xml2jsonobj(xml, tab= '    '){ return X.xml2json(xml, tab, false); }
+export function xml2jsonstr(xml, tab= '    '){ return X.xml2json(xml, tab, true); }
```

Lo stesso commit introduce la funzione modulo `xml2json` (`:178`) accorpando la logica
`xsi:type`. La delega e' corretta come intenzione: sbagliata di **un token**, il qualificatore
`X.`. `git log -S "xml2json: function" -- prj_xml2json.js` e' **vuoto**; controllo positivo,
`git log -S "toObj: function"` sullo stesso file ritorna `061ab9b23`. Quindi `X.xml2json`
**non e' mai esistito**: non e' una rimozione, e' un refuso mai eseguito.

**Data della rottura: 2025-11-09.** Da allora, e non prima, `prxml2json.xml2jsonobj` solleva.

Sull'altro capo, la cronologia dice l'opposto di una morte:

| Data | Commit | Fatto |
|------|--------|-------|
| 2025-11-09 | `47a4b5b10` | `xml2jsonobj` rotto |
| 2026-01-29 | `7446be9f5` | nasce `EcoreService.ts` (export Ecore/XMI) |
| 2026-01-30 | `de518e89d` | `ProjectEditor` chiama `EcoreService.importFromFile` — nasce la via viva |
| 2026-05-13 | `ad24c4af0` | i due `prefix` del parser allineati all'output di `xmlToJson` |
| 2026-05-14 | `62fdaf54b` | diagnostica di import migliorata |

Cioe': la via viva **non e' mai passata** dal codice rotto. Il legacy e' rimasto in albero
senza chiamanti, e la sua rottura del 2025-11 non ha mai avuto un effetto osservabile — che e'
esattamente perche' e' rimasta lì dieci mesi.

---

## 4. Perche' le sonde arrivavano al parser (domanda 1, seconda meta')

Il prompt chiede: «le sonde lo usano via `xml2jsonobj`… che pero' solleva: come fanno?».
**Non lo usano.** Riletta la sonda del 30-08 mattina, `_tmp_annotation_parse.ts:37-49`
**riscrive a mano** la conversione DOM→JSON dentro `page.evaluate`:

```js
const toJson = (n: Element): any => {
    const o: any = {};
    for (const a of Array.from(n.attributes)) o['-' + a.name] = a.value;
    for (const c of Array.from(n.children)) { … }
    return o;
};
```

Il commento in testa dice «il JSON nella forma che `prxml2json.xml2jsonobj` produce». **La
forma e' invece quella di `EcoreService.xmlToJson`**: stesso prefisso `'-'`, stessa iterazione
su `.children` (solo elementi), stessa promozione ad array sulle ripetizioni. E' una copia
verbatim del convertitore **vivo**, attribuita per errore a quello morto.

Il che significa che quella sonda stava, senza saperlo, misurando la forma **giusta** — il
suo `ALL GREEN` del 30-08 mattina vale piu' di quanto dichiarasse.

---

## 5. La misura nuova: il gesto reale, end-to-end

Sonda `frontend/scripts/smoke/_tmp_ecore_chain.ts` (non committata). Progetto creato dalla UI
vera (`states.createProject`), poi il gesto: click su «Import» → click su «Import Ecore
(.ecore)» → `page.waitForEvent('filechooser')` → `chooser.setFiles(Annotation_test.ecore)`.

```
--- (1) prxml2json ---
PASS  xml2jsonobj solleva                              X.xml2json is not a function
PASS  xml2jsonstr solleva                              X.xml2json is not a function
PASS  CONTROLLO POSITIVO: xml2json funziona sullo stesso doc

--- (2) il gesto ---
trigger "Import" trovati: 1; voce di menu trovata: 1; FileChooser aperto e file consegnato
PASS  il gesto apre il file picker (quindi la catena parte dalla UI)

--- (3) store ---
prima : {"models":0,"ann":0,"cls":11,"m2models":0}
dopo  : {"models":1,"ann":4,"cls":12,"m2models":1}
modelli: ["annotation_test"]
attributi: ["tint","width","code","plain"]
DAnnotation.source: ["jjodel/renderer=color","jjodel/unit=px","jjodel/min=0","jjodel/renderer=code"]
modale: Import successful | FileName: Annotation_test.ecore | Type: Metamodel |
        Model name: annotation_test | nsURI: http://example.org/annotation_test |
        Packages 1 | Classes 1 | Attributes 4 | References 0 | Enums 0 | DataTypes 0

PASS  l'import crea un DModel nuovo                    0 -> 1
PASS  l'import crea la DClass Swatch                   11 -> 12
PASS  parseDAnnotation e' raggiunta dal gesto          0 -> 4
PASS  le 4 annotazioni attese ci sono
PASS  nessun errore di pagina                          none

ALL GREEN
```

Screenshot: `frontend/scripts/smoke/_tmp_ecore_chain.png` (non committato).

**Il picker E' pilotabile.** Il §8 del referto `dtypedelement` del 30-08 dichiarava «pilotare
il picker da Playwright non ha prodotto un `filechooser`» e non dichiarava verificato l'import
end-to-end. La misura di oggi lo contraddice: il `filechooser` **arriva**, purche' il
`waitForEvent` sia armato **nella stessa `Promise.all`** del click che lo scatena, e purche'
il click sia sulla voce di menu (che chiama `.click()` sull'input nascosto) e non sull'input.
Il caveat operativo e' quello, non l'impossibilita'. Registrata come ostacolo ambientale
rimosso — taxonomy `(g)`.

---

## 6. Cosa servirebbe a rianimare il legacy (domanda 3)

La decisione e' del design; qui c'e' solo l'inventario, e **non e' il fix da un token** che
sembrava. Misurato con `_tmp_ecore_converters.ts` e `_tmp_ecore_converters2.ts`.

Confronto dei due convertitori sullo **stesso** `.ecore`:

| | `EcoreService.xmlToJson` (viva) | `prxml2json.xml2json` (legacy, riparata) |
|---|---|---|
| iterazione figli | `el.children` — **solo elementi** | `xml.firstChild…nextSibling` per `nodeName` — **tutti i nodi** |
| commenti XML | scartati | emessi come chiave **`#comment`** |
| output sul fixture | accettato dal parser | **`[Error] unexpected field in parseDClass() |#comment|`** (`data.ts:798`) |

Togliendo i nodi commento dal DOM prima della conversione, la seconda sonda misura:

```
senza commenti, identiche: true
differenze residue: []
EcoreParser.parse sull'output prxml2json ripulito:
  {"n":11,"kinds":{"DModel":1,"DPackage":1,"DClass":1,"DAttribute":4,"DAnnotation":4}}
```

Cioe': **a parita' di input privo di commenti i due convertitori sono byte-identici**, e il
parser accetta il legacy tale e quale. Il delta e' esattamente e solo il trattamento dei
commenti.

**Inventario minimo per rianimare `SaveManager.importEcore_click`:**

| # | Cosa | Dove | Costo |
|---|------|------|-------|
| 1 | `X.xml2json` → `xml2json` (due righe) | `prj_xml2json.js:195-196` | **1 riga di diff x2**, banale |
| 2 | Scartare i nodi commento (`nodeType === 8`) in `X.toObj`, o pre-pulire il DOM | `prj_xml2json.js:11-65` **oppure** `SaveManager.ts:129` | piccolo, ma tocca un convertitore condiviso da `XML.toJSON` → **regressione possibile su `DV.tsx:419`**, va misurata |
| 3 | Un gesto che chiami `importEcore_click` | non esiste: `components/topbar/` non ha un menu File | **il grosso del costo** — e' un pezzo di UI da progettare, non da ricablare |
| 4 | De-duplicare il link al progetto | `SaveManager.ts:156-183` ripete la logica di `ProjectEditor.tsx:942-949` | medio |

**Osservazione, non raccomandazione**: i punti 1+2 riparano codice che, riparato, resta senza
chiamanti; il punto 3 e' il solo che produca un effetto osservabile, ed e' anche il solo che
non sia una riparazione ma una funzionalita' nuova. L'alternativa gia' in albero e' montare
`ImportDropZone.tsx` (che usa la via viva e supporta `.ecore` **e** `.xmi`) — costo: un sito
di render, zero nuova logica di parsing. E' la strada corta, se il gesto voluto e' il
drag & drop.

---

## 7. `parseDAnnotation` end-to-end (domanda 4)

**Il test end-to-end non e' solo scrivibile: e' scritto e verde.** §5, misura (3): il gesto
reale sul `.ecore` fixture produce **4 `DAnnotation` nello store**, con le `source` esatte —
`jjodel/renderer=color`, `jjodel/unit=px`, `jjodel/min=0`, `jjodel/renderer=code` — piu' il
controllo negativo (l'attributo `plain`, senza annotazioni, non ne produce). Zero errori di
pagina.

Il residuo dichiarato del 30-08 mattina («misura sul JSON di `prxml2json`, non sul file
picker, non pilotabile») e' quindi **chiuso**, e per due ragioni insieme: il picker si pilota
(§5) e la forma di JSON che la sonda usava era gia' quella viva (§4).

Il fixture `frontend/src/__tests__/fixtures/xmi-m1/Annotation_test.ecore` e' gia' committato e
copre i tre casi piu' il negativo, quindi una eventuale promozione a test permanente non ha
bisogno di dati nuovi. Non e' stata fatta qui: zero modifiche.

---

## 8. Reperti collaterali, dichiarati e non corretti (regola 9)

1. **Commento obsoleto.** `rowViewAnnotations.ts:15-18` afferma tuttora che
   «`EcoreParser.parseDAnnotation` returns `[]` on its first line (`api/data.ts:650`), so no
   import has ever produced an annotation», e `:39-42` che «an `.ecore` round trip drops
   these, because the parser is stubbed on the read side too». Entrambe **superate** dal
   lavoro del 30-08 mattina e falsificate dalla misura di §5. Il riferimento di riga
   (`data.ts:650`) e' anch'esso spostato: `parseDAnnotation` e' oggi a `:691`.
2. **`DAnnotationDetail` resta vuoto.** Lo stesso commento (`:17-19`) dice che
   `DAnnotationDetail` (`LModelElement.tsx:150`) e' una classe vuota con corpo `// todo` e che
   `addAnnotation` ha zero call site. **Non verificato in questa sessione** — non l'ho
   misurato, lo riporto come affermazione altrui ancora da rivedere alla luce di §5.
3. **`XML.toJsonObject` / `XML.toJsonString` sono morti** e senza consumatori (§2.1). Non
   rimossi.
4. **`ImportDropZone` e `ExportImportMenu` non sono montati** (§1). Non rimossi, e §6 spiega
   perche' `ImportDropZone` e' probabilmente da montare, non da togliere.
5. **`SaveManager.exportEcore_click`** (`:60`) e' l'unico consumatore di `XML.fromJSON`
   (`:66`) e non ha chiamanti — l'export Ecore vivo passa da `EcoreService`. Non indagato
   oltre: fuori dal perimetro del prompt, che chiedeva l'import.

---

## 9. Domande aperte

- Il punto 2 di §6 (scartare i commenti in `X.toObj`) tocca un convertitore condiviso con
  `DV.tsx:419`. Se il legacy va riparato, quel consumatore va misurato prima: **non l'ho
  fatto**, perche' avrebbe richiesto di esercitare il round trip M2T/T2M della default view.
- Non ho misurato se `parseDAnnotation` sia raggiunta anche sul percorso **M1**
  (`parseM1Model`): i suoi 11 call site stanno nelle `parseD*` del ramo M2. Il gesto vivo per
  `.xmi` e' `handleXmiFileChange` (`ProjectEditor.tsx:999` → `XMIService`), una catena diversa
  che questa discovery non copre.
- Il reperto 2 di §8 (`DAnnotationDetail` vuoto) decide se le annotazioni importate siano
  **complete** o solo appiattite in `source`. E' la domanda successiva naturale, ed e' core.

---

## 10. Sonde (non committate)

| File | Cosa misura |
|------|-------------|
| `frontend/scripts/smoke/_tmp_ecore_chain.ts` | la catena dal gesto allo store, con controllo positivo su `xml2json` |
| `frontend/scripts/smoke/_tmp_ecore_converters.ts` | i due convertitori a confronto, e il parser sull'output legacy |
| `frontend/scripts/smoke/_tmp_ecore_converters2.ts` | lo stesso, senza nodi commento: identita' e parse verde |
| `frontend/scripts/smoke/_tmp_ecore_chain.png` | screenshot post-import |

Nota operativa per chi riusa le sonde: `tsx` inietta `__name` nel corpo di `page.evaluate`,
che nel contesto della pagina non esiste (`ReferenceError: __name is not defined`). Lo shim
`if (!g.__name) g.__name = function (f) { return f; };` in testa all'`evaluate` lo risolve.
