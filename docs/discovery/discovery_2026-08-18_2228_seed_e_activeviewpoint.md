# Discovery 2026-08-18: `2.227 -> 2.228`, ritiro del seed e `activeViewpoint` a 0..1

**Data**: 2026-08-18, pomeriggio/sera.
**Branch**: `alfonso-frontend-jjtl` @ `1bcb5a245`, working tree pulito all'inizio e alla fine.
**Tipo**: discovery read-only (Fase 1 di 2). Hard stop al termine.
**Zona critica**: `frontend/src/redux/VersionFixer.tsx`. Non toccato. La Fase 2 richiede Layer
Impact Report e go-ahead esplicito.
**Base di partenza obbligatoria**: `docs/discovery/discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md`
(letto per intero; i suoi finding F1..F9 non sono rifatti, sono usati e in tre punti corretti — §7).
**Decisioni gia' prese e non rimesse in discussione**: R-IRN-11 (`null` e' la forma canonica del
vuoto), R-IRN-12 (fronte A e fronte B nella stessa passata `2.228`), R-IRN-13 (la bonifica dei
sessanta progetti non e' piu' dovuta), piu' il D4 del prompt (il difetto sul numero di revisione va
corretto prima di spedire `2.228`).

---

## 0. Ipotesi che questa discovery stava falsificando

1. «Il ritiro del seed e' una sottrazione da `Defaults.views`/`Defaults.viewpoints`.» — **Falsa.**
   Svuotare i registri e' la mossa che rompe di piu' (§4.3, §4.4): disabilita in silenzio R-IRN-9 e
   R-IRN-10, e lascia aperta per sempre la guardia di `reducer.ts:1104`.
2. «I puntatori pendenti da bonificare sono quelli elencati nel prompt (subViews, viewelements,
   pointedBy, viewpoint, transientProperties, VIEWS_RECOMPILE).» — **Incompleta.** La categoria
   piu' numerosa e' `DGraphElement.view` e le sue sottoclassi, che il prompt non nomina: 122
   occorrenze su 156 in un salvataggio reale misurato (§6.2).
3. «`selectors.ts:529` e il gradino `VP_Default` sono il rischio principale del fronte B.» —
   **Falsa.** Sono in una funzione senza chiamanti vivi (§4.5). Il rischio principale e' altrove.
4. «Il difetto F9 fa salire il numero di revisione di un gradino al primo salvataggio.» —
   **Piu' grave di cosi'.** Il numero e' **congelato a v2.3 per sempre** (§6.5).

---

## 1. Obiettivo

Preparare, senza scrivere codice, la migration `2.227 -> 2.228` e le modifiche che la accompagnano
sui due fronti che R-IRN-12 mette nella stessa passata: ritiro del seed del viewpoint `Default` con
le sue view, e `activeViewpoint` da `Pointer<DViewPoint, 1, 1>` a `Pointer<DViewPoint, 0, 1>` con
`null` come vuoto canonico.

---

## 2. Metodo, e i limiti di quello che si e' potuto misurare

**Quello che e' stato eseguito davvero**, non dedotto:

- `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:docs`, `npm run check:agents`
  dalla directory `frontend/`, con exit status registrato e conteggi presi su **output completo**
  (§3). Una prima invocazione del typecheck e' fallita con `ENOENT` sul `package.json` di root
  perche' la working directory era stata resettata: `EXIT=254`, zero errori contati. Il conteggio a
  zero **non era un risultato**, ed e' esattamente il caso che CLAUDE.md §5 descrive. E' stato
  ripetuto dalla directory giusta.
- L'esperimento di typecheck del blocco B5, con la modifica applicata al working tree, misurata e
  poi scartata (§5.5). `git status` e un `diff` byte a byte contro la copia di backup confermano che
  `classes.ts` e' tornato identico.
- Un censimento **eseguito** dei riferimenti a `Pointer_View*` dentro uno stato serializzato reale,
  con uno script Node che percorre l'albero (§6.2). E' un censimento di **forma**, non di
  popolazione: gira su `frontend/src/examples/statechartplus.ts`, che e' codice morto (R-IRN-13) e
  descrive un salvataggio vecchio. Serve a sapere **quali campi** puntano alle view, non **quanti**
  progetti ne hanno.

**Quello che non si e' potuto misurare da qui**: il corpus vero vive in `localStorage` nel browser
di Alfonso. Le cifre di popolazione restano quelle della sezione 7 del report di riferimento (due
progetti, uno con stato, venti default presenti e nessuna toccata).

**Sulle asserzioni di assenza** (R-RAIL-28): ogni «non esiste» qui sotto e' accompagnato dal comando
che lo sostiene. Le ricerche usano `command grep` (BSD grep 2.6.0-FreeBSD) e non il wrapper
interattivo su `ugrep --ignore-files`, perche' `--include` sul wrapper non filtra. Il controllo
positivo usato per validare lo scope: `command grep -rnI "from ['\"]\.\./joiner" frontend/src
--include="*.ts" --include="*.tsx" | wc -l` restituisce **97**.

### 2.1 File letti (path completi)

Codice:

- `frontend/src/redux/VersionFixer.tsx` — 1-180, 180-340 (`autocorrect`), 840-935, 1030-1257
- `frontend/src/common/Defaults.ts` — intero (160 righe)
- `frontend/src/redux/reducer/reducer.ts` — 95-115, 1085-1130, 1480-1597
- `frontend/src/redux/store.tsx` — 150-175, 215-355, 355-475
- `frontend/src/redux/defaults/views.ts` — indice dei quattordici siti di creazione
- `frontend/src/joiner/classes.ts` — 244-300, 1085-1245, 1411-1445, 1533-1700, 1806-1880,
  2885-2995, 3290-3372, 3455-3500, 3700-3715, 3985-4075
- `frontend/src/view/viewElement/view.tsx` — 180-330, 325-460, 570-590, 890-915, 1890-1960
- `frontend/src/utils/lastViewpoint.ts` — 1-240
- `frontend/src/redux/selectors/selectors.ts` — 85-100, 480-625
- `frontend/src/api/persistance/projects.ts` — 85-130, 195-285, 315-370
- `frontend/src/api/DTO/GetAllProjects.ts`, `frontend/src/api/DTO/ProjectResponseDTO.ts` — interi
- `frontend/src/utils/versionUtils.ts` — intero
- `frontend/src/components/topbar/SaveManager.ts` — 1-110
- `frontend/src/components/editors/views/NestedView.tsx` — 75-135, 305-325, 390-400, 535-555
- `frontend/src/components/editor-v2/Toolbar.tsx` — 200-235
- `frontend/src/pages/components/Project.tsx` — 130-200
- `frontend/src/common/U.tsx` — 110-160, 415-440
- `frontend/src/common/Dummy.ts` — 50-70
- `frontend/src/model/dataStructure/GraphDataElements.tsx` — 88-115
- `frontend/scripts/smoke/states.ts` — 1-200; `frontend/scripts/smoke/assertions.ts` — indice
- `frontend/src/redux/__tests__/versionfixer_2227_migration.test.ts`,
  `frontend/src/redux/__tests__/versionfixer_2226_classification.test.ts` — intestazioni e struttura

Normativi: `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md` (serie R-IRN, righe 649-817),
`docs/claude-code-log.md` (testa).

---

## 3. Blocco D — le baseline, misurate prima di qualunque ipotesi

Tutte eseguite da `/Users/alfonso/jjodel/frontend` il 2026-08-18, su working tree pulito.

| Gate | Comando | Exit | Misura |
|---|---|---|---|
| Typecheck | `npm run typecheck` | **2** | **33** righe `error TS` su output completo |
| Test | `npm run test` | **1** | **59** suite, **9 fallite**, **1315 test passati**, 2.48s |
| Build | `npm run build` | **0** | 41.67s, unico warning il chunk > 500 kB |
| Docs | `npm run check:docs` | **0** | 3/3 check, 0 warning |
| Agents | `npm run check:agents` | **0** | 2 file proiettati, allineati |

**Composizione dei 33 errori di typecheck** (per validare la cifra «14 su albero pulito» che il
prompt si aspettava): 12 × TS1261 + 7 × TS1149 = **19** errori di casing, tutti fra
`src/components/Settings/` e `src/components/settings/`, che esistono solo su un filesystem
case-insensitive. 33 − 19 = **14**. La cifra attesa e' confermata senza bisogno di costruire un
albero da `git archive`.

**Le 9 suite rosse**, tutte per `ReferenceError: window is not defined` in fase di raccolta, quindi
zero test eseguiti e zero test falliti:
`jjscript/__tests__/context-binding.test.ts`, `jjtl/__tests__/abstract-target.test.ts`,
`jjtl/__tests__/ai-prompt-sanitization.test.ts`, `jjtl/__tests__/circular-refs.test.ts`,
`jjtl/__tests__/executor-bridge.test.ts`, `jjtl/__tests__/executor-llayer.test.ts`,
`jjtl/__tests__/forall-mapping.test.ts`, `jjtl/__tests__/source-alias.test.ts`,
`utils/__tests__/UDComparator.test.ts`. **Nessuna tocca l'area di questo lavoro.**

### 3.1 D2 — quale gate coprirebbe una regressione su questi due fronti

**Lo smoke esiste**, contrariamente a quanto `docs/PROTOCOL.md` dichiara ancora nella sua «Nota di
implementazione per P8» («Lo smoke non esiste ancora»): `frontend/scripts/smoke/` contiene
`run.ts`, `states.ts`, `assertions.ts`, `calibrate.ts`, `console-baseline.json`, e
`frontend/package.json:102` registra `npm run smoke`. La nota di P8 e' stantia. Segnalato, non
toccato: e' fuori perimetro.

Detto questo, **lo smoke non copre nessuno dei due fronti**, e la ragione e' strutturale.
`states.ts:177-191` (`createProject`) crea un progetto **nuovo** attraverso la UI e lo apre; i tre
stati di `STATES` (`empty-project`, `empty-metamodel-tab`, `advanced-mode`) partono tutti da li'.
**Nessuno stato apre un progetto salvato**, quindi nessuna asserzione passa mai per
`VersionFixer.update` con uno stato che contiene le venti view di default.

Copertura per gate:

| Rischio | Gate che lo intercetta |
|---|---|
| Il progetto salvato non carica piu' (§4.3) | **nessuno**. Lo smoke non apre salvataggi |
| View di default distrutte dalla migrazione | **nessuno**, per lo stesso motivo |
| `DGraphElement.view` pendente (§6.2) | **nessuno** |
| `Defaults.check` che risponde `true` a tutto (§4.2) | **nessuno**: nessuna asserzione sul readOnly |
| Rotture di tipo dal fronte B | **typecheck** (misurato: 8 nuovi errori, §5.5) |
| Errori di console su progetto nuovo | **smoke A4**, contro `console-baseline.json` |
| Canvas collassato / non montato | **smoke A1, A2** |
| Logica pura della migration | **vitest**, ma solo se il corpo viene duplicato nel test (§6.3) |

**Input alla Fase 2**: se si vuole un gate su questi fronti, la cosa piu' economica e' un quarto
stato di smoke che semini `localStorage['projects']` con un salvataggio a versione `2.227` e apra
quel progetto, piu' un test vitest sulla funzione pura della migration secondo la convenzione di
§6.3. Il primo dei due e' il solo che vede la catena vera.

---

## 4. Blocco A — blast radius del ritiro del seed

### 4.1 A1 — censimento dei riferimenti

**Ricerche eseguite**, tutte su `frontend/src` e `frontend/scripts`, `--include="*.ts"
--include="*.tsx"`, con `frontend/src/examples/` escluso a valle perche' e' codice morto senza
importatori (riverificato: `command grep -rnI "from ['\"].*examples" frontend/src ... | grep -v
'^frontend/src/examples/'` → **exit 1, zero righe**; controllo positivo a §2).

**(a) `Defaults.viewpoints` — 13 occorrenze vive, 1 commentata**

| Sito | Categoria | Cosa succede col seed ritirato |
|---|---|---|
| `classes.ts:1181` | **fallback** | prima bocca del rubinetto (R-IRN-9). Da rimuovere col fronte B |
| `classes.ts:2899` | **costruzione** | inizializzatore `ProjectPointers`. Diventa `null` |
| `classes.ts:2924` | **costruzione** | inizializzatore `DProject`. Diventa `null` |
| `classes.ts:3327` | **identita'** | `get_viewpoints`: filtro R-IRN-9. **Da preservare** |
| `classes.ts:3353` | **fallback** | getter `activeViewpoint`. Da rimuovere col fronte B |
| `classes.ts:3467` | **identita'** | lista «tutti gli elementi», esclude i viewpoint di sistema |
| `lastViewpoint.ts:147` | **fallback** | terzo fallback di `resolveParentViewpoint`, mai rimosso |
| `Defaults.ts:89` | **costruzione** | costruisce `defaultViewPointsMap` di booleani |
| `Defaults.ts:106` | **identita'** | `isSystemViewpoint`. **Da preservare** (§4.3) |
| `view.tsx:339` | **fallback** | `new2`, default di `father0` — terza bocca del rubinetto |
| `view.tsx:340` | **fallback** | `new2`, default di `vp` — stessa bocca |
| `store.tsx:324` | **costruzione** | assertion di init. Sparisce col seed |
| `view.tsx:1899` | commentato | — |

**(b) `Defaults.views` — 4 occorrenze vive, 2 in commento**
`Defaults.ts:87` (costruzione della mappa), `classes.ts:3466` (identita': esclude le default dalla
lista «tutti gli elementi»), `classes.ts:3308` (dentro un blocco commentato), `Defaults.ts:115,119`
(commenti di `holdsOnlySystemViews`).

**(c) `Defaults.Pointer_View*` fuori da `Defaults.ts` — 20 occorrenze**
14 sono siti di **costruzione** in `redux/defaults/views.ts` (righe 54, 161, 301, 393, 436, 459,
501, 511, 534, 600, 685, 720, 767, 842), 2 in `store.tsx` (323 il viewpoint, 390 `Fallback`).
Le altre 4 sono **identita'**: `lastViewpoint.ts:137`, `view.tsx:374`, `view.tsx:375`,
`reducer.ts:1104`.

**(d) stringhe letterali `'Pointer_View...'` fuori dai file gia' contati — 15 occorrenze**
Queste sono le sedi che una revisione guidata dai registri **non vede**:

| Sito | Forma | Nota |
|---|---|---|
| `NestedView.tsx:105`, `:311` | `d.id.indexOf('Pointer_View') === 0` | identita' per namespace |
| `Dummy.ts:59` | `deletedID.indexOf('Pointer_View') !== -1` | blocca la delete delle default |
| `DV.tsx:1066` | `'Pointer_ViewEdge' + name` | **costruzione della ventunesima view** (F5) |
| `DV.tsx:1075, 1077, 1079` | `view={"Pointer_ViewEdgePoint"}` | **dentro il jsxString** di una view |
| `view.tsx:329, 338` | `'Pointer_View' + name` | costruzione, entrambe in blocchi commentati |
| `VersionFixer.tsx:861` | `e.id.startsWith('Pointer_ViewEdge')` | identita' in una migration passata |
| `VersionFixer.tsx:896, 903` | `e.id === 'Pointer_ViewEdge...'` | identita' in una migration passata |
| `selectors.ts:557` | `dvp.id === 'Pointer_ViewPointDefault'` | identita', gradino `VP_Default` (§4.5) |
| `FunctionComponent.tsx:192` | commentato | — |

**Il caso `DV.tsx:1075-1079` merita una riga sua.** L'id `Pointer_ViewEdgePoint` compare come
**testo dentro il jsxString** delle edge view, cioe' dentro un campo persistito. Il censimento sullo
stato serializzato lo conferma: 7 occorrenze in `DViewElement.jsxString`. Una migration che purga
per id non tocca quelle stringhe e non deve provarci: sono template, non puntatori.

**Conclusione A1**: la categoria **costruzione** sparisce col seed (20 siti: 14 in `views.ts`, 2 in
`store.tsx`, 1 in `DV.tsx`, piu' i 3 inizializzatori di `classes.ts`). Le categorie **identita'** e
**fallback** vanno decise una per una: le prime **si preservano** (sono i predicati di R-IRN-9 e
R-IRN-10 e le chiavi che la migration deve cercare), le seconde **si rimuovono** col fronte B.

### 4.2 A2 — `Defaults.check(id)`: quattordici chiamanti

`Defaults.ts:99-101`:
```ts
static check(id: Pointer): boolean {
    return !!(Defaults.defaultViewsMap[id] || Defaults.defaultViewPointsMap[id] || Defaults.defaultTypesMap[id]);
}
```

Il terzo termine, `defaultTypesMap`, copre i **dodici tipi primitivi** e non e' toccato da questo
fronte. Va detto perche' due chiamanti dipendono proprio da quello.

| Chiamante | Uso | Se `check` diventa `false` sui venti id |
|---|---|---|
| `Javascript.tsx:33`, `Js.tsx:35`, `Ocl.tsx:20`, `Jsx.tsx:18`, `ViewData.tsx:52`, `Selector.tsx:17`, `CountryPicker.tsx:17`, `Color.tsx:148`, `MTM.tsx:528`, `MySelect.tsx:18`, `Input.tsx:161` | gate `readOnly` | gli editor diventano scrivibili sulle default. **Inerte dopo il ritiro**: quelle view non esistono piu' |
| `view.tsx:578` | `set_isExclusiveView` bloccato sulle default | idem, inerte |
| `view.tsx:900` | `compiled_css` dei viewpoint esclusivi | idem, inerte |
| `lastViewpoint.ts:87` | flag `isDefault` per `auditGlobalCss` | `globalCssAudit.ts:75` (`if (v.isViewpoint && v.isExclusiveView && !v.isDefault) return v.isActive`) cambia ramo. Inerte per lo stesso motivo |
| `NestedView.tsx:396` | avviso «view di default a versione vecchia» | inerte |
| `Project.tsx:176` | **duplicazione di progetto** | **non inerte.** Vedi sotto |

**`Project.tsx:139-183` (`duplicateProject`) e' l'unico chiamante con una conseguenza reale.**
Rinnova **tutti** gli id dello stato tranne quelli per cui `Defaults.check` risponde `true`. Due
cose:

1. Il percorso gira sulla **dashboard**, sullo stato **compresso e non migrato** letto da
   `project.state`. Un salvataggio duplicato prima di essere aperto porta ancora dentro le venti
   default con i loro id canonici. Se `check` risponde `false`, quegli id vengono **rinominati** in
   id casuali; quando poi il duplicato viene aperto, la migration `2.228` — che cerca per id — non
   li riconosce piu' e li lascia vivi come view orfane. Non e' catastrofico, ma e' un caso da
   dichiarare.
2. `check` protegge anche i dodici `Pointer_E*`. Svuotare `Defaults.views`/`viewpoints` **non** li
   tocca, quindi quella meta' continua a funzionare. Sarebbe diverso se si toccasse `check` alla
   radice.

### 4.3 A3 — la guardia di `reducer.ts:1104`, e chi fallisce per primo

```ts
// reducer.ts:1103-1112
if (typeof Defaults.defaultViewPointsMap[Defaults.Pointer_ViewPointDefault] !== 'object') {
    for (let k in ret.idlookup) {
        let e = ret.idlookup[k];
        if (!e || typeof e !== 'object') continue;
        let v: DViewElement|DViewPoint = e as any;
        if (v.className.includes('DViewPoint')) Defaults.defaultViewPointsMap[k] = v;
        if (v.className.includes('DViewElement')) Defaults.defaultViewsMap[k] = v;
    }
}
```

**Perche' oggi la guardia si chiude.** `R.navigate` (`U.tsx:118-146`) fa sempre
`window.location.reload()` — riga 140, incondizionata. Non esiste navigazione client-side verso un
progetto. Quindi ogni apertura ricarica la pagina, `DState.init()` (`reducer.ts:1498`) legge l'hash,
e su `#/project` esegue `init_editor`, che semina viewpoint e view **prima** che
`SaveManager.load` giri. Il primo passaggio dal reducer trova in `idlookup` solo la roba seminata,
riempie le due mappe con **esattamente** i default, e la guardia si chiude. E' il motivo per cui
oggi `Defaults.defaultViewsMap` e' affidabile.

**Cosa succede senza seed, leggendo il codice.** `Pointer_ViewPointDefault` non diventa mai un
oggetto: resta il booleano `true` messo da `Defaults.ts:89` (o `undefined`, se si svuotano i
registri). `typeof` non e' mai `'object'`, quindi **il loop gira a ogni passaggio del reducer, per
sempre**, su tutto `idlookup`. Due conseguenze:

- costo: una scansione completa di `idlookup` per ogni azione;
- semantica: dopo il primo `LoadAction`, le due mappe contengono **ogni** `DViewElement` e ogni
  `DViewPoint` del progetto aperto, quindi `Defaults.check` risponde `true` su tutto — tutti gli
  editor di view diventano read-only, nessuna view e' cancellabile (`view.tsx:578`,
  `Dummy.ts:59` gia' per namespace), e `duplicateProject` smette di rinnovare gli id.

**Ma non e' questo il primo fallimento.** L'ordine dentro `VersionFixer.update` e':

1. righe 119-131, catena degli adapter (dove starebbe la purga);
2. righe 137-146, `LViewElement.updateDefaultView(v, s)` su ogni view con
   `version !== highestVersion && !clonedCounter`;
3. righe 148-154, loop di coda che reinietta i registri;
4. `LoadAction.new(save)` in `SaveManager.ts:57`, e solo qui si arriva al reducer.

Il passo 2 arriva per primo, e con le mappe di booleani fa questo (`view.tsx:1917-1924`):

```ts
let newView = Defaults.defaultViewPointsMap[v.id] || Defaults.defaultViewsMap[v.id];  // true
if (!newView) return;                       // true e' truthy: NON esce
newView = {...newView} as ...;              // {...true} === {}
newView.css_MUST_RECOMPILE = true;
newView.pointedBy = PointedBy.merge(newView, v);   // <-- riga 1923
```

`PointedBy.merge` (`classes.ts:1806-1811`) fa `for (let p of d2.pointedBy)` e poi
`for (let p of d1.pointedBy)`, dove `d1` e' l'oggetto vuoto. `undefined` non e' iterabile:
**TypeError a `view.tsx:1923`**.

**Sintomo osservabile**: l'eccezione risale a `VersionFixer.tsx:144`, poi a `SaveManager.load`, poi
al `try` di `reducer.ts:1519`, dove viene assorbita dal `catch` di riga 1577
(`Log.eDevv('Failed to fetch projects', {error})`). La pagina **non** crasha: il progetto
semplicemente **non carica**, con la schermata di caricamento appesa e un errore in console.
Nessun errore di compilazione, nessun warning.

Se invece la purga togliesse gli id da `idlookup` prima del passo 2 e i registri restassero pieni,
il passo 2 non li troverebbe piu' e il passo 3 li **rimetterebbe come booleani** dentro `idlookup`.
Da li' `Selectors.getAllViewElements` (`selectors.ts:89-95`) mapperebbe quei puntatori a `true`, e
ogni consumatore che legge `.className` su quel valore rompe. E' la stessa specie di guasto, un
passo dopo. **E' il motivo per cui R-IRN-12 dice che purga e ritiro sono la stessa mossa.**

**Risposta secca ad A3**: senza seed la guardia non si chiude mai; le mappe restano di booleani
fino al primo `LoadAction` e poi si riempiono delle view del progetto; il primo dei tre consumatori
a fallire e' **`updateDefaultView`**, con un `TypeError` a `view.tsx:1923` che impedisce il
caricamento del progetto senza far crashare la pagina.

### 4.4 A4 — il loop di coda 148-154: tre opzioni

```ts
for (let k in Defaults.defaultViewsMap)      { if (!s.idlookup[k]) s.idlookup[k] = Defaults.defaultViewsMap[k]; }
for (let k in Defaults.defaultViewPointsMap) { if (!s.idlookup[k]) s.idlookup[k] = Defaults.defaultViewPointsMap[k]; }
```

| Opzione | Cosa comporta | Contro |
|---|---|---|
| **(1) Lasciarlo, svuotando i registri** | i due `for...in` non iterano, no-op naturale | svuotare `Defaults.viewpoints` **rompe `isSystemViewpoint`** (`Defaults.ts:106` legge quell'array), quindi disabilita in silenzio il filtro R-IRN-9 di `classes.ts:3327` e la normalizzazione R-IRN-10 di `Toolbar.tsx:221`. Un `Default` conservato perche' contiene view autorate **ricomparirebbe** nella lista dei viewpoint. Rompe anche i due default di `view.tsx:339-340` (`Defaults.viewpoints[0]` diventa `undefined` → `father.id` su `undefined` → TypeError) |
| **(2) Renderlo condizionale** | i registri restano pieni (identita' preservata), il loop non reinietta piu' | serve una condizione esplicita e leggibile; e resta aperto il problema che i valori nelle mappe sono booleani, quindi `updateDefaultView` va comunque neutralizzato |
| **(3) Rimuoverlo** | massima chiarezza: non esistono piu' «default da aggiungere» | `updateDefaultView` va comunque neutralizzato (non dipende da questo loop); e si perde il meccanismo per eventuali future view di sistema |

**Interazione con `updateDefaultView`.** Il loop 137-146 e' **indipendente** dal loop di coda e va
trattato a parte in tutte e tre le opzioni. Oggi rigenera le default non toccate a ogni bump di
versione (`v.version !== VersionFixer.highestVersion && !v.clonedCounter`), ed e' il meccanismo che
le migration `2.220 -> 2.221`, `2.221 -> 2.222`, `2.222 -> 2.223` citano nei loro commenti come
«dual mechanism». Con il seed ritirato quel meccanismo **non ha piu' oggetto** e la funzione va resa
inerte per costruzione (uscita anticipata se il valore trovato non e' un oggetto), non per fortuna.

**Nota su `freshViewsMap`, che il prompt non nomina.** `Defaults.ts:93-159` definisce
`freshViewsMap`, `freshViewPointsMap`, `storeFreshViews()`, `getFreshView()`, con il commento
«This is used by updateDefaultView». **Non e' vero**: `updateDefaultView` legge
`defaultViewPointsMap`/`defaultViewsMap` (`view.tsx:1919`). Ricerca eseguita:
`command grep -rn "storeFreshViews\|freshViewsMap\|freshViewPointsMap\|getFreshView\|freshViewsInitialized"
frontend/src --include="*.ts" --include="*.tsx"` → **10 righe, tutte dentro `Defaults.ts`**, exit 0.
`storeFreshViews` non e' mai chiamata, quindi le due mappe sono **sempre vuote** e `getFreshView`
restituisce sempre `undefined`. E' codice morto con un commento che descrive un comportamento che
non c'e'. Non va rimosso in questa passata (Rule 9), ma non va nemmeno usato come appiglio.

**Osservazione utile per la scelta.** Se il viewpoint `Default` **sparisce da `idlookup`** ma
`Defaults.viewpoints` resta pieno, `classes.ts:3327-3329` fa
`Defaults.holdsOnlySystemViews(DPointerTargetable.fromPointer('Pointer_ViewPointDefault'))` su
`undefined`; `Defaults.ts:137-142` con `vp` undefined produce `ids = []` e `[].every(...)` e'
**`true`**, quindi il filtro lo esclude comunque. Il predicato regge gia' al caso «assente». E' un
argomento concreto a favore dell'opzione (2) o (3) contro la (1).

### 4.5 A5 — `selectors.ts:556-557` e la cascata `viewScores`/`stackViews`

Il gradino:
```ts
if (dvp.id === activevpid)                          tnv.viewPointMatch = ViewEClassMatch.VP_Explicit;
else if (dvp.id === 'Pointer_ViewPointDefault')     tnv.viewPointMatch = ViewEClassMatch.VP_Default;
else if (!dvp.isExclusiveView)                      tnv.viewPointMatch = ViewEClassMatch.VP_Decorative;
else                                                tnv.viewPointMatch = ViewEClassMatch.VP_MISMATCH;
```

**Primo fatto, letto e non stimato** (`classes.ts:3992-3995`):

```ts
static VP_MISMATCH: number = Number.NEGATIVE_INFINITY;
static VP_Default = 1;
static VP_Decorative = 1;
static VP_Explicit = 2;
```

`VP_Default` e `VP_Decorative` **valgono lo stesso numero**. Cadere dall'uno all'altro non cambia
nessun punteggio. L'unica caduta che conta e' verso `VP_MISMATCH`, che a riga 562-564 corto-circuita
il calcolo. Le view di un viewpoint non attivo finiscono in `VP_MISMATCH` **solo se il loro
viewpoint e' esclusivo**; il costruttore mette `isExclusiveView = true` di default
(`classes.ts:1116`), quindi si', per il `Default` sarebbe `VP_MISMATCH`.

**Secondo fatto, che rende la domanda accademica.** `updateScores` ha un solo chiamante,
`getAppliedViewsNew` (`selectors.ts:609-612`), e **`getAppliedViewsNew` non ha chiamanti vivi**.
Ricerca eseguita: `command grep -rn "getAppliedViewsNew" frontend/src --include="*.ts"
--include="*.tsx"` → **due righe**: la definizione a `selectors.ts:609`, e un **commento** a
`components/editor-v2/viewpoint/ir/irResolve.ts:7` che dice esplicitamente che il resolver di
editor-v2 «non passa da getAppliedViewsNew e non tocca mai transientProperties (il percorso
classico)». Controllo positivo sulla stessa forma di ricerca: `getAppliedViews` (prefisso piu'
corto) restituisce le stesse 2 righe, quindi non c'e' un alias che mi sfugge.

Ne segue che `transientProperties.node[nid].viewScores` non viene **mai popolato**: i consumatori
che lo leggono (`ContextMenu.tsx:101-102`, `Console.tsx:813`) trovano un dizionario vuoto. Questo e'
coerente con R-IRN-7 («il canvas v1 non e' raggiungibile dall'utente») e lo rafforza con una
misura sul chiamante invece che sul renderer.

**Risposta ad A5**: le view che oggi prenderebbero `VP_Default` finirebbero in `VP_MISMATCH`, non in
`VP_Decorative`, perche' il `Default` e' esclusivo. Ma la funzione che lo calcola e' irraggiungibile
dal codice vivo, quindi **la view scelta per un nodo non cambia**. Resta un rischio residuo se
qualcuno riattiva il renderer classico: la riga 557 va allora aggiornata insieme.

Va segnalato invece un pericolo **vero** e vicino, alla riga 553-556:
```ts
let dvp: DViewPoint = DPointerTargetable.fromPointer(dview.viewpoint, state);
if (dvp.id === activevpid) ...
```
`dvp` e' letto **senza optional chaining**. Una view il cui `viewpoint` punta a un viewpoint purgato
farebbe `TypeError: Cannot read properties of undefined (reading 'id')`. Oggi e' innocuo perche' la
funzione e' morta; e' il tipo di riga che si risveglia male.

### 4.6 A6 — test e fixture che dipendono dal seed

Ricerca eseguita:
`command grep -rlI "Pointer_View\|Defaults\.\|activeViewpoint\|VersionFixer" frontend/src
--include="*.test.ts" --include="*.test.tsx"` → **3 file**, exit 0:

- `components/editor-v2/viewpoint/ir/__tests__/irCreationSeed.test.ts` — l'unico match e' la parola
  «default» dentro un commento a riga 59 (`defaultObjectViewIR()`). **Nessuna dipendenza.**
- `redux/__tests__/versionfixer_2226_classification.test.ts` — **duplica** la cascata di
  classificazione e importa solo i marker da `utils/defaultViewTemplate` (modulo di sole stringhe).
  Nessuna dipendenza dal seed.
- `redux/__tests__/versionfixer_2227_migration.test.ts` — **duplica** il corpo della migration.
  Nessuna dipendenza dal seed.

**Nessuno dei 1315 test assume il seed**, e nessuna delle 9 suite rosse tocca quest'area (elenco a
§3). La convenzione che i due test VersionFixer stabiliscono e' esplicita e va seguita in Fase 2:
> `VersionFixer.tsx` non e' importabile nell'ambiente node di vitest (si tira dietro il joiner), quindi
> il corpo della migration si **duplica** nel test, e i valori condivisi (marker, costanti) si
> **importano** dai moduli puri perche' una modifica li' rompa il test invece di divergere in silenzio.

---

## 5. Blocco B — `activeViewpoint` a 0..1 con `null`

### 5.1 B1 — cosa restituiscono davvero `fromPointer(null)` e `fromPointer(undefined)`

`LPointerTargetable.fromPointer` (`classes.ts:2394-2414`) delega a `LPointerTargetable.wrap`, che a
`classes.ts:258-259` fa:

```ts
(data: D | Pointer | undefined | null, ...) {
    if (!data || (data as any).__isProxy) return data as any;
```

**A runtime**: `fromPointer(null)` restituisce **`null`**, `fromPointer(undefined)` restituisce
**`undefined`**. Il valore falsy passa attraverso senza trasformazione.

**Al livello dei tipi** e' diverso, e la divergenza va conosciuta. Il tipo di ritorno e' calcolato
per inferenza (`classes.ts:2404-2408`): con l'argomento `null` nessuno dei rami `T extends
Pointer<...>` unifica, quindi `UPP`/`LOW` restano i marcatori `'undefined_low'`/`'undefined_upp'` e
`RET` collassa sull'ultimo ramo, **`undefined`**. Cioe' il compilatore tipizza `undefined` cio' che
a runtime e' `null`.

**Conseguenza per il getter**: `get_activeViewpoint` non puo' semplicemente togliere il `||` e
sperare che il tipo torni. Serve una firma dichiarata a mano (`LViewPoint | null`) e un cast al
punto di ritorno; e' esattamente quello che l'esperimento di §5.5 ha dovuto fare per non generare
un errore in piu'. Alternativa piu' pulita, da valutare in Fase 2: normalizzare il ritorno a
`undefined` invece che a `null` **sul lato L soltanto**, tenendo `null` come forma persistita
(R-IRN-11 parla della forma canonica del **dato**, non del proxy). Decisione di Alfonso.

### 5.2 B2 — gli undici siti di lettura, rivisti uno per uno

Censimento rifatto con `command grep -rnI "activeViewpoint" frontend/src --include="*.ts"
--include="*.tsx"`, con `frontend/src/examples/` escluso a valle. La tabella di F7 regge, con **due
precisazioni**.

| Sito | Oggi | Con `null` | Intervento |
|---|---|---|---|
| `classes.ts:1181` | `getProject()?.activeViewpoint.id \|\| Defaults.viewpoints[0]` | **TypeError** su `.id` di `null` | **si'**: prima bocca del rubinetto, da chiudere. Misurato: errore TS2531 |
| `classes.ts:3353` | getter con `\|\| Defaults.viewpoints[0]` | va riscritto | **si'** (§5.1) |
| `classes.ts:3355-3361` | setter, `Pointers.from(val0)` | vedi B3 | **si'** |
| `view.tsx:373-375` | `activeVP?.id !== Pointer_ViewPointDefault` | `activeVP` null → ramo `else` → `fromPointer(Pointer_ViewModel)` → **`undefined`** dopo il ritiro → TypeError a `view.tsx:442` (`parentView.__raw`) | **si', e non solo per il fronte B**: `newDefault` e' vivo, chiamato da `ContextMenu.tsx:616,619,626,629` |
| `view.tsx:903` | `dproject.activeViewpoint === c.data.id` | `null === id` e' `false`: **sicuro** | no |
| `selectors.ts:529` | `project.activeViewpoint.id`, senza `?.` | TypeError, ma **funzione morta** (§4.5) | tipizzazione si', urgenza no |
| `NestedView.tsx:82` | `project.activeViewpoint.id` | TypeError | **si'**. Vedi B3 |
| `NestedView.tsx:110-111, 314-315` | legge e **scrive** | vedi B3 | **si'** |
| `NestedView.tsx:544` | `ret.active = ret.project.activeViewpoint` | tipo `LViewPoint` non accetta `null` | **si'**, misurato |
| `TreeViewContent.tsx:2328` | `project?.activeViewpoint?.id \|\| undefined` | gia' sicuro | no |
| `ViewParentingFields.tsx:49` | `?.activeViewpoint?.id` | gia' sicuro | no |
| `lastViewpoint.ts:136` | `LProject.getProject()?.activeViewpoint` tipizzato `LViewPoint \| undefined` | assegnare `null` a `undefined` non compila | **si'**, misurato |
| `projects.ts:338` | copia grezza | vedi B4 | vedi B4 |

**Precisazione 1 — `Toolbar.tsx` non e' un lettore di `activeViewpoint`.** F7 lo elenca fra gli
undici. `Toolbar.tsx:202` legge `useSelector((state: any) => state.viewpoint)`, cioe' la **root**
`state.viewpoint`, non `DProject.activeViewpoint`. Le due cose sono tenute allineate da
`activateViewpoint`, ma sono campi distinti e il fronte B tocca solo il secondo. La normalizzazione
di R-IRN-10 (`Toolbar.tsx:221`) resta pertinente ma per un'altra ragione.

**Precisazione 2 — `activateViewpoint` non sa disattivare.** `lastViewpoint.ts:49-64`:
```ts
if (viewpointId && projectId) {
    SetFieldAction.new(projectId, 'activeViewpoint', viewpointId, '', true);
}
SetRootFieldAction.new('viewpoint', viewpointId || '', '', true);
```
Con `viewpointId === null` (cioe' quando l'utente sceglie «Abstract syntax» nel selettore,
`Toolbar.tsx:232`: `activateViewpoint(vpId || null)`) **il primo `SetFieldAction` non parte**: la
root si azzera, `DProject.activeViewpoint` resta al valore precedente. E' un difetto **gia' vivo
oggi**, che il fronte B rende visibile e deve chiudere: senza toccarlo, `null` non e' mai
scrivibile da UI.

### 5.3 B3 — il percorso di scrittura di `NestedView`

`NestedView.tsx:111` e `:315` fanno `project.activeViewpoint = ptr as any`, cioe' passano dal
setter L `LProject.set_activeViewpoint` (`classes.ts:3355-3361`), che fa
`let val = Pointers.from(val0)`.

`Pointers.from` (`classes.ts:1671-1675`):
```ts
public static from(data: unknown | unknown[]): null | PTR | PTR[] {
    if (!data) return null;
    ...
}
```
**`Pointers.from(null)` restituisce `null`**, e `Pointers.from(undefined)` pure. Quindi il setter
scriverebbe `SetFieldAction.new(id, 'activeViewpoint', null, '', true)`. Il percorso **accetta gia'
`null`** senza modifiche: la forma canonica di R-IRN-11 e' compatibile col setter esistente.

Resta da verificare in Fase 2 che il reducer e il canale collaborativo trattino `null` come valore
e non come cancellazione (`SetFieldAction` con `''` come modifier, non `-=`); dalla lettura del
setter non c'e' niente che lo faccia pensare, ma non l'ho eseguito.

Nota: `NestedView` e' importato/riesportato da `components/editors/index.ts:8` ed e' citato come
host del tab «Viewpoints» in `TabDataMaker.tsx:7,37`. Non l'ho verificato a schermo.

### 5.4 B4 — persistenza: `null` sopravvive, e `projects.ts:338` non fa quello che sembra

Tre percorsi distinti, e conviene non confonderli.

**(a) Lo stato compresso — e' questo che porta `activeViewpoint`.**
`ProjectsApi.save` (`projects.ts:107`) chiama `U.compressedState(dProject)`, che a `U.tsx:429-440`
prende `store.getState()`, sostituisce `idlookup[pid]` con il `DProject` corrente, fa
`JSON.stringify` e poi `compressToUTF16`. In lettura, `reducer.ts:1564` fa
`JSON.parse(await U.decompressState(project.state))`. **`null` sopravvive**: e' un valore JSON di
prima classe, a differenza di `undefined` che sparirebbe dalla serializzazione. E' l'argomento che
R-IRN-11 gia' porta, e il codice lo conferma.

**(b) `projects.ts:338` non e' il percorso del progetto aperto.** La riga
`pointers.activeViewpoint = raw.activeViewpoint` sta dentro `Online.getAll()`, cioe' la **lista
della dashboard in modalita' online**, costruita dai DTO del server. Due cose:

- **il DTO non dichiara il campo.** `frontend/src/api/DTO/GetAllProjects.ts` elenca 12 campi e
  `activeViewpoint` **non c'e'**; `ProjectResponseDTO.ts` nemmeno. Quindi `raw.activeViewpoint` e'
  `undefined` a meno che il server non mandi un campo extra che il cast
  `as unknown as DTOProjectGetAll[]` lascia passare a runtime.
- **`DProject.new2` non legge quel campo.** `classes.ts:2982-2992` usa solo `pointers.father` e
  `pointers.id`. L'unico effetto residuo della riga 338 e' il `if (k in pointers) continue` della
  callback a `projects.ts:343`: mettere la chiave in `pointers` **impedisce** che `raw.activeViewpoint`
  venga copiato su `d`. E' una scrittura quasi morta, con un effetto collaterale di soppressione.

**(c) In modalita' offline il campo non passa di li' affatto.** `Offline.getAll`
(`projects.ts:208-232`) usa `DProject.new(...)` e nove `SetFieldAction` espliciti; `activeViewpoint`
non e' fra questi, quindi il valore viene dall'inizializzatore di campo `classes.ts:2924`. Portarlo
a `null` cambia **il default dei DProject della dashboard**, non il valore dei progetti aperti.

**Risposta a B4**: `null` sopravvive al giro `JSON` / `compressToUTF16` / `decompressFromUTF16`. Il
DTO lato server non tratta il campo: non lo accetta e non rimanda un default, semplicemente non lo
conosce. Se si vuole che il vuoto arrivi anche alla lista della dashboard in modalita' online,
serve aggiungere il campo al DTO — decisione a parte, e fuori dal minimo necessario.

### 5.5 B5 — la misura del typecheck

**Modifica applicata al working tree, non committata**, su `frontend/src/joiner/classes.ts`:

```
2899  activeViewpoint: Pointer<DViewPoint, 1, 1> = Defaults.viewpoints[0];
   →  activeViewpoint: Pointer<DViewPoint, 0, 1> = null;
2924  (identica)
3017  activeViewpoint!: LViewPoint;            →  activeViewpoint!: LViewPoint | null;
3353  return LViewPoint.fromPointer(context.data.activeViewpoint || Defaults.viewpoints[0]);
   →  return LViewPoint.fromPointer(context.data.activeViewpoint) as any as this['activeViewpoint'];
```

**Risultato**: `npm run typecheck` → **exit 2, 41 errori** (baseline 33). **Otto errori nuovi**,
nessuno sparito:

```
src/joiner/classes.ts(1181,23):   TS2531  Object is possibly 'null'
src/joiner/classes.ts(3353,39):   TS2345  NotAString<DViewPoint,0,1,...> | null non assegnabile
src/joiner/classes.ts(3355,47):   TS2344  this["activeViewpoint"] non soddisfa il vincolo orArr<...>
src/redux/selectors/selectors.ts(529,49):        TS18047 'project.activeViewpoint' is possibly 'null'
src/utils/lastViewpoint.ts(136,15):              TS2322  LViewPoint | null → LViewPoint | undefined
src/view/viewElement/view.tsx(373,13):           TS2322  LViewPoint | null → LViewPoint | undefined
src/components/editors/views/NestedView.tsx(82,58):  TS18047 'project.activeViewpoint' is possibly 'null'
src/components/editors/views/NestedView.tsx(544,5):  TS2322  LViewPoint | null → LViewPoint
```

Tre osservazioni.

1. **I due inizializzatori non danno errore**: `Pointer<T, 0, 1>` si espande in
   `NotAString<...> | null` e accetta il letterale `null`. Il costo del cambio di cardinalita' e'
   tutto a valle.
2. **Gli otto siti coincidono esattamente con la colonna «intervento si'» di §5.2**, piu' i due
   interni a `classes.ts`. Il typecheck e' quindi una checklist affidabile per la Fase 2: quando i
   41 tornano a 33, il fronte B e' chiuso sul lato tipi.
3. `classes.ts:3353` e `3355` mostrano che il getter/setter L non si sistemano con un cast
   qualunque: la firma `this['activeViewpoint']` viaggia dentro i vincoli generici di
   `fromPointer` e `Pack1`. E' il punto piu' fastidioso del fronte, e va progettato prima di
   scrivere.

**La modifica e' stata scartata.** `git checkout -- frontend/src/joiner/classes.ts`, poi
`git status --short` vuoto e `diff` byte a byte contro la copia di backup: identico.

---

## 6. Blocco C — la migration

### 6.1 C1 — dove puo' stare la purga senza essere annullata

Le tre collocazioni, con quello che ciascuna comporta alla luce di §4.3 e §4.4.

**(i) Dentro l'adapter `2.227 -> 2.228`, piu' svuotamento dei registri.**
Pro: la purga sta dove stanno tutte le altre migration, e il loop di coda diventa un no-op naturale
perche' i `for...in` non hanno chiavi.
Contro: e' l'opzione (1) di §4.4, quindi **rompe `isSystemViewpoint`** e con essa il filtro R-IRN-9
di `classes.ts:3327` e la normalizzazione R-IRN-10 di `Toolbar.tsx:221`; e rompe i due default di
`view.tsx:339-340`, dove `Defaults.viewpoints[0]` diventa `undefined`. Sconsigliata cosi' com'e'.

**(ii) Dentro l'adapter, tenendo i registri e neutralizzando i due loop non versionati.**
Pro: l'identita' (`isSystemViewpoint`, `check` sui tipi primitivi, le chiavi che la migration cerca)
resta intatta, come R-IRN-8 ha gia' fatto per il viewpoint `Default Validation`, che ha lasciato in
`Defaults.ts:65-71` le quattro costanti proprio perche' «sono gli id che la migrazione deve
cercare». Il precedente esiste ed e' recente.
Contro: due interventi invece di uno, e la neutralizzazione va scritta in modo che non possa
riattivarsi (uscita anticipata su `typeof !== 'object'`, non una condizione di contesto).

**(iii) Purga dopo il loop di coda.**
Pro: nessun rischio di reiniezione, perche' si passa per ultimi.
Contro: e' codice **non versionato**, quindi gira a ogni caricamento e non solo una volta; perde la
proprieta' di idempotenza-per-costruzione che il numero di versione garantisce; e non risolve il
`TypeError` di `updateDefaultView`, che avviene **prima**.

**Raccomandazione da portare ad Alfonso**: (ii). Ma con una precisazione che (i) e (iii) non
risolvono e (ii) deve risolvere esplicitamente: **`updateDefaultView` va reso inerte nello stesso
commit**, altrimenti la sequenza di §4.3 impedisce il caricamento dei progetti prima ancora che il
loop di coda entri in gioco.

### 6.2 C2 — che cosa punta agli id purgati: censimento eseguito

Modello: il Finding 2 di `docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md`.

**Metodo**: script Node che percorre ricorsivamente uno stato serializzato reale
(`frontend/src/examples/statechartplus.ts`, 349 chiavi in `idlookup`), registrando ogni stringa e
ogni **chiave di dizionario** che contiene `Pointer_View`, con il `className` del proprietario e il
percorso del campo. Non e' un elenco plausibile: e' l'output di una ricerca. Ripeto il limite: e'
un censimento di **forma** su un salvataggio vecchio, non una misura del corpus attuale.

| # | Sede | Occorrenze | Esempio |
|---|---|---|---|
| 1 | **`DGraphElement.view`** | 57 | `Pointer_ViewAttribute` |
| 2 | **`DEdge.view`** | 39 | `Pointer_ViewEdgeAssociation` |
| 3 | root **`$.viewelements[]`** | 35 | `Pointer_ViewModel` |
| 4 | **`DViewPoint.subViews`** | 35 | array nei salvataggi, dizionario nel codice corrente |
| 5 | **`DViewElement.viewpoint`** | 22 | `Pointer_ViewPointDefault` |
| 6 | **`DVertex.view`** | 19 | `Pointer_ViewClass` |
| 7 | **`DViewElement.pointedBy[].source`** | 17 | `idlookup.Pointer_ViewPointDefault.subViews` |
| 8 | **`DViewPoint.pointedBy[].source`** | 17 | `idlookup.Pointer_ViewModel.viewpoint` |
| 9 | **`DViewElement.jsxString`** | 7 | testo, non puntatore (§4.1 punto d) |
| 10 | **`DEdgePoint.view`** | 4 | `Pointer_ViewEdgePoint` |
| 11 | **`DGraphVertex.view`** | 2 | |
| 12 | root **`$.viewpoints[]`** | 1 | `Pointer_ViewPointDefault` |
| 13 | **`DProject.activeViewpoint`** | 1 | `Pointer_ViewPointDefault` |
| 14 | **`DGraph.view`** | 1 | `Pointer_ViewModel` |

**Il risultato che il prompt non prevedeva: le voci 1, 2, 6, 10, 11, 14 sono la stessa cosa —
`DGraphElement.view` e le sue sottoclassi — e da sole fanno 122 occorrenze su 156.**
`GraphDataElements.tsx:100` la dichiara `view!: Pointer<DViewElement, 1, 1, LViewElement>`, cioe'
**obbligatoria**. Ogni nodo del grafo porta il puntatore alla view con cui e' reso. Purgare le venti
default lascia pendente quel campo su ogni nodo del progetto.

**Due sedi previste dal prompt che il censimento NON trova, e il perche'.**

- **`VIEWS_RECOMPILE_*`**: assenti in questo stato, che e' precedente alla loro introduzione. Ma sono
  **rilevanti lo stesso**, e per una ragione che si legge nel codice: `SaveManager.load`
  (`SaveManager.ts:45-55`) itera `[...save.viewelements, ...save.viewpoints]` e riempie
  `save['VIEWS_RECOMPILE_' + key]` per **ogni** id salvato, **prima** di chiamare
  `VersionFixer.update` a riga 56. Quindi al momento della purga i venti id sono **gia'** dentro
  diciannove array root (`DViewElement.RecompileKeys`, `view.tsx:198-200`). La migration deve
  ripulirli, o accettare puntatori pendenti in quegli array.
- **`transientProperties.view[id]`**: lo stesso loop di `SaveManager.ts:47` crea una entry per ogni
  id salvato. **Non e' persistito** e non e' nello stato che la migration riceve: e' una mappa di
  modulo. La migration non lo puo' toccare e non deve provarci; resta sporco per la durata della
  sessione di pagina, il che e' innocuo (`get_transient` a `view.tsx:492` ritorna `{}` di ripiego).
- **`DProject.viewpoints`**: in questo salvataggio vale `["Pointer1704689488582_USER_102"]`, senza
  l'id di sistema — coerente con la nota a `classes.ts:3335`. Ma R-IRN-9 emendamento (c) ha misurato
  che su un progetto creato dalla UI vale `["Pointer_ViewPointDefault"]`. **Entrambe le forme sono
  reali** e la migration deve gestirle tutte e due.

**Sede quindicesima, dal codice e non dal censimento**: `state._lastSelected.view`
(`store.tsx:152-156`), tipizzato `Pointer<DViewElement, 1, 1>`. Non presente nel campione, ma e' un
puntatore a view nella root e va nell'elenco.

**Conseguenza di progetto.** L'ampiezza di questo elenco spinge verso una purga **conservativa**: non
«cancella le venti default», ma «cancella le venti default **e riconcilia i puntatori**», con lo
stesso schema della FASE C di `2.226 -> 2.227` (`VersionFixer.tsx:1160-1176`). E soprattutto:

> **Il viewpoint `Default` non puo' essere purgato incondizionatamente.** R-IRN-9 documenta che view
> autorate finiscono dentro `Default` — il rubinetto e' ancora aperto per intero. Una view autorata
> con `viewpoint = 'Pointer_ViewPointDefault'` sopravvive alla purga con quel puntatore pendente. La
> condizione «purga il viewpoint solo se `holdsOnlySystemViews`» esiste gia' come predicato
> (`Defaults.ts:137-142`) ed e' il candidato naturale. Se invece il `Default` viene conservato,
> con i registri svuotati **ricomparirebbe nella lista dei viewpoint** (§4.4 opzione 1).

### 6.3 C3 — idempotenza

La migration deve essere no-op al secondo giro. Il meccanismo di versione lo garantisce **in
produzione** (`VersionFixer.update` esegue solo gli adapter da `s.version.n` a `highestVersion`), ma
non basta: `2.226 -> 2.227` ha comunque scritto l'idempotenza nel corpo, perche' il test la esercita
fuori dalla catena.

**Come verificarlo, con la convenzione che il repo gia' usa** (§4.6):

1. Un nuovo file `frontend/src/redux/__tests__/versionfixer_2228_migration.test.ts` che **duplica**
   il corpo della migration come `export function migrate_2227_to_2228(s)`, con l'intestazione che
   dichiara la duplicazione e il motivo (il joiner non e' importabile in vitest node).
2. Fixture **fabbricate a mano**, non estratte dal corpus: il corpus non e' accessibile dai test.
   Servono almeno quattro casi:
   - **F1 «pulito»**: le 21 view di sistema (le 20 del registro piu' `Pointer_ViewEdge`), il
     viewpoint `Default` con `subViews` a due voci, nessun `clonedCounter`, piu' un viewpoint
     utente con le sue view e alcuni `DVertex.view` che puntano alle default. **Modella il
     progetto reale misurato** (report di riferimento, §7.2).
   - **F2 «default toccata»**: come F1 ma con `clonedCounter` definito su una default, per
     esercitare il ramo di conservazione.
   - **F3 «view autorata dentro Default»**: una `DViewElement` con id in namespace utente e
     `viewpoint = 'Pointer_ViewPointDefault'`, per esercitare la condizione di §6.2.
   - **F4 «gia' migrato»**: l'output di F1, per l'assert di idempotenza.
3. L'assert: `expect(migrate(migrate(F1))).toEqual(migrate(F1))`, e in piu' un contatore interno a
   zero al secondo giro (le migration esistenti loggano i contatori: si possono asserire).
4. La guardia `if (!e || typeof e !== 'object') continue` **come primo termine di ogni ciclo**, non
   in fondo: `s.idlookup.clonedCounter` e' un `number` (misurato: 178, report di riferimento §7.3) e
   ogni `for...in` su `idlookup` lo incontra. `VersionFixer.tsx:139` e `reducer.ts:1107` la hanno
   gia', ed e' il motivo per cui esistono.

### 6.4 C4 — la condizione «identica al seed»

Il problema: R-IRN-8 prescrive di purgare solo i record identici al seed e conservare quelli
modificati dall'autore, ma il termine di paragone (il seed) esce dal codice nello stesso commit.
Tre forme, con quello che si perde in ciascuna.

**(a) Tabella di firme congelata dentro la migration.**
Un dizionario `id → hash` (o `id → jsxString`) dei 21 record, scritto letteralmente nel corpo
dell'adapter. Cosa si perde: peso e manutenzione — 21 firme fanno un blocco grosso, e nessuno le
rigenerera' mai perche' il seed non esistera' piu' per rigenerarle. Cosa si guadagna: e' l'unica
forma che distingue davvero «identica al seed» da «toccata senza che il contatore se ne accorgesse».

**(b) Confronto strutturale contro un template ridotto.**
Confrontare solo i campi che l'autore puo' toccare (`jsxString`, `css`, `palette`, `ir`,
`appliableTo`, `oclCondition`) contro valori congelati. Cosa si perde: la scelta dei campi e' un
giudizio, e un campo dimenticato produce falsi «identica». Cosa si guadagna: meno peso di (a).

**(c) Il solo test su `clonedCounter` non definito.**
Cosa si perde: `clonedCounter` non e' un flag «toccata dall'autore», e' un **contatore di clonazione
del reducer** (`reducer.ts:104`, `current[key].clonedCounter = 1 + (...)`), incrementato ogni volta
che il path di un'azione attraversa quell'oggetto. Sovrastima le modifiche (una view sfiorata da
un'azione che non ne cambia il contenuto risulta «toccata») e in teoria puo' sottostimarle se una
scrittura arriva per un'altra via. Cosa si guadagna: e' **gia' il criterio che
`VersionFixer.tsx:143` usa** per decidere se rigenerare una default, con il commento esplicito «NB:
for untouched views clonedCounter is undefined, not 0». Usare lo stesso criterio per purgare e per
rigenerare tiene una sola definizione di «non toccata» invece di due che possono divergere.

**Argomento dalla misura.** Sul progetto reale le venti default sono presenti tutte e venti e
**nessuna** ha `clonedCounter` definito (report di riferimento §7.2). Il tetto della purga e' quindi
**zero casi da conservare**: sul corpus noto, (a), (b) e (c) danno lo stesso risultato. La scelta
non e' fra tre esiti diversi, e' fra tre livelli di prudenza per progetti che non abbiamo visto.

**Osservazione a favore di (c), che vale piu' della sua economia.** Se la purga usasse un criterio
piu' stretto di quello di `updateDefaultView`, esisterebbe una classe di view **purgate ma che
`updateDefaultView` avrebbe rigenerato**, o viceversa **conservate ma che `updateDefaultView`
distrugge** con il `{...true}` di §4.3. Tenere lo stesso predicato elimina quella classe per
costruzione. Se si sceglie (a) o (b), la neutralizzazione di `updateDefaultView` diventa
**obbligatoria e non opzionale**.

### 6.5 C5 — D4, il numero di revisione: la catena, e la correzione minima

**La catena, ricostruita per intero e verificata riga per riga.**

1. `classes.ts:1232-1233` — `_this.version = state ? -1 : 1.0;` con il commento «Content version:
   new projects start at 1.0, loaded projects use -1 (to be extracted from state)». L'intenzione e'
   chiara: `version` e' la **revisione di contenuto**, e per un progetto caricato va **estratta
   dallo stato**.
2. Lo stato salvato **la porta gia'**: `U.compressedState` (`U.tsx:437`) scrive
   `state.idlookup[id] = {...dproject, state: ''}`, e a quel punto `dproject.version` e' stato
   appena impostato a `nextVersion` da `projects.ts:104`. Quindi `s.idlookup[pid].version` nel
   salvataggio **e' la revisione utente corretta**.
3. `VersionFixer.tsx:132-134` la **sovrascrive**:
   ```ts
   let pid = U.getProjectID_URL() as Pointer;
   let project = s.idlookup[pid] as DProject;
   if (project) project.version = s.version.n;      // 2.227
   ```
4. Al salvataggio successivo `projects.ts:102-104` fa `getNextVersionNumber(2.227)`. In
   `versionUtils.ts:29-44`: `major = 2`, `minor = Math.round((2.227 - 2) * 10) = Math.round(2.27) =
   2`, `newMinor = 3` → **`2.3`**.
5. Il numero mostrato e' proprio questo campo: `Rev {formatVersionNumber(project.version)}` in
   `ProjectEditor.tsx:2110` e in `Project.tsx:363, 522, 639`.

**Il difetto e' peggiore di come F9 lo descrive.** F9 dice «la revisione passa da v2.2 a v2.3 al
primo salvataggio». In realta' e' **congelata**: a ogni apertura il passo 3 riscrive `2.227`, e il
passo 4 riporta a `2.3`. Con `2.228` non cambia niente, perche' `Math.round(2.28) = 2` anch'esso.
**Il contatore di revisione e' bloccato a v2.3 per sempre**, per ogni progetto, dal momento in cui
la versione di schema ha superato 2.2. Non e' un gradino una tantum che la `2.228` propaga: e' un
contatore rotto che la `2.228` non peggiora ne' migliora, ma che va corretto prima perche' altrimenti
resta invisibile dietro il rumore della migrazione.

**Correzione minima proposta: rimuovere `VersionFixer.tsx:134`.** Argomenti:

- La riga e' **puramente distruttiva**: il valore che sovrascrive e' gia' quello giusto (passo 2).
  Non c'e' niente da «estrarre»: l'estrazione la fa `LoadAction` caricando `idlookup` dallo stato.
- **Nessun consumatore si aspetta la versione di schema in quel campo.** Ricerca eseguita su tutti
  i lettori di `DProject.version`: `projects.ts:102` (incremento), `projects.ts:229`
  (`Offline.getAll`, ripristina la revisione salvata sul record esterno),
  `ProjectEditor.tsx:725,753` e `LeftBar.tsx:219` (`project.version?.toString() || '1.0.0'`, metadati
  di export), `UpdateProjectRequest.ts:54` (default `-1` se assente), e i quattro `Rev …`. Chi vuole
  la versione **di schema** legge `store.getState().version.n` (`ProjectEditor.tsx:2075`,
  `JsonModelService.ts:458`), che e' un campo diverso e resta intatto.
- Il costo e' una riga, dentro `VersionFixer.tsx`, cioe' dentro la zona critica: va nel Layer Impact
  Report della Fase 2 insieme al resto.

**Alternativa, se si vuole conservare l'informazione**: scrivere la versione di schema su un campo
nuovo (`schemaVersion`) invece che su `version`. Costa un campo D-layer in piu' e la sua
dichiarazione; non risolve niente in piu', perche' `DState.version.n` gia' contiene quel dato.
La lascio sul tavolo perche' la decisione e' di Alfonso, ma non la raccomando.

**Verifica da trenta secondi che chiude il punto** (gia' proposta dal report di riferimento e non
ancora eseguita): aprire `State Machine v1`, salvare una volta, guardare il numero in dashboard.
`2.3` conferma tutta la catena; qualunque altro valore la smentisce.

---

## 7. Punti in cui questa discovery corregge o precisa il report di riferimento

Il prompt chiede di dichiararlo esplicitamente.

1. **F7, riga «Toolbar.tsx»** — `Toolbar.tsx:214-229` non legge `DProject.activeViewpoint` ma la
   root `state.viewpoint` (`Toolbar.tsx:202`, `useSelector((state:any) => state.viewpoint)`). Non e'
   uno degli undici lettori del campo. La sua normalizzazione resta pertinente per R-IRN-10, non per
   il fronte B.
2. **F7 e la sezione 3 non nominano `activateViewpoint`** (`lastViewpoint.ts:49-64`), che e'
   l'**unico writer da UI** insieme a `NestedView` e che **non scrive affatto** quando il valore e'
   vuoto. Senza toccarlo, `null` non e' raggiungibile dall'interfaccia (§5.2, precisazione 2).
3. **F9 sottostima il difetto**: non e' un gradino una tantum, e' un contatore congelato (§6.5).
4. **Il punto 6 di «Dipendenze e rischi»** dice che il fronte 0..1 «tocca `selectors.ts`, cioe' la
   cascata `viewScores`/`stackViews`, che R-IRN-7 dichiara vincolante per il codice classico».
   Vero sul lato tipi, ma `getAppliedViewsNew` **non ha chiamanti vivi** (§4.5): a runtime quella
   cascata non gira. Il rischio va declassato.
5. **Il censimento dei puntatori pendenti** (che il report di riferimento non fa, e che il prompt
   elenca in forma parziale) e' dominato da `DGraphElement.view`, non da `subViews` (§6.2).
6. **`Defaults.freshViewsMap` / `storeFreshViews` sono codice morto** con un commento che dichiara
   il contrario (§4.4). Nessuno dei due report precedenti lo rileva.

Nessuna evidenza raccolta qui contraddice F1-F6 e F8.

---

## 8. Dipendenze e rischi

1. **Zona critica.** `VersionFixer.tsx` richiede Layer Impact Report e go-ahead. Vale anche per la
   sola riga 134 di C5.
2. **Il fronte tocca almeno sette file**, oltre la soglia di 5 della Rule 19: `VersionFixer.tsx`,
   `Defaults.ts`, `reducer.ts`, `store.tsx`, `defaults/views.ts`, `view.tsx`, `classes.ts`,
   `lastViewpoint.ts`, `NestedView.tsx`. La Fase 2 va aperta con l'elenco file-per-file e la
   conferma di Alfonso, e conviene spezzarla in piu' commit tematici.
3. **Il rubinetto e' aperto per intero** (R-IRN-9, «Quello che NON e' stato fatto»). Finche' lo e',
   nuove view autorate possono nascere dentro `Default`, quindi la condizione di conservazione di
   §6.2 non e' un caso storico ma un caso vivo. Chiudere il rubinetto **prima** della purga
   ridurrebbe la superficie; chiuderlo **dopo** lascia una finestra in cui il caso si riproduce.
4. **`updateDefaultView` e' il punto di rottura piu' vicino** (§4.3) e non e' nominato da nessuna
   ratifica. Se la Fase 2 lo dimentica, i progetti smettono di caricarsi e il sintomo e' silenzioso.
5. **Nessun gate copre i due fronti** (§3.1). La verifica sara' manuale, o richiede lavoro di
   infrastruttura che va deciso a parte.
6. **La misura del corpus e' di un solo progetto.** Tutte le stime di «quante default sono toccate»
   poggiano su n=1. Non e' un motivo per non procedere — R-IRN-13 ha gia' deciso — ma e' un motivo
   per preferire la forma piu' conservativa dove le opzioni si equivalgono.

---

## 9. Domande aperte per Alfonso

1. **Registri: svuotare o conservare?** §4.4 e §6.1 argomentano per **conservare**
   `Defaults.views`/`Defaults.viewpoints` come registri di **identita'** (che e' quello che R-IRN-8
   ha gia' fatto per `Default Validation`) e neutralizzare i due loop non versionati piu'
   `updateDefaultView`. L'alternativa (svuotare) e' piu' pulita a leggersi ma disabilita in silenzio
   R-IRN-9 e R-IRN-10. Confermi la prima?
2. **Condizione della purga**: `clonedCounter` non definito (stesso predicato di
   `VersionFixer.tsx:143`), oppure tabella di firme congelata? §6.4 argomenta per il primo, con la
   nota che il secondo rende **obbligatoria** la neutralizzazione di `updateDefaultView`.
3. **Il viewpoint `Default` va purgato condizionatamente?** Proposta: purgarlo solo quando
   `holdsOnlySystemViews` risponde `true`; altrimenti conservarlo con le sue view autorate. In quel
   caso serve decidere **dove finiscono** le view autorate rimaste: restano dentro un `Default` che
   non e' piu' seminato (quindi diventa un viewpoint utente a tutti gli effetti, e ricompare in
   lista), oppure vengono riparentate.
4. **Puntatori pendenti su `DGraphElement.view`**: azzerarli (`undefined`), riparentarli su una view
   sostitutiva, o lasciarli pendenti contando su `autocorrect`? La terza non e' automatica:
   `autocorrect` gira solo con `?repair=1` (`VersionFixer.tsx:117`).
5. **C5**: rimuovere `VersionFixer.tsx:134` (raccomandato) o introdurre `schemaVersion`? E vuoi che
   la verifica da trenta secondi (aprire + salvare + guardare il `Rev`) sia fatta prima di scrivere?
6. **`activateViewpoint` che non disattiva** (§5.2, precisazione 2): il fix rientra nel perimetro
   della Fase 2 o e' fetta a se'? Senza di esso il fronte B e' incompleto perche' `null` non e'
   scrivibile da UI.
7. **Forma del getter L**: `LViewPoint | null` con cast (misurato, funziona), oppure normalizzare a
   `undefined` sul solo lato L tenendo `null` come forma persistita? R-IRN-11 fissa la forma del
   dato; il proxy e' un'altra decisione.
8. **P8 stantia**: la nota «Lo smoke non esiste ancora» in `docs/PROTOCOL.md` e' falsa da quando
   `frontend/scripts/smoke/` esiste. La correggo in un commit a parte o la lascio?

---

## 10. Stato

Fase 1 chiusa. Nessun file di codice modificato: l'unica modifica, quella dell'esperimento B5, e'
stata applicata al working tree, misurata e scartata, con `git status` vuoto e confronto byte a byte
contro la copia di backup a conferma. Hard stop. La Fase 2 non parte senza lettura di questo report,
go-ahead esplicito e Layer Impact Report.
