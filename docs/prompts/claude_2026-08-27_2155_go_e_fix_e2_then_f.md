# GO Claude Code: esito visivo del commit E, fix E2, poi commit F

> **Nome del documento prompt**: 2026-08-27 21:55

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili.
Corsia: veloce per E2 (quattro file, ritocchi); F resta nella corsia del prompt padre (12:40).
**Corregge**: 2026-08-27 12:40 (Slice 1b, commit E `706a441a6`), causa (a): il prompt padre non
fissava il contenuto del badge nelle righe di riferimento né l'altezza dell'input delle chip.

Verifica visiva di E fatta dalla chat sul Chrome di Alfonso, progetto `Form 1b fixture`. Esito:
**V5, V6 e V7 verdi nella sostanza**, quattro ritocchi visivi, una nota di processo, e due
controlli non eseguiti a schermo per cause esterne al codice (sotto, «Non esercitato»).

## Cosa si è visto

- V5: su `start`, `target` è un picker con badge e `Running`; click → popover portalled su
  `body` (fondo, bordo, `--shadow-popover` misurati), riga di ricerca con focus, 6 candidati in
  un gruppo `Bound Objects`, nessun `(none)` perché `[1..1]`. Digitato `of` → resta `Off`
  evidenziato (fondo cyan e barra a sinistra); Enter → `target = Off` nello store, widget
  `O Off`, marker dirty, popover chiuso. L'arco `target` sulla tela segue: da `start` a `Off`.
- V6: su `Running`, `outgoing` è una lista di 2 righe (`stop · to Off`, `fault · to Broken`) con
  `bi-x` e `Add`; `substates` 2 righe senza `Add`. `Add` → popover in modalità append (senza
  `(none)`) → `start` → 3 righe, raw `[stop, fault, start]`. Rimozione di `fault` → 2 righe, raw
  `[stop, null, start]` (buco, come deciso al punto 10); rimozione di `start` → 1 riga, raw
  `[stop, undefined, null]`: la seconda rimozione ha colpito l'indice giusto, quindi la
  conservazione dell'indice grezzo funziona. Nota: i due buchi hanno forma diversa
  (`undefined` e `null`), innocuo per la form, ma da sapere.
- V7: `tags` è un contenitore con due chip da 20px; `Add` apre l'input, `night` + Enter → tre
  chip, raw `[hot, monitored, night]`; `bi-x` su `hot` → due chip, raw `[null, monitored, night]`;
  Escape chiude l'input senza scrivere.

## Ritocchi (commit E2)

**E1, badge delle righe.** `referenceLetter(name)` mette la **prima lettera del nome**
dell'oggetto (`I` per Idle, `R` per Running, `O` per Off): tre stati con tre lettere diverse. Il
mockup (§Widgets: «metaclass letter badge») e il prompt padre (punto 7: «badge lettera
dell'entità») vogliono la lettera della **metaclasse**: `S` per ogni State, `T` per ogni
Transition. Fix in `ReferenceWidget`, `ReferencePicker` e `ListWidget`: la lettera è l'iniziale
maiuscola del nome della metaclasse del target (`LObject.instanceof.name`, oppure `typeName`
del descrittore quando il target non è risolvibile), con i token `--color-entity-object-*` come
il badge dell'header. Test: due State producono la stessa lettera.

**E2, input delle chip.** Aperto, l'input è alto 28px dentro chip da 20px: il contenitore
passa da 28 a 36px e tutto ciò che sta sotto scende di 8px, poi risale a Escape. È un layout
shift, vietato dal contratto (prompt padre, punto 9: «input di 20px»). Fix in `ChipsWidget`:
input alto 20px, stessa riga delle chip, contenitore che non cambia altezza fra chiuso e aperto.
Verifica: `getBoundingClientRect().height` del contenitore uguale prima e dopo `Add`.

**E3, candidati in append.** In modalità append il popover offre anche i valori **già
presenti** nella lista (`stop` e `fault` erano candidati mentre erano già in `outgoing`), quindi
due click producono un duplicato. Un riferimento multivalore è un insieme (EMF `unique`
default). Fix in `ListWidget`: in append mode i candidati escludono gli id già in
`field.filled`; se non resta nessun candidato, `Add` è disabilitato con `title="No candidates
left"`. Test sulla funzione di filtro.

**E4, fondo del popover.** `--color-form-panel` (`#f8fafc`) al posto di `--color-form-surface`
(`#ffffff`, README §Widgets: «popover (white, border #e2e8f0...)»). Una riga in
`irFormStyle.scss`.

## Note, non da toccare in E2

- Il breadcrumb in testa al rail mostra `Transition_0` / `State_0` (nome D): stessa famiglia
  della voce TECH-DEBT «DObject.name / slot name all'import». Aggiungi il breadcrumb alla voce
  esistente come secondo consumatore colpito, senza toccare il codice.
- Processo (P8): oltre a `document.visibilityState`, la sonda deve sapere che il rail entra con
  due `requestAnimationFrame` (`PropertiesWithTreeView.tsx`, commento «Slide in and out»): con
  la scheda in background resta a `translateX(100%)`, cioè fuori schermo, e ogni misura di
  posizione sul rail è falsa. La chat oggi lo ha forzato togliendo la classe `--collapsed` a
  mano; la regola è che si misura solo con la scheda visibile.

## Non esercitato a schermo

- V7, limite superiore (`Add` disabilitato con `Maximum 5`): quattro click reali necessari, e la
  scheda è tornata in background prima di eseguirli (gli eventi di input non arrivano a una
  scheda nascosta). Resta coperto dal test unitario su `isAtUpperBound`; si riprova insieme a F.
- V8 (`features: { substates: 'hidden' }` da console): il progetto fixture non ha viewpoint né
  view, quindi non c'è un `view.ir` su cui scrivere. Coperto dal test su `describeSlots`. Per F
  la chat crea prima una viewpoint con una view su `State` (serve comunque per V9 e V10), e V8
  si esegue lì.

## COSA: commit E2 poi F

*Commit E2*, `fix(rail): metaclass letter in reference rows, 20px chip input, no duplicate
candidates, white picker (form views 1b)`: `widgets/ReferenceWidget.tsx`, `widgets/ReferencePicker.tsx`,
`widgets/ListWidget.tsx`, `widgets/ChipsWidget.tsx`, `irFormStyle.scss`, i test dei widget se
esistono (altrimenti i due test indicati sopra vanno nel file di test più vicino già esistente,
non in file nuovi). Gate come nel prompt padre. Nessun hard stop dopo E2: la verifica di E2 si
fa insieme a quella di F.

*Commit F* come da prompt del 12:40, punti 12-15. **Hard stop dopo F** per V9, V10, più V7-limite
e V8 recuperati, più E1-E4.

## NON FARE

Non toccare `formWrite.ts` (la scelta sul buco è chiusa), `useFormWidgets.ts`, `IRForm.tsx` in
E2 (F lo tocca), `PropertiesWithTreeView.tsx`, `problems/*`, `LModelElement.tsx`.
