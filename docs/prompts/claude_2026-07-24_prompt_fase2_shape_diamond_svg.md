# Fase 2 — Aggiunta shape `diamond` (rombo con layer SVG, bordo fedele)

> Esegui **solo dopo** che `circle` è stato committato e verificato visivamente da Alfonso.
> Cambiamento sensibile: tocca il painting di border/fill stabilizzato in faseB
> (`IRNodeContent.tsx`). Basato su `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md`.

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. I `file:riga` sotto vengono dal
discovery report; **conferma leggendo il file** prima di ogni edit.

## COSA

Aggiungere il form `diamond` al sistema IR delle vertex view. Il rombo è disegnato da un **layer
SVG** dietro il contenuto, che attinge agli **stessi valori risolti** di `fill` e `compiled.border`
oggi dipinti inline su `.ir-node-content`. Per il solo form `diamond`, `.ir-node-content` **sopprime**
il proprio box rettangolare (background, border, box-shadow), così non si vede un quadrato dietro il
rombo. Resize libero (nessun `keepAspectRatio`: solo `circle` lo ha).

**NOTA TECNICA CRITICA (non deviarci):** lo stroke uniforme a qualsiasi aspect ratio si ottiene con
`vector-effect="non-scaling-stroke"` sul `<polygon>`. `preserveAspectRatio="none"` da solo NON basta:
scala anche lo spessore del bordo e lo distorce sui rombi larghi. La geometria del polygon si stira
(rombo), lo stroke resta a spessore costante grazie a `non-scaling-stroke`. È il motivo per cui si è
scelto SVG e non clip-path/rotate.

## Ambito file (5 file di codice + log — elencati qui come da convenzione >3 file)

1. `irTypes.ts` — estendere l'union con `'diamond'`.
2. `VertexAuthoringPanel.tsx` — una option `Diamond` in `FORM_OPTIONS` (NON toccare il memo feature-picker).
3. `IRNodeContent.tsx` — render condizionale del layer SVG + soppressione degli inline box per diamond.
4. `irStyle.ts` — regole CSS del diamond (soppressione box + styling layer SVG + gemello shrink).
5. `ObjectNode.tsx` — includere `diamond` tra le shape geometriche (resizer montato, aspect libero).
6. `docs/claude-code-log.md` — entry finale.

Se ritieni necessario toccare un file fuori da questa lista, **fermati e chiedi**.

## DOVE — dettaglio

### 1. `.../ir/irTypes.ts` (~:38)

```ts
export type ShapeForm = 'rect' | 'rounded' | 'ellipse' | 'circle' | 'diamond';
```

(Aggiungi `| 'diamond'`; `circle` è già presente dal prompt precedente.)

### 2. `.../authoring/VertexAuthoringPanel.tsx` (~:17-21)

Aggiungi una voce a `FORM_OPTIONS`, dopo `circle`:

```ts
    { value: 'diamond', label: 'Diamond' },
```

**VINCOLO**: solo `FORM_OPTIONS`. NON toccare il memo `featureInfo` (~:93-151, hard stop attivo).

### 3. `.../ir/IRNodeContent.tsx` — layer SVG + soppressione inline (~:35-36, :98-109)

Il componente ha già disponibili: `form` (~:35), `fill` (~:36), `compiled.border`
(`{color,width,style} | null`). Interventi:

**(a) Sopprimere gli inline box per diamond** (~:98-104). Oggi:

```ts
const inlineStyle: React.CSSProperties = {};
if (fill) inlineStyle.background = fill;
const b = compiled.border;
if (b) inlineStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${b.color ?? 'var(--border-default)'}`;
```

Condiziona l'emissione di `background`/`border` a `form !== 'diamond'` (il rombo dipinge tutto
nell'SVG; se restassero gli inline vincerebbero sul CSS di soppressione e mostrerebbero il box
rettangolare). Gli altri form restano invariati.

**(b) Calcolare i paint dell'SVG** dagli stessi valori risolti, con i fallback decisi:

```ts
// fallback allineati al box base (irStyle.ts:44) quando non c'è nulla di authored
const DASH: Record<string, string | undefined> = { solid: undefined, dashed: '6 4', dotted: '1 4' };
const svgFill = fill || 'var(--node-bg)';
const svgStroke = compiled.border?.color ?? 'var(--border-default)';
const svgStrokeWidth = compiled.border?.width ?? 1;
const svgDash = DASH[compiled.border?.style ?? 'solid'];
```

**(c) Render del layer SVG come PRIMO figlio** del div `.ir-node-content` (~:108-109), solo per diamond,
prima dei figli esistenti (label, badge):

```tsx
{form === 'diamond' && (
    <svg className="ir-diamond-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon
            points="50,0 100,50 50,100 0,50"
            vectorEffect="non-scaling-stroke"
            fill={svgFill}
            stroke={svgStroke}
            strokeWidth={svgStrokeWidth}
            strokeDasharray={svgDash}
        />
    </svg>
)}
```

Il contenuto esistente (label, badge) resta dopo l'SVG e deve stare **sopra** (z-index via CSS al
punto 4). Nuovo nome di classe `ir-diamond-svg`: **prima di introdurlo, grep globale** in `src/`
per confermare che non è già in uso (il discovery non l'ha trovato, riverifica).

### 4. `.../ir/irStyle.ts` — regole diamond (dopo le regole circle)

```css
.ir-node-content.ir-shape--diamond {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    overflow: visible;              /* gli apici del rombo non devono essere clippati */
    justify-content: center;
    align-items: center;
    min-width: 0;
    min-height: 0;
}
.ir-node-content.ir-shape--diamond > .ir-diamond-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    z-index: 0;
}
.ir-node-content.ir-shape--diamond > :not(.ir-diamond-svg) {
    position: relative;
    z-index: 1;                     /* label/contenuto sopra il rombo */
}
.mm-node:has(> .ir-node-content.ir-shape--diamond) {
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
}
```

I badge (`ir-badge`, z-index 2) e il collapse-chip (z-index 3) restano sopra questi livelli:
non toccare le loro regole. Non toccare `rounded`/`ellipse`/`circle`.

### 5. `.../nodes/ObjectNode.tsx` (~:374)

```ts
const hasGeometricShape = shapeForm === 'ellipse' || shapeForm === 'circle' || shapeForm === 'diamond';
```

Lascia `keepAspectRatio={shapeForm === 'circle'}` invariato (diamond resize libero). Nessun'altra modifica.

## COME

- Diff minimale, edit puntuali. Zero refactoring. Mai rinominare identificatori esistenti.
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`), il path reattivo che emette
  la classe (`IRNodeContent.tsx:108`), il memo feature-picker.
- Non modificare `irCompile.ts`/`irValidate.ts` (i form non sono whitelistati: `diamond` passa come dato).

## Verifica build

`npm run build` deve passare senza errori.

## HARD STOP

Dopo la build, **FERMATI**. Nessun commit. Alfonso verifica su http://localhost:3001/ con hard refresh:

1. La select Shape mostra **Diamond**.
2. Selezionando `diamond`: il nodo appare come **rombo** con bordo pulito su tutti e quattro i lati;
   nessun quadrato/box rettangolare visibile dietro.
3. Il bordo del rombo è **uniforme** anche allargando il nodo in orizzontale (rombo largo): lo stroke
   NON si assottiglia/ispessisce sui lati (verifica di `non-scaling-stroke`).
4. border authored (stile solid/dashed/dotted, colore, spessore) e fill si riflettono sul rombo,
   reattivi come per gli altri shape.
5. diamond senza border authored: contorno di default (`1px solid var(--border-default)`), fill `--node-bg`.
6. Resize libero (aspect ratio qualsiasi); badge e collapse-chip restano visibili sopra il rombo.
7. `rect`/`rounded`/`ellipse`/`circle` invariati.

> Limite noto, atteso, NON un difetto da correggere ora: la label vive nel rettangolo inscritto del
> rombo; con testi lunghi può avvicinarsi/uscire dagli spigoli. La gestione ellipsis/padding fine è
> uno slice successivo. Segnalalo se marcato, ma non over-ingegnerizzarlo qui.

Solo dopo l'OK esplicito di Alfonso:

- commit con `git add` dei **soli** file coinvolti (mai `git add .`, mai `git commit -a`), messaggio
  una riga: `feat: add diamond shape form with SVG layer to IR vertex views`;
- aggiorna `docs/claude-code-log.md` con l'entry standard (data 2026-07-24 + ora, tipo `feat`, prompt,
  file toccati, esito, nome documento prompt).

## RIFERIMENTI

- Discovery: `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md` (Finding 4 painting path,
  Finding 5 CSS, Finding 7 assenza scaffolding poligonale → SVG da zero, Rischi 1-4).
- Path faseB del painting: `IRNodeContent.tsx:98-104` (inline), `irStyle.ts:41-44` (box base +
  neutralizzazione `.mm-node` via `:has()`).
- Correzione al report: `vector-effect="non-scaling-stroke"` è obbligatorio; `preserveAspectRatio="none"`
  da solo distorce lo stroke.
