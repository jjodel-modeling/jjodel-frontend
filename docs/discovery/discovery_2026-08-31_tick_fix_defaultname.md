# Tick-fix — `defaultname` vede le create del proprio tick

**Data**: 2026-08-31
**Branch**: `alfonso-frontend-jjtl`, HEAD di partenza `312f2485f`
**Prompt**: «Tick-fix: defaultname vede le create del proprio tick», a valle di
`discovery_2026-08-30_uniqueness_m2.md` §5(b) e di `discovery_2026-08-30_s1m2_una_regola.md` §3.
**Ipotesi del prompt**: «`idlookup` e' un Proxy la cui `get` risolve le create pendenti ma la
cui ENUMERAZIONE non le elenca; il fix e' ALLA FONTE, rendendole enumerabili».
**Esito**: la fonte e' quella giusta, la diagnosi no. **`idlookup` non e' un Proxy**, e
**il `for...in` le pendenti le elenca gia'**. Cio' che non le vede sono le **collezioni** da cui
ogni namespace e' costruito. Il fix e' quindi alla fonte lo stesso — un indice delle pendenti
letto nei tre posti dove un namespace e' *deciso* — ma **non tocca `idlookup`**, e percio' non
apre nessun censimento dei suoi lettori.

**Sonde** (non committate, `.gitignore:66`): `_tmp_tick_recon.ts`, `_tmp_tick_recon2.ts` (Fase 1),
`_tmp_tick_verify.ts` (19 check, 0 FAIL), `_tmp_tick_import.ts` (7 check, 0 FAIL),
`_tmp_tick_residue.ts` (sole misure). Zero errori di pagina in tutte.

---

## 1. La misura che cambia la diagnosi

`_tmp_tick_recon.ts`, tutto dentro lo stesso `evaluate` di `pkg.addClass('TickReconProbe')`:

| misura | valore |
|---|---|
| `Object.prototype.toString.call(idlookup)` | `[object Object]` |
| `idlookup.__isProxy` | **false** |
| `Object.getPrototypeOf(idlookup) === DPointerTargetable.pendingCreation` | **true** |
| `Object.keys(idlookup).length` prima / dopo | 112 / **112** |
| `Object.keys(idlookup).includes(nuovoId)` | false |
| **`for (const k in idlookup)`**, conteggio prima / dopo | 114 / **115** |
| **`for...in` elenca il nuovo id** | **true** |
| `idlookup[nuovoId]` | presente |
| `pendingCreation[nuovoId]` | presente, `{className:'DClass', name:'TickReconProbe', father:'…_10'}` |
| `pkg.classes.length` prima / dopo | 6 / **6** |
| `pkg.children.length` prima / dopo | 8 / **8** |
| `pkg.childNames.includes('TickReconProbe')` | **false** |

Il meccanismo e' `reducer.ts:639`, una riga sola:
`ret.idlookup.__proto__ = DPointerTargetable.pendingCreation`. Catena di prototipi, non Proxy.
`Object.keys`/`values`/`entries` guardano le sole own key; `for...in` percorre la catena. La
misura di S1-M2 era corretta — era stata presa con `Object.keys` e `Object.values` — ma la
**conclusione** («nessuna enumerazione vede») non lo era, ed e' quella che questo referto
inverte. Rigirata identica in `_tmp_tick_verify.ts` G, sul codice di oggi: 166/166 own key,
`for...in` 169 e il nuovo id dentro.

**Percio' l'enumerabilita' non era il difetto.** Renderle own key di `idlookup` — la prima
opzione che il prompt elencava — sarebbe costata una mutazione dello stato committato a ogni
create, e **non avrebbe corretto niente**: `defaultname` legge `lfather.childNames`, i sei
namespace M2 leggono `pkg.classes` / `cls.allAttributes` / `father.children`, il namespace M1
legge `model.allSubObjects`. Sono tutte **collezioni**, scritte dalla `SetFieldAction` del
`_persistCallback` un tick dopo (CLAUDE.md §3.6). Una scansione di `idlookup` non compare in
nessuno di quei percorsi.

## 2. Il dizionario delle pendenti, misurato

| misura | valore |
|---|---|
| residui a riposo | **2**: un `DState` e un `DProject`, **entrambi senza `father`** |
| dopo cinque create | ancora **2** |
| dopo un import Ecore (Library.ecore), a 6 s | ancora **2**, gli stessi |
| dopo **due** import consecutivi, a 3 s | 17 — poi torna a 2: e' latenza di commit, non una perdita |
| a meta' di una finestra `paused` simulata a 500 create | 517 |
| costo di `pendingChildrenOf` su 517 pendenti | **0.027 ms** per scansione (media su 100) |

I due residui permanenti non hanno `father`: il filtro del fix non puo' raggiungerli. E' la
ragione per cui il filtro e' **sul padre** e non sull'assenza di commit.

## 3. Il fix

Una funzione nuova e tre innesti, tutti nel punto dove un namespace e' **deciso** — mai nelle
quindici scansioni che lo **consumano**.

- `nameUniqueness.ts` — `pendingChildrenOf(fatherIds)` legge `DPointerTargetable.pendingCreation`
  e filtra sul padre. Ritorna i D-raw: `name`, `id`, `father`, `className` sono gia' scritti dal
  costruttore di `Constructors`, e `className` e' il nome D, che e' quello che `refusalReason` e
  `m2KindOf` si aspettano comunque (CLAUDE.md §3.13).
- `getNamespaceOf` (M1) unisce le pendenti `DObject` del padre.
- `getM2NamespaceOf` (M2) raccoglie, nello **stesso** `switch` che costruisce il pool committato,
  l'insieme dei **padri** di quel namespace, e unisce le pendenti il cui `m2KindOf` e' lo stesso
  genere. Un solo `switch` decide le due meta', percio' non possono divergere.
- `defaultname` (`joiner/classes.ts`, **una** implementazione per 35 chiamate) concatena i nomi
  delle pendenti sotto lo stesso padre. Filtro: elementi **nominati** (`m2KindOf` non nullo, o
  `DObject`) — un `DVertex` o un `DValue` pendente non e' un nome che quel namespace tiene.

`NamespaceOptions.includePending` e' `true` per difetto — un verdetto **prospettico** («questo
nome e' libero adesso?») include cio' che e' stato creato tre istruzioni fa.

## 4. Il badge: misurato prima e dopo, ed e' **INVARIATO** — per scelta

Baseline rimisurata (`_tmp_tick_recon2.ts`, metamodello aperto, 4 `Concept_0` in un tick):
registro **0** a 1 s, **0** a 10 s, **4** appena arriva una scrittura qualunque. Il ritardo di
R-M2U-6 e' quindi reale e riprodotto.

Dopo il fix, lo stesso scenario non esiste piu' (i quattro prendono nomi distinti), quindi la
misura e' stata rifatta costruendo il duplicato **dalla porta del caricamento**, `DClass.new`
diretta, due omonime in un tick (`_tmp_tick_verify.ts` E): registro 0 prima, **0 a 9 s**, **2**
dopo una scrittura qualunque. **Ritardo invariato.**

E' una scelta, non un residuo. `detectDuplicateNames` e `detectM2DuplicateNames` lasciano
`includePending` al suo `false`, e la variante e' stata **misurata senza spedirla**
(`_tmp_tick_verify.ts` F): una pendente omonima di una classe viva aggiunta a mano al dizionario
porta lo scanner da `2` a `2` per difetto, e da `2` a `3` con `{includePending: true}`. La
ragione per non prenderla e' scritta nel prompt e confermata dalla misura di §2: un parse gira
con `Constructors.paused` alzato, quindi **tutto** il prodotto di un import sta nel dizionario
fino a `persist` (R-GT-2), e un badge che lo contasse lampeggerebbe a ogni importazione. La riga
che lo attiverebbe esiste, e' un argomento, ed e' documentata dove serve.

Limite dichiarato dello scanner, e la ragione per cui la variante rende `3` e non `4`: le
pendenti non vengono **iterate** (non stanno in nessuna collezione), quindi una pendente
duplicata emerge sull'elemento **committato** con cui collide, non come voce propria.

## 5. Che cosa e' verificato a schermo

`_tmp_tick_verify.ts`, 19 check, 0 FAIL, zero errori di pagina.

| | misura |
|---|---|
| **A** 4 `addClass()` senza nome in un tick | `Concept_0, Concept_1, Concept_2, Concept_3` |
| **A2** 3 `addClass()` a tick separati (non-regressione) | `Concept_4, Concept_5, Concept_6` |
| **B** attributi / reference / operazioni / literal / package / enum, ciascun gruppo in un tick | `attr_0..2`, `ref_0..2`, `fx_0..1`, `literal_0..2`, `pkg_0..1`, `enum_0..1` |
| **C** due `addClass('TickGate')` in un tick | la seconda **rifiutata**, `null`, col toast `Name "TickGate" already used by Class "TickGate"` |
| **C** controllo negativo, nello stesso tick | un nome libero passa |
| **D** rename verso il nome di una pendente | rifiutato, il nome resta `TickGateFree` |
| **G** la sonda del Proxy rigirata | `Object.keys` invariato (identico a S1-M2), `isProxy=false` e `for...in` la elenca (**inverte** S1-M2) |

E la sonda **S1-M2 rigirata non modificata** (`_tmp_s1m2_verify.ts`): **21 PASS identici**, e i
**due check che asserivano il difetto** invertono, come previsto —
«i quattro auto-nomi sono davvero uguali» ora e' falso (`Concept_0..3`), e di conseguenza le
quattro classi non accendono piu' nessun badge perche' **non sono piu' duplicate**. Il terzo
check di quel blocco, quello sul ritardo, resta PASS.

## 6. Import — non regredisce

`_tmp_tick_import.ts`, 7 check, 0 FAIL, su `src/__tests__/fixtures/xmi-m1/Library.ecore` vero,
attraverso `EcoreService.importFromXML` (la stessa porta della UI).

- `success: true`, `errors: []`, `warnings: []`, `Constructors.paused` tornato **giu'**.
- I **14** nomi dichiarati nel file arrivano **tutti**; **zero** nomi auto-generati nel
  risultato (controllo esplicito su `Concept_|attr_|ref_|fx_|literal_|enum_|pkg_|datatype_`
  seguiti da una cifra).
- Il **secondo** import dello stesso file non e' rifiutato dal namespace del primo: due
  metamodelli, due `Book` (R-M2U-2, controllo positivo).
- Dentro la finestra `paused` simulata a 500 pendenti: la scansione costa **0.027 ms**, e due
  auto-nomi consecutivi sono **distinti** (`Concept_0` / `Concept_1`) — il fix e' vivo anche li'.

## 7. Limiti dichiarati

- **Un solo livello di padre.** Con un `LModel` come padre, `allSubObjects` e' ricorsivo mentre
  la meta' pendente e' a un livello: un `DObject` pendente annidato sotto un `LValue` del modello
  non entra nel namespace del modello. Non ha un percorso di create nello stesso tick in albero,
  ed e' dichiarato invece che chiuso.
- **Un package pendente non e' un contenitore.** `packagesOfMetamodel` legge `allSubPackages`,
  che ritarda come ogni collezione: una classe pendente sotto un package **pendente** non entra
  nel pool dei classificatori. Angolo non costruito.
- **`defaultname` resta sul suo namespace.** Continua a confrontare contro `father.children` (piu'
  le pendenti dello stesso padre), non contro il namespace M2 ratificato, che per i classificatori
  e' l'intero metamodello. Allinearlo e' una decisione di scope che il prompt non apre. La
  conseguenza misurabile: un auto-nome puo' ancora nascere omonimo di una classe in un **altro**
  package — ed e' esattamente cio' che faceva prima.
- **Il filtro di `defaultname` e' leggermente piu' largo di `children`.** Include ogni pendente
  nominata dello stesso padre, quindi anche un `DDataType`, che `pkg.children` non elenca (§1.2
  del referto del 30-08). Vale **solo dentro il tick** e solo sulle pendenti; chiude di striscio
  il caso (a) di `uniqueness_m2` §5, che era gia' dichiarato non raggiungibile in produzione.
- **Nessun censimento di `idlookup`.** Non e' un'omissione: il contratto di `idlookup` non
  cambia, e la misura di §1 e' il controllo positivo che la domanda e' stata posta.
- **`defaultname` non ha unita'.** `joiner/classes.ts` non e' importabile sotto vitest (la
  barrel). E' coperto dalle sonde A/A2/B, sull'app viva.
- **Le 17 pendenti misurate a 3 s da due import** non sono state seguite fino allo zero nella
  stessa corsa: la corsa separata (`_tmp_tick_residue.ts`) misura 2 a 6 s da un import.

## 8. Gate

`npx tsc --noEmit` **33 su output completo, exit 2 = baseline**, nessuna riga nomina un file
toccato. `npm run build` exit **0**, solo il chunk-warning. `npx vitest run` **2214 passed /
0 failed**, **+17** (le unita' nuove), coi **9** file rotti all'import = baseline nota
(`jjtl/` ×7, `jjscript/` ×1, `utils/` ×1 — nessuno toccato). `npm run smoke` **12 passed /
0 failed / 3 skipped, VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato.

Le 17 unita' sono state girate contro **quattro versioni mutate**, una mutazione per volta:

| mutazione | rossi |
|---|---|
| `includePending` spento per difetto in `getM2NamespaceOf` | **8** |
| il filtro di genere (`m2KindOf === kind`) rimosso | **2** |
| il filtro sul padre rimosso in `pendingChildrenOf` | **3** |
| il filtro `DObject` rimosso in `getNamespaceOf` | **1** |
| modulo ripristinato | **0** (39/39) |
