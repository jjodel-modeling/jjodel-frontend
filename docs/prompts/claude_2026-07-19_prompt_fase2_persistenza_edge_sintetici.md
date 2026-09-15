# Prompt Claude Code — Fase 2: persistenza su DVertex di layout edge sintetici e collasso

**Data**: 2026-07-19
**Branch di lavoro**: `alfonso-frontend-jjtl`
**Tipo**: implementazione scoped. Fase 1 completata: `docs/discovery/discovery_2026-07-19_persistenza_edge_sintetici.md` (rileggerla per intero prima di iniziare: contiene shape, write path, piano di idratazione e LIR). Il LIR è stato analizzato e approvato in chat; questo prompt È il go-ahead, con la lista file di §7 del report confermata (regola 19 soddisfatta).

## Decisioni ratificate da Alfonso (2026-07-19)

- **D1**: questa fase copre SOLO edge sintetici (object-as-edge) + collasso. La persistenza degli edge reali (reference/inheritance, carrier DVoidEdge) è una fase futura separata.
- **D2**: undo = "nessuna regressione, nessuna corruzione". I gesti sintetici restano non-undoabili come oggi; la persistenza eredita la semantica delle posizioni. NON estendere useHistory.
- **D3**: `persistWaypoints: false` ha lettura ESTESA: esclude dalla persistenza l'intero layout override dell'edge (waypoints E pin di lato). Emendamento spec incluso sotto.
- **D4**: nomi campo `irEdgeLayout` e `irCollapsed` (grep di collisione già eseguito in discovery: liberi).

## COSA

1. **Campi su DVertex** (`GraphDataElements.tsx`, accanto a `ghostOffsets`, tipi letterali inline, shape verbatim dal report §4):

```typescript
// Persisted IR object-as-edge layout overrides (side pins + Manhattan waypoints),
// carried by the hidden edge-object's vertex. undefined = fully derived routing.
irEdgeLayout?: {
    sourceSide?: 'top' | 'right' | 'bottom' | 'left';
    targetSide?: 'top' | 'right' | 'bottom' | 'left';
    waypoints?: { segmentIndex: number; offset: number }[];
};
// Persisted collapse state of an IR graphVertex container. undefined = expanded.
irCollapsed?: boolean;
```

2. **Write path** (`canvasToJjom.ts`): due funzioni foglia nuove, famiglia `syncPositionToJjom`, come da report §4: `syncIREdgeLayoutToJjom(vertexId, layout)` e `syncIRCollapsedToJjom(vertexId, collapsed)`, TRANSACTION + `SetFieldAction.new(..., false)`. NESSUNA modifica alle funzioni esistenti né a `reconcileJjomAfterUndoRedo`.
   - **Anti-bounce**: partire SENZA `markCanvasUpdated` (come il precedente `ghostOffsets`); lo smoke test dedicato (sotto) verifica l'assenza di bounce; aggiungerlo SOLO se il bounce si osserva, annotandolo nel log.
3. **Write-through nei 4 punti di scrittura sessione** (ramo `irobj_` di `handleEdgeChange`, ramo sintetico di `handleReconnect`, toggle collasso in ObjectNode e IRContainmentHulls): prima il singleton (reattività invariata), poi la funzione canvasToJjom, poi `scheduleLayoutSave()`. Dal `sourceHandle`/`targetHandle` espliciti del reconnect si persiste il LATO derivato (`handle.split('-')[0]`), mai l'handle id (indice sessione-relativo). Scrittura dell'oggetto `irEdgeLayout` intero per gesto, merge col valore precedente a carico del chiamante.
4. **Idratazione** come da report §5: API di seed nei due moduli di stato (`irEdgeInteraction.ts`, `irCollapseState.ts`), hook di seed una-tantum per graph (guard `Set<graphId>` a livello di modulo), lettura da `idlookup`, mappatura `vertex.model` → objectId, **seed solo se la chiave non è già presente** (sessione vince), nessun re-seed su switch viewpoint. Nessun nuovo selettore Redux caldo: i singleton restano l'unica fonte runtime.
5. **Gate `persistWaypoints`**: aggiungere il flag a `CompiledEdgeView` (`irTypes.ts`) compilandolo in `compileEdgeView` (`irCompile.ts`) da `ir.edge.persistWaypoints ?? true`. Semantica estesa (D3): a `false`, per gli oggetti la cui view risolta lo dichiara, niente write-through D e niente idratazione di `irEdgeLayout` (gli override restano di sessione). Il collasso NON è governato dal flag (riguarda i graphVertex, non gli edge).
6. **Emendamento spec**: in `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`, sez. 7, dopo il bullet sui waypoints, aggiungere verbatim:

   > **Perimetro di `persistWaypoints` (chiarimento, emendamento 2026-07-19)**: il flag governa l'intero layout override dell'edge, waypoints e pin di lato degli endpoint. `persistWaypoints: false` significa routing sempre derivato: nessun override di layout viene persistito per le view che lo dichiarano; gli override restano al più stato di sessione.

7. **Unit test** (`viewpoint/ir/__tests__/ir.test.ts`): compilazione del flag (default true, opt-out); se la logica di merge seed/sessione viene estratta in funzione pura (consigliato), test di precedenza (persistito come base, sessione sopra, seed-solo-se-assente). Test esistenti (35) intatti.

## File autorizzati (lista chiusa, dal report §7)

1. `frontend/src/model/dataStructure/GraphDataElements.tsx`
2. `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (critical zone: solo le 2 funzioni foglia nuove)
3. `frontend/src/components/editor-v2/viewpoint/ir/irEdgeInteraction.ts`
4. `frontend/src/components/editor-v2/viewpoint/ir/irCollapseState.ts`
5. `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
6. `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
7. `frontend/src/components/editor-v2/EditorV2.tsx`
8. `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`
9. `frontend/src/components/editor-v2/viewpoint/ir/IRContainmentHulls.tsx`
10. `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (test)
11. `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (emendamento §6 sopra)

Qualsiasi file fuori lista: fermarsi e chiedere.

## COME

- Diff minimale, zero refactoring opportunistico, mai rinominare identificatori esistenti.
- Grep di collisione per ogni identificatore nuovo (nomi funzioni di seed, hook, funzioni canvasToJjom).
- TRANSACTION solo nei gesture handler (zona lecita §3.3); NESSUN wrap di `DVertex.new`/`DVoidEdge.new2`; non toccare `useJjomSync.ts`, `portDistribution.ts`, `syncState`, `useM1ReferenceEdges`.
- Con campi `undefined` il comportamento deve essere bit-identico all'attuale.
- Verifica: `npm run build` verde; `npx tsc --noEmit` = 33 errori baseline (0 nei file toccati); `npx vitest run` modulo IR tutto verde.
- Un solo commit: `feat: persist synthetic-edge layout and container collapse on DVertex`. `git add` dei soli file in lista, mai `git add .`.
- Aggiornare `docs/claude-code-log.md` a fine task (entry con eventuale nota anti-bounce).

## Smoke test (a carico di Alfonso dopo il task, dal LIR §6)

1. Drag segmento su edge sintetico → refresh → waypoint identico.
2. Pin endpoint su lato → refresh → stesso lato; reconnect su altro nodo → slot riscritto e lato persistito.
3. Collasso contenitore → refresh → ancora collassato; expand → refresh → espanso.
4. View con `persistWaypoints: false` → gesto → refresh → routing derivato.
5. Viewpoint che rende l'oggetto come nodo: nessun crash, campi inerti.
6. Progetto pre-esistente senza campi: comportamento identico a prima.
7. Anti-bounce: durante e dopo i gesti, nessun "salto" dei nodi o ri-trasformazione visibile.
8. Undo dopo gesto: comportamento invariato (non revoca), nessuna corruzione.

## RIFERIMENTI

- Discovery + LIR: `docs/discovery/discovery_2026-07-19_persistenza_edge_sintetici.md` (fonte di verità per shape e piano; in caso di divergenza tra questo prompt e il report, segnalare prima di procedere).
- Precedente: campi `ghostOffsets`/`ghostParentOffsets` su DVertex (ClassNode.tsx:98, jjomTransformers.ts:111).
- Spec IR v1.2 sez. 7-8.
- CLAUDE.md resta la fonte di verità: in caso di conflitto, segnalare e fermarsi.
