# Fase 2 — Aggiunta shape `circle` (ellipse con aspect ratio bloccato 1:1)

> Esegui **prima** di `diamond`. Cambiamento a basso rischio: nuovo form vertex `circle`,
> reso come ellipse ma sempre tondo (aspect-ratio 1:1) e con resize vincolato 1:1.
> Basato sul discovery report `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md`.

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. I `file:riga` sotto vengono
dal discovery report; possono essere shiftati di poche righe: **conferma leggendo il file** prima
di ogni edit.

## COSA

Aggiungere il form `circle` al sistema IR delle vertex view. Semantica: identico a `ellipse`
(`border-radius: 50%`) ma **sempre tondo** (non ellittico) e con resize a proporzioni bloccate 1:1.
`ellipse` resta invariato (proporzioni libere).

## DOVE (4 file di codice + log; ambito stretto)

### 1. `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — union dei form (riga ~38)

```ts
// da:
export type ShapeForm = 'rect' | 'rounded' | 'ellipse';
// a:
export type ShapeForm = 'rect' | 'rounded' | 'ellipse' | 'circle';
```

Unica modifica al tipo. Non aggiungere `'diamond'` qui: è del prompt successivo.

### 2. `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — option select (righe ~17-21)

Aggiungi **una** voce a `FORM_OPTIONS`, dopo `ellipse`:

```ts
const FORM_OPTIONS = [
    { value: 'rect', label: 'Rectangle' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'ellipse', label: 'Ellipse' },
    { value: 'circle', label: 'Circle' },
];
```

**VINCOLO CRITICO**: tocca SOLO la costante `FORM_OPTIONS` (~:17-21). **NON** toccare il memo
`featureInfo` (~:93-151, risoluzione metaclasse by-id): ha un hard stop attivo per il bug
feature-picker ed è indipendente da questa modifica. Nessun'altra riga del file.

### 3. `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` — regole CSS (dopo le regole ellipse, ~:57-58)

Aggiungi due regole, gemelle di quelle ellipse (che restano invariate). La differenza dall'ellipse
è `aspect-ratio: 1 / 1`, che rende il nodo tondo anche prima di qualsiasi resize (content-hug che
si quadra sulla dimensione maggiore della label):

```css
.ir-node-content.ir-shape--circle {
    border-radius: 50%;
    justify-content: center;
    aspect-ratio: 1 / 1;
    min-width: 0;
    min-height: 0;
}
.mm-node:has(> .ir-node-content.ir-shape--circle) {
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
}
```

Nessun nuovo nome di classe (usa `ir-shape--circle`, emesso automaticamente da `IRNodeContent`
via interpolazione `ir-shape--${form}`). Non toccare le regole `rounded`/`ellipse` esistenti.

### 4. `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` — resizer (ramo IR, ~:373-388)

Due edit puntuali:

`~:374` — includi `circle` tra le shape geometriche (monta il resizer + shrink a `SHAPE_MIN_SIZE`):

```ts
// da:
const hasGeometricShape = shapeForm === 'ellipse';
// a:
const hasGeometricShape = shapeForm === 'ellipse' || shapeForm === 'circle';
```

`~:380-388` — aggiungi la prop `keepAspectRatio` al `<NodeResizer>`, attiva **solo** per `circle`:

```tsx
<NodeResizer
    isVisible={selected}
    minWidth={SHAPE_MIN_SIZE}
    minHeight={SHAPE_MIN_SIZE}
    keepAspectRatio={shapeForm === 'circle'}
    lineClassName="node-resize-line"
    handleClassName="node-resize-handle"
/>
```

`keepAspectRatio` è una prop supportata dal `NodeResizer` di `@xyflow/react` (stessa lib già usata).
`ellipse` resta a `false` (proporzioni libere). Non toccare `ClassNode.tsx`/`EnumNode.tsx`.

## COME

- Diff minimale, edit puntuali (str_replace). Zero refactoring opportunistico. Mai rinominare
  identificatori esistenti (le classi CSS sono API interne).
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`) né il path reattivo che
  emette la classe (`IRNodeContent.tsx:108`) né il memo feature-picker.
- `validateIR`/`irCompile` non richiedono modifiche (il discovery ha verificato che i form non
  sono whitelistati: `circle` passa la validazione come valore-dato).

## Verifica build

`npm run build` deve passare senza errori.

## HARD STOP

Dopo la build, **FERMATI**. Nessun commit. Alfonso verifica su http://localhost:3001/ con
hard refresh:

1. La select Shape mostra la voce **Circle**.
2. Selezionando `circle` su una vertex view il nodo appare **tondo** (non ellittico) **prima**
   di qualsiasi resize, su tutte le istanze.
3. Il resize del circle mantiene le proporzioni 1:1 (resta un cerchio).
4. `ellipse` invariato: si ridimensiona liberamente, può diventare ovale.
5. `rect`/`rounded` invariati.

> Nota per Alfonso: l'unico punto incerto è l'interazione `aspect-ratio` × content-hug al punto 2.
> Se il circle nasce non-tondo o il box "salta" al primo render, è quel punto: segnalalo e affino
> il CSS, non è un difetto del path reattivo.

Solo dopo l'OK esplicito di Alfonso:

- commit con `git add` dei **soli** file coinvolti (mai `git add .`, mai `git commit -a`),
  messaggio una riga: `feat: add circle shape form to IR vertex views`;
- aggiorna `docs/claude-code-log.md` con l'entry standard (data 2026-07-24 + ora, tipo `feat`,
  prompt, file toccati, esito, nome documento prompt).

## RIFERIMENTI

- Discovery: `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md` (Findings 1, 2, 5, 6).
- Regola ellipse esistente da cui derivare quella circle: `irStyle.ts:57-58`.
- `keepAspectRatio` è assente ovunque oggi (grep globale): è la prima introduzione, per il solo circle.
