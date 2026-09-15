# DTypedElement — la risoluzione del tipo, misurata prima e dopo

**Data**: 2026-08-30
**Corsia**: completa (core, regola 5; go-ahead nel prompt di sessione)
**File toccati**: `joiner/classes.ts`, `examples/RowViewSmoke/index.ts`, `joiner/__tests__/dTypedElement.test.ts` (nuovo)
**Debito sciolto**: quello registrato il 2026-08-29 nella entry di `4c6bd845d`

---

## 1. Il difetto

`Constructors.DTypedElement` risolveva il tipo con `Selectors.getByName2(type)` — **un
argomento solo**. Nella firma `getByName2(name, dtype, caseSensitive, s)` il secondo
argomento diventa `classname`, e il corpo filtra con

```ts
if (classname !== (caseSensitive ? d.className : d.className.toLowerCase())) continue;
```

Con `classname === undefined` il confronto è vero per ogni voce dello `idlookup`: il ciclo
salta tutto e ritorna `null`. **Un lookup per nome che non poteva mai trovare niente.**

Sopravvivevano due sole forme: il pointer primitivo canonico (`/^Pointer_E[A-Z]+$/`, per un
corto circuito esplicito a monte) e un **oggetto**, che `getByName2` ritorna intatto sulla
riga `if (typeof name === 'object') return name`. Ogni id e ogni nome cadevano nel seed, e
il seed è asimmetrico: `Pointers.ESTRING` per un DAttribute, **il padre** per un DReference.

---

## 2. Riproduzione — la tabella su HEAD

Sonda `_tmp_dtyped_repro.ts` (non committata): crea una classe di servizio sul fixture
RowViewSmoke e ci appende un DAttribute e un DReference per ciascuna forma di input,
rileggendo `.type` dallo store. `Palette` è un DEnumerator, `Config` una DClass.

| input | DAttribute `.type` | DReference `.type` |
|---|---|---|
| enum id | ❌ EString | ❌ il padre |
| class id | ❌ EString | ❌ il padre |
| enum name | ❌ EString | ❌ il padre |
| class name | ❌ EString | ❌ il padre |
| enum proxy | ✅ Palette | ❌ il padre |
| class proxy | ✅ Config | ✅ Config |
| pointer primitivo canonico | ✅ EInt | ✅ EInt |
| `undefined` | EString (seed) | il padre (seed) |

**Righe di console che nominano DTypedElement: 0.** Il degrado era completamente muto.

Reperto oltre il difetto registrato: la riga **enum proxy → DReference**. Lì non è il
lookup a fallire — l'oggetto passa — ma lo `switch`, che per un DReference su un enum fa
`type = undefined` di proposito. Il rifiuto è **semanticamente giusto** (una reference punta
a una classe, non a un enum); è il sostituto a essere sbagliato, perché il seed le fa puntare
al proprio contenitore.

---

## 3. Il fix

`Constructors.resolveClassifier(type)`, privata, quattro forme in ordine di costo:

1. **oggetto** → scartato a `__raw` se è un proxy (la `className` di un proxy è già il nome
   D, CLAUDE.md §3.13: lo scarto serve all'identità, non allo switch);
2. **id** → `state.idlookup[type]`, la forma che un chiamante ha più spesso in mano e quella
   che si perdeva;
3. **nome** → `getByName2(type, cname, false, s)` **con entrambi gli argomenti**, una volta
   per ciascun tipo di classifier (`DClass`, `DEnumerator`, `DDataType`);
4. altrimenti `null`.

Due aggiunte allo `switch` e al seed:

- **`case 'DDataType'` accanto a `case 'DEnumerator'`.** Un EDataType è un tipo di attributo
  legittimo quanto un enum e ne condivide la regola (valido per attributo/parametro/
  operazione, rifiutato su una reference). Prima cadeva nel `default`, cioè in silenzio.
- **`Log.ww` sul seed**, con l'idioma già in uso a `classes.ts:730`, **guardato su
  `requested !== undefined`**: `type === undefined` è il seed usato come previsto — è così che
  il parser Ecore costruisce — e resta muto.

---

## 4. La tabella dopo

| input | DAttribute `.type` | DReference `.type` |
|---|---|---|
| enum id | ✅ **Palette** | il padre — rifiuto **dichiarato** |
| class id | ✅ **Config** | ✅ **Config** |
| enum name | ✅ **Palette** | il padre — rifiuto **dichiarato** |
| class name | ✅ **Config** | ✅ **Config** |
| enum proxy | ✅ Palette | il padre — rifiuto **dichiarato** |
| class proxy | ✅ Config | ✅ Config |
| pointer primitivo canonico | ✅ EInt | ✅ EInt |
| `undefined` | EString (seed) | il padre (seed) — **identico a prima, e muto** |

**Righe di console: 3**, esattamente i tre casi enum → DReference. Il rifiuto che era muto
ora si annuncia.

**Residuo dichiarato e non corretto**: il seed di un DReference rifiutato resta *il padre*.
Il valore è sbagliato (la reference punta al proprio contenitore), ma cambiarlo tocca il
contratto di `undefined`, da cui il percorso Ecore dipende. Fuori perimetro, e ora almeno
rumoroso.

---

## 5. Censimento dei chiamanti

Ogni sito che passa un `type` al costruttore, col verdetto sul cambio di comportamento.

| sito | cosa passa | prima | dopo | verdetto |
|---|---|---|---|---|
| `api/data.ts:885` parseDAttribute | `undefined` + field-write dopo | seed | **identico** | invariato (è il fix-C: passare la stringa raw la farebbe cadere nel seed) |
| `api/data.ts:914` parseDReference | `undefined` + field-write | seed | **identico** | invariato |
| `api/data.ts:958/979` parseDParameter/DOperation | nessun argomento | seed | **identico** | invariato |
| `jjscript/.../create.ts:414` attributo | `Defaults['Pointer_' + SHORT]` | corto circuito | **identico** | invariato — il suo commento dichiara di dipendere da quel ramo, che resta |
| `jjscript/.../create.ts:473` reference | `undefined` | seed | **identico** | invariato |
| `jjscript/.../create.ts:582` operazione | **nome corto** (`'EInt'`) | ❌ il padre | ✅ **EInt** | **cambia, in meglio**: `create operation f : EInt` dava all'operazione il tipo della propria classe |
| `jjscript/.../create.ts:638` parametro | **nome corto** (`'EInt'`) | ❌ EString | ✅ **EInt** | **cambia, in meglio**: ogni parametro non-EString era degradato a EString |
| `LModelElement.tsx:2374` duplicate operazione | `context.data.type` (id) | ❌ il padre | ✅ il tipo vero | **cambia, in meglio** |
| `LModelElement.tsx:2583` duplicate parametro | `context.data.type` (id) | ❌ EString | ✅ il tipo vero | **cambia, in meglio** |
| `LModelElement.tsx:4034` duplicate reference | `context.data.type` (id) | ❌ il padre | ✅ il tipo vero | **cambia, in meglio** |
| `LModelElement.tsx:4437` duplicate attributo | `context.data.type` (id) | ❌ EString | ✅ il tipo vero | **cambia, in meglio** |
| `jjscript/.../copy.ts:231/249/265/286` | nessun tipo | seed | **identico** | invariato |
| `common/Dummy.ts:622-625` | `new3(ptrs, …)` | percorso pointers | **identico** | invariato |
| `examples/RowViewSmoke/index.ts` | era il **proxy**, ora l'**id** | ✅ funzionava col workaround | ✅ funziona senza | workaround ritirato, vedi §6 |

**Nessun chiamante dipendeva dal degrado.** I sei che cambiano lo fanno tutti nella stessa
direzione: ricevono il tipo che avevano chiesto. Nessuno dei sei aveva un test che pinnasse
il valore sbagliato.

---

## 6. Il workaround del fixture, ritirato

`4c6bd845d` (2026-08-29) aveva aggirato il difetto in `RowViewSmoke`, passando i tre tipi
come **proxy** con un cast invece che per id, e lasciando 16 righe di commento a spiegare
perché. Con il costruttore riparato il workaround non serve: i tre call site tornano a
`palette.id`, `stroke.id`, `config.id`, cioè alla forma che la firma chiede, e il fixture
diventa un chiamante del percorso corretto invece di un modo per evitarlo.

**Il fix non doppia il workaround**: la forma proxy continua a funzionare (ramo 1 di
`resolveClassifier`), la forma id ora pure. Misurato con `_tmp_tint_rung3.ts`, **7/7 ALL
GREEN** dopo il ritiro: `tint → Palette`, `stroke → Stroke`, `cfg → Config`, e la ladder del
renderer vince ancora al gradino 3 («CSS colour enum»), col gradino 4 non valutato.

---

## 7. Perché i test sono statici

`joiner/classes.ts` **non è importabile sotto vitest**. `joiner/types.ts:192` lega `window` a
livello di modulo (`export const windoww = window`), l'ambiente di `vitest.config.ts` è
`node`, e shimmare `window` non basta: jQuery, importata a catena, chiede un DOM vero
(misurato: `TypeError: Cannot read properties of undefined (reading 'createElement')` da
`jquery.js:979`), e jsdom non è installato — regola 4, niente dipendenze nuove. È la stessa
ragione già dichiarata in `services/export/__tests__/ecore-io.test.ts`, e la stessa che tiene
rossi all'import i 9 file di baseline della suite.

La prova di comportamento è quindi la sonda, e i 12 test statici pinnano il contratto perché
non torni indietro **in silenzio**, che è esattamente il modo in cui il difetto era passato
inosservato. **Controllo positivo**: portando `classes.ts` a HEAD, 10 dei 12 falliscono; i 2
che passano sono i due invarianti che non dovevano cambiare (il corto circuito sul pointer
canonico e il contratto del parser Ecore).

---

## 8. Verifica non riuscita, dichiarata

L'import Ecore end-to-end **non è stato esercitato da sonda**: `SaveManager.importEcore` non è
raggiungibile da `window`, il convertitore XML→JSON che l'app usa (`prxml2json.xml2jsonobj`)
viene esposto solo dentro la callback del file picker, e pilotare il picker da Playwright non
ha prodotto un `filechooser`. Non lo dichiaro verificato.

Quello che è misurato è l'**input esatto** che il parser Ecore passa al costruttore,
`undefined`, sulla riga finale delle due tabelle: identico prima e dopo, e muto. Il percorso è
inerte per costruzione (`resolveClassifier` ritorna `null` sulla prima riga per un input
falsy, come faceva `getByName2`), ed è pinnato da un test che rilegge `data.ts`.
