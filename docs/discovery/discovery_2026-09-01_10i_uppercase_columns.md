# 10i — le intestazioni in maiuscolo e il pannello Columns

**Data**: 2026-09-01
**Slice**: 10i, punti 3-4 del prompt di 10h, rimasti fuori dal suo commit (`011d77476`)
**Perimetro**: la sola superficie del manager d'istanze. Zero D-layer, zero sync.

---

## 0. Scarti fra prompt e repo, misurati prima di scrivere

Tre, tutti risolti a favore del repo.

**(a) «letter-spacing: 0.04–0.1em, token typography, zero valori nuovi».** Non
esiste un token in quella banda che valga l'eyebrow: `--tracking-wide` e' 0.05em,
usato UNA volta in tutto il repo (`ImportSummaryModal.scss:104`). Il valore che il
DS usa davvero per l'eyebrow e' `0.08em`, letterale, in 13 punti — e **R-RAIL-10**
lo nomina esplicitamente come la propria **prima eccezione**: «`letter-spacing:
0.08em` resta letterale». Inventare un `--tracking-eyebrow` sarebbe stato estendere
la scala per far combaciare una superficie, che e' cio' che R-RAIL-10 vieta. Le
intestazioni prendono quindi le stesse quattro dichiarazioni di
`.instance-manager__eyebrow`, `0.08em` compreso.

**(b) le altre tre dichiarazioni c'erano gia'.** `thead th` era gia' a
`var(--text-xs)` (11px), `600` e `var(--color-form-muted)` (che e' `$slate-400`,
verificato in `_colors-light.scss:411`, dove il commento dice gia' «eyebrow»). Il
delta reale della slice e' **una riga aggiunta** (`text-transform: uppercase`) e
**una cambiata** (`0.04em` -> `0.08em`). Il prompt descriveva quattro proprieta';
tre erano gia' a posto e la quarta divergeva di 0.04em senza una ragione scritta.

**(c) «name non disattivabile» non e' una casella.** Vedi §3.

---

## 1. Il maiuscolo lo fa il CSS — e perche' e' l'unica lettura possibile

`text-transform: uppercase` cambia i pixel e lascia il `textContent`. Riscrivere le
stringhe (`entryAction` -> `ENTRYACTION`) avrebbe perso il nome della feature per
il `title` dell'intestazione, per l'header del CSV di `toCsv`, e per chi legge con
uno screen reader — che riceve il testo, non la resa.

Questa e' esattamente la distinzione che un test sul sorgente **non puo'** fare, ed
e' la ragione per cui la sonda esiste (§5). Misurato a schermo: dopo la slice il
computed `text-transform` vale `uppercase` su ogni `th` visibile e il `textContent`
resta `entryAction`. Le due misure insieme dicono cio' che nessuna delle due dice
da sola.

Le due intestazioni a solo screen reader (`actions`, `expand`) sono escluse dalla
misura: portano un `<span class="instance-manager__sr">` e non dipingono nulla.

---

## 2. Il modello del pannello Columns

Quattro funzioni pure in `instanceTable.ts`, non un'espressione dentro il JSX: il
tab non e' montabile sotto vitest (`InstanceManagerTab.tsx` importa il barrel di
`editor-v2/`, che arriva a monaco, che dereferenzia `window` all'import — la stessa
ragione per cui `instanceTable.test.ts` esiste). La regola «l'indicatore conta solo
le non-overridate» doveva essere provabile.

```
ColumnOverrides = Record<string, boolean>   // chiave assente = nessuna scelta
```

**L'assenza di una chiave non e' `true`.** Se «nessuna scelta» valesse «visibile»,
il primo render di ogni metaclasse mostrerebbe tutte le colonne e la riduzione
automatica di `emptyColumnKeys` sarebbe morta. E' per questo che il tipo e' un
record parziale e non un `Set` di chiavi accese, e per questo la spunta scrive
sempre un booleano **esplicito**: togliere la chiave riporterebbe all'automatico,
che per una vuota appena spuntata vorrebbe dire vederla sparire al giro dopo.

`autoHiddenColumnKeys` toglie dal conteggio **entrambe** le direzioni di override,
non solo quella che accende: una vuota che l'utente ha tolto di suo e' una sua
scelta, non una riduzione fatta dalla tabella, e l'indicatore dichiara cio' che la
tabella ha deciso da se'.

La nota `empty` segue il **modello**, non la spunta: una colonna forzata visibile
resta vuota su ogni istanza, e il fatto non cambia perche' la si guarda.

---

## 3. «name non disattivabile» — misurato, e non come previsto

Il prompt chiede che `name` non si possa spegnere. La prima stesura l'ha reso vero
nel modo ovvio — `isColumnVisible` che ritorna `true` per `name` — e la sonda ha
mostrato **una regressione**: le intestazioni passavano da `["name", …]` a
`["name", "name", …]`.

La causa e' che `tableFeatures` restituisce **ogni** attributo, `name` compreso: in
un metamodello che dichiara `name : EString` la tabella ne stampa due, la colonna
fissa (fuori da `shownColumns`) e la feature omonima. Quel doppione precede 10i,
e' fuori perimetro, e fino a ieri era **invisibile** solo perche' lo slot `name`
delle istanze risulta vuoto — il nome vive su `DObject.name` — e
`emptyColumnKeys` lo nascondeva. La guardia lo ha resuscitato.

Il modello corretto, che e' quello consegnato:

- la colonna **fissa** dei nomi non passa da `shownColumns` e quindi **nessuna**
  riduzione la tocca. E' questo, e non una casella, cio' che «name non
  disattivabile» protegge;
- la voce **sintetica bloccata** del pannello esiste solo per il metamodello che
  NON dichiara `name`: e' li' per dire che la colonna c'e', non per offrire un
  gesto;
- quando `name` e' dichiarato, la voce del pannello e' la **feature**, ordinaria:
  toglierla rimuove il doppione e lascia la fissa. Verificato a schermo (asserzione
  2g della sonda: tolta la spunta, `name` resta fra le intestazioni).

Misura di riposo, la prova che il doppione non e' della slice: le intestazioni a
riposo sono `["name","substates","referenced by","actions","expand"]` **identiche**
prima e dopo.

---

## 4. Divergenza rilevata e LASCIATA

`&__draft-label` (il dialogo di create) e' un quinto eyebrow del foglio, a
`0.04em`. E' dentro la banda dichiarata dal prompt, sta su un'altra superficie, e
il prompt non lo nomina: rilevato e lasciato (Regole 1 e 8), con un'asserzione in
`instanceManager10i.test.ts` che ne fissa lo stato attuale perche' la prossima
sessione non lo scopra di nuovo.

Stessa disciplina per l'ombra: `&__outline-menu` porta `rgba(0,0,0,0.06)`
letterale. Precede R-RAIL-10 e resta com'e'; la card nuova **non** la ricopia e usa
`0 2px 6px var(--color-node-shadow)` — geometria per esteso, colore da token, che
e' la forma che R-RAIL-10 prescrive. In scuro il token vira e il letterale no.

---

## 5. Verifica

**Suite propria** — `instanceManager10i.test.ts`, 36 casi. Provata con **cinque
mutazioni**, verde al ripristino in tutte e cinque:

| mutazione | rossi |
|---|---|
| `text-transform` rimosso da `thead th` (e ritorno a 0.04em) | 3 |
| `autoHiddenColumnKeys` ignora gli override | 3 |
| `isColumnVisible` scritta con `\|\|` (assente == false) | 3 |
| la voce `name` sintetica non piu' bloccata | 1 |
| la nota `empty` segue la spunta invece del modello | 1 |

**Sonda** — `scripts/smoke/_tmp_10i_verify.ts`, due giri sull'app vera con la
fixture di 10h piu' due attributi mai valorizzati (`entryAction`, `kind`):

- **before 15 PASS / 6 FAIL**, **after 43 PASS / 0 FAIL**, zero errori di pagina
  in entrambi.
- I controlli positivi (blocco 0) e le non-regressioni 3a–3f sono **verdi in
  entrambi i giri**: e' quello che li rende controlli. L'unica non-regressione che
  vira e' 3g, che misura il maiuscolo sotto filtro.
- Il giro before salta 2e..2w per assenza del bottone, e il salto e' **dichiarato
  a video**: senza la guardia il primo `click` moriva in timeout portandosi via il
  blocco 3, cioe' l'unico che deve essere verde due volte.

Tre asserzioni della sonda sono state corrette **contro la sonda e non contro il
prodotto**, e vale la pena registrarle perche' sono tutte e tre lo stesso errore —
una misura presa nello stato sbagliato:

1. `entryAction` cercato fra le intestazioni **prima** di forzarla visibile: era
   auto-nascosta, cioe' il comportamento corretto. Spostata dopo il gesto (2k1);
2. «le vuote non sono spuntate» applicata anche alla voce bloccata: su questa
   fixture lo slot `name` **e' davvero vuoto**, e la voce e' spuntata per
   costruzione. Da qui la regola che la voce bloccata non porti mai la nota;
3. il salto dell'indicatore misurato da `k0` invece che da subito prima del gesto:
   il blocco 2g aveva gia' lasciato un override su `name`, e la somma dei due
   effetti (5 -> 3) veniva letta come un difetto.

**Gate** — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo); `npm run build` exit **0**; `npx vitest run` **2759 passati / 0
falliti**, 9 file rossi = i noti `window is not defined`.

**Due asserzioni di `instanceManager10c.test.ts` riallineate**, non cancellate:
10i sostituisce `hiddenColumnKeys` con `autoHiddenKeys` nell'indicatore e
`visibleColumns` con `shownColumnsWith` nel tab. La misura di partenza —
`emptyColumnKeys(rows, columns)` su TUTTE le righe, non sulle filtrate — resta
fissata dalle stesse righe.

**Screenshot**: `_tmp_10i_{before,after}_1_headers`, `_tmp_10i_after_{2_panel,
3_forced,4_persisted,5_selected,6_filtered,7_dark_panel}`.
