# Prompt Claude Code — De-entanglement classic: Stadio 0 (import morti) + Stadio 1 (trasloco sharedTypes)

**Data**: 2026-07-19
**Branch di lavoro**: `alfonso-frontend-jjtl`
**Tipo**: refactor chirurgico in due commit separati. Nessuna fase di discovery (il piano deriva dal report già committato `docs/discovery/discovery_2026-07-19_de_entanglement_graph.md`: leggerlo prima di iniziare, è la fonte di verità su righe e consumer).
**QUANDO**: solo a working tree fermo, nessun altro task in corso. Comandi git dalla RADICE del repo, non da `frontend/`.

## Obiettivo

Primi due stadi del piano di de-entanglement del classic editor (delete di `frontend/src/graph/`): rimuovere gli import morti fuori perimetro (Stadio 0) e traslocare `sharedTypes.tsx` in `common/` (Stadio 1). Decisioni già prese in chat di progetto: sede del trasloco = `frontend/src/common/`; nessun altro stadio in questo task (GraphDragManager, displayError, barrel purge: giri successivi).

## COSA — Commit 1 (Stadio 0: import morti)

Rimuovere SOLO le righe di import (e gli eventuali specifier singoli dentro import multipli) elencate qui, verificando prima con grep che i simboli non abbiano usi reali nel file:

1. `frontend/src/redux/store.tsx`: il blocco di import dal perimetro classic (righe ~2-65 e ~68: Vertex, VoidVertex, GraphVertex, EdgePoint, le 19 Shapes, Graph, GraphElement, Edge, Field e relativi dizionari). ATTENZIONE: l'unico "uso" è il blocco commentato ~353-360 (resta com'è, è un commento); le stringhe CSS `[data-nodetype="Vertex"]` (~261-323) sono letterali, NON import: non toccarle.
2. `frontend/src/components/widgets/Widgets.tsx` riga ~10: `VertexOwnProps`, `VertexStateProps` (nessun uso).
3. `frontend/src/redux/reducer/reducer.ts` righe ~20-21: `EdgeOwnProps`, `EdgeStateProps` (nessun uso). NON toccare gli altri import del reducer (contextFixedKeys, GraphElementComponent, GraphDragManager restano: sono vivi o oggetto di stadi successivi).
4. `frontend/src/model/dataStructure/GraphDataElements.tsx`: nel blocco import da `edges/routing/classic` (righe ~65-71) rimuovere SOLO gli specifier `svgLetterSize` e `setLabels` (inutilizzati). Gli altri (computePoints, snapSegmentsToBorders, computeHeadPosition, computeRouting, roundManhattanCorners) sono vivi: restano.

Gate del commit 1: `npm run typecheck` (baseline 33 errori, nessun aumento) + `npm run build` verde. Poi commit:
`refactor: remove dead classic-editor imports (de-entanglement stage 0)`
`git add` dei soli 4 file toccati. Mai `git add .`.

## COSA — Commit 2 (Stadio 1: trasloco sharedTypes)

1. `git mv frontend/src/graph/graphElement/sharedTypes/sharedTypes.tsx frontend/src/common/sharedTypes.tsx`. Contenuto del file INVARIATO: nessun rename di simboli, nessun riordino, solo eventuali aggiustamenti dei path degli import interni al file se relativi.
2. Aggiornare i path di import verso sharedTypes in TUTTI i consumer. Quelli noti dal report: `frontend/src/joiner/index.ts` (righe ~101-102), `frontend/src/redux/reducer/reducer.ts` (riga ~68, import di `contextFixedKeys`), `frontend/src/components/forEndUser/Control.tsx` (riga ~18), `frontend/src/components/forEndUser/Panel.tsx` (riga ~16), più i file INTERNI al perimetro `graph/` che lo importano (aggiornarli finché esistono: verranno cancellati in stadi futuri, ma ora devono compilare).
3. Verifica di completezza OBBLIGATORIA: `grep -rn "graphElement/sharedTypes" frontend/src` deve dare zero hit a fine stadio (commenti esclusi, da valutare a vista).
4. ATTENZIONE (rischio 7 del report): `Control.tsx` e `Panel.tsx` contengono due factory omonime `Control`; aggiornare in entrambi SOLO la riga di import, nessun altro intervento.
5. Se dopo il `git mv` la directory `frontend/src/graph/graphElement/sharedTypes/` resta vuota, rimuoverla.

Gate del commit 2: `npm run typecheck` (33, nessun aumento) + `npm run build` verde. Poi commit:
`refactor: move sharedTypes out of graph/ to common/ (de-entanglement stage 1)`
`git add` dei soli file toccati dal move e dagli aggiornamenti di path.

## Vincoli

- Toccare SOLO i file elencati (più gli import interni a `graph/` per lo Stadio 1). Zero refactoring opportunistico, zero rename di identificatori, zero riordino di import non richiesto.
- NON toccare: `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, la logica del reducer (solo righe di import), `joiner/components.tsx` (è lo Stadio 4).
- Se un simbolo "morto" risulta invece usato (grep con hit reali oltre a quelli attesi dal report), NON rimuoverlo: fermarsi e segnalare la discrepanza in chat.
- Due commit separati, nell'ordine dato. Se il gate del commit 1 fallisce, hard stop: non iniziare lo Stadio 1.
- NON pushare: il push lo decide Alfonso a verifica fatta (in coda c'è anche `d76eac1e0` non pushato).
- Aggiornare `docs/claude-code-log.md` a fine task (una entry per il task, esito per stadio).
- Hard stop finale: report in chat con i due hash, l'esito dei gate e l'output del grep di completezza.

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-19_de_entanglement_graph.md`: censimento consumer (tabella), piano a stadi, rischi. I numeri di riga nel prompt sono indicativi (HEAD è avanzato di qualche commit rispetto all'analisi): fidarsi dei simboli e del grep, non della riga esatta.
- Baseline: typecheck 33 errori, test IR 41/41, build verde su `12f7b32bf`.
- Decisioni di chat recepite: sharedTypes → `common/`; GraphDragManager = move (Stadio 2, NON in questo task); getter routing e DerivedReferenceEdge intoccabili (Stadio 6).
