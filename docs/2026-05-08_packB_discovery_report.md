# Report L2 Pack B Discovery — 2026-05-08

**Tipo**: Fase 0 (read-only discovery)
**Branch**: `alfonso-frontend-jjtl`
**Output**: report strutturato, nessuna modifica al codice
**Successori**: prompt operativi B.1 (`appliableToClasses` UI) e B.2 (`edgeRouting`).

---

## Blocco 1 — Discovery condivisa

### D1. Tipi LViewElement / DViewElement

**`isEdge` / `edgeSource` / `edgeTarget`** — sono **tipizzati su `DViewElement`** ma **NON su `LViewElement`**.

`frontend/src/view/viewElement/view.tsx:271-278` (DViewElement):
```typescript
// L2 — edge overlay schema (classic editor only). When isEdge=true, ...
isEdge!: boolean;
edgeSource!: string;
edgeTarget!: string;
```

In `LViewElement` (riga 349-1730) **non ci sono** dichiarazioni esplicite né `__info_of__` né `get_/set_` per questi tre campi. Vengono intercettati dal `_defaultSetter` del proxy (vedi nota in `claude-code-log` 2026-05-05 19:00). Per questo `InfoData.tsx` ha 5 cast `(view as any)`. **Riga giusta dove tipizzarli su LViewElement**: subito sotto `appliableTo!: ...` (riga 891) con stessa convenzione (`isEdge!: boolean;` + relativo `__info_of__isEdge: Info = {...}`); pattern simile già esistente per `bendingMode`/`edgeGapMode` (1206-1213).

**`appliableTo`** (singolo) — DViewElement:215-216 + LViewElement:891
```typescript
appliableTo!: 'Any'|'Graph'|'GraphVertex'|'Vertex'|'Edge'|'EdgePoint'|'Field';
```
Stringa unione di **7 valori-ruolo del GraphElement**, **non** classifier names. Setter custom in LViewElement:1535-1549 (sincronizza forceNodeType).

**`appliableToClasses`** (array) — DViewElement:215 + LViewElement:884
```typescript
appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...
```
Array di **stringhe**. I valori sono valori dell'enum `EModelElements` (classes.ts:3877-3895): `'DModel' | 'DPackage' | 'DClass' | 'DEnumerator' | 'DEnumLiteral' | 'DOperation' | 'DParameter' | 'DAttribute' | 'DReference' | 'DAnnotation' | 'DStructuralFeature' | 'DClassifier' | 'DObject' | 'DValue'`. **Default (Constructors.ts:1087)**: `appliableToClasses` ricevuto da parametro o array vuoto. Il setter `set_appliableToClasses` (LViewElement:1565-1582) accetta array, normalizza/sorta, dispatcha `TRANSACTION` + `set_generic_entry` + `VIEWS_RECOMPILE_preconditions+=`.

**Pattern di scrittura confermato per i 3 campi L2**: `view.appliableToClasses = newArray` via proxy (TRANSACTION + recompile gratis); `(view as any).isEdge = bool` ok via `_defaultSetter` ma scrive senza side-effect (no recompile, no transaction wrap).

### D2. Stato InfoData.tsx

File: `frontend/src/components/editors/views/data/InfoData.tsx`. Componente: `InfoDataComponent` (42-246), wrappato in `connect`.

**Cast `(view as any)` totali**: **5**. Tutti su `isEdge` — 3 nei handlers (67, 72-72), 2 nel JSX (106, 113). I campi `edgeSource`/`edgeTarget` NON necessitano cast perché passati come stringhe a `<Input field={'edgeSource'}>` (la field-string non è type-checked contro `LViewElement`).

**Pattern progressive disclosure attuale**:
- Toggle "Is Edge" sempre visibile come `jj-toggle-row` (100-111) — pattern identico a "Is Exclusive" (87-98).
- I due `<Input>` di Edge Source/Target (115-128) sono mostrati **solo se `(view as any).isEdge`** — wrappati in `&& <>...</>` (113-130).

**Posizione esatta** dei controlli edge: linee **100-130** del file. Vivono **prima** del blocco `isV` (132) che contiene Priority, "Preferred appearance" (Select), "Applicable to" (Select multi), Viewpoint, Parent view, OCL, JS — i campi pertinenti al view dei nodi.

**Dropdown "Select appearance…"**: è **in InfoData.tsx, righe 152-181**, non un componente separato. Scrive su `view.forceNodeType` (NON su `appliableTo`). Le opzioni sono i 4 optgroup `Graphs/Edges/Fields/Vertexes` enumerati da `Object.keys()`. Setter inline. **Importante**: questo dropdown pilota `forceNodeType` (rendering type), non `appliableTo` (graph-role filter); essi sono sincronizzati lato setter (vedi `set_appliableTo` view.tsx:1535-1549).

**Dropdown "Applicable to"** (l'altro Select multi-classes — 184-196): scrive su `view.appliableToClasses`, isMultiSelect=true, opzioni = `objectTypes` array hardcoded (riga 50) = i 12 valori di `EModelElements`.

### D3. Stato VersionFixer.tsx

File: `frontend/src/redux/VersionFixer.tsx`. Versione corrente **2.214** (highestVersion calcolato auto dal nome funzione, ultima migration `'2.213 -> 2.214'` riga 669-687).

**Pattern dell'ultima migration** (2.213→2.214 — replace v2.2 default jsxString):
```typescript
private ['2.213 -> 2.214'](s: DState): DState {
    let migrated = 0;
    for (let k in s.idlookup) {
        let e = s.idlookup[k] as any;
        if (!e || typeof e !== 'object') continue;
        if (e.className !== 'DViewElement') continue;
        // ...idempotency guards + assegna DEFAULT_VIEW_JSX_STRING
        if (touched) migrated++;
    }
    if (migrated > 0) console.log(`[VersionFixer 2.213 -> 2.214] Migrated ${migrated} ...`);
    return s;
}
```

**Pattern aggiunta nuovo campo (es. 2.212→2.213, riga 645-662)** usato per `isEdge`/`edgeSource`/`edgeTarget`:
```typescript
if (typeof e.isEdge !== 'boolean') { e.isEdge = false; touched = true; }
if (typeof e.edgeSource !== 'string') { e.edgeSource = ''; touched = true; }
if (typeof e.edgeTarget !== 'string') { e.edgeTarget = ''; touched = true; }
```
Idempotente per costruzione (typeof guard).

**Per aggiungere `edgeRouting`**: una sola migration nuova (2.214→2.215) con il pattern identico del 2.212→2.213; setting `e.edgeRouting = 'manhattan-rounded'` (default) per ogni `DViewElement` esistente. **Inoltre serve aggiungere il default in `Constructors.DViewElement`** (classes.ts:1197-1199, accanto agli altri campi L2). Nessun template/jsxString update necessario, perché il routing è solo runtime in EdgeOverlay (non passa nel template).

---

## Blocco 2 — B.1 (`appliableToClasses`)

### D4. Tipo `view.appliableToClasses`

**Tipo**: `string[]` (DViewElement:215, LViewElement:884).
**Semantica corrente**: stringhe = **valori di `EModelElements`** (D-class-name del framework). Es: `'DObject'`, `'DClass'`, `'DPackage'`. NON sono pointer a LClass.
**Default**: array vuoto (Constructors.ts:1087) o popolato dal call-site (es. `lastViewpoint.ts:124,129,134,139` setta `['DObject']`/`['DEnumerator']`/`['DModel']`/`['DPackage']` per le view auto-create).
**Pattern di scrittura**: `view.appliableToClasses = newArray` via proxy → triggera `TRANSACTION` + `set_generic_entry` + `VIEWS_RECOMPILE_preconditions+=` (LViewElement:1565-1582). Confermato funzionante perché lo usa già il `<Select isMultiSelect>` in InfoData.tsx:189-195.
**No metodo `add`/`remove`** dedicato sul proxy: il flusso è array-replace via setter.

### D5. Classifier picker esistente?

**Pattern più vicino: `Info.forceConform`** (`frontend/src/components/editors/Info.tsx:565-585`).

```typescript
static forceConform(me: LObject) {
    let mm: LModel = Selectors.getLastSelectedModel().m2 as LModel;
    if (!mm) return <></>
    return(
        <div className="jj-field">
            <div className="jj-field-label">Force type</div>
            <select className="jj-slot-value-select" onChange={...} value={me.instanceof?.id || 'undefined'}>
                <optgroup label={mm.name}>
                    {(mm.classes || []).map( c =>
                        <option key={c.id} value={c.id}>{c?.name || c.id}</option>
                    )}
                    <option value={'undefined'}>Object</option>
                </optgroup>
            </select>
        </div>
    );
}
```

Limitazioni rispetto a B.1:
- **Single-select**, non multi.
- Hard-coded a `<select>` HTML, non al `<Select>` di Jjodel.
- Risolve il metamodello attivo via `Selectors.getLastSelectedModel().m2 as LModel` — funziona dal contesto LObject ma serve adattamento per LViewElement (i view non sono associati a un model attivo direttamente).
- Non riusa il pattern Jjodel di `MultiSelect` con `{value, label}`.

**Pattern multi-select disponibile**: `MultiSelect` (react-select) usato in `Info.tsx:331-341` per dependencies + nel `<Select isMultiSelect>` di Jjodel in `Input.tsx:336-403` (con styling jjodel-select preconfigurato — heights, padding, borderColor #e2e8f0, multiValue chips).

**Non esiste un componente `<ClassPicker>`/`<ClassifierPicker>`/`<MetamodelClassSelect>` riutilizzabile** nel codebase. Va creato (idealmente come piccolo helper in `views/data/` o riusando `<Select isMultiSelect>` con options dinamiche — vedi D9).

### D6. Lista classifier del metamodello attivo

**Strategie disponibili**, in ordine di preferenza:

(a) **`Selectors.getLastSelectedModel().m2`** (Info.tsx:566) → restituisce `LModel | undefined` del metamodello dell'M1 attivo. Da lì `mm.classes` (proxy LClass[]). **Limitazione**: per il view editor, l'utente non ha "selected model"; può non funzionare in WorkbenchProperties.

(b) **`useEditorMode`** (`frontend/src/components/editor-v2/hooks/useEditorMode.ts:43-71`) — hook React che restituisce `MetaclassInfo[]` con `id, name, isAbstract, attributes, references, concreteSubclasses`. Subscribed a Redux per reattività. Però è specifico del flow editor (richiede modelId).

(c) **Proxy LProject → activeViewpoint → indirettamente al metamodello** — il view editor è agnostico rispetto a un model specifico. Probabilmente serve passare un metamodel-id dal contesto (è il vero problema architetturale di B.1: una view può applicarsi a un classifier di **quale** metamodello?).

(d) **`LProject.getProject()?.metamodels`** o equivalente — da verificare. La proprietà `metamodels` esiste su LProject ma non l'ho letta in dettaglio; serve grep dedicato.

**Esempio runtime esistente di lettura**: `Info.forceConform` (a) e `useEditorMode` (b) sono i due esempi attivi. Il primo è non-reactive (lookup at-render); il secondo è reactive via useSelector.

**⚠️ Decisione architetturale aperta** (vedi Open Questions): **a quale metamodello bind il classifier-picker?** Se l'utente ha 2 metamodelli nel progetto, il view può applicarsi a un classifier di **uno** dei due, oppure di entrambi? Soluzione sensata: union di tutti i `LClass` di tutti i metamodelli del progetto, con label `metamodelName.className`.

### D7. `findApplicableEdgeView` attuale

**File**: `frontend/src/components/edgeOverlay/EdgeOverlay.tsx:299-325`.

```typescript
function findApplicableEdgeView(lObj: any, edgeViews: any[]): any | undefined {
    const cls = lObj && lObj.instanceof;
    const clsId: string | undefined = cls && cls.id;
    const clsName: string | undefined = cls && cls.name;
    if (!clsId && !clsName) return undefined;

    for (const view of edgeViews) {
        if (clsName && view.appliableTo === clsName) return view;       // ← essentially dead code (vedi D8)
        if (Array.isArray(view.appliableToClasses)) {
            for (const c of view.appliableToClasses) {
                if (typeof c === 'string') {
                    if (c === 'DObject') return view;                    // ← wildcard
                    if (c === clsId || c === clsName) return view;       // ← match per id O name
                } else if (c && (c.id === clsId || c.name === clsName)) {
                    return view;                                         // ← match Pointer-like object
                }
            }
        }
    }
    return undefined;
}
```

**Logica**:
1. Match `view.appliableTo === clsName` (riga 311) — branch quasi sempre falso, vedi D8.
2. Iterazione su `view.appliableToClasses`:
   - `'DObject'` letterale → wildcard (matcha qualunque DObject, indipendentemente dalla metaclass).
   - Stringa = clsId **o** clsName → match.
   - Oggetto con `.id` o `.name` → match (path object-like, non usato in pratica).

**Wildcard `'DObject'` carry-over**: già presente da sessioni precedenti (probabilmente SM project setup). Non è un effetto di sessioni passate, è il pattern **standard** per "applica a qualunque DObject", ed è il valore default che viene scritto da `lastViewpoint.ts:124` quando si crea una view auto.

**Tolleranza di Pointer reali**: il branch `else if (c && (c.id === clsId || c.name === clsName))` è già pronto per oggetti Pointer-like. Quindi se in futuro `appliableToClasses` contenesse oggetti `{id, name}` o LClass-proxy, **funziona già**. Storage backward-compatible.

**Conseguenza per B.1**: per legare una view a una classe specifica del metamodello, basta inserire **il classifier-id come stringa** nell'array `appliableToClasses` (case `c === clsId`) — non servono modifiche a `findApplicableEdgeView`. È puramente un lavoro UI.

### D8. Coesistenza `appliableTo` vs `appliableToClasses`

**Sono concetti ortogonali, non mutualmente esclusivi**:

- **`appliableTo: 'Any'|'Graph'|'GraphVertex'|'Vertex'|'Edge'|'EdgePoint'|'Field'`** — il **ruolo nel grafo** (renderizzo come Vertex? come Edge? come Graph?). Pilota anche `forceNodeType` via `set_appliableTo` (view.tsx:1535-1549).

- **`appliableToClasses: string[]`** — il **filtro del D-tipo** (matcha solo DObject? solo DClass? un classifier specifico?). Match a bassa priorità rispetto a OCL (`__info_of__appliableToClasses` view.tsx:885-889 dice esplicitamente: "lower priority than a OCL match. The same result can be obtained through OCL").

**`findApplicableEdgeView` line 311 (`view.appliableTo === clsName`)**: dato il tipo enum di `appliableTo` (7 valori-ruolo), questo branch può matchare **solo se** un utente nomina un proprio classifier letteralmente `'Vertex'` / `'Graph'` / etc. — caso patologico. **In pratica è dead code per scopi di filtro classifier**; serve solo come "se per caso un classifier si chiama uguale a un graph-role, prendiamolo lo stesso" — è una safety net senza valore reale.

**Priorità di match nel codice attuale (EdgeOverlay)**: linea 311 prima di linea 312-321. Quindi se un utente forzasse `view.appliableTo = "MyClassName"` (cast as any), vincerebbe sul filtro `appliableToClasses`. **Ma questa configurazione non è esposta dalla UI** (i dropdown di FieldData.tsx:25-33 e di "Preferred appearance" in InfoData.tsx propongono solo i 7 valori-ruolo).

**Risposta concreta alla decisione**: l'utente NON dovrebbe poter mettere `appliableTo: 'Vertex'` E `appliableToClasses: ['CC', 'XY']` con interferenza, perché i due campi misurano cose diverse. Il fatto che `findApplicableEdgeView` faccia un check `appliableTo === clsName` è un bug latente / safety net — non un comportamento desiderato.

### D9. Iniezione classifier picker in InfoData.tsx

**Posizione consigliata**: dentro il blocco `isV` esistente (linea 132-243), accanto al `<Select isMultiSelect>` di "Applicable to" (riga 184-196). Due alternative:

(A) **Estensione del dropdown esistente**: aggiungere un secondo optgroup "Specific classes" (oltre all'optgroup "" attuale con i 12 D-types), popolato dinamicamente con i classifier del/i metamodello/i del progetto. **Vantaggi**: zero churn UX, un solo controllo da capire. **Svantaggi**: richiede risoluzione del metamodello-attivo dentro InfoData (problema D6).

(B) **Componente separato sotto "Applicable to"**: nuovo `<ClassifierPicker>` (multi-select via `<Select isMultiSelect>` con options dinamiche) che scrive ANCH'ESSO su `view.appliableToClasses`. L'array conterrebbe sia stringhe `'DObject'` (categoria) sia stringhe `<classifierId>` (ID specifico). Layout: due `<div className="jj-field">` consecutivi. **Vantaggi**: separazione concettuale tra "tipo D" e "classifier specifico". **Svantaggi**: l'utente deve capire la differenza.

**Visibilità**: sempre visibile (non gated dietro `isEdge=true`), perché `appliableToClasses` è un concetto generale del view editor — non specifico edge. Confermo l'intuizione del prompt.

**Persistenza**: scrivere via proxy `view.appliableToClasses = mergedArray` (TRANSACTION free via setter `set_appliableToClasses`). Per (B): merger = filter via tipologia (string è ID-like se non in `EModelElements` enum).

---

## Blocco 3 — B.2 (`edgeRouting`)

### D10. Struttura attuale routing in EdgeOverlay

**File**: `frontend/src/components/edgeOverlay/EdgeOverlay.tsx`.

- **`chooseSides`** (line 405-424): input `(src: Bbox, tgt: Bbox)`, output `{srcSide: Side, tgtSide: Side}` (dove `Side = 'top'|'right'|'bottom'|'left'`). Sceglie le due side opposte/parallele in base al gap dominante (X o Y), con isteresi 1.05.
- **`sideMidpoint`** (line 432-439): `(b: Bbox, side: Side) → {x, y}`. Punto medio della side scelta in coord. assolute.
- **`buildPathFromSides`** (line 451-490): `(src, srcSide, tgt, tgtSide) → string | null`. Costruisce il path SVG con 1-3 segmenti `L` (Z opposite, L perpendicular, defensive null per same-side).
- **`roundManhattanPath`** (importato da `editor-v2/utils/edgeUtils:512`, chiamato a line 288 con radius 8): trasforma `M x y L x y L x y` in `M x y L x y A r r 0 0 s x y L x y...`.

**"Main loop"** del rendering — il `<g>` mappa `edges` (line 92-99), e ogni edge viene renderizzato da **`EdgeRenderItem`** (React.memo, line 263-290). La pipeline `chooseSides → sideMidpoint × 2 → buildPathFromSides → roundManhattanPath` vive tutta dentro `EdgeRenderItem`:

```typescript
const EdgeRenderItem = React.memo(function EdgeRenderItem({srcRect, tgtRect}) {
    const srcBbox: Bbox = { cx: srcRect.x + srcRect.w / 2, cy: srcRect.y + srcRect.h / 2,
                            hw: srcRect.w / 2, hh: srcRect.h / 2 };
    const tgtBbox: Bbox = { cx: tgtRect.x + tgtRect.w / 2, cy: tgtRect.y + tgtRect.h / 2,
                            hw: tgtRect.w / 2, hh: tgtRect.h / 2 };
    const sides = chooseSides(srcBbox, tgtBbox);
    const srcPoint = sideMidpoint(srcBbox, sides.srcSide);
    const tgtPoint = sideMidpoint(tgtBbox, sides.tgtSide);

    if (srcPoint.x === tgtPoint.x && srcPoint.y === tgtPoint.y) return null;

    const rawPath = buildPathFromSides(srcPoint, sides.srcSide, tgtPoint, sides.tgtSide);
    if (!rawPath) return null;

    const d = roundManhattanPath(rawPath, 8);
    return <path className="jjodel-edge-overlay__path" d={d} />;
}, edgePropsEqual);
```

**Punto di iniezione del switch routing**: dentro `EdgeRenderItem`, **dopo** `sideMidpoint × 2`, **prima** della scelta del builder. Pseudocodice: `switch (routing) { case 'straight': return straightPath(srcPoint, tgtPoint); case 'manhattan-rounded': /* attuale */; case 'bezier': return bezierPath(srcPoint, sides.srcSide, tgtPoint, sides.tgtSide); }`. Il routing va passato come prop a `EdgeRenderItem` (richiede aggiornamento di `EdgeRenderItemProps` + `selectorResultEqual` + `EdgeData` per non rompere il memoization equality check).

### D11. `roundManhattanPath` import

**Confermato**: `frontend/src/components/editor-v2/utils/edgeUtils.ts:512`, signature `(path: string, radius: number = 4) => string`. Pura `(string) => string`, no side effect. Parsa le coppie `M`/`L`, rimuove segmenti degeneri, inserisce `A r r 0 0 sweep x y` ai 90° corner.

**Non riusabile per bezier**: il bezier non passa per Manhattan a 90°; ha bisogno di control points. `roundManhattanPath` opera SOLO su path con segmenti perpendicolari.

### D12. Pattern bezier esistente nel codebase

**Sì, già presente**: `computeSelfLoopPath` (`frontend/src/components/editor-v2/utils/edgeUtils.ts:605-622`).

```typescript
export function computeSelfLoopPath(sourceX, sourceY, targetX, targetY): string {
    const size = 30;
    const cp1X = sourceX + size;
    const cp1Y = sourceY - size * 0.5;
    const cp2X = targetX + size * 0.5;
    const cp2Y = targetY - size;
    return `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;
}
```

Cubic Bezier `C` operator. Però è **specializzato per self-loop** (esce a destra, rientra dall'alto). Non riusabile direttamente per il routing generale, ma fornisce il pattern `M x y C cp1x cp1y, cp2x cp2y, x y`.

**Anche `EdgeBendingMode.Bezier_quadratic`** (default in Constructors.DViewElement riga 1185, `bendingMode = EdgeBendingMode.Bezier_quadratic`) esiste ma è il sistema legacy del flow editor (non classic — l'L2 overlay non legge `bendingMode`).

**Mini-spec per `bezierPath` in B.2**: ~30 righe inline in `EdgeOverlay.tsx`, signature `(src: {x,y}, srcSide: Side, tgt: {x,y}, tgtSide: Side) => string`. Cubic Bezier con tangent length proporzionale alla distanza (es. `len = Math.hypot(dx, dy) * 0.4`), control points spostati dalla side di uscita di `len` lungo la normale (es. srcSide='right' → `cp1 = src + (len, 0)`). Output: `M sx sy C cp1x cp1y, cp2x cp2y, tx ty`. Da preferire inline (no estrazione in edgeUtils.ts) per simmetria con `chooseSides`/`sideMidpoint`/`buildPathFromSides` che vivono già dentro EdgeOverlay.tsx.

### D13. `docs/parked/` orthogonal multi-elbow

**Directory esiste**: `/Users/alfonso/jjodel/docs/parked/`. Contenuto:
- `manhattanRouting.ts.parked` (6.7 KB) — geometria orthogonal multi-elbow, parcheggiata 2026-05-02.
- `README.md` (1.5 KB) — spiega lo stato.
- `sessione_2026-05-07_pan_architecture_notes.md` (15 KB) — note non pertinenti a B.2.

**README rilevante** (excerpt):
> `manhattanRouting.ts.parked` — Status: implementato, ma non funzionante.
> What to keep: `getOutgoingSide`, `computeSideAnchor`, `projectionsOverlap`, `computeManhattanPath` sono **corretti in isolamento**. Self-edge handling, multi-edge distribution: usable as-is.
> Likely correct injection point: wrap `LVoidEdge.get_d(c)` AFTER segments are stable (post-snap, post-labels). Take the final SVG path as input and apply Manhattan transformation, similar to roundManhattanPath in editor-v2/utils/edgeUtils.ts:512.

**Helpers parked**: `getOutgoingSide` (8-way cardinal), `computeSideAnchor` (distribuisce N edge sulla stessa side), `computeManhattanPath` (L vs Z decision via projection overlap). Tutti pure functions geometriche, riutilizzabili in futuro per multi-elbow se serve.

**Conferma**: l'opzione "orthogonal" (multi-elbow Z/L distribuito) è parcheggiata in modo recuperabile. **NON va riintrodotta in B.2**. `edgeRouting` proporrà solo `straight` / `manhattan-rounded` / `bezier`.

### D14. Pattern dropdown UI a set finito

**Pattern dominante in Jjodel**: `<Select>` dal joiner (alias di `<Input tag="select">`, vedi Input.tsx:333-413). In InfoData.tsx già usato per "Preferred appearance" (157-181) e "Applicable to" (multi). Signature:

```tsx
<Select
    data={view}
    field={'edgeRouting'}              // nuovo campo
    readOnly={readOnly}
    options={<>
        <option value={'manhattan-rounded'}>Manhattan (rounded)</option>
        <option value={'straight'}>Straight</option>
        <option value={'bezier'}>Bezier curve</option>
    </>}
    setter={(val) => { (view as any).edgeRouting = val; }}
    getter={(data) => (data as any).edgeRouting || 'manhattan-rounded'}
/>
```

In alternativa, pattern più leggero (FieldData.tsx:34-43):
```tsx
<label className="input-container">
    <p>Routing:</p>
    <Select data={view} field="edgeRouting" options={<optgroup>...</optgroup>}
            getter={...} setter={...} />
</label>
```

Per coerenza con gli altri controlli edge in InfoData.tsx, **adottare il pattern `<div className="jj-field"> + <div className="jj-field-label"> + <Select>`** (come "Preferred appearance" 152-181). Posizione: **subito dopo** Edge Target, ancora dentro il blocco `(view as any).isEdge && <>...</>` (113-130) — il routing ha senso SOLO se la view è isEdge. Visibilità gated.

---

## Open questions / decisioni da prendere prima dei prompt operativi

1. **(B.1) A quale metamodello bind il classifier-picker?** Caso multi-metamodel nel progetto: union di tutti i classifier (label `mmName.className`) o solo del metamodello "attivo"? (Oggi InfoData non sa quale metamodel è attivo.) **Decisione richiesta**: scegliere strategia per `mm` resolution (Selectors.getLastSelectedModel().m2 vs LProject.metamodels). Implementabile con (A) singolo metamodel = quello attivo dell'editor, (B) tutti i metamodel del progetto unionati.

2. **(B.1) Integrazione UI: estendere optgroup esistente o nuovo controllo separato?** L'attuale `<Select isMultiSelect>` di "Applicable to" usa optgroup vuoto + 12 D-type options. Aggiungere un secondo optgroup "Classes from <Metamodel>" con le LClass dinamiche è la soluzione più compatta (preferita), ma serve confermare che la UI non diventi confusa quando l'utente mescola tipi astratti (`DClass`) e classifier specifici (`MyClass`).

3. **(B.1) `appliableTo === clsName` (EdgeOverlay:311) — rimuovere o lasciare?** Branch effettivamente dead code (vedi D8). Lasciarlo intatto in B.1 per non fare scope creep, oppure rimuoverlo in fase di cleanup. **Suggerimento**: lasciarlo, no rischio di rottura.

4. **(B.2) Default di `edgeRouting`**: confermare `'manhattan-rounded'` come default (retro-compatibilità con il rendering attuale). Migration 2.214→2.215 popolerà tutte le DV esistenti con questo valore.

5. **(B.2) Bezier: implementazione inline o estrazione in edgeUtils.ts?** Il prompt suggerisce inline (~30 righe). Confermare per simmetria con `chooseSides`/`buildPathFromSides` che vivono in EdgeOverlay.tsx. La firma proposta è `bezierPath(src, srcSide, tgt, tgtSide) → string`, con tangent length = `Math.hypot(dx, dy) * 0.4`.

6. **(B.2) Tipizzazione `edgeRouting`**: `string` libero o union literal `'straight' | 'manhattan-rounded' | 'bezier'`? Se aggiunto come campo tipizzato su DViewElement (ed eventualmente su LViewElement), preferire union literal per type safety nel JSX e nel switch dell'EdgeRenderItem.

7. **(B.1+B.2) Tipizzazione di `isEdge`/`edgeSource`/`edgeTarget` su LViewElement.** Cleanup parallelo possibile: aggiungere le 3 dichiarazioni esplicite + `__info_of__*` su LViewElement (~15 righe in view.tsx vicino a riga 891). Eliminerebbe i 5 cast `(view as any)` in InfoData.tsx. **Scope check**: appartiene a B.1, B.2, o un cleanup separato? Dovrebbe essere un piccolo prompt indipendente "L2 Pack B.0 — typing cleanup".

8. **(B.1) Workbench Properties duplicate?** `WorkbenchProperties.tsx` rendere ViewProperties separato — verificare se anche lì viene mostrato `appliableToClasses`. Non l'ho ispezionato; se sì, va aggiornato in parallelo.
