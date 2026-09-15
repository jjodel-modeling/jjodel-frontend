# Prompt Claude Code — Discovery: persistenza su DVertex di waypoints, anchor e collasso (edge sintetici e graphVertex)

**Data**: 2026-07-19
**Branch di lavoro**: `alfonso-frontend-jjtl` (post-merge: contiene tutto il lavoro IR validato il 2026-07-18).
**Tipo**: FASE 1, discovery read-only con HARD STOP obbligatorio e LAYER IMPACT REPORT. Nessuna modifica al codice in questa fase. Critical zone coinvolta a valle: `canvasToJjom`.

## Contesto e decisione

Oggi tre cose vivono solo come stato di sessione e si perdono al refresh: i waypoints degli edge sintetici (SegmentHandles), i pin di lato degli endpoint (EndpointHandles), lo stato di collasso dei contenitori graphVertex (lift-to-ancestor). Introdotti/collaudati nei commit `f5c51f130`, `9b404d280`, `dabeac79a` (override di sessione via `onEdgeDataChange`, non via reconnect RF) e nella Fase 2b (collasso come decorazione pura).

**Decisione di Alfonso (2026-07-19)**: persistenza su **campi opzionali additivi del DVertex** dell'oggetto portante:
- edge sintetico (object-as-edge): waypoints e anchor override sul DVertex del **nodo nascosto** dell'oggetto (identità stabile; se un altro viewpoint rende l'oggetto come nodo, i campi restano inutilizzati ma non orfani);
- collasso: campo booleano opzionale sul DVertex del **contenitore**.

Semantica: layout condiviso tra viewpoint (stessa semantica delle posizioni dei nodi). Niente entità diagram-state nuove. Campi opzionali = nessun VersionFixer (undefined = comportamento attuale). Rispetto di `persistWaypoints: false` (spec v1.2 sez. 7: opt-out per view). Scrittura SOLO via write path canonico (canvasToJjom / azioni esistenti), a fine gesto (come le posizioni), mai per-frame. Undo/redo deve funzionare.

## COSA (solo discovery)

1. **Mappare lo stato di sessione attuale**: dove vivono oggi gli override (struttura dati esatta di waypoints, pin di lato source/target, collasso), chi li scrive (EndpointHandles/SegmentHandles → onEdgeDataChange; toggle di collasso), chi li legge (sintesi edge, decorazione collasso), e il loro ciclo di vita (cosa li azzera).
2. **Mappare DVertex e il write path**: campi esistenti del DVertex, come canvasToJjom scrive oggi posizione/size (azione usata, batching/TRANSACTION, timing drag-end), come i campi nuovi viaggerebbero nella serializzazione generica, e come il D-layer espone i campi al proxy L.
3. **Progettare i campi** (proposta, non implementazione): nomi, tipi e shape derivati dalle strutture di sessione reali (es. `collapsed?: boolean`; anchor per endpoint; array di punti per i waypoints). Verificare con grep globale che i nomi proposti non collidano. Verificare se DEdge esiste ancora come carrier alternativo nel flow post-5a o se DVertex è l'unico substrato sensato (la spec sez. 7 cita "DEdge/DVertex esistente": accertare cosa esiste davvero dopo lo spegnimento del classic).
4. **Progettare l'idratazione**: dove leggere i campi al mount/attivazione viewpoint per ricostruire gli override di sessione (signature hook, sintesi edge), e la precedenza sessione-vs-persistito durante il gesto.
5. **LAYER IMPACT REPORT obbligatorio** (critical zone): layers toccati (D-layer DVertex, canvasToJjom, hook IR), cosa cambia e cosa NON cambia, interazioni cross-layer (serializzazione, undo/redo, TRANSACTION), side-effect safety, scenari di smoke-test per la Fase 2.
6. **Stima del perimetro di Fase 2**: file da toccare, test da aggiungere, rischi residui, eventuali domande aperte per Alfonso.

## DOVE

- Override di sessione: i file toccati da `f5c51f130`, `9b404d280`, `dabeac79a` (`git show --stat` di ciascuno) + il modulo `editor-v2/viewpoint/ir/` (sintesi edge, collasso 2b).
- Write path: `canvasToJjom` e le azioni con cui EditorV2 scrive oggi posizioni/size dei vertici.
- D-layer: definizione di DVertex (GraphDataElements.tsx) e serializzazione.
- Spec: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` sez. 7 (persistWaypoints, gap #6) e sez. 8 (collasso).
- Leggere per intero i file rilevanti prima di trarre conclusioni.

## Vincoli

- **Read-only**: nessuna modifica a codice o spec in questa fase.
- **OBBLIGATORIO**: salvare il discovery report in `docs/discovery/` con nome `discovery_2026-07-19_persistenza_edge_sintetici.md` (obiettivo, file letti con path completi, findings, proposta campi, idratazione, LIR completo, perimetro Fase 2, domande aperte).
- **HARD STOP a report scritto**: nessuna Fase 2 in questa sessione, in nessun caso (critical zone: serve il go-ahead esplicito di Alfonso dopo l'analisi in chat).
- Aggiornare `docs/claude-code-log.md` con l'entry della discovery.
- Baseline typecheck di riferimento: 33 errori (la cifra "14" in documenti più vecchi è stale).

## RIFERIMENTI

- Sessione 2026-07-18 (addendum 1-4 nel KB di progetto): fix edge sintetici, delega default, merge.
- Spec IR v1.2 sez. 7-8; gap #6 del report EditorV2.
- CLAUDE.md resta la fonte di verità: in caso di conflitto, segnalare e fermarsi.
