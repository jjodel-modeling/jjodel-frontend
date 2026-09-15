# Edge routing discovery (2026-05-02)

> Read-only discovery, Fase A. Nessun file modificato. Riferimenti `path:line` esatti.

## TL;DR — premessa importante

**L'architettura non è una IIFE inline nel template JSX.** Il calcolo del path NON vive nel jsxString. La pipeline reale è:

```
JSX template (DV.tsx)  →  riferisce edge.d, segments, this.edge.d
                              ↑ ↑
                     consumati a runtime via `usageDeclarations`
                              ↑
                     ret.segments = edge.segments
                              ↑
        getter L-class:  LVoidEdge.get_segments(c) → get_segments_impl(c, true)
                              ↑
                     dispatch su EdgeBendingMode (Line, Bezier_quadratic, ...)
                              ↑
                     EdgeSegment.makeD(index, gapMode) costruisce l'SVG `d`
```

Per fare Manhattan routing **non si modifica il jsxString**: si aggiunge un nuovo valore a `EdgeBendingMode` (es. `Manhattan = "M"`) e si insegna a `EdgeSegment.makeD()` (e a `svgLetterSize()`) come gestirlo. In alternativa più contenuta: si lascia `EdgeBendingMode.Line` invariato e si interviene **prima** di `makeD()` aggiungendo midpoint-virtuali a 90° in `get_segments_impl()` (oppure in `get_points_impl()`) — i segmenti L-shape risultanti restano `EdgeBendingMode.Line`, semplicemente sono di più.

Il bump del template via VersionFixer (pattern `2.211 → 2.212` no-op) propaga la modifica solo perché refresha l'intero `DViewElement` (jsxString + bendingMode + css + ...). Se la modifica vive nel codice TS (non nel jsxString), basta deployare — nessun bump è necessario, **a meno che** si voglia anche modificare `bendingMode` di default sui DViewElement Edge esistenti.

---

## A.1 Location della view Edge

### A.1.1 — Definizione del template JSX

**File:** `frontend/src/common/DV.tsx`
**Funzione:** `DV.edgeView(modename, headSize, tailSize, dashing, vp, name)` — `DV.tsx:661`
**Range JSX (template literal beautified):** `DV.tsx:868-928`

Snippet del template (concatenazione di stringhe al runtime tramite `beautify(...)`):

```tsx
// DV.tsx:868
let jsx = beautify(
`<div className={"edge hoverable hide-ep clickthrough fullscreen ` + modename + `"}>
    <svg className={"clickthrough fullscreen"} onDoubleClick={() => setTimeout(edge.addMidPoint(edge.start.size.tl().add(edge.end.size.tl()).divide(2)), 150)}>
        { /* edge full paths
           
             first is preview path, normally seen
             third (segmented) is path onHover
             second is to enlarge the hover area of path.preview to the same as path.content, so i avoid hover loop enter-leave and graphical flashing
           
        */ }

        <path className={"preview edge full outline"} d={this.edge.d} />
        <path className={"preview edge full` + (dashing ? ' dashed' : '') + `"} d={this.edge.d} />
        <path className={"preview edge full hover-activator"} d={this.edge.d} />

        {/* start label */}
        {props.slabel && <foreignObject key={'label-start'} className="label-start" 
                    x={\`\${sPos.x}px\`} y={\`\${sPos.y}px\`}>
            <div className={\`label-text \${sPos.align}\`}>{props.slabel||''}</div>
        </foreignObject>}

        {/* end label */}
        {props.elabel && <foreignObject key={'label-end'} className="label-end" 
                    x={\`\${ePos.x}px\`} y={\`\${ePos.y}px\`}>
            <div className={\`label-text \${ePos.align}\`}>{props.elabel||''}</div>
        </foreignObject>}

        { /* edge separate segments */ }
        {segments && segments.all && segments.all.flatMap((s, i) => [
            <path key={i} tabIndex="-1" className={"clickable content segment"} d={s.dpart} />,
            s.label && <foreignObject key={'label'} className="label" x={(s.start.pt.x + s.end.pt.x)/2+"px"} y={(s.start.pt.y + s.end.pt.y)/2+"px"}>
            <div className={"label-text"}
             style={{transform: "translate(-50%, 0%) translate(0%, -"+(1-0.5*Math.abs(Math.abs(s.radLabels)%Math.PI)/(Math.PI/2))*100+"%)"+
             " translate(0%, -5px"}}>{s.label}</div>
            </foreignObject>
        ])}
        { /* edge head */ }
        ` + head + `
        { /* edge tail */ }
        ` + tail + `
        { /* edge anchor start */ }
        {edge.start && <circle className="edge-anchor content clickable no-drag"
         style={{transform: "translate(" + segments.all[0].start.pt.x +"px, " + segments.all[0].start.pt.y +"px)"}}
         onMouseDown={()=> edge.startFollow=true}
         onMouseUp={()=> edge.startfollow=false} />}
        { /* edge anchor end */ }
        {edge.end && <circle className="edge-anchor content clickable no-drag" `+ // cx=...
        `style={{transform: "translate(" + segments.all.last().end.pt.x +"px, " + segments.all.last().end.pt.y +"px)"}}
         onMouseDown={()=> edge.endFollow=true}
         onMouseUp={()=> edge.endfollow=false} />}

    </svg>
    { /* interactively added edgepoints */ }
    {
        edge.midPoints.map( m => <EdgePoint data={edge.father.model.id} initialSize={m} key={m.id} view={"EdgePoint"} /> )
    }
    {decorators}
</div>`
);
```

### A.1.2 — `DV.edgeView` viene chiamata 6 volte

**Caller unico:** `frontend/src/redux/store.tsx:485-516`

Ogni chiamata produce una `DViewElement` distinta nel viewpoint Default:

```ts
// store.tsx:510-515
makeEdgeView("Association", EdgeHead.reference,             size1,   undefined,  false);
makeEdgeView("Dependency",  EdgeHead.reference,             size1,   undefined,  true);   // dashed
makeEdgeView("Inheritance", EdgeHead.extend,                size1,   undefined,  false);
makeEdgeView("Aggregation", EdgeHead.aggregation,   undefined,      size2,      false);
makeEdgeView("Composition", EdgeHead.composition,   undefined,      size2,      false);
makeEdgeView("",            EdgeHead.reference,             size1,   undefined,  false);  // generic
```

Tutti e 6 condividono **lo stesso template JSX** (stessa stringa generata da `DV.edgeView`), differiscono solo in `head`, `tail`, `dashing`, `palette`. Pointer ID:

- `Pointer_ViewEdgeAssociation`
- `Pointer_ViewEdgeDependency`
- `Pointer_ViewEdgeInheritance`
- `Pointer_ViewEdgeAggregation`
- `Pointer_ViewEdgeComposition`
- `Pointer_ViewEdge` (generico, `name = ""`)

Definiti in `frontend/src/common/Defaults.ts:17-22, 59-64`.

### A.1.3 — Verifica unicità template

`grep -rn "edge hoverable" frontend/src/`:
- 1 sola occorrenza nel codice TS: `DV.tsx:869`. **Source of truth unica.**

`grep -rn "segments\.all\|segments\.head\|segments\.tail" frontend/src/ --include="*.ts" --include="*.tsx"`:
- `DV.tsx:603, 898, 912, 916, 917, 959, 960` (template + helper `svgHeadTail`)
- Tutto il resto sono fixture serializzate in `frontend/src/examples/*.ts` (snapshot Redux completi).

`grep -rn "edge\.midPoints\|addMidPoint" frontend/src/`:
- `DV.tsx:870, 924` (template)
- `GraphDataElements.tsx:2312-2336` (definizione + getter/setter)

Nessun template duplicato, nessun rendering JSX dell'edge fuori dal `DV.edgeView` template.

---

## A.2 IIFE corrente

### A.2.1 — La "IIFE attesa" non esiste sul template

**Nessuna IIFE nel jsxString.** Il template usa direttamente `this.edge.d`, `segments`, `segments.all`, `edge.midPoints`. Questi simboli sono **valori già calcolati** che arrivano al render via:

1. `usageDeclarations` (definito in `DV.tsx:949-1050`) — script `(ret) => { ret.segments = edge.segments; ret.start = edge.start; ret.end = edge.end; ... }` valutato prima del render.
2. `edge.d` proviene dal getter `LVoidEdge.get_d(c)` definito in `GraphDataElements.tsx:2546-2548`:
   ```ts
   public get_d(c: Context) {
       return this.get_segments(c).all.map(s => s.d).join(" ");
   }
   ```
3. `edge.segments` proviene da `LVoidEdge.get_segments(c)` → `get_segments_outer(c)` → `get_segments_impl(c, true)` (`GraphDataElements.tsx:2554-2620`).

### A.2.2 — `usageDeclarations` script (l'unica "IIFE-like" nel jsxString-context)

**File:** `DV.tsx:949-1050`. Citazione integrale:

```ts
let edgeUsageDeclarations = "(ret)=>{\n" +
    "// ** preparations and default behaviour here ** //\n" +
    "// ret.data = data\n" +
    "ret.edgeview = edge.view.id\n" +
    "ret.view = view\n" +
    "// data, edge, view are dependencies by default. delete the line(s) above if you want to remove them.\n" +
    "// add preparation code here (like for loops to count something), then list the dependencies below.\n\n" +
    
    "ret.getPosition = () => {\n" +
    "  if (!ret.segments || !ret.segments.all || !ret.segments.all.length) return null;\n\n" +
    "  const all = ret.segments.all;\n\n" +
    "  const getSector = (p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 }) => {\n" +
    "    const dx = p2.x - p1.x;\n" +
    "    const dy = p2.y - p1.y;\n" +
    "    if (dx === 0 && dy === 0) return null;\n\n" +
    "    let a = Math.atan2(dy, dx);\n" +
    "    if (a < 0) a += 2 * Math.PI;\n\n" +
    "    // 64 sectors (π/32 each), with half-step offset\n" +
    "    return Math.floor(((a + Math.PI / 64) % (2 * Math.PI)) / (Math.PI / 32)) + 1;\n" +
    "  };\n\n" +
    "  const findRule = (rules, s) => {\n" +
    "    for (let i = 0; i < rules.length; i++) {\n" +
    "      const r = rules[i];\n" +
    "      if (s >= r.min && s <= r.max) return r;\n" +
    "    }\n" +
    "    return null;\n" +
    "  };\n\n" +
    /* startRules / endRules tabulate dx/dy/align per sector, righe 980-1016 — 
       NON influenzano edge.d, riguardano SOLO il posizionamento delle label sPos/ePos */
    "  // ... (truncated: vedi DV.tsx:980-1042)\n" +
    "  return { start, end };\n" +
    "};\n\n" +
    "// ** declarations here ** //\n\n" +
    "ret.start = edge.start\n" +
    "ret.end = edge.end\n" +
    "ret.segments = edge.segments\n\n" +
    "ret.position = ret.getPosition()\n" +
    "ret.sPos = ret.position ? ret.position.start : { x: 0, y: 0, align: 'left' }\n" +
    "ret.ePos = ret.position ? ret.position.end : { x: 0, y: 0, align: 'right' }\n" +
    "}";
```

**Cosa fa:**
- Espone `edge.start`, `edge.end`, `edge.segments` come variabili top-level usabili nel template.
- Calcola `sPos` / `ePos` (posizione delle label start/end), classificando l'angolo del primo/ultimo segmento in 64 settori e applicando `startRules` / `endRules`.
- **NON tocca `edge.d`.** Questo arriva pre-calcolato dal getter L-class.

### A.2.3 — `get_segments_impl` (vera implementazione del path)

**File:** `frontend/src/model/dataStructure/GraphDataElements.tsx:2559-2620`

```ts
private get_segments_impl(c: Context, outer: boolean): this["segments"] {
    let l = c.proxyObject;
    let v = this.get_view(c);
    let allNodes = l.allNodes;
    windoww.edge = l;
    let all: segmentmaker[] = this.get_points(allNodes, outer, c);
    let ret: EdgeSegment[] = [];
    let bm: EdgeBendingMode = v.bendingMode;            // ← bendingMode dalla view
    let gapMode: EdgeGapMode = v.edgeGapMode;
    let segmentSize = this.svgLetterSize(bm, false, true);
    let increase: number = segmentSize.first;
    let segment: EdgeSegment | undefined = undefined;
    /// grouping points according to SvgLetter
    for (let i = 0; i < all.length - 1; ) {
        let start: segmentmaker = all[i];
        let endindex = (i+increase < all.length - 1) ? i+increase : all.length - 1;
        let mid: segmentmaker[] = all.slice(i+1, endindex).filter( (e, i)=> i % 2 === 0);
        let end: segmentmaker = all[endindex];
        if (i === endindex && segment) start = segment.end;
        segment = new EdgeSegment(start, mid, end, bm, gapMode, i, segment);  // ← crea EdgeSegment
        ret.push(segment);
        i+= increase+1;
        if (increase !== segmentSize.others) increase = segmentSize.others;
    }
    let fillSegments: EdgeSegment[] = [];
    this.snapSegmentsToNodeBorders(c, v, ret, fillSegments);   // ← snap ai bordi via closestIntersection
    let longestLabel = c.data.longestLabel;
    this.setLabels(c, ret, allNodes);
    let rett: this["segments"] = {all: [...ret, ...fillSegments], segments: ret, fillers: fillSegments} as any;
    for (let i = 0; i < rett.all.length; i++) {
        let s = rett.all[i];
        s.makeD(i, gapMode);                                    // ← genera s.d e s.dpart
    }
    let zoom = new GraphPoint(1, 1);
    rett.head = this.headPos_impl(c, true,  v.edgeHeadSize, rett.segments[rett.segments.length - 1], zoom);
    rett.tail = this.headPos_impl(c, false, v.edgeTailSize, rett.segments[0], zoom);
    return rett;
}
```

### A.2.4 — `EdgeSegment.makeD` (la "linea diritta" attuale)

**File:** `GraphDataElements.tsx:1987-2058`

Per `EdgeBendingMode.Line`:

```ts
makeD(index: number, gapMode: EdgeGapMode): string {
    this.m = GraphPoint.getM(this.start.pt, this.end.pt);
    this.rad = Geom.mToRad(this.m, this.start.pt, this.end.pt);
    this.radLabels = Math.atan(this.m);

    let svgLetter = this.svgLetter;
    switch (this.svgLetter.length) {
        case 1:
            // EdgeBendingMode.Line → svgLetter = "L"
            let bezierpts = [...this.bezier.map( b => b.pt), this.end.pt];
            let finalpart = svgLetter + " " + bezierpts.map((p)=> p.x + " " + p.y).join(", ");
            this.dpart = "M " + this.start.pt.x + " " + this.start.pt.y + ", " + finalpart;
            // ...
            this.d = (index === 0 ? "M" + this.start.pt.x + " " + this.start.pt.y + ", " : "") + finalpartUncut;
            break;
        // ...
    }
    return this.d;
}
```

Per due nodi senza midpoint con `EdgeBendingMode.Line`, il risultato è semplicemente `M sx sy, L tx ty`. **È qui che parte la "linea diritta".**

### A.2.5 — Modello "linea diritta" attuale: dove escono start/end

I `start.pt` / `end.pt` vengono prodotti da `get_points_impl` (`GraphDataElements.tsx:2442-2537`). Per gli endpoint:

```ts
// GraphDataElements.tsx:2486 (anchor su nodo finale)
if (anchor) rete.pt = getAnchorOffset(rete.size, anchor, true, 1);
// GraphDataElements.tsx:2510 (anchor su nodo iniziale)
if (anchor) rets.pt = getAnchorOffset(rets.size, anchor, true, 1);
// fallback: usa view.edgeStartOffset / view.edgeEndOffset
```

Dove `getAnchorOffset` (`GraphDataElements.tsx:2443-2448`):

```ts
function getAnchorOffset(size: GraphSize, offset: GraphPoint, isPercentage: boolean, $factor: number = 100) {
    if (!size) size = new GraphSize(0, 0, 0, 0);
    if (isPercentage) offset = new GraphPoint(offset.x/$factor*(size.w), offset.y/$factor*(size.h));
    return size.tl().add(offset, false);
}
```

**Da qui la "tutti escono dallo stesso punto" che si vede in screenshot:** `dge.anchors[0]` è sempre lo stesso anchor (top-left, derivato da `size.tl().add(0,0)` se l'offset è 0,0%).

Successivo `snapSegmentsToNodeBorders` (`GraphDataElements.tsx:2636-2754`) ritaglia i punti agli edge dei box via `GraphSize.closestIntersection` — questo accorcia il segmento ma non cambia l'angolo: il taglio avviene lungo il vettore start→end.

---

## A.3 API disponibili nella IIFE / template

### A.3.1 — `edge` (LVoidEdge)

**File principale:** `frontend/src/model/dataStructure/GraphDataElements.tsx`
**Classe D:** `DVoidEdge` (riga ~1841 e ~2116, due ridichiarazioni — vedi sotto)
**Classe L:** `LVoidEdge` (la classe che il template vede via `c.proxyObject`, nello stesso file)

Proprietà rilevanti per geometria:

| Proprietà | Tipo | Riferimento |
|-----------|------|------------|
| `start` | `LGraphElement` (Vertex/EdgePoint) | `get_start_(end)_Outer` :2384-2397 |
| `end` | `LGraphElement` | idem |
| `midnodes` | `LEdgePoint[]` (proxy live) | :2769-2780 |
| `midPoints` | `InitialVertexSize[]` (config persistente) | :2311 |
| `allNodes` | `[start, ...midnodes, end]` | `get_allNodes` :2307 |
| `d` | `string` (path SVG completo) | `get_d` :2546 |
| `segments` | `{all, segments, fillers, head, tail}` | `get_segments` :2554, type :2398-2400 |
| `view` | `LViewElement` con `bendingMode`, `edgeGapMode`, `edgeHeadSize`, `edgeTailSize`, `edgeStartOffset`, `edgeEndOffset` | — |
| `father` | parent graph element | — |
| `model` | LModel padre | — |
| `startFollow` / `endFollow` | boolean per drag preview | :2789-2796 |

Metodi rilevanti:

| Metodo | Firma | Riferimento |
|--------|-------|------------|
| `addMidPoint(v)` | `(v: InitialVertexSize) ⇒ boolean` | dichiarato :2312, impl `impl_addMidPoints` :2331 |
| `addEdgePoint(v, index?)` | `(v, index?) ⇒ boolean` | :2313, :2328-2329 |
| `set_midPoints(val)` | sostituisce array | :2314-2327 |
| `headPos(headSize?, segment?, zoom?)` | `GraphSize & {rad}` | :2299, :2303 |
| `tailPos(...)` | come sopra | :2301, :2305 |

**NB:** `addMidPoint` accetta un `InitialVertexSize`, definito in `frontend/src/joiner/types.ts:211-216`:
```ts
export type InitialVertexSizeObj = Partial<{ x:number, y:number, w:number, h:number }>; // estrapolato
export type InitialVertexSizeFunc = ((parent: LVoidEdge|LGraphElement)=>InitialVertexSizeObj);
export type InitialVertexSize = undefined | InitialVertexSizeObj | InitialVertexSizeFunc;
```

### A.3.2 — `edge.start` / `edge.end` (LGraphElement)

Tipo: `LGraphElement` (vertice o EdgePoint). Espone:

- `size` di tipo `GraphSize` — la bounding box del nodo.
- `outerSize`, `innerSize` per coordinate outer/inner del grafo.
- `view: LViewElement`.
- `startPoint`, `endPoint` — `GraphPoint` per inizi/fine edge default.
- `anchors`: `Dictionary<string, GraphPoint>` o `{x:%, y:%}` — anchor relativi alla size del nodo (in %).
- `__raw: DGraphElement` per accesso ai dati raw.

### A.3.3 — Geometria: `Point` / `GraphPoint` / `Size` / `GraphSize`

**File:** `frontend/src/common/Geom.ts`. Tutte le classi sono `RuntimeAccessible` e disponibili via `windoww`.

**`IPoint` (base) — Geom.ts:21-296:**

| Metodo | Firma | Note |
|--------|-------|------|
| `add(p2, newInstance)` | `(p2: {x?,y?}, newInstance:bool) ⇒ this` | mutate o clone |
| `subtract(p2, newInstance)` | idem | |
| `multiply(pt\|n, newInstance?)` | scalar o componentwise | |
| `divide(pt\|n, newInstance?)` | idem | |
| `addAll([p...], newInstance)`, `subtractAll(...)` | aggregati | |
| `multiplyScalar/divideScalar(n, newInstance)` | esplicito | |
| `modulo/mod(pt\|n, newInstance?)` | aritmetica | |
| `equals(pt, tolX?, tolY?)` | con tolleranza | |
| `distanceFromPoint(p, skipSqrt?)` | euclidea | |
| `distanceFromLine(p1, p2)` | retta passante p1-p2 | |
| `degreeWith(p2, toRadians)` | atan2 differenza | |
| `move(rad, distance, clone?)` | sposta lungo direzione | |
| `absolute()` | magnitude | |
| `getRelativeDirection(start, end)` | "N"/"NE"/.../"NW" 8-cardinal | static, :53 |
| `getRelativeOffset(dir, amount)` | da direzione a vettore | static, :92 |
| `directionTo(other)` / `offsetToward(dir, amount)` | wrapper instance | :113-123 |
| `static getM(a, b)` | slope | |
| `clone(other)`, `duplicate()` | copia | |
| `moveOnNearestBorder(size, clone, graph, debug?)` | snap su bordo box | :255 |
| `static getQ(p1, p2, m?)` | intercept retta | |
| `isInTheMiddleOf(p1, p2, tolerance)` | bool | :228 |

**`GraphPoint extends IPoint`** — Geom.ts:299-314. Identica API; `toSize(w, h?)` ⇒ `GraphSize`; `static fromEvent(e)` (con bug todo).

**`Point extends IPoint`** — Geom.ts:317-331. Identica; differenza è solo nominale (sistema di coordinate "screen" vs "graph") per evitare mix.

**`ISize<PT>` (base) — Geom.ts:337-599:**

| Metodo | Cosa restituisce |
|--------|------------------|
| `tl(), tr(), bl(), br()` | i 4 angoli, come PT (Point/GraphPoint) |
| `cl(), cr(), ct(), cb()` | centri dei 4 lati |
| `cc()`, `center()`, `c()` | centro del box |
| `l(), r(), t(), b()` | alias per `cl`, `cr`, `ct`, `cb` |
| `lt(), rt(), lb(), rb(), lc(), rc(), tc(), bc()` | alias di `tl/tr/bl/br/cl/cr/ct/cb` |
| `relativePoint(xPercent, yPercent)` | punto interpolato |
| `offset()` | `(w, h)` come point |
| `add/subtract/multiply/divide/modulo` | per `{x,y,w,h}` |
| `intersection(size)` | `this | null` |
| `contains(pt)` | bool |
| `isOverlapping(size2)` | bool |
| `boundary(size2)` | unione bounding box (mutate) |
| `multiplyPoint(pt, newInstance)` / `dividePoint(pt, newInstance)` | scaling per punto |
| `min(other, clone)` / `max(other, clone)` | clamp componentwise |
| `equals(size)` | con uguaglianza esatta |
| `static fromPoints(p1, p2)` | bbox di 2 punti |
| `static printDiff` / `static stringify` | utility debug |

**`GraphSize extends ISize<GraphPoint>`** — Geom.ts:677+. Aggiunge:

| Metodo | Note |
|--------|------|
| `static closestIntersection(size, ptInside, ptOutside, gridAlign?, m0?, q0?)` | **chiave per Manhattan**: trova dove un segmento da pt verso targetPt interseca il bordo del box. Già usato in `snapSegmentsToNodeBorders`. |
| `static fromPoints(p1, p2)` | bbox |

### A.3.4 — `midPoints` API e semantica

- **Tipo:** `InitialVertexSize[]` (`GraphDataElements.tsx:2116`). In pratica: `Array<{x?,y?,w?,h?} | (parent⇒that)>`.
- **Ordine:** start → end (vedi `get_allNodes`: `[start, ...midnodes, end]`).
- **Distinzione critica:**
  - `midPoints` (config persistente, `InitialVertexSize`)
  - `midnodes` (proxy live `LEdgePoint[]`, costruiti dal sub-elements del DEdge)
  - In rendering, l'allNodes effettivo arriva da `midnodes`, non da `midPoints`.
- **`addMidPoint(v)`**: `impl_addMidPoints(val, index, c)` (`GraphDataElements.tsx:2331-2337`):
  ```ts
  TRANSACTION(..., () => {
      SetFieldAction.new(c.data.id, "midPoints", val, '+='+(index !== undefined ? index : ''), false);
  });
  ```
  Modifica via Redux action — **non in place**. Operatore `+=index` per inserzione posizionale, `+=` per append.
- **`set_midPoints(val)`** (`:2314-2327`): rimpiazza l'intero array (`SetFieldAction.new(..., "midPoints", val, undefined, false)`).
- **`removeMidPoint`** non esiste come metodo dedicato. Per rimuovere si usa `set_midPoints` con il nuovo array filtrato. (Ricerca: nessun match in `frontend/src/`.)
- **`clearMidPoints`** non esiste — `set_midPoints([])` lo simula.

---

## A.4 Refresh path

### A.4.1 — VersionFixer copre Edge

**File:** `frontend/src/redux/VersionFixer.tsx:130-138`

```ts
// update default views (only actual view elements, skip DClass/DPackage/etc.)
for (let k in s.idlookup) {
    let e = s.idlookup[k];
    if (!e || typeof e !== 'object') continue;
    let cn = (e as any).className;
    if (cn !== 'DViewElement' && cn !== 'DViewPoint') continue;
    let v: DViewElement|DViewPoint = e as any;
    if (v.className.includes("View") && v.version !== VersionFixer.highestVersion && !v.clonedCounter){
        // NB: for untouched views clonedCounter is undefined, not 0.
        LViewElement.updateDefaultView(v, s);
    }
}
```

**Conclusione:** Sì, copre **tutti** i `DViewElement` (incluse le 6 view Edge). Il filtro è:
- È un `DViewElement` o `DViewPoint`,
- ha `version !== highestVersion`,
- e `!v.clonedCounter` (cioè il pointer è una default view non editata dall'utente).

`LViewElement.updateDefaultView(v, s)` è in `frontend/src/view/viewElement/view.tsx:1728-1746`:

```ts
static updateDefaultView(v: DViewElement | DViewPoint, state?: DState): void {
    let s = state || store.getState();
    let newView: DViewElement | DViewPoint = Defaults.defaultViewPointsMap[v.id]||Defaults.defaultViewsMap[v.id];
    if (!newView) return; // not a default view
    newView = {...newView} as DViewElement & DViewPoint;
    newView.css_MUST_RECOMPILE = true;
    newView.pointedBy = PointedBy.merge(newView, v);
    newView.subViews = {...newView.subViews, ...v.subViews};
    s.idlookup[v.id] = newView;
    if (state) return;  // chiamato dal VersionFixer durante load — skip dispatch
    transientProperties.view[v.id] = new ViewTransientProperties();
    SetRootFieldAction.new('VIEWS_RECOMPILE_all', v.id, '+=', false);
}
```

**`Defaults.defaultViewsMap`** (`frontend/src/common/Defaults.ts:89`) viene popolata lazy dal reducer (`reducer.ts:1091-1100`) la prima volta. Contiene i `DViewElement` "vivi" creati al boot via `DV.edgeView` ⇒ rispecchiano sempre la versione corrente del jsxString in `DV.tsx`.

### A.4.2 — Pattern bump VersionFixer

Versione attuale: **2.211** (`VersionFixer.tsx:605-607`):

```ts
// 2.210 → 2.211: M1 node rendering aligned to flow editor
// (header order + emphasis, feature operator =, value italic, no bottom padding).
// No data migration; auto-refresh of default views regenerates view.css from views.ts
// and jsxString templates from DV.tsx.
private ['2.210 -> 2.211'](s: DState): DState {
    return s;
}
```

**Pattern per Manhattan**: aggiungere un metodo `private ['2.211 -> 2.212'](s: DState): DState { return s; }`. Nessuna data-migration: il for-loop generico al fondo di `update()` regenera tutte le default view non editate.

`highestVersion` viene calcolato automaticamente da `setup()` parsando i nomi dei metodi (`VersionFixer.tsx:79-101`). Bumpando 2.211 → 2.212, tutti i `DViewElement` con `version === 2.211` (impostato dall'updater 2.202 → 2.203, che ha messo `2.202` su tutti, ed è poi avanzato implicitamente quando `updateDefaultView` rimpiazza l'intero oggetto col `newView` che porta la sua propria `version`) e `clonedCounter === undefined` saranno refreshati.

### A.4.3 — Persistenza `jsxString` e `clonedCounter`

**Persistenza:** `view.jsxString` è un campo di `DViewElement` (`view.tsx:202`). Set tramite `set_jsxString` (`view.tsx:691-696`):

```ts
protected set_jsxString(val: this['jsxString'], c: Context): boolean {
    SetFieldAction.new(c.data, 'jsxString', val, '', false);
    SetRootFieldAction.new('VIEWS_RECOMPILE_jsxString', c.data.id, '+=', false);
    return true;
}
```

L'utente può editare jsxString via `frontend/src/components/editors/viewpoint/TemplateEditor.tsx:115` (`view.jsxString = jsx;`).

**`clonedCounter`:** è un contatore di mutazioni gestito centralmente dal sistema Redux di Jjodel (in `reducer/proxy/UDComparator`). Si incrementa ad **ogni** `SetFieldAction` che modifica un campo del DViewElement. Quindi:

- Modifica jsxString → `clonedCounter` da `undefined` a `1+`. View **non** verrà refreshata da VersionFixer.
- Modifica solo CSS, palette, o qualsiasi altro campo della view → idem. View **non** refreshata.
- Mai toccata dall'utente → `clonedCounter` resta `undefined`. View refreshata.

### A.4.4 — Rischio override silenzioso

**Policy attuale: ALL-OR-NOTHING.** È granulare per view, non per campo. Un utente che ha aggiunto un commento al CSS della Edge view non riceverà la nuova logica routing — ma neppure perderà silenziosamente le sue modifiche.

**Conseguenza per Fase B:** se interveniamo solo in `EdgeSegment.makeD()` / `get_segments_impl()` (codice TS, non jsxString), **nessun bump VersionFixer è necessario** per propagare la nuova logica — anche su view già editate dall'utente, il path verrà ricalcolato correttamente perché `edge.d` è un getter L che vive nel codice, non nel DViewElement persistito.

Il bump diventa necessario **solo se** vogliamo cambiare anche il `bendingMode` di default delle Edge view (es. da `"L"` a `"M"` con la nuova lettera Manhattan), perché `bendingMode` è un campo del `DViewElement` e nei progetti esistenti ha già il valore `"L"` salvato.

**Strategia consigliata:** mantenere `bendingMode = "L"` come valore della view (e quindi nessun bump richiesto), e nelle modifiche TS riconoscere il caso "Line + 2+ nodi senza midpoint utente" per applicare automaticamente il routing Manhattan iniettando midpoint virtuali. I segmenti generati restano `Line` letterali, l'L-shape emerge dai 90° dei midpoint.

### A.4.5 — Esempi/fixture e clonedCounter

Verificato su 5 dei 7 file in `frontend/src/examples/` (`first.ts`, `second.ts`, `statechartplus.ts`, `shapes.ts`, `statechartplus_old.ts`):

- Tutti contengono `Pointer_ViewEdgeAssociation` in `idlookup` con `jsxString` serializzato (template vecchio).
- **Nessuno** ha `clonedCounter` impostato sull'oggetto edge view (`clonedCounter: absent` per tutti i 5 file).
- 2 file (`statechartplus`, `shapes`) hanno `bendingMode: "L"` esplicito; gli altri non lo serializzano.

**Conseguenza:** quando un utente apre uno di questi esempi su una nuova versione, VersionFixer rimpiazzerà la stale view con il default fresh — niente regressione attesa.

---

## A.5 Rischi e segnali

1. **6 view Edge condividono lo stesso template** generato da `DV.edgeView`. Una modifica al template/logica viene propagata uniformemente. Pro: zero divergenza. Contro: non si può differenziare il routing per tipo di edge senza ulteriore logica (es. skipping Manhattan per `Inheritance` se si volesse).
2. **Stesso template per M1 e M2.** I viewpoint non differenziano il template Edge per livello di modello. La view Edge è applicata via `appliableTo: 'Edge'` (`DV.tsx:1056`) a qualsiasi DEdge, indipendente dal livello. M2-M2 e M1-M1 ricevono lo stesso path computation.
3. **Fixture sono `clonedCounter: absent`** per `Pointer_ViewEdgeAssociation` in tutti gli esempi controllati. Sicuro per il refresh.
4. **Preview drag durante creazione edge usa la stessa pipeline.** `mousemove_pendingEdge` (`GraphDataElements.tsx:2881-2909`) imposta `DVoidEdge.isFollowingCoords` (un `GraphPoint`) e forza un re-render. Il segmento finale viene reindirizzato in `get_points_impl` (`:2524-2535`):
   ```ts
   if (DVoidEdge.isFollowingCoords){
       if (c.data.id === LVoidEdge.endFollow) {
           let seg = all[all.length - 1];
           seg.pt = DVoidEdge.isFollowingCoords;
           seg.size = new GraphSize(seg.pt.x, seg.pt.y, 0.01, 0.01);
       }
       // idem per startFollow
   }
   ```
   Quindi anche il preview passa per `EdgeSegment.makeD` ⇒ Manhattan via `get_segments_impl` lo coprirà gratis.
5. **`DVoidEdge` è dichiarato due volte** (riga ~1841 e ~2116) — la seconda è la definizione effettiva (con `midPoints!: InitialVertexSize[]` e `midnodes!: LEdgePoint[]`). Non è un bug, è un pattern Jjodel D/L con due classi gemelle (D-shape e L-shape). Da non confondere quando si modifica.
6. **`get_segments_impl` è O(n)** sugli allNodes, ma viene invocato dentro un getter Redux; il sistema fa caching via `clonedCounter`. Aggiungere logica Manhattan dentro l'impl non degrada in modo apprezzabile: il routing è ricalcolato solo quando start/end/midnodes/view cambiano.
7. **`segmentSize.first` e `segmentSize.others`** in `svgLetterSize` (`:2407-2424`) per `Line` valgono `{first:1, others:1}`. Ogni nodo diventa la fine di un segmento e l'inizio del successivo (stride 1+1=2 — vedi `i += increase+1`). Aggiungere midpoint virtuali per Manhattan **non rompe** questa aritmetica purché si aggiungano effettivi `LEdgePoint` o si adattino i `segmentmaker[]` direttamente.
8. **`addMidPoint(...)` chiamato sul double-click non è la nostra strada per Manhattan.** Quel callback (`DV.tsx:870`) crea un midpoint utente persistente. Manhattan deve essere **calcolato a render-time, senza persistere midpoint**, altrimenti si "sporcano" gli edge dell'utente e si rompe l'idempotenza tra render/save.
9. **`grep "edge\\.d\\b"`** ritorna SOLO occorrenze nel template (`DV.tsx:879-881`) e nella getter — nessun consumer custom. Cambiare la stringa generata è safe.
10. **Recompile flag `VIEWS_RECOMPILE_jsxString`**: viene settato dal `set_jsxString`. Se in Fase B modifichiamo la TS ma non il jsxString, **non** scattano recompile. I componenti consumer leggono `transientProperties.view[v.id].jsxOutput`, che si invalida quando `clonedCounter` di `edge` o di `start/end` cambia (cioè quando si fa il drag) — corretto.

---

## A.6 Strategia proposta per Fase B

### Approccio A (minimal, preferito): iniettare midpoint virtuali in `get_segments_impl`

Subito dopo `let all: segmentmaker[] = this.get_points(allNodes, outer, c);` (riga 2564), inserire un branch:

```ts
// pseudocodice non finale
if (bm === EdgeBendingMode.Line && all.length === 2 /* solo start ed end, niente midnode utente */) {
    // calcola elbow Manhattan tra all[0].pt e all[1].pt usando size dei nodi
    const elbows = computeManhattanElbows(all[0], all[1]);  // 1 o 2 punti virtuali
    all.splice(1, 0, ...elbows);  // start, elbow1[, elbow2], end
}
```

Vantaggi:
- I segmenti sono `EdgeBendingMode.Line` puri. `EdgeSegment.makeD` non cambia.
- Nessun nuovo enum value, nessun bump VersionFixer.
- Funziona automaticamente per tutte e 6 le edge view.
- Drag preview free.
- Se l'utente double-clicca per inserire un midpoint reale, `all.length > 2` e il branch Manhattan si disattiva — l'utente prende il controllo.

Svantaggi:
- Decidere l'orientamento (H-V vs V-H) del primo gomito richiede una euristica (es. "lato d'uscita più vicino al target"). Affidarsi a `IPoint.getRelativeDirection` (`Geom.ts:53`) per scegliere se uscire orizzontalmente o verticalmente.
- I `segmentmaker` virtuali devono avere `size`, `view`, `ge`, `pt`, `uncutPt` validi. Va costruito un fake `segmentmaker` (es. `size = new GraphSize(elbow.x, elbow.y, 0, 0)`, `view = (start.view || end.view)`, `ge = undefined`).

### Approccio B (estensione enum): aggiungere `EdgeBendingMode.Manhattan = "M"`

Aggiungere a `joiner/types.ts:125` un nuovo valore. Aggiornare:
- `svgLetterSize` (`GraphDataElements.tsx:2407`) per dire quanti punti consuma il letter Manhattan.
- `EdgeSegment.makeD` per generare `M sx sy, L ex sy, L ex ey` (L-shape) o `M sx sy, L mx sy, L mx ey, L ex ey` (Z-shape).
- `EdgeSegment` constructor (`:1924-1972`) per gestire il fix-up del letter.
- `damedge.tsx:29-34` per `groupingsize[EdgeBendingMode.Manhattan] = 1` (o N).

Vantaggi:
- È esplicito che è un bending mode (consistente con Bezier_quadratic, Elliptical_arc).
- Dichiarativo: l'utente può cambiare `view.bendingMode` a `"M"` per ottenere Manhattan.

Svantaggi:
- Cambiare il default di `bendingMode` da `"L"` a `"M"` su 6 view richiede bump VersionFixer (perché `bendingMode` è persistito su `DViewElement` ed è già `"L"` sui progetti vecchi e nelle fixture).
- Più superficie di codice modificata.
- Manhattan è "decorativo" sul path, non un letter SVG nativo — modellarlo come bending mode è semanticamente forzato.

### Punto di iniezione del bump (se serve)

Solo se si segue Approccio B con cambio default `bendingMode`:

1. `frontend/src/common/DV.tsx:1057` — `v.bendingMode = EdgeBendingMode.Manhattan;` (o lasciare `Line` e gestire in TS).
2. `frontend/src/redux/VersionFixer.tsx` — aggiungere alla fine prima del `}` di chiusura della classe (riga 608):
   ```ts
   // 2.211 → 2.212: Edge views default routing aggiornato a Manhattan.
   // Auto-refresh delle view non editate raccoglie il nuovo template / bendingMode da DV.tsx.
   private ['2.211 -> 2.212'](s: DState): DState {
       return s;
   }
   ```
3. Nessuna modifica al jsxString (il template attuale già supporta N segmenti via `segments.all.flatMap`).

Con l'**Approccio A**, niente bump: la modifica vive interamente in `get_segments_impl()` e nelle utility geometriche locali. I progetti esistenti vedono il nuovo routing al primo render, **anche se l'utente ha personalizzato la view** (perché stiamo intervenendo prima del template, sul L-getter).

### Raccomandazione

**Approccio A.** È il path con meno superficie di rischio: nessun nuovo enum, nessun bump persistente, niente migration di `bendingMode`, refresh implicito (al primo render) anche per progetti con `clonedCounter > 0`. L'utente che vorrà disattivare Manhattan per un singolo edge potrà farlo aggiungendo un suo midpoint reale (il branch Manhattan auto-disattiva).

L'unico vincolo: l'euristica di scelta orientamento (H-prima vs V-prima) deve essere conservativa per evitare cross-overs visibili. Una regola semplice: se `|dx| > |dy|` ⇒ esci orizzontale, altrimenti verticale. Con un solo elbow basta. Per L vs Z (1 vs 2 elbow) si può decidere in base all'overlap delle bbox di start ed end (se le bbox si sovrappongono in proiezione su un asse, conviene Z).

---

## Appendice — File rilevanti

| File | Linee chiave | Ruolo |
|------|--------------|-------|
| `frontend/src/common/DV.tsx` | 661-1067 | `edgeView` factory, jsxString template, `usageDeclarations`, `svgHeadTail` |
| `frontend/src/common/Geom.ts` | 21-296 (IPoint), 299-331 (GraphPoint/Point), 337-685 (ISize/Size/GraphSize) | Geometria |
| `frontend/src/model/dataStructure/GraphDataElements.tsx` | 1894-2072 (EdgeSegment), 2280-2620 (LVoidEdge geometry), 2769-2780 (midnodes), 2881-2909 (drag preview) | Path computation |
| `frontend/src/joiner/types.ts` | 125-135 (EdgeBendingMode), 211-216 (InitialVertexSize) | Enum + tipi |
| `frontend/src/joiner/classes.ts` | 1185 (default bendingMode globale) | Default `bendingMode = Bezier_quadratic` (override locale a `Line` per le Edge view) |
| `frontend/src/redux/store.tsx` | 485-516 | 6 chiamate `makeEdgeView` |
| `frontend/src/redux/VersionFixer.tsx` | 130-146 (loop refresh), 605-607 (versione corrente) | Auto-refresh default views |
| `frontend/src/view/viewElement/view.tsx` | 162-269 (DViewElement schema), 685-696 (set_jsxString), 1728-1746 (updateDefaultView) | Persistenza |
| `frontend/src/common/Defaults.ts` | 17-22 (pointers Edge views), 59-64 (constants) | Pointer ID |
| `frontend/src/redux/reducer/reducer.ts` | 1091-1100 | Popolazione `defaultViewsMap` |
| `frontend/src/redux/defaults/views.ts` | 1-840 | Definizioni view non-Edge (Object, Value, Class, ecc.) |

— Discovery completata 2026-05-02. Pronto per Fase B.
