# Tre micro fix di core, misurati prima e dopo

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `451e51aff`
**Prompt**: «Micro core: A1 (get_type), paused senza try/finally, getByName rotto»
**Referti che chiude**: `discovery_2026-08-30_gettype_finestra_parser.md` §6 (via A1) e §5
(il reperto collaterale), `discovery_2026-08-30_uniqueness_m2.md` §4.1 (R-M2-2)
**Sorgenti toccati**: due, `model/logicWrapper/LModelElement.tsx` e `api/data.ts`.
Tre test statici nuovi. Due sonde non committate, `_tmp_gettype_window.ts` (esistente,
**rigirata non modificata**) e `_tmp_getbyname_key.ts` (nuova, 14 check).

---

## 0. Il verdetto in quattro righe

1. **A1 e' entrato**: il gradino 3 di `get_type` non restituisce piu' il contenitore a una
   `DReference` senza tipo. Misurato: `Pointer_EOBJECT` dove prima c'era il padre, e la
   finestra del parser **identica** — 8 elementi, 0 dispatch, 0 righe di warning.
2. **`Constructors.paused` torna giu'** anche quando la parse solleva. Misurato: l'errore e'
   **la stessa stringa** di prima, e la create successiva passa da `committed: false` a
   `committed: true`.
3. **`getClassByName`/`getEnumByName` risolvono**, per la prima volta. Misurato sul proxy L
   vero: `AllNine` da `null` alla classe; il vecchio controllo positivo `'$AllNine'` si
   inverte e torna `null`, come deve.
4. **A valle non cambia quasi niente, e il quasi e' uno solo.** Il gradino 2 di `get_type`
   **non** e' fra i beneficiari: e' morto per una seconda ragione, indipendente, misurata
   qui per discriminazione (§4). L'unico consumatore vivo e' `edgeCandidate.ts`, e li' il
   comportamento e' **nuovo** (§5).

---

## 1. Il metodo: la stessa sonda, due volte, senza toccarla

`_tmp_gettype_window.ts` esisteva gia' e conteneva tre `check` che **asseriscono il difetto**
(«col campo D falsy, get_type restituisce IL PADRE», «un eType irrisolvibile lascia il
costruttore in pausa», «dopo la rottura la create resta NON committata»). Rigirarla
**non modificata** sul codice corretto e' quindi la misura piu' forte disponibile: se il fix
funziona, esattamente quei tre passano a FAIL e **nient'altro si muove**.

I sorgenti sono stati riportati a `HEAD` con `git show HEAD:<path>` per la corsa di baseline
e ripristinati subito dopo, cosi' che il prima e il dopo siano la stessa giornata, la stessa
pagina e lo stesso fixture — CLAUDE.md §5, «non fidarsi dei fixture a memoria fra sessioni».

**Nota sul conteggio.** Il referto del 30-08 dichiarava «15 check». Sul file com'e' oggi le
asserzioni `check` sono **10**; le altre righe sono `MEAS`. Riportato il numero misurato.

| corsa | esito |
|---|---|
| `HEAD` pristine, oggi | **10 PASS / 0 FAIL, ALL GREEN**, zero errori di pagina |
| col fix, sonda identica | **7 PASS / 3 FAIL**, zero errori di pagina |

I tre FAIL sono i tre `check` che descrivevano il difetto. Nessun altro si e' mosso.

---

## 2. A1 — il gradino 3 non inventa piu' il padre

`LModelElement.tsx`, gradino 3 di `LTypedElement.get_type`. Una riga, piu' la costante presa
da `windoww.Defaults` con lo stesso schema gia' usato due volte nello stesso file (`:1418`,
`:4390`).

```ts
// prima
return LPointerTargetable.fromPointer(c.data.className === 'DReference' ? c.data.father : 'Pointer_ESTRING');
// dopo
const Defaults: typeof TDefaults = windoww.Defaults;
return LPointerTargetable.fromPointer(c.data.className === 'DReference' ? Defaults.Pointer_EOBJECT : 'Pointer_ESTRING');
```

Misura, stesso `check` della sonda, stesso input (`SetFieldAction(ref, 'type', undefined)` su
una reference figlia di `ProbePerson`):

| | `data.type` | `.type` letto dal L | e' il padre? |
|---|---|---|---|
| prima | `undefined` | `{id: …_120, name: 'ProbePerson'}` | **si'** |
| dopo | `undefined` | `{id: 'Pointer_EOBJECT', name: 'EObject'}` | **no** |

`Pointer_EOBJECT` e' una `DClass` vera nello store (`redux/store.tsx:340`), quindi
`get_classType`/`get_primitiveType`, che leggono `.isClass` **senza guardia**, ricevono la
stessa forma di prima. Il ramo non-`DReference` resta `'Pointer_ESTRING'`, e la misura lo
conferma: `greet` (DOperation) e `fullName` (DAttribute) escono `EString` in entrambe le corse.

### 2.1 Non-regressione della finestra del parser

Le sette righe della sonda che descrivono la zona sono **identiche numero per numero** nelle
due corse:

| grandezza | pristine | col fix |
|---|---|---|
| elementi prodotti dal parse | 8 | 8 |
| dispatch Redux durante la parse sincrona | 0 | 0 |
| `\|idlookup\|` durante la parse | 112 → 112 | invariato |
| leggibili per catena di prototipi / own key | 8 / 0 | 8 / 0 |
| committati dopo l'assestamento | 8/8 | 8/8 |
| `home` (reference cross-classe) | `ProbeHouse` | `ProbeHouse` |
| `friend` (self-reference legittima) | `ProbePerson` | `ProbePerson` |
| righe console `DTypedElement: cannot resolve` | **0** | **0** |
| righe console `LinkAllNames() can't find type target` | **0** | **0** |
| errori di pagina | nessuno | nessuno |

Le due righe a zero sono un'assenza misurata e non un canale spento: `Log.ww` stampa sempre
(`Log.ts:187`), e la sonda registra ogni riga di console.

---

## 3. `Constructors.paused` — il flag che restava alzato

`api/data.ts`, `EcoreParser.parse`. `try/finally` attorno ai quattro passi che stavano fra i
due flag; **nessun `catch`**, quindi l'eccezione esce dal metodo come prima.

Misura, stesso `.ecore` rotto della sonda (`eType="#//DoesNotExist"`):

| | prima | dopo |
|---|---|---|
| `Constructors.paused` prima dell'import rotto | `false` | `false` |
| `Constructors.paused` dopo | **`true`** | **`false`** |
| errore sollevato | `[Error]LinkAllNames() can't find type target:` | **la stessa stringa** |
| create successiva: `readable` | `true` | `true` |
| create successiva: **`committed`** | **`false`** | **`true`** |

La riga che conta e' l'ultima. Prima del fix, da quel momento in poi ogni elemento creato
nella sessione restava in `pendingCreation` e non entrava mai nello store: l'app continuava a
rispondere, e ogni nuova creazione spariva al primo reload. Dopo il fix il fallimento resta
**esattamente altrettanto rumoroso** — stessa eccezione, stessa stringa — e smette di essere
silenziosamente contagioso.

---

## 4. `_impl_getByName` — la chiave, e il consumatore che non ne beneficia

La convenzione e' `"$" + nome`, e **non e' un'inferenza dal sorgente**: la sonda la legge
sull'oggetto vivo. `Object.keys(mm.classes)` non numeriche = `["$Config","$Color","$Red",
"$Green","$Blue","$AllNine"]`; su `mm.enumerators` = `["$Palette","$Stroke"]`. Coerente con i
tre produttori (`U.toNamedArray` `common/U.tsx:2083`, `LPackage.get_classes` `:1902`,
`LPackage.get_enumerators` `:1909`).

Misura sul proxy L vero del metamodello `Smoke` del fixture:

| chiamata | prima | dopo |
|---|---|---|
| `getClassByName('AllNine')` | `null` | **la classe** |
| `getClassByName('allnine')` | `null` | **la classe** (stesso id) |
| `getClassByName('$AllNine')` | **la classe** | `null` |
| `getClassByName('NoSuchClassHere')` | `null` | `null` |
| `getEnumByName('Palette')` / `('palette')` | `null` / `null` | **l'enum** / **l'enum** |
| `getEnumByName('NoSuchEnumHere')` | `null` | `null` |
| `getClassByName('EInt')` | `null` | `null` — il pool e' il modello |

La terza riga e' il vecchio controllo positivo del referto gemello, e si **inverte** di
proposito: il `'$'` appartiene alla chiave, non al nome che il chiamante passa. La quarta e la
sesta sono i controlli negativi, verdi in entrambe le corse.

Nota sulla corsa pristine: il check «risolve anche in minuscolo» passa a vuoto li'
(`null === null`). Non e' una misura del prima; e' il caso in cui la forma dell'asserzione non
discrimina, ed e' dichiarato invece che contato.

### 4.1 Il gradino 2 di `get_type` non e' fra i beneficiari

`model` e' dichiarata `let model: LModel = null as any;` e **non e' mai assegnata**: in
`get_type` come in `set_type` la riga e' `if (!model) this.get_model(c);`, il cui valore di
ritorno viene scartato. Le quattro `if (model) …` (`get_type:1388,1395`, `set_type:1443,1453`)
sono morte per una ragione **indipendente dalla chiave**. Controllo positivo del grep sulla
stessa finestra: gli assegnamenti `type =` e `ptr =` ci sono e si vedono — e' `model` a non
averne.

Non fidandosi del sorgente da solo, la sonda lo misura **per discriminazione**. `EInt` e' una
`DClass` nello store (`redux/store.tsx:334`) ma **non** e' fra le classi del modello, e le due
vie del gradino 2 danno risposte diverse su quell'input:

- `model.getClassByName('EInt')` → `null` (misurato, riga 7 della tabella sopra)
- `Selectors.getByName(DClass, 'EInt', false, true)` → `{id: 'Pointer_EINT', name: 'EInt'}`

Scritto `data.type = 'EInt'` con una `SetFieldAction` diretta (che salta `set_type`), `.type`
letto dal L vale **`Pointer_EINT`**, in **entrambe** le corse. Se il gradino 2 fosse passato
dal modello, la risoluzione sarebbe fallita e il valore sarebbe caduto al gradino 3.
Quindi: il gradino 2 passa da `Selectors`, `model` e' null, e questo fix non lo tocca.

**Dichiarato, non corretto** (regola 9). Assegnare `model` sarebbe un cambio di comportamento
su un percorso mai esercitato, e restringerebbe il pool da globale a per-modello: e' una
decisione di design, non un refuso da chiudere di passaggio.

---

## 5. `edgeCandidate` — l'unico consumatore vivo, e il comportamento nuovo

`components/editors/views/data/edgeCandidate.ts:59` e' l'unico sito in albero che chiamava
`getClassByName` e che **non** e' morto per altra via. A valle: `findEdgeCandidate` →
`InfoData.tsx:157` → `<EdgeCandidateBanner>`, il riquadro «Looks like an edge candidate» con
il bottone «Apply suggestions», nella tab **Apply to** delle proprieta' di una view.

La pipeline che il fix sblocca e' la **seconda** e la **terza** del file: `oclCondition` e
`jsCondition` che nominano una classe (`self.instanceof.name = 'X'`,
`data.instanceof.name == 'X'`), su una view con `appliableToClasses` **vuoto**. La prima via
(`appliableToClasses` con un id) non passa da qui e non cambia.

Misurato (classe `EdgeProbe` con esattamente due reference, `srcEnd` e `tgtEnd`, creata nel
metamodello del fixture):

| | prima | dopo |
|---|---|---|
| la classe risolta per nome | `null` | `{name: 'EdgeProbe', refs: ['srcEnd','tgtEnd']}` |
| verdetto di `findEdgeCandidate` | `null` | `{classifier: 'EdgeProbe', refNames: ['srcEnd','tgtEnd']}` |
| contrasto — nome inesistente | `null` | `null` |
| contrasto — classe senza due reference (`Config`) | `null` | `null` |

**Questo e' comportamento nuovo su un percorso mai esercitato, e va detto come tale**: il
banner puo' ora comparire dove non compariva mai. Non e' distruttivo — e' una suggestione, e
l'`Apply` resta un gesto dell'utente, che scrive `isEdge`, `edgeSource`, `edgeTarget` e
`appliableToClasses` in una sola `TRANSACTION` (`InfoData.tsx:120-129`). Ma e' l'unica
differenza a schermo prodotta da questa slice, e chi guardera' un progetto con view
condizionate per nome la vedra'.

Sul pool: `resolveClassifierByName` cicla `project.metamodels` e prende **il primo** che
risponde. Con due metamodelli che dichiarano una classe omonima, la scelta e' silenziosa —
la riga 14 della matrice §4 del referto gemello, che questo fix **non** cambia e ora rende
raggiungibile.

### 5.1 Limite dichiarato: il banner non e' stato visto a schermo

`InfoData` vive nella tab «Apply to» di `ViewData`, e solo per una view **senza IR**
(`ViewData.tsx:106`). Il fixture `rowviews` non ne ha nessuna: misurato, `DViewElement` in
`idlookup` = **0** (l'unico elemento «View» e' il `DViewPoint` `Default`), coerente con
R-IRN-15 che ha smesso di seminare le 21 view di default.

La fase C della sonda ricostruisce quindi la **pipeline** di `findEdgeCandidate` — regex e
forma del verdetto ricopiate verbatim da `edgeCandidate.ts`, immutate da questo fix — con il
perno reale, `mm.getClassByName`, che e' la funzione vera. E' una misura del predicato, non
del componente: la stessa distinzione, e la stessa forma, di §4.2 del referto sull'unicita'
M2 per il `rename` di JjScript. Il rendering del banner **non e' stato osservato**.

---

## 6. Il reperto gemello, che questa slice non tocca

`getByName2` (`selectors.ts:311`) e la chiave `$nome` scelgono duplicati **diversi**: con due
omonimi, il primo restituisce il primo in ordine di `idlookup`, la chiave restituisce
l'ultimo. E' la slice S1-M2, e la decisione e' al design.

Questo fix lo rende **piu' visibile, non piu' grave**: `getClassByName` passa da «non risponde
mai» a «risponde con l'ultimo omonimo», perche' `toNamedArray` sovrascrive `$nome` a ogni giro
(§4 riga 2 del referto gemello). Prima l'ambiguita' era invisibile perche' la funzione era
inerte; ora e' una scelta silenziosa come le altre quattordici della matrice. Nessuna delle
quattordici e' peggiorata; una che non partecipava ha cominciato a partecipare.

---

## 7. I test

Statici sul sorgente, come `joiner/__tests__/dTypedElement.test.ts`, e per la stessa ragione,
**misurata qui e non ricordata**: un test usa-e-getta che importa `LModelElement.tsx` sotto
vitest solleva `ReferenceError: window is not defined` da
`monaco-editor/esm/vs/base/browser/window.js:14`, tirata dentro dalla barrel `joiner`, con
`vitest.config.ts` in ambiente `node`. La prova di comportamento sono le due sonde.

| file | casi | controllo negativo |
|---|---|---|
| `model/__tests__/getTypeFallback.test.ts` | 7 | riportata la riga a `c.data.father` → **1 rosso** |
| `api/__tests__/parserPaused.test.ts` | 7 | tolto il `try/finally` → **2 rossi** |
| `model/__tests__/getByNameKey.test.ts` | 7 | riportato il lookup alla chiave nuda → **2 rossi** |

Ogni suite e' stata girata contro la propria versione difettosa: un test verde su un
sorgente corretto e verde anche su quello sbagliato non misura niente.

`getByNameKey.test.ts` e' inoltre un test di **coerenza fra file**: se un giorno un produttore
cambiasse convenzione di chiave, andrebbe rosso li' invece che in silenzio a runtime.

---

## 8. Gate

| gate | esito |
|---|---|
| `npm run typecheck` | **33 = baseline**, exit 2 come la baseline, conta presa sull'output completo (126 righe). Le 3 righe di `api/data.ts` sono le preesistenti (`DDataType` ×2, `Json`), a numeri di riga spostati di +14 dal diff; **zero** righe nominano `LModelElement.tsx` |
| `npm run build` | exit **0**, solo il chunk-warning |
| `npx vitest run` | **2140 passed / 0 failed**, coi 9 file rotti all'import = baseline nota. I 21 casi nuovi sono miei; i restanti +7 sui 2112 di ieri vengono dall'albero in volo della sessione parallela |
| `npm run smoke` | **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato |
| sonda `_tmp_gettype_window.ts` | 10/10 pristine, 7/10 col fix (i 3 attesi), zero errori di pagina |
| sonda `_tmp_getbyname_key.ts` | **14/14 ALL GREEN** col fix, 9/14 pristine (i 5 attesi), zero errori di pagina |

---

## 9. Limiti dichiarati

- **Il banner edge-candidate non e' stato visto a schermo** (§5.1). E' l'unica differenza
  visibile della slice, ed e' misurata a livello di predicato.
- **Un solo metamodello nel fixture.** Il caso cross-metamodello di `resolveClassifierByName`
  — due metamodelli con una classe omonima, primo che risponde vince — e' stato letto, non
  costruito.
- **`get_type` gradino 2 misurato per discriminazione, non per intercettazione.** Non e' stato
  possibile contare le chiamate a `getClassByName` (il proxy L non e' istrumentabile
  dall'esterno); la conclusione poggia sulla divergenza delle due vie su `'EInt'` piu' la
  lettura del sorgente.
- **`parseM1Model` non esercitato.** Le due sonde importano solo metamodelli. Il `try/finally`
  copre entrambi i rami per costruzione, ma la misura e' su M2.
- **I numeri di riga valgono per `451e51aff` piu' questo diff.**
