# Riconciliazione: il ritardo del badge — due misure opposte, una sola corsa

**Data**: 2026-08-31
**Tipo**: discovery, sola lettura. **Zero file sorgente toccati.**
**Sonde** (non committate, gitignored): `frontend/scripts/smoke/_tmp_badge_recon.ts`
(la matrice, 2 livelli x 5 celle + il reperto), `_tmp_badge_recon2.ts` (la catena
richiamo/scansione e il costo del fix).
**A monte**: `discovery_2026-08-30_s1m2_una_regola.md` (R-M2U-6),
`discovery_2026-08-31_tick_fix_defaultname.md` §4 (sessione B, commit `0d2354da9`),
e la sonda della sessione A `_tmp_m2u6_verify.ts` (trovata nell'albero, non committata).

---

## 1. Verdetto

**Il ritardo esiste, e' riprodotto, ed e' sopravvissuto al tick-fix (`e1c885d4c`).**
Le due misure del 31-08 non sono in conflitto: **descrivono due celle diverse**. La
variabile che le separa e' **una sola** — la presenza di una **scrittura di nome dopo la
create**. Lo scenario di A ne conteneva una (la sua `loadDoorRename`) e A l'ha contata
come parte della fabbricazione, non come «scrittura successiva». Lo scenario di B non ne
aveva.

E la causa vera **non e' l'enumerazione** (B lo aveva gia' falsificato: il `for...in`
elenca le pendenti). E' il contrario: proprio **perche'** le elenca, la firma di
reattivita' raggiunge il suo valore finale **nel tick della create**, quando le collezioni
che lo scanner cammina sono ancora stantie; e quando le collezioni si posano, la firma
**non cambia piu'**, quindi l'effetto non viene mai richiamato. Non e' un ritardo in coda:
e' **una notifica mancata**, che la prima scrittura nominata successiva risolve per caso.

---

## 2. La matrice — una variabile alla volta, stessa corsa

`_tmp_badge_recon.ts`. Cinque celle per livello, sullo stesso stato (metamodello `Smoke`
per M2, `smoke_model` per M1), registro campionato a 0.3 / 1 / 3 / 9 s **prima** di
qualunque scrittura estranea, poi un `poke` (una create nominata, la stessa forma che usa B).

| cella | porta | n | rinomina dopo la create | registro a 0.3-9 s | dopo il poke |
|---|---|---|---|---|---|
| **D2** | `DClass.new` / `DObject.new` col nome | 2 | no | **0** | **2** |
| **D4** | idem | 4 | no | **0** | **4** |
| **D4R** | idem, nomi seed | 4 | si', `name` + slot | **4 gia' a 300 ms** | 4 |
| **L4R** | `addClass` / `addObject` | 4 | si', `name` + slot | **4 gia' a 300 ms** | 4 |
| **L4Rn** | `addClass` / `addObject` | 4 | si', **solo** `name` | **4 gia' a 300 ms** | 4 |

Identica riga per riga a M2 e a M1 (le due meta' della sonda, due browser separati).

Quindi:

- **il numero di duplicati non e' la variabile** — D2 e D4 danno lo stesso 0;
- **il livello non e' la variabile** — M1 e M2 coincidono in tutte e cinque le celle;
- **la porta non e' la variabile** — D4R (create D diretta) e L4R (create L) coincidono;
- **lo slot d'identita' non e' la variabile** — L4R e L4Rn coincidono;
- **la scrittura di nome dopo la create e' la variabile.** E' l'unica che ribalta l'esito.

D2 e' la cella di B, riprodotta. L4R e' la cella di A, riprodotta — **con** i suoi 4 a
~300 ms (A misurava 402 ms).

## 2.1 Perche' la rinomina conta come «scrittura successiva»

La strumentazione della sonda lo mostra senza inferenza. Nella cella L4R, letti **dentro
lo stesso tick** della `SetFieldAction`:

- i nomi in dizionario sono ancora `..._seed0..3` — la rinomina **non e' atterrata**;
- la firma vale `363190373`;

e ai campioni successivi la firma vale `-255717981`, cioe' **cambia dopo il tick**. La
rinomina di un elemento **pendente** si posa insieme alla create, un tick dopo, quando le
collezioni sono gia' fresche: e' esattamente la seconda notifica che B chiama «una
scrittura qualunque». Nelle celle D2/D4, dove il nome e' passato al costruttore, quella
seconda notifica non esiste: firma `nel tick` e firma a 9 s sono **lo stesso numero**
(M2: `-483375250` in entrambe; M1: `441137939`).

---

## 3. La causa vera, misurata anello per anello

`_tmp_badge_recon2.ts`, cella D2, 15 campioni a 200 ms, con `detect*DuplicateNames`
chiamata **a mano** accanto al registro:

```
   0 ms   registro 0   detect 0   pkg.classes 6    sigOggi -622776247
 200 ms   registro 0   detect 2   pkg.classes 8    sigOggi -622776247
 ...                                       (invariato fino a 2800 ms)
```

Tre fatti, tutti PASS in sonda, a M2 come a M1:

1. **Nel tick della create lo scanner non puo' vedere**: la collezione e' a 6, `detect`
   rende 0. (E' il reperto di B: cio' che e' stantio sono le collezioni, non `idlookup`.)
2. **A 200 ms lo scanner vedrebbe**: la collezione e' a 8 e `detect` rende **2**, cioe' i
   due omonimi, per id. Il registro resta **0**. Lo scanner non e' cieco: **non viene
   richiamato**.
3. **La firma di oggi e' identica prima e dopo che la create si posi**
   (`-622776247 -> -622776247`). Non c'e' alcun delta a cui React possa reagire, perche' la
   pendente era **gia' contata** nel tick precedente, con il suo nome e il suo padre.

La firma di `UniquenessProblemSync` e' costruita su `for...in state.idlookup` e su
`id:name:father`. Le pendenti vivono sul `__proto__` (`DPointerTargetable.pendingCreation`,
`reducer.ts:639`) e il `for...in` le attraversa: **122 chiavi in `for...in` contro 120
proprie**, misurate. Il commit sposta la chiave dal proto alle proprie e riempie le
collezioni, ma **non tocca nessuno dei tre campi della firma**. Da qui la sequenza:

```
create (tick T)   -> firma cambia -> effetto gira -> collezioni stantie -> 0 voci
persist (tick T+1)-> collezioni fresche -> firma INVARIATA -> nessun rerender -> 0 voci
prima scrittura nominata successiva -> firma cambia -> effetto gira -> 4 voci
```

Il ritardo non ha limite superiore: nella cella D2 il registro resta 0 finche' l'utente
non tocca **qualcos'altro** che cambi un nome, un padre, o crei un elemento nominato.
Nove secondi sono la durata della sonda, non del difetto.

---

## 4. Il reperto di A, spiegato: non e' la variabile

A aveva registrato che a M1 `model.addObject({}, classId, true)` **senza nome** non
ritorna nulla (0/3), mentre la variante **con** nome ritorna 4/4 — e si chiedeva se «una
create che non ritorna» fosse la variabile che separa gli scenari. **Non lo e'**, e la
spiegazione non ha niente a che vedere col badge.

Misurato (`_tmp_badge_recon.ts`, blocco REPERTO, con la console agganciata):

- il `classId` che la sonda di A sceglie e' `objects[0].instanceof` sul fixture
  `rowviews`, e quella classe e' **singleton** (la console lo dice: `singleton instances
  created by the persist callback: [Red, Green, Blue]`);
- `LValue.get_addObject` con `forceCreation` e senza nome esplicito prende il ramo
  `if (!constructorPointers.name && constructorPointers.instanceof)` e **si da' da solo il
  nome della metaclasse** (`Red`), poi incontra il gate di uniqueness di R-S1-2 e viene
  **rifiutata**: `addObject() refused: Name "Red" already used by Object "Red"`. Ritorna
  `undefined`, tre volte su tre;
- con un nome esplicito il ramo del singleton non scatta, il nome e' libero, e la create
  passa: **2/2**;
- controlli per contrasto sulla stessa cella: **senza** `forceCreation` la create muore
  prima, in `getInstantiableClasses` (`cannot instantiate ... because it is a singleton`);
  con `metaclass = null` nasce un oggetto **shapeless**, `obj_0`, regolarmente;
- a **M2** la forma corrispondente non ha il difetto: `addClass()` senza nome rende
  `Concept_0`, `Concept_1`, `Concept_2` (il tick-fix, vivo).

Quindi: nessun rapporto con la notifica. Una create rifiutata dal gate non e' «una create
che non notifica»: e' una create **che non avviene**. Il controllo positivo interno di A
era, in quel punto, un controllo su un singleton — e la parte «senza nome» misurava il
gate, non il badge.

**Reperto di seguito, non chiuso qui**: a M1 una `addObject` di una classe singleton gia'
istanziata e' oggi indistinguibile, dal chiamante, da un errore qualunque — ritorna
`undefined` e parla solo in console. Se il menu «new instance» del manager puo' arrivarci,
merita una riga; l'outline (10b) filtra gia' i singleton dal menu del modello, e non l'ho
verificato sugli altri chiamanti.

---

## 5. Proposta di fix, col costo

Il fix e' **una riga nella firma** di `UniquenessProblemSync.tsx` (il selettore, non lo
scanner): rendere osservabile il momento in cui una create **si posa**. Due varianti,
entrambe misurate sullo stesso stato.

| variante | forma | costo/chiamata (M2 / M1) | effetto |
|---|---|---|---|
| oggi | `id:name:father` | 0.033 / 0.032 ms | la firma non cambia mai al commit |
| **(a) coda own-key** | `id:name:father:` + `hasOwnProperty(lookup,id)?1:0` | 0.034 / 0.033 ms | cambia al commit; **PASS** in sonda |
| **(b) pendenti saltate** | `continue` se non e' chiave propria | 0.032 / 0.032 ms | cambia al commit; **PASS** in sonda |

Costo della scansione che ne consegue, misurata: `detectM2DuplicateNames` **0.87 ms**,
`detectDuplicateNames` **2.59 ms** per chiamata su questo stato (120 elementi). Una
scansione in piu' per **lotto** che si posa, non per elemento.

**Raccomandata: (b).** E' piu' economica di oggi (salta un pezzo di iterazione), toglie
**anche** la scansione sprecata nel tick della create — quella che oggi gira per forza a
vuoto — e soprattutto **allinea il codice alla decisione gia' presa**: R-M2U-6 e il
commento in testa a `UniquenessProblemSync.tsx` dichiarano che il badge riporta lo stato
**committato**. Con (b) la firma smette di contare cio' che il badge per scelta non conta.
(a) fa la stessa cosa lasciando le pendenti nella firma, quindi conserva la scansione a
vuoto: la cito perche' e' misurata, non perche' la preferisca.

Nessuna delle due tocca `includePending` di `nameUniqueness.ts`: la scelta di R-GT-2 —
un import tiene tutto in `pendingCreation` fino a `persist`, e contarlo farebbe lampeggiare
il badge — resta **intatta**. Il fix non cambia **cosa** si conta, cambia **quando** si
riconta.

**Perimetro previsto**: un file, `frontend/src/components/editor-v2/problems/
UniquenessProblemSync.tsx`, il solo `useSelector`, piu' il commento in testa (che oggi
descrive il difetto come «ritardo di una scrittura», e sarebbe da riscrivere come
«notifica mancata»). Fuori dalla §3.1: nessun creatore, nessuna `TRANSACTION`, nessuna
`SetFieldAction`, sola lettura sul D-layer. Nessun LIR dovuto.

**Verifica prevista**: la cella D2 di `_tmp_badge_recon2.ts` gira gia' come test —
registro **2 entro 200-400 ms senza alcuna scrittura successiva**, con la cella «nessun
duplicato» come controllo negativo e il conteggio invariato sulle celle D4R/L4R/L4Rn.
Da aggiungere: un import Ecore con la sonda `_tmp_tick_import.ts`, per misurare che il
badge non lampeggia durante `paused` — e' il rischio che il fix va a sfiorare.

---

## 6. Cosa non ho misurato

- **Quante volte l'effetto gira davvero.** L'ho dedotto dal registro e dalla firma, non
  strumentando il componente. La conclusione «non viene richiamato» regge perche' lo
  scanner, chiamato a mano nello stesso istante, rende 2 mentre il registro rende 0: se
  l'effetto fosse girato, avrebbe registrato. Ma il conteggio delle esecuzioni resta
  indiretto.
- **Il canvas.** Il registro e' l'unico osservabile di queste sonde. Il secondo limite
  dichiarato di R-M2U-6 — la voce indicizzata per id dell'elemento contro il `DVertex`
  del nodo — non e' toccato qui, e resta aperto: il badge, anche quando si accende in
  registro, **non si vede** sul canvas.
- **La finestra `paused` di un import** con il fix applicato. Nessun fix e' stato scritto.
- **Il rename dell'utente da UI** (`set_name`), che passa dai setter e non dalla porta del
  caricamento: le celle rinominano come fa il caricamento, per costruzione.

## 7. Una riga da correggere altrove

`docs/decisions.md` R-M2U-6 porta ancora la diagnosi falsificata: «`idlookup` e' un Proxy
la cui enumerazione non la elenca». Il tick-fix l'ha corretta nel proprio referto e nel
commento del componente, ma **non in `decisions.md`**. Alla ratifica di questo referto
converrebbe riscrivere quel capoverso: l'enumerazione **elenca**, il limite e' che il
commit non produce delta di firma. Non l'ho toccato: e' una decisione, e la ratifica e'
dell'utente.
