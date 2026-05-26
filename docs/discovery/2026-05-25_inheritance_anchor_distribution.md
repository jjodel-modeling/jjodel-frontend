# Discovery: Inheritance Anchor Distribution in v2-flow

**Data**: 2026-05-25
**Branch**: alfonso-frontend-jjtl
**Commit HEAD**: 04aacfed91db21f76785daa6dce4af29ea54c038
**Modalità**: READ-ONLY (nessuna modifica al codice)

> **Nota sui path**: il prompt cita `frontend/src/components/editorV2/...`. Il path
> reale è `frontend/src/components/editor-v2/...` (kebab-case). Tutte le citazioni
> sotto usano il path verificato.

---

## ⚠️ Esito in breve

**L'ipotesi del prompt è smentita** (vedi `## Deviazioni dalle ipotesi del prompt`).
Le generalization **non** sono ignorate da `computePortDistribution`: passano per
`DVoidEdge.new2`, diventano edge ReactFlow `type:'inheritance'`, ed **entrano** nel
sistema di port distribution dove sono gestite con branch dedicati.

Il sintomo osservato (reference + generalization che atterrano sullo stesso punto su
`Full Professor`) ha una causa **strutturalmente diversa** da quella ipotizzata: quando
la generalization fa parte di un **gruppo di ereditarietà** (≥2 figli verso lo stesso
parent, esattamente il caso `Full Professor`+`Associate Professor` → `Docenti`), viene
disegnata dal **tree connector** di `useTreeLayout`, il cui ramo lato-figlio si ancora al
**centro orizzontale del nodo figlio** (`childCenterX`), **bypassando** l'handle assegnato
e l'intero sistema di port distribution. La reference sullo stesso lato è invece collocata
dal sistema handle (DynamicHandles). I due sistemi di posizionamento **non si coordinano**.

Conforme alla regola di hard stop del prompt, riporto i findings e **non** formulo un fix.

---

## Obiettivo 1 — Generazione generalization edge

### 1.1 Identificazione D-layer

La sorgente è il campo `extends` (array di Pointer al parent) su `DClass`, letto in
fase di sync iniziale dal raw D-layer:

- `frontend/src/components/editor-v2/hooks/useJjomSync.ts:620-643` — Step 3 "Create
  missing edges (inheritance + references)" (commento a `:601`): per ogni `DClass`,
  itera `entry.raw.extends ?? []` (`:624`) e crea un edge per ogni parent id.
- Marker D-layer dell'edge di ereditarietà: `DEdge.isExtend` (boolean). Settato a `true`
  nel callback di creazione (`useJjomSync.ts:634`) e nel write-back canvas→JjOM
  (`frontend/src/components/editor-v2/sync/canvasToJjom.ts:136`, `:281`).

Non esiste un campo "generalization" separato: l'ereditarietà M2 è un `DEdge` con
`isExtend=true` (e `isReference` falso), simmetrico al `DEdge` con `model→DReference`
delle reference.

### 1.2 Conversione in edge ReactFlow

- `frontend/src/components/editor-v2/utils/jjomTransformers.ts:379-503` —
  `jjomEdgeToRFEdge(edge)` traduce un LEdge/DEdge in un `Edge` ReactFlow.
- `jjomTransformers.ts:391` — `const isInheritance = !!edge.isExtend;`
- `jjomTransformers.ts:492-503` — branch finale: se `edge.isExtend`, ritorna un edge
  `type: 'inheritance'`, `data: {} as InheritanceEdgeData`, con `sourceHandle`/
  `targetHandle` calcolati da `computeOptimalHandles`.
- `jjomTransformers.ts:353-356` — `computeOptimalHandles(..., isInheritance=true)`
  ritorna **hard-coded** `{ sourceHandle: 'top-0', targetHandle: 'bottom-0' }`
  (figlio=top, parent=bottom), indipendentemente dalla geometria.

Path di creazione da drag-from-handle (utente disegna un extends): selezione tipo edge
in `frontend/src/components/editor-v2/EditorV2.tsx:1162-1163`
(`isInheritance = choice === 'inheritance'` → `edgeType = 'inheritance'`); il side è
forzato `top`/`bottom` (dettaglio documentato nella discovery sorella
`2026-05-25_edge_anchoring_regression.md` §3.2, riga `EditorV2.tsx:1195-1208` — non
riletto in questa sessione).

### 1.3 Passa per DVoidEdge?

**Sì.** `useJjomSync.ts:631-635`:

```typescript
DVoidEdge.new2(
    undefined, graphId, graphId, undefined,
    srcVertex, tgtVertex,
    (d: DEdge) => { d.isExtend = true; }
);
```

Stesso meccanismo delle reference M2 (stesso Step 3, branch reference a `:646-`), con
l'unica differenza che il callback setta `d.isExtend = true` anziché collegare un
`DReference` via `model`. La guard race-window è rispettata (`hasCanvasEdgePair`):
`useJjomSync.ts:629-640` usa la **chiave pair-based** `${srcVertex}→${tgtVertex}` +
`markCanvasEdgePair` (corretto: una classe estende un parent una sola volta, quindi non
serve la chiave composita usata invece per le reference multiple a `:659`).

### 1.4 Hook dedicato?

**No.** Non esiste un `useInheritanceEdges` analogo a `useM1ReferenceEdges`. La creazione
avviene inline nello Step 3 di `useJjomSync.ts` (`:620-643`), nello stesso loop delle
reference. `useM1ReferenceEdges.ts` riguarda solo i valori reference **M1** post-mount e
non tratta le generalization (grep: nessun hit `isExtend`/`inheritance` nel file).

---

## Obiettivo 2 — computePortDistribution

### 2.1 Path

`frontend/src/components/editor-v2/utils/portDistribution.ts:61` (298 righe totali).

### 2.2 Firma

```ts
function computePortDistribution(
    edges: EdgeMinimal[],
    nodeIds: string[],
    nodePositions?: Map<string, NodePosition>,
): {
    edgeHandles: Map<string, { sourceHandle: string; targetHandle: string }>;
    nodeHandles: Map<string, Record<Side, PortInfo[]>>;
}
```

`EdgeMinimal` (`portDistribution.ts:19-26`) include `type?: string` → la funzione **vede**
il tipo di edge. Non decide il *side* (lo legge da `getBaseSide(handleId)`, `:37-44`),
decide solo l'**indice** entro il lato.

### 2.3 Call sites

Due call site, entrambi **destrutturano solo `edgeHandles`** (scartano `nodeHandles`):

- `frontend/src/components/editor-v2/EditorV2.tsx:790` — dentro `applyDistribution`
  (`useCallback`, `:785-805`). È il path runtime principale: ad ogni `setEdges` riassegna
  gli handle indicizzati.
- `frontend/src/components/editor-v2/utils/edgeUtils.ts:905` — wrapper
  `computeDistributedHandles` (citazione dalla discovery sorella
  `2026-05-25_edge_anchoring_regression.md` §2; non riletto in questa sessione).

`nodeHandles` (STEP 4, `:189-235`) **non è consumato da alcun call site** — confermato
nella discovery sorella (§2.1): dato morto. `DynamicHandles` calcola le proprie posizioni
indipendentemente (vedi Obiettivo 3.2).

### 2.4 Sorgente degli edge contati

`applyDistribution` riceve `edgeList: Edge[]` (gli RF edge correnti) e li passa **tutti**
a `computePortDistribution` senza filtrare per tipo:

```typescript
// EditorV2.tsx:785-805 (estratto)
const applyDistribution = useCallback((edgeList: Edge[]): Edge[] => {
    const currentNodes = getNodes();
    const nodeIds = currentNodes.map(n => n.id);
    const positions = buildNodePositions(currentNodes);
    const { edgeHandles } = computePortDistribution(edgeList, nodeIds, positions);
    return edgeList.map(edge => { /* riassegna solo se diverso */ });
}, [getNodes, buildNodePositions]);
```

Quindi la collezione contata è la lista di `Edge[]` ReactFlow, che **include** gli edge
`type:'inheritance'`. Nessun filtro `kind/type` a monte.

### 2.5 Formato chiavi bucket

**Confermato** `${nodeId}:${side}:${role}`:

- `portDistribution.ts:78` — `const sourceKey = \`${edge.source}:${sourceSide}:source\`;`
- `portDistribution.ts:111` — `const targetKey = \`${edge.target}:${targetSide}:target\`;`

Il suffisso `:source`/`:target` è il fix recente (`89e67dc65`, vedi discovery sorella §4.1):
source e target che insistono sullo stesso `(nodeId, side)` finiscono in **bucket distinti**.

---

## Obiettivo 3 — Generalization nel bucket

### 3.1 Presenti nella collezione?

**Sì.** Gli edge `type:'inheritance'` sono nella stessa lista `Edge[]` delle reference e
arrivano a `computePortDistribution` via `applyDistribution` (Obiettivo 2.4). Non c'è
path parallelo che li escluda dal conteggio.

### 3.2 Se sì: come sono trattate?

**Contate, ma con collasso speciale per ruolo** (non escluse, non assegnate a un handle
fisso al centro dentro `computePortDistribution`):

- **Fan-out lato source** (`portDistribution.ts:81-99`): tutte le inheritance edge
  uscenti dallo stesso `(node, side, source)` collassano in **un unico** `PortGroup`
  (`edgeType:'inheritance', role:'source'`). Il primo crea il gruppo, i successivi vi
  fanno push.
- **Fan-in lato target** (`portDistribution.ts:115-130`): tutte le inheritance edge
  entranti nello stesso `(node, side, target)` collassano in **un unico** `PortGroup`
  (`edgeType:'inheritance', role:'target'`).
- **Reference** (`portDistribution.ts:131-139` lato target, `:100-108` lato source):
  **ogni** edge ottiene il proprio `PortGroup` (nessun collasso).

In STEP 3 (`:159-187`) ogni `PortGroup` del bucket ottiene un indice progressivo
(`${side}-${index}`). **Conseguenza chiave**: poiché source e target sono in bucket
separati (`:source` vs `:target`), un edge inheritance (source) e una reference (target)
sullo **stesso lato** ottengono **entrambi index 0** → entrambi mappano sullo slot logico
`${side}-0`. La separazione fisica è delegata a DynamicHandles (sotto).

**Posizionamento fisico** (`DynamicHandles.tsx`, post-commit `c8910167a`):

- `activeHandles` (`:58-70`) e `handleRoles` (`:74-87`) sono derivati leggendo
  `edge.sourceHandle`/`edge.targetHandle` via `useEdges()`. Gli edge inheritance
  contribuiscono normalmente (es. `top-0` registrato come ruolo `source`).
- Logica `hasBothRoles` (`:186-201`): se su un lato sono attivi **sia** source **sia**
  target, si mantiene il layout segregato (source 1ª metà ~6.25%, target 2ª metà ~56.25%,
  `:230-232`); se è attivo **un solo** ruolo, distribuzione uniforme `(i+1)/(n+1)` sul
  conteggio del ruolo (`:233-242`, caso `n=1 → 0.5`).

Quindi, per reference+generalization di **ruolo diverso** sullo stesso lato:
`hasBothRoles=true` → l'uno a ~6.25%, l'altro a ~56.25% (segregati per metà, **non**
equidistanti su tutto il lato). Per reference+generalization dello **stesso ruolo**:
finiscono nello stesso bucket e ottengono index distinti → distribuiti (es. 0.333/0.667).

### 3.3 Se no: path di rendering parallelo

Non applicabile per il conteggio (gli edge inheritance entrano nel bucket). **Però** esiste
un path di rendering parallelo per il **disegno** quando l'ereditarietà è **raggruppata**
(≥2 figli, stesso parent): il tree connector di `useTreeLayout` (Obiettivo 4), che ignora
gli handle assegnati lato figlio. Vedi Obiettivo 4.3 e i Findings.

---

## Obiettivo 4 — Collassamento N→1 su stesso target

Sono coinvolti **due** meccanismi distinti e cooperanti.

### 4.1 Implementazione

- **Anchor sharing (lato parent)**: `portDistribution.ts:115-130` (fan-in target) — tutte
  le inheritance edge verso lo stesso parent/side collassano in un `PortGroup` → **unico**
  `targetHandle` condiviso (tipicamente `bottom-0`, dato che `computeOptimalHandles` forza
  parent=`bottom-0`).
- **Routing (tree connector)**: `frontend/src/components/editor-v2/hooks/useTreeLayout.ts:46-198`.
  - Group detection `:62-75`.
  - `isGrouped = group.length > 1` (`:78`); `isPrimary = group[0].id === edgeId` (`:77`,
    ordinamento per id `:74`).
  - Geometria trunk+bar+branches `:98-119`, via `computeTreeConnectorPath(targetX, targetY,
    branches, ...)` (`:118`). `targetX/targetY` = posizione DOM del `targetHandle`
    condiviso del parent.
  - In `UnifiedEdge.tsx:172-186` si chiama `useTreeLayout`; `:212-220` — gli edge
    inheritance **grouped** **non** registrano (e non disegnano) il proprio path Manhattan
    individuale: *"their Manhattan paths are phantom (not rendered — the tree connector
    renders instead)"*. Solo il `primary` disegna il tree connector condiviso.

### 4.2 Lato (source/target/entrambi)

- **Detection** del gruppo: keyed sul **target** (parent) — `:66`.
- **Anchor sharing**: lato **target/parent** (fan-in in portDistribution → `bottom-0`
  condiviso). Esiste anche un fan-out collasso lato **source** in portDistribution
  (`:81-99`), ma per gli edge grouped il lato figlio è comunque sovrascritto (vedi sotto).
- **Tree connector**: il trunk parte dall'anchor del parent (`targetX/targetY`); i rami
  raggiungono ciascun figlio al **centro orizzontale del bordo** del figlio:
  ```typescript
  // useTreeLayout.ts:108-115
  const childCenterX = (childNode.position?.x ?? 0) + w / 2;
  const childY = sourceSide === 'top'
      ? (childNode.position?.y ?? 0)
      : (childNode.position?.y ?? 0) + h;
  branches.push({ childX: childCenterX, childY, edgeId: edge.id });
  ```
  Il ramo lato-figlio **non** usa l'handle/port-distribution: si ancora al **centro** del
  lato del figlio. Questo è il punto critico per il sintomo (vedi Findings).

### 4.3 Routing o anchor sharing?

**Entrambi.**
- *Anchor sharing*: lato parent, gli N edge inheritance condividono un solo `targetHandle`
  (fan-in collapse di portDistribution).
- *Routing*: il tree connector (`useTreeLayout` + `computeTreeConnectorPath` in
  `edgeUtils`) **sostituisce** i path Manhattan individuali con una geometria condivisa
  (trunk + bar + branches). I rami terminano al **centro** di ogni figlio, non agli handle.

### 4.4 Chiave di riconoscimento

`useTreeLayout.ts:66`:

```typescript
if (e.type !== 'inheritance' || e.target !== target) return false;
```

Cioè: stesso `target` (parent) + `type==='inheritance'`. Esclusioni (`:67-71`): edge con
`sourceAnchor.mode==='pinned'` e side ≠ `'top'`, o `targetAnchor.mode==='pinned'` e side
≠ `'bottom'`, sono **esclusi** dal gruppo (il tree assume figlio=top, parent=bottom).
`treeGroupId = \`tree_${target}\`` (`:124`) per la soppressione crossing intra-albero.

---

## Deviazioni dalle ipotesi del prompt

Il prompt ipotizza (sezione "Sospetto root cause"):

> «`computePortDistribution` ... probabilmente popola il bucket ... contando solo le
> DReference (DVoidEdge per reference M2), ignorando le generalization se queste vengono
> renderizzate via path separato.»

**Questa ipotesi è smentita su tutti i punti:**

1. Le generalization **passano per `DVoidEdge.new2`** (`useJjomSync.ts:631-635`), come le
   reference (stesso Step 3) — il prompt prevedeva questa eventualità esplicitamente
   ("es. generalization passano già per DVoidEdge e il problema è altrove").
2. Diventano edge ReactFlow `type:'inheritance'` (`jjomTransformers.ts:492-503`) ed
   **entrano** in `computePortDistribution` (`EditorV2.tsx:790`, senza filtro per tipo).
3. **Non sono ignorate**: sono gestite con branch dedicati (collasso fan-in/fan-out,
   `portDistribution.ts:81-99`, `:115-130`).

La causa reale del sintomo ("reference + generalization sullo stesso punto su Full
Professor") non è un'omissione dal conteggio dei bucket, ma la **coesistenza di due sistemi
di posizionamento non coordinati** quando la generalization è **raggruppata** (caso Full
Professor + Associate Professor → Docenti):

- Reference (e singola inheritance non-grouped): posizionate dal sistema handle
  (portDistribution → DynamicHandles).
- Inheritance **grouped**: disegnata dal **tree connector** (`useTreeLayout`), il cui ramo
  lato-figlio si ancora al **centro orizzontale del figlio** (`useTreeLayout.ts:110`),
  ignorando l'handle assegnato.

Conformemente all'hard stop del prompt, mi fermo qui con i findings descrittivi e **non**
formulo un fix.

---

## Findings rilevanti per il fix

- **Doppio sistema di anchoring non coordinato (causa probabile del sintomo).** Su un nodo
  figlio che ha, sullo stesso lato, (a) una generalization **raggruppata** e (b) una
  reference, il ramo dell'albero atterra al **centro** del lato (`useTreeLayout.ts:108-115`,
  `childCenterX`), mentre la reference è collocata dal sistema handle
  (`DynamicHandles.tsx:186-242`). Nessuno dei due "vede" l'altro → sovrapposizione vicino
  al centro. Questo spiega "atterrano sull'handle centrale, sovrapposte" meglio
  dell'ipotesi sul conteggio bucket.
- **Il caso "tutte equidistanti su un lato" confligge col design role-segregato attuale.**
  Reference+generalization di ruolo diverso sullo stesso lato sono separate per metà
  (~6.25% / ~56.25%, `DynamicHandles.tsx:230-232`), non distribuite uniformemente su tutto
  il lato. Per ruolo uguale, invece, distribuiscono. La regola attesa da Alfonso
  ("equidistanti") richiederebbe di rivedere come `hasBothRoles`/role-bucketing interagisce
  con la presenza di una generalization sullo stesso lato.
- **Il caso speciale "N gen, stesso target = 1 anchor" funziona via due meccanismi**
  (`portDistribution.ts:115-130` fan-in + `useTreeLayout` tree connector). Qualsiasi
  intervento sul lato figlio deve preservare questo comportamento del lato parent
  (visibile su `Docenti`).
- **Zona sensibile.** `portDistribution.ts`, `DynamicHandles.tsx`, `useTreeLayout.ts` sono
  stati toccati da una serie coordinata di fix recenti (`89e67dc65`, `cdcef4456`,
  `db7be7a25`, `c8910167a`). Un intervento sul ramo lato-figlio del tree connector o sulla
  logica `hasBothRoles` rischia di regredire: (a) il caso denso bidirezionale
  Families.ecore (`Member.left`, 4+4) e (b) la regressione mono-direzionale già sistemata
  da `c8910167a`. Verificare entrambi gli scenari prima di considerare chiuso un eventuale
  fix.
- **`nodeHandles` resta dato morto** (nessun consumer, vedi Obiettivo 2.3): non è il punto
  su cui agire.

## File chiave per il prossimo prompt

- `frontend/src/components/editor-v2/hooks/useTreeLayout.ts` — tree grouping + ancoraggio
  ramo lato-figlio al centro (`:108-115`); è il punto in cui i rami ignorano gli handle.
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` — posizionamento fisico
  role-aware (`hasBothRoles`, `:186-242`).
- `frontend/src/components/editor-v2/utils/portDistribution.ts` — bucketing role-aware
  (`:78`, `:111`), collasso inheritance (`:81-99`, `:115-130`).
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` — `computeOptimalHandles`
  (inheritance hard-coded `top-0`/`bottom-0`, `:353-356`).
- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` — orchestrazione rendering;
  path individuale phantom per grouped inheritance (`:212-220`).
- `frontend/src/components/editor-v2/utils/edgeUtils.ts` — `computeTreeConnectorPath`
  (geometria trunk+bar+branches) e `computeDistributedHandles` (`:905`).
