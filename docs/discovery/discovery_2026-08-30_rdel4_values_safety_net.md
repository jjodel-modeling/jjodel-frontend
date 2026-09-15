# Discovery 2026-08-30 — R-DEL-4: la safety net di `get_delete` estesa a `values`

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD di partenza `9a87112e8`
**Prompt**: «Fix R-DEL-4: la safety net di `get_delete` estesa a `values`», dato in chat e
non depositato in `docs/prompts/`. Applicare la via minima ratificata a valle del censimento
`.delete()` (`discovery_2026-08-30_censimento_delete_proxy_stale.md` §5, terza opzione):
non la rilettura di `pointedBy` in `get__jjdependencies` — che tocca ogni classe L in una
zona dove l'ordine e' delicato (R-FORM-11) — ma l'estensione della rete gia' presente in
`Dummy.get_delete` dal solo `father` anche a `values`.
**File toccato**: `frontend/src/common/Dummy.ts`, un blocco, 22 righe.
**Sonde** (non committate, non in `npm run smoke`):
`frontend/scripts/smoke/_tmp_rdel4_cost.ts` (il costo, misurato **prima** del diff),
`frontend/scripts/smoke/_tmp_rdel4_verify.ts` (i quattro criteri d'accettazione + il costo
end-to-end della cascata).
**Esito**: **12 PASS su 12, ALL GREEN, zero errori di pagina.** Il (c) del fixture non
lascia piu' un puntatore appeso, e la colonna «stale» della matrice 2x2 di R-FORM-10
converge a quella «fresco» in entrambe le cardinalita'.

---

## 1. Cosa mancava, esattamente

`Dummy.get_delete` portava gia' una rete per lo stesso modo di guasto
(`common/Dummy.ts:104-116`), e il suo commento lo dichiara verbatim: «if pointedBy data is
stale or incomplete, the Pointer would be left dangling». Copriva pero' due soli campi —
`father.objects` per un `DObject`, `father.features` per un `DValue` — cioe' il
**containment**. Gli slot di riferimento M1 (`DValue.values`) restavano scoperti, ed e'
esattamente li' che R-FORM-10 misura il difetto: `case 'values'` nel ciclo delle dipendenze
fa la scrittura giusta, ma viene raggiunto solo per gli slot che `pointedBy` elencava
**nell'istante del wrap** del proxy L. Uno slot scritto dopo il wrap e' invisibile al ciclo
e sopravvive alla delete con un puntatore che non risolve.

La rete esistente era quindi la prova che il modo di guasto era gia' noto **in una sua
meta'**. Questa slice scrive l'altra.

## 2. Il costo, misurato PRIMA di scrivere il diff

Il prompt lo chiede per primo, e la ragione e' che la rete gira su **ogni** delete mentre
il censimento conta **zero** siti (c) in codice di prodotto: e' assicurazione, e non deve
costare piu' del rischio. `_tmp_rdel4_cost.ts` misura sull'albero a `9a87112e8`, cioe' con
la rete non ancora scritta, la scansione **esatta** che la rete avrebbe fatto.

```
MISURA: {"idlookup":112,"dvalues":43,"dobjects":7,
         "hits":1,"scanMs_reale":0.005,
         "scanMs_sintetici":{"10000":0.57,"50000":4.72,"200000":23.75},
         "pointedBy_len":7,"pointedByMs":0.0005}
controllo positivo, il canvas e' montato: .mm-object = 8
errori di pagina: 0
```

Gli `idlookup` sintetici hanno la stessa forma di quello vero (un terzo `DValue` con un
`values` array, il resto `DObject`/`DClass`), e la scansione ci gira sopra 20 volte con un
giro di riscaldamento scartato. Lettura:

| `idlookup` | costo di **una** delete di `DObject` |
|---|---|
| 112 (fixture smoke) | 0.005 ms |
| 10 000 | 0.57 ms |
| 50 000 | 4.72 ms |
| 200 000 | 23.75 ms |

**Il rischio non e' la singola delete: e' la cascata.** N delete di `DObject` sono N
scansioni, quindi O(N x |idlookup|). Un modello con 1000 istanze da ~7 slot ciascuna porta
`idlookup` intorno a 8000 voci, e la cancellazione del modello costa allora
1000 x ~0.45 ms ≈ **0.45 s** di sola scansione. E' il numero da tenere: sotto il secondo
oggi, ma quadratico, quindi non indefinitamente.

**Misura end-to-end della cascata, con la rete attiva** (`_tmp_rdel4_verify.ts` §5): 30
`DObject` creati e cancellati in fila danno `msTotali 10`, `msPerDelete 0.33` — e quei
0.33 ms sono la delete **intera** (cascata dei figli, ciclo delle dipendenze, azioni Redux),
non la sola scansione, che su quell'`idlookup` vale 0.005 ms. **La rete e' rumore di fondo
alla taglia del fixture.**

Tre scelte che tengono il costo dove sta, tutte nel diff:

1. **La scansione parte solo se `dDeleted.className === 'DObject'`.** Solo un `DObject` puo'
   stare in uno slot di riferimento, quindi ogni altra delete — e nella cascata di un
   oggetto i figli sono `DValue`, cioe' la maggioranza — la salta interamente.
2. Il filtro sul `className` del candidato precede la lettura di `values`.
3. `indexOf` invece di una `filter`/`includes` su copia: nessuna allocazione per voce.

**Variante piu' economica, misurata e NON applicata**: leggere `pointedBy` dallo store vivo
per il solo morente e filtrarne le voci `.values` costa **0.0005 ms**, tre ordini di
grandezza meno della scansione a 50k, e non e' quadratica. Non e' stata scelta perche'
`pointedBy` e' un indice che puo' contenere voci non valide (`joiner/classes.ts:1443`,
commento in situ), mentre `idlookup` e' la verita' di fondo: la rete deve essere la cosa che
regge quando l'indice sbaglia, altrimenti non e' una rete. Resta a registro come uscita di
sicurezza se un modello grande dovesse un giorno sentire la cascata.

## 3. Il diff

Un blocco solo, subito dopo la rete esistente e prima del ciclo delle dipendenze — stesso
posto, stesso idioma, stessa `SetFieldAction` con `'-='` che `case 'values'` gia' usa
(`common/Dummy.ts:205` prima del diff), quindi ridondante e no-op quando il ciclo l'ha gia'
sparata, esattamente come per la rete `father`.

```typescript
if (dDeleted.className === 'DObject') {
    const idlookup: GObject = store.getState().idlookup;
    for (const slotId in idlookup) {
        const slot: any = idlookup[slotId];
        if (!slot || slot.className !== 'DValue') continue;
        const vals = slot.values;
        if (!Array.isArray(vals) || vals.indexOf(deletedID) === -1) continue;
        SetFieldAction.new(slotId as any, 'values', deletedID, '-=', true);
    }
}
```

**Cosa NON e' stato toccato**, e sono i due vincoli espliciti del prompt:

- il contratto di `undefined` — la rete non scrive mai `undefined` in uno slot, fa solo
  `'-='` di un id, che e' la stessa forma di scrittura del `case 'values'`;
- l'ordine delle scritture attorno alla delete (R-FORM-11) — la rete sta **dentro** la
  stessa `TRANSACTION` e **nella stessa posizione relativa** della rete `father`, cioe'
  dopo la cascata dei figli e prima del ciclo delle dipendenze. Nessuna scrittura cambia
  di tick, nessuna dilazione e' aggiunta o rimossa.

## 4. I quattro criteri d'accettazione, misurati

`_tmp_rdel4_verify.ts`, una pagina sola, il fixture `RowViewSmoke` col canvas montato
(`.mm-object = 8`, controllo positivo). **12 PASS su 12, ALL GREEN, zero errori di pagina.**

### 4.1 Il (c) del fixture

`RowViewSmoke/index.ts` costruisce `byName` a `:396-400`, scrive i riferimenti a `:410` e
cancella `Config_old` con quel proxy a `:505-506`: e' l'unico (c) del censimento, e non e'
riprodotto dalla sonda ma **prodotto dal fixture in vivo** prima che la sonda guardi.

```
1 allNine_broken.cfg dopo la delete del FIXTURE (proxy stale): {"len":0,"dangling":0}
PASS  1 il (c) del fixture non lascia piu' un puntatore appeso (era dangling 1)
```

Il referto R-FORM-10 misurava li' `{"len":1,"resolves":[null],"dangling":1}`.

**Il contrasto, nella stessa corsa**, perche' una rete che svuotasse tutto darebbe lo stesso
verde su questo criterio e sarebbe un disastro:

```
PASS  1 CONTRASTO: lo slot valorizzato NON e' stato toccato dalla rete
      {"len":1,"resolves":["Config_main"],"dangling":0}
PASS  1 CONTRASTO: lo slot mai scritto resta vuoto  {"len":0}
```

### 4.2 Il percorso fresco, col gesto vero

Non una chiamata simulata: selezione del nodo React Flow e tasto `Delete`, cioe'
`EditorV2` -> `canvasToJjom.syncDeleteVertex`, il percorso che gli utenti battono.

```
PASS  2 controllo positivo: lo slot punta a Config_main prima del gesto
PASS  2 controllo positivo: il nodo e' a schermo  [data-id="…_107"] = 1
2 dopo il gesto: {"slot":{"len":0,"dangling":0},"vivo":false,"nodi":12,"nodesBefore":13}
PASS  2 il bersaglio e' stato davvero cancellato (senza questo la misura e' nulla)
PASS  2 percorso fresco identico a prima: slot vuoto, zero appesi
```

Tredici nodi prima, dodici dopo: la delete e' avvenuta, e la misura non e' nulla.

### 4.3 La cascata father, invariata

```
3 cascata father, prima: {"feats":13 slot,"objsBefore":7}
3 cascata father, dopo:  {"victimVivo":false,"featsVivi":0,"featsTotali":13,
                          "objsDopo":6,"objsPrima":7,"nelPadre":false}
PASS  3 la cascata father e' invariata: oggetto morto, slot morti, fuori da m1.objects
```

Tredici `DValue` figli morti su tredici, l'oggetto fuori da `m1.objects`, il conteggio del
padre sceso di uno. La rete vecchia regge.

### 4.4 La matrice 2x2 di R-FORM-10, rigirata

Stesso protocollo del referto: cinque bersagli `Config` freschi, un referente riscritto fra
una cella e l'altra, `cfg` portata da `0..1` a `0..*` in mezzo (dichiarato, `upper: -1`).
Le celle «stale» avvolgono il proxy **prima** della scrittura, quelle «fresco» **dopo** —
e la sonda lo prova cella per cella con lo scarto fra snapshot e store:

```
B 0..1 STALE delete: {"pointedBy_visto_dalla_delete":6,"pointedBy_nello_store":7}
D 0..* STALE delete: {"pointedBy_visto_dalla_delete":6,"pointedBy_nello_store":7}
```

Il proxy vede ancora 6 dove lo store dice 7 — cioe' **il difetto e' ancora li'**, la rete
non lo maschera cambiando la freschezza, lo copre a valle.

| | **0..1** | **0..\*** (due bersagli, si cancella quello in posizione 0) |
|---|---|---|
| **proxy fresco** | `len 0` — slot vuoto | `len 1` — accorciato, resta `Config_0` |
| **proxy stale** | `len 0` — slot vuoto | `len 1` — accorciato, resta `Config_0` |

```
PASS  4A 0..1 proxy fresco: slot VUOTO
PASS  4B 0..1 proxy stale: slot VUOTO (era: puntatore appeso)
PASS  4C 0..* proxy fresco: array ACCORCIATO, il compagno resta
PASS  4D 0..* proxy stale: array ACCORCIATO (era: appeso in posizione 0)
PASS  4 la colonna STALE converge alla colonna FRESCO
```

La colonna «stale» del referto R-FORM-10 dava `dangling 1` in entrambe le righe. Ora le due
colonne sono identiche, e le due **righe** restano diverse: `0..1` svuota, `0..*` accorcia —
che e' la distinzione fra `clear` e cascata che R-FORM-10 gia' registrava e che questa
slice non tocca.

## 5. Cosa la rete NON copre — dichiarato, non chiuso

- **Le collezioni diverse da `values` e da `father`.** Un (c) su `classes`, `subElements`,
  `instances`, `packages` lascerebbe la voce in una collezione senza risolvere, e li' il
  degrado e' muto (censimento §4). Nessun sito (c) di quel tipo esiste oggi; la rete non e'
  stata estesa a quei campi perche' costerebbe una scansione per campo e coprirebbe un
  rischio che nessuna misura vede.
- **Il falso positivo teorico sugli attributi.** `values` porta primitive per gli slot di
  attributo. Un attributo `EString` il cui valore fosse **esattamente** l'id del `DObject`
  che si sta cancellando verrebbe svuotato dalla rete. E' lo stesso rischio che `case
  'values'` corre gia' oggi, e richiede che qualcuno abbia digitato un `Pointer…` a mano nel
  campo giusto nell'istante giusto. Non mitigato: un controllo su `instanceof` costerebbe
  una lookup per candidato e potrebbe **sopprimere** la rete quando `instanceof` e' lo stato
  stale che la rete esiste per compensare.
- **La quadraticita' della cascata**, misurata in §2 e non rimossa. La soglia da sorvegliare
  e' un modello con migliaia di istanze; sotto il migliaio il costo e' inferiore al mezzo
  secondo, e la variante «pointedBy vivo» e' l'uscita gia' misurata.
- **La cardinalita' del ciclo `for…in`** su `idlookup`: la rete legge lo store **una volta**,
  fuori dal ciclo, quindi le `SetFieldAction` che spara non allungano la propria scansione.

## 6. Gate

- `npm run typecheck`: **33 errori = baseline**, contati sull'output **completo** (124 righe
  lette per intero, non una coda). L'unica riga che nomina `Dummy.ts` e' la
  `TS2307 Cannot find module 'vite/dist/node/chunks/moduleRunnerTransport'` di riga 46,
  pre-esistente e nella lista dei 33 di CLAUDE.md §17.
- `npm run build`: exit **0**, zero righe di errore, solo il chunk-warning noto.
- `npx vitest run`: **2092 passed / 0 failed**, identico al conteggio dell'ultima entry di
  log, coi 9 file rotti all'import = baseline nota.
- `npm run smoke`: **12 passed, 0 failed, 3 skipped — VERDICT GREEN**, corsa quiescente
  (`moved: nothing`), un boot per stato.
