# Jjodel Design System

> **Single source of truth** for visual design decisions across the entire Jjodel application.
> Referenced by `CLAUDE.md`. All components must conform to this document.
> Last updated: 2026-03-14

---

## 1. Foundations

### 1.1 Base Grid

All spacing derives from an **8px base unit**. Common values: 4, 8, 12, 16, 24, 32, 40.

The Megamodel view uses a **20px snap grid** for node positioning, matching the dot background spacing.

### 1.2 Typography

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Primary text | 13px | 500 | Node names, panel titles, tree item names |
| Secondary text | 11px | 400 | Labels, stat values, legend items, badges |
| Tertiary text | 10px | 400 | Type indicators, status labels, captions |
| Stat values | 10px | 500 | Numbers in stat pills |

**Font family**: system sans-serif (inherited from the app shell).

**Text overflow**: names that may be long (model names, transformation names) use `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` with `title` attribute for full name on hover.

### 1.3 Border Radius

| Element | Radius |
|---------|--------|
| Node cards (Megamodel) | 10px |
| Badges | 7px |
| Stat pills | 4px |
| Edge label pills | 4px |
| Tree view icons | 3px |
| Buttons / inputs | 6px |
| Modal container | 12px |

### 1.4 Borders & Shadows

Default border: `0.5px solid` with appropriate color token.

Hover shadow on cards: `0 4px 12px rgba(0, 0, 0, 0.06)` (light), `0 4px 12px rgba(0, 0, 0, 0.2)` (dark).

No decorative shadows. Shadows are functional only (elevation on hover, focus rings).

---

## 2. Color System

### 2.1 Base Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--slate-900` | `#0f172a` | — | Deepest background |
| `--slate-800` | `#1e293b` | — | Dark canvas, dark surface |
| `--slate-700` | `#334155` | — | Primary dark surface, focus states |
| `--slate-600` | `#475569` | — | Elevated dark surface |
| `--slate-500` | `#64748b` | — | Muted text (light mode) |
| `--slate-400` | `#94a3b8` | — | Muted text (dark mode) |
| `--slate-300` | `#cbd5e1` | — | Border hover (light) |
| `--slate-200` | `#e2e8f0` | — | Default border (light) |
| `--slate-100` | `#f1f5f9` | — | Stat pill background |
| `--slate-50` | `#f8fafc` | — | Canvas background (light) |

**Accent**: cyan `#0ea5e9` — used for focus states, spotlight borders, interactive highlights.

Focus state: `box-shadow: 0 0 0 2px #334155, 0 0 0 4px rgba(51, 65, 85, 0.3)`.

### 2.2 Artifact Type Colors

These colors identify the **type of modeling artifact** consistently across the entire UI: Megamodel nodes, Tree View icons, legend swatches, and any future component.

#### Metamodel — Violet

| Stop | Hex | Usage |
|------|-----|-------|
| Background (light) | `#EEEDFE` | Badge bg, swatch bg |
| Background (dark) | `rgba(127, 119, 221, 0.2)` | Dark mode badge |
| Mid / border | `#AFA9EC` | Swatch border, preview bars |
| Strong | `#7c3aed` | — |
| Text on light bg | `#534AB7` | Badge letter, pill text |
| Text on dark bg | `#AFA9EC` | Dark mode badge letter |

Icon: letter **`M`** (uppercase).

#### Model — Amber

Aggiornato con DS-1 (2026-08-31). Fino a quel giorno questa sezione dichiarava una
rampa (`#FAEEDA / #854F0B`, strong `#f59e0b`) che i token **non** applicavano:
R-RAIL-30 (2026-08-11) aveva messo `model` fra gli alias della famiglia contenitori
(`#E2EAF5 / #45566F`), scavalcando in silenzio quanto scritto qui. DS-1 riporta la
coppia ad ambra e allinea il documento ai token: **quello che segue è quello che i
token dichiarano**, non un'intenzione.

**La coppia a token — autorevole.** Vive in `styles/tokens/_colors-light.scss` e
`_colors-dark.scss` fra le coppie canoniche della scala entity, grado **saturo**,
tinta **H 85** in OKLCH:

| Stop | Hex | Token | Usage |
|------|-----|-------|-------|
| Background (light) | `#F3E8D3` | `--color-entity-model-bg` | Badge bg, chip, swatch |
| Text on light bg | `#6B5110` | `--color-entity-model-fg` | Lettera del badge |
| Background (dark) | `#3B2B06` | `--color-entity-model-bg` | Badge bg in tema scuro |
| Text on dark bg | `#E4C992` | `--color-entity-model-fg` | Lettera del badge in tema scuro |

Misurato il 2026-08-31: chiaro bg L 0.934 C 0.030 H 83.6, fg L 0.451 C 0.085 H 85.0,
contrasto **6.16:1**; scuro bg L 0.300 C 0.056 H 83.9, fg L 0.846 C 0.078 H 84.7,
contrasto **8.52:1**. La tinta non è quella storica (64–81°) perché a quelle tinte
l'ambra collide con `enum`/`literal`, che occupano 56°: la ΔE OKLCH dei fondi
scenderebbe sotto il pavimento che la scala già tollera (0.0143 in chiaro, 0.0243 in
scuro, in entrambi i casi `class`/`object`). H 85 è l'unica tinta ambra che supera
quel pavimento in **entrambi** i temi — 0.0146 e 0.0263 contro `enum`. La regola di
costruzione e i due pavimenti sono difesi da
`styles/__tests__/entityModelAmberDs1.test.ts`.

**I letterali storici — ancora sullo schermo, non più autorevoli.** Quattro superfici
dipingono il modello d'ambra con valori propri, precedenti alla scala. Convergeranno
sulla coppia a token in una slice a valle; fino ad allora esistono e vanno riconosciuti,
ma non si copiano in codice nuovo:

Percorsi e righe verificati il 2026-09-01, non copiati dal prompt: due dei quattro
riferimenti in circolazione erano fuori di una riga o piu'.

| Sito | chiaro | scuro |
|---|---|---|
| `components/common/element-badge.scss:29-30`, `:111` `--model` | `#FAEEDA / #854F0B` | `rgba(186,117,23,.2) / #FAC775` |
| `components/megamodel/MegamodelView.scss:256-257,266-267` card | `#FAEEDA / #854F0B` | — |
| `components/megamodel/MegamodelView.scss:462-463` swatch legenda | `#FAEEDA`, bordo `#FAC775` | — |
| `pages/dashboard.scss:1126` `.psb-badge--m` | `#fef3c7 / #92400e` | — |
| `components/editor-v2/EditorV2.scss:810+` `&__badge` | ambra-600 `#d97706` | — |

Il commento di `EditorV2.scss:797-808` motiva il proprio letterale dicendo che
`--color-entity-model-*` aliasa il contenitore: DS-1 lo ha falsificato, e il commento
resta lì perché quel file è fuori perimetro. Si aggiorna con la slice di convergenza.
Nota a margine: `components/project/project-editor.scss:794` usa la stessa coppia
`#FAEEDA / #854F0B` per `data-type="validation"` — non è il modello, e non converge qui.

Icon: letter **`m`** (lowercase).

#### Transformation — Teal

| Stop | Hex | Usage |
|------|-----|-------|
| Background (light) | `#E1F5EE` | Badge bg, swatch bg |
| Background (dark) | `rgba(29, 158, 117, 0.2)` | Dark mode badge |
| Mid / border | `#5DCAA5` | Swatch border, progress fill |
| Strong | `#10b981` | Tree View icon color |
| Text on light bg | `#0F6E56` | Badge icon |
| Text on dark bg | `#5DCAA5` | Dark mode badge icon |

Icon: **SVG arrow** (`bi-arrow-left-right`), not a letter. This distinguishes transformations from models at a glance.

#### Generated Model — Coral

| Stop | Hex | Usage |
|------|-----|-------|
| Background (light) | `#FAECE7` | Badge bg when generated |
| Text on light bg | `#993C1D` | Badge text |

Generated models use the coral badge **in addition to** the amber `m` letter. The "generated" pill appears in the node card header.

#### Megamodel (meta-entry) — Indigo

| Stop | Hex | Usage |
|------|-----|-------|
| Background | `rgba(99, 102, 241, 0.15)` | Tree View icon bg |
| Text | `#6366f1` | Tree View icon |

Icon: `bi-diagram-3-fill`. Only used for the Tree View "Megamodel" entry — it's a navigation element, not an artifact type.

### 2.3 Edge Colors

Each edge type in the Megamodel has a distinct visual treatment:

| Edge Type | Color | Style | Width | Opacity | Level |
|-----------|-------|-------|-------|---------|-------|
| `conformsTo` | `#888780` (gray) | dashed `5,3` | 1px | 0.6 | Type |
| `inputOf` | `#1D9E75` (teal) | solid | 1.2px | 1.0 | Type |
| `outputOf` | `#D85A30` (coral) | solid | 1.2px | 1.0 | Type |
| `instanceInputOf` | `#1D9E75` (teal) | dashed `5,3` | 1px | 0.7 | Instance |
| `generatedBy` | `#7F77DD` (violet) | dashed `5,3` | 1px | 0.7 | Instance |
| `sourceOf` | `#378ADD` (blue) | dashed `5,3` | 1px | 0.7 | Instance |

**Type-level** edges connect metamodels ↔ transformations (always exist by definition).
**Instance-level** edges connect models ↔ transformations/models (created at runtime when transformations execute).

**Default visibility**: `instanceInputOf` and `sourceOf` are hidden by default in the legend toggles to reduce visual clutter. Users can click the legend to show them.

### 2.4 Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Valid / OK | Green | `#5DCAA5` | Status dot, conforming models |
| Warning | Amber | `#EF9F27` | Empty model, validation errors |
| Info | Blue | `#85B7EB` | Transformation execution state |

---

## 3. Component Catalog

### 3.1 Megamodel Node Card

Three-zone card (220px wide, variable height):

```
┌─────────────────────────────┐
│ [Badge] Name                │  HEADER
│         TYPE                │
├─────────────────────────────┤
│ N classes  N refs  N attrs  │  BODY (stat pills)
│ ● Status label              │  FOOTER
└─────────────────────────────┘
```

**Header**: Badge (28×28px, border-radius 7px) + name (13px/500) + type (10px uppercase).

**Body**: Stat pills in flex row, content varies by type:
- Metamodel → `classes`, `refs`, `attrs`
- Model → `objects`, `links`
- Transformation → `rules`, `mappings`

**Footer**: Status dot (6px) + status label (10px).

### 3.2 Megamodel Edge

Manhattan routing (orthogonal segments). Label pill with white background and 0.5px border.

When `|dy| < 5`: straight horizontal line.
Otherwise: L-shaped path with vertical then horizontal segments.

Edge anchors are distributed along node sides when multiple edges connect to the same node (existing `computeAnchorTs` + `spreadAnchors` logic).

### 3.3 Megamodel Legend

Inline in the modal header. Each item is clickable to toggle edge type visibility.

Node type items: colored swatch (10×10px) + label.
Edge type items: line sample (20px, matching style) + label.

Hidden types shown with `opacity: 0.35` and `text-decoration: line-through`.

Preferences saved to `localStorage` per project.

### 3.4 Tree View

Hierarchical list showing project artifacts:

```
🔷 Megamodel                    ← indigo, click opens Megamodel modal
> M  metamodel_1                ← muted slate icon
    > C  Person                 ← class icon (own TYPE_CONFIG colors)
    m  model_1  [M1]            ← muted slate icon + subtle badge
> M  metamodel_2                ← muted slate icon
    m  tgt  [M1]
    ...
> ⇄  Transformations  [2]      ← muted slate section header
    ⇄  mm1_to_mm2
    ⇄  mm2_to_mm3
```

**Tree View icons use muted slate-gray**, not the saturated Megamodel badge colors. The letter/symbol (`M`, `m`, `⇄`) and indentation carry the meaning — color does not.

| Element | Background | Text | Notes |
|---------|-----------|------|-------|
| Metamodel `M` | `rgba(100,116,139,0.12)` | `#64748b` | Uppercase M identifies it |
| Model `m` | `rgba(100,116,139,0.12)` | `#64748b` | Lowercase italic m distinguishes from MM |
| Transformation `⇄` | `rgba(100,116,139,0.10)` | `#94a3b8` | Even lighter — secondary in tree |
| M1 badge | `rgba(100,116,139,0.08)` | `#94a3b8` | Very subtle hint |
| Megamodel entry | `rgba(99,102,241,0.15)` | `#6366f1` | **Only colored item** — navigation action |

Class/attribute/reference/enum icons inside expanded metamodel nodes use their own TYPE_CONFIG colors (defined in `MetamodelTreeView.tsx`), which are separate from the tree-level icons above.

### 3.5 Spotlight Mode

Click on a Megamodel node dims all non-directly-connected nodes.

| State | Opacity | Other |
|-------|---------|-------|
| Spotlighted node | 1.0 | `box-shadow: 0 0 0 2px #0ea5e9`, `transform: scale(1.02)` |
| Connected neighbors | 1.0 | Normal appearance |
| Dimmed nodes | 0.15 | `pointer-events: none`, `filter: grayscale(1)` |
| Dimmed edges | 0.05 | Labels hidden |

**Activation**: clean click only (no drag — uses mousedown/mouseup with 5px movement threshold).
**Deactivation**: click same node again, or click canvas.
**Click vs double-click**: 250ms timeout discriminates single-click (spotlight) from double-click (open editor).

Transition: `0.3s` for all opacity/transform changes.

---

## 4. Layout Patterns

### 4.1 Megamodel — Transformation-Centric Layout

Custom algorithm (not dagre). Positions artifacts in 3 columns based on transformation flow:

```
  LEFT              CENTER              RIGHT
┌──────────┐                        ┌──────────┐
│ Source MM │── inputOf ──┐          │ Target MM │
└──────────┘              │          └──────────┘
      ↑              ┌────┴─────┐         ↑
   conformsTo        │ Transform │── outputOf
      │              └────┬─────┘
┌─────┴────┐              │          ┌──────────┐
│ Source    │← instanceInputOf       │ Generated │
│ Models   │              └─ generatedBy →│ Models  │
└──────────┘                         └──────────┘
```

**Classification**: uses `inputOf`/`outputOf` edges to determine source/target MM.
**Grouping**: models grouped under their conforming metamodel.
**Fallback**: projects with no transformations use simple grid layout.
**Persistence**: node positions saved to `localStorage` keyed by `megamodel-positions-{projectId}`.
**Auto-arrange**: button clears saved positions, re-runs layout, centers at zoom=1.

### 4.2 Progressive Disclosure

All panels support Basic/Advanced modes. Basic shows essential controls only; Advanced reveals the full set.

### 4.3 No Layout Shifts

Components use fixed dimensions. No reflow on state change. Toggle visibility with `opacity` + `pointer-events`, not `display: none` (unless the component is actually removed from the DOM).

---

## 5. Interaction Patterns

### 5.1 Megamodel Node Interactions

| Interaction | Behavior |
|-------------|----------|
| Click | Spotlight toggle |
| Double-click | Open artifact in editor tab + close modal |
| Right-click | Context menu (Open, Rename, Duplicate, Delete, Run) |
| Drag | Move node (snap to 20px grid) |
| F2 (with selection) | Inline rename |
| Delete (with selection) | Delete with confirmation |

### 5.2 Megamodel Canvas

| Interaction | Behavior |
|-------------|----------|
| Click on empty space | Remove spotlight |
| Right-click on empty space | Context menu (New metamodel, New model, Import) |
| Mouse wheel | Zoom |
| Click + drag on empty space | Pan |
| Escape | Close modal |
| Click on backdrop | Close modal |

### 5.3 Custom DOM Events

| Event | Dispatched by | Listened by |
|-------|--------------|-------------|
| `jjodel:openMegamodel` | Tree View "Megamodel" entry | MegamodelView mount point |
| `jjodel:selectNode` | Tree View instance items | EditorV2 |
| `jjodel:toggle-tree-view` | Keyboard shortcut (Cmd+B) | PropertiesWithTreeView |

---

## 6. Icon Library

**Only Bootstrap Icons** (`bi-*`) are used. No other icon libraries.

Key icons by context:

| Context | Icon | Notes |
|---------|------|-------|
| Megamodel entry | `bi-diagram-3-fill` | Indigo, Tree View only |
| Transformation badge | SVG arrow path | Custom, in MegamodelNode |
| Transformation tree item | `bi-arrow-left-right` | Teal |
| Expand/collapse | `bi-chevron-right` / `bi-chevron-down` | |
| Close | `bi-x-lg` | |
| Fullscreen | `bi-arrows-fullscreen` | |
| Search | `bi-search` | |
| Grid layout | `bi-grid-3x3-gap-fill` | Megamodel toolbar |
| List layout | `bi-list` | Megamodel toolbar |

---

## 7. Naming Conventions

### 7.1 Transformation Names

Format: `source_to_target` (underscore-separated, no hyphens).
Example: `metamodel_1_to_metamodel_2`.

### 7.2 Duplicated Model Names

Suffix with `(1)`, `(2)`, etc.
Example: `model_1`, `model_1 (1)`.

### 7.3 CSS Class Names

BEM-inspired, prefixed by component:
- `megamodel-node-card__header`
- `megamodel-node-card__badge`
- `megamodel-node-card__status-dot--valid`
- `tree-node__header--selected`

**Never rename existing CSS classes** without a global search and explicit decision. CSS class collisions are silent bugs.

### 7.4 Edge Types (TypeScript union)

```typescript
type EdgeType =
  | 'conformsTo'
  | 'inputOf'
  | 'outputOf'
  | 'instanceInputOf'
  | 'generatedBy'
  | 'sourceOf';
```

---

## 8. State & Persistence

### 8.1 localStorage Keys

| Key Pattern | Content | Scope |
|-------------|---------|-------|
| `megamodel-positions-{projectId}` | Node positions `Record<string, {x,y}>` | Per project |
| `megamodel-hidden-edges-{projectId}` | Hidden edge types `string[]` | Per project |
| `editor-v2-theme` | `'dark' \| 'light'` | Global |

### 8.2 generatedBy Metadata

Stored in `model.state.generatedBy`:
```typescript
interface GeneratedBy {
  transformationId: string;
  sourceModelId: string;
  timestamp: number;
}
```

This is **operational state** (persisted via Redux `_state` mechanism), not part of the DModel structure.

---

## 9. Applying This Document

### For Claude Code

This document is referenced in `CLAUDE.md`. When implementing UI changes:

1. **Check colors here first** — don't invent new colors. Use the artifact type colors from §2.2 and edge colors from §2.3.
2. **Check naming here** — verify CSS class names don't collide with existing ones (§7.3).
3. **Check interaction patterns** — spotlight, click/double-click, context menu behaviors are defined in §5.

### For Design Decisions

When a new visual element is needed:
1. Check if an existing color/pattern covers it
2. If not, add the decision to this document first, then implement
3. Update the `Last updated` date at the top

### For New Artifact Types

If a new artifact type is added to the Megamodel:
1. Assign a color ramp from the existing palette (prefer unused ramps)
2. Define all 6 stops (bg-light, bg-dark, mid, strong, text-light, text-dark)
3. Choose an icon (letter or Bootstrap Icon)
4. Add entries to §2.2 and §3.4
5. Update the `EdgeType` union if new relationships are introduced
