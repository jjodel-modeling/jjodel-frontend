# 10g — un nodo per istanza nell'outline: da dove venivano i doppi

**Data**: 2026-08-31 · **Slice**: 10g (micro, seriale dopo 10f)
**Perimetro**: `frontend/src/components/editor-v2/hooks/outlineDraw.ts` e la sua suite.
**Sonde**: `frontend/scripts/smoke/_tmp_10g_measure.ts` (censimento),
`_tmp_10g_verify.ts` (before/after), ritagli `_tmp_10g_{before,after}_{1_rest,2_selected}.png`.

---

## 1. La misura, prima della correzione

Il reperto di 10e — «18 nodi per 12 istanze, la selezione ne accende due» — e'
riprodotto e spiegato. La sonda di censimento costruisce la fixture di 10c..10f
(StateMachine/State/Transition, self-ref `substates`) e posa i legami in DUE modi
apposta:

- **RAW** — `SetFieldAction.new(slot, 'values', tgt, '+=', true)`, che e' esattamente
  cio' che fanno le sonde 10c..10f. Non passa da `LValue.setValueAtPosition` e quindi
  **non scrive `father`** sul contenuto.
- **LIVE** — `LValue.setValueAtPosition`, la via vera: scrive `father` quando (e solo
  quando) `info.isContainment` (`LModelElement.tsx`, ramo `if (info.isContainment)`).

Censimento sull'app vera, 11 istanze:

```
  nome     classe        father    feature        ownerOf   elencato da
  Heater   StateMachine  DModel    —              null      []
  Cooler   StateMachine  DModel    —              null      []
  Idle     State         DModel    —              null      ["Heater.states"]
  Running  State         DModel    —              null      ["Heater.states","Idle.next(NON-comp)"]
  Warmup   State         DModel    —              null      ["Running.substates(NON-comp)"]
  Steady   State         DModel    —              null      ["Off.substates(NON-comp)"]
  Off      State         DValue    states         Cooler    []
  Broken   State         DValue    states         Cooler    ["Cooler.states"]
  start    Transition    DModel    —              null      ["Heater.transitions"]
  stop     Transition    DValue    transitions    Cooler    ["Cooler.transitions"]
  fault    Transition    DModel    —              null      []
```

A schermo: **14 nodi per 11 istanze**, attesi 12. I tre di troppo sono **esattamente**
`Idle`, `Running`, `start` — i tre elencati in uno slot di contenimento il cui `father`
e' rimasto il modello. E una istanza, `Off`, **non compariva affatto**.

## 2. La causa, dichiarata

**Ipotesi (c) del prompt**, con una precisazione: non «un'istanza raggiungibile sia
come root sia come figlio» per caso, ma **per costruzione**. `outlineTree` legge le
sue due meta' da due sorgenti diverse e non fa nulla perche' concordino:

- le **radici** da `father` — `outlineRoots` tiene chi ha `ownerOf(id) === null`;
- i **figli** dai `values` degli slot di contenimento dell'owner.

Il contenimento e' una funzione; l'albero lo disegnava come una relazione. Ogni
disaccordo fra le due sorgenti produce un doppio (elencato ma `father` altrove) o
una **sparizione** (`father` posato su uno slot che non lo elenca — il caso di `Off`,
prodotto qui dalla via LIVE stessa, il cui secondo `setValueAtPosition` ha lasciato
`Cooler.states = ["Broken"]` con `Off.father` ancora su quello slot).

Le ipotesi (a) e (b) sono **escluse dalla misura**:

- **(a) l'albero segue anche ref non-containment** — no. `Idle.next -> Running` e'
  `composition=false`, sta in `ClassShape.refs` e non in `children`, e il walk non lo
  visita mai. `Running` era doppio per `Heater.states`, non per `next`.
- **(b) `ownerOf` restituisce piu' candidati** — no. `ownerOf` e' un salto solo
  (`father` -> `DValue` -> `father`) e restituisce al massimo un id.

## 3. La nota di FL7 su `substates`: spiegata, e fuori causa

FL7 aveva misurato `substates` con `composition: false` dove `states` e' `true`,
nonostante la fixture le scriva entrambe. La causa non e' dove le shape si costruiscono:
`shapeAdapter` legge fedelmente `r.containment` da `resolveM1Info`, che legge
`ref.composition` dal D-layer. E' il **core a rifiutare la scrittura**:

```ts
// LModelElement.tsx, LReference.set_containment
if (val && mainkey === 'composition' && c.data.father === c.data.type) {
    Log.ww('... is generating a composition loop, the class has become not instantiable.');
    return true;   // rifiutata, e restituisce true: il chiamante non se ne accorge
}
```

`substates` e' `State -> State`: auto-riferimento, quindi `father === type`, quindi
composition rifiutata — **in silenzio per il chiamante**, che riceve `true`. La shape
dice il vero. Non e' la causa dei doppi (una feature non-composition non viene
camminata, quindi non puo' duplicare nulla) e la correzione — se se ne vuole una — sta
nel core, non qui: fuori dal perimetro di 10g.

## 4. La regola, e dove vive

Una istanza rende **una volta, sotto il suo owner di containment vero**.

Il resolver condiviso esiste gia' ed e' `createDraw.ownerOf` — lo stesso che
`instancesUnder` (2c) e `neighborhoodDraw.ownerLinkOf` (13a, l'ego) leggono. Non ne e'
nato un secondo. Nel walk:

```ts
if (idlookup[value]?.className === 'DObject') {
    if (ownerOf(idlookup, value) !== id) continue;   // rende sotto il suo owner, non qui
    if (emitted.has(value)) continue;                // un nodo per istanza
}
node.children.push(nodeOf(value, depth + 1, child.key));
```

La meta' `composition: true` della coppia «father + composition» **e' gia' imposta una
riga sopra**: il walk visita solo `ClassShape.children`, che `shapeAdapter` costruisce
da `r.containment`. Spingere il test dentro `ownerOf` cambierebbe un resolver condiviso
con due altre superfici (Regola 20) senza guadagno misurato.

Un valore che non risolve resta un nodo `broken`: il filtro e' sull'**owner**, e un
puntatore morto non ha owner con cui dissentire.

**La sweep.** Il solo filtro rende impossibili i doppi ma non esatto il conteggio:
l'istanza il cui `father` nomina un owner che non la disegna sparirebbe (era il caso di
`Off`). Dopo il giro delle radici, ogni `DObject` del modello non ancora emesso torna a
livello radice. La sweep e' **condizionata**: scatta solo se la metaclasse dell'owner e'
nella shape, cioe' se la shape ha avuto la sua occasione. Shape nulla o classe assente =
metamodello a meta' caricamento: li' il rendering resta quello che 10b ha committato, e
l'invariante `istanze + 1` e' rivendicata per una shape **caricata**, che e' lo stato su
cui e' scritto il criterio d'accettazione.

## 5. Le misure, dopo

Stessa sonda, due giri, la slice in `git stash` nel primo:

| | before | after |
|---|---|---|
| esito | **16 PASS / 8 FAIL** | **24 PASS / 0 FAIL** |
| nodi a schermo | 14 (attesi 12) | **12** |
| etichette ripetute | `Idle`x2, `Running`x2, `start`x2 | **nessuna** |
| istanze senza riga | `Off` | **nessuna** |
| click su `Idle` | accende **due** righe | accende **una** |
| errori di pagina | 0 | 0 |

Non-regressioni verdi in **entrambi** i giri: nodo modello primo, badge lettera di 10f
su ogni riga (`["S","T","m"]`), «+» presente, classe in mono a destra su ogni istanza,
form del selezionato montata.

Unita': `outlineDraw.test.ts` passa da 17 a **30** casi, provata contro sei mutazioni
del modulo — via il filtro `ownerOf` (8 rossi), via il dedup `emitted` (2), via la
sweep (2), sweep incondizionata (2), `emitted` solo oltre la radice (1), `broken`
filtrato come un vivo (3). Verde al ripristino in tutti e sei.

## 6. Fuori perimetro, misurato

- **`set_containment` rifiuta in silenzio** l'auto-composizione e restituisce `true`
  (§3). Il chiamante non ha modo di sapere che la scrittura non e' avvenuta.
- **`setValueAtPosition` ha lasciato un orfano** nella fixture: due append consecutivi
  su `Cooler.states` hanno lasciato lo slot a `["Broken"]` con `Off.father` ancora
  puntato li'. E' lo stato che la sweep copre; la causa nel core non e' stata cercata.
- Le sonde 10c..10f posano i contenimenti con `SetFieldAction` grezza e quindi
  **producono modelli senza `father`**. Nessuna via di produzione misurata fa lo stesso
  (l'import XMI scrive `child.father = containmentDValue.id`, `XMIService.ts` §B.2), ma
  le loro misure di *struttura* dell'albero vanno lette sapendolo.
