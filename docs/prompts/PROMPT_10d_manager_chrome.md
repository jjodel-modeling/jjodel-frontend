# PROMPT — Slice 10d: sfondo e card del manager (micro, SERIALE)

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili.

Richiesta utente a schermo (31-08): la colonna centrale del manager rende su bianco
pieno e le superfici sono piatte; la board `Manager Admin Form Bottom.dc.html` le vuole
come card su fondo desk. Solo chrome, zero logica.

## Cosa cambia

- **Sfondo dell'area centrale**: `--color-bg` / `#f8fafc` (il fondo app del DS), non
  bianco. Vale per tutta la colonna a destra del rail metaclassi.
- **La tabella diventa una card**: contenitore bianco, `border-radius: 12px`, hairline
  0.5px `#e2e8f0` (o il token bordo), shadow `0 1px 3px rgba(0,0,0,0.04)` — i token card
  del DS, non valori nuovi. Testata (titolo, filtri, Export) DENTRO la card; il footer
  istanze/paginazione e' il bordo inferiore della card.
- **Il pannello form diventa una card gemella** (stessi token), separata dalla tabella dal
  fondo desk — non due superfici fuse dallo stesso bianco. Collassato resta una card
  sottile.
- **Il rail metaclassi resta com'e'** (superficie di colonna, non card), solo verifica che
  il bordo destro regga sul fondo nuovo.
- **One-liner gia' arbitrato (10c)**: il sottotitolo perde «Created from the container's
  form» e tiene `<modello> · N instances`. La frase del motore su `newInstanceReason` non
  si tocca.

## Test attesi

- Asserzioni su classi/token, non pixel: area centrale col token bg, tabella e form coi
  token card; nessun esadecimale nuovo nel foglio.
- Zero regressioni: riga espandibile, ego-diagramma, pannello collassabile, filtri e
  paginazione invariati.

## Fuori scope

La form interna, l'ego, l'outline; il doppio «name» in tabella (se lo vedi, dichiaralo
senza toccarlo); 13a/1b; dark mode.

## Coordinamento

Sessione singola, seriale. Committa con pathspec, log con la sola tua entry, protocollo del
2026-08-30. Chiudi con sonda visiva sull'app vera: screenshot prima/dopo nel referto.
