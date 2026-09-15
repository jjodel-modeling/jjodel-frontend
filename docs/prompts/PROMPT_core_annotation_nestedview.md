# PROMPT — Sessione core: parseDAnnotation round-trip + censimento NestedView

Due lavori piccoli e indipendenti dal fronte manager (che vive in `editor-v2`/`jjform`). Committa con pathspec, log con la sola tua entry (protocollo del 2026-08-30).

## 1. `parseDAnnotation` — chiudere lo stub

Contesto: dal 2026-08-29 il gradino 1 della ladder dei renderer (`@renderer=…` dal metamodello) è alimentabile in sessione via `DAnnotation.new('jjodel/renderer=…')`, ma lo stub di `parseDAnnotation` costa il round-trip `.ecore`: un'annotazione dichiarata nel file importato non sopravvive.

- Trova lo stub (percorso import Ecore in `api/data.ts`, vicino a `parseDAttribute`/`parseDReference`) e implementa il parse delle `EAnnotation` con `source`/`details` → `DAnnotation`, almeno per il caso `jjodel/renderer`.
- **Vincolo dal discovery DTypedElement (2026-08-30):** il parser Ecore costruisce con `type === undefined` per contratto — quel percorso è pinnato da test e deve restare identico. Non toccare la costruzione dei typed element; l'annotazione è additiva.
- Misura il round-trip come si può: la sonda e2e via file picker non è pilotabile (dichiarato il 2026-08-30, §8) — esercita il parser sul JSON che `prxml2json.xml2jsonobj` produce da un `.ecore` fixture, non sul picker.
- Test: un `.ecore` con `EAnnotation source="jjodel" details renderer=color` produce la DAnnotation; il gradino 1 dell'inspector la vede; un file senza annotazioni resta identico a prima (controllo negativo).

## 2. Censimento `NestedView`

Residuo a registro: `NestedView` senza importer vivi — codice potenzialmente morto da confermare.

- Censimento completo: grep di ogni riferimento (import, stringhe, registry, jsx). Verdetto per sito: vivo / morto / raggiungibile solo da percorso morto.
- **Solo censimento e report**, nessuna rimozione: se il verdetto è «morto», la rimozione è una slice a parte da ratificare.
- Report in `docs/discovery/` con lo stesso formato del 2026-08-30 (difetto/misura/verdetto, tabella dei siti).

## Gate

Typecheck a baseline, vitest verde, nessun file condiviso con la sessione 2c (`editor-v2/`, `jjform/`).
