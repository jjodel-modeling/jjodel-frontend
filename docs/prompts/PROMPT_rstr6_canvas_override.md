# PROMPT — R-STR-6: l'override della view vince anche sul canvas

Residuo a registro dal Livello 2 (Structure tab), ora su chiamata. Riferimenti: `Instance Node Proposal.dc.html` (Turno 7c) e `docs/PROMPT_structure_tab.md` (Regola 2, stato misurato R-STR-7).

## Il punto

La precedenza `FormSpec.widgets` > `@renderer` è viva su **due** superfici (Form tab e inspector ladder, R-STR-7 sciolta il 29-08) ma la terza — il **rendering effettivo sul nodo canvas** — va verificata e, dove non onora l'override, allineata: il nodo deve rendere col widget della view quando la view lo dichiara, non col renderer del metamodello.

## Metodo (misura, non assunzione)

1. **Prima misura lo stato**: con un override di view attivo (chip `view` sull'inspector), il nodo canvas rende col widget della view o col gradino 1? Sonda a schermo su un nodo del ramo IR, per ogni renderer della mappa di R-STR-3. Può darsi che `viewWidget` già copra tutto — in quel caso la slice è un report di conferma + i test che pinnano, e nessun diff di rendering.
2. Se ci sono renderer che non onorano l'override: il fix passa da dove la ladder già decide (`valueRenderer`/`widgetRenderer`, zero import — R-2B-2: la precedenza è del motore). Non aggiungere una seconda decisione nel componente canvas.
3. L'IR non si riscrive mai in silenzio (principio del fallback, Regola 1 del Livello 2).

## Test attesi

- Per ogni renderer della mappa: override attivo → il nodo rende il widget della view; Reset → torna al metamodello; senza `@renderer` né override → default per tipo.
- Il chip di stato dell'inspector e la resa del nodo non possono divergere (stessa sorgente, `FormSpec.widgets`).

## Fuori scope

Dark mode, `property.render = edge-label`, ogni cosa del fronte manager.

## Coordinamento

Due sessioni parallele: 12b/12c (`editor-v2/`, `jjform/`) e scss orfani (`nestedView.scss`, `ViewData`). Pathspec, entry di log in commit separato.
