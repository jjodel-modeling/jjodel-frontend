# Prompt Claude Code: Discovery READ-ONLY — authoring panel per edge (verso E-ref)

**Data**: 2026-07-26
**Tipo**: discovery (Fase 1 del two-phase; READ-ONLY sul codice)
**Repo/branch**: jjodel-frontend / `alfonso-frontend-jjtl`
**Prerequisito**: E0 committato, working tree PULITO (`git status`). Se non lo è, STOP e segnala.
**Hard stop**: dopo la scrittura del discovery report. Nessuna modifica al codice.

## Perché questo task

E0 ha reso vivo il rendering IR-driven degli edge (entrambe le nature). Ora serve l'authoring: un `EdgeAuthoringPanel` per creare/modificare edge view dal pannello invece che da console. La prima natura è reference-as-edge (E-ref), che rende autorabile il class diagram reale. Questa discovery mappa la superficie di authoring esistente per progettare E-ref in chat, usando `RowAuthoringPanel` (R3) come template. Non decide nulla.

Decisioni già ratificate (addendum `spec_2026-07-26_ir_edge_authoring_addendum.md`, D5/D8) che vincolano il design a valle:
- Nuovo `EdgeAuthoringPanel` snello (non estensione di Vertex/Row), come `RowAuthoringPanel`.
- Entry-point: kind `edge` in `EnableIRPanel` con toggle di natura (object/reference); `ViewData.showIRTab` esteso a `edge` con guard anti-reseed.
- Matching reference = metaclasse sorgente + refName; target opzionale via `predicate`.

## Vincoli assoluti
- READ-ONLY sul codice. Uniche scritture: il discovery report in `docs/discovery/` + l'entry in `docs/claude-code-log.md`.
- Ogni finding con riferimento `file:riga` (path completi). Se un'ipotesi qui risulta falsa nel codice, dirlo.

## COSA (aree da mappare)

1. **`RowAuthoringPanel` (R3) come template**: struttura del componente, props ricevute, come clona/gestisce il draft, come valida e committa (`view.ir = draft`, debounce), come fa il matching inline (il row non usa `MatchingSection`). È il modello più vicino per `EdgeAuthoringPanel`.
2. **Entry-point**: `EnableIRPanel` — `KIND_OPTIONS` e come si aggiunge un kind, come avviene il seed della view, il rischio `D_LEVEL_TYPES` duplicato. `ViewData.tsx` — la formula `showIRTab` (:58) e dove/come il kind `row` viene instradato al suo panel; il punto esatto per aggiungere `edge` + la scelta di natura, con guard anti-reseed a vertex.
3. **`MatchingSection`**: props e tipo esatti (`VertexViewIR`, include `exclusive`). Valutare se allargarla a `EdgeViewIR` (per il futuro ramo object) o se per il ramo reference conviene matching inline (metaclasse sorgente + refName), come nel row.
4. **Widget condivisi per il form di stile**: `TextSourceEditor` (props, per `edge.labels.center`) e i primitivi per la linea (`ColorPicker`/`Select`/`NumberInput`): esistono? che props hanno? Grep: esiste già un picker di terminazione/marker? (censimento, non creare nulla).
5. **Resolver/predicate reference-as-edge**: confermare il contesto di valutazione del `predicate` in `resolveEdgeView` — il predicate di una reference-as-edge vede l'oggetto TARGET del link? (serve per la decisione D5 "target via predicate"). Riportare anche il percorso dello score reference (+0.5, `irResolveCore.ts:273-276`) così il panel autora il campo `reference` correttamente.
6. **Seed/default**: esiste `defaultEdgeViewIR`? (grep). Se serve un valore di seed per creare una edge view dal panel, come lo fa il row (`defaultRowViewIR`) e cosa servirebbe per edge. Solo report.

## Report (unica scrittura, oltre al log)
`docs/discovery/discovery_2026-07-26_edge_authoring_panel.md` con: obiettivo; file letti (path completi); findings per area con `file:riga`; proposta di fasizzazione di E-ref (es. scaffold panel + entry-point + ramo reference + widget di stile); domande aperte per Alfonso.

## COME
- Leggere per intero `RowAuthoringPanel`, `EnableIRPanel`, `ViewData`, `MatchingSection`, `TextSourceEditor` prima di riportare i findings; niente tour oltre le aree elencate.
- HARD STOP dopo il report + entry di log (tipo `chore`, discovery). In chat: sintesi per area + proposta di fasizzazione + domande aperte.

## RIFERIMENTI
- Addendum ratificato: `spec_2026-07-26_ir_edge_authoring_addendum.md` (KB) — D5/D8.
- Discovery substrato edge: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (Area 6, superficie di authoring).
- Prior art: `RowAuthoringPanel` (R3, commit `d1e6f9992`), decisione OQ-6 (panel nuovo, non estensione).
