# PROMPT — Pulizia selettori orfani in nestedView.scss

Slice a valle della rimozione di `NestedView` (0494a9cad): il censimento del 30-08 ha misurato **48 selettori resi orfani** dalla rimozione + **21 già orfani prima**, con due riserve di metodo dichiarate in §4 del report (confronto per sottostringa = limite superiore alla vita; `&__row` annidati non visti = i 48 sono per difetto).

## Perimetro

- `nestedView.scss`, unico importatore vivo `ViewData.tsx:24`.
- Rimuovi i selettori **provatamente** orfani; un selettore in dubbio resta. Le due riserve di metodo vanno sciolte prima di cancellare:
  1. espandi i nesting `&` a selettori pieni prima del confronto (i `&__row` annidati);
  2. verifica la vita per **classe usata**, non per sottostringa: la classe compare in un `className` (anche costruito), in un template literal, o in un selettore JS (`querySelector`)? Il grep deve coprire `ViewData.tsx` e ogni file che il pannello monta.
- Se dopo l'espansione un blocco è vivo solo in parte, pota le foglie morte e lascia il tronco.

## Metodo

- Report prima/dopo in `docs/discovery/` (formato 30-08): lista selettori espansi, verdetto per selettore (vivo/orfano/dubbio, con l'evidenza), conteggio finale. I «dubbio» restano nel file e nel report.
- **Prova visiva obbligatoria**, stessa tecnica del 30-08: sonda su `ViewData` girata sul prima e sul dopo, md5 dei ritagli identico. È il criterio della slice: se i pixel cambiano, un selettore vivo è stato tolto — fermati e riporta.

## Gate

Typecheck a baseline, vitest verde, build exit 0, smoke 12/0/3, ritagli md5-identici.

## Coordinamento

Due sessioni parallele: 12b/12c (`editor-v2/`, `jjform/`) e R-STR-6 (canvas). Nessuna tocca `nestedView.scss` o `ViewData`. Pathspec, entry di log in commit separato.
