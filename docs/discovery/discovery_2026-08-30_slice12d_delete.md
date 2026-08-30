# Discovery — slice 12d: la primitiva di delete del core, misurata

Data: 2026-08-30. Sonde: `frontend/scripts/smoke/_tmp_delete_primitive.ts`,
`_tmp_delete_multi.ts`, `_tmp_clear_then_delete.ts`, `_tmp_clear_two.ts`,
`_tmp_instance_manager_12d.ts` (nessuna committata).
Fixture: `RowViewSmoke`, servito dal dev server su `localhost:3000`.

Il prompt di 12d chiede una cosa sola prima del diff: **verificare la primitiva di
delete del core come 2c fece con `addObject` — misura, non assunzione**. Questo
documento è quella misura. Tre delle quattro risposte contraddicono ciò che era
scritto altrove, e una di esse contraddice una riga di `decisions.md`.

---

## 1. La cascata di containment: il core NON la fa

**Misurato** (`_tmp_delete_primitive.ts`, punto B). `cfg` acceso a `composition`
a runtime, un `Config` creato dentro `allNine_broken` con `addObject`, poi
`allNine_broken.delete()`:

```
B2 conteggio prima della delete del contenitore: {"count":7,"hasChild":true}
B3 delete allNine_broken (il contenitore): {"ok":true, ...}
B4 dopo: {"count":6,"hasChild":true,"hasOwner":false}
B5 stato del figlio: {"gone":false,"father":"Pointer…78","fatherResolves":false,"fatherClass":null}
```

7 → 6: è morto **solo** il contenitore. Il figlio è vivo, e il suo `father` non
risolve più: **un orfano**.

**Perché**, letto nel core e non dedotto. `Dummy.get_delete` (`common/Dummy.ts:83`)
cascata su `lDeleted.children`. Per un `DObject`, `children` sono i suoi slot
(`LModelElement.tsx:6439`: `[...annotations, ...features]`). Per un `DValue`,
`LValue` **non** dichiara `get_children_idlist`, quindi eredita quello di base
(`:727`), che restituisce le sole `annotations`. Un `DObject` contenuto sta nei
`values` dello slot, non in nessun `children`: la ricorsione non lo raggiunge mai.
Il commento nel core («if a m1-dvalue which conforms to a m2-reference with
"containment" is deleted, the target is also deleted because is a "children" of
it») descrive un'intenzione, non il codice.

**Conseguenza operativa.** L'orfano è **invisibile**: ogni lista del manager
risale `father` fino a un `DModel` (`instanceManagerModel.modelIdOfObject`), e una
catena rotta restituisce `null`. Non è un modello sporco che si vede, è una perdita
silenziosa.

**Correzione a `decisions.md`.** La riga «Slice 2c — create e delete … il cascade
canonico gia' cancella i contenuti (`Dummy.get_delete`) e non chiede» è **falsa**
per le istanze M1. Era un'assunzione, mai misurata. La cascata la fa l'adapter.

## 2. I puntatori entranti: il core LI TOGLIE, per valore

**Misurato** (`_tmp_delete_primitive.ts`, punto A):

```
A0 slot cfg di allNine_valued PRIMA: {"values":["…47"],"resolve":["Config_main"]}
A1 delete Config_main: ok
A2 slot cfg di allNine_valued DOPO: {"values":[],"resolve":[]}
```

E su un multivalore (`_tmp_delete_multi.ts`), `cfg` portata a `0..*` e lo slot a
due bersagli:

```
slot prima della delete: {"values":["…47","…49"],"len":2}
slot DOPO la delete del target in posizione 0: {"values":["…49"],"len":1}
```

L'array è **accorciato**, non bucato: `Dummy.get_delete` raggiunge
`case 'values'` e fa `SetFieldAction(dObj.id, 'values', deletedID, '-=')`.

Questo **contraddice** il commento del fixture `RowViewSmoke` (`index.ts`, riga
~477, datato 2026-08-28): «Deleting the target leaves the pointer dangling in the
referring slot … The reducer scrubs no inbound pointer». Sul codice di oggi non è
così. Il fixture nota anche, poche righe sopra, che «the broken reference renders
as a dash, not as `brokenRef`»: è la stessa cosa vista dall'altro capo — non c'è
nessun puntatore appeso da rendere, c'è uno **slot vuoto**.

**Conseguenza sulla regola 2 di 12d.** «Dopo un delete sporco la tabella mostra il
ref rotto come tale — non `—`, non vuoto silenzioso» non può significare «puntatore
appeso», perché il core non ne lascia. Significa l'altra metà di ciò che la sezione
2 del contratto chiama ref rotto: «id assente **o ""**». Un ref `required` rimasto
senza valori è esattamente quello, ed è la cella che ora dice `missing`.

## 3. Il singleton: la delete è rifiutata

**Misurato** (`_tmp_delete_primitive.ts`, punto C): `Red.delete()` ritorna senza
errori e `Red` è ancora lì. `LObject.get_delete` (`LModelElement.tsx:6510`)
scrive `Log.ww('Object is a singleton and cannot be removed…')` e ritorna, a meno
del token di lifecycle. Il preflight lo dichiara come `blocked` invece di offrire
un bottone che non fa nulla.

## 4. `clear` e `dirty` sono due scritture diverse — e la differenza si misura

`formWrite.clearSlotValue` lascia un **buco** (`setValueAtPosition(i, undefined)`,
motivato nel suo docstring, R-FORM-7); la cascata del core **accorcia** (§2 qui
sopra). Su uno slot a un valore le due coincidono; su un multivalore no. È questo
che rende le tre opzioni del prompt tre verdetti veri e non due travestiti da tre,
e la simulazione — che fonde «clear» e «delete anyway» in una riga sola — lo fa
perché nel suo modello in memoria l'effetto è lo stesso.

## 5. L'ordine fra la scrittura e la delete: misurato, e non era quello atteso

La prima esecuzione della sonda di slice ha **fallito** su `clear`:
`allNine_broken.cfg` passava da `["Config_old","Config_two"]` a `[null]` invece che
a `[null,"Config_two"]` — un valore perso.

Isolate, le due primitive sono corrette (`_tmp_clear_then_delete.ts`,
`_tmp_clear_two.ts`): con un'attesa fra clear e delete lo slot resta
`[null,"Config_two"]`, e resta così anche dopo la delete. Il difetto compare solo
quando le due partono **nello stesso tick**, che è ciò che faceva `applyDelete`.
Ricostruzione coerente con le due letture: il `'-='` della cascata trova ancora
l'array originale e toglie il puntatore per valore, e la scrittura posizionale del
clear atterra dopo, su ciò che resta.

**Fix**: le delete sono differite di `U.UpdatingTimer * 2` **quando il piano ha
scritto qualcosa** (reassign o clear). È la stessa dilazione che `LValue.addObject`
usa per il proprio seeding (`LModelElement.tsx:7153`) e che CLAUDE.md §9.2
prescrive. Un piano `dirty` non scrive nulla prima e **non** è differito: non c'è
niente da sorpassare.

## 6. Dove è finito cosa

| Cosa | Dove | Perché lì |
|------|------|-----------|
| Preflight, verdetti, piano, copy | `frontend/src/jjform/delete.ts` (zero import) | è funzione della shape e di record piatti, come `create.ts` |
| Chiusura di containment, referrer con cardinalità | `editor-v2/hooks/deleteDraw.ts` (puro) | conosce il D-graph, ma non lo store: testabile |
| Candidati, `blocked`, applicazione del piano | `editor-v2/hooks/deleteAdapter.ts` (impuro) | tocca store e proxy L |
| Cella `missing` | `abstract/tabs/instanceTable.ts` + `InstanceManagerTab.tsx` | è una decisione di resa, non di scrittura |

I candidati di reassign sono presi sulla chiusura di conformità della **metaclasse
dell'istanza cancellata**, non su quella dichiarata da ciascuna reference: il design
offre **una** select («Reassign all to»), quindi una lista sola deve soddisfare
tutti i referrer. L'istanza siede già in ognuno di quegli slot, quindi la sua
metaclasse conforma al tipo dichiarato da ognuno; ciò che conforma a lei conforma a
tutti. Prendere il tipo di ciascuna reference darebbe una lista più larga i cui
elementi in più qualche referrer rifiuterebbe — e `setValueAtPosition` rifiuterebbe
la scrittura a istanza già cancellata.

## 7. Cosa NON è verificato

- **Undo/redo** oltre a quello che il core già offre: fuori scope per prompt. Il
  piano è una sequenza di TRANSACTION separate, quindi un undo ne disfa una alla
  volta. Non misurato.
- **Multi-selezione** (12b): fuori scope.
- La cascata è provata su **un** livello di containment a schermo (il fixture non
  ne dichiara di più profondi); i due livelli sono provati nel test unitario di
  `descendantsOf`, su un `idlookup` costruito.
