# ENG1 — i due difetti del core sul containment

**Data**: 2026-09-01 · **Slice**: ENG1 (parallela alla chiusura 10j, zero file condivisi)
**Perimetro**: `frontend/src/model/logicWrapper/LModelElement.tsx` e la sua suite core.
**Sonda**: `frontend/scripts/smoke/_tmp_eng1_measure.ts` (arm A/repro + A/verify, A1..A8).
**Origine**: `discovery_2026-08-31_10g_outline_doppi.md` §3 e §6 — due reperti misurati e
dichiarati fuori perimetro da quella slice.

Esito in una riga: **A è corretto e committato; B chiude qui come referto**, perché la
correzione non è locale e la lettura che sembrerebbe curarla non vede nulla.

---

## 0. Cosa può misurare questa sessione, e cosa no

`LModelElement.tsx` **non è importabile sotto vitest**. Riverificato qui con una sonda
usa-e-getta, non fidandosi del commento in `getTypeFallback.test.ts`:

```
FAIL  src/model/__tests__/_tmp_import_probe.test.ts > imports LModelElement
ReferenceError: window is not defined
 ❯ node_modules/monaco-editor/esm/vs/base/browser/window.js:14:27
```

Conseguenza operativa: la richiesta del prompt «riproduci in unit test il doppio append»
**non è eseguibile nella forma letterale**. La riproduzione è quindi una sonda Playwright
sull'app vera (`_tmp_eng1_measure.ts`), e i test committabili sul core restano statici
sul sorgente — la forma già adottata da `getTypeFallback.test.ts` e `getByNameKey.test.ts`.
Lo scarto è dichiarato qui, non aggirato.

---

## A. `set_containment` rifiutava e restituiva `true`

### A.1 Il censimento dei consumer — nessuno legge quel ritorno

Il prompt subordina il fix secco al censimento. Eseguito, con controllo positivo.

**Chiamate dirette.** `command grep -rn -E "set_(containment|composition|aggregation|isContainment)" src`
→ **sei righe, tutte in `LModelElement.tsx`**, e nessuna è una lettura del ritorno:

| riga | cosa |
|---|---|
| `:4053-4055` | `set_isContainment` / `set_isComposition` / `set_isAggregation` — rilanciano |
| `:4165` | la definizione |
| `:4238-4239` | `set_aggregation` / `set_composition` — rilanciano |
| `:7798` | un commento in `setValueAtPosition`, non una chiamata |

**Le assegnazioni sulla proxy.** Fuori dal core i siti che scrivono il flag sono cinque
(`canvasToJjom.ts:945,947,949,950`, `useClassRemoval.ts:194` che scrive `__raw`), tutti
nella forma `lRef.composition = true`. Nessuno in un `if`, un `&&` o un'assegnazione.

**Perché non potrebbero leggerlo comunque.** Il trap `set` della proxy
(`joiner/proxy.ts:476-483`) chiama il setter e **scarta il verdetto**:

```ts
if (typeof propKey !== 'symbol' && this.s + propKey in this.lg) {
    try {
        this.lg[this.s + propKey](value, logicContext);   // <- il ritorno non è preso
    } catch (e) { Log.eDevv('failed to set property', {targetObj, propKey, e}); }
    return true;                                          // <- ne rende uno suo, a mano
}
```

La riga è **load-bearing in due sensi**. Primo: `lRef.composition = true` non può osservare
il `false`, quindi il cambio non è visibile a nessun chiamante. Secondo: un trap `set` che
restituisse `false` farebbe **lanciare** l'assegnazione in strict mode — il `return true`
a mano è ciò che impedisce che la correzione si trasformi in una `TypeError`.

**Verdetto del censimento**: nessuno legge il ritorno → il fix è `return false` secco,
come previsto dal ramo (i) del prompt. Nessun chiamante da dichiarare.

Il censimento non vive solo in questo referto: è pinnato in `setContainmentVerdict.test.ts`
(«censimento dei consumer»), con il proprio controllo positivo — se un domani il trap
smettesse di scartare il verdetto, il test va rosso e il censimento va rifatto.

### A.2 La correzione

Un solo `return`, più il commento che porta la misura. La decisione di merito **non** è
cambiata: una self-composition resta bloccata; cambia solo la verità del ritorno.

### A.3 Le misure, sull'app vera

Fixture StateMachine/State con `states` (StateMachine → State) e `substates`
(State → State, l'auto-riferimento).

| | esito |
|---|---|
| A/repro: `substates` NON riceve composition | PASS — `composition=false` dopo l'assegnazione a `true` |
| A/controllo positivo: `states` la riceve | PASS — `composition=true` |
| A/verify: l'assegnazione rifiutata non lancia | PASS — `threw:false` |
| A/verify: la scrittura resta rifiutata | PASS — `substates.composition=false` |
| A/verify **per contrasto**: `aggregation` sullo stesso auto-riferimento | PASS — `aggregation=true` |
| A/verify: il warning è arrivato in console | PASS — `is generating a composition loop` |

L'arm «per contrasto» è la metà che dice che il `return false` **non** ha allargato il
rifiuto: l'auto-aggregazione, che il ramo non tocca, continua a passare e a scrivere.

**Un limite dichiarato.** Il comportamento osservabile prima e dopo la correzione è
*identico per costruzione* — è tutto il punto del censimento. La sonda quindi non può
distinguere il prima dal dopo: prova che il rifiuto e il warning ci sono e che nulla si è
rotto, non che il `return` è cambiato. Quella metà la provano i test statici, provati
contro sei mutazioni (§A.4).

### A.4 La suite

`frontend/src/model/__tests__/setContainmentVerdict.test.ts`, 11 casi, provata con **sei
mutazioni**: `return true` restaurato (2 rossi), warning rimosso (1), no-op che restituisce
`false` (2), guardia allargata anche ad `aggregation` (4), il trap che propaga il verdetto
(1), un quarto chiamante di `set_containment` (1). Verde al ripristino in tutte e sei.

---

## B. L'orfano del doppio append — referto, senza correzione

### B.1 La riproduzione

`_tmp_eng1_measure.ts` rifà la sequenza esatta del `link` in modo `live` di
`_tmp_10g_measure.ts`: indice letto come `values.length` dallo store, **nessuna attesa fra
i due append**. Il reperto di 10g §6 si riproduce identico.

```
A1  append #1 (Off)     idx=0  ret={success:true}  before=[]  after=[]
A1  append #2 (Broken)  idx=0  ret={success:true}  before=[]  after=[]

Cooler.states.values = ["Broken"]
Off     father=DValue(Cooler.states)   elencato da: []        <- ORFANO
Broken  father=DValue(Cooler.states)   elencato da: [Cooler.states]
```

Entrambe le scritture calcolano **indice 0**, perché `store.getState()` restituisce ancora
`[]` dopo la prima (`after: []`). La seconda sovrascrive la posizione 0, e la prima
occupante resta con `father` su uno slot che non la elenca più. Il ritorno è
`{success: true}`: **il chiamante non ha modo di accorgersene.**

### B.2 Le quattro varianti che isolano la variabile

| arm | cosa cambia | `values` | orfano |
|---|---|---|---|
| **A1** | la repro: due append, nessuna attesa | `["Broken"]` | **sì** |
| **A2** | gli stessi, con attesa fra i due | `["Off2","Broken2"]` | no |
| **A3** | gli stessi, senza attesa, **proxy dello slot riusata** | `["Broken3"]` | **sì** |
| **A4** | controllo positivo: un solo append | `["Off4"]` | no |
| **A5** | per contrasto, due `slot.values = [...]` senza attesa | `["Broken5"]` | **sì** |
| **A8** | i due valori in **una sola** `values = [a, b]` | `["Off8","Broken8"]` | no |

A3 è l'arm che **esclude la cache della proxy**: riusare o riprendere il proxy non cambia
nulla. Non è il proxy a essere stantio — è lo store.

### B.3 L'arm decisivo: il contratto di sovrascrittura è sano

Se la causa fosse `_clearValueAtPosition`, una sovrascrittura dell'indice 0 dovrebbe
lasciare l'orfano anche con lo stato propagato. **A6** la esegue, con l'attesa:

```
A6  Off6 -> indice 0, poi Broken6 -> indice 0 (con propagazione avvenuta)
    Cooler6.states.values = ["Broken6"]
    Off6    father = DModel        <- RILASCIATO, correttamente
    Broken6 father = DValue(slot)
    3 PASS / 0 FAIL
```

Il rilascio dello sfrattato funziona. **`_clearValueAtPosition` non è la causa.**

### B.4 La causa, dichiarata

`get_setValueAtPosition` deriva l'occupante da sfrattare da `context.data.values[index]`,
e `_clearValueAtPosition` fa lo stesso (`LModelElement.tsx:7732`). Entrambi leggono uno
stato che **non contiene ancora** la scrittura precedente, perché ogni dispatch è
posticipato **per progetto** in `redux/action/action.ts:349`:

```ts
setTimeout(()=>storee.dispatch({...this}), 0); // force action execution to be async, so i can add callbacks like AFTER_TRANSACTION
```

Misura della finestra (**A7**, `values.length` letta a più istanti dopo la scrittura):

```
pre=0  sync=0  micro=0  t0(setTimeout 0)=0  t50=1  t500=1
```

**È il reperto che chiude la questione del fix.** La correzione "ovvia" — far leggere a
`_clearValueAtPosition` lo store vivo invece di `context.data` — **non funzionerebbe**:
dentro la finestra, `store.getState()` è stantio quanto `context.data`. Non esiste una
lettura che veda la scrittura pendente. L'unica struttura che la vede è la coda
`pendingActions` di una TRANSACTION aperta (`action.ts:330`), ed è per questo che A8 è
verde: dentro **una sola** `set_values` gli indici li assegna il chiamante sull'array che
ha in mano, e la coerenza è per costruzione.

### B.5 Perché la slice chiude qui

Il prompt autorizza la correzione «solo se il fix è locale e a blast radius dichiarato».
Non lo è, per tre ragioni misurate:

1. **Nessuna lettura cura il difetto** (§B.4). Il fix non è una riga: è una decisione di
   progetto — o il chiamante tiene il proprio indice, o `setValueAtPosition` impara a
   *dichiarare* di non poter vedere lo stato che le serve. Entrambe cambiano il contratto
   pubblico del choke-point di scrittura del modello.
2. **Blast radius**: `get_setValueAtPosition` è il choke-point di **ogni** scrittura di
   slot (referto 2026-07-27 §Q1) — attributi, riferimenti, primitivi. Non è un ramo
   containment.
3. **Nessun path di produzione misurato la raggiunge.** I chiamanti di
   `.setValueAtPosition(` fuori dal core sono sei: `formWrite.ts:150,199`,
   `Info.tsx:759,776,780`, `ProjectEditor.tsx:2004`. I primi cinque scrivono **un indice
   per gesto utente**, ben fuori dalla finestra. `ProjectEditor.tsx:2004` scrive in ciclo
   ma su **indici distinti** (`ri`) e su slot vuoti: nessuna collisione, nessuno sfratto
   da calcolare. La forma pericolosa è una sola — *due scritture sullo stesso indice
   dentro la stessa finestra di propagazione, con la seconda che deriva l'indice dallo
   store* — ed è la forma delle **sonde**, non del prodotto.

Per RC-8 il campo `Causa` di un comportamento visto solo attraverso l'automazione è `(g)`.
Qui il difetto è reale nel core, ma la sua sola riproduzione misurata è strumentale: è la
stessa classe che `scripts/smoke/README-probes.md` §«Assert the setup, do not wait for it»
già documenta, e che ha già prodotto un FAIL attribuito al codice e appartenente alla sonda.

### B.6 Cosa dovrebbe contenere il prompt che segue

- **La decisione di merito, che non è dell'esecutore**: se `setValueAtPosition` debba
  restituire un verdetto distinto quando non può vedere lo stato su cui calcola lo sfratto,
  oppure se la coerenza resti un contratto del chiamante (un indice proprio, o una sola
  `set_values`). È la stessa famiglia di OQ-2/OQ-4 del 2026-07-27, e va decisa con quelle,
  non prima.
- **Un gate sulle sonde**, indipendente dal core e a costo quasi nullo: una `link`
  condivisa in `states.ts` che asserisca la forma costruita invece di ricalcolare l'indice
  dallo store. Toglie la sola riproduzione misurata senza toccare il model layer.
- **Il rischio da non correre**: far leggere lo store vivo a `_clearValueAtPosition`
  sembra la correzione e non lo è (§B.4). Curerebbe l'orfano solo dove già non c'è, e
  lascerebbe intatta la perdita del valore — che è la metà peggiore, perché senza orfano
  non lascia traccia.

---

## Riferimenti

- Origine: `discovery_2026-08-31_10g_outline_doppi.md` §3 (difetto A), §6 (difetto B).
- Mappa dei consumer di massa: `discovery_2026-07-27_containment_single_container_guard.md`
  §Q1 (choke-point), §Q4 (i punti di ingresso), OQ-2/OQ-4 (le decisioni aperte, non decise qui).
- Codice: `LModelElement.tsx:4165` (`set_containment`), `:7728` (`_clearValueAtPosition`),
  `:7752` (`get_setValueAtPosition`); `joiner/proxy.ts:476-483` (il trap `set`);
  `redux/action/action.ts:330,349` (la coda e il dispatch posticipato).
- Metodo: `scripts/smoke/README-probes.md` §«Assert the setup, do not wait for it».
