# LIR 2026-08-18: le tre modifiche a `VersionFixer.tsx` della passata `2.228`

**Tipo**: Layer Impact Report (CLAUDE.md §3.2), unico, a copertura delle tre slice.
**Prompt**: 2026-08-18 16:56, Fase 2 di `2.227 -> 2.228`, Passo 0.
**Base**: `faa9723de` su `alfonso-frontend-jjtl`, working tree pulito.
**Base di evidenza**: `docs/discovery/discovery_2026-08-18_2228_seed_e_activeviewpoint.md`;
ratifiche R-IRN-11..R-IRN-19 in `docs/decisions.md`.
**Stato**: prodotto **prima** di qualunque riga di codice. Nessun file sorgente modificato.

---

## 0. Che cosa copre e che cosa no

`frontend/src/redux/VersionFixer.tsx` e' in critical zone (§3.1) e viene toccato da tutte e tre le
slice. Questo documento e' il report unico che le copre. **Non** e' un piano di implementazione: le
modifiche fuori da `VersionFixer.tsx` (`store.tsx`, `view.tsx`, `classes.ts`, `lastViewpoint.ts`,
`NestedView.tsx`, `selectors.ts`, `projects.ts`) compaiono qui **solo** dove leggono o subiscono cio'
che `VersionFixer.tsx` cambia.

---

## 1. Baseline, misurate oggi su working tree pulito

Eseguite da `/Users/alfonso/jjodel/frontend`, output letto **per intero**, non a finestra.

| Gate | Comando | Exit | Misura |
|---|---|---|---|
| Typecheck | `npm run typecheck` | 2 | **33** righe `error TS` (`command grep -c "error TS"` su output completo) |
| Test | `npm run test` | 1 | **59** suite, **9 fallite**, **1315** test passati, 2.59s |

Le nove suite rosse, rimisurate oggi con `npm run test 2>&1 \| command grep "^ FAIL" \| sort -u`,
sono **le stesse nove** che la Fase 1 elenca, tutte per `ReferenceError: window is not defined` in
raccolta (zero test eseguiti, zero falliti):

```
src/jjscript/__tests__/context-binding.test.ts
src/jjtl/__tests__/abstract-target.test.ts
src/jjtl/__tests__/ai-prompt-sanitization.test.ts
src/jjtl/__tests__/circular-refs.test.ts
src/jjtl/__tests__/executor-bridge.test.ts
src/jjtl/__tests__/executor-llayer.test.ts
src/jjtl/__tests__/forall-mapping.test.ts
src/jjtl/__tests__/source-alias.test.ts
src/utils/__tests__/UDComparator.test.ts
```

**Nessuna delle nove tocca l'area di questo lavoro.** Nessuna importa `VersionFixer`, `Defaults`,
`store.tsx` o il percorso di caricamento: sono jjtl/jjscript e un comparatore di utility. La
risposta alla quarta domanda del Passo 0 e' quindi **zero** per tutte e tre le slice, e vale la pena
dirla nella forma piu' scomoda: **non e' che le suite rosse coprano l'area e siano rotte per altro.
E' che l'area non ha copertura, ne' rossa ne' verde.** Il dettaglio per slice e' in §4.

---

## 2. Le tre modifiche, localizzate riga per riga

Numeri di riga verificati oggi su `HEAD` con `command grep -n "" | sed -n`.

**Slice 0 — R-IRN-17.** `VersionFixer.tsx:132-134`, dentro `update()`:
```ts
132        let pid = U.getProjectID_URL() as Pointer;
133        let project = s.idlookup[pid] as DProject;
134        if (project) project.version = s.version.n;
```
`pid` e `project` sono locali a `update()` e **non hanno altri usi**. Verificato con due ricerche,
entrambe exit 0: `command grep -n "pid\b" ...` da' 132, 581, 582, 586, dove 581-586 sono un `pid`
diverso, dichiarato dentro l'adapter `2.208 -> 2.209` (che inizia a riga 575) e mai visibile qui;
`command grep -n "\bproject\b" ...` da' 133 e 134 come **unici** usi come identificatore — le altre
otto righe (67, 350, 355, 358, 359, 619, 717, 719) sono stringhe letterali e commenti, controllate
una per una. Le tre righe si rimuovono insieme. Gli import `Pointer`, `DProject` e `U` restano usati
altrove (581, 193, 117): nessun import da toccare.

**Slice 1 — R-IRN-15, terzo intervento.** `VersionFixer.tsx:148-154`, coda di `update()`:
```ts
148        // add new default views
149        for (let k in Defaults.defaultViewsMap) {
150            if (!s.idlookup[k]) s.idlookup[k] = Defaults.defaultViewsMap[k];
151        }
152        for (let k in Defaults.defaultViewPointsMap) {
153            if (!s.idlookup[k]) s.idlookup[k] = Defaults.defaultViewPointsMap[k];
154        }
```

**Slice 2b.** Nuovo metodo `private ['2.227 -> 2.228'](s: DState): DState`, in coda alla catena,
dopo `['2.226 -> 2.227']` che finisce a riga 1181. `highestVersion` passa da 2.227 a 2.228 per
costruzione (calcolato dai nomi di metodo, `VersionFixer.tsx:88-105`).

**Una correzione di path, non di sostanza.** Il prompt e la Fase 1 citano la guardia come
`reducer.ts:1104`. Il file e' `frontend/src/redux/reducer/reducer.ts` (sottocartella `reducer/`),
non `frontend/src/redux/reducer.ts`. La riga 1104 e' quella giusta e il codice e' quello citato,
verificato verbatim. Segnalato per Rule 15: il path va corretto nei documenti a valle.

---

## 3. LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)          — nessuna scrittura; lettori impattati, vedi sotto
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)
```

### D-layer (Redux raw data)

**Che cosa cambia.** Tre campi grezzi, uno per slice.
- Slice 0: `DProject.version` **smette di essere sovrascritto** durante il caricamento. Il valore
  che arriva dal salvataggio (la revisione utente, scritta da `projects.ts:104` e serializzata da
  `U.tsx:437`) sopravvive fino a `LoadAction`.
- Slice 1: `s.idlookup` **smette di ricevere venti/ventuno chiavi in coda al fixer**. Cambia il
  numero di entry dello stato caricato, non la forma di quelle esistenti.
- Slice 2b: `DProject.activeViewpoint` viene normalizzato a `null` quando vale un id di sistema.
  Trasformazione pura `DState -> DState`, nessuna azione Redux, nessun L-proxy.

**Che cosa NON cambia.** Nessuna delle tre tocca `DViewElement.jsxString`, `css`, `palette`, `ir`,
`subViews`, `pointedBy`, ne' alcun campo di `DGraphElement`. **Nessun record viene rimosso**: la
purga e' fuori perimetro per R-IRN-19. La root `state.viewpoint` (`store.tsx:160`, stringa vuota
per default) **non viene toccata** da nessuna delle tre — vedi §7, punto 3.

**Interazione cross-layer.** `VersionFixer.update` gira dentro `SaveManager.load`
(`components/topbar/SaveManager.ts:56`) su un oggetto JS **prima** che diventi stato Redux: il
`LoadAction.new(save)` e' alla riga successiva. Fino a quel momento non esistono proxy L, non
esistono selettori, non esiste nessun consumatore. E' la finestra piu' sicura del sistema per una
riscrittura di stato, ed e' la ragione per cui tutte e tre le modifiche stanno li'.

**Sicurezza rispetto agli altri layer.** Nessuna delle tre emette azioni. Slice 0 e 1 sono
rimozioni: non possono introdurre stati nuovi, solo smettere di produrne. Slice 2b introduce un
valore (`null`) in un campo che il tipo dichiarera' `Pointer<DViewPoint, 0, 1>`, cioe'
`NotAString<...> | null` (`classes.ts:3707-3711`): e' la forma che il tipo ammette, non un'eccezione.

### L-layer (proxy calcolati) — lato lettura

Nessuna scrittura. Ma il campo che slice 2b normalizza e' letto attraverso `LProject.activeViewpoint`
(`classes.ts:3352-3353`), il cui getter oggi maschera il vuoto con `|| Defaults.viewpoints[0]`.
**Finche' quel fallback resta, la normalizzazione della migration e' invisibile**: un `null`
persistito verrebbe riletto come il viewpoint di sistema. Adapter e getter vanno quindi nello stesso
commit (2b), altrimenti il commit intermedio scrive nello stato un valore che il proxy annulla in
lettura — non rompe niente, ma rende la verifica funzionale 1 del prompt non falsificabile.

### Persistence

**Che cosa cambia.** Un numero di schema, `2.227 -> 2.228`, e con esso: ogni salvataggio aperto
guadagna `2.227` in `s.version.conversionList` e `s.version.n = 2.228`; ogni salvataggio **riaperto
dopo essere stato risalvato** non riesegue l'adapter (`while (currVer !== highestVersion)`).

**Che cosa NON cambia.** Nessun `jsxString` viene riscritto: non si tocca `DV.tsx` ne'
`defaultViewTemplate.ts`, quindi §3.9 non impone nessuna migrazione di template. La migration di
questa passata e' l'unica scrittura, e riguarda un puntatore, non una stringa di template.

**Interazione.** `SaveManager.load:44-55` riempie `save['VIEWS_RECOMPILE_' + key]` e
`transientProperties.view[vid]` per **ogni** id in `[...save.viewelements, ...save.viewpoints]`,
**prima** di chiamare il fixer. Quegli array continueranno a elencare le venti default dei
salvataggi vecchi, perche' le venti default restano nello stato (nessuna purga). Coerente: niente
puntatori pendenti introdotti da questa passata.

### Layer NON toccati, con la ragione

- **JjOM / Sync layer / Canvas v2-flow / Canvas classic**: nessuna delle tre modifiche scrive in
  `idlookup` entita' di modello, nessuna gira vicino a `DVertex.new` / `DVoidEdge.new2/new3`, quindi
  §3.3 non e' in gioco. L'unico `TRANSACTION` in perimetro e' quello preesistente di
  `store.tsx:245`, che slice 1 **non** apre ne' chiude: ne toglie solo delle istruzioni interne.
- **`Defaults.ts`**: non toccato in nessuna slice (R-IRN-14). I registri restano pieni, quindi
  `isSystemViewpoint`, `holdsOnlySystemViews`, `check` sui dodici tipi primitivi e i predicati di
  R-IRN-9/R-IRN-10 continuano a rispondere come oggi.
- **`reducer.ts`**: non toccato. Vedi §5.1 per il motivo per cui non serve.

### Scenari di smoke potenzialmente toccati

- aprire un progetto salvato → deve caricare (e' il rischio principale, §5.2);
- aprire un progetto salvato **due volte** → nessuna differenza fra il primo e il secondo giro;
- creare un progetto nuovo, salvare, chiudere, riaprire → le ventuno view **non** ricompaiono;
- salvare due volte di seguito → la revisione in dashboard avanza di un decimo ogni volta;
- creare una view dal «+» del tree e dal menu contestuale del canvas, con e senza viewpoint attivo.

**Nessuno di questi scenari e' coperto da un gate automatico.** Dettaglio in §4.

---

## 4. Le quattro domande del Passo 0, una modifica alla volta

### 4.1 Slice 0 — rimozione di `VersionFixer.tsx:132-134`

**(a) Layer toccato, e chi legge cio' che cambia.**
D-layer + persistenza. Il campo e' `DProject.version`. I lettori sono stati censiti oggi con
`command grep -rnI "\.version\b" frontend/src --include="*.ts" --include="*.tsx" | command grep -v
"^frontend/src/examples/" | command grep -iE "project|dproject|lproject"`, exit 0, e sono:
`projects.ts:102` (incremento al salvataggio), `projects.ts:229` (`Offline.getAll`, ripristina la
revisione salvata), `projects.ts:372` (`Online.save`, vedi §5.3), `ProjectEditor.tsx:725,753` e
`LeftBar.tsx:219` (metadati di export, `project.version?.toString() || '1.0.0'`),
`UpdateProjectRequest.ts:54` (default `-1`), e i quattro `Rev` di `ProjectEditor.tsx:2110` e
`Project.tsx:363,522,639`. **Nessuno si aspetta la versione di schema.** Chi vuole quella legge
`store.getState().version.n` (`ProjectEditor.tsx:67,2075`), che e' un campo diverso e resta intatto.

**(b) Stato gia' migrato che ripassa dalla funzione.**
La riga 134 gira **fuori dal `while`**, cioe' a ogni caricamento, migrato o no. La sua rimozione e'
quindi idempotente nel senso forte: toglie un effetto che oggi si ripete a ogni apertura. Un
progetto gia' a `2.228` che si riapre semplicemente non vede piu' riscritto `version`.

**(c) Stato mai migrato, salvato prima del 2026-08-18.**
Porta in `s.idlookup[pid].version` il numero che aveva all'ultimo salvataggio. Se e' stato salvato
almeno una volta da quando lo schema ha superato 2.2, quel numero e' `2.3` (catena §6.5 della Fase
1). Dopo la rimozione **resta `2.3`**, e il salvataggio successivo lo porta a `2.4`. La rimozione
**non recupera** la storia persa: sblocca il contatore, non lo ricostruisce. Va detto ad Alfonso
perche' la verifica del prompt («deve incrementare di un decimo rispetto al valore precedente»)
misura esattamente questo e non di piu'.

**(d) Suite rosse e gate.**
Zero delle nove tocca l'area. **Nessun gate se ne accorgerebbe**: `npm run test` non ha alcun test
su `DProject.version`; lo smoke crea un progetto nuovo e non lo salva mai
(`frontend/scripts/smoke/states.ts:177-191`, `createProject`), quindi non passa mai da
`ProjectsApi.save` ne' dalla dashboard; il typecheck non vede una rimozione di istruzione. La
verifica e' **solo** quella manuale da trenta secondi.

### 4.2 Slice 1 — rimozione del loop di coda `148-154`

**(a) Layer toccato, e chi legge cio' che cambia.**
D-layer + persistenza. Cambia il contenuto di `s.idlookup` consegnato a `LoadAction`. I lettori sono
tutti quelli dello stato, ma il consumatore che conta e' `Selectors.getAllViewElements`
(`selectors.ts:89-95`), che mappa i puntatori di `state.viewelements` sui record di `idlookup`.

**(b) Stato gia' migrato che ripassa dalla funzione.**
Il loop **non e' versionato**: gira a ogni caricamento, per ogni versione. La sua rimozione e'
quindi la piu' universale delle tre — vale per stati a `2.228`, a `2.227` e a `2.1`. Idempotenza
banale: rimuovere codice che girava sempre non introduce dipendenze dal numero di giri.

**(c) Stato mai migrato, salvato prima del 2026-08-18.**
Contiene le venti default (misurato: tutte e venti presenti, nessuna con `clonedCounter`, R-IRN-13).
Per quelle chiavi `s.idlookup[k]` e' gia' definito, quindi **oggi il loop e' gia' un no-op su quello
stato**. La rimozione non cambia niente per i salvataggi vecchi: cambia tutto per quelli **creati
dopo il ritiro**, che quelle chiavi non le hanno.

**(d) Suite rosse e gate.**
Zero delle nove tocca l'area. **Nessun gate se ne accorgerebbe.** Il caso che la rimozione serve a
coprire — progetto nuovo, salvato, chiuso, riaperto — e' precisamente quello che lo smoke non
esegue: `createProject` crea e apre, non salva e non riapre. Verifica manuale, punto 2 della slice.

**Interazione obbligatoria con `updateDefaultView`, che questa slice deve chiudere.**
Il loop 137-146 (`updateDefaultView`) e' **indipendente** dal loop di coda e gira **prima**. Vedi
§5.2: senza la guardia di tipo in `view.tsx:1917` i progetti smettono di caricarsi, e il sintomo e'
silenzioso. Le due modifiche stanno nella stessa slice per necessita', non per comodita'.

### 4.3 Slice 2b — nuovo adapter `2.227 -> 2.228`

**(a) Layer toccato, e chi legge cio' che cambia.**
D-layer + persistenza in scrittura; L-layer, canvas v2-flow e albero in lettura. Il campo e'
`DProject.activeViewpoint`. Censimento dei lettori rifatto oggi
(`command grep -rnI "activeViewpoint" frontend/src --include="*.ts" --include="*.tsx"`, `examples/`
escluso a valle): coincide con la tabella §5.2 della Fase 1, tredici siti, nessuno in piu'.
I lettori che vedono la normalizzazione sono: `classes.ts:3353` (getter L, stesso commit),
`Toolbar.tsx:221` (che gia' normalizza per conto suo, R-IRN-10, e quindi mostrera' lo stesso
risultato per due ragioni invece di una), `NestedView.tsx:82,130,336,519`,
`TreeViewContent.tsx:2328`, `ViewParentingFields.tsx:49`, `view.tsx:373,903`.

**Dove sta il campo, nello stato salvato.** `U.compressedState` (`common/U.tsx:427-441`) filtra
`idlookup` tenendo **un solo** `DProject`, quello che si sta salvando (riga 432,
`if (object.className === DProject.name && pointer !== id) continue`), e lo riscrive a riga 437.
L'adapter deve comunque iterare su tutte le entry con `className === 'DProject'`: costa niente ed e'
robusto rispetto a salvataggi prodotti da versioni che non facevano quel filtro.

**(b) Stato gia' migrato che ripassa dalla funzione.**
Due garanzie, e servono entrambe. La prima e' il `while` di `update()`: un salvataggio a `2.228` non
esegue l'adapter. La seconda e' il corpo, che dev'essere idempotente **comunque**, perche' i test lo
esercitano fuori dalla catena (convenzione dei due test esistenti, §4.6 della Fase 1). Qui e'
idempotente per costruzione: la condizione e' `Defaults.isSystemViewpoint(v)`, e `null` non e' un id
di sistema — `(Defaults.viewpoints as string[]).includes(null)` e' `false`. Secondo giro: zero
scritture, contatore a zero.

**(c) Stato mai migrato, salvato prima del 2026-08-18.**
Attraversa **tutta** la catena da `s.version.n` fino a 2.228, quindi anche i ventisette adapter
precedenti. L'adapter nuovo lo vede per ultimo, con `idlookup` gia' nella forma che i precedenti
hanno prodotto. I due casi reali:
- `activeViewpoint === 'Pointer_ViewPointDefault'` — misurato sia su `examples/statechartplus.ts`
  sia su un progetto creato dalla UI (R-IRN-9 emendamento c). Diventa `null`.
- `activeViewpoint` = un id utente. Invariato.
Un terzo caso da gestire senza pretendere che sia raro: **campo assente o gia' `null`**. La guardia
`typeof e !== 'object'` come **primo termine** di ogni `for...in` su `idlookup` e' obbligatoria
(R-IRN-13: `idlookup.clonedCounter` e' un numero, misurato 178).

**(d) Suite rosse e gate.**
Zero delle nove tocca l'area. Il typecheck vede il cambio di cardinalita' di slice 2b — la Fase 1 ha
misurato che porta la baseline da 33 a 41 e che gli otto errori nuovi coincidono con la lista dei
siti da toccare (§5.5). **Quello e' l'unico gate utile del fronte B, e copre i tipi, non il
comportamento.** Il comportamento della migration non ha copertura: lo smoke non apre salvataggi, e
un test vitest e' possibile solo duplicando il corpo (`VersionFixer.tsx` non e' importabile
nell'ambiente node di vitest, si tira dietro il joiner). Vedi §7 punto 1.

---

## 5. Quello che ho trovato leggendo, e che il prompt non ha

### 5.1 Perche' `reducer.ts` davvero non va toccato — e che cosa resta nei registri

La guardia di `reducer/reducer.ts:1104` si chiude quando
`Defaults.defaultViewPointsMap['Pointer_ViewPointDefault']` diventa un **oggetto**. Con il
contenitore `Default` ancora seminato (decisione di perimetro del prompt), la prima passata del
reducer dopo `init_editor` trova quel `DViewPoint` in `idlookup` e lo scrive nella mappa: la guardia
si chiude, come oggi. **Confermato per lettura, e il perimetro regge.**

Ma con una conseguenza che va scritta, perche' e' il presupposto delle due modifiche di slice 1.
Dopo il ritiro, allo scattare della guardia le due mappe valgono:

- `defaultViewPointsMap` = `{ Pointer_ViewPointDefault: <DViewPoint reale, vuoto> }`;
- `defaultViewsMap` = **venti chiavi con valore `true`**, i booleani che
  `Defaults.ts:87` (`Defaults.views.reduce((acc, val) => { acc[val] = true; ... })`) mette e che
  nessuno sostituisce piu', perche' quelle view in `idlookup` non ci sono mai state.

Da qui discende tutto il resto di §5.2 e §5.3.

### 5.2 Il loop di coda, senza seed, inietterebbe `true` dentro `idlookup`

Questo la Fase 1 non lo dice, e cambia il peso della rimozione. Oggi il loop 149-151 reinietta
**oggetti reali**, perche' la mappa e' stata riempita dal reducer con le view seminate. Dopo il
ritiro la mappa tiene booleani (§5.1), quindi su un progetto **nuovo salvato e riaperto** — dove le
venti chiavi in `idlookup` non ci sono — il loop scriverebbe:

```
s.idlookup['Pointer_ViewModel'] = true
... (venti volte)
```

e poi `LoadAction` porterebbe quei booleani dentro Redux. `Selectors.getAllViewElements`
(`selectors.ts:89-95`) li mapperebbe come valori, e ogni consumatore che legge `.className` su `true`
rompe. **La rimozione del loop non serve solo a impedire che le view ricompaiano: serve a impedire
che ricompaiano come booleani.** E' un argomento in piu' a favore di R-IRN-15 («rimuovere, non
rendere condizionale»), piu' forte di quello con cui la ratifica e' stata scritta.

Nota simmetrica sul secondo loop (152-154): quello reinietterebbe il `Default` **vuoto costruito
all'init di questa sessione di pagina** dentro un salvataggio che non ce l'ha. Non e' un booleano ed
e' meno grave, ma e' comunque stato di una sessione che finisce in un salvataggio di un'altra.
Stesso rimedio, stessa riga.

### 5.3 `updateDefaultView`: la guardia serve, e ha un secondo chiamante che il prompt non nomina

Con `defaultViewsMap` a booleani (§5.1), `view.tsx:1919` prende `true`, `{...true}` da' `{}`,
`PointedBy.merge({}, v)` itera `undefined` e solleva TypeError a `view.tsx:1923`. L'eccezione risale
a `VersionFixer.tsx:144` → `SaveManager.load` → `catch` di `reducer.ts:1577`: **il progetto non
carica, la pagina non crasha, l'unico segno e' una riga in console.** E' il punto di rottura piu'
vicino di tutta la Fase 2 ed e' la ragione per cui la guardia di tipo sta nella stessa slice.

**Il chiamante che manca dai documenti.** Censimento eseguito oggi
(`command grep -rnI "updateDefaultView" frontend/src --include="*.ts" --include="*.tsx"`, exit 0):
i chiamanti sono **due**, non uno. Oltre a `VersionFixer.tsx:144` c'e'
**`NestedView.tsx:396-399`**, il bottone «una nuova versione fatta dagli sviluppatori e' disponibile»,
mostrato quando `Defaults.check(d.id) && d.version !== VersionFixer.get_highestversion()`.

Con i registri conservati (R-IRN-14) `Defaults.check` continua a rispondere `true` sui venti id, e
`DViewElement.version` e' fissato alla creazione (`classes.ts:1095`,
`thiss.version = VersionFixer.get_highestversion()`), quindi le default dei salvataggi vecchi
resteranno a `2.227` mentre `highestVersion` sara' `2.228`. **Conseguenza: su un progetto vecchio
quel bottone continuera' ad apparire, e dopo la guardia non fara' piu' niente.** Un affordance che
si mostra e tace.

Non e' un difetto della guardia: e' il ritiro che rende la promessa del bottone falsa — non esiste
piu' nessuna «nuova versione dagli sviluppatori» da riapplicare. Ma `NestedView.tsx` **non e' nella
lista file della slice 1**, quindi non lo tocco: vedi §7 punto 2.

### 5.4 Un secondo sito che scrive la versione di schema sulla revisione utente

`api/persistance/projects.ts:372`, dentro `Online.save`:
```ts
if (!project.version) project.version = store.getState().version.n;
```
La Fase 1 non lo elenca fra i lettori di `DProject.version` (§6.5). E' **guardato** da `!version`, e
il percorso di salvataggio non puo' arrivarci con un valore falsy: `projects.ts:104` scrive sempre
`getNextVersionNumber(...)`, che restituisce `1.0` perfino su `NaN`
(`utils/versionUtils.ts:26-27`). Quindi oggi e' morto. Lo segnalo perche' rimuovere la riga 134
**non elimina ogni percorso** che puo' scrivere il numero di schema in quel campo: ne resta uno,
inerte per costruzione. Non lo tocco: fuori perimetro in tutte e tre le slice.

---

## 6. Rischi, in ordine di gravita'

1. **Progetto vecchio che non carica** (§5.2, §5.3). Sintomo silenzioso, nessun gate. E' il rischio
   numero uno della slice 1 e la ragione per cui la verifica 3 del prompt chiede di guardare **anche
   la console**, non solo lo schermo.
2. **Booleani in `idlookup`** se il loop di coda venisse reso condizionale invece che rimosso, o se
   la rimozione fosse parziale (§5.2).
3. **Normalizzazione invisibile** se adapter e getter finissero in commit diversi (§3, L-layer).
4. **Il typecheck sale a 41 durante il fronte B** ed e' atteso: la Fase 1 lo ha misurato. Torna a 33
   quando tutti gli otto siti sono chiusi. Un numero diverso da 33 al commit 2b **e'** uno scostamento
   da spiegare, non da accettare.
5. **`conversionList` cresce a ogni apertura di uno stato non ancora a 2.228**, una volta sola per
   progetto. La verifica 5 della slice 2 lo controlla.

---

## 7. Punti su cui chiedo prima di procedere

1. **Test vitest per la migration: dentro o fuori dal perimetro?** La convenzione del repo (due test
   `versionfixer_*` esistenti) vuole che il corpo dell'adapter sia **duplicato** in un test, perche'
   `VersionFixer.tsx` non e' importabile nell'ambiente node di vitest. Sarebbe l'unica copertura
   automatica che questo fronte puo' avere. Il prompt **non lo elenca** fra i file della slice 2b, e
   Rule 1 mi dice di non aggiungerlo di iniziativa. Lo scrivo o no?
2. **`NestedView.tsx:396`, il bottone che restera' visibile e muto** (§5.3). Tre opzioni: (i)
   lasciarlo, e accettare che su progetti vecchi ci sia un bottone inerte; (ii) nasconderlo, il che
   richiede una riga in `NestedView.tsx`, file **non** in perimetro nella slice 1; (iii) rimandarlo
   a `2.229` insieme alla purga, che e' il momento in cui quelle view spariscono e il bottone con
   loro. Propendo per (iii) — e' il minimo intervento e la purga chiude il caso da sola — ma la
   decisione e' tua.
3. **La root `state.viewpoint` resta stringa vuota, e non la normalizzo.** E' un campo distinto da
   `DProject.activeViewpoint` (precisazione 1 della Fase 1) e il prompt non lo nomina. Dopo slice 2b
   il vuoto avra' **due forme** nello stato persistito: `null` sul `DProject`, `''` sulla root. R-IRN-11
   fissa la forma canonica del vuoto e questa e' una divergenza dichiarata, non un dimenticanza:
   `activateViewpoint` (`lastViewpoint.ts:56`) scrive `viewpointId || ''` sulla root e il commit 2a
   tocca solo il primo dei due `SetFieldAction`. Confermi che la root resta com'e', o vuoi che 2a
   allinei anche quella?

---

## 8. Stato

Layer Impact Report prodotto, nessun file sorgente modificato, `git status --short` vuoto.
**Hard stop.** La slice 0 non parte senza il tuo go-ahead su questo documento **e** senza il
controllo da trenta secondi in dashboard (aprire un progetto, salvare, leggere la revisione): `2.3`
conferma la diagnosi di R-IRN-17, `2.6` la smentisce e la slice salta.
