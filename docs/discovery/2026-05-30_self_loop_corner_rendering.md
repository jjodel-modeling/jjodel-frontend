# Discovery — rendering self-loop come loop d'angolo (READ-ONLY)

**Tipo:** Fase 1 — discovery read-only
**Branch:** `alfonso-frontend-jjtl`
**Data:** 2026-05-30 18:30
**Stato:** report pronto per review in chat — nessun file sorgente modificato, nessun commit.

> Obiettivo a valle (NON in questo task): sostituire il "riccio" Bezier del
> self-loop (`r : A → A`, `source === target`) con un loop quadrato ortogonale
> che abbraccia un angolo libero del nodo, angoli arrotondati riusando lo stesso
> raggio del Manhattan routing. Questo documento risponde solo a "dove/come".

---

## 1. Gestione attuale del self-loop (`source === target`)

**Risposta sintetica.** Il self-loop NON cade nel ramo generico: c'è un unico
custom edge component, **`UnifiedEdge`**, registrato per tutti i tipi di edge, che
intercetta il caso via uguaglianza di **node-id** (`source === target`) e produce
il "riccio" con una **cubic Bezier** (`computeSelfLoopPath`), bypassando il
routing Manhattan/arrotondamento usato dalle altre edge.

**Registro edge** — tutti i tipi mappano allo stesso componente:
`frontend/src/components/editor-v2/EditorV2.tsx:101-106`
```typescript
const edgeTypes: EdgeTypes = {
    reference: UnifiedEdge,
    inheritance: UnifiedEdge,
    composition: UnifiedEdge,       // M1: containment edge
    instanceRef: UnifiedEdge,       // M1: non-containment reference
};
```

**Rilevamento self-loop** (node-id, non coordinata):
`frontend/src/components/editor-v2/edges/UnifiedEdge.tsx:145`
```typescript
const isSelfLoop = source === target;
```

**Path function che produce il riccio** — `UnifiedEdge.tsx:237-245`:
```typescript
const path = useMemo(() => {
    if (isSelfLoop) {
        return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);   // ← riccio
    }
    if (crossings.length > 0) {
        return buildFinalPath(spreadPoints, crossings, 4, 6);
    }
    return roundManhattanPath(spreadPath, 4);
}, [spreadPath, spreadPoints, crossings, isSelfLoop, sourceX, sourceY, targetX, targetY]);
```
Quando `isSelfLoop`, il path salta `roundManhattanPath`/`buildFinalPath` e usa una
sola Bezier cubica.

**La Bezier del riccio** — `frontend/src/components/editor-v2/utils/edgeUtils.ts:605-623`:
```typescript
export function computeSelfLoopPath(sourceX, sourceY, targetX, targetY): string {
    const size = 30;
    const cp1X = sourceX + size;        // control point 1: a destra dalla source
    const cp1Y = sourceY - size * 0.5;
    const cp2X = targetX + size * 0.5;  // control point 2: sopra il target, da destra
    const cp2Y = targetY - size;
    return `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;
}
```
Un solo segmento curvo, control points spinti a destra/su → groviglio compatto sul
lato del nodo.

**Da quali handle parte/arriva il self-loop.** Le coord `sourceX/Y`, `targetX/Y`
sono determinate dagli handle assegnati in fase di transform. Per un self-loop
`computeOptimalHandles` (`jjomTransformers.ts:368-414`) riceve
`sourceVertex === targetVertex` → `dx = dy = 0` → entra in
`Math.abs(dy) >= Math.abs(dx)` (vero), `dy < 0` falso →
ritorna `{ sourceHandle: 'bottom-0', targetHandle: 'top-0' }`
(`jjomTransformers.ts:404-405`). Quindi il riccio parte dal **bordo inferiore** e
rientra dal **bordo superiore** dello stesso nodo (handle index 0 su entrambi),
con la Bezier che bulge a destra.

> Nota: `computeManhattanPath` ha una propria guardia self-loop a
> `edgeUtils.ts:108-111` (`|sx-tx|<1 && |sy-ty|<1` → stessa `computeSelfLoopPath`),
> ma per il self-loop gli endpoint differiscono (bottom vs top), quindi quella
> guardia di fatto non scatta: il trigger effettivo è il check node-id in
> `UnifiedEdge.tsx:238`.

**Ramo di rendering.** Il self-loop, essendo una reference (non inheritance
raggruppata), cade in **CASE 3 — Standard single edge** (`UnifiedEdge.tsx:493+`).
Già oggi alcune diramazioni self-loop esistono: label offset dedicato (`:251`),
e le guardie `!isSelfLoop` che sopprimono `SegmentHandles` (`:598`) ed
`EndpointHandles` (`:608`, `:428`, `:476`).

---

## 2. Punto di costruzione/trasformazione degli edge + indice tra self-loop fratelli

**Risposta sintetica.** Il mapping JJOM→ReactFlow avviene in
**`jjomEdgeToRFEdge`** (singolo edge) con batch entry **`transformJjomGraph`**.
Esistono due approcci per derivare l'indice di un self-loop tra i suoi fratelli
sullo stesso source node; **l'approccio runtime nel componente (b) è il più
naturale dato il codice esistente**, perché `UnifiedEdge` ha già `useEdges()` in
scope ed evita problemi di consistenza coi patch path della sync.

**Punto di mappatura** — `frontend/src/components/editor-v2/utils/jjomTransformers.ts:420-568`
(`jjomEdgeToRFEdge`), batch a `:573-590` (`transformJjomGraph`):
```typescript
// transformJjomGraph (:583-587)
const rfEdges: Edge[] = [];
for (const e of edges) {
    const edge = jjomEdgeToRFEdge(e);
    if (edge) rfEdges.push(edge);
}
```
Per un self-loop, `edge.start.id === edge.end.id`, quindi `source` e `target`
risultano uguali (`:524-525`, `:551-552`, ecc.).

**Opzione (a) — indice a transform-time.**
`jjomEdgeToRFEdge` lavora **un edge alla volta**, senza conoscenza dei fratelli →
da solo non basta. `transformJjomGraph` itera tutti gli edge e *potrebbe*
raggruppare i self-loop per source node e iniettare un indice in `data`.
**Caveat critico:** `transformJjomGraph` NON è l'unico produttore di RF edge — gli
edge passano anche per i patch path incrementali di `useJjomSync` (full-rebuild a
`useJjomSync.ts:1013`, patch a `:1099`/`:1191`, vedi discovery
`2026-05-30_ghost_target_edge_origin_discovery.md`), che chiamano
`jjomEdgeToRFEdge` direttamente. Un indice calcolato in `transformJjomGraph`
rischierebbe di non essere ricalcolato sui patch → drift. Questa opzione
implicherebbe toccare la sync (critical-zone) per restare consistente.

**Opzione (b) — conteggio a runtime nel componente (RACCOMANDATA).**
`UnifiedEdge` chiama già **`useEdges()`** → `allEdges`:
`frontend/src/components/editor-v2/edges/UnifiedEdge.tsx:169`
```typescript
const allNodes = useNodes();
const allEdges = useEdges();   // ← già disponibile
```
Da qui il loop può filtrare i fratelli e ricavare il proprio ordinale:
```text
const siblings = allEdges.filter(e => e.source === e.target && e.source === source);
const index = siblings.findIndex(e => e.id === id);
```
Vantaggi: reattivo (ricomputa al cambio edge), nessun plumbing cross-layer,
nessun problema di consistenza coi patch, **resta fuori critical-zone**.
Precedente: il componente deriva già lo spread per-edge dagli handle index e
interroga `useNodes()/useEdges()` per la crossing detection (`:229-234`).
→ Approccio (b) preferito.

---

## 3. Costante del raggio di arrotondamento Manhattan

**Risposta sintetica.** Il raggio **NON è una costante esportata con nome**: è il
**parametro di default `radius = 4`** della funzione `roundManhattanPath`, passato
esplicitamente come letterale `4` ai due call site in `UnifiedEdge`. La funzione
`roundManhattanPath` è il punto unico riusabile per arrotondare angoli ortogonali.

**Funzione di arrotondamento** —
`frontend/src/components/editor-v2/utils/edgeUtils.ts:512-593`:
```typescript
export function roundManhattanPath(path: string, radius: number = 4): string {
    // ...parse + drop segmenti degeneri...
    for (let i = 1; i < points.length - 1; i++) {
        // r limitato a metà dei segmenti interni (intero su primo/ultimo)
        const maxR1 = (i === 1) ? len1 : len1 / 2;
        const maxR2 = (i === points.length - 2) ? len2 : len2 / 2;
        const r = Math.min(radius, maxR1, maxR2);
        if (r < 0.5) { d += ` L ${curr.x} ${curr.y}`; continue; }   // segmento troppo corto → dritto
        // before/after sul corner + arco a quarto di cerchio
        d += ` L ${beforeX} ${beforeY}`;
        d += ` A ${r} ${r} 0 0 ${sweep} ${afterX} ${afterY}`;       // sweep dal cross product
    }
    d += ` L ${last.x} ${last.y}`;
    return d;
}
```

**Dove il raggio `4` è applicato** — `UnifiedEdge.tsx`:
- `:244` → `roundManhattanPath(spreadPath, 4)` (caso normale)
- `:242` → `buildFinalPath(spreadPoints, crossings, 4, 6)` (con bridge; 1° numero =
  raggio corner 4, 2° = arco bridge 6)
- più il default `= 4` in firma a `edgeUtils.ts:512`.

**Sulla regola `|dy| < 5 = dritto, altrimenti curva`.** Questa regola NON è nel
path attivo: vive nel componente legacy
`frontend/src/components/editor-v2/edges/ManhattanEdge-toDelete.tsx:86`
(`if (dy < 5)`) — file `-toDelete`, non registrato in `edgeTypes`. Nel codice
attivo l'equivalente "dritto vs piega" è distribuito tra: il routing per side-pair
in `computeManhattanPath` (`edgeUtils.ts:92-135`), la rimozione collineare in
`cleanPoints` (`:38-75`), e lo skip del corner corto `r < 0.5` in
`roundManhattanPath:566`.

**Caveat per l'implementazione (decisione da prendere).** Il valore `4` è
**riusabile** — basta richiamare `roundManhattanPath(path, 4)` o passare `4` a un
nuovo builder di corner arrotondati — ma è un **letterale duplicato in 3 punti**
(`:242`, `:244`, default `:512`), NON un'unica costante con nome tipo
`MANHATTAN_CORNER_RADIUS`. Per il loop d'angolo il modo identico di arrotondare è
riusare `roundManhattanPath` con `4`, oppure (scelta dell'implementatore, fuori
da questa discovery) estrarre una costante nominata. Lo segnalo perché il prompt
poneva come condizione di stop "la costante non esiste come valore riusabile": il
valore **è** riusabile via funzione, ma manca una costante nominata centralizzata.

---

## 4. Accesso alla geometria del nodo (bounding box)

**Risposta sintetica.** ReactFlow passa solo gli endpoint. Per la bbox dentro
l'edge component la convenzione viva è **`useNodes()` → `find(byId)` →
`getNodeRect(node)`**. `UnifiedEdge` ha già `allNodes = useNodes()` in scope.

**Helper bbox** — `frontend/src/components/editor-v2/utils/edgeUtils.ts:461-470`:
```typescript
export function getNodeRect(node: any): Rect {
    const pos = node.internals?.positionAbsolute ?? node.positionAbsolute ?? node.position;
    return {
        x: pos.x, y: pos.y,
        width:  node.measured?.width  ?? node.width  ?? 180,
        height: node.measured?.height ?? node.height ?? 80,
    };
}
```

**Precedente in-component** (stesso pattern dentro un edge component) —
`frontend/src/components/editor-v2/edges/EndpointHandles.tsx:67,82-84`:
```typescript
const allNodes = useNodes();
// ...
const node = allNodes.find(n => n.id === nodeId);
if (!node) return;
const rect = getNodeRect(node);
```

In `UnifiedEdge` la bbox del nodo del loop è quindi a un `find` + `getNodeRect` di
distanza: `allNodes` è già a `UnifiedEdge.tsx:168`.

> Alternativa: `useInternalNode` / `node.measured` diretto (usato nel legacy
> `ManhattanEdge-toDelete.tsx:27-28`), ma la convenzione attiva del codebase è
> `useNodes() + getNodeRect`.

---

## 5. Rendering della label di una edge

**Risposta sintetica.** Le label si renderizzano in **`<EdgeLabelRenderer>`** con
posizione `computeLabelPosition(spreadPath)` (midpoint del segmento più lungo) +
un `labelOffset`. Il self-loop ha **già** un offset dedicato (`{x:0, y:-16}`).

**Render** — `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx:621-649`:
```jsx
<EdgeLabelRenderer>
  {!isInheritance && (
    <div className="edge-label ..."
      style={{ position:'absolute',
        transform:`translate(-50%,-50%) translate(${labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)` }}
      ... >
```

**Posizione base** — `labelPos = computeLabelPosition(spreadPath)`
(`UnifiedEdge.tsx:248`; util `edgeUtils.ts:685+`: sceglie il segmento più lungo e
ne prende il midpoint).

**Offset dedicato self-loop** — `UnifiedEdge.tsx:250-251`:
```typescript
const labelOffset = useMemo(() => {
    if (isSelfLoop) return { x: 0, y: -16 };   // label centrata sopra
    // ...altrimenti spread lungo il segmento più lungo via handle index...
```

**Caveat per l'implementazione.** `computeLabelPosition` lavora su **`spreadPath`**
(il path Manhattan grezzo tra handle bottom/top), NON sulla Bezier `path` del
riccio. Per centrare la label sul **segmento esterno** del nuovo loop quadrato,
l'implementatore dovrà derivare le coord label dalla geometria del nuovo loop
(es. midpoint del segmento orizzontale/verticale esterno) invece di
`computeLabelPosition(spreadPath)`. Lo stesso vale per la cardinalità
(`cardinalityPos`, `:281`).

---

## 6. Scope stimato per l'implementazione + check critical-zone

**Il rendering del self-loop è completamente isolato nel custom edge component +
util di edge.** NON passa per `portDistribution.ts` né per `useJjomSync.ts`:

- Gli handle del loop sono fissi `bottom-0`/`top-0` (index 0,
  `jjomTransformers.ts:404-405`) → **nessuna dipendenza dai bucket di
  `portDistribution.ts`**.
- `useJjomSync` crea solo il `DVoidEdge` sottostante (già esistente per i self-loop
  legittimi same-MM, vedi discovery 2026-05-30 ghost-target) → **non disegna il
  riccio**.

**File che il fix dovrà presumibilmente toccare:**

| File | Cosa | Critical-zone §3.1? |
|------|------|---------------------|
| `edges/UnifiedEdge.tsx` | path-decision `isSelfLoop` (`:237-245`), bbox via `useNodes()`, indice fratelli via `useEdges()`, label/cardinality offset per il loop | **No** |
| `utils/edgeUtils.ts` | sostituire/estendere `computeSelfLoopPath` con un builder di loop quadrato ortogonale che riusa il rounding `r=4` (nuova fn o rewrite) | **No** |
| `utils/jjomTransformers.ts` | SOLO se l'angolo è scelto a transform-time (opzione 2a); con l'approccio runtime (2b) **non si tocca**. Eventuale handle assignment per il loop (`computeOptimalHandles` :404-405) se serve cambiarlo | **No** |
| `editor-v2/types.ts` | SOLO se serve un campo `data` per l'indice/angolo (opzione 2a) | n/a |

**Layer Impact Report (Fase 2):** **non richiesto** — nessuno dei file sopra è in
critical-zone §3.1, *a meno che* l'implementatore scelga di propagare l'indice
d'angolo attraverso i patch di `useJjomSync` (opzione 2a estesa alla sync), strada
che l'approccio raccomandato (2b, conteggio runtime via `useEdges()`) evita.

---

## Condizioni di stop anticipato — esito

- **`source === target` gestito in portDistribution/useJjomSync?** No: handle fissi
  index 0, render nel solo `UnifiedEdge` + `edgeUtils`. → nessun touch critical-zone
  necessario per il fix base.
- **Custom edge component / origine del riccio trovati?** Sì: `UnifiedEdge`
  (`edgeTypes` EditorV2.tsx:101) + `computeSelfLoopPath` (edgeUtils.ts:605).
- **Raggio Manhattan riusabile?** Sì come valore (`roundManhattanPath(path, 4)` /
  default param), ma duplicato come letterale `4` in 3 punti, **senza costante
  nominata**. → non blocca, ma è una decisione da confermare in chat (vedi §3).

Nessuna condizione di stop forza l'interruzione; la sola sfumatura da decidere con
Alfonso è se introdurre una costante nominata per il raggio o riusare il letterale.

---

## Riferimenti rapidi (file:riga)

- `EditorV2.tsx:101-106` — `edgeTypes`, tutti → `UnifiedEdge`
- `UnifiedEdge.tsx:145` — `isSelfLoop = source === target`
- `UnifiedEdge.tsx:168-169` — `useNodes()` / `useEdges()` già in scope
- `UnifiedEdge.tsx:237-245` — path-decision (riccio vs Manhattan arrotondato)
- `UnifiedEdge.tsx:244,242` — `roundManhattanPath(.,4)` / `buildFinalPath(.,.,4,6)`
- `UnifiedEdge.tsx:250-251` — label offset self-loop
- `UnifiedEdge.tsx:598,608` — guardie `!isSelfLoop` (no SegmentHandles/EndpointHandles)
- `edgeUtils.ts:461-470` — `getNodeRect`
- `edgeUtils.ts:512-593` — `roundManhattanPath` (radius default 4)
- `edgeUtils.ts:605-623` — `computeSelfLoopPath` (il riccio)
- `edgeUtils.ts:685+` — `computeLabelPosition`
- `jjomTransformers.ts:368-414` — `computeOptimalHandles` (self-loop → bottom-0/top-0)
- `jjomTransformers.ts:420-590` — `jjomEdgeToRFEdge` / `transformJjomGraph`
- `EndpointHandles.tsx:67,82-84` — precedente in-component `useNodes()+getNodeRect`
- `ManhattanEdge-toDelete.tsx:86` — regola legacy `|dy|<5` (NON attiva)
