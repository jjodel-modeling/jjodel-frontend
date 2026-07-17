# Discovery diagnostica — violazioni WP1 invisibili a runtime (dot mai acceso)

**Data**: 2026-07-15
**Tipo**: Fase 1 diagnostica READ-ONLY. Hard stop al termine; il fix parte solo dopo analisi in chat.
**Branch**: `alfonso-frontend-jjtl`
**Metodo**: 2 sotto-agenti read-only paralleli (Ipotesi A = sink/mounting; Ipotesi B = shape divergence), + verifica esposizione `window` per la sonda. Ogni claim ancorato a `file:line`.

> **Repro di Alfonso**: attributo `code: EString` con flag `iD` **attivato a mano**, due istanze con lo stesso valore `"X1"`, **nessun dot** sul titolo del tab del modello. Falliti hard-refresh, ricalcolo forzato, verifica del flag nel Properties panel. **Nessun indicatore, nemmeno lo stato `unknown` (question-mark)** — dato di per sé rilevante.

---

## Obiettivo

Istruire **entrambe** le ipotesi indipendentemente, individuare la/e causa/e del dot mai acceso, proporre una sonda DevTools discriminante, ed emettere un verdetto con fix path (senza implementarlo).

---

## File letti / analizzati (path completi)

- `frontend/src/model/conformance/ConformanceValidator.ts`, `useConformance.ts`, `ConformanceIndicator.tsx`, `ConformanceGuard.ts`, `__tests__/ConformanceValidator.test.ts`
- `frontend/src/components/abstract/DockManager.tsx`, `abstract/tabs/TabDataMaker.tsx`, `abstract/tabs/ModelTab.tsx`, `abstract/tabs/tab-title.scss`, `abstract/Dock.tsx`, `dock/MyRcDock.tsx`
- `frontend/src/components/editor-v2/EditorV2.tsx`, `editor-v2/Toolbar.tsx`, `EditorSwitch.tsx`, `StatusBar.tsx`, `Navbar.tsx`
- `frontend/src/model/logicWrapper/LModelElement.tsx` (getter proxy: `get_isID :4311`, `get_values :7110`, `get_value :7096`, `get_instanceof :6279/:7059`, `get_abstract :3136`, `get_upperBound/lowerBound :1516/:1500`, `get_isEnum :1690`, `get_literals :4606`, `get_allAttributes :2991`, `get_ownAttributes :2940`)
- `frontend/src/redux/createStore.ts`, `joiner/classes.ts` (`@RuntimeAccessible` → `windoww[cname]`), `joiner/index.ts`, `services/export/EcoreService.ts`, `components/editors/Info.tsx`, `frontend/src/examples/*`

---

## Ipotesi A — il sink non è montato nella superficie in uso → **DISPROVATA**

**`ConformanceIndicator` È montato sulla superficie modello dell'editor-v2 che Alfonso usa.**

### A1 — superfici che renderizzano titolo/header modello
Grep completo: **l'unico** uso JSX di `ConformanceIndicator` è `TabDataMaker.tsx:29`; **l'unico** consumer di `useConformance` è `ConformanceIndicator.tsx:27`.

| Superficie | file:line | Monta `ConformanceIndicator`? |
|---|---|---|
| rc-dock **model** tab title | `TabDataMaker.tsx:26-33` (indicator `:29`) | **SÌ** |
| rc-dock metamodel tab title | `TabDataMaker.tsx:16-24` | No (metamodelli esclusi by design) |
| editor-v2 `Toolbar` (viewpoint + pill Abstract/Concrete) | `Toolbar.tsx:413-437` | No |
| editor-v2 `EditorV2` body | `EditorV2.tsx` (Toolbar `:3459`, canvas) | No — **nessun header col nome modello, nessun chip "MODEL"** dentro editor-v2 |
| `StatusBar` breadcrumb | `StatusBar.tsx:319-349` (`conformsTo` testo `:346-349`) | No (solo testo) |

Il "chip MODEL" percepito è in realtà il **badge CSS "m"** iniettato via `::before` su `data-type="model"` (`tab-title.scss:34-39`), sullo **stesso div** `.tab-title` che contiene `<ConformanceIndicator>` (`TabDataMaker.tsx:29`). `tab-title.scss:48-78` stila persino `.conformance-indicator` + tooltip dentro `.tab-title`.

### A2 — `TabDataMaker` è sul percorso di apertura editor-v2? **SÌ**
`DockManager.open2(me)` → `DockManager.tsx:105-106`: `const tab = me.isMetamodel ? TabDataMaker.metamodel(me) : TabDataMaker.model(me);`. `TabDataMaker.model` imposta sia `content: <ModelTab>` (`:32`) sia `title: …<ConformanceIndicator/>` (`:29`). `ModelTab` → `EditorSwitch` → `EditorV2` (`ModelTab.tsx:43`, `EditorSwitch.tsx:116/127`). **Tutti** gli entry point di apertura modello passano da `open2` (`ProjectEditor.tsx:1001/1695/2626`, `Dashboard.tsx:449/454`, `LeftBar.tsx:390`, `Navbar.tsx:82/103`). Nessun percorso alternativo; il vecchio `DockLayout.tsx` factory è commentato (`:34-109`). rc-dock renderizza `tab.title` come subtree React vivo → gli hook dell'indicator girano al mount.

### A3 — quale ramo di `useConformance` scatta; "mai montato" vs "montato ma null"
`useConformance.ts` (guardie):
- `:28` `const lModel = LPointerTargetable.fromPointer(modelId)` — `modelId` = `model.id` (id corretto per l'editor-v2).
- `:29-32` `if (!lModel || lModel.isMetamodel) { setResult(null); return; }` → **null → NESSUN dot** (nemmeno question-mark).
- `:34-43` `const metamodel = lModel.instanceof; if (!metamodel) → status 'unknown'` → **question-mark grey** (`ConformanceIndicator.tsx:13`).
- `:45` altrimenti `validateConformance(lModel, metamodel)`; `:47-55` catch → `'unknown'` → question-mark.

`ConformanceIndicator.tsx`: `:33` `if (!result) return null`; **`:39` `if (status === 'conformant') return null`** (montato ma niente dot); `errors`→rosso, `warnings`→amber, `unknown`→question-mark.

**Poiché il badge "m"+nome (che Alfonso vede) e `<ConformanceIndicator>` sono figli dello stesso div**, "nessun dot" ⇒ **montato, ha ritornato null**. Non è un componente non montato. I due soli percorsi "resolved model, nessun dot **e** nessun question-mark" sono:
1. `useConformance.ts:29` → `null` (`lModel` non risolve **oppure** `lModel.isMetamodel` truthy); **oppure**
2. `validateConformance` ritorna `conformant` → `ConformanceIndicator.tsx:39` → null.

**L'assenza del question-mark** esclude: il ramo metamodello-mancante (`:34`) e il ramo validator-throws (`:47`) — entrambi mostrerebbero il question-mark. In particolare, `lModel.instanceof` sta risolvendo a un LModel vero (non a una stringa-pointer), altrimenti si vedrebbe il question-mark.

---

## Ipotesi B — i check nuovi leggono shape divergenti dal runtime → **CONFERMATA per CHECK 9 e CHECK 10; per CHECK 11 la causa è un data-gate, non la shape**

Contesto chiave: le **letture che CHECK 11 condivide con i CHECK 2-6 preesistenti/verificati** (bucketing `featuresByMetaId`, `feat.value/values`, `obj.instanceof`) funzionano a runtime — i CHECK 2-6 sono committati e verdi in produzione. Questo isola le divergenze ai campi/percorsi che i check nuovi introducono.

### B1 — `attr.isID` via `allAttributes`: leggibile, nessuna divergenza di shape
`classInMM.allAttributes` (`ConformanceValidator.ts:108`) → `get_allAttributes` = merge(ownAttributes, inheritedAttributes) (`LModelElement.tsx:2991`); `get_ownAttributes` ritorna **veri LAttribute proxy** (`:2940`), non D-object né pointer. `get_isID` → `context.data.isID` (`:4311`), boolean. **Shape OK.**

**Ma il valore è quasi sempre `false`** (rilevante per la popolazione generale, vedi sotto). Fixture: `attr()` hardcoda `isID:true` (`test:16`) → maschera il gate.

### B2 — lettura valori: scalare EString = primitivo, `feat.values` sempre array
- `feat.value` per EString "X1" → primitivo `"X1"` (`get_value :7096` con `withmetainfo=false`; mapper EString `v => v+''` `:7310-7312`). `String("X1")` per il grouping (`:262`) funziona. **Nessun wrapper, nessun collasso.**
- `feat.values` → `get_values` ritorna **sempre un array** (`:7110`). Quindi il ramo scalare del validator (`:201-204`, `:299-304`, `else if (feat.value…)`) è **morto a runtime**; gira solo il ramo `Array.isArray(vals)`. Le fixture (`values:undefined`, `test:26`) esercitano il ramo scalare → **divergenza di percorso** (innocua per CHECK 11: il ramo array dà `["X1"]`).

### B3 — `instanceof` risolve a proxy, NON a stringa-pointer (failure-mode temuto ESCLUSO)
`LObject.get_instanceof` → `LPointerTargetable.from(pointer)` → **LClass proxy** (`:6279-6282`); `LValue.get_instanceof` → proxy LAttribute/LReference (`:7059-7063`). Quindi `obj.instanceof.id/.name/.abstract/.allAttributes` e la chiave di bucketing `feat.instanceof.id` (`:118-122`) leggono proxy reali con `.id` reale → **`featuresByMetaId` popolato correttamente**. `extendsChain` (CHECK 8) → `get_superclasses` → LClass proxy con `.id`. **Lo scenario "pointer string ⇒ `.id` undefined ⇒ bucket vuoti" NON si verifica.**

### B4/B5 — divergenze confermate (queste **silenziano/deformano** i check a runtime)

**Divergenza 1 — CHECK 9 `attr_multiplicity_upper_exceeded` è un no-op silenzioso.**
`get_values` **tronca** l'array a `upperBound` prima che il validator conti:
```
LModelElement.tsx:7168-7169
  else if (dmeta && fitSize && ret.length > dmeta.upperBound && dmeta.upperBound >= 0)
      ret.length = dmeta.upperBound;
```
L'accesso proprietà `feat.values` gira con `fitSize=true` (default). Quindi `valueCount` (`:193-205`) **non può mai** superare `aub`, e `valueCount > aub` (`:209`) non scatta mai.

| | Fixture (`test:116`) | Runtime |
|---|---|---|
| `feat.values` (ub=2, 3 valori) | `['x','y','z']` len 3 | troncato a len 2 (`:7169`) |
| CHECK 9 | scatta | **mai (no-op silenzioso)** |

**Divergenza 2 — CHECK 10 `invalid_enum_literal` confronta stringhe con oggetti → falsi positivi.**
Per attributo enum, `get_values` default `solveLiterals="literal_obj"` (`:7112`) mappa ogni valore all'**oggetto LEnumLiteral** (`:7218-7220 case "literal_obj": return lit;`), non a stringa. Quindi `scalarValues` contiene proxy LEnumLiteral, e `literalNames.has(v as string)` (`:243`, `Set<string>` vs oggetto) è **sempre `false`** → flagga **ogni** valore enum.

| | Fixture (`test:171`) | Runtime |
|---|---|---|
| `feat.value` enum | `'BLUE'`/`'RED'` (stringhe) | oggetto LEnumLiteral (`:7220`) |
| `literalNames.has(v)` | membership corretta | sempre `false` → **falsi positivi su tutti gli enum** |

**CHECK 7 (abstract), CHECK 9b (lower), campi `upperBound/lowerBound/abstract/isEnum/literals`**: nomi/percorsi corretti sui proxy (`:3136`, `:1516/1500`, `:1690`, `:4606`). Nessuna divergenza di shape (ma CHECK 9b conta anch'esso `feat.values` troncato: sul lower-bound la troncatura non lo falsa perché tronca verso l'alto).

---

## La causa più probabile del repro di Alfonso (dot mai acceso, nemmeno unknown)

Va distinta la **popolazione generale** dal **caso specifico di Alfonso**:

- **Popolazione generale**: CHECK 11 non emette nulla perché `attr.isID` è `false` per default (`LModelElement.tsx:4169/4228`), l'importer Ecore **non** mappa il flag `iD` su `isID` (`grep iD/isID` in `EcoreService.ts` = 0), e negli esempi bundle **0/35** hanno `isID:true`. Il gate `if (attr.isID === true)` (`ConformanceValidator.ts:257`) non scatta mai. La fixture maschera tutto con `isID:true` hardcoded (`test:16`).

- **Caso di Alfonso**: lui ha **attivato `iD` a mano** (toggle `Info.tsx:480`, `field='isID'` → `set_isID` → `SetFieldAction('isID', true)`). Se la scrittura ha persistito su `data.isID`, allora `attr.isID === true` per il suo attributo e CHECK 11 **dovrebbe** accumulare i due `"X1"` ed emettere `duplicate_id_value`/error → dot rosso. **Non succede.** Quindi, per il suo caso specifico, la causa è una di:
  1. **`useConformance.ts:29` ritorna `null`** — `lModel` non risolve, oppure `lModel.isMetamodel` truthy sul modello aperto. Questo azzererebbe **tutti** i check (compreso il discriminante CHECK 2). È il candidato dominante dato "nessun dot, nemmeno unknown".
  2. **Il toggle `isID` non ha persistito** su `data.isID` dell'attributo M2 che `metamodel.classes → allAttributes` restituisce (write-path/proxy), quindi `validateConformance` gira ma ritorna `conformant` (CHECK 11 non accumula) → `ConformanceIndicator.tsx:39` → null.
  3. (meno probabile, ma da non inferire) i valori delle due istanze non arrivano come primitivi confrontabili al momento della valutazione.

**Il discriminante di Alfonso (CHECK 2 preesistente) separa 1 da 2/3**: se `code` con `lowerBound=1` + istanza senza valore **non** accende nulla → siamo nel caso 1 (l'hook bail-a prima di validare / il modello non risolve come M1); se **accende** → il validator gira e il sink funziona, quindi è CHECK 11 a non scattare (caso 2/3: `isID` non persistito o value-read).

---

## Sonda DevTools (deliverable — discriminante definitivo)

`validateConformance` **non** è esposto globalmente (unico import: `useConformance.ts:45`). Esposti su `windoww` (double-w): `windoww.store` (`redux/createStore.ts:7`), e ogni classe `@RuntimeAccessible` via `windoww[cname]` (`joiner/classes.ts:457`) → `windoww.LPointerTargetable` (`classes.ts:1961`), `windoww.LModel`, `windoww.LClass`, `windoww.LObject`. In dev-server Vite il validator è importabile per URL modulo.

Incollare nella console DevTools (browser, app aperta sul modello):
```js
// 1) elenca i modelli M1 aperti e i loro id
const S = windoww.store.getState().idlookup;
console.table(Object.values(S)
  .filter(d => d && d.className === 'DModel' && d.isMetamodel === false)
  .map(m => ({ id: m.id, name: m.name, objects: (m.objects || []).length })));

// 2) risolvi la proxy del modello target (incolla l'id dal passo 1)
const mid = '<MODEL_ID>';
const lModel = windoww.LPointerTargetable.fromPointer(mid);
console.log('isMetamodel:', lModel.isMetamodel, '| instanceof:', lModel.instanceof && lModel.instanceof.name);
//   isMetamodel === true  → useConformance.ts:29 ritorna null (causa 1)
//   instanceof undefined  → ramo unknown (question-mark) — ma Alfonso non lo vede

// 3) GATE di CHECK 11: esistono attributi isID sul metamodello?
const mm = lModel.instanceof;
console.log('isID attrs:', mm.classes.flatMap(c => c.allAttributes).filter(a => a.isID === true).map(a => a.name));
//   []            → il flag NON è settato sui proxy (toggle non persistito / attributo sbagliato) = causa 2
//   ['code', ...] → il flag c'è → CHECK 11 dovrebbe scattare: il problema è altrove (causa 1 o value-read)

// 4) chiamata diretta al validator (dev-import Vite; l'URL può variare col base del dev-server)
const { validateConformance } = await import('/src/model/conformance/ConformanceValidator.ts');
const res = validateConformance(lModel, mm);
console.log('status:', res.status, '| violations:', res.violations);
```
**Lettura del discriminante**:
- **violazioni in console ma nessun dot** → problema di sink/re-render nonostante il mount (rimanda ad A3: `useConformance.ts:29` null o mancato re-render rc-dock);
- **zero violazioni in console** → Ipotesi B: se il passo 3 dà `[]` è il gate `isID`; se dà `['code']` ma il passo 4 dà `conformant`, è la lettura valori/grouping.

---

## Dato runtime in arrivo da Alfonso (discriminante CHECK 2)

Input esterno atteso: `code` con `lowerBound=1` + istanza nuova senza valore (attiva CHECK 2 preesistente).
- **CHECK 2 non accende nulla** → rafforza **causa 1** (il validator non gira sul modello, o `useConformance.ts:29` ritorna null / risoluzione fallita): il problema è a monte dei check nuovi.
- **CHECK 2 accende il dot** → il validator gira e il sink funziona → il problema è **specifico di CHECK 11** (causa 2/3: `isID` non persistito o value-read).

---

## Verdetto per ipotesi + fix path raccomandato (senza implementare)

- **Ipotesi A — DISPROVATA.** L'indicator è montato sulla superficie in uso (`TabDataMaker.tsx:29`, stesso div del badge "m"). Nessun re-parenting necessario.
- **Ipotesi B — CONFERMATA per CHECK 9 e CHECK 10** (divergenze di shape reali che le fixture piatte mascherano); **per CHECK 11 la shape è corretta**, il problema generale è il **data-gate `isID`** (default false + import non lo mappa).

**Bug reali di CHECK 9/10 (indipendenti dal repro, da chiudere):**
- **CHECK 9**: contare i valori dalla **shape non troncata** — leggere `feat.__raw.values` (precedente esatto: la guard usa `feat.__raw.values` per evitare il padding, `ConformanceGuard.ts:52-68`) invece di `feat.values` (troncato a `upperBound`, `LModelElement.tsx:7168-7169`). Altrimenti il check è un no-op permanente.
- **CHECK 10**: confrontare contro il `.name` dei valori-literal (i valori arrivano come oggetti LEnumLiteral, `:7220`), oppure leggere i valori raw come stringhe. Altrimenti falsi positivi su ogni enum.

**Per il dot di Alfonso (CHECK 11):**
- Prima confermare col discriminante CHECK 2 + sonda passi 2-3 **quale** causa è viva.
- Se causa 1 (`useConformance.ts:29` null / risoluzione): il fix è nel percorso di risoluzione del modello / guardie del hook, non nei check.
- Se causa 2 (`isID` non persistito o mai vero): decidere a livello WP se (a) mappare il flag ecore `iD` → `isID` all'import (`EcoreService.ts`, oggi assente) e/o (b) confermare che il toggle `Info.tsx:480` scriva sull'attributo M2 che il validator itera. La lettura raw dei valori (come CHECK 9) va applicata anche all'accumulo di CHECK 11 per coerenza.

**Nota trasversale**: la lezione è che le fixture piatte **non** coprono la shape dei proxy L (troncatura `get_values`, literal-obj, gate `isID`). Un eventuale WP di hardening dovrebbe aggiungere almeno un test su proxy reali (o fixture che simulino il padding/troncatura/oggetti-literal).

---

## Domande aperte per Alfonso

1. **Esito del discriminante CHECK 2**: accende o no? (decide causa 1 vs 2/3).
2. **Esito della sonda passo 3** (`isID attrs`): `[]` o `['code']`? (decide gate `isID` vs risoluzione).
3. **Scelta di scope sul flag `iD` all'import**: mappare `iD`→`isID` in `EcoreService.ts` fa parte di WP1 o è un WP a sé? (Oggi l'import non lo mappa: CHECK 11 è inerte per ogni modello importato, anche corretto.)
4. **CHECK 9/10 raw-shape**: i fix (raw values per CHECK 9, `.name` per CHECK 10) rientrano in un WP1-bis di hardening o in WP3? Vanno con un test su shape realistica.

---

## Hard stop

Nessun edit oltre a questo report e all'entry di log. Nessuna strumentazione lasciata nel tree. Il fix parte solo dopo analisi in chat e dopo il dato del discriminante CHECK 2 / della sonda.
