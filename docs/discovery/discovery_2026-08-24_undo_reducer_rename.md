# Discovery — l'undo del D-layer su una rinomina

**Data**: 2026-08-24
**Fase**: Parte B del prompt delle 23:30, read-only, effort xhigh
**Sintomo**: dopo una rinomina di un oggetto e un ⌘Z il nome non torna indietro, e da quel momento
le scritture successive sull'attributo non si riflettono più né sul canvas né sul tree view.
**Riprodotto**: Alfonso, 2026-08-24, prova 2 su `952d3cb94` (RC-8).
**Stato**: hard stop. Nessuna modifica al codice.

---

## 0. Sommario — l'ipotesi che spiega entrambi i sintomi non è nessuna delle tre del prompt

Il nome che non torna indietro e le scritture successive che non arrivano **non sono due difetti**:
sono le due facce dello stesso disallineamento, e la spiegazione sta in due righe che non
riguardano né `Uobj` né l'applicazione del delta.

```
joiner/classes.ts:2091-2099   get_name  →  legge il valore dello SLOT `$name`, e solo in sua
                                           assenza ripiega su `c.data.name`
joiner/classes.ts:2104        set_name  →  `if (c.data.name === name) return true;`
                                           cioè si autoprotegge confrontando `c.data.name`
```

Il lettore preferisce lo **slot**; lo scrittore si guarda da `data.name`. Finché i due sono
allineati la asimmetria è invisibile — ed è per questo che sta in piedi da sempre (CLAUDE.md
§3.12 la descrive e la dichiara load-bearing). Basta un undo che ne ripristini **uno solo** perché:

1. lo schermo continui a mostrare il nome nuovo, perché ogni lettore passa dal proxy L e quindi
   dallo slot — canvas e tree view allo stesso modo, il che spiega perché il difetto si vede anche
   dove editor-v2 non arriva;
2. ogni rinomina successiva **al valore mostrato a schermo** diventi un no-op silenzioso, perché
   `set_name` confronta con `data.name`, che è già quel valore.

Perché l'undo ne ripristini uno solo c'è un meccanismo misurato, il §2.3: `U.objectMergeInPlace`
è **superficiale e first-wins**, e fondendo un delta nel precedente ne **scarta l'intero
sotto-albero `idlookup`**. Se la scrittura dello slot e quella di `data.name` finiscono in due
dispatch distinti a meno di 450 ms l'uno dall'altro, l'informazione di undo del secondo non
esiste più.

Questa è l'ipotesi **(d)**, aggiunta alle tre del prompt. Le tre del prompt sono discusse al §3 e
risultano: **(a) non sostenuta** (misurata e scartata), **(b) parzialmente sostenuta ma non
sufficiente**, **(c) non sostenuta nella forma proposta**. Nessuna delle quattro è confermata:
il §6 dà la procedura di cattura che le discrimina in due comandi di console, senza aggiungere
codice.

---

## 1. Cosa scrive una rinomina

### 1.1 Il percorso comune — `LModelElement.set_name`

`joiner/classes.ts:2102-2128`:

```
:2104    if (c.data.name === name) return true;              // guardia sul solo data.name
:2106-2118  controllo di omonimia fra i figli del padre, con toast e rifiuto
:2120    TRANSACTION(this.get_name(c)+'.name', ()=>{
:2121        let nameattribute = (c.proxyObject as any).$name;
:2122        if (nameattribute && nameattribute.className === 'LValue') {
:2123            nameattribute.value = val;                  // (i) scrittura dello SLOT
:2124        }
:2125        SetFieldAction.new(c.data, 'name', name, '', false);   // (ii) scrittura di data.name
:2126    }, undefined, val)
```

Due scritture, non una. La (i) passa dal proxy (`LValue.set_value` → `setValueAtPosition`,
`LModelElement.tsx:7487`, `:7515`), la (ii) è una `SetFieldAction` diretta. Il guardiano di
`className === 'LValue'` alla `:2122` è corretto qui — CLAUDE.md §3.13 avverte che
`className === 'LValue'` su un proxy L è **sempre falso**, ma `$name` è ottenuto per accesso a
proprietà e questo ramo è quello storicamente vivo; **da verificare a runtime nel §6.2**, perché
se fosse falso lo slot non verrebbe scritto affatto e il disallineamento nascerebbe già in
scrittura, non nell'undo.

### 1.2 Le specializzazioni

- **`DClass`** — `model/logicWrapper/LModelElement.tsx:3060-3065`: guardia su `context.data.name`,
  poi `super.set_name`, poi `SetRootFieldAction('ClassNameChanged.'+id, val)`. Una scrittura in
  più su un campo transiente di primo livello.
- **`DModel`** — `LModelElement.tsx:5445-5460`: guardia su `c.data.name`, controllo di omonimia,
  poi una `TRANSACTION` con la **sola** `SetFieldAction` su `'name'`. **Nessuno slot**: un modello
  non ha `$name`, quindi il difetto di §0 non lo tocca. Utile come controllo negativo nella
  verifica a schermo (§6.4).
- **`DObject`** (il caso della prova 2) — CLAUDE.md §3.12: `LObject.set_name` scrive entrambi i
  lati; il ritorno slot → nome è una `SetFieldAction` diretta su `'name'` dentro
  `LValue.setValueAtPosition`, **mai** un `set_name`, e questa asimmetria è ciò che impedisce il
  ciclo. Significa che la scrittura dello slot ne genera una **terza** su `data.name`.

### 1.3 Da editor-v2

`components/editor-v2/sync/canvasToJjom.ts:605-616`:

```
:611        model.name = newName;   // il setter del proxy L apre la sua TRANSACTION
:613    } catch (err) {
:614        console.warn('[canvasToJjom] Failed to sync node label:', err);
```

**Ogni eccezione è inghiottita con un `console.warn`.** Se dopo l'undo il setter lancia — per uno
slot penzolante o per un `$name` non risolto — la rinomina non fa niente e non lo dice. È un
secondo modo, indipendente da §0, di produrre «le scritture successive non si riflettono». Il §6.3
lo discrimina in un colpo d'occhio sulla console.

### 1.4 Per tasto o alla conferma?

**Non misurato con certezza e dichiarato tale.** Non ho trovato il call site del campo nome del
pannello proprietà con una ricerca che potessi validare con un controllo positivo, e non voglio
scrivere «scrive alla conferma» sulla base di un silenzio (CLAUDE.md §5). Conta per due cose:
la granularità dell'undo percepita, e il numero di delta che entrano nella finestra di 450 ms del
§2.3. La risposta si legge a runtime nel §6.1, contando i delta spinti mentre si digita.

---

## 2. Come viene registrato il delta

### 2.1 La catena

`reducer` (`reducer.ts:598`) → `unsafereducer` (`:632`) → `_reducer` (`:1151`) → `doreducer`.
Il delta si calcola in `_reducer`, `:1199`:

```
:1199    let delta = Uobj.objectDelta(ret, oldState, true, false);
```

Ordine dei parametri invertito di proposito: `objectDelta(old, neww)` ritorna «cosa cambia da
`old` a `neww`», quindi passando `(statoNuovo, statoVecchio)` si ottiene il delta **che riporta
indietro**, cioè l'undo. Corretto.

### 2.2 I marcatori del formato

In `common/UObj.ts`:

- **`__jjObjDiffIsArr`** (`:157`) — posato su ogni livello di delta il cui `neww` è un array.
  In applicazione `:180` lo salta come chiave e `:157`/`:194-215` lo usa per ricostruire un array
  a partire dall'oggetto-delta, `length` compresa.
- **`__jjObjDiffEmptyElem`** (`:148`) — valore sentinella per una chiave presente nel nuovo stato e
  assente nel vecchio; in applicazione (`:181-184`) fa `delete statelevel[key]`. È la via con cui
  un undo **cancella** un elemento creato dall'azione.
- **`_-` come prefisso di chiave** — **codice morto**: `removedprefix` è inizializzato a stringa
  vuota (`:139`, `let removedprefix = ""; // "_-";`) e il ramo corrispondente in
  `applyObjectDelta` è commentato (`:178`). La convenzione citata dal prompt non è in vigore.
- **`__jjisEmpty`** — citato nel commento di `reducer.ts:1221-1222` come motivo per non riusare
  `applyObjectDelta` nella fusione, ma **non esiste in `UObj.ts`**: nessuna occorrenza. Commento
  invecchiato.
- **`clonedCounter`** — non è un marcatore di `Uobj` ma di `deepCopyButOnlyFollowingPath`
  (`reducer.ts:103-104`): ogni oggetto clonato lungo il percorso di scrittura riceve
  `clonedCounter = 1 + (…||0)`. Compare quindi in **ogni delta a ogni livello**, `idlookup`
  incluso. Che sia una fonte nota di guai lo dice `reducer.ts:1087`, che lo salta esplicitamente
  iterando `ClassNameChanged`: qualunque campo a dizionario iterato senza quella guardia lo vede.

### 2.3 La fusione — il fatto centrale

`reducer.ts:1204-1256`. Con `isRelevantChange` falso il delta corrente viene **fuso** nel
precedente:

```
reducer.ts:1246    U.objectMergeInPlace(pastDelta, delta);
reducer.ts:1247    delta = pastDelta;
```

E `U.objectMergeInPlace` è (`common/U.tsx:892-902`):

```
:897    for (let key in o) {
:899        out[key] ?? (out[key] = o[key]);
:900    }
```

**Superficiale e first-wins.** Un solo livello, nessuna ricorsione, e la chiave già presente
nell'accumulatore non viene toccata. Poiché `pastDelta` è il delta **più vecchio** e `delta` il
più nuovo, per uno scalare il comportamento è quello giusto: per disfare fino a prima della prima
modifica serve il valore più antico.

Ma `idlookup` è **una chiave sola**. Se `pastDelta.idlookup` esiste — e esiste in praticamente
ogni delta — allora `out['idlookup'] ?? …` corto-circuita e **l'intero sotto-albero `idlookup` del
delta nuovo viene scartato**, non fuso. Tutto ciò che quel delta sapeva su elementi diversi, o su
campi diversi dello stesso elemento, sparisce dalla storia.

Corollari misurati:

- **`mergeRecompileArr` è morta**: `reducer.ts:1225` è un `return;` incondizionato in testa alla
  funzione. Era l'unico pezzo che trattava a parte gli array `*RECOMPILE*`, `ELEMENT_*` e
  `ClassNameChanged`; il commento alla `:1226` («ricorda che possono essere veri array oppure
  finti array-delta con `__jjObjDiffIsArr = true`») descrive esattamente il caso che nessuno
  gestisce più. Anche quei campi passano quindi dalla regola superficiale.
- La fusione **muta `pastDelta` sul posto**, e `pastDelta` è l'oggetto già dentro
  `statehistory[user].undoable` **e** dentro `statehistory.all.undoable` (spinti insieme alle
  `:1259-1260`). La storia viene riscritta a posteriori.
- Latente, non attivo: `reducer.ts:1208` indicizza `statehistory[sender].undoable` con
  `statehistory.all.undoable.length - 1`, due array diversi. Oggi restano allineati perché ogni
  push e ogni shift li tocca entrambi (`:1259-1262`, `:1335-1338`) e `doUndoRedo` rimuove da tutti
  gli utenti (`:1130`, il `for…in` include `all`). Con due sender diverghererebbero. **Dichiarato,
  non è la causa di questo difetto.**

### 2.4 Che forma ha il delta di una rinomina

Una `TRANSACTION` chiude con `END` → `FINAL_END` (`redux/action/action.ts:142-153`) e produce
**un solo dispatch**, quindi un solo delta: le due scritture del §1.1 stanno insieme, e finché è
così l'undo le riporta indietro entrambe. Il rischio è quello che **sfugge** alla transazione:

- il `setInterval(()=> COMMIT(undefined, false), U.UpdatingTimer)` (`reducer.ts:1443`, 300 ms)
  flusha le azioni pendenti in un dispatch **suo**;
- la propagazione slot → nome di `setValueAtPosition` (§1.2) è una scrittura in più che può
  cadere in quel flush;
- il click che segue la rinomina produce un delta `_lastSelected` che, entro 450 ms, **fonde e
  scarta**.

Ognuno di questi è un secondo delta a meno di 450 ms dal primo, e la regola del §2.3 ne butta via
`idlookup`. È qui che nasce il disallineamento del §0. **Quale dei tre sia, si vede solo a runtime**
(§6.1).

---

## 3. Come viene applicato all'undo, e le ipotesi

`reducer.ts:1319-1339`:

```
:1326    let undonestate = Uobj.applyObjectDelta(state, delta, false);
:1328    let delta2 = Uobj.objectDelta(undonestate, state);      // il delta di redo
:1329    let debug = Uobj.applyObjectDelta(undonestate, delta2, false, state);
:1335    statehistory[user][key].push(delta2);
```

Il terzo argomento `inplace` è **`false`**: `UObj.ts:169` fa `statelevel = {...statelevel}` (o
`Uarr.arrayShallowCopy`) a **ogni livello in cui il delta scende**, e ricorre alla `:190`. Quindi
non muta l'input e produce riferimenti nuovi lungo tutto il percorso del delta. Il quarto
argomento `asserteq` (riga `:1329`) fa un confronto `stringify` e logga in dev se la coppia
delta/anti-delta non è invertibile: **un canale di allarme già presente, da guardare in console**
(§6.3).

### (a) Lo stato dopo l'undo condivide riferimenti e i subscriber non vedono il cambiamento

**Non sostenuta.** Misurato sopra: con `inplace=false` ogni livello toccato è copiato. Il livello
`idlookup` e l'elemento `idlookup[id]` sono nuovi oggetti. React-Redux vede il cambiamento.

Un residuo però esiste ed è compatibile col sintomo per un'altra via: `doUndoRedo` **con lo stack
vuoto** ritorna `oldState` (il `continue` alla `:1129`), e `unsafereducer:636` fa
`if (ret === oldState) return oldState`, saltando l'intera post-passata. È il caso del no-op, non
del difetto.

### (b) L'undo lascia nello stato un marcatore che le scritture successive non sovrascrivono

**Parzialmente sostenuta, non sufficiente.** Due marcatori possono davvero atterrare nello stato:
`clonedCounter` (§2.2), che vi atterra comunque anche senza undo; e `__jjObjDiffIsArr`, che
`applyObjectDelta:180` salta come chiave **ma** alla `:194` usa per **convertire in array** il
livello di stato corrispondente. Se per una fusione mal riuscita quel marcatore finisse su un
livello a dizionario — `idlookup`, o un `DObject` — quel livello diventerebbe un array e tutto ciò
che lo indicizza per id smetterebbe di funzionare. Sarebbe coerente col sintomo, ma è un salto
che non ho potuto misurare staticamente: la fusione del §2.3 **scarta** i sotto-alberi invece di
mescolarli, quindi non è la via ovvia perché un marcatore migri di livello. Discriminante nel §6.2:
`Array.isArray(idlookup)` e la presenza di `__jjObjDiffIsArr` fra le chiavi.

### (c) L'undo ripristina un indice derivato nome → id e le viste risolvono per nome

**Non sostenuta nella forma proposta.** Un indice nome → id non esiste. `ClassNameChanged`
(`redux/store.tsx:208`) è l'unica cosa che gli somiglia, ma va nella direzione opposta
(id → nome vecchio), è transiente — azzerato a `reducer.ts:1100` a ogni giro — ed è consumato solo
da `RuntimeAccessibleClass.makeOCLConstructor` (`:1096`) per i nomi dei tipi OCL. Riguarda i
`DClass`, non i `DObject` della prova 2, e non ha nulla a che vedere col rendering del nome.

### (d) Lettore e scrittore del nome guardano due sorgenti diverse — **l'ipotesi che spiega tutto**

Misurato al §0. Ricapitolando la meccanica completa:

1. Un undo riporta indietro **uno solo** fra lo slot `$name` e `data.name`, perché l'altro viveva
   in un delta scartato dalla fusione del §2.3.
2. Lo schermo non cambia: `get_name` (`classes.ts:2091-2099`) legge lo slot per primo e ripiega su
   `data.name` **solo se lo slot è `undefined`**. Canvas e tree view passano entrambi dal proxy L,
   quindi mostrano entrambi la stessa cosa sbagliata — e questo spiega il fatto che il prompt usa
   come prova che la corruzione è nello stato: non è editor-v2, è il lettore condiviso.
3. Le rinomine successive muoiono: `set_name` (`classes.ts:2104`) apre con
   `if (c.data.name === name) return true;`. Se l'undo ha riportato `data.name` a 'A' mentre lo
   schermo mostra 'B', rinominare in 'A' — cioè correggere ciò che si vede — è un **no-op
   silenzioso**; e la guardia di omonimia fra fratelli (`:2107-2118`) confronta `DNamedElement.name`
   dei fratelli, cioè `data.name`, quindi può rifiutare per omonimia un nome che a schermo non è
   in uso.

La simmetria fra i due sintomi — non torna indietro **e** non si può più correggere — è ciò che
nessuna delle altre tre ipotesi produce con una sola causa.

**Non è confermata.** Serve la lettura del §6.2. Se slot e `data.name` risultano **uguali** dopo
il ⌘Z, l'ipotesi (d) cade e resta (b), da attaccare con `Array.isArray` e le chiavi marcatore.

---

## 4. `VIEWS_RECOMPILE_all`

Chi lo scrive sul percorso di undo: `doUndoRedo:1148`,
`state.VIEWS_RECOMPILE_all = [...new Set(removedDeltas.flatMap(d => Object.keys(d?.idlookup||{})))]`
— gli id toccati dai delta disfatti.

Chi lo consuma: `unsafereducer:678-730`, cioè **dopo** il ritorno di `_reducer`. Contrariamente a
quanto si potrebbe supporre, **la post-passata gira anche per un `UndoAction`**: `_reducer` ritorna
`doUndoRedo(...)` e `unsafereducer` prosegue. L'unica eccezione è il caso a stack vuoto, dove
`ret === oldState` e la `:636` esce prima. Quindi:

- `:678` — la forma `true` viene espansa in tutte le chiavi di `idlookup`; la forma **array** è
  quella che l'undo produce, ed è la forma normale del campo, non un caso speciale: la differenza
  fra `true` e array è solo l'ampiezza dell'invalidazione, non la sua natura.
- `:689-729` — per ogni id: `DViewElement` → `css_MUST_RECOMPILE`, `transientProperties.view[id]`
  azzerato, e ogni `VIEWS_RECOMPILE_*` popolato; `DModelElement` → i `MODELS_RECOMPILE_*`, e per i
  soli `DClass` il confronto vecchio/nuovo nome che alimenta `ClassNameChanged` (`:707-708`);
  `DGraphElement` → `delete transientProperties.node[id]` e i `NODES_RECOMPILE_*`.
- `:730` — riazzerato a `[]`.

Conclusione: **l'invalidazione delle cache transiente avviene anche sull'undo**, e per un `DObject`
il ramo `DModelElement` scatta. Non è quindi una cache non invalidata a tenere il nome vecchio sullo
schermo: è il fatto che il valore letto — lo slot — è davvero ancora quello nuovo. Questo **rafforza
l'ipotesi (d)** ed è la ragione per cui l'ho anteposta a (b).

Nota a margine, dichiarata: `:707` legge il nome vecchio da `oldState.idlookup[d.id]` e quello nuovo
da `ret.idlookup[d.id]`, cioè da `data.name`, non dallo slot. Sui `DClass` con slot identità la
stessa asimmetria del §0 si ripresenta qui.

---

## 5. Il renderer classico

Lettura statica. Il difetto **vale anche lì**, e per lo stesso motivo, con due precisazioni:

1. La sorgente del difetto non è in editor-v2: `get_name`/`set_name` stanno in `joiner/classes.ts`,
   `objectMergeInPlace` in `common/U.tsx`, la fusione in `reducer.ts`. Nessuno dei tre sa chi sta
   disegnando.
2. Nel classico l'undo del D-layer è raggiungibile **dopo un drop**, che è l'unico scrittore di
   `U.userHasInteracted` (`MetamodelTab.tsx:164`). Prima del primo drop lo stack è vuoto esattamente
   come lo era in editor-v2 prima di `398a71293`, quindi il difetto è invisibile — il che spiega
   perché nessuno lo abbia mai visto: nel classico serve fare **prima** un drop e **poi** una
   rinomina, una sequenza che non è quella di lavoro tipica.

**Protocollo per la prova a schermo, se Alfonso la ritiene utile** (io la ritengo utile: separa un
difetto del core da un difetto di editor-v2, e costa un minuto):

1. Apri un metamodello nel renderer classico, hard refresh.
2. Trascina una classe dalla palette sulla tela (alza `U.userHasInteracted`).
3. Aspetta due secondi — serve a superare la finestra di 450 ms e a non far fondere il passo dopo.
4. Rinomina un elemento **che abbia uno slot identità** (un oggetto M1, non un modello) da 'A' a 'B'.
5. Aspetta due secondi. ⌘Z.
6. Osserva: il nome torna ad 'A'?
7. Rinomina di nuovo, in 'A'. Succede qualcosa?

Se al 6 il nome non torna e al 7 non succede niente, il difetto è del core e vale ovunque. Se nel
classico funziona, la differenza è nel numero e nella cadenza dei dispatch, e va cercata lì.

---

## 6. Procedura di cattura a runtime — nessun codice da aggiungere

Lo store **è già esposto**: `redux/createStore.ts:7` fa `windoww.store = store`, e
`redux/store.tsx:83` fa `(window as any).statehistory = statehistory`. CLAUDE.md §15.4 documenta il
doppio `w`. Anche `stableStringify` è globale (`UObj.ts:4`). Non serve nessuna riga dev-only.

### 6.1 Prima del gesto — quanti delta produce una rinomina

```js
// incolla e lascia girare mentre rinomini
const H = () => { const h = statehistory[windoww.DUser?.current] || statehistory.all; 
                  return { undo: h.undoable.length, redo: h.redoable.length }; };
H();  // prima
// ... rinomina 'A' -> 'B', poi aspetta due secondi ...
H();  // dopo: +1 = un solo delta; +2 o piu' = i dispatch sono separati, la fusione ha morso
```

Se il pannello scrive a ogni tasto (§1.4), il contatore cresce di uno per carattere solo se i tasti
distano più di 450 ms; digitando normalmente resta a +1 e i caratteri intermedi sono fusi.

### 6.2 Attorno al ⌘Z — il discriminante fra (d) e (b)

Con l'oggetto selezionato, prendi il suo id (è quello del `DObject`; si legge da
`windoww.store.getState()._lastSelected` o dal pannello):

```js
const ID = '<id del DObject>';
const snap = () => {
  const s = windoww.store.getState();
  const d = s.idlookup[ID];
  // lo slot identita': il DValue la cui feature e' l'attributo 'name'
  const slots = (d.features||[]).map(f => s.idlookup[f]).filter(Boolean);
  const nameSlot = slots.find(v => {
    const f = s.idlookup[v.instanceof]; return f && f.name === 'name'; });
  return {
    dataName: d.name,
    slotValue: nameSlot && nameSlot.values,
    idlookupIsArray: Array.isArray(s.idlookup),
    markers: Object.keys(d).filter(k => k.indexOf('__jj') === 0),
    idlookupMarkers: Object.keys(s.idlookup).filter(k => k.indexOf('__jj') === 0),
    ref: d,
  };
};
const before = snap(); before      // PRIMA del Cmd+Z
// ... premi Cmd+Z ...
const after = snap(); after        // DOPO
after.ref === before.ref           // false atteso: l'undo copia il livello
```

Lettura del risultato:

- `after.dataName !== after.slotValue[0]` → **ipotesi (d) confermata**. È la causa.
- `after.idlookupIsArray === true`, oppure `markers`/`idlookupMarkers` non vuoti → **ipotesi (b)**:
  un marcatore di formato è atterrato nello stato.
- `after.ref === before.ref` → **ipotesi (a)**, che la lettura statica dice impossibile: se
  succedesse, la lettura statica è sbagliata e va rifatta.
- Tutti e tre negativi e il nome comunque fermo a schermo → il difetto è a valle dello stato, e il
  fronte cambia: si guarda `transientProperties`, non il reducer.

Se `features` non è il nome giusto del campo degli slot su questo `DObject`, si trova con
`Object.keys(windoww.store.getState().idlookup[ID])` — non l'ho verificato a runtime e non voglio
darlo per buono.

### 6.3 I due canali di allarme già presenti

Con la console aperta e il filtro sui warning, durante la sequenza:

- `deltas: error in Uobj.diff, UObj.delta or UObj.patch, assertion failed` — è l'asserzione
  `asserteq` di `reducer.ts:1329` / `UObj.ts:216-220`. Se compare, il delta e il suo inverso non
  sono invertibili e il difetto è **dentro `Uobj`**: cambia tutto il perimetro del §7.
- `[canvasToJjom] Failed to sync node label:` — è il `catch` di `canvasToJjom.ts:614`. Se compare
  alla rinomina successiva, la scrittura sta lanciando e il ramo è quello del §1.3.

### 6.4 Il controllo negativo

Rinomina un **modello** (`LModel.set_name`, `LModelElement.tsx:5445`, che non ha slot identità) e
fai ⌘Z. Se il nome del modello torna indietro correttamente mentre quello dell'oggetto no, lo slot
è provato come discriminante senza bisogno di leggere lo stato.

---

## 7. Perimetro del rimedio — opzioni, senza sceglierne una

Tutte e tre le sedi possibili sono **core**: `common/U.tsx`, `common/UObj.ts`, `redux/reducer/`.
Nessuna è toccabile senza discussione (CLAUDE.md, regola 5).

### (i) Correggere l'applicazione del delta

**Non è qui il difetto**, se vale (d): `applyObjectDelta` applica correttamente il delta che
riceve; il delta è già monco quando arriva. Diventa l'opzione giusta solo se il §6.3 mostra
l'asserzione `asserteq` fallita.
*Diff*: ignoto finché non si sa cosa correggere. *Rischio*: massimo — `Uobj` è sotto ogni scrittura.

### (ii) Registrare i delta in una forma diversa / correggere la fusione

La correzione minima e mirata è rendere **profonda** la fusione di `reducer.ts:1246`, conservando la
regola first-wins per foglia: oggi `idlookup` è una chiave sola e il primo che arriva vince tutto.
Una `mergeDeep(pastDelta, delta)` che scenda negli oggetti e applichi `??` solo sulle foglie
risolverebbe la perdita del §2.3 senza cambiare la semantica voluta.
*Diff*: una funzione nuova in `U` o in `Uobj` più una riga in `reducer.ts`; va deciso cosa fare di
`__jjObjDiffIsArr` e delle chiavi array, che è esattamente ciò che `mergeRecompileArr` doveva fare
e non fa più (§2.3) — quindi il diff vero include il ripristino o la riscrittura di quella funzione.
*Rischio*: **alto**. Cambia la forma di ogni delta di ogni azione; l'undo del D-layer è oggi
inerte in editor-v2 (kill-switch) ma **non** nel classico dopo un drop, quindi una regressione qui
si vede là. Vuole test propri su `Uobj`/`U`, che oggi non esistono.

### (ii-bis) Rimuovere l'asimmetria fra `get_name` e `set_name`

Non è nel reducer ed è la causa prossima del sintomo, non della perdita di dati. Far leggere a
`set_name` la stessa sorgente che `get_name` privilegia — la guardia `:2104` confrontata con
`this.get_name(c)` invece che con `c.data.name` — toglierebbe il no-op silenzioso e renderebbe le
rinomine successive di nuovo efficaci, **senza** riparare l'undo.
*Diff*: una riga in `joiner/classes.ts`, più le due guardie omologhe in `LModelElement.tsx:3061` e
`:5446`. *Rischio*: **medio e sottovalutabile**. §3.12 dichiara load-bearing l'asimmetria fra le due
direzioni; questa toccherebbe la guardia, non la direzione, ma va istruita con la stessa cura.
Attenzione: è un cerotto — cura il sintomo visibile e lascia l'undo che perde metà delle sue
informazioni.

### (iii) Tenere spento il D-layer undo in editor-v2 e tornare a una storia di sessione per la
### sola geometria

Il design **A1** del prompt delle 18:45, scartato allora perché la cattura di `Navbar` rende ⌘Z
irraggiungibile da editor-v2 (report principale §1.2). Diventa la scelta se il core non si tocca,
con la conseguenza dichiarata: l'undo di editor-v2 funziona **dai soli pulsanti della toolbar**,
⌘Z resta un no-op finché `U.userHasInteracted` è falso.
*Diff*: il kill-switch resta com'è, e sopra si rimette il piano del prompt delle 18:45 — snapshot a
inizio gesto (`onNodeDragStart` + primo `resizing:true`), write-back per resolver in
`handleUndo`/`handleRedo`, `clear()` di `useHistory` al cambio di chiave di layout. Due file,
`EditorV2.tsx` e `useHistory.ts`, tutto già misurato ai §2, §3 e §4 del report principale.
*Rischio*: **basso**, ed è l'unica opzione che non tocca il core. Costo: due sistemi di undo che
convivono e possono divergere, che è precisamente ciò che il GO delle 19:10 voleva evitare, e
niente undo per le modifiche non geometriche.

### Una nota sull'ordine

Le tre opzioni non sono alternative pure. (iii) è **disponibile subito** e non preclude nulla;
(ii) è la riparazione vera e va misurata prima di essere tentata; (ii-bis) è un cerotto che, se
applicato da solo, **nasconde** il difetto di (ii) rendendolo più difficile da trovare la prossima
volta. Se si sceglie (ii-bis), va scritto a registro che l'undo perde ancora informazioni.

---

## 8. File letti

`redux/reducer/reducer.ts` (`:82-180`, `:534-545`, `:598-735`, `:1080-1160`, `:1190-1345`,
`:1425-1445`); `common/UObj.ts` (intero, `:1-240`); `common/U.tsx` (`:170-215`, `:885-925`);
`joiner/classes.ts` (`:530-540`, `:970-980`, `:2085-2130`, `:2600-2660`);
`model/logicWrapper/LModelElement.tsx` (`:3055-3070`, `:5440-5465`, `:7480-7520`, censimento
`setValueAtPosition` e `transientProperties.modelElement`);
`redux/action/action.ts` (`:115-160`, `:200-245`, `:285-310`, `:655-705`);
`redux/store.tsx` (`:70-130`, `:200-240`); `redux/createStore.ts`;
`components/editor-v2/sync/canvasToJjom.ts` (`:600-635`);
`components/abstract/tabs/MetamodelTab.tsx` (`:130-170`);
`components/topbar/undoredocomponent.tsx` (`:55-130`); `view/viewElement/view.tsx` (censimento
`VIEWS_RECOMPILE`); CLAUDE.md §3.12, §3.13, §15.4; il report principale
`discovery_2026-08-24_undo_editor_v2_layout.md`.

---

## 9. Hard stop

Report chiuso, nessuna modifica al codice. Il kill-switch della Parte A (`5a75b2e09`) tiene il
difetto fuori portata in editor-v2 nel frattempo; nel renderer classico dopo un drop **resta
raggiungibile** e questo report non lo cambia.

La prossima mossa non è un diff: è il §6.2, che costa due incollature in console e sceglie fra (d)
e (b). Senza quella lettura ogni opzione del §7 è una scommessa. Nessuna Parte C senza GO.
