# ENG2 — il gate sulle sonde per il doppio append

**Data**: 2026-09-01 · **Slice**: ENG2 (micro, parallela a UX1, zero file condivisi)
**Perimetro**: `frontend/scripts/smoke/states.ts`, `frontend/scripts/smoke/README-probes.md`,
un commento in `frontend/src/model/logicWrapper/LModelElement.tsx`.
**Origine**: `discovery_2026-09-01_eng1_containment_core.md` §B.6, secondo punto.

Ipotesi che questa discovery falsifica: «la forma pericolosa è diffusa nelle sonde, e una
`link` condivisa la toglie da tutte». **Falsificata a metà**: la forma è in DUE sonde, non
in tutte; le altre dieci che chiamano `setValueAtPosition` sono già sane. La `link` serve
lo stesso, come gate per quelle future.

---

## 1. Il censimento della forma pericolosa

La forma è definita da ENG1 §B.5: *due scritture sullo stesso indice dentro la stessa
finestra di propagazione, con la seconda che deriva l'indice dallo store*.

`command grep -ln "setValueAtPosition" _tmp_*.ts` → **12 sonde**. Lette tutte:

| sonda | come deriva l'indice | forma |
|---|---|---|
| `_tmp_10g_measure.ts:98` | `idx = (idl[slotId]?.values ?? []).length` | **pericolosa** |
| `_tmp_10g_verify.ts:106` | idem | **pericolosa** |
| `_tmp_eng1_measure.ts:97` | idem, *di proposito* | la repro — non si migra |
| `_tmp_10b_verify.ts:74` | `pos` passato dal chiamante | sana |
| `_tmp_12bc_measure.ts:78,121,145` | `0` letterale | sana |
| `_tmp_12bc_q1.ts:76` | `0` letterale | sana |
| `_tmp_12bc_verify.ts:68,115` | `0` letterale | sana |
| `_tmp_13a_verify.ts:181,253,286` | `0` letterale | sana |
| `_tmp_clear_then_delete.ts:41` | `0` letterale (clear) | sana |
| `_tmp_clear_two.ts:30,55` | `0` letterale | sana |
| `_tmp_form_1b_removal.ts:102` | `1` letterale (clear) | sana |
| `_tmp_s2_probe.ts:190` | `0` letterale | sana |

Il conteggio è il controllo positivo di se stesso: la ricerca ha raggiunto 12 file e ne ha
qualificati 12, non ha restituito un silenzio.

**Conseguenza**: la migrazione richiesta dal prompt tocca **due** sonde (`_tmp_10g_*`), e
il valore della `link` non è la bonifica di un parco esistente — è il gate su quelle che
verranno, dove la forma è facile da riscrivere e invisibile quando sbaglia.

## 2. Perché la `link` cura, e con quale via

ENG1 §B.4 misura che nessuna *lettura* vede la scrittura pendente: né `context.data`, né
`store.getState()` dentro la finestra. L'unica forma coerente per costruzione è **una sola
`set_values`** con l'array intero (arm A8, verde).

Quindi la `link` non ricalcola: tiene un **cursore proprio per slot**, seminato dallo store
alla prima scrittura e mai più riletto, e scrive `lslot.values = [...cursore, target]`.

Che quella via scriva anche `father` è verificabile sul sorgente e non per fiducia:
`set_values` (`LModelElement.tsx:7896-7899`) apre una `TRANSACTION` e chiama
`get_setValueAtPosition` per ogni indice, quindi passa esattamente per il ramo containment
che assegna il padre. È il motivo per cui la stessa `link` può curare, allo stesso costo,
anche il reperto delle sonde 10c..10f (§4).

## 3. Cosa la `link` asserisce

Da README-probes §«Assert the setup, do not wait for it»: la propagazione non si aspetta,
si asserisce. La `link` fa un poll limitato e ritorna un verdetto su tre fatti:

1. `values` dello slot === l'array che il cursore dichiara di aver costruito;
2. se la referenza è containment → `father` del target è **lo slot**;
3. se NON lo è → `father` del target **non** è lo slot (il per contrasto, dentro la stessa
   funzione: una `link` che scrivesse il padre sempre passerebbe il punto 2 senza contenuto).

Un timeout è un `ok:false` con la misura dentro, mai un ritorno muto.

## 4. Le sonde 10c..10f: perché la cura c'è ma il costo non è nullo

Il referto 10g §3 nota che 10c..10f posano con `SetFieldAction.new(slotId,'values',…,'+=')`,
che non passa dal core e quindi **non scrive `father`** (`_tmp_10c_verify.ts:95`,
`_tmp_10d_verify.ts:106`, `_tmp_10e_verify.ts:104`, `_tmp_10f_verify.ts:104`).

La `link` cura anche quello — è la stessa via. Ma quelle quattro sonde **asseriscono
l'outline** (10c: `9a l'outline e' aperto…` e le righe che seguono), e l'outline è
costruito da due sorgenti che dissentono proprio su `father` (10g §3). Cambiare il posatore
cambia il soggetto misurato: i numeri delle quattro slice sono citati in referti e log
chiusi, e una migrazione senza ri-esecuzione li lascerebbe non riproducibili, mentre una
con ri-esecuzione li **sostituisce** con numeri diversi da quelli ratificati.

Decisione, dichiarata come chiede il prompt: **non si migrano**. La cura resta disponibile
e documentata; si applica quando una slice futura avrà ragione di rimisurare quell'outline.
Le due sonde 10g si migrano invece perché la loro forma è quella pericolosa e il loro arm
`raw` — il soggetto dichiarato di quella misura — non viene toccato.

## 5. File letti

- `frontend/scripts/smoke/states.ts` (277 righe, intero)
- `frontend/scripts/smoke/README-probes.md` (299 righe, intero)
- `frontend/src/model/logicWrapper/LModelElement.tsx:7700-7915` (i tre metodi + `set_values`)
- `frontend/scripts/smoke/_tmp_eng1_measure.ts` (fixture e arm A1..A8)
- `frontend/scripts/smoke/_tmp_10g_measure.ts:74-102`, `_tmp_10g_verify.ts:82-109`
- le 12 sonde del censimento §1, alle righe citate
- `docs/discovery/discovery_2026-09-01_eng1_containment_core.md` (intero)

## 6. Rischi e domande aperte

- Il cursore vive su `window` (`__smokeLinkCursor`): un `goto` che ricarica la pagina lo
  azzera, e la `link` riparte dal seme dello store. Corretto ma silenzioso: una sonda che
  ricarica *dentro* la finestra di propagazione riavrebbe la forma pericolosa. Non è un
  caso costruibile senza volerlo (la ricarica dura più della finestra: A7 la misura a
  ~50ms), ma è dichiarato qui invece che dato per impossibile.
- OQ-2/OQ-4 restano aperte: il prompt le tiene fuori scope esplicitamente, e questa slice
  non le tocca né le anticipa.
- La `link` risolve la referenza sulla metaclasse dell'istanza senza risalire le
  supertype (`idl[from.instanceof]?.references`), esattamente come le sonde da cui è
  estratta. Una referenza ereditata non sarebbe trovata: `ok:false` con il motivo, non un
  silenzio.

---

## 7. Esito della Fase 2 (misurato)

**Il reperto che la discovery non aveva previsto.** La prima versione della `link` leggeva
`refDef.containment` per decidere se asserire il padre sullo slot. È il campo **legacy**
(CLAUDE.md §3.8): il D-layer scrive `composition`, e `containment` resta `false` su ogni
referenza che l'L-layer chiama composizione. Il per contrasto si è quindi acceso su una
scrittura **corretta** — 3 FAIL su 16 alla prima esecuzione. Corretto in
`composition === true || containment === true`, con la ragione nel commento.

Il secondo aggiustamento è nell'asserzione, non nel codice sotto misura: l'uguaglianza
sull'array intero confonde «i miei valori sono atterrati agli indici che il cursore ha
assegnato» con «lo slot non contiene altro». Sotto due `link` emesse insieme la prima legge
legittimamente anche il valore della seconda. L'asserzione è ora **di prefisso**: un valore
perso o sovrascritto rompe comunque il prefisso, che è il guasto per cui la `link` esiste.

**`_tmp_eng2_verify.ts` — 16/16 PASS, zero errori di pagina.**

| arm | esito |
|---|---|
| F0 la fixture ha una referenza containment e una che non lo è | PASS (`states=true`, `substates=false`) |
| B1 `link` su slot VUOTO | PASS — `values=["Off"]`, `father`=lo slot |
| B2 `link` su slot POPOLATO | PASS — `values=["Off","Broken"]`, nessuna sovrascrittura |
| B2 censimento: nessun orfano | PASS — entrambi elencati da `Cooler.states` |
| B3 il caso A1 di ENG1: due `link` emesse INSIEME | PASS — entrambi i valori, zero orfani |
| B4 **controllo positivo**: la forma pericolosa, invariata | PASS — perde ancora un valore (`["Broken4"]`) e lascia ancora `Off4` orfano |
| B5 **per contrasto**: `link` su referenza non-containment | PASS — scrive `values`, `father` resta `DModel` |
| B6 **controllo negativo**: referenza inesistente | PASS — `ok:false` con il motivo, non un silenzio |

B4 è la metà che dà senso alle altre: nella **stessa** esecuzione la forma vecchia continua a
produrre l'orfano, quindi il verde delle arm `link` è un verde con segnale dietro.

**Mutazione.** Cursore rimosso (indice riletto dallo store a ogni chiamata): **3 rossi**, tutti
su B3 — l'arm dentro la finestra. B1/B2 restano verdi perché la `link` sequenziale attende la
propria asserzione, e a quel punto lo store è fresco. È esattamente il confine misurato da
ENG1 §B.4: il cursore è ciò che la finestra costa. Verde al ripristino.

**Migrazione delle due sonde 10g.** `_tmp_10g_measure.ts` e `_tmp_10g_verify.ts`: il ramo
`live` delega alla `link` condivisa, il ramo `raw` — il soggetto dichiarato di quella misura —
non è toccato. Ri-eseguite entrambe:

- `_tmp_10g_measure.ts`: 12 nodi outline su 12 attesi, **zero duplicati**, `Off` e `Broken`
  entrambi `father=DValue(states)` **e** `listedBy=["Cooler.states"]` — l'orfano che il referto
  10g §6 aveva misurato su questa stessa sonda non si costruisce più.
- `_tmp_10g_verify.ts`: **24 PASS / 0 FAIL**, zero errori di pagina, e la riga
  «orfani misurati» ora vuota.

Le sonde restano non committate (`.gitignore:66`): la migrazione è un fatto di questa
sessione, e i numeri qui sopra sono ciò che ne resta.

**Gate.** `npm run typecheck` **33** su output completo (baseline invariata); `states.ts` e
`README-probes.md` stanno fuori da `include: src` del tsconfig, quindi verificati a parte con
un `tsc --noEmit` mirato, exit **0**. `npm run build` exit **0**. `npx vitest run` **2843
passati / 0 falliti**, 9 file rossi in raccolta tutti il noto `window is not defined`.
`npm run smoke` **VERDICT: GREEN**, 12 passed / 0 failed / 3 skipped, un boot per stato.
`npm run check:docs` 3/3.

**Una deroga dichiarata.** P6 chiede che il tipo del commit sia indicato nel prompt; questo non
lo indica. Scelto `test(smoke)` per il commit del codice — il delta è strumentazione di prova
più un commento — invece di fermare la consegna su una parola.
