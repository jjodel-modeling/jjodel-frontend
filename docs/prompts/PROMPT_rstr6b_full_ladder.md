# PROMPT — R-STR-6 (B): la ladder completa sul segmento value del ramo IR

Chiude il costo dichiarato di (A) (`2a3e408c0`, R-STR-6e): sul ramo IR il gradino 0 dipinge, il gradino 1 (`@renderer=…` dal metamodello) e i gradini tipo/nome no — `guard` rende testo sul nodo IR e `code` sul nativo. Riferimenti: report `discovery_2026-08-30_3_rstr6_canvas_override.md` (§6bis) e la ratifica di design del 30-08: **il compartment IR è una superficie resa, non testo d'autore** — è il design del Livello 3 (`Instance Node Proposal`), e la resa piatta attuale è il buco, non la baseline da proteggere.

## Il punto

Il segmento `value` di `IRNodeContent` passa per la **ladder completa** di `detectValueRenderer` — la stessa chiamata del ramo nativo, così i due rami non possono divergere. (A) ha già costruito il ponte (callback `renderViewWidget` via il name bridge di R-STR-7): estendilo o generalizzalo, ma la decisione resta UNA, nel motore — mai un secondo `detect` nel componente.

## Vincoli

- L'ordine dei gradini è quello di (A): guardie di stato (`dash`/`collection`/`brokenRef`/`refPill`) → gradino 0 (view) → gradino 1 (annotazione) → tipo → nome.
- **Niente nuova chiave IR**: la scelta resa/testo non è per-view — è il comportamento del prodotto (ratifica di design). Se serve prudenza per il blast radius sulle view IR esistenti, feature-flag di UN giro dichiarato nel log, mai un fork della decisione, e mai una chiave persistita senza VersionFixer.
- L'IR non si riscrive mai in silenzio.
- Prima misura il blast radius: sonda sulle view IR dei fixture (RowViewSmoke + quelle degli smoke), conteggio righe che cambiano resa, per gradino (annotazione / tipo / nome). Il numero va nel report — è il dato che la ratifica di prudenza aspetta.

## Test attesi

- `guard` (`@renderer=code`) rende `code` su ENTRAMBI i rami — il test di coerenza che (A) non poteva passare.
- Per ogni renderer della mappa R-STR-3: annotazione sola → gradino 1; annotazione + override → gradino 0; Reset → torna al gradino 1 (non al testo).
- Gradini tipo/nome: `tint=Green` → swatch, `ratio` → progress sul nodo IR, come sul nativo e come in tabella 2b.
- Le guardie di stato vincono sempre (slot vuoto → dash, ref rotto → brokenRef, anche con annotazione presente).

## Fuori scope

Dark mode, `property.render = edge-label`, fronte manager.

## Coordinamento

Possibili sessioni parallele: 12b/12c (`editor-v2/`, `jjform/`) e scss orfani (`nestedView.scss` — occhio: era staged nel tree, verificane lo stato). Pathspec, entry di log in commit separato.
