# PROMPT — Fixture: brokenRef sul ramo IR + coda micro-residui

Chiude il residuo di R-STR-6 (B) (§5 del report): `brokenRef` non è mai stato esercitato sul ramo IR perché la demo view di RowViewSmoke dichiara solo un compartment `attributes` — nessuna riga reference a schermo.

## 1. Compartment references nel fixture

- Aggiungi alla view IR di `examples/RowViewSmoke` un compartment `references` (additivo: le righe esistenti e i loro id non cambiano — le sonde delle altre sessioni ci leggono).
- Popola i tre stati: ref valida (→ `refPill`), ref rotta (→ `brokenRef`), slot vuoto (→ `dash`), su istanze già presenti o aggiunte in coda al fixture.
- Test a schermo: i tre renderer di stato dipingono sul ramo IR come sul nativo; le guardie vincono su annotazione e override (estende il 16/16 di R-STR-6 B).

## 2. Coda micro

- `tree.scss`: `$color-accent` ora declared-and-unused (side effect dichiarato della pulizia del 30-08) — rimuovila con la verifica **uses vs declares** nel file (R-NV-7: le variabili SCSS sono file-scoped; niente grep repo-wide per omonimia).
- Gate: CSS compilato identico, computed style sulla superficie tree (il gate pixel lì non ha segnale — R-NV-8: certificazione per computed style, dichiarato).

## Coordinamento

Sessione parallela: 12b/12c (`editor-v2/`, `jjform/`). Il fixture RowViewSmoke è condiviso in LETTURA dalle sonde: modifica solo additiva, committa presto, e se il working tree mostra modifiche altrui al fixture fermati e segnala (P6). Pathspec, entry di log in commit separato.
