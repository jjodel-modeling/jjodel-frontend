# PROMPT — FL3: widget estesi come gemelli write-side delle Row view

Implementa i widget estesi specificati da `docs/design/form-autolayout-spec.md`, sezione "Extended widget classes" di `Form Auto Layout.dc.html` (autoritativa per icone, formati e stati).

## Principio (vincolante)

Ogni widget è il gemello write-side di una Row view: lo stesso valore rende identico nella cella di tabella, nel compartment del nodo e nella form — un renderer, due taglie, read/write. Un renderer nuovo nasce IN COPPIA (read + write) o non nasce. Riusa i value renderer esistenti per la parte read; qui aggiungi solo la parte write.

## Widget da coprire

- `date` → input mono + icona `bi-calendar3`; `datetime` → + `bi-clock`; formato ISO abbreviato come nel prototipo.
- `duration` → input mono + suffisso unità (`ms`, `s`) non editabile.
- `color` → swatch 12px (lo STESSO swatch della Row view) + hex mono.
- `@email` → input + check di validazione inline (`bi-check-circle` verde / errore rosso a destra).
- `@url` → input + affordance apri-link (`bi-box-arrow-up-right`), il valore rende come link nella parte read.
- `text` multiline / richtext → textarea che cresce verticalmente, min-height ~54px.
- Chip input multivalore (tags e multi-ref): chip con rimozione `bi-x`, affordance `add…` / `+ add target`, i ref come pill cyan (`#ecfeff` / `#0891b2` / bordo `#a5f3fc`) — identici ai pill della tabella.

## Dove

- Componenti nella sede dei widget form esistenti (accanto ai widget di 2a/2b — segui la struttura che c'è, non crearne una nuova). Logica pura di validazione/formato (email regex, parse duration, normalizzazione hex) in `jjform/` o `shapeDraw`, importabile sotto vitest.
- La risoluzione tipo→widget arriva da FL1 (`layout.ts`); in questa sessione i widget si registrano per NOME — non dipendere dal file di FL1, esporta un registro `{ nome: componente }` che FL4 cuce.

## Stati (per ogni widget)

Default, focus (ring `0 0 0 3px rgba(8,145,178,0.12)` + bordo `#0891b2`), disabled/readOnly (`#f8fafc`, `not-allowed`, lucchetto sulla label), errore (bordo rosso + messaggio per campo dal formModel — l'idioma di 12a).

## Test attesi

- Validazione: email valida/invalida, url con e senza schema, duration `250ms`/`2s`/garbage, hex valido/invalido — puri, senza DOM.
- Round-trip write: il widget emette lo stesso shape di valore che la Row view legge (un fixture per tipo).
- ReadOnly: il widget rende la variante disabilitata, mai un input attivo.

## Fuori scope

Packing (FL1), temi (FL2), integrazione nel renderer (FL4), datepicker custom (l'input nativo basta nel v0).

## Coordinamento

Parallelo a FL1/FL2, file disgiunti. Committa con pathspec, log con la sola tua entry.
