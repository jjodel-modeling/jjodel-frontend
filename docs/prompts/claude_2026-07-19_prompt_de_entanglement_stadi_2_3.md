# Prompt Claude Code — De-entanglement classic: Stadio 2 (move GraphDragHandler) + Stadio 3 (sgancio displayError e component registry)

**Data**: 2026-07-19
**Branch di lavoro**: `alfonso-frontend-jjtl`
**Tipo**: refactor chirurgico in tre commit (due stadi + un commit docs finale). Nessuna fase di discovery: la fonte di verità è `docs/discovery/discovery_2026-07-19_de_entanglement_graph.md` (leggerlo prima di iniziare) più gli esiti degli Stadi 0-1 (commit `c79cd34c2`, `cd5dba40e`).
**QUANDO**: nessun altro task in corso. Comandi git dalla RADICE del repo.
**Stato atteso del working tree**: `docs/claude-code-log.md` MODIFICATO e non committato (entry Stadi 0+1 del giro precedente). È voluto: NON revertarlo, verrà committato alla fine di questo task. Nessun altro file deve risultare modificato alla partenza.

## Obiettivo

Stadi 2 e 3 del piano di de-entanglement: spostare `GraphDragHandler.ts` fuori dal perimetro `graph/` e sganciare dal perimetro le due dipendenze runtime vive residue (`displayError` nel fallback del reducer, la static `map` di GraphElementComponent usata da classes.ts e GraphDataElements). Decisioni già prese in chat: GraphDragManager si SPOSTA (non si cancella); sede `frontend/src/redux/`.

## COSA — Commit 1 (Stadio 2: move GraphDragHandler)

1. `git mv frontend/src/graph/graphElement/GraphDragHandler.ts frontend/src/redux/GraphDragHandler.ts`. Contenuto INVARIATO: nessun rename della classe `GraphDragManager`, nessuna modifica alla logica, solo eventuali path relativi interni al file.
2. Aggiornare i path di import in tutti i consumer. Noti dal report: `frontend/src/joiner/index.ts` (riga ~205, re-export) e gli eventuali file interni al perimetro `graph/` che lo importano (aggiornarli finché esistono). Il reducer (`reducer.ts` ~riga 14) importa via joiner: se è così, non va toccato; verificare con grep.
3. Verifica di completezza: `grep -rn "graphElement/GraphDragHandler" frontend/src` → zero hit (commenti esclusi, valutare a vista).

Gate: `npm run typecheck` (baseline 33, nessun aumento) + `npm run build` verde. Commit:
`refactor: move GraphDragHandler out of graph/ to redux/ (de-entanglement stage 2)`
`git add` dei soli file toccati. Mai `git add .`. NON includere `docs/claude-code-log.md` in questo commit.

## COSA — Commit 2 (Stadio 3: displayError + component registry)

Due estrazioni, comportamento identico, zero rename di simboli esistenti.

**3a — displayError.**
1. Creare un modulo autonomo (proposta: `frontend/src/common/jsxErrorView.tsx`) che contenga la funzione oggi implementata come static `GraphElementComponent.displayError`. PRIMA di creare il file: `grep -rn "jsxErrorView" frontend/src` per verificare che il nome non collida; se collide, scegliere un nome vicino e annotarlo nel report finale.
2. Aggiornare i consumer esterni: `frontend/src/redux/reducer/reducer.ts` (~righe 1019 e 1081, il fallback `tv.JSXFunction`) e `frontend/src/common/UX.tsx` (~riga 442, catch di parseAndInject) perché importino dal nuovo modulo.
3. In `graphElement.tsx` la static può restare come delega al nuovo modulo (una riga) oppure essere lasciata intatta se non condivide codice: scegliere la via con la diff minore, senza duplicare la logica (la copia master è il nuovo modulo).

**3b — component registry.**
1. Estrarre la static `map` di GraphElementComponent in un modulo registry autonomo (proposta: `frontend/src/common/graphComponentRegistry.ts`; stessa verifica anti-collisione via grep sul nome). Semantica IDENTICA all'attuale (stessa struttura dizionario, stesse chiavi).
2. `graphElement.tsx` continua a popolare/svuotare il registry dove oggi scrive sulla static map (finché esiste, sarà cancellato allo Stadio 5).
3. Aggiornare i lettori esterni: `frontend/src/joiner/classes.ts` (~righe 4191, 4195: `GraphElementComponent.map[nid]?.forceUpdate()`) e `frontend/src/model/dataStructure/GraphDataElements.tsx` (~righe 473 e 2624: lookup). Mantenere l'optional chaining: con classic smontato la map è vuota e i chiamanti devono restare no-op sicuri.
4. In `GraphDataElements.tsx` ~riga 183 sostituire l'annotazione di tipo `component!: GraphElementComponent` con `GObject` (come da report). SOLO l'annotazione, nessun cambio di runtime.
5. A fine stadio: `grep -rn "GraphElementComponent" frontend/src` fuori da `graph/` deve restituire solo l'import/riferimento residuo in `reducer.ts` riga ~22 se non più necessario (in tal caso rimuoverlo), i commenti, e `debugtools/debug.tsx` (che NON va toccato: è lo Stadio 5). Riportare l'output nel report finale.

Gate: `npm run typecheck` (33, nessun aumento) + `npm run build` verde + test IR (41/41 attesi). Commit:
`refactor: extract displayError and component registry from classic perimeter (de-entanglement stage 3)`
`git add` dei soli file toccati.

## COSA — Commit 3 (docs)

Aggiungere a `docs/claude-code-log.md` l'entry di questo task (Stadi 2+3) e committare il file, che contiene anche l'entry pendente degli Stadi 0+1:
`docs: update claude-code-log (de-entanglement stages 0-3)`

## Vincoli

- Toccare SOLO i file indicati. Zero refactoring opportunistico, zero rename di identificatori esistenti, zero riordino di import.
- NON toccare: `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `joiner/components.tsx` (Stadio 4), `debugtools/debug.tsx` (Stadio 5), la logica del reducer oltre alle righe indicate.
- I numeri di riga sono indicativi (HEAD avanzato rispetto all'analisi del report): fidarsi di simboli e grep.
- Se un'assunzione del report non regge (es. un consumer non censito di displayError o della map), hard stop e segnalazione in chat, senza improvvisare.
- Ordine tassativo: se il gate del commit 1 fallisce, non iniziare lo Stadio 3.
- NON pushare (in coda: `d76eac1e0`, `c79cd34c2`, `cd5dba40e`; decide Alfonso).
- Hard stop finale: report in chat con i tre hash, esiti dei gate, output dei grep di completezza, eventuali nomi alternativi scelti per i nuovi moduli.

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-19_de_entanglement_graph.md`: sezioni "Censimento consumer" (righe classes.ts, GraphDataElements, UX, reducer), "Piano a stadi" (Stadi 2-3), "Rischi" (3: superficie RuntimeAccessible; 6: debugtools).
- Baseline: typecheck 33, test IR 41/41, build verde su `cd5dba40e`.
- Decisioni di chat recepite: move (non delete) di GraphDragManager in `redux/`; displayError e registry estratti in `common/`; smoke funzionale del fallback displayError a carico di Alfonso dopo il task (il path si esercita con una vista dal jsxString invalido).
