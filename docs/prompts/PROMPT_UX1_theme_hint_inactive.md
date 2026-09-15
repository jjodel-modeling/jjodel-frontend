# PROMPT — UX1: hint «viewpoint non attivo» sul Form theme (micro, PARALLELO)

Chiude il punto aperto di STYLE2 §8: il select «Form theme» scrive il viewpoint SELEZIONATO nell'albero, la form legge quello ATTIVO — semantica corretta, ma se differiscono la scelta appare inerte finché il viewpoint non viene attivato.

## Cosa fare

- In `ViewpointProperties.tsx`, quando il viewpoint del pannello NON è quello attivo, una riga di hint sotto il select: copy asciutto stile prodotto, es. «Applies when this viewpoint is active.» (sentence case, niente enfasi). Solo testo, nessun disabled: la scrittura resta legittima.
- La sorgente di «attivo» è la stessa che `IRForm` legge (`state.viewpoint` — riusala, non derivarne una seconda).
- Visibile solo nel caso divergente: viewpoint attivo selezionato → nessun hint.

## Test attesi

- Divergente → hint presente; attivo → assente; il select scrive comunque in entrambi i casi (non-regressione sul write path di STYLE2).

## Fuori scope

Attivazione automatica del viewpoint alla scelta (cambio di comportamento non richiesto), il select legacy skin, ogni altra superficie.

## Coordinamento

Parallelo a ENG2: perimetro `ViewpointProperties.tsx` + test, zero file condivisi. Pathspec, entry di log in commit separato.
