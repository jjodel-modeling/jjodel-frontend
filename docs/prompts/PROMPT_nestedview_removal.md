# PROMPT — Rimozione NestedView

Slice di sola rimozione, ratificata a valle di due censimenti concordi (R-DEAD-1..6 del 2026-08-23, riconferma del 2026-08-30 su HEAD: 11 siti / 5 file, nessun mount, barrel con due importer vivi che non prendono `NestedView` — il controllo positivo che rende la silenziosità un negativo vero).

## Perimetro

- Rimuovi `NestedView` e i suoi riferimenti nei 5 file del censimento del 30-08 (leggi il report in `docs/discovery/` — la tabella dei siti è l'elenco autoritativo): il file stesso, il re-export dal barrel, i commenti che lo citano.
- **`nestedView.scss` NON si tocca**: è indossato da un `ViewData` vivo (censimento 30-08). Se la rimozione del `.tsx` lascia selettori davvero orfani nel `.scss`, dichiaralo nel report senza rimuoverli — è un'altra slice.
- I tre orfani citati dal censimento restano orfani: fuori perimetro, non allargare.

## Metodo

- Prima della rimozione, ri-esegui il grep del censimento (la forma **corretta**, quella che dà 11 — non il `wc -l` sui file cercati, errore metrologico documentato in §5 del report 30-08) e verifica che il conteggio sia ancora quello. Se è cresciuto di siti non-commento, fermati e riporta.
- Dopo la rimozione: stesso grep → i soli residui ammessi sono nel report di discovery e nel log.
- Report breve in `docs/discovery/` (formato del 30-08): siti rimossi, grep prima/dopo, verdetto scss.

## Gate

Typecheck a baseline, vitest verde (la suite non importava `NestedView`: zero test da rimuovere — se invece uno esiste, è un sito che i censimenti non hanno visto: fermati e riporta), build exit 0, smoke visivo invariato.

## Coordinamento

Sessione parallela: 12d delete (`editor-v2/`, `jjform/`). Pathspec, log con la sola tua entry, **entry di log in commit separato** (patologia da race confermata il 30-08).
