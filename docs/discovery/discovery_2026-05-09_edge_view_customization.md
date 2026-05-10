# Discovery — Edge View Customization (V1)

**Data**: 2026-05-09
**Tipo**: Fase A read-only
**Scope**: mappare i punti di iniezione e di estensione necessari per aggiungere
quattro nuovi campi al pannello "View for Edge" del classic editor:
`edgeLabel` (espressione JjEL, opzionale), `edgeStrokeColor` (token semantico),
`edgeStrokeWidth` (numero, default 1.5), `edgeStrokeStyle`
(`solid` | `dashed` | `dotted`).

Marker fuori scope. **Hard stop** dopo questo report.

## Sommario esecutivo

L'aggiunta è ortogonale al codebase: l'unico consumatore runtime di
`isEdge / edgeSource / edgeTarget / edgeRouting` è
`frontend/src/components/edgeOverlay/EdgeOverlay.tsx`, che renderizza un
`<path className="jjodel-edge-overlay__path" d={d} />` con stile fissato in
SCSS (`#334155`, `1.5px`, `stroke-linecap: round`). I quattro nuovi campi si
iniettano allo **stesso livello del routing**: il valore arriva dentro la
`SelectorResult.edges[i]` (`buildSelectorResult`, riga 115-221) e viene
applicato in `EdgeRenderItem` (riga 293-327) come attributi inline sul `<path>`
(stroke / stroke-width / stroke-dasharray) e come secondo elemento `<text>`
calcolato sul midpoint del path per il label. Nessuna modifica a
`jsxString`, nessun ricompilation, nessun bump di VersionFixer richiesto.

Il flow editor v2 (`hooks/useJjomSync.ts`, `sync/syncState.ts`,
`edges/UnifiedEdge.tsx`) **non legge** alcun campo `view.*` di edge: l'unico
"isEdge" presente è la helper `isEdgeClassName(className)`
(`useJjomSync.ts:189`) che ispeziona il className D-layer (`DVoidEdge`,
`DRefEdge`, ecc.) e nulla ha a che fare con `DViewElement.isEdge`. Aggiungere
campi opzionali al `DViewElement` è quindi safe per V2.

`edgeStrokeColor` è una scelta da palette di token semantici SCSS già esistenti
in `styles/tokens/_colors-light.scss` (linee 233-241): in particolare
`--color-edge-default`, `--color-canvas-accent`, `--color-error`,
`--color-warning`, `--color-success`, `--color-info`. La proposta a Sezione 6
è una mapping mnemonica di 6 voci.

L'editor JjEL riusabile per `edgeLabel` esiste: è il componente generico
`<Input data={view} field={'<key>'} readOnly={...} />` esportato da
`frontend/src/components/forEndUser/Input.tsx`. È quello già usato
identicamente da `edgeSource` e `edgeTarget` in
`InfoData.tsx:201,208`.

`<text>` SVG **non** è oggi mai renderizzato da `EdgeOverlay`. Il classic
editor genera label sugli edge M2 attraverso un percorso completamente
diverso (`LVoidEdge.get_d()` + `GraphDataElements.tsx`), che non si tocca per V1.

## 1. Rendering SVG edge classic

**File di iniezione**: `frontend/src/components/edgeOverlay/EdgeOverlay.tsx`.

**Punto esatto** in cui oggi si applica `edgeRouting` per produrre il path
SVG runtime (riga 198-202 + 316-326):

```tsx
// 198-202 — pull del valore con narrowing difensivo
const routing: EdgeRouting = (view.edgeRouting === 'straight' || view.edgeRouting === 'bezier')
    ? view.edgeRouting
    : 'manhattan-rounded';
edges.push({ id: obj.id, srcRect, tgtRect, routing });

// 316-327 — branching del path "d" in EdgeRenderItem
let d: string;
if (routing === 'straight') {
    d = `M ${srcPoint.x} ${srcPoint.y} L ${tgtPoint.x} ${tgtPoint.y}`;
} else if (routing === 'bezier') {
    d = bezierPath(srcPoint, sides.srcSide, tgtPoint, sides.tgtSide);
} else {
    const rawPath = buildPathFromSides(srcPoint, sides.srcSide, tgtPoint, sides.tgtSide);
    if (!rawPath) return null;
    d = roundManhattanPath(rawPath, 8);
}
return <path className="jjodel-edge-overlay__path" d={d} />;
```

Lo stile attuale del `<path>` arriva via CSS (`EdgeOverlay.scss:25-30`):

```scss
&__path {
    fill: none;
    stroke: #334155;          /* slate-700, hard-coded */
    stroke-width: 1.5px;      /* hard-coded */
    stroke-linecap: round;
}
```

**Pattern di iniezione confermato per V1** — analogo a `edgeRouting`:

1. **Selector layer** (`buildSelectorResult`, ~riga 198): legge i quattro
   nuovi campi dal `view: any` (DViewElement raw) con narrowing difensivo
   per i valori invalidi/`undefined` (caso istanze pre-V1):

```ts
// pseudo, NON DA SCRIVERE NEI FILE
const strokeColor = (typeof view.edgeStrokeColor === 'string' && view.edgeStrokeColor) || 'default';
const strokeWidth = (typeof view.edgeStrokeWidth === 'number' && view.edgeStrokeWidth > 0) ? view.edgeStrokeWidth : 1.5;
const strokeStyle = (view.edgeStrokeStyle === 'dashed' || view.edgeStrokeStyle === 'dotted') ? view.edgeStrokeStyle : 'solid';
const labelExpr = (typeof view.edgeLabel === 'string' && view.edgeLabel) ? view.edgeLabel : '';
```

   Spinge `strokeColor`, `strokeWidth`, `strokeStyle`, `labelText`
   (label valutato qui, vedi nota sotto) nella `EdgeData` insieme a
   `routing`.

2. **Render layer** (`EdgeRenderItem`, ~riga 326): rimpiazza
   `<path className="jjodel-edge-overlay__path" d={d} />` con un `<g>`
   contenitore + `<path>` con attributi inline + opzionale `<text>`:

```tsx
// pseudo
<g>
  <path
    d={d}
    fill="none"
    stroke={resolveStrokeColorVar(strokeColor)}      // var(--color-...)
    strokeWidth={strokeWidth}
    strokeDasharray={strokeStyle === 'dashed' ? '6 4' : strokeStyle === 'dotted' ? '2 3' : undefined}
    strokeLinecap="round"
  />
  {labelText && <text x={mid.x} y={mid.y} className="jjodel-edge-overlay__label">{labelText}</text>}
</g>
```

   Aggiornare `edgePropsEqual` (riga 329-334) per includere i quattro nuovi
   campi nell'eq check, altrimenti la `React.memo` riusa il render stale.

3. **SCSS layer** (`EdgeOverlay.scss`): rimuovere `stroke` e `stroke-width`
   da `&__path` (ora vengono dagli attributi inline) ma mantenere
   `fill: none; stroke-linecap: round;`. Migrare il default fallback per
   `strokeColor='default'` a `var(--color-edge-default)` (token già
   esistente in entrambi i temi).

   Aggiungere stile per `&__label` (font, fill da token, paint-order per
   bordatura leggibile su sfondi vari).

**Valutazione `labelText`**: la valutazione di `view.edgeLabel` (espressione
JjEL) deve avvenire **nel selector** (non nel render), per due motivi:
(a) `EdgeRenderItem` è memoizzato e non vede Redux; (b) il selector ha già
accesso a `evalFn = w.evalEdgeExpression` (riga 123), lo stesso fn usato per
`edgeSource`/`edgeTarget`. L'output diventa un campo `label?: string`
sull'`EdgeData`. Coercion a string + truncation/sanitization a
discrezione di Fase B.

**Conclusione**: il punto di iniezione corretto è la coppia
`buildSelectorResult` → `EdgeRenderItem` di `EdgeOverlay.tsx`, con
piccolo aiuto da SCSS. Non si tocca `LVoidEdge.get_d()`, non si tocca
`get_segments_impl()`, non si tocca il template `jsxString`.

## 2. DViewElement — struttura, Redux actions, extensibility

**File tipi**:
- `frontend/src/joiner/classes.ts:1074-1221` — `Constructors.DViewElement` (assegna i default su `thiss`).
- `frontend/src/view/viewElement/view.tsx:200-347` — `class DViewElement`
  (campi e shape D-layer).
- `frontend/src/view/viewElement/view.tsx:349-...` — `class LViewElement`
  (proxy L-layer + `__info_of__<name>: Info` per autogeneration UI).

**Campi attualmente nel pannello "View for Edge" — InfoData.tsx + auto-render
EdgeData.tsx** (estratto dei rilevanti, in ordine di apparizione UI):

| Campo | Tipo TS | Default (Constructors) | Apply to (InfoData manual) | Options auto (EdgeData) | Action di scrittura |
|-------|---------|------------------------|----------------------------|-------------------------|---------------------|
| `name` | `string` | n/a | sì (riga 157) | no | `view.name = ...` (proxy L) |
| `isExclusiveView` | `boolean` | n/a | sì (riga 167) | no | `view.isExclusiveView = ...` |
| `isEdge` | `boolean` | `false` (1197) | sì (riga 187) | sì | `view.isEdge = ...` |
| `edgeSource` | `string` (JjEL) | `''` (1198) | sì (riga 201) | sì | `view.edgeSource = ...` |
| `edgeTarget` | `string` (JjEL) | `''` (1199) | sì (riga 208) | sì | `view.edgeTarget = ...` |
| `edgeRouting` | `'straight' \| 'manhattan-rounded' \| 'bezier'` | `'manhattan-rounded'` (1200) | sì (riga 217) | sì | `view.edgeRouting = ...` |
| `explicitApplicationPriority` | `number?` | undefined | sì (riga 240) | — | `view.explicitApplicationPriority = ...` |
| `forceNodeType` | `string?` | undefined | sì (riga 258) | — | `view.forceNodeType = ...` |
| `appliableToClasses` | `string[]` | `[]` | sì (riga 290) | — | `view.appliableToClasses = ...` |
| `viewpoint` (via `father`) | `Pointer<DViewPoint>` | derivato | sì (riga 306) | — | `view.father = ...` |
| `father` (parent view) | `Pointer<DViewElement>?` | undefined | sì (riga 325) | — | `view.father = ...` |
| OCL/JS conditions | `string` | `''` | sì (riga 335-341) | — | `view.oclCondition = ...` / `jsCondition` |

**Pattern di scrittura**: TUTTI i campi vengono scritti via assegnazione
diretta sul proxy LViewElement (es. `view.edgeSource = '...'`). Il proxy
intercetta e dispatcha internamente l'`SetFieldAction` corrispondente. NON si
chiamano `SetFieldAction.new(...)` esplicitamente in InfoData/EdgeData (eccezione:
`TRANSACTION` esplicito alla riga 139 di InfoData per applicare suggestions multiple).

**Meccanismo "extensible"**: parziale ma sufficiente. Esistono **due meccanismi
indipendenti** che riusano metadata:

1. **Auto-render in EdgeData (Options tab)** — `EdgeData.tsx:21-32` itera
   tutti i `__info_of__*` di `LViewElement.singleton` e renderizza una riga
   `<GenericInput>` per ogni `Info` con `isEdge: true && !hidden && !obsolete && !todo`.
   Questo significa che un nuovo campo aggiunto con `__info_of__<name>: Info = {isEdge: true, ...}`
   appare AUTOMATICAMENTE sotto Options > Edge senza nessun edit di EdgeData.tsx.

   Conseguenza per V1: i quattro nuovi campi, se annotati con `isEdge: true`,
   verranno auto-renderizzati anche in Options (oltre alla collocazione
   manuale in Apply to / Style). Per evitare doppia esposizione UI:
   **mark con `hidden: true` nel `__info_of__<name>`** quei campi che
   appaiono nei tab manualmente curati, oppure accettare la duplicazione (oggi
   `edgeRouting` è duplicato e funziona).

2. **VersionFixer migrations** (`redux/VersionFixer.tsx:649-708`) — pattern
   per aggiungere campi a istanze già persistenti. Esempio 2.214 → 2.215:
   ```ts
   if (typeof e.edgeRouting !== 'string') { e.edgeRouting = 'manhattan-rounded'; migrated++; }
   ```
   Il pattern guarda al typeof, è idempotente, applica a `DViewElement` e
   `DViewPoint` (subclass).

**Proposte aggiunte V1 al `DViewElement`** (4 campi):

| Nome | Tipo TS | Default (Constructors) | Render condition | __info_of__ Info |
|------|---------|------------------------|------------------|------------------|
| `edgeLabel` | `string` (JjEL expr) | `''` | `view.isEdge === true` | `{isEdge: true, hidden: true, label: 'Edge Label', ...}` |
| `edgeStrokeColor` | `string` (token id) | `'default'` | `view.isEdge === true` | `{isEdge: true, hidden: true, label: 'Edge Stroke Color', ...}` |
| `edgeStrokeWidth` | `number` | `1.5` | `view.isEdge === true` | `{isEdge: true, hidden: true, label: 'Edge Stroke Width', ...}` |
| `edgeStrokeStyle` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | `view.isEdge === true` | `{isEdge: true, hidden: true, label: 'Edge Stroke Style', ...}` |

`hidden: true` nelle `Info` impedisce auto-render in EdgeData (Options tab),
mantenendo il rendering controllato da InfoData (Apply to) e PaletteData
(Style). Decisione finale a Fase B; alternative al "hidden:true" sono in §8.

**Pattern di default opzionale (zero-migration)**: invece di settare default
in `Constructors` e migrare istanze esistenti via VersionFixer, V1 può
adottare il pattern di `edgeRouting` lato consumer: il selector di
`EdgeOverlay.tsx` applica narrowing difensivo (`?? defaultValue`), così
istanze pre-V1 con `edgeStrokeColor === undefined` ricevono comunque il
default a runtime. **Conferma con l'utente in Fase B se preferisce
zero-migration o "default in Constructors + skip VersionFixer" (entrambi
soddisfano il vincolo "Niente VersionFixer bump").**

## 3. Label edge classic

**Esiste oggi `<text>` SVG su edge nel classic editor?**

In `EdgeOverlay.tsx`: NO. La selettività `<svg> > <g> > <path>` è terminale,
non c'è alcun `<text>` o `<tspan>`. Verificato con grep `<text` su
`EdgeOverlay.tsx` → 0 occorrenze.

Le label degli edge M2 (cardinality, nome reference) del classic editor
**non passano per EdgeOverlay**. Vengono renderizzate dalla pipeline
`LVoidEdge.get_d()` + `LEdgePoint` + `GraphDataElements.tsx` (linee
~2000-2600), una macchinaria multi-segmento radicalmente diversa, basata
su HTML in `jsxString` per i label e sul `<path>` SVG per la linea.

**Conclusione**: per V1 il label non si "estende" da una utility esistente
nell'overlay — va aggiunto ex novo. Il punto è **dentro `EdgeRenderItem`**
(`EdgeOverlay.tsx:293-327`), dopo il `<path>`:

```tsx
// pseudo
return (
    <g>
        <path d={d} ...stroke props... />
        {labelText && (
            <text
                x={midX}
                y={midY}
                className="jjodel-edge-overlay__label"
                textAnchor="middle"
                dominantBaseline="middle"
            >
                {labelText}
            </text>
        )}
    </g>
);
```

**Calcolo del midpoint**: dipende dal routing.

| Routing | Midpoint proposto |
|---------|-------------------|
| `straight` | media aritmetica `srcPoint` / `tgtPoint` |
| `manhattan-rounded` | midpoint del path raw prima del rounding (i.e. il vertice centrale del Z di `buildPathFromSides`, oppure il midpoint del segmento più lungo) |
| `bezier` | parametro `t = 0.5` su Bézier cubica — trivialmente computabile dalle coordinate `cp1`, `cp2` con la formula di De Casteljau |

Nessuna utility esistente in `edgeUtils.ts` calcola un midpoint percentuale
di un SVG path: **`getPointAtLength` del DOM è un'opzione** (zero deps), ma
richiede di renderizzare il path prima di leggerlo (offscreen `<path>` o due
passi). L'approccio più semplice in V1: calcolare il midpoint a partire
dalle stesse strutture (`srcPoint`, `tgtPoint`, `sides`) usate per costruire
`d`, senza riparsare il path.

**Decisione aperta a Fase B**: scegliere se il midpoint sia il "centro
geometrico del path" o "midpoint del segmento più lungo del path Manhattan"
(due semantiche differenti per Z-shape). §8 riprende la scelta.

**Stile del label**: tokens disponibili in `_colors-light.scss:236-242`:
- `--color-edge-label-bg: rgba(255, 255, 255, 0.9)` (per pillola opzionale)
- `--color-edge-label-text: #{$slate-600}` (#475569)
- `--color-edge-label-text-selected: #0e7490`

Font: SI usa il body font globale. Per leggibilità su sfondi vari l'opzione
più robusta è **paint-order: stroke fill** con `stroke="#fff"
stroke-width="3"` come halo (pattern noto SVG senza pillola di sfondo).

## 4. Pannelli View — file dei tab "Apply to" e "Style"

**Wrapper di tab**: `frontend/src/components/editors/views/ViewData.tsx:48-103`.
La lista `tabs[]` è dichiarativa e include sei tab condizionali; quelli
rilevanti per V1:

| Tab | render | Componente sorgente |
|-----|--------|---------------------|
| `apply-to` | `<InfoData />` | `data/InfoData.tsx` |
| `style` | `<PaletteData />` | `data/PaletteData.tsx` |
| `options` | `<GenericNodeData />` (auto-render Edge / Node / EdgePoint sub-data) | `data/GenericNodeData.tsx` → `data/EdgeData.tsx` |

### 4a. Tab "Apply to" — `data/InfoData.tsx`

**Struttura attuale rilevante** (riga 194-228):

```tsx
{view.isEdge && (
    <>
        <div className="jj-field">
            <label className="jj-field-label">Edge Source ...</label>
            <Input data={view} field={'edgeSource'} readOnly={readOnly} />
        </div>
        <div className="jj-field">
            <label className="jj-field-label">Edge Target ...</label>
            <Input data={view} field={'edgeTarget'} readOnly={readOnly} />
        </div>
        <div className="jj-field">
            <label className="jj-field-label">Edge Routing ...</label>
            <Select data={view} field={'edgeRouting'} ... />
        </div>
    </>
)}
```

**Punto di inserimento per `edgeLabel`**: subito **dopo** il blocco
`<Select>` di Edge Routing (riga 227 chiude il `<Select>`, riga 228 chiude
il `</>`). Il nuovo blocco va condizionato `view.isEdge && (...)` come tutti
gli altri.

```tsx
// pseudo, posizione: dopo il </Select> del routing
<div className="jj-field">
    <label className="jj-field-label">
        Edge Label
        <InfoTooltip text="JjEL expression evaluating to a string used as the edge label. Empty value means no label." />
    </label>
    <Input data={view} field={'edgeLabel'} readOnly={readOnly} />
</div>
```

**Nota**: il pattern `<Input data={view} field={'edgeLabel'} />` è
identico ai pattern esistenti (riga 201, 208). Nessun adattamento serve.

### 4b. Tab "Style" — `data/PaletteData.tsx` (alias `<PaletteData />` mappato su Style)

**Struttura attuale**:

PaletteData rappresenta il tab "Style" (vedi `ViewData.tsx:67-75` —
`label: 'Style', render: PaletteData`). Il file ha due sezioni principali:

1. **Style Variables** (`PaletteData.tsx:358-707`) — palette user-defined
   (color, path, number, text), aggiunte via dropdown "+ Add" con quattro
   tipi.
2. **CSS Editor** (`PaletteData.tsx:712-779`) — Monaco editor LESS/CSS,
   raw text.

**Comportamento attuale rispetto a `isEdge=true`**: nessuno. Il tab Style
mostra gli stessi controlli per node e per edge views — la palette user-
defined è orientata a stile generale del componente, non specifico edge
(eccetto `path` per marker shapes che indirettamente serve agli edge).

**Punto di inserimento V1 — sezione "Edge Style"**: nuova section in cima
al render, condizionata `view.isEdge && (...)`. Tre `<div className="jj-field">`
analoghi a InfoData per:

- `edgeStrokeColor` — `<Select>` con options dai token semantici (vedi §6)
- `edgeStrokeWidth` — `<Input type="number" min={0.5} max={10} step={0.25}>`
- `edgeStrokeStyle` — `<Select>` con `solid | dashed | dotted`

Pattern di markup proposto (allineato a InfoData lines 194-228):

```tsx
// pseudo
{view.isEdge && (
    <section className="edge-style-section">
        <h6>Edge Style</h6>
        <div className="jj-field">
            <label className="jj-field-label">Stroke Color</label>
            <Select data={view} field={'edgeStrokeColor'} ...>
                <option value="default">Default</option>
                <option value="accent">Accent</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
                <option value="muted">Muted</option>
            </Select>
        </div>
        <div className="jj-field">
            <label className="jj-field-label">Stroke Width</label>
            <Input data={view} field={'edgeStrokeWidth'} type="number" ... />
        </div>
        <div className="jj-field">
            <label className="jj-field-label">Stroke Style</label>
            <Select data={view} field={'edgeStrokeStyle'} ...>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
            </Select>
        </div>
    </section>
)}
```

**Decisione aperta a Fase B**: posizione precisa nella sezione Style —
sopra "Style Variables" o sotto. Posizione sopra è raccomandata per
visibilità (l'utente che ha appena toggleato `isEdge` cerca subito gli
strumenti di stile dell'edge). §8 lo riprende.

**Pattern di riuso disponibili**:
- `<Input>`, `<Select>` da `joiner` (`components/forEndUser/Input.tsx`)
- Classi CSS `jj-field`, `jj-field-label`, `jj-info-icon-wrapper`,
  `jj-info-tooltip` già stilate in `viewapplyto.scss`
- `InfoTooltip` (helper locale a InfoData.tsx:32-43) — può essere copiato
  in PaletteData (pattern già accettato; riga 31 di InfoData motivava la
  copia rispetto a non poter toccare Info.tsx)
- `<Toggle>` da `components/ui/` se servisse un toggle inline (non serve in V1)

## 5. Editor JjEL riusabile

**Componente attuale**: `Input` da `frontend/src/components/forEndUser/Input.tsx`,
re-esportato via `frontend/src/joiner/components.tsx:35`.

**Props rilevanti** (`Input.tsx:91-200+`):
```ts
{
    data: LPointerTargetable,    // il proxy LViewElement
    field: keyof D,              // nome del campo, es. 'edgeSource'
    readOnly?: boolean,
    type?: 'text' | 'number' | ...,  // default 'text'
    getter?: (data, field) => any,
    setter?: (val, data, field) => void,
    tooltip?: boolean | string,
    autosize?: boolean,
    placeholder?: string,
    label?: ReactNode,
    jsxLabel?: ReactNode,
    ...
}
```

**Uso identico in InfoData.tsx per JjEL strings** (riga 201, 208):
```tsx
<Input data={view} field={'edgeSource'} readOnly={readOnly} />
<Input data={view} field={'edgeTarget'} readOnly={readOnly} />
```

**Riusabile per `edgeLabel`?** SÌ, identicamente:
```tsx
<Input data={view} field={'edgeLabel'} readOnly={readOnly} />
```

**Valore vuoto ("no label")**: gestito naturalmente. Il default `''` (stringa
vuota) è accettato dall'`<input type="text">`, e il selector
`buildSelectorResult` in `EdgeOverlay.tsx` deve trattare `'' === noLabel`
(vedi §1, narrowing).

**Limitazione nota**: l'`Input` standard NON ha syntax-highlighting JjEL.
`edgeSource` / `edgeTarget` oggi sono plain text input. Per V1 questo è
acceptable (consistency con i campi gemelli). Una `MonacoLite`
eventuale è scope V2.

**Nessun adattamento richiesto** per l'integrazione di V1.

## 6. Palette colori SCSS

**File tokens (single source of truth)**:
- `frontend/src/styles/tokens/_colors-light.scss` (linee 1-326)
- `frontend/src/styles/tokens/_colors-dark.scss` (linee 1-...)

Entry point: `frontend/src/styles/tokens/index.scss`. Variabili attive in
`frontend/src/styles/variables.scss`. Il regolamento dal CLAUDE.md
("Aggiungere SEMPRE in entrambi i file light + dark") vale anche qui.

### Variabili edge esistenti (light)

| Token CSS | Valore light | Valore dark | Note d'uso |
|-----------|--------------|-------------|-----------|
| `--color-edge-default` | `#{$slate-400}` = `#94a3b8` | `#64748b` (slate-500) | Default edge stroke |
| `--color-edge-selected` | `var(--color-canvas-accent)` = `#06b6d4` | `var(--color-canvas-accent)` | Edge selezionato |
| `--color-edge-marker-fill` | `#ffffff` | `#1e293b` | Fill marker hollow |
| `--color-edge-label-bg` | `rgba(255,255,255,0.9)` | `rgba(30,41,59,0.9)` | BG pillola label |
| `--color-edge-label-text` | `#{$slate-600}` = `#475569` | `#94a3b8` | Testo label |
| `--color-edge-cardinality-bg` | `rgba(255,255,255,0.85)` | — | BG cardinalità |
| `--color-edge-cardinality-text` | `#{$slate-400}` = `#94a3b8` | `#64748b` | Testo cardinalità |

**Nota** — `EdgeOverlay.scss:27` usa `stroke: #334155` (slate-700) hard-coded:
NON è `--color-edge-default` (slate-400). Differenza intenzionale per L2: il
darker-than-default migliora visibilità del path overlay che vive sopra le
card. V1 dovrebbe **mantenere `#334155` come token "default"** per il caso
classic-overlay specifico, oppure migrare a `var(--color-edge-default)`
omogeneo. Decisione aperta in §8.

### Tassonomia semantica proposta per `edgeStrokeColor`

V1 espone una scelta a 6 voci, ciascuna mappata a un token già esistente.
Il valore stored è il token id (string), risolto da una utility `resolveStrokeColorVar(token)`
nel selector di `EdgeOverlay.tsx`.

| Token id (storage) | Label UI | Variabile CSS risolta (light) | Variabile CSS risolta (dark) | Razionale |
|--------------------|----------|-------------------------------|------------------------------|-----------|
| `default` | "Default" | `var(--color-edge-default)` | idem (auto-themed) | Comportamento attuale, fallback |
| `accent` | "Accent" | `var(--color-canvas-accent)` (#06b6d4) | idem | Cyan brand canvas |
| `success` | "Success" | `var(--color-success)` | idem | Verde — flussi OK / completion |
| `warning` | "Warning" | `var(--color-warning)` | idem | Ambra — attenzione / non-blocking |
| `danger` | "Danger" | `var(--color-error)` | idem | Rosso — error / critical |
| `muted` | "Muted" | `var(--color-text-tertiary)` o `var(--color-text-disabled)` | idem | Subdued, decorativo |

**Scelte deliberate**:
- "Info" (blue) deliberatamente OMESSO in V1: il blue (`--color-info: #3b82f6`)
  è già usato per `--color-type-class` e per il banner edge-candidate; un terzo
  uso semantico genera confusione visiva. Posticipato a V2 se richiesto.
- Niente "primary slate" perché coincide col default — non aggiunge segnale.
- Nessun colore custom utente (color picker free): scope esplicitamente
  fuori da V1 per "selezione da palette di token".

**Effetto su entrambi i temi**: i token `--color-*` sono ridefiniti in
`_colors-dark.scss` (linee 67-88 per i semantic), quindi il tema scuro
auto-applica le varianti adatte senza logica supplementare.

## 7. Compatibilità flow editor v2 e sync

**Verificato** che il flow editor v2 NON legge alcun campo `view.*` di edge:

```bash
grep -rn 'view\.edgeRouting\|view\.isEdge\|view\.edgeSource\|view\.edgeTarget' frontend/src/components/editor-v2/
# 0 risultati
```

Le sole occorrenze di `isEdge` in editor-v2 sono la helper
`isEdgeClassName(className: string | undefined): boolean` in
`hooks/useJjomSync.ts:189`, che ispeziona il **className D-layer**
(`DVoidEdge`, `DRefEdge`, ecc.) per distinguere edge runtime da node runtime.
Indipendente da `DViewElement.isEdge`.

| Pipeline | Impatto V1 | Note |
|----------|-----------|------|
| `useJjomSync.ts` (auto-populate, incremental sync) | **Nessuno** | Non legge DViewElement |
| `sync/syncState.ts` | **Nessuno** | Non legge DViewElement |
| `sync/canvasToJjom.ts` | **Nessuno** | Trasforma `LObject` → JjOM, ortogonale al view |
| `edges/UnifiedEdge.tsx` (CustomEdge React Flow) | **Nessuno** | Stile hard-coded indipendente |
| `EditorV2.tsx` | **Nessuno** | Non instanzia EdgeOverlay |
| `viewpoint/` workbench | **Nessuno** | Componenti separati per workbench |

**`CustomEdge` flow legge DViewElement?** NO. Il rendering edge V2 va da
`jjomEdgeToRFEdge` (jjomTransformers.ts:379-521) → `UnifiedEdge` con `data:
{ referenceName, referenceId, ... }`. La forma delle data del flow edge è
disgiunta dal `DViewElement.isEdge`.

**Mount-point isolation di EdgeOverlay**: `<EdgeOverlay>` è montato solo da
`components/abstract/tabs/ModelTab.tsx:47` come sibling di `<DefaultNode>`.
Il flow editor v2 (montato da `EditorSwitch` quando `graph.graphStyle ===
'v2-flow'`) **non lo monta**. Confermato in
`ModelTab.tsx:67-69` dove `mapStateToProps` filtra esplicitamente
`graphStyle !== 'v2-flow'`.

**Conclusione**: **Nessun rischio per V2**. Aggiungere campi opzionali al
DViewElement è completamente safe, anche senza guard di feature-flag.

## 8. Decisioni aperte per Fase B

Lista dei punti che richiedono conversazione di design prima dell'implementazione.
Ognuno propone un default raccomandato; tutti sono materia di scelta esplicita.

1. **Default storage strategy per i 4 nuovi campi** — due opzioni equivalenti:
   - (A) Aggiungere defaults in `Constructors.DViewElement` (classes.ts:1197-1200 stile)
     + nessun VersionFixer bump (consumer narrowing). Lato istanze esistenti i campi
     restano `undefined`, runtime applica fallback.
   - (B) Solo consumer narrowing in `EdgeOverlay.tsx` (zero touches a `Constructors`).
   Raccomandazione: **(A)** per consistency con `edgeRouting` (manco quello fa
   bump VersionFixer su 2.215, ma scrive default in Constructors). Vincolo
   utente "Niente VersionFixer bump" è rispettato in entrambi.

2. **Auto-render in EdgeData (Options tab) con `__info_of__`** — tre opzioni:
   - (A) `hidden: true` per impedire il duplicato.
   - (B) Lasciare il duplicato (oggi `edgeRouting` è duplicato).
   - (C) Niente `__info_of__` → ma poi i campi sono "stealth" agli scripts che
     iterano metadata.
   Raccomandazione: **(A)** per ridurre rumore UI; rivedibile se l'utente
   preferisce parità con `edgeRouting`.

3. **Posizione `edgeLabel` in Apply to** — confermare che dopo `edgeRouting`
   (raccomandato) e non nel tab Style. Il vincolo dell'utente è chiaro
   ("`edgeLabel` vive nel tab Apply to") ma il punto preciso è "subito dopo
   edgeRouting" o "in fondo al blocco isEdge". Raccomandazione: subito dopo
   `edgeRouting`, per raggruppare tutte le proprietà runtime-evaluated dell'edge
   in un blocco contiguo.

4. **Posizione "Edge Style" section in Style tab** — sopra "Style Variables"
   (raccomandato) o sotto.

5. **Token scelti per la palette `edgeStrokeColor`** — confermare la lista
   a 6 voci proposta in §6, oppure ridurre a 4 (omettere `accent` e `muted`)
   o estendere a 7+ (aggiungere `info`, `primary`, ecc.).

6. **Default di `edgeStrokeColor`** — `'default'` (mappato a slate-700/-400)
   o `'muted'` (slate-300). Raccomandazione: **`'default'`** per preservare
   l'apparenza pre-V1.

7. **Migrazione `EdgeOverlay.scss:27` da `#334155` hard-coded a token** —
   opzionale in V1: si può lasciare l'hard-coded come fallback per
   `strokeColor='default'` E migrare allo stesso tempo a una nuova variabile
   `--color-edge-overlay-default: #334155;` (light) / appropriato (dark) per
   uniformità. Raccomandazione: aggiungere il token ora, costo zero.

8. **Calcolo midpoint per `<text>` label** — tre opzioni:
   - (A) Centro geometrico del path (richiede `getPointAtLength` DOM).
   - (B) Midpoint del segmento più lungo del path Manhattan (calcolato
     analiticamente da `srcPoint`/`tgtPoint`/`sides`).
   - (C) Midpoint del bbox (`(srcPoint + tgtPoint) / 2`).
   Raccomandazione: **(C)** per semplicità e zero deps; in V1 visivamente
   è quasi sempre indistinguibile da (A)/(B) per edge brevi.

9. **Strategia label background** — `<text>` con halo (paint-order stroke)
   oppure `<rect>` pillola dietro `<text>`. Raccomandazione: halo per V1,
   meno DOM nodes e meno positioning logic.

10. **Validazione `edgeStrokeWidth`** — clamp a `[0.5, 10]` lato consumer
    O lasciare libero. Raccomandazione: clamp difensivo nel selector.

11. **Tooltips InfoTooltip** per i nuovi campi — definire i copy esatti in
    Fase B con input dell'utente sul fraseggio (utile per onboarding).

## 9. Rischi e sorprese

1. **Doppia esposizione UI per edgeRouting**. Già oggi `edgeRouting` ha
   `__info_of__edgeRouting: Info = {isEdge: true, ...}` (view.tsx:908) E
   render manuale in InfoData.tsx (riga 215). EdgeData.tsx auto-renderizza
   il primo. Risultato: lo stesso campo appare in Apply to e in Options.
   Per i nuovi campi, decidere consapevolmente (vedi §8.2).

2. **EdgeOverlay path styling è in CSS class, non inline**. La transizione
   da CSS-class-styling a attributi inline richiede di rimuovere
   `stroke` e `stroke-width` da `EdgeOverlay.scss:25-30` (e migrare il
   default a un token), altrimenti gli attributi inline competono con il
   CSS e perdono per cascading se il CSS è stato dichiarato con specificity
   maggiore. **Verificare** che la rimozione delle proprietà SCSS non
   rompa altri consumer (grep `jjodel-edge-overlay__path` → solo riga 326
   di EdgeOverlay.tsx: safe).

3. **`edgeStrokeColor` è un token id, non un valore CSS**. Risolvere a
   `var(--color-...)` lato selector è obbligatorio: passare direttamente
   `'default'` come `stroke=` su un `<path>` produce un attributo non valido.
   `resolveStrokeColorVar` deve mappare `'default'` → `'var(--color-edge-default)'`.

4. **Memoization di EdgeRenderItem**. La `React.memo` con `edgePropsEqual`
   (riga 329-334) deve essere aggiornata per includere i 4 nuovi prop,
   altrimenti modifiche live ai campi nel pannello Style/Apply to non
   triggerano re-render dell'edge. Bug invisibile fino al primo F5.

5. **Valutazione `edgeLabel` può essere costosa** se l'espressione JjEL è
   complessa e la chiamata avviene per ogni edge ad ogni Redux dispatch
   nel selector. Considerare memoization specifica nel selector (cache per
   `view.id + obj.id + edgeLabel-expr-string`). Posponibile a V1.x se la
   semplice valutazione naive si rivela costosa.

6. **EdgeOverlay è sotto `pointer-events: none`** (`EdgeOverlay.scss:23`).
   Il `<text>` del label NON è interattivo per design — coerente con la
   filosofia del overlay. Se in futuro il label dovesse diventare cliccabile
   (selezione edge), serve un cambio architettonico più ampio
   (per-path `pointer-events: auto`).

7. **Subclass DViewPoint**. `DViewPoint extends DViewElement`. Tutti i
   campi nuovi sono ereditati. La VersionFixer 2.214 → 2.215 esplicitamente
   migra entrambi (`e.className !== 'DViewElement' && e.className !== 'DViewPoint'`).
   Se decideremo di scrivere defaults in `Constructors`, applichiamo a
   `DViewElement` e si propagano automaticamente al subclass per ereditarietà.

8. **`view.appliableTo`** (singular, distinct from `appliableToClasses`) ha
   il valore `'Edge'` per views applicate solo ad edge. Non è correlato a
   `view.isEdge` (che marca una view che disegna un edge L2 overlay). I due
   campi sono ortogonali; non ricavare l'uno dall'altro. Conservare la
   distinzione in tutta l'UI di V1.

9. **`view.viewpoint` filter in EdgeOverlay**. Il selector
   (`EdgeOverlay.tsx:144-162`) filtra le edge views per `viewpoint ===
   project.activeViewpoint.id`. Se l'utente cambia viewpoint, l'overlay
   re-renderizza con il nuovo subset. I 4 nuovi campi seguono il viewpoint
   gratuitamente (sono props della view, che è già filtrata). Nessuna
   azione richiesta in V1.

10. **PaletteData è `useStateIfMounted`-heavy** e ha un onClickOutside
    proprio: aggiungere una sezione Edge Style in cima richiede attenzione
    per evitare collisioni con il dropdown "Add" (`AddPalette` component).
    Confinare il nuovo markup in `<section className="edge-style-section">`
    senza overlap di z-index o eventi.

---

## File chiave (referenza rapida)

| File | Rilevanza V1 |
|------|--------------|
| `frontend/src/components/edgeOverlay/EdgeOverlay.tsx` | **Iniezione runtime** dei 4 nuovi campi |
| `frontend/src/components/edgeOverlay/EdgeOverlay.scss` | Refactor stile path (rimuovere stroke hard-coded) |
| `frontend/src/components/editors/views/data/InfoData.tsx` | Inserire `edgeLabel` nel tab Apply to |
| `frontend/src/components/editors/views/data/PaletteData.tsx` | Inserire sezione Edge Style nel tab Style |
| `frontend/src/view/viewElement/view.tsx` | Aggiungere campi a `DViewElement` + `__info_of__` su `LViewElement` |
| `frontend/src/joiner/classes.ts` (linee 1195-1200) | Default in `Constructors.DViewElement` |
| `frontend/src/styles/tokens/_colors-light.scss` | Eventuale aggiunta `--color-edge-overlay-default` |
| `frontend/src/styles/tokens/_colors-dark.scss` | Idem (light + dark sempre) |
| `frontend/src/components/forEndUser/Input.tsx` | (read-only) Componente riusato per `edgeLabel` |
| `frontend/src/model/Info.tsx` | (read-only) Tipo `Info` con flag `isEdge`, `hidden` |

## File NON toccati (conferma vincoli architetturali)

| File | Vincolo |
|------|---------|
| `frontend/src/redux/VersionFixer.tsx` | Niente bump V1 |
| `frontend/src/components/editor-v2/**` | Flow editor non legge edge view fields |
| `frontend/src/utils/defaultViewTemplate.ts` (`jsxString` template) | Iniezione a livello rendering, non template |
| `frontend/src/model/dataStructure/GraphDataElements.tsx` (`LVoidEdge.get_d()`) | Non riguarda L2 overlay |
| `frontend/src/components/editor-v2/utils/edgeUtils.ts` | (read-only) `roundManhattanPath` riutilizzato senza modifiche |

---

**HARD STOP**. Discovery completata. In attesa di prompt di Fase B.
