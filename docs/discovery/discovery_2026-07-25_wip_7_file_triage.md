# Discovery: triage READ-ONLY del WIP nel working tree (shape/resize) prima di R3

**Data**: 2026-07-25 20:06. Sessione **read-only sul codice**: nessuna mutazione ai file
WIP, nessuna operazione git che tocchi index o working tree. Unica scrittura: questo
report. HARD STOP a report scritto.

## Obiettivo

Sul working tree, in cima a R2 (`d12a54aa0`), esiste WIP non committato di natura
shape/resize. L'ipotesi "un solo filone" non reggeva a due anomalie (`VertexAuthoringPanel`,
`IRNodeContent`) fuori dallo scope dichiarato del task shape/resize. Questo report **mappa**
il WIP (non lo tocca): classifica ogni file, spiega le due anomalie, ricostruisce la
provenienza, riporta l'esito build, e propone uno split.

> **Nota di stato importante (fuori premessa del prompt di triage).** Nella **stessa
> sessione**, PRIMA di questo triage, e' stata gia' implementata la **Fase R3** (authoring
> row view + children source). Quel lavoro e' in-tree, **non committato**, **non ancora
> approvato** (in attesa della verifica visiva di Alfonso). Il set di file R3 e'
> **disgiunto** dalla shape WIP (vedi §7). Questo report e' scoped alla **sola shape WIP**;
> R3 resta gestita a parte e non viene committata ne' stashata qui.

## 1. Stato del tree

```
$ git branch --show-current
alfonso-frontend-jjtl

$ git log --oneline -6
d12a54aa0 feat: dispatch IR compartment rows to row views with top-level suppression   (R2)
8a650833b feat: add IR row view kind with dedicated resolver context and authoring guard (R1)
bb88adab4 docs: add discovery report for IR row view dispatch
4f1ff6aa6 fix(editor-v2): picker resolves metaclass by id + dup-metamodel warning
1c362391c docs: add console verdict (section 9) to ir feature picker discovery
04592e8e0 feat(editor-v2): add "Reset size" node context-menu action
```

HEAD = R2 come atteso. **Nessun commit della shape WIP nel log** (il piu' recente
resize-adiacente, `04592e8e0` "Reset size", e' un'azione di context-menu distinta, non il
free-resize di seguito).

`git status --porcelain` (tree completo, shape WIP **+ R3**):

```
 M frontend/src/components/editor-v2/nodes/ClassNode.tsx              [shape WIP]
 M frontend/src/components/editor-v2/nodes/EnumNode.tsx               [shape WIP]
 M frontend/src/components/editor-v2/nodes/ObjectNode.tsx             [shape WIP]
 M frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx            [R3]
 M frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx [R3]
 M frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx     [shape WIP]
 M frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx   [shape WIP]
 M frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts          [shape WIP]
 M frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts          [shape WIP]
 M frontend/src/components/editors/views/ViewData.tsx                 [R3]
?? docs/discovery/discovery_2026-07-24_shape_node_min_resize.md       [shape WIP — doc filone A]
?? docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md       [shape WIP — doc filone B]
?? frontend/src/components/editor-v2/nodes/nodeSizing.ts              [shape WIP — nuovo]
?? frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx        [R3 — nuovo]
?? frontend/src/components/editor-v2/viewpoint/authoring/__tests__/                   [R3 — nuovo]
```

**Correzione alla premessa del prompt.** Il prompt elencava "~7 file (ClassNode, EnumNode,
ObjectNode, VertexAuthoringPanel, IRNodeContent, irStyle, nodeSizing)". La shape WIP reale
tocca **7 file tracked modificati** (i sei elencati **+ `irTypes.ts`**, che il prompt
ometteva) **+ `nodeSizing.ts` nuovo (untracked)** **+ 2 discovery doc untracked**. `irTypes.ts`
e' parte integrante della shape WIP (estende `ShapeForm`), non un file estraneo.

`git diff --stat` (shape WIP soltanto; le righe R3 sono escluse da questa tabella):

```
 nodes/ClassNode.tsx                          | 33 +++--
 nodes/EnumNode.tsx                           | 17 ++-
 nodes/ObjectNode.tsx                         | 39 ++++--
 viewpoint/authoring/VertexAuthoringPanel.tsx |  2 +
 viewpoint/ir/IRNodeContent.tsx               | 29 +++-
 viewpoint/ir/irStyle.ts                      | 28 +++-
 viewpoint/ir/irTypes.ts                      |  2 +-
```

## 2. Tabella per-file (shape WIP)

| File | Path completo | Natura del diff (1 riga) | Filone | Completo? |
|------|---------------|--------------------------|--------|-----------|
| nodeSizing.ts (NEW) | `frontend/src/components/editor-v2/nodes/nodeSizing.ts` | Nuovo modulo: `NodeSizing`/`NODE_SIZING_DEFAULTS`/`SHAPE_MIN_SIZE`(=24)/`isNodeResizable(type, hasGeometricShape)` — specchio temporaneo dei flag adaptWidth/adaptHeight per tipo nodo | **A** (min-resize) | completo |
| ObjectNode.tsx | `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | Import `isNodeResizable`/`SHAPE_MIN_SIZE`; ramo IR: `shapeForm`+`hasGeometricShape` (ellipse\|circle\|diamond) gate del resizer con `minWidth/Height=SHAPE_MIN_SIZE` e `keepAspectRatio` per circle; ramo nativo: gate `isNodeResizable('objectNode')` (min 140/40 invariati) | **A + B** (condiviso) | completo |
| ClassNode.tsx | `frontend/src/components/editor-v2/nodes/ClassNode.tsx` | Import `isNodeResizable`; gate `isNodeResizable('classNode')` su ENTRAMBI i NodeResizer (ramo jsxString e ramo abstract), minimi invariati | **A** | completo |
| EnumNode.tsx | `frontend/src/components/editor-v2/nodes/EnumNode.tsx` | Import `isNodeResizable`; gate `isNodeResizable('enumNode')` sull'unico NodeResizer, minimi invariati | **A** | completo |
| irStyle.ts | `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` | Ellipse free-resize (`min-width/height:0` + wrapper `:has(...ellipse){width/height:100%}`) **[A]**; regole `ir-shape--circle` (aspect-ratio 1/1) e `ir-shape--diamond` (box soppresso, `.ir-diamond-svg` absolute, z-index) **[B]** | **A + B** (condiviso) | completo |
| irTypes.ts | `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | `ShapeForm` esteso: `'rect'\|'rounded'\|'ellipse'` → `+ 'circle' \| 'diamond'` | **B** | completo |
| IRNodeContent.tsx | `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | `isDiamond`: sopprime fill/border inline per diamond; renderizza `<svg className="ir-diamond-svg">` con `<polygon points="50,0 100,50 50,100 0,50">` fill/stroke/dash risolti, `non-scaling-stroke` | **B** | completo |
| VertexAuthoringPanel.tsx | `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | `FORM_OPTIONS += { circle }, { diamond }` (2 righe): l'authoring puo' selezionare le nuove shape | **B** | completo |

Tutti gli hunk risultano **coerenti e completi** (nessun half-edit): import presenti,
branch chiusi, CSS e SVG autoconsistenti, tipo `ShapeForm` allineato tra schema (irTypes),
render (IRNodeContent), stile (irStyle), authoring (VertexAuthoringPanel) e gate (ObjectNode).

## 3. Deep-dive sulle due anomalie

### VertexAuthoringPanel (fuori scope del prompt shape/resize del 24/07)
Diff completo = **2 righe**: aggiunta di `{ value: 'circle', label: 'Circle' }` e
`{ value: 'diamond', label: 'Diamond' }` a `FORM_OPTIONS` (l'array che popola il `Select`
"Shape" nel tab Basic). Nessun riferimento a feature-picker, by-name/by-id, matching,
`classNames`, compartment. **Non e' un residuo del task feature-picker ne' uno sforamento
del task resize**: e' l'**authoring del filone B (circle/diamond)** — senza queste due
opzioni non si potrebbe autorare una view con shape circle/diamond. Il prompt del task
resize (filone A) lo escludeva legittimamente perche' A non introduce nuove shape; B si'.
Diff **coerente e completo**.

### IRNodeContent (fuori dallo scope "SCSS-only" del task resize)
Diff = renderer SVG del diamond: gate `isDiamond`, soppressione dell'inline
`background`/`border` per diamond (altrimenti il box quadrato vincerebbe sulla
soppressione CSS di `irStyle.ts` e mostrerebbe un quadrato dietro il rombo), e un layer
`<svg>` con `<polygon>` che dipinge lo stesso fill/border risolto (fallback al box-base).
E' il **companion di rendering del filone B**: la CSS di `irStyle.ts` sopprime il box e
posiziona `.ir-diamond-svg`; questo file lo disegna. Non e' SCSS-only perche' il rombo
richiede geometria SVG, non ottenibile con solo border-radius. Diff **coerente e completo**.

**Verdetto anomalie**: entrambe appartengono al **filone B (circle/diamond)**, che e' un
filone **distinto ma impilato** su A. Nessuna delle due e' un filone estraneo/ignoto.

## 4. Segnali di provenienza

- `docs/discovery/discovery_2026-07-24_shape_node_min_resize.md` — **PRESENTE** (untracked).
  E' il discovery del **filone A**.
- `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md` — **PRESENTE** (untracked).
  E' il discovery del **filone B**.
- `docs/claude-code-log.md` — **entry PRESENTE** per il filone A: riga 34,
  `## 2026-07-24 — fix(editor-v2): free-resize shape nodes (ellipse IR) below label +
  content-hug text cards` (prompt doc `2026-07-24 fase2_resize_shape_nodes_ir_ellipse`).
  I suoi "Files touched" = nodeSizing/ObjectNode/ClassNode/EnumNode/irStyle + il doc A;
  dichiara `hasGeometricShape = form==='ellipse'` (solo ellipse) e "Out-of-scope: no",
  con **VertexAuthoringPanel esplicitamente NON toccato**.
- **Nessuna entry di log per il filone B** (circle/diamond).

**Interpretazione.** Il filone A e' stato eseguito (report + entry di log scritti) ma
**mai committato** (HARD STOP prima del commit; nessun hash in `git log`). Il filone B e'
stato eseguito **dopo**, impilato su A negli stessi file `ObjectNode.tsx`/`irStyle.ts` +
i suoi file propri (irTypes/IRNodeContent/VertexAuthoringPanel), con il suo discovery doc
ma **senza entry di log e senza commit**. Il codice corrente riflette **A+B insieme**
(es. `hasGeometricShape` ora include circle/diamond, non solo ellipse come dice l'entry A):
la entry di log di A **descrive uno stato anteriore** a quello attuale del tree.

## 5. Esito build

`npm run build` sull'intero tree (shape WIP **+ R3**): **PASS** — `vite build` exit 0,
solo il warning pre-esistente di chunk-size (>500 kB). `npm run typecheck`: **33 errori =
baseline** noto (casing `Settings/settings` + `Dashboard.tsx`), nessuno nei file shape o R3.

**Caveat**: la build include anche R3 (disgiunta). Un build shape-WIP-**only** richiederebbe
di stashare/rimuovere R3, operazione **vietata** in questa sessione. Poiche' i due set sono
file-disgiunti e la build combinata e' verde, la shape WIP compila; la separazione formale
del build resta non isolabile senza mutazioni.

## 6. Conclusione

**Non e' un solo filone.** Sono **due filoni shape impilati**:

- **Filone A — `shape_node_min_resize`** (free-resize / content-hug):
  `nodeSizing.ts` (nuovo) + gate `isNodeResizable(...)` in ObjectNode/ClassNode/EnumNode +
  regole ellipse (`min:0`, wrapper `100%`) in irStyle. **Ha report + entry di log.**
- **Filone B — `shapes_circle_diamond`** (impilato su A):
  `irTypes` ShapeForm+circle/diamond + irStyle circle/diamond + IRNodeContent diamond SVG +
  VertexAuthoringPanel FORM_OPTIONS + ObjectNode (hasGeometricShape esteso, keepAspectRatio
  circle). **Ha report, MA nessuna entry di log e nessun commit.**

**Ostacolo allo split per-file**: A e B **condividono** `ObjectNode.tsx` e `irStyle.ts`
(entrambi editati da tutti e due). Uno split pulito A-only richiederebbe **staging per-hunk**
(o revert delle aggiunte di B in quei due file) — non separabile per file.

**Proposte di split** (nessuna eseguita qui):
1. **Un commit unico "shape nodes: free-resize + circle/diamond"** (A+B insieme). Piu'
   semplice; coerente col fatto che il tree corrente e' A+B e la build e' verde insieme.
   Serve una entry di log che copra anche B e riconcili la entry A (che descrive lo stato
   ellipse-only anteriore).
2. **Due commit sequenziali A poi B**, con staging per-hunk di `ObjectNode.tsx` e
   `irStyle.ts` (A = solo ellipse/gate; B = circle/diamond/keepAspectRatio/SVG). Piu'
   pulito nella storia ma richiede hunk-splitting manuale sui due file condivisi.

In entrambi i casi: **niente `git add .`** (rule 17); commit tematici; per lo split A/B
usare `git add -p`. **Nessun file gia' allineato a HEAD** (tutti gli hunk sono reali).

## 7. R3 in-tree e disgiunta (fuori shape WIP)

R3 (implementata in questa sessione, non committata, in attesa di verifica visiva) tocca un
set **file-disgiunto** dalla shape WIP:

```
 M  authoring/EnableIRPanel.tsx
 M  authoring/FieldCompartmentListEditor.tsx
 M  editors/views/ViewData.tsx
 ?? authoring/RowAuthoringPanel.tsx
 ?? authoring/__tests__/rowAuthoring.test.ts
```

**Zero sovrapposizione** con i file shape. In particolare R3 **non ha toccato**
`VertexAuthoringPanel.tsx` (la modifica R3 prevista li' non e' servita: `classNames` era gia'
passato al compartment editor). La preoccupazione originale del triage ("R3 sta per costruire
sopra il WIP di VertexAuthoringPanel") e' quindi **superata**: R3 e la shape WIP coesistono
in modo pulito e committabili separatamente. R3 resta **non committata** fino alla conferma
della verifica visiva di Alfonso.

## 8. Domande aperte per Alfonso

- **Split A/B**: commit unico (proposta 1) o due commit con hunk-splitting su
  ObjectNode/irStyle (proposta 2)?
- **Entry di log del filone A**: descrive lo stato ellipse-only anteriore; il codice ora e'
  ellipse+circle+diamond. Riconciliare la entry esistente o sostituirla/aggiungerne una per B
  al momento del commit?
- **Filone B senza entry di log**: scriverne una al commit?
- **Ordine di commit** rispetto a R3 (disgiunta, pending verifica visiva): shape prima o R3
  prima? (Nessuna dipendenza tecnica tra i due.)
- **Persisted geometry** (follow-up gia' notato nell'entry A: object shape ridimensionato a
  mano perde la size al reload perche' objectNode non legge raw.w/h): resta fuori scope qui.

## Riferimenti

- Prompt shape/resize (filone A): `2026-07-24 fase2_resize_shape_nodes_ir_ellipse`
  (entry log riga 34), discovery `discovery_2026-07-24_shape_node_min_resize.md`.
- Filone B: discovery `discovery_2026-07-24_shapes_circle_diamond.md` (no log, no commit).
- Prior art shape: `discovery_2026-07-22_ir_shape_css.md`,
  `discovery_2026-07-23_classic_node_resize_sizing.md`.
- R3 (disgiunta): prompt `2026-07-25 fase_R3_row_authoring_preserve`.
- Commit di riferimento: `d12a54aa0` (R2), `8a650833b` (R1).
```
