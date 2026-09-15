# Discovery: consumer di nodeHandles

**Data**: 2026-05-20
**Branch**: alfonso-frontend-jjtl
**Contesto**: preparazione fix per bucketing role-aware in `computePortDistribution`.
Necessario capire come `nodeHandles` viene consumato per scegliere se appendere
o sostituire nella STEP 4 quando 2 bucket (`:source` + `:target`) condividono
lo stesso `(nodeId, side)`.

---

## Q1 — Consumer di nodeHandles

`computePortDistribution` ritorna `{ edgeHandles, nodeHandles }` da `portDistribution.ts:226`.
Le occorrenze di `nodeHandles` nel codebase sono **tutte interne** a `portDistribution.ts`:

```
src/components/editor-v2/utils/portDistribution.ts:59  — JSDoc del return type
src/components/editor-v2/utils/portDistribution.ts:67  — campo del return signature
src/components/editor-v2/utils/portDistribution.ts:190 — allocazione del Map
src/components/editor-v2/utils/portDistribution.ts:199 — init per ogni nodeId
src/components/editor-v2/utils/portDistribution.ts:211 — read-back per assegnare ports
src/components/editor-v2/utils/portDistribution.ts:226 — return
```

I due call site di `computePortDistribution`:

- `src/components/editor-v2/EditorV2.tsx:775` — `const { edgeHandles } = computePortDistribution(edgeList, nodeIds, positions);` — destruttura **solo** `edgeHandles`, ignora `nodeHandles`.
- `src/components/editor-v2/utils/edgeUtils.ts:905` — `const { edgeHandles } = computePortDistribution(edges, Array.from(nodeIdSet), nodePositions);` — wrapper `computeDistributedHandles`, anche qui solo `edgeHandles`.

Il wrapper `computeDistributedHandles` (definito a `edgeUtils.ts:896`) è **esportato** ma non risulta importato da nessun altro file (`grep -rn "computeDistributedHandles" src/` ritorna solo la definizione).

`DynamicHandles.tsx:3` importa **solo** `MAX_HANDLES_PER_SIDE` e `Side` da `portDistribution.ts`. **Non** importa `computePortDistribution`, **non** importa `PortInfo`, **non** importa `nodeHandles`.

Risultato Q1: `nodeHandles` è computato dentro `computePortDistribution` ma **non viene letto da nessun consumer**. È output morto.

---

## Q2 — Rendering di PortInfo

`DynamicHandles` non riceve né itera su `PortInfo[]`. Deriva la posizione dei handle indipendentemente, leggendo `useEdges()` e scansionando `sourceHandle` / `targetHandle` delle edges che toccano `nodeId`.

`DynamicHandles.tsx:58-86` costruisce `activeHandles: Map<handleId, position>`:

```tsx
const activeHandles = useMemo(() => {
    const active = new Map<string, number>();
    const sidePorts = new Map<string, Set<string>>();

    for (const edge of edges) {
        if (edge.source === nodeId && edge.sourceHandle) {
            const side = edge.sourceHandle.split('-')[0];
            if (!sidePorts.has(side)) sidePorts.set(side, new Set());
            sidePorts.get(side)!.add(edge.sourceHandle);
        }
        if (edge.target === nodeId && edge.targetHandle) {
            const side = edge.targetHandle.split('-')[0];
            if (!sidePorts.has(side)) sidePorts.set(side, new Set());
            sidePorts.get(side)!.add(edge.targetHandle);
        }
    }

    for (const [, handleIds] of sidePorts) {
        const sorted = Array.from(handleIds).sort();
        const count = sorted.length;
        sorted.forEach((handleId, index) => {
            const position = count === 1 ? 0.5 : (index + 1) / (count + 1);
            active.set(handleId, position);
        });
    }

    return active;
}, [edgeTopologyKey, nodeId]);
```

Il render (`DynamicHandles.tsx:199-291`) itera su 4 sides × `MAX_HANDLES_PER_SIDE` indici fissi, NON su `PortInfo[]`:

```tsx
{SIDES.flatMap(side => {
    ...
    for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++) {
        const handleId = `${side}-${index}`;
        const activePosition = activeHandles.get(handleId);
        const isActive = activePosition !== undefined;
        ...
        handles.push(
            <React.Fragment key={handleId}>
                <Handle type="target" position={SIDE_TO_POSITION[side]} id={handleId} ... />
                <Handle type="source" position={SIDE_TO_POSITION[side]} id={handleId} ... />
            </React.Fragment>
        );
    }
    return handles;
})}
```

Per ogni `(side, index)` rende **2 elementi DOM**: un `<Handle type="target">` (riga 270) + un `<Handle type="source">` (riga 278), entrambi con lo stesso `id={handleId}`. L'`handleId` (`${side}-${index}`) è usato come `id` prop del React Flow `Handle`.

Nota commento `DynamicHandles.tsx:55-57`:

> "Reads sourceHandle/targetHandle from edges (assigned by applyDistribution). No computePortDistribution call needed — avoids node position dependency which was causing updateNodeInternals → dimension changes → re-render loops."

Conferma esplicita che il consumer **non** chiama `computePortDistribution`.

---

## Q3 — Tolleranza ai duplicate handleId

Non applicabile al consumer attuale: `DynamicHandles` non legge `PortInfo[]`, quindi un eventuale duplicato in `nodeHandles[side]` non lo raggiungerebbe.

Le strutture interne usate per il rendering deduplicano per costruzione:
- `activeHandles: Map<string, number>` (`DynamicHandles.tsx:59`) — `Map.set` collassa stesso `handleId` su un solo entry.
- `sidePorts: Map<string, Set<string>>` (`DynamicHandles.tsx:60`) — `Set<string>` deduplica gli `handleId` per side.
- `handleRoles: Map<string, Set<'source' | 'target'>>` (`DynamicHandles.tsx:91`) — `Set` permette a uno stesso `handleId` di avere entrambi i ruoli, ma senza creare entries duplicate.

Le React keys sono `key={handleId}` (`DynamicHandles.tsx:269`) dentro un loop `for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++)` con `handleId = ${side}-${index}` — unici per costruzione, indipendenti da `nodeHandles`.

Risultato Q3: **No** — il consumer attuale dedupica già (ma per ragioni indipendenti, dato che non legge `nodeHandles`). La domanda è effettivamente vacua finché `nodeHandles` resta output morto.

---

## Q4 — Ghost handles

I "ghost handles" non sono un costrutto separato: sono la modalità di styling degli handle del pool quando il side è hovered.

Il pool è il render di `MAX_HANDLES_PER_SIDE` handle per side, sempre presenti in DOM dal mount, anche quando nessuna edge li usa. `DynamicHandles.tsx:22-31`:

```tsx
/**
 * Pre-allocated Handle Pool for React Flow nodes.
 *
 * Renders MAX_HANDLES_PER_SIDE handles per side, always in DOM from mount.
 * - Active handles (connected to edges): visible, positioned by portDistribution.
 * - First inactive handle per side: visible on hover (ghost behavior for new connections).
 * - Other inactive handles: invisible (1×1px, opacity:0) but REGISTERED in React Flow.
 *
 * This eliminates the chicken-and-egg timing issue: when an edge references
 * "bottom-1", that handle already exists in the DOM with a known measured position.
 * React keys are stable (${side}-${index}) so handles never mount/unmount.
 */
```

La logica "ghost-visible" è in `DynamicHandles.tsx:208-221`:

```tsx
// Ghost behavior: show the first inactive handle on hover
// (the next available slot for creating a new connection).
// A handle is "first inactive" if all lower indices are active.
let isFirstInactive = false;
if (!isActive) {
    isFirstInactive = true;
    for (let i = 0; i < index; i++) {
        if (!activeHandles.has(`${side}-${i}`)) {
            isFirstInactive = false;
            break;
        }
    }
}
const isGhostVisible = isFirstInactive && hoveredSide === side;
```

Lo styling ghost (`DynamicHandles.tsx:246-247`):

```tsx
const ghostClassName = 'mm-anchor mm-anchor--ghost mm-anchor--ghost-visible';
const ghostStyle: React.CSSProperties = { [positionProp]: '50%' };
```

Sub-domanda A — "Cosa sono concretamente i ghost handle":
Sono elementi `<Handle>` del pool fisso (sempre `MAX_HANDLES_PER_SIDE` per side renderizzati, riga 203), styled come "ghost" quando il loro `(side, index)` è il primo slot libero su un side hovered. Non sono elementi DOM aggiuntivi rispetto al pool: sono lo stesso pool, in una modalità di styling diversa.

Sub-domanda B — "Per quali ruoli esistono":
Per **entrambi**. Il loop `DynamicHandles.tsx:252-286` rende sia `<Handle type="target">` (riga 270) sia `<Handle type="source">` (riga 278) per ogni `handleId`, e calcola in modo simmetrico `targetClassName/targetStyle` e `sourceClassName/sourceStyle` con la stessa logica `isGhostVisible` (righe 253-266):

```tsx
const targetClassName = isTargetRole
    ? connectedClassName
    : isGhostVisible ? ghostClassName : poolClassName;
const targetStyle = isTargetRole
    ? connectedStyle
    : isGhostVisible ? ghostStyle : inactiveStyle;

const sourceClassName = isSourceRole
    ? connectedClassName
    : isGhostVisible ? ghostClassName : poolClassName;
const sourceStyle = isSourceRole
    ? connectedStyle
    : isGhostVisible ? ghostStyle : inactiveStyle;
```

Il commento STEP 4 di `portDistribution.ts:193-197` ("the ghost handles in DynamicHandles provide connection points") si riferisce a questo pool: anche quando `nodeHandles[side] === []` (side senza edges), gli handle del pool restano in DOM e sono pre-misurati, così `getNextFreeHandleIndex` può ritornare `0` per la prima nuova edge e l'handle `"side-0"` esiste già nel DOM.

---

## Allegati

- Commit diag14: `c64c3f812` (`chore(v2-flow): add [diag14] applyDistribution input/output snapshot`)
- File ispezionati:
  - `frontend/src/components/editor-v2/utils/portDistribution.ts` (intero)
  - `frontend/src/components/editor-v2/components/DynamicHandles.tsx` (intero)
  - `frontend/src/components/editor-v2/EditorV2.tsx` (righe 35-49, 770-790)
  - `frontend/src/components/editor-v2/utils/edgeUtils.ts` (righe 880-907)
