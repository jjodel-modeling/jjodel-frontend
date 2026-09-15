# Discovery — Fase B live preview: bug CSS delle classi `ir-shape` (ramo CSS)

**Data**: 2026-07-22
**Tipo**: discovery read-only a supporto del fix CSS
**Branch**: alfonso-frontend-jjtl
**Critical zone**: no

## Obiettivo

La probe `[irdiag]` + ispezione DOM di Alfonso hanno chiuso la diagnosi: l'intera
catena reattiva IR funziona (`sigChanged: true`, token incrementali, render con
`form: 'ellipse'`). Il nodo NON si ridisegna tondo per un problema **solo CSS**:
la regola di forma è applicata all'elemento sbagliato. Questa discovery localizza
con precisione l'elemento che disegna il box e l'elemento che porta la classe di
forma, prima di scrivere il fix.

## File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` — emissione classe.
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo IR render, ~370-393) — struttura DOM.
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` — `BASE_CSS` + `staticCssFor`.
- `frontend/src/components/editor-v2/EditorV2.scss` (`.mm-node`, riga 1208-1244) — stili box.
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — tipo `ShapeForm`.
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — opzioni select Shape.

## Findings

### 1. Dove viene emessa la classe `ir-shape--<form>`

**Unico punto** (grep `ir-shape` in tutto `src/` → solo 2 file: `irStyle.ts` e
`IRNodeContent.tsx`):

- `IRNodeContent.tsx:105` — `className={`ir-node-content ir-shape--${form}`}`.
  La classe sta sul div **interno** `.ir-node-content`.

**NON esiste** alcun codice che metta `ir-shape` sul wrapper `.react-flow__node`
(nessun `node.className`, nessun `nodeClassName`). Il DOM incollato da Alfonso, che
mostrava `ir-shape--ellipse` su `.react-flow__node`, era mis-livellato in DevTools:
la classe è in realtà sul `.ir-node-content` annidato dentro `.mm-node`. Verifica
condotta sul codice corrente (§5.1: non fidarsi del paste sopra il codice).

Struttura DOM reale (ObjectNode ramo IR):

```
.react-flow__node                              (wrapper, creato da React Flow)
  └─ .mm-node.mm-object.ir-view-<viewId>       (ObjectNode:371 — box visibile)
       ├─ NodeResizer / DynamicHandles / badge / NodeProblemIndicator
       └─ .ir-node-content.ir-shape--<form>    (IRNodeContent:105 — figlio DIRETTO)
```

### 2. Regola CSS `.ir-shape--*`: esiste, ma sull'elemento sbagliato

`irStyle.ts` `BASE_CSS` (righe 32-34):

```css
.ir-shape--rect    { border-radius: 0; }
.ir-shape--rounded { border-radius: 10px; }
.ir-shape--ellipse { border-radius: 50%; justify-content: center; }
```

Questi selettori colpiscono l'elemento che **porta** la classe = `.ir-node-content`
(interno). Ma il **box visibile** (bordo + sfondo) è disegnato altrove:

- `.mm-node` base (`EditorV2.scss:1208`): `background`, `border: 1px`, **`border-radius: 4px`**, `box-shadow`. `overflow: hidden` è **commentato** (riga 1215) → overflow visibile.
- per-vista (`irStyle.ts:staticCssFor`, righe 62-73): `border` (da `shape.border`) e `background` (da `shape.fill`) iniettati su **`.ir-view-<viewId>`** = **la stessa `.mm-node`**.

Quindi il `border-radius` va sul contenuto interno mentre bordo/sfondo/box stanno
sul `.mm-node` genitore: gli angoli visibili restano a 4px (default). Il
`.ir-node-content` interno non ha sfondo proprio, per cui arrotondarlo non produce
alcun effetto visibile. **Questo è il bug.**

### 3. Valori di form offerti dalla select Shape

`VertexAuthoringPanel.tsx:15-18` `FORM_OPTIONS` — esattamente 3, coincidenti con il
tipo `ShapeForm = 'rect' | 'rounded' | 'ellipse'` (`irTypes.ts:38`):

| value     | label     |
|-----------|-----------|
| `rect`    | Rectangle |
| `rounded` | Rounded   |
| `ellipse` | Ellipse   |

Nessuna forma extra (diamond, ecc.): nessun `clip-path` necessario.

## Fix scelto (deciso, coerente col prompt)

La classe di forma sta su un **figlio** di `.mm-node`, non su un antenato. Il
selettore prescritto nel prompt (`.react-flow__node.ir-shape--X .mm-node`) presuppone
la classe sul wrapper e **non matcherebbe nulla**. Il prompt copre esplicitamente
questo caso ("se la regola ha il selettore sbagliato, correggi il selettore, non
spostare l'emissione"). Poiché non si può spostare l'emissione, si raggiunge il box
dal figlio con `:has()` (già usato nel codebase: `App.scss`, `diagram.scss`,
`style.scss`), robusto anche se la classe fosse *anche* sul wrapper:

```css
.mm-node:has(> .ir-node-content.ir-shape--rounded) { border-radius: 10px; }
.mm-node:has(> .ir-node-content.ir-shape--ellipse) { border-radius: 50%; }
.ir-node-content.ir-shape--ellipse { justify-content: center; }
```

- `border-radius` spostato sul `.mm-node` (elemento che disegna il box).
- `justify-content: center` resta sul `.ir-node-content` (proprietà flex del contenuto).
- `rect` = default: nessuna regola → eredita `border-radius: 4px` di `.mm-node` base.
- Le vecchie regole `.ir-shape--rect/rounded/ellipse { border-radius }` (selettore
  sbagliato, elemento interno) vengono rimosse/corrette.

## Rischi

- **`:has()`**: già usato nel codebase e supportato dal Chrome target; `BASE_CSS`
  è iniettato come testo grezzo in `<style>` (nessun postcss/SCSS che possa
  inciamparci). Rischio basso.
- **`overflow` non toccato**: non aggiungo `overflow: hidden` sull'ellipse per non
  clippare handle/badge posizionati in assoluto. Le label hanno già
  `text-overflow: ellipsis; white-space: nowrap`. Se in preview la label risultasse
  tagliata, si valuta un padding contenuto (non preventivo).

## Domande aperte per Alfonso

1. **`rect` a 4px**: con questo fix `rect` mantiene il `border-radius: 4px` di base
   (default `.mm-node`), non 0. Coerente col prompt ("rect = default, nessuna regola").
   Se si vuole `rect` a spigolo vivo (0), aggiungere
   `.mm-node:has(> .ir-node-content.ir-shape--rect) { border-radius: 0; }`. Da decidere
   visivamente.
2. **Ellipse & overflow**: verifica visiva se le label/compartimenti restano dentro
   l'ellisse; eventuale padding solo se serve.
