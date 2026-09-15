# PROMPT — Slice 10c: manager parity con la board (SERIALE)

Ricevuto 2026-08-31. Trascritto verbatim.

---

Chiude il delta misurato a schermo (31-08) fra il manager consegnato (FL6+10b) e la board
`Manager Admin Form Bottom.dc.html` (progetto di design, illustrativa; queste regole sono
normative). Il motore non si tocca: e' tutta superficie. La deviazione A3 resta ratificata:
niente Save/Discard/«Unsaved changes» — il write e' diretto; dove la board li mostra, non li
costruire.

## 1. Rail del manager

Le metaclassi rendono col vocabolario del DS: badge quadrato «C» (coppia pastello/saturato di
`class` da `entities.css`), nome, conteggio a destra; riga attiva = campitura selezione. Oggi:
testo piatto senza badge.

Sotto le metaclassi, sezione eyebrow «VIEWS» con Outline (`bi-list-nested`) e Canvas
(`bi-diagram-3`) — Outline e' il pannello di 10b, Canvas = «open in canvas» (nessuna vista
Diagram: 13a/1b e' rimandata).

## 2. Testata della tabella

Titolo = nome metaclasse (24px, sentence case) + sottotitolo provenienza («Created from the
container's form · <modello>»).

Barra strumenti: input «Filter by name…» (filtro client sul nome), segmented per i literal
dell'enum discriminante quando la metaclasse ne ha uno (All | normal | initial | final per
State — leggi l'enum dalla shape, non cablare i literal), indicatore «N empty columns hidden»
quando la tabella nasconde colonne interamente vuote (comportamento nuovo: colonna vuota su
tutte le righe → nascosta, l'indicatore la dichiara), bottone Export (riusa il download
esistente se c'e'; altrimenti CSV client-side minimale), bottone primario «+ New <Metaclasse>»
= la create di 2c (stesso evento, scorciatoia rootable — regola Q8).

## 3. Footer della tabella

«N instances · M selected» a sinistra, paginazione a destra (client-side; soglia 50
righe/pagina, sotto soglia la paginazione non appare).

## 4. Stato di riposo

All'apertura: metaclasse piu' popolata preselezionata, tabella piena. Un solo empty state
possibile (modello vuoto), non due in cascata.

Nessuna istanza selezionata → il pannello form collassa a barra sottile («Select an instance
to edit it»); si espande alla selezione. Il doppio cartello «Pick a metaclass» + «No instance
selected» sparisce.

## Test attesi

- Filtro nome + segmented compongono (AND); l'indicatore colonne vuote riflette il conteggio
  reale; Export produce le righe filtrate.
- Preselezione: modello con istanze → tabella popolata al mount; modello vuoto → un solo
  empty state.
- Pannello collassato ↔ espanso segue la selezione; la create «+ New» emette lo stesso evento
  della create outline (assert sull'evento).
- Zero regressioni sulle superfici FL6/10b/FL7: selezione condivisa, riga espandibile,
  ego-diagramma invariati.

**Fuori scope**: draft di edit / Save / Discard (A3), vista Diagram 13a/1b, virtualizzazione
della tabella, ricerca globale ⌘K, dark mode.

**Coordinamento**: sessione singola, seriale — nessuna parallela in volo.
`InstanceManagerTab.tsx` e il rail sono tuoi. Committa con pathspec, log con la sola tua
entry, protocollo del 2026-08-30. Chiudi con sonda visiva sull'app vera (fixture Heater):
rail con badge, testata completa, preselezione, pannello collassato/espanso — screenshot nel
referto.

---

## Esito

`d448573ff`. 50 PASS / 0 FAIL sulla sonda visiva, 69 test nuovi, referto in
`docs/discovery/discovery_2026-08-31_manager_parity_10c.md`.

Due deviazioni dal perimetro dichiarato, entrambe motivate nel referto: `instanceTable.ts`
(la logica pura, altrimenti non provabile sotto node) e `__tests__/instanceManagerFl6.test.ts`
(due asserzioni che 10c supera per costruzione).

Il file `entities.css` non esiste: la coppia vive nei token
(`--color-entity-class-bg` / `-fg`) e il vestito pronto e' `.jj-type-badge--class`.
La board non e' nel repo — costruito sul testo del prompt, che si dichiara normativo.
