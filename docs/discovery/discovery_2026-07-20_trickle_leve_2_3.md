# Discovery: leve trickle 2-3 — subscription mirate negli edge e coalescing di updateNodeInternals

Data: 2026-07-20. Worktree `/home/claude/wt-trickle` (branch `wt/trickle`, base `56d7b20`). Fase 1 del cantiere "leve trickle 2-3"; fonte di verità: `docs/discovery/discovery_2026-07-20_edge_settle_trickle.md`. La leva 1 (EdgeLabelRenderer condizionale) è già committata (`de51655`), come il clamp handle-index (`2ddedca`): su questa base `rf_edges` atteso = 1500.

## Obiettivo

Ridurre il conteggio di commit React all'apertura del modello (~1500-1600 a scala 500/1000) e per mutazione (~24) agendo solo render-side:
- Leva 2: eliminare le subscription larghe `useNodes()` nel render path degli edge, sostituendole con subscription mirate ai soli nodi source/target.
- Leva 3: coalizzare le chiamate per-nodo a `updateNodeInternals` di `DynamicHandles` in una sola chiamata batch per finestra double-rAF (raggruppare, MAI saltare: il double-rAF di misura è load-bearing).
- Leva 4 (solo se a rischio zero): sostituire il loop `querySelector` per nodo del guard di distribuzione con una `querySelectorAll` unica.

## File letti (path completi)

- `/home/claude/wt-trickle/frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (integrale)
- `/home/claude/wt-trickle/frontend/src/components/editor-v2/edges/EndpointHandles.tsx` (integrale)
- `/home/claude/wt-trickle/frontend/src/components/editor-v2/hooks/useTreeLayout.ts` (integrale)
- `/home/claude/wt-trickle/frontend/src/components/editor-v2/components/DynamicHandles.tsx` (integrale)
- `/home/claude/wt-trickle/frontend/src/components/editor-v2/EditorV2.tsx` (righe 1040-1210 guard di distribuzione; 1630-1670 e 1740-1760 one-shot di creazione edge; 3434-3560 handleNodesChange)
- `/home/claude/wt-trickle/frontend/src/components/editor-v2/utils/edgeUtils.ts` (getNodeRect :461-470)
- `/home/claude/wt-trickle/frontend/node_modules/@xyflow/react/dist/esm/index.d.ts` (verifica export `useInternalNode`)
- `/home/claude/wt-trickle/CLAUDE.md`, ultime entry di `docs/claude-code-log.md`

## Call site esatti di useNodes nel render path degli edge

Il report della leva madre attribuiva l'aggravante "986 re-render per notifica" a `EndpointHandles.tsx:67`. La lettura integrale corregge l'attribuzione:

1. `UnifiedEdge.tsx:120` — `const allNodes = useNodes();` in OGNI edge renderizzato (1500 a scala bench). È QUESTA la subscription che ri-renderizza tutti gli edge a ogni cambio di internals/measure/position di qualsiasi nodo. Consumer interni:
   - `bundleCenter` (:162-172): servono SOLO i nodi source e target;
   - `activeNodeIds` (:198): servono solo gli ID (membership) per scoping del crossing detection;
   - `selfLoopGeom` (:214): serve solo il nodo source.
2. `useTreeLayout.ts:59` — `useNodes()` dentro il hook chiamato incondizionatamente da ogni UnifiedEdge (:128-141). I consumer (`treeGeometry` :103, `activeNodeIds` :183, `barBranchesPathFinal` dep :217) sono tutti gated su `isGrouped`, cioè attivi solo per inheritance raggruppate; per gli edge non-inheritance la subscription è punto morto ma paga il re-render.
3. `EndpointHandles.tsx:67` — `useNodes()` in `DraggableEndpoint`, ma il componente monta SOLO con edge selezionato (`if (!selected) return null;` a :33). Contributo al trickle di open ≈ 0; resta la lettura una-tantum a inizio drag (`allNodes.find` :83) sostituibile con lookup imperativo.

`useNodes` residui fuori dal render path per-edge (NON toccati): `InlineTypeSelect.tsx:21`, `useAutoAnchor.ts:697` (hook top-level, una istanza), `ManhattanEdge-toDelete.tsx:182` (morto).

## Punti di chiamata di updateNodeInternals

1. `DynamicHandles.tsx:184-203` — per-nodo: effect su `activeHandlesKey` → double-rAF → `querySelector` del proprio nodo → `state.updateNodeInternals(Map di 1)`. Con un commit di applyDistribution che cambia gli handle di N nodi, N istanze schedulano N double-rAF nello stesso frame → N notifiche zustand separate. TARGET della leva 3.
2. `EditorV2.tsx:1154-1185` — guard di distribuzione: già batch (una Map con tutti i nodi coinvolti), double-rAF + safety setTimeout(100), con cancel (`pendingMeasureCleanupRef`). NON toccato dalla leva 3 (semantica di cancel propria); solo candidate leva 4 il loop `querySelector` per nodo a :1161.
3. `EditorV2.tsx:1649-1660` e :1745-1756 — one-shot alla creazione edge (2 nodi). Lasciati invariati.

## Piano

### Leva 2 — commit `perf(editor-v2): targeted node subscriptions in edge render path`

- `UnifiedEdge.tsx`: rimuovere `useNodes`; `const sourceNode = useInternalNode(source)` e `targetNode = useInternalNode(target)` (export verificato in @xyflow/react 12.10; subscription per-nodo). `bundleCenter` e `selfLoopGeom` passano a sourceNode/targetNode (`getNodeRect` preferisce già `internals.positionAbsolute`, :463). `activeNodeIds` diventa lettura imperativa `getNodes()` (da `useReactFlow`, già in uso) DENTRO la memo dei crossings, che resta reattiva su `[id, spreadPoints, allEdges]`.
- `useTreeLayout.ts`: sostituire `useNodes()` con `useStore(selector, shallow)` dove il selector ritorna `s.nodes` solo se `isInheritance`, altrimenti una costante modulo `EMPTY_NODES` → zero re-render per gli edge non-inheritance, comportamento identico per le inheritance.
- `EndpointHandles.tsx`: rimuovere `useNodes`; lookup imperativo `getNode(nodeId)` da `useReactFlow` a inizio drag (stessa shape di nodo user-level di prima).
- `useEdges()` NON viene toccato (in UnifiedEdge, useTreeLayout, DynamicHandles): è il canale che mantiene freschi crossings/gruppi al cambiare degli edge; rimuoverlo è fuori scope e rischioso.

### Leva 3 — commit `perf(editor-v2): coalesce DynamicHandles updateNodeInternals`

- Coalescer a livello di modulo in `DynamicHandles.tsx`: `Map<storeApi, Set<nodeId>>` di batch aperti + `scheduleNodeInternalsUpdate(storeApi, nodeId)` (grep collisione: 0 hit). Il primo scheduling apre il batch e registra UN double-rAF; gli scheduling successivi nello stesso frame si accodano al batch. Il batch si CHIUDE quando il primo rAF scatta (pre-paint): gli scheduling arrivati dopo aprono un batch nuovo, così ogni nodo conserva la garanzia "misura dopo il paint del proprio commit" (stessa semantica double-rAF, load-bearing). Flush: una `querySelectorAll('.react-flow__node')` + mappa data-id→elemento, una sola `state.updateNodeInternals(Map di N)`.
- Keyed per storeApi: istanze multiple di flow (tab) non si mescolano.
- Il dedup `lastCommittedKeyRef` per istanza resta invariato.
- Nessun cancel su unmount: nemmeno l'originale cancellava; un nodo smontato non è più nel DOM e la mappa lo salta (comportamento identico).

### Leva 4 — solo se a rischio zero, commit `perf(editor-v2): single querySelectorAll in distribution guard`

- `EditorV2.tsx:1154-1168` (`measureAndUpdate`): una `querySelectorAll('.react-flow__node')` + mappa, poi lookup per id. Trasformazione puramente locale, data-id univoci, nessun cambio di timing.

## Rischi

1. Crossing/bridge-arc liveness (leva 2): oggi un edge NON collegato al nodo trascinato ricalcola i bridge arc anche DURANTE il drag (via useNodes). Con la subscription mirata il ricalcolo avviene al drag-end: `handleNodesChange` (EditorV2:3496) fa `setEdges` su hasDragEnd → nuovo array → `useEdges` sveglia tutti gli edge → crossings ricalcolati con `getNodes()` fresco. Delta accettato: bridge arc di edge terzi possono restare stantii durante il gesto di drag, mai dopo. Da smoke-testare visivamente (non verificabile in questa sessione → Regressions unknown).
2. `useInternalNode` re-render quando cambiano gli internals del proprio nodo, inclusi i cicli di misura: gli edge collegati al nodo rimisurato si aggiornano come oggi; gli altri no (è l'obiettivo).
3. Leva 3 — finestre di batch: la chiusura del batch al primo rAF preserva l'invariante "CSS del commit dipinto prima della misura". Un batch che unisce nodi di commit diversi avvenuti nello stesso frame è sicuro: tutti quei commit sono nel DOM prima del paint che il secondo rAF attende.
4. Leva 3 — una notifica unica con Map di N nodi al posto di N notifiche: i subscriber vedono un solo aggiornamento aggregato; è il comportamento che RF stesso ha nel guard di EditorV2 (:1159-1167), già esercitato.
5. `rf_edges` deve restare 1500 e il settle non deve peggiorare: verifica a benchmark after; se degrada, revert della singola leva.
6. Critical zone: nessuno dei file toccati è in §3.1; DynamicHandles è parte della pipeline handle §3.10 → coordinamento in LETTURA con handlePosition/portDistribution già fatto (nessuna modifica a ordering/position, solo al momento della notifica di misura).

## Domande aperte per Alfonso

1. Il delta di liveness dei bridge arc durante il drag (rischio 1) è accettabile o va reintrodotta una reattività throttled? (Proposta: accettare; costo di reattività live = la causa stessa del trickle.)
2. `useEdges()` per-edge resta il prossimo candidato (commits_edit_flow): leva futura separata, fuori scope qui.
3. `ManhattanEdge-toDelete.tsx` è morto e fuori scope: rimozione in un cleanup dedicato?

## Addendum post-implementazione (stessa sessione): esiti benchmark e revert della leva 3

Tutti i run sul medesimo container cloud, build di produzione, harness canonico `bench_baseline.mjs`, scala 500/1000, `rf_edges = 1500` in OGNI run (il vincolo del clamp regge sempre).

| Albero | t_edges_settle_ms | commits_open_flow | t_responsive_after_open_ms | edit_flow.ms / commits |
|---|---|---|---|---|
| base `56d7b20` (run 1 / run 2) | 126633 / 125709 | 1506 / 1507 | 167177 / 157631 | 31704/22 · 19281/22 |
| leva 2 sola `76a80d6` (bisect, 1 run) | 58200 | 594 | 104385 | 17121/23 |
| leve 2+3+4 `35f93c5` (run 1 / run 2) | 337277 / 328055 | 1081 / 1081 | 368521 / — | 15502/21 · 13438/19 |
| FINALE 2+4 `f3d1969` (run 1 / run 2) | 115527 / 88341 | 1508 / 1490 | 148950 / 146168 | 14970/18 · 15483/20 |

Esiti:
1. **Leva 3 REVERTITA** (`f3d1969` reverte `4964ba2`): con il coalescing l'open flow peggiora di ~2.6x rispetto alla base in modo deterministico (337.3/328.1 s, commits 1081 identici su 2 run), mentre la leva 2 da sola lo dimezza. Il numero di iterazioni scende meno di quanto cresca il costo per iterazione: il batch trasforma ogni passata in una misura multi-nodo (N×16 getBoundingClientRect) più un unico commit gigante di dimension change. Criterio del mandato ("se il settle peggiora oltre il rumore: revert") applicato.
2. **Leve 2 e 4 tenute**: settle 126.6/125.7 → 115.5/88.3 s, responsive_after_open 167.2/157.6 → 149.0/146.2 s, edit 31.7/19.3 → 15.0/15.5 s.
3. **Bimodalità del ciclo di convergenza sugli alberi con leva 2**: commits_open_flow 594 (run bisect) vs ~1500 (run finali) a parità di codice (la differenza leva 4 non può cambiare il conteggio). La traiettoria del settle (coda post-ELK) si innesca o no a seconda dello slittamento dei timer; sul run "fortunato" il settle è 58.2 s. La riduzione NETTA e stabile è sul costo, non (ancora) sul numero di iterazioni: il cadenzatore per-nodo double-rAF di DynamicHandles resta il motore delle ~1500 iterazioni ed è il target corretto di una futura leva 3 riprogettata (es. flush unico ma con commit di dimension change spezzati, o updateNodeInternals nativo di RF senza force).
4. Run "prima/dopo" committati: `docs/benchmarks/2026-07-20_cloud_trickle_before.json` (= base run 1) e `_after.json` (= finale run 2); gli altri run sono riportati solo in questa tabella.
