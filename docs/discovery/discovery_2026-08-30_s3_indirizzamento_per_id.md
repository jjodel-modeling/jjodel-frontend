# S3 — `IRFormField` indirizza per `(objectId, featureKey)`

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`
**Prompt**: «S3: `IRFormField` indirizza per (objectId, key)», dato in chat, non depositato in
`docs/prompts/`. Terza slice della sequenza WriteCtx del referto
`discovery_2026-08-30_writectx_migrazione_motore.md` (§2.3 e §6).
**File sorgente toccati**: `editor-v2/viewpoint/ir/{formWrite.ts, IRFormField.tsx, IRForm.tsx}`.
**Sonde** (non committate): `scripts/smoke/_tmp_s3_{recon,probe,verify}.ts` e tre `.png`.

---

## 1. La risposta, in breve

- Il difetto c'era, ma **non dove il prompt e io lo cercavamo**. L'ipotesi era il proxy
  stantio sui VALORI; misurata, quella non regge (§2). Quello che regge, e che e'
  deterministico, e' il proxy stantio sullo **SLOT**: la `DValue` viene sostituita sotto la
  form aperta, la scrittura col proxy catturato si dichiara **riuscita** e il valore non
  atterra da nessuna parte (§3).
- Il cambio e' di argomento, non di architettura, come diceva il referto: tre funzioni nuove
  in `formWrite` che risolvono `lObject['$' + key]` e delegano alle tre di sempre; una prop
  in piu' su `IRFormField`; una riga in `IRForm`, che l'`objectId` ce l'aveva gia' (§4).
- Le due superfici sono state esercitate **entrambe dal gesto** — rail e manager — e il
  verdetto del picker (R-FORM-13) e' invariato, misurato per contrasto sul DOM del popover:
  su una reference semplice i candidati sono `P0, P2, P1`, sullo stesso oggetto per un
  containment singolo restano `P2` soltanto (§5).
- I verdetti di S2 restano intatti e ne guadagnano uno: la risoluzione che fallisce e' ora
  un rifiuto **dichiarato** con la sua reason, dove prima non esisteva il caso (§4.2).

---

## 2. L'ipotesi che la misura non conferma

`proxy.ts:323` risponde a `__raw` col `targetObj` catturato al wrap, e `formWrite` legge il
valore PRIMA della scrittura con `rawValues(slot)`, cioe' `slot.__raw.values`. Dedotto dal
sorgente: un proxy catturato al render legge il valore di allora, quindi il confronto
`sameValue(before, value)` puo' saltare una scrittura che invece serviva.

Esercitato: **l'esito varia fra corse della stessa sonda**. In una corsa il proxy catturato
legge `["b"]` subito dopo che un'altra via ha scritto `b` (il D-object e' stato mutato in
luogo); in un'altra legge `[]`, fermo allo stato di cattura (il D-object e' stato
sostituito). Dipende dall'azione che ha scritto, non dal proxy.

Percio' il caso 3 della sonda **misura e non asserisce**, e questa slice non poggia su
quella riga. Vale la regola di §5 del CLAUDE.md: un comparatore che «sembra giusto» letto nel
sorgente non e' una misura, e qui la misura ha detto il contrario due volte in due sensi
diversi.

## 3. Il difetto che regge, e come e' stato costruito

Costruzione: la metaclasse **perde e riacquista** la feature mentre la form e' aperta. Le
istanze prendono una `DValue` nuova; il vecchio id sparisce da `idlookup`.

Misurato (`_tmp_s3_probe.ts`, ALL GREEN, zero errori di pagina):

```
4. slot0 = …_102  ->  slot1 = …_105        vecchio slot vivo: false
5. setSlotValue(proxyCatturato, 0, 'z')  ->  {ok:true, changed:true}
   vecchio slot: []      slot vivo: []          <- il valore non c'e' da nessuna parte
6. setSlotValue(slotRisoltoPerId, 0, 'z') ->  {ok:true, changed:true}
   slot vivo: ["z"]                             <- stessa scrittura, stesso istante
```

Cioe': **riportata come riuscita, persa in silenzio**. E' la stessa forma del difetto che S2
ha chiuso sul verdetto (l'host dice no, il chiamante sente si'), un piano piu' sotto:
qui l'host non dice niente perche' non e' stato interpellato — la `SetFieldAction` finisce su
un id morto. `slot.r` non salva: ri-wrappa per **quello stesso** id (`proxy.ts:320`).

Il caso 6 e' il controllo di segno opposto, e senza di esso «non atterra» sarebbe stato
verificato contro uno slot che magari nessuno poteva scrivere.

## 4. Il diff

### 4.1 `formWrite.ts` — tre funzioni, non tre riscritture

`setValue` / `clearValue` / `appendValue` prendono `(objectId, featureKey, …)`, risolvono con
`resolveSlot` e **delegano** a `setSlotValue` / `clearSlotValue` / `appendSlotValue`. La
semantica di scrittura — TRANSACTION, mappatura del verdetto del core, regola su
`U.isProjectModified` — resta in un posto solo, quello di prima.

`resolveSlot` usa `lObject['$' + featureKey]`, l'idioma che il codebase ha gia' in
`deleteAdapter:193`, `multiAdapter:77`, `createAdapter:225` e `irReadCtxLproxy:26`. Non e'
una convenzione nuova: e' la quarta occorrenza della stessa.

Le tre funzioni per proxy **restano ed esportate**: i tre adapter risolvono lo slot da soli
una riga prima della chiamata, da un id che hanno gia', quindi il loro proxy non e' mai piu'
vecchio della scrittura. Non c'e' niente da correggere li', e toccarli sarebbe stato fuori
perimetro. Le due forme convergono in S4.

### 4.2 Il rifiuto nuovo

`feature "<key>" is not on this object any more` quando l'oggetto o la feature non si
risolvono. Prima quel caso non esisteva: si scriveva su un proxy morto e si tornava
`{ok:true}`. Ora e' un `WriteResult` di S2 come gli altri, e `IRFormField` lo mostra nel suo
slot messaggio senza una riga in piu' — `consume` era gia' scritto per questo.

### 4.3 `IRFormField.tsx` / `IRForm.tsx`

Prop `objectId` obbligatoria; `commitAt` / `clearAt` / `appendAt` chiamano le funzioni per id
con `field.name` come chiave. `IRForm` la passa: l'aveva gia', la da' a `setObjectName` sei
righe piu' su.

`field.slot` **non e' stato rimosso** dal descriptor (Regola 9, Regola 11): resta letto
dentro `describeSlot`, che da li' ricava valori e opzioni. E' il pezzo che S5 sposta, quando
`readOptions` smettera' di leggere dal proxy.

## 5. La verifica a schermo

`_tmp_s3_verify.ts`, **ALL GREEN, 16 asserzioni, zero errori di pagina**. Le due superfici
del referto §2.2 sono entrambe nella stessa corsa.

| | Misura |
|---|---|
| A | Slot sostituito: per id atterra (`["z"]`); col proxy catturato no — controllo opposto |
| B | Feature assente: `{ok:false, changed:false, reason:'feature "nonesiste" is not on this object any more'}`; nello stesso istante la feature che c'e' passa |
| C | **Rail** (`PropertiesWithTreeView` → tab Form): `fill` + `Tab` sul campo `label` → store `["dal-rail"]`, nessun messaggio di rifiuto |
| D | **Manager** (`InstanceManagerTab`): stesso gesto → store `["dal-manager"]` |
| E | Picker `peer` (reference semplice): candidati `P0, P2, P1`, la scelta atterra. Picker `owner` (containment singolo) **sullo stesso oggetto**: `P2` soltanto, l'antenato `P0` filtrato |

E e' la risposta alla domanda del prompt su `slot.validTargetOptions`: il verdetto del filtro
del core **non cambia**, e non poteva cambiare — S3 non tocca il percorso di lettura delle
opzioni, che passa ancora da `readOptions(slot)` in `describeSlot`. Il contrasto fra le due
righe di E e' quello che rende la misura una misura: una lista che escludesse tutto darebbe
verde sul solo criterio «l'antenato non c'e'».

Nota sull'apertura del manager: e' aperto per API (`DockManager.openManager`) perche'
l'affordance `.psb-item` della sidebar di progetto sparisce una volta entrati nella vista, e
il caso C ci entra. La superficie e' aperta per via programmatica; **l'edit e' il gesto**.

## 6. Gate

- `npm run typecheck`: **33 = baseline**, conta presa sull'**output completo** (exit 2 come
  da baseline), e nessuna delle 33 righe nomina un file toccato.
- `npm run build`: exit **0**, solo il chunk-warning (piu' le deprecation Sass preesistenti).
- `npx vitest run`: **2105 passed / 0 failed**, coi 9 file rotti all'import = baseline nota.
- `npm run smoke`: **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per
  stato.

## 7. Limiti

- Il caso stantio e' costruito con una modifica di **metamodello** sotto la form aperta. E' la
  via che lo produce in modo deterministico; non e' una misura di quanto spesso capiti in uso
  reale.
- La lettura delle opzioni resta sul proxy: S3 chiude la finestra sulla **scrittura**, non
  sulla lettura. E' la divisione che il referto ha dato a S5.
- `setObjectName` era gia' per id e non e' toccata.
