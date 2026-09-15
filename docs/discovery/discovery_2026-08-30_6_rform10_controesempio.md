# Discovery 2026-08-30 — il contro-esempio a R-FORM-10: nessuno dei due assi lo spiega

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `433136733`
**Prompt**: «Discovery: il contro-esempio a R-FORM-10 (+ coda tree.scss)» — riempire la
matrice 2×2 cardinalità × percorso di delete lasciata aperta in §0 di
`discovery_2026-08-30_5_brokenref_fixture.md`. Solo discovery: zero fix.
**Sonde** (nessuna committata, nessuna in `npm run smoke`):
`frontend/scripts/smoke/_tmp_rform10_matrix.ts` (la matrice),
`_tmp_rform10_wrapclock.ts` (il controllo che precisa la regola),
`_tmp_rform10_render.ts` (domanda 3, due modi: `node` e `table`).
**Esito**: la variabile esplicativa **non è** in nessuno dei due assi del prompt.
È l'**istante in cui il proxy L è stato avvolto**. R-FORM-10 va **delimitata**, non
riscritta: quello che misura è vero, e non è tutto ciò che accade.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui
`grep` risolve in questa shell. Ogni asserzione di assenza porta il proprio
controllo positivo, e i controlli hanno lavorato: §7 elenca i tre casi in cui
hanno smascherato l'estrattore invece del prodotto.

---

## 0. La risposta in una riga

La cascata del core toglie **esattamente i puntatori entranti che esistevano
nell'istante in cui il proxy L, quello attraverso cui `.delete()` è chiamato, è
stato avvolto**. Non quelli che esistono quando la delete parte.

`TargetableProxyHandler` congela il D come oggetto bersaglio del `Proxy`
(`joiner/classes.ts:277`) e costruisce il `LogicContext` su **quello**
(`joiner/proxy.ts:397`). `Dummy.get_delete` chiede le dipendenze a
`get__jjdependencies(context)` (`common/Dummy.ts:53`), che itera
`data.pointedBy` — cioè lo **snapshot**, non lo store (`joiner/classes.ts:2108`).
Redux è immutabile: ogni scrittura successiva produce un nuovo oggetto in
`idlookup`, e lo snapshot non lo vede mai.

Quindi: 12d avvolgeva il proxy **dopo** aver scritto il riferimento, il fixture
lo aveva avvolto **prima**. Stessa primitiva, stessa cardinalità, due esiti.

## 1. La matrice 2×2 del prompt, riempita — e i due assi che non spiegano nulla

`_tmp_rform10_matrix.ts`, una sola pagina, cinque bersagli `Config` freschi creati
come li crea il fixture (`m1.addObject({}, cls.id, true)`), un solo referente
(`allNine_noref.cfg`) riscritto fra una cella e l'altra. Zero errori di pagina.

Asse **cardinalità**: `cfg` a `0..1` (com'è nel metamodello) e poi portata a `0..*`
con `SetFieldAction(cfgId,'upperBound',-1)`, dichiarato.
Asse **percorso**: entrambi i percorsi chiamano `LObject.delete()`. Ciò che li
distingue davvero è **dove nasce il proxy**:

- `deleteAdapter.runDeletes` avvolge **dentro il ciclo, subito prima** della delete
  (`components/editor-v2/hooks/deleteAdapter.ts:145-148`) → proxy fresco;
- il fixture `RowViewSmoke` costruisce `byName` alla riga `396-400`, scrive i
  riferimenti alla riga `410` (`applyPending`) e cancella con `byName.get('Config_old')`
  alla riga `505-506` → proxy avvolto **prima** della scrittura.

| | **0..1** | **0..\*** (due bersagli, si cancella quello in posizione 0) |
|---|---|---|
| **proxy fresco** (12d, `deleteAdapter`) | slot **VUOTO** — `len 0` | array **ACCORCIATO** — `len 2 → 1`, resta `[Config_0]` |
| **proxy stale** (fixture) | puntatore **APPESO** — `len 1`, `dangling 1` | puntatore **APPESO in posizione 0** — `len 2`, `dangling 1` |

Verbatim:

```
A slot DOPO: {"len":0,"values":[],"resolves":[],"dangling":0}
B delete con proxy STALE: {"pointedBy_visto_dalla_delete":6,"pointedBy_nello_store":7}
B slot DOPO: {"len":1,"values":["…_120"],"resolves":[null],"dangling":1}
C slot DOPO: {"len":1,"values":["…_126"],"resolves":["Config_0"],"dangling":0}
D delete con proxy STALE: {"pointedBy_visto_dalla_delete":6,"pointedBy_nello_store":7}
D slot DOPO: {"len":2,"values":["…_124","…_126"],"resolves":[null,"Config_0"],"dangling":1}
CTRL i cinque bersagli, vivi/morti: [{"i":0,"alive":false},…,{"i":3,"alive":false},{"i":4,"alive":true}]
```

**Le righe non cambiano fra le colonne: la cardinalità non spiega niente.** Le
colonne cambiano solo *nella forma* dell'esito corretto (svuota vs accorcia), che
è la distinzione che R-FORM-10 già registra fra `clear` e cascata. Il bersaglio
muore in tutte e quattro le celle (`CTRL`): la delete riesce sempre, è la pulizia
dei puntatori entranti che manca.

**E il «percorso» non è un asse:** `deleteAdapter.runDeletes` e il fixture chiamano
la stessa `Dummy.get_delete`. Ciò che il prompt chiama percorso, misurato, è la
freschezza del proxy.

Lo stato di partenza della stessa corsa porta il contro-esempio **in vivo**, prodotto
dal fixture e non dalla sonda:

```
0 allNine_broken.cfg (dopo la delete del FIXTURE): {"len":1,"resolves":[null],"dangling":1}
0 allNine_valued.cfg: {"len":1,"resolves":["Config_main"],"dangling":0}
0 Config vivi: ["Config_main"]
0 cardinalita` di cfg: {"lower":0,"upper":1,"composition":false}
```

## 2. Il meccanismo, misurato e non dedotto

Stessa sonda, sezione `M0`: **due proxy sullo stesso bersaglio**, uno avvolto prima
della scrittura del riferimento e uno dopo, letti nello stesso istante.

```
M0 pre-scrittura : {"pbBefore":6,"pbLiveBefore":6}
M0 post-scrittura: {"pointedBy_proxy_vecchio":6,
                    "pointedBy_proxy_fresco":7,
                    "pointedBy_store":7}
```

Il proxy vecchio continua a dire 6 mentre lo store dice 7. La settima voce è il
puntatore entrante appena scritto. `get__jjdependencies` legge 6, non trova lo slot
fra le dipendenze, e il `case 'values'` che farebbe
`SetFieldAction(dObj.id,'values',deletedID,'-=')` (`common/Dummy.ts:205`) **non viene
mai raggiunto per quello slot**.

Non è una race e non si cura con un'attesa: le celle B e D aspettano 3 secondi fra
la scrittura e la delete, e lo snapshot resta a 6. Non è R-FORM-11.

## 3. La regola esatta: è un orologio, non un interruttore

Se la regola fosse binaria («proxy fresco / proxy vecchio») due referenti scritti in
momenti diversi seguirebbero la stessa sorte. `_tmp_rform10_wrapclock.ts` misura che
non è così: **un bersaglio, due referenti, il wrap in mezzo, una sola delete**.

```
E2 wrap del proxy: {"pointedBy_nello_snapshot":7,"pointedBy_nello_store":7}
E3 scrittura del SECONDO referente (allNine_broken): "ok"
E4 prima della delete: {"pointedBy_snapshot":7,"pointedBy_store":8}
E6 DOPO — il primo referente : {"len":0,"resolves":[],"dangling":0}      ← svuotato
E6 DOPO — il secondo referente: {"len":1,"resolves":[null],"dangling":1} ← appeso
E6 il bersaglio e` morto?: true
```

Nella **stessa** delete il referente scritto prima del wrap si svuota e quello
scritto dopo resta appeso. La regola è l'istante del wrap, non una qualità del
proxy.

**Conseguenza sulla superficie viva.** `deleteAdapter` avvolge dentro il ciclo, dopo
la dilazione di R-FORM-11: sui suoi piani nessuna scrittura aggiunge puntatori *verso*
il morente fra il wrap e la delete (reassign e clear li tolgono), quindi il percorso
del manager **non è esposto** a questo. Il censimento più largo non è stato fatto:
`.delete()` compare in **67** punti di `frontend/src` fuori dai test, e questa
discovery non li ha classificati. È materiale per una slice, non un'affermazione di
questo referto.

## 4. Domanda 2 — R-FORM-10 va **delimitata**, non riscritta

Quello che R-FORM-10 misura resta vero e riproducibile: celle A e C. Ciò che va tolto
è la **generalità implicita** («un delete lascia uno slot vuoto») e la conclusione che
ne discendeva («non c'è nessun puntatore appeso da rendere»), che il fixture falsifica
e che le celle B e D riproducono a comando.

Proposta di testo — **la riscrittura la ratifica il design, non questo referto**:

> **R-FORM-10** (2026-08-30, delimitata il 2026-08-30) — **La cascata toglie i
> puntatori entranti che il proxy vedeva quando è stato avvolto.** Misurato: la
> cascata del core raggiunge `case 'values'` e fa
> `SetFieldAction(slot,'values',deletedID,'-=')`, quindi **accorcia** l'array
> (`0..*` a due bersagli, cancellato quello in posizione 0: `len` 2 → 1). Vale per i
> soli puntatori presenti in `pointedBy` **dello snapshot** su cui il proxy L è stato
> costruito (`joiner/classes.ts:277`, `proxy.ts:397`, `classes.ts:2108`): un
> riferimento scritto **dopo** il wrap sopravvive alla delete e resta appeso.
> `deleteAdapter.runDeletes` avvolge subito prima di cancellare e sta quindi nel caso
> pulito; il fixture `RowViewSmoke`, che avvolge in una fase precedente, è il
> contro-esempio e produce `brokenRef`. La cardinalità **non** entra nella regola:
> misurata 2×2, le due righe non cambiano fra `0..1` e `0..*`.
> Restano ratificate le due conseguenze già scritte: (1) il «ref rotto» della regola 2
> di 12d comprende anche il `required` rimasto senza valori, che `instanceTable` rende
> come `missing`; (2) `clear` e cascata sono due scritture diverse — buco contro
> accorciamento — e su un multivalore non coincidono.

Non tocco `docs/decisions.md`: solo discovery, come il prompt chiede.

## 5. Domanda 3 — i due stati esistono entrambi, e le due superfici non li trattano allo stesso modo

`_tmp_rform10_render.ts` costruisce i due stati **fianco a fianco** nello stesso
modello: `allNine_valued` con lo slot required svuotato (delete con proxy fresco),
`allNine_broken` con il puntatore appeso (delete con proxy stale), `allNine_noref`
mai scritto. `cfg` è portata a `required` (`lowerBound 1`) a runtime **e lo si
dichiara**: senza `required`, `missingRequired` è falso per costruzione
(`instanceTable.ts:208`) e la domanda non avrebbe risposta.

```
stato del D-graph: {"valued":{"len":0,"dangling":0},
                    "broken":{"len":1,"resolves":[null],"dangling":1},
                    "noref":{"len":0,"dangling":0}}
```

**La tabella li distingue** (modo `table`, ALL GREEN, con `tint` = `Green` come
controllo positivo della colonna):

```
allNine_valued  cfg* -> "missing"  .instance-manager__missing
allNine_noref   cfg* -> "missing"  .instance-manager__missing
allNine_broken  cfg* -> "broken"   .instance-manager__broken
```

Due classi diverse, due testi diversi, nessun trattino silenzioso: `Cell` mette
`missingRequired` **prima** dello switch sul renderer
(`InstanceManagerTab.tsx:100-107`), e `brokenRef` ha il proprio ramo (`:113-119`).

**Il nodo no** (modo `node`, ALL GREEN):

```
allNine_valued : AllNine   cfg -> dash       "—"
allNine_broken : AllNine   cfg -> brokenRef  "Config_0"
allNine_noref  : AllNine   cfg -> dash       "—"
```

`brokenRef` c'è ed è giusto — la riga legge il **nome** ricordato da
`brokenRefMemory`, non il puntatore accorciato. Ma **`missing` sul nodo non esiste**:
uno slot `required` svuotato da una delete e uno mai scritto dipingono lo stesso
trattino. Non è un difetto del renderer: `detectValueRenderer` decide su
`SlotShape`, che porta `isBroken` ma **non** `required` (l'interfaccia sta a
`valueRenderer.ts:324-365`, le guardie a `:619-631`), e
`missingRequired` vive **solo** nelle due superfici della tabella — misurato,
`command grep -rl missingRequired` porta due file, `instanceTable.ts` e
`InstanceManagerTab.tsx`, e nessuno sotto `editor-v2/nodes/`.

Quindi la risposta alla domanda 3 è **sì per la tabella, no per il nodo**, e
l'asimmetria è una **decisione di design da prendere**, non un bug da chiudere:
la regola 2 di 12d è scritta per la tabella del manager, e nessuna ratifica dice
oggi che il canvas debba segnalare un required vuoto. Se lo dovesse, servirebbe far
arrivare `required` fino a `SlotShape` — che tocca il contratto del renderer, cioè
molto più di questa coda.

## 6. La coda micro: `tree.scss`, le sette orfane preesistenti

Metodo R-NV-7: le variabili SCSS sono file-scoped, quindi il conteggio si fa
**dentro il file**. Verificato che qui lo scope regge davvero: `tree.scss` non è
`@use`d né `@import`ato da nessun foglio — entra da un solo `import './tree.scss'`
in `components/forEndUser/Tree.tsx:16` (controllo positivo: la stessa ricerca trova
gli import reali di `tree-view-sidebar.scss`). Nessun altro file può leggerne le
variabili.

Estrattore: per ogni `^\$nome`, il numero di righe del file che la nominano.
**1 = la sola dichiarazione.** Le orfane sono esattamente le sette che il referto
del 30-08 aveva dichiarato e non toccato:

```
$color-bg-secondary  $color-bg-tertiary  $color-border  $color-text-secondary
$font-size-sm        $radius-sm          $spacing-md
```

`$color-accent`, l'ottava, era già stata rimossa da `28a26fe34`. Controllo positivo
dell'estrattore: `$spacing-sm` conta 3, `$font-family` conta 5 — un estrattore che
rispondesse 1 su tutto sarebbe rotto, non informativo.

Rimosse le sette **dichiarazioni** e nient'altro: nessun commento di sezione resta
orfano (`// Colors` tiene `$color-text-primary`, `// Border Radius` tiene
`$radius-md`, `// Spacing` tiene `$spacing-xs` e `$spacing-sm`), nessuna riga
riformattata. Orfane residue dopo il diff: **0**.

**Gate: il CSS compilato è identico.**

```
HEAD : 03bbe9cbd7289c37fe66560f449eb292   3356 byte
diff : 03bbe9cbd7289c37fe66560f449eb292   3356 byte
```

3356 byte, non zero: la compilazione ha prodotto CSS vero, quindi il confronto ha
segnale. Il gate a pixel sul tree non ne ha (R-NV-8, reperto §4.2 del referto del
30-08) e non è stato usato: l'identità byte a byte del foglio prodotto è più forte
di un confronto di ritagli.

## 7. Reperti di metodo — i controlli hanno lavorato tre volte

1. **La colonna `cfg` non si chiama `cfg`.** L'intestazione di una feature required
   porta un asterisco (`cfg*`): `findIndex(h => h === 'cfg')` ha dato `-1` e la sonda
   ha stampato tre celle vuote. Erano tre misure dell'estrattore.
2. **La cella del nome non è un `td`.** Corretto l'indice, `tr.querySelectorAll('td')`
   slittava di uno e il controllo positivo su `tint` leggeva `DASHED`, cioè il valore
   di `stroke`. Con `tr.children` il controllo legge `Green` e le celle tornano al
   loro posto. **Senza il controllo positivo la prima stesura avrebbe chiuso la
   domanda 3 con «la tabella non distingue niente»** — un FAIL che descriveva la sonda.
3. **`2>&1` in una pipe verso `md5` misura anche gli avvisi di `sass`.** Un md5
   diverso su un CSS identico: il warning su stderr era finito nel digest. I due
   digest di §6 sono presi con `2>/dev/null` da entrambe le parti.
4. **Le due superfici non sono osservabili nella stessa pagina.** Aprire il canvas
   smonta la sidebar di progetto (`.psb-item` 2 → 0, `.mm-object` 0 → 8) e il manager
   si apre solo da lì. La sonda gira due volte sullo stesso setup invece di fingere
   che lo siano.

## 8. Gate

- `npm run build`: **exit 0**, solo l'avviso noto sui chunk > 500 kB.
- `npm run typecheck`: **33 = baseline**, su output completo. La prima corsa ne aveva
  dati 36: i tre in più sono `editor-v2/hooks/multiDraw.ts(160,161,163)`, file della
  sessione parallela, in volo nell'albero condiviso durante quella corsa. Verificato
  per differenza, non per congettura: rimosso il mio diff, ricorso il typecheck,
  contate 33, rimesso il diff. Il `diff` fra le due liste di errori porta quelle tre
  righe e nient'altro.
- Smoke visivo: le tre sonde sopra, **ALL GREEN** dove asseriscono, **zero errori di
  pagina** in tutte le corse. `npm run smoke` non è stato rigirato: il diff di
  sorgente è di sole dichiarazioni SCSS morte con CSS compilato identico byte a byte,
  e la stessa corsa era già dichiarata rossa per cause ambientali il 30-08.

## 9. Cosa NON è verificato

- **I 67 punti che chiamano `.delete()`**: contati, non classificati. Quanti tengono
  un proxy avvolto in una fase precedente è la domanda che questo referto apre e non
  chiude.
- **Se il comportamento sia un difetto o un contratto.** Questo referto misura cosa
  fa il core, non cosa dovrebbe fare. Una «riparazione» — rileggere `pointedBy` dallo
  store dentro `get__jjdependencies` invece che dallo snapshot — tocca `Dummy.ts` e
  `classes.ts`, cioè il cuore del D-L, e non è materiale per una coda.
- **Il nodo e `missing`**: l'asimmetria di §5 è misurata, la decisione no.
- **La finestra fra preflight e conferma nel manager**: se un referente nuovo comparisse
  fra il dialogo e il click, né il piano né la cascata lo vedrebbero. Plausibile per
  costruzione, **non misurato**.
- **Dark mode, view IR nei progetti salvati**: fuori scope, come nei referti precedenti.
