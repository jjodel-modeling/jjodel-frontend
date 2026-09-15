# PROMPT — FL6: riassetto del manager — form sotto la tabella + riga espandibile (SERIALE, dopo FL4+FL5)

Chiude il gap dichiarato dal referto FL5: `EgoDiagram` è committato ma scollegato
perché il layout che lo ospita non è mai stato costruito. Referenza visiva:
`Manager Admin Form Bottom.dc.html` (progetto di design, illustrativa; queste
regole sono normative). Stato attuale misurato da FL5: `InstanceManagerTab.tsx:1747`
rende un `<tbody>` piatto, click = `selectOnly(row.id)`, form nel pannello destro,
vicinato in un `aside`.

## Cosa cambia

- La form migra dal pannello destro al pannello **sotto la tabella**: header con
  nome istanza + badge «Unsaved changes» quando il draft è sporco, azioni
  Save / Discard / Delete a destra. Contenuto: la IRForm auto-layout di FL4,
  invariata — FL6 la sposta, non la tocca. Larghezza contenuto max 1300px
  centrata (decisione ratificata: leggibile a 27").
- La riga della tabella diventa **espandibile**: click sulla riga = selezione
  (come oggi, `selectOnly`) + espansione; chevron `bi-chevron-down/up` in coda
  riga; una sola riga espansa alla volta (l'espansione segue la selezione).
- La riga espansa monta `EgoDiagram` con le sue tre prop (istanza, shape,
  dispatch di `egoAction`): header eyebrow «NEIGHBORHOOD · 1 HOP» + «click a node
  to select it · open in canvas»; footer conteggi con «show all». Il click su un
  vicino invoca la selezione della tabella — stessa azione della riga.
- **L'aside del vicinato viene rimosso** — sostituito dalla riga espandibile. Se
  l'aside ospita altro oltre al vicinato, quello resta e lo dichiari nel referto.
- **Fallback a larghezza stretta** (clausola scoperta della board): sotto una
  soglia misurata (container query o misura al render, non viewport),
  l'ego-diagramma degrada a lista testuale — tre gruppi «incoming / this object /
  outgoing», stessi dati, stessi click. Nessuno scroll orizzontale.
- **Export nel barrel**: aggiungi l'export di `egoNeighborhood` in
  `jjform/index.ts` (punto 4 del referto FL5 — FL4 ha lasciato il file, non c'è
  più contesa).

## Test attesi

- Selezione → riga espansa + form nel pannello sotto, stesso id ovunque; cambio
  selezione chiude la precedente.
- Click su nodo vicino nell'EgoDiagram sposta selezione, espansione e form
  sull'id giusto.
- Draft sporco: badge appare; Discard lo azzera; Save/Delete restano quelli di
  FL4/12d, non ridefiniti qui.
- Fallback stretto: sotto soglia rende la lista testuale (assert su struttura,
  non pixel).
- La create (2c) continua a funzionare con la form nella nuova collocazione —
  nessuna form parallela.

## Fuori scope

Diagramma embedded 13a (slice a parte — l'aside che rimuovi non è quella slice),
outline 10b, canvas 1b, qualunque modifica a `layout.ts` / `themes.ts` /
registro FL3 / `EgoDiagram` interno.

## Coordinamento

Sessione singola, seriale — FL4 e FL5 sono mergiati, nessuna contesa;
`InstanceManagerTab.tsx` e il renderer IRForm sono tuoi. Committa con pathspec,
log con la sola tua entry, protocollo del 2026-08-30. Chiudi con la verifica
visiva: istanza StateMachine selezionata, i 4 preset tema dal tab Style,
confronto con la board (righe attese = quelle derivate dalle regole:
riga 1 `[name, kind, isHistory]`).

---

## Esito — due clausole non applicabili come scritte

Registrate qui perché il prompt le dà per acquisite, e non lo sono. Per esteso in
`docs/discovery/discovery_2026-08-31_fl6_riassetto_manager.md`.

1. **Save e Discard non hanno un motore.** La form scrive diritto nello store
   (`formWrite.ts`); non esiste un draft di edit, né in FL4 né altrove.
   `SaveManager` non ha un `save()`. Resi: nome, metaclasse, badge e Delete
   (12d). Save e Discard non resi, punto aperto dichiarato. Deciso in chat.
2. **La riga 1 attesa vale a una condizione.** `[name, kind, isHistory]` somma
   `6 + 6 + 3 = 15` su una griglia da 12 se `kind` è una stringa. Il board la
   disegna corta (enum a poche voci, span 3): `6 + 3 + 3 = 12`. Dimostrato
   ritipizzando `kind` a runtime — la stessa form rende allora i tre campi.
