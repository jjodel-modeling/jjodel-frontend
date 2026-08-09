# Prompt Claude Code — Fix trickle edge settle, Fase 1: EdgeLabelRenderer condizionale (+ commit discovery reports)

**Data**: 2026-07-20
**Branch di lavoro**: `alfonso-frontend-jjtl`
**Tipo**: fix di performance rendering, NON critical zone. Due commit (docs + fix).
**Prerequisito**: gli Stadi 4+5 del de-entanglement e il fix XMI applicati (git am) e pushati; working tree pulito.
**Fonte di verità**: `discovery_2026-07-20_trickle_edge_settle.md` e `discovery_2026-07-19_edge_mancanti_986_1000.md` (Alfonso li fornisce insieme a questo prompt). Leggerli PRIMA di toccare codice.

## Contesto (dal discovery, non riverificare da zero)

Il settle degli edge a scala 1000 dura ~2 min anche su M3 perché il costo per commit React è dominato dagli `EdgeLabelRenderer`: `UnifiedEdge.tsx` (~riga 598) ne monta uno INCONDIZIONATO per ciascun edge renderizzato, e la subscription zustand di @xyflow esegue un querySelector sull'intero DOM a ogni notifica dello store React Flow (misurati 1,55M querySelector, 80% del main thread). Lo stesso meccanismo è la causa della firma 20-22 commit / 6-16 s sulla mutazione singola.

## COSA — Commit 1 (docs)

Salvare i due discovery report forniti in `docs/discovery/` (nomi file invariati) e committare:
`docs: add discovery reports (missing edges root cause, edge settle trickle)`

## COSA — Commit 2 (fix)

1. Leggere `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` per intero (o il componente dove vive l'`EdgeLabelRenderer`, path da verificare con grep: il numero di riga del report è indicativo).
2. Rendere il montaggio dell'`EdgeLabelRenderer` CONDIZIONALE: montarlo solo quando l'edge ha effettivamente una label da renderizzare (testo non vuoto / label spec presente). Un edge senza label non deve pagare la subscription.
3. Comportamento visivo INVARIATO per gli edge con label: stesse posizioni, stesso stile. Zero rename, zero refactoring del resto del componente.
4. Se il discovery indica che la condizione naturale è già calcolabile da props esistenti, usare quelle; NON introdurre nuovo stato.

## Gate e misura

- `npm run typecheck` (baseline locale 33, delta zero) + `npm run build` + test IR 41/41 + suite senza peggioramenti.
- MISURA OBBLIGATORIA: rieseguire il benchmark baseline (procedura di `docs/benchmarks/README.md`, 1 run basta) e riportare in chat il confronto con la baseline M3 del 19/07: mount, edge settle, mutazione singola, commit React per mutazione. Il fix è accettato solo se il settle e/o la mutazione migliorano in modo netto senza regressioni visive.
- Salvare il json risultati in `docs/benchmarks/` con suffisso `_m3_postfix-labels` (può entrare nel commit 2 o in un terzo commit docs).

Commit: `fix(editor-v2): mount EdgeLabelRenderer only for edges with labels`

## Vincoli

- NON toccare: `useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `DynamicHandles.tsx`, `EndpointHandles.tsx`, il sistema COMMIT (le altre leve del discovery: 2, 3, 4 sono task separati e sequenziati DOPO questo).
- Il clamp degli handle (fix edge mancanti) NON va fatto qui: è il prompt successivo, in critical zone, e va sequenziato dopo questo fix (il clamp aumenta del 52% le subscription: farlo prima peggiorerebbe il trickle).
- Aggiornare `docs/claude-code-log.md` a fine task (entry con esito benchmark).
- Hard stop finale: report in chat con hash, gate, numeri del benchmark prima/dopo.
